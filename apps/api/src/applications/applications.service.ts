import { ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, Prisma, RoleApplication } from '@prisma/client';
import { apiError } from '../common/api-error';
import { PrismaService } from '../infra/prisma.service';
import { ApplyInput } from './application.schemas';

type Tx = Prisma.TransactionClient;

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The pending application if there is one, otherwise the most recently reviewed one. */
  async latestForUser(userId: string, db: Tx | PrismaService = this.prisma): Promise<RoleApplication | null> {
    const pending = await db.roleApplication.findFirst({ where: { userId, status: 'PENDING' } });
    if (pending) return pending;
    return db.roleApplication.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  /**
   * Creates a pending application. Only normal users can apply, and only one pending application is allowed.
   * Pass `tx` to create it inside the caller's transaction (used by registration).
   */
  async apply(userId: string, input: ApplyInput, tx?: Tx): Promise<RoleApplication> {
    const run = async (db: Tx) => {
      // Lock the user row so two simultaneous requests can't both create a pending application.
      const [user] = await db.$queryRaw<
        { role: string }[]
      >`SELECT role FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      if (!user) throw new NotFoundException('User not found');
      if (user.role !== 'NORMAL') {
        throw new ConflictException(
          'Only normal user accounts can apply to become a celebrity or organizer.',
        );
      }
      const pending = await db.roleApplication.findFirst({ where: { userId, status: 'PENDING' } });
      if (pending) {
        throw apiError(
          HttpStatus.CONFLICT,
          'APPLICATION_ALREADY_PENDING',
          'You already have an application under review.',
        );
      }
      return db.roleApplication.create({
        data: {
          userId,
          requestedRole: input.requestedRole,
          details: input.details as Prisma.InputJsonValue,
        },
      });
    };
    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  list(status?: ApplicationStatus) {
    return this.prisma.roleApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: status === 'PENDING' ? 'asc' : 'desc' },
      include: { user: { select: { id: true, phoneNumber: true, displayName: true } } },
      take: 200,
    });
  }

  /** Approve: role change + profile creation + application update happen together or not at all. */
  async approve(applicationId: string, adminId: string, note?: string): Promise<RoleApplication> {
    return this.prisma.$transaction(async (tx) => {
      const app = await this.claimPending(tx, applicationId, 'APPROVED', adminId, note);
      const details = app.details as Record<string, string | undefined>;

      if (app.requestedRole === 'CELEBRITY') {
        const profile = { category: details.category ?? '', bio: details.bio ?? '', isVerified: true };
        await tx.celebrityProfile.upsert({
          where: { userId: app.userId },
          update: profile,
          create: { userId: app.userId, ...profile },
        });
      } else {
        const profile = {
          companyName: details.companyName ?? '',
          registrationNo: details.registrationNo ?? '',
          websiteUrl: details.websiteUrl ?? null,
          isVerified: true,
        };
        await tx.organizationProfile.upsert({
          where: { userId: app.userId },
          update: profile,
          create: { userId: app.userId, ...profile },
        });
      }
      await tx.user.update({ where: { id: app.userId }, data: { role: app.requestedRole } });
      return app;
    });
  }

  async reject(applicationId: string, adminId: string, note?: string): Promise<RoleApplication> {
    return this.prisma.$transaction((tx) => this.claimPending(tx, applicationId, 'REJECTED', adminId, note));
  }

  /** Moves a PENDING application to its final state; fails if someone else already reviewed it. */
  private async claimPending(
    tx: Tx,
    applicationId: string,
    status: 'APPROVED' | 'REJECTED',
    adminId: string,
    note?: string,
  ): Promise<RoleApplication> {
    const claimed = await tx.roleApplication.updateMany({
      where: { id: applicationId, status: 'PENDING' },
      data: { status, reviewedById: adminId, reviewedAt: new Date(), reviewNote: note || null },
    });
    if (claimed.count !== 1) {
      const exists = await tx.roleApplication.findUnique({ where: { id: applicationId } });
      if (!exists) throw new NotFoundException('Application not found');
      throw new ConflictException(`This application was already ${exists.status.toLowerCase()}.`);
    }
    return tx.roleApplication.findUniqueOrThrow({ where: { id: applicationId } });
  }
}
