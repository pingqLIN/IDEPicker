# Fix Antigravity Protocol Handler in Registry
# 修正 Antigravity 協議處理器的註冊表設定

param(
    [ValidateSet("Machine", "User", "HKCR")]
    [string]$Scope = "Machine",
    [string]$AntigravityPath = "C:\Dev\bin\Antigravity.exe",
    [switch]$NoPause
)

$RegistryPath = switch ($Scope) {
    "Machine" { "HKLM:\Software\Classes\antigravity\shell\open\command" }
    "User" { "HKCU:\Software\Classes\antigravity\shell\open\command" }
    "HKCR" { "HKCR:\antigravity\shell\open\command" }
}

# 正確的指令格式 (從 VS Code 源碼確認):
# "C:\Dev\bin\Antigravity.exe" "--open-url" "--" "%1"
$NewCommand = "`"$AntigravityPath`" `"--open-url`" `"--`" `"%1`""

Write-Host "🔍 Checking Registry Path: $RegistryPath"
try {
    if (-not (Test-Path $RegistryPath)) {
        Write-Host "➕ Registry key not found; creating: $RegistryPath"
        New-Item -Path $RegistryPath -Force | Out-Null
    }

    $current = (Get-ItemProperty -Path $RegistryPath -ErrorAction SilentlyContinue).'(default)'
    Write-Host "📝 Current Value: $current"

    if ($current -ne $NewCommand) {
        Write-Host "✨ Updating to: $NewCommand"
        Set-ItemProperty -Path $RegistryPath -Name "(default)" -Value $NewCommand
        Write-Host "✅ Registry updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "✅ Registry is already set correctly." -ForegroundColor Green
    }
} catch {
    Write-Error "❌ Failed to update registry. Please run as Administrator."
    Write-Error $_
    exit 1
}

if (-not $NoPause) {
    Write-Host "`nPress any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
