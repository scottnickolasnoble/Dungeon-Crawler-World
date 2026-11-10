# The fine detail that goes over every floor: houses, windows, grass, bushes, ground litter and the things that watch you.
#   F:\Downstairs\Blender\blender.exe -b --python tools/blender/build_dressing.py [-- name name ...]
# Exports to godot/models/props/wilds/<name>.glb.
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_landing_kit as kit
from build_landing_kit import Prop, BRASS, WOOD_DARK
from build_wilds_f2_f3 import BONE, BLOOD, RUBBER
from build_wilds_f4_f6 import LEAF, LEAF_DARK

kit.OUT = os.path.join(os.path.dirname(kit.OUT), "wilds")
SHADOW = "#0d0c12"
GLASS = "#22303a"
GLOW = "glow:#d8a050"
LAWN = "#5f9a42"
LAWN_DARK = "#3f7a2e"
TWIG = "#3a2c22"


def silhouette(p, x, y, h=1.0):
    """A dark head and shoulders, seen through glass."""
    p.ball(0.17 * h, (x, y, 0.2 * h), SHADOW, scale=(0.9, 0.3, 1.1), subdiv=1)
    p.ball(0.3 * h, (x, y, -0.34 * h), SHADOW, scale=(1.0, 0.25, 1.1), subdiv=1)


def handprint(p, x, y, z, color=BLOOD, s=1.0):
    p.ball(0.07 * s, (x, y, z), color, scale=(1, 0.08, 1.2), subdiv=1)
    for i in range(4):
        p.box((0.022 * s, 0.01, 0.1 * s), (x - 0.05 * s + i * 0.034 * s, y, z + 0.12 * s), color, rot=(0, -0.3 + i * 0.2, 0), bevel=0.0)


# ------------------------------------------------------------ windows: same size as the town's lit window
def _window_frame(p, glass, lit_panes=True):
    for x in (-0.82, 0.82):
        p.box((0.14, 0.52, 1.6), (x, 0, 0), WOOD_DARK, bevel=0.02)
    for z in (-0.8, 0.8):
        p.box((1.78, 0.52, 0.14), (0, 0, z), WOOD_DARK, bevel=0.02)
    p.box((1.52, 0.44, 1.48), (0, 0, 0), glass, bevel=0.0)
    if lit_panes:
        p.box((0.06, 0.5, 1.5), (0, 0, 0), WOOD_DARK, bevel=0.0)
        p.box((1.54, 0.5, 0.06), (0, 0, 0), WOOD_DARK, bevel=0.0)
    p.box((2.0, 0.62, 0.1), (0, 0, -0.9), "#6b5238", bevel=0.02)


def window_figure():
    p = Prop("window_figure", 600)
    # A lit window, and someone standing at it. Not doing anything. Just standing.
    _window_frame(p, GLOW)
    for y in (-0.235, 0.235):
        silhouette(p, 0.12, y, 1.25)
    p.export()


def window_faces():
    p = Prop("window_faces", 601)
    # Hands flat on the glass from the inside, and one face pressed up between them.
    _window_frame(p, "glow:#d8e8b0", lit_panes=False)
    for y in (-0.235, 0.235):
        handprint(p, -0.45, y, 0.1, "#2a2a30", 1.6)
        handprint(p, 0.45, y, 0.18, "#2a2a30", 1.6)
        p.ball(0.2, (0, y, 0.02), "#c8b8a0", scale=(0.9, 0.12, 1.15), subdiv=1)
        for s in (-1, 1):
            p.ball(0.045, (s * 0.07, y * 1.08, 0.07), SHADOW, subdiv=0)
        p.ball(0.05, (0, y * 1.08, -0.08), SHADOW, scale=(1, 1, 1.3), subdiv=0)
    p.export()


def window_boarded():
    p = Prop("window_boarded", 602)
    # Boarded up. Whoever did it was on the inside, and they used everything they had.
    _window_frame(p, "#14141a", lit_panes=False)
    for y in (-0.27, 0.27):
        for i, (z, a) in enumerate(((0.5, 0.12), (0.15, -0.1), (-0.2, 0.08), (-0.52, -0.14))):
            p.box((1.9, 0.04, 0.24), (0, y, z), p.rng.choice(("#6a5238", "#5a4630", "#7a5e40")), rot=(0, a, 0), bevel=0.0, wonk=0.01)
            for s in (-1, 1):
                p.ball(0.02, (s * 0.76, y * 1.1, z + s * a * 0.76), "#2a2a2a", subdiv=0)
    p.export()


def window_broken():
    p = Prop("window_broken", 603)
    # Dark, smashed, from the inside: the glass is all on the pavement. Something's still breathing on what's left.
    _window_frame(p, SHADOW, lit_panes=False)
    for y in (-0.24, 0.24):
        for x, z, a in ((-0.55, 0.45, 0.5), (0.5, 0.5, -0.6), (-0.6, -0.5, -0.4), (0.55, -0.45, 0.7)):
            p.lathe([(0.26, 0), (0.001, 0.62)], (x, y, z), "#4a5a64", segs=3, rot=(0, a + (math.pi if z > 0 else 0), 0))
    for i in range(3):
        p.box((0.04, 0.02, 0.5), (p.rng.uniform(-0.5, 0.5), -0.28, -1.2), BLOOD, bevel=0.0)
    p.export()


def window_bloody():
    p = Prop("window_bloody", 604)
    # A lit window with the blind down, and handprints dragging down the glass.
    _window_frame(p, "glow:#ff9a70")
    for y in (-0.235, 0.235):
        for x, z in ((-0.42, 0.42), (0.1, 0.26), (0.48, -0.1)):
            handprint(p, x, y, z, "#6e120e", 1.5)
            p.box((0.1, 0.012, 0.56), (x, y, z - 0.38), "#6e120e", bevel=0.0)
    p.export()


# ------------------------------------------------------------ building details
def door_boarded():
    p = Prop("door_boarded", 605)
    # A front door on a building you can't enter, with its notice, its number, and a letterbox someone's looking out of.
    p.box((1.9, 0.14, 3.0), (0, 0.02, 1.5), "#3a2a20", bevel=0.03)
    p.box((1.44, 0.12, 2.6), (0, -0.04, 1.35), "#5a2e24", bevel=0.02)
    for x in (-0.36, 0.36):
        for z in (0.6, 1.9):
            p.box((0.5, 0.05, 0.86), (x, -0.11, z), "#4a241c", bevel=0.01)
    p.box((0.48, 0.03, 0.1), (0, -0.13, 1.28), BRASS, bevel=0.0)
    p.box((0.38, 0.03, 0.05), (0, -0.15, 1.28), SHADOW, bevel=0.0)
    for s in (-1, 1):
        p.ball(0.014, (s * 0.07, -0.17, 1.28), "glow:#f0e8c0", subdiv=0)
    p.ball(0.05, (0.56, -0.12, 1.2), BRASS, subdiv=1)
    p.box((0.56, 0.02, 0.72), (0.1, -0.15, 2.2), "#f0e8c8", rot=(0, 0.05, 0), bevel=0.0)
    p.box((0.42, 0.012, 0.12), (0.1, -0.165, 2.4), "#a81e1e", rot=(0, 0.05, 0), bevel=0.0)
    for i, z in enumerate((0.9, 1.7, 2.3)):
        p.box((2.0, 0.05, 0.2), (0, -0.2, z), "#6a5238", rot=(0, 0.1 - i * 0.12, 0), bevel=0.0)
    p.box((2.4, 0.5, 0.2), (0, -0.2, 0.1), "#6a6a62", bevel=0.02)
    handprint(p, -0.5, -0.17, 1.1)
    p.export()


def drainpipe():
    p = Prop("drainpipe", 606)
    # Up the corner of a building: pipe, brackets, a green streak, and a shoe stuck in the bend at the bottom.
    p.cyl(0.07, 0.07, 9.0, (0, -0.1, 4.7), "#3a3c40", segs=8)
    p.tube([(0, -0.1, 0.24), (0, -0.24, 0.12), (0, -0.36, 0.1)], 0.07, "#3a3c40", 7)
    for z in (1.4, 3.2, 5.0, 6.8, 8.6):
        p.box((0.2, 0.14, 0.05), (0, -0.05, z), "#2a2a2a", bevel=0.0)
    p.box((0.2, 0.012, 3.4), (0.14, -0.012, 2.0), "#4a5a44", bevel=0.0)
    p.ball(0.2, (0, -0.44, 0.03), "#3a5a44", scale=(1.3, 1, 0.1), subdiv=1)
    p.export()


