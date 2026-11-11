# Testing guide

How to run Friends Connect locally and walk through every sign-in and onboarding flow.

## Run it

```bash
npm install
npm run infra:up          # Postgres, Redis, LiveKit in Docker
npm run db:deploy         # apply migrations
npm run db:seed           # test accounts below (safe to re-run; resets their data)
npm run dev               # API on :4000, web on :3000
```

Open http://localhost:3000. In development the login code is always **123456**.

If you run the web app on a port other than 3000, start the API with
`CORS_ORIGINS=http://localhost:<web port>` and set `NEXT_PUBLIC_API_URL` in `apps/web/.env.local`.

## Test accounts

Everyone signs in the same way, with a phone number and code. The account's role decides where they land.

| Phone        | Name            | Role                       | Lands on                         |
| ------------ | --------------- | -------------------------- | -------------------------------- |
| 98765 43210  | Arjun Nair      | Member                     | /home                            |
| 98765 43211  | Meera Krishnan  | Member                     | /home                            |
| 99999 00003  | Nivin Rajan     | Member, creator applicant  | /home with "being reviewed"      |
| 98888 00002  | Malabar Events  | Member, host applicant     | /home with "being reviewed"      |
| 99999 00001  | Dulquer Sithara | Creator                    | creator dashboard (old design)   |
| 99999 00002  | Ananya Menon    | Creator                    | creator dashboard (old design)   |
| 98888 00001  | Kochi Live Arena| Event host                 | host dashboard (old design)      |
| 97777 00001  | Rahul           | Support agent              | support dashboard (old design)   |
| 90000 00001  | Platform Control| Admin                      | /admin/applications              |

Any other number is a new user and goes to sign-up after the code.

## Flows to check

1. **Landing.** Open `/` while logged out: you land on `/welcome`. Log in, then open `/welcome` again: you are sent into the app, and public pages show "Open app" instead of "Log in".
2. **New member.** Log in with an unused number, choose "Just me", fill in your details and create the account. You land on `/home`, and Profile shows your name and number.
3. **New creator from the landing page.** `/welcome`, then "Apply as a creator", then log in with an unused number. Sign-up opens with "I am a creator" already selected. After sign-up, `/home` shows "Your creator application is being reviewed".
4. **New host.** Same as 3, from "Start hosting" on `/hosts`.
5. **Existing member applies.** Log in as Arjun, open `/creators` and choose "Apply as a creator". `/apply` opens; send it, and the review notice appears. Applying twice is refused.
6. **Admin approval.** Log in as Platform Control: `/admin/applications` lists the waiting applications with their details. Approve or decline, optionally with a note.
7. **After approval.** Log back in as the applicant, or press "Check status" on `/home`: the account opens its role dashboard. A declined applicant sees the note and can apply again.
8. **Support agents.** As admin, open Support agents and add a number. That number can now log in as a support agent.
9. **Log out** from Profile (members) or the admin header. You return to `/welcome`.

## Not built yet

- Creator, host and support dashboards still use the old dark design and mock data.
- Stars, Events, Wallet, Match, Calls and Support chat on the member side use placeholder data until their APIs exist.
