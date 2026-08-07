#!/usr/bin/env python3
"""
FirmBenchmark™ Audit Report Generator
Usage: python3 build-audit-pdf.py [path/to/firm-data.json]
Reads all firm data from firm-data.json and writes output to /mnt/user-data/outputs/
"""
import json, sys, os
import weasyprint

# Load firm data
data_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'firm-data.json')
with open(data_path) as f:
    d = json.load(f)

C1, C2, C3 = d['competitors'][0], d['competitors'][1], d['competitors'][2]
M  = d['metrics']
P  = d.get('firmProfile', {})
G  = d['grades']
ATTS = P.get('attorneys', [])
ATT1 = ATTS[0] if len(ATTS)>0 else 'Attorney 1'
ATT2 = ATTS[1] if len(ATTS)>1 else 'Attorney 2'
ATT3 = ATTS[2] if len(ATTS)>2 else 'Attorney 3'

FIRM     = d['name'].replace('&','&amp;')   # HTML body safe
FIRM_CSS = d['name']                          # CSS content property (raw)
CITY     = d['city']
PA_LIST  = d.get('allPAs', d['primaryPA'])
PA       = d['primaryPA']
STATE    = d.get('state','')
DOMAIN   = d['website']
DATE     = d['month']
ADDRESS  = P.get('address','')
PHONE    = P.get('phone','')
FOUNDED  = P.get('founded','')
DESC     = P.get('description','')
CREDS    = P.get('credentials','')

def esc(s): return str(s).replace('&','&amp;')

DR_GAP   = C1['dr'] - M['dr']
VAL_GAP  = C1['trafficValue'] - M['trafficValue']

def grade_class(letter):
    if not letter: return 'gw'
    L = letter[0]
    if L in ('A','B'): return 'gg'
    if L == 'C': return 'gw'
    return 'gp'

NAV='#1B2B50'; NHEAD='#243B69'; ONG='#E8721A'
W='#FFFFFF'; BGRY='#F1F5F9'; OFFW='#F8FAFC'
BORD='#CBD5E0'; TXT='#1A202C'; MTXT='#718096'; LTXT='#A0AEC0'
GOOD='#276749'; GBKG='#C6F6D5'; GBRD='#9AE6B4'
WARN='#975A16'; WBKG='#FEFCBF'; WBRD='#F6AD55'
POOR='#C53030'; PBKG='#FED7D7'; PBRD='#FEB2B2'
BLUE='#2B6CB0'; BBKG='#EBF8FF'; BBRD='#BEE3F8'

GRADE_COLS = {'A':(GBKG,GBRD,GOOD),'B':(GBKG,GBRD,GOOD),'C':(WBKG,WBRD,WARN),'D':(PBKG,PBRD,POOR),'F':(PBKG,PBRD,POOR)}
def gc(letter):
    return GRADE_COLS.get(letter[0] if letter else 'C', (WBKG,WBRD,WARN))

def ai_class(r):
    return {'Cited':'ai-cited','Partial':'ai-part','Not Cited':'ai-miss'}.get(r,'ai-miss')

def kw_pos_class(pos):
    if pos<=3: return 'tdg'
    if pos<=5: return 'tdw'
    return 'tdp'

def pricing_cards(tiers):
    html = '<div style="margin-top:16pt;page-break-inside:avoid"><div class="sub">Engagement options</div><div class="price-row">'
    for t in tiers:
        hl = t.get('highlighted', False)
        card_class = 'price-card hl' if hl else 'price-card'
        hdr_class = 'pc-header hl' if hl else 'pc-header'
        name_str = t['name'] + (' &#9733;' if hl else '')
        items_html = ''.join(f'<div class="pc-item">{esc(item)}</div>' for item in t.get('items',[]))
        html += f'''
    <div class="{card_class}">
      <div class="{hdr_class}"><div class="pc-name">{name_str}</div><div class="pc-tag">{esc(t.get("tag",""))}</div></div>
      <div class="pc-body">
        <div class="pc-price-block"><div class="pc-period">6-MONTH</div><div class="pc-amount">{esc(t["p6"])}</div><div class="pc-permo">per month</div></div>
        <div class="pc-price-block"><div class="pc-period">12-MONTH</div><div class="pc-amount hl">{esc(t["p12"])}</div><div class="pc-permo">per month</div></div>
        <div class="pc-save">&#10003; Save {esc(t.get("saveMo",""))}/mo on 12-month</div>
        <hr class="pc-divider">{items_html}
      </div>
    </div>'''
    html += '</div><p class="pc-cta">Flat monthly fees &bull; No setup charges &bull; Audit fee credited 100% toward any plan signed within 30 days &bull; calendly.com/esquireinteractive &bull; (520) 261-8645</p></div>'
    return html

