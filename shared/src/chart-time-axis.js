const DAY_MS = 86400000;

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
