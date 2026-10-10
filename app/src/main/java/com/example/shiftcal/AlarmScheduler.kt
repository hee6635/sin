package com.example.shiftcal

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

/** 울려야 할 알람 한 건 (sound/vib: 소리·진동 켜짐 여부) */
class Ring(
    val id: String,
    val at: Long,
    val label: String,
    val shift: String,
    val sound: Boolean = true,
    val vib: Boolean = true,
    val shiftName: String = ""
)

/**
 * 웹이 보내준 알람 목록을 폰에 저장해 두고, 항상 "가장 가까운 알람 1개"만 AlarmManager 에 예약한다.
 * 울리고 나면 그 알람을 목록에서 지우고 다음 알람을 예약한다.
 * (setAlarmClock 을 쓰므로 절전 모드에서도, 앱이 꺼져 있어도 울린다)
 */
object AlarmScheduler {

    const val EXTRA_AT = "at"
    private const val PREFS = "alarm_list"
    private const val KEY = "json"
    private const val KEY_SNOOZE = "snooze"      // "다시 울림"으로 만든 알람 (웹 목록과 따로 보관)
    const val SNOOZE_MIN = 5
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

    private fun readKey(ctx: Context, key: String): MutableList<Ring> {
        val out = ArrayList<Ring>()
        val s = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(key, null) ?: return out
        try {
            val arr = JSONArray(s)
            for (i in 0 until arr.length()) {
                val o = arr.getJSONObject(i)
                out.add(
                    Ring(
                        o.getString("id"), o.getLong("at"), o.optString("label", ""), o.optString("shift", ""),
                        o.optBoolean("sound", true), o.optBoolean("vib", true),
                        o.optString("shiftName", "")
                    )
                )
            }
        } catch (e: Exception) {
            // 깨진 데이터는 무시
        }
        return out
    }

    /** 웹 목록 + 다시 울림 목록을 시간 순으로 */
    private fun readList(ctx: Context): MutableList<Ring> {
        val out = readKey(ctx, KEY)
        out.addAll(readKey(ctx, KEY_SNOOZE))
        out.sortBy { it.at }
        return out
    }

    private fun writeKey(ctx: Context, key: String, list: List<Ring>) {
        val arr = JSONArray()
        for (r in list) {
            arr.put(
                JSONObject()
                    .put("id", r.id)
                    .put("at", r.at)
                    .put("label", r.label)
                    .put("shift", r.shift)
                    .put("sound", r.sound)
                    .put("vib", r.vib)
                    .put("shiftName", r.shiftName)
            )
        }
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(key, arr.toString()).apply()
    }

    /** 지금 울린 알람을 [SNOOZE_MIN]분 뒤에 한 번 더 울리게 예약 */
    fun snooze(ctx: Context, title: String, sound: Boolean, vib: Boolean) {
        val at = System.currentTimeMillis() + SNOOZE_MIN * 60_000L
        val list = readKey(ctx, KEY_SNOOZE).filter { it.at > System.currentTimeMillis() }.toMutableList()
        list.add(Ring("snooze_$at", at, title, "", sound, vib))
        writeKey(ctx, KEY_SNOOZE, list)
        scheduleNext(ctx)
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
        val isDue = { r: Ring -> r.at >= at - 60_000 && r.at <= at + 60_000 }
        val main = readKey(ctx, KEY)
        val snoozed = readKey(ctx, KEY_SNOOZE)
        val due = (main + snoozed).filter(isDue).sortedBy { it.at }
        writeKey(ctx, KEY, main.filter { it.at > at + 60_000 })
        writeKey(ctx, KEY_SNOOZE, snoozed.filter { it.at > at + 60_000 })
        scheduleNext(ctx)
        return due
    }

    fun title(r: Ring): String {
        if (r.label.isNotBlank()) return r.label
        val name = if (r.shiftName.isNotBlank()) r.shiftName else when (r.shift) {
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
