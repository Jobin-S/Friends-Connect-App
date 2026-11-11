import { Body, Controller, Patch } from '@nestjs/common';
import type { UserDto } from '@friends-connect/contracts';
import { z } from 'zod';
import { ApplicationsService } from '../applications/applications.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../common/roles.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { PrismaService } from '../infra/prisma.service';
import { updateProfileSchema } from './profile.schemas';
import { toUserDto } from './user-dto';

@Controller('api/users')
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applications: ApplicationsService,
  ) {}

  /** Edit your own profile. Only the fields sent are changed; `null` clears gender or bio. */
  @Patch('me')
  async updateMe(
    @CurrentUser() current: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: z.infer<typeof updateProfileSchema>,
  ): Promise<UserDto> {
    const user = await this.prisma.user.update({ where: { id: current.id }, data: body });
    return toUserDto(user, await this.applications.latestForUser(user.id));
  }
}
