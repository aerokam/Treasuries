@echo off
setlocal

set LOG=C:\Users\aerok\projects\Treasuries\YieldCurves\logs\fidelity.log
set NODE=node

if not exist "C:\Users\aerok\projects\Treasuries\YieldCurves\logs" (
  mkdir "C:\Users\aerok\projects\Treasuries\YieldCurves\logs"
)

echo [%DATE% %TIME%] Logon catch-up check >> "%LOG%"
%NODE% "C:\Users\aerok\projects\Treasuries\YieldCurves\scripts\fidelityCatchupIfStale.js" >> "%LOG%" 2>&1
set EXIT_CODE=%ERRORLEVEL%
echo [%DATE% %TIME%] Logon catch-up check exited with code %EXIT_CODE% >> "%LOG%"
exit /b %EXIT_CODE%
