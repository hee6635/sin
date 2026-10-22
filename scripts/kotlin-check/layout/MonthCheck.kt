// 한 달 위젯 칸 배치(WidgetLayout.solveMonth · monthTop)를 컴퓨터에서 확인하는 도구 (안드로이드 없이 JVM 으로 실행)
//  · 무작위 크기 · 내용으로 겹침 · 넘침 검사
//  · 대표 크기 몇 개는 그림(PNG)으로 저장 — 실제 그리기(MonthWidget.kt)와 같은 식으로 그린 복제본
// 실행: bash scripts/kotlin-check/layout/run-layout.sh   (결과 그림은 scratchpad/widget-preview/ 의 month_*.png)
package monthcheck

import com.eonjeswieo.app.WidgetLayout
import java.awt.BasicStroke
import java.awt.Color
import java.awt.Font
import java.awt.Graphics2D
import java.awt.RenderingHints
import java.awt.geom.Ellipse2D
import java.awt.geom.RoundRectangle2D
import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO

private fun font(bold: Boolean, size: Float) = Font("SansSerif", if (bold) Font.BOLD else Font.PLAIN, 12).deriveFont(size)

/** 한 칸에 들어가는 내용 */
class MDay(val d: Int, val dow: Int, val shift: String = "", val rest: Boolean = false, val stk: Int = 0, val hol: String = "", val memos: List<String> = emptyList(), val out: Boolean = false, val today: Boolean = false, val fam: Boolean = false)

private class Rc(val x0: Float, val y0: Float, val x1: Float, val y1: Float) {
    fun hit(o: Rc) = x0 < o.x1 - 0.5f && x1 > o.x0 + 0.5f && y0 < o.y1 - 0.5f && y1 > o.y0 + 0.5f
}

private fun circleHits(cx: Float, cy: Float, r: Float, q: Rc): Boolean {
    val nx = Math.max(q.x0, Math.min(cx, q.x1)); val ny = Math.max(q.y0, Math.min(cy, q.y1))
    return Math.hypot((cx - nx).toDouble(), (cy - ny).toDouble()) < r - 0.5f
}

var mProblems = 0
private fun bad(msg: String) { mProblems++; println("  ✗ $msg") }

/** 한 칸의 안쪽 그림들의 사각형 (겹침 검사용) — 글자 폭은 자바 글꼴로 잼 */
private class CellBox(val num: Rc, val stickers: List<Rc>, val row2: List<Rc>, val hol: Rc?, val circle: Triple<Float, Float, Float>?, val memos: List<Rc>)

private fun cellBox(g: Graphics2D, plan: WidgetLayout.MonthPlan, cw: Float, rowH: Float, u: Float, r: Int, d: MDay, hasCircle: Boolean): CellBox {
    g.font = font(true, plan.dateSize)
    val num = d.d.toString()
    val numW = g.fontMetrics.stringWidth(num).toFloat()
    val numRc = Rc(plan.padX, plan.dateBase - plan.dateSize * 0.8f, plan.padX + numW, plan.dateBase + plan.dateSize * 0.02f)   // 숫자는 기준선 아래로 내려가는 부분이 없음
    var holW2 = 0f
    var holW1 = 0f
    var hol2 = ""
    if (d.hol.isNotEmpty()) { hol2 = d.hol.take(2); g.font = font(false, plan.holSize); holW2 = g.fontMetrics.stringWidth(hol2).toFloat(); holW1 = g.fontMetrics.stringWidth(d.hol.take(1)).toFloat() }
    val top = WidgetLayout.monthTop(plan, cw, u, numW, d.stk, holW2, holW1)
    val sk = ArrayList<Rc>()
    for (k in 0 until top.row1) {
        val sx = cw - plan.padX - (top.row1 - k) * plan.stkSize - (top.row1 - k - 1) * plan.stkGap
        sk.add(Rc(sx, plan.stkTop, sx + plan.stkSize, plan.stkTop + plan.stkSize))
    }
    val sk2 = ArrayList<Rc>()   // 3 · 4번째: 바로 아래 줄 오른쪽 끝
    for (j in 0 until top.row2) {
        val sx = cw - plan.padX - (top.row2 - j) * plan.stkSize - (top.row2 - j - 1) * plan.stkGap
        val sy = plan.stk2Top
        sk2.add(Rc(sx, sy, sx + plan.stkSize, sy + plan.stkSize))
    }
    var holRc: Rc? = null
    if (d.hol.isNotEmpty()) {
        g.font = font(false, plan.holSize)
        if (top.holBeside) { val lx = plan.padX + numW + 2.5f * u; holRc = Rc(lx, plan.dateBase - plan.holSize * 0.85f, lx + (if (top.holChars == 2) holW2 else holW1), plan.dateBase + plan.holSize * 0.2f) }
        else { val b = plan.dateBase + plan.holSize * 1.15f; val w1 = g.fontMetrics.stringWidth(d.hol.take(1)).toFloat(); holRc = Rc(plan.padX, b - plan.holSize * 0.85f, plan.padX + w1, b + plan.holSize * 0.2f) }
    }
    val circ = if (d.shift.isNotEmpty() && !d.rest && plan.circleD > 0f) Triple(cw / 2f, plan.circleCy[r], plan.circleD / 2f) else null
    val shown = Math.min(d.memos.size, plan.lines[r])
    val mt = plan.memoTop(shown)
    val mm = ArrayList<Rc>()
    for (k in 0 until shown) { val py = mt + k * (plan.pillH + plan.pillGap); mm.add(Rc(plan.padX, py, cw - plan.padX, py + plan.pillH)) }
    return CellBox(numRc, sk, sk2, holRc, circ, mm)
}

