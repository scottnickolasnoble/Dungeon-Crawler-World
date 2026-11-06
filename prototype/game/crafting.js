// Crafting: tables you buy for your Crash Pad, materials, ~60 recipes that chain across tables,
// adjacency combos, imbuing existing gear, crafting levels and quality rolls. Includes the crafting UI.
import { RARITIES, SLOT_NAMES, STAT_LABEL } from './data.js';
import { icon } from './ui.js';
import { generateRecipes, extraMaterialRecipes, MATS_EXTRA } from './recipes_gen.js';
import { artImg } from './lootart.js';

// cost in gold; floor = first floor whose table seller stocks it (every floor's hub has one)
export const TABLES = {
  workbench: { name: 'Workbench', cost: 0, floor: 1, color: '#c8a070', stat: 'STR', desc: 'Scrap processing, repairs, tools, smelting.' },
  anvil: { name: "Weaponsmith's Anvil", cost: 400, floor: 1, color: '#9aa0aa', stat: 'STR', desc: 'Blades, clubs, axes, spears and junk weapons.' },
  armourer: { name: "Armourer's Bench", cost: 400, floor: 1, color: '#7a8aa0', stat: 'STR', desc: 'Helmets, chest, legs, boots, shields, bracers.' },
  boom: { name: 'Boom Bench', cost: 650, floor: 2, color: '#ff6a2a', stat: 'DEX', desc: 'Grenades, mines, sticky bombs, fireworks.' },
  alchemy: { name: 'Alchemy Lab', cost: 600, floor: 1, color: '#5ad86a', stat: 'INT', desc: 'Potions, oils, poisons, gunpowder, reagents.' },
  stove: { name: 'Cookstove', cost: 150, floor: 1, color: '#ffb040', stat: 'WIS', desc: 'Meals and drinks: buffs plus Hunger and Thirst.' },
  tailor: { name: "Tailor's Station", cost: 300, floor: 1, color: '#c86aa8', stat: 'DEX', desc: 'Cloth and leather armour, cloaks, bags, straps.' },
  tinker: { name: "Tinker's Bench", cost: 1200, floor: 2, color: '#3ac8ff', stat: 'DEX', desc: 'Traps, turrets, gadgets.' },
  jeweller: { name: "Jeweller's Loupe", cost: 1100, floor: 2, color: '#e83a8a', stat: 'CHA', desc: 'Rings, amulets, cut gems.' },
  font: { name: 'Imbuing Font', cost: 2500, floor: 3, color: '#b46cff', stat: 'INT', desc: 'Imbue elements, add affixes to existing gear.' },
  still: { name: 'Water Still', cost: 120, floor: 1, color: '#3a9aff', stat: 'WIS', desc: 'Clean water, ice, holy water.' },
  scribe: { name: "Scribe's Desk", cost: 1500, floor: 3, color: '#d8c8a0', stat: 'INT', desc: 'Scrolls (one-shot spells), maps.' },
};
export const MATS = {
  scrapmetal: 'Scrap Metal', plastic: 'Plastic', wire: 'Wire', rubber: 'Rubber', glass: 'Glass Shard', cloth: 'Rag Cloth', coneplastic: 'Cone Plastic', gristle: 'Goblin Gristle', hide: 'Goblin Hide', bonedust: 'Wight Bone Dust',
  lampreymeat: 'Lamprey Meat', mysterymeat: 'Mystery Meat', mushroom: 'Mushroom', herbs: 'Floor Herbs', sulphur: 'Sulphur', saltpetre: 'Saltpetre', charcoal: 'Charcoal', salt: 'Salt', dirtywater: 'Dirty Water', grease: 'Grease', battery: 'Battery', spring: 'Mimic Spring', glue: 'Glue', paper: 'Paper', ink: 'Ink', roughruby: 'Rough Ruby', roughsapphire: 'Rough Sapphire',
  ember: 'Ember Essence', frost: 'Frost Essence', storm: 'Storm Essence', tide: 'Tide Essence', light: 'Light Essence', shadow: 'Shadow Essence',
  // components (made at tables)
  steel: 'Steel Ingot', strap: 'Leather Strap', gunpowder: 'Gunpowder', burnoil: 'Burning Oil', frostoil: 'Frost Oil', poison: 'Gristle Poison', cleanwater: 'Clean Water', ruby: 'Cut Ruby', sapphire: 'Cut Sapphire', circuit: 'Jury-Rigged Circuit', bolt: 'Bolts & Screws', fabric: 'Treated Fabric', vial: 'Glass Vial', ice: 'Ice', holywater: 'Holy Water',
};
Object.assign(MATS, MATS_EXTRA);
// rarity materials (scrap an item of that rarity, or a rare monster drop) and floor materials
Object.assign(MATS, { tempered: 'Tempered Scrap', bluechip: 'Blue-Chip Alloy', primetime: 'Prime-Time Crystal', showstopper: 'Showstopper Core',
  lint: 'Lint Felt', detergent: 'Detergent Crystal', stock: 'Bone Stock', castiron: 'Cast Iron', neon: 'Neon Tube', glitter: 'Mall Glitter', clippings: 'Lawn Clippings', ceramic: 'Gnome Ceramic', sap: 'Canopy Sap', chitin: 'Hornback Chitin' });
