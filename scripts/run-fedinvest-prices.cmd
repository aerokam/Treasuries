@echo off
setlocal enabledelayedexpansion

set REPO=C:\Users\aerok\projects\Treasuries
set LOG=%REPO%\logs\fedinvest-prices.log
set SENTINEL=%REPO%\logs\fedinvest-success-date.txt
set NODE="C:\Program Files\nodejs\node.exe"

if not exist "%REPO%\logs" mkdir "%REPO%\logs"

:: Get today's date in ET
for /f %%d in ('powershell -NoProfile -Command "[System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::Now, 'Eastern Standard Time').ToString('yyyy-MM-dd')"') do set TODAY_ET=%%d

:: Skip if already successfully fetched today
if exist "%SENTINEL%" (
  set /p LAST_SUCCESS=<"%SENTINEL%"
  if "!LAST_SUCCESS!"=="%TODAY_ET%" (
    echo [%DATE% %TIME%] Already fetched today ^(%TODAY_ET%^) -- skipping >> "%LOG%"
    exit /b 0
  )
)

echo [%DATE% %TIME%] Starting FedInvest prices fetch for %TODAY_ET% >> "%LOG%"
%NODE% "%REPO%\scripts\getYieldsFedInvest.js" >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%
echo [%DATE% %TIME%] Exited with code %RC% >> "%LOG%"
echo. >> "%LOG%"
exit /b %RC%
