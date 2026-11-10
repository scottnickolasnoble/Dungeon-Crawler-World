# The deep floors' kit: the props Floors 10-18 ask for that had no model yet (the game skipped them, so their spots
# were empty). Sizes follow the colliders and scales the floor scripts give them.
#   F:\Downstairs\Blender\blender.exe -b --python tools/blender/build_deep_kit.py [-- name name ...]
# Exports to godot/models/props/wilds/<name>.glb. Front faces -Y in Blender (+Z in Godot), origin on the floor.
# Glow parts are white glow (the game can tint them) or a set colour where the colour is the point (ON AIR is red).
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_landing_kit as kit
from build_landing_kit import Prop

kit.OUT = os.path.join(os.path.dirname(kit.OUT), "wilds")
STONE = ["#5e5a62", "#6a6670", "#545058"]
IRON = "#26242a"
IRON_L = "#3a383e"
OAK = "#3a2618"
OAK_L = "#5a3e26"
GOLD = "#c8a040"
RED = "#8a1a1a"
WHITE = "#e8e4dc"
CHROME = "#b8c0c8"
DARK = "#1a181e"
GLOW = "glow:#ffffff"
WARM = "glow:#ffb860"
RED_GLOW = "glow:#ff3a3a"
GREEN_GLOW = "glow:#5aff7a"
BLUE_GLOW = "glow:#6ab8ff"
B = {}


def prop(fn):
    B[fn.__name__] = fn
    return fn


# ---------------------------------------------------------------- Floor 14: Castle Dread
@prop
def castle_gatehouse():
    p = Prop("castle_gatehouse", 1001)
    W, H, D = 13.0, 18.0, 9.0
    # two flanking blocks, the arch between them, a room over the gate, merlons, the portcullis half raised
    for s in (-1, 1):
        p.box((4.2, D, H), (s * (W / 2 - 2.1), 0, H / 2), STONE[0], bevel=0.08, wonk=0.006)
        for k in range(6):
            p.box((4.4, D + 0.2, 0.3), (s * (W / 2 - 2.1), 0, 2.5 + k * 2.6), STONE[1], bevel=0.04)
        for k in range(2):
            p.box((0.2, 0.3, 1.6), (s * (W / 2 - 2.1), -D / 2 - 0.1, 7 + k * 5), DARK, bevel=0.0)
    p.box((W - 8.4, D, H - 9.0), (0, 0, 9.0 + (H - 9.0) / 2), STONE[2], bevel=0.06)
    for i in range(13):
        a = math.pi * i / 12
        p.box((0.9, D + 0.1, 0.7), (math.cos(a) * 2.7, 0, 6.3 + math.sin(a) * 2.7), STONE[1], rot=(0, -a + math.pi / 2, 0), bevel=0.04)
    for i in range(7):
        x = -W / 2 + 1.0 + i * 1.83
        p.box((1.1, 1.0, 1.4), (x, -D / 2 + 0.5, H + 0.7), STONE[i % 3], bevel=0.05)
    # portcullis: iron grid hanging in the top of the arch
    for x in range(-2, 3):
        p.box((0.14, 0.14, 3.2), (x * 0.95, -D / 2 + 1.2, 7.6), IRON, bevel=0.0)
        p.cyl(0.08, 0.01, 0.4, (x * 0.95, -D / 2 + 1.2, 5.8), IRON, segs=6)
    for z in (6.4, 7.4, 8.4):
        p.box((4.6, 0.12, 0.14), (0, -D / 2 + 1.2, z), IRON, bevel=0.0)
    # a lit window in the gate room, torches either side of the arch, and a red banner
    p.box((1.6, 0.1, 2.0), (0, -D / 2 - 0.02, 12.5), WARM, bevel=0.0)
    for s in (-1, 1):
        p.cyl(0.08, 0.12, 0.8, (s * 3.2, -D / 2 - 0.4, 4.2), IRON, segs=6)
        p.ball(0.22, (s * 3.2, -D / 2 - 0.4, 4.75), WARM, scale=(1, 1, 1.5), subdiv=1)
        p.box((1.4, 0.05, 4.0), (s * (W / 2 - 2.1), -D / 2 - 0.08, 12.5), RED, bevel=0.0)
    p.export()


@prop
def drawbridge():
    p = Prop("drawbridge", 1002)
    L, W = 12.0, 5.2
    for i in range(int(W / 0.4)):
        x = -W / 2 + 0.2 + i * 0.4
        p.box((0.38, L, 0.22), (x, 0, 0.11), OAK if i % 2 else OAK_L, bevel=0.01, wonk=0.01)
    for y in (-L / 2 + 0.5, 0, L / 2 - 0.5):
        p.box((W + 0.2, 0.3, 0.12), (0, y, 0.26), IRON, bevel=0.01)
    # chains rising back towards the gate
    for s in (-1, 1):
        for k in range(14):
            t = k / 13
            p.box((0.12, 0.3, 0.08), (s * (W / 2 - 0.1), -L / 2 + t * 1.5, 0.3 + t * 9.0), IRON_L, rot=(math.atan2(1.5, 9.0), 0, (k % 2) * math.pi / 2), bevel=0.0)
    p.export()


@prop
def coffin():
    p = Prop("coffin", 1003)
    # the classic six-sided coffin, lid shoved half off, something inside
    pts = [(-0.35, -1.05), (0.35, -1.05), (0.42, 0.45), (0.3, 1.05), (-0.3, 1.05), (-0.42, 0.45)]
    for k, (x, y) in enumerate(pts):
        x2, y2 = pts[(k + 1) % 6]
        L = math.hypot(x2 - x, y2 - y)
        p.box((L, 0.06, 0.55), ((x + x2) / 2, (y + y2) / 2, 0.3), OAK, rot=(0, 0, math.atan2(y2 - y, x2 - x)), bevel=0.01)
    p.box((0.75, 2.0, 0.05), (0, 0, 0.04), OAK, bevel=0.01)
    p.box((0.8, 2.1, 0.07), (0.35, 0.15, 0.62), OAK_L, rot=(0, 0.12, 0.25), bevel=0.02)
    p.box((0.08, 0.5, 0.02), (0.38, 0.0, 0.67), GOLD, rot=(0, 0.12, 0.25), bevel=0.0)
    p.ball(0.16, (-0.1, -0.7, 0.42), "#d8d0b8", subdiv=1)
    p.box((0.1, 0.5, 0.08), (-0.25, -0.2, 0.45), "#d8d0b8", rot=(0, 0, 0.4), bevel=0.01)
    p.export()


@prop
def candelabra():
    p = Prop("candelabra", 1004)
    p.cyl(0.32, 0.25, 0.08, (0, 0, 0.04), IRON, segs=12)
    p.cyl(0.05, 0.04, 1.4, (0, 0, 0.75), IRON, segs=8)
    for k in range(5):
        x = (k - 2) * 0.24
        z = 1.45 + (0.18 if k == 2 else 0.05 * (2 - abs(k - 2)))
        p.box((abs(x) + 0.02, 0.04, 0.04), (x / 2, 0, 1.4), IRON, bevel=0.0)
        p.cyl(0.06, 0.06, 0.06, (x, 0, z - 0.04), IRON, segs=8)
        p.cyl(0.035, 0.035, 0.22 + 0.08 * (k % 2), (x, 0, z + 0.1), WHITE, segs=8)
        p.ball(0.045, (x, 0, z + 0.27 + 0.08 * (k % 2)), WARM, scale=(1, 1, 1.8), subdiv=1)
    p.export()


