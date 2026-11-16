package com.eonjeswieo.app

import android.content.Context
import android.graphics.Typeface

/** v0.150 위젯 글꼴 = 앱과 같은 Pretendard (assets/fonts/w_r · w_m · w_b.ttf — 한글 · 영문만 남긴 고정 굵기 400 · 500 · 700). 못 읽으면 폰 기본 글꼴 */
internal object WFont {
    @Volatile private var done = false
    @Volatile var reg: Typeface = Typeface.DEFAULT
    @Volatile var med: Typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
    @Volatile var bold: Typeface = Typeface.DEFAULT_BOLD

    fun init(ctx: Context) {
        if (done) return
        done = true
        try {
            val a = ctx.applicationContext.assets
            reg = Typeface.createFromAsset(a, "fonts/w_r.ttf")
            med = Typeface.createFromAsset(a, "fonts/w_m.ttf")
            bold = Typeface.createFromAsset(a, "fonts/w_b.ttf")
        } catch (e: Exception) {
            reg = Typeface.DEFAULT; med = Typeface.create("sans-serif-medium", Typeface.NORMAL); bold = Typeface.DEFAULT_BOLD
        }
    }
}
