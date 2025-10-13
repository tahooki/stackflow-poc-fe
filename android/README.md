# Simple WebView CLI Project

This module packages an Android WebView shell that can be built and installed onto a connected device directly from the command line.

## Prerequisites
- JDK 17 available on the PATH (`java -version`)
- Android SDK command-line tools with platform 34 and build-tools 34.0.0 (`sdkmanager --list`)
- `adb` accessible with an unlocked device in USB debugging mode

## Project Layout
```
android/
├─ settings.gradle.kts
├─ build.gradle.kts
├─ install-webview.sh
└─ app/
   ├─ build.gradle.kts
   ├─ proguard-rules.pro
   └─ src/main/
      ├─ AndroidManifest.xml
      ├─ java/com/example/simplewebview/MainActivity.kt
      └─ res/
         ├─ layout/activity_main.xml
         └─ values/themes.xml
```

## Usage
1. Build, install, and launch on the connected device:
   ```bash
   ./install-webview.sh
   ```
   The script assembles the debug APK, reinstalls it with `adb`, and starts `MainActivity`.

2. Update the default landing URL by editing `intent?.data` fallback inside `MainActivity.kt`.

> Tip: Keep Chrome DevTools open (`chrome://inspect`) to debug the WebView with `WebView.setWebContentsDebuggingEnabled(true)` already enabled.
