[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = $Utf8NoBom
[Console]::OutputEncoding = $Utf8NoBom
$OutputEncoding = $Utf8NoBom
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ArtifactDirectory = Join-Path $ProjectRoot "artifacts\verification"
$ResultFile = Join-Path $ArtifactDirectory "release-candidate-results.txt"

Set-Location -LiteralPath $ProjectRoot
New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
[System.IO.File]::WriteAllText($ResultFile, "Rusee release-candidate verification$([Environment]::NewLine)", $Utf8NoBom)

function Invoke-LoggedStep {
    param([string]$Name, [scriptblock]$Command)
    Write-Host ""
    Write-Host "=== $Name ===" -ForegroundColor Cyan
    [System.IO.File]::AppendAllText($ResultFile, "`n=== $Name ===$([Environment]::NewLine)", $Utf8NoBom)
    $StepExitCode = 0
    $PreviousPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"
        & $Command 2>&1 | ForEach-Object {
            $Line = [string]$_
            [Console]::WriteLine($Line)
            [System.IO.File]::AppendAllText($ResultFile, $Line + [Environment]::NewLine, $Utf8NoBom)
        }
        if ($null -ne $LASTEXITCODE) { $StepExitCode = $LASTEXITCODE }
    }
    catch {
        $Line = $_ | Out-String
        [Console]::WriteLine($Line)
        [System.IO.File]::AppendAllText($ResultFile, $Line + [Environment]::NewLine, $Utf8NoBom)
        $StepExitCode = 1
    }
    finally { $ErrorActionPreference = $PreviousPreference }
    if ($StepExitCode -ne 0) { throw "$Name failed with exit code $StepExitCode." }
}

Invoke-LoggedStep "RELEASE CANDIDATE CATALOGUE AND CONTENT AUDIT" {
    node --env-file=.env scripts/release-candidate-audit.mjs
}
Invoke-LoggedStep "OPTIMIZED KIMONO IMAGE LIBRARY" {
    node --env-file=.env scripts/verify-optimized-kimono-images.mjs
}
Invoke-LoggedStep "FULL STATIC, UNIT, INTEGRATION AND BUILD GATE" {
    powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Full
}
Invoke-LoggedStep "PRODUCTION ARCHIVE CONTRACT" {
    node --env-file=.env node_modules/vitest/vitest.mjs run tests/production-release.test.ts src/lib/seo/indexing.test.ts src/lib/seo/product-schema.test.ts
}

$Summary = "PASS - catalogue/content audit, optimized images, ESLint, TypeScript, unit/integration tests, production build, diff checks and release archive contracts completed. No archive was created and nothing was deployed."
[Console]::WriteLine($Summary)
[System.IO.File]::AppendAllText($ResultFile, "`n$Summary$([Environment]::NewLine)", $Utf8NoBom)
Write-Host "Verification results saved to: $ResultFile" -ForegroundColor Green
