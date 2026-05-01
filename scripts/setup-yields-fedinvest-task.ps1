# Registers the YieldsFedInvest scheduled task.
# Run once: powershell -ExecutionPolicy Bypass -File setup-yields-fedinvest-task.ps1
#
# Fires at 10:05 AM PT (= 1:05 PM ET), exact — no GH Actions lag.
# WakeToRun: wakes the PC from sleep to run the task.
# StartWhenAvailable: if the PC was asleep at trigger time, runs as soon as it wakes.

$taskName = "YieldsFedInvest"
$repoRoot = Split-Path $PSScriptRoot
$cmd      = "$repoRoot\scripts\run-yields-fedinvest.cmd"

$action   = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$cmd`""
$trigger  = New-ScheduledTaskTrigger -Daily -At "10:05AM"   # 1:05 PM ET (PDT/PST offset is same)
$settings = New-ScheduledTaskSettingsSet `
              -WakeToRun `
              -StartWhenAvailable `
              -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

Register-ScheduledTask `
  -TaskName  $taskName `
  -Action    $action `
  -Trigger   $trigger `
  -Settings  $settings `
  -Force

Write-Host "Task '$taskName' registered. Verify in Task Scheduler > wake from sleep is checked."
