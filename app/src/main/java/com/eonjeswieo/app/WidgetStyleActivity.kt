package com.eonjeswieo.app

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.SeekBar
import android.widget.TextView
import org.json.JSONObject
import java.util.concurrent.Executors

/**
 * v0.191 위젯 설정 화면 (삼성 위젯 설정처럼): 실제 배경화면 위에 한 달 위젯 미리보기 + 아래 흰 카드(진하기 · 배경 · 모양) + 취소 · 저장
 * 처음부터 배경화면을 보이게 만든 화면(테마 windowShowWallpaper)이라 웹 화면 투명 방식의 잔상 · 렉이 없음
 * 받는 것: EXTRA_JSON = 앱이 만든 위젯 자료(widgetJson) · 돌려주는 것: {theme, alpha, bg, look}
 */
class WidgetStyleActivity : Activity() {
    companion object {
        const val EXTRA_JSON = "json"
        const val EXTRA_OUT = "out"
    }

    private lateinit var data: JSONObject
    private lateinit var img: ImageView
    private val ui = Handler(Looper.getMainLooper())
    private val pool = Executors.newSingleThreadExecutor()
    private var busy = false
    private var again = false
    private var wDp = 330
    private var hDp = 350
    private val segs = mutableListOf<() -> Unit>()

