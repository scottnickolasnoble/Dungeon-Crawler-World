# Builds the props for Floors 1-6: shop interiors, town dressing, camps, and each floor's own heroes.
#   F:\Downstairs\Blender\blender.exe -b --python tools/blender/build_town_kit.py
# Exports to godot/models/props/town/<name>.glb. Same conventions as build_landing_kit.py: the front faces -Y in
# Blender (+Z in Godot), and the origin is on the floor at the prop's centre.
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_landing_kit as kit
from build_landing_kit import Prop, STEEL, DARK, BRASS, WOOD, WOOD_DARK, CREAM, RED

kit.OUT = os.path.join(os.path.dirname(kit.OUT), "town")
os.makedirs(kit.OUT, exist_ok=True)
GLOW = "glow:#c98a4a"
TEAL = "#2f5b57"
MUSTARD = "#c9992f"


# ------------------------------------------------------------ building parts
def door_frame():
    p = Prop("door_frame", 41)
    # A chunky frame around a 2.6 x 3.1 m doorway, with the door swung open inward. Centre of the wall at Y = 0.
    for x in (-1.42, 1.42):
        p.box((0.26, 0.5, 3.3), (x, 0, 1.65), WOOD_DARK, bevel=0.03)
    p.box((3.1, 0.54, 0.3), (0, 0, 3.26), WOOD_DARK, bevel=0.035)
    p.box((2.5, 0.09, 3.0), (-2.5 + 1.25 + 1.25 - 1.25, 1.2, 1.5), WOOD, rot=(0, 0, math.pi / 2), bevel=0.012)
    p.box((1.9, 0.03, 1.1), (-1.27, 1.2, 2.2), "#7a5230", rot=(0, 0, math.pi / 2), bevel=0.0)
    p.box((1.9, 0.03, 1.1), (-1.27, 1.2, 0.8), "#7a5230", rot=(0, 0, math.pi / 2), bevel=0.0)
    p.box((2.7, 0.8, 0.12), (0, -0.55, 0.06), "#6b6058", bevel=0.02)
    p.export()


def window():
    p = Prop("window", 42)
    # A window that reads from both sides of a wall. Lit pane, cross bars, sill and flower-box bracket.
    for x in (-0.82, 0.82):
        p.box((0.14, 0.52, 1.6), (x, 0, 0), WOOD_DARK, bevel=0.02)
    for z in (-0.8, 0.8):
        p.box((1.78, 0.52, 0.14), (0, 0, z), WOOD_DARK, bevel=0.02)
    p.box((1.52, 0.44, 1.48), (0, 0, 0), GLOW, bevel=0.0)
    p.box((0.06, 0.5, 1.5), (0, 0, 0), WOOD_DARK, bevel=0.0)
    p.box((1.54, 0.5, 0.06), (0, 0, 0), WOOD_DARK, bevel=0.0)
    p.box((2.0, 0.62, 0.1), (0, 0, -0.9), "#6b5238", bevel=0.02)
    p.export()


def awning():
    p = Prop("awning", 43)
    # A striped shop awning. Origin at the wall, top edge.
    n = 7
    for i in range(n):
        x = -1.8 + (i + 0.5) * 3.6 / n
        c = RED if i % 2 else CREAM
        p.box((3.6 / n, 1.3, 0.05), (x, -0.62, -0.28), c, rot=(-0.42, 0, 0), bevel=0.0)
        p.box((3.6 / n, 0.04, 0.24), (x, -1.2, -0.66), c, bevel=0.0)
    p.tube([(-1.8, 0, -0.75), (-1.8, -1.2, -0.56)], 0.02, DARK, 5)
    p.tube([(1.8, 0, -0.75), (1.8, -1.2, -0.56)], 0.02, DARK, 5)
    p.export()


def sign_bracket():
    p = Prop("sign_bracket", 44)
    # The iron arm a hanging shop sign swings from. Reaches 1.5 m out along -X... from a wall on its +X side.
    p.tube([(0, 0, 0), (-1.45, 0, 0)], 0.028, DARK, 6)
    p.tube([(0, 0, -0.55), (-0.6, 0, 0)], 0.018, DARK, 5)
    p.tube([(-1.45, 0, 0), (-1.5, 0, -0.04), (-1.46, 0, -0.08)], 0.016, DARK, 5)
    for x in (-0.45, -1.3):
        p.tube([(x, 0, 0), (x, 0, -0.12)], 0.009, STEEL, 4)
    p.box((0.07, 0.14, 0.72), (0.02, 0, -0.25), DARK, bevel=0.01)
    p.export()


# ------------------------------------------------------------ shop interiors
def counter():
    p = Prop("counter", 45)
    # A shop counter 4 m wide, with a till, bell and a mess of receipts. Customer side is -Y.
    p.box((4.0, 0.72, 1.0), (0, 0, 0.5), WOOD, bevel=0.03)
    p.box((4.2, 0.86, 0.09), (0, 0, 1.05), "#6d4524", bevel=0.025)
    p.box((4.0, 0.76, 0.1), (0, 0, 0.05), DARK, bevel=0.012)
    for i in range(5):
        x = -1.6 + i * 0.8
        p.box((0.66, 0.03, 0.6), (x, -0.37, 0.54), "#b5803f", bevel=0.01)
        p.bolts((x - 0.27, x + 0.27), -0.39, (0.3, 0.78), BRASS, 0.012)
    p.box((0.46, 0.44, 0.28), (-1.2, 0, 1.24), "#6d7178", bevel=0.03)
    p.box((0.4, 0.14, 0.1), (-1.2, -0.16, 1.42), "#3a3942", rot=(0.5, 0, 0), bevel=0.012)
    p.box((0.34, 0.03, 0.09), (-1.2, -0.2, 1.53), "#1f6a58", rot=(0.4, 0, 0), bevel=0.0)
    p.lathe([(0.07, 0), (0.07, 0.015), (0.055, 0.03), (0.03, 0.09), (0.007, 0.11), (0.011, 0.13)], (1.25, -0.2, 1.095), BRASS, segs=10)
    for k in range(6):
        p.box((0.2, 0.26, 0.012), (0.3, 0.05, 1.11 + k * 0.014), CREAM, rot=(0, 0, p.rng.uniform(-0.3, 0.3)), bevel=0.0)
    p.lathe([(0.05, 0), (0.054, 0.11), (0.046, 0.11)], (1.68, 0.1, 1.095), "#e7e0ce", segs=10)
    p.export()