def wall_creeper():
    p = Prop("wall_creeper", 607)
    # Something has grown up this wall, and it has hold of it.
    for i in range(7):
        x = -2.0 + i * 0.66
        pts = [(x, -0.06, 0)]
        for j in range(6):
            pts.append((pts[-1][0] + p.rng.uniform(-0.5, 0.5), -0.07, pts[-1][2] + p.rng.uniform(0.5, 1.1)))
        p.tube(pts, 0.03, TWIG, 4)
        for q in pts[1:]:
            for k in range(2):
                p.ball(0.15, (q[0] + p.rng.uniform(-0.2, 0.2), -0.08, q[2] + p.rng.uniform(-0.2, 0.2)), p.rng.choice((LEAF_DARK, "#2a4a30", "#3a2a24")), scale=(1, 0.12, 0.8), subdiv=0)
    p.export()


def suburb_house(name, wall, seed, roof, door, state):
    p = Prop(name, seed)
    # Two storeys of perfectly nice home. Boards, shingles, gutters, shutters, a porch. `state` is what's wrong with it.
    W, D, H = 12.0, 9.0, 5.4
    F = -D / 2
    shade = {"#e8dcc0": "#d4c8ac", "#c0d0d8": "#acbcc4", "#d8c8c0": "#c4b4ac"}.get(wall, wall)
    p.box((W, D, H), (0, 0, H / 2 + 0.2), wall, bevel=0.0)
    p.box((W + 0.2, D + 0.2, 0.3), (0, 0, 0.15), "#8a867c", bevel=0.02)
    for r in range(14):
        z = 0.5 + r * 0.37
        for y in (F - 0.015, -F + 0.015):
            p.box((W, 0.03, 0.05), (0, y, z), shade, bevel=0.0)
        for x in (-W / 2 - 0.015, W / 2 + 0.015):
            p.box((0.03, D, 0.05), (x, 0, z), shade, bevel=0.0)
    for x, y in ((-W / 2, F), (W / 2, F), (-W / 2, -F), (W / 2, -F)):
        p.box((0.2, 0.2, H), (x, y, H / 2 + 0.2), "#f4f1e8", bevel=0.0)
    p.box((W + 0.1, 0.12, 0.16), (0, F - 0.03, 3.0), "#f4f1e8", bevel=0.0)
    # the roof, shingle by shingle
    run, rise = D / 2 + 0.5, 2.8
    angle = math.atan2(rise, run)
    for s in (-1, 1):
        for i in range(9):
            t = (i + 0.5) / 9
            p.box((W + 0.7, math.hypot(run, rise) / 9 + 0.1, 0.09), (0, s * run * (1 - t), H + 0.2 + rise * t), roof, rot=(s * angle, 0, 0), bevel=0.0)
            p.box((W + 0.72, 0.02, 0.03), (0, s * (run * (1 - t) + 0.14), H + 0.26 + rise * t), "#2a201c", rot=(s * angle, 0, 0), bevel=0.0)
    p.box((W + 0.8, 0.22, 0.14), (0, 0, H + 3.04), "#3a2a24", bevel=0.0)
    for s in (-1, 1):
        for i in range(6):
            t = i / 6
            p.box((0.1, D * (1 - t) + 0.1, rise / 6 + 0.02), (s * W / 2, 0, H + 0.2 + (i + 0.5) * rise / 6), wall, bevel=0.0)
        p.box((W + 0.8, 0.14, 0.12), (0, s * (D / 2 + 0.56), H + 0.16), "#d8d4c8", bevel=0.0)
    p.tube([(W / 2 + 0.3, F - 0.56, H + 0.1), (W / 2 + 0.25, F - 0.18, H - 0.3), (W / 2 + 0.2, F - 0.18, 0.2), (W / 2 + 0.4, F - 0.34, 0.08)], 0.05, "#d8d4c8", 6)
    # chimney, brick by brick at the top
    p.box((1.1, 1.1, 3.4), (W * 0.3, 2.0, H + 2.0), "#7a4a3a", bevel=0.0)
    for z in range(5):
        p.box((1.16, 1.16, 0.05), (W * 0.3, 2.0, H + 2.1 + z * 0.4), "#5a3428", bevel=0.0)
    p.box((1.3, 1.3, 0.14), (W * 0.3, 2.0, H + 3.74), "#4a3028", bevel=0.0)
    p.cyl(0.14, 0.11, 0.5, (W * 0.3, 2.0, H + 4.0), "#8a4a3a", segs=8)
    # dormer and its little window
    p.box((1.9, 1.4, 1.2), (-3.0, F + 1.4, H + 1.3), wall, bevel=0.0)
    for s in (-1, 1):
        p.box((1.2, 1.8, 0.09), (-3.0 + s * 0.58, F + 1.3, H + 2.18), roof, rot=(0, -s * 0.72, 0), bevel=0.0)
    _house_window(p, -3.0, F + 0.68, H + 1.3, state, attic=True)
    # porch: steps, deck, posts, rails, a light and a very welcoming door
    px = -1.2
    for i in range(3):
        p.box((3.0, 0.42, 0.18), (px, F - 2.5 + i * 0.36, 0.1 + i * 0.18), "#c8c4bc", bevel=0.0)
    p.box((4.4, 2.2, 0.16), (px, F - 1.1, 0.66), "#a89880", bevel=0.0)
    for i in range(5):
        p.box((4.4, 0.02, 0.17), (px, F - 0.3 - i * 0.42, 0.66), "#8a7c68", bevel=0.0)
    p.box((4.7, 2.6, 0.2), (px, F - 1.1, 3.3), "#f4f1e8", bevel=0.0)
    p.box((4.8, 2.7, 0.08), (px, F - 1.15, 3.44), roof, bevel=0.0)
    for x in (-2.1, 2.1):
        p.lathe([(0.11, 0), (0.09, 0.14), (0.07, 0.3), (0.07, 2.3), (0.11, 2.5)], (px + x, F - 2.1, 0.74), "#f4f1e8", segs=8)
        p.box((1.3, 0.05, 0.05), (px + x * 0.68, F - 2.1, 1.7), "#f4f1e8", bevel=0.0)
        for b in range(5):
            p.cyl(0.018, 0.018, 0.9, (px + x * (0.4 + b * 0.12), F - 2.1, 1.25), "#f4f1e8", segs=4)
    # door
    door_h = 2.5
    p.box((1.36, 0.1, door_h), (px, F - 0.04, 0.74 + door_h / 2), door, bevel=0.0)
    for x in (-0.3, 0.3):
        for z in (1.4, 2.4):
            p.box((0.5, 0.01, 0.76), (px + x, F - 0.095, z), "#2a1a14", bevel=0.0)
            p.box((0.46, 0.03, 0.72), (px + x, F - 0.11, z), door, bevel=0.0)
    p.ball(0.04, (px + 0.54, F - 0.12, 1.84), BRASS, subdiv=1)
    p.lathe([(0.22, 0), (0.28, 0.05), (0.22, 0.1), (0.16, 0.05), (0.22, 0)], (px, F - 0.12, 2.8), LEAF_DARK, segs=10, rot=(math.pi / 2, 0, 0))
    p.ball(0.06, (px + 1.1, F - 0.1, 2.7), "glow:#ffe8b0", subdiv=1)
    p.box((1.0, 0.6, 0.02), (px, F - 0.6, 0.75), "#6a5a44", bevel=0.0)
    # garage: panelled door. In the houses that have gone wrong, it hasn't quite come down.
    gx = 3.3
    gap = 0.34 if state in ("bloody", "dark") else 0.0
    p.box((4.0, 0.08, 2.9), (gx, F - 0.03, 1.65), "#f4f1e8", bevel=0.0)
    for r in range(4):
        p.box((3.5, 0.05, 0.56), (gx, F - 0.08, 0.5 + gap + r * 0.6), "#e4e0d4", bevel=0.0)
    for x in (-1.2, -0.4, 0.4, 1.2):
        p.box((0.56, 0.02, 0.3), (gx + x, F - 0.11, 2.3 + gap), "#2a3a44", bevel=0.0)
    if gap:
        p.box((3.5, 0.04, gap), (gx, F - 0.09, 0.2 + gap / 2), SHADOW, bevel=0.0)
        for i in range(3):
            x = gx - 1.0 + i * 0.9
            for f in range(4):
                p.box((0.03, 0.14, 0.03), (x + f * 0.05, F - 0.17, 0.28), "#c8a890", bevel=0.0)
        p.box((0.8, 1.0, 0.012), (gx - 0.1, F - 0.6, 0.02), BLOOD, bevel=0.0)
    # windows round the place
    for x, z in ((-4.5, 1.9), (-1.2, 4.2), (-4.5, 4.2), (2.2, 4.2), (4.8, 4.2)):
        _house_window(p, x, F - 0.03, z, state)
    for side in (-1, 1):
        for y in (-2.2, 2.2):
            _house_window(p, side * (W / 2 + 0.03), y, 2.0, "nice" if state == "nice" else state, sideways=True)
    # flower beds, or what's in them
    for x in (-5.0, 2.8):
        p.box((2.4, 0.5, 0.34), (x if x < 0 else -3.6, F - 0.34, 0.2), "#5a3a24", bevel=0.02)
    for i in range(10):
        x = -6.0 + i * 0.3
        c = p.rng.choice(("#d8302a", "#f5c518", "#e8398c")) if state == "nice" else "#3a2a20"
        p.cyl(0.01, 0.01, 0.34, (x, F - 0.34, 0.5), LEAF_DARK, segs=3)
        p.ball(0.05, (x, F - 0.34, 0.7), c, subdiv=0)
    if state == "dark":
        for i in range(10):
            p.box((p.rng.uniform(0.4, 1.2), 0.03, 0.02), (p.rng.uniform(-5, 5), F - 0.06, p.rng.uniform(0.5, 4.8)), "#3a2a20", rot=(0, p.rng.uniform(-0.8, 0.8), 0), bevel=0.0)
    if state == "bloody":
        for i in range(4):
            handprint(p, px - 0.2 + i * 0.16, F - 0.12, 1.2 + i * 0.3, BLOOD, 1.2)
        for i in range(5):
            p.box((p.rng.uniform(0.04, 0.1), 0.012, p.rng.uniform(0.5, 1.6)), (px + p.rng.uniform(-0.5, 0.5), F - 0.12, 1.5), BLOOD, bevel=0.0)
        p.box((0.9, 2.6, 0.012), (px, F - 1.4, 0.75), BLOOD, bevel=0.0)
    p.export()


