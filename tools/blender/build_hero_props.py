# The props you see most and from closest: vehicles, machines, barrels, crates and tyres, shaped properly rather than
# built from boxes. Lofted bodies, real panel seams, hardware and wear.
#   F:\Downstairs\Blender\blender.exe -b --python tools/blender/build_hero_props.py
# Exports to godot/models/props/town/ and godot/models/props/wilds/.
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_landing_kit as kit
from build_landing_kit import Prop, STEEL, DARK, BRASS, WOOD, WOOD_DARK, CREAM

BASE = os.path.dirname(kit.OUT)
TOWN = os.path.join(BASE, "town")
WILDS = os.path.join(BASE, "wilds")
os.makedirs(TOWN, exist_ok=True)
os.makedirs(WILDS, exist_ok=True)
CHROME = "#b8bcc0"
RUBBER = "#1b1a1f"
GLASS = "#1d2c38"
VOID = "#08070a"


def loft(p, sections, color, smooth=True):
    """Skins a closed shape through a list of (y, [(x, z), ...]) cross-sections, all with the same point count."""
    rings = [[p.bm.verts.new((x, y, z)) for x, z in points] for y, points in sections]
    n = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for i in range(n):
            p.bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    p.bm.faces.new(tuple(reversed(rings[0])))
    p.bm.faces.new(tuple(rings[-1]))
    p._finish_part([v for r in rings for v in r], color, smooth, (0, 0, 0), (0, 0, 0), 0.0)


def section(half_w, bottom, top, tuck=0.1, crown=0.11):
    """A car-body cross-section: flat floor, bulging sides, curved top, from left round to right."""
    return [(-half_w + tuck, bottom), (-half_w, bottom + (top - bottom) * 0.35), (-half_w * 0.98, bottom + (top - bottom) * 0.72), (-half_w + crown, top), (0.0, top + 0.015), (half_w - crown, top), (half_w * 0.98, bottom + (top - bottom) * 0.72), (half_w, bottom + (top - bottom) * 0.35), (half_w - tuck, bottom), (0.0, bottom - 0.02)]


def wheel(p, x, y, z, radius, tyre_w, side, rim=True):
    p.cyl(radius, radius, tyre_w, (x, y, z), RUBBER, rot=(0, math.pi / 2, 0), segs=16)
    if rim:
        p.lathe([(radius * 0.66, 0), (radius * 0.6, 0.012), (radius * 0.28, 0.03), (radius * 0.1, 0.04), (0.001, 0.045)], (x + side * tyre_w / 2, y, z), CHROME, segs=14, rot=(0, side * math.pi / 2, 0))
        for i in range(5):
            a = i * math.tau / 5
            p.cyl(0.018, 0.018, 0.012, (x + side * (tyre_w / 2 + 0.03), y + math.cos(a) * radius * 0.28, z + math.sin(a) * radius * 0.28), DARK, rot=(0, math.pi / 2, 0), segs=6)
    # tread blocks round the edge read as a real tyre up close
    for i in range(14):
        a = i * math.tau / 14
        p.box((tyre_w * 0.95, 0.05, 0.03), (x, y + math.cos(a) * radius, z + math.sin(a) * radius), "#101014", rot=(-a, 0, 0), bevel=0.0)


