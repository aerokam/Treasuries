@echo off
set REPO=C:\Users\aerok\projects\Treasuries
set LOGFILE=%REPO%\logs\yields-fedinvest.log
if not exist "%REPO%\logs" mkdir "%REPO%\logs"
echo [%DATE% %TIME%] Starting getYieldsFedInvest >> "%LOGFILE%"
node "%REPO%\scripts\getYieldsFedInvest.js" >> "%LOGFILE%" 2>&1
echo [%DATE% %TIME%] Exit code: %ERRORLEVEL% >> "%LOGFILE%"
echo. >> "%LOGFILE%"
