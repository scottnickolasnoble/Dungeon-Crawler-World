# Step 5 of making a character: turns a Mixamo download (rigged, with skin) into the game's animated model.
#   blender.exe -b --python tools/ai3d/import_from_mixamo.py -- <character> <file with skin> <animation name> [<file> <animation name> ...]
# Files are read from art/mixamo/download/. The first supplies the model; every file supplies one looping animation.
# Writes godot/models/characters/rigged/<character>.glb.
import os
import sys

import bpy

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
IN = os.path.join(ROOT, "art", "mixamo", "download")
OUT = os.path.join(ROOT, "godot", "models", "characters", "rigged")
os.makedirs(OUT, exist_ok=True)
args = sys.argv[sys.argv.index("--") + 1:]
character, pairs = args[0], list(zip(args[1::2], args[2::2]))
# An animation name ending in "!" is pinned in place: its forward and sideways travel is taken out (lunges, leaps),
# because the game moves the character itself. Walks and runs are always pinned.
PINNED = {name.rstrip("!") for _, name in pairs if name.endswith("!")}
pairs = [(f, name.rstrip("!")) for f, name in pairs]
# The With Skin download carries the body and its textures, so it's by far the biggest file: it goes first, whichever
# clip it happens to be.
pairs.sort(key=lambda pair: -os.path.getsize(os.path.join(IN, pair[0])))

from mathutils import Matrix, Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
armature = None


# Mixamo names its bones "mixamorig:Hips" and so on; a model rigged elsewhere first (Tripo) keeps its own names.
BONE_NAMES = {
    "Hips": ["mixamorig:Hips", "Hips"],
    "Head": ["mixamorig:Head", "Head"],
    "LeftArm": ["mixamorig:LeftArm", "Left_UpperArm", "LeftUpperArm", "LeftArm"],
    "RightArm": ["mixamorig:RightArm", "Right_UpperArm", "RightUpperArm", "RightArm"],
}


def _bone(arm, role):
    for name in BONE_NAMES[role]:
        if name in arm.data.bones:
            return name
    raise KeyError("no %s bone in %s" % (role, arm.name))


def _rest(arm, name):
    return arm.matrix_world @ arm.data.bones[name].matrix_local


def _same_rig(a, b):
    # same skeleton set-up if every bone sits the same way relative to its parent
    for bone in a.data.bones:
        other = b.data.bones.get(bone.name)
        if other is None:
            return False
        if bone.parent and other.parent:
            ra = bone.parent.matrix_local.inverted() @ bone.matrix_local
            rb = other.parent.matrix_local.inverted() @ other.matrix_local
            if (ra.to_quaternion().rotation_difference(rb.to_quaternion())).angle > 0.05:
                return False
    ha, hb = a.data.bones[_bone(a, "Hips")].matrix_local, b.data.bones[_bone(b, "Hips")].matrix_local
    return (ha.to_quaternion().rotation_difference(hb.to_quaternion())).angle < 0.05 and (ha.translation - hb.translation).length < 1.0


def _frame_of(arm, world):
    # a body frame from the rest pose: hips to head is up, right shoulder to left is across
    get = lambda n: world @ arm.data.bones[n].head_local
    up = (get(_bone(arm, "Head")) - get(_bone(arm, "Hips")))
    side = (get(_bone(arm, "LeftArm")) - get(_bone(arm, "RightArm")))
    fwd = side.cross(up).normalized()
    side = up.cross(fwd).normalized()
    return Matrix((side, up.normalized(), fwd)).transposed(), up.length, get(_bone(arm, "Hips"))


def _pose_from(src, dst, M, pinned, start):
    """The character's own bone values (location, rotation) that put each bone where the source's is right now, in
    world space. Returns them with the hips' first spot (for pinning)."""
    dW_inv = dst.matrix_world.inverted()
    pose, out = {}, {}
    for n in [b.name for b in dst.data.bones]:  # parents come before children
        sb = src.pose.bones.get(n)
        db = dst.data.bones[n]
        rest_arm = db.matrix_local
        if sb is None:
            pose[n] = (pose[db.parent.name] @ (db.parent.matrix_local.inverted() @ rest_arm)) if db.parent else rest_arm
        else:
            s_pose = M @ src.matrix_world @ sb.matrix
            if db.parent is None:
                world_at = s_pose.translation.copy()
                if start is None:
                    start = world_at.copy()
                if pinned:
                    world_at.x, world_at.y = start.x, start.y
                at = dW_inv @ world_at
            else:
                at = (pose[db.parent.name] @ (db.parent.matrix_local.inverted() @ rest_arm)).translation
            pose[n] = Matrix.LocRotScale(at, dW_inv.to_quaternion() @ s_pose.to_quaternion(), Vector((1, 1, 1)))
        if db.parent:
            basis = (db.parent.matrix_local.inverted() @ db.matrix_local).inverted() @ pose[db.parent.name].inverted() @ pose[n]
        else:
            basis = db.matrix_local.inverted() @ pose[n]
        loc, q, _ = basis.decompose()
        out[n] = (loc, q)
    return out, start


