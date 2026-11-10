# The storybook castle kit (after the user's sketch): a coursed curtain-wall segment with merlons and arrow slits, a
# round tower drum with a battered foot and a ring of machicolations, a shingled conical roof with a finial and a
# pennant, and a timber hoarding for the wall-walk. The game tiles and scales them (Wilds._castle, _wall_tower,
# _cone_roof, _hoarding), so each is built at a round unit size:
#   castle_wall_seg   8 m long, 10 m tall, 3 m deep      castle_tower_drum  radius 5.6 m, 10 m tall
#   castle_cone_roof  radius 7 m, 12 m tall               castle_hoarding    5 x 3.6 m, 3.6 m tall
#   F:\Downstairs\Blender\blender.exe -b --python tools/blender/build_castle_kit.py [-- name name ...]
# Exports to godot/models/props/wilds/<name>.glb. Front (outside) faces -Y in Blender (+Z in Godot), origin on the floor.
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_landing_kit as kit
from build_landing_kit import Prop

kit.OUT = os.path.join(os.path.dirname(kit.OUT), "wilds")
STONES = ["#6a6670", "#5e5a64", "#74707a", "#585460", "#66626c"]
MORTAR = "#3a3640"
DARK = "#24202a"
SLATE = ["#2e3440", "#363c4a", "#283040"]
WOOD = "#6a4a2a"
WOOD_DARK = "#3e2a1a"
BANNER = "#8a1a1a"
GLOW = "glow:#ffb860"


def _courses(p, w, h, y, z0, row_h=0.62, block=1.5, depth=0.14):
    """Stone blocks laid in courses over a face at depth y (the face's front), running bond, a little uneven."""
    rows = int(h / row_h)
    for r in range(rows):
        z = z0 + row_h * (r + 0.5)
        x = -w / 2 + (block / 2 if r % 2 else 0.0)
        while x < w / 2:
            bw = min(block * p.rng.uniform(0.8, 1.2), w / 2 - x)
            if bw > 0.25:
                p.box((bw - 0.06, depth, row_h - 0.06), (x + bw / 2, y - depth / 2, z), p.rng.choice(STONES), bevel=0.03, wonk=0.006)
            x += bw


def castle_wall_seg():
    p = Prop("castle_wall_seg", 950)
    W, H, D = 8.0, 10.0, 3.0
    # the core (mortar shows between the blocks), a battered foot, then coursed stone on the outside face
    p.box((W, D - 0.3, H), (0, 0.15, H / 2), MORTAR, bevel=0.0)
    p.box((W, 0.8, 1.6), (0, -D / 2 + 0.1, 0.8), STONES[3], bevel=0.06)
    _courses(p, W, H - 1.6, -D / 2 + 0.15, 1.6)
    # inner face: plainer, bigger blocks
    _courses(p, W, H - 0.2, D / 2 + 0.14, 0.0, row_h=0.9, block=2.2, depth=0.12)
    # arrow slits: a dark slot with a splayed stone surround
    for x in (-2.0, 2.0):
        p.box((0.16, 0.2, 1.7), (x, -D / 2 - 0.05, 5.6), DARK, bevel=0.0)
        p.box((0.7, 0.16, 0.14), (x, -D / 2 - 0.08, 6.5), STONES[2], bevel=0.02)
        p.box((0.7, 0.16, 0.14), (x, -D / 2 - 0.08, 4.7), STONES[2], bevel=0.02)
    # string course, wall-walk paving, merlons on the outer edge, a low parapet on the inner edge
    p.box((W, 0.5, 0.35), (0, -D / 2 - 0.05, H - 0.2), STONES[2], bevel=0.04)
    for i in range(8):
        p.box((0.98, D - 0.1, 0.18), (-W / 2 + 0.5 + i, 0, H + 0.09), p.rng.choice(STONES), bevel=0.02, wonk=0.01)
    for i in range(4):
        x = -W / 2 + 1.0 + i * 2.0
        p.box((1.2, 0.6, 1.3), (x, -D / 2 + 0.3, H + 0.18 + 0.65), p.rng.choice(STONES), bevel=0.05, wonk=0.01)
        p.box((1.3, 0.7, 0.14), (x, -D / 2 + 0.3, H + 0.18 + 1.33), STONES[2], bevel=0.03)
    p.box((W, 0.4, 0.7), (0, D / 2 - 0.2, H + 0.18 + 0.35), STONES[3], bevel=0.04)
    # weathering: dark streaks under the slits, moss along the foot
    for x in (-2.0, 2.0):
        p.box((0.3, 0.04, 2.2), (x, -D / 2 - 0.17, 3.6), "#2e2a34", bevel=0.0)
    for k in range(5):
        p.ball(p.rng.uniform(0.25, 0.45), (p.rng.uniform(-W / 2, W / 2), -D / 2 - 0.25, 1.65), "#3a4a2a", scale=(1.6, 0.6, 0.5), lumpy=0.3, subdiv=1)
    p.export()


