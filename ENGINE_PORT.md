# Moving Downstairs to a game engine

## Recommendation: Godot 4

| | Godot 4 | Unity 6 | Unreal 5 |
|---|---|---|---|
| Cost | Free forever, no royalties | Free until about $200K a year in revenue | Free, then 5% of revenue after $1M |
| Runs on a modest laptop | Yes (editor is about 150 MB) | So-so (multi-GB, heavy) | No, wants a strong GPU |
| Can Claude write and change it directly | **Yes.** Scripts (GDScript) *and* scenes (`.tscn`) are plain text | Scripts yes, scenes and prefabs are awkward | Mostly visual Blueprints, hard for an AI to edit |
| Can Claude run and test it | Yes: Godot runs headless from the command line | Limited | No |
| Play in a browser | Yes (web export) | Yes | No |
| Comic-ink outline look | Easy: one screen shader | Easy | Easy |

Godot wins for this project. It's free with no strings, it runs on your laptop, and nearly everything in a Godot project is a text file. Claude can write, edit and test those files the same way it built the browser prototype.

Use **Godot 4 "Standard"**, not the .NET/C# version, and write the scripts in **GDScript**. GDScript is the language that also exports to web.

## What carries over, and what gets rebuilt

| Prototype (browser) | In Godot | How |
|---|---|---|
| Classes, races, skills (`game/classes.js`) | `data/*.json`, loaded by a `Data` autoload | Converted by script, nothing lost |
| Monster stats (`MOBDEFS`), loot, 720 recipes, shops | `data/*.json` | Converted by script |
| Quests and dialog trees (`game/story.js`) | `data/quests.json`, `data/dialogs.json` plus a dialog runner | Converted. Dialog choices that run code become named actions |
| Floor layouts (`worlds/floors.js`, town and camp generator) | GDScript generator that builds the same towns, camps and scenery | Re-written (same rules, same seeds) |
| Monster, NPC and building meshes | `.glb` model files | Exported from the prototype as-is, to replace with better art later |
| Walk cycles (vertex-shader rig) | Real skeletons plus animations | Rebuilt: Mixamo (free) or Blender rigging |
| Combat, mob AI, parry, dodge | `CharacterBody3D` plus `NavigationAgent3D` (real navmesh) | Re-written, same numbers |
| HUD, inventory, skill tree, crafting, quests UI | Godot `Control` scenes | Re-written |
| Ink outline post-process | One screen-space shader | Ported (same maths) |
| Voices, SFX, music | `AudioStreamPlayer3D`; your recordings go in `audio/voice/` | Your `voice/SCRIPTS.md` file names still apply |
| Save game | `user://save.json` | Re-written |

The design work carries over unchanged: classes, quests, numbers, floors and story. The code that runs it gets rewritten for the engine.

## Step by step at home

### Step 1: Install the tools (one evening)
1. **Godot 4** (latest 4.x stable, *Standard* build): https://godotengine.org/download. It's a zip with no installer: unzip it, then run `Godot_v4.x-stable_win64.exe`.
2. **Git**: https://git-scm.com/download/win (accept the defaults).
3. **Claude Code** on your computer: install the Claude desktop app (Code tab), or the CLI from https://code.claude.com. This lets Claude launch Godot, read its errors and fix them, instead of you copying errors back and forth.
4. **Blender** (free): https://www.blender.org/download/. You need it in Step 6.
5. Optional: **VS Code** (https://code.visualstudio.com) with the "godot-tools" extension, if you want to read the scripts yourself.

### Step 2: Get the project
```
git clone https://github.com/scottnickolasnoble/dungeon-crawler-world.git
cd dungeon-crawler-world
git checkout claude/device-sync-offline-start-tlcj0x
```
The browser prototype stays in `prototype/` as the reference. The new engine project goes in `godot/` next to it.

### Step 3: Have Claude scaffold the Godot project
Open Claude Code in the `dungeon-crawler-world` folder and ask for **Phase 1** (below). It's best to tell Claude where Godot is, e.g. *"Godot is at C:\Godot\Godot_v4.4-stable_win64.exe"*, so it can run headless checks. Claude will:
- create `godot/project.godot` and the folder layout (`data/`, `scenes/`, `scripts/`, `models/`, `shaders/`, `audio/`, `ui/`);
- run a converter that turns the prototype's JS data into JSON;
- export every prototype model to `.glb` files (a headless browser script);
- write the player controller, the ink outline shader and Floor 0.

### Step 4: Open it and play
1. Start Godot, click **Import**, pick `godot/project.godot`, then **Import & Edit**.
2. Press **F5** (Run Project). You should be on Floor 0 with the lead pipe.
3. When something's off, tell Claude what you saw. Claude can also run the game headless and read the error log itself.

### Step 5: Port phase by phase (each phase ends playable)
| Phase | What you get | Rough size |
|---|---|---|
| 1. Foundation | Project, data converted, models exported, player movement and camera, ink shader, Floor 0 hall | 1–2 sessions |
| 2. Fighting | Melee, parry, block, dodge, mobs with navmesh AI and swing tells, loot drops, XP curve | 2–3 sessions |
| 3. Floor 1 | Floor generator (towns, camps, scenery kit), Stairwell Camp, quests, dialog, merchants, Safe Room | 2–3 sessions |
| 4. Character | HUD, inventory, equipment, character sheet, skill tree, Hall of Callings, guilds, crafting benches | 3–4 sessions |
| 5. Floors 2–6 | All floors, bosses, audio and voices, settings menu, save and load | 3–5 sessions |
| 6. Art upgrade | Real models and animations (Step 6) | Ongoing |

### Step 6: Upgrade the art (when the game plays well)
- **Characters and monsters:** generate a base model in **Tripo AI** (free plan, about 300 credits a month; free models are public but fine for a personal game) or sculpt in Blender. Auto-rig humanoids for free at **Mixamo** (https://www.mixamo.com, Adobe account) and download walk, attack and idle animations. Then drop the `.glb`/`.fbx` into `godot/models/`.
- **Blender MCP** (free): install the add-on from https://github.com/ahujasid/blender-mcp and connect it to Claude Desktop. Claude can then build, fix and texture models directly in your Blender.
- **Textures:** Dream Textures (free Blender add-on, needs a decent GPU) for painted building and skin textures.
- Each model swaps in by replacing the file; the game code doesn't change.

### Step 7: Build a version to play
- **Windows game:** Godot → Project → Export → add "Windows Desktop" (first time: "Manage Export Templates" → Download). You get a `.exe` you can run anywhere.
- **Browser:** add a "Web" export. The output is too big for a Claude artifact, but you can upload it free and private on https://itch.io (set it to "Restricted" or "Draft").

## Tips
- Keep `prototype/` working: it's the spec. When the Godot version disagrees, the prototype shows what was intended.
- Commit after every phase (`git add -A`, then `git commit -m "Phase 2: combat"`), so you can always roll back.
- The project uses Godot's **Forward+** renderer, because the game stays on the home PC (RTX 3070) and the ink shader reads Forward+'s normal buffer. A browser build or a much weaker machine would need the Compatibility renderer and a reworked ink shader.
