# Treasury Investors Portal

The portal is the browser-based entry point to all Treasury investment tools. It links to ten apps and one third-party tool, each focused on a distinct phase of Treasury portfolio management. The apps run in the browser, and no user data is uploaded to any server.

**URL (GH Pages):** `https://aerokam.github.io/Treasuries/`

---

## 1.0 App Catalog

The numbers are the process numbers of [Level 1](/knowledge/DFD_LEVEL1), and the order is the order of the portal index.

| # | App | Folder | Purpose |
|---|-----|--------|---------|
| 2 | Yields Monitor | [YieldsMonitor/](../YieldsMonitor/knowledge/) | Live intraday and historical yield charts for selected maturities, with an optional SA yield overlay for all five TIPS maturities (1Y/2Y/5Y/10Y/30Y) |
| 3 | Yield Curves | [YieldCurves/](../YieldCurves/knowledge/) | Treasury yield curves with seasonal adjustment (SA/SAO) overlays |
| 4 | Ladder Manager | [TipsLadderManager/](../TipsLadderManager/knowledge/) | Design and rebalance TIPS ladders; deep-drill calculation chains |
| 5 | Treasury Auctions | [TreasuryAuctions/](../TreasuryAuctions/knowledge/) | Upcoming and historical auction results with spreadsheet-style filtering |
| 6 | TIPS Reference | [TipsReference/](../TipsReference/knowledge/) | TIPS reference table: CUSIP, maturity, coupon, Dated Date Ref CPI, price, index ratio, adjusted price, yield, term, duration and next coupon |
| 7 | CPI Explorer | [CpiExplorer/](../CpiExplorer/knowledge/) | CPI index levels, YoY/MoM changes, rolling windows, and point-to-point annualized change over any date range |
| 8 | Taxation of Treasuries | [TaxationOfTreasuries/](../TaxationOfTreasuries/) | Reference docs for federal and state tax treatment of Treasury bills, notes, bonds, and TIPS: OID, inflation adjustments, 1099 reconciliation |
| 9 | Fund Holdings | [FundHoldings/](../FundHoldings/knowledge/) | Treasury and TIPS fund holdings by CUSIP, enriched with ask yield, SA and SAO yield, term and duration |
| 10 | Portal Primer | [Primer/](../Primer/knowledge/) | A guided walkthrough of the portal, app by app, with the Treasury and TIPS terminology behind each screen |
| 11 | Seasonal Adjustments | [SeasonalAdjustments/](../SeasonalAdjustments/knowledge/) | Slide deck on TIPS seasonal adjustment and the SA/SAO yield series |
| | After-Tax TIPS Ladder Calculator *(third-party)* | https://motips.pythonanywhere.com/ | After-tax return calculator for TIPS ladders; linked from the portal because it complements the suite but is not a portal app |

---

## 2.0 System Architecture

External sources are read by scheduled jobs (process 1 on Level 1), which write the data stores on Cloudflare R2. The apps read the stores directly from R2 at runtime over public HTTPS URLs, with two exceptions: Yields Monitor reads its market yields and live quotes, and Treasury Auctions its upcoming auctions, straight from the sources. There is no server-side rendering and no authentication.

