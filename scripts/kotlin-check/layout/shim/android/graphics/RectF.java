package android.graphics;

/** 컴퓨터(JVM)에서 위젯 그리기 코드를 돌려 보기 위한 가짜 안드로이드 그래픽 (실제 앱에는 안 들어감) */
public class RectF {
    public float left, top, right, bottom;
    public RectF() {}
    public RectF(float l, float t, float r, float b) { left = l; top = t; right = r; bottom = b; }
    public float centerX() { return (left + right) / 2f; }
    public float centerY() { return (top + bottom) / 2f; }
    public float width() { return right - left; }
    public float height() { return bottom - top; }
}
