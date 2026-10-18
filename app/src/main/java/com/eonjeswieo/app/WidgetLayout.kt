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
        val textLimit: Float,
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

        // 위쪽 · 메모 · 근무 동그라미의 크기와 자리는 칸 크기로만 정함 (그날 메모 · 스티커가 몇 개든 같음 → 동그라미가 날마다 달라지지 않게).
        // 날짜 · 공휴일 글자 끝(textEnd)과 스티커 두 줄째 끝(stkEnd)을 늘 같은 기준으로 잡음
        val textEnd = topPad + rowH + (if (compact) 0f else holSize * 1.3f)
        val stkEnd = stkTop + 2 * ss + gap
        val headEnd = Math.max(textEnd, stkEnd) + ch * 0.012f
        val textLimit = textEnd + ch * 0.012f
        // 근무 동그라미는 스티커 줄 아래쪽과 조금 겹쳐도 됨 (날짜 글자는 안 가림, 스티커 한 줄 높이의 90%까지)
        val bandTop = Math.max(textLimit, headEnd - ss * 0.9f)

        val hasCircle = days.any { it != null && it.circle }
        val phMax = clamp(Math.min(cw * 0.26f, ch * 0.15f), 10f * u, 19f * u)
        val phMin = Math.min(phMax, 10f * u)
        val pg = Math.max(1f * u, ch * 0.012f)
        val cg = Math.max(1f * u, ch * 0.012f)
        val dTop = clamp(Math.min(cw * 0.62f, ch * 0.36f), 12f * u, 44f * u)   // 근무 동그라미 크기 (칸 폭의 약 62%)
        val dMin = Math.min(dTop, 14f * u)
        val availMemo = Math.max(0f, bottom - headEnd)    // 메모는 스티커 줄 아래에만
        val availCircle = Math.max(0f, bottom - bandTop)  // 동그라미는 스티커 줄 아래쪽과 조금 겹쳐도 됨
        fun blk(l: Int, p: Float): Float = if (l <= 0) 0f else l * p + (l - 1) * pg
        fun fits(l: Int, p: Float, dm: Float): Boolean = blk(l, p) <= availMemo && blk(l, p) + (if (hasCircle) dm + 2 * cg else 0f) <= availCircle

        // 메모 자리(줄 수 · 줄 높이)는 칸이 넉넉하면 목표대로, 좁으면 줄 높이 → 줄 수 순으로 줄임 (그래도 한 줄은 동그라미를 조금 줄여서라도 보이게)
        var lines = Math.max(0, memoMax)
        var ph = phMax
        if (lines > 0 && !fits(lines, ph, dMin)) ph = phMin
        while (lines > 1 && !fits(lines, ph, dMin)) lines--
        if (lines > 0 && !fits(lines, ph, dMin) && !fits(lines, ph, dMin * 0.75f)) lines = 0
        if (lines == 0) ph = 0f
        val memoBlock = blk(lines, ph)

        // 근무 동그라미: 메모 자리 위 ~ 날짜 · 스티커 아래 사이 한가운데 (자리가 모자라면 그 안에서만 줄임)
        var circleD = 0f
        var circleCy = bandTop
        if (hasCircle) {
            val top = bandTop
            val bot = bottom - memoBlock
            circleD = Math.max(0f, Math.min(dTop, bot - top - 2 * cg))
            circleCy = top + (bot - top) / 2f
        }

        return Row(padX, dateSize, dateBase, holSize, holBase, ss, gap, cols, stkTop, step, headEnd, textLimit, lines, ph, pg, bottom, circleCy, circleD)
    }
}
