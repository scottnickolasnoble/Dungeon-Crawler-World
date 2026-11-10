// Writes godot/data/quest_lines.json: every floor's main line (how you earn the way down) and its side quests.
// Each floor gets down a different way. See scripts/story/quest_lines.gd for what the step kinds and selectors mean.
// Run: node tools/build_quest_lines.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SIDES } from './quest_lines_sides.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const go = (at, label, r) => ({ t: 'go', at, label, ...(r ? { r } : {}) });
const find = (at, say, label, text, extra = {}) => ({ t: 'find', at, say, label, ...(text ? { text } : {}), ...extra });
const kill = (family, n, label) => ({ t: 'kill', ...(family ? { family } : {}), n, label });
const boss = (kind, label) => ({ t: 'boss', kind, label });
const flag = (f, label) => ({ t: 'flag', flag: f, label });
const quest = (id, label) => ({ t: 'quest', id, label });
const chamber = (which, label) => ({ t: 'chamber', which, label });
const Q = (name, desc, start, steps, reward = {}) => ({ name, desc, main: true, ...start, steps, reward });
const xp = (f, n = 1) => ({ xp: Math.round((220 + f * 140) * n), gold: Math.round((60 + f * 40) * n) });
const way = (f, extra = {}) => ({ ...xp(f, 3), flags: [`f${f}_way`], ...extra });

const F = {};

// ---------------------------------------------------------------- 1: the only floor with keys
F[1] = {
  stairs: { flag: 'f1_stairs', how: 'Four padlocks on the stairwell chain. Pylon has one key, Lost Property has one, the Moth Matron swallowed one, and the fourth lock eats validated tickets. Marta knows the rest.', locked: 'Chained. Four padlocks, four different shapes.' },
  quests: {
    f1_lay: Q('Lay of the Land', 'Marta wants you to know the ground before you try anything stupid. Climb high, find the hideout, read the shrine.', { after: ['nobody_out'] }, [
      go('point:lookout', 'Climb to the Lookout'), go('point:hideout', 'Find the Survivor Hideout'),
      find('point:shrine', 'read the names scratched into the shrine', 'Read the names on the Shrine', 'Hundreds of names. Some of the dates are from before Earth was taken.', { act: ['lore:1'] })], xp(1)),
    the_stairs: { ...Q('The Chained Stairwell', 'Four padlocks on the stairwell chain. Pylon has one key. Lost Property has another. The Moth Matron swallowed the third. The fourth lock takes a validated parking ticket.', {}, [
      quest('f1_key_toll', 'The Toll Key (Sergeant Pylon)'), quest('f1_key_lost', 'The Lost Property Key'), quest('f1_key_moth', 'The Moth\'s Key'), quest('f1_key_ticket', 'The Ticket Lock')],
      { xp: 900, gold: 250, flags: ['f1_stairs'] }), giver: 'marta' },
    f1_key_toll: Q('The Toll Key', 'Pylon wears the first key on a lanyard and charges a toll to look at it.', { with: 'the_stairs' }, [
      go('camp:Pylon Point', 'Get to Pylon Point'), kill('goblin', 8, 'Break the toll line: 8 Traffic-Cone Goblins'), flag('pylon_handled', 'Deal with Sergeant Pylon: kill him, or a truce through Pickles')], xp(1)),
    f1_key_lost: Q('Lost Property', 'Somebody handed the second key in. Lost Property has it now, and Lost Property does not give things back.', { with: 'the_stairs' }, [
      find('landmark:The Burning Bus', 'search the burnt-out bus', 'Find the claim ticket in the Burning Bus', 'A claim ticket, half melted: ITEM: KEY, STAIRWELL (1). COLLECT FROM LOST PROPERTY.'),
      go('camp:The Lost Property Office', 'Take the ticket to the Lost Property Office'),
      chamber('grand', 'Take the key from Lost & Found in its throne room')], xp(1, 1.5)),
    f1_key_moth: Q('Moth in the Lock', 'The Moth Matron swallowed the third key, because it was shiny. The Lamplighters want her burned. You just want the key.', { with: 'the_stairs' }, [
      go('point:crew:The Lamplighters', 'Ask the Lamplighters about the Matron'), kill('moth', 10, 'Thin the swarm: 10 Fluorescent Moths'),
      boss('mothMatron', 'Defeat the Moth Matron'), find('camp:The Lightwell', 'cut open the cocoon', 'Cut the key out of her cocoon', 'Wrapped in silk like a present: a small brass key.')], xp(1, 1.5)),
    f1_key_ticket: Q('The Ticket Lock', 'The fourth padlock has a slot where the keyhole should be. It wants a ticket, validated.', { with: 'the_stairs' }, [
      quest('ticket_machine', 'Solve the ticket machine near the Exit Sign'),
      find('stairs', 'feed the ticket into the fourth lock', 'Feed the validated ticket into the lock', 'The lock eats the ticket, thinks about it, and clicks open.')], xp(1)),
  },
};

