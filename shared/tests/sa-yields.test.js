// sa-yields.test.js — Coverage for the working values of the SA Yield
// (YieldCurves/knowledge/3.2_Adjust_For_Seasonality.md): shared/src/ref-cpi.js#naiveMaturitySaFactor,
// #maturitySaFactors and #maturitySaFactor, and shared/src/sa-yields.js#saYieldsFromTipsYields,
// which exposes the Settlement Date SA Factor, the Naive Maturity SA Factor, the Maturity SA
// Factor, the SA Price Factor and the SA Price beside the SA Yield.
// Run: node shared/tests/sa-yields.test.js
//
// Deterministic: the S4 rows are written here, nothing is fetched.

import { naiveMaturitySaFactor, maturitySaFactors, maturitySaFactor, saFactorForDate, credibilityFactor } from '../src/ref-cpi.js';
import { saYieldsFromTipsYields } from '../src/sa-yields.js';
import { tipsYieldsFromPrices } from '../src/tips-yields.js';
import { yieldFromPrice } from '../src/bond-math.js';
import { localDate } from '../src/settlement.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } };
const near = (a, b, tol = 1e-12) => Math.abs(a - b) < tol;

const SETTLE = '2026-06-26';
// S4: the SA Factor of two earlier cycles of July 15, the settlement date, and one published
// maturity date (2027-01-15) that a TIPS can mature on.
const S4 = [
  { 'Ref CPI Date': '2024-07-15', 'SA Factor': '0.99700' },
  { 'Ref CPI Date': '2025-07-15', 'SA Factor': '0.99800' },
  { 'Ref CPI Date': '2026-06-26', 'SA Factor': '1.00200' },
  { 'Ref CPI Date': '2027-01-15', 'SA Factor': '0.99900' },
];

// ── ref-cpi.js: the Naive Maturity SA Factor, once ──
{
  ok(naiveMaturitySaFactor(S4, '2027-01-15') === 0.999, 'naive: S4 holds the Maturity Date, its exact value');
  ok(naiveMaturitySaFactor(S4, '2030-07-15') === 0.998, 'naive: otherwise the same month and day from the most recent completed cycle');
  ok(naiveMaturitySaFactor(S4, '2030-07-15') === saFactorForDate(S4, '2030-07-15'), 'naive is the look-up of the same calendar month and day');
  ok(naiveMaturitySaFactor(S4, '2030-03-01') === null, 'naive: a month and day S4 never holds gives null');
}

// ── S4 holds the Maturity Date: the Naive and Maturity SA Factors are the same exact value ──
{
  const f = maturitySaFactors(S4, '2027-01-15', SETTLE);
  ok(f.naive === 0.999 && f.maturity === 0.999, 'in-series maturity: Naive and Maturity SA Factor are both the exact value');
  ok(maturitySaFactor(S4, '2027-01-15', SETTLE) === 0.999, 'maturitySaFactor of an in-series maturity is unscaled');
}

// ── S4 does not hold the Maturity Date, w(h) < 1: the Maturity SA Factor is the naive value scaled toward 1.0 ──
{
  const f = maturitySaFactors(S4, '2030-07-15', SETTLE);
  const h = (Date.parse('2030-07-15') - Date.parse(SETTLE)) / (365.2425 * 86400000);
  const w = credibilityFactor(7, h);
  ok(w > 0 && w < 1, `Credibility Factor below 1 at ${h.toFixed(2)} years (${w.toFixed(4)})`);
  ok(f.naive === 0.998, 'projected maturity: naive value is the most recent cycle');
  ok(near(f.maturity, 1 + (0.998 - 1) * w), 'projected maturity: Maturity SA Factor is 1 + (naive - 1) x w(h)');
  ok(f.maturity > f.naive && f.maturity < 1, 'projected maturity: scaled strictly toward 1.0, and not equal to the naive value');
  ok(maturitySaFactor(S4, '2030-07-15', SETTLE) === f.maturity, 'maturitySaFactor returns the Maturity SA Factor of maturitySaFactors');
  ok(maturitySaFactors(S4, '2030-03-01', SETTLE) === null && maturitySaFactor(S4, '2030-03-01', SETTLE) === null,
    'a month and day S4 never holds gives null for both');
}

