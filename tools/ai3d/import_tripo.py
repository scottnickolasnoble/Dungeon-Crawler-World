# Brings a Tripo download into the game: one mesh, standing on the floor at the right height, facing +Z.
#   blender.exe -b --python tools/ai3d/import_tripo.py -- <character> <height in metres>
# Reads art/incoming/<character>/<character>.glb. Writes godot/models/characters/<character>.glb
# (the old version is kept beside it as <character>_local.glb the first time).
import os
import shutil
import sys

import bpy
from mathutils import Vector

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
name, height = sys.argv[sys.argv.index("--") + 1:][:2]
height = float(height)
src = os.path.join(ROOT, "art", "incoming", name, name + ".glb")
out = os.path.join(ROOT, "godot", "models", "characters", name + ".glb")
if os.path.exists(out) and not os.path.exists(out.replace(".glb", "_local.glb")):
    shutil.copy(out, out.replace(".glb", "_local.glb"))

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
bpy.ops.object.select_all(action="DESELECT")
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
for o in meshes:
    o.parent = None
if len(meshes) > 1:
    bpy.ops.object.join()
body = bpy.context.view_layer.objects.active
for o in list(bpy.context.scene.objects):
    if o is not body:
        bpy.data.objects.remove(o)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
pts = [Vector(c) for c in body.bound_box]
low = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
high = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
k = height / (high.z - low.z)
body.location = (-(low.x + high.x) / 2 * k, -(low.y + high.y) / 2 * k, -low.z * k)
body.scale = (k, k, k)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
# the game's shader is unlit-ish comic paint: keep only the base colour, nothing shiny
for slot in body.material_slots:
    mat = slot.material
    if mat and mat.use_nodes:
        bsdf = next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if bsdf:
            bsdf.inputs["Metallic"].default_value = 0.0
            bsdf.inputs["Roughness"].default_value = 1.0
body.name = name
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=False, export_yup=True)
print("IMPORTED", name, len(body.data.polygons), "faces", round(height, 2), "m", flush=True)
