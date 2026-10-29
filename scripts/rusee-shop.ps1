[CmdletBinding()]
param(
    [ValidateSet("Help", "Status", "InstallRtk", "Install", "Dev", "Check", "Test", "Build", "Full", "DatabaseInfo", "DemoSeed", "DemoVerify", "Sprint02Migrate", "Sprint02Verify", "Sprint03Migrate", "Sprint03Verify", "Sprint04Verify", "Sprint05Prepare", "Sprint05BackupRestore", "Sprint05Verify", "Sprint06Prepare", "PrivacyRetentionDryRun", "Sprint06Verify", "Sprint07DatabaseVerify", "Sprint07StorefrontVerify", "Sprint07SeoVerify", "Sprint07BrowserPrepare", "Sprint07BrowserVerify", "Sprint08AVerify", "Sprint08BPreflight", "Sprint08BVerify", "Sprint08CVerify", "Sprint08CPrepareRelease", "Sprint08DVerify", "Sprint08EPrepare", "Sprint08EVerify", "Sprint08FPrepare", "Sprint08FVerify", "Sprint08GPrepare", "Sprint08GVerify", "Sprint08HVerify", "Sprint08HPrepareRelease", "Sprint08IVerify", "Sprint08JVerify", "Sprint08KVerify", "Sprint08LVerify", "Sprint08MVerify", "Sprint08NVerify", "Sprint08OPrepare", "Sprint08OVerify", "Sprint08PVerify", "Sprint08QVerify", "Sprint08RVerify", "Sprint08SVerify", "Sprint08TVerify", "Sprint08UVerify", "Sprint08VVerify", "Sprint08WVerify", "Sprint08XVerify", "Sprint08YVerify", "Sprint08ZPrepare", "Sprint08ZVerify", "Sprint08AAPrepare", "Sprint08AAVerify", "Sprint08ABPrepare", "Sprint08ABVerify", "Sprint08ACPrepare", "Sprint08ACVerify", "Sprint08ADVerify", "Sprint08AEVerify", "Sprint08AFPrepare", "Sprint08AFVerify", "Sprint08AGPrepare", "Sprint08AGVerify")]
    [string]$Action = "Help"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = $Utf8NoBom
[Console]::OutputEncoding = $Utf8NoBom
$OutputEncoding = $Utf8NoBom

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$RtkInstaller = Join-Path $PSScriptRoot "install-rtk.ps1"
$Rtk = Join-Path $ProjectRoot ".tools\rtk\rtk.exe"
$ArtifactDirectory = Join-Path $ProjectRoot "artifacts\verification"
$ResultFile = Join-Path $ArtifactDirectory "sprint-01-results.txt"
$Sprint02ResultFile = Join-Path $ArtifactDirectory "sprint-02-results.txt"
$Sprint03ResultFile = Join-Path $ArtifactDirectory "sprint-03-results.txt"
$Sprint04ResultFile = Join-Path $ArtifactDirectory "sprint-04-results.txt"
$Sprint05ResultFile = Join-Path $ArtifactDirectory "sprint-05-results.txt"
$Sprint06ResultFile = Join-Path $ArtifactDirectory "sprint-06-results.txt"
$Sprint07DatabaseResultFile = Join-Path $ArtifactDirectory "sprint-07-database-results.txt"
$Sprint07StorefrontResultFile = Join-Path $ArtifactDirectory "sprint-07-storefront-results.txt"
$Sprint07SeoResultFile = Join-Path $ArtifactDirectory "sprint-07-seo-results.txt"
$Sprint07BrowserResultFile = Join-Path $ArtifactDirectory "sprint-07-browser-results.txt"
$Sprint07BrowserDiagnosticFile = Join-Path $ArtifactDirectory "sprint-07-browser-diagnostics.txt"
$Sprint08AResultFile = Join-Path $ArtifactDirectory "sprint-08a-results.txt"
$Sprint08BResultFile = Join-Path $ArtifactDirectory "sprint-08b-results.txt"
$Sprint08BPreflightFile = Join-Path $ArtifactDirectory "sprint-08b-production-preflight.txt"
$Sprint08CResultFile = Join-Path $ArtifactDirectory "sprint-08c-results.txt"
$Sprint08DResultFile = Join-Path $ArtifactDirectory "sprint-08d-results.txt"
$Sprint08DDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08d-browser-diagnostics.txt"
$DemoResultFile = Join-Path $ArtifactDirectory "admin-demo-results.txt"
$Sprint08EResultFile = Join-Path $ArtifactDirectory "sprint-08e-results.txt"
$Sprint08FResultFile = Join-Path $ArtifactDirectory "sprint-08f-results.txt"
$Sprint08FDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08f-browser-diagnostics.txt"
$Sprint08GResultFile = Join-Path $ArtifactDirectory "sprint-08g-results.txt"
$Sprint08HResultFile = Join-Path $ArtifactDirectory "sprint-08h-results.txt"
$Sprint08HAuditFile = Join-Path $ArtifactDirectory "sprint-08h-launch-readiness.txt"
$Sprint08IResultFile = Join-Path $ArtifactDirectory "sprint-08i-results.txt"
$Sprint08IDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08i-browser-diagnostics.txt"
$Sprint08JResultFile = Join-Path $ArtifactDirectory "sprint-08j-results.txt"
$Sprint08JDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08j-browser-diagnostics.txt"
$Sprint08KResultFile = Join-Path $ArtifactDirectory "sprint-08k-results.txt"
$Sprint08KDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08k-browser-diagnostics.txt"
$Sprint08LResultFile = Join-Path $ArtifactDirectory "sprint-08l-results.txt"
$Sprint08LDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08l-maintenance-diagnostics.txt"
$Sprint08MResultFile = Join-Path $ArtifactDirectory "sprint-08m-results.txt"
$Sprint08NResultFile = Join-Path $ArtifactDirectory "sprint-08n-results.txt"
$Sprint08NDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08n-browser-diagnostics.txt"
$Sprint08OResultFile = Join-Path $ArtifactDirectory "sprint-08o-results.txt"
$Sprint08ODiagnosticFile = Join-Path $ArtifactDirectory "sprint-08o-admin-diagnostics.txt"
$Sprint08PResultFile = Join-Path $ArtifactDirectory "sprint-08p-results.txt"
$Sprint08PDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08p-preview-diagnostics.txt"
$Sprint08QResultFile = Join-Path $ArtifactDirectory "sprint-08q-results.txt"
$Sprint08QDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08q-publication-diagnostics.txt"
$Sprint08RResultFile = Join-Path $ArtifactDirectory "sprint-08r-results.txt"
$Sprint08RDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08r-activity-diagnostics.txt"
$Sprint08SResultFile = Join-Path $ArtifactDirectory "sprint-08s-results.txt"
$Sprint08SDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08s-team-diagnostics.txt"
$Sprint08TResultFile = Join-Path $ArtifactDirectory "sprint-08t-results.txt"
$Sprint08TDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08t-overview-diagnostics.txt"
$Sprint08UResultFile = Join-Path $ArtifactDirectory "sprint-08u-results.txt"
$Sprint08UDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08u-release-candidate-diagnostics.txt"
$Sprint08VResultFile = Join-Path $ArtifactDirectory "sprint-08v-results.txt"
$Sprint08VDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08v-performance-diagnostics.txt"
$Sprint08WResultFile = Join-Path $ArtifactDirectory "sprint-08w-results.txt"
$Sprint08WDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08w-visual-diagnostics.txt"
$Sprint08XResultFile = Join-Path $ArtifactDirectory "sprint-08x-results.txt"
$Sprint08XDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08x-checkout-recovery-diagnostics.txt"
$Sprint08YResultFile = Join-Path $ArtifactDirectory "sprint-08y-results.txt"
$Sprint08YDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08y-catalogue-readiness-diagnostics.txt"
$Sprint08ZResultFile = Join-Path $ArtifactDirectory "sprint-08z-results.txt"
$Sprint08ZDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08z-product-approval-diagnostics.txt"
$Sprint08AAResultFile = Join-Path $ArtifactDirectory "sprint-08aa-results.txt"
$Sprint08AADiagnosticFile = Join-Path $ArtifactDirectory "sprint-08aa-shipment-diagnostics.txt"
$Sprint08ABResultFile = Join-Path $ArtifactDirectory "sprint-08ab-results.txt"
$Sprint08ACResultFile = Join-Path $ArtifactDirectory "sprint-08ac-results.txt"
$Sprint08ADResultFile = Join-Path $ArtifactDirectory "sprint-08ad-results.txt"
$Sprint08AEResultFile = Join-Path $ArtifactDirectory "sprint-08ae-results.txt"
$Sprint08AEDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08ae-typography-diagnostics.txt"
$Sprint08AFResultFile = Join-Path $ArtifactDirectory "sprint-08af-results.txt"
$Sprint08AFDiagnosticFile = Join-Path $ArtifactDirectory "sprint-08af-login-diagnostics.txt"
$script:ActiveLogFile = $null

Set-Location -LiteralPath $ProjectRoot

function Write-Heading {
    param([Parameter(Mandatory)][string]$Text)
    if ($script:ActiveLogFile) {
        Write-RunnerLine ""
        Write-RunnerLine "=== $Text ==="
        return
    }

    Write-Host ""
    Write-Host "=== $Text ===" -ForegroundColor Cyan
}

function Write-RunnerLine {
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Text)

    [Console]::WriteLine($Text)
    if ($script:ActiveLogFile) {
        [System.IO.File]::AppendAllText(
            $script:ActiveLogFile,
            $Text + [Environment]::NewLine,
            [System.Text.UTF8Encoding]::new($false)
        )
    }
}

