# Props for the Undercity: Floors 7, 8 and 9, including their caves.
#   F:\Downstairs\Blender\blender.exe -b --python tools/blender/build_wilds_f7_f9.py [-- name name ...]
# Exports to godot/models/props/wilds/<name>.glb.
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_landing_kit as kit
from build_landing_kit import Prop, STEEL, DARK, CREAM, BRASS, WOOD, WOOD_DARK
from build_wilds_f2_f3 import build_cave, BONE, BLOOD, GORE, MEAT, RUBBER, CHROME
from build_wilds_f4_f6 import figure, blood_pool

kit.OUT = os.path.join(os.path.dirname(kit.OUT), "wilds")
STONE = "#6a6a62"
STONE_DARK = "#4a4c48"
MOSS = "#3a5a3a"
SLIME = "#5a7a4a"
VERDIGRIS = "#5aa08a"
RUST = "#8a4a2a"
GREASE = "#c89a3a"
CRUST = "#b8843a"
MOLD = "#8aa878"
RAT = "#5a4a44"
GOLD = "#d8a838"


def ring(n, offset=0.0):
    return [(i * math.tau / n + offset) for i in range(n)]


# ------------------------------------------------------------ Floor 7: the Drowned Cistern
def cistern_column():
    p = Prop("cistern_column", 500)
    # Thousands of these hold up the roof, in rows that stop being rows if you look too long. Tide marks to head height.
    p.lathe([(1.2, 0), (1.15, 0.5), (0.86, 0.9), (0.76, 1.3), (0.7, 9), (0.72, 15.4), (1.0, 16), (1.3, 16.5), (1.5, 18.0)], (0, 0, 0), STONE, segs=16)
    p.lathe([(0.78, 0), (0.78, 2.2)], (0, 0, 0.6), "#3a4a44", segs=16)
    for i in range(16):
        a = i * 0.9
        z = p.rng.uniform(1.0, 3.6)
        p.ball(0.34, (math.cos(a) * 0.76, math.sin(a) * 0.76, z), MOSS, scale=(1, 0.3, 1.6), lumpy=0.25, subdiv=1)
    # a face carved upside-down at the foot, as in the old cisterns
    p.ball(0.42, (0, -1.16, 0.92), STONE_DARK, scale=(0.9, 0.34, 1.14), subdiv=2)
    for s in (-1, 1):
        p.ball(0.06, (s * 0.15, -1.3, 0.82), "#0f1412", subdiv=1)
    p.ball(0.07, (0, -1.3, 1.16), "#0f1412", scale=(1.4, 0.5, 0.6), subdiv=1)
    p.export()


def brick_arch():
    p = Prop("brick_arch", 501)
    # A brick vault spanning a tunnel, dripping, with the water line well above your head.
    for i in range(17):
        a = math.pi * i / 16
        p.box((1.1, 2.2, 1.2), (math.cos(a) * 6.5, 0, math.sin(a) * 6.5 + 4.0), "#6a4438" if i % 2 else "#5a3a30", rot=(0, -a + math.pi / 2, 0), bevel=0.04, wonk=0.03)
    for s in (-1, 1):
        p.box((1.3, 2.3, 4.4), (s * 6.5, 0, 2.0), STONE_DARK, bevel=0.05)
        for i in range(4):
            p.ball(0.3, (s * 6.0, p.rng.uniform(-1, 1), p.rng.uniform(0.6, 3.2)), MOSS, scale=(0.3, 1, 1.5), lumpy=0.2, subdiv=1)
    p.box((1.6, 2.4, 1.0), (0, 0, 10.8), STONE, bevel=0.06)
    p.export()


def sunk_tenement():
    p = Prop("sunk_tenement", 502)
    # A whole block sunk to its second floor and leaning. Rooms still lit. The Landlord still collects.
    p.box((15, 11, 18), (0, 0, 8.5), "#5a4a42", rot=(0.03, 0.05, 0.02), bevel=0.08)
    p.box((15.6, 11.6, 0.5), (0.5, 0.2, 17.6), "#3a302c", rot=(0.03, 0.05, 0.02), bevel=0.04)
    for fl in range(5):
        for x in (-5, -1.7, 1.7, 5):
            lit = (fl * 3 + int(x * 2)) % 5 == 0
            z = 2.0 + fl * 3.2
            p.box((1.9, 0.16, 2.0), (x + z * 0.05, -5.54 - z * 0.03, z), "#2a2420", bevel=0.02)
            p.box((1.6, 0.1, 1.7), (x + z * 0.05, -5.62 - z * 0.03, z), "glow:#ffd88a" if lit else "#101418", bevel=0.0)
            p.box((0.05, 0.05, 1.7), (x + z * 0.05, -5.68 - z * 0.03, z), "#2a2420", bevel=0.0)
            p.box((2.2, 0.26, 0.12), (x + z * 0.05, -5.6 - z * 0.03, z - 1.06), "#6a5a50", bevel=0.01)
    # RENT DUE, on a banner across the front
    p.box((9.0, 0.1, 1.6), (0.8, -6.2, 11.6), "#e8e0c8", rot=(0, 0.02, 0.02), bevel=0.0)
    p.box((7.6, 0.06, 0.9), (0.8, -6.26, 11.6), "#a81e1e", rot=(0, 0.02, 0.02), bevel=0.0)
    for x, z in ((-6.4, 16), (6.8, 12)):
        p.tube([(x, -5.8, z), (x + 0.4, -6.0, z - 6), (x + 0.1, -5.9, 0)], 0.12, RUST, 6)
    p.lathe([(0.9, 0), (0.9, 3.4), (1.1, 3.6)], (4.0, 2.0, 17.4), "#3a302c", segs=10)
    p.export()


def eviction_pile():
    p = Prop("eviction_pile", 503)
    # A family's whole life, in the water, with a notice on the wardrobe. They paid. He doesn't accept what they paid with.
    p.box((1.4, 0.7, 2.1), (0.4, 0.3, 1.0), WOOD_DARK, rot=(0.06, 0.2, 0.2), bevel=0.04)
    p.box((0.5, 0.02, 0.7), (0.2, -0.05, 1.5), "#f0e8c8", rot=(0.06, 0.2, 0.2), bevel=0.0)
    p.box((0.42, 0.02, 0.12), (0.2, -0.08, 1.74), "#a81e1e", rot=(0.06, 0.2, 0.2), bevel=0.0)
    p.box((2.2, 1.1, 0.34), (-1.3, -0.5, 0.42), "#b8a888", rot=(0.0, 0.1, 0.5), bevel=0.12)
    p.box((2.2, 0.16, 0.8), (-1.2, 0.1, 0.72), "#4a3020", rot=(0.0, 0.0, 0.5), bevel=0.02)
    for x, y, c in ((1.5, -0.8, "#a8483a"), (1.8, 0.6, "#3a5a8a")):
        p.box((0.6, 0.6, 0.1), (x, y, 0.56), c, bevel=0.04)
        for sx in (-1, 1):
            for sy in (-1, 1):
                p.cyl(0.025, 0.025, 0.5, (x + sx * 0.25, y + sy * 0.25, 0.26), WOOD_DARK, segs=6)
        p.box((0.56, 0.06, 0.6), (x, y + 0.28, 0.9), c, bevel=0.03)
    p.lathe([(0.14, 0), (0.12, 0.2), (0.34, 0.42), (0.36, 0.44)], (-0.7, 0.9, 0), "#c8b8a0", segs=12)
    p.box((1.0, 0.1, 0.8), (-0.2, -1.1, 0.46), "#6a5a40", rot=(0.4, 0.3, 0), bevel=0.03)
    p.ball(0.26, (0.0, -1.3, 0.3), "#d8c0a0", scale=(1.3, 0.7, 0.5), subdiv=1)
    p.export()


