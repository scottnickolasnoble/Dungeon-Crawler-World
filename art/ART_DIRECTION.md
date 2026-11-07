# Downstairs: art direction

**Goal:** believable cartoon. Real proportions and readable, normal faces, drawn like a hand-inked comic with thick black lines and flat painted colour. The reference for the style is Borderlands; every character stays an original Downstairs design.

**Keep:** every character's concept, personality and props, and the backbone of the level layouts.
**Replace:** all character models, then the look of the levels.

## The look, from the user's reference images
- **Main reference:** a first-person game drawn in thick black brush ink, with panel lines drawn on every surface, in cream, mustard and teal, with a black-and-cream checker floor.
- **Warmth and clutter:** a colourful shop where every surface holds something, in warm saturated colour.
- **Depth:** a sunlit town square with warm light, cool shadows and a dense street receding into the distance.
- Nothing should read as a placed block. Every prop gets real shape, worn paint and small story details.

Floor 0 sets the standard. To rebuild it: `tools/blender/build_landing_kit.py` makes the props, `tools/paint_landing_textures.mjs` paints the textures, and `godot/shaders/` holds the ink and shading.

## Floors 1 and down: real towns
- Every floor's town is different and built around that floor's theme. No shared town kit with new colours.
- Buildings have real interiors you walk into: shops with shopkeepers, guild halls, inns and homes. The town shouldn't be all exteriors.
- Keep the backbone of each floor's layout, and the locations and characters already in the prototype.

## Rules for every character
- Clear, appealing face: well-placed eyes with pupils, a real nose and mouth, and a readable expression. Nothing melted or skull-like unless the concept calls for it.
- Slightly exaggerated proportions: bigger hands and head, strong silhouette, one bold idea you can read from across a room.
- Painted surfaces: flat colours, big shapes, ink-style shadow lines. Grime is drawn on, not noisy.
- Funny before scary. The game's a dark-comedy TV show.

## Pipeline
1. **Tripo** (tripo3d.ai): make the model from a prompt below. Hands and arms should be clear of the body. Download as `.glb`.
2. **Mixamo** (mixamo.com), humanoids only: upload the model, auto-rig, download idle, walk, attack and hit animations. Mixamo wants `.fbx` or `.obj`, so export that format from Tripo as well.
3. Non-humanoids (moths, lampreys, mimics and so on) can't use Mixamo. They get rigged in Tripo or Blender.
4. Put every download in `art/incoming/<character name>/`. Claude takes it from there: cleanup in Blender, import into Godot, inked shading.

Weapons are made as separate models so they don't get fused to a hand, and attached in Godot.

## Pilot: three characters to prove the look
Settings if Tripo offers them: text to model, highest texture quality, T-pose on.

Negative prompt for all three, if there's a field for it:
`photorealistic, horror, gore, melted face, distorted face, extra limbs, pedestal, base, ground plane, multiple characters, blurry texture`

### 1. Traffic-Cone Goblin (Floor 1 regular)
```
Full-body 3D game character, stylized comic book cartoon, hand-painted texture with bold black ink lines and cel-shaded colours. A scrawny, cocky green goblin with a big expressive face: large yellow eyes with clear pupils, long pointed ears, big hooked nose, wide toothy grin with an underbite. Wears an orange and white traffic cone as a helmet, tilted to one side, a leather strap across his bare chest, and a ragged brown loincloth. Wiry arms, oversized hands and bare feet. Standing in a T-pose, arms straight out, facing forward, empty hands.
```

### 2. Intern Pip (Floor 0, tutorial guide)
```
Full-body 3D game character, stylized comic book cartoon, hand-painted texture with bold black ink lines and cel-shaded colours. A nervous, friendly young TV network intern with a likeable human face: big anxious eyes, raised eyebrows, freckles, an awkward hopeful smile, messy hair. Wears a slightly too large red polo shirt with a staff lanyard and ID badge, khaki trousers and worn sneakers, with a pen tucked behind one ear. Skinny build, slightly oversized head and hands. Standing in a T-pose, arms straight out, facing forward, empty hands.
```

### 3. Sergeant Pylon (Floor 1 boss)
```
Full-body 3D game character, stylized comic book cartoon, hand-painted texture with bold black ink lines and cel-shaded colours. A big, stocky, self-important goblin sergeant with a broad green face: heavy brow, small furious yellow eyes, huge jaw with jutting lower tusks, a bristling moustache and a whistle on a cord around his neck. Five traffic cones stacked as a tall helmet of rank, the top one yellow. Wears a battered hi-vis yellow security vest with reflective stripes over a bare barrel chest, a belt with road-worker gear, torn work trousers and heavy boots. Huge forearms and hands. Standing in a T-pose, arms straight out, facing forward, empty hands.
```

## Design notes
- Pip's prototype outfit is a blue jumpsuit with a yellow stripe, which looks a lot like a famous game's vault suit. The redesign uses a TV-network intern look instead, which also suits the story better.
- After the pilot, the full roster follows the same template: Floor 0–6 monsters and bosses from `godot/data/monsters.json`, then named NPCs (Marta Vance, Pickles, Spin Cycle, Old Reggie, Wickley, Brother Ash, Sunny, Madame Prickle, Big Deb, the Neighbourhood Watch, Gusset, Elder Lantern), then the nine playable races.