function Invoke-Native {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][scriptblock]$Command
    )

    Write-Heading $Name
    if (-not $script:ActiveLogFile) {
        & $Command
        if ($LASTEXITCODE -ne 0) {
            throw "$Name failed with exit code $LASTEXITCODE."
        }
        return
    }

    $StepExitCode = 0
    $PreviousErrorPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"
        & $Command 2>&1 | ForEach-Object { Write-RunnerLine ([string]$_) }
        if ($null -ne $LASTEXITCODE) {
            $StepExitCode = $LASTEXITCODE
        }
    }
    catch {
        Write-RunnerLine ($_ | Out-String)
        $StepExitCode = 1
    }
    finally {
        $ErrorActionPreference = $PreviousErrorPreference
    }

    Write-RunnerLine "Exit code: $StepExitCode"
    if ($StepExitCode -ne 0) {
        throw "$Name failed with exit code $StepExitCode."
    }
}

function Assert-Dependencies {
    if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot "node_modules") -PathType Container)) {
        throw "Dependencies are missing. Run: powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Install"
    }
}

function Invoke-Status {
    if (Test-Path -LiteralPath $Rtk -PathType Leaf) {
        Invoke-Native "GIT STATUS (RTK COMPRESSED)" { & $Rtk git status }
        return
    }

    Write-Host "RTK is not installed. Using compact Git fallback."
    Invoke-Native "GIT STATUS" { & git status --short }
}

function Install-Dependencies {
    Invoke-Native "LOCKED DEPENDENCY INSTALL" { & npm ci }
}

function Invoke-Checks {
    Assert-Dependencies
    Invoke-Native "ESLINT" { & npm run lint }
    Invoke-Native "TYPESCRIPT" { & npx tsc --noEmit --incremental false }
}

function Invoke-Tests {
    Assert-Dependencies
    Invoke-Native "VITEST" { & npm test }
}

function Invoke-Build {
    Assert-Dependencies
    Invoke-Native "PRODUCTION BUILD" { & npm run build }
}

function Invoke-FullVerification {
    param(
        [string]$OutputFile = $ResultFile,
        [string]$SummaryLabel = "SPRINT 01",
        [string[]]$FocusedTests = @()
    )

    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText(
        $OutputFile,
        "Ruseè Kimono $SummaryLabel verification$([Environment]::NewLine)",
        [System.Text.UTF8Encoding]::new($false)
    )
    $script:ActiveLogFile = $OutputFile
    try {
        Write-RunnerLine "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')"
        Write-RunnerLine "Project: $ProjectRoot"
        Invoke-Status
        Invoke-Checks
        if ($FocusedTests.Count -gt 0) {
            Invoke-Native "FOCUSED SPRINT TESTS" { & npm test -- @FocusedTests }
        }
        Invoke-Tests
        Invoke-Build
        Invoke-Native "DIFF CHECK" { & git diff --check }
        Invoke-Status
        Write-Heading "$SummaryLabel VERIFICATION SUMMARY"
        Write-RunnerLine "PASS - status, ESLint, TypeScript, Vitest, production build, and diff checks completed."
        Write-RunnerLine "Finished: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')"
    }
    finally {
        $script:ActiveLogFile = $null
    }
    Write-Host "Verification output saved to: $OutputFile" -ForegroundColor Green
}

function Invoke-Sprint02Migration {
    Assert-Dependencies
    Invoke-Native "GENERATE CONTACT ENQUIRY MIGRATION" { & npm run db:generate }
    Invoke-Native "APPLY CONTACT ENQUIRY MIGRATION" { & npm run db:migrate }
}

function Invoke-Sprint03Migration {
    Assert-Dependencies
    Invoke-Native "GENERATE ENQUIRY NOTIFICATION MIGRATION" { & npm run db:generate }
    Invoke-Native "APPLY ENQUIRY NOTIFICATION MIGRATION" { & npm run db:migrate }
}

function Invoke-Sprint05Preparation {
    Assert-Dependencies
    Invoke-Native "GENERATE PRODUCT INFORMATION MIGRATION" { & npm run db:generate }
    Invoke-Native "APPLY PRODUCT INFORMATION MIGRATION" { & npm run db:migrate }
    Invoke-Native "INITIALIZE PROVISIONAL PRODUCT INFORMATION" { & node --env-file=.env scripts/seed-product-information.mjs }
}

function Invoke-Sprint06Preparation {
    Assert-Dependencies
    Invoke-Native "GENERATE PRIVACY OPERATIONS MIGRATION" { & npm run db:generate }
    Invoke-Native "APPLY PRIVACY OPERATIONS MIGRATION" { & node --env-file=.env scripts/migrate-database.mjs }
}

function Invoke-Sprint07BrowserPreparation {
    Assert-Dependencies
    Invoke-Native "INSTALL PINNED BROWSER TEST TOOLING" { & npm install --save-dev --save-exact "@playwright/test@1.55.0" "@axe-core/playwright@4.10.2" "playwright-core@1.55.0" }
    Invoke-Native "INSTALL PLAYWRIGHT BROWSERS" { & npx playwright install chromium firefox webkit }
}

function Invoke-Sprint07BrowserVerification {
    Assert-Dependencies
    if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot "node_modules\@playwright\test") -PathType Container)) {
        throw "Browser tooling is missing. Run Sprint07BrowserPrepare first."
    }
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText(
        $Sprint07BrowserDiagnosticFile,
        "Rusee Kimono Sprint 07 browser diagnostics$([Environment]::NewLine)Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')$([Environment]::NewLine)Project: $ProjectRoot$([Environment]::NewLine)",
        [System.Text.UTF8Encoding]::new($false)
    )
    $script:ActiveLogFile = $Sprint07BrowserDiagnosticFile
    try {
        Invoke-Native "CROSS-BROWSER JOURNEY AND ACCESSIBILITY TESTS" { & npx playwright test }
        Write-RunnerLine "Finished: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')"
        Write-RunnerLine "PASS - cross-browser journey and accessibility tests completed."
    }
    catch {
        Write-RunnerLine "Finished: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')"
        Write-RunnerLine "FAIL - review the browser output above."
        throw
    }
    finally {
        $script:ActiveLogFile = $null
        Write-Host "Browser diagnostic output saved to: $Sprint07BrowserDiagnosticFile" -ForegroundColor Yellow
    }
    Invoke-FullVerification -OutputFile $Sprint07BrowserResultFile -SummaryLabel "SPRINT 07 BROWSER" -FocusedTests @("src/features/catalogue/product-selection.test.ts", "src/lib/seo/product-schema.test.ts")
}

