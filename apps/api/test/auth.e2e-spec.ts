import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io as ioClient } from 'socket.io-client';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/infra/prisma.service';
import { RedisService } from '../src/infra/redis.service';
import { ageOn, todayInIndia } from '../src/users/profile.schemas';

/**
 * End-to-end tests for Phase 1 auth against the real Postgres + Redis (docker compose).
 * Every test uses fresh random phone numbers, so tests don't depend on each other or on the seed,
 * except for the seeded Super Admin (+919000000001), which is upserted in beforeAll.
 */
const CODE = process.env.OTP_DEV_CODE ?? '123456';
const ADMIN_PHONE = '+919000000001';
const PROFILE = { city: 'Kochi', dateOfBirth: '1999-05-20', interests: ['Music', 'Food'] };

/** YYYY-MM-DD for "today in India minus N years". */
function yearsAgo(n: number): string {
  const [y, m, d] = todayInIndia().split('-');
  return `${Number(y) - n}-${m}-${d === '29' && m === '02' ? '28' : d}`;
}

let app: INestApplication;
let prisma: PrismaService;
let redis: RedisService;
let baseUrl: string;
const createdPhones: string[] = [];

const http = () => request(app.getHttpServer());

function randomPhone(): string {
  // Valid Indian mobile range (starts with 9), unlikely to clash with seed data.
  const phone = `+9197${Math.floor(10_000_000 + Math.random() * 89_999_999)}`;
  createdPhones.push(phone);
  return phone;
}

async function clearOtpLimits(phone?: string) {
  const keys = await redis.keys(phone ? `otp:*${phone}*` : 'otp:hour:ip:*');
  if (keys.length) await redis.del(...keys);
}

async function verify(phone: string, code = CODE) {
  await clearOtpLimits(phone);
  await http().post('/api/auth/otp/request').send({ phone }).expect(200);
  return http().post('/api/auth/otp/verify').send({ phone, code });
}

function refreshCookieOf(res: request.Response): string {
  const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  const cookie = cookies.find((c) => c.startsWith('fc_refresh='));
  if (!cookie) throw new Error('no refresh cookie set');
  return cookie.split(';')[0];
}

/** Full flow for a new phone; returns the login response. */
async function registerNew(body: Record<string, unknown>, phone = randomPhone()) {
  const v = await verify(phone);
  expect(v.body.status).toBe('NEEDS_REGISTRATION');
  const res = await http()
    .post('/api/auth/register')
    .send({ registrationToken: v.body.registrationToken, profile: PROFILE, ...body })
    .expect(201);
  return { phone, res };
}

async function adminToken(): Promise<string> {
  const res = await verify(ADMIN_PHONE);
  expect(res.body.status).toBe('LOGGED_IN');
  return res.body.accessToken;
}

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  configureApp(app);
  await app.listen(0);
  baseUrl = await app.getUrl();
  prisma = app.get(PrismaService);
  redis = app.get(RedisService);

  await prisma.user.upsert({
    where: { phoneNumber: ADMIN_PHONE },
    update: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
    create: { phoneNumber: ADMIN_PHONE, displayName: 'Platform Control', role: 'SUPER_ADMIN' },
  });
});

beforeEach(() => clearOtpLimits());

afterAll(async () => {
  if (prisma) await prisma.user.deleteMany({ where: { phoneNumber: { in: createdPhones } } });
  await app?.close();
});

