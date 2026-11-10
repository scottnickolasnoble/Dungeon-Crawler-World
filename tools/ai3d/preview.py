# Renders a generated model from the front, three-quarter and side, so it can be judged without opening anything.
#   blender.exe -b --python tools/ai3d/preview.py -- out.png model.glb [model.glb ...]
import math
import sys

import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:]
out, models = args[0], args[1:]
SIZE = 520
ANGLES = (0, 40, 90, 180)
scene = bpy.context.scene
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "STUDIO"
scene.display.shading.color_type = "TEXTURE"
scene.display.shading.show_cavity = True
scene.display.shading.cavity_type = "BOTH"
scene.world = scene.world or bpy.data.worlds.new("w")
scene.render.film_transparent = False
scene.render.resolution_x = SIZE * len(ANGLES)
scene.render.resolution_y = SIZE * len(models)
scene.render.use_border = False

import numpy as np

sheet = np.ones((SIZE * len(models), SIZE * len(ANGLES), 4), dtype=np.float32)
scene.render.resolution_x = SIZE
scene.render.resolution_y = SIZE
scene.render.image_settings.file_format = "PNG"
temp = bpy.app.tempdir + "preview_frame.png"
for row, path in enumerate(models):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    bpy.ops.import_scene.gltf(filepath=path)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    # props are painted with plain material colours; characters with a texture
    scene.display.shading.color_type = "TEXTURE" if bpy.data.images else "MATERIAL"
    corners = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    low = Vector((min(c[i] for c in corners) for i in range(3)))
    high = Vector((max(c[i] for c in corners) for i in range(3)))
    centre = (low + high) / 2
    radius = (high - low).length / 2
    cam = bpy.data.cameras.new("c")
    cam.type = "ORTHO"
    cam.ortho_scale = radius * 2.05
    cam_obj = bpy.data.objects.new("c", cam)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    for col, angle in enumerate(ANGLES):
        a = math.radians(angle)
        # glTF's +Z (the model's front) arrives as Blender's -Y
        cam_obj.location = centre + Vector((math.sin(a), -math.cos(a), 0.0)) * radius * 4
        cam_obj.rotation_euler = (centre - cam_obj.location).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = temp
        bpy.ops.render.render(write_still=True)
        image = bpy.data.images.load(temp, check_existing=False)
        pixels = np.array(image.pixels[:], dtype=np.float32).reshape((SIZE, SIZE, 4))
        y0 = SIZE * (len(models) - 1 - row)
        sheet[y0:y0 + SIZE, col * SIZE:(col + 1) * SIZE] = pixels
        bpy.data.images.remove(image)
final = bpy.data.images.new("sheet", SIZE * len(ANGLES), SIZE * len(models), alpha=True)
final.pixels = sheet.flatten().tolist()
final.filepath_raw = out
final.file_format = "PNG"
final.save()
print("PREVIEW DONE")
