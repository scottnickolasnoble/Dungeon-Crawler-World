# Step 2 of making a character: turns a concept picture into a 3D shape on the graphics card.
#   F:/Downstairs/ai3d/env/Scripts/python.exe tools/ai3d/make_model.py picture.png [picture.png ...]
# Writes F:/Downstairs/ai3d/out/models/<picture name>.glb, and the cut-out picture beside it for texturing later.
import os
import sys
import time

os.environ.setdefault("HF_HOME", "F:/Downstairs/ai3d/cache/hf")
os.environ.setdefault("U2NET_HOME", "F:/Downstairs/ai3d/cache/u2net")

import torch
from PIL import Image

from hy3dgen.rembg import BackgroundRemover
from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline

OUT = "F:/Downstairs/ai3d/out/models"
os.makedirs(OUT, exist_ok=True)
remover = BackgroundRemover()
pipe = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained("tencent/Hunyuan3D-2", subfolder="hunyuan3d-dit-v2-0-turbo", use_safetensors=True, torch_dtype=torch.float16)
pipe.enable_flashvdm()
for path in sys.argv[1:]:
    name = os.path.splitext(os.path.basename(path))[0]
    started = time.time()
    image = remover(Image.open(path).convert("RGB"))
    image.save(f"{OUT}/{name}_cutout.png")
    mesh = pipe(image=image, num_inference_steps=10, octree_resolution=320, num_chunks=20000, generator=torch.manual_seed(1234), output_type="trimesh")[0]
    mesh.export(f"{OUT}/{name}.glb")
    peak = torch.cuda.max_memory_allocated() / 1024 ** 3
    print(f"saved {name}.glb  {len(mesh.faces)} faces  {time.time() - started:.0f} s  peak {peak:.1f} GB", flush=True)
print("MODELS DONE", flush=True)
