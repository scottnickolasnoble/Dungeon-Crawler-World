# Props for the land outside the towns on Floors 2 and 3, including their caves.
#   F:\Downstairs\Blender\blender.exe -b --python tools/blender/build_wilds_f2_f3.py
# Exports to godot/models/props/wilds/<name>.glb.
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_landing_kit as kit
from build_landing_kit import Prop, STEEL, DARK, CREAM, BRASS, WOOD, WOOD_DARK
from build_hero_props import loft, wheel

kit.OUT = os.path.join(os.path.dirname(kit.OUT), "wilds")
BONE = "#d8cfb4"
BLOOD = "#7a1410"
GORE = "#a8302a"
MEAT = "#b4504a"
RUBBER = "#1b1a1f"
CHROME = "#b8bcc0"


# ------------------------------------------------------------ Floor 2
def washer_red():
    p = Prop("washer_red", 301)
    # The same coin-op machine, except this one is full of something, and something is trying to get out.
    p.box((1.4, 1.36, 1.72), (0, 0, 0.92), "#d4d8d0", bevel=0.07)
    p.box((1.32, 1.28, 0.1), (0, 0, 1.82), "#c0c6c0", bevel=0.04)
    p.box((1.3, 1.26, 0.09), (0, 0, 0.05), "#26262c", bevel=0.02)
    p.box((1.32, 0.09, 0.38), (0, -0.7, 1.55), "#a8302a", bevel=0.025)
    for x in (0.08, 0.34):
        p.lathe([(0.075, 0), (0.055, 0.06), (0.001, 0.065)], (x, -0.74, 1.55), CHROME, segs=10, rot=(math.pi / 2, 0, 0))
    p.lathe([(0.56, 0), (0.6, 0.03), (0.6, 0.09), (0.52, 0.13), (0.44, 0.13), (0.42, 0.09)], (0, -0.68, 0.82), CHROME, segs=22, rot=(math.pi / 2, 0, 0))
    p.cyl(0.42, 0.42, 0.03, (0, -0.72, 0.82), "#8a1410", rot=(math.pi / 2, 0, 0), segs=20)
    # a hand pressed flat against the glass
    p.ball(0.11, (0.04, -0.75, 0.82), "#e8c8a8", scale=(1, 0.1, 1.1), subdiv=2)
    for i, (x, l) in enumerate(((-0.1, 0.13), (-0.03, 0.17), (0.04, 0.18), (0.11, 0.15))):
        p.box((0.045, 0.012, l), (x + 0.04, -0.752, 0.93 + l / 2), "#e8c8a8", bevel=0.0)
    p.box((0.16, 0.012, 0.045), (0.2, -0.752, 0.82), "#e8c8a8", rot=(0, 0.5, 0), bevel=0.0)
    # it's leaking
    for i in range(7):
        x = -0.3 + i * 0.1
        l = p.rng.uniform(0.2, 0.55)
        p.box((0.05, 0.01, l), (x, -0.695, 0.42 - l / 2 + 0.1), BLOOD, bevel=0.0)
    for i in range(6):
        p.ball(p.rng.uniform(0.15, 0.4), (p.rng.uniform(-0.7, 0.7), -1.05 - p.rng.uniform(0, 0.6), 0.015), BLOOD, scale=(1.3, 1, 0.03), lumpy=0.2, subdiv=1)
    p.export()


def hand_grate():
    p = Prop("hand_grate", 302)
    # A floor drain. There are arms coming out of it, reaching, and they do not belong to anyone any more.
    p.cyl(0.95, 0.95, 0.04, (0, 0, 0.02), "#3a3e40", segs=20)
    for i in range(9):
        p.box((1.72, 0.05, 0.05), (0, -0.8 + i * 0.2, 0.05), "#26282c", bevel=0.0)
    p.cyl(0.74, 0.74, 0.02, (0, 0, 0.012), "#060505", segs=18)
    for a, l, tilt in ((0.4, 1.15, 0.2), (2.1, 0.8, -0.35), (4.1, 1.35, 0.1), (5.2, 0.65, 0.4)):
        base = Vector((math.cos(a) * 0.32, math.sin(a) * 0.32, 0))
        tip = base + Vector((math.cos(a) * tilt, math.sin(a) * tilt, l))
        p.tube([base, base.lerp(tip, 0.55) + Vector((0.04, -0.02, 0.03)), tip], 0.055, "#b8a890", 7)
        p.ball(0.082, tip, "#c8b8a0", scale=(1, 0.5, 1.15), subdiv=2)
        for k in range(4):
            off = Vector((-0.06 + k * 0.042, 0, 0.08))
            p.tube([tip + off, tip + off + Vector((p.rng.uniform(-0.03, 0.03), 0, 0.13))], 0.016, "#c8b8a0", 5)
        p.tube([base, base + Vector((0, 0, 0.2))], 0.058, BLOOD, 6)
    for i in range(6):
        p.ball(0.24, (p.rng.uniform(-1.3, 1.3), p.rng.uniform(-1.3, 1.3), 0.012), BLOOD, scale=(1.4, 1, 0.03), lumpy=0.25, subdiv=1)
    p.export()


