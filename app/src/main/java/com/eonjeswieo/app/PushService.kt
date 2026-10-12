package com.eonjeswieo.app

import android.content.Context
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * 푸시 알림 받는 곳.
 * 앱이 꺼져 있을 때의 알림은 시스템이 알아서 보여 주므로 여기서는 할 일이 없고,
 * 이 폰의 알림 주소(token)가 새로 만들어지면 저장해 두었다가 앱이 켜질 때 서버에 등록합니다.
 */
class PushService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        saveToken(this, token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        // 앱을 보고 있을 때는 화면이 실시간으로 바뀌므로 따로 알림을 띄우지 않음
    }

    companion object {
        private const val PREF = "push"

        fun saveToken(c: Context, token: String) {
            c.getSharedPreferences(PREF, Context.MODE_PRIVATE).edit().putString("token", token).apply()
        }

        fun token(c: Context): String =
            c.getSharedPreferences(PREF, Context.MODE_PRIVATE).getString("token", "") ?: ""
    }
}
