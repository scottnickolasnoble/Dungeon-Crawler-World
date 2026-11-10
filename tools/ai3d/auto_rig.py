# Rigs a humanoid character without Mixamo, then gives it Mixamo's animations.
#   blender.exe -b --python tools/ai3d/auto_rig.py -- <character> [check.png] [x0,z0,... marker overrides]
# 1. finds the joints from the model's own shape (where the legs part, the narrowest point of the neck, how far the arms reach)
# 2. builds a skeleton with Mixamo's bone names on those joints and skins the model to it
# 3. copies every clip from Pip's Mixamo rig onto it, bone by bone, matching the direction each bone points in the world
#    (so it works even though every character stands differently: hunched goblin, wide ogre, short hedgehog)
# Reads godot/models/characters/<character>.glb and godot/models/characters/rigged/intern_pip.glb.
# Writes godot/models/characters/rigged/<character>.glb.
import math
import os
import sys

import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
CHARS = os.path.join(ROOT, "godot", "models", "characters")
SOURCE = os.environ.get("RIG_SOURCE", os.path.join(os.path.dirname(os.path.abspath(__file__)), "clips", "mixamo_clips.glb"))  # Pip's Mixamo rig, kept as the clip library
args = sys.argv[sys.argv.index("--") + 1:]
NAME = args[0]
CHECK = args[1] if len(args) > 1 and args[1].endswith(".png") else None
P = "mixamorig:"
MODE = os.environ.get("RIG_MODE", "motion")

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def only(kind, before):
    return [o for o in scene.objects if o.type == kind and o not in before]


# ---------------------------------------------------------------- the character
bpy.ops.import_scene.gltf(filepath=os.path.join(CHARS, NAME + ".glb"))
body = only("MESH", set())[0]
bpy.ops.object.select_all(action="DESELECT")
body.select_set(True)
bpy.context.view_layer.objects.active = body
for o in list(scene.objects):
    if o.type == "EMPTY":
        bpy.data.objects.remove(o)
body.parent = None
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
n = len(body.data.vertices)
V = np.zeros(n * 3)
body.data.vertices.foreach_get("co", V)
V = V.reshape(-1, 3)
H = V[:, 2].max()
xc = float(np.median(V[:, 0]))
X = V[:, 0] - xc
FORWARD = Vector((0, -1, 0))  # glTF's +Z front arrives as Blender's -Y


def band(z0, z1):
    return (V[:, 2] >= z0) & (V[:, 2] < z1)


def central(sel, gap):
    """Left and right edge of the stretch of body that contains the middle, in this slice."""
    xs = np.sort(X[sel])
    if len(xs) == 0:
        return 0.0, 0.0
    mid = int(np.argmin(np.abs(xs)))
    lo = mid
    while lo > 0 and xs[lo] - xs[lo - 1] < gap:
        lo -= 1
    hi = mid
    while hi < len(xs) - 1 and xs[hi + 1] - xs[hi] < gap:
        hi += 1
    return xs[lo], xs[hi]


def depth_at(x, z, r):
    near = (np.abs(X - x) < r) & (np.abs(V[:, 2] - z) < r)
    return float(V[near, 1].mean()) if near.any() else float(np.median(V[:, 1]))


def point(x, z, r=0.04):
    return Vector((xc + x, depth_at(x, z, r * H), z))


# ---- where the legs part
crotch = None
z = 0.06 * H
while z < 0.7 * H:
    s = band(z, z + 0.015 * H) & (np.abs(X) < 0.14 * H)
    middle = s & (np.abs(X) < 0.012 * H)
    if s.any() and not middle.any():
        crotch = z + 0.015 * H
    elif crotch is not None:
        break
    z += 0.01 * H
robed = crotch is None or crotch < 0.12 * H
if robed:
    crotch = 0.46 * H


def leg_x(side, z):
    s = band(z - 0.02 * H, z + 0.02 * H) & (np.sign(X) == side) & (np.abs(X) < 0.22 * H)
    return float(np.median(X[s])) if s.sum() > 10 and not robed else side * 0.075 * H


# ---- the neck: the narrowest part of the body between chest and head
best_w, neck = 1e9, crotch + 0.7 * (H - crotch)
z = crotch + 0.5 * (H - crotch)
while z < H - 0.08 * (H - crotch):
    lo, hi = central(band(z, z + 0.012 * H), 0.02 * H)
    if hi - lo < best_w and hi - lo > 0.02 * H:
        best_w, neck = hi - lo, z
    z += 0.008 * H
