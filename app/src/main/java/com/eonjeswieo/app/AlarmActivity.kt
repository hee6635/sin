package com.eonjeswieo.app

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

    companion object {
        const val EXTRA_TITLE = "title"
        const val EXTRA_TIME = "time"
        const val EXTRA_SNOOZE_MIN = "snoozeMin"   // 0 이면 다시 울림 버튼 숨김 (최대 횟수 다 씀)
    }

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

        val title = intent.getStringExtra(EXTRA_TITLE) ?: "알람"
        val time = intent.getStringExtra(EXTRA_TIME) ?: ""
        val snoozeMin = intent.getIntExtra(EXTRA_SNOOZE_MIN, 0)

        // 파스텔 톤 끄기 화면: 낮에는 연한 라벤더 · 밤(폰 다크 모드)에는 차분한 남색. 큰 시계 → 이름 알약 → 둥근 두 버튼(미루기 · 끄기)
        val night = (resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES
        val bg0 = if (night) 0xFF1D2335.toInt() else 0xFFE7EDFA.toInt()
        val bg1 = if (night) 0xFF2B2842.toInt() else 0xFFF6EAF3.toInt()
        val ink = if (night) 0xFFEEF0F8.toInt() else 0xFF2A3042.toInt()
        val sub = if (night) 0xFFB9C0D8.toInt() else 0xFF5D667E.toInt()
        val chipBg = if (night) 0x33FFFFFF else 0xB3FFFFFF.toInt()
        val snoozeBg = if (night) 0xFF3A4262.toInt() else 0xFFD3DCF1.toInt()
        val snoozeInk = if (night) 0xFFD2DAF6.toInt() else 0xFF3B4A78.toInt()
        val stopBg = if (night) 0xFFE58D9E.toInt() else 0xFFF3A3B1.toInt()
        val stopInk = if (night) 0xFF3A1822.toInt() else 0xFF5A2030.toInt()

        val root = LinearLayout(this)
        root.orientation = LinearLayout.VERTICAL
        root.gravity = Gravity.CENTER_HORIZONTAL
        root.background = android.graphics.drawable.GradientDrawable(android.graphics.drawable.GradientDrawable.Orientation.TOP_BOTTOM, intArrayOf(bg0, bg1))
        root.setPadding(dp(24), dp(24), dp(24), dp(40))

        fun lp(w: Int, h: Int) = LinearLayout.LayoutParams(w, h)
        val top = android.widget.Space(this)
        root.addView(top, LinearLayout.LayoutParams(1, 0, 1.1f))

        // 날짜 줄
        val cal = java.util.Calendar.getInstance()
        val dow = arrayOf("일", "월", "화", "수", "목", "금", "토")[cal.get(java.util.Calendar.DAY_OF_WEEK) - 1]
        val dateView = TextView(this)
        dateView.text = "${cal.get(java.util.Calendar.MONTH) + 1}월 ${cal.get(java.util.Calendar.DAY_OF_MONTH)}일 ${dow}요일"
        dateView.textSize = 16f
        dateView.setTextColor(sub)
        dateView.gravity = Gravity.CENTER
        root.addView(dateView, lp(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        // 시계: "오후" 작게 위 · 숫자 크게 (time 이 "오후 07:30" 모양이면 나눔)
        val parts = time.split(" ", limit = 2)
        val ap = if (parts.size == 2) parts[0] else ""
        val clock = if (parts.size == 2) parts[1] else time
        if (ap.isNotEmpty()) {
            val apView = TextView(this)
            apView.text = ap
            apView.textSize = 22f
            apView.setTextColor(ink)
            apView.gravity = Gravity.CENTER
            apView.setPadding(0, dp(18), 0, 0)
            root.addView(apView, lp(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        }
        val timeView = TextView(this)
        timeView.text = clock
        timeView.textSize = 72f
        timeView.setTextColor(ink)
        timeView.typeface = Typeface.create("sans-serif-medium", Typeface.BOLD)
        timeView.gravity = Gravity.CENTER
        timeView.includeFontPadding = false
        root.addView(timeView, lp(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        // 이름(주간 알람 …) 알약
        val titleView = TextView(this)
        titleView.text = title
        titleView.textSize = 18f
        titleView.setTextColor(ink)
        titleView.typeface = Typeface.DEFAULT_BOLD
        titleView.gravity = Gravity.CENTER
        titleView.setPadding(dp(20), dp(8), dp(20), dp(8))
        val chip = android.graphics.drawable.GradientDrawable()
        chip.cornerRadius = dp(24).toFloat()
        chip.setColor(chipBg)
        titleView.background = chip
        val chipLp = lp(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        chipLp.topMargin = dp(22)
        root.addView(titleView, chipLp)

        val mid = android.widget.Space(this)
        root.addView(mid, LinearLayout.LayoutParams(1, 0, 1.6f))

        // 둥근 버튼 두 개: 미루기(작게) · 끄기(크게)
        fun roundBtn(label: String, sub2: String, size: Int, bg: Int, fg: Int, textSp: Float, action: String): LinearLayout {
            val c = LinearLayout(this)
            c.orientation = LinearLayout.VERTICAL
            c.gravity = Gravity.CENTER
            val oval = android.graphics.drawable.GradientDrawable()
            oval.shape = android.graphics.drawable.GradientDrawable.OVAL
            oval.setColor(bg)
            c.background = oval
            c.isClickable = true
            c.contentDescription = label + if (sub2.isNotEmpty()) " " + sub2 else ""
            val t = TextView(this)
            t.text = label
            t.textSize = textSp
            t.setTextColor(fg)
            t.typeface = Typeface.DEFAULT_BOLD
            t.gravity = Gravity.CENTER
            c.addView(t)
            if (sub2.isNotEmpty()) {
                val t2 = TextView(this)
                t2.text = sub2
                t2.textSize = 13f
                t2.setTextColor(fg)
                t2.alpha = 0.8f
                t2.gravity = Gravity.CENTER
                c.addView(t2)
            }
            c.setOnClickListener { sendToService(action) }
            c.layoutParams = lp(size, size)
            return c
        }
        val row = LinearLayout(this)
        row.orientation = LinearLayout.HORIZONTAL
        row.gravity = Gravity.CENTER
        if (snoozeMin > 0) {
            val sb = roundBtn("미루기", "${snoozeMin}분", dp(104), snoozeBg, snoozeInk, 18f, AlarmService.ACTION_SNOOZE)
            row.addView(sb)
            val gap = android.widget.Space(this)
            row.addView(gap, LinearLayout.LayoutParams(dp(36), 1))
        }
        row.addView(roundBtn("끄기", "", dp(132), stopBg, stopInk, 26f, AlarmService.ACTION_STOP))
        root.addView(row, lp(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        val bottom = android.widget.Space(this)
        root.addView(bottom, LinearLayout.LayoutParams(1, 0, 0.5f))

        setContentView(root)

        val filter = IntentFilter(AlarmService.ACTION_STOPPED)
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(stopped, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(stopped, filter)
        }
    }

    private fun sendToService(action: String) {
        val i = Intent(this, AlarmService::class.java)
        i.action = action
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