describe('OTP', () => {
  it('normalizes local numbers and logs in an existing user', async () => {
    const { phone } = await registerNew({ displayName: 'Local Format', accountType: 'NORMAL' });
    await clearOtpLimits(phone);
    const local = phone.replace('+91', ''); // "97xxxxxxxx"
    const req = await http().post('/api/auth/otp/request').send({ phone: local }).expect(200);
    expect(req.body.phone).toBe(phone);
    const res = await http().post('/api/auth/otp/verify').send({ phone: local, code: CODE }).expect(200);
    expect(res.body.status).toBe('LOGGED_IN');
  });

  it('rejects invalid phone numbers', async () => {
    const res = await http().post('/api/auth/otp/request').send({ phone: '12345' }).expect(400);
    expect(res.body.code).toBe('INVALID_PHONE');
  });

  it('rejects a wrong code, then locks after 5 wrong attempts', async () => {
    const phone = randomPhone();
    await http().post('/api/auth/otp/request').send({ phone }).expect(200);
    for (let i = 0; i < 4; i++) {
      const res = await http().post('/api/auth/otp/verify').send({ phone, code: '000000' }).expect(400);
      expect(res.body.code).toBe('OTP_INVALID');
    }
    const fifth = await http().post('/api/auth/otp/verify').send({ phone, code: '000000' }).expect(429);
    expect(fifth.body.code).toBe('OTP_TOO_MANY_ATTEMPTS');
    // Even the right code is refused until a new one is requested.
    const right = await http().post('/api/auth/otp/verify').send({ phone, code: CODE }).expect(429);
    expect(right.body.code).toBe('OTP_TOO_MANY_ATTEMPTS');
  });

  it('a code can be used only once', async () => {
    const phone = randomPhone();
    await http().post('/api/auth/otp/request').send({ phone }).expect(200);
    await http().post('/api/auth/otp/verify').send({ phone, code: CODE }).expect(200);
    const again = await http().post('/api/auth/otp/verify').send({ phone, code: CODE }).expect(400);
    expect(again.body.code).toBe('OTP_EXPIRED');
  });

  it('enforces the resend cooldown', async () => {
    const phone = randomPhone();
    await http().post('/api/auth/otp/request').send({ phone }).expect(200);
    const res = await http().post('/api/auth/otp/request').send({ phone }).expect(429);
    expect(res.body.code).toBe('OTP_RATE_LIMITED');
  });
});

describe('Registration', () => {
  it('registers a normal user who is active immediately', async () => {
    const { res } = await registerNew({ displayName: 'Normal Person', accountType: 'NORMAL' });
    expect(res.body.status).toBe('LOGGED_IN');
    expect(res.body.user.role).toBe('NORMAL');
    expect(res.body.user.latestApplication).toBeNull();
    refreshCookieOf(res);
  });

  it.each([
    ['CELEBRITY', { category: 'Music', bio: 'Singer and composer from Kochi.' }],
    ['ORG', { companyName: 'Test Events LLP', registrationNo: 'GST-TEST-1' }],
  ])('a %s applicant stays NORMAL with a pending application', async (accountType, application) => {
    const { res } = await registerNew({ displayName: 'Applicant', accountType, application });
    expect(res.body.user.role).toBe('NORMAL');
    expect(res.body.user.latestApplication).toMatchObject({ requestedRole: accountType, status: 'PENDING' });
  });

  it('can never self-register as SUPPORT or SUPER_ADMIN', async () => {
    for (const accountType of ['SUPPORT', 'SUPER_ADMIN']) {
      const phone = randomPhone();
      const v = await verify(phone);
      await http()
        .post('/api/auth/register')
        .send({
          registrationToken: v.body.registrationToken,
          displayName: 'Sneaky',
          accountType,
          profile: PROFILE,
        })
        .expect(400);
      expect(await prisma.user.findUnique({ where: { phoneNumber: phone } })).toBeNull();
    }
  });

  it('requires application details for celebrity sign-up', async () => {
    const v = await verify(randomPhone());
    await http()
      .post('/api/auth/register')
      .send({
        registrationToken: v.body.registrationToken,
        displayName: 'No Details',
        accountType: 'CELEBRITY',
      })
      .expect(400);
  });

  it('rejects a forged registration token', async () => {
    const res = await http()
      .post('/api/auth/register')
      .send({
        registrationToken: 'not-a-token',
        displayName: 'Forger',
        accountType: 'NORMAL',
        profile: PROFILE,
      })
      .expect(401);
    expect(res.body.code).toBe('REGISTRATION_TOKEN_INVALID');
  });

  it('does not register the same phone twice', async () => {
    const phone = randomPhone();
    const v = await verify(phone);
    const body = {
      registrationToken: v.body.registrationToken,
      displayName: 'Twice',
      accountType: 'NORMAL',
      profile: PROFILE,
    };
    await http().post('/api/auth/register').send(body).expect(201);
    const res = await http().post('/api/auth/register').send(body).expect(409);
    expect(res.body.code).toBe('ALREADY_REGISTERED');
  });
});

