# The storybook town kit: half-timbered framing for a storey of wall, a tiled gable roof, and a brick chimney stack.
# Building.gd tiles and stretches them over every shop, house and inn on the timber floors (3, 13, 14) and puts the
# roof on every gable-roofed floor. Roof tiles are marker greys (#6f..#9f) that the game multiplies by the floor's
# roof colour, so one roof suits every floor.
#   timber_bay       2.5 m wide, 3.2 m tall, beams only (it sits over a plaster wall)
#   roof_gable_tiles 11 m across the slopes, 9 m along the ridge, 3.4 m rise; ridge runs along Godot Z
#   chimney_stack    1.3 x 1.0 m, 4.2 m tall
#   F:\Downstairs\Blender\blender.exe -b --python tools/blender/build_town_kit.py [-- name name ...]
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_landing_kit as kit
from build_landing_kit import Prop

kit.OUT = os.path.join(os.path.dirname(kit.OUT), "town")
OAK = ["#3a2618", "#43301e", "#33221a"]
TILE = ["#7f7f7f", "#8f8f8f", "#9f9f9f"]
RIDGE = "#6f6f6f"
PLASTER = "#d8ccb4"
BRICK = ["#7a3a2a", "#8a4430", "#6a3226", "#7e4030"]
MORTAR = "#4a3a34"
SOOT = "#1e1a1a"
GLOW = "glow:#ffb860"


def timber_bay(name="timber_bay", seed=970, cross=False):
    p = Prop(name, seed)
    W, H, T = 2.5, 3.2, 0.16
    oak = lambda: p.rng.choice(OAK)
    # posts at each edge, sill and head rails, a middle rail at window-sill height
    for s in (-1, 1):
        p.box((0.24, T, H), (s * (W / 2 - 0.12), -T / 2, H / 2), oak(), bevel=0.02, wonk=0.015)
    p.box((W, T + 0.02, 0.24), (0, -T / 2, 0.12), oak(), bevel=0.02, wonk=0.01)
    p.box((W, T + 0.02, 0.22), (0, -T / 2, H - 0.11), oak(), bevel=0.02, wonk=0.01)
    p.box((W - 0.4, T, 0.18), (0, -T / 2, 1.05), oak(), bevel=0.02, wonk=0.01)
    # braces: a pair leaning in under the middle rail, or a full cross in the upper panel
    length = math.hypot(W / 2 - 0.25, 0.8)
    ang = math.atan2(0.8, W / 2 - 0.25)
    for s in (-1, 1):
        p.box((length, T - 0.02, 0.16), (s * (W / 4 - 0.06), -T / 2, 0.56), oak(), rot=(0, s * ang, 0), bevel=0.015, wonk=0.01)
    if cross:
        up = math.hypot(W - 0.45, H - 1.4)
        a2 = math.atan2(H - 1.4, W - 0.45)
        for s in (-1, 1):
            p.box((up, T - 0.03, 0.15), (0, -T / 2 - 0.01 * s, 1.14 + (H - 1.4) / 2), oak(), rot=(0, s * a2, 0), bevel=0.015, wonk=0.01)
    # wooden pegs at the joints
    for x in (-W / 2 + 0.12, W / 2 - 0.12):
        for z in (0.12, 1.05, H - 0.11):
            p.ball(0.04, (x, -T - 0.01, z), "#2a1a10", subdiv=1)
    p.export()


def timber_bay_cross():
    timber_bay("timber_bay_cross", 971, cross=True)


def roof_gable_tiles():
    p = Prop("roof_gable_tiles", 972)
    HX, HY, RISE = 5.5, 4.5, 3.4
    slope = math.hypot(HX, RISE)
    ang = math.atan2(RISE, HX)
    rows = 17
    for s in (-1, 1):
        for r in range(rows):
            t = (r + 0.5) / rows
            # rows run along the ridge, stepping down the slope; each slightly overlaps the one below
            x = s * HX * (1 - t)
            z = RISE * t
            p.box((slope / rows + 0.12, HY * 2, 0.07), (x, 0, z + 0.04), p.rng.choice(TILE), rot=(0, s * ang, 0), bevel=0.0, wonk=0.004)
            # a ragged lower edge: a few tiles slipped or missing
            for k in range(3):
                if p.rng.random() < 0.5:
                    yk = p.rng.uniform(-HY + 0.4, HY - 0.4)
                    p.box((0.35, 0.5, 0.05), (x + s * 0.12, yk, z + 0.02), p.rng.choice(TILE), rot=(0, s * ang + p.rng.uniform(-0.15, 0.15), p.rng.uniform(-0.2, 0.2)), bevel=0.0)
    # ridge cap, and bargeboards along both gable ends with a carved drop at the peak
    p.cyl(0.16, 0.16, HY * 2 + 0.1, (0, 0, RISE + 0.05), RIDGE, rot=(math.pi / 2, 0, 0), segs=8)
    for e in (-1, 1):
        for s in (-1, 1):
            p.box((slope + 0.2, 0.12, 0.32), (s * HX / 2, e * (HY + 0.02), RISE / 2 - 0.05), OAK[0], rot=(0, s * ang, 0), bevel=0.02, wonk=0.01)
        p.box((0.16, 0.14, 0.9), (0, e * (HY + 0.05), RISE - 0.45), OAK[1], bevel=0.02)
        # the gable end itself: plaster in steps, a centre post and a small lit window
        gy = e * (HY - 0.5)
        steps = 20
        for k in range(steps):
            zb = RISE * k / steps
            half = HX * (1 - (k + 0.5) / steps) - 0.45
            if half > 0.1:
                p.box((half * 2, 0.1, RISE / steps + 0.02), (0, gy, zb + RISE / steps / 2), PLASTER, bevel=0.0)
        p.box((0.2, 0.14, RISE - 0.3), (0, gy + e * 0.05, (RISE - 0.3) / 2), OAK[2], bevel=0.02)
        p.box((0.6, 0.06, 0.7), (0.6, gy + e * 0.07, RISE * 0.38), GLOW, bevel=0.0)
        p.box((0.8, 0.12, 0.1), (0.6, gy + e * 0.08, RISE * 0.38 - 0.4), OAK[0], bevel=0.01)
    p.export()


