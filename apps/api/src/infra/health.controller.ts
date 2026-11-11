import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';

@Public()
@Controller('api/health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Liveness + dependency check, used by local dev, CI and the hosting platform. */
  @Get()
  async check() {
    const [database, redis] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1`.then(() => 'up' as const).catch(() => 'down' as const),
      this.redis
        .ping()
        .then(() => 'up' as const)
        .catch(() => 'down' as const),
    ]);
    const body = { status: database === 'up' && redis === 'up' ? 'ok' : 'degraded', database, redis };
    if (body.status !== 'ok') throw new ServiceUnavailableException(body);
    return body;
  }
}
