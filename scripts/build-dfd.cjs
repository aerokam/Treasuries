#!/usr/bin/env node
// Builds the levelled data flow diagrams under knowledge/ from the model below.
// Run: node scripts/build-dfd.cjs
//
// Level 0 (knowledge/KNOWLEDGE_MAP.html) is hand-written and not generated here.
// Everything else is, so a diagram is never hand-edited out of step with its model.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NL = '\r\n';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const V = p => 'viewer.html#/md/' + p;
const DS = a => V('knowledge/DataStores.md' + (a ? '#' + a : ''));

// ── geometry ────────────────────────────────────────────────────────────────
// Flows curve, as DeMarco drew them: a quadratic whose control point sits off
// the chord. Straight lines between two columns read as a single hatched mass;
// a consistent bow lets the eye follow one flow across the others.
// A flow bows off its chord, as DeMarco drew them. The bow is not fixed: the
// candidates below are tried in order and the first one taken that clears every
// process it is not attached to, so no flow passes behind a bubble. Positive bows
// come first, which puts the curve — and its label — above the chord, where a
// label is not hidden by the flows beneath it.
const BOWS = [0.08, 0.16, 0.26, -0.08, -0.16, -0.26, 0.38, -0.38];
function curveWith(x1, y1, x2, y2, bow) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L;
  const perp = [uy, -ux];              // for a rightward chord this points up the page
  return { x1, y1, x2, y2, perp, L, cx: (x1 + x2) / 2 + perp[0] * bow * L, cy: (y1 + y2) / 2 + perp[1] * bow * L };
}
function pointOn(c, t) {
  const u = 1 - t;
  return [u * u * c.x1 + 2 * u * t * c.cx + t * t * c.x2,
          u * u * c.y1 + 2 * u * t * c.cy + t * t * c.y2];
}
function clears(c, obstacles) {
  for (let i = 1; i < 20; i++) {
    const [x, y] = pointOn(c, i / 20);
    for (const o of obstacles) if (Math.hypot(x - o.x, y - o.y) < o.r + 10) return false;
  }
  return true;
}
// A label sits by the process that consumes the flow, where the flows have fanned
// apart, rather than at the midpoint where they cross and it is unclear which flow
// a label belongs to. Placed labels are remembered so a later one steps aside.
function flow(x1, y1, x2, y2, opts = {}) {
  const obstacles = opts.obstacles || [], placed = opts.placed;
  let c = null;
  for (const b of BOWS) { const k = curveWith(x1, y1, x2, y2, b); if (clears(k, obstacles)) { c = k; break; } }
  if (!c) c = curveWith(x1, y1, x2, y2, BOWS[0]);
  const out = [`  <path class="flow" d="M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${c.cx.toFixed(1)} ${c.cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" marker-end="url(#a1)"/>`];
  if (opts.text) {
    const w = opts.text.length * 6.2, h = 15;
    let best = null;
    for (const tt of [0.82, 0.74, 0.9, 0.66, 0.58]) {
      const [px, py] = pointOn(c, tt);
      const lx = px + c.perp[0] * 11, ly = py + c.perp[1] * 11 - 3;
      const box = { x: lx - w / 2, y: ly - h, w, h };
      const hit = (placed || []).some(q => box.x < q.x + q.w && box.x + box.w > q.x && box.y < q.y + q.h && box.y + box.h > q.y);
      if (!hit) { best = { lx, ly, box }; break; }
      if (!best) best = { lx, ly, box };
    }
    if (placed) placed.push(best.box);
    out.push(`  <text class="flow-label" x="${best.lx.toFixed(0)}" y="${best.ly.toFixed(0)}" text-anchor="middle">${esc(opts.text)}</text>`);
  }
  return out.join(NL);
}
const toCircle = (x1, y1, cx, cy, r) => { const dx = cx - x1, dy = cy - y1, L = Math.hypot(dx, dy) || 1; return [cx - r * dx / L, cy - r * dy / L]; };
const fromCircle = (cx, cy, r, x2, y2) => { const dx = x2 - cx, dy = y2 - cy, L = Math.hypot(dx, dy) || 1; return [cx + r * dx / L, cy + r * dy / L]; };

const marker = () => `  <defs><marker id="a1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#55558c"/></marker></defs>`;