def giant_tub():
    p = Prop("giant_tub", 504)
    # Old Lady Bathwater's bath, in the middle of the flood, wide as a house. The foam moves. The loofah's the size of a car.
    k = 4.0
    p.lathe([(0.001, 0.34 * k), (0.86 * k, 0.32 * k), (1.0 * k, 0.5 * k), (1.06 * k, 1.04 * k), (1.14 * k, 1.1 * k), (1.1 * k, 1.16 * k), (0.96 * k, 1.1 * k), (0.92 * k, 0.5 * k), (0.001, 0.42 * k)], (0, 0, 0), "#f0ece0", segs=30)
    for a in ring(4, 0.78):
        p.tube([(math.cos(a) * 3.2, math.sin(a) * 3.2, 1.5), (math.cos(a) * 3.9, math.sin(a) * 3.9, 0.7), (math.cos(a) * 3.7, math.sin(a) * 3.7, 0.1)], 0.3, GOLD, 8)
        p.ball(0.5, (math.cos(a) * 3.7, math.sin(a) * 3.7, 0.28), GOLD, subdiv=1)
    p.cyl(3.7, 3.7, 0.06, (0, 0, 3.98), "#6a8a70", segs=30)
    for i in range(34):
        a, r = p.rng.uniform(0, math.tau), math.sqrt(p.rng.uniform(0, 1)) * 4.1
        p.ball(p.rng.uniform(0.4, 1.05), (math.cos(a) * r, math.sin(a) * r, 4.2), "#f4f4ec", scale=(1, 1, 0.65), subdiv=1)
    for s in (-1, 1):
        p.tube([(s * 0.5, 4.1, 4.5), (s * 0.54, 5.0, 5.4), (s * 0.5, 4.6, 6.0)], 0.2, BRASS, 8)
        p.ball(0.3, (s * 0.5, 4.6, 6.0), BRASS, subdiv=1)
    p.tube([(0, 4.3, 3.0), (0, 5.0, 7.8), (0, 4.0, 8.8), (0, 3.2, 8.2)], 0.2, BRASS, 8)
    p.ball(1.0, (-3.0, -3.4, 5.0), "#d8b878", scale=(1, 1.9, 1), lumpy=0.18, subdiv=2)
    p.tube([(-3.2, -3.2, 5.8), (-3.6, -2.0, 7.4)], 0.1, "#b09a6a", 5)
    p.export()


def organ_pipes():
    p = Prop("organ_pipes", 505)
    # The Organ Loft: pipes up to the roof, sunk in the water. When the flood rises through them, they play by themselves.
    for i in range(23):
        x = (i - 11) * 1.25
        h = 8.0 + 9.0 * (1.0 - abs(i - 11) / 11.0) + (i % 3) * 1.6
        r = 0.48 - abs(i - 11) * 0.012
        p.lathe([(r, 0), (r, h), (r * 0.72, h + 0.1), (r * 0.72, h + 0.7), (0.001, h + 0.8)], (x, 0.2 if i % 2 else -0.4, 0), "#b8944a" if i % 2 else VERDIGRIS, segs=10)
        p.box((r * 1.2, 0.1, 0.3), (x, -0.4 - r if i % 2 == 0 else 0.2 - r, 2.7), "#14100c", bevel=0.0)
        p.box((0.08, 0.02, p.rng.uniform(1.0, 2.6)), (x, -0.4 - r if i % 2 == 0 else 0.2 - r, 1.2), "#3a4a3a", bevel=0.0)
    p.box((31, 2.0, 2.0), (0, 1.3, 1.0), "#3a2820", bevel=0.1)
    p.box((10, 2.8, 1.5), (0, -3.5, 1.0), "#3a2820", bevel=0.1)
    for i in range(4):
        for k in range(30):
            p.box((0.26, 0.5, 0.08), (-4.0 + k * 0.28, -4.5 - i * 0.28, 1.8 + i * 0.22), "#f0ece0" if k % 3 else "#16141a", bevel=0.005)
    for a in (-5.8, 5.8):
        for z in range(4):
            p.lathe([(0.1, 0), (0.08, 0.2), (0.16, 0.3)], (a, -3.4, 1.8 + z * 0.5), "#c8a860", segs=9, rot=(math.pi / 2, 0, 0))
    p.export()


def bag_heap():
    p = Prop("bag_heap", 506)
    # The Sanitation King's kingdom: bin bags in a hill, flies over it, and a few bags whose shape you can't help but recognise.
    for i in range(46):
        a = i * 2.4
        q = (i % 15) / 15
        r = (1 - q) * 4.5 + 0.4
        p.ball(p.rng.uniform(0.5, 0.86), (math.cos(a) * r, math.sin(a) * r, q * 3.4 + 0.3), p.rng.choice(("#1a1a20", "#22222a", "#2a2a30")), scale=(1, 0.9, 0.82), lumpy=0.16, subdiv=1)
        if i % 5 == 0:
            p.lathe([(0.34, 0), (0.28, 0.1), (0.08, 0.14)], (math.cos(a) * r, math.sin(a) * r, q * 3.4 + 0.8), "#6a6a70", segs=10)
    p.ball(0.42, (2.3, -2.6, 0.8), "#22222a", scale=(0.62, 0.62, 1.7), subdiv=2)
    p.ball(0.15, (2.1, -3.0, 0.45), "#c8a890", scale=(0.8, 1.3, 0.5), subdiv=1)
    p.export()


def body_bag():
    p = Prop("body_bag", 507)
    # One of those bags, floating, tied at the top, face down. It turns slowly.
    p.ball(0.42, (0, 0, 0.1), "#1e1e24", scale=(0.95, 2.3, 0.56), lumpy=0.05, subdiv=2)
    p.ball(0.24, (0, -0.9, 0.2), "#22222a", scale=(0.9, 0.9, 0.9), subdiv=1)
    for y in (-0.5, 0.0, 0.5):
        p.lathe([(0.42, 0), (0.44, 0.03), (0.42, 0.06)], (0, y, 0.1), "#6a5a40", segs=10, rot=(math.pi / 2, 0, 0))
    p.ball(0.5, (0, 0, -0.04), "#4a6a5a", scale=(2.4, 3.2, 0.03), lumpy=0.25, subdiv=1)
    p.export()


def wyrm_spine():
    p = Prop("wyrm_spine", 508)
    # What's left of a very old sewer wyrm, half out of the water: a hundred metres of ribs, big enough to walk under.
    for i in range(30):
        y = -40 + i * 2.8
        k = 0.5 + 0.9 * math.sin(i / 29 * math.pi)
        x = math.sin(i * 0.3) * 3.5
        p.ball(0.8 * k, (x, y, 7.4 * k), "#d8cfb4", scale=(1, 1.2, 0.9), subdiv=1)
        for s in (-1, 1):
            p.tube([(x, y, 7.4 * k), (x + s * 3.6 * k, y, 6.8 * k), (x + s * 5.2 * k, y + 0.3, 3.0 * k), (x + s * 4.2 * k, y + 0.6, -0.2)], 0.24 * k + 0.06, "#c8bea0", 6)
    p.ball(3.0, (math.sin(-0.3) * 3.5, -44, 5.0), "#d8cfb4", scale=(0.8, 1.4, 0.7), subdiv=2)
    for s in (-1, 1):
        p.ball(0.8, (s * 1.4 - 1, -46, 5.8), "#0f1412", subdiv=1)
    for i in range(12):
        a = i / 11 * math.pi
        p.lathe([(0.15, 0), (0.001, 1.3)], (math.cos(a) * 1.9 - 1, -47.4 - math.sin(a) * 1.0, 2.2), "#f0ece0", segs=6, rot=(math.pi, 0, 0))
    p.export()


