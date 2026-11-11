import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { apiError } from '../common/api-error';
import { Env } from '../config/env';
import { RedisService } from '../infra/redis.service';
import { OtpSender } from './otp-sender';

export const OTP_TTL_SECONDS = 300;
export const OTP_RESEND_AFTER_SECONDS = 30;
export const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_PER_HOUR_PER_PHONE = 10;
const OTP_MAX_PER_HOUR_PER_IP = 30;

/**
 * One-time codes, stored only as a hash in Redis.
 * Keys: otp:<phone> (hash of code + wrong-attempt count, 5 min TTL),
 *       otp:cooldown:<phone> (30 s), otp:hour:<phone> / otp:hour:ip:<ip> (hourly counters).
 */
@Injectable()
export class OtpService {
  constructor(
    private readonly redis: RedisService,
    private readonly sender: OtpSender,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async request(phone: string, ip: string): Promise<void> {
    if (await this.redis.exists(`otp:cooldown:${phone}`)) {
      throw apiError(
        HttpStatus.TOO_MANY_REQUESTS,
        'OTP_RATE_LIMITED',
        `Please wait ${OTP_RESEND_AFTER_SECONDS} seconds before requesting another code.`,
      );
    }
    const [phoneCount, ipCount] = await Promise.all([
      this.incrementHourly(`otp:hour:${phone}`),
      this.incrementHourly(`otp:hour:ip:${ip}`),
    ]);
    if (phoneCount > OTP_MAX_PER_HOUR_PER_PHONE || ipCount > OTP_MAX_PER_HOUR_PER_IP) {
      throw apiError(
        HttpStatus.TOO_MANY_REQUESTS,
        'OTP_RATE_LIMITED',
        'Too many codes requested. Try again in an hour.',
      );
    }

    const devCode = this.config.get('OTP_DEV_CODE', { infer: true });
    const code = devCode ?? randomInt(0, 1_000_000).toString().padStart(6, '0');

    await this.redis
      .multi()
      .hset(`otp:${phone}`, { hash: this.hash(phone, code), attempts: 0 })
      .expire(`otp:${phone}`, OTP_TTL_SECONDS)
      .set(`otp:cooldown:${phone}`, '1', 'EX', OTP_RESEND_AFTER_SECONDS)
      .exec();

    await this.sender.send(phone, code);
  }

  /** Throws on a wrong/expired code; consumes the code on success so it can't be reused. */
  async verify(phone: string, code: string): Promise<void> {
    const key = `otp:${phone}`;
    const stored = await this.redis.hgetall(key);
    if (!stored.hash) {
      throw apiError(HttpStatus.BAD_REQUEST, 'OTP_EXPIRED', 'The code has expired. Request a new one.');
    }
    if (Number(stored.attempts) >= OTP_MAX_ATTEMPTS) {
      throw apiError(
        HttpStatus.TOO_MANY_REQUESTS,
        'OTP_TOO_MANY_ATTEMPTS',
        'Too many wrong attempts. Request a new code.',
      );
    }

    const expected = Buffer.from(stored.hash, 'hex');
    const actual = Buffer.from(this.hash(phone, code), 'hex');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      const attempts = await this.redis.hincrby(key, 'attempts', 1);
      if (attempts >= OTP_MAX_ATTEMPTS) {
        throw apiError(
          HttpStatus.TOO_MANY_REQUESTS,
          'OTP_TOO_MANY_ATTEMPTS',
          'Too many wrong attempts. Request a new code.',
        );
      }
      throw apiError(HttpStatus.BAD_REQUEST, 'OTP_INVALID', 'Incorrect code. Please try again.');
    }

    await this.redis.del(key, `otp:cooldown:${phone}`);
  }

  private hash(phone: string, code: string): string {
    // Keyed by the server secret so a Redis dump alone can't be brute-forced offline.
    return createHash('sha256')
      .update(`${this.config.get('JWT_SECRET', { infer: true })}:${phone}:${code}`)
      .digest('hex');
  }

  private async incrementHourly(key: string): Promise<number> {
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, 3600);
    return count;
  }
}