def weapon_rack():
    p = Prop("weapon_rack", 46)
    # A wall rack for the gear shop: pipes, cleavers, spears and a stop sign, all for sale. 3 m wide.
    for z in (1.0, 2.15):
        p.box((3.0, 0.1, 0.1), (0, 0.05, z), WOOD_DARK, bevel=0.015)
    for i, x in enumerate((-1.3, -0.85, -0.42, 0.0, 0.42, 0.85, 1.3)):
        c = (STEEL, "#8a5a30", "#a0a4a8")[i % 3]
        p.cyl(0.022, 0.022, 1.62, (x, -0.08, 1.45), c, segs=8, rot=(0, p.rng.uniform(-0.03, 0.03), 0))
        if i % 3 == 0:
            p.box((0.2, 0.04, 0.34), (x, -0.08, 2.28), "#b8bcc0", bevel=0.01)
        elif i % 3 == 1:
            p.lathe([(0.022, 0), (0.05, 0.02), (0.008, 0.26)], (x, -0.08, 2.25), "#b8bcc0", segs=6)
        else:
            p.box((0.08, 0.12, 0.2), (x, -0.08, 2.32), DARK, bevel=0.015)
    p.cyl(0.32, 0.32, 0.03, (0.2, -0.12, 0.52), "#b4282a", rot=(math.pi / 2, 0, 0), segs=8)
    p.export()


def armor_stand():
    p = Prop("armor_stand", 47)
    # A dressmaker's dummy wearing hubcap pauldrons, a seatbelt and a traffic-cone helm.
    p.cyl(0.26, 0.26, 0.05, (0, 0, 0.03), WOOD_DARK, segs=10)
    p.cyl(0.03, 0.03, 0.85, (0, 0, 0.45), WOOD_DARK, segs=6)
    p.lathe([(0.16, 0.0), (0.21, 0.2), (0.27, 0.45), (0.24, 0.6), (0.08, 0.68)], (0, 0, 0.82), "#8a8d72", segs=12)
    for s in (-1, 1):
        p.lathe([(0.17, 0), (0.15, 0.05), (0.03, 0.08)], (s * 0.3, 0, 1.42), STEEL, segs=10, rot=(0, s * 0.8, 0))
    p.box((0.1, 0.33, 0.7), (0, -0.0, 1.14), "#34333a", rot=(0, 0.55, 0), bevel=0.0)
    p.lathe([(0.12, 0), (0.02, 0.34)], (0, 0, 1.52), "#ea6714", segs=10)
    p.export()


def food_shelf():
    p = Prop("food_shelf", 48)
    # Shelves of tins, jars, loaves and water, 3 m wide.
    for z in (0.15, 0.8, 1.45, 2.1):
        p.box((3.0, 0.44, 0.05), (0, 0, z), WOOD, bevel=0.012)
    for x in (-1.46, 0, 1.46):
        p.box((0.05, 0.44, 2.2), (x, 0, 1.1), WOOD_DARK, bevel=0.0)
    palette = ["#c94a2a", "#d0a32a", "#5a8a3a", "#3a6a9c", "#e8e0c8", "#8a4a7a"]
    for zi, z in enumerate((0.175, 0.825, 1.475)):
        x = -1.32
        while x < 1.3:
            if abs(x) < 0.05:
                x += 0.1
                continue
            c = p.rng.choice(palette)
            kind = p.rng.random()
            if kind < 0.5:
                h = p.rng.uniform(0.18, 0.32)
                p.lathe([(0.055, 0), (0.06, h * 0.85), (0.045, h)], (x, -0.02, z), c, segs=8)
                x += 0.15
            elif kind < 0.8:
                p.box((0.2, 0.2, 0.22), (x, -0.02, z + 0.11), c, bevel=0.01, wonk=0.05)
                x += 0.24
            else:
                p.ball(0.11, (x, -0.02, z + 0.07), "#c08a4a", scale=(1.4, 0.8, 0.7), lumpy=0.04, subdiv=1)
                x += 0.3
    p.export()


def potion_shelf():
    p = Prop("potion_shelf", 49)
    # Glowing bottles on narrow shelves: the provisions shop's stock of potions.
    for z in (0.9, 1.45, 2.0):
        p.box((2.4, 0.26, 0.04), (0, 0, z), WOOD_DARK, bevel=0.01)
        for i in range(9):
            x = -1.05 + i * 0.26
            c = ("glow:#ff5a4a", "glow:#5ab8ff", "glow:#7bea6a", "#7a4a2a")[(i + int(z * 3)) % 4]
            p.lathe([(0.05, 0), (0.068, 0.04), (0.068, 0.12), (0.022, 0.18), (0.022, 0.24)], (x, -0.02, z + 0.02), c, segs=8)
            p.cyl(0.024, 0.024, 0.04, (x, -0.02, z + 0.27), "#a07a4a", segs=6)
    p.export()


def junk_pile():
    p = Prop("junk_pile", 50)
    # Good junk and bad junk: hubcaps, a bike wheel, a kettle, a tyre, and a suspicious number of cones.
    p.ball(0.8, (0, 0, 0.16), "#6d5c44", scale=(1.3, 1.0, 0.42), lumpy=0.15, subdiv=2)
    p.lathe([(0.2, 0), (0.33, 0), (0.42, 0.06), (0.42, 0.2), (0.33, 0.26), (0.2, 0.26)], (-0.5, 0.2, 0.28), "#26252b", segs=14, rot=(0.5, 0.3, 0))
    p.cyl(0.26, 0.2, 0.05, (0.45, -0.32, 0.5), "#a0a4a8", rot=(1.1, 0, 0.4), segs=12)
    p.lathe([(0.12, 0), (0.16, 0.05), (0.16, 0.2), (0.08, 0.28), (0.02, 0.32)], (0.12, 0.12, 0.42), "#bb6a2a", segs=10, rot=(0.3, 0.2, 0))
    p.lathe([(0.13, 0), (0.02, 0.42)], (-0.1, -0.35, 0.38), "#ea6714", segs=10, rot=(0.6, 0, 0.3))
    p.tube([(0.7, 0.2, 0.1), (0.72, 0.36, 0.72), (0.5, 0.42, 0.9)], 0.02, STEEL, 6)
    p.box((0.5, 0.36, 0.34), (0.75, -0.2, 0.3), "#7d8a6a", rot=(0.2, 0.15, 0.4), bevel=0.025)
    p.export()


