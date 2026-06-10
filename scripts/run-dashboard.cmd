@echo off
REM run-dashboard.cmd - guarded, headless launcher for the Admin Dashboard (Dashboard/server.js, port 3737).
REM Used by the "DashboardServer" scheduled task. Idempotent: starts the server only if
REM nothing is already LISTENING on 3737, so it is safe to run repeatedly (morning + heartbeat).
REM Unlike Dashboard\start.cmd (manual, opens a browser), this never opens a browser.
setlocal
set "REPO=%~dp0.."
if not exist "%REPO%\logs" mkdir "%REPO%\logs"
set "LOG=%REPO%\logs\dashboard.log"

netstat -ano | findstr "LISTENING" | findstr ":3737" >nul 2>&1
if %ERRORLEVEL%==0 (
  echo [%DATE% %TIME%] already running on 3737 - no action >> "%LOG%"
  exit /b 0
)

echo [%DATE% %TIME%] starting Dashboard server >> "%LOG%"
powershell -NoProfile -Command "Start-Process -WindowStyle Hidden -FilePath node -ArgumentList 'Dashboard\server.js' -WorkingDirectory '%REPO%' -RedirectStandardOutput '%REPO%\logs\dashboard.out.log' -RedirectStandardError '%REPO%\logs\dashboard.err.log'"
exit /b 0
