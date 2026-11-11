import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env';
import { InfraModule } from './infra/infra.module';
import { AuthModule } from './auth/auth.module';
import { StoreService } from './common/store.service';
import { RtcTokenService } from './calls/rtc-token.service';
import { CallsController } from './calls/calls.controller';
import { WebRtcSignalingGateway } from './calls/webrtc-signaling.gateway';
import { MatchmakingGateway } from './matchmaking/matchmaking.gateway';
import { CelebritiesController } from './celebrities/celebrities.controller';
import { EventsController } from './events/events.controller';
import { WalletController } from './wallet/wallet.controller';
import { SupportController } from './support/support.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }), InfraModule, AuthModule],
  controllers: [
    CallsController,
    CelebritiesController,
    EventsController,
    WalletController,
    SupportController,
  ],
  providers: [StoreService, RtcTokenService, MatchmakingGateway, WebRtcSignalingGateway],
})
export class AppModule {}
