import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/roles.guard';

/** Injects the logged-in user (loaded fresh from the database by JwtAuthGuard). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => ctx.switchToHttp().getRequest().user,
);
