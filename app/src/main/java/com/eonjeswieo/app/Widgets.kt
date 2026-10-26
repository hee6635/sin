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

    /** 위젯을 마지막에 그린 상태(크기 · 어떤 값을 썼는지)를 적어 둠 — 앱 "모양 조정" 화면에서 볼 수 있게 (그림이 예상과 다를 때 원인 찾기용) */
    fun note(ctx: Context, key: String, value: String) {
        val sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val o = try { JSONObject(sp.getString("dbg", "{}") ?: "{}") } catch (e: Exception) { JSONObject() }
        o.put(key, value)
        sp.edit().putString("dbg", o.toString()).apply()
    }

    fun notes(ctx: Context): String {
        val o = try { JSONObject(ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("dbg", "{}") ?: "{}") } catch (e: Exception) { JSONObject() }
        val sb = StringBuilder()
        for (k in o.keys()) sb.append(k).append(": ").append(o.optString(k)).append("\n")
        return sb.toString().trim()
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
        for (id in mgr.getAppWidgetIds(ComponentName(ctx, MonthWidgetProvider::class.java))) {
            MonthRenderer.update(ctx, mgr, id)
        }
    }

    /** 놓인 위젯 종류(사용 통계용 · 예: "1+7+m") — 개수가 아니라 종류만 */
    fun kinds(ctx: Context): String {
        val mgr = AppWidgetManager.getInstance(ctx)
        val names = listOf(TodayWidget1Provider::class.java to "1", TodayWidget2Provider::class.java to "2", WeekWidgetProvider::class.java to "7", MonthWidgetProvider::class.java to "m")
        val on = names.filter { mgr.getAppWidgetIds(ComponentName(ctx, it.first)).isNotEmpty() }.map { it.second }
        return if (on.isEmpty()) "none" else on.joinToString("+")
    }

    /** 놓인 위젯이 하나라도 있는지 */
    fun hasAny(ctx: Context): Boolean {
        val mgr = AppWidgetManager.getInstance(ctx)
        return arrayOf(TodayWidget1Provider::class.java, TodayWidget2Provider::class.java, WeekWidgetProvider::class.java, MonthWidgetProvider::class.java)
            .any { mgr.getAppWidgetIds(ComponentName(ctx, it)).isNotEmpty() }
    }

    private fun tickIntent(ctx: Context): PendingIntent =
        PendingIntent.getBroadcast(
            ctx, REQ_TICK, Intent(ctx, WidgetTickReceiver::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

    /** 마지막 위젯을 지웠으면 자정 예약도 끔 (위젯이 없는데 매일 깨우지 않게) */
    fun cancelTickIfNone(ctx: Context) {
        if (hasAny(ctx)) return
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        am.cancel(tickIntent(ctx))
    }

    fun scheduleTick(ctx: Context) {
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, 1)
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 5)
        cal.set(Calendar.MILLISECOND, 0)
        am.set(AlarmManager.RTC, cal.timeInMillis, tickIntent(ctx))
    }
}