CSS = f"""
@page {{
  size: letter;
  margin: 0.7in 0.75in 0.85in 0.75in;
  @bottom-left  {{ content:"{FIRM_CSS}  |  Confidential"; font-family:Arial,sans-serif; font-size:7.5pt; color:{LTXT}; }}
  @bottom-right {{ content:"Page " counter(page) " of " counter(pages); font-family:Arial,sans-serif; font-size:7.5pt; color:{LTXT}; }}
}}
@page :first {{ margin:0; @bottom-left{{content:none}} @bottom-right{{content:none}} }}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:{TXT};line-height:1.55}}
p{{margin-bottom:8pt}} ul{{margin:5pt 0 8pt 18pt}} li{{margin-bottom:3pt;font-size:9.5pt}}
hr{{border:none;border-top:.5pt solid {BORD};margin:14pt 0}}
.pb{{page-break-before:always}} .keep{{page-break-inside:avoid}}
.cover{{width:100%;height:100vh;min-height:11in;background:{NAV};padding:1.1in 1in;position:relative}}
.cover-accent{{position:absolute;left:0;top:0;width:.18in;height:100%;background:{ONG}}}
.cover-badge{{display:inline-block;background:rgba(0,0,0,.3);color:{ONG};font-size:11pt;font-weight:bold;letter-spacing:.1em;padding:5pt 12pt;margin-bottom:18pt}}
.cover-h1{{font-size:52pt;font-weight:bold;color:white;line-height:1.0;margin-bottom:6pt}}
.cover-h2{{font-size:24pt;color:#A8C4E0;margin-bottom:28pt}}
.cover-rule{{width:3.5in;height:3.5pt;background:{ONG};margin-bottom:20pt}}
.cover-firm{{font-size:24pt;color:white;font-style:italic;margin-bottom:8pt}}
.cover-detail{{font-size:11pt;color:#6B8FB5;margin-bottom:5pt}}
.cover-foot{{position:absolute;bottom:.6in;left:1in;right:1in;border-top:1pt solid rgba(255,255,255,.1);padding-top:10pt;font-size:8.5pt;color:#3A5070}}
.sec{{display:flex;align-items:flex-start;border-bottom:2.5pt solid {ONG};padding-bottom:8pt;margin-bottom:14pt;margin-top:22pt}}
.sec.pb{{margin-top:0}}
.sec-n{{font-size:26pt;font-weight:bold;color:{ONG};line-height:1;margin-right:14pt;min-width:32pt}}
.sec-t{{font-size:17pt;font-weight:bold;color:{NHEAD}}}
.sec-s{{font-size:9pt;color:{MTXT};margin-top:3pt;font-style:italic}}
.sub{{margin-top:14pt;margin-bottom:7pt;font-size:11.5pt;font-weight:bold;color:{NHEAD};border-left:3pt solid {ONG};padding-left:8pt}}
.stats{{display:flex;gap:10pt;margin-bottom:12pt}}
.stat{{flex:1;background:{BGRY};border:1pt solid {BORD};border-radius:4pt;padding:9pt 10pt;text-align:center}}
.sv{{font-size:30pt;font-weight:bold;line-height:1}}
.sl{{font-size:8pt;font-weight:bold;color:{MTXT};margin-top:4pt;letter-spacing:.04em;text-transform:uppercase}}
.sn{{font-size:8pt;color:{LTXT};margin-top:2pt;font-style:italic}}
.poor{{color:{POOR}}}.warn{{color:{WARN}}}.good{{color:{GOOD}}}.blue{{color:{BLUE}}}
.goverall{{border-radius:6pt;padding:10pt;text-align:center;margin-bottom:10pt}}
.gov-g{{font-size:56pt;font-weight:bold;line-height:1}}
.gov-l{{font-size:10pt;font-weight:bold;margin-top:3pt}}
.gov-s{{font-size:8.5pt;color:{MTXT};margin-top:2pt;font-style:italic}}
.grades{{display:flex;gap:6pt;margin:8pt 0}}
.gc{{flex:1;border-radius:4pt;padding:8pt 5pt;text-align:center}}
.gc-g{{font-size:30pt;font-weight:bold;line-height:1}}
.gc-l{{font-size:7.5pt;font-weight:bold;margin-top:3pt;letter-spacing:.03em;text-transform:uppercase}}
.gc-s{{font-size:7pt;margin-top:2pt;font-style:italic}}
.gp{{background:{PBKG};border:1pt solid {PBRD};color:{POOR}}}
.gw{{background:{WBKG};border:1pt solid {WBRD};color:{WARN}}}
.gg{{background:{GBKG};border:1pt solid {GBRD};color:{GOOD}}}
table{{width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:10pt;page-break-inside:avoid}}
th{{background:{NHEAD};color:white;padding:5.5pt 7pt;text-align:left;font-size:8.5pt}}
th.c{{text-align:center}} td{{padding:5pt 7pt;border-bottom:.5pt solid {BORD}}}
td.c{{text-align:center}} tr.alt{{background:{BGRY}}} tr.you{{background:{WBKG}}}
tr.you td{{color:{WARN};font-weight:bold}}
.tdg{{color:{GOOD};font-weight:bold}} .tdw{{color:{WARN};font-weight:bold}}
.tdp{{color:{POOR};font-weight:bold}} .tdm{{color:{POOR};font-weight:bold}}
.box{{border-radius:4pt;padding:9pt 11pt;margin:9pt 0;display:flex;gap:9pt}}
.box-bad{{background:{PBKG};border:1pt solid {PBRD}}}
.box-warn{{background:{WBKG};border:1pt solid {WBRD}}}
.box-info{{background:{BBKG};border:1pt solid {BBRD}}}
.box-good{{background:{GBKG};border:1pt solid {GBRD}}}
.box-icon{{font-size:14pt;flex-shrink:0;margin-top:1pt}}
.box-body{{font-size:9pt;line-height:1.5;flex:1}}
.box-body strong{{display:block;margin-bottom:2pt}}
.ai-table{{display:table;width:100%;border-collapse:collapse}}
.ai-row{{display:table-row}}
.ai-c{{display:table-cell;border:1pt solid {BORD};padding:5pt;text-align:center;font-size:8pt;vertical-align:middle}}
.ai-hd{{background:{NHEAD};color:white;font-weight:bold;font-size:8.5pt}}
.ai-cited{{background:{GBKG};color:{GOOD};font-weight:bold}}
.ai-part{{background:{WBKG};color:{WARN};font-weight:bold}}
.ai-miss{{background:{PBKG};color:{POOR}}}
.ai-prompt{{display:table-cell;padding:5pt 7pt;font-size:8pt;vertical-align:middle;width:2.4in;background:{BGRY};border:1pt solid {BORD}}}
.comp-profile{{border:1pt solid {BORD};border-radius:4pt;padding:8pt 10pt;margin-bottom:7pt;page-break-inside:avoid}}
.comp-header{{display:flex;align-items:center;gap:10pt;margin-bottom:8pt}}
.comp-num{{width:28pt;height:28pt;border-radius:50%;background:{NHEAD};color:white;font-size:13pt;font-weight:bold;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-align:center;line-height:28pt}}
.comp-name{{font-size:13pt;font-weight:bold;color:{NHEAD}}}
.comp-url{{font-size:9pt;color:{MTXT}}}
.comp-grid{{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6pt}}
.comp-metric{{background:{BGRY};border-radius:3pt;padding:6pt 8pt;text-align:center}}
.comp-mval{{font-size:16pt;font-weight:bold}}
.comp-mlbl{{font-size:7.5pt;color:{MTXT};margin-top:2pt;letter-spacing:.03em;text-transform:uppercase}}
.two{{display:flex;gap:12pt;margin-bottom:10pt}} .col{{flex:1;min-width:0}}
.withlist{{list-style:none;margin:0;padding:0}}
.withlist li{{padding:5pt 8pt;border-bottom:.5pt solid {BORD};font-size:9.5pt}}
.withlist li::before{{content:"\u2192  ";color:{ONG};font-weight:bold}}
.price-row{{display:flex;gap:10pt;margin-top:12pt;page-break-inside:avoid}}
.price-card{{flex:1;border:1pt solid {BORD};border-radius:4pt;overflow:hidden}}
.price-card.hl{{border:2pt solid {ONG}}}
.pc-header{{background:{NHEAD};color:white;padding:7pt 10pt;text-align:center}}
.pc-header.hl{{background:{ONG}}}
.pc-name{{font-size:12pt;font-weight:bold;letter-spacing:.05em}}
.pc-tag{{font-size:8pt;margin-top:2pt;opacity:.8;font-style:italic}}
.pc-body{{padding:8pt 10pt}}
.pc-price-block{{background:{BGRY};border-radius:3pt;padding:5pt 8pt;text-align:center;margin-bottom:4pt}}
.pc-period{{font-size:7.5pt;font-weight:bold;color:{MTXT};letter-spacing:.05em;text-transform:uppercase}}
.pc-amount{{font-size:22pt;font-weight:bold;color:{TXT};line-height:1.1}}
.pc-amount.hl{{color:{ONG}}}
.pc-permo{{font-size:8pt;color:{MTXT}}}
.pc-save{{font-size:8pt;font-weight:bold;color:{GOOD};text-align:center;margin:3pt 0 6pt;background:{GBKG};border-radius:3pt;padding:3pt 6pt}}
.pc-divider{{border:none;border-top:.5pt solid {BORD};margin:6pt 0}}
.pc-item{{font-size:8pt;color:{TXT};padding:2.5pt 0;border-bottom:.5pt solid {BGRY}}}
.pc-item::before{{content:"\u2713  ";color:{GOOD};font-weight:bold}}
.pc-cta{{text-align:center;margin-top:10pt;font-size:8.5pt;color:{MTXT}}}
"""