def _size_match(src, dst):
    _, ls, _ = _frame_of(src, src.matrix_world)
    _, ld, _ = _frame_of(dst, dst.matrix_world)
    return Matrix.Scale(ld / ls, 4)


def retarget(src, dst, name, pinned=False):
    """Copies a clip from one skeleton onto the character's, bone by bone in world space. Both files describe the
    same Mixamo skeleton the same way up; only their rest poses (and so their bone keys) differ."""
    src_act = src.animation_data.action
    M = _size_match(src, dst)
    dst.animation_data_create()
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    dst.animation_data.action = act
    first, last = int(src_act.frame_range[0]), int(src_act.frame_range[1])
    start = None
    for f in range(first, last + 1):
        bpy.context.scene.frame_set(f)
        values, start = _pose_from(src, dst, M, pinned, start)
        for n, (loc, q) in values.items():
            pb = dst.pose.bones[n]
            pb.rotation_mode = "QUATERNION"
            pb.rotation_quaternion = q
            pb.keyframe_insert("rotation_quaternion", frame=f, group=n)
            if dst.data.bones[n].parent is None:
                pb.location = loc
                pb.keyframe_insert("location", frame=f, group=n)
    dst.animation_data.action = None
    return act


def restand(dst, src):
    """Mixamo's with-skin file keeps the model's own bind pose as its rest, which for a Tripo model can be lying down
    or hunched; the game sizes characters (collision, culling, height) from that rest. So: stand the skeleton in the
    no-skin file's T-pose, bake that into the body, and make it the new rest."""
    dst.animation_data.action = None
    src.data.pose_position = "REST"
    bpy.context.view_layer.update()
    values, _ = _pose_from(src, dst, _size_match(src, dst), False, None)
    src.data.pose_position = "POSE"
    for n, (loc, q) in values.items():
        pb = dst.pose.bones[n]
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = q
        if dst.data.bones[n].parent is None:
            pb.location = loc
    bpy.context.view_layer.update()
    for body in [o for o in dst.children_recursive if o.type == "MESH"]:
        bpy.ops.object.select_all(action="DESELECT")
        bpy.context.view_layer.objects.active = body
        body.select_set(True)
        for mod in [m for m in body.modifiers if m.type == "ARMATURE"]:
            keep = body.modifiers.new("Armature", "ARMATURE")
            keep.object = mod.object
            bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = dst
    dst.select_set(True)
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.select_all(action="SELECT")
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    print("RESTOOD the model in the T-pose", flush=True)


# ---- read every file first: the model (with its own clip) from the first, a skeleton and clip from each of the rest
sources = []
for index, (file_name, animation) in enumerate(pairs):
    before = set(bpy.data.objects)
    known_actions = set(bpy.data.actions)
    bpy.ops.import_scene.fbx(filepath=os.path.join(IN, file_name))
    new_objects = set(bpy.data.objects) - before
    action = next(iter(set(bpy.data.actions) - known_actions))
    rig = next(o for o in new_objects if o.type == "ARMATURE")
    if index == 0:
        armature = rig
        armature.name = "Skeleton"
        # a copy of the skeleton as it came, still playing the model's own clip, in case that clip must be copied over
        original = armature.copy()
        original.data = armature.data.copy()
        bpy.context.scene.collection.objects.link(original)
        original.animation_data.action = action
        armature.animation_data.action = None
        sources.append((original, action, animation, set()))
    else:
        for extra in new_objects:
            if extra != rig:
                bpy.data.objects.remove(extra)
        sources.append((rig, action, animation, new_objects))

if all(_same_rig(rig, armature) for rig, _, _, _ in sources[1:]):
    # every file shares the model's skeleton set-up: the bone keys can be used as they are
    for i, (rig, action, animation, _) in enumerate(sources):
        action.name = animation
        action.use_fake_user = True
        bpy.data.objects.remove(rig)
