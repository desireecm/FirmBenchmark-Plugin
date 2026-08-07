#!/usr/bin/env python3
"""
FirmBenchmark™ QA Checker
Usage: python3 qa-check.py [path/to/firm-data.json]

Scans firm-data.json, the generated HTML source, and both output files
for every known issue category. Outputs a structured findings report.
Exit code 0 = clean. Exit code 1 = issues found.
"""

import json, sys, os, re
from pathlib import Path

data_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'firm-data.json')
slug = None
findings = []

def fail(category, location, message, auto_fixable=False):
    findings.append({'category': category, 'location': location, 'message': message, 'auto_fixable': auto_fixable})

# ─── 1. FIRM DATA COMPLETENESS ─────────────────────────────────────────────
if not os.path.exists(data_path):
    fail('DATA', 'firm-data.json', 'File not found', False)
else:
    with open(data_path) as f:
        d = json.load(f)
    slug = d.get('firmSlug', 'unknown')

    required = ['firmSlug','name','city','primaryPA','website','month',
                'coverHeadline','coverSub','metrics','aiScore','grades',
                'competitors','keywords','aiGrid','aiQueries','pricing']
    for field in required:
        if field not in d or d[field] is None:
            fail('DATA', f'firm-data.json → {field}', f'Required field missing or null', False)

    # Metric fields
    for mf in ['dr','orgKeywords','orgKeywordsTop3','orgTraffic','trafficValue']:
        if not d.get('metrics',{}).get(mf):
            fail('DATA', f'firm-data.json → metrics.{mf}', 'Metric missing or zero', False)

    # Grade fields
    for gf in ['searchAuthority','keywordCoverage','aiVisibility','localEntity','technicalHealth','overall']:
        g = d.get('grades',{}).get(gf,{})
        if not g.get('letter'):
            fail('DATA', f'firm-data.json → grades.{gf}', 'Grade letter missing', False)
        if not g.get('note'):
            fail('DATA', f'firm-data.json → grades.{gf}', 'Grade note missing', False)

    # Competitors
    comps = d.get('competitors', [])
    if len(comps) < 3:
        fail('DATA', 'firm-data.json → competitors', f'Only {len(comps)} competitors (need 3)', False)
    for i, c in enumerate(comps[:3]):
        if not c.get('name') or 'Competitor' in c.get('name',''):
            fail('DATA', f'firm-data.json → competitors[{i}].name', 'Generic placeholder name', True)
        for cf in ['domain','dr','traffic','trafficValue','keywords']:
            if not c.get(cf):
                fail('DATA', f'firm-data.json → competitors[{i}].{cf}', 'Field missing', False)

    # Keywords
    kws = d.get('keywords', [])
    if len(kws) < 5:
        fail('DATA', 'firm-data.json → keywords', f'Only {len(kws)} keywords (recommend 8+)', False)
    for i, kw in enumerate(kws):
        if not kw.get('term') or kw.get('position',0) == 0:
            fail('DATA', f'firm-data.json → keywords[{i}]', 'Missing term or position', False)

    # AI grid + queries
    grid = d.get('aiGrid', [])
    queries = d.get('aiQueries', [])
    if len(grid) != 5:
        fail('DATA', 'firm-data.json → aiGrid', f'Has {len(grid)} rows, need exactly 5', False)
    if len(queries) != 5:
        fail('DATA', 'firm-data.json → aiQueries', f'Has {len(queries)} queries, need exactly 5', False)
    for i, row in enumerate(grid):
        for plat in ['chatgpt','claude','perplexity','gemini','copilot']:
            val = row.get(plat,'')
            if val not in ('Cited','Partial','Not Cited'):
                fail('DATA', f'firm-data.json → aiGrid[{i}].{plat}', f'Invalid value "{val}" — must be Cited, Partial, or Not Cited', True)

    # Pricing
    tiers = d.get('pricing',{}).get('tiers',[])
    if len(tiers) != 3:
        fail('DATA', 'firm-data.json → pricing.tiers', f'Has {len(tiers)} tiers, need 3', False)
    for i, t in enumerate(tiers):
        for tf in ['name','p6','p12','saveMo','items']:
            if not t.get(tf):
                fail('DATA', f'firm-data.json → pricing.tiers[{i}].{tf}', 'Missing field', False)
        if not t.get('items') or len(t.get('items',[])) < 4:
            fail('DATA', f'firm-data.json → pricing.tiers[{i}].items', 'Fewer than 4 items listed', False)

    # firmProfile
    fp = d.get('firmProfile',{})
    if not fp.get('attorneys') or len(fp.get('attorneys',[])) < 2:
        fail('DATA', 'firm-data.json → firmProfile.attorneys', 'Fewer than 2 attorneys listed', False)