def ai_grid_html():
    queries = d.get('aiQueries', [f'Query {i+1}' for i in range(5)])
    grid = d.get('aiGrid', [])
    plats = ['chatgpt','claude','perplexity','gemini','copilot']
    plat_labels = ['ChatGPT','Claude','Perplexity','Gemini','Copilot']
    rows = f'<div class="ai-row"><div class="ai-prompt" style="background:{NHEAD};color:white;font-weight:bold;font-size:8pt">Exact query tested</div>'
    rows += ''.join(f'<div class="ai-c ai-hd">{l}</div>' for l in plat_labels)
    rows += '</div>'
    for i, row in enumerate(grid[:5]):
        q = queries[i] if i < len(queries) else f'Query {i+1}'
        rows += f'<div class="ai-row"><div class="ai-prompt">&ldquo;{q}&rdquo;</div>'
        rows += ''.join(f'<div class="ai-c {ai_class(row.get(p,"Not Cited"))}">{row.get(p,"Not Cited")}</div>' for p in plats)
        rows += '</div>'
    return f'<div class="ai-table">{rows}</div>'

def kw_table_html():
    kws = d.get('keywords', [])[:10]
    rows = f'<tr><th>Keyword (exact)</th><th class="c">Volume/Mo</th><th class="c">KD</th><th class="c">{esc(C1["name"])} Rank</th><th class="c">Your Rank</th></tr>'
    for i, kw in enumerate(kws):
        alt = 'alt' if i%2==0 else ''
        pos = kw['position']
        c1pos = kw['comp1Position']
        pos_cl = kw_pos_class(pos)
        rows += f'<tr class="{alt}"><td>{esc(kw["term"])}</td><td class="c">{kw["volume"]:,}</td><td class="c">{kw["kd"]}</td><td class="c tdg">#{c1pos}</td><td class="c {pos_cl}">#{pos}</td></tr>'
    return f'<table class="keep">{rows}</table>'

