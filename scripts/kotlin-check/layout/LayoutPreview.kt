// 위젯 칸 배치(WidgetLayout.kt)를 컴퓨터에서 그림으로 확인하고 겹침 · 넘침을 검사하는 도구 (안드로이드 없이 JVM 으로 실행)
// 실행: bash tests/android/run-layout.sh   (결과 그림은 /tmp/claude-.../scratchpad/widget-preview/)
import com.eonjeswieo.app.WidgetLayout
import java.awt.BasicStroke
import java.awt.Color
import java.awt.Font
import java.awt.RenderingHints
import java.awt.geom.RoundRectangle2D
import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO

class Dy(val d: Int, val dow: Int, val stk: Int = 0, val hol: String = "", val memos: Int = 0, val circle: String = "주", val partial: Boolean = false)

var problems = 0
var seq = 0
fun bad(msg: String) { problems++; println("  ✗ $msg") }

fun render(name: String, wDp: Int, hDp: Int, count: Int, days: List<Dy>, memoMax: Int, dens: Float, outDir: File): Boolean {
    val w = (wDp * dens).toInt(); val h = (hDp * dens).toInt()
    val img = BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB)
    val g = img.createGraphics()
    g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON)
    g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON)
    g.color = Color(0xEEEEEE); g.fillRect(0, 0, w, h)
    val r = Math.min(w, h) * 0.12f
    g.color = Color.WHITE; g.fill(RoundRectangle2D.Float(0f, 0f, w.toFloat(), h.toFloat(), r, r))
    val inset = Math.max(2f * dens, Math.min(6f * dens, Math.min(w, h) * 0.02f))
    val iw = w - 2 * inset; val ih = h - 2 * inset
    g.translate(inset.toDouble(), inset.toDouble())
    val compact = count == 7
    var top = 0f
    val cells = count
    val cw = iw / cells
    if (compact) {
        val head = WidgetLayout.weekHead(cw, ih, dens)
        top = head.height
        g.color = Color.GRAY; g.font = Font("SansSerif", Font.BOLD, head.text.toInt())
        val names = arrayOf("일", "월", "화", "수", "목", "금", "토")
        for (i in 0 until 7) g.drawString(names[i], cw * i + cw / 2 - g.fontMetrics.stringWidth(names[i]) / 2f, top * 0.78f)
    }
    val ch = ih - top
    val row = WidgetLayout.solve(days.map { WidgetLayout.DayIn(it.stk, it.hol.isNotEmpty(), it.memos, it.circle.isNotEmpty()) }, cw, ch, dens, compact, memoMax)
    var ok = true
    for (i in 0 until cells) {
        val d = days[i]
        val x0 = cw * i; val y0 = top
        if (i == 0) { g.color = Color(0xE3F5EF); g.fill(RoundRectangle2D.Float(x0 + 2 * dens, y0 + 2 * dens, cw - 4 * dens, ch - 4 * dens, 8 * dens, 8 * dens)) }
        g.color = Color(0xDDDDDD); g.drawRect(x0.toInt(), y0.toInt(), cw.toInt(), ch.toInt())
        // 근무 동그라미
        if (d.circle.isNotEmpty()) {
            val rad = row.circleD / 2
            g.color = Color(0x7986CB); g.fill(java.awt.geom.Ellipse2D.Float(x0 + cw / 2 - rad, y0 + row.circleCy - rad, rad * 2, rad * 2))
            g.color = Color.WHITE; g.font = Font("SansSerif", Font.BOLD, rad.toInt()); val tw = g.fontMetrics.stringWidth(d.circle); g.drawString(d.circle, x0 + cw / 2 - tw / 2f, y0 + row.circleCy + rad * 0.36f)
            if (y0 + row.circleCy - rad < y0 + row.textLimit - 0.5f) { bad("$name 칸${i + 1}: 동그라미가 날짜 · 공휴일 글자를 침범"); ok = false }
            if (y0 + row.circleCy - rad < y0 + row.headEnd - row.stkSize * 0.9f - 0.5f) { bad("$name 칸${i + 1}: 동그라미가 스티커 줄과 너무 많이 겹침"); ok = false }
            if (y0 + row.circleCy + rad > y0 + row.memoTop(row.memoLines) + 0.5f && row.memoLines > 0) { bad("$name 칸${i + 1}: 동그라미가 메모를 침범"); ok = false }
            if (rad * 2 > cw + 0.5f) { bad("$name 칸${i + 1}: 동그라미가 칸보다 큼"); ok = false }
        }
        // 날짜
        val label = if (compact) "${d.d}" else "${d.d}(M)"
        g.color = Color.BLACK; g.font = Font("SansSerif", Font.BOLD, row.dateSize.toInt())
        var dsz = row.dateSize
        val w1 = if (Math.min(d.stk, 4).let { row.perRow(it) } > 0) row.perRow(Math.min(d.stk, 4)) * row.stkSize + (row.perRow(Math.min(d.stk, 4)) - 1) * row.stkGap else 0f
        val availDate = cw - row.padX * 2 - (if (w1 > 0f) w1 + row.stkGap else 0f)
        while (g.fontMetrics.stringWidth(label) > availDate && dsz > row.dateSize * 0.6f) { dsz *= 0.92f; g.font = Font("SansSerif", Font.BOLD, dsz.toInt()) }
        val dateW = g.fontMetrics.stringWidth(label)
        g.drawString(label, x0 + row.padX, y0 + row.dateBase)
        // 스티커
        val n = Math.min(d.stk, 4)
        val n1 = row.perRow(n); val n2 = n - n1
        val rects = ArrayList<FloatArray>()
        for (k in 0 until n) {
            val inRow1 = k < n1; val idx = if (inRow1) k else k - n1
            val cnt = if (inRow1) n1 else n2
            val rowW = cnt * row.stkSize + (cnt - 1) * row.stkGap
            val sx = x0 + cw - row.padX - rowW + idx * (row.stkSize + row.stkGap)
            val sy = y0 + row.stkTop + (if (inRow1) 0f else row.stkStep)
            g.color = Color(0xF4B400); g.fill(RoundRectangle2D.Float(sx, sy, row.stkSize, row.stkSize, 4f, 4f))
            if (d.partial && k == 0) { g.color = Color(0xF08A00); val bw = row.stkSize * 0.7f; g.fillRoundRect((sx + row.stkSize - bw * 0.7f).toInt(), (sy + row.stkSize - bw * 0.4f).toInt(), bw.toInt(), (bw * 0.55f).toInt(), 4, 4) }
            rects.add(floatArrayOf(sx, sy, sx + row.stkSize, sy + row.stkSize))
        }
        // 날짜 글자와 스티커가 겹치면 안 됨
        val dateRight = x0 + row.padX + dateW
        for (q in rects) if (q[1] < y0 + row.dateBase && q[0] < dateRight - 0.5f && (compact || true)) { if (dateRight > q[0] + 1f) { bad("$name 칸${i + 1}: 날짜 글자(${dateW}px)가 스티커와 겹침"); ok = false } }
        for (q in rects) { if (q[2] > x0 + cw + 0.5f || q[0] < x0 - 0.5f) { bad("$name 칸${i + 1}: 스티커가 칸 밖"); ok = false }; if (q[3] > y0 + row.headEnd + 0.5f) { bad("$name 칸${i + 1}: 스티커가 위쪽 끝(${row.headEnd})보다 아래"); ok = false } }
        if (d.hol.isNotEmpty() && !compact) { g.color = Color(0xD6334A); g.font = Font("SansSerif", Font.PLAIN, row.holSize.toInt()); g.drawString(d.hol, x0 + row.padX, y0 + row.holBase) }
        // 메모
        val shown = Math.min(d.memos, row.memoLines)
        val mt = row.memoTop(shown)
        for (k in 0 until shown) {
            val py = y0 + mt + k * (row.pillH + row.pillGap)
            g.color = Color(0xEAECEF); g.fill(RoundRectangle2D.Float(x0 + row.padX, py, cw - 2 * row.padX, row.pillH, row.pillH * 0.3f, row.pillH * 0.3f))
            g.color = Color.BLACK; g.font = Font("SansSerif", Font.PLAIN, Math.max(6, Math.min(row.pillH * 0.7f, cw * (if (compact) 0.2f else 0.11f)).toInt()))
            g.drawString("memo ${k + 1}", x0 + row.padX * 1.4f, py + row.pillH * 0.72f)
        }
        if (shown > 0 && mt < row.headEnd - 0.5f) { bad("$name 칸${i + 1}: 메모가 위쪽(${row.headEnd})을 침범 mt=$mt"); ok = false }
        if (d.memos > 0 && row.memoLines < Math.min(d.memos, memoMax)) { /* 줄 수가 줄어든 것은 정보로만 */ }
        if (row.pillH > 0 && row.pillH < 9.5f * dens) { bad("$name: 메모 줄 높이가 너무 낮음 ${row.pillH / dens}dp"); ok = false }
    }
    val wantAll = days.maxOf { Math.min(it.memos, memoMax) }
    println(String.format("  %-34s %3dx%-3ddp 칸%d  메모 %d/%d줄  줄높이 %.1fdp  동그라미 %.1fdp  위쪽 %.1fdp %s", name, wDp, hDp, count, row.memoLines, wantAll, row.pillH / dens, row.circleD / dens, row.headEnd / dens, if (ok) "" else "✗"))
    g.dispose()
    seq++; ImageIO.write(img, "png", File(outDir, String.format("%02d_%dx%d_c%d.png", seq, wDp, hDp, count)))
    return ok
}

