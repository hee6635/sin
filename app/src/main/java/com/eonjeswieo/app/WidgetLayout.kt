package com.eonjeswieo.app

/**
 * 위젯 칸의 배치 계산. 안드로이드 클래스 없이 숫자만 다루어서(그리기와 따로) 컴퓨터에서도 시험할 수 있다.
 *
 * 한 줄(7일 위젯의 7칸 / 2칸 위젯의 2칸 / 1칸 위젯의 1칸)이 같은 높이를 쓰므로,
 * 위쪽(날짜 · 스티커) 끝과 메모 줄 수 · 근무 동그라미 높이는 줄 전체가 함께 정한다 (칸마다 동그라미 높이가 같도록).
 * 모든 y 는 칸 맨 위를 0 으로 잰 값이다.
 */
object WidgetLayout {
    /** 칸 하나의 내용 요약 */
    class DayIn(val stickers: Int, val hol: Boolean, val memos: Int, val circle: Boolean)

    class Row(
        val padX: Float,
        val dateSize: Float,
        val dateBase: Float,
        val holSize: Float,
        val holBase: Float,
        val stkSize: Float,
        val stkGap: Float,
        val stkCols: Int,
        val stkTop: Float,
        val stkStep: Float,
        val headEnd: Float,
        val memoLines: Int,
        val pillH: Float,
        val pillGap: Float,
        val bottom: Float,
        val circleCy: Float,
        val circleD: Float
    ) {
        /** 스티커 n 개를 첫 줄에 몇 개 놓을지 (3개는 2+1, 4개는 칸이 넓으면 한 줄 · 아니면 2+2) */
        fun perRow(n: Int): Int = if (n <= stkCols) n else 2

        /** 메모를 shown 줄 보일 때 맨 위 y (맨 아래에 붙여 쌓음) */
        fun memoTop(shown: Int): Float = if (shown <= 0) bottom else bottom - (shown * pillH + (shown - 1) * pillGap)
    }

    private fun clamp(v: Float, lo: Float, hi: Float): Float = if (hi < lo) lo else Math.max(lo, Math.min(hi, v))

    /**
     * @param days 줄의 칸들 (없는 날은 null)
     * @param cw 칸 폭 · ch 칸 높이 (px)
     * @param u 1dp 가 몇 px 인지
     * @param compact 7일 위젯의 좁은 칸 (날짜는 숫자만, 공휴일 이름은 안 씀)
     */
    fun solve(days: List<DayIn?>, cw: Float, ch: Float, u: Float, compact: Boolean, memoMax: Int): Row {
        val padX = clamp(cw * 0.06f, 2f * u, 8f * u)
        val topPad = clamp(ch * 0.035f, 2f * u, 5f * u)
        val botPad = clamp(ch * 0.035f, 2f * u, 5f * u)
        val bottom = ch - botPad

        // 날짜 줄
        val dateSize = Math.min(if (compact) clamp(cw * 0.25f, 8f * u, 13f * u) else clamp(cw * 0.14f, 10f * u, 17f * u), ch * 0.17f)
        val rowH = dateSize * 1.25f
        val dateBase = topPad + dateSize * 0.98f
        val holSize = dateSize * 0.6f
        val holBase = topPad + rowH + holSize * 0.98f

        // 스티커: 오른쪽 위에 한두 줄로 촘촘히 (한 줄에 최소 2개가 들어가도록 크기를 줄임)
        var ss = Math.min(if (compact) clamp(cw * 0.22f, 8f * u, 16f * u) else clamp(cw * 0.15f, 10f * u, 20f * u), ch * 0.17f)
        val g = ss * 0.12f
        ss = Math.min(ss, (cw * 0.5f - g) / 2f)
        val gap = ss * 0.12f
        val cols = clamp(Math.floor(((cw * 0.5f + gap) / (ss + gap)).toDouble()).toFloat(), 2f, 4f).toInt()
        val step = ss + gap
        val stkTop = topPad

        // 위쪽 끝 = 칸들 중 가장 많이 차지하는 칸에 맞춤
        var head = topPad + rowH
        for (d in days) {
            if (d == null) continue
            val left = topPad + rowH + (if (d.hol && !compact) holSize * 1.3f else 0f)
            val n = Math.min(d.stickers, 4)
            val rows = if (n == 0) 0 else if (n <= cols) 1 else 2   // (n 이 cols 보다 크면 2줄)
            val right = if (rows == 0) 0f else stkTop + rows * ss + (rows - 1) * gap
            head = Math.max(head, Math.max(left, right))
        }
        val headEnd = head + ch * 0.012f

        // 메모 줄 수 · 줄 높이 · 근무 동그라미 (남는 세로 길이 안에서 같이 풀기)
        var want = 0
        var hasCircle = false
        for (d in days) {
            if (d == null) continue
            want = Math.max(want, Math.min(d.memos, memoMax))
            if (d.circle) hasCircle = true
        }
        val avail = Math.max(0f, bottom - headEnd)
        val phMax = clamp(Math.min(cw * 0.26f, ch * 0.15f), 10f * u, 19f * u)
        val phMin = Math.min(phMax, 10f * u)
        val pg = Math.max(1f * u, ch * 0.012f)
        val cg = Math.max(1f * u, ch * 0.012f)
        val dMax = clamp(Math.min(cw * 0.46f, ch * 0.34f), 12f * u, 30f * u)
        val dMin = Math.min(dMax, 14f * u)

        var lines = 0
        var dFloor = dMin
        var l = want
        while (l >= 1) {
            val need = l * phMin + (l - 1) * pg + (if (hasCircle) dMin + 2 * cg else 0f)
            if (need <= avail) {
                lines = l
                break
            }
            l--
        }
        if (lines == 0 && want >= 1) {   // 그래도 메모 한 줄은 보이게: 동그라미를 조금 줄여서라도
            val dSmall = if (hasCircle) dMin * 0.75f else 0f
            if (phMin + (if (hasCircle) dSmall + 2 * cg else 0f) <= avail) {
                lines = 1
                dFloor = dSmall
            }
        }
        // 남는 길이 나누기: 동그라미를 알맞은 크기까지 → 메모 줄 높이를 최대까지 → 남으면 동그라미를 더 키움
        var extra = avail - (lines * phMin + Math.max(0, lines - 1) * pg) - (if (hasCircle) dFloor + 2 * cg else 0f)
        if (extra < 0f) extra = 0f
        var circleD = if (hasCircle) dFloor else 0f
        var ph = if (lines == 0) 0f else phMin
        if (hasCircle) {
            val dPref = clamp(Math.min(cw * 0.34f, ch * 0.22f), dFloor, dMax)
            val grow = Math.min(extra, dPref - circleD)
            circleD += grow
            extra -= grow
        }
        if (lines > 0) {
            val grow = Math.min(extra / lines, phMax - ph)
            ph += grow
            extra -= grow * lines
        }
        if (hasCircle) {
            val grow = Math.min(extra, dMax - circleD)
            circleD += grow
        }
        val memoBlock = if (lines == 0) 0f else lines * ph + (lines - 1) * pg
        val band = avail - memoBlock
        val circleCy = headEnd + band / 2f

        return Row(padX, dateSize, dateBase, holSize, holBase, ss, gap, cols, stkTop, step, headEnd, lines, ph, pg, bottom, circleCy, circleD)
    }
}
