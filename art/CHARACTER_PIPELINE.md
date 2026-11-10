# Getting a character into Downstairs yourself

This guide takes a character from AccuRig, through Mixamo, into the game, and covers how to change it once it's there.
All paths are relative to the project folder `F:\Downstairs\Dungeon-Crawler-World-claude-device-sync-offline-start-tlcj0x\Dungeon-Crawler-World-claude-device-sync-offline-start-tlcj0x`.

## How the game finds characters

- Every character model lives in `godot/models/characters/<name>.glb`, for example `traffic_cone_goblin.glb`. The `<name>` part is the character's ID. Use exactly the same name all the way through.
- If there is a file with the same name in `godot/models/characters/rigged/`, the game uses that one instead, and it moves.
- The game plays animations by name. Your rigged file needs these, spelled exactly like this:

| Name | Used for | Needed? |
|---|---|---|
| `idle` | standing, breathing | yes |
| `walk` | wandering | yes |
| `run` | chasing you | yes for monsters |
| `attack` | hitting you | yes for monsters |
| `hit` | being hit | nice to have |
| `die` | dying | nice to have |
| `talk` | townsfolk talking | nice to have for NPCs |

Anything missing is skipped: no crash, the character just holds its last pose.

## Step 1: AccuRig

1. **Grab the character from `art/mixamo/upload/<name>.fbx`.** Every character has one there, with its texture built in.
   If one is missing, make it with:
   `F:\Downstairs\Blender\blender.exe -b --python tools/ai3d/export_for_mixamo.py -- <name>`
2. Open that FBX in AccuRig, rig it, and check that the fingers and elbows bend properly in AccuRig's preview.
3. Export as **FBX**, in **T-pose**, with the mesh and textures included.
4. **Save it into `art/accurig/<name>.fbx`**, keeping the same name. Use this separate folder so the original stays untouched.

## Step 2: Mixamo

1. Go to mixamo.com and click **Upload Character**. Choose your AccuRig file, `art/accurig/<name>.fbx`.
2. Mixamo should keep AccuRig's skeleton. If it asks you to place markers, do so: chin, wrists, elbows, knees, groin.
3. Pick each animation and download it as **FBX**, **30 frames per second**:
   - **The first one must be "With Skin".** Use `idle` for this one. It provides the model itself.
   - **All the others "Without Skin".** They're smaller and faster.
   - For walking and running, tick **In Place** if Mixamo offers it. The import script pins them to the spot anyway.
4. Save every download into `art/mixamo/download/` with a clear name, for example:
   `goblin_idle.fbx`, `goblin_walk.fbx`, `goblin_run.fbx`, `goblin_attack.fbx`, `goblin_hit.fbx`, `goblin_die.fbx`

Good Mixamo picks for a monster: Breathing Idle, Zombie Walk or Mutant Walking, Mutant Run, Zombie Attack or Mutant Punch, Hit Reaction, Dying. For townsfolk: Idle, Walking, Talking.

## Step 3: Turn the downloads into the game's model

Open a terminal (Git Bash or PowerShell) in the project folder and run this, all on one line:

```
F:\Downstairs\Blender\blender.exe -b --python tools/ai3d/import_from_mixamo.py -- traffic_cone_goblin goblin_idle.fbx idle goblin_walk.fbx walk goblin_run.fbx run goblin_attack.fbx attack goblin_hit.fbx hit goblin_die.fbx die
```

- **First word after `--`:** the character's ID, the same `<name>` as the file in `godot/models/characters/`.
- **After that, pairs:** a file from `art/mixamo/download/`, then the animation name it becomes. The first pair must be the "With Skin" file.
- **The result:** `godot/models/characters/rigged/<name>.glb`.

**Never** overwrite `godot/models/characters/rigged/intern_pip.glb`. Other characters copy Pip's moves from it.

## Step 4: See it in the game

