# DFD and Spec Worklist

State of the levelled data flow diagrams and the spec rewrite that goes with them. Companion to [Terminology_Worklist.md](./Terminology_Worklist.md); the two were merged into one session on 2026-09-07, so terminology decisions are recorded there and structural ones here.

---

## 1.0 What exists

**The diagrams are generated.** `scripts/build-dfd.cjs` holds one model and emits every level below the context diagram, so a diagram cannot drift from what it describes. Run `node scripts/build-dfd.cjs` after any model change and commit the regenerated HTML with it.

| Level | File | Generated |
|---|---|---|
| 0, context | `knowledge/KNOWLEDGE_MAP.html` | no, hand-written |
| 1 | `knowledge/DFD_LEVEL1.html` | yes |
| 2, process 1 | `knowledge/DFD_LEVEL2_INGESTION.html` | yes |
| 2, Yield Curves | `knowledge/DFD_LEVEL2_YIELDCURVES.html` | yes |
| 3, 7.1 load and parse | `knowledge/DFD_LEVEL3_YC_LOAD.html` | yes |
| 3, 7.7 rendering | `knowledge/DFD_LEVEL3_YC_RENDER.html` | yes |

**Two other generators.** `scripts/build-dd-index.cjs` regenerates the A-Z index at the top of the Data Dictionary, covering every anchor so a synonym leads to its term; run it after adding an entry. `scripts/check-spec-code.cjs` reports specs naming code that no longer exists.

**Specs written to the current template**, all in `YieldCurves/knowledge/`: `3.1_Parse_Sources_And_Calculate_Yields.md`, `3.7_Render_Charts_And_Tables.md`, `3.5_Calculate_Breakeven_Inflation.md` and `3.6_Calculate_Bid_And_Ask_Spreads.md`.

---

## 2.0 Rules the developer set

These came out of review and apply to every spec from here.

