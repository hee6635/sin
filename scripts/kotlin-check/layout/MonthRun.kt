// 한 달 위젯의 진짜 그리기 코드(MonthRenderer.draw)를 컴퓨터에서 돌려 그림(PNG)으로 저장하는 도구 — run-month-real.sh 가 부름
// 안드로이드 그래픽은 shim/ 의 가짜(Java2D)라서 글꼴 폭은 실제 폰과 조금 다를 수 있지만, 그리는 순서 · 자리 · 데이터 읽기는 폰에서 도는 코드 그대로
package monthrun

import android.graphics.Bitmap
import android.graphics.Canvas
import com.eonjeswieo.app.MonthRenderer
import com.eonjeswieo.app.WidgetRenderer
import org.json.JSONObject
import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO

private var fails = 0

private fun render(data: JSONObject, name: String, wDp: Int, hDp: Int, offset: Int, who: Int, dark: Boolean, out: File): Boolean {
    val u = 2.75f
    return try {
        WidgetRenderer.dens = u
        val bmp = Bitmap.createBitmap((wDp * u).toInt(), (hDp * u).toInt(), Bitmap.Config.ARGB_8888)
        val cv = Canvas(bmp)
        val ws = data.optInt("ws", 0).coerceIn(0, 1)
        val ppl = MonthRenderer.people(data)
        val person = if (who >= 0 && who < ppl.size) ppl[who] else null
        val grid = MonthRenderer.gridOf(ws, offset)
        MonthRenderer.draw(cv, bmp.width.toFloat(), bmp.height.toFloat(), data, grid, ws, offset, ppl, person, if (dark) WidgetRenderer.DARK else WidgetRenderer.LIGHT, -1f)
        val img = bmp.javaClass.getField("img").get(bmp) as BufferedImage
        ImageIO.write(img, "png", out)
        println(String.format("  %-44s %3dx%-3ddp  %d줄 %s", name, wDp, hDp, grid.rows, if (person == null) "내 달력" else "가족: " + person.optString("n")))
        true
    } catch (e: Throwable) {
        fails++
        println("  ✗ $name: $e")
        e.printStackTrace(System.out)
        false
    }
}

/** 이번 달 · 앞 달 · 다음 달 달력(gridOf)의 첫 칸 · 줄 수가 java.time 으로 따로 계산한 값과 같은지 (그림과 누르는 자리가 같이 쓰는 값) */
private fun gridCheck() {
    val today = java.time.LocalDate.now()
    for (ws in 0..1) for (off in -1..1) {
        val g = MonthRenderer.gridOf(ws, off)
        val first = today.withDayOfMonth(1).plusMonths(off.toLong())
        val lead = ((first.dayOfWeek.value % 7) - ws + 7) % 7
        val start = first.minusDays(lead.toLong())
        val rows = (lead + first.lengthOfMonth() + 6) / 7
        val gs = java.time.LocalDate.of(g.start.get(java.util.Calendar.YEAR), g.start.get(java.util.Calendar.MONTH) + 1, g.start.get(java.util.Calendar.DAY_OF_MONTH))
        val ok = gs == start && g.rows == rows && g.year == first.year && g.month0 == first.monthValue - 1
        if (!ok) { fails++; println("  ✗ gridOf(ws=$ws, offset=$off): 첫 칸 $gs 줄 ${g.rows} · 기대 $start 줄 $rows") }
    }
    println(if (fails == 0) "달력 첫 칸 · 줄 수(앞 달 · 이번 달 · 다음 달 · 두 가지 시작 요일): 맞음" else "달력 첫 칸 실패")
}

