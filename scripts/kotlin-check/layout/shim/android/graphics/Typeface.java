package android.graphics;

public class Typeface {
    public static final Typeface DEFAULT = new Typeface(false);
    public static final Typeface DEFAULT_BOLD = new Typeface(true);
    public static final Typeface MEDIUM = new Typeface(false);
    public static final int NORMAL = 0;
    public static Typeface create(String n, int s) { return MEDIUM; }
    /** 진짜 글꼴 파일(앱 assets)을 Java2D 글꼴로 읽음 — 위젯 Pretendard 미리보기용 */
    public static Typeface createFromAsset(android.content.res.AssetManager a, String path) {
        try {
            String root = System.getProperty("assets", "app/src/main/assets");
            java.awt.Font f = java.awt.Font.createFont(java.awt.Font.TRUETYPE_FONT, new java.io.File(root, path));
            Typeface t = new Typeface(false); t.awt = f; return t;
        } catch (Exception e) { return DEFAULT; }
    }
    public final boolean bold;
    public java.awt.Font awt;
    private Typeface(boolean b) { bold = b; }
}
