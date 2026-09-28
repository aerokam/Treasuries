# Identifying bracket and cover years from apparent excess holdings

Work started in the `ladder-retained-bracket-id` session and handed to the session holding the specs. The developer's rulings are recorded here so they are not asked again; the code already committed is listed so it is not rewritten; what is left is listed in the order it should be done.

Read first: `knowledge/DATA_DICTIONARY.md`, `knowledge/2.0_TIPS_Ladders.md` (§Retained Bracket Excess), `knowledge/3.0_TIPS_Ladder_Rebalancing.md` (§Bracket Identification Rules, §Before-State Preview and Bracket-Year Excess Detection, §Lower bracket priority rule).

---

## Rulings already given

1. **The Excess-ARA metric is replaced.** A maturity year is identified by a clear deviation from the ladder's shape, not by its ARA standing above a single median. In the developer's words: the plot of DARA against maturity year has relatively smooth humps and dips with some spikes that noticeably deviate from the curve, the spikes are the bracket and cover year candidates, and the algorithm implements that visualization.

2. **The baseline moves with the metric.** A flagged year's DARA becomes the curve value at that year, replacing the median. Detection and sizing then share one baseline, and excess is what stands above the curve.

3. **Identification is per maturity year, not per TIPS.** A year holding both a January and a July maturity is one candidate. This part of the current behaviour was already correct.

4. **Within a bracket or cover year holding more than one maturity**, the funded-year need is met from the earliest maturity first, so the excess sits on the latest maturity, which is also the one entering the duration match. When a sale is required the earliest maturity is sold first: a lower bracket maturity closer to the first gap year gives the better duration match.

5. **Sell order is one rule at maturity granularity** — earliest maturity first across all retained lower bracket maturities, whether they sit in different years or in the same year. It replaces the separate across-years rule rather than sitting beside it.

6. **Every spike is retained, not one.** `bracketWeightsN` already solves for any number.

---

## Committed already

- `5e5a2cb` — `tests/dev/RetainedExcessTwoYears.csv` and `tests/dev/RetainedExcessTwoMaturities.csv`. Each is `data/SampleHoldings.csv` with two or three quantities changed, so every other figure is the one the real portfolio produces. The first puts genuine excess in 2034 and 2035 at once; the second puts one excess year (2035) holding two maturities.
- `4af80d1` — `src/shape-math.js`. `smoothCurve` fits the ladder's shape (repeated running median, one Hann pass). `findSpikes` returns every index standing more than `k` robust scales above it, strongest first, each flattened onto the curve before refitting.
- `57e7368` — tests in `tests/run.js`. 444 pass.
- `c996df3`, `029878b`, `95f2008`, `f15db47`, `5b1d424` — the amber flag on a per-year DARA input. Separate messages for a candidate year and for a maturity year with no issued TIPS, and the flag moved off `title` onto `data-tip-html` so it appears without the browser's own delay.

Nothing in `identifyBrackets` has been changed.

- **2026-09-27, `ladder-shape-dara-inference` session** — item 1 below is done. `detectBracketFlags`
  (`src/before-state-lib.js`) now runs `findSpikes` once over every held funded year and flags a
  candidate when it's a spike, replacing `heldYearMedianExcluding` for the flagged value and the
  detection threshold both (rulings 1-2). `heldYearMedianExcluding` itself is kept, still exported
  and still tested, purely as the comparison baseline the shape-math tests check the curve against
  — it has no remaining call site inside `detectBracketFlags` or `derivePerYearDara`.

  Extended past what this item originally scoped: `rebalance-lib.js#derivePerYearDara` (the
  run-time self-financing recovery for a mirror plan, §Funding the rebalance — a separate median
  computation from `detectBracketFlags`'s, not touched by ruling 1/2 as written) now runs the same
  `findSpikes`/`inferShapeValue` mechanism, and a genuinely new low-data fallback was added
  throughout: below `MIN_SHAPE_POINTS` (5) held points there's no curve to fit at all, so detection
  and gap-year sizing fall back to the flat **mean** of the held years instead of the median this
  whole feature replaces (a 2-point held series' median degenerates to picking one of the two raw
  values outright under this codebase's convention — the sparse-ladder case a user bug report
  surfaced independently of this TODO). See `TipsLadderManager/KNOWN_ISSUES.md` FIXED entry
  "Gap-year (and sparse-ladder) DARA inference..." and `knowledge/4.0_Computation_Modules.md`
  §shape-math.js for the wiring and the module's own spec entry (closing the "not yet documented"
  gap item 4 below used to note).

  Both spec defects below ("3.0 §198 propagates..." and "a gap year's filled-in DARA is
  inconsistent with itself") are resolved by this pass — see 3.0 §Per-Year DARA from Portfolio and
  §Before-State Preview and Bracket-Year Excess Detection, current text.

---

## Left to do, in order

1. ~~**Wire the curve into `detectBracketFlags`**~~ — done 2026-09-27, see above.
2. **`identifyBrackets`** (`src/rebalance-lib.js:43`): still returns at most one CROSS-YEAR retained maturity via the `(araByYear[y] || 0) - DARA` metric — that part is unchanged. Multiple cross-year generations (e.g. genuine excess at both 2032 and 2034) are still not identified; the hardcoded single-element pick at `~:69`/`~:128` remains the known gap for that case.

   **2026-09-28, developer scoping.** Deprioritized: identifying several simultaneously-excess
   cross-year candidates from a single snapshot load (what the `ladder-shape-dara-inference` session
   spent 2026-09-27 chasing via `RetainedExcessTwoYears.csv`, a hand-edited fixture, not a real
   report) — not worth further time until an actual account shows it. The scenario worth keeping in
   mind instead: the active lower bracket rolls forward over TIME as new 10-year TIPS are issued and
   the DARA plan changes, so a real portfolio can genuinely accumulate more than one retained
   generation gradually (e.g. Jan 2034 was originally the active bracket; the plan later needed more
   excess and some got added at 2035; by the time 2036 is active, both 2034 and 2035 are retained).
   Not currently causing a problem for the developer's own ladder (duration-matching output isn't
   being acted on there for now), and nobody has filed it as a bug or enhancement request.
   **Preferred long-term direction, when this is picked up:** don't chase a better auto-inference
   heuristic as the end state. Auto-detection (Excess ARA Priority, or the curve-based detection in
   `before-state-lib.js`) will keep being right most of the time, but there is currently no way for
   the user to override it when it isn't — give the user an explicit way to designate which maturity
   year(s) are being used to hold retained excess, with auto-detection as the default/suggestion,
   not the only path.
