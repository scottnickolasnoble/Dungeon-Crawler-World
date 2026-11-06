// Playable races and classes (from the design doc), and every class skill as data. combat.js runs them.
// New contestants start classless ("Contestant") with a basic weapon and Dale's lighter. Race and class are
// chosen at the Hall of Callings on Floor 3. 12 magic classes + 8 job classes; each has 3 built-in skills
// and 3 skill-book skills (the Pyromancer keeps its full 16-skill tree).
// Skill kinds: bolt, volley, nova, cone, zone, ward, heal, buff, dash, strike, summon, reveal, passive.
import { SKILLS as PYRO } from './data.js';

export const PRACES = {
  human: { name: 'Human', bonus: { CHA: 2, CON: 1, WIS: 1 }, desc: 'Adaptable and stubborn. Better prices, better fans.', skin: '#c8987a' },
  gutterkin: { name: 'Gutterkin', bonus: { DEX: 2, WIS: 1, CON: 1 }, desc: 'Rat-folk of the drains. Quick hands, quicker feet, never starve.', skin: '#7a6a62' },
  stoneblood: { name: 'Stoneblood', bonus: { CON: 3, STR: 1 }, desc: 'Living rock with a furnace heart. Hard to kill, hard to hurry.', skin: '#8a8680' },
  fennix: { name: 'Fennix', bonus: { DEX: 2, CHA: 1, INT: 1 }, desc: 'Fox-folk performers. Crits come naturally. So does showing off.', skin: '#d8742a' },
  ogrekin: { name: 'Ogrekin', bonus: { STR: 3, CON: 2, INT: -1 }, desc: 'Huge, gentle until provoked, then very much not gentle.', skin: '#9a8a6a' },
  lumen: { name: 'Lumen', bonus: { INT: 2, WIS: 2 }, desc: 'Glowing scholars from the deep archive. Spells come easily.', skin: '#c8e8ff' },
  bogling: { name: 'Bogling', bonus: { CON: 2, WIS: 1, CHA: 1 }, desc: 'Frog-folk of the wet floors. Resistant to poison and bad soup.', skin: '#6a9a3a' },
  clanker: { name: 'Clanker', bonus: { CON: 2, INT: 1, STR: 1 }, desc: 'Clockwork people. Never thirsty, often oiled.', skin: '#8a8c92' },
  grimhide: { name: 'Grimhide', bonus: { STR: 2, DEX: 1, CON: 1 }, desc: 'Tusked hunters from the lower floors. Born for the fight.', skin: '#6a7a4a' },
};