def shoe_pile():
    p = Prop("shoe_pile", 303)
    # Everyone's shoes. Thousands of odd shoes in a cairn, the way the Network leaves them.
    colors = ("#6a4a2a", "#2a2a2e", "#a8302a", "#d8d0c0", "#3a5a8a", "#5a7a3a")
    for i in range(60):
        ring = (i % 18) / 18
        a = i * 2.4
        r = (1 - ring) * 2.4 + 0.15
        c = colors[i % 6]
        loc = (math.cos(a) * r, math.sin(a) * r, ring * 1.9 + 0.1)
        yaw = p.rng.uniform(0, 6.3)
        p.ball(0.15, loc, c, scale=(0.75, 1.9, 0.7), rot=(p.rng.uniform(-0.8, 0.8), p.rng.uniform(-0.8, 0.8), yaw), subdiv=1)
        p.box((0.18, 0.5, 0.04), (loc[0], loc[1], loc[2] - 0.08), "#14141a", rot=(p.rng.uniform(-0.8, 0.8), p.rng.uniform(-0.8, 0.8), yaw), bevel=0.0)
    p.export()


def pressed_rack():
    p = Prop("pressed_rack", 304)
    # A dry-cleaner's rack. The Network doesn't waste contestants: pressed flat, hung up, tagged for collection.
    p.cyl(0.03, 0.03, 4.4, (0, 0, 2.3), STEEL, rot=(0, math.pi / 2, 0), segs=6)
    for x in (-2.15, 2.15):
        p.cyl(0.03, 0.03, 2.3, (x, 0, 1.15), STEEL, segs=6)
        p.box((0.06, 0.9, 0.05), (x, 0, 0.04), STEEL, bevel=0.0)
    skins = ("#e0b898", "#a87050", "#c8987a", "#d8a888")
    shirts = ("#c94a4a", "#3a5a8a", "#d8c840", "#5a7a3a", "#7a3a7a")
    for i in range(5):
        x = -1.7 + i * 0.85
        skin = skins[i % 4]
        p.tube([(x, 0, 2.33), (x + 0.03, 0, 2.42), (x, 0, 2.3), (x, 0, 2.2)], 0.008, STEEL, 3)
        # flat as a shirt: torso, arms hanging out wide, legs, and a face that has stopped
        p.box((0.56, 0.02, 0.72), (x, 0, 1.75), shirts[i % 5], bevel=0.0)
        for s in (-1, 1):
            p.box((0.72, 0.02, 0.15), (x + s * 0.46, 0, 1.92), shirts[i % 5], rot=(0, s * 0.52, 0), bevel=0.0)
            p.box((0.1, 0.02, 0.12), (x + s * 0.8, 0, 1.68), skin, bevel=0.0)
            p.box((0.2, 0.02, 0.88), (x + s * 0.14, 0, 1.0), "#2a3044", bevel=0.0)
        p.ball(0.19, (x, -0.01, 2.2), skin, scale=(1, 0.05, 1.15), subdiv=2)
        for s in (-1, 1):
            p.box((0.04, 0.012, 0.05), (x + s * 0.07, -0.025, 2.23), "#16141a", bevel=0.0)
        p.box((0.1, 0.012, 0.09), (x, -0.025, 2.1), "#16141a", bevel=0.0)
        p.box((0.11, 0.012, 0.15), (x + 0.2, -0.02, 1.55), CREAM, bevel=0.0)
    p.export()


def steam_press():
    p = Prop("steam_press", 305)
    # An industrial press, jaws open. Something's arm is still on the board.
    p.box((2.4, 1.3, 1.0), (0, 0, 0.5), "#5f7a78", bevel=0.05)
    p.box((2.5, 1.4, 0.14), (0, 0, 1.06), "#d6d8d0", bevel=0.03)
    p.box((0.5, 0.5, 2.5), (0, 0.7, 1.25), "#4c6462", bevel=0.05)
    p.box((2.5, 1.4, 0.3), (0, 0.15, 2.45), "#6c8a86", rot=(-0.3, 0, 0), bevel=0.05)
    p.box((2.3, 1.2, 0.05), (0, 0.15, 2.28), CHROME, rot=(-0.3, 0, 0), bevel=0.0)
    for x in (-1.0, 1.0):
        p.cyl(0.08, 0.08, 1.5, (x, 0.65, 1.8), STEEL, rot=(-0.3, 0, 0), segs=8)
    p.tube([(0.1, -0.1, 1.15), (0.6, -0.3, 1.14), (1.05, -0.42, 1.14)], 0.05, "#c8987a", 6)
    p.box((0.2, 0.34, 0.02), (1.18, -0.46, 1.14), "#c8987a", bevel=0.0)
    p.box((0.34, 0.5, 0.012), (0.4, 0.02, 1.135), GORE, rot=(0, 0, 0.3), bevel=0.0)
    for s in (-1, 1):
        p.cyl(0.14, 0.14, 0.05, (s * 0.8, -0.67, 0.65), "#a8302a", rot=(math.pi / 2, 0, 0), segs=10)
    p.lathe([(0.2, 0), (0.1, 0.5), (0.07, 0.9)], (-0.85, 0.5, 2.6), STEEL, segs=8)
    p.export()


