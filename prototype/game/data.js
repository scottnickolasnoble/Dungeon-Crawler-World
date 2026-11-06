// Game data: classes, the Pyromancer skill tree, the loot generator, loot boxes and achievements.

export const STATS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
export const STAT_INFO = {
  STR: 'Melee damage, carry weight, heavy armour', DEX: 'Attack speed, crit chance, dodge', CON: 'Max HP, stamina, slower Hunger/Thirst',
  INT: 'Spell damage, max mana, effect duration', WIS: 'Mana regen, healing, shields, cooldowns', CHA: 'Fan gain, shop prices, companions',
};
export const CLASS = { id: 'pyromancer', name: 'Pyromancer', main: ['INT', 'CON'], auto: { INT: 1, CON: 1 }, mix: [60, 15, 25] };

// type: atk | def | util ; src: how it's learned ; built: built-in ; ups: [[A,B] at 5, at 10, at 15]
export const SKILLS = [
  { id: 'firebolt', name: 'Firebolt', type: 'atk', built: true, src: 'Built-in', mana: 8, cd: 0.45, desc: 'Hurl a bolt of fire. Applies Burning.', ups: [['Twin Bolts', 'Searing Bolt'], ['Homing', 'Piercing'], ['Phoenix Bolt', 'Supernova Bolt']] },
  { id: 'flameward', name: 'Flame Ward', type: 'def', built: true, src: 'Built-in', mana: 25, cd: 12, desc: 'A shield of fire absorbs damage.', ups: [['Burning Ward', 'Thick Ward'], ['Reflects projectiles', 'Heals as it breaks'], ['Permanent out of combat', 'Share with party']] },
  { id: 'kindle', name: 'Kindle', type: 'util', built: true, src: 'Built-in', mana: 5, cd: 2, desc: 'Set objects alight: light, cooking, signals.', ups: [['Bigger fires', 'Smokeless'], ['Instant cooking', 'Follow-light'], ['Kindle enemy gear', 'Ignite water']] },
  { id: 'fireball', name: 'Fireball', type: 'atk', src: 'Skill book (quest)', mana: 30, cd: 4, desc: 'An exploding ball of fire.', ups: [['Bigger radius', 'Faster'], ['Cluster bombs', 'Sticky'], ['Meteor', 'Triple cast']] },
  { id: 'flamewave', name: 'Flame Wave', type: 'atk', src: 'Skill book (loot box)', mana: 22, cd: 6, desc: 'A cone of rolling flame.', ups: [['Wider', 'Longer'], ['Knockback', 'Fire trail'], ['Tidal Inferno', 'Ring of Fire']] },
  { id: 'emberdarts', name: 'Ember Darts', type: 'atk', src: 'Skill book (loot box)', mana: 12, cd: 2, desc: 'A fan of small burning darts.', ups: [['+2 darts', 'Bleed'], ['Ricochet', 'Crit stacks'], ['Dart storm', 'Hellfire darts']] },
  { id: 'combust', name: 'Combust', type: 'atk', src: 'Skill book (achievement)', mana: 18, cd: 5, desc: 'Detonate Burning on a target.', ups: [['Chain explosions', 'Single-target burst'], ['Lower cost', 'Mana on kill'], ['Combust all in sight', 'Leaves lava']] },
  { id: 'heatray', name: 'Heat Ray', type: 'atk', src: 'Skill book (boss)', mana: 6, cd: 0, desc: 'Channel a beam of heat.', ups: [['Wider beam', 'Slows'], ['Melts armour', 'Sweeps'], ['Solar Lance', 'Split into 3']] },
  { id: 'lavapool', name: 'Lava Pool', type: 'atk', src: 'Skill book (loot box)', mana: 28, cd: 10, desc: 'Leave a pool of lava on the ground.', ups: [['Lasts longer', 'Slows'], ['Roots', 'Spreads'], ['Lava Golem', 'Volcanic geyser']] },
  { id: 'livingflame', name: 'Living Flame', type: 'atk', src: 'Skill book (quest chain)', mana: 40, cd: 20, desc: 'Summon a flame that fights for you.', ups: [['Lasts longer', 'Two flames'], ['Explodes on death', 'Taunts'], ['Fire Elemental', 'Wisp swarm']] },
  { id: 'inferno', name: 'Inferno', type: 'atk', src: 'Prestige (Floor 9)', mana: 60, cd: 45, desc: 'Engulf an area in fire.', ups: [['Bigger', 'Faster cast'], ['Steals mana', 'Heals you'], ['Firestorm', 'Sun Drop']] },
  { id: 'cauterize', name: 'Cauterize', type: 'def', src: 'Skill book (achievement)', mana: 20, cd: 15, desc: 'Burn your wounds shut: heal and stop bleeding.', ups: [['Stops bleed', 'Heals more'], ['Instant', 'Area'], ['Revive ally', 'Brief invulnerability']] },
  { id: 'ashcloak', name: 'Ash Cloak', type: 'def', src: 'Skill book (loot box)', mana: 20, cd: 18, desc: 'Wrap yourself in drifting ash.', ups: [['Dodge chance', 'Blinds attackers'], ['Longer', 'Shareable'], ['Invisible in smoke', 'Reflect']] },
  { id: 'flamestep', name: 'Flame Step', type: 'util', src: 'Skill book (quest)', mana: 15, cd: 6, desc: 'Dash through fire.', ups: [['Longer dash', '2 charges'], ['Fire trail', 'Cleanse'], ['Teleport to fire', 'Arrival burst']] },
  { id: 'smokesignal', name: 'Smoke Signal', type: 'util', src: 'Skill book (achievement)', mana: 10, cd: 30, desc: 'Send up smoke: reveals, calls, marks.', ups: [['Reveal map', 'Call fans'], ['Mark enemies', 'Stealth'], ['Sponsor crate', 'District Map']] },
  { id: 'pyresight', name: 'Pyre Sight', type: 'util', passive: true, src: 'Prestige (Floor 9)', desc: 'Passive: see heat.', ups: [['Heat through walls', 'Night vision'], ['Weak points', 'Track footprints'], ['Floor heat map', 'Crits on Burning']] },
];

