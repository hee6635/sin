package com.eonjeswieo.app

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.text.SpannableString
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.text.style.UnderlineSpan
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import org.json.JSONObject

/**
 * 홈 화면 위젯을 누르면 뜨는 "그 날짜" 큰 창.
 * 스티커 · 메모의 할 일을 크게 보고 눌러서 완료/취소만 한다 (글 고치기 · 추가는 앱에서).
 * 체크한 것은 위젯에 바로 반영하고, 대기 목록에 적어 두었다가 앱이 열릴 때 기록에 넣는다.
 */
class WidgetDayActivity : Activity() {

    private var key = ""
    private var data: JSONObject? = null

    private class Pal(val bg: Int, val fg: Int, val sub: Int, val chip: Int, val done: Int, val link: Int, val accent: Int)

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()

    private fun palette(): Pal {
        val night = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
        val theme = data?.optString("theme", "system") ?: "system"
        val dark = theme == "dark" || (theme != "light" && night)
        return if (dark) Pal(0xFF23282E.toInt(), 0xFFF2F4F7.toInt(), 0xFF9AA3AD.toInt(), 0xFF39414A.toInt(), 0xFF1E3A31.toInt(), 0xFF7BA2FF.toInt(), 0xFF3DDC97.toInt())
        else Pal(0xFFFFFFFF.toInt(), 0xFF1F2328.toInt(), 0xFF8A919A.toInt(), 0xFFF1F3F5.toInt(), 0xFFE3F5EF.toInt(), 0xFF2F6FDE.toInt(), 0xFF2A8C6F.toInt())
    }

    private fun rounded(color: Int, r: Int): GradientDrawable {
        val g = GradientDrawable()
        g.setColor(color)
        g.cornerRadius = dp(r).toFloat()
        return g
    }