chest_z = crotch + 0.6 * (neck - crotch)
c_lo, c_hi = central(band(chest_z, chest_z + 0.02 * H), 0.02 * H)
torso_half = max((c_hi - c_lo) / 2.0, 0.05 * H)
shoulder_z = neck - 0.06 * H


# ---- the arms: whatever reaches out of the torso, side by side
def arm(side):
    sho = Vector((side * torso_half * 0.85, 0, shoulder_z))
    keep = np.zeros(n, dtype=bool)
    z = crotch - 0.3 * H
    while z < neck + 0.05 * H:
        b = band(z, z + 0.02 * H)
        lo, hi = central(b, 0.02 * H)
        out = b & ((X > hi + 0.005 * H) if side > 0 else (X < lo - 0.005 * H))
        if z < crotch:
            out &= np.abs(X - leg_x(side, max(z, 0.05 * H))) > 0.09 * H
        keep |= out
        z += 0.02 * H
    if keep.sum() < 50:
        tip = Vector((side * (torso_half + 0.04 * H), 0, crotch))
    else:
        pts = np.column_stack([X[keep], V[keep, 2]])
        d = np.hypot(pts[:, 0] - sho.x, pts[:, 1] - sho.z)
        far = pts[np.argmax(d)]
        tip = Vector((far[0], 0, far[1]))
    wrist = sho.lerp(tip, 0.8)
    elbow = sho.lerp(tip, 0.45)

    def snap(p, r):
        near = keep & (np.hypot(X - p.x, V[:, 2] - p.z) < r * H)
        if near.sum() > 5:
            return Vector((float(X[near].mean()), 0, float(V[near, 2].mean())))
        return p

    return [point(p.x, p.z) for p in (sho, snap(elbow, 0.07), snap(wrist, 0.05), tip)]


# overrides from the command line, for characters the guesswork gets wrong: name=x,z (picture-free, in metres)
override = {}
for a in args[1:]:
    if "=" in a:
        k, v = a.split("=")
        override[k] = [float(t) for t in v.split(",")]

J = {}
J["hips"] = point(0, crotch + 0.05 * H)
J["neck"] = point(0, neck)
J["head"] = point(0, neck + 0.04 * H)
J["top"] = Vector((xc, J["head"].y, H))
for i, t in enumerate((0.3, 0.55, 0.8)):
    J[f"spine{i}"] = J["hips"].lerp(J["neck"], t)
for side, label in ((1, "Left"), (-1, "Right")):
    sho, elb, wri, tip = arm(side)
    J[label + "Shoulder"] = point(side * torso_half * 0.25, shoulder_z + 0.01 * H)
    J[label + "Arm"], J[label + "ForeArm"], J[label + "Hand"], J[label + "HandEnd"] = sho, elb, wri, tip
    hip = point(leg_x(side, crotch - 0.06 * H), crotch - 0.03 * H)
    ankle = point(leg_x(side, 0.07 * H), 0.07 * H)
    J[label + "UpLeg"], J[label + "Leg"], J[label + "Foot"] = hip, hip.lerp(ankle, 0.5), ankle
    J[label + "Toe"] = Vector((ankle.x, ankle.y, 0.02 * H)) + FORWARD * 0.09 * H
    J[label + "ToeEnd"] = J[label + "Toe"] + FORWARD * 0.05 * H
# A T-posed model (all the Tripo characters) gives its arms away: the farthest point on each side is the hand, at the
# height of the arm, and the arm runs straight in to the body.
if MODE == 'pose' and X.max() - X.min() > 0.7 * H:
    for side, label in ((1, 'Left'), (-1, 'Right')):
        reach = X.max() if side > 0 else X.min()
        tipz = float(np.median(V[np.abs(X - reach) < 0.04 * H, 2]))
        arm_band = band(tipz - 0.05 * H, tipz + 0.05 * H)
        # where the body starts: walking in from the hand, the slice gets much taller at the shoulder
        xs = np.linspace(reach, 0, 60)
        sx = reach * 0.25
        for x in xs:
            col = (np.abs(X - x) < 0.015 * H) & (V[:, 2] > crotch)
            if col.sum() > 5 and V[col, 2].max() - V[col, 2].min() > 0.28 * H:
                sx = x
                break
        # follow the arm itself in from the hand, so arms held out at an angle still get their bones inside them
        path = [(reach, tipz)]
        x, zc = reach, tipz
        while abs(x) > abs(sx):
            x -= side * 0.02 * H
            near = (np.abs(X - x) < 0.015 * H) & (np.abs(V[:, 2] - zc) < 0.07 * H)
            if near.sum() > 3:
                zc = float(np.median(V[near, 2]))
            path.append((x, zc))
        path = path[::-1]
        def along(t):
            i = min(int(t * (len(path) - 1)), len(path) - 1)
            return point(path[i][0], path[i][1])
        J[label + 'Arm'], J[label + 'ForeArm'], J[label + 'Hand'], J[label + 'HandEnd'] = along(0.0), along(0.5), along(0.82), along(1.0)
        tipz = path[0][1]
        J[label + 'Shoulder'] = point(sx * 0.35, tipz)
    print('TPOSE arms found', flush=True)

