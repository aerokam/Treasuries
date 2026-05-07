# Spec Next Steps — Duration Algorithm Coverage

## Status
Open — identified at end of duration algorithm fix session (May 2026).

## What Prompted This
The duration fix session corrected `shared/src/bond-math.js` to use the fractional first coupon period algorithm (matching Google Sheets DURATION/MDURATION). During that work it became clear the specs were not sufficient to have guided or validated the fix — you would need to read the code to know what the correct algorithm was.

---

## Item 1 — Critical: `4.0_Computation_Modules.md` §`calculateMDuration` — algorithm not specified

Current text reads: *"standard bond duration formula (not separately documented — implementation is the reference)."*

This was a placeholder left when the function was extracted from `rebalance-lib.js`. Never filled in. You cannot rewrite the implementation from this spec.

Missing:
- `calculateDuration` (Macaulay) is not mentioned at all — only `calculateMDuration` appears
- Fractional first coupon period not specified: `w = DSC/E` where DSC = days settlement→next coupon, E = length of coupon period in days
- Convention not stated: Actual/Actual day count, semi-annual frequency, must match Google Sheets `DURATION`/`MDURATION`
- Cash flow structure not stated: `semiCoupon = coupon/2 × 1000`; final CF adds 1000 principal
- Macaulay formula not stated: `Σ(t_j × PV_j) / Σ(PV_j) / 2` where `t_j = w+j`
- Modified formula not stated: `Macaulay / (1 + yld/2)`
- Guard conditions not stated: returns `null` if `settlement >= maturity` or `yld ≤ −2`; **negative yields between −2 and 0 are valid** (non-obvious — would be lost without the spec)

---

## Item 2 — Critical: `knowledge/TIPS_Basics.md` — duration not defined in foundational spec

`TIPS_Basics.md` documents yield conventions, index ratio, cost, P+I. Duration is not defined anywhere in any foundational spec file. The conceptual definition of Macaulay Duration and Modified Duration — what they measure, the day-count convention, the frequency — belongs here and should be the target that 4.0 references.

---

## Item 3 — Significant: `TipsReference/knowledge/1.0_TIPS_Reference.md` — Term, Mac Duration, Mod Duration columns not documented

Spec still shows 9 columns (through Yield). Columns 10–12 (Term y, Mac Duration, Mod Duration) belong in the app and must be added to the spec, including:
- Term = (maturityDate − settlementDate) / (365.25 × 86400000)
- Mac Duration: Macaulay duration in years using the fractional-period algorithm
- Mod Duration: Mac / (1 + yld/2)
- Note that TipsReference uses an **inline ES5 copy** of the algorithm (no module import) — the spec must state that copy must match `shared/src/bond-math.js` exactly

---

## Item 4 — Minor: `4.0_Computation_Modules.md` §WAD — `qtyAfter` ambiguous for bracket rows

WAD formula says `rebalance: qtyAfter`. For bracket rows, spec should clarify this means `fyQty + excessQtyAfter` (total holding after rebalance), matching the build-lib formula of `fundedYearQty + excessQty`.

---

## What Is Already Correct (no action needed)

- `6.0_UI_Layout.md` — `#wad-display` and Row 2 layout documented ✓
- `4.0_Computation_Modules.md` — Weighted Modified Duration section (formula, display, implementation note) ✓
- Module dependency graph in 4.0 — accurate ✓

---

## Suggested Order of Execution

1. Item 1 — algorithm definition (everything else references it)
2. Item 2 — foundational spec
3. Item 3 — TipsReference columns
4. Item 4 — minor WAD clarification