- **Lead with what the process does.** Not with what a file is or is not. Name a store by its identifier, S1, never "the file".
- **No metaphors and no anthropomorphism.** A process has an input and an output; it does not know, need, want or label. "Keyed on month/day" was rejected as a metaphor.
- **Link rather than restate.** If another spec owns a rule, point at it.
- **Every term in a spec, a diagram label or a domain identifier is defined in the Data Dictionary.** Loop counters and buffers are exempt; a name carrying a domain quantity is not. The identifier for [Index Ratio](./DATA_DICTIONARY.md#index-ratio) was renamed `indexRatio` for this reason.
- **A synonym belongs on the term**, not in the store entry that happens to use it.
- **Every lowest-level process links to a spec, and the spec should name the code it drives** — with a check that the naming still resolves, or it rots silently.
- **Below Level 1, a process is named by a verb phrase stating what it does, with no article.** A process consumes one or more structures and produces another, which may be the same data restructured or data with calculated values added. The name states that transformation. A spec that specifies a process takes the process name as its title and its file name. **At Level 1 an app is named as the portal names it.**
- **A process spec opens with the whole transformation**: every structure read, every structure produced, and every rule that keeps, drops or changes a row on the way. An opening that names only the first step is incomplete.
- **A data store is titled in its entry as the diagrams name it, with its identifier in parentheses**: Market quotes (S7). The file name and the R2 key are part of the entry, not its title.
- **A data flow is named by one noun for the structure it holds**, defined in the Data Dictionary, in [§6.0](./DATA_DICTIONARY.md#6.0-data-flows) when it is a composition of other terms. Two structures passing between the same two processes are two flows. `scripts/build-dfd.cjs` fails on a label that lists more than one term and reports a label with no entry.
- **An agent spawned for this work reports; the session that spawned it decides.** A found defect is fixed, not returned to the developer as a question.

---

## 3.0 Open, for the next session

1. **Calculate the index ratio.** 3.1.7 takes the [Index Ratio](./DATA_DICTIONARY.md#index-ratio) the market quote states. The developer wants it calculated, for both sources, equal to the quoted figure, which the broker states to 9 decimal places without Treasury’s rounding convention. §3.12 records the investigation into which calculation reproduces it.
2. **Separate the SA yield from the TIPS yield in code.** `shared/src/tips-yields.js#tipsYieldsFromPrices` performs the work of both 3.1.7 and 3.2, so both specs name the same function and the separation exists only in the spec text. A function for each process makes the drill from each spec reach code that does that process’s work and nothing more.
3. **Check every process spec’s opening against the code**, per §2.0: 3.2 to 3.7 and the sub-processes of 3.7. 3.1.1 and 3.1.2 are corrected; 3.1.2 had described only the separation of Treasury rows from TIPS rows.
4. **Two stores drawn on the diagrams have no entry in DataStores**, so a click on either opens the top of that page: the bond holidays and the monthly CPI (§5.0).

---

## 3.5 Yield Curves is the template, and it is done

Every process has a spec, every process spec names the functions that implement it, every diagram carries a link to its parent spec, and the naming is one scheme: a numbered spec is a process spec and its number is the process, an unnumbered one is a reference. The other nine apps and the fifteen acquisition jobs have none of this yet, and Yield Curves is what they are copied from.

| Spec | Process |
|---|---|
| `3.1_Parse_Sources_And_Calculate_Yields.md` | 3.1 and its seven children |
| `3.2_Adjust_For_Seasonality.md` | 3.2 |
| `3.3_Adjust_For_Other_Effects.md` | 3.3 |
| `3.4_Fit_Spot_Yield_Curves.md` | 3.4 |
| `3.5_Calculate_Breakeven_Inflation.md` | 3.5 |
| `3.6_Calculate_Bid_And_Ask_Spreads.md` | 3.6 |
| `3.7_Render_Charts_And_Tables.md` | 3.7 and its seven children |
| `Visual_Standards.md`, `Canty.md`, `SA_Intuition.md`, `SAO_Residual_Analysis.md`, `Seasonal_Factor_Drift.md`, both `FedInvest_*` | none: reference |

Spec headers carry typed relations in reciprocal pairs: Specifies and Implemented by, Constrains and Constrained by, Source for and Derived from, Evidence for and Evidence, Explains and Explained in. A reference spec is reachable through them and is never the end of a drill.

**A fourth checker exists**: `scripts/check-links.cjs` fails when a relative markdown link does not resolve. `check-spec-code.cjs` now also resolves a reference written as file and symbol together, such as `YieldCurves/src/app.js#parseFedInvestPrices`, against both halves, and reads `// spec: <file>#<anchor>` tags in source back to the anchor they claim.

---

## 3.6 Market-quote nominal yields are calculated

Done in the app. All four combinations of source and security type now have their yield calculated from price: `YieldCurves/src/app.js#parseFidelityNominals` prices both sides of each market-quote nominal Treasury at the settlement date of [3.1.6](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#determine-settlement-date), and the quoted ask yield is read as a presence test only. Measured against the quoted ask yield over the 650 nominal securities in the 2026-09-11 quote file: median 0.06 bp, p90 0.30, p99 3.31, max 20.47. Four securities differ by more than 5 bp, three of them within three days of maturity and the fourth a Note 167 days from maturity.

The earlier attempt that rendered zero rows and took the run from 25 seconds to 4.8 minutes was a null settlement date, not a loop. The inline market-quote fixtures carried no `Date downloaded` footer, so `marketSettleIso()` returned null and `yieldFromPrice` raised a `TypeError` in `daysBetween` instead of returning null; the catch in `processAndRenderNominals` swallowed it before the table was rendered, and the minutes were the resulting Playwright timeouts. `yieldFromPrice` now returns null for a missing or unparsable date, and the fixtures carry the footer the real store has.

Closed in `12ff019`. One market-quote nominal parser now lives in `shared/src/fidelity-parse.js` and serves both the page and the acquisition job, beside the TIPS row parser they already shared, so the published stores and the page state one set of figures. The stores were republished on 2026-09-13 (§3.8).

---

## 3.7 The SA factors in the published store are the canonical ones

Closed in `72097c2`. `YieldCurves/scripts/updateSaSaoYields.js` computed the two SA factors with its own same-month/day lookup rather than calling `shared/src/ref-cpi.js#saFactorForDate` and `#maturitySaFactor`, so the [S10](./DataStores.md#s10) it publishes omitted the [Credibility Factor](./DATA_DICTIONARY.md#credibility-factor) that the app applies to a maturity beyond the SA-factor series. TipsLadderManager reads `sa_yield` from that store for its within-year allocation policy, so the two apps stated different SA Yields for the same security: 1.056% against 1.102% for the April 2027 TIPS. The script now imports both functions, and the store was republished.

The two lookups agreed on which row to take, because `RefCpiNsaSa.csv` is sorted newest first and the series never runs more than about twelve months behind a settlement date. That agreement was a property of the data, not of the code, which is the argument for the import rather than against it.

`f46b804` recomputed `SeasonalAdjustments/data/YieldsSaSao.snapshot.csv`, which is pinned to a 2026-08-31 quote and had the same omission recorded in it. Its provenance and its `ask_yield` column are unchanged.

The earlier `f57ef4a` retired this script’s duplicate SAO algorithm. Measured against the published file at the time, SA moved on none of 53 securities and SAO on 21, by up to 56 basis points, concentrated at the short end. Both corrections are now published.

**Standing defect:** three duplicates of shared logic have now been found in `YieldCurves/scripts/`, each noticed only when its output visibly disagreed with the app — the SAO algorithm (`f57ef4a`), these SA factors (`72097c2`), and the market-quote parser in `updateSpotYieldCurves.js` (§3.6, still open). Finding them one at a time by their symptoms leaves the ones whose output nobody has compared. Proposed to the developer: sweep every script in that folder for logic that already exists in `shared/src/` and close the set.

---

## 3.8 The duplication sweep, and what it found

Three duplicates of shared logic had been found one at a time, each noticed only when its output visibly disagreed with the page: the SAO algorithm (`f57ef4a`), the SA factors (`72097c2`, §3.7) and the market-quote parser (`12ff019`, §3.6). The developer directed a sweep of every app and acquisition job against everything `shared/src/` exports, on the grounds that finding them by symptom leaves the ones nobody has compared. Commits `12ff019`, `013d615`, `8bebdcb`, `27324bf`, `a0ef1a5`, about 180 lines net removed.

**The sweep found a live defect that no symptom had surfaced.** `updateSaSaoYields.js` held its own bond-closure parse. The closure file states each date as a quoted string containing commas, `"Monday, January 19, 2026"`; the copy split each line on commas and kept the first piece, so every date parsed as the word Monday and failed. Its closure set held none of the 22 dates, and settlement skipped weekends only. On 11 of the 250 trading days in 2026 that settles a day early. Across the 53 quoted TIPS: ask yield median 0.04 bp and up to 4.00, SA yield median 0.08 bp and up to 4.37. `TIPS/YieldsSaSao.csv` is read by TipsLadderManager and FundHoldings, so both received it. The run on the day of the fix was byte-identical, because that day’s settlement date was not a closure date.

**STRIPS are calculated, and the documentation was what was wrong.** `shared/src/bond-math.js#yieldFromPrice` builds no coupon cash flows at a coupon of zero, so a STRIP receives the semi-annual bond-equivalent yield of its price, and one maturing inside half a year receives Treasury’s bill investment-rate formula. Measured across 247 STRIPS, the calculated figure differs from the reported one by a median 0.05 bp, p90 0.09, max 3.31. The [S13](./DataStores.md#s13) note stating that no formula is applied described the acquisition job before `11cda8d` and never described the page; corrected in `12ff019`.

**A second implementation was producing constants nothing checked.** The drift analysis script held its own copy of the curve fit, and that script is where the Credibility Factor constants in `shared/src/ref-cpi.js` come from. Its output after the change is byte-identical to what the copy produced, which confirms the published constants rather than assuming them.

**Republished 2026-09-13** from the corrected code: [S13](./DataStores.md#s13), [S14](./DataStores.md#s14), [S15](./DataStores.md#s15) and [S10](./DataStores.md#s10). Against the 2026-09-11 quote file the ask yield on 650 market nominal securities moved a median 0.06 bp, p90 0.30, max 20.47; the bid-ask yield spread on 403 Treasuries up to 53.72 bp; breakeven inflation on 53 TIPS up to 1.25 bp. Every TIPS figure, every FedInvest row and the nearest-nominal match were unchanged to seven decimal places, and the fitted grid moved at most 0.01 bp.

The three items the developer approved out of this sweep are closed in §3.9.

**Still open:** `shared/src/fidelity-parse.js` now owns both row parsers for [S7](./DataStores.md#s7) and both yield calculations on the nominal side, and has no spec. It is the first shared module to need one, and the form it takes sets the pattern for the other nine.

---

## 3.9 The last duplicates, and one term

Closed in `d0619ef`. The TIPS yields moved to `shared/src/tips-yields.js#tipsYieldsFromPrices` and the nearest-maturity nominal to `shared/src/breakeven.js#findClosestNominal`, each imported by the page and by `updateSpotYieldCurves.js` in place of a separate copy.

**The market TIPS settlement date.** The two copies of the security set differed on one thing, the [Known Defect](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md) 3.1 had recorded: the page derived the settlement date of a market-quote TIPS from [S1](./DataStores.md#s1)'s date, against the quote file's own date in [3.1.6](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#determine-settlement-date), which the acquisition job already followed. The page follows it now and the note is gone. Both files carried 2026-09-11, so nothing moves in today's figures; the measurement was made by holding the quoted prices and moving the settlement date. One business day of divergence moves the SA yield of all 53 quoted TIPS by a median 0.08 bp, p90 0.52, p99 and max 4.37, the largest at the shortest maturity; three business days, a median 0.25 bp and a max of 14.06. Breakeven inflation is a nominal yield less that TIPS yield, so it moves one for one.

**One term.** Three conventions had been in use: 365.25 always in the acquisition job, actual/actual below one year in `shared/src/bond-math.js#termYears`, and the clock at run time in `shared/src/spot-curve.js#spotCurveFit`. `termYears` is now the one measure, defined at [Term](./DATA_DICTIONARY.md#term). Below a year its denominator is the actual length of the year beginning at settlement, 365 or 366, which is the measure Treasury's own bill formula uses and the one that matters where the relative error is largest; from a year the denominator is 365.25, so a multi-year term does not move with the placement of a single leap day. Cash-flow horizons inside the pricing formula are counted in coupon periods, a different quantity from a term label, and are unchanged.

**The run-time clock was the defect.** `spotCurveFit` measured each bond's term from the hour the fit ran rather than from the settlement date the prices are stated at, so the published grid's term labels shifted by about a day between runs over identical data. Against the 2026-09-11 files, the fitted curve read at the same term moves at most 0.021 bp and the SAO yield at most 0.025 bp; the grid's own terms move up to 2.58 days on the FedInvest curves and 0.46 days on the Market curves. In [S13](./DataStores.md#s13), 106 security rows change in the `Term (y)` column alone and 51 in the `SAO` column.

**Four stores no longer match the code that writes them.** [S13](./DataStores.md#s13), [S14](./DataStores.md#s14) and [S15](./DataStores.md#s15) were republished from the previous code minutes before this, and `updateSaSaoYields.js` reads the same `calculateSAO`, so [S10](./DataStores.md#s10) is affected too: its `SAO` column moves on 24 of 53 rows, by at most 0.0249 bp. Republishing is the developer's call.

**Found, not fixed:** where a TIPS is quoted with an ask price and no bid price, the yield spread is written as the negative of the ask yield rather than left empty, because `yieldFromPrice` returns null there and null passes the numeric test guarding the subtraction. Both copies carried it, so it is not a divergence, and no TIPS in the 2026-09-11 quote file is missing a bid price. Reported rather than changed, because fixing it moves a published column.

---

## 3.10 The stale spec-to-code references are triaged

The 94 findings `scripts/check-spec-code.cjs` reported are down to zero, across `bb7203d`, `baedc3d`, `c044f56`, `86e123e` and the commit carrying this section. Each was read against the source before the spec was changed, and they fell into four kinds.

**Stale naming, 54 findings.** The code was renamed and the spec was not. The largest groups: the solved weight of the active lower bracket is `activeWeight`, where the specs carried a retired name with a redundant Lower in it, in both `2.0_TIPS_Ladders.md` and `3.0_TIPS_Ladder_Rebalancing.md`; the funded-year and excess quantities on a rebalance row are `fundedYearQtyBefore`, `fundedYearQtyAfter` and `fundedYearQtyDelta`, the `fy` abbreviation the root `CLAUDE.md` retired; a job entry in `Dashboard/jobs.json` carries `windowsTaskNames`, a list, not a single name. The two raw estimates in `3.0` have no field of their own and are now written subscripted, the form this document already uses for a quantity that exists only in a formula.

**Absent by design, 32 findings across four specs.** Resolved by the status-line convention in §4.0.

**External names, 3 findings.** `EADDRINUSE` is a Node.js error code and `launchPersistentContext` a Playwright API, so no repository file can hold either. The checker lists them one at a time, with their owner, rather than opening a category.

**Prose the checker misread, 5 findings.** `knowledge/DFD_Worklist.md` named the stale identifiers as examples of the problem and illustrated the file-and-symbol form with a placeholder path; both now name live code instead.

**One correction to what §3.0 asked.** `3.2_Multi_Account_Rebalancing.md` does not describe work that was never built. Its own header records that the layer was implemented and then removed on 2026-06-25, which is why the account allocation module it names is absent. No spec among the 94 findings was ahead of its code.

**No spec was found naming something the code should have and does not.**

---

## 3.11 Every process and flow is named for what it holds or does

The developer set the rule in §2.0: a process name states the transformation, and a flow name is the one structure the flow holds. Applying it changed the model as well as the labels, because several labels had been lists of the several structures a single line stood for.

- **Process specs are named for their process.** The seven Yield Curves specs became `3.1_Parse_Sources_And_Calculate_Yields.md` to `3.7_Render_Charts_And_Tables.md` (`39b1393`, `b25a166`), with every reference rewritten and every link that cited a retired spec number corrected.
- **3.1.8 Calculate Treasury yields is new.** The Treasury yields had been specified inside the parse of 3.1.2 and inside rendering, and the FedInvest Treasury yield calculation existed in the page’s render step and again in the acquisition job. It is now `shared/src/treasury-yields.js`, calculated once at load. The bid-ask spread formulas, which had three copies, are now `shared/src/spreads.js` (`194dfcc`). Every figure from the new functions equals the old formula on the live stores: 403 FedInvest Treasury yields, 649 market Treasury spreads and 53 TIPS spreads.
- **The model was corrected where the labels had hidden an error.** The GSW curve parameters were drawn going to 3.1.7, which does not use them, and no default view uses them at all: they are drawn only on an analysis view opened with `?gsw`, so they are off the diagrams. 3.1.6 determines one settlement date, the market quotes’. The spec had said 3.1.7 calculates the index ratio; it takes the one the quote states (§3.0 item 1).
- **Every flow has one Data Dictionary name** (`a9ac724`): §6.1 the flows from external entities, §6.2 the flows at Levels 0 and 1, §6.3 the Yield Curves flows. Download Date and Bond Holiday are new primitives.
- **The context diagram has fourteen entities.** The sources of S12 and S9, the Federal Reserve and Treasury’s tentative auction schedule, had no entity and no flow, so Level 1 did not balance against Level 0. They are E13 and E14. FiscalData’s two structures are two flows.
- **Level 1 keeps the app names.** Verb phrases were tried there and reverted: an app is known by its portal name. Below Level 1 process names have no article, and each data store is titled in its entry as the diagrams name it.

---

## 3.12 The index ratio the market quotes state

Measured, not yet built. The inflation factor in [S7](./DataStores.md#s7) is the [Index Ratio](./DATA_DICTIONARY.md#index-ratio) at the [Settlement Date](./DATA_DICTIONARY.md#settlement-date) one bond trading day after the [Download Date](./DATA_DICTIONARY.md#download-date), calculated from the retrieved [Ref CPI](./DATA_DICTIONARY.md#ref-cpi) and rounded once to nine decimal places. That calculation reproduces the quoted figure on all 53 TIPS in the 2026-09-14 quote file, and on all 53 in the 2026-06-25 quote file held in `YieldCurves/tests/fixtures/`. Treasury's rule matches none.

**The convention.**

- **Settlement date:** the download date plus one bond trading day, the date [3.1.6](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#determine-settlement-date) already determines: 2026-09-14 settles 2026-09-15, and 2026-06-25 settles 2026-06-26. Every other date tested, the download date included, matches no TIPS in either file.
- **Ref CPI series:** [S3](./DataStores.md#s3), the retrieved series. The NSA column of [S4](./DataStores.md#s4) states the same Ref CPI on 2026-09-14 and 2026-09-15, so these files do not separate the two series; S3 is the one to use because it is authoritative.
- **Dated date Ref CPI:** [S2](./DataStores.md#s2). The S3 figure on each dated date equals it on all 53 TIPS. S4 begins at 2019-04-01 and holds no figure for the 21 TIPS dated earlier.
- **Rounding:** the ratio rounded half up to nine decimal places, in one step. Both Ref CPIs are stated to five decimal places already, so rounding them first changes nothing.

**Measured on the 2026-09-14 quote file**, 53 TIPS, Ref CPI from S3, dated date Ref CPI from S2. Each count is the TIPS whose calculated figure equals the quoted one to nine decimal places.

| Rounding of the ratio | Settlement 2026-09-15 | Largest difference | Settlement 2026-09-14, the download date | Largest difference |
|---|---|---|---|---|
| Round to 9 | 53 | 0 | 0 | 7.05 × 10⁻⁶ |
| Ref CPIs rounded to 5 first, ratio rounded to 9 | 53 | 0 | 0 | 7.05 × 10⁻⁶ |
| Round to 10, then to 9 | 51 | 1 × 10⁻⁹ | 0 | 7.05 × 10⁻⁶ |
| Truncate to 9, with or without the epsilon adjustment | 27 | 1 × 10⁻⁹ | 0 | 7.05 × 10⁻⁶ |
| Round to 8 | 6 | 5 × 10⁻⁹ | 0 | 7.05 × 10⁻⁶ |
| Treasury's rule: truncate to 6, round to 5 | 0 | 4.99 × 10⁻⁶ | 0 | 9.69 × 10⁻⁶ |
| Round to 6, truncate to 5 | 0 | 9.48 × 10⁻⁶ | 0 | 5.92 × 10⁻⁶ |

The unrounded ratio lies within 0.5 × 10⁻⁹ of the quoted figure on all 53. Substituting the S4 NSA column for S3 gives the same counts, as does taking the dated date Ref CPI from S3 in place of S2. Each calculated ratio lies at least 0.0093 × 10⁻⁹ from a nine-decimal rounding boundary, more than 20,000 times the spacing of double-precision values at that magnitude, so no count depends on floating-point representation. Six TIPS are quoted to seven or eight decimal places because the file drops trailing zeros (`1.18271786` is 1.182717860), so the comparison is numeric and not on the text.

**What the implementation must do.**

1. Calculate the index ratio of each market-quote TIPS at the settlement date of 3.1.6, the one its yields already use, as the S3 Ref CPI on that date over the S2 dated date Ref CPI.
2. Round the ratio once, half up, to nine decimal places. `shared/src/ref-cpi.js#indexRatio` applies Treasury's rule, which matches no TIPS, so it cannot be called as it stands. The nine-decimal rounding belongs in that module beside Treasury's rule, not in a second copy in the app. Which callers keep Treasury's rule is the developer's call.
3. Hold the calculated ratio equal to the quoted one, to nine decimal places, in a test on a real quote file. The quoted figure is an independent derivation, so the test is a cross-check and not a duplicate.
4. Change [3.1](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md) in the same commit: 3.1.7 takes the index ratio the quote states.

**Open.** Both files were downloaded on a day followed by a bond trading day, a Monday and a Thursday, so neither separates one bond trading day from one calendar day, and neither settlement crosses a [Bond Holiday](./DATA_DICTIONARY.md#bond-holiday). A quote file downloaded on a Friday, or on the day before a bond holiday, settles the question. S7 is replaced three times a day, so that file has to be kept when it occurs.

---

## 4.0 Structural decisions already taken

- **Data stores are not on the context diagram.** They sit inside process 0, so they are drawn where they are first shared.
- **External entities are not redrawn below level 0.** Their flows enter from the page edge, named, and balance is checked on flows rather than boxes.
- **All fourteen R2 stores appear at Level 1**, whether one app reads a store or several, so no app looks as though it reads nothing.
- **Identifiers are not shown on diagrams.** E and S numbers are link plumbing; they stay as anchors, not labels.
- **The Data Dictionary body stays grouped by category**, with the generated A-Z index for lookup. Grouping is what makes a missing or inconsistent entry visible: bracket year and cover year sit together, which is how their definitions were caught failing to distinguish each other.
- **The maturity SA Factor approaches 1.0 as the horizon lengthens, at every horizon, with no floor.** Settled in `b3136e3`: the weight is a signal-to-noise ratio of measured amplitude against measured drift, so a floor would discard measured 1-to-5-year drift with no measurement behind the boundary, and the weight is near 1 at the front end in any case. Four terms were added to the Data Dictionary for it in `b20dafc`: Maturity SA Factor, Credibility Factor, Seasonal Amplitude, Seasonal Factor Drift.
- **Credibility Factor is the name for `w(h)`.** `w(h) = A² / (A² + σ_drift(h)²)` is the credibility factor of actuarial credibility theory, Bühlmann’s `Z` at one observation: the posterior mean weight for a prior centred on 1.0 with variance `A²` against an observation whose error variance is `σ_drift(h)²`. An earlier session named it Horizon Confidence Weight; the developer replaced that with the established term once the correspondence was shown to be exact rather than an analogy.
- **"Fade" is out of the vocabulary, everywhere.** A weight that gets smaller does not fade. The horizon work was swept in `8ca7f69` and the SAO snap weight in `2b2aa86`, where the two exported constants became `SAO_BLEND_START_YRS` and `SAO_BLEND_END_YRS`. `scripts/check-vocabulary.js` carries the rule, exempting only a chart line drawn at reduced opacity, which literally fades.
- **The long-end seasonal adjustment stands at about 3 bp**, and [Seasonal Factor Drift §8](../YieldCurves/knowledge/Seasonal_Factor_Drift.md) records why: about 63% of the seasonal variance is a permanent month effect, February is negative in every era, and the factor still autocorrelates about 0.50 at 30 years. Every alternative that follows a measurement lands within 0.15 bp of the method in use, so the formula did not change.
- **A spec that describes absent code says so on a status line**, written for the reader as the first line under the title: `*Status: Archived — <why the code is gone, and where the live spec is>.*`, or `Unbuilt` for a spec written ahead of its code. `scripts/check-spec-code.cjs` reads that line, lists the spec at the end of its report and does not resolve its names, because naming what is absent is what those documents are for. Four specs carry it today, all Archived. It is the distinction that made the checker clean enough to gate on: without it a spec that is deliberately ahead of or behind the code is indistinguishable from one that has rotted.
- **Level 1 is one process per app plus one acquisition process**, which explodes into the fifteen jobs. Portal menu groupings were considered and rejected: nearly every shared store is read across group boundaries, so grouping would have added a level without simplifying anything.

---

## 5.0 Two stores are documented nowhere

`misc/BondHolidaysSifma.csv`, read by five apps, and `bls/CPI.csv`, the input to the whole seasonal factor chain. Both are drawn on Level 1 and both link to `DataStores.md` with no entry to land on. Neither has a Data Dictionary entry or an S number. Assigning numbers was deferred while the value of the identifiers was in question.