def workbench():
    p = Prop("workbench", 51)
    # A crafting table for the bench merchant: vice, saw, hammer, shavings.
    p.box((2.4, 1.0, 0.12), (0, 0, 0.92), WOOD, bevel=0.02)
    for x in (-1.08, 1.08):
        for y in (-0.38, 0.38):
            p.box((0.13, 0.13, 0.88), (x, y, 0.44), WOOD_DARK, bevel=0.02)
    p.box((2.2, 0.08, 0.1), (0, 0, 0.26), WOOD_DARK, bevel=0.01)
    p.box((0.2, 0.26, 0.15), (0.92, -0.38, 1.05), "#4f5a68", bevel=0.02)
    p.cyl(0.018, 0.018, 0.3, (0.92, -0.58, 1.06), STEEL, rot=(math.pi / 2, 0, 0), segs=6)
    p.box((0.6, 0.16, 0.012), (-0.6, -0.18, 0.99), "#b8bcc0", rot=(0, 0, 0.3), bevel=0.0)
    p.box((0.13, 0.05, 0.1), (-0.25, -0.05, 1.03), WOOD_DARK, rot=(0, 0, 0.3), bevel=0.01)
    p.cyl(0.016, 0.016, 0.34, (0.15, 0.22, 1.0), WOOD_DARK, rot=(0, math.pi / 2, 0.8), segs=6)
    p.box((0.1, 0.05, 0.06), (0.03, 0.09, 1.0), DARK, rot=(0, 0, 0.8), bevel=0.01)
    for i in range(12):
        p.ball(0.03, (p.rng.uniform(-1, 1), p.rng.uniform(-0.8, 0.8), 0.015), "#c9a064", scale=(1.6, 0.6, 0.2), subdiv=1)
    p.export()


def bed():
    p = Prop("bed", 52)
    # An iron-framed bunk with a lumpy mattress and a patched blanket.
    for x in (-0.5, 0.5):
        for y in (-1.0, 1.0):
            p.cyl(0.03, 0.03, 0.9 if y > 0 else 0.6, (x, y, 0.45 if y > 0 else 0.3), STEEL, segs=6)
    p.tube([(-0.5, 1.0, 0.92), (0.5, 1.0, 0.92)], 0.03, STEEL, 6)
    p.tube([(-0.5, -1.0, 0.62), (0.5, -1.0, 0.62)], 0.03, STEEL, 6)
    p.box((1.0, 2.0, 0.2), (0, 0, 0.4), "#c8bea2", bevel=0.05)
    p.box((1.04, 1.25, 0.08), (0, -0.33, 0.52), "#8a3f35", bevel=0.03)
    p.box((0.36, 0.3, 0.012), (0.2, -0.4, 0.565), "#c9992f", rot=(0, 0, 0.3), bevel=0.0)
    p.ball(0.26, (0, 0.68, 0.56), "#efe6d0", scale=(1.35, 0.8, 0.36), lumpy=0.03, subdiv=2)
    p.export()


def table_set():
    p = Prop("table_set", 53)
    # A round table, stools, a candle, plates and whatever passes for dinner.
    p.cyl(0.62, 0.62, 0.07, (0, 0, 0.82), WOOD, segs=14)
    p.lathe([(0.32, 0), (0.1, 0.05), (0.06, 0.1), (0.06, 0.78)], (0, 0, 0), WOOD_DARK, segs=10)
    for i in range(3):
        a = i * math.tau / 3 + 0.4
        x, y = math.cos(a) * 1.02, math.sin(a) * 1.02
        p.cyl(0.2, 0.2, 0.05, (x, y, 0.5), "#7a5230", segs=10)
        p.cyl(0.03, 0.03, 0.48, (x, y, 0.24), WOOD_DARK, segs=6)
    for a in (0.5, 2.5, 4.5):
        p.lathe([(0.07, 0), (0.14, 0.02), (0.14, 0.03)], (math.cos(a) * 0.32, math.sin(a) * 0.32, 0.855), CREAM, segs=10)
    p.cyl(0.03, 0.03, 0.14, (0, 0, 0.93), "#e8dcc0", segs=7)
    p.ball(0.03, (0, 0, 1.03), "glow:#ffc86a", scale=(0.8, 0.8, 1.4), subdiv=1)
    p.export()


def bar_back():
    p = Prop("bar_back", 54)
    # The wall behind an inn's bar: bottles, a keg and a clock that has stopped.
    p.box((4.0, 0.3, 2.5), (0, 0.08, 1.25), "#59381f", bevel=0.02)
    for z in (1.15, 1.75):
        p.box((3.7, 0.3, 0.04), (0, -0.15, z), "#7a5230", bevel=0.01)
        for i in range(13):
            x = -1.6 + i * 0.27
            p.lathe([(0.05, 0), (0.055, 0.2), (0.018, 0.28), (0.018, 0.36)], (x, -0.15, z + 0.02), ("#2f6a4a", "#7a3a2a", "#c9992f", "#3a4a7a")[i % 4], segs=8)
    for s in (-1, 1):
        p.lathe([(0.26, 0), (0.33, 0.28), (0.26, 0.56)], (s * 1.45, -0.32, 0.03), "#7a5230", segs=12)
        p.cyl(0.33, 0.33, 0.04, (s * 1.45, -0.32, 0.31), DARK, segs=12)
    p.cyl(0.26, 0.26, 0.05, (0, -0.1, 2.28), CREAM, rot=(math.pi / 2, 0, 0), segs=16)
    p.tube([(0, -0.14, 2.28), (0.14, -0.14, 2.36)], 0.008, DARK, 4)
    p.tube([(0, -0.14, 2.28), (-0.05, -0.14, 2.14)], 0.008, DARK, 4)
    p.export()


def guild_banner():
    p = Prop("guild_banner", 55)
    # A tall hanging banner on a crossbar. Painted faces go on in Godot; this is the rod and fabric.
    p.cyl(0.03, 0.03, 1.5, (0, -0.1, 3.3), BRASS, rot=(0, math.pi / 2, 0), segs=6)
    for s in (-0.78, 0.78):
        p.ball(0.05, (s, -0.1, 3.3), BRASS)
    p.box((1.3, 0.03, 2.6), (0, -0.1, 1.98), "#5a2a6a", bevel=0.0)
    p.box((0.65, 0.03, 0.46), (-0.325, -0.1, 0.56), "#5a2a6a", rot=(0, 0.6, 0), bevel=0.0)
    p.box((0.65, 0.03, 0.46), (0.325, -0.1, 0.56), "#5a2a6a", rot=(0, -0.6, 0), bevel=0.0)
    p.box((1.32, 0.04, 0.1), (0, -0.11, 3.2), MUSTARD, bevel=0.0)
    p.lathe([(0.24, 0), (0.0, 0.42)], (0, -0.13, 2.2), MUSTARD, segs=5, rot=(math.pi / 2, 0, 0))
    p.export()


