// Walkable floor: first-person Pyromancer with spells, goblins, loot, stats, skills and achievements.
import * as THREE from '../node_modules/three/build/three.module.js';
import { createInk, Collision } from '../engine/ink.js';
import { createMobSystem, MOBDEFS, scaleDmg } from './mobs.js';
import { createAudio } from './audio.js';
import { createNPCSystem, FILLER_LINES } from './npcs.js';
import { createStory } from './story.js';
const AU = createAudio();
import { SKILLS, CLASS, STATS, makeItem, makeRng, openBox, BOXES, ACHIEVEMENTS, CONSUMABLES } from './data.js';
import { createUI } from './ui.js';
import { createCrafting, createCraftUI, MATS, TABLES } from './crafting.js';

const $ = (id) => document.getElementById(id);
const QS = new URLSearchParams(location.search); const HASH = location.hash.slice(1);
// floors are chosen by #hash (artifact pages drop query strings); ?floor= still works for local tests
const FLOOR = QS.get('floor') || (HASH === 'pad' ? 'pad' : HASH === 'floor-2' ? '2' : HASH === 'floor-3' ? '3' : '1');
function goFloor(f) { if (QS.get('floor')) { location.search = `?floor=${f}`; return; } location.hash = f === 'pad' ? 'pad' : `floor-${f}`; }
window.addEventListener('hashchange', () => location.reload());
const SAVE_KEY = 'downstairs_save_v2';
const rng = makeRng(Date.now() & 0xffff);
const FIRE_SKILLS = ['firebolt', 'fireball', 'flamewave', 'emberdarts', 'combust', 'heatray', 'lavapool', 'livingflame', 'inferno', 'flamestep'];

// ---------------- state ----------------
const state = {
  name: 'Dale', level: 1, xp: 0, xpNext: 0, statPoints: 0, skillPoints: 0, gold: 37, scrap: 4,
  base: { STR: 7, DEX: 10, CON: 11, INT: 15, WIS: 11, CHA: 8 },
  hp: 1, mana: 1, stamina: 100, hunger: 78, thirst: 64, ward: 0, wardMax: 1,
  equip: {}, inv: [], ach: {}, counters: { walked: 0, kills: 0, burned: 0, wardAbsorb: 0, boxes: 0, parries: 0 }, conquered: {}, discovered: new Set(),
  skills: { firebolt: { lvl: 1, ups: [] }, flameward: { lvl: 1, ups: [] }, kindle: { lvl: 1, ups: [] }, fireball: { lvl: 1, ups: [] } },
};
state.mats = { scrapmetal: 14, plastic: 6, wire: 6, rubber: 3, glass: 6, cloth: 8, coneplastic: 4, gristle: 6, hide: 3, sulphur: 5, saltpetre: 3, charcoal: 2, salt: 3, dirtywater: 6, grease: 3, herbs: 4, mushroom: 5, mysterymeat: 2, lampreymeat: 1, spring: 2, battery: 1, paper: 2, ember: 4, frost: 1, roughruby: 1 };
state.tables = { workbench: { tier: 1, slot: 2 }, still: { tier: 1, slot: 3 } }; state.tableStock = []; state.craftXP = {}; state.invCap = 48; state.buffs = []; state.gold = 520; state.lastFloor = '1';
function saveGame() { try { const o = { ...state, discovered: [...state.discovered] }; delete o.equipped; localStorage.setItem(SAVE_KEY, JSON.stringify(o)); } catch (e) {} }
function loadGame() { try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false; const o = JSON.parse(raw); Object.assign(state, o); state.discovered = new Set(o.discovered || []); return true; } catch (e) { return false; } }
const LOADED = !QS.has('newgame') && HASH !== 'new' && loadGame();
if (HASH === 'new') { try { history.replaceState(null, '', '#floor-1'); } catch (e) {} }
state.equipped = (it) => Object.values(state.equip).includes(it);
const xpFor = (lv) => Math.round(60 * lv ** 1.35);
state.xpNext = xpFor(state.level);
// starting kit (new game only): a few pieces equipped, some in the bag, and a box to open
if (!LOADED) for (const slot of ['head', 'chest', 'main', 'boots', 'gloves']) state.equip[slot] = makeItem(rng, { level: 1, slot, minRarity: 1 });
if (!LOADED) { for (let i = 0; i < 6; i++) state.inv.push(makeItem(rng, { level: 2 }));
state.inv.push({ uid: 9001, kind: 'box', box: 'silver', name: 'Silver Box', rarity: 'rare', host: 'A welcome gift. From us. To you. Enjoy it while you can.' });
state.inv.push({ ...CONSUMABLES[0], uid: 9002, rarity: 'common' }, { ...CONSUMABLES[1], uid: 9003, rarity: 'common' }, { ...CONSUMABLES[2], uid: 9004, rarity: 'uncommon' }); }

function gearTotals() { const t = {}; for (const it of Object.values(state.equip)) if (it) for (const [k, v] of Object.entries(it.stats)) t[k] = (t[k] || 0) + v; return t; }
function derived() {
  const g = gearTotals(); const now = performance.now() / 1000; for (const b of state.buffs || []) if (b.until > now) g[b.stat] = (g[b.stat] || 0) + b.amount; const S = (k) => state.base[k] + (g[k] || 0);
  return { gearStats: g, maxHp: 60 + S('CON') * 8 + (g.hp || 0), maxMana: 40 + S('INT') * 6 + (g.mana || 0), maxStamina: 80 + S('CON') * 2 + S('DEX'), manaRegen: 2 + S('WIS') * 0.35,
    armor: g.armor || 0, spell: S('INT') * 2 + (g.spell || 0), fire: g.fire || 0, crit: 5 + Math.floor(S('DEX') / 3) + (g.crit || 0), castSpeed: g.castSpeed || 0, moveSpeed: g.moveSpeed || 0 };
}
const gearSkillBonus = (id) => { const g = gearTotals(); return (g['skill_' + id] || 0) + (FIRE_SKILLS.includes(id) ? g.skill_fire || 0 : 0); };
const effLevel = (id) => (state.skills[id] ? state.skills[id].lvl + gearSkillBonus(id) : 0);
function spellDamage(id) { const D = derived(), L = effLevel(id); const base = id === 'fireball' ? 34 + L * 7 : id === 'firebolt' ? 12 + L * 3.2 : 0; return (base + D.spell * (id === 'fireball' ? 0.9 : 0.55)) * (1 + D.fire / 100); }
if (!LOADED) { const D = derived(); state.hp = D.maxHp * 0.85; state.mana = D.maxMana; }

// ---------------- scene ----------------
const ink = createInk($('stage'), { fov: 72 });
const { scene, camera, fx } = ink;
const col = new Collision(8);
let world;
const cds = {}; const cooldownFrac = (id) => { const s = SKILLS.find((q) => q.id === id); const r = cds[id] || 0; return s && s.cd ? Math.max(0, r / s.cd) : 0; };

