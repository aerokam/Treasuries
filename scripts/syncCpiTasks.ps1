<#
.SYNOPSIS
    Sets the triggers of the CpiHistory and RefCpi tasks to one per Release Date of CPI release
    schedule (S19), reading the dates from bls/CpiReleaseSchedule.csv in R2.
.DESCRIPTION
    Run by the weekly CpiReleaseSchedule task (scripts/run-cpi-release-schedule.cmd) after it
    replaces S19, and by hand with the same effect. Does NOT need elevation, and must not be run
    elevated: the two tasks are Interactive tasks created by the user's own non-elevated token, which
    that same token may change. A task created by an elevated process (as every S4U task is) is
    refused ("Access is denied") to a non-elevated one, so an elevated run would lock these tasks
    out of the next weekly sync.

    A date after today gets a CpiHistory trigger at 5:35am PT (8:35am ET) and a RefCpi trigger at
    6:30am PT (9:30am ET). Nothing is changed when S19 cannot be read or lists no date after today.
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
        if ($d.Date.AddHours(5).AddMinutes(35) -gt $now) { $dates.Add($d) }
    }
}
if ($dates.Count -eq 0) {
    Write-Host "No Release Date after today in CPI release schedule (S19): CpiHistory and RefCpi left as they are."
    exit 1
}

# One task: set its triggers in place when it exists and they differ, register it when it does not.
function Sync-CpiTask {
    param([string]$Name, [int]$Hour, [int]$Minute, [string]$Description, [string]$CmdFile,
          [Nullable[TimeSpan]]$RestartInterval, [int]$RestartCount = 0)
    $want = @($dates | ForEach-Object { $_.Date.AddHours($Hour).AddMinutes($Minute).ToString('yyyy-MM-ddTHH:mm:ss') } | Sort-Object)
    $triggers = $dates | ForEach-Object { New-ScheduledTaskTrigger -Once -At ($_.Date.AddHours($Hour).AddMinutes($Minute)) }
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
    "Fetch full CPI-U history from BLS on release dates, upload bls/CPI_history.csv" `
    "$ProjectDir\scripts\run-cpi-history.cmd"

# RefCpi (TIPS/RefCPI.csv)  -  9:30am ET [PT: 6:30am], same release dates as CpiHistory.
# Ref CPI pulls from TreasuryDirect, a source separate from BLS that lags the 8:30am ET
# BLS print by an unknown amount; this used to chain off CpiHistory's own trigger, but a
# non-zero exit from a chained step didn't reliably restart the wrapping task, so
# RefCpi has run on its own trigger since 2026-09-18. 9:30am ET gives TreasuryDirect an
# hour to catch up on its own clock. Retry every 30 min, up to 12x (6h), if
# run-ref-cpi.cmd's freshness check reports TreasuryDirect still hasn't caught up.
Sync-CpiTask "RefCpi" 6 30 `
    "Fetch daily interpolated Ref CPI from TreasuryDirect on BLS release dates, upload TIPS/RefCPI.csv, retrying if TreasuryDirect hasn't caught up yet" `
    "$ProjectDir\scripts\run-ref-cpi.cmd" `
    -RestartInterval (New-TimeSpan -Minutes 30) -RestartCount 12

$first = ($dates | Sort-Object | Select-Object -First 1).ToString('yyyy-MM-dd')
$last  = ($dates | Sort-Object | Select-Object -Last 1).ToString('yyyy-MM-dd')
Write-Host "Release Dates $first to $last."
