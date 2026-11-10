# Step 3 of making a character: paints the concept picture straight onto the 3D shape, so the face you approved is the
# face in the game, then reduces it to a game-ready model standing on the floor at the right height.
#   F:/Downstairs/ai3d/env/Scripts/python.exe tools/ai3d/paint_model.py <picture name> <output name> <height in metres> [x0,y0,x1,y1,#colour ...]
# Each optional box, in picture pixels, sets the colour of the BACK of the model there (hair on the back of a head, say).
# Reads F:/Downstairs/ai3d/out/models/<picture name>.glb and _cutout.png. Writes godot/models/characters/<output name>.glb.
import os
import sys

import cv2
import numpy as np
import pymeshlab
import trimesh
import xatlas
from PIL import Image

TEX = 2048
FACES = 40000
SRC = "F:/Downstairs/ai3d/out/models"
OUT = os.environ.get("PAINT_OUT", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "godot", "models", "characters"))
os.makedirs(OUT, exist_ok=True)
source, target, height = sys.argv[1], sys.argv[2], float(sys.argv[3])
# PAINT_ALL_SIDES=1 for props: the picture wraps all the way round instead of only the front
ALL_SIDES = os.environ.get("PAINT_ALL_SIDES") == "1"

# ---- the shape: drop floating scraps, then reduce
mesh = trimesh.load(f"{SRC}/{source}.glb", force="mesh")
parts = mesh.split(only_watertight=False)
biggest = max(len(p.faces) for p in parts)
mesh = trimesh.util.concatenate([p for p in parts if len(p.faces) > biggest * 0.02])
ms = pymeshlab.MeshSet()
ms.add_mesh(pymeshlab.Mesh(mesh.vertices, mesh.faces))
ms.meshing_decimation_quadric_edge_collapse(targetfacenum=FACES, preservenormal=True, preservetopology=True)
# Sealing holes was tried for Mixamo and made things worse: every sealed model failed to rig. Only tidy duplicate faces.
ms.meshing_remove_duplicate_faces()
reduced = ms.current_mesh()
mesh = trimesh.Trimesh(reduced.vertex_matrix(), reduced.face_matrix(), process=True)

# ---- the picture: fill in behind the cut-out, so edges don't pick up the background
cutout = np.array(Image.open(f"{SRC}/{source}_cutout.png").convert("RGBA"))
alpha = cutout[:, :, 3] > 128
# only the figure itself: a stray speck in the cut-out would throw the whole projection out of line
count, labels, stats, _ = cv2.connectedComponentsWithStats(alpha.astype(np.uint8))
alpha = labels == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
rows, cols = np.where(alpha)
top, bottom, left, right = rows.min(), rows.max(), cols.min(), cols.max()
rgb = cutout[:, :, :3].copy()
# Parts facing away get the local colour with the ink and detail removed, so no outline smears across a back and no face
# appears on the back of a head. Closing wipes out the dark lines; the colour then spreads outward from inside the figure.
no_ink = cv2.morphologyEx(rgb, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))
inside_figure = cv2.erode(alpha.astype(np.uint8), np.ones((15, 15), np.uint8)) > 0
small = cv2.resize(no_ink, None, fx=0.25, fy=0.25)
small_mask = cv2.resize((~inside_figure).astype(np.uint8) * 255, None, fx=0.25, fy=0.25, interpolation=cv2.INTER_NEAREST)
filled = cv2.resize(cv2.inpaint(small, small_mask, 5, cv2.INPAINT_TELEA), (rgb.shape[1], rgb.shape[0]))
no_ink[~inside_figure] = filled[~inside_figure]
rgb[~alpha] = filled[~alpha]
soft = cv2.GaussianBlur(no_ink, (0, 0), 14)
back = no_ink.copy()
for box in sys.argv[4:]:
    x0, y0, x1, y1, colour = box.split(",")
    back[int(y0):int(y1), int(x0):int(x1)] = [int(colour[i:i + 2], 16) for i in (1, 3, 5)]
back = cv2.GaussianBlur(back, (0, 0), 5)

# ---- lay the surface out flat and paint every texel
vmapping, faces, uvs = xatlas.parametrize(mesh.vertices, mesh.faces)
verts = mesh.vertices[vmapping]
norms = mesh.vertex_normals[vmapping]
low, high = verts.min(axis=0), verts.max(axis=0)
texture = np.zeros((TEX, TEX, 3), dtype=np.uint8)
filled_px = np.zeros((TEX, TEX), dtype=bool)
px = uvs * (TEX - 1)
px[:, 1] = (TEX - 1) - px[:, 1]


