package com.google.firebase.analytics;
/** 컴파일 검사용 가짜(진짜는 firebase-analytics 라이브러리) */
public class FirebaseAnalytics {
    public static FirebaseAnalytics getInstance(android.content.Context c) { return new FirebaseAnalytics(); }
    public void logEvent(String name, android.os.Bundle b) {}
    public void setUserProperty(String n, String v) {}
    public void setAnalyticsCollectionEnabled(boolean on) {}
}