def _house_window(p, x, y, z, state, attic=False, sideways=False):
    w, h = (0.9, 0.9) if attic else (1.2, 1.3)
    size = (0.1, w + 0.2, h + 0.2) if sideways else (w + 0.2, 0.1, h + 0.2)
    p.box(size, (x, y, z), "#f4f1e8", bevel=0.0)
    out = (1 if x > 0 else -1) if sideways else 0
    def at(dx, dy, dz):
        return (x + dx + (0.06 * out if sideways else 0), y + dy - (0 if sideways else 0.06), z + dz)
    fig = state == "watched" or (state == "nice" and attic and p.rng.random() < 0.5) or (state == "bloody" and p.rng.random() < 0.5)
    lit = fig or p.rng.random() < 0.25
    pane = "glow:#d8a050" if lit else ("#14141a" if state in ("dark", "bloody") else GLASS)
    p.box((0.02, w, h) if sideways else (w, 0.02, h), at(0, 0, 0), pane, bevel=0.0)
    if fig and not sideways:
        p.ball(0.16 * (0.8 if attic else 1), (x + 0.1, y - 0.075, z + 0.08), SHADOW, scale=(0.9, 0.2, 1.15), subdiv=1)
        p.ball(0.28 * (0.8 if attic else 1), (x + 0.1, y - 0.075, z - 0.42), SHADOW, scale=(1.0, 0.2, 0.9), subdiv=1)
    if state == "dark":
        for i, dz in enumerate((0.34, 0.0, -0.34)):
            p.box((0.04, w + 0.3, 0.16) if sideways else (w + 0.3, 0.04, 0.16), at(0, 0, dz), "#6a5238", rot=(0.1 - i * 0.1, 0, 0) if sideways else (0, 0.1 - i * 0.1, 0), bevel=0.0)
        return
    bar = "#3a3028" if lit else "#f4f1e8"
    p.box((0.05, 0.05, h) if sideways else (0.05, 0.05, h), at(0, 0, 0), bar, bevel=0.0)
    p.box((0.05, w, 0.05) if sideways else (w, 0.05, 0.05), at(0, 0, 0), bar, bevel=0.0)
    if not attic:
        p.box((0.2, w + 0.4, 0.06) if sideways else (w + 0.4, 0.2, 0.06), (x, y, z - h / 2 - 0.1), "#f4f1e8", bevel=0.0)
        if not sideways:
            for s in (-1, 1):
                p.box((0.3, 0.05, h + 0.1), (x + s * (w / 2 + 0.26), y - 0.03, z), "#3a5a4a", bevel=0.0)
                for b in range(5):
                    p.box((0.26, 0.015, 0.03), (x + s * (w / 2 + 0.26), y - 0.06, z - h / 2 + 0.16 + b * 0.24), "#2a4a3a", bevel=0.0)
            p.box((w * 0.44, 0.01, h - 0.1), (x - w * 0.26, y - 0.085, z), "#e8e0d0" if not lit else "#f0d8a0", bevel=0.0)
            if state == "bloody":
                handprint(p, x + 0.2, y - 0.09, z + 0.1, BLOOD, 1.3)


# ------------------------------------------------------------ gardens
def bush_round():
    p = Prop("bush_round", 610)
    # A real bush: lots of overlapping clumps, darker underneath, and bare sticks where it's thin.
    for i in range(14):
        a, r = i * 2.4, 0.2 + (i % 5) * 0.2
        z = 0.34 + (i % 4) * 0.28
        p.ball(p.rng.uniform(0.28, 0.46), (math.cos(a) * r, math.sin(a) * r, z), LEAF_DARK if z < 0.6 else p.rng.choice((LEAF, "#3f7a34", "#4f8a3a")), scale=(1, 1, 0.82), lumpy=0.16, subdiv=2)
    for i in range(5):
        a = i * 1.3
        p.tube([(0, 0, 0), (math.cos(a) * 0.4, math.sin(a) * 0.4, 0.3), (math.cos(a) * 0.86, math.sin(a) * 0.86, 0.56)], 0.018, TWIG, 3)
    p.export()


def bush_eyes():
    p = Prop("bush_eyes", 611)
    # A bush somebody's in. You can see them looking. You can see four fingers holding the branch aside.
    for i in range(14):
        a, r = i * 2.4, 0.2 + (i % 5) * 0.2
        z = 0.34 + (i % 4) * 0.28
        p.ball(p.rng.uniform(0.28, 0.46), (math.cos(a) * r, math.sin(a) * r * 0.7 + 0.1, z), LEAF_DARK if z < 0.6 else LEAF, scale=(1, 1, 0.82), lumpy=0.16, subdiv=2)
    p.ball(0.26, (0.05, -0.46, 0.72), SHADOW, scale=(1.3, 0.35, 0.8), subdiv=1)
    for s in (-1, 1):
        p.ball(0.05, (0.05 + s * 0.1, -0.56, 0.74), "#f4f0e0", subdiv=1)
        p.ball(0.022, (0.05 + s * 0.09, -0.6, 0.74), SHADOW, subdiv=0)
    for i in range(4):
        p.tube([(0.42 + i * 0.05, -0.42, 0.5), (0.42 + i * 0.05, -0.56, 0.6), (0.44 + i * 0.05, -0.62, 0.56)], 0.018, "#c8a890", 3)
    p.export()