def ferry():
    p = Prop("ferry", 509)
    # Nan Gangway's chain ferry: tarred planks, a lantern and a bell. Nan isn't on it. Someone else has been steering.
    for i, (y, w) in enumerate(((-3.6, 0.5), (-3.0, 1.2), (-2.2, 1.7), (-1, 2.0), (0.5, 2.1), (2, 2.0), (3.2, 1.7))):
        p.box((w * 2 - 0.1, 1.4, 0.16), (0, y, 0.7), "#3a2a1c", bevel=0.01, wonk=0.012)
        for s in (-1, 1):
            p.box((0.14, 1.5, 0.8), (s * (w - 0.04), y, 0.74), "#2a1e14", rot=(0.0, s * 0.18, 0), bevel=0.02)
    p.box((4.2, 0.14, 0.86), (0, 3.9, 0.76), "#2a1e14", bevel=0.02)
    p.tube([(1.5, -1.0, 1.0), (1.5, -1.0, 3.2), (0.9, -1.0, 3.5)], 0.05, DARK, 6)
    p.lathe([(0.16, 0), (0.18, 0.3), (0.12, 0.34)], (0.86, -1.0, 3.1), "glow:#ffd88a", segs=10)
    p.lathe([(0.12, 0), (0.14, 0.14), (0.04, 0.26)], (-1.4, 3.3, 1.6), BRASS, segs=10)
    p.cyl(0.04, 0.04, 1.2, (-1.4, 3.3, 1.2), DARK, segs=6)
    figure(p, -1.0, 2.8, 1.7, "#a8b8a0", "#2a3a2a", "#1a2a20", arms_up=0.0)
    p.ball(0.2, (-1.0, 2.7, 1.72), "#e8c020", scale=(1.2, 1.2, 0.5), subdiv=1)
    p.export()


def ferry_cable():
    p = Prop("ferry_cable", 510)
    # Ten metres of chain, just out of the water, with a mooring post. The ferry hauls itself along it.
    for i in range(14):
        p.lathe([(0.1, 0), (0.12, 0.04), (0.1, 0.08), (0.08, 0.04), (0.1, 0)], (1.5, -4.8 + i * 0.72, 0.42), RUST, segs=6, rot=(0.0, math.pi / 2 if i % 2 else 0, 0))
    p.lathe([(0.2, 0), (0.17, 1.4), (0.22, 1.5)], (2.2, 0, 0), "#3a2a1c", segs=9)
    p.ball(0.2, (2.2, 0, 0.36), SLIME, scale=(1.2, 1.2, 1), lumpy=0.2, subdiv=1)
    p.export()


def pump_engine():
    p = Prop("pump_engine", 511)
    # The great pump at the heart of Gangway. It keeps the town's feet dry, as long as someone keeps feeding it.
    p.cyl(2.2, 2.3, 0.5, (0, 0, 0.25), STONE, segs=20)
    p.lathe([(1.3, 0), (1.3, 2.2), (1.0, 2.4), (0.6, 2.4), (0.5, 4.2), (0.7, 4.3), (0.001, 4.4)], (0, 0, 0.5), "#2f5a58", segs=16)
    for a in ring(8):
        p.cyl(0.08, 0.08, 2.1, (math.cos(a) * 1.34, math.sin(a) * 1.34, 1.55), BRASS, segs=6)
    p.lathe([(1.05, 0), (1.12, 0.14), (1.05, 0.28), (0.9, 0.14), (1.05, 0)], (1.8, 0, 2.6), RUST, segs=20, rot=(math.pi / 2, 0, 0))
    for a in ring(6):
        p.tube([(1.8, -0.15, 2.6), (1.8 + math.cos(a) * 1.0, -0.15, 2.6 + math.sin(a) * 1.0)], 0.05, RUST, 5)
    p.tube([(0, 0, 3.6), (1.0, -0.15, 3.6), (1.8, -0.15, 2.6)], 0.09, CHROME, 6)
    p.tube([(-1.2, 0, 1.0), (-2.6, 0.4, 0.8), (-3.8, 0.8, 0.14)], 0.26, RUST, 8)
    p.box((0.5, 0.02, 0.7), (0, -1.3, 1.6), "#e8c020", bevel=0.0)
    p.export()


def sluice_gate():
    p = Prop("sluice_gate", 512)
    # The Sluice Gate: thirty metres of riveted iron holding back something behind it. It has dents, from the inside.
    p.box((24, 2.6, 15), (0, 0, 7.5), "#4a5048", bevel=0.1)
    for s in (-1, 1):
        p.box((4, 4.0, 22), (s * 14, 0, 11), STONE_DARK, bevel=0.14)
        p.lathe([(2.0, 0), (2.6, 0.6), (1.7, 1.4)], (s * 14, 0, 22), STONE, segs=14)
    p.box((32, 4.2, 2), (0, 0, 21), STONE, bevel=0.14)
    for z in (2.5, 5.5, 8.5, 11.5, 14):
        p.box((24, 0.2, 0.3), (0, -1.36, z), RUST, bevel=0.02)
        for x in range(-11, 12, 2):
            p.ball(0.12, (x, -1.48, z), "#2a2a2a", subdiv=1)
    for x, z, r in ((-5, 6, 1.5), (3, 10, 1.8), (6, 3.2, 1.1), (-1, 12, 1.0)):
        p.ball(r, (x, -1.0, z), "#3a403a", scale=(1, 0.4, 1), subdiv=2)
    for i in range(16):
        p.box((0.16, 0.05, p.rng.uniform(2, 11)), (p.rng.uniform(-11.5, 11.5), -1.46, p.rng.uniform(3, 8)), "#3a5a4a", bevel=0.0)
    p.tube([(4, -3, 16), (4, -3, 24), (-4, -3, 24), (-4, -3, 16)], 0.24, RUST, 8)
    p.lathe([(1.2, 0), (1.3, 0.2), (1.2, 0.4)], (0, -3.4, 18.6), RUST, segs=18, rot=(math.pi / 2, 0, 0))
    p.export()


def jetty():
    p = Prop("jetty", 513)
    # Duckboards on piles, ten metres long, so you can keep your feet dry if you stay on them. Not a lot of people stay on them.
    for i in range(13):
        p.box((3.0, 0.72, 0.09), (0, -4.6 + i * 0.77, 0.74), p.rng.choice(("#5a4432", "#4a3828", "#3a2e22")), rot=(0, p.rng.uniform(-0.02, 0.02), p.rng.uniform(-0.03, 0.03)), bevel=0.012)
    for y in (-4.6, 0, 4.6):
        for s in (-1, 1):
            p.lathe([(0.16, 0), (0.14, 1.5), (0.18, 1.6)], (s * 1.5, y, 0), "#2e241a", segs=8)
    p.export()


def drowned_hand():
    p = Prop("drowned_hand", 514)
    # A forest of these, up out of the flood where the water's shallow. Nothing's attached that you can see.
    p.tube([(0, 0, 0), (0.04, 0.02, 0.5), (0.02, 0, 0.94)], 0.05, "#9ab0a0", 6)
    p.ball(0.08, (0.02, 0, 1.03), "#a8b8a8", scale=(1, 0.5, 1.2), subdiv=1)
    for i, a in enumerate((-0.5, -0.18, 0.1, 0.36)):
        p.tube([(0.02 + a * 0.13, 0, 1.08), (0.02 + a * 0.22, 0, 1.24 - abs(a) * 0.06), (0.02 + a * 0.26, -0.03, 1.32 - abs(a) * 0.1)], 0.014, "#9ab0a0", 4)
    p.tube([(0.1, 0, 1.0), (0.2, 0, 1.08)], 0.016, "#9ab0a0", 4)
    p.export()


