# Shared Modules (M)

A module here is a real, independently reusable implementation — a whole file, not a single
formula small enough to restate inline — called by two or more sibling processes. It is drawn on
every consuming process's diagram as a circle in a distinct color, never a rectangle —
a rectangle is already the entity shape, so a module stays circular, process-like, and lets its
color alone say "not a pipeline step of this diagram." Each drawing points at the one entry below,
so drilling down through any caller reaches the same spec (`DFD_Worklist.md` §2.0). A module used by
only one process today is not registered here — it becomes an entry the moment a second caller needs
it, never ahead of that.

Each entry names the module's purpose and the exports its callers actually use, and lists every
process that calls it. It does not restate what a caller does with the export — that belongs to the
caller's spec.

---

## <a id="m1"></a>csv.js (M1)
**File**: `shared/src/csv.js`
**Purpose**: The one CSV parser every browser-side app uses to read an R2 file or an imported file. Handles quoted fields (commas inside quotes); does not handle embedded newlines inside a quoted field.
**Exports**:
- `parseCsv(text, hasHeader = true)` — with a header row (default), returns one object per row keyed by header name; without one, returns one array of cell values per row.

**Called by**: [4.1.2 Fetch and parse FedInvest prices](../TipsLadderManager/knowledge/4.1_Load_Market_Data.md#fetch-and-parse-fedinvest-prices) and [4.1.3 Fetch auxiliary TIPS data](../TipsLadderManager/knowledge/4.1_Load_Market_Data.md#fetch-auxiliary-tips-data) (TipsLadderManager), [3.1.1 Parse FedInvest prices](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#parse-fedinvest-prices) and [3.1.2 Parse market quotes](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#parse-market-quotes) (YieldCurves), and every other process in the portal that reads a CSV — not yet swept for a complete list.

---

## <a id="m2"></a>settlement.js (M2)
**File**: `shared/src/settlement.js`
**Purpose**: Settlement-date and payment-date arithmetic shared across apps — [Settlement Date](./DATA_DICTIONARY.md#settlement-date) (Trade Date + 1 bond trading day, excluding weekends and SIFMA bond-market holidays), and whether a coupon or principal payment due on a weekend or holiday has actually been paid as of a given date.
**Exports**:
- `localDate(s)` — parses `'YYYY-MM-DD'` into a local-time `Date`.
- `toIsoDate(date)` — formats a `Date` back to `'YYYY-MM-DD'`.
- `nextBusinessDay(date, holidaySet)` — the next date that is not a weekend or a listed holiday; always advances at least one day.
- `parseHolidaySet(rows)` — builds the holiday `Set` from [Bond holidays (S16)](./DATA_DICTIONARY.md#s16)'s rows.
- `actualPaymentDate(d, holidaySet)` — the date a payment scheduled for `d` is actually made: `d` itself if already a trading day, otherwise the next one. Not the same as `nextBusinessDay`, which always advances.
- `lastBusinessDayOfMonth(year, monthIndex, holidaySet)` — the last bond trading day of a month (`monthIndex` is 0-based).

**Called by**: [4.1.1 Fetch and parse market quotes](../TipsLadderManager/knowledge/4.1_Load_Market_Data.md#fetch-and-parse-market-quotes) and [4.1.3 Fetch auxiliary TIPS data](../TipsLadderManager/knowledge/4.1_Load_Market_Data.md#fetch-auxiliary-tips-data) (TipsLadderManager), and the Rebalance ladder process (`actualPaymentDate` for the Cash Flow Calendar and settlement-year LMI — see [2.0 TIPS Ladders §Gap Year Coverage Model](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#gap-year-coverage-model)), [3.1.6 Determine settlement date](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#determine-settlement-date) (YieldCurves), and other processes across the portal — not yet swept for a complete list.

---

## <a id="m3"></a>bond-math.js (M3)
**File**: `shared/src/bond-math.js`
**Purpose**: The one bond-math library — yield from price, price from yield, duration, accrued interest, coupon schedule, term — used by every app that prices a Treasury or TIPS security.
**Exports used across the callers below**:
- `yieldFromPrice(cleanPrice, coupon, settle, mature)` / `priceFromYield(yld, coupon, settle, mature)` — the yield-from-price calculation and its inverse, for every security type and every source (`DFD_Worklist.md` §3.0 item 14).
- `accruedInterest(coupon, settle, mature)`, `couponSchedule(settle, mature)` — day-count proration and coupon payment dates.
- `bondCalcs(bond, refCPI)` — the Index Ratio, the Index Ratio rounded as Treasury rounds it, and the principal, cost, interest and P+I of one $1,000 unit.
- `calculateDuration` / `calculateMDuration` / `calculateDurationDetail` — Macaulay and Modified Duration.
- `termYears(settle, maturity)` — the one term measure (`DFD_Worklist.md` §3.9).
- `cashflowSchedule`, `daysBetween`, `daysInYearFrom`, `calcMktWtdAvg` — supporting calculations for the above.

**Called by**: [4.1.1 Fetch and parse market quotes](../TipsLadderManager/knowledge/4.1_Load_Market_Data.md#fetch-and-parse-market-quotes) (TipsLadderManager, `yieldFromPrice`), [4.3.2 Build the ladder](../TipsLadderManager/knowledge/4.3_Build_Ladder.md#build-the-ladder) and [4.4.3 Rebalance the ladder](../TipsLadderManager/knowledge/4.4_Rebalance_Ladder.md#rebalance-the-ladder) (TipsLadderManager — `accruedInterest`, `bondCalcs`, `couponSchedule`), [3.1.7 Calculate TIPS yields](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#calculate-tips-yields) and [3.1.8 Calculate Treasury yields](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#calculate-treasury-yields) (YieldCurves), and other processes across the portal — not yet swept for a complete list.

**Contracts**:

`shared/src/bond-math.js` is the bond-math library of every app. The contracts below are the ones that TipsLadderManager uses. It has no ladder state and no running totals. The formulas are in [TIPS Basics](./TIPS_Basics.md).

<a id="bondcalcs"></a>
### `bondCalcs(bond, refCPI)`

**Inputs:**
- `bond` — `{ price, coupon, datedDateRefCpi, maturity: Date }`. A missing `coupon` and a missing `price` are 0, and a missing `datedDateRefCpi` is `refCPI`, which gives an Index Ratio of 1.
- `refCPI` — number (the Ref CPI of the settlement date)

**Returns:**
```
{
  indexRatio,        // refCPI / bond.datedDateRefCpi, unrounded                       → DD Index Ratio
  paymentIndexRatio, // indexRatio truncated to 6 decimals, rounded to 5                → DD Inflation-Adjusted Principal
  principalPerBond,  // 1,000 × paymentIndexRatio                                      → DD Inflation-Adjusted Principal
  costPerBond,       // price/100 × indexRatio × 1,000                                 → DD Cost per TIPS
  nPeriods,          // 1 if the maturity month < 7, else 2                            → DD Last-Year Interest
  couponPerPeriod,   // bond.coupon / 2
  ownRungInt,        // principalPerBond × couponPerPeriod × nPeriods                  → DD Last-Year Interest
  piPerBond,         // principalPerBond + ownRungInt                                  → DD P+I per TIPS
  annualInt,         // principalPerBond × bond.coupon                                 → DD Annual Interest (Nominal)
}
```

`piPerBond` equals `principalPerBond × (1 + coupon/2 × nPeriods)`, which is `adjustedPrincipal + lastYearInterest`.

<a id="calculateduration"></a>
### `calculateDuration(settlement, maturity, coupon, yld)` → Macaulay Duration

Returns the Macaulay duration in **years**, or `null` when the inputs are degenerate.

**Convention:** Actual/Actual day count, semi-annual compounding (frequency = 2). It matches the Google Sheets `DURATION(settlement, maturity, coupon, yld, 2, 1)`.

**Guard conditions:**
- Returns `null` if `settlement >= maturity`.
- Returns `null` if `yld ≤ −2`, because `1 + yld/2` would be 0 or negative. Negative yields between −2 and 0 are valid.

**Algorithm:**

1. Find `nextCpn`, the first coupon date strictly after `settlement` (the semi-annual schedule aligned to the maturity month and day). A coupon payable on the settlement date is the seller's, so on a coupon date `lastCpn = settlement` and `DSC = E`.
2. Find `lastCpn`, which is `nextCpn` minus one semi-annual period.
3. Calculate the period variables:
   - `E   = days(lastCpn, nextCpn)` — the length of the current coupon period in days
   - `DSC = days(settlement, nextCpn)` — the days from settlement to the next coupon
   - `w   = DSC / E` — the fractional first period (0 < w ≤ 1)
4. Enumerate the coupon dates `nextCpn, nextCpn + 1 period, …` up to and including `maturity`. `N` is their count.
5. For each period index `j = 0, 1, …, N−1`:
   - `t_j  = w + j` — the time to payment, in semi-annual periods
   - `CF_j = coupon/2 × 1000` — the semi-annual cash flow per $1,000 face
   - The final period adds the principal: `CF_{N-1} = coupon/2 × 1000 + 1000`
   - `PV_j = CF_j / (1 + yld/2)^{t_j}`
6. Return `Σ(t_j × PV_j) / Σ(PV_j) / 2`. The final `/ 2` converts semi-annual periods to years.

**Used by:** `calculateMDuration`.

**Implementation:** `calculateDuration` returns `calculateDurationDetail(settlement, maturity, coupon, yld)?.macaulay ?? null`.

<a id="calculatedurationdetail"></a>
### `calculateDurationDetail(settlement, maturity, coupon, yld)` → Macaulay Duration workings

The one implementation of the algorithm above. `calculateDuration` and every synthetic-duration caller in `gap-math.js` (`gapParamsCore`, `future30yParamsCore`) take their number from this function. It returns `null` under the guard conditions of `calculateDuration`.

**Returns:**
```
{
  nextCpn, lastCpn,   // Date — the coupon-date pair the walk starts from
  E, DSC, w,          // day-count fractions (algorithm steps 2–3)
  periods,            // [{ date, t, cf, pv }] — one entry per coupon date (algorithm step 5)
  macaulay,           // Σ(t × PV) / Σ(PV) / 2 — the value calculateDuration returns
}
```

**Used by:** the nested (Level-3) drills `gapdur-<year>` and `f30dur-<year>` ([4.5.2 §Nested (Level-3) drills](../TipsLadderManager/knowledge/4.5.2_Show_Drill_Popups.md#nested-drills)), the only consumers that need the workings and not only the number.

<a id="calculatemduration"></a>
### `calculateMDuration(settlement, maturity, coupon, yld)` → Modified Duration

```
mac = calculateDuration(settlement, maturity, coupon, yld)
return mac != null ? mac / (1 + yld/2) : null
```

**Spec reference:** [TIPS Basics §Duration](./TIPS_Basics.md) and §Yield Calculation Conventions. **Used by:** the durations of the Synthetic TIPS and of the brackets and covers (`gap-math.js`, `ladder-core.js`, `rebalance-lib.js`), and the weighted average duration ([Weighted Modified Duration](#weighted-modified-duration)).

<a id="couponschedule"></a>
### `couponSchedule(settle, maturity)` — coupon payment dates

```
nextCpn = first coupon date on or after settle (the schedule of calculateDuration)
dates   = [nextCpn, nextCpn + 1 period, …] up to and including maturity
```

**Returns:** an array of `Date`, earliest first, and `[]` when no coupon date exists on or before `maturity` (as `calculateDuration` guards). The last entry is `maturity`: the walk never passes it, and the principal is repaid the same day as the last coupon.

It uses `_nextCouponOnOrAfter`, the finder beneath `_nextCouponAfter` (which `calculateDuration`, `yieldFromPrice`, `priceFromYield` and `accruedInterest` use), so the payment dates of a held TIPS agree with its duration and yield calculations from the first coupon the buyer receives. The schedule keeps on-or-after because a payment dated the settlement date is still listed, and the duration and yield walks start at the coupon after it. **Used by:** [4.5.4 §Cash Flow Calendar](../TipsLadderManager/knowledge/4.5.4_Show_Cash_Flow_Calendar.md#cash-flow-calendar) and `remainingCouponPaymentsThisYear` (`ladder-core.js`).

<a id="accruedinterest"></a>
### `accruedInterest(coupon, settle, mature)` — day-count proration

```
nextCoupon, lastCoupon  // the semiannual schedule of calculateDuration; nextCoupon is the first coupon date strictly after settle, so on a coupon date lastCoupon = settle and A = 0
E   = days(lastCoupon, nextCoupon)   // days in the current coupon period
A   = days(lastCoupon, settle)       // days elapsed since the last coupon
accrued = (coupon/2 × 100) × (A / E) // per $100 par, nominal, with no Index Ratio applied
```

**Returns:** `{ accrued, A, E, lastCoupon, nextCoupon }`.

**Spec reference:** [Bond Basics §Accrued Interest](./Bond_Basics.md): Actual/Actual day count, the Treasury and broker settlement convention, and not a flat half-coupon. The function returns the general nominal formula. A TIPS caller applies the Index Ratio ([TIPS Basics §Accrued Interest](./TIPS_Basics.md)). It is the one accrued-interest implementation: `yieldFromPrice` and `priceFromYield` call it and share the coupon finder `_nextCouponAfter` with `calculateDuration`, and the Accrued Interest column of the Trade Ticket ([4.5.3 §Trade Ticket](../TipsLadderManager/knowledge/4.5.3_Show_Trade_Ticket.md#trade-ticket)) calls it directly. The dollars per bond of a TIPS are `accrued/100 × indexRatio × 1000`.

<a id="weighted-modified-duration"></a>
### Weighted Modified Duration

`build-lib.js` and `rebalance-lib.js` both calculate `weightedAvgDuration` (the portfolio weighted modified duration) and return it in `summary`.

**Formula:**
```
weightedAvgDuration = Σ(mv_i × mDuration_i) / Σ(mv_i)
```

- `mv_i = totQty_i × costPerBond_i` (Build: `fundedYearQty + excessQty`. Rebalance: `qtyAfter`, which for a bracket row is `fyQty + excessQtyAfter`)
- `mDuration_i = calculateMDuration(settlementDate, bond.maturity, bond.coupon, bond.yield)`, called with the arguments of every other duration call
- The sum runs over all TIPS rows in `details`

**Implementation:** `mDuration` is calculated per detail row while the details are built, and stored on the detail object. `weightedAvgDuration` is derived from the details array after the loop (`calcMktWtdAvg`, `bond-math.js`: a null value adds 0 to the numerator and its market value still counts in the denominator).

**`weightedAvgYield` and `weightedAvgSaYield`:**
```
weightedAvgYield   = Σ(mv_i × yield_i)   / Σ(mv_i)
weightedAvgSaYield = Σ(mv_i × saYield_i) / Σ(mv_i)
```

They use the weights of `weightedAvgDuration`. `yield_i` is `d.yield` (the real yield of the market data), and `saYield_i` is `d.saYield`, which can be `null` for a holding. Both are stored on each detail row and are in the `summary` of `build-lib.js` and of `rebalance-lib.js`.

---

## <a id="m4"></a>market-quotes.js (M4)
**File**: `shared/src/market-quotes.js`
**Purpose**: Parses the combined Treasury and TIPS rows of [Market quotes (S7)](./DATA_DICTIONARY.md#s7) — the row-shape logic every consumer of that store shares, so which CUSIPs are kept, which settlement date the quote is stated at, and what to do with a dropped row stays with each caller.
**Exports**:
- `parseTipsQuotes(text)` — one row per TIPS CUSIP, with its quoted prices.
- `parseTreasuryQuotes(text, { settleIso, onUnknownCusip })` — one row per non-TIPS CUSIP (Bills, Notes, Bonds and STRIPS alike), both yields calculated from the quoted ask and bid price.
- `parseDownloadDate(text)` / `downloadDateIso(stamp)` — the Download Date on the first line, and its date part as ISO.

**Called by**: [4.1.1 Fetch and parse market quotes](../TipsLadderManager/knowledge/4.1_Load_Market_Data.md#fetch-and-parse-market-quotes) (TipsLadderManager, `parseTipsQuotes`) and [3.1.2 Parse market quotes](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#parse-market-quotes) (YieldCurves, both row parsers, for the app and for the acquisition job that writes [Yield curves (S13)](./DATA_DICTIONARY.md#s13)).

---

## <a id="m5"></a>ladder-core.js (M5)
**File**: `TipsLadderManager/src/ladder-core.js`
**Purpose**: The single authoritative implementation of "size the target ladder from a DARA." The rules it applies are in [2.0 TIPS Ladders](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md) (§Algorithm and the duration-matching, Pre-Ladder Interest and Future 30Y sections); the contracts of its functions are below.
**Exports**: `selectLadderBonds`, `sizeLadder`, `sizeFuture30yCover`, `fundedYearAmount`, `future30yRebalances`, `gapRebalances`, `maxLastYear` and the rest of its exports.

**Called by**: [Build the ladder (4.3.2)](../TipsLadderManager/knowledge/4.3_Build_Ladder.md#build-the-ladder) and [Rebalance the ladder (4.4.3)](../TipsLadderManager/knowledge/4.4_Rebalance_Ladder.md#rebalance-the-ladder).

**Contracts**:

`build-lib` and `rebalance-lib` both call `sizeLadder`. Neither re-implements funded sizing, the Pre-Ladder Interest credit, the gap and Future 30Y duration matching, or the corrected sweep. `rebalance-lib` reads the Future 30Y Pass 1 results from `sizeLadder`.

<a id="selectladderbonds"></a>
### `selectLadderBonds({ tipsMarketData, firstYear, lastYear, settlementDate, maturityPref?, couponPref?, yearOverrides?, excludeMaturingWithinMonths? })`

Picks the bond set from the TIPS market data alone: the funded-year TIPS list of each year (`selectYearTips` with `maturityPref` and `couponPref`, [2.0 §Maturity Selection Within a Funded Year](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#maturity-selection)), the 2040 upper bracket, the active lower bracket (the most recently issued 10-year TIPS before the gap), and the Future 30Y cover pair ([2.0 §Future 30Y Cover Pair](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#future-30y-cover-pair)). Returns `{ yearBondMap, yearTipsListMap, rangeYears, gapYears, future30yYears, future30yLowerYear, future30yUpperYear, future30yLowerCoverBond, future30yUpperCoverBond, future30yAnchorBond }`:

- `yearBondMap[year]` is the one representative TIPS, the latest of the list of the year. Every bracket, gap and cover path reads it, and it does not depend on `maturityPref` or `couponPref`.
- `yearTipsListMap[year]` is the ordered funded-year TIPS list (at least 1) that `sizeLadder` sizes.

This is the one source of which TIPS the target ladder holds, so Build and Rebalance size the same set. `couponPref` defaults to `'higher'`. Only `runBuild` passes a value, and `runRebalance` and `runFundedRebalance` pass none, so a Rebalance always uses `'higher'`.

- `yearOverrides` (Build and Rebalance, [2.0 §Picking Maturities for a Funded Year](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#picking-maturities)) is a `Map<year, cusip[]>` that names the TIPS list of a year. It is resolved against the candidates of the year, sorted by maturity, and used in place of `selectYearTips` for each year in the map. An override whose CUSIPs do not resolve is ignored, so `yearBondMap`, `gapYears` and `future30yYears` stay correct for a year that the picker has set to a DARA of 0. The caller sets that DARA to 0 (`_runBuildFromForm` in `index.html`): `selectLadderBonds` and `sizeLadder` have no unfunded-year concept beyond `daraByYear`.
- `excludeMaturingWithinMonths` (Build only; Rebalance passes 0) removes from the candidates a TIPS that matures no later than that many months after the settlement date ([DD §5.1](./DATA_DICTIONARY.md#5.1-issuance-dependent-values)).

<a id="sizeyearrungs"></a>
### `sizeYearRungs(list, need, refCPI)` / `aggregateRungs(rungs)`

Splits the real P+I `need` of a funded year across its ordered TIPS `list` by allocation weight (equal today), each TIPS sized from its P+I. The latest maturity takes the rounding remainder ([2.0 §Multi-TIPS Funded-Year Split](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#multi-tips-funded-year-split)). Returns `[{ bond, ir, pir, pi, coupon, qty }]`, earliest to latest, with `ir` the unrounded Index Ratio and `pir` the Index Ratio under Treasury's rule. `aggregateRungs` returns `{ qty, annualInterest, piTotal }`: the funded quantity, the real annual coupon for LMI (`qty × 1000 × pir × coupon`), and the real P+I delivered.

<a id="sizefuture30ycover"></a>
### `sizeFuture30yCover({ future30yYears, future30yLowerCoverBond, future30yUpperCoverBond, future30yAnchorBond?, settlementDate, dara, daraByYear?, refCPI })`

The Future 30Y half of duration matching ([2.0 §Duration Matching (Brackets)](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#duration-matching-brackets), [§Future 30Y Rungs](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#future-30y-rungs)): `future30yParamsCore`, then the cover durations, `bracketWeights` and `bracketExcessQtys`. It is a separate function because `rebalance-lib` needs the cover excess quantity (for the simulated TIPS interest and the Cover Excess interest) before the rest of `sizeLadder` runs. `sizeLadder` calls it too, so Build and Rebalance run the same clamped duration match. With no Future 30Y years it returns zeros and nulls.

Returns `{ future30yParams, future30yLowerDuration, future30yUpperDuration, future30yLowerWeight, future30yUpperWeight, future30yLowerExQty, future30yUpperExQty, future30yFellBack, future30yCoverReason, future30yTotalExcessCost, future30yLowerMonth, future30yUpperMonth }`. `future30yFellBack` is true when the average duration is outside the span of the cover durations, and `future30yCoverReason` is then `'aboveUpper'` or `'belowLower'`.

<a id="sizeladder"></a>
### `sizeLadder({ dara, daraByYear?, firstYear, lastYear, optionalYears?, rangeYears, gapYears, future30yYears, yearBondMap, yearTipsListMap?, tipsMarketData, refCPI, settlementDate, settlementYear, preLadderInterest?, bondHolidays?, availableCash?, rmdCouponMode?, tradeDate?, gapRetained?, <Future 30Y cover bonds and years> })`

A pure function from the per-year DARA and the bonds to the target ladder. It runs, in order:

1. The preliminary sweep (the pre-ladder bucket and the gap-LMI estimate, through `sizeYearRungs` and `aggregateRungs`), and the check that every funded year funds a bond, except the `optionalYears` of a Rebalance ([3.0 §Intentional empty rungs](../TipsLadderManager/knowledge/3.0_TIPS_Ladder_Rebalancing.md#intentional-empty-rungs-and-the-rung-validation-waiver)).
2. The Future 30Y duration match and Cover Excess, and the Simulated Outstanding Future 30Y TIPS and Cover Excess interest ([2.0 §Future 30Y Simulated Outstanding TIPS](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#future-30y-simulated-outstanding-tips)).
3. The gap stage and the credit pass ([Credit Pass](#pre-ladder-interest-option)), then the gap stage again with the credits.
4. The corrected funded sweep, longest to shortest ([2.0 §Algorithm](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#algorithm-longest-to-shortest-sweep)).

`yearTipsListMap` is optional: without it each year falls back to its one `yearBondMap[year]` TIPS.

Returns the target quantities and the parameter and Pre-Ladder Interest fields that callers show: `prelim`, `corrFYQty`, `corrLMI`, `corrRungs` (`{ [year]: rungs[] }`, the sized sub-rungs per year, which `build-lib.js` uses to emit one `results` and `details` row per sub-rung), `zeroedFundedYears`, `partialCreditYear`, `partialCredit`, the credit fields of the Credit Pass, `gapParams`, `lowerYear`, `upperYear`, the bracket weights, durations and excess quantities, `future30yParams` and the Future 30Y fields, the rebalances and the interest by year of the gap years and the Future 30Y years.

**One source for Build and Rebalance.** A Build, export, import and rebalance round trip (the CUSIP and quantity output of the Build is the holdings, with the same DARA, first year and last year) has zero trades and zero net cash. Rebalance derives the per-year DARA from the portfolio, calls `sizeLadder`, and diffs the result against the holdings into buys and sells. The holdings do not enter the sizing, and only the DARA does.

**Adapters call shared cores.** `calcGapParams` (`ladder-core.js`; the LMI above the gap is the preliminary coupon) and `calculateGapParameters` (`rebalance-lib.js`; the LMI from the actual holdings and the Future 30Y cover) are holdings and preliminary adapters, and both call `gapParamsCore` of `gap-math.js`. The gap sweep is defined once.

<a id="other-exports"></a>
### Other exports

| Export | Contract |
|---|---|
| `EXCLUDE_MATURING_WITHIN_MONTHS`, `tipsMaturingAfterExclusion`, `defaultFirstYear` | the exclusion of a TIPS near maturity and the Default First Year ([DD §5.1](./DATA_DICTIONARY.md#5.1-issuance-dependent-values)) |
| `UPPER_BRACKET_YEAR`, `upperBracketBond`, `getGapYears` | the upper bracket year (2040), its TIPS, and the [Gap Years](./DATA_DICTIONARY.md#gap-years) |
| `selectFuture30yCovers`, `LOWER_COVER_YIELD` | the cover rule ([2.0 §Future 30Y Cover Pair](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#future-30y-cover-pair)) |
| `gapIssueDate`, `future30yIssueDate`, `gapRebalances`, `future30yRebalances`, `gapInterestByYear`, `future30yInterestByYear` | the Simulated Outstanding TIPS sections above |
| `future30yLimit`, `maxLastYear` | the Maximum Future 30Y Rungs and the last year of the ladder at most ([2.0 §Limit on the ladder's last year](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#limit-on-the-ladders-last-year)) |
| `syntheticYearAmounts` | the Amount of a gap year and a Future 30Y year ([2.0](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#amount-of-a-gap-year-and-a-future-30y-year)) |
| `fundedYearAmount` | the one Amount rule of a funded year, called by Build and by the Before and After sweeps of Rebalance ([3.0 §Build ≡ Rebalance "Before" and "After"](../TipsLadderManager/knowledge/3.0_TIPS_Ladder_Rebalancing.md)) |
| `remainingCouponPaymentsThisYear`, `latestRemainingCouponDate`, `rmdCappedRemainingCoupons` | the coupon counts of the settlement year ([2.0 §Settlement-year LMI](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#settlement-year-lmi), [§Settlement-Year Coupon Treatment](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#settlement-year-coupon-treatment)) |

<a id="pre-ladder-interest-option"></a>
### Credit Pass (Pre-Ladder Interest and Available Cash)

**Options of `sizeLadder`:** `preLadderInterest` (boolean, default `false`) and `availableCash` (dollars, default 0).

Two sources credit the earliest funded years, and one pass consumes them ([2.0 §Credit Pass](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#credit-pass)):

- **Pre-Ladder Interest** ([2.0 §Pre-Ladder Interest](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#pre-ladder-interest)): when `preLadderInterest` is on, `preLadderYears = MAX(0, firstYear − settlementYear)`. The Pre-Ladder Interest is the interest of the preliminary sweep for each of those years and the three amounts credited to them for the Future 30Y years and the gap years.
- **Available Cash** ([2.0 §Available Cash](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#available-cash)): applied whenever it is non-zero, in Build and in Rebalance, whether or not the ladder starts in a later year and whether or not `preLadderInterest` is on.

The pass runs when `creditPool = availableCash + preLadderPool` is above 0. Available Cash is consumed first, and each year records the two parts separately so that the drill can show where the dollars came from.

- **Preliminary sweep** (`sizeLadder`, longest to shortest): produces `prelim[year]` with `targetFundedYearQty`, `annualInterest` and `laterMatInt` for every funded year. Its LMI is the full annual interest, and the credit pass uses the remaining-coupon LMI for the settlement year ([2.0 §Settlement-year LMI](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#settlement-year-lmi)).
- **Effective preliminary sweep for the gap calculation**: `annualInterest` is 0 for every year in `zeroedFundedYears`, so the gap years' LMI is the interest of the TIPS that will be bought.
- **Final output** of the funded sweep for each funded year: `fundedYearQty = 0` for a zeroed year; for the partial-credit year `MAX(0, ROUND((DARA − laterMatInt − partialCredit − creditedInterest) / piPerBond))`; for every other year the same without `partialCredit`.
- The bracket `excessQty` is calculated as usual and added on top, whether or not the funded quantity of the year is zeroed, because duration matching applies to a bracket year with a funded quantity of 0.

**Summary fields:** `preLadderYears`, `preLadderPool`, `preLadderCouponPool`, `preLadderFuture30yPool`, `preLadderGapPool`, `preLadderNetCashPool`, `creditPool`, `zeroedFundedYears`, `partialCreditYear`, `partialCredit`, `pliCreditByGapYear`, `pliCreditByFundedYear`, `cashCreditByFundedYear`, `creditByFundedYear`.

<a id="gap-year-simulated-outstanding-tips"></a>
### Gap Year Simulated Outstanding TIPS (`build-lib.js` and `rebalance-lib.js`)

When the ladder has gap years, the interest of the Simulated Outstanding Future 10Y TIPS and of the Excess TIPS is income of the funded years before the first gap year. The definition, the issue dates, the rebalance at each issue date and the coupon counts are in [2.0 §Gap Year Simulated Outstanding TIPS](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#gap-year-simulated-outstanding-tips). The computation is the one of the next section with the gap years, the bracket pair, the January 15 maturity and the January issue date in place of the Future 30Y years, the cover pair, the February 15 maturity and the February issue date.

**Computed once before the Phase 4 sweep**, after the duration match has fixed the Synthetic TIPS quantities, the bracket durations and the Excess TIPS quantities at settlement. For each funded year before the first gap year it gives three amounts: the interest from the Simulated Outstanding Future 10Y TIPS, the interest from the Excess TIPS, and the Net Cash of the issue dates in that year. Each is worked out for the year directly, and none is accumulated in the running LMI.

**Functions.** `gapIssueDate` gives each issue date, through `lastBusinessDayOfMonth` in `shared/src/settlement.js`. `gapRebalances` runs the rebalance at each issue date and returns the Excess TIPS after each and the Net Cash. It takes the lower bracket TIPS, the upper bracket TIPS and, with Retained Bracket Excess, the retained lower bracket maturities, each with the Excess TIPS it holds. `gapInterestByYear` returns the Simulated Outstanding Future 10Y TIPS interest, the Excess TIPS interest and the Net Cash credited to each funded year. `gapRebalances` and `future30yRebalances` are the two parameter sets of one engine (`simulatedRebalances` and `simulatedInterestByYear` in `ladder-core.js`), as are `gapInterestByYear` and `future30yInterestByYear`. `impliedGapInterest` (`rebalance-lib.js`) implies the Simulated Outstanding Future 10Y TIPS from the held Excess TIPS when a file has no DARA block.

**Sales expected.** On each issue date each bracket goes to the quantity that the duration match gives (`bracketWeights`): the Excess TIPS above it is sold, which is expected, and a bracket short of it buys the difference. With Retained Bracket Excess the retained maturities are never bought. They are held at what they hold, sold earliest first only as far as the match requires, and the active lower bracket is never sold to make room for them (`bracketWeightsN`). In a Rebalance, `runRebalance` passes the retained maturities to `sizeLadder` as `gapRetained`, which sizes the Excess TIPS at settlement around them.

**Funded-year quantity.** The quantity of a funded year is its DARA less the running LMI less the three amounts of the gap years and, when the ladder has Future 30Y years, the three amounts of the Future 30Y years, divided by P+I per TIPS, rounded to a whole number of TIPS and not below 0. The amounts are the same for a year in Build, in the Rebalance After state and in the Rebalance Before state, except that Before uses the quantities held before the first issue date ([3.0 §Build ≡ Rebalance "Before" and "After"](../TipsLadderManager/knowledge/3.0_TIPS_Ladder_Rebalancing.md)).

**Pre-Ladder Interest integration.** With `preLadderInterest` on, the Pre-Ladder Interest for the years before the first funded year includes these three amounts for those years, as the Future 30Y amounts are included in the next section. The quantity of a gap year depends on the pre-ladder credit it receives, and the Pre-Ladder Interest and the zeroing need depend on the gap amounts, which depend on the quantities. `sizeLadder` resolves this once, without iterating: the Pre-Ladder Interest and the need are sized from the gap amounts of a sizing that gives the gap years no pre-ladder credit, and the sizing that the sweep and the Amounts read is made again with the credit each gap year then receives. A fully pre-ladder-funded year is reconciled against its DARA in `fundedYearAmount`, so the difference between the two sizings does not reach an Amount.

<a id="future-30y-simulated-outstanding-tips"></a>
### Future 30Y Simulated Outstanding TIPS (`build-lib.js` and `rebalance-lib.js`)

When the ladder has Future 30Y years, the interest of the Simulated Outstanding Future 30Y TIPS and of the Cover Excess is income of the funded years before the first Future 30Y year. The definition, the issue dates, the rebalance at each issue date and the coupon counts are in [2.0 §Future 30Y Simulated Outstanding TIPS](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#future-30y-simulated-outstanding-tips).

**Computed once before the Phase 4 sweep**, after the Future 30Y duration match has fixed the Synthetic TIPS quantities, the cover durations and the Cover Excess quantities at settlement. For each funded year before the first Future 30Y year it gives three amounts: the interest from the Simulated Outstanding Future 30Y TIPS, the interest from the Cover Excess, and the Net Cash of the issue dates in that year. Each is worked out for the year directly, because the coupon count differs from year to year, and neither is accumulated in the running LMI.

**Functions.** `selectFuture30yCovers` applies the cover rule. `future30yIssueDate` gives each issue date, through `lastBusinessDayOfMonth` in `shared/src/settlement.js`. `future30yRebalances` runs the rebalance at each issue date and returns the Cover Excess after each. `future30yInterestByYear` returns the simulated TIPS interest, the Cover Excess interest and the Net Cash credited to each funded year. `future30yLimit` derives the Maximum Future 30Y Rungs, and `maxLastYear` gives the ladder's last year at most. `syntheticYearAmounts` gives the Amount of each gap year and each Future 30Y year. `impliedFuture30yInterest` (`rebalance-lib.js`) implies the simulated TIPS from the held Cover Excess when a file has no DARA block.

**Funded-year quantity.** The quantity of a funded year is its DARA less the running LMI less these three amounts, divided by P+I per TIPS, rounded to a whole number of TIPS and not below 0. All three amounts are the same for a year in Build, in the Rebalance After state and in the Rebalance Before state, except that Before uses the quantities held before the first issue date ([3.0 §Build ≡ Rebalance "Before" and "After"](../TipsLadderManager/knowledge/3.0_TIPS_Ladder_Rebalancing.md)).

**Pre-Ladder Interest integration.** With `preLadderInterest` on, the Pre-Ladder Interest for the years before the first funded year is the coupon interest of the holdings plus these three amounts for those years. The Pre-Ladder Interest is stored as named parts, coupon interest, the interest of the simulated TIPS, the interest of the Cover Excess and the Net Cash, so the credit stays traceable in the Level-3 "Pre-Ladder Interest composition" drill (`buildPreLadderPoolDrill`). The need of a funded year for the zeroing condition is its DARA less its later-maturity interest and these three amounts, and not below 0.

---

## <a id="m6"></a>drill.js (M6)
**File**: `TipsLadderManager/src/drill.js`
**Purpose**: The builders of the content of every popup that shows how a figure was calculated: the drill popups of the ladder table, of the trade ticket and of the cash flow calendar.
**Exports**: `buildDrillHTML`, `buildDurationPopupRows`, `buildTradeTicketCostDrill`, `buildTradeTicketAccruedDrill`, `buildTradeTicketTotalDrill`, `buildCashFlowDateDrill`, `buildCashFlowEventDrill` and the rest of its exports; [4.5.2 §Popup Routing](../TipsLadderManager/knowledge/4.5.2_Show_Drill_Popups.md#popup-routing) states which routes to which.

**Called by**: [4.5.2 Show drill popups](../TipsLadderManager/knowledge/4.5.2_Show_Drill_Popups.md), [4.5.3 Show trade ticket](../TipsLadderManager/knowledge/4.5.3_Show_Trade_Ticket.md) and [4.5.4 Show cash flow calendar](../TipsLadderManager/knowledge/4.5.4_Show_Cash_Flow_Calendar.md).

---

## <a id="m7"></a>popup.js (M7)
**File**: `TipsLadderManager/src/popup.js`
**Purpose**: The popup that opens beside a clicked figure, with a title, a breadcrumb back to the popup it came from, and an optional toggle.
**Exports**: `showPopup(anchorEl, title, rowsOrBuilder, breadcrumb, initialToggleVal)`, `hidePopup()`.

**Called by**: [4.5.2 Show drill popups](../TipsLadderManager/knowledge/4.5.2_Show_Drill_Popups.md), [4.5.3 Show trade ticket](../TipsLadderManager/knowledge/4.5.3_Show_Trade_Ticket.md) and [4.5.4 Show cash flow calendar](../TipsLadderManager/knowledge/4.5.4_Show_Cash_Flow_Calendar.md).

---

## <a id="m8"></a>modal.js (M8)
**File**: `TipsLadderManager/src/modal.js`
**Purpose**: The frame that makes a modal draggable by its title and resizable from its edges and corners.
**Exports**: `makeDraggableResizable(modalEl, dragHandleEl, { minWidth, minHeight })`.

**Called by**: [4.5.2 Show drill popups](../TipsLadderManager/knowledge/4.5.2_Show_Drill_Popups.md) (the TIPS Ref and Mkt popup), [4.5.3 Show trade ticket](../TipsLadderManager/knowledge/4.5.3_Show_Trade_Ticket.md), [4.5.4 Show cash flow calendar](../TipsLadderManager/knowledge/4.5.4_Show_Cash_Flow_Calendar.md), the maturity picker ([2.0 §Picking Maturities for a Funded Year](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#picking-maturities)) and the priority-order picker ([4.4 §Priority-order picker](../TipsLadderManager/knowledge/4.4_Rebalance_Ladder.md#priority-order-picker)).

**Standard.** Every modal with substantial content (more than a couple of short lines) uses this frame: a fixed-position panel with `display:flex; flex-direction:column`, a title bar with `cursor:move`, and 8 `.resize-handle` divs (n, s, e, w, nw, ne, sw, se). It applies to TipsRef, the maturity picker, the priority-order picker, the Trade Ticket and the Cash Flow Calendar. `makeDraggableResizable(modalEl, titleEl, { minWidth, minHeight })` is called once per modal at startup. A small modal with fixed content (help, account selection) is exempt, because nothing in it benefits from resizing, and a plain centered overlay is simpler.

**Resizing.** Dragging an edge moves that edge and holds the opposite one, including once the size reaches `minWidth` or `minHeight`: the new `left` and `top` come from the size actually applied and not from the pointer delta, so a west or north drag stops and does not slide the modal across the screen. The first resize also drops the content-sizing clamps, because a modal that sizes to its content (`width:max-content` with a `max-width`, as the shared popup does) would otherwise ignore an outward drag.

**A resize may end outside the modal.** The click that follows a drag targets the nearest common ancestor of the press and the release, which is the document body once the pointer leaves the modal. An outside-click close must therefore test where the press started and not where it ended, or a resize closes the modal being resized ([popup.js (M7)](#m7)).

---

## <a id="m9"></a>gap-math.js (M9)
**File**: `TipsLadderManager/src/gap-math.js`
**Purpose**: Gap year analysis and bracket sizing: the yield, coupon, duration and quantity of the Synthetic TIPS of each gap year and Future 30Y year, and the weights and Excess TIPS quantities of the bracket pair and the cover pair. The formulas are defined in [2.0 §Gap Years](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#gap-years-section) and [2.0 §Duration Matching (Brackets)](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#duration-matching-brackets).
**Exports**: `interpolateYield`, `syntheticCoupon`, `gapParamsCore`, `future30yParamsCore`, `bracketWeights`, `bracketWeightsN`, `bracketExcessQtys`.

**Called by**: [Build the ladder (4.3.2)](../TipsLadderManager/knowledge/4.3_Build_Ladder.md#build-the-ladder), through `ladder-core.js` (M5), and [Rebalance the ladder (4.4.3)](../TipsLadderManager/knowledge/4.4_Rebalance_Ladder.md#rebalance-the-ladder), through `ladder-core.js` (M5) and directly (`calculateGapParameters`).

**Contracts**:

<a id="interpolateyield"></a>
### `interpolateYield(anchorBefore, anchorAfter, targetDate)`

Linear yield interpolation in maturity date between two anchor bonds.

```
yield = anchorBefore.yield +
        (targetDate - anchorBefore.maturity) × (anchorAfter.yield - anchorBefore.yield) /
        (anchorAfter.maturity - anchorBefore.maturity)
```

Returns `NaN` when an input is missing. **Spec reference:** [2.0 §Gap Parameter Calculation](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#gap-parameter-calculation).

<a id="syntheticcoupon"></a>
### `syntheticCoupon(yield)`

The eighth of a percent at or below the yield, and at least 0.125%. The coupon is counted in whole eighths:

```
syntheticCoupon = MAX(1, FLOOR(yield × 800 + 1e-9)) / 800
```

The tolerance `1e-9` is far below the precision of any quoted yield. Without it a yield that is an exact eighth loses one eighth to floating point (`0.03625 × 100 / 0.125` evaluates to `28.999999999999996`, so a plain `FLOOR` gave a coupon one eighth too low at 3.625% and at 7.25%). **Spec reference:** [2.0 §Synthetic TIPS for Gap Years](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#synthetic-tips-for-gap-years).

`SYNTHETIC_INDEX_RATIO` is 1, the Index Ratio of every Synthetic TIPS ([Synthetic TIPS](./DATA_DICTIONARY.md#synthetic-tips)).

<a id="gapparamscore"></a>
### `gapParamsCore({ gapYears, tipsMarketData, settlementDate, dara, daraByYear?, lmiAboveByYear?, pliCreditByGapYear? })`

The one gap-year sweep. For each gap year, longest to shortest: interpolate the yield, set the synthetic coupon, set the maturity (January 15), calculate the duration, size the quantity, and price the Synthetic TIPS. The sweep is [2.0 §Gap Parameter Calculation](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#gap-parameter-calculation).

**Inputs:** `lmiAboveByYear` is `{ [year]: annual coupon dollars from the funded years above the gap }`. Build derives it from its preliminary sweep (`calcGapParams`, `ladder-core.js`), and Rebalance from the holdings and the targets (`calculateGapParameters`, `rebalance-lib.js`). These adapters are the only difference between Build and Rebalance, and both call `gapParamsCore`, so equal inputs give equal output and the Build, export, import and rebalance round trip is exact.

- When Pre-Ladder Interest or Available Cash zeroes a funded year, the adapter passes `annualInterest = 0` for that year, because a zeroed year buys no TIPS and gives no coupon to the LMI of a gap year.
- `pliCreditByGapYear` is `{ [year]: credit }`, the gap-year credits of the [Credit Pass](#pre-ladder-interest-option). It is empty without a credit.

**Returns:**
```
{
  avgDuration,  // cost-weighted mean of the Synthetic TIPS durations: Σ(cost·dur)/Σ cost (simple mean if Σ cost = 0) → 2.0 Average Gap Year Duration is Cost-Weighted
  totalCost,    // Σ cost over the gap years: the Gap Total Cost
  breakdown,    // per year: { year, qty, qtyExact, piPerBond, laterMatInt, pliCredit, dara, dur, synYld, synCpn, synPrice, indexRatio, costPerBond, cost, annualInt, durDetail }
  anchors,      // { before, after }: the two anchor bonds that interpolateYield used, each { maturity, yield }
}
```

With no gap years it returns `{ avgDuration: 0, totalCost: 0, breakdown: [] }`.

- `synYld`, `synCpn` and `durDetail` are the interpolated yield, the synthetic coupon derived from it, and the full Macaulay workings of `calculateDurationDetail`. They are carried for the Level-3 duration drill (`gapdur-<year>`, [4.5.2 §Nested (Level-3) drills](../TipsLadderManager/knowledge/4.5.2_Show_Drill_Popups.md#nested-drills)).
- `qtyExact` is `(dara − laterMatInt − pliCredit) ÷ piPerBond` before `qty` rounds it and floors it at 0. `annualInt` is `qty × 1000 × synCpn`, the annual interest of the Synthetic TIPS that every shorter year's `laterMatInt` includes. Both are carried so that the year rows of the Gap Dur popup ([4.5.2 §Quantity, cost and duration in one section](../TipsLadderManager/knowledge/4.5.2_Show_Drill_Popups.md#quantity-cost-duration)) show the figures the sweep used.
- `synPrice` is `priceFromYield(synYld, synCpn, settlementDate, maturity)`, or 100 when that is not defined. `indexRatio` is `SYNTHETIC_INDEX_RATIO`, and `costPerBond = 1000 × synPrice × indexRatio / 100`.

<a id="future30yparamscore"></a>
### `future30yParamsCore({ future30yYears, anchorBond, settlementDate, dara, daraByYear? })`

Pass 1 for the Future 30Y years ([2.0 §Future 30Y Rungs](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#future-30y-rungs)). Every year is priced from one bond, `anchorBond`, the longest-dated issued TIPS, and not interpolated between two: `synYld` is `anchorBond.yield` for every year, and `synCpn` is `syntheticCoupon` of that yield. The maturity is February 15, and the quantity is `MAX(0, ROUND((dara − runningLMI) / piPerBond))`.

**Returns:** `{ avgDuration, future30yTotalCost, breakdown, future30ySeedLMI, anchorBond }`. Each `breakdown` entry carries the fields of `gapParamsCore`'s `breakdown` for the Future 30Y Dur popup (`f30dur-<year>`), with `laterMatInt` the running synthetic interest. With no years or no anchor it returns zeros and an empty `breakdown`.

<a id="bracketweights"></a>
### `bracketWeights(lowerDuration, upperDuration, avgGapDuration)`

```
rawLowerWeight = (upperDuration − avgGapDuration) / (upperDuration − lowerDuration)
lowerWeight = CLAMP(rawLowerWeight, 0, 1)
upperWeight = 1 − lowerWeight
```

The weights are shares of the total cost covered, so neither is below 0 or above 1. When `avgGapDuration` is outside `[lowerDuration, upperDuration]` (for example a deep-discount cover with a near-zero coupon has a longer duration than the average), the whole weight is held at the nearer cover and the duration match is not reached. When the two durations differ by less than 0.0001 the weights are 0.5 and 0.5.

**Returns:** `{ lowerWeight, upperWeight }`. **Spec reference:** [2.0 §2-Bracket Weights](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#2-bracket-weights).

<a id="bracketweightsn"></a>
### `bracketWeightsN({ retained, dActive, dUpper, dGap, totalBlockCost, activeFloorWeight })`

The weights with [Retained Bracket Excess](./DATA_DICTIONARY.md#retained-bracket-excess). `retained` is an array of `{ duration, excessCost }`, oldest to newest. The retained maturities are fixed inputs and only the active lower bracket and the upper bracket are solved. `totalBlockCost` is the Gap Total Cost, and `activeFloorWeight` (default 0) is the share of it that the active lower bracket holds now. The formulas, the floor and the sale of the earliest retained maturity are in [2.0 §Retained Bracket Excess](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#retained-bracket-excess).

**Returns:** `{ retainedWeights, activeWeight, upperWeight, feasible, reason, sold }`.

- `sold` is true when a retained weight was lowered.
- `feasible` is false when the inputs leave no solution that the holdings can reach: coincident durations, `dGap` outside the span, or an `activeFloorWeight` too high for even a fully sold retained side.
- `reason` names which one: `coincidentDurations`, `upperWeightNegative` or `activeBelowFloor`, and is `null` when feasible. Coincident durations report through `reason` even when the weights are inside their bounds, because the even split does not reproduce `dGap`.

Rebalance calls it for the Multi-bracket mode ([3.0 §Retained Maturities](../TipsLadderManager/knowledge/3.0_TIPS_Ladder_Rebalancing.md#retained-maturities-holdings-based)), and `simulatedRebalances` (`ladder-core.js`) calls it on each issue date with retained maturities. It supports any number of retained maturities.

<a id="bracketexcessqtys"></a>
### `bracketExcessQtys(totalCost, lowerWeight, upperWeight, lowerCostPerBond, upperCostPerBond)`

```
lowerExQty = ROUND(totalCost × lowerWeight / lowerCostPerBond)
upperExQty = ROUND(totalCost × upperWeight / upperCostPerBond)
```

A quantity is 0 where its cost per bond is not above 0. **Returns:** `{ lowerExQty, upperExQty }`. **Spec reference:** [2.0 §Excess Quantities](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#excess-quantities).

<a id="gap-sizing"></a>
### Gap sizing

The build adapter (`calcGapParams`, `ladder-core.js`) and the rebalance adapter (`calculateGapParameters`) both call `gapParamsCore`. The interest of the upper bracket Excess TIPS is not credited into gap sizing, because the last conversion sells the Excess TIPS before the first gap year ([2.0 §Gap Year Simulated Outstanding TIPS](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#gap-year-simulated-outstanding-tips)).


---

## <a id="m10"></a>shape-math.js (M10)
**File**: `TipsLadderManager/src/shape-math.js`
**Purpose**: The shape of a ladder and the maturity years that stand off it. It replaces the comparison of the raw ARA of a maturity year with one flat median, which charged every hump of the ladder to excess. The formulas are defined in [3.0 §Per-Year DARA from Portfolio](../TipsLadderManager/knowledge/3.0_TIPS_Ladder_Rebalancing.md#per-year-dara-from-portfolio) and [§Before-State Preview and Bracket-Year Excess Detection](../TipsLadderManager/knowledge/3.0_TIPS_Ladder_Rebalancing.md#before-state-preview-and-bracket-year-excess-detection).
**Exports**: `smoothCurve`, `findSpikes`, `evenSpread`, `MIN_SHAPE_POINTS`, `inferShapeValue`.

**Contracts**:

### `smoothCurve(values, { width = 5 })`

A repeated running median of `width` (Tukey's repeated-median smoother, iterated until it stops changing), then one Hann pass. A running median is not pulled toward a spike, so the curve passes under the spike. The window cannot reach the first and last `(width−1)/2` points, so each end extrapolates the local slope outward: the median of the raw value and the linear extrapolation of the two nearest fitted points. A spike at the very end cannot become part of the curve. Below `width` points (default 5) it returns the input unchanged.

**Returns:** the fitted curve, of the length of `values`.

### `findSpikes(values, { width = 5, k = 4 })`

Every index that stands more than `k` robust scales (`1.4826 × median(|residual|)`, the median-absolute-deviation counterpart of a standard deviation) above `smoothCurve(values, { width })`. The spikes are found one at a time, strongest first, and each is flattened onto the curve before the next fit, because two adjacent spikes lift the curve between them enough to hide the smaller one.

**Returns:** `[{ index, value, curve, excess, z }]` in index order. `excess = value − curve` is the part of the year that stands above the shape of the ladder.

### `evenSpread(arr, spanCount)` / `MIN_SHAPE_POINTS`

`evenSpread` is the total of the values divided by `spanCount`, the number of rungs the inference assumes (and not the number of points), or `null` for an empty array or a span of 0. A held bracket year carries income that duration-matches coverage across the gap beside it, so two holdings around a 3-year gap (2036 and 2040 around 2037 to 2039) are five rungs of income, and dividing their total by 2 would let one bracket year borrow the number of the other.

`MIN_SHAPE_POINTS` is 5, the point count below which `smoothCurve` returns its input (its window covers the whole series), so that there is no shape to fit. Callers use `evenSpread` in that case.

### `inferShapeValue(years, values, targetYear, { width = 5 })`

The value implied for a year with no point in the series (a structural gap year, or a Future 30Y year after the last issued TIPS). It extends the local slope of `smoothCurve(values)` from the neighboring held year nearer to `targetYear`, and does not blend both sides, so a step in the shape of the ladder (for example the DARA falling once Social Security starts) is read as a step. A side gives a slope only with at least two held points on it. When neither side does it returns `null`, and the caller uses `evenSpread`.

**Called by**:
- [4.4.2 Preview before-state](../TipsLadderManager/knowledge/4.4_Rebalance_Ladder.md#preview-before-state), `before-state-lib.js#detectBracketFlags`: `findSpikes` decides which bracket years and cover years are flagged as excess, and below `MIN_SHAPE_POINTS` held years a year is flagged when its raw ARA exceeds the `evenSpread` of the held years.
- [4.4.1 Derive per-year DARA from holdings or DARA plan](../TipsLadderManager/knowledge/4.4_Rebalance_Ladder.md#derive-per-year-dara-from-holdings-or-dara-plan), `rebalance-lib.js#hasGapCoverageIntent` and `#derivePerYearDara`: `findSpikes` flags the bracket-candidate years and the signal at 2040, and `inferShapeValue` fills the gap-year DARA, in the recovery for a derived Per-Year DARA ([3.0 §Funding the rebalance](../TipsLadderManager/knowledge/3.0_TIPS_Ladder_Rebalancing.md#funding-the-rebalance)). Its low-data fallback flags a bracket-candidate year when its ARA exceeds 1.5 times the `evenSpread`.
- [4.4.1](../TipsLadderManager/knowledge/4.4_Rebalance_Ladder.md#derive-per-year-dara-from-holdings-or-dara-plan), the file-load derivation in `index.html` ([3.0 §Per-Year DARA from Portfolio](../TipsLadderManager/knowledge/3.0_TIPS_Ladder_Rebalancing.md#per-year-dara-from-portfolio)) calls `inferShapeValue` and `evenSpread` for the gap-year and Future 30Y year fill, with `detectBracketFlags` for the candidate years.

---

## <a id="m11"></a>chart-keys.js (M11)
**File**: `shared/src/chart-keys.js`
**Purpose**: The one implementation of the keyboard and modifier-key navigation of a Chart.js chart, of the step that the Y-axis bounds round to, and of the Lock Right window. The plain mouse wheel, the pinch and the drag are those of the Chart.js zoom plugin, which each app configures.
**Exports**:
- `handleChartKeydown(e, chart, options)` — the arrow keys pan the chart by `panStep` (default 10%) of its visible span, and `+` (or `=`) and `-` (or `_`) zoom both axes by `zoomStep` (default 10%) about the middle of the visible span. With `lockRight` and `xMaxAnchor` set, a zoom holds the right edge at `xMaxAnchor`. It calls `onAction({ chart })` after a key it handled.
- `setupAxisWheelZoom(canvas, onXZoom, onYZoom)` — Ctrl with the wheel zooms the X-axis only and Shift with the wheel zooms the Y-axis only, by a factor of 1.1 for a turn forward and 0.9 for a turn back. A wheel turn with neither key is left to the zoom plugin.
- `snapYBounds(min, max)` — rounds `min` down and `max` up to a step set by the range:

  | Range | Step |
  |---|---|
  | under 0.05 | 0.005 |
  | 0.05 to under 0.1 | 0.01 |
  | 0.1 to under 0.3 | 0.05 |
  | 0.3 to under 1 | 0.10 |
  | 1 to under 4 | 0.25 |
  | 4 to under 8 | 0.50 |
  | 8 or more | 1.00 |

- `snapYAfterZoom(chart, factor)` — after a wheel zoom, rounds the bounds in when `factor` is above 1 (the range shrinks) and out otherwise, and sets the tick step. When rounding in leaves no range, it uses the bounds of `snapYBounds`.
- `lockedRightMin(xMin, xMax, xMaxAnchor, axis, scale)` and `applyLockRight(chart, xMaxAnchor, axis)` — set the right edge of the window to `xMaxAnchor` and the left edge so that the window keeps its width. `axis` (`{ toPos, fromPos }`) is for an axis whose drawn width is not its time span, such as the trading-hours axis, and the width is then kept as drawn.

**Called by**: [Render time series (2.5)](../YieldsMonitor/knowledge/2.5_Render_Time_Series.md#pan-and-zoom) (YieldsMonitor, every export, and `snapYBounds` for the yield curve and breakeven charts), [Build axis scales (3.7.2)](../YieldCurves/knowledge/3.7_Render_Charts_And_Tables.md#build-scales) (YieldCurves, all but `lockedRightMin` and `applyLockRight`) and [Render CPI chart (7.3)](../CpiExplorer/knowledge/7.3_Render_CPI_Chart.md) (CpiExplorer, `handleChartKeydown` and `snapYBounds`).

---

## <a id="m12"></a>chart-time-axis.js (M12)
**File**: `shared/src/chart-time-axis.js`
**Purpose**: The one implementation of the time-axis ticks of a Chart.js chart: calendar-aligned ticks for a span of months or years, and the time unit that follows the visible span.
**Exports**:
- `calendarTimeAxis({ color, font, gridColor })` — returns the tick, label and gridline options of a time axis, with Chart.js autoskip off:
  - A visible span under 2 months: a tick every 7 days when the span is over 20 days, every 3 days when it is over 7 days and every day otherwise, counted from the 1st of the month of the axis minimum.
  - A longer span: the tick interval is the largest of 1, 2, 3, 6, 12, 24, 60 and 120 months that gives at least 6 ticks across the span, and 1 month when none does:

    | Visible span | Interval |
    |---|---|
    | 2 to under 12 months | 1 month |
    | 12 to under 18 months | 2 months |
    | 18 to under 36 months | 3 months |
    | 3 to under 6 years | 6 months |
    | 6 to under 12 years | 1 year |
    | 12 to under 30 years | 2 years |
    | 30 to under 60 years | 5 years |
    | 60 years or more | 10 years |

  - A tick falls on the 1st of a month, anchored to January, so the same months fall at the same positions every year at every zoom level. An interval of a year or more falls on January 1st of each year that is a multiple of the interval in years.
  - A tick before the axis minimum is not drawn. When the axis starts after January 1st, that year has no tick and the first tick is the next aligned year (2028 and not 2026 for a two-year interval on an axis that starts in October 2026).
  - A label follows the average spacing of the ticks: the year alone at 300 days or more, `MMM YYYY` from 25 to 299 days and `MMM D` under 25 days. A single tick is labeled `MMM YYYY`.
- `getXTimeUnit(spanMs)` and `applyXTimeUnit(chart, toPos)` — set the Chart.js time unit from the visible span: minute under 6 hours, hour under 3 days, day under 90 days, month up to 548 days and year beyond. `toPos` maps a time to its drawn position for a trading-hours axis, so the span is the drawn width. [Render time series (2.5)](../YieldsMonitor/knowledge/2.5_Render_Time_Series.md#x-axis-tick-density-and-labels) states the labels of each unit.

**Called by**: [Build axis scales (3.7.2)](../YieldCurves/knowledge/3.7_Render_Charts_And_Tables.md#build-scales) (YieldCurves, `calendarTimeAxis`), [Render CPI chart (7.3)](../CpiExplorer/knowledge/7.3_Render_CPI_Chart.md) (CpiExplorer, `calendarTimeAxis`) and [Render time series (2.5)](../YieldsMonitor/knowledge/2.5_Render_Time_Series.md#x-axis-tick-density-and-labels) (YieldsMonitor, `applyXTimeUnit`).
