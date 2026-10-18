package android.graphics;

import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.Shape;
import java.awt.geom.AffineTransform;
import java.awt.geom.Arc2D;
import java.awt.geom.Ellipse2D;
import java.awt.geom.Line2D;
import java.awt.geom.Rectangle2D;
import java.awt.geom.RoundRectangle2D;
import java.util.ArrayList;

/** Java2D 로 그리는 가짜 Canvas. saveLayerAlpha 는 "이후 그리는 것에 투명도 곱하기"로 흉내 (겹친 부분만 진짜와 조금 다름) */
public class Canvas {
    private static class St { AffineTransform tf; Shape clip; float alpha; }
    private final Graphics2D g;
    private final ArrayList<St> stack = new ArrayList<>();
    private float layerAlpha = 1f;

    public Canvas(Bitmap b) {
        g = b.img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);
        g.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);
    }

    private int push() {
        int before = stack.size() + 1;
        St s = new St(); s.tf = g.getTransform(); s.clip = g.getClip(); s.alpha = layerAlpha;
        stack.add(s);
        return before;
    }
    public int save() { return push(); }
    public int saveLayerAlpha(RectF bounds, int alpha) { int n = push(); layerAlpha *= alpha / 255f; return n; }
    public void restore() { if (stack.isEmpty()) return; St s = stack.remove(stack.size() - 1); g.setTransform(s.tf); g.setClip(s.clip); layerAlpha = s.alpha; }
    public void restoreToCount(int n) { while (stack.size() + 1 > n && !stack.isEmpty()) restore(); }
    public void translate(float dx, float dy) { g.translate(dx, dy); }
    public void scale(float sx, float sy) { g.scale(sx, sy); }
    public void rotate(float deg) { g.rotate(Math.toRadians(deg)); }
    public void rotate(float deg, float px, float py) { g.rotate(Math.toRadians(deg), px, py); }
    public boolean clipPath(Path p) { g.clip(p.shape()); return true; }

    private void paint(Shape s, Paint p) {
        int c = p.getColor();
        float a = ((c >>> 24) & 255) / 255f * layerAlpha;
        g.setColor(new Color((c >> 16) & 255, (c >> 8) & 255, c & 255, Math.max(0, Math.min(255, Math.round(a * 255)))));
        if (p.style == Paint.Style.STROKE) { g.setStroke(new BasicStroke(Math.max(0.5f, p.strokeWidth))); g.draw(s); }
        else g.fill(s);
    }
    public void drawRoundRect(RectF r, float rx, float ry, Paint p) { paint(new RoundRectangle2D.Float(r.left, r.top, r.width(), r.height(), rx * 2, ry * 2), p); }
    public void drawCircle(float cx, float cy, float r, Paint p) { paint(new Ellipse2D.Float(cx - r, cy - r, r * 2, r * 2), p); }
    public void drawOval(RectF r, Paint p) { paint(new Ellipse2D.Float(r.left, r.top, r.width(), r.height()), p); }
    public void drawArc(RectF r, float start, float sweep, boolean useCenter, Paint p) { paint(new Arc2D.Float(r.left, r.top, r.width(), r.height(), -start, -sweep, useCenter ? Arc2D.PIE : Arc2D.OPEN), p); }
    public void drawRect(float l, float t, float r, float b, Paint p) { paint(new Rectangle2D.Float(l, t, r - l, b - t), p); }
    public void drawRect(RectF r, Paint p) { drawRect(r.left, r.top, r.right, r.bottom, p); }
    public void drawPath(Path path, Paint p) { paint(path.shape(), p); }
    public void drawLine(float x0, float y0, float x1, float y1, Paint p) {
        int c = p.getColor();
        float a = ((c >>> 24) & 255) / 255f * layerAlpha;
        g.setColor(new Color((c >> 16) & 255, (c >> 8) & 255, c & 255, Math.max(0, Math.min(255, Math.round(a * 255)))));
        g.setStroke(new BasicStroke(Math.max(0.5f, p.strokeWidth), BasicStroke.CAP_BUTT, BasicStroke.JOIN_MITER));
        g.draw(new Line2D.Float(x0, y0, x1, y1));
    }
    public void drawText(String text, float x, float y, Paint p) {
        int c = p.getColor();
        float a = ((c >>> 24) & 255) / 255f * layerAlpha;
        g.setColor(new Color((c >> 16) & 255, (c >> 8) & 255, c & 255, Math.max(0, Math.min(255, Math.round(a * 255)))));
        Font f = p.font();
        g.setFont(f);
        float w = p.measureText(text);
        float x0 = p.align == Paint.Align.CENTER ? x - w / 2f : p.align == Paint.Align.RIGHT ? x - w : x;
        g.drawString(text, x0, y);
        if (p.underline) { g.setStroke(new BasicStroke(Math.max(1f, p.textSize / 14f))); g.draw(new Line2D.Float(x0, y + p.textSize * 0.12f, x0 + w, y + p.textSize * 0.12f)); }
    }
    public void drawBitmap(Bitmap b, Rect src, RectF dst, Paint p) {
        g.setComposite(AlphaComposite.SrcOver.derive(Math.max(0f, Math.min(1f, (p == null ? 1f : p.getAlpha() / 255f) * layerAlpha))));
        g.drawImage(b.img, Math.round(dst.left), Math.round(dst.top), Math.round(dst.width()), Math.round(dst.height()), null);
        g.setComposite(AlphaComposite.SrcOver);
    }
}
