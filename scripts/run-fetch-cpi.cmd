@echo off
set REPO=C:\Users\aerok\projects\Treasuries
set LOG=%REPO%\logs\fetch-cpi.log
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

echo [%DATE% %TIME%] Release day confirmed — fetching CPI... >> "%LOG%"
%NODE% "%REPO%\scripts\fetchCpi.js" --write >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%
echo [%DATE% %TIME%] Exited with code %RC% >> "%LOG%"
if %RC% neq 0 (
  echo. >> "%LOG%"
  exit /b %RC%
)

echo [%DATE% %TIME%] Calculating daily Ref CPI... >> "%LOG%"
%NODE% "%REPO%\scripts\calcDailyRefCpi.js" --write >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%
echo [%DATE% %TIME%] Exited with code %RC% >> "%LOG%"
if %RC% neq 0 (
  echo. >> "%LOG%"
  exit /b %RC%
)

echo [%DATE% %TIME%] Refreshing the yield curve data sets... >> "%LOG%"
call "%REPO%\YieldCurves\scripts\run-yield-curves.cmd"
set RC=%ERRORLEVEL%
echo [%DATE% %TIME%] Exited with code %RC% >> "%LOG%"
echo. >> "%LOG%"

exit /b %RC%
