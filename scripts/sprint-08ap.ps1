[CmdletBinding()]
param([ValidateSet("Verify")][string]$Action="Verify")
Set-StrictMode -Version Latest
$ErrorActionPreference="Stop"
$Utf8NoBom=[System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding=$Utf8NoBom
[Console]::OutputEncoding=$Utf8NoBom
$OutputEncoding=$Utf8NoBom
$ProjectRoot=Split-Path -Parent $PSScriptRoot
$ArtifactDirectory=Join-Path $ProjectRoot "artifacts\verification"
$DiagnosticFile=Join-Path $ArtifactDirectory "sprint-08ap-template-history-diagnostics.txt"
$ResultFile=Join-Path $ArtifactDirectory "sprint-08ap-results.txt"
Set-Location -LiteralPath $ProjectRoot
New-Item -ItemType Directory -Force -Path $ArtifactDirectory|Out-Null
[System.IO.File]::WriteAllText($DiagnosticFile,"Rusee Sprint 08AP template history diagnostics$([Environment]::NewLine)",$Utf8NoBom)
function Invoke-Step([string]$Name,[scriptblock]$Command,[string]$LogFile) {
    Write-Host ""
    Write-Host "=== $Name ===" -ForegroundColor Cyan
    [System.IO.File]::AppendAllText($LogFile,"`n=== $Name ===$([Environment]::NewLine)",$Utf8NoBom)
    $code=0
    $previous=$ErrorActionPreference
    try {
        $ErrorActionPreference="Continue"
        & $Command 2>&1 | ForEach-Object {
            $line=[string]$_
            [Console]::WriteLine($line)
            [System.IO.File]::AppendAllText($LogFile,$line+[Environment]::NewLine,$Utf8NoBom)
        }
        if($null-ne $LASTEXITCODE){$code=$LASTEXITCODE}
    } catch {
        $line=$_|Out-String
        [Console]::WriteLine($line)
        [System.IO.File]::AppendAllText($LogFile,$line+[Environment]::NewLine,$Utf8NoBom)
        $code=1
    } finally {$ErrorActionPreference=$previous}
    if($code-ne 0){throw "$Name failed with exit code $code."}
}
Invoke-Step "TRANSACTIONAL VERSION ACTIVATION AND ROLLBACK" {node --env-file=.env node_modules/vitest/vitest.mjs run tests/email-template-versioning.integration.test.ts} $DiagnosticFile
Invoke-Step "PREPARE LOCAL EPHEMERAL ADMIN" {node --env-file=.env scripts/e2e-admin-fixture.mjs} $DiagnosticFile
try{Invoke-Step "TEMPLATE HISTORY BROWSER ACCEPTANCE" {node --env-file=.env node_modules/@playwright/test/cli.js test e2e/admin-email-template-history.spec.ts} $DiagnosticFile}finally{try{Invoke-Step "REMOVE LOCAL EPHEMERAL ADMIN" {node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup} $DiagnosticFile}catch{Write-Warning $_}}
[System.IO.File]::WriteAllText($ResultFile,"Rusee Sprint 08AP complete verification$([Environment]::NewLine)",$Utf8NoBom)
Invoke-Step "COMPLETE QUALITY GATE" {powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Full} $ResultFile
$summary="PASS - immutable history, transactional activation, safe rollback, browser accessibility and complete quality checks passed.";[Console]::WriteLine($summary);[System.IO.File]::AppendAllText($ResultFile,$summary+[Environment]::NewLine,$Utf8NoBom)
Write-Host "Template history diagnostics saved to: $DiagnosticFile" -ForegroundColor Green
Write-Host "Verification results saved to: $ResultFile" -ForegroundColor Green
