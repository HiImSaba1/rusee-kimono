[CmdletBinding()]
param([ValidateSet("Verify")][string]$Action="Verify")
Set-StrictMode -Version Latest
$ErrorActionPreference="Stop"
$Utf8NoBom=[System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding=$Utf8NoBom
[Console]::OutputEncoding=$Utf8NoBom
$OutputEncoding=$Utf8NoBom
$root=Split-Path -Parent $PSScriptRoot
$artifact=Join-Path $root "artifacts\verification"
$diagnostics=Join-Path $artifact "sprint-08ar-email-recovery-diagnostics.txt"
$results=Join-Path $artifact "sprint-08ar-results.txt"
Set-Location -LiteralPath $root
New-Item -ItemType Directory -Force -Path $artifact|Out-Null
[System.IO.File]::WriteAllText($diagnostics,"Rusee Sprint 08AR email delivery recovery$([Environment]::NewLine)",$Utf8NoBom)
function Invoke-Step([string]$Name,[scriptblock]$Command,[string]$Log){Write-Host "";Write-Host "=== $Name ===" -ForegroundColor Cyan;[System.IO.File]::AppendAllText($Log,"`n=== $Name ===$([Environment]::NewLine)",$Utf8NoBom);$code=0;$old=$ErrorActionPreference;try{$ErrorActionPreference="Continue";& $Command 2>&1|ForEach-Object{$line=[string]$_;[Console]::WriteLine($line);[System.IO.File]::AppendAllText($Log,$line+[Environment]::NewLine,$Utf8NoBom)};if($null-ne $LASTEXITCODE){$code=$LASTEXITCODE}}catch{$line=$_|Out-String;[Console]::WriteLine($line);[System.IO.File]::AppendAllText($Log,$line+[Environment]::NewLine,$Utf8NoBom);$code=1}finally{$ErrorActionPreference=$old};if($code-ne 0){throw "$Name failed with exit code $code."}}
Invoke-Step "STALE DELIVERY RECOVERY AND ERROR REDACTION" {node --env-file=.env node_modules/vitest/vitest.mjs run tests/email-delivery-recovery.integration.test.ts src/features/automation/policy.test.ts} $diagnostics
[System.IO.File]::WriteAllText($results,"Rusee Sprint 08AR complete verification$([Environment]::NewLine)",$Utf8NoBom)
Invoke-Step "COMPLETE QUALITY GATE" {powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Full} $results
$summary="PASS - stale leases recover safely, attempt ceilings hold, errors are redacted and complete quality checks passed. No SMTP or provider call was made.";[Console]::WriteLine($summary);[System.IO.File]::AppendAllText($results,$summary+[Environment]::NewLine,$Utf8NoBom)
Write-Host "Email recovery diagnostics saved to: $diagnostics" -ForegroundColor Green
Write-Host "Verification results saved to: $results" -ForegroundColor Green
