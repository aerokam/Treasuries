# Visual Standards and Interaction

**Constrains:** [Render time series (2.5)](./2.5_Render_Time_Series.md), [Render yield curve snapshots (2.6)](./2.6_Render_Yield_Curve_Snapshots.md), [Render breakeven inflation (2.7)](./2.7_Render_Breakeven_Inflation.md)
**Implemented by:** `YieldsMonitor/src/app.js`, `shared/src/chart-keys.js`

Conventions of every chart in the app.

## Timezone and precision

- Every displayed time is Eastern Time.
- Every displayed [Yield](../../knowledge/DATA_DICTIONARY.md#yield) is shown to three decimal places (e.g. `4.321%`), in the sidebar and on the chart axes.
- Every Yield in a chart tooltip is shown to two decimal places (e.g. `4.32%`).

## Pan and zoom

Every chart, on every tab, supports the same navigation, from `shared/src/chart-keys.js`:

- Mouse wheel: zooms both axes at once.
  - Holding Ctrl: X-axis only.
  - Holding Shift: Y-axis only.
- Click and drag: pans in any direction.
- Keyboard arrows pan the chart by 10% of its visible span, and the + and - keys zoom it.

## Data point markers

Every Time Series chart draws each point of its series as a marker of radius 2.5 px while adjacent visible points are at least 8 px apart across the plot area, and draws only the line otherwise. The decision is made again on every update, so a zoom or pan that widens the spacing of the points shows the markers and one that narrows it hides them. A series may draw 8 px past the plot area's right edge, so the marker of a point at that edge is drawn whole. Implemented by `YieldsMonitor/src/custom-series.js#showMarkers`.

## Time Series chart options

Sync Zoom & Pan, Lock Right and Hide non-trading hours are three checkboxes in one sidebar group, in that order, for the charts of the Time Series tab.

### Sync Zoom & Pan

On by default. The Yield Curves and Breakeven Inflation tabs each hold a single chart, so there is nothing to synchronize there.

- When on, zooming or panning one Time Series chart applies the same X-axis (time) window to every other active Time Series chart.
- A zoom of the Y-axis of one chart applies the same zoom factor to the Y-axis of every other chart.
- A pan that moves the Y-axis of one chart by an offset moves the Y-axis of every other chart by the same offset.
- Otherwise each chart keeps its Y-axis scale, which refits to the visible points unless the chart was zoomed on Y.

### Lock Right

Off by default. When on, every zoom keeps the right edge of the chart at the latest point, so narrowing the visible window keeps the latest reading in view. With Hide non-trading hours on, the latest reading is the latest point drawn, the last one inside trading hours, and the window's width is held as drawn, so a zoom never moves the window onto hours that are not shown.

### Hide non-trading hours

On by default; applies to the 2D, 10D and Custom ranges only, and has no effect on any other range. See [Render time series (2.5)](./2.5_Render_Time_Series.md#hide-non-trading-hours-2d-10d-and-custom-ranges-only).

## Y-axis auto-rescale

The Y-axis of a chart fits the points visible in the current X-axis window, with bounds rounded to a step, so the visible Yield movement fills the chart as the user pans or zooms. A chart that the user zoomed on Y keeps its Y-axis until the user resets it, except after a change of what is plotted (a symbol added or removed, or a change of the Quoted or Seasonally Adjusted checkbox), which refits it, because the earlier zoom can clip the new line out of the chart.
