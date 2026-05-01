# R2 Bucket Cleanup Audit

Audit run 2026-04-30. Single R2 bucket contains 55 objects across `Treasuries/`, `TIPS/`, `bls/`, `misc/`, `schwab/` prefixes.

**Background:** Gradual migration from `TIPS/` → `Treasuries/` prefix left many scripts writing to both locations; only one location is read. Cleanup was deferred until a full audit could be done.

**Next step:** Resolve the four "clarify" items, then generate a cleanup script to delete orphans and patch upload scripts to stop writing to dead keys.

---

## Confirmed Orphans — Delete + Stop Writing

These are **actively written by scripts** on every pipeline run but **never read by any app or script**:

| R2 Key | Written by | Reason orphan |
|--------|-----------|---------------|
| `Treasuries/RefCPI.csv` | `scripts/fetchRefCpi.js` | All readers use `TIPS/RefCPI.csv`; `Treasuries/` copy is never fetched |
| `TIPS/Auctions.csv` | `scripts/getAuctions.js` | TreasuryAuctions reads `Treasuries/Auctions.csv` |
| `TIPS/YieldsFromFedInvestPrices.csv` | `scripts/getYieldsFedInvest.js` | All apps read `Treasuries/` prefix |
| `TIPS/yield-history/US10Y_history.json` (×14 symbols) | `YieldsMonitor/scripts/snapHistory.js` line 170 | YieldsMonitor reads `Treasuries/yield-history/`; snapHistory writes to both via `r2KeyOld` variable |
| `TIPS/RefCpiNsaSa.csv` | (migration artifact, no current writer) | Apps read `Treasuries/RefCpiNsaSa.csv`; stale since 2026-03-20 |
| `TIPS/YieldsSaSao.csv` | `YieldCurves/scripts/updateSaSaoYields.js` | Browser recalculates SAO client-side; this file is never fetched from R2 |

That's **20 objects** (6 named keys + 14 yield-history files).

### Script patches needed to stop orphan writes:
- `scripts/fetchRefCpi.js`: remove `uploadToR2('Treasuries/RefCPI.csv', ...)` line
- `scripts/getAuctions.js`: remove `uploadToR2('TIPS/Auctions.csv', ...)` line
- `scripts/getYieldsFedInvest.js`: remove `uploadToR2('TIPS/YieldsFromFedInvestPrices.csv', ...)` line
- `YieldsMonitor/scripts/snapHistory.js`: remove `await uploadToR2(r2KeyOld, history)` (line 170) and the `r2KeyOld` variable
- `YieldCurves/scripts/updateSaSaoYields.js`: remove `uploadToR2('TIPS/YieldsSaSao.csv', ...)` lines

---

## Legacy Files — Likely Delete (Confirm)

Not written by any current script; appear to be pre-rename/pre-migration artifacts:

| R2 Key | Last Updated | Notes |
|--------|-------------|-------|
| `TIPS/Yields.csv` | 2026-04-03 | Old name for YieldsFromFedInvestPrices; no script writes to this key |
| `TIPS/TipsYields.csv` | 2026-03-24 | No script reads or writes this |
| `Treasuries/TipsYields.csv` | 2026-03-25 | No script reads or writes this |

---

## Clarify Before Deciding

| R2 Key | Last Updated | Question |
|--------|-------------|----------|
| `misc/TIPS_SAO.csv` | 2026-04-01 | No code references this anywhere. Manual upload? |
| `schwab/SchwabHoldings-SCHP.csv` | 2026-04-30 | Written by `ScrapeSchwabHoldings` project (separate from Treasuries). Does anything consume it? |
| `misc/BondMarketHolidays.csv` | 2025-12-24 | Only referenced in Bogleheads posts (IMPORTDATA formula). Still needed for that spreadsheet? |
| `bls/CpiReleaseSchedule2024.csv` | 2025-12-29 | Year is over; `checkCpiReleaseDate.js` probes current+next year. Safe to delete? |

---

## Confirmed Active — Keep

| Prefix | Files |
|--------|-------|
| `TIPS/` | `RefCPI.csv`, `TipsRef.csv`, `tentative_tips.json`, `Tentative-Auction-Schedule.xml` |
| `Treasuries/` | `YieldsFromFedInvestPrices.csv`, `TipsRef.csv`, `Auctions.csv`, `FidelityTips.csv`, `FidelityTreasuries.csv`, `RefCpiNsaSa.csv`, `yield-history/*.json` (14 files) |
| `bls/` | `CPI.csv`, `CPI_history.csv`, `CpiReleaseSchedule2025.csv`, `CpiReleaseSchedule2026.csv` |
| `misc/` | `BondHolidaysSifma.csv` |

### Key cross-dependencies to preserve:
- `TIPS/TipsRef.csv` is used as **script input** by `scripts/getYieldsFedInvest.js` (line 263) — not a browser app, but still a live dependency. Do not delete.
- `Treasuries/TipsRef.csv` is used by the **TipsLadderManager browser app**. Both copies are needed.
- `TIPS/RefCPI.csv` is used by **TipsLadderManager** (`src/data.js` line 65) and **CpiExplorer** (`src/data.js` line 6). Keep.
