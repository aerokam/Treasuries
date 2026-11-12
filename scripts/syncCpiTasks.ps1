<#
.SYNOPSIS
    Sets the triggers of the CpiHistory and RefCpiCheck tasks to one per Release Date of CPI release
    schedule (S19), reading the dates from bls/CpiReleaseSchedule.csv in R2.
.DESCRIPTION
    Run by the weekly CpiReleaseSchedule task (scripts/run-cpi-release-schedule.cmd) after it
    replaces S19, and by hand with the same effect. Does NOT need elevation, and must not be run
    elevated: the two tasks are Interactive tasks created by the user's own non-elevated token, which
    that same token may change. A task created by an elevated process (as every S4U task is) is
    refused ("Access is denied") to a non-elevated one, so an elevated run would lock these tasks
    out of the next weekly sync.

    A Release Date gets a CpiHistory trigger at 5:35am PT (8:35am ET), which also calculates the daily
    Ref CPI (1.13), and the day after it a RefCpiCheck trigger at 6:30am PT (9:30am ET), which checks it
    against TreasuryDirect (1.17), each unless that time has already passed. Nothing is changed when S19
    cannot be read or lists no Release Date with a task time still ahead.
    A task is changed only when its triggers differ from the dates.
.PARAMETER ProjectDir
    Treasuries project root. Defaults to the parent of this script's directory.
#>
param(
    [string]$ProjectDir = (Split-Path $PSScriptRoot -Parent)
)

$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) {
    Write-Host "Run this script without elevation: a task an elevated process creates cannot be changed by the weekly run."
    exit 1
}

$NodeExe = (Get-Command node).Source
. "$PSScriptRoot\task-helpers.ps1"

$R2Base = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev'
$now    = Get-Date
$dates  = [System.Collections.Generic.List[datetime]]::new()
$csv    = (Invoke-WebRequest -Uri "$R2Base/bls/CpiReleaseSchedule.csv" -UseBasicParsing).Content
foreach ($line in ($csv -split "`n")) {
    # Format: October 2026,2026-11-10,08:30 AM
    if ($line -match '^[^,]+,(\d{4}-\d{2}-\d{2}),') {
        $d = [datetime]::ParseExact($Matches[1], 'yyyy-MM-dd', [System.Globalization.CultureInfo]::InvariantCulture)
        $dates.Add($d)
    }
}
# 6:30am PT is the later of the two task times, so a Release Date with it still ahead is the last chance for a trigger.
if (-not ($dates | Where-Object { $_.Date.AddHours(6).AddMinutes(30) -gt $now })) {
    Write-Host "No Release Date ahead in CPI release schedule (S19): CpiHistory and RefCpi left as they are."
    exit 1
}

# One task: set its triggers in place when it exists and they differ, register it when it does not.
function Sync-CpiTask {
    param([string]$Name, [int]$Hour, [int]$Minute, [string]$Description, [string]$CmdFile,
          [Nullable[TimeSpan]]$RestartInterval, [int]$RestartCount = 0, [int]$DayOffset = 0)
    # A Release Date whose time for this task has already passed gets no trigger: a one-time trigger
    # in the past would run at once under StartWhenAvailable.
    $times    = @($dates | ForEach-Object { $_.Date.AddDays($DayOffset).AddHours($Hour).AddMinutes($Minute) } | Where-Object { $_ -gt $now } | Sort-Object)
    $want     = @($times | ForEach-Object { $_.ToString('yyyy-MM-ddTHH:mm:ss') })
    $triggers = $times | ForEach-Object { New-ScheduledTaskTrigger -Once -At $_ }
    $task = Get-ScheduledTask -TaskName $Name -ErrorAction SilentlyContinue
    if (-not $task) {
        Register-CmdTask $Name $Description $triggers $CmdFile -RestartInterval $RestartInterval -RestartCount $RestartCount -LogonType Interactive
        Write-Host "  [REGISTERED] $Name, $($want.Count) triggers"
        return
    }
    $have = @($task.Triggers | ForEach-Object { ([datetime]$_.StartBoundary).ToString('yyyy-MM-ddTHH:mm:ss') } | Sort-Object)
    if (($have -join ',') -eq ($want -join ',')) {
        Write-Host "  [UNCHANGED] $Name, $($want.Count) triggers"
        return
    }
    Set-ScheduledTask -TaskName $Name -Trigger $triggers | Out-Null
    Write-Host "  [UPDATED] $Name, $($have.Count) triggers -> $($want.Count)"
}

Sync-CpiTask "CpiHistory" 5 35 `
    "Fetch full CPI-U history from BLS on release dates, upload bls/CPI_history.csv, calculate the daily Ref CPI, refresh the yield curve data sets; retries if BLS has not yet published the month" `
    "$ProjectDir\scripts\run-cpi-history.cmd" `
    -RestartInterval (New-TimeSpan -Minutes 30) -RestartCount 12

# RefCpiCheck (1.17 Check daily Ref CPI)  -  9:30am ET [PT: 6:30am] on the day AFTER each Release Date.
# The daily Ref CPI is calculated by CpiHistory's own run (run-cpi-history.cmd); this task compares it with
# TreasuryDirect SecIndex a day later, which posted every release since March 2026 on the release day itself.
# It logs to logs\ref-cpi-check.log and shows a Windows notification for a mismatch or an unpublished range,
# so it has no restart settings: its result is reported, not retried.
Sync-CpiTask "RefCpiCheck" 6 30 `
    "Compare the calculated daily Ref CPI (TIPS/RefCPI.csv) with TreasuryDirect SecIndex the day after each BLS release, notify on a mismatch" `
    "$ProjectDir\scripts\run-ref-cpi-check.cmd" `
    -DayOffset 1

# The RefCpi task of the earlier design fetched from TreasuryDirect; the check replaces it.
if (Get-ScheduledTask -TaskName "RefCpi" -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName "RefCpi" -Confirm:$false
    Write-Host "  [REMOVED] RefCpi (replaced by RefCpiCheck)"
}

$first = ($dates | Sort-Object | Select-Object -First 1).ToString('yyyy-MM-dd')
$last  = ($dates | Sort-Object | Select-Object -Last 1).ToString('yyyy-MM-dd')
Write-Host "Release Dates $first to $last."