function Invoke-Sprint08BPreflight {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08BPreflightFile, "Ruseè production preflight$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08BPreflightFile
    try {
        Invoke-Native "REDACTED PRODUCTION CAPABILITY PREFLIGHT" { & node --env-file=.env scripts/production-preflight.mjs }
    }
    finally {
        $script:ActiveLogFile = $null
    }
    Write-Host "Preflight output saved to: $Sprint08BPreflightFile" -ForegroundColor Green
}

function Invoke-Sprint08DVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08DDiagnosticFile, "Ruseè Sprint 08D product diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08DDiagnosticFile
    try {
        Invoke-Native "PRODUCT TEMPLATE AND BUY-PATH BROWSER TESTS" { & npx playwright test e2e/product-page-templates.spec.ts }
    }
    finally {
        $script:ActiveLogFile = $null
    }
    Write-Host "Browser output saved to: $Sprint08DDiagnosticFile" -ForegroundColor Yellow
    Invoke-FullVerification -OutputFile $Sprint08DResultFile -SummaryLabel "SPRINT 08D" -FocusedTests @("src/features/catalogue/product-selection.test.ts", "tests/commerce-integrity.integration.test.ts")
}

function Invoke-AdminDemo {
    param([switch]$VerifyOnly)
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($DemoResultFile, "Ruseè admin demo dataset$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $DemoResultFile
    try {
        if ($VerifyOnly) {
            Invoke-Native "VERIFY 20-ORDER ADMIN DEMO" { & node --env-file=.env scripts/seed-admin-demo.mjs --verify }
        } else {
            Invoke-Native "RESET AND CREATE 20-ORDER ADMIN DEMO" { & node --env-file=.env scripts/seed-admin-demo.mjs }
        }
    }
    finally {
        $script:ActiveLogFile = $null
    }
    Write-Host "Demo output saved to: $DemoResultFile" -ForegroundColor Green
}

function Invoke-Sprint08EPreparation {
    Assert-Dependencies
    Invoke-Native "GENERATE DESIGN CATALOGUE MIGRATION" { & npm run db:generate }
    Invoke-Native "APPLY DESIGN CATALOGUE MIGRATION" { & node --env-file=.env scripts/migrate-database.mjs }
    Invoke-Native "INITIALIZE 15 INDEPENDENT DESIGN STUDIES" { & node --env-file=.env scripts/seed-design-studies.mjs }
}

function Invoke-Sprint08FPreparation {
    Assert-Dependencies
    Invoke-Native "GENERATE SIZE MEDIA MIGRATION" { & npm run db:generate }
    Invoke-Native "APPLY SIZE MEDIA MIGRATION" { & node --env-file=.env scripts/migrate-database.mjs }
}

function Invoke-Sprint08FVerification {
    Assert-Dependencies
    Invoke-Native "VERIFY CATALOGUE MEDIA ASSIGNMENTS" { & node --env-file=.env scripts/verify-catalogue-media.mjs }
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08FDiagnosticFile, "Ruseè Sprint 08F media diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08FDiagnosticFile
    try {
        Invoke-Native "SIZE MEDIA AND BUY-PATH BROWSER TESTS" { & npx playwright test e2e/product-page-templates.spec.ts }
    }
    finally {
        $script:ActiveLogFile = $null
    }
    Write-Host "Browser output saved to: $Sprint08FDiagnosticFile" -ForegroundColor Yellow
    Invoke-FullVerification -OutputFile $Sprint08FResultFile -SummaryLabel "SPRINT 08F" -FocusedTests @("src/features/catalogue/product-media.test.ts", "src/features/catalogue/product-selection.test.ts", "tests/commerce-integrity.integration.test.ts")
}

function Invoke-Sprint08GPreparation {
    Assert-Dependencies
    Invoke-Native "GENERATE COMMERCE GUARD MIGRATION" { & npm run db:generate }
    Invoke-Native "APPLY COMMERCE GUARD MIGRATION" { & node --env-file=.env scripts/migrate-database.mjs }
}

function Invoke-Sprint08HVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08HAuditFile, "Ruseè Sprint 08H launch-readiness audit$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08HAuditFile
    try { Invoke-Native "REDACTED LAUNCH-READINESS AUDIT" { & node --env-file=.env scripts/launch-readiness-audit.mjs } }
    finally { $script:ActiveLogFile = $null }
    Write-Host "Launch audit saved to: $Sprint08HAuditFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08HResultFile -SummaryLabel "SPRINT 08H" -FocusedTests @("tests/production-release.test.ts", "src/features/commerce/rate-limit.test.ts")
}

function Invoke-Sprint08HRelease {
    if (-not (Test-Path -LiteralPath $Sprint08HResultFile -PathType Leaf) -or -not (Select-String -LiteralPath $Sprint08HResultFile -SimpleMatch "PASS - status, ESLint, TypeScript, Vitest, production build, and diff checks completed." -Quiet)) { throw "Run Sprint08HVerify successfully before creating a release." }
    $ReleaseInputs = Get-ChildItem -LiteralPath @((Join-Path $ProjectRoot "src"),(Join-Path $ProjectRoot "scripts"),(Join-Path $ProjectRoot "drizzle"),(Join-Path $ProjectRoot "public")) -File -Recurse
    $ReleaseInputs += Get-Item -LiteralPath (Join-Path $ProjectRoot "package.json"),(Join-Path $ProjectRoot "package-lock.json"),(Join-Path $ProjectRoot "next.config.ts"),(Join-Path $ProjectRoot "tsconfig.json"),(Join-Path $ProjectRoot "drizzle.config.ts"),(Join-Path $ProjectRoot "start.js")
    $NewestInput = ($ReleaseInputs | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1).LastWriteTimeUtc
    if ($NewestInput -gt (Get-Item -LiteralPath $Sprint08HResultFile).LastWriteTimeUtc) { throw "Release inputs changed after Sprint08HVerify. Verify again before packaging." }
    Invoke-Native "CREATE VERIFIED REDACTED PAPAKI RELEASE ARCHIVE" { & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "prepare-papaki-upload.ps1") }
}

function Invoke-Sprint08IVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08IDiagnosticFile, "Ruseè Sprint 08I authenticated admin diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08IDiagnosticFile
    try {
        Invoke-Native "VERIFY TWENTY-ORDER DEMO IS AVAILABLE" { & node --env-file=.env scripts/seed-admin-demo.mjs --verify }
        Invoke-Native "PREPARE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs }
        Invoke-Native "AUTHENTICATED ADMIN BROWSER CONTRACT" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/admin-operations.spec.ts }
    }
    finally {
        try { Invoke-Native "REMOVE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup } }
        finally { $script:ActiveLogFile = $null }
    }
    Write-Host "Admin browser output saved to: $Sprint08IDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08IResultFile -SummaryLabel "SPRINT 08I" -FocusedTests @("src/features/admin/reconciliation.test.ts", "tests/production-release.test.ts")
}

function Invoke-Sprint08JVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08JDiagnosticFile, "Ruseè Sprint 08J authenticated mutation diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08JDiagnosticFile
    try {
        Invoke-Native "PREPARE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs }
        Invoke-Native "PREPARE ISOLATED ADMIN MUTATION ORDERS" { & node --env-file=.env scripts/e2e-admin-mutations-fixture.mjs }
        Invoke-Native "AUTHENTICATED ADMIN MUTATION BROWSER CONTRACT" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/admin-mutations.spec.ts }
        Invoke-Native "VERIFY ADMIN MUTATION DATABASE EVIDENCE" { & node --env-file=.env scripts/e2e-admin-mutations-fixture.mjs --verify }
    }
    finally {
        try { Invoke-Native "REMOVE ISOLATED ADMIN MUTATION ORDERS" { & node --env-file=.env scripts/e2e-admin-mutations-fixture.mjs --cleanup } }
        finally {
            try { Invoke-Native "REMOVE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup } }
            finally { $script:ActiveLogFile = $null }
        }
    }
    Write-Host "Admin mutation browser output saved to: $Sprint08JDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08JResultFile -SummaryLabel "SPRINT 08J" -FocusedTests @("src/features/email/delivery.test.ts", "src/features/admin/reconciliation.test.ts", "tests/production-release.test.ts")
}

