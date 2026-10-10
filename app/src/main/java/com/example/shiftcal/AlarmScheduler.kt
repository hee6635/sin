package com.example.shiftcal

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

/** 울려야 할 알람 한 건 */
class Ring(val id: String, val at: Long, val label: String, val shift: String)

/**
 * 웹이 보내준 알람 목록을 폰에 저장해 두고, 항상 "가장 가까운 알람 1개"만 AlarmManager 에 예약한다.
 * 울리고 나면 그 알람을 목록에서 지우고 다음 알람을 예약한다.
 * (setAlarmClock 을 쓰므로 절전 모드에서도, 앱이 꺼져 있어도 울린다)
 */
object AlarmScheduler {

    const val EXTRA_AT = "at"
    private const val PREFS = "alarm_list"
    private const val KEY = "json"
    private const val REQ_NEXT = 4242

    private fun manager(ctx: Context): AlarmManager =
        ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    fun canScheduleExact(ctx: Context): Boolean =
        if (Build.VERSION.SDK_INT >= 31) manager(ctx).canScheduleExactAlarms() else true

    /** 웹이 보낸 목록을 통째로 교체하고 다음 알람 예약 */
    fun saveList(ctx: Context, json: String) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, json).apply()
        scheduleNext(ctx)
    }

    private fun readList(ctx: Context): MutableList<Ring> {
        val out = ArrayList<Ring>()
        val s = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null) ?: return out
        try {
            val arr = JSONArray(s)
            for (i in 0 until arr.length()) {
                val o = arr.getJSONObject(i)
                out.add(Ring(o.getString("id"), o.getLong("at"), o.optString("label", ""), o.optString("shift", "")))
            }
        } catch (e: Exception) {
            // 깨진 데이터는 무시
        }
        out.sortBy { it.at }
        return out
    }

    private fun writeList(ctx: Context, list: List<Ring>) {
        val arr = JSONArray()
        for (r in list) {
            arr.put(
                JSONObject()
                    .put("id", r.id)
                    .put("at", r.at)
                    .put("label", r.label)
                    .put("shift", r.shift)
            )
        }
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, arr.toString()).apply()
    }

    private fun pending(ctx: Context, at: Long): PendingIntent {
        val intent = Intent(ctx, AlarmReceiver::class.java).putExtra(EXTRA_AT, at)
        return PendingIntent.getBroadcast(
            ctx, REQ_NEXT, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    /** 가장 가까운 미래 알람 1개를 예약 (없으면 예약 취소) */
    fun scheduleNext(ctx: Context) {
        val am = manager(ctx)
        val now = System.currentTimeMillis()
        val next = readList(ctx).firstOrNull { it.at > now + 1000 }
        if (next == null) {
            am.cancel(pending(ctx, 0L))
            return
        }
        val show = PendingIntent.getActivity(
            ctx, 0, Intent(ctx, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE
        )
        try {
            am.setAlarmClock(AlarmManager.AlarmClockInfo(next.at, show), pending(ctx, next.at))
        } catch (e: SecurityException) {
            // 정확한 알람 권한이 없는 상태 → 앱 화면의 안내 배너에서 설정을 열 수 있다
        }
    }

    /**
     * 알람이 울릴 때 호출: 지금 울릴 알람(같은 시각 ±1분 묶음)을 꺼내고,
     * 그보다 지난 알람은 목록에서 정리한 뒤 다음 알람을 예약한다.
     */
    fun consumeDue(ctx: Context, at: Long): List<Ring> {
        val list = readList(ctx)
        val due = list.filter { it.at >= at - 60_000 && it.at <= at + 60_000 }
        val rest = list.filter { it.at > at + 60_000 }
        writeList(ctx, rest)
        scheduleNext(ctx)
        return due
    }

    fun title(r: Ring): String {
        if (r.label.isNotBlank()) return r.label
        val name = when (r.shift) {
            "주" -> "주간"
            "야" -> "야간"
            "상" -> "상주"
            "교" -> "교육"
            "휴" -> "휴무"
            else -> ""
        }
        return if (name.isEmpty()) "알람" else "$name 알람"
    }

    fun timeText(at: Long): String {
        val c = Calendar.getInstance()
        c.timeInMillis = at
        val h = c.get(Calendar.HOUR_OF_DAY)
        val m = c.get(Calendar.MINUTE)
        val h12 = if (h % 12 == 0) 12 else h % 12
        return (if (h < 12) "오전 " else "오후 ") + String.format("%02d:%02d", h12, m)
    }
}