def topiary_man():
    p = Prop("topiary_man", 612)
    # Very nicely clipped. A little too nicely. Somebody's kept it trimmed to the shape of whoever lived here before.
    def clump(pos, r, scale=(1, 1, 1)):
        p.ball(r, pos, p.rng.choice(("#3f7a34", "#4f8a3a", LEAF)), scale=scale, lumpy=0.05, subdiv=2)
    clump((0, 0, 1.92), 0.3, (0.9, 0.95, 1.1))
    clump((0, 0, 1.32), 0.42, (1.05, 0.7, 1.15))
    clump((0, 0, 0.78), 0.34, (1.0, 0.72, 1.0))
    for s in (-1, 1):
        clump((s * 0.16, 0, 0.3), 0.2, (0.9, 0.9, 1.7))
        clump((s * 0.5, 0, 1.54), 0.14, (1.1, 1, 1.0))
        clump((s * 0.66, -0.06, 1.2), 0.13, (1, 1, 1.5))
        clump((s * 0.72, -0.16, 0.86), 0.13, (1, 1, 1.4))
        p.ball(0.06, (s * 0.1, -0.26, 1.98), SHADOW, subdiv=1)
    p.ball(0.07, (0, -0.25, 1.78), SHADOW, scale=(1.4, 0.5, 0.8), subdiv=1)
    p.cyl(0.02, 0.02, 0.2, (0, 0, 0.1), TWIG, segs=4)
    p.export()


def topiary_hand():
    p = Prop("topiary_hand", 613)
    # A hedge clipped to a hand coming out of the lawn, as high as your chest. There's a family of them on some streets.
    def clump(pos, r, scale=(1, 1, 1)):
        p.ball(r, pos, p.rng.choice(("#3f7a34", "#4f8a3a", LEAF)), scale=scale, lumpy=0.05, subdiv=2)
    clump((0, 0, 0.3), 0.3, (1, 1, 1.5))
    clump((0, 0, 0.84), 0.34, (1.0, 0.56, 0.9))
    for i, h in enumerate((0.46, 0.56, 0.54, 0.44)):
        x = -0.27 + i * 0.18
        clump((x, 0, 1.08 + h / 2), 0.08, (1, 1, h / 0.12))
    clump((0.42, 0, 0.92), 0.09, (1.8, 1, 0.9))
    p.export()


def dead_bush():
    p = Prop("dead_bush", 614)
    # Bare, black, and the only thing about it that's still got any colour is the rag it's snagged.
    for i in range(14):
        a = i * 2.4
        l = p.rng.uniform(0.5, 1.2)
        base = (0, 0, 0)
        mid = (math.cos(a) * l * 0.4, math.sin(a) * l * 0.4, l * 0.6)
        end = (math.cos(a) * l, math.sin(a) * l, l * 0.9 + p.rng.uniform(-0.1, 0.3))
        p.tube([base, mid, end], 0.016, TWIG, 3)
        p.tube([mid, (mid[0] + p.rng.uniform(-0.3, 0.3), mid[1] + p.rng.uniform(-0.3, 0.3), mid[2] + 0.4)], 0.01, TWIG, 3)
    p.box((0.2, 0.01, 0.34), (0.3, -0.28, 0.72), "#8a7a6a", rot=(0.2, 0.3, 0.4), bevel=0.0)
    p.export()


def thorn_bush():
    p = Prop("thorn_bush", 615)
    # Thorns as long as your hand. There's a bit of everyone on them.
    for i in range(12):
        a = i * 2.4
        l = p.rng.uniform(0.8, 1.7)
        pts = [(0, 0, 0), (math.cos(a) * l * 0.5, math.sin(a) * l * 0.5, l * 0.6), (math.cos(a) * l, math.sin(a) * l, l * 0.34)]
        p.tube(pts, 0.024, "#2a3a24", 3)
        for t in (0.35, 0.6, 0.85):
            q = (pts[1][0] * t * 1.6, pts[1][1] * t * 1.6, pts[1][2] * (1.1 - t * 0.2))
            p.lathe([(0.018, 0), (0.001, 0.18)], q, "#c8c0a0", segs=3, rot=(p.rng.uniform(-1.5, 1.5), p.rng.uniform(-1.5, 1.5), 0))
    p.ball(0.08, (0.3, -0.2, 0.6), BLOOD, scale=(1, 0.3, 1.2), subdiv=0)
    p.export()


def suburb_tree(name, seed, burden):
    p = Prop(name, seed)
    # A real tree: bark, branches, a lot of leaf clumps. Each street has its own idea of what to hang off them.
    p.lathe([(0.5, 0), (0.34, 0.3), (0.28, 1.0), (0.24, 2.6)], (0, 0, 0), "#5a4030", segs=10)
    for a in (0.3, 2.2, 4.1):
        p.tube([(math.cos(a) * 0.3, math.sin(a) * 0.3, 0.12), (math.cos(a) * 0.72, math.sin(a) * 0.72, 0.02)], 0.1, "#4a3428", 5)
    for i, a in enumerate((0.5, 1.8, 3.1, 4.4, 5.6)):
        h = 2.4 + i * 0.2
        p.tube([(0, 0, h), (math.cos(a) * 1.1, math.sin(a) * 1.1, h + 0.8), (math.cos(a) * 1.9, math.sin(a) * 1.9, h + 1.4)], 0.09, "#4a3428", 5)
    for i in range(18):
        a = i * 2.4
        q = i / 18
        r = 2.4 * math.sqrt(1 - abs(2 * q - 1) ** 2) + 0.2
        p.ball(p.rng.uniform(0.6, 1.05), (math.cos(a) * r, math.sin(a) * r, 3.3 + q * 2.8), p.rng.choice((LEAF, "#3f7a34", "#4f8a3a", LEAF_DARK)), scale=(1, 1, 0.8), lumpy=0.1, subdiv=2)
    branch = (1.4, -0.7, 3.2)
    if burden == "tyre":
        p.tube([branch, (1.4, -0.7, 1.05)], 0.012, "#c8b890", 3)
        p.lathe([(0.26, 0), (0.34, 0.08), (0.26, 0.16), (0.18, 0.08), (0.26, 0)], (1.4, -0.7, 0.9), RUBBER, segs=12, rot=(math.pi / 2, 0, 0))
    elif burden == "dolls":
        for x, y, h in ((1.5, -0.6, 2.2), (-1.2, -0.9, 2.5), (0.4, -1.5, 2.0), (-0.6, 1.2, 2.3)):
            p.tube([(x, y, h + 1.0), (x, y, h)], 0.006, "#c8b890", 3)
            p.ball(0.08, (x, y, h - 0.08), "#f0d0b0", subdiv=1)
            p.box((0.1, 0.05, 0.2), (x, y, h - 0.28), p.rng.choice(("#d86a8a", "#6a8ad8", "#e8c020")), bevel=0.0)
            for s in (-1, 1):
                p.ball(0.012, (x + s * 0.03, y - 0.07, h - 0.06), SHADOW, subdiv=0)
    elif burden == "hanged":
        p.tube([branch, (1.4, -0.7, 2.7)], 0.012, "#c8b890", 3)
        p.ball(0.12, (1.42, -0.72, 2.48), "#a8b8a0", scale=(0.92, 1, 1.15), subdiv=1)
        p.lathe([(0.14, 0), (0.18, 0.2), (0.2, 0.5), (0.16, 0.72)], (1.4, -0.7, 1.6), "#3a5a8a", segs=8)
        for s in (-1, 1):
            p.tube([(1.4 + s * 0.09, -0.7, 1.62), (1.4 + s * 0.1, -0.7, 0.8)], 0.06, "#34343c", 5)
            p.tube([(1.4 + s * 0.18, -0.7, 2.2), (1.4 + s * 0.22, -0.7, 1.55)], 0.04, "#3a5a8a", 5)
    p.export()


def picket_run():
    p = Prop("picket_run", 616)
    # Ten feet of white picket fence, freshly painted. Some of the pickets are a slightly different colour at the tips.
    for i in range(11):
        x = -2.4 + i * 0.48
        p.box((0.16, 0.03, 0.82), (x, 0, 0.46), "#f4f1e8", bevel=0.0)
        tip = "#f4f1e8" if i % 7 else BLOOD
        p.lathe([(0.08, 0), (0.001, 0.12)], (x, 0, 0.87), tip, segs=4)
    for z in (0.3, 0.68):
        p.box((5.0, 0.04, 0.07), (0, 0.03, z), "#e4e0d4", bevel=0.0)
    p.export()


