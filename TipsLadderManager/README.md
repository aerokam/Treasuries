# TIPS Ladder Manager

A free, browser-based tool for building and rebalancing [TIPS](https://www.treasurydirect.gov/marketable-securities/tips/) (Treasury Inflation-Protected Securities) ladders.

All calculations run locally in your browser — no data is uploaded anywhere.

---

## What It Does

**Rebalance** — for existing TIPS ladder holders rebalancing into newly issued TIPS. By default keeps the excess you already hold in older lower bracket maturities.

**Build** — designs a new ladder from scratch with zero existing holdings.

---

## Traceability & Deep Drill

This tool is designed for **transparency first**. Every number in the UI is traceable to its source:
- **Level 1: UI Summary**: Actionable ladder totals and rung details.
- **Level 2: The Drill-Down**: Click any underlined value (Amount, Cost, etc.) to see the exact calculation chain.
- **Level 3: The Component Math**: Click nested variables within popups (like **Index Ratio** or **Ref CPI**) to see the underlying interpolation math and official formulas.
- **Level 4: Legal Authority**: Deep-links to the **Code of Federal Regulations (31 CFR § 356)** are provided within math popups for institutional-grade verification.

---

## Key Concepts

**TIPS** — Treasury Inflation Protected Securities: Treasury notes and bonds whose principal adjusts daily with inflation as measured by CPI-U. Coupon interest is paid semi-annually, and is calculated based on the inflation-adjusted principal. At maturity you receive the inflation-adjusted principal plus the final coupon payment. All amounts shown in the application are in *real* (inflation-adjusted, today's dollars) terms.

**TIPS Ladder** — A portfolio of TIPS maturing in successive years, which along with the semi-annual interest payments, provides a predictable inflation-adjusted amount each year throughout the ladder.

**DARA (Desired Annual Real Amount)** — Your desired annual real amount from the ladder. Each rung is sized to produce this amount.

**[Gap Years](../knowledge/DATA_DICTIONARY.md#gap-years)** — The years after the longest-dated issued 10-year TIPS maturity year and before the upper bracket year, 2040, where Treasury has not yet issued a 10-year TIPS. Excess TIPS in the surrounding *bracket* years cover them by matching the average duration of the missing maturities.

**Future 30Y Rungs** — The years after the longest issued maturity year, up to the Maximum Future 30Y Rungs of [Issuance-Dependent Values](../knowledge/DATA_DICTIONARY.md#5.1-issuance-dependent-values). Like Gap Years, they are covered by duration-matched excess, in a pair of existing long-dated TIPS ([Cover Year TIPS](../knowledge/DATA_DICTIONARY.md#cover-year-tips)).

**[Bracket Years](../knowledge/DATA_DICTIONARY.md#bracket-year)** — Maturity years used to cover Gap Years. *Upper bracket*: always the February 2040 TIPS. *Active lower bracket*: the most recently issued 10-year TIPS. With **Multi-bracket** (the default), the excess you already hold in an older lower bracket is kept and never added to; it is sold, oldest first, only if the lower brackets are over-covered ([Retained Bracket Excess](../knowledge/DATA_DICTIONARY.md#retained-bracket-excess)).

**Excess interest** — Bracket Excess and Cover Excess are ordinary held bonds: the interest they pay flows down as [LMI](../knowledge/DATA_DICTIONARY.md#lmi) to every shorter-maturity year, as any other coupon does. [Same-Maturity Excess Interest](../knowledge/DATA_DICTIONARY.md#same-maturity-excess-interest) states the interest that counts toward the Amount of the year it is paid in.

---

## Data Sources

| Data | Source | Schedule |
|---|---|---|
| Market quotes: TIPS prices and yields | A broker download | Weekdays at 5:05am, 9:35am and 2:05pm PT |
| Ref CPI | TreasuryDirect | Each BLS release date, at 6:30am PT |
| TIPS reference data (coupon, dated date Ref CPI) | FiscalData | Weekdays at 8:35am and 10:05am PT |

The market quotes are uploaded to Cloudflare R2, and the app reads the CSV data directly from R2. FedInvest prices are also stored each weekday as a dormant source, not currently used by the app.

---

## Technical Documentation & Glossary

This project is built on **spec-first development**. All logic and formulas are documented in the following knowledge-base files:

- **[Data Dictionary](../knowledge/DATA_DICTIONARY.md)**: Defines every term the specs and the app use.
- **[Bond Basics](../knowledge/Bond_Basics.md)**: Fundamental concepts for nominal Treasuries.
- **[TIPS Basics](../knowledge/TIPS_Basics.md)**: Detailed interpolation logic and inflation-adjustment rules.
- **[TIPS Ladder Rebalancing](./knowledge/3.0_TIPS_Ladder_Rebalancing.md)**: The core algorithm for rebalancing existing holdings.

---

## Getting Started

To get started, visit the [Treasury Investors Portal](https://aerokam.github.io/Treasuries/) and select the **TipsLadderManager** tool, or go directly to the [TipsLadderManager URL](https://aerokam.github.io/Treasuries/TipsLadderManager/).

---

## Local Development

For local development, execute `npx serve . -p 8080` from the root directory of the `Treasuries` repository and navigate to `http://localhost:8080/TipsLadderManager/`. (Note: Root serving is required for shared components).
