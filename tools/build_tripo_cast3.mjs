// Writes art/TRIPO_CAST_3.md and art/tripo_queue_3.json: every character still to make, from art/WORLD.md
// (factions, rivals, clubs, gods, priests, Floors 10-18) plus the Undercity's townspeople.
//   node tools/build_tripo_cast3.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STYLE = {
  m: 'Full-body 3D game character, scary stylized comic book horror cartoon with a clear, readable, menacing face, hand-painted texture with bold black ink lines and cel-shaded colours.',
  n: 'Full-body 3D game character, stylized comic book cartoon with a clear, expressive, readable face and believable proportions, hand-painted texture with bold black ink lines and cel-shaded colours.',
  g: 'Full-body 3D game character, an imposing, uncanny god from a comic book horror story, clear readable face or mask, hand-painted texture with bold black ink lines and cel-shaded colours.',
};
const END = { t: 'Standing in a T-pose, arms straight out, facing forward, empty hands, no base.', c: 'One single character, neutral pose, facing forward, no ground, no base, no scenery.' };
// [folder, style, pose (t = humanoid T-pose, c = creature), height in metres, description]
const GROUPS = [
  ['Floors 7 to 9: the Undercity townspeople still missing', [
    ['clerk_damp', 'n', 't', 1.7, 'A damp, earnest tenant advocate in a soggy cardigan and wellies, clutching a dripping folder of complaints, glasses fogged.'],
    ['rivet_rosie', 'n', 't', 1.75, 'A muscular riveter armourer in a welding apron covered in rivets, a bandana, rolled sleeves and a hammer on her belt.'],
    ['galley_gwen', 'n', 't', 1.65, 'A cheerful ship\'s cook in a stained apron and sailor cap, ladle tucked in her belt, tattoos of fish on her arms.'],
    ['flotsam', 'n', 't', 1.4, 'A small gutterkin rat-folk junk dealer wearing a coat stitched from fishing nets and life rings, bottles hanging from his belt.'],
    ['damp_maud', 'n', 't', 1.7, 'A tall gloomy innkeeper in a long black dress with a dripping hem, keys on a chain, hair in a wet bun.'],
    ['canary', 'n', 't', 1.55, 'A young miner with a yellow feathered hood and goggles, a birdcage lantern on her back, soot on her cheeks.'],
    ['cookie', 'n', 't', 1.8, 'A broad mining-camp cook in a sweat-stained vest and hairnet, forearms like hams, a frying pan on his back.'],
    ['tailings', 'n', 't', 1.5, 'A hunched stoneblood scrap dealer made of grey rubble with a sack of ore and odd treasures over his shoulder.'],
    ['bunk_bertha', 'n', 't', 1.85, 'A big friendly bunkhouse matron in overalls and a hard hat with a candle stuck on it, a stack of folded blankets.'],
    ['the_returning_officer', 'n', 't', 1.9, 'A gaunt election official in a long grey coat and a rosette, an abacus in one hand and tally marks drawn all over his skin.'],
    ['halberd_armourer', 'n', 't', 1.85, 'A stern old armourer in a leather apron with a ceremonial halberd strapped to his back and a monocle.'],
    ['canteen_lady_doris', 'n', 't', 1.6, 'A stout civic canteen dinner lady with a hairnet, tabard and a huge serving spoon, pursed lips.'],
    ['clerk_lostwell', 'n', 't', 1.7, 'A fussy lost-property clerk in a brown coat covered in luggage tags, holding a lone umbrella and a teddy.'],
    ['madame_ledger', 'n', 't', 1.75, 'An elegant, severe hotel owner in a high-collared Victorian dress with a ledger book and quill, ink on her fingers.'],
  ]],
  ['New units for the old factions (see WORLD.md, "The monster factions")', [
    ['cone_priest', 'm', 't', 1.35, 'A goblin shaman wearing a tall stack of traffic cones as a mitre, robes of hi-vis vests, a smoking cone censer.'],
    ['wick_page', 'm', 't', 1.4, 'A small pale moth-servant with stubby wings and a candle stub burning on its head, carrying a lamp on a pole.'],
    ['bucket_brute', 'm', 't', 2.2, 'A hulking janitor wight with a mop bucket jammed on its head and a wringer for a fist, rotting overalls.'],
    ['change_imp', 'm', 'c', 0.9, 'A tiny gremlin made of coins and a coin-return slot for a mouth, spilling pennies when it moves.'],
    ['ladle_boy', 'm', 't', 1.3, 'A scrawny hag apprentice in an oversized apron carrying a ladle as long as he is, soup stains everywhere.'],
    ['taser_kid', 'm', 't', 1.5, 'A twitchy teenage mall cop with sparking taser gloves, too-big uniform and a mouth full of braces.'],
    ['beater', 'm', 't', 1.8, 'A safari beater in khaki shorts and a pith helmet with a drum and stick, eyes wide and mad, flowers in his hatband.'],
    ['sluice_boy', 'm', 't', 1.6, 'A sewer worker zombie in rubber waders and a gas mask, a long sluice pole and a lantern.'],
  ]],
  ['The other contestants: named rivals (see WORLD.md, "The named rivals")', [
    ['dex_okafor', 'n', 't', 1.85, 'A cocky athletic man in a torn tracksuit and a sweatband, a glowing sword strapped to his back, a winning grin for the camera.'],
    ['nell_brightwater', 'n', 't', 1.35, 'A gentle frog-folk woman in a raincoat and wellies, a seashell necklace and a little notebook of names.'],
    ['tank_wisniewski', 'n', 't', 2.3, 'A huge soft-spoken ogre man in a hard hat and demolition vest, bandoliers of dynamite, nervous expression.'],
    ['priya_raman', 'n', 't', 1.65, 'A fierce paramedic in a bloodied green uniform, a defibrillator on her back and a first-aid bag, hair tied up.'],
    ['jojo_spark', 'n', 't', 1.55, 'A fox-folk streamer in a neon hoodie and gaming headset, lightning crackling at her fingertips, phone on a selfie stick holster.'],
    ['brother_kettle', 'n', 't', 1.8, 'A calm stone-skinned monk in brown robes with a kettle hanging from his belt and bone charms on a cord.'],
    ['vasquez_twins_ana', 'n', 't', 1.7, 'A sharp-eyed repo agent woman in a leather jacket with a tow hook on a chain and a clipboard of debts.'],
    ['vasquez_twins_lu', 'n', 't', 1.7, 'An exterminator woman in a canister backpack and goggles with a spray wand, identical face to her twin, scowling.'],
    ['grandpa_mo', 'n', 't', 1.3, 'A delighted 84-year-old rat-folk plumber in a flat cap and overalls, a plunger on his back and a pipe in his teeth.'],
    ['ivy_marsh', 'n', 't', 1.8, 'A zealous elf-like lumen woman in white robes with a lantern staff, a cold bright stare and a sun pendant.'],
    ['kofi_mensah', 'n', 't', 1.8, 'A calm dentist in a white tunic with a head mirror, a belt of pliers and drills, dry smile.'],
    ['rattle', 'n', 't', 1.9, 'A battered security robot in a night watchman\'s cap and torch, one eye flickering, a bent name badge.'],
    ['big_sal', 'n', 't', 2.0, 'A jolly orc mall Santa in a stained red suit with a sack of gifts and grenades, a candy cane club.'],
    ['ming_zhao', 'n', 't', 1.65, 'A speedrunner in running gear with a stopwatch, clockwork bracers and a timer glowing over her wrist.'],
    ['ada_lockwood', 'n', 't', 1.8, 'An ex-lawyer lumen woman in a sharp suit with a rune-covered briefcase and reading glasses, hex sigils on her sleeves.'],
    ['pocket', 'n', 't', 1.1, 'A tiny cheerful hedgehog-folk with mushrooms growing out of his quills and one arm made of soft mould.'],
  ]],
  ['The hidden clubs: the Back Door, the Lock-In and the Off-Air Room', [
    ['mags_bartender', 'n', 't', 1.7, 'A wiry old woman bartender with a grey quiff, rolled sleeves, faded contestant tattoos, a bar towel over her shoulder and a knowing smirk.'],
    ['the_fence', 'n', 't', 1.75, 'A shifty black-market fence in a long coat lined with stolen items, rings on every finger and one gold tooth.'],
    ['the_forger', 'n', 't', 1.6, 'A twitchy forger with ink-stained hands, jeweller\'s loupe, a stamp in each pocket and a stack of fake passports.'],
    ['slip_smuggler', 'n', 't', 1.7, 'A slick smuggler in a hooded rain cape with hidden pockets, a map tube on her back and a crooked grin.'],
    ['stagehand_ollie', 'n', 't', 1.75, 'A defected TV stagehand in black crew clothes with a cut headset cable and a gaffer-tape bracelet, guilty eyes.'],
  ]],
  ['The gods (avatars, used for visions, temples and a few fights)', [
    ['god_saint_tally', 'g', 't', 3.2, 'A tall saint made of ledger pages with abacus beads for eyes, every inch of skin covered in tally marks, a halo of numbers.'],
    ['god_old_damp', 'g', 't', 3.0, 'A bloated kindly old man made of wet newspaper and puddle water, dripping, with a soggy hat and gentle sad eyes.'],
    ['god_hollow_chef', 'g', 't', 3.6, 'A towering cook in a stained white jacket whose head is an empty iron pot, ladles for fingers, steam pouring from the pot.'],
    ['god_mother_mould', 'g', 't', 3.2, 'A soft grey-green matron made of warm mould and bread dough, sleepy smile, mushrooms crowning her head like a veil.'],
    ['god_rustwright', 'g', 't', 3.4, 'A soot-black blacksmith god with a drill for one hand and a ticking clock in his open chest, sparks for a beard.'],
    ['god_good_neighbour', 'g', 't', 3.0, 'A smiling man in a perfect cardigan whose face is a painted white picket fence with eyes, holding a welcome casserole.'],
    ['god_lady_lumen', 'g', 't', 3.4, 'A tall moth-winged goddess of soft lamplight with glowing skin and a lampshade crown, light spilling from her hands.'],
    ['god_antlered_viewer', 'g', 't', 3.6, 'A stag-headed hunter god in a tweed hunting coat, one eye replaced by a big camera lens, antlers hung with trophies.'],
    ['god_encore', 'g', 't', 3.2, 'A shimmering figure made of spotlights and perfect white teeth, a sequinned suit, arms raised for applause.'],
    ['god_the_index', 'g', 't', 3.2, 'A librarian god whose body is built of card-catalogue drawers, some open, index cards fluttering, spectacles on a chain.'],
    ['god_mother_of_static', 'g', 't', 3.4, 'A woman shape made entirely of TV static and scan lines, an old TV for a head showing a test card, cables trailing.'],
  ]],
  ['Priests of the temples (Floor 7 onward)', [
    ['priest_tally_abbot', 'n', 't', 1.75, 'A counting-house abbot in grey robes stitched with tally marks, an abacus rosary and ink-blackened fingers.'],
    ['priest_hollow_friar', 'n', 't', 1.8, 'A fat friar in a chef\'s robe with an empty bowl hung round his neck and a wooden spoon sceptre.'],
    ['priest_mould_midwife', 'n', 't', 1.7, 'A gentle midwife in a mossy nurse\'s cap and apron, mould blooming on her sleeves, a warm blanket over one arm.'],
    ['priest_rust_deacon', 'n', 't', 1.85, 'A deacon in an oil-stained boiler suit and a clerical collar, a wrench censer swinging, gears on his stole.'],
    ['priest_neighbour_pastor', 'n', 't', 1.8, 'An unnervingly cheerful pastor in a pastel cardigan with a clipboard of rules and a whistle, perfect teeth.'],
    ['priest_lumen_abbess', 'n', 't', 1.85, 'A lamp abbess in white and gold robes with a lampshade wimple, moths settled on her shoulders.'],
    ['priest_viewer_huntsman', 'n', 't', 1.85, 'A huntsman priest in a tweed cape with antler headdress, a horn and a camera on a strap.'],
    ['priest_encore_hype', 'n', 't', 1.75, 'A hype priest in a glittering game-show suit with a microphone sceptre and a sash reading APPLAUSE.'],
    ['priest_index_archdeacon', 'n', 't', 1.8, 'An archdeacon in robes made of library catalogue cards, half-moon glasses and a rubber stamp seal.'],
    ['priest_static_choir', 'n', 't', 1.75, 'A choir engineer in a white lab coat and a satellite-dish halo, headphones, static crackling in her mouth.'],
  ]],
];
const FLOORS = [
  [10, 'The Backlot', [
    ['stagehand', 'm', 't', 1.8, 'A faceless TV stagehand in all-black crew clothes, a headset clamped over a blank face, clipboard and gaffer tape.'],
    ['boom_gremlin', 'm', 'c', 1.0, 'A wiry gremlin holding a boom microphone pole twice its size, fuzzy windshield head, big ears and needle teeth.'],
    ['the_extras', 'm', 't', 1.8, 'A grey-faced background actor still in a cowboy costume, dead eyes, frozen polite smile, number pinned to his chest.'],
    ['floor_manager', 'm', 't', 2.0, 'A towering floor manager with a headset fused to her skull, a megaphone arm and a stopwatch for an eye.'],
    ['the_stunt_double', 'm', 't', 2.1, 'A scarred stuntman wrapped in burn bandages and pads, harness straps, a crash helmet and one arm in a cast.'],
    ['makeup_witch', 'm', 't', 1.9, 'A makeup artist witch with a belt of brushes like knives, a powder puff and a face painted to look like everyone.'],
    ['craft_services_glutton', 'm', 't', 2.6, 'An enormous caterer with a buffet table grown into his belly, trays of food on his arms and a hungry wide mouth.'],
    ['the_showrunner', 'm', 't', 2.4, 'A showrunner in a director\'s chair harness, a clapperboard jaw, a cap reading BOSS and a script spine for a back.'],
    ['script_sue', 'n', 't', 1.65, 'A frazzled script supervisor with pencils in her hair, a fat ring binder and a stopwatch, highlighter in her teeth.'],
    ['gaffer_gus', 'n', 't', 1.85, 'A burly lighting gaffer with coils of cable over his shoulder, a tool belt and gaffer tape on his knuckles.'],
    ['wardrobe_wendy', 'n', 't', 1.7, 'A wardrobe mistress covered in pinned fabric samples, a tape measure necklace and a pincushion wristband.'],
    ['chef_polenta', 'n', 't', 1.75, 'A catering chef in a crumpled white hat with a tray of sandwiches and a burnt oven glove.'],
    ['props_master', 'n', 't', 1.6, 'A props master in a waistcoat with prop weapons, rubber chickens and fake money sticking out of every pocket.'],
    ['trailer_tina', 'n', 't', 1.7, 'A trailer park innkeeper in a dressing gown and curlers, fluffy slippers and a mug reading STAR.'],
  ]],
  [11, 'The Arena', [
    ['mascot', 'm', 't', 2.2, 'A giant fuzzy sports mascot costume with a huge grinning foam head; the eyes are holes and something real looks out.'],
    ['ultra', 'm', 't', 1.8, 'A wild football hooligan in a scarf and face paint, a lit red flare in one hand and a broken chair leg.'],
    ['cheer_squad', 'm', 't', 1.7, 'A cheerleader with pom-poms made of razor ribbons, a fixed huge smile and blank, staring eyes.'],
    ['big_foam_finger', 'm', 't', 3.0, 'A giant mascot made of a huge foam finger with a body, little legs and arms, the finger pointing, a hungry grin.'],
    ['the_capo', 'm', 't', 2.1, 'A hooligan chant leader standing tall with a drum on his chest, a megaphone and a scarf mask.'],
    ['head_cheerleader', 'm', 't', 2.0, 'A towering head cheerleader with too many arms holding pom-poms, a crown of ribbons and a terrifying grin.'],
    ['the_ref', 'm', 't', 2.2, 'A gaunt striped referee with a whistle, red and yellow cards like blades and a stopwatch heart.'],
    ['the_champion', 'm', 't', 2.4, 'Last season\'s champion in battered golden armour covered in sponsor logos, a trophy for a helmet, kept alive by tubes.'],
    ['groundskeeper_turf', 'n', 't', 1.75, 'A weathered groundskeeper with a line-marking trolley, a flat cap and grass-stained overalls.'],
    ['commentator_booth', 'n', 't', 1.75, 'A sports commentator in a blazer with a headset mic and a sheaf of stats, overexcited face.'],
    ['kit_man_kev', 'n', 't', 1.8, 'A kit man with bags of shirts and pads on his shoulders and a whistle, a tired grin.'],
    ['hot_dog_hattie', 'n', 't', 1.65, 'A stadium food vendor with a hot dog tray strapped round her neck and a paper hat.'],
    ['ticket_tout_terry', 'n', 't', 1.7, 'A shifty ticket tout in a long coat lined with tickets, a flat cap and a sly grin.'],
    ['coach_bunk', 'n', 't', 1.85, 'A retired football coach innkeeper in a tracksuit with a whistle and a clipboard of room numbers.'],
  ]],
  [12, 'The Green Room', [
    ['laugher', 'm', 'c', 1.8, 'A ghost made of dozens of laughing mouths floating in a grey sheet, tears of laughter, no eyes.'],
    ['paparazzo', 'm', 't', 1.7, 'A hunched paparazzi photographer whose head is a camera with a flash bulb, long lenses for arms.'],
    ['autograph_hound', 'm', 'c', 1.1, 'A ragged dog-like creature with a pen for a tongue, covered in signed photos, desperate eyes.'],
    ['the_laugh_track', 'm', 'c', 3.0, 'A huge reel-to-reel tape machine monster with laughing mouths on its spools and tape tentacles.'],
    ['flash_mob', 'm', 't', 2.2, 'A crowd of paparazzi fused into one giant body with dozens of camera flashes for eyes.'],
    ['agent_twelve_percent', 'm', 't', 2.0, 'A slick talent agent with a shark grin, a contract scroll, a phone headset and twelve gold rings.'],
    ['jolly_jack_brightly', 'm', 't', 2.1, 'A grinning talk-show host with a frozen too-wide smile, a microphone fused to his hand and a glitter suit.'],
    ['the_producer', 'm', 't', 2.3, 'A producer in a sharp suit whose head is a ratings chart screen, contracts trailing from his pockets.'],
    ['runner_rhys', 'n', 't', 1.75, 'A young TV runner in a lanyard and headset carrying a tray of coffees, permanently out of breath.'],
    ['staff_writer_wren', 'n', 't', 1.7, 'A tired staff writer in a cardigan with a pencil behind each ear and a stack of rejected jokes.'],
    ['hettie_makeup', 'n', 't', 1.65, 'A hair and makeup artist with a brush belt, a powder puff and an enormous bouffant.'],
    ['commissary_carl', 'n', 't', 1.8, 'A canteen cook in a paper hat with a soup ladle, nametag reading CARL.'],
    ['lost_props_lou', 'n', 't', 1.6, 'A small props-cupboard keeper with a feather boa, a rubber sword and a box of wigs.'],
    ['green_room_gloria', 'n', 't', 1.75, 'A faded star hostess in a sequinned gown and feather stole, a cocktail and a tired smile.'],
  ]],
  [13, 'The Stacks', [
    ['bookwyrm', 'm', 'c', 2.0, 'A long serpent made of book spines and torn pages, a reading-lamp glow for eyes, dust trailing.'],
    ['shusher', 'm', 't', 2.0, 'A tall thin librarian wraith with a finger fused to its lips, a grey cardigan and no eyes, only spectacles.'],
    ['paper_golem', 'm', 't', 2.3, 'A golem of crumpled paper and newspaper bound with string, headlines across its chest, ink-blot face.'],
    ['head_librarian', 'm', 't', 2.4, 'A towering head librarian with a date-stamp hand, a bun skewered with pencils and a shushing mouth.'],
    ['overdue', 'm', 'c', 2.6, 'A beast made of overdue notices and late-fee jars, a library card for a tongue, hungry.'],
    ['bindery_foreman', 'm', 't', 2.3, 'A bookbinder brute with a guillotine cutter for one arm and spools of thread, glue-slick apron.'],
    ['index_clerk', 'm', 't', 2.0, 'A clerk with a card-catalogue drawer for a chest, filing cards with long fingers, a hood of index cards.'],
    ['the_archivist', 'm', 't', 2.6, 'A giant archivist in robes of filing folders with a lantern head and keys to every room on its belt.'],
    ['page_turner_pim', 'n', 't', 1.3, 'A small library assistant hedgehog-folk with a book trolley and tiny spectacles.'],
    ['fines_desk_freda', 'n', 't', 1.65, 'A stern fines-desk librarian with a date stamp and a cash box, cat-eye glasses.'],
    ['reading_room_rory', 'n', 't', 1.75, 'A reading-room tea man with a trolley urn and a tray of biscuits, slippers.'],
    ['bookbinder_bram', 'n', 't', 1.8, 'A bookbinder with leather offcuts, an awl and a bound tome under his arm.'],
    ['quiet_quentin', 'n', 't', 1.75, 'A whispering innkeeper in felt slippers with a finger to his lips and a candle.'],
  ]],
  [14, 'Castle Dread', [
    ['the_restless', 'm', 't', 1.8, 'A ghostly grey contestant in tattered clothes from an old season, a hollow face and chains of name tags.'],
    ['hollow_guard', 'm', 't', 2.1, 'An empty suit of rusted plate armour with a glowing green light where a face should be, a halberd.'],
    ['waxwork', 'm', 't', 1.8, 'A melting wax figure of a horror-film victim, drips frozen mid-fall, glassy eyes, half its face gone.'],
    ['gravedigger', 'm', 't', 2.2, 'A hulking hunchbacked gravedigger with a spade, a lantern and dirt in his grin, coffin nails in his hat.'],
    ['wax_witch', 'm', 't', 2.0, 'A witch made of candle wax with burning wicks for hair and dripping hands, a black candle staff.'],
    ['portcullis_knight', 'm', 't', 2.6, 'A giant knight whose visor is a portcullis grate, chains for a cloak and a drawbridge-plank shield.'],
    ['the_ossuary', 'm', 'c', 3.0, 'A shambling heap of skulls and bones arranged like a chapel, candles on its back and a choir of jaws.'],
    ['the_count', 'm', 't', 2.3, 'A gaunt gothic count in a high-collared cape with stage makeup, theatrical fangs and a director\'s megaphone hidden in his cloak.'],
    ['lamplighter_lisbet', 'n', 't', 1.65, 'A brave lamplighter girl with a long lighting pole and a lantern, a shawl and muddy boots.'],
    ['widow_grimsby', 'n', 't', 1.7, 'A gravekeeper\'s widow in black lace mourning dress with a bouquet of dead roses.'],
    ['blacksmith_morrow', 'n', 't', 1.9, 'A village blacksmith with a leather apron, hammer and a horseshoe charm on a cord.'],
    ['goodwife_gall', 'n', 't', 1.6, 'A village goodwife with a basket of bread and garlic garlands round her neck.'],
    ['pedlar_crook', 'n', 't', 1.5, 'A hunched pedlar with a tray of charms, rosaries and stakes, a crooked hat.'],
    ['old_mother_lych', 'n', 't', 1.6, 'An ancient coaching-inn landlady with a candle, a shawl and a ring of iron keys.'],
  ]],
  [15, 'The Cold Store', [
    ['cable_crawler', 'm', 'c', 1.2, 'A spider-like creature made of tangled network cables and plugs, blinking LED eyes.'],
    ['fan_wraith', 'm', 'c', 2.0, 'A ghost made of whirling cooling fans and frost, a cold blue glow and icicle teeth.'],
    ['bit_rot', 'm', 't', 1.8, 'A glitching corrupted human figure with pixelated missing chunks and doubled faces.'],
    ['cable_mother', 'm', 'c', 3.2, 'A huge nest-creature of cables with a server-rack body and many plug-headed limbs.'],
    ['fan_wraith_king', 'm', 'c', 3.0, 'A crowned storm of cooling fans and ice with a frozen face in the middle.'],
    ['the_backup', 'm', 't', 2.0, 'A blank grey mannequin copy of a person with a progress bar across its chest, half-loaded.'],
    ['the_firewall', 'm', 't', 3.0, 'A burning golem made of a brick wall with flames running along its mortar and a padlock heart.'],
    ['the_recorder', 'm', 'c', 3.4, 'An enormous ancient tape-recorder machine on spider legs with a microphone eye and a red REC light.'],
    ['sysadmin_sven', 'n', 't', 1.85, 'A bearded sysadmin in a cardigan and fingerless gloves with a laptop and a lanyard of keys.'],
    ['defrag_dot', 'n', 't', 1.55, 'A cheerful tiny clanker robot technician with a screwdriver hand and a beanie.'],
    ['coolant_cass', 'n', 't', 1.7, 'A coolant engineer in a frost-covered parka with a canister backpack and goggles.'],
    ['warm_room_wes', 'n', 't', 1.75, 'A cook in a woolly hat and apron with a steaming soup flask and a heater on his back.'],
    ['spare_parts_sparks', 'n', 't', 1.6, 'A scrap tinkerer with magnifying goggles and a coat covered in circuit boards.'],
    ['night_shift_noor', 'n', 't', 1.7, 'A night-shift innkeeper in a hi-vis jacket with a torch and a thermos.'],
  ]],
  [16, 'The Transmitter', [
    ['static_man', 'm', 't', 1.9, 'A man-shaped figure made of TV static and snow, an old TV-set head showing interference.'],
    ['ratings_ghoul', 'm', 't', 1.8, 'A gaunt ghoul with a ratings bar chart for a ribcage and a clipboard of numbers it chews on.'],
    ['censor_bar', 'm', 'c', 2.0, 'A floating black censor bar creature with a single bleep-mouth and grasping thin arms.'],
    ['static_king', 'm', 't', 3.0, 'A king of static in a crown of antennae and a cape of tangled cables, his face a dead channel.'],
    ['the_censor', 'm', 't', 2.4, 'A towering censor with black bars over its eyes and mouth, giant scissors and a red stamp.'],
    ['the_feed', 'm', 'c', 3.0, 'A screen-faced creature made of dozens of monitors showing faces, cables for legs.'],
    ['the_teleprompter', 'm', 't', 2.3, 'A gaunt figure with a teleprompter for a head, scrolling words in its glass and puppet strings.'],
    ['the_director', 'm', 't', 2.5, 'A director in a beret and long coat with a megaphone for a mouth and a camera viewfinder eye.'],
    ['engineer_okonkwo', 'n', 't', 1.8, 'A Network broadcast engineer in a white jumpsuit with a tool belt and a cut ID badge, determined face.'],
    ['lineman_lou', 'n', 't', 1.85, 'A mast lineman with a safety harness, climbing spikes and coils of cable.'],
    ['canteen_connie', 'n', 't', 1.65, 'A canteen cook in a hairnet with a tray of jelly and a cheerful scowl.'],
    ['fuse_room_fitz', 'n', 't', 1.75, 'An electrician armourer with fuses on a bandolier and a crackling wrench.'],
    ['uplink_ula', 'n', 't', 1.6, 'A small satellite-dish tinkerer with a dish on her back and wires in her hair.'],
    ['relay_ruth', 'n', 't', 1.7, 'A switchboard operator innkeeper with a headset and a board of plugs.'],
  ]],
  [17, "The Host's House", [
    ['fan_zealot', 'm', 't', 1.75, 'A fan club zealot in a T-shirt printed with the Host\'s face, homemade badges and a glowing devoted stare.'],
    ['host_clone', 'm', 't', 1.85, 'A stand-in in the Host\'s exact suit with a blank smooth face and a painted-on smile.'],
    ['mirror_self', 'm', 't', 1.8, 'A figure made of cracked mirror shards, reflecting whoever looks at it, edges like knives.'],
    ['fan_club_president', 'm', 't', 2.0, 'A fan club president in a cardigan covered in Host badges with a giant autograph book and a manic grin.'],
    ['the_stand_in', 'm', 't', 2.2, 'A towering stand-in in the Host\'s suit, face a blank mask with a hundred faint faces behind it.'],
    ['the_runner_up', 'm', 't', 2.1, 'A bitter runner-up contestant in a silver sash and faded glitter suit, a cracked second-place trophy.'],
    ['the_mother', 'm', 't', 2.3, 'A 1950s housewife giantess in a pearl necklace and apron, a perfect frozen smile and a rolling pin.'],
    ['the_host', 'm', 't', 2.0, 'The Host: an impossibly charming game-show host in a sparkling tuxedo with perfect hair and a microphone, eyes that never blink.'],
    ['the_milkman', 'n', 't', 1.8, 'A 1950s milkman in white with a crate of milk bottles and a too-friendly wave.'],
    ['miss_kindly', 'n', 't', 1.7, 'A 1950s schoolteacher in a pencil skirt and cardigan with a ruler and an apple.'],
    ['soda_jerk_sid', 'n', 't', 1.75, 'A soda jerk in a paper hat and bow tie with a milkshake glass and a scoop.'],
    ['hardware_hank', 'n', 't', 1.85, 'A hardware store owner in a brown coat with a hammer, a tape measure and a pencil behind his ear.'],
    ['pawn_paula', 'n', 't', 1.65, 'A pawnbroker in a cardigan with a jeweller\'s loupe and a tray of rings.'],
    ['diner_dolores', 'n', 't', 1.7, 'A diner waitress innkeeper with a coffee pot, a beehive hairdo and roller skates.'],
  ]],
  [18, 'The Floor That Does Not Exist', [
    ['maintainer', 'm', 't', 2.0, 'A faceless grey maintenance figure in a concrete-coloured jumpsuit with tool-hands, moving like a machine.'],
    ['echo', 'm', 't', 1.8, 'A translucent echo of a past contestant made of overlapping outlines, mouth open mid-scream.'],
    ['the_warden', 'm', 't', 3.0, 'A colossal concrete warden with a keyhole face, a ring of huge keys and brutalist armour.'],
    ['the_first_contestant', 'm', 't', 1.9, 'The first contestant ever: a starved figure in a rotted bathrobe and fuzzy slippers, a wristband glowing on bare bone.'],
    ['the_absence', 'g', 'c', 4.0, 'The Absence: a towering shape that is a hole in the world, outlined in ink, with stars inside and many faint hands at its edges.'],
  ]],
];
for (const [n, title, cast] of FLOORS) GROUPS.push([`Floor ${n}: ${title}`, cast]);
// the boss chambers' bosses (godot/data/chambers.json), two per floor
const CH = JSON.parse(fs.readFileSync(path.join(ROOT, 'godot', 'data', 'chambers.json'), 'utf8')).floors;
GROUPS.push(['Boss chambers: two bosses per floor, each with a grand entrance', Object.entries(CH).flatMap(([f, list]) => list.map((c) => [c.boss, 'm', 't', 2.6, c.look]))]);

