# Treasury Investors Portal Monorepo

This repository contains multiple projects for Treasury Inflation-Protected Securities (TIPS) analysis and planning.

## Directory Structure
- `shared/`: Core domain logic and documentation used across all projects.
  - `knowledge/`: Fundamental TIPS and Bond concepts (1.0, 2.1).
  - `src/`: Core financial math (e.g., `bond-math.js`).
- `TipsLadderManager/`: The browser-based tool for designing and rebalancing TIPS ladders.
- `YieldCurves/`: (New) TIPS Seasonal Adjustments project.
- `YieldsMonitor/`: (New) Tool for monitoring real-time and historical Treasury yields.
- `TreasuryAuctions/`: (New) Tool for monitoring Treasury auction results.

## Development Workflow
- **Shared Logic**: Always prioritize logic in `shared/src/` if it is applicable to more than one project.
- **Serving the UI**: To run the `TipsLadderManager` or any other web-based tool, run `npx serve .` from this **root directory**. This ensures that relative imports from `shared/` resolve correctly in the browser.
- **Testing**: Run `npm test` from the root to execute tests across all workspaces.

## Project Vision
To provide a suite of transparent, first-principles tools for managing inflation-protected wealth, ensuring all calculations are traceable and educational.

## Win32 PowerShell Command Standards (MANDATORY)
This environment has restricted script execution. Follow these rules for ALL terminal commands:

1. **NO `npm` for scripts**: Use `node` directly. Instead of `npm test`, run `node tests/run.js`.
2. **Separator**: Use `;` (semicolon) instead of `&&`. Example: `cd dir; node script.js`.
3. **E2E Testing**: To run Playwright tests, use `Start-Process bash -ArgumentList "-c", "'(cd /c/Users/aerok/projects/Treasuries/TipsLadderManager && npm run test:e2e -- --max-failures=1 2>&1)'" -Wait -NoNewWindow`. This ensures PowerShell does not misinterpret the Bash operators.
4. **STOP ON FAIL (MANDATORY)**: If any test fails, stop immediately. Do not proceed with other tasks until the failure is diagnosed and fixed.
5. **Shell**: All commands are executed via `powershell.exe -NoProfile -Command`.

### Command Cheat Sheet
| Task | Command | Directory |
| :--- | :--- | :--- |
| **Regression Tests** | `node tests/run.js` | `TipsLadderManager/` |
| **E2E Tests** | `Start-Process bash -ArgumentList "-c", "'(cd /c/Users/aerok/projects/Treasuries/TipsLadderManager && npm run test:e2e -- --max-failures=1 2>&1)'" -Wait -NoNewWindow` | Root |
| **Serve UI** | `node .\node_modules\serve\bin\serve.js . -p 8080` | Root |
| **Update Data** | `node scripts/getYieldsFedInvest.js` | Root |

## Technical Standards and Context

- `YieldCurves/`: (New) TIPS Seasonal Adjustments project.
- **Local Testing**:
  - TipsLadderManager: `http://localhost:8080/TipsLadderManager/`
  - YieldCurves: `http://localhost:8080/YieldCurves/`
  - YieldsMonitor: `http://localhost:8080/YieldsMonitor/`
  - TreasuryAuctions: `http://localhost:8080/TreasuryAuctions/`
- **Production (GitHub Pages)**:
  - Portal: `https://aerokam.github.io/Treasuries/`
  - TipsLadderManager: `https://aerokam.github.io/Treasuries/TipsLadderManager/`
  - YieldCurves: `https://aerokam.github.io/Treasuries/YieldCurves/`
  - YieldsMonitor: `https://aerokam.github.io/Treasuries/YieldsMonitor/`
  - TreasuryAuctions: `https://aerokam.github.io/Treasuries/TreasuryAuctions/`
- **E2E Tests**: Configured for port 8080 at `127.0.0.1`.
- **Shell (Win32)**: Use `;` instead of `&&` as a command separator in PowerShell.
- **Git Workflow**: All changes should be automatically committed and pushed after implementation.

### TipsLadderManager Logic
- **Rebalance Mode**: The DARA field MUST be cleared when the RefCPI date changes if the DARA was auto-inferred (prevents duration-mismatch and large negative net cash).
- **Tolerance**: E2E tests use a $3,000 net cash tolerance ($1,000 for fresh inferences) to account for integer lot discretization.

### Yields (Seasonal Adjustments) Logic
- **Data Source**: Data is pulled from the R2 bucket (FedInvest prices/RefCPI).
- **Yield Formulas**: 
  - `SA Yield = Price * (S_settle / S_maturity)`
  - `SAO Yield = Backwards-anchored trend fitting (right-to-left) using linear regression on a sliding window.`
- **Broker CSVs**: Use T+1 settlement and first-row-per-CUSIP for Ask prices.
- **UI/Charts**: Uses Chart.js + Hammer.js + chartjs-plugin-zoom.
- **Refinements**: 
  - Apr 2026 yield is fixed to be lower than Jul 2026.
  - 2027 maturities follow the smooth SA trend (reduced overcorrection).
  - Y-MIN is in the prominent toolbar.
  - Interaction: Full X/Y zoom and Ctrl-click-drag for vertical panning.
  - Visual Emphasis: SAO > SA > Ask.
- **Resolved Issues**: The zoom bug (hidden datasets in Y-axis range) is resolved by checking `chart.isDatasetVisible`.

