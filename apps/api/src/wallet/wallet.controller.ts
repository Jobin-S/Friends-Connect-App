import { Body, Controller, Get, Param, Post, BadRequestException } from '@nestjs/common';
import { StoreService } from '../common/store.service';

@Controller('api/wallet')
export class WalletController {
  private readonly coinPackages = [
    { id: 'pkg-starter', name: 'Starter Pack', coins: 200, priceInr: 99, unlocksPremium: true },
    { id: 'pkg-fan', name: 'Super Fan Pack', coins: 600, priceInr: 249, unlocksPremium: true },
    { id: 'pkg-vip', name: 'Celebrity VIP Pack', coins: 1500, priceInr: 499, unlocksPremium: true },
  ];

  constructor(private readonly store: StoreService) {}

  @Get('packages')
  getPackages() {
    return this.coinPackages;
  }

  @Get(':userId')
  getWallet(@Param('userId') userId: string) {
    const user = this.store.users.get(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return {
      userId: user.id,
      coinBalance: user.coinBalance,
      earnedCoins: user.earnedCoins,
      isPremium: user.isPremium,
    };
  }

  @Post('recharge')
  rechargeWallet(@Body() body: { userId: string; packageId?: string; customCoins?: number }) {
    const user = this.store.users.get(body.userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const pkg = this.coinPackages.find((p) => p.id === body.packageId);
    const coinsToAdd = pkg ? pkg.coins : Number(body.customCoins || 200);

    user.coinBalance += coinsToAdd;
    user.isPremium = true;

    return {
      success: true,
      addedCoins: coinsToAdd,
      coinBalance: user.coinBalance,
      isPremium: user.isPremium,
    };
  }
}