const queue = [];
let md = '# Tripo: every remaining character (cast 3)\n\nThis is everything the game still needs. It covers:\n\n- the Undercity\'s missing townspeople\n- the new faction units\n- the rival contestants\n- the hidden-club regulars\n- the gods and their priests\n- Floors 10 to 18\n\nIt was built from `art/WORLD.md`.\n\n**Settings:** same as before (text tab, H3.1 Best Quality, 4K, PBR off, Triangle, 40,000).\n\n**Saving:** `art/incoming/<folder>/<folder>.glb`, then tell Claude "import the new ones". Heights come from `art/tripo_queue_3.json`, so you don\'t type them.\n\n**Creatures** (no T-pose) won\'t walk until they\'re rigged; they\'re marked with ⚠.\n\n';
let count = 0;
for (const [group, cast] of GROUPS) {
  md += `## ${group}\n\n`;
  for (const [folder, style, pose, height, desc] of cast) {
    count++;
    queue.push({ folder, prompt: `${STYLE[style]} ${desc} ${END[pose]}`, humanoid: pose === 't', height });
    md += `### ${count}. ${folder.replace(/_/g, ' ')}${pose === 'c' ? ' ⚠' : ''}\nfolder: ${folder} · height ${height} m\n\n${STYLE[style]} ${desc} ${END[pose]}\n\n`;
  }
}
md += `---\n\n**Total:** ${count} characters, about ${count * 50} credits.\n\n**Suggested order:**\n\n1. Floors 7–9 townspeople, so those floors are complete.\n2. Floors 10–18, floor by floor, so each new floor fills up at once.\n3. Rivals and club regulars.\n4. Gods and priests.\n`;
fs.writeFileSync(path.join(ROOT, 'art', 'TRIPO_CAST_3.md'), md);
fs.writeFileSync(path.join(ROOT, 'art', 'tripo_queue_3.json'), JSON.stringify(queue, null, 1));
console.log('characters', count);
