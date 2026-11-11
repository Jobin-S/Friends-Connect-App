import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { AuthenticatedUser, UserRestrictions } from '../common/roles.guard';
import { PrismaService } from '../infra/prisma.service';

const DEFAULT_RESTRICTIONS: UserRestrictions = {
  canRandomAudio: true,
  canRandomVideo: true,
  canCallCelebrities: true,
  maxCallsPerDay: 100,
};

export function toAuthenticatedUser(user: User): AuthenticatedUser {
  const restrictions = (user.restrictions ?? {}) as Partial<UserRestrictions>;
  return {
    id: user.id,
    phoneNumber: user.phoneNumber,
    role: user.role,
    displayName: user.displayName,
    status: user.status,
    restrictions: { ...DEFAULT_RESTRICTIONS, ...restrictions },
  };
}

/** Loads the current user from the database, so blocks and role changes apply on the very next request. */
@Injectable()
export class UserLoaderService {
  constructor(private readonly prisma: PrismaService) {}

  async load(userId: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? toAuthenticatedUser(user) : null;
  }
}
