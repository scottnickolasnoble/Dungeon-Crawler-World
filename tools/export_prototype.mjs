// Exports the browser prototype into the Godot project: game data to godot/data/*.json and models to godot/models/**.glb.
// It runs the prototype's real modules in headless Edge (or Chrome), so the numbers and meshes are the prototype's own.
// The prototype files are not changed: the local server below adds a few exports to some modules as it serves them.
//
//   cd prototype && npm install        (three.js)
//   cd tools && npm install            (playwright-core)
//   node tools/export_prototype.mjs            everything
//   node tools/export_prototype.mjs data       data only
//   node tools/export_prototype.mjs models     models only
//   node tools/export_prototype.mjs models caveTroll,ultiMax   only models whose path contains one of these
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TOOLS, '..');
const PROTO = path.join(ROOT, 'prototype');
const OUT = path.join(ROOT, 'godot');
const MODE = process.argv[2] || 'all';
const ONLY = process.argv[3] ? process.argv[3].split(',') : null;

const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png' };
// Values the prototype keeps private to a module, exposed only in the copy served to the exporter.
const PATCHES = {
  '/game/data.js': (s) => s + '\nexport { BASES, AFFIXES, PREFIX, HOST_LINES };\n',
  '/game/mobs.js': (s) => s.replace('function buildNav(size)', 'globalThis.__modelFor = modelFor; function buildNav(size)') + '\nexport { RIG, ABIL };\n',
  '/game/story.js': (s) => s.replace('const SHOPS = {', 'const SHOPS = globalThis.__SHOPS = {').replace('const NPCNAME = {', 'const NPCNAME = globalThis.__NPCNAME = {') + '\nexport { GEAR };\n',
  '/game/npcs.js': (s) => s + '\nexport { FIRST };\n',
};
const PAGE = `<!doctype html><meta charset="utf-8"><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script><body></body>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/__export') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(PAGE); return; }
  if (url.pathname === '/__save' && req.method === 'POST') {
    const rel = url.searchParams.get('path');
    const dest = path.resolve(OUT, rel);
    if (!dest.startsWith(OUT + path.sep)) { res.writeHead(400); res.end('bad path'); return; }
    const chunks = []; req.on('data', (c) => chunks.push(c));
    req.on('end', () => { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, Buffer.concat(chunks)); res.writeHead(200); res.end('ok'); });
    return;
  }
  const file = path.join(PROTO, decodeURIComponent(url.pathname));
  if (!file.startsWith(PROTO) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  let body = fs.readFileSync(file);
  if (PATCHES[url.pathname]) body = PATCHES[url.pathname](body.toString('utf8'));
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' }); res.end(body);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

async function launch() {
  for (const channel of ['msedge', 'chrome']) { try { return await chromium.launch({ channel }); } catch (e) { /* try the next browser */ } }
  throw new Error('Neither Edge nor Chrome could be started.');
}
const browser = await launch();
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
page.on('console', (m) => { const t = m.text(); if (t.startsWith('[export]') || m.type() === 'error') console.log(t); });
await page.goto(base + '/__export');

// ------------------------------------------------------------------ data
if (MODE === 'all' || MODE === 'data') {
  const report = await page.evaluate(async () => {
    const dropped = [];
    const clean = (v, where) => {
      if (typeof v === 'function') { dropped.push(where); return undefined; }
      if (Array.isArray(v)) return v.map((x, i) => { const c = clean(x, `${where}[${i}]`); return c === undefined ? null : c; });
      if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) { const c = clean(x, `${where}.${k}`); if (c !== undefined) o[k] = c; } return o; }
      return v;
    };
    const save = async (name, obj) => {
      const body = JSON.stringify(clean(obj, name), null, 1);
      await fetch('/__save?path=' + encodeURIComponent('data/' + name + '.json'), { method: 'POST', body });
    };
    const D = await import('/game/data.js');
    const C = await import('/game/classes.js');
    const CR = await import('/game/crafting.js');
    const RG = await import('/game/recipes_gen.js');
    const M = await import('/game/mobs.js');
    const ST = await import('/game/story.js');
    const NP = await import('/game/npcs.js');
    const R = await import('/npcs/races.js');
    // SHOPS and NPCNAME live inside createStory; building it with an empty game state is enough to read them
    let storyError = null;
    try { const stub = new Proxy({ state: { quests: {}, flags: {}, counters: {}, mats: {}, base: {} } }, { get: (t, k) => (k in t ? t[k] : () => undefined) }); ST.createStory(stub); } catch (e) { storyError = e.message; }

    await save('classes', { races: C.PRACES, classes: C.CLASSES, guilds: C.GUILDS, elements: C.ELEM, element_status: C.ELEM_STATUS, upgrade_effects: C.UP_EFFECT });
    await save('skills', { skills: C.SKILLDEFS, pyromancer_tree: D.SKILLS });
    await save('loot', { stats: D.STATS, stat_info: D.STAT_INFO, stat_labels: D.STAT_LABEL, rarities: D.RARITIES, gear_drop: D.GEAR_DROP, rarity_mat: D.RARITY_MAT, rarity_mat_drop: D.RARITY_MAT_DROP, slots: D.SLOTS, slot_names: D.SLOT_NAMES, bases: D.BASES, weapon_types: D.WTYPES, weapons: D.WEAPONS, affixes: D.AFFIXES, prefixes: D.PREFIX, host_lines: D.HOST_LINES, consumables: D.CONSUMABLES, boxes: D.BOXES, achievements: D.ACHIEVEMENTS });
    await save('crafting', { tables: CR.TABLES, mats: CR.MATS, mats_extra: RG.MATS_EXTRA, mat_rarity: CR.MAT_RARITY, recipes: CR.RECIPES, tier_cap: CR.TIER_CAP_UI, max_tier: CR.MAX_TIER, quality: CR.QUALITY });
    await save('monsters', { monsters: M.MOBDEFS, rigs: M.RIG, abilities: M.ABIL });
    await save('quests', { quests: ST.QUESTS, quest_gear: ST.GEAR, npc_names: globalThis.__NPCNAME || {} });
    // Shops are not exported: each one is a function that builds its stock from game state, so they get ported to GDScript in Phase 3.
    await save('npcs', { races: Object.fromEntries(Object.entries(R.RACES).map(([k, v]) => [k, v])), role_colors: R.ROLE_COLORS, filler_lines: NP.FILLER_LINES, first_names: NP.FIRST });
    return { dropped, storyError, counts: { classes: Object.keys(C.CLASSES).length, races: Object.keys(C.PRACES).length, skills: C.SKILLDEFS.length, monsters: Object.keys(M.MOBDEFS).length, recipes: CR.RECIPES.length, quests: Object.keys(ST.QUESTS).length, weapons: D.WEAPONS.length } };
  });
  console.log('DATA counts', JSON.stringify(report.counts));
  if (report.storyError) console.log('createStory error:', report.storyError);
  console.log(`Functions left out of the JSON (${report.dropped.length}):`);
  const groups = {}; for (const d of report.dropped) { const k = d.replace(/\[\d+\]/g, '[]').replace(/\.(\w+)\.(\w+)$/, '.*.$2'); groups[k] = (groups[k] || 0) + 1; }
  for (const [k, n] of Object.entries(groups)) console.log(`  ${n} x ${k}`);
}

// ------------------------------------------------------------------ models
if (MODE === 'all' || MODE === 'models') {
  page.setDefaultTimeout(0);
  const r = await page.evaluate(async (only) => {
    const THREE = await import('three');
    const { GLTFExporter } = await import('/node_modules/three/examples/jsm/exporters/GLTFExporter.js');
    const { createMobSystem, MOBDEFS } = await import('/game/mobs.js');
    const { Collision } = await import('/engine/ink.js');
    const { poolNPC, RACES, ROLE_COLORS } = await import('/npcs/races.js');
    const NM1 = await import('/npcs/floor1to3.js'); const NM2 = await import('/npcs/floor4to6.js');
    const MODS = ['tier1', 'tier2', 'tier3', 'tier4', 'tier5', 'tier6', 'bosses1', 'bosses2', 'bosses3', 'troll', 'ultimax'];
    createMobSystem({ scene: new THREE.Scene(), fx: [], col: new Collision(), rigged: new Set(), nav: null });
    const modelFor = globalThis.__modelFor;

    const exporter = new GLTFExporter(); const failed = []; const notes = {}; const done = [];
    const note = (k) => { notes[k] = (notes[k] || 0) + 1; };
    // glTF instancing support varies, so instanced parts become ordinary meshes
    function bake(root) {
      const inst = []; root.traverse((o) => { if (o.isInstancedMesh) inst.push(o); });
      for (const im of inst) { const g = new THREE.Group(); g.name = im.name; g.position.copy(im.position); g.quaternion.copy(im.quaternion); g.scale.copy(im.scale); const m4 = new THREE.Matrix4(); for (let i = 0; i < im.count; i++) { const m = new THREE.Mesh(im.geometry, im.material); im.getMatrixAt(i, m4); m4.decompose(m.position, m.quaternion, m.scale); g.add(m); } im.parent.add(g); im.parent.remove(im); note('instanced meshes expanded'); }
      root.traverse((o) => { if (o.isMesh) { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const mt of ms) { if (mt.isShaderMaterial) note('shader materials (exported without material): ' + o.name); } } });
      return root;
    }
    async function save(rel, build) {
      try {
        if (only && !only.some((o) => rel.includes(o))) return;
        const built = build(); // a few builders return { group } or { root } instead of the model itself
        const obj = built && (built.isObject3D ? built : built.group || built.root);
        if (!obj || !obj.isObject3D) return;
        bake(obj);
        const buf = await new Promise((ok, no) => exporter.parse(obj, ok, no, { binary: true }));
        await fetch('/__save?path=' + encodeURIComponent('models/' + rel + '.glb'), { method: 'POST', body: buf });
        done.push([rel, buf.byteLength]);
        if (done.length % 10 === 0) console.log('[export] ' + done.length + ' models, latest ' + rel);
      } catch (e) { failed.push(rel + ': ' + e.message); }
    }
    // every monster the game uses, by model key (variants where the prototype builds distinct meshes)
    const seen = new Set();
    for (const [kind, d] of Object.entries(MOBDEFS)) {
      if (seen.has(d.model)) continue; seen.add(d.model);
      if (d.model === 'goblin' || d.model === 'thrower' || d.model === 'captain') { for (let v = 0; v < 8; v++) await save(`monsters/${d.model}_v${v}`, () => modelFor(kind, v)); continue; }
      if (['mallcop', 'hound', 'hag', 'slime', 'gnome', 'leech', 'hunter'].includes(d.model)) { for (let v = 0; v < 3; v++) await save(`monsters/${d.model}_v${v}`, () => modelFor(kind, v)); continue; }
      await save(`monsters/${d.model}`, () => modelFor(kind, 0));
    }
    // sculpted monsters that exist as files but have no MOBDEFS entry yet (later floors)
    for (const name of MODS) {
      const mod = await import(`/monsters/${name}.js`);
      for (const [fn, f] of Object.entries(mod)) { if (typeof f === 'function' && fn !== 'trafficCone') await save(`monsters/library/${fn}`, () => f()); }
    }
    // named NPCs, then every race and role combination
    for (const mod of [NM1, NM2]) for (const [fn, f] of Object.entries(mod)) if (typeof f === 'function') await save(`npcs/named/${fn}`, () => f());
    for (const race of Object.keys(RACES)) for (const role of Object.keys(ROLE_COLORS)) await save(`npcs/pool/${race}_${role}`, () => poolNPC({ role, race, variant: 0 }));
    return { done, failed, notes };
  }, ONLY);
  const total = r.done.reduce((s, [, b]) => s + b, 0);
  console.log(`MODELS exported ${r.done.length}, ${(total / 1048576).toFixed(1)} MB`);
  console.log('Largest:', r.done.sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, b]) => `${n} ${(b / 1048576).toFixed(1)}MB`).join(', '));
  if (Object.keys(r.notes).length) console.log('Notes:', JSON.stringify(r.notes, null, 1));
  // the library re-exports models the game already uses, so identical copies are removed
  const sha = (f) => crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');
  const monsterDir = path.join(OUT, 'models/monsters'), libDir = path.join(monsterDir, 'library');
  const used = new Set(fs.readdirSync(monsterDir).filter((f) => f.endsWith('.glb')).map((f) => sha(path.join(monsterDir, f))));
  let removed = 0; for (const f of fs.readdirSync(libDir)) { if (f.endsWith('.glb') && used.has(sha(path.join(libDir, f)))) { fs.rmSync(path.join(libDir, f)); fs.rmSync(path.join(libDir, f + '.import'), { force: true }); removed++; } }
  console.log(`Library duplicates removed: ${removed}`);
  if (r.failed.length) { console.log(`FAILED ${r.failed.length}:`); r.failed.forEach((f) => console.log('  ' + f)); }
}

await browser.close();
server.close();