/** 자정(또는 예약 시각)에 위젯 날짜를 넘김 */
class WidgetTickReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (!WidgetRefresher.hasAny(context)) return   // 위젯을 다 지웠으면 더 예약하지 않음
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

    override fun onDisabled(context: Context) {
        WidgetRefresher.cancelTickIfNone(context)
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

    override fun onDisabled(context: Context) {
        WidgetRefresher.cancelTickIfNone(context)
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

    override fun onDisabled(context: Context) {
        WidgetRefresher.cancelTickIfNone(context)
    }
}

/**
 * 위젯 그림을 직접 그려서(비트맵) 붙인다. 달력 칸과 같은 짜임:
 * 날짜(+공휴일 이름) → 근무 동그라미 → 스티커 → 메모 한 줄.
 */
object WidgetRenderer {
    internal class Pal(val bg: Int, val fg: Int, val sub: Int, val pill: Int, val sun: Int, val sat: Int, val line: Int, val link: Int, val chip: Int = 0xFF6B7380.toInt(), val chipFg: Int = 0xFFFFFFFF.toInt(), val divider: Int = 0xFFC9CED6.toInt())

    internal val LIGHT = Pal(
        0xFFFFFFFF.toInt(), 0xFF1F2328.toInt(), 0xFF8A919A.toInt(), 0xFFEAECEF.toInt(),
        0xFFD6334A.toInt(), 0xFF3B6FD6.toInt(), 0xFFE3E5E8.toInt(), 0xFF2F6FDE.toInt()
    )
    internal val DARK = Pal(
        0xFF23282E.toInt(), 0xFFF2F4F7.toInt(), 0xFF9AA3AD.toInt(), 0xFF39414A.toInt(),
        0xFFFF6B7F.toInt(), 0xFF7BA2FF.toInt(), 0xFF3A424B.toInt(), 0xFF7BA2FF.toInt(),
        0xFFB4BCC6.toInt(), 0xFF23282E.toInt(), 0xFF4B545E.toInt()
    )
    private val iconCache = HashMap<String, Bitmap?>()
    internal var dens = 3f   // 화면 밀도 (dp 계산용)

    /** 사진 스티커: 앱이 data URL(base64)로 보내 준 작은 그림을 비트맵으로 (한 번 풀어서 기억) */
    @Synchronized
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

    internal fun dateKey(cal: Calendar): String =
        String.format("%04d-%02d-%02d", cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1, cal.get(Calendar.DAY_OF_MONTH))

    internal fun parseColor(s: String, fallback: Int): Int =
        try {
            if (s.isEmpty()) fallback else Color.parseColor(s)
        } catch (e: Exception) {
            fallback
        }

    /** 위젯 그림 크기(px): 놓인 크기(dp)에 화면 밀도를 곱함. 너무 크면 줄이고 dp 계산(dens)도 같이 줄임. 결과 [폭, 높이] */
    internal fun bitmapSize(ctx: Context, mgr: AppWidgetManager, id: Int, defW: Int, defH: Int): IntArray {
        val opts = mgr.getAppWidgetOptions(id)
        val density = ctx.resources.displayMetrics.density
        dens = density
        // 가로로 돌린 화면은 (최대 폭 · 최소 높이), 세로는 (최소 폭 · 최대 높이)가 실제 크기라서 방향에 맞게 골라야 그림이 늘어나지 않음
        val land = ctx.resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE
        val optW = opts.getInt(if (land) AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH else AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0)
        val optH = opts.getInt(if (land) AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT else AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0)
        val wDp = if (optW > 0) optW else defW
        val hDp = if (optH > 0) optH else defH
        var w = (wDp * density).toInt().coerceAtLeast(120)
        var h = (hDp * density).toInt().coerceAtLeast(120)
        val maxPx = 700_000
        if (w * h > maxPx) {
            val f = Math.sqrt(maxPx.toDouble() / (w * h))
            w = (w * f).toInt()
            h = (h * f).toInt()
            dens = density * f.toFloat()   // 그림을 줄인 만큼 dp 계산도 같이 줄임
        }
        return intArrayOf(w, h)
    }

    @Synchronized
    fun update(ctx: Context, mgr: AppWidgetManager, id: Int, count: Int) {
        try {
            val defW = if (count == 1) 70 else if (count == 7) 250 else 140
            val defH = if (count == 1) 70 else 110
            val size = bitmapSize(ctx, mgr, id, defW, defH)
            val w = size[0]
            val h = size[1]
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

    internal fun palette(ctx: Context, data: JSONObject?): Pal {
        val theme = data?.optString("theme", "system") ?: "system"
        val night = (ctx.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
        return if (theme == "dark" || (theme != "light" && night)) DARK else LIGHT
    }

    internal fun findDay(data: JSONObject?, key: String): JSONObject? {
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

    @Volatile private var fill = true
    @Volatile private var alphaF = 1f

    private fun draw(ctx: Context, cv: Canvas, w: Float, h: Float, count: Int) {
        val data = WidgetStore.load(ctx)
        drawWith(cv, data, palette(ctx, data), w, h, count, if (count == 2) nextAlarmText(ctx) else "")
    }

    /** 그리기 본체 (Context 없이 — 컴퓨터 그림 확인에서도 씀) */
    internal fun drawWith(cv: Canvas, data: JSONObject?, pal: Pal, w: Float, h: Float, count: Int, alarm: String) {
        val alpha = ((data?.optInt("alpha", 100) ?: 100).coerceIn(0, 100) * 255 / 100)
        val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG)
        bgPaint.color = (pal.bg and 0x00FFFFFF) or (alpha shl 24)
        val r = Math.min(w, h) * 0.12f
        cv.drawRoundRect(RectF(0f, 0f, w, h), r, r, bgPaint)

        val icons = data?.optJSONObject("ic")
        fill = data?.optString("look", "fill") != "circle"   // 칸 채우기(기본) · 동그라미 — 한 달 위젯 · 앱 달력과 같은 설정
        alphaF = 0.55f + 0.45f * ((data?.optInt("alpha", 100) ?: 100).coerceIn(0, 100) / 100f)
        MonthRenderer.readToday(data)
        val memoMax = (data?.optInt("lines", 3) ?: 3).coerceIn(1, 2)   // 위젯 칸에는 메모를 최대 2개까지만 (그래야 근무 동그라미 · 스티커 자리가 넉넉함)
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
        // 둥근 모서리에 글이 닿지 않게 안쪽 여백
        val inset = Math.max(2f * dens, Math.min(6f * dens, Math.min(w, h) * 0.02f))
        val iw = w - 2 * inset
        val ih = h - 2 * inset
        cv.save()
        cv.translate(inset, inset)
        if (count == 7) {
            drawWeek(cv, data, iw, ih, pal, icons, memoMax)
        } else if (count == 1) {
            drawRow(cv, listOf(d0), booleanArrayOf(false), 0f, 0f, iw, ih, pal, icons, memoMax, false)   // 1칸은 오늘 하루뿐이라 "오늘" 초록 칸 표시는 안 함
        } else {
            val bottom = if (alarm.isEmpty()) 0f else Math.max(ih * 0.13f, 14f * dens)
            val ch = ih - bottom
            drawRow(cv, listOf(d0, findDay(data, dateKey(tom))), booleanArrayOf(true, false), 0f, 0f, iw, ch, pal, icons, memoMax, false)
            if (alarm.isNotEmpty()) {
                val p = TextPaint(Paint.ANTI_ALIAS_FLAG)
                p.color = pal.sub
                p.textSize = Math.min(bottom * 0.7f, 11f * dens)
                p.textAlign = Paint.Align.CENTER
                cv.drawText(TextUtils.ellipsize(alarm, p, iw * 0.9f, TextUtils.TruncateAt.END).toString(), iw / 2, ih - bottom * 0.28f, p)
            }
        }
        cv.restore()
    }

    /** 7일 위젯: 위에 요일 줄, 아래에 7칸(앱 달력 한 줄처럼). 오늘 칸은 초록 띠 */
    private fun drawWeek(cv: Canvas, data: JSONObject?, w: Float, h: Float, pal: Pal, icons: JSONObject?, memoMax: Int) {
        val ws = (data?.optInt("ws", 0) ?: 0).coerceIn(0, 1)
        val keys = weekKeys(data)
        val order = if (ws == 1) intArrayOf(1, 2, 3, 4, 5, 6, 0) else intArrayOf(0, 1, 2, 3, 4, 5, 6)
        val cw = w / 7
        val head = WidgetLayout.weekHead(cw, h, dens)   // 요일 이름 줄: 글자를 키움 (칸 폭 · 위젯 높이로만 정함)
        val hh = head.height
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG)
        paint.textAlign = Paint.Align.CENTER
        paint.typeface = Typeface.DEFAULT_BOLD
        paint.textSize = head.text
        for (i in 0 until 7) {
            val wd = order[i]
            paint.color = if (wd == 0) pal.sun else if (wd == 6) pal.sat else pal.sub
            cv.drawText(DOW[wd], cw * i + cw / 2, hh * 0.78f, paint)
        }
        val todayKey = dateKey(Calendar.getInstance())
        val days = ArrayList<JSONObject?>()
        for (i in 0 until 7) days.add(findDay(data, keys[i]))
        drawRow(cv, days, BooleanArray(7) { keys[it] == todayKey }, 0f, hh, w, h - hh, pal, icons, memoMax, true)
    }

    /** 칸 하나의 내용 요약 (배치 계산용) */
    private fun dayIn(d: JSONObject?, compact: Boolean): WidgetLayout.DayIn? {
        if (d == null) return null
        val stk = d.optJSONArray("stk")
        val n = if (stk == null) 0 else Math.min(stk.length(), 4)
        return WidgetLayout.DayIn(n, d.optString("hol", "").isNotEmpty() && !compact, memoList(d).size, d.optString("t", "").isNotEmpty())
    }

    internal fun memoList(d: JSONObject): ArrayList<String> {
        val memos = ArrayList<String>()
        val msArr = d.optJSONArray("ms")
        if (msArr != null) {
            for (i in 0 until msArr.length()) {
                val t = msArr.optString(i, "")
                if (t.isNotEmpty()) memos.add(t)
            }
        } else {
            val one = d.optString("memo", "")
            if (one.isNotEmpty()) memos.add(one)
        }
        return memos
    }

    /** 한 줄(1칸 · 2칸 · 7일)을 같은 높이 규칙으로 배치해서 그린다 */
    private fun drawRow(cv: Canvas, days: List<JSONObject?>, today: BooleanArray, x0: Float, y0: Float, w: Float, ch: Float, pal: Pal, icons: JSONObject?, memoMax: Int, compact: Boolean) {
        val cw = w / days.size
        val row = WidgetLayout.solve(days.map { dayIn(it, compact) }, cw, ch, dens, compact, memoMax)
        if (days.size > 1 && !fill) {   // 날짜 사이 연한 세로선 (칸 채우기는 칸 사이 틈으로 구분) (위아래 4dp 안쪽에서 · 오늘 초록 칸은 그 위에 그려짐)
            val lp = Paint(Paint.ANTI_ALIAS_FLAG)
            lp.color = pal.divider
            lp.strokeWidth = 1f * dens
            val inset = 4f * dens
            for (i in 1 until days.size) cv.drawLine(x0 + cw * i, y0 + inset, x0 + cw * i, y0 + ch - inset, lp)
        }
        for (i in days.indices) drawCell(cv, days[i], x0 + cw * i, y0, cw, ch, pal, icons, today[i], row, compact)
        val ti = today.indexOf(true)   // 오늘 칸 그림자(앱 오늘 모양 a · d) — 옆 칸 위에 그려야 보여서 맨 마지막에
        if (fill && ti >= 0 && days[ti] != null && (MonthRenderer.todayLook == "a" || MonthRenderer.todayLook == "d"))
            MonthRenderer.drawTodayShadow(cv, RectF(x0 + cw * ti, y0, x0 + cw * (ti + 1), y0 + ch), dens, pal === DARK)
    }

    /** 한 날짜를 칸 하나(x0,y0,cw,ch)에 그린다: 앱 달력 칸과 같은 짜임 (날짜 + 스티커 → 근무 동그라미 → 메모). 자리는 WidgetLayout 이 정함 */
    private fun drawCell(cv: Canvas, d: JSONObject?, x0: Float, y0: Float, cw: Float, ch: Float, pal: Pal, icons: JSONObject?, isToday: Boolean, row: WidgetLayout.Row, compact: Boolean) {
        if (d == null) return
        val night = pal === DARK
        val t = d.optString("t", "")
        val bg = d.optString("bg", "")
        if (fill) {   // 칸 채우기: 일하는 날은 근무 색을 연하게 칸 전체에 · 쉬는 날은 비움 (한 달 위젯과 같음)
            val gap = 1.2f * dens
            if (t.isNotEmpty() && bg.isNotEmpty()) {
                val tint = MonthRenderer.mixRgb(parseColor(bg, pal.pill), pal.bg, if (MonthRenderer.vivid) (if (night) 0.62f else 0.58f) else if (night) 0.30f else 0.24f)
                val tp = Paint(Paint.ANTI_ALIAS_FLAG)
                tp.color = (tint and 0x00FFFFFF) or ((alphaF * 255).toInt() shl 24)
                cv.drawRoundRect(RectF(x0 + gap, y0 + gap, x0 + cw - gap, y0 + ch - gap), 7f * dens, 7f * dens, tp)
            }
            MonthRenderer.vividBorder(cv, x0, y0, cw, ch, dens, night)
            if (isToday) {   // 오늘: 오른쪽 가장자리 띠 (앱 달력 · 한 달 위젯과 같은 모양 · 색)
                if (MonthRenderer.todayShift) MonthRenderer.todayColor = MonthRenderer.shiftToday(t.isNotEmpty() && bg.isNotEmpty(), parseColor(bg, 0), t.isNotEmpty() && bg.isEmpty(), night)
                MonthRenderer.drawTodayBand(cv, x0, y0, cw, ch, dens)
            }
        }
        if (isToday && !fill) {   // 달력의 오늘 칸처럼: 연한 초록 바탕 + 초록 테두리
            val inset = 2f * dens
            val box = RectF(x0 + inset, y0 + inset, x0 + cw - inset, y0 + ch - inset)
            val f = Paint(Paint.ANTI_ALIAS_FLAG)
            f.color = if (night) 0xFF1E3A31.toInt() else 0xFFE3F5EF.toInt()
            cv.drawRoundRect(box, 8f * dens, 8f * dens, f)
            val st = Paint(Paint.ANTI_ALIAS_FLAG)
            st.style = Paint.Style.STROKE
            st.strokeWidth = 2f * dens
            st.color = 0xFF2A8C6F.toInt()
            cv.drawRoundRect(box, 8f * dens, 8f * dens, st)
        }
        val pad = row.padX
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG)
        val dow = d.optInt("w", 0).coerceIn(0, 6)
        val hol = d.optString("hol", "")
        val dateColor = if (hol.isNotEmpty() || dow == 0) pal.sun else if (dow == 6) pal.sat else pal.fg

        // 근무 동그라미: 위(날짜·스티커)와 아래(메모) 사이 한가운데 — 스티커 줄 아래쪽과 조금 겹칠 수 있어서 스티커보다 먼저 그림 (스티커가 위에 보이게)
        if (t.isNotEmpty() && row.circleD > 0f) {
            val rad = row.circleD / 2f
            val cpaint = TextPaint(Paint.ANTI_ALIAS_FLAG)
            val cx = x0 + cw / 2
            val cyc = y0 + row.circleCy
            cpaint.typeface = Typeface.DEFAULT_BOLD
            cpaint.textAlign = Paint.Align.CENTER
            cpaint.textSize = rad * 1.0f
            if (fill) {   // 칸 채우기: 동그라미 없이 글자만 (일하는 날 = 근무 색을 진하게 · 쉬는 날 = 장미색)
                cpaint.typeface = if (MonthRenderer.vivid) Typeface.DEFAULT_BOLD else Typeface.create("sans-serif-medium", Typeface.NORMAL)
                cpaint.textSize = rad * 1.12f   // "휴"도 근무 글자와 같은 크기
                cpaint.color = if (bg.isNotEmpty()) MonthRenderer.vividInk(MonthRenderer.inkOf(parseColor(bg, pal.pill), night), night) else MonthRenderer.restInk(true, night)
                while (cpaint.measureText(t) > row.circleD * 1.1f && cpaint.textSize > rad * 0.6f) cpaint.textSize = cpaint.textSize * 0.92f
            } else if (bg.isNotEmpty()) {
                val cp = Paint(Paint.ANTI_ALIAS_FLAG)
                cp.color = if (MonthRenderer.vivid) MonthRenderer.deepen(parseColor(bg, pal.pill)) else parseColor(bg, pal.pill)
                cv.drawCircle(cx, cyc, rad, cp)
                cpaint.color = if (MonthRenderer.vivid) 0xFFFFFFFF.toInt() else parseColor(d.optString("fg", ""), pal.fg)
            } else {
                cpaint.color = if (MonthRenderer.vivid) MonthRenderer.restInk(false, pal === DARK) else 0xFFE5484D.toInt()   // 휴무: 색 없이 붉은 글자
            }
            cv.drawText(t, cx, cyc + rad * 0.36f, cpaint)
            if (d.optBoolean("ov", false)) {   // 근무를 바꾼 날: 왼쪽에 붉은 점
                val dp = Paint(Paint.ANTI_ALIAS_FLAG)
                dp.color = 0xFFE5322D.toInt()
                cv.drawCircle(x0 + pad * 1.6f, cyc, 3.2f * dens, dp)
            }
        }

        // 스티커 (오른쪽 위, 한두 줄로 촘촘히)
        val stk = d.optJSONArray("stk")
        val n = if (stk == null) 0 else Math.min(stk.length(), 4)
        val n1 = row.perRow(n)
        val n2 = n - n1
        val ss = row.stkSize
        val sg = row.stkGap
        val w1 = if (n1 > 0) n1 * ss + (n1 - 1) * sg else 0f
        val w2 = if (n2 > 0) n2 * ss + (n2 - 1) * sg else 0f
        for (i in 0 until n) {
            val s = stk!!.optJSONObject(i) ?: continue
            val inRow1 = i < n1
            val idx = if (inRow1) i else i - n1
            val rowW = if (inRow1) w1 else w2
            val sx = x0 + cw - pad - rowW + idx * (ss + sg)
            val sy = y0 + row.stkTop + (if (inRow1) 0f else row.stkStep)
            drawSticker(cv, s, sx, sy, ss, paint, icons)
        }

        // 날짜 (왼쪽) — 스티커 자리를 빼고 남은 폭에 맞춤
        val dateText = if (compact) d.optInt("d").toString() else d.optInt("d").toString() + "(" + DOW[dow] + ")"
        val availDate = cw - pad * 2 - (if (n1 > 0) w1 + sg else 0f)
        paint.typeface = Typeface.DEFAULT_BOLD
        paint.textAlign = Paint.Align.LEFT
        paint.color = dateColor
        paint.textSize = row.dateSize
        while (paint.measureText(dateText) > availDate && paint.textSize > row.dateSize * 0.6f) paint.textSize = paint.textSize * 0.92f
        cv.drawText(TextUtils.ellipsize(dateText, paint, availDate, TextUtils.TruncateAt.END).toString(), x0 + pad, y0 + row.dateBase, paint)
        if (hol.isNotEmpty() && row.holChars > 0) {   // 공휴일 · 명절: 날짜 숫자 아래 빨간 두 글자 (앱 달력과 같은 줄임말 · 7일 위젯 · 2칸 · 1칸 모두). 자리가 모자라는 크기는 한 글자 · 글자 크기와 글자 수는 WidgetLayout 이 칸 크기로 정함
            val short = d.optString(if (row.holChars >= 2) "h2" else "h1", "")
            val label = (if (short.isNotEmpty()) short else hol).take(row.holChars)   // (h2 · h1 이 없는 옛 위젯 데이터는 이름 앞 글자)
            paint.typeface = Typeface.DEFAULT
            paint.color = dateColor
            paint.textSize = row.holLabelSize
            val maxW = row.holChars * row.holLabelSize * 1.06f   // WidgetLayout 이 자리를 잡아 둔 폭 — 글꼴이 더 넓게 그리면 이 안에 들어올 때까지 줄임
            while (paint.measureText(label) > maxW && paint.textSize > row.holLabelSize * 0.7f) paint.textSize = paint.textSize * 0.95f
            cv.drawText(label, x0 + pad, y0 + row.holBase, paint)
        }

        // 메모 (맨 아래부터 쌓음, 줄 수는 줄 전체가 함께 정함)
        val memos = memoList(d)
        val shown = Math.min(memos.size, row.memoLines)
        val more = memos.size - shown   // 칸에 다 못 보이는 메모 수 (있으면 마지막 줄 끝에 "+n" 칩)
        val memoTop = y0 + row.memoTop(shown)
        val wlOff = if (d.optInt("wl", 0) == 1 && memos.isNotEmpty()) 1 else 0   // 업무 일지 줄(맨 위 · 표시만)
        for (i0 in 0 until shown) {
            val i = i0   // 업무 일지는 칸이 작아도 늘 맨 위 (사용자)
            val py = memoTop + i0 * (row.pillH + row.pillGap)
            val pp = Paint(Paint.ANTI_ALIAS_FLAG)
            pp.color = if (i < wlOff) (if (pal === DARK) 0xFF2C2A48.toInt() else 0xFFEFECFB.toInt())
                else if (i - wlOff < d.optInt("nf", 0)) (if (pal === DARK) 0xFF3A3360.toInt() else 0xFFEDE8FF.toInt()) else pal.pill   // 가족 메모는 연보라 칸 (한 달 위젯과 같음)
            cv.drawRoundRect(RectF(x0 + pad, py, x0 + cw - pad, py + row.pillH), row.pillH * 0.3f, row.pillH * 0.3f, pp)
            paint.typeface = Typeface.DEFAULT
            paint.textAlign = Paint.Align.LEFT
            paint.color = pal.fg
            paint.textSize = Math.min(row.pillH * 0.72f, cw * 0.2f)   // (7일 · 1칸 · 2칸 모두 같은 비율)
            val chipW = if (more > 0 && i0 == shown - 1) WidgetLayout.moreBadge(row.pillH)[0] else 0f
            drawRich(cv, memos[i], x0 + pad * 1.4f, py + row.pillH * 0.72f, cw - pad * 2.6f - (if (chipW > 0f) chipW + row.pillH * 0.15f else 0f), paint, pal.fg, pal.link)
            if (chipW > 0f) drawMoreChip(cv, more, x0 + cw - pad - row.pillH * 0.12f, py, row.pillH, pal, paint.textSize)
        }
    }

    /** 메모가 더 있다는 작은 칩 ("+1"): 메모 글자가 아니라 표시라는 걸 알 수 있게 색을 칠한 작은 알약 모양 (오른쪽 끝 기준) */
    internal fun drawMoreChip(cv: Canvas, more: Int, right: Float, py: Float, pillH: Float, pal: Pal, memoSize: Float = 0f) {
        val g = WidgetLayout.moreBadge(pillH)
        val rect = RectF(right - g[0], py + (pillH - g[1]) / 2f, right, py + (pillH + g[1]) / 2f)
        // 알약 없이 작은 회색 글자 (앱 달력과 같은 표시 · 메모 글자를 덜 가림)
        val tp = TextPaint(Paint.ANTI_ALIAS_FLAG)
        tp.typeface = Typeface.DEFAULT_BOLD
        tp.textAlign = Paint.Align.RIGHT
        tp.color = (pal.fg and 0x00FFFFFF) or (0xD9 shl 24)   // 메모 글자 계열 85% (또렷하게)
        tp.textSize = if (memoSize > 0f) memoSize * 0.9f else g[1] * 0.85f   // 메모 글자의 90%
        cv.drawText(WidgetLayout.moreLabel(more), rect.right, rect.centerY() + tp.textSize * 0.36f, tp)
    }

    /** 메모 한 줄: \u0001 주소 \u0003 글자 \u0002 (앱의 "링크")는 글자만 파랗게 + 밑줄, 폭을 넘으면 끝에 작은 점 세 개(한 글자 폭 안쪽 — 글꼴의 "…"은 한 글자만큼 넓어서) */
    internal fun drawRich(cv: Canvas, text: String, x: Float, y: Float, maxW: Float, paint: TextPaint, fg: Int, link: Int) {
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
                val dotsW = paint.textSize * 0.62f
                val n = paint.breakText(part.first, true, Math.max(0f, room - dotsW), null)
                val head = part.first.substring(0, n).trimEnd()
                cv.drawText(head, cx, y, paint)
                drawDots(cv, cx + paint.measureText(head) + paint.textSize * 0.08f, y, paint)
                break
            }
        }
        paint.isUnderlineText = false
        paint.color = fg
    }

    /** 잘린 글자 끝의 작은 점 세 개 (글자 크기의 약 반 폭) */
    internal fun drawDots(cv: Canvas, x: Float, baseline: Float, paint: TextPaint) {
        val r = paint.textSize * 0.07f
        val step = paint.textSize * 0.2f
        val dp = Paint(Paint.ANTI_ALIAS_FLAG)
        dp.color = (paint.color and 0x00FFFFFF) or ((Math.round(((paint.color ushr 24) and 0xFF) * 0.75f)) shl 24)
        for (i in 0 until 3) cv.drawCircle(x + r + i * step, baseline - r, r, dp)
    }

    /** 스티커 하나 (사진 · 이모티콘 · 알약). 안 한 것은 연하게, 덜 한 것(1/2 · 1/3 · 2/3)은 작은 숫자 배지 */
    internal fun drawSticker(cv: Canvas, s: JSONObject, sx: Float, sy: Float, sz: Float, paint: TextPaint, icons: JSONObject?) {
        val n = s.optInt("n", 0)
        val total = Math.max(1, s.optInt("N", 1))
        val done = n > 0
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
        if (s.optInt("p", 0) != 1 && total > 1 && n > 0 && n < total) drawBadge(cv, sx, sy, sz, n.toString() + "/" + total, paint)
    }

    /** 스티커 오른쪽 아래의 작은 숫자 배지 (앱 달력의 주황색 "1/2" 와 같은 모양) */
    private fun drawBadge(cv: Canvas, sx: Float, sy: Float, sz: Float, text: String, paint: TextPaint) {
        paint.typeface = Typeface.DEFAULT_BOLD
        paint.textAlign = Paint.Align.CENTER
        paint.textSize = Math.max(sz * 0.40f, 4.5f * dens)
        val bh = paint.textSize * 1.15f
        val bw = paint.measureText(text) + paint.textSize * 0.55f
        val right = sx + sz + sz * 0.12f
        val bottom = sy + sz + sz * 0.12f
        val rect = RectF(right - bw, bottom - bh, right, bottom)
        val bp = Paint(Paint.ANTI_ALIAS_FLAG)
        bp.color = 0xFFF08A00.toInt()
        cv.drawRoundRect(rect, bh / 2f, bh / 2f, bp)
        paint.color = Color.WHITE
        cv.drawText(text, rect.centerX(), rect.bottom - bh * 0.27f, paint)
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
                if (n == 1) {   // 가운데 홈 줄은 1번짜리만 (2 · 3번은 칸 나눔 줄과 겹쳐 세로줄이 많아 보임 — 앱과 같음)
                    val mid = Paint(rim)
                    mid.color = if (k >= n) Color.WHITE else color
                    cv.drawLine(11f, 6.5f, 11f, 15.5f, mid)
                }
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