def doll_head():
    p = Prop("doll_head", 617)
    # A doll's head, on its side, with one eye that still closes.
    p.ball(0.12, (0, 0, 0.11), "#f0d8c0", scale=(1, 1, 1.05), subdiv=2)
    p.ball(0.122, (0.02, 0.03, 0.14), "#c8a040", scale=(1, 0.95, 0.82), subdiv=1)
    p.ball(0.028, (-0.05, -0.11, 0.12), "#2a3a6a", subdiv=1)
    p.box((0.06, 0.012, 0.02), (0.05, -0.116, 0.12), "#8a6a50", bevel=0.0)
    p.box((0.05, 0.012, 0.016), (0, -0.115, 0.06), "#a81e1e", bevel=0.0)
    p.export()


# ------------------------------------------------------------ what's on the ground
def blades(p, count, spread, low, high, colors, width=0.018):
    for i in range(count):
        a, r = i * 2.4, math.sqrt(i / count) * spread
        h = p.rng.uniform(low, high)
        lean = p.rng.uniform(0.1, 0.45) * h
        d = p.rng.uniform(0, math.tau)
        x, y = math.cos(a) * r, math.sin(a) * r
        p.tube([(x, y, 0), (x + math.cos(d) * lean * 0.4, y + math.sin(d) * lean * 0.4, h * 0.6), (x + math.cos(d) * lean, y + math.sin(d) * lean, h)], width, p.rng.choice(colors), 3)


def grass_clump():
    p = Prop("grass_clump", 620)
    blades(p, 12, 0.34, 0.2, 0.46, (LAWN, LAWN_DARK, "#7ab04a"))
    p.export()


def grass_tall():
    p = Prop("grass_tall", 621)
    # Long grass. On Suburbia, someone would have had a word with you about this.
    blades(p, 16, 0.5, 0.6, 1.2, ("#7a9a3a", "#5f8a3a", "#a8a84a"), 0.022)
    p.export()


def flowers():
    p = Prop("flowers", 622)
    for i in range(8):
        a, r = i * 2.4, 0.08 + i * 0.05
        x, y = math.cos(a) * r, math.sin(a) * r
        h = p.rng.uniform(0.18, 0.34)
        p.cyl(0.006, 0.006, h, (x, y, h / 2), LEAF_DARK, segs=3)
        p.ball(0.035, (x, y, h), p.rng.choice(("#f5c518", "#f4f0e8", "#e8398c", "#d8302a")), scale=(1, 1, 0.5), subdiv=0)
    p.export()


def weed_crack():
    p = Prop("weed_crack", 623)
    # Dead weeds up through a crack. They're the only thing growing and they're not doing well.
    blades(p, 10, 0.2, 0.15, 0.5, ("#6a6a3a", "#4a4a2a", "#7a6a3a"), 0.014)
    p.export()


def rubble_bits():
    p = Prop("rubble_bits", 624)
    for i in range(9):
        a, r = i * 2.4, 0.1 + i * 0.1
        s = p.rng.uniform(0.04, 0.16)
        p.ball(s, (math.cos(a) * r, math.sin(a) * r, s * 0.4), p.rng.choice(("#6a6660", "#54504a", "#7a746c")), scale=(1, 0.8, 0.6), lumpy=0.3, subdiv=0)
    p.export()


def bone_bits():
    p = Prop("bone_bits", 625)
    # Not rubble. Have a closer look.
    for i in range(6):
        a, r = i * 2.4, 0.08 + i * 0.1
        d = p.rng.uniform(0, math.tau)
        x, y = math.cos(a) * r, math.sin(a) * r
        p.tube([(x, y, 0.03), (x + math.cos(d) * 0.16, y + math.sin(d) * 0.16, 0.03)], 0.014, BONE, 3)
        p.ball(0.022, (x, y, 0.03), BONE, subdiv=0)
    p.ball(0.03, (0.1, 0.06, 0.03), "#6e120e", scale=(2.4, 2, 0.15), subdiv=0)
    p.export()


def tooth_bits():
    p = Prop("tooth_bits", 626)
    for i in range(8):
        a, r = i * 2.4, 0.04 + i * 0.05
        p.lathe([(0.012, 0), (0.016, 0.012), (0.01, 0.028)], (math.cos(a) * r, math.sin(a) * r, 0), "#f4f0e0", segs=4)
    p.export()


def receipts():
    p = Prop("receipts", 627)
    # Till receipts, and a lost-child card, blown into a drift against nothing.
    for i in range(9):
        a, r = i * 2.4, 0.06 + i * 0.09
        p.box((0.09, 0.24, 0.004), (math.cos(a) * r, math.sin(a) * r, 0.006 + i * 0.001), p.rng.choice(("#f4f0e0", "#e8e4d4", "#f0d8d8")), rot=(p.rng.uniform(-0.1, 0.1), p.rng.uniform(-0.1, 0.1), a), bevel=0.0)
    p.export()


def lint_tufts():
    p = Prop("lint_tufts", 628)
    for i in range(6):
        a, r = i * 2.4, 0.1 + i * 0.1
        p.ball(p.rng.uniform(0.05, 0.13), (math.cos(a) * r, math.sin(a) * r, 0.05), p.rng.choice(("#c8c8c0", "#a8a8a4", "#d8d4cc")), scale=(1, 1, 0.5), lumpy=0.3, subdiv=0)
    p.tube([(0, 0, 0.03), (0.1, 0.1, 0.03)], 0.006, "#2a2a30", 3)
    p.export()


def gutter_fat():
    p = Prop("gutter_fat", 629)
    # Set fat, in pale blobs, with things stuck in it.
    for i in range(6):
        a, r = i * 2.4, 0.1 + i * 0.1
        p.ball(p.rng.uniform(0.07, 0.17), (math.cos(a) * r, math.sin(a) * r, 0.02), "#d8c898", scale=(1, 1, 0.3), lumpy=0.2, subdiv=0)
    p.tube([(0.1, 0.1, 0.05), (0.2, 0.16, 0.05)], 0.012, BONE, 3)
    p.export()


def reeds():
    p = Prop("reeds", 630)
    # Pale reeds, up out of the flood. They grow where there's something to feed on.
    blades(p, 12, 0.4, 0.9, 1.8, ("#8a9a6a", "#6a7a54", "#a8a87a"), 0.016)
    for i in range(3):
        a = i * 2.1
        p.ball(0.03, (math.cos(a) * 0.2, math.sin(a) * 0.2, 1.55), "#4a3020", scale=(0.8, 0.8, 2.4), subdiv=0)
    p.export()


def pond_scum():
    p = Prop("pond_scum", 631)
    # A raft of green scum, and a hank of hair it's growing on. It floats at water level.
    for i in range(8):
        a, r = i * 2.4, 0.1 + i * 0.15
        p.ball(p.rng.uniform(0.14, 0.34), (math.cos(a) * r, math.sin(a) * r, 0.36), p.rng.choice(("#4a7a4a", "#3a6a44", "#5a8a54")), scale=(1, 1, 0.03), lumpy=0.2, subdiv=0)
    for i in range(5):
        p.tube([(0.05 + i * 0.02, 0.1, 0.37), (0.2 + i * 0.05, 0.3, 0.37), (0.34 + i * 0.05, 0.3, 0.37)], 0.006, "#1a1a14", 3)
    p.export()


def coal_bits():
    p = Prop("coal_bits", 632)
    for i in range(9):
        a, r = i * 2.4, 0.1 + i * 0.09
        s = p.rng.uniform(0.04, 0.12)
        p.ball(s, (math.cos(a) * r, math.sin(a) * r, s * 0.5), p.rng.choice(("#1a1a1e", "#2a2622", "#ffb050" if i == 4 else "#22201e")), lumpy=0.35, subdiv=0)
    p.export()


def fry_bits():
    p = Prop("fry_bits", 633)
    for i in range(8):
        a, r = i * 2.4, 0.08 + i * 0.08
        p.box((0.022, 0.13, 0.022), (math.cos(a) * r, math.sin(a) * r, 0.016), p.rng.choice(("#e8c060", "#c8983a", "#a8742a")), rot=(0, 0, a), bevel=0.0)
    p.ball(0.08, (0.05, -0.1, 0.01), "#c89a3a", scale=(2.4, 2, 0.1), subdiv=0)
    p.export()


