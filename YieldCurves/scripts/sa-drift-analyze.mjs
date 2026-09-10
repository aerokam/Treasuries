// Seasonal-factor drift analysis — reproduces every table in
// knowledge/1.1_Seasonal_Factor_Drift.md against live data.
//
//   node scripts/sa-drift-analyze.mjs
//
// Pulls monthly CPI-U history from FRED (CPIAUCNS / CPIAUCSL) and the live R2
// yield + Ref CPI stores, then:
//   A  seasonal amplitude and its growth since the 1990s
//   B  sigma_drift(h): RMS change in a monthly seasonal factor over horizon h
//   C  the same for the interpolated S(mm-dd) of the five TIPS maturity dates
//   D  w(h) confidence weight, toward 1.0 and toward the long-run monthly mean
//   E  decade means of f by month (the motor-fuel structural shift)
//   F  SA-minus-ask across the full TIPS curve, by maturity year
//   G  maturity-month residual structure, front vs long
//   H  SA-minus-ask under the w(h) fade of S_maturity

import { yieldFromPrice, daysBetween } from '../../shared/src/bond-math.js';
import { refCpiFromMonthly, monthlyCpiMap, saFactorForDate, maturitySaFactor, seasonalHorizonWeight } from '../../shared/src/ref-cpi.js';

const FRED = id => `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`;
const R2 = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const txt = async u => (await fetch(u, { cache: 'no-cache' })).text();

const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const HOR = [1, 2, 3, 5, 10, 15, 20, 25, 30];
const YR = 31557600000;
const pct = x => (x * 100).toFixed(3);
const rms = a => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);

// ---- FRED monthly CPI -> { 'YYYY-M': value } (month not zero-padded, for refCpiFromMonthly) ----
function parseFred(csv) {
  const out = {};
  for (const line of csv.trim().split(/\r?\n/).slice(1)) {
    const [d, v] = line.split(',');
    if (!v || v === '.') continue;
    out[`${+d.slice(0, 4)}-${+d.slice(5, 7)}`] = parseFloat(v);
  }
  return out;
}

const [nsaCsv, saCsv, yieldsCsv, refCsv] = await Promise.all([
  txt(FRED('CPIAUCNS')), txt(FRED('CPIAUCSL')),
  txt(`${R2}/Treasuries/YieldsFromFedInvestPrices.csv`), txt(`${R2}/TIPS/RefCpiNsaSa.csv`),
]);

const NSA = parseFred(nsaCsv), SA = parseFred(saCsv);
const keys = Object.keys(SA).filter(k => NSA[k] != null)
  .sort((a, b) => (a.split('-').map(Number)[0] - b.split('-').map(Number)[0]) ||
                  (a.split('-').map(Number)[1] - b.split('-').map(Number)[1]));
const firstY = +keys[0].split('-')[0], lastY = +keys[keys.length - 1].split('-')[0];
const fMY = (M, Y) => (NSA[`${Y}-${M}`] != null && SA[`${Y}-${M}`] != null) ? NSA[`${Y}-${M}`] / SA[`${Y}-${M}`] : null;
console.log(`FRED overlap ${keys[0]} .. ${keys[keys.length - 1]}  (${keys.length} months)`);

// ===== A. Seasonal amplitude =====
function yearAmp(Y) {
  const v = []; for (let M = 1; M <= 12; M++) { const x = fMY(M, Y); if (x != null) v.push(x); }
  if (v.length < 12) return null;
  const m = v.reduce((a, b) => a + b) / 12;
  return { sd: Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / 12), ptp: Math.max(...v) - Math.min(...v) };
}
const poolYrs = [2015, 2016, 2017, 2018, 2019].map(yearAmp).filter(Boolean);
const A = poolYrs.reduce((a, b) => a + b.sd, 0) / poolYrs.length;
const Aptp = poolYrs.reduce((a, b) => a + b.ptp, 0) / poolYrs.length;
console.log('\n=== A. Seasonal amplitude (within-year spread of f = NSA/SA) ===');
console.log(`  pooled 2015-2019:  sd ${pct(A)}% of price   mean peak-to-trough ${pct(Aptp)}%`);
console.log('  within-year sd by year: ' +
  [1990, 1995, 2000, 2005, 2010, 2015, 2020].map(Y => { const s = yearAmp(Y); return `${Y} ${s ? pct(s.sd) : '-'}%`; }).join('   '));

