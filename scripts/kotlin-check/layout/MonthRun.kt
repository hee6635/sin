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
        MonthRenderer.draw(cv, bmp.width.toFloat(), bmp.height.toFloat(), data, grid, ws, offset, ppl, person, if (dark) WidgetRenderer.DARK else WidgetRenderer.LIGHT)
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
    println(if (fails == 0) "진짜 그리기 코드: 오류 없이 모두 그려짐" else "진짜 그리기 코드: 실패 ${fails}개")
    System.exit(if (fails == 0) 0 else 1)
}