def mold_tuft():
    p = Prop("mold_tuft", 634)
    # It's in the cracks now. It feels soft through your boots.
    for i in range(7):
        a, r = i * 2.4, 0.06 + i * 0.07
        s = p.rng.uniform(0.05, 0.13)
        p.ball(s, (math.cos(a) * r, math.sin(a) * r, s * 0.5), p.rng.choice(("#8aa878", "#a8b888", "#d8d8a8")), scale=(1, 1, 0.8), lumpy=0.15, subdiv=1)
    p.export()


def pamphlets():
    p = Prop("pamphlets", 635)
    # VOTE RAT, trodden in, by the hundred.
    for i in range(10):
        a, r = i * 2.4, 0.06 + i * 0.09
        c = p.rng.choice(("#d8a838", "#6a2a7a", "#e8e0c8"))
        p.box((0.16, 0.22, 0.004), (math.cos(a) * r, math.sin(a) * r, 0.006 + i * 0.001), c, rot=(0, 0, a), bevel=0.0)
    p.export()


def far_figure():
    p = Prop("far_figure", 640)
    # Someone a long way off, in the gloom. Too thin. They face you, and when you get there, they haven't been there.
    p.ball(0.13, (0, 0, 2.28), SHADOW, scale=(0.82, 1, 1.25), subdiv=1)
    p.lathe([(0.1, 0.9), (0.16, 1.4), (0.2, 1.9), (0.08, 2.14)], (0, 0, 0), SHADOW, segs=8)
    for s in (-1, 1):
        p.tube([(s * 0.08, 0, 0), (s * 0.09, 0, 0.5), (s * 0.09, 0, 1.0)], 0.04, SHADOW, 4)
        p.tube([(s * 0.2, 0, 1.86), (s * 0.28, 0, 1.2), (s * 0.3, 0, 0.5)], 0.028, SHADOW, 4)
        p.ball(0.018, (s * 0.05, -0.115, 2.32), "glow:#f0e8d0", subdiv=0)
    p.export()


def hanged_figure():
    p = Prop("hanged_figure", 641)
    # A bag over the head and a rope going up out of sight. The rope's long enough for the highest ceiling down here.
    p.tube([(0, 0, 1.95), (0, 0, 45)], 0.014, "#b09a6a", 3)
    p.ball(0.15, (0, 0, 1.78), "#9a8a6a", scale=(0.95, 1, 1.2), lumpy=0.08, subdiv=1)
    p.lathe([(0.015, 1.96), (0.09, 1.92), (0.06, 1.88)], (0, 0, 0), "#b09a6a", segs=6)
    p.lathe([(0.1, 0.84), (0.16, 1.05), (0.22, 1.38), (0.1, 1.55)], (0, 0, 0), "#4a4a50", segs=9)
    for s in (-1, 1):
        p.tube([(s * 0.21, 0, 1.4), (s * 0.25, 0, 1.05), (s * 0.24, 0, 0.74)], 0.045, "#4a4a50", 5)
        p.ball(0.05, (s * 0.24, 0, 0.7), "#a8b8a0", subdiv=1)
        p.tube([(s * 0.08, 0, 0.88), (s * 0.09, 0.01, 0.44), (s * 0.09, 0.03, 0.05)], 0.065, "#2a2a30", 5)
        p.ball(0.08, (s * 0.09, -0.02, -0.02), "#1a1a20", scale=(0.8, 1.4, 0.6), subdiv=0)
    for i in range(3):
        p.box((0.02, 0.02, 0.26), (p.rng.uniform(-0.08, 0.08), 0, -0.3 - i * 0.2), BLOOD, bevel=0.0)
    p.export()


# ------------------------------------------------------------ foliage and gnomes, the detailed versions
def leaf_cloud(p, centre, radius, count, light, dark, size=0.16, flat_top=None):
    """Lots of single leaves on the outside of a clump: lighter on top, darker underneath."""
    cx, cy, cz = centre
    for i in range(count):
        z = p.rng.uniform(-0.55, 1.0)
        a = p.rng.uniform(0, math.tau)
        k = math.sqrt(max(0.0, 1 - z * z))
        d = radius * p.rng.uniform(0.82, 1.06)
        pos = (cx + math.cos(a) * k * d, cy + math.sin(a) * k * d, cz + z * d)
        if flat_top is not None and pos[2] > flat_top:
            pos = (pos[0], pos[1], flat_top)
        tone = p.rng.choice(light) if z > 0.15 else p.rng.choice(dark)
        p.ball(size * p.rng.uniform(0.7, 1.3), pos, tone, scale=(1, 0.3, 0.62), rot=(p.rng.uniform(0, 3), p.rng.uniform(0, 3), p.rng.uniform(0, 3)), subdiv=0)


LIGHTS = ("#5f9a42", "#6aa84a", "#7ab04a", "#4f8a3a")
DARKS = ("#2f5a2a", "#3a6a30", "#24481f")


def bush_core(p, spread=1.0):
    for i in range(9):
        a, r = i * 2.4, (0.15 + (i % 4) * 0.16) * spread
        z = 0.3 + (i % 3) * 0.22
        p.ball(0.2 * spread, (math.cos(a) * r, math.sin(a) * r, z), "#24481f", scale=(1, 1, 0.8), lumpy=0.06, subdiv=2)
    for i in range(6):
        a = i * 1.1
        p.tube([(0, 0, 0), (math.cos(a) * 0.3 * spread, math.sin(a) * 0.3 * spread, 0.26), (math.cos(a) * 0.62 * spread, math.sin(a) * 0.62 * spread, 0.5)], 0.02, TWIG, 3)
    for i in range(7):
        a, r = i * 2.4, (0.2 + (i % 3) * 0.2) * spread
        leaf_cloud(p, (math.cos(a) * r, math.sin(a) * r, 0.42 + (i % 3) * 0.2), 0.3 * spread, 56, LIGHTS, DARKS, 0.14 * spread)


def bush_round():
    p = Prop("bush_round", 610)
    # A proper bush: a dark heart, hundreds of leaves, twigs where it's thin, and a few berries you shouldn't eat.
    bush_core(p)
    for i in range(9):
        a = p.rng.uniform(0, math.tau)
        p.ball(0.03, (math.cos(a) * 0.62, math.sin(a) * 0.62, p.rng.uniform(0.4, 0.9)), p.rng.choice(("#c81a14", "#e8e0f0", "#7a1a5a")), subdiv=1)
    p.export()


def bush_eyes():
    p = Prop("bush_eyes", 611)
    # A bush somebody's in. You can see them looking. You can see four fingers holding the branch aside.
    bush_core(p)
    p.ball(0.26, (0.05, -0.5, 0.72), SHADOW, scale=(1.3, 0.35, 0.8), subdiv=1)
    for s in (-1, 1):
        p.ball(0.05, (0.05 + s * 0.1, -0.6, 0.74), "#f4f0e0", subdiv=1)
        p.ball(0.022, (0.05 + s * 0.09, -0.64, 0.74), SHADOW, subdiv=0)
    for i in range(4):
        p.tube([(0.42 + i * 0.05, -0.46, 0.5), (0.42 + i * 0.05, -0.6, 0.6), (0.44 + i * 0.05, -0.66, 0.56)], 0.018, "#c8a890", 3)
    p.export()


def hedge():
    p = Prop("hedge", 618)
    # A clipped garden hedge, four metres long, flat on top, every leaf in place except where something pushed through.
    for i in range(7):
        x = -1.8 + i * 0.6
        p.ball(0.44, (x, 0, 0.5), p.rng.choice(DARKS), scale=(1, 0.9, 1.0), lumpy=0.04, subdiv=2)
        leaf_cloud(p, (x, 0, 0.6), 0.5, 60, LIGHTS, DARKS, 0.1, flat_top=1.08)
    p.ball(0.24, (0.8, -0.46, 0.5), SHADOW, scale=(1.1, 0.3, 0.9), subdiv=1)
    p.export()