function storeShape(x, y, w, href, name) {
  return [`  <a class="store" href="${href}">`,
    `    <rect x="${x}" y="${y - 20}" width="${w}" height="40" fill="transparent" stroke="none"/>`,
    `    <line x1="${x}" y1="${y - 20}" x2="${x + w}" y2="${y - 20}"/>`,
    `    <line x1="${x}" y1="${y + 20}" x2="${x + w}" y2="${y + 20}"/>`,
    `    <text class="s-name" x="${x + w / 2}" y="${y + 5}">${esc(name)}</text>`, `  </a>`].join(NL);
}
function procShape(cx, cy, r, href, id, lines) {
  const top = cy - 20 - (lines.length - 2) * 8;
  return [`  <a class="process" href="${href}">`, `    <circle cx="${cx}" cy="${cy}" r="${r}"/>`,
    `    <text class="p-id" x="${cx}" y="${top}">${esc(id)}</text>`,
    ...lines.map((ln, k) => `    <text class="p-name" x="${cx}" y="${top + 21 + k * 16}">${esc(ln)}</text>`),
    `  </a>`].join(NL);
}
// Sort each column by the mean position of what it connects to, so the flows
// between two columns cross as little as the model allows.
function barycentre(stores, apps) {
  const mean = v => v.reduce((a, b) => a + b, 0) / (v.length || 1);
  let sIdx = Object.fromEntries(stores.map((s, i) => [s.id, i]));
  for (let pass = 0; pass < 8; pass++) {
    const linked = apps.filter(a => a.reads.length), bare = apps.filter(a => !a.reads.length);
    linked.sort((a, b) => mean(a.reads.map(r => sIdx[r])) - mean(b.reads.map(r => sIdx[r])));
    apps.length = 0; apps.push(...linked, ...bare);
    const aIdx = Object.fromEntries(apps.map((a, i) => [a.key, i]));
    const pos = id => { const r = apps.filter(a => a.reads.includes(id)); return mean((r.length ? r : apps).map(a => aIdx[a.key])); };
    stores.sort((x, y) => pos(x.id) - pos(y.id));
    sIdx = Object.fromEntries(stores.map((s, i) => [s.id, i]));
  }
}

// ── page shell ──────────────────────────────────────────────────────────────
const mapHtml = fs.readFileSync(path.join(ROOT, 'knowledge/KNOWLEDGE_MAP.html'), 'utf8');
const sharedStyle = mapHtml.slice(mapHtml.indexOf('<style>'), mapHtml.indexOf('</style>') + 8);

function page({ title, h1, up, upLabel, svg, notes, maxWidth }) {
  return ['<!DOCTYPE html>', '<html lang="en">', '<head>', '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${title}</title>`, sharedStyle, '<style>',
    '  .store line { stroke: #4a8a4a; stroke-width: 2; }',
    '  .store:hover line { stroke: #7ada7a; }',
    '  .store .s-name { fill: #a8e6a8; font-size: 13px; }',
    '  a.store { cursor: pointer; text-decoration: none; }',
    '  .process .p-name { font-size: 12.5px; }',
    '  .flow-label { font-size: 12px; }',
    `  .diagram { max-width: ${maxWidth}px; }`, '</style>', '</head>', '<body>', '',
    '<div class="nav-header">', '  <a href="../" class="portal-link">&#8592; Portal</a>',
    `  <a href="${up}">&#8593; ${upLabel}</a>`, '</div>', '',
    `<h1>${h1}</h1>`, '', '<div class="diagram">', svg, '</div>', '',
    '<p class="notes">', notes, '</p>', '', '</body>', '</html>', ''].join(NL);
}