// ---------------------------------------------------------------- 2: there are no stairs; ride the Great Dryer
F[2] = {
  stairs: { flag: 'f2_way', how: 'The stairs were bricked up seasons ago. The way down is the Great Dryer: it needs boiler pressure, the right cycle, and Ebb off shift.', locked: 'ERROR: INSUFFICIENT PRESSURE. NO CYCLE SELECTED. CUSTODIAN ON SHIFT.',
    exit: { at: 'landmark:The Great Dryer', text: 'Press E: climb into the Great Dryer', old: 'Bricked up, with a sign: "STAIRS CLOSED FOR CLEANING SINCE 1986."' } },
  quests: {
    f2_customer: Q('Customer Service', 'WELCOME TO CUSTOMER SERVICE. The doors lock behind you, and the big screen starts counting.', { arrive: true }, [
      find('hub', 'read the big screen', 'Read the load screen', 'CURRENT LOAD: 4,117,021 CONTESTANTS. Nobody knows what "processing" means.'),
      go('landmark:The Great Dryer', 'Find the Great Dryer'),
      find('landmark:The Great Dryer', 'try the Dryer\'s door', 'Try the Dryer', 'ERROR: INSUFFICIENT PRESSURE. ERROR: NO CYCLE SELECTED. ERROR: CUSTODIAN ON SHIFT.')], xp(2)),
    f2_pressure: Q('Building Pressure', 'Three pressure valves feed the Dryer from the boiler. The Mop Wights keep closing them, because that\'s their job.', { after: ['f2_customer'] }, [
      find('point:outpost', 'open the first pressure valve', 'Open valve one'), find('point:outpost#2', 'open the second pressure valve', 'Open valve two'),
      find('point:outpost#3', 'open the third pressure valve', 'Open valve three'), kill('wight', 10, 'Stop the Mop Wights closing them again: 10 wights')], xp(2, 1.5)),
    f2_cycle: Q('Delicates', 'The Dryer has eighteen symbols. The right cycle is sewn into laundry tags all over the floor, one symbol each.', { after: ['f2_customer'] }, [
      find('landmark:Sock Mountain', 'dig through the socks', 'Find a symbol tag in Sock Mountain'), find('landmark:Soap Falls', 'fish a shirt out of the falls', 'Find a symbol tag at Soap Falls'),
      find('camp:The Lint Traps', 'pull a tag out of the lint', 'Find a symbol tag in the Lint Traps'), find('camp:The Machine Graveyard', 'check the dead machines', 'Find a symbol tag in the Machine Graveyard'),
      find('point:hideout', 'ask around the hideout', 'Find a symbol tag at the Survivor Hideout'),
      find('landmark:The Great Dryer', 'dial in the cycle', 'Dial the cycle into the Dryer', 'DESTINATION: FLOOR 18. ERROR: FLOOR 18 DOES NOT EXIST. The Host\'s voice cuts in: "Oops! Let\'s not play with the old machinery." The dial resets to FLOOR 3.')], xp(2, 1.5)),
    f2_shift: Q('Off Shift', 'The Dryer won\'t run while a custodian is on shift. Head Custodian Ebb has been on shift for forty years.', { after: ['f2_customer'] }, [
      quest('clocking_out', 'Find Reggie\'s timecard in Boiler Room 0 (talk to Old Reggie)'), flag('ebb_handled', 'Take Head Custodian Ebb off shift')], xp(2, 1.5)),
    f2_final: Q('Final Spin', 'Pressure up, cycle set, nobody on shift. Climb in. The Mop Wights know what you\'re doing and they don\'t like it.', { after: ['f2_pressure', 'f2_cycle', 'f2_shift'] }, [
      kill('wight', 8, 'Hold off the wights: 8 more'), find('landmark:The Great Dryer', 'start the final spin', 'Start the Great Dryer')], way(2)),
  },
};

// ---------------------------------------------------------------- 3: an invitation to the feast
F[3] = {
  stairs: { flag: 'f3_way', how: 'The stairs are under the Cone King\'s throne, and the Cone Cathedral only opens for invited guests. Get invitations from Grandma Gristle, the Bulb Queen and Old Man Coo.', locked: 'The Cathedral doors are shut. A cone with a slot says: INVITATIONS ONLY.' },
  quests: {
    f3_bell: Q('The Dinner Bell', '"Dinner Bell\'s in twenty minutes." Everyone goes quiet when you ask what that means.', { arrive: true }, [
      go('landmark:Auntie Brine\'s Pot', 'Find out what the Dinner Bell is'),
      find('landmark:Auntie Brine\'s Pot', 'eat a bowl when the bell rings', 'Eat when the Bell rings', 'You feel full, warm, and very slightly different.')], xp(3)),
    f3_calling: Q('A Calling', 'Registrar Odessa: every contestant who reaches Floor 3 chooses what they are. Then they prove it.', { after: ['f3_bell'] }, [
      go('point:shrine', 'Go to the Hall of Callings shrine'), kill(null, 15, 'Prove your calling: 15 monsters')], xp(3)),
    f3_guest: Q('Guest of the Cone', 'The Cone King feasts once a season and only invited guests come in. Three powers in the district can invite you.', { after: ['f3_calling'] }, [
      quest('f3_inv_gristle', 'An invitation from Grandma Gristle'), quest('f3_inv_queen', 'An invitation from the Bulb Queen\'s court'), quest('f3_inv_coo', 'An invitation from Old Man Coo')], xp(3)),
    f3_inv_gristle: Q('Grandma\'s Table', 'Gristle will invite anyone who clears the hags out of her pantry. She will also try to cook them.', { with: 'f3_guest' }, [
      go('camp:Grandma Gristle\'s Kitchen', 'Visit Grandma Gristle\'s Kitchen'), kill('hag', 8, 'Clear the pantry: 8 Gutter Hags'),
      find('camp:Grandma Gristle\'s Kitchen', 'take the invitation from under the sugar bowl', 'Take her invitation', 'In Gristle\'s handwriting: "One guest. Bring your own bowl." There\'s a recipe on the back. It\'s called CONTESTANT.')], xp(3)),
    f3_inv_queen: Q('Light the Market', 'The Bulb Queen\'s court is starving for light. Relight the market and the court will vouch for you.', { with: 'f3_guest' }, [
      find('point:sight:Bug Light', 'relight the bug light', 'Relight the Bug Light'), go('camp:The Lamp Market', 'Enter the Lamp Market'),
      boss('bulbQueen', 'Face the Bulb Queen'), find('camp:The Lamp Market', 'take the court\'s invitation', 'Take the court\'s invitation')], xp(3, 1.5)),
    f3_inv_coo: Q('Up on the Roof', 'Old Man Coo has an invitation he\'s never used. He\'ll trade it, if you can get up to him.', { with: 'f3_guest' }, [
      go('point:tower', 'Climb the Tenement Stack'), kill('pigeon', 10, 'Get past the roost: 10 Pigeon Ghouls'),
      find('camp:The Rooftop Roost', 'trade Coo a crust for his invitation', 'Trade with Old Man Coo', '"They went sideways, you know. Not down. Sideways." He won\'t say more.')], xp(3)),
    f3_feast: Q('The Feast of Cones', 'Three invitations. The Cathedral opens. The Cone King has set a place for you, and he would like you to sit in it forever.', { after: ['f3_guest'] }, [
      go('camp:The Cone Cathedral', 'Attend the feast at the Cone Cathedral'), kill('captain', 4, 'Survive the honour guard: 4 Cone Captains'),
      flag('coneKing_handled', 'Face the Cone King at his own table')], way(3)),
  },
};

