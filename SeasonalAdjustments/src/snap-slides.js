// snap-slides.js — The reworked deck. Each drawSn(el) renders one full-page
// annotated SVG from the frozen snapshot (snap-data.js). Annotations are drawn
// ON the chart — no external legends.
// Spec: knowledge/1.0_SeasonalAdjustments_Explorer.md

import {
  SNAP, SNAPSHOT_LABEL, SETTLE_LABEL, SETTLE_DATE, MONTHS, DIM, cum, MATS,
  localDate, doy, dateLabel, Sat, waveMin, waveMax,
} from './snap-data.js';
import { note, arrow, callout, vBracket, ring, AMBER, CYAN, GREEN, INK } from './sa-annotate.js';
import { priceFromYield, yieldFromPrice } from '../../shared/src/bond-math.js';

const GRID = '#334155', MUTED = '#94a3b8';
const QUOTED = '#f97316';   // same orange the YieldCurves app uses for the quoted (Ask, Market) curve
const WAVE = '#7dd3fc';
const SETTLE = '#38bdf8';
const NEARC = '#22c55e', FARC = '#f97316';   // near / far accent colours, carried across slides 4 & 7

const fmtMY = s => { const d = localDate(s); return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const SETTLE_DOY = doy(8, 1); // Sep 1
const SETTLE_D = localDate(SETTLE_DATE);

// The one bond the story follows: the lowest-coupon TIPS maturing Apr 15 2028
// in the snapshot (91282CGW5, 1.250%). Its settlement->maturity span is one
// whole year plus a ~7-month stub — the "extra months" of Canty (2009) §1b.
const STORY = { mat: '2028-04-15', matDate: localDate('2028-04-15'), matMonth: 3, coupon: 0.0125, ask: 0.0232032 };

// ── Slide 1: The Sawtooth ──────────────────────────────────────────────────
// The quoted TIPS real-yield curve exactly as the YieldCurves app draws it
// today: one point per bond, market prices, plotted against maturity date.
// Start at Jul 2027 — real yields inside ~1 year are dominated by other
// effects and only muddy the picture. Jan and Jul are the only maturity
// months that run the whole span (past ~2032 no new Apr / Oct maturities are
// left), so the Jan / Jul points are drawn bold and connected: Jul sits below
// the neighbouring Jan by ~30 bp near the front, a few bp by the mid-2030s.
// Nothing about the month a bond matures in should move its yield — that is
// the puzzle the guide answers.
export function drawS1(el) {
  const W = 900, H = 520, L = 60, R = 24, T = 62, B = 74;
  const x0 = localDate('2027-07-15').getTime();
  const x1 = localDate('2037-01-01').getTime();
  const bonds = SNAP.bonds.filter(b => b.matDate.getTime() >= x0 && b.matDate.getTime() <= x1);

  const tx = ms => L + (ms - x0) / (x1 - x0) * (W - L - R);
  const pct = bonds.map(b => b.ask * 100);
  const lo = Math.floor((Math.min(...pct) - 0.05) * 10) / 10;
  const hi = Math.ceil((Math.max(...pct) + 0.05) * 10) / 10;
  const ty = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);

  let s = '';

  // y grid — 0.1 pp steps
  for (let v = lo; v <= hi + 1e-9; v = Math.round((v + 0.1) * 10) / 10) {
    const yy = ty(v);
    s += `<line x1="${L}" y1="${yy.toFixed(1)}" x2="${W - R}" y2="${yy.toFixed(1)}" stroke="${GRID}" stroke-width="1" opacity="${Math.abs(v * 10 % 5) < 1e-6 ? .55 : .3}"/>`;
    s += `<text x="${L - 8}" y="${(yy + 3).toFixed(1)}" text-anchor="end" style="fill:${MUTED};font-size:10px">${v.toFixed(1)}%</text>`;
  }
  // x — gridlines at every maturity month (15th of Jan / Apr / Jul / Oct) so the
  // reader can read a point's maturity month straight off the axis: month
  // abbreviation on every tick, the year on a second row under each January
  for (let y = 2027; y <= 2037; y++) {
    for (const mo of [0, 3, 6, 9]) {
      const t = localDate(`${y}-${String(mo + 1).padStart(2, '0')}-15`).getTime();
      if (t < x0 || t > x1) continue;
      const xx = tx(t), major = mo === 0;
      s += `<line x1="${xx.toFixed(1)}" y1="${T}" x2="${xx.toFixed(1)}" y2="${H - B}" stroke="${GRID}" stroke-width="1" opacity="${major ? .45 : .16}"/>`;
      s += `<text x="${xx.toFixed(1)}" y="${H - B + 14}" text-anchor="middle" style="fill:${MUTED};font-size:9px">${MONTHS[mo]}</text>`;
      if (major) s += `<text x="${xx.toFixed(1)}" y="${H - B + 27}" text-anchor="middle" style="fill:${MUTED};font-size:11px;font-weight:600">${y}</text>`;
    }
  }
  const midY = (T + (H - B)) / 2;
  s += `<text x="15" y="${midY}" text-anchor="middle" transform="rotate(-90 15 ${midY})" style="fill:${MUTED};font-size:12px">quoted ask yield (%)</text>`;

  // one bond per maturity month per year, lowest coupon (keeps the lines clean
  // where two bonds share a maturity date)
  const pick = (mo, yr) => {
    const c = bonds.filter(b => b.matMonth === mo && b.matDate.getFullYear() === yr);
    return c.length ? c.reduce((a, b) => (b.coupon < a.coupon ? b : a)) : null;
  };

  // faint backdrop: every bond connected in maturity order
  let pAll = '';
  bonds.forEach((b, i) => { pAll += (i ? 'L' : 'M') + tx(b.matDate.getTime()).toFixed(1) + ' ' + ty(b.ask * 100).toFixed(1) + ' '; });
  s += `<path d="${pAll}" fill="none" stroke="${QUOTED}" stroke-width="1.1" opacity=".3"/>`;

  // the Jan / Jul maturities alone, connected — the saw-tooth that runs the
  // whole curve (Jan higher, Jul lower, repeating out to 2036)
  const jjPts = [];
  for (let yr = 2027; yr <= 2037; yr++) for (const mo of [0, 6]) { const b = pick(mo, yr); if (b) jjPts.push(b); }
  let pJJ = '';
  jjPts.forEach((b, i) => { pJJ += (i ? 'L' : 'M') + tx(b.matDate.getTime()).toFixed(1) + ' ' + ty(b.ask * 100).toFixed(1) + ' '; });
  s += `<path d="${pJJ}" fill="none" stroke="${QUOTED}" stroke-width="2"/>`;

  for (const b of bonds) {
    const cx = tx(b.matDate.getTime()), cy = ty(b.ask * 100);
    const jj = b.matMonth === 0 || b.matMonth === 6;
    s += `<g><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${jj ? 3.6 : 2.4}" fill="${QUOTED}" opacity="${jj ? 1 : .38}"/>` +
         `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="9" fill="transparent"/>` +
         `<title>${fmtMY(b.mat)} · ${(b.coupon * 100).toFixed(3)}% — quoted ${(b.ask * 100).toFixed(2)}%</title></g>`;
  }

  // measure the Jan -> Jul step near the front and again in the mid-2030s
  // (same-year Jan and Jul maturities, lowest coupon each): ~33 bp then ~1 bp.
  const janJulStep = yr => {
    const j = pick(0, yr), u = pick(6, yr);
    if (!j || !u) return null;
    return { j, u, bp: Math.round((j.ask - u.ask) * 10000) };
  };
  for (const yr of [2028, 2034]) {
    const m = janJulStep(yr);
    if (!m) continue;
    const xj = tx(m.j.matDate.getTime()), xu = tx(m.u.matDate.getTime());
    const yj = ty(m.j.ask * 100), yu = ty(m.u.ask * 100);
    const bx = (xj + xu) / 2;
    s += `<circle cx="${xj.toFixed(1)}" cy="${yj.toFixed(1)}" r="5.5" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
    s += `<circle cx="${xu.toFixed(1)}" cy="${yu.toFixed(1)}" r="5.5" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
    s += vBracket(bx, yj, yu, INK, 4);
    s += note(bx + 9, Math.min(yj, yu) - 6, `${m.bp} bp`, INK, 'start', 12);
  }

  // caption (title comes from the page h2)
  s += note(W / 2, 40, [`Quoted ask yields as of ${SNAPSHOT_LABEL} (settlement = ${SETTLE_LABEL}).`], MUTED, 'middle', 12);
  s += note(W / 2, H - 30, ['Jan and Jul are the maturities that span the whole curve. Jul yields sit about 30 bp below the neighbouring Jan'], AMBER, 'middle', 12);
  s += note(W / 2, H - 14, ['near the front, and about 1 bp by 2034: the seasonal effect is smaller where the maturity is longer.'], AMBER, 'middle', 12);

  el.innerHTML = s;
}

