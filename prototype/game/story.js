// Quests, branching dialogue, merchants (including the table merchants), a quest tracker and a quest log.
// Choices in dialogue start different quests, unlock truces with encampments, or change rewards.
import { TABLES, MATS } from './crafting.js';
import { GUILDS, CLASSES, guildOf, classSkills } from './classes.js';
import { artImg } from './lootart.js';

// ---------------- quests ----------------
// objective types: kill (kind optional, floor optional), visit (poi), boss (kind), mats (mat, n: taken on turn-in), gold (n), flag
export const QUESTS = {
  // Floors 4-6
  mall_exit: { name: 'Sponsored Content', giver: 'sunny', main: true, desc: 'Your new sponsor wants a highlight reel. The service lift down is behind the Food Court Kraken.', obj: [{ t: 'boss', kind: 'kraken', label: 'Defeat the Food Court Kraken' }], reward: { xp: 6000, gold: 800, item: 'epic' } },
  lost_child: { name: 'Lost Child Announcement', giver: 'prickle', desc: '“Would the parents of little Timmy please come to…” Madame Prickle says Timmy is real, and hiding. Check the Changing Rooms and Kiosk Ring.', obj: [{ t: 'visit', poi: 'The Changing Rooms', label: 'Search the Changing Rooms' }, { t: 'visit', poi: 'Kiosk Ring', label: 'Search Kiosk Ring' }], reward: { xp: 3500, gold: 400, box: 'gold' } },
  hoa_violation: { name: 'Notice of Violation', giver: 'deb', main: true, desc: 'The HOA President has fined the entire fort out of existence. Big Deb wants the fines cancelled, permanently.', obj: [{ t: 'boss', kind: 'hoa', label: 'Defeat the HOA President' }], reward: { xp: 9000, gold: 1200, item: 'epic' } },
  good_boy: { name: 'Good Boy', giver: 'watch', desc: 'The Neighbourhood Watch says Mr. Fetch was somebody’s dog once. Go to the Dog Park and find his old collar.', obj: [{ t: 'visit', poi: 'The Dog Park', label: 'Find the collar at the Dog Park' }], reward: { xp: 4000 } },
  hunting_season: { name: 'Hunting Season', giver: 'gusset', main: true, desc: 'Tourists with hunting licences are stalking contestants through the Canopy. Turn the tables: take down 5 Tourist Hunters.', obj: [{ t: 'kill', family: 'hunter', n: 5, label: 'Defeat Tourist Hunters' }], reward: { xp: 12000, gold: 1500, box: 'gold' } },
  lodge_fire: { name: 'Lodge Fire', giver: 'gusset', main: true, desc: 'The hunts are organised from the Glimmerkin Safari Lodge. End Lord-Hunter Facet’s season.', obj: [{ t: 'boss', kind: 'huntLord', label: 'Defeat Lord-Hunter Facet' }], reward: { xp: 20000, gold: 3000, item: 'epic' } },
  tallest_tree: { name: 'The Roots of Things', giver: 'lantern', arc: true, desc: 'Elder Lantern has seen scratch marks at the foot of the Tallest Tree that match nothing the Mothwing know.', obj: [{ t: 'visit', poi: 'The Tallest Tree', label: 'Visit the Tallest Tree' }], reward: { xp: 8000, flags: ['unnamed_6'] } },
  // Floor 0 tutorial (The Landing)
  tut_desk: { name: 'Orientation', giver: 'pip', main: true, desc: 'You came down the stairs into the Network’s Orientation Centre. Find the desk and talk to the intern.', obj: [{ t: 'flag', flag: 'met_pip', label: 'Talk to Intern Pip at the Orientation Desk' }], reward: { xp: 20 } },
  tut_basics: { name: 'Contestant Basics', giver: 'pip', main: true, desc: 'Pip wants you to learn the basics: drink from the fountain, open your Welcome Box, and hit a training dummy.', obj: [{ t: 'flag', flag: 'tut_drank', label: 'Drink from the water fountain (E)' }, { t: 'flag', flag: 'tut_box', label: 'Open your Welcome Box (I, then click it)' }, { t: 'count', key: 'dummyHits', n: 5, label: 'Hit a training dummy (left click)' }], reward: { xp: 40, gold: 15 } },
  tut_arena: { name: 'Cardboard Combat', giver: 'pip', main: true, desc: 'The practice arena has cardboard goblins. They hit back, softly. Watch for the red warnings and dodge (V) or parry (F).', obj: [{ t: 'kill', family: 'cardboard', n: 3, label: 'Defeat the cardboard goblins' }], reward: { xp: 60, box: 'bronze', flags: ['tut_arena_done'] } },
  tut_down: { name: 'Going Down', giver: 'pip', main: true, desc: 'That’s orientation done. Take the stairs at the far end down to Floor 1 and find Stairwell Camp.', obj: [{ t: 'flag', flag: 'reached_f1', label: 'Take the stairs down to Floor 1' }], reward: { xp: 50 } },
  guild_trial1: { name: 'Guild Trial I', giver: 'guild', desc: 'Prove yourself to your guild. Defeat 12 enemies.', obj: [{ t: 'kill', n: 12, label: 'Defeat enemies' }], reward: { xp: 600, gold: 150, book: true, flags: ['guild_r2'] } },
  guild_trial2: { name: 'Guild Trial II', giver: 'guild', desc: 'Your guild wants more. Defeat 25 enemies and a camp leader.', obj: [{ t: 'kill', n: 25, label: 'Defeat enemies' }, { t: 'flag', flag: 'any_boss', label: 'Defeat any encampment boss' }], reward: { xp: 1500, gold: 300, book: true, flags: ['guild_r3'] } },
  guild_trial3: { name: 'Guild Trial III', giver: 'guild', desc: 'The final trial. Defeat 40 enemies on a single floor.', obj: [{ t: 'kill', n: 40, label: 'Defeat enemies' }], reward: { xp: 3000, gold: 600, book: true, item: 'epic', flags: ['guild_r4'] } },
  arrival: { name: 'Welcome to the Dungeon', giver: 'marta', main: true, desc: 'You made it down the stairs. Find Marta Vance in Stairwell Camp. She runs the place.', obj: [{ t: 'flag', flag: 'met_marta', label: 'Talk to Marta Vance (the ! in camp)' }], reward: { xp: 60, gold: 20 } },
  nobody_out: { name: 'Nobody Gets Out', giver: 'marta', main: true, desc: 'Marta says no contestant has ever reached Floor 18. Start by finding the Exit Sign everyone talks about.', obj: [{ t: 'visit', poi: 'The Exit Sign', label: 'Find The Exit Sign' }], reward: { xp: 150, gold: 40 } },
  the_stairs: { name: 'The Chained Stairwell', giver: 'marta', main: true, desc: 'The stairwell door down is chained, and Sergeant Pylon holds the key. Kill him, or make a deal through Pickles.', obj: [{ t: 'flag', flag: 'pylon_handled', label: 'Deal with Sergeant Pylon (kill him, or broker a truce)' }], reward: { xp: 400, gold: 100, flags: ['f1_stairs'] } },
  water_line: { name: 'Thin the Packs', giver: 'marta', desc: 'Goblin packs keep raiding the camp water line. Kill 6 goblins anywhere on the floor.', obj: [{ t: 'kill', family: 'goblin', n: 6, label: 'Kill goblins' }], reward: { xp: 220, gold: 120, item: 'uncommon' } },
  find_leak: { name: 'Find the Leak', giver: 'marta', desc: 'Someone has to find where the water’s going. Check the Ramp Spiral and the Burning Bus.', obj: [{ t: 'visit', poi: 'The Ramp Spiral', label: 'Search the Ramp Spiral' }, { t: 'visit', poi: 'The Burning Bus', label: 'Search the Burning Bus' }], reward: { xp: 260, gold: 80, box: 'bronze' } },
  cone_collector: { name: 'Cone Collector', giver: 'pickles', desc: 'Pickles wants 12 Cone Plastic, “for reasons”. Goblins drop it.', obj: [{ t: 'mats', mat: 'coneplastic', n: 12, label: 'Bring Cone Plastic' }], reward: { xp: 180, gold: 90 } },
  cone_coup: { name: 'Cone Coup', giver: 'pickles', desc: 'Pylon plans to cone off the stairwell and charge a toll forever. Pickles wants him made an example of.', obj: [{ t: 'boss', kind: 'pylon', label: 'Defeat Sergeant Pylon' }], reward: { xp: 500, gold: 150, gear: 'coneCrown' } },
  bo_toolbox: { name: 'Bo’s Toolbox', giver: 'bo', desc: 'Bo dropped a toolbox near the Ramp Spiral and goblins took the springs. Find the box and bring 3 Mimic Springs.', obj: [{ t: 'visit', poi: 'The Ramp Spiral', label: 'Find the toolbox at the Ramp Spiral' }, { t: 'mats', mat: 'spring', n: 3, label: 'Bring Mimic Springs' }], reward: { xp: 160, flags: ['bo_discount'] } },
  dave_jars: { name: 'Coin Jar Raid', giver: 'spin', desc: 'Goblins and wights stole Spin’s coin jars. Clear out 10 of them on Spin City to get the coins back for Dave.', obj: [{ t: 'kill', n: 10, floor: '2', label: 'Defeat thieves on Floor 2' }], reward: { xp: 400, gold: 60, flags: ['dave_free'] } },
  clocking_out: { name: 'Clocking Out', giver: 'reggie', desc: 'Old Reggie’s partner Ebb is still “on shift” in Boiler Room 0. Find Ebb’s timecard there.', obj: [{ t: 'visit', poi: 'Boiler Room 0', label: 'Find Ebb’s timecard in Boiler Room 0' }], reward: { xp: 300 } },
  reggie_end: { name: 'End of Shift', giver: 'reggie', desc: 'Reggie can’t bear it. Put Head Custodian Ebb to rest yourself.', obj: [{ t: 'boss', kind: 'ebb', label: 'Defeat Head Custodian Ebb' }], reward: { xp: 700, gold: 200, gear: 'keyring' } },
  // Floor 3
  soup_feud: { name: 'Soup Feud', giver: 'wickley', desc: 'Two hag families run rival kitchens and their feud is poisoning the district. Taste-test both recipes, then come back to Wickley.', obj: [{ t: 'visit', poi: "Grandma Gristle's Kitchen", label: 'Taste Grandma Gristle’s broth' }, { t: 'visit', poi: "Auntie Brine's Pot", label: 'Taste Auntie Brine’s chowder' }], reward: { xp: 900 } },
  cone_king: { name: 'Long Live the Cone', giver: 'wickley', main: true, desc: 'The stairs to Floor 4 run under the Cone King’s throne in the Cone Cathedral. He is not going to move for you.', obj: [{ t: 'boss', kind: 'coneKing', label: 'Defeat the Cone King' }], reward: { xp: 2000, gold: 400, flags: ['coneKing_handled'] } },
  lights_out: { name: 'Lights Out', giver: 'ash', desc: 'Moths swarm Soup Row every night. Brother Ash wants you to track their Queen to the Lamp Market.', obj: [{ t: 'visit', poi: 'The Lamp Market', label: 'Find the Bulb Queen’s court' }], reward: { xp: 700 } },
  ash_queen: { name: 'The Last Light', giver: 'ash', desc: 'You chose to end the Bulb Queen. Brother Ash will pray for both of you.', obj: [{ t: 'boss', kind: 'bulbQueen', label: 'Defeat the Bulb Queen' }], reward: { xp: 1500, gold: 250, gear: 'mothTrophy' } },
  five_stars: { name: 'Five Stars', giver: 'vrask', arc: true, desc: 'Judge Vrask is reviewing the Soup District. Cook something at your Cookstove and bring it to the judge.', obj: [{ t: 'flag', flag: 'has_dish', label: 'Bring a dish you cooked (Cookstove)' }], reward: { xp: 800, gold: 150 } },
};
const GEAR = {
  coneCrown: { slot: 'head', name: 'Cone Crown', rarity: 'epic', family: 'trophy', stats: { armor: 14, CHA: 4, hp: 30 }, host: 'Five cones, one crown. Fashion has never been this orange.' },
  goblinPass: { slot: 'amulet', name: 'Goblin Pass', rarity: 'rare', family: 'trophy', stats: { CHA: 3, crit: 2, hp: 15 }, host: 'A laminated cone. The goblins respect it. Mostly.' },
  mothTrophy: { slot: 'amulet', name: 'Moth Queen’s Filament', rarity: 'epic', family: 'trophy', stats: { light: 3, spell: 14, INT: 3 }, host: 'Still warm. Still glowing. Still a bit sad.' },
  criticSeal: { slot: 'ring1', name: 'Critic’s Seal', rarity: 'rare', family: 'trophy', stats: { CHA: 4, crit: 2 }, host: 'Five stars. From an actual alien. Frame it.' },
  recipeBook: { slot: 'off', name: 'Hag Recipe Book', rarity: 'rare', family: 'trophy', stats: { WIS: 4, hp: 30 }, host: 'Page 12: Soup. Page 13: More soup. Page 14: Do not read aloud.' },
  keyring: { slot: 'amulet', name: 'Custodian’s Keyring', rarity: 'epic', family: 'trophy', stats: { WIS: 4, mana: 30, armor: 6 }, host: 'Forty years of keys. One of them opens something. Nobody knows what.' },
};

