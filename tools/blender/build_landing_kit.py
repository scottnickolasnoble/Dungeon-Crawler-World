# Builds the Floor 0 prop kit and exports each prop to godot/models/props/landing/<name>.glb.
#   F:\Downstairs\Blender\blender.exe -b --python tools/blender/build_landing_kit.py
# Front of every prop faces -Y in Blender, which becomes +Z in Godot. Origin is on the floor at the prop's centre.
import math
import os
import random

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "godot", "models", "props", "landing")
os.makedirs(OUT, exist_ok=True)


def linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def rgba(hex_color):
    h = hex_color.lstrip("#")
    return tuple(linear(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)


class Prop:
    """One prop: a single mesh with chamfered, slightly hand-made parts. A material named glow_* renders unlit in Godot."""

    def __init__(self, name, seed=1):
        self.name = name
        self.bm = bmesh.new()
        self.materials = []
        self.rng = random.Random(seed)
        self.done = self.bm.faces.layers.int.new("done")

    def _mat(self, hex_color):
        if hex_color not in self.materials:
            self.materials.append(hex_color)
        return self.materials.index(hex_color)

    def _finish_part(self, verts, color, smooth, loc, rot, wonk):
        r = (rot[0] + self.rng.uniform(-wonk, wonk), rot[1] + self.rng.uniform(-wonk, wonk), rot[2] + self.rng.uniform(-wonk, wonk))
        matrix = Matrix.Translation(loc) @ Euler(r).to_matrix().to_4x4()
        bmesh.ops.transform(self.bm, matrix=matrix, verts=verts)
        index = self._mat(color)
        for f in self.bm.faces:
            if not f[self.done]:
                f.material_index = index
                f.smooth = smooth
                f[self.done] = 1

    def box(self, size, loc, color, rot=(0, 0, 0), bevel=0.02, wonk=0.0):
        v = bmesh.ops.create_cube(self.bm, size=1.0)["verts"]
        bmesh.ops.scale(self.bm, vec=size, verts=v)
        if bevel > 0:
            edges = list({e for vert in v for e in vert.link_edges})
            bmesh.ops.bevel(self.bm, geom=edges + v, offset=bevel, segments=1, profile=0.5, affect="EDGES")
            v = [vert for vert in self.bm.verts if any(not f[self.done] for f in vert.link_faces)]
        self._finish_part(v, color, False, loc, rot, wonk)

    def cyl(self, r_bottom, r_top, height, loc, color, rot=(0, 0, 0), segs=12, wonk=0.0):
        v = bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r_bottom, radius2=r_top, depth=height)["verts"]
        self._finish_part(v, color, True, loc, rot, wonk)

    def ball(self, radius, loc, color, scale=(1, 1, 1), rot=(0, 0, 0), subdiv=2, lumpy=0.0):
        v = bmesh.ops.create_icosphere(self.bm, subdivisions=subdiv, radius=radius)["verts"]
        for vert in v:
            vert.co.x *= scale[0]
            vert.co.y *= scale[1]
            vert.co.z *= scale[2]
            if lumpy:
                vert.co *= 1.0 + self.rng.uniform(-lumpy, lumpy)
        self._finish_part(v, color, lumpy == 0.0, loc, rot, 0.0)

    def lathe(self, profile, loc, color, segs=16, rot=(0, 0, 0)):
        """profile: (radius, height) pairs from bottom to top."""
        rings = []
        for radius, z in profile:
            ring = [self.bm.verts.new((radius * math.cos(i * math.tau / segs), radius * math.sin(i * math.tau / segs), z)) for i in range(segs)]
            rings.append(ring)
        for a, b in zip(rings, rings[1:]):
            for i in range(segs):
                self.bm.faces.new((a[i], a[(i + 1) % segs], b[(i + 1) % segs], b[i]))
        self.bm.faces.new(tuple(reversed(rings[0])))
        self.bm.faces.new(tuple(rings[-1]))
        self._finish_part([v for r in rings for v in r], color, True, loc, rot, 0.0)

    def tube(self, points, radius, color, segs=7):
        """A rope, cable or pipe through a list of points."""
        pts = [Vector(p) for p in points]
        rings = []
        for i, p in enumerate(pts):
            d = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
            a = d.cross(Vector((0, 0, 1)))
            if a.length < 0.01:
                a = d.cross(Vector((1, 0, 0)))
            a.normalize()
            b = d.cross(a)
            rings.append([self.bm.verts.new(p + (a * math.cos(k * math.tau / segs) + b * math.sin(k * math.tau / segs)) * radius) for k in range(segs)])
        for x, y in zip(rings, rings[1:]):
            for k in range(segs):
                self.bm.faces.new((x[k], x[(k + 1) % segs], y[(k + 1) % segs], y[k]))
        self.bm.faces.new(tuple(reversed(rings[0])))
        self.bm.faces.new(tuple(rings[-1]))
        self._finish_part([v for r in rings for v in r], color, True, Vector((0, 0, 0)), (0, 0, 0), 0.0)

    def sag(self, a, b, drop, n=10):
        a, b = Vector(a), Vector(b)
        return [a.lerp(b, i / n) - Vector((0, 0, drop * (1.0 - (2.0 * i / n - 1.0) ** 2))) for i in range(n + 1)]

    def bolts(self, xs, y, zs, color="#34323a", r=0.022):
        for x in xs:
            for z in zs:
                self.cyl(r, r * 0.8, 0.02, (x, y, z), color, rot=(math.pi / 2, 0, 0), segs=6)

    def export(self):
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        mesh = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(mesh)
        self.bm.free()
        for hex_color in self.materials:
            glow = hex_color.startswith("glow")
            value = hex_color.split(":")[-1]
            mat = bpy.data.materials.new(("glow_" if glow else "paint_") + value.lstrip("#"))
            mat.use_nodes = True
            bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
            bsdf.inputs["Base Color"].default_value = rgba(value)
            bsdf.inputs["Roughness"].default_value = 1.0
            mesh.materials.append(mat)
        mesh.set_sharp_from_angle(angle=math.radians(38))
        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.collection.objects.link(obj)
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, self.name + ".glb"), export_format="GLB", use_selection=True, export_yup=True, export_materials="EXPORT")
        bpy.data.objects.remove(obj)
        print("built", self.name, len(mesh.polygons), "faces")


