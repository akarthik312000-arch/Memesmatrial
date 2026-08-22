"""Unlimited procedural illustration backgrounds - aesthetic mood-reel style.
Each run composes NEW random scenes: palette x sky x celestial x terrain x water x props.
Usage: python make_bgs.py <outdir> <count>"""
import math
import os
import random
import sys

from PIL import Image, ImageDraw

W, H = 1188, 2112
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join("public", "bg-cache")
COUNT = int(sys.argv[2]) if len(sys.argv) > 2 else 5
os.makedirs(OUT, exist_ok=True)

# ---------------- palettes: (sky_top, sky_bot, accent, dark, water_or_None) ----------------
PALETTES = [
    ((252, 214, 150), (233, 150, 92), (255, 240, 210), (86, 50, 50), None),          # golden dusk
    ((53, 116, 156), (94, 158, 190), (240, 233, 205), (196, 60, 48), None),          # teal pop field
    ((16, 24, 50), (44, 62, 100), (235, 238, 220), (14, 20, 40), (30, 44, 76)),      # starry night
    ((186, 200, 172), (134, 154, 126), (232, 224, 200), (96, 116, 92), None),        # sage mist
    ((150, 136, 98), (120, 108, 76), (232, 220, 180), (74, 66, 44), None),           # olive duotone
    ((255, 205, 178), (244, 162, 140), (255, 246, 230), (120, 62, 70), None),        # peach blossom
    ((42, 48, 68), (88, 84, 116), (244, 220, 170), (30, 32, 46), (52, 58, 86)),      # violet twilight
    ((210, 228, 238), (160, 194, 214), (250, 250, 245), (70, 100, 124), (120, 164, 190)),  # arctic day
    ((244, 172, 74), (216, 106, 56), (255, 238, 200), (110, 44, 34), None),          # autumn ember
    ((36, 66, 78), (72, 122, 122), (238, 232, 208), (20, 40, 46), (54, 104, 104)),   # deep lagoon
    ((234, 220, 190), (204, 176, 142), (250, 244, 226), (104, 84, 60), None),        # retro sepia
    ((52, 28, 60), (128, 48, 84), (255, 214, 170), (30, 14, 34), (80, 30, 60)),      # magenta sunset
    ((188, 216, 196), (146, 186, 162), (248, 246, 232), (66, 102, 82), None),        # mint meadow
    ((222, 184, 135), (188, 140, 96), (255, 242, 210), (94, 62, 40), None),          # desert sand
    ((30, 34, 44), (66, 74, 92), (230, 232, 226), (18, 20, 26), (44, 52, 68)),       # monsoon slate
    ((255, 235, 205), (235, 196, 168), (255, 255, 248), (150, 96, 72), (210, 190, 170)),  # soft cream sea
    ((64, 84, 118), (130, 152, 182), (240, 240, 228), (36, 50, 78), (90, 114, 148)), # rainy blue
    ((250, 226, 150), (244, 178, 110), (255, 252, 235), (140, 82, 52), None),        # honey morning
    ((40, 60, 52), (86, 116, 96), (226, 236, 210), (22, 34, 28), None),              # pine forest
    ((238, 238, 238), (206, 206, 206), (60, 60, 60), (40, 40, 40), None),            # b&w minimal
]

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

