import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { apiError } from '../common/api-error';
import { Env } from '../config/env';
import { PrismaService } from '../infra/prisma.service';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  typ: 'access';
}

interface RegistrationTokenPayload {
  phone: string;
  typ: 'registration';
}

export interface SessionContext {
  userAgent?: string;
  ipAddress?: string;
}

const REGISTRATION_TOKEN_TTL_SECONDS = 15 * 60;
/**
 * Two browser tabs (or a retry after a dropped response) can present the same refresh token at nearly the
 * same time. A token rotated less than this long ago is treated as a benign race, not as theft.
 */
const REUSE_GRACE_MS = 30_000;

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  get accessTokenTtlSeconds(): number {
    return this.config.get('ACCESS_TOKEN_TTL_SECONDS', { infer: true });
  }

  get refreshTokenTtlMs(): number {
    return this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) * 86_400_000;
  }

  // --- Access token (short-lived JWT, kept in memory by clients) ---------------

  signAccessToken(userId: string, role: UserRole): string {
    const payload: AccessTokenPayload = { sub: userId, role, typ: 'access' };
    return this.jwt.sign(payload, { expiresIn: this.accessTokenTtlSeconds });
  }

  /** Returns null for anything that is not a valid, unexpired access token. */
  verifyAccessToken(token: string): AccessTokenPayload | null {
    try {
      const payload = this.jwt.verify<AccessTokenPayload>(token);
      return payload.typ === 'access' ? payload : null;
    } catch {
      return null;
    }
  }

  // --- Registration token (proves a phone was verified by OTP) ---------------

  signRegistrationToken(phone: string): string {
    const payload: RegistrationTokenPayload = { phone, typ: 'registration' };
    return this.jwt.sign(payload, { expiresIn: REGISTRATION_TOKEN_TTL_SECONDS });
  }

  verifyRegistrationToken(token: string): string {
    try {
      const payload = this.jwt.verify<RegistrationTokenPayload>(token);
      if (payload.typ === 'registration' && payload.phone) return payload.phone;
    } catch {
      /* fall through */
    }
    throw apiError(
      HttpStatus.UNAUTHORIZED,
      'REGISTRATION_TOKEN_INVALID',
      'Your verification has expired. Please verify your phone number again.',
    );
  }

  // --- Refresh tokens (opaque, rotating, stored as a hash) -------------------

  /** Starts a new login session (a new rotation family) and returns its refresh token. */
  async createSession(userId: string, ctx: SessionContext): Promise<string> {
    return this.insertSession(userId, randomUUID(), ctx);
  }

  /**
   * Exchanges a refresh token for a new one. Using an already-rotated token means it was copied,
   * so the whole family (every device token from that login) is revoked.
   */
  async rotateSession(
    refreshToken: string,
    ctx: SessionContext,
  ): Promise<{ userId: string; refreshToken: string }> {
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: this.hash(refreshToken) },
    });
    if (!session) throw this.sessionInvalid();

    if (session.expiresAt.getTime() <= Date.now()) throw this.sessionInvalid();
    if (session.revokedAt || session.replacedById) {
      const rotatedRecently =
        session.replacedById &&
        session.revokedAt &&
        Date.now() - session.revokedAt.getTime() < REUSE_GRACE_MS;
      const familyStillActive = await this.prisma.authSession.count({
        where: { familyId: session.familyId, revokedAt: null },
      });
      if (rotatedRecently && familyStillActive > 0) {
        // Benign race: give this caller its own fresh token in the same family.
        return {
          userId: session.userId,
          refreshToken: await this.insertSession(session.userId, session.familyId, ctx),
        };
      }
      await this.revokeFamily(session.familyId);
      throw this.sessionInvalid();
    }

    const newToken = randomBytes(32).toString('base64url');
    const newId = randomUUID();
    await this.prisma.$transaction(async (tx) => {
      // Conditional update guards against two concurrent refreshes with the same token.
      const claimed = await tx.authSession.updateMany({
        where: { id: session.id, revokedAt: null, replacedById: null },
        data: { revokedAt: new Date(), replacedById: newId },
      });
      if (claimed.count !== 1) throw this.sessionInvalid();
      await tx.authSession.create({
        data: {
          id: newId,
          userId: session.userId,
          familyId: session.familyId,
          tokenHash: this.hash(newToken),
          userAgent: ctx.userAgent?.slice(0, 300),
          ipAddress: ctx.ipAddress,
          expiresAt: new Date(Date.now() + this.refreshTokenTtlMs),
        },
      });
    });
    return { userId: session.userId, refreshToken: newToken };
  }

  /** Logout: revokes the session family of this refresh token (no error if unknown). */
  async revokeSession(refreshToken: string): Promise<void> {
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: this.hash(refreshToken) },
    });
    if (session) await this.revokeFamily(session.familyId);
  }

  /** Signs the user out everywhere (used when an admin blocks an account). */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async insertSession(userId: string, familyId: string, ctx: SessionContext): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    await this.prisma.authSession.create({
      data: {
        userId,
        familyId,
        tokenHash: this.hash(token),
        userAgent: ctx.userAgent?.slice(0, 300),
        ipAddress: ctx.ipAddress,
        expiresAt: new Date(Date.now() + this.refreshTokenTtlMs),
      },
    });
    return token;
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private sessionInvalid() {
    return apiError(
      HttpStatus.UNAUTHORIZED,
      'SESSION_INVALID',
      'Your session has ended. Please log in again.',
    );
  }
}
