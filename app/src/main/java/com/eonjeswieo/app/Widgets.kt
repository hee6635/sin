package com.eonjeswieo.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.os.Bundle
import android.text.TextPaint
import android.text.TextUtils
import android.util.Base64
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

/** 앱이 보내 준 위젯 데이터(JSON)를 폰에 저장 */
object WidgetStore {
    private const val PREFS = "widget_data"
    private const val KEY = "json"

    fun save(ctx: Context, json: String) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, json).apply()
    }

    fun load(ctx: Context): JSONObject? {
        val s = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null) ?: return null
        return try {
            JSONObject(s)
        } catch (e: Exception) {
            null
        }
    }
}

/** 놓인 위젯을 모두 다시 그리고, 자정에 한 번 더 그리도록 예약 */
object WidgetRefresher {
    private const val REQ_TICK = 4343

    fun refreshAll(ctx: Context) {
        val mgr = AppWidgetManager.getInstance(ctx)
        for (id in mgr.getAppWidgetIds(ComponentName(ctx, TodayWidget1Provider::class.java))) {
            WidgetRenderer.update(ctx, mgr, id, 1)
        }
        for (id in mgr.getAppWidgetIds(ComponentName(ctx, TodayWidget2Provider::class.java))) {
            WidgetRenderer.update(ctx, mgr, id, 2)
        }
    }

    fun scheduleTick(ctx: Context) {
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, 1)
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 5)
        cal.set(Calendar.MILLISECOND, 0)
        val pi = PendingIntent.getBroadcast(
            ctx, REQ_TICK, Intent(ctx, WidgetTickReceiver::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        am.set(AlarmManager.RTC, cal.timeInMillis, pi)
    }
}

/** 자정(또는 예약 시각)에 위젯 날짜를 넘김 */
class WidgetTickReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        WidgetRefresher.refreshAll(context)
        WidgetRefresher.scheduleTick(context)
    }
}

class TodayWidget1Provider : AppWidgetProvider() {
    override fun onUpdate(context: Context, mgr: AppWidgetManager, ids: IntArray) {
        for (id in ids) WidgetRenderer.update(context, mgr, id, 1)
        WidgetRefresher.scheduleTick(context)
    }

    override fun onAppWidgetOptionsChanged(context: Context, mgr: AppWidgetManager, id: Int, newOptions: Bundle) {
        WidgetRenderer.update(context, mgr, id, 1)
    }

    override fun onEnabled(context: Context) {
        WidgetRefresher.scheduleTick(context)
    }
}

class TodayWidget2Provider : AppWidgetProvider() {
    override fun onUpdate(context: Context, mgr: AppWidgetManager, ids: IntArray) {
        for (id in ids) WidgetRenderer.update(context, mgr, id, 2)
        WidgetRefresher.scheduleTick(context)
    }

    override fun onAppWidgetOptionsChanged(context: Context, mgr: AppWidgetManager, id: Int, newOptions: Bundle) {
        WidgetRenderer.update(context, mgr, id, 2)
    }

    override fun onEnabled(context: Context) {
        WidgetRefresher.scheduleTick(context)
    }
}

/**
 * 위젯 그림을 직접 그려서(비트맵) 붙인다. 달력 칸과 같은 짜임:
 * 날짜(+공휴일 이름) → 근무 동그라미 → 스티커 → 메모 한 줄.
 */
object WidgetRenderer {
    private class Pal(val bg: Int, val fg: Int, val sub: Int, val pill: Int, val sun: Int, val sat: Int, val line: Int)