private fun checkCell(tag: String, b: CellBox, plan: WidgetLayout.MonthPlan, cw: Float, rowH: Float, u: Float, f: (String) -> Unit) {
    for (s in b.row2) {   // 둘째 줄: 칸 안 · 숫자 · 공휴일 글자 · 메모와 안 겹침 · 근무 동그라미 가운데 선(글자 높이)보다는 위
        if (s.x1 > cw + 0.5f || s.x0 < -0.5f) f("$tag 둘째 줄 스티커가 칸 밖")
        if (b.num.hit(s)) f("$tag 날짜 숫자와 둘째 줄 스티커가 겹침")
        if (b.hol != null && b.hol.hit(s)) f("$tag 공휴일 글자와 둘째 줄 스티커가 겹침")
        for (m in b.memos) if (m.hit(s)) f("$tag 메모와 둘째 줄 스티커가 겹침")
        for (t in b.stickers) if (t.hit(s)) f("$tag 첫 줄과 둘째 줄 스티커가 겹침")
        if (s.y1 > plan.bottom + 0.5f) f("$tag 둘째 줄 스티커가 칸 아래로 나감")
        val c2 = b.circle
        if (c2 != null && s.y1 > c2.second + 0.5f) f("$tag 둘째 줄 스티커가 근무 동그라미 가운데 선(${c2.second / u}dp)보다 아래로 내려옴 ${s.y1 / u}dp")
    }
    for (s in b.stickers) {
        if (s.x1 > cw + 0.5f || s.x0 < -0.5f) f("$tag 스티커가 칸 밖")
        if (b.num.hit(s)) f("$tag 날짜 숫자와 스티커가 겹침")
        if (s.y1 > plan.dateBottom + 0.5f) f("$tag 스티커가 날짜 줄(${plan.dateBottom / u}dp)보다 아래")
    }
    val h = b.hol
    if (h != null) {
        if (h.x1 > cw - plan.padX + 0.5f) f("$tag 공휴일 글자가 칸 밖")
        for (s in b.stickers) if (h.hit(s)) f("$tag 공휴일 글자와 스티커가 겹침")
        for (s in b.row2) if (h.hit(s)) f("$tag 공휴일 글자와 둘째 줄 스티커가 겹침")
        if (b.num.hit(h)) f("$tag 공휴일 글자와 날짜 숫자가 겹침")
        if (b.circle != null && circleHits(b.circle.first, b.circle.second, b.circle.third, h)) f("$tag 공휴일 글자와 근무 동그라미가 겹침")
        for (m in b.memos) if (h.hit(m)) f("$tag 공휴일 글자와 메모가 겹침")
    }
    val c = b.circle
    if (c != null) {
        if (c.second - c.third < plan.dateBottom - 0.5f) f("$tag 동그라미가 날짜 줄을 침범")
        if (c.second + c.third > plan.bottom + 0.5f) f("$tag 동그라미가 칸 아래로 나감")
        if (c.third * 2f > cw + 0.5f) f("$tag 동그라미가 칸보다 큼")
        for (m in b.memos) if (m.y0 < c.second + c.third - 0.5f && m.y1 > c.second - c.third + 0.5f && circleHits(c.first, c.second, c.third, m)) f("$tag 동그라미가 메모와 겹침")
        for (s in b.stickers) if (circleHits(c.first, c.second, c.third, s)) f("$tag 동그라미가 첫 줄 스티커와 겹침")   // (둘째 줄은 앱 달력처럼 동그라미 오른쪽 위에 살짝 걸쳐도 됨 — 위에서 가운데 선까지만 검사)
        if (circleHits(c.first, c.second, c.third, b.num)) f("$tag 동그라미가 날짜 숫자와 겹침")
    }
    for (m in b.memos) { if (m.y1 > plan.bottom + 0.5f) f("$tag 메모가 칸 아래로 나감"); if (m.y0 < plan.dateBottom - 0.5f) f("$tag 메모가 날짜 줄을 침범") }
}

