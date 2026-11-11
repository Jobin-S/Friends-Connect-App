import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env';
import { InfraModule } from './infra/infra.module';
import { StoreService } from './common/store.service';
import { AuthController } from './auth/auth.controller';
import { RtcTokenService } from './calls/rtc-token.service';
import { CallsController } from './calls/calls.controller';
import { WebRtcSignalingGateway } from './calls/webrtc-signaling.gateway';
import { MatchmakingGateway } from './matchmaking/matchmaking.gateway';
import { CelebritiesController } from './celebrities/celebrities.controller';
import { EventsController } from './events/events.controller';
import { WalletController } from './wallet/wallet.controller';
import { SupportController } from './support/support.controller';
import { AdminController } from './admin/admin.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }), InfraModule],
  controllers: [
    AuthController,
    CallsController,
    CelebritiesController,
    EventsController,
    WalletController,
    SupportController,
    AdminController,
  ],
  providers: [StoreService, RtcTokenService, MatchmakingGateway, WebRtcSignalingGateway],
})
export class AppModule {}
