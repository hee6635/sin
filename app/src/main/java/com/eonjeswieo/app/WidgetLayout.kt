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
        val circleD: Float,
        val holChars: Int,
        val holLabelSize: Float
    ) {
        /** 스티커 n 개를 첫 줄에 몇 개 놓을지 (3개는 2+1, 4개는 칸이 넓으면 한 줄 · 아니면 2+2) */
        fun perRow(n: Int): Int = if (n <= stkCols) n else 2

        /** 메모를 shown 줄 보일 때 맨 위 y (맨 아래에 붙여 쌓음) */
        fun memoTop(shown: Int): Float = if (shown <= 0) bottom else bottom - (shown * pillH + (shown - 1) * pillGap)
    }

    private fun clamp(v: Float, lo: Float, hi: Float): Float = if (hi < lo) lo else Math.max(lo, Math.min(hi, v))

    /** 메모가 칸에 다 안 들어갈 때 마지막 메모 줄 끝에 붙이는 작은 알약 모양 표시("+1")의 [가로, 세로] — 글자(메모)가 아니라 그림(이모티콘)처럼 보이게 색을 칠한 작은 칩 */
    fun moreBadge(pillH: Float): FloatArray {
        val h = pillH * 0.8f
        return floatArrayOf(h * 1.3f, h)
    }

    /** 칩 안의 글자: 더 있는 메모 수 ("+1" … "+9", 열 개 이상은 "9+") */
    fun moreLabel(more: Int): String = if (more > 9) "9+" else "+" + more

    /** 7일 위젯 맨 윗줄(월 화 수 …)의 글자 크기(text)와 줄 높이(height). 칸 폭 · 위젯 높이로만 정함 */
    class Head(val text: Float, val height: Float)

    fun weekHead(cw: Float, h: Float, u: Float): Head {
        val hs = clamp(Math.min(cw * 0.22f, h * 0.105f), 6f * u, 12f * u)
        return Head(hs, hs * 1.5f)
    }

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
        var ss = Math.min(clamp(cw * 0.22f, if (compact) 8f * u else 10f * u, if (compact) 16f * u else 20f * u), ch * 0.17f)   // (1칸 · 2칸도 7일 위젯처럼 칸 폭의 22% — 좁은 칸에서도 스티커가 또렷하게)
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
        // 근무 동그라미는 스티커 줄 아래쪽과 조금 겹쳐도 됨 (날짜 글자는 안 가림. 겹치는 높이는 스티커 한 줄 높이의 90% · 동그라미 크기의 18% 중 작은 쪽까지만 → "조금")
        val dTop = clamp(Math.min(cw * 0.62f, ch * 0.36f), 12f * u, 44f * u)   // 근무 동그라미 크기 (칸 폭의 약 62%)
        val bandTop = Math.max(textLimit, headEnd - Math.min(ss * 0.9f, dTop * 0.18f))

        val hasCircle = days.any { it != null && it.circle }
        val phMax = clamp(Math.min(cw * 0.26f, ch * 0.15f), 10f * u, 19f * u)
        val phMin = Math.min(phMax, 10f * u)
        val pg = Math.max(1f * u, ch * 0.012f)
        val cg = Math.max(1f * u, ch * 0.012f)
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

        // 공휴일 글자(날짜 숫자 아래 빨간 글자): 앱 달력과 같은 두 글자 줄임말을 동그라미 · 스티커 · 메모와 안 겹치게 넣을 수 있는 가장 큰 크기로.
        // 이것도 칸 크기로만 정함(그날 스티커가 몇 개든 같음 → 가장 빡빡한 경우인 스티커 4개 · 동그라미 있음으로 계산).
        // 1칸 · 2칸은 늘 원래 크기(holSize)로 들어가고, 7일 위젯 폰 크기는 글자를 조금 줄여서 넣고, 그래도 안 되면 한 글자, 그것도 안 되면 안 그림(0).
        val n1w = if (4 <= cols) 4 else 2
        val n2w = 4 - n1w
        fun holFits(chars: Int, size: Float): Boolean {
            val lx0 = padX
            val lx1 = padX + chars * size * 1.06f   // 한글 한 글자 ≈ 글자 크기 (조금 넉넉하게)
            val ly0 = holBase - size * 0.85f
            val ly1 = holBase + size * 0.2f
            if (lx1 > cw - padX + 0.5f) return false
            if (hasCircle && circleD > 0f) {   // 동그라미: 사각형에서 동그라미 중심까지 가장 가까운 점이 동그라미 안이면 겹침
                val cx = cw / 2f
                val nx = Math.max(lx0, Math.min(cx, lx1))
                val ny = Math.max(ly0, Math.min(circleCy, ly1))
                if (Math.hypot((cx - nx).toDouble(), (circleCy - ny).toDouble()) < circleD / 2f - 0.5f) return false
            }
            for (k in 0 until 4) {
                val inRow1 = k < n1w
                val idx = if (inRow1) k else k - n1w
                val cnt = if (inRow1) n1w else n2w
                val rowW = cnt * ss + (cnt - 1) * gap
                val sx = cw - padX - rowW + idx * (ss + gap)
                val sy = stkTop + (if (inRow1) 0f else step)
                if (sx < lx1 - 0.5f && sx + ss > lx0 + 0.5f && sy < ly1 - 0.5f && sy + ss > ly0 + 0.5f) return false
            }
            if (lines > 0 && ly1 > bottom - (lines * ph + (lines - 1) * pg) + 0.5f) return false   // 메모
            return true
        }
        var holChars = 0
        var holLabelSize = holSize
        var sc = 1.0f
        while (sc > 0.699f) {
            val sz = holSize * sc
            if ((sc >= 0.999f || sz >= 5f * u) && holFits(2, sz)) { holChars = 2; holLabelSize = sz; break }
            sc -= 0.05f
        }
        if (holChars == 0 && holFits(1, holSize)) { holChars = 1; holLabelSize = holSize }

        return Row(padX, dateSize, dateBase, holSize, holBase, ss, gap, cols, stkTop, step, headEnd, textLimit, lines, ph, pg, bottom, circleCy, circleD, holChars, holLabelSize)
    }

    // ───────── 한 달 위젯 ─────────

    /** 그 달 달력이 몇 줄(주)인지: 첫 날이 주 시작 요일에서 떨어진 칸 수 + 날 수 (ws: 0 = 일요일 시작 · 1 = 월요일 시작) */
    fun monthWeeks(year: Int, month0: Int, ws: Int): Int {
        val c = java.util.Calendar.getInstance()
        c.set(year, month0, 1, 12, 0, 0)
        val lead = ((c.get(java.util.Calendar.DAY_OF_WEEK) - 1) - ws + 7) % 7
        return (lead + c.getActualMaximum(java.util.Calendar.DAY_OF_MONTH) + 6) / 7
    }

    /**
     * 한 달 위젯의 날짜 칸 자리 (모든 칸이 같은 크기 · 같은 줄(주)의 칸은 동그라미 · 메모 자리가 같음).
     * y 는 칸 맨 위를 0 으로 잰 값. 날짜 줄 → (동그라미) → 메모 줄을 위에서 아래로 쌓고, 스티커는 날짜 줄 오른쪽 끝.
     */
    class MonthPlan(
        val padX: Float,
        val dateSize: Float,
        val dateBase: Float,
        val dateBottom: Float,
        val stkSize: Float,
        val stkGap: Float,
        val stkTop: Float,
        val holSize: Float,
        val pillH: Float,
        val pillGap: Float,
        val bottom: Float,
        val circleD: Float,
        /** 줄(주)마다 메모에 잡아 둔 줄 수 (그 줄에서 메모가 가장 많은 날 기준 · 한 칸에 보이는 건 이 안에서) */
        val lines: IntArray,
        /** 줄마다 근무 동그라미 한가운데 y */
        val circleCy: FloatArray
    ) {
        /** 메모를 shown 줄 보일 때 맨 위 y (맨 아래에 붙여 쌓음) */
        fun memoTop(shown: Int): Float = if (shown <= 0) bottom else bottom - (shown * pillH + (shown - 1) * pillGap)
    }

    /**
     * @param rowMemos 줄(주)마다, 그 줄에서 메모가 가장 많은 날의 메모 수
     * @param cw 칸 폭 · rowH 칸 높이 (px) · u = 1dp 가 몇 px 인지
     * @param hasCircle 이 달에 근무 동그라미가 하나라도 있는지
     * @param memoMax 칸에 보일 메모 줄 수 최대 (위젯 설정)
     */
    fun solveMonth(rowMemos: IntArray, cw: Float, rowH: Float, u: Float, hasCircle: Boolean, memoMax: Int): MonthPlan {
        val padX = clamp(cw * 0.07f, 2f * u, 4f * u)
        val topPad = 3f * u
        val botPad = 2f * u
        val bottom = rowH - botPad
        val dateSize = Math.min(clamp(cw * 0.26f, 9f * u, 13f * u), rowH * 0.24f)
        val dateBase = topPad + dateSize * 0.95f
        val dateBottom = topPad + dateSize * 1.35f
        val ss = dateSize * 0.9f
        val holSize = dateSize * 0.62f
        val pillH = clamp(rowH * 0.19f, 9f * u, 12f * u)
        val pg = 1f * u
        val dTop = clamp(Math.min(cw * 0.5f, rowH * 0.4f), 14f * u, 44f * u)   // 근무 동그라미 크기 (칸 폭의 절반 · 칸 높이의 40% 중 작은 쪽 · 상한은 7일 위젯과 같은 44dp — 칸이 큰 위젯에서도 칸에 맞게 커짐)
        val dMin = Math.min(dTop, 12f * u)
        val cm = 1.5f * u   // 동그라미 위아래 여백 합
        fun blk(l: Int): Float = if (l <= 0) 0f else l * pillH + (l - 1) * pg
        fun region(l: Int): Float = bottom - (if (l > 0) blk(l) + pg else 0f) - dateBottom   // 날짜 줄과 메모 사이 (동그라미 자리)

        // 메모 줄 수: 칸이 높으면 2줄, 낮으면 1줄, 더 낮으면 0줄. 근무 동그라미가 1줄일 땐 dMin(12dp) · 2줄일 땐 17dp 이상 남아야 하고(둘째 줄 때문에 동그라미가 너무 작아지지 않게),
        // 공휴일 한 글자가 숫자 아래로 내려온 날에도 메모와 안 닿아야 함
        val labelEnd = dateBase + holSize * 1.35f
        var lines = Math.max(0, Math.min(memoMax, 2))
        while (lines > 0 && (region(lines) < (if (!hasCircle) 0f else if (lines >= 2) Math.min(dTop, 17f * u) + cm else dMin + cm) || bottom - blk(lines) - pg < labelEnd)) lines--

        val rowLines = IntArray(rowMemos.size) { Math.min(lines, Math.max(0, rowMemos[it])) }
        val cy = FloatArray(rowMemos.size)
        var d = if (hasCircle) dTop else 0f
        for (r in rowMemos.indices) {
            val reg = region(rowLines[r])
            cy[r] = dateBottom + reg / 2f
            if (hasCircle) d = Math.min(d, reg - cm)   // 모든 칸의 동그라미는 같은 크기 (가장 빡빡한 줄 기준)
        }
        return MonthPlan(padX, dateSize, dateBase, dateBottom, ss, 1f * u, topPad, holSize, pillH, pg, bottom, Math.max(0f, d), rowLines, cy)
    }

    /** 한 칸의 윗줄(날짜 숫자 · 스티커 · 공휴일 글자) 자리: 숫자 오른쪽 끝에 들어가는 첫 줄 스티커 수(row1) · 3 · 4번째가 들어가는 둘째 줄 수(row2) · 공휴일 두 글자를 숫자 옆에 놓을 수 있는지 (못 놓으면 한 글자를 숫자 아래에) */
    class MonthTop(val row1: Int, val row2: Int, val holBeside: Boolean)

    /**
     * @param numW 날짜 숫자 글자 폭 · holW2 공휴일 두 글자 폭 (공휴일이 없으면 0) — 글자 폭은 그리는 쪽이 재서 넘겨 줌
     * @param want 그날 스티커 수 (앱 달력처럼 하루 최대 4개: 숫자 옆 2개 + 둘째 줄 2개 · 둘째 줄은 오른쪽 끝 · 근무 동그라미 오른쪽 위에 살짝 걸쳐도 스티커가 위에 보임)
     */
    fun monthTop(plan: MonthPlan, cw: Float, u: Float, numW: Float, want: Int, holW2: Float): MonthTop {
        val ss = plan.stkSize
        val gap = plan.stkGap
        val pad = plan.padX
        fun wid(k: Int): Float = if (k <= 0) 0f else k * ss + (k - 1) * gap
        val total = Math.min(Math.max(0, want), 4)
        var n1 = Math.min(total, 2)
        while (n1 > 0 && pad + numW + 1f * u + wid(n1) > cw - pad) n1--   // 숫자와 스티커가 닿으면 첫 줄 스티커를 줄임
        val n2 = Math.min(total - n1, 2)
        var beside = false
        if (holW2 > 0f && n2 == 0) {   // 둘째 줄이 있는 날은 공휴일 글자를 늘 숫자 아래에 (둘째 줄은 오른쪽 끝이라 안 겹침)
            val room = cw - 2f * pad - numW - 2.5f * u - (if (n1 > 0) wid(n1) + 1f * u else 0f)
            beside = holW2 <= room
        }
        return MonthTop(n1, n2, beside)
    }

    /** 한 달 위젯 맨 윗줄 누르는 자리의 폭(dp) — widget_month_view.xml 의 mz_chip · mz_title 폭과 같아야 함 */
    const val MONTH_CHIP_ZONE_DP = 104f
    const val MONTH_TITLE_ZONE_DP = 100f

    class MonthArrows(val prevX: Float, val nextX: Float, val titleCx: Float)

    /** 제목 글자가 이 폭(px)보다 넓으면 줄여서 그림 — 좁은 위젯에서도 양옆 화살표 자리(각 22dp)를 남김 */
    fun monthTitleMax(w: Float, u: Float, hasChip: Boolean): Float = (w - (if (hasChip) MONTH_CHIP_ZONE_DP * u else 0f)) - 44f * u

    /**
     * 한 달 위젯 맨 윗줄: 제목 양옆의 ‹ › 글자 가운데 x (제목 가운데 = 이름 칩 자리를 뺀 나머지의 가운데).
     * 화살표는 칩이 있든 없든 제목 바로 옆(16dp)에 두되, 자기 눌리는 칸(앞 달 칸 · 다음 달 칸) 안쪽으로 밀어 넣음 (좁은 위젯 + 이름 칩 + 넓은 제목일 때만 닿음)
     */
    fun monthArrows(w: Float, u: Float, hasChip: Boolean, titleW: Float): MonthArrows {
        val chipZone = if (hasChip) MONTH_CHIP_ZONE_DP * u else 0f
        val cx = chipZone + (w - chipZone) / 2f
        val half = 6f * u   // 화살표 글자 폭의 절반쯤
        val halfZone = MONTH_TITLE_ZONE_DP * u / 2f
        val p = clamp(cx - titleW / 2f - 16f * u, chipZone + half, cx - halfZone - half)
        val n = clamp(cx + titleW / 2f + 16f * u, cx + halfZone + half, w - half)
        return MonthArrows(p, n, cx)
    }
}
