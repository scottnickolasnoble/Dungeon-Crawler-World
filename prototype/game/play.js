// Walkable floor: first-person contestant with spells, goblins, loot, stats, skills and achievements.
import * as THREE from '../node_modules/three/build/three.module.js';
import { createInk, Collision } from '../engine/ink.js';
import { createMobSystem, MOBDEFS, scaleDmg } from './mobs.js';
import { CLASSES, PRACES, skillDef, classSkills, SKILLDEFS, GUILDS, guildOf } from './classes.js';
import { createCombat } from './combat.js';
import { createAudio } from './audio.js';
import { createNPCSystem, FILLER_LINES } from './npcs.js';
import { createStory } from './story.js';
import { artImg } from './lootart.js';
import { playIntro } from './intro.js';
const AU = createAudio();
import { SKILLS, CLASS, STATS, makeItem, makeRng, openBox, BOXES, ACHIEVEMENTS, CONSUMABLES, GEAR_DROP, RARITY_MAT_DROP, RARITY_MAT } from './data.js';
import { createUI } from './ui.js';
import { createCrafting, createCraftUI, MATS, TABLES } from './crafting.js';
import { createGuide } from './guide.js';

const $ = (id) => document.getElementById(id);
const QS = new URLSearchParams(location.search); const HASH = location.hash.slice(1);
// floors are chosen by #hash (artifact pages drop query strings); ?floor= still works for local tests
const FLOOR = QS.get('floor') || (HASH === 'intro' || HASH === 'new' ? '0' : HASH === 'pad' ? 'pad' : /^floor-[0-6]$/.test(HASH) ? HASH.slice(6) : (() => { try { const o = JSON.parse(localStorage.getItem('downstairs_save_v3') || 'null'); return o ? o.lastFloor || '1' : '0'; } catch (e) { return '0'; } })());
function goFloor(f) { if (QS.get('floor')) { location.search = `?floor=${f}`; return; } location.hash = f === 'pad' ? 'pad' : `floor-${f}`; }
window.addEventListener('hashchange', () => location.reload());
const SAVE_KEY = 'downstairs_save_v3';
const rng = makeRng(Date.now() & 0xffff);
const FIRE_SKILLS = ['firebolt', 'fireball', 'flamewave', 'emberdarts', 'combust', 'heatray', 'lavapool', 'livingflame', 'inferno', 'flamestep'];

// ---------------- state ----------------
const state = {
  name: '', level: 1, xp: 0, xpNext: 0, statPoints: 0, skillPoints: 0, gold: 37, scrap: 4,
  base: { STR: 9, DEX: 9, CON: 10, INT: 8, WIS: 8, CHA: 8 }, cls: 'none', race: null, hotbar: ['flick'],
  hp: 1, mana: 1, stamina: 100, hunger: 78, thirst: 64, ward: 0, wardMax: 1,
  equip: {}, inv: [], ach: {}, counters: { walked: 0, kills: 0, burned: 0, wardAbsorb: 0, boxes: 0, parries: 0 }, conquered: {}, discovered: new Set(),
  skills: { flick: { lvl: 1, ups: [] } },
};
state.mats = { scrapmetal: 14, plastic: 6, wire: 6, rubber: 3, glass: 6, cloth: 8, coneplastic: 4, gristle: 6, hide: 3, sulphur: 5, saltpetre: 3, charcoal: 2, salt: 3, dirtywater: 6, grease: 3, herbs: 4, mushroom: 5, mysterymeat: 2, lampreymeat: 1, spring: 2, battery: 1, paper: 2, ember: 4, frost: 1, roughruby: 1 };
state.tables = { workbench: { tier: 1, slot: 2 }, still: { tier: 1, slot: 3 } }; state.tableStock = []; state.craftXP = {}; state.invCap = 48; state.buffs = []; state.gold = 520; state.lastFloor = '1';
function saveGame() { try { const o = { ...state, discovered: [...state.discovered] }; delete o.equipped; localStorage.setItem(SAVE_KEY, JSON.stringify(o)); } catch (e) {} }
function loadGame() { try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false; const o = JSON.parse(raw); Object.assign(state, o); state.discovered = new Set(o.discovered || []); return true; } catch (e) { return false; } }
const LOADED = !QS.has('newgame') && HASH !== 'new' && loadGame();
if (HASH === 'new' || HASH === 'intro') { try { history.replaceState(null, '', '#floor-0'); } catch (e) {} }
state.equipped = (it) => Object.values(state.equip).includes(it);
// Diablo-style curve: early levels come in ~10 kills, then each level takes longer (L5 ~50 kills, L10 ~100)
// what each monster drops (Math.random parts are rolled per kill); the crafting guide reads this too
function matDropTable() { return { wight: { bonedust: 2, cloth: 2, dirtywater: 1 }, ebb: { bonedust: 6, cloth: 4, frost: 2, bosscore: 1 }, lamprey: { lampreymeat: 2, gristle: 1, dirtywater: 2 }, bigSucker: { lampreymeat: 6, gristle: 4, tide: 2, bosscore: 1 }, moth: { glass: 1, light: Math.random() < 0.35 ? 1 : 0, cloth: 1 }, bulbQueen: { glass: 6, light: 4, bosscore: 1 }, pigeon: { gristle: 1, cloth: 1, hide: 1 }, coo: { gristle: 4, cloth: 4, bosscore: 1 }, mimic: { scrapmetal: 2, battery: 1, spring: Math.random() < 0.5 ? 1 : 0, wire: 1 }, pylon: { coneplastic: 8, scrapmetal: 4, bosscore: 1 }, coneKing: { coneplastic: 12, alloy: 2, bosscore: 2 } }; }
// floor-themed crafting materials: every kill has a 60% chance to drop one from its floor's list
const FLOOR_MATS = { 0: ['scrapmetal', 'cloth'], 1: ['coneplastic', 'hide', 'rubber', 'wire', 'sulphur', 'saltpetre', 'dirtywater', 'plastic'], 2: ['lint', 'detergent', 'cloth', 'rubber', 'dirtywater', 'grease', 'battery', 'frost'], 3: ['stock', 'castiron', 'herbs', 'salt', 'mushroom', 'roughruby', 'ember'], 4: ['neon', 'glitter', 'plastic', 'glass', 'paper', 'ink', 'battery', 'storm'], 5: ['clippings', 'ceramic', 'rubber', 'herbs', 'roughsapphire', 'light', 'tide'], 6: ['sap', 'chitin', 'herbs', 'mushroom', 'shadow', 'tide', 'roughruby'] };
const xpFor = (lv) => Math.round(80 * lv * lv + 120 * lv);
state.xpNext = xpFor(state.level);
// starting kit (new game only): no class yet, a basic weapon, a bathrobe, slippers and some supplies
const STARTER = { main: { name: 'Lead Pipe', family: 'scrap', wtype: 'blunt', stats: { dmg: 7 }, host: 'A length of pipe. The oldest weapon in the dungeon.' }, chest: { name: 'Bathrobe', family: 'silly', stats: { armor: 2, CON: 1 }, host: 'You ran out of the house in this. Respect.' }, boots: { name: 'Fuzzy Slippers', family: 'silly', stats: { moveSpeed: 3 }, host: 'Silent, warm, and absolutely not armour.' } };
if (!LOADED) { for (const [slot, b] of Object.entries(STARTER)) state.equip[slot] = { uid: 100 + slot.length, kind: 'gear', slot, rarity: 'common', level: 1, value: 4, ...b, stats: { ...b.stats } };
  state.inv.push({ ...CONSUMABLES[0], uid: 9002, rarity: 'common' }, { ...CONSUMABLES[0], uid: 9005, rarity: 'common' }, { ...CONSUMABLES[1], uid: 9003, rarity: 'common' }, { ...CONSUMABLES[3], uid: 9004, rarity: 'common' }); state.gold = 25; }
function gearTotals() { const t = {}; for (const it of Object.values(state.equip)) if (it) for (const [k, v] of Object.entries(it.stats)) t[k] = (t[k] || 0) + v; return t; }
function derived() {
  const g = gearTotals(); const now = performance.now() / 1000; for (const b of state.buffs || []) if (b.until > now) g[b.stat] = (g[b.stat] || 0) + b.amount; const S = (k) => state.base[k] + (g[k] || 0);
  return { gearStats: g, stat: S, maxHp: 60 + S('CON') * 8 + (g.hp || 0), maxMana: 40 + S('INT') * 6 + S('WIS') * 2 + (g.mana || 0), maxStamina: 80 + S('CON') * 2 + S('DEX'), manaRegen: 2 + S('WIS') * 0.35 + (g.manaRegen || 0),
    armor: g.armor || 0, spell: S('INT') * 2 + (g.spell || 0), fire: g.fire || 0, crit: 5 + Math.floor(S('DEX') / 3) + (g.crit || 0), castSpeed: g.castSpeed || 0, moveSpeed: g.moveSpeed || 0, atkSpeed: g.atkSpeed || 0, dodge: Math.min(60, (g.dodge || 0) + S('DEX') * 0.3), hpRegen: (g.hpRegen || 0) + S('CON') * 0.05, thorns: g.thorns || 0 };
}
const gearSkillBonus = (id) => { const g = gearTotals(); const d = skillDef(id); return (g['skill_' + id] || 0) + (d && d.elem === 'fire' ? g.skill_fire || 0 : 0) + (d && d.cls === state.cls ? g.skill_class || 0 : 0); };
const effLevel = (id) => (state.skills[id] ? state.skills[id].lvl + gearSkillBonus(id) : 0);
function spellDamage(id) { const d = skillDef(id); return d ? COMBAT.power(d, id) : 0; }
if (!LOADED) { const D = derived(); state.hp = D.maxHp * 0.85; state.mana = D.maxMana; }

// ---------------- scene ----------------
// graphics quality: render scale, ink outlines, view distance and sculpt detail (detail applies on the next floor load)
const GFX_PRESETS = { low: { scale: 0.6, outline: false, view: 55, sdf: 2.2, npc: 2.4 }, medium: { scale: 0.8, outline: true, view: 75, sdf: 1.5, npc: 1.6 }, high: { scale: 1, outline: true, view: 100, sdf: 1.15, npc: 1.3 } };
const GFX = (() => { try { return { preset: 'medium', fps: false, ...GFX_PRESETS.medium, ...JSON.parse(localStorage.getItem('downstairs_gfx') || '{}') }; } catch (e) { return { preset: 'medium', fps: false, ...GFX_PRESETS.medium }; } })();
const saveGfx = () => { try { localStorage.setItem('downstairs_gfx', JSON.stringify(GFX)); } catch (e) {} };
globalThis.__SDF_STEP = GFX.sdf; globalThis.__NPC_STEP = GFX.npc / GFX.sdf * 1.0; // in-game sculpt resolution
const ink = createInk($('stage'), { fov: 72 }); ink.state.outline = GFX.outline; ink.setScale(GFX.scale); globalThis.__VIEW = GFX.view;
const { scene, camera, fx } = ink;
const col = new Collision(8);
let world;
const cooldownFrac = (id) => COMBAT.cooldownFrac(id);

