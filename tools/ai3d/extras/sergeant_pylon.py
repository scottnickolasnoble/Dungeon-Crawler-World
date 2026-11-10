# Finishing touches for the sergeant (run by import_from_mixamo.py just before export).
# (His combo, spin and leap are pinned in place by the import: "attack!", "spin!" and "slam!" on its command line.)
# 2. No idle came from Mixamo yet: hold the fighting stance the combo clip starts from.
# 3. Tripo's textures came at up to 8192 px: keep only the colour map, at 2048 (the game's toon shader paints from it).
# 4. Scale the rig so the sergeant stands 2.3 m tall.

acts = {a.name: a for a in bpy.data.actions}

# ---- 2. an idle: the combo clip's first frame, held
if "idle" not in acts:
    idle = acts["attack"].copy()
    idle.name = "idle"
    idle.use_fake_user = True
    for curve in curves(idle):
        keys = curve.keyframe_points
        first = keys[0].co[1]
        while len(keys) > 1:
            keys.remove(keys[1])
        keys.insert(40, first)
    track = armature.animation_data.nla_tracks.new()
    track.name = "idle"
    track.strips.new("idle", 1, idle)

# ---- 3. just the colour map, game-sized
body = next(o for o in armature.children_recursive if o.type == "MESH")
for mat in body.data.materials:
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    colour = None
    for link in list(nt.links):
        if link.to_node == bsdf and link.to_socket.name == "Base Color" and link.from_node.type == "TEX_IMAGE":
            colour = link.from_node
    for n in list(nt.nodes):
        if n not in (bsdf, colour) and n.type != "OUTPUT_MATERIAL":
            nt.nodes.remove(n)
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = 0.9
    if colour and colour.image:
        img = colour.image
        if img.size[0] > 2048:
            img.scale(2048, 2048)
        img.pack()
        print("SGT colour map", img.name, tuple(img.size), flush=True)

# ---- 4. the sergeant stands about 2.3 m tall
zs = [(body.matrix_world @ v.co).z for v in body.data.vertices]
H = max(zs) - min(zs)
armature.scale = armature.scale * (2.3 / H)
print("SGT height was", round(H, 3), "scaled to 2.3 m", flush=True)
