# Props for the land outside the towns on Floors 4, 5 and 6, including their caves.
#   F:\Downstairs\Blender\blender.exe -b --python tools/blender/build_wilds_f4_f6.py [-- name name ...]
# Exports to godot/models/props/wilds/<name>.glb.
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_landing_kit as kit
from build_landing_kit import Prop, STEEL, DARK, CREAM, BRASS, WOOD, WOOD_DARK
from build_wilds_f2_f3 import build_cave, BONE, BLOOD, GORE, MEAT, RUBBER, CHROME

kit.OUT = os.path.join(os.path.dirname(kit.OUT), "wilds")
SKIN = "#e0b090"
PLASTIC = "#e8dccc"
LEAF = "#2f6a34"
LEAF_DARK = "#1c4a28"
BARK = "#4a3424"
KHAKI = "#b09a6a"
GLOW_GREEN = "glow:#7affc8"


def figure(p, x, y, h=1.75, skin=SKIN, top="#6a6a70", legs="#34343c", arms_up=0.0, lean=0.0, head_turn=0.0):
    """A plain standing person from smooth parts, feet at z = 0, facing -Y."""
    k = h / 1.75
    for s in (-1, 1):
        p.tube([(x + s * 0.09 * k, y, 0.05 * k), (x + s * 0.1 * k, y, 0.48 * k), (x + s * 0.1 * k, y + lean * 0.4, 0.9 * k)], 0.075 * k, legs, 6)
        p.ball(0.1 * k, (x + s * 0.1 * k, y - 0.06 * k, 0.05 * k), "#26242a", scale=(0.8, 1.5, 0.6), subdiv=1)
        hand = (x + s * (0.28 + arms_up * 0.14) * k, y + lean * 0.8, (0.78 + arms_up * 1.0) * k)
        p.tube([(x + s * 0.21 * k, y + lean, 1.42 * k), (x + s * (0.27 + arms_up * 0.1) * k, y + lean, (1.1 + arms_up * 0.5) * k), hand], 0.05 * k, top, 6)
        p.ball(0.055 * k, hand, skin, subdiv=1)
    p.lathe([(0.16 * k, 0.88 * k), (0.18 * k, 1.1 * k), (0.22 * k, 1.38 * k), (0.11 * k, 1.5 * k)], (x, y + lean, 0), top, segs=10)
    p.ball(0.115 * k, (x + head_turn * 0.04, y + lean * 1.2, 1.62 * k), skin, scale=(0.92, 1.0, 1.15), subdiv=2)


def blood_pool(p, x, y, r):
    p.ball(r, (x, y, 0.012), BLOOD, scale=(1.3, 1, 0.02), lumpy=0.25, subdiv=1)


# ------------------------------------------------------------ shared
def rail_track():
    p = Prop("rail_track", 400)
    # Ten metres of track laid along the direction of travel.
    for x in (-0.62, 0.62):
        p.box((0.09, 10.0, 0.11), (x, 0, 0.16), "#8a8a90", bevel=0.012)
    for i in range(14):
        p.box((1.9, 0.26, 0.1), (0, -4.65 + i * 0.715, 0.06), "#4a3626", bevel=0.015, wonk=0.02)
    p.export()


# ------------------------------------------------------------ Floor 4: the Endless Mall
def storefront():
    p = Prop("storefront", 401)
    # A shop front 14 m wide with its shutter stuck half way up. Something has been at the shutter from the inside.
    p.box((14, 0.5, 0.9), (0, 0, 5.3), "#e8e2d4", bevel=0.05)
    p.box((14.4, 0.8, 0.14), (0, -0.1, 4.8), "#a8a4a0", bevel=0.03)
    p.box((14.4, 0.8, 0.14), (0, -0.1, 5.8), "#a8a4a0", bevel=0.03)
    for x in (-7, -2.4, 2.4, 7):
        p.lathe([(0.34, 0), (0.28, 0.2), (0.25, 4.6), (0.3, 4.8)], (x, 0, 0), "#d8d0c0", segs=12)
    for x, w, shut in ((-4.7, 4.4, 1.8), (0, 4.4, 2.6), (4.7, 4.4, 0.7)):
        for i in range(int((4.7 - shut) / 0.17)):
            p.box((w, 0.05, 0.14), (x, 0.02, 4.68 - i * 0.17), "#9aa0a4", bevel=0.012)
        p.box((w, 0.1, 0.06), (x, -0.03, shut), "#5a5a60", bevel=0.01)
        p.box((w, 0.05, shut), (x, 0.3, shut / 2), "#14141a", bevel=0.0)
    # handprints and dents low on the shutters, the ground stained where something came under
    for i in range(16):
        p.ball(0.06, (p.rng.uniform(-6, 6), -0.03, p.rng.uniform(1.8, 3.2)), BLOOD, scale=(1, 0.04, 1.2), subdiv=1)
    for i in range(5):
        p.box((0.04, 0.02, p.rng.uniform(0.3, 1.1)), (p.rng.uniform(-6, 6), -0.03, 2.2), BLOOD, bevel=0.0)
    p.box((13.6, 0.12, 0.05), (0, -0.28, 4.9), "glow:#fff4d0", bevel=0.0)
    p.export()


def shop_dummy():
    p = Prop("shop_dummy", 413)
    # A proper shop dummy, smooth and pale and blank, with jointed limbs. No face. The head tilts a little more each time.
    figure(p, 0, 0, 1.82, "#e8e0d4", "#e8e0d4", "#e8e0d4", arms_up=0.04)
    for s in (-1, 1):
        p.ball(0.06, (s * 0.1, 0.0, 0.5), "#8a8680", subdiv=1)
        p.ball(0.05, (s * 0.28, 0.0, 1.14), "#8a8680", subdiv=1)
    p.ball(0.05, (0, 0, 1.52), "#8a8680", subdiv=1)
    p.box((0.26, 0.02, 0.14), (0, -0.2, 1.24), "#c8302a", rot=(0, 0.1, 0), bevel=0.0)
    p.cyl(0.26, 0.28, 0.04, (0, 0, 0.02), "#d8d8dc", segs=16)
    p.export()


def kiddie_ride():
    p = Prop("kiddie_ride", 402)
    # A coin-op horse. It runs without coins. It has been running for a long time, and the saddle is wet.
    p.lathe([(0.52, 0), (0.5, 0.14), (0.42, 0.2), (0.1, 0.24), (0.08, 0.5)], (0, 0, 0), "#d8302a", segs=16)
    p.ball(0.34, (0, 0, 0.92), "#f0ece0", scale=(0.72, 1.45, 0.82), subdiv=2)
    p.tube([(0, -0.34, 1.0), (0, -0.48, 1.3), (0, -0.54, 1.46)], 0.14, "#f0ece0", 8)
    p.ball(0.15, (0, -0.68, 1.48), "#f0ece0", scale=(0.74, 1.4, 0.8), subdiv=2)
    for s in (-1, 1):
        p.ball(0.045, (s * 0.1, -0.68, 1.56), "#0f0e12", subdiv=1)
        p.tube([(s * 0.05, -0.54, 1.62), (s * 0.06, -0.52, 1.74)], 0.03, "#f0ece0", 5)
        for f in (-1, 1):
            p.tube([(s * 0.16, f * 0.32, 0.8), (s * 0.18, f * 0.46, 0.5), (s * 0.18, f * 0.5, 0.28)], 0.06, "#f0ece0", 6)
    for i in range(6):
        p.tube([(0, -0.3 + i * 0.03, 1.5 - i * 0.07), (0.06, -0.26 + i * 0.03, 1.2 - i * 0.05)], 0.03, "#c8302a", 5)
    p.ball(0.2, (0, 0.05, 1.2), "#8a1410", scale=(1.1, 1.5, 0.3), subdiv=1)
    p.tube([(0, 0.4, 1.1), (0.04, 0.72, 0.95), (0, 0.8, 0.55)], 0.05, "#2a2a30", 6)
    p.box((0.34, 0.12, 0.5), (0, 0.52, 0.3), "#f5c518", bevel=0.03)
    p.box((0.05, 0.02, 0.14), (0, 0.45, 0.4), "#0f0e12", bevel=0.0)
    p.export()


