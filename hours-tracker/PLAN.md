# Esquire Interactive: Retainer & Billable Hours Tracker
## Build Plan for Claude Code

**Prepared for:** Desire'e / Esquire Interactive
**Prepared:** October 20, 2026
**Status:** Ready to build. Resolve the questions in Section 14 during Phase 0.

---

## 0. How to Use This Document

Paste or drop this file into a new, empty repository as `PLAN.md`, then start Claude Code with this prompt:

> Read PLAN.md end to end. Build the system it describes phase by phase, in order. Before you write any code, go through Section 14 (Open Questions) with me and record the answers in `docs/decisions.md`. After each phase, run the acceptance checks for that phase and show me the results before you start the next one. Never hard-code credentials. Never import the "passwords" tab of the Google Sheet.

Each phase ends with **acceptance criteria**. Treat them as the definition of done.

---

## 1. Problem & Goals

Esquire Interactive is missing its billable-hour goals. There's no single, current view of how many retainer hours each client has used, how many are left, and whether the team is on pace partway through the month. Today, retainer data lives in a Google Sheet ("Client Monthly Budgets/Potential Work – Original"), and time is logged in Minute7.

### Goals

1. **One source of truth** for every monthly retainer client: dollar retainer, hourly rate, hours per month, and who works on it.
2. **Automatic daily import** of all time entries from Minute7 through its API. No manual re-keying.
3. **Live usage tracking:** hours used, hours remaining, % used against % of the month elapsed (pace), and overage hours and dollars, for each client and team member.
4. **Recurring monthly task lists** for each retainer client. They generate automatically each month, track completion, link to logged hours, and can optionally push to Zoho Projects.
5. **One-off projects and other billable work** tracked separately from retainers. This covers fixed-budget projects, hourly-billed projects, and ad-hoc billable time.
6. **A secure team web app** that everyone signs in to with their Microsoft 365 account.
7. **Email reports and reminders through Microsoft 365:** a daily digest, pace alerts at checkpoints, a weekly status report, and a month-end close report.

### Non-goals (v1)

- Invoicing or payments. QuickBooks and Minute7 continue to handle billing. The app *reports* overages for invoicing but doesn't create invoices.
- Replacing Minute7 for time entry. The team keeps logging time in Minute7.
- A client-facing portal. The data model should allow one later (see Section 13).

---

## 2. Decisions Already Made

