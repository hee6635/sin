package com.example.shiftcal

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** 알람 시각이 되면 시스템이 이 리시버를 깨운다 → 알람 서비스를 시작해 소리를 낸다 */
class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val at = intent.getLongExtra(AlarmScheduler.EXTRA_AT, 0L)
        if (at == 0L) return

        val due = AlarmScheduler.consumeDue(context, at)
        if (due.isEmpty()) return

        val svc = Intent(context, AlarmService::class.java)
        svc.action = AlarmService.ACTION_START
        svc.putExtra(AlarmService.EXTRA_TITLE, due.joinToString(" · ") { AlarmScheduler.title(it) })
        svc.putExtra(AlarmService.EXTRA_TIME, AlarmScheduler.timeText(at))
        context.startForegroundService(svc)
    }
}