def car_body(p, color, wreck=False):
    H = 0.27
    trim = "#2a2730"
    # the main shell: low nose, high waist, short tail
    loft(p, [
        (-2.26, section(0.74, H + 0.1, 0.62, 0.1, 0.16)),
        (-2.1, section(0.86, H, 0.7)),
        (-1.45, section(0.92, H, 0.79)),
        (-0.9, section(0.93, H, 0.86)),
        (0.3, section(0.94, H, 0.9)),
        (1.5, section(0.93, H, 0.9)),
        (2.08, section(0.87, H, 0.86)),
        (2.26, section(0.76, H + 0.1, 0.72, 0.1, 0.16)),
    ], color)
    # wheel arches cut in dark
    for x in (-0.925, 0.925):
        for y in (-1.35, 1.35):
            p.cyl(0.43, 0.43, 0.03, (x * 1.005, y, 0.33), "#0d0c10", rot=(0, math.pi / 2, 0), segs=16)
    # cabin: glass as one piece, with the roof and pillars laid over it
    glass = VOID if wreck else GLASS
    loft(p, [(-0.98, section(0.82, 0.84, 0.9, 0.0, 0.1)), (-0.32, section(0.72, 0.84, 1.36, 0.0, 0.14)), (0.95, section(0.71, 0.84, 1.38, 0.0, 0.14)), (1.72, section(0.8, 0.84, 0.92, 0.0, 0.1))], glass)
    loft(p, [(-0.42, section(0.68, 1.36, 1.41, 0.0, 0.12)), (1.02, section(0.68, 1.37, 1.42, 0.0, 0.12))], color)
    for s in (-1, 1):
        p.tube([(s * 0.81, -0.97, 0.88), (s * 0.68, -0.38, 1.38)], 0.04, color, 6)
        p.tube([(s * 0.77, 0.32, 0.88), (s * 0.71, 0.32, 1.38)], 0.04, color, 6)
        p.tube([(s * 0.8, 1.68, 0.9), (s * 0.69, 1.0, 1.39)], 0.055, color, 6)
        # door seams, handles, sill and the crease along the waist
        for y in (-0.72, 0.32, 1.2):
            p.box((0.012, 0.022, 0.5), (s * 0.945, y, 0.6), VOID, bevel=0.0)
        for y in (-0.22, 0.82):
            p.box((0.03, 0.15, 0.035), (s * 0.955, y, 0.76), CHROME, bevel=0.008)
        p.box((0.016, 2.0, 0.024), (s * 0.95, 0.25, 0.8), trim, bevel=0.0)
        p.box((0.03, 3.3, 0.1), (s * 0.9, 0.0, 0.32), RUBBER, bevel=0.01)
        if not wreck:
            p.lathe([(0.0, 0), (0.06, 0.02), (0.08, 0.07), (0.05, 0.11)], (s * 0.92, -0.72, 0.92), color, segs=8, rot=(0, s * math.pi / 2, 0))
    # nose: grille, lamps, bumper, plate
    p.box((1.05, 0.04, 0.17), (0, -2.25, 0.57), VOID, bevel=0.01)
    for i in range(5):
        p.box((1.04, 0.05, 0.014), (0, -2.26, 0.5 + i * 0.033), CHROME, bevel=0.0)
    p.box((1.8, 0.14, 0.16), (0, -2.3, 0.4), CHROME, bevel=0.05)
    p.box((0.42, 0.02, 0.11), (0, -2.38, 0.4), CREAM, bevel=0.0)
    for s in (-1, 1):
        p.ball(0.095, (s * 0.65, -2.2, 0.6), "#20201f" if wreck else "#efe8bc", scale=(1.3, 0.34, 0.8))
        p.box((0.15, 0.02, 0.05), (s * 0.66, -2.24, 0.48), "#e09a2a", bevel=0.0)
    # hood seam, wipers
    p.box((1.45, 0.014, 0.012), (0, -1.0, 0.875), VOID, bevel=0.0)
    p.box((1.5, 0.014, 0.012), (0, -2.0, 0.715), VOID, bevel=0.0)
    for s in (-1, 1):
        p.box((0.014, 1.0, 0.012), (s * 0.72, -1.5, 0.815), VOID, rot=(0.13, 0, 0), bevel=0.0)
    if not wreck:
        for x in (-0.3, 0.25):
            p.tube([(x, -0.95, 0.91), (x + 0.4, -0.72, 1.03)], 0.008, DARK, 4)
    # tail: lamps, bumper, plate, boot lid
    p.box((1.82, 0.14, 0.16), (0, 2.3, 0.44), CHROME, bevel=0.05)
    p.box((0.42, 0.02, 0.12), (0, 2.28, 0.62), CREAM, bevel=0.0)
    p.box((1.4, 0.012, 0.012), (0, 1.75, 0.885), VOID, bevel=0.0)
    for s in (-1, 1):
        p.box((0.34, 0.03, 0.14), (s * 0.58, 2.27, 0.68), "#3a1412" if wreck else "#a81a14", bevel=0.01)
    p.tube([(-0.6, 2.25, 0.3), (-0.6, 2.55, 0.26)], 0.03, "#4a4a50", 6)
    p.tube([(-0.55, 0.9, 1.42), (-0.62, 1.1, 1.82)], 0.006, DARK, 3)


