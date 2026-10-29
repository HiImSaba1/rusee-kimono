[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Version = "0.42.0"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ToolDirectory = Join-Path $ProjectRoot ".tools\rtk"
$ArchivePath = Join-Path $env:TEMP "rusee-kimono-rtk-$Version.zip"
$DownloadUrl = "https://github.com/rtk-ai/rtk/releases/download/v$Version/rtk-x86_64-pc-windows-msvc.zip"
$Binary = Join-Path $ToolDirectory "rtk.exe"

if (Test-Path -LiteralPath $Binary -PathType Leaf) {
    & $Binary --version
    exit $LASTEXITCODE
}

New-Item -ItemType Directory -Force -Path $ToolDirectory | Out-Null

try {
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $ArchivePath
    Expand-Archive -LiteralPath $ArchivePath -DestinationPath $ToolDirectory -Force
}
finally {
    if (Test-Path -LiteralPath $ArchivePath -PathType Leaf) {
        Remove-Item -LiteralPath $ArchivePath -Force
    }
}

if (-not (Test-Path -LiteralPath $Binary -PathType Leaf)) {
    throw "RTK was downloaded but rtk.exe was not found at the expected project-local path."
}

& $Binary --version
if ($LASTEXITCODE -ne 0) {
    throw "RTK installation verification failed with exit code $LASTEXITCODE."
}

& $Binary gain
