import { Body, Controller, Get, Param, Post, BadRequestException } from '@nestjs/common';
import { StoreService } from '../common/store.service';
import { RtcTokenService, CallSessionMode } from './rtc-token.service';

export interface ActiveCallRecord {
  callId: string;
  callType: CallSessionMode;
  callerId: string;
  receiverId: string;
  roomName: string;
  rateCoinsPerMin: number;
  startedAt: number;
  minutesBilled: number;
  totalCoinsCharged: number;
  status: 'ACTIVE' | 'ENDED';
}

@Controller('api/calls')
export class CallsController {
  private activeCalls = new Map<string, ActiveCallRecord>();

  constructor(
    private readonly store: StoreService,
    private readonly rtcTokenService: RtcTokenService,
  ) {}

  /**
   * 1. Normal User <-> Normal User (Random Audio or Random Video)
   */
  @Post('random/start')
  async startRandomCall(@Body() body: { userId: string; mode: 'AUDIO' | 'VIDEO' }) {
    const user = this.store.users.get(body.userId);
    if (!user) throw new BadRequestException('User not found');
    if (user.status !== 'ACTIVE') {
      throw new BadRequestException(`Account status is ${user.status}`);
    }
    if (body.mode === 'AUDIO' && !user.restrictions.canRandomAudio) {
      throw new BadRequestException('Random Audio Calls are restricted on your account by Super Admin.');
    }
    if (body.mode === 'VIDEO' && !user.restrictions.canRandomVideo) {
      throw new BadRequestException('Random Video Calls are restricted on your account by Super Admin.');
    }

    const callType: CallSessionMode = body.mode === 'VIDEO' ? 'RANDOM_VIDEO' : 'RANDOM_AUDIO';
    const roomName = `random_${body.mode.toLowerCase()}_${Date.now()}`;

    // Pick another active normal user as peer for instant matchmaking simulation
    const peer =
      Array.from(this.store.users.values()).find(
        (u) => u.role === 'NORMAL' && u.id !== user.id && u.status === 'ACTIVE',
      ) || user;

    const rtc = await this.rtcTokenService.createRoomToken({
      roomName,
      participantId: user.id,
      participantName: user.displayName,
      mode: callType,
    });

    const callId = `call-${Date.now()}`;
    const record: ActiveCallRecord = {
      callId,
      callType,
      callerId: user.id,
      receiverId: peer.id,
      roomName,
      rateCoinsPerMin: 0,
      startedAt: Date.now(),
      minutesBilled: 0,
      totalCoinsCharged: 0,
      status: 'ACTIVE',
    };
    this.activeCalls.set(callId, record);

    return {
      callId,
      callType,
      peer: { id: peer.id, displayName: peer.displayName },
      rtc,
    };
  }

  /**
   * 2. Normal User -> Celebrity User (Premium / Per-Minute Coins Audio or Video Call)
   */
  @Post('celebrity/start')
  async startCelebrityCall(
    @Body()
    body: {
      callerId: string;
      celebrityId: string;
      mode: 'AUDIO' | 'VIDEO';
    },
  ) {
    const caller = this.store.users.get(body.callerId);
    const celebProfile = this.store.celebrities.get(body.celebrityId);
    const celebUser = this.store.users.get(body.celebrityId);

    if (!caller || !celebProfile || !celebUser) {
      throw new BadRequestException('Caller or Celebrity not found');
    }
    if (caller.status !== 'ACTIVE' || !caller.restrictions.canCallCelebrities) {
      throw new BadRequestException('Celebrity calling is restricted on your account');
    }
    if (celebProfile.availability !== 'ONLINE') {
      throw new BadRequestException(`Celebrity is currently ${celebProfile.availability}`);
    }
    if (body.mode === 'AUDIO' && !celebProfile.allowAudioCalls) {
      throw new BadRequestException('This celebrity has disabled Audio Calls');
    }
    if (body.mode === 'VIDEO' && !celebProfile.allowVideoCalls) {
      throw new BadRequestException('This celebrity has disabled Video Calls');
    }

    const rate =
      body.mode === 'VIDEO' ? celebProfile.videoRateCoinsPerMin : celebProfile.audioRateCoinsPerMin;

    if (caller.coinBalance < rate) {
      throw new BadRequestException(
        `Insufficient Wallet Coins. Required: ${rate} coins/min (${body.mode}), Available: ${caller.coinBalance} coins. Please recharge your wallet.`,
      );
    }

    // Deduct first minute upfront
    caller.coinBalance -= rate;
    const celebrityCut = Math.floor(rate * 0.8); // 80% to celebrity, 20% platform fee
    celebUser.earnedCoins += celebrityCut;

    const callType: CallSessionMode = body.mode === 'VIDEO' ? 'CELEB_VIDEO' : 'CELEB_AUDIO';
    const roomName = `celeb_${body.mode.toLowerCase()}_${Date.now()}`;

    const rtc = await this.rtcTokenService.createRoomToken({
      roomName,
      participantId: caller.id,
      participantName: caller.displayName,
      mode: callType,
    });

    const callId = `call-celeb-${Date.now()}`;
    const record: ActiveCallRecord = {
      callId,
      callType,
      callerId: caller.id,
      receiverId: celebProfile.userId,
      roomName,
      rateCoinsPerMin: rate,
      startedAt: Date.now(),
      minutesBilled: 1,
      totalCoinsCharged: rate,
      status: 'ACTIVE',
    };
    this.activeCalls.set(callId, record);

    return {
      callId,
      callType,
      rateCoinsPerMin: rate,
      remainingCoinBalance: caller.coinBalance,
      celebrity: {
        userId: celebProfile.userId,
        displayName: celebProfile.displayName,
        category: celebProfile.category,
      },
      rtc,
    };
  }