1. Open the Godot editor once (`F:\Downstairs\Godot_v4.7.2-stable_win64.exe\Godot_v4.7.2-stable_win64.exe`, then open the project in the `godot` folder) so it picks up the new file. Wait for the import bar to finish, then close it. Starting the game alone does **not** import new files. Without opening the editor window, this does the same thing from a terminal:
   `F:\Downstairs\Godot_v4.7.2-stable_win64.exe\Godot_v4.7.2-stable_win64_console.exe --headless --path godot --editor --quit`
2. Run `F:\Downstairs\Play Downstairs.bat` and pick the floor where that character lives.
3. Press **M** for the travel map and click their camp or town. Press **F1** to fly, which is safe and fast.

## Step 5: Changing it

**Too big or too small:**
1. In the Godot editor, find the file under `models/characters/rigged/` in the FileSystem panel and click it once.
2. Open the **Import** tab (beside the Scene tab, top left) and change **Root Scale**. For example, 1.2 makes it 20% bigger.
3. Click **Reimport**.

**Face, skin or colours:**
1. The textures are the `.jpg` and `.png` files with the character's name, next to the `.glb`.
2. Open one in any paint program. Krita is free.
3. Paint over it and save it with the **same name**. Godot picks it up the next time it opens.

**A different animation:**
1. Download the new one from Mixamo ("Without Skin").
2. Run Step 3 again with the whole list, swapping the new file in for the old one. Animations that aren't listed are left out, so list them all every time.

**Looks wrong after import:**
- **Stands in a T-pose:** the animation names don't match the table above. Check the spelling, all lower case.
- **Invisible, or only bones:** the first file wasn't downloaded "With Skin".
- **Slides along the ground:** the walk or run wasn't In Place. Download it again with In Place ticked.
- **Very dark or one flat colour:** a texture file is missing next to the `.glb`. Copy it in from `art/incoming/<name>/`.
- **Arms twisted:** AccuRig's rig was off. Redo the rig in AccuRig and start again from Step 1.

## What Mixamo can't do

- **Non-humanoid monsters:** Mixamo only animates humanoids, meaning two arms, two legs and a head. Moths, lampreys, slimes, the Kraken, wyrms and the Big Sucker need custom rigs in Blender. Leave those for when you have credits again.
- **Already-made characters:** most AI characters were already rigged by `tools/ai3d/auto_rig.py`. A Mixamo or AccuRig version you make simply replaces them, because it's the same file in `rigged/`.

## Where everything is

| What | Where |
|---|---|
| Unrigged character models | `godot/models/characters/<name>.glb` |
| Rigged, animated versions (the game prefers these) | `godot/models/characters/rigged/<name>.glb` |
| Characters to open in AccuRig (FBX with texture) | `art/mixamo/upload/` |
| Your AccuRig exports, going to Mixamo | `art/accurig/` |
| Mixamo downloads | `art/mixamo/download/` |
| Original Tripo downloads | `art/incoming/<name>/` |
| The import script | `tools/ai3d/import_from_mixamo.py` |

## Notes from the cone troll (2026-11-09)

- Only **one** download needs to be *With Skin* (usually the walk). Every other clip can be *Without Skin*.
- Mixamo saves the With Skin file in the model's own pose (for a Tripo model this can be lying down) and the Without
  Skin ones in a T-pose. The import notices, stands the model up in the T-pose, and copies every clip across bone by
  bone, so this needs nothing from you.
- Put `!` after a clip name on the import command to pin it in place (a lunge or a leap that travels):
  `import_from_mixamo.py -- cone_troll walk.fbx walk swipe.fbx "attack!" jump.fbx "slam!" roar.fbx taunt die.fbx die`
- Per-character finishing touches (an idle made from another clip, texture size, height) go in
  `tools/ai3d/extras/<character>.py`.
- Tripo textures can come at 8192 px; the troll's extras shrink the colour map to 2048 and drop the rest.
