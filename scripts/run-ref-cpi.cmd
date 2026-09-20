@echo off
REM scripts/run-ref-cpi.cmd
REM Fetches the latest daily interpolated Ref CPI from TreasuryDirect and appends any new
REM dates onto the existing TIPS/RefCPI.csv in R2 (full history, 1997-01-15 to present --
REM see scripts/fetchRefCpi.js). Triggered by its own Task Scheduler task (RefCpi) at
REM 9:30am ET on BLS CPI release dates (scripts/setup-windows-tasks.ps1) — independent of
REM the CpiHistory task's own trigger.

set REPO=C:\Users\aerok\projects\Treasuries
set LOG=%REPO%\logs\ref-cpi.log
set NODE="C:\Program Files\nodejs\node.exe"

if not exist "%REPO%\logs" mkdir "%REPO%\logs"

echo [%DATE% %TIME%] Fetching Ref CPI... >> "%LOG%"
%NODE% "%REPO%\scripts\fetchRefCpi.js" --append >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%
echo [%DATE% %TIME%] Exited with code %RC% >> "%LOG%"
echo. >> "%LOG%"
exit /b %RC%
