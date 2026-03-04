# TIPS Ladder Builder — Help

**URL:** https://aerokam.github.io/TipsLadderBuilder/

TIPS Ladder Builder is a free, browser-based tool for building and rebalancing [TIPS](https://www.treasurydirect.gov/marketable-securities/tips/) (Treasury Inflation-Protected Securities) ladders. All calculations run locally in your browser — no data is uploaded anywhere.

Prices are fetched from [FedInvest](https://www.treasurydirect.gov/GA-FI/FedInvest/todaySecurityPriceDetail) once daily at ~1 PM ET and committed to the repository. The app always uses the most recently stored prices.

---

## Overview

**Rebalance** — for existing TIPS ladder holders rebalancing into newly issued TIPS. Assumes you want to keep using the same lower bracket TIPS you originally purchased.

**Build** — designs a new TIPS ladder from scratch with zero existing holdings.

---

## Key Concepts

**TIPS** — Treasury bonds whose principal adjusts with CPI inflation. At maturity you receive the inflation-adjusted principal plus the final coupon. All values in this tool are in *real* (inflation-adjusted, today's dollars) terms.

**TIPS Ladder** — A portfolio of TIPS maturing in successive years, providing predictable inflation-adjusted income each year throughout the ladder period.

**DARA (Desired Annual Real Amount)** — Your target annual income from the ladder, in today's dollars. Each rung of the ladder is sized to produce this amount.

**Gap Years** — Years where Treasury has not issued TIPS (currently 2037, 2038, 2039). The ladder holds excess bonds in *bracket* years flanking the gap to match the average duration of the missing maturities.

**Bracket Years** — *Upper bracket*: always the Feb 2040 TIPS. *Lower bracket*: for Build, the latest issued 10-year TIPS before the gap; for Rebalance, the TIPS before the gap with the largest existing holdings. Excess bonds in these years duration-match the gap.

**RefCPI** — The reference CPI index value used for all inflation adjustments, derived from BLS data for the settlement date.

---

## Mode: Rebalance

For existing TIPS ladder holders. Sells excess bracket bonds and buys into newly available maturities (former gap years). Assumes you want to continue using your original lower bracket TIPS.

### Inputs

| Field | Description |
|---|---|
| **Holdings CSV** | A two-column CSV with headers `cusip` and `qty`. One row per TIPS position. See format below. |
| **DARA ($)** | Target annual real income. Leave blank to auto-infer from current holdings. |
| **Method** | **Gap** — rebalances only the bracket years and previous gap years (sells excess from brackets, buys into previous gap years). **Full** — rebalances all rungs across the full contiguous ladder range. |

#### Holdings CSV Format

```
cusip,qty
912828S50,50
91282CEJ6,30
912810QF8,100
```

A sample file is pre-populated when you click the file input — you can paste your own data over it.

### Output

**Net Cash** callout — net proceeds from sells minus buys. Negative = net purchase.

**Simple tab** — one row per TIPS position:

| Column | Description |
|---|---|
| CUSIP | Bond identifier |
| Maturity | Maturity date |
| FY | Funded year (year the bond funds) |
| Qty | Current holdings quantity |
| Target | Target quantity after rebalance |
| Delta | Change in quantity (green = buy, red = sell) |
| Cash Δ | Dollar cost of the trade (negative = proceeds from sell) |

Rows with no change are dimmed. Bracket year rows are highlighted in blue.

**Detail tab** — full computation detail including ARA before/after, later maturity interest, cost per bond, and weight verification.

---

## Mode: Build

Designs a new TIPS ladder from scratch with zero existing holdings. Currently uses the latest-maturing TIPS in each funded year.

### Inputs

| Field | Description |
|---|---|
| **DARA ($)** | Target annual real income (required). Enter any amount; up/down arrows adjust in $1,000 increments for convenience. Defaults to $10,000. |
| **Last Year** | The final funded year of the ladder. Dropdown populated from available TIPS maturities. |

The first funded year is always the current calendar year. Gap years (2037–2039) are handled automatically.

### Output

**Total Cost** callout — total purchase cost for the entire ladder.

One row per available TIPS in the ladder range:

| Column | Description |
|---|---|
| CUSIP | Bond identifier |
| Maturity | Maturity date |
| FY | Funded year |
| FY Qty | Bonds needed to fund the rung to DARA |
| Excess Qty | Extra bonds held in bracket years for duration matching *(bracket rows only)* |
| Total Qty | FY Qty + Excess Qty |
| FY Amount | Inflation-adjusted P+I from FY bonds + later maturity interest ≈ DARA |
| FY Cost | Purchase cost of FY bonds |
| Excess Amount | P+I from excess bonds at maturity *(bracket rows only)* |
| Excess Cost | Purchase cost of excess bonds *(bracket rows only)* |

Bracket rows are highlighted in blue.

The **parameters bar** shows settlement date, RefCPI, DARA, the funded year range, gap years, bracket bond durations, the duration-matching formula, and gap/excess costs.

---

## Duration Matching

For gap years, the tool creates synthetic TIPS (yield-interpolated between the bracket anchors) and calculates their average modified duration. Excess bonds are split between the lower and upper bracket so the weighted duration matches the average duration of the gap years:

```
lowerWt × lowerDur + upperWt × upperDur = gapAvgDuration
e.g.  0.46 × 9.1 (2036) + 0.54 × 12.1 (2040) = 10.7
```

---

## Data Sources

| Data | Source | Schedule |
|---|---|---|
| TIPS prices & yields | FedInvest (TreasuryDirect) | Daily ~1 PM ET, Mon–Fri |
| Reference CPI | BLS (via TreasuryDirect) | Monthly |
| TIPS metadata (coupon, base CPI) | TreasuryDirect securities list | As needed |