# ------------------------------------------------------------ Floor 8: the Workings
def mine_timber():
    p = Prop("mine_timber", 520)
    # Pit props holding up a low bit of roof. They've been holding it up for a long time, and they are bowing.
    for s in (-1, 1):
        p.tube([(s * 3.4, 0, 0), (s * 3.54, 0.1, 2.4), (s * 3.3, 0, 5.0)], 0.28, "#5a4028", 8)
    p.box((8.4, 0.62, 0.62), (0, 0, 5.2), "#5a4028", rot=(0, 0.02, 0), bevel=0.05, wonk=0.02)
    for s in (-1, 1):
        p.box((1.6, 0.34, 0.3), (s * 2.8, 0, 4.5), "#4a3420", rot=(0, s * 0.7, 0), bevel=0.03)
    p.box((0.14, 0.14, 0.8), (0, -0.34, 4.5), DARK, bevel=0.01)
    p.ball(0.12, (0, -0.42, 4.0), "glow:#ffc060", subdiv=1)
    p.export()


def rock_pillar():
    p = Prop("rock_pillar", 521)
    # What the miners left to hold the roof up: a raw pillar of rock, floor to ceiling, scarred with pick marks.
    prof = [(5.0, 0), (3.8, 1.2), (3.2, 4), (2.8, 8), (3.0, 12), (3.6, 16), (5.0, 20)]
    p.lathe(prof, (0, 0, 0), "#5a4436", segs=10)
    for i in range(16):
        a, z = i * 1.3, p.rng.uniform(1, 18)
        r = 2.5
        p.ball(p.rng.uniform(1.4, 2.4), (math.cos(a) * r, math.sin(a) * r, z), "#544234", scale=(1, 1, 1.4), lumpy=0.14, subdiv=2)
    for i in range(10):
        a, z = i * 2.1, 1.0 + i * 0.5
        p.box((0.05, 0.3, 0.9), (math.cos(a) * 3.4, math.sin(a) * 3.4, z), "#2a2018", rot=(0, 0.3, a), bevel=0.0)
    p.export()


def drill_rig():
    p = Prop("drill_rig", 522)
    # The Drill Prophet's rig: a brass tower with a screw as tall as a church, pointing down. It's praying, or it's drilling.
    for a in ring(4, 0.78):
        p.tube([(math.cos(a) * 6.0, math.sin(a) * 6.0, 0), (math.cos(a) * 2.2, math.sin(a) * 2.2, 18)], 0.34, RUST, 8)
        p.tube([(math.cos(a) * 5.0, math.sin(a) * 5.0, 4), (math.cos(a + 1.57) * 5.0, math.sin(a + 1.57) * 5.0, 4)], 0.14, RUST, 6)
        p.tube([(math.cos(a) * 3.9, math.sin(a) * 3.9, 9), (math.cos(a + 1.57) * 3.9, math.sin(a + 1.57) * 3.9, 9)], 0.14, RUST, 6)
    p.lathe([(2.6, 0), (2.8, 1.2), (2.2, 2.0), (2.2, 3.4), (2.6, 3.6), (0.001, 3.8)], (0, 0, 14.4), BRASS, segs=16)
    pts = []
    for i in range(46):
        t = i / 45
        a = t * 22
        r = 2.0 * (1 - t) + 0.14
        pts.append((math.cos(a) * r, math.sin(a) * r, 14.4 - t * 14.2))
    p.tube(pts, 0.34, "#9aa0a8", 7)
    p.lathe([(0.8, 14.4), (0.08, 0.2)], (0, 0, 0), "#6a6a72", segs=10)
    for i in range(16):
        a = i * 0.39
        p.tube([(math.cos(a) * 2.6, math.sin(a) * 2.6, 17.5), (math.cos(a) * 3.2, math.sin(a) * 3.2, 16)], 0.05, "#d8cfb4", 4)
    p.ball(1.2, (0, 0, 0.25), "#2a1c12", scale=(5, 5, 0.1), lumpy=0.25, subdiv=2)
    p.export()


def mine_cart():
    p = Prop("mine_cart", 523)
    # A mine cart. There's room in the back. There's a lot of room, since they stopped checking who got in.
    p.lathe([(0.9, 0), (1.0, 0.1), (1.34, 1.1), (1.26, 1.1), (0.9, 0.2), (0.001, 0.14)], (0, 0, 0.34), RUST, segs=4, rot=(0, 0, 0.78))
    for s in (-1, 1):
        for y in (-0.72, 0.72):
            p.cyl(0.26, 0.26, 0.12, (s * 0.72, y, 0.26), DARK, rot=(0, math.pi / 2, 0), segs=14)
            p.cyl(0.32, 0.32, 0.04, (s * 0.64, y, 0.26), "#6a6a70", rot=(0, math.pi / 2, 0), segs=14)
    p.tube([(-0.9, -1.1, 1.3), (0, -1.2, 1.5), (0.9, -1.1, 1.3)], 0.024, RUST, 5)
    for x, y, z in ((-0.3, 0.5, 0.6), (0.4, 0.8, 0.65), (0, 0.7, 0.75)):
        p.ball(0.28, (x, y, z), "#3a2e24", lumpy=0.25, subdiv=1)
    p.ball(0.11, (-0.3, 0.8, 0.98), BONE, scale=(0.9, 1, 1.1), subdiv=1)
    p.export()


def fryer_vat():
    p = Prop("fryer_vat", 524)
    # An industrial fryer the size of a swimming pool. Bubbling. Baskets go down full and come up lighter.
    W, D = 10.0, 6.0
    for s in (-1, 1):
        p.box((W + 1, 0.5, 2.2), (0, s * (D / 2 + 0.25), 1.1), "#7a7a80", bevel=0.05)
        p.box((0.5, D + 1, 2.2), (s * (W / 2 + 0.25), 0, 1.1), "#7a7a80", bevel=0.05)
    p.box((W, D, 0.1), (0, 0, 1.85), GREASE, bevel=0.0)
    p.box((W + 1, D + 1, 0.3), (0, 0, 0.15), "#2a2a30", bevel=0.02)
    for i in range(18):
        p.ball(p.rng.uniform(0.1, 0.32), (p.rng.uniform(-4.7, 4.7), p.rng.uniform(-2.7, 2.7), 1.92), "#e8c060", scale=(1, 1, 0.5), subdiv=1)
    for x in (-3.2, 0, 3.2):
        p.tube([(x, 0, 6), (x, 0, 3.6)], 0.03, DARK, 4)
        p.box((2.2, 2.2, 0.06), (x, 0, 3.0), "#9aa0a8", bevel=0.0)
        for a in range(5):
            p.tube([(x - 1.1 + a * 0.55, -1.1, 3.0), (x - 1.1 + a * 0.55, -1.1, 3.6), (x, 0, 3.6)], 0.02, "#9aa0a8", 3)
            p.tube([(x - 1.1 + a * 0.55, 1.1, 3.0), (x - 1.1 + a * 0.55, 1.1, 3.6), (x, 0, 3.6)], 0.02, "#9aa0a8", 3)
        p.ball(0.8, (x, 0, 3.4), CRUST, scale=(1.3, 0.7, 0.5), lumpy=0.22, subdiv=2)
    p.box((W + 1, 0.3, 0.6), (0, 0, 6.2), "#3a3a40", bevel=0.03)
    for s in (-1, 1):
        p.cyl(0.14, 0.14, 6.2, (s * (W / 2 + 0.4), 0, 3.1), "#3a3a40", segs=8)
    p.export()


def battered_body():
    p = Prop("battered_body", 525)
    # Breaded, golden, hung to drip. It's the right shape. Origin at the hook so it can sway.
    p.tube([(0, 0, 0), (0, 0, -0.44)], 0.012, CHROME, 3)
    p.lathe([(0.02, -0.45), (0.1, -0.56), (0.11, -0.72), (0.2, -0.8), (0.22, -1.2), (0.18, -1.6), (0.16, -2.36), (0.04, -2.44)], (0, 0, 0), CRUST, segs=9)
    for s in (-1, 1):
        p.tube([(s * 0.2, 0, -0.84), (s * 0.3, 0, -1.3), (s * 0.28, 0, -1.68)], 0.06, CRUST, 5)
    for i in range(24):
        p.ball(0.06, (p.rng.uniform(-0.22, 0.22), p.rng.uniform(-0.2, 0.2), p.rng.uniform(-2.3, -0.7)), "#c89a4a", subdiv=0)
    p.ball(0.12, (0, 0, -0.6), "#a8742a", subdiv=1)
    for i in range(3):
        p.box((0.015, 0.015, 0.3), (p.rng.uniform(-0.1, 0.1), 0, -2.7), GREASE, bevel=0.0)
    p.export()


