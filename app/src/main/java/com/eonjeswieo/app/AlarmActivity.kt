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
        const val EXTRA_COLOR = "col"      // 근무 색 #rrggbb (빈 값 = 라벤더)
        const val EXTRA_ICON = "ico"       // 이름 앞 아이콘
        const val EXTRA_SHIFT = "shiftName" // 이름 옆 작은 근무 표시 (근무 색 알람만)
        const val EXTRA_SN_MAX = "snMax"   // 다시 울림 최대 횟수 (-1 = 제한 없음)
        const val EXTRA_SN_COUNT = "snCount" // 지금까지 다시 울린 횟수
        const val EXTRA_WXQ = "wxq"        // 출퇴근 날씨: 새로 물어볼 주소 (없으면 날씨 카드 없음)
        const val EXTRA_WXP = "wxp"        // 출퇴근 날씨: 인터넷이 안 될 때 쓸 예비 문구
        private const val CARD_MS = 10_000L
    }

    private val stopped = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (!showingCard) finish()   // 끄기 → 날씨 카드를 보여 주는 중이면 닫지 않음
        }
    }

    // 출퇴근 날씨 카드 (끄기를 누른 뒤 같은 화면이 조용히 바뀜 · 누르거나 10초 뒤 닫힘 · 미루기면 안 뜸)
    private var wxq = ""
    private var wxp = ""
    @Volatile private var fresh: org.json.JSONObject? = null
    private var showingCard = false
    private var cardFromFallback = false
    private val handler = android.os.Handler(android.os.Looper.getMainLooper())
    private val closeCard = Runnable { finish() }
    private var pal = IntArray(4)   // 배경 위 · 아래 · 글자 · 작은 글자

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()
    private var breathe: android.animation.ValueAnimator? = null

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
        val colHex = intent.getStringExtra(EXTRA_COLOR) ?: ""
        val icon = intent.getStringExtra(EXTRA_ICON) ?: ""
        val shiftName = intent.getStringExtra(EXTRA_SHIFT) ?: ""
        val snMax = intent.getIntExtra(EXTRA_SN_MAX, 3)
        val snCount = intent.getIntExtra(EXTRA_SN_COUNT, 0)
        wxq = intent.getStringExtra(EXTRA_WXQ) ?: ""
        wxp = intent.getStringExtra(EXTRA_WXP) ?: ""
        if (wxq.isNotBlank()) {
            // 울리는 동안 새 예보를 미리 받아 둠 (끄기를 누를 때쯤이면 보통 도착)
            Thread {
                val w = Weather.fetch(wxq, 8000)
                if (w != null) {
                    fresh = w
                    runOnUiThread { if (showingCard && cardFromFallback && !isFinishing && pickCard() === w) showCard() }
                }
            }.start()
        }

        // 파스텔 끄기 화면: 근무 색으로 배경(주간 하늘 아침 · 야간 살구 노을 …), 근무와 상관없는 알람은 라벤더 · 밤(폰 다크 모드)은 남색
        val night = (resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES
        val shiftCol = try { if (colHex.isNotEmpty()) Color.parseColor(colHex) else 0 } catch (e: Exception) { 0 }
        fun mix(c: Int, w: Int, t: Float): Int = Color.rgb(
            Math.round(Color.red(c) * t + Color.red(w) * (1 - t)), Math.round(Color.green(c) * t + Color.green(w) * (1 - t)), Math.round(Color.blue(c) * t + Color.blue(w) * (1 - t)))
        fun darker(c: Int, k: Float): Int = Color.rgb(Math.round(Color.red(c) * k), Math.round(Color.green(c) * k), Math.round(Color.blue(c) * k))
        val white = Color.WHITE
        val lav0 = 0xFFE7EDFA.toInt(); val lav1 = 0xFFF6EAF3.toInt()
        val bg0 = if (night) 0xFF1D2335.toInt() else if (shiftCol != 0) mix(shiftCol, white, 0.42f) else lav0
        val bg1 = if (night) 0xFF2B2842.toInt() else if (shiftCol != 0) mix(shiftCol, lav1, 0.14f) else lav1
        val accent = if (shiftCol != 0) shiftCol else 0xFFA99BE0.toInt()   // 원 · 빛 · 근무 표시 색
        val blob1 = if (night) (accent and 0x00FFFFFF) or 0x55000000 else (mix(accent, white, 0.75f) and 0x00FFFFFF) or 0xCC000000.toInt()
        val blob2 = if (night) 0x554A3550 else (if (shiftCol != 0) 0xCCFBE7C8.toInt() else 0xCCF8D7E6.toInt())
        val ink = if (night) 0xFFEEF0F8.toInt() else if (shiftCol != 0) darker(shiftCol, 0.22f) else 0xFF2A3042.toInt()
        val sub = if (night) 0xFFB9C0D8.toInt() else if (shiftCol != 0) darker(shiftCol, 0.5f) else 0xFF5D667E.toInt()
        val chipBg = if (night) 0x1FFFFFFF else 0xBFFFFFFF.toInt()
        val snoozeBg = if (night) 0xFF3A4262.toInt() else if (shiftCol != 0) mix(shiftCol, white, 0.45f) else 0xFFD3DCF1.toInt()
        val snoozeInk = if (night) 0xFFD2DAF6.toInt() else if (shiftCol != 0) darker(shiftCol, 0.35f) else 0xFF3B4A78.toInt()
        val stopBg = if (night) 0xFFE58D9E.toInt() else 0xFFF3A3B1.toInt()
        val stopInk = if (night) 0xFF3A1822.toInt() else 0xFF5A2030.toInt()
        pal = intArrayOf(bg0, bg1, ink, sub)
        // 애니메이션 끄기(접근성) 설정이면 숨 쉬는 원도 멈춤
        val animOn = try { android.provider.Settings.Global.getFloat(contentResolver, android.provider.Settings.Global.ANIMATOR_DURATION_SCALE, 1f) > 0f } catch (e: Exception) { true }

        val frame = android.widget.FrameLayout(this)
        frame.background = android.graphics.drawable.GradientDrawable(android.graphics.drawable.GradientDrawable.Orientation.TOP_BOTTOM, intArrayOf(bg0, bg1))
        // 배경 뒤 은은한 빛 두 개 (근무 색)
        fun blob(color: Int, size: Int, g: Int, mx: Int, my: Int) {
            val v = android.view.View(this)
            val d = android.graphics.drawable.GradientDrawable()
            d.shape = android.graphics.drawable.GradientDrawable.OVAL
            d.gradientType = android.graphics.drawable.GradientDrawable.RADIAL_GRADIENT
            d.gradientRadius = size / 2f
            d.colors = intArrayOf(color, color and 0x00FFFFFF)
            v.background = d
            val l = android.widget.FrameLayout.LayoutParams(size, size, g)
            if (g and Gravity.LEFT == Gravity.LEFT) l.leftMargin = mx else l.rightMargin = mx
            if (g and Gravity.TOP == Gravity.TOP) l.topMargin = my else l.bottomMargin = my
            frame.addView(v, l)
        }
        blob(blob1, dp(380), Gravity.TOP or Gravity.LEFT, -dp(130), -dp(90))
        blob(blob2, dp(340), Gravity.BOTTOM or Gravity.RIGHT, -dp(140), dp(150))

        val root = LinearLayout(this)
        root.orientation = LinearLayout.VERTICAL
        root.gravity = Gravity.CENTER_HORIZONTAL
        root.setPadding(dp(24), dp(24), dp(24), dp(40))
        frame.addView(root, android.widget.FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))

        fun lp(w: Int, h: Int) = LinearLayout.LayoutParams(w, h)
        val top = android.widget.Space(this)
        root.addView(top, LinearLayout.LayoutParams(1, 0, 0.9f))

        // 날짜 줄
        val cal = java.util.Calendar.getInstance()
        val dow = arrayOf("일", "월", "화", "수", "목", "금", "토")[cal.get(java.util.Calendar.DAY_OF_WEEK) - 1]
        val dateView = TextView(this)
        dateView.text = "${cal.get(java.util.Calendar.MONTH) + 1}월 ${cal.get(java.util.Calendar.DAY_OF_MONTH)}일 ${dow}요일"
        dateView.textSize = 16f
        dateView.setTextColor(sub)
        dateView.gravity = Gravity.CENTER
        root.addView(dateView, lp(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        // 시계: 둘레에 숨 쉬는 원 3겹 · 가운데 "오전" 작게 + 숫자 크게 (time 이 "오후 07:30" 모양이면 나눔)
        val parts = time.split(" ", limit = 2)
        val ap = if (parts.size == 2) parts[0] else ""
        val clock = (if (parts.size == 2) parts[1] else time).let { if (it.length == 5 && it.startsWith("0")) it.substring(1) else it }
        val box = android.widget.FrameLayout(this)
        val boxSize = dp(250)
        val rings = ArrayList<android.view.View>()
        for ((k, inset) in listOf(Pair(0, dp(18)), Pair(1, dp(4)), Pair(2, -dp(12)))) {
            val v = android.view.View(this)
            val d = android.graphics.drawable.GradientDrawable()
            d.shape = android.graphics.drawable.GradientDrawable.OVAL
            d.setStroke(dp(2), accent)
            if (k == 0) d.setColor(if (night) 0x14FFFFFF else 0x40FFFFFF)
            v.background = d
            v.alpha = when (k) { 0 -> 0.7f; 1 -> 0.42f; else -> 0.24f }
            val l = android.widget.FrameLayout.LayoutParams(boxSize - 2 * inset, boxSize - 2 * inset, Gravity.CENTER)
            box.addView(v, l)
            rings.add(v)
        }
        val tcol = LinearLayout(this)
        tcol.orientation = LinearLayout.VERTICAL
        tcol.gravity = Gravity.CENTER
        if (ap.isNotEmpty()) {
            val apView = TextView(this)
            apView.text = ap
            apView.textSize = 20f
            apView.setTextColor(sub)
            apView.typeface = Typeface.DEFAULT_BOLD
            apView.gravity = Gravity.CENTER
            tcol.addView(apView)
        }
        val timeView = TextView(this)
        timeView.text = clock
        timeView.textSize = 66f
        timeView.setTextColor(ink)
        timeView.typeface = Typeface.create("sans-serif-medium", Typeface.BOLD)
        timeView.gravity = Gravity.CENTER
        timeView.includeFontPadding = false
        tcol.addView(timeView)
        box.addView(tcol, android.widget.FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER))
        box.clipChildren = false
        val boxLp = lp(boxSize, boxSize)
        boxLp.topMargin = dp(26)
        root.addView(box, boxLp)
        root.clipChildren = false
        if (animOn) {
            // 숨 쉬는 원: 1.2초마다 커졌다 작아짐 (바깥 원일수록 크게 퍼지며 옅어짐 — 울리는 중이라는 게 보이게)
            val va = android.animation.ValueAnimator.ofFloat(0f, 1f)
            va.duration = 1200L
            va.repeatMode = android.animation.ValueAnimator.REVERSE
            va.repeatCount = android.animation.ValueAnimator.INFINITE
            va.interpolator = android.view.animation.AccelerateDecelerateInterpolator()
            va.addUpdateListener { a ->
                val f = a.animatedValue as Float
                for ((k, v) in rings.withIndex()) {
                    val sc = 1f + f * (0.06f + 0.06f * k)   // 안쪽 6% · 가운데 12% · 바깥 18%
                    v.scaleX = sc; v.scaleY = sc
                    v.alpha = (when (k) { 0 -> 0.7f; 1 -> 0.42f; else -> 0.24f }) * (1f - 0.55f * f * (k / 2f)) + (if (k == 0) 0.2f * f else 0f)
                }
            }
            va.start()
            breathe = va
        }

        // 이름 알약: 아이콘 + 이름 + 작은 근무 표시(근무 색)
        val chipRow = LinearLayout(this)
        chipRow.orientation = LinearLayout.HORIZONTAL
        chipRow.gravity = Gravity.CENTER_VERTICAL
        chipRow.setPadding(dp(18), dp(8), dp(18), dp(8))
        val chip = android.graphics.drawable.GradientDrawable()
        chip.cornerRadius = dp(24).toFloat()
        chip.setColor(chipBg)
        chipRow.background = chip
        val titleView = TextView(this)
        titleView.text = (if (icon.isNotEmpty()) "$icon " else "") + title
        titleView.textSize = 18f
        titleView.setTextColor(ink)
        titleView.typeface = Typeface.DEFAULT_BOLD
        chipRow.addView(titleView)
        if (shiftName.isNotEmpty()) {
            val tag = TextView(this)
            tag.text = shiftName
            tag.textSize = 12f
            tag.setTextColor(Color.WHITE)
            tag.typeface = Typeface.DEFAULT_BOLD
            tag.setPadding(dp(8), dp(2), dp(8), dp(3))
            val tb = android.graphics.drawable.GradientDrawable()
            tb.cornerRadius = dp(10).toFloat()
            tb.setColor(darker(accent, 0.82f))
            tag.background = tb
            val tl = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
            tl.leftMargin = dp(8)
            chipRow.addView(tag, tl)
        }
        val chipLp = lp(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        chipLp.topMargin = dp(24)
        root.addView(chipRow, chipLp)

        val mid = android.widget.Space(this)
        root.addView(mid, LinearLayout.LayoutParams(1, 0, 1.4f))

        // 둥근 버튼 두 개: 미루기(작게, 아래에 남은 횟수 — 점 ●●○ · 마지막이면 "마지막" · 4번 이상이면 "n번 남음") · 끄기(크게, 바깥 얇은 고리)
        fun roundBtn(label: String, size: Int, bg: Int, fg: Int, textSp: Float, action: String, extra: android.view.View?, ring: Boolean): android.view.View {
            val c = LinearLayout(this)
            c.orientation = LinearLayout.VERTICAL
            c.gravity = Gravity.CENTER
            val oval = android.graphics.drawable.GradientDrawable()
            oval.shape = android.graphics.drawable.GradientDrawable.OVAL
            oval.setColor(bg)
            c.background = oval
            c.elevation = dp(6).toFloat()
            c.contentDescription = label
            val t = TextView(this)
            t.text = label
            t.textSize = textSp
            t.setTextColor(fg)
            t.typeface = Typeface.DEFAULT_BOLD
            t.gravity = Gravity.CENTER
            c.addView(t)
            if (extra != null) c.addView(extra)
            c.setOnClickListener { sendToService(action) }
            if (!ring) { c.layoutParams = lp(size, size); return c }
            val wrap = android.widget.FrameLayout(this)
            val halo = android.view.View(this)
            val hd = android.graphics.drawable.GradientDrawable()
            hd.shape = android.graphics.drawable.GradientDrawable.OVAL
            hd.setStroke(dp(2), (bg and 0x00FFFFFF) or 0x66000000)
            halo.background = hd
            wrap.addView(halo, android.widget.FrameLayout.LayoutParams(size + dp(16), size + dp(16), Gravity.CENTER))
            wrap.addView(c, android.widget.FrameLayout.LayoutParams(size, size, Gravity.CENTER))
            wrap.layoutParams = lp(size + dp(16), size + dp(16))
            return wrap
        }
        val row = LinearLayout(this)
        row.orientation = LinearLayout.HORIZONTAL
        row.gravity = Gravity.CENTER
        if (snoozeMin > 0) {
            val left = if (snMax < 0) -1 else Math.max(0, snMax - snCount)
            val extra: android.view.View? = when {
                left == 1 -> TextView(this).also { it.text = "마지막"; it.textSize = 13f; it.setTextColor(snoozeInk); it.alpha = 0.85f; it.gravity = Gravity.CENTER }
                left > 1 && snMax in 2..3 -> LinearLayout(this).also { dots ->
                    dots.orientation = LinearLayout.HORIZONTAL
                    dots.gravity = Gravity.CENTER
                    dots.setPadding(0, dp(6), 0, 0)
                    for (k in 0 until snMax) {
                        val d = android.view.View(this)
                        val dd = android.graphics.drawable.GradientDrawable()
                        dd.shape = android.graphics.drawable.GradientDrawable.OVAL
                        dd.setColor(snoozeInk)
                        d.background = dd
                        d.alpha = if (k < left) 0.85f else 0.22f
                        val dl = LinearLayout.LayoutParams(dp(7), dp(7))
                        if (k > 0) dl.leftMargin = dp(5)
                        dots.addView(d, dl)
                    }
                    dots.contentDescription = "${left}번 남음"
                }
                left > 1 -> TextView(this).also { it.text = "${left}번 남음"; it.textSize = 12.5f; it.setTextColor(snoozeInk); it.alpha = 0.85f; it.gravity = Gravity.CENTER }
                else -> null
            }
            row.addView(roundBtn("미루기", dp(104), snoozeBg, snoozeInk, 18f, AlarmService.ACTION_SNOOZE, extra, false))
            val gap = android.widget.Space(this)
            row.addView(gap, LinearLayout.LayoutParams(dp(28), 1))
        }
        row.addView(roundBtn("끄기", dp(132), stopBg, stopInk, 26f, AlarmService.ACTION_STOP, null, true))
        root.addView(row, lp(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        val bottom = android.widget.Space(this)
        root.addView(bottom, LinearLayout.LayoutParams(1, 0, 0.5f))

        setContentView(frame)

        val filter = IntentFilter(AlarmService.ACTION_STOPPED)
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(stopped, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(stopped, filter)
        }
    }

    private fun sendToService(action: String) {
        val card = action == AlarmService.ACTION_STOP && (wxq.isNotBlank() || wxp.isNotBlank()) && (fresh != null || Weather.parse(wxp) != null)
        if (card) showingCard = true
        val i = Intent(this, AlarmService::class.java)
        i.action = action
        startService(i)
        if (card) showCard() else finish()
    }

    /** 끄기 뒤 날씨 카드 (앱 날씨 팝업과 같은 순서 · 같은 그림 · 같은 글씨체):
     *  한 줄 결론 → 출근/퇴근 칸(날씨 · 옷) → (옷이 같으면 한 번만) → 챙길 것 → 미세먼지 → 닫기 · 10초 게이지
     *  닫기 말고 아무 데나 누르면 자동 닫기가 멈춤 (칸을 누르면 그 동네 네이버 날씨) */
    private var autoOff = false
    private var gauge: android.animation.ValueAnimator? = null
    private var closeBtn: android.view.View? = null
    private var stopAutoFn: (() -> Unit)? = null

    override fun dispatchTouchEvent(ev: android.view.MotionEvent): Boolean {
        if (showingCard && ev.actionMasked == android.view.MotionEvent.ACTION_DOWN) {
            val b = closeBtn
            val r = android.graphics.Rect()
            val onClose = b != null && b.getGlobalVisibleRect(r) && r.contains(ev.rawX.toInt(), ev.rawY.toInt())
            if (!onClose) stopAutoFn?.invoke()
        }
        return super.dispatchTouchEvent(ev)
    }
    private fun pickCard(): org.json.JSONObject? {
        val p = Weather.parse(wxp)
        val f = fresh
        return when {
            f != null && f.has("k") -> f
            p != null && p.has("k") -> p   // 서버가 아직 옛 모양이면 앱이 만든 예비 문구(새 모양)
            else -> f ?: p
        }
    }
    private val imgCache = HashMap<String, android.graphics.Bitmap?>()
    private fun wxImg(id: String, size: Int): android.widget.ImageView? {
        if (!Regex("^(sky|wear|faces)/[a-z0-9_]+$").matches(id)) return null
        val bm = imgCache.getOrPut(id) {
            try { assets.open("wx/$id.webp").use { android.graphics.BitmapFactory.decodeStream(it) } } catch (e: Exception) { null }
        } ?: return null
        val v = android.widget.ImageView(this)
        v.setImageBitmap(bm)
        v.scaleType = android.widget.ImageView.ScaleType.FIT_CENTER
        v.layoutParams = LinearLayout.LayoutParams(dp(size), dp(size))
        return v
    }
    private val jua: Typeface by lazy { try { Typeface.createFromAsset(assets, "fonts/jua.ttf") } catch (e: Exception) { Typeface.DEFAULT_BOLD } }

    private fun showCard() {
        val w = pickCard()
        if (w == null) { finish(); return }
        cardFromFallback = w !== fresh
        try { breathe?.cancel() } catch (e: Exception) { }
        handler.removeCallbacks(closeCard)
        try { gauge?.cancel() } catch (e: Exception) { }
        val (bg0, bg1, ink, sub) = pal.toList()
        val night = (resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES
        val boxBg = if (night) 0x26FFFFFF else 0xD9FFFFFF.toInt()
        val boxLine = if (night) 0x33FFFFFF else 0xFFFFFFFF.toInt()
        val wetBg = if (night) 0xFF22345A.toInt() else 0xFFE4EEFB.toInt()
        val wetInk = if (night) 0xFFCFE0FF.toInt() else 0xFF22406E.toInt()
        val badBg = if (night) 0xFF3B2F1C.toInt() else 0xFFFDEEDD.toInt()
        val badInk = if (night) 0xFFF2C879.toInt() else 0xFF7A4A10.toInt()

        val frame = android.widget.FrameLayout(this)
        frame.background = android.graphics.drawable.GradientDrawable(android.graphics.drawable.GradientDrawable.Orientation.TOP_BOTTOM, intArrayOf(bg0, bg1))
        val scroll = android.widget.ScrollView(this)
        scroll.isFillViewport = true
        val root = LinearLayout(this)
        root.orientation = LinearLayout.VERTICAL
        root.gravity = Gravity.CENTER_HORIZONTAL
        root.setPadding(dp(16), dp(40), dp(16), dp(20))
        scroll.addView(root)
        frame.addView(scroll, android.widget.FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        fun tv(t: String, sp: Float, col: Int, bold: Boolean = false, center: Boolean = false, round: Boolean = false): TextView {
            val v = TextView(this); v.text = t; v.textSize = sp; v.setTextColor(col)
            if (round) v.typeface = jua else if (bold) v.typeface = Typeface.DEFAULT_BOLD
            if (center) v.gravity = Gravity.CENTER
            return v
        }
        fun box(bg: Int, line: Int): android.graphics.drawable.GradientDrawable {
            val d = android.graphics.drawable.GradientDrawable(); d.cornerRadius = dp(18).toFloat(); d.setColor(bg); d.setStroke(Math.max(1, dp(1)), line); return d
        }
        val full = { LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT) }
        val cal = java.util.Calendar.getInstance()
        val dow = arrayOf("일", "월", "화", "수", "목", "금", "토")[cal.get(java.util.Calendar.DAY_OF_WEEK) - 1]
        root.addView(tv("${cal.get(java.util.Calendar.MONTH) + 1}월 ${cal.get(java.util.Calendar.DAY_OF_MONTH)}일 (${dow}) · 알람 껐어요", 14f, sub, bold = true, center = true), full())

        // 한 줄 결론
        val k = w.optJSONObject("k")
        val cs = w.optJSONArray("c")
        val kt = k?.optString("t")?.takeIf { it.isNotBlank() } ?: w.optString("h")
        wxImg(k?.optString("i") ?: "", 104)?.let { val lp = LinearLayout.LayoutParams(dp(104), dp(104)); lp.topMargin = dp(8); root.addView(it, lp) }
        root.addView(tv(kt, 26f, ink, center = true, round = true).also { it.setPadding(0, dp(4), 0, 0) }, full())
        val ks = k?.optString("s") ?: w.optString("t")
        if (ks.isNotBlank()) root.addView(tv(ks, 14.5f, sub, bold = true, center = true).also { it.setPadding(0, dp(2), 0, 0) }, full())

        // 출근 · 퇴근 칸
        val cards = ArrayList<org.json.JSONObject>()
        if (cs != null) for (i in 0 until cs.length()) cs.optJSONObject(i)?.let { cards.add(it) }
        val same = cards.size == 2 && cards[0].optString("w").isNotBlank() && cards[0].optString("w") == cards[1].optString("w")
        if (cards.isNotEmpty()) {
            val row = LinearLayout(this); row.orientation = LinearLayout.HORIZONTAL
            for ((i, x) in cards.withIndex()) {
                val hot = x.optBoolean("hot")
                val cd = LinearLayout(this); cd.orientation = LinearLayout.VERTICAL; cd.gravity = Gravity.CENTER_HORIZONTAL
                cd.setPadding(dp(6), dp(8), dp(6), dp(10))
                cd.background = box(if (hot) wetBg else boxBg, boxLine)
                val c1 = if (hot) wetInk else ink
                cd.addView(tv(x.optString("l"), 13f, if (hot) wetInk else sub, bold = true, center = true))
                x.optString("p").takeIf { it.isNotBlank() }?.let { cd.addView(tv(it, 11.5f, sub, center = true).also { v -> v.maxLines = 1; v.ellipsize = android.text.TextUtils.TruncateAt.END }) }
                val sr = LinearLayout(this); sr.orientation = LinearLayout.HORIZONTAL; sr.gravity = Gravity.CENTER
                wxImg(x.optString("sk"), 44)?.let { sr.addView(it) }
                if (x.has("tp") && !x.isNull("tp")) sr.addView(tv("${x.optInt("tp")}°", 28f, c1, round = true))
                cd.addView(sr)
                cd.addView(tv(x.optString("d"), 12.5f, c1, bold = true, center = true))
                if (!same) {
                    wxImg(x.optString("w"), 60)?.let { val lp = LinearLayout.LayoutParams(dp(60), dp(60)); lp.topMargin = dp(4); cd.addView(it, lp) }
                    x.optString("ws").takeIf { it.isNotBlank() }?.let { cd.addView(tv(it, 15.5f, c1, center = true, round = true)) }
                }
                val q = x.optString("q")
                if (q.isNotBlank()) cd.setOnClickListener { openWeb(Weather.webUrl(q)) }
                val lp = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
                if (i > 0) lp.leftMargin = dp(8)
                row.addView(cd, lp)
            }
            val lp = full(); lp.topMargin = dp(14)
            root.addView(row, lp)
        }
        fun line(bg: Int = boxBg): LinearLayout {
            val l = LinearLayout(this); l.orientation = LinearLayout.HORIZONTAL; l.gravity = Gravity.CENTER_VERTICAL
            l.setPadding(dp(12), dp(6), dp(12), dp(6)); l.background = box(bg, if (bg == boxBg) boxLine else bg)
            val lp = full(); lp.topMargin = dp(8); l.layoutParams = lp
            return l
        }
        if (same) {
            val l = line()
            wxImg(cards[0].optString("w"), 50)?.let { l.addView(it) }
            val col = LinearLayout(this); col.orientation = LinearLayout.VERTICAL; col.setPadding(dp(8), 0, 0, 0)
            col.addView(tv(if (cards[0].optString("l").startsWith("오")) "오늘 하루" else "출근 · 퇴근 모두", 12f, sub))
            col.addView(tv(cards[0].optString("wt").replace(" · ", " + "), 17f, ink, round = true))
            l.addView(col); root.addView(l)
        }
        // 챙길 것
        val b = w.optJSONArray("b")
        if (b != null && b.length() > 0) {
            val l = line()
            l.addView(tv("챙길 것", 15.5f, ink, round = true).also { it.setPadding(0, 0, dp(6), 0) })
            val names = ArrayList<String>()
            for (i in 0 until b.length()) { val x = b.optJSONObject(i) ?: continue; wxImg(x.optString("i"), 32)?.let { l.addView(it) }; names.add(x.optString("n")) }
            l.addView(tv(names.joinToString(" · "), 13.5f, ink, bold = true).also { it.setPadding(dp(4), 0, 0, 0) })
            root.addView(l)
        }
        // 미세먼지 (출근 · 퇴근 중 나쁜 쪽 · 다르면 한 줄 더)
        val dz = w.optJSONArray("dz")
        val zs = ArrayList<org.json.JSONObject>()
        if (dz != null) for (i in 0 until dz.length()) dz.optJSONObject(i)?.let { zs.add(it) }
        zs.sortWith(compareByDescending<org.json.JSONObject> { it.optInt("g") }.thenByDescending { it.optInt("lv") })
        if (zs.isNotEmpty()) {
            val w0 = zs[0]; val bad = w0.optInt("g") >= 3
            val l = line(if (bad) badBg else boxBg)
            wxImg(w0.optString("f"), 42)?.let { l.addView(it) }
            val col = LinearLayout(this); col.orientation = LinearLayout.VERTICAL; col.setPadding(dp(8), 0, 0, 0)
            val c1 = if (bad) badInk else ink
            col.addView(tv("미세먼지 ${w0.optString("lb")}", 16f, c1, round = true))
            val two = zs.size > 1 && zs[1].optInt("g") != w0.optInt("g")
            col.addView(tv(if (two) "${w0.optString("p")}길(${w0.optString("n")}) ${w0.optString("m")}" else w0.optString("m"), 12.5f, c1, bold = true))
            if (two) col.addView(tv("${zs[1].optString("p")}길(${zs[1].optString("n")})은 ${zs[1].optString("lb")}", 12f, c1).also { it.alpha = 0.75f })
            l.addView(col); root.addView(l)
        } else w.optString("a").takeIf { it.isNotBlank() }?.let { val l = line(); l.addView(tv(it, 14f, ink, bold = true)); root.addView(l) }

        // 닫기 + 10초 게이지 (닫기 말고 아무 데나 누르면 멈춤)
        val btn = TextView(this)
        btn.text = "닫기"
        btn.textSize = 18f
        btn.typeface = jua
        btn.gravity = Gravity.CENTER
        btn.setTextColor(if (night) 0xFF1D2335.toInt() else Color.WHITE)
        val bb = android.graphics.drawable.GradientDrawable(); bb.cornerRadius = dp(26).toFloat(); bb.setColor(ink)
        btn.background = bb
        btn.setOnClickListener { finish() }
        val blp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(52)); blp.topMargin = dp(18)
        root.addView(btn, blp)
        val note = tv(if (autoOff) "자동 닫기 멈춤 · 닫기를 눌러 주세요" else "10초 뒤 닫혀요 · 화면을 누르면 멈춰요", 12f, sub, center = true)
        note.setPadding(0, dp(10), 0, dp(6))
        root.addView(note, full())
        val track = android.widget.FrameLayout(this)
        val tb = android.graphics.drawable.GradientDrawable(); tb.cornerRadius = dp(3).toFloat(); tb.setColor((sub and 0x00FFFFFF) or 0x33000000)
        track.background = tb
        val bar = android.view.View(this)
        val fb = android.graphics.drawable.GradientDrawable(); fb.cornerRadius = dp(3).toFloat(); fb.setColor(ink)
        bar.background = fb
        track.addView(bar, android.widget.FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        bar.pivotX = 0f
        root.addView(track, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(6)))
        if (autoOff) track.visibility = android.view.View.GONE
        w.optString("src").takeIf { it.isNotBlank() }?.let {
            root.addView(tv(it + if (cardFromFallback) " · 미리 받아 둔 예보" else "", 11f, sub, center = true).also { v -> v.alpha = 0.8f; v.setPadding(0, dp(14), 0, 0) }, full())
        }
        val stopAuto = {
            if (!autoOff) {
                autoOff = true
                handler.removeCallbacks(closeCard)
                try { gauge?.cancel() } catch (e: Exception) { }
                track.visibility = android.view.View.GONE
                note.text = "자동 닫기 멈춤 · 닫기를 눌러 주세요"
            }
        }
        // 화면 어디를 눌러도(스크롤 포함) 멈춤 — 닫기 버튼은 바로 닫힘, 칸은 날씨 페이지로 (dispatchTouchEvent 에서 봄)
        closeBtn = btn
        stopAutoFn = stopAuto
        setContentView(frame)
        if (!autoOff) {
            handler.postDelayed(closeCard, CARD_MS)
            val an = android.animation.ValueAnimator.ofFloat(1f, 0f)
            an.duration = CARD_MS
            an.interpolator = android.view.animation.LinearInterpolator()
            an.addUpdateListener { bar.scaleX = it.animatedValue as Float }
            an.start()
            gauge = an
        }
    }

    /** 날씨 페이지 열기: 잠금 화면 위라면 잠금 해제를 먼저 묻고, 풀리면 브라우저로 (자동 닫힘은 멈춤) */
    private fun openWeb(url: String) {
        handler.removeCallbacks(closeCard)
        try { gauge?.cancel() } catch (e: Exception) { }
        val go = {
            try {
                startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            } catch (e: Exception) {
            }
            finish()
        }
        val km = getSystemService(android.app.KeyguardManager::class.java)
        if (Build.VERSION.SDK_INT >= 26 && km != null && km.isKeyguardLocked) {
            km.requestDismissKeyguard(this, object : android.app.KeyguardManager.KeyguardDismissCallback() {
                override fun onDismissSucceeded() { go() }
            })
        } else go()
    }

    override fun onDestroy() {
        handler.removeCallbacks(closeCard)
        try { breathe?.cancel() } catch (e: Exception) { }
        try { gauge?.cancel() } catch (e: Exception) { }
        try {
            unregisterReceiver(stopped)
        } catch (e: Exception) {
        }
        super.onDestroy()
    }
}
