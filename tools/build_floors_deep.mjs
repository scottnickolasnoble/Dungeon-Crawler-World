// Writes godot/data/floors_deep.json (Floors 10-18, from art/WORLD.md section 5) and adds their monsters to
// godot/data/monsters_world.json. Same shape as floors_undercity.json. Camp monsters use the Tripo cast's folder names
// (art/TRIPO_CAST_3.md) as their ids, so each one appears as soon as its model is imported.
//   node tools/build_floors_deep.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RACES = ['human', 'gutterkin', 'stoneblood', 'fennix', 'ogrekin', 'lumen', 'bogling', 'clanker', 'grimhide', 'quillback', 'mothwing'];
// floor: [title, hub, hub style, ceiling, villages [name, races], camps [name, style, mob(s), boss], landmarks, merchants [gear, provisions, junk], innkeeper, quest npcs [[id, name, title]], stairs flag, locked text, boss blurb]
const F = {
  10: ['THE BACKLOT', 'Craft Services', 'garage', 60,
    [['Wardrobe Row', ['human', 'fennix']], ['The Props Warehouse', ['clanker', 'gutterkin']], ["Extras' Holding", ['human', 'mothwing']], ['The Car Park', ['grimhide', 'human']]],
    [['Sound Stage 4', 'crew', 'stagehand', 'floor_manager'], ['The Western Set', 'crew', ['the_extras', 'stagehand'], 'the_stunt_double'], ['Makeup Trailers', 'crew', ['boom_gremlin', 'the_extras'], 'makeup_witch'], ['Catering', 'crew', ['the_extras', 'boom_gremlin'], 'craft_services_glutton'], ['The Water Tank', 'crew', ['stagehand', 'boom_gremlin'], 'the_showrunner']],
    ['The Giant Clapperboard', 'The Fake Moon', 'The Audience Bleachers'], ['wardrobe_wendy', 'chef_polenta', 'props_master'], 'trailer_tina', [['sue', 'Script Sue', 'Script supervisor'], ['gus', 'Gaffer Gus', 'Head of lighting']], 'the_showrunner_handled', 'Wrap the Showrunner at the Water Tank.'],
  11: ['THE ARENA', 'The Concourse', 'civic', 70,
    [['The Away End', ['grimhide', 'ogrekin']], ['The Car Wash', ['human', 'bogling']], ['The Sports Bar', ['human', 'fennix']], ['The Ticket Office', ['clanker', 'gutterkin']]],
    [['The Mascot Pen', 'arena', 'mascot', 'big_foam_finger'], ["The Ultras' End", 'arena', 'ultra', 'the_capo'], ['The Cheer Pyramid', 'arena', ['cheer_squad', 'mascot'], 'head_cheerleader'], ["The Officials' Room", 'arena', ['ultra', 'cheer_squad'], 'the_ref'], ['The Centre Circle', 'arena', ['mascot', 'ultra'], 'the_champion']],
    ['The Jumbotron', 'The Trophy Cabinet', 'The Halftime Stage'], ['kit_man_kev', 'hot_dog_hattie', 'ticket_tout_terry'], 'coach_bunk', [['turf', 'Groundskeeper Turf', 'Keeps the pitch'], ['booth', 'Commentator Booth', 'Calls every play']], 'the_champion_handled', 'Beat the Champion in the Centre Circle.'],
  12: ['THE GREEN ROOM', 'The Commissary', 'mall', 30,
    [['Dressing Room Row', ['human', 'lumen']], ["The Writers' Pit", ['human', 'quillback']], ['The Loading Bay', ['grimhide', 'stoneblood']], ['Hair & Makeup', ['fennix', 'mothwing']]],
    [['The Laugh Track Factory', 'studio', 'laugher', 'the_laugh_track'], ['The Paparazzi Pit', 'studio', 'paparazzo', 'flash_mob'], ['The Agency', 'studio', ['autograph_hound', 'paparazzo'], 'agent_twelve_percent'], ['The Talk Show', 'studio', ['laugher', 'autograph_hound'], 'jolly_jack_brightly'], ["The Producers' Floor", 'studio', ['paparazzo', 'laugher'], 'the_producer']],
    ['The Star Door Corridor', 'The Big Couch', 'The Applause Sign'], ['hettie_makeup', 'commissary_carl', 'lost_props_lou'], 'green_room_gloria', [['rhys', 'Runner Rhys', 'Runs everything, everywhere'], ['wren', 'Staff Writer Wren', 'Writes your lines']], 'the_producer_handled', 'Get past the Producer on the Producers\' Floor.'],
  13: ['THE STACKS', 'Quiet Corner', 'brick', 70,
    [['Periodicals', ['lumen', 'human']], ['Large Print', ['quillback', 'bogling']], ['Microfiche', ['clanker', 'human']], ['Overdue', ['gutterkin', 'stoneblood']]],
    [['The Reading Room', 'library', 'shusher', 'head_librarian'], ['The Returns Chute', 'library', 'bookwyrm', 'overdue'], ['The Bindery', 'library', 'paper_golem', 'bindery_foreman'], ['The Index Vault', 'library', ['shusher', 'paper_golem'], 'index_clerk'], ['The Restricted Section', 'library', ['bookwyrm', 'shusher'], 'the_archivist']],
    ['The Card Catalogue Spire', 'The Lost & Found of Books', 'The Endless Ladder'], ['fines_desk_freda', 'reading_room_rory', 'bookbinder_bram'], 'quiet_quentin', [['kettle', 'Brother Kettle', 'Reads the Builders\' mark'], ['pim', 'Page Turner Pim', 'Knows every shelf']], 'the_archivist_handled', 'The Archivist keeps the only key to the stairs, in the Restricted Section.'],
  14: ['CASTLE DREAD', 'The Lych Gate Inn', 'timber', 80,
    [['Ashen Hamlet', ['human', 'bogling']], ['The Gibbet Crossroads', ['grimhide', 'human']], ['The Mill', ['stoneblood', 'gutterkin']], ['Hollow Chapel', ['lumen', 'mothwing']]],
    [['The Graveyard', 'castle', 'the_restless', 'gravedigger'], ["The Witch's Tower", 'castle', 'waxwork', 'wax_witch'], ['The Gatehouse', 'castle', 'hollow_guard', 'portcullis_knight'], ['The Crypts', 'castle', ['the_restless', 'waxwork'], 'the_ossuary'], ['The Keep', 'castle', ['hollow_guard', 'the_restless'], 'the_count']],
    ['The Drawbridge', 'Gallows Hill', "The Great Hall's Chandelier"], ['blacksmith_morrow', 'goodwife_gall', 'pedlar_crook'], 'old_mother_lych', [['lisbet', 'Lamplighter Lisbet', 'Keeps the road lit'], ['widow', 'Widow Grimsby', 'Mourns the whole village']], 'the_count_handled', 'The way down is beneath the Keep. The Count holds it.'],
  15: ['THE COLD STORE', 'The Warm Room', 'garage', 40,
    [['Rack 9', ['clanker', 'human']], ['The Cooling Plant', ['stoneblood', 'grimhide']], ['Tape Library', ['human', 'lumen']], ['Fibre Junction', ['clanker', 'gutterkin']]],
    [['The Cable Jungle', 'server', 'cable_crawler', 'cable_mother'], ['The Cooling Towers', 'server', 'fan_wraith', 'fan_wraith_king'], ['The Tape Library', 'server', 'bit_rot', 'the_backup'], ['The Firewall', 'server', ['bit_rot', 'cable_crawler'], 'the_firewall'], ['The Core', 'server', ['fan_wraith', 'bit_rot'], 'the_recorder']],
    ['The Frozen Server', 'The Blinking Light', 'The Big Red Switch'], ['spare_parts_sparks', 'warm_room_wes', 'coolant_cass'], 'night_shift_noor', [['sven', 'Sysadmin Sven', 'Keeps the Builders\' machines alive'], ['rattle', 'Rattle', 'A robot who is starting to remember']], 'the_recorder_handled', 'Hear the Recorder out, in the Core.'],
  16: ['THE TRANSMITTER', "The Engineers' Canteen", 'civic', 90,
    [['Dish Field', ['clanker', 'human']], ['Relay Town', ['human', 'fennix']], ['The Fuse Room', ['stoneblood', 'grimhide']], ['Uplink', ['lumen', 'clanker']]],
    [['The Dish Array', 'broadcast', 'static_man', 'static_king'], ["The Censor's Office", 'broadcast', 'censor_bar', 'the_censor'], ['The Ratings Room', 'broadcast', 'ratings_ghoul', 'the_feed'], ['The Teleprompter', 'broadcast', ['static_man', 'censor_bar'], 'the_teleprompter'], ['The Gallery', 'broadcast', ['ratings_ghoul', 'static_man'], 'the_director']],
    ['The Big Mast', 'The Dead Air Zone', 'The Live Light'], ['fuse_room_fitz', 'canteen_connie', 'uplink_ula'], 'relay_ruth', [['okonkwo', 'Engineer Okonkwo', 'Knows where the off switch is'], ['lou', 'Lineman Lou', 'Climbs the masts']], 'the_director_handled', 'Take the Gallery from the Director.'],
  17: ["THE HOST'S HOUSE", 'Main Street', 'picket', 60,
    [['Elm Street', ['human', 'human']], ['The School', ['human', 'fennix']], ['The Diner', ['human', 'bogling']], ['The Drive-In', ['human', 'grimhide']]],
    [['The Fan Club', 'host', 'fan_zealot', 'fan_club_president'], ['The Mirror Maze', 'host', 'mirror_self', 'the_stand_in'], ["The Runner-Up's House", 'host', ['host_clone', 'fan_zealot'], 'the_runner_up'], ['The Trophy Room', 'host', ['host_clone', 'mirror_self'], 'the_mother'], ['The Studio', 'host', ['host_clone', 'fan_zealot'], 'the_host']],
    ['The House', 'The Drive-In Screen', 'The Mirror Maze'], ['hardware_hank', 'soda_jerk_sid', 'pawn_paula'], 'diner_dolores', [['milkman', 'The Milkman', 'Delivers every morning, forever'], ['kindly', 'Miss Kindly', 'Taught the Host everything']], 'the_host_handled', 'The Host is waiting in the Studio.'],
  18: ['THE FLOOR THAT DOES NOT EXIST', "The Builders' Lobby", 'civic', 100,
    [['The Last Waiting Room', ['human', 'clanker']], ['The Echo Steps', ['lumen', 'mothwing']]],
    [["The Wardens' Gate", 'void', 'maintainer', 'the_warden'], ['The Echo Hall', 'void', 'echo', 'the_first_contestant'], ["The Builders' Seat", 'void', ['maintainer', 'echo'], 'the_absence']],
    ['The Control Room', "The Stack's Heart", 'The Door'], ['priest_index_archdeacon', 'engineer_okonkwo', 'the_fence'], 'mags_bartender', [['mags', 'Mags', 'Somehow already here'], ['kettle2', 'Brother Kettle', 'Has been here before, he thinks']], 'the_absence_handled', 'There is nothing below this. Choose.'],
};
const ABIL = ['slam', 'charge', 'barrage', 'nova', 'sweep', 'puddle', 'keys', 'summon', 'whistle', 'clockin'];
const out = {};
const monsters = JSON.parse(fs.readFileSync(path.join(ROOT, 'godot', 'data', 'monsters_world.json'), 'utf8'));
const pretty = (id) => id.replace(/^the_/, 'The ').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/^The The/, 'The');
for (const [n, f] of Object.entries(F)) {
  const [title, hub, style, ceil, villages, camps, landmarks, merchants, inn, quest, flag, how] = f;
  const lv = 90 + (n - 10) * 9;
  const spots = [[-200, -40], [170, -250], [-60, 280], [280, 40], [0, -320]];
  const lspots = [[110, 170], [-150, 180], [220, -130]];
  const vspots = [[-240, -180], [250, -170], [-250, 200], [250, 240]];
  out[n] = {
    floor: +n, name: `FLOOR ${n} · ${title}`, hub_name: hub, spawn: [0, 1.7, 52], ceil, hub: { style, w: 156, d: 120 },
    villages: villages.map(([name, races], i) => ({ name, x: vspots[i][0], z: vspots[i][1], races, merchants: [{ id: `v${n}${'abcd'[i]}`, name: `${name.split(' ').pop()} Trader`, title: ['Gear', 'Food, water, potions', 'Junk', 'Gear'][i], shop: ['gear', 'provisions', 'pickles', 'gear'][i] }] })),
    camps: camps.map(([name, cstyle, mob, boss], i) => {
      const last = i === camps.length - 1, a = lv + i * 2;
      return { name, camp: `c${n}_${i}`, x: spots[i % 5][0], z: spots[i % 5][1], r: last ? 26 : 22, style: cstyle, mob, lvl: [a, a + 2], count: 10, boss, level: `${a}-${a + 4} · ${last ? 'City' : i % 2 ? 'Borough' : 'Neighbourhood'}` };
    }),
    landmarks: landmarks.map((name, i) => ({ name, x: lspots[i][0], z: lspots[i][1], r: 16 })),
    merchants: [
      { id: `m${n}g`, name: pretty(merchants[0]), title: 'Weapons & armour', shop: 'gear', model: merchants[0] },
      { id: `m${n}p`, name: pretty(merchants[1]), title: 'Food, water, potions', shop: 'provisions', model: merchants[1] },
      { id: `m${n}t`, name: "Bo's Deepest Branch", title: 'Table merchant', shop: 'tables', race: 'stoneblood', voice: 'bo' },
      { id: `m${n}j`, name: pretty(merchants[2]), title: 'Junk', shop: 'pickles', model: merchants[2] },
    ],
    innkeeper: pretty(inn), innkeeper_model: inn, townsfolk: { races: villages[0][1] },
    stairs: n === '18' ? { x: 0, z: -312, r: 3.4, to: '19', flag, how, locked: how } : { x: 0, z: -312, r: 3.4, to: String(+n + 1), flag, how, locked: 'The way down is guarded. ' + how },
    quest_npcs: quest.map(([id, name, t], i) => ({ id, kind: 'quest', name, title: t, x: 0, z: 0, yaw: i * 2 })),
  };
  // the camps' monsters
  camps.forEach(([cname, cstyle, mob, boss], i) => {
    for (const m of [].concat(mob)) if (!monsters.monsters[m]) {
      const h = (m.length * 7 + n * 3) % 5;
      monsters.monsters[m] = { name: pretty(m), hp: 70 + h * 8, dmg: 9 + h, speed: 3.2 + (h % 3) * 0.3, reach: 2.0 + (h % 2) * 0.3, arc: 1.4, windup: 0.6, swing: 0.2, recover: 0.6, xp: 40 + h * 6, aggro: 15, barks: [] };
    }
    const last = i === camps.length - 1, h = (boss.length + n) % ABIL.length;
    monsters.monsters[boss] = { name: pretty(boss), title: `${last ? 'Floor Boss' : 'Camp Boss'} · ${cname}`, boss: true, hp: last ? 900 : 600, dmg: last ? 20 : 16, speed: 3.3, reach: 3.0, arc: 1.7, windup: 0.8, swing: 0.22, recover: 0.75, xp: last ? 2400 : 1200, aggro: 18, leash: 30, abilities: [ABIL[h], ABIL[(h + 3) % ABIL.length], ABIL[(h + 6) % ABIL.length]], barks: [], enrage: `${pretty(boss).toUpperCase()} IS FURIOUS` };
  });
}
fs.writeFileSync(path.join(ROOT, 'godot', 'data', 'floors_deep.json'), JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(ROOT, 'godot', 'data', 'monsters_world.json'), JSON.stringify(monsters, null, 1));
console.log('floors', Object.keys(out).length, 'monsters', Object.keys(monsters.monsters).length);
