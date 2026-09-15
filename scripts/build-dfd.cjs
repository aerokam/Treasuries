#!/usr/bin/env node
// Builds the levelled data flow diagrams under knowledge/ from the model below.
// Run: node scripts/build-dfd.cjs
//
// Level 0 (knowledge/KNOWLEDGE_MAP.html) is hand-written and not generated here.
// Everything else is, so a diagram is never hand-edited out of step with its model.
//
// Naming: below Level 1 a process is named by a verb phrase stating what it does, with no
// article; at Level 1 an app is named as the portal names it. A data flow is named by one
// noun for the structure it holds, defined in knowledge/DATA_DICTIONARY.md §6.0 or as a
// term there. Two structures passing between the same two processes are two flows.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NL = '\r\n';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const V = p => 'viewer.html#/md/' + p;
const DS = a => V('knowledge/DataStores.md' + (a ? '#' + a : ''));
const K = 'YieldCurves/knowledge/';
const F31 = K + '3.1_Parse_Sources_And_Calculate_Yields.md';

// ── geometry ────────────────────────────────────────────────────────────────
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

// A flow label is one term, and clicking it opens that term's Data Dictionary entry.
// A label listing several terms is a build error: two structures are two flows. A
// term with no entry is reported rather than linked, so the shortfall stays visible.
const DD = 'viewer.html#/md/knowledge/DATA_DICTIONARY.md#';
const TERMS = {
  'source data': 'source-data', 'reference data': 'reference-data', 'app inputs': 'app-inputs',
  'app outputs': 'app-outputs', 'downloaded data sets': 'downloaded-data-sets',
  'daily mid-market prices': 'daily-mid-market-prices', 'daily Ref CPI': 'daily-ref-cpi',
  'auction results': 'auction-results', 'TIPS reference data': 'tips-reference-data',
  'monthly CPI-U': 'monthly-cpi-u', 'market yields': 'market-yields', 'market quotes': 'market-quotes',
  'fund holdings': 'fund-holdings', 'GSW curve parameters': 'gsw-curve-parameters',
  'tentative auction schedule': 'tentative-auction-schedule',
  'TIPS prices': 'tips-prices', 'Treasury prices': 'treasury-prices', 'TIPS quotes': 'tips-quotes',
  'Treasury quotes': 'treasury-quotes', 'TIPS yields': 'tips-yields', 'Treasury yields': 'treasury-yields',
  'SA factors': 'sa-factor', 'SA yields': 'sa-yields', 'SAO yields': 'sao-yields',
  'spot yield curves': 'spot-yield-curves', 'breakeven inflation': 'breakeven-inflation',
  'bid and ask spreads': 'bid-and-ask-spreads', 'settlement date': 'settlement-date',
  'download date': 'download-date', 'bond holidays': 'bond-holiday',
  'view selections': 'view-selections', 'axis scales': 'axis-scales', 'drill request': 'drill-request',
  'charts and tables': 'charts-and-tables', 'drill popup': 'drill-popup',
};
const unlinked = new Set();
function labelMarkup(text) {
  if (text.includes(',')) { console.error(`flow label lists more than one term: "${text}"`); process.exit(1); }
  const term = text.replace(/\s*[→←].*$/, '').trim();       // a process number after an arrow is not a term
  const tail = text.slice(term.length);
  const a = TERMS[term];
  if (!a) { unlinked.add(term); return esc(text); }
  return `<a href="${DD}${a}"><tspan class="lk">${esc(term)}</tspan></a>${esc(tail)}`;
}
const labelAt = (x, y, text, anchor) =>
  `  <text class="flow-label" x="${Math.round(x)}" y="${Math.round(y)}"${anchor ? ` text-anchor="${anchor}"` : ''}>${labelMarkup(text)}</text>`;

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
    const avoid = opts.labelAvoid || [];
    const onCircle = (b, o) => Math.hypot(Math.max(b.x, Math.min(o.x, b.x + b.w)) - o.x, Math.max(b.y, Math.min(o.y, b.y + b.h)) - o.y) < o.r + 3;
    let best = null;
    search:
    for (const tt of [0.82, 0.74, 0.9, 0.66, 0.58, 0.5, 0.42, 0.34, 0.26]) {
      for (const side of [1, -1]) {
        const [px, py] = pointOn(c, tt);
        const lx = px + c.perp[0] * 11 * side, ly = py + c.perp[1] * 11 * side + (side > 0 ? -3 : 12);
        const box = { x: lx - w / 2, y: ly - h, w, h };
        const hit = (placed || []).some(q => box.x < q.x + q.w && box.x + box.w > q.x && box.y < q.y + q.h && box.y + box.h > q.y)
          || avoid.some(o => onCircle(box, o));
        if (!hit) { best = { lx, ly, box }; break search; }
        if (!best) best = { lx, ly, box };
      }
    }
    if (placed) placed.push(best.box);
    out.push(`  <text class="flow-label" x="${best.lx.toFixed(0)}" y="${best.ly.toFixed(0)}" text-anchor="middle">${labelMarkup(opts.text)}</text>`);
  }
  return out.join(NL);
}
// The flows between one pair of processes, each drawn on its own line, set apart
// across the chord so neither hides the other.
function flowSet(x1, y1, x2, y2, labels, opts = {}) {
  const L = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
  return labels.map((text, k) => {
    const o = (k - (labels.length - 1) / 2) * 20;
    return flow(x1 + nx * o, y1 + ny * o, x2 + nx * o, y2 + ny * o, { ...opts, text });
  }).join(NL);
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
// caption, when given, is written beneath the circle: the portal name of an app.
function procShape(cx, cy, r, href, id, lines, caption) {
  const top = cy - 20 - (lines.length - 2) * 8;
  return [`  <a class="process" href="${href}">`, `    <circle cx="${cx}" cy="${cy}" r="${r}"/>`,
    `    <text class="p-id" x="${cx}" y="${top}">${esc(id)}</text>`,
    ...lines.map((ln, k) => `    <text class="p-name" x="${cx}" y="${top + 21 + k * 16}">${esc(ln)}</text>`),
    ...(caption ? [`    <text class="p-app" x="${cx}" y="${cy + r + 17}">${esc(caption)}</text>`] : []),
    `  </a>`].join(NL);
}
// Draws every flow in a model whose processes name their outputs as { target: [labels] }.
function internalFlows(procs, px, py, PR, OBS, LBL) {
  const out = [];
  procs.forEach(p => Object.entries(p.out).forEach(([t, labels]) => {
    const [x1, y1] = fromCircle(px[p.id], py[p.id], PR, px[t], py[t]);
    const [x2, y2] = toCircle(x1, y1, px[t], py[t], PR);
    const others = OBS.filter(o => !(o.x === px[p.id] && o.y === py[p.id]) && !(o.x === px[t] && o.y === py[t]));
    out.push(flowSet(x1, y1, x2, y2, labels, { obstacles: others, placed: LBL, labelAvoid: OBS }));
  }));
  return out.join(NL);
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

function page({ title, h1, up, upLabel, spec, specLabel, svg, notes, maxWidth }) {
  return ['<!DOCTYPE html>', '<html lang="en">', '<head>', '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${title}</title>`, sharedStyle, '<style>',
    '  .cat-band { fill-opacity: 0.13; stroke-opacity: 0.55; stroke-width: 1.5; }',
    '  .cat-label { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.85; }',
    '  .store line { stroke: #4a8a4a; stroke-width: 2; }',
    '  .store:hover line { stroke: #7ada7a; }',
    '  .store .s-name { fill: #a8e6a8; font-size: 13px; }',
    '  a.store { cursor: pointer; text-decoration: none; }',
    '  .process .p-name { font-size: 12.5px; }',
    '  .process .p-app { fill: #c8d0ea; font-size: 12px; font-style: italic; text-anchor: middle; }',
    '  .flow-label { font-size: 12px; }',
    '  .flow-label a { cursor: pointer; }',
    '  tspan.lk { fill: #a8b2e0; text-decoration: underline; text-decoration-style: dotted; }',
    '  .flow-label a:hover tspan.lk { fill: #ffffff; }',
    '  .nav-header .spec-link { margin-left: auto; }',
    `  .diagram { max-width: ${maxWidth}px; }`, '</style>', '</head>', '<body>', '',
    '<div class="nav-header">', '  <a href="../" class="portal-link">&#8592; Portal</a>',
    `  <a href="${up}">&#8593; ${upLabel}</a>`,
    ...(spec ? [`  <a href="${spec}" class="spec-link">&#9776; ${specLabel}</a>`] : []),
    '</div>', '',
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
    { id: 'hol', name: 'Bond holidays', href: DS('s16') },
    { id: 'blscpi', name: 'Monthly CPI', href: DS('s17') },
    { id: 'spot', name: 'Yield curves', href: DS('s13') },
    { id: 'bei', name: 'Breakeven inflation', href: DS('s14') },
    { id: 'spread', name: 'Bid and ask spreads', href: DS('s15') },
  ];
  // Each app is named as the portal names it.
  const apps = [
    { key: 'lm', cat: 'workflow', name: ['Ladder', 'Manager'], spec: V('knowledge/TipsLadderManager.md'), reads: ['fedinv', 'tipsref', 'refcpi', 'sasao', 'hol'] },
    { key: 'tr', cat: 'reference', name: ['TIPS', 'Reference'], spec: V('TipsReference/knowledge/1.0_TIPS_Reference.md'), reads: ['tipsref', 'refcpi', 'sasao', 'hol'] },
    { key: 'pr', cat: 'educational', name: ['Treasury', 'Primer'], spec: V('Primer/knowledge/1.0_Primer.md'), reads: ['fedinv', 'tipsref', 'refcpi'] },
    { key: 'ce', cat: 'reference', name: ['CPI', 'Explorer'], spec: V('CpiExplorer/knowledge/1.0_Overview.md'), reads: ['refcpi', 'cpihist'] },
    { key: 'ym', cat: 'workflow', name: ['Yields', 'Monitor'], spec: V('knowledge/YieldsMonitor.md'), reads: ['tipsref', 'nsasa', 'hol', 'yhist'] },
    { key: 'yc', cat: 'workflow', name: ['Yield', 'Curves'], spec: 'DFD_LEVEL2_YIELDCURVES.html', reads: ['fedinv', 'nsasa', 'quotes', 'gsw', 'hol'] },
    { key: 'sa', cat: 'educational', name: ['Seasonal', 'Adjustments'], spec: V('SeasonalAdjustments/knowledge/1.0_SeasonalAdjustments_Explorer.md'), reads: ['nsasa', 'hol'] },
    { key: 'fh', cat: 'reference', name: ['Fund', 'Holdings'], spec: V('FundHoldings/knowledge/1.0_FundHoldings.md'), reads: ['funds'] },
    { key: 'ta', cat: 'reference', name: ['Treasury', 'Auctions'], spec: V('knowledge/TreasuryAuctions.md'), reads: ['auctions', 'tent'] },
    { key: 'tx', cat: 'reference', name: ['Taxation of', 'Treasuries'], spec: V('TaxationOfTreasuries/docs/TaxationOfTreasuries_Foundation.md'), reads: [] },
  ];
  barycentre(stores, apps);
  // The column reproduces the portal index: the same three sections in the same
  // order, and the same apps in the same order inside each. Barycentre still
  // runs, because the store order it produces is what keeps the flows readable.
  const CATS = [
    { id: 'workflow',    label: 'Daily Workflow', fill: '#5a6e5a' },
    { id: 'reference',   label: 'Reference',      fill: '#2474a6' },
    { id: 'educational', label: 'Educational',    fill: '#6c4ab8' },
  ];
  const PORTAL_ORDER = ['ym', 'yc', 'lm', 'ta', 'tr', 'ce', 'tx', 'fh', 'pr', 'sa'];
  for (const a of apps) {
    if (!PORTAL_ORDER.includes(a.key)) { console.error(`app ${a.key} is missing from PORTAL_ORDER`); process.exit(1); }
  }
  apps.sort((a, b) => PORTAL_ORDER.indexOf(a.key) - PORTAL_ORDER.indexOf(b.key));
  apps.forEach((a, i) => a.n = i + 2);

  // Level 1 answers which app reads what, not which file. The stores are drawn as
  // one shape that opens the full list, and the flows out of it are a trunk that
  // fans to each app. Level 2 is where the individual stores appear.
  const SX = 430, SW = 230, SH = 96, AX = 900, AR = 60, UX = 1110, UW = 145;
  const breaks = apps.map((a, j) => apps.slice(0, j + 1).filter((b, k) => k > 0 && b.cat !== apps[k - 1].cat).length);
  const ay = j => 190 + j * 150 + breaks[j] * 44;
  const BOTTOM = ay(apps.length - 1) + AR + 80;   // the row beneath the apps
  const H = BOTTOM + 50, W = 1285;
  const mid = Math.round((ay(0) + ay(apps.length - 1)) / 2);
  const acq = { cx: 200, cy: mid, r: 78 };
  const store = { x: SX, y: mid, w: SW };
  const JX = SX + SW + 90;                       // where the trunk fans out
  const OBS = [{ x: acq.cx, y: acq.cy, r: acq.r }, ...apps.map((a, j) => ({ x: AX, y: ay(j), r: AR }))];
  const P = [`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Level 1: one acquisition process, the R2 data stores as one shape, ten app processes and the user.">`, marker()];

  for (const c of CATS) {
    const idx = apps.map((a, j) => a.cat === c.id ? j : -1).filter(j => j >= 0);
    if (!idx.length) continue;
    const top = ay(idx[0]) - AR - 36, bot = ay(idx[idx.length - 1]) + AR + 30;
    P.push(`  <rect class="cat-band" x="${AX - 100}" y="${top}" width="200" height="${bot - top}" rx="10" fill="${c.fill}" stroke="${c.fill}"/>`);
    P.push(`  <text class="cat-label" x="${AX}" y="${top + 20}" text-anchor="middle" fill="${c.fill}">${c.label}</text>`);
  }

  P.push(flow(8, acq.cy, acq.cx - acq.r - 3, acq.cy));
  P.push(labelAt(10, acq.cy - 12, 'source data'));

  // Process 1 writes every store, and reads one of them back.
  P.push(flow(acq.cx + acq.r + 3, acq.cy - 10, SX - 5, mid - 10));
  P.push(flow(SX - 5, mid + 10, acq.cx + acq.r + 3, acq.cy + 10));
  P.push(labelAt((acq.cx + acq.r + SX) / 2, mid - 22, 'reference data', 'middle'));

  // One trunk out of the store, fanning to each app.
  P.push(`  <path class="flow" d="M ${SX + SW + 5} ${mid} L ${JX} ${mid}"/>`);
  apps.forEach((a, j) => {
    const ty = ay(j), [x2, y2] = toCircle(JX, mid, AX, ty, AR);
    P.push(flow(JX, mid, x2, y2, { obstacles: OBS }));
  });
  P.push(labelAt((SX + SW + JX) / 2, mid - 12, 'reference data', 'middle'));

  apps.forEach((a, j) => {
    const y = ay(j);
    P.push(flow(AX + AR + 3, y - 9, UX - 5, y - 9));
    P.push(flow(UX - 5, y + 9, AX + AR + 3, y + 9));
  });
  P.push(labelAt((AX + AR + UX) / 2, ay(0) - 34, 'app outputs', 'middle'));
  P.push(labelAt((AX + AR + UX) / 2, ay(0) + 44, 'app inputs', 'middle'));

  // Three stores are read by no app. They are written for the user to pull
  // into a spreadsheet, so that flow leaves the store and goes to the user.
  P.push(`  <path class="flow" d="M ${SX + SW / 2} ${mid + SH / 2 + 5} L ${SX + SW / 2} ${BOTTOM} L ${UX - 5} ${BOTTOM}" marker-end="url(#a1)"/>`);
  P.push(labelAt(SX + SW / 2 + 12, BOTTOM - 9, 'downloaded data sets'));

  P.push(`  <g class="entity"><rect x="${UX}" y="70" width="${UW}" height="${BOTTOM + 20 - 70}" rx="3"/><text class="e-name" x="${UX + UW / 2}" y="${(70 + BOTTOM + 20) / 2}">User</text></g>`);
  P.push(procShape(acq.cx, acq.cy, acq.r, 'DFD_LEVEL2_INGESTION.html', '1', ['Acquire and', 'derive', 'reference data']));

  // The store shape carries the count rather than the names; the names are one
  // click away, and every one of them is drawn at Level 2.
  P.push(`  <a class="store" href="${DS()}">`);
  P.push(`    <rect x="${store.x}" y="${store.y - SH / 2}" width="${store.w}" height="${SH}" fill="transparent" stroke="none"/>`);
  P.push(`    <line x1="${store.x}" y1="${store.y - SH / 2}" x2="${store.x + store.w}" y2="${store.y - SH / 2}"/>`);
  P.push(`    <line x1="${store.x}" y1="${store.y + SH / 2}" x2="${store.x + store.w}" y2="${store.y + SH / 2}"/>`);
  P.push(`    <text class="s-name" x="${store.x + store.w / 2}" y="${store.y - 8}">R2 data stores</text>`);
  P.push(`    <text class="s-name" x="${store.x + store.w / 2}" y="${store.y + 16}" style="opacity:0.7">${stores.length} files</text>`);
  P.push('  </a>');

  apps.forEach((a, j) => P.push(procShape(AX, ay(j), AR, a.spec, String(a.n), a.name)));
  P.push('</svg>');

  return page({
    title: 'Treasury Investors Portal — Level 1', h1: 'Level 1', maxWidth: W,
    up: 'KNOWLEDGE_MAP.html', upLabel: 'Context Diagram', svg: P.join(NL),
    notes: ['  Process 1 writes every store drawn here. No app writes one: the apps read, and the scheduled jobs inside process 1 do all the writing.',
      '  Process 1 explodes at Level 2 into those jobs, one per store it writes.',
      '  The stores are drawn as one shape. Level 1 answers which app reads what rather than which file, and the shape opens the full list.',
      '  Three of those files are read by no app: YieldCurves.csv, BreakevenInflation.csv and BidAskSpreads.csv. They are written for the user to pull into a spreadsheet, so their flow goes to the user rather than to a process.',
      '  External entities are not redrawn at this level. Their fourteen flows are drawn against each entity on the <a href="KNOWLEDGE_MAP.html">context diagram</a> and enter here as one flow.',
      '  The app column reproduces the portal index: the same three sections in the same order, and the same apps in the same order inside each.',
      '  Every app has the same pair of flows with the user, labelled once at the top. The user is drawn once, as a tall shape, so no flow to it crosses another.'].join(NL)
  });
}

// ── Level 2: Yield Curves ───────────────────────────────────────────────────
function level2YieldCurves() {
  const stores = [
    { id: 'fedinv', name: 'FedInvest prices', href: DS('s1') },
    { id: 'quotes', name: 'Market quotes', href: DS('s7') },
    { id: 'nsasa', name: 'Ref CPI NSA and SA', href: DS('s4') },
    { id: 'hol', name: 'Bond holidays', href: DS('s16') },
  ];
  const procs = [
    { id: '3.1', name: ['Parse sources', 'and calculate', 'yields'], href: 'DFD_LEVEL3_YC_LOAD.html', reads: ['fedinv', 'quotes', 'nsasa', 'hol'],
      out: { '3.2': ['TIPS yields', 'SA factors'], '3.4': ['Treasury yields'], '3.5': ['Treasury yields'],
             '3.6': ['TIPS yields', 'Treasury yields'], '3.7': ['Treasury yields', 'download date'] } },
    { id: '3.2', name: ['Adjust for', 'seasonality'], href: V(K + '3.2_Adjust_For_Seasonality.md'), reads: [],
      out: { '3.3': ['SA yields'], '3.4': ['SA yields'] } },
    { id: '3.3', name: ['Adjust for', 'other effects'], href: V(K + '3.3_Adjust_For_Other_Effects.md'), reads: [],
      out: { '3.5': ['SAO yields'], '3.7': ['SAO yields'] } },
    { id: '3.4', name: ['Fit spot', 'yield curves'], href: V(K + '3.4_Fit_Spot_Yield_Curves.md'), reads: [],
      out: { '3.5': ['spot yield curves'], '3.7': ['spot yield curves'] } },
    { id: '3.5', name: ['Calculate', 'breakeven', 'inflation'], href: V(K + '3.5_Calculate_Breakeven_Inflation.md'), reads: [], out: { '3.7': ['breakeven inflation'] } },
    { id: '3.6', name: ['Calculate', 'bid and ask', 'spreads'], href: V(K + '3.6_Calculate_Bid_And_Ask_Spreads.md'), reads: [], out: { '3.7': ['bid and ask spreads'] } },
    { id: '3.7', name: ['Render charts', 'and tables'], href: 'DFD_LEVEL3_YC_RENDER.html', reads: [], out: {} },
  ];
  const SX = 40, SW = 215, PR = 58, UX = 1190, UW = 145;
  const sy = i => 290 + i * 118;
  const px = { '3.1': 410, '3.2': 630, '3.3': 850, '3.4': 630, '3.5': 850, '3.6': 850, '3.7': 1010 };
  const py = { '3.1': 520, '3.2': 190, '3.3': 190, '3.4': 430, '3.5': 640, '3.6': 880, '3.7': 520 };
  const H = 1000, W = 1360;
  const OBS = procs.map(q => ({ x: px[q.id], y: py[q.id], r: PR }));
  const LBL = [];
  const P = [`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Level 2 for Yield Curves: seven processes reading four data stores. No process writes a data store.">`, marker()];
  const sIdx = Object.fromEntries(stores.map((s, i) => [s.id, i]));
  procs.forEach(p => p.reads.forEach(id => {
    const y = sy(sIdx[id]), [x2, y2] = toCircle(SX + SW + 5, y, px[p.id], py[p.id], PR);
    P.push(flow(SX + SW + 5, y, x2, y2, { obstacles: OBS }));
  }));
  P.push(internalFlows(procs, px, py, PR, OBS, LBL));
  P.push(flow(px['3.7'] + PR + 3, py['3.7'] - 9, UX - 5, py['3.7'] - 9));
  P.push(flow(UX - 5, py['3.7'] + 9, px['3.7'] + PR + 3, py['3.7'] + 9));
  P.push(labelAt((px['3.7'] + PR + UX) / 2, py['3.7'] - 26, 'charts and tables', 'middle'));
  P.push(labelAt((px['3.7'] + PR + UX) / 2, py['3.7'] + 42, 'view selections', 'middle'));
  P.push(`  <g class="entity"><rect x="${UX}" y="${py['3.7'] - 130}" width="${UW}" height="260" rx="3"/><text class="e-name" x="${UX + UW / 2}" y="${py['3.7'] + 5}">User</text></g>`);
  stores.forEach((s, i) => P.push(storeShape(SX, sy(i), SW, s.href, s.name)));
  procs.forEach(p => P.push(procShape(px[p.id], py[p.id], PR, p.href, p.id, p.name)));
  P.push('</svg>');

  return page({
    title: 'Yield Curves — Level 2', h1: 'Level 2 &mdash; Yield Curves', maxWidth: W,
    up: 'DFD_LEVEL1.html', upLabel: 'Level 1',
    spec: V('YieldCurves/README.md'), specLabel: 'Yield Curves specs', svg: P.join(NL),
    notes: ['  <b>No process here writes a data store.</b> Every flow ends at 3.7 and is gone when the page closes.',
      '  The spot yield curves, breakeven inflation and bid and ask spreads are available from R2 all the same: Level 1 process 1 executes the same calculations as a scheduled job and writes <a href="viewer.html#/md/knowledge/DataStores.md#s13">Yield curves (S13)</a>, Breakeven inflation (S14) and Bid and ask spreads (S15). Each calculation is defined once, in shared/src/, and imported by both.',
      '  3.1 is the only process that reads a store; the others take their input from each other. It explodes at <a href="DFD_LEVEL3_YC_LOAD.html">Level 3</a>.',
      '  Each flow is named by the one structure it holds, defined in <a href="viewer.html#/md/knowledge/DATA_DICTIONARY.md#6.0-data-flows">Data Dictionary &sect;6.0</a>. Two structures passing between the same two processes are drawn as two flows.',
      '  The page also reads the GSW curve parameters, for a reference curve drawn only on an analysis view opened with ?gsw. No view of the app uses them otherwise, so they are not drawn here.'].join(NL)
  });
}

// ── Level 3: Yield Curves 3.1 ───────────────────────────────────────────────
function level3YieldCurvesLoad() {
  const stores = [
    { id: 'fedinv', name: 'FedInvest prices', href: DS('s1') },
    { id: 'quotes', name: 'Market quotes', href: DS('s7') },
    { id: 'nsasa', name: 'Ref CPI NSA and SA', href: DS('s4') },
    { id: 'hol', name: 'Bond holidays', href: DS('s16') },
  ];
  const S = a => V(F31 + '#' + a);
  const procs = [
    { id: '3.1.1', name: ['Parse FedInvest', 'prices'], href: S('parse-fedinvest-prices'), reads: ['fedinv'], out: { '3.1.7': ['TIPS prices', 'settlement date'], '3.1.8': ['Treasury prices', 'settlement date'] } },
    { id: '3.1.2', name: ['Parse market', 'quotes'], href: S('parse-market-quotes'), reads: ['quotes'], out: { '3.1.6': ['download date'], '3.1.7': ['TIPS quotes'], '3.1.8': ['Treasury quotes'] } },
    { id: '3.1.3', name: ['Parse Ref CPI', 'and SA factors'], href: S('parse-ref-cpi-and-sa-factors'), reads: ['nsasa'], out: {} },
    { id: '3.1.4', name: ['Parse bond', 'holidays'], href: S('parse-bond-holidays'), reads: ['hol'], out: { '3.1.6': ['bond holidays'] } },
    { id: '3.1.6', name: ['Determine', 'settlement date'], href: S('determine-settlement-date'), reads: [], out: { '3.1.7': ['settlement date'], '3.1.8': ['settlement date'] } },
    { id: '3.1.7', name: ['Calculate', 'TIPS yields'], href: S('calculate-tips-yields'), reads: [], out: {} },
    { id: '3.1.8', name: ['Calculate', 'Treasury yields'], href: S('calculate-treasury-yields'), reads: [], out: {} },
  ];
  const SX = 40, SW = 205, PR = 56, W = 1340, H = 900;
  const sy = i => 150 + i * 150;
  const px = { '3.1.1': 400, '3.1.2': 400, '3.1.3': 400, '3.1.4': 400, '3.1.6': 640, '3.1.7': 880, '3.1.8': 880 };
  const py = { '3.1.1': 150, '3.1.2': 300, '3.1.3': 450, '3.1.4': 600, '3.1.6': 680, '3.1.7': 300, '3.1.8': 540 };
  const OBS = procs.map(q => ({ x: px[q.id], y: py[q.id], r: PR }));
  const LBL = [];
  const P = [`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Level 3: Yield Curves 3.1, one process per source parsed and three that calculate from what the parses produce.">`, marker()];
  const sIdx = Object.fromEntries(stores.map((s, i) => [s.id, i]));
  procs.forEach(p => p.reads.forEach(id => {
    const y = sy(sIdx[id]), [x2, y2] = toCircle(SX + SW + 5, y, px[p.id], py[p.id], PR);
    P.push(flow(SX + SW + 5, y, x2, y2, { obstacles: OBS }));
  }));
  P.push(internalFlows(procs, px, py, PR, OBS, LBL));
  // The outputs of 3.1 at Level 2, each leaving the process that produces it.
  [['3.1.2', 110, 'download date  →  3.7'], ['3.1.7', 300, 'TIPS yields  →  3.2 and 3.6'], ['3.1.3', 420, 'SA factors  →  3.2'],
   ['3.1.8', 540, 'Treasury yields  →  3.4 to 3.7']].forEach(([id, y, lab]) => {
    const [x1, y1] = fromCircle(px[id], py[id], PR, W - 12, y);
    const others = OBS.filter(o => !(o.x === px[id] && o.y === py[id]));
    P.push(flow(x1, y1, W - 12, y, { obstacles: others }));
    P.push(labelAt(W - 16, y - 8, lab, 'end'));
  });
  stores.forEach((s, i) => P.push(storeShape(SX, sy(i), SW, s.href, s.name)));
  procs.forEach(p => P.push(procShape(px[p.id], py[p.id], PR, p.href, p.id, p.name)));
  P.push('</svg>');

  return page({
    spec: V(F31), specLabel: '3.1 Parse sources and calculate yields',
    title: 'Yield Curves 3.1 — Level 3', h1: 'Level 3 &mdash; Yield Curves 3.1 Parse sources and calculate yields', maxWidth: W,
    up: 'DFD_LEVEL2_YIELDCURVES.html', upLabel: 'Level 2 — Yield Curves', svg: P.join(NL),
    notes: ['  One process per source parsed, then 3.1.6, 3.1.7 and 3.1.8, which calculate from what the parses produce. The four flows leaving on the right are the outputs of 3.1 at Level 2.',
      '  Every process here drills to its own section of <a href="viewer.html#/md/' + F31 + '">3.1 Parse sources and calculate yields</a>.',
      '  3.1.3 produces nothing another process here uses: its output leaves 3.1 directly, for 3.2.',
      '  3.1.5 Parse GSW parameters is specified but not drawn. Its output is drawn only on an analysis view opened with ?gsw, and no view of the app uses it otherwise.'].join(NL)
  });
}


// ── Level 2: process 1, the ingestion jobs ──────────────────────────────────
function level2Ingestion() {
  // Each job is a process; each writes the store named beside it. Sources are not
  // redrawn as entities here: their flows enter from the page edge, named by the data they hold.
  const jobs = [
    { id: '1.1',  name: ['Download', 'FedInvest', 'prices'],        data: 'daily mid-market prices', reads: ['tipsref', 'hol'], writes: ['fedinv'], href: 'DFD_LEVEL3_INGEST_FEDINVEST.html' },
    { id: '1.2',  name: ['Download', 'market quotes'],              data: 'market quotes', reads: ['hol'],     writes: ['quotes'] },
    { id: '1.3',  name: ['Calculate', 'yield curve', 'data sets'],  data: null, reads: ['fedinv', 'quotes', 'nsasa', 'hol'], writes: ['yc', 'bei', 'spread'] },
    { id: '1.4',  name: ['Fetch auction', 'results'],               data: 'auction results',            writes: ['auctions'] },
    { id: '1.5',  name: ['Fetch tentative', 'auction', 'schedule'], data: 'tentative auction schedule', writes: ['tent'] },
    { id: '1.6',  name: ['Fetch TIPS', 'reference data'],           data: 'TIPS reference data',        writes: ['tipsref'] },
    { id: '1.7',  name: ['Update yield', 'history'],                data: 'market yields',              writes: ['yhist'] },
    { id: '1.8',  name: ['Archive', 'intraday yields'],             data: 'market yields',              writes: ['intraday'] },
    { id: '1.9',  name: ['Fetch monthly', 'CPI'],                   data: 'monthly CPI-U',              writes: ['blscpi'] },
    { id: '1.10', name: ['Interpolate', 'daily Ref CPI', 'NSA and SA'], data: null, reads: ['blscpi'], writes: ['nsasa'] },
    { id: '1.11', name: ['Calculate SA', 'and SAO yields'],         data: null, reads: ['quotes', 'refcpi', 'hol'], writes: ['sasao'] },
    { id: '1.12', name: ['Fetch CPI', 'history'],                   data: 'monthly CPI-U',              writes: ['cpihist'] },
    { id: '1.13', name: ['Fetch daily', 'Ref CPI'],                 data: 'daily Ref CPI',              writes: ['refcpi'] },
    { id: '1.14', name: ['Collect fund', 'holdings'],               data: 'fund holdings', reads: ['quotes', 'sasao'], writes: ['funds'] },
    { id: '1.15', name: ['Fetch GSW', 'curve parameters'],          data: 'GSW curve parameters',       writes: ['gsw'] },
  ];
  const stores = {
    fedinv: ['FedInvest prices', DS('s1')], tipsref: ['TIPS reference data', DS('s2')],
    refcpi: ['Ref CPI', DS('s3')], nsasa: ['Ref CPI NSA and SA', DS('s4')],
    auctions: ['Auction results', DS('s5')], yhist: ['Yield history', DS('s6')],
    quotes: ['Market quotes', DS('s7')], cpihist: ['CPI history', DS('s8')],
    tent: ['Tentative auction schedule', DS('s9')], sasao: ['SA and SAO yields', DS('s10')],
    funds: ['Fund holdings', DS('s11')], gsw: ['GSW curve parameters', DS('s12')],
    yc: ['Yield curves', DS('s13')], bei: ['Breakeven inflation', DS('s14')],
    spread: ['Bid and ask spreads', DS('s15')], hol: ['Bond holidays', DS('s16')],
    blscpi: ['Monthly CPI', DS('s17')], intraday: ['Intraday yields', DS('s6')],
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
    if (j.data) {
      P.push(flow(8, y, JX - JR - 3, y, { obstacles: OBS.filter(o => o.y !== y) }));
      P.push(labelAt(12, y - 12, j.data));
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
  jobs.forEach((j, i) => P.push(procShape(JX, jy(i), JR, j.href || V('knowledge/Data_Pipeline.md'), j.id, j.name)));
  P.push('</svg>');

  return page({
    title: 'Ingestion jobs — Level 2', h1: 'Level 2 &mdash; 1 Acquire and derive reference data', maxWidth: W,
    up: 'DFD_LEVEL1.html', upLabel: 'Level 1', svg: P.join(NL),
    notes: ['  One process per scheduled job, and the store each writes.',
      '  1.3, 1.10 and 1.11 read no external source: they calculate from what the retrieving jobs have stored. 1.1, 1.2 and 1.14 read both an external source and one or more stores.',
      '  Sources are not redrawn here. Their flows enter from the edge, named by the data they hold, and each source is drawn on the <a href="KNOWLEDGE_MAP.html">context diagram</a>.',
      '  1.1 explodes at <a href="DFD_LEVEL3_INGEST_FEDINVEST.html">Level 3</a>. Every other job drills to <a href="viewer.html#/md/knowledge/Data_Pipeline.md">Data Pipeline</a> for its schedule and script path; its process spec is not yet written.'].join(NL)
  });
}


// ── Level 3: Yield Curves 3.7 ───────────────────────────────────────────────
function level3YieldCurvesRender() {
  const S = K + '3.7_Render_Charts_And_Tables.md';
  const views = ['3.7.3', '3.7.4', '3.7.5', '3.7.6'];
  const procs = [
    { id: '3.7.1', name: ['Select', 'view'], a: 'select-view',
      out: { '3.7.2': ['view selections'], ...Object.fromEntries(views.map(v => [v, ['']])) } },
    { id: '3.7.2', name: ['Build', 'axis scales'], a: 'build-scales',
      out: Object.fromEntries(views.map((v, k) => [v, [k ? '' : 'axis scales']])) },
    { id: '3.7.3', name: ['Draw', 'Treasuries view'], a: 'draw-treasuries', out: {} },
    { id: '3.7.4', name: ['Draw', 'TIPS view'], a: 'draw-tips', out: { '3.7.7': ['drill request'] } },
    { id: '3.7.5', name: ['Draw', 'breakeven view'], a: 'draw-breakeven', out: {} },
    { id: '3.7.6', name: ['Draw', 'spread view'], a: 'draw-spreads', out: {} },
    { id: '3.7.7', name: ['Answer', 'drill request'], a: 'answer-a-drill', out: {} },
  ];
  const PR = 56, UX = 870, UW = 145, W = 1030, H = 980;
  const px = { '3.7.1': 300, '3.7.2': 300, '3.7.3': 640, '3.7.4': 640, '3.7.5': 640, '3.7.6': 640, '3.7.7': 380 };
  const py = { '3.7.1': 240, '3.7.2': 600, '3.7.3': 150, '3.7.4': 350, '3.7.5': 530, '3.7.6': 700, '3.7.7': 880 };
  const OBS = procs.map(q => ({ x: px[q.id], y: py[q.id], r: PR }));
  const LBL = [];
  const P = [`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Level 3: Yield Curves 3.7, one process per view drawn.">`, marker()];

  // The flows arriving from the rest of the app enter from the page edge, each at the
  // view that draws it, so no flow is drawn without showing which view consumes it.
  const arriving = [
    ['3.7.3', 'Treasury yields  ←  3.1'], ['3.7.3', 'spot yield curves  ←  3.4'], ['3.7.3', 'download date  ←  3.1'],
    ['3.7.4', 'SAO yields  ←  3.3'], ['3.7.4', 'spot yield curves  ←  3.4'], ['3.7.4', 'download date  ←  3.1'],
    ['3.7.5', 'breakeven inflation  ←  3.5'], ['3.7.6', 'bid and ask spreads  ←  3.6'],
  ];
  views.forEach(to => {
    const here = arriving.filter(([t]) => t === to);
    here.forEach(([, lab], k) => {
      const y = py[to] + (k - (here.length - 1) / 2) * 24;
      const [x2, y2] = toCircle(20, y, px[to], py[to], PR);
      P.push(flow(20, y, x2, y2, { obstacles: OBS.filter(o => !(o.x === px[to] && o.y === py[to])) }));
      P.push(labelAt(24, y - 6, lab));
    });
  });

  // The user, drawn once as a tall shape so each view reaches it without crossing another.
  P.push(flow(UX - 5, py['3.7.1'], px['3.7.1'] + PR + 3, py['3.7.1'], { obstacles: OBS.filter(o => o.x !== px['3.7.1']), placed: LBL, text: 'view selections' }));
  [...views, '3.7.7'].forEach(id => {
    P.push(flow(px[id] + PR + 3, py[id], UX - 5, py[id], { obstacles: OBS.filter(o => o.x !== px[id]) }));
  });
  P.push(labelAt((px['3.7.3'] + PR + UX) / 2, py['3.7.3'] - 14, 'charts and tables', 'middle'));
  P.push(labelAt((px['3.7.7'] + PR + UX) / 2, py['3.7.7'] - 14, 'drill popup', 'middle'));
  P.push(`  <g class="entity"><rect x="${UX}" y="90" width="${UW}" height="${H - 180}" rx="3"/><text class="e-name" x="${UX + UW / 2}" y="${H / 2}">User</text></g>`);
  P.push(internalFlows(procs, px, py, PR, OBS, LBL));
  procs.forEach(pr => P.push(procShape(px[pr.id], py[pr.id], PR, V(S + '#' + pr.a), pr.id, pr.name)));
  P.push('</svg>');

  return page({
    spec: V(S), specLabel: '3.7 Render charts and tables',
    title: 'Yield Curves 3.7 — Level 3', h1: 'Level 3 &mdash; Yield Curves 3.7 Render charts and tables', maxWidth: W,
    up: 'DFD_LEVEL2_YIELDCURVES.html', upLabel: 'Level 2 — Yield Curves', svg: P.join(NL),
    notes: ['  Every process drills to its own section of <a href="viewer.html#/md/' + S + '">3.7 Render charts and tables</a>, the process spec. <a href="viewer.html#/md/' + K + 'Visual_Standards.md">Visual Standards</a> specifies what the drawn output must look like.',
      '  <b>Nothing here calculates a yield.</b> Every figure drawn is produced upstream and passed in; a view showing a figure no other process produced is a defect in this stage.',
      '  The view selections from 3.7.1 reach every view, and the axis scales from 3.7.2 reach every chart; each fan is labelled once.',
      '  3.7.2 decides what is visible before anything is drawn. Its axis clipping moves the axis and never removes a security, so a table figure can fall outside what the chart shows.'].join(NL)
  });
}

// ── Level 3: 1.1 Download FedInvest prices ──────────────────────────────────
function level3IngestFedInvest() {
  const S = a => V('knowledge/1.1_Download_FedInvest_Prices.md' + (a ? '#' + a : ''));
  const procs = [
    { id: '1.1.1', name: ['Determine', 'settlement date'], href: S('determine-settlement-date'), out: { '1.1.3': ['settlement date'] } },
    { id: '1.1.2', name: ['Select TIPS and', 'Treasury prices'], href: S('select-tips-and-treasury-prices'), out: { '1.1.3': ['TIPS prices', 'Treasury prices'] } },
    { id: '1.1.3', name: ['Calculate', 'yields'], href: S('calculate-yields'), out: {} },
  ];
  const PR = 60, SW = 215, W = 1100, H = 660;
  const px = { '1.1.1': 380, '1.1.2': 380, '1.1.3': 700 };
  const py = { '1.1.1': 190, '1.1.2': 460, '1.1.3': 325 };
  const OBS = procs.map(q => ({ x: px[q.id], y: py[q.id], r: PR }));
  const LBL = [];
  const P = [`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Level 3: 1.1 Download FedInvest prices, three processes from the FedInvest price list to FedInvest prices (S1).">`, marker()];
  // The price list enters from the page edge at each process that reads it.
  ['1.1.1', '1.1.2'].forEach(id => {
    P.push(flow(8, py[id], px[id] - PR - 3, py[id], { obstacles: OBS.filter(o => o.y !== py[id]) }));
    P.push(labelAt(12, py[id] - 12, 'daily mid-market prices'));
  });
  // Bond holidays above 1.1.1 and TIPS reference data (S2) below 1.1.2 are read; FedInvest prices (S1), right of 1.1.3, is written.
  const hol = { x: px['1.1.1'] - SW / 2, y: 50 }, ref = { x: px['1.1.2'] - SW / 2, y: 610 }, s1 = { x: 860, y: py['1.1.3'] };
  P.push(flow(px['1.1.1'], hol.y + 25, px['1.1.1'], py['1.1.1'] - PR - 3));
  P.push(flow(px['1.1.2'], ref.y - 25, px['1.1.2'], py['1.1.2'] + PR + 3));
  P.push(flow(px['1.1.3'] + PR + 3, s1.y, s1.x - 5, s1.y));
  P.push(internalFlows(procs, px, py, PR, OBS, LBL));
  P.push(storeShape(hol.x, hol.y, SW, DS('s16'), 'Bond holidays'));
  P.push(storeShape(ref.x, ref.y, SW, DS('s2'), 'TIPS reference data'));
  P.push(storeShape(s1.x, s1.y, SW, DS('s1'), 'FedInvest prices'));
  procs.forEach(p => P.push(procShape(px[p.id], py[p.id], PR, p.href, p.id, p.name)));
  P.push('</svg>');

  return page({
    spec: S(), specLabel: '1.1 Download FedInvest prices',
    title: '1.1 Download FedInvest prices — Level 3', h1: 'Level 3 &mdash; 1.1 Download FedInvest prices', maxWidth: W,
    up: 'DFD_LEVEL2_INGESTION.html', upLabel: 'Level 2 — 1 Acquire and derive reference data', svg: P.join(NL),
    notes: ['  Every process here drills to its own section of <a href="' + S() + '">1.1 Download FedInvest prices</a>.',
      '  The flow entering from the edge is the FedInvest daily price list, drawn against its source on the <a href="KNOWLEDGE_MAP.html">context diagram</a>. 1.1.1 reads the date it states, and 1.1.2 reads its rows.',
      '  On a Bond Holiday, or when the price list does not state prices for the run date, 1.1.1 produces no settlement date and FedInvest prices (S1) is not written.'].join(NL)
  });
}

// ── emit ────────────────────────────────────────────────────────────────────
const outputs = [
  ['knowledge/DFD_LEVEL1.html', level1()],
  ['knowledge/DFD_LEVEL2_INGESTION.html', level2Ingestion()],
  ['knowledge/DFD_LEVEL3_INGEST_FEDINVEST.html', level3IngestFedInvest()],
  ['knowledge/DFD_LEVEL2_YIELDCURVES.html', level2YieldCurves()],
  ['knowledge/DFD_LEVEL3_YC_LOAD.html', level3YieldCurvesLoad()],
  ['knowledge/DFD_LEVEL3_YC_RENDER.html', level3YieldCurvesRender()],
];
if (unlinked.size) {
  console.log(String.fromCharCode(10) + "flow labels with no Data Dictionary entry:");
  [...unlinked].sort().forEach(u => console.log('  ' + u));
}
for (const [rel, html] of outputs) {
  fs.writeFileSync(path.join(ROOT, rel), html);
  console.log('wrote ' + rel);
}
