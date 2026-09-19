# Treasury Yields Monitor

A tool for monitoring and charting Treasury and TIPS yields fetched from public chart services.

## Features
- Fetches real-time and historical yield data.
- Supports both Nominal Treasury and TIPS yields.
- Interactive charts with zoom and pan capabilities.
- 2x2 grid view for key maturities (10Y/30Y).
- Optional Seasonally Adjusted (SA) yield overlay for TIPS.

## Disclosure
For personal and educational use only. Data retrieved from public chart services. Yields represent market mid-prices and may vary by provider.

## Architecture
- **appsScripts/**: Contains original Google Apps Scripts used for data fetching.
- **src/**: Browser-based logic for rendering charts and processing data.
- **knowledge/**: Documentation on data sources and calculation methodology.

## Getting Started

To get started, visit the [Treasury Investors Portal](https://aerokam.github.io/Treasuries/) and select the **Yields Monitor** tool, or go directly to the [Yields Monitor URL](https://aerokam.github.io/Treasuries/YieldsMonitor/).

For local development, execute `npx serve .` from the root directory of the `Treasuries` repository and navigate to `http://localhost:8080/YieldsMonitor/`.

## Knowledge Base
- [2.1 Assemble range data](./knowledge/2.1_Assemble_Range_Data.md)
- [2.2 Read live quotes](./knowledge/2.2_Read_Live_Quotes.md)
- [2.3 Calculate day change](./knowledge/2.3_Calculate_Day_Change.md)
- [2.4 Adjust for seasonality](./knowledge/2.4_Adjust_For_Seasonality.md)
- [2.5 Render time series](./knowledge/2.5_Render_Time_Series.md)
- [2.6 Render yield curve snapshots](./knowledge/2.6_Render_Yield_Curve_Snapshots.md)
- [2.7 Render breakeven inflation](./knowledge/2.7_Render_Breakeven_Inflation.md)
- [Visual Standards](./knowledge/Visual_Standards.md): the pan, zoom and rescale rules every chart obeys.
- [API Mapping](./knowledge/API_Mapping.md): the CNBC endpoints and `timeRange` parameters each UI range maps to.
- [Close Price Investigation](./knowledge/Close_Price_Investigation.md): the evidence behind the 17:05 ET session close and CNBC's own ~3 PM daily-close basis.
