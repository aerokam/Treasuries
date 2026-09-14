# YieldCurves: TIPS Seasonal Adjustments

A browser-based tool for analyzing **Seasonally Adjusted (SA)** and **SA Other-adjusted (SAO)** TIPS yields. This project helps identify "cheap" or "rich" spots on the TIPS curve by removing predictable seasonal inflation noise.

## Features
- **Interactive Yield Curve**: Compare Market Ask, SA, and SAO yields.
- **Broker Integration**: Upload Schwab or Fidelity CSVs to see your own quotes adjusted.
- **Drill-down Transparency**: Click any SA yield to see the exact multiplicative factor and adjustment math.
- **SAO Trend Fitting**: See the institutional view of the yield curve via backwards-anchored linear regression.

## Getting Started
To get started, visit the [Treasury Investors Portal](https://aerokam.github.io/Treasuries/) and select the **YieldCurves** tool, or go directly to the [YieldCurves URL](https://aerokam.github.io/Treasuries/YieldCurves/).

## Local Development
For local development, execute `npx serve .` from the root directory of the `Treasuries` repository and navigate to `http://localhost:8080/YieldCurves/`. (Note: Root serving is required for shared components).

## Knowledge Base
- [3.1 Parse sources and calculate yields](./knowledge/3.1_Parse_Sources_And_Calculate_Yields.md)
- [3.2 Adjust for seasonality](./knowledge/3.2_Adjust_For_Seasonality.md)
- [3.3 Adjust for other effects](./knowledge/3.3_Adjust_For_Other_Effects.md)
- [3.4 Fit spot yield curves](./knowledge/3.4_Fit_Spot_Yield_Curves.md)
- [3.5 Calculate breakeven inflation](./knowledge/3.5_Calculate_Breakeven_Inflation.md)
- [3.6 Calculate bid and ask spreads](./knowledge/3.6_Calculate_Bid_And_Ask_Spreads.md)
- [3.7 Render charts and tables](./knowledge/3.7_Render_Charts_And_Tables.md)
- [Visual Standards](./knowledge/Visual_Standards.md): the rules every chart and table obeys.
- [SA Intuition](./knowledge/SA_Intuition.md): why a seasonal adjustment applies to TIPS.
