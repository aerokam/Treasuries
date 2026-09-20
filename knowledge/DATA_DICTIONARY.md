# Treasury Investors Portal Data Dictionary (DD)

**Scope:** Global — Covers all apps and pipelines in the Treasuries repo.
**Authority:** This document is the primary source of truth for all data definitions. It supersedes all other documentation for variable meanings and data structures.

---

<!-- DD-INDEX:START -->

## Index

*Every term below, alphabetically, including synonyms. The entries themselves are grouped by category in the sections that follow.*

**A** &nbsp; [AA](#aa) &middot; [Accrued Interest (Adjusted)](#accrued-interest-adjusted) &middot; [Accrued Interest (Nominal)](#accrued-interest-nominal) &middot; [accrued market discount](#amd) *(see Accrued Market Discount (AMD))* &middot; [Accrued Market Discount (AMD)](#amd) &middot; [Active Lower Bracket](#active-lower-bracket) &middot; [Annual Interest (Nominal)](#annual-interest-nominal) &middot; [Annual Interest (Real)](#annual-interest-real) &middot; [App Inputs](#app-inputs) &middot; [App Outputs](#app-outputs) &middot; [ARA](#ara) &middot; [Ask / Bid](#ask) &middot; [Auction Results](#auction-results) &middot; [Auction results (S5)](#s5) &middot; [Available Cash](#available-cash) &middot; [Axis Scales](#axis-scales)

**B** &nbsp; [bei](#breakeven-inflation) *(see Breakeven Inflation (BEI))* &middot; [bid](#ask) *(see Ask / Bid)* &middot; [Bid and Ask Spreads](#bid-and-ask-spreads) &middot; [Bid and ask spreads (S15)](#s15) &middot; [BlackRock iShares (E12)](#e12) &middot; [BLS (E4)](#e4) &middot; [Bond Holiday](#bond-holiday) &middot; [Bond holidays (S16)](#s16) &middot; [Bond Ladder](#bond-ladder) &middot; [BondBloxx product-page holdings table (E11)](#e11) &middot; [bracket maturity](#bracket-year-tips) *(see Bracket Year TIPS)* &middot; [Bracket Weight](#bracket-weight) &middot; [Bracket Year](#bracket-year) &middot; [Bracket Year TIPS](#bracket-year-tips) &middot; [Breakeven Inflation (BEI)](#breakeven-inflation) &middot; [Breakeven inflation (S14)](#s14)

**C** &nbsp; [Cash Flow Calendar](#cash-flow-calendar) &middot; [Charts and Tables](#charts-and-tables) &middot; [clean price](#price) *(see Price)* &middot; [CNBC (E5)](#e5) &middot; [Cost per TIPS](#cost-per-tips) &middot; [Coupon Rate](#coupon-rate) &middot; [Cover Excess](#cover-excess) &middot; [cover maturity](#cover-year-tips) *(see Cover Year TIPS)* &middot; [Cover Weight](#cover-weight) &middot; [Cover Year](#cover-year) &middot; [Cover Year TIPS](#cover-year-tips) &middot; [CPI CAGR](#cpi-cagr) &middot; [CPI Change (Month-over-Month)](#cpi-change-mom) &middot; [CPI Change (Point-to-Point)](#cpi-change-p2p) &middot; [CPI Change (Year-over-Year)](#cpi-change-yoy) &middot; [CPI history (S8)](#s8) &middot; [CPI-U NSA](#cpi-nsa) &middot; [CPI-U SA](#cpi-sa) &middot; [Credibility Factor](#credibility-factor) &middot; [CUSIP](#cusip)

**D** &nbsp; [DAA](#daa) &middot; [Daily Ref CPI](#daily-ref-cpi) &middot; [DARA](#dara) &middot; [Dated Date](#dated-date) &middot; [Day Change](#day-change) &middot; [Download Date](#download-date) &middot; [Downloaded Data Sets](#downloaded-data-sets) &middot; [Drill Popup](#drill-popup) &middot; [Drill Request](#drill-request) &middot; [Duration Matching](#duration-matching)

**E** &nbsp; [Excess TIPS](#excess-tips)

**F** &nbsp; [Face Value](#face-value) &middot; [FACP](#facp) &middot; [Federal Reserve FEDS 2008-05 (E13)](#e13) &middot; [FedInvest (E1)](#e1) &middot; [FedInvest Daily Price List](#fedinvest-daily-price-list) &middot; [FedInvest prices (S1)](#s1) &middot; [Fidelity Fixed Income (E6)](#e6) &middot; [FiscalData (E3)](#e3) &middot; [fminvest.com (E8)](#e8) &middot; [Forward Rate](#forward-rate) &middot; [Fund Holdings](#fund-holdings) &middot; [Fund holdings (S11)](#s11) &middot; [Funded Year](#funded-year) &middot; [Funded Year TIPS](#funded-year-tips)

**G** &nbsp; [Gap Years](#gap-years) &middot; [GSW Curve Parameters](#gsw-curve-parameters) &middot; [GSW curve parameters (S12)](#s12)

**I** &nbsp; [Index Ratio](#index-ratio) &middot; [Inflation Compensation](#inflation-compensation) &middot; [inflation factor](#index-ratio) *(see Index Ratio)* &middot; [Intraday archive (S18)](#s18) &middot; [IQR Clip](#iqr-clip)

**L** &nbsp; [Ladder](#ladder) &middot; [ladder eligible tips](#outstanding-tips) *(see Outstanding TIPS)* &middot; [ladder period](#ladder) *(see Ladder)* &middot; [Last-Year Interest](#last-year-interest) &middot; [Live Quotes](#live-quotes) &middot; [LMI](#lmi)

**M** &nbsp; [Market Quotes](#market-quotes) &middot; [Market quotes (S7)](#s7) &middot; [Market Yields](#market-yields) &middot; [Maturity Date](#maturity-date) &middot; [Maturity SA Factor](#maturity-sa-factor) &middot; [Maturity Year](#maturity-year) &middot; [Monthly CPI (S17)](#s17) &middot; [Monthly CPI-U](#monthly-cpi-u)

**N** &nbsp; [Net Cash](#net-cash)

**O** &nbsp; [Outstanding TIPS](#outstanding-tips)

**P** &nbsp; [P+I](#pi) &middot; [P+I per TIPS](#pi-per-tips) &middot; [Par Value (Adjusted)](#par-value-adjusted) &middot; [Par Value (Nominal)](#par-value) &middot; [Par Yield](#par-yield) &middot; [PIMCO (E9)](#e9) &middot; [pre ladder interest](#pre-ladder-credit) *(see Pre-Ladder Interest (PLI))* &middot; [Pre-Ladder Interest (PLI)](#pre-ladder-credit) &middot; [Price](#price)

**Q** &nbsp; [Quantity](#quantity)

**R** &nbsp; [Ref CPI](#ref-cpi) &middot; [Ref CPI (S3)](#s3) &middot; [Ref CPI NSA and SA (S4)](#s4) &middot; [Reference Data](#reference-data) &middot; [Reference Date](#reference-date) &middot; [Retained Bracket Excess](#retained-bracket-excess) &middot; [Retained Lower Bracket](#retained-lower-bracket) &middot; [Rolling CPI Change](#rolling-cpi-change) &middot; [Rung](#rung)

**S** &nbsp; [SA and SAO yields (S10)](#s10) &middot; [SA Factor](#sa-factor) &middot; [SA Price Factor](#sa-price-factor) &middot; [SA Yield](#sa-yield) &middot; [SA Yield Series](#sa-yield-series) &middot; [SA Yields](#sa-yields) &middot; [SACP](#sacp) &middot; [same year excess interest](#same-maturity-excess-interest) *(see Same-Maturity Excess Interest)* &middot; [Same-Maturity Excess Interest](#same-maturity-excess-interest) &middot; [SAO Blend Weight](#sao-blend-weight) &middot; [SAO Yield](#sao-yield) &middot; [SAO Yields](#sao-yields) &middot; [Schwab Asset Management holdings export (E10)](#e10) &middot; [Seasonal Amplitude](#seasonal-amplitude) &middot; [Seasonal Factor Drift](#seasonal-factor-drift) &middot; [Settlement Date](#settlement-date) &middot; [Source Data](#source-data) &middot; [Spot Yield](#spot-yield) &middot; [Spot Yield Curves](#spot-yield-curves) &middot; [Synthetic TIPS](#synthetic-tips)

**T** &nbsp; [Tentative Auction Schedule](#tentative-auction-schedule) &middot; [Tentative auction schedule (S9)](#s9) &middot; [Term](#term) &middot; [TIPS](#tips) &middot; [TIPS Ladder](#tips-ladder) &middot; [TIPS Prices](#tips-prices) &middot; [TIPS Quotes](#tips-quotes) &middot; [TIPS Reference Data](#tips-reference-data) &middot; [TIPS reference data (S2)](#s2) &middot; [TIPS Yields](#tips-yields) &middot; [Total Cost](#total-cost) &middot; [Trade Ticket](#trade-ticket) &middot; [Treasury Bill](#treasury-bill) &middot; [Treasury Bond](#treasury-bond) &middot; [Treasury Note](#treasury-note) &middot; [Treasury Prices](#treasury-prices) &middot; [Treasury Quotes](#treasury-quotes) &middot; [Treasury Tentative Auction Schedule (E14)](#e14) &middot; [Treasury Yields](#treasury-yields) &middot; [TreasuryDirect SecIndex (E2)](#e2)

**V** &nbsp; [Vanguard Advisors (E7)](#e7) &middot; [View Selections](#view-selections)

**W** &nbsp; [Within-Year Allocation Policy](#within-year-allocation-policy)

**Y** &nbsp; [years to maturity](#term) *(see Term)* &middot; [Yield](#yield) &middot; [Yield Curve](#yield-curve) &middot; [Yield curves (S13)](#s13) &middot; [Yield history (S6)](#s6) &middot; [Yield Series](#yield-series)

**Z** &nbsp; [zero coupon yield](#spot-yield) *(see Spot Yield)*

---

<!-- DD-INDEX:END -->

## 0.0 DD Notation

| Symbol | Meaning |
|---|---|
| `=` | is composed of / is defined as |
| `+` | AND |
| `[ x \| y ]` | Selection (either x or y) |
| `{ x }` | Iteration (zero or more of x) |
| `( x )` | Optional (x may or may not be present) |
| `* x *` | Comment / Narrative definition |
| `@ x` | Identifier (Key field) |

---

<a id="1.0-external-entities-e"></a>
## 1.0 External Entities (E)
*External sources providing data to the system. Click these in the Context Diagram to see their data structures.*

- <a id="e1"></a>**FedInvest (E1)** = `Prices_For + { CUSIP + SECURITY_TYPE + RATE + MATURITY_DATE + CALL_DATE + BUY + SELL + END_OF_DAY }`
  *TreasuryDirect’s daily price list for marketable Treasury securities, one row per security. The page states the date its prices are for on a `Prices For:` line, and its price table has the eight columns above, named as the page names them. Prices are published for the current business day and, on a separate page, for a past date. The three prices, and how Treasury derives them, are described in [FedInvest Pricing Logic](../YieldCurves/knowledge/FedInvest_Pricing_Logic.md).*
- <a id="e2"></a>**TreasuryDirect SecIndex (E2)** = `CUSIP + Index_Date + Ref_CPI`
  *Authority for daily interpolated RefCPI. Provides values for every day of the month.*
- <a id="e3"></a>**FiscalData (E3)** = `CUSIP + Auction_Date + Security_Type + High_Yield + Bid_to_Cover + ...`
  *U.S. Treasury official auction results and immutable security metadata (Coupons, Dated Dates).*
- <a id="e4"></a>**BLS (E4)** = `Year + Month + Value + Seasonal_Adjustment_Flag`
  *Consumer Price Index (CPI-U) monthly data. Used to derive SA factors by comparing NSA vs. SA values.*
- <a id="e5"></a>**CNBC (E5)** — one source, two independent services, each its own flow rather than a mechanism of the other:
  - **Chart-bar feed** = `Symbol + TimeRange + { TradeTime + Close }`
    *The feed behind CNBC's own Treasury/TIPS charts (`webql-redesign.cnbcfm.com/graphql`, operation `getQuoteChartData`), sourced from Tradeweb. One bar per `TradeTime` at the resolution `TimeRange` selects (`1D` down to one minute, `5D` to five, coarser tiers to a day or a quarter), `Close` the yield at that bar. Symbols include `US10Y`, `US30YTIPS`, and every other maturity [Yields Monitor](../YieldsMonitor/knowledge/2.1_Assemble_Range_Data.md) tracks. Compared against broker quotes on the same securities, the values sit closer to the bid than to the ask wherever the two differ — an observation from that comparison, not a documented property of the feed (see [Close Price Investigation §4](../YieldsMonitor/knowledge/Close_Price_Investigation.md#4-provenance)), so this is not a mid-price feed as an earlier version of this entry stated. Source of [Market Yields](#market-yields).*
  - **Quote service** = `Symbol + Last + LastTime + PreviousDayClosing + MaturityDate + Coupon`
    *A batched REST endpoint (`quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol`, one request for every symbol via a `|`-separated list), independent of the chart-bar feed above — a different mechanism CNBC exposes, not a different source. `Last`/`LastTime` are the live yield and the time it was read, current even when the chart-bar feed is frozen. `PreviousDayClosing` is an official settlement-quote reference distinct from either the chart-bar feed's own daily close or [Yields Monitor](../YieldsMonitor/knowledge/2.3_Calculate_Day_Change.md)'s own 17:05 ET session-close reference. `MaturityDate`/`Coupon` identify the one real TIPS a canonical-maturity symbol (e.g. `US2YTIPS`) is quoting today. Source of [Live Quotes](#live-quotes).*
- <a id="e6"></a>**Fidelity Fixed Income (E6)** = `Product, Description, Cusip, State, Coupon, Frequency, Maturity date, Call protected, Call date, Moody's rating, S&P rating, Yield, Bid price/Quantity (min), Adjusted bid price, Inflation factor, Ask price/Quantity (min), Adjusted ask price, Ask yield to worst, Ask yield to sink, Ask yield to maturity, 3rd party price, Depth of book, Attributes`
  *Broker bid/ask quotes, one combined export (Treasury + TIPS rows in a single CSV, distinguished by the `Product` column: `Treasury` or `TIPS`). Treasury rows carry no `Inflation factor`/`Adjusted bid price`/`Adjusted ask price`; both row types carry `Yield`, which doubles as the bid yield — there is no separate "Yield Bid" column in the combined export. Column names are the export's own header, exact. How the export is obtained (browser automation, login, MFA) is out of scope for this entry — see [1.2 Download market quotes](./1.2_Download_Market_Quotes.md), which links to where that mechanism is documented.*
- <a id="e7"></a>**Vanguard Advisors (E7)** = `CUSIP + Holding_Name + Ticker + Category + ( Quantity | Face_Amount ) + Coupon_Rate + Percent_Of_Fund + Market_Value + Maturity_Date + ISIN + SEDOL + As_Of_Date`
  *Fund holdings for Vanguard Treasury/TIPS funds (e.g., VBIL, VTIP, VTP), scraped from the public `advisors.vanguard.com` product holdings endpoint. Not every fund publishes a "daily" snapshot — the scraper tries `holdings/daily` first and falls back to `holdings/latest`. Expense ratio and 30-Day SEC yield (not in the holdings endpoint) come from two sibling endpoints on the same host: `api/funds/<portId>/fees` (`adjustedExpenseRatio.value`) and `api/funds/<portId>/analytics/yields` (`secYield.percent`). Fetched daily by the `FundHoldings` Windows Task (`FundHoldings/updateAllHoldings.js`), same as the rest of the ingestion pipeline.*
- <a id="e8"></a>**fminvest.com (E8)** = `field_symbol (CUSIP) + field_name (Holding_Name) + field_par_value (Quantity) + field_weightings (Percent_Of_Fund) + field_market_value + field_as_of_date`
  *Fund holdings for ETFs not covered by Vanguard's own API (currently RBIL only). Keyed by an internal numeric ETF id with no public ticker lookup, so the id is hardcoded per fund in `FundHoldings/fminvest/updateFminvestHoldings.js`. Coupon and maturity are parsed out of the trailing `"<coupon>% MM/DD/YYYY"` suffix on `field_name` — cash/sweep rows have no such suffix and are naturally excluded downstream. fminvest.com is F/m Investments' own site (the fund issuer), not a third-party aggregator; its separate product page (`fminvest.com/etfs/<slug>`) is scraped for expense ratio and 30-Day SEC yield, rendered directly into the page (no API call). Fetched daily by the `FundHoldings` Windows Task, same as Vanguard Advisors (E7).*
- <a id="e9"></a>**PIMCO (E9)** = `CUSIP + Description (Holding_Name) + Coupon_Rate + Percent_Of_Net_Assets + Market_Value + Notional/Par_Value_Quantity/Units + Maturity_Date + AsOfDate`
  *Fund holdings for PIMCO funds (currently LTPZ only), fetched as an xlsx export from `fund-ui.pimco.com/fund-detail-api/api/funds/<CUSIP>/topTenHoldings/export?asOfDate=9999-12-31` (despite the endpoint name, the far-future `asOfDate` returns full holdings, not just the top ten). Keyed by the fund's own CUSIP with no public ticker lookup, so it is hardcoded per fund in `FundHoldings/pimco/updateLtpzHoldings.js`. `Coupon_Rate` is rounded to 2 decimals by PIMCO (lossy for the eighth-of-a-percent coupons TIPS carry, e.g. 1.375% → "1.38"); the scraper instead parses the precise coupon from the trailing number in `Description` (e.g. "TSY INFL IX N/B 02/44 1.375"), falling back to `Coupon_Rate` only when `Description` has no parseable suffix (cash/sweep/currency lines). Expense ratio comes from `key-information` → `netExpenseRatio` (percent-scale already, not date-sensitive so fetched at "latest"). 30-Day SEC yield comes from `fund-stats` → `unsubsidized30SecYield` × 100 (a true fraction, unlike every other PIMCO field used here — confirmed by grepping the product page's own Angular bundle for the label's data binding, present at two separate places on the page, both bound to this exact field). `key-statistics`' similarly-named `subsidizedSecYield` is a different, month-end (not live-daily) figure and is *not* what the page displays under "30-Day SEC Yield" — do not use it. The `asOfDate=9999-12-31` "latest" trick (used for every other endpoint on this API, including the holdings export) does *not* apply to `unsubsidized30SecYield`: PIMCO's backend already has a business day's worth of that figure the product page hasn't published yet (confirmed by direct testing — the page kept showing a stale value even after a hard refresh, i.e. a genuine backend lag on this specific regulatory figure, not caching). SEC yield must be for the same date as the holdings themselves (the as-of date already shown in the app's banner) — rather than guessing a fixed day-offset, the scraper fetches `fund-stats` at that exact `asOfDate` (converted from the holdings export's own `AsOfDate:` line). Fetched daily by the `FundHoldings` Windows Task, same as E7/E8.*
- <a id="e10"></a>**Schwab Asset Management holdings export (E10)** = `As-Of-Date + Symbol + Quantity + Percent_of_Assets + Name + BBG_FIGI + Coupon_Rate + Maturity_Date`
  *Fund holdings for Schwab funds (currently SCHP only): a date-stamped CSV linked from `schwabassetmanagement.com/products/<ticker>` (filename e.g. `SCHP_FundHoldings_2026-07-31.CSV`, discovered by scraping the link each run since the date changes). Schwab's site 403s plain HTTP requests (Akamai bot protection, confirmed by direct testing); `FundHoldings/schwab/updateSchpHoldings.js` uses Puppeteer (headless Chrome) to load the product page and fetch the CSV from within that page's session. Unlike E7-E9, this export carries no CUSIP (identifies securities by Bloomberg FIGI instead) and no dollar Market Value (only `Quantity` + a precise `Percent_of_Assets`). The scraper resolves both by matching each holding's `(Maturity_Date, Coupon_Rate)` — a unique key for TIPS — against [Market quotes (S7)](#s7) (FidelityTreasuriesTips.csv, which is CUSIP-keyed and carries price): `Quantity` is confirmed (by cross-checking against the fund's own abbreviated Market Value display) to already be inflation-adjusted current face value, not original par, so `Market Value = Quantity × (S7 Adjusted_ask_price / S7 Inflation_factor) / 100` (the *raw*, not inflation-adjusted, price — using the adjusted price would double-count the inflation factor already baked into `Quantity`). The fund's cash-sweep line ("SSC GOVERNMENT MM GVMXX") reports a Bloomberg FIGI with no CUSIP and isn't in Market quotes (S7) (not a Treasury/TIPS security); its CUSIP (7839989D1) is hardcoded from PIMCO (E9), which sweeps the same State Street fund and reports it directly. Expense ratio and SEC Yield (30 Day) are rendered directly into the already-loaded product page's key-stats table (no separate request) — the page also repeats expense ratio in a simpler summary-band span earlier in the page, but the scraper anchors on the detailed table row specifically. Fetched daily by the `FundHoldings` Windows Task, same as E7-E9.*
- <a id="e11"></a>**BondBloxx product-page holdings table (E11)** = `Name + CUSIP + Market_Value + Percent_of_Net_Assets`
  *Fund holdings for BondBloxx funds (currently XHLF only): unlike E7-E10, BondBloxx exposes no JSON/CSV API — the product page at `bondbloxxetf.com/<fund-slug>/` server-renders the full "All Holdings" table as static HTML (the page's own "Download CSV" button just re-serializes this same table client-side via JS), so `FundHoldings/bondbloxx/updateXhlfHoldings.js` fetches the page and parses the table directly (`<table border="1">`, the only one on the page with that exact attribute). Fund slug is hardcoded per ticker with no public ticker lookup. The table carries no Quantity, Coupon, or Maturity Date column: XHLF holds only zero-coupon T-Bills, whose `Name` reads `"US T BILL ZCP MM/DD/YY"` — Coupon (0) and Maturity Date are parsed from that suffix (analogous to fminvest.com (E8)'s name-suffix parsing); the CASHUSD and NET OTHER ASSETS balancing rows don't match the suffix pattern and are left with a blank Coupon/Maturity Date, naturally excluded downstream (no CUSIP match in the yield files). Expense ratio and 30-Day Sec Yield are rendered directly into the same already-fetched product page (no separate request). Fetched daily by the `FundHoldings` Windows Task, same as E7-E10.*
- <a id="e12"></a>**BlackRock iShares (E12)** = `Name + Sector + Asset_Class + Market_Value + Weight_(%) + Notional_Value + Par_Value + CUSIP + ISIN + SEDOL + Price + Duration + YTM_(%) + Maturity + Coupon_(%) + Mod._Duration + Real_Duration + Real_YTM_(%)`
  *Fund holdings for iShares funds (currently ICPI only), fetched as a plain CSV from `blackrock.com/varnish-api/blk-one01-product-data/product-data/api/v1/get-fund-document?...&portfolioId=<id>&component=holdings`, a preamble (fund name, as-of date, inception date) above the actual holdings table rather than a plain header-first CSV. Keyed by the fund's numeric `portfolioId` (visible in the product page URL) with no public ticker lookup, so it is hardcoded per fund in `FundHoldings/ishares/updateIcpiHoldings.js`. The endpoint accepts an `asOfDate` param but does not require it — a stale/mismatched date returns an empty body, while omitting it entirely returns the latest holdings (confirmed by direct testing), avoiding the chicken-and-egg problem of needing to know the fund's current as-of date before requesting it. Unlike E7-E11, the source itself reports `Duration`/`YTM`/`Real Duration`/`Real YTM`, but per the project's single-source-of-truth directive these are discarded, not ingested — `FundHoldings/enrichHoldings.js` computes Ask/SA/SAO Yield and Duration the same way for every fund, from [SA and SAO yields (S10)](#s10)/[Market quotes (S7)](#s7) by CUSIP, so a fund's figures are always comparable to every other fund's rather than mixing each provider's own (possibly differently-defined) analytics. Expense ratio and 30-Day SEC yield, however, are provider-reported figures with no cross-fund computation to replace them with — these come from a separate product-page fetch (not the holdings CSV), parsed out of the page's own schema.org JSON-LD block (`@graph` node ending `#key-datapoints`, `additionalProperty` entries named `"Expense Ratio:"` and `"30 Day SEC Yield as of"`) rather than HTML-scraping, since BlackRock renders it as clean structured data. Fetched daily by the `FundHoldings` Windows Task, same as E7-E11.*
- <a id="e13"></a>**Federal Reserve FEDS 2008-05 (E13)** = `@date + beta0 + beta1 + beta2 + beta3 + tau1 + tau2`
  *The Gürkaynak-Sack-Wright fitted TIPS real yield curve, published weekly by the Federal Reserve as `feds200805_1.html`. Source of [GSW curve parameters (S12)](#s12).*
- <a id="e14"></a>**Treasury Tentative Auction Schedule (E14)** = `{ AuctionDate + SecurityTermWeekYear + SecurityType + ReOpeningIndicator + TIPS + FloatingRate + AnnouncementDate + SettlementDate }`
  *Treasury’s schedule of upcoming auctions, published as XML at `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.xml` and revised at each Quarterly Refunding. Source of [Tentative auction schedule (S9)](#s9).*

---

<a id="2.0-data-stores-s"></a>
## 2.0 Data Stores (S)
*Internal R2 data files. Schemas are normalized from External Entities.*

- <a id="s1"></a>**FedInvest prices (S1)**, `YieldsFromFedInvestPrices.csv` = `Settlement_Date + { type + @cusip + maturity + coupon + ( datedDateCpi ) + price + yield }`
  *The first line holds the [Settlement Date](#settlement-date) alone, the second line is the header, and each line after it is one security: the [TIPS Prices](#tips-prices) and the [Treasury Prices](#treasury-prices), each with its yield. Written by [1.1 Download FedInvest prices and calculate yields](./1.1_Download_FedInvest_Prices.md).*

  | Column | Defined term |
  |---|---|
  | `type` | security type, as [FedInvest (E1)](#e1) states it: `TIPS`, `MARKET BASED BILL`, `MARKET BASED NOTE` or `MARKET BASED BOND` |
  | `cusip` | [CUSIP](#cusip) |
  | `maturity` | [Maturity Date](#maturity-date), `YYYY-MM-DD` |
  | `coupon` | [Coupon Rate](#coupon-rate), as a decimal |
  | `datedDateCpi` | dated date [Ref CPI](#ref-cpi), TIPS only |
  | `price` | [Price](#price) |
  | `yield` | [Yield](#yield) at the settlement date, as a decimal: real for a TIPS, nominal for every other security |

- <a id="s2"></a>**TIPS reference data (S2)**, `TipsRef.csv` = `{ @CUSIP + Maturity + DatedDate + Coupon + DatedDateRefCpi + Term }`
- <a id="s3"></a>**Ref CPI (S3)**, `RefCPI.csv` = `{ @Date + Ref_CPI }` *— authoritative retrieved NSA Ref CPI (TreasuryDirect), 1997-01-15 (the first TIPS ever issued) to present. Consumed by all apps. See [DataStores.md](./DataStores.md#s3) for how the full range is assembled and kept current.*
- <a id="s4"></a>**Ref CPI NSA and SA (S4)**, `RefCpiNsaSa.csv` = `{ @Date + CPI_NSA + CPI_SA + SA_Factor }` *— calculated (App. B daily interpolation), built for the SA pipeline: `CPI_NSA` and `CPI_SA` interpolated daily so `SA_Factor = CPI_NSA / CPI_SA`. The daily SA series has no official or retrieved equivalent — this is its **sole source**.*
- <a id="s5"></a>**Auction results (S5)**, `Auctions.csv` = `{ @CUSIP + @Auction_Date + Security_Type + High_Yield + Bid_to_Cover + Primary_Dealer_Accepted + ... }`
- <a id="s6"></a>**Yield history (S6)**, `YieldHistory` = `{ @Symbol + { [ Timestamp + Yield_Value ] } }`
- <a id="s8"></a>**CPI history (S8)**, `CPI_history.csv` = `{ @Year + @Period + PeriodName + NSA + SA }`
  *Full monthly BLS CPI-U history from January 1913 to present. NSA = `CUUR0000SA0`; SA = `CUSR0000SA0`. SA blank before 1947. R2 key: `bls/CPI_history.csv`.*
- <a id="s9"></a>**Tentative auction schedule (S9)**, `Tentative-Auction-Schedule.xml` = XML `{ AuctionCalendarDate: [ AuctionDate + SecurityTermWeekYear + SecurityType + ReOpeningIndicator + TIPS + FloatingRate + AnnouncementDate + SettlementDate ] }`
  *Mirror of the Treasury's Tentative Auction Schedule. Fetched directly by TreasuryAuctions to flag TIPS in the upcoming-auctions feed (matched by `AuctionDate` + `SecurityTermWeekYear`), since that feed lacks a native TIPS flag. R2 key: `Treasuries/Tentative-Auction-Schedule.xml`.*
- <a id="s10"></a>**SA and SAO yields (S10)**, `YieldsSaSao.csv` = `{ @cusip + maturity + coupon + ask_yield + sa_yield + sao_yield }`
  *TIPS ask/SA/SAO yields derived from [Market quotes (S7)](#s7), produced by `YieldCurves/scripts/updateSaSaoYields.js` (triggered by the `FidelityQuotes` task). Consumed by TipsLadderManager (`sa_yield`, for the within-year allocation policy), by FundHoldings (enriches TIPS fund holdings with seasonally-adjusted yield), and by SeasonalAdjustments through a committed snapshot rather than this object. R2 key: `TIPS/YieldsSaSao.csv`.*
- <a id="s11"></a>**Fund holdings (S11)**, `FundHoldings/Holdings-<TICKER>(-Enriched).csv` — Vanguard/fminvest/PIMCO/Schwab/BondBloxx/iShares fund holdings (E7/E8/E9/E10/E11/E12), raw and enriched, one pair per fund ticker (VBIL, VTIP, VTP, RBIL, LTPZ, SCHP, XHLF, ICPI). Own top-level R2 prefix (`FundHoldings/`) rather than nested under `TIPS/`/`Treasuries/`: a single fund's holdings CSV mixes TIPS and nominal rows (discriminated downstream by CUSIP presence in SA and SAO yields (S10), not a column flag), so it doesn't belong to either instrument-type prefix — same rationale as `misc/`. Also stores `FundHoldings/FundMeta.json` (`{ @Ticker: { fundName, portId | etfId | cusip | portfolioId, expenseRatio, secYield } }` — `expenseRatio`/`secYield` are percent-scale numbers, e.g. `0.09` for 0.09%, matching the Coupon column convention; each provider's own reported figure, not independently computed). Written by `FundHoldings/updateAllHoldings.js`; fetched directly by `FundHoldings/index.html` client-side.

- <a id="s12"></a>**GSW curve parameters (S12)**, `GswTipsCurve.json` = `@date + beta0 + beta1 + beta2 + beta3 + tau1 + tau2`
  *Latest published row of the Federal Reserve’s Gürkaynak-Sack-Wright fitted TIPS real yield curve (FEDS 2008-05): the six Svensson parameters and the observation date, nothing evaluated. YieldCurves evaluates the Svensson zero-yield formula from them to draw the GSW zero reference line against its own spot fit. R2 key: `TIPS/GswTipsCurve.json`.*

- <a id="s13"></a>**Yield curves (S13)**, `YieldCurves.csv` = `{ term_years + ( maturity_date + @cusip + type ) + source + ( ask_yield + sa_yield + sao_yield ) + ( spot_yield + spot_sa_yield ) }`
  *Evaluated yields, general-purpose and spreadsheet-ready — every priced Treasury (including STRIPS and, on Market-source rows, Unclassified) and TIPS security (`cusip`/`maturity_date`/`type` populated, `ask_yield`/`sa_yield`/`sao_yield` populated where they exist) plus the fitted nominal, TIPS-quoted and TIPS-SA [spot yield](../YieldCurves/knowledge/3.4_Fit_Spot_Yield_Curves.md) curves evaluated on a half-year term grid, as three rows per term per source (`cusip` = `Spot`, `maturity_date` blank; `type` is `Treasury`, `TIPS`, or `BEI`). `source` is `FedInvest` or `Market`. A `type = Treasury` grid row carries the fitted nominal spot in `spot_yield`. A `type = TIPS` grid row carries the fitted TIPS quoted spot in `spot_yield` and the fitted TIPS SA spot in `spot_sa_yield`. A `type = BEI` grid row carries `spot_yield` = nominal spot − TIPS quoted spot, and `spot_sa_yield` = nominal spot − TIPS SA spot, per [3.4 Fit spot yield curves §Spot BEI](../YieldCurves/knowledge/3.4_Fit_Spot_Yield_Curves.md#spot-bei) — there is no separate `bei` column; BEI is a `type`, computed directly from the fitted values already available at that term, not a second implementation. STRIPS security rows hold the yield calculated from their quoted price, as every other row does, and are excluded from the nominal curve's own fitting inputs, same as every other STRIPS exclusion in this pipeline. Unclassified (a Market-quote CUSIP root the [Treasury CUSIP Reference](./Treasury_CUSIP_Reference.md) does not recognise) gets the same fitting exclusion; it never appears on a FedInvest-source row, since [Select prices and add TIPS reference data (1.1.2)](./1.1_Download_FedInvest_Prices.md#select-prices-and-add-tips-reference-data) states its own type directly rather than deriving it from the CUSIP root. Renamed from `SpotYieldCurves.csv` (2026-09-07) — the file is a general yields resource, not spot-curves-only. Replaces the parameters-only `SpotYieldCurves.json` (retired 2026-09-07): six Svensson coefficients aren't usable in a spreadsheet, so this file stores actual yields via `shared/src/spot-curve.js` instead of the unevaluated parameters [GSW curve parameters (S12)](#s12) still uses. Written by `YieldCurves/scripts/updateSpotYieldCurves.js`, chained from `FidelityQuotes` and `YieldsFromFedInvestPrices` rather than scheduled on its own clock (see [Data_Pipeline.md](./Data_Pipeline.md)). R2 key: `Treasuries/YieldCurves.csv`.*

- <a id="s14"></a>**Breakeven inflation (S14)**, `BreakevenInflation.csv` = `{ @cusip + maturity + coupon + ask_yield + sa_yield + sao_yield + nominal_cusip + nominal_maturity + nominal_yield + ask_bei + sa_bei + sao_bei }`
  *Per-TIPS [breakeven inflation](#sa-yield): the Ask/SA/SAO yield for each TIPS against the yield of its nearest-maturity nominal Treasury, `Market` source only (BEI needs the nominal and TIPS yields quoted the same way — [3.4 Fit spot yield curves](../YieldCurves/knowledge/3.4_Fit_Spot_Yield_Curves.md)). Written by `YieldCurves/scripts/updateSpotYieldCurves.js`. R2 key: `Treasuries/BreakevenInflation.csv`.*

- <a id="s15"></a>**Bid and ask spreads (S15)**, `BidAskSpreads.csv` = `{ @security_type + @cusip + maturity + coupon + ask_yield + bid_yield + yield_spread_bps + ask_price + bid_price + price_spread_pct }`
  *Per-security broker bid/ask yield and price spread, TIPS and nominal Treasuries combined (`security_type` = `TIPS` or `Treasury`, same discrimination as [Market quotes (S7)](#s7)'s `Product` column), `Market` source only (FedInvest carries a single price, not a separate bid and ask). Written by `YieldCurves/scripts/updateSpotYieldCurves.js`. R2 key: `Treasuries/BidAskSpreads.csv`.*
- <a id="s16"></a>**Bond holidays (S16)**, `BondHolidaysSifma.csv` = `{ Date + Holiday_Name }` *— SIFMA's US bond-market holiday schedule, filtered to the eleven base US market holidays plus New Year's Day. Backs the [Bond Holiday](#bond-holiday) term. R2 key: `misc/BondHolidaysSifma.csv`.*
- <a id="s17"></a>**Monthly CPI (S17)**, `CPI.csv` = `{ @Year + @Period + PeriodName + NSA + SA }` *— the same BLS series as [CPI history (S8)](#s8), 2019 to present, fetched separately so the daily App. B interpolation that produces [Ref CPI NSA and SA (S4)](#s4) does not depend on S8's own release-date-triggered refresh. R2 key: `bls/CPI.csv`.*
- <a id="s18"></a>**Intraday archive (S18)**, `intraday-raw/` = `{ @Symbol + @Date + { Feed: { TimeRange + { TradeTime + Close } } } + FetchedAtET }`
  *One immutable daily snapshot per symbol of the raw feeds [CNBC (E5)](#e5) served that day, plus the wall-clock time the snapshot was actually taken (`FetchedAtET`) — the last-resort source when its chart-bar feed itself returns nothing for a symbol. R2 key prefix: `Treasuries/yields-history/intraday-raw/`.*

- <a id="s7"></a>**Market quotes (S7)**, `FidelityTreasuriesTips.csv` — Combined Treasury + TIPS bid/ask quotes (replaces the old separate `FidelityTips.csv`/`FidelityTreasuries.csv` pair as of ~2026-06-23). Local drop path: `~/Downloads/FidelityTreasuriesTips.csv` (gitignored, re-downloaded fresh each run). R2 key: `Treasuries/FidelityTreasuriesTips.csv`.
  CSV columns (exact header names): `Product, Description, Cusip, State, Coupon, Frequency, Maturity date, Call protected, Call date, Moody's rating, S&P rating, Yield, Bid price/Quantity (min), Adjusted bid price, Inflation factor, Ask price/Quantity (min), Adjusted ask price, Ask yield to worst, Ask yield to sink, Ask yield to maturity, 3rd party price, Depth of book, Attributes`
  *`Product` = `Treasury` or `TIPS`; parsers filter on this column before further processing (Treasury rows lack `Inflation factor`/`Adjusted bid price`/`Adjusted ask price`; both row types carry `Yield`, which doubles as the bid yield column — there is no separate "Yield Bid" header in the combined export). Parser normalises headers to lowercase. Key fields used: `cusip`, `coupon`, `ask price/quantity (min)` (ask price, unadjusted), `bid price/quantity (min)` (bid price, unadjusted), `adjusted bid price`/`adjusted ask price` (TIPS only), `ask yield to maturity` (ask yield, percentage form), `yield` (bid yield, percentage form). In the Yield Curves app, both yields are always calculated from the quoted price for TIPS and Treasuries alike, never read from `ask yield to maturity` or `yield` — the two sides of a quote share one method, and the calculated figure is more accurate than either quoted one ([3.1.2](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#parse-market-quotes), [3.1.7](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#calculate-tips-yields), [3.1.8](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#calculate-treasury-yields)). `inflation factor` is likewise parsed but not used: the Index Ratio shown is calculated (`shared/src/ref-cpi.js#tipsIndexRatios`), not read from this column. `YieldCurves/scripts/updateSpotYieldCurves.js` calculates all four yields the same way, with the same shared functions. Price spread uses adjusted prices for TIPS (actual dollar cost) and raw prices for Treasuries: `yield_spread_bps = (yield_bid − ask_ytm) × 10000`; `price_spread_pct = (price_ask − price_bid) / price_ask × 100`. Footer line `Date downloaded MM/DD/YYYY HH:MM AM/PM` supplies the download timestamp.*

  **Column names.** The export uses its source's column names, not this dictionary's. Each one carries a defined term, and where a column name is a broker's own name for a quantity rather than a header, the synonym is recorded on that term:

  | Column in the export | Defined term |
  |---|---|
  | `Cusip` | [CUSIP](#cusip) |
  | `Coupon` | [Coupon Rate](#coupon-rate) |
  | `Maturity date` | [Maturity Date](#maturity-date) |
  | `Ask price/Quantity (min)` | [Price](#price), ask side |
  | `Bid price/Quantity (min)` | [Price](#price), bid side |
  | `Adjusted ask price` / `Adjusted bid price` | Price × [Index Ratio](#index-ratio), TIPS only |
  | `Inflation factor` | [Index Ratio](#index-ratio), TIPS only — the synonym is recorded there |
  | `Ask yield to maturity` | [Yield](#yield), [ask](#ask) side |
  | `Yield` | [Yield](#yield), [bid](#bid) side |
  | `Product` | security type: TIPS, or a nominal Treasury |


---

<a id="3.0-data-elements-primitives"></a>
## 3.0 Data Elements (Primitives)

<a id="cusip"></a>
### CUSIP
`CUSIP` = *9-character unique identifier for a Treasury security*

<a id="quantity"></a>
### Quantity
`Quantity` = *Integer number of $1,000 face-value units held (e.g., 50 = $50,000 face value)*

<a id="face-value"></a>
### Face Value
`Face_Value` = `Quantity × 1000` *(original, unadjusted principal — the baseline unit of account)*

<a id="par-value"></a>
<a id="par-value-nominal"></a>
### Par Value (Nominal)
`Par_Value_Nominal` = *Current principal value of a nominal Treasury. Equals Face Value at all times. For inflation-adjusted principal see [Par Value (Adjusted)](#par-value-adjusted).*

<a id="price"></a>
<a id="clean-price"></a>
### Price
`Price` = *Market value expressed as percentage of par (e.g., 102.5 = 102.5% of par), before inflation adjustment. By convention, "price" means this clean price — excluding accrued interest — unless dirty price is named explicitly, though dirty price (clean price plus accrued interest) is rarely invoked for a TIPS in practice, since the accrued interest on a TIPS is itself inflation-adjusted. Canty (2009) formal notation for the clean price: CP. Canty's own "dirty price" (DP) is a different quantity from that market-convention sense, unrelated to accrued interest: `DP = CP × Index Ratio`, what this codebase calls [Adjusted ask price / Adjusted bid price](#s7) for a TIPS.*

<a id="accrued-interest-nominal"></a>
### Accrued Interest (Nominal)
`Accrued_Interest_Nominal` = `(Coupon_Rate / 2 × 100) × (A / E)` *(interest owed to the seller since the last coupon date, per $100 par — Actual/Actual day count: A = days since last coupon, E = days in the current coupon period. NOT a flat half-coupon. For TIPS, index-ratio adjusted: see [Accrued Interest (Adjusted)](#accrued-interest-adjusted).)*

<a id="settlement-date"></a>
### Settlement Date
`Settlement_Date` = *The date on which a bond trade is settled. Standard system logic: [ Trade_Date + 1 Bond Trading Day (T+1) | Manual_Override ]. T+1 excludes weekends and US bond market holidays (source: BondHolidaysSifma.csv).*

*Each source’s settlement date is determined once, by the process that assigns it:*

- *Market quotes ([S7](#s7)): the [Download Date](#download-date) plus one bond trading day (T+1), in [3.1.6 Determine settlement date](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#determine-settlement-date).*
- *FedInvest prices ([S1](#s1)): the date FedInvest states its prices are for (T+0), in [1.1.1 Determine settlement date](./1.1_Download_FedInvest_Prices.md#determine-settlement-date), where the basis for T+0 is recorded.*

<a id="download-date"></a>
### Download Date
`Download_Date` = *The date and time a market-quote file was downloaded, stated on its trailing `Date downloaded MM/DD/YYYY HH:MM AM/PM` line ([Market quotes (S7)](#s7)). It is the trade date from which the [Settlement Date](#settlement-date) of the quotes in the file is counted.*

<a id="bond-holiday"></a>
### Bond Holiday
`Bond_Holiday` = *A weekday on which the US bond market is closed, from the SIFMA holiday schedule in `misc/BondHolidaysSifma.csv`. It is not a bond trading day, so T+1 settlement passes over it.*

<a id="maturity-date"></a>
### Maturity Date
`Maturity_Date` = *Date on which principal is repaid to the bondholder*

<a id="term"></a>
<a id="years-to-maturity"></a>
### Term
`Term` = *The length of the period from a stated date to a security's [Maturity Date](#maturity-date), in years. **Years to maturity** is the same measure. Below one year the denominator is the actual number of days in the year beginning at the stated date, 365 or 366; from one year the denominator is 365.25, the average calendar year, so that a term spanning several years does not move with the placement of a single leap day. `shared/src/bond-math.js#termYears` is the one implementation.*

*The use names the date the period runs from. A price, a yield and every point on a [Yield Curve](#yield-curve) are stated at a [Settlement Date](#settlement-date), so a term stated alongside them runs from that settlement date, and not from the date the figure is read: the same prices then give the same term at every reading. Measured from the [Dated Date](#dated-date) instead, the same period is the term the security was issued for, which is what [TIPS reference data (S2)](#s2) records and what names a 10-Year Note.*

<a id="dated-date"></a>
### Dated Date
`Dated_Date` = *For a TIPS, the 15th of the month of issue, and the date inflation indexation is stated relative to: the [Index Ratio](#index-ratio) is 1.00000 on the dated date, because the [Ref CPI](#ref-cpi) of that date is the ratio’s denominator. The issue date is the last business day of the month, so for a TIPS the dated date and the issue date never coincide.*

For nominal Treasuries, 31 CFR §356.2 applies: *"Dated date means the date from which interest accrues for notes and bonds. The dated date and issue date are usually the same."* That sense governs auction accrued interest. For TIPS the reg’s exception is the rule, the dated date always falling before the issue date.

<a id="coupon-rate"></a>
### Coupon Rate
`Coupon_Rate` = *Fixed annual interest rate paid by the security, expressed as a decimal*

<a id="yield"></a>
### Yield
`Yield` = *Yield-to-Maturity (YTM): the discount rate equating present value of all future cash flows to the current price. Computed with Actual/Actual day count, semi-annual compounding (Excel `YIELD(settlement, maturity, rate, pr, redemption, 2, 1)` convention) for every coupon-bearing security regardless of remaining time to maturity — frequency is always 2, never a separate near-maturity simple-discounting case. Zero-coupon Treasury Bills are the one exception: priced via the simple investment-rate convention (`365/days-to-maturity`), since they have no coupon schedule to apply frequency/day-count to in the first place.*

<a id="yield-curve"></a>
### Yield Curve
`Yield_Curve` = *A plot of yield against term or maturity.*

<a id="spot-yield"></a>
<a id="zero-coupon-yield"></a>
### Spot Yield
`Spot_Yield` = *`z(t)`, the rate applying to a single cash flow at horizon `t`. Also **zero-coupon yield**: a security paying one cash flow and nothing before it earns exactly this rate, which is where the second name comes from. Distinct from [Yield](#yield), which applies one rate to every cash flow of a coupon-bearing security regardless of when it falls.*

<a id="par-yield"></a>
### Par Yield
`Par_Yield` = *The coupon rate at which a security of maturity `t` prices at par, given the [Spot Yield](#spot-yield) curve.*

<a id="forward-rate"></a>
### Forward Rate
`Forward_Rate` = *`f(t)`, the instantaneous rate implied for horizon `t` by the [Spot Yield](#spot-yield) curve.*

<a id="breakeven-inflation"></a>
<a id="bei"></a>
### Breakeven Inflation (BEI)
`Breakeven_Inflation` = *A nominal yield less a real yield. The difference is the inflation rate at which holding the nominal security and holding the TIPS return the same amount, hence the name.*

*Two constructions are in use and they do not give the same figure, so a breakeven is stated with the construction that produced it:*

- ***per security*** — *a TIPS yield subtracted from the yield of the nominal whose maturity is nearest to it. The pairing has no distance limit, so where nominal maturities are sparse the two yields are for different terms (specified in [Calculate breakeven inflation (3.5)](../YieldCurves/knowledge/3.5_Calculate_Breakeven_Inflation.md#breakeven-inflation), and in [Render breakeven inflation (2.7)](../YieldsMonitor/knowledge/2.7_Render_Breakeven_Inflation.md) for Yields Monitor).*
- ***across terms*** — *the fitted real [Spot Yield](#spot-yield) curve subtracted from the fitted nominal one, read at the same term. No pairing is involved.*

<a id="inflation-compensation"></a>
### Inflation Compensation
`Inflation_Compensation` = *The Federal Reserve’s name for [Breakeven Inflation](#breakeven-inflation), used in the Gürkaynak-Sack-Wright work ([GSW curve parameters (S12)](#s12)). The same quantity, and a synonym rather than a second definition. It is not expected inflation on its own: it also contains an inflation risk premium and a TIPS liquidity premium.*

<a id="ask"></a>
<a id="bid"></a>
### Ask / Bid
`Ask` = *The price or yield at which a security may be bought; the side a buyer transacts on.*
`Bid` = *The price or yield at which a security may be sold.*
*Broker quote files carry both ([Market quotes (S7)](#s7)).*

<a id="tips"></a>
### TIPS
`TIPS` = *Treasury Inflation-Protected Securities: marketable U.S. Treasury securities whose principal is adjusted by changes in the Consumer Price Index (CPI-U NSA). Issued as notes (2–10y) or bonds (30y).*

<a id="treasury-bill"></a>
### Treasury Bill
`Treasury_Bill` = *U.S. Treasury security with original maturity ≤ 1 year. Issued at a discount; no coupon. Typical maturities: 4-Week, 8-Week, 13-Week, 17-Week, 26-Week, 52-Week.*

<a id="treasury-note"></a>
### Treasury Note
`Treasury_Note` = *U.S. Treasury security with original maturity of 2–10 years. Pays semi-annual coupons. Typical maturities: 2, 3, 5, 7, 10 Year.*

<a id="treasury-bond"></a>
### Treasury Bond
`Treasury_Bond` = *U.S. Treasury security with original maturity > 10 years. Pays semi-annual coupons. Typical maturities: 20, 30 Year.*

<a id="cpi-nsa"></a>
### CPI-U NSA
`CPI_NSA` = *Consumer Price Index for All Urban Consumers, Not Seasonally Adjusted (BLS series `CUUR0000SA0`, FRED `CPIAUCNS`). The reference index used for TIPS principal adjustments per 31 CFR § 356.*

<a id="cpi-sa"></a>
### CPI-U SA
`CPI_SA` = *Consumer Price Index for All Urban Consumers, Seasonally Adjusted (BLS series `CUSR0000SA0`, FRED `CPIAUCSL`). BLS removes the recurring seasonal pattern from CPI-U NSA with the X-13ARIMA-SEATS method; the seasonal factors are recalculated each February with the January release, revising the prior five years of seasonally adjusted data.*

<a id="cpi-change-p2p"></a>
### CPI Change (Point-to-Point)
`CPI_Change_P2P` = `(CPI[end] / CPI[start] − 1) × 100` *(Total percent change in CPI between two user-specified dates)*

<a id="cpi-change-yoy"></a>
### CPI Change (Year-over-Year)
`CPI_Change_YoY` = `(CPI[t] / CPI[t − 12 months] − 1) × 100` *(Annual inflation rate: percent change vs. same month prior year)*

<a id="cpi-change-mom"></a>
### CPI Change (Month-over-Month)
`CPI_Change_MoM` = `(CPI[t] / CPI[t − 1 month] − 1) × 100` *(Monthly inflation rate: percent change vs. prior month)*

<a id="rolling-cpi-change"></a>
### Rolling CPI Change
`Rolling_CPI_Change` = `(CPI[t] / CPI[t − N months] − 1) × 100` for each t *(Continuous series of trailing N-month total percent change. N is user-specified.)*

<a id="cpi-cagr"></a>
### CPI CAGR
`CPI_CAGR` = `((CPI[end] / CPI[start])^(12 / N_months) − 1) × 100` *(Compound Annual Growth Rate over N months. Annualizes the point-to-point change.)*

---

<a id="4.0-financial-composites-formulas"></a>
## 4.0 Financial Composites & Formulas

**TIPS Elements**

<a id="ref-cpi"></a>
### Ref CPI
`Ref_CPI` = *Daily interpolated Consumer Price Index (CPI-U NSA) value used for TIPS calculations. Authority: 31 CFR § 356 Appendix B.* One value per **specific calendar day** (not "nearest" — see lookup rule below).
- **Dated:** `Ref_CPI_dated` — Reference CPI on the TIPS [Dated Date](#dated-date) (constant for the bond's lifetime). Carried as `datedDateCpi` in [FedInvest prices (S1)](#s1) and `DatedDateRefCpi` in [TIPS reference data (S2)](#s2). **Dated date Ref CPI** is the term, matching the Treasury FiscalData field it is sourced from (`ref_cpi_on_dated_date`). *Base CPI* was the earlier name and is retired.
- **Settle:** `Ref_CPI_settle` — Reference CPI on the Settlement Date

**Ref is short for Reference**, everywhere in these apps and in Treasury’s own field names. *Ref CPI* and *Reference CPI* are the same term, as are *dated date Ref CPI* and *dated date reference CPI*; the short form is the one to write.

**Two derivations — retrieved is authoritative, calculated is the fallback:**
- **Retrieved (authoritative):** TreasuryDirect SecIndex ([TreasuryDirect SecIndex (E2)](#e2)) → `RefCPI.csv` ([Ref CPI (S3)](#s3)). **All apps use this.**
- **Calculated (NSA fallback + educational):** 31 CFR App. B interpolation of the monthly CPI-U NSA series ([BLS (E4)](#e4)). For **NSA only**, this is a **fallback** used if retrieval is unavailable, and is retained for educational value. The retrieved and calculated NSA series **must agree** (verified by test).

**Seasonally adjusted daily Ref CPI is a calculated construct — the *only* source, never a fallback.** BLS publishes **monthly** CPI-SA alongside CPI-NSA, but there is **no official daily SA Ref CPI**: App. B daily interpolation officially applies to **NSA only**, because NSA is what drives TIPS inflation accrual. The daily **SA Ref CPI** and **`SA_Factor`** (`RefCpiNsaSa.csv`, [Ref CPI NSA and SA (S4)](#s4)) were devised here for seasonal yield comparison, so they are **necessarily calculated** and must always be produced. The App. B interpolation is defined once in `shared/src/ref-cpi.js` and applied to both series (NSA and SA); the math is shared, but SA production is never removed.

**Lookup rule:** exact entry for the requested date; `null` if the date is **outside the published range** (before the series starts or past the last published day). The series carries one row per calendar day, so within range there is always an exact match — there is no "snap to an earlier date."

**Single implementation:** all Ref CPI logic (retrieve-lookup, calc-fallback, index ratio) lives once in `shared/src/ref-cpi.js`; every app imports it. No per-app copies.

<a id="index-ratio"></a>
<a id="inflation-factor"></a>
### Index Ratio
`Index_Ratio` = `Ref_CPI_settle / Ref_CPI_dated`

*Index ratio is the Treasury’s own term and the one used throughout. Brokers name the same quantity differently, so a broker’s name for it is a synonym rather than a second definition: the Fidelity export ([Market quotes (S7)](#s7)) calls it the **inflation factor**.*

<a id="par-value-adjusted"></a>
### Par Value (Adjusted)
`Par_Value_Adjusted` = `Face_Value × Index_Ratio` *(inflation-adjusted principal, also called Adjusted Principal)*

<a id="annual-interest-real"></a>
### Annual Interest (Real)
`Annual_Interest_Real` = `Face_Value × Coupon_Rate` *(coupon applied to fixed face value — constant in real terms)*

<a id="annual-interest-nominal"></a>
### Annual Interest (Nominal)
`Annual_Interest_Nominal` = `Par_Value_Adjusted × Coupon_Rate` *(coupon applied to inflation-adjusted principal)*

<a id="pi"></a>
### P+I
`P+I` = *Principal + Last-Year Interest: the combined cash flow a [Funded Year](#funded-year) receives from the securities maturing in it, being their principal together with their [Last-Year Interest](#last-year-interest).*

<a id="pi-per-tips"></a>
### P+I per TIPS
`P+I_per_TIPS` = `Par_Value_Adjusted + (Annual_Interest_Nominal × [0.5 | 1.0])` *Total inflation-adjusted cash flow in the maturity year. See TIPS_Basics.md for half-year rule.*

<a id="cost-per-tips"></a>
### Cost per TIPS
`Cost_per_TIPS` = `(Price / 100) × Index_Ratio × 1000` *(nominal cost to purchase one $1,000 face-value unit)*

<a id="accrued-interest-adjusted"></a>
### Accrued Interest (Adjusted)
`Accrued_Interest_Adjusted` = `Accrued_Interest_Nominal / 100 × Index_Ratio × 1000` *(index-ratio-adjusted accrued interest per TIPS, real dollars — extends [Accrued Interest (Nominal)](#accrued-interest-nominal) the same way [Par Value (Adjusted)](#par-value-adjusted) extends [Par Value (Nominal)](#par-value-nominal). See TIPS_Basics.md §Accrued Interest.)*

---

**Ladder & Portfolio Elements**

<a id="bond-ladder"></a>
### Bond Ladder
`Bond_Ladder` = *A portfolio of securities with staggered maturities that produces a consistent cash flow at regular intervals. In these applications each rung is one calendar year. Specified in [1.0 Bond Ladders](../TipsLadderManager/knowledge/1.0_Bond_Ladders.md).*

<a id="tips-ladder"></a>
### TIPS Ladder
`TIPS_Ladder` = *A [Bond Ladder](#bond-ladder) built from TIPS, its targets and amounts stated in real terms: [DARA](#dara) and [ARA](#ara) take the place of [DAA](#daa) and [AA](#aa). Bond ladder is the generic term and carries no implication either way: a bond ladder may be built from nominal Treasuries or from TIPS. Specified in [2.0 TIPS Ladders](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md), which builds on 1.0.*

<a id="ladder"></a>
<a id="ladder-period"></a>
### Ladder
`Ladder` = *[Bond Ladder](#bond-ladder), or [TIPS Ladder](#tips-ladder) in a TIPS context. A TIPS ladder is a subset of bond ladders. A ladder runs from its first year to its last year, so "in the ladder" states the range without a separate term for it.*

<a id="maturity-year"></a>
### Maturity Year
`Maturity_Year` = *A calendar year in which outstanding TIPS mature. Maturity years are the superset from which [Funded Years](#funded-year) are drawn: a maturity year becomes a funded year when a [DARA](#dara) is specified for it.*

<a id="funded-year"></a>
### Funded Year
`Funded_Year` = *A [Maturity Year](#maturity-year) for which a [DARA](#dara) is specified, and for which total cash flow is calculated. A maturity year lying inside the [Ladder](#ladder) with no DARA specified is a **missing rung**, the ladder analogy holding: the step is absent. Term adopted from tipsladder.com, so that users moving between the two applications meet the same one.*

<a id="funded-year-tips"></a>
### Funded Year TIPS
`Funded_Year_TIPS` = *The TIPS that contribute to the [ARA](#ara) for a [Funded Year](#funded-year): the securities maturing in that year, whose principal at maturity applies toward it.*

<a id="rung"></a>
### Rung
`Rung` = *Synonym for [Funded Year](#funded-year). From the ladder metaphor: each rung is one calendar year (1.0 Bond Ladders §Bond Ladder Concepts).*


<a id="daa"></a>
### DAA
`DAA` = *Desired Annual Amount: target total cash flow for a funded year in nominal terms (generic bond ladders)*

<a id="aa"></a>
### AA
`AA` = *Annual Amount: actual cash flow produced for a funded year in nominal terms. May differ from DAA due to rounding.*

<a id="dara"></a>
### DARA
`DARA` = *Desired Annual Real Amount: target total cash flow for a funded year in real (inflation-adjusted) terms (TIPS ladders)*

<a id="ara"></a>
### ARA
`ARA` = `Funded_PI + LMI + Same_Maturity_Excess_Interest` *(Annual Real Amount: total real cash flow produced for a Funded Year)*

Displayed as **Amount**, and as **Real Amount** where a fuller header fits. The header drops *Annual* because it applies to each funded year while the totals row beneath is not annual, and drops *Real* because every principal and interest value in a TIPS ladder is inflation-adjusted, so real is implied throughout. The Cost and Quantity headers drop *Annual* for the same reason.

<a id="lmi"></a>
### LMI
`LMI` = `Σ Annual_Interest_Real for TIPS maturing in years > Current_Year` *(Later Maturity Interest: interest contributions to the current funded year from bonds maturing in future years)*

<a id="same-maturity-excess-interest"></a>
<a id="same-year-excess-interest"></a>
### Same-Maturity Excess Interest
`Same_Maturity_Excess_Interest` = `Σ Annual_Interest_Real for bracket or cover excess TIPS maturing in Current_Year`
*Bracket or cover excess TIPS ([Duration Matching](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#duration-matching-brackets)) are ordinary held bonds — their coupon interest behaves exactly like the interest on any other TIPS: paid in their own maturity year counts toward that year's Amount (this term, credited only to the year the excess bonds themselves mature), and it also continues flowing down into [LMI](#lmi) for every shorter-maturity year, same as any other coupon. Bracket excess (the lower/upper gap brackets) covers [Gap Years](#gap-years), where 10-year TIPS have not yet been issued; cover excess (the Future 30Y cover pair) covers [Future 30Y Rungs](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#future-30y-rungs-section), where 30-year TIPS have not yet been issued — the two are covered by different excess holdings. Example: excess TIPS held at the longest issued 30-year maturity, to cover the Future 30Y Rungs beyond it — their interest contributes to that maturity year's Amount as Same-Maturity Excess Interest, reducing its own rung's quantity, and the same coupon also flows down as ordinary LMI to every year below.*


<a id="amd"></a>
<a id="accrued-market-discount"></a>
### Accrued Market Discount (AMD)
`AMD` = *Income a TIPS bought below par earns as its price accretes toward par, under the constant-yield method. A par TIPS returns its whole yield as coupon; a deep-discount TIPS returns most of it as accretion instead, and that accretion is interest above the coupon. Counted like coupon interest, so it reduces the quantity a [Funded Year](#funded-year) needs, and earned on the whole held position each year regardless of how many TIPS are sold to turn it into cash. Applies to [Excess TIPS](#excess-tips) and [Cover Excess](#cover-excess) only: funded year TIPS are held to maturity and receive par, so their discount is already in [P+I](#pi) and counting it again would double it (2.0 §Future 30Y Cover AMD).*

<a id="pre-ladder-credit"></a>
<a id="pre-ladder-interest"></a>
### Pre-Ladder Interest (PLI)
`Pre_Ladder_Interest` = *Coupon interest and [AMD](#amd) earned on the ladder’s holdings in the years between settlement and the first funded year, pooled and credited to the earliest funded years until the pool is exhausted. Income arriving before the ladder starts paying out, which would otherwise go unused. Shown in the Amount popup as **Pre-ladder credit**, the share of the pool this funded year received. Enabled by the **Pre-ladder int.** control (2.0 §Pre-Ladder Interest).*

<a id="gap-years"></a>
### Gap Years
`Gap_Years` = *Years within the [Ladder](#ladder) for which no 10-year TIPS have yet been issued. The 10-year qualifier carries the definition: a ladder whose last year runs past the longest-dated issued 30-year TIPS also contains years with no issued TIPS, and those are Future 30Y Rungs rather than gap years, covered by different holdings.*

<a id="synthetic-tips"></a>
### Synthetic TIPS
`Synthetic_TIPS` = *A theoretical TIPS constructed for a [Gap Year](#gap-years) or a Future 30Y rung, never purchased. For a gap year the yield is interpolated from the surrounding issued maturities; for a Future 30Y rung it comes from the longest issued 30-year maturity, since there is nothing above it to interpolate between. [Index Ratio](#index-ratio) taken as 1.00000; price computed from its own yield and coupon.*

**The index ratio is an approximation.** A TIPS carries an index ratio of exactly 1.00000 on its [Dated Date](#dated-date), not on its issue date, and the two never coincide for a TIPS. A security modeled as issued today would therefore already be indexed by the days between them. 1.00000 is close enough for a rung that is never bought.

<a id="bracket-year"></a>
### Bracket Year
`Bracket_Year` = *A maturity year holding TIPS dedicated to duration matching. The bracket years surround the [Gap Years](#gap-years) — lower bracket year, then the gap years, then the upper bracket year — which is where the name comes from.*

*A bracket year that is also a [Funded Year](#funded-year) holds [Funded Year TIPS](#funded-year-tips) alongside its [Excess TIPS](#excess-tips). A bracket year whose DARA is 0 holds excess TIPS alone.*

*Short forms: **lower bracket** and **upper bracket** where the context is clear, **lower bracket year** for the year, **lower bracket year TIPS** for the securities.*

<a id="bracket-year-tips"></a>
<a id="bracket-maturity"></a>
### Bracket Year TIPS
`Bracket_Year_TIPS` = *The specific TIPS in a [Bracket Year](#bracket-year). Each TIPS has its own maturity date, so a bracket year may hold a January and a July maturity, and naming a bracket names the TIPS.*

<a id="excess-tips"></a>
### Excess TIPS
`Excess_TIPS` = *The TIPS a [Bracket Year](#bracket-year) holds for duration matching. The quantity follows from that bracket year’s [Bracket Weight](#bracket-weight), which the duration match determines. Named for the bracket year they serve: **excess lower bracket year TIPS**, **excess 2036 TIPS**.*

<a id="cover-year"></a>
### Cover Year
`Cover_Year` = *The Future 30Y counterpart of a [Bracket Year](#bracket-year). Future 30Y rungs lie beyond the longest-dated issued TIPS, so the maturity that would serve as their upper bracket has yet to be issued and the years covering them sit on one side only. They are called cover years for that reason, and their holdings are cover excess.*

<a id="bracket-weight"></a>
### Bracket Weight
`Bracket_Weight` = *The share of the [Gap Years](#gap-years)’ total cost carried by one [Bracket Year](#bracket-year). The weights across the bracket years sum to 1, solved so that the cost-weighted mean of the bracket year durations equals the average duration of the gap years:*

```
Σ (bracketWeight_b × bracketYearDuration_b) = average duration of the gap years
excessCost_b = gap total cost × bracketWeight_b
```

*A bracket year’s weight is what turns gap total cost into the cost of that bracket year’s [Excess TIPS](#excess-tips). Solved by `bracketWeights` / `bracketWeightsN` (`gap-math.js`); see 2.0 §2-Bracket Weights and §Retained Bracket Excess. Its Future 30Y counterpart is [Cover Weight](#cover-weight).*

<a id="outstanding-tips"></a>
<a id="ladder-eligible-tips"></a>
### Outstanding TIPS
`Outstanding_TIPS` = *A TIPS that has been issued and has not yet matured. A TIPS is issued on the last trading day of the month in which it is auctioned; between auction and issuance it exists in reference data but cannot be bought, so it is not yet outstanding and takes no part in ladder construction, rebalancing, or maturity selection. This is a property of the security, not of a mode: it applies identically to Build and Rebalance.*

<a id="active-lower-bracket"></a>
### Active Lower Bracket
`Active_Lower_Bracket` = *The most recently issued 10-year TIPS — the only [Bracket Maturity](#bracket-maturity) below the [Gap Years](#gap-years) a rebalance will **buy**. It absorbs whatever gap coverage the [Retained Bracket Excess](#retained-bracket-excess) does not supply, and it is the maturity used for lower bracket duration matching. Stated as a rule rather than a value because it advances as new TIPS are issued: it is whichever maturity currently satisfies the rule, not a fixed CUSIP or month.*

<a id="retained-lower-bracket"></a>
### Retained Lower Bracket
`Retained_Lower_Bracket` = *A [Bracket Maturity](#bracket-maturity) below the [Gap Years](#gap-years) older than the [Active Lower Bracket](#active-lower-bracket), still held and still carrying part of the duration match. It was used as the lower bracket at an earlier time and kept its excess when a later maturity took that role. Named alongside the active lower bracket: **retained lower** and **active lower** are the two lower brackets, while the excess held in the retained one is [Retained Bracket Excess](#retained-bracket-excess) — the bracket is the maturity, the excess is the holding.*

<a id="retained-bracket-excess"></a>
### Retained Bracket Excess
`Retained_Bracket_Excess` = *Excess held in a [Bracket Maturity](#bracket-maturity) older than the [Active Lower Bracket](#active-lower-bracket), carried forward from a time when that maturity was itself the lower bracket. A rebalance **never increases** it. It is sold **only** when total lower bracket excess exceeds the duration-matched target, **oldest maturity first**, and only until the overage is absorbed. Any number of older maturities may accumulate as successive maturities become active — the count is not fixed, so the structure is never named by how many brackets it contains.*

<a id="available-cash"></a>
### Available Cash
`Available_Cash` = *Cash on hand applied toward the [ARA](#ara) of the earliest [Funded Years](#funded-year). A pool, applied to the earliest funded year first and moving up the ladder until exhausted, so a year it covers in full needs no TIPS. Stated by the holder rather than detected: cash intended for reinvestment in the ladder is simply not entered (2.0 §Available Cash).*

<a id="net-cash"></a>
### Net Cash
`Net_Cash` = *The cash credit or debit left after a rebalance: the per-row cost deltas summed across the run. Negative when the rebalance buys more than it sells. Rebalance’s counterpart to [Total Cost](#total-cost).*

<a id="total-cost"></a>
### Total Cost
`Total_Cost` = *The cost of every TIPS a build says to buy: the [Funded Year](#funded-year) rung holdings, together with the [Excess TIPS](#excess-tips) held in the [Bracket Years](#bracket-year) and the cover excess held in the [Cover Years](#cover-year). That excess is held to cover a missing gap years or the Future 30Y rungs rather than to fund the maturity year it falls in, so its principal applies toward duration matching while its coupon interest applies toward that year’s ARA (see [Same-Year Excess Interest](#same-year-excess-interest)). Build’s counterpart to [Net Cash](#net-cash).*

<a id="reference-date"></a>
### Reference Date
`Reference_Date` = *The date a calculation is stated relative to. Restating per-year amounts to a Ref CPI uses that Ref CPI’s date as the reference date (3.0 §DARA Reference Date). In the two specific contexts of auction accrued interest and TIPS indexation, the term is [Dated Date](#dated-date).*

<a id="last-year-interest"></a>
### Last-Year Interest
`Last_Year_Interest` = *Interest paid in a funded year by securities maturing in that year. Treasuries pay semiannually, so a January–June maturity pays one coupon in its final year and a July–December maturity pays two (1.0 Bond Ladders §Bond Ladder Concepts).*

<a id="duration-matching"></a>
### Duration Matching
`Duration_Matching` = *Holding [Excess TIPS](#excess-tips) in the [Bracket Years](#bracket-year) that surround the [Gap Years](#gap-years), weighted by [Bracket Weight](#bracket-weight) so that the excess changes in value as the gap years would under a rate move. Modified duration throughout (2.0 §Duration Matching). The Future 30Y [Cover Years](#cover-year) work the same way.*

<a id="cover-year-tips"></a>
<a id="cover-maturity"></a>
### Cover Year TIPS
`Cover_Year_TIPS` = *The specific TIPS in a [Cover Year](#cover-year). The Future 30Y counterpart of [Bracket Year TIPS](#bracket-year-tips), and named the same way: naming a cover names the TIPS.*

<a id="cover-excess"></a>
### Cover Excess
`Cover_Excess` = *The TIPS a [Cover Year](#cover-year) holds for duration matching. The Future 30Y counterpart of [Excess TIPS](#excess-tips): the quantity follows from that cover year’s [Cover Weight](#cover-weight), which the duration match determines.*

<a id="cover-weight"></a>
### Cover Weight
`Cover_Weight` = *The share of the Future 30Y years’ total cost carried by one [Cover Year](#cover-year). The Future 30Y counterpart of [Bracket Weight](#bracket-weight), solved the same way and held within 0 to 1:*

```
Σ (coverWeight_c × coverYearDuration_c) = average duration of the Future 30Y years
coverExcessCost_c = Future 30Y total cost × coverWeight_c
```

*Both cover years mature before the years they cover, so **lower** and **upper** rank them by duration rather than by maturity: a deep-discount cover carries an unusually long duration for its maturity, and can be the upper cover while maturing first. Where the average duration of the Future 30Y years falls outside the span between the two cover durations, the weight would solve past 0 or 1; it is held at the nearer bound instead, and the duration match is not reached exactly. Solved by `bracketWeights` (`gap-math.js`); see 2.0 §Future 30Y Rungs.*

<a id="within-year-allocation-policy"></a>
### Within-Year Allocation Policy
`Within_Year_Allocation_Policy` = *Which candidate TIPS a rebalance trades for a [Funded Year](#funded-year) when more than one is in play. Rebalance only: a build splits its need evenly across every candidate (2.0 §Within-Year Allocation Policy).*

<a id="trade-ticket"></a>
### Trade Ticket
`Trade_Ticket` = *The list of trades required to construct the ladder shown, in either Build or Rebalance. Build and Rebalance generate a model of a ladder; executing the trades in the trade ticket is what constructs it.*

<a id="cash-flow-calendar"></a>
### Cash Flow Calendar
`Cash_Flow_Calendar` = *When a portfolio’s current holdings pay, and how much, by date. Independent of funded years, DARA, brackets, gaps and covers: a fact about the held CUSIPs and quantities rather than a ladder-construction result (5.0 §Cash Flow Calendar).*

---

**Seasonal Adjustment (SA) Elements**

<a id="sa-factor"></a>
### SA Factor
`SA_Factor` = `Ref_CPI_NSA(date) / Ref_CPI_SA(date)` *(daily ratio that isolates the seasonal component of the Ref CPI. `Ref_CPI_NSA` is the Treasury-published Ref CPI. `Ref_CPI_SA` applies the same 31 CFR App. B daily interpolation to BLS's monthly seasonally adjusted CPI-U — a constructed series, since no official seasonally adjusted Ref CPI exists. Analogous to the monthly seasonal factors BLS publishes (`NSA index / SA index`, shown ×100 to 3 dp), but daily and unscaled. Stored unrounded in [`RefCpiNsaSa.csv`](#s4); lookup via `shared/src/ref-cpi.js#saFactorForDate`.)*

<a id="sa-yield"></a>
### SA Yield
`SA_Yield` = *Real yield derived from a Seasonally Adjusted Clean Price. Removes the predictable seasonal component of CPI from the raw YTM.*

<a id="sao-yield"></a>
### SAO Yield
`SAO_Yield` = *[SA Yield](#sa-yield) with a further adjustment for **other** effects: the non-seasonal factors that move a TIPS away from a smooth curve. The `O` is *other*. Seasonality is identified and removed by name; the remaining deviations are not individually identified, and are removed together by fitting the SA yields to a smooth curve and reading each TIPS from that fit. Institutional participants act on relative-value factors this project cannot enumerate, so the step removes them as a class rather than by a named list. Distinct from the outlier index `O_t` of [FACP](#facp), which Canty determines analytically per known event ([3.3](../YieldCurves/knowledge/3.3_Adjust_For_Other_Effects.md)).*

<a id="sacp"></a>
### SACP
`SACP` = *Seasonally Adjusted Clean Price (Canty 2009, Eq. 14 approximation): `SACP ≈ CP × SA_Price_Factor`. Removes the predictable seasonal component from the quoted clean price.*

<a id="sa-price-factor"></a>
### SA Price Factor
`SA_Price_Factor` = `SA_Factor(settlement date) / Maturity_SA_Factor` *(the multiplier applied to the quoted clean price to produce [`SACP`](#sacp), Canty 2009 Eq. 14.)*

**The two factors are not obtained the same way.** The settlement date factor involves no approximation: Treasury publishes the daily [Ref CPI](#ref-cpi) NSA for that date, the daily Ref CPI SA is calculated for the same date by the same interpolation ([SA Factor](#sa-factor)), and the factor is their ratio. The maturity date factor is an approximation for nearly every outstanding TIPS, and approaches 1.0 as the horizon lengthens — see [Maturity SA Factor](#maturity-sa-factor). The two are therefore never exactly equal, even where settlement and maturity fall on the same calendar month and day, so a whole number of years to maturity no longer implies no adjustment.

<a id="maturity-sa-factor"></a>
### Maturity SA Factor
`Maturity_SA_Factor` = *The [SA Factor](#sa-factor) for the maturity date, the denominator of the [SA Price Factor](#sa-price-factor). A maturity date inside the published [Ref CPI](#ref-cpi) series takes that date’s exact value. A maturity date beyond it has no published factor: the same calendar month and day is taken from the most recent completed cycle, and its departure from 1.0 is scaled by the [Credibility Factor](#credibility-factor) — `1 + (S_maturity − 1) × w(h)`. The second case covers nearly every outstanding TIPS, since most mature beyond the published series. `shared/src/ref-cpi.js#maturitySaFactor`; specified in [3.2 Adjust for seasonality](../YieldCurves/knowledge/3.2_Adjust_For_Seasonality.md#horizon-dependent-maturity-factor).*

*Measured: the factor for February 15, the maturity date of every 30-year TIPS, has a 30-year drift standard deviation of about 0.29% of price, against a current departure from 1.0 of −0.45%. The drift over the horizon the projection is used at is comparable to the whole adjustment being made, which is what the weight scales for ([Seasonal Factor Drift §4.1](../YieldCurves/knowledge/Seasonal_Factor_Drift.md#feb-15-dependency)).*

<a id="seasonal-amplitude"></a>
### Seasonal Amplitude
`Seasonal_Amplitude` = *`A`, the within-year spread of the [SA Factor](#sa-factor) across the twelve calendar months, as a standard deviation. Measured at 0.263% from frozen CPI vintages ([Seasonal Factor Drift §3](../YieldCurves/knowledge/Seasonal_Factor_Drift.md)). The signal term of the [Credibility Factor](#credibility-factor).*

<a id="seasonal-factor-drift"></a>
### Seasonal Factor Drift
`Seasonal_Factor_Drift` = *`σ_drift(month, h)`, the RMS change in one calendar month’s [SA Factor](#sa-factor) over a horizon of `h` years, measured from CPI history 1947 onward ([Seasonal Factor Drift §4](../YieldCurves/knowledge/Seasonal_Factor_Drift.md)). Held per calendar month, because the months do not drift at the same rate: December and the spring months drift fastest, and the long end of the TIPS curve is entirely February 15. The noise term of the [Credibility Factor](#credibility-factor). `shared/src/ref-cpi.js#seasonalDriftSigma`.*

<a id="credibility-factor"></a>
### Credibility Factor
`Credibility_Factor` = `A² / (A² + σ_drift(h)²)` *(`w(h)`, the fraction of a projected [SA Factor](#sa-factor)’s departure from 1.0 that survives at a horizon of `h` years. The signal-to-noise ratio of [Seasonal Amplitude](#seasonal-amplitude) against [Seasonal Factor Drift](#seasonal-factor-drift); both are measured rather than fitted, so the weight has no free parameter. The name is the established one: this is the credibility factor of actuarial credibility theory, Bühlmann’s `Z` at a single observation, and the expression is the posterior mean weight for a prior centred on 1.0. 1.0 at zero horizon, about 0.91 at 1 year, about 0.45 for February 15 at 30 years. Applied at every horizon with no floor, and applied only to a projected factor: the settlement date factor is measured and is never scaled. `shared/src/ref-cpi.js#credibilityFactor`.)*

<a id="facp"></a>
### FACP
`FACP` = *Fully Adjusted Clean Price (Canty 2009, Eq. 21): `FACP = CP × (S_settle / S_maturity) × (1 / O_maturity)`. Removes both the seasonal component and one-off outlier shocks. Provides the cleanest "trend" price for relative value analysis.*

<a id="sao-blend-weight"></a>
### SAO Blend Weight
`SAO_Blend_Weight` = *`w`, the weight given to the fitted smooth curve when forming the [SAO Yield](#sao-yield): `SAO = w × curve(maturity) + (1 − w) × SA`. `w` is 1 out to `SAO_BLEND_START_YRS` (5 years), declines linearly to 0 at `SAO_BLEND_END_YRS` (6 years), and is 0 beyond, where the SAO Yield is the SA Yield unchanged. Securities inside `SAO_NOISE_YRS` (0.5 years) are excluded from the fit, their SA yield being dominated by price noise. `shared/src/spot-curve.js` ([3.3](../YieldCurves/knowledge/3.3_Adjust_For_Other_Effects.md)).*

<a id="iqr-clip"></a>
### IQR Clip
`IQR_Clip` = *Y-axis floor applied to the Treasuries chart tab to suppress near-maturity Bills/Notes with extreme negative YTM. Floor = Q1 − max(1.0 × IQR, 0.5%) computed from positive-yield Bills + Notes values only. Does not remove data points — only adjusts the visible axis scale. Upper bound unconstrained.*

---

## 5.0 Global Constants

### 5.1 Issuance-Dependent Values

Some values are true only until Treasury issues more TIPS. Left inline as approximations across specs, they go stale silently — "Jan/Jul ≤~2035" was accurate when written and gave no signal when a Jul 2036 was auctioned.

**Protocol** (generalizes the [`REFCPI_CUSIP`](#5.0-global-constants) entry below, which already states a selection principle plus a rotation trigger):

1. **Specs state the rule, not the value.** A value appears only as illustration, marked with the date it was true.
2. **The volatile values live here**, each with the event that changes it — not scattered as inline approximations across 2.0, 3.0 and app help text.
3. **A test derives each value from live data and asserts it matches this table.** Issuance drift then fails a test instead of rotting unnoticed. This is verifying redundancy (two independent derivations, gated by an assertion), not a duplicated definition.

| Value | Rule | As of 2026-08-25 | Changes when |
|---|---|---|---|
| Gap years | Years in the ladder with no issued 10-year TIPS | 2037, 2038, 2039 | A 10-year TIPS maturing in a gap year is issued |
| Multi-maturity boundary | Years below it may hold more than one maturity month; at/above, 30-year February issues only | 2040 | 10-year issuance extends past the current boundary |
| Maturity-month pattern | Quarterly at the short end, January/July for 10-year, February for 30-year | quarterly ≤~2030, Jan/Jul ≤~2036, Feb 2040+ | Issuance calendar changes |
| Longest issued maturity year | Maturity year of the longest-dated issued TIPS | 2056 | A new 30-year TIPS is issued |
| Ladder’s last year, at most | Longest issued maturity year + 10, supporting a 40-year ladder (`maxLastYear`, `ladder-core.js`) | 2066 | A new 30-year TIPS is issued |
| Active lower bracket | [Active Lower Bracket](#active-lower-bracket) — latest outstanding maturity before the first gap year | Jul 2036 | The next pre-gap maturity is issued |

`LOWEST_LOWER_BRACKET_YEAR` = 2032 *(floor of the holdings search range for [retained bracket excess](#retained-bracket-excess): only maturity years in `[LOWEST_LOWER_BRACKET_YEAR, minGapYear)` are considered. Matches `rebalance-lib.js`.)*
`REFCPI_CUSIP` = "912810FD5" *(3.625% TIPS, issued 1998, matures 2028-04-15)* — CUSIP used to pull the authoritative daily Ref CPI from TreasuryDirect ([TreasuryDirect SecIndex (E2)](#e2)).
  **Selection principle (the rule, not the value):** Ref CPI is *market-wide* — identical across all TIPS on a given date — so the CUSIP only determines how far back history reaches. Use the **oldest TIPS not yet matured** to maximize available history. `912810FD5` fits today; **when it matures (2028-04-15), rotate to the next-oldest un-matured TIPS** and update `scripts/fetchRefCpi.js`. *(The stale value `912828V98` previously recorded here does not correspond to any TIPS.)*
`SIFMA_HOLIDAYS` = *The calendar of [Bond Holidays](#bond-holiday).*

---

<a id="6.0-data-flows"></a>
## 6.0 Data Flows

*The structures that pass between processes on the data flow diagrams. Each flow is named by the data it holds and composed from the terms above. A flow that holds one term alone, such as [Settlement Date](#settlement-date) or [Breakeven Inflation](#breakeven-inflation), links to that term and has no entry here.*

### 6.1 From external entities

- <a id="fedinvest-daily-price-list"></a>**FedInvest Daily Price List** = [FedInvest (E1)](#e1)
  *Every price [FedInvest (E1)](#e1) publishes for a security — Buy, Sell and End of Day alike. Only the Buy price is a midpoint of dealer bid and ask; [Select prices and add TIPS reference data (1.1.2)](./1.1_Download_FedInvest_Prices.md#select-prices-and-add-tips-reference-data) is what reduces this to the one [Price](#price) downstream processes use. Renamed from "Daily Mid-Market Prices" (2026-09-18): that name asserted of the whole flow what is only true of the Buy price.*
- <a id="daily-ref-cpi"></a>**Daily Ref CPI** = [TreasuryDirect SecIndex (E2)](#e2)
- <a id="auction-results"></a>**Auction Results** = *the auction records of* [FiscalData (E3)](#e3)
- <a id="tips-reference-data"></a>**TIPS Reference Data** = *the TIPS security records of* [FiscalData (E3)](#e3)
- <a id="monthly-cpi-u"></a>**Monthly CPI-U** = [BLS (E4)](#e4)
- <a id="market-yields"></a>**Market Yields** = [CNBC (E5)](#e5) chart-bar feed
- <a id="market-quotes"></a>**Market Quotes** = [Fidelity Fixed Income (E6)](#e6)
- <a id="live-quotes"></a>**Live Quotes** = [CNBC (E5)](#e5) quote service
- <a id="fund-holdings"></a>**Fund Holdings** = `[ Vanguard Advisors (E7) | fminvest.com (E8) | PIMCO (E9) | Schwab Asset Management holdings export (E10) | BondBloxx product-page holdings table (E11) | BlackRock iShares (E12) ]`
- <a id="gsw-curve-parameters"></a>**GSW Curve Parameters** = [Federal Reserve FEDS 2008-05 (E13)](#e13)
- <a id="tentative-auction-schedule"></a>**Tentative Auction Schedule** = [Treasury Tentative Auction Schedule (E14)](#e14)

### 6.2 Level 0 and Level 1

- <a id="source-data"></a>**Source Data** = `FedInvest_Daily_Price_List + Daily_Ref_CPI + Auction_Results + TIPS_Reference_Data + Monthly_CPI_U + Market_Yields + Market_Quotes + Fund_Holdings + GSW_Curve_Parameters + Tentative_Auction_Schedule`
  *Every flow from an external entity that process 1 reads, drawn as one flow into it at Level 1. [Live Quotes](#live-quotes) is not part of it: no acquisition job reads [CNBC (E5)](#e5)'s quote service — [Yields Monitor](../YieldsMonitor/knowledge/2.2_Read_Live_Quotes.md) reads it directly, the one flow at Level 1 that enters an app rather than process 1.*
- <a id="reference-data"></a>**Reference Data** = `{ FedInvest prices (S1) | TIPS reference data (S2) | Ref CPI (S3) | Ref CPI NSA and SA (S4) | Auction results (S5) | Yield history (S6) | Market quotes (S7) | CPI history (S8) | Tentative auction schedule (S9) | SA and SAO yields (S10) | Fund holdings (S11) | GSW curve parameters (S12) | Yield curves (S13) | Breakeven inflation (S14) | Bid and ask spreads (S15) | Bond holidays (S16) | Monthly CPI (S17) }`
  *The contents of the R2 data stores, written by process 1 and read by the apps.*
- <a id="app-inputs"></a>**App Inputs** = *What a user enters or selects in an app. [View Selections](#view-selections) are the Yield Curves case.*
- <a id="app-outputs"></a>**App Outputs** = *What an app shows a user. [Charts and Tables](#charts-and-tables) are the Yield Curves case.*
- <a id="downloaded-data-sets"></a>**Downloaded Data Sets** = `Yield curves (S13) + Breakeven inflation (S14) + Bid and ask spreads (S15)`
  *The three stores written for a user to download into a spreadsheet. No app reads them.*

### 6.3 Yield Curves

- <a id="tips-prices"></a>**TIPS Prices** = `{ @CUSIP + Coupon_Rate + Maturity_Date + Price + Ref_CPI_dated }`
  *Each TIPS in [FedInvest (E1)](#e1) that [TIPS reference data (S2)](#s2) also holds, with one [Price](#price) from E1 and the coupon rate, maturity date and dated date [Ref CPI](#ref-cpi) from TIPS reference data (S2). From 1.1.2 to 1.1.3, held in [FedInvest prices (S1)](#s1), and from 3.1.1 to 3.1.7. The [Settlement Date](#settlement-date) of the prices is a separate flow.*
- <a id="treasury-prices"></a>**Treasury Prices** = `{ @CUSIP + Security_Type + Coupon_Rate + Maturity_Date + Price }`
  *Each market-based bill, note and bond in [FedInvest (E1)](#e1), with one [Price](#price). From 1.1.2 to 1.1.3, held in [FedInvest prices (S1)](#s1), and from 3.1.1 to 3.1.8. The [Settlement Date](#settlement-date) of the prices is a separate flow.*
- <a id="tips-quotes"></a>**TIPS Quotes** = `{ @CUSIP + Coupon_Rate + Maturity_Date + Ask_Price + ( Bid_Price ) }`
  *The TIPS in [Market quotes (S7)](#s7), each with its [ask and bid](#ask) prices. From 3.1.2 to 3.1.7.*
- <a id="treasury-quotes"></a>**Treasury Quotes** = `{ @CUSIP + Security_Type + Coupon_Rate + Maturity_Date + Ask_Price + ( Bid_Price ) }`
  *The nominal Treasuries in [Market quotes (S7)](#s7), STRIPS included. From 3.1.2 to 3.1.8.*
- <a id="tips-yields"></a>**TIPS Yields** = `{ [ TIPS_Prices | TIPS_Quotes ] + Ask_Yield + ( Bid_Yield ) }`
  *Each TIPS with the [yield](#yield) calculated from its price at its settlement date ([3.1.7](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#calculate-tips-yields)). A quoted TIPS also has the yield of its bid price. From 3.1.7 to 3.2, 3.6 and 3.7. [Index Ratio](#index-ratio) is not part of this flow: it has no dependency on price or yield and is calculated separately, by `shared/src/ref-cpi.js#tipsIndexRatios`, not read from [Market quotes (S7)](#s7)'s `Inflation factor` column — that column is parsed but not used.*
- <a id="treasury-yields"></a>**Treasury Yields** = `{ [ Treasury_Prices | Treasury_Quotes ] + Ask_Yield + ( Bid_Yield ) }`
  *Each nominal Treasury with the [yield](#yield) calculated from its price at its settlement date. A quoted Treasury also has the yield of its bid price; a Treasury from [FedInvest prices (S1)](#s1) has one yield only, from the price [Select prices and add TIPS reference data (1.1.2)](./1.1_Download_FedInvest_Prices.md#select-prices-and-add-tips-reference-data) selects, not a true ask or a true bid. From 3.1.8 to 3.4, 3.5, 3.6 and 3.7.*
- <a id="sa-yields"></a>**SA Yields** = `{ TIPS_Yields + SA_Price_Factor + SA_Yield }`
  *Each TIPS with its [SA Price Factor](#sa-price-factor) and [SA Yield](#sa-yield). From 3.2 to 3.3 and 3.4.*
- <a id="sao-yields"></a>**SAO Yields** = `{ SA_Yields + SAO_Yield }`
  *Each TIPS with its [SAO Yield](#sao-yield). From 3.3 to 3.5 and 3.7.*
- <a id="spot-yield-curves"></a>**Spot Yield Curves** = `{ [ Treasury | TIPS | TIPS_SA ] + { Term + Spot_Yield } }`
  *For each source shown, one [Spot Yield](#spot-yield) curve per series: fitted to the nominal Treasuries, to the TIPS quoted prices and to the TIPS seasonally adjusted prices. From 3.4 to 3.5 and 3.7.*
- <a id="bid-and-ask-spreads"></a>**Bid and Ask Spreads** = `{ @CUSIP + Security_Type + Yield_Spread + Price_Spread }`
  *For each security quoted on both sides: the yield spread, the [bid](#ask) yield less the ask yield, in basis points; and the price spread, the ask price less the bid price, as a percentage of the ask price, from adjusted prices for a TIPS and clean prices for a nominal Treasury. [Bid and ask spreads (S15)](#s15) is the published form. From 3.6 to 3.7.*
- <a id="view-selections"></a>**View Selections** = *The choices a user makes on an app's own page, driving what it fetches and draws. Composition and destination differ by app:*

  - *Yield Curves: `Tab + ( Spread_Mode ) + { Source } + { Series } + Maturity_Range + Horizontal_Axis_Mode + IQR_Clip_Setting` — the Treasuries, TIPS or breakeven tab; spread mode; the sources and series shown; the range of maturities; calendar or term on the horizontal axis; and whether the [IQR Clip](#iqr-clip) applies. From the user to [Select view (3.7.1)](../YieldCurves/knowledge/3.7_Render_Charts_And_Tables.md#select-view), and from there to the processes that draw the selected view.*
  - *Yields Monitor: `Range + ( Custom_Start_Date + Custom_End_Date ) + { Symbol } + Tab + Show_Quoted + Show_SA + Sync_Zoom_And_Pan + Lock_Right` — the preset or Custom time range; the symbols checked; the active tab; whether the quoted and/or seasonally adjusted line is shown; and the two chart-navigation toggles. From the user to [Assemble range data (2.1)](../YieldsMonitor/knowledge/2.1_Assemble_Range_Data.md), which every other Yields Monitor process reads from in turn.*
- <a id="axis-scales"></a>**Axis Scales** = `Horizontal_Axis_Range + Vertical_Axis_Range`
  *The ranges of the two chart axes: the horizontal axis in calendar dates or in [Term](#term), and the vertical axis in yield, floored by any [IQR Clip](#iqr-clip). From 3.7.2 to 3.7.3, 3.7.4, 3.7.5 and 3.7.6.*
- <a id="drill-request"></a>**Drill Request** = `@CUSIP + Figure`
  *The security and the figure a user picks in a table, to see how the figure was calculated. From 3.7.4 to 3.7.7.*
- <a id="charts-and-tables"></a>**Charts and Tables** = *The views drawn for the user: the chart and the table of the selected tab, or the spread charts and table in spread mode. From 3.7.3, 3.7.4, 3.7.5 and 3.7.6 to the user, in Yield Curves; from [Render time series (2.5)](../YieldsMonitor/knowledge/2.5_Render_Time_Series.md), [Render yield curve snapshots (2.6)](../YieldsMonitor/knowledge/2.6_Render_Yield_Curve_Snapshots.md) and [Render breakeven inflation (2.7)](../YieldsMonitor/knowledge/2.7_Render_Breakeven_Inflation.md) to the user, in Yields Monitor.*

### 6.4 Yields Monitor

- <a id="yield-series"></a>**Yield Series** = `@Symbol + { Timestamp + Yield }`
  *One symbol's [Yield](#yield) readings over the active [View Selections](#view-selections) window, assembled from whichever combination of [Yield history (S6)](#s6), [Intraday archive (S18)](#s18) and [Market Yields](#market-yields) the range calls for. From [Assemble range data (2.1)](../YieldsMonitor/knowledge/2.1_Assemble_Range_Data.md) to every other Yields Monitor process.*
- <a id="day-change"></a>**Day Change** = `Latest_Yield − Prior_Close_Yield`
  *The change in [Yield](#yield) since the prior trading day's close, per symbol. `Latest_Yield` is [Live Quotes](#live-quotes)' own most recent reading, or the [Yield Series](#yield-series)'s own last point if that reading is unavailable. `Prior_Close_Yield` is ordinarily the Yield Series point timestamped 17:05 ET or earlier on the last prior trading day; when no such point exists, [Live Quotes](#live-quotes)' `PreviousDayClosing` field stands in. From [Calculate day change (2.3)](../YieldsMonitor/knowledge/2.3_Calculate_Day_Change.md) to 2.5.*
- <a id="sa-yield-series"></a>**SA Yield Series** = `@Symbol + { Timestamp + SA_Yield }`
  *A TIPS symbol's [Yield Series](#yield-series), each point carried through the same Price → SA Price → SA Yield transform [Adjust for seasonality (3.2)](../YieldCurves/knowledge/3.2_Adjust_For_Seasonality.md) applies to an actual TIPS, using the real bond that symbol quoted on that point's date (see [Adjust for seasonality (2.4)](../YieldsMonitor/knowledge/2.4_Adjust_For_Seasonality.md)). Distinct from [SA Yields](#sa-yields), Yield Curves' own per-security table: this is a time series, one row per symbol rather than per security. From 2.4 to 2.5, 2.6 and 2.7.*
- <a id="drill-popup"></a>**Drill Popup** = *The intermediate values behind one figure for one security: its seasonal adjustment, its other adjustment, or the definition of a column. From 3.7.7 to the user.*