- The sources and their fields: [Data Dictionary §1.0](./DATA_DICTIONARY.md#1.0-external-entities-e).
- The stores, with R2 keys and live previews: [Data Dictionary §2.0](./DATA_DICTIONARY.md#2.0-data-stores-s).
- Which app reads which store: [Level 1](/knowledge/DFD_LEVEL1) and the Level 2 diagram of each app.
- The ingestion jobs: [Level 2 Ingestion](/knowledge/DFD_LEVEL2_INGESTION) and the process specs 1.1 to 1.15 it links. Each job's schedule is registered in `scripts/setup-windows-tasks.ps1`, and in `scripts/setup-tentative-schedule-task.ps1` for the tentative auction schedule.

<a id="r2-read-access"></a>
### 2.1 R2 Read Access (CORS)

Every app reads the bucket by a browser `fetch()` from `pub-ba11062b177640459f72e0a88d0261ae.r2.dev`. A bucket has no CORS policy until one is configured, and a browser rejects a cross-origin read from a bucket with none. The policy of this bucket is set in the Cloudflare dashboard (R2, the bucket, Settings, CORS Policy); no file in this repository manages it. It allows three origins, each matched literally:

- `http://localhost:8080`, the dev server on the primary checkout
- `http://localhost:8081`, the dev server on a worktree
- `https://aerokam.github.io`, production

Measured 2026-10-26 by sending each origin in an `Origin` header and reading `Access-Control-Allow-Origin`: the three above are echoed, and `http://127.0.0.1:8080` and `http://localhost:8082` receive no header. A page served from any other origin, `127.0.0.1` and any other `localhost` port included, therefore fails every R2 read. Serve pages from `localhost`, never `127.0.0.1`. A third concurrent dev server needs its origin added to the policy first.

---

## 3.0 Shared Knowledge Base

| Document | Scope |
|----------|-------|
| [DATA_DICTIONARY.md](./DATA_DICTIONARY.md) | Canonical definitions for all terms, entities, stores (with R2 keys and live previews), and formulas |
| [Bond_Basics.md](./Bond_Basics.md) | Foundational fixed-income concepts |
| [TIPS_Basics.md](./TIPS_Basics.md) | TIPS mechanics and index ratio arithmetic |
| [Treasury_CUSIP_Reference.md](./Treasury_CUSIP_Reference.md) | CUSIP structure and lookup reference |
| [VERIFICATION_SUITE.md](./VERIFICATION_SUITE.md) | Manual checks of the knowledge map and viewer |
| [Testing.md](./Testing.md) | Automated test suites per app and which ones run before a push |

---

## 4.0 App-Level Knowledge (Internal Specs)

Most apps have a `knowledge/` subdirectory with their own process specs and calculation documentation. TaxationOfTreasuries serves its content directly from `docs/` (the reference MDs are the spec).

| App | Key Specs |
|-----|-----------|
| TipsLadderManager | [Overview](./TipsLadderManager.md) · [1.0 Bond Ladders](../TipsLadderManager/knowledge/1.0_Bond_Ladders.md) · [2.0 TIPS Ladders](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md) · [3.0 Rebalancing](../TipsLadderManager/knowledge/3.0_TIPS_Ladder_Rebalancing.md) · [4.0 Computation](../TipsLadderManager/knowledge/4.0_Computation_Modules.md) · [5.0 UI Schema](../TipsLadderManager/knowledge/5.0_UI_Schema.md) · [6.0 UI Layout](../TipsLadderManager/knowledge/6.0_UI_Layout.md) |
| YieldCurves | [Overview](./YieldCurves.md) · [3.1 Parse sources and calculate yields](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md) · [3.2 Adjust for seasonality](../YieldCurves/knowledge/3.2_Adjust_For_Seasonality.md) · [3.3 Adjust for other effects](../YieldCurves/knowledge/3.3_Adjust_For_Other_Effects.md) · [3.4 Fit spot yield curves](../YieldCurves/knowledge/3.4_Fit_Spot_Yield_Curves.md) · [3.5 Calculate breakeven inflation](../YieldCurves/knowledge/3.5_Calculate_Breakeven_Inflation.md) · [3.6 Calculate bid and ask spreads](../YieldCurves/knowledge/3.6_Calculate_Bid_And_Ask_Spreads.md) · [3.7 Render charts and tables](../YieldCurves/knowledge/3.7_Render_Charts_And_Tables.md) · [Visual Standards](../YieldCurves/knowledge/Visual_Standards.md) |
| YieldsMonitor | [Overview](./YieldsMonitor.md) · [2.1 Assemble range data](../YieldsMonitor/knowledge/2.1_Assemble_Range_Data.md) · [2.2 Read live quotes](../YieldsMonitor/knowledge/2.2_Read_Live_Quotes.md) · [2.3 Calculate day change](../YieldsMonitor/knowledge/2.3_Calculate_Day_Change.md) · [2.4 Adjust for seasonality](../YieldsMonitor/knowledge/2.4_Adjust_For_Seasonality.md) · [2.5 Render time series](../YieldsMonitor/knowledge/2.5_Render_Time_Series.md) · [2.6 Render yield curve snapshots](../YieldsMonitor/knowledge/2.6_Render_Yield_Curve_Snapshots.md) · [2.7 Render breakeven inflation](../YieldsMonitor/knowledge/2.7_Render_Breakeven_Inflation.md) · [Visual Standards](../YieldsMonitor/knowledge/Visual_Standards.md) |
| TreasuryAuctions | [Overview](./TreasuryAuctions.md) · [Level 2](./DFD_LEVEL2_TREASURYAUCTIONS.html) · [Filtering and Columns](../TreasuryAuctions/knowledge/Filtering_And_Columns.md) |
| TipsReference | [Overview](./TipsReference.md) · [Level 2](./DFD_LEVEL2_TIPSREFERENCE.html) |
| CpiExplorer | [Overview](./CpiExplorer.md) · [Level 2](./DFD_LEVEL2_CPIEXPLORER.html) |
| TaxationOfTreasuries | [Foundation](../TaxationOfTreasuries/docs/TaxationOfTreasuries_Foundation.md) · [Treasury Bills](../TaxationOfTreasuries/docs/TaxationOfTreasuryBills.md) · [Notes & Bonds](../TaxationOfTreasuries/docs/TaxationOfTreasuryNotesAndBonds.md) · [TIPS OID Reference](../TaxationOfTreasuries/docs/TIPS_OID_Tax_Reference.md) |
| FundHoldings | [Overview](./FundHoldings.md) · [Level 2](./DFD_LEVEL2_FUNDHOLDINGS.html) |
| Primer | [Overview](./Primer.md) · [Level 2](./DFD_LEVEL2_PRIMER.html) · [1.0 Primer](../Primer/knowledge/1.0_Primer.md) |
| SeasonalAdjustments | [1.0 Seasonal Adjustments Explorer](../SeasonalAdjustments/knowledge/1.0_SeasonalAdjustments_Explorer.md) |
