"""Generates the PNG icons for Fresh Beatz (needs Pillow: pip install pillow)."""
import os
from PIL import Image, ImageDraw

BG = (231, 227, 217, 255)
PAD, PADEDGE = (243, 235, 216, 255), (207, 195, 168, 255)
OLED, GREY, YELLOW, RED = (11, 11, 16, 255), (164, 163, 160, 255), (243, 194, 49, 255), (238, 74, 71, 255)


def draw(size, margin, rounded):
    S = size * 4
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * .22), fill=BG)
    else:
        d.rectangle([0, 0, S, S], fill=BG)

    m = S * margin
    x0, y0, w, h = m, m, S - 2 * m, S - 2 * m
    g = w * .04
    r = w * .03

    def box(x, y, bw, bh, fill, edge=None):
        d.rounded_rectangle([x, y, x + bw, y + bh], radius=r, fill=fill, outline=edge, width=max(2, int(S * .004)) if edge else 0)

    th, mh = h * .22, h * .2
    bh = h - th - mh - 2 * g
    # top row: display + 3 buttons
    dw = w * .28
    bw = (w - dw - 3 * g) / 3
    box(x0, y0, dw, th, OLED)
    for i, c in enumerate((GREY, YELLOW, RED)):
        box(x0 + dw + g + i * (bw + g), y0, bw, th, c)
    # modifier pads
    y1 = y0 + th + g
    mw = (w - 2 * g) / 3
    for i in range(3):
        box(x0 + i * (mw + g), y1, mw, mh, PAD, PADEDGE)
    # chord pads
    y2 = y1 + mh + g
    cw = (w - 3 * g) / 4
    for i in range(4):
        box(x0 + i * (cw + g), y2, cw, bh, PAD, PADEDGE)
    return img.resize((size, size), Image.LANCZOS)


here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, "..", "icons")
os.makedirs(out, exist_ok=True)
draw(192, .12, True).save(os.path.join(out, "icon-192.png"))
draw(512, .12, True).save(os.path.join(out, "icon-512.png"))
draw(512, .24, False).save(os.path.join(out, "maskable-512.png"))   # full-bleed, content in safe zone
draw(180, .17, False).save(os.path.join(out, "apple-touch-icon.png"))
print("icons written to", os.path.normpath(out))
