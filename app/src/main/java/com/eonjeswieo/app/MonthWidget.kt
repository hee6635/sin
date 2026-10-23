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

    /** 달 넘김 효과: 방향(r · l)마다 지금 보이는 그림 번호(0 · 1) — 다음 넘김 때 옛 달을 보이는 쪽에, 새 달을 다른 쪽에 넣고 넘김 */
    fun flip(ctx: Context, id: Int, right: Boolean): Int = sp(ctx).getInt("flip_${id}_" + (if (right) "r" else "l"), 0).coerceIn(0, 1)

    fun setFlip(ctx: Context, id: Int, right: Boolean, v: Int) {
        sp(ctx).edit().putInt("flip_${id}_" + (if (right) "r" else "l"), v).apply()
    }

    fun setWho(ctx: Context, id: Int, key: String) {
        sp(ctx).edit().putString("who_$id", key).apply()
    }

    fun clear(ctx: Context, ids: IntArray) {
        val e = sp(ctx).edit()
        for (id in ids) e.remove("off_$id").remove("offd_$id").remove("who_$id").remove("flip_${id}_r").remove("flip_${id}_l")
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
    /** 월 넘김 · 오늘 효과는 시간이 걸리는 일이라 따로 스레드에서 (goAsync 로 끝날 때까지 프로세스 유지) — 실패하면 그냥 새로 그리기 */
    private fun animate(ctx: Context, mgr: AppWidgetManager, id: Int, from: Int, dir: Int, glow: Boolean) {
        val app = ctx.applicationContext
        val pr = goAsync()
        Thread {
            try {
                MonthRenderer.animate(app, mgr, id, from, dir, glow)
            } catch (e: Throwable) {
                try { MonthRenderer.update(app, mgr, id) } catch (e2: Throwable) { }
            } finally {
                try { pr.finish() } catch (e: Exception) { }
            }
        }.start()
    }

    override fun onReceive(context: Context, intent: Intent) {
        val id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
        if (id == AppWidgetManager.INVALID_APPWIDGET_ID) return
        var fromOffset = 0
        try {
            val before = MonthState.offset(context, id)
            when (intent.action) {
                MonthRenderer.ACT_PREV, MonthRenderer.ACT_NEXT -> {
                    val to = MonthState.offset(context, id) + (if (intent.action == MonthRenderer.ACT_PREV) -1 else 1)
                    if (MonthRenderer.canShow(WidgetStore.load(context), to)) MonthState.setOffset(context, id, to)   // 위젯 데이터가 있는 달까지만 (끝에서는 가만히)
                }
                MonthRenderer.ACT_TODAY -> { fromOffset = MonthState.offset(context, id); MonthState.setOffset(context, id, 0) }
                MonthRenderer.ACT_WHO -> MonthRenderer.nextWho(context, id)
                else -> return
            }
            val mgr = AppWidgetManager.getInstance(context)
            val dir = if (intent.action == MonthRenderer.ACT_PREV) -1 else if (intent.action == MonthRenderer.ACT_NEXT) 1 else 0
            if (intent.action == MonthRenderer.ACT_TODAY) {
                // "오늘": 이번 달로 쓱 미끄러져 오고 → 오늘 칸 테두리를 따라 은은한 빛이 한 바퀴 지나가고 사라짐
                val from = fromOffset
                val sd = if (from > 0) -1 else if (from < 0) 1 else 0
                animate(context, mgr, id, from, sd, true)
            } else if (dir == 0) {
                MonthRenderer.update(context, mgr, id)
            } else {
                // 월 넘김 효과: 새 달이 넘긴 쪽에서 미끄러져 들어오고 옛 달은 반대쪽으로 밀려 사라짐 · 다른 달에서 이번 달로 돌아오면 오늘 칸에 빛도
                val back = before != 0 && MonthState.offset(context, id) == 0
                animate(context, mgr, id, before, dir, back)
            }
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
    private const val HEAD_DP = 48f   // 맨 윗줄 높이(누르기 쉽게 36 → 48dp)
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

    /** 모양 조정(앱 숨은 화면)에서 정한 배율 · 위치: 위젯 가로 폭이 440dp 보다 좁으면 "커버" 값 · 넓으면 "안쪽" 값. 없으면 전부 기본(1 · 0) */
    internal class Tune(val stk: Float, val stkX: Float, val stkY: Float, val ink: Float, val inkY: Float, val memo: Float, val pill: Float, val stkGX: Float = 0f, val stkGY: Float = 0f, val memoY: Float = 0f, val memoG: Float = 0f) {
        companion object {
            val NONE = Tune(1f, 0f, 0f, 1f, 0f, 1f, 1f)
            fun from(data: JSONObject?, wDp: Float): Tune {
                val o = data?.optJSONObject("tune")?.optJSONObject(if (wDp < 440f) "cover" else "inner") ?: return NONE
                fun g(k: String, d: Float, lo: Float, hi: Float): Float = o.optDouble(k, d.toDouble()).toFloat().coerceIn(lo, hi)
                return Tune(g("stk", 1f, 0.6f, 1.6f), g("stkX", 0f, -1f, 1f), g("stkY", 0f, -1f, 1f), g("ink", 1f, 0.6f, 1.5f), g("inkY", 0f, -1f, 1f), g("memo", 1f, 0.7f, 1.6f), g("pill", 1f, 0.7f, 1.6f), g("stkGX", 0f, -1f, 1f), g("stkGY", 0f, -1f, 1f), g("memoY", 0f, -1f, 3f), g("memoG", 0f, -1f, 1f))
            }
        }
    }

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

    /** 그림 한 장 + 그때의 자리 정보 (오늘 칸 · 칸들이 시작하는 높이 · 바탕 모서리 · dp 배율) */
    internal class Layer(val bmp: Bitmap, val today: RectF?, val top: Float, val rr: Float, val u: Float)

    /** part: 0 = 전부 · 1 = 바깥 틀(바탕 · 맨 윗줄 · 요일 줄) · 2 = 날짜 칸들만 / moving: 제목을 강조색으로 */
    internal fun layer(ctx: Context, mgr: AppWidgetManager, id: Int, data: JSONObject?, offset: Int, part: Int, moving: Boolean): Layer {
        val ppl = people(data)
        val want = MonthState.who(ctx, id)
        val person = if (want.isEmpty()) null else ppl.firstOrNull { personKey(it) == want }   // 그 사람이 없어졌으면 내 달력
        val ws = (data?.optInt("ws", 0) ?: 0).coerceIn(0, 1)
        val grid = gridOf(ws, offset)
        return synchronized(WidgetRenderer) {   // (WidgetRenderer.dens 를 같이 쓰므로 다른 위젯 그리기와 차례로)
            val size = WidgetRenderer.bitmapSize(ctx, mgr, id, 300, 300)
            val b = Bitmap.createBitmap(size[0], size[1], Bitmap.Config.ARGB_8888)
            // 모양 조정의 "커버 / 안쪽" 구분은 그림 폭이 아니라 위젯의 (세로 화면 기준) 최소 폭으로 — 가로 · 세로나 화면에 따라 그림 폭이 달라져도 같은 값을 씀
            val opts = mgr.getAppWidgetOptions(id)
            val minW = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0).toFloat()
            val maxW = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 0).toFloat()
            val pw = if (minW > 0f) minW else size[0] / WidgetRenderer.dens

            draw(Canvas(b), size[0].toFloat(), size[1].toFloat(), data, grid, ws, offset, ppl, person, WidgetRenderer.palette(ctx, data), pw, part, moving)
            if (part != 1) {
                val statTxt = " · 가려진 것: 메모 " + statMemoHid + "개 · 스티커 " + statStkHid + "개"
                WidgetStore.note(ctx, "한 달 위젯 #" + id, "그림 "+ size[0] + "x" + size[1] + "px · 밀도 " + WidgetRenderer.dens + " · 최소폭 " + minW.toInt() + "dp · 최대폭 " + maxW.toInt() + "dp → " + (if (pw < 440f) "커버" else "안쪽") + " 값" + statTxt)
            }
            Layer(b, lastToday, lastTop, lastRr, WidgetRenderer.dens)
        }
    }

    /** 위젯에 보냄: 그림 + 맨 윗줄 · 날짜 칸을 누르는 자리 (모두 새로 지정) */
    private fun send(ctx: Context, mgr: AppWidgetManager, id: Int, data: JSONObject?, offset: Int, bmp: Bitmap) {
        val ppl = people(data)
        val want = MonthState.who(ctx, id)
        val person = if (want.isEmpty()) null else ppl.firstOrNull { personKey(it) == want }
        val who = if (person != null) personKey(person) else ""
        val ws = (data?.optInt("ws", 0) ?: 0).coerceIn(0, 1)
        val grid = gridOf(ws, offset)
        val rv = RemoteViews(ctx.packageName, R.layout.widget_month_view)
        rv.setImageViewBitmap(R.id.month_img, bmp)
        // 효과용 그림은 숨기고 비움 (홈 화면이 이전 그림을 붙잡고 있지 않게)
        rv.setViewVisibility(R.id.mz_slide, View.GONE)
        rv.setViewVisibility(R.id.mz_glow, View.GONE)
        for (v in FX_IMGS) rv.setImageViewBitmap(v, tiny)
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
    }

    fun update(ctx: Context, mgr: AppWidgetManager, id: Int) {
        try {
            val data = WidgetStore.load(ctx)
            val offset = MonthState.offset(ctx, id)
            send(ctx, mgr, id, data, offset, layer(ctx, mgr, id, data, offset, 0, false).bmp)
        } catch (e: Exception) {
            // 그리기에 실패해도 앱이 죽지 않게
        }
    }

    // ── 월 넘김 · 오늘 효과 ──────────────────────────────────────────────
    // 위젯은 그림을 통째로 바꿔 끼우는 방식이라 "프레임"이 곧 그림 한 장. 부드럽게 보이도록
    //  · 그림은 미리 몇 장만 그려 두고(바깥 틀 · 떠나는 달 칸들 · 들어오는 달 칸들) 프레임마다 위치 · 투명도만 바꿔 겹침 (한 프레임 = 몇 ms)
    //  · 시간 기준으로 진행: 프레임이 늦으면 건너뛰어도 움직임 속도는 그대로 (느린 화면이 슬로모션이 되지 않게)
    //  · 중간 프레임은 그림만 가볍게 바꿔 끼우고(partiallyUpdateAppWidget), 누르는 자리는 맨 끝에 한 번만 다시 지정
    private const val SLIDE_MS = 260L
    private const val GLOW_MS = 820L
    private const val FRAME_MS = 28L   // 프레임 사이 최소 간격
    private const val SLIDE_DP = 36f
    private const val GLOW_SCALE = 0.5f   // 빛 그림은 반 크기로 (프레임마다 보내는 양이 1/4 · 빛은 부드러워서 티가 거의 안 남)
    private val FX_IMGS = intArrayOf(R.id.mz_r0, R.id.mz_r1, R.id.mz_l0, R.id.mz_l1, R.id.mz_glow)
    private val tiny: Bitmap by lazy { Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888) }
    private val animGen = HashMap<Int, Int>()   // 위젯마다 가장 최근 효과 번호: 새로 누르면 이전 효과는 멈춤

    /** dir: 새 달이 들어오는 쪽(-1 왼쪽 · +1 오른쪽 · 0 없음) · glow: 끝나고 오늘 칸 테두리에 빛 */
    fun animate(ctx: Context, mgr: AppWidgetManager, id: Int, from: Int, dir: Int, glow: Boolean) {
        val gen = synchronized(animGen) { val g = (animGen[id] ?: 0) + 1; animGen[id] = g; g }
        fun alive() = synchronized(animGen) { animGen[id] == gen }
        val data = WidgetStore.load(ctx)
        val to = MonthState.offset(ctx, id)
        val sliding = dir != 0 && from != to
        if (!sliding && !glow) { update(ctx, mgr, id); return }

        val chrome: Layer?             // 미끄러지는 동안의 바깥 틀 (제목 강조색)
        val old: Layer?
        val nw: Layer
        val base: Bitmap               // 효과가 끝났을 때의 모양 = 마지막에 보내는 그림
        if (sliding) {
            old = layer(ctx, mgr, id, data, from, 2, false)
            nw = layer(ctx, mgr, id, data, to, 2, false)
            chrome = layer(ctx, mgr, id, data, to, 1, true)
            base = composeSlide(Bitmap.createBitmap(nw.bmp.width, nw.bmp.height, Bitmap.Config.ARGB_8888), layer(ctx, mgr, id, data, to, 1, false).bmp, null, nw.bmp, 0, 1f, nw.top, nw.rr, nw.u)
        } else {
            old = null
            chrome = null
            nw = layer(ctx, mgr, id, data, to, 0, false)
            base = nw.bmp
        }
        fun play(ms: Long, bw: Int, bh: Int, view: Int, frame: (Float, Bitmap) -> Unit) {
            val bufs = arrayOf(Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888), Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888))
            var bi = 0
            val start = android.os.SystemClock.uptimeMillis()
            while (alive()) {
                val f0 = android.os.SystemClock.uptimeMillis()
                val t = Math.min(1f, (f0 - start).toFloat() / ms)
                val out = bufs[bi]; bi = 1 - bi
                frame(t, out)
                partial(ctx, mgr, id, view, out)
                if (t >= 1f) return
                val spent = android.os.SystemClock.uptimeMillis() - f0
                if (spent < FRAME_MS) try { Thread.sleep(FRAME_MS - spent) } catch (e: InterruptedException) { return }
            }
        }

        if (sliding && chrome != null && old != null) {
            // 홈 화면이 직접 미끄러뜨림(앱은 그림 두 장만 보냄) → 폰 화면처럼 매끄러움. 안 되는 홈 화면이면 예전처럼 프레임을 하나씩 보냄
            if (flipSlide(ctx, mgr, id, chrome.bmp, old.bmp, nw.bmp, dir)) {
                try { Thread.sleep(SLIDE_MS + 40L) } catch (e: InterruptedException) { }
            } else {
                play(SLIDE_MS, base.width, base.height, R.id.month_img) { t, out ->
                    val e = 1f - (1f - t) * (1f - t) * (1f - t)   // 처음엔 빠르게 · 끝에서 부드럽게 멈춤
                    composeSlide(out, chrome.bmp, old.bmp, nw.bmp, dir, e, nw.top, nw.rr, nw.u)
                }
            }
            if (!alive()) return
            send(ctx, mgr, id, data, to, base)   // 넘김 끝: 정상 그림 (효과 그림은 숨김)
        }
        val box = nw.today
        if (glow && box != null && alive()) {
            // 빛만 그린 반 크기 투명 그림을 위젯 위에 겹쳐 바꿈 (바탕 그림은 그대로)
            val gw = Math.max(1, Math.round(base.width * GLOW_SCALE))
            val gh = Math.max(1, Math.round(base.height * GLOW_SCALE))
            play(GLOW_MS, gw, gh, R.id.mz_glow) { t, out ->
                out.eraseColor(0)
                val cv = Canvas(out)
                cv.scale(gw.toFloat() / base.width, gh.toFloat() / base.height)
                drawGlow(cv, box, nw.u, t)
            }
            if (alive()) send(ctx, mgr, id, data, to, base)   // 마무리: 정상 그림 + 누르는 자리
        } else if (!sliding && alive()) send(ctx, mgr, id, data, to, base)
    }

    /** 달 넘김을 홈 화면에 맡김: 지금 보이는 쪽에 옛 달 칸, 다른 쪽에 새 달 칸을 넣고 넘기라고 함(ViewFlipper 의 들어오기 · 나가기 움직임). 실패하면 false */
    private fun flipSlide(ctx: Context, mgr: AppWidgetManager, id: Int, chrome: Bitmap, old: Bitmap, nw: Bitmap, dir: Int): Boolean {
        return try {
            val right = dir > 0
            val cur = MonthState.flip(ctx, id, right)
            val imgs = if (right) intArrayOf(R.id.mz_r0, R.id.mz_r1) else intArrayOf(R.id.mz_l0, R.id.mz_l1)
            val flip = if (right) R.id.mz_flip_r else R.id.mz_flip_l
            val rv = RemoteViews(ctx.packageName, R.layout.widget_month_view)
            rv.setImageViewBitmap(R.id.month_img, chrome)
            rv.setViewVisibility(R.id.mz_glow, View.GONE)
            rv.setViewVisibility(R.id.mz_slide, View.VISIBLE)
            rv.setViewVisibility(R.id.mz_flip_r, if (right) View.VISIBLE else View.GONE)
            rv.setViewVisibility(R.id.mz_flip_l, if (right) View.GONE else View.VISIBLE)
            rv.setImageViewBitmap(imgs[cur], old)
            rv.setImageViewBitmap(imgs[1 - cur], nw)
            rv.setDisplayedChild(flip, 1 - cur)
            mgr.partiallyUpdateAppWidget(id, rv)
            MonthState.setFlip(ctx, id, right, 1 - cur)
            true
        } catch (e: Exception) {
            false
        }
    }

    /** 효과 중간 프레임: 그림만 바꿔 끼움 (실패하면 건너뜀 — 마무리에서 어차피 전체를 다시 보냄) */
    private fun partial(ctx: Context, mgr: AppWidgetManager, id: Int, view: Int, bmp: Bitmap) {
        try {
            val rv = RemoteViews(ctx.packageName, R.layout.widget_month_view)
            if (view != R.id.month_img) rv.setViewVisibility(view, View.VISIBLE)
            rv.setImageViewBitmap(view, bmp)
            mgr.partiallyUpdateAppWidget(id, rv)
        } catch (e: Exception) { }
    }

    /** 넘김 한 프레임 (e: 0 → 1): 바깥 틀 위에 옛 달 칸들은 반대쪽으로 밀리며 흐려지고, 새 달 칸들은 dir 쪽에서 미끄러져 와 선명해짐 */
    internal fun composeSlide(out: Bitmap, chrome: Bitmap, old: Bitmap?, nw: Bitmap, dir: Int, e: Float, top: Float, rr: Float, u: Float): Bitmap {
        out.eraseColor(0)
        val cv = Canvas(out)
        cv.drawBitmap(chrome, 0f, 0f, null)
        val clip = Path()
        clip.addRoundRect(RectF(0f, top - 2f * rr, out.width.toFloat(), out.height.toFloat()), rr, rr, Path.Direction.CW)   // 칸들이 바탕 모서리 밖으로 안 삐져나오게
        val sv = cv.save()
        cv.clipPath(clip)
        val d = SLIDE_DP * u * dir
        val p = Paint(Paint.FILTER_BITMAP_FLAG)   // (소수점 위치로 움직여도 부드럽게)
        if (old != null && e < 1f) { p.alpha = Math.round((1f - e) * 255f); cv.drawBitmap(old, -d * e, 0f, p) }
        p.alpha = Math.round(e * 255f)
        cv.drawBitmap(nw, d * (1f - e), 0f, p)
        cv.restoreToCount(sv)
        return out
    }

    // 둥근 네모 테두리 위의 한 점: s = 윗변 왼쪽 끝에서 시계 방향으로 간 길이
    private fun edgePoint(b: RectF, r: Float, s: Float, out: FloatArray) {
        val wS = Math.max(0f, b.width() - 2f * r)
        val hS = Math.max(0f, b.height() - 2f * r)
        val arc = (Math.PI.toFloat() / 2f) * r
        var d = s
        if (d <= wS) { out[0] = b.left + r + d; out[1] = b.top; return }
        d -= wS
        if (d <= arc) { val a = d / r; out[0] = b.right - r + r * Math.sin(a.toDouble()).toFloat(); out[1] = b.top + r - r * Math.cos(a.toDouble()).toFloat(); return }
        d -= arc
        if (d <= hS) { out[0] = b.right; out[1] = b.top + r + d; return }
        d -= hS
        if (d <= arc) { val a = d / r; out[0] = b.right - r + r * Math.cos(a.toDouble()).toFloat(); out[1] = b.bottom - r + r * Math.sin(a.toDouble()).toFloat(); return }
        d -= arc
        if (d <= wS) { out[0] = b.right - r - d; out[1] = b.bottom; return }
        d -= wS
        if (d <= arc) { val a = d / r; out[0] = b.left + r - r * Math.sin(a.toDouble()).toFloat(); out[1] = b.bottom - r + r * Math.cos(a.toDouble()).toFloat(); return }
        d -= arc
        if (d <= hS) { out[0] = b.left; out[1] = b.bottom - r - d; return }
        d -= hS
        val a = d / r
        out[0] = b.left + r - r * Math.cos(a.toDouble()).toFloat(); out[1] = b.top + r - r * Math.sin(a.toDouble()).toFloat()
    }

    /**
     * 오늘 칸 테두리를 따라 지나가는 은은한 빛 (t: 0 → 1). 꼬리를 끄는 빛 한 줄이 윗변 왼쪽에서 시계 방향으로 한 바퀴 돌고 사라지는 동안
     * 테두리 전체가 살짝 빛났다 옅어짐. 너무 강하지 않게 (가장 진할 때도 반쯤 투명)
     */
    internal fun drawGlow(cv: Canvas, cell: RectF, u: Float, t: Float) {
        val gap = 1.2f * u
        val r = 7f * u
        val box = RectF(cell.left + gap, cell.top + gap, cell.right - gap, cell.bottom - gap)
        val rgb = todayColor and 0x00FFFFFF
        // 테두리 전체: 빠르게 켜졌다가 서서히 사라짐
        val env = if (t < 0.15f) t / 0.15f else Math.pow((1f - (t - 0.15f) / 0.85f).toDouble(), 1.6).toFloat()
        if (env > 0.01f) {
            val soft = Paint(Paint.ANTI_ALIAS_FLAG)
            soft.style = Paint.Style.STROKE
            soft.strokeWidth = 5f * u
            soft.color = rgb or (Math.round(0x30 * env) shl 24)
            cv.drawRoundRect(box, r, r, soft)
            val line = Paint(Paint.ANTI_ALIAS_FLAG)
            line.style = Paint.Style.STROKE
            line.strokeWidth = 1.6f * u
            line.color = rgb or (Math.round(0x78 * env) shl 24)
            cv.drawRoundRect(box, r, r, line)
        }
        // 도는 빛
        val wS = Math.max(0f, box.width() - 2f * r)
        val hS = Math.max(0f, box.height() - 2f * r)
        val per = 2f * wS + 2f * hS + 2f * Math.PI.toFloat() * r
        val len = per * 0.30f
        val q = Math.min(1f, t / 0.72f)
        val p = if (q < 0.5f) 2f * q * q else 1f - 2f * (1f - q) * (1f - q)   // 천천히 출발 → 빨라졌다 → 부드럽게 끝
        val head = p * (per + len)
        val tail = head - len
        if (head <= 0f || tail >= per) return
        val n = 28
        val a = FloatArray(2)
        val b = FloatArray(2)
        val halo = Paint(Paint.ANTI_ALIAS_FLAG)
        halo.style = Paint.Style.STROKE
        halo.strokeWidth = 6f * u
        val core = Paint(Paint.ANTI_ALIAS_FLAG)
        core.style = Paint.Style.STROKE
        core.strokeWidth = 2.4f * u
        for (k in 0 until n) {
            val s0 = Math.max(0f, tail + len * k / n)
            val s1 = Math.min(per, tail + len * (k + 1) / n)
            if (s1 <= s0) continue
            val f = (k + 1f) / n
            val lum = f * f   // 머리 쪽이 가장 진하고 꼬리는 사라짐
            edgePoint(box, r, s0, a)
            edgePoint(box, r, s1, b)
            halo.color = rgb or (Math.round(0x38 * lum) shl 24)
            core.color = rgb or (Math.round(0xC8 * lum) shl 24)
            cv.drawLine(a[0], a[1], b[0], b[1], halo)
            cv.drawLine(a[0], a[1], b[0], b[1], core)
        }
    }

    /** 그림 한 장을 그림 (안드로이드 화면과 따로 컴퓨터에서도 돌려 볼 수 있게 Context 없이 · 밝게/어둡게는 pal 로) */
    // 마지막으로 그린 한 달 위젯에서 가려진 것 (모양 조정 화면에 보여줌)
    @Volatile internal var statMemoHid = 0
    @Volatile internal var statStkHid = 0
    // 오늘 띠 모양 · 색 (앱 달력 설정과 같음 · 위젯 JSON 의 `today`)
    // 마지막으로 그린 그림의 자리 정보 (효과가 씀): 오늘 칸 · 날짜 칸들이 시작하는 높이 · 바탕 모서리 반지름
    @Volatile internal var lastToday: RectF? = null
    @Volatile internal var lastTop = 0f
    @Volatile internal var lastRr = 0f
    @Volatile internal var todayLook = "b"
    @Volatile internal var todayColor = 0xFF2F6BF0.toInt()

    internal fun draw(cv: Canvas, w: Float, h: Float, data: JSONObject?, grid: MGrid, ws: Int, offset: Int, ppl: List<JSONObject>, person: JSONObject?, pal: WidgetRenderer.Pal, profileWDp: Float = -1f, part: Int = 0, moving: Boolean = false) {   // part: 0 = 전부 · 1 = 바깥 틀(바탕 · 맨 윗줄 · 요일 줄)만 · 2 = 날짜 칸들만 (월 넘김 · 오늘 효과가 따로 그려 겹침)
        lastToday = null
        statMemoHid = 0
        statStkHid = 0
        run {
            val t = data?.optJSONObject("today")
            val lk = t?.optString("look", "b") ?: "b"
            todayLook = if (lk == "a" || lk == "c" || lk == "d") lk else "b"
            val col = t?.optString("color", "") ?: ""
            todayColor = try { if (col.matches(Regex("#[0-9a-fA-F]{6}"))) android.graphics.Color.parseColor(col) else 0xFF2F6BF0.toInt() } catch (e: Exception) { 0xFF2F6BF0.toInt() }
        }
        val u = WidgetRenderer.dens
        val alpha = ((data?.optInt("alpha", 100) ?: 100).coerceIn(0, 100) * 255 / 100)
        val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG)
        bgPaint.color = (pal.bg and 0x00FFFFFF) or (alpha shl 24)
        val rr = Math.min(Math.min(w, h) * 0.12f, 22f * u)
        lastRr = rr
        lastTop = (HEAD_DP + WEEKDAY_DP) * u
        if (part != 2) cv.drawRoundRect(RectF(0f, 0f, w, h), rr, rr, bgPaint)

        val todayKey = WidgetRenderer.dateKey(Calendar.getInstance())
        if (WidgetRenderer.findDay(data, todayKey) == null) {   // 앱이 데이터를 한 번도 안 보냈거나 너무 오래됨
            val p = TextPaint(Paint.ANTI_ALIAS_FLAG)
            p.color = pal.sub
            p.textSize = Math.min(w, h) * 0.06f
            p.textAlign = Paint.Align.CENTER
            if (part != 2) cv.drawText("앱을 열어 주세요", w / 2, h / 2, p)
            return
        }

        val headH = HEAD_DP * u
        val title = grid.year.toString() + "년 " + (grid.month0 + 1) + "월"
        val chipName = if (ppl.isEmpty()) null else if (person == null) "나" else person.optString("n", "가족")
        val chipDot = if (person == null) pal.fg else WidgetRenderer.parseColor(person.optString("c", ""), pal.sub)
        if (part != 2) drawHeader(cv, w, u, pal, title, chipName, chipDot, covers(data, ws, offset - 1), covers(data, ws, offset + 1), offset != 0, moving)

        // 요일 줄 (앱 설정의 주 시작 요일을 따름)
        val side = SIDE_DP * u
        val cw = (w - 2f * side) / 7f
        if (part != 2) {
            val wp = TextPaint(Paint.ANTI_ALIAS_FLAG)
            wp.typeface = Typeface.DEFAULT_BOLD
            wp.textSize = 11f * u
            wp.textAlign = Paint.Align.CENTER
            for (i in 0 until 7) {
                val wd = (i + ws) % 7
                wp.color = if (wd == 0) pal.sun else if (wd == 6) pal.sat else pal.sub
                cv.drawText(DOW[wd], side + cw * i + cw / 2f, headH + 13f * u, wp)
            }
        }
        if (part == 1) return

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
        val tn = Tune.from(data, if (profileWDp > 0f) profileWDp else w / u)
        val plan = WidgetLayout.solveMonth(rowMemos, cw, rowH, u, hasCircle, 3, tn.stk, tn.pill)
        val icons = data?.optJSONObject("ic")
        val fill = data?.optString("look", "fill") != "circle"   // 칸 채우기(기본) · 동그라미(예전 모양) — 앱 설정 › 홈 화면 위젯
        val alphaF = 0.55f + 0.45f * ((data?.optInt("alpha", 100) ?: 100).coerceIn(0, 100) / 100f)   // 칸 색은 위젯 바탕이 투명해져도 너무 옅어지지 않게
        for (i in cells.indices) {
            val f = cells[i]
            val r = i / 7
            val c = i % 7
            val isToday = f.inMonth && f.key == todayKey
            if (isToday) lastToday = RectF(side + cw * c, top + rowH * r, side + cw * (c + 1), top + rowH * (r + 1))
            drawCell(cv, f, side + cw * c, top + rowH * r, cw, rowH, r, plan, pal, icons, person != null, isToday, u, fill, alphaF, tn)
        }
    }

    /** 맨 윗줄: [이름 칩] ‹ 2026년 10월 › — 화살표는 칩이 있든 없든 제목 바로 옆에 굵고 진하게 (예전에 칩이 없을 때 위젯 맨 끝에 뒀더니 폰에서 안 보였음). 위치는 WidgetLayout.monthArrows */
    private fun drawHeader(cv: Canvas, w: Float, u: Float, pal: WidgetRenderer.Pal, title: String, chipName: String?, chipDot: Int, canPrev: Boolean, canNext: Boolean, notToday: Boolean, moving: Boolean) {
        val headH = HEAD_DP * u
        val tp = TextPaint(Paint.ANTI_ALIAS_FLAG)
        tp.typeface = Typeface.DEFAULT_BOLD
        tp.textSize = 17f * u
        tp.color = if (moving) todayColor or 0xFF000000.toInt() else pal.fg   // 달을 넘기는 순간에는 제목을 강조색으로 → 넘어갔다는 표시
        tp.textAlign = Paint.Align.CENTER
        var tw = tp.measureText(title)
        val maxTw = WidgetLayout.monthTitleMax(w, u, chipName != null)
        if (tw > maxTw) {   // 아주 좁은 위젯 + 이름 칩: 제목 글자를 줄여 화살표 자리를 남김
            tp.textSize = tp.textSize * maxTw / tw
            tw = tp.measureText(title)
        }
        val ar = WidgetLayout.monthArrows(w, u, chipName != null, tw)
        // 이번 달이 아니면 제목 아래에 "오늘" 알약 (제목 누르는 자리를 누르면 이번 달로 돌아감) — 제목은 조금 위로
        val titleCy = if (notToday) headH * 0.40f else headH / 2f
        cv.drawText(title, ar.titleCx, titleCy - (tp.ascent() + tp.descent()) / 2f, tp)   // 제목 가운데 = 제목 누르는 자리(xml 의 mz_title)의 가운데
        if (notToday) {
            val hp = TextPaint(Paint.ANTI_ALIAS_FLAG)
            hp.typeface = Typeface.DEFAULT_BOLD
            hp.textSize = 11f * u
            hp.textAlign = Paint.Align.CENTER
            val label = "오늘"
            val lw = hp.measureText(label)
            val ph = 17f * u
            val cy = headH * 0.78f
            val bg = Paint(Paint.ANTI_ALIAS_FLAG)
            bg.color = (todayColor and 0x00FFFFFF) or (if (pal === WidgetRenderer.DARK) 0x55000000 else 0x30000000)
            cv.drawRoundRect(RectF(ar.titleCx - lw / 2f - 10f * u, cy - ph / 2f, ar.titleCx + lw / 2f + 10f * u, cy + ph / 2f), ph / 2f, ph / 2f, bg)
            hp.color = if (pal === WidgetRenderer.DARK) 0xFFFFFFFF.toInt() else (mixRgb(todayColor or 0xFF000000.toInt(), 0xFF000000.toInt(), 0.72f))
            cv.drawText(label, ar.titleCx, cy - (hp.ascent() + hp.descent()) / 2f, hp)
        }
        // ‹ › : 부드러운 동그란 버튼 위에 크게 (눌러야 하는 자리가 보이게) · 넘길 수 없는 쪽은 흐리게
        val ap = TextPaint(Paint.ANTI_ALIAS_FLAG)
        ap.typeface = Typeface.DEFAULT_BOLD
        ap.textSize = 24f * u
        ap.textAlign = Paint.Align.CENTER
        val ay = headH / 2f - (ap.ascent() + ap.descent()) / 2f
        val btn = Paint(Paint.ANTI_ALIAS_FLAG)
        for (side in 0..1) {
            val ok = if (side == 0) canPrev else canNext
            val x = if (side == 0) ar.prevX else ar.nextX
            btn.color = pal.pill
            btn.alpha = if (ok) 150 else 45
            cv.drawCircle(x, headH / 2f, 15f * u, btn)
            ap.color = pal.fg
            ap.alpha = if (ok) 230 else 60
            cv.drawText(if (side == 0) "‹" else "›", x, ay - 1.5f * u, ap)
        }
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

    /** 오늘 띠: 칸의 둥근 오른쪽 선을 따라 휘는 띠(끝이 가늘어짐). 모양 a~d · 색은 앱 달력과 같은 설정(`today`) */
    private fun drawTodayBand(cv: Canvas, x0: Float, y0: Float, cw: Float, rowH: Float, u: Float, tn: Tune, night: Boolean) {
        val look = todayLook
        val w = (if (look == "a") 3f else if (look == "c") 6f else 4f) * u
        val pct = if (look == "a") 0.42f else if (look == "c") 0.80f else 0.55f
        val gap = 1.2f * u
        val r = 7f * u
        val box = RectF(x0 + gap, y0 + gap, x0 + cw - gap, y0 + rowH - gap)
        val bp = Paint(Paint.ANTI_ALIAS_FLAG)
        bp.color = (todayColor and 0x00FFFFFF) or ((pct * 255).toInt() shl 24)
        // 바깥은 칸의 둥근 모서리(반지름 r) · 안쪽은 가로 반지름만 r-w 인 타원 → 위아래 끝이 0 으로 가늘어지는 초승달 모양 띠 (CSS border-right 와 같은 모양)
        val rt = box.right
        val rw = Math.max(0.5f * u, Math.min(w, r - 0.5f * u))
        val band = android.graphics.Path()
        band.moveTo(rt - r, box.top)
        band.arcTo(RectF(rt - 2f * r, box.top, rt, box.top + 2f * r), -90f, 90f, false)
        band.lineTo(rt, box.bottom - r)
        band.arcTo(RectF(rt - 2f * r, box.bottom - 2f * r, rt, box.bottom), 0f, 90f, false)
        band.arcTo(RectF(rt - r - (r - rw), box.bottom - 2f * r, rt - r + (r - rw), box.bottom), 90f, -90f, false)
        band.lineTo(rt - rw, box.top + r)
        band.arcTo(RectF(rt - r - (r - rw), box.top, rt - r + (r - rw), box.top + 2f * r), 0f, -90f, false)
        band.close()
        cv.drawPath(band, bp)
    }

    private fun drawCell(cv: Canvas, f: Info, x0: Float, y0: Float, cw: Float, rowH: Float, r: Int, plan: WidgetLayout.MonthPlan, pal: WidgetRenderer.Pal, icons: JSONObject?, family: Boolean, isToday: Boolean, u: Float, fill: Boolean, alphaF: Float, tn: Tune) {
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
        val layer = if (f.inMonth) -1 else cv.saveLayerAlpha(RectF(x0, y0, x0 + cw, y0 + rowH), 64)   // 이번 달이 아닌 날은 더 흐리게 (25%)
        val d = f.day
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG)
        val pad = plan.padX
        val holDay = (d?.optString("hol", "") ?: "").isNotEmpty()
        if (fill) {   // 칸 채우기: 일하는 날은 근무 색을 연하게 칸 전체에 · 쉬는 날은 비움 (명절은 칸 전체가 아니라 윗줄 띠 — 아래)
            val tint = if (f.shift.isNotEmpty() && f.circle) mixRgb(f.bg, pal.bg, if (night) 0.30f else 0.24f) else 0
            if (tint != 0) {
                val gap = 1.2f * u
                val box = RectF(x0 + gap, y0 + gap, x0 + cw - gap, y0 + rowH - gap)
                val tp = Paint(Paint.ANTI_ALIAS_FLAG)
                tp.color = (tint and 0x00FFFFFF) or ((alphaF * 255).toInt() shl 24)
                cv.drawRoundRect(box, 7f * u, 7f * u, tp)
            }
        }

        if (fill && holDay) {   // 명절: 앱 달력처럼 날짜 줄에 연분홍 띠 (위 모서리만 둥글게)
            val gap = 1.2f * u
            val bh = Math.min(rowH - 2f * gap, plan.dateBase + plan.dateSize * 0.34f)
            val rr = 7f * u
            val path = Path()
            path.addRoundRect(RectF(x0 + gap, y0 + gap, x0 + cw - gap, y0 + bh), floatArrayOf(rr, rr, rr, rr, 0f, 0f, 0f, 0f), Path.Direction.CW)
            val hp = Paint(Paint.ANTI_ALIAS_FLAG)
            hp.color = ((if (night) 0xFF3A2429.toInt() else 0xFFFCEBEE.toInt()) and 0x00FFFFFF) or ((alphaF * 255).toInt() shl 24)
            cv.drawPath(path, hp)
        }

        if (fill && isToday) drawTodayBand(cv, x0, y0, cw, rowH, u, tn, night)   // 오늘: 오른쪽 가장자리 띠(앱 달력과 같음 · 가장 아래층)

        // 근무: 일하는 날은 동그라미 · 쉬는 날은 글자만 (줄 안에서 높이가 같음 · 모든 동그라미가 같은 크기)
        if (f.shift.isNotEmpty() && plan.circleD > 0f && (f.circle || f.rest)) {
            val cx = x0 + cw / 2f
            val cy = y0 + plan.circleCy[r] + tn.inkY * rowH * 0.1f
            val rad = plan.circleD / 2f
            paint.typeface = Typeface.DEFAULT_BOLD
            paint.textAlign = Paint.Align.CENTER
            if (f.circle) {
                if (fill) {   // 칸 채우기: 동그라미 없이 근무 색을 진하게 한 글자
                    paint.color = inkOf(f.bg, night)
                    paint.typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
                    paint.textSize = rad * 1.12f * tn.ink
                    fitText(paint, f.shift, plan.circleD * 0.9f * tn.ink)
                } else {
                    val cp = Paint(Paint.ANTI_ALIAS_FLAG)
                    cp.color = f.bg
                    val rr2 = Math.min(rad * tn.ink, rad * 1.25f)   // 주야 크기 배율: 동그라미도 같이 (칸에서 넘치지 않게 최대 1.25배)
                    cv.drawCircle(cx, cy, rr2, cp)
                    paint.color = f.fg
                    paint.textSize = rr2 * 1.04f
                    fitText(paint, f.shift, rr2 * 2f * 0.82f)
                }
            } else {
                paint.color = if (fill) (if (night) 0xFFF28B9B.toInt() else 0xFFD9677B.toInt()) else REST_COL
                if (fill) paint.typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
                paint.textSize = rad * 1.24f * tn.ink
                fitText(paint, f.shift, plan.circleD * 1.1f * tn.ink)
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
                cv.drawCircle(cx, cy, Math.min(rad * tn.ink, rad * 1.25f) * (if (fill) 0.98f else 1.06f), rp)
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
        var holW1 = 0f
        if (hol.isNotEmpty() && d != null) {
            h2 = d.optString("h2", "")
            if (h2.isEmpty()) h2 = hol.take(2)
            h1 = d.optString("h1", "")
            if (h1.isEmpty()) h1 = hol.take(1)
            val hp = TextPaint(Paint.ANTI_ALIAS_FLAG)
            hp.textSize = plan.holSize
            holW2 = hp.measureText(h2)
            holW1 = hp.measureText(h1)
        }
        val top = WidgetLayout.monthTop(plan, cw, u, numW, f.stk.size, holW2, holW1)
        statStkHid += Math.max(0, f.stk.size - top.row1 - top.row2)
        for (k in 0 until top.row1) {   // 스티커 첫 줄: 숫자 옆 (오른쪽 끝)
            val sx = x0 + cw - pad - (top.row1 - k) * plan.stkSize - (top.row1 - k - 1) * plan.stkGap - (top.row1 - k - 1) * tn.stkGX * plan.stkSize * 0.25f + tn.stkX * cw * 0.12f
            WidgetRenderer.drawSticker(cv, f.stk[k], sx, y0 + plan.stkTop + tn.stkY * rowH * 0.08f, plan.stkSize, TextPaint(Paint.ANTI_ALIAS_FLAG), icons)
        }
        for (j in 0 until top.row2) {   // 3 · 4번째: 바로 아래 줄 오른쪽 끝 (근무 동그라미 오른쪽 위에 살짝 걸쳐도 스티커가 위에 보임 — 앱 달력 · 7일 위젯과 같음)
            val sx = x0 + cw - pad - (top.row2 - j) * plan.stkSize - (top.row2 - j - 1) * plan.stkGap - (top.row2 - j - 1) * tn.stkGX * plan.stkSize * 0.25f + tn.stkX * cw * 0.12f
            WidgetRenderer.drawSticker(cv, f.stk[top.row1 + j], sx, y0 + plan.stk2Top + tn.stkGY * plan.stkSize * 0.35f + tn.stkY * rowH * 0.08f, plan.stkSize, TextPaint(Paint.ANTI_ALIAS_FLAG), icons)
        }
        paint.typeface = Typeface.DEFAULT_BOLD
        paint.textAlign = Paint.Align.LEFT
        paint.color = dateColor
        paint.textSize = plan.dateSize
        cv.drawText(num, x0 + pad, y0 + plan.dateBase, paint)
        if (hol.isNotEmpty()) {   // 공휴일: 숫자 옆에 빨간 글자 (스티커가 0~1개면 두 글자 · 2개 이상이면 한 글자 — 앱 달력과 같음) · 칸 채우기는 띠 위에 장미빛 굵은 글자
            paint.typeface = if (fill) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
            if (fill) paint.color = if (night) 0xFFE49AAA.toInt() else 0xFFC8627A.toInt()
            paint.textSize = plan.holSize
            if (top.holBeside) cv.drawText(if (top.holChars == 2) h2 else h1, x0 + pad + numW + 2.5f * u, y0 + plan.dateBase, paint)
            else cv.drawText(h1, x0 + pad, y0 + plan.dateBase + plan.holSize * 1.15f, paint)   // 아주 좁은 칸: 숫자 아래 한 글자
        }

        // 메모: 줄 수만큼 (맨 아래부터 쌓음) · 더 있으면 마지막 줄 끝에 "+n" 칩 · 가족 달력의 메모는 연보라 칸
        val shown = Math.min(f.memos.size, plan.lines[r])
        val more = f.memos.size - shown
        statMemoHid += Math.max(0, more)
        val mGap = plan.pillGap + tn.memoG * plan.pillH * 0.25f
        val memoTop0 = y0 + plan.memoTop(shown) + (plan.pillGap - mGap) * Math.max(0, shown - 1)   // 줄 간격을 바꿔도 아래 끝은 그대로
        val memoLow = Math.max(memoTop0, y0 + rowH - (shown * plan.pillH + Math.max(0, shown - 1) * mGap))   // 아래로 내려도 칸 아래 끝까지만 (다음 줄 날짜를 안 덮게)
        val memoTop = Math.min(memoTop0 + tn.memoY * rowH * 0.06f, memoLow)   // 위치(위 − · 아래 +)
        for (k in 0 until shown) {
            val py = memoTop + k * (plan.pillH + mGap)
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
            paint.textSize = Math.min(Math.min(plan.pillH * 0.77f, cw * 0.215f) * tn.memo, plan.pillH * 0.95f)   // 메모 글자 (모양 조정 배율 · 칸 높이를 넘지 않게)
            val chipW = if (more > 0 && k == shown - 1) WidgetLayout.moreBadge(plan.pillH)[0] else 0f
            WidgetRenderer.drawRich(cv, f.memos[k], x0 + pad * 1.4f + barW, py + plan.pillH * 0.74f, cw - pad * 2.6f - barW - (if (chipW > 0f) chipW + plan.pillH * 0.15f else 0f), paint, pal.fg, pal.link)
            if (chipW > 0f) WidgetRenderer.drawMoreChip(cv, more, x0 + cw - pad - plan.pillH * 0.12f, py, plan.pillH, pal)
        }
        if (layer >= 0) cv.restoreToCount(layer)
    }
}
