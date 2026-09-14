// breakeven.js -- the nominal Treasury each per-security breakeven is stated against.
// Spec: YieldCurves/knowledge/3.5_Calculate_Breakeven_Inflation.md#breakeven-inflation.
//
// One implementation, imported by the YieldCurves page (YieldCurves/src/app.js) and by the
// acquisition job that publishes S14 (YieldCurves/scripts/updateSpotYieldCurves.js), per the
// no-redundancy directive (projects/CLAUDE.md §2a).

// The nominal Treasury whose maturity date is nearest the given one. The selection is
// unconditional: the smallest absolute difference wins however large that difference is, so a
// TIPS with no nominal maturing near it is still paired. Returns null for an empty set.
export function findClosestNominal(nominals, maturityDate) {
  let best = null, bestDiff = Infinity;
  for (const n of nominals) {
    const diff = Math.abs(n.maturityDate.getTime() - maturityDate.getTime());
    if (diff < bestDiff) { bestDiff = diff; best = n; }
  }
  return best;
}