def grease_pool():
    p = Prop("grease_pool", 526)
    p.ball(3.0, (0, 0, 0.016), GREASE, scale=(1.4, 1, 0.012), lumpy=0.2, subdiv=2)
    for i in range(8):
        a, r = p.rng.uniform(0, math.tau), p.rng.uniform(0.3, 2.6)
        p.ball(p.rng.uniform(0.06, 0.2), (math.cos(a) * r * 1.3, math.sin(a) * r, 0.05), "#e8c060", scale=(1, 1, 0.5), subdiv=1)
    p.export()


def fry_mound():
    p = Prop("fry_mound", 527)
    # A hill of cold fries, house-sized. Rats live in it. There are other things in it.
    for i in range(170):
        a, q = i * 2.4, (i % 40) / 40
        r = (1 - q) * 5.4 + 0.2
        loc = (math.cos(a) * r, math.sin(a) * r, q * 3.6 + 0.1)
        rot = (p.rng.uniform(-1, 1), p.rng.uniform(-1, 1), p.rng.uniform(0, 3))
        p.box((0.18, 0.18, 1.6), loc, p.rng.choice(("#e8c060", "#d8a838", "#c8983a")), rot=rot, bevel=0.0)
    p.ball(0.22, (2.2, -2.8, 1.1), BONE, scale=(0.9, 1, 1.1), subdiv=2)
    p.export()


def mold_bloom():
    p = Prop("mold_bloom", 528)
    # Big Momma Mold's skin, spreading over everything in soft fat rosettes. It's warm. It's not unkind. It's still spreading.
    for i in range(24):
        a, r = i * 2.4, math.sqrt(i / 24) * 4.0
        s = p.rng.uniform(0.5, 1.2)
        x, y = math.cos(a) * r, math.sin(a) * r
        p.ball(s, (x, y, s * 0.2), p.rng.choice((MOLD, "#a8b888", "#6a8a64", "#d8d8a8")), scale=(1, 1, 0.42), lumpy=0.1, subdiv=2)
        if i % 3 == 0:
            p.ball(s * 0.22, (x, y, s * 0.52), "#e8e8c8", scale=(1, 1, 0.5), subdiv=1)
        if i % 5 == 0:
            p.ball(0.05, (x + 0.1, y, s * 0.6), "glow:#c8ffa8", subdiv=0)
    p.export()


def mold_crib():
    p = Prop("mold_crib", 529)
    # The Nursery: rows of white cots, each with a mobile, each grown over. Something in each breathes in time.
    p.box((1.4, 0.8, 0.06), (0, 0, 0.5), "#f0ece0", bevel=0.01)
    for s in (-1, 1):
        for f in (-1, 1):
            p.cyl(0.03, 0.03, 1.1, (s * 0.68, f * 0.38, 0.55), "#f0ece0", segs=6)
        for x in range(9):
            p.cyl(0.012, 0.012, 0.5, (-0.6 + x * 0.15, s * 0.38, 0.85), "#f0ece0", segs=4)
    p.ball(0.5, (0, 0, 0.7), MOLD, scale=(1.1, 0.64, 0.56), lumpy=0.18, subdiv=2)
    p.ball(0.18, (-0.32, 0, 0.92), "#c8d0a8", scale=(1, 1, 1.05), subdiv=2)
    p.ball(0.02, (-0.38, -0.15, 0.96), "#0f1412", subdiv=0)
    p.ball(0.02, (-0.26, -0.15, 0.96), "#0f1412", subdiv=0)
    for a in (0.0, 2.1, 4.2):
        p.lathe([(0.1, 0), (0.03, 0.1), (0.001, 0.22)], (math.cos(a) * 0.3, math.sin(a) * 0.2, 1.3), "#e8a8a8", segs=7)
    p.tube([(0.68, 0.38, 1.1), (0.34, 0.2, 1.8), (0, 0, 1.8)], 0.016, "#f0ece0", 4)
    p.ball(0.06, (0, 0, 1.56), "#e8a8c8", subdiv=1)
    p.ball(0.05, (0.2, 0.1, 1.52), "#a8c8e8", subdiv=1)
    p.export()


def repo_winch():
    p = Prop("repo_winch", 530)
    # The Repo Yard: a house on a hook. It's been repossessed. The family didn't get out, and they're still paying it off.
    for s in (-1, 1):
        p.tube([(s * 5, -1, 0), (s * 1.4, 0, 16)], 0.26, BRASS, 8)
        p.tube([(s * 5, 1, 0), (s * 1.4, 0, 16)], 0.26, BRASS, 8)
    p.box((5, 1.6, 1), (0, 0, 16.4), RUST, bevel=0.1)
    p.lathe([(1.2, 0), (1.3, 0.3), (1.2, 0.6)], (0, -0.8, 17.8), BRASS, segs=20, rot=(math.pi / 2, 0, 0))
    for a in ring(8):
        p.tube([(0, -0.8, 17.8), (math.cos(a) * 1.2, -0.8, 17.8 + math.sin(a) * 1.2)], 0.05, BRASS, 5)
    p.tube([(0, 0, 16), (0, 0, 10.8)], 0.08, DARK, 5)
    p.box((5.4, 4.6, 3.4), (0, 0, 7.8), "#a8b0a0", rot=(0.04, 0.1, 0.05), bevel=0.04)
    p.box((5.8, 5.0, 0.2), (0, 0, 10.3), "#5a4438", rot=(0.04, 0.1, 0.05), bevel=0.02)
    for x in (-1.6, 1.6):
        p.box((1.2, 0.1, 1.2), (x, -2.36, 8.0), "glow:#ffd88a", rot=(0.04, 0.1, 0.05), bevel=0.0)
    p.box((1.0, 0.1, 2.0), (0, -2.36, 7.4), "#7a2a22", rot=(0.04, 0.1, 0.05), bevel=0.0)
    for i in range(10):
        p.box((0.06, 0.03, p.rng.uniform(0.4, 2.2)), (p.rng.uniform(-2.6, 2.6), -2.4, 5.4), BLOOD, bevel=0.0)
    p.export()


def clock_gear():
    p = Prop("clock_gear", 531)
    # A brass gear from one of the Collectors, half buried, with the name of someone on every tooth.
    p.lathe([(2.2, 0), (2.3, 0.2), (2.2, 0.4), (0.6, 0.4), (0.5, 0.2), (0.6, 0)], (0, 0, 0), BRASS, segs=24, rot=(1.3, 0.1, 0))
    for a in ring(14):
        p.box((0.46, 0.34, 0.46), (math.cos(a) * 2.5, -0.1, 0.1 + math.sin(a) * 2.5), "#b8944a", rot=(0, -a, 0), bevel=0.02)
    for a in ring(5):
        p.tube([(0, 0, 0), (math.cos(a) * 2.0, -0.2, math.sin(a) * 2.0)], 0.1, "#b8944a", 5)
    p.export()