# joints read off the grid by eye win over the guesswork
import json
_picked = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'joints.json'))).get(NAME)
if _picked:
    k = _picked
    MODE = os.environ.get('RIG_MODE', k.get('mode', 'motion'))
    cx = k.get('cx', xc) - xc  # the grid's numbers are absolute; point() works from the model's middle
    J['hips'] = point(cx, k['crotch'] + 0.05 * H)
    J['neck'] = point(cx, k['neck'])
    J['head'] = point(cx, k['head'])
    J['top'] = Vector((xc + cx, J['head'].y, k['top']))
    for i, t in enumerate((0.3, 0.55, 0.8)):
        J[f'spine{i}'] = J['hips'].lerp(J['neck'], t)
    for side, label in ((1, 'Left'), (-1, 'Right')):
        s_ = k.get('L' if side > 0 else 'R') or {kk: [2 * (cx + xc) - vv[0], vv[1]] for kk, vv in k['L'].items()}
        pt = lambda key: point(s_[key][0] - xc, s_[key][1])
        J[label + 'Arm'], J[label + 'ForeArm'], J[label + 'Hand'], J[label + 'HandEnd'] = pt('shoulder'), pt('elbow'), pt('wrist'), pt('tip')
        J[label + 'Shoulder'] = point(cx + (s_['shoulder'][0] - xc - cx) * 0.3, s_['shoulder'][1])
        J[label + 'UpLeg'], J[label + 'Leg'], J[label + 'Foot'] = pt('hip'), pt('knee'), pt('ankle')
        ank = J[label + 'Foot']
        J[label + 'Toe'] = Vector((ank.x, ank.y, 0.02 * H)) + FORWARD * 0.09 * H
        J[label + 'ToeEnd'] = J[label + 'Toe'] + FORWARD * 0.05 * H
for k, v in override.items():
    J[k] = point(v[0], v[1]) if len(v) == 2 else Vector(v)
print("JOINTS", NAME, "H", round(H, 2), "crotch", round(crotch, 2), "neck", round(neck, 2), "robed" if robed else "", {k: tuple(round(c, 2) for c in v) for k, v in J.items() if "Hand" in k}, flush=True)

# ---------------------------------------------------------------- the skeleton, in Mixamo's names
BONES = [
    ("Hips", None, "hips", "spine0"), ("Spine", "Hips", "spine0", "spine1"), ("Spine1", "Spine", "spine1", "spine2"),
    ("Spine2", "Spine1", "spine2", "neck"), ("Neck", "Spine2", "neck", "head"), ("Head", "Neck", "head", "top"),
]
for s in ("Left", "Right"):
    BONES += [
        (s + "Shoulder", "Spine2", s + "Shoulder", s + "Arm"), (s + "Arm", s + "Shoulder", s + "Arm", s + "ForeArm"),
        (s + "ForeArm", s + "Arm", s + "ForeArm", s + "Hand"), (s + "Hand", s + "ForeArm", s + "Hand", s + "HandEnd"),
        (s + "UpLeg", "Hips", s + "UpLeg", s + "Leg"), (s + "Leg", s + "UpLeg", s + "Leg", s + "Foot"),
        (s + "Foot", s + "Leg", s + "Foot", s + "Toe"), (s + "ToeBase", s + "Foot", s + "Toe", s + "ToeEnd"),
    ]
arm_data = bpy.data.armatures.new("Skeleton")
rig = bpy.data.objects.new("Skeleton", arm_data)
scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode="EDIT")
for bone, parent, a, b in BONES:
    e = arm_data.edit_bones.new(P + bone)
    e.head, e.tail = J[a], J[b]
    if (e.tail - e.head).length < 0.01:
        e.tail = e.head + Vector((0, 0, 0.03))
    if parent:
        e.parent = arm_data.edit_bones[P + parent]
bpy.ops.object.mode_set(mode="OBJECT")

