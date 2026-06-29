# Treasury Investors Portal

The portal is the browser-based entry point to all Treasury investment tools. It links to eight standalone apps plus one third-party tool, each focused on a distinct phase of Treasury portfolio management. All portal apps run privately in the browser; no user data is uploaded to any server.

**URL (GH Pages):** `https://aerokam.github.io/Treasuries/`

---

## 1.0 App Catalog (A)

| ID | App | Folder | Purpose |
|----|-----|--------|---------|
| A1 | Ladder Manager | [TipsLadderManager/](../TipsLadderManager/knowledge/) | Design and rebalance TIPS ladders; deep-drill calculation chains |
| A2 | Yield Curves | [YieldCurves/](../YieldCurves/knowledge/) | Treasury yield curves with seasonal adjustment (SA/SAO) overlays |
| A3 | Yields Monitor | [YieldsMonitor/](../YieldsMonitor/knowledge/) | Live intraday and historical yield charts for selected maturities |
| A4 | Treasury Auctions | [TreasuryAuctions/](../TreasuryAuctions/knowledge/) | Upcoming and historical auction results with spreadsheet-style filtering |
| A5 | TIPS Reference | [TipsReference/](../TipsReference/knowledge/) | Live TIPS reference table: CUSIP, maturity, coupon, Dated Date Ref CPI, price, index ratio, adjusted price, and yield |
| A6 | CPI Explorer | [CpiExplorer/](../CpiExplorer/knowledge/) | CPI index levels, YoY/MoM changes, rolling windows, and CAGR over any date range |
| A7 | Taxation of Treasuries | [TaxationOfTreasuries/](../TaxationOfTreasuries/) | Reference docs for federal and state tax treatment of Treasury bills, notes, bonds, and TIPS — OID, inflation adjustments, 1099 reconciliation |
| A8 | Seasonal Adjustments | [SeasonalAdjustments/](../SeasonalAdjustments/knowledge/) | Interactive explainer for TIPS seasonal adjustment and the SA/SAO yield series |
| A9 | After-Tax TIPS Ladder Calculator *(third-party)* | https://motips.pythonanywhere.com/data-entry/ | After-tax return calculator for TIPS ladders; linked from the portal because it complements the suite but is not a portal app |

---

## 2.0 System Architecture

```
External Sources (E)  →  Ingestion Jobs (P)  →  Cloudflare R2 (S)  →  Browser Apps (A)
     E1–E6                 GH Actions /               S1–S8                 A1–A8
                         Local Tasks (Win)
```

All apps fetch data directly from Cloudflare R2 at runtime using public HTTPS URLs. No server-side rendering; no authentication.

---

## 3.0 Data Store Assignments (S → A)

