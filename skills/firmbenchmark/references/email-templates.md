# FirmBenchmark™ Notification Email Templates

Use these templates verbatim when a gate check fails. Substitute `[PLACEHOLDERS]` with real values from the intake.

---

## Template 1 — Gate 1 Fail: No Ahrefs Project

**Subject:** ACTION REQUIRED — New Ahrefs Project Needed: [FIRM NAME]

```
Hi team,

A FirmBenchmark™ audit has been queued for the client below, but no Ahrefs
Rank Tracker project was found for their domain. Please create the project
manually before the audit can proceed.

CLIENT: [FIRM NAME]
Website: https://[DOMAIN]
Practice Areas: [PRACTICE AREAS]
Target Location: [CITY, STATE]

─── AHREFS SETUP CHECKLIST ────────────────────────────────────────────

1. Create project
   Name:     [FIRM NAME]
   URL:      https://[DOMAIN]
   Mode:     Domain
   Protocol: HTTPS

2. Set tracking location
   Location: [CITY, STATE]
   Device:   Mobile (Google)

3. Add keywords (paste into Ahrefs keyword import — one per line)
[LIST KEYWORDS FROM INTAKE — one per line, Home Run keywords marked ⭐]

4. Tag Home Run keywords
   After importing, select each Home Run keyword → Tags → "Home Run"

5. Add competitors
[LIST COMPETITOR DOMAINS — one per line]

─── DIRECT LINK ────────────────────────────────────────────────────────
https://app.ahrefs.com/rank-tracker

Once the project is live, return to Claude and say:
"Re-run FirmBenchmark for [FIRM NAME]"

— FirmBenchmark™ Automated Workflow | Esquire Interactive
```

---

## Template 2 — Gate 2 Fail: Home Run Tags Missing

**Subject:** ACTION REQUIRED — Home Run Tags Missing in Ahrefs: [FIRM NAME]

```
Hi team,

An Ahrefs project was found for [FIRM NAME] (Project ID: [PROJECT_ID]),
but Home Run keyword tags are incomplete. The audit cannot run until
all Home Run keywords are properly tagged.

CLIENT: [FIRM NAME]
Website: https://[DOMAIN]
Ahrefs Project: https://app.ahrefs.com/rank-tracker/overview/[PROJECT_ID]

─── TAG ISSUES ─────────────────────────────────────────────────────────

[IF needsTag.length > 0:]
KEYWORDS IN PROJECT — MISSING "Home Run" TAG:
[LIST each keyword, one per line with → prefix]

To fix: Rank Tracker → select keyword → Tags → type "Home Run" → confirm

[IF notInProject.length > 0:]
KEYWORDS NOT YET IN PROJECT — ADD THEN TAG:
[LIST each keyword, one per line with + prefix]

To fix: Add to Rank Tracker first (Keywords → Add keywords), then tag.

─── DIRECT LINK ────────────────────────────────────────────────────────
https://app.ahrefs.com/rank-tracker/overview/[PROJECT_ID]

Once all Home Run keywords are tagged, return to Claude and say:
"Re-run FirmBenchmark for [FIRM NAME]"

— FirmBenchmark™ Automated Workflow | Esquire Interactive
```

---

## Notification Recipients

Always present a "To:" line below the email block listing the configured recipients. If no recipients have been configured for the session, prompt: "Who should receive this notification? Add email addresses and I'll include them."
