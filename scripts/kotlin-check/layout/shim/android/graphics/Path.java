package android.graphics;

import java.awt.Shape;
import java.awt.geom.Arc2D;
import java.awt.geom.Ellipse2D;
import java.awt.geom.Path2D;
import java.awt.geom.RoundRectangle2D;

public class Path {
    public enum Direction { CW, CCW }
    final Path2D.Float p = new Path2D.Float();
    public void moveTo(float x, float y) { p.moveTo(x, y); }
    public void lineTo(float x, float y) { p.lineTo(x, y); }
    public void cubicTo(float x1, float y1, float x2, float y2, float x3, float y3) { p.curveTo(x1, y1, x2, y2, x3, y3); }
    public void close() { p.closePath(); }
    public void arcTo(RectF o, float start, float sweep, boolean forceMoveTo) { p.append(new Arc2D.Float(o.left, o.top, o.width(), o.height(), -start, -sweep, Arc2D.OPEN), !forceMoveTo); }
    public void addOval(RectF o, Direction d) { p.append(new Ellipse2D.Float(o.left, o.top, o.width(), o.height()), false); }
    public void addRoundRect(RectF o, float rx, float ry, Direction d) { p.append(new RoundRectangle2D.Float(o.left, o.top, o.width(), o.height(), rx * 2, ry * 2), false); }
    Shape shape() { return p; }
}
