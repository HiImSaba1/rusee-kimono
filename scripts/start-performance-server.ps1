[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

$env:NEXT_DIST_DIR = ".next-performance"

& node node_modules/next/dist/bin/next build
if ($LASTEXITCODE -ne 0) {
    throw "The isolated performance build failed with exit code $LASTEXITCODE."
}

& node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3108
if ($LASTEXITCODE -ne 0) {
    throw "The isolated performance server stopped with exit code $LASTEXITCODE."
}
