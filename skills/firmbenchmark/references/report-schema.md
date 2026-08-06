# firm-data.json Schema

Write this file to `${CLAUDE_PLUGIN_ROOT}/scripts/firm-data.json` before running the build scripts. Every field is required unless marked optional.

```json
{
  "firmSlug": "shapiro-washburn-sharp",
  "name": "Shapiro, Washburn & Sharp",
  "city": "Virginia Beach, VA",
  "primaryPA": "Personal Injury",
  "allPAs": "Personal Injury, Car Accidents, Truck Accidents, Medical Malpractice",
  "website": "hsinjurylaw.com",
  "month": "August 2026",

  "metrics": {
    "dr": 28,
    "orgKeywords": 476,
    "orgKeywordsTop3": 122,
    "orgTraffic": 1594,
    "trafficValue": 20514,
    "refDomains": 47
  },

  "aiScore": 8,

  "firmProfile": {
    "founded": "1985",
    "description": "40-year Virginia Beach personal injury firm with $100M+ in recoveries",
    "address": "4705 Columbus Street, Suite 304, Virginia Beach, VA 23462",
    "phone": "(757) 460-7776",
    "attorneys": ["Richard N. (Rick) Shapiro", "Eric K. Washburn", "Kevin D. Sharp"],
    "credentials": "Best Lawyers 2026, Virginia Super Lawyers 2026"
  },

  "grades": {
    "searchAuthority": { "letter": "C",  "note": "DR 28 vs avg 35" },
    "keywordCoverage": { "letter": "C+", "note": "476 kws, 122 top-3" },
    "aiVisibility":   { "letter": "C-", "note": "Score: 8 / 25" },
    "localEntity":    { "letter": "C",  "note": "Est. good presence" },
    "technicalHealth":{ "letter": "C",  "note": "Needs full audit" },
    "overall":        { "letter": "C",  "note": "Room to lead this market" }
  },

  "competitors": [
    {
      "name": "Cooper Hurley Injury Lawyers",
      "domain": "cooperhurley.com",
      "dr": 49,
      "traffic": 5251,
      "trafficValue": 61531,
      "keywords": 618,
      "refDomains": 190,
      "aiScore": 19,
      "sovPct": 61
    },
    {
      "name": "Breit Biniazan",
      "domain": "bbtrial.com",
      "dr": 33,
      "traffic": 3260,
      "trafficValue": 21078,
      "keywords": 533,
      "refDomains": 87,
      "aiScore": 12,
      "sovPct": 24
    },
    {
      "name": "Joel Bieber Firm",
      "domain": "joelbieber.com",
      "dr": 25,
      "traffic": 4671,
      "trafficValue": 37607,
      "keywords": 1024,
      "refDomains": 62,
      "aiScore": 9,
      "sovPct": 11
    }
  ],

  "keywords": [
    { "term": "personal injury lawyer virginia beach",     "position": 5,  "volume": 250,   "kd": 38, "comp1Position": 2 },
    { "term": "personal injury attorney virginia beach",   "position": 4,  "volume": 150,   "kd": 54, "comp1Position": 3 },
    { "term": "personal injury virginia beach",            "position": 4,  "volume": 150,   "kd": 42, "comp1Position": 1 },
    { "term": "virginia beach car accident lawyer",        "position": 5,  "volume": 200,   "kd": 2,  "comp1Position": 1 },
    { "term": "auto accident lawyer virginia beach",       "position": 3,  "volume": 300,   "kd": 2,  "comp1Position": 1 },
    { "term": "virginia beach personal injury lawyer",     "position": 5,  "volume": 250,   "kd": 0,  "comp1Position": 2 },
    { "term": "lawyer personal injury near me",            "position": 21, "volume": 6400,  "kd": 56, "comp1Position": 4 },
    { "term": "wrongful death lawyer virginia beach",      "position": 3,  "volume": 150,   "kd": 0,  "comp1Position": 2 }
  ],

  "aiQueries": [
    "Personal injury lawyer Virginia Beach",
    "Best car accident attorney Virginia Beach",
    "Truck accident lawyer Virginia",
    "Medical malpractice attorney VA Beach",
    "Who handles FELA railroad injury cases VA"
  ],

  "aiGrid": [
    { "chatgpt": "Cited",     "claude": "Not Cited", "perplexity": "Not Cited", "gemini": "Not Cited", "copilot": "Partial"  },
    { "chatgpt": "Not Cited", "claude": "Not Cited", "perplexity": "Not Cited", "gemini": "Cited",     "copilot": "Not Cited" },
    { "chatgpt": "Not Cited", "claude": "Partial",   "perplexity": "Not Cited", "gemini": "Not Cited", "copilot": "Not Cited" },
    { "chatgpt": "Not Cited", "claude": "Not Cited", "perplexity": "Not Cited", "gemini": "Not Cited", "copilot": "Cited"    },
    { "chatgpt": "Partial",   "claude": "Not Cited", "perplexity": "Cited",     "gemini": "Not Cited", "copilot": "Not Cited" }
  ],

  "coverHeadline": "40 Years of Wins.\nNot Enough Rankings.",
  "coverSub": "Here's what the data says.",

  "notificationRecipients": []
}
```

## Field notes

- `firmSlug` — kebab-case, used for output filenames
- `metrics.trafficValue` — always in USD (already divided from cents)
- `metrics.refDomains` — estimate if exact figure unavailable; note with asterisk
- `competitors[].sovPct` — AI share of voice percentage, estimate if Brand Radar unavailable
- `firmProfile.attorneys` — required, minimum 2 names; used for the local/citation section and directory tables
- `aiQueries` — exactly 5 strings, in the same order as the corresponding rows in `aiGrid`
- `aiGrid` — exactly 5 rows; each row is a flat object keyed by platform (`chatgpt`, `claude`, `perplexity`, `gemini`, `copilot`), one of: `"Cited"`, `"Partial"`, `"Not Cited"` per platform
- `coverHeadline` — the main cover slide text; customize per firm. Use `\n` for line breaks
- `notificationRecipients` — leave as `[]` if not configured; the scripts will skip email formatting
