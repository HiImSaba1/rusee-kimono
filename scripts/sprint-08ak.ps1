[CmdletBinding()]
param([ValidateSet("Verify")][string]$Action = "Verify")

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

Invoke-Step "VERIFIED SALE FAN-OUT AND REPLAY CONTRACT" {
    node --env-file=.env node_modules/vitest/vitest.mjs run tests/payment-events.integration.test.ts
}
Invoke-Step "SPRINT 08AK COMPLETE VERIFICATION" {
    powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Full
}
