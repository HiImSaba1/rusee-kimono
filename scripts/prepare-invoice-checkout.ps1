$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

function Invoke-Step([string]$Name, [scriptblock]$Command) {
    Write-Host "`n=== $Name ===" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE."
    }
}

Invoke-Step "GENERATE BUSINESS INVOICE CHECKOUT MIGRATION" { npm run db:generate }
Invoke-Step "APPLY BUSINESS INVOICE CHECKOUT MIGRATION" { npm run db:migrate }

Write-Host "`nPASS - invoice checkout database fields are ready." -ForegroundColor Green
