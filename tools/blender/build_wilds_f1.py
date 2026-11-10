# Props for the land outside the towns on Floor 1: wreckage, ruins, shrines and the cave.
#   F:\Downstairs\Blender\blender.exe -b --python tools/blender/build_wilds_f1.py
# Exports to godot/models/props/wilds/<name>.glb.
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_landing_kit as kit
from build_landing_kit import Prop, STEEL, DARK, CREAM, RED, BRASS

kit.OUT = os.path.join(os.path.dirname(kit.OUT), "wilds")
os.makedirs(kit.OUT, exist_ok=True)
CONCRETE = "#7a746c"
CONE = "#ea6714"


def slab_pile():
    p = Prop("slab_pile", 101)
    # A collapsed section of ceiling: tilted slabs, snapped rebar and dust.
    for i in range(9):
        a = i * 0.71
        r = 0.6 + i * 0.42
        size = (p.rng.uniform(2.6, 4.6), p.rng.uniform(2.2, 3.8), p.rng.uniform(0.3, 0.5))
        p.box(size, (math.cos(a) * r, math.sin(a) * r, 0.3 + (9 - i) * 0.16), p.rng.choice((CONCRETE, "#6a645c", "#8a847a")), rot=(p.rng.uniform(-0.5, 0.5), p.rng.uniform(-0.5, 0.5), a), bevel=0.05)
    for i in range(14):
        a = p.rng.uniform(0, 6.3)
        r = p.rng.uniform(0.5, 3.6)
        base = (math.cos(a) * r, math.sin(a) * r, p.rng.uniform(0.5, 1.4))
        tip = (base[0] + p.rng.uniform(-0.9, 0.9), base[1] + p.rng.uniform(-0.9, 0.9), base[2] + p.rng.uniform(0.8, 2.2))
        p.tube([base, tip], 0.022, "#7a4a2a", 5)
    for i in range(16):
        a = p.rng.uniform(0, 6.3)
        r = p.rng.uniform(3.0, 6.0)
        p.ball(p.rng.uniform(0.14, 0.42), (math.cos(a) * r, math.sin(a) * r, 0.12), CONCRETE, lumpy=0.25, subdiv=1)
    p.export()


def broken_pillar():
    p = Prop("broken_pillar", 102)
    # A column snapped halfway, with the top half lying across the floor.
    p.box((1.2, 1.2, 3.6), (0, 0, 1.8), CONCRETE, rot=(0.02, 0.03, 0), bevel=0.05)
    for i in range(6):
        p.box((1.22, 1.22, 0.13), (0, 0, 0.15 + i * 0.26), "#d9b32a" if i % 2 else "#222128", bevel=0.0)
    p.box((1.2, 1.2, 4.6), (2.9, 0.5, 0.75), CONCRETE, rot=(0.1, 1.42, 0.2), bevel=0.05)
    for i in range(9):
        a = i * 0.7
        p.tube([(math.cos(a) * 0.4, math.sin(a) * 0.4, 3.4), (math.cos(a) * 0.55, math.sin(a) * 0.55, 4.5 + (i % 3) * 0.5)], 0.024, "#7a4a2a", 5)
    p.ball(0.75, (0.8, -0.9, 0.3), "#6a645c", lumpy=0.25, subdiv=1)
    p.export()


def wall_run():
    p = Prop("wall_run", 105)
    # 12 m of concrete dividing wall that breaks up the car park. Height 9.5 m, floor to ceiling.
    p.box((12, 0.8, 9.5), (0, 0, 4.75), CONCRETE, bevel=0.04)
    for x in (-6, 0, 6):
        p.box((0.9, 1.1, 9.5), (x, 0, 4.75), "#6a645c", bevel=0.05)
    for s in (-1, 1):
        p.box((12, 0.03, 0.5), (0, s * 0.41, 1.1), "#d9b32a", bevel=0.0)
        p.box((12, 0.03, 0.14), (0, s * 0.41, 0.8), "#222128", bevel=0.0)
    p.cyl(0.08, 0.08, 12, (0, -0.56, 8.7), "#7a4a2a", rot=(0, math.pi / 2, 0), segs=8)
    p.cyl(0.05, 0.05, 12, (0, -0.52, 8.45), STEEL, rot=(0, math.pi / 2, 0), segs=8)
    p.export()


