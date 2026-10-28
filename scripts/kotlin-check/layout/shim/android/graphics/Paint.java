package android.graphics;

import java.awt.Font;
import java.awt.font.FontRenderContext;

public class Paint {
    public static final int ANTI_ALIAS_FLAG = 1, FILTER_BITMAP_FLAG = 2, STRIKE_THRU_TEXT_FLAG = 16;
    public enum Style { FILL, STROKE, FILL_AND_STROKE }
    public enum Align { LEFT, CENTER, RIGHT }
    int color = 0xFF000000;
    Style style = Style.FILL;
    float strokeWidth = 0f, textSize = 12f;
    Typeface typeface = Typeface.DEFAULT;
    Align align = Align.LEFT;
    boolean underline = false;
    boolean strike = false;
    static final FontRenderContext FRC = new FontRenderContext(null, true, true);

    public Paint() {}
    public Paint(int flags) {}
    public Paint(Paint o) { color = o.color; style = o.style; strokeWidth = o.strokeWidth; textSize = o.textSize; typeface = o.typeface; align = o.align; underline = o.underline; strike = o.strike; }
    public int getColor() { return color; }
    public void setColor(int c) { color = c; }
    public int getAlpha() { return (color >>> 24) & 255; }
    public void setAlpha(int a) { color = (color & 0x00FFFFFF) | ((a & 255) << 24); }
    public Style getStyle() { return style; }
    public void setStyle(Style s) { style = s; }
    public float getStrokeWidth() { return strokeWidth; }
    public void setStrokeWidth(float w) { strokeWidth = w; }
    public float getTextSize() { return textSize; }
    public void setTextSize(float s) { textSize = s; }
    public Typeface getTypeface() { return typeface; }
    public Typeface setTypeface(Typeface t) { typeface = t; return t; }
    public Align getTextAlign() { return align; }
    public void setTextAlign(Align a) { align = a; }
    public boolean isUnderlineText() { return underline; }
    public void setUnderlineText(boolean u) { underline = u; }
    public boolean isStrikeThruText() { return strike; }
    public void setStrikeThruText(boolean s) { strike = s; }
    public void setAntiAlias(boolean b) {}

    Font font() { return new Font("SansSerif", typeface != null && typeface.bold ? Font.BOLD : Font.PLAIN, 12).deriveFont(textSize); }
    public float measureText(String s) { return (float) font().getStringBounds(s, FRC).getWidth(); }
    /** 앞에서부터 maxWidth 안에 들어가는 글자 수 (안드로이드 Paint.breakText 와 같은 뜻) */
    public int breakText(String text, boolean measureForwards, float maxWidth, float[] measuredWidth) {
        int n = 0;
        for (int i = 1; i <= text.length(); i++) { if (measureText(text.substring(0, i)) <= maxWidth) n = i; else break; }
        if (measuredWidth != null && measuredWidth.length > 0) measuredWidth[0] = measureText(text.substring(0, n));
        return n;
    }
    public float ascent() { return -font().getLineMetrics("가A", FRC).getAscent(); }
    public float descent() { return font().getLineMetrics("가A", FRC).getDescent(); }
}
