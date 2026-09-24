<#
.SYNOPSIS
    Registers all Treasuries data pipeline tasks in Windows Task Scheduler.
.DESCRIPTION
    Creates one scheduled task per ingestion job. Re-running is safe (idempotent  - 
    existing tasks are unregistered and re-created).

    CPI tasks use date-specific triggers fetched live from R2. All other tasks use
    weekly or daily recurring triggers.

    All times are Pacific Time (PT). ET-based tasks run 5 minutes after their ET
    anchor. ET and PT observe DST together so the offset is always -3h.
    If your machine is NOT in Pacific Time, adjust all times below.
.PARAMETER ProjectDir
    Treasuries project root. Defaults to the parent of this script's directory.
#>
param(
    [string]$ProjectDir = (Split-Path $PSScriptRoot -Parent)
)

# Self-elevate via UAC if not already running as administrator.
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$LogPath = Join-Path (Join-Path (Split-Path $PSScriptRoot -Parent) "logs") "setup-tasks.log"
if (-not $isAdmin) {
    # The elevated window closes on exit, taking any error with it, so the child
    # transcribes to $LogPath and this parent waits and points at it.
    Write-Host "Elevating. Output is transcribed to:"
    Write-Host "  $LogPath"
    $argList = "-ExecutionPolicy Bypass -NonInteractive -File `"$PSCommandPath`" -ProjectDir `"$ProjectDir`""
    $proc = Start-Process powershell.exe -Verb RunAs -ArgumentList $argList -Wait -PassThru
    Write-Host "Elevated run exited with $($proc.ExitCode). See the log above for detail."
    exit $proc.ExitCode
}

New-Item -ItemType Directory -Force -Path (Split-Path $LogPath -Parent) | Out-Null
Start-Transcript -Path $LogPath -Force | Out-Null
trap { Write-Host "FAILED: $_"; Stop-Transcript | Out-Null; exit 1 }

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Error "Node.js not found. Install it from https://nodejs.org/ and re-run."
    exit 1
}
$NodeExe = $nodeCmd.Source

Write-Host "Project : $ProjectDir"
Write-Host "Node    : $NodeExe"
Write-Host ""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

function Register-DataTask {
    param(
        [string]   $Name,
        [string]   $Description,
        [object[]] $Triggers,
        [string]   $Execute,
        [string]   $Argument,
        [string]   $Cwd = $ProjectDir,
        [Nullable[TimeSpan]] $RestartInterval,
        [int]      $RestartCount = 0,
        [ValidateSet('S4U', 'Interactive')]
        [string]   $LogonType = 'S4U'
    )
    if (Get-ScheduledTask -TaskName $Name -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $Name -Confirm:$false
    }
    # Run via conhost --headless so no console window ever appears/steals focus.
    # Task Scheduler otherwise pops a visible conhost window for any console-subsystem
    # action, even when the script itself redirects all output to a log file.
    $conhost   = "$env:WINDIR\System32\conhost.exe"
    $hiddenArg = "--headless `"$Execute`" $Argument"
    $action    = New-ScheduledTaskAction -Execute $conhost -Argument $hiddenArg -WorkingDirectory $Cwd
    $settingsArgs = @{ ExecutionTimeLimit = (New-TimeSpan -Minutes 30); StartWhenAvailable = $true }
    if ($RestartCount -gt 0) {
        $settingsArgs.RestartInterval = $RestartInterval
        $settingsArgs.RestartCount    = $RestartCount
    }
    $settings  = New-ScheduledTaskSettingsSet @settingsArgs
    # S4U (not Interactive): runs whether the user is logged on or not, without storing a
    # password. Registering with S4U requires the elevated re-run above (Interactive alone
    # doesn't). Interactive attaches to the user's real desktop session instead, so any
    # window the task opens (e.g. Chrome) is visible — used for tasks that may need a
    # manual step, at the cost of not running while logged off.
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType $LogonType -RunLevel Limited
    $task      = New-ScheduledTask -Action $action -Trigger $Triggers -Settings $settings -Principal $principal -Description $Description
    Register-ScheduledTask -TaskName $Name -InputObject $task | Out-Null
    Write-Host "  [OK] $Name"
}

function Register-NodeTask {
    param([string]$Name, [string]$Description, [object[]]$Triggers, [string]$Script)
    Register-DataTask -Name $Name -Description $Description -Triggers $Triggers `
        -Execute $NodeExe -Argument $Script
}