    private val LIGHT = Pal(
        0xFFFFFFFF.toInt(), 0xFF1F2328.toInt(), 0xFF8A919A.toInt(), 0xFFEAECEF.toInt(),
        0xFFD6334A.toInt(), 0xFF3B6FD6.toInt(), 0xFFE3E5E8.toInt()
    )
    private val DARK = Pal(
        0xFF23282E.toInt(), 0xFFF2F4F7.toInt(), 0xFF9AA3AD.toInt(), 0xFF39414A.toInt(),
        0xFFFF6B7F.toInt(), 0xFF7BA2FF.toInt(), 0xFF3A424B.toInt()
    )
    private val iconCache = HashMap<String, Bitmap?>()
    private var dens = 3f   // 화면 밀도 (dp 계산용)

    /** 사진 스티커: 앱이 data URL(base64)로 보내 준 작은 그림을 비트맵으로 (한 번 풀어서 기억) */
    private fun iconBitmap(icons: JSONObject?, id: String): Bitmap? {
        val src = icons?.optString(id, "") ?: ""
        if (src.isEmpty()) return null
        val key = id + ":" + src.length
        if (iconCache.containsKey(key)) return iconCache[key]
        var bmp: Bitmap? = null
        try {
            val b64 = src.substringAfter(",", "")
            val bytes = Base64.decode(b64, Base64.DEFAULT)
            bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
        } catch (e: Exception) {
            bmp = null
        }
        if (iconCache.size > 40) iconCache.clear()
        iconCache[key] = bmp
        return bmp
    }

    private val DOW = arrayOf("일", "월", "화", "수", "목", "금", "토")

    private fun dateKey(cal: Calendar): String =
        String.format("%04d-%02d-%02d", cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1, cal.get(Calendar.DAY_OF_MONTH))

    private fun parseColor(s: String, fallback: Int): Int =
        try {
            if (s.isEmpty()) fallback else Color.parseColor(s)
        } catch (e: Exception) {
            fallback
        }