// ── Level 1 ─────────────────────────────────────────────────────────────────
function level1() {
  const stores = [
    { id: 'fedinv', name: 'FedInvest prices', href: DS('s1') },
    { id: 'tipsref', name: 'TIPS reference data', href: DS('s2') },
    { id: 'refcpi', name: 'Ref CPI', href: DS('s3') },
    { id: 'nsasa', name: 'Ref CPI NSA and SA', href: DS('s4') },
    { id: 'auctions', name: 'Auction results', href: DS('s5') },
    { id: 'yhist', name: 'Yield history', href: DS('s6') },
    { id: 'quotes', name: 'Market quotes', href: DS('s7') },
    { id: 'cpihist', name: 'CPI history', href: DS('s8') },
    { id: 'tent', name: 'Tentative auction schedule', href: DS('s9') },
    { id: 'sasao', name: 'SA and SAO yields', href: DS('s10') },
    { id: 'funds', name: 'Fund holdings', href: DS('s11') },
    { id: 'gsw', name: 'GSW curve parameters', href: DS('s12') },
    { id: 'hol', name: 'Bond holidays', href: DS() },
    { id: 'blscpi', name: 'Monthly CPI', href: DS() },
    { id: 'spot', name: 'Spot yield curves', href: DS('s13') },
    { id: 'bei', name: 'Breakeven inflation', href: DS('s14') },
    { id: 'spread', name: 'Bid and ask spreads', href: DS('s15') },
  ];
  const apps = [
    { key: 'lm', name: ['Ladder', 'Manager'], spec: V('knowledge/TipsLadderManager.md'), reads: ['fedinv', 'tipsref', 'refcpi', 'sasao', 'hol'] },
    { key: 'tr', name: ['TIPS', 'Reference'], spec: V('TipsReference/knowledge/1.0_TIPS_Reference.md'), reads: ['tipsref', 'refcpi', 'sasao', 'hol'] },
    { key: 'pr', name: ['Treasury', 'Primer'], spec: V('Primer/knowledge/1.0_Primer.md'), reads: ['tipsref', 'refcpi'] },
    { key: 'ce', name: ['CPI', 'Explorer'], spec: V('CpiExplorer/knowledge/1.0_Overview.md'), reads: ['refcpi', 'cpihist'] },
    { key: 'ym', name: ['Yields', 'Monitor'], spec: V('knowledge/YieldsMonitor.md'), reads: ['tipsref', 'nsasa', 'hol', 'yhist'] },
    { key: 'yc', name: ['Yield', 'Curves'], spec: 'DFD_LEVEL2_YIELDCURVES.html', reads: ['fedinv', 'nsasa', 'quotes', 'gsw', 'hol'] },
    { key: 'sa', name: ['Seasonal', 'Adjustments'], spec: V('SeasonalAdjustments/knowledge/1.0_SeasonalAdjustments_Explorer.md'), reads: ['nsasa', 'hol'] },
    { key: 'fh', name: ['Fund', 'Holdings'], spec: V('FundHoldings/knowledge/1.0_FundHoldings.md'), reads: ['funds'] },
    { key: 'ta', name: ['Treasury', 'Auctions'], spec: V('knowledge/TreasuryAuctions.md'), reads: ['auctions', 'tent'] },
    { key: 'tx', name: ['Taxation of', 'Treasuries'], spec: V('TaxationOfTreasuries/docs/TaxationOfTreasuries_Foundation.md'), reads: [] },
  ];
  barycentre(stores, apps);
  apps.forEach((a, i) => a.n = i + 2);

  const SX = 425, SW = 215, AX = 865, AR = 46, UX = 1070, UW = 145;
  const sy = i => 110 + i * 92, ay = j => 230 + j * 132;
  const H = 1700, W = 1235;
  const acq = { cx: 232, cy: Math.round((sy(0) + sy(stores.length - 1)) / 2), r: 74 };
  const OBS = [{ x: acq.cx, y: acq.cy, r: acq.r }, ...apps.map((a, j) => ({ x: AX, y: ay(j), r: AR }))];
  const P = [`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Level 1: one acquisition process and ten app processes, the R2 data stores between them, and the user.">`, marker()];

  P.push(flow(8, acq.cy, acq.cx - acq.r - 3, acq.cy));
  P.push(`  <text class="flow-label" x="10" y="${acq.cy - 12}">external source data</text>`);
  stores.forEach((s, i) => {
    const y = sy(i), [x1, y1] = fromCircle(acq.cx, acq.cy, acq.r, SX, y);
    P.push(flow(x1, y1, SX - 5, y, { obstacles: OBS }));
    if (s.id === 'blscpi') { const [x2, y2] = toCircle(SX - 5, y + 10, acq.cx, acq.cy, acq.r); P.push(flow(SX - 5, y + 10, x2, y2, { obstacles: OBS })); }
  });
  const sIdx = Object.fromEntries(stores.map((s, i) => [s.id, i]));
  apps.forEach((a, j) => a.reads.forEach(id => {
    const y = sy(sIdx[id]), ty = ay(j), [x2, y2] = toCircle(SX + SW + 5, y, AX, ty, AR);
    P.push(flow(SX + SW + 5, y, x2, y2, { obstacles: OBS }));
  }));
  apps.forEach((a, j) => {
    const y = ay(j);
    P.push(flow(AX + AR + 3, y - 9, UX - 5, y - 9));
    P.push(flow(UX - 5, y + 9, AX + AR + 3, y + 9));
  });
  P.push(`  <text class="flow-label" x="${(AX + AR + UX) / 2}" y="${ay(0) - 34}" text-anchor="middle">app inputs</text>`);
  P.push(`  <text class="flow-label" x="${(AX + AR + UX) / 2}" y="${ay(0) + 44}" text-anchor="middle">app outputs</text>`);
  P.push(`  <g class="entity"><rect x="${UX}" y="70" width="${UW}" height="${H - 140}" rx="3"/><text class="e-name" x="${UX + UW / 2}" y="${H / 2}">User</text></g>`);
  P.push(procShape(acq.cx, acq.cy, acq.r, 'DFD_LEVEL2_INGESTION.html', '1', ['Acquire and', 'derive', 'reference data']));
  stores.forEach((s, i) => P.push(storeShape(SX, sy(i), SW, s.href, s.name)));
  apps.forEach((a, j) => P.push(procShape(AX, ay(j), AR, a.spec, String(a.n), a.name)));
  P.push('</svg>');

  return page({
    title: 'Treasury Investors Portal — Level 1', h1: 'Level 1', maxWidth: W,
    up: 'KNOWLEDGE_MAP.html', upLabel: 'Context Diagram', svg: P.join(NL),
    notes: ['  Process 1 writes every store drawn here. No app writes one: the apps read, and the scheduled jobs inside process 1 do all the writing.',
      '  Process 1 explodes at Level 2 into those jobs, one per store it writes.',
      '  All fourteen R2 stores are drawn, whether one app reads a store or several.',
      '  External entities are not redrawn at this level; their twelve flows are shown against each entity on the <a href="KNOWLEDGE_MAP.html">context diagram</a> and enter here as one flow.',
      '  Every app carries the same pair of flows to the user, labelled once at the top. The user is drawn once, as a tall shape, so no flow to it crosses another.'].join(NL)
  });
}