def tree_body(p, height=1.0, canopy=True):
    """A deciduous tree with ridged bark, a root flare, forking boughs and leafy clumps. Returns the tips of the boughs."""
    k = height
    p.lathe([(0.52 * k, 0), (0.34 * k, 0.3 * k), (0.28 * k, 1.2 * k), (0.24 * k, 2.6 * k)], (0, 0, 0), "#5a4030", segs=12)
    for i in range(10):
        a = i * math.tau / 10
        p.tube([(math.cos(a) * 0.36 * k, math.sin(a) * 0.36 * k, 0.1), (math.cos(a + 0.1) * 0.27 * k, math.sin(a + 0.1) * 0.27 * k, 1.3 * k), (math.cos(a + 0.2) * 0.23 * k, math.sin(a + 0.2) * 0.23 * k, 2.6 * k)], 0.035 * k, "#3e2c20", 3)
    for a in (0.3, 1.6, 2.9, 4.2, 5.4):
        p.tube([(math.cos(a) * 0.3 * k, math.sin(a) * 0.3 * k, 0.16), (math.cos(a) * 0.7 * k, math.sin(a) * 0.7 * k, 0.05), (math.cos(a) * 1.0 * k, math.sin(a) * 1.0 * k, -0.05)], 0.1 * k, "#4a3428", 5)
    tips = []
    for i, a in enumerate((0.4, 1.7, 3.0, 4.3, 5.5)):
        h = (2.3 + i * 0.18) * k
        mid = (math.cos(a) * 0.9 * k, math.sin(a) * 0.9 * k, h + 0.7 * k)
        p.tube([(0, 0, h), mid], 0.1 * k, "#4a3428", 5)
        for b in (-0.45, 0.45):
            tip = (mid[0] + math.cos(a + b) * 1.0 * k, mid[1] + math.sin(a + b) * 1.0 * k, mid[2] + 0.8 * k)
            p.tube([mid, tip], 0.055 * k, "#4a3428", 4)
            tips.append(tip)
    if canopy:
        # a full round crown: a dark smooth heart, then clumps all over it, every one covered in leaves
        p.ball(1.45 * k, (0, 0, 4.9 * k), "#1e3e1a", scale=(1.1, 1.1, 0.9), lumpy=0.05, subdiv=2)
        clumps = list(tips) + [(math.cos(a) * 1.1 * k, math.sin(a) * 1.1 * k, 5.8 * k) for a in (0.0, 1.6, 3.2, 4.8)] + [(0, 0, 6.5 * k)]
        for t in clumps:
            leaf_cloud(p, (t[0], t[1], t[2] + 0.3 * k), 0.95 * k, 64, LIGHTS, DARKS, 0.27 * k)
    return tips


def tree():
    p = Prop("tree", 82)
    # Floor 5's street tree, replacing the plain one: neat, full, and not one leaf out of place.
    tree_body(p)
    p.export()


def suburb_tree(name, seed, burden):
    p = Prop(name, seed)
    # A real tree. Each street has its own idea of what to hang off them.
    tree_body(p)
    branch = (1.4, -0.7, 3.2)
    if burden == "tyre":
        p.tube([branch, (1.4, -0.7, 1.05)], 0.012, "#c8b890", 3)
        p.lathe([(0.26, 0), (0.34, 0.08), (0.26, 0.16), (0.18, 0.08), (0.26, 0)], (1.4, -0.7, 0.9), RUBBER, segs=12, rot=(math.pi / 2, 0, 0))
    elif burden == "dolls":
        for x, y, h in ((1.5, -0.6, 2.2), (-1.2, -0.9, 2.5), (0.4, -1.5, 2.0), (-0.6, 1.2, 2.3)):
            p.tube([(x, y, h + 1.0), (x, y, h)], 0.006, "#c8b890", 3)
            p.ball(0.08, (x, y, h - 0.08), "#f0d0b0", subdiv=1)
            p.box((0.1, 0.05, 0.2), (x, y, h - 0.28), p.rng.choice(("#d86a8a", "#6a8ad8", "#e8c020")), bevel=0.0)
            for s in (-1, 1):
                p.ball(0.012, (x + s * 0.03, y - 0.07, h - 0.06), SHADOW, subdiv=0)
    elif burden == "hanged":
        p.tube([branch, (1.4, -0.7, 2.7)], 0.012, "#c8b890", 3)
        p.ball(0.12, (1.42, -0.72, 2.48), "#a8b8a0", scale=(0.92, 1, 1.15), subdiv=1)
        p.lathe([(0.14, 0), (0.18, 0.2), (0.2, 0.5), (0.16, 0.72)], (1.4, -0.7, 1.6), "#3a5a8a", segs=8)
        for s in (-1, 1):
            p.tube([(1.4 + s * 0.09, -0.7, 1.62), (1.4 + s * 0.1, -0.7, 0.8)], 0.06, "#34343c", 5)
            p.tube([(1.4 + s * 0.18, -0.7, 2.2), (1.4 + s * 0.22, -0.7, 1.55)], 0.04, "#3a5a8a", 5)
    p.export()


def jungle_tree():
    p = Prop("jungle_tree", 451)
    # A canopy trunk: buttress roots, ridged bark, moss, shelf fungus, vines down from the dark, and the hunters' nails.
    p.lathe([(3.0, 0), (2.2, 0.8), (1.6, 2.4), (1.4, 8), (1.3, 22), (1.1, 44)], (0, 0, 0), "#4a3424", segs=14)
    for i in range(14):
        a = i * math.tau / 14
        p.tube([(math.cos(a) * 1.55, math.sin(a) * 1.55, 2.0), (math.cos(a + 0.15) * 1.42, math.sin(a + 0.15) * 1.42, 14), (math.cos(a + 0.3) * 1.3, math.sin(a + 0.3) * 1.3, 30)], 0.09, "#3a2818", 3)
    for i in range(7):
        a = i * math.tau / 7 + 0.3
        p.tube([(math.cos(a) * 1.4, math.sin(a) * 1.4, 4.5), (math.cos(a) * 2.6, math.sin(a) * 2.6, 1.6), (math.cos(a) * 4.8, math.sin(a) * 4.8, -0.2)], 0.5, "#3e2c1e", 8)
        p.tube([(math.cos(a) * 1.5, math.sin(a) * 1.5, 5.2), (math.cos(a) * 2.9, math.sin(a) * 2.9, 2.0), (math.cos(a) * 5.0, math.sin(a) * 5.0, 0.1)], 0.16, "#2e2014", 4)
    for i in range(10):
        a, z = i * 2.1, 2.5 + i * 2.6
        leaf_cloud(p, (math.cos(a) * 1.42, math.sin(a) * 1.42, z), 0.7, 18, ("#3e6a34", "#4a7a3a"), ("#24401e", "#2e4a26"), 0.16)
    for i in range(6):
        a, z = i * 1.7 + 0.8, 3.0 + i * 4.5
        p.lathe([(0.62, 0), (0.7, 0.06), (0.55, 0.12), (0.001, 0.16)], (math.cos(a) * 1.75, math.sin(a) * 1.75, z), p.rng.choice(("#c8a860", "#a87a4a", "#d8c890")), segs=10)
        p.ball(0.06, (math.cos(a) * 1.5, math.sin(a) * 1.5, z + 1.0), GLOW_MOSS, subdiv=1)
    for i in range(9):
        a = i * 0.7
        top = 26.0 - (i % 3) * 4
        x, y = math.cos(a) * 1.6, math.sin(a) * 1.6
        bottom = p.rng.uniform(2.5, 8.0)
        p.tube([(x, y, top), (x + 0.4, y + 0.2, (top + bottom) / 2), (x + 0.2, y + 0.5, bottom)], 0.035, "#2e4a26", 3)
        for j in range(5):
            z = bottom + (top - bottom) * j / 5
            p.ball(0.12, (x + 0.3, y + 0.3, z), "#3a6a34", scale=(1, 0.3, 1.5), subdiv=0)
    for i in range(4):
        a, z = i * 1.5 + 0.2, 2.2 + i * 1.3
        p.cyl(0.02, 0.02, 0.3, (math.cos(a) * 1.65, math.sin(a) * 1.65, z), "#8a8a90", rot=(0, math.pi / 2, a), segs=4)
    p.export()


GLOW_MOSS = "glow:#7affc8"


