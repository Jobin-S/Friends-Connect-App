# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Friends Connect is a social discovery / celebrity-call / event-ticketing product, being rebuilt from a prototype into a real product in phases. **[PLAN.md](PLAN.md) is the source of truth for the architecture and the current phase. Read it before starting work.** The user reviews and approves each phase before code is written.

It is an npm-workspaces monorepo:
- `apps/api` (NestJS)
- `apps/web` (Next.js 14 + Tailwind)
- `packages/contracts` (shared types and call rules)
- `mobile/android`, `mobile/ios` (skeletons until Phase 5)

There are no tests yet.

## Commands (run from the repo root)

```bash
npm install
npm run infra:up          # docker compose: Postgres+PostGIS on host port 5433 (not 5432), Redis 6379, LiveKit 7880
npm run db:deploy         # apply Prisma migrations
npm run db:seed           # idempotent demo data
npm run dev               # builds contracts, then API :4000 + web :3000
npm run typecheck && npm run lint && npm run format:check   # same as CI (.github/workflows/ci.yml)
npm run build
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

**Current state of the API (Phase 0):**
- `PrismaService` and the schema exist, but the domain controllers (auth, calls, wallet, events, support, admin, celebrities, matchmaking) still read the old in-memory `StoreService`.
- Phases 1–4 move each module onto Prisma.
- Auth is still fake: OTP is `123456` and there is no JWT, so `userId` comes from the client.

**Call rules:**
- `packages/contracts` defines `CALL_TYPES`, `isVideoAllowed`, `isPaidCall`. Use these instead of re-listing call types anywhere.
- Support (`SUPPORT_AUDIO`) and all `*_AUDIO` calls must never carry video.
- Planned enforcement (Phase 2) is server-side, through LiveKit token grants. The current SDP-stripping in `webrtc-signaling.gateway.ts` and the plain `RTCPeerConnection` client in `apps/web/src/lib/webrtc-client.ts` are interim and will be replaced by LiveKit.

**Web:** `apps/web/src/app/page.tsx` is still a single hard-coded mock page. Its role tabs switch views, not accounts, and it fetches no data from the API. Phase 1+ replaces it with real routes.

**Removed:** the old single-file demo (`docs/index.html`, port 5050, GitHub Pages, public MQTT/PeerJS signaling) was deleted in Phase 0. Don't reintroduce that approach. `notes/demo-salvage.md` lists the UX behaviour to rebuild and how to read the old file from git history.

## Gotchas

- `apps/api` dev runs `ts-node-dev --transpile-only`, so type errors only show in `npm run typecheck`.
- `apps/api/.env` and `apps/web/.env.local` are gitignored; copy them from the `.example` files.
- The Prisma seed lives outside `src/`, so `tsc` doesn't typecheck it; it is checked when `npm run db:seed` runs.