def vein_patch():
    p = Prop("vein_patch", 403)
    # The Mall Mother's veins. They've come up through the tiles and they all run the same way.
    for i in range(6):
        pts, y, x = [], -5.0, (i - 2.5) * 0.9
        for j in range(8):
            pts.append((x + p.rng.uniform(-0.4, 0.4), y, 0.04 + p.rng.uniform(0, 0.05)))
            y += 1.45
        p.tube(pts, 0.09 + (i % 3) * 0.03, p.rng.choice(("#7a1c28", "#8a2432", "#6a1422")), 6)
        for b in range(3):
            q = pts[p.rng.randint(1, 6)]
            p.tube([q, (q[0] + p.rng.uniform(-1.3, 1.3), q[1] + p.rng.uniform(-0.7, 0.7), 0.03)], 0.035, "#7a1c28", 5)
    p.export()


def mall_heart():
    p = Prop("mall_heart", 404)
    # The landmark at the end of the veins, as big as a house, fused to a piece of escalator and a neon sign, and still going.
    p.ball(4.2, (0, 0, 4.6), "#94242e", scale=(1.0, 0.86, 1.12), lumpy=0.12, subdiv=3)
    p.ball(2.6, (1.6, -0.8, 6.8), "#a82e36", scale=(1, 0.8, 0.9), lumpy=0.1, subdiv=3)
    p.ball(2.4, (-1.9, 0.5, 2.2), "#7a1c28", scale=(1, 0.9, 1), lumpy=0.1, subdiv=3)
    for i, (a, b, r) in enumerate((((-1.4, 0.6, 8.4), (-2.2, 0.9, 11.6), 0.72), ((1.2, 0.8, 8.8), (2.8, 1.2, 11.4), 0.56), ((0.0, 1.2, 8.8), (-0.3, 2.6, 11.8), 0.46))):
        p.tube([a, ((a[0] + b[0]) / 2 + 0.3, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), b], r, "#7a3a5a" if i else "#3a5a8a", 10)
    for i in range(22):
        a = i * 2.3
        z = 1.0 + (i % 11) * 0.72
        r = 4.0 * math.sin(z / 9.0 * math.pi) + 0.2
        pts = [(math.cos(a) * r, math.sin(a) * r * 0.86 - 0.1, z)]
        for j in range(3):
            pts.append((pts[-1][0] + p.rng.uniform(-0.5, 0.5), pts[-1][1] + p.rng.uniform(-0.3, 0.3) - 0.12, pts[-1][2] + 0.7))
        p.tube(pts, 0.1, "#5a1420", 5)
    # the bits of the mall it took with it
    for i in range(10):
        p.box((3.0, 0.5, 0.18), (3.8 + i * 0.26, -3.0, 0.5 + i * 0.52), "#8a8a90", rot=(0, -0.8, 0.22), bevel=0.02)
    p.box((4.6, 0.3, 1.3), (-4.0, -3.0, 6.0), "#25233f", rot=(0.1, 0.5, 0.3), bevel=0.04)
    p.box((4.0, 0.1, 0.5), (-4.0, -3.2, 6.0), "glow:#ff4a9a", rot=(0.1, 0.5, 0.3), bevel=0.0)
    for i in range(8):
        a = i * TAU_8
        p.tube([(math.cos(a) * 3.2, math.sin(a) * 2.8, 1.1), (math.cos(a) * 5.0, math.sin(a) * 4.6, 0.3), (math.cos(a) * 7.4, math.sin(a) * 6.8, 0.08)], 0.32, "#7a1c28", 8)
    blood_pool(p, 0, 0, 7.0)
    p.export()


TAU_8 = math.tau / 8.0


def mannequin_skin():
    p = Prop("mannequin_skin", 405)
    # A shop dummy with its seams let out. There is somebody else's skin on it, and it fits well.
    figure(p, 0, 0, 1.82, "#d8b090", "#d8b090", "#d8b090", arms_up=0.1)
    for z in (0.95, 1.15, 1.32):
        p.box((0.3, 0.02, 0.012), (0, -0.2, z), "#3a1410", rot=(0, p.rng.uniform(-0.2, 0.2), 0), bevel=0.0)
    p.ball(0.03, (-0.04, -0.105, 1.66), "#0f0e12", subdiv=1)
    p.ball(0.03, (0.04, -0.105, 1.66), "#0f0e12", subdiv=1)
    p.box((0.09, 0.012, 0.018), (0, -0.112, 1.56), "#6e120e", bevel=0.0)
    p.cyl(0.26, 0.28, 0.04, (0, 0, 0.02), "#d8d8dc", segs=16)
    p.cyl(0.018, 0.018, 0.7, (0, 0.05, 0.4), CHROME, segs=6)
    p.export()


def santa_throne():
    p = Prop("santa_throne", 406)
    # Santa's Grotto, nine months out of season. The chair is empty. The presents have been left out a while.
    for i in range(4):
        p.box((6.6 - i * 1.0, 5.0 - i * 0.6, 0.3), (0, 0.8, 0.15 + i * 0.3), "#e8e8ec", bevel=0.08, wonk=0.04)
    p.box((2.2, 1.2, 0.5), (0, 1.3, 1.6), "#a81e22", bevel=0.1)
    p.box((2.2, 0.5, 3.2), (0, 2.0, 3.0), "#a81e22", bevel=0.14)
    for s in (-1, 1):
        p.box((0.36, 1.4, 0.9), (s * 1.28, 1.3, 2.1), "#a81e22", bevel=0.08)
    p.ball(0.34, (0, 2.0, 4.8), BRASS, subdiv=2)
    p.ball(0.72, (0.0, 1.0, 1.85), "#c81e22", scale=(1.0, 0.9, 0.2), subdiv=2)
    for i in range(9):
        p.box((0.06, 0.02, p.rng.uniform(0.3, 1.0)), (p.rng.uniform(-0.8, 0.8), 0.68, 1.4), BLOOD, bevel=0.0)
    for i in range(11):
        a = i * 0.57 - 2.8
        r = 4.0 + (i % 3) * 0.8
        s = p.rng.uniform(0.5, 0.95)
        c = p.rng.choice(("#2f7a3a", "#c8302a", "#e8c020", "#3a6ab0"))
        x, y = math.sin(a) * r, -math.cos(a) * r + 0.8
        p.box((s, s, s), (x, y, s / 2), c, rot=(0, 0, a), bevel=0.02)
        p.box((s + 0.02, 0.12, s + 0.02), (x, y, s / 2), "#f0ece0", rot=(0, 0, a), bevel=0.0)
        p.box((0.12, s + 0.02, s + 0.02), (x, y, s / 2), "#f0ece0", rot=(0, 0, a), bevel=0.0)
        if i % 2 == 0:
            p.box((0.06, 0.02, s * 0.8), (x, y - s / 2, s * 0.4), BLOOD, rot=(0, 0, a), bevel=0.0)
            blood_pool(p, x, y - s * 0.55, 0.42)
    p.tube([(-3.4, 3.4, 0.1), (-3.5, 3.5, 5.2), (0, 3.4, 8.0), (3.5, 3.5, 5.2), (3.4, 3.4, 0.1)], 0.26, "#2f6a34", 8)
    for i in range(16):
        t = i / 15
        x = -3.4 + 6.8 * t
        z = 5.2 + 2.8 * math.sin(t * math.pi) + (0 if 0.12 < t < 0.88 else -3.0 * abs(0.5 - t))
        p.ball(0.09, (x, 3.2, z), p.rng.choice(("glow:#ff5a4a", "glow:#ffd84a", "glow:#5affa0")), subdiv=1)
    p.export()


