# Finishing touches for the Drowned Valet (Floor 1 chamber boss): a tall, swollen drowned man, 2.4 m.
body = next(o for o in armature.children_recursive if o.type == "MESH")
zs = [(body.matrix_world @ v.co).z for v in body.data.vertices]
H = max(zs) - min(zs)
armature.scale = armature.scale * (2.4 / H)
print("VALET height was", round(H, 3), "scaled to 2.4 m", flush=True)
