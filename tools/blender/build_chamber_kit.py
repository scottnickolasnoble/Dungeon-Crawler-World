# The boss-chamber kit (after the user's reference paintings): arena wall segments with arched glowing alcoves, carved
# glyph monoliths, the round stepped dais, its steps, causeway slabs with glowing seams, the gateway, and broken rock
# that drifts overhead. Glyphs and seams are white glow; the game tints them to each floor's colour.
#   F:\Downstairs\Blender\blender.exe -b --python tools/blender/build_chamber_kit.py [-- name name ...]
# Exports to godot/models/props/wilds/<name>.glb. Front faces -Y in Blender (+Z in Godot), origin on the floor.
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_landing_kit as kit
from build_landing_kit import Prop

kit.OUT = os.path.join(os.path.dirname(kit.OUT), "wilds")
STONE = "#5e5a62"
STONE_DARK = "#3e3a44"
STONE_LIGHT = "#7a7680"
GLOW = "glow:#ffffff"
EMBER = "glow:#ffb860"
CRACK = "#1e1a22"


def chamber_wall():
    p = Prop("chamber_wall", 900)
    W, H, D = 9.4, 16.0, 3.0
    # plinth, body, cornice
    p.box((W, D + 0.6, 1.2), (0, 0, 0.6), STONE_DARK, bevel=0.08)
    for s in (-1, 1):
        p.box((1.6, D, H - 2.2), (s * (W / 2 - 0.8), 0, 1.2 + (H - 2.2) / 2), STONE, bevel=0.06, wonk=0.01)
        for k in range(5):
            p.box((1.9, D + 0.25, 0.35), (s * (W / 2 - 0.8), 0, 2.6 + k * 2.7), STONE_LIGHT, bevel=0.04)
    p.box((W - 3.2, D * 0.45, H - 2.2), (0, D * 0.27, 1.2 + (H - 2.2) / 2), STONE_DARK, bevel=0.04)
    # the arch over the alcove, block by block
    for i in range(11):
        a = math.pi * i / 10
        p.box((0.9, D * 0.8, 0.7), (math.cos(a) * 2.6, -D * 0.1, 7.4 + math.sin(a) * 2.6), STONE_LIGHT, rot=(0, -a + math.pi / 2, 0), bevel=0.04, wonk=0.02)
    # the alcove's lit back, a niche floor and a brazier bowl
    p.box((4.4, 0.1, 7.2), (0, D * 0.02, 1.2 + 3.6), EMBER, bevel=0.0)
    p.box((5.6, 1.4, 0.4), (0, -D * 0.35, 1.4), STONE_LIGHT, bevel=0.05)
    p.lathe([(0.2, 0), (0.7, 0.5), (0.9, 0.9), (0.85, 1.0)], (0, -D * 0.4, 1.6), "#2a2228", segs=10)
    p.ball(0.55, (0, -D * 0.4, 2.55), EMBER, scale=(1, 1, 1.3), lumpy=0.15, subdiv=1)
    p.box((W + 0.4, D + 0.8, 1.0), (0, 0, H - 1.0 + 0.5), STONE_LIGHT, bevel=0.08)
    p.box((W, D + 0.4, 0.6), (0, 0, H - 0.3 + 0.5), STONE_DARK, bevel=0.05)
    # cracks and a couple of fallen chunks
    for k in range(5):
        x = p.rng.uniform(-W / 2 + 0.6, W / 2 - 0.6)
        p.box((0.06, 0.08, p.rng.uniform(0.8, 2.6)), (x, -D / 2 - 0.01, p.rng.uniform(2, 13)), CRACK, rot=(0, p.rng.uniform(-0.6, 0.6), 0), bevel=0.0)
    p.ball(0.6, (W / 2 - 1.0, -D / 2 - 0.8, 0.4), STONE, lumpy=0.3, subdiv=1)
    p.export()