function Invoke-Sprint08KVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08KDiagnosticFile, "Rusee Sprint 08K launch-quality diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08KDiagnosticFile
    try {
        Invoke-Native "PREPARE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs }
        Invoke-Native "LAUNCH ACCESSIBILITY KEYBOARD AND REDUCED-MOTION CONTRACTS" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/launch-quality.spec.ts }
    }
    finally {
        try { Invoke-Native "REMOVE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup } }
        finally { $script:ActiveLogFile = $null }
    }
    Write-Host "Launch-quality browser output saved to: $Sprint08KDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08KResultFile -SummaryLabel "SPRINT 08K" -FocusedTests @("src/i18n/config.test.ts", "src/features/catalogue/product-selection.test.ts", "tests/production-release.test.ts")
}

function Invoke-Sprint08LVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08LDiagnosticFile, "Rusee Sprint 08L maintenance diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08LDiagnosticFile
    $PreviousMaintenanceMode = [Environment]::GetEnvironmentVariable("MAINTENANCE_MODE", "Process")
    try {
        [Environment]::SetEnvironmentVariable("MAINTENANCE_MODE", "true", "Process")
        Invoke-Native "MAINTENANCE ROUTING BROWSER CONTRACT" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/maintenance.spec.ts }
    }
    finally {
        [Environment]::SetEnvironmentVariable("MAINTENANCE_MODE", $PreviousMaintenanceMode, "Process")
        $script:ActiveLogFile = $null
    }
    Write-Host "Maintenance output saved to: $Sprint08LDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08LResultFile -SummaryLabel "SPRINT 08L" -FocusedTests @("src/lib/operations/maintenance.test.ts", "tests/production-release.test.ts")
}

function Invoke-Sprint08NVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08NDiagnosticFile, "Rusee Sprint 08N customer-information diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08NDiagnosticFile
    try {
        Invoke-Native "CUSTOMER INFORMATION CROSS-BROWSER CONTRACT" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/information-pages.spec.ts }
    }
    finally { $script:ActiveLogFile = $null }
    Write-Host "Customer-information output saved to: $Sprint08NDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08NResultFile -SummaryLabel "SPRINT 08N" -FocusedTests @("src/i18n/config.test.ts", "tests/production-release.test.ts")
}

function Invoke-Sprint08OPreparation {
    Assert-Dependencies
    Invoke-Native "GENERATE INFORMATION CONTENT MIGRATION" { & npm run db:generate }
    Invoke-Native "APPLY INFORMATION CONTENT MIGRATION" { & node --env-file=.env scripts/migrate-database.mjs }
    Invoke-Native "INITIALIZE FIXED INFORMATION PAGE DRAFTS" { & node --env-file=.env scripts/seed-information-pages.mjs }
}

function Invoke-Sprint08OVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08ODiagnosticFile, "Rusee Sprint 08O information-admin diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile=$Sprint08ODiagnosticFile
    try{Invoke-Native "VERIFY FIXED INFORMATION PAGE RECORDS" { & node --env-file=.env scripts/verify-information-pages.mjs };Invoke-Native "PREPARE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs };Invoke-Native "INFORMATION ADMIN BROWSER CONTRACT" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/information-admin.spec.ts }}finally{try{Invoke-Native "REMOVE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup }}finally{$script:ActiveLogFile=$null}}
    Write-Host "Information-admin output saved to: $Sprint08ODiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08OResultFile -SummaryLabel "SPRINT 08O" -FocusedTests @("src/features/content/information-pages.test.ts", "tests/production-release.test.ts")
}

function Invoke-Sprint08PVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08PDiagnosticFile, "Rusee Sprint 08P information-preview diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08PDiagnosticFile
    try {
        Invoke-Native "VERIFY FIXED INFORMATION PAGE RECORDS" { & node --env-file=.env scripts/verify-information-pages.mjs }
        Invoke-Native "PREPARE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs }
        Invoke-Native "INFORMATION PREVIEW BROWSER CONTRACT" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/information-admin.spec.ts }
    }
    finally {
        try { Invoke-Native "REMOVE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup } }
        finally { $script:ActiveLogFile = $null }
    }
    Write-Host "Information-preview output saved to: $Sprint08PDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08PResultFile -SummaryLabel "SPRINT 08P" -FocusedTests @("src/features/content/information-pages.test.ts", "tests/production-release.test.ts")
}

function Invoke-Sprint08QVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08QDiagnosticFile, "Rusee Sprint 08Q publication-safety diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08QDiagnosticFile
    try {
        Invoke-Native "VERIFY FIXED INFORMATION PAGE RECORDS" { & node --env-file=.env scripts/verify-information-pages.mjs }
        Invoke-Native "PREPARE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs }
        Invoke-Native "INFORMATION PUBLICATION UI CONTRACT" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/information-admin.spec.ts }
    }
    finally {
        try { Invoke-Native "REMOVE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup } }
        finally { $script:ActiveLogFile = $null }
    }
    Write-Host "Publication-safety output saved to: $Sprint08QDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08QResultFile -SummaryLabel "SPRINT 08Q" -FocusedTests @("src/features/content/information-pages.test.ts", "tests/production-release.test.ts")
}

function Invoke-Sprint08RVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08RDiagnosticFile, "Rusee Sprint 08R admin-activity diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08RDiagnosticFile
    try {
        Invoke-Native "PREPARE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs }
        Invoke-Native "ADMIN ACTIVITY BROWSER CONTRACT" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/admin-activity.spec.ts }
    }
    finally {
        try { Invoke-Native "REMOVE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup } }
        finally { $script:ActiveLogFile = $null }
    }
    Write-Host "Admin-activity output saved to: $Sprint08RDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08RResultFile -SummaryLabel "SPRINT 08R" -FocusedTests @("src/features/admin/activity.test.ts", "tests/production-release.test.ts")
}

function Invoke-Sprint08SVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08SDiagnosticFile, "Rusee Sprint 08S admin-team diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08SDiagnosticFile
    try {
        Invoke-Native "PREPARE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs }
        Invoke-Native "ADMIN TEAM BROWSER CONTRACT" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/admin-team.spec.ts }
    }
    finally {
        try { Invoke-Native "REMOVE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup } }
        finally { $script:ActiveLogFile = $null }
    }
    Write-Host "Admin-team output saved to: $Sprint08SDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08SResultFile -SummaryLabel "SPRINT 08S" -FocusedTests @("src/features/admin/team.test.ts", "tests/production-release.test.ts")
}

function Invoke-Sprint08TVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08TDiagnosticFile, "Rusee Sprint 08T admin-overview diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08TDiagnosticFile
    try {
        Invoke-Native "PREPARE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs }
        Invoke-Native "ADMIN ACTION CENTRE BROWSER CONTRACT" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/admin-overview.spec.ts }
    }
    finally {
        try { Invoke-Native "REMOVE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup } }
        finally { $script:ActiveLogFile = $null }
    }
    Write-Host "Admin-overview output saved to: $Sprint08TDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08TResultFile -SummaryLabel "SPRINT 08T" -FocusedTests @("src/features/admin/overview-attention.test.ts", "src/features/admin/reconciliation.test.ts", "tests/production-release.test.ts")
}

