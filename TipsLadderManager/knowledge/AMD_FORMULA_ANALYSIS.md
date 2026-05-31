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

---

## Revision 2 — Constant-Yield Method + Per-Rung Quantity (current)

The straight-line model above (Model 1) was superseded. Two problems with flat `exQty / N`:

1. **Quantity is not flat.** The excess 2052 is the long-duration lever in the cover pair. Rolling into the *nearest* new 30Y (2057, adjacent to the 2056) releases almost no 2052 (upper weight ≈ 0.0075); rolling into the *farthest* (2066) releases the most. Selling `exQty / N` every year mis-states both ends by large factors. The per-year quantity must come from the duration-match decomposition.

2. **Accretion is not linear.** A deep-discount bond accretes **convexly** toward par under a constant yield. Straight-line overstates early-year gain and understates late-year gain.

### The two-factor (decoupled) model

```
q(Y)           = rung.qty × 1000 × wUpper(rung) / costPerBond_2052      // duration side
gainPerBond(Y) = (priceFromYield(yield, coupon, saleDate(Y), mat) − price) / 100 × IR_settle × 1000   // pricing side
AMD(Y)         = q(Y) × gainPerBond(Y)
   saleYear(Y) = rung.year − 30   (nearest-first roll: 2057→2027 … 2066→2036)
   wUpper(rung)= (rung.dur − d_2056) / (d_2052 − d_2056)
```

- **Quantity** is a pure duration result; **gain** is a pure pricing result; AMD is their product. This is the decoupling MtnBiker pushed for: income realization is driven by accretion/duration drift, not by the purchase decision — yet it coincides with the "sell to buy the new 30Y" roll, which remains the founding paradigm (assume each new 30Y *is* bought).
- **Closure is exact:** with the future-30Y block average duration computed **cost-weighted** (`Σ qty·dur / Σ qty`), `Σ q(Y) = future30yUpperExQty` identically — the schedule is a partition of the held excess, no residual. Verified empirically (a simple-mean block average left a ~4.66% residual; cost-weighting removes it).
- **Cost-weighting also applies to the gap block** — required now that per-year DARA can be uneven (a heavier-funded rung must pull the average toward its duration). Simple mean is wrong under uneven funding.
- **`N`, `amdPerBondPerYear`, and the hardcoded `≤ 2036` cap are removed.** The sale-year range is exactly `{rung.year − 30}`, so a smaller `lastYear` shortens it automatically.

### Empirical shape (DARA $80k, 2027–2066, settlement 2026-05-29)

`q(Y)` ran 0.7 (2027, buy 2057) → 110 (2036, buy 2066); `gainPerBond` ran $11 → $170; total AMD ≈ $64.8k vs $61.9k under flat-1/N — similar total, very different (back-loaded) shape.

### Decisions

- **Sale date** = last calendar day of February (`new Date(saleYear, 2, 0)`). The trading-day adjustment (≤ 3 days on a 26-year bond) is immaterial to the accreted price, so bond-holiday data is not threaded into the libs.
- **Yield anchor** = the 2052's own quoted YTM held constant; cost basis = its quoted price.
- **2052 only.** The 2056 cover carries a smaller discount; AMD for it is a possible future extension.

### Changes Made (Revision 2)

| File | Change |
|------|--------|
| `src/build-lib.js` | `calcGapParams` + `calcFuture30yParams` avgDuration → cost-weighted; `calcFuture30yUpperAnnualAmd` → `amdByYear` map (constant-yield × per-rung q); removed `future30yUpperN` / `future30yUpperAmdPerBondPerYear`; import `priceFromYield` |
| `src/rebalance-lib.js` | same avgDuration + AMD changes; `calcFuture30yUpperAnnualAmdForQty` scales the map linearly; `rebalYearSet` follows sale years (no `≤ 2036`) |
| `knowledge/2.0_TIPS_Ladders.md` | §Future 30Y Upper Cover AMD rewrite; §Duration Matching cost-weighted note; Transparency derivation note |
| `knowledge/4.0_Computation_Modules.md` | AMD section rewrite; gap `avgDuration` comment |

---

## Revision 3 — AMD as interest on the held position (current)