def cone_totem():
    p = Prop("cone_totem", 106)
    # A goblin shrine: cones stacked into a towering idol with a hubcap face, candles and offerings at its feet.
    for i in range(9):
        z = i * 0.62
        r = 1.05 - i * 0.07
        p.lathe([(r, 0), (r * 0.42, 1.0), (r * 0.3, 1.25)], (p.rng.uniform(-0.07, 0.07), p.rng.uniform(-0.07, 0.07), z), CONE if i % 3 else "#f4ece0", segs=14)
    for i in range(8):
        a = i * math.tau / 8
        p.box((0.8, 0.8, 0.07), (math.cos(a) * 2.0, math.sin(a) * 2.0, 0.04), "#c94e12", rot=(0, 0, a), bevel=0.012)
        p.lathe([(0.32, 0), (0.08, 0.72)], (math.cos(a) * 2.0, math.sin(a) * 2.0, 0.05), CONE, segs=10)
    for s in (-1, 1):
        p.cyl(0.32, 0.26, 0.05, (s * 0.46, -0.8, 3.0), "#b8bcc0", rot=(math.pi / 2 - 0.12, 0, 0), segs=14)
        p.ball(0.09, (s * 0.46, -0.84, 3.0), "glow:#ff3a2a")
    for i in range(14):
        a = i * 0.45
        r = 1.45 + (i % 3) * 0.2
        p.cyl(0.05, 0.05, 0.22, (math.cos(a) * r, math.sin(a) * r, 0.11), "#e8dcc0", segs=6)
        p.ball(0.035, (math.cos(a) * r, math.sin(a) * r, 0.27), "glow:#ffb040", scale=(0.8, 0.8, 1.5), subdiv=1)
    p.export()


def remains():
    p = Prop("remains", 107)
    # Somebody who didn't make it, slumped against whatever is behind them, still wearing the Contestant lanyard.
    bone = "#d8cfb4"
    p.ball(0.13, (0, 0.08, 0.72), bone, scale=(0.9, 1, 1.1), subdiv=2)
    for s in (-1, 1):
        p.ball(0.03, (s * 0.05, -0.03, 0.74), "#0f0e12", subdiv=1)
    p.box((0.1, 0.05, 0.03), (0, -0.04, 0.63), bone, bevel=0.0)
    p.box((0.38, 0.2, 0.48), (0, 0.14, 0.3), "#6a4a3a", rot=(-0.2, 0, 0), bevel=0.04)
    for s in (-1, 1):
        p.tube([(s * 0.18, 0.1, 0.05), (s * 0.24, -0.34, 0.1), (s * 0.3, -0.75, 0.04)], 0.035, bone, 6)
        p.tube([(s * 0.2, 0.12, 0.46), (s * 0.34, 0.0, 0.22), (s * 0.4, -0.22, 0.05)], 0.028, bone, 6)
    p.box((0.05, 0.015, 0.08), (0.03, 0.02, 0.28), "#b4282a", bevel=0.0)
    p.tube(p.sag((-0.1, 0.05, 0.56), (0.1, 0.05, 0.56), 0.26, 5), 0.006, "#2f5b57", 3)
    p.box((0.2, 0.14, 0.2), (0.62, -0.4, 0.1), "#7a5230", rot=(0, 0, 0.5), bevel=0.02)
    p.lathe([(0.05, 0), (0.055, 0.14), (0.04, 0.14)], (-0.6, -0.5, 0), "#d9b32a", segs=8, rot=(1.5, 0, 0.4))
    p.export()


