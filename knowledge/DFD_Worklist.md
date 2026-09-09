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

**Specs written to the current template**, all in `YieldCurves/knowledge/`: `5.0_Load_And_Parse.md` (7.1), `6.0_Rendering.md` (7.7), `7.0_Breakeven_And_Spreads.md` (7.5 and 7.6).

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
5. **`1.0_Seasonal_Adjustments.md` may be repurposed** as the Yield Curves spec and renamed `1.0_Yield_Curves.md`, with seasonal adjustment demoted to a section. Proposed by a session that has since ended and never confirmed. If it happens, `1.1_Seasonal_Factor_Drift.md` renumbers with it and the Level 2 drill for 7.2 needs repointing.
6. **`updateSaSaoYields.js` publishes corrected SAO on its next scheduled run.** The duplicate algorithm was retired in `f57ef4a`; measured against the published file, SA moved on none of 53 securities and SAO on 21, by up to 56 basis points, concentrated at the short end where the flat-hold fix applies.

---

## 4.0 Structural decisions already taken

- **Data stores are not on the context diagram.** They sit inside process 0, so they are drawn where they are first shared.
- **External entities are not redrawn below level 0.** Their flows enter from the page edge, named, and balance is checked on flows rather than boxes.
- **All fourteen R2 stores appear at Level 1**, whether one app reads a store or several, so no app looks as though it reads nothing.
- **Identifiers are not shown on diagrams.** E and S numbers are link plumbing; they stay as anchors, not labels.
- **The Data Dictionary body stays grouped by category**, with the generated A-Z index for lookup. Grouping is what makes a missing or inconsistent entry visible: bracket year and cover year sit together, which is how their definitions were caught failing to distinguish each other.
- **The maturity SA Factor fades toward 1.0 with horizon, at every horizon, with no floor.** Settled in `b3136e3`: the weight is a signal-to-noise ratio of measured amplitude against measured drift, so a floor would discard measured 1-to-5-year drift with no measurement behind the boundary, and the weight is near 1 at the front end in any case. Four terms were added to the Data Dictionary for it in `b20dafc`: Maturity SA Factor, Horizon Confidence Weight, Seasonal Amplitude, Seasonal Factor Drift. One of the four is not yet approved, §3 item 6.
- **Horizon Confidence Weight is the approved name for `w(h)`.** Chosen by the developer over two established alternatives that were put to him with it: shrinkage weight, the general statistical name, and credibility factor, the actuarial one. The Data Dictionary entry, both specs and `shared/src/ref-cpi.js#seasonalHorizonWeight` therefore stand as written in `b20dafc`.
- **Level 1 is one process per app plus one acquisition process**, which explodes into the fifteen jobs. Portal menu groupings were considered and rejected: nearly every shared store is read across group boundaries, so grouping would have added a level without simplifying anything.

---

## 5.0 Two stores are documented nowhere

`misc/BondHolidaysSifma.csv`, read by five apps, and `bls/CPI.csv`, the input to the whole seasonal factor chain. Both are drawn on Level 1 and both link to `DataStores.md` with no entry to land on. Neither has a Data Dictionary entry or an S number. Assigning numbers was deferred while the value of the identifiers was in question.
