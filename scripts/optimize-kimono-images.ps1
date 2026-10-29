[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

Write-Host ""
Write-Host "=== CREATE 500 KB WEBP KIMONO IMAGE LIBRARY ===" -ForegroundColor Cyan
& node scripts/optimize-kimono-images.mjs
if ($LASTEXITCODE -ne 0) { throw "Kimono image optimization failed with exit code $LASTEXITCODE." }