export const MAT_RARITY = { tempered: 'uncommon', bluechip: 'rare', primetime: 'epic', showstopper: 'legendary' };
// r(table, tier, name, inputs, out, extra)
const R = (table, tier, name, inputs, out, extra = {}) => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '_'), table, tier, name, inputs, out, cat: extra.cat || (out.mat ? 'Component' : out.gear ? 'Gear' : out.imbue ? 'Imbue' : 'Consumable'), ...extra });
const C = (name, effect, host, extra = {}) => ({ cons: { name, effect, host, ...extra } });
const Gr = (slot, name, stats, family = 'crafted') => ({ gear: { slot, name, stats, family } });
export const RECIPES = [
  // WORKBENCH: processing + basics
  R('workbench', 1, 'Steel Ingot', { scrapmetal: 3 }, { mat: 'steel', n: 1 }), R('workbench', 1, 'Bolts & Screws', { scrapmetal: 1 }, { mat: 'bolt', n: 3 }), R('workbench', 1, 'Glass Vial', { glass: 2 }, { mat: 'vial', n: 2 }),
  R('workbench', 1, 'Charcoal', { cloth: 1, plastic: 1 }, { mat: 'charcoal', n: 2 }), R('workbench', 1, 'Glue', { rubber: 1, gristle: 1 }, { mat: 'glue', n: 2 }), R('workbench', 1, 'Paper', { cloth: 2 }, { mat: 'paper', n: 3 }),
  R('workbench', 2, 'Jury-Rigged Circuit', { wire: 2, battery: 1, bolt: 2 }, { mat: 'circuit', n: 1 }),
  R('workbench', 1, 'Scrap Torch', { cloth: 1, grease: 1, scrapmetal: 1 }, Gr('off', 'Scrap Torch', { light: 1, fire: 3 })),
  // ANVIL: weapons
  R('anvil', 1, 'Rebar Spear', { steel: 2, wire: 1 }, { gear: { ...Gr('main', 'Rebar Spear', { dmg: 16, atkSpeed: 2 }, 'scrap').gear, wtype: 'pierce' } }), R('anvil', 1, 'Stop-Sign Axe', { steel: 1, scrapmetal: 3, strap: 1 }, { gear: { ...Gr('main', 'Stop-Sign Axe', { dmg: 20 }, 'scrap').gear, wtype: 'heavy' } }),
  R('anvil', 1, 'Pipe Wrench', { steel: 2, rubber: 1 }, { gear: { ...Gr('main', 'Pipe Wrench', { dmg: 15, STR: 1 }, 'work').gear, wtype: 'blunt' } }), R('anvil', 2, 'Hubcap Chakram', { steel: 2, bolt: 4 }, { gear: { ...Gr('main', 'Hubcap Chakram', { dmg: 18, crit: 3 }, 'scrap').gear, wtype: 'blade' } }),
  R('anvil', 2, 'Lighter Staff', { steel: 1, plastic: 2, ember: 1 }, { gear: { ...Gr('main', 'Lighter Staff', { spell: 16, fire: 5 }, 'elemental').gear, wtype: 'caster' } }), R('anvil', 3, 'Ember-Forged Blade', { steel: 4, ember: 3, strap: 1 }, { gear: { ...Gr('main', 'Ember-Forged Blade', { dmg: 28, fire: 8 }, 'elemental').gear, wtype: 'hot' } }, { needs: 'font' }),
  // ARMOURER
  R('armourer', 1, 'Hubcap Pauldrons', { steel: 1, scrapmetal: 2, strap: 1 }, Gr('shoulders', 'Hubcap Pauldrons', { armor: 9 }, 'scrap')), R('armourer', 1, 'Car-Door Shield', { steel: 2, scrapmetal: 3, strap: 1 }, Gr('off', 'Car-Door Shield', { block: 14, armor: 7 }, 'scrap')),
  R('armourer', 1, 'Cone Helm', { coneplastic: 4, strap: 1 }, Gr('head', 'Cone Helm', { armor: 7, CHA: 1 }, 'scrap')), R('armourer', 2, 'Seatbelt Bracers', { strap: 2, bolt: 2 }, Gr('bracers', 'Seatbelt Bracers', { block: 5, atkSpeed: 2 }, 'scrap')),
  R('armourer', 2, 'Riveted Chestplate', { steel: 3, strap: 2, bolt: 4 }, Gr('chest', 'Riveted Chestplate', { armor: 18, CON: 2 }, 'work')), R('armourer', 2, 'Steel-Toe Boots', { steel: 1, rubber: 2, strap: 1 }, Gr('boots', 'Steel-Toe Boots', { armor: 8, moveSpeed: 2 }, 'work')),
  // TAILOR
  R('tailor', 1, 'Leather Strap', { hide: 1 }, { mat: 'strap', n: 2 }), R('tailor', 1, 'Treated Fabric', { cloth: 2, glue: 1 }, { mat: 'fabric', n: 1 }),
  R('tailor', 1, 'Rag Cloak', { cloth: 4, strap: 1 }, Gr('back', 'Rag Cloak', { dodge: 3 }, 'scrap')), R('tailor', 1, 'Cargo Shorts', { fabric: 2, bolt: 1 }, Gr('legs', 'Cargo Shorts of Holding', { armor: 5, carry: 15 }, 'scrap')),
  R('tailor', 2, 'Spellweave Robe', { fabric: 3, ember: 1 }, Gr('chest', 'Spellweave Robe', { armor: 6, INT: 3, mana: 15 }, 'arcane')), R('tailor', 2, 'Tool Belt', { strap: 3, bolt: 2 }, Gr('belt', 'Tool Belt', { potionSlots: 2, carry: 10 }, 'work')),
  R('tailor', 2, 'Small Bag of Holding', { fabric: 4, strap: 1, wire: 1 }, C('Small Bag of Holding', { bag: 8 }, 'More room for garbage. Living the dream.')),
  // ALCHEMY
  R('alchemy', 1, 'Gunpowder', { sulphur: 2, saltpetre: 1, charcoal: 1 }, { mat: 'gunpowder', n: 2 }), R('alchemy', 1, 'Health Potion', { herbs: 2, cleanwater: 1, vial: 1 }, C('Health Potion (Crafted)', { hp: 60 }, 'Homemade. Probably fine.')),
  R('alchemy', 1, 'Mana Potion', { mushroom: 2, cleanwater: 1, vial: 1 }, C('Mana Potion (Crafted)', { mana: 70 }, 'Glows. That is a good sign. Usually.')), R('alchemy', 1, 'Burning Oil', { ember: 1, grease: 1, vial: 1 }, { mat: 'burnoil', n: 1 }),
  R('alchemy', 2, 'Frost Oil', { frost: 1, grease: 1, vial: 1 }, { mat: 'frostoil', n: 1 }), R('alchemy', 2, 'Gristle Poison', { gristle: 3, mushroom: 1, vial: 1 }, { mat: 'poison', n: 1 }),
  R('alchemy', 2, 'Tonic of Mild Genius', { mushroom: 3, light: 1, vial: 1 }, C('Tonic of Mild Genius', { buff: 'INT', amount: 3, mins: 20 }, 'You feel smarter. You are not.')),
  // ALCHEMY + STOVE adjacency: potion-food
  R('stove', 2, 'Spicy Ember Chili', { mysterymeat: 2, mushroom: 1, burnoil: 1 }, C('Spicy Ember Chili', { hunger: 45, buff: 'fire', amount: 10, mins: 15 }, 'Your mouth is now a Pyromancer too.'), { needs: 'alchemy', cat: 'Combo' }),
  // BOOM BENCH
  R('boom', 1, 'Cone Grenade', { coneplastic: 1, gunpowder: 1, wire: 1 }, C('Cone Grenade', { bomb: 'cone', dmg: 60, radius: 3.5 }, 'Throw it. Then run. In that order.')),
  R('boom', 1, 'Sticky Mine', { gunpowder: 2, spring: 1, glue: 1 }, C('Sticky Mine', { bomb: 'mine', dmg: 90, radius: 3 }, 'Sticks to anything. Including you.')),
  R('boom', 1, 'Firework Rocket', { gunpowder: 1, paper: 2 }, C('Firework Rocket', { bomb: 'firework', dmg: 25, radius: 5, fans: 30 }, 'The audience loves a show.')),
  R('boom', 2, 'Firebomb', { gunpowder: 1, burnoil: 1, glass: 1 }, C('Firebomb', { bomb: 'fire', dmg: 50, radius: 4, burn: 5 }, 'Molotov, but make it artisanal.'), { needs: 'alchemy', cat: 'Combo' }),
  R('boom', 2, 'Frost Grenade', { gunpowder: 1, frostoil: 1, glass: 1 }, C('Frost Grenade', { bomb: 'frost', dmg: 40, radius: 4, freeze: 2 }, 'Chill out. Permanently.'), { needs: 'alchemy', cat: 'Combo' }),
  R('boom', 3, 'Breaching Charge', { gunpowder: 4, steel: 1, circuit: 1 }, C('Breaching Charge', { bomb: 'breach', dmg: 200, radius: 6 }, 'For doors. And problems shaped like doors.')),
  // STOVE
  R('stove', 1, 'Lamprey Jerky', { lampreymeat: 1, salt: 1 }, C('Lamprey Jerky', { hunger: 30, thirst: 5 }, 'Chewy. Like a tyre, but meatier.')), R('stove', 1, 'Goblin Gristle Kebab', { gristle: 2, charcoal: 1 }, C('Gristle Kebab', { hunger: 25, buff: 'STR', amount: 1, mins: 10 }, 'Crunchy in all the wrong places.')),
  R('stove', 1, 'Hag Stew', { mysterymeat: 1, mushroom: 2, cleanwater: 1 }, C('Hag Stew', { hunger: 40, buff: 'STR', amount: 2, mins: 20 }, 'Grandma would be proud. Grandma would also eat you.')),
  R('stove', 1, 'Mushroom Tea', { mushroom: 1, cleanwater: 1 }, C('Mushroom Tea', { thirst: 30, mana: 20 }, 'Earthy. Possibly hallucinogenic.')), R('stove', 2, 'Survival Ration', { mysterymeat: 1, herbs: 1, salt: 1, paper: 1 }, C('Survival Ration', { hunger: 50, thirst: 10 }, 'Never spoils. Never tastes good either.')),
  // STILL
  R('still', 1, 'Clean Water', { dirtywater: 2 }, { mat: 'cleanwater', n: 2 }), R('still', 1, 'Bottled Water', { cleanwater: 1, vial: 1 }, C('Bottled Water', { thirst: 40 }, 'Distilled from questionable sources.')),
  R('still', 2, 'Ice', { cleanwater: 2, frost: 1 }, { mat: 'ice', n: 3 }), R('still', 3, 'Holy Water', { cleanwater: 2, light: 1, vial: 1 }, { mat: 'holywater', n: 1 }),
  // TINKER
  R('tinker', 1, 'Spring Trap', { spring: 1, steel: 1, bolt: 2 }, C('Spring Trap', { bomb: 'trap', dmg: 45, radius: 2, root: 3 }, 'Snap!')), R('tinker', 2, 'Spark Turret', { circuit: 1, spring: 1, storm: 1, steel: 1 }, C('Spark Turret', { turret: 'spark', dmg: 12, secs: 20 }, 'It zaps things. Mostly enemies.')),
  R('tinker', 2, 'Grappling Hook', { steel: 1, wire: 3, spring: 1 }, Gr('off', 'Grappling Hook', { moveSpeed: 4 }, 'work')), R('tinker', 3, 'Flame Turret', { circuit: 1, burnoil: 2, steel: 2 }, C('Flame Turret', { turret: 'flame', dmg: 18, secs: 20 }, 'Fire and forget. Mostly fire.'), { needs: 'font', cat: 'Combo' }),
  // JEWELLER
  R('jeweller', 1, 'Cut Ruby', { roughruby: 1 }, { mat: 'ruby', n: 1 }), R('jeweller', 1, 'Cut Sapphire', { roughsapphire: 1 }, { mat: 'sapphire', n: 1 }),
  R('jeweller', 1, 'Washer Ring', { bolt: 3, wire: 1 }, Gr('ring1', 'Washer Ring', { CON: 2 }, 'scrap')), R('jeweller', 2, 'Ruby Ring', { steel: 1, ruby: 1 }, Gr('ring1', 'Ruby Ring', { fire: 7, INT: 1 }, 'elemental')),
  R('jeweller', 2, 'Sapphire Amulet', { steel: 1, sapphire: 1, wire: 1 }, Gr('amulet', 'Sapphire Amulet', { mana: 25, WIS: 2 }, 'arcane')),
  // FONT: imbues on existing gear (targets chosen in the UI)
  R('font', 1, 'Imbue: Flame', { ember: 3 }, { imbue: { target: 'any', add: { fire: 8 }, tag: 'Imbued: Flame' } }), R('font', 1, 'Imbue: Frost', { frost: 3 }, { imbue: { target: 'any', add: { frost: 8 }, tag: 'Imbued: Frost' } }),
  R('font', 2, 'Imbue: Fortitude', { light: 2, steel: 1 }, { imbue: { target: 'any', add: { hp: 25, CON: 2 }, tag: 'Imbued: Fortitude' } }), R('font', 2, 'Coat with Burning Oil', { burnoil: 1 }, { imbue: { target: 'weapon', add: { fire: 12 }, tag: 'Oiled: Burning' } }, { needs: 'alchemy', cat: 'Combo' }),
  R('font', 2, 'Socket: Ruby', { ruby: 1 }, { imbue: { target: 'any', add: { fire: 6, crit: 2 }, tag: 'Socketed: Ruby' } }, { needs: 'jeweller', cat: 'Combo' }), R('font', 3, 'Imbue: Kindling', { ember: 4, light: 1 }, { imbue: { target: 'any', add: { skill_fire: 1 }, tag: 'Imbued: Kindling' } }),
  // SCRIBE
  R('scribe', 1, 'Scroll of Fireball', { paper: 1, ink: 1, ember: 1 }, C('Scroll of Fireball', { scroll: 'fireball' }, 'Reading is fundamental. And explosive.')), R('scribe', 1, 'Ink', { charcoal: 1, cleanwater: 1 }, { mat: 'ink', n: 3 }),
  R('scribe', 2, 'Treasure Map', { paper: 2, ink: 1, shadow: 1 }, C('Treasure Map', { map: 1 }, 'X marks the spot. The spot is probably a trap.')),
];
// floor materials turn into components, and rarity materials can be refined up (expensively) or broken down
RECIPES.push(
  R('workbench', 1, 'Smelt Cast Iron', { castiron: 3 }, { mat: 'steel', n: 2 }), R('workbench', 1, 'Sap Glue', { sap: 2 }, { mat: 'glue', n: 3 }), R('workbench', 2, 'Neon Ballast', { neon: 2, wire: 1 }, { mat: 'light', n: 1 }),
  R('workbench', 2, 'Refine Tempered Scrap', { scrapmetal: 10, steel: 2 }, { mat: 'tempered', n: 1 }), R('workbench', 1, 'Break Down Blue-Chip Alloy', { bluechip: 1 }, { mat: 'tempered', n: 3 }), R('workbench', 3, 'Refine Blue-Chip Alloy', { tempered: 6, alloy: 1 }, { mat: 'bluechip', n: 1 }),
  R('tailor', 1, 'Lint Felt Padding', { lint: 3 }, { mat: 'fabric', n: 2 }), R('alchemy', 1, 'Detergent Solvent', { detergent: 2, dirtywater: 1 }, { mat: 'grease', n: 2 }), R('alchemy', 1, 'Clippings Mash', { clippings: 3 }, { mat: 'herbs', n: 2 }),
  R('stove', 1, 'Bone Broth', { stock: 2, cleanwater: 1 }, C('Bone Broth', { hunger: 35, thirst: 20, hp: 25 }, 'Soup District comfort food. Do not ask whose bones.')),
  R('jeweller', 1, 'Glitter Gem', { glitter: 4, glue: 1 }, { mat: 'roughsapphire', n: 1 }), R('armourer', 2, 'Ceramic Plating', { ceramic: 3, glue: 1 }, { mat: 'steel', n: 2 }), R('armourer', 3, 'Chitin Plate', { chitin: 3, strap: 1 }, { mat: 'alloy', n: 1 }),
);
RECIPES.push(...extraMaterialRecipes(R)); RECIPES.push(...generateRecipes(RECIPES, R, C, Gr));
export const TIER_CAP_UI = [2, 3, 4, 5, 5]; // highest rarity index each table tier can produce
export const MAX_TIER = 5; const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
export const QUALITY = [['Crude', 0.8, '#9a9a9a'], ['Standard', 1, '#f4eedc'], ['Fine', 1.15, '#5ad86a'], ['Masterwork', 1.3, '#4a9aff'], ['Legendary', 1.5, '#ff9a2a']];

