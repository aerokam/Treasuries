# Session Status & Next Steps

_Last updated: 2026-06-02 · Branch: `amd-option-c-and-gap-unification`_

## Current state — GREEN (uncommitted work in tree)
- **Unit:** 113/113 (`npm test`)
- **E2E:** 42/42 (`npm run test:e2e`)
- Uncommitted this session: the 2040 gap-excess fixpoint (#2) AND the Future-30Y last-year inference (below). Plus your own `tests/*AllAccounts.csv` edits (left untouched).

## Uncommitted fix — Future-30Y last-year inference (export→import round-trip)
**Bug:** build 2026–2066 (DARA 40k) → Export CUSIP/Qty (excess at 2052/2056 correct) → import → rebalance **sold the 2052/2056 excess down to DARA**. Root cause: `firstYear` was auto-inferred from gap-bracket excess, but `lastYear` was NOT inferred from Future-30Y cover excess — rebalance capped `lastYear` at the longest actual TIPS (2056), so the future rungs vanished. (Long-standing asymmetry, not today's gap fix.)
**Fix:** new `inferLastYearFromHoldings` (rebalance-lib) — symmetric to `inferFirstYearFromHoldings`; forward-reconstructs the candidate `lastYear` whose 2052/2056 cover split matches the file (DARA-free duration match; a simple ratio misinfers due to the deep-discount 2052 + long LMI cascade). Wired as: (a) engine default in `runRebalance` when no `lastYearOverride`; (b) UI `rebal-last-year` default on import (index.html). Regression test added (build→rebalance with NO year overrides → 0 trades, excess preserved). Specs: 2.0 §Future 30Y Rungs.

---

## Done this session (committed, newest first)
| Commit | What |
|--------|------|
| `a2769a7` | Gap brackets 2036/2040 always render (even at 0 excess) — `*` + qty-0 excess sub-row + reachable Gap Amount drill. Build-mode + gap-brackets only. |
| `13239ad` | Fixed corrupted `SampleHoldings.csv` (consolidated to ONE copy at `data/`, repointed app+tests+generator, added generator empty-guard); fixed 2036 Amount overshoot (AMD was double-counted on PLI-zeroed years → now = DARA); e2e per-test timeout 5000→4500ms. |
| `219479b` | Specs (3.0 / 4.0) updated for shared `sizeLadder` pipeline + AMD-inclusive inference. |
| `dbdda6d` | **Unification:** rebalance now sizes via the shared `sizeLadder` (ladder-core.js) — exact build↔rebalance round-trip symmetry (0 trades / 0 net cash). Killed the build→rebalance `fmtDate` import (new `date-util.js`). |
| `e7c6eca` | Extracted shared `sizeLadder` into `ladder-core.js`; build consumes it. |

**Architecture now:** `build-lib.js` and `rebalance-lib.js` both call `sizeLadder` + `selectLadderBonds` in **`src/ladder-core.js`** (single source of truth for ladder sizing). Neither imports the other. Gap math is shared via `gapParamsCore` in `gap-math.js`; each side has a thin adapter (`calcGapParams` in ladder-core, `calculateGapParameters` in rebalance).

---

## Next steps (start here next session)

### 1. Verify PLI-uncheck behavior  ← RESOLVED 2026-06-02: NOT A BUG
Reproduced in a headless Playwright drive (DARA 80,000 / 2036–2066, build mode). The table **does** change with PLI when Run is re-clicked:
- PLI **unchecked**: 2036 excess **57** (107,165), 2040 excess **47** (132,164).
- PLI **checked**: 2036 excess **0**, 2040 excess **2** (3,018).

The earlier "no change" was the **Run-gate**: the build only recomputes on **Build Ladder** click, so toggling PLI without re-running shows the stale prior render. Verified clean: engine PLI-sensitive (57/47 vs 0/0), wiring reads `#pre-ladder-interest`.checked → `runBuild` (index.html:1999), checkbox visible in build mode (index.html:587), and `isBracket`'s gap-bracket OR-logic doesn't clobber non-zero excess. No code change needed.

### 2. 2040 gap-excess circularity — RESOLVED 2026-06-02 (View A)
Upper-bracket (2040) excess coupon is now credited into gap sizing via a shared fixpoint `gapParamsWithUpperFeedback` (`gap-math.js`), called by both `calcGapParams` (build) and `calculateGapParameters` (rebalance) — equal inputs → equal output, so the 0-trade round-trip is preserved by construction. Effect: gap brackets 57/47 → 55/45 (~2 fewer bonds each, removes ~3% over-coverage). Specs 2.0/4.0 updated; one unit tolerance widened (avgAmt≈DARA 200→300). Unit 107/107, e2e 42/42. See memory `project_2040_gap_excess_circularity`.

### 3. (Open) Long-tier TIPS buying in Joint (taxable)
2040/2041 TIPS still allocated to taxable (Joint) despite swap-credit + CUSIP-transition fixes; root cause unknown. Multi-account allocation (`account-allocation.js`). See memory `project_long_tier_joint_bug`.

### 4. (Optional cleanup) Shorter e2e timeout
Global per-test timeout is 4500ms — the floor that clears the spec's inline `{ timeout: 4_000 }` assertion waits. To go shorter (you wanted failures to fail faster), lower those inline 4000ms waits in `tests/e2e/app.spec.js` too.

---

## Conventions / reminders
- **Run from repo root:** `npx serve . -p 8080` → app at `http://127.0.0.1:8080/TipsLadderManager/`. Playwright reuses an existing :8080 server (`reuseExistingServer`). Keep your own server running in your terminal; don't let it get killed.
- **Tests:** `npm test` (unit, ~instant) · `npm run test:e2e` (Playwright). E2E dictum: stop on first failure and debug it; a timeout = a real failure.
- **Specs-first:** read the governing spec section in `knowledge/` before changing logic.
- **No duplication:** one definition, one place (the whole point of `ladder-core.js`).
