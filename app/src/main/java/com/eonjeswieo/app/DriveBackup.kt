package com.eonjeswieo.app

import android.app.Activity
import android.content.Context
import com.google.android.gms.auth.api.identity.AuthorizationRequest
import com.google.android.gms.auth.api.identity.AuthorizationResult
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.Scope
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import java.util.concurrent.Executors

/**
 * 구글 드라이브 백업.
 * 사용자 본인 드라이브의 "앱 전용 숨김 폴더"(appDataFolder)에 저장해서, 드라이브 목록에도 안 보이고 다른 앱도 못 읽는다.
 * 백업은 최신 + 직전 1개, 2개만 남긴다.
 *
 * 준비: Google Cloud 프로젝트에서 Drive API 를 켜고, 안드로이드 OAuth 클라이언트
 * (패키지 com.eonjeswieo.app + 서명 키 SHA-1)를 만들어야 한다. 없으면 로그인 단계에서 "setup" 오류.
 */
class DriveBackup(private val activity: Activity) {

    companion object {
        private const val SCOPE = "https://www.googleapis.com/auth/drive.appdata"
        private const val API = "https://www.googleapis.com/drive/v3"
        private const val UPLOAD = "https://www.googleapis.com/upload/drive/v3"
        private const val KEEP = 2
        private const val PREFS = "drive"
    }

    private val io = Executors.newSingleThreadExecutor()
    private val prefs = activity.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    /** 로그인 창이 필요할 때 MainActivity 가 띄우고 결과를 [onAuthResult] 로 돌려준다 */
    var launchConsent: ((android.app.PendingIntent) -> Unit)? = null
    private var waiting: ((String?, String?) -> Unit)? = null

    val linked: Boolean get() = prefs.getBoolean("linked", false)

    private fun request() = AuthorizationRequest.builder()
        .setRequestedScopes(listOf(Scope(SCOPE)))
        .build()

    /**
     * 접근 토큰 받기. silent 이면 창을 띄우지 않고, 처음 허용이 필요하면 "need_login" 으로 실패.
     * done(token, error)
     */
    fun token(silent: Boolean, done: (String?, String?) -> Unit) {
        if (silent && !linked) { done(null, "need_login"); return }
        Identity.getAuthorizationClient(activity).authorize(request())
            .addOnSuccessListener { r: AuthorizationResult ->
                if (r.hasResolution()) {
                    val pi = r.pendingIntent
                    if (silent || pi == null || launchConsent == null) {
                        done(null, "need_login")
                    } else {
                        waiting = done
                        launchConsent?.invoke(pi)
                    }
                } else {
                    prefs.edit().putBoolean("linked", true).apply()
                    done(r.accessToken, null)
                }
            }
            .addOnFailureListener { e -> done(null, errCode(e)) }
    }

    /** 로그인 창에서 돌아왔을 때 */
    fun onAuthResult(data: android.content.Intent?) {
        val cb = waiting ?: return
        waiting = null
        try {
            val r = Identity.getAuthorizationClient(activity).getAuthorizationResultFromIntent(data)
            prefs.edit().putBoolean("linked", true).apply()
            cb(r.accessToken, null)
        } catch (e: Exception) {
            cb(null, errCode(e))
        }
    }

    fun unlink() {
        prefs.edit().putBoolean("linked", false).apply()
    }

    private fun errCode(e: Exception): String =
        if (e is ApiException && (e.statusCode == 10 || e.statusCode == 12500)) "setup"
        else if (e is ApiException && e.statusCode == 16) "cancel"
        else "auth"

    // ---------- HTTP ----------

    private fun http(method: String, url: String, token: String, body: ByteArray? = null, type: String? = null): Pair<Int, String> {
        val c = URL(url).openConnection() as HttpURLConnection
        c.requestMethod = method
        c.connectTimeout = 15000
        c.readTimeout = 30000
        c.setRequestProperty("Authorization", "Bearer $token")
        if (body != null) {
            c.doOutput = true
            c.setRequestProperty("Content-Type", type ?: "application/json")
            c.outputStream.use { it.write(body) }
        }
        val code = c.responseCode
        val stream = if (code in 200..299) c.inputStream else c.errorStream
        val out = ByteArrayOutputStream()
        stream?.use { it.copyTo(out) }
        c.disconnect()
        return code to out.toString("UTF-8")
    }

