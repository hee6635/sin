package com.google.firebase.crashlytics;
public class FirebaseCrashlytics {
  public static FirebaseCrashlytics getInstance() { return null; }
  public void setCrashlyticsCollectionEnabled(boolean on) {}
  public void recordException(Throwable t) {}
  public void log(String m) {}
  public void setCustomKey(String k, String v) {}
}