def car_parked(name, color, seed, dressing=None):
    p = Prop(name, seed)
    car_body(p, color)
    for x, side in ((-0.86, -1), (0.86, 1)):
        for y in (-1.35, 1.35):
            wheel(p, x, y, 0.33, 0.33, 0.22, side)
    # the years of neglect: rust at the seams, dents, a ticket on the windscreen
    for i in range(10):
        s = p.rng.choice((-1, 1))
        p.ball(p.rng.uniform(0.05, 0.14), (s * 0.94, p.rng.uniform(-1.9, 1.9), p.rng.uniform(0.35, 0.55)), "#6d3a1e", scale=(0.15, 1.5, 0.8), lumpy=0.2, subdiv=1)
    p.box((0.2, 0.02, 0.28), (0.45, -0.72, 1.07), "#e8dcb0", rot=(0.88, 0, 0.1), bevel=0.0)
    if dressing:
        dressing(p)
    p.export()


def _roof_rack(p):
    for y in (-0.15, 0.75):
        p.box((1.4, 0.05, 0.05), (0, y, 1.48), DARK, bevel=0.0)
    p.box((0.9, 0.7, 0.26), (0.1, 0.32, 1.64), "#7a5a2a", rot=(0, 0, 0.08), bevel=0.04)
    p.box((0.05, 0.72, 0.28), (0.1, 0.32, 1.64), DARK, rot=(0, 0, 0.08), bevel=0.0)


def _open_door(p):
    # the driver's door hanging open, which nobody ever explains
    p.box((1.05, 0.06, 0.62), (-1.28, -0.2, 0.62), "#7a2a22", rot=(0, 0, 0.72), bevel=0.02)
    p.box((1.0, 0.04, 0.42), (-1.26, -0.21, 1.1), VOID, rot=(0, 0, 0.72), bevel=0.0)


def _bay_tag(p):
    p.box((0.9, 0.5, 0.04), (0, -1.45, 0.82), "#e8e0c8", rot=(0.1, 0, 0.2), bevel=0.0)


def car_wreck():
    p = Prop("car_wreck", 203)
    car_body(p, "#3a2e2a", wreck=True)
    # on the rims: no rubber, sagging onto the ground
    for x, side in ((-0.86, -1), (0.86, 1)):
        for y in (-1.35, 1.35):
            p.cyl(0.23, 0.23, 0.12, (x, y, 0.2), "#5a524a", rot=(0, math.pi / 2, 0), segs=12)
            p.cyl(0.1, 0.1, 0.14, (x, y, 0.2), "#2a2622", rot=(0, math.pi / 2, 0), segs=8)
    # bites taken out of the roof, hood popped, char and rust
    for i in range(7):
        p.tube([(-0.62 + i * 0.2, -0.3, 1.42), (-0.56 + i * 0.2, -0.12, 1.2)], 0.028, VOID, 4)
    p.box((1.5, 1.05, 0.04), (0, -1.4, 1.06), "#4a3028", rot=(-0.72, 0.06, 0.05), bevel=0.0)
    p.box((1.3, 0.8, 0.22), (0, -1.4, 0.62), "#26221f", bevel=0.03)
    p.tube([(-0.4, -1.5, 0.72), (-0.1, -1.1, 0.85), (0.4, -1.5, 0.72)], 0.03, "#7a4a2a", 5)
    for i in range(18):
        s = p.rng.choice((-1, 1))
        p.ball(p.rng.uniform(0.08, 0.22), (s * 0.94, p.rng.uniform(-2.0, 2.0), p.rng.uniform(0.32, 0.82)), p.rng.choice(("#6d3a1e", "#1a1614", "#8a4a22")), scale=(0.15, 1.5, 0.9), lumpy=0.25, subdiv=1)
    p.export()


