import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ApplicationsController } from '../applications/applications.controller';
import { ApplicationsService } from '../applications/applications.service';
import { AdminController } from '../admin/admin.controller';
import { RolesAndRestrictionGuard } from '../common/roles.guard';
import { Env } from '../config/env';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { DevOtpSender, OtpSender } from './otp-sender';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { UserLoaderService } from './user-loader.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
      }),
    }),
  ],
  controllers: [AuthController, ApplicationsController, AdminController],
  providers: [
    OtpService,
    { provide: OtpSender, useClass: DevOtpSender },
    TokenService,
    UserLoaderService,
    ApplicationsService,
    // Order matters: authenticate first, then check roles.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesAndRestrictionGuard },
  ],
  exports: [TokenService, UserLoaderService, ApplicationsService],
})
export class AuthModule {}
