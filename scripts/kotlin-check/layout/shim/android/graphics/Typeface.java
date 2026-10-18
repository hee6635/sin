package android.graphics;

public class Typeface {
    public static final Typeface DEFAULT = new Typeface(false);
    public static final Typeface DEFAULT_BOLD = new Typeface(true);
    public static final Typeface MEDIUM = new Typeface(false);
    public static final int NORMAL = 0;
    public static Typeface create(String n, int s) { return MEDIUM; }
    public final boolean bold;
    private Typeface(boolean b) { bold = b; }
}
