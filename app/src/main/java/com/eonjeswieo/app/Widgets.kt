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
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.os.Bundle
import android.text.TextPaint
import android.text.TextUtils
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
            drawCell(cv, d0, 0f, 0f, w, h, null, pal)
        } else {
            val alarm = nextAlarmText(ctx)
            val bottom = if (alarm.isEmpty()) 0f else h * 0.13f
            val ch = h - bottom
            val half = w / 2
            drawCell(cv, d0, 0f, 0f, half, ch, "오늘", pal)
            drawCell(cv, findDay(data, dateKey(tom)), half, 0f, half, ch, "내일", pal)
            val line = Paint(Paint.ANTI_ALIAS_FLAG)
            line.color = pal.line
            line.strokeWidth = 2f
            cv.drawLine(half, h * 0.08f, half, ch * 0.92f, line)
            if (alarm.isNotEmpty()) {
                val p = TextPaint(Paint.ANTI_ALIAS_FLAG)
                p.color = pal.sub
                p.textSize = h * 0.075f
                p.textAlign = Paint.Align.CENTER
                cv.drawText(TextUtils.ellipsize(alarm, p, w * 0.9f, TextUtils.TruncateAt.END).toString(), w / 2, h - h * 0.035f, p)
            }
        }
    }

    /** 한 날짜를 칸 하나(x0,y0,cw,ch)에 그린다 */
    private fun drawCell(cv: Canvas, d: JSONObject?, x0: Float, y0: Float, cw: Float, ch: Float, label: String?, pal: Pal) {
        if (d == null) return
        val cx = x0 + cw / 2
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG)
        paint.textAlign = Paint.Align.CENTER
        val dow = d.optInt("w", 0)
        val hol = d.optString("hol", "")
        val dateColor = if (hol.isNotEmpty() || dow == 0) pal.sun else if (dow == 6) pal.sat else pal.fg

        // 1) 날짜 (+ 공휴일 이름)
        val dateText = (if (label != null) label + " " else d.optInt("m").toString() + ".") + d.optInt("d") + "(" + DOW[dow.coerceIn(0, 6)] + ")"
        paint.typeface = Typeface.DEFAULT_BOLD
        paint.color = dateColor
        paint.textSize = Math.min(cw * 0.15f, ch * 0.13f)
        cv.drawText(TextUtils.ellipsize(dateText, paint, cw * 0.94f, TextUtils.TruncateAt.END).toString(), cx, y0 + ch * 0.15f, paint)
        if (hol.isNotEmpty()) {
            paint.typeface = Typeface.DEFAULT
            paint.textSize = Math.min(cw * 0.11f, ch * 0.09f)
            cv.drawText(TextUtils.ellipsize(hol, paint, cw * 0.94f, TextUtils.TruncateAt.END).toString(), cx, y0 + ch * 0.25f, paint)
        }

        val stk = d.optJSONArray("stk")
        val hasStk = stk != null && stk.length() > 0
        val memo = d.optString("memo", "")
        val hasMemo = memo.isNotEmpty()

        // 2) 근무 동그라미
        val rad = Math.min(cw * 0.22f, ch * 0.17f)
        val cyc = y0 + ch * (if (hasStk || hasMemo) 0.45f else 0.56f)
        val t = d.optString("t", "")
        if (t.isNotEmpty()) {
            val bg = d.optString("bg", "")
            paint.typeface = Typeface.DEFAULT_BOLD
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
        }

        // 3) 스티커 (최대 4개, 안 한 것은 연하게)
        if (hasStk) {
            val n = Math.min(stk!!.length(), 4)
            val sz = Math.min(ch * 0.15f, cw * 0.2f)
            val gap = sz * 0.25f
            val totalW = n * sz + (n - 1) * gap
            var sx = cx - totalW / 2
            val baseY = y0 + ch * (if (hasMemo) 0.76f else 0.80f)
            for (i in 0 until n) {
                val s = stk.optJSONObject(i) ?: continue
                val done = s.optInt("n", 0) > 0
                if (s.optInt("p", 0) == 1) {
                    val pp = Paint(Paint.ANTI_ALIAS_FLAG)
                    pp.color = parseColor(s.optString("c", ""), 0xFF7E57C2.toInt())
                    pp.alpha = if (done) 255 else 90
                    cv.drawRoundRect(RectF(sx, baseY - sz * 0.62f, sx + sz, baseY - sz * 0.14f), sz * 0.24f, sz * 0.24f, pp)
                } else {
                    paint.typeface = Typeface.DEFAULT
                    paint.textSize = sz * 0.9f
                    paint.color = Color.BLACK
                    paint.alpha = if (done) 255 else 100
                    cv.drawText(s.optString("e", "⭐"), sx + sz / 2, baseY, paint)
                    paint.alpha = 255
                }
                sx += sz + gap
            }
        }

        // 4) 메모 한 줄
        if (hasMemo) {
            val ph = ch * 0.13f
            val py = y0 + ch * 0.95f - ph
            val pad = cw * 0.06f
            val pp = Paint(Paint.ANTI_ALIAS_FLAG)
            pp.color = pal.pill
            cv.drawRoundRect(RectF(x0 + pad, py, x0 + cw - pad, py + ph), ph * 0.3f, ph * 0.3f, pp)
            paint.typeface = Typeface.DEFAULT
            paint.color = pal.fg
            paint.textSize = ph * 0.62f
            cv.drawText(TextUtils.ellipsize(memo, paint, cw - pad * 2.6f, TextUtils.TruncateAt.END).toString(), cx, py + ph * 0.7f, paint)
        }
    }
}