def lectern():
    p = Prop("lectern", 56)
    # The Registrar's stand in the Hall of Callings, with an enormous ledger.
    p.lathe([(0.4, 0), (0.42, 0.06), (0.2, 0.14), (0.12, 0.3), (0.12, 0.95)], (0, 0, 0), "#4f3a6a", segs=8)
    p.box((0.9, 0.62, 0.08), (0, 0, 1.08), "#6a4a2a", rot=(-0.35, 0, 0), bevel=0.02)
    p.box((0.74, 0.5, 0.1), (0, 0, 1.16), CREAM, rot=(-0.35, 0, 0), bevel=0.01)
    p.box((0.015, 0.5, 0.11), (0, -0.0, 1.17), DARK, rot=(-0.35, 0, 0), bevel=0.0)
    p.cyl(0.05, 0.05, 0.1, (0.46, 0.18, 1.3), DARK, segs=8)
    p.export()


# ------------------------------------------------------------ town dressing
def lamp_post():
    p = Prop("lamp_post", 57)
    p.lathe([(0.22, 0), (0.22, 0.05), (0.09, 0.18), (0.05, 0.3), (0.04, 3.6), (0.07, 3.7)], (0, 0, 0), DARK, segs=8)
    p.tube([(0, 0, 3.72), (0.1, 0, 3.98), (0.42, 0, 4.0)], 0.026, DARK, 6)
    p.lathe([(0.07, -0.26), (0.18, -0.14), (0.14, 0.0), (0.03, 0.03)], (0.42, 0, 3.96), "#3a3942", segs=8)
    p.ball(0.13, (0.42, 0, 3.72), GLOW)
    p.box((0.24, 0.04, 0.14), (0, 0.0, 2.2), MUSTARD, bevel=0.005)
    p.export()


def well():
    p = Prop("well", 58)
    # The square's old fountain: a stone basin, a stubby spout, coins and a warning sign.
    n = 12
    for i in range(n):
        a = i * math.tau / n
        p.box((1.62, 0.5, 0.72), (math.cos(a) * 3.2, math.sin(a) * 3.2, 0.36), "#7d7870" if i % 2 else "#6d6862", rot=(0, 0, a + math.pi / 2), bevel=0.05)
    p.cyl(3.0, 3.0, 0.03, (0, 0, 0.55), "#3a7a8c", segs=20)
    p.lathe([(0.7, 0), (0.7, 0.2), (0.34, 0.3), (0.22, 1.6), (0.44, 1.8), (0.1, 2.0), (0.05, 2.4)], (0, 0, 0.3), "#8a8478", segs=12)
    for i in range(14):
        a = p.rng.uniform(0, 6.3)
        r = p.rng.uniform(1.0, 2.7)
        p.cyl(0.05, 0.05, 0.015, (math.cos(a) * r, math.sin(a) * r, 0.57), BRASS, segs=7)
    p.export()


def market_stall():
    p = Prop("market_stall", 59)
    # A street stall with a striped canopy and goods out front.
    p.box((3.4, 1.2, 1.0), (0, 0, 0.5), WOOD, bevel=0.03)
    for x in (-1.6, 1.6):
        p.cyl(0.05, 0.05, 2.6, (x, 0.55, 1.3), WOOD_DARK, segs=6)
        p.cyl(0.05, 0.05, 2.2, (x, -0.55, 1.1), WOOD_DARK, segs=6)
    for i in range(6):
        x = -1.6 + (i + 0.5) * 3.2 / 6
        p.box((3.2 / 6, 1.7, 0.05), (x, 0, 2.42), "#c94a2a" if i % 2 else CREAM, rot=(0.22, 0, 0), bevel=0.0)
    for i in range(8):
        x = -1.4 + i * 0.4
        c = p.rng.choice(("#c94a2a", "#d0a32a", "#5a8a3a", "#e8e0c8"))
        p.ball(0.12, (x, p.rng.uniform(-0.35, 0.3), 1.12), c, lumpy=0.1, subdiv=1)
    p.export()


def barrels():
    p = Prop("barrels", 60)
    for x, y, c in ((0, 0, WOOD), (0.72, 0.1, "#7a5230"), (0.32, -0.62, WOOD)):
        p.lathe([(0.27, 0), (0.34, 0.45), (0.27, 0.9), (0.2, 0.9)], (x, y, 0), c, segs=12)
        for z in (0.2, 0.7):
            p.lathe([(0.32, -0.02), (0.33, 0.02)], (x, y, z), DARK, segs=12)
    p.export()


def crates():
    p = Prop("crates", 61)
    for size, loc, yaw in (((0.8, 0.8, 0.8), (0, 0, 0.4), 0.1), ((0.65, 0.65, 0.65), (0.1, 0, 1.12), 0.5), ((0.7, 0.7, 0.55), (0.88, 0.12, 0.28), -0.25)):
        p.box(size, loc, "#9c7038", rot=(0, 0, yaw), bevel=0.03)
        for sx in (-0.5, 0.5):
            p.box((0.07, size[1] + 0.03, size[2] + 0.02), (loc[0] + sx * size[0] * 0.8 * math.cos(yaw), loc[1] + sx * size[0] * 0.8 * math.sin(yaw), loc[2]), "#6d4e26", rot=(0, 0, yaw), bevel=0.0)
    p.export()


def barricade():
    p = Prop("barricade", 62)
    # 6 m of monster-camp barricade: spiked planks and scrap, lashed together.
    for i in range(13):
        x = -3 + i * 0.5
        h = p.rng.uniform(1.7, 2.5)
        p.box((0.42, 0.14, h), (x, 0, h / 2), p.rng.choice(("#6a4a2a", "#7a5a32", "#5a5a58", "#8a4a2a")), rot=(p.rng.uniform(-0.08, 0.08), p.rng.uniform(-0.07, 0.07), 0), bevel=0.012)
        if i % 3 == 0:
            p.lathe([(0.06, 0), (0.0, 0.5)], (x, 0, h - 0.05), STEEL, segs=6)
    for z in (0.7, 1.4):
        p.box((6.2, 0.1, 0.16), (0, -0.14, z), "#4a3a22", rot=(0.0, p.rng.uniform(-0.03, 0.03), 0), bevel=0.012)
    p.export()