// ---------------- UI hooks ----------------
const G = { state, derived, gearSkillBonus, spellDamage, cooldownFrac, onPanel: (o) => { if (o && document.pointerLockElement) document.exitPointerLock(); },
  drawMap, achProgress,
  addStat(s) { if (state.statPoints > 0) { state.base[s]++; state.statPoints--; } },
  levelSkill(id) { const k = state.skills[id]; if (k && state.skillPoints > 0 && k.lvl < 15) { k.lvl++; state.skillPoints--; if (k.lvl % 5 === 0) ui.toast(`<b>${SKILLS.find((s) => s.id === id).name}</b> reached Lv ${k.lvl}: choose an upgrade!`, '#b46cff'); } },
  chooseUpgrade(id, t, c) { const k = state.skills[id]; if (k && k.lvl >= (t + 1) * 5 && k.ups[t] === undefined) { k.ups[t] = c; ui.toast(`Upgrade chosen: <b>${SKILLS.find((s) => s.id === id).ups[t][c]}</b>`, '#b46cff'); } },
  unequip(slot) { const it = state.equip[slot]; if (!it) return; if (state.inv.length >= state.invCap) return ui.toast('Inventory full!', '#E5484D'); delete state.equip[slot]; state.inv.push(it); clampVitals(); },
  useItem(it) {
    if (it.kind === 'gear') { let slot = it.slot; if (slot === 'ring1' && state.equip.ring1 && !state.equip.ring2) slot = 'ring2'; const old = state.equip[slot]; state.equip[slot] = it; state.inv.splice(state.inv.indexOf(it), 1); if (old) state.inv.push(old); clampVitals(); checkAch(); }
    else if (it.kind === 'consumable' && it.effect.bomb) { ui.toast(`${it.name}: press G to throw`, '#ff8a2a', 1800); return; }
    else if (it.kind === 'consumable' && it.effect.turret) { deployTurret(it); state.inv.splice(state.inv.indexOf(it), 1); ui.close(); return; }
    else if (it.kind === 'consumable') { const D = derived(); const e = it.effect; if (e.buff) { state.buffs.push({ stat: e.buff, amount: e.amount, until: performance.now() / 1000 + e.mins * 60 }); ui.toast(`+${e.amount} ${e.buff} for ${e.mins} min`, '#5ad86a'); } if (e.bag) { state.invCap = Math.min(96, state.invCap + e.bag); ui.toast(`Inventory +${e.bag} slots (${state.invCap})`, '#c86aa8'); } if (e.scroll) { state.mana += 30; cds.fireball = 0; setTimeout(() => cast('fireball'), 50); } if (e.map) { world.map.pois.forEach((p) => state.discovered.add(p.name)); for (let x = -30; x < 30; x++) for (let z = -30; z < 30; z++) visited.add(`${x},${z}`); ui.toast('The map reveals the whole area', '#F5C518'); } if (e.stamina) state.stamina = Math.min(D.maxStamina, state.stamina + e.stamina); if (e.recall && world.spawn) { P.pos.set(world.spawn[0], 0, world.spawn[2]); ui.banner('RECALLED TO TOWN', '#7BE38A'); } if (e.hp) state.hp = Math.min(D.maxHp, state.hp + e.hp); if (e.mana) state.mana = Math.min(D.maxMana, state.mana + e.mana); if (e.hunger) state.hunger = Math.min(100, state.hunger + e.hunger); if (e.thirst) state.thirst = Math.min(100, state.thirst + e.thirst); state.inv.splice(state.inv.indexOf(it), 1); ui.toast(`Used <b>${it.name}</b>`, '#5ad86a'); }
    else if (it.kind === 'book') { const s = SKILLS.find((q) => q.id === it.skill); state.inv.splice(state.inv.indexOf(it), 1); if (state.skills[s.id]) { if (state.skills[s.id].lvl < 15) state.skills[s.id].lvl++; ui.toast(`Duplicate book: <b>${s.name}</b> +1 level`, '#b46cff'); } else { state.skills[s.id] = { lvl: 1, ups: [] }; ui.banner(`NEW SKILL: ${s.name.toUpperCase()}`, '#b46cff'); ui.host(`You learned ${s.name}. From a book. In a dungeon. Truly the hero we deserve.`); } }
    else if (it.kind === 'box') { state.inv.splice(state.inv.indexOf(it), 1); const items = openBox(rng, it.box, Math.max(3, state.level)); items.forEach((x) => state.inv.push(x)); state.counters.boxes++; ui.revealBox(BOXES[it.box].name, BOXES[it.box].color, items, checkAch); const best = items.find((x) => x.rarity === 'legendary' || x.rarity === 'epic'); ui.host(best ? `Ooh, ${best.name}! The audience is jealous. I'm jealous.` : 'Unboxing! The purest form of content.'); }
  },
  scrap(it) { state.inv.splice(state.inv.indexOf(it), 1); const r = ['junk', 'common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(it.rarity); state.scrap += 1 + r; state.gold += Math.round((it.value || 10) / 4); const got = { scrapmetal: 1 + r, [['plastic', 'wire', 'cloth', 'rubber', 'glass'][it.uid % 5]]: 1 + (r >> 1) }; if (r >= 3) got[['ember', 'frost', 'storm', 'light'][it.uid % 4]] = r - 2; if (it.stats && it.stats.fire) got.ember = (got.ember || 0) + 1; for (const [m, n] of Object.entries(got)) state.mats[m] = (state.mats[m] || 0) + n; ui.toast(`Scrapped ${it.name}<div class="sm">${Object.entries(got).map(([m, n]) => `+${n} ${MATS[m]}`).join(' · ')}</div>`, '#9a9a9a', 2200); },
  scrapJunk() { const j = state.inv.filter((i) => i.kind === 'gear' && i.rarity === 'junk'); j.forEach((i) => G.scrap(i)); if (!j.length) ui.toast('No junk to scrap', '#9a9a9a', 1500); },
};
const ui = createUI(G);
{ const h = ui.host; ui.host = (t) => { h(t); AU.say(t, 'host'); }; const tg = ui.toggle; ui.toggle = (p) => { SFX('ui'); tg(p); }; }
const CR = createCrafting(G); const craftUI = createCraftUI(G, CR);
G.closeCraft = () => ui.close();
const NPCS = createNPCSystem({ scene, col, get nav() { return MS.nav; } });
const STORY = createStory({ state, floor: FLOOR, CR, derived, toast: (...a) => ui.toast(...a), host: (t) => ui.host(t), sfx: (n) => SFX(n), gainXP: (n) => gainXP(n), save: () => saveGame(),
  uid: () => Math.floor(Math.random() * 1e9), makeItem: (o) => makeItem(rng, o), give: (it) => { state.inv.push(it); ui.toast(`<span style="color:${RCOL[it.rarity] || '#fff'}">${it.name}</span> added`, '#3a3448', 2500); }, giveCons: (i) => state.inv.push({ ...CONSUMABLES[i], uid: Math.floor(Math.random() * 1e9), rarity: 'common' }),
  say: (t, v, p) => AU.say(t, v, p), openShop: (id, title) => {}, openPanel: (p) => { ui.toggle(p); }, onOpen: (o) => { if (o && document.pointerLockElement) document.exitPointerLock(); }, rcol: (r) => RCOL[r] || '#fff' });
G.renderShop = () => STORY.renderShop(); G.renderLog = () => STORY.renderLog();
const RCOL = { junk: '#9a9a9a', common: '#f4eedc', uncommon: '#5ad86a', rare: '#4a9aff', epic: '#b46cff', legendary: '#ff9a2a' };
G.toast = (...a) => ui.toast(...a);
G.renderSettings = () => { const S = AU.settings; $('setList').innerHTML = ['master', 'music', 'sfx', 'voice'].map((k) => `<label class="setRow" for="set_${k}"><span>${{ master: 'Master volume', music: 'Music', sfx: 'Sound effects', voice: 'Voices' }[k]}</span><input type="range" id="set_${k}" min="0" max="1" step="0.05" value="${S[k]}"></label>`).join('') + `<label class="setRow" for="set_hostSpeech"><span>Host voice: spoken (uses your browser's speech voice) instead of babble</span><input type="checkbox" id="set_hostSpeech" ${S.hostSpeech ? 'checked' : ''}></label><button class="cbtn" id="setTest">TEST VOICE</button>`; ['master', 'music', 'sfx', 'voice'].forEach((k) => { $('set_' + k).oninput = (e) => { S[k] = +e.target.value; AU.apply(); }; }); $('set_hostSpeech').onchange = (e) => { S.hostSpeech = e.target.checked; AU.apply(); }; $('setTest').onclick = () => { AU.init(); AU.say('Welcome back, contestant! Please keep your limbs inside the dungeon at all times.', 'host'); }; }; G.renderCraft = () => craftUI.render();
G.onTables = () => { if (world && world.refreshTables) world.refreshTables(state); saveGame(); };
G.onCraft = () => { SFX('craft'); state.counters.crafted = (state.counters.crafted || 0) + 1; if (state.counters.crafted === 1) ui.host('You made a thing! With your hands! The audience is moved. Mildly.'); saveGame(); };
function inSafe() { return FLOOR === 'pad' || (lastPOI && lastPOI.safe); }
function goPad() { if (FLOOR === 'pad') { saveGame(); goFloor(state.lastFloor || '1'); return; } if (!inSafe()) return ui.toast('You can only open your Crash Pad door from a safe zone (settlement or camp).', '#E5484D', 2200); state.lastFloor = FLOOR; saveGame(); goFloor('pad'); }
function nearSlot() { if (FLOOR !== 'pad' || !world.slots) return -1; let bi = -1, bd = 2.6; world.slots.forEach(([x, z], i) => { const d = Math.hypot(P.pos.x - x, P.pos.z - z); if (d < bd) { bd = d; bi = i; } }); return bi; }
function useSlot(i) { const id = Object.keys(state.tables).find((k) => state.tables[k].slot === i); craftUI.open(id || null, i); ui.toggle('craft'); }
const TABLES_REF = TABLES;
const throwables = [];
function throwBomb() {
  const it = state.inv.find((i) => i.kind === 'consumable' && i.effect.bomb); if (!it) return ui.toast('No bombs. Craft some at the Boom Bench.', '#9a9a9a', 1600);
  state.inv.splice(state.inv.indexOf(it), 1);
  const g = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), new THREE.MeshPhysicalMaterial({ color: '#2a2a2a', roughness: 0.5 })); const spark = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd040').multiplyScalar(3) })); spark.position.y = 0.16; g.add(spark); fx.push(spark);
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  g.position.copy(camera.position).addScaledVector(dir, 0.6); scene.add(g);
  SFX('throw', P.pos); throwables.push({ g, v: dir.multiplyScalar(14).add(new THREE.Vector3(0, 4, 0)), e: it.effect, t: 0 }); castAnim = 0.25;
  ui.toast(`Threw <b>${it.name}</b>`, '#ff8a2a', 900);
}
function tickThrowables(dt) {
  for (let i = throwables.length - 1; i >= 0; i--) { const b = throwables[i]; b.t += dt; b.v.y -= 15 * dt; b.g.position.addScaledVector(b.v, dt); b.g.rotation.x += dt * 8;
    const q = b.g.position.clone(); col.resolve(q, 0.1, q.y); const hitWall = q.distanceToSquared(b.g.position) > 1e-6; const hitMob = mobs.some((m) => !m.dead && m.g.position.distanceTo(b.g.position.clone().setY(m.g.position.y)) < 0.8 && b.g.position.y < 2.2);
    if (b.g.position.y < 0.15 || hitWall || hitMob || b.t > 4) { scene.remove(b.g); throwables.splice(i, 1); bombBlast(b.g.position.clone().setY(Math.max(0.3, b.g.position.y)), b.e); } }
}
function bombBlast(p, e) {
  const r = e.radius || 4, dmg = (e.dmg || 60) * (1 + state.base.DEX / 100);
  burstAt(p, e.burn ? '#ff7a1a' : e.freeze ? '#9ae8ff' : '#ffd040', 60, 1.4); SFX('bomb', p); shake = Math.max(shake, 0.35);
  for (const m of mobs) { if (m.dead) continue; const d = m.g.position.distanceTo(p.clone().setY(m.g.position.y)); if (d < r) { hurtMob(m, Math.round(dmg * (1 - d / r * 0.5)), e.burn ? 4 : 0); if ((e.freeze || e.root) && !m.dead) m.stun = e.freeze || e.root; } }
  const pd = P.pos.distanceTo(p); if (pd < r * 0.6) { state.hp -= Math.round(dmg * 0.25); ui.toast('You were in the blast radius. Classic.', '#E5484D', 1400); }
}
const turrets = [];
function deployTurret(it) {
  const e = it.effect, g = new THREE.Group(); const col0 = { flame: '#ff7a1a', frost: '#9ae8ff', shock: '#ffe040', nail: '#c8c8c8', decoy: '#e8a0ff', drone: '#3affea' }[e.turret] || '#ffffff';
  g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.6, 10), new THREE.MeshStandardMaterial({ color: '#5a5a62', metalness: 0.6, roughness: 0.4 })))); const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.6), new THREE.MeshStandardMaterial({ color: col0, emissive: new THREE.Color(col0), emissiveIntensity: 0.4 })); head.position.y = 0.55; g.add(head);
  const f = fwdVec(); g.position.set(P.pos.x + f.x * 1.6, e.turret === 'drone' ? 1.8 : 0.3, P.pos.z + f.z * 1.6); scene.add(g); turrets.push({ g, head, e, t: e.secs || 20, cd: 0, col: col0 }); ui.toast(`${it.name} deployed`, col0, 1400); SFX('craft', g.position);
  if (e.turret === 'decoy') for (const m of mobs) if (!m.dead && m.g.position.distanceTo(g.position) < 18) MS.aggro(m);
}
function tickTurrets(dt) {
  for (let i = turrets.length - 1; i >= 0; i--) { const T = turrets[i]; T.t -= dt; T.cd -= dt; if (T.e.turret === 'drone') { T.g.position.x += (P.pos.x + 1 - T.g.position.x) * dt * 2; T.g.position.z += (P.pos.z + 1 - T.g.position.z) * dt * 2; }
    let best = null, bd = 14; for (const m of mobs) { if (m.dead) continue; const d = m.g.position.distanceTo(T.g.position); if (d < bd) { bd = d; best = m; } }
    if (best) { T.head.lookAt(best.g.position.x, T.g.position.y + 0.55, best.g.position.z); if (T.cd <= 0 && T.e.dmg > 0) { T.cd = 0.8; hurtMob(best, T.e.dmg * (1 + state.level * 0.05), T.e.turret === 'flame' ? 2 : 0); if (T.e.turret === 'frost') best.slow = 2; if (T.e.turret === 'shock') best.stun = 0.4; burstAt(best.g.position.clone().setY(1.2), T.col, 8, 0.5); SFX('firebolt', T.g.position); } }
    if (T.t <= 0) { scene.remove(T.g); turrets.splice(i, 1); burstAt(T.g.position, '#9a9a9a', 12, 0.4); } }
}
function clampVitals() { const D = derived(); state.hp = Math.min(state.hp, D.maxHp); state.mana = Math.min(state.mana, D.maxMana); }