def folding_table():
    p = Prop("folding_table", 306)
    # A long table of clothes folded immaculately, each with a name tag. None of the names got to pick these up.
    p.box((4.4, 1.3, 0.09), (0, 0, 0.92), "#c8ccc4", bevel=0.02)
    for x in (-2.0, 2.0):
        for y in (-0.55, 0.55):
            p.cyl(0.04, 0.04, 0.9, (x, y, 0.45), STEEL, segs=6)
    colors = ("#c94a4a", "#3a5a8a", "#e8e0d0", "#5a7a3a", "#d8c840", "#8a5a9a")
    for i in range(8):
        x = -1.85 + i * 0.53
        for y in (-0.3, 0.3):
            h = p.rng.randint(2, 5)
            for k in range(h):
                p.box((0.44, 0.46, 0.05), (x, y, 1.0 + k * 0.052), colors[(i + k) % 6], rot=(0, 0, p.rng.uniform(-0.04, 0.04)), bevel=0.012)
            p.box((0.1, 0.012, 0.06), (x, y - 0.235, 1.0), CREAM, bevel=0.0)
    p.box((0.34, 0.5, 0.05), (2.05, 0.3, 1.0), "#c8987a", bevel=0.012)
    p.ball(0.1, (2.05, 0.3, 1.1), "#e0b898", scale=(1, 1, 0.4), subdiv=2)
    p.export()


def garment_rail():
    p = Prop("garment_rail", 307)
    # 10 m of the overhead dry-cleaning conveyor. Hangs from a ceiling 12 m up; the track runs at 7 m.
    p.box((0.16, 10, 0.12), (0, 0, 7.05), "#4a4e52", bevel=0.02)
    p.box((0.05, 10, 0.05), (0, 0, 6.95), CHROME, bevel=0.0)
    for y in (-3.5, 3.5):
        p.cyl(0.04, 0.04, 4.9, (0, y, 9.55), STEEL, segs=6)
    p.export()


def garment_bag():
    p = Prop("garment_bag", 308)
    # A long grey plastic bag on the conveyor. It's about the right size. It's about the right shape. Origin at the hook.
    p.tube([(0, 0, 0), (0.04, 0, -0.1), (0, 0, -0.2), (0, 0, -0.34)], 0.012, STEEL, 4)
    loftsec = lambda w, d, z: [(math.cos(i * math.tau / 8) * w, math.sin(i * math.tau / 8) * d, z) for i in range(8)]
    rings = [loftsec(0.1, 0.06, -0.36), loftsec(0.3, 0.14, -0.62), loftsec(0.32, 0.18, -1.1), loftsec(0.26, 0.16, -1.6), loftsec(0.22, 0.14, -2.1), loftsec(0.14, 0.09, -2.45)]
    vs = [[p.bm.verts.new(v) for v in r] for r in rings]
    for a, b in zip(vs, vs[1:]):
        for i in range(8):
            p.bm.faces.new((a[i], a[(i + 1) % 8], b[(i + 1) % 8], b[i]))
    p.bm.faces.new(tuple(reversed(vs[0])))
    p.bm.faces.new(tuple(vs[-1]))
    p._finish_part([v for r in vs for v in r], "#8a9a9a", True, (0, 0, 0), (0, 0, 0), 0.0)
    p.ball(0.15, (0, -0.1, -0.56), "#72827f", scale=(1, 0.8, 1.15), subdiv=1)
    p.box((0.16, 0.012, 0.22), (0.06, -0.17, -1.1), CREAM, bevel=0.0)
    p.box((0.2, 0.012, 0.16), (-0.04, -0.17, -2.0), BLOOD, bevel=0.0)
    p.export()