// ---------------- UI hooks ----------------
const G = { state, derived, gearSkillBonus, spellDamage, cooldownFrac, skillDef, classes: CLASSES, races: PRACES, onPanel: (o) => { if (o && document.pointerLockElement) document.exitPointerLock(); },
  drawMap, achProgress,
  addStat(s) { if (state.statPoints > 0) { state.base[s]++; state.statPoints--; } },
  levelSkill(id) { const k = state.skills[id]; if (k && state.skillPoints > 0 && k.lvl < 15) { k.lvl++; state.skillPoints--; if (k.lvl % 5 === 0) ui.toast(`<b>${skillDef(id).name}</b> reached Lv ${k.lvl}: choose an upgrade!`, '#b46cff'); } },
  chooseUpgrade(id, t, c) { const k = state.skills[id]; if (k && k.lvl >= (t + 1) * 5 && k.ups[t] === undefined) { k.ups[t] = c; ui.toast(`Upgrade chosen: <b>${skillDef(id).ups[t][c]}</b>`, '#b46cff'); } },
  unequip(slot) { const it = state.equip[slot]; if (!it) return; setTimeout(() => { refreshHand(); renderHotbar(); }, 0); if (state.inv.length >= state.invCap) return ui.toast('Inventory full!', '#E5484D'); delete state.equip[slot]; state.inv.push(it); clampVitals(); },
  useItem(it) {
    if (it.kind === 'gear') { setTimeout(() => { refreshHand(); renderHotbar(); }, 0); let slot = it.slot; if (slot === 'ring1' && state.equip.ring1 && !state.equip.ring2) slot = 'ring2'; const old = state.equip[slot]; state.equip[slot] = it; state.inv.splice(state.inv.indexOf(it), 1); if (old) state.inv.push(old); clampVitals(); checkAch(); }
    else if (it.kind === 'consumable' && it.effect.bomb) { ui.toast(`${it.name}: press G to throw`, '#ff8a2a', 1800); return; }
    else if (it.kind === 'consumable' && it.effect.turret) { deployTurret(it); state.inv.splice(state.inv.indexOf(it), 1); ui.close(); return; }
    else if (it.kind === 'consumable') { const D = derived(); const e = it.effect; if (e.buff) { state.buffs.push({ stat: e.buff, amount: e.amount, until: performance.now() / 1000 + e.mins * 60 }); ui.toast(`+${e.amount} ${e.buff} for ${e.mins} min`, '#5ad86a'); } if (e.bag) { state.invCap = Math.min(96, state.invCap + e.bag); ui.toast(`Inventory +${e.bag} slots (${state.invCap})`, '#c86aa8'); } if (e.scroll) { state.mana += 30; const sk = state.hotbar.find((id) => skillDef(id) && skillDef(id).kind !== 'heal') || 'flick'; setTimeout(() => cast(sk), 50); } if (e.map) { world.map.pois.forEach((p) => state.discovered.add(p.name)); for (let x = -30; x < 30; x++) for (let z = -30; z < 30; z++) visited.add(`${x},${z}`); ui.toast('The map reveals the whole area', '#F5C518'); } if (e.statPoints) { state.statPoints += e.statPoints; ui.toast(`+${e.statPoints} stat points`, '#F5C518'); } if (e.stamina) state.stamina = Math.min(D.maxStamina, state.stamina + e.stamina); if (e.recall && world.spawn) { P.pos.set(world.spawn[0], 0, world.spawn[2]); ui.banner('RECALLED TO TOWN', '#7BE38A'); } if (e.hp) state.hp = Math.min(D.maxHp, state.hp + e.hp); if (e.mana) state.mana = Math.min(D.maxMana, state.mana + e.mana); if (e.hunger) state.hunger = Math.min(100, state.hunger + e.hunger); if (e.thirst) state.thirst = Math.min(100, state.thirst + e.thirst); state.inv.splice(state.inv.indexOf(it), 1); ui.toast(`Used <b>${it.name}</b>`, '#5ad86a'); }
    else if (it.kind === 'book') { const s = skillDef(it.skill); state.inv.splice(state.inv.indexOf(it), 1); if (state.skills[s.id]) { if (state.skills[s.id].lvl < 15) state.skills[s.id].lvl++; ui.toast(`Duplicate book: <b>${s.name}</b> +1 level`, '#b46cff'); } else { state.skills[s.id] = { lvl: 1, ups: [] }; if (state.hotbar.length < 6 && s.kind !== 'passive') state.hotbar.push(s.id); renderHotbar(); ui.banner(`NEW SKILL: ${s.name.toUpperCase()}`, '#b46cff'); ui.host(`You learned ${s.name}. From a book. In a dungeon. Truly the hero we deserve.`); } }
    else if (it.kind === 'box') { state.flags.tut_box = true; setTimeout(() => STORY.Q.event('flag'), 50); state.inv.splice(state.inv.indexOf(it), 1); const items = openBox(rng, it.box, Math.max(3, state.level), bookPool()); items.forEach((x) => state.inv.push(x)); state.counters.boxes++; ui.revealBox(BOXES[it.box].name, BOXES[it.box].color, items, checkAch); const best = items.find((x) => x.rarity === 'legendary' || x.rarity === 'epic'); ui.host(best ? `Ooh, ${best.name}! The audience is jealous. I'm jealous.` : 'Unboxing! The purest form of content.'); }
  },
  scrap(it, sure = false) { const r0 = ['junk', 'common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(it.rarity);
    if (!sure && (r0 >= 3 || it.crafted)) { const col = RCOL[it.rarity] || '#fff'; return ui.confirm(`Scrap <b style="color:${col}">${it.name}</b>?<div class="sm" style="margin-top:6px">It's ${it.rarity}. You'll get materials including <b>${MATS[RARITY_MAT[it.rarity]] || 'scrap'}</b>, but the item is gone for good.</div>`, 'SCRAP IT', () => G.scrap(it, true)); }
    if (state.inv.indexOf(it) < 0) return; state.inv.splice(state.inv.indexOf(it), 1); const r = r0; state.scrap += 1 + r; state.gold += Math.round((it.value || 10) / 4); const got = { scrapmetal: 1 + r, [['plastic', 'wire', 'cloth', 'rubber', 'glass'][it.uid % 5]]: 1 + (r >> 1) }; if (r >= 3) got[['ember', 'frost', 'storm', 'light'][it.uid % 4]] = r - 2; if (it.stats && it.stats.fire) got.ember = (got.ember || 0) + 1; if (r >= 2) got[RARITY_MAT[it.rarity]] = (got[RARITY_MAT[it.rarity]] || 0) + 1 + (r === 2 && Math.random() < 0.3 ? 1 : 0); for (const [m, n] of Object.entries(got)) state.mats[m] = (state.mats[m] || 0) + n; ui.toast(`Scrapped ${it.name}<div class="sm">${Object.entries(got).map(([m, n]) => `+${n} ${MATS[m]}`).join(' · ')}</div>`, '#9a9a9a', 2200); },
  cls: () => clsDef(), skillList: () => [skillDef('flick'), ...classSkills(state.cls)].filter(Boolean), hotbarIds: () => state.hotbar,
  setHotbar(i, id) { const j = state.hotbar.indexOf(id); if (j >= 0) state.hotbar.splice(j, 1); state.hotbar.splice(Math.min(i, state.hotbar.length), 0, id); state.hotbar = state.hotbar.slice(0, 6); renderHotbar(); },
  chooseClass(cls, race) { const C = CLASSES[cls], R = PRACES[race]; if (!C || !R || state.cls !== 'none') return; state.cls = cls; state.race = race; for (const [k, v] of Object.entries(R.bonus)) state.base[k] += v;
    const lvl = Math.max(1, Math.floor(state.level / 3)); for (const d of classSkills(cls).filter((d) => d.built)) state.skills[d.id] = { lvl, ups: [] };
    state.hotbar = [...classSkills(cls).filter((d) => d.built && d.kind !== 'passive').map((d) => d.id), 'flick'].slice(0, 6); renderHotbar(); refreshHand(); clampVitals();
    ui.banner(`${R.name.toUpperCase()} ${C.name.toUpperCase()}`, C.color); ui.host(`A ${R.name} ${C.name}! The audience has opinions. Mostly positive. Some are betting against you already.`); STORY.Q.event('flag'); saveGame(); },
  scrapJunk() { const j = state.inv.filter((i) => i.kind === 'gear' && i.rarity === 'junk'); j.forEach((i) => G.scrap(i)); if (!j.length) ui.toast('No junk to scrap', '#9a9a9a', 1500); },
};
const ui = createUI(G);
const GUIDE = createGuide(G, { matDrop: matDropTable(), floorMats: FLOOR_MATS, mobName: (k) => (MOBDEFS[k] && MOBDEFS[k].name) || k }); G.renderGuide = () => GUIDE.render(); G.openGuide = () => ui.toggle("guide");
{ const h = ui.host; ui.host = (t) => { h(t); AU.say(t, 'host'); }; const tg = ui.toggle; ui.toggle = (p) => { SFX('ui'); tg(p); }; }
const CR = createCrafting(G); const craftUI = createCraftUI(G, CR);
G.closeCraft = () => ui.close();
const NPCS = createNPCSystem({ scene, col, rigged: ink.rigged, get nav() { return MS.nav; } });
const STORY = createStory({ state, floor: FLOOR, CR, derived, toast: (...a) => ui.toast(...a), host: (t) => ui.host(t), sfx: (n) => SFX(n), gainXP: (n) => gainXP(n), save: () => saveGame(),
  uid: () => Math.floor(Math.random() * 1e9), makeItem: (o) => makeItem(rng, o), give: (it) => { state.inv.push(it); ui.toast(`<span class="toastArt">${artImg(it, 44)}</span><span style="color:${RCOL[it.rarity] || '#fff'}">${it.name}</span><div class="sm">added to your bag</div>`, '#3a3448', 3000); }, giveCons: (i) => state.inv.push({ ...CONSUMABLES[i], uid: Math.floor(Math.random() * 1e9), rarity: 'common' }),
  say: (t, v, p, o) => AU.say(t, v, p, o), giveBook: () => { const pool = bookPool(); if (!pool.length) return state.inv.push({ uid: Math.floor(Math.random() * 1e9), kind: 'consumable', name: 'Tome of Grit', rarity: 'epic', effect: { statPoints: 2 } }); const d = pool[Math.floor(Math.random() * pool.length)]; state.inv.push({ uid: Math.floor(Math.random() * 1e9), kind: 'book', skill: d.id, name: `Skill Book: ${d.name}`, rarity: 'epic', host: 'Your guild thinks you can read. Prove them right.' }); ui.toast(`<div class="ta">SKILL BOOK</div>${d.name}`, '#b46cff', 3500); }, rest: () => { const D = derived(); state.hp = D.maxHp; state.mana = D.maxMana; state.hunger = 100; state.thirst = 100; ui.banner('RESTED', '#ffd080'); saveGame(); }, stopVoice: () => AU.stopSpeech(), openShop: (id, title) => {}, openPanel: (p) => { ui.toggle(p); }, onOpen: (o) => { if (o && document.pointerLockElement) document.exitPointerLock(); }, rcol: (r) => RCOL[r] || '#fff' });
G.renderShop = () => STORY.renderShop();
// Hall of Callings: pick a race and a class (once)
let pickRace = 'human', pickCls = 'pyromancer', pickTab = 'magic';
G.renderClass = () => {
  if (state.cls !== 'none') { $('classBody').innerHTML = `<div class="emptyStock">You are a <b>${PRACES[state.race].name} ${clsDef().name}</b>. The Hall only lets you choose once. Your guild is <b>${(GUILDS[guildOf(state.cls)] || {}).name || 'none'}</b>.</div>`; return; }
  const C = CLASSES[pickCls], R = PRACES[pickRace];
  $('classBody').innerHTML = `<div class="cpick"><div><div class="cph">1 · RACE</div><div class="rgrid">${Object.entries(PRACES).map(([k, r]) => `<button class="rcard ${k === pickRace ? 'on' : ''}" data-r="${k}"><i style="background:${r.skin}"></i><b>${r.name}</b><span>${Object.entries(r.bonus).map(([s, v]) => `${v > 0 ? '+' : ''}${v} ${s}`).join(' ')}</span></button>`).join('')}</div><div class="sm" style="margin-top:6px">${R.desc}</div></div>
    <div><div class="cph">2 · CLASS <span class="ctabs"><button data-t="magic" class="${pickTab === 'magic' ? 'on' : ''}">MAGIC (12)</button><button data-t="job" class="${pickTab === 'job' ? 'on' : ''}">JOBS (8)</button></span></div>
    <div class="cgrid">${Object.entries(CLASSES).filter(([, c]) => c.group === pickTab).map(([k, c]) => `<button class="ccard ${k === pickCls ? 'on' : ''}" data-c="${k}" style="--c:${c.color}"><b>${c.name}</b><span>${c.role}</span></button>`).join('')}</div></div>
    <div class="cdet" style="--c:${C.color}"><div class="ctitle" style="color:${C.color}">${R.name} ${C.name}</div><div>${C.desc}</div><div class="sm">Main stats ${C.main.join(', ')} · each level +${Object.entries(C.auto).map(([k, v]) => `${v} ${k}`).join(' +')} · skill mix ${C.mix.join(' / ')} (attack / defence / utility) · guild: ${(GUILDS[guildOf(pickCls)] || {}).name}</div>
      <div class="cph" style="margin-top:8px">STARTING SKILLS</div>${classSkills(pickCls).filter((d) => d.built).map((d) => `<div class="cskill"><b>${d.name}</b> <span class="sm">${d.kind}${d.elem && d.elem !== 'phys' ? ' · ' + d.elem : ''}</span><div class="sm">${d.desc}</div></div>`).join('')}
      <div class="sm" style="margin-top:6px">Learn more from skill books: ${classSkills(pickCls).filter((d) => !d.built).map((d) => d.name).join(', ')}</div>
      <button class="cbtn big" id="classGo" style="margin-top:10px">BECOME A ${R.name.toUpperCase()} ${C.name.toUpperCase()}</button></div></div>`;
  document.querySelectorAll('.rcard').forEach((b) => b.onclick = () => { pickRace = b.dataset.r; G.renderClass(); });
  document.querySelectorAll('.ccard').forEach((b) => b.onclick = () => { pickCls = b.dataset.c; G.renderClass(); });
  document.querySelectorAll('.ctabs button').forEach((b) => b.onclick = () => { pickTab = b.dataset.t; pickCls = Object.keys(CLASSES).find((k) => CLASSES[k].group === pickTab); G.renderClass(); });
  $('classGo').onclick = () => { G.chooseClass(pickCls, pickRace); ui.close(); };
}; G.renderLog = () => STORY.renderLog();
const RCOL = { junk: '#9a9a9a', common: '#f4eedc', uncommon: '#5ad86a', rare: '#4a9aff', epic: '#b46cff', legendary: '#ff9a2a' };
G.toast = (...a) => ui.toast(...a);
G.renderSettings = () => { const S = AU.settings; const n = AU.voiceCount();
  $('setList').innerHTML = ['master', 'music', 'sfx', 'voice'].map((k) => `<label class="setRow" for="set_${k}"><span>${{ master: 'Master volume', music: 'Music', sfx: 'Sound effects', voice: 'Voices' }[k]}</span><input type="range" id="set_${k}" min="0" max="1" step="0.05" value="${S[k]}"></label>`).join('')
    + `<label class="setRow" for="set_voiceMode"><span>Character voices</span><select id="set_voiceMode"><option value="speech" ${S.voiceMode === 'speech' ? 'selected' : ''}>Spoken, with accents</option><option value="babble" ${S.voiceMode === 'babble' ? 'selected' : ''}>Gibberish babble</option></select></label>`
    + `<div class="sm" style="margin:10px 0 6px">${n ? `${n} English voices found in your browser. Microsoft Edge has the most natural accented voices (Irish, Scottish, Australian, Indian, South African and more).` : 'No speech voices found in this browser, so characters babble instead.'}</div>`
    + `<div class="castList">${[['host', 'The Host'], ['marta', 'Marta Vance'], ['pickles', 'Pickles'], ['bo', 'Benchwright Bo'], ['reggie', 'Old Reggie'], ['spin', 'Spin Cycle'], ['wickley', 'Wickley'], ['ash', 'Brother Ash'], ['vrask', 'Judge Vrask'], ['goblin', 'Goblins'], ['pylon', 'Sergeant Pylon']].map(([k, nm]) => `<button class="castRow" data-k="${k}"><b>${nm}</b><span>${AU.voiceFor(k)}</span><i>▶</i></button>`).join('')}</div>`;
  ['master', 'music', 'sfx', 'voice'].forEach((k) => { $('set_' + k).oninput = (e) => { S[k] = +e.target.value; AU.apply(); }; }); $('set_voiceMode').onchange = (e) => { S.voiceMode = e.target.value; AU.apply(); };
  const LINES = { host: 'Welcome back, contestant! Please keep your limbs inside the dungeon at all times.', marta: 'Another new face. Welcome to Stairwell Camp.', pickles: 'Pickles\u2019 Junk! Everything\u2019s junk! Some of it\u2019s good junk!', bo: 'Tables built to last. Mostly in one piece.', reggie: 'Forty years I mopped these floors.', spin: 'Have you seen Dave? Dave\u2019s inside.', wickley: 'Best soup on Floor 3, worst soup on Floor 3.', ash: 'Peace, traveller. I keep the Last Light.', vrask: 'I have come a very long way to be disappointed.', goblin: 'Oi! Cone zone! Get the tall one!', pylon: 'Halt! This is a cone zone!' };
  document.querySelectorAll('.castRow').forEach((b) => b.onclick = () => { AU.init(); AU.say(LINES[b.dataset.k], b.dataset.k, null, { pri: 3 }); });
  $('setList').insertAdjacentHTML('afterbegin', `<div class="cph">GRAPHICS</div><div class="setRow"><span>Quality preset</span><span class="presets">${['low', 'medium', 'high'].map((k) => `<button class="cbtn ${GFX.preset === k ? '' : 'ghost'}" data-p="${k}">${k.toUpperCase()}</button>`).join(' ')}</span></div>
    <label class="setRow" for="g_scale"><span>Render scale (lower = faster GPU) <b id="g_scaleV">${Math.round(GFX.scale * 100)}%</b></span><input type="range" id="g_scale" min="0.4" max="1" step="0.05" value="${GFX.scale}"></label>
    <label class="setRow" for="g_outline"><span>Ink outlines (2 extra render passes)</span><input type="checkbox" id="g_outline" ${GFX.outline ? 'checked' : ''}></label>
    <label class="setRow" for="g_view"><span>View distance <b id="g_viewV">${GFX.view} m</b></span><input type="range" id="g_view" min="40" max="120" step="5" value="${GFX.view}"></label>
    <label class="setRow" for="g_fps"><span>Show FPS</span><input type="checkbox" id="g_fps" ${GFX.fps ? 'checked' : ''}></label>
    <div class="sm" style="margin:4px 0 12px">Model detail follows the preset and applies the next time a floor loads. Low is best for laptops with built-in graphics.</div><div class="cph">SOUND</div>`);
  $('setList').insertAdjacentHTML('beforeend', `<div class="cph" style="margin-top:14px">YOUR VOICE RECORDINGS</div><div class="sm">Record lines from <b>voice/SCRIPTS.md</b>, name each file after its line (for example <b>marta_03.wav</b>) and add them here. Your recordings replace the computer voices, with a different effect for each character. ${AU.voicePack() ? `${AU.voicePack().count()} of ${AU.voicePack().total} lines recorded.` : 'Start the game once to enable this.'}</div><label class="setRow" for="vp_files"><span>Add recordings</span><input type="file" id="vp_files" multiple accept="audio/*"></label><button class="cbtn ghost" id="vp_clear">REMOVE ALL RECORDINGS</button>`);
  $('vp_files').onchange = async (e) => { AU.init(); const vp = AU.voicePack(); if (!vp) return; const n = await vp.importFiles([...e.target.files]); ui.toast(`Added ${n} recording${n === 1 ? '' : 's'}${n < e.target.files.length ? ` (${e.target.files.length - n} file names didn’t match a script line)` : ''}`, '#5ad86a', 3500); G.renderSettings(); };
  $('vp_clear').onclick = () => { const vp = AU.voicePack(); if (vp) { vp.clear(); G.renderSettings(); } };
  document.querySelectorAll('.presets button').forEach((b) => b.onclick = () => { Object.assign(GFX, GFX_PRESETS[b.dataset.p], { preset: b.dataset.p }); applyGfx(); G.renderSettings(); });
  $('g_scale').oninput = (e) => { GFX.scale = +e.target.value; GFX.preset = 'custom'; applyGfx(); $('g_scaleV').textContent = Math.round(GFX.scale * 100) + '%'; };
  $('g_outline').onchange = (e) => { GFX.outline = e.target.checked; GFX.preset = 'custom'; applyGfx(); };
  $('g_view').oninput = (e) => { GFX.view = +e.target.value; GFX.preset = 'custom'; applyGfx(); $('g_viewV').textContent = GFX.view + ' m'; };
  $('g_fps').onchange = (e) => { GFX.fps = e.target.checked; applyGfx(); }; };
function applyGfx() { ink.state.outline = GFX.outline; ink.setScale(GFX.scale); globalThis.__VIEW = GFX.view; if (scene.fog) scene.fog.far = Math.min(baseFogFar || 999, GFX.view * 1.6); $('fps').style.display = GFX.fps ? 'block' : 'none'; saveGfx(); }
let baseFogFar = 0;
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
// hotbar: slot 0 = left-click attack (weapon swing for melee classes), then up to 6 skills on keys 1-6
// quick-use bar: Z health, X mana, T drink, Y food. Each uses the strongest matching item you carry.
const QUICK = [['KeyZ', 'Z', 'HEALTH', 'hp', '#E5484D'], ['KeyX', 'X', 'MANA', 'mana', '#4a9aff'], ['KeyT', 'T', 'DRINK', 'thirst', '#5ab8e8'], ['KeyY', 'Y', 'FOOD', 'hunger', '#e8a040']];
const quickItems = (eff) => state.inv.filter((i) => i.kind === 'consumable' && i.effect && i.effect[eff] > 0 && !i.effect.bomb && !i.effect.turret);
function quickUse(eff) { const list = quickItems(eff); if (!list.length) return ui.toast(`No ${QUICK.find((q) => q[3] === eff)[2].toLowerCase()} items`, '#9a9a9a', 1000); list.sort((a, b) => b.effect[eff] - a.effect[eff]); G.useItem(list[0]); renderQuick(); }
let quickSig = '';
function renderQuick() { const sig = QUICK.map((q) => quickItems(q[3]).length).join(','); if (sig === quickSig) return; quickSig = sig; const el = $('quickbar'); if (!el) return;
  el.innerHTML = QUICK.map(([, key, lab, eff, col], i) => { const n = quickItems(eff).length; return `<div class="qs ${n ? 'has' : 'empty'}" style="--c:${col}" data-q="${i}" title="${lab}: uses your best ${lab.toLowerCase()} item"><span class="k">${key}</span><b>${lab}</b><span class="n">${n}</span></div>`; }).join('');
  el.querySelectorAll('.qs').forEach((d) => d.onclick = () => quickUse(QUICK[+d.dataset.q][3])); }
function renderHotbar() { const C = clsDef(); const cells = []; if (C.attack === 'melee') cells.push(`<div class="hk atk0"><span class="k">LMB / RMB</span><b>${(state.equip.main ? state.equip.main.name : 'FISTS').toUpperCase().slice(0, 12)}</b><small>light / heavy</small></div>`);
  state.hotbar.forEach((id, i) => { const d = skillDef(id); if (!d) return; cells.push(`<div class="hk" id="hk_${id}" style="border-color:${(CLASSES[d.cls] || C).color || '#000'}"><span class="k">${i + 1}${C.attack !== 'melee' && i === 0 ? ' / LMB' : C.attack !== 'melee' && i === 1 ? ' / RMB' : ''}</span><b>${d.name.replace(/ \(.*\)/, '').toUpperCase().slice(0, 12)}</b><small>${d.cost ? d.cost + ' mp' : 'free'}</small><div class="cdo"></div></div>`); });
  $('hotbar').innerHTML = cells.join(''); }
function bookPool() { const pool = state.cls === 'none' ? [] : classSkills(state.cls).filter((d) => !d.built && !/Prestige/.test(d.src || '')); return pool; }
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
function gainXP(n) { state.xp += n; while (state.xp >= state.xpNext) { state.xp -= state.xpNext; state.level++; state.xpNext = xpFor(state.level); state.statPoints += 5; state.skillPoints += 1; for (const [k, v] of Object.entries(clsDef().auto)) state.base[k] += v; const D = derived(); state.hp = D.maxHp; state.mana = D.maxMana; ui.banner(`LEVEL ${state.level}!`); SFX('levelup'); ui.toast(`<b>Level ${state.level}</b><div class="sm">+5 stat points · +1 skill point · ${Object.entries(clsDef().auto).map(([k, v]) => `+${v} ${k}`).join(' ')}</div>`, '#F5C518'); ui.host('Level up! You are now slightly less likely to die. Slightly.'); } checkAch(); }

// ---------------- player controller ----------------
const P = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: 0, onGround: true, bob: 0 };
const keys = {}; let locked = false;
document.addEventListener('keydown', (e) => {
  keys[e.code] = true; if (e.repeat) return;
  const k = e.code;
  if (STORY.isOpen()) { STORY.key(k); return; }
  if (k === 'KeyI') ui.toggle('inv'); else if (k === 'KeyN') ui.toggle('guide'); else if (k === 'KeyL') ui.toggle('quests'); else if (k === 'KeyB') ui.toast(FLOOR === 'pad' ? 'Walk up to a table and press E.' : 'Crafting happens at the tables in your Crash Pad. Press H in a safe zone.', '#9a9a9a', 1800); else if (k === 'KeyH' && !ui.isOpen()) goPad(); else if (k === 'KeyC') ui.toggle('char'); else if (k === 'KeyK') ui.toggle('skills'); else if (k === 'KeyM') ui.toggle('map'); else if (k === 'KeyJ') ui.toggle('ach'); else if (k === 'KeyP') ui.toggle('settings');
  else if (k === 'Escape') ui.close(); else if (k === 'KeyO') { ink.state.outline = !ink.state.outline; ui.toast(`Ink outlines ${ink.state.outline ? 'on' : 'off'}`, '#9a9a9a', 1200); }
  else if (!ui.isOpen() && QUICK.some((q) => q[0] === k)) quickUse(QUICK.find((q) => q[0] === k)[3]);
  else if (!ui.isOpen()) { const dg = k.match(/^Digit([1-6])$/); if (dg && state.hotbar[+dg[1] - 1]) cast(state.hotbar[+dg[1] - 1]); if (k === 'KeyR' && state.hotbar[1]) cast(state.hotbar[1]); if (k === 'KeyQ') { const dq = state.hotbar.find((id) => { const d = skillDef(id); return d && d.type === 'def'; }); if (dq) cast(dq); } if (k === 'KeyE') use(); if (k === 'KeyG') throwBomb(); if (k === 'KeyF') { DEF.parryT = performance.now() / 1000; DEF.blockHeld = true; SFX('parryTry', P.pos); } if (k === 'KeyV') dodge(); if (k === 'Space' && P.onGround) { P.vel.y = 5.2; P.onGround = false; } }
});
document.addEventListener('keyup', (e) => { keys[e.code] = false; if (e.code === 'KeyF') DEF.blockHeld = false; });
function dodge() { const now = performance.now() / 1000; if (now - DEF.dodgeT < 0.7 || state.stamina < 20) return; state.stamina -= 20; DEF.dodgeT = now; const fwd = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw)), right = new THREE.Vector3(-fwd.z, 0, fwd.x); const d = new THREE.Vector3(); if (keys.KeyW) d.add(fwd); if (keys.KeyS) d.sub(fwd); if (keys.KeyD) d.add(right); if (keys.KeyA) d.sub(right); if (!d.lengthSq()) d.copy(fwd).negate(); DEF.dodgeDir.copy(d.normalize()); SFX('dodge', P.pos); }
$('stage').addEventListener('click', () => { if (!ui.isOpen() && started) $('stage').requestPointerLock(); });
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === $('stage'); $('clickHint').style.display = locked || ui.isOpen() || !started ? 'none' : 'flex'; });
document.addEventListener('mousemove', (e) => { if (!locked) return; P.yaw -= e.movementX * 0.0022; P.pitch = Math.max(-1.45, Math.min(1.45, P.pitch - e.movementY * 0.0022)); });
document.addEventListener('mousedown', (e) => { if (locked && e.button === 0) primary(); if (locked && e.button === 2) secondary(); });
document.addEventListener('contextmenu', (e) => { if (locked) e.preventDefault(); });