    private fun tv(text: CharSequence, sp: Float, color: Int, bold: Boolean = false): TextView {
        val t = TextView(this)
        t.text = text
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp)
        t.setTextColor(color)
        if (bold) t.typeface = Typeface.DEFAULT_BOLD
        return t
    }

    /** \u0001 ~ \u0002 사이(앱의 "링크")는 파랗게 + 밑줄 */
    private fun rich(text: String, fg: Int, link: Int): CharSequence {
        val sb = StringBuilder()
        val spans = ArrayList<IntArray>()
        var start = -1
        for (ch in text) {
            if (ch == '\u0001') start = sb.length
            else if (ch == '\u0002') {
                if (start >= 0) spans.add(intArrayOf(start, sb.length))
                start = -1
            } else sb.append(ch)
        }
        val out = SpannableString(sb.toString())
        for (s in spans) {
            if (s[1] > s[0]) {
                out.setSpan(ForegroundColorSpan(link), s[0], s[1], Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                out.setSpan(UnderlineSpan(), s[0], s[1], Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
        }
        return out
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        key = intent.getStringExtra("k") ?: ""
        build()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        key = intent.getStringExtra("k") ?: key
        build()
    }

    private fun findDay(d: JSONObject?): JSONObject? {
        val arr = d?.optJSONArray("days") ?: return null
        for (i in 0 until arr.length()) {
            val x = arr.optJSONObject(i) ?: continue
            if (x.optString("k") == key) return x
        }
        return null
    }

    private fun build() {
        data = WidgetStore.load(this)
        val pal = palette()
        val day = findDay(data)

        val frame = FrameLayout(this)
        frame.setOnClickListener { finish() }

        val card = LinearLayout(this)
        card.orientation = LinearLayout.VERTICAL
        card.background = rounded(pal.bg, 22)
        card.setPadding(dp(18), dp(16), dp(18), dp(12))
        card.isClickable = true

        if (day == null) {
            card.addView(tv("앱을 열어 주세요", 16f, pal.sub))
        } else {
            val dow = arrayOf("일", "월", "화", "수", "목", "금", "토")
            val w = day.optInt("w", 0).coerceIn(0, 6)
            val hol = day.optString("hol", "")
            val dateColor = if (hol.isNotEmpty() || w == 0) 0xFFD6334A.toInt() else pal.fg
            val head = LinearLayout(this)
            head.orientation = LinearLayout.HORIZONTAL
            head.gravity = Gravity.CENTER_VERTICAL
            head.addView(
                tv(day.optInt("m").toString() + "월 " + day.optInt("d") + "일 (" + dow[w] + ")", 20f, dateColor, true),
                LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            )
            val wk = day.optString("t", "")
            if (wk.isNotEmpty()) {
                val bg = day.optString("bg", "")
                val badge = tv(wk, 16f, if (bg.isEmpty()) 0xFFE5484D.toInt() else parse(day.optString("fg", ""), pal.fg), true)
                badge.gravity = Gravity.CENTER
                if (bg.isNotEmpty()) badge.background = rounded(parse(bg, pal.chip), 40)
                head.addView(badge, LinearLayout.LayoutParams(dp(40), dp(40)))
            }
            card.addView(head)
            if (hol.isNotEmpty()) card.addView(tv(hol, 13f, 0xFFD6334A.toInt()))

            val content = LinearLayout(this)
            content.orientation = LinearLayout.VERTICAL

            // 스티커
            val sa = day.optJSONArray("sa")
            if (sa != null && sa.length() > 0) {
                content.addView(sectionTitle("스티커", pal))
                for (i in 0 until sa.length()) {
                    val s = sa.optJSONObject(i) ?: continue
                    content.addView(stickerRow(s, pal))
                }
            }
            // 메모 · 할 일
            val mi = day.optJSONArray("mi")
            if (mi != null && mi.length() > 0) {
                content.addView(sectionTitle("메모 · 할 일", pal))
                for (i in 0 until mi.length()) {
                    val m = mi.optJSONObject(i) ?: continue
                    content.addView(memoRow(m, pal))
                }
            }
            if ((sa == null || sa.length() == 0) && (mi == null || mi.length() == 0)) {
                content.addView(tv("이 날은 스티커도 메모도 없어요", 14f, pal.sub))
            }
            val maxH = (resources.displayMetrics.heightPixels * 0.6f).toInt()
            val scroll = object : ScrollView(this) {
                override fun onMeasure(widthSpec: Int, heightSpec: Int) {
                    super.onMeasure(widthSpec, View.MeasureSpec.makeMeasureSpec(maxH, View.MeasureSpec.AT_MOST))
                }
            }
            scroll.addView(content)
            card.addView(scroll, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        }

        // 아래 버튼: 앱에서 열기 / 닫기
        val bar = LinearLayout(this)
        bar.orientation = LinearLayout.HORIZONTAL
        bar.gravity = Gravity.END
        val close = tv("닫기", 15f, pal.sub, true)
        close.setPadding(dp(14), dp(12), dp(14), dp(8))
        close.setOnClickListener { finish() }
        val open = tv("앱에서 열기", 15f, pal.accent, true)
        open.setPadding(dp(14), dp(12), dp(6), dp(8))
        open.setOnClickListener {
            val go = Intent(this, MainActivity::class.java)
            go.putExtra("openDate", key)
            go.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            startActivity(go)
            finish()
        }
        bar.addView(close)
        bar.addView(open)
        card.addView(bar)

        val lp = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER)
        lp.setMargins(dp(20), dp(24), dp(20), dp(24))
        frame.addView(card, lp)
        setContentView(frame)
    }

    private fun parse(s: String, fallback: Int): Int =
        try {
            if (s.isEmpty()) fallback else Color.parseColor(s)
        } catch (e: Exception) {
            fallback
        }

    private fun sectionTitle(t: String, pal: Pal): TextView {
        val v = tv(t, 13f, pal.sub, true)
        v.setPadding(0, dp(14), 0, dp(6))
        return v
    }

    private fun stickerRow(s: JSONObject, pal: Pal): View {
        val n = s.optInt("n", 0)
        val total = Math.max(1, s.optInt("N", 1))
        val row = LinearLayout(this)
        row.orientation = LinearLayout.HORIZONTAL
        row.gravity = Gravity.CENTER_VERTICAL
        row.setPadding(dp(12), dp(10), dp(12), dp(10))
        row.background = rounded(if (n >= total) pal.done else pal.chip, 14)

        val icons = data?.optJSONObject("ic")
        val photoId = s.optString("i", "")
        val photo = if (photoId.isNotEmpty()) WidgetRenderer.iconBitmap(icons, photoId) else null
        val icon: View = when {
            photo != null -> {
                val iv = ImageView(this)
                iv.setImageBitmap(photo)
                iv.scaleType = ImageView.ScaleType.FIT_CENTER
                iv
            }
            s.optInt("p", 0) == 1 -> PillView(this, parse(s.optString("c", ""), 0xFF7E57C2.toInt()), s.optString("h", "caps"), total, n)
            else -> {
                val t = tv(s.optString("e", "⭐"), 24f, Color.BLACK)
                t.gravity = Gravity.CENTER
                t
            }
        }
        row.addView(icon, LinearLayout.LayoutParams(dp(34), dp(34)))
        val name = tv(s.optString("nm", "스티커"), 17f, pal.fg)
        val nlp = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        nlp.leftMargin = dp(12)
        row.addView(name, nlp)
        val cnt = tv(if (total > 1) "$n/$total" else if (n > 0) "✓" else "○", 19f, if (n >= total) pal.accent else pal.sub, true)
        row.addView(cnt)
        row.setOnClickListener { toggleSticker(s.optString("id")) }
        val lp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        lp.bottomMargin = dp(6)
        row.layoutParams = lp
        return row
    }

    private fun memoRow(m: JSONObject, pal: Pal): View {
        val kind = m.optString("r", "t")
        val done = m.optBoolean("d", false)
        val checkable = kind == "m" || kind == "l"
        val row = LinearLayout(this)
        row.orientation = LinearLayout.HORIZONTAL
        row.gravity = Gravity.CENTER_VERTICAL
        row.setPadding(dp(12), dp(10), dp(12), dp(10))
        row.background = rounded(if (checkable && done) pal.done else pal.chip, 14)
        val cc = m.optString("c", "")
        if (cc.isNotEmpty()) {   // 메모 색: 왼쪽 띠
            val bar = View(this)
            bar.background = rounded(parse(cc, pal.sub), 3)
            val blp = LinearLayout.LayoutParams(dp(5), dp(34))
            blp.rightMargin = dp(10)
            row.addView(bar, blp)
        }
        if (checkable) {
            val box = tv(if (done) "☑" else "☐", 22f, if (done) pal.accent else pal.sub, true)
            val blp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
            blp.rightMargin = dp(10)
            row.addView(box, blp)
        }
        val col = LinearLayout(this)
        col.orientation = LinearLayout.VERTICAL
        val t = tv(rich(m.optString("t", ""), pal.fg, pal.link), 16f, if (checkable && done) pal.sub else pal.fg)
        if (checkable && done) t.paintFlags = t.paintFlags or Paint.STRIKE_THRU_TEXT_FLAG
        col.addView(t)
        val sub = (if (m.optInt("f", 0) == 1) "♥ 가족 메모" else "") +
            (if (m.optString("tm", "").isNotEmpty()) (if (m.optInt("f", 0) == 1) " · " else "") + "🕐 " + m.optString("tm", "") else "")
        if (sub.isNotEmpty()) col.addView(tv(sub, 12.5f, pal.sub))
        row.addView(col, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        if (checkable) row.setOnClickListener { toggleMemo(m) }
        val lp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        lp.bottomMargin = dp(6)
        row.layoutParams = lp
        return row
    }

    private fun toggleSticker(id: String) {
        val d = data ?: return
        val day = findDay(d) ?: return
        var newN = 0
        for (ln in arrayOf("sa", "stk")) {
            val arr = day.optJSONArray(ln) ?: continue
            for (j in 0 until arr.length()) {
                val s = arr.optJSONObject(j) ?: continue
                if (s.optString("id") != id) continue
                val total = Math.max(1, s.optInt("N", 1))
                val n = s.optInt("n", 0)
                // 한 번짜리: 완료 ↔ 취소 · 여러 번: 누를 때마다 +1, 다 채우고 누르면 0
                val nn = if (total <= 1) (if (n > 0) 0 else 1) else (if (n < total) n + 1 else 0)
                s.put("n", nn)
                newN = nn
            }
        }
        WidgetStore.save(this, d.toString())
        WidgetStore.addAction(this, JSONObject().put("t", "stk").put("k", key).put("id", id).put("n", newN))
        WidgetRefresher.refreshAll(this)
        build()
    }

    private fun toggleMemo(m: JSONObject) {
        val d = data ?: return
        val nd = !m.optBoolean("d", false)
        m.put("d", nd)
        WidgetStore.save(this, d.toString())
        val a = JSONObject().put("k", key).put("d", nd)
        if (m.optString("r") == "l") a.put("t", "line").put("pid", m.optString("pid")).put("lid", m.optString("lid"))
        else a.put("t", "memo").put("id", m.optString("id"))
        WidgetStore.addAction(this, a)
        WidgetRefresher.refreshAll(this)
        build()
    }

    /** 알약 스티커 (앱과 같은 모양 · 횟수만큼 조각 · 한 만큼 채움) */
    private class PillView(ctx: Context, private val color: Int, private val shape: String, private val total: Int, private val done: Int) : View(ctx) {
        override fun onDraw(c: Canvas) {
            val sz = Math.min(width, height).toFloat()
            PillDraw.draw(c, width / 2f, height / 2f, sz, color, shape, total, done)
        }
    }
}