// ===== B. sigma_drift(h), pooled and by month =====
console.log('\n=== B. sigma_drift(h) = RMS[ f(M,Y+h) - f(M,Y) ], pooled across months, 1947-2026 ===');
const sigmaDrift = {};
const driftByMonth = HOR.reduce((o, h) => (o[h] = {}, o), {});
for (const h of HOR) {
  const all = [];
  for (let M = 1; M <= 12; M++) {
    const md = [];
    for (let Y = firstY; Y + h <= lastY; Y++) { const a = fMY(M, Y), b = fMY(M, Y + h); if (a != null && b != null) md.push(b - a); }
    driftByMonth[h][M] = md.length ? rms(md) : null;
    all.push(...md);
  }
  sigmaDrift[h] = rms(all);
  console.log(`  h=${String(h).padStart(2)}   ${pct(sigmaDrift[h])}% of price   (n=${all.length})`);
}
console.log('  by month, h=30: ' + MON.map((m, i) => `${m} ${pct(driftByMonth[30][i + 1])}`).join('  '));

// ===== C. interpolated S(mm-dd) for the five maturity dates =====
const nsaMonthly = NSA, saMonthly = SA; // already in 'YYYY-M' form refCpiFromMonthly wants
const Sday = (y, mo, d) => {
  const ds = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const n = refCpiFromMonthly(ds, nsaMonthly), s = refCpiFromMonthly(ds, saMonthly);
  return (n == null || s == null) ? null : n / s;
};
const DATES = [['Feb-15', 2, 15], ['Jan-15', 1, 15], ['Apr-15', 4, 15], ['Jul-15', 7, 15], ['Oct-15', 10, 15]];
// amplitude of the interpolated S series (matches the dimension of the pooled drift below)
const AintYrs = [2015, 2016, 2017, 2018, 2019].map(Y => {
  const v = []; for (let mo = 1; mo <= 12; mo++) { const s = Sday(Y, mo, 15); if (s != null) v.push(s); }
  if (v.length < 12) return null;
  const m = v.reduce((a, b) => a + b) / 12;
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / 12);
}).filter(Boolean);
const Aint = AintYrs.reduce((a, b) => a + b, 0) / AintYrs.length;
console.log('\n=== C. Interpolated S(mm-dd) — the actual maturity-date factor ===');
console.log(`  amplitude of interpolated S (within-year sd, 2015-2019): ${pct(Aint)}%`);
const poolDrift = HOR.reduce((o, h) => (o[h] = [], o), {});
for (const [lab, mo, dd] of DATES) {
  const byY = {};
  for (let y = 1948; y <= lastY; y++) { const v = Sday(y, mo, dd); if (v != null) byY[y] = v; }
  const vals = Object.values(byY), mean = vals.reduce((a, b) => a + b) / vals.length;
  const latest = byY[Math.max(...Object.keys(byY).map(Number))];
  const dr = HOR.map(h => {
    const d = [];
    for (let y = 1948; y + h <= lastY; y++) if (byY[y] != null && byY[y + h] != null) { d.push(byY[y + h] - byY[y]); poolDrift[h].push(byY[y + h] - byY[y]); }
    return d.length ? rms(d) : null;
  });
  console.log(`  ${lab}: mean S ${pct(mean - 1)}%  latest ${pct(latest - 1)}%   sigma_drift h[${HOR}] = ${dr.map(x => pct(x)).join(' ')}`);
}
const poolByH = {}; for (const h of HOR) poolByH[h] = rms(poolDrift[h]);

