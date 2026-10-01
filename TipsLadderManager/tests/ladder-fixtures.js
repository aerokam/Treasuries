// Builds test ladders from the TIPS that are outstanding in the loaded market data, so no test names a
// CUSIP or a maturity year that a real account happens to hold today. A test asks for a role (the
// active lower bracket, the upper bracket, an ordinary year's latest maturity) and gets whatever
// fills it now. A role that cannot be filled throws: a test that quietly shrinks to fewer holdings
// would keep passing while guarding less.
//
// The roles are derived here from the outstanding maturities alone (the structural gap is the run of
// years with no maturity), independent of the engine's own bracket logic, so a test that compares
// the engine's answer to a role is not comparing the engine to itself.

export function ladderRoles(tipsMarketData, settlementDate) {
  const bonds = [...tipsMarketData.entries()]
    .filter(([, b]) => b.maturity && b.maturity > settlementDate)
    .map(([cusip, b]) => ({ cusip, maturity: b.maturity, year: b.maturity.getFullYear(), month: b.maturity.getMonth() + 1 }))
    .sort((a, b) => a.maturity - b.maturity);
  if (!bonds.length) throw new Error('ladderRoles: no outstanding TIPS in the market data');

  const byYear = new Map();
  for (const b of bonds) { if (!byYear.has(b.year)) byYear.set(b.year, []); byYear.get(b.year).push(b); }
  const years = [...byYear.keys()].sort((a, b) => a - b);

  let gap = null;
  for (let i = 0; i + 1 < years.length; i++) {
    if (years[i + 1] - years[i] > 1) { gap = { first: years[i] + 1, last: years[i + 1] - 1 }; break; }
  }
  if (!gap) throw new Error('ladderRoles: the outstanding maturities have no structural gap');

  const last = arr => arr[arr.length - 1];
  return {
    bonds, byYear, gap,
    activeLower: last(byYear.get(gap.first - 1)),
    upper: byYear.get(gap.last + 1)[0],
    ordinaryYears: years.filter(y => y < gap.first - 1),
    // The latest-maturing bond outstanding in a year.
    latestIn(year) {
      const a = byYear.get(year);
      if (!a) throw new Error(`ladderRoles: no TIPS matures in ${year}`);
      return last(a);
    },
    // Every bond outstanding in a year, earliest maturity first.
    allIn(year) {
      const a = byYear.get(year);
      if (!a) throw new Error(`ladderRoles: no TIPS matures in ${year}`);
      return a;
    },
  };
}