// ── Slide 2: Index = Trend × Seasonal ─────────────────────────────────────
// The synthetic model starts here. Canty decomposes the inflation index as
// I = T · S (trend × seasonal component). Hold the trend flat — T = 100 in
// every month — and the index is only the seasonal component, scaled by 100.
// The seasonal pattern used for the rest of the model: from a January start
// the index rises 1% a month to a July peak, then reverses month by month
// back to 100 the following January. Net zero over the year. No indexation
// lag; month 0 is January.
export function drawS2(el) {
  const W = 900, H = 520, L = 72, R = 96, T = 92, B = 78;
  const MLAB = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];

  // 13 monthly points: month 0 = Jan, up ×1.01 to month 6 = Jul, down ÷1.01
  // to month 12 = the next Jan (exactly back to 100).
  const idx = [100];
  for (let m = 1; m <= 6; m++) idx.push(idx[m - 1] * 1.01);
  for (let m = 7; m <= 12; m++) idx.push(idx[m - 1] / 1.01);
  const seasonal = idx.map(v => v / 100);

  const lo = 98, hi = 107;
  const x = m => L + m / 12 * (W - L - R);
  const y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);

  let s = '';

  s += note(W / 2, 26, ['Canty decomposes the inflation index as  I = T × S :  a trend and a seasonal component.'], MUTED, 'middle', 12);
  s += note(W / 2, 44, ['Hold the trend flat at T = 100 every month. What is left in the index is only the seasonal component.'], MUTED, 'middle', 12);

  // y grid
  for (let v = lo + 1; v <= hi - 0.5; v += 1) {
    const yy = y(v);
    s += `<line x1="${L}" y1="${yy.toFixed(1)}" x2="${W - R}" y2="${yy.toFixed(1)}" stroke="${GRID}" stroke-width="1" opacity="${v === 100 ? 0 : .18}"/>`;
    s += `<text x="${L - 8}" y="${(yy + 3).toFixed(1)}" text-anchor="end" style="fill:${MUTED};font-size:10px">${v}</text>`;
  }
  // month gridlines + labels (every 3rd month)
  for (let m = 0; m <= 12; m++) {
    const xx = x(m), major = m % 3 === 0;
    s += `<line x1="${xx.toFixed(1)}" y1="${T}" x2="${xx.toFixed(1)}" y2="${H - B}" stroke="${GRID}" stroke-width="1" opacity="${major ? .4 : .14}"/>`;
    if (major) s += `<text x="${xx.toFixed(1)}" y="${H - B + 18}" text-anchor="middle" style="fill:${MUTED};font-size:11px">${MLAB[m]}</text>`;
  }
  const midY = (T + (H - B)) / 2;
  s += `<text x="18" y="${midY}" text-anchor="middle" transform="rotate(-90 18 ${midY})" style="fill:${MUTED};font-size:11px">index level</text>`;

  // trend line, flat at 100
  const y100 = y(100);
  s += `<line x1="${L}" y1="${y100.toFixed(1)}" x2="${W - R}" y2="${y100.toFixed(1)}" stroke="${MUTED}" stroke-width="1.4" stroke-dasharray="4 3" opacity=".7"/>`;
  s += `<text x="${W - R + 8}" y="${(y100 + 3).toFixed(1)}" style="fill:${MUTED};font-size:10px">trend  T = 100</text>`;

  // the index curve
  let p = '';
  idx.forEach((v, m) => { p += (m ? 'L' : 'M') + x(m).toFixed(1) + ' ' + y(v).toFixed(1) + ' '; });
  s += `<path d="${p}" fill="none" stroke="${WAVE}" stroke-width="2.5"/>`;
  idx.forEach((v, m) => { s += `<circle cx="${x(m).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3" fill="${WAVE}"/>`; });
  s += `<text x="${(x(9)).toFixed(1)}" y="${(y(idx[9]) - 12).toFixed(1)}" text-anchor="middle" style="fill:${WAVE};font-size:11px;font-weight:700">index  I = T × S</text>`;

  // peak and the return to 100
  s += note(x(6), y(idx[6]) - 12, [`July peak:  index ${idx[6].toFixed(1)}   (S = ${seasonal[6].toFixed(3)})`], INK, 'middle', 11);
  s += note(x(0) - 2, y(100) + 18, ['100'], INK, 'end', 10);
  s += note(x(12) + 2, y(100) + 18, ['100'], INK, 'start', 10);

  s += note(W / 2, H - 14, ['The index rises 1% a month to July, then reverses month by month back to 100 in January: net zero over the year.'], AMBER, 'middle', 12.5);

  el.innerHTML = s;
}

