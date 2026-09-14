# FedInvest Pricing Logic

**Reference for:** [3.1 Parse sources and calculate yields](./3.1_Parse_Sources_And_Calculate_Yields.md#parse-fedinvest-prices), [1.1.2 Select TIPS and Treasury prices](../../knowledge/1.1_Download_FedInvest_Prices.md#select-tips-and-treasury-prices)

## Overview
FedInvest (TreasuryDirect) provides daily price data for US Treasury securities. These prices are calculated from secondary-market dealer quotations surveyed by the Federal Reserve Bank of New York. For the authoritative methodology by which Treasury derives these prices, see [FedInvest Treasury Pricing Methodology](FedInvest_Treasury_Pricing_Methodology.md) (based on Treasury Fiscal Service Appendix 1).

## What FedInvest publishes
The FedInvest daily price list has three price columns per security: **Buy**, **Sell**, and **End of Day**. Which one the portal takes is specified in [1.1.2 Select TIPS and Treasury prices](../../knowledge/1.1_Download_FedInvest_Prices.md#select-tips-and-treasury-prices).

Per Treasury Fiscal Service Appendix 1:
- **Purchase prices** (FedInvest "Buy") are the average of prevailing dealer bid and asked prices on the specified security, as reported by the Federal Reserve Bank of New York (survey taken 11:15–11:45 a.m. ET each business day).
- **Redemption prices** (early sales) are the prevailing dealer bid price on the security.

### Key implications
1. **Dealer-based, not retail-actionable**: FedInvest prices derive from secondary-market dealer quotations; broker ask-side quotes reflect retail execution prices, which differ.
2. **Empirical offset**: In practice the FedInvest yield curve typically sits slightly above the broker ask-yield curve. This is an observed pattern, not a documented pricing rule.
3. **Bill sensitivity**: The discrepancy is most pronounced for short-dated Treasury Bills, where small price differences produce large annualized yield deltas.

## Usage in Treasury Investors Portal
The portal uses FedInvest as a primary daily data source due to its stability and comprehensive coverage.
When comparing sources on the Yield Curves charts:
-   **FedInvest (Dotted Lines)**: yields derived from FedInvest prices.
-   **Broker/Market (Solid Lines)**: actionable ask-side quotes.
