# AMD Formula Analysis — Working Notes
*Status: Implemented on branch `worktree-amd-formula-analysis` — pending review and merge*

---

## Background

The TipsLadderManager was recently enhanced to include Accrued Market Discount (AMD) from excess 2052 TIPS holdings as an income source that reduces the number of funded-year bonds needed. The current implementation was found to use the wrong mathematical model.

---

## Foundational Principle (confirmed, do not change)

**Sell as soon as possible.** Each year a new 30Y TIPS is issued (2057 in Feb 2027, 2058 in Feb 2028, …, 2066 in Feb 2036), excess 2052 holdings are sold and the proceeds used to buy the newly-issued bond. This is the foundational design principle of the rebalancing feature.

Duration matching with bracket pairs (2052 upper cover, 2056 lower cover) is a **temporary approximation** — a placeholder until the actual desired TIPS become available. Rolling into each new issuance as soon as possible replaces synthetic coverage with actual coverage, which improves duration matching by keeping bracket years as close together as possible. This minimizes drift from non-parallel yield curve shifts.

*Note: A "hold to maturity" variant (excess 2052s never sold, AMD realized only at 2052 maturity) could be a future PR enhancement, consistent with how other ladder apps work. But sell-ASAP is and remains the default.*

---

## Why the Current Formula Is Wrong

The current spec and code use **annual accretion on remaining holdings**:

```
AMD(Y) = exQty × (2036 − Y) / N × amdPerBondPerYear    ← WRONG (not cash)
```

This is an accounting entry, not a cash flow. No cash arrives from market discount accretion — cash only arrives when bonds are **sold**. Since the funded year's purpose is to pay actual liabilities, only real cash flows count. Annual accretion does not fund liabilities.

Additionally, this formula produces a **decreasing** AMD profile (maximum in 2027, near zero in 2036), which is the wrong direction.

---

## Definitions

```
settlementYear       = 2026  (current)
N                    = 2036 − settlementYear = 10  (total swaps: one per year 2027–2036)
exQty                = excess 2052 bonds at settlement (constant — fixed at settlement)
C                    = cost per bond at settlement (accreted price, ~65 cents on the dollar × index ratio × 1000)
amdPerBondPerYear    = (principalPerBond − C) / yearsToMaturity  (straight-line annual accretion rate)
rate                 = shorthand for amdPerBondPerYear in formulas below
```

First swap year: **settlementYear + 1 = 2027** (the 2056 and 2036 TIPS were already issued in early 2026, so they are held at settlement; the next new 30Y TIPS is the 2057, issuing February 2027).

---

## Correct Cash-Flow Framing

For funded year Y, AMD cash income = **(gain above original cost) × (quantity sold in year Y)**.

Under constant yields, each bond accretes straight-line toward par. A bond sold in year Y has appreciated for (Y − settlementYear) years:

```
gain per bond sold in year Y = (Y − settlementYear) × rate
```

---

## Model 1: Flat Quantity (Simple Approximation)

Assume exQty / N bonds are sold each year regardless of price changes.

```
qty_sold(Y)   = exQty / N   (constant)
AMD_cash(Y)   = (exQty / N) × (Y − settlementYear) × rate
```

| Year | Qty sold | Gain/bond | AMD cash |
|------|----------|-----------|----------|
| 2027 | exQty/N  | 1 × rate  | exQty/N × 1 × rate |
| 2028 | exQty/N  | 2 × rate  | exQty/N × 2 × rate |
| …    | …        | …         | … |
| 2036 | exQty/N  | 10 × rate | exQty/N × 10 × rate |

AMD profile: **linearly increasing**, peaks at 2036. No special case needed for 2036 (the old `2/12` partial-year factor was an artifact of the wrong annual-accretion model and does not apply here).

Total AMD realized: `exQty × rate × N(N+1)/2 / N = exQty × rate × (N+1)/2`
For N=10: `exQty × rate × 5.5`

---

## Model 2: Variable Quantity (More Accurate)

As the 2052 accretes, each bond is worth more, so **fewer bonds need to be sold** each year to raise the same dollar amount for the new 30Y TIPS purchase. Under constant yields the new 30Y TIPS cost is roughly constant per year, so:

```
qty_sold(Y)  ∝  1 / price_2052(Y)  =  1 / (C + (Y − settlementYear) × rate)
AMD_cash(Y)  ∝  (Y − settlementYear) × rate / (C + (Y − settlementYear) × rate)
```

Let `x = (Y − settlementYear) × rate`:

```
AMD_cash(Y)  ∝  x / (C + x)
```

This is still **increasing** in Y (correct direction), but curves toward an asymptote rather than rising linearly. For the 2052, C (cost per bond) is large relative to x over the 10-year window, so the curve is close to linear in practice — but not identical.

---

## Decisions Made

1. **Model 1 (flat quantity) implemented.** C >> x for the 10-year window; error is small. Model 2 (variable qty) deferred as a future refinement if needed.

2. **2036 partial-year special case removed.** The old `(2/12)` factor was an artifact of the annual-accretion model. Under realized-at-sale, 2036 is a normal year — the last tranche has appreciated the most and gets the highest AMD.

3. **AMD-driven rebalance year range extended to include 2036** (`y <= 2036` instead of `y < 2036`).

## Changes Made

| File | Change |
|------|--------|
| `src/build-lib.js` | `calcFuture30yUpperAnnualAmd` — new formula, updated comment |
| `src/rebalance-lib.js` | `calcFuture30yUpperAnnualAmdForQty` — new formula; rebalYearSet loop upper bound `< 2036` → `<= 2036` |
| `knowledge/2.0_TIPS_Ladders.md` | §Future 30Y Upper Cover AMD — formula, narrative, PLI note |
| `knowledge/4.0_Computation_Modules.md` | §Future 30Y Upper Cover AMD — formula; AMD-driven rebalance years range |