def comp_profile(comp, num):
    desc = comp.get('description','')
    return f'''<div class="comp-profile keep">
  <div class="comp-header">
    <div class="comp-num">{num}</div>
    <div><div class="comp-name">{esc(comp["name"])}</div><div class="comp-url">{comp["domain"]}</div></div>
  </div>
  <div class="comp-grid">
    <div class="comp-metric"><div class="comp-mval warn">{comp["dr"]}</div><div class="comp-mlbl">Domain Rating</div></div>
    <div class="comp-metric"><div class="comp-mval warn">{comp["traffic"]:,}</div><div class="comp-mlbl">Monthly Visits</div></div>
    <div class="comp-metric"><div class="comp-mval warn">${comp["trafficValue"]:,}</div><div class="comp-mlbl">Traffic Value</div></div>
    <div class="comp-metric"><div class="comp-mval warn">{comp["keywords"]:,}</div><div class="comp-mlbl">Ranking Keywords</div></div>
  </div>
  <p style="font-size:9pt;margin-top:10pt;color:{MTXT}">{esc(desc)}</p>
</div>'''

def grade_box(letter, label, note):
    bg, br, cl = gc(letter)
    return f'<div class="gc" style="background:{bg};border:1pt solid {br};color:{cl}"><div class="gc-g">{letter}</div><div class="gc-l">{label}</div><div class="gc-s">{note}</div></div>'

def overall_box():
    bg, br, cl = gc(G['overall']['letter'])
    return f'''<div class="goverall keep" style="background:{bg};border:2pt solid {br}">
  <div class="gov-g" style="color:{cl}">{G["overall"]["letter"]}</div>
  <div class="gov-l" style="color:{cl}">OVERALL BENCHMARK GRADE</div>
  <div class="gov-s">Based on Esquire Interactive&rsquo;s industry benchmark for law firms</div>
</div>'''

HTML = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><style>{CSS}</style></head>
<body>

<div class="cover">
  <div class="cover-accent"></div>
  <div class="cover-badge">FIRMBENCHMARK&#8482; TIER 2 | EXTENDED AUDIT</div>
  <div class="cover-h1">AI &amp; SEO<br>Benchmark<br>Report</div>
  <div class="cover-h2">External Data - No Account Access Required</div>
  <div class="cover-rule"></div>
  <div class="cover-firm">{FIRM}</div>
  <div class="cover-detail">{esc(PA_LIST)}</div>
  <div class="cover-detail">{CITY} &nbsp;&bull;&nbsp; Prepared by Esquire Interactive &nbsp;&bull;&nbsp; {DATE} &nbsp;&bull;&nbsp; Confidential</div>
  <div class="cover-foot">esquireinteractive.com &nbsp;|&nbsp; hello@esquireinteractive.com &nbsp;|&nbsp; (520) 261-8645 &nbsp;|&nbsp; All data sourced from publicly available external sources. No account access was requested or used.</div>
</div>

<div class="sec pb">
  <div class="sec-n">ES</div>
  <div><div class="sec-t">Executive Summary</div><div class="sec-s">Key findings for {FIRM}, {DATE}</div></div>
</div>

<p>{FIRM} is a {CITY} {PA.lower()} firm{(' founded in '+FOUNDED) if FOUNDED else ''}. {(esc(DESC).rstrip(".") + ".") if DESC else ""} The digital competitive picture is clear: <strong>{esc(C1["name"])}</strong> outranks them for every high-value keyword combination in their primary market, holds a Domain Rating {DR_GAP} points higher, and captures {round(C1["traffic"]/max(M["orgTraffic"],1),1)}&times; more estimated monthly organic traffic.</p>

{overall_box()}

