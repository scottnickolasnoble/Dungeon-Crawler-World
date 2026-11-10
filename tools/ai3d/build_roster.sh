#!/usr/bin/env bash
# Steps 2-4 for a whole batch: chosen picture -> 3D shape -> painted game model -> preview sheet, plus a Mixamo upload file for T-posed ones.
#   bash tools/ai3d/build_roster.sh <preview.png> picture:character:height[:tpose] ...
#   e.g. bash tools/ai3d/build_roster.sh previews.png traffic_cone_goblin_6707:traffic_cone_goblin:1.35:tpose
set -e
cd "$(dirname "$0")/../.."
PY=F:/Downstairs/ai3d/env/Scripts/python.exe
BLENDER=F:/Downstairs/Blender/blender.exe
preview=$1
shift
pictures=()
for spec in "$@"; do
    IFS=: read -r picture _ _ _ <<< "$spec"
    pictures+=("F:/Downstairs/ai3d/out/concepts/$picture.png")
done
$PY tools/ai3d/make_model.py "${pictures[@]}" 2>&1 | grep -E "saved|DONE|Error"
models=()
rigged=()
for spec in "$@"; do
    IFS=: read -r picture character height pose <<< "$spec"
    $PY tools/ai3d/paint_model.py "$picture" "$character" "$height" 2>&1 | tail -1
    models+=("godot/models/characters/$character.glb")
    if [ "$pose" = "tpose" ]; then rigged+=("$character"); fi
done
$BLENDER -b --python tools/ai3d/preview.py -- "$preview" "${models[@]}" 2>&1 | grep -E "PREVIEW DONE|Error"
if [ ${#rigged[@]} -gt 0 ]; then
    $BLENDER -b --python tools/ai3d/export_for_mixamo.py -- "${rigged[@]}" 2>&1 | grep -E "EXPORTED|Error"
fi
echo "ROSTER DONE"