def bus():
    p = Prop("bus", 69)
    yellow = "#c8a020"
    # A city bus with a rounded body, a row of windows, doors, destination sign and a good deal of fire.
    def bus_section(top, half=1.28):
        return [(-half + 0.08, 0.55), (-half, 0.9), (-half, top - 0.5), (-half + 0.3, top - 0.05), (0.0, top), (half - 0.3, top - 0.05), (half, top - 0.5), (half, 0.9), (half - 0.08, 0.55), (0.0, 0.52)]
    loft(p, [(-5.55, bus_section(2.75, 1.2)), (-5.3, bus_section(3.08)), (5.3, bus_section(3.12)), (5.5, bus_section(2.9, 1.22))], yellow)
    for s in (-1, 1):
        p.box((0.03, 10.2, 0.08), (s * 1.29, 0, 1.55), "#8a1f18", bevel=0.0)
        p.box((0.03, 10.2, 0.04), (s * 1.29, 0, 1.62), CREAM, bevel=0.0)
        for i in range(9):
            y = -4.1 + i * 1.04
            p.box((0.03, 0.9, 0.72), (s * 1.285, y, 2.3), GLASS if i % 3 else VOID, bevel=0.012)
            p.box((0.05, 0.05, 0.84), (s * 1.3, y + 0.5, 2.3), DARK, bevel=0.0)
        for y in (-4.2, -1.4, 1.4, 4.2):
            p.box((0.012, 0.02, 2.5), (s * 1.292, y, 1.9), VOID, bevel=0.0)
    for y in (-4.55, -3.95):
        p.box((0.05, 0.56, 1.95), (-1.3, y, 1.55), GLASS, bevel=0.012)
        p.box((0.06, 0.05, 2.0), (-1.32, y + 0.3, 1.55), DARK, bevel=0.0)
    # front: big windscreen, sign, lamps, bumper
    p.box((2.2, 0.03, 1.05), (0, -5.55, 2.26), GLASS, bevel=0.02)
    p.box((0.05, 0.05, 1.05), (0, -5.58, 2.26), DARK, bevel=0.0)
    p.box((1.5, 0.05, 0.28), (0, -5.5, 2.95), VOID, bevel=0.01)
    p.box((1.1, 0.02, 0.14), (0, -5.54, 2.95), "glow:#ffa030", bevel=0.0)
    p.box((2.4, 0.2, 0.28), (0, -5.62, 0.72), DARK, bevel=0.06)
    p.box((0.52, 0.02, 0.14), (0, -5.74, 0.74), CREAM, bevel=0.0)
    for s in (-1, 1):
        p.ball(0.13, (s * 0.92, -5.56, 1.12), "#e8e0b0", scale=(1, 0.3, 1))
        p.tube([(s * 1.22, -5.3, 2.8), (s * 1.62, -5.42, 2.75), (s * 1.62, -5.42, 2.32)], 0.024, DARK, 5)
        p.box((0.18, 0.05, 0.42), (s * 1.62, -5.42, 2.2), VOID, bevel=0.012)
    for x, side in ((-1.15, -1), (1.15, 1)):
        for y in (-3.6, 3.6):
            p.cyl(0.66, 0.66, 0.03, (x * 1.125, y, 0.62), VOID, rot=(0, math.pi / 2, 0), segs=16)
            wheel(p, x, y, 0.55, 0.55, 0.32, side)
    # roof vents, rust streaks and burn marks
    for y in (-3.0, 0.0, 3.0):
        p.box((1.0, 0.8, 0.14), (0, y, 3.17), "#6d6862", bevel=0.03)
    for i in range(24):
        p.ball(p.rng.uniform(0.1, 0.34), (p.rng.choice((-1.28, 1.28)), p.rng.uniform(-5, 5), p.rng.uniform(1.2, 3.1)), p.rng.choice(("#1a1412", "#2a1c14", "#6d3a1e")), scale=(0.08, 1.4, 1.5), lumpy=0.25, subdiv=1)
    for i in range(11):
        x, y = p.rng.uniform(-1.0, 1.0), p.rng.uniform(-4.5, 4.5)
        h = p.rng.uniform(1.0, 2.6)
        p.lathe([(0.48, 0), (0.28, h * 0.45), (0.0, h)], (x, y, 3.1), "glow:#ff7a1a" if i % 3 else "glow:#ffd040", segs=7)
    p.export()


def car_town():
    # the wreck that sits around Stairwell Camp: a red hatchback, stripped for parts
    p = Prop("car", 68)
    car_body(p, "#a8352a")
    for x, side in ((-0.86, -1), (0.86, 1)):
        for y, rim in ((-1.35, True), (1.35, False)):
            wheel(p, x, y, 0.33, 0.33, 0.22, side, rim)
    p.box((0.9, 1.1, 0.04), (0.08, -1.42, 0.98), "#8a2a22", rot=(-0.22, 0.08, 0.1), bevel=0.0)
    for i in range(8):
        s = p.rng.choice((-1, 1))
        p.ball(p.rng.uniform(0.1, 0.22), (s * 0.94, p.rng.uniform(-1.9, 1.9), p.rng.uniform(0.35, 0.7)), "#6a2a1e", scale=(0.15, 1.5, 0.9), lumpy=0.25, subdiv=1)
    p.export()