/** 위젯 데이터가 덮는 달(MonthRenderer.covers)이 java.time 으로 따로 계산한 값과 같은지 (앞 · 뒤 화살표가 넘어갈 수 있는 달) + 넘길 수 있는 범위 출력 */
private fun coverCheck(data: JSONObject) {
    val days = data.optJSONArray("days")!!
    val first = java.time.LocalDate.parse(days.getJSONObject(0).getString("k"))
    val last = java.time.LocalDate.parse(days.getJSONObject(days.length() - 1).getString("k"))
    val ws = data.optInt("ws", 0).coerceIn(0, 1)
    val today = java.time.LocalDate.now()
    val reach = ArrayList<Int>()
    for (off in -6..16) {
        val f = today.withDayOfMonth(1).plusMonths(off.toLong())
        val lead = ((f.dayOfWeek.value % 7) - ws + 7) % 7
        val st = f.minusDays(lead.toLong())
        val en = st.plusDays(((lead + f.lengthOfMonth() + 6) / 7 * 7 - 1).toLong())
        val want = !st.isBefore(first) && !en.isAfter(last)
        val got = MonthRenderer.covers(data, ws, off)
        if (want != got) { fails++; println("  ✗ covers(offset=$off): $got · 기대 $want (달력 $st ~ $en · 데이터 $first ~ $last)") }
        if (got) reach.add(off)
    }
    println("넘길 수 있는 달(이번 달 기준): ${reach.minOrNull()} ~ ${reach.maxOrNull()} (${reach.size}개 달) · 데이터 $first ~ $last")
}

/** 월 넘김(옛 달 → 새 달 미끄러짐) · 오늘 빛 프레임을 폰 코드(MonthRenderer.composeSlide · drawGlow)로 겹쳐 그려 PNG 로 저장 */
private fun effects(data: JSONObject, dir: File) {
    dir.mkdirs()
    val wDp = 340; val hDp = 330; val u = 2.75f
    try {
        WidgetRenderer.dens = u
        val w = (wDp * u).toInt(); val h = (hDp * u).toInt()
        val ws = data.optInt("ws", 0).coerceIn(0, 1)
        val ppl = MonthRenderer.people(data)
        fun layer(offset: Int, part: Int, moving: Boolean): Bitmap {
            val b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
            MonthRenderer.draw(Canvas(b), w.toFloat(), h.toFloat(), data, MonthRenderer.gridOf(ws, offset), ws, offset, ppl, null, WidgetRenderer.LIGHT, -1f, part, moving)
            return b
        }
        fun save(b: Bitmap, name: String) = ImageIO.write(b.javaClass.getField("img").get(b) as BufferedImage, "png", File(dir, name))
        val top = MonthRenderer.lastTop; val rr = MonthRenderer.lastRr
        val old = layer(0, 2, false)
        val nw = layer(1, 2, false)
        val chrome = layer(1, 1, true)
        val top2 = MonthRenderer.lastTop; val rr2 = MonthRenderer.lastRr
        val out = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val es = floatArrayOf(0.15f, 0.5f, 0.85f)
        for ((i, e) in es.withIndex()) { MonthRenderer.composeSlide(out, chrome, old, nw, 1, e, top2, rr2, u); save(out, "slide${i + 1}.png") }
        // 오늘 빛: 같은 달 · 오늘 칸
        val base = layer(0, 0, false)
        val box = MonthRenderer.lastToday
        if (box == null) { fails++; println("  ✗ 오늘 칸 자리를 못 받음") }
        else {
            val ts = floatArrayOf(0.06f, 0.18f, 0.30f, 0.42f, 0.54f, 0.66f, 0.78f, 0.90f)
            for ((i, t) in ts.withIndex()) {
                val f = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
                val cv = Canvas(f)
                cv.drawBitmap(base, 0f, 0f, null)
                MonthRenderer.drawGlow(cv, box, u, t)
                save(f, "glow${i + 1}.png")
            }
            println("효과 프레임 저장: 슬라이드 ${es.size}장 · 빛 ${ts.size}장 (top=${"%.0f".format(top)} rr=${"%.0f".format(rr)} 오늘칸=${box})")
        }
    } catch (e: Throwable) {
        fails++
        println("  ✗ 효과 프레임: $e")
        e.printStackTrace(System.out)
    }
}

private fun small(data: JSONObject, name: String, wDp: Int, hDp: Int, count: Int, dark: Boolean, file: File) {
    val u = 2.75f
    try {
        WidgetRenderer.dens = u
        val b = Bitmap.createBitmap((wDp * u).toInt(), (hDp * u).toInt(), Bitmap.Config.ARGB_8888)
        WidgetRenderer.drawWith(Canvas(b), data, if (dark) WidgetRenderer.DARK else WidgetRenderer.LIGHT, b.width.toFloat(), b.height.toFloat(), count, if (count == 2) "⏰ 내일 05:30" else "")
        ImageIO.write(b.javaClass.getField("img").get(b) as BufferedImage, "png", file)
        println("  작은 위젯 $name")
    } catch (e: Throwable) { fails++; println("  ✗ 작은 위젯 $name: $e"); e.printStackTrace(System.out) }
}

