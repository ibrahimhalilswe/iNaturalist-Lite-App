"""
iNaturalist Lite — icon generator
Generates: icon.png, android-icon-*.png, splash-icon.png for Expo,
           favicon.ico and logo.svg for the web app.
"""
from PIL import Image, ImageDraw, ImageFilter
import math, os

# ─── Palette ──────────────────────────────────────────────────────────────────
BG       = (26, 71, 49)      # #1a4731 — dark green
LEAF     = (74, 222, 128)    # #4ade80 — bright leaf green
LEAFDARK = (26, 71, 49)      # veins same as bg
STEM     = (255, 255, 255)   # white stem
DOT      = (217, 119, 54)    # #d97736 — amber accent
WHITE    = (255, 255, 255)
TRANS    = (0, 0, 0, 0)

OUT = r"C:\Users\samet\Downloads\inaturalist-lite-App\apps\mobile\assets"

# ─── Helpers ──────────────────────────────────────────────────────────────────

def rounded_rect_mask(size, radius):
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([(0, 0), (size[0]-1, size[1]-1)], radius=radius, fill=255)
    return mask

def draw_leaf(draw, cx, cy, width, height, color, vein_color, vein_width=3):
    """Draw a simple leaf shape centred at (cx, cy)."""
    # Main ellipse (tilted effect via polygon points)
    n = 72
    outer = []
    for i in range(n):
        a = 2 * math.pi * i / n - math.pi / 2
        # wider in middle, pointed top and bottom
        stretch = math.sin(a + math.pi / 2)  # 0 at tips, 1 at widest
        rx = (width / 2) * abs(stretch) ** 0.5
        ry = height / 2
        x = cx + rx * math.cos(a + math.pi / 2)
        y = cy + ry * math.sin(a + math.pi / 2)
        outer.append((x, y))
    draw.polygon(outer, fill=color)

    # Centre vein
    draw.line([(cx, cy - height * 0.42), (cx, cy + height * 0.42)],
              fill=vein_color, width=vein_width)

    # Side veins (left)
    for frac, angle in [(0.35, -40), (0.15, -38), (-0.05, -36), (-0.22, -34)]:
        vy = cy + height * frac
        vx_end = cx - width * 0.30
        vx_end2 = cx - width * 0.26
        draw.line([(cx, vy), (vx_end, vy + height * 0.06)],
                  fill=vein_color, width=max(1, vein_width - 1))
    # Side veins (right)
    for frac in [0.35, 0.15, -0.05, -0.22]:
        vy = cy + height * frac
        draw.line([(cx, vy), (cx + width * 0.28, vy + height * 0.06)],
                  fill=vein_color, width=max(1, vein_width - 1))