def washer():
    p = Prop("washer", 70)
    # A coin-op washing machine: rounded cabinet, porthole door with a thick gasket, soap drawer, dials and coin box.
    white = "#dfe6e2"
    p.box((1.4, 1.36, 1.72), (0, 0, 0.92), white, bevel=0.07)
    p.box((1.32, 1.28, 0.1), (0, 0, 1.82), "#c8d2ce", bevel=0.04)
    p.box((1.3, 1.26, 0.09), (0, 0, 0.05), "#26262c", bevel=0.02)
    for x in (-0.55, 0.55):
        for y in (-0.5, 0.5):
            p.cyl(0.06, 0.07, 0.08, (x, y, 0.04), RUBBER, segs=8)
    # control panel: drawer, dials, read-out, coin box
    p.box((1.32, 0.09, 0.38), (0, -0.7, 1.55), "#2f7a7a", bevel=0.025)
    p.box((0.42, 0.05, 0.25), (-0.38, -0.75, 1.55), "#d6dcd8", bevel=0.012)
    p.box((0.34, 0.02, 0.05), (-0.38, -0.78, 1.6), DARK, bevel=0.0)
    for x, c in ((0.08, CHROME), (0.34, CHROME)):
        p.lathe([(0.075, 0), (0.07, 0.03), (0.055, 0.06), (0.001, 0.065)], (x, -0.74, 1.55), c, segs=12, rot=(math.pi / 2, 0, 0))
        p.box((0.015, 0.02, 0.08), (x, -0.81, 1.57), DARK, bevel=0.0)
    p.box((0.13, 0.03, 0.16), (0.53, -0.76, 1.55), BRASS, bevel=0.01)
    p.box((0.05, 0.02, 0.012), (0.53, -0.78, 1.57), VOID, bevel=0.0)
    # the door: chrome ring, rubber gasket, glass with a load inside
    p.lathe([(0.56, 0), (0.6, 0.03), (0.6, 0.09), (0.52, 0.13), (0.44, 0.13), (0.42, 0.09)], (0, -0.68, 0.82), CHROME, segs=22, rot=(math.pi / 2, 0, 0))
    p.lathe([(0.45, 0), (0.46, 0.02), (0.42, 0.05)], (0, -0.69, 0.82), RUBBER, segs=22, rot=(math.pi / 2, 0, 0))
    p.cyl(0.42, 0.42, 0.03, (0, -0.72, 0.82), "#2f5a68", rot=(math.pi / 2, 0, 0), segs=20)
    for i in range(6):
        a = i * 1.05
        p.ball(0.15, (math.cos(a) * 0.19, -0.7, 0.72 + math.sin(a) * 0.13), ("#e8e0d0", "#c94a4a", "#5a8ac8", "#d8c840")[i % 4], scale=(1.15, 0.3, 0.8), lumpy=0.14, subdiv=1)
    p.box((0.1, 0.08, 0.26), (0.56, -0.74, 0.82), CHROME, bevel=0.02)
    p.cyl(0.04, 0.04, 0.03, (-0.58, -0.71, 1.06), DARK, rot=(math.pi / 2, 0, 0), segs=8)
    # panel seams, sticker, drips of old soap, a dent, a hose out the back
    p.box((1.4, 0.012, 0.015), (0, -0.69, 0.2), VOID, bevel=0.0)
    p.box((0.46, 0.012, 0.18), (0, -0.69, 0.12), "#c8d2ce", bevel=0.0)
    p.box((0.28, 0.012, 0.2), (-0.5, -0.69, 0.34), "#f0d84a", rot=(0, 0.12, 0), bevel=0.0)
    p.ball(0.26, (0.7, 0.1, 1.05), "#c0c8c4", scale=(0.08, 1.2, 1.0), lumpy=0.2, subdiv=1)
    for i in range(5):
        x = p.rng.uniform(-0.5, 0.5)
        p.box((0.05, 0.012, p.rng.uniform(0.1, 0.3)), (x, -0.695, 1.22), "#9ab0aa", bevel=0.0)
    p.tube([(0.3, 0.68, 0.4), (0.5, 1.0, 0.25), (0.75, 1.3, 0.06), (1.2, 1.5, 0.05)], 0.035, "#7a8f96", 6)
    p.export()


