// Mob system: nav-grid flow-field pathfinding, readable attacks (wind-up, ground telegraph, swing, recover),
// ranged throwers, elites, bosses with telegraphed abilities, encampment groups, level scaling and respawns.
import * as THREE from '../node_modules/three/build/three.module.js';
import { rigCharacter, bipedParams, stepRig } from './anim.js';
import { makeGoblin } from '../creature.js';
import { mopWight, fluorescentMoth, pigeonGhoul, vendingMimic, drainLamprey } from '../monsters/tier1.js';
import { sergeantPylon, headCustodianEbb, trafficCone, bulbQueen, oldManCoo, coneKing, bigSucker, machineThatAteDave, grandmaGristle, lostAndFound } from '../monsters/bosses1.js';
import { mallCopOgre, culDeSacHound, gutterHag, bounceHouseSlime, lawnGnome, couponLeech } from '../monsters/tier2.js';
import * as B2 from '../monsters/bosses2.js';
import { poolNPC } from '../npcs/races.js';

// how each model moves: biped walk cycle, slither, wing flap or waddle
const RIG = { lintKing: 'slither', mallcop: 'biped', hound: 'quad', hag: 'biped', slime: 'waddle', gnome: 'biped', leech: 'slither', hunter: 'biped', huntLord: 'biped', dummy: 'none', mothMatron: 'fly', pigeonElder: 'bird', dave: 'waddle', gristle: 'biped', lostfound: 'waddle', kevlar: 'biped', fetch: 'quad', sludge: 'biped', blob: 'waddle', pope: 'biped', notice: 'fly', hoa: 'biped', brick: 'biped', kraken: 'slither', sprinkler: 'waddle', icecream: 'waddle', matriarch: 'quad', mallmother: 'slither', mayor: 'biped', goblin: 'biped', thrower: 'biped', captain: 'biped', pylon: 'biped', coneKing: 'biped', wight: 'glide', ebb: 'glide', pigeon: 'bird', coo: 'bird', moth: 'fly', bulbQueen: 'fly', mimic: 'waddle', lamprey: 'slither', bigSucker: 'slither' };
// ---------------- definitions ----------------
// windup = how long the attack is telegraphed (parry window is the last 0.35 s of it plus the swing)
export const MOBDEFS = {
  goblin: { name: 'Traffic-Cone Goblin', model: 'goblin', hp: 40, dmg: 6, speed: 3.4, reach: 1.9, arc: 1.4, windup: 0.6, swing: 0.18, recover: 0.65, xp: 20, aggro: 15, barks: ['OI! CONE ZONE!', 'Shiny! MINE!', 'Get the tall one!', 'Hrrk! Fresh meat!', 'Boss said nobody passes!'] },
  thrower: { name: 'Cone Chucker', model: 'thrower', hp: 30, dmg: 7, speed: 3.0, reach: 1.7, arc: 1.2, windup: 0.6, swing: 0.18, recover: 0.7, xp: 22, aggro: 18, ranged: { min: 6, max: 16, windup: 0.85, speed: 13, cd: 2.2 }, barks: ['Heads up! HEH HEH.', 'Cone incoming!', 'Catch!'] },
  captain: { name: 'Cone Captain', model: 'captain', hp: 120, dmg: 12, speed: 3.6, reach: 2.2, arc: 1.6, windup: 0.75, swing: 0.2, recover: 0.7, xp: 70, aggro: 16, elite: true, abilities: ['charge'], barks: ['FORM UP, YOU LOT!', 'For the Sergeant!', 'You picked the wrong car park.'] },
  wight: { name: 'Mop Wight', model: 'wight', hp: 55, dmg: 9, speed: 2.7, reach: 2.4, arc: 2.4, windup: 0.85, swing: 0.25, recover: 0.9, xp: 28, aggro: 14, barks: ['...still... on... shift...', 'Mind... the... floor...', 'Clock... in...'] },
  pylon: { name: 'Sergeant Pylon', title: 'Neighbourhood Boss · Pylon Point', model: 'pylon', boss: true, hp: 520, dmg: 16, speed: 3.3, reach: 3.0, arc: 1.7, windup: 0.8, swing: 0.22, recover: 0.75, xp: 650, aggro: 18, leash: 30, abilities: ['slam', 'charge', 'whistle', 'barrage'],
    barks: ['HALT! This is a CONE ZONE!', 'Lads! Fall in!', 'You are parked in MY spot.', 'I have twenty years on the force. Okay, two. In cones.'], enrage: 'SERGEANT PYLON BLOWS HIS WHISTLE IN RAGE' },
  ebb: { name: 'Head Custodian Ebb', title: 'Neighbourhood Boss · Boiler Room 0', model: 'ebb', boss: true, hp: 620, dmg: 18, speed: 2.9, reach: 3.0, arc: 2.6, windup: 0.9, swing: 0.25, recover: 0.8, xp: 800, aggro: 18, leash: 30, abilities: ['sweep', 'puddle', 'clockin', 'keys'],
    barks: ['You are tracking mud on my floor.', 'Shift change, wights! Clock in!', 'Forty years. Not one dry day.'], enrage: 'HEAD CUSTODIAN EBB HAS HAD IT WITH YOU' },
  // training dummy (towns, tutorial): never attacks, shrugs off damage
  dummy: { name: 'Training Dummy', model: 'dummy', hp: 999, dmg: 0, speed: 0, reach: 0, arc: 0, windup: 9, swing: 0.1, recover: 1, xp: 0, aggro: 0, passive: true, barks: ['…'] },
  cardboard: { name: 'Cardboard Goblin', model: 'goblin', hp: 18, dmg: 2, speed: 2.4, reach: 1.9, arc: 1.4, windup: 1.0, swing: 0.2, recover: 0.9, xp: 15, aggro: 20, barks: ['Grr! (on cardboard)', 'Tutorial violence!', 'I am a training goblin!'] },
  // boss variants of regular mobs for the newer encampments
  lintKing: { name: 'The Lint King', title: 'Neighbourhood Boss · The Lint Traps', model: 'bigSucker', boss: true, hp: 560, dmg: 18, speed: 2.0, reach: 3.6, arc: 1.6, windup: 0.85, swing: 0.2, recover: 0.8, xp: 900, aggro: 16, leash: 16, abilities: ['charge', 'slam', 'summon', 'puddle'], summon: 'lamprey', barks: ['Lint… everywhere… mine…', 'The traps are FULL.'], enrage: 'THE LINT KING CLOGS THE DRAINS' },
  mothMatron: { name: 'The Moth Matron', title: 'Neighbourhood Boss · The Lightwell', model: 'moth', scale: 2.3, boss: true, hp: 380, dmg: 13, speed: 3.8, reach: 3.2, arc: 1.8, windup: 0.75, swing: 0.2, recover: 0.7, xp: 520, aggro: 18, leash: 26, abilities: ['nova', 'summon', 'charge'], summon: 'moth', barks: ['Who dims my light?', 'Children, to me!'], enrage: 'THE MOTH MATRON BLAZES' },
  pigeonElder: { name: 'The Pigeon Elder', title: 'Neighbourhood Boss · The Pigeon Loft', model: 'pigeon', scale: 2.0, boss: true, hp: 340, dmg: 12, speed: 3.6, reach: 3.0, arc: 1.6, windup: 0.75, swing: 0.2, recover: 0.7, xp: 480, aggro: 16, leash: 26, abilities: ['charge', 'barrage', 'summon'], summon: 'pigeon', proj: 'crumb', barks: ['COOOOO.', 'The loft provides!'], enrage: 'THE PIGEON ELDER PUFFS UP' },
  dave: { name: 'The Machine That Ate Dave', title: 'Neighbourhood Boss · The Machine Graveyard', model: 'dave', boss: true, hp: 700, dmg: 20, speed: 2.2, reach: 3.2, arc: 1.6, windup: 0.9, swing: 0.22, recover: 0.8, xp: 950, aggro: 16, leash: 22, abilities: ['slam', 'barrage', 'summon'], summon: 'mimic', proj: 'crumb', barks: ['EXACT CHANGE ONLY.', 'DAVE IS NOT AVAILABLE.', 'PLEASE INSERT CONTESTANT.'], enrage: 'THE MACHINE IS OUT OF ORDER. VERY OUT OF ORDER.' },
  lostfound: { name: 'Lost & Found', title: 'Borough Boss · The Lost Property Office', model: 'lostfound', boss: true, hp: 900, dmg: 22, speed: 2.6, reach: 3.4, arc: 1.8, windup: 0.85, swing: 0.22, recover: 0.8, xp: 1500, aggro: 18, leash: 26, abilities: ['slam', 'barrage', 'summon', 'charge'], summon: 'mimic', proj: 'crumb', barks: ['Have you lost something? I have it now.', 'Unclaimed items will be eaten.'], enrage: 'LOST & FOUND IS CLAIMING EVERYTHING' },
  gristle: { name: 'Grandma Gristle', title: 'Neighbourhood Boss · Grandma Gristle’s Kitchen', model: 'gristle', boss: true, hp: 760, dmg: 24, speed: 2.8, reach: 3.0, arc: 1.8, windup: 0.85, swing: 0.22, recover: 0.8, xp: 1400, aggro: 18, leash: 24, abilities: ['puddle', 'nova', 'summon'], summon: 'hag', barks: ['Eat your soup, dearie.', 'Second helpings for everyone!'], enrage: 'GRANDMA GRISTLE IS SERVING DESSERT' },
  // Floors 4-6 regulars
  mallcop: { name: 'Mall-Cop Ogre', model: 'mallcop', hp: 70, dmg: 13, speed: 3.0, reach: 2.4, arc: 1.6, windup: 0.8, swing: 0.22, recover: 0.8, xp: 36, aggro: 15, barks: ['Sir. SIR. No running.', 'You’re banned from the mall. For life.', 'Code red. Code ME.'] },
  hound: { name: 'Cul-de-Sac Hound', model: 'hound', hp: 46, dmg: 11, speed: 5.0, reach: 1.9, arc: 1.4, windup: 0.5, swing: 0.15, recover: 0.6, xp: 30, aggro: 20, barks: ['*BARK BARK BARK*', '*growls at the mailbox*', '*snarl*'] },
  hag: { name: 'Gutter Hag', model: 'hag', hp: 58, dmg: 12, speed: 2.8, reach: 2.2, arc: 1.4, windup: 0.7, swing: 0.2, recover: 0.8, xp: 34, aggro: 15, ranged: { min: 6, max: 14, windup: 0.9, speed: 12, cd: 3 }, proj: 'orb', barks: ['Come closer, sweetie.', 'Soup’s almost ready…', 'Hee hee hee!'] },
  slime: { name: 'Bounce-House Slime', model: 'slime', hp: 64, dmg: 10, speed: 3.2, reach: 2.2, arc: 2, windup: 0.7, swing: 0.2, recover: 0.7, xp: 32, aggro: 14, abilities: ['slam'], barks: ['*boing*', '*wobbly laughter*', '*squelch*'] },
  gnome: { name: 'Lawn Gnome', model: 'gnome', hp: 34, dmg: 9, speed: 3.6, reach: 1.7, arc: 1.4, windup: 0.5, swing: 0.15, recover: 0.6, xp: 24, aggro: 16, ranged: { min: 5, max: 12, windup: 0.7, speed: 13, cd: 2.4 }, proj: 'crumb', barks: ['Off the lawn!', 'HOA violation!', 'Hee! Hee!'] },
  leech: { name: 'Coupon Leech', model: 'leech', hp: 40, dmg: 10, speed: 3.0, reach: 2.0, arc: 1.2, windup: 0.6, swing: 0.16, recover: 0.7, xp: 26, aggro: 13, barks: ['Limited time offer!', 'Buy one, get bitten.', '*paper rustling*'] },
  hunter: { name: 'Tourist Hunter', model: 'hunter', hp: 80, dmg: 14, speed: 3.6, reach: 2.2, arc: 1.4, windup: 0.7, swing: 0.2, recover: 0.7, xp: 48, aggro: 24, elite: true, ranged: { min: 8, max: 22, windup: 1.0, speed: 22, cd: 2.6 }, proj: 'orb', abilities: ['charge'], barks: ['There! Trophy at two o’clock!', 'Hold still, contestant.', 'Licence number 4471. You’re on it.'] },
  // Floors 4-6 bosses
  kevlar: { name: 'Captain Kevlar', title: 'Neighbourhood Boss · Mall Security HQ', model: 'kevlar', boss: true, hp: 1000, dmg: 30, speed: 3.2, reach: 3.0, arc: 1.7, windup: 0.8, swing: 0.22, recover: 0.75, xp: 2400, aggro: 18, leash: 28, abilities: ['charge', 'slam', 'summon', 'barrage'], summon: 'mallcop', proj: 'orb', barks: ['This mall is under MY protection.', 'Backup! BACKUP!'], enrage: 'CAPTAIN KEVLAR CALLS IN EVERYONE' },
  notice: { name: 'The Final Notice', title: 'Neighbourhood Boss · The Coupon Den', model: 'notice', boss: true, hp: 860, dmg: 28, speed: 3.4, reach: 3.0, arc: 1.6, windup: 0.8, swing: 0.2, recover: 0.7, xp: 2200, aggro: 18, leash: 26, abilities: ['barrage', 'nova', 'summon'], summon: 'leech', proj: 'orb', barks: ['THIS IS YOUR FINAL NOTICE.', 'Payment is overdue. So are you.'], enrage: 'THE FINAL NOTICE IS STAMPED IN RED' },
  blob: { name: 'The Birthday Blob', title: 'Neighbourhood Boss · The Bounce Castle', model: 'blob', boss: true, hp: 1100, dmg: 26, speed: 2.6, reach: 3.6, arc: 2.2, windup: 0.9, swing: 0.22, recover: 0.8, xp: 2300, aggro: 16, leash: 26, abilities: ['slam', 'nova', 'summon'], summon: 'slime', barks: ['IT’S MY PARTY!', 'Cake! CAKE!'], enrage: 'THE BIRTHDAY BLOB HAS EATEN THE CAKE' },
  kraken: { name: 'The Food Court Kraken', title: 'Borough Boss · The Food Court Depths', model: 'kraken', boss: true, hp: 1600, dmg: 34, speed: 2.4, reach: 4.4, arc: 2.4, windup: 0.95, swing: 0.25, recover: 0.8, xp: 4000, aggro: 20, leash: 26, abilities: ['sweep', 'puddle', 'barrage', 'summon'], summon: 'slime', proj: 'orb', barks: ['ORDER UP.', 'Would you like fries with your doom?'], enrage: 'THE KRAKEN FLIPS THE TABLES' },
  mallmother: { name: 'Mall Mother', title: 'City Boss · The Atrium', model: 'mallmother', boss: true, hp: 2600, dmg: 40, speed: 2.4, reach: 5, arc: 2.6, windup: 1.0, swing: 0.25, recover: 0.9, xp: 7000, aggro: 22, leash: 30, abilities: ['sweep', 'nova', 'barrage', 'summon', 'charge'], summon: 'mallcop', proj: 'orb', barks: ['Shhh. Shop, my darlings. Shop forever.', 'Nobody leaves the mall.'], enrage: 'MALL MOTHER ANNOUNCES: THE MALL IS CLOSING' },
  pope: { name: 'The Gnome Pope', title: 'Neighbourhood Boss · The Gnome Garden', model: 'pope', boss: true, hp: 1300, dmg: 32, speed: 3.0, reach: 3.0, arc: 1.7, windup: 0.85, swing: 0.22, recover: 0.75, xp: 3000, aggro: 18, leash: 26, abilities: ['nova', 'barrage', 'summon'], summon: 'gnome', proj: 'crumb', barks: ['Kneel, lawn-defiler.', 'Bless this garden. Curse you.'], enrage: 'THE GNOME POPE EXCOMMUNICATES YOU' },
  fetch: { name: 'Mr. Fetch', title: 'Neighbourhood Boss · The Dog Park', model: 'fetch', boss: true, hp: 1200, dmg: 32, speed: 5.0, reach: 2.8, arc: 1.6, windup: 0.6, swing: 0.18, recover: 0.6, xp: 2900, aggro: 22, leash: 30, abilities: ['charge', 'summon', 'slam'], summon: 'hound', barks: ['*the biggest bark you have ever heard*', '*drops a ball at your feet, menacingly*'], enrage: 'MR. FETCH IS A BAD BOY NOW' },
  hoa: { name: 'The HOA President', title: 'Borough Boss · The HOA Clubhouse', model: 'hoa', boss: true, hp: 1900, dmg: 36, speed: 3.0, reach: 3.2, arc: 1.8, windup: 0.85, swing: 0.22, recover: 0.8, xp: 4600, aggro: 20, leash: 28, abilities: ['barrage', 'summon', 'slam', 'charge'], summon: 'gnome', proj: 'orb', barks: ['Your lawn is two millimetres too long.', 'Fined. Fined. FINED.'], enrage: 'THE HOA PRESIDENT HAS CALLED AN EMERGENCY MEETING' },
  mayor: { name: 'Mayor Eternal', title: 'City Boss · Town Hall', model: 'mayor', boss: true, hp: 3000, dmg: 42, speed: 2.8, reach: 3.4, arc: 2, windup: 0.9, swing: 0.24, recover: 0.85, xp: 8000, aggro: 22, leash: 30, abilities: ['slam', 'nova', 'barrage', 'summon', 'charge'], summon: 'hound', proj: 'orb', barks: ['Re-elect me. Forever.', 'This cul-de-sac is a democracy. I am the democracy.'], enrage: 'MAYOR ETERNAL DECLARES A STATE OF EMERGENCY' },
  sludge: { name: 'Auntie Sludge', title: 'Neighbourhood Boss · Hag Hollow', model: 'sludge', boss: true, hp: 1500, dmg: 36, speed: 2.8, reach: 3.0, arc: 1.8, windup: 0.85, swing: 0.22, recover: 0.8, xp: 3600, aggro: 18, leash: 26, abilities: ['puddle', 'barrage', 'summon'], summon: 'hag', proj: 'orb', barks: ['Grandma’s soup was always too salty.', 'Stay for dinner. Forever.'], enrage: 'AUNTIE SLUDGE BOILS OVER' },
  matriarch: { name: 'The Dog Park Matriarch', title: 'Neighbourhood Boss · Wild Kennel', model: 'matriarch', boss: true, hp: 1700, dmg: 38, speed: 4.6, reach: 3.0, arc: 1.7, windup: 0.6, swing: 0.18, recover: 0.6, xp: 4000, aggro: 22, leash: 30, abilities: ['charge', 'summon', 'slam'], summon: 'hound', barks: ['*a howl that shakes the leaves*'], enrage: 'THE MATRIARCH CALLS THE WHOLE PACK' },
  huntLord: { name: 'Lord-Hunter Facet', title: 'Lodge Boss · Glimmerkin Safari Lodge', model: 'hunter', scale: 1.35, boss: true, hp: 2200, dmg: 40, speed: 3.6, reach: 3.0, arc: 1.7, windup: 0.8, swing: 0.2, recover: 0.7, xp: 6000, aggro: 26, leash: 32, abilities: ['charge', 'barrage', 'summon', 'nova'], summon: 'hunter', proj: 'orb', barks: ['A contestant in MY lodge? How sporting.', 'You’ll look wonderful above the fireplace.'], enrage: 'LORD-HUNTER FACET STOPS BEING SPORTING' },
  lamprey: { name: 'Drain Lamprey', model: 'lamprey', hp: 38, dmg: 9, speed: 2.6, reach: 2.0, arc: 1.2, windup: 0.65, swing: 0.16, recover: 0.7, xp: 22, aggro: 11, barks: ['…shhhhllk…', '*wet gurgling*', 'Ssssuck…'] },
  bigSucker: { name: 'The Big Sucker', title: 'Neighbourhood Boss · The Flooded Bay', model: 'bigSucker', boss: true, hp: 480, dmg: 15, speed: 1.9, reach: 3.6, arc: 1.6, windup: 0.85, swing: 0.2, recover: 0.8, xp: 600, aggro: 16, leash: 16, abilities: ['charge', 'slam', 'summon', 'puddle'], summon: 'lamprey', barks: ['Feeeeed meeee…', 'My clutch! Away from my clutch!', 'The drains all lead to ME.'], enrage: 'THE BIG SUCKER THRASHES IN THE FLOODWATER' },
  moth: { name: 'Fluorescent Moth', model: 'moth', hp: 42, dmg: 10, speed: 4.2, reach: 2.0, arc: 1.4, windup: 0.5, swing: 0.16, recover: 0.6, xp: 26, aggro: 17, barks: ['bzzzt… LIGHT…', 'The Queen sees you…', 'bzz bzz BZZ'] },
  pigeon: { name: 'Pigeon Ghoul', model: 'pigeon', hp: 52, dmg: 11, speed: 3.7, reach: 1.9, arc: 1.4, windup: 0.55, swing: 0.18, recover: 0.6, xp: 28, aggro: 15, ranged: { min: 5, max: 13, windup: 0.7, speed: 12, cd: 3 }, proj: 'crumb', barks: ['COO. COO. COO.', 'Got any bread?', 'Mine! MINE! COO!'] },
  mimic: { name: 'Vending Mimic', model: 'mimic', hp: 95, dmg: 17, speed: 2.4, reach: 2.3, arc: 1.3, windup: 0.95, swing: 0.2, recover: 0.9, xp: 40, aggro: 6, elite: true, barks: ['INSERT COIN.', 'OUT OF ORDER. OUT OF PATIENCE.', 'Exact change only. Exact. CHANGE.'] },
  bulbQueen: { name: 'The Bulb Queen', title: 'Neighbourhood Boss · The Lamp Market', model: 'bulbQueen', boss: true, hp: 640, dmg: 22, speed: 3.6, reach: 3.2, arc: 1.8, windup: 0.75, swing: 0.2, recover: 0.7, xp: 1300, aggro: 20, leash: 30, abilities: ['nova', 'barrage', 'summon', 'charge'], summon: 'moth', proj: 'orb', barks: ['You stand in MY light.', 'Children! A new lamp has come to play!', 'Every flame belongs to me.'], enrage: 'THE BULB QUEEN BURNS WHITE-HOT' },
  coo: { name: 'Old Man Coo', title: 'Neighbourhood Boss · The Rooftop Roost', model: 'coo', boss: true, hp: 600, dmg: 21, speed: 3.4, reach: 3.0, arc: 1.7, windup: 0.8, swing: 0.2, recover: 0.75, xp: 1200, aggro: 18, leash: 30, abilities: ['charge', 'barrage', 'summon', 'slam'], summon: 'pigeon', proj: 'crumb', barks: ['Off my roof, you whippersnapper!', 'In my day we ate gravel and liked it.', 'Flock! FLOCK!'], enrage: 'OLD MAN COO HAS LOST HIS FLAT CAP' },
  coneKing: { name: 'The Cone King', title: 'Borough Boss · The Cone Cathedral', model: 'coneKing', boss: true, hp: 900, dmg: 26, speed: 3.4, reach: 3.4, arc: 1.8, windup: 0.85, swing: 0.22, recover: 0.75, xp: 2200, aggro: 20, leash: 32, abilities: ['slam', 'charge', 'barrage', 'summon'], summon: 'captain', proj: 'cone', barks: ['KNEEL before the CONE.', 'Pylon was my sergeant. You will pay his toll in full.', 'Long live the cone!'], enrage: 'THE CONE KING TAKES OFF HIS CROWN. THAT IS BAD.' },
};
const ABIL = {
  slam: { cd: 9, windup: 1.2, range: 4.5 }, nova: { cd: 9, windup: 1.2, range: 6 }, summon: { cd: 22, windup: 0.9, uses: 2 }, charge: { cd: 8, windup: 1.0, range: 14 }, whistle: { cd: 26, windup: 0.9, uses: 2 }, barrage: { cd: 11, windup: 0.9, range: 18 },
  sweep: { cd: 8, windup: 1.1, range: 4.0 }, puddle: { cd: 12, windup: 1.0, range: 16 }, clockin: { cd: 24, windup: 0.9, uses: 2 }, keys: { cd: 9, windup: 0.8, range: 18 },
};
export const scaleHp = (base, lvl) => Math.round(base * (1 + 0.24 * (lvl - 1)));
export const scaleDmg = (base, lvl) => base * (1 + 0.16 * (lvl - 1));