  /**
   * 3. Per-Minute Metering Tick for Active Celebrity Calls
   */
  @Post('celebrity/:callId/tick')
  tickCelebrityCall(@Param('callId') callId: string) {
    const call = this.activeCalls.get(callId);
    if (!call || call.status !== 'ACTIVE') {
      throw new BadRequestException('Call session is no longer active');
    }

    const caller = this.store.users.get(call.callerId);
    const celeb = this.store.users.get(call.receiverId);
    if (!caller || !celeb) {
      throw new BadRequestException('Participants not found');
    }

    if (caller.coinBalance < call.rateCoinsPerMin) {
      call.status = 'ENDED';
      return {
        status: 'TERMINATED_INSUFFICIENT_COINS',
        message: 'Wallet coins exhausted. Call disconnected automatically.',
        remainingCoinBalance: caller.coinBalance,
        totalCoinsCharged: call.totalCoinsCharged,
      };
    }

    caller.coinBalance -= call.rateCoinsPerMin;
    celeb.earnedCoins += Math.floor(call.rateCoinsPerMin * 0.8);
    call.minutesBilled += 1;
    call.totalCoinsCharged += call.rateCoinsPerMin;

    return {
      status: 'ACTIVE',
      minutesBilled: call.minutesBilled,
      totalCoinsCharged: call.totalCoinsCharged,
      remainingCoinBalance: caller.coinBalance,
      lowBalanceWarning: caller.coinBalance < call.rateCoinsPerMin,
    };
  }

  /**
   * 4. Customer Care Support Call (Strictly AUDIO-ONLY — Video is never allowed)
   */
  @Post('support/start')
  async startSupportAudioCall(@Body() body: { requesterId: string; mode?: string }) {
    if (body.mode && body.mode.toUpperCase() === 'VIDEO') {
      throw new BadRequestException(
        'Video calls are not permitted with Customer Care Support. Only Audio Calls and Live Chat are supported.',
      );
    }

    const requester = this.store.users.get(body.requesterId);
    if (!requester) {
      throw new BadRequestException('Requester not found');
    }

    const supportAgent = Array.from(this.store.users.values()).find((u) => u.role === 'SUPPORT');

    const roomName = `support_audio_${Date.now()}`;
    const rtc = await this.rtcTokenService.createRoomToken({
      roomName,
      participantId: requester.id,
      participantName: requester.displayName,
      mode: 'SUPPORT_AUDIO',
    });

    const callId = `call-support-${Date.now()}`;
    this.activeCalls.set(callId, {
      callId,
      callType: 'SUPPORT_AUDIO',
      callerId: requester.id,
      receiverId: supportAgent?.id || 'usr-support-1',
      roomName,
      rateCoinsPerMin: 0,
      startedAt: Date.now(),
      minutesBilled: 0,
      totalCoinsCharged: 0,
      status: 'ACTIVE',
    });

    return {
      callId,
      callType: 'SUPPORT_AUDIO',
      videoAllowed: false,
      priority: requester.role === 'CELEBRITY' ? 'CELEBRITY_VIP' : 'NORMAL',
      supportAgent: {
        id: supportAgent?.id || 'usr-support-1',
        displayName: supportAgent?.displayName || 'Customer Care Support Desk',
      },
      rtc,
    };
  }

  @Post(':callId/end')
  endCall(@Param('callId') callId: string) {
    const call = this.activeCalls.get(callId);
    if (call) {
      call.status = 'ENDED';
    }
    return { success: true, call };
  }

  @Get('active')
  getActiveCalls() {
    return Array.from(this.activeCalls.values()).filter((c) => c.status === 'ACTIVE');
  }
}