3. **Within-year split and sell order (rulings 4 and 5) — done for the one case that mattered in practice.** 2026-09-20: fixed for a maturity year holding the active lower bracket *plus* one other held CUSIP maturing in that same year (the recurring real-world shape — an older bond held from before the active lower bracket rolled forward into a new issue in the same year, e.g. Jan/Jul). `runRebalance` now detects that holding independent of the Excess ARA pick, computes its own funded-need-first split, and feeds it into `bracketWeightsN` as a second retained leg alongside whatever `identifyBrackets` found. See `TipsLadderManager/KNOWN_ISSUES.md` "Multi-bracket bought — or sold — the wrong CUSIP..." for the fix and its verification. **Still not general**: a bracket year holding *three or more* maturities, or two maturities in a year that is itself a cross-year retained pick (not the active year), is not covered — those would need the same treatment, generalized.
   **2026-09-22 addendum:** a same-maturity-year retained maturity is now a candidate for the year's own
   funded need under a non-default `maturityPref` (3.0 §Named Quantities §Target CUSIP resolution) —
   ruling 4's earliest-first placement runs only when maturityPref did NOT pick that maturity as the
   funded CUSIP itself; when it did, that maturity's funded quantity is resolved by the general
   maturityPref mechanism instead, with its own (still frozen, still never-increased) excess share
   combined onto the same row. First reported: a real account whose active bracket year holds a
   retained maturity, where `maturityPref='first'` kept buying the active (canonical) maturity as
   funded instead of the retained one — root cause was the funded-CUSIP ranking unconditionally
   excluding any same-maturity-year retained CUSIP from candidacy.

   **2026-09-23 correction:** the same-day fix above still sold an already-adequate funded holding to
   relabel it under the preferred maturity whenever the excess CUSIP itself carried real funded
   coverage (not just a same-year retained maturity) — reported on a real account where the excess
   CUSIP's entire held quantity was legitimately funded (no real retained excess at all), and switching
   `maturityPref` to `'first'` sold the whole position and rebought the identical dollar amount at a
   different maturity for no economic reason. The rule is now genuinely incremental: the excess CUSIP's
   existing funded coverage freezes in place (never sold to satisfy a preference) and only a *shortfall*
   the current holdings don't already cover gets bought into the preferred maturity. Verified zero-trade
   on the reporting account across every `maturityPref` value; a synthetic fixture with a forced
   shortfall confirms the redirect itself still works when genuinely needed.
4. **Specs**: `2.0 §Retained Bracket Excess` and `3.0 §Bracket Identification Rules §Retained Maturities` updated 2026-09-20 for the same-maturity-year case (item 3). `3.0 §Before-State Preview` and `4.0 §Computation Modules` (`shape-math.js` entry) updated 2026-09-27 for item 1 above. `3.0 §Lower bracket priority rule` still open.
5. **Detail-row display for the same-maturity-year retained leg** doesn't yet split funded vs. excess the way the recognized bracket-target row does (`TipsLadderManager/KNOWN_ISSUES.md`, OPEN: "A same-maturity-year retained leg's own row does not label its trade as excess"). The trade itself is correct; only the row's own drill-down label isn't wired yet.

---

## Spec defects found along the way