def tray_mound():
    p = Prop("tray_mound", 407)
    # A hill of food-court trays. Most of the meals were finished. Not all of what's on the trays is food.
    for i in range(60):
        a = i * 2.4
        ring = (i % 18) / 18
        r = (1 - ring) * 4.2 + 0.3
        x, y, z = math.cos(a) * r, math.sin(a) * r, ring * 2.8 + 0.1
        p.box((0.8, 0.56, 0.05), (x, y, z), p.rng.choice(("#c8302a", "#e8882a", "#3a8aa0", "#b0b0b0")), rot=(p.rng.uniform(-0.5, 0.5), p.rng.uniform(-0.5, 0.5), a), bevel=0.012)
        if i % 4 == 0:
            p.cyl(0.08, 0.1, 0.24, (x + 0.1, y, z + 0.14), "#f0ece0", segs=8)
        if i % 7 == 0:
            p.ball(0.12, (x - 0.1, y, z + 0.1), BONE, scale=(0.9, 1, 1.1), subdiv=1)
    p.export()


def noodle_tentacle():
    p = Prop("noodle_tentacle", 408)
    # A grease-slick tentacle of noodles coming up through a floor drain. It knows there's someone nearby.
    p.cyl(0.9, 0.95, 0.08, (0, 0, 0.04), "#3a3a40", segs=18)
    for i in range(9):
        a = i * 0.7
        pts = [(math.cos(a) * 0.36, math.sin(a) * 0.36, 0.0), (math.cos(a) * 0.3, math.sin(a) * 0.3, 1.6), (math.cos(a) * 0.5 - 0.4, math.sin(a) * 0.4, 3.0), (math.cos(a) * 0.5 - 1.4, math.sin(a) * 0.5 - 0.2, 3.8), (math.cos(a) * 0.3 - 2.3, math.sin(a) * 0.3 - 0.6, 3.2 + (i % 3) * 0.3)]
        p.tube(pts, 0.1, p.rng.choice(("#e8c878", "#d8b868", "#f0d088")), 7)
    for i in range(6):
        p.ball(0.28, (p.rng.uniform(-0.6, -0.2), p.rng.uniform(-0.2, 0.2), 1.0 + i * 0.5), "#c8a050", scale=(1, 1, 0.4), subdiv=1)
    p.ball(0.22, (-2.2, -0.65, 3.3), "#e8e0d0", subdiv=2)
    p.ball(0.1, (-2.26, -0.84, 3.32), "#0f0e12", subdiv=1)
    blood_pool(p, 0.4, 0.2, 1.5)
    p.export()


def mall_train():
    p = Prop("mall_train", 409)
    # The kiddie train that does the rounds of the concourse. You ride up front. The back carriage stays full.
    p.box((1.5, 1.8, 0.7), (0, 0.7, 0.75), "#d8302a", bevel=0.12)
    p.box((1.3, 0.12, 0.42), (0, -0.2, 1.3), "#f5c518", bevel=0.05)
    p.lathe([(0.42, 0), (0.42, 0.9), (0.46, 1.0), (0.42, 1.04)], (0, -1.1, 0.42), "#2f6ab0", segs=16, rot=(math.pi / 2, 0, 0))
    p.ball(0.42, (0, -1.1, 0.84), "#2f6ab0", scale=(1, 0.6, 1), subdiv=2)
    p.lathe([(0.1, 0), (0.1, 0.6), (0.26, 0.82), (0.26, 0.98), (0.08, 0.98)], (0, -1.3, 1.2), DARK, segs=12)
    for e in (-1, 1):
        p.ball(0.15, (e * 0.2, -1.62, 0.98), "#f8f4e8", subdiv=2)
        p.ball(0.07, (e * 0.2, -1.74, 0.98), "#0f0e12", subdiv=1)
    p.tube([(-0.24, -1.64, 0.68), (0, -1.72, 0.58), (0.24, -1.64, 0.68)], 0.03, "#0f0e12", 6)
    for s in (-1, 1):
        p.box((0.06, 2.8, 0.1), (s * 0.62, -0.1, 0.32), BRASS, bevel=0.01)
        for y in (-1.1, 0.0, 1.1):
            p.cyl(0.26, 0.26, 0.1, (s * 0.72, y, 0.26), "#1b1a1f", rot=(0, math.pi / 2, 0), segs=14)
            p.cyl(0.14, 0.14, 0.12, (s * 0.72, y, 0.26), "#f5c518", rot=(0, math.pi / 2, 0), segs=10)
    p.box((1.46, 1.3, 1.0), (0, 3.0, 0.85), "#3a8aa0", bevel=0.12)
    p.tube([(0, 1.6, 0.5), (0, 2.34, 0.5)], 0.05, DARK, 5)
    for s in (-1, 1):
        figure(p, s * 0.32, 3.0, 1.1, "#d8c8b8", "#7a4a6a", "#34343c", lean=0.0)
        for y in (2.4, 3.0, 3.6):
            p.cyl(0.26, 0.26, 0.1, (s * 0.72, y, 0.26), "#1b1a1f", rot=(0, math.pi / 2, 0), segs=14)
    p.export()


def cctv_pole():
    p = Prop("cctv_pole", 410)
    # Mall security's cameras. Origin at the head so it can turn on its own; the post is added at the base.
    p.box((0.28, 0.72, 0.26), (0, -0.2, 0), "#e8e4dc", bevel=0.05)
    p.cyl(0.11, 0.11, 0.14, (0, -0.62, 0), DARK, rot=(math.pi / 2, 0, 0), segs=12)
    p.ball(0.08, (0, -0.68, 0), "glow:#ff3a2a", subdiv=1)
    p.cyl(0.04, 0.04, 0.18, (0, 0, -0.2), "#6a6a70", segs=8)
    p.export()


def photo_booth():
    p = Prop("photo_booth", 411)
    # Four poses, one pound. The strip is still in the slot. The stool's been wound right down, for someone with no legs.
    p.box((2.2, 1.3, 2.3), (0, 0, 1.15), "#3a6ab0", bevel=0.05)
    p.box((1.0, 0.04, 1.9), (0.45, -0.67, 1.1), "#14141a", bevel=0.0)
    for i in range(7):
        p.box((0.14, 0.05, 1.5), (0.03 + i * 0.14, -0.7, 1.25), "#a81e22", bevel=0.01)
    p.box((0.7, 0.06, 0.9), (-0.65, -0.68, 1.4), "#efe6d0", bevel=0.01)
    for i in range(4):
        y = 1.72 - i * 0.22
        p.box((0.14, 0.02, 0.18), (-0.84, -0.72, y), "#2a2a34", bevel=0.0)
        p.ball(0.05, (-0.84, -0.73, y + 0.02), BONE if i else SKIN, subdiv=1)
    for i in range(4):
        p.box((0.04, 0.02, 0.5), (0.6 + i * 0.08, -0.72, 0.28), BLOOD, bevel=0.0)
    p.box((0.2, 0.02, 0.38), (-0.2, -0.68, 1.1), "#f5c518", bevel=0.0)
    p.export()


