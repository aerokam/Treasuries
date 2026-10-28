# TipsLadderManager Technical Reference

This document maps the terms of the [Data Dictionary](../../knowledge/DATA_DICTIONARY.md) to specific implementation variables and constants within the TipsLadderManager project.

---

## Technical Constants

| Spec Constant | Variable Name | Value / Purpose |
|---|---|---|
| `LOWEST_LOWER_BRACKET_YEAR` | `src/rebalance-lib.js#LOWEST_LOWER_BRACKET_YEAR` | `2032`, the floor of the search range for the lower bracket among the holdings (DD §5.0) |
| `LOWER_COVER_YIELD` | `src/ladder-core.js#LOWER_COVER_YIELD` | `0.04`, the yield at which the Synthetic TIPS of the first Future 30Y year is measured when the Lower cover is chosen (DD §5.0) |
| `EXCLUDE_MATURING_WITHIN_MONTHS` | `src/ladder-core.js#EXCLUDE_MATURING_WITHIN_MONTHS` | `3`, the months after the Settlement Date within which a TIPS is not offered in Build: absent from the First Year list and not chosen for a funded year (DD §5.1). `defaultFirstYear`, `tipsMaturingAfterExclusion`, the `excludeMaturingWithinMonths` argument of `selectLadderBonds` and `runBuild`, and the Build picker apply it. |
| Ladder’s last year, at most | `src/ladder-core.js#maxLastYear` | The longest issued maturity year plus the Maximum Future 30Y Rungs (DD §5.1). It is the upper bound of the Last Year selector. |

---

## Variable Mapping: Core Calculations

| Concept ID | Code Symbol (rebalance-lib.js) | Code Symbol (build-lib.js) |
|---|---|---|
| [Index Ratio](../../knowledge/DATA_DICTIONARY.md#index-ratio) | `d.indexRatio` | `d.indexRatio` |
| [Inflation-Adjusted Principal](../../knowledge/DATA_DICTIONARY.md#inflation-adjusted-principal) | `d.principalPerBond` | `d.principalPerBond` |
| [Cost per TIPS](../../knowledge/DATA_DICTIONARY.md#cost-per-tips) | `d.costPerBond` | `d.costPerBond` |
| [P+I per TIPS](../../knowledge/DATA_DICTIONARY.md#pi-per-tips) | `d.piPerBond` | `d.fundedYearPi` |
| [DARA](../../knowledge/DATA_DICTIONARY.md#dara) | `d.DARA` | `summary.dara` |
| [ARA](../../knowledge/DATA_DICTIONARY.md#ara) | `d.araAfterTotal` | `d.fundedYearAmt` |
| [LMI](../../knowledge/DATA_DICTIONARY.md#lmi) | `d.araAfterLaterMatInt` | `d.laterMatInt` |

---

## Quantity Tracking

| Concept ID | Code Symbol (rebalance-lib.js) | Code Symbol (build-lib.js) |
|---|---|---|
| [Quantity](../../knowledge/DATA_DICTIONARY.md#quantity) (Current) | `d.qtyBefore` | N/A |
| [Quantity](../../knowledge/DATA_DICTIONARY.md#quantity) (Target) | `d.qtyAfter` | `d.fundedYearQty + d.excessQty` |
| Funded Year Qty | `d.fundedYearQtyBefore`, `d.fundedYearQtyAfter` | `d.fundedYearQty` |
| Excess Qty | `d.excessQtyBefore`, `d.excessQtyAfter` | `d.excessQty` |

---

## Gap Year and Future 30Y Coverage & Ladder Bounds

Concepts from 2.0 §Duration Matching (Brackets) and §Future 30Y Cover Pair, bound to code symbols. A [Gap Year](../../knowledge/DATA_DICTIONARY.md#gap-years) and a Future 30Y year each take a pair of real TIPS.

| Concept | Code Symbol | Notes |
|---|---|---|
| First / Last Funded Year (ladder endpoints) | `firstYear` / `lastYear` | endpoints of the ladder, not bracket years |
| Lower bracket and upper bracket of the Gap Years (gap **bracket pair**) | `lowerYear`/`lowerCUSIP`, `upperYear`/`upperCUSIP` | the held [Bracket Maturity](../../knowledge/DATA_DICTIONARY.md#bracket-maturity) from `LOWEST_LOWER_BRACKET_YEAR` to the year before the first Gap Year with the most ARA above DARA; the February maturity of `UPPER_BRACKET_YEAR` (2040, `src/ladder-core.js`) |
| [Active Lower Bracket](../../knowledge/DATA_DICTIONARY.md#active-lower-bracket) | `newLowerYear`/`newLowerCUSIP` | the latest-maturing TIPS with a maturity year before the first Gap Year |
| Future-30Y lower cover / upper cover (Future-30Y **cover pair**) | `future30yLowerCoverBond` / `future30yUpperCoverBond` | the rule in 2.0 §Future 30Y Cover Pair |
| Imported excess (cover/bracket excess from the file's excess column) | `h.excessQty` (Holdings Export or tipsladder.com format import) | a calculated field, only ever written by this app's export; records build intent, not user-edited |
| First-funded-year recovery (reverse-engineer gap duration match) | `inferFirstYearFromHoldings` | gap side may use the excess→DARA ratio shortcut |
| Last-funded-year recovery (reverse-engineer Future-30Y duration match) | `inferLastYearFromHoldings` | matches the imported cover split; user-overridable |

---

## Project-Specific Details

### Settlement Date
The [Settlement Date](../../knowledge/DATA_DICTIONARY.md#settlement-date) is set by `loadMarketData()`, as [Load Market Data (4.1)](./4.1_Load_Market_Data.md) states.

### Annual Real Amount (ARA) Components
For drill-down purposes, the code splits ARA into components:
- `d.araAfterPrincipal`: (Quantity * Adjusted Principal)
- `d.araAfterOwnCoupon`: the [Last-Year Interest](../../knowledge/DATA_DICTIONARY.md#last-year-interest) of the Quantity
- `d.araAfterLaterMatInt`: Sum of LMI from already-processed rungs.

## Names in `build-lib.js` and `rebalance-lib.js`

`build-lib.js` and `rebalance-lib.js` use one name per concept:

| Concept | Name |
|---|---|
| Lower bracket year modified duration | `lowerDuration` |
| Upper bracket year modified duration | `upperDuration` |
| Lower [Bracket Weight](../../knowledge/DATA_DICTIONARY.md#bracket-weight) | `lowerWeight` |
| Upper Bracket Weight | `upperWeight` |
| [Funded Year](../../knowledge/DATA_DICTIONARY.md#funded-year) quantity | `fundedYearQty` |
| [Cost per TIPS](../../knowledge/DATA_DICTIONARY.md#cost-per-tips) | `costPerBond` |
| [Excess TIPS](../../knowledge/DATA_DICTIONARY.md#excess-tips) quantity | `excessQty` |
