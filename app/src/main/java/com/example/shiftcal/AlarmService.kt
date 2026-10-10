package com.example.shiftcal

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator

/** 알람 소리·진동을 내고, 잠금화면 위에 알람 화면을 띄우는 서비스 */
class AlarmService : Service() {

    companion object {
        const val ACTION_START = "com.example.shiftcal.ALARM_START"
        const val ACTION_STOP = "com.example.shiftcal.ALARM_STOP"
        const val ACTION_STOPPED = "com.example.shiftcal.ALARM_STOPPED"
        const val EXTRA_TITLE = "title"
        const val EXTRA_TIME = "time"
        private const val CHANNEL_ID = "shiftcal_alarm"
        private const val NOTIF_ID = 1001
        private const val AUTO_STOP_MS = 3 * 60 * 1000L
    }

    private var player: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private val handler = Handler(Looper.getMainLooper())
    private val autoStop = Runnable { stopAlarm() }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopAlarm()
            return START_NOT_STICKY
        }
        val title = intent?.getStringExtra(EXTRA_TITLE) ?: "알람"
        val time = intent?.getStringExtra(EXTRA_TIME) ?: ""

        showNotification(title, time)
        startSoundAndVibration()

        handler.removeCallbacks(autoStop)
        handler.postDelayed(autoStop, AUTO_STOP_MS)
        return START_NOT_STICKY
    }

    private fun showNotification(title: String, time: String) {
        val nm = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(CHANNEL_ID, "알람", NotificationManager.IMPORTANCE_HIGH)
        channel.setSound(null, null)          // 소리는 서비스가 직접 낸다
        channel.enableVibration(false)
        channel.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        nm.createNotificationChannel(channel)

        val ringIntent = Intent(this, AlarmActivity::class.java)
        ringIntent.putExtra(EXTRA_TITLE, title)
        ringIntent.putExtra(EXTRA_TIME, time)
        ringIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        val ringPi = PendingIntent.getActivity(
            this, 0, ringIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, AlarmService::class.java)
        stopIntent.action = ACTION_STOP
        val stopPi = PendingIntent.getService(this, 1, stopIntent, PendingIntent.FLAG_IMMUTABLE)

        @Suppress("DEPRECATION")
        val notification = Notification.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(time)
            .setCategory(Notification.CATEGORY_ALARM)
            .setOngoing(true)
            .setContentIntent(ringPi)
            .setFullScreenIntent(ringPi, true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "끄기", stopPi)
            .build()

        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(NOTIF_ID, notification)
        }
    }

    private fun startSoundAndVibration() {
        stopSound()
        try {
            val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            val mp = MediaPlayer()
            mp.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            mp.setDataSource(this, uri)
            mp.isLooping = true
            mp.prepare()
            mp.start()
            player = mp
        } catch (e: Exception) {
            // 소리를 못 내도 진동과 화면은 계속
        }
        try {
            @Suppress("DEPRECATION")
            val v = getSystemService(Vibrator::class.java)
            v?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 800, 600), 0))
            vibrator = v
        } catch (e: Exception) {
        }
    }

    private fun stopSound() {
        try {
            player?.stop()
        } catch (e: Exception) {
        }
        player?.release()
        player = null
        vibrator?.cancel()
        vibrator = null
    }

    private fun stopAlarm() {
        handler.removeCallbacks(autoStop)
        stopSound()
        stopForeground(STOP_FOREGROUND_REMOVE)
        // 열려 있는 알람 화면도 닫기
        sendBroadcast(Intent(ACTION_STOPPED).setPackage(packageName))
        stopSelf()
    }

    override fun onDestroy() {
        handler.removeCallbacks(autoStop)
        stopSound()
        super.onDestroy()
    }
}
