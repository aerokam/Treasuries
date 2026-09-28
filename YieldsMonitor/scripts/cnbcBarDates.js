// cnbcBarDates.js — the date a CNBC weekly or quarterly bar's close belongs to.
//
// CNBC's chart-bar feed dates each bar at the START of its period: a weekly bar (5Y feed) is
// stamped Sunday 00:00 ET, a quarterly bar (ALL feed) is stamped the first day of the quarter.
// The bar's `close` is the close of the period's LAST trading day, so the close is dated here at
// that day, not at the label. Verified against the 6M daily feed: for nominal 10Y, 133 of 138
// weekly closes equal the daily close on the label's Friday.
//
// No historical holiday calendar exists in the repo (misc/BondHolidaysSifma.csv covers current
// years only), so a weekly close is dated its Friday and a quarterly close the quarter's last
// weekday. A period that has any finer-resolution date (see updateYieldsHistory.js) takes that
// date instead and never reaches this module.

const MS_DAY = 86400000;

const toUtc = ymd => Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8));
const fromUtc = ms => new Date(ms).toISOString().slice(0, 10).replace(/-/g, '');

export function addDays(ymd, n) { return fromUtc(toUtc(ymd) + n * MS_DAY); }
export function isSunday(ymd) { return new Date(toUtc(ymd)).getUTCDay() === 0; }
export function isQuarterStart(ymd) { return /^\d{4}(01|04|07|10)01$/.test(ymd); }

// Weekly bar labeled Sunday `label` covers Sunday..Saturday; its close is dated that Friday.
export function weeklyPeriod(label) {
  return { start: label, end: addDays(label, 6), closeDate: addDays(label, 5) };
}

// Quarterly bar labeled the first day of a quarter covers the quarter; its close is dated the
// quarter's last weekday.
export function quarterlyPeriod(label) {
  const y = +label.slice(0, 4), m = +label.slice(4, 6);
  const endMs = Date.UTC(y, m + 2, 0); // day 0 of the month after the quarter's last month
  let closeMs = endMs;
  while ([0, 6].includes(new Date(closeMs).getUTCDay())) closeMs -= MS_DAY;
  return { start: label, end: fromUtc(endMs), closeDate: fromUtc(closeMs) };
}

// Merges CNBC's feeds into one {YYYYMMDD: close} map of completed-day closes.
//   existing: the accumulated map already stored (may still hold weekly/quarterly closes dated
//             at their bar's start label by the earlier merge — those are re-dated here)
//   feeds:    { ALL, '5Y', '6M', '3M', '1M' }, each [{ date: YYYYMMDD label, y: close }]
//   todayET:  current Eastern-time day, YYYYMMDD — a bar whose period has not ended is skipped
// Daily feeds are dated as labeled. A weekly (5Y) or quarterly (ALL) close is dated by
// weeklyPeriod/quarterlyPeriod, and only where its period holds no finer-resolution date: a week
// with a daily date is skipped, a quarter with a daily or weekly date is skipped.
export function mergeHistory(existing, feeds, todayET) {
  const stored = { ...existing };
  const weekly = new Map(), quarterly = new Map();

  const allBars = new Map((feeds.ALL || []).filter(b => isQuarterStart(b.date)).map(b => [b.date, b.y]));
  // Daily dates cannot predate the daily feeds' own reach, so a stored quarter-start-labeled
  // point older than it is an old quarterly bar even when the ALL feed no longer reaches it.
  const dailyStart = ['6M', '3M', '1M'].flatMap(r => (feeds[r] || []).map(b => b.date)).sort()[0];
  for (const date of Object.keys(stored)) {
    if (isSunday(date)) { weekly.set(date, stored[date]); delete stored[date]; }
    else if (isQuarterStart(date) && (allBars.get(date) === stored[date] || (dailyStart && date < dailyStart))) { quarterly.set(date, stored[date]); delete stored[date]; }
  }
  for (const b of feeds['5Y'] || []) if (isSunday(b.date)) weekly.set(b.date, b.y);
  for (const [date, y] of allBars) quarterly.set(date, y);

  const merged = stored;
  for (const range of ['6M', '3M', '1M']) {
    for (const b of feeds[range] || []) if (b.date < todayET) merged[b.date] = b.y;
  }

  const place = (cands, periodOf) => {
    for (const label of [...cands.keys()].sort()) {
      const { start, end, closeDate } = periodOf(label);
      if (end >= todayET) continue;
      if (Object.keys(merged).some(d => d >= start && d <= end)) continue;
      merged[closeDate] = cands.get(label);
    }
  };
  place(weekly, weeklyPeriod);
  place(quarterly, quarterlyPeriod);
  return merged;
}