/** 달력 줄 수: java.time 으로 따로 계산한 값과 같아야 함 (2020~2040년 모든 달 · 일요일 / 월요일 시작) */
fun weeksCheck(): Int {
    var f = 0
    var n = 0
    for (y in 2020..2040) for (m in 1..12) for (ws in 0..1) {
        val first = java.time.LocalDate.of(y, m, 1)
        val lead = ((first.dayOfWeek.value % 7) - ws + 7) % 7   // 일요일 = 0
        val want = (lead + first.lengthOfMonth() + 6) / 7
        val got = WidgetLayout.monthWeeks(y, m - 1, ws)
        n++
        if (got != want) { f++; if (f < 6) println("  ✗ ${y}년 ${m}월 ws=$ws 줄 수 $got (기대 $want)") }
        if (got < 4 || got > 6) { f++; println("  ✗ ${y}년 ${m}월 줄 수가 4~6이 아님 $got") }
    }
    println(if (f == 0) "달력 줄 수: ${n}개 달 모두 맞음" else "달력 줄 수 실패 ${f}개")
    return f
}

/** 맨 윗줄 화살표(‹ ›)가 자기 눌리는 칸(앞 달 칸 · 다음 달 칸) 안에 있고 제목 글자와 안 겹치는지: 폭 250~900dp · 이름 칩 있음/없음 · 제목 글자 폭 70~130dp */
fun arrowsCheck(): Int {
    var f = 0
    var n = 0
    val u = 2.75f
    val half = 6f * u
    for (chip in listOf(false, true)) {
        var wd = 250
        while (wd <= 900) {
            var tw = 70
            while (tw <= 130) {
                val w = wd * u
                val twPx = Math.min(tw * u, WidgetLayout.monthTitleMax(w, u, chip))   // 그리는 쪽이 너무 넓은 제목은 줄여서 그림
                val a = WidgetLayout.monthArrows(w, u, chip, twPx)
                val chipZone = if (chip) WidgetLayout.MONTH_CHIP_ZONE_DP * u else 0f
                val cx = chipZone + (w - chipZone) / 2f
                val zoneHalf = WidgetLayout.MONTH_TITLE_ZONE_DP * u / 2f
                n++
                fun bad(m: String) { f++; if (f < 8) println("  ✗ 화살표 폭 ${wd}dp 칩 $chip 제목 ${tw}dp: $m") }
                if (Math.abs(a.titleCx - cx) > 0.01f) bad("제목 가운데가 눌리는 칸 가운데와 다름")
                if (a.prevX < chipZone + half - 0.5f || a.prevX > cx - zoneHalf - half + 0.5f) bad("앞 달 화살표가 앞 달 칸 밖 ${a.prevX / u}dp (칸 ${(chipZone + half) / u} ~ ${(cx - zoneHalf - half) / u})")
                if (a.nextX < cx + zoneHalf + half - 0.5f || a.nextX > w - half + 0.5f) bad("다음 달 화살표가 다음 달 칸 밖 ${a.nextX / u}dp (칸 ${(cx + zoneHalf + half) / u} ~ ${(w - half) / u})")
                if (a.prevX + half > cx - twPx / 2f + 2f * u) bad("앞 달 화살표가 제목 글자와 겹침")
                if (a.nextX - half < cx + twPx / 2f - 2f * u) bad("다음 달 화살표가 제목 글자와 겹침")
                if (a.prevX < half || a.nextX > w - half + 0.5f) bad("화살표가 위젯 밖")
                tw += 3
            }
            wd += 7
        }
    }
    println(if (f == 0) "화살표 위치: ${n}가지(폭 · 칩 · 제목 폭) 모두 자기 눌리는 칸 안 · 제목과 안 겹침" else "화살표 위치 실패 ${f}개")
    return f
}

/**
 * 근무 동그라미 크기: 칸이 넉넉하면 "칸 폭의 절반 · 칸 높이의 40% 중 작은 쪽"까지(상한 44dp) 커지고,
 * 칸이 작은 폰 크기에서는 상한에 안 걸려서 예전 값 그대로 (v0.74 에서 상한을 26dp → 44dp 로 올림 — 큰 위젯에서만 달라짐).
 * 기대값은 메모 줄 규칙(2줄은 동그라미가 17dp 이상 남을 때만)까지 포함한 값이라, 그 규칙을 바꾸면 같이 고칠 것.
 */
