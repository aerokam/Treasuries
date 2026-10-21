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
**Purpose**: The single authoritative implementation of "size the target ladder from a DARA." Unlike M1-M4, this module's algorithm is too large for a registry entry — it is specified in full at [2.0 TIPS Ladders](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md) (§Algorithm and the duration-matching/PLI/Future 30Y sections it covers), not here. This entry only names the exports and their callers.
**Exports**: `selectLadderBonds`, `sizeLadder`, `sizeFuture30yCover`, `fundedYearAmount`, `future30yRebalances`, `gapRebalances`, `maxLastYear` and the rest of its exports — see 2.0 for what each does.

**Called by**: [Build the ladder (4.3.2)](../TipsLadderManager/knowledge/4.3_Build_Ladder.md#build-the-ladder) and [Rebalance the ladder (4.4.3)](../TipsLadderManager/knowledge/4.4_Rebalance_Ladder.md#rebalance-the-ladder).