| Decision | Choice |
|---|---|
| Time data source | **Minute7 API**, per the [Minute7 API Guide](https://www.minute7.com/about/api-guide) |
| App type | **Standalone web app** with team logins, not a WordPress section |
| Email | **Microsoft 365 / Outlook**, sent through Microsoft Graph |
| Retainer structure | **Dollar amount ÷ hourly rate = monthly hours.** **Overages are billed separately.** No rollover. |
| Visibility | **Small team, everyone sees everything**, including dollars and rates. A separate *admin* flag controls who can edit settings. |
| Tasks | **Built into the app**, with an **optional push to Zoho Projects** |
| Alerts | **Pace checkpoints**, a **daily team digest**, and a **weekly + month-end report** |

---

## 3. What the Current Google Sheet Tells Us

I reviewed the sheet's tabs. The importer and data model are designed around what's actually there.

### 3.1 Tabs and how each one is used

| Tab | Use in the new system |
|---|---|
| **Client Budgets** | **Primary import.** Columns: Client Name, One-Time Project \| Monthly Budget, Amount, Hours, Nature of Work, Responsible Party, Notes. |
| **Monthly Client Work by Team Member** | **Import as task templates and per-person hour allocations.** Columns: Client, Responsible Party, Task, Quantity, Client Monthly Budget Balance, Hours, Amount of Billables, Nature of Work, Complete?, Notes, Work Outside of Initial Scope. |
| **Google Ads Clients \| Bren** | Import as a **service line** (Google Ads management, 2.00 hrs / $310 per month per client). See Open Question Q3. |
| **SEO Clients \| Jeremy** | Reference only. Its figures conflict with Client Budgets (see 3.3). |
| **Hosting** | Gives each client's **hourly rate** (mostly $145–$165) and annual or monthly hosting fees. Import the hourly rate per client. Hosting fees stay out of v1, though they could become a later "recurring non-hour revenue" feature. |
| **Potential Work** | Out of scope for v1. It could later become a pipeline view. |
| **Directory Listings 2025, FirmMetrics, Initiatives** | Out of scope for v1. Directory listings could become task templates. |
| **passwords** | ⚠️ **Never read, import, or store.** See 3.2. |

### 3.2 ⚠️ Security issue to fix now, separate from the build

The sheet has a **"passwords" tab with plaintext WordPress admin usernames and passwords** for more than 100 client sites. The sheet was shared with a "usp=sharing" link. Before the build starts:

- Move these credentials into a password manager (for example 1Password Business or Bitwarden), then **delete the tab**.
- Check the sheet's sharing settings and limit access to named team members.
- Consider rotating the passwords, since anyone who had the link could have seen them.
- The importer must skip that tab by name, and Claude Code must never read it.

### 3.3 Data inconsistencies to resolve during Phase 0

The math in Client Budgets implies a **default rate of $155/hr**. For example, $800 ÷ $155 = 5.16 hrs, $3,750 ÷ $155 = 24.19 hrs, and $15,000 ÷ $155 = 96.77 hrs. These rows don't fit that pattern:

| Client | Amount | Hours in sheet | Implied rate | Notes |
|---|---|---|---|---|
| BKBH | $1,600 | 10.00 | $160 | Matches BKBH's $160 rate in the Hosting tab. Probably correct. |
| RNH | $500 | 10.00 | $50 | **Verify.** It may be a discounted arrangement or an error. |
| Flammia | $945 | 10.00 | $94.50 | **Verify.** The note says "9 social media posts 1 review," so this may be deliverable-based pricing. |
| Johnson Pope | "Hourly Billing" | — | — | A one-off project billed hourly with no cap. |

**Budget conflicts for the same client:**

- **Tuckner:** $1,600/mo in Client Budgets, $2,000 in SEO \| Jeremy and Potential Work, and the team allocations in "Monthly Client Work" add up to **$3,000** (19.35 hrs). Which figure is the real retainer?
- **Shapiro:** $3,750 in Client Budgets but $3,000 in SEO \| Jeremy and Potential Work.
- **Holleman:** $1,675 in Client Budgets but $1,600 in Potential Work. The Notes say the firm also pays ad spend, which should **not** count as billable hours.

**Design implication:** the app must let an admin set the **hours override** separately from Amount ÷ Rate, and it must keep **effective-dated retainer history** so changes over time are recorded rather than overwritten.

### 3.4 Team members found in the sheet

Desire'e, Jeff, Kelly, Randi, Brittany, Hazar, Chris, Bren, Karlyn, Jeremy. Seed these as users and match them to Minute7 employee names during setup. Note that "Hazar & Chris" is shared on one row, so allocations need to support multiple assignees.

---

## 4. Recommended Tech Stack

The stack is chosen for low maintenance, low cost, and easy hosting. Claude Code may suggest equivalents, but should explain why before swapping anything.

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | One codebase for UI, API routes, and scheduled jobs |
| Database | **PostgreSQL**, hosted on **Neon** or **Supabase** | Relational data (clients → retainers → entries) and solid date math |
| ORM | **Prisma** | Typed schema and migrations |
| Auth | **Auth.js (NextAuth) with the Microsoft Entra ID provider** | Team signs in with existing @esquireinteractive.com M365 accounts, so there are no new passwords. Restricted to the company tenant. |
| UI | **Tailwind CSS + shadcn/ui**, with **Recharts** for charts | Fast, clean, accessible |
| Hosting | **Vercel** (already connected to Claude) | Simple deploys, plus Vercel Cron for scheduled jobs |
| Scheduled jobs | **Vercel Cron** calling protected API routes | Daily sync, alerts, and reports |
| Email | **Microsoft Graph `sendMail`** from a shared mailbox (for example reports@esquireinteractive.com) | Mail comes from your own domain |
| Secrets | Vercel environment variables (encrypted) | Never stored in the repo |
| Testing | **Vitest** (unit), **Playwright** (end-to-end) | Covers the calculation engine and key screens |
| Domain | `hours.esquireinteractive.com` (CNAME to Vercel) | Branded and separate from the marketing site |

**Rough ongoing cost:** likely somewhere around $0–$50/month at your scale (Vercel Hobby or Pro, plus a free or starter Postgres tier). Confirm current pricing on each vendor's site before committing. These are estimates, not verified figures.

---

## 5. Data Model

Write this as a Prisma schema. All money is stored as integer **cents**, all hours as **decimal(8,2)**, and all dates as `date` in **America/Chicago** for month boundaries. Every table gets `id`, `createdAt`, and `updatedAt`.

### 5.1 Core entities

```
User
  email (unique, M365), name, isAdmin (bool), isActive
  minute7EmployeeNames  String[]     // exact Minute7 "employee" strings mapped to this user
  monthlyBillableTarget Decimal?     // personal billable-hour goal (Q6)
  weeklyCapacityHours   Decimal?     // for utilization views

Client
  name, shortName, status (ACTIVE | PAUSED | ARCHIVED)
  defaultHourlyRateCents Int         // e.g., 15500; from the Hosting tab, default $155
  primaryContactUserId → User        // "Responsible Party"
  natureOfWork String[]              // SEO, Social Media, Blog Content, Google Ads, Mix…
  notes
  zohoProjectId String?              // for optional task push

ClientMinute7Alias                    // maps Minute7 customer strings to a Client
  clientId → Client
  minute7Customer String (unique)    // exact string, incl. "Customer:Job" sub-jobs
  engagementId → Engagement?         // optional: route a specific sub-job to a specific engagement

Engagement                            // anything billable: a retainer, a one-off project, or ad-hoc hourly work
  clientId → Client
  type: MONTHLY_RETAINER | ONE_TIME_FIXED | ONE_TIME_HOURLY | AD_HOC_HOURLY
  name                                // "Monthly Retainer", "Google Ads Mgmt", "Intranet Content Project"
  status: ACTIVE | COMPLETE | CANCELLED
  startDate, endDate?
  // ONE_TIME_FIXED: total budget
  totalBudgetCents Int?
  totalBudgetHours Decimal?
  hourlyRateCents Int?               // override; else client default
  overagePolicy: BILL_AT_RATE | ABSORB | REVIEW
  countsTowardRetainer Boolean        // for service lines like Google Ads (Q3)

RetainerTerm                          // effective-dated monthly terms for MONTHLY_RETAINER engagements
  engagementId → Engagement
  effectiveFrom date, effectiveTo date?
  monthlyAmountCents Int              // e.g., 80000
  hourlyRateCents Int                 // e.g., 15500
  monthlyHoursOverride Decimal?       // if set, use this instead of amount ÷ rate
  // computed: monthlyHours = override ?? round(amount / rate, 2)

Allocation                            // planned hours per person per engagement per month
  engagementId, month (YYYY-MM-01)
  userIds String[]                    // supports "Hazar & Chris"
  plannedHours Decimal
  natureOfWork String

TimeEntry                             // mirrored from Minute7
  minute7Uuid String (unique)
  date, durationHours Decimal
  minute7Customer, minute7Employee, minute7Service, minute7Class?
  description, note
  billable Boolean, approved Boolean, exported Boolean, locked Boolean
  userId → User?          (resolved)
  clientId → Client?      (resolved)
  engagementId → Engagement? (resolved)
  matchStatus: MATCHED | UNMATCHED_CLIENT | UNMATCHED_USER | IGNORED
  isDeletedInSource Boolean default false
  rawJson Json                        // full Minute7 payload for audit/debug
  lastSeenAt DateTime

TaskTemplate                          // the recurring monthly task list
  engagementId → Engagement
  title                               // "Social Media Calendar & Posts"
  quantity String                     // "2 Blogs, 2 ICYMI, 1 Holiday"
  defaultAssigneeIds String[]
  estimatedHours Decimal?
  natureOfWork
  dueDayOfMonth Int?                  // e.g., 25
  isActive Boolean
  sortOrder Int

Task                                  // one row per template per month, plus ad-hoc tasks
  templateId → TaskTemplate?          // null for one-off tasks
  engagementId → Engagement
  month (YYYY-MM-01)
  title, quantity, assigneeIds String[]
  estimatedHours Decimal?
  dueDate date?
  status: NOT_STARTED | IN_PROGRESS | BLOCKED | DONE | SKIPPED
  completedAt?, completedByUserId?
  isOutOfScope Boolean                // "Work Outside of Initial Scope" column
  notes
  zohoTaskId String?                  // set when pushed to Zoho

MonthSnapshot                         // frozen at month close, used for historical reports
  engagementId, month
  budgetHours, usedHours, nonBillableHours, overageHours, overageAmountCents, remainingHours
  tasksTotal, tasksDone
  closedAt, closedByUserId

SyncRun
  startedAt, finishedAt, status (SUCCESS | PARTIAL | FAILED)
  windowStart, windowEnd
  fetched, inserted, updated, markedDeleted, unmatched
  errorMessage?

AlertLog                              // prevents duplicate alerts; audit of what was sent
  type, engagementId?, userId?, month, checkpointDay?, sentAt, recipients String[], payloadJson

AppSetting                            // key/value admin settings (thresholds, recipients, checkpoint days…)

AuditLog                              // who changed retainers, rates, mappings, task status
  userId, entity, entityId, action, beforeJson, afterJson, at
```

### 5.2 Key rules

- **Monthly hours** = `monthlyHoursOverride` if it's set, otherwise `round(monthlyAmountCents / hourlyRateCents, 2)`.
- The **active term for a month** is the `RetainerTerm` whose effective range covers the **1st of that month**. If terms change mid-month, the term in effect on the 1st applies for the whole month (Q8).
- **Billable usage** counts only entries where `billable = true` and `matchStatus = MATCHED`. Non-billable time on a client is tracked and shown, but doesn't count against the retainer.
- **Approved-only vs. all entries:** controlled by a setting. The default is all entries, so the dashboard reflects time as soon as it's logged (Q5).
- **Overage hours** = max(0, used − budget). **Overage amount** = overage hours × the engagement's effective rate, when `overagePolicy = BILL_AT_RATE`.
- **One-time fixed projects** track usage against the **total** budget across their whole life, not per month.
- **Hourly one-time and ad-hoc work** has no cap. Show hours and the billable amount for the month (hours × rate).

---

## 6. Minute7 Integration

### 6.1 What the API provides

From the [Minute7 API Guide](https://www.minute7.com/about/api-guide):

- **Base URL:** `https://www.minute7.com`
- **Auth (reporting):** `POST /api/login` with `{ "user": { "email": "...", "password": "..." } }`. The token is at `logininfo.session.session_id`. Alternatively, an API-enabled user can copy a token from **My Settings** in Minute7. Send it as `Authorization: Bearer <token>`.
- **Permissions:** the API user must manage the account or have the **"communicate with API"** permission. **Reports only include employees that user can view**, so use an account-manager-level user, or entries will be silently missing.
- **Time entries:** `GET /api/reports/time_json` returns `{"time_data": [...]}`.
  - Params: `filter_by_date=true`, `start_date`, `end_date` (yyyy-mm-dd). The params `report_customer_id`, `report_employee_id`, `report_qb_class_id`, `report_inventory_item_id`, and `report_payroll_item_id` **must be present even when empty, or the API returns HTTP 400**. The params `billable`, `taxable`, `exported`, `locked`, and `approved` take `"all"` or a status. Optional: `include=audit_log`.
  - Fields: `uuid, date, description, note, employee_type, start_time, end_time, billable, taxable, approved, synced, locked, duration, customer, employee, service, payroll_item, quickbook_class, hours_off_duty`.
  - Booleans come back as `"Yes"`/`"No"`. IDs are strings. Dates are yyyy-mm-dd.
  - **No pagination is documented.** The full result comes back in one response.
  - **No `created`/`modified` fields** on this report. Use `include=audit_log` if you need change history.
- **Rate limits:** login is limited to 10 attempts per IP per 10 minutes. Other limits aren't documented. HTTP 429 includes `Retry-After`, which must be honored.
- **Not documented:** GET endpoints that list customers, employees, or service items. Build the mappings from the strings that appear on time entries.

### 6.2 Sync design

**Schedule (Vercel Cron, America/Chicago):**

- **Main sync:** daily at 5:30 AM, before the 7:00 AM digest.
- **Intraday refresh:** at 12:00 PM and 5:00 PM on weekdays, so the dashboard stays reasonably current (optional, controlled by a setting).
- **Manual "Sync now"** button for admins.

**Window:** each run pulls **from the 1st of the previous month through today**. This catches late entries and edits to last month's time until that month is closed. After a month is **closed** (Section 9.4), exclude it from the window.

**Algorithm:**

1. Get a token. Prefer a stored long-lived token from My Settings (`MINUTE7_API_TOKEN`). If it's missing or returns 401, fall back to `/api/login` with `MINUTE7_EMAIL`/`MINUTE7_PASSWORD`. Cache the session token in the DB, encrypted, and reuse it. Never log in more than once per run.
2. Call `time_json` for the window with all `report_*` params present and empty, and `billable=all`, `approved=all`, `exported=all`, `locked=all`, `taxable=all`.
3. Parse and normalize the data. Convert `"Yes"/"No"` to boolean and `duration` to decimal hours. **Phase 0 task:** confirm the `duration` format, which may be "HH:MM" or decimal, using a real sample, and write a unit test for it.
4. **Upsert by `minute7Uuid`.** On update, overwrite the mutable fields and store `rawJson`.
5. **Deletion detection:** any stored entry inside the window that isn't in the response gets `isDeletedInSource = true` and drops out of all totals. Only do this when the API response succeeded and wasn't empty. If the response is empty and the previous run had more than 0 entries, mark the run `PARTIAL` and alert an admin instead of deleting.
6. **Resolve mappings:**
   - Customer string → `ClientMinute7Alias` → Client and (optionally) Engagement. Minute7 customers may be "Customer:Job" strings, so try an exact match first, then the parent before the colon.
   - If a client has exactly one ACTIVE engagement covering the date, assign it. If it has several (for example a retainer and a one-off project), use the alias's `engagementId` if one is set. Otherwise use **service-item rules** (an admin-configurable map from Minute7 service to engagement). If that still fails, assign the retainer and flag the entry as "needs review."
   - Employee string → `User.minute7EmployeeNames`.
   - Anything unmatched → `matchStatus = UNMATCHED_*` and shown in the **Unmatched queue** (Section 8.6).
7. Write a `SyncRun` row with counts. If the run fails, retry with exponential backoff (honoring `Retry-After`). After the final failure, email the admins.

**Backfill:** a one-time admin action imports entries from a chosen start date (for example January 1 of the current year) so trends and history work from day one. Run it month by month to keep each response small.

**Fallback:** if API access turns out to need a different plan or permission, support **CSV upload** of the Minute7 time report (`/api/reports/time_csv` format, or a manual export) through the same normalize → upsert pipeline.

### 6.3 Phase 0 checks with Minute7 support or the account

- Confirm the subscription includes API access, and enable "communicate with API" for the sync user.
- Confirm whether My Settings tokens expire.
- Pull one real sample response, redacted, into `fixtures/minute7_time_sample.json` for tests.

---

## 7. Calculation Engine

Put all business logic in `lib/calc/` as **pure, unit-tested functions**, separate from UI and DB code.

### 7.1 Month progress (pace)

- `businessDaysInMonth(month)`: Monday–Friday, minus company holidays from an admin-editable holiday list.
- `businessDaysElapsed(month, asOf)`: counts through the **previous business day**, because today's time usually isn't logged yet. This is a setting.
- `expectedPct = businessDaysElapsed / businessDaysInMonth`
- `usedPct = usedHours / budgetHours`
- `paceRatio = usedPct / expectedPct` (when expectedPct is 0, paceRatio is undefined)
- `expectedHoursToDate = budgetHours × expectedPct`
- `hoursBehind = expectedHoursToDate − usedHours`
- `requiredDailyRate = remainingHours / businessDaysRemaining`. This answers "how many hours per day do we need to hit the retainer?"

### 7.2 Status bands (thresholds are settings)

| Status | Rule (defaults) | Color |
|---|---|---|
| **Behind** | paceRatio < 0.70 | Red |
| **Slightly behind** | 0.70 ≤ paceRatio < 0.90 | Amber |
| **On pace** | 0.90 ≤ paceRatio ≤ 1.15 | Green |
| **Ahead** | paceRatio > 1.15 and used < 100% | Blue |
| **Over budget** | used > 100% | Purple. Shows overage hours and $. |

Pick **status labels and colors that stay readable in both light and dark mode**, and always pair color with a text label.

### 7.3 Firm-wide billable goal

- **Firm monthly billable target:** by default, the sum of all active retainer hours plus planned one-off hours for the month. An admin can override it with a fixed number (Q6).
- **Per-person billable target:** `User.monthlyBillableTarget`. Track actual billable hours against it, with the same pace logic.
- **Revenue view:** billable hours × rate, compared with total retainer dollars. Also shows the **"unrealized retainer $,"** which is the dollar value of unused retainer hours. That's the money left on the table when hours aren't delivered.

### 7.4 Required unit tests (minimum)

- $800 at $155 → 5.16 hrs. $15,000 at $155 → 96.77 hrs. An override of 10.00 takes precedence.
- Mid-month retainer change: the term in effect on the 1st wins.
- Pace on the 15th of a 22-business-day month with 40% used.
- Overage: 12 hrs used on a 10 hr budget at $155 → 2 hrs / $310.
- Deleted-in-source entries are excluded from totals.
- Non-billable entries are excluded from usage but included in "total time on client."
- One-time fixed project usage across three months against its lifetime budget.
- Month boundaries in America/Chicago, including entries dated on the last day of a month.

---

## 8. App Screens

Every page requires an M365 sign-in. Only users in the `@esquireinteractive.com` tenant, **and** on the app's user list, can sign in. Admin-only actions are labeled.

### 8.1 Dashboard (home)

- **Top KPI row:** firm billable hours this month vs. target, % of month elapsed, firm pace status, hours needed per remaining business day, overage $ to date, and unrealized retainer $.
- **Retainer table**, one row per client, sortable and filterable: Client · Budget $ · Rate · Budget hrs · Used · Remaining · % used vs. % expected (paired bars) · Status chip · Hours needed/day · Tasks done/total · Responsible party · Last entry date.
- **Behind-pace callout:** the clients most behind, by hours.
- **Team panel:** each person's billable hours this month vs. personal target, and their hours by client.
- **Sync status badge:** "Last synced 5:31 AM, 1,284 entries, 3 unmatched," which links to the Unmatched queue.

### 8.2 Client detail

- Header: retainer terms (with history), rate, responsible party, and nature of work.
- **Burn-up chart:** cumulative billable hours by day vs. an ideal pace line vs. the budget line.
- **Allocation vs. actual** by team member, using the "Monthly Client Work by Team Member" structure.
- **This month's task checklist** (Section 8.4).
- **Time entries table** for the month, with filters for person, service, and billable status, plus CSV export.
- **12-month history** from MonthSnapshots: budget vs. used vs. overage.
- **Other engagements** for this client (one-off projects, ad-hoc work).

### 8.3 Projects & other billable work

- A list of all `ONE_TIME_FIXED`, `ONE_TIME_HOURLY`, and `AD_HOC_HOURLY` engagements. For fixed projects: lifetime budget, hours used, % used, and projected finish. For hourly work: this month's hours and billable $.
- An "Unbilled hourly work this month" summary for invoicing.
- Create and edit projects (admin).

### 8.4 Tasks

- **This month board:** grouped by client, filterable by assignee and status. Mark tasks done inline. A completed task records who completed it and when.
- **My tasks:** the signed-in user's open tasks, sorted by due date.
- **Templates:** an admin edits each client's recurring task list (title, quantity, default assignees, estimated hours, due day).
- **Monthly generation:** a cron job on the 1st of each month at 12:05 AM creates `Task` rows from the active templates. It's idempotent, so it never duplicates. Unfinished tasks from last month stay in last month, marked as incomplete, and the month-end report lists them.
- **"Out of scope" flag** on any task, mirroring the sheet's "Work Outside of Initial Scope" column. Out-of-scope work rolls up for overage and upsell conversations.
- **Task ↔ hours link (lightweight):** show estimated hours from the templates next to actual hours logged for that client and nature of work this month. Don't force a per-entry task link, since Minute7 doesn't track it.

### 8.5 Zoho Projects push (optional, behind a setting)

- Per client, set `zohoProjectId`. When the monthly tasks are generated, optionally **create the same tasks in Zoho Projects** (task list named "YYYY-MM Monthly Deliverables") through the Zoho Projects REST API with OAuth.
- **The app is the source of truth** for status. A nightly job **reads** Zoho task status back, so a task closed in Zoho gets marked DONE in the app. Status doesn't flow from the app to Zoho, which avoids conflicts.
- If Zoho is unreachable, log the failure and keep going. Zoho is never a blocker.

### 8.6 Admin

- **Clients & engagements:** create and edit clients, engagements, effective-dated retainer terms, rates, and hour overrides. Every change goes to the AuditLog.
- **Minute7 mappings:** a list of every distinct customer, employee, and service string seen. Map each one to a client, engagement, or user, or mark it Ignored (for example, internal "Esquire Interactive" time).
- **Unmatched queue:** entries that couldn't be resolved. Mapping a string from here fixes all past and future entries.
- **Users:** add or deactivate users, set admin, monthly target, capacity, and Minute7 name(s).
- **Settings:** pace thresholds, checkpoint days, alert recipients, digest time, holidays, approved-only toggle, Zoho on/off, and the firm target override.
- **Sync log:** SyncRun history and the "Sync now" and "Backfill" actions.
- **Google Sheet import** (Section 10).
- **Month close** (Section 9.4).

### 8.7 UX requirements

- Responsive down to phone width (people will check it on their phones), with light and dark mode.
- Fast. The dashboard should load in under about 2 seconds with a full month of data. Precompute aggregates per sync if needed.
- Every number that comes from a calculation shows its formula in a tooltip, for example "10.81 hrs = $1,675 ÷ $155."

---

## 9. Email Reports & Alerts (Microsoft Graph)

### 9.1 Sending setup

- Create an **Entra ID app registration** with the **application permission `Mail.Send`**. Use an **Application Access Policy** (Exchange Online) to restrict it to the single shared mailbox (for example `reports@esquireinteractive.com`), so the app can't send as anyone else.
- Send with `POST /users/{mailbox}/sendMail` using the client-credentials flow.
- Build emails with **React Email** (or MJML). Use responsive HTML with a plain-text fallback, and put a "View in app" link on every email.
- Every send is logged in `AlertLog`. **Dedupe rule:** the same alert type, engagement, month, and checkpoint never sends twice.
- **Dry-run mode** (a setting): emails go only to admins, with a "[TEST]" subject prefix. Leave this on through the first two weeks.

### 9.2 Schedule (America/Chicago, weekdays unless noted)

| Email | When | To | Content |
|---|---|---|---|
| **Daily team digest** | 7:00 AM Mon–Fri | Whole team | Yesterday's billable hours by person. Month-to-date firm hours vs. target and pace. The table of red and amber clients with hours needed per day. Each recipient's own open tasks due within 7 days. Unmatched entry count, if any. |
| **Pace checkpoint alert** | 8:00 AM on the **10th, 15th, 20th, and 25th** (if that's a weekend, the next business day) | Responsible party for each client below threshold, plus admins | One email per recipient listing their behind-pace clients: used vs. expected, hours behind, hours/day needed, open tasks, and allocated team members. Fires only for paceRatio < 0.70 (a setting). |
| **Weekly status report** | Monday 7:30 AM | Admins (and optionally the whole team) | Last week's hours by client and person, the full retainer table, the projects summary, overages to date, tasks completed vs. outstanding, and week-over-week trends. |
| **Month-end close report** | The **1st business day** of the month, 9:00 AM, generated from the closed month | Admins | Final budget vs. used per client, **overage hours and $ to invoice**, unrealized retainer $, hourly and project work to bill, incomplete tasks, and per-person billable vs. target. Attaches a **CSV** (and optionally a PDF). |
| **Sync failure alert** | On failure | Admins | Error details and a link to the Sync log. |

The first-business-day close report reads **after** a final sync of the prior month. That sync runs before the month is locked.

### 9.3 Additional alert (included because overages are billed)

- **Budget reached:** a one-time notice to the responsible party and admins when a client crosses **100%** of retainer hours. All future time on that client is overage, so they need to know right away. Can be disabled in Settings.

### 9.4 Month close

- An admin clicks **Close month** (or it runs automatically on the 3rd business day, per a setting). The app runs a final sync, writes `MonthSnapshot` rows, and removes the month from the sync window.
- Reopening a month is admin-only and writes to the AuditLog.

---

## 10. Google Sheet Import (one-time, re-runnable)

- **Approach:** an admin either uploads an XLSX/CSV export of the sheet, or connects through the Google Sheets API using a service account with read-only access to that one sheet. **Upload is the default**, since it's simpler and avoids a standing connection to a sheet that currently holds credentials.
- **Tabs read:** only "Client Budgets," "Monthly Client Work by Team Member," and (optionally) "Google Ads Clients | Bren" and "Hosting" (for the hourly rate). **Hard-skip "passwords"** by name, and also skip any tab whose header contains "password."
- **Mapping for Client Budgets:**
  - `CLIENT NAME` → Client.name
  - `ONE-TIME PROJECT | MONTHLY BUDGET` → "Monthly Budget" becomes a `MONTHLY_RETAINER` engagement. "One Time Project" becomes `ONE_TIME_FIXED` when Amount is a dollar value, or `ONE_TIME_HOURLY` when it's "Hourly Billing."
  - `AMOUNT` → monthlyAmountCents or totalBudgetCents
  - `HOURS` → if it differs from Amount ÷ Rate by more than 0.05, set `monthlyHoursOverride` and **flag the row for review** (this covers RNH and Flammia)
  - `NATURE OF WORK` → natureOfWork tags (split on commas)
  - `RESPONSIBLE PARTY` → primaryContactUserId (match by first name)
  - `NOTES` → notes. **Free-text lines** (for example the "Donna is also asking for one-off projects…" note) go into an import-review list. They are not created as clients.
- **Mapping for Monthly Client Work by Team Member:** each row with a Task becomes a `TaskTemplate` (title, quantity, assignees, estimated hours = HOURS) and an `Allocation` for the current month. Rows with no task (header-like rows such as "Tuckner Sipser, Desire'e") are skipped. Balance and subtotal rows (for example "$0.00") are skipped.
- **Preview step:** show a diff of what will be created or updated, with every flagged row highlighted. Nothing is written until the admin confirms.
- **Client name normalization:** handle variants such as "Tuckner" / "Tuckner Sipser," "Holleman" / "Mike Holleman" / "Holleman Law Firm," and "Mattox Wilson" / "MattoxWilson." Fuzzy-match, then require admin confirmation of merges.

After go-live, **the app becomes the source of truth** for retainers and tasks. The sheet is retired or kept read-only.

---

## 11. Security & Reliability

- **Auth:** Entra ID sign-in restricted to the company tenant, **plus** an allow-list in the `User` table. Sessions use secure, httpOnly cookies.
- **Authorization:** everyone can read everything (per the decision above). Only `isAdmin` users can write settings, retainers, mappings, and imports. Every API route and server action checks this on the server, not only in the UI.
- **Cron endpoints** are protected by a `CRON_SECRET` header, which Vercel Cron sends.
- **Secrets** live only in environment variables: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_MICROSOFT_ENTRA_ID_*`, `MINUTE7_API_TOKEN` / `MINUTE7_EMAIL` / `MINUTE7_PASSWORD`, `GRAPH_TENANT_ID` / `GRAPH_CLIENT_ID` / `GRAPH_CLIENT_SECRET`, `REPORTS_MAILBOX`, `ZOHO_*`, `CRON_SECRET`, and `ENCRYPTION_KEY` (for the cached Minute7 session). Ship a `.env.example` with placeholders only.
- **Never log** tokens, passwords, or full Minute7 payloads in production logs.
- **Backups:** confirm the Postgres provider's point-in-time recovery is enabled. A weekly export of key tables goes to a CSV attachment for admins (optional).
- **Audit log** on all admin changes.
- **Observability:** a SyncRun dashboard, error alert emails, and Vercel logs.
- **Data minimization:** time entry descriptions may mention client matters. Keep them inside the app and don't include them in the team digest.

---

## 12. Build Phases & Acceptance Criteria

### Phase 0: Discovery & setup (about 1–2 sessions)

- Work through **Section 14** with Desire'e and record the answers in `docs/decisions.md`.
- Confirm Minute7 API access, create the API user, and capture a redacted sample response as a fixture.
- Scaffold the repo (Next.js, Prisma, Tailwind, shadcn, Vitest, Playwright, ESLint/Prettier) and connect GitHub to Vercel.
- Create the Entra ID app registrations: one for sign-in (delegated) and one for Mail.Send (application, restricted to the mailbox).

**Accept when:** the app deploys to a preview URL, M365 sign-in works for a test user, a non-tenant account is rejected, and the Minute7 fixture is committed.

### Phase 1: Data model & calculation engine

- Write the Prisma schema from Section 5 and the migrations.
- Implement `lib/calc` with all of the tests from Section 7.4.
- Write a seed script with users and a few sample clients.

**Accept when:** `npm test` passes, with at least 90% coverage on `lib/calc`.

### Phase 2: Google Sheet import

- Build the upload → parse → preview → confirm flow, with the passwords-tab hard-skip, name normalization, and flagged rows.

**Accept when:** importing the real sheet export produces the expected client count, flags RNH, Flammia, Tuckner, and Shapiro for review, creates task templates from "Monthly Client Work," and never touches the passwords tab. A test confirms that last point.

### Phase 3: Minute7 sync

- Build the API client, token handling, the windowed upsert, deletion detection, the mapping resolver, SyncRun logging, backoff, the CSV fallback, backfill, and the cron job.

**Accept when:** a backfill of the current and previous month gives per-client totals that **match a Minute7 report run for the same period** (spot-check five or more clients to within 0.01 hr), unmatched strings appear in the queue, and re-running is idempotent.

### Phase 4: Dashboards & admin UI

- Build the screens in Section 8.1–8.3, 8.6, and 8.7.

**Accept when:** Desire'e can answer "how many hours does each client have left, and who is behind?" from the dashboard in under 30 seconds, tooltips show the formulas, and the layout works on a phone.

### Phase 5: Tasks & Zoho

- Build the templates, monthly generation, the boards, the out-of-scope flag, and the optional Zoho push plus status read-back.

**Accept when:** generating November's tasks twice creates no duplicates, marking a task done shows up on the client page and dashboard counts, and (if Zoho is on) tasks appear in the mapped Zoho project and a Zoho completion syncs back by the next day.

### Phase 6: Email reports & alerts

- Set up Graph sending, the templates, the schedules, dedupe, dry-run mode, the budget-reached alert, and month close.

**Accept when:** in dry-run mode, each email type can be triggered from Admin → "Send test," renders correctly in Outlook desktop, web, and mobile, and a checkpoint alert doesn't re-send on a second run the same day.

### Phase 7: Hardening & launch

- Run the Playwright end-to-end tests for sign-in, dashboard, task completion, and an admin retainer edit.
- Do a security review: server-side admin checks, the cron secret, no secrets in logs, and `.env.example` hygiene.
- Set up the custom domain `hours.esquireinteractive.com`.
- **Run in parallel with the Google Sheet for two weeks, in dry-run mode.** Then turn on live emails and retire the sheet.
- Write `README.md` (setup and operations) and `docs/runbook.md`, covering: what to do when a sync fails, how to add a client, how to change a retainer, how to close a month, and how to rotate secrets.

**Accept when:** two weeks of parallel run show no unexplained differences from Minute7, and Desire'e signs off.

---

## 13. Future Enhancements (not v1)

- **Client portal:** a read-only view per client of hours used and remaining, plus completed deliverables. The data model already scopes by client, so this would need a `ClientUser` role and per-client authorization.
- **QuickBooks Online read-back** to reconcile invoiced overages.
- **Hosting renewals tracker** (from the Hosting tab), with renewal reminders.
- **Pipeline view** from the Potential Work tab.
- **Forecasting:** project end-of-month usage from the current run rate, and send alerts on projected shortfall rather than current pace.
- **Teams notifications** (Microsoft Teams channel posts) alongside email.
- **Utilization reporting** (billable vs. capacity) for staffing decisions.

---

## 14. Open Questions (answer in Phase 0)

1. **Rates:** is **$155/hr** the default for all retainers? Should each client's rate come from the Hosting tab's "Hourly Charge" column ($145–$165 for most clients)? Are RNH ($500 → 10 hrs) and Flammia ($945 → 10 hrs) intentional?
2. **Conflicting budgets:** what's the correct current monthly retainer for **Tuckner** ($1,600 / $2,000 / $3,000?), **Shapiro** ($3,750 vs. $3,000), and **Holleman** ($1,675 vs. $1,600)?
3. **Google Ads management ($310 / 2 hrs per client):** is it **included in** each client's retainer, or a **separate monthly engagement** with its own budget?
4. **Ad spend** (for example Holleman's $750 Google + $250 Facebook): exclude it from hours entirely? (Recommended: yes, and optionally track it as a non-hour note.)
5. **Count all logged time or approved-only?** Does the team approve time in Minute7 daily or weekly?
6. **Billable goals:** is there a **firm-wide monthly billable-hours goal** and/or **per-person targets**? What are they?
7. **How are Minute7 customers named?** Do they match client names, or use "Customer:Job" sub-jobs? Do one-off projects have their own Minute7 job?
8. **Mid-month retainer changes:** start them on the 1st of the next month, or prorate?
9. **Checkpoint days and threshold:** are the 10th, 15th, 20th, and 25th with a 70% pace threshold right?
10. **Who gets which emails?** Should the whole team get the daily digest, or only admins? Who are the admins?
11. **Overage handling:** are overages always billed at the client's rate, or reviewed case by case before invoicing?
12. **Holidays:** which company holidays should be excluded from business-day pace math?
13. **Zoho:** which clients have Zoho projects today, and should every client be pushed or only some?
14. **Shared mailbox:** does `reports@esquireinteractive.com` (or similar) exist, or should it be created?
15. **Who administers your Microsoft 365 / Entra ID tenant** to approve the two app registrations?
16. **Hosting:** use Vercel under the existing team account? Who should own the database account?

---

## 15. Repository Layout (suggested)

```
/app
  /(auth)/signin
  /dashboard
  /clients/[id]
  /projects
  /tasks            (board, mine, templates)
  /admin            (clients, mappings, unmatched, users, settings, sync, import, close)
  /api
    /cron/sync            (daily + intraday)
    /cron/generate-tasks  (1st of month)
    /cron/digest          (7:00 AM)
    /cron/checkpoints     (8:00 AM; self-checks the date)
    /cron/weekly          (Mon 7:30 AM)
    /cron/month-close     (1st business day)
    /cron/zoho-readback   (nightly)
/lib
  /calc         (pure functions + tests)
  /minute7      (client, normalize, resolve, sync)
  /graph        (auth, sendMail)
  /zoho         (client, push, readback)
  /import       (sheet parser, mapper, preview)
  /email        (React Email templates)
  /auth
/prisma         (schema.prisma, migrations, seed.ts)
/fixtures       (minute7_time_sample.json, sheet_sample.xlsx — redacted)
/tests/e2e
/docs           (decisions.md, runbook.md)
vercel.json     (cron definitions; times in UTC, documented in Central)
.env.example
```

**Cron times note:** Vercel Cron runs in **UTC**. Store the Central-time intent in `docs/decisions.md`, and either adjust the UTC entries for daylight saving time twice a year or (better) run hourly triggers that check the local time and dedupe.

---

## Sources

- [Minute7 API Guide](https://www.minute7.com/about/api-guide): endpoints, auth, parameters, and fields used in Section 6
- [How Minute7 Data Syncs to QuickBooks](https://minute7.com/blog/how-minute7-data-syncs-to-quickbooks-time-expenses-explained/): background on Minute7 → QuickBooks flow
- [QuickBooks Online API: TimeActivity](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/timeactivity): for the optional future QuickBooks reconciliation
- Internal: "Client Monthly Budgets/Potential Work – Original" Google Sheet (reviewed October 20, 2026)

*Not independently verified in this plan, so confirm during Phase 0: current Vercel and Postgres pricing, Microsoft Graph Application Access Policy setup steps, Zoho Projects API scopes, and whether Minute7 API access depends on your plan.*
