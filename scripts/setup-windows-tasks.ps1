<#
.SYNOPSIS
    Registers all Treasuries data pipeline tasks in Windows Task Scheduler.
.DESCRIPTION
    Creates one scheduled task per ingestion job. Re-running is safe (idempotent  - 
    existing tasks are unregistered and re-created).

    Most tasks use weekly recurring triggers. CpiHistory and RefCpiCheck have one trigger per Release
    Date of CPI release schedule (S19); CpiReleaseSchedule sets them weekly (see the CPI tasks block).

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

. "$PSScriptRoot\task-helpers.ps1"

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
    # SA Factor variants (SaFactors fetched the monthly CPI and calculated Ref CPI NSA and SA daily; the CpiHistory task now does both on each Release Date)
    'SaFactorUpdate', 'SaFactors',
    # Ref CPI variants (superseded by the RefCpiCheck task, which syncCpiTasks.ps1 registers)
    'RefCpiRefresh',
    # CPI History variants
    'FetchCpiHistory', 'CpiHistoryRefresh',
    # CpiTasks variants (CpiTasks re-ran this script each Dec 29 to reload date-specific triggers)
    'CpiTasks', 'RefreshCpiTasks', 'Update CPI release schedule',
    # Close-price investigation probes (findings in YieldsMonitor/knowledge/Close_Price_Investigation.md)
    'CloseProbe', 'LockProbe'
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
# TreasuryDirect states an auction's results 3.1 to 15.5 min after the close (E15 in the
# Data Dictionary), so each trigger repeats every 10 min for 25 min: runs at 5, 15 and 25 min.
$auctionTriggers = foreach ($at in "8:35am", "10:05am") {
    $t = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At $at
    $t.Repetition = (New-ScheduledTaskTrigger -Once -At $at `
        -RepetitionInterval (New-TimeSpan -Minutes 10) `
        -RepetitionDuration (New-TimeSpan -Minutes 25)).Repetition
    $t
}
Register-NodeTask "TreasuryAuctions" `
    "Fetch Treasury auction results from FiscalData and TreasuryDirect, upload Auctions.csv" `
    $auctionTriggers `
    "scripts/getAuctions.js"

# TipsRef  -  Weekdays 8:35am and 10:05am PT (same cadence as TreasuryAuctions,
# same underlying FiscalData treasury_securities_auctions_v2 table; catches int_rate as soon as
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

# MarketQuotes  -  8:05am ET [PT: 5:05am]
# Runs before market open, when the user is often not logged on yet — S4U so it runs
# regardless. No visible window: if the automated MFA path (SMS code read from Phone
# Link) needs a manual step nobody's there to do, it fails and dumps state to
# logs/mfa-debug/; MarketQuotesCatchup below is the visible retry.
Register-CmdTask "MarketQuotes" `
    "Download broker quotes (TIPS + Treasuries) before market open, upload MarketQuotes.csv" `
    @(New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "5:05am") `
    "$ProjectDir\YieldCurves\scripts\run-market-quotes.cmd"

# MarketQuotesDaytime  -  12:35pm ET [PT: 9:35am], 5:05pm ET [PT: 2:05pm]
# Runs during hours the user is normally at the desk — Interactive so the Chrome window
# is visible on their desktop, giving them something to act on if the automated MFA
# path (SMS code read from Phone Link) falls through to the manual-wait fallback.
Register-CmdTask "MarketQuotesDaytime" `
    "Download broker quotes (TIPS + Treasuries) midday and at close, upload MarketQuotes.csv; runs visibly so a manual MFA step can be completed" `
    @(
        (New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "9:35am"),
        (New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At "2:05pm")
    ) `
    "$ProjectDir\YieldCurves\scripts\run-market-quotes.cmd" `
    -LogonType Interactive

# MarketQuotesCatchup  -  2 min after logon
# Safety net for MarketQuotes (the invisible 5:05am run): if it was missed or failed
# today (PC off, or a manual MFA step nobody was there to complete), this runs the
# download once as soon as the user logs back on. No-ops when today's data is already
# on R2 (see marketQuotesCatchupIfStale.js). Interactive so the just-opened desktop session
# makes the window visible, giving the user a real shot at a manual MFA step.
$catchupTrigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$catchupTrigger.Delay = 'PT2M'
Register-CmdTask "MarketQuotesCatchup" `
    "Logon safety net: run the broker quotes download once if today's data is still missing from R2; runs visibly so a manual MFA step can be completed" `
    @($catchupTrigger) `
    "$ProjectDir\YieldCurves\scripts\run-market-quotes-catchup.cmd" `
    -LogonType Interactive