// ---------------- logic ----------------
export function createCrafting(G) {
  const S = G.state;
  S.mats = S.mats || {}; S.tables = S.tables || { workbench: { tier: 1, slot: 0 } }; S.craftXP = S.craftXP || {};
  const have = (m) => S.mats[m] || 0;
  const craftLevel = (t) => 1 + Math.floor(Math.sqrt((S.craftXP[t] || 0) / 10));
  const adjacent = (a, b) => { if (!S.tables[a] || !S.tables[b]) return false; const d = Math.abs(S.tables[a].slot - S.tables[b].slot); return d === 1 || d === 9; };
  function canCraft(r) {
    const t = S.tables[r.table]; if (!t || t.tier < r.tier) return { ok: false, why: !t ? 'Buy this table' : `Needs Tier ${r.tier}` };
    if (r.needs && !adjacent(r.table, r.needs)) return { ok: false, why: `Place next to: ${TABLES[r.needs].name}` };
    for (const [m, n] of Object.entries(r.inputs)) if (have(m) < n) return { ok: false, why: `Missing ${MATS[m]}` };
    return { ok: true };
  }
  // quality roll: table tier, crafting level and the table's stat push it up; top quality is rare even at Tier V
  function rollQuality(table) { const t = S.tables[table].tier, lv = craftLevel(table), st = G.derived().gearStats[TABLES[table].stat] || 0; const score = Math.random() * 100 + t * 6 + Math.min(lv, 12) * 1.5 + Math.min(40, S.base[TABLES[table].stat] + st) * 0.4 - 25; return score > 112 ? 4 : score > 80 ? 3 : score > 50 ? 2 : score > 18 ? 1 : 0; }
  // what rarity a crafted item can reach: Tier I uncommon, II rare, III-IV epic, legendary only at Tier IV-V on a top-quality roll
  const TIER_CAP = [2, 3, 4, 5, 5];
  function craftedRarity(q, tier) { let idx = [1, 1, 2, 3, 4][q]; if (q === 4 && tier >= 4) idx = 5; return RARITIES[Math.min(idx, TIER_CAP[tier - 1])].id; }
  function craft(r, target) {
    const chk = canCraft(r); if (!chk.ok) return G.toast(chk.why, '#E5484D');
    if (r.out.imbue && !target) return G.toast('Choose an item to imbue', '#E5484D');
    for (const [m, n] of Object.entries(r.inputs)) S.mats[m] -= n;
    S.craftXP[r.table] = (S.craftXP[r.table] || 0) + 8 * r.tier;
    let msg = '';
    if (r.out.mat) { S.mats[r.out.mat] = have(r.out.mat) + r.out.n; msg = `+${r.out.n} ${MATS[r.out.mat]}`; }
    else if (r.out.cons) { S.inv.push({ uid: Math.floor(Math.random() * 1e9), kind: 'consumable', rarity: 'uncommon', crafted: true, ...r.out.cons }); if (r.out.cons.effect.bag) { S.bagBonus = (S.bagBonus || 0); } msg = r.out.cons.name; }
    else if (r.out.gear) { const q = rollQuality(r.table), [qn, qm, qc] = QUALITY[q]; const g = r.out.gear; const stats = {}; for (const [k, v] of Object.entries(g.stats)) stats[k] = Math.max(1, Math.round(v * qm * (1 + 0.1 * (S.tables[r.table].tier - 1)))); if (q >= 3) { const bonus = ['INT', 'CON', 'crit', 'fire', 'hp'][Math.floor(Math.random() * 5)]; stats[bonus] = (stats[bonus] || 0) + (bonus === 'hp' ? 20 : 3); }
      const rar = craftedRarity(q, r.tier);
      S.inv.push({ uid: Math.floor(Math.random() * 1e9), kind: 'gear', slot: g.slot, name: `${qn === 'Standard' ? '' : qn + ' '}${g.name}`, rarity: rar, family: g.family, ...(g.wtype ? { wtype: g.wtype } : g.slot === 'main' && g.stats.dmg ? { wtype: 'blunt' } : {}), level: Math.max(S.level, r.tier * 4), stats, tags: ['Forged'], quality: qn, crafted: true, host: q >= 3 ? 'Handmade! The audience applauds your arts and crafts.' : 'Handmade. You can tell.', value: 20 * (q + 1) });
      msg = `<span style="color:${qc}">${qn}</span> ${g.name}`; }
    else if (r.out.imbue) { const im = r.out.imbue; for (const [k, v] of Object.entries(im.add)) target.stats[k] = (target.stats[k] || 0) + v; target.tags = [...(target.tags || []), im.tag]; if (!/★/.test(target.name) && target.tags.length >= 3) target.name = target.name + ' ★'; target.host = `${im.tag}. Now it does more stuff. Science!`; msg = `${target.name}: ${im.tag}`; }
    G.toast(`<div class="ta">CRAFTED</div>${msg}<div class="sm">${TABLES[r.table].name} · crafting Lv ${craftLevel(r.table)}</div>`, TABLES[r.table].color, 3000);
    G.onCraft && G.onCraft(r);
    return true;
  }
  S.tableStock = S.tableStock || [];
  const owns = (id) => !!S.tables[id] || S.tableStock.includes(id);
  // bought from a table merchant: delivered to your Crash Pad, install it in any empty slot there
  function buyTable(id, price) { const T = TABLES[id]; if (owns(id)) return G.toast('You already own that table', '#E5484D'); const cost = price ?? T.cost; if (S.gold < cost) return G.toast(`Need ${cost} gold`, '#E5484D'); S.gold -= cost; S.tableStock.push(id); G.toast(`<div class="ta">TABLE BOUGHT</div>${T.name}<div class="sm">Delivered to your Crash Pad. Install it in an empty slot (E).</div>`, T.color, 3500); G.onTables && G.onTables(); return true; }
  function installTable(id, slot) { const k = S.tableStock.indexOf(id); if (k < 0) return; if (Object.values(S.tables).some((t) => t.slot === slot)) return G.toast('Slot taken', '#E5484D'); S.tableStock.splice(k, 1); S.tables[id] = { tier: (S.tableTiers && S.tableTiers[id]) || 1, slot }; G.toast(`<div class="ta">TABLE INSTALLED</div>${TABLES[id].name} in slot ${slot + 1}`, TABLES[id].color); G.onTables && G.onTables(); }
  function packTable(id) { if (!S.tables[id]) return; S.tableTiers = S.tableTiers || {}; S.tableTiers[id] = S.tables[id].tier; delete S.tables[id]; S.tableStock.push(id); G.toast(`${TABLES[id].name} packed up. Install it in another slot to move it.`, TABLES[id].color); G.onTables && G.onTables(); }
  const upgradeCost = (id) => { const t = S.tables[id].tier; const base = TABLES[id].cost || 80; return { gold: Math.round(base * 0.7 * t + 80 * t * t), mats: [{ steel: 2, bolt: 4, tempered: 3 }, { steel: 4, circuit: 1, ember: 2, bluechip: 2 }, { alloy: 2, circuit: 2, gearbox: 1, primetime: 2 }, { alloy: 4, prism: 1, bosscore: 1, showstopper: 1 }][t - 1] || {} }; };
  function upgradeTable(id) { const t = S.tables[id]; if (!t || t.tier >= MAX_TIER) return; const c = upgradeCost(id); if (S.gold < c.gold) return G.toast(`Need ${c.gold} gold`, '#E5484D'); for (const [m, n] of Object.entries(c.mats)) if (have(m) < n) return G.toast(`Need ${n} ${MATS[m]}`, '#E5484D'); S.gold -= c.gold; for (const [m, n] of Object.entries(c.mats)) S.mats[m] -= n; t.tier++; G.toast(`${TABLES[id].name} upgraded to Tier ${ROMAN[t.tier - 1]}`, TABLES[id].color); }
  return { have, canCraft, craft, buyTable, installTable, packTable, owns, upgradeTable, upgradeCost, craftLevel, adjacent };
}

