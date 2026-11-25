package com.eonjeswieo.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import org.json.JSONObject

/** 알람 소리·진동을 내고, 잠금화면 위에 알람 화면을 띄우는 서비스 */
class AlarmService : Service() {

    companion object {
        const val ACTION_START = "com.eonjeswieo.app.ALARM_START"
        const val ACTION_STOP = "com.eonjeswieo.app.ALARM_STOP"
        const val ACTION_SNOOZE = "com.eonjeswieo.app.ALARM_SNOOZE"
        const val ACTION_STOPPED = "com.eonjeswieo.app.ALARM_STOPPED"
        const val EXTRA_RING = "ring"
        private const val CHANNEL_ID = "eonjeswieo_alarm"
        private const val NOTIF_ID = 1001
        private const val AUTO_STOP_MS = 3 * 60 * 1000L
        private const val RAMP_MS = 30_000L      // 점점 커지는 소리: 30초 동안
        private const val BACKUP_CHANNEL = "eonjeswieo_alarm_backup"
        private const val PREPARE_MS = 3_000L    // v0.217 벨소리 준비가 이보다 오래 걸리면(클라우드 파일 등) 다음 소리로

        private fun ringIntent(ctx: Context, r: Ring): Intent {
            val i = Intent(ctx, AlarmActivity::class.java)
            i.putExtra(AlarmActivity.EXTRA_TITLE, r.label)
            i.putExtra(AlarmActivity.EXTRA_TIME, AlarmScheduler.timeText(r.at))
            i.putExtra(AlarmActivity.EXTRA_SNOOZE_MIN, if (AlarmScheduler.canSnooze(r)) r.snMin else 0)
            i.putExtra(AlarmActivity.EXTRA_COLOR, r.col)
            i.putExtra(AlarmActivity.EXTRA_ICON, r.ico)
            i.putExtra(AlarmActivity.EXTRA_SHIFT, if (r.col.isNotEmpty()) r.shiftName else "")
            i.putExtra(AlarmActivity.EXTRA_SN_MAX, r.snMax)
            i.putExtra(AlarmActivity.EXTRA_SN_COUNT, r.snCount)
            if (r.msg.isNotEmpty()) i.putExtra(AlarmActivity.EXTRA_MSG, r.msg)
            if (r.wx == 1) {
                i.putExtra(AlarmActivity.EXTRA_WXQ, r.wxq)
                i.putExtra(AlarmActivity.EXTRA_WXP, r.wxp)
            }
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            return i
        }

        /**
         * 알람 서비스를 시스템이 못 띄우게 막았을 때의 마지막 수단:
         * 알람 소리가 나는 알림(+ 전체 화면 알림)을 직접 띄운다. 알림이 막혀 있으면 아무것도 못 함.
         */
        fun fallbackNotify(ctx: Context, r: Ring) {
            try {
                val nm = ctx.getSystemService(NotificationManager::class.java)
                val ch = NotificationChannel(BACKUP_CHANNEL, "알람 (보조)", NotificationManager.IMPORTANCE_HIGH)
                ch.setSound(
                    RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM),
                    AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
                )
                ch.enableVibration(true)
                ch.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                nm.createNotificationChannel(ch)
                val pi = PendingIntent.getActivity(ctx, 3, ringIntent(ctx, r), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
                val n = Notification.Builder(ctx, BACKUP_CHANNEL)
                    .setSmallIcon(R.drawable.ic_stat_notify)
                    .setContentTitle(r.label)
                    .setContentText(AlarmScheduler.timeText(r.at))
                    .setCategory(Notification.CATEGORY_ALARM)
                    .setAutoCancel(true)
                    .setContentIntent(pi)
                    .setFullScreenIntent(pi, true)
                    .build()
                nm.notify(NOTIF_ID + 1, n)
            } catch (e: Exception) {
                // 알림 권한이 없으면 방법이 없음 (앱 화면의 "알람이 잘 울리게"에서 알려 줌)
            }
        }
    }

    private var player: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private val handler = Handler(Looper.getMainLooper())
    private val autoStop = Runnable {
        AlarmLog.add(this, "자동 정지 (3분) id=${cur?.id ?: "?"}")
        stopAlarm()
    }
    private var rampStart = 0L
    private var target = 1f

