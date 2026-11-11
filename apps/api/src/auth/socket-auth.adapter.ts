import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions, Socket } from 'socket.io';
import type { AuthenticatedUser } from '../common/roles.guard';
import { TokenService } from './token.service';
import { UserLoaderService } from './user-loader.service';

/** Data attached to every authenticated socket. Gateways read the user from here, never from message payloads. */
export interface SocketData {
  user: AuthenticatedUser;
}

/** Rejects socket connections that don't present a valid access token: `io(url, { auth: { token } })`. */
export class SocketAuthAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketAuthAdapter.name);

  constructor(
    private readonly appContext: INestApplicationContext,
    private readonly corsOrigins: string[],
  ) {
    super(appContext);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server: Server = super.createIOServer(port, {
      ...options,
      cors: { origin: this.corsOrigins, credentials: true },
    });
    const tokens = this.appContext.get(TokenService);
    const users = this.appContext.get(UserLoaderService);

    server.use(async (socket: Socket, next) => {
      try {
        const raw = socket.handshake.auth?.token as string | undefined;
        const payload = raw ? tokens.verifyAccessToken(raw) : null;
        const user = payload ? await users.load(payload.sub) : null;
        if (!user) return next(new Error('UNAUTHORIZED'));
        if (user.status === 'BLOCKED' || user.status === 'SUSPENDED')
          return next(new Error('ACCOUNT_BLOCKED'));
        (socket.data as SocketData).user = user;
        next();
      } catch (e) {
        this.logger.warn(`Socket auth failed: ${(e as Error).message}`);
        next(new Error('UNAUTHORIZED'));
      }
    });
    return server;
  }
}