    private val night by lazy { (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES }
    private val accent = Color.parseColor("#3182f6")
    private fun dp(v: Float) = v * resources.displayMetrics.density
    private fun dpi(v: Float) = dp(v).toInt()
    private fun round(c: Int, r: Float, stroke: Int = 0, sc: Int = 0) = GradientDrawable().apply { setColor(c); cornerRadius = dp(r); if (stroke > 0) setStroke(stroke, sc) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        data = try { JSONObject(intent.getStringExtra(EXTRA_JSON) ?: "{}") } catch (e: Exception) { JSONObject() }
        if (!data.has("theme")) data.put("theme", "system")
        if (!data.has("alpha")) data.put("alpha", 100)
        realSize()

        val txt = if (night) Color.WHITE else Color.parseColor("#191f28")
        val sub = if (night) Color.parseColor("#9aa4b2") else Color.parseColor("#6b7684")
        val cardBg = if (night) Color.parseColor("#1c1f26") else Color.WHITE

        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val top = FrameLayout(this)
        img = ImageView(this).apply { adjustViewBounds = true; scaleType = ImageView.ScaleType.FIT_CENTER }
        top.addView(img, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT, Gravity.CENTER).apply { setMargins(dpi(16f), dpi(16f), dpi(16f), dpi(16f)) })
        root.addView(top, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))

        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = round(cardBg, 28f)
            setPadding(dpi(20f), dpi(18f), dpi(20f), dpi(6f))
        }
        // 진하기
        val aRow = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
        aRow.addView(label("진하기", txt), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        val aVal = label(data.optInt("alpha", 100).toString() + "%", accent)
        aRow.addView(aVal)
        card.addView(aRow)
        val bar = SeekBar(this).apply {
            max = 10
            progress = (data.optInt("alpha", 100).coerceIn(0, 100) + 5) / 10
            progressTintList = android.content.res.ColorStateList.valueOf(accent)
            thumbTintList = android.content.res.ColorStateList.valueOf(accent)
            progressBackgroundTintList = android.content.res.ColorStateList.valueOf(if (night) Color.parseColor("#3a3f48") else Color.parseColor("#d1d6db"))
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(s: SeekBar?, p: Int, fromUser: Boolean) {
                    data.put("alpha", p * 10); aVal.text = (p * 10).toString() + "%"; redraw()
                }
                override fun onStartTrackingTouch(s: SeekBar?) {}
                override fun onStopTrackingTouch(s: SeekBar?) {}
            })
        }
        card.addView(bar, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dpi(40f)).apply { setMargins(-dpi(12f), dpi(2f), -dpi(12f), dpi(8f)) })
        // 배경 · 또렷하게 · 모양
        card.addView(seg("theme", listOf("light" to "밝게", "dark" to "어둡게", "system" to "폰 설정 따라"), "system", txt, sub))
        card.addView(seg("bg", listOf("" to "기본", "vivid" to "또렷하게"), "", txt, sub), gap(10f))
        card.addView(seg("look", listOf("fill" to "칸 채우기", "circle" to "동그라미"), "fill", txt, sub), gap(10f))
        // 취소 · 저장
        val btns = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
        btns.addView(textBtn("취소", txt) { setResult(RESULT_CANCELED); finish() }, LinearLayout.LayoutParams(0, dpi(52f), 1f))
        btns.addView(View(this).apply { setBackgroundColor(if (night) Color.parseColor("#3a3f48") else Color.parseColor("#e5e8eb")) }, LinearLayout.LayoutParams(dpi(1f), dpi(18f)))
        btns.addView(textBtn("저장", accent) {
            val out = JSONObject().put("theme", data.optString("theme", "system")).put("alpha", data.optInt("alpha", 100))
                .put("bg", data.optString("bg", "")).put("look", data.optString("look", "fill"))
            setResult(RESULT_OK, Intent().putExtra(EXTRA_OUT, out.toString())); finish()
        }, LinearLayout.LayoutParams(0, dpi(52f), 1f))
        card.addView(btns, gap(10f))
        root.addView(card, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { setMargins(dpi(8f), 0, dpi(8f), dpi(8f)) })

        root.setOnApplyWindowInsetsListener { v, ins ->
            @Suppress("DEPRECATION")
            v.setPadding(0, ins.systemWindowInsetTop, 0, ins.systemWindowInsetBottom); ins
        }
        setContentView(root)
        window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LAYOUT_STABLE or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        redraw()
    }

    /** 홈 화면에 놓인 한 달 위젯 크기 (없으면 기본 330 × 350) */
    private fun realSize() {
        try {
            val m = AppWidgetManager.getInstance(this)
            val id = m.getAppWidgetIds(ComponentName(this, MonthWidgetProvider::class.java)).firstOrNull() ?: return
            val o = m.getAppWidgetOptions(id)
            val w = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0)
            val h = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0)
            if (w >= 200 && h >= 200) { wDp = w; hDp = h }
        } catch (e: Exception) { }
    }

    private fun gap(t: Float) = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { topMargin = dpi(t) }

    private fun label(s: String, c: Int) = TextView(this).apply { text = s; setTextColor(c); textSize = 16f; typeface = Typeface.DEFAULT_BOLD }

    private fun textBtn(s: String, c: Int, go: () -> Unit) = TextView(this).apply {
        text = s; setTextColor(c); textSize = 17f; typeface = Typeface.DEFAULT_BOLD; gravity = Gravity.CENTER
        isClickable = true; setOnClickListener { go() }
    }

    /** 앱과 같은 모양의 고르기 줄: 고른 칸 = 파란 테두리 */
    private fun seg(key: String, opts: List<Pair<String, String>>, def: String, txt: Int, sub: Int): View {
        val row = LinearLayout(this)
        val views = opts.map { (v, name) ->
            TextView(this).apply {
                text = name; textSize = 14.5f; gravity = Gravity.CENTER; isClickable = true
                setOnClickListener { data.put(key, v); segs.forEach { it() }; redraw() }
            }
        }
        views.forEachIndexed { i, tv -> row.addView(tv, LinearLayout.LayoutParams(0, dpi(42f), 1f).apply { if (i > 0) leftMargin = dpi(6f) }) }
        val paint = {
            val cur = data.optString(key, def).ifEmpty { def }
            views.forEachIndexed { i, tv ->
                val on = opts[i].first == cur
                tv.background = if (on) round(if (night) Color.parseColor("#1c1f26") else Color.WHITE, 12f, dpi(2f), accent)
                    else round(if (night) Color.parseColor("#2a2e36") else Color.parseColor("#f2f4f6"), 12f)
                tv.setTextColor(if (on) accent else sub)
                tv.typeface = if (on) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
            }
        }
        segs.add(paint); paint()
        return row
    }

    /** 그리기는 뒤에서 한 장씩 (밀고 있으면 끝난 뒤 마지막 값으로 한 번 더) */
    private fun redraw() {
        if (busy) { again = true; return }
        busy = true; again = false
        val snap = JSONObject(data.toString())
        pool.execute {
            val b: Bitmap? = MonthRenderer.previewBitmap(applicationContext, snap, wDp, hDp, 3f)
            ui.post {
                if (isFinishing || isDestroyed) { b?.recycle(); return@post }
                if (b != null) img.setImageBitmap(b)
                busy = false
                if (again) redraw()
            }
        }
    }

    override fun onDestroy() { pool.shutdownNow(); super.onDestroy() }
}