def tent():
    p = Prop("tent", 63)
    # A patched camp tent: an A-frame of tarp with a guy rope.
    for s in (-1, 1):
        p.box((2.5, 3.6, 0.04), (s * 0.82, 0, 1.0), "#8a7a4a" if s < 0 else "#7a6a3e", rot=(0, s * 0.72, 0), bevel=0.0)
    p.box((1.3, 0.8, 0.04), (-0.75, -0.8, 1.05), "#a8452e", rot=(0, -0.72, 0), bevel=0.0)
    p.tube([(0, -1.8, 2.0), (0, 1.8, 2.0)], 0.04, WOOD_DARK, 6)
    for y in (-1.8, 1.8):
        p.tube([(0, y, 0), (0, y, 2.05)], 0.04, WOOD_DARK, 6)
        p.tube([(0, y, 2.0), (0, y * 1.5, 0.02)], 0.01, CREAM, 4)
    p.export()


def bonfire():
    p = Prop("bonfire", 64)
    for i in range(8):
        a = i * math.tau / 8
        p.ball(0.2, (math.cos(a) * 0.72, math.sin(a) * 0.72, 0.13), "#6d6862", lumpy=0.18, subdiv=1)
    for i in range(6):
        a = i * math.tau / 6
        p.tube([(math.cos(a) * 0.55, math.sin(a) * 0.55, 0.08), (0, 0, 0.8)], 0.07, "#3a2a1c", 6)
    p.lathe([(0.44, 0.1), (0.32, 0.56), (0.13, 1.1), (0.0, 1.5)], (0, 0, 0), "glow:#ff8a2a", segs=9)
    p.lathe([(0.24, 0.12), (0.16, 0.5), (0.0, 0.96)], (0.05, -0.2, 0), "glow:#ffd24a", segs=7)
    p.export()


def camp_banner():
    p = Prop("camp_banner", 65)
    # A war banner on a crooked pole.
    p.tube([(0, 0, 0), (0.04, 0, 2.2), (0, 0, 4.4)], 0.05, WOOD_DARK, 6)
    p.lathe([(0.06, 0), (0.0, 0.34)], (0, 0, 4.4), STEEL, segs=6)
    p.box((1.3, 0.03, 1.8), (0.68, 0, 3.4), "#a8281e", bevel=0.0)
    p.lathe([(0.22, 0), (0.02, 0.6)], (0.68, -0.03, 3.1), "#e8e0c8", segs=6, rot=(0, 0, 0))
    p.ball(0.3, (0, 0, 0.1), "#6d6862", lumpy=0.2, subdiv=1, scale=(1.3, 1.3, 0.6))
    p.export()


def gate():
    p = Prop("gate", 66)
    # Two heavy gate towers 11 m apart, joined by a beam, with the sign in Godot. Braziers on top.
    for x in (-5.5, 5.5):
        p.box((2.0, 2.0, 7.0), (x, 0, 3.5), "#5d5a60", bevel=0.08)
        p.box((2.4, 2.4, 0.4), (x, 0, 7.15), "#44424a", bevel=0.05)
        for z in (1.2, 3.2, 5.2):
            p.box((2.04, 2.04, 0.1), (x, 0, z), MUSTARD, bevel=0.0)
        p.lathe([(0.2, 0), (0.45, 0.36), (0.5, 0.42)], (x, 0, 7.35), DARK, segs=8)
        p.lathe([(0.34, 0.4), (0.2, 0.86), (0.0, 1.2)], (x, 0, 7.35), "glow:#ff9a2a", segs=7)
    p.box((13, 0.6, 0.6), (0, 0, 7.0), "#44424a", bevel=0.05)
    for x in (-3.5, 3.5):
        p.tube(p.sag((x, -0.3, 6.7), (x + (1.6 if x < 0 else -1.6), -0.3, 6.7), 0.3, 6), 0.02, STEEL, 5)
    p.export()


# ------------------------------------------------------------ floor heroes
def concrete_pillar():
    p = Prop("concrete_pillar", 67)
    # Floor 1: a car-park column with a hazard skirt, a bay number and a fat pipe.
    p.box((1.2, 1.2, 9.5), (0, 0, 4.75), "#807a72", bevel=0.05)
    p.box((1.4, 1.4, 0.6), (0, 0, 9.2), "#6d6862", bevel=0.05)
    for i in range(8):
        z = 0.15 + i * 0.26
        p.box((1.22, 1.22, 0.13), (0, 0, z), "#d9b32a" if i % 2 else "#222128", bevel=0.0)
    p.box((0.6, 0.02, 0.8), (0, -0.61, 3.0), CREAM, bevel=0.0)
    p.cyl(0.1, 0.1, 9.5, (0.56, -0.56, 4.75), "#7a4a2a", segs=8)
    p.export()


def car():
    p = Prop("car", 68)
    # Floor 1: a long-dead family hatchback. Rounded, dented, windows gone. Origin centre, long along Y.
    color = "#a8352a"
    p.box((1.85, 4.2, 0.6), (0, 0, 0.62), color, bevel=0.12)
    p.box((1.6, 2.2, 0.55), (0, 0.25, 1.17), color, rot=(0.03, 0, 0), bevel=0.14)
    p.box((1.45, 2.26, 0.42), (0, 0.25, 1.17), "#16151b", bevel=0.05)
    p.box((1.88, 0.12, 0.25), (0, -2.12, 0.48), STEEL, bevel=0.03)
    p.box((1.88, 0.12, 0.25), (0, 2.12, 0.48), STEEL, bevel=0.03)
    for x in (-0.6, 0.6):
        p.ball(0.11, (x, -2.12, 0.8), "#e8e0b0", scale=(1, 0.3, 1))
        p.box((0.24, 0.04, 0.12), (x, 2.12, 0.82), "#8a1a14", bevel=0.0)
    for x in (-0.92, 0.92):
        for y in (-1.3, 1.3):
            p.cyl(0.33, 0.33, 0.24, (x, y, 0.3), "#1f1e24", rot=(0, math.pi / 2, 0), segs=12)
    p.box((0.9, 1.1, 0.06), (0.08, -1.42, 0.95), "#8a2a22", rot=(-0.2, 0.08, 0.1), bevel=0.0)
    p.ball(0.3, (0.5, -0.7, 0.68), "#6a2a22", scale=(1.2, 1.2, 0.25), lumpy=0.25, subdiv=1)
    p.export()


