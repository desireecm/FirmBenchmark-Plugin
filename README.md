# FirmBenchmark™ Plugin

**AI & SEO Benchmark Report System for Law Firm Prospects**  
Built by Esquire Interactive — attorney-led legal marketing since 2007

---

## What this does

FirmBenchmark™ runs a complete AI and SEO competitive audit for any law firm prospect and produces two deliverables:

- **PDF Audit Report** — 11-page detailed competitive analysis with real Ahrefs data, AI visibility scores, keyword positions, directory audit (firm and attorney level), competitor profiles, and pricing options
- **PowerPoint Sales Deck** — 10-slide visual summary ready for SharePoint, designed to be shown in a prospect meeting

Both files output to `/mnt/user-data/outputs/` and are named `[firm-slug]_FirmBenchmark_Sales_Deck.pptx` and `[firm-slug]_FirmBenchmark_Audit_Report.pdf`.

---

## How to trigger it

Say any of these to Claude:

- **"I need an AI benchmark report for [firm name]"**
- **"Run FirmBenchmark for [firm name]"**
- **"Benchmark [firm name]"**
- **"Audit [website]"**
- **"Generate the FirmBenchmark for [firm]"**

Claude will find the firm's website if you don't provide it, run all checks, and generate both files automatically.

---

## The two-gate system

Before generating reports, Claude runs two checks:

### Gate 1 — Ahrefs project exists
Looks for an existing Rank Tracker project for the firm's domain.

**If not found →** Claude presents a pre-written Outlook-ready email with the full Ahrefs setup checklist. Copy it, paste into Outlook, send to the team. Once the project is created, re-trigger the audit.

### Gate 2 — Home Run keywords are tagged
Checks all tracked keywords for the "Home Run" tag.

**If tags are missing →** Claude presents a pre-written Outlook-ready email listing exactly which keywords need tagging and whether they need to be added first. Once fixed, re-trigger.

**Both gates pass →** Reports generate automatically.

---

## Customizing pricing per client

Open `scripts/firm-data.json` after the audit runs and edit the `pricing.tiers` array before regenerating:

```json
"pricing": {
  "tiers": [
    {
      "name": "FOUNDATION",
      "p6": "$2,875",    ← 6-month rate
      "p12": "$2,500",   ← 12-month rate
      "saveMo": "$375",  ← monthly savings on annual
      "items": [...]     ← what's included
    }
  ]
}
```

Both the PDF and PPTX read from this file — change it once, both files update.

---

## Notification recipients

Before running a check, tell Claude:
> "Add [email] as a notification recipient"

Or add multiple at the start of a session. Notification emails are pre-written and ready to copy into Outlook — they include all client details, Ahrefs setup steps, and a direct link to the project.

---

## Files in this plugin

| File | Purpose |
|------|---------|
| `skills/firmbenchmark/SKILL.md` | Main workflow — what Claude does step by step |
| `skills/firmbenchmark/references/grading-rubric.md` | Grade thresholds vs. EI cohort |
| `skills/firmbenchmark/references/email-templates.md` | Notification email templates for both gate failures |
| `skills/firmbenchmark/references/report-schema.md` | Full `firm-data.json` schema documentation |
| `skills/firmbenchmark/references/ahrefs-guide.md` | Ahrefs tool reference and common error fixes |
| `scripts/build-sales-deck.js` | Data-driven PPTX generator (reads firm-data.json) |
| `scripts/build-audit-pdf.py` | Data-driven PDF generator (reads firm-data.json) |
| `scripts/firm-data.json` | Sample firm data — Shapiro, Washburn & Sharp |
| `.mcp.json` | Pre-wired Ahrefs and Microsoft 365 connections |

---

## Requirements

- **Ahrefs** connected in Claude settings (for project checks and live data)
- **Microsoft 365** connected (for notification email composition)
- **pptxgenjs** installed: `npm install pptxgenjs` (pre-installed in Cowork)
- **WeasyPrint** installed: `pip install weasyprint --break-system-packages` (pre-installed in Cowork)

---

## Questions?

hello@esquireinteractive.com | (520) 261-8645 | esquireinteractive.com