function Register-CmdTask {
    param(
        [string]   $Name, [string]$Description, [object[]]$Triggers, [string]$CmdFile,
        [Nullable[TimeSpan]] $RestartInterval,
        [int]      $RestartCount = 0,
        [ValidateSet('S4U', 'Interactive')]
        [string]   $LogonType = 'S4U'
    )
    Register-DataTask -Name $Name -Description $Description -Triggers $Triggers `
        -Execute "cmd.exe" -Argument "/c `"$CmdFile`"" `
        -RestartInterval $RestartInterval -RestartCount $RestartCount -LogonType $LogonType
}

[System.DayOfWeek[]] $Weekdays = 'Monday','Tuesday','Wednesday','Thursday','Friday'

# ---------------------------------------------------------------------------
# Remove legacy tasks (replaced by the canonical names below)
# ---------------------------------------------------------------------------
Write-Host "Removing legacy tasks..."
$legacy = @(
    # FedInvest variants
    'FedInvestPrices', 'FedInvestYields', 'FedInvestDownload',
    # Auction variants
    'TreasuryAuctions-Morning', 'TreasuryAuctions-Afternoon', 'AuctionRefresh',
    # TIPS Ref variants
    'TipsRefRefresh',
    # Yield History variants
    'SnapYieldHistory', 'YieldHistorySnap',
    # SA Factor variants
    'SaFactorUpdate',
    # Ref CPI variants (superseded by the canonical 'RefCpi' task registered below)
    'RefCPI', 'RefCpiRefresh',
    # CPI History variants
    'FetchCpiHistory', 'CpiHistoryRefresh',
    # Fidelity variants
    'FidelityDownload-Morning', 'FidelityDownload-Midday', 'FidelityDownload-Close',
    # CpiTasks variants
    'RefreshCpiTasks', 'Update CPI release schedule'
)
foreach ($name in $legacy) {
    if (Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $name -Confirm:$false
        Write-Host "  [REMOVED] $name"
    }
}

# ---------------------------------------------------------------------------
# Recurring tasks
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "Registering recurring tasks..."

# YieldsFromFedInvestPrices  -  1:05pm ET [PT: 10:05am]
# FedInvest posts reference prices by 1pm ET; script downloads prices and calculates YTM
# yields. Retry every 10 min, up to 12x (2h), if FedInvest is still showing yesterday's
# prices (non-zero exit from getYieldsFedInvest.js's freshness check).
Register-CmdTask "YieldsFromFedInvestPrices" `
    "Download FedInvest reference prices, calculate YTM yields, upload YieldsFromFedInvestPrices.csv; retries if today's prices aren't posted yet" `
    @(New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "10:05am") `
    "$ProjectDir\YieldCurves\scripts\run-fedinvest.cmd" `
    -RestartInterval (New-TimeSpan -Minutes 10) -RestartCount 12

# TreasuryAuctions  -  11:35am ET [PT: 8:35am] and 1:05pm ET [PT: 10:05am]
# Treasury auction close times are 11:30am ET and 1:00pm ET; run 5 min after each.
Register-NodeTask "TreasuryAuctions" `
    "Fetch Treasury auction results from FiscalData, upload Auctions.csv" `
    @(
        (New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "8:35am"),
        (New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "10:05am")
    ) `
    "scripts/getAuctions.js"

# TipsRef  -  Weekdays 8:35am and 10:05am PT (same cadence as TreasuryAuctions,
# same underlying FiscalData auctions_query endpoint; catches int_rate as soon as
# it's posted post-auction instead of waiting up to a week on the old Monday-only run).
Register-NodeTask "TipsRef" `
    "Fetch TIPS reference metadata from FiscalData, upload TipsRef.csv" `
    @(
        (New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "8:35am"),
        (New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "10:05am")
    ) `
    "scripts/fetchTipsRef.js"