def draw_icon(size, rounded=True):
    """Return a square icon Image of given size."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Background
    if rounded:
        radius = size // 5
        d.rounded_rectangle([(0, 0), (size-1, size-1)], radius=radius, fill=BG + (255,))
    else:
        d.rectangle([(0, 0), (size-1, size-1)], fill=BG + (255,))

    # Leaf
    lw = size * 0.48
    lh = size * 0.58
    cx, cy = size // 2, size * 0.46
    vein_w = max(1, size // 90)
    draw_leaf(d, cx, cy, lw, lh, LEAF + (255,), LEAFDARK + (220,), vein_width=vein_w)

    # Short stem
    stem_top = cy + lh * 0.42
    stem_bot = cy + lh * 0.56
    d.line([(cx, stem_top), (cx, stem_bot)], fill=WHITE + (200,), width=max(1, size // 80))

    # Amber accent dot beneath stem
    r = size // 28
    d.ellipse([(cx - r, stem_bot), (cx + r, stem_bot + 2 * r)], fill=DOT + (255,))

    return img

def draw_foreground(size):
    """Adaptive icon foreground: transparent bg, leaf on transparent."""
    img = Image.new("RGBA", (size, size), TRANS)
    d = ImageDraw.Draw(img)
    cx, cy = size // 2, size * 0.46
    lw, lh = size * 0.60, size * 0.72
    vw = max(1, size // 72)
    draw_leaf(d, cx, cy, lw, lh, LEAF + (255,), LEAFDARK + (210,), vein_width=vw)
    stem_top = cy + lh * 0.42
    stem_bot = cy + lh * 0.56
    d.line([(cx, stem_top), (cx, stem_bot)], fill=WHITE + (200,), width=max(1, size // 64))
    r = size // 22
    d.ellipse([(cx - r, stem_bot), (cx + r, stem_bot + 2 * r)], fill=DOT + (255,))
    return img

def draw_background(size):
    """Adaptive icon background: solid dark green."""
    img = Image.new("RGBA", (size, size), BG + (255,))
    return img

def draw_monochrome(size):
    """Monochrome version: white leaf on transparent."""
    img = Image.new("RGBA", (size, size), TRANS)
    d = ImageDraw.Draw(img)
    cx, cy = size // 2, size * 0.46
    lw, lh = size * 0.60, size * 0.72
    vw = max(1, size // 72)
    draw_leaf(d, cx, cy, lw, lh, WHITE + (255,), (180, 180, 180, 200), vein_width=vw)
    stem_top = cy + lh * 0.42
    stem_bot = cy + lh * 0.56
    d.line([(cx, stem_top), (cx, stem_bot)], fill=WHITE + (200,), width=max(1, size // 64))
    r = size // 22
    d.ellipse([(cx - r, stem_bot), (cx + r, stem_bot + 2 * r)], fill=WHITE + (255,))
    return img

def draw_splash(size):
    """Splash screen icon: leaf on transparent, larger."""
    img = Image.new("RGBA", (size, size), TRANS)
    d = ImageDraw.Draw(img)
    cx, cy = size // 2, size * 0.45
    lw, lh = size * 0.70, size * 0.82
    vw = max(2, size // 60)
    draw_leaf(d, cx, cy, lw, lh, LEAF + (255,), LEAFDARK + (210,), vein_width=vw)
    stem_top = cy + lh * 0.42
    stem_bot = cy + lh * 0.58
    d.line([(cx, stem_top), (cx, stem_bot)], fill=WHITE + (200,), width=max(2, size // 55))
    r = size // 18
    d.ellipse([(cx - r, stem_bot), (cx + r, stem_bot + 2 * r)], fill=DOT + (255,))
    return img

# ─── Generate ─────────────────────────────────────────────────────────────────

os.makedirs(OUT, exist_ok=True)

# 1. Main app icon — 1024x1024
icon = draw_icon(1024, rounded=True)
icon.save(os.path.join(OUT, "icon.png"))
print("✓ icon.png")

# 2. Android adaptive foreground — 432x432
fg = draw_foreground(432)
fg.save(os.path.join(OUT, "android-icon-foreground.png"))
print("✓ android-icon-foreground.png")

# 3. Android adaptive background — 432x432
bg = draw_background(432)
bg.save(os.path.join(OUT, "android-icon-background.png"))
print("✓ android-icon-background.png")

# 4. Android monochrome — 432x432
mono = draw_monochrome(432)
mono.save(os.path.join(OUT, "android-icon-monochrome.png"))
print("✓ android-icon-monochrome.png")

# 5. Splash icon — 200x200 (transparent, Expo puts it on coloured bg)
splash = draw_splash(200)
splash.save(os.path.join(OUT, "splash-icon.png"))
print("✓ splash-icon.png")

# 6. Favicon (16, 32, 48) for web
FAV_OUT = r"C:\Users\samet\Downloads\inaturalist-lite-App\apps\web"
fav16  = draw_icon(16, rounded=True).convert("RGB")
fav32  = draw_icon(32, rounded=True).convert("RGB")
fav48  = draw_icon(48, rounded=True).convert("RGB")
fav32.save(os.path.join(FAV_OUT, "favicon.ico"), format="ICO", sizes=[(16,16),(32,32),(48,48)])
print("✓ favicon.ico  (web)")

# 7. favicon.png for web (modern browsers prefer SVG but PNG works fine)
draw_icon(180, rounded=True).save(os.path.join(FAV_OUT, "favicon.png"))
print("✓ favicon.png  (web)")

print("\nTüm iconlar oluşturuldu!")
