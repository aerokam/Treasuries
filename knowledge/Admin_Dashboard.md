# 0.1 Admin Dashboard

**Implemented by:** `Dashboard/server.js`, `Dashboard/index.html`, `Dashboard/jobs.json`, `Dashboard/start.cmd`, `scripts/run-dashboard.cmd`

## Purpose

A local monitoring and control panel for the data pipelines of the portal, for the one developer. A single page, served by a local Express server at `http://localhost:3737`.

---

## Pipeline Rows

Each app has a card, and each card has one row for each data pipeline, a chain from a job to an R2 file to the feature of the app that reads it:

```
[Job/Source]  →  [R2 file]  →  [UI feature]
```

A row shows:
- **What the data is**, in the vocabulary of the app (for example "FedInvest daily prices"), not a job or script name.
- **Which feature it feeds**, so that a stale file means something concrete.
- **How fresh it is**: the age of the R2 file, from the `Last-Modified` header of a `HEAD` request.
- **How to refresh it**: a Run button for each local job registered for the row.
- **Who else uses it**: an "also used by" badge when the same R2 key appears in the pipelines of more than one app.

---

## Server (`Dashboard/server.js`)

- Node.js with Express, on port `3737` (the `PORT` environment variable overrides it). `npm run dashboard` from the repo root starts it.
- Routes:
  - `GET /`: `Dashboard/index.html`.
  - `GET /api/health`: `{ ok: true }`.
  - `GET /api/jobs`: the registry in `Dashboard/jobs.json`.
  - `GET /api/status`: the status of every app card ([Status Response](#status-response)).
  - `GET /api/preview?source=r2&key=<key>&lines=<n>`: the first `n` lines of an R2 file (`n` from 1 to 200, 12 by default) as `{ lines[], total }`, with each line cut at 500 characters so that a single-line JSON file stays previewable.
  - `GET /api/run/:jobId`: runs the `cmd` of the job with `shell: true` in its `cwd` and streams `{ type, text }` events over SSE (`start`, `out`, `err`, `exit`). The child process is killed when the client disconnects. The time and exit code of the last run of each job are kept in memory.
- `Dashboard/start.cmd` opens `http://localhost:3737` in the browser and starts the server. It does not check whether the server is already running, and a second start fails with `EADDRINUSE`.
- `scripts/run-dashboard.cmd` starts the server hidden and opens no browser, only when nothing is listening on port 3737. The scheduled task `DashboardServer` ([Data_Pipeline.md](./Data_Pipeline.md); registered by `scripts/setup-windows-tasks.ps1`) runs it at 6:00am PT on weekdays and every 30 minutes for the following 18 hours, so a crash during the day is recovered. The log is `logs/dashboard.log`.

### Portal link

`index.html` of the portal shows "Dashboard Monitor →" in the Mission box only when it can fetch `local-admin.json`, a gitignored file that holds `{ "dashboardUrl": "http://localhost:3737/" }`. GitHub Pages never receives that file, so the link stays hidden there. A `no-cors` probe of `/api/status` labels the link "Dashboard Monitor (start server) →" when the server is down.

### Frontend (`Dashboard/index.html`)

Vanilla JavaScript with no build step. It loads `/api/status` on open and every 60 seconds.

---

## App Pipelines

`APP_CONFIGS` in `Dashboard/server.js` defines them. A job column names the job IDs of `jobs.json`.

### YieldCurves

| Pipeline | R2 key | Job IDs | Feeds | Stale after |
|---|---|---|---|---|
| FedInvest daily prices | `Treasuries/YieldsFromFedInvestPrices.csv` | `fedinvest-download` | All yield curves | 24 h |
| Broker quotes — Treasury + TIPS | `Treasuries/MarketQuotes.csv` | `quotes-download`, `upload-quotes` | Market tab (nominals + TIPS) | 24 h |
| CPI seasonal adjustment factors | `TIPS/RefCpiNsaSa.csv` | `update-ref-cpi-nsa-sa` | CPI overlay | 720 h |
| SIFMA bond market holidays | `misc/BondHolidaysSifma.csv` | none | Business-day calculations | 8,760 h |

### YieldsMonitor

| Pipeline | R2 key | Job IDs | Feeds | Stale after |
|---|---|---|---|---|
| Daily yields-history snapshots | `Treasuries/yields-history/history.json` | `update-yields-history` | History charts, 14 symbols | 24 h |
| Live Treasury yields | none (the browser reads the feed on page load) | none | Live yield display and intraday charts | none |
| Feed inspector (diagnostic) | none | `inspect-feeds` | An annotated snapshot of every feed, on demand ([Close Price Investigation](../YieldsMonitor/knowledge/Close_Price_Investigation.md)) | none |

### TipsLadderManager

| Pipeline | R2 key | Job IDs | Feeds | Stale after |
|---|---|---|---|---|
| FedInvest daily prices | `Treasuries/YieldsFromFedInvestPrices.csv` | `fedinvest-download` | Ladder pricing, all TIPS | 24 h |
| TIPS reference metadata | `TIPS/TipsRef.csv` | `fetch-tips-ref` | Coupon and dated-date lookups | 720 h |
| Reference CPI index | `TIPS/RefCPI.csv` | `fetch-ref-cpi` | Index ratio calculations | 720 h |

### TreasuryAuctions

| Pipeline | R2 key | Job IDs | Feeds | Stale after |
|---|---|---|---|---|
| Historical auction results | `Treasuries/Auctions.csv` | `get-auctions` | All, Bills, Notes/Bonds, TIPS tabs | 12 h |
| Upcoming auctions | none (the browser reads FiscalData on page load) | none | Calendar view | none |

An R2 key that appears under two apps carries the "also used by" badge: `YieldsFromFedInvestPrices.csv` appears under YieldCurves and TipsLadderManager.

---

## Staleness

A file is stale when its age in hours exceeds its threshold. A pipeline marked `weekdayOnly` (the FedInvest, broker quote, CPI seasonal and holiday files and the yields history) adds 24 hours for each Saturday and Sunday that has begun since the file was last modified. The card border is green when every file is within its threshold, amber when any file is stale and red when a `HEAD` request for any file fails.

---

## Status Response

```js
{
  fetchedAt: string,
  apps: [{
    id, label, description, url,
    overallStatus: 'fresh' | 'stale' | 'error',
    pipelines: [{
      id, label, feeds,
      r2Key: string | null,
      r2: { key, lastModified, status, shortName } | null,
      localJobs: [{ id, label, cmd, nextRunAt?, lastRunAt?, lastExitCode? }],
      alsoUsedBy: string[],
      stalenessHours: number | null,
      weekdayOnly: boolean,
      liveNote: string | null,
      r2Note: string | null,
    }]
  }]
}
```

One `HEAD` request is made for each distinct R2 key in a status request.

`Dashboard/jobs.json` is the registry of local scripts, with the fields `id`, `label`, `cmd`, `cwd`, `apps` and, optionally, `windowsTaskNames`. For a job that has `windowsTaskNames`, the server queries each task with `schtasks /query /fo csv /nh /tn "<name>"`, reads the "Next Run Time" column as a date, drops a task that is not found, reports `N/A` or `Disabled` or whose next run has passed, and returns the earliest remaining time as `nextRunAt`, or `null` when none remains. One `schtasks` call is made for each task name.

---

## Not Matched

- The pipelines name the job IDs `update-ref-cpi-nsa-sa`, `fetch-tips-ref`, `fetch-ref-cpi` and `get-auctions`, and `jobs.json` registers none of them (it registers `update-ref-cpi` for the Ref CPI NSA and SA update). The rows of those pipelines therefore show no Run button.
- `jobs.json` registers `bond-holidays-update` and `update-tentative-schedule`, and no pipeline lists either.
- The cards cover four apps and 10 of the data stores. The Tentative auction schedule, SA and SAO yields, Fund holdings, GSW curve parameters and the other stores that process 1 writes have no row.
- The server runs locally only, because the jobs need local script execution.