- **`2.0` and `3.0` describe a user control that does not exist.** Both call it "Retain lower bracket excess", on by default. No such control is in `index.html` or `src/`. The control is **Brackets**, with values *2-bracket* and *Multi-bracket*.
- **`3.0 §Before-State Preview` is quoted in `before-state-lib.js` as saying "held funded years only".** The population is built by `computePortfolioARAByYear` from holdings alone, with no DARA consulted, so its members are maturity years the portfolio holds TIPS in. A bracket year whose DARA is 0, holding excess TIPS alone, is in that population and is not a funded year (DD §Funded Year). The developer and this session are settling a term for it; until then the user-facing string says "the maturity years that hold TIPS".
- **A gap year's filled-in DARA is inconsistent with itself — RESOLVED 2026-09-27.** This retired
  path: a gap year now reads `inferShapeValue` (the nearer neighboring held year's own local slope,
  extended to the gap year's position — never an excluding-self comparison, since a gap year was
  never in the held population to exclude itself from in the first place), falling back to the flat
  mean of the held years only when there aren't enough points on either side to read a slope from.
- **`3.0 §198` propagates the Excess-ARA rule into the preview — RESOLVED 2026-09-27.** That
  cross-reference is removed; the preview's lower-bracket pool now cites `identifyBrackets` only for
  *why* it still keeps a single-winner tie-break (the real engine still only ever acts on one
  cross-year retained maturity, item 2 above), not for the detection metric itself.

---

## Evidence, so it does not have to be derived again

Settlement 2026-09-22, market fixtures in `tests/e2e/`. Re-derived 2026-09-21 against the current
`data/SampleHoldings.csv` — rescaled that day to 0.5x the real Kevin IRA (previously ~0.2x); every
figure below is a fresh recomputation on the rescaled file, not the earlier values adjusted by hand.

Identification, where the answer is known by construction:

| file | expected | curve method |
|---|---|---|
| `data/SampleHoldings.csv` | 2034 | 2034 |
| `tests/dev/RetainedExcessTwoYears.csv` | 2034, 2035 | 2034, 2035 |
| `tests/dev/RetainedExcessTwoMaturities.csv` | 2035 | 2035 |

(The two `tests/dev/` fixtures are separate, hand-built files at their own original — still 0.2x —
scale, not derived from `data/SampleHoldings.csv` at runtime, so the rescale above does not touch
them; their own numbers are unaffected and still verified by the passing shape-math tests.)

Separation on the real portfolio is wide, so the threshold is not a knife edge: 2034 at 8.8 robust
scales, the highest ordinary maturity year (2050) at 2.8, with 2036 next at 2.7 and 2026 at 2.6 —
comfortably under the `k=4` threshold `findSpikes` flags at. Ordinary years otherwise range 1.08 to
1.51 times the median.

What ruling 2 changes, for the years actually flagged on `data/SampleHoldings.csv`:

| flagged year | ARA | median baseline | curve baseline | excess, median | excess, curve |
|---|---|---|---|---|---|
| 2034 | 93,854 | 48,774 | 57,611 | 41 bonds | 33 bonds |
| 2036 (active lower) | 67,617 | 48,774 | not a spike (z=2.7, below k=4) | 18 bonds | 0 bonds |

**2036 no longer registers as a curve-method spike at this scale** — a real, notable difference
from the 0.2x-scale figures this table previously carried (which showed 2036 flagged under both
methods), and, as of the 2026-09-27 wiring (item 1 above), a real, live change in what the app now
shows: 2036 does not flag on `data/SampleHoldings.csv` today, where it used to under the median this
replaced (`tests/run.js` "SampleHoldings.csv: 2036 (active lower bracket) does not register as a
curve-method spike here" locks this in). The active bracket is expected to legitimately carry both
real funded income and gap-coverage excess on top of it, so sitting close to its own curve here is
not a detection miss. Bond counts convert each year's dollar excess through that year's own held
CUSIP's P+I-per-bond (`calculatePIPerBond`), the same unit ARA/DARA/excess are already expressed in
throughout this codebase — not a market-cost conversion.

The old branch `retained-bracket-work` (`078741f`) claimed 2032 and 2033 were identified while the app displayed their excess as zero. That does not reproduce: only one lower candidate is kept, so 2032, 2033 and 2035 are never flagged and take their own ARA as their DARA. The median baseline *would* assign them 4 bonds each if they were flagged, which is the same defect seen from the other side.

Two production defects reproduce on current `main`, and are what the fixtures are for. With excess in two pre-gap years, the second loses its bracket role, its holding is reported as funded-year quantity, and the sweep sells it: 15 of 30 bonds of Jan 2034, with Multi-bracket selected. With one excess year holding two maturities, the quantity tie-break names the January maturity, reports all 20 of it as excess and none as funded, and sells down the July maturity.

---

## Traps

- `tests/run.js` has mixed line endings in the committed blob. Editing it with a tool that normalizes them floods the diff with whitespace changes. Splice with a Node script writing CRLF.
- A quoted heredoc in this environment still consumes backslashes, so a patch script matching on a string containing one has to build it with `String.fromCharCode(92)`, or anchor on text with no backslash in it.
- Run the suite from `TipsLadderManager/`. From the repository root, sixty tests that look for dev files by relative path skip silently and the count drops without failing.