// ── Slide 3: Why the Month Matters ─────────────────────────────────────────
// Connects the slide-1 saw-tooth to its cause, and turns slide 2's monthly
// seasonal factor into the daily one TIPS need. The daily Ref CPI used for TIPS
// inflation adjustments is interpolated from monthly CPI-U NSA (FRED CPIAUCNS)
// and has a seasonal pattern that repeats each year. No official seasonally
// adjusted Ref CPI is published; we compute one by applying the same
// interpolation to BLS's SA CPI-U (CPIAUCSL). Ref CPI NSA / Ref CPI SA is the
// SA Factor (DATA_DICTIONARY.md#sa-factor), plotted here for one year. It
// differs between settlement and each maturity month/day, and that difference
// is why the quoted yield and the SA yield are not equal. SA calcs key on mm/dd.
export function drawS3(el) {
  const W = 900, H = 520, L = 66, R = 116, T = 96, B = 80;
  const lo = 0.9905, hi = 1.007;   // headroom above the peak / below the trough for labels
  const x = d => L + (d / 364) * (W - L - R);
  const y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);

  let s = '';

  // month gridlines
  for (let m = 0; m < 12; m++) {
    const xx = x(cum[m]);
    s += `<line x1="${xx.toFixed(1)}" y1="${T}" x2="${xx.toFixed(1)}" y2="${H - B}" stroke="${GRID}" stroke-width="1" opacity=".3"/>`;
    s += `<text x="${(xx + 3).toFixed(1)}" y="${H - B + 16}" style="fill:${MUTED};font-size:11px">${MONTHS[m]}</text>`;
  }
  // y ticks
  for (let v = Math.ceil(lo * 200) / 200; v <= hi + 1e-9; v += 0.005) {
    const yy = y(v);
    s += `<text x="${L - 8}" y="${(yy + 3).toFixed(1)}" text-anchor="end" style="fill:${MUTED};font-size:10px">${v.toFixed(3)}</text>`;
  }
  const midY = (T + (H - B)) / 2;
  s += `<text x="16" y="${midY}" text-anchor="middle" transform="rotate(-90 16 ${midY})" style="fill:${MUTED};font-size:11px">SA Factor  (Ref CPI NSA ÷ Ref CPI SA)</text>`;

  // reference at factor = 1
  const y1 = y(1);
  s += `<line x1="${L}" y1="${y1.toFixed(1)}" x2="${W - R}" y2="${y1.toFixed(1)}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3 3" opacity=".7"/>`;
  s += `<text x="${W - R + 6}" y="${(y1 + 3).toFixed(1)}" style="fill:${MUTED};font-size:10px">1.000 — NSA = SA</text>`;

  // the wave
  let path = '', area = `M${x(0).toFixed(1)} ${y1.toFixed(1)} `;
  for (let d = 0; d < 365; d++) {
    path += (d ? 'L' : 'M') + x(d).toFixed(1) + ' ' + y(Sat(d)).toFixed(1) + ' ';
    area += 'L' + x(d).toFixed(1) + ' ' + y(Sat(d)).toFixed(1) + ' ';
  }
  area += `L${x(364).toFixed(1)} ${y1.toFixed(1)} Z`;
  s += `<path d="${area}" fill="${WAVE}" opacity=".09"/>`;
  s += `<path d="${path}" fill="none" stroke="${WAVE}" stroke-width="2.5"/>`;

  // settlement marker
  const xs = x(SETTLE_DOY), ys = y(Sat(SETTLE_DOY));
  s += `<line x1="${xs.toFixed(1)}" y1="${ys.toFixed(1)}" x2="${xs.toFixed(1)}" y2="${(H - B).toFixed(1)}" stroke="${SETTLE}" stroke-width="1.5" stroke-dasharray="4 3" opacity=".8"/>`;
  s += `<line x1="${L}" y1="${ys.toFixed(1)}" x2="${W - R}" y2="${ys.toFixed(1)}" stroke="${SETTLE}" stroke-width="1" stroke-dasharray="5 4" opacity=".4"/>`;
  s += `<circle cx="${xs.toFixed(1)}" cy="${ys.toFixed(1)}" r="6" fill="${SETTLE}"/>`;
  s += callout(xs, ys - 4, xs - 250, ys - 8, [`settlement  ${SETTLE_LABEL}`, `SA Factor ${Sat(SETTLE_DOY).toFixed(4)}`], SETTLE, 'start', -0.14, 11);

  // the four maturity month/days
  for (const mm of MATS) {
    const d = doy(mm.m, 15), xd = x(d), yd = y(Sat(d));
    const below = Sat(d) < Sat(SETTLE_DOY);
    const dx = mm.m === 0 ? 9 : 0;
    const anchor = mm.m === 0 ? 'start' : 'middle';
    s += `<line x1="${xd.toFixed(1)}" y1="${yd.toFixed(1)}" x2="${xd.toFixed(1)}" y2="${(H - B).toFixed(1)}" stroke="${AMBER}" stroke-width="1" stroke-dasharray="2 3" opacity=".45"/>`;
    s += `<circle cx="${xd.toFixed(1)}" cy="${yd.toFixed(1)}" r="5" fill="none" stroke="${AMBER}" stroke-width="2"/>`;
    s += note(xd + dx, yd + (below ? 19 : -11), `${MONTHS[mm.m]} 15   ${Sat(d).toFixed(4)}`, AMBER, anchor, 11);
  }
  // the SA-Factor difference between settlement and the Apr maturity date,
  // labelled on-chart as the extreme case
  const apr = doy(3, 15);
  s += note(x(apr) + 6, (ys + y(Sat(apr))) / 2, ['The SA Factor differs between settlement', 'and this maturity month/day. That is why', 'the quoted yield and the SA yield are', 'not equal.'], INK, 'start', 10.5);

  // captions — provenance in grey, the SA Factor definition in white.
  // First use of NSA / SA / SA Factor; each line kept inside the viewBox width.
  s += note(W / 2, 22, [
    'The daily Ref CPI used for TIPS inflation adjustments is interpolated from monthly CPI-U Not Seasonally Adjusted (NSA; FRED CPIAUCNS).',
    'It has a seasonal pattern that repeats each year, and no official seasonally adjusted Ref CPI is published.',
    'We derive one with the same interpolation from BLS’s Seasonally Adjusted (SA) CPI-U (CPIAUCSL).',
  ], MUTED, 'middle', 11.5);
  s += note(W / 2, 72, ['Ref CPI NSA ÷ Ref CPI SA is the SA Factor shown here: above 1 in late summer, below 1 in late winter.'], INK, 'middle', 11.5);

  s += note(W / 2, H - 14, ['Settlement is near the SA Factor peak. Jul and Oct maturity dates are close to it; Jan and Apr are well below.'], AMBER, 'middle', 13);

  el.innerHTML = s;
}

