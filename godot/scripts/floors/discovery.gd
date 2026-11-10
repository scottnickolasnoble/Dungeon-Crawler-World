class_name Discovery
extends RefCounted
## What there is to find on a floor besides the monsters (art/WORLD.md, sections 3 and 7):
## - contestant camps: the crews' tents and fires. Some trade or heal, the Scavengers shake you down, some are already dead.
## - hidden encampments: sealed by a puzzle whose clues are scattered over the floor. Solve it and a hatch opens onto a
##   chamber underneath with a stash and a lore page from the hidden story.
## Puzzles and the Scavengers' shakedowns are written into Story.dialogue as the floor is built.

const CREWS := {
	"clinic": { "name": "The Stairwell Clinic", "races": ["human", "bogling"], "colour": "#e8f4f0" },
	"lamplighters": { "name": "The Lamplighters", "races": ["lumen", "human"], "colour": "#ffe8a0" },
	"teamdex": { "name": "Team Dex", "races": ["human", "fennix"], "colour": "#ff6a3a" },
	"speedrun": { "name": "The Speedrun", "races": ["clanker", "human"], "colour": "#8ad8ff" },
	"scavengers": { "name": "The Scavengers", "races": ["gutterkin", "grimhide"], "colour": "#8a7a5a" },
}
const PUZZLES := ["symbols", "lamps", "levers", "password", "statues"]
const SYMBOLS := ["an EYE", "a STAIR", "a SPIRAL", "a KEY", "a CONE", "a HAND"]
const LAMPS := [["red", "blood"], ["green", "moss"], ["blue", "sky"], ["white", "bone"], ["gold", "crown"]]
const WORDS := ["SOUP", "STAIRS", "DOWN", "HOME", "MARTA", "SEVEN", "CONES", "QUIET", "EXIT", "DAVE"]
## What's down in the chamber: [what it was, props, what you find]
const CHAMBERS := [
	["a dead crew's last stand", ["remains", "remains", "body_bag", "tent"], "They barricaded themselves in here. It wasn't enough. Their journal is still dry."],
	["a Builders' maintenance room", ["pipes", "crates", "shelf"], "Tools older than any you know, laid out neatly. A chalkboard full of numbers that count down to a date that has passed."],
	["a forgotten shrine", ["candle_grave", "remains", "barrels"], "Candles still lit. No one has been here in years. Someone is still lighting them."],
	["a previous season's set", ["camera_rig", "spotlight", "folding_chair"], "A camera pointed at an empty chair. The tally light is on."],
]
const CHAMBER_Y := -140.0

var kit: FloorWorld
var rng := RandomNumberGenerator.new()
## Every hidden encampment on the floor: { id, at, chamber, puzzle, solution, flag } (the checks read these).
var secrets: Array[Dictionary] = []
var crews: Array[Dictionary] = []


func build(owner: FloorWorld) -> void:
	kit = owner
	rng.seed = 5150 + kit.floor_number
	if kit.floor_number < 1:
		return
	var camps := clampi(int(kit.world_size / 260.0), 2, 8)
	var hidden := clampi(int(kit.world_size / 380.0), 2, 6)
	var kinds := ["clinic", "scavengers", "lamplighters", "dead", "teamdex", "speedrun", "scavengers", "dead"]
	for i in camps:
		var spot := _find_spot(18.0)
		if spot != Vector3.INF:
			_contestant_camp(spot, kinds[(i + kit.floor_number) % kinds.size()], i)
	for i in hidden:
		var spot := _find_spot(20.0)
		if spot != Vector3.INF:
			_hidden_encampment(spot, i)


func act_id() -> String:
	return str(clampi((kit.floor_number + 2) / 3, 1, 6))


func _find_spot(pad: float) -> Vector3:
	var half := kit.world_size / 2.0 - 60.0
	for k in 80:
		var at := Vector3(rng.randf_range(-half, half), 0, rng.randf_range(-half, half))
		if Vector2(at.x, at.z).length() > 140.0 and kit.is_free(at.x, at.z, pad):
			return at
	return Vector3.INF


