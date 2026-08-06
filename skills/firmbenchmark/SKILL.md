---
name: firmbenchmark
description: >
  Run the full FirmBenchmark™ AI & SEO audit pipeline for a law firm prospect.
  Trigger on ANY of these phrases: "I need an AI benchmark report", "run FirmBenchmark",
  "run the report for [firm]", "benchmark [firm name]", "audit [firm name]",
  "generate the benchmark for [firm]", "run a benchmark on [firm]", or any request
  to produce the FirmBenchmark sales deck or audit report for a specific law firm.
  Executes all steps automatically — Ahrefs check, tag verification, data pull,
  AI visibility testing, grading, and file generation — without asking for
  individual tool permissions. Pre-authorized: Ahrefs MCP, Microsoft 365 MCP,
  web search, bash, file creation.
---

# FirmBenchmark™ Workflow

Execute all steps below in order without pausing to ask for permissions. Every tool call in this workflow is pre-authorized. If a step fails, log the error, note it in the output, and continue where possible.

## Step 0 — Identify the firm

If a website was not provided, immediately run a web search for `[firm name] law firm website` and find the domain. Do not ask the user to provide it.

Confirm:
- Firm name (full legal name)
- Domain (e.g. `cooperhurley.com`) — strip protocol and trailing slash
- City, State
- Primary practice area(s)

## Step 1 — Ahrefs project check (Gate 1)

Use the Ahrefs `management-projects` tool to list all Rank Tracker projects. Search for any project whose target URL or domain matches the firm's domain.

**If no project found:**
- Compose the "no project" notification email using the template in `references/email-templates.md`
- Present the email content in a clearly labeled copy block so it can be pasted into Outlook
- State: "The Ahrefs project does not exist yet. Once the team creates it, re-run this skill."
- **Stop here.** Do not proceed to report generation.

**If project found:**
- Note the project ID
- Proceed to Step 2

## Step 2 — Home Run keyword tag verification (Gate 2)

Use the Ahrefs `management-project-keywords` tool with the project ID from Step 1.

Check whether any keywords in the project are tagged with "Home Run" (case-insensitive; also match "homerun", "home-run", "HR").

**If no keywords in the project have Home Run tags:**
- Compose the "missing tags" notification email using the template in `references/email-templates.md`
- Present the email content in a copy block
- State: "Home Run keyword tags are missing. Once the team applies them in Ahrefs Rank Tracker, re-run this skill."
- **Stop here.** Do not proceed to report generation.

**If Home Run tags are present:**
- Note the tagged keywords
- Proceed to Step 3

## Step 3 — Pull live Ahrefs data

Call the following tools in parallel where possible. Use `mode=subdomains` on all site-explorer calls. Use today's date for the `date` parameter.

| Tool | Parameters | What to capture |
|---|---|---|
| `public-domain-rating-free` | target=domain | `dr` |
| `site-explorer-metrics` | target, date, mode=subdomains | `org_keywords`, `org_keywords_1_3`, `org_traffic`, `org_cost` (divide by 100 for USD) |
| `site-explorer-organic-competitors` | target, country=us, date, mode=subdomains, limit=6, order_by=keywords_common:desc, select=competitor_domain,domain_rating,keywords_common,keywords_competitor,traffic,value | Top 3 real law firm competitors (exclude directories: avvo, justia, findlaw, superlawyers, martindale) |
| `site-explorer-organic-keywords` | target, date, country=us, mode=subdomains, limit=15, order_by=sum_traffic:desc, select=keyword,best_position,sum_traffic,volume,keyword_difficulty,best_position_url | Top keywords with positions |

For competitor `traffic` and `value` fields: `value` is in USD cents — divide by 100.

## Step 4 — AI visibility testing