def bleach_vat():
    p = Prop("bleach_vat", 309)
    # A tank of bleach with a ladder, a walkway and a body still holding on to the ladder.
    p.lathe([(3.6, 0), (3.8, 0.1), (3.8, 2.0), (3.95, 2.1), (3.95, 2.25), (3.6, 2.25)], (0, 0, 0), "#7f9a96", segs=24)
    p.cyl(3.6, 3.6, 0.03, (0, 0, 1.95), "glow:#d8ff8a", segs=24)
    for i in range(8):
        a = i * math.tau / 8
        p.box((0.14, 0.12, 2.0), (math.cos(a) * 3.84, math.sin(a) * 3.84, 1.0), "#5f7a78", rot=(0, 0, a), bevel=0.0)
    for s in (-1, 1):
        p.tube([(s * 0.3, -3.95, 0), (s * 0.3, -3.95, 2.7), (s * 0.3, -3.5, 2.9)], 0.024, STEEL, 5)
    for i in range(6):
        p.tube([(-0.3, -3.95, 0.3 + i * 0.4), (0.3, -3.95, 0.3 + i * 0.4)], 0.016, STEEL, 4)
    p.ball(0.12, (0, -3.72, 2.05), BONE, subdiv=2, scale=(0.9, 1, 1.1))
    for s in (-1, 1):
        p.tube([(s * 0.18, -3.68, 1.9), (s * 0.28, -3.92, 2.3)], 0.02, BONE, 5)
    for i in range(10):
        a = p.rng.uniform(0, 6.3)
        p.ball(0.08, (math.cos(a) * p.rng.uniform(1, 3), math.sin(a) * p.rng.uniform(1, 3), 1.97), BONE, scale=(2, 0.6, 0.5), subdiv=1)
    p.export()


def sheet_frame():
    p = Prop("sheet_frame", 310)
    # Two poles and a line: the sheet itself is painted, and sways, in Godot. The sheet hangs from Z = 4.6.
    for x in (-3.0, 3.0):
        p.cyl(0.05, 0.05, 4.9, (x, 0, 2.45), STEEL, segs=6)
        p.box((0.9, 0.05, 0.05), (x, 0, 0.03), STEEL, bevel=0.0)
    p.tube(p.sag((-3, 0, 4.72), (3, 0, 4.72), 0.08, 10), 0.012, CREAM, 4)
    for x in (-2.4, -1.2, 0, 1.2, 2.4):
        p.box((0.05, 0.03, 0.16), (x, 0, 4.66), WOOD, bevel=0.0)
    p.export()


def wet_floor_ring():
    p = Prop("wet_floor_ring", 311)
    # Dozens of caution signs in a perfect ring around a dark stain, and a mop stood up in the middle like a flag.
    for i in range(18):
        a = i * math.tau / 18
        x, y = math.cos(a) * 4.0, math.sin(a) * 4.0
        for s in (-1, 1):
            p.box((0.42, 0.03, 0.66), (x + math.cos(a) * s * 0.1, y + math.sin(a) * s * 0.1, 0.32), "#e4bd24", rot=(0, s * 0.3, a), bevel=0.008)
    p.ball(3.1, (0, 0, 0.01), BLOOD, scale=(1, 1, 0.006), lumpy=0.18, subdiv=2)
    p.tube([(0, 0, 0), (0.08, 0, 2.5)], 0.03, WOOD, 6)
    for i in range(10):
        a = i * math.tau / 10
        p.tube([(0.08, 0, 2.5), (0.08 + math.cos(a) * 0.3, math.sin(a) * 0.3, 2.05)], 0.03, "#8a8470", 4)
    p.export()


# ------------------------------------------------------------ Floor 3
def hook_rail():
    p = Prop("hook_rail", 320)
    # 8 m of slaughterhouse rail with a row of hanging sides. Pork, the sign says. One of them has a lanyard.
    p.box((8, 0.12, 0.14), (0, 0, 4.2), "#3a3e42", bevel=0.02)
    for x in (-3.8, 3.8):
        p.cyl(0.06, 0.06, 4.1, (x, 0, 2.05), "#3a3e42", segs=6)
    for i in range(6):
        x = -3.1 + i * 1.25
        p.tube([(x, 0, 4.12), (x + 0.04, 0, 3.9), (x, 0.05, 3.72), (x, 0, 3.62)], 0.014, CHROME, 4)
        h = p.rng.uniform(1.6, 2.1)
        secs = [(3.6, 0.09), (3.3, 0.26), (3.0, 0.32), (2.6, 0.26), (3.6 - h, 0.15)]
        rings = [[(x + math.cos(k * math.tau / 8) * r, math.sin(k * math.tau / 8) * r * 0.58, z) for k in range(8)] for z, r in secs]
        vs = [[p.bm.verts.new(v) for v in rr] for rr in rings]
        for a, b in zip(vs, vs[1:]):
            for k in range(8):
                p.bm.faces.new((a[k], a[(k + 1) % 8], b[(k + 1) % 8], b[k]))
        p.bm.faces.new(tuple(reversed(vs[0])))
        p.bm.faces.new(tuple(vs[-1]))
        p._finish_part([v for r in vs for v in r], MEAT, True, (0, 0, 0), (0, 0, 0), 0.0)
        for k in range(5):
            p.box((0.46, 0.02, 0.05), (x, -0.13, 3.25 - k * 0.14), BONE, rot=(0, 0.08 * k, 0), bevel=0.0)
        p.box((0.05, 0.02, 1.2), (x, -0.16, 2.9), "#8a1a14", bevel=0.0)
        p.ball(0.34, (x, 0, 0.01), BLOOD, scale=(1.2, 1, 0.02), lumpy=0.25, subdiv=1)
        if i == 2:
            p.tube(p.sag((x - 0.12, -0.15, 3.32), (x + 0.12, -0.15, 3.32), 0.32, 5), 0.006, "#2f5b57", 3)
            p.box((0.1, 0.012, 0.14), (x, -0.18, 3.0), CREAM, bevel=0.0)
    p.export()