// ── Level 2: Yield Curves ───────────────────────────────────────────────────
function level2YieldCurves() {
  const S = 'YieldCurves/knowledge/7.0_Breakeven_And_Spreads.md';
  const stores = [
    { id: 'fedinv', name: 'FedInvest prices', href: DS('s1') },
    { id: 'quotes', name: 'Market quotes', href: DS('s7') },
    { id: 'nsasa', name: 'Ref CPI NSA and SA', href: DS('s4') },
    { id: 'hol', name: 'Bond holidays', href: DS() },
    { id: 'gsw', name: 'GSW curve parameters', href: DS('s12') },
  ];
  const procs = [
    { id: '7.1', name: ['Load and parse', 'source data'], href: 'DFD_LEVEL3_YC_LOAD.html', reads: ['fedinv', 'quotes', 'nsasa', 'hol', 'gsw'],
      out: { '7.2': 'yields, prices, SA factors', '7.4': 'yields, prices, GSW parameters', '7.6': 'bid and ask quotes', '7.7': 'source dates' } },
    { id: '7.2', name: ['Adjust for', 'seasonality'], href: V('YieldCurves/knowledge/1.0_Seasonal_Adjustments.md'), reads: [],
      out: { '7.3': 'SA yields', '7.4': 'SA yields', '7.5': 'SA yields', '7.7': 'SA yields' } },
    { id: '7.3', name: ['Smooth', 'outliers'], href: V('YieldCurves/knowledge/2.0_SAO_Adjustment.md'), reads: [],
      out: { '7.4': 'SAO yields', '7.5': 'SAO yields', '7.7': 'SAO yields' } },
    { id: '7.4', name: ['Fit spot', 'curves'], href: V('YieldCurves/knowledge/4.0_Spot_Yield_Curves.md'), reads: [],
      out: { '7.5': 'spot curves', '7.7': 'spot curves' } },
    { id: '7.5', name: ['Compute', 'breakeven', 'inflation'], href: V(S + '#breakeven-inflation'), reads: [], out: { '7.7': 'breakeven inflation' } },
    { id: '7.6', name: ['Compute bid', 'and ask', 'spreads'], href: V(S + '#bid-ask-spreads'), reads: [], out: { '7.7': 'spreads' } },
    { id: '7.7', name: ['Render charts', 'and tables'], href: 'DFD_LEVEL3_YC_RENDER.html', reads: [], out: {} },
  ];
  const SX = 40, SW = 215, PR = 58, UX = 1090, UW = 145;
  const sy = i => 150 + i * 118;
  const px = { '7.1': 380, '7.2': 590, '7.3': 720, '7.4': 570, '7.5': 720, '7.6': 380, '7.7': 900 };
  const py = { '7.1': 180, '7.2': 320, '7.3': 480, '7.4': 640, '7.5': 800, '7.6': 880, '7.7': 540 };
  const H = 1000, W = 1250;
  const OBS = procs.map(q => ({ x: px[q.id], y: py[q.id], r: PR }));
  const LBL = [];
  const P = [`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Level 2 for Yield Curves: seven processes reading five data stores. No process writes a data store.">`, marker()];
  const sIdx = Object.fromEntries(stores.map((s, i) => [s.id, i]));
  procs.forEach(p => p.reads.forEach(id => {
    const y = sy(sIdx[id]), [x2, y2] = toCircle(SX + SW + 5, y, px[p.id], py[p.id], PR);
    P.push(flow(SX + SW + 5, y, x2, y2, { obstacles: OBS }));
  }));
  procs.forEach(p => Object.entries(p.out).forEach(([t, lab]) => {
    const [x1, y1] = fromCircle(px[p.id], py[p.id], PR, px[t], py[t]);
    const [x2, y2] = toCircle(x1, y1, px[t], py[t], PR);
    P.push(flow(x1, y1, x2, y2, { obstacles: OBS.filter(o => !(o.x === px[p.id] && o.y === py[p.id]) && !(o.x === px[t] && o.y === py[t])), placed: LBL, text: lab }));
  }));
  P.push(flow(px['7.7'] + PR + 3, py['7.7'] - 9, UX - 5, py['7.7'] - 9));
  P.push(flow(UX - 5, py['7.7'] + 9, px['7.7'] + PR + 3, py['7.7'] + 9));
  P.push(`  <text class="flow-label" x="${(px['7.7'] + PR + UX) / 2}" y="${py['7.7'] - 26}" text-anchor="middle">charts and tables</text>`);
  P.push(`  <text class="flow-label" x="${(px['7.7'] + PR + UX) / 2}" y="${py['7.7'] + 42}" text-anchor="middle">tab and date selections</text>`);
  P.push(`  <g class="entity"><rect x="${UX}" y="${py['7.7'] - 130}" width="${UW}" height="260" rx="3"/><text class="e-name" x="${UX + UW / 2}" y="${py['7.7'] + 5}">User</text></g>`);
  stores.forEach((s, i) => P.push(storeShape(SX, sy(i), SW, s.href, s.name)));
  procs.forEach(p => P.push(procShape(px[p.id], py[p.id], PR, p.href, p.id, p.name)));
  P.push('</svg>');

  return page({
    title: 'Yield Curves — Level 2', h1: 'Level 2 &mdash; Yield Curves', maxWidth: W,
    up: 'DFD_LEVEL1.html', upLabel: 'Level 1', svg: P.join(NL),
    notes: ['  <b>No process here writes a data store.</b> Every flow ends at 7.7 and is gone when the page closes. What the app computes is not what it stores.',
      '  The spot curves, breakeven inflation and bid and ask spreads are nonetheless available from R2, because the same fitting math runs a second time as a scheduled job inside Level 1 process 1, writing <a href="viewer.html#/md/knowledge/DataStores.md#s13">S13</a>, S14 and S15. The math is defined once, in shared/src/spot-curve.js, and imported by both.',
      '  7.1 is the only process that reads a store; the rest take their input from each other. It explodes at <a href="DFD_LEVEL3_YC_LOAD.html">Level 3</a>.',
      '  GSW curve parameters are the Federal Reserve&rsquo;s own published fit, read as a reference line rather than computed here.'].join(NL)
  });
}

