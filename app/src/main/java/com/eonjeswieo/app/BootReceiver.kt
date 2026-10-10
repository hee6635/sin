package com.eonjeswieo.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** 재부팅·앱 업데이트·시간 변경 뒤에 알람 예약을 다시 걸어준다 (재부팅하면 예약이 사라지기 때문) */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        AlarmScheduler.scheduleNext(context)
    }
}