STEEL = "#6d7178"
DARK = "#2c2b33"
BRASS = "#c9992f"
WOOD = "#9c6a38"
WOOD_DARK = "#6a4524"
CREAM = "#e4dcc4"
RED = "#b4282a"
GLOW_WARM = "glow:#fff4d8"


def desk():
    p = Prop("desk", 11)
    # A reception counter with angled wings: panelled front, kick plate, thick top, and a clutter of real desk things.
    for sign in (-1, 1):
        wing = (sign * 3.05, 0.22, 0.55)
        p.box((1.15, 0.16, 0.95), wing, WOOD, rot=(0, 0, sign * 0.55), bevel=0.03)
        p.box((1.3, 0.72, 0.09), (sign * 3.0, 0.42, 1.08), "#7a4a24", rot=(0, 0, sign * 0.55), bevel=0.025)
        p.box((1.16, 0.2, 0.12), (sign * 3.05, 0.22, 0.06), DARK, rot=(0, 0, sign * 0.55), bevel=0.015)
    p.box((5.2, 0.16, 0.95), (0, -0.62, 0.55), WOOD, bevel=0.03)
    p.box((5.2, 0.2, 0.12), (0, -0.62, 0.06), DARK, bevel=0.015)
    p.box((5.5, 1.15, 0.09), (0, -0.2, 1.08), "#7a4a24", bevel=0.025)
    for i in range(6):
        x = -2.15 + i * 0.86
        p.box((0.72, 0.03, 0.6), (x, -0.71, 0.58), WOOD_DARK, bevel=0.012)
        p.box((0.56, 0.02, 0.44), (x, -0.73, 0.58), "#b5803f", bevel=0.008)
        p.bolts((x - 0.32, x + 0.32), -0.735, (0.32, 0.84), BRASS, 0.014)
    # the back: shelves full of paperwork
    p.box((5.2, 0.05, 1.0), (0, 0.2, 0.5), "#4a3020", bevel=0.0)
    for x in (-2.0, -0.6, 0.8, 2.0):
        for k in range(3):
            p.box((0.32, 0.26, 0.06 + k * 0.01), (x + p.rng.uniform(-0.1, 0.1), 0.05, 0.2 + k * 0.28), CREAM if k % 2 else "#c2b184", rot=(0, 0, p.rng.uniform(-0.15, 0.15)), bevel=0.005)
    # monitor (old CRT), keyboard, phone, bell, mug, paper stacks
    p.box((0.56, 0.5, 0.46), (-1.25, 0.1, 1.38), "#c6bfa8", bevel=0.05, rot=(0, 0, 0.2))
    p.box((0.44, 0.03, 0.34), (-1.2, -0.16, 1.4), "#1f6a58", bevel=0.01, rot=(0, 0, 0.2))
    p.box((0.2, 0.2, 0.1), (-1.25, 0.1, 1.16), "#a59e87", bevel=0.02)
    p.box((0.44, 0.16, 0.03), (-0.72, -0.28, 1.14), "#a59e87", bevel=0.008, rot=(0, 0, 0.15))
    p.box((0.2, 0.24, 0.08), (0.5, -0.3, 1.17), RED, bevel=0.02)
    p.cyl(0.03, 0.03, 0.26, (0.5, -0.3, 1.27), RED, rot=(math.pi / 2, 0, 0), segs=8)
    p.lathe([(0.075, 0), (0.075, 0.015), (0.06, 0.03), (0.035, 0.09), (0.008, 0.11), (0.012, 0.135)], (1.5, -0.42, 1.125), BRASS, segs=12)
    p.lathe([(0.05, 0), (0.055, 0.11)], (2.3, -0.2, 1.125), "#e7e0ce", segs=10)
    for x, n in ((1.0, 7), (-2.2, 11), (2.7, 5)):
        for k in range(n):
            p.box((0.24, 0.32, 0.012), (x, -0.05, 1.13 + k * 0.014), CREAM if k % 3 else "#d8c88e", rot=(0, 0, p.rng.uniform(-0.2, 0.2)), bevel=0.0)
    p.tube(p.sag((-1.25, 0.32, 1.2), (-2.4, 0.46, 1.13), 0.02, 6), 0.012, DARK, 5)
    p.export()


def stanchions():
    p = Prop("stanchions", 3)
    # four brass posts 3 m apart along Y, joined by sagging velvet ropes
    ys = [-4.5, -1.5, 1.5, 4.5]
    for y in ys:
        p.lathe([(0.2, 0), (0.2, 0.03), (0.09, 0.07), (0.035, 0.11), (0.03, 0.92), (0.05, 0.96), (0.06, 1.02), (0.035, 1.07), (0.006, 1.09)], (0, y, 0), BRASS, segs=12)
    for a, b in zip(ys, ys[1:]):
        p.tube(p.sag((0, a, 0.94), (0, b, 0.94), 0.26), 0.035, "#8e1a2c")
    p.export()


