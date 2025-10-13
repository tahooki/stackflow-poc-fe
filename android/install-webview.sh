#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
APK_PATH="$PROJECT_DIR/app/build/outputs/apk/debug/app-debug.apk"

if [ ! -x "$PROJECT_DIR/gradlew" ]; then
  echo "Gradle wrapper not found. Run 'cd $PROJECT_DIR && gradle wrapper --gradle-version 8.7' first." >&2
  exit 1
fi

"$PROJECT_DIR/gradlew" assembleDebug

if [ ! -f "$APK_PATH" ]; then
  echo "Debug APK not found at $APK_PATH" >&2
  exit 2
fi

adb devices
adb install -r "$APK_PATH"
adb shell am start -n com.example.simplewebview/.MainActivity