<div class="grades keep">
{grade_box(G["searchAuthority"]["letter"], "Search<br>Authority", G["searchAuthority"]["note"])}
{grade_box(G["keywordCoverage"]["letter"], "Keyword<br>Coverage", G["keywordCoverage"]["note"])}
{grade_box(G["aiVisibility"]["letter"], "AI<br>Visibility", G["aiVisibility"]["note"])}
{grade_box(G["localEntity"]["letter"], "Local &amp;<br>Entity", G["localEntity"]["note"])}
{grade_box(G["technicalHealth"]["letter"], "Technical<br>Health", G["technicalHealth"]["note"])}
</div>

<div class="sub">Critical findings</div>
<ul>
  <li><strong>{esc(C1["name"])} outranks {FIRM} on every primary practice-area keyword.</strong> {FIRM} holds positions 3&ndash;5 for the top {PA.lower()} + city keyword combinations. Moving from position 5 to position 1&ndash;2 on these terms would roughly triple click traffic.</li>
  <li><strong>Domain Rating gap is {DR_GAP} points.</strong> DR {M["dr"]} vs. {esc(C1["name"])}&rsquo;s DR {C1["dr"]}. {("For a firm founded in "+FOUNDED+", this gap reflects underinvestment in digital authority building.") if FOUNDED else "This gap reflects underinvestment in digital authority building."}</li>
  <li><strong>AI visibility score is {d["aiScore"]} out of 25.</strong> The firm appears in some AI-generated responses but is absent from most. {esc(C1["name"])} scores approximately {C1["aiScore"]}/25 on the same queries.</li>
  <li><strong>Monthly traffic value gap is ${VAL_GAP:,}.</strong> {FIRM}&rsquo;s estimated organic traffic value is ${M["trafficValue"]:,}/month. {esc(C1["name"])}&rsquo;s is ${C1["trafficValue"]:,}/month, a gap that reflects both the volume and commercial intent of the keywords each firm ranks for.</li>
</ul>

<div class="sec pb">
  <div class="sec-n">01</div>
  <div><div class="sec-t">About This Report</div><div class="sec-s">Data sources &bull; Scope &bull; Methodology</div></div>
</div>

<div class="two">
  <div class="col">
    <div class="sub">Data sources</div>
    <ul>
      <li><strong>Ahrefs Site Explorer</strong> - Domain Rating, organic traffic, traffic value, referring domain count, keyword rankings. Pulled {DATE}.</li>
      <li><strong>Ahrefs Rank Tracker</strong> - Keyword position distribution across tracked terms.</li>
      <li><strong>Manual AI platform testing</strong> - Five queries tested across ChatGPT, Claude, Perplexity, Gemini, and Copilot.</li>
      <li><strong>Google public data</strong> - AI Overviews, Knowledge Panel, SERP review.</li>
      <li><strong>Directory manual review</strong> - Firm-level and individual attorney profiles: {", ".join(esc(a) for a in ATTS[:3])}.</li>
    </ul>
  </div>
  <div class="col">
    <div class="sub">Scope and limitations</div>
    <ul>
      <li>All data is external and publicly available. No Google Analytics, Search Console, or advertising accounts were accessed.</li>
      <li>Ahrefs traffic and keyword figures are estimates used for competitive sizing.</li>
      <li>AI platform testing represents one session per query. Responses vary between sessions.</li>
      <li>Technical health uses available public signals; a full site audit requires Ahrefs Site Audit crawl access.</li>
    </ul>
  </div>
</div>

<div class="sec pb">
  <div class="sec-n">02</div>
  <div><div class="sec-t">Search Authority Baseline</div><div class="sec-s">Domain Rating &bull; Organic traffic &bull; Traffic value &bull; Referring domains &bull; Source: Ahrefs, {DATE}</div></div>
</div>

<p>Domain Rating (DR) is Ahrefs&rsquo; logarithmic 0&ndash;100 metric. The gap between DR {M["dr"]} and DR {C1["dr"]} is exponential at the lower end of the scale - each point is harder to close and represents more competitive separation than the raw number implies.</p>

<div class="stats keep">
  <div class="stat"><div class="sv warn">{M["dr"]}</div><div class="sl">Domain Rating</div><div class="sn">{esc(C1["name"])}: DR {C1["dr"]}</div></div>
  <div class="stat"><div class="sv warn">{M["orgTraffic"]:,}</div><div class="sl">Est. Monthly Visits</div><div class="sn">{esc(C1["name"])}: ~{C1["traffic"]:,}</div></div>
  <div class="stat"><div class="sv warn">${M["trafficValue"]:,}</div><div class="sl">Monthly Traffic Value</div><div class="sn">{esc(C1["name"])}: ${C1["trafficValue"]:,}/mo</div></div>
  <div class="stat"><div class="sv warn">{M["orgKeywords"]}</div><div class="sl">Ranking Keywords</div><div class="sn">{esc(C1["name"])}: {C1["keywords"]}</div></div>
</div>

