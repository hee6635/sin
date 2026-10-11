package com.eonjeswieo.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.media.AudioAttributes
import android.media.ExifInterface
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.OpenableColumns
import android.util.Base64
import android.webkit.JsResult
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.FileProvider
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import org.json.JSONArray

/** 알람음으로 쓸 내 음악 파일 크기 한도 */
private const val TONE_MAX = 10L * 1024 * 1024

/**
 * 언제쉬어 화면(assets/index.html)을 WebView 로 보여주는 껍데기 앱.
 * 화면은 웹이 그리고, 알람은 안드로이드(AlarmManager)가 울립니다.
 */
class MainActivity : ComponentActivity() {

    companion object {
        /** 앱 화면 주소. file:// 대신 https 주소로 열어야 로그인·저장소(IndexedDB)가 제대로 동작 */
        const val HOST = "appassets.androidplatform.net"
        const val START_URL = "https://$HOST/assets/index.html"
    }

    private lateinit var webView: WebView
    lateinit var drive: DriveBackup

    // 웹의 <input type="file"> (백업 불러오기) 에 고른 파일을 돌려주는 통로
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private val pickFile = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        fileCallback?.onReceiveValue(if (uri != null) arrayOf(uri) else null)
        fileCallback = null
    }

    // 사진 고르기 (이모티콘 대신 쓸 사진): 안드로이드 사진 선택 창 → 1024px 로 줄여서 웹에 넘김
    private val pickImage = registerForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri == null) {
            js("window.__onImage&&window.__onImage('')")
            return@registerForActivityResult
        }
        Thread {
            val data = loadImageDataUrl(uri)
            js("window.__onImage&&window.__onImage(${if (data.isEmpty()) "null" else JSONObject.quote(data)})")
        }.start()
    }

    // 알람음 고르기 창
    private var toneReq = ""
    private val pickTone = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
        if (res.resultCode != RESULT_OK) return@registerForActivityResult
        @Suppress("DEPRECATION")
        val uri: Uri? = res.data?.getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI)
        val title = if (uri == null) "무음" else try {
            RingtoneManager.getRingtone(this, uri)?.getTitle(this) ?: "알람음"
        } catch (e: Exception) { "알람음" }
        val o = JSONObject().put("req", toneReq).put("uri", uri?.toString() ?: "").put("title", title)
        js("window.__onTone&&window.__onTone($o)")
    }

    // 내 음악 파일 고르기 → 앱 안(files/tones)에 복사 (원본을 지워도 울리게)
    private val pickToneFileLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri == null) return@registerForActivityResult
        val req = toneReq
        Thread {
            val o = JSONObject().put("req", req)
            try {
                var name = "내 음악"
                var size = -1L
                contentResolver.query(uri, null, null, null, null)?.use { c ->
                    if (c.moveToFirst()) {
                        val ni = c.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                        val si = c.getColumnIndex(OpenableColumns.SIZE)
                        if (ni >= 0) c.getString(ni)?.let { name = it }
                        if (si >= 0 && !c.isNull(si)) size = c.getLong(si)
                    }
                }
                if (size > TONE_MAX) {
                    o.put("error", "10MB 보다 작은 파일을 골라 주세요")
                } else {
                    val dir = File(filesDir, "tones").apply { mkdirs() }
                    val ext = name.substringAfterLast('.', "").take(5).filter { it.isLetterOrDigit() }
                    val f = File(dir, "t" + System.currentTimeMillis() + if (ext.isEmpty()) "" else ".$ext")
                    var total = 0L
                    contentResolver.openInputStream(uri)!!.use { inp ->
                        f.outputStream().use { out ->
                            val buf = ByteArray(64 * 1024)
                            while (true) {
                                val n = inp.read(buf)
                                if (n < 0) break
                                total += n
                                if (total > TONE_MAX) throw IllegalStateException("big")
                                out.write(buf, 0, n)
                            }
                        }
                    }
                    // 소리가 나는 파일인지 확인
                    val ok = try {
                        MediaPlayer().run { setDataSource(f.path); prepare(); release() }; true
                    } catch (e: Exception) { false }
                    if (!ok) {
                        f.delete()
                        o.put("error", "이 파일은 소리로 틀 수 없어요")
                    } else {
                        o.put("uri", Uri.fromFile(f).toString()).put("title", name.substringBeforeLast('.'))
                    }
                }
            } catch (e: Exception) {
                o.put("error", if (e.message == "big") "10MB 보다 작은 파일을 골라 주세요" else "파일을 읽지 못했어요")
            }
            js("window.__onTone&&window.__onTone($o)")
        }.start()
    }

    // 알람음 미리 듣기
    private var preview: MediaPlayer? = null

    @Synchronized
    fun togglePreview(uri: String): Boolean {
        if (preview != null) { stopPreview(); return false }
        return try {
            val mp = MediaPlayer()
            mp.setAudioAttributes(
                AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
            )
            val u = if (uri.isEmpty()) RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM) else Uri.parse(uri)
            mp.setDataSource(this, u)
            mp.prepare()
            mp.setOnCompletionListener { stopPreview() }
            mp.start()
            preview = mp
            webView.postDelayed({ stopPreview() }, 15000)
            true
        } catch (e: Exception) {
            stopPreview(); false
        }
    }

    @Synchronized
    fun stopPreview() {
        try { preview?.stop() } catch (e: Exception) {}
        try { preview?.release() } catch (e: Exception) {}
        preview = null
    }

    fun cleanTones(keepJson: String) {
        try {
            val keep = HashSet<String>()
            val a = JSONArray(keepJson)
            for (i in 0 until a.length()) Uri.parse(a.getString(i)).path?.let { keep.add(File(it).name) }
            File(filesDir, "tones").listFiles()?.forEach { if (it.name !in keep) it.delete() }
        } catch (e: Exception) {}
    }

    fun openToneFilePicker(req: String) {
        toneReq = req
        try { pickToneFileLauncher.launch("audio/*") } catch (e: Exception) {
            Toast.makeText(this, "음악 파일을 고를 수 없어요", Toast.LENGTH_SHORT).show()
        }
    }

    // 구글 드라이브 허용 창
    private val consent = registerForActivityResult(ActivityResultContracts.StartIntentSenderForResult()) { res ->
        drive.onAuthResult(res.data)
    }

    private fun isNight(): Boolean =
        (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES

    /** 웹 화면의 자바스크립트 실행 (어느 스레드에서 불러도 됨) */
    fun js(code: String) {
        webView.post { webView.evaluateJavascript(code, null) }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)

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

        // 상태바·내비게이션바·키보드를 피해서 그리기
        // (키보드가 올라오면 그 높이만큼 화면을 줄여서 입력칸이 가려지지 않게)
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
            v.setPadding(bars.left, bars.top, bars.right, maxOf(bars.bottom, ime.bottom))
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
            allowFileAccess = false
        }

        drive = DriveBackup(this)
        drive.launchConsent = { pi ->
            consent.launch(IntentSenderRequest.Builder(pi.intentSender).build())
        }

        // 웹 화면 → 안드로이드 통로 (알람 등록, 권한 상태, 공유, 백업 …)
        webView.addJavascriptInterface(AlarmBridge(this), "AndroidBridge")

        // 앱 안의 assets 폴더를 https://appassets.androidplatform.net/assets/ 주소로 열기
        val assets = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                assets.shouldInterceptRequest(request.url)

            // 내 화면 밖으로 나가는 링크는 막기 (메일 쓰기만 메일 앱으로)
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val u = request.url
                if (u.scheme == "mailto") {
                    try { startActivity(Intent(Intent.ACTION_SENDTO, u)) } catch (e: Exception) {}
                    return true
                }
                return u.host != HOST
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

        webView.loadUrl(START_URL)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        // 설정 화면에서 권한을 바꾸고 돌아왔을 수 있으니 알람 예약을 다시 확인하고 화면을 새로 고침
        AlarmScheduler.scheduleNext(this)
        webView.evaluateJavascript("window.__refresh&&window.__refresh()", null)
    }

    /** 글자 크기 (100 = 보통) */
    fun setTextZoom(pct: Int) {
        webView.post { webView.settings.textZoom = pct.coerceIn(80, 160) }
    }

    /** 사진 선택 창 열기 (권한을 묻지 않는 안드로이드 사진 선택 창) */
    fun openImagePicker() {
        try {
            pickImage.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
        } catch (e: Exception) {
            Toast.makeText(this, "사진을 고를 수 없어요", Toast.LENGTH_SHORT).show()
        }
    }

    /** 고른 사진을 긴 쪽 1024px 이하로 줄이고 방향을 바로잡아 JPEG data URL 로 */
    private fun loadImageDataUrl(uri: Uri): String {
        return try {
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
            var sample = 1
            while (maxOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= 1024) sample *= 2
            var bmp = contentResolver.openInputStream(uri)?.use {
                BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample })
            } ?: return ""
            val rot = try {
                contentResolver.openInputStream(uri)?.use {
                    when (ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
                        ExifInterface.ORIENTATION_ROTATE_90 -> 90
                        ExifInterface.ORIENTATION_ROTATE_180 -> 180
                        ExifInterface.ORIENTATION_ROTATE_270 -> 270
                        else -> 0
                    }
                } ?: 0
            } catch (e: Exception) { 0 }
            // 긴 쪽 1024px 로 맞추고 방향 바로잡기
            val scale = minOf(1f, 1024f / maxOf(bmp.width, bmp.height))
            if (rot != 0 || scale < 1f) {
                val m = Matrix().apply { postScale(scale, scale); postRotate(rot.toFloat()) }
                bmp = Bitmap.createBitmap(bmp, 0, 0, bmp.width, bmp.height, m, true)
            }
            val out = ByteArrayOutputStream()
            bmp.compress(Bitmap.CompressFormat.JPEG, 88, out)
            "data:image/jpeg;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
        } catch (e: Exception) { "" }
    }

    /** 폰의 알람음 목록 창 열기 */
    fun openTonePicker(req: String, current: String) {
        toneReq = req
        val i = Intent(RingtoneManager.ACTION_RINGTONE_PICKER)
            .putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_ALARM)
            .putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, "알람음 선택")
            .putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false)
            .putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true)
            .putExtra(
                RingtoneManager.EXTRA_RINGTONE_EXISTING_URI,
                if (current.isEmpty()) RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM) else Uri.parse(current)
            )
        try { pickTone.launch(i) } catch (e: Exception) {
            Toast.makeText(this, "알람음 목록을 열 수 없어요", Toast.LENGTH_SHORT).show()
        }
    }

    /** 메일 앱으로 문의 보내기 */
    fun sendMail(to: String, subject: String, body: String) {
        val i = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:"))
            .putExtra(Intent.EXTRA_EMAIL, if (to.isEmpty()) arrayOf() else arrayOf(to))
            .putExtra(Intent.EXTRA_SUBJECT, subject)
            .putExtra(Intent.EXTRA_TEXT, body)
        try { startActivity(Intent.createChooser(i, "문의하기")) } catch (e: Exception) {
            Toast.makeText(this, "메일 앱이 없어요", Toast.LENGTH_SHORT).show()
        }
    }

    /** 지금 보이는 화면을 PNG 로 저장하고 공유 시트 열기 */
    fun shareScreenshot() {
        if (webView.width == 0 || webView.height == 0) return
        try {
            val bmp = Bitmap.createBitmap(webView.width, webView.height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bmp)
            canvas.drawColor(if (isNight()) Color.parseColor("#111318") else Color.WHITE)
            webView.draw(canvas)
            val file = shareDir().resolve("eonjeswieo.png")
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

    /** 글을 공유 시트로 보내기 (카카오톡 · 문자 등) */
    fun shareText(title: String, text: String) {
        try {
            val send = Intent(Intent.ACTION_SEND)
                .setType("text/plain")
                .putExtra(Intent.EXTRA_TEXT, text)
            startActivity(Intent.createChooser(send, title))
        } catch (e: Exception) {
            Toast.makeText(this, "공유 창을 열 수 없어요", Toast.LENGTH_SHORT).show()
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
        stopPreview()
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
