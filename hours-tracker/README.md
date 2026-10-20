# EI Hours Tracker

Retainer and billable-hours tracker for Esquire Interactive. The build plan is in
[PLAN.md](PLAN.md), and the answers and defaults it depends on are in
[docs/decisions.md](docs/decisions.md).

## Build status

| Phase                        | Status                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------- |
| 0 — Discovery & setup        | Scaffolded. Waiting on Entra ID app registration, Vercel project, Minute7 fixture |
| 1 — Data model & calc engine | Done: Prisma schema + migration, `lib/calc` (100% coverage), seed                 |
| 2 — Google Sheet import      | Not started (needs a sheet export with the passwords tab removed)                 |
| 3–7                          | Not started                                                                       |

## Stack

Next.js 15 (App Router) · TypeScript · PostgreSQL + Prisma 6 · Auth.js v5 with Microsoft
Entra ID · Tailwind CSS 4 · Vitest · Playwright. Hosted on Vercel.

## Local setup

```bash
cd hours-tracker
cp .env.example .env          # then fill in DATABASE_URL and the AUTH_* values
npm install
npx prisma migrate dev        # creates the tables
npm run db:seed               # team, sample clients, default settings
npm run dev                   # http://localhost:3000
```

## Checks

```bash
npm test                # unit tests
npm run test:coverage   # enforces ≥90% coverage on lib/calc
npm run typecheck
npm run lint
npm run test:e2e        # starts the dev server and runs Playwright
```

## Deploying to Vercel

1. Import the GitHub repo in Vercel and set **Root Directory** to `hours-tracker`.
2. Add the environment variables from `.env.example` (real values only in Vercel).
3. Run `npm run db:deploy` against the production database, then `npm run db:seed` once.

## Sign-in setup (Entra ID)

Create an app registration in the Esquire Interactive tenant:

- Supported account types: **this organizational directory only**.
- Redirect URI (Web): `https://<your-domain>/api/auth/callback/microsoft-entra-id`, plus
  `http://localhost:3000/api/auth/callback/microsoft-entra-id` for local dev.
- Put the client ID, a client secret, and
  `https://login.microsoftonline.com/<TENANT_ID>/v2.0` into the `AUTH_MICROSOFT_ENTRA_ID_*`
  variables.

Sign-in also requires the person to be an **active user in the app's User table**. Team
members other than Desire'e are seeded with placeholder emails, so they can't sign in until
an admin enters their real address.

## Security

- The Google Sheet's **passwords** tab is never read or imported (PLAN.md §3.2).
- No secrets in the repo. `.env` is git-ignored; `.env.example` holds placeholders only.
