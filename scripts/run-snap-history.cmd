@echo off
set REPO=C:\Users\aerok\projects\Treasuries
set LOG=%REPO%\logs\snap-history.log
set NODE="C:\Program Files\nodejs\node.exe"

if not exist "%REPO%\logs" mkdir "%REPO%\logs"

echo [%DATE% %TIME%] Starting snap yield history >> "%LOG%"
%NODE% "%REPO%\YieldsMonitor\scripts\snapHistory.js" >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%
echo [%DATE% %TIME%] Exited with code %RC% >> "%LOG%"
echo. >> "%LOG%"
exit /b %RC%