@prop
def armour_stand():
    p = Prop("armour_stand", 1005)
    p.box((0.6, 0.6, 0.1), (0, 0, 0.05), OAK, bevel=0.02)
    for s in (-1, 1):
        p.cyl(0.1, 0.09, 0.85, (s * 0.12, 0, 0.5), IRON_L, segs=8)
    p.box((0.5, 0.32, 0.6), (0, 0, 1.25), IRON_L, bevel=0.06)
    p.box((0.56, 0.36, 0.22), (0, 0, 0.98), IRON, bevel=0.04)
    for s in (-1, 1):
        p.ball(0.15, (s * 0.32, 0, 1.5), IRON_L, subdiv=1)
        p.cyl(0.07, 0.06, 0.6, (s * 0.34, 0, 1.15), IRON_L, segs=8)
    p.cyl(0.15, 0.17, 0.32, (0, 0, 1.72), IRON_L, segs=10)
    p.box((0.22, 0.04, 0.03), (0, -0.16, 1.75), DARK, bevel=0.0)
    p.cyl(0.02, 0.02, 2.0, (0.42, 0, 1.0), OAK_L, segs=6)
    p.box((0.05, 0.3, 0.4), (0.42, 0, 2.05), IRON_L, bevel=0.01)
    p.export()


@prop
def iron_fence():
    p = Prop("iron_fence", 1006)
    L = 3.0
    for z in (0.3, 1.5):
        p.box((L, 0.06, 0.06), (0, 0, z), IRON, bevel=0.0)
    for k in range(13):
        x = -L / 2 + 0.12 + k * 0.23
        p.cyl(0.025, 0.025, 1.8, (x, 0, 0.9), IRON, segs=6)
        p.cyl(0.05, 0.0, 0.18, (x, 0, 1.88), IRON, segs=6)
    for s in (-1, 1):
        p.box((0.16, 0.16, 2.0), (s * L / 2, 0, 1.0), IRON_L, bevel=0.02)
        p.ball(0.1, (s * L / 2, 0, 2.08), IRON_L, subdiv=1)
    p.export()


@prop
def gallows():
    p = Prop("gallows", 1007)
    p.box((3.2, 3.2, 0.2), (0, 0, 2.0), OAK_L, bevel=0.02)
    for x in (-1.5, 1.5):
        for y in (-1.5, 1.5):
            p.box((0.22, 0.22, 2.0), (x, y, 1.0), OAK, bevel=0.02)
    for k in range(9):
        p.box((1.2, 0.3, 0.08), (-1.1, 1.6 + k * 0.32, 1.8 - k * 0.22), OAK_L, bevel=0.01)
    p.box((0.26, 0.26, 4.2), (1.2, 0, 4.2), OAK, bevel=0.02)
    p.box((2.2, 0.24, 0.24), (0.2, 0, 6.2), OAK, bevel=0.02)
    p.box((0.9, 0.12, 0.12), (0.85, 0, 5.75), OAK, rot=(0, -0.8, 0), bevel=0.01)
    p.box((1.0, 1.0, 0.06), (-0.6, 0, 2.12), DARK, bevel=0.0)
    p.cyl(0.025, 0.025, 1.5, (-0.6, 0, 5.4), "#a08a60", segs=6)
    p.cyl(0.13, 0.13, 0.05, (-0.6, 0, 4.6), "#a08a60", rot=(math.pi / 2, 0, 0), segs=10)
    p.export()


@prop
def gargoyle():
    p = Prop("gargoyle", 1008)
    p.box((0.9, 0.9, 0.4), (0, 0, 0.2), STONE[2], bevel=0.04)
    p.ball(0.42, (0, 0.05, 0.75), STONE[0], scale=(1, 1.1, 1.1), lumpy=0.12, subdiv=2)
    p.ball(0.3, (0, -0.32, 1.2), STONE[1], scale=(1, 1.2, 0.9), lumpy=0.1, subdiv=2)
    for s in (-1, 1):
        p.cyl(0.07, 0.0, 0.3, (s * 0.15, -0.3, 1.5), STONE[2], rot=(0.4, s * 0.4, 0), segs=6)
        p.ball(0.06, (s * 0.12, -0.6, 1.25), RED_GLOW, subdiv=1)
        p.box((0.9, 0.08, 0.6), (s * 0.55, 0.2, 1.05), STONE[2], rot=(0, s * 0.6, s * 0.4), bevel=0.02)
        p.cyl(0.08, 0.06, 0.4, (s * 0.25, -0.35, 0.55), STONE[1], segs=6)
    p.box((0.3, 0.12, 0.06), (0, -0.62, 1.1), DARK, bevel=0.0)
    p.export()


@prop
def crypt_door():
    p = Prop("crypt_door", 1009)
    p.box((3.4, 1.2, 0.4), (0, 0, 0.2), STONE[2], bevel=0.04)
    for s in (-1, 1):
        p.box((0.6, 1.0, 3.4), (s * 1.4, 0, 2.1), STONE[0], bevel=0.04)
    p.box((3.4, 1.0, 0.7), (0, 0, 4.1), STONE[1], bevel=0.05)
    p.cyl(0.0, 1.0, 0.8, (0, 0, 4.85), STONE[0], segs=4, rot=(0, 0, math.pi / 4))
    p.box((2.2, 0.15, 3.3), (0, -0.2, 2.05), IRON, bevel=0.02)
    for z in (1.0, 2.0, 3.0):
        p.box((2.25, 0.05, 0.1), (0, -0.3, z), IRON_L, bevel=0.0)
    p.ball(0.12, (0.6, -0.36, 2.0), GOLD, subdiv=1)
    p.box((0.9, 0.05, 0.25), (0, -0.52, 4.1), WHITE, bevel=0.0)
    p.box((0.08, 0.1, 1.8), (-0.3, -0.31, 2.2), "#4a3a2a", rot=(0, 0.3, 0), bevel=0.0)
    p.export()


@prop
def gothic_throne():
    p = Prop("gothic_throne", 1010)
    p.box((1.8, 1.4, 0.3), (0, 0, 0.15), STONE[2], bevel=0.04)
    p.box((1.3, 1.0, 0.6), (0, 0, 0.6), "#3a2028", bevel=0.05)
    p.box((1.3, 0.25, 3.2), (0, 0.45, 1.9), "#2a1a20", bevel=0.05)
    for s in (-1, 1):
        p.box((0.22, 1.0, 0.7), (s * 0.7, 0, 1.0), "#2a1a20", bevel=0.03)
        p.cyl(0.12, 0.0, 1.2, (s * 0.6, 0.45, 4.1), GOLD, segs=6)
    p.cyl(0.18, 0.0, 1.6, (0, 0.45, 4.3), GOLD, segs=6)
    p.box((0.9, 0.06, 2.0), (0, 0.31, 2.1), RED, bevel=0.0)
    p.ball(0.12, (0, 0.28, 3.3), RED_GLOW, subdiv=1)
    p.export()


@prop
def haunted_portrait():
    p = Prop("haunted_portrait", 1011)
    p.box((1.3, 0.1, 1.7), (0, 0, 0.85), GOLD, bevel=0.03)
    p.box((1.05, 0.05, 1.45), (0, -0.04, 0.85), "#1e1a24", bevel=0.0)
    p.ball(0.3, (0, -0.07, 1.0), "#3a3040", scale=(0.8, 0.2, 1.0), subdiv=1)
    p.box((0.7, 0.04, 0.5), (0, -0.07, 0.5), "#2a2030", bevel=0.0)
    for s in (-1, 1):
        p.ball(0.035, (s * 0.09, -0.12, 1.05), RED_GLOW, subdiv=1)
    p.export()