def bus():
    p = Prop("bus", 69)
    # Floor 1: the Burning Bus.
    p.box((2.6, 11, 2.8), (0, 0, 1.75), "#c8a020", bevel=0.16)
    p.box((2.64, 9.8, 0.85), (0, 0, 2.3), "#16151b", bevel=0.03)
    for i in range(9):
        p.box((0.06, 0.06, 0.9), (-1.33, -4.5 + i * 1.1, 2.3), "#c8a020", bevel=0.0)
        p.box((0.06, 0.06, 0.9), (1.33, -4.5 + i * 1.1, 2.3), "#c8a020", bevel=0.0)
    p.box((2.62, 0.4, 0.2), (0, -5.55, 0.8), DARK, bevel=0.02)
    for x in (-1.15, 1.15):
        for y in (-3.6, 3.6):
            p.cyl(0.55, 0.55, 0.32, (x, y, 0.55), "#1f1e24", rot=(0, math.pi / 2, 0), segs=12)
    for i in range(11):
        x, y = p.rng.uniform(-1.1, 1.1), p.rng.uniform(-4.5, 4.5)
        h = p.rng.uniform(1.0, 2.6)
        p.lathe([(0.48, 0), (0.28, h * 0.45), (0.0, h)], (x, y, 3.05), "glow:#ff7a1a" if i % 3 else "glow:#ffd040", segs=7)
    p.export()


def washer():
    p = Prop("washer", 70)
    # Floor 2: a coin-op washing machine with a porthole door, dial panel and a lint-stained front.
    p.box((1.4, 1.4, 1.75), (0, 0, 0.88), "#dfe6e2", bevel=0.05)
    p.box((1.42, 0.18, 0.42), (0, -0.62, 1.6), "#2f7a7a", bevel=0.02)
    for x in (-0.42, 0.0, 0.42):
        p.cyl(0.08, 0.08, 0.06, (x, -0.74, 1.6), DARK, rot=(math.pi / 2, 0, 0), segs=10)
    p.lathe([(0.5, -0.02), (0.56, 0.0), (0.56, 0.08), (0.42, 0.1)], (0, -0.7, 0.76), STEEL, segs=18, rot=(math.pi / 2, 0, 0))
    p.cyl(0.42, 0.42, 0.04, (0, -0.72, 0.76), "#3a6a7a", rot=(math.pi / 2, 0, 0), segs=18)
    p.ball(0.28, (0.05, -0.68, 0.6), "#d8d8e8", lumpy=0.14, subdiv=1, scale=(1.1, 0.3, 0.8))
    p.box((0.34, 0.03, 0.12), (0.46, -0.71, 0.2), BRASS, bevel=0.0)
    p.export()


def laundry_cart():
    p = Prop("laundry_cart", 71)
    # Floor 2: a wire basket on wheels, overflowing with socks that have ideas of their own.
    p.lathe([(0.34, 0.2), (0.46, 0.95), (0.46, 0.98), (0.42, 0.98)], (0, 0, 0), "#7a8f96", segs=10)
    for a in (0.3, 2.4, 4.4):
        p.cyl(0.08, 0.08, 0.06, (math.cos(a) * 0.3, math.sin(a) * 0.3, 0.09), DARK, rot=(math.pi / 2, 0, a), segs=10)
        p.tube([(math.cos(a) * 0.3, math.sin(a) * 0.3, 0.1), (math.cos(a) * 0.32, math.sin(a) * 0.32, 0.26)], 0.018, STEEL, 5)
    for i in range(9):
        a = i * 1.7
        r = 0.08 + (i % 3) * 0.14
        p.ball(0.17, (math.cos(a) * r, math.sin(a) * r, 1.02 + (i % 2) * 0.12), ("#e8e0d0", "#c94a4a", "#5a8ac8", "#d8c840")[i % 4], lumpy=0.16, subdiv=1)
    p.export()


def clothesline():
    p = Prop("clothesline", 72)
    # Floor 2: 12 m of washing line between two poles, hung with giant laundry.
    for x in (-6, 6):
        p.cyl(0.08, 0.08, 6.6, (x, 0, 3.3), STEEL, segs=6)
        p.box((1.6, 0.08, 0.08), (x, 0, 6.5), STEEL, bevel=0.0)
    line = p.sag((-6, 0, 6.4), (6, 0, 6.4), 0.5, 14)
    p.tube(line, 0.014, CREAM, 4)
    colors = ("#e9e3d0", "#c44a4a", "#4a8aa8", "#d8b83a", "#8a5a9a")
    for i in range(1, 7):
        c = line[i * 2]
        w = p.rng.uniform(1.0, 1.5)
        h = p.rng.uniform(1.3, 2.3)
        p.box((w, 0.04, h), (c.x, c.y, c.z - h / 2), colors[i % 5], rot=(p.rng.uniform(-0.07, 0.07), 0, 0), bevel=0.0)
    p.export()


def sock_pile():
    p = Prop("sock_pile", 73)
    # Floor 2: Sock Mountain. Scaled up in Godot.
    colors = ("#e8e0d0", "#c94a4a", "#5a8ac8", "#d8c840", "#7ac86a", "#8a5a9a")
    for i in range(46):
        a = i * 2.4
        ring = (i % 15) / 15
        z = ring * 1.8
        r = (1.0 - ring) * 2.2
        p.ball(0.42, (math.cos(a) * r, math.sin(a) * r, z + 0.2), colors[i % 6], scale=(1.5, 0.7, 0.55), rot=(p.rng.uniform(-0.6, 0.6), p.rng.uniform(-0.6, 0.6), a), lumpy=0.08, subdiv=1)
    p.export()


