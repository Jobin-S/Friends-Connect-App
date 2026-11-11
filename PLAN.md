# Friends Connect — Product Build Plan

Status: **Phase 0 done (2026-11-10). Phase 1 (auth) implemented (2026-11-11), awaiting review. Next: Phase 2 (calling).** Each phase is reviewed before the next starts.

**Decided:**
- Database: PostgreSQL (+ PostGIS) with Redis.
- Hosted Postgres: **Supabase**; see `notes/supabase-setup.md`.
- The 5050 demo and the GitHub Pages site are removed.

---

## 1. Where we are today (honest assessment)

| Piece | What it really is | Usable for the product? |
|---|---|---|
| `docs/index.html` (localhost:5050, GitHub Pages) | A 3,100-line single-file demo. All state lives in the browser. Calls are signaled through a **public MQTT broker** (`broker.emqx.io`) and the free PeerJS cloud. Anyone who knows the topic name can read or inject call signaling. | **No.** Its UX flows are good reference material; its architecture can't be shipped. |
| `web/` (localhost:3000, Next.js) | One 1,500-line page. It calls the backend for no data at all; users, coins, celebrities and events are hard-coded React state. The "role tabs" switch views, not accounts. | Partly. Keep Next.js and Tailwind; rebuild the pages. |
| `backend/` (NestJS) | Good module layout (auth, calls, wallet, events, support, admin, matchmaking). All data lives in in-memory `Map`s, the OTP is always `123456`, and there is no JWT, so any client can claim any `userId`. | **Yes, as the skeleton.** It needs a real database, auth and call orchestration. |
| `backend/prisma/schema.prisma` | A solid first schema (users, wallets, ledger, calls, events, tickets), never migrated or used. | Yes, with additions. |
| `docker-compose.yml` | Postgres+PostGIS, Redis, LiveKit (dev). | Yes. |
| `android/`, `ios/` | One or two skeleton files each (CallKit / ConnectionService stubs). | Starting point only. |

**Uncommitted work from earlier sessions:** the `web/postcss.config.js` fix (keep) and a first ringing gateway plus web call UI (`backend/src/calls/call-ringing.gateway.ts`, `web/src/app/page.tsx`). Phase 2 replaces the ringing code, so I'll keep the CSS fix and discard the rest when we start.

---

## 2. Target architecture

```
                ┌──────────── Clients ─────────────┐
                │  Web (Next.js)  Android  iOS      │
                └───┬──────────────┬───────────┬────┘
        REST (JWT)  │  Socket.io   │  Media    │  VoIP push
                    ▼              ▼           ▼     (FCM / APNs PushKit)
          ┌──────────────────────────┐   ┌──────────────┐
          │  API + Realtime (NestJS) │──▶│  LiveKit SFU │ (media, TURN built in)
          │  auth · calls · wallet · │◀──│  webhooks    │
          │  match · events · support│   └──────────────┘
          └─────┬───────────┬────────┘
                ▼           ▼
          PostgreSQL     Redis
          (PostGIS)      (presence, queues, OTP, rate limits,
                          Socket.io adapter, locks)
```

### Key decisions and why

1. **Media goes through LiveKit, not hand-rolled peer-to-peer WebRTC.**
   - LiveKit is already in `docker-compose.yml`, and it has official web, Android and iOS SDKs. That covers three platforms with one media stack.
   - It has TURN relay built in. Most of the demo's past fixes ("works on mobile data", "TURN relays") were fighting exactly this problem.
   - **Audio-only is enforced on the server.** For `SUPPORT_AUDIO` and `*_AUDIO` calls, the backend issues a token whose `canPublishSources` contains only the microphone. A modified client can't send video. Today's approach of rewriting the SDP can be bypassed.
   - It leaves room for recording and moderation later without rewriting.
2. **Our backend owns the call lifecycle; LiveKit only carries audio and video.**
   - The backend runs a call state machine: `RINGING → ACCEPTED → CONNECTED → ENDED` (plus `REJECTED`, `MISSED`, `CANCELLED`, `FAILED`).
   - Ringing goes through Socket.io presence for open apps and VoIP push for closed mobile apps.
   - Ring timeout is 30s, then `MISSED`.
   - One active call per user is enforced with a Redis lock.
