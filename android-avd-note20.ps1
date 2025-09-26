<#
  Android Note20 AVD installer/runner for Windows (PowerShell)

  Usage:
    - Right click the .ps1 and Run with PowerShell (or):
    - powershell.exe -ExecutionPolicy Bypass -File .\android-avd-note20.ps1 [avd_name]

  Notes:
    - Requires Windows 10/11. The script will install Temurin JDK (via winget/choco),
      Android commandline-tools, emulator, and the Android 34 Google APIs system image.
    - Creates an AVD named 'note20' if missing, then starts it.
#>

param(
  [string]$AvdName = "note20"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "==> $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "WARN $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "ERROR $msg" -ForegroundColor Red }

if ($IsWindows -ne $true) {
  Write-Err "This script supports Windows only."
  exit 1
}

# Detect architecture
$arch = (Get-CimInstance Win32_OperatingSystem).OSArchitecture
if ($arch -match 'ARM64') { $abi = 'arm64-v8a' } else { $abi = 'x86_64' }

# Default SDK root on Windows
$env:ANDROID_SDK_ROOT = if ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
$env:ANDROID_HOME = $env:ANDROID_SDK_ROOT

New-Item -ItemType Directory -Force -Path $env:ANDROID_SDK_ROOT | Out-Null

# Ensure unzip availability via tar/Expand-Archive
function Ensure-Java {
  if (Get-Command java -ErrorAction SilentlyContinue) { return }
  Write-Info "Installing Temurin JDK..."
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    try {
      winget install --id EclipseAdoptium.TemurinJDK.21.JRE -e --source winget --accept-source-agreements --accept-package-agreements
    } catch {
      # fallback full JDK
      winget install --id EclipseAdoptium.Temurin.21.JDK -e --source winget --accept-source-agreements --accept-package-agreements
    }
  } elseif (Get-Command choco -ErrorAction SilentlyContinue) {
    choco install temurin11 -y
  } else {
    Write-Err "Please install Java (Temurin JDK) or install winget/choco."
    exit 1
  }
}

function Ensure-CmdlineTools {
  $sdkMgr = Join-Path $env:ANDROID_SDK_ROOT 'cmdline-tools\latest\bin\sdkmanager.bat'
  if (Test-Path $sdkMgr) { return }
  Write-Info "Installing Android commandline-tools to $($env:ANDROID_SDK_ROOT)..."
  $tmp = New-Item -ItemType Directory -Path ([System.IO.Path]::GetTempPath() + [System.IO.Path]::GetRandomFileName()) -Force
  $url = 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip'
  $zip = Join-Path $tmp.FullName 'cmdline-tools.zip'
  Invoke-WebRequest -Uri $url -OutFile $zip
  $dest = Join-Path $env:ANDROID_SDK_ROOT 'cmdline-tools'
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  Expand-Archive -Path $zip -DestinationPath $dest -Force
  Remove-Item -Recurse -Force $tmp.FullName
  $inner = Join-Path $dest 'cmdline-tools'
  $latest = Join-Path $dest 'latest'
  if (Test-Path $inner) { Move-Item -Force $inner $latest }
}

function Install-SdkPackages {
  $sdkMgr = Join-Path $env:ANDROID_SDK_ROOT 'cmdline-tools\latest\bin\sdkmanager.bat'
  $packages = @(
    'platform-tools',
    'emulator',
    'platforms;android-34',
    "system-images;android-34;google_apis;$abi"
  )
  Write-Info 'Accepting Android SDK licenses...'
  "y`n" * 20 | & $sdkMgr --sdk_root=$env:ANDROID_SDK_ROOT --licenses | Out-Null
  Write-Info 'Installing required SDK packages...'
  foreach ($p in $packages) {
    "y`n" | & $sdkMgr --sdk_root=$env:ANDROID_SDK_ROOT $p
  }
}

function Ensure-Avd {
  $avdDir = Join-Path $env:USERPROFILE ".android\avd\$AvdName.avd"
  if (Test-Path $avdDir) { Write-Info "AVD '$AvdName' already exists."; return }
  Write-Info "Creating AVD '$AvdName'..."
  $avdMgr = Join-Path $env:ANDROID_SDK_ROOT 'cmdline-tools\latest\bin\avdmanager.bat'
  $sysImg = "system-images;android-34;google_apis;$abi"
  $devices = @('pixel_5','pixel_6','pixel')
  $created = $false
  foreach ($d in $devices) {
    try {
      $p = Start-Process -FilePath $avdMgr -ArgumentList @('create','avd','-n',$AvdName,'-k',$sysImg,'--device',$d) -RedirectStandardInput 'Pipe' -NoNewWindow -PassThru -Wait
      $p.StandardInput.WriteLine('no')
      $p.StandardInput.Close()
      if ($p.ExitCode -eq 0) { $created = $true; break }
    } catch {}
  }
  if (-not $created) {
    $p = Start-Process -FilePath $avdMgr -ArgumentList @('create','avd','-n',$AvdName,'-k',$sysImg) -RedirectStandardInput 'Pipe' -NoNewWindow -PassThru -Wait
    $p.StandardInput.WriteLine('no')
    $p.StandardInput.Close()
    if ($p.ExitCode -ne 0) { throw "Failed to create AVD $AvdName" }
  }
}

function Start-Emulator {
  $emu = Join-Path $env:ANDROID_SDK_ROOT 'emulator\emulator.exe'
  if (-not (Test-Path $emu)) { throw "Emulator not found at $emu" }
  Write-Info "Starting emulator '$AvdName'..."
  Start-Process -FilePath $emu -ArgumentList @('-avd', $AvdName, '-netdelay','none','-netspeed','full','-no-boot-anim','-accel','on')
}

function Add-PathIfMissing($p) {
  if ($env:Path -notmatch [Regex]::Escape($p)) { $env:Path = "$p;$env:Path" }
}

Write-Info "Using ANDROID_SDK_ROOT=$($env:ANDROID_SDK_ROOT) (arch: $arch, abi: $abi)"
Ensure-Java
Ensure-CmdlineTools

Add-PathIfMissing (Join-Path $env:ANDROID_SDK_ROOT 'platform-tools')
Add-PathIfMissing (Join-Path $env:ANDROID_SDK_ROOT 'emulator')
Add-PathIfMissing (Join-Path $env:ANDROID_SDK_ROOT 'cmdline-tools\latest\bin')

Install-SdkPackages
Ensure-Avd
Start-Emulator


