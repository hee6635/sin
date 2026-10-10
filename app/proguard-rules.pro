# 웹 화면에서 부르는 함수 이름이 바뀌지 않게
-keepclassmembers class com.eonjeswieo.app.AlarmBridge {
    @android.webkit.JavascriptInterface <methods>;
}
