package com.eonjeswieo.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

/**
 * 울려야 할 알람 한 건.
 * sound/vib: 소리·진동, vol: 이 알람만의 볼륨(0~100, 알람 볼륨 기준), ramp: 점점 커지는 소리,
 * tone: 알람음 주소(비어 있으면 기본 알람음), snMin/snMax: 다시 울림 간격(분)·최대 횟수(-1 = 제한 없음),
 * snCount: 지금까지 다시 울린 횟수
 */
class Ring(
    val id: String,
    val at: Long,
    val label: String,
    val shift: String,
    val sound: Boolean = true,
    val vib: Boolean = true,
    val shiftName: String = "",
    val vol: Int = 100,
    val ramp: Boolean = false,
    val tone: String = "",
    val snMin: Int = 5,
    val snMax: Int = 3,
    val snCount: Int = 0
) {
    fun toJson(): JSONObject = JSONObject()
        .put("id", id).put("at", at).put("label", label).put("shift", shift)
        .put("sound", sound).put("vib", vib).put("shiftName", shiftName)
        .put("vol", vol).put("ramp", ramp).put("tone", tone)
        .put("snMin", snMin).put("snMax", snMax).put("snCount", snCount)

    companion object {
        fun from(o: JSONObject) = Ring(
            o.getString("id"), o.getLong("at"), o.optString("label", ""), o.optString("shift", ""),
            o.optBoolean("sound", true), o.optBoolean("vib", true), o.optString("shiftName", ""),
            o.optInt("vol", 100).coerceIn(0, 100), o.optBoolean("ramp", false), o.optString("tone", ""),
            o.optInt("snMin", 5).coerceIn(1, 60), o.optInt("snMax", 3), o.optInt("snCount", 0)
        )
    }
}

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
            for (i in 0 until arr.length()) out.add(Ring.from(arr.getJSONObject(i)))
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
        for (r in list) arr.put(r.toJson())
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(key, arr.toString()).apply()
    }

    /** 다시 울릴 수 있는지 (최대 횟수 안인지) */
    fun canSnooze(r: Ring): Boolean = r.snMax < 0 || r.snCount < r.snMax

    /** 지금 울린 알람을 [Ring.snMin]분 뒤에 한 번 더 울리게 예약 */
    fun snooze(ctx: Context, r: Ring) {
        if (!canSnooze(r)) return
        val at = System.currentTimeMillis() + r.snMin * 60_000L
        val list = readKey(ctx, KEY_SNOOZE).filter { it.at > System.currentTimeMillis() }.toMutableList()
        list.add(
            Ring(
                "snooze_$at", at, r.label, r.shift, r.sound, r.vib, r.shiftName,
                r.vol, r.ramp, r.tone, r.snMin, r.snMax, r.snCount + 1
            )
        )
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

    /** 같은 시각에 여러 알람이 겹치면 하나로 합친다 (소리·진동은 하나라도 켜져 있으면 켬, 볼륨은 가장 큰 값) */
    fun merge(due: List<Ring>, at: Long): Ring {
        val first = due.first()
        return Ring(
            first.id, at, due.joinToString(" · ") { title(it) }, first.shift,
            due.any { it.sound }, due.any { it.vib }, first.shiftName,
            due.maxOf { it.vol }, due.all { it.ramp }, due.firstOrNull { it.tone.isNotEmpty() }?.tone ?: "",
            first.snMin, first.snMax, first.snCount
        )
    }

    fun title(r: Ring): String {
        if (r.label.isNotBlank()) return r.label
        val name = if (r.shiftName.isNotBlank()) r.shiftName else when (r.shift) {
            "주" -> "주간"
            "야" -> "야간"
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
