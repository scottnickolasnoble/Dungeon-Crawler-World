#!/usr/bin/env bash
# Swaps in every Tripo prop download (art/incoming/everyday and art/incoming/props) that's newer than the game's copy.
#   bash tools/ai3d/import_props.sh
cd "$(dirname "$0")/../.."
B=F:/Downstairs/Blender/blender.exe
for dir in art/incoming/everyday/*/ art/incoming/props/*/; do
    [ -d "$dir" ] || continue
    name=$(basename "$dir")
    src="$dir$name.glb"
    [ -f "$src" ] || continue
    $B -b --python tools/ai3d/import_prop.py -- "$name" 2>&1 | grep -E "^PROP|^SKIP|Error"
done