// ===== D. w(h) =====
// ---- emit the constant table shared/src/ref-cpi.js embeds (interpolated-S drift, per calendar month) ----
const EMIT_H = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30];
const emitRows = [];
for (let mo = 1; mo <= 12; mo++) {
  const byY = {};
  for (let y = 1948; y <= lastY; y++) { const v = Sday(y, mo, 15); if (v != null) byY[y] = v; }
  const row = EMIT_H.map(h => {
    const d = [];
    for (let y = 1948; y + h <= lastY; y++) if (byY[y] != null && byY[y + h] != null) d.push(byY[y + h] - byY[y]);
    return d.length ? +(rms(d)).toFixed(6) : null;
  });
  emitRows.push(row);
}
console.log('\n=== EMIT: paste into shared/src/ref-cpi.js ===');
console.log(`const SEASONAL_AMPLITUDE = ${(+Aint.toFixed(6))};   // within-year sd of interpolated S, 2015-2019`);
console.log(`const SEASONAL_DRIFT_HORIZONS = [${EMIT_H.join(', ')}];`);
console.log('const SEASONAL_DRIFT_SIGMA = [   // [monthIndex 0=Jan][horizon] RMS drift of S(month,15) over h years, FRED 1948-' + lastY);
emitRows.forEach((r, i) => console.log(`  [${r.map(x => x.toFixed(6)).join(', ')}],  // ${MON[i]}`));
console.log('];');

console.log('\n=== D. w(h) = A^2 / (A^2 + sigma_drift(h)^2)   [A = interpolated-S amplitude, drift = pooled over the 5 dates] ===');
const wTo1 = {}; for (const h of HOR) { wTo1[h] = Aint * Aint / (Aint * Aint + poolByH[h] ** 2); }
console.log('   ' + HOR.map(h => `${h}y ${wTo1[h].toFixed(3)}`).join('  '));
const febByY = {}; for (let y = 1948; y <= lastY; y++) { const v = Sday(y, 2, 15); if (v != null) febByY[y] = v; }
const febDrift30 = rms((() => { const d = []; for (let y = 1948; y + 30 <= lastY; y++) if (febByY[y] != null && febByY[y + 30] != null) d.push(febByY[y + 30] - febByY[y]); return d; })());
console.log(`  Feb-15 specific: sigma_drift(30) ${pct(febDrift30)}%  ->  w(30) ${(Aint * Aint / (Aint * Aint + febDrift30 ** 2)).toFixed(3)}`);
const febMean = Object.values(febByY).reduce((a, b) => a + b) / Object.values(febByY).length;
const residSd = rms((() => { const r = []; for (let M = 1; M <= 12; M++) for (let Y = 2010; Y <= 2024; Y++) { const v = fMY(M, Y); if (v != null) r.push(v - (function () { const vs = []; for (let y = firstY; y <= lastY; y++) { const x = fMY(M, y); if (x != null) vs.push(x); } return vs.reduce((a, b) => a + b) / vs.length; })()); } return r; })());
const wMean = {}; for (const h of HOR) wMean[h] = residSd ** 2 / (residSd ** 2 + poolByH[h] ** 2);
console.log('  toward long-run monthly mean (keeps (mean-1) in full): ' + HOR.map(h => `${h}y ${wMean[h].toFixed(3)}`).join('  '));
console.log(`  full-history mean S(Feb-15) ${pct(febMean - 1)}%   (vs latest ${pct(febByY[lastY - 1] ? febByY[lastY - 1] - 1 : NaN)}%)`);

// ===== E. decade means (gasoline) =====
console.log('\n=== E. mean f by decade, % deviation from 1.0 (watch Apr-Jun vs Sep) ===');
for (const [lab, y0, y1] of [['1980s', 1980, 1989], ['1990s', 1990, 1999], ['2000s', 2000, 2009], ['2010s', 2010, 2019], ['2020s', 2020, 2025]]) {
  const row = MON.map((_, i) => {
    const v = []; for (let Y = y0; Y <= y1; Y++) { const x = fMY(i + 1, Y); if (x != null) v.push(x); }
    return v.length ? pct(v.reduce((a, b) => a + b) / v.length - 1).padStart(7) : '   -   ';
  });
  console.log(`  ${lab} ${row.join('')}`);
}