// ---------------- spells ----------------
const handFlame = new THREE.Group(); camera.add(handFlame); handFlame.position.set(0.32, -0.3, -0.6);
{ const hm = new THREE.MeshPhysicalMaterial({ color: '#c8987a', roughness: 0.6, sheen: 0.4 }); const palm = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), hm); palm.scale.set(1.2, 0.7, 1.3); handFlame.add(palm); const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.4, 14), new THREE.MeshPhysicalMaterial({ color: '#5a2a1a', roughness: 0.9, sheen: 0.5 })); sl.rotation.x = Math.PI / 2 - 0.3; sl.position.set(0.02, -0.06, 0.24); handFlame.add(sl); }
const palmFire = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffa030').multiplyScalar(2.5) })); palmFire.position.set(0, 0.07, -0.03); handFlame.add(palmFire); fx.push(palmFire);
const palmLight = new THREE.PointLight('#ff9a3a', 1.5, 3); handFlame.add(palmLight); palmLight.position.set(0, 0.1, -0.1);
const wardBubble = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 18), new THREE.MeshBasicMaterial({ color: '#ff8a2a', transparent: true, opacity: 0.12, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })); camera.add(wardBubble); fx.push(wardBubble); wardBubble.visible = false;
let castAnim = 0;
const parryRing = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.17, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb040').multiplyScalar(2), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); parryRing.position.set(0, 0.08, -0.08); handFlame.add(parryRing); fx.push(parryRing); parryRing.visible = false;
// combat engine (melee swings + every class skill)
const COMBAT = createCombat({ scene, fx, camera, P, state, col, get mobs() { return MS.mobs; }, derived, gearSkillBonus, hurtMob: (m, d, o) => hurtMob(m, d, o), burst: (...a) => burstAt(...a), shake: (v) => { shake = Math.max(shake, v); },
  sfx: (n, p) => SFX(n, p), toast: (...a) => ui.toast(...a), floatText: (p, t, c) => floatText(p, t, c), rayHit: (o, d, m) => rayHit(o, d, m), ceiling: () => world.ceiling, aggro: (m) => MS.aggro(m),
  castAnim: (def) => { castAnim = 0.25; handGlow(def.elem); }, wardColor: (c) => wardBubble.material.color.set(c), bigParry: () => { DEF.parryT = performance.now() / 1000 + 0.6; },
  dash: (dir, dist, lift) => { DEF.dodgeT = performance.now() / 1000; DEF.dodgeDir.copy(dir).multiplyScalar(dist / 4); if (lift) { P.vel.y = lift; P.onGround = false; } },
  reveal: () => { revealT = 12; ui.toast('Every mob nearby is marked on your map', '#F5C518', 1800); }, steal: (m) => { const it = makeItem(rng, { level: m.lvl }); state.inv.push(it); ui.toast(`Repossessed: <b>${it.name}</b>`, '#c8c0b0', 2200); } });
