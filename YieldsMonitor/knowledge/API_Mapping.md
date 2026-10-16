# Treasury Yields Monitor - API Mapping

**Disclaimer:** For personal and educational use only. Data retrieved from public chart services. [Yields](../../knowledge/DATA_DICTIONARY.md#yield) track the bid side of the market, not a mid-price, and may vary by provider — see [Close Price Investigation §4](./Close_Price_Investigation.md).

## Public Data Alternatives
While this tool uses high-resolution (intraday) and real-time data feeds, official daily closing rates can be sourced from:
- **U.S. Treasury Department:** Provides [Daily Treasury Yield Curve Rates](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve) (Nominal and Real) via XML/JSON feeds.
- **FRED (St. Louis Fed):** Offers historical data for most Treasury series with a 1-day lag.

## Time Range Mapping

| UI Label | Data Source | Provider `timeRange` / Store | Notes |
| :--- | :--- | :--- | :--- |
| **2D** | CNBC | `1D` | Intraday |
| **10D** | CNBC | `5D` | Recent history |
| **1Y / 2Y / 3Y** | CNBC, R2 | `6M` (same feed for all three) and `5D`; `yields-history/history.json` before the first `6M` bar | One `6M` read per symbol, filtered to the selected cutoff and read again only when it does not reach the cutoff or the user asked for a fresh read |
| **10Y / ALL** | R2, CNBC | `yields-history/history.json` and `5D` | Daily-close baseline plus the `5D` bars later than its last point |
| **Custom** | R2, CNBC | `yields-history/history.json` and `5D`; `1D` and the Intraday archive for the Time Series chart | Baseline plus the `5D` bars later than its last point |

## Symbol Reference

The following symbols are currently supported and grouped by security type:

### Nominal Treasuries
- `US1M`: 1-Month [Treasury Bill](../../knowledge/DATA_DICTIONARY.md#treasury-bill)
- `US2M`: 2-Month [Treasury Bill](../../knowledge/DATA_DICTIONARY.md#treasury-bill)
- `US3M`: 3-Month [Treasury Bill](../../knowledge/DATA_DICTIONARY.md#treasury-bill)
- `US6M`: 6-Month [Treasury Bill](../../knowledge/DATA_DICTIONARY.md#treasury-bill)
- `US1Y`: 1-Year [Treasury Bill](../../knowledge/DATA_DICTIONARY.md#treasury-bill)
- `US2Y`: 2-Year [Treasury Note](../../knowledge/DATA_DICTIONARY.md#treasury-note)
- `US5Y`: 5-Year [Treasury Note](../../knowledge/DATA_DICTIONARY.md#treasury-note)
- `US10Y`: 10-Year [Treasury Note](../../knowledge/DATA_DICTIONARY.md#treasury-note)
- `US30Y`: 30-Year [Treasury Bond](../../knowledge/DATA_DICTIONARY.md#treasury-bond)

### [TIPS (Treasury Inflation-Protected Securities)](../../knowledge/DATA_DICTIONARY.md#tips)
- `US1YTIPS`: 1-Year TIPS
- `US2YTIPS`: 2-Year TIPS
- `US5YTIPS`: 5-Year TIPS
- `US10YTIPS`: 10-Year TIPS
- `US30YTIPS`: 30-Year TIPS

## CNBC API

**2D, 10D ranges**: Use CNBC's chart-bar feed with mapped `timeRange` (1D, 5D).

**1Y, 2Y, 3Y ranges**: CNBC's chart-bar feed with `6M` `timeRange` — one read per symbol serves all three UI ranges and is filtered client-side to the selected cutoff.

**5D bars**: 1Y, 2Y, 3Y, 10Y, ALL and Custom append the `5D` bars later than their last point. 2D also reads `5D`, for the day change.

- **Base URL**: `https://webql-redesign.cnbcfm.com/graphql`
- **Operation**: `getQuoteChartData`
- **Persisted Query Hash**: `9e1670c29a10707c417a1efd327d4b2b1d456b77f1426e7e84fb7d399416bb6b`

## R2 Historical Baseline

Used for **10Y, ALL, and Custom** ranges. R2 CORS is live for this app's origins (`localhost:8080`, `localhost:8081`, production) — see repo-root `knowledge/Data_Pipeline.md` §3.1 for the full CORS policy. The browser fetches `history.json` directly, no proxy needed.

- **Base URL**: `https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/yields-history/`
- **File**: `history.json` — single nested object `{ "<SYMBOL>": [{x: timestamp, y: yield}, …], … }`

## No Local Fallbacks

App fetches only from remote sources (CNBC, R2). Never falls back to local files.