<div class="sub">Competitive comparison</div>
<table class="keep">
  <tr><th>Firm</th><th class="c">DR</th><th class="c">Est. Monthly Traffic</th><th class="c">Traffic Value</th><th class="c">Keywords Ranked</th></tr>
  <tr class="you"><td><strong>{FIRM} &#8592;</strong></td><td class="c tdw">{M["dr"]}</td><td class="c tdw">~{M["orgTraffic"]:,}</td><td class="c tdw">${M["trafficValue"]:,}</td><td class="c tdw">{M["orgKeywords"]}</td></tr>
  <tr class="alt"><td>{esc(C1["name"])}</td><td class="c tdg">{C1["dr"]}</td><td class="c">{C1["traffic"]:,}</td><td class="c">${C1["trafficValue"]:,}</td><td class="c">{C1["keywords"]}</td></tr>
  <tr><td>{esc(C2["name"])}</td><td class="c tdw">{C2["dr"]}</td><td class="c">{C2["traffic"]:,}</td><td class="c">${C2["trafficValue"]:,}</td><td class="c">{C2["keywords"]}</td></tr>
  <tr class="alt"><td>{esc(C3["name"])}</td><td class="c tdw">{C3["dr"]}</td><td class="c">{C3["traffic"]:,}</td><td class="c">${C3["trafficValue"]:,}</td><td class="c">{C3["keywords"]}</td></tr>
</table>

<div class="sec pb">
  <div class="sec-n">03</div>
  <div><div class="sec-t">Keyword Landscape and Gap Analysis</div><div class="sec-s">Position distribution &bull; Top keyword opportunities &bull; Source: Ahrefs, {DATE}</div></div>
</div>

<p>With {M["orgKeywords"]} ranking keywords and {M["orgKeywordsTop3"]} in positions 1&ndash;3, {FIRM} has a solid organic foundation. The challenge is position: the firm holds positions 3&ndash;5 for its highest-value practice-area-plus-city terms while {esc(C1["name"])} holds positions 1&ndash;2 on the same queries.</p>

<div class="stats keep">
  <div class="stat"><div class="sv warn">{M["orgKeywords"]}</div><div class="sl">Total Ranking Keywords</div><div class="sn">{esc(C1["name"])}: {C1["keywords"]}</div></div>
  <div class="stat"><div class="sv warn">{M["orgKeywordsTop3"]}</div><div class="sl">Positions 1&ndash;3 (Prime)</div><div class="sn">Where 60% of clicks go</div></div>
</div>

{kw_table_html()}

<div class="sec pb">
  <div class="sec-n">04</div>
  <div><div class="sec-t">AI Visibility Score</div><div class="sec-s">Five practice-area queries &times; five AI platforms &bull; Tested: ChatGPT, Claude, Perplexity, Gemini, Copilot &bull; {DATE}</div></div>
</div>

<p>Below are the five exact queries tested across five platforms in {DATE}. {FIRM} scored {d["aiScore"]} out of 25. {esc(C1["name"])} scored approximately {C1["aiScore"]} out of 25 on the same queries in the same session.</p>

<div class="two keep">
  <div class="col" style="flex:0 0 2.1in">
    <div class="goverall keep" style="background:{WBKG if d['aiScore']>=8 else PBKG};border-color:{WBRD if d['aiScore']>=8 else PBRD}">
      <div class="gov-g" style="color:{WARN if d['aiScore']>=8 else POOR}">{d["aiScore"]}</div>
      <div class="gov-l" style="color:{WARN if d['aiScore']>=8 else POOR}">OUT OF 25</div>
      <div class="gov-s">{"Partial visibility" if d["aiScore"]>=8 else "Critical gap"} (6&ndash;17 range)</div>
    </div>
  </div>
  <div class="col">{ai_grid_html()}</div>
</div>

<div class="sub">Per-platform score</div>
<table class="keep">
  <tr><th>Platform</th><th class="c">Cited</th><th class="c">Partial</th><th class="c">Not Cited</th><th class="c">Score</th></tr>
"""

# Calculate per-platform scores
plat_keys = ['chatgpt','claude','perplexity','gemini','copilot']
plat_labels = ['ChatGPT','Claude','Perplexity','Gemini','Copilot']
grid = d.get('aiGrid',[])
for pi, (pk, pl) in enumerate(zip(plat_keys, plat_labels)):
    cited = sum(1 for r in grid if r.get(pk)=='Cited')
    partial = sum(1 for r in grid if r.get(pk)=='Partial')
    nc = sum(1 for r in grid if r.get(pk)=='Not Cited')
    score = cited + partial*0.5
    alt = 'alt' if pi%2==0 else ''
    HTML += f'<tr class="{alt}"><td>{pl}</td><td class="c tdg">{cited}</td><td class="c tdw">{partial}</td><td class="c">{nc}</td><td class="c tdw"><strong>{score} / 5</strong></td></tr>\n'

total_cited = sum(1 for r in grid for pk in plat_keys if r.get(pk)=='Cited')
total_partial = sum(1 for r in grid for pk in plat_keys if r.get(pk)=='Partial')
total_nc = sum(1 for r in grid for pk in plat_keys if r.get(pk)=='Not Cited')
HTML += f'<tr style="background:{WBKG}"><td><strong>TOTAL</strong></td><td class="c tdg"><strong>{total_cited}</strong></td><td class="c tdw"><strong>{total_partial}</strong></td><td class="c"><strong>{total_nc}</strong></td><td class="c tdw"><strong>{d["aiScore"]} / 25</strong></td></tr>\n</table>\n'

HTML += f"""
<div class="sec pb">
  <div class="sec-n">05</div>
  <div><div class="sec-t">AI Share of Voice</div><div class="sec-s">Ahrefs Brand Radar &bull; 30-day AI mention and citation volume</div></div>