# YieldsHistory  -  Weekdays 2:00pm PT (bond market closes at 5pm ET / 2pm PT)
Register-NodeTask "YieldsHistory" `
    "Refresh consolidated yields-history/history.json (3PM closes, all 14 symbols) in R2" `
    @(New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "2:00pm") `
    "YieldsMonitor/scripts/updateYieldsHistory.js"

# CheckCnbcRollover  -  Weekdays 2:30pm PT (after YieldsHistory's 2:00pm daily-close snapshot,
# which supplies the archived quoted-yield history it cross-checks against)
# Compares each TIPS symbol's live CNBC bond identity to CNBC_ROLLOVER_LOG's last entry; on a
# mismatch, bisects the flip date same-day via FedInvest T+0 cross-check and auto-commits +
# pushes the pinned entry. See YieldsMonitor/knowledge/2.4_Seasonal_Adjustment.md#automated-
# rollover-check. Developer-facing background maintenance only, no UI surface.
Register-NodeTask "CheckCnbcRollover" `
    "Check each TIPS symbol's live CNBC bond identity against CNBC_ROLLOVER_LOG; auto-pin, test, commit and push a new rollover entry on mismatch" `
    @(New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "2:30pm") `
    "YieldsMonitor/scripts/checkCnbcRollover.js"

# IntradayArchive  -  Weekdays 2:05pm PT [ET: 5:05pm] (5 min after cash close)
# Audit archive: captures raw 1D + 5D feeds per symbol so any past close window can be
# inspected offline. Separate from YieldsHistory (daily-close baseline).
Register-NodeTask "IntradayArchive" `
    "Archive raw CNBC 1D+5D intraday feeds per symbol to R2 yields-history/intraday-raw" `
    @(New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "2:05pm") `
    "YieldsMonitor/scripts/archiveIntraday.js"

# CloseProbe  -  Weekdays starting 2:05pm PT [ET: 5:05pm], repeating every 15 min for 1 hour
# Temporary investigation: logs the last 1D bar of US10YTIPS at 17:05/17:20/17:35/17:50/18:05
# ET to pin down when the 17:05 consolidation print reliably posts. Retire once known.
$probeTrigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "2:05pm"
$probeTrigger.Repetition = (New-ScheduledTaskTrigger -Once -At "2:05pm" `
    -RepetitionInterval (New-TimeSpan -Minutes 15) `
    -RepetitionDuration (New-TimeSpan -Hours 1)).Repetition
Register-NodeTask "CloseProbe" `
    "Probe: log US10YTIPS last 1D bar every 15min after close to find when 17:05 print posts" `
    @($probeTrigger) `
    "YieldsMonitor/scripts/probeClose.js"

# SaFactors  -  Daily 6:35am PT
Register-NodeTask "SaFactors" `
    "Fetch CPI NSA/SA from BLS, calculate daily SA factors, upload RefCpiNsaSa.csv, refresh SA/SAO yields" `
    @(New-ScheduledTaskTrigger -Daily -At "6:35am") `
    "YieldCurves/scripts/updateRefCpi.js"

# FundHoldings  -  Daily 6:40am PT
# Fetch Vanguard (VBIL/VTIP/VTP) + fminvest (RBIL) fund holdings, enrich, upload to R2.
Register-NodeTask "FundHoldings" `
    "Refresh Vanguard/fminvest fund holdings, enrich with yields, upload to R2 (FundHoldings/ prefix)" `
    @(New-ScheduledTaskTrigger -Daily -At "6:40am") `
    "FundHoldings/updateAllHoldings.js"

# GswTipsCurve  -  Daily 7:15am PT
# Scrape the latest row of the Fed's GSW fitted TIPS curve (published weekly, Tuesdays,
# through prior Friday); write its 6 Svensson parameters + date to TIPS/GswTipsCurve.json.
# Daily (not weekly) so an off-schedule Fed revision is picked up promptly; the fetch is tiny.
Register-NodeTask "GswTipsCurve" `
    "Scrape the latest GSW fitted TIPS curve parameters, upload TIPS/GswTipsCurve.json" `
    @(New-ScheduledTaskTrigger -Daily -At "7:15am") `
    "YieldCurves/scripts/updateGswTipsCurve.js"

# FidelityQuotes  -  8:05am ET [PT: 5:05am]
# Runs before market open, when the user is often not logged on yet — S4U so it runs
# regardless. No visible window: if the automated MFA path (SMS code read from Phone
# Link) needs a manual step nobody's there to do, it fails and dumps state to
# logs/mfa-debug/; FidelityQuotesCatchup below is the visible retry.
Register-CmdTask "FidelityQuotes" `
    "Download Fidelity broker quotes (TIPS + Treasuries) before market open, upload FidelityTips.csv + FidelityTreasuries.csv" `
    @(New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "5:05am") `
    "$ProjectDir\YieldCurves\scripts\run-fidelity.cmd"