def loot_chest():
    p = Prop("loot_chest", 108)
    # A network-branded loot box, lid ajar, shining from inside.
    p.box((1.3, 0.85, 0.62), (0, 0, 0.31), "#7a2a9c", bevel=0.05)
    for x in (-0.58, 0.58):
        p.box((0.13, 0.9, 0.66), (x, 0, 0.33), BRASS, bevel=0.015)
    p.box((1.2, 0.74, 0.04), (0, 0, 0.62), "glow:#ffd24a", bevel=0.0)
    p.box((1.34, 0.9, 0.2), (0, 0.42, 0.92), "#8a35b0", rot=(-0.95, 0, 0), bevel=0.04)
    p.box((0.24, 0.05, 0.3), (0, -0.44, 0.45), BRASS, bevel=0.015)
    p.ball(0.06, (0, -0.48, 0.45), "glow:#ff3ac8")
    for i in range(16):
        a = i * 1.1
        r = 0.74 + (i % 4) * 0.14
        p.cyl(0.06, 0.06, 0.02, (math.cos(a) * r, math.sin(a) * r * 0.8, 0.012), BRASS, segs=8)
    p.export()


def sinkhole_rim():
    p = Prop("sinkhole_rim", 109)
    # The way into the cave: a ragged hole of broken slabs and cones, a ladder going down, a warning nobody heeded.
    n = 14
    for i in range(n):
        a = i * math.tau / n
        p.box((2.3, 1.5, 0.5), (math.cos(a) * 3.6, math.sin(a) * 3.6, 0.12), p.rng.choice((CONCRETE, "#6a645c")), rot=(p.rng.uniform(-0.25, 0.25), p.rng.uniform(-0.3, 0.3), a + math.pi / 2), bevel=0.05)
    p.cyl(3.1, 3.1, 0.03, (0, 0, 0.05), "#050406", segs=22)
    for s in (-1, 1):
        p.tube([(s * 0.26, 2.6, 0.05), (s * 0.26, 2.9, 1.25)], 0.024, STEEL, 5)
    for i in range(4):
        p.tube([(-0.26, 2.66 + i * 0.07, 0.3 + i * 0.26), (0.26, 2.66 + i * 0.07, 0.3 + i * 0.26)], 0.016, STEEL, 4)
    for x, y in ((-3.6, -2.4), (3.3, -2.8), (0, -4.6)):
        p.lathe([(0.26, 0), (0.06, 0.72)], (x, y, 0.2), CONE, segs=10)
    p.export()


def zip_tower():
    p = Prop("zip_tower", 110)
    # A scaffold platform that launches a service-rail trolley along the ceiling. Steps up the back side.
    for x in (-1.1, 1.1):
        for y in (-1.1, 1.1):
            p.cyl(0.07, 0.07, 5.2, (x, y, 2.6), STEEL, segs=6)
    for z in (1.6, 3.2, 5.0):
        for a, b in (((-1.1, -1.1), (1.1, -1.1)), ((1.1, -1.1), (1.1, 1.1)), ((1.1, 1.1), (-1.1, 1.1)), ((-1.1, 1.1), (-1.1, -1.1))):
            p.tube([(a[0], a[1], z), (b[0], b[1], z)], 0.03, "#555860", 5)
    for i in range(2):
        for s in (-1, 1):
            p.tube([(s * 1.1, -1.1, 1.6 + i * 1.7), (-s * 1.1, -1.1, 3.2 + i * 1.7)], 0.02, "#555860", 4)
    p.box((2.5, 2.5, 0.12), (0, 0, 5.05), "#6a4a2a", bevel=0.02)
    p.box((0.34, 0.1, 0.9), (1.05, -1.2, 5.55), "#d9b32a", bevel=0.01)
    p.box((0.5, 0.5, 0.3), (0, 0, 8.9), DARK, bevel=0.02)
    p.cyl(0.06, 0.06, 3.5, (0, 0, 7.1), STEEL, segs=6)
    p.tube([(-1.0, 0.8, 5.1), (-1.0, 0.8, 6.1), (1.0, 0.8, 6.1), (1.0, 0.8, 5.1)], 0.03, "#d9b32a", 6)
    p.export()