def column():
    p = Prop("column", 5)
    # Square lobby pillar with moulded base and capital; its back sits on the wall.
    p.box((1.0, 1.0, 0.45), (0, 0, 0.225), "#24474a", bevel=0.05)
    p.box((1.14, 1.14, 0.14), (0, 0, 0.07), DARK, bevel=0.025)
    p.box((0.8, 0.8, 5.9), (0, 0, 3.3), "#d6c094", bevel=0.04)
    for side in (-1, 1):
        p.box((0.08, 0.1, 5.5), (side * 0.2, -0.41, 3.3), "#2f5b57", bevel=0.015)
    p.box((1.0, 1.0, 0.25), (0, 0, 6.35), "#2f5b57", bevel=0.05)
    p.box((1.2, 1.2, 0.2), (0, 0, 6.58), "#24474a", bevel=0.05)
    p.box((0.42, 0.04, 0.6), (0, -0.42, 2.5), "#b4882f", bevel=0.01)
    p.bolts((-0.17, 0.17), -0.445, (2.25, 2.75), STEEL, 0.016)
    p.export()


def ceiling_light():
    p = Prop("ceiling_light", 6)
    # A hanging fluorescent housing on chains. Origin at the ceiling.
    for x in (-1.7, 1.7):
        p.cyl(0.05, 0.05, 0.05, (x, 0, -0.03), DARK, segs=8)
        p.tube([(x, 0, -0.05), (x, 0, -0.45)], 0.014, STEEL, 5)
    p.box((4.1, 0.72, 0.14), (0, 0, -0.53), "#3b3a44", bevel=0.03)
    p.box((4.2, 0.82, 0.05), (0, 0, -0.62), STEEL, bevel=0.015)
    for y in (-0.2, 0.0, 0.2):
        p.cyl(0.05, 0.05, 3.8, (0, y, -0.66), GLOW_WARM, rot=(0, math.pi / 2, 0), segs=8)
    for x in (-1.2, 0, 1.2):
        p.box((0.03, 0.74, 0.03), (x, 0, -0.7), STEEL, bevel=0.0)
    p.export()


def truss():
    p = Prop("truss", 8)
    # 12 m of triangular stage truss along Y, with cables tied underneath. Origin at its centre.
    L = 12.0
    for pos in ((-0.22, 0.18), (0.22, 0.18), (0, -0.2)):
        p.cyl(0.03, 0.03, L, (pos[0], 0, pos[1]), STEEL, rot=(math.pi / 2, 0, 0), segs=6)
    n = 20
    for i in range(n):
        y0 = -L / 2 + i * L / n
        y1 = y0 + L / n
        p.tube([(-0.22, y0, 0.18), (0, y1, -0.2)], 0.012, "#555860", 4)
        p.tube([(0.22, y0, 0.18), (0, y1, -0.2)], 0.012, "#555860", 4)
        p.tube([(-0.22, y0, 0.18), (0.22, y1, 0.18)], 0.012, "#555860", 4)
    pts = [(0.05 + 0.03 * math.sin(i * 1.1), -L / 2 + i * L / 18, -0.28 - 0.05 * abs(math.sin(i * 0.9))) for i in range(19)]
    p.tube(pts, 0.022, DARK, 5)
    p.tube([(x - 0.08, y + 0.1, z - 0.02) for x, y, z in pts], 0.016, "#7d2a24", 5)
    for i in range(5):
        y = -L / 2 + 1.2 + i * 2.4
        p.box((0.1, 0.08, 0.09), (0.02, y, -0.28), "#b99c3a", bevel=0.01)
    p.export()


def spotlight():
    p = Prop("spotlight", 9)
    # A stage can light; hangs from the truss and tips down toward the room.
    p.box((0.05, 0.05, 0.24), (0, 0, -0.3), DARK, bevel=0.0)
    p.lathe([(0.15, -0.28), (0.17, -0.25), (0.16, 0.2), (0.2, 0.28)], (0, 0, -0.55), "#26252c", segs=14, rot=(math.pi / 2 + 0.5, 0, 0))
    p.cyl(0.17, 0.17, 0.02, (0, -0.22, -0.72), "glow:#ffe7a8", rot=(math.pi / 2 + 0.5, 0, 0), segs=14)
    p.export()


def ceiling_beam():
    p = Prop("ceiling_beam", 4)
    # A steel cross beam across the 28 m hall, with rivets and hanging conduit. Origin at the ceiling.
    p.box((27.2, 0.5, 0.08), (0, 0, -0.04), "#54505e", bevel=0.01)
    p.box((27.2, 0.12, 0.4), (0, 0, -0.26), "#4a4752", bevel=0.01)
    p.box((27.2, 0.5, 0.08), (0, 0, -0.49), "#54505e", bevel=0.01)
    for i in range(46):
        x = -13.2 + i * 0.6
        p.cyl(0.025, 0.02, 0.02, (x, -0.26, -0.5), "#2e2c34", rot=(0, 0, 0), segs=6)
    p.export()


def conduit():
    p = Prop("conduit", 2)
    # Pipes clipped along the top of a wall, 12 m. Sits on the wall; pipes stand off toward -Y.
    p.cyl(0.05, 0.05, 12, (0, -0.08, 6.1), "#6f6a62", rot=(0, math.pi / 2, 0), segs=8)
    p.cyl(0.03, 0.03, 12, (0, -0.07, 5.92), "#8a4f2a", rot=(0, math.pi / 2, 0), segs=8)
    for i in range(5):
        x = -4.8 + i * 2.4
        p.box((0.05, 0.13, 0.32), (x, -0.08, 6.02), DARK, bevel=0.008)
    p.box((0.52, 0.16, 0.5), (1.9, -0.08, 5.45), "#7b7f70", bevel=0.02)
    p.box((0.42, 0.02, 0.38), (1.9, -0.17, 5.45), "#c2b540", bevel=0.005)
    p.tube([(1.9, -0.08, 5.7), (1.9, -0.07, 5.92)], 0.02, "#8a4f2a", 6)
    p.tube(p.sag((1.68, -0.1, 5.3), (-0.2, -0.08, 5.05), 0.15, 8), 0.012, DARK, 5)
    p.export()


