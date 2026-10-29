[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

Write-Host ""
Write-Host "=== ASSIGN OPTIMIZED KIMONO IMAGES ===" -ForegroundColor Cyan
& node --env-file=.env scripts/assign-optimized-kimono-images.mjs
if ($LASTEXITCODE -ne 0) { throw "Optimized kimono image assignment failed with exit code $LASTEXITCODE." }
