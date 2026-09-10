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
- **[1.0 Seasonal Adjustments](./knowledge/1.0_Seasonal_Adjustments.md)**: The core multiplicative transform logic.
- **[2.0 SAO Adjustment](./knowledge/2.0_SAO_Adjustment.md)**: Smoothing of non-seasonal deviations, and the curve fit behind it.
- **[2.1 SA Intuition](./knowledge/2.1_SA_Intuition.md)**: Conceptual intuition behind the SA ratio.
- **[3.0 Visual Standards](./knowledge/3.0_Visual_Standards.md)**: Charting and UI conventions.