def pipes():
    p = Prop("pipes", 74)
    # Floor 3: a copper stack venting broth steam, with a wheel valve and a dripping joint.
    p.tube([(0, 0, 0), (0, 0, 4.2), (0.3, 0, 4.9), (1.2, 0, 5.1), (2.1, 0, 5.1)], 0.22, "#a56a3a", 10)
    p.tube([(0.9, 0.5, 0), (0.9, 0.5, 2.2), (0.1, 0.1, 2.6)], 0.13, "#7a5230", 9)
    for z in (1.0, 2.4, 3.8):
        p.lathe([(0.27, -0.04), (0.28, 0.04)], (0, 0, z), BRASS, segs=10)
    p.lathe([(0.26, 0), (0.42, 0.1), (0.42, 0.4), (0.26, 0.5)], (0.9, 0.5, 0.0), "#6d4524", segs=9)
    p.lathe([(0.2, 0), (0.24, 0.03), (0.2, 0.06)], (-0.1, -0.42, 2.4), "#b4282a", segs=9, rot=(math.pi / 2, 0, 0))
    p.cyl(0.02, 0.02, 0.45, (-0.1, -0.42, 2.4), DARK, rot=(0, math.pi / 2, 0), segs=4)
    p.export()


def cauldron():
    p = Prop("cauldron", 75)
    # Floor 3: a pot for street soup, on legs, with a ladle somebody is still using.
    p.lathe([(0.0, 0.3), (0.6, 0.42), (0.92, 0.9), (0.8, 1.42), (0.86, 1.5), (0.76, 1.5)], (0, 0, 0), "#2c2b33", segs=16)
    p.cyl(0.76, 0.76, 0.02, (0, 0, 1.44), "#c26a2a", segs=16)
    for i in range(3):
        a = i * math.tau / 3
        p.tube([(math.cos(a) * 0.55, math.sin(a) * 0.55, 0.5), (math.cos(a) * 0.74, math.sin(a) * 0.74, 0)], 0.05, "#2c2b33", 6)
    for i in range(7):
        a = i * 1.9
        p.ball(0.09, (math.cos(a) * 0.45, math.sin(a) * 0.45, 1.47), "#e0955a", scale=(1, 1, 0.4), subdiv=1)
    p.tube([(0.2, 0.1, 1.42), (0.7, 0.42, 2.25)], 0.024, WOOD_DARK, 6)
    p.lathe([(0.0, 0), (0.1, 0.04), (0.12, 0.09)], (0.2, 0.1, 1.38), STEEL, segs=9)
    for x in (-0.5, 0.5):
        p.ball(0.22, (x, -0.25, 0.12), "#e88a2a", lumpy=0.2, subdiv=1, scale=(1.2, 1.1, 0.5))
    p.export()


def kiosk():
    p = Prop("kiosk", 76)
    # Floor 4: a mall kiosk ring selling phone cases to nobody, with its till light still on.
    n = 8
    for i in range(n):
        a = i * math.tau / n
        p.box((1.52, 0.2, 1.05), (math.cos(a) * 1.72, math.sin(a) * 1.72, 0.52), "#d8d0c0", rot=(0, 0, a + math.pi / 2), bevel=0.02)
        p.box((1.58, 0.45, 0.06), (math.cos(a) * 1.68, math.sin(a) * 1.68, 1.08), "#e8398c" if i % 2 else "#34b8c4", rot=(0, 0, a + math.pi / 2), bevel=0.012)
        for k in range(3):
            p.box((0.1, 0.2, 0.2), (math.cos(a + (k - 1) * 0.2) * 1.68, math.sin(a + (k - 1) * 0.2) * 1.68, 1.22), ("#f5c518", "#7bea6a", "#ff7a4a")[k], rot=(0, 0, a), bevel=0.0)
    p.cyl(0.14, 0.14, 2.5, (0, 0, 2.3), STEEL, segs=10)
    p.cyl(2.15, 2.15, 0.2, (0, 0, 3.55), "#e8398c", segs=16)
    p.cyl(2.2, 2.2, 0.08, (0, 0, 3.42), "glow:#fff0d0", segs=16)
    p.export()


def mannequin():
    p = Prop("mannequin", 77)
    # Floor 4: a shop dummy with no head, in last decade's fashion. It may have moved since you last looked.
    p.cyl(0.26, 0.26, 0.04, (0, 0, 0.02), STEEL, segs=10)
    for x in (-0.12, 0.12):
        p.tube([(x, 0, 0.05), (x * 1.1, 0, 0.95)], 0.07, "#e9dcc8", 8)
    p.lathe([(0.2, 0.9), (0.17, 1.1), (0.24, 1.4), (0.13, 1.56), (0.05, 1.62)], (0, 0, 0), "#e8398c", segs=10)
    for s in (-1, 1):
        p.tube([(s * 0.22, 0, 1.48), (s * 0.34, -0.1, 1.15), (s * 0.28, -0.32, 0.95)], 0.05, "#e9dcc8", 8)
    p.export()


def escalator():
    p = Prop("escalator", 78)
    # Floor 4: The Escalator to Nowhere. Climbs along +Y and stops in the air.
    for i in range(24):
        y = i * 0.46
        z = i * 0.34
        p.box((1.4, 0.48, 0.12), (0, y, z + 0.3), "#9aa0a8", bevel=0.01)
        p.box((1.4, 0.02, 0.32), (0, y - 0.23, z + 0.14), "#6d7178", bevel=0.0)
    for x in (-0.86, 0.86):
        p.box((0.2, 11.4, 1.0), (x, 5.2, 4.2), "#c8ccd2", rot=(0.637, 0, 0), bevel=0.02)
        p.box((0.1, 11.4, 0.1), (x, 4.92, 4.82), "#26252c", rot=(0.637, 0, 0), bevel=0.02)
    for y in (2.0, 7.0):
        p.box((2.0, 0.7, y * 0.74), (0, y, y * 0.37), "#6d7178", bevel=0.03)
    p.export()


def fence():
    p = Prop("fence", 79)
    # Floor 5: 6 m of white picket fence, slightly too clean.
    for i in range(24):
        x = -2.9 + i * 0.25
        p.box((0.14, 0.04, 1.05), (x, 0, 0.53), "#f4f1e8", bevel=0.0)
        p.lathe([(0.075, 0), (0.0, 0.14)], (x, 0, 1.05), "#f4f1e8", segs=4)
    for z in (0.32, 0.82):
        p.box((6.05, 0.05, 0.08), (0, 0.04, z), "#e4dfd0", bevel=0.0)
    for x in (-3, 3):
        p.box((0.14, 0.14, 1.25), (x, 0.02, 0.62), "#e4dfd0", bevel=0.01)
    p.export()