def zip_rail():
    p = Prop("zip_rail", 111)
    # One 10 m length of overhead cable, hung from the ceiling, with warning flags.
    p.cyl(0.03, 0.03, 10, (0, 0, 8.85), STEEL, rot=(math.pi / 2, 0, 0), segs=6)
    for y in (-4, 4):
        p.tube([(0, y, 9.5), (0, y, 8.85)], 0.012, STEEL, 4)
    p.box((0.02, 0.26, 0.36), (0, 0.15, 8.62), "#d9b32a", bevel=0.0)
    p.export()


def zip_handle():
    p = Prop("zip_handle", 112)
    # The trolley you hang from while riding, seen above your head.
    p.box((0.3, 0.5, 0.14), (0, 0, 0.02), "#b4282a", bevel=0.03)
    for y in (-0.16, 0.16):
        p.cyl(0.08, 0.08, 0.22, (0, y, 0.12), DARK, rot=(0, math.pi / 2, 0), segs=10)
    for x in (-0.22, 0.22):
        p.tube([(0, 0, -0.04), (x, 0, -0.7)], 0.018, STEEL, 5)
    p.cyl(0.024, 0.024, 0.6, (0, 0, -0.72), "#34303a", rot=(0, math.pi / 2, 0), segs=8)
    p.export()


def eyes():
    p = Prop("eyes", 113)
    # Two eyes in the dark. They use a blink animation in Godot.
    for s in (-1, 1):
        p.ball(0.045, (s * 0.09, 0, 0), "glow:#ffd24a", scale=(1.2, 0.5, 0.75))
    p.export()


def bay_barrier():
    p = Prop("bay_barrier", 114)
    # A parking barrier arm, snapped, in a concrete foot, with a ticket machine still asking for payment.
    p.box((0.6, 0.6, 1.2), (0, 0, 0.6), "#c9992f", bevel=0.05)
    p.box((0.28, 0.3, 0.22), (0, 0, 1.1), DARK, bevel=0.02)
    for i in range(5):
        p.box((0.8, 0.1, 0.12), (0.7 + i * 0.8, 0, 1.05 + i * 0.045), "#d9281e" if i % 2 else "#f4ece0", rot=(0, -0.055, 0), bevel=0.0)
    p.box((0.5, 0.42, 1.5), (-1.4, 0.1, 0.75), "#4a6a7a", bevel=0.04)
    p.box((0.34, 0.03, 0.26), (-1.4, -0.12, 1.2), "#1f6a58", bevel=0.0)
    p.box((0.12, 0.03, 0.04), (-1.4, -0.12, 0.92), BRASS, bevel=0.0)
    p.export()


def cave():
    # The cave is a solid shape of chambers and tunnels, merged by voxel remesh, then turned inside out so you walk inside it.
    # Spans about 110 x 90 m and drops 14 m. Origin at the entry chamber's floor.
    bm = bmesh.new()
    def chamber(c, r):
        v = bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0)["verts"]
        for vert in v:
            vert.co.x = vert.co.x * r[0] + c[0]
            vert.co.y = vert.co.y * r[1] + c[1]
            vert.co.z = vert.co.z * r[2] + c[2]
    rooms = [((0, 0, 3), (7, 7, 5)), ((24, 10, 0.5), (11, 9, 6)), ((52, 4, -3), (15, 13, 8)), ((46, 34, -6), (11, 10, 6)), ((16, 40, -9), (14, 11, 7)), ((-12, 28, -7), (8, 8, 5))]
    for c, r in rooms:
        chamber(c, r)
    links = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (1, 4)]
    for a, b in links:
        A = Vector(rooms[a][0])
        B = Vector(rooms[b][0])
        n = int((B - A).length / 3)
        for i in range(n + 1):
            t = i / max(n, 1)
            c = A.lerp(B, t) + Vector((math.sin(t * 7) * 2.0, math.cos(t * 5) * 2.0, 0))
            chamber(c, (3.6, 3.6, 3.3))
    mesh = bpy.data.meshes.new("cave_solid")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("cave", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    remesh = obj.modifiers.new("r", "REMESH")
    remesh.mode = "VOXEL"
    remesh.voxel_size = 0.9
    bpy.ops.object.modifier_apply(modifier="r")
    # craggy rock, with a flatter floor so it can be walked on
    tex = bpy.data.textures.new("rock", "CLOUDS")
    tex.noise_scale = 4.0
    disp = obj.modifiers.new("d", "DISPLACE")
    disp.texture = tex
    disp.strength = 2.0
    bpy.ops.object.modifier_apply(modifier="d")
    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
    for f in bm.faces:
        f.smooth = True
    # low spots are floor: flatten them into terraces per chamber height
    for v in bm.verts:
        nearest = min(rooms, key=lambda rm: (Vector(rm[0]) - v.co).length)
        floor_z = nearest[0][2] - nearest[1][2] * 0.62
        if v.co.z < floor_z:
            v.co.z = floor_z + (v.co.z - floor_z) * 0.12
    bm.to_mesh(me)
    bm.free()
    mat = bpy.data.materials.new("paint_59504a")
    mat.use_nodes = True
    next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Base Color"].default_value = kit.rgba("#59504a")
    me.materials.append(mat)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(kit.OUT, "cave.glb"), export_format="GLB", use_selection=True, export_yup=True, export_materials="EXPORT")
    print("built cave", len(me.polygons), "faces")