def castle_tower_drum():
    p = Prop("castle_tower_drum", 951)
    R, H = 5.6, 10.0
    segs = 20
    p.cyl(R + 0.8, R + 0.1, 1.8, (0, 0, 0.9), STONES[3], segs=segs)
    p.cyl(R, R - 0.05, H - 1.8, (0, 0, 1.8 + (H - 1.8) / 2), MORTAR, segs=segs)
    # coursed blocks round the drum, each row offset half a block
    rows = int((H - 2.2) / 0.62)
    for r in range(rows):
        z = 1.8 + 0.31 + r * 0.62
        off = (math.pi / segs) if r % 2 else 0.0
        for i in range(segs):
            a = off + i * 2 * math.pi / segs
            w = 2 * math.pi * R / segs
            p.box((w - 0.07, 0.16, 0.56), (math.cos(a) * (R + 0.02), math.sin(a) * (R + 0.02), z), p.rng.choice(STONES), rot=(0, 0, a + math.pi / 2), bevel=0.025, wonk=0.005)
    # three arrow slits up the outside
    for k, a in enumerate((-math.pi / 2, -math.pi / 2 + 1.1, -math.pi / 2 - 1.1)):
        z = 4.0 + (k % 2) * 2.4
        p.box((0.18, 0.3, 1.6), (math.cos(a) * (R + 0.1), math.sin(a) * (R + 0.1), z), DARK, rot=(0, 0, a + math.pi / 2), bevel=0.0)
    # the machicolation ring: corbels, then an overhanging parapet
    for i in range(segs):
        a = i * 2 * math.pi / segs
        p.box((0.45, 0.9, 0.8), (math.cos(a) * (R + 0.35), math.sin(a) * (R + 0.35), H - 0.5), STONES[2], rot=(0, 0, a + math.pi / 2), bevel=0.04)
    p.cyl(R + 0.85, R + 0.85, 0.3, (0, 0, H - 0.05), STONES[3], segs=segs)
    p.export()


def castle_cone_roof():
    p = Prop("castle_cone_roof", 952)
    R, H = 7.0, 12.0
    # overlapping shingle bands: each band a short cone whose bottom kicks out past the one below it
    bands = 9
    for b in range(bands):
        t0, t1 = b / bands, (b + 1) / bands
        r0, r1 = R * (1 - t0) + 0.25, R * (1 - t1)
        z0, z1 = H * t0, H * t1
        p.lathe([(r0 + 0.12, z0 - 0.08), (r0, z0 + 0.06), (r1, z1 + 0.04), (0.01, z1 + 0.05)], (0, 0, 0), SLATE[b % 3], segs=24)
    # flared eaves and a timber ring under them
    p.lathe([(R + 0.9, -0.2), (R + 0.6, 0.1), (R - 0.3, 0.5), (0.01, 0.6)], (0, 0, 0), SLATE[0], segs=24)
    p.cyl(R - 0.1, R - 0.1, 0.5, (0, 0, -0.35), WOOD_DARK, segs=24)
    # a little dormer with a lit window
    a = -math.pi / 2
    dx, dy = math.cos(a) * R * 0.55, math.sin(a) * R * 0.55
    p.box((1.6, 1.4, 1.6), (dx, dy, H * 0.38), SLATE[1], bevel=0.04)
    p.box((0.7, 0.1, 0.9), (dx, dy - 0.72, H * 0.38), GLOW, bevel=0.0)
    p.box((1.9, 1.6, 0.25), (dx, dy, H * 0.38 + 0.9), SLATE[2], rot=(0.35, 0, 0), bevel=0.03)
    # finial: a spike, a ball, and a pennant
    p.cyl(0.18, 0.04, 2.6, (0, 0, H + 1.3), "#1a1a20", segs=8)
    p.ball(0.28, (0, 0, H + 0.6), "#c8a040", subdiv=1)
    p.box((1.5, 0.05, 0.7), (0.78, 0, H + 2.1), BANNER, rot=(0, 0.08, 0), bevel=0.0)
    p.export()


def castle_hoarding():
    p = Prop("castle_hoarding", 953)
    W, D, H = 5.0, 3.6, 2.4
    # posts, then plank walls with gaps on the outside and both ends; open at the back onto the wall-walk
    for x in (-W / 2, 0, W / 2):
        for y in (-D / 2, D / 2):
            p.box((0.22, 0.22, H + 0.2), (x, y, (H + 0.2) / 2), WOOD_DARK, bevel=0.02, wonk=0.02)
    for i in range(14):
        x = -W / 2 + 0.2 + i * 0.35
        p.box((0.3, 0.08, H * p.rng.uniform(0.92, 1.0)), (x, -D / 2 - 0.05, H / 2), WOOD if i % 3 else "#5a3e24", bevel=0.01, wonk=0.03)
    for s in (-1, 1):
        for i in range(10):
            y = -D / 2 + 0.2 + i * 0.35
            p.box((0.08, 0.3, H * p.rng.uniform(0.9, 1.0)), (s * W / 2, y, H / 2), WOOD, bevel=0.01, wonk=0.03)
    # a shooting slot, and the pitched plank roof
    p.box((1.6, 0.12, 0.25), (0, -D / 2 - 0.1, 1.5), DARK, bevel=0.0)
    for s in (-1, 1):
        for i in range(9):
            x = -W / 2 - 0.3 + i * 0.7
            p.box((0.68, 2.2, 0.08), (x, s * 0.95, H + 0.55), WOOD_DARK if i % 2 else "#4a3220", rot=(s * 0.55, 0, 0), bevel=0.01, wonk=0.02)
    p.box((W + 0.8, 0.2, 0.2), (0, 0, H + 1.12), WOOD_DARK, bevel=0.02)
    p.export()