    fun update(ctx: Context, mgr: AppWidgetManager, id: Int, count: Int) {
        try {
            val opts = mgr.getAppWidgetOptions(id)
            val density = ctx.resources.displayMetrics.density
            dens = density
            val wDp = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, if (count == 1) 70 else 140)
            val hDp = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, if (count == 1) 70 else 110)
            var w = (wDp * density).toInt().coerceAtLeast(120)
            var h = (hDp * density).toInt().coerceAtLeast(120)
            val maxPx = 700_000
            if (w * h > maxPx) {
                val f = Math.sqrt(maxPx.toDouble() / (w * h))
                w = (w * f).toInt()
                h = (h * f).toInt()
            }
            val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
            draw(ctx, Canvas(bmp), w.toFloat(), h.toFloat(), count)
            val rv = RemoteViews(ctx.packageName, R.layout.widget_view)
            rv.setImageViewBitmap(R.id.widget_img, bmp)
            val open = PendingIntent.getActivity(
                ctx, 0, Intent(ctx, MainActivity::class.java),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            rv.setOnClickPendingIntent(R.id.widget_root, open)
            mgr.updateAppWidget(id, rv)
        } catch (e: Exception) {
            // 그리기에 실패해도 앱이 죽지 않게
        }
    }

    private fun palette(ctx: Context, data: JSONObject?): Pal {
        val theme = data?.optString("theme", "system") ?: "system"
        val night = (ctx.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
        return if (theme == "dark" || (theme != "light" && night)) DARK else LIGHT
    }

    private fun findDay(data: JSONObject?, key: String): JSONObject? {
        val arr: JSONArray = data?.optJSONArray("days") ?: return null
        for (i in 0 until arr.length()) {
            val d = arr.optJSONObject(i) ?: continue
            if (d.optString("k") == key) return d
        }
        return null
    }

    private fun nextAlarmText(ctx: Context): String {
        val at = AlarmScheduler.nextAt(ctx)
        if (at <= 0L) return ""
        val now = Calendar.getInstance()
        val c = Calendar.getInstance()
        c.timeInMillis = at
        val tomorrow = Calendar.getInstance()
        tomorrow.add(Calendar.DAY_OF_YEAR, 1)
        val day = when (dateKey(c)) {
            dateKey(now) -> "오늘 "
            dateKey(tomorrow) -> "내일 "
            else -> "${c.get(Calendar.MONTH) + 1}/${c.get(Calendar.DAY_OF_MONTH)} "
        }
        val hr = c.get(Calendar.HOUR_OF_DAY)
        val ap = if (hr < 12) "오전" else "오후"
        val h12 = if (hr % 12 == 0) 12 else hr % 12
        return "⏰ 다음 알람 " + day + ap + " " + h12 + ":" + String.format("%02d", c.get(Calendar.MINUTE))
    }

    private fun draw(ctx: Context, cv: Canvas, w: Float, h: Float, count: Int) {
        val data = WidgetStore.load(ctx)
        val pal = palette(ctx, data)
        val alpha = ((data?.optInt("alpha", 100) ?: 100).coerceIn(0, 100) * 255 / 100)
        val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG)
        bgPaint.color = (pal.bg and 0x00FFFFFF) or (alpha shl 24)
        val r = Math.min(w, h) * 0.12f
        cv.drawRoundRect(RectF(0f, 0f, w, h), r, r, bgPaint)

        val icons = data?.optJSONObject("ic")
        val memoMax = (data?.optInt("lines", 3) ?: 3).coerceIn(1, 4)
        val today = Calendar.getInstance()
        val tom = Calendar.getInstance()
        tom.add(Calendar.DAY_OF_YEAR, 1)
        val d0 = findDay(data, dateKey(today))
        if (d0 == null) {
            val p = TextPaint(Paint.ANTI_ALIAS_FLAG)
            p.color = pal.sub
            p.textSize = Math.min(w, h) * 0.09f
            p.textAlign = Paint.Align.CENTER
            cv.drawText("앱을 열어 주세요", w / 2, h / 2, p)
            return
        }
        if (count == 1) {
            drawCell(cv, d0, 0f, 0f, w, h, null, pal, icons, memoMax, false, Float.NaN, Float.NaN)
        } else {
            val alarm = nextAlarmText(ctx)
            val bottom = if (alarm.isEmpty()) 0f else Math.max(h * 0.13f, 14f * dens)
            val ch = h - bottom
            val half = w / 2
            val d1 = findDay(data, dateKey(tom))
            // 두 칸의 근무 동그라미 높이를 맞추기 위해 위(날짜·스티커)와 아래(메모) 경계를 둘 중 더 많이 차지하는 쪽에 맞춤
            val m0 = measure(d0, half, ch, memoMax)
            val m1 = measure(d1, half, ch, memoMax)
            val bt = Math.max(m0[0], m1[0])
            val bb = Math.min(m0[1], m1[1])
            drawCell(cv, d0, 0f, 0f, half, ch, null, pal, icons, memoMax, true, bt, bb)
            drawCell(cv, d1, half, 0f, half, ch, null, pal, icons, memoMax, false, bt, bb)
            if (alarm.isNotEmpty()) {
                val p = TextPaint(Paint.ANTI_ALIAS_FLAG)
                p.color = pal.sub
                p.textSize = Math.min(bottom * 0.7f, 11f * dens)
                p.textAlign = Paint.Align.CENTER
                cv.drawText(TextUtils.ellipsize(alarm, p, w * 0.9f, TextUtils.TruncateAt.END).toString(), w / 2, h - bottom * 0.28f, p)
            }
        }
    }

    /** 칸 하나의 [날짜·스티커 줄이 끝나는 y, 메모가 시작하는 y] (그리기와 같은 계산) */
    private fun measure(d: JSONObject?, cw: Float, ch: Float, memoMax: Int): FloatArray {
        val rowH = Math.min(ch * 0.17f, cw * 0.2f)
        val rowTop = ch * 0.04f
        val sz = rowH * 0.85f
        val gap = sz * 0.18f
        val stk = d?.optJSONArray("stk")
        val n = if (stk == null) 0 else Math.min(stk.length(), 4)
        val cap = Math.max(1, Math.floor(((cw * 0.5f + gap) / (sz + gap)).toDouble()).toInt())
        val n2 = n - Math.min(n, cap)
        val hol = d?.optString("hol", "") ?: ""
        var topEnd = rowTop + rowH
        if (hol.isNotEmpty()) topEnd = rowTop + rowH * 1.55f else if (n2 > 0) topEnd = rowTop + rowH * 2.05f
        topEnd += ch * 0.02f
        var cnt = 0
        val ms = d?.optJSONArray("ms")
        if (ms != null) {
            for (i in 0 until ms.length()) if (ms.optString(i, "").isNotEmpty()) cnt++
        } else if ((d?.optString("memo", "") ?: "").isNotEmpty()) cnt = 1
        val ph = Math.min(ch * 0.135f, cw * 0.19f)
        val pg = ch * 0.012f
        val bottom = ch * 0.96f
        val room = bottom - topEnd - ch * 0.22f
        val fit = Math.max(1, Math.floor(((room + pg) / (ph + pg)).toDouble()).toInt())
        val ml = Math.min(cnt, Math.min(memoMax, fit))
        val memoTop = if (ml > 0) bottom - (ml * ph + (ml - 1) * pg) else bottom
        return floatArrayOf(topEnd, memoTop)
    }

    /** 한 날짜를 칸 하나(x0,y0,cw,ch)에 그린다: 앱 달력 칸과 같은 짜임 (날짜 + 스티커 한 줄 → 근무 동그라미 → 메모) */
    private fun drawCell(cv: Canvas, d: JSONObject?, x0: Float, y0: Float, cw: Float, ch: Float, label: String?, pal: Pal, icons: JSONObject?, memoMax: Int, isToday: Boolean, bandTop: Float, bandBottom: Float) {
        if (d == null) return
        if (isToday) {   // 달력의 오늘 칸처럼: 연한 초록 바탕 + 초록 테두리
            val inset = 2f * dens
            val box = RectF(x0 + inset, y0 + inset, x0 + cw - inset, y0 + ch - inset)
            val night = pal === DARK
            val f = Paint(Paint.ANTI_ALIAS_FLAG)
            f.color = if (night) 0xFF1E3A31.toInt() else 0xFFE3F5EF.toInt()
            cv.drawRoundRect(box, 8f * dens, 8f * dens, f)
            val st = Paint(Paint.ANTI_ALIAS_FLAG)
            st.style = Paint.Style.STROKE
            st.strokeWidth = 2f * dens
            st.color = 0xFF2A8C6F.toInt()
            cv.drawRoundRect(box, 8f * dens, 8f * dens, st)
        }
        val pad = cw * 0.06f
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG)
        val dow = d.optInt("w", 0).coerceIn(0, 6)
        val hol = d.optString("hol", "")
        val dateColor = if (hol.isNotEmpty() || dow == 0) pal.sun else if (dow == 6) pal.sat else pal.fg

        val rowH = Math.min(ch * 0.17f, cw * 0.2f)
        val rowTop = y0 + ch * 0.04f
        val sz = rowH * 0.85f
        val gap = sz * 0.18f

        // 스티커 (맨 윗줄 오른쪽, 자리가 모자라면 아래 줄)
        val stk = d.optJSONArray("stk")
        val n = if (stk == null) 0 else Math.min(stk.length(), 4)
        val cap = Math.max(1, Math.floor(((cw * 0.5f + gap) / (sz + gap)).toDouble()).toInt())
        val n1 = Math.min(n, cap)
        val n2 = n - n1
        val w1 = if (n1 > 0) n1 * sz + (n1 - 1) * gap else 0f
        val w2 = if (n2 > 0) n2 * sz + (n2 - 1) * gap else 0f
        for (i in 0 until n) {
            val s = stk!!.optJSONObject(i) ?: continue
            val inRow1 = i < n1
            val idx = if (inRow1) i else i - n1
            val rowW = if (inRow1) w1 else w2
            val sx = x0 + cw - pad - rowW + idx * (sz + gap)
            val sy = rowTop + (if (inRow1) 0f else rowH * 1.05f)
            drawSticker(cv, s, sx, sy, sz, paint, icons)
        }

        // 날짜 (왼쪽) — 스티커 자리를 빼고 남은 폭에 맞춤
        val dateText = (if (label != null) label + " " else "") + d.optInt("d") + "(" + DOW[dow] + ")"
        val availDate = cw - pad * 2 - (if (n1 > 0) w1 + gap else 0f)
        paint.typeface = Typeface.DEFAULT_BOLD
        paint.textAlign = Paint.Align.LEFT
        paint.color = dateColor
        paint.textSize = Math.min(rowH * 0.8f, cw * 0.15f)
        while (paint.measureText(dateText) > availDate && paint.textSize > rowH * 0.45f) paint.textSize = paint.textSize * 0.92f
        cv.drawText(TextUtils.ellipsize(dateText, paint, availDate, TextUtils.TruncateAt.END).toString(), x0 + pad, rowTop + rowH * 0.78f, paint)
        var topEnd = rowTop + rowH
        if (hol.isNotEmpty()) {
            paint.typeface = Typeface.DEFAULT
            paint.textSize = rowH * 0.5f
            val availHol = cw - pad * 2 - (if (n2 > 0) w2 + gap else 0f)
            cv.drawText(TextUtils.ellipsize(hol, paint, availHol, TextUtils.TruncateAt.END).toString(), x0 + pad, rowTop + rowH * 1.38f, paint)
            topEnd = rowTop + rowH * 1.55f
        } else if (n2 > 0) {
            topEnd = rowTop + rowH * 2.05f
        }
        topEnd += ch * 0.02f

        // 메모 (맨 아래, 칸이 세로로 길면 두 줄까지)
        val msArr = d.optJSONArray("ms")
        val memos = ArrayList<String>()
        if (msArr != null) {
            for (i in 0 until msArr.length()) {
                val t = msArr.optString(i, "")
                if (t.isNotEmpty()) memos.add(t)
            }
        } else {
            val one = d.optString("memo", "")
            if (one.isNotEmpty()) memos.add(one)
        }
        val ph = Math.min(ch * 0.135f, cw * 0.19f)
        val pg = ch * 0.012f
        val bottom = y0 + ch * 0.96f
        // 설정(3 · 4줄)만큼 보여주되, 근무 동그라미가 들어갈 자리(칸 높이의 0.22)는 남김
        val room = bottom - topEnd - ch * 0.22f
        val fit = Math.max(1, Math.floor(((room + pg) / (ph + pg)).toDouble()).toInt())
        val ml = Math.min(memos.size, Math.min(memoMax, fit))
        val memoTop = if (ml > 0) bottom - (ml * ph + (ml - 1) * pg) else bottom
        for (i in 0 until ml) {
            val py = memoTop + i * (ph + pg)
            val pp = Paint(Paint.ANTI_ALIAS_FLAG)
            pp.color = pal.pill
            cv.drawRoundRect(RectF(x0 + pad, py, x0 + cw - pad, py + ph), ph * 0.3f, ph * 0.3f, pp)
            paint.typeface = Typeface.DEFAULT
            paint.textAlign = Paint.Align.LEFT
            paint.color = pal.fg
            paint.textSize = Math.min(ph * 0.72f, cw * 0.11f)
            cv.drawText(TextUtils.ellipsize(memos[i], paint, cw - pad * 2.6f, TextUtils.TruncateAt.END).toString(), x0 + pad * 1.4f, py + ph * 0.72f, paint)
        }

        // 근무 동그라미: 위(날짜·스티커)와 아래(메모) 사이 한가운데
        val t = d.optString("t", "")
        if (t.isNotEmpty()) {
            val bt = if (bandTop.isNaN()) topEnd else Math.max(topEnd, bandTop + y0)
            val bb = if (bandBottom.isNaN()) memoTop else Math.min(memoTop, bandBottom + y0)
            val free = bb - bt
            val rad = Math.max(cw * 0.08f, Math.min(cw * 0.21f, Math.min(free * 0.42f, ch * 0.17f)))
            val cx = x0 + cw / 2
            val cyc = bt + free / 2
            val bg = d.optString("bg", "")
            paint.typeface = Typeface.DEFAULT_BOLD
            paint.textAlign = Paint.Align.CENTER
            paint.textSize = rad * 1.0f
            if (bg.isNotEmpty()) {
                val cp = Paint(Paint.ANTI_ALIAS_FLAG)
                cp.color = parseColor(bg, pal.pill)
                cv.drawCircle(cx, cyc, rad, cp)
                paint.color = parseColor(d.optString("fg", ""), pal.fg)
            } else {
                paint.color = 0xFFE5484D.toInt()   // 휴무: 색 없이 붉은 글자
            }
            cv.drawText(t, cx, cyc + rad * 0.36f, paint)
            if (d.optBoolean("ov", false)) {   // 근무를 바꾼 날: 왼쪽에 붉은 점
                val dp = Paint(Paint.ANTI_ALIAS_FLAG)
                dp.color = 0xFFE5322D.toInt()
                cv.drawCircle(x0 + pad * 1.6f, cyc, 3.2f * dens, dp)
            }
        }
    }

    /** 스티커 하나 (사진 · 이모티콘 · 알약). 안 한 것은 연하게 */
    private fun drawSticker(cv: Canvas, s: JSONObject, sx: Float, sy: Float, sz: Float, paint: TextPaint, icons: JSONObject?) {
        val done = s.optInt("n", 0) > 0
        val photoId = s.optString("i", "")
        val photo = if (photoId.isNotEmpty()) iconBitmap(icons, photoId) else null
        if (photo != null) {
            val ip = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
            ip.alpha = if (done) 255 else 100
            cv.drawBitmap(photo, null, RectF(sx, sy, sx + sz, sy + sz), ip)
        } else if (s.optInt("p", 0) == 1) {
            // 알약: 비스듬한 둥근 막대, 한 것은 반을 채움
            val col = parseColor(s.optString("c", ""), 0xFF7E57C2.toInt())
            val cx = sx + sz / 2
            val cy = sy + sz / 2
            val len = sz * 0.98f
            val thick = sz * 0.46f
            cv.save()
            cv.rotate(-45f, cx, cy)
            val rect = RectF(cx - len / 2, cy - thick / 2, cx + len / 2, cy + thick / 2)
            val stroke = Paint(Paint.ANTI_ALIAS_FLAG)
            stroke.style = Paint.Style.STROKE
            stroke.strokeWidth = sz * 0.1f
            stroke.color = col
            stroke.alpha = if (done) 255 else 120
            val fill = Paint(Paint.ANTI_ALIAS_FLAG)
            fill.color = col
            fill.alpha = if (done) 200 else 60
            cv.save()
            cv.clipRect(cx - len / 2, cy - thick, cx, cy + thick)
            cv.drawRoundRect(rect, thick / 2, thick / 2, fill)
            cv.restore()
            cv.drawRoundRect(rect, thick / 2, thick / 2, stroke)
            cv.restore()
        } else {
            paint.typeface = Typeface.DEFAULT
            paint.textAlign = Paint.Align.CENTER
            paint.textSize = sz * 0.9f
            paint.color = Color.BLACK
            paint.alpha = if (done) 255 else 100
            cv.drawText(s.optString("e", "⭐"), sx + sz / 2, sy + sz * 0.82f, paint)
            paint.alpha = 255
        }
    }
}