def bench():
    p = Prop("bench", 7)
    # A waiting-room bench: steel legs, wooden slats, a magazine left behind.
    for x in (-1.1, 1.1):
        p.box((0.07, 0.5, 0.05), (x, 0, 0.02), DARK, bevel=0.01)
        p.box((0.06, 0.06, 0.48), (x, -0.16, 0.26), DARK, bevel=0.01)
        p.box((0.06, 0.06, 0.92), (x, 0.2, 0.48), DARK, bevel=0.01, rot=(0.12, 0, 0))
    for i in range(4):
        p.box((2.5, 0.11, 0.04), (0, -0.24 + i * 0.13, 0.5), WOOD, bevel=0.012, wonk=0.004)
    for i in range(3):
        p.box((2.5, 0.04, 0.11), (0, 0.2 + i * 0.03, 0.66 + i * 0.16), WOOD, rot=(0.12, 0, 0), bevel=0.012, wonk=0.004)
    p.box((0.26, 0.34, 0.02), (0.5, -0.08, 0.53), "#d03a2e", rot=(0, 0, 0.4), bevel=0.0)
    p.box((0.05, 0.14, 0.015), (0.52, -0.1, 0.545), CREAM, rot=(0, 0, 0.4), bevel=0.0)
    p.export()


def plant():
    p = Prop("plant", 12)
    # A plastic office plant that has given up.
    p.lathe([(0.2, 0), (0.22, 0.04), (0.3, 0.55), (0.34, 0.6), (0.34, 0.68), (0.28, 0.68)], (0, 0, 0), "#b96a3a", segs=14)
    p.cyl(0.28, 0.28, 0.02, (0, 0, 0.64), "#3a2a20", segs=14)
    for i in range(9):
        a = i * 2.4
        r = 0.55 + p.rng.uniform(0, 0.35)
        top = 1.15 + p.rng.uniform(0, 0.75)
        tip = (math.cos(a) * r, math.sin(a) * r, top - 0.45)
        mid = (math.cos(a) * r * 0.45, math.sin(a) * r * 0.45, top)
        p.tube([(0, 0, 0.65), mid, tip], 0.012, "#4d7a33", 5)
        leaf = "#6ba03f" if i % 3 else "#a1a13e"
        p.ball(0.18, tip, leaf, scale=(1.5, 0.55, 0.14), rot=(0.6, 0.3, a), subdiv=1)
    p.ball(0.15, (0.55, -0.28, 0.02), "#a1a13e", scale=(1.4, 0.55, 0.12), rot=(0, 0, 0.6), subdiv=1)
    p.export()


def trash_can():
    p = Prop("trash_can", 13)
    p.lathe([(0.24, 0), (0.25, 0.02), (0.3, 0.86), (0.33, 0.9), (0.33, 0.94), (0.28, 0.94)], (0, 0, 0), "#55606a", segs=14)
    for i in range(10):
        a = i * math.tau / 10
        p.box((0.025, 0.012, 0.76), (math.cos(a) * 0.285, math.sin(a) * 0.285, 0.47), "#3f4850", rot=(0, 0, a), bevel=0.0)
    for i in range(6):
        a = i * 1.1
        p.ball(0.11, (math.cos(a) * 0.15, math.sin(a) * 0.15, 0.96 + (i % 2) * 0.06), CREAM, lumpy=0.22, subdiv=1)
    p.ball(0.1, (0.46, -0.2, 0.09), CREAM, lumpy=0.25, subdiv=1)
    p.export()


def fountain():
    p = Prop("fountain", 14)
    # A wall drinking fountain: steel basin, spout, push bar, and a slow leak being caught by a bucket.
    p.box((1.0, 0.1, 1.2), (0, 0.3, 0.9), "#8a95a0", bevel=0.02)
    p.box((1.0, 0.62, 0.22), (0, 0.0, 1.0), "#aeb6bd", bevel=0.04)
    p.box((0.74, 0.4, 0.05), (0, -0.03, 1.1), "#6f7880", bevel=0.01)
    p.cyl(0.05, 0.05, 0.03, (0, -0.03, 1.11), DARK, segs=10)
    p.tube([(0, 0.18, 1.1), (0, 0.18, 1.3), (0, 0.04, 1.33), (0, -0.02, 1.27)], 0.024, "#d3d8dc", 7)
    p.box((0.46, 0.03, 0.09), (0, -0.33, 1.0), "#d9b23a", bevel=0.01)
    p.box((0.86, 0.46, 0.24), (0, 0.04, 0.8), "#8a95a0", bevel=0.05)
    p.cyl(0.04, 0.04, 0.72, (0.2, 0.2, 0.36), "#8a5a30", segs=8)
    p.cyl(0.03, 0.03, 0.72, (-0.2, 0.2, 0.36), "#6f7880", segs=8)
    p.box((0.16, 0.08, 0.1), (0.2, 0.2, 0.42), BRASS, bevel=0.01)
    p.lathe([(0.15, 0), (0.17, 0.02), (0.2, 0.3), (0.2, 0.31), (0.17, 0.31)], (-0.12, -0.2, 0), "#c6443a", segs=12)
    p.cyl(0.17, 0.17, 0.01, (-0.12, -0.2, 0.26), "#6aa9c7", segs=12)
    p.tube(p.sag((-0.31, -0.2, 0.3), (0.07, -0.2, 0.3), -0.2, 6), 0.007, DARK, 4)
    p.export()


