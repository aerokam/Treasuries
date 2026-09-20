# Data Pipeline

Project-wide data acquisition architecture. This document tracks the sources, schedules, and ownership (GitHub vs. Local) of all ingestion jobs.

---

## 1.0 External Data Sources

All data enters the system from these external entities. Click the **Drill-down Schema** to see exactly which fields are provided by each source.

| ID | Source | Data Provided | Method | Drill-down Schema |
|---|---|---|---|---|
| **E1** | **FedInvest** | Daily price list (Buy, Sell, End of Day) | Automated Scrape | [E1 Schema](./DATA_DICTIONARY.md#e1) |
| **E2** | **TreasuryDirect** | Daily interpolated RefCPI | REST API | [E2 Schema](./DATA_DICTIONARY.md#e2) |
| **E3** | **FiscalData** | Auction results & TIPS metadata | REST API | [E3 Schema](./DATA_DICTIONARY.md#e3) |
| **E4** | **BLS** | Monthly CPI-U (NSA/SA) factors | REST API | [E4 Schema](./DATA_DICTIONARY.md#e4) |
| **E5** | **CNBC** | Real-time market yields | GraphQL | [E5 Schema](./DATA_DICTIONARY.md#e5) |
| **E6** | **Fidelity** | Broker ask/bid quotes | Automated Download | [E6 Schema](./DATA_DICTIONARY.md#e6) |
| **E7** | **Vanguard Advisors** | Fund holdings, expense ratio, 30-Day SEC yield | REST API | [E7 Schema](./DATA_DICTIONARY.md#e7) |
| **E8** | **fminvest.com** | Fund holdings, expense ratio, 30-Day SEC yield | REST API + page scrape | [E8 Schema](./DATA_DICTIONARY.md#e8) |
| **E9** | **PIMCO** | Fund holdings, expense ratio, 30-Day SEC yield | REST API (xlsx export) | [E9 Schema](./DATA_DICTIONARY.md#e9) |
| **E10** | **Schwab Asset Management** | Fund holdings, expense ratio, 30-Day SEC yield | Headless-browser CSV download | [E10 Schema](./DATA_DICTIONARY.md#e10) |
| **E11** | **BondBloxx** | Fund holdings, expense ratio, 30-Day SEC yield | Product-page scrape | [E11 Schema](./DATA_DICTIONARY.md#e11) |
| **E12** | **BlackRock iShares** | Fund holdings, expense ratio, 30-Day SEC yield | REST API (CSV) + page scrape | [E12 Schema](./DATA_DICTIONARY.md#e12) |

---

## 2.0 Ingestion Jobs (Ownership & Schedule)

All ingestion jobs have been migrated to **Local Windows Scheduled Tasks** to ensure precision and reliability.

### [LOCAL] Local Scheduled Tasks (Windows)
These jobs run on the host machine via Windows Task Scheduler.

| Task Name | Schedule | Script | Primary Output |
|---|---|---|---|
| **FedInvest Download** | Weekdays 1:05pm ET, retries every 10 min up to 2h if not yet posted | `scripts/getYieldsFedInvest.js` (via `YieldCurves/scripts/run-fedinvest.cmd`) | `YieldsFromFedInvestPrices.csv` |
| **Fidelity Quotes** | 3× Daily | *(Windows Task)* | `FidelityTreasuriesTips.csv` (combined Treasury + TIPS) |
| **TreasuryAuctions** | Weekdays 8:35/10:05am PT | `scripts/getAuctions.js` | `Auctions.csv` |
| **TIPS Ref Refresh** | Mondays 7am PT | `scripts/fetchTipsRef.js` | `TipsRef.csv` |
| **Update Yields History** | Weekdays 2:00pm PT | `YieldsMonitor/scripts/updateYieldsHistory.js` | `yields-history/history.json` ([S6](./DataStores.md#s6)) |
| **Archive Intraday Yields** | Weekdays 2:05pm PT | `YieldsMonitor/scripts/archiveIntraday.js` | `yields-history/intraday-raw/{symbol}/{date}.json` ([S18](./DataStores.md#s18)) |
| **Close Probe** | Weekdays 2:05pm PT, +15min ×1h | `YieldsMonitor/scripts/probeClose.js` | `yields-history/close-probe/{symbol}.csv` — diagnostic only, not read by the app; see [Close Price Investigation](../YieldsMonitor/knowledge/Close_Price_Investigation.md) |
| **Lock Probe** | Hourly, 2:00pm–5:00am PT | `YieldsMonitor/scripts/probeLock.js` | `yields-history/lock-probe/lock-probe.csv` — diagnostic only, not read by the app; see [Close Price Investigation §7](../YieldsMonitor/knowledge/Close_Price_Investigation.md#7-investigation-tooling-all-read-only--additive) |
| **Check CNBC Rollover** | Daily | `YieldsMonitor/scripts/checkCnbcRollover.js` | Commits and pushes `YieldsMonitor/src/cnbc-rollover-log.js` and the pinned-dates table in [2.4 Adjust for seasonality](../YieldsMonitor/knowledge/2.4_Adjust_For_Seasonality.md) — a code/spec commit, not an R2 write |
| **SA Factor Update** | Daily 6:35am | `YieldCurves/scripts/updateRefCpi.js` | `RefCpiNsaSa.csv` |
| **FundHoldings** | Daily 6:40am PT | `FundHoldings/updateAllHoldings.js`, then `FundHoldings/enrichHoldings.js` | `FundHoldings/Holdings-<TICKER>(-Enriched).csv` and `FundHoldings/FundMeta.json` ([S11](./DataStores.md#s11)) |
| **GSW TIPS Curve** | Daily 7:15am PT | `YieldCurves/scripts/updateGswTipsCurve.js` | `TIPS/GswTipsCurve.json` (GSW Svensson params — [S12](./DataStores.md#s12)) |
| **Yield Curves** | Chained after BOTH inputs it depends on: `FidelityQuotes` (3x daily on weekdays, via `run-fidelity.cmd`) and `YieldsFromFedInvestPrices` (1x daily on weekdays, via `run-fedinvest.cmd`), each calling `run-yield-curves.cmd` on success. No standalone trigger. | `YieldCurves/scripts/updateSpotYieldCurves.js` (via `YieldCurves/scripts/run-yield-curves.cmd`) | `Treasuries/YieldCurves.csv` ([S13](./DataStores.md#s13)), `Treasuries/BreakevenInflation.csv` ([S14](./DataStores.md#s14)), `Treasuries/BidAskSpreads.csv` ([S15](./DataStores.md#s15)) |
| **CPI History Refresh** | 8:35 AM ET on each BLS release date | `scripts/fetchCpiHistory.js` (`run-cpi-history.cmd`) | `bls/CPI_history.csv` |
| **Ref CPI Refresh** | 9:30 AM ET on each BLS release date, retries every 30 min up to 6h if TreasuryDirect hasn't caught up | `scripts/fetchRefCpi.js --append` (`run-ref-cpi.cmd`) — merges new dates into the existing full-history file rather than rebuilding it; see [DataStores.md](./DataStores.md#s3) | `TIPS/RefCPI.csv` |

**CPI release date triggers:** the `CpiHistory` and `RefCpi` tasks each use date-specific `Once` triggers (not a daily poll) on the same release dates, at 8:35 AM ET and 9:30 AM ET respectively. Triggers are set by `scripts/setup-windows-tasks.ps1`, the single script that registers every local task (see also rows above) — it reads `bls/CpiReleaseSchedule{year}.csv` from R2 and registers one trigger per release date per task. The two tasks run independently rather than chained: `RefCpi` pulls from TreasuryDirect, a source separate from BLS that lags the BLS release by an unknown amount, and giving it its own trigger and retry settings (rather than chaining it inside `run-cpi-history.cmd`) avoids depending on Windows Task Scheduler restarting a wrapping task on a chained step's non-zero exit, which proved unreliable (`RefCPI.csv` sat stale for a week in September 2026 after a chained run's retry never fired). `fetchRefCpi.js --write` checks the freshly-fetched data against the coverage implied by the latest BLS month in `CPI_history.csv` (last day of month+2) and exits non-zero if TreasuryDirect hasn't caught up yet; the `RefCpi` task retries every 30 minutes, up to 12 times (6 hours), on failure. A `CpiTasks` task runs Dec 29 each year to reload the next year's schedule and self-reschedule. Re-run `scripts/setup-windows-tasks.ps1` manually if the schedule changes.

---

## 3.0 R2 Data Store
All jobs above upload their results to the central Cloudflare R2 bucket (`pub-ba11062b177640459f72e0a88d0261ae.r2.dev`).
- **Reference**: See [DataStores.md](./DataStores.md) for the full file manifest and live previews.

### 3.1 Browser Read Access (CORS)
Every app (TipsLadderManager, YieldCurves, Primer, YieldsMonitor, CpiExplorer, FundHoldings, TreasuryAuctions, SeasonalAdjustments, TipsReference, etc.) reads from this one bucket via browser `fetch()`. R2 buckets ship with **no CORS policy by default** — a bucket with no policy configured rejects all cross-origin browser reads regardless of origin (confirmed live May 9, 2026, commit `55f67f4`: "R2 bucket lacks CORS headers, making it inaccessible from browser").

Sometime after that, the bucket's CORS policy was configured manually in the Cloudflare dashboard (no wrangler/IaC file in this repo manages it) with a literal 3-origin allowlist — not a wildcard, not a pattern:
- `http://localhost:8080` — local dev, main branch
- `http://localhost:8081` — local dev, worktree branch
- `https://aerokam.github.io` — production (GitHub Pages)

Verified live 2026-08-03 by sending various `Origin` headers and checking for an echoed `Access-Control-Allow-Origin` response header. Any other origin is rejected, including `http://127.0.0.1:8080` (a distinct origin from `localhost:8080` even on the same port) and any other localhost port.

**Practical effect**: run the main-branch dev server on `localhost:8080` and a worktree dev server on `localhost:8081` (always `localhost`, never `127.0.0.1`) — both already have live R2 access. A third concurrent local server needs its origin added to the bucket's CORS policy first (Cloudflare dashboard → R2 → bucket → Settings → CORS Policy), or its R2 fetches will silently fail.
