# Yields Monitor (App Overview)

**Yields Monitor** tracks Treasury and TIPS yields intraday and historically, for whichever maturities the user selects. Every range reads a different combination of a live CNBC feed and a stored baseline; the app calculates each symbol's day-over-day change and, for TIPS, a Seasonally Adjusted yield, and renders three views: individual time-series charts, a yield curve snapshot, and breakeven inflation.

---

## Data flow diagram

Yields Monitor is process 2 on [Level 1](/knowledge/DFD_LEVEL1). Its [Level 2 diagram](/knowledge/DFD_LEVEL2_YIELDSMONITOR) shows the seven processes below, the five data stores and two external entities it reads, and the flows between the processes, each defined in [Data Dictionary §6.4](./DATA_DICTIONARY.md#6.4-yields-monitor).

## Process specs

| Process | Spec | What it does |
|---|---|---|
| 2.1 | [Assemble range data](../YieldsMonitor/knowledge/2.1_Assemble_Range_Data.md) | Builds each symbol's [Yield Series](./DATA_DICTIONARY.md#yield-series) for the active range, from [Yield history (S6)](./DataStores.md#s6), [Intraday archive (S18)](./DataStores.md#s18) and CNBC's live feed, in whichever combination the range calls for. |
| 2.2 | [Read live quotes](../YieldsMonitor/knowledge/2.2_Read_Live_Quotes.md) | Reads every symbol's live Yield and prior close from CNBC's quote service, and today's real bond behind each Seasonally Adjusted TIPS symbol. |
| 2.3 | [Calculate day change](../YieldsMonitor/knowledge/2.3_Calculate_Day_Change.md) | Calculates the [Day Change](./DATA_DICTIONARY.md#day-change): the current Yield less the prior trading day's 17:05 ET close. |
| 2.4 | [Adjust for seasonality](../YieldsMonitor/knowledge/2.4_Adjust_For_Seasonality.md) | Carries each TIPS symbol's Yield Series through the same Price → SA Price → SA Yield transform Yield Curves applies to an actual TIPS. |
| 2.5 | [Render time series](../YieldsMonitor/knowledge/2.5_Render_Time_Series.md) | Draws one chart per checked symbol, and the sidebar readings for every symbol. |
| 2.6 | [Render yield curve snapshots](../YieldsMonitor/knowledge/2.6_Render_Yield_Curve_Snapshots.md) | Draws the TIPS and Nominal curves at the start and end of the active range. |
| 2.7 | [Render breakeven inflation](../YieldsMonitor/knowledge/2.7_Render_Breakeven_Inflation.md) | Draws the breakeven curve, nominal Yield less TIPS Yield, at five maturity pairs. |

## Reference specs

- [Visual Standards](../YieldsMonitor/knowledge/Visual_Standards.md): the pan, zoom and rescale rules every chart obeys.
- [API Mapping](../YieldsMonitor/knowledge/API_Mapping.md): the CNBC endpoints and `timeRange` parameters each UI range maps to.
- [Close Price Investigation](../YieldsMonitor/knowledge/Close_Price_Investigation.md): the evidence behind the 17:05 ET session close and CNBC's own ~3 PM daily-close basis.
- [Data Pipeline](./Data_Pipeline.md): the scheduled jobs that write the data stores.
