# Step 1b: ranks each character's concept pictures, so only the likely ones need a human look.
#   F:/Downstairs/ai3d/env/Scripts/python.exe tools/ai3d/pick_concepts.py <sheet.jpg> [--first 6000] character [character ...]
# A good picture is one figure, whole, not touching the edges, on a plain background, and for a T-pose, wide.
import glob
import os
import sys

os.environ.setdefault("U2NET_HOME", "F:/Downstairs/ai3d/cache/u2net")

import cv2
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_concepts import CHARACTERS  # noqa: E402  (only the table; the generator itself isn't started)

SRC = "F:/Downstairs/ai3d/out/concepts"
args = sys.argv[1:]
sheet_path = args.pop(0)
first = "6"
if "--first" in args:
    i = args.index("--first")
    first = args[i + 1][0]
    del args[i:i + 2]


def score(path, pose):
    img = np.array(Image.open(path).convert("RGB")).astype(np.int16)
    border = np.concatenate([img[:12].reshape(-1, 3), img[-12:].reshape(-1, 3), img[:, :12].reshape(-1, 3), img[:, -12:].reshape(-1, 3)])
    plain = 1.0 - min(1.0, border.std(axis=0).mean() / 40.0)
    bg = np.median(border, axis=0)
    differs = (np.abs(img - bg).sum(axis=2) > 60).astype(np.uint8)
    differs = cv2.morphologyEx(differs, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    count, labels, stats, _ = cv2.connectedComponentsWithStats(differs)
    if count < 2:
        return 0.0, "empty"
    areas = stats[1:, cv2.CC_STAT_AREA]
    main = int(np.argmax(areas))
    single = areas[main] / areas.sum()
    x, y, w, h = stats[1 + main, :4]
    touches = (x <= 4) + (y <= 4) + (x + w >= img.shape[1] - 4) + (y + h >= img.shape[0] - 4)
    fill = areas[main] / (img.shape[0] * img.shape[1])
    wide = w / max(h, 1)
    s = plain * 2.0 + single * 2.0 - touches * 0.9 - abs(fill - 0.28) * 2.0
    if pose == "tpose":
        s += min(wide, 1.1) * 2.0
    return s, f"plain {plain:.2f} one {single:.2f} edges {touches} wide {wide:.2f}"


rows = []
for name in args:
    pose = CHARACTERS[name][0]
    ranked = sorted(((score(p, pose), p) for p in glob.glob(f"{SRC}/{name}_{first}*.png")), key=lambda t: -t[0][0])
    rows.append((name, ranked[:5]))
    print(name, " ".join(f"{os.path.basename(p)}={s[0]:.2f}" for s, p in ranked[:5]), flush=True)

T = 300
sheet = Image.new("RGB", (T * 5, T * len(rows)), "white")
d = ImageDraw.Draw(sheet)
for r, (name, ranked) in enumerate(rows):
    for c, ((s, why), p) in enumerate(ranked):
        sheet.paste(Image.open(p).convert("RGB").resize((T, T)), (c * T, r * T))
        d.rectangle((c * T, r * T, c * T + T, r * T + 14), fill="black")
        d.text((c * T + 3, r * T + 1), f"{os.path.basename(p)[:-4]} {s:.1f}", fill="white")
sheet.save(sheet_path, quality=85)
