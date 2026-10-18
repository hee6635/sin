package com.eonjeswieo.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** 알람 시각이 되면 시스템이 이 리시버를 깨운다 → 알람 서비스를 시작해 소리를 낸다 */
class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val at = intent.getLongExtra(AlarmScheduler.EXTRA_AT, 0L)
        if (at == 0L) return

        val due = AlarmScheduler.peekDue(context, at)
        if (due.isEmpty()) {
            AlarmScheduler.consumeDue(context, at)   // 이미 처리된 알람: 목록을 정리하고 다음 알람만 예약
            return
        }

        val ring = AlarmScheduler.merge(due, at)
        var started = false
        try {
            val svc = Intent(context, AlarmService::class.java)
            svc.action = AlarmService.ACTION_START
            svc.putExtra(AlarmService.EXTRA_RING, ring.toJson().toString())
            context.startForegroundService(svc)
            started = true
        } catch (e: Exception) {
            // 시스템이 서비스를 못 띄우게 막은 경우 → 아래에서 소리 나는 알림이라도 띄움
        }
        if (!started) AlarmService.fallbackNotify(context, ring)

        // 울렸으니 목록에서 지우고 다음 알람 예약. (서비스를 띄운 뒤에 해서, 띄우다 실패해도 알람이 말없이 사라지지 않게)
        AlarmScheduler.consumeDue(context, at)
        try {
            WidgetRefresher.refreshAll(context)   // 위젯의 "다음 알람" 글자도 바로 갱신 (잠금을 풀기 전이면 건너뜀)
        } catch (e: Exception) {
        }
    }
}

/** 앱을 오래 안 열어서 알람 목록이 곧 끝날 때, 알림 한 줄로 알려 준다 */
class AlarmTailReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Reminders.postNow(context, "alarm_tail", "알람이 곧 끊겨요", "앱을 한 번 열어 주세요. 열면 알람이 다시 채워져요")
    }
}
