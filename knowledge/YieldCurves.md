# Yield Curves (App Overview)

**Yield Curves** draws the Treasury and TIPS yield curves from two sources, the market quotes and the FedInvest prices, with every yield calculated from price. For TIPS it applies two adjustments. The seasonal adjustment removes the predictable seasonal component of CPI. The other adjustment blends each seasonally adjusted yield with a smooth curve fitted to all of them. The app also calculates breakeven inflation, and the bid and ask spreads of the market quotes.

---

## Data flow diagram

Yield Curves is process 3 on [Level 1](/knowledge/DFD_LEVEL1). Its [Level 2 diagram](/knowledge/DFD_LEVEL2_YIELDCURVES) shows the seven processes below, the five data stores that process 3.1 reads, and the flows between the processes, each defined in [Data Dictionary §6.0](./DATA_DICTIONARY.md#6.0-data-flows).

## Process specs

| Process | Spec | What it does |
|---|---|---|
| 3.1 | [Parse sources and calculate yields](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md) | Reads [S1](./DataStores.md#s1), [S4](./DataStores.md#s4), [S7](./DataStores.md#s7), [S12](./DataStores.md#s12) and the bond holidays, and calculates the [TIPS Yields](./DATA_DICTIONARY.md#tips-yields) and the [Treasury Yields](./DATA_DICTIONARY.md#treasury-yields) from price. |
| 3.2 | [Adjust for seasonality](../YieldCurves/knowledge/3.2_Adjust_For_Seasonality.md) | Calculates the [SA Yield](./DATA_DICTIONARY.md#sa-yield) of each TIPS, the yield of its price multiplied by its [SA Price Factor](./DATA_DICTIONARY.md#sa-price-factor). |
| 3.3 | [Adjust for other effects](../YieldCurves/knowledge/3.3_Adjust_For_Other_Effects.md) | Calculates the [SAO Yield](./DATA_DICTIONARY.md#sao-yield), `SAO = w × curve(maturity) + (1 − w) × SA`, where `curve` is a Nelson-Siegel-Svensson fit to the SA yields and `w` is the [SAO Blend Weight](./DATA_DICTIONARY.md#sao-blend-weight), which declines with maturity. |
| 3.4 | [Fit spot yield curves](../YieldCurves/knowledge/3.4_Fit_Spot_Yield_Curves.md) | Fits [Spot Yield](./DATA_DICTIONARY.md#spot-yield) curves to the Treasury prices, the TIPS prices and the TIPS seasonally adjusted prices, and evaluates the published GSW curve. |
| 3.5 | [Calculate breakeven inflation](../YieldCurves/knowledge/3.5_Calculate_Breakeven_Inflation.md) | Subtracts a TIPS yield from a nominal yield, per security and across terms. |
| 3.6 | [Calculate bid and ask spreads](../YieldCurves/knowledge/3.6_Calculate_Bid_And_Ask_Spreads.md) | Subtracts the ask side from the bid side, in yield and in price, for each security quoted on both sides. |
| 3.7 | [Render charts and tables](../YieldCurves/knowledge/3.7_Render_Charts_And_Tables.md) | Draws the view the user selects. |

## Reference specs

- [Visual Standards](../YieldCurves/knowledge/Visual_Standards.md): the rules every chart and table obeys.
- [SA Intuition](../YieldCurves/knowledge/SA_Intuition.md): why a seasonal adjustment applies to TIPS.
- [Canty (2009)](../YieldCurves/knowledge/Canty.md): the paper the seasonal adjustment is derived from.
- [Seasonal Factor Drift](../YieldCurves/knowledge/Seasonal_Factor_Drift.md): the measurement behind the [Credibility Factor](./DATA_DICTIONARY.md#credibility-factor).
- [SAO Residual Analysis](../YieldCurves/knowledge/SAO_Residual_Analysis.md): the evidence for the other adjustment.
- [Data Pipeline](./Data_Pipeline.md): the scheduled jobs that write the data stores.
