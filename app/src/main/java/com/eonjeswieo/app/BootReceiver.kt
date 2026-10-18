package com.eonjeswieo.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * 재부팅·앱 업데이트·시간 변경 뒤에 알람 예약을 다시 걸어준다 (재부팅하면 예약이 사라지기 때문).
 * 폰을 켠 직후 잠금을 풀기 전(LOCKED_BOOT_COMPLETED)에도 받아서 알람부터 다시 건다 — 밤사이 폰이 저절로 다시 켜져도 아침 알람이 울리게.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        try {
            AlarmScheduler.rescheduleAll(context)
        } catch (e: Exception) {
        }
        // 잠금을 풀기 전에는 아래(잠금 푼 뒤에만 읽히는 저장소를 씀)를 하지 않음 — 풀고 나면 BOOT_COMPLETED 로 다시 옴
        if (intent.action == Intent.ACTION_LOCKED_BOOT_COMPLETED) return
        try {
            Reminders.scheduleNext(context)
        } catch (e: Exception) {
        }
        try {
            WidgetRefresher.refreshAll(context)
            WidgetRefresher.scheduleTick(context)
        } catch (e: Exception) {
        }
    }
}