class Scene:
    def __init__(self, rnd):
        self.rnd = rnd
        self.img = Image.new("RGB", (W, H))
        self.d = ImageDraw.Draw(self.img)
        pal = rnd.choice(PALETTES)
        self.sky_top, self.sky_bot, self.accent, self.dark, self.water = pal
        self.night = sum(pal[0]) < 260

    def grad_sky(self):
        for y in range(H):
            self.d.line([(0, y), (W, y)], fill=lerp(self.sky_top, self.sky_bot, y / H))

    def glow_ellipse(self, box, color, alpha):
        gl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(gl).ellipse(box, fill=color + (alpha,))
        self.img.paste(gl, (0, 0), gl)

    def celestial(self):
        r = self.rnd.choice([70, 85, 100, 120])
        cx = self.rnd.randint(int(W * 0.15), int(W * 0.85))
        cy = self.rnd.randint(int(H * 0.08), int(H * 0.3))
        if self.rnd.random() < 0.55 or not self.night:
            self.glow_ellipse([cx - r * 1.9, cy - r * 1.9, cx + r * 1.9, cy + r * 1.9], self.accent, 45)
            self.d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=self.accent)  # sun
        elif self.night:
            self.glow_ellipse([cx - r * 1.7, cy - r * 1.7, cx + r * 1.7, cy + r * 1.7], self.accent, 35)
            self.d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=self.accent)  # moon
            mr = random.Random(cx)
            for _ in range(4):
                ox, oy = mr.randint(-r // 2, r // 2), mr.randint(-r // 2, r // 2)
                cr = mr.randint(r // 10, r // 6)
                self.d.ellipse([cx + ox - cr, cy + oy - cr, cx + ox + cr, cy + oy + cr],
                               fill=lerp(self.accent, self.sky_top, 0.25))
        return cx, cy

    def stars(self):
        if not self.night:
            return
        for _ in range(self.rnd.randint(60, 130)):
            sx, sy = self.rnd.randint(0, W), self.rnd.randint(0, int(H * 0.6))
            sr = self.rnd.choice([2, 2, 3, 4])
            self.d.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(225, 230, 245))

    def clouds(self, horizon_y):
        if self.rnd.random() < 0.25:
            return
        for _ in range(self.rnd.randint(1, 3)):
            cx = self.rnd.randint(int(W * 0.1), int(W * 0.9))
            cy = self.rnd.randint(int(H * 0.12), int(horizon_y * 0.75))
            s = self.rnd.randint(70, 150)
            cc = lerp(self.accent, (255, 255, 255), 0.5) if not self.night else lerp(self.accent, self.sky_top, 0.4)
            self.d.ellipse([cx - 3.2 * s, cy - s, cx + 3.2 * s, cy + s], fill=cc)
            self.d.ellipse([cx - 1.9 * s, cy - 1.7 * s, cx + 0.5 * s, cy + 0.3 * s], fill=cc)
            self.d.ellipse([cx - 0.4 * s, cy - 2.1 * s, cx + 2.1 * s, cy + 0.2 * s], fill=cc)

    def ridge(self, base_y, amp, color, peaks=None):
        peaks = peaks or self.rnd.randint(3, 7)
        pts = []
        n = peaks * 2 + 1
        ph = self.rnd.random() * 10
        for i in range(n + 1):
            x = W * i / n
            k = abs(math.sin(i * self.rnd.uniform(1.1, 2.2) + ph))
            pts.append((x, base_y - k * amp * self.rnd.uniform(0.5, 1.0)))
        self.d.polygon([(0, H)] + pts + [(W, H)], fill=color)

    def dunes(self, base_y, color):
        pts = []
        a1, p1, a2, p2 = self.rnd.randint(40, 90), self.rnd.random() * 9, self.rnd.randint(15, 40), self.rnd.random() * 9
        for i in range(0, W + 20, 20):
            x = i
            y = base_y - math.sin(x / 260 + p1) * a1 - math.sin(x / 90 + p2) * a2
            pts.append((x, y))
        self.d.polygon(pts + [(W, H), (0, H)], fill=color)

    def skyline(self, base_y, color):
        x = -self.rnd.randint(0, 60)
        while x < W:
            bw = self.rnd.randint(60, 150)
            bh = self.rnd.randint(120, 380)
            self.d.rectangle([x, base_y - bh, x + bw, H], fill=color)
            if self.night and self.rnd.random() < 0.8:  # lit windows
                for wy in range(base_y - bh + 18, base_y - 14, 34):
                    for wx in range(x + 12, x + bw - 16, 30):
                        if self.rnd.random() < 0.5:
                            self.d.rectangle([wx, wy, wx + 12, wy + 16], fill=self.accent)
            x += bw + self.rnd.randint(-8, 18)

    def water_body(self, top_y, color):
        self.d.rectangle([0, top_y, W, H], fill=color)
        for _ in range(self.rnd.randint(14, 26)):  # ripple streaks
            ry = self.rnd.randint(top_y + 20, H - 40)
            rw = self.rnd.randint(60, 320)
            rx = self.rnd.randint(0, W - rw)
            self.d.line([(rx, ry), (rx + rw, ry)],
                        fill=lerp(color, self.accent, 0.35), width=self.rnd.choice([3, 4, 5]))

    def ground_band(self, top_y, color):
        self.d.rectangle([0, top_y, W, H], fill=color)

    # ---------- props ----------
    def round_tree(self, x, gy, s):
        self.d.rectangle([x - 0.07 * s, gy - 0.5 * s, x + 0.07 * s, gy], fill=self.dark)
        self.d.ellipse([x - 0.55 * s, gy - 1.2 * s, x + 0.55 * s, gy - 0.3 * s], fill=self.dark)

    def pine(self, x, gy, s):
        self.d.rectangle([x - 0.05 * s, gy - 0.3 * s, x + 0.05 * s, gy], fill=self.dark)
        for i, w in enumerate((0.55, 0.42, 0.3)):
            ty = gy - 0.25 * s - i * 0.35 * s
            self.d.polygon([(x - w * s, ty), (x + w * s, ty), (x, ty - 0.5 * s)], fill=self.dark)

    def palm(self, x, gy, s):
        self.d.line([(x, gy), (x + 0.15 * s, gy - 0.9 * s)], fill=self.dark, width=max(6, int(0.06 * s)))
        tx, ty = x + 0.15 * s, gy - 0.9 * s
        for ang in (-160, -125, -90, -55, -20):
            ex = tx + math.cos(math.radians(ang)) * 0.55 * s
            ey = ty + math.sin(math.radians(ang)) * 0.45 * s
            self.d.arc([min(tx, ex) - 20, min(ty, ey) - 20, max(tx, ex) + 20, max(ty, ey) + 20], ang, ang + 120,
                       fill=self.dark, width=max(5, int(0.05 * s)))

    def cactus(self, x, gy, s):
        self.d.rounded_rectangle([x - 0.09 * s, gy - s, x + 0.09 * s, gy], radius=int(0.09 * s), fill=self.dark)
        self.d.rounded_rectangle([x - 0.34 * s, gy - 0.65 * s, x - 0.09 * s, gy - 0.38 * s],
                                 radius=int(0.08 * s), fill=self.dark)
        self.d.rounded_rectangle([x + 0.09 * s, gy - 0.8 * s, x + 0.32 * s, gy - 0.5 * s],
                                 radius=int(0.08 * s), fill=self.dark)

    def tent(self, x, gy, s):
        col = self.accent if self.rnd.random() < 0.6 else self.dark
        self.d.polygon([(x - 0.6 * s, gy), (x + 0.6 * s, gy), (x, gy - s)], fill=col)
        self.d.polygon([(x - 0.16 * s, gy), (x + 0.16 * s, gy), (x, gy - 0.55 * s)], fill=self.dark)

    def balloon(self, x, y, s):
        self.d.ellipse([x - 0.5 * s, y - 0.65 * s, x + 0.5 * s, y + 0.65 * s], fill=self.accent)
        self.d.rectangle([x - 0.16 * s, y + 0.72 * s, x + 0.16 * s, y + 0.95 * s], fill=self.dark)
        self.d.line([(x - 0.14 * s, y + 0.72 * s), (x - 0.3 * s, y + 0.5 * s)], fill=self.dark, width=4)
        self.d.line([(x + 0.14 * s, y + 0.72 * s), (x + 0.3 * s, y + 0.5 * s)], fill=self.dark, width=4)

    def boat(self, x, y, s):
        self.d.polygon([(x - 0.5 * s, y), (x + 0.5 * s, y), (x + 0.32 * s, y + 0.2 * s),
                        (x - 0.32 * s, y + 0.2 * s)], fill=self.dark)
        self.d.line([(x, y), (x, y - 0.9 * s)], fill=self.dark, width=max(4, int(0.04 * s)))
        self.d.polygon([(x, y - 0.85 * s), (x, y - 0.1 * s), (x + 0.42 * s, y - 0.1 * s)], fill=self.accent)

    def birds(self, gy):
        for _ in range(self.rnd.randint(2, 5)):
            bx = self.rnd.randint(int(W * 0.1), int(W * 0.9))
            by = self.rnd.randint(int(gy * 0.15), int(gy * 0.5))
            bs = self.rnd.randint(18, 30)
            self.d.arc([bx - bs, by - bs * 0.6, bx, by + bs * 0.6], 200, 340, fill=self.dark, width=4)
            self.d.arc([bx, by - bs * 0.6, bx + bs, by + bs * 0.6], 200, 340, fill=self.dark, width=4)

    def flowers(self, top_y):
        if self.rnd.random() < 0.4:
            return
        for _ in range(self.rnd.randint(20, 45)):
            fx = self.rnd.randint(0, W)
            fy = self.rnd.randint(top_y + 30, H - 40)
            fr = self.rnd.choice([8, 10, 12])
            fc = self.rnd.choice([self.accent, lerp(self.accent, (255, 255, 255), 0.4)])
            self.d.ellipse([fx - fr, fy - fr, fx + fr, fy + fr], fill=fc)


def build_scene(seed):
    rnd = random.Random(seed)
    sc = Scene(rnd)
    sc.grad_sky()
    sc.stars()
    horizon = rnd.randint(int(H * 0.5), int(H * 0.68))
    sc.celestial()
    sc.clouds(horizon)
    sc.birds(horizon)

    terrain = rnd.choices(["ridges", "dunes", "skyline", "field"], weights=[4, 2, 2, 2])[0]
    has_water = rnd.random() < 0.4
    ground_y = horizon

    if terrain == "ridges":
        layers = rnd.randint(1, 3)
        cols = [lerp(sc.dark, sc.sky_bot, t) for t in [0.55, 0.3, 0.05][:layers]]
        for i, col in enumerate(cols):
            sc.ridge(horizon + int(i * H * 0.05), rnd.randint(150, 300) // layers, col)
        ground_y = horizon + int((layers - 1) * H * 0.05)
    elif terrain == "dunes":
        sc.dunes(horizon, lerp(sc.dark, sc.sky_bot, 0.4))
        if rnd.random() < 0.5:
            sc.dunes(horizon + 90, lerp(sc.dark, sc.sky_bot, 0.15))
        ground_y = horizon + 90
    elif terrain == "skyline":
        sc.skyline(horizon, lerp(sc.dark, (0, 0, 0), 0.2))
    else:
        sc.ground_band(horizon, lerp(sc.dark, sc.sky_bot, rnd.uniform(0.1, 0.4)))
        sc.flowers(horizon)

    if has_water:
        wt = ground_y + rnd.randint(60, 200)
        wc = sc.water or lerp(sc.sky_bot, (255, 255, 255), 0.1)
        sc.water_body(wt, wc)
        ground_y = wt
        if rnd.random() < 0.6:
            sc.boat(rnd.randint(int(W * 0.25), int(W * 0.75)),
                    rnd.randint(wt + 60, min(wt + 260, H - 120)), rnd.randint(120, 200))

    pool = ["round_tree", "pine", "palm", "cactus", "tent"]
    rnd.shuffle(pool)
    k = rnd.randint(1, 3)
    used_x = []
    for ptype in pool:
        if len(used_x) >= k:
            break
        for _ in range(12):
            px = rnd.randint(int(W * 0.12), int(W * 0.88))
            if all(abs(px - ux) > 320 for ux in used_x):
                used_x.append(px)
                py = min(ground_y + rnd.randint(0, 120), H - 60)
                s = rnd.randint(220, 420)
                getattr(sc, ptype)(px, py, s)
                break
    if rnd.random() < 0.3:
        sc.balloon(rnd.randint(int(W * 0.2), int(W * 0.8)),
                   rnd.randint(int(H * 0.18), int(H * 0.4)), rnd.randint(160, 260))
    return sc.img


for idx in range(COUNT):
    img = build_scene(random.randrange(1 << 30))
    name = os.path.join(OUT, f"scene_{random.randrange(10**8):08d}.png")
    img.save(name, "PNG")

print(f"DONE {COUNT} SCENES -> {OUT}")