// helpers shared by slides 4–5 ------------------------------------------------
const DAY_MS = 86400000;
const doyOf = d => doy(d.getMonth(), d.getDate());     // day-of-year for a Date
const addYears = (d, n) => new Date(d.getFullYear() + n, d.getMonth(), d.getDate());

// ── Slide 4: The Extra Months ─────────────────────────────────────────────
// Canty (2009) §1b in TIPS terms. Follow one bond (STORY: 1.250% Apr 15 2028).
// Its settlement-to-maturity span is one whole year plus a ~7-month stub. Over
// each whole year the seasonal pattern completes and cancels; only the stub
// carries a net seasonal change. Plot the SA Factor across the bond's life:
// S(settlement) = S(one year later), but S(maturity) sits well below — the
// stub falls on the down-slope of the wave. That shortfall is seasonally
// predictable, so the market prices it into a higher quoted real yield.
export function drawS4(el) {
  const W = 900, H = 520, L = 66, R = 150, T = 92, B = 96;
  const settle = SETTLE_D;
  const anniv = addYears(settle, 1);
  const matur = STORY.matDate;
  const span = matur - settle;
  const stubMonths = Math.round((matur - anniv) / DAY_MS / 30.44);

  const sSettle = Sat(doyOf(settle));
  const sMatur = Sat(doyOf(matur));

  const tx = d => L + (d - settle) / span * (W - L - R);
  const lo = 0.991, hi = 1.006;
  const ty = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);

  let s = '';

  // captions
  s += note(W / 2, 22, ['Follow one TIPS: 1.250% coupon, maturing 15 April 2028, bought for settlement 1 September 2026.'], MUTED, 'middle', 11.5);
  s += note(W / 2, 38, [`That is one whole year of indexation plus a ${stubMonths}-month stub. A whole year of the seasonal pattern cancels; the stub does not.`], MUTED, 'middle', 11.5);

  // shaded spans: whole year (faint) then the stub (amber tint)
  s += `<rect x="${tx(settle).toFixed(1)}" y="${T}" width="${(tx(anniv) - tx(settle)).toFixed(1)}" height="${H - T - B}" fill="${MUTED}" opacity=".06"/>`;
  s += `<rect x="${tx(anniv).toFixed(1)}" y="${T}" width="${(tx(matur) - tx(anniv)).toFixed(1)}" height="${H - T - B}" fill="${FARC}" opacity=".10"/>`;
  s += note((tx(settle) + tx(anniv)) / 2, H - B + 32, ['one whole year', 'the seasonal pattern completes and cancels'], MUTED, 'middle', 10);
  s += note((tx(anniv) + tx(matur)) / 2, H - B + 32, [`the ${stubMonths}-month stub`, 'a net seasonal change remains'], FARC, 'middle', 10);

  // month gridlines + year labels
  for (let y = 2026; y <= 2028; y++) for (const mo of [0, 3, 6, 9]) {
    const d = new Date(y, mo, 1);
    if (d < settle || d > matur) continue;
    const xx = tx(d);
    s += `<line x1="${xx.toFixed(1)}" y1="${T}" x2="${xx.toFixed(1)}" y2="${H - B}" stroke="${GRID}" stroke-width="1" opacity="${mo === 0 ? .4 : .15}"/>`;
    s += `<text x="${xx.toFixed(1)}" y="${H - B + 14}" text-anchor="middle" style="fill:${MUTED};font-size:9px">${MONTHS[mo]}</text>`;
    if (mo === 0) s += `<text x="${xx.toFixed(1)}" y="${H - B + 25}" text-anchor="middle" style="fill:${MUTED};font-size:10px;font-weight:600">${y}</text>`;
  }
  const midY = (T + (H - B)) / 2;
  s += `<text x="16" y="${midY}" text-anchor="middle" transform="rotate(-90 16 ${midY})" style="fill:${MUTED};font-size:11px">SA Factor  (Ref CPI NSA ÷ Ref CPI SA)</text>`;
  for (const v of niceTicks(lo, hi, 4)) {
    s += `<line x1="${L}" y1="${ty(v).toFixed(1)}" x2="${W - R}" y2="${ty(v).toFixed(1)}" stroke="${GRID}" stroke-width="1" opacity=".2"/>`;
    s += `<text x="${L - 6}" y="${(ty(v) + 3).toFixed(1)}" text-anchor="end" style="fill:${MUTED};font-size:9px">${v.toFixed(3)}</text>`;
  }

  // the SA Factor across the bond's life
  let path = '';
  for (let t = settle.getTime(); t <= matur.getTime(); t += DAY_MS) {
    const d = new Date(t);
    path += (path ? 'L' : 'M') + tx(d).toFixed(1) + ' ' + ty(Sat(doyOf(d))).toFixed(1) + ' ';
  }
  s += `<path d="${path}" fill="none" stroke="${WAVE}" stroke-width="2.5"/>`;

  // settlement level, extended, and the shortfall bracket at maturity
  s += `<line x1="${L}" y1="${ty(sSettle).toFixed(1)}" x2="${W - R}" y2="${ty(sSettle).toFixed(1)}" stroke="${SETTLE}" stroke-width="1" stroke-dasharray="5 4" opacity=".55"/>`;
  s += `<text x="${W - R + 6}" y="${(ty(sSettle) + 3).toFixed(1)}" style="fill:${SETTLE};font-size:10px">settlement level</text>`;

  const mk = (d, sv, col, lbl, dy, anch = 'middle') => {
    const xx = tx(d), yy = ty(sv);
    s += `<line x1="${xx.toFixed(1)}" y1="${T}" x2="${xx.toFixed(1)}" y2="${H - B}" stroke="${col}" stroke-width="1" stroke-dasharray="2 3" opacity=".5"/>`;
    s += `<circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="5" fill="${col}"/>`;
    s += note(xx + (anch === 'start' ? 8 : 0), yy + dy, lbl, col, anch, 10);
  };
  mk(settle, sSettle, SETTLE, [`settlement`, sSettle.toFixed(4)], -14, 'start');
  mk(anniv, Sat(doyOf(anniv)), SETTLE, [`one year on`, Sat(doyOf(anniv)).toFixed(4)], -14);
  mk(matur, sMatur, FARC, [`maturity`, sMatur.toFixed(4)], 24);

  // shortfall bracket at the maturity edge
  const bx = tx(matur) + 22;
  s += vBracket(bx, ty(sSettle), ty(sMatur), INK, 5);
  s += note(bx + 9, (ty(sSettle) + ty(sMatur)) / 2, ['seasonal', 'shortfall', `${((sSettle / sMatur - 1) * 100).toFixed(2)}%`], INK, 'start', 10);

  s += note(W / 2, H - 30, ['Over the whole year the seasonal pattern returns to where it started. Over the stub it does not: the bond ends at a seasonal low,'], AMBER, 'middle', 11);
  s += note(W / 2, H - 14, ['so it accrues less seasonally-predictable inflation. The market prices that shortfall in as a higher quoted real yield.'], AMBER, 'middle', 11);

  el.innerHTML = s;
}