def chimney_stack():
    p = Prop("chimney_stack", 973)
    W, D, H = 1.3, 1.0, 4.2
    p.box((W - 0.06, D - 0.06, H), (0, 0, H / 2), MORTAR, bevel=0.0)
    row = 0.26
    for r in range(int(H / row)):
        z = row * (r + 0.5)
        off = 0.15 if r % 2 else 0.0
        for face, (w, dpos, rot) in enumerate([(W, -D / 2, 0), (W, D / 2, 0), (D, -W / 2, math.pi / 2), (D, W / 2, math.pi / 2)]):
            x = -w / 2 + off
            while x < w / 2 - 0.05:
                bw = min(0.3, w / 2 - x)
                if face < 2:
                    p.box((bw - 0.03, 0.05, row - 0.03), (x + bw / 2, dpos, z), p.rng.choice(BRICK), bevel=0.0)
                else:
                    p.box((0.05, bw - 0.03, row - 0.03), (dpos, x + bw / 2, z), p.rng.choice(BRICK), bevel=0.0)
                x += bw
    p.box((W + 0.25, D + 0.25, 0.22), (0, 0, H + 0.11), "#5a4a44", bevel=0.03)
    for x in (-0.3, 0.3):
        p.cyl(0.17, 0.13, 0.7, (x, 0, H + 0.57), "#a0563a", segs=10)
        p.cyl(0.11, 0.11, 0.04, (x, 0, H + 0.93), SOOT, segs=10)
    p.box((W - 0.1, 0.02, 0.9), (0, -D / 2 - 0.03, H - 0.5), SOOT, bevel=0.0)
    p.export()


def shop_counter():
    """The shop counter: waist-high, 4.2 m wide, a worn wooden top, panelled front, a till, a bell and a few jars, low
    enough that the shopkeeper behind it is plainly in view."""
    p = Prop("shop_counter", 974)
    W, D, H = 4.2, 0.9, 1.05
    p.box((W, D - 0.1, H - 0.08), (0, 0.05, (H - 0.08) / 2), OAK[0], bevel=0.03)
    p.box((W + 0.12, D + 0.1, 0.08), (0, 0, H - 0.04), "#7a5636", bevel=0.02, wonk=0.004)
    p.box((W + 0.05, 0.08, 0.12), (0, -D / 2 + 0.02, 0.06), OAK[2], bevel=0.02)
    # panelled front
    for k in range(5):
        x = -W / 2 + W / 10 + k * W / 5
        p.box((W / 5 - 0.16, 0.04, H - 0.32), (x, -D / 2 + 0.02, (H - 0.08) / 2 + 0.02), OAK[1], bevel=0.015)
        p.box((W / 5 - 0.3, 0.05, H - 0.46), (x, -D / 2, (H - 0.08) / 2 + 0.02), "#5a3e26", bevel=0.01)
    # a brass till at one end, a bell, jars of something and a ledger
    p.box((0.5, 0.42, 0.28), (W / 2 - 0.55, 0.1, H + 0.14), "#b88a3a", bevel=0.03)
    p.box((0.42, 0.06, 0.16), (W / 2 - 0.55, -0.12, H + 0.32), "#1e1a1a", rot=(0.4, 0, 0), bevel=0.01)
    p.box((0.38, 0.02, 0.1), (W / 2 - 0.55, -0.14, H + 0.33), "glow:#ffd27a", rot=(0.4, 0, 0), bevel=0.0)
    p.cyl(0.06, 0.06, 0.03, (-0.3, -0.15, H + 0.015), "#8a6a2a", segs=10)
    p.ball(0.07, (-0.3, -0.15, H + 0.08), "#d8b040", scale=(1, 1, 0.75), subdiv=1)
    for k, col in enumerate(("#7a9a5a", "#c8783a", "#8a3a5a")):
        x = -W / 2 + 0.4 + k * 0.28
        p.cyl(0.1, 0.1, 0.26, (x, 0.12, H + 0.13), "#c8d8d8", segs=10)
        p.cyl(0.085, 0.085, 0.18, (x, 0.12, H + 0.11), col, segs=10)
        p.cyl(0.105, 0.105, 0.04, (x, 0.12, H + 0.28), "#5a3e26", segs=10)
    p.box((0.45, 0.32, 0.06), (0.5, 0.05, H + 0.03), "#6a2a2a", rot=(0, 0, 0.15), bevel=0.01)
    p.box((0.4, 0.28, 0.02), (0.5, 0.05, H + 0.07), "#e8dcc0", rot=(0, 0, 0.15), bevel=0.0)
    p.export()


PIECES = {f.__name__: f for f in (timber_bay, timber_bay_cross, roof_gable_tiles, chimney_stack, shop_counter)}

if __name__ == "__main__":
    wanted = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else list(PIECES)
    for name in wanted:
        PIECES[name]()
