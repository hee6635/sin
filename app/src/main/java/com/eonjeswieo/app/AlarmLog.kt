package com.eonjeswieo.app

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * v0.217 알람 기록: 예약 · 울림 · 재생 실패 · 끄기 · 다시 울림을 한 줄씩 남긴다 (최근 200줄).
 * 잠금을 풀기 전에도 쓰이는 저장소(device protected)에 둔다 — 밤사이 재부팅 뒤 기록도 남게.
 * 개발자 메뉴(설정 › 앱 정보 7번)에서 복사해 볼 수 있다.
 */
object AlarmLog {
    private const val PREFS = "alarm_log"
    private const val KEY = "lines"
    private const val MAX = 200

    private fun prefs(ctx: Context): SharedPreferences {
        val app = ctx.applicationContext ?: ctx
        val c = if (Build.VERSION.SDK_INT >= 24) app.createDeviceProtectedStorageContext() else app
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    }

    fun stamp(t: Long): String = SimpleDateFormat("MM-dd HH:mm:ss", Locale.KOREA).format(Date(t))

    fun hm(t: Long): String = SimpleDateFormat("HH:mm:ss", Locale.KOREA).format(Date(t))

    @Synchronized
    fun add(ctx: Context, msg: String) {
        try {
            val p = prefs(ctx)
            val old = p.getString(KEY, "") ?: ""
            val lines = if (old.isEmpty()) ArrayList() else old.split("\n").toMutableList()
            lines.add(stamp(System.currentTimeMillis()) + " " + msg.replace("\n", " "))
            while (lines.size > MAX) lines.removeAt(0)
            p.edit().putString(KEY, lines.joinToString("\n")).apply()
        } catch (e: Exception) {
            // 기록은 알람에 영향을 주면 안 됨
        }
    }

    fun read(ctx: Context): String = try {
        prefs(ctx).getString(KEY, "") ?: ""
    } catch (e: Exception) {
        ""
    }

    fun clear(ctx: Context) {
        try {
            prefs(ctx).edit().remove(KEY).apply()
        } catch (e: Exception) {
        }
    }
}
