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
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Typeface
import android.net.Uri
import android.view.View
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

    private const val KEY_ACT = "actions"

    /** 위젯 창에서 체크한 것(최종 상태)을 대기 목록에 적음 — 같은 항목은 마지막 것만 남김 */
    fun addAction(ctx: Context, a: JSONObject) {
        val sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val old = try {
            JSONArray(sp.getString(KEY_ACT, "[]"))
        } catch (e: Exception) {
            JSONArray()
        }
        val out = JSONArray()
        val sig = actionSig(a)
        for (i in 0 until old.length()) {
            val o = old.optJSONObject(i) ?: continue
            if (actionSig(o) != sig) out.put(o)
        }
        out.put(a)
        sp.edit().putString(KEY_ACT, out.toString()).apply()
    }

    private fun actionSig(a: JSONObject): String =
        a.optString("t") + "|" + a.optString("k") + "|" + a.optString("id") + "|" + a.optString("pid") + "|" + a.optString("lid")

    /** 앱이 열릴 때 가져가는 대기 목록 (가져가면 비움) */
    fun takeActions(ctx: Context): String {
        val sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val s = sp.getString(KEY_ACT, "[]") ?: "[]"
        sp.edit().remove(KEY_ACT).apply()
        return s
    }

    /** 앱이 새 데이터를 보내도, 아직 앱에 반영 안 된 위젯 체크는 그 위에 다시 입혀서 되돌아가 보이지 않게 */
    fun saveFromApp(ctx: Context, json: String) {
        var out = json
        try {
            val sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val acts = JSONArray(sp.getString(KEY_ACT, "[]"))
            if (acts.length() > 0) {
                val d = JSONObject(json)
                val days = d.optJSONArray("days")
                if (days != null) {
                    for (i in 0 until acts.length()) {
                        val a = acts.optJSONObject(i) ?: continue
                        for (j in 0 until days.length()) {
                            val day = days.optJSONObject(j) ?: continue
                            if (day.optString("k") != a.optString("k")) continue
                            when (a.optString("t")) {
                                "stk" -> for (ln in arrayOf("sa", "stk")) {
                                    val arr = day.optJSONArray(ln) ?: continue
                                    for (q in 0 until arr.length()) {
                                        val s = arr.optJSONObject(q) ?: continue
                                        if (s.optString("id") == a.optString("id")) s.put("n", a.optInt("n", 0))
                                    }
                                }
                                "memo", "line" -> {
                                    val arr = day.optJSONArray("mi") ?: continue
                                    for (q in 0 until arr.length()) {
                                        val m = arr.optJSONObject(q) ?: continue
                                        val hit = if (a.optString("t") == "memo") m.optString("r") == "m" && m.optString("id") == a.optString("id")
                                        else m.optString("r") == "l" && m.optString("pid") == a.optString("pid") && m.optString("lid") == a.optString("lid")
                                        if (hit) m.put("d", a.optBoolean("d", false))
                                    }
                                }
                            }
                        }
                    }
                    out = d.toString()
                }
            }
        } catch (e: Exception) {
            out = json
        }
        save(ctx, out)
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
        for (id in mgr.getAppWidgetIds(ComponentName(ctx, WeekWidgetProvider::class.java))) {
            WidgetRenderer.update(ctx, mgr, id, 7)
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

/** 7일 위젯: 이번 주(주 시작 요일부터 7일) */
class WeekWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, mgr: AppWidgetManager, ids: IntArray) {
        for (id in ids) WidgetRenderer.update(context, mgr, id, 7)
        WidgetRefresher.scheduleTick(context)
    }

    override fun onAppWidgetOptionsChanged(context: Context, mgr: AppWidgetManager, id: Int, newOptions: Bundle) {
        WidgetRenderer.update(context, mgr, id, 7)
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
    private class Pal(val bg: Int, val fg: Int, val sub: Int, val pill: Int, val sun: Int, val sat: Int, val line: Int, val link: Int)

    private val LIGHT = Pal(
        0xFFFFFFFF.toInt(), 0xFF1F2328.toInt(), 0xFF8A919A.toInt(), 0xFFEAECEF.toInt(),
        0xFFD6334A.toInt(), 0xFF3B6FD6.toInt(), 0xFFE3E5E8.toInt(), 0xFF2F6FDE.toInt()
    )
    private val DARK = Pal(
        0xFF23282E.toInt(), 0xFFF2F4F7.toInt(), 0xFF9AA3AD.toInt(), 0xFF39414A.toInt(),
        0xFFFF6B7F.toInt(), 0xFF7BA2FF.toInt(), 0xFF3A424B.toInt(), 0xFF7BA2FF.toInt()
    )
    private val iconCache = HashMap<String, Bitmap?>()
    private var dens = 3f   // 화면 밀도 (dp 계산용)

    /** 사진 스티커: 앱이 data URL(base64)로 보내 준 작은 그림을 비트맵으로 (한 번 풀어서 기억) */
    fun iconBitmap(icons: JSONObject?, id: String): Bitmap? {
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
            val wDp = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, if (count == 1) 70 else if (count == 7) 250 else 140)
            val hDp = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, if (count == 1) 70 else if (count == 7) 110 else 110)
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
            // 누르면 그 날짜의 큰 창: 1칸은 오늘, 2칸은 왼쪽 = 오늘 · 오른쪽 = 내일
            val tomCal = Calendar.getInstance()
            tomCal.add(Calendar.DAY_OF_YEAR, 1)
            fun dayPi(k: String, half: Int): PendingIntent {
                val it = Intent(ctx, WidgetDayActivity::class.java).putExtra("k", k)
                it.data = Uri.parse("eonjeswieo://widget/" + id + "/" + half)
                return PendingIntent.getActivity(
                    ctx, id * 10 + half, it,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            }
            if (count == 7) {
                rv.setViewVisibility(R.id.zones12, View.GONE)
                rv.setViewVisibility(R.id.zones7, View.VISIBLE)
                val ids7 = intArrayOf(R.id.zw0, R.id.zw1, R.id.zw2, R.id.zw3, R.id.zw4, R.id.zw5, R.id.zw6)
                val wk = weekKeys(WidgetStore.load(ctx))
                for (i in 0 until 7) rv.setOnClickPendingIntent(ids7[i], dayPi(wk[i], i))
            } else {
                rv.setViewVisibility(R.id.zones7, View.GONE)
                rv.setViewVisibility(R.id.zones12, View.VISIBLE)
                rv.setOnClickPendingIntent(R.id.zone_a, dayPi(dateKey(Calendar.getInstance()), 0))
                if (count == 2) {
                    rv.setViewVisibility(R.id.zone_b, View.VISIBLE)
                    rv.setOnClickPendingIntent(R.id.zone_b, dayPi(dateKey(tomCal), 1))
                } else {
                    rv.setViewVisibility(R.id.zone_b, View.GONE)
                }
            }
            mgr.updateAppWidget(id, rv)
        } catch (e: Exception) {
            // 그리기에 실패해도 앱이 죽지 않게
        }
    }

    /** 이번 주 7일의 날짜 키 (앱의 주 시작 요일: 0=일요일 · 1=월요일) */
    private fun weekKeys(data: JSONObject?): Array<String> {
        val ws = (data?.optInt("ws", 0) ?: 0).coerceIn(0, 1)
        val cal = Calendar.getInstance()
        val dow = cal.get(Calendar.DAY_OF_WEEK) - 1
        cal.add(Calendar.DAY_OF_YEAR, -((dow - ws + 7) % 7))
        return Array(7) {
            val s = dateKey(cal)
            cal.add(Calendar.DAY_OF_YEAR, 1)
            s
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
        if (count == 7) {
            drawWeek(cv, data, w, h, pal, icons, memoMax)
        } else if (count == 1) {
            drawCell(cv, d0, 0f, 0f, w, h, null, pal, icons, memoMax, false, Float.NaN, Float.NaN, false)
        } else {
            val alarm = nextAlarmText(ctx)
            val bottom = if (alarm.isEmpty()) 0f else Math.max(h * 0.13f, 14f * dens)
            val ch = h - bottom
            val half = w / 2
            val d1 = findDay(data, dateKey(tom))
            // 두 칸의 근무 동그라미 높이를 맞추기 위해 위(날짜·스티커)와 아래(메모) 경계를 둘 중 더 많이 차지하는 쪽에 맞춤
            val m0 = measure(d0, half, ch, memoMax, false)
            val m1 = measure(d1, half, ch, memoMax, false)
            val bt = Math.max(m0[0], m1[0])
            val bb = Math.min(m0[1], m1[1])
            drawCell(cv, d0, 0f, 0f, half, ch, null, pal, icons, memoMax, true, bt, bb, false)
            drawCell(cv, d1, half, 0f, half, ch, null, pal, icons, memoMax, false, bt, bb, false)
            if (alarm.isNotEmpty()) {
                val p = TextPaint(Paint.ANTI_ALIAS_FLAG)
                p.color = pal.sub
                p.textSize = Math.min(bottom * 0.7f, 11f * dens)
                p.textAlign = Paint.Align.CENTER
                cv.drawText(TextUtils.ellipsize(alarm, p, w * 0.9f, TextUtils.TruncateAt.END).toString(), w / 2, h - bottom * 0.28f, p)
            }
        }
    }

    /** 7일 위젯: 위에 요일 줄, 아래에 7칸(앱 달력 한 줄처럼). 오늘 칸은 초록 띠 */
    private fun drawWeek(cv: Canvas, data: JSONObject?, w: Float, h: Float, pal: Pal, icons: JSONObject?, memoMax: Int) {
        val ws = (data?.optInt("ws", 0) ?: 0).coerceIn(0, 1)
        val keys = weekKeys(data)
        val order = if (ws == 1) intArrayOf(1, 2, 3, 4, 5, 6, 0) else intArrayOf(0, 1, 2, 3, 4, 5, 6)
        val cw = w / 7
        val hh = Math.min(h * 0.13f, 17f * dens)
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG)
        paint.textAlign = Paint.Align.CENTER
        paint.typeface = Typeface.DEFAULT_BOLD
        paint.textSize = hh * 0.62f
        for (i in 0 until 7) {
            val wd = order[i]
            paint.color = if (wd == 0) pal.sun else if (wd == 6) pal.sat else pal.sub
            cv.drawText(DOW[wd], cw * i + cw / 2, hh * 0.78f, paint)
        }
        val ch = h - hh
        val days = Array<JSONObject?>(7) { findDay(data, keys[it]) }
        var bt = 0f
        var bb = Float.MAX_VALUE
        for (d in days) {
            val m = measure(d, cw, ch, memoMax, true)
            bt = Math.max(bt, m[0])
            bb = Math.min(bb, m[1])
        }
        val todayKey = dateKey(Calendar.getInstance())
        for (i in 0 until 7) {
            drawCell(cv, days[i], cw * i, hh, cw, ch, null, pal, icons, memoMax, keys[i] == todayKey, bt, bb, true)
        }
    }

    /** 칸 하나의 [날짜·스티커 줄이 끝나는 y, 메모가 시작하는 y] (그리기와 같은 계산) */
    private fun measure(d: JSONObject?, cw: Float, ch: Float, memoMax: Int, compact: Boolean): FloatArray {
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
        if (hol.isNotEmpty() && !compact) topEnd = rowTop + rowH * 1.55f else if (n2 > 0) topEnd = rowTop + rowH * 2.05f
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
    private fun drawCell(cv: Canvas, d: JSONObject?, x0: Float, y0: Float, cw: Float, ch: Float, label: String?, pal: Pal, icons: JSONObject?, memoMax: Int, isToday: Boolean, bandTop: Float, bandBottom: Float, compact: Boolean) {
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
        val dateText = if (compact) d.optInt("d").toString() else (if (label != null) label + " " else "") + d.optInt("d") + "(" + DOW[dow] + ")"
        val availDate = cw - pad * 2 - (if (n1 > 0) w1 + gap else 0f)
        paint.typeface = Typeface.DEFAULT_BOLD
        paint.textAlign = Paint.Align.LEFT
        paint.color = dateColor
        paint.textSize = Math.min(rowH * 0.8f, cw * 0.15f)
        while (paint.measureText(dateText) > availDate && paint.textSize > rowH * 0.45f) paint.textSize = paint.textSize * 0.92f
        cv.drawText(TextUtils.ellipsize(dateText, paint, availDate, TextUtils.TruncateAt.END).toString(), x0 + pad, rowTop + rowH * 0.78f, paint)
        var topEnd = rowTop + rowH
        if (hol.isNotEmpty() && !compact) {
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
            paint.textSize = Math.min(ph * 0.72f, cw * (if (compact) 0.2f else 0.11f))
            drawRich(cv, memos[i], x0 + pad * 1.4f, py + ph * 0.72f, cw - pad * 2.6f, paint, pal.fg, pal.link)
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

    /** 메모 한 줄: \u0001 주소 \u0003 글자 \u0002 (앱의 "링크")는 글자만 파랗게 + 밑줄, 폭을 넘으면 … 로 줄임 */
    private fun drawRich(cv: Canvas, text: String, x: Float, y: Float, maxW: Float, paint: TextPaint, fg: Int, link: Int) {
        val parts = ArrayList<Pair<String, Boolean>>()
        var cur = StringBuilder()
        var mode = 0   // 0 보통 · 1 주소(건너뜀) · 2 링크 글자
        for (ch in text) {
            if (ch == '\u0001') {
                if (cur.isNotEmpty()) parts.add(Pair(cur.toString(), false))
                cur = StringBuilder()
                mode = 1
            } else if (ch == '\u0003' && mode == 1) {
                cur = StringBuilder()
                mode = 2
            } else if (ch == '\u0002') {
                if (mode == 2 && cur.isNotEmpty()) parts.add(Pair(cur.toString(), true))
                cur = StringBuilder()
                mode = 0
            } else if (mode != 1) {
                cur.append(ch)
            }
        }
        if (cur.isNotEmpty() && mode == 0) parts.add(Pair(cur.toString(), false))
        var cx = x
        val limit = x + maxW
        for (part in parts) {
            paint.color = if (part.second) link else fg
            paint.isUnderlineText = part.second
            val room = limit - cx
            if (room <= 0f) break
            val w = paint.measureText(part.first)
            if (w <= room) {
                cv.drawText(part.first, cx, y, paint)
                cx += w
            } else {
                cv.drawText(TextUtils.ellipsize(part.first, paint, room, TextUtils.TruncateAt.END).toString(), cx, y, paint)
                break
            }
        }
        paint.isUnderlineText = false
        paint.color = fg
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
            // 알약: 앱과 같은 모양 · 횟수만큼 조각 · 한 만큼 채움
            val col = parseColor(s.optString("c", ""), 0xFF7E57C2.toInt())
            PillDraw.draw(cv, sx + sz / 2, sy + sz / 2, sz * 1.05f, col, s.optString("h", "caps"), s.optInt("N", 1), s.optInt("n", 0))
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


/** 알약 스티커 그리기 (앱의 알약 4가지 모양 · 하루 횟수만큼 조각, 한 만큼 채움) — 앱 pillSvg 와 같은 22×22 도면을 옮김 */
object PillDraw {
    fun draw(cv: Canvas, cx: Float, cy: Float, size: Float, color: Int, shape: String, nIn: Int, kIn: Int) {
        val n = nIn.coerceIn(1, 3)
        val k = kIn.coerceIn(0, n)
        val s = size / 22f
        cv.save()
        cv.translate(cx - size / 2, cy - size / 2)
        cv.scale(s, s)
        val fill = Paint(Paint.ANTI_ALIAS_FLAG)
        fill.color = color
        val line = Paint(Paint.ANTI_ALIAS_FLAG)
        line.style = Paint.Style.STROKE
        line.color = color
        line.strokeWidth = 1.1f
        line.alpha = 160
        val rim = Paint(Paint.ANTI_ALIAS_FLAG)
        rim.style = Paint.Style.STROKE
        rim.color = color
        rim.strokeWidth = 1.7f
        rim.alpha = if (k > 0) 255 else 150
        when (shape) {
            "round" -> {
                val r = 8.4f
                val oval = RectF(11 - r, 11 - r, 11 + r, 11 + r)
                if (k >= n) cv.drawCircle(11f, 11f, r, fill)
                else for (i in 0 until k) cv.drawArc(oval, -90f + i * 360f / n, 360f / n, true, fill)
                if (n > 1) for (i in 0 until n) {
                    val a = Math.toRadians((-90.0 + i * 360.0 / n))
                    cv.drawLine(11f, 11f, 11f + r * Math.cos(a).toFloat(), 11f + r * Math.sin(a).toFloat(), line)
                }
                cv.drawCircle(11f, 11f, r, rim)
            }
            "tab" -> {
                val sg = 17f / n
                val oval = RectF(2f, 4.8f, 20f, 17.2f)
                val clip = Path()
                clip.addOval(oval, Path.Direction.CW)
                cv.save()
                cv.clipPath(clip)
                for (i in 0 until k) cv.drawRect(2.5f + i * sg, 3f, 2.5f + (i + 1) * sg, 19f, fill)
                cv.restore()
                for (i in 1 until n) cv.drawLine(2.5f + i * sg, 5f, 2.5f + i * sg, 17f, line)
                cv.drawOval(oval, rim)
                val mid = Paint(rim)
                mid.color = if (k >= n) Color.WHITE else color
                cv.drawLine(11f, 6.5f, 11f, 15.5f, mid)
            }
            "drop" -> {
                val d = Path()
                d.moveTo(11f, 2.5f)
                d.cubicTo(11f, 2.5f, 4.2f, 10f, 4.2f, 14.2f)
                d.arcTo(RectF(4.2f, 7.4f, 17.8f, 21f), 180f, -180f, false)
                d.cubicTo(17.8f, 10f, 11f, 2.5f, 11f, 2.5f)
                d.close()
                cv.save()
                cv.clipPath(d)
                cv.drawRect(0f, 21f - (k.toFloat() / n) * 19f, 22f, 22f, fill)
                cv.restore()
                for (i in 1 until n) {
                    val y = 21f - (i.toFloat() / n) * 19f
                    cv.drawLine(5f, y, 17f, y, line)
                }
                cv.drawPath(d, rim)
            }
            else -> {
                val w = 20f
                val sg = w / n
                val rect = RectF(1f, 6f, 1f + w, 16f)
                val clip = Path()
                clip.addRoundRect(rect, 5f, 5f, Path.Direction.CW)
                cv.save()
                cv.rotate(-40f, 11f, 11f)
                cv.save()
                cv.clipPath(clip)
                for (i in 0 until k) cv.drawRect(1f + i * sg, 6f, 1f + (i + 1) * sg, 16f, fill)
                cv.restore()
                for (i in 1 until n) cv.drawLine(1f + i * sg, 6f, 1f + i * sg, 16f, line)
                cv.drawRoundRect(rect, 5f, 5f, rim)
                cv.restore()
            }
        }
        cv.restore()
    }
}
