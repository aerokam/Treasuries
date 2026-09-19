# Visual Standards and Interaction

**Constrains:** [Render time series (2.5)](./2.5_Render_Time_Series.md), [Render yield curve snapshots (2.6)](./2.6_Render_Yield_Curve_Snapshots.md), [Render breakeven inflation (2.7)](./2.7_Render_Breakeven_Inflation.md)
**Implemented by:** `YieldsMonitor/src/app.js`, `shared/src/chart-keys.js`

Conventions shared across every chart in the app, so each of 2.5, 2.6 and 2.7 states only what is specific to its own tab.

## Timezone and precision

- Every displayed time is Eastern Time.
- Every displayed [Yield](../../knowledge/DATA_DICTIONARY.md#yield) is shown to three decimal places (e.g. `4.321%`).

## Pan and zoom

Every chart, on every tab, supports the same navigation, from `shared/src/chart-keys.js`:

- Mouse wheel: zooms both axes at once.
  - Holding Ctrl: X-axis only.
  - Holding Shift: Y-axis only.
- Click and drag: pans in any direction.
- Keyboard arrows and +/-: pans or zooms around the chart's current center.

## Sync Zoom & Pan

A sidebar toggle, on by default, for the Time Series tab's own charts only — the Yield Curves and Breakeven Inflation tabs each hold a single chart, so there is nothing to synchronize there.

- When on, zooming or panning any one Time Series chart applies the same X-axis (time) window to every other active Time Series chart, so a movement on one is a movement on all of them.
- The Y-axis is never synchronized: each chart keeps its own scale, since two symbols' Yields rarely span the same range.
- A pan additionally carries each other chart's own Y-axis by the same offset the source chart's Y-axis moved by, when that chart has been independently zoomed on Y before — so a synchronized pan does not snap a manually adjusted chart back to its auto-fit bounds.

## Lock Right

A sidebar toggle, off by default, for the Time Series tab. When on, every zoom re-anchors the chart's right edge to the most recent data point, so narrowing the visible window never loses sight of the latest reading.

## Y-axis auto-rescale

Left to itself, a chart's Y-axis snaps to the range of whatever is actually visible in the current X-axis window, rounded to a clean step — not to the full series' own min and max. This keeps the visible Yield movement at maximum resolution as the user pans or zooms, rather than leaving headroom for data currently off-screen. A chart the user has manually zoomed on Y is left alone by this rescale until the user resets it, unless the change is one that alters what is plotted rather than how far it is zoomed (a symbol added or removed, or a Quoted/SA toggle) — such a change always rescales, since a stale manual Y-zoom against newly different data can otherwise clip a line off the visible chart entirely.
