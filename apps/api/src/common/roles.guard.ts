import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AccountStatus, UserRole } from '@friends-connect/contracts';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';

export type { UserRole };

export interface UserRestrictions {
  canRandomAudio: boolean;
  canRandomVideo: boolean;
  canCallCelebrities: boolean;
  maxCallsPerDay: number;
}

export interface AuthenticatedUser {
  id: string;
  phoneNumber: string;
  role: UserRole;
  displayName: string;
  status: AccountStatus;
  restrictions: UserRestrictions;
}

export const ROLES_KEY = 'roles';
/** Limits a route to the given roles. SUPER_ADMIN always passes. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Global guard, runs after JwtAuthGuard. Enforces @Roles(); a non-public route without a user is denied. */
@Injectable()
export class RolesAndRestrictionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const user: AuthenticatedUser | undefined = context.switchToHttp().getRequest().user;
    if (!user) throw new ForbiddenException('Access denied.');

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, targets) ?? [];
    if (requiredRoles.length === 0 || user.role === 'SUPER_ADMIN' || requiredRoles.includes(user.role)) {
      return true;
    }
    throw new ForbiddenException(`Access denied. Required role: ${requiredRoles.join(' or ')}`);
  }
}