# ---------------------------------------------------------------- the floor the picture stood on
# Generated models often keep a puddle or slab of floor round the feet. Feet would drag it about, so it goes.
import bmesh
bm = bmesh.new()
bm.from_mesh(body.data)
feet = [np.array(J['LeftFoot']), np.array(J['RightFoot'])]
floor = []
for f in bm.faces:
    pts = [np.array(v.co) for v in f.verts]
    if all(p_[2] < 0.035 * H for p_ in pts) and min(min(np.hypot(p_[0] - ft[0], p_[1] - ft[1]) for ft in feet) for p_ in pts) > 0.11 * H:
        floor.append(f)
bmesh.ops.delete(bm, geom=floor, context='FACES')
loose = [v for v in bm.verts if not v.link_faces]
bmesh.ops.delete(bm, geom=loose, context='VERTS')
bm.to_mesh(body.data)
bm.free()
n = len(body.data.vertices)
V = np.zeros(n * 3)
body.data.vertices.foreach_get('co', V)
V = V.reshape(-1, 3)
X = V[:, 0] - xc
print('FLOOR removed', len(floor), 'faces', flush=True)

# ---------------------------------------------------------------- skinning: each bit of the body follows its nearest bones
segs = [(P + bone, np.array(J[a]), np.array(J[b])) for bone, _, a, b in BONES]
D = np.zeros((n, len(segs)))
for i, (bone, a, b) in enumerate(segs):
    ab = b - a
    t = np.clip(((V - a) @ ab) / max(ab @ ab, 1e-9), 0, 1)
    D[:, i] = np.linalg.norm(V - (a + t[:, None] * ab), axis=1)
    side = "Left" in bone and 1 or ("Right" in bone and -1 or 0)
    if side:
        # nothing on one side of the body may follow the other side's limbs
        D[np.sign(X) == -side, i] += np.where(np.abs(X[np.sign(X) == -side]) > 0.03 * H, 10.0, 0.0)
# Everything above the neck (ears, hats, horns, hair) follows the head alone, so arms never drag at it.
head_line = J['neck'].z + 0.03 * H
reach = 1.1 * min(abs(J['LeftForeArm'].x - xc), abs(J['RightForeArm'].x - xc))  # inside the elbows: hands raised high stay hands
above = (V[:, 2] > head_line) & (np.abs(X) < reach)
for i, (bone, _, _) in enumerate(segs):
    if not bone.endswith(('Head', 'Neck')):
        D[above, i] += 10.0
W = 1.0 / (D + 0.01 * H) ** 4
cut = np.sort(W, axis=1)[:, -3][:, None]
W[W < cut] = 0
W /= W.sum(axis=1, keepdims=True)
# smooth across the surface, so creases bend instead of tearing
edges = np.zeros(len(body.data.edges) * 2, dtype=np.int64)
body.data.edges.foreach_get("vertices", edges)
edges = edges.reshape(-1, 2)
for _ in range(3):
    acc = W.copy()
    cnt = np.ones((n, 1))
    np.add.at(acc, edges[:, 0], W[edges[:, 1]])
    np.add.at(acc, edges[:, 1], W[edges[:, 0]])
    np.add.at(cnt, edges[:, 0], 1)
    np.add.at(cnt, edges[:, 1], 1)
    W = acc / cnt
for i, (bone, _, _) in enumerate(segs):
    group = body.vertex_groups.new(name=bone)
    idx = np.nonzero(W[:, i] > 0.01)[0]
    for v in idx:
        group.add([int(v)], float(W[v, i]), "REPLACE")
body.parent = rig
mod = body.modifiers.new("Skeleton", "ARMATURE")
mod.object = rig

# ---------------------------------------------------------------- Pip's clips, carried over bone by bone
before = set(scene.objects)
known = set(bpy.data.actions)
bpy.ops.import_scene.gltf(filepath=SOURCE)
src = only("ARMATURE", before)[0]
clips = [a for a in bpy.data.actions if a not in known]
src_mw = src.matrix_world.copy()


def rot(m):
    return m.to_3x3().normalized().to_quaternion()


src_rest = {b.name: rot(src_mw @ b.matrix_local) for b in src.data.bones}
src_head = {b.name: (src_mw @ b.matrix_local).translation for b in src.data.bones}
tgt_rest = {b.name: rot(b.matrix_local) for b in rig.data.bones}
align = {}
for b in rig.data.bones:
    if b.name in src_rest:
        sd = (src_rest[b.name] @ Vector((0, 1, 0))).normalized()
        td = (tgt_rest[b.name] @ Vector((0, 1, 0))).normalized()
        align[b.name] = td.rotation_difference(sd)
