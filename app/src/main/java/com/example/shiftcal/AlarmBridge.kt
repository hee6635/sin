package com.example.shiftcal

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.webkit.JavascriptInterface

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