function Invoke-Sprint08UVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08UDiagnosticFile, "Rusee Sprint 08U pre-provider release-candidate diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08UDiagnosticFile
    try {
        Invoke-Native "VERIFY 20-ORDER ADMIN DEMO" { & node --env-file=.env scripts/seed-admin-demo.mjs --verify }
        Invoke-Native "VERIFY 15-DESIGN CATALOGUE" { & node --env-file=.env scripts/verify-design-studies.mjs }
        Invoke-Native "VERIFY CATALOGUE MEDIA ASSIGNMENTS" { & node --env-file=.env scripts/verify-catalogue-media.mjs }
        Invoke-Native "VERIFY COMMERCE LAUNCH GUARDS" { & node --env-file=.env scripts/verify-commerce-guards.mjs }
        Invoke-Native "VERIFY FIXED INFORMATION PAGE RECORDS" { & node --env-file=.env scripts/verify-information-pages.mjs }
        Invoke-Native "REDACTED LAUNCH-READINESS AUDIT" { & node --env-file=.env scripts/launch-readiness-audit.mjs }
        Invoke-Native "PREPARE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs }
        Invoke-Native "PRE-PROVIDER RELEASE-CANDIDATE BROWSER CONTRACT" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/commerce-journey.spec.ts e2e/information-pages.spec.ts e2e/launch-quality.spec.ts e2e/information-admin.spec.ts e2e/admin-operations.spec.ts e2e/admin-activity.spec.ts e2e/admin-team.spec.ts e2e/admin-overview.spec.ts }
    }
    finally {
        try { Invoke-Native "REMOVE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup } }
        finally { $script:ActiveLogFile = $null }
    }
    Write-Host "Release-candidate diagnostics saved to: $Sprint08UDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08UResultFile -SummaryLabel "SPRINT 08U" -FocusedTests @("tests/commerce-integrity.integration.test.ts", "tests/payment-events.integration.test.ts", "tests/production-release.test.ts", "src/features/admin/overview-attention.test.ts", "src/features/admin/activity.test.ts", "src/features/admin/team.test.ts")
}

function Invoke-Sprint08VVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08VDiagnosticFile, "Rusee Sprint 08V local production performance diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08VDiagnosticFile
    try {
        Invoke-Native "LOCAL PRODUCTION PERFORMANCE BUDGETS" { & node --env-file=.env node_modules/@playwright/test/cli.js test --config playwright.performance.config.ts }
        Write-RunnerLine "PASS - desktop and mobile local production performance budgets completed."
        Write-RunnerLine "NOTE - local measurements are regression evidence, not Papaki production or real-device approval."
    }
    catch {
        Write-RunnerLine "FAIL - review the route-specific PERFORMANCE_EVIDENCE and assertion above."
        throw
    }
    finally {
        $script:ActiveLogFile = $null
    }
    Write-Host "Performance diagnostics saved to: $Sprint08VDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08VResultFile -SummaryLabel "SPRINT 08V" -FocusedTests @("tests/production-release.test.ts", "src/lib/seo/product-schema.test.ts")
}

function Invoke-Sprint08WVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08WDiagnosticFile, "Rusee Sprint 08W bilingual visual-acceptance diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08WDiagnosticFile
    try {
        Invoke-Native "PREPARE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs }
        Invoke-Native "BILINGUAL VISUAL ACCEPTANCE PACK" { & node --env-file=.env node_modules/@playwright/test/cli.js test --config playwright.visual.config.ts }
        Write-RunnerLine "PASS - Greek/English desktop/mobile visual captures completed."
        Write-RunnerLine "Captures: artifacts/visual-acceptance"
        Write-RunnerLine "NOTE - captured evidence requires human review and is not real-device or production approval."
    }
    finally {
        try { Invoke-Native "REMOVE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup } }
        finally { $script:ActiveLogFile = $null }
    }
    Write-Host "Visual-acceptance diagnostics saved to: $Sprint08WDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08WResultFile -SummaryLabel "SPRINT 08W" -FocusedTests @("src/i18n/config.test.ts", "tests/production-release.test.ts")
}

function Invoke-Sprint08XVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08XDiagnosticFile, "Rusee Sprint 08X checkout-recovery diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08XDiagnosticFile
    try {
        Invoke-Native "ISOLATED CHECKOUT RECOVERY BROWSER CONTRACTS" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/checkout-recovery.spec.ts e2e/commerce-journey.spec.ts }
        Write-RunnerLine "PASS - cart validation, safe recovery and idempotent checkout retry contracts completed."
        Write-RunnerLine "NOTE - all order/payment requests were intercepted; no order, email or payment was created."
    }
    finally {
        $script:ActiveLogFile = $null
    }
    Write-Host "Checkout-recovery diagnostics saved to: $Sprint08XDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08XResultFile -SummaryLabel "SPRINT 08X" -FocusedTests @("src/features/commerce/rate-limit.test.ts", "tests/commerce-integrity.integration.test.ts", "tests/payment-events.integration.test.ts")
}

function Invoke-Sprint08YVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08YDiagnosticFile, "Rusee Sprint 08Y catalogue-readiness diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08YDiagnosticFile
    try {
        Invoke-Native "PREPARE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs }
        Invoke-Native "CATALOGUE READINESS OWNER CONTRACTS" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/catalogue-readiness.spec.ts e2e/admin-overview.spec.ts }
        Write-RunnerLine "PASS - safe catalogue matrix and daily-action link completed."
        Write-RunnerLine "NOTE - structural completeness does not approve garment facts or activate catalogue records."
    }
    finally {
        try { Invoke-Native "REMOVE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup } }
        finally { $script:ActiveLogFile = $null }
    }
    Write-Host "Catalogue-readiness diagnostics saved to: $Sprint08YDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08YResultFile -SummaryLabel "SPRINT 08Y" -FocusedTests @("src/features/catalogue/readiness.test.ts", "src/features/catalogue/product-media.test.ts", "tests/commerce-integrity.integration.test.ts")
}

function Invoke-Sprint08ZPreparation {
    Assert-Dependencies
    Invoke-Native "GENERATE PRODUCT FACT APPROVAL MIGRATION" { & npm run db:generate }
    Invoke-Native "APPLY PRODUCT FACT APPROVAL MIGRATION" { & node --env-file=.env scripts/migrate-database.mjs }
}

function Invoke-Sprint08ZVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08ZDiagnosticFile, "Rusee Sprint 08Z product-fact approval diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08ZDiagnosticFile
    try {
        Invoke-Native "PREPARE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs }
        Invoke-Native "PRODUCT FACT APPROVAL OWNER CONTRACTS" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/catalogue-readiness.spec.ts e2e/admin-overview.spec.ts }
        Write-RunnerLine "PASS - structural readiness and six-category fact approval ledger completed."
        Write-RunnerLine "NOTE - verification reads approval state and never approves client or sample facts."
    }
    finally {
        try { Invoke-Native "REMOVE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup } }
        finally { $script:ActiveLogFile = $null }
    }
    Write-Host "Product-approval diagnostics saved to: $Sprint08ZDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08ZResultFile -SummaryLabel "SPRINT 08Z" -FocusedTests @("src/features/catalogue/fact-approvals.test.ts", "src/features/catalogue/readiness.test.ts", "tests/commerce-integrity.integration.test.ts")
}

function Invoke-Sprint08AAPreparation {
    Assert-Dependencies
    Invoke-Native "GENERATE SHIPMENT TRACKING MIGRATION" { & npm run db:generate }
    Invoke-Native "APPLY SHIPMENT TRACKING MIGRATION" { & node --env-file=.env scripts/migrate-database.mjs }
}