// ---------------- loot ----------------
export const RARITIES = [
  { id: 'junk', name: 'Junk', color: '#9a9a9a', affixes: [0, 0], w: 30 },
  { id: 'common', name: 'Common', color: '#f4eedc', affixes: [0, 1], w: 35 },
  { id: 'uncommon', name: 'Uncommon', color: '#5ad86a', affixes: [1, 2], w: 20 },
  { id: 'rare', name: 'Rare', color: '#4a9aff', affixes: [2, 3], w: 10 },
  { id: 'epic', name: 'Epic', color: '#b46cff', affixes: [3, 4], w: 4 },
  { id: 'legendary', name: 'Legendary', color: '#ff9a2a', affixes: [4, 5], w: 0.8 },
];
export const SLOTS = ['head', 'face', 'shoulders', 'chest', 'back', 'bracers', 'gloves', 'belt', 'legs', 'boots', 'ring1', 'ring2', 'amulet', 'main', 'off'];
export const SLOT_NAMES = { head: 'Head', face: 'Face', shoulders: 'Shoulders', chest: 'Chest', back: 'Cloak', bracers: 'Bracers', gloves: 'Gloves', belt: 'Belt', legs: 'Legs', boots: 'Boots', ring1: 'Ring', ring2: 'Ring', amulet: 'Amulet', main: 'Main hand', off: 'Off-hand' };
// base items per slot, from several themed families (not just medieval)
const BASES = {
  head: [['Traffic-Cone Helm', 'scrap', { armor: 6 }], ['Wizard Hat of Questionable Origin', 'arcane', { armor: 2, INT: 2 }], ['Hard Hat', 'work', { armor: 8 }], ['Colander Helm', 'kitchen', { armor: 5, WIS: 1 }], ['Ember Circlet', 'elemental', { armor: 3, fire: 4 }], ['Hockey Mask', 'sports', { armor: 7 }]],
  face: [['Welding Goggles', 'work', { fireRes: 8 }], ['Surgical Mask', 'medical', { poisonRes: 10 }], ['Monocle of Judgement', 'arcane', { crit: 2 }], ['Gas Mask', 'scrap', { poisonRes: 14 }]],
  shoulders: [['Hubcap Pauldrons', 'scrap', { armor: 7 }], ['Shoulder Pads', 'sports', { armor: 9 }], ['Ember Mantle', 'elemental', { armor: 4, fire: 5 }], ['Rubber-Duck Pauldrons', 'silly', { armor: 3, CHA: 3 }]],
  chest: [['Hi-Vis Vest', 'work', { armor: 9 }], ['Apron Armour', 'kitchen', { armor: 10, CON: 1 }], ['Robe of Mild Combustion', 'arcane', { armor: 4, INT: 3 }], ['Car-Seat Cuirass', 'scrap', { armor: 14 }], ['Scrubs', 'medical', { armor: 5, WIS: 2 }]],
  back: [['Shower-Curtain Cloak', 'scrap', { dodge: 2 }], ['Cape of the Cone King', 'silly', { dodge: 3, CHA: 2 }], ['Smoke Cloak', 'elemental', { dodge: 4 }]],
  bracers: [['Seatbelt Bracers', 'scrap', { block: 4 }], ['Rune Bracers', 'arcane', { castSpeed: 4 }], ['Sweatbands', 'sports', { atkSpeed: 3 }]],
  gloves: [['Oven-Mitt Gauntlets', 'kitchen', { fireRes: 10, armor: 3 }], ['Welding Gloves', 'work', { armor: 4, fire: 3 }], ['Gloves of Kindling', 'arcane', { fire: 6 }], ['Defib Gloves', 'medical', { shock: 4 }]],
  belt: [['Tool Belt', 'work', { potionSlots: 1 }], ['Bandolier of Sauces', 'kitchen', { potionSlots: 2 }], ['Seatbelt Sash', 'scrap', { carry: 10 }]],
  legs: [['Cargo Shorts of Holding', 'scrap', { armor: 5, carry: 15 }], ['Chef Trousers', 'kitchen', { armor: 6 }], ['Spellweave Leggings', 'arcane', { armor: 4, INT: 2 }], ['Hockey Pants', 'sports', { armor: 9 }]],
  boots: [['Steel-Toe Boots', 'work', { armor: 6 }], ['Roller Skates', 'silly', { moveSpeed: 8 }], ['Ember Treads', 'elemental', { moveSpeed: 4, fire: 3 }], ['Cleats', 'sports', { moveSpeed: 5 }]],
  ring1: [['Washer Ring', 'scrap', {}], ['Ring of Embers', 'elemental', { fire: 5 }], ['Mood Ring', 'silly', { CHA: 2 }], ['Signet of the Network', 'arcane', { INT: 2 }]],
  amulet: [['Bottle-Cap Amulet', 'scrap', {}], ['Phoenix Feather Pendant', 'elemental', { fire: 6 }], ['Lanyard of Authority', 'work', { CHA: 2 }], ['Third-Eye Amulet', 'arcane', { INT: 3, mana: 15 }]],
  main: [['Rusty Wrench', 'scrap', { dmg: 9 }], ['Crooked Wand', 'arcane', { spell: 10 }], ['Lighter Staff', 'elemental', { spell: 12, fire: 3 }], ['Ladle Mace', 'kitchen', { dmg: 11 }], ['Stop-Sign Axe', 'scrap', { dmg: 14 }], ['Tiki-Torch Staff', 'elemental', { spell: 14, fire: 5 }]],
  off: [['Car-Door Shield', 'scrap', { block: 12, armor: 6 }], ['Focus Orb (Snow Globe)', 'arcane', { mana: 20 }], ['Tome of Lighter Fluid', 'elemental', { spell: 8, fire: 4 }], ['Trash-Can Lid', 'scrap', { block: 9 }], ['Torch', 'elemental', { light: 1, fire: 2 }]],
};
BASES.ring2 = BASES.ring1;
const AFFIXES = [
  ['STR', 1, 4], ['DEX', 1, 4], ['CON', 1, 4], ['INT', 1, 5], ['WIS', 1, 4], ['CHA', 1, 4], ['hp', 8, 30], ['mana', 8, 30], ['crit', 1, 5], ['atkSpeed', 2, 8], ['castSpeed', 2, 8],
  ['fire', 2, 10], ['frost', 2, 8], ['fireRes', 4, 15], ['moveSpeed', 2, 6], ['lifeOnHit', 1, 4], ['loot', 3, 12], ['fans', 3, 15], ['hungerDrain', 5, 15], ['thirstDrain', 5, 15],
];
export const STAT_LABEL = { armor: 'Armour', dmg: 'Damage', spell: 'Spell power', STR: 'STR', DEX: 'DEX', CON: 'CON', INT: 'INT', WIS: 'WIS', CHA: 'CHA', hp: 'Max HP', mana: 'Max mana', crit: '% Crit', atkSpeed: '% Attack speed', castSpeed: '% Cast speed', fire: '% Fire damage', frost: '% Frost damage', fireRes: '% Fire resist', poisonRes: '% Poison resist', moveSpeed: '% Move speed', lifeOnHit: 'Life on hit', loot: '% Loot find', fans: '% Fan gain', hungerDrain: '% Slower hunger', thirstDrain: '% Slower thirst', dodge: '% Dodge', block: 'Block', potionSlots: 'Potion slots', carry: 'Carry weight', shock: '% Shock damage', light: 'Light source', skill_firebolt: 'to Firebolt', skill_fireball: 'to Fireball', skill_fire: 'to all fire skills', skill_flameward: 'to Flame Ward' };
const PREFIX = { rare: ['Smouldering', 'Glorious', 'Suspicious', 'Sponsored', 'Bloodstained', 'Haunted'], epic: ['Infernal', 'Ratings-Approved', 'Cursed-but-Fine', 'Prime-Time'], legendary: ['The Showstopper:', 'The Last Exit:', 'Grandma’s Own'] };
const HOST_LINES = {
  junk: ['It’s garbage. But it’s YOUR garbage.', 'Smells like a parking garage. Because it is.', 'Worth roughly one (1) disappointment.'],
  common: ['Perfectly adequate. Like your personality.', 'It does the job. Barely.', 'The audience yawns.'],
  uncommon: ['Ooh, green! Fancy.', 'A modest upgrade for a modest contestant.', 'Slightly less terrible than average.'],
  rare: ['Blue! The colour of hope, and of bruises.', 'Now we’re cooking. Possibly literally.', 'Somebody died for this. Probably a goblin.'],
  epic: ['Purple! The audience gasps!', 'This is the good stuff. Don’t sell it, idiot.', 'Our sponsors are watching. Look cool.'],
  legendary: ['LEGENDARY. Everybody act natural.', 'Ratings just spiked 400%. Thank you.', 'This item has its own fan club.'],
};
const rr = (a, b, r) => Math.round(a + (b - a) * r);
export function makeRng(seed) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) + 1442695040 | 0) >>> 0) / 4294967296; }
export function rollRarity(rng, min = 0, bonus = 0) { const pool = RARITIES.slice(min); const total = pool.reduce((s, r, i) => s + r.w * (1 + bonus * i * 0.5), 0); let x = rng() * total; for (let i = 0; i < pool.length; i++) { x -= pool[i].w * (1 + bonus * i * 0.5); if (x <= 0) return pool[i]; } return pool[pool.length - 1]; }
let uid = 1;
export function makeItem(rng, { level = 3, minRarity = 0, rarityBonus = 0, slot = null } = {}) {
  const rar = rollRarity(rng, minRarity, rarityBonus);
  slot = slot || SLOTS[Math.floor(rng() * SLOTS.length)];
  const [baseName, family, baseStats] = BASES[slot][Math.floor(rng() * BASES[slot].length)];
  const mult = 1 + level * 0.12 + RARITIES.indexOf(rar) * 0.15;
  const stats = {}; for (const [k, v] of Object.entries(baseStats)) stats[k] = Math.max(1, Math.round(v * mult));
  const n = rr(rar.affixes[0], rar.affixes[1], rng());
  const used = new Set(Object.keys(stats));
  for (let i = 0; i < n; i++) { const [k, a, b] = AFFIXES[Math.floor(rng() * AFFIXES.length)]; if (used.has(k)) continue; used.add(k); stats[k] = Math.max(1, Math.round(rr(a, b, rng()) * (1 + level * 0.05))); }
  if (['rare', 'epic', 'legendary'].includes(rar.id) && rng() < 0.55) { const sk = ['skill_firebolt', 'skill_fireball', 'skill_flameward', 'skill_fire'][Math.floor(rng() * 4)]; stats[sk] = sk === 'skill_fire' ? 1 : rr(1, rar.id === 'legendary' ? 3 : 2, rng()); }
  const pre = PREFIX[rar.id]; const name = pre ? `${pre[Math.floor(rng() * pre.length)]} ${baseName}` : rar.id === 'junk' ? `Broken ${baseName}` : baseName;
  const lines = HOST_LINES[rar.id];
  return { uid: uid++, kind: 'gear', slot: slot === 'ring2' ? 'ring1' : slot, name, rarity: rar.id, family, level, stats, host: lines[Math.floor(rng() * lines.length)], value: Math.round(5 * mult * (1 + RARITIES.indexOf(rar)) ** 2) };
}
export const CONSUMABLES = [
  { id: 'water', name: 'Bottle of Clean-ish Water', kind: 'consumable', effect: { thirst: 35 }, host: 'Only slightly radioactive.' },
  { id: 'jerky', name: 'Lamprey Jerky', kind: 'consumable', effect: { hunger: 30, thirst: 5 }, host: 'Chewy. Like a tyre, but meatier.' },
  { id: 'mpot', name: 'Mana Potion (Blue Raspberry)', kind: 'consumable', effect: { mana: 60 }, host: 'Tastes like a slushie and regret.' },
  { id: 'hpot', name: 'Health Potion (Cherry)', kind: 'consumable', effect: { hp: 50 }, host: 'Doctor-recommended. The doctor is a goblin.' },
];
export const BOXES = {
  bronze: { name: 'Bronze Box', color: '#c88a4a', items: 2, minRarity: 1, bonus: 0, book: 0.05 },
  silver: { name: 'Silver Box', color: '#c8ccd8', items: 3, minRarity: 2, bonus: 0.3, book: 0.15 },
  gold: { name: 'Gold Box', color: '#F5C518', items: 3, minRarity: 3, bonus: 0.8, book: 0.35 },
  boss: { name: 'Boss Box', color: '#E5484D', items: 3, minRarity: 3, bonus: 1.2, book: 0.4 },
};
export function openBox(rng, type, level) {
  const b = BOXES[type], out = [];
  for (let i = 0; i < b.items; i++) out.push(makeItem(rng, { level, minRarity: i === 0 ? b.minRarity : Math.max(1, b.minRarity - 1), rarityBonus: b.bonus }));
  if (rng() < b.book) { const learnable = SKILLS.filter((s) => !s.built && !s.src.startsWith('Prestige')); const s = learnable[Math.floor(rng() * learnable.length)]; out.push({ uid: uid++, kind: 'book', skill: s.id, name: `Skill Book: ${s.name}`, rarity: 'epic', host: 'Reading! In MY dungeon? Bold.' }); }
  out.push({ uid: uid++, kind: 'consumable', ...CONSUMABLES[Math.floor(rng() * CONSUMABLES.length)] });
  return out;
}
// Achievements available in the Floor 1 demo
export const ACHIEVEMENTS = [
  { id: 'firstSteps', name: 'First Steps', desc: 'Walk 50 metres', box: 'bronze' },
  { id: 'tourist', name: 'Tourist', desc: 'Discover 3 points of interest', box: 'bronze' },
  { id: 'cartographer', name: 'Cartographer (Demo)', desc: 'Discover all 5 points of interest', box: 'gold' },
  { id: 'firstBlood', name: 'First Blood', desc: 'Kill your first mob', box: 'bronze' },
  { id: 'pyro', name: 'Pyro Enthusiast', desc: 'Set 10 enemies on fire', box: 'silver', bookHint: true },
  { id: 'goblinBane', name: 'Goblin Bane', desc: 'Kill 10 goblins', box: 'silver' },
  { id: 'warded', name: 'Safety First', desc: 'Absorb 50 damage with Flame Ward', box: 'bronze' },
  { id: 'closeCall', name: 'Close Call', desc: 'Survive below 15% HP', box: 'silver' },
  { id: 'fullKit', name: 'Full Kit', desc: 'Equip an item in 10 slots', box: 'silver' },
  { id: 'hoarder', name: 'Unboxing Star', desc: 'Open 5 loot boxes', box: 'silver' },
  { id: 'levelUp', name: 'Moving Up', desc: 'Reach Level 10', box: 'gold' },
  { id: 'exit', name: 'Exit, Pursued', desc: 'Touch the Exit Sign', box: 'gold' },
];
