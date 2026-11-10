#!/usr/bin/env bash
# Makes props on this PC instead of Tripo, start to finish: concept pictures -> best one -> 3D shape -> painted ->
# swapped into the game (fitted to the old prop's size by import_prop.py). Runs for hours; safe to stop and restart,
# since finished props are skipped.
#   bash tools/ai3d/make_props.sh [prop ...]      (no names: every prop in make_concepts.PROPS)
cd "$(dirname "$0")/../.."
PY=F:/Downstairs/ai3d/env/Scripts/python.exe
B=F:/Downstairs/Blender/blender.exe
if [ $# -eq 0 ]; then
    set -- $($PY -c "import sys; sys.path.insert(0, 'tools/ai3d'); from make_concepts import PROPS; print(' '.join(PROPS))")
fi
for name in "$@"; do
    dest="art/incoming/props/$name"
    if [ -f "$dest/$name.glb" ]; then echo "SKIP $name (done)"; continue; fi
    $PY tools/ai3d/make_concepts.py --seeds 3 --first 7000 "$name" 2>&1 | grep -E "Error|Traceback" | head -3
    best=$($PY tools/ai3d/pick_concepts.py "F:/Downstairs/ai3d/out/sheet_$name.jpg" --first 7000 "$name" 2>/dev/null | head -1 | awk '{print $2}' | cut -d= -f1 | sed 's/.png$//')
    if [ -z "$best" ]; then echo "FAIL $name (no concept)"; continue; fi
    $PY tools/ai3d/make_model.py "F:/Downstairs/ai3d/out/concepts/$best.png" 2>&1 | grep -E "Error|Traceback" | head -3
    mkdir -p "$dest"
    PAINT_ALL_SIDES=1 PAINT_OUT="$dest" $PY tools/ai3d/paint_model.py "$best" "$name" 1.0 2>&1 | grep -E "Error|Traceback" | head -3
    if [ -f "$dest/$name.glb" ]; then
        $B -b --python tools/ai3d/import_prop.py -- "$name" 2>&1 | grep -E "^PROP|^SKIP|Error"
    else
        echo "FAIL $name (no model)"
    fi
done
echo "PROPS DONE"
