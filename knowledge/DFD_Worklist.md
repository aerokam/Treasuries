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

**Specs written to the current template**, all in `YieldCurves/knowledge/`: `3.1_Load_And_Parse.md`, `3.7_Rendering.md`, `3.5_Breakeven_Inflation.md` and `3.6_Bid_And_Ask_Spreads.md`.

---

## 2.0 Rules the developer set

These came out of review and apply to every spec from here.

- **Lead with what the process does.** Not with what a file is or is not. Name a store by its identifier, S1, never "the file".
- **No metaphors and no anthropomorphism.** A process has an input and an output; it does not know, need, want or label. "Keyed on month/day" was rejected as a metaphor.
- **Link rather than restate.** If another spec owns a rule, point at it.
- **Every term in a spec, a diagram label or a domain identifier is defined in the Data Dictionary.** Loop counters and buffers are exempt; a name carrying a domain quantity is not. `inflationFactor` was renamed `indexRatio` for this reason.
- **A synonym belongs on the term**, not in the store entry that happens to use it.
- **Every lowest-level process links to a spec, and the spec should name the code it drives** — with a check that the naming still resolves, or it rots silently.
- **Flow labels are compositions of defined terms**, each linking to its Data Dictionary entry. `scripts/build-dfd.cjs` reports fragments with no entry rather than linking them.

---

## 3.0 Open, awaiting the developer

1. **Eight flow label fragments have no Data Dictionary entry**, reported by every run of the diagram build: bond trading days, picked security, quote file date, scales, source dates, spreads, tab and date selections, tab and mode. Some want a term defined, some want the label changed to one that exists.
2. **93 stale spec-to-code references** across 62 specs, from `node scripts/check-spec-code.cjs`. Not wired into the pre-commit hook, because that many findings would block every commit before triage. Concentrations: `3.2_Multi_Account_Rebalancing.md` 27, `3.0_TIPS_Ladder_Rebalancing.md` 17, `AMD_FORMULA_ANALYSIS.md` 14, `2.0_TIPS_Ladders.md` 8. Verified genuine: specs say `activeLowerWeight` where the code has `activeFloorWeight`, `MAX_LAST_YEAR` where it has `maxLastYear`, `fyQtyBefore` where it has `fundedYearQtyBefore` — the last being the `fy` abbreviation the root `CLAUDE.md` retired.
3. **A spec for unbuilt work needs to say so.** `3.2_Multi_Account_Rebalancing.md` describes a feature that does not exist: `src/account-allocation.js` is absent and 27 of its names resolve to nothing. Under specs-drive-code that is legitimate, but nothing distinguishes it from a spec that has rotted, and the checker will flag it forever.
4. **Whether to gate on the checker** once those are triaged.
5. **`3.2_Seasonal_Adjustments.md` may be repurposed** as the Yield Curves spec, with seasonal adjustment demoted to a section. Proposed by a session that has since ended and never confirmed. The proposal predates the naming scheme in §2.0 and conflicts with it: a numbered spec takes the number of the process it specifies, and process numbers are frozen, so the file cannot become `1.0_Yield_Curves.md` while it specifies process 3.2. Repurposing it would mean giving Yield Curves a spec of its own at process 3 and leaving 3.2 as the seasonal adjustment spec.

---

## 3.5 Yield Curves is the template, and it is done

Every process has a spec, every process spec names the functions that implement it, every diagram carries a link to its parent spec, and the naming is one scheme: a numbered spec is a process spec and its number is the process, an unnumbered one is a reference. The other nine apps and the fifteen acquisition jobs have none of this yet, and Yield Curves is what they are copied from.

| Spec | Process |
|---|---|
| `3.1_Load_And_Parse.md` | 3.1 and its seven children |
| `3.2_Seasonal_Adjustments.md` | 3.2 |
| `3.3_SAO_Adjustment.md` | 3.3 |
| `3.4_Spot_Yield_Curves.md` | 3.4 |
| `3.5_Breakeven_Inflation.md` | 3.5 |
| `3.6_Bid_And_Ask_Spreads.md` | 3.6 |
| `3.7_Rendering.md` | 3.7 and its seven children |
| `Visual_Standards.md`, `Canty.md`, `SA_Intuition.md`, `SAO_Residual_Analysis.md`, `Seasonal_Factor_Drift.md`, both `FedInvest_*` | none: reference |

Spec headers carry typed relations in reciprocal pairs: Specifies and Implemented by, Constrains and Constrained by, Source for and Derived from, Evidence for and Evidence, Explains and Explained in. A reference spec is reachable through them and is never the end of a drill.

**A fourth checker exists**: `scripts/check-links.cjs` fails when a relative markdown link does not resolve. `check-spec-code.cjs` now also resolves `path/to/file.js#symbol` against both halves, and reads `// spec: <file>#<anchor>` tags in source back to the anchor they claim.

---

## 3.6 Market-quote nominal yields are calculated

Done in the app. All four combinations of source and security type now have their yield calculated from price: `YieldCurves/src/app.js#parseFidelityNominals` prices both sides of each market-quote nominal Treasury at the settlement date of [3.1.6](../YieldCurves/knowledge/3.1_Load_And_Parse.md#determine-settlement-dates), and the quoted ask yield is read as a presence test only. Measured against the quoted ask yield over the 650 nominal securities in the 2026-09-11 quote file: median 0.06 bp, p90 0.30, p99 3.31, max 20.47. Four securities differ by more than 5 bp, three of them within three days of maturity and the fourth a Note 167 days from maturity.

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

**Approved by the developer and under way:** the market TIPS settlement date defect recorded in 3.1 (the page derives it from the FedInvest date, the acquisition job from the quote file’s own; the acquisition job follows the spec), which unblocks the last duplicate copy of the TIPS security build; one convention for years-to-maturity in place of the three in use, the worst of which measures from the wall clock at run time rather than from the settlement date the prices are stated at; and one home for the nearest-nominal match that decides which nominal each published breakeven is stated against.

**Still open:** `shared/src/fidelity-parse.js` now owns both row parsers for [S7](./DataStores.md#s7) and both yield calculations on the nominal side, and has no spec. It is the first shared module to need one, and the form it takes sets the pattern for the other nine.

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
- **Level 1 is one process per app plus one acquisition process**, which explodes into the fifteen jobs. Portal menu groupings were considered and rejected: nearly every shared store is read across group boundaries, so grouping would have added a level without simplifying anything.

---

## 5.0 Two stores are documented nowhere

`misc/BondHolidaysSifma.csv`, read by five apps, and `bls/CPI.csv`, the input to the whole seasonal factor chain. Both are drawn on Level 1 and both link to `DataStores.md` with no entry to land on. Neither has a Data Dictionary entry or an S number. Assigning numbers was deferred while the value of the identifiers was in question.
