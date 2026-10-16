// spot-breakeven.test.js — Coverage for shared/src/breakeven.js#spotBreakevenAcrossTerms, the
// breakeven across terms of YieldCurves/knowledge/3.5_Calculate_Breakeven_Inflation.md#across-terms.
// Run: node shared/tests/spot-breakeven.test.js
//
// The rule it pins: the breakeven exists at every Term of the 3.4 grid where the Treasuries
// curve and the TIPS curve both exist, with no minimum Term of its own. The Breakeven tab once
// started its grid at 2 years and fitted its own nominal curve to the Notes and Bonds from a
// minimum Term of 1 year; a test that a point exists below 2 years fails against that behaviour.
//
// The bonds are synthetic and priced off known zero curves, so the expected breakeven comes
// from those curves and not from the code under test.

import { cashflowSchedule } from '../src/bond-math.js';
import { localDate } from '../src/settlement.js';
import { spotCurveFit, zToSA, TREASURIES_SPOT_FIT, TIPS_SA_SPOT_FIT } from '../src/spot-curve.js';
import { spotBreakevenAcrossTerms } from '../src/breakeven.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } };

const SETTLE = '2026-06-26';
const settle = localDate(SETTLE);

// Zero curves the bonds are priced from, decimal, continuously compounded.
const zNominal = t => 0.040 + 0.0020 * t;
const zReal = t => 0.015 + 0.0010 * t;

// A bond maturing `years` after settlement (on the 15th, so the coupon dates are unambiguous).
function bondAt(years, coupon, zCurve) {
  const maturityDate = new Date(settle.getFullYear() + Math.floor(years), settle.getMonth() + Math.round((years % 1) * 12), 15);
  const sch = cashflowSchedule(settle, maturityDate, coupon);
  const dirty = sch.times.reduce((p, t, k) => p + sch.amounts[k] * Math.exp(-zCurve(t) * t), 0);
  const price = dirty - sch.accrued;
  const y = zCurve(years);
  return { coupon, price, yield: y, askYield: y, saRatio: 1, saYield: y, maturityDate, settlementDate: SETTLE };
}

// Treasuries: Bills to 1 year, Notes to 10 years, Bonds to 30.
const treasuries = [
  ...[0.25, 0.5, 0.75].map(y => bondAt(y, 0, zNominal)),
  ...[1, 2, 3, 5, 7, 10].map(y => bondAt(y, 0.04, zNominal)),
  ...[20, 30].map(y => bondAt(y, 0.045, zNominal)),
];
// TIPS: 1 year to 30 years, none shorter.
const tips = [1, 2, 3, 5, 7, 10, 20, 30].map(y => bondAt(y, 0.01, zReal));

const nomFit = spotCurveFit(treasuries, TREASURIES_SPOT_FIT);
const saFit = spotCurveFit(tips, TIPS_SA_SPOT_FIT);
ok(nomFit && saFit, 'both synthetic curves fit');

const bei = spotBreakevenAcrossTerms(nomFit, saFit);
ok(Array.isArray(bei) && bei.length >= 3, 'a breakeven across terms is produced');
const terms = bei.map(p => p.t);

// ── No minimum Term of its own ──────────────────────────────────────────────────
ok(terms.some(t => t < 2), `a breakeven exists below 2 years (terms: ${terms.slice(0, 4).join(', ')} ...)`);
ok(Math.abs(terms[0] - Math.ceil(saFit.tMin * 2) / 2) < 1e-9,
  `the first Term is the first half-year step of the TIPS curve, ${Math.ceil(saFit.tMin * 2) / 2} (got ${terms[0]})`);
ok(nomFit.tMin < saFit.tMin, 'the Treasuries curve starts earlier than the TIPS curve, so the TIPS curve sets the start');

// ── Every Term is a half-year step or a curve's longest Term, where both curves exist ──────
ok(terms.every(t => t >= Math.max(nomFit.tMin, saFit.tMin) - 1e-9 && t <= Math.min(nomFit.tMax, saFit.tMax) + 1e-9),
  'every Term lies where both curves exist');
ok(terms.every(t => Math.abs(t * 2 - Math.round(t * 2)) < 1e-9 || Math.abs(t - nomFit.tMax) < 1e-9 || Math.abs(t - saFit.tMax) < 1e-9),
  'every Term is a half-year step or the longest Term of a curve');
ok(terms.some(t => Math.abs(t - Math.min(nomFit.tMax, saFit.tMax)) < 1e-9),
  'the longest Term of the shorter curve is included');

// ── Each value is the Treasuries Spot Yield less the TIPS SA Spot Yield, semi-annual basis ──
for (const { t, bei: v } of bei) {
  const expected = zToSA(zNominal(t) * 100) - zToSA(zReal(t) * 100);
  ok(Math.abs(v - expected) < 0.05, `Term ${t.toFixed(1)}: breakeven ${v.toFixed(3)} within 0.05 pp of ${expected.toFixed(3)}`);
}

// ── A Term where either value fails the sanity check is omitted ─────────────────
{
  const insaneAt = t => t > 1.2 && t < 1.7;   // the 1.5-year Term only
  const fit = { ...saFit, z: t => (insaneAt(t) ? 1e4 : saFit.z(t)), sane: v => v < 100 };
  const out = spotBreakevenAcrossTerms(nomFit, fit);
  ok(out.length === bei.length - 1, `one Term omitted for a failed sanity check (${out.length} of ${bei.length})`);
  ok(!out.some(p => Math.abs(p.t - 1.5) < 1e-9), 'the Term that failed is the one omitted');
  ok(out.some(p => Math.abs(p.t - 1.0) < 1e-9) && out.some(p => Math.abs(p.t - 2.0) < 1e-9), 'its neighbours are kept');
}

// ── Nothing when a curve is missing or fewer than three Terms remain ────────────
ok(spotBreakevenAcrossTerms(null, saFit) === null, 'no Treasuries curve: no breakeven');
ok(spotBreakevenAcrossTerms(nomFit, null) === null, 'no TIPS curve: no breakeven');
{
  const twoTerms = { z: t => 4, tMin: 1.0, tMax: 1.5, sane: () => true };
  ok(spotBreakevenAcrossTerms(nomFit, twoTerms) === null, 'two Terms where both curves exist: no breakeven');
  const threeTerms = { z: t => 4, tMin: 1.0, tMax: 2.0, sane: () => true };
  const out = spotBreakevenAcrossTerms(nomFit, threeTerms);
  ok(out && out.length === 3, 'three Terms where both curves exist: a breakeven');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