export function createStory(api) {
  const S = api.state; S.quests = S.quests || {}; S.flags = S.flags || {};
  const $ = (id) => document.getElementById(id);
  const Q = {
    st: (id) => (S.quests[id] ? S.quests[id].st : null),
    start(id) { if (S.quests[id]) return; S.quests[id] = { st: 'active', prog: QUESTS[id].obj.map(() => 0) }; const q = QUESTS[id]; api.toast(`<div class="ta">NEW QUEST${q.main ? ' · MAIN STORY' : ''}</div><b>${q.name}</b><div class="sm">${q.desc}</div>`, q.main ? '#F5C518' : '#7BE38A', 5000); api.sfx('achieve'); checkAll(); renderTracker(); },
    objDone(id, i) { const o = QUESTS[id].obj[i], p = S.quests[id].prog[i]; if (o.t === 'count') return (S.counters[o.key] || 0) >= o.n; if (o.t === 'mats') return (S.mats[o.mat] || 0) >= o.n; if (o.t === 'gold') return S.gold >= o.n; if (o.t === 'flag') return !!S.flags[o.flag]; return p >= (o.n || 1); },
    ready(id) { const s = S.quests[id]; return s && s.st === 'active' && QUESTS[id].obj.every((_, i) => Q.objDone(id, i)); },
    complete(id) { const q = QUESTS[id], s = S.quests[id]; if (!s || s.st === 'done') return; q.obj.forEach((o) => { if (o.t === 'mats') S.mats[o.mat] -= o.n; if (o.t === 'gold') S.gold -= o.n; }); s.st = 'done'; const r = q.reward || {};
      if (r.xp) api.gainXP(r.xp); if (r.gold) S.gold += r.gold; (r.flags || []).forEach((f) => { S.flags[f] = true; }); if (r.item) api.give(api.makeItem({ level: S.level + 1, minRarity: 2 })); if (r.box) api.give({ uid: api.uid(), kind: 'box', box: r.box, name: { bronze: 'Bronze Box', silver: 'Silver Box', gold: 'Gold Box' }[r.box], rarity: 'uncommon', host: 'Quest reward. You earned this. Probably.' }); if (r.gear) api.give(gearItem(r.gear)); if (r.book) api.giveBook();
      api.toast(`<div class="ta">QUEST COMPLETE</div><b>${q.name}</b><div class="sm">${[r.xp && `+${r.xp} XP`, r.gold && `+${r.gold} gold`, r.item && 'gear', r.box && 'loot box', r.gear && GEAR[r.gear].name].filter(Boolean).join(' · ')}</div>`, '#F5C518', 5000); api.sfx('victory'); renderTracker(); api.save(); },
    event(type, data) { for (const [id, s] of Object.entries(S.quests)) { if (s.st !== 'active') continue; QUESTS[id].obj.forEach((o, i) => { if (o.t !== type) return; if (type === 'kill' && ((o.family && !String(data.kind).match(o.family === 'goblin' ? /goblin|thrower|captain/ : o.family)) || (o.floor && o.floor !== api.floor))) return; if (type === 'visit' && o.poi !== data) return; if (type === 'boss' && o.kind !== data) return; s.prog[i]++; }); } checkAll(); renderTracker(); },
  };
  const readyShown = {};
  function checkAll() { for (const id of Object.keys(S.quests)) if (Q.ready(id) && !readyShown[id]) { readyShown[id] = true; api.toast(`<div class="ta">QUEST READY</div><b>${QUESTS[id].name}</b><div class="sm">Return to ${NPCNAME[QUESTS[id].giver]}</div>`, '#7BE38A', 4000); } }
  function gearItem(k) { const g = GEAR[k]; return { uid: api.uid(), kind: 'gear', level: S.level, value: 200, ...g, stats: { ...g.stats } }; }
  const NPCNAME = { sunny: 'Sunny the Sponsor Rep', prickle: 'Madame Prickle', deb: 'Big Deb', watch: 'the Neighbourhood Watch', gusset: 'Gusset', lantern: 'Elder Lantern', pip: 'Intern Pip', guild: 'your guild master', callings: 'Registrar Odessa', innkeeper: 'the innkeeper', wickley: 'Wickley', ash: 'Brother Ash', vrask: 'Judge Vrask', bix: 'Bix', marta: 'Marta Vance', pickles: 'Pickles', bo: 'Benchwright Bo', bev: 'Bev', spin: 'Spin Cycle', reggie: 'Old Reggie' };

  // ---------------- dialogue trees ----------------
  // each returns { start: node, ... }; a node is { text, choices: [{ text, go, do, if, tag }] }
  const cha = () => S.base.CHA + (api.derived().gearStats.CHA || 0);
  const truce = (camp, on) => { S.flags['truce_' + camp] = on; };
  const DIALOG = {
    marta: () => {
      const n = {};
      if (Q.ready('tut_down')) Q.complete('tut_down');
      if (Q.ready('nobody_out')) n.start = { text: 'You found the Exit Sign. Glowing, isn’t it? It doesn’t go anywhere. It never did. The real way down is the stairwell door behind me, and it’s chained shut. Sergeant Pylon holds the key and charges a toll in cones. Kill him, or make him a deal. Pickles has been sniffing around his goblins.', choices: [{ text: 'I’ll deal with Pylon.', do: () => { Q.complete('nobody_out'); Q.start('the_stairs'); } }, { text: 'Who chained it?', go: 'chain' }] };
      else if (Q.ready('the_stairs')) n.start = { text: S.flags.truce_pylon ? 'A truce with the goblins? Through Pickles? I don’t love it. But the key’s in your hand and nobody died, which is a first for this floor.' : 'Pylon’s down. The goblins are already arguing about who gets his cones. Here. The stairwell key. Floor 2 is wet. Bring socks.', choices: [{ text: 'Take the key.', do: () => { Q.complete('the_stairs'); api.host('The stairwell is open! Floor 2 awaits. It’s damp down there. Like, emotionally too.'); } }] };
      else if (Q.ready('water_line') || Q.ready('find_leak')) n.start = { text: Q.ready('water_line') ? 'The packs have gone quiet. The water carriers made it back for once. You earned this.' : 'A cracked main under the ramp, and the bus fire boiling off the rest. Now we know. That’s worth something.', choices: [{ text: 'Glad to help.', do: () => { if (Q.ready('water_line')) Q.complete('water_line'); if (Q.ready('find_leak')) Q.complete('find_leak'); } }] };
      else if (S.quests.arrival && S.quests.arrival.st === 'active') n.start = { text: 'Bathrobe and a lighter. You must be fresh off the stairs. Breathe. Everyone gets the same broadcast and everyone ends up here, in Stairwell Camp. It\u2019s the only safe ground on this floor. Monsters won\u2019t come inside the lights.', choices: [{ text: 'What do I do now?', go: 'arrive2' }] };
      else n.start = { text: !S.quests.nobody_out ? 'Another new face. Welcome to Stairwell Camp. I’m Marta. I keep this place standing, and I keep a list of everyone who went down those stairs. Want to know how many sent word they reached the bottom? None. Not one.' : 'Still breathing? Good. What do you need?', choices: [
        { text: 'Why has nobody reached the bottom?', if: () => !S.quests.nobody_out, go: 'why' },
        { text: 'Got any work for me?', go: 'work' },
        { text: '[Charisma 11] Any spare supplies for a new arrival?', if: () => !S.flags.marta_gift, go: () => (cha() >= 11 ? 'giftYes' : 'giftNo'), tag: () => `CHA ${cha()}` },
        { text: 'Patch me up. (10 gold)', if: () => S.hp < api.derived().maxHp - 1, do: () => { if (S.gold < 10) return api.toast('Not enough gold', '#E5484D'); S.gold -= 10; S.hp = api.derived().maxHp; api.toast('Marta patches you up. Full health.', '#5ad86a'); } },
        { text: 'Goodbye.' }] };
      n.arrive2 = { text: 'Get stronger before you go wandering. The goblin packs near camp are weak; the ones further out are not. Kill, loot, level up. Eat and drink or you\u2019ll fade. Craft what you can\u2019t buy. And when you\u2019re ready, the stairwell behind me goes down. It\u2019s chained. Ask me about that later.', choices: [{ text: 'Got it. Thanks, Marta.', do: () => { S.flags.met_marta = true; Q.complete('arrival'); } }, { text: 'Why has nobody reached the bottom?', do: () => { S.flags.met_marta = true; Q.complete('arrival'); }, go: 'why' }] };
      n.why = { text: 'Eighteen floors. Every contestant thinks they’ll be the one. The network says people have finished, but nobody’s ever met one. I want to know why. Get down there and find out, and if you can, send word back.', choices: [{ text: 'I’ll find out.', do: () => Q.start('nobody_out') }, { text: 'Not my problem.', go: 'notmine' }] };
      n.notmine = { text: 'It will be. Come back when it is.', choices: [{ text: 'Fine. I’ll look into it.', do: () => Q.start('nobody_out') }, { text: 'Leave.' }] };
      n.chain = { text: 'The network did. They like a toll gate. Makes for good television. Pylon just took the job.', choices: [{ text: 'Then I’ll deal with Pylon.', do: () => { Q.complete('nobody_out'); Q.start('the_stairs'); } }] };
      n.work = { text: 'Goblins out of Pylon Point raid our water line. Two ways I can use you. Thin out their packs, or find out where our water’s actually going. The Ramp Spiral, maybe, or that bus that never stops burning.', choices: [
        { text: 'I’ll thin out the packs.', if: () => !S.quests.water_line, do: () => Q.start('water_line') },
        { text: 'I’ll find the leak.', if: () => !S.quests.find_leak, do: () => Q.start('find_leak') },
        { text: 'Neither, for now.' }] };
      n.giftYes = { text: 'Ha. You’ve got a face people want to help. Don’t waste it. Here: two potions and some water. Don’t tell the others.', choices: [{ text: 'Thanks, Marta.', do: () => { S.flags.marta_gift = true; api.giveCons(0); api.giveCons(1); api.giveCons(2); } }] };
      n.giftNo = { text: 'Supplies are for people who’ve earned them. Go earn them.', choices: [{ text: 'Fair enough.', do: () => { S.flags.marta_gift = true; } }] };
      return n;
    },
    pickles: () => {
      const n = {};
      if (Q.ready('cone_collector')) n.start = { text: 'Twelve! Lovely, lovely plastic. Right, the reasons. Pylon’s planning to cone off the whole stairwell. Toll forever. No one in, no one out, unless you pay in cones. I can make him an offer he likes. Or you can make him an example.', choices: [
        { text: 'Make him the offer. (Pay 100 gold)', if: () => S.gold >= 100, do: () => { Q.complete('cone_collector'); S.gold -= 100; truce('pylon', true); S.flags.pylon_handled = true; api.give(gearItem('goblinPass')); api.host('A truce with the goblins! Peace in our time. Ratings are down 40%.'); api.toast('<div class="ta">TRUCE</div>Pylon Point goblins won’t attack you unless you attack them.', '#7BE38A', 5000); } },
        { text: 'Make him an example.', do: () => { Q.complete('cone_collector'); Q.start('cone_coup'); } },
        { text: 'I’ll think about it.', do: () => Q.complete('cone_collector') }] };
      else if (Q.ready('cone_coup')) n.start = { text: 'You did it! Pylon’s cones are on the open market! I mean, I have them. Here, a crown. Made it myself. From him.', choices: [{ text: 'It’s… very orange.', do: () => Q.complete('cone_coup') }] };
      else n.start = { text: 'Pickles’ Junk! Everything’s junk! Some of it’s good junk!', choices: [
        { text: 'Show me your junk.', do: () => openShop('pickles', 'Pickles’ Junk') },
        { text: 'Why are you buying traffic cones?', if: () => !S.quests.cone_collector, go: 'cones' },
        { text: 'About Pylon…', if: () => S.quests.cone_collector && S.quests.cone_collector.st === 'done' && !S.flags.pylon_handled && !S.quests.cone_coup, go: 'again' },
        { text: 'Goodbye.' }] };
      n.cones = { text: 'Reasons! Business reasons! Bring me twelve chunks of cone plastic and I’ll tell you the reasons. The goblins drop it. Mostly when they’re on fire.', choices: [{ text: 'Twelve cones. Got it.', do: () => Q.start('cone_collector') }, { text: 'Sounds shady.' }] };
      n.again = { text: 'Still thinking? The offer stands. A hundred gold and the goblins love you. Or no gold, and one dead sergeant.', choices: [{ text: 'Make the offer. (Pay 100 gold)', if: () => S.gold >= 100, do: () => { S.gold -= 100; truce('pylon', true); S.flags.pylon_handled = true; api.give(gearItem('goblinPass')); api.toast('<div class="ta">TRUCE</div>Pylon Point goblins won’t attack you unless you attack them.', '#7BE38A', 5000); } }, { text: 'I’ll take him down.', do: () => Q.start('cone_coup') }, { text: 'Later.' }] };
      return n;
    },
    bo: () => {
      const n = {};
      if (Q.ready('bo_toolbox')) n.start = { text: 'My box! And springs! You lovely lunatic. From now on you get the friends-and-family rate. Twenty percent off every table.', choices: [{ text: 'Pleasure doing business.', do: () => Q.complete('bo_toolbox') }] };
      else n.start = { text: 'Bo’s Benches. Tables built to last, delivered to your Crash Pad. Mostly in one piece.', choices: [
        { text: 'Show me the tables.', do: () => openShop('tables', 'Bo’s Benches') },
        { text: 'How do crafting tables work?', go: 'how' },
        { text: 'You look like you lost something.', if: () => !S.quests.bo_toolbox, go: 'lost' },
        { text: 'Goodbye.' }] };
      n.how = { text: 'Each table makes its own things. Sixty recipes apiece, five tiers. Upgrade a table to unlock the next tier. And put tables next to each other: an Alchemy Lab beside a Boom Bench lets you brew firebombs. Tables talk to each other. Not literally. Mostly.', choices: [{ text: 'Show me the tables.', do: () => openShop('tables', 'Bo’s Benches') }, { text: 'Thanks.' }] };
      n.lost = { text: 'My toolbox. Dropped it out by the Ramp Spiral, and some goblin nicked the springs out of it. Bring me the box and three springs and I’ll give you the friends-and-family rate.', choices: [{ text: 'I’ll find it.', do: () => Q.start('bo_toolbox') }, { text: 'Not today.' }] };
      return n;
    },
    wickley: () => {
      const n = {};
      if (Q.ready('soup_feud')) n.start = { text: 'Well? You tasted both. Grandma Gristle’s broth is old magic, all bones and grudges. Auntie Brine’s chowder is new money, salt and spite. One of them has to lose or the whole Row goes up in toxic fog every Dinner Bell. Whose pot do we spoil?', choices: [
        { text: 'Sabotage Grandma Gristle.', do: () => { Q.complete('soup_feud'); S.flags.feud = 'brine'; api.give(gearItem('recipeBook')); api.host('Grandma Gristle’s pot is ruined! Auntie Brine is insufferable now. Great television.'); } },
        { text: 'Sabotage Auntie Brine.', do: () => { Q.complete('soup_feud'); S.flags.feud = 'gristle'; api.give(gearItem('recipeBook')); api.host('Auntie Brine’s chowder is sabotaged! Grandma Gristle is cackling. Literally cackling.'); } },
        { text: '[Charisma 15] Make them cook together instead.', if: () => cha() >= 15, do: () => { Q.complete('soup_feud'); S.flags.feud = 'peace'; api.give(gearItem('recipeBook')); api.gainXP(600); api.host('A truce! Two hag families, one pot! It tastes terrible! Everyone is crying!'); } }] };
      else if (Q.ready('cone_king')) n.start = { text: 'The Cone King is dead?! The goblins are already crowning a new one out back. Doesn’t matter. The stairs are open. Go on, before someone charges you a toll.', choices: [{ text: 'See you on the next floor.', do: () => Q.complete('cone_king') }] };
      else n.start = { text: 'Welcome to Soup Row! Best soup on Floor 3, worst soup on Floor 3, depends which day. I’m Wickley. What’ll it be?', choices: [
        { text: 'What’s wrong with the soup?', if: () => !S.quests.soup_feud, go: 'feud' },
        { text: 'How do I get down to Floor 4?', if: () => !S.quests.cone_king, go: 'down' },
        { text: 'Goodbye.' }] };
      n.feud = { text: 'Hags. Two families, two kitchens, one feud. Every Dinner Bell their pots boil over and the fog comes rolling up the alleys. Taste both and tell me which one we ruin.', choices: [{ text: 'I’ll taste them.', do: () => Q.start('soup_feud') }, { text: 'I don’t eat hag food.' }] };
      n.down = { text: 'Under the Cone Cathedral, south end. The Cone King sits on the stairs like a hen on an egg. He was Pylon’s boss, and he’s heard what happened to Pylon.', choices: [{ text: 'Then he’s next.', do: () => Q.start('cone_king') }, { text: 'Later.' }] };
      return n;
    },
    ash: () => {
      const n = {};
      if (Q.ready('lights_out')) n.start = { text: 'You saw her. The Bulb Queen, on her chandelier. She isn’t cruel. She’s hungry for light, and we keep the lanterns lit all night. I could make her an offering, a bulb that never burns out. Or you could end her.', choices: [
        { text: 'Make her an offering. (4 Glass Shard, 2 Battery)', if: () => (S.mats.glass || 0) >= 4 && (S.mats.battery || 0) >= 2, do: () => { S.mats.glass -= 4; S.mats.battery -= 2; Q.complete('lights_out'); truce('lamp', true); S.flags.moth_allies = true; api.toast('<div class="ta">PEACE</div>The Lamp Market moths leave Soup Row alone. They’ll remember this on later floors.', '#7BE38A', 5000); api.host('The moths are our friends now! Somebody tell the lamps.'); } },
        { text: 'I’ll end her.', do: () => { Q.complete('lights_out'); Q.start('ash_queen'); } },
        { text: 'Let me think.' }] };
      else if (Q.ready('ash_queen')) n.start = { text: 'It is done. The district is darker tonight, and quieter. Take her filament. Keep it lit for her.', choices: [{ text: 'Rest well, Queen.', do: () => Q.complete('ash_queen') }] };
      else n.start = { text: 'Peace, traveller. I keep the Last Light, the lantern at the heart of the Row. Lately the moths come for it every night.', choices: [{ text: 'Why do the moths attack?', if: () => !S.quests.lights_out, go: 'why' }, { text: 'Goodbye.' }] };
      n.why = { text: 'They follow their Queen, and she lives in the Lamp Market to the north-east. Find her. See what she is. Then we decide.', choices: [{ text: 'I’ll find her.', do: () => Q.start('lights_out') }, { text: 'Not now.' }] };
      return n;
    },
    vrask: () => {
      const n = {}; S.nations = S.nations || {};
      const nat = (k, v) => { S.nations[k] = (S.nations[k] || 0) + v; };
      const dish = () => S.inv.find((i) => i.kind === 'consumable' && i.crafted && i.effect && i.effect.hunger);
      if (S.flags.vrask) n.start = { text: { five: 'Your dish still lingers on my palate. The Ascendancy will hear your name. Kindly.', exposed: 'You know what I am now. Keep your voice down. They are all watching. All of them.', bribed: 'We have an understanding. Do not mention it. Ever.', panned: 'I gave you one star. I stand by it.' }[S.flags.vrask], choices: [{ text: 'Goodbye.' }] };
      else n.start = { text: 'Ah. A contestant. I am Judge Vrask, critic for the Soup District cook-off. I have come a very long way to be disappointed. Impress me.', choices: [
        { text: 'Taste my cooking.', if: () => !!dish(), go: 'taste' },
        { text: 'What do I need to do?', if: () => !S.quests.five_stars, do: () => Q.start('five_stars') },
        { text: '[Charisma 14] You’re not from the dungeon, are you?', go: () => (cha() >= 14 ? 'expose' : 'exposeNo'), tag: () => `CHA ${cha()}` },
        { text: 'Bribe the judge. (200 gold)', if: () => S.gold >= 200, do: () => { S.gold -= 200; S.flags.vrask = 'bribed'; nat('glimmerkin', 5); ['vossk', 'orbital', 'hornback'].forEach((k) => nat(k, -5)); api.gainXP(400); api.host('Did the judge just take a bribe? On camera? I love this job.'); } },
        { text: 'Goodbye.' }] };
      n.taste = { text: 'Hm. *He tastes it, slowly.* Grease. Despair. A hint of rat. It is… actually remarkable. Five stars. The Ascendancy will hear your name.', choices: [{ text: 'Thank you, Judge.', do: () => { const d = dish(); S.inv.splice(S.inv.indexOf(d), 1); S.flags.has_dish = true; S.flags.vrask = 'five'; nat('glimmerkin', 20); api.give(gearItem('criticSeal')); if (S.quests.five_stars && S.quests.five_stars.st === 'active') Q.complete('five_stars'); else api.gainXP(800); api.host('Five stars from Judge Vrask! The Glimmerkin audience is going wild. Wait, how do we know they’re Glimmerkin?'); } }] };
      n.expose = { text: '*The judge’s shell flickers.* …You are perceptive. Yes. I am a guest. We all watch, out there, nine nations of us. And on the sixth floor, some of us stop watching and start hunting. You did not hear this from me.', choices: [{ text: 'Your secret’s safe.', do: () => { S.flags.vrask = 'exposed'; S.flags.arc_audience = true; nat('glimmerkin', -5); api.gainXP(1000); api.host('Uh. We’re going to cut to a commercial now. For no reason.'); } }] };
      n.exposeNo = { text: 'I am a judge. Of soup. Please stop staring at my shell.', choices: [{ text: 'Sorry.' }] };
      return n;
    },
    bix: () => ({ start: { text: 'Bix. Bo’s cousin. The soup branch. Tables, delivered greasy.', choices: [{ text: 'Show me the tables.', do: () => openShop('tables', 'Bix’s Benches') }, { text: 'Goodbye.' }] } }),
    pip: () => {
      const n = {};
      if (!S.flags.met_pip) n.start = { text: 'Oh! A new one! Hi! Welcome to the Network Orientation Centre! I’m Pip, I’m an intern, I’m not paid, I’m also technically a contestant. Before you go down to Floor One I have to make sure you know how to, um, not die. Immediately.', choices: [{ text: 'Okay. What do I need to know?', do: () => { S.flags.met_pip = true; Q.complete('tut_desk'); Q.start('tut_basics'); }, go: 'basics' }, { text: 'Where am I, exactly?', go: 'where' }] };
      else if (Q.ready('tut_basics')) n.start = { text: 'You drank, you unboxed, you hit a dummy! You’re a natural. Now the fun part: the practice arena through that door. Cardboard goblins. They hit back, but softly. Watch the floor: when red fills up under them, step out of it, dodge with V, or tap F as it fills to parry.', choices: [{ text: 'Let’s go.', do: () => { Q.complete('tut_basics'); Q.start('tut_arena'); } }] };
      else if (Q.ready('tut_arena')) n.start = { text: 'Look at you! Okay, last thing: everyone wakes up with no class. You get to choose a race and a class at the Hall of Callings on Floor Three. Until then it’s you, that pipe, and your lighter. The stairs down are at the end of the hall. Good luck. Please don’t die, the paperwork is awful.', choices: [{ text: 'Thanks, Pip.', do: () => { Q.complete('tut_arena'); Q.start('tut_down'); } }] };
      else n.start = { text: S.quests.tut_basics && S.quests.tut_basics.st === 'active' ? 'Fountain, Welcome Box, dummy! Check the quest list on the right if you forget.' : 'The stairs are at the far end. Go on! The audience is waiting.', choices: [{ text: 'What do the bars on my screen mean?', go: 'hud' }, { text: 'Bye, Pip.' }] };
      n.where = { text: 'Under your old building! Every stairwell on Earth leads here now. This is the Landing. It’s safe. Below this, nothing is safe. That’s the show!', choices: [{ text: 'Great. What do I need to know?', do: () => { S.flags.met_pip = true; Q.complete('tut_desk'); Q.start('tut_basics'); }, go: 'basics' }] };
      n.basics = { text: 'Three things! One: you get thirsty and hungry down here, so drink from the fountain. Two: I left you a Welcome Box, press I to open your bag and click it. Three: hit a training dummy with your pipe, left click, a few times. Then come back to me.', choices: [{ text: 'Got it.' }, { text: 'What do the bars on my screen mean?', go: 'hud' }] };
      n.hud = { text: 'Red is health, blue is mana, green is stamina for sprinting and heavy swings. The two little bars are hunger and thirst. Top right is your map, M for the big one. L shows your quests. And the yellow bar at the very bottom is experience.', choices: [{ text: 'Thanks.' }] };
      return n;
    },
    callings: () => {
      if (S.cls && S.cls !== 'none') return { start: { text: `Welcome back, ${CLASSES[S.cls].name}. The Hall only records a calling once. Your guild hall is across the square; they’ll have work for you.`, choices: [{ text: 'Goodbye.' }] } };
      return { start: { text: 'Welcome to the Hall of Callings. Every contestant who reaches the third floor gets to choose what they are: a race and a class. Twelve schools of magic and eight trades. Choose carefully. It’s permanent, and the audience is watching.', choices: [{ text: 'I’m ready to choose.', do: () => { api.openPanel('class'); } }, { text: 'Tell me about magic classes.', go: 'magic' }, { text: 'Not yet.' }] },
        magic: { text: 'Fire, wind, ice, lightning, earth, water, death, light, curses, time, spores, and the spellsword, who does a bit of everything with a blade. Mages hit hard from a distance and run out of mana. Trades are tougher up close. Everyone gets three skills to start and learns more from skill books.', choices: [{ text: 'I’m ready to choose.', do: () => { api.openPanel('class'); } }, { text: 'Later.' }] } };
    },
    innkeeper: () => ({ start: { text: 'Room for the night? Ten gold. You’ll wake up rested, fed and watered. Mostly watered.', choices: [{ text: 'Rest (10 gold): full health, hunger and thirst', do: () => { if (S.gold < 10) return api.toast('Not enough gold', '#E5484D'); S.gold -= 10; api.rest(); } }, { text: 'Not now.' }] } }),
    sunny: () => {
      if (Q.ready('mall_exit')) return { start: { text: 'THAT was content! The Kraken, on camera, in pieces! Your sponsor is thrilled. Here is your bonus, minus my commission.', choices: [{ text: 'Thanks, Sunny.', do: () => Q.complete('mall_exit') }] } };
      if (S.flags.sponsor) return { start: { text: `Your sponsor, ${S.flags.sponsor}, says hi! And to please stop bleeding on their logo.`, choices: [{ text: 'Goodbye.' }] } };
      const pick = (nm, stat, amt) => () => { S.flags.sponsor = nm; S.buffs.push({ stat, amount: amt, until: 1e12 }); api.toast(`<div class="ta">SPONSORED</div>${nm}: +${amt} ${stat} for the rest of the run`, '#F5C518', 5000); Q.start('mall_exit'); api.host(`${nm} is proud to sponsor this contestant! Results not guaranteed.`); };
      return { start: { text: 'Hiiii! Sunny, Sponsor Relations! You are trending, and three sponsors want you. Pick one. They each want different content, and they will remember.', choices: [{ text: 'Pretzel Hut (+4 CON forever)', do: pick('Pretzel Hut', 'CON', 4) }, { text: 'Electro-Mart (+10% cast speed forever)', do: pick('Electro-Mart', 'castSpeed', 10) }, { text: 'Glamour Shots (+5 CHA forever)', do: pick('Glamour Shots', 'CHA', 5) }, { text: 'No sponsor. (Sunny will be sad.)' }] } };
    },
    prickle: () => Q.ready('lost_child') ? { start: { text: 'You found him? A little gnome in a too-big hoodie, eating a pretzel? Yes, that is Timmy. He is two hundred years old. He thanks you.', choices: [{ text: 'You’re welcome, Timmy.', do: () => Q.complete('lost_child') }] } } : { start: { text: 'I read palms, coupons and the tannoy. The Lost Child announcements? Real. Every one. There is a Timmy, and he is hiding somewhere in the mall.', choices: [{ text: 'I’ll find Timmy.', if: () => !S.quests.lost_child, do: () => Q.start('lost_child') }, { text: 'Goodbye.' }] } },
    deb: () => Q.ready('hoa_violation') ? { start: { text: 'The President’s gone? The fines are gone? Somebody hug me. Not you, you’re covered in gnome.', choices: [{ text: 'Glad to help.', do: () => Q.complete('hoa_violation') }] } } : { start: { text: 'I’m Big Deb. I run the fort. The HOA President fined us for “excessive survival.” The manhole down to the next floor is in their clubhouse.', choices: [{ text: 'I’ll cancel the fines.', if: () => !S.quests.hoa_violation, do: () => Q.start('hoa_violation') }, { text: 'Goodbye.' }] } },
    watch: () => { if (Q.ready('good_boy')) return { start: { text: 'The collar. “MR. FETCH. IF FOUND, PLEASE RETURN.” He was somebody’s good boy once. Show it to him? He might remember. Or he might eat you.', choices: [{ text: 'Show him the collar.', do: () => { Q.complete('good_boy'); S.flags.truce_dogpark = true; S.flags.fetch_handled = true; api.toast('<div class="ta">GOOD BOY</div>Mr. Fetch remembers. The Dog Park hounds won’t attack you.', '#7BE38A', 5000); api.host('Mr. Fetch is a good boy again! Not a dry eye in the dog park.'); } }, { text: 'He’s too far gone.', do: () => Q.complete('good_boy') }] } };
      return { start: { text: 'Neighbourhood Watch. We watch. That’s all we do. Mr. Fetch at the Dog Park, we watched him change. He had a collar once.', choices: [{ text: 'I’ll find the collar.', if: () => !S.quests.good_boy, do: () => Q.start('good_boy') }, { text: 'Goodbye.' }] } }; },
    gusset: () => { if (Q.ready('hunting_season')) return { start: { text: 'Five hunters down. The lodges are furious. Good. Now finish it: the Glimmerkin Safari Lodge runs the whole season.', choices: [{ text: 'I’ll end it.', do: () => { Q.complete('hunting_season'); Q.start('lodge_fire'); } }] } };
      if (Q.ready('lodge_fire')) return { start: { text: 'The Lord-Hunter is down. The tourists are packing their bags. The Canopy is ours again. For now.', choices: [{ text: 'For now.', do: () => Q.complete('lodge_fire') }] } };
      return { start: { text: 'Gusset, warden of the Treehouse. It’s hunting season. Out there, tourists from the audience have licences to hunt us. Contestants, I mean. You.', choices: [{ text: 'Then I’ll hunt them back.', if: () => !S.quests.hunting_season, do: () => Q.start('hunting_season') }, { text: 'Goodbye.' }] } }; },
    lantern: () => Q.ready('tallest_tree') ? { start: { text: 'You saw them. The same marks as on the third floor? Then someone is following the show who isn’t part of it. Keep looking, little flame.', choices: [{ text: 'I will.', do: () => Q.complete('tallest_tree') }] } } : { start: { text: 'I am the eldest of the Mothwing. There are marks at the foot of the Tallest Tree. Not ours, not the Network’s. Will you look?', choices: [{ text: 'I’ll look.', if: () => !S.quests.tallest_tree, do: () => Q.start('tallest_tree') }, { text: 'Goodbye.' }] } },
    bev: () => ({ start: { text: 'Bev’s Benches, the wet branch. Same tables as my brother Bo, damper delivery.', choices: [{ text: 'Show me the tables.', do: () => openShop('tables', 'Bev’s Benches') }, { text: 'Goodbye.' }] } }),
    spin: () => {
      const n = {};
      if (Q.ready('dave_jars')) n.start = { text: 'You got the coin jars! Into the machine they go… and… DAVE! Dave’s out! He’s a bit dented. He says thanks. He also says he’s opening a snack stand.', choices: [{ text: 'Welcome back, Dave.', do: () => Q.complete('dave_jars') }] };
      else if (S.flags.dave_free) n.start = { text: 'Dave’s snacks are back on! Want some?', choices: [{ text: 'Show me the snacks.', do: () => openShop('dave', 'Dave’s Snacks') }, { text: 'Goodbye.' }] };
      else n.start = { text: 'Welcome to the Laundromat! Wash, dry, despair. I’m Spin. Have you seen Dave? Dave’s inside. The coin machine at the back ate him.', choices: [{ text: 'How do I get him out?', go: 'how' }, { text: 'Goodbye.' }] };
      n.how = { text: 'It wants coins! A hundred and fifty gold would do it. Or, the thieves out there nicked my coin jars. Knock out ten of them and I’ll have enough.', choices: [
        { text: 'Here’s 150 gold.', if: () => S.gold >= 150, do: () => { S.gold -= 150; S.flags.dave_free = true; api.gainXP(250); api.toast('<div class="ta">DAVE IS FREE</div>Spin now sells Dave’s Snacks.', '#7BE38A', 4000); api.host('Dave is free! Bought out of a vending machine. That’s the economy, folks.'); } },
        { text: 'I’ll get your jars back.', if: () => !S.quests.dave_jars, do: () => Q.start('dave_jars') },
        { text: 'Maybe later.' }] };
      return n;
    },
    reggie: () => {
      const n = {};
      if (Q.ready('clocking_out')) n.start = { text: 'His timecard. Clocked in forty years ago. Never clocked out. He’s still down there doing his rounds. Should I go to him? Talk to him? Or should you end it?', choices: [
        { text: 'Go talk to him. I’ll keep the wights off you.', do: () => { Q.complete('clocking_out'); truce('boiler', true); S.flags.ebb_peace = true; S.flags.ebb_handled = true; api.give(gearItem('keyring')); api.host('Old Reggie and Head Custodian Ebb, together again. There isn’t a dry eye on the floor. There never is. It’s Spin City.'); api.toast('<div class="ta">PEACE</div>The Boiler Room wights stand down. Ebb gives Reggie his keyring, and Reggie gives it to you.', '#7BE38A', 6000); } },
        { text: 'I’ll end it.', do: () => { Q.complete('clocking_out'); Q.start('reggie_end'); } }] };
      else if (Q.ready('reggie_end')) n.start = { text: 'It’s done, then. He can rest. Take his keys. He’d want them used.', choices: [{ text: 'I’m sorry, Reggie.', do: () => Q.complete('reggie_end') }] };
      else n.start = { text: 'Forty years I mopped these floors with Ebb. Then the Boiler Room took him. He’s still in there. Still on shift.', choices: [{ text: 'What can I do?', if: () => !S.quests.clocking_out, go: 'what' }, { text: 'Goodbye.' }] };
      n.what = { text: 'Find his timecard. It’ll be by the punch clock in Boiler Room 0. If he never clocked out, maybe that’s why he can’t stop.', choices: [{ text: 'I’ll find it.', do: () => Q.start('clocking_out') }, { text: 'Not now.' }] };
      return n;
    },
  };

  // ---------------- dialogue UI ----------------
  let cur = null, typing = null, full = '', npc = null;
  function guildDialog(gk) { const G = GUILDS[gk]; const mine = guildOf(S.cls) === gk; S.guild = S.guild || {};
    const rank = S.flags.guild_r4 ? 4 : S.flags.guild_r3 ? 3 : S.flags.guild_r2 ? 2 : S.guild[gk] ? 1 : 0; const trial = ['guild_trial1', 'guild_trial2', 'guild_trial3'][rank - 1];
    if (!mine) return { start: { text: `${G.name}. ${G.desc} ${S.cls === 'none' ? 'You don’t have a class yet. Come back after the Hall of Callings.' : `We take ${G.classes.map((c) => CLASSES[c].name).join(', ')}. You’re a ${CLASSES[S.cls].name}. Try your own guild.`}`, choices: [{ text: 'Goodbye.' }] } };
    if (!rank) return { start: { text: `A ${CLASSES[S.cls].name}! ${G.name} would be glad to have you. Membership means training, work, and skill books for those who earn them.`, choices: [{ text: 'I’ll join.', do: () => { S.guild[gk] = 1; api.toast(`<div class="ta">GUILD</div>You joined ${G.name}`, G.color, 4000); Q.start('guild_trial1'); } }, { text: 'Not yet.' }] } };
    if (trial && Q.ready(trial)) return { start: { text: 'You did it. The guild sees you. Take this, and keep climbing.', choices: [{ text: 'Thank you.', do: () => { Q.complete(trial); const nx = ['guild_trial2', 'guild_trial3'][rank - 1]; if (nx) Q.start(nx); } }] } };
    return { start: { text: `Rank ${rank} of ${G.name}. ${trial && S.quests[trial] ? 'Your trial is still open.' : 'You’ve passed every trial we have.'} Training costs gold: one skill point per session.`, choices: [{ text: `Train (+1 skill point, ${100 * (S.level)} gold)`, do: () => { const c = 100 * S.level; if (S.gold < c) return api.toast('Not enough gold', '#E5484D'); S.gold -= c; S.skillPoints++; api.toast('+1 skill point', G.color); } }, { text: 'Goodbye.' }] } }; }
  function merchantDialog(n) { return { start: { text: { gear: 'Weapons and armour, lightly used. The previous owners won’t be needing them.', provisions: 'Food, water and potions. Everything a contestant needs to keep breathing.', pickles: 'Junk! Good junk!', tables: 'Crafting tables, delivered to your Crash Pad.' }[n.shop] || 'Have a look.', choices: [{ text: 'Show me.', do: () => openShop(n.shop, n.name) }, { text: 'Goodbye.' }] } }; }
  function open(n) { const D = n.guild ? () => guildDialog(n.guild) : n.shop && !DIALOG[n.id] ? () => merchantDialog(n) : DIALOG[n.id]; if (!D) return false; DIALOG[n.id] = D; npc = n; cur = DIALOG[n.id](); show('start'); $('dialog').classList.add('show'); api.onOpen(true); return true; }
  function close() { api.stopVoice && api.stopVoice(); $('dialog').classList.remove('show'); cur = null; npc = null; clearInterval(typing); api.onOpen(false); api.save(); }
  function show(id) {
    const node = cur[id]; if (!node) return close(); $('dName').textContent = NPCNAME[npc.id] || npc.name; $('dRole').textContent = npc.title || '';
    full = node.text; let i = 0; $('dText').textContent = ''; $('dChoices').innerHTML = ''; clearInterval(typing);
    const len = api.say(full, npc.voice || npc.id, null, { pri: 3 });
    const rate = Math.max(30, Math.min(90, full.length / Math.max(0.5, len || full.length / 55)));
    typing = setInterval(() => { i += Math.ceil(rate / 30); $('dText').textContent = full.slice(0, i); if (i >= full.length) { clearInterval(typing); choices(node); } }, 33);
    $('dText').onclick = () => { clearInterval(typing); $('dText').textContent = full; choices(node); };
  }
  function choices(node) {
    const list = (node.choices || [{ text: 'Goodbye.' }]).filter((c) => !c.if || c.if());
    $('dChoices').innerHTML = list.map((c, k) => `<button class="dch" data-k="${k}"><span class="dk">${k + 1}</span>${c.text}${c.tag ? ` <i>(you: ${c.tag()})</i>` : ''}</button>`).join('');
    $('dChoices').querySelectorAll('.dch').forEach((b) => b.onclick = () => pick(list[+b.dataset.k]));
  }
  function pick(c) { api.sfx('ui'); if (c.do) c.do(); const go = typeof c.go === 'function' ? c.go() : c.go; if (go && cur) { cur = DIALOG[npc.id](); if (cur[go]) return show(go); } close(); }
  function key(code) { if (!cur) return false; const m = code.match(/^Digit(\d)$/); if (m) { const b = $('dChoices').querySelectorAll('.dch')[+m[1] - 1]; if (b) b.click(); return true; } if (code === 'Space' || code === 'Enter') { $('dText').click(); return true; } if (code === 'Escape') { close(); return true; } return true; }

  // ---------------- shops ----------------
  const SHOPS = {
    gear: () => { const lv = Math.max(1, S.level); const out = []; for (let i = 0; i < 8; i++) { const it = api.makeItem({ level: lv + (i % 3), minRarity: i < 2 ? 2 : 1, slot: ['main', 'chest', 'head', 'boots', 'gloves', 'legs', 'off', 'main'][i] }); it.uid = 50000 + lv * 37 + i; out.push({ name: it.name, art: it, desc: Object.entries(it.stats).map(([k, v]) => `+${v} ${k}`).join(' · '), price: Math.round((it.value || 20) * 2.5), buy: () => api.give({ ...it, uid: api.uid() }) }); } return out; },
    provisions: () => [['Bottle of Clean-ish Water', { thirst: 35 }, 6], ['Lamprey Jerky', { hunger: 30, thirst: 5 }, 8], ['Health Potion (Cherry)', { hp: 50 + S.level * 8 }, 25], ['Mana Potion (Blue Raspberry)', { mana: 60 + S.level * 5 }, 25], ['Camp Stew', { hunger: 55, hp: 20 }, 15], ['Scroll of Recall', { recall: 1 }, 40]].map(([nm, e, p], k) => ({ name: nm, art: { uid: 470 + k, kind: 'consumable', name: nm, rarity: 'common', effect: e }, price: p, buy: () => api.give({ uid: api.uid(), kind: 'consumable', name: nm, rarity: 'common', effect: e, host: 'Bought, not looted. How civilised.' }) })),
    pickles: () => [
      ...[['scrapmetal', 5, 12], ['wire', 4, 14], ['glass', 4, 12], ['gunpowder', 2, 30], ['battery', 1, 25], ['spring', 1, 35], ['ember', 1, 40], ['cloth', 5, 10]].map(([m, n, p]) => ({ name: `${n}× ${MATS[m]}`, price: p, buy: () => { S.mats[m] = (S.mats[m] || 0) + n; } })),
      { name: 'Cone Grenade', art: { uid: 451, kind: 'consumable', name: 'Cone Grenade', rarity: 'uncommon', effect: { bomb: 'cone' } }, price: 45, buy: () => api.give({ uid: api.uid(), kind: 'consumable', name: 'Cone Grenade', rarity: 'uncommon', effect: { bomb: 'cone', dmg: 60, radius: 3.5 }, host: 'Press G. Point away from face.' }) },
      { name: 'Health Potion', art: { uid: 452, kind: 'consumable', name: 'Health Potion', rarity: 'common', effect: { hp: 50 } }, price: 30, buy: () => api.giveCons(3) }, { name: 'Mana Potion', art: { uid: 453, kind: 'consumable', name: 'Mana Potion', rarity: 'common', effect: { mana: 60 } }, price: 30, buy: () => api.giveCons(2) },
    ],
    dave: () => [['Dave’s Spicy Crisps', { hunger: 30, buff: 'fire', amount: 4, mins: 10 }, 25], ['Dave’s Energy Fizz', { thirst: 35, buff: 'moveSpeed', amount: 6, mins: 8 }, 25], ['Dave’s Mystery Bar', { hunger: 40, hp: 40 }, 30], ['Dave’s Dented Doughnut', { hunger: 25, buff: 'CHA', amount: 2, mins: 10 }, 20]].map(([nm, e, p], k) => ({ name: nm, art: { uid: 460 + k, kind: 'consumable', name: nm, rarity: 'uncommon', effect: e }, price: p, buy: () => api.give({ uid: api.uid(), kind: 'consumable', name: nm, rarity: 'uncommon', effect: e, host: 'Dave made it. Dave is fine. Dave is a bit dented.' }) })),
    tables: () => Object.entries(TABLES).filter(([id]) => !api.CR.owns(id)).sort((a, b) => a[1].floor - b[1].floor || a[1].cost - b[1].cost).map(([id, T]) => { const price = Math.round(T.cost * (S.flags.bo_discount ? 0.8 : 1)); const fl = +api.floor || 0; const locked = fl < T.floor; return { name: T.name, desc: locked ? `<b style="color:#ff8a6a">Stocked from Floor ${T.floor}</b> · ${T.desc}` : `${T.desc} 60 recipes · combos with neighbours`, color: T.color, price: locked ? 1e9 : price, priceLabel: locked ? `${price} g` : null, buy: () => (locked ? api.toast(`Bo's family only carries that from Floor ${T.floor} down`, '#E5484D') : api.CR.buyTable(id, price)) }; }),
  };
  let shopId = null, shopTab = 'buy';
  function openShop(id, title) { shopId = id; shopTab = 'buy'; $('shopTitle').textContent = title.toUpperCase(); $('dialog').classList.remove('show'); cur = null; api.openPanel('shop'); }
  function renderShop() {
    if (!shopId) return; $('shopGold').textContent = `${S.gold} gold`;
    $('shopTabs').innerHTML = `<button data-t="buy" class="${shopTab === 'buy' ? 'on' : ''}">BUY</button><button data-t="sell" class="${shopTab === 'sell' ? 'on' : ''}">SELL GEAR</button>`;
    $('shopTabs').querySelectorAll('button').forEach((b) => b.onclick = () => { shopTab = b.dataset.t; renderShop(); });
    if (shopTab === 'buy') { const goods = SHOPS[shopId](); $('shopList').innerHTML = goods.map((g, k) => `<div class="srow" ${g.color ? `style="border-left-color:${g.color}"` : ''}>${g.art ? artImg(g.art, 52) : ''}<div><b>${g.name}</b>${g.desc ? `<div class="sm">${g.desc}</div>` : ''}</div><button class="cbtn" data-k="${k}" ${S.gold >= g.price ? '' : 'disabled'}>${g.priceLabel || g.price + ' g'}</button></div>`).join('') || '<div class="sm" style="padding:10px">Sold out. You own everything Bo sells.</div>';
      $('shopList').querySelectorAll('button[data-k]').forEach((b) => b.onclick = () => { const g = goods[+b.dataset.k]; if (S.gold < g.price) return; if (shopId !== 'tables') S.gold -= g.price; const r = g.buy(); api.sfx('coin'); if (shopId !== 'tables') api.toast(`Bought ${g.name}`, '#F5C518', 1500); renderShop(); }); }
    else { const gear = S.inv.filter((i) => i.kind === 'gear'); $('shopList').innerHTML = gear.map((g, k) => `<div class="srow">${artImg(g, 52)}<div><b style="color:${api.rcol(g.rarity)}">${g.name}</b><div class="sm">iLvl ${g.level} · ${g.rarity}</div></div><button class="cbtn" data-k="${k}">SELL ${sellPrice(g)} g</button></div>`).join('') || '<div class="sm" style="padding:10px">No gear to sell.</div>';
      $('shopList').querySelectorAll('button[data-k]').forEach((b) => b.onclick = () => { const g = gear[+b.dataset.k]; S.inv.splice(S.inv.indexOf(g), 1); S.gold += sellPrice(g); api.sfx('coin'); renderShop(); }); }
  }
  const sellPrice = (g) => Math.max(2, Math.round(((g.value || 10) * 0.4 + g.level * 2) * (['junk', 'common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(g.rarity) + 1) * 0.5));

  // ---------------- tracker + log ----------------
  function objText(id, i) { const o = QUESTS[id].obj[i], p = S.quests[id].prog[i]; const done = Q.objDone(id, i); const cnt = o.t === 'kill' ? ` ${Math.min(p, o.n)}/${o.n}` : o.t === 'mats' ? ` ${Math.min(S.mats[o.mat] || 0, o.n)}/${o.n}` : ''; return `<div class="qo ${done ? 'ok' : ''}">${done ? '✓' : '•'} ${o.label}${cnt}</div>`; }
  function renderTracker() { const act = Object.entries(S.quests).filter(([, s]) => s.st === 'active').slice(0, 4); $('quests').innerHTML = act.map(([id]) => `<div class="qt ${QUESTS[id].main ? 'main' : ''}"><b>${QUESTS[id].name}</b>${Q.ready(id) ? `<div class="qo ok">Return to ${NPCNAME[QUESTS[id].giver]}</div>` : QUESTS[id].obj.map((_, i) => objText(id, i)).join('')}</div>`).join(''); $('quests').style.display = act.length ? 'block' : 'none'; }
  function renderLog() { const all = Object.entries(S.quests); $('questLog').innerHTML = (all.length ? all : []).sort((a, b) => (a[1].st === 'done') - (b[1].st === 'done')).map(([id, s]) => `<div class="ql ${s.st}"><div class="qh"><b>${QUESTS[id].name}</b><span>${QUESTS[id].main ? 'MAIN STORY · ' : ''}${s.st === 'done' ? 'COMPLETE' : Q.ready(id) ? 'READY TO TURN IN' : 'ACTIVE'} · ${NPCNAME[QUESTS[id].giver]}</span></div><div class="sm">${QUESTS[id].desc}</div>${s.st !== 'done' ? QUESTS[id].obj.map((_, i) => objText(id, i)).join('') : ''}</div>`).join('') || '<div class="sm">No quests yet. Talk to people with a <b style="color:#F5C518">!</b> over their head.</div>'; }
  const hasQuestFor = (id) => { if (!DIALOG[id]) return null; if (Object.entries(S.quests).some(([q, s]) => QUESTS[q].giver === id && Q.ready(q))) return '?'; const avail = { sunny: !S.flags.sponsor, prickle: !S.quests.lost_child, deb: !S.quests.hoa_violation, watch: !S.quests.good_boy, gusset: !S.quests.hunting_season, lantern: !S.quests.tallest_tree, pip: !S.flags.met_pip || Q.ready('tut_basics') || Q.ready('tut_arena'), callings: !S.cls || S.cls === 'none', marta0: 0, wickley: !S.quests.soup_feud || !S.quests.cone_king, ash: !S.quests.lights_out, vrask: !S.flags.vrask, marta: !S.quests.nobody_out || !S.quests.water_line || !S.quests.find_leak, pickles: !S.quests.cone_collector, bo: !S.quests.bo_toolbox, spin: !S.flags.dave_free && !S.quests.dave_jars, reggie: !S.quests.clocking_out }[id]; return avail ? '!' : null; };
  return { Q, open, close, key, isOpen: () => !!cur, renderShop, renderTracker, renderLog, hasQuestFor, openShop, truceOn: (camp) => !!S.flags['truce_' + camp], breakTruce: (camp) => { if (S.flags['truce_' + camp]) { S.flags['truce_' + camp] = false; api.toast('<div class="ta">TRUCE BROKEN</div>You attacked them. They remember.', '#E5484D', 4000); api.host('Oh no. You broke the truce. The goblins are furious. We are delighted.'); } } };
}