// ── Level 3: Yield Curves 7.1 ───────────────────────────────────────────────
function level3YieldCurvesLoad() {
  const stores = [
    { id: 'fedinv', name: 'FedInvest prices', href: DS('s1') },
    { id: 'quotes', name: 'Market quotes', href: DS('s7') },
    { id: 'nsasa', name: 'Ref CPI NSA and SA', href: DS('s4') },
    { id: 'hol', name: 'Bond holidays', href: DS() },
    { id: 'gsw', name: 'GSW curve parameters', href: DS('s12') },
  ];
  // href null marks a process with no spec of its own; the page lists them.
  const procs = [
    { id: '7.1.1', name: ['Parse FedInvest', 'prices'], href: V('YieldCurves/knowledge/5.0_Load_And_Parse.md#parse-fedinvest-prices'), reads: ['fedinv'], out: { '7.1.7': 'prices, yields' } },
    { id: '7.1.2', name: ['Parse market', 'quotes'], href: V('YieldCurves/knowledge/5.0_Load_And_Parse.md#parse-market-quotes'), reads: ['quotes'], out: { '7.1.6': 'quote file date', '7.1.7': 'bid and ask quotes' } },
    { id: '7.1.3', name: ['Parse Ref CPI', 'and SA factors'], href: V('YieldCurves/knowledge/5.0_Load_And_Parse.md#parse-ref-cpi-and-sa-factors'), reads: ['nsasa'], out: { '7.1.7': 'daily Ref CPI' } },
    { id: '7.1.4', name: ['Parse bond', 'holidays'], href: V('YieldCurves/knowledge/5.0_Load_And_Parse.md#parse-bond-holidays'), reads: ['hol'], out: { '7.1.6': 'bond trading days' } },
    { id: '7.1.5', name: ['Parse GSW', 'parameters'], href: V('YieldCurves/knowledge/5.0_Load_And_Parse.md#parse-gsw-parameters'), reads: ['gsw'], out: { '7.1.7': 'GSW parameters' } },
    { id: '7.1.6', name: ['Determine', 'settlement', 'dates'], href: V('YieldCurves/knowledge/5.0_Load_And_Parse.md#determine-settlement-dates'), reads: [], out: { '7.1.7': 'settlement dates' } },
    { id: '7.1.7', name: ['Build the', 'security set'], href: V('YieldCurves/knowledge/5.0_Load_And_Parse.md#build-priced-bonds'), reads: [], out: {} },
  ];
  const SX = 40, SW = 205, PR = 56, W = 1340, H = 900;
  const sy = i => 150 + i * 150;
  const px = { '7.1.1': 400, '7.1.2': 400, '7.1.3': 400, '7.1.4': 400, '7.1.5': 400, '7.1.6': 660, '7.1.7': 900 };
  const py = { '7.1.1': 150, '7.1.2': 300, '7.1.3': 450, '7.1.4': 600, '7.1.5': 750, '7.1.6': 640, '7.1.7': 380 };
  const OBS = procs.map(q => ({ x: px[q.id], y: py[q.id], r: PR }));
  const LBL = [];
  const P = [`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Level 3: the load and parse stage of Yield Curves, one process per source parsed.">`, marker()];
  const sIdx = Object.fromEntries(stores.map((s, i) => [s.id, i]));
  procs.forEach(p => p.reads.forEach(id => {
    const y = sy(sIdx[id]), [x2, y2] = toCircle(SX + SW + 5, y, px[p.id], py[p.id], PR);
    P.push(flow(SX + SW + 5, y, x2, y2, { obstacles: OBS }));
  }));
  procs.forEach(p => Object.entries(p.out).forEach(([t, lab]) => {
    const [x1, y1] = fromCircle(px[p.id], py[p.id], PR, px[t], py[t]);
    const [x2, y2] = toCircle(x1, y1, px[t], py[t], PR);
    P.push(flow(x1, y1, x2, y2, { obstacles: OBS.filter(o => !(o.x === px[p.id] && o.y === py[p.id]) && !(o.x === px[t] && o.y === py[t])), placed: LBL, text: lab }));
  }));
  // outputs leaving 7.1 for the rest of the app, balanced against Level 2
  [['yields, prices, SA factors  →  7.2', -34], ['yields, prices, GSW parameters  →  7.4', -12], ['bid and ask quotes  →  7.6', 10], ['source dates  →  7.7', 32]].forEach(([lab, dy]) => {
    P.push(flow(px['7.1.7'] + PR + 3, py['7.1.7'] + dy, W - 12, py['7.1.7'] + dy));
    P.push(`  <text class="flow-label" x="${W - 16}" y="${py['7.1.7'] + dy - 7}" text-anchor="end">${lab}</text>`);
  });
  stores.forEach((s, i) => P.push(storeShape(SX, sy(i), SW, s.href, s.name)));
  procs.forEach(p => P.push(procShape(px[p.id], py[p.id], PR, p.href || V('knowledge/YieldCurves.md'), p.id, p.name)));
  P.push('</svg>');

  return page({
    title: 'Yield Curves 7.1 — Level 3', h1: 'Level 3 &mdash; Yield Curves 7.1 Load and parse source data', maxWidth: W,
    up: 'DFD_LEVEL2_YIELDCURVES.html', upLabel: 'Level 2 — Yield Curves', svg: P.join(NL),
    notes: ['  One process per source parsed, then 7.1.6 and 7.1.7, which combine them. The four flows leaving 7.1.7 on the right are the outputs 7.1 shows at Level 2.',
      '  Every process here drills to its own section of <a href="viewer.html#/md/YieldCurves/knowledge/5.0_Load_And_Parse.md">5.0 Load and Parse</a>, which was written because these processes had no spec at all.',
      '  7.1.6 is where a known defect sits, recorded in 5.0 &sect;3.0: the settlement date for market quotes is derived from the FedInvest price date rather than from the quote file&rsquo;s own date.'].join(NL)
  });
}


