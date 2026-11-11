import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser = require('cookie-parser');
import { SocketAuthAdapter } from './auth/socket-auth.adapter';
import { Env } from './config/env';

/** Shared by main.ts and the e2e tests so both run the exact same middleware setup. */
export function configureApp(app: INestApplication): void {
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const corsOrigins = config
    .get('CORS_ORIGINS', { infer: true })
    .split(',')
    .map((o) => o.trim());

  app.use(cookieParser());
  // credentials: true lets the browser send the httpOnly refresh cookie to /api/auth/*.
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });
  app.useWebSocketAdapter(new SocketAuthAdapter(app, corsOrigins));
  app.enableShutdownHooks();
}
