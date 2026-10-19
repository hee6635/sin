package com.eonjeswieo.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.text.TextPaint
import android.text.TextUtils
import android.view.View
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

/** 한 달 위젯이 위젯마다 기억하는 것: 몇 번째 달(이번 달 = 0 · 앞뒤 한 달씩) · 누구의 달력인지(비어 있으면 나) */
object MonthState {
    private const val PREFS = "widget_month"

    private fun sp(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun today(): String {
        val c = Calendar.getInstance()
        return String.format("%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH))
    }

    /** 이번 달 기준으로 넘긴 달 수 (지난 2달 ~ 다음 12달 · 안전하게 ±36 안). 날이 바뀌면 이번 달로 돌아옴 (넘겨 놓고 잊어도 다음 날엔 이번 달) */
    fun offset(ctx: Context, id: Int): Int {
        val p = sp(ctx)
        if (p.getString("offd_$id", "") != today()) return 0
        return p.getInt("off_$id", 0).coerceIn(-36, 36)
    }

    fun setOffset(ctx: Context, id: Int, v: Int) {
        sp(ctx).edit().putInt("off_$id", v.coerceIn(-36, 36)).putString("offd_$id", today()).apply()
    }

    fun who(ctx: Context, id: Int): String = sp(ctx).getString("who_$id", "") ?: ""

    fun setWho(ctx: Context, id: Int, key: String) {
        sp(ctx).edit().putString("who_$id", key).apply()
    }

    fun clear(ctx: Context, ids: IntArray) {
        val e = sp(ctx).edit()
        for (id in ids) e.remove("off_$id").remove("offd_$id").remove("who_$id")
        e.apply()
    }
}

/** 한 달 위젯: 이번 달 달력 (앞뒤 한 달 넘겨 보기 · 가족이 있으면 이름 칩으로 가족 달력 보기) */
class MonthWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, mgr: AppWidgetManager, ids: IntArray) {
        for (id in ids) MonthRenderer.update(context, mgr, id)
        WidgetRefresher.scheduleTick(context)
    }

    override fun onAppWidgetOptionsChanged(context: Context, mgr: AppWidgetManager, id: Int, newOptions: Bundle) {
        MonthRenderer.update(context, mgr, id)
    }

    override fun onEnabled(context: Context) {
        WidgetRefresher.scheduleTick(context)
    }

    override fun onDisabled(context: Context) {
        WidgetRefresher.cancelTickIfNone(context)
    }

    override fun onDeleted(context: Context, ids: IntArray) {
        MonthState.clear(context, ids)
    }
}

/** 한 달 위젯의 ‹ › · 제목 · 이름 칩을 눌렀을 때 (앱 밖에서는 못 보냄: 매니페스트에서 exported=false) */
class MonthNavReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
        if (id == AppWidgetManager.INVALID_APPWIDGET_ID) return
        try {
            when (intent.action) {
                MonthRenderer.ACT_PREV, MonthRenderer.ACT_NEXT -> {
                    val to = MonthState.offset(context, id) + (if (intent.action == MonthRenderer.ACT_PREV) -1 else 1)
                    if (MonthRenderer.canShow(WidgetStore.load(context), to)) MonthState.setOffset(context, id, to)   // 위젯 데이터가 있는 달까지만 (끝에서는 가만히)
                }
                MonthRenderer.ACT_TODAY -> MonthState.setOffset(context, id, 0)
                MonthRenderer.ACT_WHO -> MonthRenderer.nextWho(context, id)
                else -> return
            }
            MonthRenderer.update(context, AppWidgetManager.getInstance(context), id)
        } catch (e: Exception) {
            // 눌러도 그림이 안 바뀔 뿐 앱이 죽지 않게
        }
    }
}

/**
 * 한 달 위젯 그림. 맨 윗줄(이름 칩 · ‹ 제목 ›) · 요일 줄 · 날짜 칸 4~6줄.
 * 칸 안의 짜임은 앱 달력과 같음: 날짜(+공휴일 두 글자) · 스티커(하루 최대 4개: 숫자 옆 2 + 둘째 줄 2) → 근무(동그라미 · 쉬는 날은 글자만) → 메모(+n 칩). 자리는 WidgetLayout.solveMonth · monthTop 이 정함.
 * 누르는 자리는 widget_month_view.xml 의 투명한 칸들 (크기 · 위치가 이 그림과 같은 비율이어야 함).
 */
object MonthRenderer {
    const val ACT_PREV = "com.eonjeswieo.app.MONTH_PREV"
    const val ACT_NEXT = "com.eonjeswieo.app.MONTH_NEXT"
    const val ACT_TODAY = "com.eonjeswieo.app.MONTH_TODAY"
    const val ACT_WHO = "com.eonjeswieo.app.MONTH_WHO"

    // widget_month_view.xml 과 같은 값 (dp)
    private const val HEAD_DP = 36f
    private const val WEEKDAY_DP = 18f
    private const val SIDE_DP = 4f
    private const val BOTTOM_DP = 6f

    private val REST_COL = 0xFFE5484D.toInt()   // 쉬는 날 글자 (1칸 · 2칸 · 7일 위젯과 같은 붉은색)
    private val DOW = arrayOf("일", "월", "화", "수", "목", "금", "토")