// attack: 'melee' swings the equipped weapon on left click; 'cast' uses the class's first skill on left click
export const CLASSES = {
  none: { name: 'Contestant', group: 'none', attack: 'melee', main: ['STR', 'CON'], auto: { STR: 1, CON: 1 }, mix: [40, 30, 30], color: '#c8c0b0', desc: 'No class yet. You choose one at the Hall of Callings on Floor 3.' },
  // magic classes
  pyromancer: { name: 'Pyromancer', group: 'magic', elem: 'fire', attack: 'cast', main: ['INT', 'CON'], auto: { INT: 1, CON: 1 }, mix: [60, 15, 25], color: '#ff8a2a', role: 'Burst damage, area denial', desc: 'Fire magic. Burns everything, eventually including your problems.' },
  windcaller: { name: 'Windcaller', group: 'magic', elem: 'wind', attack: 'cast', main: ['INT', 'DEX'], auto: { INT: 1, DEX: 1 }, mix: [45, 20, 35], color: '#b8f0d8', role: 'Mobility, crowd control', desc: 'Wind magic. Cut with gales, ride updrafts, bat arrows aside.' },
  frostweaver: { name: 'Frostweaver', group: 'magic', elem: 'frost', attack: 'cast', main: ['INT', 'WIS'], auto: { INT: 1, WIS: 1 }, mix: [45, 30, 25], color: '#9ae8ff', role: 'Control, shatter combos', desc: 'Ice magic. Slow it, freeze it, shatter it.' },
  stormcaller: { name: 'Stormcaller', group: 'magic', elem: 'storm', attack: 'cast', main: ['INT', 'DEX'], auto: { INT: 1, DEX: 1 }, mix: [60, 15, 25], color: '#ffe040', role: 'Chain damage, stuns', desc: 'Lightning. Fast, loud, jumps between enemies.' },
  earthshaper: { name: 'Earthshaper', group: 'magic', elem: 'earth', attack: 'cast', main: ['INT', 'CON'], auto: { INT: 1, CON: 1 }, mix: [35, 45, 20], color: '#c8a060', role: 'Tank caster, terrain', desc: 'Earth magic. Stone fists, walls of rock, and feeling footsteps through the floor.' },
  tidecaller: { name: 'Tidecaller', group: 'magic', elem: 'water', attack: 'cast', main: ['WIS', 'INT'], auto: { WIS: 1, INT: 1 }, mix: [30, 25, 45], color: '#3a9aff', role: 'Healing, Wet combos', desc: 'Water magic. Lashes, bubbles and never being thirsty again.' },
  bonecaller: { name: 'Bonecaller', group: 'magic', elem: 'death', attack: 'cast', main: ['INT', 'WIS'], auto: { INT: 1, WIS: 1 }, mix: [40, 30, 30], color: '#c8c0e8', role: 'Summoner, drains', desc: 'Death magic. Raise skeletons, wear bones, drink life.' },
  lightbringer: { name: 'Lightbringer', group: 'magic', elem: 'holy', attack: 'cast', main: ['WIS', 'CHA'], auto: { WIS: 1, CHA: 1 }, mix: [20, 35, 45], color: '#fff4c0', role: 'Healer, anti-undead', desc: 'Light magic. Heals, shields, and a flare in the eyes of the wicked.' },
  hexwright: { name: 'Hexwright', group: 'magic', elem: 'shadow', attack: 'cast', main: ['INT', 'CHA'], auto: { INT: 1, CHA: 1 }, mix: [35, 20, 45], color: '#a85aff', role: 'Debuffer', desc: 'Curses. Make enemies miss, weaken and regret.' },
  chronomancer: { name: 'Chronomancer', group: 'magic', elem: 'time', attack: 'cast', main: ['WIS', 'INT'], auto: { WIS: 1, INT: 1 }, mix: [25, 30, 45], color: '#e8c87a', role: 'Cooldowns, tempo', desc: 'Time magic. Speed up, slow down, undo a mistake.' },
  sporesage: { name: 'Spore Sage', group: 'magic', elem: 'poison', attack: 'cast', main: ['WIS', 'CON'], auto: { WIS: 1, CON: 1 }, mix: [40, 25, 35], color: '#7ad83a', role: 'Damage over time, healing', desc: 'Nature and poison. Spore clouds, bark skin, food from nowhere.' },
  spellsword: { name: 'Spellsword', group: 'magic', elem: 'arcane', attack: 'melee', main: ['STR', 'INT'], auto: { STR: 1, INT: 1 }, mix: [55, 25, 20], color: '#6ab8ff', role: 'Melee and magic hybrid', desc: 'Blade in one hand, spell in the other. Imbues the weapon with the elements.' },
  // job classes
  plumber: { name: 'Plumber', group: 'job', attack: 'melee', main: ['STR', 'CON'], auto: { STR: 1, CON: 1 }, mix: [50, 25, 25], color: '#3a7ac8', role: 'Melee and utility', desc: 'A wrench, a plunger and no fear of what’s in the pipes.' },
  paramedic: { name: 'Paramedic', group: 'job', attack: 'melee', main: ['WIS', 'CON'], auto: { WIS: 1, CON: 1 }, mix: [25, 50, 25], color: '#e83a4a', role: 'Healer', desc: 'Patches people up. Hits surprisingly hard with a defibrillator.' },
  demolitions: { name: 'Demolitions Hobbyist', group: 'job', attack: 'melee', main: ['DEX', 'INT'], auto: { DEX: 1, INT: 1 }, mix: [65, 10, 25], color: '#ff6a2a', role: 'Explosives', desc: 'Bombs out of cleaning supplies. Eyebrows optional.' },
  dentist: { name: 'Dentist', group: 'job', attack: 'melee', main: ['DEX', 'STR'], auto: { DEX: 1, STR: 1 }, mix: [65, 15, 20], color: '#e8f0f0', role: 'Melee crit', desc: 'Precise, brutal and very interested in teeth.' },
  repoagent: { name: 'Repo Agent', group: 'job', attack: 'melee', main: ['DEX', 'CHA'], auto: { DEX: 1, CHA: 1 }, mix: [55, 15, 30], color: '#5a5a6a', role: 'Rogue', desc: 'Takes back what’s owed. Including things monsters are holding.' },
  exterminator: { name: 'Exterminator', group: 'job', attack: 'cast', main: ['DEX', 'WIS'], auto: { DEX: 1, WIS: 1 }, mix: [60, 15, 25], color: '#9ad83a', role: 'Ranged damage over time', desc: 'Pest control with a sprayer and a pressure gun.' },
  mallsanta: { name: 'Mall Santa', group: 'job', attack: 'melee', main: ['CON', 'CHA'], auto: { CON: 1, CHA: 1 }, mix: [35, 50, 15], color: '#c81a1a', role: 'Tank and charm', desc: 'Big, jolly, armoured in padding. Has a list.' },
  nightsecurity: { name: 'Night Security', group: 'job', attack: 'melee', main: ['DEX', 'WIS'], auto: { DEX: 1, WIS: 1 }, mix: [40, 25, 35], color: '#2a4a8a', role: 'Stealth and traps', desc: 'A torch, a baton, and knowing exactly where everyone walks.' },
};
export const GUILDS = {
  collegium: { name: 'The Collegium of Downward Arts', classes: Object.keys(CLASSES).filter((k) => CLASSES[k].group === 'magic'), color: '#b46cff', desc: 'The mages’ guild. Every element under one leaky roof.' },
  union: { name: 'The Tradesfolk Union', classes: ['plumber', 'demolitions', 'dentist', 'exterminator'], color: '#3a7ac8', desc: 'Skilled trades. They fix the dungeon, or blow it up, at union rates.' },
  nightshift: { name: 'The Night Shift', classes: ['repoagent', 'nightsecurity'], color: '#5a5a8a', desc: 'People who work while everyone else sleeps. They see everything.' },
  caregivers: { name: 'The Caregivers’ Lodge', classes: ['paramedic', 'mallsanta'], color: '#e83a4a', desc: 'Healers and protectors. Cocoa is free. Advice is not.' },
};
export const guildOf = (cls) => Object.keys(GUILDS).find((g) => GUILDS[g].classes.includes(cls));

const S = (o) => ({ cost: 10, cd: 3, type: 'atk', ups: [['More damage', 'Faster cooldown'], ['Bigger', 'Stronger effect'], ['Devastating', 'Half cost']], ...o });
// generic upgrade effects by tier/choice (the names are what the player sees)
export const UP_EFFECT = [[{ dmg: 1.3 }, { cd: 0.75 }], [{ size: 1.35, count: 1 }, { status: 1.7 }], [{ dmg: 1.7 }, { cost: 0.5 }]];
const B = (o) => S({ built: true, src: 'Built-in', ...o }), K = (o) => S({ src: 'Skill book', ...o });

// the lighter: every contestant has it from the intro
export const FLICK = B({ id: 'flick', cls: 'all', name: 'Flick (Lighter)', kind: 'bolt', elem: 'fire', cost: 0, cd: 5, dmg: [6, 2], scale: 'INT', speed: 24, size: 0.09, src: 'Your lighter', desc: 'Flick your work lighter at something. A tiny burst of fire. Long cooldown.', ups: [['Bigger flame', 'Quicker flick'], ['Lingering burn', 'Two flicks'], ['Blowtorch', 'Free']] });