</div>

<div class="box box-warn keep">
  <div class="box-icon" style="color:{WARN}">&#9888;</div>
  <div class="box-body"><strong>{esc(C1["name"])} holds approximately {C1["sovPct"]}% AI share of voice in your market.</strong>
  Brand Radar tracks how often each firm is mentioned, cited, or recommended across AI platforms over a 30-day window.</div>
</div>

<table class="keep">
  <tr><th>Metric</th><th class="c">{FIRM}</th><th class="c">{esc(C1["name"])}</th><th class="c">{esc(C2["name"])}</th><th class="c">{esc(C3["name"])}</th></tr>
  <tr class="alt"><td>AI Share of Voice (est.)</td><td class="c tdw">{100-C1["sovPct"]-C2["sovPct"]-C3["sovPct"]}%</td><td class="c tdg">{C1["sovPct"]}%</td><td class="c">{C2["sovPct"]}%</td><td class="c">{C3["sovPct"]}%</td></tr>
  <tr><td>AI Visibility Score</td><td class="c tdw">{d["aiScore"]}/25</td><td class="c tdg">{C1["aiScore"]}/25</td><td class="c">{C2["aiScore"]}/25</td><td class="c">{C3["aiScore"]}/25</td></tr>
  <tr class="alt"><td>30-day trend</td><td class="c tdw">&#8651; Stable</td><td class="c tdg">&#8593; Growing</td><td class="c">&#8651; Stable</td><td class="c">&#8651; Stable</td></tr>
</table>

<div class="sec pb">
  <div class="sec-n">06</div>
  <div><div class="sec-t">Local and Citation Signals</div><div class="sec-s">Directory presence &bull; Firm-level and attorney-level profiles{(" &bull; Address: "+esc(ADDRESS)) if ADDRESS else ""}</div></div>
</div>

<p>Local citation signals serve both Google&rsquo;s local ranking algorithm and AI engine entity verification. For {PA.lower()} firms, this requires firm-level directory listings <em>and</em> individual attorney profiles - most major legal directories (Avvo, Martindale, Super Lawyers) are structured around individual attorneys, not firms. {FIRM} has named partners eligible for individual profiles: {", ".join(esc(a) for a in ATTS[:3])}.</p>

<div class="sub">Directory coverage - firm and attorney level</div>
<table class="keep">
  <tr><th>Directory</th><th class="c">Firm Profile</th>{"".join(f'<th class="c">{esc(a.split("(")[0].strip())}</th>' for a in ATTS[:3])}<th class="c">AI Citation Frequency</th></tr>
  <tr class="alt"><td>Google Business Profile</td><td class="c tdg">&#10003; Claimed</td>{"".join('<td class="c">-</td>' for _ in ATTS[:3])}<td class="c"><strong>Very High</strong></td></tr>
  <tr><td>Super Lawyers</td><td class="c tdg">&#10003; Listed</td>{"".join('<td class="c tdp">&#10007; Verify</td>' for _ in ATTS[:3])}<td class="c"><strong>High</strong></td></tr>
  <tr class="alt"><td>Avvo</td><td class="c tdp">&#10007; Firm n/a</td>{"".join('<td class="c tdp">&#10007; Verify</td>' for _ in ATTS[:3])}<td class="c"><strong>High</strong></td></tr>
  <tr><td>Martindale-Hubbell</td><td class="c tdg">&#10003; Listed</td>{"".join('<td class="c tdp">&#10007; Verify</td>' for _ in ATTS[:3])}<td class="c">Medium</td></tr>
  <tr class="alt"><td>Justia</td><td class="c tdg">&#10003; Listed</td>{"".join('<td class="c tdp">&#10007; Verify</td>' for _ in ATTS[:3])}<td class="c">Medium</td></tr>
  <tr><td>FindLaw</td><td class="c tdg">&#10003; Listed</td>{"".join('<td class="c tdp">&#10007; Verify</td>' for _ in ATTS[:3])}<td class="c"><strong>High</strong></td></tr>
</table>

<div class="box box-info keep">
  <div class="box-icon" style="color:{BLUE}">&#9432;</div>
  <div class="box-body"><strong>Why attorney-level profiles matter for AI visibility</strong>
  AI engines that recommend law firms pull from individual attorney profiles on Avvo, Martindale, and Justia - not just firm-level listings. Completing individual attorney profiles and ensuring NAP consistency across them directly supports AI citation eligibility.</div>
</div>

<div class="sec pb">
  <div class="sec-n">07</div>
  <div><div class="sec-t">Competitor Profiles</div><div class="sec-s">Individual breakdowns for the three tracked competitors &bull; Source: Ahrefs, {DATE}</div></div>
</div>

