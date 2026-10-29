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
$DiagnosticFile = Join-Path $ArtifactDirectory "sprint-08ay-pre-bank-diagnostics.txt"
$ResultFile = Join-Path $ArtifactDirectory "sprint-08ay-results.txt"
Set-Location -LiteralPath $ProjectRoot
New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
[System.IO.File]::WriteAllText($DiagnosticFile, "Rusee Sprint 08AY pre-bank closure diagnostics$([Environment]::NewLine)", $Utf8NoBom)

function Invoke-LoggedStep([string]$Name, [scriptblock]$Command, [string]$LogFile) {
    Write-Host ""
    Write-Host "=== $Name ===" -ForegroundColor Cyan
    [System.IO.File]::AppendAllText($LogFile, "`n=== $Name ===$([Environment]::NewLine)", $Utf8NoBom)
    $StepExitCode = 0
    $PreviousErrorPreference = $ErrorActionPreference
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
    finally { $ErrorActionPreference = $PreviousErrorPreference }
    if ($StepExitCode -ne 0) { throw "$Name failed with exit code $StepExitCode." }
}

Invoke-LoggedStep "PRE-BANK RELEASE CONTRACT" {
    node --env-file=.env node_modules/vitest/vitest.mjs run tests/pre-bank-readiness.test.ts tests/production-release.test.ts src/features/health/launch-approvals.test.ts
} $DiagnosticFile

[System.IO.File]::WriteAllText($ResultFile, "Rusee Sprint 08AY complete verification$([Environment]::NewLine)", $Utf8NoBom)
Invoke-LoggedStep "COMPLETE QUALITY GATE" {
    powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Full
} $ResultFile

$Summary = "PASS - the pre-bank evidence gate, secret-free operational artifact contract, launch-approval boundary and complete quality gate passed. No SMTP, payment, production mutation, deployment or owner approval was invoked."
[Console]::WriteLine($Summary)
[System.IO.File]::AppendAllText($ResultFile, $Summary + [Environment]::NewLine, $Utf8NoBom)
Write-Host "Pre-bank diagnostics saved to: $DiagnosticFile" -ForegroundColor Green
Write-Host "Verification results saved to: $ResultFile" -ForegroundColor Green
