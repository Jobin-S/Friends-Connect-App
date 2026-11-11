import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AdminApplicationDto } from '@friends-connect/contracts';
import { ApplicationStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { ApplicationsService } from '../applications/applications.service';
import { reviewBodySchema } from '../applications/application.schemas';
import { CurrentUser } from '../auth/current-user.decorator';
import { normalizePhone } from '../auth/phone';
import { TokenService } from '../auth/token.service';
import { apiError } from '../common/api-error';
import { AuthenticatedUser, Roles } from '../common/roles.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { Env } from '../config/env';
import { PrismaService } from '../infra/prisma.service';
import { toApplicationDto } from '../users/user-dto';

const statusQuery = z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional();
const supportAgentBody = z.object({
  phone: z.string().min(5).max(30),
  displayName: z.string().trim().min(2).max(60),
});
const userStatusBody = z.object({
  status: z.enum(['ACTIVE', 'BLOCKED', 'RESTRICTED', 'SUSPENDED']),
});
const restrictionsBody = z.object({
  canRandomAudio: z.boolean().optional(),
  canRandomVideo: z.boolean().optional(),
  canCallCelebrities: z.boolean().optional(),
  maxCallsPerDay: z.number().int().min(0).max(1000).optional(),
});

const userSummary = {
  id: true,
  phoneNumber: true,
  displayName: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

@Roles('SUPER_ADMIN')
@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applications: ApplicationsService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get('overview')
  async overview() {
    const [totalUsers, byRole, pendingApplications, openSupportTickets, publishedEvents] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      this.prisma.roleApplication.count({ where: { status: 'PENDING' } }),
      this.prisma.supportTicket.count({ where: { status: { not: 'RESOLVED' } } }),
      this.prisma.event.count({ where: { status: 'PUBLISHED' } }),
    ]);
    return {
      totalUsers,
      usersByRole: Object.fromEntries(byRole.map((r) => [r.role, r._count._all])),
      pendingApplications,
      openSupportTickets,
      publishedEvents,
    };
  }

  // --- Celebrity / organizer applications ---------------------------------------

  @Get('applications')
  async listApplications(
    @Query('status', new ZodValidationPipe(statusQuery)) status?: ApplicationStatus,
  ): Promise<AdminApplicationDto[]> {
    const apps = await this.applications.list(status);
    return apps.map((a) => ({ ...toApplicationDto(a), user: a.user }));
  }

  @Post('applications/:id/approve')
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body(new ZodValidationPipe(reviewBodySchema)) body: z.infer<typeof reviewBodySchema>,
  ) {
    return toApplicationDto(await this.applications.approve(id, admin.id, body.note));
  }

  @Post('applications/:id/reject')
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body(new ZodValidationPipe(reviewBodySchema)) body: z.infer<typeof reviewBodySchema>,
  ) {
    return toApplicationDto(await this.applications.reject(id, admin.id, body.note));
  }

  // --- Customer Care agents (only the admin can create them) ---------------------

  @Get('support-agents')
  listSupportAgents() {
    return this.prisma.user.findMany({
      where: { role: 'SUPPORT' },
      select: userSummary,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('support-agents')
  async createSupportAgent(
    @Body(new ZodValidationPipe(supportAgentBody)) body: z.infer<typeof supportAgentBody>,
  ) {
    const phone = normalizePhone(body.phone, this.config.get('DEFAULT_PHONE_REGION', { infer: true }));
    try {
      return await this.prisma.user.create({
        data: { phoneNumber: phone, displayName: body.displayName, role: 'SUPPORT', wallet: { create: {} } },
        select: userSummary,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw apiError(
          HttpStatus.CONFLICT,
          'ALREADY_REGISTERED',
          'This phone number already has an account. Use a different number for the agent.',
        );
      }
      throw e;
    }
  }

  // --- User moderation ---------------------------------------------------------------

  @Get('users')
  listUsers(@Query('q') q?: string) {
    const search = q?.trim();
    return this.prisma.user.findMany({
      where: search
        ? {
            OR: [
              { displayName: { contains: search, mode: 'insensitive' } },
              { phoneNumber: { contains: search } },
            ],
          }
        : undefined,
      select: userSummary,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Patch('users/:userId/status')
  async setUserStatus(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body(new ZodValidationPipe(userStatusBody)) body: z.infer<typeof userStatusBody>,
  ) {
    if (userId === admin.id) {
      throw new BadRequestException('You cannot change the status of your own account.');
    }
    const user = await this.prisma.user
      .update({
        where: { id: userId },
        data: { status: body.status },
        select: userSummary,
      })
      .catch(() => {
        throw new NotFoundException('User not found');
      });
    if (body.status === 'BLOCKED' || body.status === 'SUSPENDED') {
      await this.tokens.revokeAllForUser(userId);
    }
    return user;
  }

  @Patch('users/:userId/restrictions')
  async setRestrictions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body(new ZodValidationPipe(restrictionsBody)) body: z.infer<typeof restrictionsBody>,
  ) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundException('User not found');
    const restrictions = { ...((existing.restrictions as object) ?? {}), ...body };
    return this.prisma.user.update({
      where: { id: userId },
      data: { restrictions },
      select: { ...userSummary, restrictions: true },
    });
  }
}