def tv_mount():
    p = Prop("tv_mount", 15)
    # A heavy wall TV housing around a 4 x 2.5 m screen, plus its bracket and cable. The screen quad sits at Y = -0.14.
    for x in (-2.1, 2.1):
        p.box((0.16, 0.24, 2.76), (x, 0, 0), "#2c2b33", bevel=0.035)
    for z in (-1.32, 1.32):
        p.box((4.36, 0.24, 0.16), (0, 0, z), "#2c2b33", bevel=0.035)
    p.box((4.3, 0.1, 2.7), (0, 0.06, 0), "#18171d", bevel=0.0)
    p.box((0.34, 0.02, 0.1), (1.78, -0.13, -1.32), RED, bevel=0.0)
    p.cyl(0.03, 0.03, 0.02, (-1.9, -0.13, -1.32), "glow:#5aff7a", rot=(math.pi / 2, 0, 0), segs=8)
    p.bolts((-2.1, 2.1), -0.125, (-1.32, 1.32), STEEL, 0.03)
    p.tube(p.sag((1.6, 0.08, -1.36), (2.6, 0.1, -3.9), 0.1, 8), 0.025, DARK, 5)
    p.export()


def camera_rig():
    p = Prop("camera_rig", 16)
    # A network studio camera on a wheeled tripod, pointing -Y. The red tally light means it's live.
    for i in range(3):
        a = i * math.tau / 3 + 0.3
        tip = (math.cos(a) * 0.62, math.sin(a) * 0.62, 0.1)
        p.tube([(0, 0, 0.95), tip], 0.026, "#3a3942", 6)
        p.ball(0.07, (tip[0], tip[1], 0.07), DARK)
        p.tube([(0, 0, 0.35), (tip[0] * 0.65, tip[1] * 0.65, 0.35)], 0.014, STEEL, 5)
    p.cyl(0.05, 0.05, 0.5, (0, 0, 1.2), STEEL, segs=10)
    p.box((0.28, 0.72, 0.42), (0, 0.05, 1.62), "#3f4048", bevel=0.05)
    p.box((0.2, 0.3, 0.2), (0, 0.42, 1.74), "#55565f", bevel=0.03)
    p.lathe([(0.11, 0), (0.12, 0.34), (0.15, 0.36), (0.16, 0.46)], (0, -0.31, 1.62), "#23222a", segs=14, rot=(math.pi / 2, 0, 0))
    p.cyl(0.13, 0.13, 0.01, (0, -0.78, 1.62), "#274a6d", rot=(math.pi / 2, 0, 0), segs=14)
    p.box((0.16, 0.06, 0.08), (0, -0.1, 1.87), RED, bevel=0.012)
    p.ball(0.045, (0, -0.14, 1.88), "glow:#ff3a2a")
    p.tube([(0.14, 0.4, 1.6), (0.3, 0.7, 1.5), (0.6, 1.0, 0.8), (1.0, 1.2, 0.03), (1.9, 1.4, 0.03)], 0.02, DARK, 5)
    p.tube([(-0.1, 0.25, 1.45), (-0.45, 0.7, 1.32)], 0.018, STEEL, 5)
    p.export()


def barrier():
    p = Prop("barrier", 17)
    # The arena's 10 m half wall: red-painted concrete blocks with a chipped hazard-yellow rail, end posts and sandbags.
    w = 10.0
    for i in range(5):
        x = -4.0 + i * 2.0
        p.box((1.96, 0.6, 1.72), (x, 0, 0.86), "#8d3331" if i % 2 else "#9c3b36", bevel=0.05, wonk=0.003)
        p.box((1.4, 0.03, 1.0), (x, -0.31, 0.86), "#772a29", bevel=0.01)
        p.bolts((x - 0.8, x + 0.8), -0.31, (0.2, 1.5), DARK, 0.026)
    p.box((w + 0.1, 0.7, 0.14), (0, 0, 1.79), "#c3a02a", bevel=0.03)
    for i in range(12):
        x = -4.6 + i * 0.84
        p.box((0.32, 0.72, 0.15), (x, 0, 1.79), "#27252c", rot=(0, 0, 0.45), bevel=0.0)
    for x in (-w / 2, w / 2):
        p.box((0.34, 0.8, 2.15), (x, 0, 1.07), "#50505a", bevel=0.04)
        p.box((0.46, 0.92, 0.12), (x, 0, 2.18), "#35343c", bevel=0.03)
    p.export()


def sandbags():
    p = Prop("sandbags", 18)
    for row, n, z in ((0, 5, 0.14), (1, 4, 0.4), (2, 3, 0.66)):
        for i in range(n):
            x = -(n - 1) * 0.31 + i * 0.62 + p.rng.uniform(-0.03, 0.03)
            p.ball(0.33, (x, p.rng.uniform(-0.04, 0.04), z), "#a78e62" if (i + row) % 2 else "#91794f", scale=(1.0, 0.55, 0.42), rot=(0, 0, p.rng.uniform(-0.1, 0.1)), lumpy=0.05)
    p.export()


def tires():
    p = Prop("tires", 19)
    for k, (x, y) in enumerate(((0, 0), (0.02, 0.03), (-0.03, 0.0), (0.03, -0.02))):
        p.lathe([(0.2, 0), (0.33, 0), (0.42, 0.06), (0.42, 0.2), (0.33, 0.26), (0.2, 0.26), (0.18, 0.13)], (x, y, k * 0.26), "#26252b", segs=18)
    p.lathe([(0.2, 0), (0.33, 0), (0.42, 0.06), (0.42, 0.2), (0.33, 0.26), (0.2, 0.26), (0.18, 0.13)], (0.86, -0.1, 0), "#d7c13a", segs=18)
    p.export()


def boxes():
    p = Prop("boxes", 20)
    # Welcome Boxes waiting to be handed out: taped cardboard, one left open.
    specs = [((0.72, 0.56, 0.5), (0, 0, 0.25), 0.1), ((0.6, 0.5, 0.42), (0.08, 0.02, 0.71), -0.25), ((0.5, 0.42, 0.36), (0.74, -0.2, 0.18), 0.5), ((0.42, 0.42, 0.34), (-0.04, 0, 1.09), 0.4)]
    for size, loc, yaw in specs:
        p.box(size, loc, "#b7884f", rot=(0, 0, yaw), bevel=0.012)
        p.box((size[0] + 0.01, 0.07, size[2] + 0.01), loc, "#d4bb83", rot=(0, 0, yaw), bevel=0.0)
    for sign in (-1, 1):
        p.box((0.22, 0.42, 0.015), (0.74 + sign * 0.3 * math.cos(0.5), -0.2 + sign * 0.3 * math.sin(0.5), 0.42), "#a37744", rot=(sign * 0.2, sign * 0.5, 0.5), bevel=0.0)
    p.export()


