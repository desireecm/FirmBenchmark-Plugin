# Decisions Log

Answers to PLAN.md Section 14, plus build decisions made along the way.
Status key: **Confirmed** = Desire'e answered. **Provisional** = a default we're
using until someone confirms it. Every Provisional item can be changed in the app
(Admin → Settings / Clients) without a code change.

Last updated: 2026-10-20

## Section 14 answers

| #   | Question                                                             | Decision                                                                                                                                                                                                                                                                                 | Status                     |
| --- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 1   | Rates                                                                | **$165/hr for every client.** The per-client rates in the Hosting tab are not imported. Monthly hours are **recalculated** as Amount ÷ $165 (e.g. $800 → 4.85 hrs), not taken from the sheet's Hours column (which used $155). An admin can still set an hours override on any retainer. | Confirmed                  |
| 1a  | RNH ($500 → 10 hrs), Flammia ($945 → 10 hrs), BKBH ($1,600 → 10 hrs) | Imported at Amount ÷ $165 (RNH 3.03, Flammia 5.73, BKBH 9.70) and **flagged for review**, because the sheet's hours don't match Amount ÷ $155 either. An admin decides whether to set an override.                                                                                       | Provisional                |
| 2   | Conflicting budgets (Tuckner, Shapiro, Holleman)                     | Use the **Client Budgets** tab figure as a placeholder: Tuckner $1,600, Shapiro $3,750, Holleman $1,675. Flagged for review and editable in the app.                                                                                                                                     | Confirmed (placeholder)    |
| 3   | Google Ads management ($310 / 2 hrs)                                 | Separate `MONTHLY_RETAINER` engagement per client ("Google Ads Mgmt"), `countsTowardRetainer = false`.                                                                                                                                                                                   | Provisional                |
| 4   | Ad spend                                                             | Excluded from hours entirely; kept as a client note.                                                                                                                                                                                                                                     | Provisional                |
| 5   | All logged time vs. approved-only                                    | All logged time (setting `usage.approvedOnly = false`).                                                                                                                                                                                                                                  | Provisional                |
| 6   | Billable goals                                                       | Firm target = sum of active retainer hours + planned one-off hours. No per-person targets until provided.                                                                                                                                                                                | Provisional — need numbers |
| 7   | Minute7 customer naming                                              | Unknown. The resolver tries exact match, then the parent before `:`. Confirm from a real export in Phase 3.                                                                                                                                                                              | Open                       |
| 8   | Mid-month retainer changes                                           | Take effect on the 1st of the next month. The term in effect on the 1st applies to the whole month.                                                                                                                                                                                      | Provisional                |
| 9   | Checkpoints                                                          | 10th, 15th, 20th, 25th (next business day if a weekend); alert when paceRatio < 0.70.                                                                                                                                                                                                    | Provisional                |
| 10  | Who gets which email                                                 | Whole team gets the daily digest. Admins: **Desire'e** (others to be named).                                                                                                                                                                                                             | Provisional                |
| 11  | Overage handling                                                     | Default policy `REVIEW`: overage $ is calculated and shown, but flagged for review before invoicing.                                                                                                                                                                                     | Provisional                |
| 12  | Holidays                                                             | Holiday list is admin-editable; ships empty. Need the company list.                                                                                                                                                                                                                      | Open                       |
| 13  | Zoho                                                                 | Off at launch (setting `zoho.enabled = false`).                                                                                                                                                                                                                                          | Provisional                |
| 14  | Shared mailbox                                                       | Unknown whether `reports@esquireinteractive.com` exists.                                                                                                                                                                                                                                 | Open                       |
| 15  | M365 / Entra ID admin                                                | Unknown — needed to approve the two app registrations.                                                                                                                                                                                                                                   | Open                       |
| 16  | Hosting                                                              | Vercel + Neon Postgres, owned by Desire'e.                                                                                                                                                                                                                                               | Provisional                |

## Build decisions

- **Repo location:** the app lives in `/hours-tracker` inside the `FirmBenchmark-Plugin`
  repo (Desire'e's choice). It's self-contained, so it can move to its own repo later
  with no code changes. In Vercel, set the project's Root Directory to `hours-tracker`.
- **Versions pinned:** Next.js 15.5, React 19.1, Prisma 6.19 (not the 8.x release
  candidate), Auth.js v5 beta, Tailwind CSS 4, Vitest 3.
- **Team emails:** only Desire'e's address is known. The other team members are seeded
  with `@placeholder.invalid` addresses, so they **cannot sign in** until an admin sets
  their real M365 email. This is deliberate: a wrong guess would let the wrong account in.
- **Holidays** are stored in their own `Holiday` table instead of a JSON setting, so they
  can be listed, edited, and audited like any other record.
- **Overage $:** `ABSORB` → $0; `BILL_AT_RATE` → hours × rate; `REVIEW` → hours × rate,
  flagged as needing review.
- **Hours math** is done in integer hundredths of an hour inside `lib/calc`, so
  sums never drift (e.g. 0.1 + 0.2 ≠ 0.3 in floating point).

## Cron schedule (Central time intent)

Vercel Cron runs in UTC. Per PLAN.md §15, jobs will run on an hourly trigger that checks
the local America/Chicago time and dedupes, so daylight saving needs no manual edits.
Intended Central times: sync 5:30 AM (+ 12:00 PM, 5:00 PM weekdays), digest 7:00 AM,
checkpoints 8:00 AM, weekly Mon 7:30 AM, month-close 9:00 AM 1st business day,
task generation 12:05 AM on the 1st. (Built in Phases 3, 5, 6.)