# FidelityQuotesDaytime  -  12:35pm ET [PT: 9:35am], 5:05pm ET [PT: 2:05pm]
# Runs during hours the user is normally at the desk — Interactive so the Chrome window
# is visible on their desktop, giving them something to act on if the automated MFA
# path (SMS code read from Phone Link) falls through to the manual-wait fallback.
Register-CmdTask "FidelityQuotesDaytime" `
    "Download Fidelity broker quotes (TIPS + Treasuries) midday and at close, upload FidelityTips.csv + FidelityTreasuries.csv; runs visibly so a manual MFA step can be completed" `
    @(
        (New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "9:35am"),
        (New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "2:05pm")
    ) `
    "$ProjectDir\YieldCurves\scripts\run-fidelity.cmd" `
    -LogonType Interactive

# FidelityQuotesCatchup  -  2 min after logon
# Safety net for FidelityQuotes (the invisible 5:05am run): if it was missed or failed
# today (PC off, or a manual MFA step nobody was there to complete), this runs the
# download once as soon as the user logs back on. No-ops when today's data is already
# on R2 (see fidelityCatchupIfStale.js). Interactive so the just-opened desktop session
# makes the window visible, giving the user a real shot at a manual MFA step.
$catchupTrigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$catchupTrigger.Delay = 'PT2M'
Register-CmdTask "FidelityQuotesCatchup" `
    "Logon safety net: run the Fidelity download once if today's data is still missing from R2; runs visibly so a manual MFA step can be completed" `
    @($catchupTrigger) `
    "$ProjectDir\YieldCurves\scripts\run-fidelity-catchup.cmd" `
    -LogonType Interactive

# Yield Curves fit (S13/S14/S15) is NOT independently scheduled — it has no standalone
# trigger. It runs chained from inside run-fidelity.cmd (called by FidelityQuotes, above)
# and inside run-fedinvest.cmd (called by YieldsFromFedInvestPrices, above), each on
# success only, via YieldCurves/scripts/run-yield-curves.cmd. Both are its actual inputs
# (FidelityTreasuriesTips.csv and YieldsFromFedInvestPrices.csv), so it re-fits whenever
# either one actually changed rather than on its own fixed clock.

# LockProbe  -  Weekdays 11:00am PT [ET: 2:00pm], hourly for 18h (through overnight).
# Temporary investigation (Close_Price_Investigation.md §8): each hour logs the last 7 daily
# (6M-feed) bars by date for US10YTIPS + US10Y vs the live 1D value. The just-completed day's
# bar tracks live until CNBC revises it to the ~3PM benchmark; the run where that date's value
# snaps to the benchmark and stops moving pins the revision time. Starting at 2pm ET (before
# the ~14:59 benchmark snap) ensures we catch the transition live, not just the aftermath.
$lockTrigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "11:00am"
$lockTrigger.Repetition = (New-ScheduledTaskTrigger -Once -At "2:00pm" `
    -RepetitionInterval (New-TimeSpan -Hours 1) `
    -RepetitionDuration (New-TimeSpan -Hours 18)).Repetition
Register-NodeTask "LockProbe" `
    "Track the just-completed day's daily bar hourly overnight to pin when CNBC revises it to the ~3PM benchmark" `
    @($lockTrigger) `
    "YieldsMonitor/scripts/probeLock.js"

# DashboardServer  -  Weekday mornings 6:00am PT, self-healing every 30 min through the day.
# Keeps the local Admin Dashboard (Dashboard/server.js, port 3737) running. The wrapper is
# guarded (starts only if 3737 is free) and headless (no browser), so the repetition is a
# harmless heartbeat that recovers from a mid-day crash without needing a logon trigger.
$dashTrigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "6:00am"
$dashTrigger.Repetition = (New-ScheduledTaskTrigger -Once -At "6:00am" `
    -RepetitionInterval (New-TimeSpan -Minutes 30) `
    -RepetitionDuration (New-TimeSpan -Hours 18)).Repetition
Register-CmdTask "DashboardServer" `
    "Ensure the local Admin Dashboard (port 3737) is running; start it headless if not" `
    @($dashTrigger) `
    "$ProjectDir\scripts\run-dashboard.cmd"

# ---------------------------------------------------------------------------
# CPI release date tasks  -  date-specific triggers fetched live from R2
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "Fetching CPI release schedule from R2..."