// ===== F/G/H. live TIPS curve =====
const yLines = yieldsCsv.trim().split('\n');
const settleStr = yLines[0].trim();
const yHead = yLines[1].split(',');
const yRows = yLines.slice(2).map(l => { const c = l.split(','); const o = {}; yHead.forEach((h, i) => o[h] = c[i]); return o; });
const refRows = refCsv.trim().split('\n');
const rHead = refRows[0].split(',');
const rRows = refRows.slice(1).map(l => { const c = l.split(','); const o = {}; rHead.forEach((h, i) => o[h] = c[i]); return o; });
const D = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const settle = D(settleStr);
const saSettle = saFactorForDate(rRows, settleStr);
const now = Date.now();

let bonds = yRows.filter(r => /TIPS/i.test(r.type)).map(b => {
  const coupon = parseFloat(b.coupon), price = parseFloat(b.price), mat = D(b.maturity);
  const saMat = saFactorForDate(rRows, b.maturity);
  if (saSettle == null || saMat == null || isNaN(saMat)) return null;
  const yrs = daysBetween(settle, mat) / 365.25;
  const ask = yieldFromPrice(price, coupon, settle, mat);
  const sa = yieldFromPrice(price * (saSettle / saMat), coupon, settle, mat);
  return { mat: b.maturity, matDate: mat, coupon, price, yrs, ask, sa, saMat, dbp: (sa - ask) * 1e4,
           h: (mat - now) / YR };
}).filter(Boolean).sort((a, b) => a.matDate - b.matDate);

console.log(`\n=== F. SA-minus-ask by maturity year (settlement ${settleStr}, ${bonds.length} TIPS) ===`);
const byYr = {};
for (const b of bonds) (byYr[b.matDate.getFullYear()] = byYr[b.matDate.getFullYear()] || []).push(b.dbp);
for (const y of Object.keys(byYr).sort())
  console.log(`  ${y}: mean ${(byYr[y].reduce((a, c) => a + c, 0) / byYr[y].length).toFixed(1).padStart(7)} bp   n=${byYr[y].length}`);

// NSS fit for residuals (same as sa-analyze.mjs)
function nssBasis(t, l1, l2) { const a = t / l1, b = t / l2; const f1 = a > 1e-6 ? (1 - Math.exp(-a)) / a : 1; const fb = b > 1e-6 ? (1 - Math.exp(-b)) / b : 1; return [1, f1, f1 - Math.exp(-a), fb - Math.exp(-b)]; }
function ols4(X, y) { const A = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], bv = [0,0,0,0]; for (let k = 0; k < X.length; k++) { const xi = X[k]; for (let i = 0; i < 4; i++) { bv[i] += xi[i] * y[k]; for (let j = 0; j < 4; j++) A[i][j] += xi[i] * xi[j]; } } const M = A.map((r, i) => [...r, bv[i]]); for (let c = 0; c < 4; c++) { let p = c; for (let r = c + 1; r < 4; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; if (Math.abs(M[p][c]) < 1e-12) return null;[M[c], M[p]] = [M[p], M[c]]; for (let r = 0; r < 4; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k < 5; k++) M[r][k] -= f * M[c][k]; } } return [M[0][4] / M[0][0], M[1][4] / M[1][1], M[2][4] / M[2][2], M[3][4] / M[3][3]]; }
function fitNSS(taus, ys) { let best = null; const g = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 7, 10, 15, 20, 30]; for (const l1 of g) for (const l2 of g) { if (l2 <= l1) continue; const X = taus.map(t => nssBasis(t, l1, l2)); const beta = ols4(X, ys); if (!beta) continue; let ssr = 0; for (let k = 0; k < taus.length; k++) { const xb = nssBasis(taus[k], l1, l2); ssr += (ys[k] - xb.reduce((s, v, i) => s + v * beta[i], 0)) ** 2; } if (!best || ssr < best.ssr) best = { l1, l2, beta, ssr }; } return t => { const xb = nssBasis(t, best.l1, best.l2); return xb.reduce((s, v, i) => s + v * best.beta[i], 0); }; }
const fitB = bonds.filter(b => b.yrs >= 0.5);
const nssSA = fitNSS(fitB.map(b => b.yrs), fitB.map(b => b.sa));
console.log('\n=== G. maturity-month residual (SA yield vs full-curve NSS), by region ===');
for (const [lab, lo, hi] of [['FRONT 2027-2032', 2027, 2032], ['MID 2033-2039', 2033, 2039], ['LONG 2040+', 2040, 2100]]) {
  const g = {};
  for (const b of bonds) {
    if (b.yrs < 0.5 || b.matDate.getFullYear() < lo || b.matDate.getFullYear() > hi) continue;
    (g[b.matDate.getMonth() + 1] = g[b.matDate.getMonth() + 1] || []).push((b.sa - nssSA(b.yrs)) * 1e4);
  }
  const parts = Object.keys(g).sort((a, b) => a - b).map(m => `${MON[m - 1]} ${(g[m].reduce((a, c) => a + c, 0) / g[m].length).toFixed(1)}bp(n${g[m].length})`);
  console.log(`  ${lab}: ${parts.join('   ') || '(no bonds)'}`);
}

