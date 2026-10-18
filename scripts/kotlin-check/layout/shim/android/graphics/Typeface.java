package android.graphics;

public class Typeface {
    public static final Typeface DEFAULT = new Typeface(false);
    public static final Typeface DEFAULT_BOLD = new Typeface(true);
    public final boolean bold;
    private Typeface(boolean b) { bold = b; }
}
