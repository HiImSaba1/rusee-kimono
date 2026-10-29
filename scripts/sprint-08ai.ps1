[CmdletBinding()]
param([ValidateSet("Verify")][string]$Action = "Verify")
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot
Write-Host ""
Write-Host "=== SPRINT 08AI EMAIL TEMPLATE CRUD AND STOREFRONT TRANSITION VERIFICATION ===" -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Full
if ($LASTEXITCODE -ne 0) { throw "Sprint 08AI verification failed with exit code $LASTEXITCODE." }