// ---------------- UI ----------------
// The panel shows ONE table: its upgrades and its own 60 recipes. An empty slot shows the install screen.
export function createCraftUI(G, CR) {
  const S = G.state, $ = (id) => document.getElementById(id);
  let table = null, sel = null, filter = 'all', target = null, slot = null;
  function open(t, sl = null) { table = t; slot = sl; sel = null; target = null; filter = 'all'; render(); }
  function render() {
    if (!table) return renderInstall();
    $('craftInstall').style.display = 'none'; $('craftMain').style.display = '';
    const T = TABLES[table], t = S.tables[table]; if (!t) { table = null; return renderInstall(); }
    $('craftTitle').innerHTML = `<span style="color:${T.color}">${T.name.toUpperCase()}</span>`;
    let head = `<div class="hrow"><div><div class="sm">${T.desc} Quality uses ${T.stat}. Crafting Lv ${CR.craftLevel(table)}.</div>`;
    const nb = Object.keys(TABLES).filter((id) => id !== table && CR.adjacent(table, id)).map((id) => TABLES[id].name); head += `<div class="sm">Next to: ${nb.length ? nb.join(', ') : 'nothing'} · combo recipes (⇄) need the right neighbour</div></div>`;
    head += `<div class="tierPips">${ROMAN.map((r, i) => `<span class="pip ${i < t.tier ? 'on' : ''}" style="--c:${T.color}">${r}</span>`).join('')}</div></div>`;
    if (t.tier < MAX_TIER) { const c = CR.upgradeCost(table); const okM = Object.entries(c.mats).every(([m, n]) => CR.have(m) >= n); head += `<div class="buy">Upgrade to Tier ${ROMAN[t.tier]}: <b>${c.gold} g</b> + ${Object.entries(c.mats).map(([m, n]) => `<span class="${CR.have(m) >= n ? 'have' : 'miss'}">${n} ${MATS[m]}</span>`).join(', ')} <button class="cbtn" id="upBtn" ${S.gold >= c.gold && okM ? '' : 'disabled'}>UPGRADE</button><span style="flex:1"></span><button class="cbtn ghost" id="packBtn">PACK UP (MOVE)</button></div>`; }
    else head += `<div class="buy">Fully upgraded. <span style="flex:1"></span><button class="cbtn ghost" id="packBtn">PACK UP (MOVE)</button></div>`;
    head += `<div class="sm" style="margin-top:4px">Not sure what you need or where to find it? <button class="cbtn ghost" id="guideBtn">CRAFTING GUIDE (N)</button></div>`;
    $('craftHead').innerHTML = head; $('guideBtn').onclick = () => G.openGuide && G.openGuide();
    if ($('upBtn')) $('upBtn').onclick = () => { CR.upgradeTable(table); render(); };
    $('packBtn').onclick = () => { CR.packTable(table); G.closeCraft && G.closeCraft(); };
    const mine = RECIPES.filter((r) => r.table === table);
    $('craftFilter').innerHTML = [['all', `ALL ${mine.length}`], ['can', 'CAN MAKE'], ...ROMAN.map((r, i) => [String(i + 1), `TIER ${r}`]), ['Combo', 'COMBO ⇄']].map(([f, l]) => `<button data-f="${f}" class="${filter === f ? 'on' : ''}">${l}</button>`).join('');
    document.querySelectorAll('#craftFilter button').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; render(); }));
    const list = mine.filter((r) => filter === 'all' || (filter === 'can' && CR.canCraft(r).ok) || (filter === 'Combo' && r.needs) || String(r.tier) === filter);
    let lastTier = 0; $('recipeList').innerHTML = list.map((r) => { const c = CR.canCraft(r); const hdr = r.tier !== lastTier ? `<div class="tierHdr ${t.tier >= r.tier ? '' : 'locked'}">TIER ${ROMAN[r.tier - 1]}${t.tier >= r.tier ? '' : ' · upgrade to unlock'}</div>` : ''; lastTier = r.tier; return `${hdr}<button class="rrow ${sel === r ? 'on' : ''} ${c.ok ? 'ok' : ''} ${t.tier < r.tier ? 'lock' : ''}" data-r="${r.id}"><span>${r.name}</span><span class="rt">${r.cat}${r.needs ? ' ⇄' : ''}</span></button>`; }).join('') || '<div class="sm" style="padding:10px">Nothing matches.</div>';
    document.querySelectorAll('#recipeList .rrow').forEach((b) => b.addEventListener('click', () => { sel = mine.find((r) => r.id === b.dataset.r); target = null; render(); }));
    renderDetail();
    $('matList').innerHTML = Object.entries(S.mats).filter(([, n]) => n > 0).sort((a, b) => (MATS[a[0]] || a[0]).localeCompare(MATS[b[0]] || b[0])).map(([m, n]) => `<span class="mat">${MATS[m] || m} <b>${n}</b></span>`).join('') || '<span class="sm">No materials. Kill mobs, scrap gear (right-click in inventory), loot camps.</span>';
    $('craftGold').textContent = `${S.gold} gold`;
  }
  function renderInstall() {
    $('craftMain').style.display = 'none'; const el = $('craftInstall'); el.style.display = '';
    $('craftTitle').textContent = `EMPTY SLOT ${slot === null ? '' : slot + 1}`; $('craftGold').textContent = `${S.gold} gold`;
    const stock = S.tableStock || [];
    el.innerHTML = stock.length ? `<div class="sm" style="margin-bottom:8px">Tables you own that aren't installed. Pick one for this slot. Neighbouring tables unlock combo recipes.</div><div class="stockGrid">${stock.map((id) => `<button class="stock" data-t="${id}" style="border-color:${TABLES[id].color}"><b style="color:${TABLES[id].color}">${TABLES[id].name}</b><span>${TABLES[id].desc}</span><span class="sm">${RECIPES.filter((r) => r.table === id).length} recipes · combos with ${[...new Set(RECIPES.filter((r) => r.table === id && r.needs).map((r) => TABLES[r.needs].name))].join(', ') || 'none'}</span><i>INSTALL HERE</i></button>`).join('')}</div>`
      : `<div class="emptyStock"><b>No tables in storage.</b><br>Buy tables from <b>Benchwright Bo</b> in Stairwell Camp (Floor 1) or <b>Bev</b> at the Laundromat (Floor 2). They're delivered here.</div>`;
    el.querySelectorAll('.stock').forEach((b) => b.addEventListener('click', () => { CR.installTable(b.dataset.t, slot); open(b.dataset.t, null); }));
  }
  function renderDetail() {
    const d = $('recipeDetail'); if (!sel) { d.innerHTML = '<div class="sm" style="padding:10px">Pick a recipe. Higher tiers need upgrades and rarer materials: components from other tables, essences, Reinforced Alloy and Boss Cores.</div>'; return; }
    const c = CR.canCraft(sel); const o = sel.out;
    let res = o.mat ? `${o.n}× ${MATS[o.mat]} <span class="sm">(component for other tables)</span>` : o.cons ? `${o.cons.name}<div class="sm">${Object.entries(o.cons.effect).map(([k, v]) => `${k}: ${v}`).join(' · ')}</div>` : o.gear ? `${o.gear.name} <span class="sm">(${SLOT_NAMES[o.gear.slot]})</span><div class="sm">${Object.entries(o.gear.stats).map(([k, v]) => `+${v} ${STAT_LABEL[k] || k}`).join(' · ')} · quality rolls Crude → Legendary · best rarity at this tier: <b style="color:${RARITIES[TIER_CAP_UI[sel.tier - 1]].color}">${RARITIES[TIER_CAP_UI[sel.tier - 1]].name}</b>${sel.tier >= 4 ? ' (legendary needs a top roll)' : ''}</div>` : `${o.imbue.tag}<div class="sm">Adds ${Object.entries(o.imbue.add).map(([k, v]) => `+${v} ${STAT_LABEL[k] || k}`).join(', ')} to an existing ${o.imbue.target === 'weapon' ? 'weapon' : 'item'}. 3 finishing passes earn a ★.</div>`;
    const prev = o.gear ? { uid: sel.id.length * 977 + sel.tier, kind: 'gear', slot: o.gear.slot, name: o.gear.name, family: o.gear.family, stats: o.gear.stats, rarity: RARITIES[TIER_CAP_UI[sel.tier - 1]].id } : o.cons ? { uid: sel.id.length * 991 + sel.tier, kind: 'consumable', name: o.cons.name, effect: o.cons.effect, rarity: 'uncommon' } : null;
    let h = `${prev ? `<div class="resArt">${artImg(prev, 72)}</div>` : ''}<div class="ctitle2">${sel.name} <span class="sm">Tier ${ROMAN[sel.tier - 1]}</span></div><div class="ins">${Object.entries(sel.inputs).map(([m, n]) => `<div class="in ${CR.have(m) >= n ? 'have' : 'miss'}">${MATS[m] || m} <b>${CR.have(m)}/${n}</b></div>`).join('')}</div><div class="arrow">↓</div><div class="res">${res}</div>`;
    if (sel.needs) h += `<div class="sm" style="color:${CR.adjacent(sel.table, sel.needs) ? '#5ad86a' : '#ff8a6a'}">Combo recipe: needs ${TABLES[sel.needs].name} next to this table.</div>`;
    if (o.imbue) { const cands = [...Object.values(S.equip).filter(Boolean), ...S.inv.filter((i) => i.kind === 'gear')].filter((i) => o.imbue.target !== 'weapon' || i.slot === 'main'); h += `<div class="sm" style="margin-top:8px">Choose the item:</div><div class="tgts">${cands.map((i) => `<button class="tgt ${target === i ? 'on' : ''}" data-u="${i.uid}" style="border-color:${(RARITIES.find((r) => r.id === i.rarity) || {}).color}">${icon(i.slot)}<span>${i.name}${i.tags ? `<br><i>${i.tags.join(' · ')}</i>` : ''}</span></button>`).join('') || '<span class="sm">No gear.</span>'}</div>`; }
    h += `<div class="cfoot"><button class="cbtn big" id="craftBtn" ${c.ok ? '' : 'disabled'}>CRAFT</button>${o.mat || o.cons ? '<button class="cbtn" id="craft5">×5</button>' : ''}<span class="sm">${c.ok ? '' : c.why}</span></div>`;
    $('recipeDetail').innerHTML = h;
    document.querySelectorAll('.tgt').forEach((b) => b.addEventListener('click', () => { const u = +b.dataset.u; target = [...Object.values(S.equip), ...S.inv].find((i) => i && i.uid === u); renderDetail(); }));
    $('craftBtn').onclick = () => { CR.craft(sel, target); render(); };
    if ($('craft5')) $('craft5').onclick = () => { for (let i = 0; i < 5; i++) if (!CR.craft(sel)) break; render(); };
  }
  return { open, render };
}