// ── Slide 5: Trend × Seasonal ────────────────────────────────────────────
// Canty (2009) §2, Eq. 2: the inflation index decomposes as I = T · S. The SA
// Ref CPI is the trend T; the SA Factor NSA ÷ SA is the seasonal part S — the
// same wave as slide 3, here across the recent months of real data.
export function drawS5(el) {
  const W = 900, H = 520, L = 66, R = 30;
  const rows = SNAP.refRows.slice(-400);          // ~13 months up to the snapshot
  const n = rows.length;
  const tx = i => L + i / (n - 1) * (W - L - R);

  let s = '';

  // equation strip
  s += note(W / 2, 24, ['Ref CPI NSA   =   Ref CPI SA   ×   SA Factor'], INK, 'middle', 15);
  s += note(W / 2, 42, ['index  =  trend  ×  seasonal        (Canty 2009, Eq. 2)'], MUTED, 'middle', 11);

  // ---- panel A: NSA and SA Ref CPI, zoomed ----
  const AT = 70, AB = 300;
  const vals = rows.flatMap(r => [r.nsa, r.sa]);
  const alo = Math.min(...vals) - 0.4, ahi = Math.max(...vals) + 0.4;
  const ay = v => AT + (1 - (v - alo) / (ahi - alo)) * (AB - AT);

  for (const v of niceTicks(alo, ahi, 4)) {
    s += `<line x1="${L}" y1="${ay(v).toFixed(1)}" x2="${W - R}" y2="${ay(v).toFixed(1)}" stroke="${GRID}" stroke-width="1" opacity=".25"/>`;
    s += `<text x="${L - 6}" y="${(ay(v) + 3).toFixed(1)}" text-anchor="end" style="fill:${MUTED};font-size:9px">${v.toFixed(1)}</text>`;
  }
  let pNsa = '', pSa = '';
  rows.forEach((r, i) => {
    pNsa += (i ? 'L' : 'M') + tx(i).toFixed(1) + ' ' + ay(r.nsa).toFixed(1) + ' ';
    pSa += (i ? 'L' : 'M') + tx(i).toFixed(1) + ' ' + ay(r.sa).toFixed(1) + ' ';
  });
  s += `<path d="${pSa}" fill="none" stroke="${SETTLE}" stroke-width="2.5"/>`;
  s += `<path d="${pNsa}" fill="none" stroke="${QUOTED}" stroke-width="1.8"/>`;
  s += note(L + 4, AT + 12, ['Ref CPI NSA — the seasonal wave is still in it'], QUOTED, 'start', 10);
  s += note(L + 4, AT + 28, ['Ref CPI SA — the seasonal wave taken out'], SETTLE, 'start', 10);

  // ---- panel B: the ratio = SA Factor ----
  const BT = 340, BB = 452;
  const facs = rows.map(r => r.factor);
  const blo = Math.min(...facs) - 0.0008, bhi = Math.max(...facs) + 0.0008;
  const by = v => BT + (1 - (v - blo) / (bhi - blo)) * (BB - BT);
  for (const v of niceTicks(blo, bhi, 3)) {
    s += `<line x1="${L}" y1="${by(v).toFixed(1)}" x2="${W - R}" y2="${by(v).toFixed(1)}" stroke="${GRID}" stroke-width="1" opacity="${Math.abs(v - 1) < 1e-9 ? 0 : .22}"/>`;
    s += `<text x="${L - 6}" y="${(by(v) + 3).toFixed(1)}" text-anchor="end" style="fill:${MUTED};font-size:9px">${v.toFixed(3)}</text>`;
  }
  s += `<line x1="${L}" y1="${by(1).toFixed(1)}" x2="${W - R}" y2="${by(1).toFixed(1)}" stroke="${MUTED}" stroke-width="1" stroke-dasharray="3 3" opacity=".55"/>`;
  s += `<text x="${L - 6}" y="${(by(1) + 3).toFixed(1)}" text-anchor="end" style="fill:${MUTED};font-size:9px">1.000</text>`;
  let pF = '';
  rows.forEach((r, i) => { pF += (i ? 'L' : 'M') + tx(i).toFixed(1) + ' ' + by(r.factor).toFixed(1) + ' '; });
  s += `<path d="${pF}" fill="none" stroke="${WAVE}" stroke-width="2.5"/>`;
  s += note(W - R, BT + 2, ['NSA ÷ SA = SA Factor — the seasonal part, the slide-3 wave'], WAVE, 'end', 10);

  // month ticks along the bottom
  let lastMo = -1;
  rows.forEach((r, i) => {
    const d = localDate(r.date);
    if (d.getMonth() !== lastMo && d.getDate() <= 3) {
      lastMo = d.getMonth();
      s += `<text x="${tx(i).toFixed(1)}" y="${BB + 14}" text-anchor="middle" style="fill:${MUTED};font-size:8.5px">${MONTHS[d.getMonth()]}${d.getMonth() === 0 ? ' ' + d.getFullYear() : ''}</text>`;
    }
  });

  s += note(W / 2, H - 12, ['Divide Ref CPI NSA by Ref CPI SA and what is left is a clean, repeating wave — the seasonal part, and what the seasonal adjustment removes.'], AMBER, 'middle', 11.5);

  el.innerHTML = s;
}

