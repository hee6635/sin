package com.eonjeswieo.app

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject

/**
 * 기념일 전날 알림 같은 "조용한 알림".
 * 웹이 보내준 목록 [{id, at, title, text}] 을 저장해 두고, 가장 가까운 것 하나만 예약한다.
 * 알람(소리·전체 화면)과 달리 그냥 알림 한 줄이라 정확한 시각이 아니어도 된다.
 */
object Reminders {
    private const val PREFS = "reminders"
    private const val KEY = "json"
    private const val REQ = 5151
    const val CHANNEL_ID = "eonjeswieo_remind"

    fun saveList(ctx: Context, json: String) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, json).apply()
        scheduleNext(ctx)
    }

    private fun read(ctx: Context): MutableList<JSONObject> {
        val out = ArrayList<JSONObject>()
        val s = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null) ?: return out
        try {
            val arr = JSONArray(s)
            for (i in 0 until arr.length()) out.add(arr.getJSONObject(i))
        } catch (e: Exception) {
        }
        return out
    }

    private fun write(ctx: Context, list: List<JSONObject>) {
        val arr = JSONArray()
        list.forEach { arr.put(it) }
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, arr.toString()).apply()
    }

    private fun pending(ctx: Context): PendingIntent {
        val i = Intent(ctx, ReminderReceiver::class.java)
        return PendingIntent.getBroadcast(ctx, REQ, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    fun scheduleNext(ctx: Context) {
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val now = System.currentTimeMillis()
        // 이미 지난 건 버리고 (하루 넘게 지난 것만), 가장 가까운 것 하나 예약
        val list = read(ctx).filter { it.optLong("at") > now - 24 * 3600_000L }
        write(ctx, list)
        val next = list.minByOrNull { it.optLong("at") }
        am.cancel(pending(ctx))
        if (next != null) {
            val at = maxOf(next.optLong("at"), now + 1000)
            // 정확한 시각에 울리게 (권한이 없거나 막히면 예전처럼 대략적인 시각)
            val exactOk = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()
            try {
                if (exactOk) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending(ctx))
                else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending(ctx))
            } catch (e: SecurityException) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending(ctx))
            }
        }
    }

    /** 시각이 된 알림들을 띄우고 목록에서 지운 뒤 다음 것을 예약 */
    fun fireDue(ctx: Context) {
        val now = System.currentTimeMillis()
        val list = read(ctx)
        val due = list.filter { it.optLong("at") <= now + 60_000L }
        if (due.isNotEmpty()) {
            val nm = ctx.getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(NotificationChannel(CHANNEL_ID, "기념일 · 알림", NotificationManager.IMPORTANCE_DEFAULT))
            due.forEach { o ->
                // 스티커 알림(type = stk)은 눌렀을 때 그 날짜의 스티커 창이 열리도록 종류 · 날짜를 실어 보냄
                val intent = Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                val type = o.optString("type", "")
                if (type.isNotEmpty()) intent.putExtra("type", type).putExtra("date", o.optString("date", ""))
                val open = PendingIntent.getActivity(
                    ctx, o.optString("id").hashCode(), intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                val n = Notification.Builder(ctx, CHANNEL_ID)
                    .setSmallIcon(R.drawable.ic_stat_notify)
                    .setContentTitle(o.optString("title", "언제쉬어"))
                    .setContentText(o.optString("text", ""))
                    .setAutoCancel(true)
                    .setContentIntent(open)
                    .build()
                try { nm.notify(o.optString("id").hashCode(), n) } catch (e: SecurityException) { }
            }
            write(ctx, list.filter { it.optLong("at") > now + 60_000L })
        }
        scheduleNext(ctx)
    }
}

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Reminders.fireDue(context)
    }
}