fun circleSizeCheck(): Int {
    var f = 0
    val u = 2.75f
    class Case(val name: String, val cwDp: Float, val rowHDp: Float, val rowMemos: IntArray, val want: Float)
    val cases = listOf(
        Case("큰 위젯(접이식 안쪽 545x561): 칸 폭의 절반", 76.7f, 100.2f, intArrayOf(1, 2, 2, 2, 1), 38.35f),
        Case("큰 위젯 메모 없음", 76.7f, 100.2f, intArrayOf(0, 0, 0, 0, 0), 38.35f),
        Case("아주 큰 위젯(700x640): 상한 44dp", 98.9f, 116f, intArrayOf(1, 2, 2, 2, 1), 44f),
        Case("폰 4x4(340x330): 예전과 같음", 47.4f, 54f, intArrayOf(0, 0, 1, 1, 1), 19.6f),
        Case("세로로 길게(340x440): 예전과 같음", 47.4f, 76f, intArrayOf(0, 0, 2, 2, 1), 23.7f),
        Case("중간(420x400): 예전과 같음", 58.9f, 68f, intArrayOf(1, 2, 2, 2, 1), 17.95f),
        Case("가장 작게(250x250): 예전과 같음", 34.5f, 38f, intArrayOf(0, 0, 0, 0, 0), 15.2f)
    )
    for (c in cases) {
        val p = WidgetLayout.solveMonth(c.rowMemos, c.cwDp * u, c.rowHDp * u, u, true, 2)
        val got = p.circleD / u
        if (Math.abs(got - c.want) > 0.1f) { f++; println("  ✗ 동그라미 크기 ${c.name}: ${got}dp (기대 ${c.want}dp)") }
    }
    // 어떤 칸 크기 · 메모 수에서도 동그라미는 칸 폭의 절반 · 44dp 를 넘지 않음
    for (w in 30..140 step 5) for (h in 30..140 step 5) for (memos in listOf(intArrayOf(0, 0, 0, 0, 0), intArrayOf(1, 1, 1, 1, 1), intArrayOf(2, 2, 2, 2, 2))) {
        val d = WidgetLayout.solveMonth(memos, w * u, h * u, u, true, 2).circleD / u
        if (d > Math.min(w * 0.5f, 44f) + 0.01f) { f++; println("  ✗ 동그라미가 칸 폭의 절반 · 44dp 보다 큼: 칸 ${w}x${h}dp → ${d}dp") }
    }
    println(if (f == 0) "동그라미 크기: 큰 위젯은 칸 폭의 절반(상한 44dp) · 폰 크기는 예전과 같음" else "동그라미 크기 실패 ${f}개")
    return f
}