WHITE_GLOW = "glow:#ffffff"


def _lancet(p, cx, y, z0, w, h, fill):
    """A pointed (lancet) window: jambs, a stepped pointed head in voussoir blocks, and the opening itself."""
    p.box((w, 0.12, h), (cx, y + 0.02, z0 + h / 2), fill, bevel=0.0)
    steps = 7
    for i in range(steps + 1):
        t = i / steps
        a = math.pi * t
        r = w / 2 + 0.22
        x = cx - math.cos(a) * r * 0.95
        z = z0 + h + math.sin(a) * r * 1.35
        p.box((0.36, 0.3, 0.36), (x, y - 0.12, z), STONES[2], rot=(0, -a + math.pi / 2, 0), bevel=0.03)
    p.box((w * 0.6, 0.1, w * 0.7), (cx, y + 0.01, z0 + h + w * 0.35), fill, bevel=0.0)
    for s in (-1, 1):
        p.box((0.32, 0.3, h), (cx + s * (w / 2 + 0.16), y - 0.12, z0 + h / 2), STONES[2], bevel=0.03)


def _grand_bay(name, seed, lit):
    p = Prop(name, seed)
    W, H, D = 5.0, 6.0, 1.2
    p.box((W, D - 0.2, H), (0, 0.1, H / 2), MORTAR, bevel=0.0)
    _courses(p, W, H, -D / 2 + 0.1, 0.0, row_h=0.75, block=1.7)
    # pilasters at the bay edges, a string course at the floor line and a little cornice at the top
    for s in (-1, 1):
        p.box((0.5, 0.35, H), (s * (W / 2 - 0.25), -D / 2 - 0.1, H / 2), STONES[2], bevel=0.04)
    p.box((W, 0.45, 0.3), (0, -D / 2 - 0.1, 0.15), STONES[3], bevel=0.04)
    p.box((W, 0.55, 0.35), (0, -D / 2 - 0.12, H - 0.18), STONES[2], bevel=0.05)
    # the window: lit (white glow, tinted by the game) or dark with a broken shutter hanging off it
    fill = WHITE_GLOW if lit else DARK
    _lancet(p, 0, -D / 2 - 0.02, 1.4, 1.5, 2.4, fill)
    p.box((0.1, 0.14, 3.2), (0, -D / 2 - 0.1, 2.9), "#2a2630", bevel=0.0)
    p.box((1.9, 0.5, 0.18), (0, -D / 2 - 0.2, 1.3), STONES[2], bevel=0.03)
    if not lit:
        p.box((0.75, 0.08, 2.2), (1.25, -D / 2 - 0.3, 2.4), WOOD_DARK, rot=(0, 0.35, 0.5), bevel=0.01, wonk=0.04)
    p.export()


def grand_wall_bay():
    _grand_bay("grand_wall_bay", 960, True)


def grand_wall_bay_dark():
    _grand_bay("grand_wall_bay_dark", 961, False)


def grand_buttress():
    p = Prop("grand_buttress", 962)
    H = 6.0
    # a corner buttress in two set-offs, with a sloped weathering cap at each
    p.box((1.8, 1.8, H * 0.55), (0, 0, H * 0.275), STONES[0], bevel=0.05, wonk=0.006)
    p.box((2.0, 2.0, 0.3), (0, 0, H * 0.55 + 0.1), STONES[2], rot=(0.0, 0.0, 0.0), bevel=0.05)
    p.box((1.4, 1.4, H * 0.45), (0, 0, H * 0.55 + H * 0.225), STONES[4], bevel=0.05, wonk=0.006)
    p.box((1.6, 1.6, 0.3), (0, 0, H - 0.1), STONES[2], bevel=0.05)
    for z in (1.2, 2.4):
        p.box((1.84, 1.84, 0.06), (0, 0, z), MORTAR, bevel=0.0)
    p.export()


PIECES = {f.__name__: f for f in (castle_wall_seg, castle_tower_drum, castle_cone_roof, castle_hoarding,
                                  grand_wall_bay, grand_wall_bay_dark, grand_buttress)}

if __name__ == "__main__":
    wanted = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else list(PIECES)
    for name in wanted:
        PIECES[name]()