3. **Billing is computed only on the server, never on the client.**
   - The first minute is placed on hold when the call is accepted.
   - Per-minute debits come from LiveKit `participant_joined`/`left` webhooks plus a server-side ticker.
   - The call ends automatically when the balance can't cover the next minute.
   - Every coin movement is a row in an append-only ledger with an idempotency key. The wallet balance is derived from that ledger, so it is never overwritten.
4. **Real auth.**
   - Phone OTP goes through an SMS provider. OTPs are stored hashed in Redis with a TTL and rate limits.
   - Sessions use a 15-minute JWT access token and a rotating refresh token.
   - The socket handshake carries the JWT, so `userId` always comes from the token and never from the client payload.
   - The existing `RolesAndRestrictionGuard` becomes real.
5. **One API contract for all three clients.** Nest generates an OpenAPI spec, and typed clients are generated from it for web (TypeScript), Android (Kotlin) and iOS (Swift). Socket event payloads live in one shared `packages/contracts` TypeScript package.
6. **Monorepo with npm workspaces:** `apps/api`, `apps/web`, `packages/contracts`, and `mobile/android`, `mobile/ios`.

---

## 3. What to salvage from the 5050 demo before deleting it

**Take (as behaviour and UX reference, rewritten cleanly):**
- **Incoming-call flow:** a full-screen popup with Accept and Reject, ringback tone for the caller, ringtone for the receiver, and the tone stopping the moment the call is answered.
- **Call screen:** connection states (Ringing, Connecting, Connected, Reconnecting), mute, camera toggle, remote "camera off" indicator, call timer, and a coins-charged counter for celebrity calls.
- **Network check** on the call screen (from the removed commit `18416ce`, still recoverable by its hash).
- **Camera fallback:** if the camera is busy or blocked, continue with voice and tell the user (the fix from this week).
- **Celebrity screen:** "listening for fan calls" status and an earnings counter. **Support:** agent-initiated audio call to a user or celebrity.
- **Demo seed accounts** (Arjun, Meera, Dulquer, Rahul, Admin) become a database seed script for local development.

**Leave behind:** public MQTT, PeerJS cloud, BroadcastChannel/localStorage signaling, and the JPEG-frame and PCM-chunk "bridges". These are insecure workarounds that LiveKit replaces.

**Delete:** `docs/`, the root `index.html`, `web/preview-server.js` and `.github/workflows/deploy-pages.yml`.
⚠️ Deleting these **takes the public GitHub Pages site offline.** The Netlify TURN function only existed in the removed commits, so nothing else depends on it.

---

## 4. Phased delivery

Each phase ends with something you can run and test. Estimates assume one engineer working full time with AI assistance.

### Phase 0 — Cleanup and foundation ✅ done
- Salvage notes from §3, then delete the demo files and the Pages workflow.
- Restructure into the monorepo.
- `.env.example` with config validated at boot (fail fast).
- ESLint and Prettier.
- CI on GitHub Actions: typecheck, lint, test, build.
- `docker compose up` brings up Postgres, Redis and LiveKit; `npm run dev` starts the API and web app.
- Prisma migrations and a seed script with the demo accounts.

### Phase 1 — Accounts and auth ✅ implemented (detailed plan: phone OTP, registration with admin-approved celebrity/organizer roles, admin-created support agents)
- OTP send and verify, using a fake SMS sender in dev that logs the code.
- JWT access and refresh tokens; logout and refresh endpoints.
- Profile; role assignment (only an admin can create a celebrity, org or support account).
- Account status: blocked or suspended accounts are rejected everywhere.
- Web: real login, an authenticated layout and role-based navigation. One account per browser session replaces the role tabs.
- **Done when:** two browsers are logged in as two different real accounts.

### Phase 2 — Real calling system (≈ 2–3 weeks) ← your priority
- **Backend `calls` module:**
  - `POST /calls` (target user + mode) → creates a `CallSession` and checks role permissions, the call matrix, blocks, daily limits and balance.
  - Ring the receiver over Socket.io: `call:incoming`, `call:accepted`, `call:rejected`, `call:cancelled`, `call:ended`.
  - Accept → issue LiveKit tokens to both sides, with audio-only grants where required.
  - Ring timeout, a single active call per user, and an end reason recorded for every call.
  - LiveKit webhooks record the real connect and disconnect times.
