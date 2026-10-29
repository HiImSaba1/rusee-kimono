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
    Invoke-Step "GENERATE DURABLE AUTOMATION MIGRATION" { npm run db:generate }
    Invoke-Step "APPLY DURABLE AUTOMATION MIGRATION" { node --env-file=.env scripts/migrate-database.mjs }
    exit 0
}

Invoke-Step "AUTOMATION RETRY AND REDACTION CONTRACT" { node --env-file=.env node_modules/vitest/vitest.mjs run src/features/automation/policy.test.ts }
Invoke-Step "SPRINT 08AJ COMPLETE VERIFICATION" { powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Full }