@prop
def witch_tower():
    p = Prop("witch_tower", 1012)
    # a crooked stone tower, leaning more the higher it goes, with a witch-hat roof and one lit window
    lean = 0.0
    for k in range(6):
        r = 2.8 - k * 0.12
        lean += 0.12
        p.cyl(r, r - 0.1, 2.2, (lean * 0.4, 0, 1.1 + k * 2.2), STONE[k % 3], segs=12)
    top = 13.2
    p.cyl(3.1, 3.1, 0.3, (lean * 0.4, 0, top + 0.15), STONE[1], segs=12)
    p.lathe([(3.4, 0), (2.4, 1.2), (1.2, 3.8), (0.3, 6.4), (0.01, 7.2)], (lean * 0.4, 0, top + 0.3), "#1e1a24", segs=12, rot=(0.12, 0, 0))
    p.box((0.9, 0.2, 1.3), (lean * 0.4, -2.7, 10.0), WARM, bevel=0.0)
    p.box((1.2, 0.2, 2.2), (0, -2.75, 1.1), OAK, bevel=0.02)
    p.export()


@prop
def dead_mill():
    p = Prop("dead_mill", 1013)
    p.cyl(3.6, 2.6, 7.0, (0, 0, 3.5), "#4a4038", segs=8)
    p.lathe([(3.0, 0), (1.5, 1.6), (0.01, 2.4)], (0, 0, 7.0), "#2a2420", segs=8)
    # three sails left, one snapped
    for k, ln in enumerate((5.5, 5.5, 2.4)):
        a = k * 2 * math.pi / 3 + 0.3
        p.box((0.25, 0.15, ln), (math.sin(a) * ln / 2, -3.3, 7.4 + math.cos(a) * ln / 2), OAK, rot=(0, a, 0), bevel=0.02)
        p.box((0.9, 0.06, ln * 0.8), (math.sin(a) * ln / 2 + 0.5 * math.cos(a), -3.35, 7.4 + math.cos(a) * ln / 2 - 0.5 * math.sin(a)), "#8a8070", rot=(0, a, 0), bevel=0.0)
    p.ball(0.4, (0, -3.3, 7.4), IRON, subdiv=1)
    p.box((1.3, 0.2, 2.2), (0, -3.0, 1.1), OAK, bevel=0.02)
    p.export()


@prop
def iron_chandelier():
    p = Prop("iron_chandelier", 1014)
    p.cyl(1.2, 1.2, 0.1, (0, 0, 0.0), IRON, segs=16)
    for k in range(10):
        a = k * 2 * math.pi / 10
        x, y = math.cos(a) * 1.2, math.sin(a) * 1.2
        p.cyl(0.04, 0.04, 0.25, (x, y, 0.15), WHITE, segs=6)
        p.ball(0.05, (x, y, 0.32), WARM, scale=(1, 1, 1.8), subdiv=1)
        p.box((0.04, 0.04, 2.6), (x * 0.5, y * 0.5, 1.3), IRON_L, rot=(math.sin(a) * 0.43, -math.cos(a) * 0.43, 0), bevel=0.0)
    p.cyl(0.04, 0.04, 2.0, (0, 0, 3.4), IRON_L, segs=6)
    p.export()


# ---------------------------------------------------------------- Floor 13: the Stacks
@prop
def bookshelf_tall():
    # a wall of shelves too tall to see over, 7.6 m long and 6 m high, books on both faces (the Stacks stand them in rows)
    p = Prop("bookshelf_tall", 1020)
    W, D, H = 7.6, 1.0, 6.0
    for x in (-W / 2, -W / 6, W / 6, W / 2):
        p.box((0.14, D, H), (x, 0, H / 2), OAK, bevel=0.02)
    p.box((W, 0.08, H), (0, 0, H / 2), "#2a1a10", bevel=0.0)
    shelves = 8
    colours = ["#6a2a2a", "#2a4a3a", "#3a3a6a", "#7a5a2a", "#4a2a3a", "#5a5040"]
    for k in range(shelves + 1):
        z = k * H / shelves
        p.box((W, D, 0.08), (0, 0, z + 0.04), OAK_L, bevel=0.01)
        if k == shelves:
            break
        for face in (-1, 1):
            # books in runs: each block a few volumes wide, slightly different heights, the odd gap and leaner
            x = -W / 2 + 0.12
            while x < W / 2 - 0.3:
                bw = p.rng.uniform(0.18, 0.45)
                if p.rng.random() < 0.07:
                    x += 0.3
                    continue
                bh = p.rng.uniform(0.42, 0.64)
                tilt = p.rng.uniform(-0.15, 0.15) if p.rng.random() < 0.1 else 0.0
                p.box((bw - 0.02, D * 0.42, bh), (x + bw / 2, face * D * 0.25, z + 0.08 + bh / 2), p.rng.choice(colours), rot=(0, tilt, 0), bevel=0.0)
                x += bw
    p.export()


@prop
def book_pile():
    p = Prop("book_pile", 1021)
    for stack in range(3):
        cx, cy = p.rng.uniform(-0.4, 0.4), p.rng.uniform(-0.3, 0.3)
        z = 0
        for k in range(p.rng.randint(4, 9)):
            t = p.rng.uniform(0.04, 0.09)
            p.box((p.rng.uniform(0.3, 0.45), p.rng.uniform(0.22, 0.3), t), (cx, cy, z + t / 2), p.rng.choice(["#6a2a2a", "#2a4a3a", "#3a3a6a", "#7a5a2a"]), rot=(0, 0, p.rng.uniform(-0.4, 0.4)), bevel=0.005)
            z += t
    p.export()


@prop
def reading_desk():
    p = Prop("reading_desk", 1022)
    p.box((2.0, 1.0, 0.08), (0, 0, 0.78), OAK_L, bevel=0.02)
    for x in (-0.9, 0.9):
        for y in (-0.42, 0.42):
            p.box((0.08, 0.08, 0.76), (x, y, 0.38), OAK, bevel=0.01)
    p.box((0.6, 0.45, 0.06), (-0.3, -0.1, 0.86), "#e8dcc0", rot=(0, 0, 0.1), bevel=0.0)
    p.cyl(0.08, 0.08, 0.04, (0.6, 0.2, 0.84), "#2a4a2a", segs=10)
    p.cyl(0.015, 0.015, 0.35, (0.6, 0.2, 1.0), GOLD, segs=6)
    p.lathe([(0.01, 0), (0.18, 0.02), (0.14, 0.14)], (0.6, 0.12, 1.12), "#2a6a3a", segs=12, rot=(math.pi, 0, 0))
    p.ball(0.06, (0.6, 0.12, 1.06), WARM, subdiv=1)
    p.export()


@prop
def returns_chute():
    p = Prop("returns_chute", 1023)
    p.box((2.0, 1.6, 3.0), (0, 0, 1.5), "#4a3a2a", bevel=0.05)
    p.box((1.2, 0.1, 0.25), (0, -0.82, 1.6), DARK, bevel=0.0)
    p.box((1.4, 0.06, 0.4), (0, -0.82, 2.2), GOLD, bevel=0.0)
    p.cyl(0.6, 0.8, 1.2, (0, 0, 3.6), IRON_L, segs=10)
    for k in range(5):
        p.box((0.35, 0.25, 0.06), (p.rng.uniform(-0.8, 0.8), -1.0 - p.rng.uniform(0, 0.6), 0.03 + k * 0.01), p.rng.choice(["#6a2a2a", "#2a4a3a", "#3a3a6a"]), rot=(0, 0, p.rng.uniform(0, 3)), bevel=0.0)
    p.export()