// ---------------- achievements ----------------
function achProgress(id) { const c = state.counters; return { firstSteps: `${Math.min(50, Math.floor(c.walked))}/50 m`, tourist: `${state.discovered.size}/3`, cartographer: `${state.discovered.size}/5`, pyro: `${c.burned}/10`, goblinBane: `${c.kills}/10`, warded: `${Math.floor(c.wardAbsorb)}/50`, fullKit: `${Object.keys(state.equip).length}/10`, hoarder: `${c.boxes}/5`, levelUp: `Lv ${state.level}/10` }[id] || ''; }
function award(id) {
  if (state.ach[id]) return; const a = ACHIEVEMENTS.find((q) => q.id === id); state.ach[id] = true; SFX('achieve');
  state.inv.push({ uid: 8000 + Math.floor(rng() * 1e6), kind: 'box', box: a.box, name: BOXES[a.box].name, rarity: a.box === 'gold' ? 'epic' : a.box === 'silver' ? 'rare' : 'uncommon', host: `Earned by: ${a.name}. Allegedly.` });
  ui.toast(`<div class="ta">ACHIEVEMENT</div><b>${a.name}</b><div class="sm">${a.desc}</div><div class="sm" style="color:${BOXES[a.box].color}">Reward: ${BOXES[a.box].name}</div>`, BOXES[a.box].color, 6000);
  ui.host({ firstSteps: 'You walked! Fifty whole metres! Somebody get this contestant a medal. Or a box. Here, a box.', tourist: 'Sightseeing during the apocalypse. Bold.', cartographer: 'You found everything. Well, everything we let you find.', firstBlood: 'First blood! The audience cheers. One of them faints.', pyro: 'Ten enemies on fire. You are what our insurance calls "a problem".', goblinBane: 'Ten goblins down. The cone industry is in shambles.', warded: 'Safety first. Boring, but first.', closeCall: 'So close! Ratings love a near-death experience.', fullKit: 'Fully dressed. Fashion is subjective. Yours is wrong.', hoarder: 'Five boxes opened. You are now legally a streamer.', levelUp: 'Level ten! Your mother would be proud. If she were here. She is not.', exit: 'You touched the Exit Sign. It does nothing. But you touched it.' }[id] || 'Achievement!');
}
function checkAch() {
  const c = state.counters;
  if (c.walked >= 50) award('firstSteps'); if (state.discovered.size >= 3) award('tourist'); if (state.discovered.size >= 5) award('cartographer');
  if (c.kills >= 1) award('firstBlood'); if (c.burned >= 10) award('pyro'); if (c.kills >= 10) award('goblinBane'); if (c.wardAbsorb >= 50) award('warded');
  if (Object.keys(state.equip).length >= 10) award('fullKit'); if (c.boxes >= 5) award('hoarder'); if (state.level >= 10) award('levelUp');
}
function gainXP(n) { state.xp += n; while (state.xp >= state.xpNext) { state.xp -= state.xpNext; state.level++; state.xpNext = xpFor(state.level); state.statPoints += 5; state.skillPoints += 1; for (const [k, v] of Object.entries(CLASS.auto)) state.base[k] += v; const D = derived(); state.hp = D.maxHp; state.mana = D.maxMana; ui.banner(`LEVEL ${state.level}!`); SFX('levelup'); ui.toast(`<b>Level ${state.level}</b><div class="sm">+5 stat points · +1 skill point · +1 INT +1 CON</div>`, '#F5C518'); ui.host('Level up! You are now slightly less likely to die. Slightly.'); } checkAch(); }

// ---------------- player controller ----------------
const P = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: 0, onGround: true, bob: 0 };
const keys = {}; let locked = false;
document.addEventListener('keydown', (e) => {
  keys[e.code] = true; if (e.repeat) return;
  const k = e.code;
  if (STORY.isOpen()) { STORY.key(k); return; }
  if (k === 'KeyI') ui.toggle('inv'); else if (k === 'KeyL') ui.toggle('quests'); else if (k === 'KeyB') ui.toast(FLOOR === 'pad' ? 'Walk up to a table and press E.' : 'Crafting happens at the tables in your Crash Pad. Press H in a safe zone.', '#9a9a9a', 1800); else if (k === 'KeyH' && !ui.isOpen()) goPad(); else if (k === 'KeyC') ui.toggle('char'); else if (k === 'KeyK') ui.toggle('skills'); else if (k === 'KeyM') ui.toggle('map'); else if (k === 'KeyJ') ui.toggle('ach'); else if (k === 'KeyP') ui.toggle('settings');
  else if (k === 'Escape') ui.close(); else if (k === 'KeyO') { ink.state.outline = !ink.state.outline; ui.toast(`Ink outlines ${ink.state.outline ? 'on' : 'off'}`, '#9a9a9a', 1200); }
  else if (!ui.isOpen()) { if (k === 'Digit1') cast('firebolt'); if (k === 'Digit2' || k === 'KeyR') cast('fireball'); if (k === 'Digit3' || k === 'KeyQ') cast('flameward'); if (k === 'Digit4') cast('kindle'); if (k === 'KeyE') use(); if (k === 'KeyG') throwBomb(); if (k === 'KeyF') { DEF.parryT = performance.now() / 1000; DEF.blockHeld = true; SFX('parryTry', P.pos); } if (k === 'KeyV') dodge(); if (k === 'Space' && P.onGround) { P.vel.y = 5.2; P.onGround = false; } }
});
document.addEventListener('keyup', (e) => { keys[e.code] = false; if (e.code === 'KeyF') DEF.blockHeld = false; });
function dodge() { const now = performance.now() / 1000; if (now - DEF.dodgeT < 0.7 || state.stamina < 20) return; state.stamina -= 20; DEF.dodgeT = now; const fwd = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw)), right = new THREE.Vector3(-fwd.z, 0, fwd.x); const d = new THREE.Vector3(); if (keys.KeyW) d.add(fwd); if (keys.KeyS) d.sub(fwd); if (keys.KeyD) d.add(right); if (keys.KeyA) d.sub(right); if (!d.lengthSq()) d.copy(fwd).negate(); DEF.dodgeDir.copy(d.normalize()); SFX('dodge', P.pos); }
$('stage').addEventListener('click', () => { if (!ui.isOpen() && started) $('stage').requestPointerLock(); });
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === $('stage'); $('clickHint').style.display = locked || ui.isOpen() || !started ? 'none' : 'flex'; });
document.addEventListener('mousemove', (e) => { if (!locked) return; P.yaw -= e.movementX * 0.0022; P.pitch = Math.max(-1.45, Math.min(1.45, P.pitch - e.movementY * 0.0022)); });
document.addEventListener('mousedown', (e) => { if (locked && e.button === 0) cast('firebolt'); if (locked && e.button === 2) cast('fireball'); });
document.addEventListener('contextmenu', (e) => { if (locked) e.preventDefault(); });

