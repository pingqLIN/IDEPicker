<#
.SYNOPSIS
    Install IDE Link Interceptor Native Messaging Host for Chrome/Edge

.DESCRIPTION
    This script registers the Native Messaging Host in Windows Registry,
    allowing the browser extension to communicate with local IDE CLI tools.

.PARAMETER ExtensionId
    The Chrome extension ID (found in chrome://extensions with Developer mode enabled)

.PARAMETER Browser
    Target browser: 'chrome' or 'edge' (default: chrome)

.PARAMETER Uninstall
    Remove the Native Messaging Host registration

.EXAMPLE
    .\install.ps1 -ExtensionId "abcdefghijklmnopqrstuvwxyz123456"
    
.EXAMPLE
    .\install.ps1 -ExtensionId "abcdefghijklmnopqrstuvwxyz123456" -Browser edge
    
.EXAMPLE
    .\install.ps1 -Uninstall
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$ExtensionId,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('chrome', 'edge')]
    [string]$Browser = 'chrome',
    
    [Parameter(Mandatory=$false)]
    [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'

$HostName = "com.idelinkinterceptor.host"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ManifestTemplatePath = Join-Path $ScriptDir "$HostName.json"
$ManifestPath = Join-Path $ScriptDir "$HostName.configured.json"
$WrapperPath = Join-Path $ScriptDir "ide-link-host-wrapper.bat"

$RegistryPaths = @{
    'chrome' = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName"
    'edge'   = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\$HostName"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = 'White')
    Write-Host $Message -ForegroundColor $Color
}

function Test-Prerequisites {
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) {
        Write-ColorOutput "ERROR: Node.js is not installed or not in PATH" Red
        Write-ColorOutput "Please install Node.js from https://nodejs.org/" Yellow
        exit 1
    }
    
    $nodeVersion = & node --version
    Write-ColorOutput "Found Node.js $nodeVersion" Green
    
    if (-not (Test-Path $ManifestTemplatePath)) {
        Write-ColorOutput "ERROR: Manifest template not found: $ManifestTemplatePath" Red
        exit 1
    }
    
    if (-not (Test-Path $WrapperPath)) {
        Write-ColorOutput "ERROR: Wrapper script not found: $WrapperPath" Red
        exit 1
    }
}

function Install-NativeHost {
    param([string]$ExtId, [string]$TargetBrowser)
    
    Write-ColorOutput "`n=== Installing IDE Link Interceptor Native Host ===" Cyan
    Write-ColorOutput "Browser: $TargetBrowser" White
    Write-ColorOutput "Extension ID: $ExtId" White
    
    if ($ExtId -notmatch '^[a-z]{32}$') {
        Write-ColorOutput "WARNING: Extension ID format unexpected (expected 32 lowercase letters)" Yellow
    }
    
    $manifestContent = Get-Content $ManifestTemplatePath -Raw | ConvertFrom-Json
    $manifestContent.allowed_origins = @("chrome-extension://$ExtId/")
    $manifestContent.path = $WrapperPath
    
    $manifestContent | ConvertTo-Json -Depth 10 | Set-Content $ManifestPath -Encoding UTF8
    Write-ColorOutput "Created manifest: $ManifestPath" Green
    
    $regPath = $RegistryPaths[$TargetBrowser]
    $regParent = Split-Path $regPath -Parent
    
    if (-not (Test-Path $regParent)) {
        New-Item -Path $regParent -Force | Out-Null
    }
    
    New-Item -Path $regPath -Force | Out-Null
    Set-ItemProperty -Path $regPath -Name "(Default)" -Value $ManifestPath
    
    Write-ColorOutput "Registered in Windows Registry: $regPath" Green
    
    Write-ColorOutput "`n=== Installation Complete ===" Cyan
    Write-ColorOutput "Please restart your browser for changes to take effect." Yellow
}

function Uninstall-NativeHost {
    Write-ColorOutput "`n=== Uninstalling IDE Link Interceptor Native Host ===" Cyan
    
    foreach ($browser in $RegistryPaths.Keys) {
        $regPath = $RegistryPaths[$browser]
        if (Test-Path $regPath) {
            Remove-Item -Path $regPath -Force
            Write-ColorOutput "Removed registry key for $browser" Green
        }
    }
    
    if (Test-Path $ManifestPath) {
        Remove-Item $ManifestPath -Force
        Write-ColorOutput "Removed configured manifest" Green
    }
    
    Write-ColorOutput "`n=== Uninstallation Complete ===" Cyan
}

if ($Uninstall) {
    Uninstall-NativeHost
    exit 0
}

if (-not $ExtensionId) {
    Write-ColorOutput "IDE Link Interceptor - Native Host Installer" Cyan
    Write-ColorOutput "=============================================" Cyan
    Write-ColorOutput ""
    Write-ColorOutput "To find your Extension ID:" Yellow
    Write-ColorOutput "1. Open chrome://extensions (or edge://extensions)" White
    Write-ColorOutput "2. Enable 'Developer mode' in the top right" White
    Write-ColorOutput "3. Find 'IDE Link Interceptor' and copy the ID" White
    Write-ColorOutput "   (looks like: abcdefghijklmnopqrstuvwxyz123456)" White
    Write-ColorOutput ""
    
    $ExtensionId = Read-Host "Enter Extension ID"
    
    if (-not $ExtensionId) {
        Write-ColorOutput "ERROR: Extension ID is required" Red
        exit 1
    }
}

Test-Prerequisites
Install-NativeHost -ExtId $ExtensionId -TargetBrowser $Browser
