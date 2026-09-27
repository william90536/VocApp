param(
  [ValidateSet('debug', 'release')]
  [string]$Variant = 'release'
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$androidRoot = Join-Path $projectRoot 'android'
$apkPath = Join-Path $androidRoot "app\build\outputs\apk\$Variant\app-$Variant.apk"
$gradleTask = "assemble$($Variant.Substring(0, 1).ToUpperInvariant())$($Variant.Substring(1))"
$env:GRADLE_USER_HOME = Join-Path $projectRoot '.gradle-cache'
$jdkRoot = Join-Path $projectRoot '.tooling\jdk17'
$bundledJdk = Get-ChildItem -LiteralPath $jdkRoot -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
if ($bundledJdk) {
  $env:JAVA_HOME = $bundledJdk.FullName
  $env:PATH = (Join-Path $env:JAVA_HOME 'bin') + ';' + $env:PATH
}

$javaExecutable = if ($env:JAVA_HOME -and (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
  Join-Path $env:JAVA_HOME 'bin\java.exe'
} else {
  (Get-Command java.exe -ErrorAction SilentlyContinue).Source
}
if (-not $javaExecutable) { throw 'JDK 17 is required. Install Microsoft OpenJDK 17 or set JAVA_HOME to a JDK 17 folder.' }
$javaHome = Split-Path -Parent (Split-Path -Parent $javaExecutable)
$releaseFile = Join-Path $javaHome 'release'
$versionLine = if (Test-Path -LiteralPath $releaseFile) { [System.IO.File]::ReadAllLines($releaseFile) | Where-Object { $_ -like 'JAVA_VERSION=*' } | Select-Object -First 1 } else { $null }
if (-not $versionLine -or $versionLine -notlike 'JAVA_VERSION="17.*"') { throw "JDK 17 is required for this Expo/React Native Android build. Detected: $versionLine" }

Push-Location $projectRoot
try {
  if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules\expo\package.json'))) {
    Write-Host 'Installing JavaScript dependencies...'
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
  }

  Push-Location $androidRoot
  try {
    & .\gradlew.bat $gradleTask --no-daemon
    if ($LASTEXITCODE -ne 0) { throw 'Android build failed. Review the Gradle output above.' }
  } finally {
    Pop-Location
  }

  if (-not (Test-Path -LiteralPath $apkPath)) { throw "Build completed but the APK was not found: $apkPath" }
  Get-Item -LiteralPath $apkPath | Select-Object FullName, Length, LastWriteTime
} finally {
  Pop-Location
}