# LocalBackup  -  daily 12:30pm PT
# Copies the files .gitignore lists under "Local-only" into the private sibling repository
# Treasuries-local and pushes when any changed (scripts/syncLocalBackup.js). .env is never
# copied. Those files change rarely (when the quote source's page changes), so a daily run is
# enough; StartWhenAvailable runs a missed one at the next logon. Interactive, so it needs no
# elevation and runs while the user is logged on.
Register-DataTask "LocalBackup" `
    "Back up the gitignored local files to the private Treasuries-local repository" `
    @(New-ScheduledTaskTrigger -Daily -At "12:30pm") `
    $NodeExe "scripts/syncLocalBackup.js" `
    -LogonType Interactive

# VendorUpdateCheck  -  Mondays 11:00am PT
# Compares the libraries in shared/vendor with the latest versions npm publishes and with its
# security advisories (scripts/checkVendorUpdates.js). Writes logs/vendor-update-report.txt
# only when a library is behind or has an advisory; the memory index tells each session to
# apply it. Interactive, so it needs no elevation.
Register-DataTask "VendorUpdateCheck" `
    "Check the vendored libraries for newer versions and security advisories" `
    @(New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At "11:00am") `
    $NodeExe "scripts/checkVendorUpdates.js" `
    -LogonType Interactive

# Yield Curves fit (S13/S14/S15) is NOT independently scheduled — it has no standalone
# trigger. It runs chained from inside run-market-quotes.cmd (called by MarketQuotes, above)
# and inside run-fedinvest.cmd (called by YieldsFromFedInvestPrices, above), each on
# success only, via YieldCurves/scripts/run-yield-curves.cmd. Both are its actual inputs
# (MarketQuotes.csv and YieldsFromFedInvestPrices.csv), so it re-fits whenever
# either one actually changed rather than on its own fixed clock.
# It also runs as the last step of run-cpi-history.cmd (the CpiHistory task, below), because a new
# Ref CPI (S3) changes the SA Yield of every TIPS in it.

# ---------------------------------------------------------------------------
# CPI tasks  -  triggers set weekly by CpiReleaseSchedule, not by this script
# ---------------------------------------------------------------------------
# CpiHistory and RefCpiCheck run only on Release Dates of CPI release schedule (S19), one trigger per
# date (RefCpiCheck on the day after). They are Interactive tasks created by the user's own non-elevated token, because only such
# a token can change them: a task created by an elevated process (every S4U task, and every task
# this script registers) is refused ("Access is denied") to a non-elevated one. So this script
# neither registers nor changes them. CpiReleaseSchedule does, every Sunday, through
# scripts/syncCpiTasks.ps1, and it is itself Interactive so that it runs with that same token.
# BLS does not release the CPI on a Sunday, so the refresh never falls on a Release Date.
# Interactive tasks run only while the user is logged on; StartWhenAvailable runs a missed one at
# the next logon, and run-cpi-history.cmd and checkDailyRefCpi.js end at once unless that day is still
# a Release Date (the day after one, for the check).

# CpiReleaseSchedule  -  Sundays 6:20am PT
# The page lists about thirteen months ahead, so a weekly run adds each new month within a week of
# BLS listing it and picks up a moved date the same way.
Register-CmdTask "CpiReleaseSchedule" `
    "Fetch the BLS CPI release schedule, replace bls/CpiReleaseSchedule.csv in R2, set the CpiHistory and RefCpiCheck triggers to its Release Dates" `
    @(New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At "6:20am") `
    "$ProjectDir\scripts\run-cpi-release-schedule.cmd" `
    -LogonType Interactive

# CpiHistory and RefCpiCheck created as S4U by an earlier version of this script cannot be changed
# without elevation, so they are removed here and recreated, Interactive, by the first run below.
foreach ($name in 'CpiHistory', 'RefCpiCheck') {
    $t = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
    if ($t -and "$($t.Principal.LogonType)" -ne 'Interactive') {
        Unregister-ScheduledTask -TaskName $name -Confirm:$false
        Write-Host "  [REMOVED] $name (S4U)"
    }
}
# This script is elevated, so a task started from it is not: Task Scheduler runs an Interactive
# task as the user, with the user's non-elevated token.
Start-ScheduledTask -TaskName "CpiReleaseSchedule"
Write-Host "  [STARTED] CpiReleaseSchedule, which registers CpiHistory and RefCpiCheck. See logs/cpi-release-schedule.log."

# ---------------------------------------------------------------------------

Write-Host ""
Write-Host "Done. All tasks registered."
Write-Host "Verify: schtasks /query /fo table | findstr /i Yields"
Stop-Transcript | Out-Null
