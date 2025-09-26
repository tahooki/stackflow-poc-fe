#!/usr/bin/env bash
set -euo pipefail

# Android Note20 AVD installer/runner for macOS
# Usage: ./android-avd-note20.sh [avd_name]
# Default AVD name is 'note20'.

AVD_NAME="${1:-note20}"

log() { printf "\033[32m==>\033[0m %s\n" "$*"; }
warn() { printf "\033[33mWARN\033[0m %s\n" "$*"; }
err() { printf "\033[31mERROR\033[0m %s\n" "$*" >&2; }
die() { err "$@"; exit 1; }

if [ "$(uname)" != "Darwin" ]; then
  die "This script supports macOS only."
fi

ARCH="$(uname -m)"
if [ "$ARCH" = "arm64" ]; then
  ABI="arm64-v8a"
else
  ABI="x86_64"
fi

ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}"
ANDROID_HOME="$ANDROID_SDK_ROOT"
export ANDROID_SDK_ROOT ANDROID_HOME

mkdir -p "$ANDROID_SDK_ROOT"

export PATH="$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$PATH"

need() { command -v "$1" >/dev/null 2>&1; }

ensure_homebrew() {
  if need brew; then
    return
  fi
  log "Installing Homebrew (required for Java)..."
  NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Activate brew in this shell
  if [ -x /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [ -x /usr/local/bin/brew ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
}

ensure_java() {
  if need java; then
    return
  fi
  ensure_homebrew
  log "Installing Temurin JDK..."
  brew install --cask temurin
}

ensure_cmdline_tools() {
  if [ -x "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" ]; then
    return
  fi
  log "Installing Android commandline-tools to $ANDROID_SDK_ROOT..."
  tmpdir="$(mktemp -d)"
  # Use Google's latest commandlinetools for macOS
  TOOLS_ZIP_URL="https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip"
  curl -L "$TOOLS_ZIP_URL" -o "$tmpdir/cmdline-tools.zip"
  mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools"
  unzip -q "$tmpdir/cmdline-tools.zip" -d "$ANDROID_SDK_ROOT/cmdline-tools"
  rm -rf "$tmpdir"
  # Normalize to expected 'latest' directory name
  if [ -d "$ANDROID_SDK_ROOT/cmdline-tools/cmdline-tools" ]; then
    mv "$ANDROID_SDK_ROOT/cmdline-tools/cmdline-tools" "$ANDROID_SDK_ROOT/cmdline-tools/latest"
  fi
}

install_sdk_packages() {
  local sdkmanager="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager"
  local packages=(
    "platform-tools"
    "emulator"
    "platforms;android-34"
    "system-images;android-34;google_apis;$ABI"
  )
  log "Accepting Android SDK licenses..."
  yes | "$sdkmanager" --sdk_root="$ANDROID_SDK_ROOT" --licenses >/dev/null || true
  log "Installing required SDK packages..."
  yes | "$sdkmanager" --sdk_root="$ANDROID_SDK_ROOT" "${packages[@]}"
}

ensure_avd() {
  local avd_dir="$HOME/.android/avd/${AVD_NAME}.avd"
  if [ -d "$avd_dir" ]; then
    log "AVD '$AVD_NAME' already exists."
    return
  fi
  log "Creating AVD '$AVD_NAME'..."
  local avdmanager="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/avdmanager"
  local system_image="system-images;android-34;google_apis;$ABI"
  # Try with common Pixel device profiles, then fall back to no device profile
  if echo "no" | "$avdmanager" create avd -n "$AVD_NAME" -k "$system_image" --device "pixel_5"; then
    :
  elif echo "no" | "$avdmanager" create avd -n "$AVD_NAME" -k "$system_image" --device "pixel_6"; then
    :
  elif echo "no" | "$avdmanager" create avd -n "$AVD_NAME" -k "$system_image" --device "pixel"; then
    :
  else
    echo "no" | "$avdmanager" create avd -n "$AVD_NAME" -k "$system_image"
  fi
}

start_emulator() {
  local emulator_bin="$ANDROID_SDK_ROOT/emulator/emulator"
  if [ ! -x "$emulator_bin" ]; then
    die "Emulator binary not found at $emulator_bin"
  fi
  log "Starting emulator '$AVD_NAME'..."
  exec "$emulator_bin" -avd "$AVD_NAME" -netdelay none -netspeed full -no-boot-anim -accel on
}

main() {
  log "Using ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT (arch: $ARCH, abi: $ABI)"
  ensure_java
  ensure_cmdline_tools
  install_sdk_packages
  ensure_avd
  start_emulator
}

main "$@"


