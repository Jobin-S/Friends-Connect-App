# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Friends Connect is a social discovery / celebrity-call / event-ticketing product, being rebuilt from a prototype into a real product in phases. **[PLAN.md](PLAN.md) is the source of truth for the architecture and the current phase. Read it before starting work.** The user reviews and approves each phase before code is written.

It is an npm-workspaces monorepo:
- `apps/api` (NestJS)
- `apps/web` (Next.js 14 + Tailwind)
- `packages/contracts` (shared types and call rules)
- `mobile/android`, `mobile/ios` (skeletons until Phase 5)

API end-to-end tests live in `apps/api/test/` (Jest + supertest against the real Docker Postgres/Redis).

## Commands (run from the repo root)

```bash
npm install
npm run infra:up          # docker compose: Postgres+PostGIS on host port 5433 (not 5432), Redis 6379, LiveKit 7880
npm run db:deploy         # apply Prisma migrations
npm run db:seed           # idempotent demo data
npm run dev               # builds contracts, then API :4000 + web :3000
npm run typecheck && npm run lint && npm run format:check   # same as CI (.github/workflows/ci.yml)
npm run build
npm test -w @friends-connect/api   # API e2e tests (needs infra:up); single test: add  -- -t "name"
```

- `npm run db:migrate` (`prisma migrate dev`) needs an interactive terminal. In a non-interactive shell, generate SQL with `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script` (run in `apps/api`) into a new `prisma/migrations/<timestamp>_<name>/migration.sql`, then `npm run db:deploy`.
- `packages/contracts` must be built (`npm run build -w @friends-connect/contracts`) before the API or web can import it. `npm run dev` does this; a direct `npm run dev -w ...` doesn't.
- Health check: `GET http://localhost:4000/api/health`.

## Architecture

**Config** (`apps/api/src/config/env.ts`):
- Every env var is declared in a zod schema and validated at boot through `ConfigModule`. Add new variables there and to `apps/api/.env.example`.
- `DATABASE_URL` is the runtime connection (the Supabase transaction pooler in hosted environments).
- `DIRECT_URL` is used only for migrations. See `notes/supabase-setup.md`.

**Infra** (`apps/api/src/infra/`): a global `InfraModule` provides `PrismaService` and `RedisService` to all modules.

**Auth (Phase 1, `apps/api/src/auth/`):**
- Phone + OTP login. OTPs are hashed in Redis with cooldown, hourly limits and a 5-attempt lockout. `OTP_DEV_CODE` (123456) replaces real SMS in development, and the API refuses to start with it in production. Delivery goes through the `OtpSender` abstract class, so a real SMS provider plugs in there.
- Unknown phone → `NEEDS_REGISTRATION` with a 15-minute registration JWT → `POST /api/auth/register`.
- **Registration requires a `profile`** (city, `dateOfBirth` YYYY-MM-DD with an 18+ check in IST that returns `UNDERAGE`, optional gender, up to 5 `INTERESTS`, and an optional bio of at most 160 characters). Validation is in `apps/api/src/users/profile.schemas.ts`. `PATCH /api/users/me` edits everything except date of birth, which is immutable; sending `null` clears gender or bio.
- Everyone registers as `NORMAL`. Celebrity and organizer sign-ups create a `RoleApplication` (PENDING), and the role changes only in `ApplicationsService.approve`, a single transaction. Support agents are created only by the admin (`/api/admin/support-agents`). Admin accounts are never self-registered.
- **Tokens:**
  - The access JWT lasts 15 minutes and is sent as a Bearer header.
  - The refresh token is opaque and rotating. Only its hash is stored in `AuthSession`; it is grouped by `familyId`, and reuse after a 30-second grace window revokes the whole family.
  - Web gets the refresh token as an httpOnly cookie `fc_refresh` on path `/api/auth`. Mobile sends `X-Client: mobile` and gets it in the body.
- **Global guards:**
  - `JwtAuthGuard` requires a token on every HTTP route unless it is marked `@Public()`. It loads the user from the database on each request, so blocks and role changes apply immediately.
  - `RolesAndRestrictionGuard` enforces `@Roles(...)`.
- **Sockets:** `SocketAuthAdapter` rejects connections without `auth.token`. Gateways read `client.data.user` and never take a userId from the message payload.
- **Request validation:** use `ZodValidationPipe`. Errors are `{statusCode, message, code}`, and the codes are listed in `AUTH_ERROR_CODES` in contracts.

**Still on the in-memory `StoreService`:** celebrities, events, wallet, support and calls/matchmaking. Phases 2–4 move them to Prisma. Their in-memory `usr-…` ids don't match real user ids.

**Call rules:**
- `packages/contracts` defines `CALL_TYPES`, `isVideoAllowed`, `isPaidCall`. Use these instead of re-listing call types anywhere.
- Support (`SUPPORT_AUDIO`) and all `*_AUDIO` calls must never carry video.
- Planned enforcement (Phase 2) is server-side, through LiveKit token grants. The current SDP-stripping in `webrtc-signaling.gateway.ts` and the plain `RTCPeerConnection` client in `apps/web/src/lib/webrtc-client.ts` are interim and will be replaced by LiveKit.

**Web:**
- **Auth client:** `src/lib/api.ts` keeps the access token in memory, sends `credentials: 'include'` and refreshes once on a 401. `src/lib/auth.tsx` provides `AuthProvider`, `useAuth()` and `RequireAuth` for client-side route protection; there is no Next middleware, because the refresh cookie is scoped to the API path.
- **Routes:** `/login`, `/register`, `/admin/applications`, `/admin/support-agents`.
- `page.tsx` shows the view for the logged-in user's real role, but its content (coins, celebrities, events) is still mock data until Phases 2–4.
- **Ownership:** a parallel redesign session owns the visual layer: `globals.css`, `tailwind.config.ts`, `components/ui/*` and new pages. Keep `lib/api.ts` and `lib/auth.tsx` as the only auth logic.

**Removed:** the old single-file demo (`docs/index.html`, port 5050, GitHub Pages, public MQTT/PeerJS signaling) was deleted in Phase 0. Don't reintroduce that approach. `notes/demo-salvage.md` lists the UX behaviour to rebuild and how to read the old file from git history.

## Gotchas

- `apps/api` dev runs `ts-node-dev --transpile-only`, so type errors only show in `npm run typecheck`.
- `apps/api/.env` and `apps/web/.env.local` are gitignored; copy them from the `.example` files.
- The Prisma seed lives outside `src/`, so `tsc` doesn't typecheck it; it is checked when `npm run db:seed` runs.
- Don't run `npm run build` while `npm run dev` is running: `next build` overwrites `apps/web/.next`, and the dev server then serves a broken page. Stop dev, `rm -rf apps/web/.next`, and restart.
- **Cookies:** all browser tabs share one session cookie, so testing two accounts at once needs two browser profiles (or one normal window plus one incognito window).
- `migrate diff` needs a shadow database. Use `--shadow-database-url postgresql://fc_admin:fc_secret_pass@localhost:5433/fc_shadow` (create `fc_shadow` once); never point it at a real database, because Prisma wipes the shadow database.
