# Treasury Investors Portal Data Dictionary (DD)

**Scope:** Global — Covers all apps and pipelines in the Treasuries repo.
**Authority:** This document is the primary source of truth for all data definitions. It supersedes all other documentation for variable meanings and data structures.

---

<!-- DD-INDEX:START -->

## Index

*Every term below, alphabetically, including synonyms. The entries themselves are grouped by category in the sections that follow.*

**#** &nbsp; [5.1 Issuance-Dependent Values](#5.1-issuance-dependent-values)

**A** &nbsp; [AA](#aa) &middot; [Accrued Interest (Adjusted)](#accrued-interest-adjusted) &middot; [Accrued Interest (Nominal)](#accrued-interest-nominal) &middot; [Active Lower Bracket](#active-lower-bracket) &middot; [adjusted ask price](#adjusted-price) *(see Adjusted Price)* &middot; [adjusted bid price](#adjusted-price) *(see Adjusted Price)* &middot; [Adjusted Price](#adjusted-price) &middot; [amount](#ara) *(see ARA)* &middot; [Annual Interest (Nominal)](#annual-interest-nominal) &middot; [Annual Interest (Real)](#annual-interest-real) &middot; [App Inputs](#app-inputs) &middot; [App Outputs](#app-outputs) &middot; [ARA](#ara) &middot; [Ask / Bid](#ask) &middot; [Auction Results](#auction-results) &middot; [Auction results (S5)](#s5) &middot; [Available Cash](#available-cash) &middot; [Axis Scales](#axis-scales)

**B** &nbsp; [Before-State Preview](#before-state-preview) &middot; [bei](#breakeven-inflation) *(see Breakeven Inflation (BEI))* &middot; [bid](#ask) *(see Ask / Bid)* &middot; [Bid and Ask Spreads](#bid-and-ask-spreads) &middot; [Bid and ask spreads (S15)](#s15) &middot; [BlackRock iShares (E12)](#e12) &middot; [BLS (E4)](#e4) &middot; [Bond Holiday](#bond-holiday) &middot; [Bond holidays (S16)](#s16) &middot; [Bond Ladder](#bond-ladder) &middot; [BondBloxx product-page holdings table (E11)](#e11) &middot; [bracket maturity](#bracket-year-tips) *(see Bracket Year TIPS)* &middot; [Bracket Weight](#bracket-weight) &middot; [Bracket Year](#bracket-year) &middot; [Bracket Year TIPS](#bracket-year-tips) &middot; [Breakeven Inflation (BEI)](#breakeven-inflation) &middot; [Breakeven inflation (S14)](#s14) &middot; [Broker Positions Export](#broker-positions-export) &middot; [Build Result](#build-result)

**C** &nbsp; [Cash Flow Calendar](#cash-flow-calendar) &middot; [Charts and Tables](#charts-and-tables) &middot; [clean price](#price) *(see Price)* &middot; [CNBC (E5)](#e5) &middot; [Construction Parameters](#construction-parameters) &middot; [Cost per TIPS](#cost-per-tips) &middot; [Coupon Rate](#coupon-rate) &middot; [Cover Excess](#cover-excess) &middot; [cover maturity](#cover-year-tips) *(see Cover Year TIPS)* &middot; [Cover Weight](#cover-weight) &middot; [Cover Year](#cover-year) &middot; [Cover Year TIPS](#cover-year-tips) &middot; [CPI CAGR](#cpi-cagr) &middot; [CPI Change (Month-over-Month)](#cpi-change-mom) &middot; [CPI Change (Point-to-Point)](#cpi-change-p2p) &middot; [CPI Change (Year-over-Year)](#cpi-change-yoy) &middot; [CPI history (S8)](#s8) &middot; [CPI Series](#cpi-series) &middot; [CPI-U NSA](#cpi-nsa) &middot; [CPI-U SA](#cpi-sa) &middot; [Credibility Factor](#credibility-factor) &middot; [CUSIP](#cusip)

**D** &nbsp; [DAA](#daa) &middot; [Daily Ref CPI](#daily-ref-cpi) &middot; [DARA](#dara) &middot; [DARA Plan](#dara-plan) &middot; [DARA Plan File](#dara-plan-file) &middot; [Dated Date](#dated-date) &middot; [Day Change](#day-change) &middot; [Deck Content](#deck-content) &middot; [Deck Pages](#deck-pages) &middot; [Download Date](#download-date) &middot; [Downloaded Data Sets](#downloaded-data-sets) &middot; [Drill Popup](#drill-popup) &middot; [Drill Request](#drill-request) &middot; [Duration](#duration) &middot; [Duration Matching](#duration-matching)

**E** &nbsp; [Excess TIPS](#excess-tips) &middot; [Expected Excess](#expected-excess)

**F** &nbsp; [Face Value](#face-value) &middot; [FACP](#facp) &middot; [Federal Reserve FEDS 2008-05 (E13)](#e13) &middot; [FedInvest (E1)](#e1) &middot; [FedInvest Daily Price List](#fedinvest-daily-price-list) &middot; [FedInvest prices (S1)](#s1) &middot; [Fidelity Export](#fidelity-export) &middot; [FiscalData (E3)](#e3) &middot; [fminvest.com (E8)](#e8) &middot; [Forward Rate](#forward-rate) &middot; [Fund Holdings](#fund-holdings) &middot; [Fund holdings (S11)](#s11) &middot; [Funded Year](#funded-year) &middot; [Funded Year TIPS](#funded-year-tips)

**G** &nbsp; [Gap Years](#gap-years) &middot; [GSW Curve Parameters](#gsw-curve-parameters) &middot; [GSW curve parameters (S12)](#s12)

**H** &nbsp; [Holdings](#holdings) &middot; [Holdings Export](#holdings-export-format) &middot; [Holdings File](#holdings-file)

**I** &nbsp; [Index Ratio](#index-ratio) &middot; [Inflation Compensation](#inflation-compensation) &middot; [Inflation-Adjusted Principal](#inflation-adjusted-principal) &middot; [Intraday archive (S18)](#s18) &middot; [IQR Clip](#iqr-clip)

**L** &nbsp; [Ladder](#ladder) &middot; [ladder eligible tips](#outstanding-tips) *(see Outstanding TIPS)* &middot; [Ladder Export](#ladder-export) &middot; [Ladder Parameters](#ladder-parameters) &middot; [ladder period](#ladder) *(see Ladder)* &middot; [Ladder Table](#ladder-table) &middot; [Last-Year Interest](#last-year-interest) &middot; [Live Quotes](#live-quotes) &middot; [LMI](#lmi)

**M** &nbsp; [Market Quotes](#market-quotes) &middot; [Market quotes (S7)](#s7) &middot; [Market quotes source (E6)](#e6) &middot; [Market Yields](#market-yields) &middot; [Maturity Date](#maturity-date) &middot; [Maturity SA Factor](#maturity-sa-factor) &middot; [Maturity Year](#maturity-year) &middot; [Monthly CPI (S17)](#s17) &middot; [Monthly CPI-U](#monthly-cpi-u)

**N** &nbsp; [Net Cash](#net-cash)

**O** &nbsp; [Outstanding TIPS](#outstanding-tips)

**P** &nbsp; [P+I](#pi) &middot; [P+I per TIPS](#pi-per-tips) &middot; [Par](#par) &middot; [par value](#par) *(see Par)* &middot; [par value nominal](#par) *(see Par)* &middot; [Par Yield](#par-yield) &middot; [Pass 1](#pass-1) &middot; [Pass 2](#pass-2) &middot; [Per-Year DARA](#per-year-dara) &middot; [PIMCO (E9)](#e9) &middot; [Plain CUSIP/Quantity Format](#plain-format) &middot; [pre ladder interest](#pre-ladder-credit) *(see Pre-Ladder Interest (PLI))* &middot; [Pre-Ladder Interest (PLI)](#pre-ladder-credit) &middot; [Price](#price)

**Q** &nbsp; [Quantity](#quantity)

**R** &nbsp; [R2 Read Access](#r2-read-access) &middot; [Rebalance Result](#rebalance-result) &middot; [Ref CPI](#ref-cpi) &middot; [Ref CPI (S3)](#s3) &middot; [Ref CPI NSA and SA (S4)](#s4) &middot; [Reference Data](#reference-data) &middot; [Reference Date](#reference-date) &middot; [Retained Bracket Excess](#retained-bracket-excess) &middot; [Retained Lower Bracket](#retained-lower-bracket) &middot; [Rolling CPI Change](#rolling-cpi-change) &middot; [Rung](#rung)

**S** &nbsp; [SA and SAO yields (S10)](#s10) &middot; [SA Factor](#sa-factor) &middot; [SA Price Factor](#sa-price-factor) &middot; [SA Yield](#sa-yield) &middot; [SA Yield Series](#sa-yield-series) &middot; [SA Yields](#sa-yields) &middot; [SACP](#sacp) &middot; [same year excess interest](#same-maturity-excess-interest) *(see Same-Maturity Excess Interest)* &middot; [Same-Maturity Excess Interest](#same-maturity-excess-interest) &middot; [SAO Blend Weight](#sao-blend-weight) &middot; [SAO Yield](#sao-yield) &middot; [SAO Yields](#sao-yields) &middot; [Schwab Asset Management holdings export (E10)](#e10) &middot; [Schwab Export](#schwab-export) &middot; [Seasonal Amplitude](#seasonal-amplitude) &middot; [Seasonal Factor Drift](#seasonal-factor-drift) &middot; [Settlement Date](#settlement-date) &middot; [simulated future 30y tips](#simulated-outstanding-future-30y-tips) *(see Simulated Outstanding Future 30Y TIPS)* &middot; [Simulated Outstanding Future 10Y TIPS](#simulated-outstanding-future-10y-tips) &middot; [Simulated Outstanding Future 30Y TIPS](#simulated-outstanding-future-30y-tips) &middot; [Source Data](#source-data) &middot; [Spot Yield](#spot-yield) &middot; [Spot Yield Curves](#spot-yield-curves) &middot; [Synthetic TIPS](#synthetic-tips)

**T** &nbsp; [Tentative Auction Schedule](#tentative-auction-schedule) &middot; [Tentative auction schedule (S9)](#s9) &middot; [Term](#term) &middot; [TIPS](#tips) &middot; [TIPS Ladder](#tips-ladder) &middot; [TIPS Market Data](#tips-market-data) &middot; [TIPS Prices](#tips-prices) &middot; [TIPS Quotes](#tips-quotes) &middot; [TIPS Reference Data](#tips-reference-data) &middot; [TIPS reference data (S2)](#s2) &middot; [TIPS Reference Rows](#tips-reference-rows) &middot; [TIPS Yields](#tips-yields) &middot; [tipsladder.com Format](#tipsladdercom-format) &middot; [Total Cost](#total-cost) &middot; [Trade Ticket](#trade-ticket) &middot; [Treasury Bill](#treasury-bill) &middot; [Treasury Bond](#treasury-bond) &middot; [Treasury Note](#treasury-note) &middot; [Treasury Prices](#treasury-prices) &middot; [Treasury Quotes](#treasury-quotes) &middot; [Treasury Tentative Auction Schedule (E14)](#e14) &middot; [Treasury Yields](#treasury-yields) &middot; [TreasuryDirect (E15)](#e15) &middot; [TreasuryDirect SecIndex (E2)](#e2)

**U** &nbsp; [Upcoming Auctions](#upcoming-auctions)

**V** &nbsp; [Vanguard Advisors (E7)](#e7) &middot; [Vanguard Export](#vanguard-export) &middot; [View Selections](#view-selections)

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
  *TreasuryDirect’s daily price list for marketable Treasury securities, one row per security. The page states the date its prices are for on a `Prices For:` line, and its price table has the eight columns above, named as the page names them. Prices are published for the current business day and, on a separate page, for a past date. The three prices, and how Treasury derives them, are described in [FedInvest Treasury Pricing Methodology](../YieldCurves/knowledge/FedInvest_Treasury_Pricing_Methodology.md).*
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
    *A batched REST endpoint (`quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol`, one request for every symbol via a `|`-separated list), independent of the chart-bar feed above — a different mechanism CNBC exposes, not a different source. `Last`/`LastTime` are the latest yield and its quote time, current even when the chart-bar feed is frozen. `PreviousDayClosing` is an official settlement-quote reference distinct from either the chart-bar feed's own daily close or [Yields Monitor](../YieldsMonitor/knowledge/2.3_Calculate_Day_Change.md)'s own 17:05 ET session-close reference. `MaturityDate`/`Coupon` identify the one real TIPS a canonical-maturity symbol (e.g. `US2YTIPS`) is quoting today. Source of [Live Quotes](#live-quotes).*
- <a id="e6"></a>**Market quotes source (E6)** = `{ Product + Cusip + Coupon + Maturity date + Ask price + Bid price + ( Adjusted ask price ) + ( Adjusted bid price ) } + Date downloaded`
  *Broker ask and bid quotes, one combined download of the Treasury rows (Bills, Notes, Bonds and STRIPS) and the TIPS rows, told apart by `Product`: `Treasury` or `TIPS`. Only a TIPS row has the adjusted prices. A price is stated with the quantity quoted beside it; [1.2 Download market quotes](./1.2_Download_Market_Quotes.md) keeps the price alone. The fields above are the ones that process reads, and the download is kept on the local machine and is not published. How the download is obtained is out of scope for this entry; see [1.2 Download market quotes](./1.2_Download_Market_Quotes.md).*
- <a id="e7"></a>**Vanguard Advisors (E7)** = `CUSIP + Holding_Name + Ticker + Category + ( Quantity | Face_Amount ) + Coupon_Rate + Percent_Of_Fund + Market_Value + Maturity_Date + ISIN + SEDOL + As_Of_Date`
  *Fund holdings for Vanguard Treasury/TIPS funds (e.g., VBIL, VTIP, VTP), scraped from the public `advisors.vanguard.com` product holdings endpoint. Not every fund publishes a "daily" snapshot — the scraper tries `holdings/daily` first and falls back to `holdings/latest`. Expense ratio and 30-Day SEC yield (not in the holdings endpoint) come from two sibling endpoints on the same host: `api/funds/<portId>/fees` (`adjustedExpenseRatio.value`) and `api/funds/<portId>/analytics/yields` (`secYield.percent`). Fetched daily by the `FundHoldings` Windows Task (`FundHoldings/updateAllHoldings.js`), same as the rest of the ingestion pipeline.*
- <a id="e8"></a>**fminvest.com (E8)** = `field_symbol (CUSIP) + field_name (Holding_Name) + field_par_value (Quantity) + field_weightings (Percent_Of_Fund) + field_market_value + field_as_of_date`
  *Fund holdings for ETFs not covered by Vanguard's own API (currently RBIL only). Keyed by an internal numeric ETF id with no public ticker lookup, so the id is hardcoded per fund in `FundHoldings/fminvest/updateFminvestHoldings.js`. Coupon and maturity are parsed out of the trailing `"<coupon>% MM/DD/YYYY"` suffix on `field_name` — cash/sweep rows have no such suffix and are naturally excluded downstream. fminvest.com is F/m Investments' own site (the fund issuer), not a third-party aggregator; its separate product page (`fminvest.com/etfs/<slug>`) is scraped for expense ratio and 30-Day SEC yield, rendered directly into the page (no API call). Fetched daily by the `FundHoldings` Windows Task, same as Vanguard Advisors (E7).*
- <a id="e9"></a>**PIMCO (E9)** = `CUSIP + Description (Holding_Name) + Coupon_Rate + Percent_Of_Net_Assets + Market_Value + Notional/Par_Value_Quantity/Units + Maturity_Date + AsOfDate`
  *Fund holdings for PIMCO funds (currently LTPZ only), fetched as an xlsx export from `fund-ui.pimco.com/fund-detail-api/api/funds/<CUSIP>/topTenHoldings/export?asOfDate=9999-12-31` (despite the endpoint name, the far-future `asOfDate` returns full holdings, not just the top ten). Keyed by the fund's own CUSIP with no public ticker lookup, so it is hardcoded per fund in `FundHoldings/pimco/updateLtpzHoldings.js`. `Coupon_Rate` is rounded to 2 decimals by PIMCO (lossy for the eighth-of-a-percent coupons TIPS carry, e.g. 1.375% → "1.38"); the scraper instead parses the precise coupon from the trailing number in `Description` (e.g. "TSY INFL IX N/B 02/44 1.375"), falling back to `Coupon_Rate` only when `Description` has no parseable suffix (cash/sweep/currency lines). Expense ratio comes from `key-information` → `netExpenseRatio` (percent-scale already, not date-sensitive so fetched at "latest"). 30-Day SEC yield comes from `fund-stats` → `unsubsidized30SecYield` × 100 (a true fraction, unlike every other PIMCO field used here — confirmed by grepping the product page's own Angular bundle for the label's data binding, present at two separate places on the page, both bound to this exact field). `key-statistics`' similarly-named `subsidizedSecYield` is a different, month-end (not live-daily) figure and is *not* what the page displays under "30-Day SEC Yield" — do not use it. The `asOfDate=9999-12-31` "latest" trick (used for every other endpoint on this API, including the holdings export) does *not* apply to `unsubsidized30SecYield`: PIMCO's backend already has a business day's worth of that figure the product page hasn't published yet (confirmed by direct testing — the page kept showing a stale value even after a hard refresh, i.e. a genuine backend lag on this specific regulatory figure, not caching). SEC yield must be for the same date as the holdings themselves (the as-of date already shown in the app's banner) — rather than guessing a fixed day-offset, the scraper fetches `fund-stats` at that exact `asOfDate` (converted from the holdings export's own `AsOfDate:` line). Fetched daily by the `FundHoldings` Windows Task, same as E7/E8.*
- <a id="e10"></a>**Schwab Asset Management holdings export (E10)** = `As-Of-Date + Symbol + Quantity + Percent_of_Assets + Name + BBG_FIGI + Coupon_Rate + Maturity_Date`
  *Fund holdings for Schwab funds (currently SCHP only): a date-stamped CSV linked from `schwabassetmanagement.com/products/<ticker>` (filename e.g. `SCHP_FundHoldings_2026-07-31.CSV`, discovered by scraping the link each run since the date changes). Schwab's site 403s plain HTTP requests (Akamai bot protection, confirmed by direct testing); `FundHoldings/schwab/updateSchpHoldings.js` uses Puppeteer (headless Chrome) to load the product page and fetch the CSV from within that page's session. Unlike E7-E9, this export carries no CUSIP (identifies securities by Bloomberg FIGI instead) and no dollar Market Value (only `Quantity` + a precise `Percent_of_Assets`). The scraper resolves both by matching each holding's `(Maturity_Date, Coupon_Rate)` — a unique key for TIPS — against [Market quotes (S7)](#s7) (which is CUSIP-keyed and carries price): `Quantity` is confirmed (by cross-checking against the fund's own abbreviated Market Value display) to already be the [Inflation-Adjusted Principal](#inflation-adjusted-principal), not the par, so `Market Value = Quantity × the ask Price / 100` (the ask [Price](#price), not the [Adjusted Ask Price](#adjusted-price): `Quantity` is already inflation-adjusted, so the Adjusted Ask Price would count the inflation adjustment twice). The fund's cash-sweep line ("SSC GOVERNMENT MM GVMXX") reports a Bloomberg FIGI with no CUSIP and isn't in Market quotes (S7) (not a Treasury/TIPS security); its CUSIP (7839989D1) is hardcoded from PIMCO (E9), which sweeps the same State Street fund and reports it directly. Expense ratio and SEC Yield (30 Day) are rendered directly into the already-loaded product page's key-stats table (no separate request) — the page also repeats expense ratio in a simpler summary-band span earlier in the page, but the scraper anchors on the detailed table row specifically. Fetched daily by the `FundHoldings` Windows Task, same as E7-E9.*
- <a id="e11"></a>**BondBloxx product-page holdings table (E11)** = `Name + CUSIP + Market_Value + Percent_of_Net_Assets`
  *Fund holdings for BondBloxx funds (currently XHLF only): unlike E7-E10, BondBloxx exposes no JSON/CSV API — the product page at `bondbloxxetf.com/<fund-slug>/` server-renders the full "All Holdings" table as static HTML (the page's own "Download CSV" button just re-serializes this same table client-side via JS), so `FundHoldings/bondbloxx/updateXhlfHoldings.js` fetches the page and parses the table directly (`<table border="1">`, the only one on the page with that exact attribute). Fund slug is hardcoded per ticker with no public ticker lookup. The table carries no Quantity, Coupon, or Maturity Date column: XHLF holds only zero-coupon T-Bills, whose `Name` reads `"US T BILL ZCP MM/DD/YY"` — Coupon (0) and Maturity Date are parsed from that suffix (analogous to fminvest.com (E8)'s name-suffix parsing); the CASHUSD and NET OTHER ASSETS balancing rows don't match the suffix pattern and are left with a blank Coupon/Maturity Date, naturally excluded downstream (no CUSIP match in the yield files). Expense ratio and 30-Day Sec Yield are rendered directly into the same already-fetched product page (no separate request). Fetched daily by the `FundHoldings` Windows Task, same as E7-E10.*
- <a id="e12"></a>**BlackRock iShares (E12)** = `Name + Sector + Asset_Class + Market_Value + Weight_(%) + Notional_Value + Par_Value + CUSIP + ISIN + SEDOL + Price + Duration + YTM_(%) + Maturity + Coupon_(%) + Mod._Duration + Real_Duration + Real_YTM_(%)`
  *Fund holdings for iShares funds (currently ICPI only), fetched as a plain CSV from `blackrock.com/varnish-api/blk-one01-product-data/product-data/api/v1/get-fund-document?...&portfolioId=<id>&component=holdings`, a preamble (fund name, as-of date, inception date) above the actual holdings table rather than a plain header-first CSV. Keyed by the fund's numeric `portfolioId` (visible in the product page URL) with no public ticker lookup, so it is hardcoded per fund in `FundHoldings/ishares/updateIcpiHoldings.js`. The endpoint accepts an `asOfDate` param but does not require it — a stale/mismatched date returns an empty body, while omitting it entirely returns the latest holdings (confirmed by direct testing), avoiding the chicken-and-egg problem of needing to know the fund's current as-of date before requesting it. Unlike E7-E11, the source itself reports `Duration`/`YTM`/`Real Duration`/`Real YTM`, but per the project's single-source-of-truth directive these are discarded, not ingested — `FundHoldings/enrichHoldings.js` computes Ask/SA/SAO Yield and Duration the same way for every fund, from [SA and SAO yields (S10)](#s10)/[Market quotes (S7)](#s7) by CUSIP, so a fund's figures are always comparable to every other fund's rather than mixing each provider's own (possibly differently-defined) analytics. Expense ratio and 30-Day SEC yield, however, are provider-reported figures with no cross-fund computation to replace them with — these come from a separate product-page fetch (not the holdings CSV), parsed out of the page's own schema.org JSON-LD block (`@graph` node ending `#key-datapoints`, `additionalProperty` entries named `"Expense Ratio:"` and `"30 Day SEC Yield as of"`) rather than HTML-scraping, since BlackRock renders it as clean structured data. Fetched daily by the `FundHoldings` Windows Task, same as E7-E11.*
- <a id="e13"></a>**Federal Reserve FEDS 2008-05 (E13)** = `@date + beta0 + beta1 + beta2 + beta3 + tau1 + tau2`
  *The Gürkaynak-Sack-Wright fitted TIPS real yield curve, published weekly by the Federal Reserve as `feds200805_1.html`. Source of [GSW curve parameters (S12)](#s12).*
- <a id="e14"></a>**Treasury Tentative Auction Schedule (E14)** = `{ AuctionDate + SecurityTermWeekYear + SecurityType + ReOpeningIndicator + TIPS + FloatingRate + AnnouncementDate + SettlementDate }`
  *Treasury’s schedule of upcoming auctions, published as XML at `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.xml` and revised at each Quarterly Refunding. Source of [Tentative auction schedule (S9)](#s9).*
- <a id="e15"></a>**TreasuryDirect (E15)** = `{ cusip + competitiveAuctionCloseDate + securityType + securityTerm + investmentRate + highRate + highYield + interestRate + highPrice + bidToCoverRatio + grandTotalParAwarded + ... }`
  *The results of each auction of a security, as the `TA_WS/securities/auctioned` web service of `www.treasurydirect.gov` states them: one JSON object per auction, under TreasuryDirect’s own camelCase field names, for the auctions that closed within the last `days` days (`/TA_WS/securities/auctioned?format=json&days=30`). Measured 2026-10-21 over the 250 auctions closed from 2025-04-23, `updatedTimestamp` is 3.1 to 15.5 minutes after the competitive close, 4.0 minutes at the median, and within 5 minutes for 240 of the 250. The service sends no CORS header. One of the two sources of [Auction Results](#auction-results).*

---

<a id="2.0-data-stores-s"></a>
## 2.0 Data Stores (S)
*Internal R2 data files. Schemas are normalized from External Entities. Each entry states the store's file, its R2 key, its composition, and the layout facts a reader of the file needs. The process that writes a store and the processes that read it are shown on the data flow diagrams, and each is specified in its own process spec.*

- <a id="s1"></a>**FedInvest prices (S1)**, `YieldsFromFedInvestPrices.csv` = `Settlement_Date + { type + @cusip + maturity + coupon + ( datedDateCpi ) + price + yield }`
  *R2 key `Treasuries/YieldsFromFedInvestPrices.csv` ([View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/YieldsFromFedInvestPrices.csv)). The first line holds the [Settlement Date](#settlement-date) alone, the second line is the header, and each line after it is one security: the [TIPS Prices](#tips-prices) and the [Treasury Prices](#treasury-prices), each with its yield.*

  | Column | Defined term |
  |---|---|
  | `type` | security type, as [FedInvest (E1)](#e1) states it: `TIPS`, `MARKET BASED BILL`, `MARKET BASED NOTE` or `MARKET BASED BOND` |
  | `cusip` | [CUSIP](#cusip) |
  | `maturity` | [Maturity Date](#maturity-date), `YYYY-MM-DD` |
  | `coupon` | [Coupon Rate](#coupon-rate), as a decimal |
  | `datedDateCpi` | dated date [Ref CPI](#ref-cpi), TIPS only |
  | `price` | [Price](#price) |
  | `yield` | [Yield](#yield) at the settlement date, as a decimal: real for a TIPS, nominal for every other security |

- <a id="s2"></a>**TIPS reference data (S2)**, `TipsRef.csv` = `{ @cusip + maturity + datedDate + coupon + datedDateRefCpi + term }`
  *R2 key `TIPS/TipsRef.csv` ([View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/TIPS/TipsRef.csv)). Header row first, then one row per TIPS [FiscalData (E3)](#e3) has auctioned.*

  | Column | Defined term |
  |---|---|
  | `cusip` | [CUSIP](#cusip) |
  | `maturity` | [Maturity Date](#maturity-date), `YYYY-MM-DD` |
  | `datedDate` | [Dated Date](#dated-date), `YYYY-MM-DD` |
  | `coupon` | [Coupon Rate](#coupon-rate), as a decimal |
  | `datedDateRefCpi` | dated date [Ref CPI](#ref-cpi) |
  | `term` | [Term](#term) measured from the Dated Date, as FiscalData states it: `5-Year`, `10-Year`, `30-Year`, or with a part year, `5-Year 6-Month` |

- <a id="s3"></a>**Ref CPI (S3)**, `RefCPI.csv` = `{ @date + refCpi }`
  *R2 key `TIPS/RefCPI.csv` ([View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/TIPS/RefCPI.csv)). The retrieved, authoritative [Ref CPI](#ref-cpi): header row first, then one row per calendar day from 1997-01-15, the dated date of the first TIPS issued, ascending by date. Ref CPI is the same for every TIPS on a given date, so the series is one continuous series.*

  | Column | Defined term |
  |---|---|
  | `date` | the calendar date the value is for, `YYYY-MM-DD` |
  | `refCpi` | [Ref CPI](#ref-cpi) NSA, as [TreasuryDirect SecIndex (E2)](#e2) states it, to five decimal places |

- <a id="s4"></a>**Ref CPI NSA and SA (S4)**, `RefCpiNsaSa.csv` = `{ @Ref_CPI_Date + Ref_CPI_NSA + Ref_CPI_SA + SA_Factor }`
  *R2 key `TIPS/RefCpiNsaSa.csv` ([View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/TIPS/RefCpiNsaSa.csv)). Calculated by the 31 CFR App. B daily interpolation. Header row first, then one row per calendar day, newest row first. The daily SA series has no official or retrieved equivalent: this store is its sole source.*

  | Column | Defined term |
  |---|---|
  | `Ref CPI Date` | the calendar date the values are for, `YYYY-MM-DD` |
  | `Ref CPI NSA` | [Ref CPI](#ref-cpi) NSA, interpolated daily from [Monthly CPI (S17)](#s17), to five decimal places |
  | `Ref CPI SA` | the same interpolation applied to the SA series of [Monthly CPI (S17)](#s17), to five decimal places |
  | `SA Factor` | [SA Factor](#sa-factor), `Ref CPI NSA / Ref CPI SA`, to five decimal places |

- <a id="s5"></a>**Auction results (S5)**, `Auctions.csv` = `{ @cusip + @comp_auction_close_date + security_type + high_yield + bid_to_cover_ratio + prim_deal_comp_par_awarded + ... }`
  *R2 key `Treasuries/Auctions.csv` ([View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/Auctions.csv)). Header row first, then one row per auction of a security, from 1980-01-01, newest `comp_auction_close_date` first and by `security_term` within a date. Every field of the `treasury_securities_auctions_v2` table of [FiscalData (E3)](#e3) is a column under FiscalData's field name, so a field FiscalData adds appears as a new column. The auctions before 2025-12-29, which that table does not state, were converted from the `auctions_query` table ([1.4](./1.4_Fetch_Auction_Results.md#s5-names)). A field with no value is written `null`. A column that FiscalData states as `null` for an auction holds the value [TreasuryDirect (E15)](#e15) states for it, where [1.4](./1.4_Fetch_Auction_Results.md#treasurydirect) maps that column, until FiscalData states a value.*
- <a id="s6"></a>**Yield history (S6)**, `history.json` = `{ @Symbol + { Timestamp + Yield } }`
  *R2 key `Treasuries/yields-history/history.json` ([View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/yields-history/history.json)). One JSON object keyed by symbol, each value an array of `{ x, y }` points: `x` is the timestamp as `YYYYMMDDHHMMSS`, `y` the [Yield](#yield) as a number in percent. Each point is a closing value at daily resolution, at weekly resolution before the daily points begin and at quarterly resolution before the weekly points begin; [1.7 Update yield history](./1.7_Update_Yield_History.md) specifies the dating.*
- <a id="s7"></a>**Market quotes (S7)**, `MarketQuotes.csv` = `Download_Date + { type + @cusip + maturity + coupon + askPrice + ( bidPrice ) + ( adjAskPrice ) + ( adjBidPrice ) }`
  *R2 key `Treasuries/MarketQuotes.csv` ([View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/MarketQuotes.csv)). The first line holds the [Download Date](#download-date) alone, `YYYY-MM-DD HH:MM` on a 24-hour clock, the second line is the header, and each line after it is one security: the Treasury and TIPS rows of [Market quotes source (E6)](#e6) in one file, told apart by `type`. A price that is not quoted is a blank cell.*

  | Column | Defined term |
  |---|---|
  | `type` | security type: `TIPS`, or `Treasury`, which includes STRIPS, told apart from Bill, Note and Bond by CUSIP root ([Treasury CUSIP Reference](./Treasury_CUSIP_Reference.md)) |
  | `cusip` | [CUSIP](#cusip) |
  | `maturity` | [Maturity Date](#maturity-date), `YYYY-MM-DD` |
  | `coupon` | [Coupon Rate](#coupon-rate), as a decimal |
  | `askPrice` | [Price](#price), [ask](#ask) side |
  | `bidPrice` | [Price](#price), [bid](#bid) side |
  | `adjAskPrice`, `adjBidPrice` | [Adjusted Ask Price / Adjusted Bid Price](#adjusted-price), TIPS only |

- <a id="s8"></a>**CPI history (S8)**, `CPI_history.csv` = `{ @Year + @Period + PeriodName + NSA + SA }`
  *R2 key `bls/CPI_history.csv` ([View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/bls/CPI_history.csv)). Header row first, then one row per month from January 1913, oldest row first. `NSA` is series `CUUR0000SA0` and `SA` is `CUSR0000SA0` of [BLS (E4)](#e4); `SA` is blank before January 1947.*

  | Column | Defined term |
  |---|---|
  | `Year` | four-digit calendar year |
  | `Period` | BLS period code, `M01` for January |
  | `PeriodName` | the month's name |
  | `NSA` | [CPI-U NSA](#cpi-nsa) |
  | `SA` | [CPI-U SA](#cpi-sa) |

- <a id="s9"></a>**Tentative auction schedule (S9)**, `Tentative-Auction-Schedule.xml` = XML `{ AuctionCalendarDate: [ AuctionDate + SecurityTermWeekYear + SecurityType + ReOpeningIndicator + TIPS + FloatingRate + AnnouncementDate + SettlementDate ] }`
  *R2 key `Treasuries/Tentative-Auction-Schedule.xml` ([View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/Tentative-Auction-Schedule.xml)). The XML [Treasury Tentative Auction Schedule (E14)](#e14) publishes, unchanged. `ReOpeningIndicator`, `TIPS` and `FloatingRate` are `Y` or `N`.*
- <a id="s10"></a>**SA and SAO yields (S10)**, `YieldsSaSao.csv` = `{ @cusip + maturity + coupon + ask_yield + sa_yield + sao_yield }`
  *R2 key `TIPS/YieldsSaSao.csv` ([View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/TIPS/YieldsSaSao.csv)). Header row first, then one row per TIPS in [Market quotes (S7)](#s7). A TIPS with no SA Yield has blank `sa_yield` and `sao_yield` cells.*

  | Column | Defined term |
  |---|---|
  | `cusip` | [CUSIP](#cusip) |
  | `maturity` | [Maturity Date](#maturity-date), `YYYY-MM-DD` |
  | `coupon` | [Coupon Rate](#coupon-rate), as a decimal |
  | `ask_yield` | [Yield](#yield), [ask](#ask) side, as a decimal |
  | `sa_yield` | [SA Yield](#sa-yield), as a decimal |
  | `sao_yield` | [SAO Yield](#sao-yield), as a decimal |

- <a id="s11"></a>**Fund holdings (S11)**, `<TICKER>.csv` = `Metadata_Row + Holdings_Table + Total_Row`
  *R2 key `FundHoldings/<TICKER>.csv`. One file per fund ticker (VBIL, VTIP, VTP, RBIL, LTPZ, SCHP, XHLF, ICPI), the holdings of [Vanguard Advisors (E7)](#e7), [fminvest.com (E8)](#e8), [PIMCO (E9)](#e9), [Schwab Asset Management holdings export (E10)](#e10), [BondBloxx product-page holdings table (E11)](#e11) and [BlackRock iShares (E12)](#e12). The `FundHoldings/` prefix stands apart from `TIPS/` and `Treasuries/` because one fund's file holds TIPS and nominal rows together.*
  - *Metadata row: a header row and one data row, `Ticker`, `Fund Name`, `As of`, `Expense Ratio`, a blank column, `Holdings`, `30-Day SEC Yield`.*
  - *Holdings table: a header row and one row per holding, `CUSIP`, `Description`, `Maturity Date`, `Coupon`, `% of Fund`, `Market Value`, `Ask Yield`, `SA Yield` and `SAO Yield` for a fund with TIPS holdings, `Term (w)` or `Term (y)`, `Duration (y)`.*
  - *Total row: no header; `Total / Wtd Avg` in `Description`.*

  *Column detail: [1.14 §File Layout](./1.14_Enrich_Fund_Holdings.md#file-layout).*

- <a id="s12"></a>**GSW curve parameters (S12)**, `GswTipsCurve.json` = `@date + beta0 + beta1 + beta2 + beta3 + tau1 + tau2`
  *R2 key `TIPS/GswTipsCurve.json` ([View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/TIPS/GswTipsCurve.json)). The latest published row of the Federal Reserve's Gürkaynak-Sack-Wright fitted TIPS real yield curve (FEDS 2008-05) from [Federal Reserve FEDS 2008-05 (E13)](#e13): the six Svensson parameters and the observation date, nothing evaluated.*

  | Field | Defined term |
  |---|---|
  | `date` | observation date of the fitted curve, `YYYY-MM-DD` |
  | `beta0`–`beta3` | Svensson level, slope and two curvature coefficients, in percent |
  | `tau1`, `tau2` | Svensson decay parameters, in years |

- <a id="s13"></a>**Yield curves (S13)**, `YieldCurves.csv` = `{ Term_y + ( Maturity + CUSIP + Type ) + Source + ( Ask + SA + SAO ) + ( Spot + Spot_SA ) }`
  *R2 key `Treasuries/YieldCurves.csv` ([View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/YieldCurves.csv)). Header row first, then two kinds of row, general-purpose and spreadsheet-ready.*
  - *A **security row** is one priced security: every Bill, Note, Bond, STRIPS and TIPS, and on a `Market` row an Unclassified security, a [Market quotes (S7)](#s7) CUSIP root the [Treasury CUSIP Reference](./Treasury_CUSIP_Reference.md) does not recognise. A FedInvest-source row never has Type `Unclassified`: [1.1.2](./1.1_Download_FedInvest_Prices.md#select-prices-and-add-tips-reference-data) states its type directly.*
  - *A **grid row** is a fitted [Spot Yield Curve](#spot-yield-curves) evaluated at one term, with `CUSIP` = `Spot` and `Maturity` blank. There are three grid rows per term per `Source`, Type `Treasury`, `TIPS` and `BEI`. The terms are half-year steps from 0.5 across the union of the valid ranges of the three fits of that `Source`. A cell is blank where its fit is outside its valid range at that term or fails its sanity check (`shared/src/spot-curve.js#spotCurveFit`), and the rest of the row is kept.*

  | Column | Defined term |
  |---|---|
  | `Term (y)` | [Term](#term): from the source's [Settlement Date](#settlement-date) to maturity on a security row, and the fitted curve's horizon from the same settlement date on a grid row |
  | `Maturity` | [Maturity Date](#maturity-date), `YYYY-MM-DD`; blank on a grid row |
  | `CUSIP` | [CUSIP](#cusip) on a security row; `Spot` on a grid row |
  | `Type` | security row: `Bill`, `Note`, `Bond`, `STRIPS`, `TIPS` or `Unclassified`; grid row: `Treasury` (fitted nominal spot), `TIPS` (fitted TIPS spot) or `BEI` ([Breakeven Inflation](#breakeven-inflation) across terms) |
  | `Source` | `FedInvest` ([FedInvest prices (S1)](#s1)) or `Market` ([Market quotes (S7)](#s7)) |
  | `Ask` | [Yield](#yield) calculated from the row's price at its source's settlement date, as a decimal. The price of a FedInvest-source row is the one [1.1.2](./1.1_Download_FedInvest_Prices.md#select-prices-and-add-tips-reference-data) selects from the Buy, Sell and End of Day prices of [FedInvest (E1)](#e1), not an ask |
  | `SA` | [SA Yield](#sa-yield), as a decimal; TIPS security rows only |
  | `SAO` | [SAO Yield](#sao-yield), as a decimal; TIPS security rows only |
  | `Spot` | [Spot Yield](#spot-yield) on a grid row, as a decimal on the semi-annual bond-equivalent basis of `Ask`: fitted to the nominal Treasuries for Type `Treasury`, to the TIPS quoted prices for Type `TIPS`, and for Type `BEI` the nominal spot less the TIPS quoted spot |
  | `Spot SA` | Spot Yield fitted to the TIPS seasonally adjusted prices for Type `TIPS`; for Type `BEI` the nominal spot less the TIPS SA spot ([3.5 §Across terms](../YieldCurves/knowledge/3.5_Calculate_Breakeven_Inflation.md#across-terms)); blank for Type `Treasury` |

- <a id="s14"></a>**Breakeven inflation (S14)**, `BreakevenInflation.csv` = `{ @cusip + maturity + coupon + ask_yield + sa_yield + sao_yield + nominal_cusip + nominal_maturity + nominal_yield + ask_bei + sa_bei + sao_bei }`
  *R2 key `Treasuries/BreakevenInflation.csv` ([View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/BreakevenInflation.csv)). Header row first, then one row per TIPS in [Market quotes (S7)](#s7): the [Breakeven Inflation](#breakeven-inflation) of its Ask, SA and SAO Yield against the yield of the nominal Treasury nearest to it in maturity, the per security construction.*

  | Column | Defined term |
  |---|---|
  | `cusip`, `maturity`, `coupon`, `ask_yield`, `sa_yield`, `sao_yield` | as in [SA and SAO yields (S10)](#s10) |
  | `nominal_cusip` | [CUSIP](#cusip) of the nominal Treasury nearest in maturity to the TIPS |
  | `nominal_maturity` | [Maturity Date](#maturity-date) of that nominal Treasury |
  | `nominal_yield` | [Yield](#yield) of that nominal Treasury, [ask](#ask) side, as a decimal |
  | `ask_bei` | `nominal_yield − ask_yield` |
  | `sa_bei` | `nominal_yield − sa_yield` |
  | `sao_bei` | `nominal_yield − sao_yield` |

- <a id="s15"></a>**Bid and ask spreads (S15)**, `BidAskSpreads.csv` = `{ @security_type + @cusip + maturity + coupon + ask_yield + bid_yield + yield_spread_bps + ask_price + bid_price + price_spread_pct }`
  *R2 key `Treasuries/BidAskSpreads.csv` ([View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/BidAskSpreads.csv)). Header row first, then one row per TIPS and nominal Treasury in [Market quotes (S7)](#s7), the [Bid and Ask Spreads](#bid-and-ask-spreads) of each.*

  | Column | Defined term |
  |---|---|
  | `security_type` | `TIPS` or `Treasury` |
  | `cusip` | [CUSIP](#cusip) |
  | `maturity` | [Maturity Date](#maturity-date), `YYYY-MM-DD` |
  | `coupon` | [Coupon Rate](#coupon-rate), as a decimal |
  | `ask_yield` | [Yield](#yield), [ask](#ask) side, as a decimal |
  | `bid_yield` | [Yield](#yield), [bid](#bid) side, as a decimal |
  | `yield_spread_bps` | the yield spread of [Bid and Ask Spreads](#bid-and-ask-spreads), in basis points |
  | `ask_price` | [Price](#price), ask side, unadjusted |
  | `bid_price` | [Price](#price), bid side, unadjusted |
  | `price_spread_pct` | the price spread of [Bid and Ask Spreads](#bid-and-ask-spreads), in percent |

- <a id="s16"></a>**Bond holidays (S16)**, `BondHolidaysSifma.csv` = `{ Date + Holiday_Name }`
  *R2 key `misc/BondHolidaysSifma.csv` ([View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/misc/BondHolidaysSifma.csv)). SIFMA's US bond-market holiday schedule, filtered to the eleven base US market holidays plus New Year's Day. No header row. `Date` is written as `"Weekday, Month D, YYYY"`. Backs the [Bond Holiday](#bond-holiday) term.*
- <a id="s17"></a>**Monthly CPI (S17)**, `CPI.csv` = `{ @Year + @Period + PeriodName + NSA + SA }`
  *R2 key `bls/CPI.csv` ([View Preview](https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/bls/CPI.csv)). The same series and columns as [CPI history (S8)](#s8), January 2019 onward, newest row first.*
- <a id="s18"></a>**Intraday archive (S18)**, `{YYYYMMDD}.json` = `@Symbol + @Date + { Feed: { TimeRange + { TradeTime + Close } } } + FetchedAtET`
  *R2 key `Treasuries/yields-history/intraday-raw/{symbol}/{YYYYMMDD}.json`. One immutable daily snapshot per symbol of the raw feeds [CNBC (E5)](#e5) served that day, and `FetchedAtET`, the wall-clock time the snapshot was taken.*

- <a id="r2-read-access"></a>**R2 Read Access** = `{ @Allowed_Origin }`
  *Every app reads the bucket by a browser `fetch()` from `pub-ba11062b177640459f72e0a88d0261ae.r2.dev`. A browser rejects a cross-origin read from a bucket that has no CORS policy, and a bucket has none until one is configured. The policy of this bucket is set in the Cloudflare dashboard (R2, the bucket, Settings, CORS Policy), and no file in this repository manages it. It allows three origins, each matched literally:*
  - *`http://localhost:8080`, the dev server on the primary checkout.*
  - *`http://localhost:8081`, the dev server on a worktree.*
  - *`https://aerokam.github.io`, production.*

  *Measured 2026-10-26 by sending each origin in an `Origin` header and reading `Access-Control-Allow-Origin`: the three origins above are echoed, and `http://127.0.0.1:8080` and `http://localhost:8082` receive no header. A page served from any other origin, `127.0.0.1` and any other `localhost` port included, fails every R2 read. Pages are served from `localhost`, never `127.0.0.1`. A third concurrent dev server needs its origin added to the policy first.*

---

<a id="3.0-data-elements-primitives"></a>
## 3.0 Data Elements (Primitives)

<a id="cusip"></a>
### CUSIP
`CUSIP` = *9-character unique identifier for a Treasury security*

<a id="quantity"></a>
### Quantity
`Quantity` = *Integer number of $1,000 par units held (e.g., 50 = $50,000 par)*

<a id="par"></a>
<a id="par-value"></a>
<a id="par-value-nominal"></a>
### Par
`Par` = *The stated value of a security at original issuance, the "par amount" of [31 CFR 356.2](./31_CFR_356_Definitions_And_Formulas.md). It applies to any amount of securities and not to one security: an auction states its offering, bids and awards in par, and a holding has a par of its [Quantity](#quantity) × $1,000, so a Quantity of 50 has a par of $50,000. A [Price](#price) is expressed as a percentage of par: a price of 98 is 98% of par, which is $980 for a par of $1,000. For a TIPS, par excludes the inflation adjustment, so it stays at $1,000 per TIPS while the [Inflation-Adjusted Principal](#inflation-adjusted-principal) changes.*

<a id="face-value"></a>
### Face Value
`Face_Value` = *A synonym of [Par](#par), used in different contexts.*

<a id="price"></a>
<a id="clean-price"></a>
### Price
`Price` = *Market value expressed as a percentage of par: a price of 98 is 98% of par, which is $980 for a par of $1,000. A price is unadjusted, before inflation adjustment, unless qualified (see [Adjusted Price](#adjusted-price)). By convention, "price" means this clean price — excluding accrued interest — unless dirty price is named explicitly, though dirty price (clean price plus accrued interest) is rarely invoked for a TIPS in practice, since the accrued interest on a TIPS is itself inflation-adjusted. Canty (2009) formal notation for the clean price: CP. Canty's own "dirty price" (DP) is a different quantity from that market-convention sense, unrelated to accrued interest: `DP = CP × Index Ratio`, the [Adjusted Price](#adjusted-price) of a TIPS.*

<a id="adjusted-price"></a>
<a id="adjusted-ask-price"></a>
<a id="adjusted-bid-price"></a>
### Adjusted Price
`Adjusted_Price` = `Price × Index_Ratio` *(a TIPS only. The Adjusted Ask Price is the ask [Price](#price) so adjusted and the Adjusted Bid Price the bid Price, as [Market quotes (S7)](#s7) states them in its `adjAskPrice` and `adjBidPrice` columns.)*

<a id="accrued-interest-nominal"></a>
### Accrued Interest (Nominal)
`Accrued_Interest_Nominal` = `(Coupon_Rate / 2 × 100) × (A / E)` *(interest owed to the seller since the last coupon date, per $100 par — Actual/Actual day count: A = days since last coupon date, E = days in the current coupon period. A = 0 on a coupon date, because the coupon paid that day is the seller’s. NOT a flat half-coupon. For TIPS, index-ratio adjusted: see [Accrued Interest (Adjusted)](#accrued-interest-adjusted).)*

<a id="settlement-date"></a>
### Settlement Date
`Settlement_Date` = *The date on which a bond trade is settled. Standard system logic: [ Trade_Date + 1 Bond Trading Day (T+1) | Manual_Override ]. T+1 excludes weekends and US bond market holidays (source: BondHolidaysSifma.csv).*

*Each source’s settlement date is determined once, by the process that assigns it:*

- *Market quotes ([S7](#s7)): the [Download Date](#download-date) plus one bond trading day (T+1), in [3.1.6 Determine settlement date](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#determine-settlement-date).*
- *FedInvest prices ([S1](#s1)): the date FedInvest states its prices are for (T+0), in [1.1.1 Determine settlement date](./1.1_Download_FedInvest_Prices.md#determine-settlement-date), where the basis for T+0 is recorded.*

<a id="download-date"></a>
### Download Date
`Download_Date` = *The date and time [Market quotes source (E6)](#e6) was downloaded, on the clock of the machine that downloaded it, stated on the first line of [Market quotes (S7)](#s7) as `YYYY-MM-DD HH:MM`. It is the trade date from which the [Settlement Date](#settlement-date) of the quotes in the file is counted.*

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

<a id="duration"></a>
### Duration
`Duration` = *The weighted-average time to a bond's remaining cash flows, in years, each cash flow weighted by its present value — Macaulay duration. `shared/src/bond-math.js#calculateDuration` is the one implementation. `calculateMDuration` divides it by `(1 + yield / 2)` for Modified Duration, the approximate percent price change per percentage point of yield. For a zero-coupon security, whose only cash flow is its principal at maturity, Duration equals [Term](#term) exactly.*

*[Duration Matching](#duration-matching) (TipsLadderManager) uses Modified Duration throughout, not Macaulay — see that entry, not this one, for how it is used there.*

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
### Index Ratio
`Index_Ratio` = `Ref_CPI_settle / Ref_CPI_dated`

*Treasury truncates the Index Ratio to six decimal places and rounds it to five in every calculation it makes ([31 CFR 356 Appendix B](./31_CFR_356_Definitions_And_Formulas.md)), so every amount that depends on Treasury uses it so rounded: the [Inflation-Adjusted Principal](#inflation-adjusted-principal), the principal and interest payments, and, by inference, the [Accrued Interest (Adjusted)](#accrued-interest-adjusted). Brokers do not round it in the adjusted prices they state, so the [Adjusted Price](#adjusted-price) and the [Cost per TIPS](#cost-per-tips) use it unrounded.*

<a id="inflation-adjusted-principal"></a>
### Inflation-Adjusted Principal
`Inflation_Adjusted_Principal` = `Par × Index_Ratio` *(the Index Ratio truncated to six decimal places, then rounded to five, as [31 CFR 356 Appendix B](./31_CFR_356_Definitions_And_Formulas.md) states for the principal and interest payments Treasury calculates). A TIPS is redeemed at maturity at its Inflation-Adjusted Principal or at its [Par](#par), whichever is greater ([31 CFR 356 §356.5](./31_CFR_356_Definitions_And_Formulas.md)).*

<a id="annual-interest-real"></a>
### Annual Interest (Real)
`Annual_Interest_Real` = `Par × Coupon_Rate` *(coupon applied to the fixed par — constant in real terms)*

<a id="annual-interest-nominal"></a>
### Annual Interest (Nominal)
`Annual_Interest_Nominal` = `Inflation_Adjusted_Principal × Coupon_Rate` *(coupon applied to inflation-adjusted principal)*

<a id="pi"></a>
### P+I
`P+I` = *Principal + Last-Year Interest: the combined cash flow a [Funded Year](#funded-year) receives from the securities maturing in it, being their principal together with their [Last-Year Interest](#last-year-interest).*

<a id="pi-per-tips"></a>
### P+I per TIPS
`P+I_per_TIPS` = `Inflation_Adjusted_Principal + (Annual_Interest_Nominal × [0.5 | 1.0])` *Total inflation-adjusted cash flow in the maturity year. See TIPS_Basics.md for half-year rule.*

<a id="cost-per-tips"></a>
### Cost per TIPS
`Cost_per_TIPS` = `(Price / 100) × Index_Ratio × 1000` *(nominal cost to purchase one $1,000 par unit)*

<a id="accrued-interest-adjusted"></a>
### Accrued Interest (Adjusted)
`Accrued_Interest_Adjusted` = `Accrued_Interest_Nominal / 100 × Index_Ratio × 1000` *(index-ratio-adjusted accrued interest per TIPS, real dollars, with the Index Ratio truncated to six decimal places and then rounded to five and the result rounded to five decimal places for $1,000 par, as [31 CFR 356 Appendix B](./31_CFR_356_Definitions_And_Formulas.md) §I.D.4 states for accrued interest — extends [Accrued Interest (Nominal)](#accrued-interest-nominal) the same way [Inflation-Adjusted Principal](#inflation-adjusted-principal) extends [Par Value (Nominal)](#par-value-nominal). See TIPS_Basics.md §Accrued Interest.)*

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
<a id="amount"></a>
### ARA
`ARA` = `Funded_PI + LMI + Same_Maturity_Excess_Interest` *(Annual Real Amount: total real cash flow produced for a Funded Year)*

Displayed as **Amount**, and as **Real Amount** where a fuller header fits. The header drops *Annual* because it applies to each funded year while the totals row beneath is not annual, and drops *Real* because every principal and interest value in a TIPS ladder is inflation-adjusted, so real is implied throughout. The Cost and Quantity headers drop *Annual* for the same reason.

<a id="lmi"></a>
### LMI
`LMI` = `Σ Annual_Interest_Real for TIPS maturing in years > Current_Year` *(Later Maturity Interest: interest contributions to the current funded year from bonds maturing in future years)*

<a id="same-maturity-excess-interest"></a>
<a id="same-year-excess-interest"></a>
### Same-Maturity Excess Interest
`Same_Maturity_Excess_Interest` = `Σ Annual_Interest_Real for excess TIPS maturing in Current_Year`
*[Excess TIPS](#excess-tips) ([Duration Matching](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#duration-matching-brackets)) are ordinary bonds while held: the interest they pay counts toward the Amount of the year in which it is paid, whatever the month, and flows down into [LMI](#lmi) for every shorter-maturity year, as any other coupon does. Bracket excess covers [Gap Years](#gap-years), where 10-year TIPS have not yet been issued, and the [Cover Excess](#cover-excess) covers the Future 30Y years. Each is sold as the TIPS it stands in for are issued, so neither pays interest in its maturity year and this term is 0 for a [Bracket Year](#bracket-year) and for a [Cover Year](#cover-year) (2.0 §Future 30Y Simulated Outstanding TIPS). The funded year Amount of such a year counts its [Funded Year TIPS](#funded-year-tips) alone.*

<a id="pre-ladder-credit"></a>
<a id="pre-ladder-interest"></a>
### Pre-Ladder Interest (PLI)
`Pre_Ladder_Interest` = *Coupon interest earned on the ladder’s holdings in the years between settlement and the first funded year, credited to the earliest funded years until it is exhausted. Income arriving before the ladder starts paying out, which would otherwise go unused. Shown in the Amount popup as **Pre-ladder credit**, the share of it this funded year received. Enabled by the **Pre-ladder int.** control (2.0 §Pre-Ladder Interest).*

<a id="gap-years"></a>
### Gap Years
`Gap_Years` = *The maturity years after the longest-dated issued 10-year TIPS maturity year and before the upper bracket year (2040): the years in which no 10-year TIPS has yet been issued, 2037, 2038 and 2039 today. A year with no TIPS that is not above every issued 10-year TIPS maturity year is not a gap year; in particular a year before the first year that has a TIPS has no rung and is not a gap year. The 10-year qualifier carries the definition: a ladder whose last year runs past the longest-dated issued 30-year TIPS also contains years with no issued TIPS, and those are Future 30Y Rungs rather than gap years, covered by different holdings.*

<a id="synthetic-tips"></a>
### Synthetic TIPS
`Synthetic_TIPS` = *A theoretical TIPS constructed for a [Gap Year](#gap-years) or a Future 30Y rung, never purchased. For a gap year the yield is interpolated from the surrounding issued maturities; for a Future 30Y rung it comes from the longest issued 30-year maturity, since there is nothing above it to interpolate between. [Index Ratio](#index-ratio) taken as 1.00000; price computed from its own yield and coupon.*

**The index ratio is an approximation.** A TIPS carries an index ratio of exactly 1.00000 on its [Dated Date](#dated-date), not on its issue date, and the two never coincide for a TIPS. A security modeled as issued today would therefore already be indexed by the days between them. 1.00000 is close enough for a rung that is never bought.

<a id="pass-1"></a>
### Pass 1
`Pass_1` = *The first of the two passes that size a ladder with [Gap Years](#gap-years) or Future 30Y years: it sizes the [Synthetic TIPS](#synthetic-tips) that stand in for those years, longest to shortest. The quantity of each Synthetic TIPS is sized from its [DARA](#dara) less incoming [LMI](#lmi), the same subtraction any [Funded Year](#funded-year) uses. The incoming LMI is the coupon of the actual TIPS above those years together with the coupon of the Synthetic TIPS already sized for longer years in the same pass. Its purpose is the average duration and the total cost of those years, which [Duration Matching](#duration-matching) uses; it sizes no holding. Specified in [2.0 TIPS Ladders](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#two-pass-walkthrough).*

<a id="pass-2"></a>
### Pass 2
`Pass_2` = *The second pass: the sweep, longest to shortest, that sizes the [Funded Year](#funded-year) quantities of the ladder once [Pass 1](#pass-1) and [Duration Matching](#duration-matching) have fixed the [Excess TIPS](#excess-tips) quantities. The coupon on the excess is ordinary interest, credited to the excess's maturity year and, through [LMI](#lmi), to every shorter-maturity year. Specified in [2.0 TIPS Ladders](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#two-pass-walkthrough).*

<a id="simulated-outstanding-future-30y-tips"></a>
<a id="simulated-future-30y-tips"></a>
### Simulated Outstanding Future 30Y TIPS
`Simulated_Outstanding_Future_30Y_TIPS` = *A [Synthetic TIPS](#synthetic-tips) of a Future 30Y year in [Pass 1](#pass-1), treated in [Pass 2](#pass-2) as outstanding in the year it is issued: the last trading day of February, 30 years before its maturity year. A TIPS maturing in February 2066, for example, is issued on the last trading day of February 2036. Its price, yield and coupon are those of the Synthetic TIPS from which it is converted in Pass 2. From its issue year it contributes its coupon to the [LMI](#lmi) of every earlier funded year: one coupon in the issue year, two in each later year. Buying it is modeled as a rebalance that sells enough [Cover Excess](#cover-excess) to duration-match the Synthetic TIPS not yet converted, measured on its issue date. The excess sold brings in more than the Simulated Outstanding Future 30Y TIPS cost, because the discount [Cover Excess](#cover-excess) rises toward par between issue dates; that [Net Cash](#net-cash) counts toward the funded year of the year it is delivered. **Simulated Future 30Y TIPS** is a synonym.*

<a id="simulated-outstanding-future-10y-tips"></a>
### Simulated Outstanding Future 10Y TIPS
`Simulated_Outstanding_Future_10Y_TIPS` = *A [Synthetic TIPS](#synthetic-tips) of a [Gap Year](#gap-years) in [Pass 1](#pass-1), treated in [Pass 2](#pass-2) as outstanding in the year it is issued: the last trading day of January, 10 years before its maturity year. A TIPS maturing in January 2039, for example, is issued on the last trading day of January 2029. Its price, yield and coupon are those of the Synthetic TIPS from which it is converted in Pass 2. From its issue year it contributes its coupon to the [LMI](#lmi) of every earlier funded year: one coupon in the issue year, two in each later year. Buying it is modeled as a rebalance that sells enough [Excess TIPS](#excess-tips) to duration-match the Synthetic TIPS not yet converted, measured on its issue date. The [Net Cash](#net-cash) of that rebalance counts toward the funded year of the year it is delivered.*

<a id="simulated-outstanding-tips"></a>
### Simulated Outstanding TIPS
`Simulated_Outstanding_TIPS` = *The [Simulated Outstanding Future 10Y TIPS](#simulated-outstanding-future-10y-tips) and the [Simulated Outstanding Future 30Y TIPS](#simulated-outstanding-future-30y-tips) together.*

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
`Excess_TIPS` = *The TIPS a [Bracket Year](#bracket-year) holds for duration matching. The quantity follows from that bracket year’s [Bracket Weight](#bracket-weight), which the duration match determines. Named for the bracket year they serve: **excess lower bracket year TIPS**, **excess 2040 TIPS**. [Cover Excess](#cover-excess), the Excess TIPS held in a [Cover Year](#cover-year), is a subset of Excess TIPS.*

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

<a id="expected-excess"></a>
### Expected Excess
`Expected_Excess` = *The [Excess TIPS](#excess-tips) a candidate year would hold as the [Active Lower Bracket](#active-lower-bracket) of a ladder built when that year was the most recently issued 10-year TIPS. The [Gap Years](#gap-years) of that ladder are the years after the candidate year up to the year before the [Upper Bracket](#bracket-maturity) year, so an older candidate year has more gap years and a larger Expected Excess. It is the share of the cost of those gap years that the duration match puts in the candidate year (3.0 §Retained Maturities). A held year counts as a [Retained Lower Bracket](#retained-lower-bracket) only when its excess reaches `RETAINED_BRACKET_MIN_SHARE` of its Expected Excess.*

<a id="retained-bracket-excess"></a>
### Retained Bracket Excess
`Retained_Bracket_Excess` = *Excess held in a [Bracket Maturity](#bracket-maturity) older than the [Active Lower Bracket](#active-lower-bracket), carried forward from a time when that maturity was itself the lower bracket. A rebalance **never increases** it. It is sold **only** when total lower bracket excess exceeds the duration-matched target, **oldest maturity first**, and only until the overage is absorbed. Any number of older maturities may accumulate as successive maturities become active — the count is not fixed, so the structure is never named by how many brackets it contains.*

<a id="available-cash"></a>
### Available Cash
`Available_Cash` = *Cash on hand applied toward the [ARA](#ara) of the earliest [Funded Years](#funded-year). Applied to the earliest funded year first and moving up the ladder until exhausted, so a year it covers in full needs no TIPS. Stated by the holder rather than detected: cash intended for reinvestment in the ladder is simply not entered (2.0 §Available Cash).*

<a id="net-cash"></a>
### Net Cash
`Net_Cash` = *The cash credit or debit left after a rebalance: the per-row cost deltas summed across the run. Negative when the rebalance buys more than it sells. Rebalance’s counterpart to [Total Cost](#total-cost). On the issue date of a [Simulated](#simulated) conversion it is the proceeds of the Excess TIPS sold less the cost of the Simulated Outstanding TIPS bought (2.0 §Gap Year Simulated Outstanding TIPS).*

<a id="total-cost"></a>
### Total Cost
`Total_Cost` = *The cost of every TIPS a build says to buy: the [Funded Year](#funded-year) rung holdings, together with the [Excess TIPS](#excess-tips) held in the [Bracket Years](#bracket-year) and the cover excess held in the [Cover Years](#cover-year). That excess is held to cover a missing gap years or the Future 30Y rungs rather than to fund the maturity year it falls in, so its principal applies toward duration matching while its coupon interest applies toward that year’s ARA (see [Same-Year Excess Interest](#same-year-excess-interest)). Build’s counterpart to [Net Cash](#net-cash).*

<a id="reference-date"></a>
### Reference Date
`Reference_Date` = *The date a calculation is stated relative to. Restating per-year amounts to a Ref CPI uses that Ref CPI’s date as the reference date (3.0 §DARA Reference Date). In the two specific contexts of auction accrued interest and TIPS indexation, the term is [Dated Date](#dated-date).*

<a id="last-year-interest"></a>
### Last-Year Interest
`Last_Year_Interest` = *Interest paid in a funded year by securities maturing in that year. Treasuries pay semiannually, so a January–June maturity pays one coupon in its final year and a July–December maturity pays two ([Bond Basics](./Bond_Basics.md), Last-Year Interest Payments).*

<a id="duration-matching"></a>
### Duration Matching
`Duration_Matching` = *Holding [Excess TIPS](#excess-tips) in the [Bracket Years](#bracket-year) that surround the [Gap Years](#gap-years), weighted by [Bracket Weight](#bracket-weight) so that the excess changes in value as the gap years would under a rate move. [Modified Duration](#duration) throughout (2.0 §Duration Matching). The Future 30Y [Cover Years](#cover-year) work the same way.*

<a id="cover-year-tips"></a>
<a id="cover-maturity"></a>
### Cover Year TIPS
`Cover_Year_TIPS` = *The specific TIPS in a [Cover Year](#cover-year). The Future 30Y counterpart of [Bracket Year TIPS](#bracket-year-tips), and named the same way: naming a cover names the TIPS.*

<a id="cover-excess"></a>
### Cover Excess
`Cover_Excess` = *The [Excess TIPS](#excess-tips) held in a [Cover Year](#cover-year), a subset of Excess TIPS: the quantity follows from that cover year’s [Cover Weight](#cover-weight), which the duration match determines.*

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
`Cash_Flow_Calendar` = *When a portfolio’s current holdings pay, and how much, by date. Independent of funded years, DARA, brackets, gaps and covers: a fact about the held CUSIPs and quantities rather than a ladder-construction result (4.5.4 §Cash Flow Calendar). The [Simulated](#simulated) tab is the exception: it adds the [Simulated Outstanding Future 10Y TIPS](#simulated-outstanding-future-10y-tips), the [Simulated Outstanding Future 30Y TIPS](#simulated-outstanding-future-30y-tips) and the [Net Cash](#net-cash) of each issue date, none of which is purchased (4.5.4 §Simulated tab). The other tabs are [Static](#static).*

<a id="static"></a>
### Static
`Static` = *The assumption that no [Excess TIPS](#excess-tips) is sold before it matures. A Static [Cash Flow Calendar](#cash-flow-calendar) shows each holding paying its coupons until maturity and its principal at maturity. Counterpart of [Simulated](#simulated).*

<a id="simulated"></a>
### Simulated
`Simulated` = *The assumption that the [Excess TIPS](#excess-tips) is sold down on the issue date of each [Synthetic TIPS](#synthetic-tips), which becomes a [Simulated Outstanding Future 10Y TIPS](#simulated-outstanding-future-10y-tips) or a [Simulated Outstanding Future 30Y TIPS](#simulated-outstanding-future-30y-tips), as in [Pass 2](#pass-2) (2.0 §Gap Year Simulated Outstanding TIPS, §Future 30Y Simulated Outstanding TIPS). A Simulated [Cash Flow Calendar](#cash-flow-calendar) pays the Excess TIPS coupons on the quantity held on each coupon date, adds the coupons and principal of the Simulated Outstanding TIPS from their issue dates, and adds the [Net Cash](#net-cash) of each issue date. Counterpart of [Static](#static).*

---

**Seasonal Adjustment (SA) Elements**

<a id="sa-factor"></a>
### SA Factor
`SA_Factor` = `Ref_CPI_NSA(date) / Ref_CPI_SA(date)` *(daily ratio that isolates the seasonal component of the Ref CPI. `Ref_CPI_NSA` is the Treasury-published Ref CPI. `Ref_CPI_SA` applies the same 31 CFR App. B daily interpolation to BLS's monthly seasonally adjusted CPI-U — a constructed series, since no official seasonally adjusted Ref CPI exists. Analogous to the monthly seasonal factors BLS publishes (`NSA index / SA index`, shown ×100 to 3 dp), but daily and unscaled. Stored to five decimal places in [`RefCpiNsaSa.csv`](#s4); lookup via `shared/src/ref-cpi.js#saFactorForDate`.)*

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

<a id="5.1-issuance-dependent-values"></a>
### 5.1 Issuance-Dependent Values

Some values are true only until Treasury issues more TIPS. Left inline as approximations across specs, they go stale silently — "Jan/Jul ≤~2035" was accurate when written and gave no signal when a Jul 2036 was auctioned.

**Protocol** (generalizes the [`REFCPI_CUSIP`](#5.0-global-constants) entry below, which already states a selection rule rather than a value):

1. **Specs state the rule, not the value.** A value appears only as illustration, marked with the date it was true.
2. **The volatile values live here**, each with the event that changes it — not scattered as inline approximations across 2.0, 3.0 and app help text.
3. **A test derives each value from live data and asserts it matches this table.** Issuance drift then fails a test instead of rotting unnoticed. This is verifying redundancy (two independent derivations, gated by an assertion), not a duplicated definition. The test is `TipsLadderManager/tests/run.js` "DD §5.1 issuance-dependent values". It covers every row that states a value: Multi-maturity boundary, Longest issued maturity year, and the three numbers in the Maturity-month pattern row, which it reads in the shape `quarterly ≤~YYYY, Jan/Jul ≤~YYYY, Feb YYYY+`. A row that reads "derived from market data each run" states no value and has no assertion.

| Value | Rule | As of 2026-08-25 | Changes when |
|---|---|---|---|
| Gap years | The years after the longest-dated issued 10-year TIPS maturity year and before the upper bracket year (2040) — [Gap Years](#gap-years) | derived from market data each run | A 10-year TIPS maturing in a gap year is issued |
| Multi-maturity boundary | Years below it may hold more than one maturity month; at/above, 30-year February issues only | 2040 | 10-year issuance extends past the current boundary |
| Maturity-month pattern | Quarterly at the short end, January/July for 10-year, February for 30-year | quarterly ≤~2031, Jan/Jul ≤~2036, Feb 2040+ | Issuance calendar changes |
| Longest issued maturity year | Maturity year of the longest-dated issued TIPS | 2056 | A new 30-year TIPS is issued |
| Maximum Future 30Y Rungs | The largest number of Future 30Y years past the longest issued maturity year for which, on the issue date of every [Simulated Outstanding Future 30Y TIPS](#simulated-outstanding-future-30y-tips), the average duration of the Synthetic TIPS not yet converted lies between the modified durations of the lower and upper cover (2.0 §Limit on the ladder’s last year) | derived from market data each run | Yields change, a new 30-year TIPS is issued, or the upper cover’s duration falls with age |
| Ladder’s last year, at most | Longest issued maturity year + Maximum Future 30Y Rungs | derived from market data each run | The Maximum Future 30Y Rungs changes, or a new 30-year TIPS is issued |
| Lower cover | The lower [Cover Year TIPS](#cover-year-tips): the outstanding TIPS with the longest modified duration at or below that of the Synthetic TIPS of the first Future 30Y year alone, measured at `LOWER_COVER_YIELD` | derived from market data each run | Another outstanding TIPS comes within reach of the duration at `LOWER_COVER_YIELD`, or a new 30-year TIPS is issued |
| Upper cover | The upper Cover Year TIPS: the outstanding TIPS with the longest modified duration, excluding the lower cover | derived from market data each run | Yields change, or a new 30-year TIPS is issued |
| Active lower bracket | [Active Lower Bracket](#active-lower-bracket) — latest outstanding maturity before the first gap year | derived from market data each run | The next pre-gap maturity is issued |
| Default First Year | The earliest [Maturity Year](#maturity-year) with at least one TIPS maturing more than `EXCLUDE_MATURING_WITHIN_MONTHS` months after the [Settlement Date](#settlement-date) | derived from market data each run | A TIPS comes within `EXCLUDE_MATURING_WITHIN_MONTHS` months of its maturity |

`LOWEST_LOWER_BRACKET_YEAR` = 2032 *(a design choice, not derived from market data: the floor of the holdings search range for [retained bracket excess](#retained-bracket-excess): only maturity years in `[LOWEST_LOWER_BRACKET_YEAR, minGapYear)` are considered. Matches `rebalance-lib.js`.)*
`RETAINED_BRACKET_MIN_SHARE` = 30% *(a design choice, not derived from market data: the share of its [Expected Excess](#expected-excess) that a held year must reach to be a [Retained Lower Bracket](#retained-lower-bracket). A smaller excess is the difference between an ARA and a DARA rounded to whole dollars, or a few TIPS over the plan, and is not a spike. Matches `rebalance-lib.js`.)*
`EXCLUDE_MATURING_WITHIN_MONTHS` = 3 *(a design choice, not derived from market data: a [TIPS](#tips) maturing no more than this many months after the [Settlement Date](#settlement-date) is not offered in Build: it is not among the First Year choices and is not chosen for a funded year under any Maturity preference, including Select maturities. A year with other TIPS maturing later uses those. The Default First Year (§5.1) is the earliest maturity year with a TIPS maturing later than that. A TIPS that short gives little protection against unexpected inflation, and [Market Quotes](#market-quotes) omit a Treasury maturing within about a week. Rebalance applies no exclusion: a TIPS in a holdings file is shown and kept as held. A value of 0 turns the exclusion off. Matches `ladder-core.js`.)*
`LOWER_COVER_YIELD` = 4% *(the yield at which the Synthetic TIPS of the first Future 30Y year is measured when the Lower cover (§5.1) is chosen. A fixed yield above the market yield keeps the choice from changing with each day's yield; the durations of the covers barely move with yield, while the duration of that Synthetic TIPS moves with it. [Research](../TipsLadderManager/research/Future_30Y_Cover_Excess_Analysis.md).)*
`REFCPI_CUSIP` = *the CUSIP whose series the daily Ref CPI is pulled from at TreasuryDirect ([TreasuryDirect SecIndex (E2)](#e2)).*
  **Selection rule (the rule, not the value):** Ref CPI is *market-wide* — identical across all TIPS on a given date — so the CUSIP determines only which dates its series covers. The recurring fetch selects, on every run, the [Outstanding TIPS](#outstanding-tips) with the latest [Maturity Date](#maturity-date) in [TIPS reference data (S2)](#s2), the CUSIP that stays outstanding longest, so no rotation is needed when a TIPS matures. The one-shot full-history rebuild merges `9128272M3` (matured 2007-01-15) and `912810FD5` (matures 2028-04-15), whose series together cover 1997-01-15 to present with no gap ([Fetch daily Ref CPI (1.13)](./1.13_Fetch_Daily_Ref_CPI.md)).
`SIFMA_HOLIDAYS` = *The calendar of [Bond Holidays](#bond-holiday).*

---

<a id="6.0-data-flows"></a>
## 6.0 Data Flows

*The structures that pass between processes on the data flow diagrams. Each flow is named by the data it holds and composed from the terms above. A flow that holds one term alone, such as [Settlement Date](#settlement-date) or [Breakeven Inflation](#breakeven-inflation), links to that term and has no entry here.*

### 6.1 From external entities

- <a id="fedinvest-daily-price-list"></a>**FedInvest Daily Price List** = [FedInvest (E1)](#e1)
  *Every price [FedInvest (E1)](#e1) publishes for a security — Buy, Sell and End of Day alike. Only the Buy price is a midpoint of dealer bid and ask. Renamed from "Daily Mid-Market Prices" (2026-09-18): that name asserted of the whole flow what is only true of the Buy price.*
- <a id="daily-ref-cpi"></a>**Daily Ref CPI** = [TreasuryDirect SecIndex (E2)](#e2)
- <a id="auction-results"></a>**Auction Results** = `[ the auction records of FiscalData (E3) | the auction records of TreasuryDirect (E15) ]`
  *[1.4](./1.4_Fetch_Auction_Results.md) reads both. Measured 2026-10-21, [TreasuryDirect (E15)](#e15) stated the results of three Bill auctions held on 2026-10-19 and 2026-10-20 that [FiscalData (E3)](#e3) stated as `null`.*
- <a id="upcoming-auctions"></a>**Upcoming Auctions** = *the upcoming auction records of* [FiscalData (E3)](#e3)
- <a id="tips-reference-data"></a>**TIPS Reference Data** = *the TIPS security records of* [FiscalData (E3)](#e3)
- <a id="monthly-cpi-u"></a>**Monthly CPI-U** = [BLS (E4)](#e4)
- <a id="market-yields"></a>**Market Yields** = [CNBC (E5)](#e5) chart-bar feed
- <a id="market-quotes"></a>**Market Quotes** = [Market quotes source (E6)](#e6)
- <a id="live-quotes"></a>**Live Quotes** = [CNBC (E5)](#e5) quote service
- <a id="fund-holdings"></a>**Fund Holdings** = `[ Vanguard Advisors (E7) | fminvest.com (E8) | PIMCO (E9) | Schwab Asset Management holdings export (E10) | BondBloxx product-page holdings table (E11) | BlackRock iShares (E12) ]`
- <a id="gsw-curve-parameters"></a>**GSW Curve Parameters** = [Federal Reserve FEDS 2008-05 (E13)](#e13)
- <a id="tentative-auction-schedule"></a>**Tentative Auction Schedule** = [Treasury Tentative Auction Schedule (E14)](#e14)

### 6.2 Level 0 and Level 1

- <a id="source-data"></a>**Source Data** = `FedInvest_Daily_Price_List + Daily_Ref_CPI + Auction_Results + TIPS_Reference_Data + Monthly_CPI_U + Market_Yields + Market_Quotes + Fund_Holdings + GSW_Curve_Parameters + Tentative_Auction_Schedule`
  *Every flow from an external entity that process 1 reads, drawn as one flow into it at Level 1. [Live Quotes](#live-quotes) and [Upcoming Auctions](#upcoming-auctions) are not part of it: no acquisition job reads [CNBC (E5)](#e5)'s quote service or the upcoming auctions of [FiscalData (E3)](#e3). [Yields Monitor](../YieldsMonitor/knowledge/2.2_Read_Live_Quotes.md) reads the first directly and [Treasury Auctions](/knowledge/DFD_LEVEL2_TREASURYAUCTIONS) the second, and Level 1 draws each as a flow into that app rather than into process 1.*
- <a id="reference-data"></a>**Reference Data** = `{ FedInvest prices (S1) | TIPS reference data (S2) | Ref CPI (S3) | Ref CPI NSA and SA (S4) | Auction results (S5) | Yield history (S6) | Market quotes (S7) | CPI history (S8) | Tentative auction schedule (S9) | SA and SAO yields (S10) | Fund holdings (S11) | GSW curve parameters (S12) | Yield curves (S13) | Breakeven inflation (S14) | Bid and ask spreads (S15) | Bond holidays (S16) | Monthly CPI (S17) }`
  *The contents of the R2 data stores.*
- <a id="app-inputs"></a>**App Inputs** = *What a user enters or selects in an app. [View Selections](#view-selections) are the Yield Curves case.*
- <a id="app-outputs"></a>**App Outputs** = *What an app shows a user. [Charts and Tables](#charts-and-tables) are the Yield Curves case.*
- <a id="downloaded-data-sets"></a>**Downloaded Data Sets** = `Yield curves (S13) + Breakeven inflation (S14) + Bid and ask spreads (S15)`
  *The three stores written for a user to download into a spreadsheet. No app reads them.*

### 6.3 Yield Curves

- <a id="tips-prices"></a>**TIPS Prices** = `{ @CUSIP + Coupon_Rate + Maturity_Date + Price + Ref_CPI_dated }`
  *Each TIPS in [FedInvest (E1)](#e1) that [TIPS reference data (S2)](#s2) also holds, with one [Price](#price) from E1 and the coupon rate, maturity date and dated date [Ref CPI](#ref-cpi) from TIPS reference data (S2). The [Settlement Date](#settlement-date) of the prices is a separate flow.*
- <a id="treasury-prices"></a>**Treasury Prices** = `{ @CUSIP + Security_Type + Coupon_Rate + Maturity_Date + Price }`
  *Each market-based bill, note and bond in [FedInvest (E1)](#e1), with one [Price](#price). The [Settlement Date](#settlement-date) of the prices is a separate flow.*
- <a id="tips-quotes"></a>**TIPS Quotes** = `{ @CUSIP + Coupon_Rate + Maturity_Date + Ask_Price + ( Bid_Price ) + ( Adjusted_Ask_Price ) + ( Adjusted_Bid_Price ) }`
  *The TIPS in [Market quotes (S7)](#s7), each with its [ask and bid](#ask) prices and their [Adjusted Prices](#adjusted-price).*
- <a id="treasury-quotes"></a>**Treasury Quotes** = `{ @CUSIP + Security_Type + Coupon_Rate + Maturity_Date + Ask_Price + ( Bid_Price ) }`
  *The nominal Treasuries in [Market quotes (S7)](#s7), STRIPS included.*
- <a id="tips-yields"></a>**TIPS Yields** = `{ [ TIPS_Prices | TIPS_Quotes ] + Ask_Yield + ( Bid_Yield ) }`
  *Each TIPS with the [yield](#yield) calculated from its price at its settlement date. A quoted TIPS also has the yield of its bid price.*
- <a id="treasury-yields"></a>**Treasury Yields** = `{ [ Treasury_Prices | Treasury_Quotes ] + Ask_Yield + ( Bid_Yield ) }`
  *Each nominal Treasury with the [yield](#yield) calculated from its price at its settlement date. A quoted Treasury also has the yield of its bid price; a Treasury from [FedInvest prices (S1)](#s1) has one yield only, not a true ask or a true bid.*
- <a id="sa-yields"></a>**SA Yields** = `{ TIPS_Yields + SA_Price_Factor + SA_Yield }`
  *Each TIPS with its [SA Price Factor](#sa-price-factor) and [SA Yield](#sa-yield).*
- <a id="sao-yields"></a>**SAO Yields** = `{ SA_Yields + SAO_Yield }`
  *Each TIPS with its [SAO Yield](#sao-yield).*
- <a id="spot-yield-curves"></a>**Spot Yield Curves** = `{ [ Treasury | TIPS | TIPS_SA ] + { Term + Spot_Yield } }`
  *For each source shown, one [Spot Yield](#spot-yield) curve per series: fitted to the nominal Treasuries, to the TIPS quoted prices and to the TIPS seasonally adjusted prices.*
- <a id="bid-and-ask-spreads"></a>**Bid and Ask Spreads** = `{ @CUSIP + Security_Type + Yield_Spread + Price_Spread }`
  *For each security quoted on both sides: the yield spread, the [bid](#ask) yield less the ask yield, in basis points; and the price spread, the ask price less the bid price, as a percentage of the ask price, from [Adjusted Prices](#adjusted-price) for a TIPS and clean prices for a nominal Treasury. [Bid and ask spreads (S15)](#s15) holds it.*
- <a id="view-selections"></a>**View Selections** = *The choices a user makes on an app's own page, driving what it fetches and draws. Composition differs by app:*

  - *Yield Curves: `Tab + ( Spread_Mode ) + { Source } + { Series } + Maturity_Range + Horizontal_Axis_Mode + IQR_Clip_Setting` — the Treasuries, TIPS or breakeven tab; spread mode; the sources and series shown; the range of maturities; calendar or term on the horizontal axis; and whether the [IQR Clip](#iqr-clip) applies.*
  - *Yields Monitor: `Range + ( Custom_Start_Date + Custom_End_Date ) + { Symbol } + Tab + Show_Quoted + Show_SA + Sync_Zoom_And_Pan + Lock_Right + Hide_Non_Trading_Hours` — the preset or Custom time range; the symbols checked; the active tab; whether the quoted and/or seasonally adjusted line is shown; and the Sync Zoom & Pan, Lock Right and Hide non-trading hours checkboxes.*
  - *Treasury Auctions: `Tab + View + { Typed_Filter } + { Calendar_Date_Range } + Sort + { Shown_Column } + { Column_Width }` — the active tab; the view of the Historical Auctions tab (All, Bills, Notes & Bonds or TIPS); the typed column filters; the calendar date ranges; the sorted column and its direction; the columns shown, in their order; and the column widths.*
  - *Fund Holdings: `Ticker + Sort + { Column_Width }` — the fund tab; the sorted column and its direction; and the column widths.*
  - *CPI Explorer: `{ Source } + Display_Mode + ( Rolling_Window_Months ) + Start_Date + End_Date + ( Log_Scale )` — the series shown; the display mode; the months of the rolling window; the date range; and whether the vertical axis is logarithmic.*
  - *TIPS Reference: `Ref_CPI_Date + Sort + { Typed_Filter } + { Calendar_Date_Range } + Outstanding_Only` — the date of the Ref CPI the Index Ratio and coupons use; the sorted column and its direction; the typed column filters; the calendar date ranges; and whether only outstanding TIPS show.*
  - *Portal Primer: `Page + { Calculator_Entry }` — the page of the deck shown; and the entries of the calculator on it.*
  - *Seasonal Adjustments: `Page` — the page of the deck shown.*
  - *Ladder Manager: `Tab + { Expanded_Year } + { Selected_Year } + ( Popup_Request ) + ( Explore_Date )` — the tab; the funded years expanded in the ladder table; the rungs selected; the cell or button clicked to open a drill popup, the trade ticket, the cash flow calendar or an export; and the date chosen in Explore.*
- <a id="axis-scales"></a>**Axis Scales** = `Horizontal_Axis_Range + Vertical_Axis_Range`
  *The ranges of the two chart axes: the horizontal axis in calendar dates or in [Term](#term), and the vertical axis in yield, floored by any [IQR Clip](#iqr-clip).*
- <a id="drill-request"></a>**Drill Request** = `@CUSIP + Figure`
  *The security and the figure a user picks in a table, to see how the figure was calculated.*
- <a id="charts-and-tables"></a>**Charts and Tables** = *The views drawn for the user: the chart and the table of the selected tab, or the spread charts and table in spread mode, in Yield Curves; the equivalent time-series, yield-curve-snapshot or breakeven-inflation view, in Yields Monitor; the table of the active tab, in Treasury Auctions; the table of the selected fund, in Fund Holdings; the chart of the selected series, in CPI Explorer; the table and its header, in TIPS Reference; the page of the deck and the calculator it mounts, in Portal Primer; the page of the deck, in Seasonal Adjustments; the ladder table and its popups, in Ladder Manager.*

### 6.4 Yields Monitor

- <a id="yield-series"></a>**Yield Series** = `@Symbol + { Timestamp + Yield }`
  *One symbol's [Yield](#yield) readings over the active [View Selections](#view-selections) window, assembled from whichever combination of [Yield history (S6)](#s6), [Intraday archive (S18)](#s18) and [Market Yields](#market-yields) the range calls for.*
- <a id="day-change"></a>**Day Change** = `Latest_Yield − Prior_Close_Yield`
  *The change in [Yield](#yield) since the prior trading day's close, per symbol. `Latest_Yield` is [Live Quotes](#live-quotes)' own most recent reading, or the [Yield Series](#yield-series)'s own last point if that reading is unavailable. `Prior_Close_Yield` is ordinarily the Yield Series point timestamped 17:05 ET or earlier on the last prior trading day; when no such point exists, [Live Quotes](#live-quotes)' `PreviousDayClosing` field stands in.*
- <a id="sa-yield-series"></a>**SA Yield Series** = `@Symbol + { Timestamp + SA_Yield }`
  *A TIPS symbol's [Yield Series](#yield-series), each point carried through the same Price → SA Price → SA Yield transform an actual TIPS gets, using the real bond that symbol quoted on that point's date. Distinct from [SA Yields](#sa-yields), Yield Curves' own per-security table: this is a time series, one row per symbol rather than per security.*
- <a id="drill-popup"></a>**Drill Popup** = *The intermediate values behind one figure for one security: its seasonal adjustment, its other adjustment, or the definition of a column.*

### 6.5 TipsLadderManager

- <a id="tips-market-data"></a>**TIPS Market Data** = `{ @CUSIP + Maturity_Date + Coupon_Rate + Ref_CPI_dated + Price + Yield + ( SA_Yield ) }`
  *Every TIPS Market quotes (S7) states, keyed by CUSIP, its [SA Yield](#sa-yield) attached where [SA and SAO yields (S10)](#s10) has an entry for it. The app names this table "TIPS Mkt Data," the title of its TIPS Ref/Mkt popup's "Mkt" tab.*
- <a id="holdings-file"></a>**Holdings File**
  *A csv file the Import menu's Holdings option reads, in one of six formats: [Fidelity Export](#fidelity-export), [Schwab Export](#schwab-export), [Vanguard Export](#vanguard-export) (each a [Broker Positions Export](#broker-positions-export)), [Holdings Export](#holdings-export-format), [tipsladder.com Format](#tipsladdercom-format), [Plain CUSIP/Quantity Format](#plain-format). Its holdings are the TIPS positions it contains: the TIPS among a broker positions export's positions, the CUSIP rows of any other format.*
- <a id="broker-positions-export"></a>**Broker Positions Export**
  *A csv file downloaded from a broker's positions view (holdings view, at Vanguard) under a name the user chooses; brokers use positions and holdings interchangeably. It lists every position, of every security type, in each of usually several accounts. From the accounts the user selects, the app extracts the TIPS positions, which it calls [Holdings](#holdings).*
- <a id="fidelity-export"></a>**Fidelity Export**
  Columns read: `Account number`, `Account name`, `Symbol` (a CUSIP), `Quantity` (states [Par](#par)).
- <a id="schwab-export"></a>**Schwab Export**
  Columns read: `Symbol` (a CUSIP), `Qty (Quantity)` (states [Par](#par)).
  *Each account's rows are preceded by a row naming the account rather than a column, format `"Name ...LastFourDigits"`, e.g. `"Amy_POD ...387"`, and followed by an `"Account Total"` row.*
- <a id="vanguard-export"></a>**Vanguard Export**
  Columns read: `Account Number`, `Investment Name`, `Symbol` (a CUSIP, when present), `Shares` (states [Par](#par)).
- <a id="holdings-export-format"></a>**Holdings Export** = `{ @CUSIP + Qty + Excess_Qty }`
  *This app's prior export of a build or rebalance result. Every row is a TIPS. Header row (exact text): `cusip,qty,excess`. Example row: `912810RQ3,5,0`. May carry a trailing [DARA Plan](#dara-plan)'s `#fundedYear,dara` row and [Construction Parameters](#construction-parameters)' `#params` row.*
- <a id="tipsladdercom-format"></a>**tipsladder.com Format** = `{ CUSIP + Qty + Year }` per row, no header row, one or more rows per CUSIP
  *The file tipsladder.com's download portfolio produces, named like `TIPSLadder-<id>-portfolio.csv`. A row's `Year` equal to the CUSIP's maturity year states its funded quantity; any other `Year` states an excess quantity covering that year. Example rows: `912810RQ3,5,2030` then `912810RQ3,2,2031`.*
- <a id="plain-format"></a>**Plain CUSIP/Quantity Format** = `{ CUSIP + Qty }` per row, optional header row
  *Every row states a total quantity, with no funded/excess split. Example row: `912810RQ3,5`.*
- <a id="dara-plan-file"></a>**DARA Plan File** = `#fundedYear,dara` header row + `{ Year + DARA }` rows + ( `#params,key=value,...` parameter row )
  *A csv file holding a [DARA Plan](#dara-plan). `Year` format: `YYYY`. `DARA` format: a plain number. Header row (exact text): `#fundedYear,dara`. Example data row: `2030,12000`. The optional parameter row carries [Construction Parameters](#construction-parameters), e.g. `#params,preLadderInterest=true,maturityPref=last,couponPref=higher,refCpiDate=2026-04-01,availableCash=5000,rmdCouponMode=all`.*
- <a id="holdings"></a>**Holdings** = `{ @CUSIP + Qty + ( Excess_Qty ) }`
  *The TIPS positions a [Holdings File](#holdings-file) contains, as per-CUSIP quantities. `Excess_Qty` (the funded/excess split already known, rather than left for DARA math to derive) is present for the [Holdings Export](#holdings-export-format) and [tipsladder.com](#tipsladdercom-format) layouts, absent for [Fidelity](#fidelity-export), [Schwab](#schwab-export), [Vanguard](#vanguard-export) and [Plain CUSIP/Quantity](#plain-format).*
- <a id="dara-plan"></a>**DARA Plan** = `{ Funded_Year + DARA } + ( Construction_Parameters )`
  *The holder's stated per-year [DARA](#dara) target, for every year a `#fundedYear,dara` block names — gap and Future 30Y years included. May carry [Construction Parameters](#construction-parameters) alongside it.*
- <a id="per-year-dara"></a>**Per-Year DARA** = `{ Funded_Year + DARA }`
  *The resolved [DARA](#dara) target for every year in a ladder's range, however it was arrived at — typed by hand, derived from holdings, or a loaded [DARA Plan](#dara-plan) — the shape the ladder-sizing engine consumes.*
- <a id="construction-parameters"></a>**Construction Parameters** = [Pre-Ladder Interest](#pre-ladder-interest) + Maturity_Preference + Maturity_Picks + Coupon_Preference + [Within-Year Allocation Policy](#within-year-allocation-policy) + [Available Cash](#available-cash) + Settlement_Year_Coupon_Mode + DARA_Reference_Date
  *Settings a `#fundedYear,dara` block cannot encode but which still change the target ladder — maturity preference, the maturity picks of Select maturities, and coupon preference, the within-year allocation policy, the settlement-year coupon-counting choice, and the Ref CPI date the plan's DARA values are denominated at. Carried in an optional `#params,key=value,...` row alongside a [DARA Plan](#dara-plan)'s `#fundedYear,dara` block, present only when the source file carries one.*

- <a id="ladder-parameters"></a>**Ladder Parameters** = `( DARA ) + First_Year + Last_Year + ( Per_Year_DARA ) + ( Construction_Parameters )`
  *What the holder sets on the ladder form before Build Ladder or Rebalance Ladder: the scalar [DARA](#dara) of a Build, the first and last funded year, the [Per-Year DARA](#per-year-dara) typed in the group header rows of the ladder table, and the [Construction Parameters](#construction-parameters).*
- <a id="build-result"></a>**Build Result** = `{ @CUSIP + Maturity_Date + Funded_Year + Funded_Year_Qty + Excess_Qty + Funded_Year_Amount + Cost + Excess_Cost } + { Gap_Year_Amount } + { Future_30Y_Amount } + Weighted_Modified_Duration + Weighted_Yield + Weighted_SA_Yield`
  *One row for each funded TIPS of the ladder a Build sizes from the [Per-Year DARA](#per-year-dara), with the [Amount](#aa) of each gap year and Future 30Y year, and the weighted averages across the market value of every row. [4.3.2](../TipsLadderManager/knowledge/4.3_Build_Ladder.md#build-the-ladder) produces it.*
- <a id="before-state-preview"></a>**Before-State Preview** = `{ @Funded_Year + Qty + Cost + Amount + ( Excess_Flag ) }`
  *What the holdings are worth today for each funded year, valued from the held quantities and market data alone, with no DARA and no sizing. A candidate bracket year whose raw [ARA](#ara) stands off the curve through the held years is flagged as excess. [4.4.2](../TipsLadderManager/knowledge/4.4_Rebalance_Ladder.md#preview-before-state) produces it as soon as holdings load.*
- <a id="rebalance-result"></a>**Rebalance Result** = `{ @CUSIP + Funded_Year + Qty_Before + Qty_After + Excess_Qty_After + Amount_Before + Amount_After + Cost_Before + Cost_After } + Net_Cash + Weighted_Modified_Duration + Weighted_Yield + Weighted_SA_Yield`
  *One Before and After row for each held or target CUSIP, with the buy or sell quantity as the difference, the net cash the trades require, and the weighted averages across the after-trade market value of every row. [4.4.3](../TipsLadderManager/knowledge/4.4_Rebalance_Ladder.md#rebalance-the-ladder) produces it.*
- <a id="ladder-table"></a>**Ladder Table** = `{ Funded_Year_Group + { TIPS_Row } } + Totals_Row`
  *The table of the ladder shown, in Build or in Rebalance: the rows of the [Build Result](#build-result), or of the [Before-State Preview](#before-state-preview) and the [Rebalance Result](#rebalance-result), grouped by funded year, each group under a header row, with the totals row.*
- <a id="ladder-export"></a>**Ladder Export** = `[ Ladder_CSV | Holdings_Export | DARA_Plan_File ]`
  *A csv file the Export menu writes: the ladder table as shown, the [Holdings Export](#holdings-export-format) of the ladder, or the [DARA Plan File](#dara-plan-file). [4.5.6](../TipsLadderManager/knowledge/4.5.6_Export_Holdings_And_DARA_Plan.md#params-row) specifies each.*

### 6.6 CPI Explorer

- <a id="cpi-series"></a>**CPI Series** = `@Source + { Date + Value } + ( Total_Change + Annualized_Change )`
  *One selected source, [CPI-U NSA](#cpi-nsa), [CPI-U SA](#cpi-sa) or [Ref CPI](#ref-cpi), in the selected display mode: the date and value of each point. For Point-to-Point % it also holds the [CPI Change (Point-to-Point)](#cpi-change-p2p) and its [CPI CAGR](#cpi-cagr).*

### 6.7 TIPS Reference

- <a id="tips-reference-rows"></a>**TIPS Reference Rows** = `{ @CUSIP + Maturity_Date + Coupon_Rate + Dated_Date + Ref_CPI_dated + ( Price + Yield + Term + Duration ) + ( Index_Ratio + Adjusted_Price + Next_Coupon ) }`
  *One row for each TIPS in [TIPS reference data (S2)](#s2), with the quote of [Market quotes (S7)](#s7) where it has one. [6.1](../TipsReference/knowledge/6.1_Load_TIPS_Data.md) states the first part and [6.2](../TipsReference/knowledge/6.2_Calculate_Index_Ratios_And_Coupons.md) adds the second: the [Index Ratio](#index-ratio) and [Adjusted Price](#adjusted-price) at the Ref CPI Date, and the next coupon date with its Index Ratio and the coupon paid on $1,000 of par.*

### 6.8 Portal Primer

- <a id="deck-pages"></a>**Deck Pages** = `{ @Page_Id + Chapter + Title + { Block } }`
  *The pages of [Deck content](#deck-content), in the order the file states, each with its chapter, its title and its blocks of text.*
- <a id="deck-content"></a>**Deck Content**, `Primer/content/deck.md`
  *The file of the Portal Primer that holds the order, the chapter, the title and the text of every page. It is kept in the app, and no job writes it.*
