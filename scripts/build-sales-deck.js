#!/usr/bin/env node
/**
 * FirmBenchmark™ Sales Deck Generator
 * Usage: node build-sales-deck.js [path/to/firm-data.json]
 * Reads all firm data from firm-data.json and writes output to /mnt/user-data/outputs/
 */
const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

// Load firm data
const dataPath = process.argv[2] || path.join(__dirname, 'firm-data.json');
if (!fs.existsSync(dataPath)) { console.error('firm-data.json not found at', dataPath); process.exit(1); }
const d = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const C1 = d.competitors[0], C2 = d.competitors[1], C3 = d.competitors[2];
const trafficGap = (C1.trafficValue - d.metrics.trafficValue).toLocaleString();
const drGap = C1.dr - d.metrics.dr;

// Output path
const outDir = '/mnt/user-data/outputs';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${d.firmSlug}_FirmBenchmark_Sales_Deck.pptx`);

// ── Colors ─────────────────────────────────────────────────────────
const C = {
  navy:'1B2B50', nhead:'243B69', orange:'E8721A',
  white:'FFFFFF', offWhite:'F8FAFC',
  body:'1A202C', mid:'718096', light:'A0AEC0', bord:'CBD5E0',
  good:'276749', gbg:'C6F6D5', gbr:'9AE6B4',
  warn:'975A16', wbg:'FEFCBF', wbr:'F6AD55',
  poor:'C53030', pbg:'FED7D7', pbr:'FEB2B2',
  blue:'2B6CB0',
};

const pres = new PptxGenJS();
pres.layout = 'LAYOUT_16x9';
const W=10, M=0.38, CY=1.5;

// ── Helpers ────────────────────────────────────────────────────────
const darkBg = s => {
  s.addShape(pres.ShapeType.rect,{x:0,y:0,w:'100%',h:'100%',fill:{color:C.navy},line:{type:'none'}});
  s.addShape(pres.ShapeType.rect,{x:0,y:0,w:0.14,h:'100%',fill:{color:C.orange},line:{type:'none'}});
};
const whiteBg = s => s.addShape(pres.ShapeType.rect,{x:0,y:0,w:'100%',h:'100%',fill:{color:C.white},line:{type:'none'}});

function head(s, eyebrow, title, sub) {
  s.addShape(pres.ShapeType.rect,{x:0,y:0,w:'100%',h:0.055,fill:{color:C.orange},line:{type:'none'}});
  const pw=Math.max(Math.min(eyebrow.length*0.105+0.3,4.5),1.4);
  s.addShape(pres.ShapeType.rect,{x:M,y:0.1,w:pw,h:0.27,fill:{color:C.navy},line:{type:'none'}});
  s.addText(eyebrow,{x:M+0.07,y:0.12,w:pw-0.12,h:0.23,fontSize:8.5,bold:true,color:C.orange,fontFace:'Calibri',margin:0,charSpacing:1.5});
  s.addText(title,{x:M,y:0.44,w:W-M*2,h:0.62,fontSize:26,bold:true,color:C.nhead,fontFace:'Calibri',margin:0});
  if(sub) s.addText(sub,{x:M,y:1.06,w:W-M*2,h:0.28,fontSize:10.5,color:C.mid,fontFace:'Calibri',margin:0,italic:true});
  s.addShape(pres.ShapeType.rect,{x:0,y:CY-0.1,w:'100%',h:0.012,fill:{color:C.bord},line:{type:'none'}});
  s.addText('esquireinteractive.com',{x:M,y:5.46,w:3,h:0.16,fontSize:8,color:'D1D5DB',fontFace:'Calibri',margin:0});
}

function statBox(s,x,y,w,val,lbl,note,col) {
  s.addShape(pres.ShapeType.rect,{x,y,w,h:1.72,fill:{color:C.offWhite},line:{color:C.bord,pt:0.75}});
  s.addText(val,{x:x+0.12,y:y+0.1,w:w-0.24,h:0.96,fontSize:52,bold:true,color:col||C.poor,fontFace:'Calibri',align:'center',margin:0});
  s.addText(lbl,{x:x+0.12,y:y+1.06,w:w-0.24,h:0.28,fontSize:9.5,bold:true,color:C.mid,fontFace:'Calibri',align:'center',margin:0});
  if(note) s.addText(note,{x:x+0.12,y:y+1.34,w:w-0.24,h:0.24,fontSize:8.5,color:C.light,fontFace:'Calibri',align:'center',margin:0,italic:true});
}

function gradeCard(s,x,y,w,h,g,lbl,sub,bg,br,cl) {
  s.addShape(pres.ShapeType.rect,{x,y,w,h,fill:{color:bg},line:{color:br,pt:1}});
  s.addText(g,{x,y:y+0.08,w,h:h*0.58,fontSize:38,bold:true,color:cl,fontFace:'Calibri',align:'center',margin:0});
  s.addText(lbl,{x:x+0.06,y:y+h*0.62,w:w-0.12,h:0.28,fontSize:8.5,bold:true,color:cl,fontFace:'Calibri',align:'center',margin:0});
  s.addText(sub,{x:x+0.04,y:y+h*0.62+0.28,w:w-0.08,h:0.22,fontSize:7.5,color:C.mid,fontFace:'Calibri',align:'center',margin:0,italic:true});
}

function gradeStyle(letter) {
  if(!letter) return {bg:C.wbg,br:C.wbr,cl:C.warn};
  const L=letter[0];
  if(L==='A') return {bg:C.gbg,br:C.gbr,cl:C.good};
  if(L==='B') return {bg:C.gbg,br:C.gbr,cl:C.good};
  if(L==='C') return {bg:C.wbg,br:C.wbr,cl:C.warn};
  if(L==='D') return {bg:C.pbg,br:C.pbr,cl:C.poor};
  return {bg:'FFF0F0',br:C.pbr,cl:C.poor};
}

function tbl(s,rows,x,y,w,h,rh,cw) {
  s.addTable(rows,{x,y,w,h,rowH:rh,colW:cw,border:{type:'solid',color:C.bord,pt:0.5},valign:'middle'});
}
const th=(t,c)=>({text:t,options:{bold:true,color:C.white,fill:C.nhead,fontSize:9,fontFace:'Calibri',align:c?'center':'left'}});
const td=(t,i,al,cl)=>({text:t,options:{fontSize:9,fontFace:'Calibri',fill:i%2===0?C.offWhite:C.white,color:cl||C.body,align:al||'left',bold:!!cl}});
const tdc=(t,i,cl)=>td(t,i,'center',cl);

// ── SLIDE 1: Cover ─────────────────────────────────────────────────
{
  const s=pres.addSlide(); darkBg(s);
  s.addShape(pres.ShapeType.rect,{x:0.45,y:0.72,w:4.2,h:0.32,fill:{color:'0F1E3B'},line:{type:'none'}});
  s.addText(`FIRMBENCHMARK\u2122  \u2022  ${d.city.toUpperCase()}`,{x:0.52,y:0.77,w:4.1,h:0.22,fontSize:9.5,bold:true,color:C.orange,fontFace:'Calibri',margin:0,charSpacing:1.5});
  s.addText(d.coverHeadline,{x:0.45,y:1.12,w:9,h:1.9,fontSize:58,bold:true,color:C.white,fontFace:'Calibri',margin:0});
  s.addText(d.coverSub,{x:0.45,y:3.0,w:9,h:0.52,fontSize:28,color:C.orange,fontFace:'Calibri',italic:true,margin:0});
  s.addShape(pres.ShapeType.rect,{x:0.45,y:3.65,w:8.9,h:0.045,fill:{color:C.orange},line:{type:'none'}});
  s.addText(d.name,{x:0.45,y:3.74,w:8.9,h:0.4,fontSize:22,color:'A8C4E0',fontFace:'Calibri',italic:true,margin:0});
  s.addText(`${d.primaryPA}  \u2022  ${d.city}  \u2022  Prepared by Esquire Interactive  |  ${d.month}  |  Confidential`,{x:0.45,y:4.2,w:8.9,h:0.26,fontSize:10,color:'4A6880',fontFace:'Calibri',margin:0});
  s.addShape(pres.ShapeType.rect,{x:0,y:5.18,w:'100%',h:0.44,fill:{color:'0A1428'},line:{type:'none'}});
  s.addText('This presentation is a summary. The full FirmBenchmark\u2122 Audit Report is attached separately.',{x:0.45,y:5.24,w:9,h:0.24,fontSize:8.5,color:'3A5070',fontFace:'Calibri',margin:0});
}

// ── SLIDE 2: The Verdict ────────────────────────────────────────────
{
  const s=pres.addSlide(); whiteBg(s);
  const g=d.grades;
  head(s,'THE VERDICT','Here\u2019s your report card.',`${d.name} vs. the ${d.city} ${d.primaryPA.toLowerCase()} market  - Ahrefs data, ${d.month}`);
  const sw=(W-M*2-0.24)/3;
  statBox(s,M,          CY,sw,`${d.aiScore}/25`,'AI VISIBILITY',`Partial visibility  - ${C1.name} scores ${C1.aiScore}+`);
  statBox(s,M+sw+0.12,  CY,sw,`DR ${d.metrics.dr}`,'DOMAIN RATING',`${C1.name}: DR ${C1.dr} , ${drGap} points ahead`);
  statBox(s,M+sw*2+0.24,CY,sw,`$${d.metrics.trafficValue.toLocaleString()}`,'MONTHLY TRAFFIC VALUE',`${C1.name}: $${C1.trafficValue.toLocaleString()}/mo`);
  const ay=CY+1.84;
  s.addShape(pres.ShapeType.rect,{x:M,y:ay,w:W-M*2,h:0.56,fill:{color:C.wbg},line:{color:C.wbr,pt:1}});
  s.addText(`\u26a0  ${d.name} vs. ${C1.name}: a $${trafficGap}/month traffic value gap, a ${drGap}-point Domain Rating gap, and ${C1.name} holding ${C1.sovPct}% AI share of voice in your market.`,{x:M+0.12,y:ay+0.08,w:W-M*2-0.24,h:0.4,fontSize:10.5,bold:true,color:C.warn,fontFace:'Calibri',margin:0});
  const gcY=ay+0.7, gcW=1.53, gcH=1.55, gcGap=(W-gcW*6)/7;
  const dims=[
    {g:g.searchAuthority.letter,  l:'Search\nAuthority',  s:g.searchAuthority.note},
    {g:g.keywordCoverage.letter,  l:'Keyword\nCoverage',  s:g.keywordCoverage.note},
    {g:g.aiVisibility.letter,     l:'AI\nVisibility',     s:g.aiVisibility.note},
    {g:g.localEntity.letter,      l:'Local &\nEntity',    s:g.localEntity.note},
    {g:g.technicalHealth.letter,  l:'Technical\nHealth',  s:g.technicalHealth.note},
    {g:g.overall.letter,          l:'OVERALL',            s:g.overall.note, isOv:true},
  ];
  dims.forEach((dim,i)=>{
    const x=gcGap+i*(gcW+gcGap);
    if(dim.isOv){
      s.addShape(pres.ShapeType.rect,{x,y:gcY,w:gcW,h:gcH,fill:{color:C.navy},line:{color:C.orange,pt:2}});
      s.addText(dim.g,{x,y:gcY+0.08,w:gcW,h:gcH*0.58,fontSize:38,bold:true,color:C.orange,fontFace:'Calibri',align:'center',margin:0});
      s.addText('OVERALL',{x:x+0.06,y:gcY+gcH*0.62,w:gcW-0.12,h:0.28,fontSize:9,bold:true,color:C.white,fontFace:'Calibri',align:'center',margin:0});
      s.addText(dim.s,{x:x+0.04,y:gcY+gcH*0.62+0.28,w:gcW-0.08,h:0.22,fontSize:7.5,color:'A0B8D0',fontFace:'Calibri',align:'center',margin:0,italic:true});
    } else {
      const {bg,br,cl}=gradeStyle(dim.g);
      gradeCard(s,x,gcY,gcW,gcH,dim.g,dim.l,dim.s,bg,br,cl);
    }
  });
}

// ── SLIDE 3: The Competition ────────────────────────────────────────
{
  const s=pres.addSlide(); whiteBg(s);
  head(s,'THE COMPETITION',`${C1.name} outranks you for every term that matters.`,`DR ${C1.dr} vs your DR ${d.metrics.dr}. They have ${(C1.traffic/Math.max(d.metrics.orgTraffic,1)).toFixed(1)}\u00d7 more estimated monthly traffic.`);
  const shortName = d.name.length > 20 ? d.name.split(/[,\s]/)[0] : d.name;
  const sovData=[{name:'Est. Monthly Traffic',labels:[shortName,C3.name,C2.name,C1.name],values:[d.metrics.orgTraffic,C3.traffic,C2.traffic,C1.traffic]}];
  s.addChart(pres.ChartType.bar,sovData,{x:M,y:CY+0.06,w:5.55,h:3.55,barDir:'bar',barGrouping:'clustered',chartColors:[C.poor,'A0AEC0','718096',C.nhead],showValue:true,dataLabelPosition:'outEnd',dataLabelFontSize:12,dataLabelColor:C.body,catAxisLabelFontSize:10,valAxisLabelFontSize:9,catGridLine:{style:'none'},valGridLine:{color:'E2E8F0',size:0.5},showTitle:false,showLegend:false});
  const mx=6.2,my=CY+0.06;
  tbl(s,[
    [th('METRIC'),th('YOU',1),th('COMP 1',1)],
    ...[['Domain Rating',`${d.metrics.dr}`,`${C1.dr}`],['Monthly Traffic',`~${d.metrics.orgTraffic.toLocaleString()}`,`~${C1.traffic.toLocaleString()}`],['Traffic Value',`$${d.metrics.trafficValue.toLocaleString()}`,`$${C1.trafficValue.toLocaleString()}`],['Ranking Keywords',`${d.metrics.orgKeywords}`,`${C1.keywords}`],['AI Share of Voice',`~${100-C1.sovPct-C2.sovPct-C3.sovPct}%`,`${C1.sovPct}%`]].map(([m,y,c],i)=>[td(m,i),tdc(y,i,C.poor),tdc(c,i,C.good)])
  ],mx,my,3.45,2.28,0.38,[1.65,0.9,0.9]);
  s.addText(`Direction matters more than position.\n${C1.name} is gaining AI ground every month.\nThe longer this runs, the harder it is to close.`,{x:mx,y:my+2.36,w:3.45,h:0.8,fontSize:9.5,color:C.body,fontFace:'Calibri',margin:0,italic:true,lineSpacing:16});
}

// ── SLIDE 4: The Math ───────────────────────────────────────────────
{
  const s=pres.addSlide(); whiteBg(s);
  const topKw = d.keywords.find(k=>k.volume>=200 && k.position>=4) || d.keywords[0];
  const bigKw = d.keywords.find(k=>k.volume>=1000) || d.keywords[d.keywords.length-1];
  head(s,'THE MATH',`The organic traffic value gap is $${trafficGap} a month.`,`${C1.name} ranks for higher-volume, higher-value terms. Here\u2019s what the gap looks like.`);
  const items=[
    {val:`$${trafficGap}`,lbl:'MONTHLY TRAFFIC VALUE GAP',sub:`${C1.name} $${C1.trafficValue.toLocaleString()} vs. your $${d.metrics.trafficValue.toLocaleString()} , Ahrefs traffic value estimate`,col:C.poor},
    {val:`#${topKw.position}`,lbl:`YOUR RANK: \u201C${topKw.term.toUpperCase()}\u201D`,sub:`${topKw.volume.toLocaleString()}/mo volume. ${C1.name} ranks #${topKw.comp1Position}. You should own this.`,col:C.warn},
    {val:`#${bigKw.position}`,lbl:`YOUR RANK: \u201C${bigKw.term.toUpperCase()}\u201D`,sub:`${bigKw.volume.toLocaleString()}/mo volume. KD ${bigKw.kd}. High opportunity.`,col:bigKw.position>10?C.poor:C.warn},
  ];
  items.forEach((it,i)=>{
    const y=CY+i*1.34;
    s.addShape(pres.ShapeType.rect,{x:M,y,w:5.5,h:1.2,fill:{color:C.offWhite},line:{color:C.bord,pt:0.75}});
    s.addShape(pres.ShapeType.rect,{x:M,y,w:0.055,h:1.2,fill:{color:C.orange},line:{type:'none'}});
    s.addText(it.val,{x:M+0.16,y:y+0.06,w:5.2,h:0.7,fontSize:42,bold:true,color:it.col,fontFace:'Calibri',align:'center',margin:0});
    s.addText(it.lbl,{x:M+0.16,y:y+0.74,w:5.2,h:0.26,fontSize:8.5,bold:true,color:C.mid,fontFace:'Calibri',align:'center',margin:0});
    s.addText(it.sub,{x:M+0.16,y:y+0.98,w:5.2,h:0.18,fontSize:8,color:C.light,fontFace:'Calibri',align:'center',margin:0,italic:true});
  });
  s.addShape(pres.ShapeType.rect,{x:6.2,y:CY,w:3.5,h:4.02,fill:{color:C.navy},line:{type:'none'}});
  s.addText('What the data shows',{x:6.3,y:CY+0.2,w:3.3,h:0.32,fontSize:11,bold:true,color:C.orange,fontFace:'Calibri',align:'center',margin:0,charSpacing:0.5});
  const desc = d.firmProfile ? d.firmProfile.description : `${d.name} in ${d.city}`;
  s.addText(`${desc}.\n\nDespite those credentials, ${C1.name}  - with DR ${C1.dr} vs your DR ${d.metrics.dr}  - holds a dominant position across every high-value keyword combination in this market.\n\nThat\u2019s not a reflection of legal quality. It reflects the difference in digital authority investment.`,{x:6.3,y:CY+0.62,w:3.3,h:3.2,fontSize:9.5,color:'A0B8D0',fontFace:'Calibri',margin:0,lineSpacing:17});
}