// ---------------------------------------------------------------- 4: escape before closing time
F[4] = {
  stairs: { flag: 'f4_way', how: 'The service lift is the only way out of the Mall. It needs a staff badge, three fuses, and someone to get past the Food Court Kraken before the shutters come down.', locked: 'STAFF ONLY. Badge reader dark. Fuse box empty.' },
  quests: {
    f4_directory: Q('You Are Here', 'Every map in the Mall says YOU ARE HERE, and every arrow points to the Atrium.', { arrive: true }, [
      find('hub', 'read the mall directory', 'Read the directory', 'YOU ARE HERE. EXIT: STAFF ONLY. Someone has scratched "NO EXIT" over it.'),
      go('landmark:The Escalator to Nowhere', 'Ride the Escalator to Nowhere and come back')], xp(4)),
    f4_badge: Q('Staff Only', 'Mall Security issues staff badges. Mall Security does not issue them to you.', { after: ['f4_directory'] }, [
      go('camp:Mall Security HQ', 'Get into Mall Security HQ'), kill('mallcop', 10, 'Get past 10 Mall Cops'), boss('kevlar', 'Take Captain Kevlar\'s badge')], xp(4, 1.5)),
    f4_fuses: Q('Blown', 'The lift\'s three fuses were pulled and hidden around the Mall. The Mall wants you to stay.', { after: ['f4_directory'] }, [
      find('point:wreck', 'pull a fuse from the wreck', 'Find the fuse in the Wreck'), find('point:cache', 'open the cache', 'Find the fuse in the Hidden Cache'),
      find('point:nest', 'dig through the nest', 'Find the fuse in the Nest')], xp(4)),
    f4_veins: Q('The Veins', 'Something under the tiles is pulsing. Follow it, and find out who\'s keeping everyone here.', { after: ['f4_directory'] }, [
      go('point:summit', 'Get up high and look'), go('camp:The Atrium', 'Follow the veins to the Atrium'),
      find('camp:The Atrium', 'put your hand on the wall', 'Touch the heart of the Mall', 'It\'s warm. It\'s beating. A voice like a lullaby: "Stay, sweetheart. Everything you need is here." The shutters start to come down.')], xp(4)),
    f4_closing: Q('Closing Time', 'The Mall Mother has called closing time. Every shutter is coming down. Get to the lift.', { after: ['f4_badge', 'f4_fuses', 'f4_veins'] }, [
      go('camp:The Food Court Depths', 'Get to the Food Court Depths'), kill('slime', 10, 'Cut through 10 Bounce-House Slimes'),
      flag('kraken_handled', 'Get past the Food Court Kraken'), find('stairs', 'swipe the badge and fit the fuses', 'Start the service lift')], way(4)),
  },
};

// ---------------------------------------------------------------- 5: paperwork
F[5] = {
  stairs: { flag: 'f5_way', how: 'The manhole is inside the HOA Clubhouse grounds and needs a stamped Permit to Descend: three signatures, no unpaid fines, and the HOA\'s vote.', locked: 'A padlocked manhole with a sign: PERMIT HOLDERS ONLY. FORM 27B.' },
  quests: {
    f5_fined: Q('Notice of Violation', 'You\'ve been here thirty seconds and you\'ve already been fined.', { arrive: true }, [
      find('hub', 'read the fine stuck to your back', 'Read your first fine', 'NOTICE OF VIOLATION #1: ARRIVING. NOTICE #2: STANDING. NOTICE #3: READING THIS.'),
      go('landmark:The Block Party', 'Go to the Block Party and ask how anyone leaves')], xp(5)),
    f5_signatures: Q('Three Signatures', 'Form 27B needs three neighbours to sign it. None of them want you to leave.', { after: ['f5_fined'] }, [
      find('point:hideout', 'get a signature', 'A signature from the Survivor Hideout'), find('landmark:The Block Party', 'get a signature', 'A signature at the Block Party'),
      kill('hound', 6, 'Calm the Dog Park: 6 Cul-de-Sac Hounds'), find('camp:The Dog Park', 'get Mr. Fetch\'s pawprint', 'Mr. Fetch\'s pawprint')], xp(5)),
    f5_fines: Q('Paid in Full', 'The gnomes collect fines for the HOA. Your fines. Take them back.', { after: ['f5_fined'] }, [
      kill('gnome', 12, 'Take your fines back: 12 Lawn Gnome Cultists'), boss('pope', 'The Gnome Pope has blessed the rest. Un-bless him.')], xp(5, 1.5)),
    f5_meeting: Q('The HOA Meeting', 'Every permit goes to a vote. The HOA President has never lost one.', { after: ['f5_signatures', 'f5_fines'] }, [
      go('camp:The HOA Clubhouse', 'Attend the HOA meeting'), flag('hoa_handled', 'Win the vote: depose the HOA President'),
      find('camp:Town Hall', 'get the Mayor\'s stamp', 'Get the permit stamped at Town Hall', 'Mayor Eternal stamps it without looking up. "Re-elect me," he says, to no one.')], way(5)),
  },
};

