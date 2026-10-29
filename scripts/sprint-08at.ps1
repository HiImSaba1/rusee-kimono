[CmdletBinding()]
param([ValidateSet("Verify")][string]$Action = "Verify")

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = $Utf8NoBom
[Console]::OutputEncoding = $Utf8NoBom
$OutputEncoding = $Utf8NoBom

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ArtifactDirectory = Join-Path $ProjectRoot "artifacts\verification"
$DiagnosticFile = Join-Path $ArtifactDirectory "sprint-08at-email-reconciliation-diagnostics.txt"
$ResultFile = Join-Path $ArtifactDirectory "sprint-08at-results.txt"
Set-Location -LiteralPath $ProjectRoot
New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
[System.IO.File]::WriteAllText($DiagnosticFile, "Rusee Sprint 08AT email reconciliation$([Environment]::NewLine)", $Utf8NoBom)

function Invoke-LoggedStep {
    param([string]$Name, [scriptblock]$Command, [string]$LogFile)
    Write-Host ""
    Write-Host "=== $Name ===" -ForegroundColor Cyan
    [System.IO.File]::AppendAllText($LogFile, "`n=== $Name ===$([Environment]::NewLine)", $Utf8NoBom)
    $StepExitCode = 0
    $PreviousPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"
        & $Command 2>&1 | ForEach-Object {
            $Line = [string]$_
            [Console]::WriteLine($Line)
            [System.IO.File]::AppendAllText($LogFile, $Line + [Environment]::NewLine, $Utf8NoBom)
        }
        if ($null -ne $LASTEXITCODE) { $StepExitCode = $LASTEXITCODE }
    }
    catch {
        $Line = $_ | Out-String
        [Console]::WriteLine($Line)
        [System.IO.File]::AppendAllText($LogFile, $Line + [Environment]::NewLine, $Utf8NoBom)
        $StepExitCode = 1
    }
    finally { $ErrorActionPreference = $PreviousPreference }
    if ($StepExitCode -ne 0) { throw "$Name failed with exit code $StepExitCode." }
}

Invoke-LoggedStep "ISOLATED EMAIL RECONCILIATION" {
    node --env-file=.env node_modules/vitest/vitest.mjs run tests/email-reconciliation.integration.test.ts
} $DiagnosticFile
Invoke-LoggedStep "PREPARE LOCAL EPHEMERAL ADMIN" {
    node --env-file=.env scripts/e2e-admin-fixture.mjs
} $DiagnosticFile
try {
    Invoke-LoggedStep "EMAIL RECONCILIATION BROWSER ACCEPTANCE" {
        node --env-file=.env node_modules/@playwright/test/cli.js test e2e/admin-email-operations.spec.ts
    } $DiagnosticFile
}
finally {
    try {
        Invoke-LoggedStep "REMOVE LOCAL EPHEMERAL ADMIN" {
            node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup
        } $DiagnosticFile
    }
    catch { Write-Warning $_ }
}

[System.IO.File]::WriteAllText($ResultFile, "Rusee Sprint 08AT complete verification$([Environment]::NewLine)", $Utf8NoBom)
Invoke-LoggedStep "COMPLETE QUALITY GATE" {
    powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Full
} $ResultFile
$Summary = "PASS - missing payment, shipment and return communication is detected read-only; browser accessibility and complete quality checks passed. No SMTP or provider call was made."
[Console]::WriteLine($Summary)
[System.IO.File]::AppendAllText($ResultFile, $Summary + [Environment]::NewLine, $Utf8NoBom)
Write-Host "Email reconciliation diagnostics saved to: $DiagnosticFile" -ForegroundColor Green
Write-Host "Verification results saved to: $ResultFile" -ForegroundColor Green