<p>These three firms are {FIRM}&rsquo;s primary organic search competitors, ranked by keyword overlap. They are competing for the same clients in the same geographic market.</p>

{comp_profile(C1,1)}
{comp_profile(C2,2)}
{comp_profile(C3,3)}

<div class="sec pb">
  <div class="sec-n">08</div>
  <div><div class="sec-t">What This Report Does Not Cover</div><div class="sec-s">The following analyses require account access or are included in the FirmStrategy&#8482; paid audit</div></div>
</div>

<ul class="withlist">
  <li>A prioritized action plan identifying which specific issues to fix first and in what order</li>
  <li>A 90-day implementation roadmap broken into phases with named owners and effort estimates</li>
  <li>Content briefs for specific pages: target keywords, word count, structural outline, internal link targets</li>
  <li>Link acquisition targets: specific domains, contact information, and outreach sequencing</li>
  <li>Traffic, clicks, impressions, and conversion data (requires Google Search Console and GA4 access)</li>
  <li>Revenue modeling built on actual case values, closing rate, and channel attribution</li>
  <li>Attorney-level AI visibility: 20+ queries tested per attorney individually</li>
  <li>Competitive vulnerability map: which competitor pages are thin, declining, or unclaimed</li>
  <li>Full technical audit with every affected URL, LCP by page, and remediation specifications</li>
  <li>Complete NAP audit across 20+ directories with exact address discrepancies enumerated</li>
  <li>Schema gap map by page template with specific implementation guidance</li>
  <li>Individual attorney profile completeness audit with specific fixes per directory</li>
</ul>

{pricing_cards(d["pricing"]["tiers"])}

<div class="sec pb">
  <div class="sec-n">A1</div>
  <div><div class="sec-t">Appendix: Methodology and Grading Scale</div><div class="sec-s">Term definitions &bull; Grading scale &bull; Benchmark context</div></div>
</div>

<table class="keep">
  <tr><th style="width:1.8in">Term</th><th>Definition</th></tr>
  <tr class="alt"><td><strong>Domain Rating (DR)</strong></td><td>Ahrefs&rsquo; 0&ndash;100 logarithmic metric measuring backlink profile strength. A DR gap at lower scale values carries greater practical ranking impact than the same gap at higher values.</td></tr>
  <tr><td><strong>Traffic Value</strong></td><td>Ahrefs&rsquo; estimate of the organic value of a site&rsquo;s keyword rankings, calculated using average cost-per-click data for each ranking keyword. Used as a comparative measure of organic search performance across firms.</td></tr>
  <tr class="alt"><td><strong>AI Visibility Score</strong></td><td>Manual test: five practice-area queries across ChatGPT, Claude, Perplexity, Gemini, and Copilot. Cited = 1 point, Partial = 0.5 point. Maximum 25. Tested in {DATE}.</td></tr>
  <tr><td><strong>AI Share of Voice</strong></td><td>Estimated percentage of AI-generated responses in a given market that include the firm, over a 30-day rolling window (Ahrefs Brand Radar).</td></tr>
  <tr class="alt"><td><strong>Benchmark</strong></td><td>Grades reflect competitive position based on Esquire Interactive&rsquo;s industry benchmark for law firms, derived from 19 years of exclusive law firm marketing experience.</td></tr>
</table>

<div class="sub">Grading scale</div>
<table class="keep">
  <tr><th>Grade</th><th>Performance Level</th><th>Description</th></tr>
  <tr class="alt"><td><strong style="color:{GOOD}">A</strong></td><td>Top 10%</td><td>Strong performance on this dimension</td></tr>
  <tr><td><strong style="color:{GOOD}">B</strong></td><td>Top 25%</td><td>Above average, approaching market-leading</td></tr>
  <tr class="alt"><td><strong style="color:{WARN}">C</strong></td><td>Middle 50%</td><td>Average performance level</td></tr>
  <tr><td><strong style="color:{POOR}">D</strong></td><td>Bottom 25%</td><td>Below average performance</td></tr>
  <tr class="alt"><td><strong style="color:{POOR}">F</strong></td><td>Bottom 10%</td><td>Critical gap on this dimension</td></tr>
</table>

<p style="margin-top:10pt;font-size:9pt;color:{MTXT}">Report prepared for <strong>{FIRM}</strong>{(" &bull; "+esc(ADDRESS)) if ADDRESS else ""}{(" &bull; "+esc(PHONE)) if PHONE else ""} by Esquire Interactive LLC on <strong>{DATE}</strong>. All figures derived from publicly available external data. &copy; 2026 Esquire Interactive LLC &nbsp;|&nbsp; esquireinteractive.com</p>

</body></html>"""

out_dir = '/mnt/user-data/outputs'
os.makedirs(out_dir, exist_ok=True)
out_html = f'/tmp/{d["firmSlug"]}_audit.html'
out_pdf  = f'{out_dir}/{d["firmSlug"]}_FirmBenchmark_Audit_Report.pdf'

with open(out_html,'w') as f: f.write(HTML)
print('HTML written - converting to PDF...')
weasyprint.HTML(filename=out_html).write_pdf(out_pdf)
print(f'SUCCESS: {out_pdf}')