def gem_seam():
    p = Prop("gem_seam", 532)
    # The Bright Seam: a wall of rock bursting with crystal. They dug out everything else to get to it, and then they stopped. Nobody will say why.
    for i in range(26):
        a, z = i * 2.4, (i % 13) * 1.2
        p.ball(p.rng.uniform(1.8, 3.4), (math.cos(a) * 5.6, math.sin(a) * 2.6, z + 1), "#3a2c22", scale=(1, 0.8, 1), lumpy=0.14, subdiv=2)
    for i in range(30):
        a, z = i * 1.3, p.rng.uniform(1, 14)
        x, y = math.cos(a) * 5.0, -2.8 - abs(math.sin(a)) * 0.9
        h = p.rng.uniform(1.0, 3.4)
        p.lathe([(h * 0.2, 0), (h * 0.24, h * 0.6), (0.001, h)], (x, y, z), p.rng.choice(("glow:#ffd88a", "glow:#ffb050", "#f0d090")), segs=6, rot=(p.rng.uniform(0.8, 1.9), 0, p.rng.uniform(-0.8, 0.8)))
    figure(p, -3.6, -4.2, 1.75, "#d8c8a0", "#d8c8a0", "#d8c8a0", arms_up=0.5)
    p.lathe([(0.2, 0), (0.14, 2.0), (0.001, 3.2)], (-3.6, -4.2, 0.9), "glow:#ffd88a", segs=6, rot=(0.4, 0, 0))
    p.export()


def furnace_stack():
    p = Prop("furnace_stack", 533)
    # A smelting stack, thirty metres of stained brick up into the dark, with a fire you can feel from here.
    p.lathe([(4.6, 0), (4.0, 3), (2.7, 8), (2.3, 20), (2.5, 21), (2.2, 21), (1.8, 8)], (0, 0, 0), "#5a3a2a", segs=16)
    p.box((3.2, 1.0, 3.0), (0, -3.6, 1.6), "#2a1a12", bevel=0.1)
    p.box((2.4, 0.2, 2.2), (0, -4.14, 1.5), "glow:#ff7a2a", bevel=0.0)
    for z in (5, 11, 17):
        p.lathe([(2.92 if z < 8 else 2.5, 0), (3.0 if z < 8 else 2.6, 0.2), (2.92 if z < 8 else 2.5, 0.4)], (0, 0, z), RUST, segs=16)
    p.export()


# ------------------------------------------------------------ Floor 9: the Undercity
def civic_front():
    p = Prop("civic_front", 540)
    # A grand municipal front with columns, a pediment and a motto. The Undercity was going to be the next great city. It still thinks so.
    W, H = 24.0, 15.0
    p.box((W, 1.2, 1.4), (0, 0, H - 0.2), "#b8b4a4", bevel=0.05)
    for i in range(9):
        t = i / 8
        h = 3.6 * (1 - abs(t - 0.5) * 2)
        p.box((W / 8 + 0.1, 1.0, h + 0.3), (-W / 2 + W * t, 0, H + 0.5 + h / 2), "#c8c4b0", bevel=0.02)
    p.lathe([(1.2, 0), (1.3, 0.2), (0.6, 0.5)], (0, -0.6, H + 2.4), VERDIGRIS, segs=14, rot=(math.pi / 2, 0, 0))
    for i in range(7):
        x = -9.6 + i * 3.2
        p.lathe([(0.9, 0), (0.86, 0.5), (0.62, 0.74), (0.5, 1), (0.42, H - 2), (0.74, H - 1.3), (0.9, H - 1)], (x, -0.3, 0), "#c8c4b0", segs=14)
        for a in ring(6):
            p.cyl(0.03, 0.03, H - 3, (x + math.cos(a) * 0.46, -0.3 + math.sin(a) * 0.46, H / 2), "#a8a490", segs=4)
    for i in range(4):
        p.box((W + 1 - i * 0.2, 2.0 - i * 0.4, 0.24), (0, -0.8 + i * 0.2, 0.1 + i * 0.22), "#a8a494", bevel=0.02)
    # streaks of rust and green, and a rat on every ledge
    for i in range(18):
        p.box((0.1, 0.02, p.rng.uniform(1.0, 6.0)), (p.rng.uniform(-11, 11), -0.64, H - 3), VERDIGRIS, bevel=0.0)
    for x in (-8, -3, 2, 7):
        p.ball(0.18, (x, -0.7, H + 0.55), RAT, scale=(0.7, 1.3, 0.8), subdiv=1)
    p.export()


def rat_statue():
    p = Prop("rat_statue", 541)
    # A heroic bronze of the Founder, gone green, in a toga. Everyone agrees he was a man. He has a tail.
    p.lathe([(2.3, 0), (2.4, 0.4), (1.7, 0.6), (1.5, 3), (1.8, 3.2), (1.8, 3.4)], (0, 0, 0), "#8a8a7a", segs=4, rot=(0, 0, 0.78))
    p.lathe([(0.34, 0), (0.56, 1.4), (0.6, 2.2), (0.72, 2.8), (0.34, 3.2)], (0, 0, 3.4), VERDIGRIS, segs=14)
    p.ball(0.36, (0, -0.1, 7.0), VERDIGRIS, scale=(0.72, 1.4, 0.8), subdiv=2)
    p.lathe([(0.1, 0), (0.001, 0.32)], (0, -0.54, 7.0), VERDIGRIS, segs=8, rot=(math.pi / 2, 0, 0))
    for s in (-1, 1):
        p.ball(0.15, (s * 0.2, 0.08, 7.32), VERDIGRIS, scale=(1, 0.3, 1), subdiv=1)
        p.ball(0.05, (s * 0.12, -0.3, 7.12), "glow:#ff5a3a", subdiv=0)
        p.tube([(s * 0.5, 0, 6.2), (s * 0.8, -0.3, 6.6), (s * 0.9, -0.5, 7.6) if s > 0 else (s * 0.8, -0.3, 5.3)], 0.1, VERDIGRIS, 6)
    p.tube([(0, 0.34, 3.6), (0, 1.4, 3.42), (1.0, 2.0, 3.42), (1.6, 1.2, 3.42)], 0.08, VERDIGRIS, 6)
    for i in range(6):
        a = i * 1.05
        p.ball(0.2, (math.cos(a) * 1.5, math.sin(a) * 1.5, 3.56), RAT, scale=(0.7, 1.4, 0.8), rot=(0, 0, a), subdiv=1)
    p.export()


def senate_tier():
    p = Prop("senate_tier", 542)
    # A rank of curved stone benches, with a very small cushion at each place, in the Rat Senate.
    for i in range(3):
        for a in range(9):
            t = -0.8 + a * 0.2
            r = 10.0 + i * 1.6
            p.box((2.2, 1.4, 0.9 + i * 0.9), (math.sin(t) * r, -math.cos(t) * r, (0.9 + i * 0.9) / 2), "#a8a494", rot=(0, 0, t), bevel=0.03)
            if a % 2 == 0:
                p.ball(0.14, (math.sin(t) * r, -math.cos(t) * r, 1.0 + i * 0.9), "#6a2a7a", scale=(1.3, 1.3, 0.4), subdiv=1)
                p.ball(0.16, (math.sin(t) * r, -math.cos(t) * r, 1.14 + i * 0.9), RAT, scale=(0.7, 1.2, 0.9), subdiv=1)
    p.export()


def rat_throne():
    p = Prop("rat_throne", 543)
    # The Rat Throne. It's a throne, and it's made of rats. They're holding each other up by the tails, and they're tired.
    for i in range(240):
        q = i / 240
        a = i * 2.4
        if q < 0.45:
            r = (1 - q / 0.45) * 3.6 + 0.8
            x, y, z = math.cos(a) * r, math.sin(a) * r, q / 0.45 * 2.4 + 0.2
        else:
            t = (q - 0.45) / 0.55
            x, y, z = p.rng.uniform(-1.4, 1.4), 1.0 + p.rng.uniform(-0.3, 0.3), 2.4 + t * 5.2
        p.ball(0.2, (x, y, z), p.rng.choice((RAT, "#6a5a50", "#4a3e38")), scale=(0.7, 1.3, 0.8), rot=(p.rng.uniform(-1, 1), 0, a), subdiv=0)
        if i % 3 == 0:
            p.tube([(x, y, z), (x + p.rng.uniform(-0.4, 0.4), y + p.rng.uniform(-0.4, 0.4), z - 0.3)], 0.02, "#d8a8a0", 3)
        if i % 4 == 0:
            p.ball(0.022, (x, y - 0.24, z + 0.04), "glow:#ff3a2a", subdiv=0)
    p.ball(0.4, (0, 0.8, 8.0), GOLD, scale=(1, 1, 0.5), subdiv=1)
    p.export()


