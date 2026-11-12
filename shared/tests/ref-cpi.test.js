// ref-cpi.test.js — Verification that the two Ref CPI derivations AGREE.
// Run: node shared/tests/ref-cpi.test.js
//
// This is the "redundancy that verifies": the calculated NSA Ref CPI
// (refCpiFromMonthly, 31 CFR App. B) must reproduce the series TreasuryDirect
// SecIndex states, read live here, not RefCPI (S3), which is itself calculated. A mismatch means either
// bad data or a bug in the interpolation — exactly the failure mode that
// derailed the TipsReference session.

import { lookupRefCpi, parseRefCpiRows, refCpiFromMonthly, monthlyCpiMap, fillUnreportedMonths, indexRatio, TREASURY_ROUNDING, NO_ROUNDING,
         saFactorForDate, maturitySaFactor, credibilityFactor, seasonalDriftSigma } from '../src/ref-cpi.js';
import { parseCsv } from '../src/csv.js';
import { fetchSecIndexSeries, compare, lastDayTwoMonthsAfter } from '../../scripts/checkDailyRefCpi.js';
import { calcSeries, monthlyMapsFromS8 } from '../../scripts/calcDailyRefCpi.js';

const R2 = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const REFCPI_URL    = `${R2}/TIPS/RefCPI.csv`;
const CPI_URL       = `${R2}/bls/CPI.csv`;

// Both published and calculated Ref CPI are truncated-to-6/rounded-to-5 per
// 31 CFR §356 App. B §I.B.3 (see refCpiFromMonthly), so these should agree
// EXACTLY, not just to the nearest published decimal. TOL is float noise only
// (~1e-13 relative) -- it is deliberately far tighter than a single unit in
// the 5th decimal (1e-5): a looser TOL (1e-4, the original value here) cannot
// distinguish "matches" from "off by one in the last digit", which is exactly
// how a real truncateThenRound magnitude-dependent rounding bug (fixed
// 2026-08-27 -- an absolute epsilon nudge that was a no-op at Ref CPI
// magnitude, silently mis-rounding 28 real published dates) passed this
// check for as long as it did.
const TOL = 1e-9;

let pass = 0, fail = 0;
const ok  = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } };

