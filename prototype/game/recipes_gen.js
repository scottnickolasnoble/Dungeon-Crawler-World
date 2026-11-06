// Fills every crafting table up to 60 recipes: 12 product lines per table x 5 tiers (I-V).
// Inputs climb from scrap to components, essences, Tier IV materials and boss cores; outputs scale with tier.
export const MATS_EXTRA = {
  alloy: 'Reinforced Alloy', prism: 'Prism Glass', silk: 'Silkwire Thread', bosscore: 'Boss Core', ectoplasm: 'Showbiz Ectoplasm', gearbox: 'Gearbox',
};
const ESS = ['ember', 'frost', 'storm', 'tide', 'light', 'shadow'];
// shared input ladders per tier: [basic, component, essence, advanced, apex]
const ladder = (t, a, b, c) => {
  const i = {}; const add = (k, n) => { i[k] = (i[k] || 0) + n; };
  add(a[0], 2 + t); if (t >= 2) add(b[0], t); if (t >= 3) add(c, t - 1); if (t >= 4) add(b[1] || 'alloy', t - 2); if (t >= 5) add('bosscore', 1);
  rarityMats(t, add); return i;
};
const TIERN = ['I', 'II', 'III', 'IV', 'V'];
// higher tiers need rarity materials: scrap gear of that rarity, or find them on tougher monsters
export function rarityMats(t, add) { if (t === 2) add('tempered', 1); if (t === 3) { add('tempered', 2); add('bluechip', 1); } if (t === 4) { add('bluechip', 2); add('primetime', 1); } if (t === 5) { add('primetime', 2); add('showstopper', 1); } }