def mailbox():
    p = Prop("mailbox", 80)
    # Floor 5: a mailbox with its flag up, and hedges, and a little garden gnome who is definitely inert.
    p.cyl(0.05, 0.05, 1.1, (0, 0, 0.55), WOOD, segs=6)
    p.lathe([(0.0, -0.3), (0.16, -0.3), (0.18, 0.3), (0.0, 0.3)], (0, 0, 1.2), "#3a6aa8", segs=12, rot=(math.pi / 2, 0, 0))
    p.box((0.03, 0.1, 0.26), (0.18, 0.1, 1.35), "#c81a14", bevel=0.0)
    p.lathe([(0.1, 0), (0.09, 0.16), (0.06, 0.2)], (0.62, -0.2, 0), "#3a6ac8", segs=8)
    p.ball(0.07, (0.62, -0.2, 0.26), "#efc8a0")
    p.lathe([(0.08, 0), (0.0, 0.2)], (0.62, -0.2, 0.3), "#c81a1a", segs=8)
    p.export()


def hedge():
    p = Prop("hedge", 81)
    for i in range(7):
        p.ball(0.62, (-1.8 + i * 0.6, p.rng.uniform(-0.05, 0.05), 0.55), "#4f8a3a" if i % 2 else "#5f9a42", scale=(1, 0.85, 1), lumpy=0.12, subdiv=2)
    p.export()


def tree():
    p = Prop("tree", 82)
    # Floor 5: a neat suburban tree. Not one leaf out of place.
    p.lathe([(0.32, 0), (0.2, 0.5), (0.18, 2.6)], (0, 0, 0), "#6a4a2a", segs=9)
    for loc, r in (((0, 0, 3.5), 1.6), ((0.9, 0.3, 3.0), 1.05), ((-0.85, -0.25, 3.1), 1.1), ((0.1, -0.7, 4.3), 1.0)):
        p.ball(r, loc, "#4f9a3e", lumpy=0.09, subdiv=2)
    p.export()


def giant_trunk():
    p = Prop("giant_trunk", 83)
    # Floor 6: one trunk of the Canopy, with root flare, shelf fungi and glowing moss. Runs past the ceiling.
    p.lathe([(3.4, 0), (2.5, 0.8), (1.9, 2.2), (1.7, 5), (1.55, 20), (1.4, 42)], (0, 0, 0), "#3e2c1c", segs=14)
    for i in range(8):
        a = i * math.tau / 8 + 0.2
        p.tube([(math.cos(a) * 1.4, math.sin(a) * 1.4, 1.6), (math.cos(a) * 2.5, math.sin(a) * 2.5, 0.8), (math.cos(a) * 4.4, math.sin(a) * 4.4, 0.04)], 0.42, "#35261a", 8)
    for i in range(9):
        a = i * 1.7
        z = 1.5 + i * 0.75
        p.lathe([(0.0, 0), (0.56, 0.02), (0.5, 0.12), (0.0, 0.2)], (math.cos(a) * 1.72, math.sin(a) * 1.72, z), "glow:#5affc8" if i % 3 == 0 else "#a88a5a", segs=10)
    p.export()


def mushroom():
    p = Prop("mushroom", 84)
    # Floor 6: a cluster of glowing forest mushrooms and ferns.
    for x, y, h, c in ((0, 0, 1.0, "#c94a6a"), (0.6, 0.2, 0.6, "#5affc8"), (-0.45, 0.35, 0.72, "#d89a3a")):
        p.lathe([(0.1, 0), (0.07, h * 0.8), (0.08, h)], (x, y, 0), "#e8dcc0", segs=8)
        p.lathe([(0.02, h * 0.85), (h * 0.48, h * 0.92), (h * 0.34, h * 1.2), (0.0, h * 1.32)], (x, y, 0), ("glow:" + c) if c == "#5affc8" else c, segs=12)
    for i in range(6):
        a = i * 1.05
        p.ball(0.3, (math.cos(a) * 0.9, math.sin(a) * 0.9, 0.22), "#4f8a3a", scale=(1.4, 0.5, 0.2), rot=(0.5, 0, a), subdiv=1)
    p.export()


def rope_bridge():
    p = Prop("rope_bridge", 85)
    # Floor 6: 12 m of plank and rope, slung between trunks over the town's lanes.
    steps = 24
    for i in range(steps):
        t = i / (steps - 1)
        y = -6 + 12 * t
        z = 5.5 - 0.9 * (1 - (2 * t - 1) ** 2)
        p.box((1.3, 0.34, 0.05), (p.rng.uniform(-0.03, 0.03), y, z), "#7a5a32", rot=(0, 0, p.rng.uniform(-0.06, 0.06)), bevel=0.0)
    for x in (-0.68, 0.68):
        p.tube(p.sag((x, -6, 6.4), (x, 6, 6.4), 0.85, 16), 0.024, CREAM, 5)
        p.tube(p.sag((x, -6, 5.52), (x, 6, 5.52), 0.9, 16), 0.028, "#a8966a", 5)
    p.export()


def treehouse_platform():
    p = Prop("treehouse_platform", 86)
    # Floor 6: a deck wrapped around a trunk at 5.5 m, with stairs.
    p.cyl(4.2, 4.2, 0.2, (0, 0, 5.4), "#7a5a32", segs=12)
    for i in range(10):
        a = i * math.tau / 10
        p.tube([(math.cos(a) * 1.6, math.sin(a) * 1.6, 3.4), (math.cos(a) * 3.9, math.sin(a) * 3.9, 5.3)], 0.08, "#5a4228", 6)
        p.cyl(0.05, 0.05, 1.05, (math.cos(a) * 4.1, math.sin(a) * 4.1, 6.0), "#5a4228", segs=6)
    p.export()


if __name__ == "__main__":
    for build in (door_frame, window, awning, sign_bracket, counter, weapon_rack, armor_stand, food_shelf, potion_shelf, junk_pile, workbench, bed, table_set, bar_back, guild_banner, lectern, lamp_post, well, market_stall, barrels, crates, barricade, tent, bonfire, camp_banner, gate, concrete_pillar, car, bus, washer, laundry_cart, clothesline, sock_pile, pipes, cauldron, kiosk, mannequin, escalator, fence, mailbox, hedge, tree, giant_trunk, mushroom, rope_bridge, treehouse_platform):
        try:
            build()
        except Exception as error:
            print("FAILED", build.__name__, repr(error))
            raise
    print("TOWN KIT DONE")