def barrels():
    p = Prop("barrels", 60)
    # Three proper coopered barrels: bulging staves, iron hoops, bungs and a tin lid.
    def barrel(x, y, c, lid=False):
        n = 12
        for i in range(n):
            a = i * math.tau / n
            nxt = (i + 0.92) * math.tau / n
            mid = (a + nxt) / 2
            profile = [(0.0, 0.27), (0.22, 0.32), (0.45, 0.345), (0.68, 0.32), (0.9, 0.27)]
            points = []
            for z, r in profile:
                points.append((z, r))
            rings = []
            for z, r in points:
                rings.append([(x + math.cos(a) * r, y + math.sin(a) * r, z), (x + math.cos(nxt) * r, y + math.sin(nxt) * r, z), (x + math.cos(nxt) * (r - 0.03), y + math.sin(nxt) * (r - 0.03), z), (x + math.cos(a) * (r - 0.03), y + math.sin(a) * (r - 0.03), z)])
            vs = [[p.bm.verts.new(v) for v in ring] for ring in rings]
            for r0, r1 in zip(vs, vs[1:]):
                for k in range(4):
                    p.bm.faces.new((r0[k], r0[(k + 1) % 4], r1[(k + 1) % 4], r1[k]))
            p.bm.faces.new(tuple(reversed(vs[0])))
            p.bm.faces.new(tuple(vs[-1]))
            tint = c if i % 3 else "#7a5230"
            p._finish_part([v for r in vs for v in r], tint, False, (0, 0, 0), (0, 0, 0), 0.0)
        p.cyl(0.25, 0.25, 0.02, (x, y, 0.84), "#4a3220", segs=12)
        p.cyl(0.25, 0.25, 0.04, (x, y, 0.1), "#3a2818", segs=12)
        for z, r in ((0.16, 0.315), (0.3, 0.335), (0.62, 0.335), (0.76, 0.315)):
            p.lathe([(r, z - 0.02), (r + 0.012, z), (r, z + 0.02)], (x, y, 0), "#46454c", segs=14)
        p.cyl(0.03, 0.03, 0.03, (x + 0.1, y - 0.05, 0.85), "#a07a4a", segs=6)
        if lid:
            p.cyl(0.29, 0.29, 0.04, (x, y, 0.92), STEEL, rot=(0.09, 0.05, 0), segs=14)
    barrel(0, 0, WOOD)
    barrel(0.72, 0.1, "#9a6a34", True)
    barrel(0.32, -0.62, WOOD)
    p.export()


def crates():
    p = Prop("crates", 61)
    # Slatted packing crates with corner posts, cross braces and stencilled sides.
    def crate(size, loc, yaw, plank):
        w, d, h = size
        cos_y, sin_y = math.cos(yaw), math.sin(yaw)
        def at(x, y, z):
            return (loc[0] + x * cos_y - y * sin_y, loc[1] + x * sin_y + y * cos_y, loc[2] - h / 2 + z)
        p.box((w * 0.94, d * 0.94, h * 0.94), (loc[0], loc[1], loc[2]), "#3a2a18", rot=(0, 0, yaw), bevel=0.0)
        slats = 4
        for i in range(slats):
            z = (i + 0.5) * h / slats
            for sy in (-1, 1):
                p.box((w, 0.03, h / slats * 0.84), at(0, sy * d / 2, z), plank if (i + sy) % 2 else "#a57c44", rot=(0, 0, yaw), bevel=0.004, wonk=0.006)
            for sx in (-1, 1):
                p.box((0.03, d, h / slats * 0.84), at(sx * w / 2, 0, z), plank if i % 2 else "#a57c44", rot=(0, 0, yaw), bevel=0.004, wonk=0.006)
        for sx in (-1, 1):
            for sy in (-1, 1):
                p.box((0.08, 0.08, h + 0.02), at(sx * (w / 2 + 0.008), sy * (d / 2 + 0.008), h / 2), "#6d4e26", rot=(0, 0, yaw), bevel=0.012)
        for sy in (-1, 1):
            p.tube([at(-w / 2 + 0.04, sy * (d / 2 + 0.03), 0.04), at(w / 2 - 0.04, sy * (d / 2 + 0.03), h - 0.04)], 0.018, "#6d4e26", 4)
        for i in range(4):
            p.box((w * 0.98, d * 0.2, 0.03), at(0, -d * 0.36 + i * d * 0.24, h + 0.012), plank, rot=(0, 0, yaw), bevel=0.003)
        p.box((w * 0.32, 0.012, h * 0.18), at(-w * 0.14, -d / 2 - 0.03, h * 0.62), "#1f1a14", rot=(0, 0, yaw), bevel=0.0)
    crate((0.8, 0.8, 0.8), (0, 0, 0.4), 0.1, "#9c7038")
    crate((0.64, 0.64, 0.62), (0.1, 0, 1.13), 0.5, "#b08648")
    crate((0.7, 0.7, 0.56), (0.9, 0.12, 0.28), -0.25, "#8a6230")
    p.export()