async function fetchText(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

function parseRefCpi(text) {
  return text.trim().split('\n').slice(1).map(l => {
    const [date, refCpi] = l.split(',');
    return { date: date.trim(), refCpi: parseFloat(refCpi) };
  });
}

async function main() {
  console.log('Fetching the SecIndex series of three CUSIPs, CPI and Ref CPI ...');
  const [cpiText, refCpiText, ...series] = await Promise.all([fetchText(CPI_URL), fetchText(REFCPI_URL), ...['9128272M3', '912810FD5', '912810US5'].map(fetchSecIndexSeries)]);
  const byDate = new Map();
  for (const s of series) for (const r of s) byDate.set(r.date, r.refCpi);
  const retrieved = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, refCpi]) => ({ date, refCpi }));
  const { nsa: monthlyNsa, sa: monthlySa, last } = monthlyMapsFromS8(cpiText);

  console.log(`Retrieved ${retrieved.length} daily rows; ${Object.keys(monthlyNsa).length} monthly CPI rows.\n`);

  // ── Cross-check: calculated NSA must reproduce retrieved, where computable ──
  let compared = 0, maxDiff = 0, maxDiffDate = '';
  // From 2019 on: CPI states the revised CPI where Treasury kept the first-reported one on 426 dates of 2000 and 2016 (1.13).
  for (const row of retrieved.filter(r => r.date >= '2019-01-01')) {
    const calc = refCpiFromMonthly(row.date, monthlyNsa);
    if (calc == null) continue;            // outside monthly coverage — skip
    compared++;
    const diff = Math.abs(calc - row.refCpi);
    if (diff > maxDiff) { maxDiff = diff; maxDiffDate = row.date; }
  }
  ok(compared > 1000, `expected to compare many dates (got ${compared})`);
  ok(maxDiff <= TOL, `calc vs retrieved max diff ${maxDiff.toExponential(3)} on ${maxDiffDate} exceeds TOL ${TOL}`);
  console.log(`Cross-check: compared ${compared} dates, max |calc − retrieved| = ${maxDiff.toExponential(3)} (${maxDiffDate || 'n/a'})`);

  // ── Regression: the live RefCPI (S3) is what 1.13 calculates from CPI (S8) ──
  // The Ref CPI SA and the SA Factor of every date, and the Ref CPI NSA from 2019 on, must agree exactly.
  // Before 2019 S3 holds Treasury's first-reported NSA, which differs from the revised CPI on 426 dates (1.13).
  const s3 = parseRefCpiRows(refCpiText);
  const calc = new Map(calcSeries(monthlyNsa, monthlySa, last).map(r => [r.date, r]));
  let s3Compared = 0, nsaMax = 0, saMax = 0, factorMax = 0;
  for (const row of s3) {
    const c = calc.get(row.date);
    if (!c) continue;
    s3Compared++;
    if (row.date >= '2019-01-01') nsaMax = Math.max(nsaMax, Math.abs(c.refCpi - row.refCpi));
    saMax = Math.max(saMax, Math.abs(c.refCpiSa - row.refCpiSa));
    factorMax = Math.max(factorMax, Math.abs(Math.round(row.refCpi / row.refCpiSa * 1e5) / 1e5 - row.saFactor));
  }
  ok(s3Compared > 10000, `Ref CPI compare count (${s3Compared})`);
  ok(nsaMax <= TOL, `Ref CPI NSA max diff ${nsaMax.toExponential(3)} > TOL`);
  ok(saMax <= TOL, `Ref CPI SA max diff ${saMax.toExponential(3)} > TOL`);
  ok(factorMax <= TOL, `SA Factor max diff ${factorMax.toExponential(3)} > TOL`);
  console.log(`Ref CPI regression: ${s3Compared} dates, NSA max ${nsaMax.toExponential(3)}, SA max ${saMax.toExponential(3)}, SA Factor max ${factorMax.toExponential(3)}`);

  // ── fillUnreportedMonths: October 2025 was never reported; Treasury's index number for it is 325.604 (§I.B.4(iv)) ──
  ok(fillUnreportedMonths({ '2024-9': 315.301, '2025-9': 324.8, '2025-11': 324.122 })['2025-10'] === 325.604, 'unreported month takes the twelve-month-change number');
  ok(fillUnreportedMonths({ '2025-9': 324.8, '2025-11': 324.122 })['2025-10'] === undefined, 'no twelve-month base, no derived month');

  // ── parseRefCpiRows reads the four columns ──
  {
    const cur = parseRefCpiRows('Ref CPI Date,Ref CPI NSA,Ref CPI SA,SA Factor\n2026-01-01,325.604,325.051,1.00170\n');
    ok(cur[0].date === '2026-01-01' && cur[0].refCpi === 325.604 && cur[0].refCpiSa === 325.051 && cur[0].saFactor === 1.0017, 'parseRefCpiRows reads the four columns');
  }
  // ── 1.13: S3's held Ref CPI NSA is kept, SA is calculated again, the series ends on the first of the month three months after the latest month ──
  {
    const m = {};
    for (let i = 0; i <= 12 * 30 + 4; i++) m[`${1996 + Math.floor((i + 9) / 12)}-${(i + 9) % 12 + 1}`] = 100 + i * 0.1;
    const sa = Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v - 0.5]));
    const held = [{ date: '2026-11-29', refCpi: 99.1 }, { date: '2026-11-30', refCpi: 99.2 }];
    const out = calcSeries(m, sa, { y: 2026, m: 10 }, held);
    const at = d => out.find(r => r.date === d);
    ok(at('2026-11-29').refCpi === 99.1 && at('2026-11-30').refCpi === 99.2, '1.13 keeps the held Ref CPI NSA');
    ok(at('2026-11-30').refCpiSa === refCpiFromMonthly('2026-11-30', sa), '1.13 calculates the Ref CPI SA of a held date');
    ok(at('2026-12-01').refCpi === m['2026-9'] && at('2026-12-01').refCpiSa === sa['2026-9'], '1.13 calculates the first of December as September');
    ok(out[0].date === '1997-01-15', '1.13 starts on 1997-01-15');
    ok(out[out.length - 1].date === '2027-01-01' && out[out.length - 1].refCpi === m['2026-10'], '1.13 ends on 2027-01-01 at the October value');
    ok(Math.abs(at('2026-12-01').saFactor - Math.round(at('2026-12-01').refCpi / at('2026-12-01').refCpiSa * 1e5) / 1e5) < 1e-12, '1.13 SA Factor is NSA over SA');
  }
  // ── 1.17: a date S3 lacks, or states differently, is a mismatch ──
  {
    const mm = compare([{ date: 'd1', refCpi: 1 }, { date: 'd2', refCpi: 2 }, { date: 'd3', refCpi: 3 }], [{ date: 'd1', refCpi: 1 }, { date: 'd2', refCpi: 2.00001 }]);
    ok(mm.length === 2 && mm[0].date === 'd2' && mm[1].date === 'd3' && mm[1].s3 === undefined, '1.17 reports a differing date and a missing date');
    ok(lastDayTwoMonthsAfter(2026, 10) === '2026-12-31' && lastDayTwoMonthsAfter(2026, 11) === '2027-01-31', '1.17 expected end of the range');
  }

  // ── lookupRefCpi edge cases ──
  const sample = retrieved[Math.floor(retrieved.length / 2)];
  ok(lookupRefCpi(retrieved, sample.date) === sample.refCpi, 'exact-date lookup returns that day');
  ok(lookupRefCpi(retrieved, '1900-01-01') === null, 'date before range → null');
  ok(lookupRefCpi(retrieved, '2999-01-01') === null, 'date beyond last published → null');
  ok(lookupRefCpi([], '2026-01-15') === null, 'empty rows → null');

  // ── indexRatio ──
  ok(Math.abs(indexRatio(300, 150, TREASURY_ROUNDING) - 2) < 1e-12, 'indexRatio basic');
  ok(indexRatio(300, 0, TREASURY_ROUNDING) === null, 'indexRatio zero base → null');
  ok(indexRatio(null, 150, TREASURY_ROUNDING) === null, 'indexRatio null refCpi → null');
  ok(indexRatio(300, 0, NO_ROUNDING) === null, 'indexRatio zero base, unrounded → null');
  ok(indexRatio(null, 150, NO_ROUNDING) === null, 'indexRatio null refCpi, unrounded → null');

  // The rounding is required and has exactly two values: no default hides the choice.
  for (const bad of [undefined, null, 'nine', 5]) {
    let threw = false;
    try { indexRatio(300, 150, bad); } catch (_) { threw = true; }
    ok(threw, `indexRatio with rounding ${String(bad)} throws`);
  }

  // Unrounded is the division as it stands; Treasury's rule truncates to six decimals, then rounds to five.
  // 334.14087 / 290.54829 = 1.1500349... (see the truncation regression below)
  const exactRatio = 334.14087 / 290.54829;
  ok(indexRatio(334.14087, 290.54829, NO_ROUNDING) === exactRatio, 'unrounded Index Ratio is the plain quotient');
  ok(indexRatio(334.14087, 290.54829, NO_ROUNDING) !== indexRatio(334.14087, 290.54829, TREASURY_ROUNDING),
     'unrounded and Treasury-rounded Index Ratios differ where the quotient has more than five decimals');

  // ── 31 CFR §356 App. B §I.B.3 worked example (Ref CPI April 1996) ──
  // Ref CPI_Apr1,1996 = CPI_Jan,1996 = 154.40; Ref CPI_May1,1996 = CPI_Feb,1996 = 154.90.
  const cfrMonthly = { '1996-1': 154.40, '1996-2': 154.90 };
  const rcApr15 = refCpiFromMonthly('1996-04-15', cfrMonthly);
  const rcApr16 = refCpiFromMonthly('1996-04-16', cfrMonthly);
  ok(rcApr15 === 154.63333, `CFR example: Ref CPI Apr15,1996 truncate6/round5 → 154.63333 (got ${rcApr15})`);
  ok(rcApr16 === 154.65000, `CFR example: Ref CPI Apr16,1996 → 154.65000 (got ${rcApr16})`);
  ok(indexRatio(rcApr16, rcApr15, TREASURY_ROUNDING) === 1.00011, `CFR example: Index Ratio Apr16,1996 → 1.00011 (got ${indexRatio(rcApr16, rcApr15, TREASURY_ROUNDING)})`);

  // ── Regression: IEEE754 truncation bug reported against 91282CEZ0 (2026-08-27) ──
  // TreasuryDirect's own detail page shows Index Ratio 1.15004 for this CUSIP/date
  // (datedDateRefCpi 290.54829, refCpi 334.14087). The raw quotient truncates cleanly to
  // 1.150035, whose 6th decimal is exactly 5 — a case where multiply/trunc/divide
  // float arithmetic silently lands on 1.1500349999999999 and rounds down to
  // 1.15003 instead of 1.15004. See shared/src/ref-cpi.js truncateThenRound.
  ok(indexRatio(334.14087, 290.54829, TREASURY_ROUNDING) === 1.15004, `truncation regression: 334.14087/290.54829 → 1.15004 (got ${indexRatio(334.14087, 290.54829, TREASURY_ROUNDING)})`);

  // ── Regression: the fix above used a FIXED absolute epsilon, which is ~4 ulps at
  // index-ratio magnitude (~1e6 after scaling, so it worked) but ~0.01 ulps at Ref CPI
  // magnitude (~3e8 after scaling, so it was a no-op) — found by a second review pass
  // (2026-08-27) that recomputed every date in the live RefCPI.csv and got 28 exact
  // mismatches. Worked example, 2019-08-02 (CPI May 2019 = 256.092, Jun 2019 = 256.143,
  // 31-day month): raw = 256.092 + (1/31)*0.051 = 256.093645161290283, which truncates
  // cleanly to 256.093645 — a 6th decimal of exactly 5, so it must round UP to 256.09365
  // (confirmed against the live RefCPI.csv above). The fixed-epsilon version rounded down
  // to 256.09364. A proportional nudge (relative to the scaled magnitude, not a fixed
  // absolute amount) fixes this at every magnitude — see shared/src/ref-cpi.js
  // truncateThenRound.
  const cpiMay2019 = 256.092, cpiJun2019 = 256.143;
  const rc2019Aug02 = cpiMay2019 + (2 - 1) / 31 * (cpiJun2019 - cpiMay2019);
  const irRounded = indexRatio(rc2019Aug02, 1, TREASURY_ROUNDING); // indexRatio(x,1,TREASURY_ROUNDING) applies truncateThenRound to x alone
  ok(irRounded === 256.09365, `magnitude regression: Ref-CPI-scale truncateThenRound(256.093645...) → 256.09365 (got ${irRounded})`);

  // ── saFactorForDate ── (uses the raw CSV-column shape, via the shared parser)
  const saRows = parseCsv(refCpiText); // [{ "Ref CPI Date", "Ref CPI NSA", "Ref CPI SA", "SA Factor" }, ...]
  const midRow = saRows[Math.floor(saRows.length / 2)];
  const midDate = midRow['Ref CPI Date'], midFactor = parseFloat(midRow['SA Factor']);
  // In-range date: must match an exact lookup against the row itself, and be
  // order-independent (reversing the rows must not change the result).
  ok(saFactorForDate(saRows, midDate) === midFactor, 'saFactorForDate exact-date match');
  const reversed = [...saRows].reverse();
  ok(saFactorForDate(reversed, midDate) === midFactor, 'saFactorForDate exact-date match is order-independent');
  // Out-of-range future date (e.g. a synthetic maturity years out): falls back
  // to the most recent past occurrence of the same calendar month/day.
  const mmdd = midDate.slice(5, 10);
  const sameMonthDay = saRows.filter(r => r['Ref CPI Date'].endsWith(`-${mmdd}`)).sort((a, b) => (a['Ref CPI Date'] < b['Ref CPI Date'] ? 1 : -1));
  const mostRecentFactor = parseFloat(sameMonthDay[0]['SA Factor']);
  const futureDate = `2999-${mmdd}`;
  ok(saFactorForDate(saRows, futureDate) === mostRecentFactor, 'saFactorForDate future date falls back to most recent same month/day');
  ok(saFactorForDate(reversed, futureDate) === mostRecentFactor, 'saFactorForDate fallback is order-independent');
  ok(saFactorForDate(saRows, '2999-02-30') === null, 'saFactorForDate month/day never published → null');

  // ── maturitySaFactor / credibilityFactor ──
  // Z is 1 at zero horizon and strictly decreasing in h (drift only grows).
  ok(credibilityFactor(2, 0) === 1, 'credibilityFactor(month, 0) = 1');
  const zSeq = [1, 3, 6, 12, 25].map(h => credibilityFactor(2, h));
  ok(zSeq.every((z, i) => i === 0 || z < zSeq[i - 1]), `Z(h) strictly decreasing in h (${zSeq.map(z => z.toFixed(3))})`);
  ok(zSeq.every(z => z > 0 && z < 1), 'Z(h) in (0,1) for h > 0');
  // Independent recomputation from the published formula Z = A²/(A²+σ²) with the
  // documented amplitude 0.002632 and the Feb σ_drift(30) the module reports.
  const sigFeb30 = seasonalDriftSigma(2, 30);
  const A = 0.002632, zExpected = A * A / (A * A + sigFeb30 * sigFeb30);
  ok(Math.abs(credibilityFactor(2, 30) - zExpected) < 1e-12, `Feb Z(30) matches A²/(A²+σ²) (${zExpected.toFixed(4)})`);
  ok(zExpected > 0.42 && zExpected < 0.50, `Feb Z(30) ≈ 0.45 per 1.1 §5 (got ${zExpected.toFixed(3)})`);
  // A maturity date inside the series is returned exact and unscaled.
  ok(maturitySaFactor(saRows, midDate, midDate) === midFactor, 'maturitySaFactor exact in-series date is unscaled');
  // A future maturity is the substituted factor scaled toward 1.0: strictly
  // between the raw substitution and 1.0, on the same side.
  const rawSub = saFactorForDate(saRows, futureDate);
  const scaled = maturitySaFactor(saRows, futureDate, '2026-09-08');
  const between = (rawSub < 1) ? (scaled > rawSub && scaled < 1) : (scaled < rawSub && scaled > 1);
  ok(rawSub === 1 || between, `maturitySaFactor future date scaled strictly toward 1.0 (raw ${rawSub}, scaled ${scaled.toFixed(6)})`);
  ok(maturitySaFactor(saRows, '2999-02-30', '2026-09-08') === null, 'maturitySaFactor unknown month/day → null');

  console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(err => { console.error(err); process.exit(1); });
