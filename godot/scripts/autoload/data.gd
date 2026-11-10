extends Node
## All game data converted from the prototype (see tools/export_prototype.mjs). Available everywhere as `Data`.

var classes: Dictionary
var skills: Dictionary
var loot: Dictionary
var crafting: Dictionary
var monsters: Dictionary
var quests: Dictionary
var npcs: Dictionary
var floors: Dictionary
## Boss chambers, two per floor (data/chambers.json): floor number -> list of chambers.
var chambers: Dictionary


func _ready() -> void:
	classes = _load("classes")
	skills = _load("skills")
	loot = _load("loot")
	crafting = _load("crafting")
	monsters = _load("monsters")
	quests = _load("quests")
	npcs = _load("npcs")
	floors = _load("floors")
	# Floors 7-9 have no layouts in the prototype, so they're designed here and kept apart from its export.
	floors.merge(_load("floors_undercity"))
	# Floors 10-18 (art/WORLD.md), built by tools/build_floors_deep.mjs
	floors.merge(_load("floors_deep"))
	chambers = _load("chambers").get("floors", {})
	var abilities := ["slam", "charge", "barrage", "nova", "sweep", "puddle", "keys", "summon", "whistle"]
	for f: String in chambers:
		for c: Dictionary in chambers[f]:
			var k := str(c.boss).length() + int(f)
			monsters.monsters[c.boss] = { "name": str(c.title).capitalize(), "title": "Chamber Boss · %s" % c.name, "boss": true, "chamber": true,
				"hp": 700 + int(f) * 20, "dmg": 16 + int(f) * 0.5, "speed": 3.4, "reach": 3.0, "arc": 1.8, "windup": 0.75, "swing": 0.22, "recover": 0.7,
				"xp": 1400 + int(f) * 200, "aggro": 999, "leash": 9999, "abilities": [abilities[k % 9], abilities[(k + 3) % 9], abilities[(k + 6) % 9]],
				"barks": [], "enrage": "%s IS FURIOUS" % str(c.title) }
	# fighters that aren't in the prototype: contestants, and the factions' new units
	var world: Dictionary = _load("monsters_world").get("monsters", {})
	monsters.monsters.merge(world)
	# a chamber boss given its own stats and moves (Clamp...) replaces the stand-in made for it above
	for k: String in world:
		if monsters.monsters[k].get("chamber", false):
			monsters.monsters[k] = world[k]


func _load(file_name: String) -> Dictionary:
	var path := "res://data/%s.json" % file_name
	var text := FileAccess.get_file_as_string(path)
	if text.is_empty():
		push_error("Data file missing or empty: " + path)
		return {}
	var parsed: Variant = JSON.parse_string(text)
	if parsed is Dictionary:
		return parsed
	push_error("Data file is not valid JSON: " + path)
	return {}