describe('Profile at sign-up', () => {
  async function tryRegister(profile: unknown) {
    const v = await verify(randomPhone());
    return http().post('/api/auth/register').send({
      registrationToken: v.body.registrationToken,
      displayName: 'Profile Test',
      accountType: 'NORMAL',
      profile,
    });
  }

  it('stores the profile and returns it on the user', async () => {
    const res = await tryRegister({
      city: '  Kozhikode ',
      dateOfBirth: '1996-02-29',
      gender: 'NON_BINARY',
      interests: ['Tech', 'Books', 'Tech'],
      bio: 'Hello there',
    });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      city: 'Kozhikode',
      dateOfBirth: '1996-02-29',
      gender: 'NON_BINARY',
      interests: ['Tech', 'Books'],
      bio: 'Hello there',
    });
  });

  it('defaults optional fields', async () => {
    const res = await tryRegister({ city: 'Kochi', dateOfBirth: '2001-01-01' });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ gender: null, interests: [], bio: null });
  });

  it('requires a profile with city and date of birth', async () => {
    expect((await tryRegister(undefined)).status).toBe(400);
    expect((await tryRegister({ dateOfBirth: '1999-01-01' })).status).toBe(400);
    expect((await tryRegister({ city: 'Kochi' })).status).toBe(400);
  });

  it('refuses anyone under 18, and accepts someone turning 18 today', async () => {
    const minor = await tryRegister({ city: 'Kochi', dateOfBirth: yearsAgo(17) });
    expect(minor.status).toBe(400);
    expect(minor.body.code).toBe('UNDERAGE');
    const exactly = await tryRegister({ city: 'Kochi', dateOfBirth: yearsAgo(18) });
    expect(exactly.status).toBe(201);
  });

  it('counts age by calendar date (birthday must have arrived)', () => {
    expect(ageOn('2000-06-15', '2018-06-14')).toBe(17);
    expect(ageOn('2000-06-15', '2018-06-15')).toBe(18);
    expect(ageOn('2000-02-29', '2018-02-28')).toBe(17);
    expect(ageOn('2000-02-29', '2018-03-01')).toBe(18);
  });

  it('rejects impossible or future dates', async () => {
    expect((await tryRegister({ city: 'Kochi', dateOfBirth: '1999-02-30' })).status).toBe(400);
    expect((await tryRegister({ city: 'Kochi', dateOfBirth: '20-01-1999' })).status).toBe(400);
    expect((await tryRegister({ city: 'Kochi', dateOfBirth: yearsAgo(-1) })).status).toBe(400);
  });

  it('only allows up to 5 interests from the fixed list', async () => {
    const unknown = await tryRegister({ ...PROFILE, interests: ['Music', 'Skydiving'] });
    expect(unknown.status).toBe(400);
    const tooMany = await tryRegister({
      ...PROFILE,
      interests: ['Music', 'Cricket', 'Films', 'Food', 'Travel', 'Comedy'],
    });
    expect(tooMany.status).toBe(400);
  });

  it('limits the bio to 160 characters', async () => {
    expect((await tryRegister({ ...PROFILE, bio: 'x'.repeat(161) })).status).toBe(400);
  });
});

