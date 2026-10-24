package com.eonjeswieo.app

import android.app.Activity
import android.app.AlertDialog
import android.net.Uri
import android.text.TextPaint
import android.text.style.ClickableSpan
import android.view.MotionEvent
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
    private var who = ""   // 한 달 위젯에서 이름 칩으로 가족 달력을 보다가 눌렀으면 그 사람의 표시 (비어 있으면 내 달력)
    private var person: JSONObject? = null
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

    /** \u0001 주소 \u0003 글자 \u0002 → 글자만 파랗게 + 밑줄 + 누르면 주소 열기 */
    private fun rich(text: String, fg: Int, link: Int, onUrl: (String) -> Unit): CharSequence {
        val sb = StringBuilder()
        val spans = ArrayList<Array<Any>>()
        val url = StringBuilder()
        var mode = 0
        var start = 0
        for (ch in text) {
            if (ch == '\u0001') {
                mode = 1
                url.setLength(0)
            } else if (ch == '\u0003' && mode == 1) {
                mode = 2
                start = sb.length
            } else if (ch == '\u0002') {
                if (mode == 2 && sb.length > start) spans.add(arrayOf<Any>(start, sb.length, url.toString()))
                mode = 0
            } else if (mode == 1) {
                url.append(ch)
            } else {
                sb.append(ch)
            }
        }
        val out = SpannableString(sb.toString())
        for (sp in spans) {
            val u = sp[2] as String
            val span = object : ClickableSpan() {
                override fun onClick(widget: View) {
                    onUrl(u)
                }

                override fun updateDrawState(ds: TextPaint) {
                    ds.color = link
                    ds.isUnderlineText = true
                }
            }
            out.setSpan(span, sp[0] as Int, sp[1] as Int, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }
        return out
    }

    /** 누른 자리에 링크가 있으면 그 링크 */
    private fun linkAt(tv: TextView, ev: MotionEvent): ClickableSpan? {
        val text = tv.text as? Spanned ?: return null
        val layout = tv.layout ?: return null
        val loc = IntArray(2)
        tv.getLocationOnScreen(loc)
        val x = (ev.rawX - loc[0] - tv.totalPaddingLeft + tv.scrollX).toInt()
        val y = (ev.rawY - loc[1] - tv.totalPaddingTop + tv.scrollY).toInt()
        if (y < 0 || y > layout.height) return null
        val line = layout.getLineForVertical(y)
        if (x < layout.getLineLeft(line) || x > layout.getLineRight(line)) return null
        val off = layout.getOffsetForHorizontal(line, x.toFloat())
        return text.getSpans(off, off, ClickableSpan::class.java).firstOrNull()
    }

    /** 주소 열기 (가족이 보낸 메모의 링크는 앱처럼 한 번 물어봄) */
    private fun openUrl(url: String, fromFamily: Boolean) {
        if (!url.startsWith("http://") && !url.startsWith("https://")) return
        val go = {
            try {
                val it2 = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                it2.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(it2)
            } catch (e: Exception) {
                // 열 수 있는 앱이 없으면 그냥 둠
            }
        }
        if (!fromFamily) {
            go()
            return
        }
        val host = try {
            Uri.parse(url).host ?: url
        } catch (e: Exception) {
            url
        }
        AlertDialog.Builder(this)
            .setTitle("링크 열기")
            .setMessage(host + "\n\n가족이 보낸 메모의 링크예요. 아는 주소일 때만 열어요.")
            .setPositiveButton("열기") { _, _ -> go() }
            .setNegativeButton("취소", null)
            .show()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        key = intent.getStringExtra("k") ?: ""
        who = intent.getStringExtra("who") ?: ""
        build(0)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        key = intent.getStringExtra("k") ?: key
        who = intent.getStringExtra("who") ?: ""
        build(0)
    }

    private fun findDay(d: JSONObject?): JSONObject? {
        val arr = d?.optJSONArray("days") ?: return null
        for (i in 0 until arr.length()) {
            val x = arr.optJSONObject(i) ?: continue
            if (x.optString("k") == key) return x
        }
        return null
    }

    /** 위젯 데이터에서 이 날짜가 몇 번째인지 (가족 달력의 근무 · 스티커가 같은 순서로 들어 있음) */
    private fun indexOfKey(d: JSONObject?): Int {
        val arr = d?.optJSONArray("days") ?: return -1
        for (i in 0 until arr.length()) {
            if (arr.optJSONObject(i)?.optString("k", "") == key) return i
        }
        return -1
    }

    /** 위젯이 가진 날짜들(앞에서부터 날짜순) */
    private fun dayKeys(d: JSONObject?): List<String> {
        val arr = d?.optJSONArray("days") ?: return emptyList()
        val out = ArrayList<String>()
        for (i in 0 until arr.length()) {
            val k = arr.optJSONObject(i)?.optString("k", "") ?: ""
            if (k.isNotEmpty()) out.add(k)
        }
        return out
    }

    /** 앞뒤 날짜로 이동: dir -1 = 전날 · +1 = 다음 날 (위젯이 가진 범위 밖이면 가만히) */
    private fun step(dir: Int) {
        val keys = dayKeys(data)
        val i = keys.indexOf(key)
        if (i < 0) return
        val j = i + dir
        if (j < 0 || j >= keys.size) return
        key = keys[j]
        build(dir)
    }

    private fun arrow(label: String, desc: String, enabled: Boolean, pal: Pal, dir: Int): TextView {
        val t = tv(label, 26f, pal.sub, true)
        t.gravity = Gravity.CENTER
        t.contentDescription = desc
        t.minimumWidth = dp(44)
        t.minimumHeight = dp(48)
        t.alpha = if (enabled) 1f else 0.25f
        if (enabled) t.setOnClickListener { step(dir) } else t.isClickable = false
        return t
    }

    // 좌우로 확실히 민 경우만 날짜 이동 (왼쪽으로 밀면 다음 날 · 앱 달력과 같은 방향). 세로 스크롤 · 링크 누르기와 안 겹치게 가로가 세로의 2배 넘을 때만
    private var swX = 0f
    private var swY = 0f
    private var swiping = false

    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        when (ev.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                swX = ev.rawX
                swY = ev.rawY
                swiping = false
            }
            MotionEvent.ACTION_MOVE -> if (!swiping) {
                val dx = ev.rawX - swX
                val dy = ev.rawY - swY
                if (Math.abs(dx) > dp(64) && Math.abs(dx) > Math.abs(dy) * 2f) {
                    swiping = true
                    val c = MotionEvent.obtain(ev)
                    c.action = MotionEvent.ACTION_CANCEL
                    super.dispatchTouchEvent(c)   // 아래 칸(체크 · 링크)이 누름으로 받지 않게 취소
                    c.recycle()
                    step(if (dx < 0) 1 else -1)
                    return true
                }
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> if (swiping) {
                swiping = false
                return true
            }
        }
        if (swiping) return true
        return super.dispatchTouchEvent(ev)
    }

    private fun build(dir: Int) {
        data = WidgetStore.load(this)
        person = if (who.isEmpty()) null else MonthRenderer.people(data).firstOrNull { MonthRenderer.personKey(it) == who }   // 그 사람이 없어졌으면 내 달력
        val pj = person
        val pal = palette()
        val day = findDay(data)

        val frame = FrameLayout(this)
        frame.setOnClickListener { finish() }

        val card = LinearLayout(this)
        card.orientation = LinearLayout.VERTICAL
        card.background = rounded(pal.bg, 22)
        card.setPadding(0, 0, 0, dp(12))
        card.isClickable = true
        card.clipToOutline = true
        val dark = pal.bg != 0xFFFFFFFF.toInt()

        if (day == null) {
            val t = tv("앱을 열어 주세요", 16f, pal.sub)
            t.setPadding(dp(18), dp(16), dp(18), 0)
            card.addView(t)
        } else {
            // 위쪽(날짜 · 근무 · 명절)은 그날 근무의 파스텔 색 바탕 — 앱 알람 카드와 같은 느낌 (휴무 · 색 없는 날은 흰 바탕)
            val topBox = LinearLayout(this)
            topBox.orientation = LinearLayout.VERTICAL
            topBox.setPadding(dp(18), dp(14), dp(18), dp(12))
            val dow = arrayOf("일", "월", "화", "수", "목", "금", "토")
            val w = day.optInt("w", 0).coerceIn(0, 6)
            val hol = day.optString("hol", "")
            val dateColor = if (hol.isNotEmpty() || w == 0) 0xFFD6334A.toInt() else pal.fg
            val head = LinearLayout(this)
            head.orientation = LinearLayout.HORIZONTAL
            head.gravity = Gravity.CENTER_VERTICAL
            val keys = dayKeys(data)
            val at = keys.indexOf(key)
            head.addView(arrow("‹", "전날", at > 0, pal, -1))
            val title = tv(day.optInt("m").toString() + "월 " + day.optInt("d") + "일 (" + dow[w] + ")", if (resources.configuration.screenWidthDp < 360) 17f else 20f, dateColor, true)
            title.maxLines = 1
            head.addView(title)
            // 오늘 · 어제 · 내일 알약
            val rel = try {
                val f = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.KOREA)
                val t0 = f.parse(f.format(java.util.Date()))!!.time
                val d0 = f.parse(key)!!.time
                when (Math.round((d0 - t0) / 86_400_000.0)) { 0L -> "오늘"; -1L -> "어제"; 1L -> "내일"; else -> "" }
            } catch (e: Exception) { "" }
            if (rel.isNotEmpty()) {
                val chipT = tv(rel, 12.5f, if (rel == "오늘") Color.WHITE else pal.fg, true)
                chipT.setPadding(dp(9), dp(2), dp(9), dp(3))
                chipT.background = rounded(if (rel == "오늘") pal.accent else (if (dark) 0x33FFFFFF else 0xB3FFFFFF.toInt()), 12)
                val cl = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
                cl.leftMargin = dp(6)
                head.addView(chipT, cl)
            }
            head.addView(arrow("›", "다음 날", at >= 0 && at < keys.size - 1, pal, 1))
            head.addView(View(this), LinearLayout.LayoutParams(0, 1, 1f))
            var wk = day.optString("t", "")
            var wbg = day.optString("bg", "")
            var wfg = day.optString("fg", "")
            if (pj != null) {   // 가족 달력: 그 사람의 근무 (앱 가족 탭과 같은 글자 · 색)
                wk = ""
                wbg = ""
                wfg = ""
                val sKey = pj.optJSONArray("s")?.optString(indexOfKey(data), "") ?: ""
                val leg = if (sKey.isNotEmpty()) pj.optJSONObject("t")?.optJSONArray(sKey) else null
                if (leg != null) {
                    wk = sKey
                    if (leg.length() >= 2) {
                        wbg = leg.optString(0, "")
                        wfg = leg.optString(1, "")
                    }
                }
            }
            if (wk.isNotEmpty()) {
                val badge = tv(wk, 16f, if (wbg.isEmpty()) 0xFFE5484D.toInt() else parse(wfg, pal.fg), true)
                badge.gravity = Gravity.CENTER
                if (wbg.isNotEmpty()) badge.background = rounded(parse(wbg, pal.chip), 40)
                head.addView(badge, LinearLayout.LayoutParams(dp(40), dp(40)))
            }
            topBox.addView(head)
            // 근무 시간을 정해 뒀으면 "주간 06:00~18:00"
            val wt = if (pj != null) "" else day.optString("wt", "")
            if (wt.isNotEmpty()) {
                val wl = tv(day.optString("wn", wk) + "  " + wt, 14f, pal.fg, true)
                wl.alpha = 0.8f
                wl.setPadding(dp(4), dp(2), 0, 0)
                topBox.addView(wl)
            }
            if (pj != null) topBox.addView(tv("● " + pj.optString("n", "가족") + " 달력 · 보기만 해요", 13f, parse(pj.optString("c", ""), pal.sub), true))
            if (hol.isNotEmpty()) {   // 명절: 달력처럼 연분홍 띠 + 장미빛 굵은 이름
                val hb = tv(hol, 15f, if (dark) 0xFFE49AAA.toInt() else 0xFFC8627A.toInt(), true)
                hb.setPadding(dp(10), dp(4), dp(10), dp(5))
                hb.background = rounded(if (dark) 0xFF3A2429.toInt() else 0xFFFCEBEE.toInt(), 10)
                val hl = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
                hl.topMargin = dp(6)
                topBox.addView(hb, hl)
            }
            val chn = if (pj != null) "" else day.optString("ch", "")
            if (chn.isNotEmpty()) topBox.addView(tv("회사 휴무 · " + chn, 13f, pal.link))
            val an = if (pj != null) null else day.optJSONArray("an")
            if (an != null) {
                for (i in 0 until an.length()) {
                    val t = an.optString(i, "")
                    if (t.isNotEmpty()) topBox.addView(tv(t, 13f, pal.sub))
                }
            }
            if (wbg.isNotEmpty()) {   // 근무 색 바탕(연하게) · 위 모서리만 둥글게
                val bgc = parse(wbg, pal.chip)
                val mixT = if (dark) 0.30f else 0.32f
                val tint = Color.rgb(Math.round(Color.red(bgc) * mixT + Color.red(pal.bg) * (1 - mixT)), Math.round(Color.green(bgc) * mixT + Color.green(pal.bg) * (1 - mixT)), Math.round(Color.blue(bgc) * mixT + Color.blue(pal.bg) * (1 - mixT)))
                val g = GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, intArrayOf(tint, pal.bg))
                val r = dp(22).toFloat()
                g.cornerRadii = floatArrayOf(r, r, r, r, 0f, 0f, 0f, 0f)
                topBox.background = g
            }
            card.addView(topBox)

            val content = LinearLayout(this)
            content.orientation = LinearLayout.VERTICAL

            val far = day.optInt("far", 0)   // 0 = 자세히(앞 6일 ~ 뒤 14일) · 1 = 먼 앞날 · 2 = 지난 날
            if (pj == null) wlRowView(day, pal)?.let { content.addView(it) }   // 업무 일지 줄(표시만 · 내 달력일 때만) → 누르면 앱 일지 팝업
            if (pj != null) {
                // 가족 달력: 그 사람이 공유한 스티커 · 가족 메모(♥)만 — 보기만 (체크는 못 함)
                val ps = pj.optJSONObject("k")?.optJSONArray(key)
                val fm = day.optJSONArray("fm")
                if (ps != null && ps.length() > 0) {
                    content.addView(sectionTitle("스티커", pal))
                    for (i in 0 until ps.length()) {
                        val s = ps.optJSONObject(i) ?: continue
                        content.addView(stickerRow(s, pal, true))
                    }
                }
                if (fm != null && fm.length() > 0) {
                    content.addView(sectionTitle("가족 메모", pal))
                    for (i in 0 until fm.length()) {
                        val t = fm.optString(i, "")
                        if (t.isNotEmpty()) content.addView(memoRow(JSONObject().put("r", "t").put("t", t).put("f", 1).put("o", 1), pal))
                    }
                }

            } else if (far != 0) {
                // 먼 날: 달력 칸에 싣는 것만 (스티커 두 개 · 메모 세 줄) — 보기만, 더 자세한 건 앱에서
                val stk = day.optJSONArray("stk")
                val ms = day.optJSONArray("ms")
                if (stk != null && stk.length() > 0) {
                    content.addView(sectionTitle("스티커", pal))
                    for (i in 0 until stk.length()) {
                        val s = stk.optJSONObject(i) ?: continue
                        content.addView(stickerRow(s, pal, true))
                    }
                }
                if (ms != null && ms.length() > 0) {
                    content.addView(sectionTitle("메모", pal))
                    for (i in 0 until ms.length()) {
                        val t = ms.optString(i, "")
                        if (t.isNotEmpty()) content.addView(memoRow(JSONObject().put("r", "t").put("t", t), pal))
                    }
                }

            } else {
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

            }
            val maxH = (resources.displayMetrics.heightPixels * 0.6f).toInt()
            val scroll = object : ScrollView(this) {
                override fun onMeasure(widthSpec: Int, heightSpec: Int) {
                    super.onMeasure(widthSpec, View.MeasureSpec.makeMeasureSpec(maxH, View.MeasureSpec.AT_MOST))
                }
            }
            content.setPadding(dp(18), 0, dp(18), 0)
            scroll.addView(content)
            if (content.childCount > 0) card.addView(scroll, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        }

        // 아래 버튼: 앱에서 열기 / 닫기
        val bar = LinearLayout(this)
        bar.orientation = LinearLayout.HORIZONTAL
        bar.gravity = Gravity.END or Gravity.CENTER_VERTICAL
        bar.setPadding(dp(18), dp(8), dp(18), 0)
        val close = tv("닫기", 15f, pal.sub, true)
        close.setPadding(dp(14), dp(12), dp(14), dp(8))
        close.setOnClickListener { finish() }
        val open = tv("앱에서 열기", 15f, if (pal.bg != 0xFFFFFFFF.toInt()) 0xFFD2DAF6.toInt() else 0xFF2E4D8F.toInt(), true)
        open.setPadding(dp(16), dp(9), dp(16), dp(10))
        open.background = rounded(if (pal.bg != 0xFFFFFFFF.toInt()) 0xFF3A4262.toInt() else 0xFFDDE7F8.toInt(), 20)   // 둥근 파스텔 버튼
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
        if (dir != 0) {   // 옆 날로 넘어갈 때 살짝 밀려 들어옴 (애니메이션을 끈 폰에서는 바로)
            card.alpha = 0f
            card.translationX = dir * dp(36).toFloat()
            card.animate().alpha(1f).translationX(0f).setDuration(150).start()
        }
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

    private fun stickerRow(s: JSONObject, pal: Pal, readOnly: Boolean = false): View {
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
        val name = tv(s.optString("nm", if (readOnly) "" else "스티커"), 17f, pal.fg)   // (가족이 공유한 스티커는 이름 없이 모양만 옴)
        val nlp = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        nlp.leftMargin = dp(12)
        row.addView(name, nlp)
        if (s.optInt("b", 0) == 1) {   // 알림 시각을 정해 둔 스티커: 횟수 왼쪽에 🔔 (앱 설정 · 날짜 창의 🔔 표시와 같은 기준 · 알림이 없으면 아무것도 안 붙음)
            val bell = tv("🔔", 15f, pal.sub)
            bell.contentDescription = "알림 있음"
            val blp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
            blp.leftMargin = dp(6)
            blp.rightMargin = dp(10)
            row.addView(bell, blp)
        }
        val cnt = tv(if (total > 1) "$n/$total" else if (n > 0) "✓" else "○", 19f, if (n >= total) pal.accent else pal.sub, true)
        row.addView(cnt)
        if (!readOnly) row.setOnClickListener { toggleSticker(s.optString("id")) }
        val lp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        lp.bottomMargin = dp(6)
        row.layoutParams = lp
        return row
    }

    /** 업무 일지가 있는 날: "📋 이름 / 인계 2 · 특이 1 ›" 줄 (글 내용은 안 보냄 · 회사 보안) → 누르면 앱이 그 날짜 + 일지 팝업으로 */
    private fun wlRowView(day: JSONObject, pal: Pal): View? {
        val w = day.optJSONObject("wlr") ?: return null
        val name = w.optString("n", "")
        if (name.isEmpty()) return null
        val dark = pal.bg != 0xFFFFFFFF.toInt()
        val row = LinearLayout(this)
        row.orientation = LinearLayout.HORIZONTAL
        row.gravity = Gravity.CENTER_VERTICAL
        row.setPadding(dp(12), dp(12), dp(14), dp(12))
        row.background = rounded(if (dark) 0xFF2C2A48.toInt() else 0xFFEFECFB.toInt(), 16)
        val ic = tv("📋", 18f, pal.fg, false)
        val ilp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        ilp.rightMargin = dp(10)
        row.addView(ic, ilp)
        val col = LinearLayout(this)
        col.orientation = LinearLayout.VERTICAL
        col.addView(tv(name, 16f, if (dark) 0xFFCFC6FA.toInt() else 0xFF4A3F9A.toInt(), true))
        val c = w.optString("c", "")
        if (c.isNotEmpty()) col.addView(tv(c, 12.5f, if (dark) 0xFFA99FE0.toInt() else 0xFF7A70B8.toInt(), true))
        row.addView(col, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        row.addView(tv("›", 20f, if (dark) 0xFFA99FE0.toInt() else 0xFF8A7FD0.toInt(), true))
        val key = day.optString("k", "")
        row.setOnClickListener {
            val go = Intent(this, MainActivity::class.java)
            go.putExtra("openDate", "$key#wl")
            go.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            startActivity(go)
            finish()
        }
        val lp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        lp.bottomMargin = dp(10)
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
        val fromFamily = m.optInt("o", 0) == 1
        val t = tv(rich(m.optString("t", ""), pal.fg, pal.link) { u -> openUrl(u, fromFamily) }, 16f, if (checkable && done) pal.sub else pal.fg)
        if (checkable && done) t.paintFlags = t.paintFlags or Paint.STRIKE_THRU_TEXT_FLAG
        col.addView(t)
        val sub = (if (m.optInt("f", 0) == 1) "♥ 가족 메모" else "") +
            (if (m.optString("tm", "").isNotEmpty()) (if (m.optInt("f", 0) == 1) " · " else "") + "🕐 " + m.optString("tm", "") else "")
        if (sub.isNotEmpty()) col.addView(tv(sub, 12.5f, pal.sub))
        row.addView(col, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        // 링크 위를 누르면 주소 열기, 아니면(체크할 수 있는 줄이면) 완료/취소
        row.setOnTouchListener { _, ev ->
            if (ev.action == MotionEvent.ACTION_UP) {
                val span = linkAt(t, ev)
                if (span != null) span.onClick(t) else if (checkable) toggleMemo(m)
            }
            true
        }
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
        build(0)
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
        build(0)
    }

    /** 알약 스티커 (앱과 같은 모양 · 횟수만큼 조각 · 한 만큼 채움) */
    private class PillView(ctx: Context, private val color: Int, private val shape: String, private val total: Int, private val done: Int) : View(ctx) {
        override fun onDraw(c: Canvas) {
            val sz = Math.min(width, height).toFloat()
            PillDraw.draw(c, width / 2f, height / 2f, sz, color, shape, total, done)
        }
    }
}