def teeth_fountain():
    p = Prop("teeth_fountain", 412)
    # The wishing fountain. People threw in what they had left.
    p.lathe([(5.0, 0), (5.2, 0.5), (4.9, 0.72), (4.5, 0.62), (4.4, 0.2), (0.001, 0.18)], (0, 0, 0), "#e0d8c8", segs=30)
    p.cyl(4.45, 4.45, 0.04, (0, 0, 0.42), "#8a1c1c", segs=30)
    p.lathe([(0.9, 0.3), (0.7, 1.0), (0.3, 1.6), (0.26, 2.6), (1.5, 3.2), (1.7, 3.5), (1.4, 3.42), (0.2, 3.2), (0.16, 4.3), (0.5, 4.6), (0.001, 4.9)], (0, 0, 0), "#e8e0d0", segs=18)
    for i in range(260):
        a, r = p.rng.uniform(0, math.tau), math.sqrt(p.rng.uniform(0.04, 1)) * 4.3
        p.lathe([(0.03, 0), (0.038, 0.03), (0.024, 0.08)], (math.cos(a) * r, math.sin(a) * r, 0.43), "#f4f0e0", segs=5)
    for i in range(10):
        a = i * math.tau / 10
        p.tube([(math.cos(a) * 1.6, math.sin(a) * 1.6, 3.44), (math.cos(a) * 2.7, math.sin(a) * 2.7, 2.2), (math.cos(a) * 3.2, math.sin(a) * 3.2, 0.5)], 0.035, "#a81e1e", 5)
    p.export()


def caves_f4_f6():
    # Floor 4: the service ducts behind the shops, gone soft and pink, like the inside of something.
    build_cave("cave_f4", [((0, 0, 3), (7, 7, 5)), ((24, 10, 0), (10, 9, 6)), ((50, 2, -2), (9, 9, 6)), ((68, 26, -5), (12, 11, 8)), ((42, 44, -7), (10, 9, 6)), ((12, 40, -6), (13, 12, 9))], [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 1)], "#a85a64", tube_r=3.4, strength=2.2)
    # Floor 5: storm drains under Suburbia. Clean, round and endless, until the end.
    build_cave("cave_f5", [((0, 0, 3), (6, 6, 4.4)), ((-30, 0, 1), (7, 7, 5)), ((-60, 10, -1), (7, 7, 5)), ((-60, 44, -3), (8, 8, 5)), ((-28, 56, -4), (9, 9, 6)), ((6, 44, -5), (14, 13, 9))], [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5)], "#6a7078", tube_r=3.0, strength=0.5)
    # Floor 6: inside the roots. Woody and close, opening into a hollow lit by what grows there.
    build_cave("cave_f6", [((0, 0, 3), (7, 7, 5)), ((-20, -18, 0), (9, 8, 6)), ((-46, -20, -3), (11, 10, 7)), ((-60, -46, -6), (9, 9, 6)), ((-32, -62, -8), (16, 14, 10)), ((-6, -44, -5), (8, 8, 5))], [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 1)], "#4a3626", tube_r=3.3, strength=3.0)


# ------------------------------------------------------------ Floor 5: Suburbia Infinite
def lawn_family():
    p = Prop("lawn_family", 430)
    # The Hendersons. They'd love to meet you. They've been out here waving since the street was built, and they are hollow.
    for x, h, top, legs, arm in ((-0.8, 1.84, "#3a5a8a", "#6a6a70", 1.0), (0.05, 1.68, "#d86a8a", "#e8e0d0", 0.2), (0.7, 1.22, "#e8c020", "#3a5a8a", 1.0), (1.2, 0.98, "#6ac870", "#34343c", 0.2)):
        figure(p, x, 0, h, "#f0c8a8", top, legs, arms_up=arm)
        k = h / 1.75
        for s in (-1, 1):
            p.ball(0.022 * k, (x + s * 0.042 * k, -0.105 * k, 1.66 * k), "#0f0e12", subdiv=1)
        p.tube([(x - 0.06 * k, -0.1 * k, 1.56 * k), (x, -0.112 * k, 1.53 * k), (x + 0.06 * k, -0.1 * k, 1.56 * k)], 0.008, "#0f0e12", 4)
        p.ball(0.12 * k, (x, 0.02 * k, 1.72 * k), "#5a3a22", scale=(1.02, 1.0, 0.72), subdiv=1)
    p.export()


def bbq_grill():
    p = Prop("bbq_grill", 431)
    # Dad's famous barbecue, still going, nobody at it. Those are burgers. Those are mostly burgers.
    p.ball(0.56, (0, 0, 0.98), "#1b1a1f", scale=(1.25, 0.8, 0.5), subdiv=2)
    p.cyl(0.66, 0.66, 0.05, (0, 0, 1.1), "#6a6a70", segs=20)
    p.ball(0.5, (0, 0.46, 1.3), "#1b1a1f", scale=(1.3, 0.3, 0.7), subdiv=2)
    for s in (-1, 1):
        for f in (-1, 1):
            p.cyl(0.03, 0.03, 0.8, (s * 0.42, f * 0.3, 0.4), CHROME, segs=7)
    p.box((1.8, 0.5, 0.05), (0, 0, 0.72), "#6a6a70", bevel=0.01)
    for i, (x, y) in enumerate(((-0.34, -0.14), (0.0, -0.22), (0.3, -0.1), (-0.14, 0.14), (0.24, 0.2))):
        p.cyl(0.11, 0.11, 0.05, (x, y, 1.16), "#3a1a10", segs=9)
    # a hand on the grill, fingers curled
    p.ball(0.07, (-0.42, 0.18, 1.17), "#8a4a38", scale=(1.1, 1.3, 0.5), subdiv=1)
    for i in range(4):
        p.tube([(-0.47 + i * 0.03, 0.1, 1.17), (-0.48 + i * 0.03, 0.0, 1.19), (-0.47 + i * 0.03, -0.05, 1.16)], 0.016, "#7a3a2a", 4)
    p.ball(0.012, (0, 0, 1.3), "#2a2a2a", subdiv=1)
    p.box((0.34, 0.03, 0.5), (0.9, -0.1, 0.92), "#efe6d0", rot=(0.2, 0.1, 0), bevel=0.0)
    p.export()


def swing_set():
    p = Prop("swing_set", 432)
    # Empty swings. Origin at the top bar, so they can all sway together when there's no wind.
    for s in (-1, 1):
        p.cyl(0.05, 0.05, 2.4, (s * 1.8, 0, -1.1), "#d8302a", segs=8, rot=(0.0, 0, 0))
    for x in (-0.9, 0.9):
        for s in (-1, 1):
            p.tube([(x + s * 0.24, 0, 0), (x + s * 0.24, -0.05, -1.75)], 0.008, CHROME, 4)
        p.box((0.56, 0.16, 0.03), (x, -0.06, -1.76), "#1b1a1f", bevel=0.005)
    p.cyl(0.055, 0.055, 3.8, (0, 0, 0), "#3a6ab0", rot=(0, math.pi / 2, 0), segs=8)
    p.export()


def swing_frame():
    p = Prop("swing_frame", 433)
    for s in (-1, 1):
        for f in (-1, 1):
            p.tube([(s * 1.9, 0, 2.4), (s * 1.95, f * 0.8, 0)], 0.05, "#d8302a", 7)
    blood_pool(p, 0.9, 0.0, 0.5)
    p.export()