function Invoke-Sprint08AAVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08AADiagnosticFile, "Rusee Sprint 08AA shipment diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08AADiagnosticFile
    try {
        Invoke-Native "PREPARE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs }
        Invoke-Native "PREPARE ISOLATED FULFILMENT ORDERS" { & node --env-file=.env scripts/e2e-admin-mutations-fixture.mjs }
        Invoke-Native "COURIER-NEUTRAL SHIPMENT BROWSER CONTRACT" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/admin-mutations.spec.ts }
        Invoke-Native "VERIFY ISOLATED FULFILMENT EVIDENCE" { & node --env-file=.env scripts/e2e-admin-mutations-fixture.mjs --verify }
        Write-RunnerLine "PASS - shipment fields, isolated fulfilment state and queued-only notifications completed."
    }
    finally {
        try { Invoke-Native "REMOVE ISOLATED FULFILMENT ORDERS" { & node --env-file=.env scripts/e2e-admin-mutations-fixture.mjs --cleanup } }
        finally { try { Invoke-Native "REMOVE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup } } finally { $script:ActiveLogFile = $null } }
    }
    Write-Host "Shipment diagnostics saved to: $Sprint08AADiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08AAResultFile -SummaryLabel "SPRINT 08AA" -FocusedTests @("src/features/fulfilment/shipment.test.ts", "src/features/email/delivery.test.ts", "tests/commerce-integrity.integration.test.ts")
}

function Invoke-Sprint08ABPreparation {
    Assert-Dependencies
    Invoke-Native "GENERATE RETURN REQUEST MIGRATION" { & npm run db:generate }
    Invoke-Native "APPLY RETURN REQUEST MIGRATION" { & node --env-file=.env scripts/migrate-database.mjs }
}

function Invoke-Sprint08ABVerification {
    Assert-Dependencies
    Invoke-FullVerification -OutputFile $Sprint08ABResultFile -SummaryLabel "SPRINT 08AB" -FocusedTests @("src/features/returns/workflow.test.ts", "src/features/fulfilment/shipment.test.ts", "tests/commerce-integrity.integration.test.ts")
}

function Invoke-Sprint08ACPreparation {
    Assert-Dependencies
    Invoke-Native "GENERATE RETURN COMMUNICATION MIGRATION" { & npm run db:generate }
    Invoke-Native "APPLY RETURN COMMUNICATION MIGRATION" { & node --env-file=.env scripts/migrate-database.mjs }
}

function Invoke-Sprint08ACVerification {
    Assert-Dependencies
    Invoke-FullVerification -OutputFile $Sprint08ACResultFile -SummaryLabel "SPRINT 08AC" -FocusedTests @("src/features/returns/workflow.test.ts", "src/features/email/delivery.test.ts", "src/features/admin/overview-attention.test.ts")
}

function Invoke-Sprint08ADVerification {
    Assert-Dependencies
    Invoke-FullVerification -OutputFile $Sprint08ADResultFile -SummaryLabel "SPRINT 08AD" -FocusedTests @("src/features/email/delivery.test.ts", "src/i18n/config.test.ts", "src/features/fulfilment/shipment.test.ts")
}

function Invoke-Sprint08AEVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08AEDiagnosticFile, "Rusee Sprint 08AE responsive typography diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08AEDiagnosticFile
    try {
        Invoke-Native "PREPARE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs }
        Invoke-Native "HOMEPAGE TESTIMONIAL STACK CONTRACT" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/testimonials.spec.ts }
        Invoke-Native "RESPONSIVE TYPOGRAPHY VISUAL ACCEPTANCE" { & node --env-file=.env node_modules/@playwright/test/cli.js test --config playwright.visual.config.ts }
        Write-RunnerLine "PASS - testimonial interaction and Greek/English desktop/mobile typography captures completed."
        Write-RunnerLine "Captures: artifacts/visual-acceptance"
    }
    finally {
        try { Invoke-Native "REMOVE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup } }
        finally { $script:ActiveLogFile = $null }
    }
    Write-Host "Typography diagnostics saved to: $Sprint08AEDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08AEResultFile -SummaryLabel "SPRINT 08AE" -FocusedTests @("src/i18n/config.test.ts", "tests/production-release.test.ts")
}

function Invoke-Sprint08AFVerification {
    Assert-Dependencies
    New-Item -ItemType Directory -Force -Path $ArtifactDirectory | Out-Null
    [System.IO.File]::WriteAllText($Sprint08AFDiagnosticFile, "Rusee Sprint 08AF admin readability and navigation diagnostics$([Environment]::NewLine)", $Utf8NoBom)
    $script:ActiveLogFile = $Sprint08AFDiagnosticFile
    try {
        Invoke-Native "ALIGN OPTIMIZED KIMONO IMAGE PATHS" { & node --env-file=.env scripts/assign-optimized-kimono-images.mjs }
        Invoke-Native "OPTIMIZED KIMONO IMAGE CONTRACT" { & node --env-file=.env scripts/verify-optimized-kimono-images.mjs }
        Invoke-Native "PREPARE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs }
        Invoke-Native "ADMIN READABILITY AND PAGE TRANSITION CONTRACT" { & node --env-file=.env node_modules/@playwright/test/cli.js test e2e/admin-login-readability.spec.ts e2e/admin-page-transition.spec.ts }
        Write-RunnerLine "PASS - login readability and isolated, reduced-motion-safe admin navigation transitions completed."
    }
    finally {
        try { Invoke-Native "REMOVE LOCAL EPHEMERAL ADMIN" { & node --env-file=.env scripts/e2e-admin-fixture.mjs --cleanup } }
        finally { $script:ActiveLogFile = $null }
    }
    Write-Host "Admin readability diagnostics saved to: $Sprint08AFDiagnosticFile" -ForegroundColor Green
    Invoke-FullVerification -OutputFile $Sprint08AFResultFile -SummaryLabel "SPRINT 08AF" -FocusedTests @("src/i18n/config.test.ts", "src/features/health/launch-approvals.test.ts", "src/data/legal-draft-copy.test.ts", "tests/production-release.test.ts")
}

function Invoke-Sprint08AFPreparation {
    Assert-Dependencies
    Invoke-Native "ASSIGN OPTIMIZED KIMONO IMAGES" { & node --env-file=.env scripts/assign-optimized-kimono-images.mjs }
    Invoke-Native "VERIFY OPTIMIZED KIMONO IMAGE CONTRACT" { & node --env-file=.env scripts/verify-optimized-kimono-images.mjs }
}

function Invoke-Sprint08AGPreparation {
    Assert-Dependencies
    Invoke-Native "GENERATE ADMIN NOTIFICATION MIGRATION" { & npm run db:generate }
    Invoke-Native "APPLY ADMIN NOTIFICATION MIGRATION" { & npm run db:migrate }
}

function Invoke-Sprint08AGVerification {
    Assert-Dependencies
    Invoke-FullVerification -OutputFile (Join-Path $ArtifactDirectory "sprint-08ag-results.txt") -SummaryLabel "SPRINT 08AG" -FocusedTests @("src/i18n/config.test.ts", "tests/production-release.test.ts")
}

