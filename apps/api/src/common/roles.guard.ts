import { SetMetadata, CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

export type UserRole = 'NORMAL' | 'CELEBRITY' | 'ORG' | 'SUPPORT' | 'SUPER_ADMIN';

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
  status: 'ACTIVE' | 'BLOCKED' | 'RESTRICTED' | 'SUSPENDED';
  restrictions: UserRestrictions;
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesAndRestrictionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) {
      return true; // Handled by Auth middleware/header parser in demo/prod
    }

    if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
      throw new ForbiddenException(
        `Your account is currently ${user.status}. Please contact Customer Care Support.`,
      );
    }

    const requiredRoles: UserRole[] = Reflect.getMetadata(ROLES_KEY, context.getHandler()) || [];
    if (requiredRoles.length === 0) {
      return true;
    }

    if (user.role === 'SUPER_ADMIN' || requiredRoles.includes(user.role)) {
      return true;
    }

    throw new ForbiddenException(`Access denied. Required role: ${requiredRoles.join(' or ')}`);
  }
}
