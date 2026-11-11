# Friends Connect

Social discovery, celebrity calls and location-based event ticketing, for web, Android and iOS.

The build plan and current phase are in [PLAN.md](PLAN.md).

## Repository layout

| Path | What |
|---|---|
| `apps/api` | Backend: NestJS, Prisma (PostgreSQL + PostGIS), Redis, Socket.io, LiveKit tokens |
| `apps/web` | Web app: Next.js 14, Tailwind |
| `packages/contracts` | Types and rules shared by the API and clients (call types, call policy) |
| `mobile/android` | Android app: Kotlin, Jetpack Compose, Telecom `ConnectionService` (skeleton) |
| `mobile/ios` | iOS app: SwiftUI, CallKit (skeleton) |
| `notes/` | Engineering notes: Supabase setup, what was kept from the old demo |

## Call and communication matrix

| Caller → Receiver | Audio | Video | Chat | Billing |
|---|:---:|:---:|:---:|---|
| Normal user ↔ normal user (random match) | ✅ | ✅ | ❌ | Free |
| Normal user → celebrity | ✅ | ✅ | ❌ | Wallet coins, per minute |
| Normal user ↔ customer care | ✅ | ❌ | ✅ | Free, audio only |
| Celebrity ↔ customer care | ✅ | ❌ | ✅ | Free, audio only |

## Local development

Requirements: Node.js 20+, Docker Desktop.

```bash
npm install                          # installs all workspaces
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run infra:up                     # PostgreSQL+PostGIS (port 5433), Redis (6379), LiveKit (7880)
npm run db:deploy                    # apply migrations
npm run db:seed                      # demo accounts and sample data (safe to re-run)
npm run dev                          # API on :4000 and web on :3000
```

To check the setup, open http://localhost:4000/api/health. It should return `{"status":"ok","database":"up","redis":"up"}`.

### Common commands

| Command | Does |
|---|---|
| `npm run dev` | Run API and web together |
| `npm run typecheck` / `npm run lint` / `npm run format` | Code checks (CI runs the same) |
| `npm run build` | Production build of every workspace |
| `npm run db:migrate` | Create a new migration after editing `schema.prisma` (interactive terminal) |
| `npm run db:reset` | Drop, re-migrate and re-seed the local database |
| `npm run db:studio` | Browse the database in Prisma Studio |
| `npm test -w @friends-connect/api` | API end-to-end tests (needs `npm run infra:up`) |
| `npm run infra:down` | Stop the Docker services |

### Seed accounts

Log in at http://localhost:3000/login with any of these numbers. In development the OTP is always **123456**; real SMS comes later.

| Role | Phone |
|---|---|
| Normal user | +919876543210, +919876543211 |
| Celebrity | +919999900001, +919999900002 |
| Event organizer | +919888800001 |
| Customer Care | +919777700001 |
| Super Admin | +919000000001 |
| Pending celebrity applicant | +919999900003 |
| Pending organizer applicant | +919888800002 |

A number that isn't registered goes to sign-up. Celebrity and organizer sign-ups need admin approval at `/admin/applications`.

## Hosted database (Supabase)

See [notes/supabase-setup.md](notes/supabase-setup.md).

## Mobile apps

Open `mobile/android` in Android Studio, or `mobile/ios/Package.swift` in Xcode 16+. Both are skeletons until Phase 5.
