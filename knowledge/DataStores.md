# System Data Stores (S)

This document provides the operational details for every data store: R2 key, writer, schedule and readers. Each entry's heading links to that store's field-by-field composition, defined once in the Data Dictionary — the composition is not restated here.

---

## <a id="s1"></a>[FedInvest prices (S1)](./DATA_DICTIONARY.md#s1)
**File**: `YieldsFromFedInvestPrices.csv`
**R2 Key**: `Treasuries/YieldsFromFedInvestPrices.csv`
**Description**: The [Settlement Date](./DATA_DICTIONARY.md#settlement-date) of the day's FedInvest prices, then each TIPS and each market-based bill, note and bond with one price and the yield of that price.
**Written by**: [1.1 Download FedInvest prices and calculate yields](./1.1_Download_FedInvest_Prices.md).
**Update Frequency**: Weekdays ~1:05 PM ET ([Data Pipeline](./Data_Pipeline.md)).
**Read by**: YieldCurves ([3.1.1](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#parse-fedinvest-prices)), the yield curves job (process 1.3), Treasury Primer, and TipsLadderManager and TipsReference when the FedInvest source is selected ([3.1 Data Pipeline §4.0](../TipsLadderManager/knowledge/3.1_Data_Pipeline.md)).

**Live Data**: [View Preview (Toggles Table)](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/YieldsFromFedInvestPrices.csv)

---

## <a id="s2"></a>TIPS reference data (S2)
**Description**: Immutable TIPS metadata fetched from FiscalData.
**Written by**: [1.6 Fetch TIPS reference data](./1.6_Fetch_TIPS_Reference_Data.md).
**Update Frequency**: Weekly (or on-demand for new auctions).
**R2 Key**: `TIPS/TipsRef.csv`.

The old `Treasuries/TipsRef.csv` key was consolidated away (see `R2_Cleanup.md`) but the stale object was never deleted from R2 — it is frozen at 2026-07-13 and must not be read.

| Field | Type | Description |
|---|---|---|
| `CUSIP` | String | 9-character security identifier. |
| `Maturity` | Date | Maturity date. |
| `DatedDate` | Date | The dated date (start of interest accrual). |
| `Coupon` | Number | The fixed real coupon rate. |
| `DatedDateRefCpi` | Number | The Ref CPI on the Dated Date. |
| `Term` | String | Original issuance term (5-year, 10-year, 30-year). |

**Live Data**: [View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/TIPS/TipsRef.csv)

---

## <a id="s3"></a>Ref CPI (S3)
**File**: `RefCPI.csv`
**Description**: Daily Reference CPI, retrieved from TreasuryDirect SecIndex (E2), 1997-01-15 (the first TIPS ever issued) to present. Ref CPI is market-wide — identical across every outstanding CUSIP on a given date — so the file is one continuous series regardless of which CUSIP's SecIndex query produced each row.
**Written by**: `scripts/fetchRefCpi.js`.
- `--build`: one-shot historical bootstrap, never scheduled. Merges two CUSIPs whose SecIndex windows together cover the full range with no gap: `9128272M3` (the first TIPS issued, matured 2007-01-15, still queryable) and `912810FD5` (matures 2028-04-15). Run by hand only if the file ever needs to be rebuilt from scratch.
- `--append`: what the scheduled task actually runs. Picks the currently-outstanding TIPS with the latest maturity date (from [TIPS reference data (S2)](#s2)) fresh each run — no hardcoded CUSIP to swap out as one matures — fetches its SecIndex series, and merges any new dates into the existing file.
**Update Frequency**: Monthly (on BLS release, `run-ref-cpi.cmd` → `fetchRefCpi.js --append`).

| Field | Type | Description |
|---|---|---|
| `Date` | Date | The specific date for the RefCPI value. |
| `RefCPI` | Number | Reference CPI, truncate-6/round-5 per 31 CFR §356 App. B §I.B.3. |

**Sort order**: Ascending by date.

**Live Data**: [View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/TIPS/RefCPI.csv)

---

## <a id="s4"></a>Ref CPI NSA and SA (S4)
**Description**: Daily interpolated Reference CPI (NSA and SA) derived from monthly BLS CPI-U data via 31 CFR §356 App. B interpolation. SA daily Ref CPI is a calculated sole source (no official daily SA series).
**Update Frequency**: Monthly (on BLS release).
**R2 Key**: `TIPS/RefCpiNsaSa.csv`

| Field | Type | Description |
|---|---|---|
| `Ref CPI Date` | Date | The specific date for the Ref CPI values. |
| `Ref CPI NSA` | Number | Daily interpolated NSA Reference CPI (App. B). |
| `Ref CPI SA` | Number | Daily interpolated SA Reference CPI (App. B). |
| `SA Factor` | Number | Computed seasonal factor (`Ref CPI NSA / Ref CPI SA`). |

**Sort order**: Descending by date (newest row first).

**Live Data**: [View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/TIPS/RefCpiNsaSa.csv)

---

## <a id="s5"></a>Auction results (S5)
**File**: `Auctions.csv`
**R2 Key**: `Treasuries/Auctions.csv`
**Description**: Historical Treasury auction results since 1980.
**Written by**: [1.4 Fetch auction results](./1.4_Fetch_Auction_Results.md).
**Update Frequency**: Weekdays.
**Read by**: TreasuryAuctions.

**Key Fields**: `CUSIP`, `Auction_Date`, `Security_Type`, `High_Yield`, `Bid_to_Cover`.

**Live Data**: [View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/Auctions.csv)

---

## <a id="s6"></a>Yield history (S6)
**File**: `yields-history/`
**Description**: Single consolidated JSON, nested by symbol (US10Y, US30Y, … — all 14).
**Written by**: [1.7 Update yield history](./1.7_Update_Yield_History.md).
**Update Frequency**: Weekdays (end-of-day snapshots) via `updateYieldsHistory.js`.

**Format**: one object keyed by symbol, each value a `{ x, y }` array, e.g. `{ "US10Y": [ { "x": "20260403150000", "y": 4.25 }, ... ], "US30Y": [ ... ], ... }`.
- `x` is CNBC's compact `tradeTime` string `YYYYMMDDHHMMSS` (no separators). Daily-close bars are stamped at 15:00 ET (`...150000`) — the ~3PM benchmark close (see `YieldsMonitor/knowledge/Close_Price_Investigation.md`).
- `y` is the yield as a number (percent, `%` stripped).

**Refresh logic**: `updateYieldsHistory.js` fetches the `ALL`, `5Y`, `6M`, `3M` and `1M` feeds for each symbol, coarsest first, and merges each into the existing accumulated history, so a date already captured at a finer resolution is not coarsened when only a coarser feed still covers it, while a fresher feed's value for a shared date overrides an older one. The current (provisional) ET day is skipped every time, since it tracks the live session rather than the 3 PM close. One daily 3PM close per completed trading day per symbol, in the merged result. The browser stitches live intraday on top of this daily baseline. (Replaces the retired per-symbol `snapHistory.js` append model.)

**Live Sample**: [View consolidated history](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/yields-history/history.json)

---

## <a id="s18"></a>[Intraday archive (S18)](./DATA_DICTIONARY.md#s18)
**File**: `intraday-raw/{symbol}/{YYYYMMDD}.json`
**R2 Key**: `Treasuries/yields-history/intraday-raw/{symbol}/{YYYYMMDD}.json`
**Description**: One immutable daily snapshot per symbol of the raw feeds [CNBC (E5)](./DATA_DICTIONARY.md#e5) served that day.
**Written by**: [1.8 Archive intraday yields](./1.8_Archive_Intraday_Yields.md).
**Update Frequency**: Weekdays 17:05 ET ([Data Pipeline](./Data_Pipeline.md)).
**Read by**: Yields Monitor ([2.1 Assemble range data](../YieldsMonitor/knowledge/2.1_Assemble_Range_Data.md)), as the fallback when [CNBC (E5)](./DATA_DICTIONARY.md#e5)'s chart-bar feed itself returns nothing for a symbol.

---

## <a id="s13"></a>Yield curves (S13)
**Description**: General-purpose, spreadsheet-ready yields — evaluated yields for every priced Treasury (Bill/Note/Bond/STRIPS/Unclassified) and TIPS security, plus the fitted nominal, TIPS-quoted and TIPS-SA zero-coupon (spot) yield curves evaluated on a term grid (unlike [GSW curve parameters (S12)](#s12), which stores unevaluated Svensson parameters). Renamed from `SpotYieldCurves.csv` (2026-09-07): the file is a general yields resource, not spot-curves-only — it also carries every quoted security's own Ask/SA/SAO yield. Superseded the parameters-only `SpotYieldCurves.json` (retired 2026-09-07): six coefficients aren't usable in a spreadsheet, so this file stores actual yields instead. One row per **actual security** (`CUSIP`/`Maturity`/`Type` populated; `Ask`/`SA`/`SAO` populated where they exist) or one row per **fitted grid point** (`CUSIP` = `Spot`, `Maturity` blank, `Type` = `Treasury`/`TIPS`/`BEI`; `Spot`/`Spot SA` populated per Type — see below).
**Update Frequency**: Chained, not independently scheduled — re-run whenever either of its actual inputs changes: after `FidelityQuotes` (3x daily on weekdays, via `run-fidelity.cmd`) and after `YieldsFromFedInvestPrices` (1x daily on weekdays, via `run-fedinvest.cmd`), each chaining into `YieldCurves/scripts/run-yield-curves.cmd` on success. See [Data_Pipeline.md](./Data_Pipeline.md).
**R2 Key**: `Treasuries/YieldCurves.csv`

| Column | Type | Description |
|---|---|---|
| `Term (y)` | Number | [Term](./DATA_DICTIONARY.md#term): from the source's settlement date to maturity on a security row, and the fitted curve's horizon on a grid row, measured from the same settlement date. |
| `Maturity` | Date | Maturity date. Blank on a fitted grid row. |
| `CUSIP` | String | 9-character security identifier on a security row. `Spot` on a fitted grid row, so a grid row reads consistently with a security row rather than leaving the field blank. |
| `Type` | String | Security row: `Bill`, `Note`, `Bond`, `STRIPS`, `TIPS`, or `Unclassified` (a Market-quote CUSIP root the [Treasury CUSIP Reference](./Treasury_CUSIP_Reference.md) does not recognise). Grid row: `Treasury` (fitted nominal spot), `TIPS` (fitted TIPS quoted + SA spot), or `BEI` (nominal spot minus TIPS spot) — three rows per term per source. |
| `Source` | String | `FedInvest` or `Market`, same distinction as [SA and SAO yields (S10)](#s10)/[Breakeven inflation (S14)](#s14)/[Bid and ask spreads (S15)](#s15). |
| `Ask` | Number | Ask yield-to-maturity (decimal), calculated from the row's own quoted price at its source's settlement date — every security and both sources, per [3.1 Parse sources and calculate yields](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md) §Scope. A FedInvest-source row's price is the one [Select prices and add TIPS reference data (1.1.2)](./1.1_Download_FedInvest_Prices.md#select-prices-and-add-tips-reference-data) selects from [FedInvest (E1)](./DATA_DICTIONARY.md#e1)'s own Buy, Sell and End of Day prices, not a true ask, so this column holds the yield of that price on FedInvest-source rows. |
| `SA` | Number | [SA Yield](./DATA_DICTIONARY.md#sa-yield) (decimal). TIPS security rows only. |
| `SAO` | Number | [SAO Yield](./DATA_DICTIONARY.md#sao-yield) (decimal). TIPS security rows only. |
| `Spot` | Number | Grid rows only, semi-annual bond-equivalent decimal (converted from the module's continuously-compounded `z(t)` so it sits on the same basis as `Ask`). Type `Treasury`: fitted nominal Treasury zero-coupon yield at `Term (y)`. Type `TIPS`: fitted TIPS zero-coupon yield to the **quoted** (non-SA) ask prices. Type `BEI`: nominal spot minus TIPS quoted spot. |
| `Spot SA` | Number | Grid rows only. Type `TIPS`: fitted TIPS zero-coupon yield to seasonally adjusted prices. Type `BEI`: nominal spot minus TIPS SA spot, per [3.4 Fit spot yield curves](../YieldCurves/knowledge/3.4_Fit_Spot_Yield_Curves.md#spot-bei). Blank on Type `Treasury` (no SA concept for a nominal). |

**STRIPS**: `Product = Treasury` in [Market quotes (S7)](#s7)/[Fidelity Fixed Income (E6)](#e6) also covers STRIPS (zero-coupon, identified by CUSIP root, e.g. `912803`/`912820`/`912821`/`912833`/`912834` — [Treasury CUSIP Reference](./Treasury_CUSIP_Reference.md)), a fact neither Market quotes (S7) nor E6 states explicitly today (both describe `Product` as Treasury-or-TIPS with no mention that STRIPS rows sit inside the Treasury rows — flagged as a documentation gap, not yet fixed). STRIPS are Market-source only (not present in FedInvest data as of 2026-09). They are excluded from the nominal spot-curve fit's input universe, same as every other STRIP-fitting exclusion in this pipeline, but included as their own `Type = STRIPS` security rows. `Ask` is calculated from the quoted price, as it is for every other row in the file. `shared/src/bond-math.js#yieldFromPrice` builds no coupon cash flows at a coupon of zero, so what a STRIP gets is the semi-annual bond-equivalent zero-coupon yield of its price, and a STRIP maturing inside half a year gets Treasury's own bill investment-rate formula. Against the 2026-09-11 quote file the calculated figure differs from the reported one by a median 0.05 bp across 247 STRIPS (p90 0.09, max 3.31).

**Term grid**: half-year steps (0.5, 1.0, 1.5, …), matching the chart's own `spotCurveGrid` convention and including every whole year in range (a whole-year term is itself a half-year multiple, so no separate annual pass is needed). Spans the union of the nominal, TIPS-quoted and TIPS-SA fits' valid ranges per `Source`, rather than clipping to their intersection — a term outside one curve's valid range simply leaves that curve's cell(s) blank rather than dropping the whole row. A cell is also left blank if its fit's sanity check fails at that term (see `shared/src/spot-curve.js#spotCurveFit`).

**Logic**: Loads the same R2 inputs the YieldCurves app loads ([FedInvest prices (S1)](#s1), [Ref CPI NSA and SA (S4)](#s4), [Market quotes (S7)](#s7), `misc/BondHolidaysSifma.csv`) and runs every step through the module `YieldCurves/src/app.js` imports for it, so the app and this pipeline cannot drift apart: `shared/src/fidelity-parse.js#parseFidelityNominalRows` for the Market quotes (S7) nominal Treasury rows, `shared/src/tips-yields.js#tipsYieldsFromPrices` for the TIPS yields, `shared/src/treasury-yields.js#treasuryYieldsFromPrices` for the FedInvest prices (S1) nominal Treasury yields, `shared/src/spreads.js` for the [Bid and ask spreads (S15)](#s15) spreads, `shared/src/spot-curve.js#spotCurveFit` for the fits, `shared/src/breakeven.js#findClosestNominal` for the nominal each [Breakeven inflation (S14)](#s14) row is stated against, and `shared/src/bond-math.js#termYears` for `Term (y)`. The script evaluates the fit objects' own `z(t)`/`sane()` on the term grid rather than refitting.

**Live Data**: [View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/YieldCurves.csv)

---

## <a id="s14"></a>Breakeven inflation (S14)
**Description**: Per-TIPS breakeven inflation — the Ask/SA/SAO yield for each TIPS against the yield of its nearest-maturity nominal Treasury, `Market` (broker quotey) source only. Matches the YieldCurves BEI tab's per-bond table, which the app computes but does not persist.
**Update Frequency**: `Market`-only data, so it changes only when `FidelityQuotes` refreshes (3x daily on weekdays); written by the same chained `updateSpotYieldCurves.js` run as [Yield curves (S13)](#s13) (also chained from `YieldsFromFedInvestPrices`, which this file doesn't depend on — see [Data_Pipeline.md](./Data_Pipeline.md)).
**R2 Key**: `Treasuries/BreakevenInflation.csv`

| Field | Type | Description |
|---|---|---|
| `cusip` | String | TIPS CUSIP. |
| `maturity` | Date | TIPS maturity date. |
| `coupon` | Number | Real coupon rate (decimal). |
| `ask_yield` | Number | Ask yield-to-maturity (decimal). |
| `sa_yield` | Number | [SA Yield](./DATA_DICTIONARY.md#sa-yield). |
| `sao_yield` | Number | [SAO Yield](./DATA_DICTIONARY.md#sao-yield). |
| `nominal_cusip` | String | CUSIP of the nearest-maturity nominal Treasury. |
| `nominal_maturity` | Date | That nominal's maturity date. |
| `nominal_yield` | Number | That nominal's ask yield-to-maturity (decimal). |
| `ask_bei` | Number | `nominal_yield − ask_yield`. |
| `sa_bei` | Number | `nominal_yield − sa_yield`. |
| `sao_bei` | Number | `nominal_yield − sao_yield`. |

**Live Data**: [View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/BreakevenInflation.csv)

---

## <a id="s15"></a>Bid and ask spreads (S15)
**Description**: Per-security broker bid/ask yield and price spread, TIPS and nominal Treasuries combined in one file (`security_type` discriminates, same pattern as [Market quotes (S7)](#s7)'s `Product` column). `Market` (broker quotey) source only — FedInvest carries a single price, not a separate bid and ask.
**Update Frequency**: `Market`-only data, so it changes only when `FidelityQuotes` refreshes (3x daily on weekdays); written by the same chained `updateSpotYieldCurves.js` run as [Yield curves (S13)](#s13) (also chained from `YieldsFromFedInvestPrices`, which this file doesn't depend on — see [Data_Pipeline.md](./Data_Pipeline.md)).
**R2 Key**: `Treasuries/BidAskSpreads.csv`

| Field | Type | Description |
|---|---|---|
| `security_type` | String | `TIPS` or `Treasury`. |
| `cusip` | String | 9-character security identifier. |
| `maturity` | Date | Maturity date. |
| `coupon` | Number | Coupon rate (decimal). |
| `ask_yield` | Number | Ask yield-to-maturity (decimal). |
| `bid_yield` | Number | Bid yield-to-maturity (decimal). |
| `yield_spread_bps` | Number | `(bid_yield − ask_yield) × 10000`. |
| `ask_price` | Number | Ask price (TIPS: raw price, unadjusted, matching Market quotes (S7)). |
| `bid_price` | Number | Bid price (TIPS: raw price, unadjusted, matching Market quotes (S7)). |
| `price_spread_pct` | Number | TIPS: `(adjusted_ask − adjusted_bid) / adjusted_ask × 100` (actual dollar cost). Treasury: `(ask − bid) / ask × 100`. |

**Live Data**: [View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/BidAskSpreads.csv)

---

## <a id="s7"></a>[Market quotes (S7)](./DATA_DICTIONARY.md#s7)
**File**: `FidelityTreasuriesTips.csv`
**Description**: [Fidelity Fixed Income (E6)](./DATA_DICTIONARY.md#e6)'s own rows, unchanged except for one transformation: every `="value"` Excel literal-string wrapper the export applies to a field is stripped to `value`. Combined Treasury + TIPS bid/ask quotes (replaces the old separate `FidelityTips.csv`/`FidelityTreasuries.csv` pair as of ~2026-06-23).
**Written by**: [1.2 Download market quotes](./1.2_Download_Market_Quotes.md).
**Update Frequency**: `FidelityQuotes` task, three weekday trigger windows — 5:05 AM PT, 9:35 AM PT, 2:05 PM PT ([Data Pipeline](./Data_Pipeline.md)).
**Read by**: YieldCurves ([3.1.2](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#parse-market-quotes)), the yield curves job (process 1.3), the SA and SAO yields job (process 1.11), the fund holdings job (process 1.14), and TipsLadderManager and TipsReference when the Market source is selected ([3.1 Data Pipeline §4.0](../TipsLadderManager/knowledge/3.1_Data_Pipeline.md)).

**Live Data**: [View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/FidelityTreasuriesTips.csv)

---

## <a id="s8"></a>CPI history (S8)
**Description**: Full monthly BLS CPI-U history (NSA and SA) from January 1913 to present.
**Update Frequency**: Monthly (on BLS release).
**R2 Key**: `bls/CPI_history.csv`

| Field | Type | Description |
|---|---|---|
| `Year` | String | 4-digit year (e.g., `"1913"`) |
| `Period` | String | BLS period code (e.g., `"M01"` = January) |
| `PeriodName` | String | Full month name (e.g., `"January"`) |
| `NSA` | Number | CPI-U Not Seasonally Adjusted ([BLS (E4)](./DATA_DICTIONARY.md#e4) series `CUUR0000SA0`) |
| `SA` | Number | CPI-U Seasonally Adjusted ([BLS (E4)](./DATA_DICTIONARY.md#e4) series `CUSR0000SA0`). Blank for periods before January 1947. |

**Sort order**: Ascending by Year, then Period (oldest row first).

**Live Data**: [View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/bls/CPI_history.csv)

---

## <a id="s9"></a>Tentative auction schedule (S9)
**Description**: Copy of the Treasury's Tentative Auction Schedule, used to identify TIPS auctions that the FiscalData upcoming-auctions feed doesn't flag.
**Written by**: [1.5 Fetch tentative auction schedule](./1.5_Fetch_Tentative_Auction_Schedule.md).
**Update Frequency**: Local Windows Task `TreasuryAuctions-TentativeSchedule`. Treasury revises this schedule at its Quarterly Refunding press conference (first Wednesday of Feb/May/Aug/Nov), with the document itself updated ~1–3 weeks later, so the task runs daily for 21 days after each of the next 2 quarterly-refunding dates, plus a monthly safety-net check the rest of the year. A companion task, `TreasuryAuctions-TentativeSchedule-Refresh`, re-runs `scripts/setup-tentative-schedule-task.ps1` quarterly to roll the trigger window forward — no manual maintenance needed.
**R2 Key**: `Treasuries/Tentative-Auction-Schedule.xml`

**Format**: XML `<AuctionCalendarDate>` elements, each with `AuctionDate`, `SecurityTermWeekYear`, `SecurityType`, `ReOpeningIndicator` (Y/N), `TIPS` (Y/N), `FloatingRate` (Y/N), `AnnouncementDate`, `SettlementDate`.

**Logic**: Fetched directly by the TreasuryAuctions app, which matches each upcoming-auction row to an `<AuctionCalendarDate>` node by `AuctionDate` + `SecurityTermWeekYear` and flags it TIPS if that node's `TIPS` field is `Y`.

**Live Data**: [View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/Tentative-Auction-Schedule.xml)

---

## <a id="s10"></a>SA and SAO yields (S10)
**Description**: TIPS ask/SA/SAO yields derived from [Market quotes (S7)](#s7).
**Update Frequency**: Triggered by the `FidelityQuotes` task (3× daily on weekdays), via `updateSaSaoYields.js`.
**R2 Key**: `TIPS/YieldsSaSao.csv`

| Field | Type | Description |
|---|---|---|
| `cusip` | String | 9-character security identifier. |
| `maturity` | Date | Maturity date. |
| `coupon` | Number | Real coupon rate (decimal). |
| `ask_yield` | Number | Ask yield-to-maturity (decimal). |
| `sa_yield` | Number | [SA Yield](./DATA_DICTIONARY.md#sa-yield). |
| `sao_yield` | Number | [SAO Yield](./DATA_DICTIONARY.md#sao-yield). |

**Consumers**: TipsLadderManager — reads `sa_yield` via `shared/src/market-data.js` for the within-year allocation policy (`TipsLadderManager/knowledge/2.0_TIPS_Ladders.md`). FundHoldings ([Vanguard Advisors (E7)](./DATA_DICTIONARY.md#e7)/[fminvest.com (E8)](./DATA_DICTIONARY.md#e8) holdings enrichment) — cross-references by CUSIP to attach ask/SA/SAO yield to TIPS fund holdings. SeasonalAdjustments — reads a snapshot committed to that app (`SeasonalAdjustments/data/YieldsSaSao.snapshot.csv`), not this object, so a re-publish does not reach it until the snapshot is retaken.

**Live Data**: [View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/TIPS/YieldsSaSao.csv)

---

## <a id="s11"></a>Fund holdings (S11)
**Description**: Treasury and TIPS fund holdings by CUSIP, one raw and one enriched CSV per fund ticker (VBIL, VTIP, VTP, RBIL, LTPZ, SCHP, XHLF, ICPI). The enriched file adds ask/SA/SAO yield, term, and duration, computed the same way for every fund from [SA and SAO yields (S10)](#s10) and [Market quotes (S7)](#s7) rather than taken from each provider’s own reported analytics.
**Update Frequency**: Daily, Local Windows Task `FundHoldings`, via `FundHoldings/updateAllHoldings.js` then `FundHoldings/enrichHoldings.js`.
**R2 Key**: `FundHoldings/` (its own top-level prefix, since a fund’s holdings mix TIPS and nominal rows and so belong under neither `TIPS/` nor `Treasuries/`)

**CSV columns** (exact header names): `CUSIP, Holding Name, Ticker, Category, Quantity, Coupon, % of Fund, Market Value, Maturity Date, ISIN, SEDOL, As of` — and, in the `-Enriched` file only, `Ask Yield, SA Yield, SAO Yield, Term, Duration`. These are the file’s own headers; the [Vanguard Advisors (E7)](./DATA_DICTIONARY.md#e7)–[BlackRock iShares (E12)](./DATA_DICTIONARY.md#e12) entries name the same fields in the Data Dictionary’s normalized form.

**Companion file**: `FundHoldings/FundMeta.json` = `{ @Ticker: { fundName, portId | etfId | cusip | portfolioId, expenseRatio, secYield } }`. `expenseRatio` and `secYield` are percent-scale numbers (`0.09` for 0.09%), each the provider’s own reported figure rather than an independently computed one.

**Sources**: [Vanguard Advisors (E7)](./DATA_DICTIONARY.md#e7) Vanguard, [fminvest.com (E8)](./DATA_DICTIONARY.md#e8) fminvest.com, [PIMCO (E9)](./DATA_DICTIONARY.md#e9) PIMCO, [Schwab Asset Management holdings export (E10)](./DATA_DICTIONARY.md#e10) Schwab, [BondBloxx product-page holdings table (E11)](./DATA_DICTIONARY.md#e11) BondBloxx, [BlackRock iShares (E12)](./DATA_DICTIONARY.md#e12) BlackRock iShares. Per-fund detail: [FundHoldings 1.0](../FundHoldings/knowledge/1.0_FundHoldings.md).

**Live Data**: [View FundMeta.json](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/FundHoldings/FundMeta.json)

---

## <a id="s12"></a>GSW curve parameters (S12)
**Description**: The latest published row of the Federal Reserve's Gürkaynak-Sack-Wright fitted TIPS (real) yield curve (FEDS 2008-05), scraped from `feds200805_1.html`. Just the six Svensson parameters and the observation date — the app evaluates the curve itself. Used only as a reference overlay against YieldCurves' own spot fit.
**Update Frequency**: `GswTipsCurve` task, daily 7:15am PT, via `YieldCurves/scripts/updateGswTipsCurve.js`. The source itself updates weekly (Tuesdays, covering through the prior Friday); the daily poll just picks up new or revised rows promptly.
**R2 Key**: `TIPS/GswTipsCurve.json`

| Field | Type | Description |
|---|---|---|
| `date` | Date | Observation date of the fitted curve (`YYYY-MM-DD`). |
| `beta0`–`beta3` | Number | Svensson level / slope / two curvature coefficients (percent). |
| `tau1`, `tau2` | Number | Svensson decay parameters (years). |

**Consumer**: YieldCurves (TIPS tab) — evaluates the Svensson zero-yield formula from these parameters to draw the "GSW zero" reference line, on the analysis view opened with `?gsw` only. No view of the app uses it otherwise.

---

## <a id="s16"></a>[Bond holidays (S16)](./DATA_DICTIONARY.md#s16)
**Description**: SIFMA's published US bond-market holiday schedule, filtered to the eleven base US market holidays plus New Year's Day, one row per holiday per year. Backs the [Bond Holiday](./DATA_DICTIONARY.md#bond-holiday) term: a weekday listed here is not a bond trading day, so T+1 settlement passes over it.
**Written by**: `node BondHolidays/updateHolidaysSifma.js` (the `bond-holidays-update` Dashboard job).
**Update Frequency**: Run manually, not on the automatic scheduler — a year's holiday schedule changes rarely once published.
**R2 Key**: `misc/BondHolidaysSifma.csv`
**Read by**: five apps — YieldCurves, SeasonalAdjustments, TipsLadderManager, YieldsMonitor, and the FedInvest acquisition job (`scripts/getYieldsFedInvest.js`) — through the shared `shared/src/settlement.js` and `shared/src/market-data.js` modules, so settlement-date logic reads one holiday calendar everywhere.

**Live Data**: [View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/misc/BondHolidaysSifma.csv)

---

## <a id="s17"></a>[Monthly CPI (S17)](./DATA_DICTIONARY.md#s17)
**Description**: BLS's monthly CPI-U NSA and SA series (`CUUR0000SA0`/`CUSR0000SA0`), 2019 to present, fetched separately from [CPI history (S8)](#s8) (same series, 1913 to present) so that the daily App. B interpolation that produces [Ref CPI NSA and SA (S4)](#s4) does not depend on S8's own refresh, which runs only on BLS release dates.
**Written by**: `YieldCurves/scripts/fetchCpiBls.js`, the first step of `YieldCurves/scripts/updateRefCpi.js`.
**Update Frequency**: Daily 6:35am ET, unconditionally, as the first step of the SA Factor Update chain ([Data_Pipeline.md](./Data_Pipeline.md)) — a plain daily trigger, not the release-date-aware scheme S8's own task uses, so it re-fetches from BLS on days the underlying monthly value has not changed. Flagged for a fix: [DFD_Worklist.md §3.0 item 11](./DFD_Worklist.md).
**R2 Key**: `bls/CPI.csv`
**Read by**: `YieldCurves/scripts/calcRefCpi.js`, in the same chained run, to produce [Ref CPI NSA and SA (S4)](#s4).

**Live Data**: [View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/bls/CPI.csv)
