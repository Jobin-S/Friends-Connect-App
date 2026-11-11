# Supabase setup (hosted PostgreSQL)

Local development uses Docker. Supabase is the hosted database for online testing, and later for production.
The app code doesn't change between them; only the two connection URLs in `apps/api/.env` do.

## One-time setup

1. Create a project at https://supabase.com (Free plan is fine to start).
   - **Region:** pick the one closest to your users. For India, use Mumbai (`ap-south-1`).
   - **Database password:** save it in a password manager.
2. **Enable PostGIS:** Dashboard → Database → Extensions → search `postgis` → Enable.
   The init migration also runs `CREATE EXTENSION IF NOT EXISTS`, but enabling it in the dashboard first avoids permission issues.
3. Get the connection strings: Dashboard → **Connect** → ORMs → Prisma. You need two:
   - `DATABASE_URL`: **Transaction pooler**, port **6543**. Add `?pgbouncer=true&connection_limit=1`. The running API uses this one.
   - `DIRECT_URL`: **Session pooler** (or direct connection), port **5432**. Only migrations use this one.
4. Put them in `apps/api/.env` (or in your hosting platform's secret settings). Never commit them.
5. Apply the schema and, for a test database only, the seed data:

   ```bash
   npm run db:deploy
   npm run db:seed      # test/staging only, never on production
   ```

6. Start the API and check `GET /api/health` returns `"database":"up"`.

## Things to know

- **Free projects pause after about a week with no activity.** Resume them from the dashboard. Upgrade to a paid plan
  (about $25/month) before real users and payments, for no pausing, daily backups and more storage.
- **Migrations:** always create them locally (`npm run db:migrate`, which writes a file under `apps/api/prisma/migrations`),
  commit the file, then run `npm run db:deploy` against Supabase. Never edit the hosted schema by hand in the dashboard.
- **What we use Supabase for:** only Postgres. Auth, storage and realtime come from our own API, so we can move to any
  Postgres host later by changing the URLs.
- **Redis is separate:** Supabase doesn't provide Redis. For online testing, Upstash has a free Redis tier; set
  `REDIS_URL` to its `rediss://` URL.