// ── Level 2: process 1, the ingestion jobs ──────────────────────────────────
function level2Ingestion() {
  // Each job is a process; each writes the store named beside it. Sources are not
  // redrawn as entities here — their flows enter from the page edge, as at Level 1.
  const jobs = [
    { id: '1.1',  name: ['Download', 'FedInvest', 'prices'],   from: 'FedInvest',        writes: ['fedinv'] },
    { id: '1.2',  name: ['Download', 'market quotes'],         from: 'Fidelity',         writes: ['quotes'] },
    { id: '1.3',  name: ['Fit yield', 'curves'],               from: null,               reads: ['fedinv', 'quotes', 'nsasa', 'hol'], writes: ['yc', 'bei', 'spread'] },
    { id: '1.4',  name: ['Fetch auction', 'results'],          from: 'FiscalData',       writes: ['auctions'] },
    { id: '1.5',  name: ['Mirror tentative', 'schedule'],      from: 'Treasury',         writes: ['tent'] },
    { id: '1.6',  name: ['Fetch TIPS', 'reference data'],      from: 'FiscalData',       writes: ['tipsref'] },
    { id: '1.7',  name: ['Update yield', 'history'],           from: 'CNBC',             writes: ['yhist'] },
    { id: '1.8',  name: ['Archive', 'intraday yields'],        from: 'CNBC',             writes: ['intraday'] },
    { id: '1.9',  name: ['Fetch monthly', 'CPI'],              from: 'BLS',              writes: ['blscpi'] },
    { id: '1.10', name: ['Interpolate', 'daily Ref CPI', 'NSA and SA'], from: null,      reads: ['blscpi'], writes: ['nsasa'] },
    { id: '1.11', name: ['Derive SA and', 'SAO yields'],       from: null,               reads: ['quotes', 'refcpi', 'hol'], writes: ['sasao'] },
    { id: '1.12', name: ['Fetch CPI', 'history'],              from: 'BLS',              writes: ['cpihist'] },
    { id: '1.13', name: ['Fetch daily', 'Ref CPI'],            from: 'TreasuryDirect',   writes: ['refcpi'] },
    { id: '1.14', name: ['Collect fund', 'holdings'],          from: 'fund providers',   reads: ['quotes', 'sasao'], writes: ['funds'] },
    { id: '1.15', name: ['Fetch published', 'curve parameters'], from: 'Federal Reserve', writes: ['gsw'] },
  ];
  const stores = {
    fedinv: ['FedInvest prices', DS('s1')], tipsref: ['TIPS reference data', DS('s2')],
    refcpi: ['Ref CPI', DS('s3')], nsasa: ['Ref CPI NSA and SA', DS('s4')],
    auctions: ['Auction results', DS('s5')], yhist: ['Yield history', DS('s6')],
    quotes: ['Market quotes', DS('s7')], cpihist: ['CPI history', DS('s8')],
    tent: ['Tentative auction schedule', DS('s9')], sasao: ['SA and SAO yields', DS('s10')],
    funds: ['Fund holdings', DS('s11')], gsw: ['GSW curve parameters', DS('s12')],
    yc: ['Yield curves', DS('s13')], bei: ['Breakeven inflation', DS('s14')],
    spread: ['Bid and ask spreads', DS('s15')], hol: ['Bond holidays', DS()],
    blscpi: ['Monthly CPI', DS()], intraday: ['Intraday yields', DS('s6')],
  };
  const order = ['fedinv','quotes','yc','bei','spread','auctions','tent','tipsref','yhist','intraday','blscpi','nsasa','sasao','cpihist','refcpi','funds','gsw','hol'];
  const JX = 470, JR = 54, SX = 730, SW = 235;
  const jy = i => 90 + i * 116;
  const sy = i => 80 + i * 97;
  const H = Math.max(jy(jobs.length - 1), sy(order.length - 1)) + 110, W = 1010;
  const OBS = jobs.map((j, i) => ({ x: JX, y: jy(i), r: JR }));
  const sIdx = Object.fromEntries(order.map((k, i) => [k, i]));

  const P = [`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Level 2 for process 1: the ingestion jobs and the data stores each one writes.">`, marker()];
  jobs.forEach((j, i) => {
    const y = jy(i);
    if (j.from) {
      P.push(flow(8, y, JX - JR - 3, y, { obstacles: OBS.filter(o => o.y !== y) }));
      P.push(`  <text class="flow-label" x="12" y="${y - 12}">${esc(j.from)}</text>`);
    }
    (j.reads || []).forEach(k => {
      const from = toCircle(SX + SW + 5, sy(sIdx[k]), JX, y, JR);
      P.push(flow(SX - 5, sy(sIdx[k]), from[0], from[1], { obstacles: OBS.filter(o => o.y !== y) }));
    });
    (j.writes || []).forEach(k => {
      const s = fromCircle(JX, y, JR, SX, sy(sIdx[k]));
      P.push(flow(s[0], s[1], SX - 5, sy(sIdx[k]), { obstacles: OBS.filter(o => o.y !== y) }));
    });
  });
  order.forEach((k, i) => P.push(storeShape(SX, sy(i), SW, stores[k][1], stores[k][0])));
  jobs.forEach((j, i) => P.push(procShape(JX, jy(i), JR, V('knowledge/Data_Pipeline.md'), j.id, j.name)));
  P.push('</svg>');

  return page({
    title: 'Ingestion jobs — Level 2', h1: 'Level 2 &mdash; 1 Acquire and derive reference data', maxWidth: W,
    up: 'DFD_LEVEL1.html', upLabel: 'Level 1', svg: P.join(NL),
    notes: ['  One process per scheduled job, and the store each writes. A job that reads a store as well as writing one is deriving rather than retrieving.',
      '  1.3, 1.10, 1.11 and 1.14 read no external source: they compute from what the retrieving jobs have already stored.',
      '  Sources are not redrawn here; their flows enter from the edge, named, and each is defined against its entity on the <a href="KNOWLEDGE_MAP.html">context diagram</a>.',
      '  Every job drills to <a href="viewer.html#/md/knowledge/Data_Pipeline.md">Data Pipeline</a> for its schedule and script path. Per-job process specs do not exist yet.'].join(NL)
  });
}