def tail_knot():
    p = Prop("tail_knot", 544)
    # A swag of knotted tails across the street. It's bunting, for the election. They are mostly still attached.
    for i in range(12):
        p.tube([(-5, 0, 3.0 + i * 0.03), (-2, 0.1, 1.5), (0, 0, 1.2 + (i % 3) * 0.1), (2, -0.1, 1.5), (5, 0, 3.0 - i * 0.03)], 0.016, "#d8a8a0", 4)
    for x in (-3.0, -1.0, 1.0, 3.0):
        p.ball(0.15, (x, 0, 1.1 + abs(x) * 0.26), RAT, scale=(0.7, 1.3, 0.8), subdiv=1)
        p.box((0.5, 0.02, 0.34), (x, -0.1, 0.7 + abs(x) * 0.26), "#6a2a7a", bevel=0.0)
    p.export()


def vault_door():
    p = Prop("vault_door", 545)
    # A bank vault door the size of a barn, standing open in the street. Nothing went in. Lots has come out.
    p.lathe([(7.0, 0), (7.2, 0.5), (7.0, 1.5), (5.9, 1.6), (5.7, 1.0), (0.001, 1.0)], (0, 0, 7.4), "#7a7a80", segs=32, rot=(math.pi / 2, 0, 0))
    for a in ring(16):
        p.cyl(0.26, 0.26, 2.0, (math.cos(a) * 6.3, -1.8, 7.4 + math.sin(a) * 6.3), CHROME, rot=(math.pi / 2, 0, 0), segs=10)
    p.lathe([(1.8, 0), (1.8, 0.4), (0.4, 0.5), (0.3, 1.0)], (0, -1.0, 7.4), BRASS, segs=18, rot=(math.pi / 2, 0, 0))
    for a in ring(3):
        p.tube([(0, -2.2, 7.4), (math.cos(a) * 2.2, -2.2, 7.4 + math.sin(a) * 2.2)], 0.16, BRASS, 6)
    p.box((1.8, 3.2, 15), (7.6, 1.4, 7.5), "#5a5a60", bevel=0.06)
    for i in range(70):
        a, r = p.rng.uniform(-2.8, -0.3), p.rng.uniform(1.5, 9.0)
        p.lathe([(0.18, 0), (0.18, 0.05), (0.001, 0.05)], (math.cos(a) * r, math.sin(a) * r - 3.0, 0.03 + (i % 5) * 0.03), GOLD, segs=8)
    p.export()


def deposit_boxes():
    p = Prop("deposit_boxes", 546)
    # A wall of safety deposit boxes, dragged outside and broken open. Each has a label, and something is still in each.
    for r in range(6):
        for c in range(8):
            x, z = -3.5 + c, 0.5 + r * 0.72
            p.box((0.92, 0.5, 0.64), (x, 0, z), "#8a8a90", bevel=0.02)
            p.box((0.1, 0.02, 0.05), (x, -0.26, z + 0.12), BRASS, bevel=0.0)
            p.box((0.4, 0.02, 0.14), (x, -0.26, z - 0.1), "#efe6d0", bevel=0.0)
            if (r * 3 + c) % 5 == 0:
                p.box((0.8, 0.04, 0.54), (x, -0.27, z), "#14141a", bevel=0.0)
                p.ball(0.12, (x, -0.28, z), p.rng.choice((BONE, GOLD, "#a8483a")), subdiv=1)
    p.export()


def subway_car():
    p = Prop("subway_car", 547)
    # The last Metro train. The route map only has one stop on it now, and the passengers don't get off. You stand by the driver.
    L, W, H = 14.0, 2.8, 2.8
    p.box((W, L, H), (0, 2.8, 0.5 + H / 2), "#a8b0a8", bevel=0.2)
    p.box((W + 0.08, L + 0.08, 0.4), (0, 2.8, 2.5), "#7a2a2a", bevel=0.02)
    p.box((W + 0.08, L + 0.08, 0.14), (0, 2.8, 0.76), "#2a2a30", bevel=0.01)
    p.ball(1.4, (0, -4.2, 1.9), "#a8b0a8", scale=(1, 0.5, 1.0), subdiv=2)
    p.box((1.6, 0.1, 0.9), (0, -4.82, 2.4), "#b8d8e0", bevel=0.0)
    for s in (-1, 1):
        p.ball(0.15, (s * 0.8, -4.82, 1.3), "glow:#fff4d0", subdiv=1)
        for y in (-2, 2, 6, 10):
            p.box((0.03, 1.2, 0.8), (s * (W / 2 + 0.03), y, 2.2), "#d8d0a0", bevel=0.0)
            figure_x = s * (W / 2 + 0.05)
            p.ball(0.15, (figure_x, y + 0.2, 2.1), "#3a3a44", scale=(0.3, 1, 1.2), subdiv=1)
            p.box((0.04, 0.34, 0.4), (figure_x, y + 0.2, 1.72), "#3a3a44", bevel=0.0)
        for y in (0.0, 4.0, 8.0):
            p.box((0.04, 1.1, 2.0), (s * (W / 2 + 0.03), y, 1.7), "#7a8078", bevel=0.0)
        for y in (-2.6, -1.4, 7.0, 8.2):
            p.cyl(0.42, 0.42, 0.14, (s * 1.1, y, 0.42), DARK, rot=(0, math.pi / 2, 0), segs=12)
    p.export()


def metro_entrance():
    p = Prop("metro_entrance", 548)
    # An art-nouveau station entrance, green iron and a lit globe, and steps going down to where it's flooded with something.
    for s in (-1, 1):
        p.tube([(s * 3.0, -2.5, 0), (s * 3.0, -2.5, 3.0), (s * 2.0, -2.5, 4.4), (0, -2.5, 4.8), (-s * 2.0, -2.5, 4.4)], 0.09, VERDIGRIS, 7)
        for y in (-2.5, -1, 0.5, 2.0):
            p.tube([(s * 3.0, y, 0), (s * 3.0, y, 1.1)], 0.04, VERDIGRIS, 5)
        p.tube([(s * 3.0, -2.5, 1.1), (s * 3.0, 2.0, 1.1)], 0.05, VERDIGRIS, 5)
        p.lathe([(0.3, 0), (0.3, 0.1), (0.001, 0.1)], (s * 3.0, -2.5, 3.0), VERDIGRIS, segs=9)
    p.ball(0.42, (0, -2.5, 5.2), "glow:#fff4c0", subdiv=2)
    p.box((4.0, 0.08, 0.7), (0, -2.54, 3.6), "#1a2a24", bevel=0.01)
    p.box((3.6, 0.04, 0.42), (0, -2.6, 3.6), "#e8e0b0", bevel=0.0)
    for i in range(6):
        p.box((5.7, 0.7, 0.2), (0, -1.5 + i * 0.7, 0.02 - i * 0.0), "#3a3430" if i % 2 else "#2a2622", bevel=0.01)
    p.box((5.4, 1.0, 0.02), (0, 2.3, 0.14), "#14121a", bevel=0.0)
    p.export()


