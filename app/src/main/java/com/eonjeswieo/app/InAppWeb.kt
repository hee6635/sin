package com.eonjeswieo.app

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle

/** 링크를 앱 위에 뜨는 브라우저 창(커스텀 탭)으로 열기 — ✕ · 뒤로 가기로 바로 앱에 돌아옴.
 *  라이브러리 없이 커스텀 탭 약속(세션 extra)만 붙임 → 지원 안 하는 브라우저면 평소처럼 열림. */
object InAppWeb {
    fun open(ctx: Context, url: String, newTask: Boolean = ctx !is Activity) {
        if (!(url.startsWith("https://") || url.startsWith("http://"))) return
        val i = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        val b = Bundle()
        b.putBinder("android.support.customtabs.extra.SESSION", null)
        i.putExtras(b)
        i.putExtra("android.support.customtabs.extra.TITLE_VISIBILITY", 1)   // 위에 페이지 제목
        i.putExtra("android.support.customtabs.extra.SHARE_STATE", 1)
        if (newTask) i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        ctx.startActivity(i)
    }
}