// 아무 크기 · 아무 내용이나 많이 넣어 봐도 겹침 · 넘침이 없는지 (무작위 시험)
fun fuzz(): Int {
    val rnd = java.util.Random(7)
    var fails = 0
    val u = 2.75f
    for (n in 0 until 4000) {
        val compact = rnd.nextBoolean()
        val cells = if (compact) 7 else 1 + rnd.nextInt(2)
        val cwDp = if (compact) 28f + rnd.nextFloat() * 90f else 60f + rnd.nextFloat() * 170f
        val chDp = 40f + rnd.nextFloat() * 170f
        val memoMax = 1 + rnd.nextInt(2)
        val days = List(cells) { WidgetLayout.DayIn(rnd.nextInt(5), !compact && rnd.nextBoolean(), rnd.nextInt(5), rnd.nextInt(4) != 0) }
        val cw = cwDp * u; val ch = chDp * u
        val r = WidgetLayout.solve(days, cw, ch, u, compact, memoMax)
        val tag = "cw=${cwDp} ch=${chDp} compact=$compact"
        fun f(m: String) { fails++; if (fails < 15) println("  ✗ $tag: $m") }
        // 그날 메모 · 스티커 · 공휴일이 달라도 동그라미 · 메모 자리의 크기와 위치는 똑같아야 함 (동그라미가 날마다 달라지지 않게)
        val days2 = days.map { WidgetLayout.DayIn(rnd.nextInt(5), !compact && rnd.nextBoolean(), rnd.nextInt(5), it!!.circle) }
        val r2 = WidgetLayout.solve(days2, cw, ch, u, compact, memoMax)
        fun same(a: Float, b: Float) = Math.abs(a - b) < 0.001f
        if (!same(r.circleD, r2.circleD) || !same(r.circleCy, r2.circleCy) || r.memoLines != r2.memoLines || !same(r.pillH, r2.pillH) || !same(r.headEnd, r2.headEnd)) f("내용이 달라지면 동그라미 · 메모 자리가 달라짐 (동그라미 ${r.circleD / u}dp ↔ ${r2.circleD / u}dp)")
        if (r.headEnd > r.bottom + 0.5f) f("위쪽(${r.headEnd})이 아래 끝(${r.bottom})보다 아래")
        if (r.memoLines > 0 && r.memoTop(r.memoLines) < r.headEnd - 0.5f) f("메모가 위쪽을 침범")
        if (days.any { it.circle } && r.circleD > 0f) {
            if (r.circleCy - r.circleD / 2 < r.textLimit - 0.5f) f("동그라미가 날짜 · 공휴일 글자를 침범 ${r.circleCy - r.circleD / 2} < ${r.textLimit}")
            if (r.circleCy - r.circleD / 2 < r.headEnd - r.stkSize * 0.9f - 0.5f) f("동그라미가 스티커 줄과 너무 많이 겹침")
            val lowest = if (r.memoLines > 0) r.memoTop(r.memoLines) else r.bottom
            if (r.circleCy + r.circleD / 2 > lowest + 0.5f) f("동그라미가 아래(메모)를 침범")
            if (r.circleD > cw) f("동그라미가 칸보다 큼")
        }
        for (d in days) {
            val nn = Math.min(d.stickers, 4)
            val n1 = r.perRow(nn)
            if (nn - n1 > r.stkCols && nn - n1 > 2) f("스티커가 3줄 이상 필요")
            if (n1 * r.stkSize + (n1 - 1) * r.stkGap > cw * 0.5f + 0.5f && nn > 0) f("스티커 첫 줄이 칸의 절반을 넘음")
        }
        if (r.memoLines > 0 && r.pillH < 9.5f * u - 0.5f) f("메모 줄이 너무 낮음 ${r.pillH / u}dp")
        if (r.stkSize < 4f * u) f("스티커가 너무 작음 ${r.stkSize / u}dp")
        val want = days.maxOf { Math.min(it.memos, memoMax) }
        // 칸이 충분히 크면(높이 130dp 이상 · 폭 60dp 이상) 원하는 메모 줄을 다 보여야 함
        if (chDp >= 130f && cwDp >= 60f && r.memoLines < want) f("크고 넉넉한데 메모가 ${r.memoLines}/${want}줄")
    }
    println(if (fails == 0) "무작위 4000개: 겹침 · 넘침 없음" else "무작위 시험 실패 ${fails}개")
    return fails
}

