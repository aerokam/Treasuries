# Task registration helpers, dot-sourced by setup-windows-tasks.ps1 and syncCpiTasks.ps1 so a task is
# registered the same way wherever it is registered. The caller defines $ProjectDir and $NodeExe.

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
