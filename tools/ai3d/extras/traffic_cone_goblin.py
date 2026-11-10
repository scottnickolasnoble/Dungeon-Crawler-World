# Finishing touches for the traffic-cone goblin (the orange one with the red cone cap) (run by import_from_mixamo.py just before export).
# Its swipe is pinned in place by the import ("attack!" on its command line). Here: scale the rig so it stands 1.4 m.
body = next(o for o in armature.children_recursive if o.type == "MESH")
zs = [(body.matrix_world @ v.co).z for v in body.data.vertices]
H = max(zs) - min(zs)
armature.scale = armature.scale * (1.4 / H)
print("GOBLIN height was", round(H, 3), "scaled to 1.4 m", flush=True)
