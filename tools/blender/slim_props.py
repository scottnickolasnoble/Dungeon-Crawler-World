# Slims the heavy props (the local AI ones come out at 40,000 faces with 2-4k textures) down to what a comic prop
# needs: about 5,000 faces and 1024-pixel textures. Floors scatter some of these by the hundred, and at full weight the
# Endless Mall ran at 5 fps. The original goes to art/props_full/<folder>/<name>.glb first, so nothing is lost.
#   F:\Downstairs\Blender\blender.exe -b --python tools/blender/slim_props.py -- <path to .glb> [<path> ...]
import os
import shutil
import sys

import bpy

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
TARGET_FACES = int(os.environ.get("SLIM_FACES", "12000"))
MAX_TEXTURE = 1024


def slim(path):
    path = os.path.abspath(path)
    folder = os.path.basename(os.path.dirname(path))
    keep = os.path.join(ROOT, "art", "props_full", folder)
    os.makedirs(keep, exist_ok=True)
    if not os.path.exists(os.path.join(keep, os.path.basename(path))):
        shutil.copy2(path, keep)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    faces = sum(len(o.data.polygons) for o in meshes)
    if faces > TARGET_FACES * 1.2:
        ratio = TARGET_FACES / faces
        for o in meshes:
            mod = o.modifiers.new("slim", "DECIMATE")
            mod.ratio = ratio
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.modifier_apply(modifier=mod.name)
    for image in bpy.data.images:
        w, h = image.size
        if max(w, h) > MAX_TEXTURE:
            s = MAX_TEXTURE / max(w, h)
            image.scale(max(1, int(w * s)), max(1, int(h * s)))
            image.pack()
    after = sum(len(o.data.polygons) for o in bpy.context.scene.objects if o.type == "MESH")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_image_format="JPEG", export_jpeg_quality=88, use_selection=False)
    print("SLIM %s %d -> %d faces, %.1f MB" % (os.path.basename(path), faces, after, os.path.getsize(path) / 1048576), flush=True)


for p in sys.argv[sys.argv.index("--") + 1:]:
    try:
        slim(p)
    except Exception as e:
        print("FAIL", p, e, flush=True)
# NOTE (2026-11-08): don't use this on the AI-generated props. Their meshes are loose triangles per texture island, and
# decimating them tears holes at any ratio (the desk, counter, kiosk and plant all broke). Thin out how many get
# scattered instead.
