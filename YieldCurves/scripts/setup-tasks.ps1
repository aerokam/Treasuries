# setup-tasks.ps1
# Run once from an elevated PowerShell prompt to register the three scheduled tasks.
# Usage: powershell -ExecutionPolicy Bypass -File setup-tasks.ps1

$wrapper = "C:\Users\aerok\projects\Treasuries\YieldCurves\scripts\run-fidelity.cmd"
$user    = "$env:USERDOMAIN\$env:USERNAME"

# Run as logged-in user (headed browser requires an interactive session)
$principal = New-ScheduledTaskPrincipal `
  -UserId $user `
  -LogonType Interactive `
  -RunLevel Limited

$execLimit = (New-TimeSpan -Minutes 25)

# ── Morning: 5:05 AM PT (8:05 AM ET) ──────────────────────────────────────────
# Retries every 30 min, up to 9 times → covers through 9:30 AM PT
$actionMorning  = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$wrapper`""
$triggerMorning = New-ScheduledTaskTrigger -Daily -At "5:05AM"
$settingsMorning = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit $execLimit `
  -RestartCount 9 `
  -RestartInterval (New-TimeSpan -Minutes 30) `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName    "FidelityDownload-Morning" `
  -Description "Fidelity bond download at market open (8:05 AM ET)" `
  -Action      $actionMorning `
  -Trigger     $triggerMorning `
  -Settings    $settingsMorning `
  -Principal   $principal `
  -Force

# ── Midday: 10:00 AM PT (1 PM ET) ─────────────────────────────────────────────
$actionMidday  = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$wrapper`""
$triggerMidday = New-ScheduledTaskTrigger -Daily -At "10:00AM"
$settingsMidday = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit $execLimit `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName    "FidelityDownload-Midday" `
  -Description "Fidelity bond download at FedInvest price load (1 PM ET)" `
  -Action      $actionMidday `
  -Trigger     $triggerMidday `
  -Settings    $settingsMidday `
  -Principal   $principal `
  -Force

# ── Close: 2:00 PM PT (5 PM ET) ───────────────────────────────────────────────
$actionClose  = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$wrapper`""
$triggerClose = New-ScheduledTaskTrigger -Daily -At "2:00PM"
$settingsClose = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit $execLimit `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName    "FidelityDownload-Close" `
  -Description "Fidelity bond download at market close (5 PM ET)" `
  -Action      $actionClose `
  -Trigger     $triggerClose `
  -Settings    $settingsClose `
  -Principal   $principal `
  -Force

# ── FedInvest Yields: 9:00 AM PT (noon ET) ────────────────────────────────────
# Retries every 30 min × 1 → covers through 9:30 AM PT (12:30 PM ET)
# Script exits cleanly if FedInvest hasn't updated yet; retry catches it.
$wrapperFed  = "C:\Users\aerok\projects\Treasuries\YieldCurves\scripts\run-fedinvest.cmd"
$actionFed   = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$wrapperFed`""
$triggerFed  = New-ScheduledTaskTrigger -Daily -At "9:00AM"
$settingsFed = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit $execLimit `
  -RestartCount 1 `
  -RestartInterval (New-TimeSpan -Minutes 30) `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName    "FedInvestYields" `
  -Description "Fetch FedInvest yields at noon ET (9 AM PT), retry at 12:30 PM ET" `
  -Action      $actionFed `
  -Trigger     $triggerFed `
  -Settings    $settingsFed `
  -Principal   $principal `
  -Force

Write-Host ""
Write-Host "Tasks registered:"
Get-ScheduledTask | Where-Object { $_.TaskName -like "FidelityDownload-*" -or $_.TaskName -eq "FedInvestYields" } |
  Select-Object TaskName, State | Format-Table -AutoSize
