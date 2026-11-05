# Downstairs: 3D look-dev prototype

A browser test bed (three.js) for the game's look: a comic-style environment with ink outlines and painted textures, plus sculpted, detailed monsters.

## Run it
```bash
cd prototype
npm install
python3 -m http.server 8765
# open http://localhost:8765/            (corridor scene)
# open http://localhost:8765/closeup.html (monster close-up)
```

## Files
- `scene.js`: corridor, lighting, first-person weapon, and the outline post-process
- `creature.js`: the goblin, sculpted as a signed-distance body, meshed with surface nets, with PBR skin
- `shot.js`, `shot2.js`: Playwright scripts that save renders to PNG
- `renders/`: saved renders