Run 5 web searches simulating queries a prospective client would ask an AI engine:
1. `[primary practice area] lawyer [city] [state]`
2. `best [practice area] attorney [city]`
3. `[practice area] attorney near me [state]`
4. `[case type] accident lawyer [city]` (use the firm's top case type)
5. `who handles [case type] cases in [city]`

For each search, scan results for AI Overview citations, featured snippets, and third-party recommendation lists. Record whether the firm appears: "Cited", "Partial" (mentioned but not recommended), or "Not Cited".

Score: each "Cited" = 1 point, each "Partial" = 0.5 point. Maximum 5 per platform × 5 platforms = 25. Estimate the full score by extrapolating from web search findings.

## Step 5 — Grade each dimension

Use the rubric in `references/grading-rubric.md` to assign letter grades (A–F) for each dimension:
- Search Authority (DR vs. competitor average)
- Keyword Coverage (ranking keywords, positions 1–3)
- AI Visibility (score/25)
- Local & Entity (estimated from directory presence in search results)
- Technical Health (estimate C unless site audit data is available)

Assign an Overall grade (weighted average, round down one step if AI visibility is F).

## Step 6 — Build the firm data object

Write the complete firm data to `${CLAUDE_PLUGIN_ROOT}/scripts/firm-data.json` using the schema in `references/report-schema.md`.

## Step 7 — Generate both reports

Run both scripts from the `scripts/` directory:

```bash
cd ${CLAUDE_PLUGIN_ROOT}/scripts
node build-sales-deck.js firm-data.json
python3 build-audit-pdf.py firm-data.json
```

Both scripts read `firm-data.json` and write output files to `/mnt/user-data/outputs/`.

Output filenames:
- `[FIRM_SLUG]_FirmBenchmark_Sales_Deck.pptx`
- `[FIRM_SLUG]_FirmBenchmark_Audit_Report.pdf`

## Step 8 — Automatic QA loop (runs every time, no trigger needed)

Do not skip this step. Do not present files before this step completes clean.

### 8a — Run the automated checker

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/qa-check.py ${CLAUDE_PLUGIN_ROOT}/scripts/firm-data.json
```

Read the full output. If the checker reports `ALL CHECKS PASSED`, go to 8b. If issues are found, fix each one now:

| Finding | Fix |
|---|---|
| Em-dash (`&mdash;`, `\u2014`) | Replace with `, ` or ` - ` in `build-audit-pdf.py` or `build-sales-deck.js` |
| Space before comma (` , `) | Remove the extra space in the source f-string |
| Unfilled bracket `[LIKE THIS]` | Populate from `firm-data.json` or remove from script |
| Cohort / client language | Rewrite the offending line in the source script |
| Generic competitor name | Update `firm-data.json` competitors array with real firm names |
| Invalid AI grid value | Fix in `firm-data.json` — must be exactly `Cited`, `Partial`, or `Not Cited` |
| Missing required field | Populate from Ahrefs data already pulled in Steps 3–4 |

After fixing: re-run both build scripts, then re-run the checker. Repeat until it exits clean.

### 8b — Visual review of every page and slide

Render the PDF:
```bash
pdftoppm -jpeg -r 110 /mnt/user-data/outputs/[FIRM_SLUG]_FirmBenchmark_Audit_Report.pdf /tmp/qa-pdf
```

Review every page image. Fix any of these if found:
- Text or boxes cut off at the page edge or bottom
- Blank or near-blank page (header only, almost no content)
- Subheading alone at the bottom of a page with content starting on the next page
- Grade cards not all visible side-by-side
- Pricing cards missing or wrong tier highlighted
- Footer shows `&amp;` instead of `&`
- Any em-dash visible in body text
- Empty table cells where data should be

Render the PPTX:
```bash
soffice --headless --convert-to pdf /mnt/user-data/outputs/[FIRM_SLUG]_FirmBenchmark_Sales_Deck.pptx --outdir /tmp/
pdftoppm -jpeg -r 120 /tmp/[FIRM_SLUG]_FirmBenchmark_Sales_Deck.pdf /tmp/qa-pptx
```

Review every slide image. Fix any of these if found:
- Cover headline is generic (not firm-specific)
- Verdict slide grade cards cut off at bottom
- Competition slide shows "Competitor 1/2/3" instead of real firm names
- AI test slide shows "Query 1/2/3" instead of exact query strings
- Options slide pricing does not match `firm-data.json`
- Team slide contains client-attributable stats

After fixing any visual issues: re-run both build scripts, re-run the checker (8a), re-render and spot-check the fixed pages.

### 8c — Final confirmation

Run the checker one last time:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/qa-check.py ${CLAUDE_PLUGIN_ROOT}/scripts/firm-data.json
```

Only proceed to Step 9 when this outputs `ALL CHECKS PASSED`.

## Step 9 — Present outputs

Call `present_files` with both output files. Follow with a 3-line summary:
1. The single most important finding for this firm (the number that will land hardest in the meeting)
2. How many QA issues were found and fixed (or "QA passed clean on first run")
3. Confirmation that the automated checker passed clean


## Reference files

- `references/ahrefs-guide.md` — tool parameter reference and common errors
- `references/grading-rubric.md` — grade thresholds vs. EI cohort benchmarks
- `references/email-templates.md` — pre-written notification emails for Gate 1 and Gate 2 failures
- `references/report-schema.md` — full `firm-data.json` schema with field descriptions
