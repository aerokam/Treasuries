// segment-dara.js -- Shared (build + rebalance) two-segment per-year DARA helpers.
//
// A "split year" partitions a ladder into an LMP (liability-matching portfolio) segment
// [firstYear..splitYear] — the rungs intended to be spent down — and a speculative/heirs
// segment [splitYear+1..lastYear] — longer-maturity TIPS held for yield. These helpers are
// pure range/map operations and are intentionally mode-agnostic: Build can reuse them as-is.
//
// The rebalance-only self-finance solve that computes a segment's "median" DARA lives in
// rebalance-lib.js (it depends on current holdings + net-cash → 0, which Build has no analog for).
// See 3.0 TIPS Ladder Rebalancing § Two-Segment DARA (LMP / Speculative split).

/**
 * Partition [firstYear, lastYear] at splitYear into LMP and speculative year sets.
 * LMP = years <= splitYear; speculative = years > splitYear. When splitYear >= lastYear the
 * whole ladder is LMP and specYears is empty.
 * @returns {{ lmpYears: Set<number>, specYears: Set<number> }}
 */
export function segmentRanges(splitYear, firstYear, lastYear) {
  const lmpYears = new Set();
  const specYears = new Set();
  for (let y = firstYear; y <= lastYear; y++) {
    (y <= splitYear ? lmpYears : specYears).add(y);
  }
  return { lmpYears, specYears };
}

/** Map of every year in `years` (Set or array) → constant `value`. */
export function constantMap(years, value) {
  const m = new Map();
  for (const y of years) m.set(y, value);
  return m;
}

/**
 * Write `segmentMap` into `store` for the segment's `years` only — every other year is left
 * untouched (the no-clobber guarantee that lets one segment be re-derived without disturbing
 * the other). Mutates and returns `store`.
 */
export function applySegmentMap(store, years, segmentMap) {
  for (const y of years) {
    if (segmentMap.has(y)) store.set(y, segmentMap.get(y));
  }
  return store;
}