    private val rampStep = object : Runnable {
        override fun run() {
            val p = player ?: return
            val k = ((System.currentTimeMillis() - rampStart).toFloat() / RAMP_MS).coerceIn(0.05f, 1f)
            val v = target * k
            try { p.setVolume(v, v) } catch (e: Exception) {}
            if (k < 1f) handler.postDelayed(this, 500)
        }
    }

    /** 지금 울리는 알람 (다시 울림 예약에 사용) */
    private var cur: Ring? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                AlarmLog.add(this, "끄기 id=${cur?.id ?: "?"}")
                stopAlarm()
                return START_NOT_STICKY
            }
            ACTION_SNOOZE -> {
                cur?.let {
                    AlarmLog.add(this, "다시 울림 ${it.snMin}분 뒤 (${it.snCount + 1}번째) id=${it.id}")
                    AlarmScheduler.snooze(this, it)
                }
                stopAlarm()
                return START_NOT_STICKY
            }
        }
        val ring = try {
            Ring.from(JSONObject(intent?.getStringExtra(EXTRA_RING) ?: ""))
        } catch (e: Exception) {
            Ring("x", System.currentTimeMillis(), "알람", "")
        }
        cur = ring

        showNotification(ring)
        startSoundAndVibration(ring)

        handler.removeCallbacks(autoStop)
        handler.postDelayed(autoStop, AUTO_STOP_MS)
        return START_NOT_STICKY
    }

    private fun showNotification(r: Ring) {
        val nm = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(CHANNEL_ID, "알람", NotificationManager.IMPORTANCE_HIGH)
        channel.setSound(null, null)          // 소리는 서비스가 직접 낸다
        channel.enableVibration(false)
        channel.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        nm.createNotificationChannel(channel)

        val title = r.label
        val time = AlarmScheduler.timeText(r.at)
        val canSnooze = AlarmScheduler.canSnooze(r)

        val ringIntent = ringIntent(this, r)
        val ringPi = PendingIntent.getActivity(
            this, 0, ringIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, AlarmService::class.java)
        stopIntent.action = ACTION_STOP
        val stopPi = PendingIntent.getService(this, 1, stopIntent, PendingIntent.FLAG_IMMUTABLE)

        val b = Notification.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setContentTitle(title)
            .setContentText(time)
            .setCategory(Notification.CATEGORY_ALARM)
            .setOngoing(true)
            .setContentIntent(ringPi)
            .setFullScreenIntent(ringPi, true)
        if (canSnooze) {
            val snoozeIntent = Intent(this, AlarmService::class.java)
            snoozeIntent.action = ACTION_SNOOZE
            val snoozePi = PendingIntent.getService(this, 2, snoozeIntent, PendingIntent.FLAG_IMMUTABLE)
            @Suppress("DEPRECATION")
            b.addAction(android.R.drawable.ic_popup_reminder, "${r.snMin}분 뒤 다시", snoozePi)
        }
        @Suppress("DEPRECATION")
        b.addAction(android.R.drawable.ic_menu_close_clear_cancel, "끄기", stopPi)
        val notification = b.build()

        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(NOTIF_ID, notification)
        }
        // 알림을 끈 폰은 전체 화면 알림이 안 떠서 끄는 화면이 없음 → 화면을 직접 열어 봄 (시스템이 막으면 소리만 나고 3분 뒤 멈춤)
        if (!nm.areNotificationsEnabled()) {
            try {
                startActivity(ringIntent)
            } catch (e: Exception) {
            }
        }
    }

    /**
     * v0.217 울릴 소리 차례: 고른 벨소리 → 기본 알람음 → 기본 벨소리. (같은 주소는 한 번만)
     * 다 실패하면 진동을 꺼 둔 알람이라도 진동을 켠다 — 소리도 진동도 없이 지나가지 않게.
     */
    private fun toneChain(r: Ring): List<Pair<String, Uri>> {
        val out = ArrayList<Pair<String, Uri>>()
        fun add(name: String, u: Uri?) {
            if (u != null && out.none { it.second == u }) out.add(name to u)
        }
        if (r.tone.isNotEmpty()) try { add("고른 벨소리", Uri.parse(r.tone)) } catch (e: Exception) {}
        try { add("기본 알람음", RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)) } catch (e: Exception) {}
        try { add("기본 벨소리", RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)) } catch (e: Exception) {}
        return out
    }

    private val attrs: AudioAttributes = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)          // 무음 · 진동 모드에서도 알람 소리로 남
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build()

    /** 소리 시도 회차 — 끄거나 새로 울리면 올라가서, 늦게 도착한 준비 완료 · 오류 · 시간 초과를 무시하게 함 */
    private var gen = 0
    /** 지금 준비 중인 재생기 (3초 안에 준비 안 되면 버리고 다음 소리로) */
    private var pending: MediaPlayer? = null
    private var prepTimeout: Runnable? = null

    private fun startSoundAndVibration(r: Ring) {
        stopSound()
        val g = ++gen
        var forceVib = false
        if (r.sound && r.vol > 0) {
            target = r.vol / 100f
            // 재생은 되는데 안 들리는 경우: 폰 알람 볼륨 0 → 오류가 안 나서 다음 소리로 못 넘어가므로 진동을 켬
            try {
                val am = getSystemService(AudioManager::class.java)
                if (am != null && am.getStreamVolume(AudioManager.STREAM_ALARM) == 0) {
                    AlarmLog.add(this, "알람 볼륨 0 → 진동 켬")
                    forceVib = true
                }
            } catch (e: Exception) {
            }
            playFrom(r, toneChain(r), 0, g)
        }
        if (r.vib || forceVib) startVibration()
    }

    /** chain[i] 를 재생해 보고, 실패 · 시간 초과면 chain[i+1] 로 */
    private fun playFrom(r: Ring, chain: List<Pair<String, Uri>>, i: Int, g: Int) {
        if (g != gen) return
        if (i >= chain.size) {
            AlarmLog.add(this, "소리 모두 실패 → 진동")
            startVibration()
            return
        }
        val (name, uri) = chain[i]
        val mp = MediaPlayer()
        pending = mp
        fun fail(why: String) {
            if (g != gen || pending !== mp) return
            prepTimeout?.let { handler.removeCallbacks(it) }
            pending = null
            try { mp.release() } catch (e: Exception) {}
            AlarmLog.add(this, "재생 실패: $name ($why)")
            playFrom(r, chain, i + 1, g)
        }
        try {
            mp.setAudioAttributes(attrs)
            mp.setDataSource(this, uri)
            mp.isLooping = true
            mp.setOnPreparedListener {
                if (g != gen || pending !== mp) {
                    try { mp.release() } catch (e: Exception) {}
                    return@setOnPreparedListener
                }
                prepTimeout?.let { handler.removeCallbacks(it) }
                pending = null
                try {
                    val v = if (r.ramp) target * 0.05f else target
                    mp.setVolume(v, v)
                    mp.start()
                    player = mp
                    if (i > 0) AlarmLog.add(this, "대신 재생: $name")
                    if (r.ramp) {
                        rampStart = System.currentTimeMillis()
                        handler.post(rampStep)
                    }
                } catch (e: Exception) {
                    pending = mp
                    fail("시작 ${e.javaClass.simpleName}")
                }
            }
            mp.setOnErrorListener { _, what, extra ->
                if (player === mp) {
                    // 울리던 중 오류 → 다음 소리로
                    player = null
                    handler.removeCallbacks(rampStep)
                    pending = mp
                }
                fail("오류 $what/$extra")
                true
            }
            val t = Runnable { fail("준비 3초 넘음") }
            prepTimeout = t
            handler.postDelayed(t, PREPARE_MS)
            mp.prepareAsync()
        } catch (e: Exception) {
            fail(e.javaClass.simpleName)
        }
    }

    private fun startVibration() {
        if (vibrator != null) return
        try {
            val v = getSystemService(Vibrator::class.java)
            v?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 800, 600), 0))
            vibrator = v
        } catch (e: Exception) {
        }
    }

    private fun stopSound() {
        gen++
        handler.removeCallbacks(rampStep)
        prepTimeout?.let { handler.removeCallbacks(it) }
        prepTimeout = null
        try {
            pending?.release()
        } catch (e: Exception) {
        }
        pending = null
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
        try {
            WidgetRefresher.refreshAll(this)   // 위젯의 "다음 알람" 글자를 바로 갱신
        } catch (e: Exception) {
        }
        stopSelf()
    }

    override fun onDestroy() {
        handler.removeCallbacks(autoStop)
        stopSound()
        super.onDestroy()
    }
}
