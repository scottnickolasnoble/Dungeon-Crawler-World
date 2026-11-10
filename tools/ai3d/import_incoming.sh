#!/usr/bin/env bash
# Imports every Tripo download in art/incoming that the game doesn't have yet (or that's newer), at its height from art/tripo_queue.json.
#   bash tools/ai3d/import_incoming.sh
cd "$(dirname "$0")/../.."
B=F:/Downstairs/Blender/blender.exe
for dir in art/incoming/*/; do
    name=$(basename "$dir")
    src="$dir$name.glb"
    out="godot/models/characters/$name.glb"
    [ -f "$src" ] || continue
    if [ -f "$out" ] && [ "$out" -nt "$src" ]; then continue; fi
    height=$(node -e "const q=[...require('./art/tripo_queue.json'),...require('./art/tripo_queue_3.json')];const c=q.find(c=>c.folder==='$name');console.log(c?c.height:({traffic_cone_goblin:1.45,sergeant_pylon:1.8,intern_pip:1.72,fluorescent_moth:1.6,vending_mimic:2.1})['$name']||1.75)")
    $B -b --python tools/ai3d/import_tripo.py -- "$name" "$height" 2>&1 | grep -E "IMPORTED|Error"
done