    private val ROW_IDS = intArrayOf(R.id.mz_row0, R.id.mz_row1, R.id.mz_row2, R.id.mz_row3, R.id.mz_row4, R.id.mz_row5)
    private val CELL_IDS = arrayOf(
        intArrayOf(R.id.mz_c00, R.id.mz_c01, R.id.mz_c02, R.id.mz_c03, R.id.mz_c04, R.id.mz_c05, R.id.mz_c06),
        intArrayOf(R.id.mz_c10, R.id.mz_c11, R.id.mz_c12, R.id.mz_c13, R.id.mz_c14, R.id.mz_c15, R.id.mz_c16),
        intArrayOf(R.id.mz_c20, R.id.mz_c21, R.id.mz_c22, R.id.mz_c23, R.id.mz_c24, R.id.mz_c25, R.id.mz_c26),
        intArrayOf(R.id.mz_c30, R.id.mz_c31, R.id.mz_c32, R.id.mz_c33, R.id.mz_c34, R.id.mz_c35, R.id.mz_c36),
        intArrayOf(R.id.mz_c40, R.id.mz_c41, R.id.mz_c42, R.id.mz_c43, R.id.mz_c44, R.id.mz_c45, R.id.mz_c46),
        intArrayOf(R.id.mz_c50, R.id.mz_c51, R.id.mz_c52, R.id.mz_c53, R.id.mz_c54, R.id.mz_c55, R.id.mz_c56)
    )

    /** 앱이 보낸 사람 목록 (이름 칩으로 바꿔 볼 수 있는 가족 · 없으면 빈 목록) */
    fun people(data: JSONObject?): List<JSONObject> {
        val arr = data?.optJSONArray("people") ?: return emptyList()
        val out = ArrayList<JSONObject>()
        for (i in 0 until arr.length()) {
            val p = arr.optJSONObject(i) ?: continue
            out.add(p)
        }
        return out
    }

    /** 위젯이 기억해 두는 사람 표시 (앱이 준 id · 없으면 이름) */
    fun personKey(p: JSONObject): String {
        val id = p.optString("id", "")
        return if (id.isNotEmpty()) id else "n:" + p.optString("n", "")
    }

    /** 이름 칩을 누르면: 나 → 첫째 가족 → … → 마지막 가족 → 나 */
    fun nextWho(ctx: Context, id: Int) {
        val keys = ArrayList<String>()
        keys.add("")
        for (p in people(WidgetStore.load(ctx))) keys.add(personKey(p))
        val cur = Math.max(0, keys.indexOf(MonthState.who(ctx, id)))
        MonthState.setWho(ctx, id, keys[(cur + 1) % keys.size])
    }

    internal class MGrid(val year: Int, val month0: Int, val rows: Int, val start: Calendar)

    /** 보여 줄 달의 달력: 몇 줄인지 · 맨 첫 칸의 날짜 (offset: 이번 달에서 넘긴 달 수) */
    internal fun gridOf(ws: Int, offset: Int): MGrid {
        val c = Calendar.getInstance()
        c.set(Calendar.HOUR_OF_DAY, 12)
        c.set(Calendar.DAY_OF_MONTH, 1)
        c.add(Calendar.MONTH, offset)
        val year = c.get(Calendar.YEAR)
        val m0 = c.get(Calendar.MONTH)
        val lead = ((c.get(Calendar.DAY_OF_WEEK) - 1) - ws + 7) % 7
        c.add(Calendar.DAY_OF_MONTH, -lead)
        return MGrid(year, m0, WidgetLayout.monthWeeks(year, m0, ws), c)
    }

    /** 그 달(offset) 달력 전체가 위젯 데이터에 들어 있는지 — ‹ › 가 넘어갈 수 있는 달 (앱을 오래 안 열어 데이터가 줄어도 저절로 맞음) */
    internal fun covers(data: JSONObject?, ws: Int, off: Int): Boolean {
        val days = data?.optJSONArray("days") ?: return false
        if (days.length() == 0) return false
        val first = days.optJSONObject(0)?.optString("k", "") ?: ""
        val last = days.optJSONObject(days.length() - 1)?.optString("k", "") ?: ""
        if (first.isEmpty() || last.isEmpty()) return false
        val g = gridOf(ws, off)
        val e = g.start.clone() as Calendar
        e.add(Calendar.DAY_OF_MONTH, g.rows * 7 - 1)
        return WidgetRenderer.dateKey(g.start) >= first && WidgetRenderer.dateKey(e) <= last
    }

    fun canShow(data: JSONObject?, off: Int): Boolean = covers(data, (data?.optInt("ws", 0) ?: 0).coerceIn(0, 1), off)

    /** 칸 하나에 그릴 내용 (나의 달력 · 가족 달력 어느 쪽이든 같은 모양으로 모아 둠) */
    private class Info(
        val key: String,
        val num: Int,
        val dow: Int,
        val inMonth: Boolean,
        val day: JSONObject?,
        val shift: String,
        val circle: Boolean,
        val rest: Boolean,
        val bg: Int,
        val fg: Int,
        val ov: Boolean,
        val stk: List<JSONObject>,
        val memos: List<String>,
        /** 근무 요청 링: "" · ask(답할 요청) · hold(보류) · ok(승인) · no(거절) */
        val rq: String,
        /** 메모 줄 맨 앞 nf 개가 가족 메모 (가족 달력 보기에서는 전부) */
        val nf: Int
    )