# ---------------------------------------------------------------- Floor 15: the Cold Store
@prop
def server_rack():
    p = Prop("server_rack", 1030)
    W, D, H = 0.7, 1.1, 2.2
    p.box((W, D, H), (0, 0, H / 2), "#1a1e24", bevel=0.02)
    for k in range(16):
        z = 0.2 + k * 0.12
        p.box((W - 0.08, 0.04, 0.09), (0, -D / 2 - 0.01, z), "#2a3038", bevel=0.0)
        for j in range(3):
            col = p.rng.choice([GREEN_GLOW, BLUE_GLOW, GREEN_GLOW, RED_GLOW]) if p.rng.random() < 0.6 else DARK
            p.box((0.03, 0.03, 0.02), (-W / 2 + 0.1 + j * 0.05, -D / 2 - 0.03, z), col, bevel=0.0)
    p.box((W + 0.02, D + 0.02, 0.05), (0, 0, H + 0.02), "#a8d8f0", bevel=0.0)
    p.export()


@prop
def cable_bundle():
    p = Prop("cable_bundle", 1031)
    for k in range(6):
        pts = []
        for i in range(9):
            t = i / 8
            pts.append(((t - 0.5) * 3.0, math.sin(t * 6 + k) * 0.3 + (k - 3) * 0.06, 0.08 + abs(math.sin(t * 3 + k)) * 0.25))
        p.tube(pts, 0.05 + 0.01 * (k % 3), p.rng.choice(["#1a1a1a", "#2a2a3a", "#3a1a1a", "#1a2a1a"]), segs=6)
    p.export()


@prop
def tape_reel_stack():
    p = Prop("tape_reel_stack", 1032)
    for stack in range(2):
        cx = (stack - 0.5) * 0.6
        for k in range(p.rng.randint(4, 7)):
            z = k * 0.06
            p.cyl(0.26, 0.26, 0.05, (cx, 0, z + 0.025), "#3a3a42", segs=14)
            p.cyl(0.2, 0.2, 0.052, (cx, 0, z + 0.025), "#4a2a1a", segs=14)
            p.cyl(0.05, 0.05, 0.054, (cx, 0, z + 0.025), CHROME, segs=8)
    p.export()


@prop
def cooling_tower():
    p = Prop("cooling_tower", 1033)
    # the hyperbolic concrete shell, steam rising off the top
    p.lathe([(6.0, 0), (5.0, 3.0), (4.1, 7.0), (4.0, 9.0), (4.4, 12.0), (4.6, 14.0)], (0, 0, 0), "#9a9890", segs=24)
    for k in range(4):
        p.ball(2.6 - k * 0.3, (p.rng.uniform(-1, 1), p.rng.uniform(-1, 1), 15.0 + k * 1.8), "#e8eef4", lumpy=0.25, subdiv=2)
    for k in range(8):
        a = k * math.pi / 4
        p.box((0.4, 0.4, 1.6), (math.cos(a) * 5.6, math.sin(a) * 5.6, 0.8), "#7a7870", rot=(0, 0, a), bevel=0.02)
    p.export()


@prop
def control_console():
    p = Prop("control_console", 1034)
    p.box((2.4, 1.0, 0.9), (0, 0, 0.45), "#2a2e36", bevel=0.03)
    p.box((2.4, 0.8, 0.08), (0, -0.05, 0.95), "#3a3e48", rot=(0.35, 0, 0), bevel=0.02)
    for k in range(3):
        p.box((0.7, 0.08, 0.5), (-0.8 + k * 0.8, 0.35, 1.35), "#1a1e24", rot=(-0.15, 0, 0), bevel=0.02)
        p.box((0.6, 0.02, 0.4), (-0.8 + k * 0.8, 0.3, 1.35), p.rng.choice([GREEN_GLOW, BLUE_GLOW, GLOW]), rot=(-0.15, 0, 0), bevel=0.0)
    for k in range(12):
        p.box((0.05, 0.05, 0.03), (-1.0 + k * 0.18, -0.25, 1.0), p.rng.choice([RED_GLOW, GREEN_GLOW, "#c8a040", DARK]), bevel=0.0)
    p.export()


@prop
def big_red_switch():
    p = Prop("big_red_switch", 1035)
    p.box((1.0, 0.6, 1.4), (0, 0, 0.7), "#3a3e48", bevel=0.04)
    p.box((0.7, 0.1, 0.5), (0, -0.32, 1.0), "#f5c518", bevel=0.0)
    p.box((0.6, 0.12, 0.08), (0, -0.33, 1.0), DARK, bevel=0.0)
    p.cyl(0.05, 0.05, 0.7, (0.1, -0.5, 1.3), CHROME, rot=(0.5, 0, 0), segs=8)
    p.ball(0.14, (0.1, -0.7, 1.62), "#d82a2a", subdiv=2)
    p.box((0.6, 0.05, 0.2), (0, -0.33, 0.45), RED_GLOW, bevel=0.0)
    p.export()


# ---------------------------------------------------------------- Floor 16: the Transmitter
@prop
def satellite_dish():
    p = Prop("satellite_dish", 1040)
    p.cyl(0.6, 0.8, 0.4, (0, 0, 0.2), "#5a5e66", segs=10)
    p.cyl(0.15, 0.15, 2.4, (0, 0, 1.6), "#7a7e86", segs=8)
    p.lathe([(0.01, 0), (1.0, 0.12), (1.8, 0.45), (2.2, 0.75)], (0, -0.4, 3.0), "#d8dce0", segs=20, rot=(math.radians(-60), 0, 0))
    p.cyl(0.03, 0.03, 1.6, (0, -1.1, 3.6), "#5a5e66", rot=(math.radians(-60), 0, 0), segs=6)
    p.ball(0.12, (0, -1.6, 4.0), RED_GLOW, subdiv=1)
    p.export()