// ---------------- spells ----------------
const projectiles = [], blasts = [];
const boltLights = [0, 1, 2].map(() => { const l = new THREE.PointLight('#ff8a2a', 0, 8, 1.5); scene.add(l); return l; });
const handFlame = new THREE.Group(); camera.add(handFlame); handFlame.position.set(0.32, -0.3, -0.6);
{ const hm = new THREE.MeshPhysicalMaterial({ color: '#c8987a', roughness: 0.6, sheen: 0.4 }); const palm = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), hm); palm.scale.set(1.2, 0.7, 1.3); handFlame.add(palm); const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.4, 14), new THREE.MeshPhysicalMaterial({ color: '#5a2a1a', roughness: 0.9, sheen: 0.5 })); sl.rotation.x = Math.PI / 2 - 0.3; sl.position.set(0.02, -0.06, 0.24); handFlame.add(sl); }
const palmFire = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffa030').multiplyScalar(2.5) })); palmFire.position.set(0, 0.07, -0.03); handFlame.add(palmFire); fx.push(palmFire);
const palmLight = new THREE.PointLight('#ff9a3a', 1.5, 3); handFlame.add(palmLight); palmLight.position.set(0, 0.1, -0.1);
const wardBubble = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 18), new THREE.MeshBasicMaterial({ color: '#ff8a2a', transparent: true, opacity: 0.12, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })); camera.add(wardBubble); fx.push(wardBubble); wardBubble.visible = false;
let castAnim = 0;
const parryRing = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.17, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb040').multiplyScalar(2), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); parryRing.position.set(0, 0.08, -0.08); handFlame.add(parryRing); fx.push(parryRing); parryRing.visible = false;
function cast(id) {
  const s = SKILLS.find((q) => q.id === id); if (!state.skills[id]) return ui.toast(`${s.name} is locked · ${s.src}`, '#9a9a9a', 1600);
  if ((cds[id] || 0) > 0) return; if (state.mana < s.mana) return ui.toast('Not enough mana', '#4a9aff', 900);
  state.mana -= s.mana; cds[id] = s.cd * (1 - derived().castSpeed / 100); castAnim = 0.25;
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const origin = camera.position.clone().add(new THREE.Vector3(0.25, -0.2, -0.5).applyQuaternion(camera.quaternion));
  if (id === 'firebolt') { const twin = state.skills.firebolt.ups[0] === 0; const n = twin ? 2 : 1; for (let i = 0; i < n; i++) { const d = dir.clone(); if (twin) d.applyAxisAngle(new THREE.Vector3(0, 1, 0), (i - 0.5) * 0.06); spawnProjectile(origin, d, 'firebolt', twin ? 0.65 : 1); } }
  if (id === 'fireball') spawnProjectile(origin, dir, 'fireball', 1);
  SFX(id === 'flameward' ? 'ward' : id === 'kindle' ? 'firebolt' : id, P.pos);
  if (id === 'flameward') { const L = effLevel('flameward'), D = derived(); state.wardMax = state.ward = 40 + L * 9 + D.spell * 0.4 * (state.skills.flameward.ups[0] === 1 ? 1.5 : 1); ui.toast('Flame Ward', '#ff8a2a', 900); }
  if (id === 'kindle') { const hit = rayHit(origin, dir, 12); burstAt(hit, '#ffb040', 30, 0.5); ui.toast('Kindle: something nearby is now on fire. Congratulations.', '#ffb040', 1500); }
}
function rayHit(o, d, max) { const p = o.clone(); for (let t = 0; t < max; t += 0.25) { p.addScaledVector(d, 0.25); const q = p.clone(); col.resolve(q, 0.05, p.y); if (q.distanceToSquared(p) > 1e-6 || p.y < 0.05 || p.y > world.ceiling - 0.1) return p; } return p; }
function spawnProjectile(o, d, kind, scale) {
  const big = kind === 'fireball';
  const core = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.28 : 0.13 * scale, 14, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(big ? '#ff7a1a' : '#ffb040').multiplyScalar(3) }));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.5 : 0.25 * scale, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff6a1a', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  core.add(halo); core.position.copy(o); scene.add(core); fx.push(core, halo);
  projectiles.push({ m: core, v: d.clone().multiplyScalar(big ? 22 : 34), kind, life: 2.2, scale, trail: 0 });
}
const sparks = [];
function burstAt(p, color, n, spd, grav = 4) { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.5), transparent: true }); for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 5, 4), m); s.position.copy(p); scene.add(s); fx.push(s); sparks.push({ m: s, v: new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).normalize().multiplyScalar(spd * (2 + Math.random() * 6)), life: 0.4 + Math.random() * 0.5, g: grav }); } }
function explode(p, radius, dmgFn) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: '#ffb040', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); s.position.copy(p); scene.add(s); fx.push(s);
  blasts.push({ m: s, r: radius, life: 0.4, t: 0 }); burstAt(p, '#ff8a2a', 50, 1.2); SFX('explode', p); shake = Math.max(shake, 0.25);
  for (const m of mobs) if (!m.dead && m.g.position.distanceTo(p) < radius + 0.6) dmgFn(m);
}

// ---------------- mobs ----------------
const LVL_COL = (d) => (d >= 5 ? '#ff3a3a' : d >= 3 ? '#ff8a3a' : d >= -2 ? '#f4eedc' : '#8a8a8a');
const MS = createMobSystem({ scene, fx, col, P, makeBar,
  playerSafe: () => inSafe(), truce: (camp) => STORY.truceOn(camp), hitPlayer, kill: (m) => killMob(m), hurt: (m, d, b) => hurtMob(m, d, b),
  burst: (...a) => burstAt(...a), shake: (v) => { shake = Math.max(shake, v); }, banner: (...a) => ui.banner(...a),
  bark: (m, txt) => { floatText(m.g.position.clone().setY(2.2 * m.bodyScale + 0.3), txt, 'bark', 2.6); AU.say(txt, m.kind, m.g.position, { seed: m.spawnSpec.variant || 0, max: 8 }); },
  floatText: (p, t, c) => floatText(p, t, c), zoneTick: (d) => { state.hp -= d; },
  sfx: (n, p) => SFX(n, p), onBossAggro: (m) => { activeBoss = m; ui.banner(m.def.name.toUpperCase(), '#E5484D'); MUSIC('boss'); }, onBossReset: (m) => { if (activeBoss === m) activeBoss = null; MUSIC('explore'); } });