describe('PATCH /api/users/me', () => {
  it('updates only the fields sent, and null clears gender and bio', async () => {
    const { res } = await registerNew({
      displayName: 'Editor',
      accountType: 'NORMAL',
      profile: { ...PROFILE, gender: 'WOMAN', bio: 'Old bio' },
    });
    const auth = `Bearer ${res.body.accessToken}`;

    const updated = await http()
      .patch('/api/users/me')
      .set('Authorization', auth)
      .send({ displayName: 'Edited Name', city: 'Kannur', interests: ['Dance'], bio: null, gender: null })
      .expect(200);
    expect(updated.body).toMatchObject({
      displayName: 'Edited Name',
      city: 'Kannur',
      interests: ['Dance'],
      bio: null,
      gender: null,
      dateOfBirth: PROFILE.dateOfBirth,
    });

    const me = await http().get('/api/auth/me').set('Authorization', auth).expect(200);
    expect(me.body.city).toBe('Kannur');
  });

  it('does not allow changing the date of birth or unknown fields', async () => {
    const { res } = await registerNew({ displayName: 'Fixed DOB', accountType: 'NORMAL' });
    const auth = `Bearer ${res.body.accessToken}`;
    await http()
      .patch('/api/users/me')
      .set('Authorization', auth)
      .send({ dateOfBirth: '1970-01-01' })
      .expect(400);
    await http().patch('/api/users/me').set('Authorization', auth).send({ role: 'SUPER_ADMIN' }).expect(400);
  });

  it('validates the same rules as sign-up', async () => {
    const { res } = await registerNew({ displayName: 'Validator', accountType: 'NORMAL' });
    const auth = `Bearer ${res.body.accessToken}`;
    await http()
      .patch('/api/users/me')
      .set('Authorization', auth)
      .send({ interests: ['Skydiving'] })
      .expect(400);
    await http().patch('/api/users/me').set('Authorization', auth).send({ city: 'X' }).expect(400);
  });

  it('requires login', async () => {
    await http().patch('/api/users/me').send({ city: 'Kochi' }).expect(401);
  });
});

describe('Sessions', () => {
  it('protects routes and returns the current user', async () => {
    await http().get('/api/auth/me').expect(401);
    const { res } = await registerNew({ displayName: 'Me Myself', accountType: 'NORMAL' });
    const me = await http()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(200);
    expect(me.body.displayName).toBe('Me Myself');
  });

  it('rotates the refresh token and revokes the session when an old token is reused', async () => {
    const { res } = await registerNew({ displayName: 'Rotator', accountType: 'NORMAL' });
    const first = refreshCookieOf(res);

    const r1 = await http().post('/api/auth/refresh').set('Cookie', first).expect(200);
    const second = refreshCookieOf(r1);
    expect(second).not.toBe(first);

    // Reuse within a few seconds (two tabs refreshing at once) is tolerated.
    await http().post('/api/auth/refresh').set('Cookie', first).expect(200);

    // Reuse later is a theft signal: revoke the whole family. Simulate "later" by ageing the rotation.
    await prisma.authSession.updateMany({
      where: { userId: res.body.user.id, revokedAt: { not: null } },
      data: { revokedAt: new Date(Date.now() - 60_000) },
    });
    const reuse = await http().post('/api/auth/refresh').set('Cookie', first).expect(401);
    expect(reuse.body.code).toBe('SESSION_INVALID');
    await http().post('/api/auth/refresh').set('Cookie', second).expect(401);
  });

  it('logout ends the session', async () => {
    const { res } = await registerNew({ displayName: 'Leaver', accountType: 'NORMAL' });
    const cookie = refreshCookieOf(res);
    await http().post('/api/auth/logout').set('Cookie', cookie).expect(204);
    await http().post('/api/auth/refresh').set('Cookie', cookie).expect(401);
  });

  it('gives mobile clients the refresh token in the body instead of a cookie', async () => {
    const phone = randomPhone();
    const v = await verify(phone);
    const res = await http()
      .post('/api/auth/register')
      .set('X-Client', 'mobile')
      .send({
        registrationToken: v.body.registrationToken,
        displayName: 'Phone App',
        accountType: 'NORMAL',
        profile: PROFILE,
      })
      .expect(201);
    expect(res.body.refreshToken).toEqual(expect.any(String));
    expect(res.headers['set-cookie']).toBeUndefined();
    const r = await http()
      .post('/api/auth/refresh')
      .set('X-Client', 'mobile')
      .send({ refreshToken: res.body.refreshToken })
      .expect(200);
    expect(r.body.refreshToken).not.toBe(res.body.refreshToken);
  });
});