// ── SLIDE 5: The Keywords ───────────────────────────────────────────
{
  const s=pres.addSlide(); whiteBg(s);
  head(s,'THE KEYWORDS','You rank for the right terms. Just not at the right positions.',`Your top ${Math.min(d.keywords.length,8)} keyword positions from Ahrefs  - where you are vs. where you should be.`);
  const kws=d.keywords.slice(0,8);
  tbl(s,[
    [th('Keyword'),th('Vol/Mo',1),th('KD',1),th(`${C1.name.split(' ').slice(0,2).join(' ')} Rank`,1),th('Your Rank',1)],
    ...kws.map((kw,i)=>[
      td(kw.term,i),
      tdc(kw.volume.toLocaleString(),i),
      tdc(String(kw.kd),i),
      tdc(`#${kw.comp1Position}`,i,C.good),
      tdc(`#${kw.position}`,i,kw.position<=3?C.good:kw.position<=5?C.warn:C.poor),
    ])
  ],M,CY+0.04,W-M*2,3.74,0.34,[3.1,0.78,0.62,1.5,1.28]);
  s.addText(`Moving from position 4\u20135 to position 1\u20132 on these terms can increase click-through by 300\u2013600% on the same keyword. Source: Ahrefs Site Explorer, ${d.month}.`,{x:M,y:5.2,w:W-M*2,h:0.22,fontSize:7.5,color:C.light,fontFace:'Calibri',italic:true,margin:0});
}