// ---------------- nav grid + flow field ----------------
class NavGrid {
  constructor(col, size, cell = 1) {
    this.cell = cell; this.n = Math.ceil(size / cell); this.half = size / 2; const N = this.n;
    this.block = new Uint8Array(N * N); this.dist = new Uint16Array(N * N); this.stamp = new Uint32Array(N * N); this.cur = 1; this.q = new Int32Array(N * N);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = -this.half + (i + 0.5) * cell, z = -this.half + (j + 0.5) * cell; this.block[i * N + j] = col.blocked(x, z, 0.42, 0.5) ? 1 : 0; }
  }
  idx(x, z) { const i = Math.floor((x + this.half) / this.cell), j = Math.floor((z + this.half) / this.cell); if (i < 0 || j < 0 || i >= this.n || j >= this.n) return -1; return i * this.n + j; }
  center(k) { const i = Math.floor(k / this.n), j = k % this.n; return [-this.half + (i + 0.5) * this.cell, -this.half + (j + 0.5) * this.cell]; }
  free(x, z) { const k = this.idx(x, z); return k >= 0 && !this.block[k]; }
  // BFS from the target out to maxR cells
  flow(tx, tz, maxR = 48) {
    let s = this.idx(tx, tz); if (s < 0) return; this.cur++; const N = this.n;
    if (this.block[s]) { for (const d of [1, -1, N, -N, N + 1, N - 1, -N + 1, -N - 1]) if (!this.block[s + d]) { s = s + d; break; } }
    const si = Math.floor(s / N), sj = s % N; let h = 0, t = 0; this.q[t++] = s; this.stamp[s] = this.cur; this.dist[s] = 0;
    while (h < t) { const k = this.q[h++], i = Math.floor(k / N), j = k % N, d = this.dist[k]; if (Math.abs(i - si) > maxR || Math.abs(j - sj) > maxR) continue;
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue; const nk = ni * N + nj; if (this.block[nk] || this.stamp[nk] === this.cur) continue; if (di && dj && (this.block[i * N + nj] || this.block[ni * N + j])) continue; this.stamp[nk] = this.cur; this.dist[nk] = d + (di && dj ? 3 : 2); this.q[t++] = nk; } }
  }
  // best next waypoint from (x,z) following the field; null if outside it
  next(x, z) {
    const k = this.idx(x, z); if (k < 0 || this.stamp[k] !== this.cur) return null; const N = this.n, i = Math.floor(k / N), j = k % N; let best = k, bd = this.dist[k];
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue; const nk = ni * N + nj; if (this.stamp[nk] !== this.cur || this.block[nk]) continue; if (di && dj && (this.block[i * N + nj] || this.block[ni * N + j])) continue; if (this.dist[nk] < bd) { bd = this.dist[nk]; best = nk; } }
    return best === k ? null : this.center(best);
  }
  los(ax, az, bx, bz) { const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.5); for (let i = 1; i < n; i++) { const t = i / n; if (!this.free(ax + (bx - ax) * t, az + (bz - az) * t)) return false; } return true; }
  nearestFree(x, z) { if (this.free(x, z)) return [x, z]; for (let r = 1; r < 8; r++) for (let a = 0; a < 12; a++) { const px = x + Math.cos(a * 0.52) * r, pz = z + Math.sin(a * 0.52) * r; if (this.free(px, pz)) return [px, pz]; } return [x, z]; }
}

