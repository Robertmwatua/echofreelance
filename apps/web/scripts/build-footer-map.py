"""Stitch the footer's static map preview from OpenStreetMap tiles (run once, by hand).

The result is committed to apps/web/public/ so the footer paints instantly and calls no
third party at runtime. Map data (c) OpenStreetMap contributors.
"""
import io, math, sys, time, urllib.request
from PIL import Image, ImageDraw, ImageEnhance

LAT, LON, ZOOM = -3.2196845, 40.1096298, 17
W, H = 1000, 400         # device pixels; the card renders at roughly half this width
TILE = 256
ACCENT = (255, 77, 28)   # --accent
UA = "echofreelance-tech-school/1.0 (footer map, built once; ecofreelancetechnologyplus@gmail.com)"

def project(lat, lon, z):
    n = 2 ** z
    s = math.sin(math.radians(lat))
    return (lon + 180.0) / 360.0 * n, (0.5 - math.log((1 + s) / (1 - s)) / (4 * math.pi)) * n

def fetch(z, x, y):
    url = f"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        img = Image.open(io.BytesIO(r.read())).convert("RGB")
    time.sleep(0.2)
    return img

def stitch():
    tx, ty = project(LAT, LON, ZOOM)
    left, top = tx * TILE - W / 2, ty * TILE - H / 2
    x0, y0 = int(math.floor(left / TILE)), int(math.floor(top / TILE))
    x1, y1 = int(math.floor((left + W) / TILE)), int(math.floor((top + H) / TILE))
    canvas = Image.new("RGB", ((x1 - x0 + 1) * TILE, (y1 - y0 + 1) * TILE))
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            canvas.paste(fetch(ZOOM, x, y), ((x - x0) * TILE, (y - y0) * TILE))
    ox, oy = int(round(left - x0 * TILE)), int(round(top - y0 * TILE))
    return canvas.crop((ox, oy, ox + W, oy + H))

def pin(img):
    d = ImageDraw.Draw(img, "RGBA")
    px, py = W // 2, H // 2
    d.ellipse([px - 36, py - 36, px + 36, py + 36], fill=ACCENT + (40,))
    d.ellipse([px - 20, py - 20, px + 20, py + 20], fill=(255, 255, 255, 240))
    d.ellipse([px - 13, py - 13, px + 13, py + 13], fill=ACCENT + (255,))
    return img

def paper(img):
    """Warm, quiet version for the light theme.

    OSM ships roads and ground only ~16 levels apart, which goes flat once the colour is
    pulled out, so the top of the range is stretched before the paper tint goes on.
    """
    gray = img.convert("L")
    def tone(v):
        l = v / 255.0
        l = 0.80 + (l - 0.90) / 0.10 * 0.20 if l >= 0.90 else l * 0.889
        return int(round(min(1.0, max(0.0, l)) * 255))
    lit = gray.point([tone(v) for v in range(256)])
    out = Image.merge("RGB", (lit, lit, lit))
    tint = Image.new("RGB", img.size, (255, 253, 247))   # --surface, light theme
    return Image.blend(out, Image.composite(tint, out, lit), 0.4)

def night(img):
    """Re-tone the light basemap into a dark one: sunken ground, lit roads, legible labels.

    Roads are the near-white top of the range and labels the dark bottom, so each gets its
    own curve and the brighter of the two wins.
    """
    gray = img.convert("L")
    ground = 0.09
    def tone(v):
        l = v / 255.0
        ink = max(0.0, (1.0 - l)) * 0.58          # labels and outlines come back up
        road = max(0.0, (l - 0.949) / 0.051) * 0.44  # the near-white road fill lights up
        return int(round(min(1.0, ground + max(ink, road)) * 255))
    lit = gray.point([tone(v) for v in range(256)])
    tint = Image.new("RGB", img.size, (116, 119, 107))   # --rule, dark theme
    out = Image.merge("RGB", (lit, lit, lit))
    out = Image.blend(out, Image.composite(tint, out, lit), 0.22)
    return Image.blend(out, Image.new("RGB", img.size, (34, 35, 30)), 0.12)

base = stitch()
pin(paper(base.copy())).save(sys.argv[1], "PNG", optimize=True)
pin(night(base.copy())).save(sys.argv[2], "PNG", optimize=True)
print("wrote", sys.argv[1], sys.argv[2])