// ── SLIDE 6: The Test ───────────────────────────────────────────────
{
  const s=pres.addSlide(); whiteBg(s);
  head(s,'THE TEST',`25 chances to get recommended by AI.`,`You got ${d.aiScore}. ${C1.name} got ${C1.aiScore} in the same session.`);
  const scoreColor = d.aiScore>=13?C.good:d.aiScore>=8?C.warn:C.poor;
  const scoreBg = d.aiScore>=13?C.gbg:d.aiScore>=8?C.wbg:C.pbg;
  s.addShape(pres.ShapeType.rect,{x:M,y:CY,w:2.1,h:2.22,fill:{color:scoreBg},line:{color:scoreColor,pt:1.5}});
  s.addText(String(d.aiScore),{x:M,y:CY+0.08,w:2.1,h:1.52,fontSize:96,bold:true,color:scoreColor,fontFace:'Calibri',align:'center',margin:0});
  s.addText('OUT OF 25',{x:M,y:CY+1.6,w:2.1,h:0.28,fontSize:11,bold:true,color:scoreColor,fontFace:'Calibri',align:'center',margin:0});
  const label=d.aiScore>=13?'STRONG PRESENCE':d.aiScore>=8?'PARTIAL VISIBILITY':'CRITICAL GAP';
  s.addText(label,{x:M,y:CY+1.9,w:2.1,h:0.22,fontSize:8.5,color:C.mid,fontFace:'Calibri',align:'center',margin:0,italic:true});
  const lgy=CY+2.46;
  [['Cited',C.gbg,C.good],['Partial',C.wbg,C.warn],['Not Cited',C.pbg,C.poor]].forEach(([l,bg,tx],i)=>{
    s.addShape(pres.ShapeType.rect,{x:M+i*0.74,y:lgy,w:0.66,h:0.3,fill:{color:bg},line:{color:C.bord,pt:0.5}});
    s.addText(l,{x:M+i*0.74,y:lgy+0.02,w:0.66,h:0.26,fontSize:8,color:tx,fontFace:'Calibri',align:'center',margin:0,bold:true});
  });
  const gx=2.68,gy=CY,cw=1.44;
  const plats=['ChatGPT','Claude','Perplexity','Gemini','Copilot'];
  plats.forEach((p,i)=>{
    s.addShape(pres.ShapeType.rect,{x:gx+i*cw,y:gy,w:cw-0.04,h:0.4,fill:{color:C.navy},line:{type:'none'}});
    s.addText(p,{x:gx+i*cw,y:gy+0.04,w:cw-0.04,h:0.32,fontSize:10,bold:true,color:C.white,fontFace:'Calibri',align:'center',margin:0});
  });
  const cb={'Cited':C.gbg,'Partial':C.wbg,'Not Cited':C.pbg};
  const ct={'Cited':C.good,'Partial':C.warn,'Not Cited':C.poor};
  const rh=0.45;
  d.aiGrid.forEach((row,r)=>{
    const results=[row.chatgpt,row.claude,row.perplexity,row.gemini,row.copilot];
    results.forEach((res,c)=>{
      s.addShape(pres.ShapeType.rect,{x:gx+c*cw,y:gy+0.44+r*rh,w:cw-0.04,h:rh-0.04,fill:{color:cb[res]||C.pbg},line:{color:C.bord,pt:0.5}});
      s.addText(res||'Not Cited',{x:gx+c*cw,y:gy+0.48+r*rh,w:cw-0.04,h:rh-0.1,fontSize:res==='Not Cited'?8:9,bold:res==='Cited',color:ct[res]||C.poor,fontFace:'Calibri',align:'center',margin:0});
    });
    const query=(d.aiQueries&&d.aiQueries[r])||`Query ${r+1}`;
    s.addText(`\u201c${query}\u201d`,{x:gx+5*cw+0.1,y:gy+0.49+r*rh,w:2.38,h:rh-0.1,fontSize:8,color:C.body,fontFace:'Calibri',margin:0});
  });
}