function Show-Help {
    @"
Ruseè Kimono project command runner

Run from PowerShell in the project root:
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action InstallRtk
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Status
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Install
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Dev
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Check
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Test
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Build
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Full
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action DatabaseInfo
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action DemoSeed
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action DemoVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint02Migrate
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint02Verify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint03Migrate
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint03Verify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint04Verify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint05Prepare
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint05BackupRestore
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint05Verify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint06Prepare
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action PrivacyRetentionDryRun
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint06Verify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint07DatabaseVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint07StorefrontVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint07SeoVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint07BrowserPrepare
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint07BrowserVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08AVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08BPreflight
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08BVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08CVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08CPrepareRelease
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08DVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08EPrepare
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08EVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08FPrepare
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08FVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08GPrepare
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08GVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08HVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08HPrepareRelease
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08IVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08JVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08KVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08LVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08MVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08NVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08OPrepare
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08OVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08PVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08QVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08RVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08SVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08TVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08UVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08VVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08WVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08XVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08YVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08ZPrepare
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08ZVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08AAPrepare
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08AAVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08ABPrepare
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08ABVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08ACPrepare
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08ACVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08ADVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08AEVerify
  powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Sprint08AFVerify

Safety:
  Status, Check, Test, Build, Full, and DatabaseInfo do not apply migrations or seed data.
  InstallRtk downloads the pinned project-local RTK executable.
  Install runs npm ci and may replace node_modules to match package-lock.json.
  Dev starts the local server and remains attached to this terminal.
  DatabaseInfo uses the existing redacted database-information script.
  DemoSeed resets only clearly scoped DEMO records, creates twenty complete local admin scenarios, and guarantees at least ten available pieces per active variant. It never sends email or starts a real payment.
  DemoVerify checks the demo dataset without changing it and writes artifacts/verification/admin-demo-results.txt.
  Sprint02Migrate generates and applies the contact-enquiry schema migration.
  Sprint02Verify runs focused contact tests plus the complete quality gate.
  Sprint03Migrate generates and applies the notification/admin-inbox schema migration.
  Sprint03Verify runs focused queue, workflow, and contact tests plus the complete quality gate.
  Sprint04Verify runs locale-foundation tests plus the complete quality gate. It does not change the database.
  Sprint05Prepare generates/applies product-information schema and initializes only an empty information record.
  Sprint05BackupRestore creates a backup, restores it to an isolated temporary database, and compares exact row counts.
  Sprint05Verify runs product-information tests plus the complete quality gate.
  Sprint06Prepare generates and applies the privacy-operation schema migration.
  PrivacyRetentionDryRun records eligible counts but never anonymizes records.
  Sprint06Verify runs privacy unit/integration tests plus the complete quality gate.
  Sprint07DatabaseVerify runs isolated-fixture real-MySQL commerce integrity tests plus the complete quality gate.
  Sprint07StorefrontVerify runs product-selection and product-information tests plus the complete quality gate.
  Sprint07SeoVerify runs truthful structured-data tests plus the complete quality gate.
  Sprint07BrowserPrepare installs the pinned browser test packages and Chromium, Firefox, and WebKit binaries.
  Sprint07BrowserVerify logs browser diagnostics to artifacts/verification/sprint-07-browser-diagnostics.txt, then runs the complete quality gate.
  Sprint08BPreflight checks active environment structure without printing secret values; run it on the production-like Plesk environment.
  Sprint08BVerify verifies the Sprint 08B implementation locally and does not connect to Papaki or change hosting.
  Sprint08CVerify checks Plesk release contracts plus the complete local quality gate; it does not deploy or connect externally.
  Sprint08CPrepareRelease creates a secret-excluding Papaki upload ZIP after verification; it does not deploy it.
  Sprint08DVerify tests the selected product-page direction, authoritative SKU selection and the add-to-bag contract, then runs the complete quality gate.
  Sprint08EPrepare migrates design-specific bilingual fields and initializes fifteen fixed-colour design records with zero stock for newly created SKUs.
  Sprint08EVerify checks the fifteen-design catalogue contract and runs the complete quality gate.
  Sprint08FPrepare adds size-scoped media and bilingual alternative text without deleting existing image references.
  Sprint08FVerify checks media assignment integrity, cross-browser size imagery and the complete quality gate.
  Sprint08GPrepare adds privacy-preserving order/payment abuse counters.
  Sprint08GVerify checks the commerce guard schema, production fake-payment block and the complete quality gate.
  Sprint08HVerify writes a redacted launch-readiness audit and verifies the explicit production release contract.
  Sprint08HPrepareRelease packages only inputs covered by the latest successful Sprint08H verification; it does not deploy.
  Sprint08IVerify creates a local-only ephemeral admin, checks read-only demo operations in all browser profiles, revokes the session, removes the fixture, and runs the complete gate.
  Sprint08JVerify creates isolated paid orders, exercises fulfilment and partial-refund forms in every browser profile, verifies queued-only email and audit evidence, cleans up, and runs the complete gate.
  Sprint08KVerify audits launch routes, keyboard operation, Greek-first accessibility, mobile overflow, reduced motion and authenticated admin accessibility, then runs the complete gate.
  Sprint08LVerify checks the application maintenance gate while Papaki/Plesk remains the sole owner of backups and rollback, then runs the complete gate.
  Sprint08MVerify checks the redacted launch-approval ledger and production contract, then runs the complete gate without changing external approvals.
  Sprint08NVerify audits the customer information hub, shipping, payment-method and care pages across every browser profile, then runs the complete gate.
  Sprint08OPrepare creates the fixed information-page content table and initializes draft records without replacing public copy.
  Sprint08OVerify checks the fixed records, authenticated Greek-first editor, safe fallbacks and the complete gate without publishing content.
  Sprint08PVerify checks authenticated draft preview, bilingual switching, publication-readiness guidance and the complete gate without changing content.
  Sprint08QVerify checks explicit publication/withdrawal controls, safe audit transition rules and the complete gate without changing information-page content.
  Sprint08RVerify checks the protected redacted activity log, filters and pagination across every browser profile, then runs the complete gate.
  Sprint08SVerify checks owner-only team access, safe role/password controls and credential redaction across every browser profile, then runs the complete gate without creating staff.
  Sprint08TVerify checks the Greek-first daily action centre, redacted aggregate cards and operational links across every browser profile, then runs the complete gate.
  Sprint08UVerify performs the consolidated read-only pre-provider release-candidate audit and complete gate. It creates only a temporary local admin fixture and removes it automatically.
  Sprint08VVerify builds into isolated .next-performance, audits desktop/mobile route performance on port 3108, saves evidence, then runs the complete gate. It does not deploy or mutate commerce data.
  Sprint08WVerify captures Greek/English desktop/mobile storefront and temporary-owner admin views, checks route readiness/overflow, removes the local fixture, and runs the complete gate.
  Sprint08XVerify intercepts cart/order/payment requests to verify bilingual checkout recovery and stable idempotency, then runs the complete gate without creating commerce records.
  Sprint08YVerify checks the read-only 15-design catalogue readiness matrix with a temporary owner, removes the fixture, and runs the complete gate without editing products.
  Sprint08ZPrepare generates and applies the product-fact approval ledger migration; every category remains pending until explicitly approved.
  Sprint08ZVerify checks the six-category approval ledger read-only across browser profiles and runs the complete gate without approving facts.
  Sprint08AAPrepare generates and applies the courier-neutral shipment tracking migration.
  Sprint08AAVerify uses isolated orders to check dispatch fields and queued notifications, cleans fixtures, and runs the complete gate without sending email.
  Sprint08ABPrepare generates and applies the customer return-request workflow migration.
  Sprint08ABVerify checks bounded return intake and admin transition rules plus the complete gate without creating requests or refunds.
  Sprint08ACPrepare updates the transactional email template enum for return communications.
  Sprint08ACVerify checks return visibility and email rendering plus the complete gate without sending SMTP messages.
  Sprint08ADVerify checks Greek-first transactional email copy and safe order-status links plus the complete gate without sending SMTP messages.
  Sprint08AEVerify checks the homepage testimonial stack, captures bilingual desktop/mobile typography, checks overflow, and runs the complete gate.
  Sprint08AFVerify checks responsive admin-login typography, password masking and safe editorial admin navigation across browser profiles, then runs the complete gate.
  No action prints environment-file contents.
"@ | Write-Host
}

