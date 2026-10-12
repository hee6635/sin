package com.eonjeswieo.app

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.webkit.JavascriptInterface
import org.json.JSONObject

/** 웹 화면(자바스크립트)에서 window.AndroidBridge 로 부르는 함수들 */
class AlarmBridge(private val activity: MainActivity) {

    private val context: Context = activity.applicationContext

    /** 지금 보이는 달력 화면을 이미지로 찍어서 카카오톡 등으로 공유 */
    @JavascriptInterface
    fun shareScreen() {
        activity.runOnUiThread { activity.shareScreenshot() }
    }

    /** 백업 파일(JSON)을 만들어 공유 시트로 보내기 (카톡 나에게 보내기, 드라이브 저장 등) */
    @JavascriptInterface
    fun shareFile(name: String, content: String) {
        activity.runOnUiThread { activity.shareTextFile(name, content) }
    }

    /** 글자 크기 (100 = 보통, 115 = 크게, 130 = 아주 크게) */
    @JavascriptInterface
    fun setTextZoom(pct: Int) = activity.setTextZoom(pct)

    /** 글(초대 문구 등)을 카카오톡 등으로 보내기 */
    @JavascriptInterface
    fun shareText(title: String, text: String) {
        activity.runOnUiThread { activity.shareText(title, text) }
    }

    /** 앱 종료 (종료 확인 팝업에서 [종료]) */
    @JavascriptInterface
    fun exitApp() {
        activity.runOnUiThread { activity.finish() }
    }

    /** 폰 알람음 목록에서 고르기 → 결과는 window.__onTone({req, uri, title}) */
    @JavascriptInterface
    fun pickTone(req: String, current: String) {
        activity.runOnUiThread { activity.openTonePicker(req, current) }
    }

    /** 폰에 있는 음악 파일에서 알람음 고르기 → 앱 안에 복사한 뒤 window.__onTone({req, uri, title}) */
    @JavascriptInterface
    fun pickToneFile(req: String) {
        activity.runOnUiThread { activity.openToneFilePicker(req) }
    }

    /** 알람음 미리 듣기 (켜지면 true, 멈추면 false) */
    @JavascriptInterface
    fun previewTone(uri: String): Boolean = activity.togglePreview(uri)

    @JavascriptInterface
    fun stopPreview() = activity.stopPreview()

    /** 알람에서 쓰는 음악 파일(JSON 배열)만 남기고 나머지 복사본은 지우기 */
    @JavascriptInterface
    fun cleanTones(keepJson: String) = activity.cleanTones(keepJson)

    /** 사진 고르기 → 결과는 window.__onImage(data URL, 취소면 '', 실패면 null) */
    @JavascriptInterface
    fun pickImage() {
        activity.runOnUiThread { activity.openImagePicker() }
    }

    /** 메일 앱으로 문의 보내기 */
    @JavascriptInterface
    fun sendMail(to: String, subject: String, body: String) {
        activity.runOnUiThread { activity.sendMail(to, subject, body) }
    }

    /** 구글 로그인을 쓸 수 있는지 (Firebase 콘솔 설정이 끝난 빌드만 true) */
    @JavascriptInterface
    fun googleAvailable(): Boolean = activity.googleClientId().isNotEmpty()

    /** 구글 계정 고르기 → window.__onGoogle(결과) */
    @JavascriptInterface
    fun googleSignIn(req: String) {
        activity.runOnUiThread { activity.googleSignIn(req) }
    }

    /** 이 폰의 푸시 알림 주소 (없으면 빈 글) */
    @JavascriptInterface
    fun fcmToken(): String = PushService.token(context)

    /** 알림을 눌러서 앱이 열렸다면 그 정보(JSON), 아니면 빈 글 */
    @JavascriptInterface
    fun takePush(): String = activity.takePush()

    /** 폰 설정에서 이 앱의 알림이 켜져 있는지 */
    @JavascriptInterface
    fun notifEnabled(): Boolean = activity.notifEnabled()

    /** 앱 버전·기기 정보 (문의 메일에 같이 넣기) */
    @JavascriptInterface
    fun appInfo(): String {
        val v = try {
            context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: ""
        } catch (e: Exception) { "" }
        return JSONObject()
            .put("version", v)
            .put("device", "${Build.MANUFACTURER} ${Build.MODEL}")
            .put("android", Build.VERSION.RELEASE)
            .toString()
    }

    // ---------- 구글 드라이브 백업 (결과는 window.__onDrive(결과)) ----------

    private fun driveDone(o: JSONObject) = activity.js("window.__onDrive&&window.__onDrive($o)")

    /** 드라이브에 연결된 적이 있는지 */
    @JavascriptInterface
    fun driveLinked(): Boolean = activity.drive.linked

    /** 백업 올리기. silent=true 면 허용 창을 띄우지 않음(자동 백업용) */
    @JavascriptInterface
    fun driveBackup(json: String, meta: String, silent: Boolean) {
        activity.runOnUiThread { activity.drive.backup(json, meta, silent) { driveDone(it.put("op", "backup")) } }
    }

    @JavascriptInterface
    fun driveList(silent: Boolean) {
        activity.runOnUiThread { activity.drive.list(silent) { driveDone(it) } }
    }

    @JavascriptInterface
    fun driveRestore(id: String) {
        activity.runOnUiThread { activity.drive.restore(id) { driveDone(it) } }
    }

    @JavascriptInterface
    fun driveUnlink() = activity.drive.unlink()

    /** 기념일 전날 알림 같은 조용한 알림 목록 [{id, at, title, text}] */
    @JavascriptInterface
    fun setReminders(json: String) {
        Reminders.saveList(context, json)
    }

    /** 웹이 계산한 "앞으로 울릴 알람 목록"(JSON)을 받아서 저장하고 가장 가까운 알람을 예약 */
    @JavascriptInterface
    fun setAlarms(json: String) {
        AlarmScheduler.saveList(context, json)
    }

    /** 알람에 필요한데 아직 허용되지 않은 항목들 (예: "exact,notif"), 다 됐으면 빈 문자열 */
    @JavascriptInterface
    fun status(): String {
        val missing = ArrayList<String>()
        if (!AlarmScheduler.canScheduleExact(context)) missing.add("exact")

        val nm = context.getSystemService(NotificationManager::class.java)
        if (!nm.areNotificationsEnabled()) missing.add("notif")

        if (Build.VERSION.SDK_INT >= 34 && !nm.canUseFullScreenIntent()) missing.add("fsi")

        val pm = context.getSystemService(PowerManager::class.java)
        if (pm != null && !pm.isIgnoringBatteryOptimizations(context.packageName)) missing.add("batt")
        return missing.joinToString(",")
    }

    /** 해당 항목의 설정 화면 열기 */
    @JavascriptInterface
    fun openSettings(kind: String) {
        val pkg = Uri.parse("package:" + context.packageName)
        val intent: Intent? = when (kind) {
            "exact" ->
                if (Build.VERSION.SDK_INT >= 31) Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, pkg) else null
            "notif" ->
                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
            "fsi" ->
                if (Build.VERSION.SDK_INT >= 34) Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, pkg) else null
            // "배터리 사용 제한 없음으로 할까요?" 창 (안 되는 기기면 배터리 최적화 목록 화면)
            "batt" -> Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, pkg)
            else -> null
        }
        if (intent != null) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            try {
                context.startActivity(intent)
            } catch (e: Exception) {
                // 허용 창이 없는 기기면 배터리 최적화 목록 화면으로, 그것도 없으면 무시
                if (kind == "batt") try {
                    context.startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                } catch (e2: Exception) {}
            }
        }
    }
}
