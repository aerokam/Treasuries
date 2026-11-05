@echo off
REM scripts/run-ref-cpi.cmd
REM Fetches the latest daily interpolated Ref CPI from TreasuryDirect and appends any new
REM dates onto the existing TIPS/RefCPI.csv in R2 (full history, 1997-01-15 to present --
REM see scripts/fetchRefCpi.js). Triggered by its own Task Scheduler task (RefCpi) at
REM 9:30am ET on each Release Date of CPI release schedule (S19) (scripts/setup-windows-tasks.ps1);
REM the run is skipped unless today is a Release Date, checked below, so a trigger left on a date BLS moved does nothing. Independent of the CpiHistory task.

set REPO=C:\Users\aerok\projects\Treasuries
set LOG=%REPO%\logs\ref-cpi.log
set NODE="C:\Program Files\nodejs\node.exe"

if not exist "%REPO%\logs" mkdir "%REPO%\logs"

echo [%DATE% %TIME%] Checking CPI release schedule... >> "%LOG%"
%NODE% "%REPO%\scripts\checkCpiReleaseDate.js" >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%
if %RC% equ 1 (
  echo [%DATE% %TIME%] Not a release day — skipping. >> "%LOG%"
  echo. >> "%LOG%"
  exit /b 0
)
if %RC% neq 0 (
  echo [%DATE% %TIME%] CPI release schedule not readable, exit code %RC%. >> "%LOG%"
  echo. >> "%LOG%"
  exit /b %RC%
)

echo [%DATE% %TIME%] Release day confirmed — fetching Ref CPI... >> "%LOG%"
%NODE% "%REPO%\scripts\fetchRefCpi.js" --append >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%
echo [%DATE% %TIME%] Exited with code %RC% >> "%LOG%"
echo. >> "%LOG%"
exit /b %RC%
