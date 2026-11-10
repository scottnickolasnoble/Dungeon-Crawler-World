# Step 4 of making a character: writes an FBX with its texture inside, ready to upload to Mixamo for rigging.
#   blender.exe -b --python tools/ai3d/export_for_mixamo.py -- <character> [<character> ...]
# Reads godot/models/characters/<character>.glb. Writes art/mixamo/upload/<character>.fbx.
import os
import sys

import bpy

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
OUT = os.path.join(ROOT, "art", "mixamo", "upload")
os.makedirs(OUT, exist_ok=True)
for name in sys.argv[sys.argv.index("--") + 1:]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, "godot", "models", "characters", name + ".glb"))
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    for image in bpy.data.images:
        image.pack()
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.export_scene.fbx(filepath=os.path.join(OUT, name + ".fbx"), use_selection=True, object_types={"MESH"}, path_mode="COPY", embed_textures=True, apply_scale_options="FBX_SCALE_ALL", mesh_smooth_type="FACE")
    print("EXPORTED", name, len(meshes[0].data.polygons), "faces", flush=True)