// ── SLIDE 7: The Fix ────────────────────────────────────────────────
{
  const s=pres.addSlide(); whiteBg(s);
  head(s,'THE FIX','Here\u2019s what actually changes this.',`Systematic. Measurable. Built for law firms because that\u2019s all we do.`);
  const items=[
    {head:'Search authority',      body:`Close the DR gap through targeted link acquisition, legal directory optimization, and authoritative citation building. ${C1.name} has ${drGap} DR points on you  - closable with the right strategy.`},
    {head:'AI visibility',         body:'Structured data, entity verification, Knowledge Panel establishment, and citation source outreach. Partial AI visibility improves through the same signals that improve organic rankings.'},
    {head:'Keyword positioning',   body:`Moving from positions 4\u20135 to 1\u20132 on your highest-value terms requires authority and content depth together. That\u2019s exactly what we build.`},
    {head:'Technical foundation',  body:'Schema markup, LCP improvement, internal link structure, meta optimizations. Infrastructure changes that compound over time.'},
    {head:'Content authority',     body:`${d.primaryPA} content expansion, FAQ and educational pages, attorney bio optimization targeting your highest-value case types.`},
    {head:'FirmMetrics\u00ae',           body:'Every baseline locked on day one. Progress reported monthly  - DR, rankings, AI visibility score, traffic value. No vanity metrics.'},
  ];
  const cw=2.95, ch=1.48, gap=(W-cw*3)/4;
  items.forEach((it,i)=>{
    const row=Math.floor(i/3),col=i%3;
    const x=gap+col*(cw+gap),y=CY+row*(ch+0.14);
    s.addShape(pres.ShapeType.rect,{x,y,w:cw,h:ch,fill:{color:C.offWhite},line:{color:C.bord,pt:0.75}});
    s.addShape(pres.ShapeType.rect,{x,y,w:0.055,h:ch,fill:{color:C.orange},line:{type:'none'}});
    s.addText(it.head,{x:x+0.15,y:y+0.1,w:cw-0.25,h:0.3,fontSize:11.5,bold:true,color:C.nhead,fontFace:'Calibri',margin:0});
    s.addShape(pres.ShapeType.rect,{x:x+0.15,y:y+0.44,w:cw-0.3,h:0.012,fill:{color:C.bord},line:{type:'none'}});
    s.addText(it.body,{x:x+0.15,y:y+0.5,w:cw-0.25,h:ch-0.6,fontSize:8.5,color:C.body,fontFace:'Calibri',margin:0,lineSpacing:14});
  });
}

