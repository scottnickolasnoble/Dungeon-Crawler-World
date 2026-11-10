# Swaps one of Claude's block-built props for a Tripo model, fitted to the old prop's size so it drops into
# every place the game already uses it.
#   blender.exe -b --python tools/ai3d/import_prop.py -- <prop name>
# Reads art/incoming/everyday/<name>/<name>.glb (or art/incoming/props/<name>/<name>.glb) and the old prop from
# godot/models/props/{landing,town,wilds}/<name>.glb. Writes over the old prop, keeping it once as <name>_block.glb.
# Fit: the new model matches the old one's height, unless that would make it much wider than the old footprint,
# and it's turned a quarter if its long side runs the other way. PROP_OUT=<path> writes somewhere else (for tests).
import os
import shutil
import sys

import bpy
from mathutils import Vector

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
name = sys.argv[sys.argv.index("--") + 1]
# Tripo folders named after the prompt lists, and the prop each one replaces in the game
ALIAS = { "prop_loot_box": "loot_chest", "prop_tent": "tent", "prop_barricade": "barricade", "prop_bonfire": "bonfire",
    "prop_bone_heap": "bone_heap", "prop_remains": "remains", "prop_camp_banner": "camp_banner", "prop_weapon_rack": "weapon_rack",
    "prop_cone_totem": "cone_totem", "prop_cauldron": "cauldron", "prop_lamp_post": "lamp_post", "prop_car_wreck": "car_wreck",
    "prop_trolley": "shopping_cart", "prop_manhole": "manhole", "veh_bus": "bus", "veh_safari_jeep": "safari_jeep",
    "veh_golf_cart": "golf_cart", "veh_mine_cart": "mine_cart", "veh_hatchback": "car_parked_red" }
target = ALIAS.get(name, name)
src = next((p for p in [os.path.join(ROOT, "art", "incoming", d, name, name + ".glb") for d in ("everyday", "props")] if os.path.exists(p)), None)
old = next((p for p in [os.path.join(ROOT, "godot", "models", "props", d, target + ".glb") for d in ("landing", "town", "wilds")] if os.path.exists(p)), None)
if src is None:
    print("SKIP", name, "no download", flush=True)
    sys.exit(0)


def listed_height(prop):
    # a brand-new prop: its height is in one of the Tripo lists ("folder: name · height: 3 m" or "height 3 m")
    import re
    for doc in ("TRIPO_DEEP_PROPS.md", "TRIPO_COMIC_KIT.md", "TRIPO_PROPS.md", "TRIPO_EVERYDAY.md"):
        f = os.path.join(ROOT, "art", doc)
        if os.path.exists(f):
            m = re.search(r"folder: " + re.escape(prop) + r" · height:? ([0-9.]+) m", open(f, encoding="utf-8").read())
            if m:
                return float(m.group(1))
    return 1.5


def load_joined(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    # keep the world placement when unparenting
    for o in meshes:
        mw = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = mw
    if len(meshes) > 1:
        bpy.ops.object.join()
    body = bpy.context.view_layer.objects.active
    for o in list(bpy.context.scene.objects):
        if o is not body:
            bpy.data.objects.remove(o)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return body


def box(body):
    pts = [Vector(c) for c in body.bound_box]
    low = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    high = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return low, high


if old:
    ol, oh = box(load_joined(old))
else:
    # nothing to replace: stand it on the floor at its listed height, in the wilds props
    old = os.path.join(ROOT, "godot", "models", "props", "wilds", target + ".glb")
    hgt = listed_height(name)
    ol, oh = Vector((-50, -50, 0)), Vector((50, 50, hgt))
osz = oh - ol
ocx, ocy = (ol.x + oh.x) / 2, (ol.y + oh.y) / 2
body = load_joined(src)
low, high = box(body)
size = high - low
# long side the same way round as the old prop
if (osz.x > osz.y * 1.3 and size.y > size.x * 1.3) or (osz.y > osz.x * 1.3 and size.x > size.y * 1.3):
    body.rotation_euler = (0, 0, 1.5708)
    bpy.ops.object.transform_apply(rotation=True)
    low, high = box(body)
    size = high - low
k = osz.z / max(size.z, 1e-6)
wide = min(osz.x / max(size.x, 1e-6), osz.y / max(size.y, 1e-6)) * 1.25
k = min(k, wide) if osz.z > 0.05 else wide
body.location = (ocx - (low.x + high.x) / 2 * k, ocy - (low.y + high.y) / 2 * k, ol.z - low.z * k)
body.scale = (k, k, k)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for slot in body.material_slots:
    mat = slot.material
    if mat and mat.use_nodes:
        bsdf = next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if bsdf:
            bsdf.inputs["Metallic"].default_value = 0.0
            bsdf.inputs["Roughness"].default_value = 1.0
body.name = target
out = os.environ.get("PROP_OUT", old)
if out == old and os.path.exists(old) and not os.path.exists(old.replace(".glb", "_block.glb")):
    shutil.copy(old, old.replace(".glb", "_block.glb"))
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=False, export_yup=True)
low, high = box(body)
print("PROP", name, len(body.data.polygons), "faces, now", tuple(round(v, 2) for v in (high - low)), "was", tuple(round(v, 2) for v in osz), flush=True)