func _level() -> int:
	var low := 999
	for c: Dictionary in kit.data.get("camps", []):
		low = mini(low, kit._level_of(c))
	return maxi(1, low - 1) if low < 999 else kit.floor_number * 3


# ---------------------------------------------------------------- contestant camps
func _contestant_camp(at: Vector3, kind: String, index: int) -> void:
	kit.reserve(Rect2(at.x - 14.0, at.z - 14.0, 28.0, 28.0))
	var dead := kind == "dead"
	var crew: Dictionary = CREWS.get(kind, CREWS.clinic)
	for i in 3:
		var a := i * TAU / 3.0 + 0.4
		kit.prop("tent", at + Vector3(cos(a), 0, sin(a)) * 7.0, -a, 0.9, Vector3(1.4, 1.0, 1.6))
	kit.prop("remains" if dead else "bonfire", at, 0.0, 1.0 if dead else 0.8, Vector3.ZERO if dead else Vector3(0.7, 1.0, 0.7))
	kit.prop("crates", at + Vector3(4.5, 0, -2.0), 0.6, 1.0, Vector3(0.9, 1.0, 0.7))
	kit.prop("barrels", at + Vector3(-4.0, 0, 3.0), 0.2, 1.0, Vector3(0.8, 1.0, 0.8))
	var name := "A dead camp" if dead else str(crew.name)
	if dead:
		for i in 3:
			kit.prop("body_bag", at + Vector3(rng.randf_range(-6, 6), 0, rng.randf_range(-6, 6)), rng.randf() * TAU)
		kit.lamp(Color("#8a9aa8"), 0.6, 8.0, at + Vector3(0, 2.0, 0))
		kit.interactables.append({ "pos": at + Vector3(1.5, 0, 1.5), "r": 3.0, "text": "Press E: read the journal",
			"after": "The rest of the journal is blank. They stopped writing here.",
			"act": ["lore:" + act_id(), "notice:A contestant camp. Nobody made it out. Their crew's name is scratched off the tent."] })
	else:
		kit.prop("camp_banner", at + Vector3(0, 0, -9.5), 0.0)
		kit.lamp(Color(crew.colour), 1.8, 16.0, at + Vector3(0, 2.6, 0))
		var races: Array = crew.races
		var level := _level()
		var group := "crew:%s:%d:%d" % [kind, kit.floor_number, index]
		for i in 4:
			var a := i * TAU / 4.0 + 0.8
			var p := at + Vector3(cos(a), 0, sin(a)) * 3.4
			var model := kit._pool(races[i % races.size()], ["guard", "trader", "cook", "gossip"][i])
			if kind == "scavengers":
				var m := kit.fighter_from(model, "scavenger", p, a + PI / 2.0, level, group)
				if m:
					m.def = m.def.duplicate()
					m.def.name = "Scavenger"
			else:
				kit.person(model, p, a + PI / 2.0)
		if kind == "scavengers":
			# they're friendly until they aren't
			Combat.truce_groups[group] = true
			var talk := "scav_%d_%d" % [kit.floor_number, index]
			Story.dialogue[talk] = _shakedown(group, 25 + kit.floor_number * 10)
			kit.interactables.append({ "pos": at + Vector3(0, 0, 2.5), "r": 4.0, "text": "", "talk": talk, "who": "the Scavengers" })
		else:
			kit.interactables.append({ "pos": at + Vector3(0, 0, 2.5), "r": 4.0, "text": "", "talk": "crew_" + kind, "who": name })
	kit.points.append({ "kind": "crew", "name": name, "x": at.x, "z": at.z, "level": 0 })
	crews.append({ "kind": kind, "at": at })