def red_pool():
    p = Prop("red_pool", 434)
    # The above-ground pool. The filter's still running, and there's a child's float going round and round.
    p.lathe([(3.3, 0), (3.34, 1.1), (3.42, 1.15), (3.42, 1.22), (3.2, 1.2), (3.16, 0.1), (0.001, 0.08)], (0, 0, 0), "#3a8ad0", segs=28)
    p.cyl(3.18, 3.18, 0.04, (0, 0, 1.02), "#8a1410", segs=28)
    p.lathe([(0.5, 0), (0.62, 0.1), (0.5, 0.2), (0.38, 0.1), (0.5, 0)], (1.2, 0.4, 1.0), "#f5c518", segs=14)
    p.ball(0.4, (-1.0, -0.8, 1.1), "#e8d8c8", scale=(1.5, 0.8, 0.26), subdiv=2)
    p.box((1.2, 0.5, 0.12), (-1.4, -0.8, 1.08), "#6a4a8a", bevel=0.03)
    for s in (-1, 1):
        p.tube([(3.5, s * 0.3, 0), (3.5, s * 0.3, 1.7)], 0.03, CHROME, 5)
        p.tube([(3.5, s * 0.3, 1.7), (3.2, s * 0.3, 1.9), (3.0, s * 0.3, 1.5)], 0.03, CHROME, 5)
    for z in (0.4, 0.8, 1.2):
        p.cyl(0.03, 0.03, 0.66, (3.5, 0, z), CHROME, rot=(math.pi / 2, 0, 0), segs=5)
    p.export()


def gnome():
    p = Prop("gnome", 435)
    # A garden gnome. They are all facing you. They were not facing you.
    p.lathe([(0.11, 0), (0.13, 0.08), (0.12, 0.24), (0.07, 0.34)], (0, 0, 0), "#3a6ab0", segs=10)
    p.ball(0.085, (0, 0, 0.4), "#f0c8a8", subdiv=2)
    p.lathe([(0.092, 0), (0.05, 0.14), (0.001, 0.32)], (0, 0, 0.44), "#c8302a", segs=10)
    p.ball(0.075, (0, -0.05, 0.34), "#f4f0e8", scale=(0.9, 0.6, 1.2), subdiv=1)
    for s in (-1, 1):
        p.ball(0.012, (s * 0.03, -0.08, 0.43), "glow:#ff3a2a", subdiv=0)
    p.export()


def gnome_altar():
    p = Prop("gnome_altar", 436)
    # Where the cult meets. Their Pope speaks from here. There is a mailbox at the top with a family's name on it.
    for i in range(5):
        p.lathe([(6.0 - i * 1.1, 0), (6.0 - i * 1.1, 0.34), (5.8 - i * 1.1, 0.36), (0.001, 0.36)], (0, 0, i * 0.36), "#6a6a70", segs=26)
    p.lathe([(0.6, 0), (0.7, 0.3), (0.62, 1.8), (0.36, 2.4)], (0, 0, 1.8), "#3a6ab0", segs=14)
    p.ball(0.5, (0, 0, 4.5), "#f0c8a8", subdiv=2)
    p.lathe([(0.56, 0), (0.3, 0.9), (0.001, 2.2)], (0, 0, 4.8), "#c8302a", segs=14)
    p.ball(0.46, (0, -0.28, 4.05), "#f4f0e8", scale=(0.9, 0.6, 1.3), subdiv=2)
    for s in (-1, 1):
        p.ball(0.08, (s * 0.18, -0.44, 4.62), "glow:#ff3a2a", subdiv=1)
    for i in range(8):
        a = i * TAU_8
        figure(p, math.cos(a) * 5.0, math.sin(a) * 5.0, 1.75, "#c8a890", "#6a6a70", "#34343c", arms_up=0.9)
        p.ball(0.2, (math.cos(a) * 5.0, math.sin(a) * 5.0, 1.05), BLOOD, scale=(1, 1, 0.6), subdiv=1)
    p.tube([(0, 0, 0), (0, 0, 1.8)], 0.3, "#6a6a70", 8)
    p.export()


def water_tower():
    p = Prop("water_tower", 437)
    # SMILEY PINES, WATER TOWER. You can see it from everywhere. It can see you too.
    for i in range(6):
        a = i * math.tau / 6
        p.tube([(math.cos(a) * 5.4, math.sin(a) * 5.4, 0), (math.cos(a) * 4.0, math.sin(a) * 4.0, 16.5)], 0.22, "#c8c8c8", 8)
        b = a + math.tau / 6
        for z, r in ((5.0, 5.0), (10.0, 4.5)):
            p.tube([(math.cos(a) * r, math.sin(a) * r, z), (math.cos(b) * r, math.sin(b) * r, z)], 0.09, "#c8c8c8", 6)
    p.tube([(0, 0, 0), (0, 0, 16.5)], 0.4, "#b0b0b0", 8)
    p.lathe([(0.8, 15.5), (4.6, 17.4), (6.2, 19.6), (6.4, 22), (5.6, 24.6), (3.2, 26.6), (0.001, 27.4)], (0, 0, 0), "#f4f1e8", segs=28)
    p.lathe([(0.3, 27.2), (0.14, 28.6)], (0, 0, 0), "#b0b0b0", segs=10)
    # the painted face has been added to
    p.ball(1.9, (0, -5.6, 21.6), "#f8f4e8", scale=(1.1, 0.25, 1.0), subdiv=3)
    p.ball(0.92, (0, -5.98, 21.6), "#7ab0c0", scale=(1, 0.14, 1), subdiv=2)
    p.ball(0.44, (0, -6.12, 21.6), "#0f0e12", scale=(1, 0.14, 1), subdiv=2)
    for i in range(8):
        a = -1.2 + i * 0.35
        p.box((0.14, 0.02, p.rng.uniform(0.8, 3.2)), (math.sin(a) * 1.5, -5.92, 19.0), BLOOD, bevel=0.0)
    p.export()


def abandoned_mower():
    p = Prop("abandoned_mower", 438)
    # Left running, with a neat stripe behind it. The grass bag's full, and dark.
    p.box((0.56, 0.7, 0.2), (0, 0, 0.26), "#c8302a", bevel=0.05)
    p.cyl(0.14, 0.17, 0.24, (0, 0.04, 0.46), DARK, segs=10)
    for s in (-1, 1):
        for y in (-0.3, 0.3):
            p.cyl(0.1, 0.1, 0.05, (s * 0.31, y, 0.1), RUBBER, rot=(0, math.pi / 2, 0), segs=10)
        p.tube([(s * 0.2, 0.3, 0.3), (s * 0.24, 0.9, 0.9), (s * 0.24, 1.0, 1.04)], 0.016, CHROME, 5)
    p.cyl(0.015, 0.015, 0.48, (0, 1.0, 1.04), RUBBER, rot=(0, math.pi / 2, 0), segs=5)
    p.ball(0.32, (0, 0.72, 0.36), "#3a1a14", scale=(0.9, 1.2, 0.9), lumpy=0.1, subdiv=2)
    blood_pool(p, 0, -0.1, 0.55)
    p.export()


def power_pole():
    p = Prop("power_pole", 439)
    # A pole every sixty metres down every street, with the same poster stapled to all of them.
    p.cyl(0.14, 0.11, 9.0, (0, 0, 4.5), "#5a4030", segs=9)
    for z in (8.6, 7.8):
        p.box((2.4, 0.12, 0.14), (0, 0, z), "#4a3428", bevel=0.01)
        for x in (-1.0, -0.4, 0.4, 1.0):
            p.cyl(0.03, 0.04, 0.16, (x, 0, z + 0.14), "#6a8a90", segs=6)
    p.cyl(0.26, 0.26, 0.7, (0.3, 0.2, 7.0), "#7a7a80", segs=10)
    p.box((0.42, 0.02, 0.6), (0, -0.14, 1.75), "#f0e8c8", rot=(0.02, 0.05, 0), bevel=0.0)
    p.ball(0.1, (0, -0.16, 1.82), "#2a2a34", scale=(0.9, 0.1, 1.1), subdiv=1)
    p.box((0.3, 0.012, 0.09), (0, -0.16, 1.98), "#c81a14", bevel=0.0)
    p.export()