def wet_floor():
    p = Prop("wet_floor", 21)
    # A yellow A-frame caution sign with a mop bucket beside it.
    for sign in (-1, 1):
        p.box((0.42, 0.03, 0.66), (0, sign * 0.1, 0.32), "#e4bd24", rot=(sign * 0.3, 0, 0), bevel=0.01)
        p.box((0.26, 0.012, 0.26), (0, sign * 0.125, 0.33), "#2a2830", rot=(sign * 0.3, 0, 0), bevel=0.0)
    p.lathe([(0.17, 0), (0.2, 0.3), (0.21, 0.32), (0.18, 0.32)], (0.56, 0.05, 0), "#c2a820", segs=12)
    p.cyl(0.18, 0.18, 0.01, (0.56, 0.05, 0.27), "#6b7f76", segs=12)
    p.tube([(0.56, 0.05, 0.25), (0.82, 0.3, 1.45)], 0.014, WOOD, 6)
    for i in range(8):
        a = i * math.tau / 8
        p.tube([(0.56, 0.05, 0.27), (0.56 + math.cos(a) * 0.16, 0.05 + math.sin(a) * 0.16, 0.34)], 0.018, "#cfc9b4", 4)
    p.export()


def folding_chair():
    p = Prop("folding_chair", 22)
    for x in (-0.2, 0.2):
        p.tube([(x, 0.2, 0), (x, -0.16, 0.47), (x, -0.18, 0.47)], 0.015, STEEL, 6)
        p.tube([(x, -0.2, 0), (x, 0.17, 0.88)], 0.015, STEEL, 6)
    p.box((0.44, 0.38, 0.03), (0, -0.02, 0.47), "#4a5f7a", bevel=0.012)
    p.box((0.42, 0.03, 0.2), (0, 0.15, 0.8), "#4a5f7a", rot=(0.2, 0, 0), bevel=0.01)
    p.export()


def cones():
    p = Prop("cones", 23)
    # A little traffic-cone cluster: the Landing's small reminder of what's waiting downstairs.
    for x, y, tilt, top in ((0, 0, 0, 1), (0.48, 0.2, 0.0, 1), (-0.36, 0.42, 1.45, 0)):
        rot = (tilt, 0, 0.4)
        base = (x, y, 0.1 if tilt else 0.0)
        p.box((0.38, 0.38, 0.03), (base[0], base[1], base[2] + 0.015), "#c94e12", rot=rot, bevel=0.008)
        p.lathe([(0.15, 0), (0.095, 0.19), (0.075, 0.28), (0.045, 0.44), (0.025, 0.56)], (base[0], base[1], base[2] + 0.03), "#ea6714", segs=12, rot=rot)
    p.export()


def stair_door():
    p = Prop("stair_door", 24)
    # The way down: a heavy portal with chained blast doors, hazard frame, lamps and warning stripes. 8 wide, 7 high, 2 deep.
    for x in (-3.5, 3.5):
        p.box((1.0, 2.0, 6.0), (x, 0, 3.0), "#3a3a44", bevel=0.06)
        p.box((0.82, 0.05, 5.3), (x, -1.02, 2.8), "#4b4b55", bevel=0.012)
        p.bolts((x - 0.33, x + 0.33), -1.05, [0.4 + i * 0.8 for i in range(7)], "#23222a", 0.03)
    p.box((8.0, 2.0, 1.0), (0, 0, 6.5), "#3a3a44", bevel=0.06)
    p.box((6.2, 0.1, 5.9), (0, -0.2, 2.95), "#1c1b22", bevel=0.0)
    # chevrons around the opening
    for i in range(14):
        z = 0.2 + i * 0.42
        for x in (-2.92, 2.92):
            p.box((0.16, 0.12, 0.24), (x, -1.0, z), "#d9b32a" if i % 2 else "#191820", bevel=0.0)
    for i in range(15):
        x = -2.8 + i * 0.4
        p.box((0.24, 0.12, 0.16), (x, -1.0, 5.94), "#d9b32a" if i % 2 else "#191820", bevel=0.0)
    # the two doors
    for side in (-1, 1):
        x = side * 1.42
        p.box((2.78, 0.2, 5.7), (x, -0.5, 2.88), "#5a6260", bevel=0.05)
        for z in (1.0, 2.9, 4.8):
            p.box((2.36, 0.08, 1.5), (x, -0.62, z), "#4d5552", bevel=0.03)
            p.bolts((x - 1.08, x + 1.08), -0.66, (z - 0.64, z + 0.64), "#2a2930", 0.03)
        p.box((0.12, 0.14, 0.9), (side * 0.32, -0.7, 2.4), STEEL, bevel=0.02)
    # chain and padlock across the middle: Pip has the say on when you go down
    pts = p.sag((-1.5, -0.72, 2.75), (1.5, -0.72, 2.75), 0.34, 16)
    for i, c in enumerate(pts):
        p.lathe([(0.02, -0.045), (0.05, -0.04), (0.055, 0), (0.05, 0.04), (0.02, 0.045)], c, "#83868c", segs=6, rot=(0, math.pi / 2 if i % 2 else 0.5, 0.0))
    p.box((0.28, 0.1, 0.26), (0, -0.76, 2.28), "#bb8f2a", bevel=0.025)
    p.lathe([(0.1, 0), (0.12, 0.02), (0.12, 0.1), (0.1, 0.13)], (0, -1.15, 6.2), "#2c2b33", segs=12, rot=(-math.pi / 2, 0, 0))
    for x in (-3.5, 3.5):
        p.lathe([(0.2, 0), (0.22, 0.14), (0.15, 0.24)], (x, -1.05, 5.45), "#26252c", segs=12, rot=(math.pi / 2, 0, 0))
        p.cyl(0.14, 0.14, 0.02, (x, -1.3, 5.45), "glow:#6dff8c", rot=(math.pi / 2, 0, 0), segs=12)
    p.export()


