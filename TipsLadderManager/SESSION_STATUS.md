# Session Status & Next Steps

_Last updated: 2026-06-02 · Branch: `amd-option-c-and-gap-unification`_

## Current state — GREEN
- **Unit:** 107/107 (`npm test`)
- **E2E:** 42/42 (`npm run test:e2e`)
- Working tree clean except **`tests/SchwabAllAccounts.csv`** (your uncommitted edit — left untouched).

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

### 1. Verify PLI-uncheck behavior  ← FRESH OBSERVATION, do first
With **Pre-Ladder Interest CHECKED**, the gap-bracket display is correct (2036/2040 show `*` + qty-0 excess, gap covered by the pool).
With PLI **UNCHECKED**, you observed **"no change"** — but it *should* change: at DARA 80,000 / firstYear 2036 / lastYear 2066, PLI-off produces **real gap excess (~57 bonds at 2036, ~47 at 2040)**.
- **To check:** uncheck PLI, click **Run again** (the build only recomputes on Run), and confirm 2036/2040 show real excess quantities — not still 0.
- If it stays 0 after re-running, that's a real bug: trace whether the PLI checkbox state reaches `runBuild({ preLadderInterest })` and whether `lowerExQty`/`upperExQty` come back non-zero. (Node check: `sizeLadder` with `preLadderInterest:false` gave 57/47 — so the engine is right; suspect the UI wiring or a stale render.)

### 2. (Pinned) 2040 gap-excess circularity
Gap upper bracket (2040) excess coupon isn't fed back into gap sizing — currently approximated; cancels in build↔rebalance so symmetry holds. Revisit now that unification is done. See memory `project_2040_gap_excess_circularity`.

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