def sample(image, u, v):
    x = np.clip(u, 0, image.shape[1] - 1).astype(np.int32)
    y = np.clip(v, 0, image.shape[0] - 1).astype(np.int32)
    return image[y, x].astype(np.float32)


for tri in faces:
    a, b, c = px[tri]
    x0, x1 = int(np.floor(min(a[0], b[0], c[0]))), int(np.ceil(max(a[0], b[0], c[0])))
    y0, y1 = int(np.floor(min(a[1], b[1], c[1]))), int(np.ceil(max(a[1], b[1], c[1])))
    if x1 < x0 or y1 < y0:
        continue
    gx, gy = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
    denom = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
    if abs(denom) < 1e-9:
        continue
    w0 = ((b[1] - c[1]) * (gx - c[0]) + (c[0] - b[0]) * (gy - c[1])) / denom
    w1 = ((c[1] - a[1]) * (gx - c[0]) + (a[0] - c[0]) * (gy - c[1])) / denom
    w2 = 1.0 - w0 - w1
    inside = (w0 >= -0.02) & (w1 >= -0.02) & (w2 >= -0.02)
    if not inside.any():
        continue
    w = np.stack([w0[inside], w1[inside], w2[inside]], axis=1)
    pos = w @ verts[tri]
    nrm = w @ norms[tri]
    # the picture looks straight at the model's front (+Z): its left and right map to X, its top and bottom to Y
    u = left + (pos[:, 0] - low[0]) / (high[0] - low[0]) * (right - left)
    v = bottom - (pos[:, 1] - low[1]) / (high[1] - low[1]) * (bottom - top)
    toward = nrm[:, 2] / (np.linalg.norm(nrm, axis=1) + 1e-6)
    facing = np.clip((toward - 0.12) / 0.28, 0.0, 1.0)[:, None]
    behind = np.clip((-toward - 0.05) / 0.25, 0.0, 1.0)[:, None]
    if ALL_SIDES:
        # props look much the same all the way round: the one picture goes on the front, back and both sides, each
        # surface taking the view it faces most, and the top and bottom take the object's own colours without the ink
        n = nrm / (np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-6)
        depth = max(high[2] - low[2], 1e-6)
        u_side = left + (pos[:, 2] - low[2]) / depth * (right - left)
        views = [
            (np.clip(n[:, 2], 0, 1), sample(rgb, u, v)),
            (np.clip(-n[:, 2], 0, 1), sample(rgb, left + right - u, v)),
            (np.clip(n[:, 0], 0, 1), sample(rgb, left + right - u_side, v)),
            (np.clip(-n[:, 0], 0, 1), sample(rgb, u_side, v)),
            (np.clip(n[:, 1], 0, 1), sample(soft, u, top + (pos[:, 2] - low[2]) / depth * (bottom - top) * 0.4)),
            (np.clip(-n[:, 1], 0, 1), sample(soft, u, v)),
        ]
        weights = np.stack([w ** 3 for w, _ in views], axis=1) + 1e-6
        weights /= weights.sum(axis=1, keepdims=True)
        colour = sum(weights[:, k:k + 1] * views[k][1] for k in range(len(views)))
    else:
        colour = sample(rgb, u, v) * facing + (sample(soft, u, v) * (1.0 - behind) + sample(back, u, v) * behind) * (1.0 - facing)
    texture[gy[inside], gx[inside]] = colour.astype(np.uint8)
    filled_px[gy[inside], gx[inside]] = True
# pad the edges of each island, so seams don't show as black lines
missing = (~filled_px).astype(np.uint8)
grown = cv2.dilate(texture, np.ones((9, 9), np.uint8))
texture[missing > 0] = grown[missing > 0]

# ---- stand it on the floor at the right height, front towards +Z, and save
scale = height / (high[1] - low[1])
placed = (verts - np.array([(low[0] + high[0]) / 2, low[1], (low[2] + high[2]) / 2])) * scale
material = trimesh.visual.material.PBRMaterial(baseColorTexture=Image.fromarray(texture), metallicFactor=0.0, roughnessFactor=1.0)
result = trimesh.Trimesh(vertices=placed, faces=faces, visual=trimesh.visual.TextureVisuals(uv=uvs, material=material), process=False)
result.export(os.path.join(OUT, target + ".glb"))
print(f"saved {target}.glb  {len(result.faces)} faces  {height} m tall", flush=True)