fun monthFuzz(): Int {
    val rnd = java.util.Random(11)
    var fails = weeksCheck() + arrowsCheck() + circleSizeCheck()
    val u = 2.75f
    val img = BufferedImage(10, 10, BufferedImage.TYPE_INT_ARGB)
    val g = img.createGraphics()
    g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON)
    var lines0 = 0; var lines1 = 0; var lines2 = 0; var small = 0
    val kinds = HashMap<String, Int>()
    val holNames = listOf("개천", "한글", "설날", "추석", "대체", "연휴", "어린", "성탄", "삼일", "광복")
    for (n in 0 until 3000) {
        val cwDp = 33f + rnd.nextFloat() * 100f
        val rowHDp = 28f + rnd.nextFloat() * 110f
        val rows = 4 + rnd.nextInt(3)
        val rowMemos = IntArray(rows) { if (rnd.nextInt(3) == 0) 0 else rnd.nextInt(5) }
        val hasCircle = rnd.nextInt(6) != 0
        val memoMax = 1 + rnd.nextInt(2)
        val cw = cwDp * u; val rowH = rowHDp * u
        val p = WidgetLayout.solveMonth(rowMemos, cw, rowH, u, hasCircle, memoMax)
        val tag = "cw=${"%.1f".format(cwDp)} rowH=${"%.1f".format(rowHDp)} rows=$rows memoMax=$memoMax"
        fun f(m: String) { fails++; val kind = m.substringAfter(":", m).trim().replace(Regex("[0-9.]+"), "#"); kinds[kind] = (kinds[kind] ?: 0) + 1; if (kinds[kind] == 1) println("  ✗ $tag: $m") }
        if (p.circleD > 0f != hasCircle && hasCircle && rowHDp >= 36f) f("동그라미가 없어짐 (칸 높이 ${rowHDp}dp)")
        for (r in 0 until rows) {
            if (p.lines[r] > Math.min(memoMax, 3) || p.lines[r] != p.lines[0]) f("줄 $r 메모 줄 수가 다른 줄과 다름 ${p.lines[r]}")
            if (p.lines[r] > 0 && p.memoTop(p.lines[r]) < p.dateBottom - 0.5f) f("메모가 날짜 줄을 침범")
            if (p.circleD > 0f) {
                if (p.circleCy[r] - p.circleD / 2 < p.dateBottom - 0.5f) f("줄 $r 동그라미가 날짜 줄 위로")
                val low = if (p.lines[r] > 0) p.memoTop(p.lines[r]) else p.bottom
                if (p.circleCy[r] + p.circleD / 2 > low + 0.5f) f("줄 $r 동그라미가 메모 아래로 (${p.circleCy[r] + p.circleD / 2} > $low)")
            }
        }
        if (hasCircle && rowHDp >= 30f && cwDp >= 34f && p.circleD < 11.5f * u) { small++; f("동그라미가 너무 작음 ${p.circleD / u}dp") }
        if (p.lines.any { it > 0 } && p.pillH < 9f * u - 0.5f) f("메모 줄이 너무 낮음 ${p.pillH / u}dp")
        if (rowHDp >= 70f && cwDp >= 40f && (cwDp < 58f || rowHDp >= 100f) && p.lines[0] < Math.min(memoMax, 2)) f("크고 넉넉한데 메모 줄이 모자람 ${p.lines.toList()} (최대 ${memoMax})")
        if (p.dateSize < 6f * u) f("날짜 숫자가 너무 작음 ${p.dateSize / u}dp")
        lines0 += p.lines.count { it == 0 && true }; lines1 += p.lines.count { it == 1 }; lines2 += p.lines.count { it >= 2 }
        // 내용이 달라도(스티커 · 공휴일 · 날짜) 줄 안 · 줄끼리 칸 모양은 같고, 칸 안 그림끼리 겹치지 않아야 함
        for (r in 0 until rows) for (stk in 0..4) for (hol in 0..1) {
            val dd = MDay(1 + rnd.nextInt(31), rnd.nextInt(7), if (hasCircle) "주" else "", false, stk, if (hol == 1) holNames[rnd.nextInt(holNames.size)] else "", List(rowMemos[r]) { "메모$it" })
            checkCell(tag + " 줄$r 스티커$stk 휴일$hol:", cellBox(g, p, cw, rowH, u, r, dd, hasCircle), p, cw, rowH, u) { m -> f(m) }
        }
    }
    println("한 달 칸(무작위 3000개): 메모 줄 수 — 0줄 $lines0 · 1줄 $lines1 · 2줄 $lines2 (줄 단위)")
    for ((k, v) in kinds) println("    · $k : $v")
    println(if (fails == 0) "한 달 무작위 3000개: 겹침 · 넘침 없음" else "한 달 무작위 시험 실패 ${fails}개")
    return fails
}

class Pm(val bg: Int, val fg: Int, val sub: Int, val pill: Int, val sun: Int, val sat: Int, val line: Int, val chip: Int, val chipFg: Int, val todayBg: Int, val famPill: Int, val rest: Int)
val LIGHTM = Pm(0xFFFFFF, 0x1F2328, 0x8A919A, 0xEAECEF, 0xD6334A, 0x3B6FD6, 0xE3E5E8, 0x6B7380, 0xFFFFFF, 0xE3F5EF, 0xEDE8FF, 0xE5484D)
val DARKM = Pm(0x23282E, 0xF2F4F7, 0x9AA3AD, 0x39414A, 0xFF6B7F, 0x7BA2FF, 0x3A424B, 0xB4BCC6, 0x23282E, 0x1E3A31, 0x3A3360, 0xE5484D)
private fun col(v: Int, a: Float = 1f) = Color((v shr 16) and 255, (v shr 8) and 255, v and 255, (a * 255).toInt())