// ---------------- system ----------------
const m0weapon = (b) => !!(b.getObjectByName('weapon') && b.getObjectByName('weapon').visible);
export function createMobSystem(ctx) {
  const { scene, fx, col } = ctx; const mobs = []; const projs = []; const tele = []; const trails = []; const zones = [];
  let nav = null, flowT = 0, flowCell = -1; let noMob = [];
  // towns: monsters can't path into them and get pushed back out if they reach a gate
  function setNoMob(rects) { noMob = rects; if (!nav) return; for (const [x0, z0, x1, z1] of rects) for (let x = x0; x <= x1; x += 1) for (let z = z0; z <= z1; z += 1) { const k = nav.idx(x, z); if (k >= 0) nav.block[k] = 1; } }
  const tmpl = {};
  function modelFor(kind, variant) {
    const d = MOBDEFS[kind];
    if (d.model === 'goblin' || d.model === 'thrower' || d.model === 'captain') {
      const key = 'g' + (variant % 8); if (!tmpl[key]) tmpl[key] = makeGoblin({ variant: variant % 8 });
      const g = tmpl[key].clone();
      if (d.model === 'thrower') { const w = g.getObjectByName('weapon'); if (w) w.visible = false; const c = trafficCone(0.4); c.name = 'held'; c.position.set(-0.33, 1.02, 0.36); g.add(c); }
      if (d.model === 'captain') { for (let i = 0; i < 2; i++) { const c = trafficCone(0.34, i ? '#ffd020' : '#e8590c'); c.position.set(0, 1.7 + i * 0.1, 0.06); g.add(c); } g.scale.setScalar(1.22); }
      else g.scale.setScalar(0.95 + (variant % 3) * 0.05);
      return g;
    }
    if (d.model === 'wight') { if (!tmpl.w) tmpl.w = mopWight(); const g = tmpl.w.clone(); g.scale.setScalar(0.95 + (variant % 3) * 0.06); return g; }
    const T1 = { moth: fluorescentMoth, pigeon: pigeonGhoul, mimic: vendingMimic, lamprey: drainLamprey };
    if (d.model === 'bigSucker') return bigSucker();
    if (d.model === 'dummy') { const g = new THREE.Group(); const straw = new THREE.MeshStandardMaterial({ color: '#d8b860', roughness: 0.9 }); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.7, 8), new THREE.MeshStandardMaterial({ color: '#6a4a2a' })); post.position.y = 0.85; g.add(post); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.8, 12), straw); body.position.y = 1.15; g.add(body); const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), straw); head.position.y = 1.75; g.add(head); const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8), straw); arm.rotation.z = Math.PI / 2; arm.position.y = 1.35; g.add(arm); const tgt = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), new THREE.MeshStandardMaterial({ color: '#c81a14' })); tgt.position.set(0, 1.2, 0.3); g.add(tgt); return g; }
    const MODELS = { mallcop: mallCopOgre, hound: culDeSacHound, hag: gutterHag, slime: bounceHouseSlime, gnome: lawnGnome, leech: couponLeech };
    if (MODELS[d.model]) { const key = d.model + (variant % 3); if (!tmpl[key]) tmpl[key] = MODELS[d.model]({ variant: variant % 3 }); const g = tmpl[key].clone(); return g; }
    if (d.model === 'hunter') { const key = 'hunt' + (variant % 3); if (!tmpl[key]) tmpl[key] = poolNPC({ role: 'guard', race: ['lumen', 'grimhide', 'fennix'][variant % 3], variant: variant % 3 }); const g = tmpl[key].clone(); if (d.scale) g.scale.setScalar(d.scale); return g; }
    const BOSS = { dave: machineThatAteDave, gristle: grandmaGristle, lostfound: lostAndFound, kevlar: B2.captainKevlar, notice: B2.finalNotice, blob: B2.birthdayBlob, kraken: B2.foodCourtKraken, mallmother: B2.mallMother, pope: B2.gnomePope, fetch: B2.mrFetch, hoa: B2.hoaPresident, mayor: B2.mayorEternal, sludge: B2.auntieSludge, matriarch: B2.dogParkMatriarch };
    if (BOSS[d.model]) return BOSS[d.model]();
    if (T1[d.model]) { if (!tmpl[d.model]) tmpl[d.model] = T1[d.model](); const g = tmpl[d.model].clone(); g.scale.multiplyScalar(d.scale || 0.95 + (variant % 3) * 0.06); return g; }
    if (d.model === 'bulbQueen') return bulbQueen(); if (d.model === 'coo') return oldManCoo(); if (d.model === 'coneKing') return coneKing();
    if (d.model === 'pylon') return sergeantPylon();
    if (d.model === 'ebb') return headCustodianEbb();
  }
  function buildNav(size) { nav = new NavGrid(col, size, 1); return nav; }

  function spawn(s) {
    const d = MOBDEFS[s.kind]; const lvl = s.lvl || 1; let [x, z] = nav ? nav.nearestFree(s.x, s.z) : [s.x, s.z];
    const root = new THREE.Group(); const body = modelFor(s.kind, s.variant || 0); root.add(body); root.position.set(x, 0, z); root.rotation.y = Math.random() * 6; scene.add(root);
    // walk rig (vertex-shader legs/arms), measured from the sculpt before scaling games with it
    const rt = RIG[d.model] || 'biped'; let rig = null; const sc0 = body.scale.x; body.scale.setScalar(1);
    if (rt === 'biped') rig = rigCharacter(body, bipedParams(body, { arms: m0weapon(body) ? 0.5 : 1 }), ['weapon', 'held'], ctx.rigged);
    else if (rt === 'bird') rig = rigCharacter(body, bipedParams(body, { hip: 0.3, shoulder: 0.6, arms: 0.3 }), ['weapon', 'held'], ctx.rigged);
    else if (rt === 'glide') rig = rigCharacter(body, { ...bipedParams(body, { arms: 0.6 }), lift: 0.02 }, ['weapon', 'held'], ctx.rigged);
    else if (rt === 'quad') { const P = bipedParams(body, { hip: 0.55, arms: 0 }); rig = rigCharacter(body, { ...P, gap: 0.02, quad: 0.0 }, ['weapon', 'held'], ctx.rigged); }
    else if (rt === 'slither') { const P = bipedParams(body); rig = rigCharacter(body, { hip: P.hip * 2, slither: 0.06 }, [], ctx.rigged); }
    body.scale.setScalar(sc0);
    const wings = []; body.traverse((o) => { if (o.name === 'wing') wings.push({ o, z: o.rotation.z, sx: o.scale.x }); });
    const mats = []; body.traverse((o) => { if (o.isMesh && o.material && (o.material.isMeshPhysicalMaterial || o.material.isMeshStandardMaterial) && o.material.emissive) { o.material = o.material.clone(); mats.push(o.material); } });
    const baseY = body.position.y, baseZ = body.position.z; const weapon = body.getObjectByName('weapon') || body.getObjectByName('held'); const wBase = weapon ? weapon.rotation.clone() : null; const bodyScale = body.scale.x;
    const hp = scaleHp(d.hp, lvl);
    const m = { def: d, kind: s.kind, g: root, body, bodyScale, baseY, baseZ, rig, rigType: rt, wings, stride: Math.max(0.6, (rig ? rig.uHip.value : 0.8) * 1.6), weapon, wBase, mats, lvl, hp, maxHp: hp, home: new THREE.Vector3(x, 0, z), camp: s.camp || null, roam: !s.camp && !d.boss, state: 'idle', act: null, atkCd: 0.5 + Math.random(), abCd: {}, abUses: {}, burn: 0, burnDps: 0, flash: 0, stun: 0, stagger: 0, slow: 0, dead: false, deadT: 0, wander: Math.random() * 10, wanderTarget: null, name: d.name, bar: d.boss ? null : ctx.makeBar(), barkT: 0, enraged: false, spawnSpec: s, respawnT: 0 };
    for (const a of d.abilities || []) m.abCd[a] = ABIL[a].cd * (0.4 + Math.random() * 0.4);
    mobs.push(m); return m;
  }

  // ---------- telegraphs ----------
  const teleMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
  function telegraph(kind, pos, yaw, a, b) { // kind: 'sector'(reach, arc) | 'circle'(r) | 'rect'(len, width)
    const g = new THREE.Group(); g.position.set(pos.x, 0.05, pos.z); let outline, fill;
    if (kind === 'sector') { const geo = new THREE.RingGeometry(0.25, a, 28, 1, -b / 2, b); geo.rotateX(-Math.PI / 2); outline = new THREE.Mesh(geo, teleMat('#ff2a1a', 0.18)); fill = new THREE.Mesh(geo, teleMat('#ff5a2a', 0.42)); g.rotation.y = yaw - Math.PI / 2; }
    else if (kind === 'circle') { const geo = new THREE.CircleGeometry(a, 40); geo.rotateX(-Math.PI / 2); outline = new THREE.Mesh(geo, teleMat('#ff2a1a', 0.18)); fill = new THREE.Mesh(geo, teleMat('#ff5a2a', 0.42)); const ring = new THREE.Mesh(new THREE.RingGeometry(a - 0.12, a, 48).rotateX(-Math.PI / 2), teleMat('#ff3a1a', 0.85)); g.add(ring); fx.push(ring); }
    else { const geo = new THREE.PlaneGeometry(b, a); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, a / 2); outline = new THREE.Mesh(geo, teleMat('#ff2a1a', 0.18)); fill = new THREE.Mesh(geo, teleMat('#ff5a2a', 0.42)); g.rotation.y = yaw; }
    g.add(outline, fill); fill.scale.setScalar(0.001); scene.add(g); fx.push(outline, fill);
    const t = { g, fill, kind, alive: true }; tele.push(t); return t;
  }
  function setTele(t, p) { if (!t) return; if (t.kind === 'rect') t.fill.scale.set(1, 1, Math.max(0.001, p)); else t.fill.scale.setScalar(Math.max(0.001, p)); t.fill.material.opacity = 0.3 + p * 0.35; }
  function killTele(t) { if (!t || !t.alive) return; t.alive = false; scene.remove(t.g); t.g.traverse((o) => { const i = fx.indexOf(o); if (i >= 0) fx.splice(i, 1); }); }
  function swingTrail(m, reach, arc) {
    const geo = new THREE.RingGeometry(reach * 0.55, reach * 0.95, 24, 1, -arc / 2, arc); geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(1.5), transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    mesh.position.set(m.g.position.x, 1.0 * m.bodyScale, m.g.position.z); mesh.rotation.y = m.g.rotation.y - Math.PI / 2; mesh.rotation.z = 0.25; scene.add(mesh); fx.push(mesh); trails.push({ mesh, t: 0 });
  }

  // ---------- projectiles ----------
  function throwProj(m, target, opts = {}) {
    const from = m.g.position.clone().setY(1.5 * m.bodyScale); const to = target.clone().setY(1.0); const flat = Math.hypot(to.x - from.x, to.z - from.z); const spd = opts.speed || 13; const T = Math.max(0.35, flat / spd);
    const vel = new THREE.Vector3((to.x - from.x) / T, (to.y - from.y) / T + 0.5 * 12 * T, (to.z - from.z) / T);
    const pk = opts.kind || (m.def.proj); let mesh; if (pk === 'orb') { mesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#e8f4ff').multiplyScalar(2.5) })); fx.push(mesh); } else if (pk === 'crumb') { mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.25), new THREE.MeshStandardMaterial({ color: '#d8b070', roughness: 0.9 })); } else if (opts.keys) { mesh = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 6, 16), new THREE.MeshStandardMaterial({ color: '#c8a040', metalness: 1, roughness: 0.3 })); } else { mesh = trafficCone(0.45); }
    mesh.position.copy(from); scene.add(mesh);
    projs.push({ mesh, vel, dmg: scaleDmg(m.def.dmg, m.lvl) * (opts.mult || 1), src: m, life: 3, spin: 8 + Math.random() * 6, deflected: false });
    ctx.sfx && ctx.sfx('throw', from);
  }

  // ---------- helpers ----------
  const P = () => ctx.P.pos;
  function face(m, tx, tz, rate, dt) { const want = Math.atan2(tx - m.g.position.x, tz - m.g.position.z); let d = want - m.g.rotation.y; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; m.g.rotation.y += Math.max(-rate * dt, Math.min(rate * dt, d)); }
  function aggro(m, quiet) {
    if (m.dead || m.state === 'chase' || m.state === 'attack') return; const was = m.state; m.state = 'chase';
    if (!quiet && was !== 'chase' && Math.random() < (m.def.boss ? 1 : 0.55)) bark(m);
    if (m.def.boss && ctx.onBossAggro) ctx.onBossAggro(m);
    if (m.camp) for (const o of mobs) if (o !== m && o.camp === m.camp && !o.dead && o.state !== 'chase' && o.g.position.distanceTo(m.g.position) < 28) { o.state = 'chase'; if (Math.random() < 0.3) bark(o); }
  }
  function bark(m, txt) { if (m.barkT > 0) return; m.barkT = 4; ctx.bark && ctx.bark(m, txt || m.def.barks[Math.floor(Math.random() * m.def.barks.length)]); }
  function startAct(m, type, extra = {}) {
    const d = m.def, sp = m.enraged ? 0.78 : 1; const act = { type, t: 0, hit: false, yaw: m.g.rotation.y, ...extra };
    if (type === 'melee') { act.windup = d.windup * sp; act.swing = d.swing; act.recover = d.recover * sp; act.tele = telegraph('sector', m.g.position, m.g.rotation.y, d.reach + 0.3, d.arc); }
    else { const A = ABIL[type]; act.windup = A.windup * sp; act.swing = type === 'charge' ? 0.9 : 0.25; act.recover = 0.8 * sp;
      if (type === 'slam' || type === 'sweep' || type === 'nova') act.tele = telegraph('circle', m.g.position, 0, A.range);
      if (type === 'charge') { const yaw = Math.atan2(P().x - m.g.position.x, P().z - m.g.position.z); act.yaw = yaw; m.g.rotation.y = yaw; act.tele = telegraph('rect', m.g.position, yaw, A.range, 2.4); }
      if (type === 'puddle') { act.spots = [0, 1, 2].map((i) => { const a = Math.random() * 6.28, r = i === 0 ? 0 : 2.5 + Math.random() * 3; return new THREE.Vector3(P().x + Math.cos(a) * r, 0, P().z + Math.sin(a) * r); }); act.teles = act.spots.map((p) => telegraph('circle', p, 0, 2.2)); }
      if (type === 'whistle' || type === 'clockin' || type === 'summon') bark(m, type === 'whistle' ? 'FWEEEET! LADS! TO ME!' : type === 'clockin' ? 'Clock in, you lot! Overtime!' : m.def.barks[1]);
      m.abCd[type] = A.cd; m.abUses[type] = (m.abUses[type] || 0) + 1; }
    m.act = act; m.state = 'attack'; ctx.sfx && ctx.sfx(d.boss ? 'bossWindup' : 'windup', m.g.position);
  }
  function endAct(m) { if (!m.act) return; killTele(m.act.tele); (m.act.teles || []).forEach(killTele); m.act = null; m.state = m.dead ? 'dead' : 'chase'; m.atkCd = (m.def.boss ? 0.5 : 0.5 + Math.random() * 0.8) * (m.enraged ? 0.7 : 1); }
  function inSector(m, reach, arc, yaw) { const dx = P().x - m.g.position.x, dz = P().z - m.g.position.z, d = Math.hypot(dx, dz); if (d > reach) return false; let a = Math.atan2(dx, dz) - yaw; while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return Math.abs(a) <= arc / 2 + 0.15; }
  function stagger(m, secs) { if (m.act) { killTele(m.act.tele); (m.act.teles || []).forEach(killTele); m.act = null; } m.state = 'stagger'; m.stagger = secs; ctx.floatText && ctx.floatText(m.g.position.clone().setY(2.4 * m.bodyScale), 'STAGGERED', 'parry'); }

  function doStrike(m) {
    const a = m.act, d = m.def, dmg = scaleDmg(d.dmg, m.lvl);
    if (a.type === 'melee') { swingTrail(m, d.reach + 0.3, d.arc); ctx.sfx && ctx.sfx('swing', m.g.position);
      if (inSector(m, d.reach + 0.5, d.arc, a.yaw)) { const r = ctx.hitPlayer(dmg, m, { kind: 'melee' }); if (r === 'parried') stagger(m, d.boss ? 1.4 : 1.8); } }
    if (a.type === 'slam' || a.type === 'sweep' || a.type === 'nova') { const R = ABIL[a.type].range; ctx.shake(0.45); ctx.burst(m.g.position.clone().setY(0.2), a.type === 'slam' ? '#e8a060' : a.type === 'nova' ? '#f0f8ff' : '#7ac8e8', 50, 1.3); ctx.sfx && ctx.sfx('slam', m.g.position); if (m.g.position.distanceTo(P().clone().setY(0)) < R + 0.3) ctx.hitPlayer(dmg * 1.6, m, { kind: 'aoe', knock: 7 }); }
    if (a.type === 'whistle' || a.type === 'clockin' || a.type === 'summon') { const kind = a.type === 'whistle' ? 'goblin' : a.type === 'clockin' ? 'wight' : d.summon; for (let i = 0; i < 3; i++) { const ang = Math.random() * 6.28; const s = spawn({ kind, variant: Math.floor(Math.random() * 8), lvl: Math.max(1, m.lvl - 3), x: m.g.position.x + Math.cos(ang) * 4, z: m.g.position.z + Math.sin(ang) * 4, camp: m.camp || 'boss' + mobs.indexOf(m) }); s.summoned = true; s.state = 'chase'; ctx.burst(s.g.position.clone().setY(0.5), '#ffd040', 20, 0.6); } }
    if (a.type === 'barrage' || a.type === 'keys') { const n = a.type === 'barrage' ? 5 : 3; for (let i = 0; i < n; i++) { const off = (i - (n - 1) / 2) * 2.2; const right = new THREE.Vector3(Math.cos(a.yaw), 0, -Math.sin(a.yaw)); throwProj(m, P().clone().addScaledVector(right, off), { speed: 14, keys: a.type === 'keys', kind: d.proj, mult: 0.8 }); } }
    if (a.type === 'puddle') { a.spots.forEach((p) => { const geo = new THREE.CircleGeometry(2.2, 32); geo.rotateX(-Math.PI / 2); const mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: '#4a8aa8', roughness: 0.02, clearcoat: 1, transparent: true, opacity: 0.75 })); mesh.position.set(p.x, 0.04, p.z); scene.add(mesh); zones.push({ mesh, p, r: 2.2, t: 10, dps: scaleDmg(3, m.lvl) }); }); ctx.sfx && ctx.sfx('splash', m.g.position); }
  }

  // ---------- per-frame ----------
  function update(dt, t, playerLevel) {
    const pp = P();
    // flow field toward the player
    flowT -= dt; const pc = nav ? nav.idx(pp.x, pp.z) : -1;
    if (nav && (flowT <= 0 || pc !== flowCell) && flowT < 0.35) { nav.flow(pp.x, pp.z, 50); flowCell = pc; flowT = 0.5; }
    for (const m of mobs) {
      const g = m.g; m.barkT -= dt;
      if (m.dead) { m.deadT += dt; if (m.kind === 'wight' || m.kind === 'ebb') g.position.y = -Math.min(1.6 * m.bodyScale, m.deadT * 1.2); else m.body.rotation.x = Math.max(-1.5, -m.deadT * 4); if (m.deadT > 6) g.visible = false;
        if (m.roam && m.deadT > 90 && pp.distanceTo(m.home) > 60) { revive(m); } continue; }
      const dx = pp.x - g.position.x, dz = pp.z - g.position.z, dist = Math.hypot(dx, dz);
      g.visible = dist < (globalThis.__VIEW || 78) * (m.def.boss ? 1.4 : 1); // don't draw what the fog hides
      m._tick = (m._tick || 0) + 1; if (dist > 45 && m.state === 'idle' && m._tick % 3) continue; // far, idle mobs think every third frame
      const far = dist > 90; if (far && m.state === 'idle') continue;
      const d = m.def, spd = d.speed * (m.enraged ? 1.25 : 1) * (m.slow > 0 ? 0.5 : 1); m.slow -= dt;
      let move = new THREE.Vector3();
      if (m.state === 'idle') {
        if (dist < d.aggro && (dist < 6 || nav.los(g.position.x, g.position.z, pp.x, pp.z)) && !ctx.playerSafe() && !(m.camp && ctx.truce && ctx.truce(m.camp))) aggro(m);
        m.wander -= dt; if (m.roam && m.wander <= 0) { m.wander = 3 + Math.random() * 5; const a = Math.random() * 6.28, r = Math.random() * 7; m.wanderTarget = new THREE.Vector3(m.home.x + Math.cos(a) * r, 0, m.home.z + Math.sin(a) * r); }
        if (m.wanderTarget && nav.free(m.wanderTarget.x, m.wanderTarget.z)) { const w = m.wanderTarget.clone().sub(g.position).setY(0); if (w.length() > 0.5) move = w.normalize().multiplyScalar(1.3); else m.wanderTarget = null; }
      } else if (m.state === 'stagger') { m.stagger -= dt; if (m.stagger <= 0) m.state = 'chase'; }
      else if (m.state === 'return') { const back = m.home.clone().sub(g.position).setY(0); m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.08 * dt); if (back.length() > 0.8) move = back.normalize().multiplyScalar(spd); else { m.state = 'idle'; m.hp = m.maxHp; if (d.boss && ctx.onBossReset) ctx.onBossReset(m); } if (dist < 8) m.state = 'chase'; }
      else if (m.state === 'chase') {
        const leash = d.leash || 45; if (g.position.distanceTo(m.home) > leash + 10 || dist > 55 || ctx.playerSafe()) { m.state = 'return'; }
        else {
          m.atkCd -= dt; for (const k in m.abCd) m.abCd[k] -= dt;
          // pick an action
          let acted = false;
          if (m.atkCd <= 0 && d.abilities) { for (const a of d.abilities) { const A = ABIL[a]; if (m.abCd[a] > 0 || (A.uses && (m.abUses[a] || 0) >= A.uses)) continue; const ok = a === 'slam' || a === 'sweep' || a === 'nova' ? dist < A.range * 0.8 : a === 'charge' ? dist > 5 && dist < A.range && nav.los(g.position.x, g.position.z, pp.x, pp.z) : a === 'whistle' || a === 'clockin' || a === 'summon' ? m.hp < m.maxHp * 0.75 : dist < A.range; if (ok && Math.random() < 0.6) { startAct(m, a); acted = true; break; } } }
          if (!acted && d.ranged && m.atkCd <= 0 && dist > d.ranged.min * 0.7 && dist < d.ranged.max && nav.los(g.position.x, g.position.z, pp.x, pp.z)) { m.act = { type: 'throw', t: 0, windup: d.ranged.windup, swing: 0.2, recover: 0.6, yaw: g.rotation.y }; m.state = 'attack'; acted = true; }
          if (!acted && m.atkCd <= 0 && dist < d.reach * 0.9) { face(m, pp.x, pp.z, 20, 1); startAct(m, 'melee'); acted = true; }
          if (!acted) {
            const stopAt = d.ranged ? d.ranged.min : d.reach * 0.75;
            if (dist > stopAt) { let tx = pp.x, tz = pp.z; if (!nav.los(g.position.x, g.position.z, pp.x, pp.z)) { const n = nav.next(g.position.x, g.position.z); if (n) { tx = n[0]; tz = n[1]; } } const v = new THREE.Vector3(tx - g.position.x, 0, tz - g.position.z); if (v.lengthSq() > 1e-4) move = v.normalize().multiplyScalar(spd); }
            else if (d.ranged && dist < d.ranged.min * 0.6) move = new THREE.Vector3(-dx, 0, -dz).normalize().multiplyScalar(spd * 0.7);
            face(m, pp.x, pp.z, 8, dt);
          }
        }
      }
      if (m.state === 'attack' && m.act) {
        const a = m.act; a.t += dt; const W = a.windup, S = a.swing, R = a.recover;
        if (a.type === 'melee' && a.t < W * 0.6) { face(m, pp.x, pp.z, 5, dt); a.yaw = g.rotation.y; if (a.tele) a.tele.g.rotation.y = a.yaw - Math.PI / 2; if (a.tele) a.tele.g.position.set(g.position.x, 0.05, g.position.z); }
        if (a.type === 'throw' && a.t < W) face(m, pp.x, pp.z, 8, dt);
        if (a.type === 'slam' || a.type === 'sweep' || a.type === 'nova') { if (a.tele) a.tele.g.position.set(g.position.x, 0.05, g.position.z); }
        if (a.t < W) { setTele(a.tele, a.t / W); (a.teles || []).forEach((tt) => setTele(tt, a.t / W)); }
        else if (!a.hit) { a.hit = true; killTele(a.tele); (a.teles || []).forEach(killTele);
          if (a.type === 'throw') { throwProj(m, pp.clone().addScaledVector(ctx.P.vel, 0.4), { speed: d.ranged.speed, kind: d.proj }); const h = m.body.getObjectByName('held'); if (h) h.visible = false; }
          else if (a.type !== 'charge') doStrike(m); }
        if (a.type === 'charge' && a.t >= W && a.t < W + S) { const v = new THREE.Vector3(Math.sin(a.yaw), 0, Math.cos(a.yaw)).multiplyScalar(18); const before = g.position.clone(); g.position.addScaledVector(v, dt); col.resolve(g.position, 0.6 * m.bodyScale, 0); if (g.position.distanceTo(before) < 18 * dt * 0.4) a.t = W + S; if (!a.struck && g.position.distanceTo(pp.clone().setY(0)) < 1.6 * m.bodyScale) { a.struck = true; ctx.hitPlayer(scaleDmg(d.dmg, m.lvl) * 1.4, m, { kind: 'aoe', knock: 9 }); } if (Math.random() < dt * 30) ctx.burst(g.position.clone().setY(0.2), '#c8b8a0', 2, 0.4); }
        if (a.t >= W + S + R) { if (a.type === 'throw') { const h = m.body.getObjectByName('held'); if (h) h.visible = true; m.atkCd = d.ranged.cd * (0.8 + Math.random() * 0.5); m.act = null; m.state = 'chase'; } else endAct(m); }
      }
      // separation from other mobs
      for (const o of mobs) { if (o === m || o.dead) continue; const sx = g.position.x - o.g.position.x, sz = g.position.z - o.g.position.z, sd = Math.hypot(sx, sz), min = 0.55 * (m.bodyScale + o.bodyScale); if (sd < min && sd > 1e-3) { move.x += (sx / sd) * 2.5; move.z += (sz / sd) * 2.5; } }
      if (m.stun > 0) { m.stun -= dt; move.set(0, 0, 0); }
      g.position.addScaledVector(move, dt); col.resolve(g.position, 0.4 * Math.min(1.6, m.bodyScale), 0);
      if (!d.passive) for (const r of noMob) if (g.position.x > r[0] && g.position.x < r[2] && g.position.z > r[1] && g.position.z < r[3]) { const dl = g.position.x - r[0], dr = r[2] - g.position.x, dtp = g.position.z - r[1], db = r[3] - g.position.z, mn = Math.min(dl, dr, dtp, db); if (mn === dl) g.position.x = r[0] - 0.5; else if (mn === dr) g.position.x = r[2] + 0.5; else if (mn === dtp) g.position.z = r[1] - 0.5; else g.position.z = r[3] + 0.5; if (m.state === 'chase') m.state = 'return'; }
      if (move.lengthSq() > 0.2 && m.state !== 'attack') { const want = Math.atan2(move.x, move.z); let df = want - g.rotation.y; while (df > Math.PI) df -= 6.283; while (df < -Math.PI) df += 6.283; g.rotation.y += df * Math.min(1, dt * 10); }
      animate(m, move, t, dt);
      if (m.burn > 0) { m.burn -= dt; m.hp -= m.burnDps * dt; if (Math.random() < dt * 14) ctx.burst(g.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 1 + Math.random(), (Math.random() - 0.5) * 0.4)), '#ff8a2a', 1, 0.2, -2); if (m.hp <= 0) ctx.kill(m); }
      // enrage
      if (d.boss && !m.enraged && m.hp < m.maxHp * 0.4) { m.enraged = true; ctx.banner && ctx.banner(d.enrage || `${d.name} IS ENRAGED`, '#E5484D'); ctx.sfx && ctx.sfx('roar', g.position); }
    }
    // projectiles
    for (let i = projs.length - 1; i >= 0; i--) { const p = projs[i]; p.life -= dt; p.vel.y -= 12 * dt; p.mesh.position.addScaledVector(p.vel, dt); p.mesh.rotation.x += p.spin * dt; p.mesh.rotation.z += p.spin * 0.6 * dt;
      let gone = p.life <= 0 || p.mesh.position.y < 0.05;
      if (!gone && !p.deflected && p.mesh.position.distanceTo(pp.clone().setY(1.1)) < 0.75) { const r = ctx.hitPlayer(p.dmg, p.src, { kind: 'proj' }); if (r === 'parried' && !p.src.dead) { p.deflected = true; const to = p.src.g.position.clone().setY(1.2); p.vel = to.sub(p.mesh.position).normalize().multiplyScalar(22); p.vel.y += 1; } else gone = true; }
      if (!gone && p.deflected) { for (const m of mobs) if (!m.dead && m.g.position.clone().setY(1.1 * m.bodyScale).distanceTo(p.mesh.position) < 0.9 * m.bodyScale) { ctx.hurt(m, p.dmg * 2.5, 0); gone = true; break; } }
      if (gone) { scene.remove(p.mesh); const fi = fx.indexOf(p.mesh); if (fi >= 0) fx.splice(fi, 1); projs.splice(i, 1); ctx.burst(p.mesh.position, '#e8590c', 8, 0.4); } }
    // trails + zones
    for (let i = trails.length - 1; i >= 0; i--) { const tr = trails[i]; tr.t += dt; tr.mesh.material.opacity = 0.75 * (1 - tr.t / 0.22); tr.mesh.rotation.y += dt * 4; if (tr.t > 0.22) { scene.remove(tr.mesh); fx.splice(fx.indexOf(tr.mesh), 1); trails.splice(i, 1); } }
    for (let i = zones.length - 1; i >= 0; i--) { const z = zones[i]; z.t -= dt; z.mesh.material.opacity = Math.min(0.75, z.t * 0.4); if (Math.hypot(pp.x - z.p.x, pp.z - z.p.z) < z.r) { ctx.zoneTick(z.dps * dt); } if (z.t <= 0) { scene.remove(z.mesh); zones.splice(i, 1); } }
  }
  function playerInZone() { const pp = P(); return zones.some((z) => Math.hypot(pp.x - z.p.x, pp.z - z.p.z) < z.r); }

  function animate(m, move, t, dt) {
    const b = m.body, s = m.bodyScale, a = m.act; let lean = 0, hop = 0, sway = 0, glow = 0, lunge = 0, wRot = 0, squash = 1, roll = 0;
    const spd = move.length(); const moved = spd * dt;
    // locomotion: legs do the walking now; the body only bobs a little with each step
    const amt = m.rig ? stepRig(m.rig, moved / s, dt, t, m.stride) : Math.min(0.55, spd * 0.16);
    if (!m.rig) { m.walkPh = (m.walkPh || 0) + moved / s * 5; }
    const ph = m.rig ? m.rig.uPhase.value : m.walkPh;
    if (m.rigType === 'biped' || m.rigType === 'bird' || m.rigType === 'quad') { hop = Math.abs(Math.cos(ph)) * 0.025 * s * amt * 2; lean = 0.05 * amt; roll = Math.sin(ph) * 0.03 * amt; if (m.rigType === 'bird') lean += Math.max(0, Math.sin(ph * 2)) * 0.06 * amt; }
    else if (m.rigType === 'glide') { hop = Math.sin(t * 2 + m.wander) * 0.03 * s; roll = Math.sin(ph) * 0.04 * amt; lean = 0.08 * amt; }
    else if (m.rigType === 'waddle') { roll = Math.sin(ph) * 0.14 * Math.min(1, amt * 3); hop = Math.abs(Math.sin(ph)) * 0.06 * s * Math.min(1, amt * 3); }
    else if (m.rigType === 'fly') { hop = 0.35 * s + Math.sin(t * 3 + m.wander) * 0.12 * s; lean = 0.15 * amt; for (const w of m.wings) w.o.rotation.z = w.z + Math.sin(t * 22 + m.wander) * 0.55 * (w.sx < 0 ? -1 : 1); }
    else if (m.rigType === 'slither') { roll = Math.sin(t * 3) * 0.05; }
    sway = roll;
    if (a) { const W = a.windup, S = a.swing; const p = Math.min(1, a.t / W);
      if (a.t < W) { lean = -0.32 * p; wRot = -2.1 * p; glow = p * (0.5 + 0.5 * Math.sin(t * 24)); squash = 1 + 0.06 * p; if (a.type === 'slam' || a.type === 'sweep' || a.type === 'nova') { hop = 0.5 * p * s; } }
      else if (a.t < W + S) { const q = (a.t - W) / S; lean = 0.45; wRot = -2.1 + 3.5 * Math.min(1, q * 1.6); lunge = 0.35 * Math.sin(q * Math.PI) * s; if (a.type === 'slam' || a.type === 'sweep' || a.type === 'nova') { hop = 0; squash = 0.85; } }
      else { const q = Math.min(1, (a.t - W - S) / a.recover); lean = 0.45 * (1 - q); wRot = 1.4 * (1 - q); } }
    if (m.state === 'stagger') { lean = -0.25 + Math.sin(t * 14) * 0.08; sway = Math.sin(t * 9) * 0.15; }
    b.rotation.x = lean; b.rotation.z = sway; b.position.y = m.baseY + hop; b.position.z = m.baseZ + lunge; b.scale.set(s, s * squash, s);
    if (m.weapon && m.wBase) m.weapon.rotation.set(m.wBase.x + wRot, m.wBase.y, m.wBase.z + (a && a.type === 'sweep' ? wRot * 0.6 : 0));
    // hit flash is a quick pale blink; the wind-up warning is a faint red pulse (no more orange cast)
    m.flash = Math.max(0, m.flash - dt); const f = m.flash / 0.1;
    for (const mt of m.mats) mt.emissive.setRGB(0.32 * f + 0.09 * glow, 0.3 * f + 0.01 * glow, 0.28 * f + 0.01 * glow);
  }
  function revive(m) { m.dead = false; m.deadT = 0; m.hp = m.maxHp; m.state = 'idle'; m.g.visible = true; m.body.rotation.x = 0; m.g.position.copy(m.home); m.bar = ctx.makeBar(); }
  function clearAll() { for (const m of mobs) if (m.act) endAct(m); }
  return { mobs, spawn, update, buildNav, setNoMob, aggro, stagger, endAct, playerInZone, get nav() { return nav; }, clearAll, projs };
}