// ── Slide 6: From Payments to One Ratio ───────────────────────────────────
// Canty (2009) §3, simplified, landing on Eq. 14 in TIPS terms. The bond price
// is a discounted sum of payments, each scaled by its own Ref CPI ratio. Split
// every Ref CPI into trend × seasonal; for annual coupons every payment lands
// on the maturity month/day, so one S(maturity) factors out of the sum and one
// S(settlement) factors out of the settlement conversion. Everything seasonal
// collapses to the single ratio S(settlement) / S(maturity).
export function drawS6(el) {
  const W = 900, H = 520;
  const cx = 60;
  let s = '';

  const step = (y, big, small) => {
    s += note(cx, y, big, INK, 'start', 13);
    if (small) s += note(cx + 14, y + 17, small, MUTED, 'start', 10.5);
  };

  s += note(W / 2, 24, ['What the seasonal adjustment does to the price, one step at a time'], MUTED, 'middle', 12);

  step(72,
    ['1.   Quoted price   ≈   Σ  ( payment  ×  Ref CPI on its date / Ref CPI at issue  ×  discount )'],
    ['each payment is scaled up by how far the Ref CPI has grown since the bond was issued']);

  step(140,
    ['2.   Split every Ref CPI into   trend × seasonal   —   Ref CPI = T × S'],
    ['from the previous slide: S is the SA Factor, T is the SA Ref CPI']);

  step(208,
    ['3.   Annual coupons: every payment falls on the maturity month and day'],
    ['so every payment carries the same seasonal factor, S(maturity); the settlement conversion carries S(settlement)']);

  step(276,
    ['4.   Both pull straight out of the sum. Every other seasonal term cancels.'],
    ['what is left is one number multiplying the price']);

  // boxed result
  const bx = cx, bw = W - 2 * cx, by = 320, bh = 96;
  s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="10" fill="#0b1220" stroke="${WAVE}" stroke-width="1.5"/>`;
  s += note(bx + 24, by + 30, ['SACP   =   Quoted price   ×   S(settlement) / S(maturity)'], INK, 'start', 15);
  s += note(bx + 24, by + 55, ['=   Quoted price   ×   SA Factor(settlement) / SA Factor(maturity month & day)'], INK, 'start', 12.5);
  s += note(bx + 24, by + 78, ['=   Quoted price   ×   SA price factor'], WAVE, 'start', 12.5);
  s += note(bx + bw - 20, by + 16, ['Canty 2009, Eq. 14'], MUTED, 'end', 10);

  s += note(cx, 448, ['Two approximations: the small real accrued-interest term is dropped; and because TIPS pay semiannually a second'], MUTED, 'start', 9.5);
  s += note(cx, 462, ['seasonal factor applies to the coupons — it moves the result by ≤ 1 bp, since the principal lands in the maturity month either way.'], MUTED, 'start', 9.5);

  s += note(W / 2, H - 12, ['The whole seasonal effect on price is one ratio: the SA Factor at settlement over the SA Factor at the maturity month and day.'], AMBER, 'middle', 11.5);

  el.innerHTML = s;
}

// ── Slide 7: Near and Far ─────────────────────────────────────────────────
// Apply Eq. 14 to two real TIPS and carry it through to the SA yield. NEAR
// (Oct 2028) matures close to the settlement point on the wave, so the price
// factor is ~1 and the yield barely moves. FAR (the STORY bond, Apr 2028)
// matures at a seasonal low, so the factor is ~1.007 and the yield drops ~45 bp.
// Every number here is computed from the wave shown on slides 3–5.
export function drawS7(el) {
  const W = 900, H = 520;
  const sSettle = Sat(SETTLE_DOY);

  const near = SNAP.bonds.find(b => b.mat === '2028-10-15');
  const far = SNAP.bonds.find(b => b.mat === STORY.mat && Math.abs(b.coupon - STORY.coupon) < 1e-6);
  const calc = (b) => {
    const cp = priceFromYield(b.ask, b.coupon, SETTLE_D, b.matDate);
    const sMat = Sat(doy(b.matMonth, 15));
    const pf = sSettle / sMat;
    const sacp = cp * pf;
    const saY = yieldFromPrice(sacp, b.coupon, SETTLE_D, b.matDate);
    return { b, cp, sMat, pf, sacp, saY, dbp: (saY - b.ask) * 10000 };
  };
  const N = calc(near), F = calc(far);

  let s = '';

  // ---- left: compact one-year wave with the three marks ----
  const L = 50, WR = 430, T = 92, B = H - 96;
  const lo = 0.9905, hi = 1.007;
  const x = d => L + (d / 364) * (WR - L);
  const y = v => T + (1 - (v - lo) / (hi - lo)) * (B - T);

  for (let m = 0; m < 12; m++) {
    const xx = x(cum[m]);
    s += `<line x1="${xx.toFixed(1)}" y1="${T}" x2="${xx.toFixed(1)}" y2="${B}" stroke="${GRID}" stroke-width="1" opacity=".22"/>`;
    s += `<text x="${(xx + 2).toFixed(1)}" y="${B + 13}" style="fill:${MUTED};font-size:8.5px">${MONTHS[m][0]}</text>`;
  }
  let path = '';
  for (let d = 0; d < 365; d++) path += (d ? 'L' : 'M') + x(d).toFixed(1) + ' ' + y(Sat(d)).toFixed(1) + ' ';
  s += `<path d="${path}" fill="none" stroke="${WAVE}" stroke-width="2"/>`;
  s += `<line x1="${L}" y1="${y(sSettle).toFixed(1)}" x2="${WR}" y2="${y(sSettle).toFixed(1)}" stroke="${SETTLE}" stroke-width="1" stroke-dasharray="5 3" opacity=".5"/>`;
  const mk = (d, sv, col, lbl, dy, anch) => {
    const xx = x(d), yy = y(sv);
    s += `<line x1="${xx.toFixed(1)}" y1="${yy.toFixed(1)}" x2="${xx.toFixed(1)}" y2="${y(sSettle).toFixed(1)}" stroke="${col}" stroke-width="1.4" stroke-dasharray="3 2" opacity=".8"/>`;
    s += `<circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="5" fill="${col}"/>`;
    s += note(xx + (anch === 'end' ? -8 : anch === 'start' ? 8 : 0), yy + dy, lbl, col, anch, 9.5);
  };
  mk(SETTLE_DOY, sSettle, SETTLE, `settlement ${sSettle.toFixed(4)}`, -9, 'end');
  mk(doy(9, 15), N.sMat, NEARC, `Oct 15  ${N.sMat.toFixed(4)}`, 4, 'start');
  mk(doy(3, 15), F.sMat, FARC, `Apr 15  ${F.sMat.toFixed(4)}`, 18, 'middle');
  s += note((L + WR) / 2, T - 12, 'SA Factor, one year', MUTED, 'middle', 10);

  // ---- right: two cards, the full chain ----
  const cx0 = 470, cw = W - cx0 - 22;
  const card = (top, r, tone, tag) => {
    const h = 186;
    s += `<rect x="${cx0}" y="${top}" width="${cw}" height="${h}" rx="10" fill="#0b1220" stroke="${tone}" stroke-width="1.4"/>`;
    s += note(cx0 + 16, top + 24, `${tag}  ·  ${MONTHS[r.b.matMonth]} 15 2028  ·  ${(r.b.coupon * 100).toFixed(3)}%`, tone, 'start', 11.5);
    s += note(cx0 + 16, top + 48, `quoted yield  ${(r.b.ask * 100).toFixed(2)}%`, INK, 'start', 11);
    s += note(cx0 + 16, top + 68, `clean price  =  ${r.cp.toFixed(2)}`, INK, 'start', 11);
    s += note(cx0 + 16, top + 94, `SA price factor  =  ${sSettle.toFixed(4)} ÷ ${r.sMat.toFixed(4)}  =  ${r.pf.toFixed(4)}`, INK, 'start', 11);
    s += note(cx0 + 16, top + 114, `SACP  =  ${r.cp.toFixed(2)}  ×  ${r.pf.toFixed(4)}  =  ${r.sacp.toFixed(2)}`, INK, 'start', 11);
    s += `<line x1="${cx0 + 14}" y1="${top + 128}" x2="${cx0 + cw - 14}" y2="${top + 128}" stroke="${GRID}"/>`;
    s += note(cx0 + 16, top + 150, `SA yield  =  solve YTM(${r.sacp.toFixed(2)})  =  ${(r.saY * 100).toFixed(2)}%`, INK, 'start', 11);
    s += note(cx0 + 16, top + 172, `change from quoted yield`, MUTED, 'start', 9.5);
    s += note(cx0 + cw - 16, top + 172, `${r.dbp >= 0 ? '+' : ''}${r.dbp.toFixed(0)} bp`, tone, 'end', 15);
  };
  card(66, N, NEARC, 'NEAR');
  card(268, F, FARC, 'FAR');

  s += note(W / 2, H - 26, ['Same four steps both times. How far the price factor is from 1 is set by how far the maturity month/day is from settlement on the wave;'], INK, 'middle', 11.5);
  s += note(W / 2, H - 11, ['the SA yield is the ordinary yield recomputed from the adjusted price.'], AMBER, 'middle', 11.5);

  el.innerHTML = s;
}

// small helper: ~count "nice" gridline values spanning [lo, hi]
function niceTicks(lo, hi, count) {
  const raw = (hi - lo) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(m => m >= raw) || 10 * mag;
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(v);
  return out;
}
