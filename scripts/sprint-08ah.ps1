[CmdletBinding()]
param([ValidateSet("Prepare", "Verify")][string]$Action = "Verify")

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

function Invoke-Step([string]$Name, [scriptblock]$Command) {
    Write-Host ""
    Write-Host "=== $Name ===" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE." }
}

if ($Action -eq "Prepare") {
    Invoke-Step "GENERATE VERSIONED EMAIL TEMPLATE MIGRATION" { npm run db:generate }
    Invoke-Step "REPAIR INTERRUPTED UNRECORDED EMAIL TEMPLATE MIGRATION" { node --env-file=.env scripts/repair-interrupted-0016.mjs }
    Invoke-Step "APPLY VERSIONED EMAIL TEMPLATE MIGRATION" { node --env-file=.env scripts/migrate-database.mjs }
    Invoke-Step "INITIALIZE SYSTEM EMAIL TEMPLATE DRAFTS" { node --env-file=.env scripts/seed-email-templates.mjs }
    exit 0
}

Invoke-Step "SPRINT 08AH VERSIONED EMAIL TEMPLATE VERIFICATION" {
    powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Full
}