def spore_arch():
    p = Prop("spore_arch", 549)
    # Spore Cathedral: a gothic nave grown rather than built, ribs of pale stalk meeting overhead. It sings a little.
    for s in (-1, 1):
        p.tube([(s * 9, 0, 0), (s * 8.4, 0, 8), (s * 5, 0, 16), (0, 0, 20)], 0.7, "#d8d0b0", 10)
        p.lathe([(2.0, 0), (1.6, 0.3), (0.8, 0.6), (0.3, 0.5)], (s * 8.0, -0.6, 11), "#a87a8a", segs=12)
        p.lathe([(1.2, 0), (0.9, 0.2), (0.4, 0.4)], (s * 8.6, 0.4, 6), MOLD, segs=12)
        for z in (3, 5.5, 9, 13):
            p.ball(0.08, (s * 8.4, -0.8, z), "glow:#a8ffd8", subdiv=1)
    p.export()


def big_toadstool():
    p = Prop("big_toadstool", 550)
    # Opera-house mushrooms, spotted and frilled. The mouths are in the stalk. They hold the note until you've gone by.
    p.lathe([(0.8, 0), (0.56, 0.5), (0.44, 3), (0.5, 4.2)], (0, 0, 0), "#e8e0c8", segs=12)
    p.lathe([(0.3, 4.0), (2.8, 4.1), (3.0, 4.5), (2.0, 5.5), (0.8, 6.0), (0.001, 6.1)], (0, 0, 0), "#7a2a5a", segs=20)
    for a in ring(9):
        p.ball(0.26, (math.cos(a) * 1.9, math.sin(a) * 1.9, 5.3), "#f0e8d0", scale=(1, 1, 0.4), subdiv=1)
    p.ball(0.26, (0, -0.42, 2.4), "#2a1420", scale=(0.9, 0.3, 1.5), subdiv=1)
    for s in (-1, 1):
        p.ball(0.08, (s * 0.2, -0.46, 3.3), "#0f0a12", scale=(1, 0.5, 1.5), subdiv=0)
    for i in range(10):
        a = i * 0.63
        p.tube([(math.cos(a) * 0.5, math.sin(a) * 0.5, 4.0), (math.cos(a) * 1.8, math.sin(a) * 1.8, 4.05)], 0.018, "#c8b8a0", 3)
    p.ball(0.3, (0.2, -0.4, 3.9), "glow:#c8a8ff", scale=(0.5, 0.3, 0.2), subdiv=0)
    p.export()


def founders_lantern():
    p = Prop("founders_lantern", 551)
    # The Founders Lantern: as big as a lighthouse, with a very pale light. Whatever's in there is what's burning.
    p.lathe([(3.4, 0), (3.5, 0.6), (2.0, 1.4), (1.1, 8.0), (1.4, 16), (2.6, 17)], (0, 0, 0), "#3a4a44", segs=14)
    p.lathe([(2.4, 0), (2.4, 5.2)], (0, 0, 17), "glow:#ffefc0", segs=10)
    for a in ring(10):
        p.cyl(0.08, 0.08, 5.4, (math.cos(a) * 2.5, math.sin(a) * 2.5, 19.6), "#2a3a34", segs=6)
    p.lathe([(3.2, 0), (0.6, 2.2), (0.3, 3.8)], (0, 0, 22), VERDIGRIS, segs=14)
    p.lathe([(0.6, 0), (0.8, 0.5)], (0, 0, 25.5), VERDIGRIS, segs=10)
    # a shape inside, curled round, to be seen through the panes
    p.ball(1.3, (0.1, 0, 19), "#6a5a44", scale=(1, 0.9, 1.3), subdiv=1)
    for a in ring(5):
        p.tube([(math.cos(a) * 3.3, math.sin(a) * 3.3, 0.5), (math.cos(a) * 3.8, math.sin(a) * 3.8, 0.1)], 0.14, RAT, 5)
    p.export()


def ballot_box():
    p = Prop("ballot_box", 552)
    # Vote early. Vote often. Each ballot's been filled in, and they've used the same hand.
    p.box((0.9, 0.9, 1.1), (0, 0, 0.55), "#6a2a7a", bevel=0.05)
    p.box((0.5, 0.05, 0.03), (0, -0.46, 0.96), DARK, bevel=0.0)
    p.box((0.94, 0.94, 0.08), (0, 0, 1.12), GOLD, bevel=0.02)
    for i in range(12):
        a, r = i * 2.4, 0.5 + i * 0.1
        p.box((0.2, 0.28, 0.008), (math.cos(a) * r, math.sin(a) * r, 0.02 + i * 0.002), "#e8e0c8", rot=(0, 0, a), bevel=0.0)
    p.tube([(0.1, -0.46, 0.98), (0.1, -0.56, 1.0), (0.14, -0.62, 0.92)], 0.016, "#c8a890", 4)
    p.export()


def petitioner():
    p = Prop("petitioner", 553)
    # Someone in a good coat, in the queue at City Hall. They've been told it won't be long. Their hat is gathering dust.
    figure(p, 0, 0, 1.75, "#a8a498", "#3a3a44", "#2a2a30", lean=0.02)
    p.cyl(0.13, 0.13, 0.16, (0, 0.03, 1.8), "#1c1c22", segs=10)
    p.cyl(0.2, 0.2, 0.02, (0, 0.03, 1.72), "#1c1c22", segs=12)
    p.box((0.2, 0.02, 0.26), (0.3, -0.08, 0.84), "#e8e0c8", bevel=0.0)
    for s in (-1, 1):
        p.ball(0.018, (s * 0.04, -0.11, 1.64), "#0f0e12", subdiv=0)
    p.export()


def caves_f7_f9():
    # Floor 7: the drowned drains. Round brick, wet-green walls, and a big cistern chamber where the wyrms nest.
    build_cave("cave_f7", [((0, 0, 3), (7, 7, 5)), ((28, -6, 0), (8, 8, 5)), ((56, 8, -2), (10, 10, 6)), ((60, 40, -4), (9, 9, 6)), ((30, 56, -6), (18, 15, 11)), ((-4, 34, -4), (8, 8, 5))], [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 0)], "#3e5a50", tube_r=3.4, strength=1.0)
    # Floor 8: old mine galleries, hacked square-ish, then the deep chamber nobody signed for.
    build_cave("cave_f8", [((0, 0, 3), (7, 7, 5)), ((-26, 8, 0), (9, 8, 6)), ((-52, 0, -3), (9, 10, 6)), ((-66, 30, -6), (12, 10, 7)), ((-40, 50, -9), (20, 16, 13)), ((-8, 32, -5), (8, 8, 5))], [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 1)], "#5a4032", tube_r=3.2, strength=3.2)
    # Floor 9: the old Metro tunnels, with one station that was never on the map.
    build_cave("cave_f9", [((0, 0, 3), (7, 7, 5)), ((36, 0, 0), (7, 7, 5)), ((72, 0, -2), (8, 8, 5)), ((72, 36, -4), (8, 8, 5)), ((40, 50, -5), (20, 14, 11)), ((6, 32, -4), (8, 8, 5))], [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 0)], "#4a4a54", tube_r=3.5, strength=0.6)


BUILDERS = [
    cistern_column, brick_arch, sunk_tenement, eviction_pile, giant_tub, organ_pipes, bag_heap, body_bag, wyrm_spine, ferry, ferry_cable, pump_engine, sluice_gate, jetty, drowned_hand,
    mine_timber, rock_pillar, drill_rig, mine_cart, fryer_vat, battered_body, grease_pool, fry_mound, mold_bloom, mold_crib, repo_winch, clock_gear, gem_seam, furnace_stack,
    civic_front, rat_statue, senate_tier, rat_throne, tail_knot, vault_door, deposit_boxes, subway_car, metro_entrance, spore_arch, big_toadstool, founders_lantern, ballot_box, petitioner, caves_f7_f9,
]

if __name__ == "__main__":
    wanted = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    for build in BUILDERS:
        if wanted and build.__name__ not in wanted:
            continue
        build()
    print("WILDS F7 F9 DONE")