def arrival_stairs():
    p = Prop("arrival_stairs", 25)
    # The stairs you came down, leading to a shut door at the top. Steps climb toward +Y (Godot -Z is the way forward).
    n = 8
    for i in range(n):
        y = i * 0.44
        z = (i + 1) * 0.4
        p.box((8, 0.44, z), (0, y, z / 2), "#807a76", bevel=0.012)
        p.box((8.02, 0.08, 0.04), (0, y - 0.19, z - 0.01), "#d9b32a", bevel=0.0)
        p.box((8.02, 0.03, 0.34), (0, y - 0.215, z - 0.2), "#6c6662", bevel=0.0)
    p.box((8, 1.4, 3.2), (0, 3.96, 1.6), "#807a76", bevel=0.02)
    for x in (-4.1, 4.1):
        p.box((0.2, 4.8, 3.3), (x, 1.9, 1.65), "#24474a", bevel=0.03)
        p.box((0.26, 4.86, 0.1), (x, 1.9, 3.34), "#2f5b57", bevel=0.02)
    for x in (-3.8, 0, 3.8):
        rails = [(x, -0.1 + i * 0.44, 1.15 + i * 0.4) for i in range(n)]
        p.tube(rails, 0.035, BRASS if x == 0 else STEEL, 8)
        for i in (0, 3, 7):
            p.tube([(x, rails[i][1], rails[i][2]), (x, rails[i][1], (i + 1) * 0.4)], 0.022, STEEL, 6)
    # door at the top
    p.box((2.5, 0.2, 3.1), (0, 4.42, 4.7), "#403c4a", bevel=0.04)
    p.box((1.9, 0.12, 2.65), (0, 4.28, 4.55), "#6d3b32", bevel=0.03)
    p.box((1.3, 0.05, 0.95), (0, 4.2, 5.1), "#592d27", bevel=0.015)
    p.box((1.3, 0.05, 0.95), (0, 4.2, 3.98), "#592d27", bevel=0.015)
    p.ball(0.07, (0.72, 4.18, 4.4), BRASS)
    for i in range(3):
        p.box((2.1, 0.06, 0.1), (0, 4.14, 3.65 + i * 1.3), "#2c2b33", rot=(0, 0.28 if i % 2 else -0.28, 0), bevel=0.012)
    p.export()


def fp_hand():
    p = Prop("fp_hand", 31)
    # The player's fist around the pipe's grip (the pipe runs along Z through the origin), with a bathrobe sleeve.
    skin, knuckle = "#dfa672", "#c98a58"
    p.ball(0.062, (0.052, 0.022, -0.004), skin, scale=(0.82, 0.95, 1.2))
    for i, (z, r) in enumerate(((0.052, 0.0155), (0.021, 0.0172), (-0.011, 0.0168), (-0.042, 0.0145))):
        pts = []
        for k in range(9):
            a = math.radians(40 - k * 34)
            radius = 0.047 + 0.006 * math.sin(k * 0.8)
            pts.append((math.cos(a) * radius, math.sin(a) * radius, z + 0.004 * k * 0.2))
        p.tube(pts, r, skin, 8)
        p.ball(r * 1.06, pts[0], skin)
        p.ball(r * 1.04, pts[-1], skin)
        p.ball(r * 1.14, pts[3], knuckle, scale=(1, 1, 1))
    # thumb wrapped across the fingers
    thumb = [(0.062, -0.012, 0.056), (0.052, -0.044, 0.072), (0.016, -0.066, 0.078), (-0.022, -0.058, 0.068)]
    p.tube(thumb, 0.019, skin, 8)
    p.ball(0.02, thumb[0], skin)
    p.ball(0.02, thumb[-1], skin)
    p.box((0.016, 0.004, 0.014), (-0.03, -0.073, 0.07), "#f2d8b4", rot=(0, 0.2, 0.3), bevel=0.0)
    # wrist, cuff and sleeve running off the bottom corner of the screen
    start = Vector((0.076, 0.03, -0.05))
    direction = Vector((0.45, -0.1, -1.0)).normalized()
    p.tube([start, start + direction * 0.11], 0.042, skin, 10)
    c0 = start + direction * 0.09
    p.tube([c0, c0 + direction * 0.08], 0.066, "#efe6d0", 12)
    c1 = c0 + direction * 0.07
    p.tube([c1, c1 + direction * 0.25, c1 + direction * 0.6], 0.07, "#8a3f35", 12)
    p.export()


def lead_pipe():
    p = Prop("lead_pipe", 32)
    # A length of old plumbing: a taped grip, a threaded coupling and a bent elbow at the business end.
    p.cyl(0.0225, 0.0225, 0.58, (0, 0, 0.27), "#7d7f82", segs=10)
    p.cyl(0.0255, 0.0255, 0.2, (0, 0, 0.0), "#34303a", segs=10)
    for i in range(6):
        p.lathe([(0.0255, 0), (0.0275, 0.008), (0.0255, 0.016)], (0, 0, -0.09 + i * 0.03), "#46414c", segs=10)
    p.lathe([(0.0225, 0), (0.034, 0.008), (0.034, 0.055), (0.0225, 0.063)], (0, 0, 0.33), "#a0683a", segs=8)
    p.lathe([(0.0225, 0), (0.038, 0.006), (0.038, 0.05), (0.0225, 0.058)], (0, 0, 0.53), "#8a5a30", segs=6)
    p.tube([(0, 0, 0.58), (0, 0, 0.62), (0.015, 0, 0.66), (0.055, 0, 0.68)], 0.024, "#7d7f82", 10)
    p.ball(0.026, (0.055, 0, 0.68), "#3a3638", scale=(0.45, 1, 1))
    for z, r in ((0.2, 0.012), (0.42, 0.014), (0.12, 0.009)):
        p.ball(r, (0.019, -0.012, z), "#a4562a", scale=(0.5, 0.7, 1.5), lumpy=0.1, subdiv=1)
    p.export()