Revision 2 booked AMD as `q(Y) × gainPerBond(Y)` — the realized gain on *the bonds sold that year*. That is the wrong **timing**. Because the near rungs (2057, adjacent to the 2056 lower cover) release almost no 2052 (`q ≈ 0.7`), the 2027 AMD came out to ~$9 (or ~$4 at a smaller exQty) — effectively nothing in the early years, with everything dumped at the back (2036 ≈ $18.8k). The user flagged this: the 2052s are deep-discount, near-zero-coupon TIPS, and the discount accretes **as it goes** — early years should realize real income.

### Correct framing — AMD is interest

A par bond returns its yield as coupon; a zero-coupon bond returns it all as accreted discount. The 2052 (0.125% coupon vs ~2.7% yield) is near the zero-coupon end, so almost all its return is accretion. Under the constant-yield method that accretion **is** interest above the coupon. We sell a few bonds each year only to turn that accrued interest into cash — but the **income is the interest that accrued on the position still held**, not the gain on the bonds sold.

```
adjPrice(Y) = priceFromYield(yield, coupon, saleDate(Y), mat)/100 × IR_settle × 1000;  adjPrice(settle)=cost
a(Y)   = adjPrice(Y) − adjPrice(Y−1)                 // per-bond accretion increment (basis steps up)
qRoll(Y) = rung.qty × 1000 × wUpper(rung) / cost      // 2052s sold into the Feb roll (Σ qRoll = exQty)
H(Y)   = exQty − Σ_{y<Y} qRoll(y)                     // bonds still held entering year Y
AMD(Y) = H(Y) × a(Y)
```

### The exact reconciliation (why Rev 2 and Rev 3 totals are identical)

By Abel (summation by parts), with `Σ qRoll = exQty`:

```
Σ_Y H(Y)·a(Y)  ≡  Σ_Y qRoll(Y)·(adjPrice(Y) − cost)
   (interest realized as it accrues)   (gain on bonds sold)
```

Verified empirically (DARA $80k, exQty 537, settlement 2026-05-29): **both total $64,866** (Rev 2 production was $64,848; the $18 difference is last-trading-day vs last-cal-day Feb rounding). Only the **shape** changed — Rev 3 is a front-loaded hump, Rev 2 was back-loaded:

| saleYr | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033 | 2034 | 2035 | 2036 |
|---|---|---|---|---|---|---|---|---|---|---|
| **Rev 3 (H×a)** | 6,208 | 8,468 | 8,465 | 8,334 | 7,975 | 7,401 | 6,513 | 5,393 | 3,945 | 2,163 |
| Rev 2 (q×gain) | 9 | 321 | 1,004 | 2,062 | 3,567 | 5,535 | 8,007 | 11,009 | 14,579 | 18,756 |

### Decisions (Revision 3)

- **Income = `H(Y) × a(Y)`** (interest on held position), realized as cash by selling into the roll. Sale qty (`qRoll`) and income are decoupled — the small early `qRoll` does **not** suppress early income.
- **Depletion = the duration roll `qRoll`**, `Σ = exQty` (closure preserved). Selling early depletes the back-end coverage pool; offset by the higher basis of the bonds that remain.
- **Excess only.** Funded-year 2052s are held to maturity (par); their discount is realized at maturity and already in P+I — never double-counted as AMD.
- `saleDate`, constant-yield, IR_settle, 2052-only — unchanged from Rev 2.

### Changes Made (Revision 3)

| File | Change |
|------|--------|
| `src/build-lib.js` | AMD block: `q × gainPerBond` per rung → walk sale years ascending, `AMD(Y) = held × (adjPrice(Y) − prevAdj)`, deplete `held` by `qRoll(Y)`, step basis |
| `src/rebalance-lib.js` | same AMD-block rewrite; `ForQty` linear scale unchanged |
| `knowledge/2.0_TIPS_Ladders.md` | §Future 30Y Upper Cover AMD rewritten to the interest/held-position model + Abel reconciliation |
| `knowledge/4.0_Computation_Modules.md` | AMD pseudocode rewritten (qRoll + held-walk); front-loaded profile note |