| Data Store | File | Primary Consumer(s) |
|------------|------|---------------------|
| [S1](./DataStores.md#s1) | YieldsFromFedInvestPrices.csv | A1 (ladder pricing), A2 (yield curves) |
| [S2](./DataStores.md#s2) | TipsRef.csv | A1 (TIPS metadata) |
| [S3](./DataStores.md#s3) | RefCPI.csv | A1 (index ratio), A5 (daily Ref CPI series) |
| [S4](./DataStores.md#s4) | RefCpiNsaSa.csv | A2 (SA factor computation) |
| [S5](./DataStores.md#s5) | Auctions.csv | A4 (historical auction data) |
| [S6](./DataStores.md#s6) | YieldHistory/ | A3 (historical yield time series) |
| [S7a/b](./DataStores.md#s7a) | FidelityQuotes | A2 (broker bid/ask quotes) |
| [S8](./DataStores.md#s8) | CPI_history.csv | A5 (full monthly CPI history 1913+) |

---

## 4.0 External Entities (E)

All definitions are canonical in the [Data Dictionary](./DATA_DICTIONARY.md#1.0-external-entities-e).

| ID | Source | Consumed By |
|----|--------|-------------|
| [E1](./DATA_DICTIONARY.md#e1) | FedInvest | A1, A2 |
| [E2](./DATA_DICTIONARY.md#e2) | TreasuryDirect SecIndex | A1, A5 |
| [E3](./DATA_DICTIONARY.md#e3) | FiscalData API | A4 |
| [E4](./DATA_DICTIONARY.md#e4) | BLS Public API | A2 (SA), A5 (CPI history) |
| [E5](./DATA_DICTIONARY.md#e5) | CNBC GraphQL | A3 |
| [E6](./DATA_DICTIONARY.md#e6) | Fidelity Fixed Income | A2 |

---

## 5.0 Ingestion Pipeline

See [Data_Pipeline.md](./Data_Pipeline.md) for schedules, owners, and script paths.

---

## 6.0 Shared Knowledge Base

| Document | Scope |
|----------|-------|
| [DATA_DICTIONARY.md](./DATA_DICTIONARY.md) | Canonical definitions for all terms, entities, stores, and formulas |
| [DataStores.md](./DataStores.md) | R2 file schemas and live preview links |
| [Data_Pipeline.md](./Data_Pipeline.md) | Ingestion job schedules and ownership |
| [Bond_Basics.md](./Bond_Basics.md) | Foundational fixed-income concepts |
| [TIPS_Basics.md](./TIPS_Basics.md) | TIPS mechanics and index ratio arithmetic |
| [Treasury_CUSIP_Reference.md](./Treasury_CUSIP_Reference.md) | CUSIP structure and lookup reference |
| [VERIFICATION_SUITE.md](./VERIFICATION_SUITE.md) | Setup checks and data validation procedures |
| [Admin_Dashboard.md](./Admin_Dashboard.md) | Local monitoring dashboard for pipeline health |

---

## 7.0 App-Level Knowledge (Internal Specs)

Most apps have a `knowledge/` subdirectory with their own DFD, process specs, and calculation documentation. TaxationOfTreasuries serves its content directly from `docs/` (the reference MDs are the spec).

| App | Key Specs |
|-----|-----------|
| TipsLadderManager | [1.0 Bond Ladders](../TipsLadderManager/knowledge/1.0_Bond_Ladders.md) · [2.0 TIPS Ladders](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md) · [3.0 Rebalancing](../TipsLadderManager/knowledge/3.0_TIPS_Ladder_Rebalancing.md) · [4.0 Computation](../TipsLadderManager/knowledge/4.0_Computation_Modules.md) · [5.0 UI Schema](../TipsLadderManager/knowledge/5.0_UI_Schema.md) |
| YieldCurves | [1.0 Seasonal Adjustments](../YieldCurves/knowledge/1.0_Seasonal_Adjustments.md) · [2.0 SAO Adjustment](../YieldCurves/knowledge/2.0_SAO_Adjustment.md) · [3.0 Visual Standards](../YieldCurves/knowledge/3.0_Visual_Standards.md) |
| YieldsMonitor | [1.0 Operation](../YieldsMonitor/knowledge/1.0_Operation.md) |
| TreasuryAuctions | [Data Pipeline](../TreasuryAuctions/knowledge/Data_Pipeline.md) |
| CpiExplorer | [1.0 Overview](../CpiExplorer/knowledge/1.0_Overview.md) · [2.0 Technical Spec](../CpiExplorer/knowledge/2.0_Technical_Spec.md) |
| SeasonalAdjustments | [knowledge/](../SeasonalAdjustments/knowledge/) *(self-contained interactive explainer; see knowledge dir for details)* |
| TaxationOfTreasuries | [Foundation](../TaxationOfTreasuries/docs/TaxationOfTreasuries_Foundation.md) · [Treasury Bills](../TaxationOfTreasuries/docs/TaxationOfTreasuryBills.md) · [Notes & Bonds](../TaxationOfTreasuries/docs/TaxationOfTreasuryNotesAndBonds.md) · [TIPS OID Reference](../TaxationOfTreasuries/docs/TIPS_OID_Tax_Reference.md) |