def noticeboard():
    p = Prop("noticeboard", 33)
    # A wooden frame around a cork panel (the painted cork quad sits in front of it at Y = -0.06). 3.6 x 2.2 m.
    for z in (-1.15, 1.15):
        p.box((3.8, 0.12, 0.14), (0, 0, z), "#2f5b57", bevel=0.02)
    for x in (-1.85, 1.85):
        p.box((0.14, 0.12, 2.42), (x, 0, 0), "#2f5b57", bevel=0.02)
    p.box((3.72, 0.03, 2.3), (0, 0.04, 0), "#3a2a1a", bevel=0.0)
    p.export()


def shelf():
    p = Prop("shelf", 34)
    # Wall shelves stuffed with network junk: binders, trophies, reels, mugs and tins. 3 m wide.
    for z in (1.5, 2.25):
        p.box((3.0, 0.42, 0.05), (0, 0, z), WOOD_DARK, bevel=0.012)
        for x in (-1.3, 0, 1.3):
            p.box((0.04, 0.36, 0.2), (x, 0.03, z - 0.12), DARK, bevel=0.0)
    colors = ["#b4282a", "#2f5b57", "#c9992f", "#3a4a7a", "#e4dcc4", "#d06a24"]
    x = -1.42
    i = 0
    while x < -0.25:
        w = p.rng.uniform(0.06, 0.1)
        p.box((w, 0.28, p.rng.uniform(0.34, 0.46)), (x, -0.02, 1.53 + 0.2), colors[i % 6], rot=(0, p.rng.uniform(-0.05, 0.05), 0), bevel=0.006)
        x += w + 0.008
        i += 1
    for k, xpos in enumerate((0.2, 0.62, 1.05)):
        p.lathe([(0.06, 0), (0.06, 0.03), (0.018, 0.06), (0.02, 0.14), (0.085, 0.2), (0.1, 0.32), (0.078, 0.33), (0.07, 0.24)], (xpos, -0.03, 1.525), BRASS, segs=12)
    for k, xpos in enumerate((-1.2, -0.72)):
        p.cyl(0.19, 0.19, 0.05, (xpos, -0.05, 2.47), "#2c2b33", rot=(math.pi / 2, 0, 0), segs=18)
        p.cyl(0.05, 0.05, 0.06, (xpos, -0.05, 2.47), "#b4882f", rot=(math.pi / 2, 0, 0), segs=10)
    for xpos, c in ((-0.15, "#e7e0ce"), (0.05, "#b4282a"), (0.25, "#3a4a7a")):
        p.lathe([(0.05, 0), (0.055, 0.11), (0.046, 0.11)], (xpos, -0.04, 2.275), c, segs=10)
        p.tube([(xpos + 0.05, -0.04, 2.36), (xpos + 0.085, -0.04, 2.33), (xpos + 0.05, -0.04, 2.3)], 0.008, c, 5)
    for xpos in (0.55, 0.78, 1.0, 1.2):
        p.lathe([(0.075, 0), (0.08, 0.2), (0.07, 0.21), (0.07, 0.24)], (xpos, -0.02, 2.275), p.rng.choice(("#d06a24", "#c9992f", "#7d7f82")), segs=10)
    p.export()


def filing():
    p = Prop("filing", 35)
    # A battered four-drawer filing cabinet. One drawer hangs open, because nobody at the Network closes anything.
    color = "#5f7a68"
    p.box((0.55, 0.62, 1.6), (0, 0, 0.8), color, bevel=0.018)
    for i in range(4):
        z = 0.24 + i * 0.39
        out = 0.24 if i == 2 else 0.0
        p.box((0.47, 0.03, 0.33), (0, -0.315 - out, z), "#6c8a76", bevel=0.01)
        p.box((0.16, 0.025, 0.03), (0, -0.34 - out, z + 0.03), "#c9c3ae", bevel=0.0)
        p.box((0.1, 0.012, 0.05), (0, -0.335 - out, z + 0.11), "#efe6d0", bevel=0.0)
        if out:
            p.box((0.44, 0.24, 0.26), (0, -0.2 - out / 2 - 0.02, z), "#4c6455", bevel=0.0)
            for k in range(5):
                p.box((0.38, 0.012, 0.28), (0, -0.28 - k * 0.04, z + 0.05 + k * 0.006), CREAM if k % 2 else "#d8c88e", rot=(p.rng.uniform(-0.1, 0.1), 0, 0), bevel=0.0)
    p.ball(0.11, (0.1, 0.05, 1.66), CREAM, lumpy=0.22, subdiv=1)
    p.box((0.32, 0.26, 0.09), (-0.08, 0.02, 1.65), "#b4282a", rot=(0, 0, 0.25), bevel=0.01)
    p.export()


if __name__ == "__main__":
    for build in (desk, stanchions, column, ceiling_light, truss, spotlight, ceiling_beam, conduit, bench, plant, trash_can, fountain, tv_mount, camera_rig, barrier, sandbags, tires, boxes, wet_floor, folding_chair, cones, stair_door, arrival_stairs, fp_hand, lead_pipe, noticeboard, shelf, filing):
        try:
            build()
        except Exception as error:
            print("FAILED", build.__name__, repr(error))
            raise
    print("KIT DONE")