    private fun firstN(arr: JSONArray?, n: Int): List<JSONObject> {
        val out = ArrayList<JSONObject>()
        if (arr == null) return out
        for (q in 0 until Math.min(arr.length(), n)) {
            val s = arr.optJSONObject(q) ?: continue
            out.add(s)
        }
        return out
    }

    private fun infos(data: JSONObject?, grid: MGrid, person: JSONObject?, pal: WidgetRenderer.Pal): List<Info> {
        val daysArr = data?.optJSONArray("days")
        val index = HashMap<String, Int>()
        if (daysArr != null) {
            for (i in 0 until daysArr.length()) {
                val k = daysArr.optJSONObject(i)?.optString("k", "") ?: ""
                if (k.isNotEmpty()) index[k] = i
            }
        }
        val sArr = person?.optJSONArray("s")
        val tMap = person?.optJSONObject("t")
        val kMap = person?.optJSONObject("k")
        val out = ArrayList<Info>()
        val cal = grid.start.clone() as Calendar
        for (i in 0 until grid.rows * 7) {
            val key = WidgetRenderer.dateKey(cal)
            val idx = index[key] ?: -1
            val d = if (idx >= 0) daysArr?.optJSONObject(idx) else null
            var shift = ""
            var circle = false
            var rest = false
            var bg = 0
            var fg = 0
            var ov = false
            var stk: List<JSONObject> = emptyList()
            var memos: List<String> = emptyList()
            var rq = ""
            var nf = 0
            if (d != null) {
                if (person == null) {
                    shift = d.optString("t", "")
                    val bgs = d.optString("bg", "")
                    if (shift.isNotEmpty()) {
                        if (bgs.isNotEmpty()) {
                            circle = true
                            bg = WidgetRenderer.parseColor(bgs, pal.pill)
                            fg = WidgetRenderer.parseColor(d.optString("fg", ""), pal.fg)
                        } else {
                            rest = true   // 휴무: 색 없이 붉은 글자
                        }
                    }
                    ov = d.optBoolean("ov", false)
                    stk = firstN(d.optJSONArray("stk"), 4)
                    memos = WidgetRenderer.memoList(d)
                    rq = d.optString("rq", "")
                    nf = Math.min(d.optInt("nf", 0), memos.size)
                } else {
                    // 가족 달력: 그 사람의 근무 · 그 사람이 공유한 스티커 · 가족 메모(♥)만 (내 개인 메모는 안 보임)
                    val k2 = sArr?.optString(idx, "") ?: ""
                    val leg = if (k2.isNotEmpty()) tMap?.optJSONArray(k2) else null
                    if (leg != null) {
                        shift = k2
                        if (leg.length() >= 2) {
                            circle = true
                            bg = WidgetRenderer.parseColor(leg.optString(0, ""), pal.pill)
                            fg = WidgetRenderer.parseColor(leg.optString(1, ""), pal.fg)
                        } else {
                            rest = true
                        }
                    }
                    stk = firstN(kMap?.optJSONArray(key), 4)
                    val fm = d.optJSONArray("fm")
                    val ml = ArrayList<String>()
                    if (fm != null) {
                        for (q in 0 until fm.length()) {
                            val t = fm.optString(q, "")
                            if (t.isNotEmpty()) ml.add(t)
                        }
                    }
                    memos = ml
                    nf = ml.size
                }
            }
            out.add(Info(key, cal.get(Calendar.DAY_OF_MONTH), cal.get(Calendar.DAY_OF_WEEK) - 1, cal.get(Calendar.MONTH) == grid.month0, d, shift, circle, rest, bg, fg, ov, stk, memos, rq, nf))
            cal.add(Calendar.DAY_OF_MONTH, 1)
        }
        return out
    }