let revealT = 0;
function cast(id) { return COMBAT.cast(id); }
const clsDef = () => CLASSES[state.cls || 'none'];
// left click: melee classes swing their weapon, casters cast their first hotbar skill. Right click: heavy swing / second slot.
function primary() { if (clsDef().attack === 'melee') { const ok = COMBAT.swing(false); if (ok) castAnim = 0.3; return ok; } return cast(state.hotbar[0] || 'flick'); }
function secondary() { if (clsDef().attack === 'melee') { if (COMBAT.swing(true)) castAnim = 0.45; } else cast(state.hotbar[1] || state.hotbar[0]); }
// first-person weapon (melee) or glowing hand (casters)
const weaponFP = new THREE.Group(); handFlame.add(weaponFP);
// first-person weapon: shaped by weapon type, with a few named specials (stop sign, pan, rake, umbrella...)
function buildWeaponFP() { weaponFP.clear(); weaponFP.position.set(0, 0.02, -0.02); weaponFP.rotation.set(-0.5, 0, 0.35); const w = state.equip.main; if (!w) return; const n = (w.name || '').toLowerCase(); const wt = w.wtype || (w.stats.spell && !w.stats.dmg ? 'caster' : 'blunt');
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, ...o }); const metal = M('#8a8e94', { metalness: 0.8, roughness: 0.4 }), dark = M('#3a3a40', { metalness: 0.6 }), wood = M('#7a5a3a', { roughness: 0.8 }), grip = M('#2a2228');
  const glowM = (c) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(2) });
  const add = (geo, mat, x, y, z, rx = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); weaponFP.add(m); return m; };
  const cyl = (r1, r2, h, seg = 10) => new THREE.CylinderGeometry(r1, r2, h, seg), box = (a, b, c) => new THREE.BoxGeometry(a, b, c);
  add(cyl(0.024, 0.024, 0.16), grip, 0, 0.0, 0); // grip
  if (wt === 'caster') { add(cyl(0.015, 0.02, 0.75, 8), /mic/.test(n) ? dark : wood, 0, 0.32, 0); add(new THREE.SphereGeometry(0.045, 12, 10), glowM(w.stats.frost ? '#9ad8ff' : w.stats.fire ? '#ffb040' : '#c89aff'), 0, 0.72, 0); if (/mic/.test(n)) add(new THREE.SphereGeometry(0.05, 10, 8), dark, 0, 0.72, 0); if (/remote/.test(n)) add(box(0.05, 0.16, 0.025), dark, 0, 0.62, 0); return; }
  if (wt === 'pierce') { add(cyl(0.016, 0.016, 1.1, 8), /rebar|antler/.test(n) ? metal : wood, 0, 0.5, 0);
    if (/rake/.test(n)) { add(box(0.24, 0.025, 0.025), metal, 0, 1.05, 0); for (let i = 0; i < 6; i++) add(box(0.01, 0.08, 0.01), metal, -0.1 + i * 0.04, 1.0, 0.02); }
    else if (/mop/.test(n)) add(cyl(0.07, 0.05, 0.14, 10), M('#d8d0c0', { roughness: 0.95 }), 0, 1.08, 0);
    else add(new THREE.ConeGeometry(0.035, 0.16, 8), /antler/.test(n) ? M('#e8dcc0') : metal, 0, 1.13, 0); return; }
  if (wt === 'quick') { add(box(0.07, 0.015, 0.03), metal, 0, 0.09, 0); if (/umbrella/.test(n)) { add(cyl(0.01, 0.01, 0.75, 6), dark, 0, 0.45, 0); add(new THREE.ConeGeometry(0.05, 0.5, 8), M('#2a2a5a'), 0, 0.55, 0, Math.PI); } else add(box(0.016, 0.62, 0.008), /antenna|hanger/.test(n) ? dark : metal, 0, 0.4, 0); return; }
  if (wt === 'blade') { if (/cleaver|machete|washboard/.test(n)) { add(box(0.11, 0.3, 0.012), metal, 0.03, 0.26, 0); } else if (/trimmer/.test(n)) { for (const sx of [-0.02, 0.02]) add(box(0.025, 0.42, 0.008), metal, sx, 0.3, sx * 2, 0, sx * 3); } else if (/chakram/.test(n)) { add(new THREE.TorusGeometry(0.11, 0.025, 6, 20), metal, 0, 0.2, 0); } else { add(box(0.04, 0.55, 0.012), metal, 0, 0.36, 0); add(box(0.14, 0.025, 0.03), metal, 0, 0.09, 0); } return; }
  if (wt === 'heavy') { add(cyl(0.024, 0.024, 0.7, 8), /plank/.test(n) ? wood : dark, 0, 0.35, 0);
    if (/stop/.test(n)) add(cyl(0.16, 0.16, 0.02, 8), M('#c81a14'), 0.0, 0.72, 0, Math.PI / 2); else if (/meter/.test(n)) { add(box(0.12, 0.2, 0.1), M('#7a8088', { metalness: 0.5 }), 0, 0.75, 0); add(new THREE.SphereGeometry(0.06, 10, 8), glowM('#88aaff'), 0, 0.87, 0); }
    else if (/plank/.test(n)) add(box(0.14, 0.75, 0.03), wood, 0, 0.6, 0); else if (/gnome/.test(n)) { add(cyl(0.07, 0.09, 0.16, 10), M('#3a6ac8'), 0, 0.74, 0); add(new THREE.ConeGeometry(0.07, 0.14, 10), M('#c81a1a'), 0, 0.88, 0); }
    else add(box(0.2, 0.12, 0.1), /axe|escalator/.test(n) ? metal : M('#6a6a70', { metalness: 0.6 }), 0, 0.72, 0); return; }
  if (wt === 'flail') { add(cyl(0.02, 0.02, 0.3, 8), /rope|line/.test(n) ? wood : dark, 0, 0.15, 0); for (let i = 0; i < 4; i++) add(new THREE.TorusGeometry(0.02, 0.006, 4, 8), metal, 0.02 * i, 0.32 + i * 0.045, 0, 0, i * 0.6);
    add(/whacker|wiper/.test(n) ? box(0.18, 0.02, 0.02) : new THREE.SphereGeometry(0.06, 10, 8), /whacker/.test(n) ? M('#e85a1a') : dark, 0.08, 0.52, 0); return; }
  if (wt === 'shock') { add(cyl(0.02, 0.02, 0.5, 8), /neon/.test(n) ? glowM('#ff3ac8') : dark, 0, 0.3, 0); add(new THREE.SphereGeometry(0.03, 8, 6), glowM('#ffe040'), 0, 0.57, 0); if (/cable/.test(n)) for (const sx of [-1, 1]) add(box(0.04, 0.06, 0.02), M(sx < 0 ? '#c81a14' : '#1a1a1a'), sx * 0.03, 0.6, 0); return; }
  if (wt === 'hot') { if (/iron/.test(n)) { add(box(0.14, 0.05, 0.09), metal, 0, 0.1, 0.05); add(box(0.14, 0.01, 0.09), glowM('#ff6a1a'), 0, 0.075, 0.05); } else { add(cyl(0.018, 0.018, 0.5, 8), metal, 0, 0.25, 0); add(new THREE.SphereGeometry(0.05, 10, 8, 0, 6.3, 0, 1.6), glowM('#ff8a2a'), 0, 0.52, 0); } return; }
  // blunt
  if (/pan/.test(n)) { add(cyl(0.015, 0.015, 0.3, 8), dark, 0, 0.15, 0); add(cyl(0.13, 0.11, 0.035, 18), dark, 0, 0.42, 0, Math.PI / 2); }
  else if (/golf/.test(n)) { add(cyl(0.008, 0.012, 0.8, 8), metal, 0, 0.4, 0); add(box(0.1, 0.05, 0.04), metal, 0.04, 0.8, 0); }
  else if (/rolling/.test(n)) add(cyl(0.045, 0.045, 0.4, 12), wood, 0, 0.3, 0);
  else { add(cyl(0.022, 0.022, 0.55, 8), /mannequin/.test(n) ? M('#e8e0d8') : metal, 0, 0.27, 0); if (/wrench|ladle|tyre|mace/.test(n)) add(box(0.12, 0.08, 0.05), metal, 0, 0.55, 0); }
}
function handGlow(elem) { const c = { fire: '#ffa030', frost: '#bff4ff', storm: '#ffe040', poison: '#9aff5a', holy: '#fff4c0', water: '#5ab8ff', earth: '#e8b060', wind: '#d8fff0', death: '#d8d0ff', shadow: '#c89aff', time: '#ffe8a0', arcane: '#9ad0ff' }[elem] || '#ffa030'; palmFire.material.color.set(c).multiplyScalar(2.5); palmLight.color.set(c); }
let handFireIdle = false; // casters keep a flame in the palm; weapon users only flash one when they cast
function refreshHand() { const melee = clsDef().attack === 'melee'; weaponFP.visible = melee; handFireIdle = !melee; palmFire.visible = handFireIdle; palmFire.scale.setScalar(melee ? 0.7 : 1); handGlow(clsDef().elem || 'fire'); buildWeaponFP(); }
function rayHit(o, d, max) { const p = o.clone(); for (let t = 0; t < max; t += 0.25) { p.addScaledVector(d, 0.25); const q = p.clone(); col.resolve(q, 0.05, p.y); if (q.distanceToSquared(p) > 1e-6 || p.y < 0.05 || p.y > world.ceiling - 0.1) return p; } return p; }
const sparks = [];
function burstAt(p, color, n, spd, grav = 4) { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.5), transparent: true }); for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 5, 4), m); s.position.copy(p); scene.add(s); fx.push(s); sparks.push({ m: s, v: new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).normalize().multiplyScalar(spd * (2 + Math.random() * 6)), life: 0.4 + Math.random() * 0.5, g: grav }); } }
// ---------------- mobs ----------------
const LVL_COL = (d) => (d >= 5 ? '#ff3a3a' : d >= 3 ? '#ff8a3a' : d >= -2 ? '#f4eedc' : '#8a8a8a');
const MS = createMobSystem({ scene, fx, col, P, rigged: ink.rigged, makeBar,
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
function hurtMob(m, dmg, opts = 0) {
  const o = typeof opts === 'number' ? { burn: opts } : opts || {}; const burnSec = o.burn || 0;
  if (m.dead) return; const D = derived(); const crit = Math.random() * 100 < D.crit + (o.crit || 0) || m.state === 'stagger'; const diff = lvlDiff(m);
  const mult = Math.max(0.35, Math.min(1.3, 1 - diff * 0.08)) * (m.state === 'stagger' ? 1.5 : 1) * (m.weak > 0 ? 1.3 : 1);
  const d = Math.max(1, Math.round(dmg * mult * (crit ? 1.8 : 1) * (0.9 + Math.random() * 0.2)));
  if (m.def.passive) { const d0 = Math.max(1, Math.round(dmg * (0.9 + Math.random() * 0.2))); dmgNumber(m.g.position.clone().add(new THREE.Vector3(0, 2.0, 0)), String(d0), ''); m.flash = 0.1; SFX('hit', m.g.position); state.counters.dummyHits = (state.counters.dummyHits || 0) + 1; STORY.Q.event('count'); return; }
  if (m.camp && STORY.truceOn(m.camp)) STORY.breakTruce(m.camp);
  m.hp -= d; m.flash = 0.1; MS.aggro(m); dmgNumber(m.g.position.clone().add(new THREE.Vector3(0, 2.0 * m.bodyScale, 0)), (crit ? 'CRIT ' : '') + d, crit ? 'crit' : '');
  SFX('hit', m.g.position);
  if (burnSec > 0) { if (m.burn <= 0) state.counters.burned++; m.burn = Math.max(m.burn, burnSec); m.burnDps = Math.max(m.burnDps, (4 + state.level * 0.8) * mult); m.dotColor = '#ff8a2a'; }
  if (m.hp <= 0) killMob(m); checkAch();
}
// the player's defence: F = parry (tap, 0.35 s window) / block (hold), V = dodge (i-frames)
const DEF = { parryT: -9, blockHeld: false, dodgeT: -9, dodgeDir: new THREE.Vector3(), knock: new THREE.Vector3(), parryCd: 0 };
function hitPlayer(raw, m, opts = {}) {
  const now = performance.now() / 1000; const D = derived();
  if (now - DEF.dodgeT < 0.35) { floatText(P.pos.clone().add(new THREE.Vector3(0, 1.6, 0)).add(fwdVec().multiplyScalar(0.9)), 'DODGED', 'parry'); return 'dodged'; }
  if (opts.kind !== 'aoe' && now - DEF.parryT < 0.35) { state.counters.parries = (state.counters.parries || 0) + 1; floatText(P.pos.clone().add(new THREE.Vector3(0, 1.6, 0)).add(fwdVec().multiplyScalar(0.9)), 'PARRIED!', 'parry'); SFX('parry', P.pos); shake = Math.max(shake, 0.1); state.mana = Math.min(D.maxMana, state.mana + 6); DEF.parryCd = 0; if (state.counters.parries === 1) ui.host('A parry! With your hand! On fire! The crowd goes absolutely mild.'); return 'parried'; }
  if (opts.kind !== 'aoe' && Math.random() * 100 < D.dodge) { floatText(P.pos.clone().add(new THREE.Vector3(0, 1.6, 0)).add(fwdVec().multiplyScalar(0.9)), 'MISS', 'parry'); return 'dodged'; }
  const diff = lvlDiff(m); let dmg = raw * Math.max(0.6, 1 + diff * 0.12) * (1 - Math.min(0.6, D.armor / 200));
  if (m && !m.dead && (D.thorns || (state.ward > 0 && state.wardThorns))) hurtMob(m, (D.thorns || 0) + (state.ward > 0 ? state.wardThorns * 2 : 0), {});
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
  const diff = lvlDiff(m); const xpMul = diff < 0 ? Math.max(0.05, 1 + diff * 0.15) : Math.min(1.25, 1 + diff * 0.05); { const xp = Math.max(1, Math.round(m.def.xp * (1 + 0.4 * (m.lvl - 1)) * xpMul * (m.summoned ? 0.3 : 1))); gainXP(xp); floatText(m.g.position.clone().setY(2.2 * m.bodyScale), `+${xp} XP`, 'xp', 1.3); } state.gold += (m.def.boss ? 120 : 2) + Math.floor(Math.random() * 6) * m.lvl;
  STORY.Q.event('kill', m); if (m.def.boss) { STORY.Q.event('boss', m.kind); state.flags[m.kind + '_handled'] = true; if (m.kind === 'pylon') state.flags.pylon_handled = true; bossDown(m); } else if (m.camp) campCheck(m.camp);
  if (state.counters.kills === 1) ui.host('Your first kill on camera! Our legal team has been notified.');
  // loot pouch with 1-2 items
  const bossCap = m.lvl >= 9 ? 1 : 0; const items = (m.def.boss || m.def.elite || Math.random() < GEAR_DROP) ? [makeItem(rng, { level: m.lvl, minRarity: m.def.boss ? 3 : m.def.elite ? 2 : 0, capBonus: m.def.boss ? bossCap : 0 })] : []; if (m.def.boss) { items.push(makeItem(rng, { level: m.lvl + 1, minRarity: 3, capBonus: bossCap }), makeItem(rng, { level: m.lvl, minRarity: 2 }), { uid: Math.floor(Math.random() * 1e9), kind: 'box', box: 'boss', name: 'Boss Box', rarity: 'epic', host: 'You killed a boss. Here is a box. Inside the box: more boxes? No. Loot.' }); } const MATDROP = matDropTable(); const matDrop = MATDROP[m.kind] || { coneplastic: 1 + (Math.random() < 0.5 ? 1 : 0), gristle: 2, hide: 1, scrapmetal: 1, ember: Math.random() < 0.25 ? 1 : 0, sulphur: Math.random() < 0.4 ? 1 : 0 }; { const fm = FLOOR_MATS[FLOOR]; if (fm && Math.random() < 0.6) { const k = fm[Math.floor(Math.random() * fm.length)]; matDrop[k] = (matDrop[k] || 0) + 1; } for (const [k, ch, lv] of RARITY_MAT_DROP) if (m.lvl >= lv && Math.random() < ch * (m.def.boss ? 25 : m.def.elite ? 4 : 1)) matDrop[k] = (matDrop[k] || 0) + 1; }
  items.push({ kind: 'mat', mats: matDrop, rarity: 'common', name: 'Materials' }); if (Math.random() < 0.35) items.push({ ...CONSUMABLES[Math.floor(Math.random() * CONSUMABLES.length)], uid: Math.floor(Math.random() * 1e9), rarity: 'common' });
  const best = items.filter((i) => i.kind !== 'mat').reduce((b, i) => (['junk', 'common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(i.rarity) > ['junk', 'common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(b.rarity) ? i : b), items.find((i) => i.kind !== 'mat'));
  const colr = { junk: '#9a9a9a', common: '#f4eedc', uncommon: '#5ad86a', rare: '#4a9aff', epic: '#b46cff', legendary: '#ff9a2a' }[best.rarity];
  const pouch = new THREE.Group(); const bag = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), new THREE.MeshPhysicalMaterial({ color: '#7a5a3a', roughness: 0.8 })); bag.scale.y = 0.8; pouch.add(bag);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.2, 3, 10, 1, true), new THREE.MeshBasicMaterial({ color: colr, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 1.5; pouch.add(beam); fx.push(beam);
  pouch.position.copy(m.g.position).setY(0.15); scene.add(pouch); drops.push({ g: pouch, items, colr });
}
function bossDown(m) {
  ui.banner(`${m.def.name.toUpperCase()} DEFEATED`, '#F5C518'); SFX('victory', P.pos); MUSIC('explore'); activeBoss = null;
  ui.host({ pylon: 'Sergeant Pylon is down! Somebody tell the cones. Actually, don\u2019t. They\u2019ll riot.', ebb: 'Head Custodian Ebb has clocked out. Permanently. Spin City is a little drier tonight.', bulbQueen: 'The Bulb Queen is out! Lights out! Somebody find the switch!', bigSucker: 'The Big Sucker has been… unplugged. The drains are safe. The drains are never safe.', coo: 'Old Man Coo has flown the coop. Permanently. Get it? The writers are very tired.', coneKing: 'THE CONE KING IS DEAD! Long live… nobody. The cones are leaderless. Chaos. Beautiful chaos.' }[m.kind] || 'A boss is dead! Sponsors are thrilled. Mostly about the explosions.');
  state.inv.push({ uid: Math.floor(Math.random() * 1e9), kind: 'consumable', name: `District Map: ${world.map.pois.find((p) => p.boss === m.kind)?.name || 'Unknown'}`, rarity: 'rare', effect: { map: 1 }, host: 'A map of this district, with everything still alive on it. Mostly.' });
  ui.toast(`<div class="ta">BOSS LOOT</div>District Map + Boss Box dropped<div class="sm">Pick up the pouch (E)</div>`, '#F5C518', 4500);
  if (m.camp) { state.conquered[m.camp] = true; setTimeout(() => campCheck(m.camp), 400); }
  state.ach['boss_' + m.kind] = true; state.flags.any_boss = true; STORY.Q.event('flag'); saveGame();
}
function campCheck(camp) {
  const left = mobs.filter((o) => o.camp === camp && !o.dead && !o.summoned).length; const poi = world.map.pois.find((p) => p.camp === camp);
  if (left === 0 && poi && !state.ach['camp_' + camp]) { state.ach['camp_' + camp] = true; state.conquered[camp] = true; ui.banner(`ENCAMPMENT CONQUERED: ${poi.name.toUpperCase()}`, '#7BE38A'); gainXP(300); state.inv.push({ uid: Math.floor(Math.random() * 1e9), kind: 'box', box: 'gold', name: 'Gold Box', rarity: 'epic', host: 'Conquest bonus. The camp is yours. Please do not move in, the cones smell.' }); ui.toast('<div class="ta">CONQUEST</div>Gold Box added to your inventory', '#F5C518', 4000); }
  else if (poi && left > 0 && left <= 3) ui.toast(`${poi.name}: ${left} defender${left > 1 ? 's' : ''} left`, '#ff7a3a', 1800);
}
function use() {
  const n = NPCS.nearest(P, 2.8); if (n) { if (n.kind === 'filler') { const L = FILLER_POOL(n); fillerSay(n, L, 1); n.talking = 2.5; } else if (!STORY.open(n)) fillerSay(n, 'Hm?', 1); return; }
  if (world.stairs && Math.hypot(P.pos.x - world.stairs.x, P.pos.z - world.stairs.z) < world.stairs.r) { if (state.flags && state.flags[world.stairs.flag] && world.stairs.to === '7') ui.toast('Floor 7 (The Drowned Cistern) is still being built by the network. You cleared Floor 6!', '#F5C518', 4000); else if (state.flags && state.flags[world.stairs.flag]) { SFX('door'); state.lastFloor = world.stairs.to; saveGame(); ui.banner(`DESCENDING TO FLOOR ${world.stairs.to}`, '#F5C518'); setTimeout(() => goFloor(world.stairs.to), 900); } else ui.toast(`<div class="ta">LOCKED</div>${world.stairs.how || world.stairs.locked}`, '#E5484D', 7000); return; }
  const dr = (world.doors || []).find((d) => Math.hypot(P.pos.x - d.x, P.pos.z - d.z) < 2.6);
  if (dr) { if (dr.kind === 'saferoom') { state.lastFloor = FLOOR; saveGame(); SFX('door'); ui.banner('ENTERING YOUR SAFE ROOM', '#5ad86a'); setTimeout(() => goFloor('pad'), 700); return; }
    if (dr.kind === 'fountain') { state.thirst = 100; state.flags.tut_drank = true; STORY.Q.event('flag'); SFX('splash', P.pos); ui.toast('You drink deeply. Thirst full.', '#3a9aff', 1800); return; }
    if (dr.kind === 'inn') { ui.toast('Talk to the innkeeper to rest.', '#ffd080', 1600); return; }
    if (dr.kind === 'guild') { ui.toast('The guild masters are standing outside the hall. Talk to the one for your class.', '#b46cff', 2200); return; }
    if (dr.kind === 'callings') { if (FLOOR === '3') ui.toggle('class'); return; } }
  const si = nearSlot(); if (si >= 0) return useSlot(si); interact();
}
const FILLER_POOL = (n) => { const L = FILLER_LINES[n.role] || FILLER_LINES.gossip; return L[Math.floor(Math.random() * L.length)]; };
function fillerSay(n, line, vol) { floatText(n.g.position.clone().setY(2.0 * n.baseScale + 0.35), line, 'bark', 3.2); AU.say(line, n.voice || 'villager', n.g.position, { seed: n.variant || 0, max: 14, pri: vol >= 1 ? 2 : 1 }); }
function interact() {
  let best = null, bd = 2.2; for (const d of drops) { const dd = d.g.position.distanceTo(P.pos.clone().setY(0.15)); if (dd < bd) { bd = dd; best = d; } }
  if (!best) return; for (const it of best.items) { if (it.kind === 'mat') { const got = Object.entries(it.mats).filter(([, n]) => n > 0); got.forEach(([mm, n]) => { state.mats[mm] = (state.mats[mm] || 0) + n; }); ui.toast(`<span class="sm">${got.map(([mm, n]) => `+${n} ${MATS[mm]}`).join(' · ')}</span>`, '#3a3448', 2400); continue; } if (state.inv.length >= state.invCap) { ui.toast('Inventory full! Scrap some junk (I).', '#E5484D'); break; } state.inv.push(it); ui.toast(`<span class="toastArt">${artImg(it, 44)}</span><span style="color:${RCOL[it.rarity] || '#fff'}">${it.name}</span><div class="sm">${it.kind === 'gear' ? 'iLvl ' + it.level : it.kind}</div>`, '#3a3448', 2600); }
  scene.remove(best.g); drops.splice(drops.indexOf(best), 1); SFX('pickup');
}

// ---------------- map ----------------
const visited = new Set(); const VCELL = 12;
// town services and the stairs, as labelled markers on both maps
const SERVICE = { saferoom: ['S', '#5ad86a', 'SAFE ROOM'], inn: ['I', '#ffd080', 'INN'], guild: ['G', '#b46cff', 'GUILD HALL'], callings: ['C', '#F5C518', 'HALL OF CALLINGS'], fountain: ['W', '#5ab8e8', 'WATER'] };
const SHOPMARK = { tables: ['T', '#c8a070', 'TABLES'], gear: ['$', '#F5C518', 'GEAR'], provisions: ['$', '#7BE38A', 'FOOD & POTIONS'], pickles: ['$', '#c8c0b0', 'JUNK'], dave: ['$', '#ff8a2a', 'SNACKS'] };
function serviceList() { const out = []; for (const d of world.doors || []) if (SERVICE[d.kind]) out.push([d.x, d.z, ...SERVICE[d.kind]]); for (const n of NPCS.npcs) if (n.shop) { const k = SHOPMARK[n.shop] || ['$', '#F5C518', 'SHOP']; out.push([n.g.position.x, n.g.position.z, k[0], k[1], k[2] + ' · ' + n.name]); } return out; }
function drawServices(c, X, Z, big) { const r = big ? 8 : 5;
  for (const [x, z, ch, col, lab] of serviceList()) { const sx = X(x), sz = Z(z); if (!big && Math.hypot(x - P.pos.x, z - P.pos.z) > 70) continue; c.save(); c.translate(sx, sz); if (!big) c.rotate(-P.yaw);
    c.fillStyle = '#0d0b12'; c.beginPath(); c.arc(0, 0, r + 2, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.fillStyle = '#0d0b12'; c.font = `bold ${big ? 12 : 8}px Barlow Condensed`; c.textAlign = 'center'; c.fillText(ch, 0, big ? 4 : 3);
    if (big && !/·/.test(lab)) { c.fillStyle = col; c.font = 'bold 12px Barlow Condensed'; c.textAlign = 'left'; c.fillText(lab, r + 4, 4); } c.restore(); }
  if (world.stairs) { const open = state.flags && state.flags[world.stairs.flag]; c.save(); c.translate(X(world.stairs.x), Z(world.stairs.z)); if (!big) c.rotate(-P.yaw); c.fillStyle = open ? '#5aff7a' : '#ff5a3a'; c.strokeStyle = '#0d0b12'; c.lineWidth = 2; const k = big ? 1.6 : 1; c.beginPath(); c.moveTo(-8 * k, -6 * k); c.lineTo(8 * k, -6 * k); c.lineTo(0, 8 * k); c.closePath(); c.fill(); c.stroke();
    if (big) { c.font = 'bold 14px Barlow Condensed'; c.textAlign = 'left'; c.fillText(open ? `STAIRS TO FLOOR ${world.stairs.to} · OPEN` : 'STAIRS · LOCKED', 16, 5); } c.restore(); }
}
// floating labelled icons above town services and shopkeepers (fade in within ~45 m)
const signs = [];
function serviceSprite(ch, col, label) { const c = document.createElement('canvas'); c.width = 320; c.height = 96; const g = c.getContext('2d'); g.fillStyle = 'rgba(13,11,18,0.85)'; g.beginPath(); g.roundRect(4, 14, 312, 68, 14); g.fill(); g.strokeStyle = col; g.lineWidth = 5; g.stroke();
  g.fillStyle = col; g.beginPath(); g.arc(48, 48, 26, 0, 7); g.fill(); g.fillStyle = '#0d0b12'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillText(ch, 48, 60); g.fillStyle = '#f4eedc'; g.font = 'bold 26px sans-serif'; g.textAlign = 'left'; g.fillText(label, 86, 58, 222);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); sp.scale.set(3.2, 0.96, 1); fx.push(sp); return sp; }
function buildServiceSigns() {
  for (const d of world.doors || []) { const k = SERVICE[d.kind]; if (!k) continue; const sp = serviceSprite(k[0], k[1], k[2]); sp.position.set(d.x, 4.6, d.z); scene.add(sp); signs.push(sp); }
  for (const n of NPCS.npcs) if (n.shop) { const k = SHOPMARK[n.shop] || ['$', '#F5C518', 'SHOP']; const sp = serviceSprite(k[0], k[1], k[2]); sp.scale.set(2.4, 0.72, 1); sp.position.set(0, 3.0 / (n.g.scale.y || 1), 0); n.g.add(sp); signs.push(sp); }
}
function updateSigns() { for (const sp of signs) { const p = sp.getWorldPosition(_sv); const d = Math.hypot(p.x - P.pos.x, p.z - P.pos.z); sp.visible = d < 45; sp.material.opacity = Math.min(1, (45 - d) / 10); } }
const _sv = new THREE.Vector3();
// the way down: what this floor's stairs need, always on screen
let wayT = 0; function updateWayDown(dt) { wayT -= dt; if (wayT > 0) return; wayT = 1; const el = $('wayDown'); if (!el || !world.stairs) { if (el) el.style.display = 'none'; return; } const open = state.flags && state.flags[world.stairs.flag];
  el.style.display = 'block'; el.className = open ? 'open' : ''; el.innerHTML = open ? `<b>THE WAY DOWN · OPEN</b><div>Stairs to Floor ${world.stairs.to} are marked ▼ on your map (M).</div>` : `<b>THE WAY DOWN</b><div>${world.stairs.how || world.stairs.locked}</div>`; }
function drawMap(cv, big = false) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height, S = world.size, m = world.map;
  const scale = big ? Math.min(W, H) / S : 2.2; const cx = big ? W / 2 : W / 2 - P.pos.x * scale, cz = big ? H / 2 : H / 2 - P.pos.z * scale;
  const X = (x) => (big ? cx + x * scale : cx + x * scale), Z = (z) => (big ? cz + z * scale : cz + z * scale);
  c.fillStyle = '#14101a'; c.fillRect(0, 0, W, H);
  if (!big) { c.save(); c.translate(W / 2, H / 2); c.rotate(P.yaw); c.translate(-W / 2, -H / 2); }
  // static layer (water, pillars, buildings) is drawn once per floor into an offscreen canvas, then stamped
  if (!world.mapLayer) { const k = 2.2, Ls = document.createElement('canvas'); Ls.width = Ls.height = Math.ceil(S * k); const lc = Ls.getContext('2d'); const LX = (x) => (x + S / 2) * k;
    lc.fillStyle = '#2a4a5a'; for (const [x, z, rx, rz] of m.water) { lc.beginPath(); lc.ellipse(LX(x), LX(z), rx * k, rz * k, 0, 0, 7); lc.fill(); }
    lc.fillStyle = '#5a5060'; for (const [x, z] of m.pillars) lc.fillRect(LX(x) - 1, LX(z) - 1, 2.2, 2.2); lc.fillStyle = '#6a4a4a'; for (const [x, z] of m.cars) lc.fillRect(LX(x) - 2, LX(z) - 3, 4, 6);
    for (const r of world.noMob || []) { lc.fillStyle = 'rgba(90,216,106,0.12)'; lc.fillRect(LX(r[0]), LX(r[1]), (r[2] - r[0]) * k, (r[3] - r[1]) * k); lc.strokeStyle = '#5a7a5a'; lc.lineWidth = 2; lc.strokeRect(LX(r[0]), LX(r[1]), (r[2] - r[0]) * k, (r[3] - r[1]) * k); }
    world.mapLayer = Ls; world.mapK = k; }
  c.drawImage(world.mapLayer, X(-S / 2), Z(-S / 2), S * scale, S * scale);
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
  drawServices(c, X, Z, big);
  if (!big) c.restore();
  const px = big ? X(P.pos.x) : W / 2, pz = big ? Z(P.pos.z) : H / 2; c.save(); c.translate(px, pz); c.rotate(big ? -P.yaw : 0); c.fillStyle = '#3FD0E0'; c.strokeStyle = '#0D0B12'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -9); c.lineTo(6, 7); c.lineTo(0, 3); c.lineTo(-6, 7); c.closePath(); c.fill(); c.stroke(); c.restore();
  if (big) { c.fillStyle = '#F5C518'; c.font = 'bold 22px Bangers'; c.textAlign = 'left'; c.fillText(world.name, 16, 32); c.fillStyle = '#d9d2bf'; c.font = '15px Barlow Condensed'; c.fillText(`${state.discovered.size}/${m.pois.length} places discovered · fog clears as you explore`, 16, 54); c.fillText('Key: green shield = safe zone · red dashed = encampment · S safe room · I inn · G guild · C Hall of Callings · $ shop · T table seller · ▼ stairs (red = locked)', 16, 74); }
}