describe('Admin', () => {
  it('non-admins get 403 on admin routes', async () => {
    const { res } = await registerNew({ displayName: 'Curious', accountType: 'NORMAL' });
    await http()
      .get('/api/admin/applications')
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(403);
  });

  it('approving a celebrity grants the role and creates a verified profile', async () => {
    const { res } = await registerNew({
      displayName: 'Rising Star',
      accountType: 'CELEBRITY',
      application: { category: 'Acting', bio: 'Theatre actor moving into film.' },
    });
    const appId = res.body.user.latestApplication.id;
    const admin = await adminToken();

    const pending = await http()
      .get('/api/admin/applications?status=PENDING')
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
    expect(pending.body.map((a: { id: string }) => a.id)).toContain(appId);

    await http()
      .post(`/api/admin/applications/${appId}/approve`)
      .set('Authorization', `Bearer ${admin}`)
      .send({})
      .expect(201);

    // The role change is visible on the user's very next request (user is loaded from the DB each time).
    const me = await http()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(200);
    expect(me.body.role).toBe('CELEBRITY');
    expect(me.body.latestApplication.status).toBe('APPROVED');
    const profile = await prisma.celebrityProfile.findUnique({ where: { userId: res.body.user.id } });
    expect(profile).toMatchObject({ category: 'Acting', isVerified: true });

    // Can't be reviewed twice.
    await http()
      .post(`/api/admin/applications/${appId}/reject`)
      .set('Authorization', `Bearer ${admin}`)
      .send({})
      .expect(409);
  });

  it('rejecting keeps the user NORMAL, shows the note, and allows re-applying', async () => {
    const { res } = await registerNew({
      displayName: 'Event Hopeful',
      accountType: 'ORG',
      application: { companyName: 'Hopeful Events', registrationNo: 'GST-HOPE' },
    });
    const token = res.body.accessToken;
    const appId = res.body.user.latestApplication.id;
    const admin = await adminToken();

    await http()
      .post(`/api/admin/applications/${appId}/reject`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ note: 'GST number could not be verified.' })
      .expect(201);

    const me = await http().get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(me.body.role).toBe('NORMAL');
    expect(me.body.latestApplication).toMatchObject({
      status: 'REJECTED',
      reviewNote: 'GST number could not be verified.',
    });

    const body = {
      requestedRole: 'ORG',
      details: { companyName: 'Hopeful Events', registrationNo: 'GST-HOPE-2' },
    };
    await http().post('/api/me/applications').set('Authorization', `Bearer ${token}`).send(body).expect(201);
    const dup = await http()
      .post('/api/me/applications')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(409);
    expect(dup.body.code).toBe('APPLICATION_ALREADY_PENDING');
  });

  it('only the admin can create Customer Care agents, who can then log in', async () => {
    const phone = randomPhone();
    const admin = await adminToken();
    await http()
      .post('/api/admin/support-agents')
      .set('Authorization', `Bearer ${admin}`)
      .send({ phone, displayName: 'Agent Test' })
      .expect(201);
    const login = await verify(phone);
    expect(login.body.status).toBe('LOGGED_IN');
    expect(login.body.user.role).toBe('SUPPORT');
  });

  it('a blocked user is refused immediately and cannot log in again', async () => {
    const { phone, res } = await registerNew({ displayName: 'Troublemaker', accountType: 'NORMAL' });
    const admin = await adminToken();
    await http()
      .patch(`/api/admin/users/${res.body.user.id}/status`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ status: 'BLOCKED' })
      .expect(200);

    const me = await http()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(403);
    expect(me.body.code).toBe('ACCOUNT_BLOCKED');
    await http().post('/api/auth/refresh').set('Cookie', refreshCookieOf(res)).expect(401);
    const login = await verify(phone);
    expect(login.status).toBe(403);
    expect(login.body.code).toBe('ACCOUNT_BLOCKED');
  });
});

describe('Sockets', () => {
  const connect = (token?: string) =>
    new Promise<string>((resolve) => {
      const socket = ioClient(baseUrl, {
        transports: ['websocket'],
        auth: token ? { token } : {},
        reconnection: false,
      });
      socket.on('connect', () => {
        socket.disconnect();
        resolve('connected');
      });
      socket.on('connect_error', (err) => resolve(err.message));
    });

  it('rejects connections without a valid token and accepts a logged-in user', async () => {
    expect(await connect()).toBe('UNAUTHORIZED');
    expect(await connect('garbage')).toBe('UNAUTHORIZED');
    const { res } = await registerNew({ displayName: 'Socket User', accountType: 'NORMAL' });
    expect(await connect(res.body.accessToken)).toBe('connected');
  });
});
