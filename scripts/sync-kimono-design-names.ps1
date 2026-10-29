[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

Write-Host ""
Write-Host "=== SYNCHRONIZE BILINGUAL KIMONO DESIGN NAMES ===" -ForegroundColor Cyan
& node --env-file=.env scripts/assign-optimized-kimono-images.mjs --names-only
if ($LASTEXITCODE -ne 0) { throw "Kimono design-name synchronization failed with exit code $LASTEXITCODE." }