def golf_cart():
    p = Prop("golf_cart", 440)
    # The HOA's patrol cart. It has a clipboard, a flashing light and a quota. The floor is at z = 0.2; you stand in the back.
    p.box((1.3, 2.5, 0.32), (0, 0, 0.42), "#f4f1e8", bevel=0.09)
    p.box((1.2, 0.9, 0.44), (0, -0.85, 0.72), "#f4f1e8", bevel=0.14)
    p.box((1.2, 0.3, 0.5), (0, 0.5, 0.88), "#c8c4b4", bevel=0.08)
    p.box((1.2, 0.55, 0.12), (0, 0.15, 0.74), "#3a5a4a", bevel=0.04)
    for s in (-1, 1):
        for y in (-0.8, 0.8):
            p.cyl(0.24, 0.24, 0.16, (s * 0.62, y, 0.24), RUBBER, rot=(0, math.pi / 2, 0), segs=14)
            p.cyl(0.1, 0.1, 0.18, (s * 0.62, y, 0.24), CHROME, rot=(0, math.pi / 2, 0), segs=8)
        p.tube([(s * 0.56, -0.55, 0.9), (s * 0.54, -0.5, 1.9)], 0.024, CHROME, 5)
        p.tube([(s * 0.56, 0.6, 1.1), (s * 0.54, 0.6, 1.9)], 0.024, CHROME, 5)
        p.ball(0.08, (s * 0.38, -1.3, 0.56), "glow:#fff4d0", subdiv=1)
    p.box((1.36, 1.5, 0.07), (0, 0.04, 1.94), "#f4f1e8", bevel=0.03)
    p.box((1.1, 0.03, 0.52), (0, -0.55, 1.36), "#b8d8e0", rot=(-0.14, 0, 0), bevel=0.0)
    p.cyl(0.1, 0.1, 0.14, (0, 0.1, 2.04), "glow:#ffb030", segs=10)
    p.cyl(0.17, 0.17, 0.03, (-0.28, -0.44, 1.02), RUBBER, rot=(-1.0, 0, 0), segs=12)
    p.box((0.3, 0.4, 0.02), (0.3, -0.5, 1.02), "#efe6d0", rot=(-0.4, 0, 0), bevel=0.0)
    p.export()


def red_sprinkler():
    p = Prop("red_sprinkler", 441)
    p.cyl(0.05, 0.06, 0.2, (0, 0, 0.1), BRASS, segs=8)
    p.tube([(-0.3, 0, 0.3), (0, 0, 0.26), (0.3, 0, 0.32)], 0.02, BRASS, 5)
    for i in range(14):
        a = i * 0.45
        r = 0.8 + i * 0.26
        p.ball(0.16 + (i % 3) * 0.1, (math.cos(a) * r, math.sin(a) * r, 0.015), BLOOD, scale=(1.2, 1, 0.03), subdiv=1)
    p.export()


def lawn_grave():
    p = Prop("lawn_grave", 442)
    # A very neat rectangle of new turf with a very neat little sign. You may have seen one in your own garden.
    p.box((1.1, 2.3, 0.1), (0, 0, 0.05), "#4a7a34", bevel=0.05, wonk=0.04)
    p.cyl(0.018, 0.018, 0.6, (0, -1.3, 0.3), "#f4f1e8", segs=5)
    p.box((0.4, 0.02, 0.26), (0, -1.3, 0.62), "#f4f1e8", bevel=0.0)
    p.box((0.3, 0.012, 0.03), (0, -1.32, 0.66), "#c81a14", bevel=0.0)
    p.box((0.22, 0.012, 0.03), (0, -1.32, 0.6), "#2a2a34", bevel=0.0)
    p.ball(0.08, (0.35, 0.6, 0.12), "#e8c8a8", scale=(1, 1.3, 0.5), subdiv=1)
    for i in range(4):
        p.tube([(0.31 + i * 0.03, 0.72, 0.11), (0.3 + i * 0.03, 0.85, 0.2)], 0.015, "#e8c8a8", 4)
    p.export()


# ------------------------------------------------------------ Floor 6: the Canopy
def root_arch():
    p = Prop("root_arch", 450)
    # A root as thick as a bus, looping out of the ground and back in. Paths go under them. So do other things.
    pts = [(-9, 0, -0.5), (-7.5, 0.5, 2.5), (-4, 1.0, 5.5), (0, 0.4, 6.8), (4, -0.6, 5.5), (7.5, -0.4, 2.5), (9, 0, -0.5)]
    p.tube(pts, 1.25, BARK, 12)
    for off in (0.7, -0.8):
        p.tube([(a, b + off, c - 0.5 if c > 0 else c) for a, b, c in pts[1:-1]], 0.4, "#3a2a1c", 8)
    for i in range(12):
        a, b, c = pts[1 + i % 5]
        p.ball(0.5, (a + p.rng.uniform(-0.7, 0.7), b - 0.9, c + p.rng.uniform(-1, 1)), "#3e6a34", scale=(1.4, 0.3, 1), lumpy=0.2, subdiv=1)
    for i in range(9):
        a, b, c = pts[2 + i % 3]
        z = max(c - 1.2, 1.6)
        p.tube([(a + i * 0.1, b, z), (a + i * 0.1, b - 0.1, z - p.rng.uniform(1.0, 2.6))], 0.024, "#3a5a34", 4)
    p.ball(0.08, (-1.0, -0.8, 5.4), GLOW_GREEN, subdiv=1)
    p.ball(0.06, (1.6, -1.3, 5.2), GLOW_GREEN, subdiv=1)
    p.export()


def jungle_tree():
    p = Prop("jungle_tree", 451)
    # A canopy trunk with buttress roots, in place of the plain trunks. The hunters' nails are still in the bark.
    p.lathe([(3.0, 0), (2.2, 0.8), (1.6, 2.4), (1.4, 8), (1.3, 22), (1.1, 44)], (0, 0, 0), BARK, segs=14)
    for i in range(7):
        a = i * math.tau / 7 + 0.3
        p.tube([(math.cos(a) * 1.4, math.sin(a) * 1.4, 4.0), (math.cos(a) * 2.6, math.sin(a) * 2.6, 1.5), (math.cos(a) * 4.8, math.sin(a) * 4.8, -0.2)], 0.45, "#3e2c1e", 8)
    for i in range(9):
        a, z = i * 2.1, 3 + i * 3.2
        p.ball(0.8, (math.cos(a) * 1.35, math.sin(a) * 1.35, z), "#3e6a34", scale=(1, 0.3, 1.5), lumpy=0.3, subdiv=1)
    for i in range(5):
        a, z = i * 1.7 + 0.8, 2.5 + i * 5
        p.ball(0.06, (math.cos(a) * 1.5, math.sin(a) * 1.5, z), GLOW_GREEN, subdiv=1)
        p.lathe([(0.36, 0), (0.42, 0.06), (0.001, 0.14)], (math.cos(a) * 1.72, math.sin(a) * 1.72, z - 0.3), "#c8a860", segs=10)
    p.export()