def butcher_block():
    p = Prop("butcher_block", 321)
    # A block worn into a saddle, a cleaver left standing in it, a pile of things not yet sorted.
    p.box((1.7, 1.1, 0.72), (0, 0, 0.56), "#8a5a30", bevel=0.03)
    for x in (-0.68, 0.68):
        for y in (-0.42, 0.42):
            p.box((0.16, 0.16, 0.24), (x, y, 0.12), "#4a3020", bevel=0.01)
    for i in range(7):
        p.box((0.012, 1.1, 0.72), (-0.72 + i * 0.24, 0, 0.56), "#5a3a20", bevel=0.0)
    p.ball(0.5, (0, 0, 0.92), "#5a1410", scale=(1.3, 0.9, 0.05), lumpy=0.2, subdiv=2)
    p.box((0.05, 0.42, 0.24), (0.36, 0.05, 1.05), CHROME, rot=(0.2, 0, 0.1), bevel=0.0)
    p.cyl(0.024, 0.024, 0.28, (0.37, 0.36, 1.18), WOOD_DARK, rot=(-1.3, 0, 0.1), segs=6)
    for i in range(6):
        p.ball(p.rng.uniform(0.07, 0.15), (p.rng.uniform(-0.65, 0), p.rng.uniform(-0.3, 0.3), 0.96), p.rng.choice((MEAT, "#7a2a22", BONE)), lumpy=0.2, subdiv=1)
    p.export()


def banquet():
    p = Prop("banquet", 322)
    # A very long table, laid for the dead: ten seated skeletons, soup cooling in every bowl, candles still lit.
    length = 13.0
    p.box((length, 1.5, 0.1), (0, 0, 0.96), "#6a3a20", bevel=0.02)
    p.box((length + 0.1, 1.6, 0.02), (0, 0, 1.02), "#c8b890", bevel=0.0)
    for x in (-6, -3, 0, 3, 6):
        for y in (-0.6, 0.6):
            p.cyl(0.06, 0.08, 0.92, (x, y, 0.46), WOOD_DARK, segs=7)
    for i in range(10):
        x = -5.4 + i * 1.2
        for s in (-1, 1):
            y = s * 1.15
            # chair
            p.box((0.56, 0.56, 0.05), (x, y, 0.55), WOOD, bevel=0.012)
            p.box((0.56, 0.05, 0.86), (x, y + s * 0.26, 0.95), WOOD_DARK, bevel=0.012)
            for lx in (-0.22, 0.22):
                p.cyl(0.024, 0.024, 0.54, (x + lx, y, 0.27), WOOD_DARK, segs=5)
            # guest
            p.ball(0.13, (x, y + s * 0.02, 1.42), BONE, scale=(0.9, 1, 1.1), subdiv=2)
            for e in (-1, 1):
                p.ball(0.032, (x + e * 0.05, y - s * 0.1, 1.44), "#0f0e12", subdiv=1)
            p.box((0.11, 0.05, 0.035), (x, y - s * 0.1, 1.33), BONE, bevel=0.0)
            p.cyl(0.03, 0.03, 0.42, (x, y + s * 0.04, 1.08), BONE, segs=5)
            for r in range(4):
                p.tube([(x - 0.15, y + s * 0.04, 1.24 - r * 0.07), (x, y - s * 0.07, 1.24 - r * 0.07), (x + 0.15, y + s * 0.04, 1.24 - r * 0.07)], 0.012, BONE, 3)
            for e in (-1, 1):
                p.tube([(x + e * 0.18, y + s * 0.02, 1.26), (x + e * 0.2, y - s * 0.22, 1.08), (x + e * 0.12, y - s * 0.46, 1.05)], 0.018, BONE, 4)
            # bowl
            p.lathe([(0.03, 0), (0.15, 0.06), (0.17, 0.09), (0.14, 0.09)], (x, s * 0.5, 1.03), CREAM, segs=10)
            p.cyl(0.14, 0.14, 0.012, (x, s * 0.5, 1.09), "#c26a2a", segs=10)
    for i in range(6):
        x = -5.0 + i * 2.0
        p.lathe([(0.1, 0), (0.05, 0.03), (0.02, 0.2), (0.05, 0.24)], (x, 0, 1.03), BRASS, segs=8)
        p.cyl(0.03, 0.03, 0.2, (x, 0, 1.36), "#e8dcc0", segs=6)
        p.ball(0.03, (x, 0, 1.5), "glow:#ffc86a", scale=(0.8, 0.8, 1.5), subdiv=1)
    p.export()