@prop
def broadcast_mast():
    p = Prop("broadcast_mast", 1041)
    H, W = 16.0, 1.6
    for x in (-W / 2, W / 2):
        for y in (-W / 2, W / 2):
            p.box((0.1, 0.1, H), (x * (1 - 0.0), y, H / 2), "#c83a2a" if False else "#d8d8d8", bevel=0.0)
    for k in range(16):
        z = k * 1.0 + 0.5
        col = "#d82a2a" if (k // 2) % 2 == 0 else "#e8e8e8"
        for face in range(4):
            a = face * math.pi / 2
            p.box((W * 1.41, 0.05, 0.05), (math.cos(a) * W / 2 * 0.0 + (W / 2 if face == 0 else -W / 2 if face == 2 else 0), (W / 2 if face == 1 else -W / 2 if face == 3 else 0), z), col, rot=(0, 0.78 if k % 2 else -0.78, a + math.pi / 2), bevel=0.0)
    p.cyl(0.05, 0.02, 3.0, (0, 0, H + 1.5), "#d8d8d8", segs=6)
    p.ball(0.18, (0, 0, H + 3.0), RED_GLOW, subdiv=1)
    for z in (6.0, 11.0):
        p.ball(0.12, (W / 2, -W / 2, z), RED_GLOW, subdiv=1)
    p.export()


@prop
def mixing_desk():
    p = Prop("mixing_desk", 1042)
    p.box((2.6, 1.2, 0.85), (0, 0, 0.42), "#26282e", bevel=0.03)
    p.box((2.6, 1.0, 0.06), (0, 0, 0.9), "#34363e", rot=(0.2, 0, 0), bevel=0.02)
    for k in range(20):
        x = -1.2 + k * 0.125
        p.box((0.02, 0.5, 0.01), (x, 0, 0.94), DARK, rot=(0.2, 0, 0), bevel=0.0)
        p.box((0.06, 0.04, 0.05), (x, p.rng.uniform(-0.2, 0.2), 0.97), WHITE, rot=(0.2, 0, 0), bevel=0.0)
        for j in range(3):
            p.cyl(0.02, 0.02, 0.03, (x, 0.32 + j * 0.06, 0.99), p.rng.choice(["#c83a2a", "#3a8ac8", "#e8e8e8", "#f5c518"]), segs=6)
    p.box((1.2, 0.1, 0.5), (0, 0.55, 1.2), "#1a1a20", bevel=0.02)
    p.box((1.1, 0.02, 0.4), (0, 0.5, 1.2), BLUE_GLOW, bevel=0.0)
    p.export()


@prop
def on_air_light():
    p = Prop("on_air_light", 1043)
    p.box((1.6, 0.3, 0.6), (0, 0, 0.3), "#2a1a1a", bevel=0.04)
    p.box((1.4, 0.05, 0.42), (0, -0.16, 0.3), RED_GLOW, bevel=0.0)
    for k, x in enumerate((-0.45, -0.25, 0.1, 0.3, 0.48)):
        p.box((0.12, 0.02, 0.24), (x, -0.19, 0.3), "#5a0a0a", bevel=0.0)
    p.box((0.1, 0.1, 0.5), (0, 0.1, 0.8), IRON, bevel=0.0)
    p.export()


# ---------------------------------------------------------------- Floor 10: the Backlot
@prop
def camera_crane():
    p = Prop("camera_crane", 1050)
    p.box((1.6, 1.0, 0.4), (0, 0, 0.35), "#2a2a30", bevel=0.03)
    for x in (-0.7, 0.7):
        for y in (-0.4, 0.4):
            p.cyl(0.15, 0.15, 0.12, (x, y, 0.15), DARK, rot=(0, math.pi / 2, 0), segs=10)
    p.cyl(0.12, 0.12, 1.6, (0, 0, 1.3), "#4a4a52", segs=8)
    p.box((5.5, 0.18, 0.18), (0.8, 0, 2.3), "#c8a040", rot=(0, -0.3, 0), bevel=0.01)
    p.box((0.6, 0.6, 0.6), (-1.6, 0, 1.6), "#3a3a42", bevel=0.03)
    p.box((0.5, 0.35, 0.35), (3.4, 0, 3.15), DARK, bevel=0.03)
    p.cyl(0.12, 0.14, 0.3, (3.4, -0.32, 3.15), "#4a4a52", rot=(math.pi / 2, 0, 0), segs=10)
    p.ball(0.06, (3.55, -0.1, 3.38), RED_GLOW, subdiv=1)
    p.export()


@prop
def spotlight_rig():
    p = Prop("spotlight_rig", 1051)
    for k in range(3):
        a = k * 2 * math.pi / 3
        p.box((0.05, 0.05, 2.2), (math.cos(a) * 0.4, math.sin(a) * 0.4, 1.05), "#3a3a42", rot=(math.sin(a) * 0.2, -math.cos(a) * 0.2, 0), bevel=0.0)
    p.box((0.9, 0.08, 0.08), (0, 0, 2.2), "#3a3a42", bevel=0.0)
    for x in (-0.3, 0.3):
        p.cyl(0.18, 0.22, 0.45, (x, -0.1, 2.35), DARK, rot=(1.2, 0, 0), segs=12)
        p.cyl(0.17, 0.17, 0.02, (x, -0.32, 2.43), GLOW, rot=(1.2, 0, 0), segs=12)
    p.export()


@prop
def costume_rail():
    p = Prop("costume_rail", 1052)
    for x in (-1.0, 1.0):
        p.cyl(0.025, 0.025, 1.7, (x, 0, 0.85), CHROME, segs=6)
        p.box((0.5, 0.05, 0.05), (x, 0, 0.05), CHROME, bevel=0.0)
    p.cyl(0.02, 0.02, 2.0, (0, 0, 1.7), CHROME, rot=(0, math.pi / 2, 0), segs=6)
    for k in range(9):
        x = -0.85 + k * 0.21
        col = p.rng.choice(["#8a1a2a", "#2a3a6a", "#e8d8a0", "#3a5a3a", "#5a2a5a", "#c8a040"])
        p.box((0.06, 0.55, 1.0 + p.rng.uniform(-0.2, 0.3)), (x, 0, 1.15), col, bevel=0.01)
    p.export()


@prop
def makeup_mirror_desk():
    p = Prop("makeup_mirror_desk", 1053)
    p.box((1.6, 0.6, 0.06), (0, 0, 0.78), "#e8e0d0", bevel=0.01)
    for x in (-0.7, 0.7):
        p.box((0.06, 0.55, 0.76), (x, 0, 0.38), "#d8d0c0", bevel=0.01)
    p.box((1.3, 0.05, 1.0), (0, 0.27, 1.35), "#b8d0d8", bevel=0.0)
    for k in range(6):
        p.ball(0.05, (-0.7 + k * 0.28, 0.25, 1.9), WARM, subdiv=1)
    for s in (-1, 1):
        for k in range(4):
            p.ball(0.05, (s * 0.7, 0.25, 1.0 + k * 0.28), WARM, subdiv=1)
    for k in range(5):
        p.cyl(0.02, 0.02, 0.12, (-0.4 + k * 0.15, -0.1, 0.87), p.rng.choice(["#c82a2a", "#2a2a2a", "#e8a0c0"]), segs=6)
    p.export()


@prop
def catering_tent():
    p = Prop("catering_tent", 1054)
    W, D, H = 8.0, 6.0, 2.6
    for x in (-W / 2, W / 2):
        for y in (-D / 2, D / 2):
            p.cyl(0.05, 0.05, H, (x, y, H / 2), CHROME, segs=6)
    for k in range(8):
        p.box((W / 8, D + 0.2, 0.05), (-W / 2 + W / 16 + k * W / 8, 0, H + 0.6), "#e8e4dc" if k % 2 else "#c83a3a", rot=(0, 0, 0), bevel=0.0)
    p.box((W + 0.2, D + 0.2, 0.05), (0, 0, H + 0.3), "#e8e4dc", bevel=0.0)
    p.box((5.0, 0.8, 0.8), (0, 1.5, 0.4), "#e8e4dc", bevel=0.02)
    for k in range(5):
        p.cyl(0.25, 0.22, 0.12, (-2.0 + k, 1.5, 0.86), "#b8bcc0", segs=10)
    p.export()


@prop
def makeup_trailer():
    p = Prop("makeup_trailer", 1055)
    p.box((8.0, 3.0, 2.8), (0, 0, 1.9), "#e8e4dc", bevel=0.15)
    p.box((8.0, 3.02, 0.4), (0, 0, 1.0), "#4a8ac8", bevel=0.02)
    for x in (-2.5, 2.5):
        p.cyl(0.45, 0.45, 0.3, (x, -1.4, 0.45), DARK, rot=(math.pi / 2, 0, 0), segs=12)
    for k in range(4):
        p.box((1.1, 0.05, 0.8), (-2.8 + k * 1.6, -1.52, 2.4), WARM, bevel=0.0)
    p.box((0.9, 0.05, 2.0), (3.2, -1.52, 1.7), "#c8c0b0", bevel=0.0)
    p.box((1.2, 0.8, 0.2), (3.2, -2.0, 0.3), "#7a7a7a", bevel=0.02)
    p.export()


def _set_front(name, seed, W, H, wall, trim, signc):
    p = Prop(name, seed)
    # a false front: the face of a building and nothing behind it but braces
    p.box((W, 0.25, H), (0, 0, H / 2), wall, bevel=0.03)
    p.box((W + 0.3, 0.4, 0.4), (0, -0.1, H + 0.2), trim, bevel=0.03)
    p.box((W * 0.5, 0.1, 0.9), (0, -0.18, H - 0.8), signc, bevel=0.02)
    p.box((1.4, 0.1, 2.4), (0, -0.14, 1.2), DARK, bevel=0.0)
    for x in (-W / 3, W / 3):
        p.box((1.3, 0.1, 1.2), (x, -0.14, H * 0.55), WARM if p.rng.random() < 0.5 else DARK, bevel=0.0)
    for x in (-W / 2 + 0.6, W / 2 - 0.6, 0):
        p.box((0.12, 2.6, 0.12), (x, 1.3, H * 0.4), OAK_L, rot=(0.7, 0, 0), bevel=0.0)
    return p


@prop
def set_front_western():
    p = _set_front("set_front_western", 1056, 10.0, 7.0, "#8a6a4a", "#5a3e26", "#e8d8a0")
    p.box((10.0, 2.0, 0.12), (0, -1.0, 3.2), "#6a4a2a", bevel=0.01)
    for x in (-4.5, -1.5, 1.5, 4.5):
        p.cyl(0.08, 0.08, 3.2, (x, -1.9, 1.6), "#5a3e26", segs=6)
    p.export()


@prop
def set_front_moonbase():
    p = Prop("set_front_moonbase", 1057)
    p.lathe([(5.0, 0), (4.6, 2.0), (3.0, 4.0), (0.01, 5.0)], (0, 1.0, 0), "#d8dce0", segs=20)
    p.box((16.0, 0.25, 3.0), (0, -1.0, 1.5), "#c8ccd0", bevel=0.03)
    for k in range(6):
        p.box((1.4, 0.1, 0.5), (-6.0 + k * 2.4, -1.15, 2.1), BLUE_GLOW, bevel=0.0)
    p.box((2.0, 0.1, 2.6), (0, -1.15, 1.3), DARK, bevel=0.0)
    p.cyl(0.05, 0.05, 3.0, (5.0, -1.0, 4.5), CHROME, segs=6)
    p.lathe([(0.01, 0), (0.6, 0.2), (0.9, 0.5)], (5.0, -1.0, 6.0), "#e8e8e8", segs=12, rot=(-0.6, 0, 0))
    p.export()


@prop
def set_front_alley():
    p = _set_front("set_front_alley", 1058, 18.0, 7.0, "#6a3a2a", "#3a2a24", "#2a2a2a")
    for k in range(9):
        z = 0.6 + k * 0.7
        p.box((18.0, 0.02, 0.04), (0, -0.14, z), "#4a2a20", bevel=0.0)
    p.cyl(0.08, 0.08, 4.0, (6.0, -0.4, 2.0), IRON, segs=6)
    p.ball(0.25, (6.0, -0.6, 4.1), WARM, subdiv=1)
    p.export()


# ---------------------------------------------------------------- Floor 11: the Arena
@prop
def goalpost():
    p = Prop("goalpost", 1060)
    for x in (-3.66, 3.66):
        p.cyl(0.06, 0.06, 2.44, (x, 0, 1.22), WHITE, segs=8)
    p.cyl(0.06, 0.06, 7.32, (0, 0, 2.44), WHITE, rot=(0, math.pi / 2, 0), segs=8)
    for k in range(9):
        p.box((7.3, 0.02, 0.02), (0, 0.9, 0.3 + k * 0.26), "#c8c8c8", rot=(0.35, 0, 0), bevel=0.0)
    for k in range(15):
        p.box((0.02, 1.8, 0.02), (-3.5 + k * 0.5, 0.9, 1.2), "#c8c8c8", rot=(0, 0, 0), bevel=0.0)
    p.export()


@prop
def stadium_stand():
    p = Prop("stadium_stand", 1061)
    W = 10.0
    for k in range(8):
        z = k * 0.5
        y = k * 0.8
        p.box((W, 0.8, 0.5), (0, y, z + 0.25), "#8a8a8a", bevel=0.02)
        for s in range(14):
            p.box((0.5, 0.4, 0.4), (-W / 2 + 0.4 + s * 0.7, y - 0.05, z + 0.7), p.rng.choice(["#c8398c", "#c8398c", "#e8e8e8", "#3a6ac8"]), bevel=0.02)
    p.box((W, 0.3, 4.6), (0, 6.6, 2.3), "#6a6a6a", bevel=0.02)
    p.export()


@prop
def turnstile():
    p = Prop("turnstile", 1062)
    p.box((0.4, 0.9, 1.0), (0, 0, 0.5), CHROME, bevel=0.03)
    for k in range(3):
        a = k * 2 * math.pi / 3
        p.cyl(0.03, 0.03, 0.6, (0.3 * math.cos(a) + 0.2, 0.3 * math.sin(a), 0.9), CHROME, rot=(0, math.pi / 2, a), segs=6)
    p.box((0.2, 0.05, 0.15), (0, -0.46, 0.85), GREEN_GLOW, bevel=0.0)
    p.export()


@prop
def jumbotron():
    p = Prop("jumbotron", 1063)
    for x in (-4.0, 4.0):
        p.box((0.6, 0.6, 6.0), (x, 0, 3.0), "#3a3a42", bevel=0.03)
    p.box((12.0, 1.2, 7.0), (0, 0, 9.0), "#1a1a20", bevel=0.05)
    p.box((11.2, 0.05, 6.2), (0, -0.62, 9.0), GLOW, bevel=0.0)
    p.box((12.4, 1.4, 0.5), (0, 0, 12.7), "#e8398c", bevel=0.03)
    p.export()


@prop
def bleachers():
    p = Prop("bleachers", 1064)
    W = 19.0
    for k in range(6):
        z, y = k * 0.65, -3.5 + k * 1.3
        p.box((W, 0.35, 0.08), (0, y, z + 0.5), "#b8bcc0", bevel=0.01)
        p.box((W, 0.08, 0.5), (0, y + 0.3, z + 0.25), "#9aa0a6", bevel=0.0)
    for x in range(-9, 10, 3):
        p.box((0.1, 7.6, 0.1), (x, 0, 2.0), "#7a8088", rot=(0.48, 0, 0), bevel=0.0)
        p.box((0.1, 0.1, 4.0), (x, 3.5, 2.0), "#7a8088", bevel=0.0)
    p.export()


@prop
def burger_stand():
    p = Prop("burger_stand", 1065)
    p.box((3.0, 2.0, 2.4), (0, 0, 1.2), "#c83a2a", bevel=0.05)
    p.box((2.6, 0.1, 1.0), (0, -1.02, 1.6), WARM, bevel=0.0)
    p.box((3.2, 0.7, 0.1), (0, -1.2, 1.05), "#e8e4dc", bevel=0.02)
    p.box((3.4, 2.4, 0.2), (0, 0, 2.5), "#f5c518", bevel=0.03)
    p.ball(0.6, (0, 0, 3.3), "#c8803a", scale=(1, 1, 0.45), subdiv=2)
    p.cyl(0.62, 0.62, 0.12, (0, 0, 3.15), "#5a2a1a", segs=16)
    p.ball(0.6, (0, 0, 3.0), "#c8803a", scale=(1, 1, 0.3), subdiv=2)
    p.export()


@prop
def halftime_stage():
    p = Prop("halftime_stage", 1066)
    p.box((12.0, 8.0, 1.2), (0, 0, 0.6), "#1a1a20", bevel=0.05)
    p.box((12.2, 8.2, 0.08), (0, 0, 1.24), "#e8398c", bevel=0.0)
    for x in (-5.5, 5.5):
        p.box((1.2, 1.0, 2.4), (x, 2.5, 2.4), DARK, bevel=0.03)
        for z in (1.8, 2.6):
            p.cyl(0.35, 0.35, 0.05, (x, 1.98, z), "#3a3a42", rot=(math.pi / 2, 0, 0), segs=12)
    p.box((12.0, 0.3, 0.3), (0, 3.5, 6.0), "#3a3a42", bevel=0.0)
    for x in (-5.5, 5.5):
        p.box((0.3, 0.3, 4.8), (x, 3.5, 3.6), "#3a3a42", bevel=0.0)
    for k in range(6):
        p.cyl(0.18, 0.22, 0.4, (-4.5 + k * 1.8, 3.2, 5.7), DARK, rot=(-1.0, 0, 0), segs=10)
        p.cyl(0.17, 0.17, 0.02, (-4.5 + k * 1.8, 3.0, 5.6), GLOW, rot=(-1.0, 0, 0), segs=10)
    p.export()


@prop
def trophy_cabinet():
    p = Prop("trophy_cabinet", 1067)
    p.box((2.4, 0.6, 2.2), (0, 0, 1.1), OAK, bevel=0.03)
    p.box((2.2, 0.05, 1.9), (0, -0.3, 1.2), "#c8e0e8", bevel=0.0)
    for k in range(3):
        z = 0.5 + k * 0.6
        p.box((2.2, 0.5, 0.04), (0, 0, z), OAK_L, bevel=0.0)
        for j in range(4):
            x = -0.8 + j * 0.55
            p.cyl(0.07, 0.05, 0.12, (x, 0, z + 0.08), GOLD, segs=8)
            p.lathe([(0.03, 0), (0.12, 0.08), (0.14, 0.25)], (x, 0, z + 0.14), GOLD, segs=10)
    p.export()


# ---------------------------------------------------------------- Floor 12: the Green Room
@prop
def applause_sign():
    p = Prop("applause_sign", 1070)
    p.box((3.0, 0.4, 0.9), (0, 0, 0.45), "#1a1a20", bevel=0.05)
    p.box((2.7, 0.05, 0.65), (0, -0.21, 0.45), RED_GLOW, bevel=0.0)
    for k in range(8):
        p.box((0.18, 0.02, 0.4), (-1.1 + k * 0.32, -0.24, 0.45), "#5a0a0a", bevel=0.0)
    p.box((0.1, 0.1, 0.6), (0, 0.1, 1.2), IRON, bevel=0.0)
    p.export()


@prop
def talk_show_couch():
    p = Prop("talk_show_couch", 1071)
    p.box((2.6, 0.95, 0.45), (0, 0, 0.3), "#8a1a3a", bevel=0.08)
    p.box((2.6, 0.25, 0.6), (0, 0.4, 0.75), "#8a1a3a", bevel=0.08)
    for s in (-1, 1):
        p.box((0.25, 0.95, 0.6), (s * 1.3, 0, 0.5), "#7a1430", bevel=0.08)
    for k in range(3):
        p.box((0.8, 0.8, 0.15), (-0.85 + k * 0.85, -0.05, 0.6), "#9a2a4a", bevel=0.06)
    p.box((3.0, 1.4, 0.06), (0, 0, 0.03), DARK, bevel=0.0)
    p.box((1.0, 1.0, 0.02), (0, 0, 0.065), "#3a3a42", bevel=0.0)
    p.export()


@prop
def star_dressing_door():
    p = Prop("star_dressing_door", 1072)
    p.box((1.3, 0.15, 2.3), (0, 0, 1.15), "#e8e0d0", bevel=0.02)
    p.box((1.1, 0.06, 2.1), (0, -0.08, 1.1), "#c8b8a0", bevel=0.01)
    pts = []
    for k in range(10):
        a = math.pi / 2 + k * math.pi / 5
        r = 0.22 if k % 2 == 0 else 0.09
        pts.append((math.cos(a) * r, math.sin(a) * r))
    for k in range(10):
        x1, z1 = pts[k]
        x2, z2 = pts[(k + 1) % 10]
        p.box((math.hypot(x2 - x1, z2 - z1), 0.03, 0.05), ((x1 + x2) / 2, -0.12, 1.75 + (z1 + z2) / 2), GOLD, rot=(0, -math.atan2(z2 - z1, x2 - x1), 0), bevel=0.0)
    p.ball(0.1, (0, -0.12, 1.75), "glow:#ffd23a", subdiv=1)
    p.ball(0.05, (0.45, -0.14, 1.05), GOLD, subdiv=1)
    p.export()


@prop
def laugh_machine():
    p = Prop("laugh_machine", 1073)
    p.box((1.8, 1.0, 1.6), (0, 0, 0.8), "#3a3a42", bevel=0.04)
    for x in (-0.45, 0.45):
        p.cyl(0.35, 0.35, 0.06, (x, -0.52, 1.15), "#1a1a20", rot=(math.pi / 2, 0, 0), segs=16)
        p.cyl(0.06, 0.06, 0.08, (x, -0.55, 1.15), CHROME, rot=(math.pi / 2, 0, 0), segs=8)
    p.box((1.2, 0.05, 0.3), (0, -0.52, 0.45), GREEN_GLOW, bevel=0.0)
    p.lathe([(0.01, 0), (0.25, 0.05), (0.45, 0.5)], (0.5, 0, 1.6), "#c8a040", segs=12)
    p.export()


@prop
def writers_table():
    p = Prop("writers_table", 1074)
    p.box((3.0, 1.4, 0.08), (0, 0, 0.76), OAK_L, bevel=0.02)
    for x in (-1.4, 1.4):
        for y in (-0.6, 0.6):
            p.box((0.08, 0.08, 0.74), (x, y, 0.37), OAK, bevel=0.0)
    for k in range(5):
        p.box((0.5, 0.35, 0.04), (p.rng.uniform(-1.2, 1.2), p.rng.uniform(-0.5, 0.5), 0.82), "#e8e4dc", rot=(0, 0, p.rng.uniform(-0.6, 0.6)), bevel=0.0)
    p.box((0.5, 0.4, 0.22), (0.4, -0.1, 0.92), "#2a2a2e", bevel=0.03)
    for k in range(6):
        p.ball(0.07, (p.rng.uniform(-1.3, 1.3), p.rng.uniform(-0.6, 0.6), 0.85), "#e8e4dc", lumpy=0.4, subdiv=1)
    p.export()


@prop
def locker_bank():
    p = Prop("locker_bank", 1075)
    for k in range(5):
        x = -1.2 + k * 0.6
        p.box((0.58, 0.5, 1.9), (x, 0, 0.95), p.rng.choice(["#4a6a8a", "#3a5a7a"]), bevel=0.01)
        for z in (1.6, 1.65, 1.7):
            p.box((0.3, 0.02, 0.02), (x, -0.26, z), DARK, bevel=0.0)
        p.box((0.04, 0.03, 0.1), (x + 0.2, -0.27, 1.0), CHROME, bevel=0.0)
    p.export()


# ---------------------------------------------------------------- Floor 17: the Host's House
@prop
def school_desk():
    p = Prop("school_desk", 1080)
    p.box((0.7, 0.5, 0.04), (0, 0, 0.72), "#c8a070", rot=(0.08, 0, 0), bevel=0.01)
    for x in (-0.3, 0.3):
        p.cyl(0.02, 0.02, 0.7, (x, 0, 0.35), CHROME, segs=6)
    p.box((0.45, 0.4, 0.04), (0, 0.55, 0.45), "#c8a070", bevel=0.01)
    p.box((0.45, 0.04, 0.4), (0, 0.75, 0.7), "#c8a070", bevel=0.01)
    p.box((0.2, 0.28, 0.02), (0.1, 0, 0.76), "#e8e4dc", bevel=0.0)
    p.export()


@prop
def mirror_panel():
    p = Prop("mirror_panel", 1081)
    p.box((1.4, 0.12, 2.6), (0, 0, 1.3), GOLD, bevel=0.03)
    p.box((1.2, 0.04, 2.4), (0, -0.05, 1.3), "#d8e4ec", bevel=0.0)
    p.box((0.4, 0.02, 1.2), (-0.25, -0.08, 1.4), "#ffffff", rot=(0, 0.3, 0), bevel=0.0)
    p.export()


@prop
def fifties_house():
    p = Prop("fifties_house", 1082)
    W, D, H = 12.0, 10.0, 3.4
    # clapboard walls in bands, a low gable roof, a porch, a picture window and a front door
    p.box((W, D, 0.4), (0, 0, 0.2), "#a8a090", bevel=0.02)
    for k in range(int(H / 0.25)):
        p.box((W, D, 0.24), (0, 0, 0.4 + k * 0.25 + 0.12), "#e8dcc0" if k % 2 else "#dccfb0", bevel=0.0)
    p.lathe([(0.01, 0), (0.01, 0)], (0, 0, 0), "#e8dcc0")
    for s in (-1, 1):
        p.box((W / 2 + 1.0, D + 1.0, 0.15), (s * W / 4, 0, H + 1.5), "#c84a3a", rot=(0, s * 0.42, 0), bevel=0.02)
    p.box((3.0, 0.1, 1.6), (-2.5, -D / 2 - 0.05, 2.0), WARM, bevel=0.0)
    p.box((3.2, 0.15, 0.15), (-2.5, -D / 2 - 0.1, 2.85), WHITE, bevel=0.0)
    p.box((1.1, 0.1, 2.2), (2.0, -D / 2 - 0.05, 1.5), "#c84a3a", bevel=0.0)
    p.box((4.0, 2.0, 0.2), (2.0, -D / 2 - 1.0, 0.3), "#a8a090", bevel=0.02)
    for x in (0.2, 3.8):
        p.cyl(0.08, 0.08, 2.8, (x, -D / 2 - 1.8, 1.8), WHITE, segs=8)
    p.box((4.4, 2.2, 0.15), (2.0, -D / 2 - 1.0, 3.25), "#c84a3a", rot=(-0.15, 0, 0), bevel=0.02)
    p.box((1.2, 1.0, 2.0), (3.5, 2.0, H + 2.2), "#8a4a3a", bevel=0.02)
    p.export()


@prop
def fifties_diner():
    p = Prop("fifties_diner", 1083)
    W, D, H = 16.0, 8.0, 4.0
    p.box((W, D, H), (0, 0, H / 2), CHROME, bevel=0.3)
    for k in range(4):
        p.box((W + 0.05, D + 0.05, 0.12), (0, 0, 0.6 + k * 0.25), "#e8398c" if k % 2 else "#4ac8c8", bevel=0.0)
    for k in range(6):
        p.box((2.0, 0.1, 1.4), (-6.0 + k * 2.4, -D / 2 - 0.02, 2.5), WARM, bevel=0.0)
    p.box((1.3, 0.1, 2.4), (6.6, -D / 2 - 0.02, 1.2), "#e8398c", bevel=0.0)
    p.box((6.0, 0.4, 1.2), (0, -D / 2 - 0.2, H + 0.8), "#e8398c", bevel=0.05)
    p.box((5.6, 0.05, 0.8), (0, -D / 2 - 0.42, H + 0.8), "glow:#ff8aa8", bevel=0.0)
    p.export()


@prop
def drive_in_screen():
    p = Prop("drive_in_screen", 1084)
    for x in (-8.0, -2.5, 2.5, 8.0):
        p.box((0.4, 0.4, 13.0), (x, 0.6, 6.5), "#6a6060", bevel=0.02)
    p.box((20.0, 0.4, 11.0), (0, 0, 7.5), "#e8e8e8", bevel=0.05)
    p.box((19.0, 0.05, 10.0), (0, -0.22, 7.5), "glow:#c8d8e0", bevel=0.0)
    p.box((20.4, 0.6, 0.5), (0, 0, 13.2), "#c84a3a", bevel=0.03)
    p.export()


# ---------------------------------------------------------------- Floor 18: the floor that does not exist
@prop
def builder_machine():
    p = Prop("builder_machine", 1090)
    p.box((4.0, 3.0, 0.5), (0, 0, 0.25), "#b8b8b4", bevel=0.05)
    p.box((3.2, 2.4, 5.0), (0, 0, 3.0), "#a8a8a4", bevel=0.08)
    for k in range(6):
        p.box((3.3, 0.08, 0.06), (0, -1.22, 1.0 + k * 0.75), "#8a8a86", bevel=0.0)
    for k in range(4):
        p.box((0.5, 0.06, 0.12), (p.rng.uniform(-1.0, 1.0), -1.24, 1.4 + k), GLOW, bevel=0.0)
    p.cyl(0.6, 0.6, 1.0, (0, 0, 6.0), "#c8c8c4", segs=16)
    p.ball(0.4, (0, 0, 6.8), GLOW, subdiv=2)
    p.export()


@prop
def impossible_stair():
    p = Prop("impossible_stair", 1091)
    # four flights round a square, each climbing, and the last meets the first: it only works from one angle
    S, step = 4.0, 0.25
    for side in range(4):
        a = side * math.pi / 2
        for k in range(10):
            t = (k + 0.5) / 10
            x, y = (t - 0.5) * S, -S / 2
            rx, ry = x * math.cos(a) - y * math.sin(a), x * math.sin(a) + y * math.cos(a)
            z = (side * 10 + k) * step * 0.25 + 0.5
            p.box((S / 10, 0.9, 0.18), (rx, ry, z), "#d8d8d4", rot=(0, 0, a), bevel=0.01)
        for k in range(10):
            pass
    for x in (-S / 2, S / 2):
        for y in (-S / 2, S / 2):
            p.box((0.3, 0.3, 3.5), (x, y, 1.75), "#c8c8c4", bevel=0.02)
    p.export()


if __name__ == "__main__":
    names = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else list(B)
    for name in names:
        B[name]()
