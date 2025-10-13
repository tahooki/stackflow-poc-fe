# 목표
- Android Studio **없이** macOS에서 **커맨드라인만**으로 WebView 앱을 빌드/설치(ADB)
- **URL 입력 → WebView로 접속** 기능만 포함 (메모리/프로파일링 관련 내용 제외)

---


## 0. 사전 조건 (이미 어느 정도 설치되어 있다고 가정)
- macOS (zsh 가정)
- **ADB** 설치 및 USB 디버깅 허용 상태
- Android SDK(Commandline Tools) + Build-Tools + Platform 34
- **JDK 17**

> 점검용 스니펫
```bash
java -version          # 17.x 여야 안정적
adb version            # ADB 인식
sdkmanager --list | head
```

필요 시(참고):
```bash
brew install --cask temurin17 android-commandlinetools
brew install android-platform-tools

# 환경변수 (zsh)
echo 'export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"' >>~/.zshrc
echo 'export PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"' >>~/.zshrc
source ~/.zshrc

sdkmanager --licenses <<<'y'
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools"
```

---

## 1. 프로젝트 뼈대(Studio 없이) 만들기
아래 구조로 파일 생성:
```
simple-webview/
├─ settings.gradle.kts
├─ build.gradle.kts
├─ app/
│  ├─ build.gradle.kts
│  ├─ proguard-rules.pro
│  └─ src/main/
│     ├─ AndroidManifest.xml
│     ├─ res/
│     │  ├─ layout/activity_main.xml
│     │  └─ values/themes.xml
│     └─ java/com/example/simplewebview/MainActivity.kt
```

### settings.gradle.kts
```kotlin
pluginManagement {
  repositories { google(); mavenCentral(); gradlePluginPortal() }
}
dependencyResolutionManagement {
  repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
  repositories { google(); mavenCentral() }
}
rootProject.name = "simple-webview"
include(":app")
```

### 루트 build.gradle.kts
```kotlin
plugins {
  id("com.android.application") version "8.5.2" apply false
  id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}
```

### app/build.gradle.kts
```kotlin
plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
}

android {
  namespace = "com.example.simplewebview"
  compileSdk = 34

  defaultConfig {
    applicationId = "com.example.simplewebview"
    minSdk = 24
    targetSdk = 34
    versionCode = 1
    versionName = "1.0"
  }

  buildTypes {
    debug {}
    release {
      isMinifyEnabled = false
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
    }
  }

  buildFeatures { viewBinding = true }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }
  kotlinOptions { jvmTarget = "17" }
}

dependencies {
  implementation("androidx.core:core-ktx:1.13.1")
  implementation("androidx.appcompat:appcompat:1.7.0")
  implementation("androidx.activity:activity-ktx:1.9.3")
}
```

### app/proguard-rules.pro
```pro
# 빈 파일이어도 OK
```

### app/src/main/AndroidManifest.xml
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.simplewebview">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:label="SimpleWebView"
        android:theme="@style/Theme.SimpleWebView"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- (선택) 외부앱에서 http/https 링크로 열기 -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="android.intent.category.BROWSABLE"/>
                <data android:scheme="http"/>
                <data android:scheme="https"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### app/src/main/res/layout/activity_main.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:orientation="vertical" android:layout_width="match_parent" android:layout_height="match_parent">

    <LinearLayout
        android:layout_width="match_parent" android:layout_height="wrap_content"
        android:padding="8dp">
        <EditText
            android:id="@+id/urlInput"
            android:layout_width="0dp" android:layout_height="wrap_content"
            android:layout_weight="1"
            android:hint="https://example.com"
            android:imeOptions="actionGo"
            android:inputType="textUri" />
        <Button
            android:id="@+id/goBtn"
            android:layout_width="wrap_content" android:layout_height="wrap_content"
            android:text="GO" />
    </LinearLayout>

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent" android:layout_height="0dp"
        android:layout_weight="1" />
</LinearLayout>
```

### app/src/main/res/values/themes.xml
```xml
<resources>
    <style name="Theme.SimpleWebView" parent="Theme.AppCompat.Light.NoActionBar"/>
