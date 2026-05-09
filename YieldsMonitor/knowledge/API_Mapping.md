# Treasury Yields Monitor - API Mapping

**Disclaimer:** For personal and educational use only. Data retrieved from public chart services. [Yields](../../knowledge/DATA_DICTIONARY.md#yield) represent market mid-prices and may vary by provider.

## Public Data Alternatives
While this tool uses high-resolution (intraday) and real-time data feeds, official daily closing rates can be sourced from:
- **U.S. Treasury Department:** Provides [Daily Treasury Yield Curve Rates](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve) (Nominal and Real) via XML/JSON feeds.
- **FRED (St. Louis Fed):** Offers historical data for most Treasury series with a 1-day lag.

## Time Range Mapping

The underlying data provider uses specific `timeRange` parameters that do not always align with the logical span of the data returned. The following mapping is used to provide a consistent user experience:

| UI Label | Provider `timeRange` Parameter | Actual/Observed Span |
| :--- | :--- | :--- |
| **2D** | `1D` | Intraday (approx. 2 days) |
| **10D** | `5D` | Recent history (approx. 10 days) |
| **1Y** | `1M` | 1 Year of historical data |
| **2Y** | `3M` | 2 Years of historical data |
| **3Y** | `6M` | 3 Years of historical data |
| **10Y** | `5Y` | 10 Years of historical data |
| **ALL** | `ALL` | Full available history |

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

## CNBC API Requirements (App Data Source)

All YieldsMonitor app data comes from CNBC. The `timeRange` parameter **must** use the mapped values in the table above, not the UI labels.

- **Base URL**: `https://webql-redesign.cnbcfm.com/graphql`
- **Operation**: `getQuoteChartData`
- **Persisted Query Hash**: `9e1670c29a10707c417a1efd327d4b2b1d456b77f1426e7e84fb7d399416bb6b`
- **No fallbacks**: App requires CNBC connectivity. No local files, no R2, no degraded mode.