def trophy_board():
    p = Prop("trophy_board", 452)
    # A polished shield with a brass plate and a head on it, nailed to a tree or a post. "Season Three." He looks surprised.
    p.box((0.9, 0.08, 1.1), (0, 0.04, 2.6), "#6a3a20", bevel=0.03)
    p.lathe([(0.42, 0), (0.44, 0.04), (0.36, 0.08)], (0, 0, 2.6), "#7a4a2a", segs=16, rot=(math.pi / 2, 0, 0))
    p.ball(0.15, (0, -0.2, 2.72), "#c8a890", scale=(0.92, 1.05, 1.18), subdiv=2)
    for s in (-1, 1):
        p.ball(0.036, (s * 0.06, -0.33, 2.78), "#f4f0e8", subdiv=1)
        p.ball(0.018, (s * 0.06, -0.36, 2.78), "#0f0e12", subdiv=0)
    p.ball(0.05, (0, -0.33, 2.62), "#3a1a14", scale=(1.2, 0.6, 1.3), subdiv=1)
    p.ball(0.17, (0, -0.18, 2.82), "#3a2a1c", scale=(1.02, 1, 0.75), subdiv=1)
    p.cyl(0.12, 0.13, 0.22, (0, -0.14, 2.5), "#a8483a", rot=(1.2, 0, 0), segs=9)
    p.box((0.44, 0.02, 0.12), (0, -0.04, 2.26), BRASS, bevel=0.0)
    for i in range(4):
        p.box((0.03, 0.012, p.rng.uniform(0.2, 0.6)), (p.rng.uniform(-0.3, 0.3), -0.04, 2.0), BLOOD, bevel=0.0)
    p.cyl(0.07, 0.09, 3.1, (0, 0.14, 1.5), "#4a3020", segs=8)
    p.export()


def net_cocoon():
    p = Prop("net_cocoon", 453)
    # A hunter's net, hauled up and left. Origin where the rope leaves the branch, so it can turn. It's still moving a bit.
    p.tube([(0, 0, 0), (0.02, 0, -3.4)], 0.018, "#b09a6a", 5)
    p.ball(0.62, (0, 0, -4.2), "#4a3c2a", scale=(0.9, 0.9, 1.2), lumpy=0.12, subdiv=2)
    for i in range(10):
        a = i * 0.63
        p.tube([(math.cos(a) * 0.1, math.sin(a) * 0.1, -3.45), (math.cos(a) * 0.62, math.sin(a) * 0.62, -4.0), (math.cos(a + 0.5) * 0.58, math.sin(a + 0.5) * 0.58, -4.5), (math.cos(a + 0.8) * 0.1, math.sin(a + 0.8) * 0.1, -5.0)], 0.012, "#b09a6a", 4)
    p.tube([(0.4, -0.44, -4.1), (0.62, -0.6, -4.6), (0.56, -0.62, -5.05)], 0.05, "#c8a890", 6)
    p.ball(0.05, (0.56, -0.62, -5.1), "#c8a890", subdiv=1)
    for i in range(3):
        p.box((0.015, 0.015, 0.24), (0.56, -0.62, -5.3 - i * 0.2), BLOOD, bevel=0.0)
    p.export()


def flytrap():
    p = Prop("flytrap", 454)
    # A Venus flytrap taller than you are, one head shut. It leans toward whatever's warm.
    for i in range(7):
        a = i * 0.9
        p.tube([(0, 0, 0), (math.cos(a) * 0.8, math.sin(a) * 0.8, 0.3), (math.cos(a) * 1.6, math.sin(a) * 1.6, 0.14)], 0.1, LEAF, 7)
    p.tube([(0, 0, 0), (0.1, -0.1, 1.2), (0.0, -0.4, 2.4), (0, -0.6, 2.6)], 0.11, LEAF, 8)
    for s in (-1, 1):
        p.ball(0.8, (0, -0.95, 2.72 + s * 0.28), "#6ac060", scale=(1.0, 1.0, 0.24), rot=(s * 0.32, 0, 0), subdiv=2)
        p.ball(0.72, (0, -1.0, 2.72 + s * 0.2), "#a8263a", scale=(0.96, 0.96, 0.15), rot=(s * 0.32, 0, 0), subdiv=2)
        for i in range(11):
            a = i * 0.28 - 1.4
            q = (math.sin(a) * 0.78, -0.95 - math.cos(a) * 0.78, 2.72 + s * 0.05)
            p.tube([q, (q[0] * 1.2, q[1] - 0.2, q[2] + s * -0.12)], 0.018, "#e8f0a0", 4)
    p.ball(0.14, (0.0, -1.8, 2.72), "#a8483a", scale=(1, 1, 0.6), subdiv=1)
    p.ball(0.3, (0, -0.2, 0.05), BLOOD, scale=(3, 2, 0.1), subdiv=1)
    p.export()


def pitcher():
    p = Prop("pitcher", 455)
    # A pitcher plant as big as a water butt, full to the lip. Looking in is a mistake.
    p.lathe([(0.2, 0), (0.7, 0.6), (0.92, 1.4), (0.74, 2.2), (0.58, 2.7), (0.74, 3.05), (0.66, 3.1), (0.5, 2.7), (0.001, 2.6)], (0, 0, 0), "#7a9a3a", segs=18)
    p.cyl(0.54, 0.54, 0.05, (0, 0, 2.62), "#a8c870", segs=16)
    p.ball(0.15, (0.12, -0.16, 2.68), BONE, scale=(0.9, 1, 1.1), subdiv=2)
    for s in (-1, 1):
        p.ball(0.03, (0.12 + s * 0.05, -0.27, 2.7), "#0f0e12", subdiv=1)
    p.tube([(-0.2, 0.1, 2.64), (-0.3, 0.2, 2.9), (-0.42, 0.22, 3.2)], 0.024, BONE, 5)
    for i in range(5):
        a = i * 1.3
        p.tube([(math.cos(a) * 0.7, math.sin(a) * 0.7, 0.8), (math.cos(a) * 1.1, math.sin(a) * 1.1, 0.26), (math.cos(a) * 1.6, math.sin(a) * 1.6, 0.04)], 0.1, LEAF_DARK, 6)
    p.ball(0.42, (0, 0.5, 3.3), "#a83a4a", scale=(1, 0.2, 0.7), rot=(-0.6, 0, 0), subdiv=2)
    p.export()


def bone_chimes():
    p = Prop("bone_chimes", 456)
    # Auntie Sludge's wind chimes. Origin at the branch, so they can sway. They clack when you're close, she says.
    p.cyl(0.03, 0.03, 1.1, (0, 0, -0.04), "#4a3020", rot=(0, math.pi / 2, 0), segs=6)
    for i in range(7):
        x = -0.48 + i * 0.16
        l = 0.8 + (i % 3) * 0.5
        p.tube([(x, 0, -0.06), (x, 0, -l)], 0.005, "#b09a6a", 3)
        p.tube([(x, 0, -l), (x, 0, -l - 0.34)], 0.022, BONE, 5)
        p.ball(0.036, (x, 0, -l), BONE, subdiv=1)
        p.ball(0.036, (x, 0, -l - 0.34), BONE, subdiv=1)
    p.ball(0.12, (0.0, 0, -1.9), BONE, scale=(0.9, 1, 1.1), subdiv=2)
    p.export()


def safari_jeep():
    p = Prop("safari_jeep", 457)
    # The hunters' jeep, with the bull bars, the roll cage, and the rack on the back for what they got. You stand in the bed.
    p.box((1.7, 3.8, 0.56), (0, 0, 0.82), "#7a7040", bevel=0.09)
    p.box((1.6, 1.2, 0.34), (0, -1.28, 1.2), "#7a7040", bevel=0.12)
    p.box((1.56, 0.08, 0.5), (0, -0.62, 1.46), "#a8c8d0", rot=(-0.1, 0, 0), bevel=0.0)
    for s in (-1, 1):
        for y in (-1.2, 1.2):
            p.cyl(0.42, 0.42, 0.3, (s * 0.84, y, 0.42), RUBBER, rot=(0, math.pi / 2, 0), segs=16)
            p.cyl(0.2, 0.2, 0.32, (s * 0.84, y, 0.42), "#5a5a60", rot=(0, math.pi / 2, 0), segs=10)
        p.tube([(s * 0.8, -0.56, 1.1), (s * 0.78, -0.3, 2.2), (s * 0.78, 1.6, 2.2), (s * 0.8, 1.8, 1.1)], 0.04, DARK, 6)
        p.ball(0.14, (s * 0.48, -1.92, 1.04), "glow:#ffe8a0", subdiv=2)
    for z in (0.5, 0.9, 1.3):
        p.cyl(0.03, 0.03, 1.7, (0, -2.08, z), CHROME, rot=(0, math.pi / 2, 0), segs=6)
    for s in (-1, 1):
        p.tube([(s * 0.7, -1.9, 0.4), (s * 0.72, -2.08, 0.9), (s * 0.7, -2.08, 1.36)], 0.03, CHROME, 5)
    p.box((1.7, 3.0, 0.03), (0, 0.5, 2.24), "#b09a6a", bevel=0.0)
    p.ball(0.5, (0, 1.5, 1.28), "#6a5a44", scale=(1.3, 0.9, 0.7), lumpy=0.1, subdiv=2)
    p.tube([(-0.5, 1.3, 1.2), (-0.8, 1.2, 1.1), (-1.0, 1.1, 0.6)], 0.05, "#c8a890", 6)
    p.box((0.04, 0.02, 0.6), (-1.0, 1.1, 0.26), BLOOD, bevel=0.0)
    p.export()


