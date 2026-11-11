import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { apiError } from '../common/api-error';
import { IS_PUBLIC_KEY } from './public.decorator';
import { TokenService } from './token.service';
import { UserLoaderService } from './user-loader.service';

/** Global guard: every HTTP route needs `Authorization: Bearer <access token>` unless marked @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly users: UserLoaderService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true; // sockets are authenticated at the handshake
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const payload = token ? this.tokens.verifyAccessToken(token) : null;
    if (!payload) {
      throw apiError(HttpStatus.UNAUTHORIZED, 'SESSION_INVALID', 'Please log in.');
    }

    const user = await this.users.load(payload.sub);
    if (!user) throw apiError(HttpStatus.UNAUTHORIZED, 'SESSION_INVALID', 'Please log in.');
    if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
      throw apiError(
        HttpStatus.FORBIDDEN,
        'ACCOUNT_BLOCKED',
        `Your account is ${user.status.toLowerCase()}. Please contact Customer Care.`,
      );
    }
    request.user = user;
    return true;
  }
}
