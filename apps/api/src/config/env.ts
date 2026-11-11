import { z } from 'zod';

/**
 * Every environment variable the API reads is declared here and validated at boot.
 * A missing or malformed value stops the server with a clear message instead of failing later at runtime.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  /** Comma-separated list of allowed browser origins, e.g. "http://localhost:3000,https://app.example.com" */
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  /** Pooled connection used by the running app (Supabase: transaction pooler, port 6543, ?pgbouncer=true). */
  DATABASE_URL: z.string().url(),
  /** Direct connection used only by Prisma migrations (Supabase: port 5432). Same as DATABASE_URL locally. */
  DIRECT_URL: z.string().url(),

  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  LIVEKIT_URL: z.string().url().default('ws://localhost:7880'),
  LIVEKIT_API_KEY: z.string().default('devkey'),
  LIVEKIT_API_SECRET: z.string().default('secret'),

  TURN_URL: z.string().optional(),
  TURN_USERNAME: z.string().optional(),
  TURN_PASSWORD: z.string().optional(),
  SIGNALING_URL: z.string().url().default('http://localhost:4000'),

  /** Signs access and registration tokens. Generate with: openssl rand -base64 48 */
  JWT_SECRET: z.string().min(32, 'must be at least 32 characters'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  /** Fixed OTP for development until a real SMS provider is added. Never allowed in production. */
  OTP_DEV_CODE: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
  /** Default country for phone numbers typed without a +country code (ISO 3166 alpha-2). */
  DEFAULT_PHONE_REGION: z.string().length(2).default('IN'),
  /** Set the refresh cookie with the Secure flag (true behind HTTPS). */
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(
      `Invalid environment configuration:\n${problems}\n\nCopy apps/api/.env.example to apps/api/.env and fill it in.`,
    );
  }
  if (parsed.data.NODE_ENV === 'production') {
    if (parsed.data.OTP_DEV_CODE) {
      throw new Error('OTP_DEV_CODE must not be set in production.');
    }
    if (parsed.data.LIVEKIT_API_KEY === 'devkey' || parsed.data.LIVEKIT_API_SECRET === 'secret') {
      throw new Error('LIVEKIT_API_KEY / LIVEKIT_API_SECRET must be set to real values in production.');
    }
  }
  return parsed.data;
}