func _shakedown(group: String, price: int) -> Dictionary:
	return { "name": "The Scavengers", "start": [{ "go": "hello" }], "nodes": {
		"hello": { "text": "Well, well. A fresh one. This is Scavenger ground, friend. Toll's %d gold, or we take it off your body. Your choice. We're easy either way." % price, "choices": [
			{ "text": "Pay the toll. (%d gold)" % price, "if": "gold() >= %d" % price, "do": ["gold:-%d" % price, "notice:The Scavengers count it twice and wave you through. They'll remember you paid."] },
			{ "text": "Come and take it.", "do": ["aggro:" + group] },
			{ "text": "[Charisma 13] You don't want this fight. Look at me.", "check": { "stat": "CHA", "dc": 13, "pass": "bluff", "fail": "nobluff" } },
			{ "text": "Leave." } ] },
		"bluff": { "text": "...Fair. You've got a face that's killed people. Go on. Free pass. This once.", "choices": [ { "text": "Leave." } ] },
		"nobluff": { "text": "Ha! No. Pay up or bleed.", "choices": [
			{ "text": "Pay the toll. (%d gold)" % price, "if": "gold() >= %d" % price, "do": ["gold:-%d" % price] },
			{ "text": "Bleed it is.", "do": ["aggro:" + group] } ] },
	} }


# ---------------------------------------------------------------- hidden encampments
func _hidden_encampment(at: Vector3, index: int) -> void:
	kit.reserve(Rect2(at.x - 15.0, at.z - 15.0, 30.0, 30.0))
	var id := "secret_%d_%d" % [kit.floor_number, index]
	var kind: String = PUZZLES[(index + kit.floor_number * 2) % PUZZLES.size()]
	# the site itself: a ruined ring, overgrown, with a sealed hatch in the middle bearing the Builders' mark
	for i in 7:
		var a := i * TAU / 7.0
		kit.prop("broken_pillar" if i % 2 == 0 else "slab_pile", at + Vector3(cos(a), 0, sin(a)) * 10.0, a, 0.8, Vector3(0.5, 1.6, 0.5) if i % 2 == 0 else Vector3.ZERO)
	kit.prop("manhole", at, 0.0, 1.6)
	kit.lamp(Color("#9affc0"), 0.9, 10.0, at + Vector3(0, 1.4, 0))
	var puzzle := _make_puzzle(kind, id)
	Story.dialogue["puzzle_" + id] = puzzle.dialogue
	var lock_at: Vector3 = at + Vector3(0, 0, 5.0)
	kit.prop(puzzle.prop, lock_at, PI, 1.0)
	kit.interactables.append({ "pos": lock_at, "r": 3.0, "text": "", "talk": "puzzle_" + id, "say": puzzle.say })
	# the chamber beneath, reached through the hatch once it opens
	var chamber := Vector3(at.x, CHAMBER_Y, at.z)
	var story: Array = CHAMBERS[(index + kit.floor_number) % CHAMBERS.size()]
	_chamber(chamber, story, id)
	kit.interactables.append({ "pos": at, "r": 2.6, "text": "Press E: climb down through the open hatch", "teleport": chamber + Vector3(0, 0.3, 4.0),
		"needs": id, "locked": "A sealed iron hatch with the Builders' mark: a square with a line through it. Something nearby is a lock.", "how": "Somewhere on this floor someone left notes about this place. Find them." })
	# the clues, out across the floor
	for c in puzzle.clues.size():
		var spot := _find_spot(4.0)
		if spot == Vector3.INF:
			continue
		kit.prop("noticeboard" if c % 2 == 0 else "remains", spot, rng.randf() * TAU)
		kit.interactables.append({ "pos": spot, "r": 2.8, "text": puzzle.clues[c] })
		kit.points.append({ "kind": "clue", "name": "Clue", "x": spot.x, "z": spot.z, "level": 0 })
	kit.points.append({ "kind": "secret", "name": "Hidden encampment", "x": at.x, "z": at.z, "level": 0 })
	secrets.append({ "id": id, "at": at, "chamber": chamber, "puzzle": kind, "solution": puzzle.solution, "flag": id })


