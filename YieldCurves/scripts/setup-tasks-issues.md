# setup-tasks.ps1 — Outstanding Issues

Ran `setup-tasks.ps1` on 2026-05-01. 8/10 tasks registered OK. Two failures:

## 1. "Update CPI release schedule" — Access Denied
Requires `RunLevel Highest` (elevated). Fails unless run from an admin PowerShell prompt.
Not a code bug — just needs elevation. Either rerun the script as admin, or confirm this task was already registered correctly on this machine from a prior elevated run.

## 2. CPI tasks missing — wrong script path
`setup-tasks.ps1` line 129 calls:
```
& "$REPO\scripts\setup-cpi-release-tasks.ps1"
```
But `$REPO` = `C:\Users\aerok\projects\Treasuries`, so it looks for the file at:
```
C:\Users\aerok\projects\Treasuries\scripts\setup-cpi-release-tasks.ps1
```
That file was not found. Investigate:
- Does `setup-cpi-release-tasks.ps1` exist anywhere in the repo?
- If it's in `YieldCurves\scripts\`, fix the path in `setup-tasks.ps1` to use `"$REPO\YieldCurves\scripts\setup-cpi-release-tasks.ps1"`
- If it's missing entirely, check `.gitignore` or whether it was never committed
