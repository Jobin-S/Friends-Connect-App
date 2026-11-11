import { Body, Controller, Get, Param, Patch, BadRequestException } from '@nestjs/common';
import { StoreService } from '../common/store.service';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly store: StoreService) {}

  @Get('overview')
  getOverview() {
    const users = Array.from(this.store.users.values());
    const celebrities = Array.from(this.store.celebrities.values());
    const events = Array.from(this.store.events.values());
    const tickets = Array.from(this.store.supportTickets.values());

    return {
      totalUsers: users.length,
      activeCelebrities: celebrities.length,
      publishedEvents: events.length,
      openSupportTickets: tickets.filter((t) => t.status !== 'RESOLVED').length,
      blockedPairCount: this.store.blockedPairs.size / 2,
      users,
    };
  }

  @Patch('users/:userId/moderation')
  moderateUser(
    @Param('userId') userId: string,
    @Body()
    body: {
      status?: 'ACTIVE' | 'BLOCKED' | 'RESTRICTED' | 'SUSPENDED';
      canRandomAudio?: boolean;
      canRandomVideo?: boolean;
      canCallCelebrities?: boolean;
      maxCallsPerDay?: number;
    },
  ) {
    const user = this.store.users.get(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (body.status) {
      user.status = body.status;
    }
    if (typeof body.canRandomAudio === 'boolean') {
      user.restrictions.canRandomAudio = body.canRandomAudio;
    }
    if (typeof body.canRandomVideo === 'boolean') {
      user.restrictions.canRandomVideo = body.canRandomVideo;
    }
    if (typeof body.canCallCelebrities === 'boolean') {
      user.restrictions.canCallCelebrities = body.canCallCelebrities;
    }
    if (typeof body.maxCallsPerDay === 'number') {
      user.restrictions.maxCallsPerDay = body.maxCallsPerDay;
    }

    return {
      success: true,
      message: `Updated moderation & restriction settings for ${user.displayName}`,
      user,
    };
  }
}