console.log('\n=== H. SA-minus-ask under maturitySaFactor() — the operative weighting (per-month w(h), no floor) ===');
console.log('  maturity     yrs   w(h)    dbp now   dbp weighted');
for (const b of bonds) {
  if (b.yrs < 4) continue;
  const sFaded = maturitySaFactor(rRows, b.mat, settleStr);
  const w = seasonalHorizonWeight(b.matDate.getMonth() + 1, b.h);
  const dFaded = (yieldFromPrice(b.price * (saSettle / sFaded), b.coupon, settle, b.matDate) - b.ask) * 1e4;
  console.log(`  ${b.mat} ${b.yrs.toFixed(1).padStart(5)}  ${w.toFixed(3)}  ${b.dbp.toFixed(1).padStart(7)}  ${dFaded.toFixed(1).padStart(12)}`);
}

// ===== I. option comparison for the long end (persistence, autocorrelation, shrink-to-mean) =====
// Does today's reading of the maturity-month factor still carry information at 25-40 years,
// and do the measurement-driven alternatives (b) autocorrelation weight and (c) shrink to the
// month's own long-run mean actually move the long-end adjustment?
console.log('\n=== I. Long-horizon option comparison ===');
const HLONG = [5, 10, 15, 20, 25, 30, 35, 40];
function seriesFor(mo, dd) { const o = {}; for (let y = 1948; y <= lastY; y++) { const v = Sday(y, mo, dd); if (v != null) o[y] = v; } return o; }
function tsSd(byY, y0) { const v = Object.entries(byY).filter(([y]) => +y >= y0).map(([, s]) => s); const m = v.reduce((a, b) => a + b, 0) / v.length; return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length); }
function driftAndCorr(byY, h) {
  const a = [], b = [];
  for (let y = 1948; y + h <= lastY; y++) if (byY[y] != null && byY[y + h] != null) { a.push(byY[y]); b.push(byY[y + h]); }
  if (a.length < 3) return null;
  const d = a.map((x, i) => b[i] - x);
  const sig = rms(d);
  const ma = a.reduce((s, x) => s + x, 0) / a.length, mb = b.reduce((s, x) => s + x, 0) / b.length;
  let sab = 0, sa2 = 0, sb2 = 0;
  for (let i = 0; i < a.length; i++) { sab += (a[i] - ma) * (b[i] - mb); sa2 += (a[i] - ma) ** 2; sb2 += (b[i] - mb) ** 2; }
  return { sig, rho: sab / Math.sqrt(sa2 * sb2), n: a.length };
}
for (const [lab, mo, dd] of [['pooled (5 dates)', null, null], ['Feb-15', 2, 15]]) {
  let get;
  if (mo == null) { const S5 = DATES.map(([, m, d]) => seriesFor(m, d)); get = h => { const rows = S5.map(s => driftAndCorr(s, h)).filter(Boolean); return { sig: rms(rows.flatMap((r, i) => { const s = S5[i]; const out = []; for (let y = 1948; y + h <= lastY; y++) if (s[y] != null && s[y + h] != null) out.push(s[y + h] - s[y]); return out; })), rho: rows.reduce((a, r) => a + r.rho, 0) / rows.length }; }; }
  else { const s = seriesFor(mo, dd); get = h => driftAndCorr(s, h); }
  const Ats = mo == null ? Aint : tsSd(seriesFor(mo, dd), 2000);
  console.log(`\n  ${lab}   time-series sd of the factor (2000+): ${pct(Ats)}%   A*sqrt(2) ceiling: ${pct(Ats * Math.SQRT2)}%`);
  console.log('   h     sigma_drift   sigma/A*sqrt2   rho(direct)   w_snr=A^2/(A^2+s^2)   w_rho');
  for (const h of HLONG) {
    const r = get(h); if (!r) continue;
    const wSnr = Aint * Aint / (Aint * Aint + r.sig ** 2);
    console.log(`   ${String(h).padStart(2)}    ${pct(r.sig).padStart(7)}%      ${(r.sig / (Aint * Math.SQRT2)).toFixed(3)}         ${r.rho.toFixed(3)}          ${wSnr.toFixed(3)}            ${Math.max(0, r.rho).toFixed(3)}`);
  }
}
// permanent vs transient split of the seasonal variance (pooled)
const sigInf = get5PooledInf();
function get5PooledInf() { const S5 = DATES.map(([, m, d]) => seriesFor(m, d)); const all = []; for (const s of S5) for (let y = 1948; y + 30 <= lastY; y++) if (s[y] != null && s[y + 30] != null) all.push(s[y + 30] - s[y]); return rms(all); }
const transientSd = sigInf / Math.SQRT2;
const permanentVar = Math.max(0, Aint * Aint - transientSd * transientSd);
console.log(`\n  Variance split (pooled, using sigma_drift(30) = ${pct(sigInf)}% as the asymptote):`);
console.log(`   transient (drifts away):  sd ${pct(transientSd)}%   ${(transientSd ** 2 / (Aint * Aint) * 100).toFixed(0)}% of seasonal variance`);
console.log(`   permanent (month effect): sd ${pct(Math.sqrt(permanentVar))}%   ${(permanentVar / (Aint * Aint) * 100).toFixed(0)}% of seasonal variance`);

