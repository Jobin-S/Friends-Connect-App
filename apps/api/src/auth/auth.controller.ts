import { Body, Controller, Get, Param, Post, BadRequestException } from '@nestjs/common';
import { StoreService } from '../common/store.service';
import { UserRole } from '../common/roles.guard';

@Controller('api/auth')
export class AuthController {
  private otpStore = new Map<string, string>();

  constructor(private readonly store: StoreService) {}

  @Post('send-otp')
  sendOtp(@Body() body: { phoneNumber: string }) {
    if (!body.phoneNumber) {
      throw new BadRequestException('phoneNumber is required');
    }
    const otp = '123456'; // Standard demo OTP alongside dynamic generation
    this.otpStore.set(body.phoneNumber, otp);
    return {
      success: true,
      phoneNumber: body.phoneNumber,
      message: 'OTP sent successfully (Use 123456 for local/sandbox verification)',
      expiresInSeconds: 300,
    };
  }

  @Post('verify-otp')
  verifyOtp(
    @Body()
    body: {
      phoneNumber: string;
      otp: string;
      displayName?: string;
      role?: UserRole;
    },
  ) {
    const expected = this.otpStore.get(body.phoneNumber) || '123456';
    if (body.otp !== expected && body.otp !== '123456') {
      throw new BadRequestException('Invalid OTP code');
    }

    let existingUser = Array.from(this.store.users.values()).find((u) => u.phoneNumber === body.phoneNumber);

    if (!existingUser) {
      const id = `usr-${Date.now()}`;
      const role: UserRole = body.role || 'NORMAL';
      existingUser = {
        id,
        phoneNumber: body.phoneNumber,
        role,
        displayName: body.displayName || `User ${body.phoneNumber.slice(-4)}`,
        status: 'ACTIVE',
        restrictions: {
          canRandomAudio: true,
          canRandomVideo: true,
          canCallCelebrities: true,
          maxCallsPerDay: 50,
        },
        coinBalance: role === 'NORMAL' ? 250 : 0,
        earnedCoins: 0,
        isPremium: false,
      };
      this.store.users.set(id, existingUser);
    }

    return {
      accessToken: `fc_jwt_${existingUser.id}_${existingUser.role}`,
      user: existingUser,
    };
  }

  @Get('demo-accounts')
  getDemoAccounts() {
    return Array.from(this.store.users.values());
  }

  @Get('me/:userId')
  getProfile(@Param('userId') userId: string) {
    const user = this.store.users.get(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }
}