    private fun listFiles(token: String): JSONArray {
        val q = "$API/files?spaces=appDataFolder&orderBy=createdTime%20desc&pageSize=20" +
            "&fields=files(id,name,createdTime,size,appProperties)"
        val (code, txt) = http("GET", q, token)
        if (code !in 200..299) throw RuntimeException("list $code")
        return JSONObject(txt).optJSONArray("files") ?: JSONArray()
    }

    private fun email(token: String): String = try {
        val (code, txt) = http("GET", "$API/about?fields=user(emailAddress)", token)
        if (code in 200..299) JSONObject(txt).getJSONObject("user").optString("emailAddress", "") else ""
    } catch (e: Exception) { "" }

    // ---------- 기능 ----------

    /** 백업 올리기. meta: {"shifts":N,"memos":M} 같은 요약 */
    fun backup(json: String, meta: String, silent: Boolean, done: (JSONObject) -> Unit) {
        token(silent) { t, err ->
            if (t == null) { done(JSONObject().put("ok", false).put("err", err)); return@token }
            io.execute {
                val res = JSONObject().put("op", "backup")
                try {
                    val props = try { JSONObject(meta) } catch (e: Exception) { JSONObject() }
                    val metaJson = JSONObject()
                        .put("name", "eonjeswieo-backup-${System.currentTimeMillis()}.json")
                        .put("parents", JSONArray().put("appDataFolder"))
                        .put("appProperties", props)
                    val b = "----eonjeswieo" + UUID.randomUUID().toString().replace("-", "")
                    val body = ("--$b\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n$metaJson\r\n" +
                        "--$b\r\nContent-Type: application/json\r\n\r\n$json\r\n--$b--").toByteArray(Charsets.UTF_8)
                    val (code, txt) = http("POST", "$UPLOAD/files?uploadType=multipart", t, body, "multipart/related; boundary=$b")
                    if (code !in 200..299) throw RuntimeException("upload $code $txt")
                    // 최신 + 직전 1개만 남기기
                    val files = listFiles(t)
                    for (i in KEEP until files.length()) {
                        try { http("DELETE", "$API/files/${files.getJSONObject(i).getString("id")}", t) } catch (e: Exception) {}
                    }
                    res.put("ok", true).put("files", listFiles(t)).put("email", email(t))
                } catch (e: Exception) {
                    res.put("ok", false).put("err", if (e is java.io.IOException) "net" else "http").put("msg", e.message ?: "")
                }
                done(res)
            }
        }
    }

    fun list(silent: Boolean, done: (JSONObject) -> Unit) {
        token(silent) { t, err ->
            if (t == null) { done(JSONObject().put("op", "list").put("ok", false).put("err", err)); return@token }
            io.execute {
                val res = JSONObject().put("op", "list")
                try {
                    res.put("ok", true).put("files", listFiles(t)).put("email", email(t))
                } catch (e: Exception) {
                    res.put("ok", false).put("err", if (e is java.io.IOException) "net" else "http").put("msg", e.message ?: "")
                }
                done(res)
            }
        }
    }

    fun restore(id: String, done: (JSONObject) -> Unit) {
        token(false) { t, err ->
            if (t == null) { done(JSONObject().put("op", "restore").put("ok", false).put("err", err)); return@token }
            io.execute {
                val res = JSONObject().put("op", "restore")
                try {
                    val (code, txt) = http("GET", "$API/files/$id?alt=media", t)
                    if (code !in 200..299) throw RuntimeException("get $code")
                    res.put("ok", true).put("data", txt)
                } catch (e: Exception) {
                    res.put("ok", false).put("err", if (e is java.io.IOException) "net" else "http").put("msg", e.message ?: "")
                }
                done(res)
            }
        }
    }
}
