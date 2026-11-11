import { Body, Controller, Get, Post } from '@nestjs/common';
import type { RoleApplicationDto } from '@friends-connect/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../common/roles.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { toApplicationDto } from '../users/user-dto';
import { ApplyInput, applyBodySchema } from './application.schemas';
import { ApplicationsService } from './applications.service';

/** A logged-in normal user applying to become a celebrity or event organizer. */
@Controller('api/me/applications')
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get('latest')
  async latest(@CurrentUser() user: AuthenticatedUser): Promise<RoleApplicationDto | null> {
    const app = await this.applications.latestForUser(user.id);
    return app ? toApplicationDto(app) : null;
  }

  @Post()
  async apply(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(applyBodySchema)) body: ApplyInput,
  ): Promise<RoleApplicationDto> {
    return toApplicationDto(await this.applications.apply(user.id, body));
  }
}
