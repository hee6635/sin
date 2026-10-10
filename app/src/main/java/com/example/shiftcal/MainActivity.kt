package com.example.shiftcal

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.JsResult
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.FileProvider
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

/**
 * 교대달력 화면(assets/index.html)을 WebView 로 보여주는 껍데기 앱.
 * 화면은 웹이 그리고, 알람은 안드로이드(AlarmManager)가 울립니다.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

    // 웹의 <input type="file"> (백업 불러오기) 에 고른 파일을 돌려주는 통로
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private val pickFile = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        fileCallback?.onReceiveValue(if (uri != null) arrayOf(uri) else null)
        fileCallback = null
    }

    private fun isNight(): Boolean =
        (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = FrameLayout(this)
        root.setBackgroundColor(if (isNight()) Color.parseColor("#111318") else Color.WHITE)
        webView = WebView(this)
        root.addView(
            webView,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )
        setContentView(root)

        // 상태바·내비게이션바를 피해서 그리기, 아이콘 색은 다크 모드에 맞춰서
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            WindowInsetsCompat.CONSUMED
        }
        val controller = WindowCompat.getInsetsController(window, root)
        controller.isAppearanceLightStatusBars = !isNight()
        controller.isAppearanceLightNavigationBars = !isNight()
        webView.setBackgroundColor(Color.TRANSPARENT)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true   // 웹 화면의 localStorage 저장에 필요
            allowContentAccess = false
        }

        // 웹 화면 → 안드로이드 통로 (알람 등록, 권한 상태)
        webView.addJavascriptInterface(AlarmBridge(this), "AndroidBridge")

        // 내 화면(assets) 밖으로 나가는 링크는 막기
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                return !request.url.toString().startsWith("file:///android_asset/")
            }
        }

        // 웹의 confirm()/alert() 창이 WebView 에서는 기본으로 안 뜨므로 직접 띄워준다
        webView.webChromeClient = object : WebChromeClient() {
            override fun onJsConfirm(
                view: WebView?, url: String?, message: String?, result: JsResult?
            ): Boolean {
                AlertDialog.Builder(this@MainActivity)
                    .setMessage(message)
                    .setPositiveButton("확인") { _, _ -> result?.confirm() }
                    .setNegativeButton("취소") { _, _ -> result?.cancel() }
                    .setOnCancelListener { result?.cancel() }
                    .show()
                return true
            }

            override fun onJsAlert(
                view: WebView?, url: String?, message: String?, result: JsResult?
            ): Boolean {
                AlertDialog.Builder(this@MainActivity)
                    .setMessage(message)
                    .setPositiveButton("확인") { _, _ -> result?.confirm() }
                    .setOnCancelListener { result?.cancel() }
                    .show()
                return true
            }

            override fun onShowFileChooser(
                view: WebView?, callback: ValueCallback<Array<Uri>>?, params: FileChooserParams?
            ): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = callback
                try {
                    pickFile.launch("*/*")
                } catch (e: Exception) {
                    fileCallback = null
                    return false
                }
                return true
            }
        }

        // 뒤로가기: 웹 화면이 먼저 처리(시트 닫기, 달력으로 돌아가기), 처리할 게 없으면 앱 종료
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript("window.__onBack&&window.__onBack()") { r ->
                    if (r != "true") finish()
                }
            }
        })

        // 알림 허용 요청 (안드로이드 13 이상)
        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1)
        }

        webView.loadUrl("file:///android_asset/index.html")
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        // 설정 화면에서 권한을 바꾸고 돌아왔을 수 있으니 알람 예약을 다시 확인하고 화면을 새로 고침
        AlarmScheduler.scheduleNext(this)
        webView.evaluateJavascript("window.__refresh&&window.__refresh()", null)
    }

    /** 지금 보이는 화면을 PNG 로 저장하고 공유 시트 열기 */
    fun shareScreenshot() {
        if (webView.width == 0 || webView.height == 0) return
        try {
            val bmp = Bitmap.createBitmap(webView.width, webView.height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bmp)
            canvas.drawColor(if (isNight()) Color.parseColor("#111318") else Color.WHITE)
            webView.draw(canvas)
            val file = shareDir().resolve("shiftcal.png")
            file.outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
            bmp.recycle()
            share(file, "image/png", "달력 공유")
        } catch (e: Exception) {
            Toast.makeText(this, "화면을 저장하지 못했어요", Toast.LENGTH_SHORT).show()
        }
    }

    /** 글자 파일(백업)을 만들어 공유 시트 열기 */
    fun shareTextFile(name: String, content: String) {
        try {
            val safe = name.replace(Regex("[^A-Za-z0-9._-]"), "_").ifEmpty { "backup.json" }
            val file = shareDir().resolve(safe)
            file.writeText(content)
            share(file, "application/json", "백업 파일 보내기")
        } catch (e: Exception) {
            Toast.makeText(this, "백업 파일을 만들지 못했어요", Toast.LENGTH_SHORT).show()
        }
    }

    private fun shareDir() = cacheDir.resolve("share").apply { mkdirs() }

    private fun share(file: java.io.File, mime: String, title: String) {
        val uri = FileProvider.getUriForFile(this, "$packageName.files", file)
        val send = Intent(Intent.ACTION_SEND)
            .setType(mime)
            .putExtra(Intent.EXTRA_STREAM, uri)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        startActivity(Intent.createChooser(send, title))
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