fun main(args: Array<String>) {
    gridCheck()
    val data = JSONObject(File(args[0]).readText())
    coverCheck(data)
    val out = File(args[1]); out.mkdirs()
    val ppl = MonthRenderer.people(data)
    println("위젯 데이터: ${data.optJSONArray("days")?.length()}일 · 가족 ${ppl.size}명 ${ppl.map { it.optString("n") }} · 주 시작 ${data.optInt("ws")}")
    render(data, "내 달력 · 이번 달", 340, 330, 0, -1, false, File(out, "r01_me.png"))
    render(data, "내 달력 · 어둡게", 340, 330, 0, -1, true, File(out, "r02_me_dark.png"))
    render(data, "내 달력 · 앞 달(9월)", 340, 330, -1, -1, false, File(out, "r03_me_prev.png"))
    render(data, "내 달력 · 다음 달(11월)", 340, 330, 1, -1, false, File(out, "r04_me_next.png"))
    render(data, "내 달력 · 2달 뒤(12월)", 340, 330, 2, -1, false, File(out, "r05_me_p2.png"))
    render(data, "내 달력 · 12달 뒤(맨 끝 달)", 340, 330, 12, -1, false, File(out, "r06_me_p12.png"))
    render(data, "내 달력 · 2달 전", 340, 330, -2, -1, false, File(out, "r07_me_m2.png"))
    for (i in ppl.indices) render(data, "가족 달력 ${ppl[i].optString("n")}", 340, 330, 0, i, false, File(out, "r1${i}_fam${i}.png"))
    if (ppl.isNotEmpty()) render(data, "가족 달력 마지막 사람 · 다음 달", 340, 330, 1, ppl.size - 1, false, File(out, "r20_fam_last_next.png"))
    render(data, "내 달력 · 세로로 길게", 340, 440, 0, -1, false, File(out, "r30_tall.png"))
    render(data, "내 달력 · 가장 작게", 250, 250, 0, -1, false, File(out, "r31_min.png"))
    render(data, "가족 달력 · 가장 작게 + 칩", 250, 250, 0, if (ppl.isNotEmpty()) 0 else -1, false, File(out, "r32_min_fam.png"))
    render(data, "내 달력 · 넓게", 600, 330, 0, -1, false, File(out, "r33_wide.png"))
    // 칸이 큰 위젯(접이식 안쪽 화면 등): 근무 동그라미가 칸 폭의 절반까지 커짐 (v0.74)
    render(data, "내 달력 · 큰 위젯(545x561)", 545, 561, 0, -1, false, File(out, "r34_big.png"))
    render(data, "내 달력 · 큰 위젯 · 어둡게", 545, 561, 0, -1, true, File(out, "r35_big_dark.png"))
    render(data, "내 달력 · 큰 위젯 · 6주 달(2달 전)", 545, 561, -2, -1, false, File(out, "r36_big_6weeks.png"))
    render(data, "내 달력 · 아주 큰 위젯(700x640)", 700, 640, 0, -1, false, File(out, "r37_huge.png"))
    if (ppl.isNotEmpty()) render(data, "가족 달력 · 큰 위젯 + 칩", 545, 561, 0, 0, false, File(out, "r38_big_fam.png"))
    // 작은 위젯(1칸 · 2칸 · 7일): 칸 채우기 모양도 확인 (v0.96)
    small(data, "1칸", 110, 110, 1, false, File(out, "s1_one.png"))
    small(data, "2칸", 250, 110, 2, false, File(out, "s2_two.png"))
    small(data, "7일", 340, 140, 7, false, File(out, "s7_week.png"))
    small(data, "7일 · 어둡게", 340, 140, 7, true, File(out, "s7_week_dark.png"))
    // 월 넘김 · 오늘 효과의 중간 프레임: 폰이 쓰는 것과 같은 함수(composeSlide · drawGlow)로 겹쳐서 그림
    effects(data, File(out, "fx"))
    println(if (fails == 0) "진짜 그리기 코드: 오류 없이 모두 그려짐" else "진짜 그리기 코드: 실패 ${fails}개")
    System.exit(if (fails == 0) 0 else 1)
}