</resources>
```

### app/src/main/java/com/example/simplewebview/MainActivity.kt
```kotlin
package com.example.simplewebview

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.view.inputmethod.EditorInfo
import android.webkit.*
import android.widget.Button
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var urlInput: EditText
    private lateinit var goBtn: Button

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        urlInput = findViewById(R.id.urlInput)
        goBtn = findViewById(R.id.goBtn)

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            useWideViewPort = true
            loadWithOverviewMode = true
            builtInZoomControls = false
            displayZoomControls = false
        }

        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(v: WebView?, r: WebResourceRequest?): Boolean = false
            override fun onPageStarted(v: WebView?, url: String?, icon: Bitmap?) { urlInput.setText(url) }
            override fun onReceivedSslError(v: WebView?, h: SslErrorHandler?, e: SslError?) { h?.cancel() }
        }

        goBtn.setOnClickListener { loadFromInput() }
        urlInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_GO) { loadFromInput(); true } else false
        }

        val start = intent?.data?.toString() ?: "https://example.com"
        urlInput.setText(start)
        webView.loadUrl(start)
    }

    private fun normalizeUrl(raw: String): String {
        var u = raw.trim()
        if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://$u"
        return try { Uri.parse(u).toString() } catch (_: Exception) { "https://example.com" }
    }

    private fun loadFromInput() { webView.loadUrl(normalizeUrl(urlInput.text?.toString() ?: "")) }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) { webView.goBack(); return true }
        return super.onKeyDown(keyCode, event)
    }
}
```kotlin
package com.example.simplewebview

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.EditorInfo
import android.webkit.*
import android.widget.Button
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var urlInput: EditText
    private lateinit var goBtn: Button

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        WebView.setWebContentsDebuggingEnabled(true) // Chrome DevTools 연결용

        webView = findViewById(R.id.webView)
        urlInput = findViewById(R.id.urlInput)
        goBtn = findViewById(R.id.goBtn)

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            useWideViewPort = true
            loadWithOverviewMode = true
            builtInZoomControls = false
            displayZoomControls = false
            setOffscreenPreRaster(false)
            cacheMode = WebSettings.LOAD_NO_CACHE
        }

        // 렌더러 우선순위 (API26+)
        try {
            webView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false)
        } catch (_: Throwable) {}

        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(v: WebView?, r: WebResourceRequest?): Boolean = false
            override fun onPageStarted(v: WebView?, url: String?, icon: Bitmap?) { urlInput.setText(url) }
            override fun onReceivedSslError(v: WebView?, h: SslErrorHandler?, e: SslError?) { h?.cancel() }
        }

        goBtn.setOnClickListener { loadFromInput() }
        urlInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_GO) { loadFromInput(); true } else false
        }

        val start = intent?.data?.toString() ?: "https://localhost:8000" // 아래 2-1 로컬 서버 예제와 연동
        urlInput.setText(start)
        webView.loadUrl(start)
    }

    private fun normalizeUrl(raw: String): String {
        var u = raw.trim()
        if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://$u"
        return try { Uri.parse(u).toString() } catch (_: Exception) { "https://example.com" }
    }

    private fun loadFromInput() { webView.loadUrl(normalizeUrl(urlInput.text?.toString() ?: "")) }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) { webView.goBack(); return true }
        return super.onKeyDown(keyCode, event)
    }

    override fun onPause() { super.onPause(); webView.onPause() }
    override fun onResume() { super.onResume(); webView.onResume() }
    override fun onDestroy() {
        (webView.parent as? android.view.ViewGroup)?.removeView(webView)
        webView.removeAllViews(); webView.destroy(); super.onDestroy()
    }
}
```

---


## 3. 빌드 & 설치 (CLI)
프로젝트 루트에서:
```bash
# 1) Gradle Wrapper 생성 (최초 1회)
(cd simple-webview && gradle wrapper --gradle-version 8.7)

# 2) 디버그 APK 빌드
(cd simple-webview && ./gradlew assembleDebug)

# 3) 설치
adb devices
adb install -r simple-webview/app/build/outputs/apk/debug/app-debug.apk

# 4) 실행
adb shell am start -n com.example.simplewebview/.MainActivity
```

### 패키지/액티비티 찾기 헬퍼
```bash
# 설치된 패키지 확인
adb shell pm list packages | grep simplewebview
# 런처 액티비티 확인
adb shell cmd package resolve-activity --brief com.example.simplewebview | tail -n 1
```

---



## 6. 문제 해결 체크리스트
- **http 접속 불가**: Manifest `usesCleartextTraffic=true` 또는 HTTPS 사용
- **로컬 서버 접속 실패**: 같은 네트워크/방화벽 확인, URL에 **맥 IP** 사용
- **DevTools 안 잡힘**: `WebView.setWebContentsDebuggingEnabled(true)` 호출 여부, USB 디버깅
- **빌드 도구 없음**: `sdkmanager`로 `build-tools;34.0.0`/`platforms;android-34` 재설치

---

