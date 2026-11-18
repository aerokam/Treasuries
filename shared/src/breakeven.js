// breakeven.js -- the two breakeven methods of
// knowledge/1.3.5_Calculate_Breakeven_Inflation.md: the nominal Treasury each
// per-security breakeven is stated against (#breakeven-inflation), and the breakeven across
// terms between two fitted spot curves (#across-terms).
//
// One implementation, imported by the YieldCurves page (YieldCurves/src/app.js) and by the
// acquisition job that publishes S13 and S14 (YieldCurves/scripts/updateYieldCurveDataSets.js), per
// the no-redundancy directive (projects/CLAUDE.md §2a).
import { unionGridTerms, zToSA } from './spot-curve.js';

// The days either side of the nearest Maturity Date within which a nominal Treasury competes on Yield.
export const NOMINAL_WINDOW_DAYS = 5;

// The nominal Treasury a TIPS is stated against: the highest Yield among those whose Maturity Date
// is within NOMINAL_WINDOW_DAYS of the nominal nearest the given date. The nearest is found
// unconditionally, however far it lies, so a TIPS with no nominal maturing near it is still paired.
// Returns null for an empty set.
export function selectNominal(nominals, maturityDate) {
  let nearest = null, bestDiff = Infinity;
  for (const n of nominals) {
    const diff = Math.abs(n.maturityDate.getTime() - maturityDate.getTime());
    if (diff < bestDiff) { bestDiff = diff; nearest = n; }
  }
  if (!nearest) return null;
  const window = NOMINAL_WINDOW_DAYS * 86400000;
  let best = nearest;
  for (const n of nominals) {
    if (Math.abs(n.maturityDate.getTime() - nearest.maturityDate.getTime()) <= window && n.yield > best.yield) best = n;
  }
  return best;
}

// The breakeven across terms: the Spot Yield of the Treasuries curve less the Spot Yield of a
// TIPS curve, each on a semi-annual bond-equivalent basis, at every Term of the grid of 1.3.4
// (every half-year, and the longest Term of each curve) where both curves exist. There is no
// minimum or maximum Term of its own. A Term where either value fails its fit's sanity check is
// omitted.
//
// treasuriesFit, tipsFit   the fits of spot-curve.js#spotCurveFit; null where a curve could not
//                          be fitted
//
// Returns [{ t, bei }] in ascending Term, bei in percentage points, or null when either curve is
// missing or fewer than three Terms remain.
export function spotBreakevenAcrossTerms(treasuriesFit, tipsFit) {
  if (!treasuriesFit || !tipsFit) return null;
  const exists = (fit, t) => t >= fit.tMin - 1e-9 && t <= fit.tMax + 1e-9;
  const points = [];
  for (const t of unionGridTerms([treasuriesFit, tipsFit])) {
    if (!exists(treasuriesFit, t) || !exists(tipsFit, t)) continue;
    const nominal = zToSA(treasuriesFit.z(t));
    const real = zToSA(tipsFit.z(t));
    if (treasuriesFit.sane(nominal) && tipsFit.sane(real)) points.push({ t, bei: nominal - real });
  }
  return points.length >= 3 ? points : null;
}

// The breakeven of the CMT (knowledge/DATA_DICTIONARY.md#breakeven-inflation, the CMT
// construction): at the latest Date that both stores hold, the CMT less the R-CMT at each
// maturity where both are stated.
//
// cmtRows, rcmtRows   rows of ratesAsNumbers() in cmt-rates.js, oldest Date first
//
// Returns { date, points: [{ column, bei }] } in the column order of the R-CMT, bei a decimal,
// or null when no Date is held by both stores or no maturity has both rates.
export function cmtBreakeven(cmtRows, rcmtRows) {
  const cmtByDate = new Map(cmtRows.map(r => [r.date, r]));
  let date = null;
  for (const r of rcmtRows) if (cmtByDate.has(r.date) && (date === null || r.date > date)) date = r.date;
  if (date === null) return null;
  const cmt = cmtByDate.get(date).rates;
  const rcmt = rcmtRows.find(r => r.date === date).rates;
  const points = Object.keys(rcmt)
    .filter(c => rcmt[c] != null && cmt[c] != null)
    .map(c => ({ column: c, bei: cmt[c] - rcmt[c] }));
  return points.length ? { date, points } : null;
}