// ── SLIDE 8: The Team ───────────────────────────────────────────────
{
  const s=pres.addSlide(); whiteBg(s);
  head(s,'THE TEAM','We wrote the ABA book on this. Literally.','Attorney-led. 19 years. 50+ firms. Zero account managers reading from dashboards.');
  const creds=[
    ['Founded by an attorney',`Jeff Lantz is a licensed attorney and ABA published author. He knows what you can and can\u2019t say in ads. Because he\u2019s a lawyer.`],
    ['Only law firms. Always.',`Every strategy is shaped by 19 years working exclusively with attorneys. No cross-industry guesswork. No learning curve at your expense.`],
    ['Law firms only. Always.',`Every strategy is shaped by 19 years working exclusively with law firms. No cross-industry guesswork. No learning curve at your expense.`],
    ['One accountable person',`Your work is led by a senior executive who owns the plan, understands every channel, and answers your call directly. No \u201clet me check with the team.\u201d`],
  ];
  creds.forEach((c,i)=>{
    const y=CY+i*1.02;
    s.addShape(pres.ShapeType.rect,{x:M,y,w:5.5,h:0.9,fill:{color:i%2===0?C.offWhite:C.white},line:{color:C.bord,pt:0.5}});
    s.addShape(pres.ShapeType.rect,{x:M,y,w:0.055,h:0.9,fill:{color:C.orange},line:{type:'none'}});
    s.addText(c[0],{x:M+0.16,y:y+0.08,w:5.22,h:0.26,fontSize:11,bold:true,color:C.nhead,fontFace:'Calibri',margin:0});
    s.addText(c[1],{x:M+0.16,y:y+0.34,w:5.22,h:0.52,fontSize:9,color:C.body,fontFace:'Calibri',margin:0,lineSpacing:14});
  });
  s.addShape(pres.ShapeType.rect,{x:6.1,y:CY,w:3.6,h:4.02,fill:{color:C.navy},line:{type:'none'}});
  s.addText('The numbers',{x:6.2,y:CY+0.18,w:3.4,h:0.3,fontSize:11,bold:true,color:C.orange,fontFace:'Calibri',align:'center',margin:0,charSpacing:1});
  [['19 years','Law firms exclusively'],['Attorney-led','Jeff Lantz is a licensed attorney'],['ABA','Published on law firm marketing'],['National','Firms across the Southeast US'],['One phone call','Straight to a senior strategist']].forEach((r,i)=>{
    const y=CY+0.62+i*0.68;
    s.addText(r[0],{x:6.2,y,w:1.45,h:0.44,fontSize:20,bold:true,color:C.orange,fontFace:'Calibri',align:'center',margin:0});
    s.addText(r[1],{x:7.7,y:y+0.04,w:1.9,h:0.36,fontSize:9.5,color:'A0B8D0',fontFace:'Calibri',margin:0});
    if(i<4) s.addShape(pres.ShapeType.rect,{x:6.3,y:y+0.5,w:3.2,h:0.012,fill:{color:'1E3A5F'},line:{type:'none'}});
  });
}