- **Presence:** online, busy (in a call) and offline in Redis; a celebrity's availability toggle is respected.
- **Web call client** using `livekit-client`: incoming-call popup, call screen, device permission handling and the camera fallback.
- **The call matrix from the README, enforced in one server-side policy function:**

  | Call | Audio | Video | Billing |
  |---|---|---|---|
  | User ↔ user (random) | ✅ | ✅ | Free |
  | User → celebrity | ✅ | ✅ | Paid in coins |
  | User or celebrity ↔ support | ✅ | ❌ | Free |
- **Done when:**
  - Two browsers on different networks (Wi-Fi and phone hotspot) complete all five call types.
  - A support call can't send video even from a modified client.
  - An automated Playwright test with a fake camera covers every call type.

### Phase 3 — Wallet and payments (≈ 1–1.5 weeks)
- Ledger service with hold, capture, refund and credit to the celebrity minus the platform commission (rate to be agreed).
- Per-minute metering tied to the call; auto-end when the balance runs out.
- Recharge with Razorpay. The client creates an order, and the payment is confirmed only by a verified webhook.
- Transaction history and the celebrity earnings view.

### Phase 4 — Random matching, support, events, admin (≈ 2 weeks)
- **Random matching:** Redis queue per mode, skipping blocked pairs; the match is found on the server and the call is created through the Phase 2 flow. Report and block after a call.
- **Support:** tickets and live chat over Socket.io; agent assignment; the agent can start an audio-only call.
- **Events:**
  - Organizations create events and ticket tiers.
  - Nearby search with PostGIS.
  - Booking is free first; paid tickets reuse the Phase 3 payments.
  - The QR code is a signed token, verified at the door by the organization's scanner.
- **Admin:** overview metrics, user moderation (restrict, suspend, block), report review, celebrity verification and the call log.

### Phase 5 — Mobile apps (≈ 4–6 weeks per platform; Android and iOS can run in parallel)
- **Shared:** generated API client, login, the same call flows using the LiveKit Android and iOS SDKs.
- **Android:** `ConnectionService` / Telecom for the native call UI, FCM high-priority data messages for incoming calls while the app is closed, and a foreground service during calls.
- **iOS:** CallKit with **PushKit VoIP push**, which Apple requires for ringing when the app is closed. Audio session handling.
- Backend: device token registration, plus a push sender that runs when the receiver has no live socket.

### Phase 6 — Production hardening (≈ 1–2 weeks, partly in parallel)
- **Hosting (proposal):** the API in containers (Render, Fly.io, or AWS ECS); managed Postgres and Redis; LiveKit Cloud to start, self-hosted later if cost requires it.
- Socket.io Redis adapter so the API can run more than one instance.
- **Observability:** structured logs, error tracking (Sentry) and call quality metrics from LiveKit.
- **Security:** rate limits, input validation, CORS restricted to our domains, and secrets in the hosting platform.
- **Compliance:** India DPDP Act (consent, data deletion), app store policies for paid calls (Apple may require in-app purchase for coins; needs a decision before the iOS launch), and age gating.

**Rough total to a web beta: ~8–10 weeks** (Phases 0–4). **Mobile beta: +5–6 weeks.**

---

## 5. Testing strategy
- **Unit:** call policy matrix, ledger maths, state machine transitions.
- **Integration:** API against real Postgres and Redis in Docker; LiveKit webhooks simulated.
- **End-to-end:** Playwright drives two browsers with fake camera and microphone through every call type. This is the same technique used this week to reproduce the video bug.
- **Manual device matrix before each release:** Chrome, Safari and Firefox, plus Android and iPhone on Wi-Fi and mobile data.

---

## 6. Decisions I need from you

1. ~~Delete the public GitHub Pages demo?~~ **Done in Phase 0.** Also turn off Pages in GitHub → Settings → Pages so the old site stops being served.
2. **LiveKit Cloud or self-hosted?** I recommend Cloud for launch: no TURN or server operations, and a free tier for development.
3. **SMS OTP provider:** MSG91 (India-first, cheapest), Twilio Verify, or Firebase Phone Auth.
4. **Payments:** Razorpay (recommended for ₹), or something else?
5. **Celebrity revenue share:** what % goes to the platform?
6. **Hosting preference or budget** for the API and database.
7. **Commit history:** the removed commits show another author (Nikhil). Is this repo shared with a teammate whose work we should coordinate with?

Once you approve (with any changes), I'll start with **Phase 0**, show you the result, and only then move to Phase 1.