// ---------------------------------------------------------------- 6: survive the hunt
F[6] = {
  stairs: { flag: 'f6_way', how: 'The stairs are at the Glimmerkin Safari Lodge, and the Lodge only lets hunters through. Become one, then survive Hunt Night.', locked: 'The Lodge gate: MEMBERS AND THEIR TROPHIES ONLY.' },
  quests: {
    f6_prey: Q('Prey', 'Somebody has paid to hunt you. Get under cover before dark.', { arrive: true }, [
      go('point:hideout', 'Get to the Survivor Hideout'), find('point:hideout', 'mask your scent with ash', 'Learn to hide your scent', 'The hunters lose your trail. For now.')], xp(6)),
    f6_trophies: Q('Turn the Tables', 'The Lodge wants trophies. Bring them some of its own.', { after: ['f6_prey'] }, [
      kill('hunter', 10, 'Hunt the hunters: 10 Tourist Hunters'), go('camp:Hornback Hunting Camp', 'Raid the Hornback Hunting Camp'),
      find('camp:Hornback Hunting Camp', 'steal the hunters\' ledger', 'Steal the hunters\' ledger', 'Payment column: ATTENTION. Thousands of hours of it, for every kill.')], xp(6, 1.5)),
    f6_licence: Q('Licensed', 'You need a hunter\'s licence to sign the guestbook. The Wild Kennel\'s Matriarch wears one on her collar.', { after: ['f6_prey'] }, [
      go('camp:The Wild Kennel', 'Find the Wild Kennel'), flag('matriarch_handled', 'Take the licence from the Dog Park Matriarch')], xp(6)),
    f6_guestbook: Q('Sign the Guestbook', 'Members sign the guestbook in the Great Lodge. Members are allowed in for Hunt Night.', { after: ['f6_trophies', 'f6_licence'] }, [
      go('point:tower', 'Watch the Lodge from the Hunters\' Hide'), find('point:grand', 'sign the guestbook', 'Sign the guestbook as a hunter', 'Every name above yours is an audience member. Some of them are famous on Earth.')], xp(6)),
    f6_hunt: Q('Hunt Night', 'Hunt Night starts at the Tallest Tree. This time the quarry is Lord-Hunter Facet.', { after: ['f6_guestbook'] }, [
      go('landmark:The Tallest Tree', 'Start the hunt at the Tallest Tree'), kill('hunter', 12, 'Survive the hunt: 12 hunters'), flag('huntLord_handled', 'Bring down Lord-Hunter Facet')], way(6)),
  },
};

// ---------------------------------------------------------------- 7: drain it
F[7] = {
  stairs: { flag: 'f7_way', how: 'The stairs are under ten metres of water. Get the sluice crank from the Rent Tribunal, open the sluices, and the Sanitation King will try to stop the water going anywhere.', locked: 'Water. Just water, all the way down.' },
  quests: {
    f7_rent: Q('Rent Is Due', 'You arrived owing three weeks. Nobody remembers lending you anything.', { arrive: true }, [
      find('hub', 'read your tenancy agreement', 'Read your tenancy agreement', 'ARREARS: 3 WEEKS. INTEREST: YES.'), go('camp:Rent Tribunal', 'Appeal at the Rent Tribunal'),
      kill('collector', 8, 'Get past 8 Clockwork Debt Collectors'), boss('landlord', 'Settle with the Landlord')], xp(7, 1.5)),
    f7_crank: Q('The Crank', 'The sluice crank was "repossessed" years ago. It\'s in the Tribunal\'s evidence locker.', { after: ['f7_rent'] }, [
      find('camp:Rent Tribunal', 'break open the evidence locker', 'Take the sluice crank'), go('landmark:The Sluice Gate', 'Bring it to the Sluice Gate')], xp(7)),
    f7_sluices: Q('Low Tide', 'Three sluices drain the Cistern. Open them in order, and everything that lives in the water comes up to see why.', { after: ['f7_crank'] }, [
      find('point:outpost', 'crank sluice one', 'Open sluice one'), find('point:outpost#2', 'crank sluice two', 'Open sluice two'),
      find('point:outpost#3', 'crank sluice three', 'Open sluice three'), kill('wyrm', 12, 'Survive what comes up: 12 Sewer Wyrms')], xp(7, 1.5)),
    f7_barge: Q('Barge Day', 'The water\'s going down. The Sanitation King\'s barge is blocking the outfall to keep it in.', { after: ['f7_sluices'] }, [
      go('camp:The Landfill Barge', 'Board the Landfill Barge'), flag('sanking_handled', 'Deal with the Sanitation King'),
      find('stairs', 'wade down the drained stairwell', 'Find the stairs under the water line')], way(7)),
  },
};

// ---------------------------------------------------------------- 8: dig your own way
F[8] = {
  stairs: { flag: 'f8_way', how: 'There are no stairs on the Workings. You dig. You need a drill bit, fuel and track, and Big Momma Mold is sitting on the only seam soft enough to drill.', locked: 'The old shaft is full of rock.',
    exit: { at: 'landmark:The Bright Seam', text: 'Press E: drill down through the Bright Seam', old: 'The old shaft. Full of rock to the brim.' } },
  quests: {
    f8_count: Q('Twelve Came Up', 'Eleven miners went down. Twelve came up. Foreman Tuck wants you to count them.', { arrive: true }, [
      go('point:hideout', 'Find the miners at the Survivor Hideout'),
      find('point:shrine', 'count the miners\' tags', 'Count the tags on the Shrine', 'Eleven tags. The twelfth miner doesn\'t have one, and doesn\'t blink.')], xp(8)),
    f8_bit: Q('The Bit', 'The Drill Prophet keeps the last good drill bit on his altar. He thinks it talks to him.', { after: ['f8_count'] }, [
      go('camp:The Drill Chapel', 'Get into the Drill Chapel'), boss('drill', 'Take the bit from the Drill Prophet')], xp(8)),
    f8_fuel: Q('Fuel', 'The drill burns fryer grease. The Fryer Baron has a manor full of it.', { after: ['f8_count'] }, [
      kill('grease', 10, 'Render down 10 Grease Golems'), boss('baron', 'Take the Fryer Baron\'s vats')], xp(8, 1.5)),
    f8_track: Q('Track', 'Chief Grubtooth\'s mole-kin pulled up every rail on the floor to build his throne.', { after: ['f8_count'] }, [
      go('camp:Grubtooth\'s Dig', 'Go to Grubtooth\'s Dig'), kill('molekin', 10, 'Get through 10 Mole-Kin'), boss('grubtooth', 'Take back the track from Chief Grubtooth')], xp(8)),
    f8_dig: Q('Dig', 'Bit, fuel, track. The only seam soft enough to drill is under the Nursery, where Big Momma Mold tells everyone they\'ve done enough.', { after: ['f8_bit', 'f8_fuel', 'f8_track'] }, [
      go('camp:The Nursery', 'Go into the Nursery'), flag('mold_handled', 'Get past Big Momma Mold'),
      find('landmark:The Bright Seam', 'set up the drill', 'Set up the drill on the Bright Seam')], way(8)),
  },
};

