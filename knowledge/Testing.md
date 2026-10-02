# Testing

The automated test suites for every app in this repository: their names, where their files live, and which of them run before a push. What a TipsLadderManager test may assume while checking the app is settled separately, in [TipsLadderManager/TESTING.md](../TipsLadderManager/TESTING.md).

---

## 1.0 Suites

A suite is a script in the root `package.json`, named `test:<kind>:<App>`, and run from the repository root with `npm run <name>`. There are two kinds:

- **Unit**: calls an app's code directly in Node, with no browser.
- **UI**: loads the app in a headless browser from the local server on port 8080 and checks what the page shows.

| Suite | Covers | Files |
|---|---|---|
| `test:Unit:TipsLadderManager` | TipsLadderManager calculations | `TipsLadderManager/tests/run.js` |
| `test:UI:TipsLadderManager` | TipsLadderManager | `TipsLadderManager/tests/UI/` |
| `test:UI:TipsLadderManager:SampleHoldings` | The TipsLadderManager UI tests tagged `@SampleHoldings` (§3.0) | `TipsLadderManager/tests/UI/` |
| `test:UI:YieldCurves` | YieldCurves | `YieldCurves/tests/UI/` |
| `test:UI:TreasuryAuctions` | TreasuryAuctions | `TreasuryAuctions/tests/UI/` |
| `test:Unit:YieldsMonitor` | YieldsMonitor history dating and Custom range | `YieldsMonitor/tests/*.test.js` |
| `test:UI:YieldsMonitor` | YieldsMonitor | `YieldsMonitor/tests/UI/` |
| `test:UI:KnowledgeMap` | The Knowledge Map diagrams and `viewer.html` | `knowledge/tests/UI/` |
| `test:Unit:Shared` | `shared/src/`, the modules every app imports | `shared/tests/*.test.js` |

Arguments after `--` reach the test runner, for example `npm run test:UI:YieldCurves -- --headed`.

The other apps have no suite. A suite is added for an app when that app is next changed and the change calls for one.

---

## 2.0 Configuration

- TipsLadderManager and YieldCurves each have their own `playwright.config.js`, which their `test:UI` suites name with `-c`.
- TreasuryAuctions, YieldsMonitor and KnowledgeMap are projects in the root `playwright.config.js`, one project per app.
- UI suites load pages from `localhost:8080`, never `127.0.0.1:8080`. Only `localhost:8080` is on the R2 CORS allowlist ([Data_Pipeline.md §3.1](./Data_Pipeline.md)), so from `127.0.0.1` every R2 read a test does not mock fails.
- A test of a module in `shared/src/` belongs in `shared/tests/`, not in the suite of an app that imports the module, so that it runs whenever the module changes.

---

## 3.0 Selection Before a Push

`.githooks/pre-push` runs `scripts/pre-push-tests.js`, which selects suites from the files the push changes:

| Changed file | Suites run |
|---|---|
| Only `TipsLadderManager/data/SampleHoldings.csv` and/or `SampleDaraPlan.csv` | `test:Unit:TipsLadderManager` and `test:UI:TipsLadderManager:SampleHoldings`: the UI tests tagged `@SampleHoldings`, whose results depend on what the sample account holds |
| A file in an app's directory | That app's suites |
| `shared/src/<file>` | `test:Unit:Shared`, plus the suites of every app whose code imports that file, directly or through another file in `shared/src/` |
| A file in `shared/tests/` | `test:Unit:Shared` |
| `package.json`, `playwright.config.js`, `scripts/pre-push-tests.js` or `.githooks/pre-push` | Every suite |
| Anything else | None |

- The importing apps are read from the import statements at push time.
- A push with no prior remote state to compare against, such as the first push of a new branch, runs every suite.
- A failing suite blocks the push. A suite that fails by a browser crash or a timeout runs once more first; an assertion failure does not.
- `git push --no-verify` is the only way past a failure.

`git diff --name-only origin/main | node scripts/pre-push-tests.js --files --list` prints the suites a set of changes would run, without running them.

---

## 4.0 Holdings Fixture Refresh

A Schwab positions download or a Kevin IRA DARA plan download (`dara-plan-kevin-rmd.csv`) rebuilds `TipsLadderManager/data/SampleHoldings.csv` and `SampleDaraPlan.csv` from the real account at a scale factor of 0.5, commits them, and pushes that commit alone. Other unpushed commits on `main` are not pushed with it. The import steps are specified in `projects/Local/SPEC.md`; the files they write, in [TipsLadderManager/TESTING.md §Process](../TipsLadderManager/TESTING.md). A Fidelity positions download writes the Google Sheet only.
