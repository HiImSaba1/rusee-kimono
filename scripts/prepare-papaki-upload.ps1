[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ReleaseRoot = Join-Path $ProjectRoot "artifacts\releases"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Stage = Join-Path $ReleaseRoot "rusee-papaki-$Timestamp"
$Archive = "$Stage.zip"

Set-Location -LiteralPath $ProjectRoot
New-Item -ItemType Directory -Force -Path $Stage | Out-Null

$Directories = @("drizzle", "public", "src")
$Files = @(
    "package.json", "package-lock.json", "next.config.ts", "postcss.config.mjs",
    "tsconfig.json", "next-env.d.ts", "drizzle.config.ts", "start.js"
)

foreach ($Directory in $Directories) {
    Copy-Item -LiteralPath (Join-Path $ProjectRoot $Directory) -Destination $Stage -Recurse
}
New-Item -ItemType Directory -Force -Path (Join-Path $Stage "scripts") | Out-Null
$ProductionScripts = @(
    "assign-optimized-kimono-images.mjs", "bootstrap-admin.mjs", "cpanel-start.cjs", "deploy-cpanel.sh", "deploy-plesk.sh",
    "check-production-site.mjs", "database-info.mjs", "migrate-database.mjs", "monitor-health.mjs", "plesk-start.cjs", "privacy-retention.mjs",
    "prepare-standalone.mjs", "production-preflight.mjs", "release-expired-reservations.mjs", "repair-release-permissions.mjs", "run-automation-worker.mjs",
    "seed-information-pages.mjs"
)
foreach ($Script in $ProductionScripts) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $Script) -Destination (Join-Path $Stage "scripts")
}
foreach ($File in $Files) {
    Copy-Item -LiteralPath (Join-Path $ProjectRoot $File) -Destination $Stage
}

Add-Type -AssemblyName System.IO.Compression
$ArchiveStream = [System.IO.File]::Open($Archive, [System.IO.FileMode]::CreateNew)
try {
    $Zip = [System.IO.Compression.ZipArchive]::new($ArchiveStream, [System.IO.Compression.ZipArchiveMode]::Create, $false)
    try {
        Get-ChildItem -LiteralPath $Stage -Recurse -File | ForEach-Object {
            $RelativePath = $_.FullName.Substring($Stage.Length).TrimStart("\", "/").Replace("\", "/")
            $Entry = $Zip.CreateEntry($RelativePath, [System.IO.Compression.CompressionLevel]::Optimal)
            $EntryStream = $Entry.Open()
            $SourceStream = [System.IO.File]::OpenRead($_.FullName)
            try { $SourceStream.CopyTo($EntryStream) }
            finally { $SourceStream.Dispose(); $EntryStream.Dispose() }
        }
    }
    finally { $Zip.Dispose() }
}
finally { $ArchiveStream.Dispose() }
Write-Host "Papaki/Plesk release archive created: $Archive" -ForegroundColor Green
Write-Host "Archive contains file-only entries with Linux-compatible paths; Plesk will create directories with server-owned permissions." -ForegroundColor Green
Write-Host "No .env file, secret, node_modules, .next cache, test output, or local verification artifact is included."