// ── SLIDE 9: Your Options ───────────────────────────────────────────
{
  const s=pres.addSlide(); whiteBg(s);
  head(s,'YOUR OPTIONS','Three ways in. No mystery pricing. No surprises.',`Flat monthly fees. Two commitment lengths. Every plan includes FirmMetrics\u00ae.`);
  const plans=d.pricing.tiers;
  const colW=3.0, cardGap=(W-colW*3)/4, cardY=CY, cardH=4.1;
  plans.forEach((plan,i)=>{
    const x=cardGap+i*(colW+cardGap), hl=plan.highlighted;
    s.addShape(pres.ShapeType.rect,{x,y:cardY,w:colW,h:cardH,fill:{color:C.white},line:{color:hl?C.orange:C.bord,pt:hl?2:0.75}});
    if(hl){
      s.addShape(pres.ShapeType.rect,{x,y:cardY,w:colW,h:0.3,fill:{color:C.orange},line:{type:'none'}});
      s.addText('\u2605  MOST POPULAR',{x:x+0.05,y:cardY+0.04,w:colW-0.1,h:0.22,fontSize:9,bold:true,color:C.white,fontFace:'Calibri',align:'center',margin:0});
    }
    const sY=hl?cardY+0.36:cardY+0.14;
    s.addText(plan.name,{x:x+0.1,y:sY,w:colW-0.2,h:0.32,fontSize:15,bold:true,color:hl?C.orange:C.nhead,fontFace:'Calibri',align:'center',margin:0});
    s.addText(plan.tag,{x:x+0.1,y:sY+0.31,w:colW-0.2,h:0.2,fontSize:8.5,color:C.mid,fontFace:'Calibri',align:'center',margin:0,italic:true});
    const p6Y=sY+0.56;
    s.addShape(pres.ShapeType.rect,{x:x+0.1,y:p6Y,w:colW-0.2,h:0.62,fill:{color:C.offWhite},line:{color:C.bord,pt:0.5}});
    s.addText('6-MONTH',{x:x+0.14,y:p6Y+0.04,w:colW-0.28,h:0.16,fontSize:7.5,bold:true,color:C.mid,fontFace:'Calibri',align:'center',margin:0,charSpacing:0.5});
    s.addText(plan.p6,{x:x+0.14,y:p6Y+0.18,w:colW-0.28,h:0.3,fontSize:24,bold:true,color:C.body,fontFace:'Calibri',align:'center',margin:0});
    s.addText('/mo flat fee',{x:x+0.14,y:p6Y+0.47,w:colW-0.28,h:0.14,fontSize:7.5,color:C.mid,fontFace:'Calibri',align:'center',margin:0});
    const p12Y=p6Y+0.7;
    s.addShape(pres.ShapeType.rect,{x:x+0.1,y:p12Y,w:colW-0.2,h:0.78,fill:{color:C.gbg},line:{color:C.gbr,pt:1}});
    s.addText('12-MONTH',{x:x+0.14,y:p12Y+0.04,w:colW-0.28,h:0.16,fontSize:7.5,bold:true,color:C.good,fontFace:'Calibri',align:'center',margin:0,charSpacing:0.5});
    s.addText(plan.p12,{x:x+0.14,y:p12Y+0.18,w:colW-0.28,h:0.3,fontSize:24,bold:true,color:C.good,fontFace:'Calibri',align:'center',margin:0});
    s.addText('/mo flat fee',{x:x+0.14,y:p12Y+0.47,w:colW-0.28,h:0.14,fontSize:7.5,color:C.good,fontFace:'Calibri',align:'center',margin:0});
    s.addText('\u2713  Save '+plan.saveMo+'/mo',{x:x+0.14,y:p12Y+0.6,w:colW-0.28,h:0.16,fontSize:8,bold:true,color:C.good,fontFace:'Calibri',align:'center',margin:0});
    s.addShape(pres.ShapeType.rect,{x:x+0.15,y:p12Y+0.82,w:colW-0.3,h:0.012,fill:{color:C.bord},line:{type:'none'}});
    plan.items.forEach((item,j)=>s.addText('\u2713  '+item,{x:x+0.14,y:p12Y+0.88+j*0.26,w:colW-0.28,h:0.24,fontSize:8,color:C.body,fontFace:'Calibri',margin:0}));
  });
  s.addText('No setup charges. Audit fee credited 100% toward any plan signed within 30 days.',{x:M,y:5.28,w:W-M*2,h:0.2,fontSize:7.5,color:C.light,fontFace:'Calibri',italic:true,margin:0,align:'center'});
}