// effect of each option on a representative long bond
const longB = bonds.filter(b => b.matDate.getFullYear() >= 2053)[0];
if (longB) {
  const feb = seriesFor(2, 15);
  const febMeanAll = Object.values(feb).reduce((a, b) => a + b, 0) / Object.values(feb).length;
  const rho30 = driftAndCorr(feb, 30).rho;
  const sMatRaw = saFactorForDate(rRows, longB.mat);
  const variants = {
    'current w(h)': maturitySaFactor(rRows, longB.mat, settleStr),
    'w = rho(30) (option b)': 1 + (sMatRaw - 1) * Math.max(0, rho30),
    'shrink to long-run Feb mean (5.1 alt)': febMeanAll,
    'full weight (no adjustment removed... = raw)': sMatRaw,
    'S_maturity -> 1.0 (option c floor)': 1.0,
  };
  console.log(`\n  ${longB.mat} (${longB.yrs.toFixed(1)}y): SA-minus-ask under each option`);
  for (const [k, sMat] of Object.entries(variants)) {
    const dbp = (yieldFromPrice(longB.price * (saSettle / sMat), longB.coupon, settle, longB.matDate) - longB.ask) * 1e4;
    console.log(`   ${k.padEnd(42)} S_mat=${sMat.toFixed(5)}  dbp=${dbp.toFixed(2)}`);
  }
}