def jar_shelf():
    p = Prop("jar_shelf", 323)
    # A street stall of pickled things, and the things are looking at you.
    for z in (0.55, 1.2, 1.85):
        p.box((3.0, 0.5, 0.05), (0, 0, z), WOOD, bevel=0.01)
    for x in (-1.46, 0, 1.46):
        p.box((0.06, 0.5, 2.1), (x, 0, 1.05), WOOD_DARK, bevel=0.0)
    for z in (0.58, 1.23, 1.88):
        for i in range(8):
            x = -1.25 + i * 0.36
            if abs(x) < 0.06:
                continue
            p.lathe([(0.1, 0), (0.135, 0.03), (0.135, 0.3), (0.09, 0.36), (0.1, 0.4)], (x, 0, z), "#a8b86a" if i % 3 else "#c88a4a", segs=9)
            p.cyl(0.105, 0.105, 0.03, (x, 0, z + 0.42), "#6a4a2a", segs=9)
            kind = (i + int(z * 3)) % 3
            if kind == 0:
                for e in (-1, 1):
                    p.ball(0.042, (x + e * 0.05, -0.1, z + 0.18), "#f0ece0", subdiv=1)
                    p.ball(0.018, (x + e * 0.05, -0.135, z + 0.18), "glow:#ffb030", subdiv=1)
            elif kind == 1:
                p.box((0.03, 0.03, 0.2), (x, -0.08, z + 0.16), "#c8987a", bevel=0.0)
                p.box((0.1, 0.03, 0.04), (x, -0.08, z + 0.2), "#c8987a", bevel=0.0)
            else:
                p.ball(0.09, (x, -0.06, z + 0.17), MEAT, lumpy=0.2, subdiv=1)
    p.box((3.1, 0.7, 0.05), (0, -0.1, 2.28), "#7a2a1e", rot=(0.15, 0, 0), bevel=0.0)
    p.export()


def toll_stake():
    p = Prop("toll_stake", 324)
    # The Cone King's toll road: a tall stake, a traffic cone on top, and someone who didn't have exact change.
    p.tube([(0, 0, 0), (0.05, 0.03, 2.1), (0, 0, 4.2)], 0.07, "#4a3020", 7)
    p.lathe([(0.28, 0), (0.05, 0.72)], (0, 0, 4.15), "#ea6714", segs=11)
    p.box((0.6, 0.6, 0.05), (0, 0, 4.14), "#c94e12", bevel=0.012)
    p.ball(0.13, (0.0, -0.09, 3.3), BONE, scale=(0.9, 1, 1.1), subdiv=2)
    for e in (-1, 1):
        p.ball(0.03, (e * 0.05, -0.2, 3.33), "#0f0e12", subdiv=1)
    p.box((0.12, 0.02, 0.05), (0, -0.2, 3.2), "#0f0e12", bevel=0.0)
    p.box((0.42, 0.14, 0.55), (0, -0.07, 2.8), "#5a4638", bevel=0.03)
    for s in (-1, 1):
        p.tube([(s * 0.22, -0.08, 3.0), (s * 0.28, -0.12, 2.5), (s * 0.28, -0.12, 2.1)], 0.028, BONE, 5)
        p.tube([(s * 0.12, -0.08, 2.55), (s * 0.14, -0.1, 1.9), (s * 0.13, -0.1, 1.4)], 0.032, BONE, 5)
    p.box((0.56, 0.03, 0.3), (0, -0.16, 2.72), "#e8dcb0", rot=(0, 0.06, 0), bevel=0.0)
    for i in range(5):
        p.box((0.04, 0.012, p.rng.uniform(0.3, 0.9)), (p.rng.uniform(-0.1, 0.1), -0.08, 1.55), BLOOD, bevel=0.0)
    p.ball(0.5, (0, 0, 0.012), BLOOD, scale=(1.3, 1, 0.02), lumpy=0.25, subdiv=1)
    p.export()