fun main(args: Array<String>) {
    problems += fuzz()
    val out = File(args.getOrElse(0) { "/tmp/widget-preview" }); out.mkdirs()
    val dens = 2.75f
    fun week(stk: Int, memos: Int, hol: Boolean = false, partial: Boolean = false) = List(7) { Dy(10 + it, it, if (it % 2 == 0) stk else Math.max(0, stk - 1), if (hol && it == 3) "Holiday" else "", if (it == 2) memos else Math.max(0, memos - 1), if (it == 5) "" else "D", partial) }
    println("7일 위젯")
    render("7일 최소(250x70) 스티커0 메모1", 250, 70, 7, week(0, 1), 2, dens, out)
    render("7일 최소(250x70) 스티커4 메모3", 250, 70, 7, week(4, 3), 2, dens, out)
    render("7일 폰(360x110) 스티커2 메모3", 360, 110, 7, week(2, 3), 2, dens, out)
    render("7일 폰(360x110) 스티커4 메모4", 360, 110, 7, week(4, 4), 2, dens, out)
    render("7일 폰(360x160) 스티커4 메모4", 360, 160, 7, week(4, 4), 2, dens, out)
    render("7일 태블릿(640x130) 스티커4 메모3", 640, 130, 7, week(4, 3), 2, dens, out)
    render("7일 태블릿(640x130) 스티커4 메모4", 640, 130, 7, week(4, 4), 2, dens, out)
    render("7일 태블릿(700x180) 스티커4 메모4", 700, 180, 7, week(4, 4), 2, dens, out)
    render("7일 가로(520x90) 스티커3 메모3", 520, 90, 7, week(3, 3), 2, dens, out)
    println("2칸 위젯")
    render("2칸 최소(140x70) 스티커4 메모3 휴일", 140, 70, 2, listOf(Dy(12, 1, 4, "Holiday", 3), Dy(13, 2, 2, "", 2)), 2, dens, out)
    render("2칸(180x110) 스티커4 메모4", 180, 110, 2, listOf(Dy(12, 1, 4, "Holiday", 4), Dy(13, 2, 3, "", 4, partial = true)), 2, dens, out)
    render("2칸 큼(300x160) 스티커4 메모4", 300, 160, 2, listOf(Dy(12, 1, 4, "Holiday", 4), Dy(13, 2, 3, "", 4)), 2, dens, out)
    println("1칸 위젯")
    render("1칸 최소(70x70) 스티커4 메모3", 70, 70, 1, listOf(Dy(12, 1, 4, "Holiday", 3)), 2, dens, out)
    render("1칸(110x110) 스티커4 메모3 휴일", 110, 110, 1, listOf(Dy(12, 1, 4, "Holiday", 3)), 2, dens, out)
    render("1칸 큼(180x180) 스티커2 메모4", 180, 180, 1, listOf(Dy(12, 1, 2, "", 4)), 2, dens, out)
    println("엇갈린 칸: 어떤 칸은 메모가 많고 어떤 칸은 스티커가 많음")
    render("7일 섞임(360x110)", 360, 110, 7, listOf(Dy(10, 0, 4, "", 0), Dy(11, 1, 0, "", 3), Dy(12, 2, 2, "", 1), Dy(13, 3, 0, "", 0, ""), Dy(14, 4, 1, "", 2), Dy(15, 5, 3, "", 3), Dy(16, 6, 0, "", 1)), 2, dens, out)
    println(if (problems == 0) "문제 없음" else "문제 ${problems}개")
    System.exit(if (problems == 0) 0 else 1)
}