# ─── 2. GENERATED HTML SCAN (PDF source) ───────────────────────────────────
html_path = f'/tmp/{slug}_audit.html' if slug else None
if html_path and os.path.exists(html_path):
    html = open(html_path).read()

    # Em-dashes in HTML body (not CSS)
    emdash_patterns = [
        (r'&mdash;',      'HTML &mdash; entity'),
        (r'&#8212;',      'HTML &#8212; entity'),
        (r'\u2014',       'Raw em-dash character'),
        (r' \xe2\x80\x94',' Raw em-dash bytes'),
    ]
    for pat, label in emdash_patterns:
        matches = list(re.finditer(pat, html))
        for m in matches:
            ctx = html[max(0,m.start()-40):m.end()+40].replace('\n',' ')
            fail('EM-DASH', f'PDF HTML near: ...{ctx}...', f'{label} found', True)

    # Stray space-comma artifacts from em-dash replacement
    for m in re.finditer(r' , [A-Z]', html):
        ctx = html[max(0,m.start()-40):m.end()+40].replace('\n',' ')
        fail('PUNCTUATION', f'PDF HTML near: ...{ctx}...', 'Space before comma: " , "', True)

    # Unfilled bracket placeholders [LIKE THIS]
    for m in re.finditer(r'\[[A-Z][A-Za-z\s]{2,35}\]', html):
        ctx = html[max(0,m.start()-30):m.end()+30].replace('\n',' ')
        if 'calendly' not in html[m.start():m.end()].lower():
            fail('PLACEHOLDER', f'PDF HTML near: ...{ctx}...', f'Unfilled bracket: {m.group()}', False)

    # Calendly placeholder
    if '[calendly.com' in html.lower():
        fail('PLACEHOLDER', 'PDF HTML', 'Calendly URL is still a placeholder — needs real link', False)

    # Cohort language
    cohort_patterns = [
        (r'\bcohort\b',         'Word "cohort"'),
        (r'50\+.*project',      '"50+ projects"'),
        (r'\$400M\+.*client',   '$400M+ client result'),
        (r'548%',               '548% client stat'),
        (r'2,309%',             '2,309% client stat'),
        (r'whistleblower',      'Whistleblower client reference'),
        (r'employment law',     'Employment law client reference'),
    ]
    for pat, label in cohort_patterns:
        if re.search(pat, html, re.IGNORECASE):
            fail('COHORT', 'PDF HTML', f'{label} found in PDF output', True)

    # Generic competitor names
    for placeholder in ['Competitor 1', 'Competitor 2', 'Competitor 3']:
        if placeholder in html:
            fail('PLACEHOLDER', 'PDF HTML', f'Generic name "{placeholder}" still in PDF', True)

    # Empty table cells with no data
    empty_cells = re.findall(r'<td[^>]*>\s*</td>', html)
    if len(empty_cells) > 3:
        fail('DATA', 'PDF HTML', f'{len(empty_cells)} empty table cells found', False)

    # CSS footer em-dash check (should use & not &amp; in CSS content property)
    css_footer_match = re.search(r'content:"[^"]*"', html[:3000])
    if css_footer_match:
        footer_css = css_footer_match.group()
        if '&amp;' in footer_css:
            fail('PUNCTUATION', 'PDF CSS @page footer', '&amp; in CSS content property — should be raw &', True)
        if '&mdash;' in footer_css or '\u2014' in footer_css:
            fail('EM-DASH', 'PDF CSS @page footer', 'Em-dash in CSS footer content', True)


# ─── 3. OUTPUT FILE EXISTENCE CHECK ────────────────────────────────────────
out_dir = '/mnt/user-data/outputs'
if slug:
    pdf_path  = f'{out_dir}/{slug}_FirmBenchmark_Audit_Report.pdf'
    pptx_path = f'{out_dir}/{slug}_FirmBenchmark_Sales_Deck.pptx'

    if not os.path.exists(pdf_path):
        fail('OUTPUT', pdf_path, 'PDF output file not found — has it been generated?', False)
    elif os.path.getsize(pdf_path) < 50_000:
        fail('OUTPUT', pdf_path, f'PDF is suspiciously small ({os.path.getsize(pdf_path):,} bytes) — may be corrupt', False)

    if not os.path.exists(pptx_path):
        fail('OUTPUT', pptx_path, 'PPTX output file not found — has it been generated?', False)
    elif os.path.getsize(pptx_path) < 50_000:
        fail('OUTPUT', pptx_path, f'PPTX is suspiciously small ({os.path.getsize(pptx_path):,} bytes) — may be corrupt', False)


# ─── 4. REPORT ──────────────────────────────────────────────────────────────
print(f'\n{"="*60}')
print(f'FirmBenchmark™ QA Report — {d.get("name","Unknown Firm") if slug else "No firm data"}')
print(f'{"="*60}')

if not findings:
    print('\n✅  ALL CHECKS PASSED — reports are clean.\n')
    sys.exit(0)

# Group by category
from collections import defaultdict
by_cat = defaultdict(list)
for f in findings:
    by_cat[f['category']].append(f)

total = len(findings)
auto_fix = sum(1 for f in findings if f['auto_fixable'])
print(f'\n⚠️   {total} issue(s) found ({auto_fix} auto-fixable)\n')

for cat, items in sorted(by_cat.items()):
    print(f'  [{cat}] — {len(items)} issue(s)')
    for item in items:
        fix_tag = ' [auto-fixable]' if item['auto_fixable'] else ' [manual]'
        print(f'    • {item["message"]}{fix_tag}')
        if 'near:' in item['location']:
            print(f'      Context: {item["location"]}')
        elif item['location'] not in ('PDF HTML','PDF CSS @page footer','firm-data.json'):
            print(f'      Location: {item["location"]}')
    print()

print(f'{"="*60}\n')
sys.exit(1)
