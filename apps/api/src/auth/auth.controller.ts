import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  LoggedInResponse,
  OtpRequestResponse,
  OtpVerifyResponse,
  UserDto,
} from '@friends-connect/contracts';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { ApplicationsService } from '../applications/applications.service';
import { celebrityDetailsSchema, orgDetailsSchema } from '../applications/application.schemas';
import { apiError } from '../common/api-error';
import type { AuthenticatedUser } from '../common/roles.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { Env } from '../config/env';
import { PrismaService } from '../infra/prisma.service';
import { toUserDto } from '../users/user-dto';
import { CurrentUser } from './current-user.decorator';
import { OTP_RESEND_AFTER_SECONDS, OTP_TTL_SECONDS, OtpService } from './otp.service';
import { normalizePhone } from './phone';
import { Public } from './public.decorator';
import { SessionContext, TokenService } from './token.service';

export const REFRESH_COOKIE = 'fc_refresh';
const REFRESH_COOKIE_PATH = '/api/auth';

const phoneBody = z.object({ phone: z.string().min(5).max(30) });
const verifyBody = phoneBody.extend({ code: z.string().regex(/^\d{6}$/, 'must be 6 digits') });
const displayName = z.string().trim().min(2).max(60);
const registerBody = z.discriminatedUnion('accountType', [
  z.object({ registrationToken: z.string(), displayName, accountType: z.literal('NORMAL') }),
  z.object({
    registrationToken: z.string(),
    displayName,
    accountType: z.literal('CELEBRITY'),
    application: celebrityDetailsSchema,
  }),
  z.object({
    registrationToken: z.string(),
    displayName,
    accountType: z.literal('ORG'),
    application: orgDetailsSchema,
  }),
]);
const refreshBody = z.object({ refreshToken: z.string().optional() }).optional();

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
    private readonly prisma: PrismaService,
    private readonly applications: ApplicationsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  async requestOtp(
    @Body(new ZodValidationPipe(phoneBody)) body: z.infer<typeof phoneBody>,
    @Req() req: Request,
  ): Promise<OtpRequestResponse> {
    const phone = this.normalize(body.phone);
    await this.otp.request(phone, req.ip ?? 'unknown');
    return { phone, expiresInSeconds: OTP_TTL_SECONDS, resendAfterSeconds: OTP_RESEND_AFTER_SECONDS };
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body(new ZodValidationPipe(verifyBody)) body: z.infer<typeof verifyBody>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OtpVerifyResponse> {
    const phone = this.normalize(body.phone);
    await this.otp.verify(phone, body.code);

    const user = await this.prisma.user.findUnique({ where: { phoneNumber: phone } });
    if (!user) {
      return {
        status: 'NEEDS_REGISTRATION',
        phone,
        registrationToken: this.tokens.signRegistrationToken(phone),
      };
    }
    if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
      throw apiError(
        HttpStatus.FORBIDDEN,
        'ACCOUNT_BLOCKED',
        `Your account is ${user.status.toLowerCase()}. Please contact Customer Care.`,
      );
    }
    return this.logIn(user.id, req, res);
  }

  @Public()
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerBody)) body: z.infer<typeof registerBody>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoggedInResponse> {
    const phone = this.tokens.verifyRegistrationToken(body.registrationToken);

    let userId: string;
    try {
      userId = await this.prisma.$transaction(async (tx) => {
        // Everyone starts as NORMAL; celebrity/organizer roles are granted only by admin approval.
        const user = await tx.user.create({
          data: { phoneNumber: phone, displayName: body.displayName, role: 'NORMAL', wallet: { create: {} } },
        });
        if (body.accountType === 'CELEBRITY') {
          await this.applications.apply(
            user.id,
            { requestedRole: 'CELEBRITY', details: body.application },
            tx,
          );
        } else if (body.accountType === 'ORG') {
          await this.applications.apply(user.id, { requestedRole: 'ORG', details: body.application }, tx);
        }
        return user.id;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw apiError(
          HttpStatus.CONFLICT,
          'ALREADY_REGISTERED',
          'This phone number is already registered. Log in instead.',
        );
      }
      throw e;
    }
    return this.logIn(userId, req, res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(refreshBody)) body: z.infer<typeof refreshBody>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoggedInResponse> {
    const presented = this.readRefreshToken(req, body?.refreshToken);
    if (!presented) {
      throw apiError(HttpStatus.UNAUTHORIZED, 'SESSION_INVALID', 'Please log in.');
    }
    let rotated: { userId: string; refreshToken: string };
    try {
      rotated = await this.tokens.rotateSession(presented, this.sessionContext(req));
    } catch (e) {
      this.clearRefreshCookie(res);
      throw e;
    }

    const user = await this.prisma.user.findUnique({ where: { id: rotated.userId } });
    if (!user || user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
      await this.tokens.revokeSession(rotated.refreshToken);
      this.clearRefreshCookie(res);
      throw apiError(
        HttpStatus.FORBIDDEN,
        'ACCOUNT_BLOCKED',
        'Your account is not active. Please contact Customer Care.',
      );
    }
    return this.buildLoggedIn(user.id, rotated.refreshToken, req, res);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Body(new ZodValidationPipe(refreshBody)) body: z.infer<typeof refreshBody>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const presented = this.readRefreshToken(req, body?.refreshToken);
    if (presented) await this.tokens.revokeSession(presented);
    this.clearRefreshCookie(res);
  }

  @Get('me')
  async me(@CurrentUser() current: AuthenticatedUser): Promise<UserDto> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: current.id } });
    return toUserDto(user, await this.applications.latestForUser(user.id));
  }

  // --- helpers ---------------------------------------------------------------

  private normalize(phone: string): string {
    return normalizePhone(phone, this.config.get('DEFAULT_PHONE_REGION', { infer: true }));
  }

  private async logIn(userId: string, req: Request, res: Response): Promise<LoggedInResponse> {
    const refreshToken = await this.tokens.createSession(userId, this.sessionContext(req));
    return this.buildLoggedIn(userId, refreshToken, req, res);
  }

  private async buildLoggedIn(
    userId: string,
    refreshToken: string,
    req: Request,
    res: Response,
  ): Promise<LoggedInResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const response: LoggedInResponse = {
      status: 'LOGGED_IN',
      accessToken: this.tokens.signAccessToken(user.id, user.role),
      accessTokenExpiresIn: this.tokens.accessTokenTtlSeconds,
      user: toUserDto(user, await this.applications.latestForUser(user.id)),
    };
    if (this.isMobile(req)) {
      response.refreshToken = refreshToken;
    } else {
      res.cookie(REFRESH_COOKIE, refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: this.config.get('COOKIE_SECURE', { infer: true }),
        path: REFRESH_COOKIE_PATH,
        maxAge: this.tokens.refreshTokenTtlMs,
      });
    }
    return response;
  }

  private readRefreshToken(req: Request, fromBody?: string): string | undefined {
    return fromBody || (req.cookies?.[REFRESH_COOKIE] as string | undefined);
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
  }

  private isMobile(req: Request): boolean {
    return String(req.headers['x-client'] ?? '').toLowerCase() === 'mobile';
  }

  private sessionContext(req: Request): SessionContext {
    return { userAgent: req.headers['user-agent'], ipAddress: req.ip };
  }
}
