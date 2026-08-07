# Ahrefs Tool Reference

Quick reference for the exact tool calls used in the FirmBenchmark workflow.

## Tool search order

Load these tools with `tool_search` before calling them:

| Query | Tools loaded |
|---|---|
| `"Ahrefs domain rating organic traffic metrics"` | `site-explorer-metrics`, `public-domain-rating-free`, `site-explorer-metrics-history` |
| `"Ahrefs organic competitors keywords"` | `site-explorer-organic-competitors`, `site-explorer-organic-keywords` |
| `"Ahrefs management projects rank tracker"` | `management-projects`, `management-project-keywords` |

---

## Core calls

### Domain Rating
```
tool: public-domain-rating-free
params: { target: "hsinjurylaw.com" }
extract: data.domain_rating.domain_rating
```

### Site Metrics
```
tool: site-explorer-metrics
params: {
  target: "hsinjurylaw.com",
  date: "YYYY-MM-DD",      // today
  mode: "subdomains"
}
extract:
  org_keywords        → metrics.orgKeywords
  org_keywords_1_3    → metrics.orgKeywordsTop3
  org_traffic         → metrics.orgTraffic
  org_cost / 100      → metrics.trafficValue (cents → USD)
```

### Organic Competitors
```
tool: site-explorer-organic-competitors
params: {
  target: "hsinjurylaw.com",
  country: "us",
  date: "YYYY-MM-DD",
  mode: "subdomains",
  limit: 8,
  order_by: "keywords_common:desc",
  select: "competitor_domain,domain_rating,keywords_common,keywords_competitor,traffic,value"
}
filter: exclude directories (avvo.com, justia.com, findlaw.com, superlawyers.com,
         martindale.com, lawyers.com, nolo.com, yelp.com, expertise.com, lawinfo.com)
take: top 3 remaining law firm domains
note: value field is in USD cents — divide by 100
```

### Top Keywords
```
tool: site-explorer-organic-keywords
params: {
  target: "hsinjurylaw.com",
  date: "YYYY-MM-DD",
  country: "us",
  mode: "subdomains",
  limit: 15,
  order_by: "sum_traffic:desc",
  select: "keyword,best_position,sum_traffic,volume,keyword_difficulty,best_position_url"
}
note: column name is "best_position" not "position"
```

### Rank Tracker Project Check
```
tool: management-projects
params: {}
search: find any project where target URL domain matches the firm domain
extract: project_id, project_name
```

### Keyword Tags (Gate 2)
```
tool: management-project-keywords
params: { project_id: [integer] }
extract: keywords[].keyword, keywords[].tags
match: tags where tag.toLowerCase().replace(/[\s-_]/g,'').includes('homerun') OR tag === 'hr'
```

---

## Common errors and fixes

| Error | Fix |
|---|---|
| `column 'position' not found` | Use `best_position` instead of `position` |
| `column 'competitor' not found` | Use `competitor_domain` not `competitor` |
| `column 'traffic' not found in select` | Check available columns with `doc` tool first |
| Empty competitors list | Directory sites are being returned — filter them out by domain |
| `management-projects` returns no results | User is not authenticated to Ahrefs — check MCP connection |

---

## Referring domain count

The API does not return a simple "total referring domains" count from `site-explorer-metrics`. To get it:
```
tool: site-explorer-referring-domains
params: {
  target: "hsinjurylaw.com",
  mode: "subdomains",
  select: "domain_rating,domain",
  limit: 1    // We just need the total count from the response metadata
}
```
If total count is not in metadata, use the `site-explorer-backlinks-stats` tool or estimate from the competitor data (their refdomains are in the competitor table from site-explorer-organic-competitors if `refdomains` is in the select).
