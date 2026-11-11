@echo off
REM scripts/run-ref-cpi-check.cmd
REM 1.17 Check daily Ref CPI (knowledge/1.17_Check_Daily_Ref_CPI.md). Triggered by its own Task Scheduler task
REM (RefCpiCheck) at 9:30am ET on the day after each Release Date of CPI release schedule (S19)
REM (scripts/syncCpiTasks.ps1). checkDailyRefCpi.js skips the run unless yesterday was a Release Date, logs
REM the result to logs\ref-cpi-check.log and shows a Windows notification for a mismatch or an unpublished range.

set REPO=C:\Users\aerok\projects\Treasuries
set LOG=%REPO%\logs\ref-cpi-check-run.log
set NODE="C:\Program Files\nodejs\node.exe"

if not exist "%REPO%\logs" mkdir "%REPO%\logs"

echo [%DATE% %TIME%] Checking Ref CPI... >> "%LOG%"
%NODE% "%REPO%\scripts\checkDailyRefCpi.js" >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%
echo [%DATE% %TIME%] Exited with code %RC% >> "%LOG%"
echo. >> "%LOG%"
exit /b 0
