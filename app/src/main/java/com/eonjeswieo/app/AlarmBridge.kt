package com.eonjeswieo.app

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
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

    /** 폰 알람음 목록에서 고르기 → 결과는 window.__onTone({req, uri, title}) */
    @JavascriptInterface
    fun pickTone(req: String, current: String) {
        activity.runOnUiThread { activity.openTonePicker(req, current) }
    }

    /** 메일 앱으로 문의 보내기 */
    @JavascriptInterface
    fun sendMail(to: String, subject: String, body: String) {
        activity.runOnUiThread { activity.sendMail(to, subject, body) }
    }

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
            else -> null
        }
        if (intent != null) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            try {
                context.startActivity(intent)
            } catch (e: Exception) {
                // 설정 화면을 열 수 없는 기기면 무시
            }
        }
    }
}