switch ($Action) {
    "Help" { Show-Help }
    "Status" { Invoke-Status }
    "InstallRtk" { & powershell -ExecutionPolicy Bypass -File $RtkInstaller; if ($LASTEXITCODE -ne 0) { throw "RTK installation failed with exit code $LASTEXITCODE." } }
    "Install" { Install-Dependencies }
    "Dev" { Assert-Dependencies; Invoke-Native "DEVELOPMENT SERVER (HTTP://LOCALHOST:3000)" { & npm run dev:local } }
    "Check" { Invoke-Checks }
    "Test" { Invoke-Tests }
    "Build" { Invoke-Build }
    "Full" { Invoke-FullVerification }
    "DatabaseInfo" { Assert-Dependencies; Invoke-Native "DATABASE INFORMATION" { & npm run db:info } }
    "DemoSeed" { Invoke-AdminDemo }
    "DemoVerify" { Invoke-AdminDemo -VerifyOnly }
    "Sprint02Migrate" { Invoke-Sprint02Migration }
    "Sprint02Verify" { Invoke-FullVerification -OutputFile $Sprint02ResultFile -SummaryLabel "SPRINT 02" -FocusedTests @("src/features/contact/schema.test.ts", "tests/contact-enquiries.integration.test.ts") }
    "Sprint03Migrate" { Invoke-Sprint03Migration }
    "Sprint03Verify" { Invoke-FullVerification -OutputFile $Sprint03ResultFile -SummaryLabel "SPRINT 03" -FocusedTests @("src/features/contact/schema.test.ts", "src/features/contact/admin.test.ts", "src/features/email/delivery.test.ts", "tests/contact-enquiries.integration.test.ts") }
    "Sprint04Verify" { Invoke-FullVerification -OutputFile $Sprint04ResultFile -SummaryLabel "SPRINT 04" -FocusedTests @("src/i18n/config.test.ts", "src/features/contact/schema.test.ts", "src/features/contact/admin.test.ts") }
    "Sprint05Prepare" { Invoke-Sprint05Preparation }
    "Sprint05BackupRestore" { Assert-Dependencies; Invoke-Native "DATABASE AND MEDIA BACKUP/RESTORE REHEARSAL" { & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "backup-restore-rehearsal.ps1") } }
    "Sprint05Verify" { Invoke-FullVerification -OutputFile $Sprint05ResultFile -SummaryLabel "SPRINT 05" -FocusedTests @("src/features/catalogue/product-information.test.ts", "src/i18n/config.test.ts") }
    "Sprint06Prepare" { Invoke-Sprint06Preparation }
    "PrivacyRetentionDryRun" { Assert-Dependencies; Invoke-Native "PRIVACY RETENTION DRY RUN" { & node --env-file=.env scripts/privacy-retention.mjs } }
    "Sprint06Verify" { Invoke-FullVerification -OutputFile $Sprint06ResultFile -SummaryLabel "SPRINT 06" -FocusedTests @("src/features/privacy/service.test.ts", "tests/privacy-operations.integration.test.ts") }
    "Sprint07DatabaseVerify" { Invoke-FullVerification -OutputFile $Sprint07DatabaseResultFile -SummaryLabel "SPRINT 07 DATABASE" -FocusedTests @("tests/commerce-integrity.integration.test.ts", "tests/payment-events.integration.test.ts") }
    "Sprint07StorefrontVerify" { Invoke-FullVerification -OutputFile $Sprint07StorefrontResultFile -SummaryLabel "SPRINT 07 STOREFRONT" -FocusedTests @("src/features/catalogue/product-selection.test.ts", "src/features/catalogue/product-information.test.ts", "src/i18n/config.test.ts") }
    "Sprint07SeoVerify" { Invoke-FullVerification -OutputFile $Sprint07SeoResultFile -SummaryLabel "SPRINT 07 SEO" -FocusedTests @("src/lib/seo/product-schema.test.ts", "src/i18n/config.test.ts") }
    "Sprint07BrowserPrepare" { Invoke-Sprint07BrowserPreparation }
    "Sprint07BrowserVerify" { Invoke-Sprint07BrowserVerification }
    "Sprint08AVerify" { Invoke-FullVerification -OutputFile $Sprint08AResultFile -SummaryLabel "SPRINT 08A" -FocusedTests @("src/i18n/config.test.ts") }
    "Sprint08BPreflight" { Invoke-Sprint08BPreflight }
    "Sprint08BVerify" { Invoke-FullVerification -OutputFile $Sprint08BResultFile -SummaryLabel "SPRINT 08B" -FocusedTests @("src/features/email/delivery.test.ts", "src/features/admin/reconciliation.test.ts") }
    "Sprint08CVerify" { Invoke-FullVerification -OutputFile $Sprint08CResultFile -SummaryLabel "SPRINT 08C" -FocusedTests @("tests/production-release.test.ts", "src/features/email/delivery.test.ts", "src/features/admin/reconciliation.test.ts") }
    "Sprint08CPrepareRelease" { Assert-Dependencies; Invoke-Native "CREATE REDACTED PAPAKI RELEASE ARCHIVE" { & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "prepare-papaki-upload.ps1") } }
    "Sprint08DVerify" { Invoke-Sprint08DVerification }
    "Sprint08EPrepare" { Invoke-Sprint08EPreparation }
    "Sprint08EVerify" { Assert-Dependencies; Invoke-Native "VERIFY 15-DESIGN CATALOGUE" { & node --env-file=.env scripts/verify-design-studies.mjs }; Invoke-FullVerification -OutputFile $Sprint08EResultFile -SummaryLabel "SPRINT 08E" -FocusedTests @("src/features/catalogue/product-selection.test.ts", "tests/commerce-integrity.integration.test.ts") }
    "Sprint08FPrepare" { Invoke-Sprint08FPreparation }
    "Sprint08FVerify" { Invoke-Sprint08FVerification }
    "Sprint08GPrepare" { Invoke-Sprint08GPreparation }
    "Sprint08GVerify" { Assert-Dependencies; Invoke-Native "VERIFY COMMERCE LAUNCH GUARDS" { & node --env-file=.env scripts/verify-commerce-guards.mjs }; Invoke-FullVerification -OutputFile $Sprint08GResultFile -SummaryLabel "SPRINT 08G" -FocusedTests @("src/features/commerce/rate-limit.test.ts", "tests/production-release.test.ts", "tests/commerce-integrity.integration.test.ts") }
    "Sprint08HVerify" { Invoke-Sprint08HVerification }
    "Sprint08HPrepareRelease" { Invoke-Sprint08HRelease }
    "Sprint08IVerify" { Invoke-Sprint08IVerification }
    "Sprint08JVerify" { Invoke-Sprint08JVerification }
    "Sprint08KVerify" { Invoke-Sprint08KVerification }
    "Sprint08LVerify" { Invoke-Sprint08LVerification }
    "Sprint08MVerify" { Invoke-FullVerification -OutputFile $Sprint08MResultFile -SummaryLabel "SPRINT 08M" -FocusedTests @("src/features/health/launch-approvals.test.ts", "tests/production-release.test.ts") }
    "Sprint08NVerify" { Invoke-Sprint08NVerification }
    "Sprint08OPrepare" { Invoke-Sprint08OPreparation }
    "Sprint08OVerify" { Invoke-Sprint08OVerification }
    "Sprint08PVerify" { Invoke-Sprint08PVerification }
    "Sprint08QVerify" { Invoke-Sprint08QVerification }
    "Sprint08RVerify" { Invoke-Sprint08RVerification }
    "Sprint08SVerify" { Invoke-Sprint08SVerification }
    "Sprint08TVerify" { Invoke-Sprint08TVerification }
    "Sprint08UVerify" { Invoke-Sprint08UVerification }
    "Sprint08VVerify" { Invoke-Sprint08VVerification }
    "Sprint08WVerify" { Invoke-Sprint08WVerification }
    "Sprint08XVerify" { Invoke-Sprint08XVerification }
    "Sprint08YVerify" { Invoke-Sprint08YVerification }
    "Sprint08ZPrepare" { Invoke-Sprint08ZPreparation }
    "Sprint08ZVerify" { Invoke-Sprint08ZVerification }
    "Sprint08AAPrepare" { Invoke-Sprint08AAPreparation }
    "Sprint08AAVerify" { Invoke-Sprint08AAVerification }
    "Sprint08ABPrepare" { Invoke-Sprint08ABPreparation }
    "Sprint08ABVerify" { Invoke-Sprint08ABVerification }
    "Sprint08ACPrepare" { Invoke-Sprint08ACPreparation }
    "Sprint08ACVerify" { Invoke-Sprint08ACVerification }
    "Sprint08ADVerify" { Invoke-Sprint08ADVerification }
    "Sprint08AEVerify" { Invoke-Sprint08AEVerification }
    "Sprint08AFPrepare" { Invoke-Sprint08AFPreparation }
    "Sprint08AFVerify" { Invoke-Sprint08AFVerification }
    "Sprint08AGPrepare" { Invoke-Sprint08AGPreparation }
    "Sprint08AGVerify" { Invoke-Sprint08AGVerification }
}
