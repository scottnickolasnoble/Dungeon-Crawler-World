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


func _ready() -> void:
	classes = _load("classes")
	skills = _load("skills")
	loot = _load("loot")
	crafting = _load("crafting")
	monsters = _load("monsters")
	quests = _load("quests")
	npcs = _load("npcs")
	floors = _load("floors")


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