def chamber_monolith():
    p = Prop("chamber_monolith", 901)
    H = 20.0
    p.box((5.0, 5.0, 1.0), (0, 0, 0.5), STONE_DARK, bevel=0.1)
    p.box((4.2, 4.2, 1.0), (0, 0, 1.5), STONE, bevel=0.08)
    # a tapering shaft in drums, each slightly askew
    for k in range(6):
        w = 3.4 - k * 0.18
        p.box((w, w, 2.9), (0, 0, 2.0 + 1.45 + k * 2.95), STONE if k % 2 else STONE_LIGHT, bevel=0.07, wonk=0.012)
    # carved glyph panels on all four faces: recess, then glowing marks
    for face in range(4):
        a = face * math.pi / 2
        n = (math.sin(a), -math.cos(a))
        for k in range(5):
            z = 3.6 + k * 3.0
            w = 3.4 - min(5, int((z - 2.0) / 2.95)) * 0.18 + 0.06
            cx, cy = n[0] * (w / 2 + 0.01), n[1] * (w / 2 + 0.01)
            p.box((0.9, 0.06, 2.0), (cx, cy, z), STONE_DARK, rot=(0, 0, a), bevel=0.0)
            for g in range(3):
                gz = z - 0.7 + g * 0.7
                gw = p.rng.choice([0.5, 0.3, 0.6])
                p.box((gw, 0.08, 0.12), (cx + n[0] * 0.02, cy + n[1] * 0.02, gz), GLOW, rot=(0, 0, a), bevel=0.0)
            p.box((0.1, 0.08, 1.6), (cx + n[0] * 0.02 + math.cos(a) * 0.3, cy + n[1] * 0.02 + math.sin(a) * 0.3, z), GLOW, rot=(0, 0, a), bevel=0.0)
    p.lathe([(2.0, 0), (2.2, 0.4), (1.2, 1.4), (0.2, 2.6), (0.01, 2.8)], (0, 0, 2.0 + 6 * 2.95), STONE_LIGHT, segs=4, rot=(0, 0, math.pi / 4))
    p.export()


def chamber_dais():
    p = Prop("chamber_dais", 902)
    R, H = 13.0, 3.0
    # a stepped rim, a carved band with a glowing inlay, and flagstones on top
    p.lathe([(R + 1.0, 0), (R + 1.0, 0.6), (R + 0.5, 0.6), (R + 0.5, 1.4), (R + 0.2, 1.4), (R + 0.2, H - 0.4), (R, H - 0.4), (R, H), (0.01, H)], (0, 0, 0), STONE, segs=48)
    p.lathe([(R + 0.24, 0), (R + 0.24, 0.22)], (0, 0, 1.9), GLOW, segs=48)
    for i in range(36):
        a = i * math.tau / 36
        p.box((0.5, 0.2, 0.9), (math.cos(a) * (R + 0.25), math.sin(a) * (R + 0.25), 1.0), STONE_DARK, rot=(0, 0, a), bevel=0.03)
    for ring_r, n in ((3.0, 8), (6.5, 16), (10.0, 24)):
        for i in range(n):
            a = (i + 0.5) * math.tau / n
            p.box((ring_r * 0.36, 2.6, 0.06), (math.cos(a) * ring_r, math.sin(a) * ring_r, H + 0.02), STONE_LIGHT if i % 2 else STONE, rot=(0, 0, a + math.pi / 2), bevel=0.04, wonk=0.01)
    p.lathe([(2.2, 0), (2.2, 0.1)], (0, 0, H + 0.04), GLOW, segs=24)
    p.export()


def chamber_steps():
    p = Prop("chamber_steps", 903)
    # a broad flight of steps up the dais: 7.8 m long, 3 m high, 6 m wide, going up towards -Y
    n = 12
    for k in range(n):
        p.box((6.0, 7.8 / n + 0.02, (k + 1) * 3.0 / n), (0, 3.9 - (k + 0.5) * 7.8 / n, (k + 1) * 3.0 / n / 2), STONE if k % 2 else STONE_LIGHT, bevel=0.03, wonk=0.005)
    for s in (-1, 1):
        p.box((0.6, 7.8, 0.5), (s * 3.3, 0, 1.6), STONE_DARK, rot=(-math.atan2(3.0, 7.8), 0, 0), bevel=0.05)
    p.export()