/** 대표 크기 그림 (MonthWidget.kt 의 그리는 순서 · 식과 같게) */
fun renderMonth(name: String, wDp: Int, hDp: Int, title: String, days: List<MDay>, ws: Int, pal: Pm, out: File, chip: Pair<String, Int>? = null, dens: Float = 2.75f, memoMax: Int = 2): Boolean {
    val u = dens
    val w = (wDp * u).toInt(); val h = (hDp * u).toInt()
    val img = BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB)
    val g = img.createGraphics()
    g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON)
    g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON)
    g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON)
    g.color = Color(0xCFD3DA); g.fillRect(0, 0, w, h)
    val rr = Math.min(Math.min(w, h) * 0.12f, 22f * u)
    g.color = col(pal.bg); g.fill(RoundRectangle2D.Float(0f, 0f, w.toFloat(), h.toFloat(), rr, rr))
    // 머리줄
    val headH = 36f * u
    val chipZone = if (chip != null) 104f * u else 0f
    g.font = font(true, 16f * u); g.color = col(pal.fg)
    var tw = g.fontMetrics.stringWidth(title).toFloat()
    val maxTw = WidgetLayout.monthTitleMax(w.toFloat(), u, chip != null)
    if (tw > maxTw) { g.font = font(true, 16f * u * maxTw / tw); tw = g.fontMetrics.stringWidth(title).toFloat() }
    val ar = WidgetLayout.monthArrows(w.toFloat(), u, chip != null, tw)   // 화살표는 칩이 있든 없든 제목 바로 옆 (MonthWidget.kt 와 같은 식)
    g.drawString(title, ar.titleCx - tw / 2f, 24f * u)
    g.font = font(true, 24f * u); g.color = col(pal.fg, 0.78f)
    g.drawString("‹", ar.prevX - g.fontMetrics.stringWidth("‹") / 2f, 26f * u)
    g.drawString("›", ar.nextX - g.fontMetrics.stringWidth("›") / 2f, 26f * u)
    if (chip != null) {
        g.font = font(true, 11.5f * u)
        var nw = g.fontMetrics.stringWidth(chip.first).toFloat()
        val cwid = Math.min(96f * u, 6f * u + 8f * u + 4f * u + nw + 4f * u + 7f * u + 6f * u)
        g.color = col(pal.pill); g.fill(RoundRectangle2D.Float(8f * u, 7f * u, cwid, 22f * u, 11f * u, 11f * u))
        g.color = col(chip.second); g.fill(Ellipse2D.Float(8f * u + 6f * u, 18f * u - 4f * u, 8f * u, 8f * u))
        g.color = col(pal.fg); g.drawString(chip.first, 8f * u + 18f * u, 18f * u + 4.2f * u)
        g.color = col(pal.sub); val tx = 8f * u + 18f * u + nw + 4f * u
        g.fill(java.awt.Polygon(intArrayOf(tx.toInt(), (tx + 7f * u).toInt(), (tx + 3.5f * u).toInt()), intArrayOf((18f * u - 2f * u).toInt(), (18f * u - 2f * u).toInt(), (18f * u + 2.5f * u).toInt()), 3))
    }
    // 요일 줄
    val side = 4f * u; val cw = (w - 2 * side) / 7f
    val names = arrayOf("일", "월", "화", "수", "목", "금", "토")
    g.font = font(true, 11f * u)
    for (i in 0 until 7) { val wd = (i + ws) % 7; g.color = col(if (wd == 0) pal.sun else if (wd == 6) pal.sat else pal.sub); g.drawString(names[wd], side + cw * i + cw / 2 - g.fontMetrics.stringWidth(names[wd]) / 2f, headH + 13f * u) }
    val rows = days.size / 7
    val top = headH + 18f * u
    val rowH = (h - top - 6f * u) / rows
    val hasCircle = days.any { it.shift.isNotEmpty() && !it.rest }
    val rowMemos = IntArray(rows) { r -> (0 until 7).maxOf { days[r * 7 + it].memos.size } }
    val plan = WidgetLayout.solveMonth(rowMemos, cw, rowH, u, hasCircle, memoMax)
    var ok = true
    fun f(m: String) { ok = false; bad("$name: $m") }
    var anyFail = false
    for ((idx, d) in days.withIndex()) {
        val r = idx / 7; val c = idx % 7
        val x0 = side + cw * c; val y0 = top + rowH * r
        val a = if (d.out) 0.4f else 1f
        if (d.today) {
            val inset = 1.5f * u
            g.color = col(pal.todayBg); g.fill(RoundRectangle2D.Float(x0 + inset, y0 + inset, cw - 2 * inset, rowH - 2 * inset, 8f * u, 8f * u))
            g.color = col(0x2A8C6F); g.stroke = BasicStroke(1.6f * u); g.draw(RoundRectangle2D.Float(x0 + inset, y0 + inset, cw - 2 * inset, rowH - 2 * inset, 8f * u, 8f * u)); g.stroke = BasicStroke(1f)
        }
        if (r > 0) { g.color = col(pal.line, 0.9f); g.fillRect((x0 + 3f * u).toInt(), y0.toInt(), (cw - 6f * u).toInt(), Math.max(1, (0.7f * u).toInt())) }
        val isRed = d.hol.isNotEmpty() || d.dow == 0
        val box = cellBox(g, plan, cw, rowH, u, r, d, hasCircle)
        checkCell("$name ${d.d}일:", box, plan, cw, rowH, u) { m -> if (!anyFail) { anyFail = true }; f(m) }
        // 근무
        if (d.shift.isNotEmpty()) {
            val dd = plan.circleD; val cy = y0 + plan.circleCy[r]
            if (d.rest) { g.color = col(pal.rest, a); g.font = font(true, dd * 0.62f * 1.0f); val rw = g.fontMetrics.stringWidth(d.shift); g.drawString(d.shift, x0 + cw / 2f - rw / 2f, cy + dd * 0.22f) }
            else if (dd > 0f) { g.color = col(if (d.shift == "야") 0xB8A59D else 0xA9BEC8, a); g.fill(Ellipse2D.Float(x0 + cw / 2f - dd / 2f, cy - dd / 2f, dd, dd)); g.color = col(0x1F2328, a); g.font = font(true, dd * 0.52f); g.drawString(d.shift, x0 + cw / 2f - g.fontMetrics.stringWidth(d.shift) / 2f, cy + dd * 0.19f) }
        }
        // 스티커
        val stkCols = listOf(0xF4B400, 0x26A69A)
        for ((k, s) in (box.stickers + box.row2).withIndex()) { g.color = col(stkCols[k % 2], a); g.fill(RoundRectangle2D.Float(x0 + s.x0, y0 + s.y0, s.x1 - s.x0, s.y1 - s.y0, 3f * u, 3f * u)) }
        // 날짜 · 공휴일 글자
        g.color = col(if (isRed) pal.sun else if (d.dow == 6) pal.sat else pal.fg, a); g.font = font(true, plan.dateSize)
        g.drawString(d.d.toString(), x0 + plan.padX, y0 + plan.dateBase)
        val hb = box.hol
        if (hb != null) { g.color = col(pal.sun, a); g.font = font(false, plan.holSize); val wide = (hb.x1 - hb.x0) > plan.holSize * 1.3f; g.drawString(if (wide) d.hol.take(2) else d.hol.take(1), x0 + hb.x0, y0 + hb.y1 - plan.holSize * 0.2f) }
        // 메모
        val shown = Math.min(d.memos.size, plan.lines[r]); val more = d.memos.size - shown
        for (k in 0 until shown) {
            val py = y0 + plan.memoTop(shown) + k * (plan.pillH + plan.pillGap)
            g.color = col(if (d.fam) pal.famPill else pal.pill, a); g.fill(RoundRectangle2D.Float(x0 + plan.padX, py, cw - 2 * plan.padX, plan.pillH, plan.pillH * 0.3f, plan.pillH * 0.3f))
            g.font = font(false, Math.min(plan.pillH * 0.72f, cw * 0.2f)); g.color = col(pal.fg, a)
            var room = cw - plan.padX * 2.6f
            val chipOn = more > 0 && k == shown - 1
            if (chipOn) room -= WidgetLayout.moreBadge(plan.pillH)[0] + plan.pillH * 0.15f
            var t = d.memos[k]
            while (g.fontMetrics.stringWidth(t) > room && t.length > 1) t = t.dropLast(if (t.endsWith("…")) 2 else 1) + "…"
            g.drawString(t, x0 + plan.padX * 1.4f, py + plan.pillH * 0.72f)
            if (chipOn) {
                val bg = WidgetLayout.moreBadge(plan.pillH); val right = x0 + cw - plan.padX - plan.pillH * 0.12f
                g.color = col(pal.chip, a); g.fill(RoundRectangle2D.Float(right - bg[0], py + (plan.pillH - bg[1]) / 2f, bg[0], bg[1], bg[1], bg[1]))
                g.color = col(pal.chipFg, a); g.font = font(true, bg[1] * 0.66f)
                val lab = WidgetLayout.moreLabel(more); g.drawString(lab, right - bg[0] / 2f - g.fontMetrics.stringWidth(lab) / 2f, py + plan.pillH / 2f + bg[1] * 0.24f)
            }
        }
    }
    println(String.format("  %-38s %3dx%-3ddp 줄%d  칸 %.1fx%.1fdp  날짜 %.1fdp  동그라미 %.1fdp  메모 %s줄 %s", name, wDp, hDp, rows, cw / u, rowH / u, plan.dateSize / u, plan.circleD / u, plan.lines.toList(), if (ok) "" else "✗"))
    g.dispose()
    ImageIO.write(img, "png", out)
    return ok
}

