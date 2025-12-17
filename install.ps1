################################################################################
#                                                                              #
#  AIDA Installation Script - Windows                                         #
#                                                                              #
################################################################################
#
# PURPOSE:
#   First-time installation script for AIDA on Windows systems.
#   Installs dependencies and sets up the AIDA folder structure and database.
#
# USAGE:
#   .\install.ps1
#
# REQUIREMENTS:
#   - Bun runtime (https://bun.sh)
#   - PowerShell execution policy allowing script execution
#     (run as admin: Set-ExecutionPolicy RemoteSigned)
#
# STEPS:
#   1. Check if Bun is installed
#   2. Install npm dependencies (in .system\ directory)
#   3. Run the TypeScript setup script to create folders and initialize database
#
################################################################################

# Stop on errors
$ErrorActionPreference = "Stop"

# Header
Write-Host ""
Write-Host "╔═════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║                     AIDA INSTALLATION - Windows                            ║" -ForegroundColor Blue
Write-Host "╚═════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Check if Bun is installed
Write-Host "[1/3] Checking for Bun runtime..." -ForegroundColor Blue
try {
    $bunVersion = bun --version
    Write-Host "✓ Bun found (version $bunVersion)" -ForegroundColor Green
} catch {
    Write-Host "✗ Bun is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Bun first:"
    Write-Host "  powershell -c `"irm bun.sh/install.ps1|iex`""
    Write-Host ""
    Write-Host "Or visit: https://bun.sh"
    exit 1
}
Write-Host ""

# Install dependencies
Write-Host "[2/3] Installing dependencies..." -ForegroundColor Blue
Push-Location .system
try {
    bun install
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host ""

# Check for config file and offer to create separated setup
Write-Host "[3/4] Checking AIDA configuration..." -ForegroundColor Blue
if (-not (Test-Path ".system\config\aida-paths.json")) {
    Write-Host "No configuration found."
    Write-Host ""
    Write-Host "AIDA can run in two modes:"
    Write-Host "  1. Legacy mode: All files in this directory (current behavior)"
    Write-Host "  2. Separated mode: System files here, data in OneDrive (recommended for sync)"
    Write-Host ""

    $response = Read-Host "Create separated setup? (y/n)"

    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host ""
        $pkmPath = Read-Host "Enter OneDrive PKM path (e.g., $env:USERPROFILE\OneDrive\AIDA-PKM)"

        # Expand environment variables
        $pkmPath = [System.Environment]::ExpandEnvironmentVariables($pkmPath)
        $localRoot = (Get-Location).Path

        # Create config directory
        New-Item -ItemType Directory -Force -Path ".system\config" | Out-Null

        # Create config file
        $configContent = @"
{
  "_meta": {
    "version": "1.0"
  },
  "paths": {
    "pkm_root": "$($pkmPath -replace '\\', '\\\\')",
    "local_root": "$($localRoot -replace '\\', '\\\\')"
  }
}
"@

        $configContent | Out-File -FilePath ".system\config\aida-paths.json" -Encoding UTF8

        Write-Host "✓ Config created" -ForegroundColor Green
        Write-Host "  PKM data will be stored in: $pkmPath"
        Write-Host "  System files remain in: $localRoot"
    } else {
        Write-Host "ℹ Running in legacy mode (all files in same directory)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Run setup script
Write-Host "[4/4] Running setup script..." -ForegroundColor Blue
try {
    bun run .system/tools/setup.ts
    Write-Host "✓ Setup completed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Setup failed" -ForegroundColor Red
    exit 1
}

# Success
Write-Host ""
Write-Host "╔═════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    INSTALLATION COMPLETE                                    ║" -ForegroundColor Green
Write-Host "╚═════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "AIDA is now installed and ready to use!"
Write-Host ""
