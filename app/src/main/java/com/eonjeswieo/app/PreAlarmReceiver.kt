package com.eonjeswieo.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * v0.142 알람 5분 전: "오전 6:00 알람 · 5분 뒤 울려요" [이번만 끄기]
 * 소리 · 진동 없는 알림 (자는 사람을 깨우지 않게) · 알람 시각이 되면 저절로 사라짐 (자다 깨서 지울 것 없음)
 */
class PreAlarmReceiver : BroadcastReceiver() {
    companion object {
        const val CHANNEL = "eonjeswieo_pre"
        const val ACTION_SKIP = "com.eonjeswieo.app.PRE_SKIP"
        const val NOTIF_ID = 4244
        fun cancel(ctx: Context) {
            try { ctx.getSystemService(NotificationManager::class.java)?.cancel(NOTIF_ID) } catch (e: Exception) {}
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        val ctx = context.applicationContext ?: context
        val id = intent.getStringExtra("id") ?: return
        val at = intent.getLongExtra(AlarmScheduler.EXTRA_AT, 0L)
        val nm = ctx.getSystemService(NotificationManager::class.java) ?: return
        if (intent.action == ACTION_SKIP) {
            AlarmScheduler.skipOne(ctx, id, at)
            nm.cancel(NOTIF_ID)
            try { android.widget.Toast.makeText(ctx, "이번 알람은 껐어요 · 다음부턴 그대로 울려요", android.widget.Toast.LENGTH_SHORT).show() } catch (e: Exception) {}
            return
        }
        val r = AlarmScheduler.ringOf(ctx, id)
        val now = System.currentTimeMillis()
        if (r == null || at <= now) { AlarmScheduler.schedulePre(ctx); return }
        try {
            val ch = NotificationChannel(CHANNEL, "알람 5분 전", NotificationManager.IMPORTANCE_LOW)
            ch.setSound(null, null)
            ch.enableVibration(false)
            ch.description = "먼저 일어났으면 알람이 울리기 전에 끌 수 있어요 (소리 없음)"
            nm.createNotificationChannel(ch)
            val hm = java.text.SimpleDateFormat("a h:mm", java.util.Locale.KOREA).format(java.util.Date(at))
            val name = AlarmScheduler.title(r)
            val skip = Intent(ctx, PreAlarmReceiver::class.java).setAction(ACTION_SKIP).putExtra("id", id).putExtra(AlarmScheduler.EXTRA_AT, at)
            val skipPi = PendingIntent.getBroadcast(ctx, 4245, skip, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            val open = PendingIntent.getActivity(ctx, 4246, Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            val n = Notification.Builder(ctx, CHANNEL)
                .setSmallIcon(R.drawable.ic_stat_notify)
                .setContentTitle("⏰ $hm 알람 · 5분 뒤 울려요")
                .setContentText(if (name.isNotBlank()) "$name · 먼저 일어났으면 이번만 끌 수 있어요" else "먼저 일어났으면 이번만 끌 수 있어요")
                .setOnlyAlertOnce(true)
                .setTimeoutAfter(at - now + 20_000L)   // 알람 시각이 되면 저절로 사라짐
                .setAutoCancel(true)
                .setContentIntent(open)
                .addAction(Notification.Action.Builder(null, "이번만 끄기", skipPi).build())
                .build()
            nm.notify(NOTIF_ID, n)
        } catch (e: Exception) {
        }
        AlarmScheduler.schedulePre(ctx)   // 다음 알람의 5분 전
    }
}
