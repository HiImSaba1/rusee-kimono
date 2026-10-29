[CmdletBinding()]
param(
  [switch]$KeepRehearsalDatabase,
  [string]$OperatorUser = "root",
  [SecureString]$OperatorPassword
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $ProjectRoot ".env"
if (-not (Test-Path -LiteralPath $EnvFile -PathType Leaf)) { throw ".env is required for the local backup rehearsal." }

$DatabaseLine = Get-Content -LiteralPath $EnvFile | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
if (-not $DatabaseLine) { throw "DATABASE_URL was not found in .env." }
$DatabaseUrl = ($DatabaseLine -split '=', 2)[1].Trim().Trim('"').Trim("'")
$Uri = [Uri]$DatabaseUrl
if ($Uri.Scheme -ne "mysql") { throw "DATABASE_URL must use the mysql scheme." }
$Database = $Uri.AbsolutePath.TrimStart('/')
if ($Database -notmatch '^[a-zA-Z0-9_]+$') { throw "Unsafe source database name." }
$Credentials = $Uri.UserInfo -split ':', 2
$DatabaseUser = [Uri]::UnescapeDataString($Credentials[0])
$DatabasePassword = if ($Credentials.Count -gt 1) { [Uri]::UnescapeDataString($Credentials[1]) } else { "" }
$DatabaseHost = $Uri.Host
$DatabasePort = if ($Uri.Port -gt 0) { $Uri.Port } else { 3306 }

function Find-MySqlTool([string]$Name) {
  $Found = Get-Command "$Name.exe" -ErrorAction SilentlyContinue
  if ($Found) { return $Found.Source }
  $Candidates = @(Get-ChildItem -LiteralPath "C:\wamp64\bin\mysql" -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | ForEach-Object { Join-Path $_.FullName "bin\$Name.exe" } | Where-Object { Test-Path -LiteralPath $_ })
  if (-not $Candidates.Count) { throw "$Name.exe was not found in PATH or C:\wamp64\bin\mysql." }
  return $Candidates[0]
}

function Invoke-Redirected([string]$File, [string[]]$Arguments, [string]$Stdout = "", [string]$Stdin = "") {
  $Info = [System.Diagnostics.ProcessStartInfo]::new()
  $Info.FileName = $File
  $Info.UseShellExecute = $false
  $Info.RedirectStandardError = $true
  $Info.RedirectStandardOutput = [bool]$Stdout
  $Info.RedirectStandardInput = [bool]$Stdin
  $Info.Arguments = ($Arguments | ForEach-Object { if ($_ -match '[\s"]') { '"' + $_.Replace('"', '\"') + '"' } else { $_ } }) -join ' '
  $Process = [System.Diagnostics.Process]::Start($Info)
  if ($Stdin) { $InputStream = [System.IO.File]::OpenRead($Stdin); $InputStream.CopyTo($Process.StandardInput.BaseStream); $Process.StandardInput.Close(); $InputStream.Dispose() }
  if ($Stdout) { $OutputStream = [System.IO.File]::Create($Stdout); $Process.StandardOutput.BaseStream.CopyTo($OutputStream); $OutputStream.Dispose() }
  $ErrorText = $Process.StandardError.ReadToEnd()
  $Process.WaitForExit()
  if ($Process.ExitCode -ne 0) { throw "$([System.IO.Path]::GetFileName($File)) failed: $ErrorText" }
}

$MySql = Find-MySqlTool "mysql"
$MySqlDump = Find-MySqlTool "mysqldump"
$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupRoot = Join-Path $ProjectRoot "artifacts\backups\$Stamp"
$DumpFile = Join-Path $BackupRoot "$Database.sql"
$MediaFile = Join-Path $BackupRoot "public-media.zip"
$ManifestFile = Join-Path $BackupRoot "manifest.json"
$CountsFile = Join-Path $BackupRoot "row-counts.json"
$DefaultsFile = Join-Path $BackupRoot ".mysql-client.cnf"
$OperatorDefaultsFile = Join-Path $BackupRoot ".mysql-operator.cnf"
$Rehearsal = "next_kimono_restore_$Stamp"
New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null
$EscapedPassword = $DatabasePassword.Replace('\', '\\').Replace('"', '\"')
$ClientConfig = "[client]`nhost=$DatabaseHost`nport=$DatabasePort`nuser=$DatabaseUser`npassword=`"$EscapedPassword`"`ndefault-character-set=utf8mb4`n"
if (-not $OperatorPassword) {
  Write-Host "A MySQL operator is required only to create and remove the isolated rehearsal database." -ForegroundColor Cyan
  $EnteredUser = Read-Host "MySQL operator username [$OperatorUser]"
  if ($EnteredUser.Trim()) { $OperatorUser = $EnteredUser.Trim() }
  $OperatorPassword = Read-Host "MySQL operator password (input is hidden; press Enter if blank)" -AsSecureString
}
$OperatorPlainPassword = [System.Net.NetworkCredential]::new("", $OperatorPassword).Password
$EscapedOperatorPassword = $OperatorPlainPassword.Replace('\', '\\').Replace('"', '\"')
$OperatorConfig = "[client]`nhost=$DatabaseHost`nport=$DatabasePort`nuser=$OperatorUser`npassword=`"$EscapedOperatorPassword`"`ndefault-character-set=utf8mb4`n"

try {
  [System.IO.File]::WriteAllText($DefaultsFile, $ClientConfig, [System.Text.UTF8Encoding]::new($false))
  [System.IO.File]::WriteAllText($OperatorDefaultsFile, $OperatorConfig, [System.Text.UTF8Encoding]::new($false))
  Invoke-Redirected $MySqlDump @("--defaults-extra-file=$DefaultsFile", "--single-transaction", "--routines", "--triggers", "--events", "--default-character-set=utf8mb4", $Database) $DumpFile
  $Media = @("public\images", "public\webp") | ForEach-Object { Join-Path $ProjectRoot $_ } | Where-Object { Test-Path -LiteralPath $_ }
  if ($Media) { Compress-Archive -LiteralPath $Media -DestinationPath $MediaFile -CompressionLevel Optimal }
  Invoke-Redirected $MySql @("--defaults-extra-file=$OperatorDefaultsFile", "-e", "CREATE DATABASE ``$Rehearsal`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
  Invoke-Redirected $MySql @("--defaults-extra-file=$OperatorDefaultsFile", $Rehearsal) "" $DumpFile
  Remove-Item -LiteralPath $DefaultsFile -Force
  $env:DB_REHEARSAL_NAME = $Rehearsal
  $EncodedOperatorUser = [Uri]::EscapeDataString($OperatorUser)
  $EncodedOperatorPassword = [Uri]::EscapeDataString($OperatorPlainPassword)
  $env:DB_REHEARSAL_URL = "mysql://${EncodedOperatorUser}:${EncodedOperatorPassword}@${DatabaseHost}:${DatabasePort}/${Rehearsal}"
  & node --env-file=.env scripts/compare-restore.mjs | Set-Content -LiteralPath $CountsFile -Encoding utf8
  if ($LASTEXITCODE -ne 0) { throw "Exact database row-count comparison failed." }
  $Manifest = [ordered]@{
    createdAt = (Get-Date).ToString("o")
    sourceDatabase = $Database
    rehearsalDatabase = $Rehearsal
    sqlFile = (Split-Path -Leaf $DumpFile)
    sqlSha256 = (Get-FileHash -LiteralPath $DumpFile -Algorithm SHA256).Hash
    mediaFile = if (Test-Path -LiteralPath $MediaFile) { Split-Path -Leaf $MediaFile } else { $null }
    mediaSha256 = if (Test-Path -LiteralPath $MediaFile) { (Get-FileHash -LiteralPath $MediaFile -Algorithm SHA256).Hash } else { $null }
    exactRowCounts = (Split-Path -Leaf $CountsFile)
  }
  $Manifest | ConvertTo-Json | Set-Content -LiteralPath $ManifestFile -Encoding utf8
  Write-Output "Backup and isolated restore comparison passed. Artifacts: $BackupRoot"
} finally {
  Remove-Item Env:DB_REHEARSAL_NAME -ErrorAction SilentlyContinue
  Remove-Item Env:DB_REHEARSAL_URL -ErrorAction SilentlyContinue
  if (Test-Path -LiteralPath $DefaultsFile) { Remove-Item -LiteralPath $DefaultsFile -Force }
  if (Test-Path -LiteralPath $OperatorDefaultsFile) { Remove-Item -LiteralPath $OperatorDefaultsFile -Force }
  if (-not $KeepRehearsalDatabase) {
    [System.IO.File]::WriteAllText($OperatorDefaultsFile, $OperatorConfig, [System.Text.UTF8Encoding]::new($false))
    try { Invoke-Redirected $MySql @("--defaults-extra-file=$OperatorDefaultsFile", "-e", "DROP DATABASE IF EXISTS ``$Rehearsal``") }
    finally { Remove-Item -LiteralPath $OperatorDefaultsFile -Force -ErrorAction SilentlyContinue }
  }
  $OperatorPlainPassword = $null
  $EscapedOperatorPassword = $null
  $OperatorConfig = $null
}
