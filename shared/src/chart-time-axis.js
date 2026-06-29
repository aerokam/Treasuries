const DAY_MS = 86400000;
const MONTH_MS = 30.44 * DAY_MS;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Returns the Chart.js time unit appropriate for the given visible span.
// Thresholds match the tick label format rules in YieldsMonitor/knowledge/2.1_Time_Series.md:
//   < 3 days  → 'hour'  (intraday, 2D range)
//   < 90 days → 'day'   (MMM D labels)
//   ≤ 548 days → 'month' (~18 months; MMM YYYY labels)
//   > 548 days → 'year'  (MMM YYYY labels, annual grid)
export function getXTimeUnit(spanMs) {
  const days = spanMs / DAY_MS;
  if (days < 3) return 'hour';
  if (days < 90) return 'day';
  if (days <= 548) return 'month';
  return 'year';
}

// Updates chart's x-axis time.unit based on the current visible span.
// Does NOT call chart.update() — caller is responsible.
// Safe to call on every zoom/pan complete; no-ops if unit is unchanged.
export function applyXTimeUnit(chart) {
  const x = chart.scales.x;
  const spanMs = (chart.options.scales.x.max ?? x.max) - (chart.options.scales.x.min ?? x.min);
  const unit = getXTimeUnit(spanMs);
  chart.options.scales.x.time.unit = unit;
}

// Returns Chart.js x-axis properties for calendar-aligned tick generation.
// Spread into your x-axis config: { type: 'time', time: {...}, ...calendarTimeAxis() }
// The returned object includes afterBuildTicks, ticks, and grid (with tick marks).
//
// Density-driven: always targets ≥ 6 ticks across the visible span by picking
// the largest calendar-aligned interval (from 1 month up to 10 years) that
// still produces at least 6 ticks. All intervals anchor to January so ticks
// land on the same calendar positions every year at every zoom level.
//
// Intervals tried (months): 1, 2, 3, 6, 12, 24, 60, 120
//   1  → every month          (Jan, Feb, Mar …)
//   2  → bi-monthly           (Jan, Mar, May …)
//   3  → quarterly            (Jan, Apr, Jul, Oct)
//   6  → semi-annual          (Jan, Jul)
//   12 → annual               (Jan)
//   24 → bi-annual            (even years)
//   60 → every 5 years
//  120 → every 10 years (decades)
//
// Label format by average tick interval:
//   ≥ 300 days apart → year only ("2014") — only unambiguous when one tick per year
//   25–299 days apart → "MMM YYYY"  ("Apr 2014")
//   < 25 days apart  → "MMM D"     ("Apr 15")  — day-level ticks
export function calendarTimeAxis({ color = '#64748b', font = { size: 11 }, gridColor = 'rgba(100,116,139,0.8)' } = {}) {
  return {
    afterBuildTicks(scale) {
      const { min, max } = scale;
      if (!min || !max || max <= min) return;
      const spanMs = max - min;
      const spanMonths = spanMs / MONTH_MS;
      const ticks = [];

      if (spanMonths < 2) {
        // Day-level ticks
        const spanDays = spanMs / DAY_MS;
        const step = spanDays > 20 ? 7 : spanDays > 7 ? 3 : 1;
        let cur = new Date(new Date(min).getFullYear(), new Date(min).getMonth(), 1);
        while (cur.getTime() <= max) {
          if (cur.getTime() >= min) ticks.push({ value: cur.getTime() });
          cur.setDate(cur.getDate() + step);
        }
      } else {
        // Pick the largest nice interval that still gives ≥ 6 ticks
        const NICE_INTERVALS = [1, 2, 3, 6, 12, 24, 60, 120]; // months
        let intervalMonths = 1;
        for (const iv of NICE_INTERVALS) {
          if (spanMonths / iv >= 6) intervalMonths = iv;
        }

        const y0 = new Date(min).getFullYear();
        const y1 = new Date(max).getFullYear();

        if (intervalMonths >= 12) {
          // Year-step intervals: align to multiples of yearStep
          const yearStep = intervalMonths / 12;
          const alignedY0 = Math.ceil(y0 / yearStep) * yearStep;
          for (let y = alignedY0; y <= y1; y += yearStep) {
            const t = new Date(y, 0, 1).getTime();
            if (t >= min && t <= max) ticks.push({ value: t });
          }
        } else {
          // Sub-annual intervals: step through months, anchored to January
          for (let y = y0; y <= y1; y++) {
            for (let m = 0; m < 12; m += intervalMonths) {
              const t = new Date(y, m, 1).getTime();
              if (t >= min && t <= max) ticks.push({ value: t });
            }
          }
        }
      }

      scale.ticks = ticks;
    },
    grid: {
      color: gridColor,
      drawTicks: true,
      tickColor: '#94a3b8',
      tickLength: 6,
    },
    ticks: {
      autoSkip: false,
      maxRotation: 0,
      color,
      font,
      callback(value, index, ticks) {
        const date = new Date(value);
        const month = date.getMonth();
        if (ticks.length < 2) return `${MONTHS[month]} ${date.getFullYear()}`;
        const spanMs = ticks[ticks.length - 1].value - ticks[0].value;
        const avgIntervalDays = spanMs / (ticks.length - 1) / DAY_MS;
        // Year-only when ticks are ~1 year+ apart (unambiguous: one tick per year)
        if (avgIntervalDays >= 300) return String(date.getFullYear());
        // Day format when ticks are sub-monthly
        if (avgIntervalDays < 25)   return `${MONTHS[month]} ${date.getDate()}`;
        return `${MONTHS[month]} ${date.getFullYear()}`;
      },
    },
  };
}
