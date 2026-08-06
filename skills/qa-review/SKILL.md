---
name: qa-review
description: >
  Run a complete QA review on FirmBenchmark™ output files — check, fix, and verify
  until both reports are clean and ready to deliver. Triggers on any of these phrases:
  "QA the reports", "review the reports", "check for issues", "qa pass",
  "review and fix", "make it perfect", "final check", "clean up the reports",
  "check the output", "verify the reports", "is everything clean",
  "review before sending", or any request to check, audit, or fix the generated reports.
  Runs automated checks, visual page review, auto-fixes every issue found,
  regenerates, and confirms a clean final product — without stopping to ask for
  permission between steps.
---

# FirmBenchmark™ QA Review

Execute this full review loop without pausing between steps. Every tool is pre-authorized. Fix every issue found before presenting outputs.

## Phase 1 — Run the automated checker

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/qa-check.py ${CLAUDE_PLUGIN_ROOT}/scripts/firm-data.json
```

Read the full output. Categorize all findings. If the checker reports `ALL CHECKS PASSED`, skip to Phase 4 (Visual Review). Otherwise proceed to Phase 2.

## Phase 2 — Fix all automated findings

For each finding, fix the root cause in the **source script** (not the generated file) so the fix persists on every future run. Common fixes:

| Finding | Root cause | Fix |
|---|---|---|
| Em-dash found | `&mdash;` or `\u2014` in HTML string | Replace with `, ` or ` - ` in `build-audit-pdf.py` |
| Space before comma | ` , ` artifact from prior em-dash replacement | Remove the extra space in the f-string |
| Unfilled placeholder | `[BRACKET TEXT]` still in output | Populate the field in `firm-data.json` or remove from script |
| Cohort reference | "cohort", "50+ projects", client stats | Find in `build-audit-pdf.py` or `build-sales-deck.js` and rewrite |
| Generic competitor name | "Competitor 1" not replaced | Update `firm-data.json` competitors array |
| Invalid AI grid value | Not Cited/Cited/Partial | Fix in `firm-data.json → aiGrid` |
| Missing required field | null or empty in firm-data.json | Populate from Ahrefs data already pulled |
| CSS footer &amp; | `&amp;` in CSS content property | Change to raw `&` in the CSS string in `build-audit-pdf.py` |

After fixing all findings: re-run `build-audit-pdf.py` and `build-sales-deck.js`.

## Phase 3 — Re-run checker to confirm

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/qa-check.py ${CLAUDE_PLUGIN_ROOT}/scripts/firm-data.json
```

If any issues remain, return to Phase 2. Repeat until the checker reports `ALL CHECKS PASSED`.

## Phase 4 — Visual review of every page

### PDF visual review

Render all pages:

```bash
pdftoppm -jpeg -r 110 /mnt/user-data/outputs/[firmSlug]_FirmBenchmark_Audit_Report.pdf /tmp/qa-pdf
```

Review every page image. Check for:

- **Overflow** — text or boxes cut off at the page edge or bottom
- **Blank or near-blank pages** — a page with only a header and one line of content
- **Orphaned headings** — a subheading alone at the bottom of a page with its content starting on the next page
- **Table rendering** — all columns visible, no cells clipped, alternating row colors correct
- **Grade cards** — all five dimension cards visible side-by-side, none cut off
- **Pricing cards** — all three tiers visible, middle card highlighted in orange
- **Footer** — shows `[Firm Name] | Confidential` on every page except cover
- **Page numbers** — increment correctly
- **Competitor names** — real firm names, not "Competitor 1/2/3"
- **AI grid** — all five query rows × five platform columns visible with color coding
- **No em-dashes** — scan each page text visually

### PPTX visual review

Convert to PDF then render:

```bash
soffice --headless --convert-to pdf /mnt/user-data/outputs/[firmSlug]_FirmBenchmark_Sales_Deck.pptx --outdir /tmp/
pdftoppm -jpeg -r 120 /tmp/[firmSlug]_FirmBenchmark_Sales_Deck.pdf /tmp/qa-pptx
```

Review every slide. Check for:

- **Cover slide** — firm name correct, city correct, coverHeadline populated (not generic)
- **Verdict slide** — all three stat boxes populated, all five grade cards visible (not cut off)
- **Competition slide** — real competitor names in both the bar chart labels and the comparison table
- **Math slide** — $values match firm-data.json, real keyword terms shown
- **Keywords slide** — real keyword strings, not generic descriptions, correct positions
- **AI Test slide** — score matches aiScore, exact query strings shown (not "Query 1"), all 25 cells colored
- **Fix slide** — six cards visible, no text overflow within cards
- **Team slide** — no client-attributable stats, no cohort references
- **Options slide** — three pricing tiers visible, correct prices from firm-data.json, middle tier highlighted
- **CTA slide** — firm name correct in footer

## Phase 5 — Fix all visual findings

For each visual issue:

**Text overflow / content cut off** — reduce font size, increase section padding, or break content across pages in the source script.

**Blank or thin pages** — consolidate the sparse section with adjacent content, or add meaningful content from firm-data.json.

**Orphaned headings** — add `page-break-inside: avoid` wrapping the heading and its first content block.

**Wrong data showing** — trace back to firm-data.json field and correct it.

**Grade cards cut off** — reduce `.gc` card height or padding in the CSS block.

After fixing all visual issues: regenerate both files.

## Phase 6 — Final verification pass

Run the checker one final time:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/qa-check.py ${CLAUDE_PLUGIN_ROOT}/scripts/firm-data.json
```

Confirm `ALL CHECKS PASSED`. Then do a final spot-check on the 3 most content-dense pages of the PDF (typically the Executive Summary, Keywords, and AI Visibility sections) and the Verdict and Keywords slides.

## Phase 7 — Present clean outputs

Only after the checker passes and visual review is clean:

1. Call `present_files` with both output files
2. Write a 3-line summary stating:
   - How many issues were found and fixed
   - Which pages/slides had visual fixes
   - Confirmation that the automated checker passed clean

Do not present the files if any issues remain.

---

## What the checker does NOT catch (manual-only checks)

These require human review before the prospect meeting:

- Accuracy of Ahrefs data figures (DR, traffic, keywords) — verify against live Ahrefs
- Accuracy of AI visibility scores — re-test queries if the session was more than 7 days ago
- Competitor descriptions — confirm the narrative is accurate and current
- Pricing tiers — confirm with account owner that rates are correct for this client
- Attorney names and credentials — confirm from firm's website before delivering