// ---------------------------------------------------------------- 9: win the election
F[9] = {
  stairs: { flag: 'f9_way', how: 'Only the Undermayor can open the stairs, and the Undermayor has never been elected. Win the vote, then make him concede.', locked: 'BY ORDER OF THE UNDERMAYOR: CLOSED.' },
  quests: {
    f9_register: Q('Register', 'Everyone votes in the Undercity. Non-voters are "redistributed".', { arrive: true }, [
      find('hub', 'register to vote', 'Register in Verdigris Square', 'Your ballot number is very long. Sister Verdigris says you\'ll need three districts to win.')], xp(9)),
    f9_campaign: Q('The Campaign', 'Three districts decide everything. Win them by speeches, favours, or ballot boxes.', { after: ['f9_register'] }, [
      quest('f9_v_senate', 'Win the Rat Senate'), quest('f9_v_opera', 'Win the Opera House'), quest('f9_v_throne', 'Win the Rat Throne')], xp(9)),
    f9_v_senate: Q('The Senate Votes', 'Thirty rats, one vote, endless amendments.', { with: 'f9_campaign' }, [
      go('camp:The Rat Senate', 'Address the Rat Senate'), kill('ratking', 10, 'Silence the filibuster: 10 Ratking Choirs'),
      find('camp:The Rat Senate', 'take the Senate\'s ballot', 'Take the Senate\'s vote')], xp(9)),
    f9_v_opera: Q('A Song for the People', 'The Opera House votes however the Soloist sings. She\'s been holding one note for decades.', { with: 'f9_campaign' }, [
      find('point:grand:The Exchange', 'find the Soloist\'s lost score', 'Find her lost score at the Exchange'), go('camp:The Opera House', 'Bring it to the Opera House'), boss('soloist', 'Win over (or silence) the Soloist')], xp(9)),
    f9_v_throne: Q('Kneel', 'The Rat Throne King votes the whole east side. He votes for whoever kneels.', { with: 'f9_campaign' }, [
      go('camp:The Rat Throne', 'Visit the Rat Throne'), boss('ratthrone', 'Refuse to kneel')], xp(9)),
    f9_count: Q('The Count', 'You won. The Undermayor has locked the ballots in the Vault and refuses to concede.', { after: ['f9_campaign'] }, [
      go('point:grand:The Capitol', 'Demand a recount at the Capitol'), boss('lockjaw', 'Break the ballots out of the Vault'),
      flag('undermayor_handled', 'Unseat the Undermayor at City Hall')], way(9)),
  },
};

// ---------------------------------------------------------------- 10: shoot your episode
F[10] = {
  stairs: { flag: 'f10_way', how: 'You\'re in an episode now. Shoot all three scenes, then wrap the Showrunner. The stairs are behind the last set.', locked: 'CLOSED SET. A sign: NOT UNTIL THE EPISODE WRAPS.' },
  quests: {
    f10_call: Q('Call Sheet', 'A runner hands you a call sheet with your name on it. You\'re the guest star. The episode is called "Down And Out".', { arrive: true }, [
      find('hub', 'read your call sheet', 'Read the call sheet', 'SCENE 1: HIGH NOON. SCENE 2: MOON LANDING. SCENE 3: FINAL LOOK. GUEST STAR DIES IN ACT 3 (TBC).')], xp(10)),
    f10_s1: Q('Scene 1: High Noon', 'A showdown on the Western Set. The Stunt Double has played your death before.', { after: ['f10_call'] }, [
      go('camp:The Western Set', 'Get to the Western Set'), boss('the_stunt_double', 'Win the showdown')], xp(10)),
    f10_s2: Q('Scene 2: Moon Landing', 'Plant a flag on the Fake Moon while the crew throws everything at you for "texture".', { after: ['f10_call'] }, [
      go('landmark:The Fake Moon', 'Get to the Fake Moon'), kill('stagehand', 12, 'Survive the crew: 12 Stagehands'), find('landmark:The Fake Moon', 'plant the flag', 'Plant the flag')], xp(10)),
    f10_s3: Q('Scene 3: Final Look', 'Hair and makeup for the final scene. The Makeup Witch does faces. Permanently.', { after: ['f10_call'] }, [
      go('camp:Makeup Trailers', 'Report to the Makeup Trailers'), boss('makeup_witch', 'Get out of the Makeup Witch\'s chair')], xp(10)),
    f10_wrap: Q('That\'s a Wrap', 'Three scenes in the can. The Showrunner wants a different ending, with you in a body bag.', { after: ['f10_s1', 'f10_s2', 'f10_s3'] }, [
      go('camp:The Water Tank', 'Go to the Water Tank'), flag('the_showrunner_handled', 'Wrap the Showrunner')], way(10)),
  },
};

