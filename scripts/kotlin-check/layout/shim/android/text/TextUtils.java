package android.text;

public class TextUtils {
    public enum TruncateAt { START, MIDDLE, END, MARQUEE }
    public static boolean isEmpty(CharSequence s) { return s == null || s.length() == 0; }
    /** 폭에 안 들어가면 끝을 … 로 줄임 (안드로이드 TextUtils.ellipsize 의 END 방식만 흉내) */
    public static CharSequence ellipsize(CharSequence text, TextPaint p, float avail, TruncateAt where) {
        String s = text.toString();
        if (p.measureText(s) <= avail) return s;
        while (s.length() > 0 && p.measureText(s + "…") > avail) s = s.substring(0, s.length() - 1);
        return s + "…";
    }
}
