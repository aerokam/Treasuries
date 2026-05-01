@echo off
set REPO=C:\Users\aerok\projects\Treasuries
set LOG=%REPO%\logs\tips-ref.log
set NODE="C:\Program Files\nodejs\node.exe"

if not exist "%REPO%\logs" mkdir "%REPO%\logs"

echo [%DATE% %TIME%] Starting TIPS ref fetch >> "%LOG%"
%NODE% "%REPO%\scripts\fetchTipsRef.js" >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%
echo [%DATE% %TIME%] Exited with code %RC% >> "%LOG%"
echo. >> "%LOG%"
exit /b %RC%