// ── SLIDE 10: Next Step ─────────────────────────────────────────────
{
  const s=pres.addSlide(); darkBg(s);
  const ew=1.5;
  s.addShape(pres.ShapeType.rect,{x:0.45,y:0.44,w:ew,h:0.26,fill:{color:'0F1E3B'},line:{type:'none'}});
  s.addText('NEXT STEP',{x:0.51,y:0.46,w:ew-0.1,h:0.22,fontSize:8.5,bold:true,color:C.orange,fontFace:'Calibri',margin:0,charSpacing:1.5});
  s.addText('You\u2019ve seen enough.\nLet\u2019s talk.',{x:0.45,y:0.8,w:5.6,h:1.4,fontSize:46,bold:true,color:C.white,fontFace:'Calibri',margin:0});
  s.addText('Free 60-minute call. No pitch deck. No pressure. Just the plan.',{x:0.45,y:2.28,w:5.6,h:0.34,fontSize:12,color:'A0B8D0',fontFace:'Calibri',margin:0,italic:true});
  [['1','Book the free 60-minute report review call'],['2','We walk through every finding and answer every question'],['3','Want the full FirmStrategy\u2122 audit ($3,500)? We start immediately'],['4','Audit fee credited 100% toward any 12-month plan within 30 days']].forEach((st,i)=>{
    const y=3.05+i*0.46;
    s.addShape(pres.ShapeType.rect,{x:0.45,y,w:0.28,h:0.3,fill:{color:C.orange},line:{type:'none'}});
    s.addText(st[0],{x:0.45,y:y+0.02,w:0.28,h:0.26,fontSize:12,bold:true,color:C.white,fontFace:'Calibri',align:'center',margin:0});
    s.addText(st[1],{x:0.82,y:y+0.04,w:5.2,h:0.24,fontSize:11,color:'A0B8D0',fontFace:'Calibri',margin:0});
  });
  s.addShape(pres.ShapeType.rect,{x:6.4,y:0.55,w:3.27,h:4.82,fill:{color:'0F1E35'},line:{color:'2C4A7E',pt:1.5}});
  s.addText('Book your\nreview call',{x:6.5,y:0.72,w:3.07,h:1.05,fontSize:28,bold:true,color:C.white,fontFace:'Calibri',align:'center',margin:0});
  s.addText('Free  \u2022  60 minutes  \u2022  No commitment',{x:6.5,y:1.82,w:3.07,h:0.28,fontSize:10,color:'6B8FB5',fontFace:'Calibri',align:'center',margin:0,italic:true});
  s.addShape(pres.ShapeType.rect,{x:6.52,y:2.24,w:3.03,h:0.5,fill:{color:C.orange},line:{type:'none'}});
  s.addText('BOOK NOW \u2192',{x:6.52,y:2.3,w:3.03,h:0.38,fontSize:14,bold:true,color:C.white,fontFace:'Calibri',align:'center',margin:0});
  s.addText('[calendly.com/esquireinteractive]',{x:6.5,y:2.86,w:3.07,h:0.26,fontSize:9,color:'4A6880',fontFace:'Calibri',align:'center',margin:0});
  s.addShape(pres.ShapeType.rect,{x:6.55,y:3.24,w:2.97,h:0.012,fill:{color:'1E3A5F'},line:{type:'none'}});
  s.addText('hello@esquireinteractive.com\nesquireinteractive.com\n(520) 261-8645',{x:6.5,y:3.32,w:3.07,h:0.78,fontSize:10,color:'A0B8D0',fontFace:'Calibri',align:'center',margin:0,lineSpacing:18});
  s.addText('The full FirmBenchmark\u2122 Audit Report\nis attached separately.',{x:6.5,y:4.2,w:3.07,h:0.52,fontSize:9,color:'4A6880',fontFace:'Calibri',align:'center',margin:0,italic:true,lineSpacing:16});
  s.addShape(pres.ShapeType.rect,{x:0,y:5.18,w:'100%',h:0.44,fill:{color:'0A1428'},line:{type:'none'}});
  s.addText(`\u00a9 2026 Esquire Interactive LLC  \u2022  Attorney-led since 2007  \u2022  Prepared exclusively for ${d.name}`,{x:0.45,y:5.24,w:9.1,h:0.24,fontSize:7.5,color:'2C4050',fontFace:'Calibri',margin:0});
}

pres.writeFile({fileName:outFile})
  .then(()=>console.log('SUCCESS: '+outFile))
  .catch(e=>{console.error('ERROR:',e);process.exit(1);});