def bone_heap():
    p = Prop("bone_heap", 325)
    # What's left after the stock has been made.
    for i in range(70):
        ring = (i % 20) / 20
        a = i * 2.4
        r = (1 - ring) * 3.0 + 0.2
        loc = Vector((math.cos(a) * r, math.sin(a) * r, ring * 1.5 + 0.08))
        d = Vector((p.rng.uniform(-1, 1), p.rng.uniform(-1, 1), p.rng.uniform(-0.3, 0.3))).normalized() * p.rng.uniform(0.25, 0.42)
        p.tube([loc - d, loc + d], 0.035, p.rng.choice((BONE, "#c0b490", "#a89878")), 5)
        p.ball(0.06, loc - d, BONE, subdiv=1)
        p.ball(0.06, loc + d, BONE, subdiv=1)
        if i % 9 == 0:
            p.ball(0.14, loc, BONE, scale=(0.9, 1, 1.1), subdiv=2)
    p.export()


def ladle_car():
    p = Prop("ladle_car", 326)
    # The cable car: a giant ladle bowl you stand in, hung from a trolley. Origin at the floor of the bowl.
    p.lathe([(0.0, 0.0), (0.82, 0.06), (1.1, 0.5), (1.14, 0.9), (1.08, 0.9), (1.02, 0.5), (0.76, 0.12), (0.001, 0.08)], (0, 0, 0), "#7a7e84", segs=20)
    p.tube([(-1.1, 0, 0.9), (-1.6, 0, 2.6), (0, 0, 3.4), (0, 0, 3.8)], 0.07, "#6a6e74", 8)
    p.box((0.4, 0.7, 0.18), (0, 0, 3.85), "#b4282a", bevel=0.03)
    for y in (-0.22, 0.22):
        p.cyl(0.11, 0.11, 0.24, (0, y, 3.98), DARK, rot=(0, math.pi / 2, 0), segs=10)
    p.export()


def giant_ladle():
    p = Prop("giant_ladle", 327)
    # A colossal ladle stuck upright in the broth, a landmark you can see through the fog.
    p.tube([(0, 0, -1), (0.3, 0, 5), (0.8, 0, 11), (1.0, 0, 15)], 0.5, "#6a6e74", 10)
    p.lathe([(0.0, 0), (2.4, 0.5), (3.2, 1.8), (3.3, 3.0), (3.0, 3.0), (2.2, 1.0), (0.001, 0.4)], (1.0, 0, 13.6), "#7a7e84", segs=20, rot=(0.0, 2.6, 0))
    p.export()


def manhole():
    p = Prop("manhole", 328)
    # A manhole with its lid thrown aside, steam coming up, a ladder and a warm glow from below.
    p.cyl(1.2, 1.2, 0.08, (0, 0, 0.04), "#3a3a3a", segs=18)
    p.cyl(0.95, 0.95, 0.03, (0, 0, 0.07), "#050404", segs=18)
    p.cyl(0.7, 0.7, 0.02, (0, 0, 0.09), "glow:#ff7a2a", segs=16)
    p.cyl(1.0, 1.0, 0.07, (1.9, 0.4, 0.3), "#4a4640", rot=(0.0, 1.0, 0.3), segs=16)
    for s in (-1, 1):
        p.tube([(s * 0.26, 0.82, 0), (s * 0.26, 0.9, 1.1)], 0.024, STEEL, 5)
    for i in range(3):
        p.tube([(-0.26, 0.84 + i * 0.03, 0.3 + i * 0.3), (0.26, 0.84 + i * 0.03, 0.3 + i * 0.3)], 0.016, STEEL, 4)
    p.export()


def rat():
    p = Prop("rat", 329)
    # One of the district's rats, fat on the good stuff. Runs along the gutters in Godot. Faces -Y.
    p.ball(0.15, (0, 0.04, 0.13), "#4a3f38", scale=(0.85, 1.5, 0.8), subdiv=2)
    p.ball(0.09, (0, -0.22, 0.13), "#55493f", scale=(0.8, 1.3, 0.75), subdiv=2)
    for s in (-1, 1):
        p.ball(0.05, (s * 0.06, -0.18, 0.21), "#b89088", scale=(1, 0.3, 1), subdiv=1)
        p.ball(0.014, (s * 0.04, -0.3, 0.16), "#e8e0d0", subdiv=1)
    p.ball(0.022, (0, -0.35, 0.11), "#c88a8a", subdiv=1)
    p.tube([(0, 0.26, 0.1), (0.05, 0.42, 0.06), (-0.04, 0.6, 0.04)], 0.016, "#b89088", 4)
    p.export()


