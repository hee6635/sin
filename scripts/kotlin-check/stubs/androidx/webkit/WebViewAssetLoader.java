package androidx.webkit;
public final class WebViewAssetLoader {
  public interface PathHandler { }
  public static final class AssetsPathHandler implements PathHandler { public AssetsPathHandler(android.content.Context c) {} }
  public android.webkit.WebResourceResponse shouldInterceptRequest(android.net.Uri u) { return null; }
  public static final class Builder { public Builder addPathHandler(String p, PathHandler h) { return this; } public WebViewAssetLoader build() { return null; } }
}
