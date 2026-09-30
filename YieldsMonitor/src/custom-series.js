// custom-series.js — pure logic for the Time Series charts' Custom range and point markers.
// Spec: knowledge/2.1_Assemble_Range_Data.md (2.1.4), knowledge/2.5_Render_Time_Series.md.

// Most recent days whose Intraday archive (S18) files are read for one-minute bars. Each file is
// ~0.5 MB per symbol per day, so a longer window reads this many of its most recent days and the
// older days stay at the resolution the other sources give them.
export const MAX_ARCHIVE_DAYS = 10;

// A series' points are drawn as markers only while adjacent visible points are at least this many
// pixels apart.
export const MIN_POINT_SPACING_PX = 8;

// Layers one symbol's points for a Custom window, finest resolution first, per Eastern-time day:
//   - a day with one-minute bars takes them and nothing else,
//   - else a day with five-minute bars takes those,
//   - else a day takes its points from `daily` (stored history at daily or coarser resolution).
// Points outside [startMs, endMs) and weekend-dated points are dropped; equal timestamps keep the
// last point given. etDay(date) returns the day's key, isWeekend(date) is truthy for Sat/Sun.
export function layerCustomSeries({ daily = [], fiveMin = [], minute = [], startMs, endMs, etDay, isWeekend }) {
  const inWindow = p => p && p.x && !isNaN(p.x) && +p.x >= startMs && +p.x < endMs && !isWeekend(p.x);
  const minuteBars = minute.filter(inWindow), fiveBars = fiveMin.filter(inWindow), dailyPts = daily.filter(inWindow);
  const minuteDays = new Set(minuteBars.map(p => etDay(p.x)));
  const fiveDays = new Set(fiveBars.map(p => etDay(p.x)).filter(d => !minuteDays.has(d)));
  const byTime = new Map();
  for (const p of dailyPts) { const d = etDay(p.x); if (!minuteDays.has(d) && !fiveDays.has(d)) byTime.set(+p.x, p); }
  for (const p of fiveBars) { if (!minuteDays.has(etDay(p.x))) byTime.set(+p.x, p); }
  for (const p of minuteBars) byTime.set(+p.x, p);
  return [...byTime.values()].sort((a, b) => +a.x - +b.x);
}

// The archive files read for a Custom window: for the most recent MAX_ARCHIVE_DAYS weekdays of the
// window that fall before the live one-minute feed's first day (and before today, which has no
// file yet), the day's own file and the next day's, since bars after the 17:05 snapshot are in the
// next day's file. `weekdays` is the window's weekday dates as 'YYYYMMDD', oldest first;
// `liveFirst` is the live feed's first day ('YYYYMMDD') or null; `nextDate` maps a date to the next.
export function archiveDatesToRead(weekdays, liveFirst, today, nextDate) {
  const wanted = weekdays.filter(d => d < today && (liveFirst == null || d < liveFirst)).slice(-MAX_ARCHIVE_DAYS);
  const dates = new Set();
  for (const d of wanted) { dates.add(d); dates.add(nextDate(d)); }
  return [...dates].filter(d => d < today).sort();
}

// Default bounds for a Custom chart: the first point to one interval (one minute, the finest
// resolution) past the last point. A series whose points share one timestamp gets one minute
// either side, since a scale needs a nonzero span.
export const ONE_INTERVAL_MS = 60000;
export function customBounds(points) {
  if (!points || points.length === 0) return null;
  const first = +points[0].x, last = +points[points.length - 1].x;
  return first === last ? { min: first - ONE_INTERVAL_MS, max: last + ONE_INTERVAL_MS } : { min: first, max: last + ONE_INTERVAL_MS };
}

// Whether markers are drawn: `visibleCount` points fall in a plot area `widthPx` wide.
export function showMarkers(visibleCount, widthPx) {
  return visibleCount > 1 && widthPx / visibleCount >= MIN_POINT_SPACING_PX;
}

// Number of points (sorted by x) with min <= x <= max.
export function countVisible(points, min, max) {
  let lo = 0, hi = points.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (+points[mid].x < min) lo = mid + 1; else hi = mid; }
  const start = lo;
  hi = points.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (+points[mid].x <= max) lo = mid + 1; else hi = mid; }
  return lo - start;
}