def candle_grave():
    p = Prop("candle_grave", 330)
    # A candle-person's grave: a melted puddle with a face still in it, surrounded by the family, burning low.
    p.ball(1.0, (0, 0, 0.03), "#e8dcc0", scale=(1.4, 1.1, 0.08), lumpy=0.12, subdiv=2)
    for e in (-1, 1):
        p.ball(0.08, (e * 0.2, -0.5, 0.11), "#3a2a1c", scale=(1, 0.5, 0.4), subdiv=1)
    p.ball(0.1, (0, -0.25, 0.1), "#3a2a1c", scale=(1.4, 0.5, 0.4), subdiv=1)
    for i in range(7):
        a = i * math.tau / 7
        h = 0.4 + (i % 3) * 0.32
        x, y = math.cos(a) * 1.7, math.sin(a) * 1.4
        p.lathe([(0.22, 0), (0.17, 0.08), (0.14, h), (0.12, h + 0.02)], (x, y, 0), "#e8dcc0", segs=9)
        p.cyl(0.012, 0.012, 0.06, (x, y, h + 0.04), DARK, segs=4)
        p.ball(0.045, (x, y, h + 0.12), "glow:#ffb040", scale=(0.8, 0.8, 1.5), subdiv=1)
    p.export()


# ------------------------------------------------------------ caves
def build_cave(name, rooms, links, color, tube_r=3.6, strength=2.0):
    bm = bmesh.new()
    def chamber(c, r):
        v = bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0)["verts"]
        for vert in v:
            vert.co.x = vert.co.x * r[0] + c[0]
            vert.co.y = vert.co.y * r[1] + c[1]
            vert.co.z = vert.co.z * r[2] + c[2]
    for c, r in rooms:
        chamber(c, r)
    for a, b in links:
        A, B = Vector(rooms[a][0]), Vector(rooms[b][0])
        n = int((B - A).length / 3)
        for i in range(n + 1):
            t = i / max(n, 1)
            chamber(A.lerp(B, t) + Vector((math.sin(t * 7) * 2.0, math.cos(t * 5) * 2.0, 0)), (tube_r, tube_r, tube_r * 0.92))
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    remesh = obj.modifiers.new("r", "REMESH")
    remesh.mode = "VOXEL"
    remesh.voxel_size = 0.9
    bpy.ops.object.modifier_apply(modifier="r")
    tex = bpy.data.textures.new(name + "_rock", "CLOUDS")
    tex.noise_scale = 4.0
    disp = obj.modifiers.new("d", "DISPLACE")
    disp.texture = tex
    disp.strength = strength
    bpy.ops.object.modifier_apply(modifier="d")
    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
    for f in bm.faces:
        f.smooth = True
    for v in bm.verts:
        nearest = min(rooms, key=lambda rm: (Vector(rm[0]) - v.co).length)
        floor_z = nearest[0][2] - nearest[1][2] * 0.62
        if v.co.z < floor_z:
            v.co.z = floor_z + (v.co.z - floor_z) * 0.12
    bm.to_mesh(me)
    bm.free()
    mat = bpy.data.materials.new("paint_" + color.lstrip("#"))
    mat.use_nodes = True
    next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Base Color"].default_value = kit.rgba(color)
    me.materials.append(mat)
    bpy.ops.export_scene.gltf(filepath=os.path.join(kit.OUT, name + ".glb"), export_format="GLB", use_selection=True, export_yup=True, export_materials="EXPORT")
    bpy.data.objects.remove(obj)
    print("built", name, len(me.polygons), "faces")


def caves():
    # Floor 2: lint-choked ducts. Grey felted walls, one long winding run with a big drum chamber at the end.
    build_cave("cave_f2", [((0, 0, 3), (7, 7, 5)), ((-26, 8, 1), (9, 8, 6)), ((-46, 30, -2), (11, 9, 7)), ((-20, 50, -5), (10, 10, 6)), ((12, 62, -7), (13, 13, 9))], [(0, 1), (1, 2), (2, 3), (3, 4)], "#9a9a94", tube_r=3.2, strength=1.4)
    # Floor 3: stock pipes. Warm, wet, ribbed like a throat, and walled in bone.
    build_cave("cave_f3", [((0, 0, 3), (7, 7, 5)), ((22, -14, 0), (10, 8, 6)), ((46, -6, -3), (12, 10, 7)), ((60, -30, -6), (9, 9, 6)), ((30, -46, -8), (15, 12, 8)), ((2, -30, -6), (8, 8, 5))], [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 1)], "#7a3a26", tube_r=3.4, strength=2.4)


if __name__ == "__main__":
    for build in (washer_red, hand_grate, shoe_pile, pressed_rack, steam_press, folding_table, garment_rail, garment_bag, bleach_vat, sheet_frame, wet_floor_ring, hook_rail, butcher_block, banquet, jar_shelf, toll_stake, bone_heap, ladle_car, giant_ladle, manhole, rat, candle_grave, caves):
        try:
            build()
        except Exception as error:
            print("FAILED", build.__name__, repr(error))
            raise
    print("WILDS F2 F3 DONE")
