import type { Gender, Interest, RoleApplicationDto, UserDto } from '@friends-connect/contracts';
import { RoleApplication, User } from '@prisma/client';

export function toApplicationDto(app: RoleApplication): RoleApplicationDto {
  return {
    id: app.id,
    requestedRole: app.requestedRole,
    status: app.status,
    details: app.details as unknown as RoleApplicationDto['details'],
    reviewNote: app.reviewNote,
    createdAt: app.createdAt.toISOString(),
    reviewedAt: app.reviewedAt?.toISOString() ?? null,
  };
}

export function toUserDto(user: User, latestApplication: RoleApplication | null): UserDto {
  return {
    id: user.id,
    phoneNumber: user.phoneNumber,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    city: user.city,
    // @db.Date comes back as midnight UTC; keep only the date part.
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : null,
    gender: user.gender as Gender | null,
    interests: user.interests as Interest[],
    bio: user.bio,
    latestApplication: latestApplication ? toApplicationDto(latestApplication) : null,
  };
}
