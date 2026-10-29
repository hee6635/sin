package com.eonjeswieo.app

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * 출퇴근 날씨: 앱(웹)이 알람마다 넣어 준 주소(서버 함수 /wx?h=집&w=직장&s=출근&e=퇴근)로 새 예보 문구를 받아 온다.
 * 못 받으면(인터넷 없음 · 서버 멈춤) 앱이 미리 만들어 둔 예비 문구(wxp)를 쓴다. 둘 다 없으면 null → 날씨 없이 그냥 넘어감.
 * 문구 모양: {i 아이콘, h 한 줄, t "출근 6° · 퇴근 12°", a 미세먼지 줄, an 미세먼지 수치, r:[{l,p,i,tp,d,pop,pcp,ws,reh,tag}], src}
 */
object Weather {
    fun fetch(url: String, timeoutMs: Int = 6000): JSONObject? {
        if (!url.startsWith("https://") || !url.contains(".cloudfunctions.net/wx?")) return null
        var c: HttpURLConnection? = null
        return try {
            c = URL(url).openConnection() as HttpURLConnection
            c.connectTimeout = timeoutMs
            c.readTimeout = timeoutMs
            c.useCaches = false
            if (c.responseCode != 200) return null
            val body = c.inputStream.bufferedReader().use { it.readText() }
            valid(JSONObject(body))
        } catch (e: Exception) {
            null
        } finally {
            try { c?.disconnect() } catch (e: Exception) { }
        }
    }

    fun parse(s: String?): JSONObject? = try {
        if (s.isNullOrBlank()) null else valid(JSONObject(s))
    } catch (e: Exception) {
        null
    }

    private fun valid(o: JSONObject): JSONObject? = if (o.optString("h").isNotBlank()) o else null

    /** 새로 받거나, 안 되면 예비 문구 */
    fun get(url: String, fallback: String?, timeoutMs: Int = 6000): JSONObject? =
        (if (url.isNotBlank()) fetch(url, timeoutMs) else null) ?: parse(fallback)

    /** 한 줄 수치: "흐림 · 비 10% · 바람 2.1m/s" */
    fun rowText(r: JSONObject): String {
        val parts = ArrayList<String>()
        r.optString("d").takeIf { it.isNotBlank() }?.let { parts.add(it) }
        if (r.has("pop") && !r.isNull("pop")) parts.add("강수 ${r.optInt("pop")}%")
        val pcp = r.optDouble("pcp", 0.0)
        if (pcp > 0) parts.add(if (pcp < 1) "1mm 미만" else "${fmtNum(pcp)}mm")
        if (r.has("ws") && !r.isNull("ws")) parts.add("바람 ${fmtNum(r.optDouble("ws"))}m/s")
        return parts.joinToString(" · ")
    }

    /** 그 줄을 누르면 열 네이버 날씨 (출근 줄 = 집 · 퇴근 줄 = 직장 지역) */
    fun webUrl(q: String): String =
        "https://m.search.naver.com/search.naver?query=" + java.net.URLEncoder.encode(q.trim() + " 날씨", "UTF-8")

    fun temp(r: JSONObject): String = if (r.has("tp") && !r.isNull("tp")) "${r.optInt("tp")}°" else ""

    private fun fmtNum(v: Double): String = if (v == Math.floor(v)) v.toInt().toString() else String.format("%.1f", v)
}