    private fun navPi(ctx: Context, id: Int, action: String, k: Int): PendingIntent {
        val it = Intent(ctx, MonthNavReceiver::class.java).setAction(action).putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id)
        it.data = Uri.parse("eonjeswieo://month/" + id + "/" + k)
        return PendingIntent.getBroadcast(ctx, id * 10 + k, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private fun dayPi(ctx: Context, id: Int, idx: Int, key: String, who: String): PendingIntent {
        val it = Intent(ctx, WidgetDayActivity::class.java).putExtra("k", key).putExtra("who", who)
        it.data = Uri.parse("eonjeswieo://widget/" + id + "/m" + idx)
        return PendingIntent.getActivity(ctx, id * 100 + idx, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    fun update(ctx: Context, mgr: AppWidgetManager, id: Int) {
        try {
            val data = WidgetStore.load(ctx)
            val offset = MonthState.offset(ctx, id)
            val ppl = people(data)
            val want = MonthState.who(ctx, id)
            val person = if (want.isEmpty()) null else ppl.firstOrNull { personKey(it) == want }   // 그 사람이 없어졌으면 내 달력
            val who = if (person != null) personKey(person) else ""
            val ws = (data?.optInt("ws", 0) ?: 0).coerceIn(0, 1)
            val grid = gridOf(ws, offset)
            val bmp: Bitmap = synchronized(WidgetRenderer) {   // (WidgetRenderer.dens 를 같이 쓰므로 다른 위젯 그리기와 차례로)
                val size = WidgetRenderer.bitmapSize(ctx, mgr, id, 300, 300)
                val b = Bitmap.createBitmap(size[0], size[1], Bitmap.Config.ARGB_8888)
                draw(Canvas(b), size[0].toFloat(), size[1].toFloat(), data, grid, ws, offset, ppl, person, WidgetRenderer.palette(ctx, data))
                b
            }
            val rv = RemoteViews(ctx.packageName, R.layout.widget_month_view)
            rv.setImageViewBitmap(R.id.month_img, bmp)
            // 맨 윗줄: 이름 칩(가족이 있을 때만) · 앞 달 · 제목(이번 달로) · 다음 달
            rv.setViewVisibility(R.id.mz_chip, if (ppl.isNotEmpty()) View.VISIBLE else View.GONE)
            if (ppl.isNotEmpty()) rv.setOnClickPendingIntent(R.id.mz_chip, navPi(ctx, id, ACT_WHO, 1))
            rv.setOnClickPendingIntent(R.id.mz_prev, navPi(ctx, id, ACT_PREV, 2))
            rv.setOnClickPendingIntent(R.id.mz_next, navPi(ctx, id, ACT_NEXT, 3))
            rv.setOnClickPendingIntent(R.id.mz_title, navPi(ctx, id, ACT_TODAY, 4))
            // 날짜 칸: 누르면 그 날짜의 큰 창 (안 쓰는 줄은 숨김)
            val cal = grid.start.clone() as Calendar
            for (r in 0 until 6) {
                rv.setViewVisibility(ROW_IDS[r], if (r < grid.rows) View.VISIBLE else View.GONE)
                if (r >= grid.rows) continue
                for (c in 0 until 7) {
                    rv.setOnClickPendingIntent(CELL_IDS[r][c], dayPi(ctx, id, r * 7 + c, WidgetRenderer.dateKey(cal), who))
                    cal.add(Calendar.DAY_OF_MONTH, 1)
                }
            }
            mgr.updateAppWidget(id, rv)
        } catch (e: Exception) {
            // 그리기에 실패해도 앱이 죽지 않게
        }
    }

    /** 그림 한 장을 그림 (안드로이드 화면과 따로 컴퓨터에서도 돌려 볼 수 있게 Context 없이 · 밝게/어둡게는 pal 로) */
    internal fun draw(cv: Canvas, w: Float, h: Float, data: JSONObject?, grid: MGrid, ws: Int, offset: Int, ppl: List<JSONObject>, person: JSONObject?, pal: WidgetRenderer.Pal) {
        val u = WidgetRenderer.dens
        val alpha = ((data?.optInt("alpha", 100) ?: 100).coerceIn(0, 100) * 255 / 100)
        val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG)
        bgPaint.color = (pal.bg and 0x00FFFFFF) or (alpha shl 24)
        val rr = Math.min(Math.min(w, h) * 0.12f, 22f * u)
        cv.drawRoundRect(RectF(0f, 0f, w, h), rr, rr, bgPaint)

        val todayKey = WidgetRenderer.dateKey(Calendar.getInstance())
        if (WidgetRenderer.findDay(data, todayKey) == null) {   // 앱이 데이터를 한 번도 안 보냈거나 너무 오래됨
            val p = TextPaint(Paint.ANTI_ALIAS_FLAG)
            p.color = pal.sub
            p.textSize = Math.min(w, h) * 0.06f
            p.textAlign = Paint.Align.CENTER
            cv.drawText("앱을 열어 주세요", w / 2, h / 2, p)
            return
        }

        val headH = HEAD_DP * u
        val title = grid.year.toString() + "년 " + (grid.month0 + 1) + "월"
        val chipName = if (ppl.isEmpty()) null else if (person == null) "나" else person.optString("n", "가족")
        val chipDot = if (person == null) pal.fg else WidgetRenderer.parseColor(person.optString("c", ""), pal.sub)
        drawHeader(cv, w, u, pal, title, chipName, chipDot, covers(data, ws, offset - 1), covers(data, ws, offset + 1))

        // 요일 줄 (앱 설정의 주 시작 요일을 따름)
        val side = SIDE_DP * u
        val cw = (w - 2f * side) / 7f
        val wp = TextPaint(Paint.ANTI_ALIAS_FLAG)
        wp.typeface = Typeface.DEFAULT_BOLD
        wp.textSize = 11f * u
        wp.textAlign = Paint.Align.CENTER
        for (i in 0 until 7) {
            val wd = (i + ws) % 7
            wp.color = if (wd == 0) pal.sun else if (wd == 6) pal.sat else pal.sub
            cv.drawText(DOW[wd], side + cw * i + cw / 2f, headH + 13f * u, wp)
        }

        // 날짜 칸
        val top = headH + WEEKDAY_DP * u
        val rowH = (h - top - BOTTOM_DP * u) / grid.rows
        val cells = infos(data, grid, person, pal)
        val hasCircle = cells.any { it.circle }
        val rowMemos = IntArray(grid.rows) { r ->
            var m = 0
            for (c in 0 until 7) m = Math.max(m, cells[r * 7 + c].memos.size)
            m
        }
        val plan = WidgetLayout.solveMonth(rowMemos, cw, rowH, u, hasCircle, 2)
        val icons = data?.optJSONObject("ic")
        val fill = data?.optString("look", "fill") != "circle"   // 칸 채우기(기본) · 동그라미(예전 모양) — 앱 설정 › 홈 화면 위젯
        val alphaF = 0.55f + 0.45f * ((data?.optInt("alpha", 100) ?: 100).coerceIn(0, 100) / 100f)   // 칸 색은 위젯 바탕이 투명해져도 너무 옅어지지 않게
        for (i in cells.indices) {
            val f = cells[i]
            val r = i / 7
            val c = i % 7
            drawCell(cv, f, side + cw * c, top + rowH * r, cw, rowH, r, plan, pal, icons, person != null, f.inMonth && f.key == todayKey, u, fill, alphaF)
        }
    }

    /** 맨 윗줄: [이름 칩] ‹ 2026년 10월 › — 화살표는 칩이 있든 없든 제목 바로 옆에 굵고 진하게 (예전에 칩이 없을 때 위젯 맨 끝에 뒀더니 폰에서 안 보였음). 위치는 WidgetLayout.monthArrows */
    private fun drawHeader(cv: Canvas, w: Float, u: Float, pal: WidgetRenderer.Pal, title: String, chipName: String?, chipDot: Int, canPrev: Boolean, canNext: Boolean) {
        val headH = HEAD_DP * u
        val tp = TextPaint(Paint.ANTI_ALIAS_FLAG)
        tp.typeface = Typeface.DEFAULT_BOLD
        tp.textSize = 16f * u
        tp.color = pal.fg
        tp.textAlign = Paint.Align.CENTER
        var tw = tp.measureText(title)
        val maxTw = WidgetLayout.monthTitleMax(w, u, chipName != null)
        if (tw > maxTw) {   // 아주 좁은 위젯 + 이름 칩: 제목 글자를 줄여 화살표 자리를 남김
            tp.textSize = tp.textSize * maxTw / tw
            tw = tp.measureText(title)
        }
        val ar = WidgetLayout.monthArrows(w, u, chipName != null, tw)
        cv.drawText(title, ar.titleCx, headH / 2f - (tp.ascent() + tp.descent()) / 2f, tp)   // 제목 가운데 = 제목 누르는 자리(xml 의 mz_title)의 가운데
        val ap = TextPaint(Paint.ANTI_ALIAS_FLAG)
        ap.typeface = Typeface.DEFAULT_BOLD
        ap.textSize = 24f * u
        ap.textAlign = Paint.Align.CENTER
        ap.color = pal.fg
        val ay = headH / 2f + 8f * u
        ap.alpha = if (canPrev) 200 else 50   // 위젯 데이터가 있는 달까지만 넘길 수 있음 — 끝에서는 그쪽 화살표만 흐리게
        cv.drawText("‹", ar.prevX, ay, ap)
        ap.alpha = if (canNext) 200 else 50
        cv.drawText("›", ar.nextX, ay, ap)
        if (chipName != null) drawChip(cv, chipName, chipDot, pal, headH, u)
    }

    /** 누구 달력인지 보여 주는 알약: ● 이름 ▾ (누르면 다음 사람). 이름이 길면 글자를 줄이고 그래도 길면 … */
    private fun drawChip(cv: Canvas, name: String, dot: Int, pal: WidgetRenderer.Pal, headH: Float, u: Float) {
        val tp = TextPaint(Paint.ANTI_ALIAS_FLAG)
        tp.typeface = Typeface.DEFAULT_BOLD
        tp.textSize = 11.5f * u
        val maxChip = 96f * u
        val fixed = (6f + 8f + 4f + 4f + 7f + 6f) * u   // 왼쪽 여백 · 점 · 사이 · 사이 · ▾ · 오른쪽 여백
        var label = name
        var nw = tp.measureText(label)
        if (fixed + nw > maxChip) {
            tp.textSize = tp.textSize * Math.max(0.75f, (maxChip - fixed) / nw)
            nw = tp.measureText(label)
            if (fixed + nw > maxChip) {
                label = TextUtils.ellipsize(label, tp, maxChip - fixed, TextUtils.TruncateAt.END).toString()
                nw = tp.measureText(label)
            }
        }
        val x = 8f * u
        val cy = headH / 2f
        val ch = 22f * u
        val bp = Paint(Paint.ANTI_ALIAS_FLAG)
        bp.color = pal.pill
        cv.drawRoundRect(RectF(x, cy - ch / 2f, x + fixed + nw, cy + ch / 2f), ch / 2f, ch / 2f, bp)
        val dp = Paint(Paint.ANTI_ALIAS_FLAG)
        dp.color = dot
        cv.drawCircle(x + 6f * u + 4f * u, cy, 4f * u, dp)
        tp.color = pal.fg
        tp.textAlign = Paint.Align.LEFT
        cv.drawText(label, x + 18f * u, cy - (tp.ascent() + tp.descent()) / 2f, tp)
        val tx = x + 18f * u + nw + 4f * u   // ▾ (글꼴에 없을 수 있어 작은 세모로 그림)
        val tri = Path()
        tri.moveTo(tx, cy - 2f * u)
        tri.lineTo(tx + 7f * u, cy - 2f * u)
        tri.lineTo(tx + 3.5f * u, cy + 2.5f * u)
        tri.close()
        val sp = Paint(Paint.ANTI_ALIAS_FLAG)
        sp.color = pal.sub
        cv.drawPath(tri, sp)
    }

    /** 글자가 maxW 를 넘으면 maxW 안에 들어올 때까지 줄임 */
    /** a 를 t 만큼, b 를 (1-t) 만큼 섞은 불투명 색 */
    private fun mixRgb(a: Int, b: Int, t: Float): Int {
        val r = (((a shr 16) and 255) * t + ((b shr 16) and 255) * (1f - t)).toInt()
        val g = (((a shr 8) and 255) * t + ((b shr 8) and 255) * (1f - t)).toInt()
        val bl = ((a and 255) * t + (b and 255) * (1f - t)).toInt()
        return (0xFF shl 24) or (r shl 16) or (g shl 8) or bl
    }

    /** 근무 색(칸 바탕색)에서 글자색: 같은 색 계열을 진하게 (밝은 위젯) · 밝게 (어두운 위젯) */
    private fun inkOf(c: Int, night: Boolean): Int {
        val r = ((c shr 16) and 255) / 255f
        val g = ((c shr 8) and 255) / 255f
        val b = (c and 255) / 255f
        val mx = Math.max(r, Math.max(g, b))
        val mn = Math.min(r, Math.min(g, b))
        val d = mx - mn
        var h = 0f
        if (d > 0f) {
            h = when (mx) {
                r -> ((g - b) / d) % 6f
                g -> (b - r) / d + 2f
                else -> (r - g) / d + 4f
            }
            h *= 60f
            if (h < 0f) h += 360f
        }
        val s0 = if (mx == 0f) 0f else d / mx
        val s = if (night) Math.min(1f, s0 * 0.9f + 0.05f) else Math.min(1f, s0 * 1.5f + 0.12f)
        val v = if (night) 0.93f else 0.38f
        val c1 = v * s
        val x = c1 * (1f - Math.abs((h / 60f) % 2f - 1f))
        val m = v - c1
        val (rr, gg, bb) = when {
            h < 60f -> Triple(c1, x, 0f)
            h < 120f -> Triple(x, c1, 0f)
            h < 180f -> Triple(0f, c1, x)
            h < 240f -> Triple(0f, x, c1)
            h < 300f -> Triple(x, 0f, c1)
            else -> Triple(c1, 0f, x)
        }
        return (0xFF shl 24) or (((rr + m) * 255).toInt() shl 16) or (((gg + m) * 255).toInt() shl 8) or ((bb + m) * 255).toInt()
    }

    private fun fitText(p: TextPaint, text: String, maxW: Float) {
        var n = 0
        while (p.measureText(text) > maxW && n < 12) {
            p.textSize = p.textSize * 0.92f
            n++
        }
    }

    private fun drawCell(cv: Canvas, f: Info, x0: Float, y0: Float, cw: Float, rowH: Float, r: Int, plan: WidgetLayout.MonthPlan, pal: WidgetRenderer.Pal, icons: JSONObject?, family: Boolean, isToday: Boolean, u: Float, fill: Boolean, alphaF: Float) {
        val night = pal === WidgetRenderer.DARK
        if (isToday && !fill) {   // 달력의 오늘 칸처럼: 연한 초록 바탕 + 초록 테두리
            val inset = 1.5f * u
            val box = RectF(x0 + inset, y0 + inset, x0 + cw - inset, y0 + rowH - inset)
            val fp = Paint(Paint.ANTI_ALIAS_FLAG)
            fp.color = if (night) 0xFF1E3A31.toInt() else 0xFFE3F5EF.toInt()
            cv.drawRoundRect(box, 8f * u, 8f * u, fp)
            val st = Paint(Paint.ANTI_ALIAS_FLAG)
            st.style = Paint.Style.STROKE
            st.strokeWidth = 1.6f * u
            st.color = 0xFF2A8C6F.toInt()
            cv.drawRoundRect(box, 8f * u, 8f * u, st)
        }
        if (r > 0 && !fill) {   // 줄 사이 연한 가로선
            val lp = Paint(Paint.ANTI_ALIAS_FLAG)
            lp.color = pal.line
            lp.strokeWidth = Math.max(1f, 0.7f * u)
            cv.drawLine(x0 + 3f * u, y0, x0 + cw - 3f * u, y0, lp)
        }
        val layer = if (f.inMonth) -1 else cv.saveLayerAlpha(RectF(x0, y0, x0 + cw, y0 + rowH), 102)   // 이번 달이 아닌 날은 흐리게 (40%)
        val d = f.day
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG)
        val pad = plan.padX
        val holDay = (d?.optString("hol", "") ?: "").isNotEmpty()
        if (fill) {   // 칸 채우기: 일하는 날은 근무 색을 연하게 칸 전체에 · 쉬는 공휴일은 연한 붉은 칸 · 그 밖의 쉬는 날은 비움
            val tint = if (f.shift.isNotEmpty() && f.circle) mixRgb(f.bg, pal.bg, if (night) 0.30f else 0.24f)
                else if (f.shift.isNotEmpty() && f.rest && holDay) (if (night) 0xFF3B252A.toInt() else 0xFFFBEDEF.toInt())
                else 0
            if (tint != 0) {
                val gap = 1.2f * u
                val box = RectF(x0 + gap, y0 + gap, x0 + cw - gap, y0 + rowH - gap)
                val tp = Paint(Paint.ANTI_ALIAS_FLAG)
                tp.color = (tint and 0x00FFFFFF) or ((alphaF * 255).toInt() shl 24)
                cv.drawRoundRect(box, 7f * u, 7f * u, tp)
            }
        }

        // 근무: 일하는 날은 동그라미 · 쉬는 날은 글자만 (줄 안에서 높이가 같음 · 모든 동그라미가 같은 크기)
        if (f.shift.isNotEmpty() && plan.circleD > 0f && (f.circle || f.rest)) {
            val cx = x0 + cw / 2f
            val cy = y0 + plan.circleCy[r]
            val rad = plan.circleD / 2f
            paint.typeface = Typeface.DEFAULT_BOLD
            paint.textAlign = Paint.Align.CENTER
            if (f.circle) {
                if (fill) {   // 칸 채우기: 동그라미 없이 근무 색을 진하게 한 글자
                    paint.color = inkOf(f.bg, night)
                    paint.typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
                    paint.textSize = rad * 1.12f
                    fitText(paint, f.shift, plan.circleD * 0.9f)
                } else {
                    val cp = Paint(Paint.ANTI_ALIAS_FLAG)
                    cp.color = f.bg
                    cv.drawCircle(cx, cy, rad, cp)
                    paint.color = f.fg
                    paint.textSize = rad * 1.04f
                    fitText(paint, f.shift, plan.circleD * 0.82f)
                }
            } else {
                paint.color = if (fill) (if (night) 0xFFF28B9B.toInt() else 0xFFD9677B.toInt()) else REST_COL
                if (fill) paint.typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
                paint.textSize = rad * 1.24f
                fitText(paint, f.shift, plan.circleD * 1.1f)
            }
            cv.drawText(f.shift, cx, cy + paint.textSize * 0.36f, paint)
            if (f.rq.isNotEmpty()) {   // 근무 요청 링 (답할 요청 주황 · 보류 청록 · 승인 초록 · 거절 빨강 — 앱 달력과 같은 색)
                val rp = Paint(Paint.ANTI_ALIAS_FLAG)
                rp.style = Paint.Style.STROKE
                rp.strokeWidth = Math.max(2f, 2.4f * u)
                rp.color = when (f.rq) {
                    "ask" -> 0xFFF08A00.toInt()
                    "hold" -> 0xFF0E9BB0.toInt()
                    "ok" -> 0xFF1FA971.toInt()
                    else -> 0xFFD12F4A.toInt()
                }
                cv.drawCircle(cx, cy, rad * (if (fill) 0.98f else 1.06f), rp)
            }
            if (f.ov) {   // 근무를 바꾼 날: 왼쪽에 붉은 점
                val op = Paint(Paint.ANTI_ALIAS_FLAG)
                op.color = 0xFFE5322D.toInt()
                cv.drawCircle(x0 + pad + 2f * u, cy, 2.2f * u, op)
            }
        }

        // 날짜 숫자 · 공휴일 글자 · 스티커 (자리는 숫자 · 글자 폭을 재서 WidgetLayout.monthTop 이 정함)
        val hol = d?.optString("hol", "") ?: ""
        val dateColor = if (hol.isNotEmpty() || f.dow == 0) pal.sun else if (f.dow == 6) pal.sat else pal.fg
        val num = f.num.toString()
        paint.typeface = Typeface.DEFAULT_BOLD
        paint.textAlign = Paint.Align.LEFT
        paint.textSize = plan.dateSize
        val numW = paint.measureText(num)
        var h2 = ""
        var h1 = ""
        var holW2 = 0f
        if (hol.isNotEmpty() && d != null) {
            h2 = d.optString("h2", "")
            if (h2.isEmpty()) h2 = hol.take(2)
            h1 = d.optString("h1", "")
            if (h1.isEmpty()) h1 = hol.take(1)
            val hp = TextPaint(Paint.ANTI_ALIAS_FLAG)
            hp.textSize = plan.holSize
            holW2 = hp.measureText(h2)
        }
        val top = WidgetLayout.monthTop(plan, cw, u, numW, f.stk.size, holW2)
        for (k in 0 until top.row1) {   // 스티커 첫 줄: 숫자 옆 (오른쪽 끝)
            val sx = x0 + cw - pad - (top.row1 - k) * plan.stkSize - (top.row1 - k - 1) * plan.stkGap
            WidgetRenderer.drawSticker(cv, f.stk[k], sx, y0 + plan.stkTop, plan.stkSize, TextPaint(Paint.ANTI_ALIAS_FLAG), icons)
        }
        for (j in 0 until top.row2) {   // 3 · 4번째: 바로 아래 줄 오른쪽 끝 (근무 동그라미 오른쪽 위에 살짝 걸쳐도 스티커가 위에 보임 — 앱 달력 · 7일 위젯과 같음)
            val sx = x0 + cw - pad - (top.row2 - j) * plan.stkSize - (top.row2 - j - 1) * plan.stkGap
            WidgetRenderer.drawSticker(cv, f.stk[top.row1 + j], sx, y0 + plan.stkTop + plan.stkSize + plan.stkGap, plan.stkSize, TextPaint(Paint.ANTI_ALIAS_FLAG), icons)
        }
        paint.typeface = Typeface.DEFAULT_BOLD
        paint.textAlign = Paint.Align.LEFT
        paint.color = dateColor
        paint.textSize = plan.dateSize
        if (fill && isToday) {   // 오늘: 날짜 숫자를 작은 도장(둥근 알약)으로
            val sp = Paint(Paint.ANTI_ALIAS_FLAG)
            sp.color = pal.fg
            val l = Math.max(x0 + 0.5f * u, x0 + pad - 3f * u)
            val st = RectF(l, y0 + plan.dateBase - plan.dateSize * 0.98f, x0 + pad + numW + 3f * u, y0 + plan.dateBase + plan.dateSize * 0.3f)
            cv.drawRoundRect(st, (st.bottom - st.top) / 2f, (st.bottom - st.top) / 2f, sp)
            paint.color = pal.bg or 0xFF000000.toInt()
        }
        cv.drawText(num, x0 + pad, y0 + plan.dateBase, paint)
        if (hol.isNotEmpty()) {   // 공휴일: 숫자 옆에 빨간 두 글자 (자리가 모자라면 숫자 아래에 한 글자)
            paint.typeface = Typeface.DEFAULT
            paint.textSize = plan.holSize
            if (top.holBeside) cv.drawText(h2, x0 + pad + numW + 2.5f * u, y0 + plan.dateBase, paint)
            else cv.drawText(h1, x0 + pad, y0 + plan.dateBase + plan.holSize * 1.15f, paint)
        }

        // 메모: 줄 수만큼 (맨 아래부터 쌓음) · 더 있으면 마지막 줄 끝에 "+n" 칩 · 가족 달력의 메모는 연보라 칸
        val shown = Math.min(f.memos.size, plan.lines[r])
        val more = f.memos.size - shown
        val memoTop = y0 + plan.memoTop(shown)
        for (k in 0 until shown) {
            val py = memoTop + k * (plan.pillH + plan.pillGap)
            val pp = Paint(Paint.ANTI_ALIAS_FLAG)
            val isFam = family || k < f.nf
            pp.color = if (isFam) (if (night) 0xFF3A3360.toInt() else 0xFFEDE8FF.toInt()) else pal.pill
            cv.drawRoundRect(RectF(x0 + pad, py, x0 + cw - pad, py + plan.pillH), plan.pillH * 0.3f, plan.pillH * 0.3f, pp)
            var barW = 0f
            if (fill) {   // 왼쪽 가는 선: 가족 메모는 보라 · 내 메모는 회색 (앱 달력과 같은 구분)
                barW = Math.max(1.6f, 2.2f * u)
                val bp = Paint(Paint.ANTI_ALIAS_FLAG)
                bp.color = if (isFam) (if (night) 0xFFA58BFF.toInt() else 0xFF7F63DB.toInt()) else (if (night) 0xFF8A8F98.toInt() else 0xFFB0B5BC.toInt())
                cv.drawRoundRect(RectF(x0 + pad, py + plan.pillH * 0.12f, x0 + pad + barW, py + plan.pillH * 0.88f), barW / 2f, barW / 2f, bp)
            }
            paint.typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)   // 메모 글자는 한 단계 굵게(앱 글씨와 비슷하게)
            paint.textAlign = Paint.Align.LEFT
            paint.color = pal.fg
            paint.textSize = Math.min(plan.pillH * 0.77f, cw * 0.215f)   // 메모 글자 한 단계 키움 (눌러서 큰 창에서 자세히)
            val chipW = if (more > 0 && k == shown - 1) WidgetLayout.moreBadge(plan.pillH)[0] else 0f
            WidgetRenderer.drawRich(cv, f.memos[k], x0 + pad * 1.4f + barW, py + plan.pillH * 0.74f, cw - pad * 2.6f - barW - (if (chipW > 0f) chipW + plan.pillH * 0.15f else 0f), paint, pal.fg, pal.link)
            if (chipW > 0f) WidgetRenderer.drawMoreChip(cv, more, x0 + cw - pad - plan.pillH * 0.12f, py, plan.pillH, pal)
        }
        if (layer >= 0) cv.restoreToCount(layer)
    }
}
