# Terminology Worklist

The open questions of the portal-wide terminology work. The policy is in `CLAUDE.md` §Help Text Follows the Specs, and the terms are in [DATA_DICTIONARY.md](./DATA_DICTIONARY.md).

## Enforcement

`.githooks/pre-commit` runs `scripts/check-vocabulary.js`. It blocks a commit that introduces a banned term into prose a reader meets: the `knowledge/` specs, `Primer/content/`, and sentence-like string literals in each app's `index.html` and `src/`. Only lines a commit adds or changes are gated, so existing wording never blocks unrelated work.

- `node scripts/check-vocabulary.js --audit` lists every finding in the repo. On 2026-10-18 it lists one: `fade` in `SeasonalAdjustments/src/sa-pages-gap.js`, a module that `index.html` no longer imports.
- The rules are the `RULES` array of that file. A term the developer rules out is added there in the same pass as the correction.
- `Treasury's` is not a rule: the institution takes a possessive and only the security type does not, and no cheap pattern separates them.
- The "Expand/Collapse Bracket/Cover Years" button label is exempt from the `bracket-cover` rule, because the slash there names two kinds of row rather than one compound term.

## Open

### 1. "Held year"

`heldYearMedianExcluding` (`before-state-lib.js`) takes its median over a population that `computePortfolioARAByYear` (`rebalance-lib.js`) builds from holdings alone, keyed by maturity year, without reading DARA. Three questions follow, in dependency order. The first decides the others.

1. **Should an excess-only bracket year contribute an LMI-only value to the median at all?** In the no-range form, a year's value is its funded P+I plus its LMI. An excess-only year has a funded P+I of 0, so it contributes its LMI alone, which is positive whenever anything is held above it. That value is small next to a funded rung and lowers the median, and the years it affects are the ones bracket detection exists to find. The comment on `heldYearMedianExcluding` states the opposite: that empty LMI-only years never appear in the population. Empty years never appear, and excess-only years do.

   The effect depends on the file format. A `cusip,qty` file (a broker export, or `data/SampleHoldings.csv`, the file the app preloads) sets no `excessQty`, so the funded quantity is the whole quantity and no LMI-only value arises. A Holdings Export with the `fundedYear` column does set it, which is the export-then-import round trip that [3.0 §Per-Year DARA from Portfolio](../TipsLadderManager/knowledge/3.0_TIPS_Ladder_Rebalancing.md) is built around.

2. **Should the population be bounded by the First Year and the Last Year?** Nothing bounds it today, so a holding that matures outside the ladder affects the median: the default form of `computePortfolioARAByYear` emits every year that holds a TIPS.

3. **Then the term.** Neither [Funded Year](./DATA_DICTIONARY.md#funded-year) nor [Maturity Year](./DATA_DICTIONARY.md#maturity-year) covers the maturity years in which the portfolio holds TIPS: a bracket year with a DARA of 0 is in the population and is not a funded year, and Maturity Year is every year in which outstanding TIPS mature, not the years the portfolio holds. Either the DD gains a term or 3.0 describes the population instead of naming it.

3.0 §Before-State Preview says "the held funded years" (6 occurrences in the file) and the comment on `heldYearMedianExcluding` quotes it. The identifiers (`heldYearMedianExcluding`, `heldARAByYear`, the `heldYears` locals) stay as they are until question 1 is decided, because a rename first would fix the wrong population into the names.

Whether `heldYearMedianExcluding` should apply to gap years at all is raised in commit `95f2008`.

### 2. Help text still to be read

Only the help of TipsLadderManager has been read section by section: the Gap Dur popup, the Bracket Mode help, the Future 30Y Dur popup, the Amount drill, the Cost drill and the walkthrough in 2.0. Still to read: the Quantity drill, the Ref CPI drill, the Trade Ticket, the Cash Flow Calendar, the status strip and the top-card controls.

The 2026-10 sweep rewrote the specs of every app against its code and left the help strings of `index.html` to the vocabulary hook, which knows only the words already rejected.

### 3. Smaller items

- `stub` was removed from `YieldCurves/knowledge/Canty.md` because the paper does not use it. Whether the word belongs in a seasonal-adjustment primer is undecided.
- The `baseCpi` column header stays in `shared/src/market-data.js` and `Primer/src/primer-data.js`, which prefer `datedDateRefCpi` and read `baseCpi` as a fallback for R2 files written before the rename. Retiring it is a data-migration question.

## Distinctions that have caused errors

- **Nominal and real, and adjusted and unadjusted, are different axes.** Nominal is the opposite of real (TIPS), and adjusted is the opposite of unadjusted (inflation). "Price (unadjusted)" in the Cost drill is correct and must not become "nominal". Canty's clean and dirty price map to the second pair.
- **Verify what the code computes before renaming anything around it.** In the "held year" question, "held year" is not a synonym for funded year, and the `v > 0` guard does not filter out an excess-only year. Each wrong reading would have put a false statement into 3.0.
- **A schema line can contradict its prose.** [GSW curve parameters (S12)](./DATA_DICTIONARY.md#s12) is written `@date + beta0 + …`, with no braces, because the file holds a single record and `{ x }` means iteration in DD §0.0. The vocabulary gate cannot catch this class of error.
- **A store entry in the DD documents the file in its exact header names.** The entry carries the header row, including a header such as `Coupon` that differs from the normalized `Coupon_Rate` of the DD. [Market quotes (S7)](./DATA_DICTIONARY.md#s7) sets that precedent.