def _gnome(p, coat, hat, kind):
    """A garden gnome about 0.75 m tall, facing -Y. kind: plain, lantern, knife, grin."""
    p.cyl(0.15, 0.16, 0.04, (0, 0, 0.02), "#6a6a62", segs=12)
    for s in (-1, 1):
        p.ball(0.05, (s * 0.05, -0.03, 0.06), "#3a2418", scale=(0.8, 1.4, 0.6), subdiv=1)
    p.lathe([(0.075, 0.06), (0.08, 0.14)], (0, 0, 0), "#3a4a6a", segs=10)
    p.lathe([(0.11, 0.12), (0.135, 0.2), (0.125, 0.31), (0.08, 0.37)], (0, 0, 0), coat, segs=12)
    p.lathe([(0.128, 0), (0.13, 0.03)], (0, 0, 0.2), "#1a1a1e", segs=12)
    p.box((0.05, 0.02, 0.04), (0, -0.132, 0.215), "#d8a838", bevel=0.0)
    hand_r = (0.12, -0.08, 0.22)
    for s in (-1, 1):
        hand = (s * 0.12, -0.08, 0.22)
        p.tube([(s * 0.1, -0.01, 0.33), (s * 0.13, -0.05, 0.27), hand], 0.028, coat, 5)
        p.ball(0.03, hand, "#f0c8a8", subdiv=1)
    head = (0, 0, 0.44)
    p.ball(0.085, head, "#f0c8a8", subdiv=2)
    p.ball(0.038, (0, -0.088, 0.432), "#e89a88", subdiv=2)
    for s in (-1, 1):
        p.ball(0.022, (s * 0.088, 0, 0.44), "#f0c8a8", scale=(0.5, 1, 1.4), subdiv=1)
        p.ball(0.02, (s * 0.034, -0.068, 0.49), "#f4f0e8", scale=(1.5, 0.8, 0.7), subdiv=1)
        p.ball(0.016, (s * 0.135, -0.07, 0.25), "#f4f0e8", scale=(1.2, 1.2, 0.8), subdiv=1)
    for z in (0.26, 0.3, 0.34):
        p.ball(0.011, (0, -0.128, z), "#d8a838", subdiv=1)
    p.lathe([(0.13, 0), (0.138, 0.02), (0.13, 0.04)], (0, 0, 0.12), "#f4f0e8", segs=12)
    for s in (-1, 1):
        p.ball(0.024, (s * 0.05, -0.062, 0.42), "#f0a8a0", subdiv=1)
        p.box((0.03, 0.01, 0.008), (s * 0.03, -0.072, 0.478), "#f4f0e8", rot=(0, s * 0.3, 0), bevel=0.0)
        eye = "glow:#ff3a2a" if kind in ("knife", "grin") else SHADOW
        p.ball(0.02, (s * 0.032, -0.072, 0.462), "#f4f0e8", subdiv=1)
        p.ball(0.011, (s * 0.032, -0.09, 0.462), eye, subdiv=1)
    # beard and moustache, in curls
    p.ball(0.07, (0, -0.045, 0.37), "#f4f0e8", scale=(0.95, 0.6, 1.35), subdiv=2)
    for i in range(10):
        a = -1.2 + i * 0.27
        p.ball(0.022, (math.sin(a) * 0.065, -0.05 - math.cos(a) * 0.03, 0.3 + abs(a) * 0.03), "#e8e4dc", subdiv=1)
    for s in (-1, 1):
        p.ball(0.026, (s * 0.025, -0.085, 0.418), "#f4f0e8", scale=(1.3, 0.7, 0.6), subdiv=1)
    # the hat, flopped over a little
    # the hat bends over at the tip, the way the good ones do
    pts = [(0, 0, 0.47), (0, 0.01, 0.56), (0.01, 0.03, 0.64), (0.04, 0.07, 0.7), (0.08, 0.1, 0.72)]
    steps = 18
    for i in range(steps):
        t = i / (steps - 1) * (len(pts) - 1)
        j = min(int(t), len(pts) - 2)
        f = t - j
        a, b = pts[j], pts[j + 1]
        c = (a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f)
        p.ball(0.09 * (1 - i / steps) + 0.012, c, hat, scale=(1, 1, 0.75), subdiv=2)
    p.ball(0.022, pts[-1], "#f4f0e8", subdiv=1)
    p.lathe([(0.088, 0), (0.092, 0.012), (0.086, 0.022)], (0, 0.0, 0.47), hat, segs=12)
    if kind == "lantern":
        p.cyl(0.03, 0.03, 0.06, (hand_r[0], hand_r[1] - 0.03, 0.17), "glow:#ffd890", segs=6)
        p.cyl(0.035, 0.03, 0.015, (hand_r[0], hand_r[1] - 0.03, 0.205), "#2a2a2a", segs=6)
    elif kind == "knife":
        p.box((0.012, 0.03, 0.14), (-0.12, -0.1, 0.14), "#c8ccd0", rot=(0.2, 0, 0), bevel=0.0)
        p.box((0.014, 0.034, 0.05), (-0.12, -0.09, 0.22), "#3a2418", bevel=0.0)
        p.box((0.014, 0.036, 0.06), (-0.12, -0.11, 0.1), BLOOD, rot=(0.2, 0, 0), bevel=0.0)
        p.ball(0.03, (0.02, -0.1, 0.29), BLOOD, scale=(1.2, 0.3, 1.4), subdiv=0)
    elif kind == "grin":
        p.box((0.07, 0.012, 0.022), (0, -0.075, 0.395), SHADOW, bevel=0.0)
        for i in range(6):
            p.box((0.008, 0.008, 0.012), (-0.03 + i * 0.012, -0.082, 0.398), "#f4f0e8", bevel=0.0)
        p.ball(0.03, (0.05, -0.05, 0.47), SHADOW, scale=(1, 0.5, 1), subdiv=1)
        p.ball(0.022, (-0.06, -0.04, 0.4), "#c8a890", scale=(1, 0.4, 1), subdiv=0)


def gnome():
    p = Prop("gnome", 435)
    # A garden gnome with a lantern: beard in curls, cheeks, a belt buckle, a hat that's flopped over. They're all facing you.
    _gnome(p, "#3a6ab0", "#c8302a", "lantern")
    p.export()


def gnome_knife():
    p = Prop("gnome_knife", 436)
    # The same gnome, except it's holding something behind its leg, and it's been used.
    _gnome(p, "#2f6a4a", "#c8302a", "knife")
    p.export()


def gnome_grin():
    p = Prop("gnome_grin", 437)
    # Chipped, with a hole where one eye was, and a grin of very small teeth that weren't in the mould.
    _gnome(p, "#8a3a8a", "#2a4a8a", "grin")
    p.export()



BUILDERS = [
    window_figure, window_faces, window_boarded, window_broken, window_bloody, door_boarded, drainpipe, wall_creeper,
    lambda: suburb_house("suburb_house_a", "#e8dcc0", 420, "#6a4a3e", "#a8302a", "nice"),
    lambda: suburb_house("suburb_house_b", "#c0d0d8", 421, "#4a4a58", "#2f5a7a", "nice"),
    lambda: suburb_house("suburb_house_c", "#d8c8c0", 422, "#5a3a34", "#2f6a4a", "nice"),
    lambda: suburb_house("suburb_house_watched", "#e8dcc0", 423, "#5a4a44", "#3a3a44", "watched"),
    lambda: suburb_house("suburb_house_dark", "#a8a498", 424, "#3a3a3e", "#2a2a2e", "dark"),
    lambda: suburb_house("suburb_house_bloody", "#d8c8c0", 425, "#5a3a34", "#a8302a", "bloody"),
    bush_round, bush_eyes, topiary_man, topiary_hand, dead_bush, thorn_bush, picket_run, doll_head,
    lambda: suburb_tree("suburb_tree", 650, "none"), lambda: suburb_tree("suburb_tree_tyre", 651, "tyre"), lambda: suburb_tree("suburb_tree_dolls", 652, "dolls"), lambda: suburb_tree("suburb_tree_hanged", 653, "hanged"),
    tree, hedge, jungle_tree, gnome, gnome_knife, gnome_grin,
    grass_clump, grass_tall, flowers, weed_crack, rubble_bits, bone_bits, tooth_bits, receipts, lint_tufts, gutter_fat, reeds, pond_scum, coal_bits, fry_bits, mold_tuft, pamphlets, far_figure, hanged_figure,
]

if __name__ == "__main__":
    for build in BUILDERS:
        build()
    print("DRESSING DONE")
