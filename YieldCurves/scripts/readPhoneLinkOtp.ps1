# Reads an SMS verification code from the Phone Link app via Windows UI
# Automation. Two modes so the caller can diff "before" vs "after" requesting a code:
#   -Mode baseline  : print the current newest matching message text (may be empty)
#   -Mode wait       : poll until the newest matching message text changes from
#                       -Baseline, then print just the 6-digit code
param(
  [ValidateSet('baseline', 'wait')]
  [string]$Mode = 'wait',
  [string]$Baseline = '',
  [int]$TimeoutSec = 60,
  [int]$PollIntervalSec = 3
)

Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes

function Get-LatestCodeMessageText {
  $root = [System.Windows.Automation.AutomationElement]::RootElement
  $winCond = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::NameProperty, 'Phone Link')
  $win = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $winCond)
  if (-not $win) { return $null }

  $msgListCond = New-Object System.Windows.Automation.AndCondition(
    (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::List)),
    (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, 'Messages'))
  )
  $msgList = $win.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $msgListCond)
  if (-not $msgList) { return $null }

  $itemCond = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::ListItem)
  $items = $msgList.FindAll([System.Windows.Automation.TreeScope]::Children, $itemCond)
  if ($items.Count -eq 0) { return $null }

  # Walk from the newest item backwards, skipping date separators, to the last
  # message that actually contains a code.
  for ($i = $items.Count - 1; $i -ge 0; $i--) {
    $name = $items[$i].Current.Name
    if ($name -match 'Code is:\s*(\d{6})') { return $name }
  }
  return $null
}

# A minimized Phone Link window does not refresh its message list (the 5:05 AM run on
# 2026-10-13 never saw a code that had arrived). Restore it for the read, then put it back.
function Get-PhoneLinkWindow {
  $root = [System.Windows.Automation.AutomationElement]::RootElement
  $cond = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::NameProperty, 'Phone Link')
  return $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $cond)
}

function Restore-PhoneLinkIfMinimized {
  $w = Get-PhoneLinkWindow
  if (-not $w) { return $false }
  try {
    $p = $w.GetCurrentPattern([System.Windows.Automation.WindowPattern]::Pattern)
    if ($p.Current.WindowVisualState -eq [System.Windows.Automation.WindowVisualState]::Minimized) {
      $p.SetWindowVisualState([System.Windows.Automation.WindowVisualState]::Normal)
      Start-Sleep -Seconds 2
      return $true
    }
  } catch {}
  return $false
}

function Minimize-PhoneLink {
  $w = Get-PhoneLinkWindow
  if (-not $w) { return }
  try {
    $w.GetCurrentPattern([System.Windows.Automation.WindowPattern]::Pattern).SetWindowVisualState(
      [System.Windows.Automation.WindowVisualState]::Minimized)
  } catch {}
}

$restored = Restore-PhoneLinkIfMinimized

if ($Mode -eq 'baseline') {
  Write-Output (Get-LatestCodeMessageText)
  if ($restored) { Minimize-PhoneLink }
  exit 0
}

$deadline = (Get-Date).AddSeconds($TimeoutSec)
while ((Get-Date) -lt $deadline) {
  $text = Get-LatestCodeMessageText
  if ($text -and $text -ne $Baseline -and $text -match 'Code is:\s*(\d{6})') {
    if ($restored) { Minimize-PhoneLink }
    Write-Output $Matches[1]
    exit 0
  }
  Start-Sleep -Seconds $PollIntervalSec
}
if ($restored) { Minimize-PhoneLink }

# Timed out: say why on stderr (surfaces in market-quotes.log), so the next failure is diagnosable.
$root = [System.Windows.Automation.AutomationElement]::RootElement
$winCond = New-Object System.Windows.Automation.PropertyCondition(
  [System.Windows.Automation.AutomationElement]::NameProperty, 'Phone Link')
$win = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $winCond)
if (-not $win) {
  [Console]::Error.WriteLine('Phone Link window not found (app closed or not exposed to UI Automation).')
} else {
  $state = 'unknown'
  try { $state = $win.GetCurrentPattern([System.Windows.Automation.WindowPattern]::Pattern).Current.WindowVisualState } catch {}
  $msgListCond = New-Object System.Windows.Automation.AndCondition(
    (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::List)),
    (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, 'Messages'))
  )
  $msgList = $win.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $msgListCond)
  if (-not $msgList) {
    [Console]::Error.WriteLine("Phone Link window found (state: $state) but no 'Messages' list (another view open?).")
  } else {
    $itemCond = New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::ListItem)
    $n = $msgList.FindAll([System.Windows.Automation.TreeScope]::Children, $itemCond).Count
    [Console]::Error.WriteLine("Phone Link window state: $state; Messages list has $n items; newest code message unchanged from baseline.")
  }
}
exit 1
