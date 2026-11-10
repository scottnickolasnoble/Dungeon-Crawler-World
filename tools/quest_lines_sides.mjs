// Side quests for every floor (the proposals on the cut sheets). They're pinned to the hub's notice board.
const go = (at, label) => ({ t: 'go', at, label });
const find = (at, say, label, text, extra = {}) => ({ t: 'find', at, say, label, ...(text ? { text } : {}), ...extra });
const kill = (family, n, label) => ({ t: 'kill', ...(family ? { family } : {}), n, label });
const boss = (kind, label) => ({ t: 'boss', kind, label });
const S = (name, desc, steps, f, extra = {}) => ({ name, desc, board: true, steps, reward: { xp: 180 + f * 110, gold: 50 + f * 30, ...extra } });

export const SIDES = {
  1: {
    f1_finders: S('Finders Keepers', 'The Vasquez Twins "found" some contestants\' Welcome Box loot. Get it back.', [
      go('point:crew:The Scavengers', 'Find the Scavengers\' camp'), find('point:crew:The Scavengers', 'take back the stolen kit', 'Take the kit back', 'One of the twins grins: "We\'ll owe you one. Maybe."')], 1),
    f1_pigeons: S('The Pigeon Problem', 'The Pigeon Loft\'s birds have been stealing food from the camp.', [kill('pigeon', 10, 'Clear 10 Pigeon Ghouls'), boss('pigeonElder', 'Deal with the Pigeon Elder')], 1),
  },
  2: {
    f2_dave: S('The Machine That Ate Dave', 'Spin Cycle says Dave\'s been eaten again. Nobody is worried, because it keeps happening.', [
      go('camp:The Machine Graveyard', 'Find the Machine Graveyard'), boss('dave', 'Open up the machine'),
      find('camp:The Machine Graveyard', 'help Dave out', 'Help Dave climb out', '"Oh. You\'re new." He brushes himself off. "Don\'t trust the dryers."')], 2),
    f2_lint: S('Lint Rights', 'The Lint King says every bit of lint on the floor is his.', [go('camp:The Lint Traps', 'Visit the Lint Traps'), boss('lintKing', 'Settle it with the Lint King')], 2),
    f2_sheets: S('Shapes Behind the Sheets', 'Most of the shapes in the drying yards are laundry.', [
      find('point:sight:Mop Graves', 'look behind the sheets', 'Look behind the sheets near the Mop Graves'), kill('wight', 6, 'Deal with the ones that aren\'t laundry: 6 wights')], 2, { flags: ['lore_sheets'] }),
  },
  3: {
    f3_broth: S('The First Broth', 'Both feuding soups come from one recipe gone wrong. The recipe was carved on tablets.', [
      find('landmark:Scratch Marks', 'copy the tablet', 'Find a recipe tablet at the Scratch Marks'), find('point:sight:Stewpot', 'copy the tablet', 'Find a recipe tablet at the Stewpot'),
      find('point:hideout', 'copy the tablet', 'Find a recipe tablet at the Survivor Hideout'),
      find('landmark:Auntie Brine\'s Pot', 'cook the First Broth', 'Cook the First Broth', 'It isn\'t soup. It moves. It was never food: it was used to make life.')], 3),
    f3_sideways: S('Sideways', 'Old Man Coo says contestants used to go sideways, not down. There\'s a sealed hatch at the top of the city.', [
      go('point:summit', 'Climb the hill above Soup Row'), find('point:summit', 'look for the hatch', 'Find the sealed hatch', 'A hatch with the Builders\' mark, welded shut from this side.')], 3),
  },
  4: {
    f4_timmy: S('Finders, Keepers', 'Timmy, the lost child, is hiding from the Mall. He\'s been seen near the Changing Rooms.', [
      find('point:wreck', 'search the kiosk', 'Search the wrecked kiosk'), find('point:hideout', 'ask at the hideout', 'Ask at the Survivor Hideout', 'Timmy\'s here. He\'s been here six seasons.')], 4),
    f4_notice: S('Final Notice', 'The Coupon Den\'s coupons are debts, and one of them is yours.', [go('camp:The Coupon Den', 'Find the Coupon Den'), kill('leech', 8, 'Burn 8 Coupon Leeches'), boss('notice', 'Tear up the Final Notice')], 4),
    f4_party: S('Birthday Party', 'The Bounce Castle is having a party. It has been having it for nine years.', [go('camp:The Bounce Castle', 'Go to the party'), boss('blob', 'Pop the Birthday Blob')], 4),
  },
  5: {
    f5_hendersons: S('The Hendersons', 'The same family waves from every yard on the street.', [
      go('point:summit', 'Watch the street from the hill'), find('point:cache', 'look inside the last house', 'Find the Hendersons\' real house', 'Photos on the wall: the Hendersons as contestants, three seasons ago. They settled down.')], 5),
    f5_gnomes: S('Gnome Rights', 'The garden gnomes want out of the gardens.', [find('point:sight:Gnome Circle', 'break the gnome circle', 'Break the Gnome Circle'), kill('gnome', 8, 'Free (or smash) 8 gnomes')], 5),
    f5_mayor: S('Re-Elect Nobody', 'Mayor Eternal has won every election since the Stack began.', [go('camp:Town Hall', 'Visit Town Hall'), boss('mayor', 'Challenge Mayor Eternal')], 5, { flags: ['lore_mayor'] }),
  },
  6: {
    f6_bridges: S('Rope Bridges', 'Tank, a huge contestant who\'s terrified of heights, is stuck halfway across the canopy.', [
      go('point:tower', 'Find Tank at the Hunters\' Hide'), find('point:tower', 'talk Tank across', 'Get Tank across the bridges', '"I\'ve got you." He doesn\'t let go of your arm for a full minute.')], 6, { flags: ['tank_saved'] }),
    f6_sludge: S('Hag Hollow', 'Auntie Sludge sells scent masks. Her price is your company, forever.', [go('camp:Hag Hollow', 'Visit Hag Hollow'), boss('sludge', 'Get out of Auntie Sludge\'s deal')], 6),
    f6_roots: S('Under the Roots', 'The Tallest Tree\'s roots go somewhere that isn\'t down.', [
      go('landmark:The Tallest Tree', 'Go to the Tallest Tree'), find('landmark:The Tallest Tree', 'feel along the roots', 'Find the sealed root door', 'A door in the roots with a cone-shaped keyhole. Pickles\' key would fit.')], 6),
  },
  7: {
    f7_ferry: S('The Free Ferry', 'Nan Gangway has ferried people for free for three seasons. Something keeps attacking the ferry.', [kill('wyrm', 10, 'Guard the ferry: 10 Sewer Wyrms')], 7),
    f7_bath: S('Bathwater', 'Old Lady Bathwater\'s baths never drain.', [go('camp:Bathwater Baths', 'Go to the Baths'), boss('bathwater', 'Pull the plug on Old Lady Bathwater')], 7),
    f7_organ: S('The Organ Loft', 'The Pipe Organ Wyrm only sleeps when the right tune is played.', [find('point:grand', 'take the sheet music', 'Find the sheet music in the Drowned Cathedral'), go('camp:The Organ Loft', 'Bring it to the Organ Loft'), boss('organ', 'Play the tune, or fight')], 7),
    f7_outfall: S('Down the Drain', 'A priest of Old Damp preaches at the Great Outfall. His congregation is mostly drowned.', [go('camp:The Great Outfall', 'Go to the Great Outfall'), boss('outfall', 'Face the Outfall Bishop')], 7),
  },
  8: {
    f8_pocket: S('Pocket', 'A tiny, cheerful contestant called Pocket is being eaten by mould somewhere near the Nursery.', [
      find('point:nest', 'pull Pocket out of the spores', 'Find Pocket in the spores', '"Hi! I\'m mostly fine!" She is not mostly fine.'), go('point:hideout', 'Carry her to the Survivor Hideout')], 8, { flags: ['pocket_saved'] }),
    f8_repo: S('Repo Day', 'Repossessor Mk. IX is repossessing contestants\' gear.', [go('camp:The Repo Yard', 'Go to the Repo Yard'), boss('repo', 'Repossess the Repossessor')], 8),
    f8_canary: S('Canary\'s Song', 'A canary in the Shaft sings the same five notes over and over.', [find('point:shrine', 'listen to the canary', 'Learn the canary\'s song', 'Five notes. Someone tells you it\'s a password, for a door you haven\'t found.')], 8, { flags: ['canary_song'] }),
  },
  9: {
    f9_lantern: S('What Burns', 'Something alive burns in the Founders Lantern.', [go('landmark:The Founders Lantern', 'Climb to the Lantern'), find('landmark:The Founders Lantern', 'look into the flame', 'Look inside', 'A Builder relic, still alive, burning so the city has light.')], 9, { flags: ['lore_lantern'] }),
    f9_mags: S('Mags\' Old Crew', 'Mags\' old crew has been in the Vault for decades.', [go('camp:The Vault', 'Case the Vault'), find('camp:The Vault', 'open the deposit boxes', 'Break them out')], 9, { flags: ['mags_crew'] }),
  },
  10: {
    f10_dex: S('Dex\'s Episode', 'Dex is shooting his episode next to yours and needs a villain.', [go('point:crew:Team Dex', 'Find Team Dex'), kill('the_extras', 10, 'Steal his scene: 10 Extras')], 10),
    f10_glutton: S('Catering', 'The Craft Services Glutton has eaten the crew\'s lunch, and the crew.', [go('camp:Catering', 'Visit Catering'), boss('craft_services_glutton', 'Stop the Glutton')], 10),
    f10_manager: S('Places, Please', 'The Floor Manager wants everyone in position, permanently.', [go('camp:Sound Stage 4', 'Go to Sound Stage 4'), boss('floor_manager', 'Beat the Floor Manager')], 10),
  },
  11: {
    f11_jojo: S('Halftime', 'Jojo Spark is booked as the Halftime Show. Encore wants her for good.', [go('landmark:The Halftime Stage', 'Get to the Halftime Stage'), find('landmark:The Halftime Stage', 'talk Jojo down', 'Talk Jojo off the stage', '"They\'d have loved it," she says. "They\'d have loved me." She comes with you anyway.')], 11, { flags: ['jojo_saved'] }),
    f11_trophy: S('The Trophy Cabinet', 'Every past winner\'s trophy is in the cabinet. One is missing.', [find('landmark:The Trophy Cabinet', 'check the empty plinth', 'Look at the empty plinth', 'The label reads SEASON ONE. The trophy is on Floor 17.')], 11),
  },
  12: {
    f12_canned: S('Canned', 'Every laugh in the Laugh Track Factory is a contestant.', [kill('laugher', 12, 'Shut down 12 Laughers')], 12),
    f12_ghost: S('The Ghostwriter', 'The Writers\' Pit has your ending already written.', [find('point:hideout', 'steal the script pages', 'Steal the script', 'The last page has three endings. Two are crossed out.')], 12),
  },
  13: {
    f13_overdue: S('Overdue', 'Everything returned down the chute comes back wrong.', [go('camp:The Returns Chute', 'Go to the Returns Chute'), boss('overdue', 'Settle the fines with Overdue')], 13),
    f13_bindery: S('The Bindery', 'The Bindery Foreman binds anything. Anyone.', [go('camp:The Bindery', 'Go to the Bindery'), boss('bindery_foreman', 'Unbind the Foreman')], 13),
    f13_reading: S('Silence', 'The Head Librarian\'s Reading Room has a strict silence rule. Breaking it is fatal.', [go('camp:The Reading Room', 'Enter the Reading Room'), boss('head_librarian', 'Out-shush the Head Librarian')], 13),
  },
  14: {
    f14_portrait: S('Marta\'s Portrait', 'The portrait gallery has a painting of a maid from Season Nine. She looks like Marta.', [
      find('point:grand', 'take down the portrait', 'Find the portrait', 'Marta, decades younger, in a maid\'s uniform. Signed "Season 9".')], 14, { flags: ['marta_portrait'] }),
    f14_graves: S('Headstones', 'The graveyard is full of past contestants.', [find('camp:The Graveyard', 'read the headstones', 'Read the headstones', 'Names, seasons and the floor they died on. You recognise some from the Floor 1 shrine.')], 14),
  },
  15: {
    f15_rattle: S('Rattle Remembers', 'Rattle, the robot contestant, doesn\'t remember being human.', [find('camp:The Tape Library', 'find Rattle\'s backup', 'Find Rattle\'s backup tape', 'Season 4. A woman\'s voice. "If anyone finds this, my name was..." The rest is static.')], 15, { flags: ['rattle_remembers'] }),
    f15_switch: S('The Big Red Switch', 'Don\'t.', [find('landmark:The Big Red Switch', 'press the switch', 'Press it', 'Every light on the floor goes out. A voice: "Why would you do that." Every monster on the floor now knows where you are.')], 15),
    f15_cable: S('Cable Mother', 'The Cable Mother is strangling the Warm Room\'s power line.', [go('camp:The Cable Jungle', 'Go to the Cable Jungle'), boss('cable_mother', 'Cut the Cable Mother loose')], 15),
  },
  16: {
    f16_dex: S('Dex\'s Choice', 'Dex has found out what fans are.', [go('point:crew:Team Dex', 'Find Dex'), find('point:crew:Team Dex', 'tell Dex the truth', 'Tell him the truth', 'He goes very quiet. "So every one of them..." He turns off his camera.')], 16, { flags: ['dex_told'] }),
    f16_feed: S('Ratings', 'Your number, live, in the Ratings Room.', [go('camp:The Ratings Room', 'Go to the Ratings Room'), boss('the_feed', 'Unplug the Feed')], 16),
    f16_prompt: S('Your Lines', 'The Teleprompter has your lines for the rest of your life.', [go('camp:The Teleprompter', 'Find the Teleprompter'), boss('the_teleprompter', 'Go off script')], 16),
  },
  17: {
    f17_runnerup: S('Runner-Up', 'Last season\'s runner-up almost won. He\'s glad he didn\'t.', [go('camp:The Runner-Up\'s House', 'Visit the Runner-Up'), boss('the_runner_up', 'Hear him out, the hard way')], 17),
  },
  18: {
    f18_ming: S('First Here', 'Ming Zhao got to the bottom first.', [go('point:crew:The Speedrun', 'Find the Speedrun\'s camp'), find('point:crew:The Speedrun', 'find Ming', 'Find Ming', 'She\'s sitting on an empty plinth. "There\'s no prize," she says. "There\'s just a chair."')], 18),
  },
};