// ---------------------------------------------------------------- 11: the bracket
F[11] = {
  stairs: { flag: 'f11_way', how: 'Ratings Week. The stairs open for the tournament winner, nobody else. Win five rounds.', locked: 'The tunnel gate: CHAMPIONS ONLY.' },
  quests: {
    f11_entry: Q('Sign Up', 'Every contestant on Floor 11 is entered in Ratings Week. Declining is not an option on the form.', { arrive: true }, [
      find('hub', 'sign the tournament sheet', 'Sign the tournament sheet', 'Your seed: 64th of 64. The odds on you are very long.')], xp(11)),
    f11_r1: Q('Round 1: The Mascots', 'An easy opener against the Mascot Pen. The crowd loves a mascot fight.', { after: ['f11_entry'] }, [go('camp:The Mascot Pen', 'Enter the Mascot Pen'), boss('big_foam_finger', 'Beat the Big Foam Finger')], xp(11)),
    f11_r2: Q('Round 2: The Squad', 'The Cheer Squad fights in formation.', { after: ['f11_r1'] }, [go('camp:The Cheer Pyramid', 'Go to the Cheer Pyramid'), boss('head_cheerleader', 'Topple the Head Cheerleader')], xp(11)),
    f11_r3: Q('Round 3: The Away End', 'The Ultras have never lost at home, because they kill the away team.', { after: ['f11_r2'] }, [go('camp:The Ultras\' End', 'Walk into the Ultras\' End'), boss('the_capo', 'Beat the Capo')], xp(11)),
    f11_semi: Q('Semi-Final: The Ref', 'The Ref is your semi-final opponent. He is also refereeing it.', { after: ['f11_r3'] }, [go('camp:The Officials\' Room', 'Report to the Officials\' Room'), boss('the_ref', 'Beat the Ref, fair or otherwise')], xp(11)),
    f11_final: Q('The Final', 'Last season\'s winner, kept alive for exactly this. He whispers "Don\'t win" as you walk out.', { after: ['f11_semi'] }, [
      go('landmark:The Jumbotron', 'Walk out under the Jumbotron'), go('camp:The Centre Circle', 'Take the Centre Circle'), flag('the_champion_handled', 'Beat the Champion')], way(11)),
  },
};

// ---------------------------------------------------------------- 12: get booked
F[12] = {
  stairs: { flag: 'f12_way', how: 'The way down is a trapdoor on the talk show set, and only guests get on set. Get an agent, get famous, get booked, then refuse the Producer.', locked: 'NO GUESTS WITHOUT A BOOKING.' },
  quests: {
    f12_agent: Q('Representation', 'Nobody gets booked without an agent. Agent Twelve Percent takes twelve percent of everything, including organs.', { arrive: true }, [
      go('camp:The Agency', 'Go to the Agency'), boss('agent_twelve_percent', 'Get Agent Twelve Percent to sign you (or take his contacts)')], xp(12)),
    f12_buzz: Q('Buzz', 'You need to be in the papers. The paparazzi will make you famous if you make it worth their while.', { after: ['f12_agent'] }, [
      kill('paparazzo', 12, 'Make the front page: 12 Paparazzi'), boss('flash_mob', 'Break up the Flash Mob')], xp(12)),
    f12_laugh: Q('Warm-Up', 'The Laugh Track decides whether you\'re funny. Get it on your side.', { after: ['f12_agent'] }, [
      go('camp:The Laugh Track Factory', 'Go to the Laugh Track Factory'), boss('the_laugh_track', 'Win the Laugh Track over')], xp(12)),
    f12_show: Q('Tonight\'s Guest', 'You\'re booked on Jolly Jack Brightly. The couch is very comfortable. There\'s a trapdoor under it.', { after: ['f12_buzz', 'f12_laugh'] }, [
      go('camp:The Talk Show', 'Go on the Talk Show'), boss('jolly_jack_brightly', 'Survive the interview'),
      find('landmark:The Big Couch', 'lift the cushions', 'Find the trapdoor under the Big Couch', 'A trapdoor with a combination lock. The combination is in the Producer\'s office.')], xp(12)),
    f12_contract: Q('The Contract', 'The Producer offers you a recurring role. Forever. He doesn\'t take no.', { after: ['f12_show'] }, [
      go('camp:The Producers\' Floor', 'Take the meeting on the Producers\' Floor'), flag('the_producer_handled', 'Refuse the contract')], way(12)),
  },
};

// ---------------------------------------------------------------- 13: a research trail, in silence
F[13] = {
  stairs: { flag: 'f13_way', how: 'The Archivist keeps the stairs key in the Restricted Section. Follow your own catalogue entry to find out how to get in. Quietly.', locked: 'SILENCE. RESTRICTED. KEY HELD BY THE ARCHIVIST.' },
  quests: {
    f13_card: Q('Look Yourself Up', 'There\'s a catalogue card with your name on it.', { arrive: true }, [
      find('landmark:The Card Catalogue Spire', 'look yourself up', 'Find your card in the Catalogue Spire', 'YOUR NAME. SEE ALSO: LOST & FOUND OF BOOKS.')], xp(13)),
    f13_lost: Q('See Also', 'Your card points somewhere else. They all do.', { after: ['f13_card'] }, [
      find('landmark:The Lost & Found of Books', 'search the lost books', 'Search the Lost & Found of Books', 'A book with your name on the spine. Chapter one is your arrival. The last chapter is blank. A note: CONTINUED ON THE TOP SHELF.')], xp(13)),
    f13_ladder: Q('The Top Shelf', 'The top shelf is at the top of the Endless Ladder. It does end. Eventually.', { after: ['f13_lost'] }, [
      go('landmark:The Endless Ladder', 'Climb the Endless Ladder'), kill('bookwyrm', 8, 'Get past 8 Bookwyrms on the way up'),
      find('landmark:The Endless Ladder', 'take the volume from the top shelf', 'Take the second volume', 'The last page: RESTRICTED. ACCESS BY INDEX PASS.')], xp(13, 1.5)),
    f13_pass: Q('Index Pass', 'The Index Clerk issues passes. He has issued none since the first season.', { after: ['f13_ladder'] }, [
      kill('shusher', 10, 'Hush 10 Shushers'), boss('index_clerk', 'Take the Index Clerk\'s pass')], xp(13)),
    f13_key: Q('The Only Key', 'The Restricted Section. The Archivist has been waiting for your book to reach this chapter.', { after: ['f13_pass'] }, [
      go('camp:The Restricted Section', 'Enter the Restricted Section'), flag('the_archivist_handled', 'Get the key from the Archivist')], way(13)),
  },
};