def totem_pole():
    p = Prop("totem_pole", 458)
    # The hunters built it as a joke, to look native on camera. The contestants' faces on it are a good likeness.
    for i in range(6):
        z = i * 1.5
        p.lathe([(0.62, 0), (0.7, 0.2), (0.7, 1.2), (0.6, 1.5)], (0, 0, z), p.rng.choice(("#a8683a", "#8a4a2a", "#6a3a20")), segs=14)
        p.ball(0.2, (0, -0.64, z + 0.7), "#d8b890", scale=(1.6, 0.5, 1.3), subdiv=1)
        for s in (-1, 1):
            p.ball(0.09, (s * 0.26, -0.7, z + 0.94), "#f4f0e8", subdiv=1)
            p.ball(0.045, (s * 0.26, -0.78, z + 0.94), "#0f0e12", subdiv=0)
        p.box((0.36, 0.05, 0.12 + (i % 3) * 0.1), (0, -0.7, z + 0.42), "#2a1a14", bevel=0.01)
    p.box((3.6, 0.5, 0.3), (0, 0, 8.3), "#8a4a2a", rot=(0, 0.1, 0), bevel=0.05)
    p.ball(0.24, (-1.6, -0.2, 8.6), BONE, subdiv=1)
    p.ball(0.24, (1.6, -0.2, 8.6), BONE, subdiv=1)
    p.export()


def photo_cutout():
    p = Prop("photo_cutout", 459)
    # A painted board with a face-hole, for tourists. HUNTER WITH TROPHY. Someone is standing on the other side of it.
    p.box((2.4, 0.1, 2.5), (0, 0, 1.45), "#c8a860", bevel=0.03)
    p.box((2.2, 0.03, 2.3), (0, -0.06, 1.45), "#6ac060", bevel=0.0)
    p.ball(0.5, (-0.4, -0.08, 1.0), "#c8a860", scale=(1, 0.05, 1.5), subdiv=1)
    p.ball(0.18, (-0.4, -0.08, 1.95), "#0f0e12", scale=(1, 0.03, 1.2), subdiv=1)
    p.ball(0.5, (0.6, -0.08, 0.76), "#a8483a", scale=(1.4, 0.05, 0.9), subdiv=1)
    p.ball(0.15, (-0.4, 0.04, 1.95), "#c8a890", scale=(0.9, 0.5, 1.1), subdiv=2)
    for s in (-1, 1):
        p.ball(0.022, (-0.4 + s * 0.06, -0.09, 1.98), "#f4f0e8", subdiv=1)
    for s in (-1, 1):
        p.cyl(0.05, 0.05, 1.3, (s * 1.0, 0.1, 0.65), "#4a3020", segs=6)
    p.export()


def glow_fern():
    p = Prop("glow_fern", 460)
    # Undergrowth, as thick as you like, with a dull light in the veins.
    for i in range(9):
        a = i * 0.7
        l = p.rng.uniform(0.9, 1.7)
        pts = [(0, 0, 0), (math.cos(a) * l * 0.4, math.sin(a) * l * 0.4, l * 0.7), (math.cos(a) * l, math.sin(a) * l, l * 0.5)]
        p.tube(pts, 0.022, LEAF if i % 2 else "#3a8a50", 4)
        p.ball(l * 0.44, ((pts[1][0] + pts[2][0]) / 2, (pts[1][1] + pts[2][1]) / 2, l * 0.62), LEAF_DARK if i % 2 else LEAF, scale=(1, 0.3, 0.1), rot=(0, 0, a), subdiv=1)
    p.ball(0.05, (0.1, 0.05, 0.5), GLOW_GREEN, subdiv=0)
    p.export()


def vine_curtain():
    p = Prop("vine_curtain", 461)
    # A curtain of hanging vines. Origin at the top, so it can stir. It's easier to walk through than to look at.
    for i in range(16):
        x = -2.6 + i * 0.34
        l = p.rng.uniform(4.0, 8.5)
        p.tube([(x, 0, 0), (x + p.rng.uniform(-0.2, 0.2), p.rng.uniform(-0.2, 0.2), -l * 0.6), (x + p.rng.uniform(-0.3, 0.3), 0, -l)], 0.02, "#3a5a34", 4)
        for j in range(4):
            p.ball(0.09, (x, 0, -l * (j + 1) / 5), LEAF, scale=(1, 0.3, 1.5), subdiv=1)
    p.ball(0.07, (0.5, 0, -6.0), GLOW_GREEN, subdiv=1)
    p.export()


def kennel():
    p = Prop("kennel", 462)
    # The wild kennel's runs: chain-link, a bowl with a name on it. All the names on the bowls are people's names.
    for x in (-1.6, 1.6):
        for y in (-1.6, 1.6):
            p.cyl(0.04, 0.04, 2.2, (x, y, 1.1), "#6a6a70", segs=7)
    for s, axis in ((-1, 0), (1, 0), (-1, 1)):
        for i in range(12):
            t = -1.6 + i * 0.29
            a = (t, s * 1.6, 0.05) if axis == 0 else (s * 1.6, t, 0.05)
            b = (t + 0.15, s * 1.6, 2.2) if axis == 0 else (s * 1.6, t + 0.15, 2.2)
            p.tube([a, b], 0.006, "#8a8a90", 3)
    p.lathe([(0.22, 0), (0.28, 0.1), (0.24, 0.1), (0.001, 0.02)], (0.6, 0.5, 0), CHROME, segs=12)
    p.tube([(1.4, 1.4, 0.1), (0.5, 0.8, 0.02), (-0.5, 0.2, 0.03)], 0.015, CHROME, 4)
    p.ball(0.28, (-0.6, 0.2, 0.15), BONE, scale=(1.3, 0.7, 0.5), lumpy=0.1, subdiv=1)
    blood_pool(p, -0.5, 0.3, 0.8)
    p.export()


BUILDERS = [
    rail_track, storefront, shop_dummy, kiddie_ride, vein_patch, mall_heart, mannequin_skin, santa_throne, tray_mound, noodle_tentacle, mall_train, cctv_pole, photo_booth, teeth_fountain,
    lawn_family, bbq_grill, swing_set, swing_frame, red_pool, gnome_altar, water_tower, abandoned_mower, power_pole, golf_cart, red_sprinkler, lawn_grave,
    root_arch, trophy_board, net_cocoon, flytrap, pitcher, bone_chimes, safari_jeep, totem_pole, photo_cutout, glow_fern, vine_curtain, kennel, caves_f4_f6,
]

if __name__ == "__main__":
    wanted = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    for build in BUILDERS:
        if wanted and getattr(build, "__name__", "") not in wanted:
            continue
        build()
    print("WILDS F4 F6 DONE")