export function generateRecipes(existing, R, C, Gr) {
  const out = []; const names = new Set(existing.map((r) => r.name));
  const push = (r) => { if (names.has(r.name)) return; names.add(r.name); out.push(r); };
  const count = (table) => existing.filter((r) => r.table === table).length + out.filter((r) => r.table === table).length;
  // spread the free slots evenly over the five tiers; each tier drops a different line so every line still appears
  const fill = (table, lines, cap = 60) => { const avail = cap - count(table); const q = Math.floor(avail / 5); let extra = avail - q * 5;
    for (let t = 1; t <= 5; t++) { const n = Math.min(lines.length, q + (t === 5 ? extra : 0)); for (let k = 0; k < lines.length && out.filter((r) => r.table === table && r.tier === t).length < n; k++) push(lines[(k + t * 3) % lines.length](t)); }
    for (let t = 5; t >= 1 && count(table) < cap; t--) for (const L of lines) { if (count(table) >= cap) break; push(L(t)); } };
  const pre = (arr, t) => arr[t - 1];

  // WORKBENCH: tools, utility gear and processed materials
  const WB = ['Scrap', 'Sturdy', 'Rugged', 'Alloy', 'Showpiece'];
  fill('workbench', [
    (t) => R('workbench', t, `${pre(WB, t)} Crowbar`, ladder(t, ['scrapmetal'], ['steel', 'alloy'], 'storm'), Gr('main', `${pre(WB, t)} Crowbar`, { dmg: 8 + t * 7, STR: t }, 'work')),
    (t) => R('workbench', t, `${pre(WB, t)} Backpack`, ladder(t, ['cloth'], ['strap', 'silk'], 'light'), C(`${pre(WB, t)} Backpack`, { bag: 4 + t * 2 }, 'More pockets. More problems.')),
    (t) => R('workbench', t, `${pre(WB, t)} Tool Belt`, ladder(t, ['rubber'], ['strap', 'alloy'], 'storm'), Gr('belt', `${pre(WB, t)} Tool Belt`, { armor: 3 + t * 3, DEX: t })),
    (t) => R('workbench', t, `${pre(WB, t)} Lantern`, ladder(t, ['glass'], ['vial', 'prism'], 'light'), Gr('off', `${pre(WB, t)} Lantern`, { light: t, WIS: t, mana: 8 * t })),
    (t) => R('workbench', t, `${pre(WB, t)} Hubcap Buckler`, ladder(t, ['scrapmetal'], ['bolt', 'alloy'], 'tide'), Gr('off', `${pre(WB, t)} Hubcap Buckler`, { armor: 6 + t * 5, CON: t })),
    (t) => R('workbench', t, `${pre(WB, t)} Work Gloves`, ladder(t, ['rubber'], ['strap', 'silk'], 'storm'), Gr('gloves', `${pre(WB, t)} Work Gloves`, { armor: 2 + t * 3, crit: t })),
    (t) => R('workbench', t, `${pre(WB, t)} Repair Kit`, ladder(t, ['bolt'], ['glue', 'alloy'], 'light'), C(`${pre(WB, t)} Repair Kit`, { hp: 30 + t * 30, buff: 'armor', amount: 5 * t, mins: 10 }, 'Duct tape for the soul.')),
    (t) => R('workbench', t, `Spring Coil ${TIERN[t - 1]}`, ladder(t, ['scrapmetal'], ['steel', 'alloy'], 'storm'), { mat: 'spring', n: 1 + t }),
    (t) => R('workbench', t, `Rope Bundle ${TIERN[t - 1]}`, ladder(t, ['cloth'], ['strap', 'silk'], 'tide'), { mat: 'strap', n: 1 + t }),
    (t) => R('workbench', t, `${pre(WB, t)} Gearbox`, ladder(t, ['bolt'], ['spring', 'alloy'], 'storm'), { mat: 'gearbox', n: t }),
    (t) => R('workbench', t, `${pre(WB, t)} Hard Hat`, ladder(t, ['plastic'], ['bolt', 'alloy'], 'light'), Gr('head', `${pre(WB, t)} Hard Hat`, { armor: 4 + t * 4, hp: 10 * t })),
    (t) => R('workbench', t, `${pre(WB, t)} Knee Pads`, ladder(t, ['rubber'], ['strap', 'alloy'], 'tide'), Gr('legs', `${pre(WB, t)} Knee Pads`, { armor: 4 + t * 4, moveSpeed: t })),
  ]);
  // ANVIL: 15 themed weapons (each needs its floor's junk), five tiers each
  const AN = ['Scrap', 'Steel', 'Tempered', 'Alloy', 'Boss-Forged'];
  const W = [['Tyre Iron', 'blunt', { dmg: 14 }, 'rubber'], ['Rebar Pike', 'pierce', { dmg: 14, crit: 1 }, 'wire'], ['Stop-Sign Axe', 'heavy', { dmg: 19 }, 'coneplastic'], ['Jumper-Cable Flail', 'shock', { dmg: 13, shock: 3 }, 'battery'],
    ['Coat-Hanger Rapier', 'quick', { dmg: 11, DEX: 1 }, 'lint'], ['Clothes-Iron Knuckles', 'hot', { dmg: 13, fire: 3 }, 'detergent'], ['Kitchen Cleaver', 'blade', { dmg: 15 }, 'castiron'], ['Neon-Sign Sabre', 'shock', { dmg: 15, shock: 4 }, 'neon'],
    ['Golf Driver', 'blunt', { dmg: 16, crit: 2 }, 'clippings'], ['Hedge Trimmers', 'blade', { dmg: 14, atkSpeed: 3 }, 'ceramic'], ['Weed Whacker', 'flail', { dmg: 13 }, 'clippings'], ['Plank Greatsword', 'heavy', { dmg: 21 }, 'sap'],
    ['Antler Pick', 'pierce', { dmg: 15, crit: 2 }, 'chitin'], ['Mic-Stand Staff', 'caster', { spell: 14, CHA: 1 }, 'glitter'], ['Remote-Control Wand', 'caster', { spell: 12, castSpeed: 2 }, 'circuit']];
  fill('anvil', W.map(([n, wt, st, fm]) => (t) => { const s = {}; for (const [k, v] of Object.entries(st)) s[k] = Math.round(v * (1 + (t - 1) * 0.7)); if (t >= 3) s[['fire', 'crit', 'STR', 'INT'][t % 4]] = 2 * t;
    const inp = ladder(t, ['scrapmetal'], ['steel', 'alloy'], ESS[(n.length + t) % 6]); inp[fm] = (inp[fm] || 0) + 1 + t; const g = Gr('main', `${pre(AN, t)} ${n}`, s, 'forged'); g.gear.wtype = wt; return R('anvil', t, `${pre(AN, t)} ${n}`, inp, g); }), 75);
  // ARMOURER: 12 armour pieces
  const AR = ['Patched', 'Riveted', 'Plated', 'Alloy', 'Warlord'];
  const AP = [['head', 'Helm', 5], ['chest', 'Cuirass', 9], ['legs', 'Greaves', 7], ['boots', 'Sabatons', 5], ['gloves', 'Gauntlets', 4], ['shoulders', 'Pauldrons', 5], ['bracers', 'Vambraces', 4], ['belt', 'War Belt', 4], ['off', 'Kite Shield', 10], ['face', 'Visor', 3], ['back', 'Battle Cloak', 4], ['off', 'Riot Shield', 12]];
  fill('armourer', AP.map(([slot, n, a]) => (t) => R('armourer', t, `${pre(AR, t)} ${n}`, ladder(t, ['scrapmetal'], ['steel', 'alloy'], ESS[(a + t) % 6]), Gr(slot, `${pre(AR, t)} ${n}`, { armor: Math.round(a * (1 + (t - 1) * 0.8)), hp: 6 * t * (slot === 'chest' ? 2 : 1), ...(t >= 3 ? { CON: t - 1 } : {}) }))));
  // TAILOR: caster cloth and leather
  const TA = ['Rag', 'Stitched', 'Woven', 'Silkwire', 'Showstopper'];
  const TP = [['chest', 'Robe', { spell: 6, mana: 15 }], ['head', 'Hood', { INT: 1, mana: 8 }], ['legs', 'Trousers', { armor: 3, WIS: 1 }], ['boots', 'Sandals', { moveSpeed: 2 }], ['gloves', 'Casting Gloves', { castSpeed: 2 }], ['shoulders', 'Mantle', { spell: 4 }], ['belt', 'Sash', { manaRegen: 1, mana: 6 }], ['bracers', 'Wraps', { crit: 1, DEX: 1 }], ['back', 'Cape', { armor: 2, CHA: 1 }], ['face', 'Mask', { CHA: 1, crit: 1 }], ['chest', 'Leather Jacket', { armor: 7, DEX: 1 }], ['head', 'Bandana', { DEX: 1, crit: 1 }]];
  fill('tailor', TP.map(([slot, n, st]) => (t) => { const s = {}; for (const [k, v] of Object.entries(st)) s[k] = Math.max(1, Math.round(v * (1 + (t - 1) * 0.75))); return R('tailor', t, `${pre(TA, t)} ${n}`, ladder(t, ['cloth'], ['fabric', 'silk'], ESS[(n.length + t) % 6]), Gr(slot, `${pre(TA, t)} ${n}`, s, 'cloth')); }));
  // JEWELLER: six rings and six amulets
  const JW = ['Bent', 'Polished', 'Cut', 'Prism', 'Radiant'];
  const JP = [['ring1', 'Ring of Embers', { fire: 3, INT: 1 }], ['ring1', 'Ring of Frost', { frost: 3, WIS: 1 }], ['ring1', 'Signet of Grit', { STR: 2, hp: 10 }], ['ring1', 'Band of Haste', { castSpeed: 2, moveSpeed: 1 }], ['ring1', 'Loop of Luck', { crit: 2, CHA: 1 }], ['ring1', 'Coil of Storms', { storm: 3, DEX: 1 }], ['amulet', 'Pendant of the Pyre', { fire: 4, spell: 4 }], ['amulet', 'Locket of Lives', { hp: 25, CON: 1 }], ['amulet', 'Charm of Ratings', { CHA: 3 }], ['amulet', 'Medallion of Mana', { mana: 20, WIS: 1 }], ['amulet', 'Choker of Thorns', { armor: 6, crit: 1 }], ['amulet', 'Talisman of the Deep', { INT: 2, light: 1 }]];
  fill('jeweller', JP.map(([slot, n, st]) => (t) => { const s = {}; for (const [k, v] of Object.entries(st)) s[k] = Math.max(1, Math.round(v * (1 + (t - 1) * 0.7))); return R('jeweller', t, `${pre(JW, t)} ${n}`, ladder(t, ['glass'], ['ruby', 'prism'], ESS[(n.length + t) % 6]), Gr(slot, `${pre(JW, t)} ${n}`, s, 'jewel')); }));
  // BOOM BENCH: 12 explosives, Mk I-V
  const BP = [['Cone Grenade', { dmg: 50, radius: 3.5 }], ['Sticky Bomb', { dmg: 60, radius: 3, root: 2 }], ['Incendiary', { dmg: 40, radius: 4, burn: 6 }], ['Cryo Charge', { dmg: 35, radius: 4, freeze: 2 }], ['Shock Grenade', { dmg: 45, radius: 4, root: 1 }], ['Nail Bomb', { dmg: 75, radius: 3 }], ['Smoke Pot', { dmg: 10, radius: 6, root: 1 }], ['Cluster Bomb', { dmg: 55, radius: 5 }], ['Pipe Bomb', { dmg: 90, radius: 3 }], ['Confetti Cannon', { dmg: 30, radius: 6 }], ['Shaped Charge', { dmg: 140, radius: 2.5 }], ['Party Popper of Doom', { dmg: 70, radius: 5, burn: 3 }]];
  fill('boom', BP.map(([n, e]) => (t) => { const eff = { bomb: n.toLowerCase().replace(/ /g, '_') }; for (const [k, v] of Object.entries(e)) eff[k] = k === 'dmg' ? Math.round(v * (1 + (t - 1) * 0.8)) : k === 'radius' ? +(v * (1 + (t - 1) * 0.08)).toFixed(1) : v + (t - 1); return R('boom', t, `${n} Mk ${TIERN[t - 1]}`, ladder(t, ['gunpowder'], ['bolt', 'alloy'], ESS[(n.length + t) % 6]), C(`${n} Mk ${TIERN[t - 1]}`, eff, 'Throw it at the problem. Press G.')); }));
  // ALCHEMY: 12 potions in five strengths
  const AL = ['Minor', 'Lesser', 'Standard', 'Greater', 'Supreme'];
  const AP2 = [['Healing Draught', { hp: 40 }], ['Mana Tonic', { mana: 30 }], ['Elixir of Might', { buff: 'STR', amount: 3, mins: 10 }], ['Elixir of Wits', { buff: 'INT', amount: 3, mins: 10 }], ['Swiftness Brew', { buff: 'moveSpeed', amount: 6, mins: 8 }], ['Ironhide Potion', { buff: 'armor', amount: 10, mins: 8 }], ['Fire Resistance Oil', { buff: 'fire', amount: 5, mins: 10 }], ['Luck Philtre', { buff: 'crit', amount: 3, mins: 10 }], ['Stamina Shot', { buff: 'CON', amount: 2, mins: 10 }], ['Clarity Draught', { buff: 'WIS', amount: 3, mins: 10 }], ['Antidote', { hp: 25, thirst: 10 }], ['Rejuvenation Flask', { hp: 30, mana: 20 }]];
  fill('alchemy', AP2.map(([n, e]) => (t) => { const eff = {}; for (const [k, v] of Object.entries(e)) eff[k] = typeof v === 'number' && k !== 'mins' ? Math.round(v * (1 + (t - 1) * 0.8)) : v; return R('alchemy', t, `${pre(AL, t)} ${n}`, ladder(t, ['herbs'], ['vial', 'prism'], ESS[(n.length + t) % 6]), C(`${pre(AL, t)} ${n}`, eff, 'Tastes like a dare.')); }));
  // COOKSTOVE: 12 dishes in five grades
  const CK = ['Garage', 'Hearty', 'Chef’s', 'Banquet', 'Legendary'];
  const CP = [['Stew', { hunger: 30, buff: 'CON', amount: 1, mins: 10 }], ['Skewers', { hunger: 20, buff: 'STR', amount: 1, mins: 10 }], ['Mushroom Pie', { hunger: 35, buff: 'WIS', amount: 1, mins: 10 }], ['Fried Lamprey', { hunger: 30, buff: 'DEX', amount: 1, mins: 10 }], ['Chili', { hunger: 30, buff: 'fire', amount: 3, mins: 10 }], ['Jerky', { hunger: 15 }], ['Dumplings', { hunger: 25, buff: 'INT', amount: 1, mins: 10 }], ['Omelette', { hunger: 25, hp: 20 }], ['Noodle Bowl', { hunger: 30, thirst: 10 }], ['Meat Loaf', { hunger: 40 }], ['Fruit Tart', { hunger: 20, mana: 20 }], ['Hot Pot', { hunger: 45, buff: 'armor', amount: 4, mins: 10 }]];
  fill('stove', CP.map(([n, e]) => (t) => { const eff = {}; for (const [k, v] of Object.entries(e)) eff[k] = typeof v === 'number' && k !== 'mins' ? Math.round(v * (1 + (t - 1) * 0.5)) : v; return R('stove', t, `${pre(CK, t)} ${n}`, ladder(t, ['mysterymeat'], ['salt', 'cleanwater'], ['ember', 'mushroom', 'herbs'][t % 3]), C(`${pre(CK, t)} ${n}`, eff, 'Cooked with love. And grease.')); }));
  // WATER STILL: 12 drinks
  const ST = ['Filtered', 'Spring', 'Distilled', 'Pristine', 'Divine'];
  const SP = [['Water', { thirst: 35 }], ['Tea', { thirst: 25, buff: 'WIS', amount: 1, mins: 10 }], ['Coffee', { thirst: 20, buff: 'castSpeed', amount: 3, mins: 8 }], ['Electrolyte Mix', { thirst: 30, stamina: 30 }], ['Ice Pop', { thirst: 20, buff: 'frost', amount: 3, mins: 10 }], ['Soda', { thirst: 25, mana: 15 }], ['Brine', { thirst: 15, hp: 15 }], ['Holy Water', { thirst: 20, buff: 'light', amount: 2, mins: 10 }], ['Lemonade', { thirst: 30, buff: 'CHA', amount: 1, mins: 10 }], ['Hot Cocoa', { thirst: 25, hp: 20 }], ['Glacier Melt', { thirst: 40 }], ['Sparkling Water', { thirst: 30, buff: 'DEX', amount: 1, mins: 10 }]];
  fill('still', SP.map(([n, e]) => (t) => { const eff = {}; for (const [k, v] of Object.entries(e)) eff[k] = typeof v === 'number' && k !== 'mins' ? Math.round(v * (1 + (t - 1) * 0.5)) : v; return R('still', t, `${pre(ST, t)} ${n}`, ladder(t, ['dirtywater'], ['vial', 'prism'], ['frost', 'light', 'tide'][t % 3]), C(`${pre(ST, t)} ${n}`, eff, 'Hydration is the real treasure.')); }));
  // TINKER: gadgets, turrets, traps
  const TK = ['Jury-Rigged', 'Wired', 'Calibrated', 'Alloy', 'Prototype'];
  const TKP = [['Flame Turret', C, { turret: 'flame', dmg: 14, secs: 20 }], ['Frost Turret', C, { turret: 'frost', dmg: 10, secs: 20 }], ['Shock Turret', C, { turret: 'shock', dmg: 12, secs: 20 }], ['Nail Turret', C, { turret: 'nail', dmg: 16, secs: 20 }], ['Bear Trap', C, { bomb: 'trap', dmg: 45, radius: 2, root: 3 }], ['Net Launcher', C, { bomb: 'net', dmg: 5, radius: 3, root: 4 }], ['Grappling Hook', Gr, ['off', { moveSpeed: 4 }]], ['Jump Boots', Gr, ['boots', { moveSpeed: 4, DEX: 1 }]], ['Night Goggles', Gr, ['face', { light: 2, crit: 1 }]], ['Decoy Dummy', C, { turret: 'decoy', dmg: 0, secs: 15 }], ['Pocket Drone', C, { turret: 'drone', dmg: 8, secs: 30 }], ['Jetpack', Gr, ['back', { moveSpeed: 6 }]]];
  fill('tinker', TKP.map(([n, kind, e]) => (t) => { const name = `${pre(TK, t)} ${n}`; const inp = ladder(t, ['wire'], ['circuit', 'gearbox'], ESS[(n.length + t) % 6]);
    if (kind === Gr) { const [slot, st] = e; const s = {}; for (const [k, v] of Object.entries(st)) s[k] = Math.round(v * (1 + (t - 1) * 0.6)); return R('tinker', t, name, inp, Gr(slot, name, s, 'gadget')); }
    const eff = {}; for (const [k, v] of Object.entries(e)) eff[k] = typeof v === 'number' ? Math.round(v * (1 + (t - 1) * 0.6)) : v; return R('tinker', t, name, inp, C(name, eff, 'Some assembly required. Mostly done.')); }));
  // IMBUING FONT: 12 effects in five ranks
  const FN = ['Faint', 'Minor', 'Major', 'Grand', 'Mythic'];
  const FP = [['Flame', { fire: 6 }, 'ember'], ['Frost', { frost: 6 }, 'frost'], ['Storm', { storm: 6 }, 'storm'], ['Fortitude', { hp: 20, CON: 1 }, 'light'], ['Haste', { castSpeed: 2, moveSpeed: 2 }, 'storm'], ['Precision', { crit: 2 }, 'shadow'], ['Might', { STR: 2, dmg: 3 }, 'ember'], ['Wisdom', { WIS: 2, mana: 10 }, 'tide'], ['Warding', { armor: 6 }, 'light'], ['Charisma', { CHA: 2 }, 'light'], ['Sorcery', { spell: 6, INT: 1 }, 'shadow'], ['Tides', { tide: 6, hp: 10 }, 'tide']];
  fill('font', FP.map(([n, add, ess]) => (t) => { const a = {}; for (const [k, v] of Object.entries(add)) a[k] = Math.round(v * (1 + (t - 1) * 0.7)); const inp = { [ess]: 1 + t }; if (t >= 2) inp.vial = t - 1; if (t >= 4) inp.prism = t - 3; if (t >= 5) inp.bosscore = 1; rarityMats(t, (k, n) => { inp[k] = (inp[k] || 0) + n; }); return R('font', t, `Imbue: ${pre(FN, t)} ${n}`, inp, { imbue: { target: 'any', add: a, tag: `Imbued: ${pre(FN, t)} ${n}` } }); }));
  // SCRIBE: scrolls, maps and tomes
  const SC = ['Scrawled', 'Inked', 'Illuminated', 'Gilded', 'Forbidden'];
  const SCP = [['Scroll of Fireball', { scroll: 1 }], ['Scroll of Recall', { recall: 1 }], ['Scroll of Mending', { hp: 60 }], ['Scroll of Mana', { mana: 50 }], ['District Map', { map: 1 }], ['Scroll of Haste', { buff: 'moveSpeed', amount: 10, mins: 5 }], ['Scroll of Warding', { buff: 'armor', amount: 15, mins: 5 }], ['Scroll of Insight', { buff: 'INT', amount: 4, mins: 8 }], ['Scroll of Might', { buff: 'STR', amount: 4, mins: 8 }], ['Treasure Map', { map: 1 }], ['Scroll of Luck', { buff: 'crit', amount: 5, mins: 5 }], ['Sponsor Pitch', { buff: 'CHA', amount: 4, mins: 10 }]];
  fill('scribe', SCP.map(([n, e]) => (t) => { const eff = {}; for (const [k, v] of Object.entries(e)) eff[k] = typeof v === 'number' && !['mins', 'scroll', 'map', 'recall'].includes(k) ? Math.round(v * (1 + (t - 1) * 0.6)) : v; return R('scribe', t, `${pre(SC, t)} ${n}`, ladder(t, ['paper'], ['ink', 'ectoplasm'], ESS[(n.length + t) % 6]), C(`${pre(SC, t)} ${n}`, eff, 'Read it out loud. Dramatically.')); }));
  return out;
}

// Tier IV-V material recipes so the ladder is climbable
export function extraMaterialRecipes(R) {
  return [
    R('workbench', 3, 'Reinforced Alloy', { steel: 2, battery: 1, ember: 1 }, { mat: 'alloy', n: 1 }),
    R('jeweller', 3, 'Prism Glass', { glass: 3, light: 1 }, { mat: 'prism', n: 1 }),
    R('tailor', 3, 'Silkwire Thread', { fabric: 1, wire: 2, storm: 1 }, { mat: 'silk', n: 2 }),
    R('scribe', 2, 'Showbiz Ectoplasm', { ink: 1, shadow: 1 }, { mat: 'ectoplasm', n: 1 }),
  ];
}