def tires():
    p = Prop("tires", 19)
    # A stack of real tyres: tread, sidewall bulge, rims still on some, and one painted yellow for the arena.
    def tyre(loc, color, tilt=(0, 0, 0), rim=False):
        profile = [(0.2, 0), (0.33, 0.0), (0.42, 0.05), (0.44, 0.13), (0.42, 0.21), (0.33, 0.26), (0.2, 0.26), (0.17, 0.13)]
        p.lathe(profile, loc, color, segs=22, rot=tilt)
        for i in range(22):
            a = i * math.tau / 22
            p.box((0.05, 0.03, 0.16), (loc[0] + math.cos(a) * 0.445, loc[1] + math.sin(a) * 0.445, loc[2] + 0.13), "#0e0d11" if color == "#26252b" else "#a89222", rot=(0, 0, a), bevel=0.0)
        if rim:
            p.cyl(0.2, 0.2, 0.14, (loc[0], loc[1], loc[2] + 0.13), "#7a7a80", segs=14)
    for k, (x, y) in enumerate(((0, 0), (0.02, 0.03), (-0.03, 0.0), (0.03, -0.02))):
        tyre((x, y, k * 0.26), "#26252b", rim=k == 2)
    tyre((0.9, -0.1, 0), "#d7c13a")
    p.export()


def lane_clutter_wrecked_cart():
    p = Prop("shopping_cart", 215)
    # A shopping cart on its side-ish: wire basket, child seat, wonky wheels. Every car park has one.
    for z in (0.45, 0.6, 0.75, 0.9, 1.0):
        half = 0.28 + (z - 0.45) * 0.1
        pts = [(-half, -0.45, z), (half, -0.45, z), (half + 0.03, 0.45, z), (-half - 0.03, 0.45, z), (-half, -0.45, z)]
        p.tube(pts, 0.008, CHROME, 4)
    for x in (-0.2, -0.1, 0, 0.1, 0.2):
        p.tube([(x, -0.45, 0.45), (x, -0.45, 1.0)], 0.006, CHROME, 3)
        p.tube([(x, 0.45, 0.45), (x * 1.1, 0.45, 1.0)], 0.006, CHROME, 3)
    for y in (-0.3, -0.1, 0.1, 0.3):
        for s in (-1, 1):
            p.tube([(s * 0.28, y, 0.45), (s * 0.33, y, 1.0)], 0.006, CHROME, 3)
    p.tube([(-0.3, 0.45, 1.02), (-0.34, 0.68, 1.14), (0.34, 0.68, 1.14), (0.3, 0.45, 1.02)], 0.015, "#c94a2a", 6)
    for x, y in ((-0.24, -0.4), (0.24, -0.4), (-0.24, 0.4), (0.24, 0.4)):
        p.tube([(x, y, 0.45), (x, y, 0.1)], 0.012, STEEL, 4)
        p.cyl(0.06, 0.06, 0.04, (x, y, 0.06), RUBBER, rot=(0, math.pi / 2, 0), segs=10)
    p.box((0.34, 0.3, 0.03), (0.02, 0.05, 0.47), "#d4bb83", rot=(0, 0, 0.3), bevel=0.0)
    p.export()


if __name__ == "__main__":
    kit.OUT = TOWN
    for build in (car_town, bus, washer, barrels, crates, tires):
        build()
    kit.OUT = WILDS
    car_parked("car_parked", "#3e6288", 204, _roof_rack)
    car_parked("car_parked_red", "#a8402e", 205, _bay_tag)
    car_parked("car_parked_cream", "#c8bc92", 206)
    car_parked("car_parked_green", "#4c7a54", 207, _open_door)
    car_wreck()
    lane_clutter_wrecked_cart()
    print("HERO PROPS DONE")