scale = (J["hips"].z) / max(src_head[P + "Hips"].z, 1e-6)
order = [P + b[0] for b in BONES]
rig.animation_data_create()
for clip in clips:
    for t in src.animation_data.nla_tracks:
        t.mute = True
    src.animation_data.action = clip
    if clip.slots:
        src.animation_data.action_slot = clip.slots[0]
    act = bpy.data.actions.new(clip.name)
    rig.animation_data.action = act
    a, b = int(clip.frame_range[0]), int(clip.frame_range[1])
    for f in range(a, b + 1):
        scene.frame_set(f)
        M = {}
        for name in order:
            bone = rig.data.bones[name]
            pb = rig.pose.bones[name]
            spb = src.pose.bones.get(name)
            if spb is None:
                continue
            cur = rot(src_mw @ spb.matrix)
            # Pip's movement, not his pose: each bone turns in the world exactly as Pip's does from his own rest, so a
            # hunched goblin stays hunched and a wide ogre stays wide while they walk
            want = (cur @ src_rest[name].inverted() @ tgt_rest[name]) if MODE == "motion" else (cur @ src_rest[name].inverted() @ align[name] @ tgt_rest[name])
            if bone.parent is None:
                move = (src_mw @ spb.matrix).translation - src_head[name]
                head = bone.matrix_local.translation + move * scale
                M[name] = Matrix.Translation(head) @ want.to_matrix().to_4x4()
                basis = bone.matrix_local.inverted() @ M[name]
            else:
                pname = bone.parent.name
                local = bone.parent.matrix_local.inverted() @ bone.matrix_local
                head = (M[pname] @ local).translation
                M[name] = Matrix.Translation(head) @ want.to_matrix().to_4x4()
                basis = local.inverted() @ M[pname].inverted() @ M[name]
            loc, q, _ = basis.decompose()
            pb.rotation_mode = "QUATERNION"
            pb.rotation_quaternion = q
            pb.keyframe_insert("rotation_quaternion", frame=f)
            if bone.parent is None:
                pb.location = loc
                pb.keyframe_insert("location", frame=f)
    print("CLIP", clip.name, b - a + 1, "frames", flush=True)
    track = rig.animation_data.nla_tracks.new()
    track.name = clip.name
    track.strips.new(clip.name, a, act)
rig.animation_data.action = None
for o in list(scene.objects):
    if o not in (rig, body):
        bpy.data.objects.remove(o)
for clip in clips:
    bpy.data.actions.remove(clip)

out = os.environ.get("RIG_OUT", os.path.join(CHARS, "rigged", NAME + ".glb"))
bpy.ops.object.select_all(action="DESELECT")
rig.select_set(True)
body.select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_animations=True, export_animation_mode="NLA_TRACKS", export_skins=True, export_yup=True)
print("RIGGED", NAME, flush=True)

# ---------------------------------------------------------------- a picture of it mid-stride, to judge by eye
if CHECK:
    for t in rig.animation_data.nla_tracks:
        t.mute = True
    walk_action = next(t.strips[0].action for t in rig.animation_data.nla_tracks if t.name == "walk")
    rig.animation_data.action = walk_action
    if walk_action.slots:
        rig.animation_data.action_slot = walk_action.slots[0]
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.color_type = "TEXTURE"
    scene.render.resolution_x, scene.render.resolution_y = 520, 520
    cam = bpy.data.objects.new("c", bpy.data.cameras.new("c"))
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = H * 1.25
    scene.collection.objects.link(cam)
    scene.camera = cam
    frames = []
    import tempfile
    for k, (angle, frame) in enumerate(((0, 6), (90, 6), (0, 18), (90, 18))):
        scene.frame_set(frame)
        a = math.radians(angle)
        cam.location = Vector((xc + math.sin(a) * H * 4, -math.cos(a) * H * 4, H * 0.5))
        cam.rotation_euler = (Vector((xc, 0, H * 0.5)) - cam.location).to_track_quat("-Z", "Y").to_euler()
        path = os.path.join(tempfile.gettempdir(), f"rigcheck_{k}.png")
        scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        frames.append(path)
    sheet = np.ones((520, 520 * 4, 4), dtype=np.float32)
    for k, path in enumerate(frames):
        img = bpy.data.images.load(path)
        sheet[:, k * 520:(k + 1) * 520] = np.array(img.pixels[:], dtype=np.float32).reshape(520, 520, 4)
    final = bpy.data.images.new("sheet", 520 * 4, 520, alpha=True)
    final.pixels = sheet.flatten().tolist()
    final.filepath_raw = CHECK
    final.file_format = "PNG"
    final.save()
    print("CHECK SAVED", flush=True)
