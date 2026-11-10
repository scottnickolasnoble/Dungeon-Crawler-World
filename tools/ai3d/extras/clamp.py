# Finishing touches for Clamp, the Wheel-Clamper (Floor 1 chamber boss): a hulking ogre, 3 m tall.
body = next(o for o in armature.children_recursive if o.type == "MESH")
zs = [(body.matrix_world @ v.co).z for v in body.data.vertices]
H = max(zs) - min(zs)
armature.scale = armature.scale * (3.0 / H)
print("CLAMP height was", round(H, 3), "scaled to 3.0 m", flush=True)
