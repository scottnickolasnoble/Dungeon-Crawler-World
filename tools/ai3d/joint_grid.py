# Renders characters from the front on a measured grid, so their joints can be read off by eye for auto_rig.py.
#   blender.exe -b --python tools/ai3d/joint_grid.py -- <out folder> character [character ...]
# Writes <out>/<character>_grid.png: 800x800, 1 px = SCALE/800 m, centred on the model, with lines every 0.1 m.
import math
import os
import sys

import bpy
import numpy as np
from mathutils import Vector

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
args = sys.argv[sys.argv.index("--") + 1:]
out = args[0]
for name in args[1:]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, "godot", "models", "characters", name + ".glb"))
    meshes = [o for o in scene.objects if o.type == "MESH"]
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    H = max(p.z for p in pts)
    width = max(p.x for p in pts) - min(p.x for p in pts)
    span = max(H, width) * 1.1
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.color_type = "TEXTURE"
    scene.display.shading.show_cavity = True
    scene.render.resolution_x = scene.render.resolution_y = 800
    cam = bpy.data.objects.new("c", bpy.data.cameras.new("c"))
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = span
    cam.location = Vector((0, -10, H / 2))
    cam.rotation_euler = (math.pi / 2, 0, 0)
    scene.collection.objects.link(cam)
    scene.camera = cam
    path = os.path.join(out, name + "_grid.png")
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    with open(os.path.join(out, name + "_grid.txt"), "w") as f:
        f.write(f"{span} {H}\n")
    print("GRID", name, round(span, 3), round(H, 3), flush=True)
