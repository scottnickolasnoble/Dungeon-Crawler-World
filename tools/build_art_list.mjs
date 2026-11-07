// The full character list for Tripo. Writes art/TRIPO_LIST.md and art/tripo_list.html.
//   node tools/build_art_list.mjs
// Type: H = humanoid (Mixamo can rig it), C = creature or odd shape (rigged in Tripo or Blender).
// new = no design exists in the prototype yet, so this is a proposal.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const STYLE = 'Full-body 3D game character, stylized comic book cartoon with believable proportions and a clear, readable, appealing face, hand-painted texture with bold black ink lines and cel-shaded colours.';
const H_END = 'Standing in a T-pose, arms straight out, facing forward, empty hands, no base.';
const C_END = 'One single character, neutral pose, facing forward, no ground, no base, no scenery.';
const NEGATIVE = 'photorealistic, horror gore, melted face, distorted face, extra limbs, pedestal, base, ground plane, multiple characters, blurry texture';

const GROUPS = [
  { id: 'npc-core', title: 'People you meet first', when: 'now', items: [
    ['Intern Pip', '0', 'H', 'A nervous, friendly young TV network intern: big anxious eyes, raised eyebrows, freckles, an awkward hopeful smile, messy hair. Slightly too large red polo shirt with a staff lanyard and ID badge, khaki trousers, worn sneakers, a pen tucked behind one ear. Skinny, slightly oversized head and hands.'],
    ['The Host', 'all', 'H', 'A dazzling game-show host with a huge fake white smile, perfectly sculpted brown TV hair, bright blue eyes, a sharp navy suit, red tie and a pocket square. Charming and slightly terrifying.'],
    ['Marta Vance', '1', 'H', 'A tough, weary Irish ex-nurse in her fifties who runs a survivor camp: kind, tired eyes, greying hair tied back, worn scrubs under a patched jacket, red-cross armband, medical satchel, stethoscope round her neck.'],
    ['Pickles', '1', 'H', 'A small, excitable rat-person junk dealer: rat snout, whiskers, big ears, one monocle, gap-toothed grin, patchwork waistcoat, and a towering backpack stacked with junk, pots, hubcaps and traffic cones.'],
    ['Spin Cycle', '2', 'H', 'A fast-talking TV stagehand turned trader: headset over one ear, crew lanyard, black crew T-shirt, tool belt, tired grin and a day-old beard, a heaving laundry sack over one shoulder.'],
    ['Old Reggie', '2', 'H', 'A very old survivor of eleven seasons: long white beard, kind crinkled eyes, threadbare cardigan, bent posture, a friendly pigeon sitting on his shoulder.'],
    ['Wickley', '3', 'C', 'A living candle-person chef: a stout body of cream wax with a carved friendly face, glowing eyes, stubby wax arms, a lit wick and flame on top of the head, wax drips, wearing an apron and a little chef neckerchief.'],
    ['Brother Ash', '3', 'C', 'A living candle-person scholar monk: tall thin grey wax body, carved thoughtful face, glowing eyes, a small steady flame on the wick, grey monk robe with rope belt and prayer beads.'],
    ['Judge Vrask', '3', 'H', 'A stern, imposing ogre-kin judge: heavy jaw, small lower tusks, half-moon spectacles, a battered black judicial robe and white collar, huge hands.'],
    ['Registrar Odessa', '3', 'H', 'An elegant, glowing pale-blue humanoid clerk: long pointed ears, calm patient eyes, soft inner glow, a long formal robe with gold trim and a quill behind one ear.'],
    ['Madame Prickle', '4', 'H', 'A grand, theatrical hedgehog-person auctioneer: hundreds of spines over her back and head, a feathered hat, pearl monocle, sharp amused eyes, an extravagant auctioneer gown.'],
    ['Sunny the Sponsor Rep', '4', 'H', 'A person in a corporate mascot costume with a giant yellow sun head with a fixed grin, and nothing visible inside the neck hole, cheap orange sponsor suit, big white gloves. Cheerful and quietly wrong.'],
    ['Big Deb', '5', 'H', 'A huge, friendly green-grey orc-like hardware seller woman: small tusks, big laugh lines, red bandana, plaid shirt with rolled sleeves, tool belt, a pencil behind her ear.'],
    ['Neighbourhood Watch', '5', 'H', 'A nosy suburban watch volunteer: narrowed suspicious eyes, thin moustache, beige windbreaker with WATCH on the back, binoculars and a whistle around the neck, flashlight on the belt. (Claude will make the other two council members by recolouring.)'],
    ['Gusset', '6', 'C', 'A gentle moth-person tailor: soft furred face, big dark gentle eyes, feathered antennae, dusty folded wings, a tape measure round the neck, a pincushion bracelet, a neat waistcoat.'],
    ['Elder Lantern', '6', 'C', 'An ancient blind moth-person elder: cloudy milky eyes, silver-white fur, tattered wings, feathered antennae drooping, long robes.'],
  ] },
  { id: 'npc-shops', title: 'Shopkeepers, innkeepers and guild masters', when: 'now', items: [
    ['Benchwright Bo', '1, 4, 5, 6', 'H', 'A massive, cheerful stone-skinned craftsman: grey cracked rock skin with glowing orange in the cracks, wide friendly face, flat nose, carpenter apron stuffed with tools. Bo runs every bench shop.'],
    ['Rusty Kell', '1', 'H', 'A grizzled weapons dealer with a rust-red beard, one squinting eye, scarred arms, a leather apron over a mechanic shirt.'],
    ['Dot', '1', 'H', 'A warm, tiny middle-aged diner owner with a big silver bun, round glasses, a stained pink apron and a huge smile.'],
    ['Barb the Innkeeper', '1', 'H', 'A broad, no-nonsense innkeeper woman with curly red hair, bags under her eyes, rolled sleeves, a tea towel over her shoulder.'],
    ['Bev', '2', 'H', 'A clever fox-person bench seller: orange fur, sharp friendly face, white muzzle, big fox ears, a blue work shirt and tool belt, and a bushy tail.'],
    ['Spool', '2', 'H', 'A wiry weapons dealer dressed in stitched-together laundry, with thread spools on a bandolier, a long thin face and a sly smile.'],
    ['Suds', '2', 'H', 'A round, jolly rat-person grocer with soap bubbles in his whiskers, a mop of a moustache and a blue laundrette smock.'],
    ['Rinse', '2', 'H', 'A permanently damp, droopy junk trader with wet hair over one eye, a dripping raincoat and a sad smile.'],
    ['Mangle the Innkeeper', '2', 'H', 'A huge ogre-kin innkeeper with flattened ears and a kind face, wearing a pressed white shirt with sharp creases and a tiny bow tie.'],
    ['Bix', '3', 'H', 'A short, sturdy stone-skinned bench seller with a chipped ear, goggles pushed up on the forehead and a leather apron.'],
    ['Cleaver Jo', '3', 'H', 'A broad butcher woman with massive forearms, a blood-spotted apron, a hairnet and a gold tooth in a wicked grin.'],
    ['Auntie Dumpling', '3', 'H', 'A plump, beaming grandmother cook with flour on her cheeks, rosy face, tight grey bun and a floral apron.'],
    ['Scraps', '3', 'H', 'A skinny, sneaky kitchen scavenger with a colander hat, a long nose and pockets overflowing with spoons.'],
    ['Gravy the Innkeeper', '3', 'H', 'A big, slow, friendly ogre-kin innkeeper with a soup-stained shirt and a wide gentle smile.'],
    ['Clearance Carl', '4', 'H', 'A desperate mall salesman with a huge fake grin, slicked hair, a loud yellow jacket covered in SALE stickers.'],
    ['Cinnamon Sue', '4', 'H', 'A cheerful mall pretzel-stand worker with a paper hat, freckles, a striped uniform and a sugar-dusted apron.'],
    ['Lost Receipts', '4', 'H', 'A shabby, nervous person wrapped in long curling till receipts like bandages, with thick glasses and a worried face.'],
    ['Mattress Mo', '4', 'H', 'A sleepy, overweight mattress-store owner in striped pyjamas and a dressing gown, half-closed eyes, slippers.'],
    ['Yard Sale Yolanda', '5', 'H', 'A sharp suburban mother in a pastel tracksuit and sun visor, sunglasses on her head, wearing a money belt.'],
    ['Lemonade Lee', '5', 'H', 'A cheerful teenage lemonade seller in a yellow T-shirt and shorts, with braces and a slightly too-wide smile.'],
    ['Curbside Cal', '5', 'H', 'A scruffy suburban dad in socks and sandals, stained polo shirt, cargo shorts and a baseball cap.'],
    ['Mrs Doily', '5', 'H', 'A prim elderly bed-and-breakfast owner with blue-rinse curls, cat-eye glasses, a lace collar and a pinched smile.'],
    ['Bark & Blade', '6', 'H', 'A tall lean forest weaponsmith with bark-like skin on the arms, a leaf-green tunic and a leather apron.'],
    ['Forager Fern', '6', 'H', 'A cheerful fox-person forager with ferns tucked in a wide hat, an orange fur face, a mossy cloak and a satchel.'],
    ['Twig', '6', 'H', 'A tiny frog-like bog person trader: big head, huge round eyes, wet green spotted skin, a coat stitched from leaves.'],
    ['Old Bramble', '6', 'H', 'An ancient, kindly innkeeper with a long white beard tangled with brambles and leaves, a patched green coat.'],
    ['Archmage Pell', '3+', 'H', 'A tall glowing pale-blue mage with pointed ears, a star-covered robe, a grand tall collar and a superior expression.'],
    ['Foreman Gruss', '3+', 'H', 'A wide stone-skinned union boss with a yellow hard hat, hi-vis vest, cracked grey skin and a chewed cigar.'],
    ['Supervisor Mox', '3+', 'H', 'A slim fox-person night shift boss, black uniform, tired yellow eyes, a security lanyard and a clipboard-carrying posture.'],
    ['Matron Hale', '3+', 'H', 'A stern, caring head nurse with grey hair in a tight bun, an old-fashioned white uniform and a watch pinned to her chest.'],
  ] },
  { id: 'npc-races', title: 'Townsfolk: one body per race', when: 'now', note: 'These fill the streets, homes and village shops. Claude will vary clothes, colours and hats so they do not look identical.', items: [
    ['Human townsperson', 'all', 'H', 'An ordinary tired survivor with a friendly normal face, messy hair, patched jacket, worn trousers and boots.'],
    ['Gutterkin townsperson', 'all', 'H', 'A short hunched rat-person with a rat snout, whiskers, round ears, long tail, grey-brown fur, in patched overalls.'],
    ['Stoneblood townsperson', 'all', 'H', 'A big broad rock-skinned person with grey cracked skin, orange glow in the cracks, a heavy jaw and simple work clothes.'],
    ['Fennix townsperson', 'all', 'H', 'A slim fox-person with orange fur, white muzzle, tall ears, a bushy tail, in a simple tunic and belt.'],
    ['Ogrekin townsperson', 'all', 'H', 'A very tall, heavy ogre-person with tan skin, small tusks, a big belly, huge hands and a friendly dim expression.'],
    ['Lumen townsperson', 'all', 'H', 'A slender person with pale-blue softly glowing skin, pointed ears, calm eyes, in flowing light robes.'],
    ['Bogling townsperson', 'all', 'H', 'A short, big-headed frog-person with wet green spotted skin, huge round eyes, a wide mouth and a leaf cloak.'],
    ['Clanker townsperson', 'all', 'H', 'A humanoid robot of old grey metal plates with a dented friendly face plate and teal glowing eyes.'],
    ['Grimhide townsperson', 'all', 'H', 'A tall muscular green-skinned orc-person with tusks, pointed ears, an underbite and sturdy leather clothes.'],
    ['Quillback townsperson', 'all', 'H', 'A short hedgehog-person with spines over the back and head, a small black nose, bright eyes and a neat waistcoat.'],
    ['Mothwing townsperson', 'all', 'C', 'A slim moth-person with soft fur, big dark eyes, feathered antennae and dusty folded wings, in a plain tunic.'],
  ] },
  { id: 'mob-1', title: 'Floors 1-3 monsters', when: 'now', items: [
    ['Traffic-Cone Goblin', '1-3', 'H', 'A scrawny, cocky green goblin with a big expressive face: large yellow eyes with clear pupils, long pointed ears, big hooked nose, wide toothy grin with an underbite. An orange and white traffic cone worn as a tilted helmet, a leather strap across a bare chest, a ragged brown loincloth, wiry arms, oversized hands and bare feet.'],
    ['Cone Captain', '1-3', 'H', 'A bigger, meaner goblin officer with two stacked traffic cones as a helmet, one yellow, a scowl, a scrap-metal chest plate and a hi-vis sash.'],
    ['Cardboard Goblin', '0', 'H', 'A training goblin made of flat cut-out cardboard, with a goofy goblin face drawn on in marker, visible tape and folded corners, and a little paper cone hat.'],
    ['Mop Wight', '1-3', 'C', 'An undead janitor with a cartoon skull face, a dropped jaw, glowing eyes in the sockets, ribs visible under a rotting work shirt with a name patch, and a lower body that is a mass of filthy mop strings instead of legs.'],
    ['Drain Lamprey', '1-3', 'C', 'A slimy eel monster rising upright, with a round sucker mouth ringed with hooked teeth, seven gill holes per side, small beady eyes and a dorsal fin ridge, dripping slime.'],
    ['Fluorescent Moth', '1-3', 'C', 'A dog-sized moth with a furred thorax, a segmented abdomen with a glowing tip, huge dark compound eyes, feathered antennae and wings spread with eyespots.'],
    ['Pigeon Ghoul', '1-3', 'C', 'A dog-sized undead pigeon with an iridescent neck, rotting bare patches, exposed ribs in the flank, a mad red eye and scaly feet.'],
    ['Vending Mimic', '1-3', 'C', 'A snack vending machine whose upper half has hinged open like a jaw: teeth along the seam, a wet tongue lolling over the coin tray, an eye peering from the coin slot, snack rows behind the glass.'],
  ] },
  { id: 'boss-1', title: 'Floors 1-3 bosses', when: 'now', items: [
    ['Sergeant Pylon', '1', 'H', 'A big, stocky, self-important goblin sergeant with a broad green face: heavy brow, small furious yellow eyes, huge jaw with jutting lower tusks, a bristling moustache, a whistle on a cord. Five traffic cones stacked as a tall helmet, the top one yellow. A battered hi-vis vest with sergeant chevrons over a barrel chest, torn work trousers and heavy boots.'],
    ['The Big Sucker', '1', 'C', 'An enormous bloated lamprey monster rising upright, with a vast round mouth of hooked teeth, sagging grey skin and tiny angry eyes.'],
    ['The Moth Matron', '1', 'C', 'A giant queenly moth with broad patterned wings, a fur ruff like a collar and a bright glowing abdomen.'],
    ['The Pigeon Elder', '1', 'C', 'A giant, ragged, bald-patched undead pigeon with a puffed chest and a wise, deranged red eye.'],
    ['The Lost & Found', '1', 'C', 'A towering heap of lost property fused into a creature, with suitcases, umbrellas, single shoes and teddy bears embedded all over it, and mismatched eyes peering out.'],
    ['Head Custodian Ebb', '2', 'C', 'A towering undead head janitor with a skull face, a huge keyring, a name badge, a punch-clock strapped to the back, and a skirt of filthy mop strings.'],
    ['The Machine That Ate Dave', '2', 'C', 'A huge vending machine monster with a gaping toothy mouth and a human arm in a wristwatch hanging from it.'],
    ['The Lint King', '2', 'C', 'A huge eel monster coated in thick grey dryer lint, with a crown made of lint traps and a round toothy mouth.'],
    ['The Bulb Queen', '3', 'C', 'A giant queen moth with a lampshade carapace over the thorax and a crown of glowing light bulbs on her head.'],
    ['Old Man Coo', '3', 'C', 'A huge ancient undead pigeon wearing a flat cap and a moth-eaten scarf, with a grumpy old-man expression.'],
    ['Grandma Gristle', '3', 'H', 'A monstrous giant hag grandmother with spectacles, knitting needles in a grey bun, a pearl necklace, a floral dress and apron, and a terrifyingly sweet smile.'],
    ['The Cone King', '3', 'H', 'A regal, huge goblin king with a crown made of a ring of small cones around a gold band, and a royal cape stitched from hi-vis and red velvet.'],
  ] },
  { id: 'mob-2', title: 'Floors 4-6 monsters', when: 'now', items: [
    ['Mall-Cop Ogre', '4-6', 'H', 'A huge mall security ogre with small tusks, a tiny peaked cap, a straining security shirt with a badge and a belt of gear, a dull officious face.'],
    ['Cul-de-Sac Hound', '4-6', 'C', 'A big feral suburban dog with a mangy coat, a collar and name tag, drooling jaws and wild eyes, on all fours.'],
    ['Gutter Hag', '4-6', 'H', 'A hunched witch with a long nose, stringy hair, a few blackened teeth, a shawl and long skirt, and a sly grandmotherly grin.'],
    ['Bounce-House Slime', '4-6', 'C', 'A wobbling translucent slime with a shoe, bones, coins and a traffic cone suspended inside it, and shreds of striped bounce-house vinyl stuck to its skin, with a goofy face.'],
    ['Lawn Gnome Cultist', '4-6', 'H', 'A cracked ceramic garden gnome with a pointed red hat and a white beard, painted-on eyes that glow faintly, and a sinister robe.'],
    ['Coupon Leech', '4-6', 'C', 'A fat segmented leech with coins stuck in its hide and paper coupons trailing from it, with a round toothy mouth.'],
    ['Tourist Hunter', '4-6', 'H', 'A smug safari hunter in pith helmet and khaki shooting jacket covered in badges, binoculars round the neck, a sunburnt nose and a thin moustache.'],
  ] },
  { id: 'boss-2', title: 'Floors 4-6 bosses', when: 'now', note: 'Thrones, altars and scenery around bosses are left out on purpose. Claude will build those in Blender.', items: [
    ['Captain Kevlar', '4', 'H', 'A colossal mall-cop ogre captain in riot armour with shoulder strobes in red and blue, a mirrored visor pushed up and a furious tusked face.'],
    ['The Final Notice', '4', 'C', 'A giant floating leech made of red-stamped overdue bills, with FINAL NOTICE printed along it and a round paper-toothed mouth.'],
    ['The Birthday Blob', '4', 'C', 'A massive pink frosted slime shaped like a birthday cake, with lit candles on top, balloons on strings, and a greedy childish face.'],
    ['The Food Court Kraken', '4', 'C', 'A huge kraken with tentacles of noodles and greasy skin, soda cups and food trays stuck to it, one wide hungry eye and a beak.'],
    ['The Mall Mother', '4', 'C', 'A colossal beating heart fused with mall parts, with escalators and neon shop signs growing from it and a calm motherly face in the middle.'],
    ['Officer Brick', '4', 'H', 'A giant square-jawed security guard whose body is literally built of bricks, wearing a tiny police cap.'],
    ['The Gnome Pope', '5', 'H', 'A giant ceramic gnome wearing a papal mitre over the pointed hat, ornate robes, a long white beard and a blessing, menacing smile.'],
    ['Mr. Fetch', '5', 'C', 'A monstrous pit-bull-sized giant dog with a spiked collar, huge shoulders and a playful, murderous grin.'],
    ['The HOA President', '5', 'H', 'A rigid, immaculate suburban woman three metres tall, with a helmet of blonde hair, pearls, a pastel suit and a horrified, judging smile.'],
    ['Mayor Eternal', '5', 'H', 'An ancient undead politician with a top hat, sash, gold chain of office, grey skin and a huge campaign smile.'],
    ['The Sprinkler Lord', '5', 'C', 'A towering figure wound from coils of green garden hose, with a brass rotary sprinkler head with a single glaring nozzle eye.'],
    ['Auntie Sludge', '6', 'H', 'A huge swamp hag with a bandolier of glowing ingredient jars and a crown of bent ladles, slimy green skin and a wide wicked grin.'],
    ['The Dog Park Matriarch', '6', 'C', 'An enormous scarred old wolfhound with a grey muzzle, a torn ear and a regal, terrifying stare.'],
    ['The Ice Cream Truck', '6', 'C', 'A living ice cream truck with headlight eyes, a grille of fangs, a serving-window mouth with a lolling tongue, giant cone horns and a speaker horn on the roof.'],
    ['Lord-Hunter Facet', '6', 'H', 'A tall, elegant, cruel glittering crystal-skinned big-game hunter in a fine red hunting coat and pith helmet, with a monocle.'],
    ['The Cul-de-Sac (one house)', '6', 'C', 'A living suburban house with two upper windows as angry eyes, a front door as a toothy mouth and roof tiles like hair. (Claude will join five of these into the street boss.)'],
  ] },
  { id: 'mob-3', title: 'Floors 7-9 monsters: The Undercity', when: 'later', items: [
    ['Sewer Wyrm', '7-9', 'C', 'A long, slick white sewer serpent with pale blind eyes and rows of needle teeth.'],
    ['Clockwork Debt Collector', '7-9', 'H', 'A spindly brass automaton with a barrel torso with an exposed clockwork window, a clock-face head with glowing hands and a stovepipe hat, steam vents, on digitigrade legs.'],
    ['Fungal Choir', '7-9', 'C', 'A cluster of three mushroom people joined at the base, each with a singing open mouth and two eye pits in the stalk, glowing spores.'],
    ['Tunnel Mole-Kin', '7-9', 'H', 'A stocky mole person with a long fleshy star-shaped snout, huge spade claws, tiny beady eyes and a mining helmet with a lamp.'],
    ['Grease Golem', '7-9', 'C', 'A hulking sagging figure of molten yellow-brown grease, with drips running off it, fries and bones floating inside, a fry basket fused in the chest and burning eyes.'],
    ['Ratking Choir', '7-9', 'C', 'A tangle of a dozen rats joined by a knot of tails, all squeaking in harmony with wide-open mouths.'],
    ['Cave Troll', '7-9', 'H', 'A huge lumpy grey cave troll with a heavy brow, a wide flat nose, long arms, a dim angry face and a rag around the waist.'],
  ] },
  { id: 'boss-3', title: 'Floors 7-9 bosses', when: 'later', items: [
    ['Old Lady Bathwater', '7', 'C', 'A massive pale sewer serpent wearing a floral shower cap and cat-eye glasses, with bath foam and a loofah stuck on it.'],
    ['The Landlord', '7', 'C', 'An apartment block for a torso with lit windows, walking on clockwork legs, with arms, a chimney stovepipe hat with smoke, and a RENT DUE sign.'],
    ['Pipe Organ Wyrm', '7', 'C', 'A serpent with a body of rings of brass organ pipes, and a head that is an organ console with a keyboard jaw, pipe teeth and stop-knob eyes.'],
    ['The Sanitation King', '7', 'C', 'A titan built of black garbage bags and bins, with a crown of trash-can lids, flies, and a garbage truck for a right fist.'],
    ['Repossessor Mk. IX', '8', 'C', 'A huge brass clockwork debt collector with four extra hooked arms, a tow winch and chain on its back and warning beacons.'],
    ['Chief Grubtooth', '8', 'H', 'A wide old mole-kin chief with a headdress of drill bits, a gem necklace, a huge drill gauntlet and a shrewd smile.'],
    ['Drill Prophet', '8', 'H', 'A robed, wild-eyed old mole-kin elder with a star snout and a prophet\'s beard, holding the pose of a preacher. (Claude will build the drill rig in Blender.)'],
    ['The Deep Fryer', '8', 'C', 'A grease golem whose lower half is an industrial fryer vat on burners, bubbling, with a greasy molten upper body.'],
    ['The Fryer Baron', '8', 'H', 'An obese aristocrat made of breaded fried crust, in a greasy top hat and golden waistcoat, with a monocle and a pompous sneer.'],
    ['Big Momma Mold', '8', 'C', 'A huge fungal mother figure of soft spotted mold, with a kind face, many small mushrooms growing from her and glowing spores.'],
    ['The Soloist', '9', 'C', 'One enormous diva mushroom with her mouth wide open in song, a spore microphone and a dramatic frilled cap.'],
    ['The Rat Throne King', '9', 'H', 'A rat king in a tiny golden crown and ragged royal robes, with a grand, paranoid expression. (Claude will build the throne of rats in Blender.)'],
    ['The Rat Senate Speaker', '9', 'H', 'A huge rat in a purple toga with a laurel wreath and a pompous face.'],
    ['Lockjaw', '9', 'C', 'A living bank vault: a steel block on stubby legs, a round vault door hanging open like a jaw, gold teeth, a tongue of gold coins, and combination-dial eyes.'],
    ['The Undermayor', '9', 'H', 'A gaunt pale ruler of the sewers with a tall hat, a lantern-lit face, a long cloak trailing with rats and a thin smile.'],
  ] },
  { id: 'mob-4', title: 'Floors 10-12 monsters: The Spectacle', when: 'later', items: [
    ['Gladiator Bot', '10-12', 'H', 'A heavy armoured arena robot with a gladiator helmet with a slit visor and fan crest, a crowd-meter on the chest and sponsor decals.'],
    ['Stage-Fright Phantom', '10-12', 'C', 'A tall hollow shroud that tears into tendrils, with bony beckoning hands and a porcelain theatre mask, half weeping and half grinning.'],
    ['Commercial Break Imp', '10-12', 'H', 'A small red imp with a CRT television for a head showing colour bars and a grin.'],
    ['Hype Beast', '10-12', 'C', 'A huge shaggy beast with curling ram horns, an LED collar, a chain and medallion and a giant foam finger, howling with joy.'],
    ['Confetti Elemental', '10-12', 'C', 'A humanoid vortex of foil confetti and curling streamers, with a narrow waist and broad shoulders, a faceted glowing glitter heart and two burning eyes.'],
  ] },
  { id: 'boss-4', title: 'Floors 10-12 bosses', when: 'later', items: [
    ['Ulti-Max', '10', 'H', 'A towering champion gladiator robot of polished armour plates, with blade arms, a glowing chest core, a visor and an arrogant stance.'],
    ['The Understudy', '10', 'C', 'A giant phantom in a tattered red stage curtain with a cracked comedy mask, always rehearsing.', 'new'],
    ['Sir Skip-Ad', '11', 'H', 'A big imp knight with a flat-screen TV head showing a SKIP AD button, and armour covered in sponsor logos.', 'new'],
    ['The Hype Man', '11', 'C', 'A gigantic beast with a foam-finger crown, speakers on its shoulders, a gold chain and a screaming grin.', 'new'],
    ['Grand Finale', '12', 'C', 'A vast figure of fireworks and confetti, with a ringmaster hat floating above two burning eyes.', 'new'],
    ['The Showrunner', '12', 'H', 'A manic TV executive in a white suit and headset, with too many clipboards, a huge grin and hollow eyes.', 'new'],
  ] },
  { id: 'mob-5', title: 'Floors 13-15 monsters: The Deep Archive', when: 'later', items: [
    ['Librarian Lich', '13-15', 'H', 'A skeletal librarian in a long dusty robe, with half-moon reading glasses and cold blue pinprick eyes, a cardigan and a chained book at the waist.'],
    ['Index Spider', '13-15', 'C', 'A glossy black spider with eight shiny eyes, and paper index cards and strips stuck to its legs and abdomen.'],
    ['Redacted Thing', '13-15', 'C', 'A wrong-looking humanoid with blocky black slabs jutting from it at odd angles, black redaction bars floating around it and a single white eye.'],
    ['Paper Golem', '13-15', 'C', 'A hulking golem of stacked books and crumpled paper, with bricks of books along the limbs and an origami-crane head with ink-drop eyes.'],
    ['Overdue Revenant', '13-15', 'C', 'A pale ghost fading below the waist, wrapped in iron chains ending in heavy books, a red-stamped due-date card hanging from the neck.'],
  ] },
  { id: 'boss-5', title: 'Floors 13-15 bosses', when: 'later', items: [
    ['Head Archivist Vellum', '13', 'H', 'A towering lich in tall scholar\'s robes and an academic cap, with parchment skin and many pairs of glasses.', 'new'],
    ['The Card Catalogue', '13', 'C', 'A spider whose body is a huge wooden card-catalogue cabinet with drawers sliding open, and eight long legs.', 'new'],
    ['[NAME WITHHELD]', '14', 'C', 'A giant figure entirely covered in black redaction bars, with only a smiling mouth left uncensored.', 'new'],
    ['The Papier-Mache Titan', '14', 'C', 'A giant lumpy figure of glued newspaper with headlines across its skin and a kindly painted face.', 'new'],
    ['The Long Overdue', '15', 'C', 'A huge spectral librarian ghost with a giant date stamp for one hand and chains of books.', 'new'],
    ['The Editor-in-Chief', '15', 'H', 'A severe giant woman in a sharp grey suit, with red ink dripping from her fingers, half-moon glasses and a merciless stare.', 'new'],
  ] },
  { id: 'mob-6', title: 'Floors 16-18 monsters: The Network Core', when: 'later', items: [
    ['Ratings Wraith', '16-18', 'H', 'A mirror-black human figure with live ratings numbers and graphs scrolling across its glossy skin.'],
    ['Censor Seraph', '16-18', 'C', 'A many-eyed angel whose wings are layered black redaction bars, with a halo flashing BLEEP.'],
    ['Producer Drone', '16-18', 'C', 'A camera drone with a lens eye, four rotors, a red REC light and a clipboard arm.'],
    ['Algorithm Hydra', '16-18', 'C', 'Five serpent necks of braided cable rising from a server rack, each head a different screen-faced predator.'],
    ['Executive Shade', '16-18', 'H', 'A faceless silhouette in a perfect suit, with a void for a head, a ribbon of gold for a tie and a pen dripping ink.'],
  ] },
  { id: 'boss-6', title: 'Floors 16-18 bosses', when: 'later', items: [
    ['The Number One', '16', 'H', 'A towering mirror-chrome figure wearing a winner\'s sash and crown, with a face that is a blank reflective smile.', 'new'],
    ['Standards & Practices', '16', 'C', 'A vast seraph of black bars and hundreds of eyes, holding a giant red BLEEP button.', 'new'],
    ['The Director\'s Cut', '17', 'C', 'A huge flying camera crane drone with a director\'s beret, a megaphone and a megaton lens eye.', 'new'],
    ['The Recommended', '17', 'C', 'A nine-headed hydra of cables with thumbs-up icons on each screen face, smiling.', 'new'],
    ['The Chairman', '18', 'H', 'A giant faceless executive shadow in a perfect pinstripe suit, seated posture, with a gold pen.', 'new'],
    ['The Network', '18', 'C', 'The final boss: a colossal figure of screens, cables and cameras with the Host\'s huge smiling face on the central screen.', 'new'],
  ] },
  { id: 'npc-deep', title: 'NPCs for Floors 7-18', when: 'later', note: 'The prototype has no NPCs past Floor 6, so these twelve are proposals. Change any you like.', items: [
    ['Nan Gangway', '7', 'H', 'A cheerful old ferrywoman in oilskins and a sou\'wester hat, with a weathered face and a pipe.', 'new'],
    ['Foreman Tuck', '8', 'H', 'A friendly mole-kin trader with a star snout, a hard hat and a ledger-stuffed apron.', 'new'],
    ['Sister Verdigris', '9', 'C', 'A gentle mushroom nun with a soft spotted cap for a habit, a kind face and a rosary of spores.', 'new'],
    ['Cue-Card Cal', '10', 'H', 'A jittery stagehand in black with a huge smile, a headset and stacks of cue cards under one arm.', 'new'],
    ['Madame Encore', '11', 'H', 'A faded stage star in a tattered sequin gown and feather boa, with huge lashes and a brave smile.', 'new'],
    ['Gaffer Tape', '12', 'H', 'A little clanker robot wrapped in silver tape, with a friendly dented face and a tool belt.', 'new'],
    ['Archivist Quire', '13', 'H', 'A pale-blue glowing clerk in a paper-layered robe, with ink-stained fingers and round glasses.', 'new'],
    ['Stamp', '14', 'H', 'A small green goblin clerk in a tiny tie and visor, delighted by paperwork.', 'new'],
    ['Dust', '15', 'H', 'A very old rat-person reader with thick spectacles, a long grey cardigan and a kindly squint.', 'new'],
    ['Janitor Sol', '16', 'H', 'An ancient clanker janitor robot with rust patches, a mop-shaped arm and a calm old face plate.', 'new'],
    ['Intern Zero', '17', 'H', 'The first ever intern, now a hollow-eyed elderly person still wearing a faded lanyard and a too-large polo shirt.', 'new'],
    ['Gloria from HR', '18', 'H', 'A relentlessly pleasant office woman with a beige cardigan, a lanyard, a tight smile and dead eyes.', 'new'],
  ] },
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const groups = GROUPS.map((g) => ({ ...g, items: g.items.map(([name, floors, type, desc, flag]) => ({ name, floors, type, isNew: flag === 'new', folder: slug(name), desc, prompt: `${STYLE} ${desc} ${type === 'H' ? H_END : C_END}` })) }));
const all = groups.flatMap((g) => g.items);
const now = groups.filter((g) => g.when === 'now').flatMap((g) => g.items);
const counts = { total: all.length, now: now.length, later: all.length - now.length, proposed: all.filter((i) => i.isNew).length, humanoid: all.filter((i) => i.type === 'H').length };
console.log(counts);

let md = `# Tripo list: every character for all 18 floors\n\n${counts.total} models: ${counts.now} for the floors built so far, ${counts.later} for Floors 7-18. ${counts.proposed} are proposals (marked NEW) because the prototype has no design for them.\n\nNegative prompt for all: \`${NEGATIVE}\`\n\nSave each one in \`art/incoming/<folder>/\` as .glb, plus .fbx for humanoids.\n`;
for (const g of groups) { md += `\n## ${g.title} (${g.items.length})\n${g.note ? g.note + '\n' : ''}`; for (const i of g.items) md += `\n### ${i.name}${i.isNew ? ' (NEW)' : ''}\nFloor ${i.floors} · ${i.type === 'H' ? 'Humanoid: Mixamo' : 'Creature: no Mixamo'} · folder \`${i.folder}\`\n\n\`\`\`\n${i.prompt}\n\`\`\`\n`; }
fs.writeFileSync(path.join(ROOT, 'art', 'TRIPO_LIST.md'), md);

const html = `<title>Downstairs Casting Sheet</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bangers&family=Atkinson+Hyperlegible:wght@400;700&display=swap">
<style>
/* Layout: a production call sheet, one long list, with a sticky tally and filters */
:root{--paper:#efe2c0;--card:#f8f0da;--ink:#16121a;--soft:#5d5140;--line:#16121a;--mustard:#d9a520;--teal:#1f5f5b;--red:#b4282a;--on-dark:#fff8e6;--done:#d9d0ae;--display:'Bangers','Impact',sans-serif;--body:'Atkinson Hyperlegible',system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#1a1619;--card:#272126;--ink:#f3e8cc;--soft:#b5a78a;--line:#f3e8cc;--mustard:#e8b82e;--teal:#5ab8ac;--red:#ef6a5a;--on-dark:#1a1619;--done:#201c1e;color-scheme:dark}}
:root[data-theme="dark"]{--paper:#1a1619;--card:#272126;--ink:#f3e8cc;--soft:#b5a78a;--line:#f3e8cc;--mustard:#e8b82e;--teal:#5ab8ac;--red:#ef6a5a;--on-dark:#1a1619;--done:#201c1e;color-scheme:dark}
body{background:var(--paper);color:var(--ink);font:16px/1.45 var(--body)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--paper)}
.wrap{max-width:860px;margin:auto;padding-block:20px 60px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
h1{font:400 clamp(44px,10vw,76px)/.95 var(--display);letter-spacing:.02em;margin:0;transform:skewX(-4deg);transform-origin:left}
.lede{max-width:62ch;margin:10px 0 0}
.steps{margin:16px 0 0;padding:14px 16px;border:3px solid var(--line);background:var(--card);box-shadow:5px 5px 0 var(--line)}
.steps h2{font:400 26px/1 var(--display);letter-spacing:.03em;margin:0 0 8px}
.steps ol{margin:0;padding-left:22px;display:grid;gap:6px}
.neg{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px;font-size:14px;color:var(--soft)}
.bar{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--paper);padding-block:10px;margin-top:18px;border-bottom:3px solid var(--line);display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}
.tally{font:400 24px/1 var(--display);letter-spacing:.03em;font-variant-numeric:tabular-nums;margin-right:auto}
.filter,.copy{font:700 14px var(--body);border:2px solid var(--line);background:var(--card);color:var(--ink);padding:7px 11px;cursor:pointer;min-height:38px}
.filter[aria-pressed="true"]{background:var(--ink);color:var(--paper)}
.copy{background:var(--mustard);color:#16121a}
.copy.ok{background:var(--teal);color:var(--on-dark)}
button:focus-visible,input:focus-visible{outline:3px solid var(--red);outline-offset:2px}
section h2{font:400 32px/1.05 var(--display);letter-spacing:.03em;margin:30px 0 4px;text-wrap:balance}
.note{margin:0 0 6px;color:var(--soft);max-width:65ch}
.item{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:4px 10px;align-items:start;padding:12px 0;border-bottom:2px solid color-mix(in srgb,var(--line) 25%,transparent)}
.item input{width:24px;height:24px;margin:2px 0 0;accent-color:var(--teal)}
.item label{font-weight:700;font-size:18px;cursor:pointer}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:3px 0 5px;font-size:12.5px}
.chip{border:1.5px solid var(--soft);color:var(--soft);padding:1px 7px}
.chip.c{border-color:var(--teal);color:var(--teal)}
.chip.n{border-color:var(--red);color:var(--red);font-weight:700}
.desc{margin:0;font-size:15px;max-width:65ch}
.folder{font-size:13px;color:var(--soft);overflow-wrap:anywhere}
.item.done label{text-decoration:line-through}
.item.done .desc,.item.done .chips,.item.done .folder{opacity:.5}
@media (max-width:520px){.item{grid-template-columns:30px minmax(0,1fr)}.copy.one{grid-column:2;justify-self:start;margin-top:6px}}
</style>
<div class="wrap">
<h1>Downstairs Casting Sheet</h1>
<p class="lede">Every monster, boss and NPC for all 18 floors: <b>${counts.total} models</b>. ${counts.now} belong on the floors already built, and ${counts.later} are for Floors 7 to 18.</p>
<div class="steps"><h2>How to do it in one go</h2><ol>
<li><b>Make the first three, then stop.</b> Traffic-Cone Goblin, Intern Pip and Sergeant Pylon. Tell Claude, so the look and the credit cost get checked before you spend on the rest.</li>
<li>For each one, tap <b>Copy prompt</b>, paste it into Tripo, and use text to model at the highest texture quality, with T-pose on if it's offered.</li>
<li>Download as <b>.glb</b>. For anything marked Humanoid, also get <b>.fbx</b>, because Mixamo needs it.</li>
<li>Save to <b>art/incoming/</b> in a folder with the name shown, then tick it off. Your ticks stay on this device.</li>
</ol>
<div class="neg"><span>If Tripo has a negative prompt field, use this for all of them:</span><button class="copy" id="neg">Copy negative prompt</button></div></div>
<div class="bar"><div class="tally" id="tally"></div>
<button class="filter" data-f="all" aria-pressed="true">All</button><button class="filter" data-f="now" aria-pressed="false">Built floors first</button><button class="filter" data-f="todo" aria-pressed="false">Still to do</button></div>
<div id="list"></div>
</div>
<script>
const NEG=${JSON.stringify(NEGATIVE)};
const G=${JSON.stringify(groups.map((g) => ({ id: g.id, title: g.title, when: g.when, note: g.note, items: g.items })))};
const KEY='downstairs-casting';let done={},filter='all';
try{done=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(done))}catch(e){}};
const esc=(s)=>s.replace(/[&<>"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function copy(text,btn,label){const ok=()=>{btn.textContent='Copied';btn.classList.add('ok');setTimeout(()=>{btn.textContent=label;btn.classList.remove('ok')},1400)};
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(ok).catch(()=>fallback(text,ok))}else fallback(text,ok)}
function fallback(text,ok){const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();let good=false;try{good=document.execCommand('copy')}catch(e){}t.remove();if(good)ok()}
function draw(){const list=document.getElementById('list');let html='';let n=0,d=0;
 for(const g of G){for(const i of g.items){n++;if(done[i.folder])d++}
  const items=g.items.filter(i=>(filter==='now'?g.when==='now':true)&&(filter==='todo'?!done[i.folder]:true));if(!items.length)continue;
  html+='<section><h2>'+esc(g.title)+' ('+g.items.length+')</h2>'+(g.note?'<p class="note">'+esc(g.note)+'</p>':'');
  for(const i of items){const id='c-'+i.folder;html+='<div class="item'+(done[i.folder]?' done':'')+'"><input type="checkbox" id="'+id+'" data-k="'+i.folder+'"'+(done[i.folder]?' checked':'')+'><div><label for="'+id+'">'+esc(i.name)+'</label><div class="chips"><span class="chip">Floor '+esc(i.floors)+'</span><span class="chip'+(i.type==='H'?'':' c')+'">'+(i.type==='H'?'Humanoid: .glb + .fbx':'Creature: .glb')+'</span>'+(i.isNew?'<span class="chip n">New design</span>':'')+'</div><p class="desc">'+esc(i.desc)+'</p><div class="folder">Folder: art/incoming/'+esc(i.folder)+'/</div></div><button class="copy one" data-p="'+i.folder+'">Copy prompt</button></div>'}
  html+='</section>'}
 list.innerHTML=html;document.getElementById('tally').textContent=d+' of '+n+' done'}
const byFolder={};G.forEach(g=>g.items.forEach(i=>byFolder[i.folder]=i));
document.getElementById('list').addEventListener('click',e=>{const b=e.target.closest('button.copy');if(b)copy(byFolder[b.dataset.p].prompt,b,'Copy prompt')});
document.getElementById('list').addEventListener('change',e=>{if(e.target.dataset.k){done[e.target.dataset.k]=e.target.checked;save();draw()}});
document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.f;document.querySelectorAll('.filter').forEach(x=>x.setAttribute('aria-pressed',x===b));draw()}));
document.getElementById('neg').addEventListener('click',e=>copy(NEG,e.target,'Copy negative prompt'));
draw();
</script>
`;
fs.writeFileSync(path.join(ROOT, 'art', 'tripo_list.html'), html);