// ── Level 3: Yield Curves 7.7 ───────────────────────────────────────────────
function level3YieldCurvesRender() {
  const S = 'YieldCurves/knowledge/6.0_Rendering.md';
  const procs = [
    { id: '7.7.1', name: ['Select the', 'view'],        a: 'select-view',    out: { '7.7.2': 'tab and mode', '7.7.3': '', '7.7.4': '', '7.7.5': '', '7.7.6': '' } },
    { id: '7.7.2', name: ['Build the', 'axis scales'],  a: 'build-scales',   out: { '7.7.3': 'scales', '7.7.4': 'scales', '7.7.5': 'scales', '7.7.6': 'scales' } },
    { id: '7.7.3', name: ['Draw the', 'Treasuries', 'view'], a: 'draw-treasuries', out: {} },
    { id: '7.7.4', name: ['Draw the', 'TIPS view'],     a: 'draw-tips',      out: { '7.7.7': 'picked security' } },
    { id: '7.7.5', name: ['Draw the', 'breakeven', 'view'], a: 'draw-breakeven', out: {} },
    { id: '7.7.6', name: ['Draw the', 'spread view'],   a: 'draw-spreads',   out: {} },
    { id: '7.7.7', name: ['Answer a', 'drill request'], a: 'answer-a-drill', out: {} },
  ];
  const PR = 56, UX = 850, UW = 145, W = 1010, H = 980;
  const px = { '7.7.1': 300, '7.7.2': 300, '7.7.3': 620, '7.7.4': 620, '7.7.5': 620, '7.7.6': 620, '7.7.7': 380 };
  const py = { '7.7.1': 240, '7.7.2': 600, '7.7.3': 150, '7.7.4': 330, '7.7.5': 510, '7.7.6': 690, '7.7.7': 870 };
  const OBS = procs.map(q => ({ x: px[q.id], y: py[q.id], r: PR }));
  const LBL = [];
  const P = [`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Level 3: the rendering stage of Yield Curves, one process per view drawn.">`, marker()];

  // The series arriving from the rest of the app enter from the page edge, each at the
  // view that draws it, so no series is drawn without showing which view consumes it.
  const arriving = [['7.2, 7.3  →  SA and SAO yields', '7.7.3'], ['7.4  →  spot curves', '7.7.4'], ['7.5  →  breakeven inflation', '7.7.5'], ['7.6  →  spreads', '7.7.6']];
  arriving.forEach(([lab, to]) => {
    const y = py[to];
    const [x2, y2] = toCircle(20, y, px[to], y, PR);
    P.push(flow(20, y, x2, y2, { obstacles: OBS.filter(o => !(o.x === px[to] && o.y === y)) }));
    P.push(`  <text class="flow-label" x="24" y="${y - 10}">${esc(lab)}</text>`);
  });

  // The user, drawn once as a tall shape so each view reaches it without crossing another.
  P.push(flow(UX - 5, py['7.7.1'], px['7.7.1'] + PR + 3, py['7.7.1'], { obstacles: OBS.filter(o => o.x !== px['7.7.1']), placed: LBL, text: 'tab and date selections' }));
  ['7.7.3', '7.7.4', '7.7.5', '7.7.6', '7.7.7'].forEach(id => {
    P.push(flow(px[id] + PR + 3, py[id], UX - 5, py[id], { obstacles: OBS.filter(o => o.x !== px[id]) }));
  });
  P.push(`  <text class="flow-label" x="${(px['7.7.3'] + PR + UX) / 2}" y="${py['7.7.3'] - 14}" text-anchor="middle">charts and tables</text>`);
  P.push(`  <text class="flow-label" x="${(px['7.7.7'] + PR + UX) / 2}" y="${py['7.7.7'] - 14}" text-anchor="middle">drill popup</text>`);
  P.push(`  <g class="entity"><rect x="${UX}" y="90" width="${UW}" height="${H - 180}" rx="3"/><text class="e-name" x="${UX + UW / 2}" y="${H / 2}">User</text></g>`);
  procs.forEach(pr => Object.entries(pr.out).forEach(([to, lab]) => {
    const [x1, y1] = fromCircle(px[pr.id], py[pr.id], PR, px[to], py[to]);
    const [x2, y2] = toCircle(x1, y1, px[to], py[to], PR);
    const others = OBS.filter(o => !(o.x === px[pr.id] && o.y === py[pr.id]) && !(o.x === px[to] && o.y === py[to]));
    P.push(flow(x1, y1, x2, y2, { obstacles: others, placed: LBL, text: lab }));
  }));
  procs.forEach(pr => P.push(procShape(px[pr.id], py[pr.id], PR, V(S + '#' + pr.a), pr.id, pr.name)));
  P.push('</svg>');

  return page({
    title: 'Yield Curves 7.7 — Level 3', h1: 'Level 3 &mdash; Yield Curves 7.7 Rendering', maxWidth: W,
    up: 'DFD_LEVEL2_YIELDCURVES.html', upLabel: 'Level 2 — Yield Curves', svg: P.join(NL),
    notes: ['  Every process drills to its own section of <a href="viewer.html#/md/YieldCurves/knowledge/6.0_Rendering.md">6.0 Rendering</a>, the process spec. <a href="viewer.html#/md/YieldCurves/knowledge/3.0_Visual_Standards.md">3.0 Visual Standards</a> is the separate question of what the drawn output must look like.',
      '  <b>Nothing here calculates a yield.</b> Every figure drawn is produced upstream and passed in; a view showing a figure no other process produced is a defect in this stage.',
      '  7.7.2 decides what is visible before anything is drawn. Its axis clipping moves the axis and never removes a security, so a table figure can sit outside what the chart shows.'].join(NL)
  });
}

// ── emit ────────────────────────────────────────────────────────────────────
const outputs = [
  ['knowledge/DFD_LEVEL1.html', level1()],
  ['knowledge/DFD_LEVEL2_INGESTION.html', level2Ingestion()],
  ['knowledge/DFD_LEVEL2_YIELDCURVES.html', level2YieldCurves()],
  ['knowledge/DFD_LEVEL3_YC_LOAD.html', level3YieldCurvesLoad()],
  ['knowledge/DFD_LEVEL3_YC_RENDER.html', level3YieldCurvesRender()],
];
for (const [rel, html] of outputs) {
  fs.writeFileSync(path.join(ROOT, rel), html);
  console.log('wrote ' + rel);
}
