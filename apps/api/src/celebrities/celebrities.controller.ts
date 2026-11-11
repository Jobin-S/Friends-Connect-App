import { Body, Controller, Get, Param, Patch, Post, BadRequestException } from '@nestjs/common';
import { StoreService } from '../common/store.service';

@Controller('api/celebrities')
export class CelebritiesController {
  constructor(private readonly store: StoreService) {}

  @Get()
  listCelebrities() {
    return Array.from(this.store.celebrities.values());
  }

  @Get(':id')
  getCelebrity(@Param('id') id: string) {
    const celeb = this.store.celebrities.get(id);
    if (!celeb) {
      throw new BadRequestException('Celebrity not found');
    }
    const user = this.store.users.get(id);
    return {
      ...celeb,
      earnedCoins: user?.earnedCoins || 0,
    };
  }

  @Post(':id/media')
  uploadMedia(
    @Param('id') id: string,
    @Body()
    body: {
      mediaType: 'PHOTO' | 'VIDEO';
      mediaUrl: string;
      caption: string;
    },
  ) {
    const celeb = this.store.celebrities.get(id);
    if (!celeb) {
      throw new BadRequestException('Celebrity profile not found');
    }

    const item = {
      id: `med-${Date.now()}`,
      mediaType: body.mediaType,
      mediaUrl: body.mediaUrl,
      caption: body.caption,
      likesCount: 0,
      createdAt: new Date().toISOString(),
    };

    celeb.media.unshift(item);
    return item;
  }

  @Patch(':id/settings')
  updateCallSettings(
    @Param('id') id: string,
    @Body()
    body: {
      availability?: 'ONLINE' | 'BUSY' | 'OFFLINE';
      allowAudioCalls?: boolean;
      allowVideoCalls?: boolean;
      audioRateCoinsPerMin?: number;
      videoRateCoinsPerMin?: number;
    },
  ) {
    const celeb = this.store.celebrities.get(id);
    if (!celeb) {
      throw new BadRequestException('Celebrity profile not found');
    }

    if (body.availability) celeb.availability = body.availability;
    if (typeof body.allowAudioCalls === 'boolean') celeb.allowAudioCalls = body.allowAudioCalls;
    if (typeof body.allowVideoCalls === 'boolean') celeb.allowVideoCalls = body.allowVideoCalls;
    if (typeof body.audioRateCoinsPerMin === 'number') {
      celeb.audioRateCoinsPerMin = body.audioRateCoinsPerMin;
    }
    if (typeof body.videoRateCoinsPerMin === 'number') {
      celeb.videoRateCoinsPerMin = body.videoRateCoinsPerMin;
    }

    return celeb;
  }
}