def causeway_slab():
    p = Prop("causeway_slab", 904)
    # one 6 x 3 slab of the causeway: cracked flags with a glowing seam across the end
    for i in range(3):
        p.box((1.94, 2.9, 0.5), (-2.0 + i * 2.0, 0, 0.25), STONE if i % 2 else STONE_LIGHT, bevel=0.05, wonk=0.006)
    p.box((6.1, 0.1, 0.06), (0, 1.48, 0.5), GLOW, bevel=0.0)
    for k in range(3):
        p.box((0.05, p.rng.uniform(0.6, 1.6), 0.02), (p.rng.uniform(-2.6, 2.6), p.rng.uniform(-1, 1), 0.51), CRACK, rot=(0, 0, p.rng.uniform(0, 3)), bevel=0.0)
    p.export()


def chamber_gate():
    p = Prop("chamber_gate", 905)
    W, H = 12.0, 16.0
    for s in (-1, 1):
        x = s * (W / 2 + 0.6)
        p.box((2.8, 3.6, 1.2), (x, 0, 0.6), STONE_DARK, bevel=0.08)
        p.box((2.2, 3.0, H - 2.0), (x, 0, 1.2 + (H - 2.0) / 2), STONE, bevel=0.07, wonk=0.01)
        for k in range(4):
            p.box((0.2, 0.08, 1.8), (x, -1.52, 3.0 + k * 3.0), GLOW, bevel=0.0)
    p.box((W + 5.0, 3.8, 2.4), (0, 0, H - 1.2), STONE_LIGHT, bevel=0.1)
    # a carved face over the gate, eyes lit
    p.ball(1.4, (0, -1.9, H - 1.4), STONE, scale=(1, 0.45, 1.1), subdiv=2)
    for s in (-1, 1):
        p.ball(0.22, (s * 0.5, -2.45, H - 1.1), GLOW, subdiv=1)
    p.box((1.0, 0.2, 0.2), (0, -2.45, H - 1.9), CRACK, bevel=0.0)
    p.export()


def float_rock(name, seed, scale):
    p = Prop(name, seed)
    # a broken chunk of the chamber's roof: lumpy, with a flat broken face and a few smaller bits clinging on
    p.ball(1.0, (0, 0, 0), STONE, scale=scale, lumpy=0.28, subdiv=2)
    p.box((scale[0] * 1.4, scale[1] * 1.4, 0.3), (0, 0, scale[2] * 0.75), STONE_LIGHT, bevel=0.1, wonk=0.1)
    for k in range(3):
        p.ball(0.35, (p.rng.uniform(-1, 1) * scale[0], p.rng.uniform(-1, 1) * scale[1], -scale[2] * 0.7), STONE_DARK, lumpy=0.3, subdiv=1)
    p.box((0.3, 0.1, 1.4), (scale[0] * 0.6, -scale[1] * 0.9, 0), GLOW, rot=(0, 0.4, 0), bevel=0.0)
    p.export()


BUILDERS = {
    "chamber_wall": chamber_wall, "chamber_monolith": chamber_monolith, "chamber_dais": chamber_dais, "chamber_steps": chamber_steps,
    "causeway_slab": causeway_slab, "chamber_gate": chamber_gate,
    "float_rock_a": lambda: float_rock("float_rock_a", 910, (3.0, 2.4, 1.6)),
    "float_rock_b": lambda: float_rock("float_rock_b", 911, (1.8, 1.6, 2.4)),
    "float_rock_c": lambda: float_rock("float_rock_c", 912, (4.0, 2.0, 1.2)),
}
if __name__ == "__main__":
    names = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else list(BUILDERS)
    for name in names:
        kit.reset() if hasattr(kit, "reset") else None
        BUILDERS[name]()
        print("BUILT", name, flush=True)
