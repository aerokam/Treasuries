# Build / Rebalance Parity

## Status

Open for one decision: whether to restore the strict assertions of the symmetry test.

## Measurement

On 2026-10-18, on live data, the Build→Rebalance symmetry test (First Year 2036, Last Year 2061, Pre-Ladder Interest included, DARA 40,000) measures a total absolute quantity change of 0 and a net cash of 0, against a Build total cost of $525,702. [3.0 §Build ≡ Rebalance](../TipsLadderManager/knowledge/3.0_TIPS_Ladder_Rebalancing.md) states the invariant.

## Shared gap calculation

`calcGapParams` (`ladder-core.js`) and `calculateGapParameters` (`rebalance-lib.js`) both take the gap parameters from `gapParamsCore` (`gap-math.js`), so the LMI that feeds the Simulated Outstanding TIPS sizing no longer comes from two code paths.

## Open

The assertions of the test still allow a total absolute quantity change of 2 and a net cash of $4,000 (`TipsLadderManager/tests/run.js`, "Build→Rebalance: zero total |qtyDelta|" and "zero net cash"). Restoring them to 0 turns any later asymmetry between Build and Rebalance into a failing test.
