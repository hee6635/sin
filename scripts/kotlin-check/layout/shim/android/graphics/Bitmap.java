package android.graphics;

import java.awt.image.BufferedImage;

public class Bitmap {
    public enum Config { ARGB_8888 }
    public final BufferedImage img;
    private Bitmap(int w, int h) { img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB); }
    public static Bitmap createBitmap(int w, int h, Config c) { return new Bitmap(w, h); }
    public int getWidth() { return img.getWidth(); }
    public int getHeight() { return img.getHeight(); }
    public void eraseColor(int c) { for (int y = 0; y < img.getHeight(); y++) for (int x = 0; x < img.getWidth(); x++) img.setRGB(x, y, c); }
}