// ---------------------------------------------------------------- 14: a horror season, in five acts
F[14] = {
  stairs: { flag: 'f14_way', how: 'Castle Dread runs Season Nine\'s script, five acts, every night. The way down is beneath the Keep, after the final act.', locked: 'The crypt stairs are bricked over: "INTERMISSION."' },
  quests: {
    f14_a1: Q('Act I: The Stranger at the Inn', 'The innkeeper hands you a script. You\'re playing the stranger who arrives on a stormy night.', { arrive: true }, [
      find('hub', 'take the script', 'Take the script', 'ACT I: THE STRANGER VISITS THE GRAVEYARD AT MIDNIGHT. HE DOES NOT COME BACK THE SAME.'),
      go('camp:The Graveyard', 'Visit the graveyard at midnight'), boss('gravedigger', 'Survive the Gravedigger')], xp(14)),
    f14_a2: Q('Act II: The Gate', 'The drawbridge only drops for whoever beats the Portcullis Knight.', { after: ['f14_a1'] }, [
      go('landmark:The Drawbridge', 'Approach the Drawbridge'), boss('portcullis_knight', 'Beat the Portcullis Knight')], xp(14)),
    f14_a3: Q('Act III: The Witch on the Crag', 'The script calls for a visit to the Wax Witch, who has the castle\'s second key in a candle.', { after: ['f14_a2'] }, [
      go('camp:The Witch\'s Tower', 'Climb the Witch\'s Tower'), boss('wax_witch', 'Melt the Wax Witch')], xp(14)),
    f14_a4: Q('Act IV: Below', 'The crypts under the castle connect to everything. The Ossuary conducts the Bone Choir down there.', { after: ['f14_a3'] }, [
      go('camp:The Crypts', 'Go down into the Crypts'), boss('the_ossuary', 'Silence the Ossuary')], xp(14)),
    f14_a5: Q('Act V: The Count', 'The final act. The Count has played it every night for decades and never once lost.', { after: ['f14_a4'] }, [
      go('landmark:The Great Hall\'s Chandelier', 'Enter the Great Hall'), go('camp:The Keep', 'Climb the Keep'), flag('the_count_handled', 'Give the Count his final curtain')], way(14)),
  },
};

// ---------------------------------------------------------------- 15: cold, and listening
F[15] = {
  stairs: { flag: 'f15_way', how: 'The Recorder in the Core opens the stairs once it has played its message. The message is in four pieces, and the cold kills anyone who takes too long.', locked: 'Frozen shut.' },
  quests: {
    f15_warm: Q('Warm Room', 'Out here, the cold kills you slowly. The Warm Room\'s heater is the only safe place.', { arrive: true }, [
      find('hub', 'warm your hands at the heater', 'Warm up in the Warm Room'), find('landmark:The Blinking Light', 'look at the blinking light', 'Find out what the Blinking Light is', 'It blinks four times, waits, then four again. Something is waiting for four pieces.')], xp(15)),
    f15_tapes: Q('The Message', 'The Builders\' last message was cut into four tapes and filed in four different places.', { after: ['f15_warm'] }, [
      find('camp:The Tape Library', 'recover the tape', 'Recover tape one from the Tape Library'), find('camp:The Cable Jungle', 'pull the tape from the cables', 'Recover tape two from the Cable Jungle'),
      find('camp:The Cooling Towers', 'thaw the tape out', 'Recover tape three from the Cooling Towers'), find('landmark:The Frozen Server', 'chip the tape out of the ice', 'Recover tape four from the Frozen Server')], xp(15, 2)),
    f15_firewall: Q('Access Denied', 'The Firewall won\'t let the tapes through to the Core.', { after: ['f15_tapes'] }, [
      go('camp:The Firewall', 'Go to the Firewall'), boss('the_firewall', 'Breach the Firewall')], xp(15)),
    f15_core: Q('Playback', 'The Recorder has been waiting to play this for a very long time.', { after: ['f15_firewall'] }, [
      go('camp:The Core', 'Enter the Core'), flag('the_recorder_handled', 'Hear the Recorder out')], way(15)),
  },
};

// ---------------------------------------------------------------- 16: a heist
F[16] = {
  stairs: { flag: 'f16_way', how: 'The Director holds the Gallery, and the Gallery holds the way down. The off-air engineer has a plan: ten seconds of dead air.', locked: 'ON AIR. DO NOT ENTER.' },
  quests: {
    f16_crew: Q('The Crew', 'An engineer in the Canteen says she can take the whole broadcast down for ten seconds. She needs people who don\'t mind being off camera.', { arrive: true }, [
      find('hub', 'meet the off-air engineer', 'Meet the off-air engineer', '"Ten seconds of dead air. That\'s all you get. Make them count."')], xp(16)),
    f16_plan: Q('Casing the Job', 'Learn the schedule, scout the dead zone, steal the keys.', { after: ['f16_crew'] }, [
      find('landmark:The Big Mast', 'copy the tower schedule', 'Steal the tower schedule from the Big Mast'), go('landmark:The Dead Air Zone', 'Scout the Dead Air Zone'),
      boss('the_censor', 'Get the Censor\'s keys')], xp(16, 1.5)),
    f16_towers: Q('Lights Out', 'The Dish Array would reroute the signal around the dead air. Take it down first.', { after: ['f16_plan'] }, [
      kill('static_man', 12, 'Take down 12 Static Men'), boss('static_king', 'Topple the Static King')], xp(16)),
    f16_heist: Q('Dead Air', 'The dead air will not last. Kill the Live Light, then run for the Gallery before it comes back on.', { after: ['f16_towers'] }, [
      find('landmark:The Live Light', 'kill the live light', 'Kill the Live Light', 'TEN SECONDS OF DEAD AIR. Somewhere, every screen on Earth goes black.'),
      go('camp:The Gallery', 'Storm the Gallery'), flag('the_director_handled', 'Take the Gallery from the Director')], way(16)),
  },
};