// ---------------- loop ----------------
let saveT = 0, musicT = 0, mapT = 0, fpsN = 0, fpsT = 0, fpsV = 60, slowT = 0, losT = 0; const FAST = QS.has('fast'); let fastN = 0; let started = false, shake = 0, lastPOI = null, lowHpT = 0;
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
    state.mana = Math.min(D.maxMana, state.mana + D.manaRegen * dt); if (state.hp > 0) state.hp = Math.min(D.maxHp, state.hp + (D.hpRegen + (state.ward > 0 ? state.wardHeal || 0 : 0)) * dt);
    state.hunger = Math.max(0, state.hunger - dt * 0.08); state.thirst = Math.max(0, state.thirst - dt * 0.11);
    if (state.thirst <= 0 || state.hunger <= 0) state.hp -= dt * 1.5;

    if (state.hp < D.maxHp * 0.15 && state.hp > 0) { lowHpT += dt; if (lowHpT > 1) award('closeCall'); }
    if (state.hp <= 0) { state.hp = D.maxHp * 0.5; P.pos.set(...world.spawn); ui.banner('YOU DIED', '#E5484D'); ui.host('You died! Don’t worry, our revival sponsor has you covered. This time.'); MS.clearAll(); mobs.forEach((m) => { if (!m.dead) { m.state = 'idle'; m.hp = m.maxHp; m.g.position.copy(m.home); } }); activeBoss = null; }
    // discovery + fog
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) visited.add(`${Math.floor(P.pos.x / VCELL) + dx},${Math.floor(P.pos.z / VCELL) + dz}`);
    let inPOI = null; for (const p of world.map.pois) if (p.rect ? P.pos.x > p.rect[0] && P.pos.x < p.rect[2] && P.pos.z > p.rect[1] && P.pos.z < p.rect[3] : Math.hypot(P.pos.x - p.x, P.pos.z - p.z) < p.r) { if (inPOI && inPOI.r < p.r) continue; inPOI = p; if (!state.discovered.has(p.name)) { state.discovered.add(p.name); ui.banner(`DISCOVERED: ${p.name.toUpperCase()}`, '#7BE38A'); gainXP(40); if (p.name === 'The Exit Sign') award('exit'); if (p.kind === 'secret') { state.flags['unnamed_' + FLOOR] = true; ui.host('Those scratches on the wall? We… did not put those there. Moving on!'); } } }
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
  castAnim = Math.max(0, castAnim - dt); palmFire.visible = handFireIdle || castAnim > 0; palmLight.intensity = palmFire.visible ? 1.5 : 0; const blk = DEF.blockHeld ? 1 : 0, par = Math.max(0, 1 - (t - DEF.parryT) / 0.35); handFlame.position.set(0.32 - blk * 0.3, -0.3 - (P.onGround ? Math.abs(Math.sin(P.bob)) * 0.015 : 0) + castAnim * 0.3 + blk * 0.18, -0.6 - castAnim * 0.6 + par * 0.15); parryRing.visible = blk > 0 || par > 0; parryRing.material.opacity = 0.25 + par * 0.6; parryRing.scale.setScalar(1 + par * 0.4); palmFire.scale.setScalar(1 + Math.sin(t * 20) * 0.15 + castAnim * 3);
  { const sw = COMBAT.swingT; const k = sw > 0 ? Math.sin((1 - sw / 0.42) * Math.PI) : 0; weaponFP.rotation.set(-0.5 - k * 1.6, k * 0.6, 0.35 - k * 0.9); weaponFP.position.set(-k * 0.15, 0.02 + k * 0.05, -0.02 - k * 0.2); }
  wardBubble.visible = state.ward > 0; wardBubble.material.opacity = 0.08 + Math.sin(t * 6) * 0.03;
  if (!paused) {
    COMBAT.update(dt, t); revealT = Math.max(0, revealT - dt);
    for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life -= dt; s.v.y -= s.g * dt; s.m.position.addScaledVector(s.v, dt); if (s.life <= 0) { scene.remove(s.m); sparks.splice(i, 1); } }
    // mobs
    losT -= dt; const doLos = losT <= 0; if (doLos) losT = 0.15;
    if (!window.__freeze) MS.update(dt, t, state.level);
    NPCS.update(dt, t, P, (n, line, v) => fillerSay(n, line, v)); NPCS.pushPlayer(P);
    for (const n of NPCS.npcs) { const qm = n.kind !== 'filler' ? STORY.hasQuestFor(n.id) : null; const d = n.g.position.distanceTo(P.pos); const [sx, sy, sz] = project(n.g.position.clone().setY(2.1 * n.baseScale + 0.4)); if (!n.mark) { n.mark = document.createElement('div'); n.mark.className = 'qmark'; $('hud').appendChild(n.mark); n.label = document.createElement('div'); n.label.className = 'npcName'; $('hud').appendChild(n.label); }
      if (doLos && d < 30) n.losOK = losClear(n.g.position); const vis = sz < 1 && d < 30 && n.losOK !== false; n.mark.style.display = vis && qm ? 'block' : 'none'; if (vis && qm) { n.mark.textContent = qm; n.mark.classList.toggle('ready', qm === '?'); n.mark.style.transform = `translate(${sx - 8}px, ${sy - 52 + Math.sin(t * 3) * 4}px)`; }
      const lv = sz < 1 && n.losOK !== false && d < (n.kind === 'filler' ? 7 : 14); n.label.style.display = lv ? 'block' : 'none'; if (lv) { n.label.textContent = n.title ? `${n.name} · ${n.title}` : n.name; n.label.style.transform = `translate(${sx - n.label.offsetWidth / 2}px, ${sy - 10}px)`; } }
    for (const m of mobs) { if (m.dead || !m.bar) continue; const g = m.g; const dist = g.position.distanceTo(P.pos);
      if (doLos && dist < 30) m.losOK = losClear(g.position);
      const [sx, sy, sz] = project(g.position.clone().setY(2.3 * m.bodyScale)); const show = sz < 1 && dist < 30 && m.losOK !== false && (m.state !== 'idle' || m.hp < m.maxHp || dist < 12);
      m.bar.style.display = show ? 'block' : 'none'; if (show) { const d = lvlDiff(m); m.bar.style.transform = `translate(${sx - 50}px, ${sy - 20}px)`; const mn = m.bar.querySelector('.mn'); mn.innerHTML = `${m.name} · <span style="color:${LVL_COL(d)}">Lv ${m.lvl}</span>${m.burn > 0 ? ' · BURNING' : ''}${m.state === 'stagger' ? ' · STAGGERED' : ''}`; m.bar.querySelector('i').style.width = (m.hp / m.maxHp) * 100 + '%'; m.bar.classList.toggle('elite', !!m.def.elite); } }
    // boss bar
    if (activeBoss && (activeBoss.dead || activeBoss.state === 'idle')) { activeBoss = activeBoss.dead ? null : activeBoss.state === 'idle' ? null : activeBoss; }
    $('bossBar').style.display = activeBoss ? 'block' : 'none'; if (activeBoss) { $('bossName').textContent = `${activeBoss.def.name.toUpperCase()} · LV ${activeBoss.lvl}`; $('bossTitle').textContent = activeBoss.def.title + (activeBoss.enraged ? ' · ENRAGED' : ''); $('bossFill').style.width = (activeBoss.hp / activeBoss.maxHp) * 100 + '%'; }
    // drop bobbing + prompt
    let near = false; for (const d of drops) { d.g.children[0].position.y = Math.sin(t * 3) * 0.05; if (d.g.position.distanceTo(P.pos.clone().setY(0.15)) < 2.2) near = true; }
    const si = nearSlot(), nn = NPCS.nearest(P, 2.8), st = world.stairs && Math.hypot(P.pos.x - world.stairs.x, P.pos.z - world.stairs.z) < world.stairs.r;
    let pr = null; if (nn) pr = `<b>[E]</b> ${nn.kind === 'filler' ? 'Chat with' : 'Talk to'} ${nn.name}`; else if (st) pr = `<b>[E]</b> ${state.flags && state.flags[world.stairs.flag] ? `Descend to Floor ${world.stairs.to}` : 'Stairwell door (locked)'}`; else if ((world.doors || []).some((d) => Math.hypot(P.pos.x - d.x, P.pos.z - d.z) < 2.6)) { const d = world.doors.find((q) => Math.hypot(P.pos.x - q.x, P.pos.z - q.z) < 2.6); pr = `<b>[E]</b> ${{ saferoom: 'Enter your Safe Room (Crash Pad)', fountain: 'Drink from the fountain', inn: 'The Inn', guild: 'Guild Hall', callings: 'Hall of Callings' }[d.kind]}`; } else if (si >= 0) { const tid = Object.keys(state.tables).find((k) => state.tables[k].slot === si); pr = tid ? `<b>[E]</b> Use ${TABLES[tid].name}` : `<b>[E]</b> Empty slot ${si + 1}: install a table`; } else if (near) pr = '<b>[E]</b> Pick up';
    $('prompt').innerHTML = pr || ''; $('prompt').style.display = pr ? 'block' : 'none';
    tickThrowables(dt); tickTurrets(dt); saveT += dt; if (saveT > 5) { saveT = 0; saveGame(); }
    if (state.ward <= 0) state.ward = 0;
    world.tick(t);
  }
  // floating numbers
  for (let i = dmgNums.length - 1; i >= 0; i--) { const d = dmgNums[i]; d.t += dt; const [x, y, z] = project(d.p.clone().add(new THREE.Vector3(0, d.t * d.rise, 0))); d.el.style.transform = `translate(${x - (d.el.offsetWidth >> 1)}px, ${y}px)`; d.el.style.opacity = z < 1 ? Math.max(0, Math.min(1, (d.dur - d.t) / 0.3)) : 0; if (d.t > d.dur) { d.el.remove(); dmgNums.splice(i, 1); } }
  $('vign').style.opacity = Math.max(0, parseFloat($('vign').style.opacity || 0) - dt * 2);
  $('compass').style.backgroundPositionX = `${(P.yaw / (Math.PI * 2)) * 720}px`;
  ui.hud(D); renderQuick(); updateSigns(); updateWayDown(dt); mapT -= dt; if (started && mapT <= 0) { mapT = 0.12; drawMap($('mini')); }
  fpsN++; fpsT += dt; if (fpsT > 0.5) { fpsV = fpsN / fpsT; fpsN = 0; fpsT = 0; if (GFX.fps) $('fps').textContent = Math.round(fpsV) + ' FPS'; slowT = started && fpsV < 24 ? slowT + 0.5 : 0; if (slowT > 8 && !GFX.suggested && GFX.preset !== 'low') { GFX.suggested = true; saveGfx(); ui.toast('<div class="ta">RUNNING SLOWLY?</div>Press <b>P</b> and pick the <b>LOW</b> graphics preset.', '#F5C518', 8000); } }
  if (!FAST || (++fastN % 12) === 0) ink.render();
  requestAnimationFrame(frame);
}
// line of sight between the player's eyes and a point, through cars, pillars and walls (used to hide name tags)
function losClear(p) { const dx = p.x - P.pos.x, dz = p.z - P.pos.z, d = Math.hypot(dx, dz); const n = Math.ceil(d / 0.8); for (let i = 1; i < n - 1; i++) { const t = i / n; if (col.blocked(P.pos.x + dx * t, P.pos.z + dz * t, 0.05, 1.2)) return false; } return true; }
const fwdVec = () => new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));