const mobs = MS.mobs;
let activeBoss = null;
const SFX = (n, p) => AU.play(n, p); const MUSIC = (m) => AU.setMood(m);
function spawnMobs(list) { for (const s of list) MS.spawn(s); }
function makeBar() { const el = document.createElement('div'); el.className = 'mbar'; el.innerHTML = '<div class="mn"></div><div class="mb"><i></i></div>'; $('hud').appendChild(el); return el; }
const dmgNums = [];
function dmgNumber(p, txt, cls = '') { floatText(p, txt, cls); }
function floatText(p, txt, cls = '', dur = 0.9) { const el = document.createElement('div'); el.className = 'dn ' + cls; el.textContent = txt; $('hud').appendChild(el); dmgNums.push({ el, p: p.clone(), t: 0, dur, rise: cls === 'bark' ? 0.15 : 1.2 }); }
// level difference: fighting above your level hurts, below it is easy
const lvlDiff = (m) => m.lvl - state.level;
function hurtMob(m, dmg, burnSec = 0) {
  if (m.dead) return; const D = derived(); const crit = Math.random() * 100 < D.crit || m.state === 'stagger'; const diff = lvlDiff(m);
  const mult = Math.max(0.35, Math.min(1.3, 1 - diff * 0.08)) * (m.state === 'stagger' ? 1.5 : 1);
  const d = Math.max(1, Math.round(dmg * mult * (crit ? 1.8 : 1) * (0.9 + Math.random() * 0.2)));
  if (m.camp && STORY.truceOn(m.camp)) STORY.breakTruce(m.camp);
  m.hp -= d; m.flash = 0.12; MS.aggro(m); dmgNumber(m.g.position.clone().add(new THREE.Vector3(0, 2.0 * m.bodyScale, 0)), (crit ? 'CRIT ' : '') + d, crit ? 'crit' : '');
  SFX('hit', m.g.position);
  if (burnSec > 0) { if (m.burn <= 0) state.counters.burned++; m.burn = Math.max(m.burn, burnSec); m.burnDps = Math.max(m.burnDps, (4 + effLevel('firebolt') * 0.8) * mult); }
  if (m.hp <= 0) killMob(m); checkAch();
}
// the player's defence: F = parry (tap, 0.35 s window) / block (hold), V = dodge (i-frames)
const DEF = { parryT: -9, blockHeld: false, dodgeT: -9, dodgeDir: new THREE.Vector3(), knock: new THREE.Vector3(), parryCd: 0 };
function hitPlayer(raw, m, opts = {}) {
  const now = performance.now() / 1000; const D = derived();
  if (now - DEF.dodgeT < 0.35) { floatText(P.pos.clone().add(new THREE.Vector3(0, 1.6, 0)).add(fwdVec().multiplyScalar(0.9)), 'DODGED', 'parry'); return 'dodged'; }
  if (opts.kind !== 'aoe' && now - DEF.parryT < 0.35) { state.counters.parries = (state.counters.parries || 0) + 1; floatText(P.pos.clone().add(new THREE.Vector3(0, 1.6, 0)).add(fwdVec().multiplyScalar(0.9)), 'PARRIED!', 'parry'); SFX('parry', P.pos); shake = Math.max(shake, 0.1); state.mana = Math.min(D.maxMana, state.mana + 6); DEF.parryCd = 0; if (state.counters.parries === 1) ui.host('A parry! With your hand! On fire! The crowd goes absolutely mild.'); return 'parried'; }
  const diff = lvlDiff(m); let dmg = raw * Math.max(0.6, 1 + diff * 0.12) * (1 - Math.min(0.6, D.armor / 200));
  let blocked = false; if (DEF.blockHeld && opts.kind !== 'aoe' && state.stamina > 5) { dmg *= 0.35; state.stamina = Math.max(0, state.stamina - 18); blocked = true; SFX('block', P.pos); }
  if (state.ward > 0) { const a = Math.min(state.ward, dmg); state.ward -= a; dmg -= a; state.counters.wardAbsorb += a; }
  state.hp -= dmg; shake = Math.max(shake, opts.kind === 'aoe' ? 0.35 : 0.15);
  if (opts.knock && m) { const k = P.pos.clone().sub(m.g.position).setY(0).normalize().multiplyScalar(opts.knock); DEF.knock.copy(k); }
  if (dmg > 0) { dmgNumber(P.pos.clone().add(new THREE.Vector3(0, 1.4, 0)).add(fwdVec().multiplyScalar(0.8)), (blocked ? 'BLOCK -' : '-') + Math.round(dmg), 'hurt'); $('vign').style.opacity = 0.7; SFX('hurt', P.pos); }
  return blocked ? 'blocked' : 'hit';
}
const drops = [];
function killMob(m) {
  m.dead = true; m.hp = 0; MS.endAct(m); if (m.bar) { m.bar.remove(); m.bar = null; } state.counters.kills++; SFX('death', m.g.position, m);
  const diff = lvlDiff(m); const xpMul = diff <= -6 ? 0.1 : diff < 0 ? 1 + diff * 0.12 : 1 + diff * 0.15; gainXP(Math.round((m.def.xp + m.lvl * 6) * Math.max(0.1, xpMul) * (m.summoned ? 0.3 : 1))); state.gold += (m.def.boss ? 120 : 2) + Math.floor(Math.random() * 6) * m.lvl;
  STORY.Q.event('kill', m); if (m.def.boss) { STORY.Q.event('boss', m.kind); state.flags[m.kind + '_handled'] = true; if (m.kind === 'pylon') state.flags.pylon_handled = true; bossDown(m); } else if (m.camp) campCheck(m.camp);
  if (state.counters.kills === 1) ui.host('Your first kill on camera! Our legal team has been notified.');
  // loot pouch with 1-2 items
  const items = [makeItem(rng, { level: m.lvl, minRarity: m.def.boss ? 3 : m.def.elite ? 2 : 0 })]; if (m.def.boss) { items.push(makeItem(rng, { level: m.lvl + 1, minRarity: 3 }), makeItem(rng, { level: m.lvl, minRarity: 2 }), { uid: Math.floor(Math.random() * 1e9), kind: 'box', box: 'boss', name: 'Boss Box', rarity: 'epic', host: 'You killed a boss. Here is a box. Inside the box: more boxes? No. Loot.' }); } const matDrop = m.kind === 'wight' || m.kind === 'ebb' ? { bonedust: 2, cloth: 2, dirtywater: 1, frost: Math.random() < 0.3 ? 1 : 0 } : { coneplastic: 1 + (Math.random() < 0.5 ? 1 : 0), gristle: 2, hide: 1, scrapmetal: 1, ember: Math.random() < 0.25 ? 1 : 0, sulphur: Math.random() < 0.4 ? 1 : 0 }; items.push({ kind: 'mat', mats: matDrop, rarity: 'common', name: 'Materials' }); if (Math.random() < 0.5) items.push(makeItem(rng, { level: m.lvl })); if (Math.random() < 0.35) items.push({ ...CONSUMABLES[Math.floor(Math.random() * CONSUMABLES.length)], uid: Math.floor(Math.random() * 1e9), rarity: 'common' });
  const best = items.filter((i) => i.kind !== 'mat').reduce((b, i) => (['junk', 'common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(i.rarity) > ['junk', 'common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(b.rarity) ? i : b), items.find((i) => i.kind !== 'mat'));
  const colr = { junk: '#9a9a9a', common: '#f4eedc', uncommon: '#5ad86a', rare: '#4a9aff', epic: '#b46cff', legendary: '#ff9a2a' }[best.rarity];
  const pouch = new THREE.Group(); const bag = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), new THREE.MeshPhysicalMaterial({ color: '#7a5a3a', roughness: 0.8 })); bag.scale.y = 0.8; pouch.add(bag);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.2, 3, 10, 1, true), new THREE.MeshBasicMaterial({ color: colr, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 1.5; pouch.add(beam); fx.push(beam);
  pouch.position.copy(m.g.position).setY(0.15); scene.add(pouch); drops.push({ g: pouch, items, colr });
}
function bossDown(m) {
  ui.banner(`${m.def.name.toUpperCase()} DEFEATED`, '#F5C518'); SFX('victory', P.pos); MUSIC('explore'); activeBoss = null;
  ui.host({ pylon: 'Sergeant Pylon is down! Somebody tell the cones. Actually, don\u2019t. They\u2019ll riot.', ebb: 'Head Custodian Ebb has clocked out. Permanently. Spin City is a little drier tonight.', bulbQueen: 'The Bulb Queen is out! Lights out! Somebody find the switch!', coo: 'Old Man Coo has flown the coop. Permanently. Get it? The writers are very tired.', coneKing: 'THE CONE KING IS DEAD! Long live… nobody. The cones are leaderless. Chaos. Beautiful chaos.' }[m.kind] || 'A boss is dead! Sponsors are thrilled. Mostly about the explosions.');
  state.inv.push({ uid: Math.floor(Math.random() * 1e9), kind: 'consumable', name: `District Map: ${world.map.pois.find((p) => p.boss === m.kind)?.name || 'Unknown'}`, rarity: 'rare', effect: { map: 1 }, host: 'A map of this district, with everything still alive on it. Mostly.' });
  ui.toast(`<div class="ta">BOSS LOOT</div>District Map + Boss Box dropped<div class="sm">Pick up the pouch (E)</div>`, '#F5C518', 4500);
  if (m.camp) { state.conquered[m.camp] = true; setTimeout(() => campCheck(m.camp), 400); }
  state.ach['boss_' + m.kind] = true; saveGame();
}
function campCheck(camp) {
  const left = mobs.filter((o) => o.camp === camp && !o.dead && !o.summoned).length; const poi = world.map.pois.find((p) => p.camp === camp);
  if (left === 0 && poi && !state.ach['camp_' + camp]) { state.ach['camp_' + camp] = true; state.conquered[camp] = true; ui.banner(`ENCAMPMENT CONQUERED: ${poi.name.toUpperCase()}`, '#7BE38A'); gainXP(300); state.inv.push({ uid: Math.floor(Math.random() * 1e9), kind: 'box', box: 'gold', name: 'Gold Box', rarity: 'epic', host: 'Conquest bonus. The camp is yours. Please do not move in, the cones smell.' }); ui.toast('<div class="ta">CONQUEST</div>Gold Box added to your inventory', '#F5C518', 4000); }
  else if (poi && left > 0 && left <= 3) ui.toast(`${poi.name}: ${left} defender${left > 1 ? 's' : ''} left`, '#ff7a3a', 1800);
}
function use() {
  const n = NPCS.nearest(P, 2.8); if (n) { if (n.kind === 'filler') { const L = FILLER_POOL(n); fillerSay(n, L, 1); n.talking = 2.5; } else if (!STORY.open(n)) fillerSay(n, 'Hm?', 1); return; }
  if (world.stairs && Math.hypot(P.pos.x - world.stairs.x, P.pos.z - world.stairs.z) < world.stairs.r) { if (state.flags && state.flags[world.stairs.flag] && world.stairs.to === '4') ui.toast('Floor 4 (The Endless Mall) is still being built by the network. You cleared Floor 3!', '#F5C518', 4000); else if (state.flags && state.flags[world.stairs.flag]) { SFX('door'); state.lastFloor = world.stairs.to; saveGame(); ui.banner(`DESCENDING TO FLOOR ${world.stairs.to}`, '#F5C518'); setTimeout(() => goFloor(world.stairs.to), 900); } else ui.toast(world.stairs.locked, '#E5484D', 3000); return; }
  const si = nearSlot(); if (si >= 0) return useSlot(si); interact();
}
const FILLER_POOL = (n) => { const L = FILLER_LINES[n.role] || FILLER_LINES.gossip; return L[Math.floor(Math.random() * L.length)]; };
function fillerSay(n, line, vol) { floatText(n.g.position.clone().setY(2.0 * n.baseScale + 0.35), line, 'bark', 3.2); AU.say(line, n.voice || 'villager', n.g.position, { seed: n.variant || 0, max: 14 }); }
function interact() {
  let best = null, bd = 2.2; for (const d of drops) { const dd = d.g.position.distanceTo(P.pos.clone().setY(0.15)); if (dd < bd) { bd = dd; best = d; } }
  if (!best) return; for (const it of best.items) { if (it.kind === 'mat') { const got = Object.entries(it.mats).filter(([, n]) => n > 0); got.forEach(([mm, n]) => { state.mats[mm] = (state.mats[mm] || 0) + n; }); ui.toast(`<span class="sm">${got.map(([mm, n]) => `+${n} ${MATS[mm]}`).join(' · ')}</span>`, '#3a3448', 2400); continue; } if (state.inv.length >= state.invCap) { ui.toast('Inventory full! Scrap some junk (I).', '#E5484D'); break; } state.inv.push(it); ui.toast(`<span style="color:${{ junk: '#9a9a9a', common: '#f4eedc', uncommon: '#5ad86a', rare: '#4a9aff', epic: '#b46cff', legendary: '#ff9a2a' }[it.rarity] || '#fff'}">${it.name}</span>`, '#3a3448', 2200); }
  scene.remove(best.g); drops.splice(drops.indexOf(best), 1); SFX('pickup');
}

// ---------------- map ----------------
const visited = new Set(); const VCELL = 12;
function drawMap(cv, big = false) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height, S = world.size, m = world.map;
  const scale = big ? Math.min(W, H) / S : 2.2; const cx = big ? W / 2 : W / 2 - P.pos.x * scale, cz = big ? H / 2 : H / 2 - P.pos.z * scale;
  const X = (x) => (big ? cx + x * scale : cx + x * scale), Z = (z) => (big ? cz + z * scale : cz + z * scale);
  c.fillStyle = '#14101a'; c.fillRect(0, 0, W, H);
  if (!big) { c.save(); c.translate(W / 2, H / 2); c.rotate(P.yaw); c.translate(-W / 2, -H / 2); }
  c.fillStyle = '#2a4a5a'; for (const [x, z, rx, rz] of m.water) { c.beginPath(); c.ellipse(X(x), Z(z), rx * scale, rz * scale, 0, 0, 7); c.fill(); }
  c.fillStyle = '#5a5060'; for (const [x, z] of m.pillars) c.fillRect(X(x) - 1, Z(z) - 1, 2.2, 2.2);
  c.fillStyle = '#6a4a4a'; for (const [x, z] of m.cars) c.fillRect(X(x) - 1.5, Z(z) - 3, 3, 6);
  for (const p of m.pois) { if (p.kind === 'secret' && !state.discovered.has(p.name)) continue; const known = state.discovered.has(p.name) || p.safe; const conq = p.camp && state.conquered[p.camp];
    if (p.safe) { c.fillStyle = 'rgba(90,216,106,0.18)'; c.beginPath(); c.arc(X(p.x), Z(p.z), p.r * scale, 0, 7); c.fill(); }
    if (p.kind === 'camp' && known && !conq) { c.fillStyle = 'rgba(229,72,77,0.16)'; c.beginPath(); c.arc(X(p.x), Z(p.z), p.r * scale, 0, 7); c.fill(); }
    c.strokeStyle = !known ? '#4a4058' : p.safe ? '#5ad86a' : p.kind === 'camp' ? (conq ? '#9a9a9a' : '#ff5a3a') : '#7BE38A'; c.lineWidth = p.safe ? 3 : 2; c.setLineDash(p.kind === 'camp' && !conq ? [6, 4] : []); c.beginPath(); c.arc(X(p.x), Z(p.z), Math.max(5, p.r * scale * (big ? 1 : 0.4)), 0, 7); c.stroke(); c.setLineDash([]);
    if (p.safe) { c.save(); c.translate(X(p.x), Z(p.z)); if (!big) c.rotate(-P.yaw); const k = big ? 1.4 : 0.8; c.fillStyle = '#5ad86a'; c.strokeStyle = '#0d0b12'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -10 * k); c.lineTo(8 * k, -6 * k); c.lineTo(7 * k, 3 * k); c.lineTo(0, 10 * k); c.lineTo(-7 * k, 3 * k); c.lineTo(-8 * k, -6 * k); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    if (p.kind === 'camp' && known && big) { c.fillStyle = conq ? '#9a9a9a' : '#ff5a3a'; c.font = 'bold 22px Bangers'; c.textAlign = 'center'; c.fillText(conq ? '✓' : '☠', X(p.x), Z(p.z) + 8); }
    if (big && known) { c.fillStyle = p.safe ? '#7BE38A' : '#F4EEDC'; c.font = 'bold 14px Barlow Condensed'; c.textAlign = 'center'; c.fillText(p.name.toUpperCase() + (p.safe ? ' · SAFE ZONE' : p.kind === 'camp' ? (conq ? ' · CONQUERED' : ` · ENCAMPMENT LV ${p.level || '?'}`) : ''), X(p.x), Z(p.z) - p.r * scale - 6); } }
  for (const mb of mobs) if (!mb.dead && mb.g.position.distanceTo(P.pos) < (big ? 60 : 45)) { const r = mb.def.boss ? 5 : mb.def.elite ? 3 : 2; c.fillStyle = mb.def.boss ? '#ff2a2a' : mb.def.elite ? '#ffb040' : '#E5484D'; c.fillRect(X(mb.g.position.x) - r, Z(mb.g.position.z) - r, r * 2, r * 2); }
  for (const d of drops) { c.fillStyle = d.colr; c.fillRect(X(d.g.position.x) - 2, Z(d.g.position.z) - 2, 4, 4); }
  if (big) { c.fillStyle = 'rgba(13,11,18,0.9)'; const cs = VCELL * scale; for (let gx = -S / 2; gx < S / 2; gx += VCELL) for (let gz = -S / 2; gz < S / 2; gz += VCELL) if (!visited.has(`${Math.floor(gx / VCELL)},${Math.floor(gz / VCELL)}`)) c.fillRect(X(gx), Z(gz), cs + 0.5, cs + 0.5); }
  if (big) for (const p of m.pois.filter((q) => q.safe)) { c.strokeStyle = '#5ad86a'; c.lineWidth = 3; c.beginPath(); c.arc(X(p.x), Z(p.z), p.r * scale, 0, 7); c.stroke(); c.fillStyle = '#7BE38A'; c.font = 'bold 14px Barlow Condensed'; c.textAlign = 'center'; c.fillText(p.name.toUpperCase() + ' · SAFE ZONE', X(p.x), Z(p.z) - p.r * scale - 6); c.save(); c.translate(X(p.x), Z(p.z)); c.fillStyle = '#5ad86a'; c.strokeStyle = '#0d0b12'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -14); c.lineTo(11, -8); c.lineTo(10, 4); c.lineTo(0, 14); c.lineTo(-10, 4); c.lineTo(-11, -8); c.closePath(); c.fill(); c.stroke(); c.restore(); }
  if (!big) c.restore();
  const px = big ? X(P.pos.x) : W / 2, pz = big ? Z(P.pos.z) : H / 2; c.save(); c.translate(px, pz); c.rotate(big ? -P.yaw : 0); c.fillStyle = '#3FD0E0'; c.strokeStyle = '#0D0B12'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -9); c.lineTo(6, 7); c.lineTo(0, 3); c.lineTo(-6, 7); c.closePath(); c.fill(); c.stroke(); c.restore();
  if (big) { c.fillStyle = '#F5C518'; c.font = 'bold 22px Bangers'; c.textAlign = 'left'; c.fillText(world.name, 16, 32); c.fillStyle = '#d9d2bf'; c.font = '15px Barlow Condensed'; c.fillText(`${state.discovered.size}/${m.pois.length} places discovered · green shield = safe zone · red dashed = encampment · fog clears as you explore · this chunk is 360 m across (the full floor is about 2 km)`, 16, 54); }
}

