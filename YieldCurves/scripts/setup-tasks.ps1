# setup-tasks.ps1
# Run once from an elevated PowerShell prompt to register ALL data pipeline scheduled tasks.
# Usage: powershell -ExecutionPolicy Bypass -File setup-tasks.ps1

$REPO = Split-Path (Split-Path $PSScriptRoot)
$user = "$env:USERDOMAIN\$env:USERNAME"

$principal = New-ScheduledTaskPrincipal `
  -UserId    $user `
  -LogonType Interactive `
  -RunLevel  Limited

$execLimit25m = New-TimeSpan -Minutes 25
$execLimit1h  = New-TimeSpan -Hours 1
$execLimit72h = New-TimeSpan -Hours 72

function New-WeekdayTrigger($time) {
  New-ScheduledTaskTrigger -Weekly -WeeksInterval 1 `
    -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At $time
}
function New-MondayTrigger($time) {
  New-ScheduledTaskTrigger -Weekly -WeeksInterval 1 -DaysOfWeek Monday -At $time
}

# ── FIDELITY (headed CDP browser — 3 daily windows) ──────────────────────────

$wrapperFidelity = "$REPO\YieldCurves\scripts\run-fidelity.cmd"

Register-ScheduledTask `
  -TaskName    "FidelityDownload-Morning" `
  -Description "Fidelity bond download at market open (8:05 AM ET)" `
  -Action      (New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$wrapperFidelity`"") `
  -Trigger     (New-ScheduledTaskTrigger -Daily -At "5:05AM") `
  -Settings    (New-ScheduledTaskSettingsSet -ExecutionTimeLimit $execLimit25m `
                  -RestartCount 9 -RestartInterval (New-TimeSpan -Minutes 30) `
                  -MultipleInstances IgnoreNew) `
  -Principal   $principal -Force

Register-ScheduledTask `
  -TaskName    "FidelityDownload-Midday" `
  -Description "Fidelity bond download at FedInvest price load (1 PM ET)" `
  -Action      (New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$wrapperFidelity`"") `
  -Trigger     (New-ScheduledTaskTrigger -Daily -At "10:00AM") `
  -Settings    (New-ScheduledTaskSettingsSet -ExecutionTimeLimit $execLimit25m -MultipleInstances IgnoreNew) `
  -Principal   $principal -Force

Register-ScheduledTask `
  -TaskName    "FidelityDownload-Close" `
  -Description "Fidelity bond download at market close (5 PM ET)" `
  -Action      (New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$wrapperFidelity`"") `
  -Trigger     (New-ScheduledTaskTrigger -Daily -At "2:00PM") `
  -Settings    (New-ScheduledTaskSettingsSet -ExecutionTimeLimit $execLimit25m -MultipleInstances IgnoreNew) `
  -Principal   $principal -Force

# ── FEDINVEST PRICES (weekdays noon ET = 9 AM PT) ────────────────────────────
# Sentinel file logs/fedinvest-success-date.txt prevents double-fetch on retries.

Register-ScheduledTask `
  -TaskName    "FedInvestPrices" `
  -Description "Fetch FedInvest TIPS yields/prices at noon ET (9 AM PT)" `
  -Action      (New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$REPO\scripts\run-fedinvest-prices.cmd`"") `
  -Trigger     (New-WeekdayTrigger "9:00AM") `
  -Settings    (New-ScheduledTaskSettingsSet -ExecutionTimeLimit $execLimit72h -MultipleInstances IgnoreNew) `
  -Principal   $principal -Force

# ── TREASURY AUCTIONS (weekdays — two windows: after 11:30 AM ET and 1 PM ET) ─

Register-ScheduledTask `
  -TaskName    "TreasuryAuctions-Morning" `
  -Description "Fetch Treasury auction results after 11:30 AM ET comp close (8:35 AM PT)" `
  -Action      (New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$REPO\scripts\run-auctions.cmd`"") `
  -Trigger     (New-WeekdayTrigger "8:35AM") `
  -Settings    (New-ScheduledTaskSettingsSet -ExecutionTimeLimit $execLimit72h -MultipleInstances IgnoreNew) `
  -Principal   $principal -Force

Register-ScheduledTask `
  -TaskName    "TreasuryAuctions-Afternoon" `
  -Description "Fetch Treasury auction results after 1 PM ET comp close (10:05 AM PT)" `
  -Action      (New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$REPO\scripts\run-auctions.cmd`"") `
  -Trigger     (New-WeekdayTrigger "10:05AM") `
  -Settings    (New-ScheduledTaskSettingsSet -ExecutionTimeLimit $execLimit72h -MultipleInstances IgnoreNew) `
  -Principal   $principal -Force

# ── SNAP YIELD HISTORY (weekdays 11:00 AM PT) ────────────────────────────────

Register-ScheduledTask `
  -TaskName    "SnapYieldHistory" `
  -Description "Snapshot daily yield history from FedInvest to R2" `
  -Action      (New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$REPO\scripts\run-snap-history.cmd`"") `
  -Trigger     (New-WeekdayTrigger "11:00AM") `
  -Settings    (New-ScheduledTaskSettingsSet -ExecutionTimeLimit $execLimit72h -MultipleInstances IgnoreNew) `
  -Principal   $principal -Force

# ── TIPS REF (Mondays 7:00 AM PT) ────────────────────────────────────────────

Register-ScheduledTask `
  -TaskName    "TipsRef" `
  -Description "Fetch TIPS reference data (issue dates, CUSIP, etc.) from TreasuryDirect" `
  -Action      (New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$REPO\scripts\run-tips-ref.cmd`"") `
  -Trigger     (New-MondayTrigger "7:00AM") `
  -Settings    (New-ScheduledTaskSettingsSet -ExecutionTimeLimit $execLimit72h -MultipleInstances IgnoreNew) `
  -Principal   $principal -Force

# ── UPDATE CPI RELEASE SCHEDULE (Mondays noon PT — elevated) ─────────────────

$principalElev = New-ScheduledTaskPrincipal `
  -UserId    $user `
  -LogonType Interactive `
  -RunLevel  Highest

Register-ScheduledTask `
  -TaskName    "Update CPI release schedule" `
  -Description "Fetch BLS CPI release schedule via bash script (Mondays noon PT)" `
  -Action      (New-ScheduledTaskAction `
                  -Execute  "`"C:\Program Files\Git\usr\bin\bash.exe`"" `
                  -Argument "-lc `"/c/Users/$env:USERNAME/projects/bls/updateCpiReleaseSchedules.sh`"") `
  -Trigger     (New-MondayTrigger "12:00PM") `
  -Settings    (New-ScheduledTaskSettingsSet -ExecutionTimeLimit $execLimit1h `
                  -WakeToRun -StartWhenAvailable) `
  -Principal   $principalElev `
  -Force

# ── CPI TASKS (RefCPI + FetchCpiHistory + RefreshCpiTasks) ───────────────────
# setup-cpi-release-tasks.ps1 reads R2 for BLS release dates and builds
# date-specific triggers. It also self-schedules RefreshCpiTasks for Dec 29.

Write-Host ""
Write-Host "Registering CPI tasks via setup-cpi-release-tasks.ps1..."
& "$REPO\scripts\setup-cpi-release-tasks.ps1"

# ── Summary ───────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "Tasks registered:"
$names = @(
  "FidelityDownload-Morning","FidelityDownload-Midday","FidelityDownload-Close",
  "FedInvestPrices",
  "TreasuryAuctions-Morning","TreasuryAuctions-Afternoon",
  "SnapYieldHistory","TipsRef","Update CPI release schedule",
  "RefCPI","FetchCpiHistory","RefreshCpiTasks"
)
Get-ScheduledTask | Where-Object { $_.TaskName -in $names } |
  Select-Object TaskName, State | Sort-Object TaskName | Format-Table -AutoSize