// ---------------- boot ----------------
async function boot() {
  const setP = (p, msg) => { $('loadBar').style.width = Math.round(p * 100) + '%'; if (msg) $('loadMsg').textContent = msg; };
  await new Promise((r) => setTimeout(r, 50));
  let def, built;
  if (FLOOR === 'pad') { const mod = await import('../worlds/crashpad.js'); def = mod.CRASHPAD; setP(0.02, 'Tidying your Crash Pad…'); built = mod.buildCrashPad(ink, col, (p) => setP(p * 0.8), state); }
  else if (FLOOR === '0') { const mod = await import('../worlds/floor0.js'); def = mod.FLOOR0; setP(0.02, 'Mopping the lobby…'); built = mod.buildFloor0(ink, col, (p) => setP(p * 0.8)); }
  else { const mod = await import('../worlds/floors.js'); def = mod.FLOORDEFS[FLOOR] || mod.FLOORDEFS[1]; setP(0.02, 'Sculpting the floor…'); built = mod.buildFloorN(+FLOOR, ink, col, (p) => setP(p * 0.8)); }
  world = { ...built, name: def.name, spawn: def.spawn }; baseFogFar = scene.fog ? scene.fog.far : 999; applyGfx();
  setP(0.85, 'Waking up the goblins…'); await new Promise((r) => setTimeout(r, 30));
  setP(0.88, 'Teaching goblins to walk around cars…'); await new Promise((r) => setTimeout(r, 20)); MS.buildNav(built.size); MS.setNoMob(built.noMob || []); for (const [dx, dz] of built.dummies || []) MS.spawn({ kind: 'dummy', variant: 0, lvl: 1, x: dx, z: dz });
  spawnMobs(built.mobs.filter((s) => !(s.camp && state.conquered[s.camp])));
  setP(0.93, 'Waking the townsfolk…'); await new Promise((r) => setTimeout(r, 20)); for (const n of built.npcs || []) NPCS.spawn(n);
  if (built.stairs) { const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.6), new THREE.MeshBasicMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 72; const g = c.getContext('2d'); g.fillStyle = '#0a3a12'; g.fillRect(0, 0, 256, 72); g.fillStyle = '#5aff7a'; g.font = 'bold 34px sans-serif'; g.fillText(`▼ FLOOR ${built.stairs.to}`, 30, 50); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx; })(), side: THREE.DoubleSide, color: new THREE.Color(1.6, 1.6, 1.6) })); sg.position.set(built.stairs.x, 2.8, built.stairs.z); scene.add(sg); fx.push(sg); world.stairSign = sg; }
  buildServiceSigns(); STORY.renderTracker(); refreshHand(); renderHotbar(); if (FLOOR === '1') { state.flags.reached_f1 = true; if (STORY.Q.st('tut_down') === 'active') STORY.Q.complete('tut_down'); if (!state.quests.arrival && !state.quests.nobody_out) STORY.Q.start('arrival'); } state.lastFloor = FLOOR === 'pad' ? state.lastFloor : FLOOR;
  if (FLOOR === '0' && !state.quests.tut_desk) STORY.Q.start('tut_desk');
  P.pos.set(def.spawn[0], 0, def.spawn[2]); P.yaw = def.spawnYaw;
  $('loc').textContent = world.name; setP(1, 'Ready.');
  $('startBtn').disabled = false; $('startBtn').textContent = 'CLICK TO ENTER';
  requestAnimationFrame(frame);
}
function beginTutorial() {
  if (FLOOR !== '0' || state.flags.tutorialDone) return; state.flags.tutorialDone = true;
  const tips = [[1500, '<div class="ta">HOW TO PLAY</div><b>WASD</b> to move · <b>mouse</b> to look · <b>Shift</b> to sprint'], [9000, '<div class="ta">TALK</div>Look for the <b style="color:#F5C518">!</b> over Pip at the desk and press <b>E</b>'], [20000, '<div class="ta">FIGHTING</div><b>Left click</b> swing your pipe · <b>Right click</b> heavy swing · <b>1</b> flick your lighter'], [32000, '<div class="ta">STAY ALIVE</div>When a <b style="color:#ff5a3a">red warning</b> fills on the ground, step out, <b>V</b> to dodge, or tap <b>F</b> to parry'], [44000, '<div class="ta">SURVIVE</div>Watch Hunger and Thirst (bottom left). <b>I</b> inventory · <b>L</b> quests · <b>M</b> map']];
  tips.forEach(([ms, h]) => setTimeout(() => ui.toast(h, '#F5C518', 7000), ms));
}
let intro = null;
function startPlaying() { $('loading').style.display = 'none'; started = true; $('stage').requestPointerLock && $('stage').requestPointerLock(); }
// new game: name your contestant before the intro
const needName = !LOADED && !state.flags.named;
if (needName) { const box = document.createElement('div'); box.id = 'nameBox'; box.innerHTML = `<label for="nameIn">What's your name, contestant?</label><input id="nameIn" maxlength="18" autocomplete="off" placeholder="Type your name">`; $('startBtn').before(box); const inp = $('nameIn'); inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && !$('startBtn').disabled) $('startBtn').click(); }); setTimeout(() => inp.focus(), 50); }
const playerName = () => state.name || 'Contestant';
$('startBtn').addEventListener('click', () => { if (needName && !state.flags.named) { const v = ($('nameIn').value || '').replace(/[<>&"]/g, '').trim(); state.name = v || 'Contestant'; state.flags.named = true; $('nameBox').remove(); saveGame(); } AU.init(); AU.setFloor(FLOOR);
  if (FLOOR === '0' && !QS.has('nointro') && ((!LOADED && !state.flags.introSeen) || QS.has('intro') || HASH === 'intro')) { $('loading').style.display = 'none'; state.flags.introSeen = true; saveGame(); intro = playIntro({ name: playerName(), say: (t, w, p, o) => AU.say(t, w, p, o), sfx: (n) => SFX(n), music: (m) => AU.setMood(m), onDone: () => { AU.stopSpeech(); intro = null; startPlaying(); ui.host(`Welcome to the Landing, ${playerName()}! This is orientation. Talk to Pip at the desk. Pip is an intern. Be gentle.`); beginTutorial(); } }); return; }
  $('loading').style.display = 'none'; started = true; $('stage').requestPointerLock(); ui.host(FLOOR === '3' ? 'Welcome to the Soup District! Everything is delicious and one in five things is cursed. Bon appétit!' : FLOOR === 'pad' ? 'Your Crash Pad! Buy tables, craft weird things, and remember: tables next to each other can work together.' : FLOOR === '2' ? 'Welcome to Spin City! Mind the floor, it\u2019s wet. Everything is wet. Forever.' : `Welcome back to the Undercroft, ${playerName()}! Try not to die before the commercial break.`); });
boot().catch((e) => { $('loadMsg').textContent = 'Error: ' + e.message; console.error(e); });
window.addEventListener('beforeunload', saveGame);
window.__swing = () => primary(); window.__game = { state, P, mobs, cast, ui, G, CR, craftUI, throwBomb, saveGame, MS, DEF, NPCS, STORY, AU, use, ink, world: () => world };