// ---------------------------------------------------------------- 17: a sitcom
F[17] = {
  stairs: { flag: 'f17_way', how: 'The Host is in the Studio, and the Studio only opens once you\'ve played through his episodes.', locked: 'A sign on the Studio door: TAPING. PLEASE WAIT FOR THE LAUGH.' },
  quests: {
    f17_e1: Q('Episode 1: Welcome Home', 'Main Street, fifty years ago. Everyone knows your name. There\'s a laugh track.', { arrive: true }, [
      go('landmark:The House', 'Go home to the House'), find('landmark:The House', 'sit down for family dinner', 'Sit down for family dinner', 'Everyone at the table has the Host\'s face, at different ages. *laughter*')], xp(17)),
    f17_e2: Q('Episode 2: The Big Game', 'The whole town is at the game. The Fan Club President is very, very excited to meet you.', { after: ['f17_e1'] }, [
      go('camp:The Fan Club', 'Go to the Fan Club'), boss('fan_club_president', 'Survive the Fan Club President')], xp(17)),
    f17_e3: Q('Episode 3: Mirror, Mirror', 'In the Mirror Maze someone has your face and is doing your lines better than you.', { after: ['f17_e2'] }, [
      go('landmark:The Mirror Maze', 'Enter the Mirror Maze'), boss('the_stand_in', 'Beat your Stand-In')], xp(17)),
    f17_reel: Q('Behind the Scenes', 'The drive-in is showing old footage nobody was meant to see.', { after: ['f17_e3'] }, [
      find('landmark:The Drive-In Screen', 'watch the reel', 'Watch the old reel at the Drive-In', 'Season One. The winner holds up the trophy. It\'s him. The Previous Winner is the Host.'),
      go('camp:The Trophy Room', 'Find the Trophy Room'), boss('the_mother', 'Get past the Mother')], xp(17, 1.5)),
    f17_finale: Q('Series Finale', 'The Studio is open. Live audience. One take.', { after: ['f17_reel'] }, [
      go('camp:The Studio', 'Walk onto the Studio set'), flag('the_host_handled', 'Face the Host')], way(17)),
  },
};

// ---------------------------------------------------------------- 18: the end
F[18] = {
  stairs: { flag: 'f18_way', how: 'There is nothing below this. Choose.', locked: 'There is nothing below this.' },
  quests: {
    f18_gate: Q('The Wardens\' Gate', 'The Maintainers keep the Stack running. The Warden decides who sees what they maintain.', { arrive: true }, [
      go('camp:The Wardens\' Gate', 'Reach the Wardens\' Gate'), kill('maintainer', 10, 'Get past 10 Maintainers'), boss('the_warden', 'Get past the Warden')], xp(18)),
    f18_echo: Q('The First Contestant', 'In the Echo Hall, the first contestant ever is still talking. Everything he says comes back a hundred times.', { after: ['f18_gate'] }, [
      go('camp:The Echo Hall', 'Enter the Echo Hall'), boss('the_first_contestant', 'Hear the First Contestant out, or silence him')], xp(18)),
    f18_door: Q('The Door', 'There is a door. There was always a door.', { after: ['f18_echo'] }, [
      find('landmark:The Door', 'open the Door', 'Open the Door'), go('camp:The Builders\' Seat', 'Walk to the Builders\' Seat'), flag('the_absence_handled', 'Face the Absence, and choose')], way(18)),
  },
};

// ---------------------------------------------------------------- the clock and the cold
// timer: s seconds from when step "from" opens to finish up to step "to"; run out and steps from "reset" are undone.
F[4].quests.f4_closing.timer = { s: 600, from: 1, to: 3, reset: 1, label: 'CLOSING TIME', home: true,
  fail: 'The shutters slam down. You wake up in the Food Court Free State, tucked into a sleeping bag that smells of cinnamon. Over the tannoy, the Mall Mother says goodnight. The Mall opens again whenever you\'re ready.' };
F[7].quests.f7_sluices.timer = { s: 210, from: 1, to: 2, reset: 0, label: 'FLOOD TIDE',
  fail: 'The water comes back up through the grates faster than you can run. The sluices slam shut, one after another. Start again from the first.' };
F[16].quests.f16_heist.timer = { s: 150, from: 1, to: 1, reset: 0, label: 'DEAD AIR',
  fail: 'The Live Light flickers back on. ON AIR. Every camera on the floor swings round to look at you. Kill the light again.' };
F[15].hazard = { label: 'WARMTH', color: '#8fd8ff', drain: 150, radius: 12, hurt: 0.05,
  warn: 'Your fingers have stopped working. Find heat: the Warm Room, or a fire at a hideout, lookout, shrine or summit.',
  heat: ['point:hideout', 'point:lookout', 'point:shrine', 'point:summit'] };

// side quests, from the cut sheets (art: tools/quest_lines_sides.mjs)
for (const f in SIDES) {
  F[f] = F[f] || { quests: {} };
  for (const [id, q] of Object.entries(SIDES[f])) F[f].quests[id] = { ...q, main: false };
}

const out = { _about: 'Every floor\'s main line and side quests. Generated by tools/build_quest_lines.mjs; see scripts/story/quest_lines.gd.', floors: F };
fs.writeFileSync(path.join(ROOT, 'godot', 'data', 'quest_lines.json'), JSON.stringify(out, null, 1));
let n = 0, m = 0;
for (const f in F) for (const q of Object.values(F[f].quests)) q.main ? m++ : n++;
console.log(`quest_lines.json: ${m} main, ${n} side`);
