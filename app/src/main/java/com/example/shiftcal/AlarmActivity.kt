package com.example.shiftcal

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/** 알람이 울릴 때 잠금화면 위에 뜨는 큰 "끄기" 화면 */
class AlarmActivity : Activity() {

    private val stopped = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            finish()
        }
    }

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()

    @Suppress("DEPRECATION")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        val title = intent.getStringExtra(AlarmService.EXTRA_TITLE) ?: "알람"
        val time = intent.getStringExtra(AlarmService.EXTRA_TIME) ?: ""

        val root = LinearLayout(this)
        root.orientation = LinearLayout.VERTICAL
        root.gravity = Gravity.CENTER
        root.setBackgroundColor(Color.BLACK)
        root.setPadding(dp(24), dp(24), dp(24), dp(24))

        val timeView = TextView(this)
        timeView.text = time
        timeView.textSize = 54f
        timeView.setTextColor(Color.WHITE)
        timeView.typeface = Typeface.DEFAULT_BOLD
        timeView.gravity = Gravity.CENTER
        root.addView(
            timeView,
            LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        )

        val titleView = TextView(this)
        titleView.text = title
        titleView.textSize = 24f
        titleView.setTextColor(0xFFDDDDDD.toInt())
        titleView.gravity = Gravity.CENTER
        titleView.setPadding(0, dp(12), 0, dp(48))
        root.addView(
            titleView,
            LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        )

        val stopBtn = Button(this)
        stopBtn.text = "끄기"
        stopBtn.textSize = 28f
        stopBtn.setTextColor(Color.WHITE)
        stopBtn.setBackgroundColor(0xFFD9455F.toInt())
        stopBtn.setOnClickListener { stopAlarm() }
        root.addView(stopBtn, LinearLayout.LayoutParams(dp(220), dp(96)))

        setContentView(root)

        val filter = IntentFilter(AlarmService.ACTION_STOPPED)
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(stopped, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(stopped, filter)
        }
    }

    private fun stopAlarm() {
        val i = Intent(this, AlarmService::class.java)
        i.action = AlarmService.ACTION_STOP
        startService(i)
        finish()
    }

    override fun onDestroy() {
        try {
            unregisterReceiver(stopped)
        } catch (e: Exception) {
        }
        super.onDestroy()
    }
}