export const SKILLDEFS = [FLICK,
  // ---- Pyromancer (the original 16-skill tree, mapped onto skill kinds) ----
  ...PYRO.map((p) => ({ ...p, cls: 'pyromancer', elem: 'fire', cost: p.mana || 0, scale: 'INT', ...({
    firebolt: { kind: 'bolt', dmg: [12, 3.2], speed: 34, size: 0.13, status: 2 }, fireball: { kind: 'bolt', dmg: [34, 7], speed: 22, size: 0.28, explode: 3.2, status: 3, arc: 2 },
    flameward: { kind: 'ward', amount: [40, 9] }, kindle: { kind: 'zone', dmg: [4, 1], radius: 1.6, dur: 4, range: 12, status: 2 }, flamewave: { kind: 'cone', dmg: [20, 4], range: 7, arc: 1.2, status: 3 },
    emberdarts: { kind: 'volley', dmg: [7, 1.6], count: 5, spread: 0.5, speed: 30, size: 0.08, status: 1 }, combust: { kind: 'nova', dmg: [10, 3], radius: 9, status: 2 },
    heatray: { kind: 'bolt', dmg: [6, 1.4], speed: 60, size: 0.07, status: 1, cd: 0.15 }, lavapool: { kind: 'zone', dmg: [12, 2.5], radius: 3, dur: 7, range: 14, status: 2 },
    livingflame: { kind: 'summon', dmg: [10, 2], dur: 25 }, inferno: { kind: 'nova', dmg: [60, 10], radius: 10, status: 5 }, cauterize: { kind: 'heal', amount: [40, 8] },
    ashcloak: { kind: 'buff', buff: { dodge: 25, armor: 10 }, dur: 10 }, flamestep: { kind: 'dash', dist: 9, dmg: [8, 2], status: 2 }, smokesignal: { kind: 'reveal' }, pyresight: { kind: 'passive' },
  }[p.id] || {}) })),
  // ---- Windcaller ----
  B({ id: 'galeslash', cls: 'windcaller', name: 'Gale Slash', kind: 'volley', elem: 'wind', cost: 8, cd: 0.6, dmg: [7, 2], count: 3, spread: 0.25, speed: 40, size: 0.1, knock: 3, scale: 'INT', desc: 'Three blades of wind. Pushes enemies back.' }),
  B({ id: 'updraft', cls: 'windcaller', type: 'util', name: 'Updraft', kind: 'dash', elem: 'wind', cost: 12, cd: 4, dist: 10, lift: 7, dmg: [4, 1], scale: 'INT', desc: 'Leap on a column of wind and glide forward.' }),
  B({ id: 'deflect', cls: 'windcaller', type: 'def', name: 'Deflect Winds', kind: 'ward', elem: 'wind', cost: 20, cd: 12, amount: [35, 8], deflect: true, scale: 'INT', desc: 'Swirling winds bat projectiles away and soak hits.' }),
  K({ id: 'cyclone', cls: 'windcaller', name: 'Cyclone', kind: 'zone', elem: 'wind', cost: 26, cd: 12, dmg: [11, 3], radius: 3.5, dur: 6, range: 14, pull: true, scale: 'INT', desc: 'A spinning storm that drags enemies in.' }),
  K({ id: 'tempest', cls: 'windcaller', name: 'Tempest Burst', kind: 'nova', elem: 'wind', cost: 24, cd: 8, dmg: [18, 4], radius: 6, knock: 12, scale: 'INT', desc: 'Blow everything away from you.' }),
  K({ id: 'tailwind', cls: 'windcaller', type: 'util', name: 'Tailwind', kind: 'buff', elem: 'wind', cost: 12, cd: 25, buff: { moveSpeed: 30, castSpeed: 15 }, dur: 15, desc: 'The wind is at your back. Literally.' }),
  // ---- Frostweaver ----
  B({ id: 'frostshard', cls: 'frostweaver', name: 'Frost Shard', kind: 'bolt', elem: 'frost', cost: 8, cd: 0.5, dmg: [11, 3], scale: 'INT', speed: 30, size: 0.13, status: 2, desc: 'A shard of ice. Slows what it hits.' }),
  B({ id: 'icebarrier', cls: 'frostweaver', type: 'def', name: 'Ice Barrier', kind: 'ward', elem: 'frost', cost: 24, cd: 12, amount: [50, 10], scale: 'WIS', desc: 'A shell of ice that soaks damage and chills attackers.' }),
  B({ id: 'chilltouch', cls: 'frostweaver', type: 'util', name: 'Chill Touch', kind: 'cone', elem: 'frost', cost: 12, cd: 4, dmg: [10, 2.5], range: 5, arc: 1.3, status: 3, scale: 'INT', desc: 'A freezing breath that slows everything in front of you.' }),
  K({ id: 'icenova', cls: 'frostweaver', name: 'Ice Nova', kind: 'nova', elem: 'frost', cost: 26, cd: 8, dmg: [18, 4], radius: 6, status: 2.5, freeze: true, scale: 'INT', desc: 'Freeze everything around you solid for a moment.' }),
  K({ id: 'blizzard', cls: 'frostweaver', name: 'Blizzard', kind: 'zone', elem: 'frost', cost: 30, cd: 12, dmg: [10, 2.5], radius: 4, dur: 7, range: 16, status: 2, scale: 'INT', desc: 'A localised snowstorm. Bring a coat.' }),
  K({ id: 'frostlance', cls: 'frostweaver', name: 'Frost Lance', kind: 'bolt', elem: 'frost', cost: 18, cd: 4, dmg: [30, 6], speed: 46, size: 0.2, pierce: true, status: 3, scale: 'INT', desc: 'A spear of ice that goes straight through several enemies.' }),
  // ---- Stormcaller ----
  B({ id: 'spark', cls: 'stormcaller', name: 'Spark', kind: 'bolt', elem: 'storm', cost: 6, cd: 0.35, dmg: [9, 2.6], speed: 52, size: 0.1, status: 0.4, scale: 'INT', desc: 'A crackling bolt. Very fast, sometimes stuns.' }),
  B({ id: 'staticshield', cls: 'stormcaller', type: 'def', name: 'Static Shield', kind: 'ward', elem: 'storm', cost: 22, cd: 12, amount: [40, 8], thorns: 6, scale: 'INT', desc: 'A crackling shield that shocks whatever hits it.' }),
  B({ id: 'chargeup', cls: 'stormcaller', type: 'util', name: 'Charge Up', kind: 'buff', elem: 'storm', cost: 10, cd: 10, buff: { crit: 100 }, dur: 4, scale: 'INT', desc: 'Your next few seconds of spells all crit.' }),
  K({ id: 'chainlightning', cls: 'stormcaller', name: 'Chain Lightning', kind: 'bolt', elem: 'storm', cost: 20, cd: 3, dmg: [22, 5], speed: 60, size: 0.14, chain: 3, status: 0.6, scale: 'INT', desc: 'Lightning that jumps to nearby enemies.' }),
  K({ id: 'thunderclap', cls: 'stormcaller', name: 'Thunderclap', kind: 'nova', elem: 'storm', cost: 22, cd: 7, dmg: [16, 4], radius: 6, knock: 10, status: 0.8, scale: 'INT', desc: 'A boom that throws enemies away from you.' }),
  K({ id: 'balllightning', cls: 'stormcaller', name: 'Ball Lightning', kind: 'summon', elem: 'storm', cost: 35, cd: 20, dmg: [9, 2], dur: 20, scale: 'INT', desc: 'A floating ball that zaps nearby enemies.' }),
  // ---- Earthshaper ----
  B({ id: 'stonefist', cls: 'earthshaper', name: 'Stone Fist', kind: 'bolt', elem: 'earth', cost: 10, cd: 0.8, dmg: [16, 3.6], speed: 26, size: 0.24, knock: 4, status: 0.5, scale: 'INT', desc: 'Hurl a fist of rock. Knocks enemies back.' }),
  B({ id: 'earthwall', cls: 'earthshaper', type: 'def', name: 'Earth Wall', kind: 'ward', elem: 'earth', cost: 22, cd: 12, amount: [70, 12], scale: 'CON', desc: 'Raise a wall of stone around yourself.' }),
  B({ id: 'tremorsense', cls: 'earthshaper', type: 'util', name: 'Tremor Sense', kind: 'reveal', elem: 'earth', cost: 8, cd: 20, desc: 'Feel footsteps through the floor. Shows every mob nearby on your map.' }),
  K({ id: 'quake', cls: 'earthshaper', name: 'Quake', kind: 'nova', elem: 'earth', cost: 28, cd: 9, dmg: [24, 5], radius: 7, status: 1.2, scale: 'INT', desc: 'Shake the ground. Everything falls over.' }),
  K({ id: 'spikefield', cls: 'earthshaper', name: 'Spike Field', kind: 'zone', elem: 'earth', cost: 24, cd: 11, dmg: [14, 3], radius: 3.5, dur: 6, range: 14, root: true, status: 2, scale: 'INT', desc: 'Stone spikes erupt and pin enemies in place.' }),
  K({ id: 'boulder', cls: 'earthshaper', name: 'Boulder', kind: 'bolt', elem: 'earth', cost: 26, cd: 6, dmg: [40, 8], speed: 18, size: 0.45, explode: 3, status: 1, scale: 'INT', desc: 'A huge rolling rock.' }),
  // ---- Tidecaller ----
  B({ id: 'waterlash', cls: 'tidecaller', name: 'Water Lash', kind: 'cone', elem: 'water', cost: 8, cd: 0.7, dmg: [11, 2.8], range: 6, arc: 0.9, status: 4, scale: 'WIS', desc: 'A whip of water. Leaves enemies Wet (lightning loves this).' }),
  B({ id: 'bubbleshield', cls: 'tidecaller', type: 'def', name: 'Bubble Shield', kind: 'ward', elem: 'water', cost: 20, cd: 10, amount: [45, 9], heal: 2, scale: 'WIS', desc: 'A bubble that soaks hits and slowly heals you.' }),
  B({ id: 'purify', cls: 'tidecaller', type: 'util', name: 'Purify Water', kind: 'heal', elem: 'water', cost: 10, cd: 15, amount: [20, 4], thirst: 50, scale: 'WIS', desc: 'Make clean water from nothing. Quenches thirst and heals a little.' }),
  K({ id: 'riptide', cls: 'tidecaller', name: 'Riptide', kind: 'zone', elem: 'water', cost: 24, cd: 11, dmg: [12, 3], radius: 3.5, dur: 6, range: 14, pull: true, status: 3, scale: 'WIS', desc: 'A whirlpool that drags enemies in.' }),
  K({ id: 'tidalwave', cls: 'tidecaller', name: 'Tidal Wave', kind: 'cone', elem: 'water', cost: 28, cd: 9, dmg: [26, 5], range: 10, arc: 1.4, knock: 10, status: 4, scale: 'WIS', desc: 'A wall of water that sweeps everything away.' }),
  K({ id: 'springrain', cls: 'tidecaller', type: 'def', name: 'Spring Rain', kind: 'buff', elem: 'water', cost: 20, cd: 30, buff: { hpRegen: 6, manaRegen: 3 }, dur: 20, scale: 'WIS', desc: 'A gentle rain that heals over time.' }),
  // ---- Bonecaller ----
  B({ id: 'raiseskeleton', cls: 'bonecaller', name: 'Raise Skeleton', kind: 'summon', elem: 'death', cost: 22, cd: 12, dmg: [9, 2.2], dur: 40, scale: 'INT', desc: 'A skeleton climbs out of the floor and fights for you.' }),
  B({ id: 'bonearmor', cls: 'bonecaller', type: 'def', name: 'Bone Armor', kind: 'ward', elem: 'death', cost: 20, cd: 12, amount: [45, 9], scale: 'WIS', desc: 'Plates of bone wrap around you.' }),
  B({ id: 'siphon', cls: 'bonecaller', name: 'Siphon', kind: 'bolt', elem: 'death', cost: 8, cd: 0.6, dmg: [9, 2.5], speed: 34, size: 0.12, drain: 0.4, scale: 'INT', desc: 'Steal health from a target.' }),
  K({ id: 'corpseblast', cls: 'bonecaller', name: 'Corpse Blast', kind: 'nova', elem: 'death', cost: 24, cd: 8, dmg: [22, 5], radius: 6, scale: 'INT', desc: 'Make the nearby dead explode. Messy.' }),
  K({ id: 'deathgrip', cls: 'bonecaller', name: 'Death Grip', kind: 'zone', elem: 'death', cost: 22, cd: 12, dmg: [10, 2.5], radius: 3, dur: 6, range: 14, root: true, drain: 0.3, scale: 'INT', desc: 'Hands from the floor hold enemies and drain them.' }),
  K({ id: 'bonestorm', cls: 'bonecaller', name: 'Bone Storm', kind: 'volley', elem: 'death', cost: 18, cd: 4, dmg: [8, 2], count: 7, spread: 0.8, speed: 30, size: 0.08, scale: 'INT', desc: 'A spray of sharpened bones.' }),
  // ---- Lightbringer ----
  B({ id: 'mend', cls: 'lightbringer', type: 'def', name: 'Mend', kind: 'heal', elem: 'holy', cost: 18, cd: 5, amount: [40, 9], scale: 'WIS', desc: 'Close wounds with a word.' }),
  B({ id: 'radiantshield', cls: 'lightbringer', type: 'def', name: 'Radiant Shield', kind: 'ward', elem: 'holy', cost: 22, cd: 12, amount: [60, 11], scale: 'WIS', desc: 'A dome of light that absorbs damage.' }),
  B({ id: 'flare', cls: 'lightbringer', name: 'Flare', kind: 'bolt', elem: 'holy', cost: 8, cd: 0.6, dmg: [10, 2.8], speed: 34, size: 0.13, status: 1, undead: 2, scale: 'WIS', desc: 'A bolt of blinding light. Undead hate it twice as much.' }),
  K({ id: 'sunburst', cls: 'lightbringer', name: 'Sunburst', kind: 'nova', elem: 'holy', cost: 26, cd: 9, dmg: [22, 5], radius: 6, undead: 2, scale: 'WIS', desc: 'A ring of light that burns the wicked.' }),
  K({ id: 'blessing', cls: 'lightbringer', type: 'util', name: 'Blessing', kind: 'buff', elem: 'holy', cost: 15, cd: 30, buff: { WIS: 5, CON: 4, hpRegen: 3 }, dur: 30, desc: 'Everything goes a bit better for a while.' }),
  K({ id: 'guardianwisp', cls: 'lightbringer', name: 'Guardian Wisp', kind: 'summon', elem: 'holy', cost: 30, cd: 25, dmg: [7, 2], dur: 30, scale: 'WIS', desc: 'A friendly light that fights beside you.' }),
  // ---- Hexwright ----
  B({ id: 'hexbolt', cls: 'hexwright', name: 'Hex Bolt', kind: 'bolt', elem: 'shadow', cost: 8, cd: 0.6, dmg: [9, 2.6], speed: 32, size: 0.12, status: 4, weaken: true, scale: 'INT', desc: 'A curse in a bolt. Hexed enemies take more damage.' }),
  B({ id: 'jinxward', cls: 'hexwright', type: 'def', name: 'Jinx Ward', kind: 'ward', elem: 'shadow', cost: 18, cd: 12, amount: [35, 8], thorns: 4, scale: 'INT', desc: 'A ward that bounces bad luck back at attackers.' }),
  B({ id: 'badluck', cls: 'hexwright', type: 'util', name: 'Bad Luck', kind: 'nova', elem: 'shadow', cost: 16, cd: 10, dmg: [4, 1], radius: 8, status: 5, weaken: true, scale: 'CHA', desc: 'Everything nearby starts missing. A lot.' }),
  K({ id: 'withering', cls: 'hexwright', name: 'Withering', kind: 'zone', elem: 'shadow', cost: 22, cd: 10, dmg: [12, 3], radius: 3.5, dur: 7, range: 14, weaken: true, scale: 'INT', desc: 'A patch of curse that rots whatever stands in it.' }),
  K({ id: 'evileye', cls: 'hexwright', name: 'Evil Eye', kind: 'bolt', elem: 'shadow', cost: 18, cd: 4, dmg: [28, 6], speed: 40, size: 0.16, status: 3, scale: 'INT', desc: 'A look that hurts.' }),
  K({ id: 'curseofrags', cls: 'hexwright', type: 'util', name: 'Curse of Rags', kind: 'cone', elem: 'shadow', cost: 14, cd: 8, dmg: [8, 2], range: 7, arc: 1.4, weaken: true, status: 6, scale: 'CHA', desc: 'Their armour falls apart. Spiritually.' }),
  // ---- Chronomancer ----
  B({ id: 'haste', cls: 'chronomancer', type: 'util', name: 'Haste', kind: 'buff', elem: 'time', cost: 14, cd: 20, buff: { moveSpeed: 25, castSpeed: 25, atkSpeed: 25 }, dur: 12, scale: 'WIS', desc: 'Everything you do is faster.' }),
  B({ id: 'rewind', cls: 'chronomancer', type: 'def', name: 'Rewind', kind: 'heal', elem: 'time', cost: 22, cd: 18, amount: [50, 10], rewind: true, scale: 'WIS', desc: 'Undo the last few seconds of damage.' }),
  B({ id: 'slowfield', cls: 'chronomancer', name: 'Slow Field', kind: 'zone', elem: 'time', cost: 16, cd: 9, dmg: [5, 1.5], radius: 4, dur: 7, range: 14, status: 2, scale: 'INT', desc: 'A bubble where time crawls.' }),
  K({ id: 'timebolt', cls: 'chronomancer', name: 'Time Bolt', kind: 'bolt', elem: 'time', cost: 8, cd: 0.5, dmg: [11, 3], speed: 36, size: 0.12, status: 1, scale: 'INT', desc: 'A bolt that ages what it hits.' }),
  K({ id: 'stopwatch', cls: 'chronomancer', name: 'Stopwatch', kind: 'nova', elem: 'time', cost: 30, cd: 16, dmg: [10, 2], radius: 8, status: 3, freeze: true, scale: 'INT', desc: 'Stop time around you for a moment.' }),
  K({ id: 'paradox', cls: 'chronomancer', type: 'util', name: 'Paradox', kind: 'dash', elem: 'time', cost: 15, cd: 6, dist: 12, dmg: [12, 3], scale: 'INT', desc: 'Be somewhere else. You were always there.' }),
  // ---- Spore Sage ----
  B({ id: 'sporecloud', cls: 'sporesage', name: 'Spore Cloud', kind: 'zone', elem: 'poison', cost: 10, cd: 1.2, dmg: [8, 2.2], radius: 2.6, dur: 5, range: 12, status: 4, scale: 'WIS', desc: 'A cloud of choking spores.' }),
  B({ id: 'barkskin', cls: 'sporesage', type: 'def', name: 'Barkskin', kind: 'ward', elem: 'poison', cost: 18, cd: 12, amount: [50, 10], scale: 'CON', desc: 'Your skin hardens into bark.' }),
  B({ id: 'forage', cls: 'sporesage', type: 'util', name: 'Forage', kind: 'heal', elem: 'poison', cost: 8, cd: 30, amount: [15, 3], hunger: 40, scale: 'WIS', desc: 'Find something edible. Somewhere. Probably.' }),
  K({ id: 'thornvolley', cls: 'sporesage', name: 'Thorn Volley', kind: 'volley', elem: 'poison', cost: 14, cd: 3, dmg: [8, 2], count: 5, spread: 0.5, speed: 32, size: 0.08, status: 3, scale: 'WIS', desc: 'A fan of poisoned thorns.' }),
  K({ id: 'rootsnare', cls: 'sporesage', name: 'Root Snare', kind: 'zone', elem: 'poison', cost: 18, cd: 10, dmg: [6, 1.5], radius: 3, dur: 6, range: 12, root: true, status: 3, scale: 'WIS', desc: 'Roots burst up and hold enemies.' }),
  K({ id: 'regrowth', cls: 'sporesage', type: 'def', name: 'Regrowth', kind: 'buff', elem: 'poison', cost: 18, cd: 25, buff: { hpRegen: 7 }, dur: 20, scale: 'WIS', desc: 'Moss grows over your wounds.' }),
  // ---- Spellsword ----
  B({ id: 'elementalbrand', cls: 'spellsword', type: 'util', name: 'Elemental Brand', kind: 'buff', elem: 'arcane', cost: 14, cd: 20, buff: { weaponElem: 1, dmg: 8 }, dur: 20, scale: 'INT', desc: 'Imbue your weapon with fire. Every swing burns.' }),
  B({ id: 'arcaneparry', cls: 'spellsword', type: 'def', name: 'Arcane Parry', kind: 'ward', elem: 'arcane', cost: 16, cd: 10, amount: [40, 8], parry: true, scale: 'INT', desc: 'A magical guard. Your next parry window is huge.' }),
  B({ id: 'blinkstep', cls: 'spellsword', type: 'util', name: 'Blink Step', kind: 'dash', elem: 'arcane', cost: 12, cd: 4, dist: 9, dmg: [12, 3], scale: 'INT', desc: 'Teleport a short way, slashing as you arrive.' }),
  K({ id: 'arcaneblade', cls: 'spellsword', name: 'Arcane Blade', kind: 'cone', elem: 'arcane', cost: 14, cd: 3, dmg: [22, 5], range: 5, arc: 1.2, scale: 'INT', desc: 'A wave of force off your blade.' }),
  K({ id: 'spellstrike', cls: 'spellsword', name: 'Spellstrike', kind: 'strike', elem: 'arcane', cost: 16, cd: 5, dmg: [32, 7], range: 2.8, arc: 1.4, status: 1, scale: 'STR', desc: 'A blow charged with magic. Stuns.' }),
  K({ id: 'arcanemissile', cls: 'spellsword', name: 'Arcane Missiles', kind: 'volley', elem: 'arcane', cost: 16, cd: 3, dmg: [8, 2], count: 4, spread: 0.3, speed: 36, size: 0.09, scale: 'INT', desc: 'A burst of homing-ish force bolts.' }),
  // ---- Plumber ----
  B({ id: 'wrenchsmash', cls: 'plumber', name: 'Wrench Smash', kind: 'strike', elem: 'phys', cost: 12, cd: 3.5, dmg: [26, 5], range: 2.8, arc: 1.3, status: 1, scale: 'STR', desc: 'A big two-handed wrench swing. Stuns.' }),
  B({ id: 'pipedream', cls: 'plumber', type: 'util', name: 'Pipe Dream', kind: 'dash', elem: 'water', cost: 14, cd: 6, dist: 12, dmg: [8, 2], scale: 'STR', desc: 'Dive into the pipes and pop out further ahead.' }),
  B({ id: 'plunger', cls: 'plumber', type: 'def', name: 'Plunger Guard', kind: 'ward', elem: 'phys', cost: 16, cd: 10, amount: [50, 10], scale: 'CON', desc: 'Hold up a plunger. Somehow it blocks things.' }),
  K({ id: 'burstpipe', cls: 'plumber', name: 'Burst Pipe', kind: 'cone', elem: 'water', cost: 18, cd: 6, dmg: [18, 4], range: 7, arc: 1.2, knock: 8, status: 4, scale: 'STR', desc: 'A jet of high-pressure dirty water.' }),
  K({ id: 'drainclean', cls: 'plumber', name: 'Drain Clean', kind: 'nova', elem: 'phys', cost: 22, cd: 8, dmg: [20, 5], radius: 5, scale: 'STR', desc: 'Spin the snake. Everything nearby gets unclogged.' }),
  K({ id: 'callout', cls: 'plumber', type: 'util', name: 'Emergency Call-Out', kind: 'buff', elem: 'phys', cost: 10, cd: 30, buff: { STR: 6, moveSpeed: 15 }, dur: 20, desc: 'Double-time rates. Double-time effort.' }),
  // ---- Paramedic ----
  B({ id: 'defib', cls: 'paramedic', name: 'Defib', kind: 'strike', elem: 'storm', cost: 14, cd: 4, dmg: [22, 5], range: 2.6, arc: 1.2, status: 1.2, scale: 'WIS', desc: 'Clear! Shocks and stuns. Also revives you once per floor.' }),
  B({ id: 'firstaid', cls: 'paramedic', type: 'def', name: 'First Aid', kind: 'heal', elem: 'holy', cost: 14, cd: 6, amount: [45, 10], scale: 'WIS', desc: 'Bandages, antiseptic, a lollipop.' }),
  B({ id: 'adrenaline', cls: 'paramedic', type: 'util', name: 'Adrenaline', kind: 'buff', elem: 'phys', cost: 12, cd: 25, buff: { moveSpeed: 20, atkSpeed: 20, armor: 10 }, dur: 12, desc: 'A shot of something strong.' }),
  K({ id: 'triage', cls: 'paramedic', type: 'def', name: 'Triage Tent', kind: 'zone', elem: 'holy', cost: 22, cd: 25, dmg: [0, 0], radius: 4, dur: 10, range: 6, healZone: 6, scale: 'WIS', desc: 'A tent where you heal over time.' }),
  K({ id: 'sedative', cls: 'paramedic', name: 'Sedative Dart', kind: 'bolt', elem: 'poison', cost: 10, cd: 3, dmg: [10, 2.4], speed: 44, size: 0.07, status: 3, scale: 'DEX', desc: 'A dart that makes enemies very, very slow.' }),
  K({ id: 'stretcher', cls: 'paramedic', type: 'def', name: 'Crash Cart', kind: 'ward', elem: 'phys', cost: 18, cd: 12, amount: [55, 10], scale: 'CON', desc: 'Hide behind a crash cart.' }),
  // ---- Demolitions Hobbyist ----
  B({ id: 'pipebomb', cls: 'demolitions', name: 'Pipe Bomb', kind: 'bolt', elem: 'fire', cost: 12, cd: 2.5, dmg: [24, 6], speed: 18, size: 0.18, explode: 3.2, status: 2, arc: 4, scale: 'DEX', desc: 'Lob a homemade bomb.' }),
  B({ id: 'garagechem', cls: 'demolitions', type: 'util', name: 'Garage Chemistry', kind: 'zone', elem: 'poison', cost: 14, cd: 8, dmg: [10, 2.5], radius: 3, dur: 6, range: 12, status: 3, scale: 'INT', desc: 'Mix cleaning supplies. Do not breathe.' }),
  B({ id: 'blastjump', cls: 'demolitions', type: 'def', name: 'Blast Jump', kind: 'dash', elem: 'fire', cost: 12, cd: 6, dist: 10, lift: 5, dmg: [12, 3], scale: 'DEX', desc: 'Blow yourself out of trouble. Mostly.' }),
  K({ id: 'clusterbomb', cls: 'demolitions', name: 'Cluster Bomb', kind: 'volley', elem: 'fire', cost: 22, cd: 6, dmg: [14, 3.5], count: 4, spread: 0.6, speed: 18, size: 0.14, explode: 2.4, arc: 4, scale: 'DEX', desc: 'One bomb that becomes four bombs.' }),
  K({ id: 'proxmine', cls: 'demolitions', name: 'Proximity Mine', kind: 'zone', elem: 'fire', cost: 16, cd: 9, dmg: [30, 7], radius: 2.5, dur: 15, range: 8, status: 2, scale: 'DEX', desc: 'Leave a present on the floor.' }),
  K({ id: 'bigone', cls: 'demolitions', name: 'The Big One', kind: 'nova', elem: 'fire', cost: 40, cd: 25, dmg: [70, 14], radius: 9, status: 4, scale: 'DEX', desc: 'Everything you have, all at once.' }),
  // ---- Dentist ----
  B({ id: 'extraction', cls: 'dentist', name: 'Extraction', kind: 'strike', elem: 'phys', cost: 10, cd: 3, dmg: [28, 6], range: 2.4, arc: 1, crit: 30, scale: 'DEX', desc: 'A precise pull. Huge crit chance. Keep the teeth.' }),
  B({ id: 'novocaine', cls: 'dentist', type: 'def', name: 'Novocaine', kind: 'buff', elem: 'phys', cost: 14, cd: 20, buff: { armor: 25, dodge: 15 }, dur: 10, desc: 'You don’t feel a thing.' }),
  B({ id: 'drillrush', cls: 'dentist', type: 'util', name: 'Drill Rush', kind: 'dash', elem: 'phys', cost: 10, cd: 4, dist: 8, dmg: [16, 4], status: 2, scale: 'DEX', desc: 'Dash in with the drill whining.' }),
  K({ id: 'flossgarrote', cls: 'dentist', name: 'Floss Garrote', kind: 'strike', elem: 'phys', cost: 14, cd: 6, dmg: [22, 5], range: 2.4, arc: 1.2, status: 5, scale: 'DEX', desc: 'Minty, and causes bleeding.' }),
  K({ id: 'gasandair', cls: 'dentist', name: 'Gas and Air', kind: 'cone', elem: 'poison', cost: 16, cd: 8, dmg: [8, 2], range: 6, arc: 1.2, status: 3, scale: 'INT', desc: 'Enemies get giggly, then slow, then asleep.' }),
  K({ id: 'rootcanal', cls: 'dentist', name: 'Root Canal', kind: 'strike', elem: 'phys', cost: 20, cd: 10, dmg: [50, 10], range: 2.4, arc: 0.9, crit: 50, scale: 'DEX', desc: 'The worst procedure in the dungeon.' }),
  // ---- Repo Agent ----
  B({ id: 'repossess', cls: 'repoagent', name: 'Repossess', kind: 'strike', elem: 'phys', cost: 12, cd: 6, dmg: [18, 4], range: 2.6, arc: 1.2, steal: true, scale: 'DEX', desc: 'Snatch something they’re holding. Sometimes it’s loot.' }),
  B({ id: 'towhook', cls: 'repoagent', type: 'util', name: 'Tow Hook', kind: 'bolt', elem: 'phys', cost: 10, cd: 5, dmg: [10, 2.4], speed: 44, size: 0.1, pull: true, scale: 'DEX', desc: 'Hook an enemy and yank them closer.' }),
  B({ id: 'paperwork', cls: 'repoagent', type: 'def', name: 'Paperwork Shield', kind: 'ward', elem: 'phys', cost: 14, cd: 10, amount: [40, 8], scale: 'CHA', desc: 'A clipboard of legal notices. Somehow deflects blows.' }),
  K({ id: 'finalnotice', cls: 'repoagent', name: 'Final Notice', kind: 'bolt', elem: 'shadow', cost: 16, cd: 4, dmg: [26, 6], speed: 42, size: 0.12, weaken: true, scale: 'CHA', desc: 'A red envelope. It hurts to read.' }),
  K({ id: 'lockpick', cls: 'repoagent', type: 'util', name: 'Slip Away', kind: 'buff', elem: 'shadow', cost: 12, cd: 20, buff: { dodge: 35, moveSpeed: 20 }, dur: 8, desc: 'You were never here.' }),
  K({ id: 'liquidate', cls: 'repoagent', name: 'Liquidate', kind: 'nova', elem: 'phys', cost: 22, cd: 9, dmg: [22, 5], radius: 5, scale: 'DEX', desc: 'Everything must go.' }),
  // ---- Exterminator ----
  B({ id: 'pressuregun', cls: 'exterminator', name: 'Pressure Gun', kind: 'bolt', elem: 'phys', cost: 0, cd: 0.45, dmg: [9, 2.5], speed: 50, size: 0.07, scale: 'DEX', desc: 'A pump-action pellet gun. Your basic shot.' }),
  B({ id: 'fumigate', cls: 'exterminator', name: 'Fumigate', kind: 'zone', elem: 'poison', cost: 18, cd: 8, dmg: [10, 2.6], radius: 3.5, dur: 7, range: 14, status: 5, scale: 'WIS', desc: 'A poison cloud. Hits pests extra hard.' }),
  B({ id: 'bugbomb', cls: 'exterminator', type: 'util', name: 'Bug Bomb', kind: 'bolt', elem: 'poison', cost: 14, cd: 6, dmg: [18, 4], speed: 20, size: 0.16, explode: 3.5, status: 4, arc: 4, scale: 'DEX', desc: 'Lob a fogger. Everyone gets fogged.' }),
  K({ id: 'sprayer', cls: 'exterminator', name: 'Sprayer', kind: 'cone', elem: 'poison', cost: 12, cd: 2, dmg: [12, 3], range: 7, arc: 0.9, status: 4, scale: 'DEX', desc: 'A wide spray of something that smells awful.' }),
  K({ id: 'glueboard', cls: 'exterminator', name: 'Glue Board', kind: 'zone', elem: 'phys', cost: 10, cd: 8, dmg: [2, 0.5], radius: 3, dur: 12, range: 10, root: true, scale: 'WIS', desc: 'Sticky. Very sticky.' }),
  K({ id: 'hazmat', cls: 'exterminator', type: 'def', name: 'Hazmat Suit', kind: 'ward', elem: 'poison', cost: 16, cd: 14, amount: [50, 10], scale: 'CON', desc: 'Zip up. Nothing gets in.' }),
  // ---- Mall Santa ----
  B({ id: 'naughtylist', cls: 'mallsanta', type: 'util', name: 'Naughty List', kind: 'bolt', elem: 'holy', cost: 10, cd: 4, dmg: [8, 2], speed: 36, size: 0.14, weaken: true, status: 6, scale: 'CHA', desc: 'Mark an enemy. Marked enemies take 30% more damage.' }),
  B({ id: 'sackslam', cls: 'mallsanta', name: 'Sack Slam', kind: 'nova', elem: 'phys', cost: 16, cd: 5, dmg: [18, 4], radius: 4.5, taunt: true, status: 0.8, scale: 'CON', desc: 'Swing the sack. Everyone nearby wants a word with you.' }),
  B({ id: 'paddedsuit', cls: 'mallsanta', type: 'def', name: 'Padded Suit', kind: 'ward', elem: 'phys', cost: 18, cd: 10, amount: [75, 13], scale: 'CON', desc: 'It’s mostly padding. It works.' }),
  K({ id: 'cocoa', cls: 'mallsanta', type: 'def', name: 'Hot Cocoa', kind: 'heal', elem: 'holy', cost: 12, cd: 12, amount: [40, 8], thirst: 25, scale: 'CHA', desc: 'Warm, sweet, restorative.' }),
  K({ id: 'sleighrush', cls: 'mallsanta', type: 'util', name: 'Sleigh Rush', kind: 'dash', elem: 'phys', cost: 14, cd: 6, dist: 10, dmg: [16, 4], status: 1, scale: 'CON', desc: 'Ho ho ho. Out of the way.' }),
  K({ id: 'coal', cls: 'mallsanta', name: 'Lump of Coal', kind: 'volley', elem: 'fire', cost: 14, cd: 4, dmg: [9, 2.2], count: 4, spread: 0.5, speed: 30, size: 0.1, status: 1, scale: 'CHA', desc: 'For the naughty. Thrown hard.' }),
  // ---- Night Security ----
  B({ id: 'batonstrike', cls: 'nightsecurity', name: 'Baton Strike', kind: 'strike', elem: 'phys', cost: 10, cd: 3, dmg: [22, 5], range: 2.6, arc: 1.2, status: 1, scale: 'DEX', desc: 'A practised baton blow. Stuns.' }),
  B({ id: 'rounds', cls: 'nightsecurity', type: 'util', name: 'Rounds', kind: 'reveal', elem: 'phys', cost: 8, cd: 20, desc: 'Walk your rounds. Every mob nearby shows on your map.' }),
  B({ id: 'flashlight', cls: 'nightsecurity', type: 'def', name: 'Flashlight', kind: 'cone', elem: 'holy', cost: 10, cd: 6, dmg: [6, 1.5], range: 9, arc: 0.7, status: 2, scale: 'WIS', desc: 'Shine it in their eyes. They stumble.' }),
  K({ id: 'tripwire', cls: 'nightsecurity', name: 'Tripwire', kind: 'zone', elem: 'phys', cost: 12, cd: 8, dmg: [12, 3], radius: 2.5, dur: 15, range: 8, root: true, scale: 'DEX', desc: 'A wire across the floor. Classic.' }),
  K({ id: 'taser', cls: 'nightsecurity', name: 'Taser', kind: 'bolt', elem: 'storm', cost: 12, cd: 3, dmg: [16, 4], speed: 46, size: 0.08, status: 1.2, scale: 'DEX', desc: 'Ten thousand volts. Mostly legal.' }),
  K({ id: 'shadowpatrol', cls: 'nightsecurity', type: 'util', name: 'Shadow Patrol', kind: 'buff', elem: 'shadow', cost: 12, cd: 25, buff: { dodge: 30, crit: 15 }, dur: 12, desc: 'Move through the dark like you own it. You do; you’re security.' }),
];
export const skillDef = (id) => SKILLDEFS.find((s) => s.id === id);
export const classSkills = (cls) => SKILLDEFS.filter((s) => s.cls === cls);
export const ELEM = { fire: { color: '#ff8a2a', core: '#ffb040' }, frost: { color: '#9ae8ff', core: '#e8fbff' }, storm: { color: '#ffe040', core: '#ffffff' }, poison: { color: '#7ad83a', core: '#c8ff9a' }, holy: { color: '#fff4c0', core: '#ffffff' }, phys: { color: '#d8d2c0', core: '#ffffff' }, shadow: { color: '#8a5ac8', core: '#d8b8ff' }, wind: { color: '#b8f0d8', core: '#ffffff' }, earth: { color: '#a8804a', core: '#e8c890' }, water: { color: '#3a9aff', core: '#bfe4ff' }, death: { color: '#a8a0c8', core: '#ffffff' }, time: { color: '#e8c87a', core: '#fff4d0' }, arcane: { color: '#6ab8ff', core: '#e0f0ff' } };
// what each element does on hit: burn (DoT), slow, stun, poison (DoT), wet (more storm damage), knock, weaken
export const ELEM_STATUS = { fire: 'burn', frost: 'slow', storm: 'stun', poison: 'poison', water: 'wet', earth: 'stun', wind: 'slow', death: 'poison', shadow: 'weaken', holy: 'stun', time: 'slow', arcane: 'none', phys: 'bleed' };
