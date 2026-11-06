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
    const val CHANNEL_WX = "eonjeswieo_wx"   // ☔ 날씨만 알람: 소리 · 진동 없는 조용한 알림

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

    /** 알림 한 줄을 지금 바로 띄움 (눌러서 앱 열기) */
    fun postNow(ctx: Context, id: String, title: String, text: String) {
        try {
            val nm = ctx.getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(NotificationChannel(CHANNEL_ID, "기념일 · 알림", NotificationManager.IMPORTANCE_DEFAULT))
            val open = PendingIntent.getActivity(
                ctx, id.hashCode(), Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val n = Notification.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_notify)
                .setContentTitle(title)
                .setContentText(text)
                .setAutoCancel(true)
                .setContentIntent(open)
                .build()
            nm.notify(id.hashCode(), n)
        } catch (e: Exception) {
            // 알림 권한이 없으면 그냥 넘어감
        }
    }

    /**
     * ☔ 날씨만 알람: 그 시각에 새 예보로 문구를 만들어 조용히 알림 (못 받으면 앱이 미리 만든 문구 · 그것도 없으면 앱이 넣어 둔 제목/글).
     * 네트워크를 쓰므로 ReminderReceiver 가 따로 스레드에서 부름.
     */
    private fun postWeather(ctx: Context, nm: NotificationManager, o: JSONObject) {
        try {
            val ch = NotificationChannel(CHANNEL_WX, "출퇴근 날씨", NotificationManager.IMPORTANCE_DEFAULT)
            ch.setSound(null, null)
            ch.enableVibration(false)
            ch.description = "날씨만 알람 (소리 없이)"
            nm.createNotificationChannel(ch)
            val w = Weather.get(o.optString("wxq"), o.optString("wxp"), 7000)
            val title = if (w != null) "${w.optString("i")} ${w.optString("h")}".trim() else o.optString("title", "☔ 오늘 출퇴근 날씨")
            // v0.135 단순하게: 출퇴근 기온 (체감) · 우산 · (나쁠 때만) 미세먼지 — 버튼은 [오늘 날씨 보기] [앱 열기]
            val lines = ArrayList<String>()
            var short = o.optString("text", "")
            if (w != null) {
                val rows = w.optJSONArray("r")
                val temps = ArrayList<String>()
                var wet = false
                if (rows != null) for (k in 0 until rows.length()) {
                    val r = rows.optJSONObject(k) ?: continue
                    val lb = r.optString("l").trim().split(" ").firstOrNull() ?: ""
                    temps.add("$lb ${Weather.temp(r)}".trim())
                    if (r.optString("tag").isNotBlank() || r.optInt("pop", 0) >= 60) wet = true
                }
                val feel = w.optString("ox").split(" · ").firstOrNull()?.takeIf { it.startsWith("체감") } ?: ""
                val l1 = temps.joinToString(" · ") + (if (feel.isNotEmpty()) " ($feel)" else "")
                val umb = if (wet) "☂️ 우산 챙기세요" else "☂️ 우산 필요 없어요"
                if (l1.isNotBlank()) lines.add(l1)
                lines.add(umb)
                if (w.optInt("ag", 0) >= 3) w.optString("a").takeIf { it.isNotBlank() }?.let { lines.add(it) }
                short = listOf(temps.joinToString(" · "), umb.removePrefix("☂️ ")).filter { it.isNotBlank() }.joinToString(" · ")
            } else o.optString("text").takeIf { it.isNotBlank() }?.let { lines.add(it) }
            val intent = Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            intent.putExtra("type", "wx").putExtra("date", o.optString("date", ""))
            val open = PendingIntent.getActivity(ctx, o.optString("id").hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            val nb = Notification.Builder(ctx, CHANNEL_WX)
                .setSmallIcon(R.drawable.ic_stat_notify)
                .setContentTitle(title)
                .setContentText(short)
                .setStyle(Notification.BigTextStyle().bigText(lines.joinToString("\n")))
                .setAutoCancel(true)
                .setContentIntent(open)
            // 버튼: [오늘 날씨 보기] = 앱 날씨 팝업 바로 · [앱 열기]
            val today = java.time.LocalDate.now().toString()
            val wxGo = Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP).putExtra("openDate", "${o.optString("date", "").ifEmpty { today }}#wx")
            wxGo.data = android.net.Uri.parse("eonjeswieo://wx/" + o.optString("id"))
            nb.addAction(Notification.Action.Builder(null, "오늘 날씨 보기", PendingIntent.getActivity(ctx, (o.optString("id") + "w").hashCode(), wxGo, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)).build())
            val appGo = Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            appGo.data = android.net.Uri.parse("eonjeswieo://app/" + o.optString("id"))
            nb.addAction(Notification.Action.Builder(null, "앱 열기", PendingIntent.getActivity(ctx, (o.optString("id") + "a").hashCode(), appGo, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)).build())
            val n = nb.build()
            nm.notify("wx".hashCode(), n)   // 날씨 알림은 하나만 (새 것이 옛 것을 바꿈)
            if (o.optInt("snd", 1) == 1) playOnce(ctx, o.optString("tone", ""))   // v0.142 알람마다 고른 소리 한 번 (알림 자체는 소리 없는 채널)
        } catch (e: Exception) {
        }
    }

    /** v0.142 날씨만 알람: 고른 소리(없으면 폰 기본 알림음)를 한 번만 · 무음 · 진동 모드면 안 틈 · 길면 6초에서 끊음 */
    private fun playOnce(ctx: Context, tone: String) {
        var mp: android.media.MediaPlayer? = null
        try {
            val am = ctx.getSystemService(android.media.AudioManager::class.java)
            if (am != null && am.ringerMode != android.media.AudioManager.RINGER_MODE_NORMAL) return
            val uri = (if (tone.isNotEmpty()) try { android.net.Uri.parse(tone) } catch (e: Exception) { null } else null)
                ?: android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION) ?: return
            mp = android.media.MediaPlayer()
            mp.setAudioAttributes(android.media.AudioAttributes.Builder()
                .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
            mp.setDataSource(ctx, uri)
            mp.prepare()
            mp.start()
            val t0 = System.currentTimeMillis()
            while (mp.isPlaying && System.currentTimeMillis() - t0 < 6000) Thread.sleep(100)
        } catch (e: Exception) {
        } finally {
            try { mp?.stop() } catch (e: Exception) {}
            try { mp?.release() } catch (e: Exception) {}
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
                if (o.optString("type") == "wx") { postWeather(ctx, nm, o); return@forEach }
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
        // 날씨만 알람은 인터넷으로 새 예보를 받으므로 따로 스레드에서 (리시버는 goAsync 로 조금 더 살려 둠)
        val pr = goAsync()
        Thread {
            try {
                Reminders.fireDue(context.applicationContext)
            } catch (e: Exception) {
            } finally {
                pr.finish()
            }
        }.start()
    }
}