// ---------------- loop ----------------
let saveT = 0, musicT = 0; const FAST = QS.has('fast'); let fastN = 0; let started = false, shake = 0, lastPOI = null, lowHpT = 0;
const v3 = new THREE.Vector3();
function project(p) { v3.copy(p).project(camera); return [(v3.x * 0.5 + 0.5) * window.innerWidth, (-v3.y * 0.5 + 0.5) * window.innerHeight, v3.z]; }
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = now / 1000;
  const D = derived(); const paused = ui.isOpen() || STORY.isOpen();
  if (started && !paused) {
    // movement
    const fwd = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw)), right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const wish = new THREE.Vector3(); if (keys.KeyW || keys.ArrowUp) wish.add(fwd); if (keys.KeyS || keys.ArrowDown) wish.sub(fwd); if (keys.KeyD || keys.ArrowRight) wish.add(right); if (keys.KeyA || keys.ArrowLeft) wish.sub(right);
    const sprint = (keys.ShiftLeft || keys.ShiftRight) && state.stamina > 1 && wish.lengthSq() > 0;
    const speed = (sprint ? 8.5 : 5.0) * (1 + D.moveSpeed / 100) * (state.hunger < 10 ? 0.8 : 1) * (DEF.blockHeld ? 0.5 : 1) * (MS.playerInZone() ? 0.55 : 1);
    if (wish.lengthSq()) wish.normalize().multiplyScalar(speed);
    P.vel.x += (wish.x - P.vel.x) * Math.min(1, dt * 12); P.vel.z += (wish.z - P.vel.z) * Math.min(1, dt * 12);
    P.vel.y -= 14 * dt;
    const before = P.pos.clone();
    P.pos.addScaledVector(P.vel, dt); const sinceDodge = t - DEF.dodgeT; if (sinceDodge < 0.25) P.pos.addScaledVector(DEF.dodgeDir, 16 * dt); if (DEF.knock.lengthSq() > 0.01) { P.pos.addScaledVector(DEF.knock, dt); DEF.knock.multiplyScalar(Math.max(0, 1 - dt * 6)); }
    if (P.pos.y <= 0) { P.pos.y = 0; P.vel.y = 0; P.onGround = true; }
    col.resolve(P.pos, 0.4, P.pos.y); const h = world.size / 2 - 1; P.pos.x = Math.max(-h, Math.min(h, P.pos.x)); P.pos.z = Math.max(-h, Math.min(h, P.pos.z));
    const moved = Math.hypot(P.pos.x - before.x, P.pos.z - before.z); state.counters.walked += moved; const pb = P.bob; P.bob += moved * 2.2; if (P.onGround && Math.floor(P.bob / Math.PI) !== Math.floor(pb / Math.PI)) SFX('step');
    AU.setListener(P.pos.x, P.pos.z, P.yaw); musicT -= dt; const fighting = mobs.some((m) => !m.dead && (m.state === 'chase' || m.state === 'attack') && m.g.position.distanceTo(P.pos) < 28); if (fighting) musicT = 4; MUSIC(activeBoss ? 'boss' : musicT > 0 ? 'combat' : inSafe() ? 'town' : 'explore');
    state.stamina = Math.max(0, Math.min(D.maxStamina, state.stamina + (sprint ? -22 : 14) * dt));
    // vitals
    state.mana = Math.min(D.maxMana, state.mana + D.manaRegen * dt);
    state.hunger = Math.max(0, state.hunger - dt * 0.08); state.thirst = Math.max(0, state.thirst - dt * 0.11);
    if (state.thirst <= 0 || state.hunger <= 0) state.hp -= dt * 1.5;
    for (const k in cds) cds[k] = Math.max(0, cds[k] - dt);
    if (state.hp < D.maxHp * 0.15 && state.hp > 0) { lowHpT += dt; if (lowHpT > 1) award('closeCall'); }
    if (state.hp <= 0) { state.hp = D.maxHp * 0.5; P.pos.set(...world.spawn); ui.banner('YOU DIED', '#E5484D'); ui.host('You died! Don’t worry, our revival sponsor has you covered. This time.'); MS.clearAll(); mobs.forEach((m) => { if (!m.dead) { m.state = 'idle'; m.hp = m.maxHp; m.g.position.copy(m.home); } }); activeBoss = null; }
    // discovery + fog
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) visited.add(`${Math.floor(P.pos.x / VCELL) + dx},${Math.floor(P.pos.z / VCELL) + dz}`);
    let inPOI = null; for (const p of world.map.pois) if (Math.hypot(P.pos.x - p.x, P.pos.z - p.z) < p.r) { inPOI = p; if (!state.discovered.has(p.name)) { state.discovered.add(p.name); ui.banner(`DISCOVERED: ${p.name.toUpperCase()}`, '#7BE38A'); gainXP(40); if (p.name === 'The Exit Sign') award('exit'); if (p.kind === 'secret') { state.flags['unnamed_' + FLOOR] = true; ui.host('Those scratches on the wall? We… did not put those there. Moving on!'); } } }
    if (inPOI !== lastPOI) { if (inPOI) STORY.Q.event('visit', inPOI.name); lastPOI = inPOI; $('loc').textContent = inPOI ? inPOI.name.toUpperCase() : world.name; $('safe').style.display = inPOI && inPOI.safe ? 'inline-block' : 'none'; }
    checkAch();
  }
  // camera
  const bob = P.onGround ? Math.sin(P.bob) * 0.035 : 0;
  camera.position.set(P.pos.x, P.pos.y + 1.7 + bob, P.pos.z);
  camera.rotation.set(0, 0, 0, 'YXZ'); camera.rotation.y = P.yaw; camera.rotation.x = P.pitch;
  if (shake > 0) { camera.position.x += (Math.random() - 0.5) * shake * 0.3; camera.position.y += (Math.random() - 0.5) * shake * 0.3; shake = Math.max(0, shake - dt * 1.5); }
  camera.updateMatrixWorld();
  // hand + ward
  castAnim = Math.max(0, castAnim - dt); const blk = DEF.blockHeld ? 1 : 0, par = Math.max(0, 1 - (t - DEF.parryT) / 0.35); handFlame.position.set(0.32 - blk * 0.3, -0.3 - (P.onGround ? Math.abs(Math.sin(P.bob)) * 0.015 : 0) + castAnim * 0.3 + blk * 0.18, -0.6 - castAnim * 0.6 + par * 0.15); parryRing.visible = blk > 0 || par > 0; parryRing.material.opacity = 0.25 + par * 0.6; parryRing.scale.setScalar(1 + par * 0.4); palmFire.scale.setScalar(1 + Math.sin(t * 20) * 0.15 + castAnim * 3);
  wardBubble.visible = state.ward > 0; wardBubble.material.opacity = 0.08 + Math.sin(t * 6) * 0.03;
  if (!paused) {
    // projectiles
    let li = 0;
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const pr = projectiles[i]; pr.life -= dt; pr.m.position.addScaledVector(pr.v, dt); if (pr.kind === 'fireball') pr.v.y -= 2 * dt;
      if (li < 3) { boltLights[li].position.copy(pr.m.position); boltLights[li].intensity = pr.kind === 'fireball' ? 14 : 6; li++; }
      pr.trail += dt; if (pr.trail > 0.03) { pr.trail = 0; burstAt(pr.m.position, '#ff8a2a', 1, 0.15, -1); }
      let hit = null; for (const m of mobs) if (!m.dead && m.g.position.clone().setY(1.1 * m.bodyScale).distanceTo(pr.m.position) < 0.75 * Math.max(1, m.bodyScale * 0.8)) { hit = m; break; }
      const q = pr.m.position.clone(); col.resolve(q, 0.05, pr.m.position.y); const wall = q.distanceToSquared(pr.m.position) > 1e-6 || pr.m.position.y < 0.05 || pr.m.position.y > world.ceiling - 0.1;
      if (hit || wall || pr.life <= 0) {
        if (pr.kind === 'fireball') explode(pr.m.position, 3.2 + (state.skills.fireball.ups[0] === 0 ? 1.2 : 0), (m) => hurtMob(m, spellDamage('fireball'), 3));
        else { if (hit) hurtMob(hit, spellDamage('firebolt') * pr.scale, state.skills.firebolt.ups[0] === 1 ? 4 : 2); burstAt(pr.m.position, '#ffb040', 14, 0.6); }
        scene.remove(pr.m); projectiles.splice(i, 1);
      }
    }
    for (; li < 3; li++) boltLights[li].intensity = 0;
    for (let i = blasts.length - 1; i >= 0; i--) { const b = blasts[i]; b.t += dt; b.m.scale.setScalar(0.3 + (b.t / b.life) * b.r); b.m.material.opacity = 0.8 * (1 - b.t / b.life); if (b.t >= b.life) { scene.remove(b.m); blasts.splice(i, 1); } }
    for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life -= dt; s.v.y -= s.g * dt; s.m.position.addScaledVector(s.v, dt); if (s.life <= 0) { scene.remove(s.m); sparks.splice(i, 1); } }
    // mobs
    if (!window.__freeze) MS.update(dt, t, state.level);
    NPCS.update(dt, t, P, (n, line, v) => fillerSay(n, line, v)); NPCS.pushPlayer(P);
    for (const n of NPCS.npcs) { const qm = n.kind !== 'filler' ? STORY.hasQuestFor(n.id) : null; const d = n.g.position.distanceTo(P.pos); const [sx, sy, sz] = project(n.g.position.clone().setY(2.1 * n.baseScale + 0.4)); if (!n.mark) { n.mark = document.createElement('div'); n.mark.className = 'qmark'; $('hud').appendChild(n.mark); n.label = document.createElement('div'); n.label.className = 'npcName'; $('hud').appendChild(n.label); }
      const vis = sz < 1 && d < 30; n.mark.style.display = vis && qm ? 'block' : 'none'; if (vis && qm) { n.mark.textContent = qm; n.mark.classList.toggle('ready', qm === '?'); n.mark.style.transform = `translate(${sx - 8}px, ${sy - 52 + Math.sin(t * 3) * 4}px)`; }
      const lv = sz < 1 && d < (n.kind === 'filler' ? 7 : 14); n.label.style.display = lv ? 'block' : 'none'; if (lv) { n.label.textContent = n.title ? `${n.name} · ${n.title}` : n.name; n.label.style.transform = `translate(${sx - n.label.offsetWidth / 2}px, ${sy - 10}px)`; } }
    for (const m of mobs) { if (m.dead || !m.bar) continue; const g = m.g; const dist = g.position.distanceTo(P.pos);
      const [sx, sy, sz] = project(g.position.clone().setY(2.3 * m.bodyScale)); const show = sz < 1 && dist < 30 && (m.state !== 'idle' || m.hp < m.maxHp || dist < 12);
      m.bar.style.display = show ? 'block' : 'none'; if (show) { const d = lvlDiff(m); m.bar.style.transform = `translate(${sx - 50}px, ${sy - 20}px)`; const mn = m.bar.querySelector('.mn'); mn.innerHTML = `${m.name} · <span style="color:${LVL_COL(d)}">Lv ${m.lvl}</span>${m.burn > 0 ? ' · BURNING' : ''}${m.state === 'stagger' ? ' · STAGGERED' : ''}`; m.bar.querySelector('i').style.width = (m.hp / m.maxHp) * 100 + '%'; m.bar.classList.toggle('elite', !!m.def.elite); } }
    // boss bar
    if (activeBoss && (activeBoss.dead || activeBoss.state === 'idle')) { activeBoss = activeBoss.dead ? null : activeBoss.state === 'idle' ? null : activeBoss; }
    $('bossBar').style.display = activeBoss ? 'block' : 'none'; if (activeBoss) { $('bossName').textContent = `${activeBoss.def.name.toUpperCase()} · LV ${activeBoss.lvl}`; $('bossTitle').textContent = activeBoss.def.title + (activeBoss.enraged ? ' · ENRAGED' : ''); $('bossFill').style.width = (activeBoss.hp / activeBoss.maxHp) * 100 + '%'; }
    // drop bobbing + prompt
    let near = false; for (const d of drops) { d.g.children[0].position.y = Math.sin(t * 3) * 0.05; if (d.g.position.distanceTo(P.pos.clone().setY(0.15)) < 2.2) near = true; }
    const si = nearSlot(), nn = NPCS.nearest(P, 2.8), st = world.stairs && Math.hypot(P.pos.x - world.stairs.x, P.pos.z - world.stairs.z) < world.stairs.r;
    let pr = null; if (nn) pr = `<b>[E]</b> ${nn.kind === 'filler' ? 'Chat with' : 'Talk to'} ${nn.name}`; else if (st) pr = `<b>[E]</b> ${state.flags && state.flags[world.stairs.flag] ? `Descend to Floor ${world.stairs.to}` : 'Stairwell door (locked)'}`; else if (si >= 0) { const tid = Object.keys(state.tables).find((k) => state.tables[k].slot === si); pr = tid ? `<b>[E]</b> Use ${TABLES[tid].name}` : `<b>[E]</b> Empty slot ${si + 1}: install a table`; } else if (near) pr = '<b>[E]</b> Pick up';
    $('prompt').innerHTML = pr || ''; $('prompt').style.display = pr ? 'block' : 'none';
    tickThrowables(dt); tickTurrets(dt); saveT += dt; if (saveT > 5) { saveT = 0; saveGame(); }
    if (state.ward <= 0) state.ward = 0;
    world.tick(t);
  }
  // floating numbers
  for (let i = dmgNums.length - 1; i >= 0; i--) { const d = dmgNums[i]; d.t += dt; const [x, y, z] = project(d.p.clone().add(new THREE.Vector3(0, d.t * d.rise, 0))); d.el.style.transform = `translate(${x - (d.el.offsetWidth >> 1)}px, ${y}px)`; d.el.style.opacity = z < 1 ? Math.max(0, Math.min(1, (d.dur - d.t) / 0.3)) : 0; if (d.t > d.dur) { d.el.remove(); dmgNums.splice(i, 1); } }
  $('vign').style.opacity = Math.max(0, parseFloat($('vign').style.opacity || 0) - dt * 2);
  $('compass').style.backgroundPositionX = `${(P.yaw / (Math.PI * 2)) * 720}px`;
  ui.hud(D); if (started) drawMap($('mini'));
  if (!FAST || (++fastN % 12) === 0) ink.render();
  requestAnimationFrame(frame);
}
const fwdVec = () => new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));