$R2Base      = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev'
$now         = Get-Date
$futureDates = [System.Collections.Generic.List[datetime]]::new()

foreach ($year in @($now.Year, $now.Year + 1)) {
    $url = "$R2Base/bls/CpiReleaseSchedule$year.csv"
    try {
        $csv = (Invoke-WebRequest -Uri $url -UseBasicParsing -ErrorAction Stop).Content
        foreach ($line in ($csv -split "`n")) {
            # Format: "Friday, April 10, 2026","08:30 AM","Consumer Price Index..."
            if ($line -match '^"([A-Za-z]+, [A-Za-z]+ \d+, \d+)"') {
                try {
                    $d = [datetime]::ParseExact(
                        $Matches[1], "dddd, MMMM d, yyyy",
                        [System.Globalization.CultureInfo]::InvariantCulture
                    )
                    if ($d -gt $now) { $futureDates.Add($d) }
                } catch { }
            }
        }
    } catch {
        Write-Warning "  Could not fetch CpiReleaseSchedule$year.csv: $_"
    }
}

if ($futureDates.Count -gt 0) {
    # CpiHistory  -  8:35am ET [PT: 5:35am]
    $cpiTriggers = $futureDates | ForEach-Object {
        New-ScheduledTaskTrigger -Once -At ($_.Date.AddHours(5).AddMinutes(35))
    }
    Register-CmdTask "CpiHistory" `
        "Fetch full CPI-U history from BLS on release dates, upload bls/CPI_history.csv" `
        $cpiTriggers `
        "$ProjectDir\scripts\run-cpi-history.cmd"

    # RefCpi (TIPS/RefCPI.csv)  -  9:30am ET [PT: 6:30am], same release dates as CpiHistory.
    # Ref CPI pulls from TreasuryDirect, a source separate from BLS that lags the 8:30am ET
    # BLS print by an unknown amount; this used to chain off CpiHistory's own trigger, but a
    # non-zero exit from a chained step didn't reliably restart the wrapping task, so
    # RefCpi has run on its own trigger since 2026-09-18. 9:30am ET gives TreasuryDirect an
    # hour to catch up on its own clock. Retry every 30 min, up to 12x (6h), if
    # run-ref-cpi.cmd's freshness check reports TreasuryDirect still hasn't caught up.
    $refCpiTriggers = $futureDates | ForEach-Object {
        New-ScheduledTaskTrigger -Once -At ($_.Date.AddHours(6).AddMinutes(30))
    }
    Register-CmdTask "RefCpi" `
        "Fetch daily interpolated Ref CPI from TreasuryDirect on BLS release dates, upload TIPS/RefCPI.csv, retrying if TreasuryDirect hasn't caught up yet" `
        $refCpiTriggers `
        "$ProjectDir\scripts\run-ref-cpi.cmd" `
        -RestartInterval (New-TimeSpan -Minutes 30) -RestartCount 12

    $nextDate = ($futureDates | Sort-Object | Select-Object -First 1).ToString('yyyy-MM-dd')
    Write-Host "  Registered $($futureDates.Count) CPI date triggers (next: $nextDate)"
} else {
    Write-Warning "  No future CPI dates found  -  CpiHistory/RefCpi NOT registered."
}

# ---------------------------------------------------------------------------
# CpiTasks  -  Dec 29 annually: re-runs this script to reload next year's CPI schedule
# ---------------------------------------------------------------------------
$dec29 = Get-Date -Year $now.Year -Month 12 -Day 29 -Hour 7 -Minute 0 -Second 0
if ($dec29 -lt $now) { $dec29 = $dec29.AddYears(1) }

Register-DataTask -Name "CpiTasks" `
    -Description "Re-run setup script Dec 29 annually to reload next year's CPI release date triggers" `
    -Triggers @(New-ScheduledTaskTrigger -Once -At $dec29) `
    -Execute "$PSHOME\powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -NonInteractive -File `"$ProjectDir\scripts\setup-windows-tasks.ps1`""

Write-Host "  CpiTasks scheduled for $($dec29.ToString('yyyy-MM-dd')) 07:00"

# ---------------------------------------------------------------------------

Write-Host ""
Write-Host "Done. All tasks registered."
Write-Host "Verify: schtasks /query /fo table | findstr /i Yields"
Stop-Transcript | Out-Null
