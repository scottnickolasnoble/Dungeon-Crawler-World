// Writes art/TRIPO_DEEP_PROPS.md: the props Floors 10-18 are built from, plus the temples, the hidden clubs and the
// castle kit. The game already asks for these names; each one appears in the world as soon as it's imported.
//   node tools/build_tripo_deep_props.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STYLE = '3D game prop, stylized comic book cartoon, exaggerated chunky proportions, hand-painted texture with bold black ink outlines painted into the texture and flat cel-shaded colours';
const SPOOKY = '3D game prop, stylized comic book horror cartoon, exaggerated chunky proportions, hand-painted texture with bold black ink outlines painted into the texture and flat cel-shaded colours, eerie';
const END = 'Single object, no ground, no base, no scenery.';
// [folder, size (s/m/b), height, spooky?, description]
const GROUPS = [
  ['The castle kit (Floor 14, and any castle or keep anywhere)', [
    ['castle_wall', 'b', 6, 1, 'A long section of grey stone castle curtain wall with crenellated battlements on top, arrow slits, ivy and moss. Long and straight, flat ends so sections join.'],
    ['castle_tower_top', 'b', 5, 1, 'The crenellated top of a round stone castle tower with a pointed slate roof, a tattered flag and a crow.'],
    ['castle_gatehouse', 'b', 10, 1, 'A gothic castle gatehouse with two round towers, a pointed arch and a half-raised iron portcullis with spikes.'],
    ['drawbridge', 'b', 1.2, 1, 'A heavy wooden drawbridge lowered flat, iron bands, two thick chains running up from its far end.'],
    ['gargoyle', 'm', 1.4, 1, 'A crouching stone gargoyle with bat wings, a snarling face and a drain spout mouth, cracked and mossy.'],
    ['coffin', 'm', 0.8, 1, 'An old wooden coffin with a lid pushed slightly open, iron handles and a brass nameplate, dust.'],
    ['candelabra', 's', 1.8, 1, 'A tall wrought-iron floor candelabra with seven dripping candles, wax pooled at its feet.'],
    ['iron_chandelier', 'm', 1.6, 1, 'A huge round iron chandelier ringed with candles hanging on chains, cobwebs between the arms.'],
    ['gothic_throne', 'm', 2.6, 1, 'A towering gothic throne of black wood and carved bones, red velvet cushions, bat-wing back.'],
    ['gallows', 'b', 4.5, 1, 'A wooden gallows on a raised platform with steps and a noose swaying, a crow on the crossbeam.'],
    ['headstone_row', 'm', 1.3, 1, 'A crooked row of four mossy headstones with worn names, one cracked, one with fresh flowers.'],
    ['crypt_door', 'm', 3, 1, 'A stone crypt entrance with an iron-studded door, skull carving over the arch and a rusted padlock.'],
    ['armour_stand', 'm', 2, 1, 'A suit of dented plate armour on a stand holding a halberd, its visor slightly open and dark inside.'],
    ['haunted_portrait', 'm', 1.8, 1, 'A large gilded portrait frame of a pale noble lady whose eyes follow you; the paint is weeping. Flat back.'],
    ['iron_fence', 'm', 2, 1, 'A section of black wrought-iron graveyard fence with spear-tipped bars and a little gate.'],
    ['witch_tower', 'b', 12, 1, 'A thin crooked stone witch\'s tower leaning on a rocky crag, a single lit window at the top and a stair spiralling round it.'],
    ['dead_mill', 'b', 7, 1, 'A ruined watermill with a broken waterwheel, sagging roof and a single lantern in the doorway.'],
    ['stone_bridge', 'b', 3, 1, 'A narrow arched stone footbridge with crumbling parapets and a lantern post at the middle.'],
  ]],
  ['The hidden clubs (one interior kit, dressed differently on every floor)', [
    ['club_bar', 'b', 1.3, 0, 'A long battered wooden bar counter with brass foot rail, a row of beer taps, a tip jar and a cracked mirror behind. Dim, cosy, off the books.'],
    ['club_backbar', 'b', 2.6, 0, 'A back-bar shelf crammed with mismatched bottles, contestant wristbands nailed to the wall and old photos. Flat back.'],
    ['club_jukebox', 'm', 1.6, 0, 'A glowing retro jukebox with bubble tubes and a cracked dome, a hand-written NO NETWORK SONGS label.'],
    ['club_booth', 'm', 1.2, 0, 'A cosy red leather diner booth with a table, a candle in a bottle and carved initials.'],
    ['card_table', 'm', 1.1, 0, 'A green baize gambling table with scattered cards, chips, dice and a cigar smouldering in an ashtray.'],
    ['fight_cage', 'b', 3, 0, 'A small chain-link fighting cage for betting on captured monsters, a bloodied mat and a betting chalkboard.'],
    ['black_market_shelf', 'm', 2, 0, 'A secret shelving unit full of contraband: unbranded loot boxes, unlabelled potions, weapons wrapped in cloth.'],
    ['walk_in_safe', 'b', 2.6, 0, 'A massive round bank-vault door in a wall, slightly ajar, a big wheel handle and a small hand-painted OFF AIR sign. Flat back.'],
    ['bounty_board', 'm', 2, 0, 'A cork bounty board with wanted posters of monsters and contestants, red string and pins.'],
    ['hidden_door_freezer', 'b', 2.4, 0, 'A walk-in freezer door with a frosted window and a sticker reading STAFF, a tiny knocking hatch at eye level.'],
  ]],
  ['Temples and shrines (one altar per god; the statues are the god models from TRIPO_CAST_3)', [
    ['shrine_small', 'm', 1.5, 0, 'A small roadside shrine: a little wooden roof over a shelf of candles, offerings and a blank spot for an idol.'],
    ['altar_tally', 'b', 2, 0, 'An altar of stacked ledgers and abacuses with tally marks carved everywhere and a coin offering slot.'],
    ['altar_damp', 'b', 1.5, 1, 'A dripping altar of wet stone in a shallow pool, newspaper offerings floating and a brass bell.'],
    ['altar_hollow_chef', 'b', 1.8, 1, 'A huge iron cooking range as an altar with an empty cauldron, plates set for guests that never came.'],
    ['altar_mother_mould', 'b', 1.4, 1, 'A soft bed-shaped altar of moss and mould with a quilt of mushrooms and a pillow.'],
    ['altar_rustwright', 'b', 2.2, 0, 'An anvil altar with a ticking clock set into it, gears and spanners as offerings and a forge glow.'],
    ['altar_good_neighbour', 'b', 1.6, 1, 'A white picket fence altar with a welcome mat, a pie on a stand and a rule book on a lectern.'],
    ['altar_lady_lumen', 'b', 2.5, 0, 'An altar of lamps of every kind, candles and bulbs piled high, moths resting on it.'],
    ['altar_antlered_viewer', 'b', 2.4, 1, 'An altar of mounted antlers and trophy plaques around a vintage film camera on a tripod.'],
    ['altar_encore', 'b', 2.2, 0, 'A small glittering stage altar with a spotlight, a microphone stand and a heap of bouquets.'],
    ['altar_index', 'b', 2.4, 0, 'An altar of card-catalogue drawers with a brass reading lamp and a huge open book.'],
    ['altar_static', 'b', 2.4, 1, 'A wall of old televisions all showing static, cables pooled at the base like roots.'],
    ['empty_plinth', 'm', 1.6, 1, 'A plain grey concrete plinth with nothing on it, a small brass plaque that has been scratched blank.'],
  ]],
  ['Floor 10: The Backlot', [
    ['set_front_western', 'b', 7, 0, 'A Wild West saloon film-set front: only the facade, propped up by timber braces at the back, swing doors and a balcony. Flat back with visible braces.'],
    ['set_front_moonbase', 'b', 6, 0, 'A cheap sci-fi moon base film-set front made of painted plywood and dryer ducts, a round hatch door, braces behind.'],
    ['set_front_alley', 'b', 7, 1, 'A spooky Victorian alley film-set front: crooked windows, a gas lamp and a painted fog, braces behind.'],
    ['camera_crane', 'b', 6, 0, 'A big film camera crane on a dolly with a long arm and a camera at the end, counterweights and a seat.'],
    ['clapperboard_giant', 'b', 5, 0, 'A giant film clapperboard standing upright, chalk writing reading TAKE 9,999.'],
    ['catering_tent', 'b', 3.5, 0, 'A striped catering tent with folding tables, urns, trays of sandwiches and a SNACKS sign.'],
    ['makeup_trailer', 'b', 3.2, 0, 'A star\'s trailer with a gold star on the door, light-bulb mirror visible in the window, steps.'],
    ['bleachers', 'b', 4, 0, 'A section of studio audience bleachers with rows of seats and a cardboard cut-out audience.'],
    ['spotlight_rig', 'm', 4, 0, 'A scaffold lighting tower with four big stage lamps, coloured gels and cables.'],
  ]],
  ['Floor 11: The Arena', [
    ['stadium_stand', 'b', 8, 0, 'A section of stadium seating stand, rows of plastic seats rising up, a flag and a scarf left behind.'],
    ['jumbotron', 'b', 8, 0, 'A giant stadium jumbotron screen on a steel frame showing a cheerful score and a crack.'],
    ['goalpost', 'b', 3, 0, 'A football goal with a torn net and a deflated ball tangled in it.'],
    ['burger_stand', 'm', 3, 0, 'A stadium burger kiosk with a menu board, hatch open, ketchup bottles and a grill.'],
    ['trophy_cabinet', 'b', 3, 0, 'A glass trophy cabinet full of gaudy golden trophies, one shaped like a skull. Flat back.'],
    ['locker_bank', 'm', 2, 0, 'A row of dented changing-room lockers, one door open with a jersey hanging out.'],
    ['halftime_stage', 'b', 3, 0, 'A small halftime show stage with pyrotechnic cannons, speaker stacks and a glittering backdrop.'],
    ['turnstile', 'm', 1.2, 0, 'A row of two chrome stadium turnstiles with a ticket slot and a red light.'],
  ]],
  ['Floor 12: The Green Room', [
    ['star_dressing_door', 'm', 2.5, 0, 'A dressing-room door with a big gold star and a name card, a bulb-ringed mirror visible inside. Flat back.'],
    ['makeup_mirror_desk', 'm', 1.8, 0, 'A dressing-room desk with a bulb-ringed mirror, makeup brushes, wigs on heads and a vase of dead flowers.'],
    ['talk_show_couch', 'b', 1.2, 0, 'A big talk-show set: host desk with a mug and a cue card stack, and a long guest sofa.'],
    ['applause_sign', 'm', 1, 0, 'A light-up APPLAUSE sign hanging from two chains, one bulb blinking.'],
    ['writers_table', 'b', 1.2, 0, 'A messy writers\' room table covered in scripts, coffee cups and index cards, chairs around it.'],
    ['laugh_machine', 'b', 2.5, 1, 'A big reel-to-reel laugh-track machine with dials labelled CHUCKLE to HYSTERIA and tape spilling out.'],
    ['costume_rail', 'm', 2, 0, 'A wheeled costume rail crammed with sequinned costumes, animal suits and a wedding dress.'],
  ]],
  ['Floor 13: The Stacks', [
    ['bookshelf_tall', 'b', 6, 0, 'A towering library bookshelf crammed with books, a rolling ladder on a rail, brass labels.'],
    ['card_catalogue', 'm', 1.6, 0, 'A wooden library card catalogue cabinet with dozens of small brass-handled drawers, some pulled out.'],
    ['reading_desk', 'm', 1.2, 0, 'A long library reading desk with green banker\'s lamps and a stack of open books.'],
    ['book_pile', 's', 1, 0, 'A teetering pile of old books with a bookmark ribbon and a mouse on top.'],
    ['returns_chute', 'm', 2.2, 1, 'A brass book-returns chute in a wooden cabinet, a sign reading RETURN ALL THINGS, a hand reaching out.'],
    ['library_gantry', 'b', 1.5, 0, 'A wrought-iron library gallery walkway section with a railing and a spiral stair end.'],
  ]],
  ['Floor 15: The Cold Store', [
    ['server_rack', 'm', 2.2, 0, 'A tall black server rack with blinking lights, tangled cables and frost on the vents.'],
    ['cooling_tower', 'b', 10, 0, 'A big concrete cooling tower with steam rising and ice on its rim, a ladder up the side.'],
    ['cable_bundle', 'm', 1, 0, 'A huge snaking bundle of thick coloured cables coiled on the floor like roots.'],
    ['tape_reel_stack', 'm', 2, 0, 'A shelf of big old computer tape reels in metal cases labelled SEASON 1 to SEASON 9.'],
    ['big_red_switch', 'm', 2, 0, 'A big industrial wall switch with a red lever, a glass cover and a sign: DO NOT.'],
  ]],
  ['Floor 16: The Transmitter', [
    ['satellite_dish', 'b', 5, 0, 'A big satellite dish on a lattice stand, pointing up, frost and bird nests on it.'],
    ['broadcast_mast', 'b', 16, 0, 'A tall red-and-white lattice broadcast mast with blinking red lights and guy wires.'],
    ['mixing_desk', 'b', 1.4, 0, 'A huge broadcast mixing desk with hundreds of faders and knobs and a wall of monitors.'],
    ['on_air_light', 's', 0.6, 0, 'A red ON AIR studio light box on a bracket, glowing.'],
  ]],
  ['Floor 17: The Host\'s House', [
    ['fifties_house', 'b', 8, 0, 'A perfect 1950s suburban house with a porch swing, white picket fence and a too-bright lawn. Something wrong in one window.'],
    ['drive_in_screen', 'b', 12, 0, 'A big drive-in cinema screen on a scaffold, showing the Host\'s smiling face.'],
    ['fifties_diner', 'b', 4.5, 0, 'A chrome 1950s diner with neon signs, red stools at the counter visible through the windows.'],
    ['mirror_panel', 'm', 2.5, 1, 'A tall standing mirror panel in a gold frame, one corner cracked, a hand print on the glass.'],
    ['school_desk', 's', 1, 0, 'An old wooden school desk with an inkwell and a carved name.'],
  ]],
  ['Floor 18: The Floor That Does Not Exist', [
    ['builder_machine', 'b', 8, 1, 'A colossal silent machine of smooth grey concrete and brass dials, older than anything, a single small lit button.'],
    ['impossible_stair', 'b', 6, 1, 'A bare concrete staircase that twists back on itself in an impossible loop.'],
    ['control_console', 'b', 1.5, 1, 'A long ancient control console of brass levers and dusty glass gauges, one chair in front.'],
  ]],
];
let md = '# Tripo: the props for Floors 10 to 18, temples, clubs and castles\n\nThe new floors, the temples (Floor 7 onward), the hidden clubs (every floor) and Castle Dread are built from these. The game already asks for these names. Until each one exists that spot stays empty, so the more you make, the fuller the floors get.\n\n**Settings:** same as before (text tab, H3.1 Best Quality, 4K, PBR off, Triangle). Polycount by size:\n\n- **Big:** 40,000\n- **Mid:** 20,000\n- **Small:** 8,000\n\n**Saving:** `art/incoming/props/<folder>/<folder>.glb`, then tell Claude "import the props".\n\n';
let n = 0;
const sizes = { s: 'small', m: 'mid', b: 'big' };
for (const [group, items] of GROUPS) {
  md += `## ${group}\n\n`;
  for (const [folder, size, h, spooky, desc] of items) {
    n++;
    md += `### ${n}. ${folder.replace(/_/g, ' ')}\nfolder: ${folder} · height ${h} m · *${sizes[size]}*\n\n${spooky ? SPOOKY : STYLE}. ${desc} ${END}\n\n`;
  }
}
md += `---\n\n**Total:** ${n} props, about ${n * 50} credits.\n\n**Suggested order:**\n\n1. The castle kit and the club kit, which are used on many floors.\n2. Then the temples.\n3. Then each floor's set.\n`;
fs.writeFileSync(path.join(ROOT, 'art', 'TRIPO_DEEP_PROPS.md'), md);
fs.writeFileSync(path.join(ROOT, 'art', 'tripo_props_deep.json'), JSON.stringify(GROUPS.flatMap(([, items]) => items.map(([folder, size, height]) => ({ folder, size, height }))), null, 1));
console.log('props', n);