fun monthMain(out: File) {
    mProblems += monthFuzz()
    out.mkdirs()
    // 2026년 10월 (일요일 시작 · 5주) — 이전 시안과 같은 내용
    val sh = "휴주주휴휴야야" + "휴주주주휴휴야" + "야휴주주주휴휴" + "야야휴휴주주주" + "휴야야휴휴주주"
    val memos = mapOf(16 to listOf("10시 치과", "11시 자동차검사"), 17 to listOf("07시 봉사활동"), 21 to listOf("윤슬 운동회", "야야야", "더더더도 젖너너"), 29 to listOf("11시30분 대장"))
    val stk = mapOf(13 to 2, 14 to 1, 18 to 1, 22 to 2, 9 to 1)
    val hol = mapOf(3 to "개천", 5 to "대체", 9 to "한글")
    val dd = (27..30).toList() + (1..31).toList()
    fun oct(): List<MDay> = (0 until 35).map { i ->
        val dnum = dd[i]; val o = i < 4
        MDay(dnum, i % 7, sh[i].toString(), sh[i] == '휴', if (o) 0 else stk[dnum] ?: 0, if (o) "" else hol[dnum] ?: "", if (o) emptyList() else memos[dnum] ?: emptyList(), o, !o && dnum == 18)
    }
    renderMonth("폰 4x4 (340x330) 5주", 340, 330, "2026년 10월", oct(), 0, LIGHTM, File(out, "month_a_light.png"))
    renderMonth("어둡게", 340, 330, "2026년 10월", oct(), 0, DARKM, File(out, "month_b_dark.png"))
    renderMonth("세로로 길게 (340x440)", 340, 440, "2026년 10월", oct(), 0, LIGHTM, File(out, "month_c_tall.png"))
    renderMonth("가장 작게 (250x250)", 250, 250, "2026년 10월", oct(), 0, LIGHTM, File(out, "month_d_min.png"))
    renderMonth("좁은 폰 (285x320)", 285, 320, "2026년 10월", oct(), 0, LIGHTM, File(out, "month_e_narrow.png"))
    renderMonth("가로로 넓게 (600x330)", 600, 330, "2026년 10월", oct(), 0, LIGHTM, File(out, "month_f_wide.png"))
    renderMonth("큰 위젯 · 접이식 안쪽 (545x561)", 545, 561, "2026년 10월", oct(), 0, LIGHTM, File(out, "month_l_big.png"))
    // 6주짜리 달 (2026년 8월: 토요일 시작) — 맨 앞 줄이 일요일부터
    val aug = (0 until 42).map { i ->
        val dn = if (i < 6) 26 + i else if (i - 5 <= 31) i - 5 else i - 36
        val o = i < 6 || i - 5 > 31
        val s = "주주야야휴휴"[i % 6].toString()
        MDay(dn, i % 7, s, s == "휴", if (o) 0 else if (dn % 5 == 0) 2 else if (dn % 7 == 0) 1 else 0, if (o) "" else if (dn == 15) "광복" else "", if (o) emptyList() else if (dn % 6 == 0) listOf("메모 하나", "둘째 메모") else if (dn % 9 == 0) listOf("치과") else emptyList(), o, !o && dn == 18)
    }
    renderMonth("6주 달 폰 4x4 (340x330)", 340, 330, "2026년 8월", aug, 0, LIGHTM, File(out, "month_g_6weeks.png"))
    renderMonth("6주 달 세로로 길게 (340x440)", 340, 440, "2026년 8월", aug, 0, LIGHTM, File(out, "month_h_6weeks_tall.png"))
    renderMonth("6주 달 큰 위젯 (545x561)", 545, 561, "2026년 8월", aug, 0, LIGHTM, File(out, "month_m_6weeks_big.png"))
    // 아빠 달력 (이름 칩 · 가족 메모(♥) 보라색 칸)
    val dad = (0 until 35).map { i ->
        val dnum = dd[i]; val o = i < 4
        val s = "주주야야휴휴"[(i + 2) % 6].toString()
        MDay(dnum, i % 7, s, s == "휴", if (o) 0 else if (dnum == 13) 1 else if (dnum == 22) 1 else 0, if (o) "" else hol[dnum] ?: "", if (o) emptyList() else if (dnum == 10) listOf("♥ 할머니 댁") else if (dnum == 24) listOf("♥ 가족 외식") else emptyList(), o, !o && dnum == 18, true)
    }
    renderMonth("내 달력 + 칩(나)", 340, 330, "2026년 10월", oct(), 0, LIGHTM, File(out, "month_i_me_chip.png"), Pair("나", 0x1D2330))
    renderMonth("아빠 달력 + 칩(아빠)", 340, 330, "2026년 10월", dad, 0, LIGHTM, File(out, "month_j_dad_chip.png"), Pair("아빠", 0x7E57C2))
    renderMonth("칩(여섯 글자 이름) 가장 작게", 250, 250, "2026년 10월", dad, 0, LIGHTM, File(out, "month_k_chip_min.png"), Pair("친정어머니", 0xF28B82))
}

fun main(args: Array<String>) {
    monthMain(File(args.getOrElse(0) { "/tmp/widget-preview" }))
    println(if (mProblems == 0) "한 달 위젯: 문제 없음" else "한 달 위젯: 문제 ${mProblems}개")
    System.exit(if (mProblems == 0) 0 else 1)
}
