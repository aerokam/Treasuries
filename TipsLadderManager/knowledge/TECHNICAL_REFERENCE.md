# TipsLadderManager Technical Reference

This document maps conceptual definitions from the [Master Glossary](../../shared/knowledge/GLOSSARY.md) to specific implementation variables and constants within the TipsLadderManager project.

---

## Technical Constants

| Spec Constant | Variable Name | Value / Purpose |
|---|---|---|
| REFCPI_CUSIP | `REFCPI_CUSIP` | `912810FD5` (used for fetching daily RefCPI) |
| MIN_BRACKET_YEAR | `LOWEST_LOWER_BRACKET_YEAR` | `2032` (defines the search range for the lower bracket) |

---

## Variable Mapping: Core Calculations

| Concept ID | Code Symbol (rebalance-lib.js) | Code Symbol (build-lib.js) |
|---|---|---|
| [#index-ratio] | `d.indexRatio` | `d.indexRatio` |
| [#par-value-adjusted] | `d.principalPerBond` | `d.principalPerBond` |
| [#cost-per-tips] | `d.costPerBond` | `d.costPerBond` |
| [#pi-per-tips] | `d.piPerBond` | `d.fundedYearPi` |
| [#dara] | `d.DARA` | `summary.dara` |
| [#ara] | `d.araAfterTotal` | `d.fundedYearAmt` |
| [#lmi] | `d.araAfterLaterMatInt` | `d.laterMatInt` |

---

## Quantity Tracking

| Concept ID | Code Symbol (rebalance-lib.js) | Code Symbol (build-lib.js) |
|---|---|---|
| [#quantity] (Current) | `d.qtyBefore` | N/A |
| [#quantity] (Target) | `d.qtyAfter` | `d.fundedYearQty + d.excessQty` |
| Funded Year Qty | `d.fyQty` | `d.fundedYearQty` |
| Excess Qty | `d.excessQtyAfter` | `d.excessQty` |

---

## Project-Specific Details

### Settlement Date
In this project, the settlement date is determined by `walkBackFromToday(fedinvestData)`. It is typically T+1 or the most recent available price date.

### Annual Real Amount (ARA) Components
For drill-down purposes, the code splits ARA into components:
- `d.araAfterPrincipal`: (Quantity * Adjusted Principal)
- `d.araAfterOwnCoupon`: (Quantity * Semi-annual interest * nPayments)
- `d.araAfterLaterMatInt`: Sum of LMI from already-processed rungs.
