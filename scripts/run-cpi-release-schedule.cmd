@echo off
REM scripts/run-cpi-release-schedule.cmd
REM Replaces bls/CpiReleaseSchedule.csv in R2 (CPI release schedule, S19) from the BLS release
REM table, then sets the triggers of the CpiHistory and RefCpiCheck tasks to its Release Dates.
REM Triggered weekly by the CpiReleaseSchedule task (scripts/setup-windows-tasks.ps1).

set REPO=C:\Users\aerok\projects\Treasuries
set LOG=%REPO%\logs\cpi-release-schedule.log
set NODE="C:\Program Files\nodejs\node.exe"

if not exist "%REPO%\logs" mkdir "%REPO%\logs"

echo [%DATE% %TIME%] Fetching CPI release schedule... >> "%LOG%"
%NODE% "%REPO%\scripts\fetchCpiReleaseSchedule.js" >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%
if %RC% neq 0 (
  echo [%DATE% %TIME%] Fetch exited with code %RC%, triggers not changed. >> "%LOG%"
  echo. >> "%LOG%"
  exit /b %RC%
)

echo [%DATE% %TIME%] Setting CpiHistory and RefCpiCheck triggers... >> "%LOG%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%REPO%\scripts\syncCpiTasks.ps1" >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%
echo [%DATE% %TIME%] Exited with code %RC% >> "%LOG%"
echo. >> "%LOG%"

exit /b %RC%