else:
    restand(armature, next(rig for rig, _, _, _ in sources[1:] if not _same_rig(rig, armature)))
    for rig, action, animation, _ in sources:
        print("RETARGET", animation, flush=True)
        rig.animation_data.action = action
        retarget(rig, armature, animation, animation in PINNED or animation in ("walk", "run"))
    for rig, action, _, _ in sources:
        bpy.data.actions.remove(action)
        bpy.data.objects.remove(rig)
# Walks and runs come from Mixamo moving forward. The game moves the character itself, so each clip is pinned to the spot:
# whatever distance the hips cover from the first frame to the last is taken back out, evenly, frame by frame.
def curves(action):
    # Blender 5 keeps an action's curves in layers, strips and channel bags
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                yield from bag.fcurves


for action in bpy.data.actions:
    if action.name not in ("walk", "run") and action.name not in PINNED:
        continue  # a fall or a lunge is meant to go somewhere
    for curve in curves(action):
        if not (curve.data_path.endswith('location') and 'Hips' in curve.data_path) or len(curve.keyframe_points) < 2:
            continue
        keys = curve.keyframe_points
        first, last = keys[0].co, keys[-1].co
        drift = last[1] - first[1]
        span = max(last[0] - first[0], 1.0)
        values = [k.co[1] for k in keys]
        if abs(drift) > 0.25 * (max(values) - min(values) + 1e-6) and abs(drift) > 1.0:
            for k in keys:
                shift = drift * (k.co[0] - first[0]) / span
                k.co[1] -= shift
                k.handle_left[1] -= shift
                k.handle_right[1] -= shift
armature.animation_data_create()
armature.animation_data.action = None
for action in bpy.data.actions:
    # every animation goes in the file as its own named clip
    track = armature.animation_data.nla_tracks.new()
    track.name = action.name
    track.strips.new(action.name, int(action.frame_range[0]), action)
# Mixamo's plain FBX download comes in Z-up, its "FBX for Unity" one Y-up. Bake any rotation on the skeleton (and the body
# with it) into the bones, so every character reaches the game the same way up. Bone keys are in bone space, so the
# animations don't change.
if any(abs(a) > 1e-4 for a in armature.rotation_euler):
    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)
    for child in armature.children_recursive:
        child.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    print("UPRIGHTED", character, flush=True)
# Tripo's textures come at up to 8192 px, with metal, roughness and normal maps the game doesn't use: keep only the
# colour map, at 2048 (the game's toon shader paints from it).
for body in [o for o in armature.children_recursive if o.type == "MESH"]:
    for mat in body.data.materials:
        if mat is None or not mat.use_nodes:
            continue
        nt = mat.node_tree
        bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if bsdf is None:
            continue
        colour = next((l.from_node for l in nt.links if l.to_node == bsdf and l.to_socket.name == "Base Color" and l.from_node.type == "TEX_IMAGE"), None)
        for n in list(nt.nodes):
            if n not in (bsdf, colour) and n.type != "OUTPUT_MATERIAL":
                nt.nodes.remove(n)
        bsdf.inputs["Metallic"].default_value = 0.0
        bsdf.inputs["Roughness"].default_value = 0.9
        if colour and colour.image:
            if colour.image.size[0] > 2048:
                colour.image.scale(2048, 2048)
            colour.image.pack()
            print("COLOUR", colour.image.name, tuple(colour.image.size), flush=True)
# A character can have its own finishing touches (made-up clips, paintwork): tools/ai3d/extras/<character>.py
extra = os.path.join(os.path.dirname(os.path.abspath(__file__)), "extras", character + ".py")
if os.path.exists(extra):
    exec(open(extra, encoding="utf8").read(), {"bpy": bpy, "armature": armature, "curves": curves, "character": character, "ROOT": ROOT})
# Bake the skeleton's scale into the model, so the body's own bounds are its real size in the game (collision,
# culling and height all read them). The hips' moves are in the skeleton's units, so they're scaled to match.
factor = armature.scale.x
if abs(factor - 1.0) > 1e-6:
    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)
    for child in armature.children_recursive:
        child.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for action in bpy.data.actions:
        for curve in curves(action):
            if curve.data_path.endswith("location"):
                for k in curve.keyframe_points:
                    k.co[1] *= factor
                    k.handle_left[1] *= factor
                    k.handle_right[1] *= factor
    print("SCALE baked", round(factor, 5), flush=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, character + ".glb"), export_format="GLB", export_animations=True, export_animation_mode="NLA_TRACKS", export_skins=True, export_yup=True)
print("RIGGED", character, [a.name for a in bpy.data.actions], flush=True)
