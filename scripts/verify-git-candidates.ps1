$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

Write-Host "=== GIT COMMIT-CANDIDATE CREDENTIAL SCAN ==="

$CandidateFiles = git ls-files --cached --others --exclude-standard |
    Where-Object {
        $_ -match '\.(?:ts|tsx|js|jsx|mjs|cjs|json|md|ps1|yml|yaml|toml|txt|example)$' -or
        $_ -in @("start.js", ".gitignore")
    }

$Findings = @()

foreach ($Path in $CandidateFiles) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        continue
    }

    $LineNumber = 0
    foreach ($Line in Get-Content -LiteralPath $Path) {
        $LineNumber++

        if ($Line -match "-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----") {
            $Findings += [PSCustomObject]@{ Category = "private-key"; Path = $Path; Line = $LineNumber }
        }

        if ($Line -match "(?:ghp_|github_pat_|sk_live_|rk_live_|AKIA)[A-Za-z0-9_-]{12,}") {
            $Findings += [PSCustomObject]@{ Category = "token-pattern"; Path = $Path; Line = $LineNumber }
        }

        if ($Line -match "mysql://[^:\s]+:([^@\s]+)@") {
            $PasswordPart = $Matches[1].Trim('"', "'")
            $IsScannerRule = $Path -eq "scripts/verify-git-candidates.ps1"
            $IsTestFixture = $Path -match "\.test\.(?:ts|tsx|js|jsx)$"
            $IsVariableDrivenExample = $Line -match "\$[A-Za-z_][A-Za-z0-9_]*"
            if (
                -not $IsScannerRule -and
                -not $IsTestFixture -and
                -not $IsVariableDrivenExample -and
                $PasswordPart -and
                $PasswordPart -notmatch "^(?:URL_ENCODED_PASSWORD|PASSWORD|CHANGE_ME|REDACTED|PLACEHOLDER)$"
            ) {
                $Findings += [PSCustomObject]@{ Category = "database-password"; Path = $Path; Line = $LineNumber }
            }
        }

        if ($Line -match '^\s*(?:SMTP_PASSWORD|ADMIN_BOOTSTRAP_PASSWORD|ADMIN_SESSION_SECRET|AUTOMATION_SECRET)\s*=\s*(.*)$') {
            $Value = $Matches[1].Trim().Trim('"').Trim("'")
            $IsDescriptivePlaceholder = $Value -match "^[A-Z0-9_]+$" -and $Value -match "(?:PASSWORD|SECRET|GENERATE|CHARACTER|UNIQUE|RANDOM|RUSEE)"
            if (
                $Value -and
                -not $IsDescriptivePlaceholder -and
                $Value -notmatch "^(?:GENERATE_|RUSEE_|CHANGE_ME|REDACTED|PLACEHOLDER)" -and
                $Value -notmatch "process\.env"
            ) {
                $Findings += [PSCustomObject]@{ Category = "populated-secret"; Path = $Path; Line = $LineNumber }
            }
        }
    }
}

if ($Findings.Count -gt 0) {
    Write-Host "REVIEW REQUIRED - possible credential material detected. Values are intentionally hidden."
    $Findings | Sort-Object Path, Line | Format-Table -AutoSize
    Write-Host "Do not stage or commit until every reported location has been reviewed."
    return
}

Write-Host "PASS - no private keys, recognized live tokens, populated database passwords, or populated production secrets were detected in commit candidates."