// ---------------- boot ----------------
async function boot() {
  const setP = (p, msg) => { $('loadBar').style.width = Math.round(p * 100) + '%'; if (msg) $('loadMsg').textContent = msg; };
  await new Promise((r) => setTimeout(r, 50));
  const mod = FLOOR === 'pad' ? await import('../worlds/crashpad.js') : FLOOR === '3' ? await import('../worlds/floor3.js') : FLOOR === '2' ? await import('../worlds/floor2.js') : await import('../worlds/floor1.js');
  const def = FLOOR === 'pad' ? mod.CRASHPAD : FLOOR === '3' ? mod.FLOOR3 : FLOOR === '2' ? mod.FLOOR2 : mod.FLOOR1;
  setP(0.02, 'Sculpting the floor…');
  const built = (FLOOR === 'pad' ? mod.buildCrashPad : FLOOR === '3' ? mod.buildFloor3 : FLOOR === '2' ? mod.buildFloor2 : mod.buildFloor1)(ink, col, (p) => setP(p * 0.8), state);
  world = { ...built, name: def.name, spawn: def.spawn };
  setP(0.85, 'Waking up the goblins…'); await new Promise((r) => setTimeout(r, 30));
  setP(0.88, 'Teaching goblins to walk around cars…'); await new Promise((r) => setTimeout(r, 20)); MS.buildNav(built.size);
  spawnMobs(built.mobs.filter((s) => !(s.camp && state.conquered[s.camp])));
  setP(0.93, 'Waking the townsfolk…'); await new Promise((r) => setTimeout(r, 20)); for (const n of built.npcs || []) NPCS.spawn(n);
  if (built.stairs) { const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.6), new THREE.MeshBasicMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 72; const g = c.getContext('2d'); g.fillStyle = '#0a3a12'; g.fillRect(0, 0, 256, 72); g.fillStyle = '#5aff7a'; g.font = 'bold 34px sans-serif'; g.fillText(`▼ FLOOR ${built.stairs.to}`, 30, 50); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx; })(), side: THREE.DoubleSide, color: new THREE.Color(1.6, 1.6, 1.6) })); sg.position.set(built.stairs.x, 2.8, built.stairs.z); scene.add(sg); fx.push(sg); world.stairSign = sg; }
  STORY.renderTracker();
  P.pos.set(def.spawn[0], 0, def.spawn[2]); P.yaw = def.spawnYaw;
  $('loc').textContent = world.name; setP(1, 'Ready.');
  $('startBtn').disabled = false; $('startBtn').textContent = 'CLICK TO ENTER';
  requestAnimationFrame(frame);
}
$('startBtn').addEventListener('click', () => { AU.init(); AU.setFloor(FLOOR); $('loading').style.display = 'none'; started = true; $('stage').requestPointerLock(); ui.host(FLOOR === '3' ? 'Welcome to the Soup District! Everything is delicious and one in five things is cursed. Bon appétit!' : FLOOR === 'pad' ? 'Your Crash Pad! Buy tables, craft weird things, and remember: tables next to each other can work together.' : FLOOR === '2' ? 'Welcome to Spin City! Mind the floor, it\u2019s wet. Everything is wet. Forever.' : 'Welcome back to the Undercroft, Dale! Try not to die before the commercial break.'); });
boot().catch((e) => { $('loadMsg').textContent = 'Error: ' + e.message; console.error(e); });
window.addEventListener('beforeunload', saveGame);
window.__game = { state, P, mobs, cast, ui, G, CR, craftUI, throwBomb, saveGame, MS, DEF, NPCS, STORY, AU, use, world: () => world };