## A small sealed room below the floor, with the story of what happened there and something for the finder.
func _chamber(at: Vector3, story: Array, id: String) -> void:
	var wall := kit.flat(Color("#3a3438"))
	var floor_mat := kit.surface("int_floor", Vector2(14, 14), 4.0, 0.4)
	kit.block(Vector3(14, 0.4, 14), floor_mat, at - Vector3(0, 0.2, 0))
	kit.box_collider(at - Vector3(0, 0.2, 0), Vector3(7, 0.2, 7))
	kit.block(Vector3(14, 0.4, 14), wall, at + Vector3(0, 4.2, 0))
	for s: Array in [[Vector3(0, 2, -7), Vector3(7, 2, 0.2)], [Vector3(0, 2, 7), Vector3(7, 2, 0.2)], [Vector3(-7, 2, 0), Vector3(0.2, 2, 7)], [Vector3(7, 2, 0), Vector3(0.2, 2, 7)]]:
		kit.block(s[1] * 2.0, wall, at + s[0])
		kit.box_collider(at + s[0], s[1])
	var props: Array = story[1]
	for i in props.size():
		var a := i * TAU / props.size() + 0.5
		kit.prop(props[i], at + Vector3(cos(a), 0, sin(a)) * 4.2, a + PI, 1.0)
	kit.prop("loot_chest", at + Vector3(0, 0, -4.5), 0.0, 1.2)
	kit.lamp(Color("#ffcf8a"), 1.6, 12.0, at + Vector3(0, 3.2, 0), true)
	kit.interactables.append({ "pos": at + Vector3(0, 0, -3.2), "r": 3.0, "text": "Press E: open the stash",
		"after": "Empty. The page you took was the best thing in it.",
		"act": ["lore:" + act_id(), "xp:%d" % (50 + kit.floor_number * 35), "gold:%d" % (20 + kit.floor_number * 14), "marks:1",
			"notice:You found %s. %s" % [story[0], story[2]]] })
	kit.interactables.append({ "pos": at + Vector3(0, 0, 5.0), "r": 2.4, "text": "Press E: climb back up", "teleport": Vector3(at.x, 0.4, at.z) + Vector3(0, 0, 3.0) })