def crystal():
    p = Prop("crystal", 115)
    # Glow fungus and pale crystals growing in the cave.
    for i in range(7):
        a = i * 1.05
        r = 0.28 + (i % 3) * 0.24
        h = 0.5 + (i % 4) * 0.36
        p.lathe([(0.14, 0), (0.1, h * 0.7), (0.0, h)], (math.cos(a) * r, math.sin(a) * r, 0), "glow:#6ae8d8" if i % 2 else "glow:#a88aff", segs=5, rot=(math.sin(a) * 0.3, math.cos(a) * 0.3, 0))
    p.export()


def cones_hat():
    p = Prop("cones_hat", 116)
    # A real traffic cone worn as a hat, tipped to one side. Picture generators won't draw one, so it goes on as a prop.
    rot = (0.14, 0.2, 0.3)
    p.box((0.32, 0.32, 0.028), (0, 0, 0.0), "#c94e12", rot=rot, bevel=0.008)
    p.lathe([(0.125, 0), (0.08, 0.15), (0.066, 0.22), (0.042, 0.33), (0.022, 0.46)], (0, 0, 0.015), "#ea6714", segs=14, rot=rot)
    p.lathe([(0.083, 0), (0.066, 0.08)], (-0.022, -0.012, 0.165), "#f4ece0", segs=14, rot=rot)
    p.export()


def pylon_stack():
    p = Prop("pylon_stack", 117)
    # Sergeant Pylon's crown: traffic cones nested into one another, each knocked a little off true.
    y = 0.0
    for i, (lean, turn) in enumerate(((0.0, 0.0), (0.05, 0.5), (-0.04, 1.1), (0.07, 1.8))):
        rot = (lean, lean * 0.6, turn)
        off = (lean * 0.5, -lean * 0.3, y)
        if i == 0:
            p.box((0.36, 0.36, 0.03), (0, 0, 0.0), "#c94e12", rot=rot, bevel=0.008)
        p.lathe([(0.135, 0), (0.09, 0.16), (0.072, 0.24), (0.046, 0.36), (0.024, 0.5)], (off[0], off[1], off[2] + 0.015), "#ea6714", segs=16, rot=rot)
        p.lathe([(0.093, 0), (0.073, 0.08)], (off[0], off[1], off[2] + 0.17), "#f4ece0", segs=16, rot=rot)
        y += 0.1
    p.export()


if __name__ == "__main__":
    wanted = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    for build in (pylon_stack, cones_hat, slab_pile, broken_pillar, wall_run, cone_totem, remains, loot_chest, sinkhole_rim, zip_tower, zip_rail, zip_handle, eyes, bay_barrier, crystal, cave):
        try:
            if wanted and build.__name__ not in wanted:
                continue
            build()
        except Exception as error:
            print("FAILED", build.__name__, repr(error))
            raise
    print("WILDS KIT DONE")