// ── sa-yields.js: the working values beside the SA Yield ──
const tipsRow = (cusip, maturity, price) => ({ cusip, coupon: '0.01', maturity, price: String(price), settlementDate: SETTLE });
{
  const yields = tipsYieldsFromPrices([tipsRow('A', '2030-07-15', 100.125), tipsRow('B', '2027-01-15', 99.5)], null, false, null);
  const out = saYieldsFromTipsYields(yields, S4);
  const a = out.find(b => b.cusip === 'A'), b = out.find(x => x.cusip === 'B');

  ok(a.saSettleFactor === 1.002, 'Settlement Date SA Factor is the exact value for the settlement date');
  ok(a.saNaiveMaturityFactor === 0.998, 'projected maturity: Naive Maturity SA Factor');
  ok(near(a.saMaturityFactor, maturitySaFactor(S4, '2030-07-15', SETTLE)), 'projected maturity: Maturity SA Factor is the one maturitySaFactor gives');
  ok(a.saMaturityFactor !== a.saNaiveMaturityFactor, 'projected maturity: Maturity SA Factor differs from the Naive Maturity SA Factor');
  ok(a.saRatio === a.saSettleFactor / a.saMaturityFactor, 'SA Price Factor is the Settlement Date SA Factor over the Maturity SA Factor');
  ok(a.saPrice === a.price * a.saRatio, 'SA Price is the Price times the SA Price Factor');
  ok(a.saYield === yieldFromPrice(a.saPrice, a.coupon, localDate(SETTLE), a.maturityDate), 'the SA Yield is the yield of the SA Price');

  ok(b.saNaiveMaturityFactor === 0.999 && b.saMaturityFactor === 0.999, 'in-series maturity: Naive and Maturity SA Factor are the same exact value');
  ok(near(b.saRatio, 1.002 / 0.999), 'in-series maturity: SA Price Factor is settlement over the exact maturity value');
  ok(near(b.saPrice, 99.5 * (1.002 / 0.999)), 'in-series maturity: SA Price');

  ok(out.every((r, i) => r.cusip === yields[i].cusip), 'same securities in the same order');
}

// ── SA Factors that could not be read, or a month and day S4 never holds ──
{
  const yields = tipsYieldsFromPrices([tipsRow('A', '2030-07-15', 100)], null, false, null);
  for (const rows of [null, []]) {
    const [r] = saYieldsFromTipsYields(yields, rows);
    ok(Number.isNaN(r.saRatio) && Number.isNaN(r.saYield) && Number.isNaN(r.saPrice), 'no SA Factors: no SA Price Factor, SA Price or SA Yield');
    ok(Number.isNaN(r.saSettleFactor) && Number.isNaN(r.saNaiveMaturityFactor) && Number.isNaN(r.saMaturityFactor), 'no SA Factors: every working value is NaN');
    ok(r.askYield === yields[0].askYield, 'the Ask Yield is untouched');
  }
  const noMonthDay = tipsYieldsFromPrices([tipsRow('A', '2030-03-01', 100)], null, false, null);
  const [r] = saYieldsFromTipsYields(noMonthDay, S4);
  ok(r.saSettleFactor === 1.002 && Number.isNaN(r.saNaiveMaturityFactor) && Number.isNaN(r.saMaturityFactor),
    'a maturity month and day S4 never holds: the Settlement Date SA Factor is kept, the maturity factors are NaN');
  ok(Number.isNaN(r.saRatio) && Number.isNaN(r.saYield) && Number.isNaN(r.saPrice), 'a maturity month and day S4 never holds: no SA Yield');
}

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