## A puzzle: a short run of choices with one right answer each, and the notes that give the answer away.
func _make_puzzle(kind: String, id: String) -> Dictionary:
	var steps: Array = []  # [question, options, right index]
	var clues: Array = []
	var say := "examine the lock"
	var prop := "noticeboard"
	match kind:
		"symbols":
			var pick := _shuffled(SYMBOLS).slice(0, 3)
			var times := ["01:45", "02:30", "03:10"]
			for i in 3:
				steps.append(["A stone dial carved with symbols. It wants symbol %d of 3." % (i + 1), SYMBOLS, SYMBOLS.find(pick[i])])
			var order := [2, 0, 1]
			clues.append("A torn ticket, damp: %s. TIME IN %s. And another, stapled to it: %s. TIME IN %s." % [pick[order[0]], times[order[0]], pick[order[1]], times[order[1]]])
			clues.append("A scrap pinned under a rock: %s. TIME IN %s. Someone has written: \"they open in the order they came in\"." % [pick[order[2]], times[order[2]]])
			say = "turn the symbol dial"
			prop = "clock_gear"
		"lamps":
			var pick := _shuffled(LAMPS).slice(0, 4)
			for i in 4:
				var names := []
				for l: Array in pick:
					names.append("the %s brazier" % l[0])
				steps.append(["Four cold braziers in a row. Which do you light %s?" % ["first", "second", "third", "last"][i], names, i])
			var rhyme := []
			for l: Array in pick:
				rhyme.append(l[1])
			clues.append("Scrawled under a bridge: \"First the %s, then the %s, then the %s, then the %s. Light them like you'd say it.\"" % rhyme)
			clues.append("A survivor's note: the braziers at the old ring each burn a different colour. Blood is red, moss is green, sky is blue, bone is white, a crown is gold.")
			say = "light the braziers"
			prop = "bonfire"
		"levers":
			var pattern := []
			for i in 5:
				pattern.append(rng.randi() % 2)
			for i in 5:
				steps.append(["Five rusted levers in a box. Lever %d:" % (i + 1), ["Up", "Down"], pattern[i]])
			var card := ""
			for v: int in pattern:
				card += "X " if v == 0 else "O "
			clues.append("A punched card, the kind from a time clock: %s" % card.strip_edges())
			clues.append("On a mess-hall wall: \"X means UP. O means DOWN. Don't ask how I know.\"")
			say = "work the levers"
			prop = "pump_engine"
		"password":
			var word: String = WORDS[rng.randi() % WORDS.size()]
			var options := _shuffled(WORDS).slice(0, 3)
			if not options.has(word):
				options[0] = word
			options = _shuffled(options)
			steps.append(["A speaking grille set in the stone. A dry voice: \"Word?\"", options, options.find(word)])
			clues.append("A journal, the last page: \"...keep forgetting the word for the old ring. It's the thing we all miss most down here. I wrote it on my hand: %s.\"" % word)
			clues.append("Graffiti: THE RING ASKS. THE RING LISTENS. ONE WORD.")
			say = "speak at the grille"
			prop = "manhole"
		"statues":
			var places := []
			for c: Dictionary in kit.data.get("camps", []):
				places.append(str(c.name))
			for l: Dictionary in kit.data.get("landmarks", []):
				places.append(str(l.name))
			if places.size() < 3:
				places = ["the stairs", "the town", "the dark"]
			places = places.slice(0, 4)
			var pick := _shuffled(places).slice(0, 3)
			for i in 3:
				steps.append(["Three little statues on plinths, each one turns. Face statue %d toward:" % (i + 1), places, places.find(pick[i])])
			clues.append("Under a painting of three figures: \"The first looked to %s. The second to %s.\"" % [pick[0], pick[1]])
			clues.append("On the back of a postcard: \"...and the third never took its eyes off %s.\"" % pick[2])
			say = "turn the statues"
			prop = "gnome_altar"
	var nodes := {}
	for i in steps.size():
		var step: Array = steps[i]
		var choices := []
		for o in step[1].size():
			var right: bool = o == step[2]
			var go := ("s%d" % (i + 1) if i < steps.size() - 1 else "open") if right else "wrong"
			choices.append({ "text": str(step[1][o]), "go": go })
		choices.append({ "text": "Leave it." })
		nodes["s%d" % i] = { "text": step[0], "choices": choices }
	nodes["wrong"] = { "text": "Something clunks, and everything resets. That wasn't it.", "choices": [{ "text": "Try again.", "go": "s0" }, { "text": "Leave it." }] }
	nodes["open"] = { "text": "A long grinding sound under your feet. Somewhere close by, iron scrapes on stone: the hatch is open.", "choices": [
		{ "text": "Good.", "do": ["flag:" + id, "open:" + id, "notice:SECRET OPENED · The hatch in the middle of the ring is open.", "marks:1"] }] }
	nodes["done"] = { "text": "It's already open.", "choices": [{ "text": "Leave." }] }
	var solution := []
	for step: Array in steps:
		solution.append(step[2] + 1)
	return { "dialogue": { "name": "A lock", "start": [{ "if": "flag('%s')" % id, "go": "done" }, { "go": "s0" }], "nodes": nodes },
		"clues": clues, "solution": solution, "say": say, "prop": prop }


func _shuffled(list: Array) -> Array:
	var copy := list.duplicate()
	for i in range(copy.size() - 1, 0, -1):
		var j := rng.randi() % (i + 1)
		var keep: Variant = copy[i]
		copy[i] = copy[j]
		copy[j] = keep
	return copy
