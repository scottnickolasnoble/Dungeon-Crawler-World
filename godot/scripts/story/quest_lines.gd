class_name QuestLines
extends RefCounted
## Each floor's main line and side quests, from data/quest_lines.json, put onto the real map when the floor is built.
##
## A quest's steps say what to do and where; this turns each step into a story objective and, where it needs one,
## something in the world to find or somewhere to reach. Where things go is given by a selector:
##   "camp:<name>", "landmark:<name>", "point:<kind>" (the nearest of that kind to the hub; "point:<kind>#2" the second),
##   "point:<kind>:<name>", "chamber:grand", "chamber:lesser", "chamber:<name>", "stairs", "hub".
## Step kinds:
##   kill {family, n}  boss {kind}  flag {flag}  mats {mat, n}  quest {id} (another quest done)
##   find {at, text, say}: something to pick up or use there
##   go {at}: get there
##   chamber {which}: beat that chamber's boss
##   trap {which, say}: something to fetch from inside that chamber, which turns out to be a boss chamber
## How a quest starts: "arrive": true (when you reach the floor), "with": id (when that one starts),
## "after": [ids] (when they're all done), or "board": true (a notice on the hub's board starts it).

const FILE := "res://data/quest_lines.json"
static var _all: Dictionary = {}


static func lines() -> Dictionary:
	if _all.is_empty() and FileAccess.file_exists(FILE):
		_all = JSON.parse_string(FileAccess.get_file_as_string(FILE))
	return _all


## Registers the floor's quests and puts their things on the map.
static func build(world: FloorWorld) -> void:
	var floor_lines: Dictionary = lines().get("floors", {}).get(str(world.floor_number), {})
	# the way down: a new flag that the floor's last main quest gives, and on some floors somewhere that isn't stairs
	if floor_lines.has("stairs") and world.data.has("stairs"):
		var st: Dictionary = floor_lines.stairs
		var old_flag: String = world.data.stairs.get("flag", "-")
		for item: Dictionary in world.interactables:
			if item.has("needs") and item.needs == old_flag:
				item.needs = str(st.get("flag", old_flag))
				item.how = str(st.get("how", item.get("how", "")))
				item.locked = str(st.get("locked", item.get("locked", "")))
				if st.has("exit"):
					var exit_at := _where(world, str(st.exit.at))
					if exit_at != Vector3.INF:
						var exit := item.duplicate()
						exit.pos = exit_at + Vector3(0, 0, 3.0)
						exit.text = str(st.exit.get("text", item.text))
						world.interactables.append(exit)
						item.erase("to")
						item.erase("needs")
						item.text = str(st.exit.get("old", "Bricked up. The way down is somewhere else."))
				break
		world.data.stairs.flag = str(st.get("flag", old_flag))
		world.data.stairs.how = str(st.get("how", ""))
	if floor_lines.has("hazard"):
		_hazard(world, floor_lines.hazard)
	var board_quests: Array = world.wilds.board_quests.duplicate() if world.wilds else []
	for id: String in floor_lines.get("quests", {}):
		var q: Dictionary = floor_lines.quests[id].duplicate(true)
		var obj: Array = []
		var steps: Array = q.get("steps", [])
		for i in steps.size():
			obj.append(_step(world, id, i, steps[i]))
		var def: Dictionary = { "name": q.name, "giver": q.get("giver", ""), "main": q.get("main", false), "desc": q.get("desc", ""),
			"obj": obj, "reward": q.get("reward", {}), "auto": q.get("auto", q.get("giver", "") == "") }
		for key: String in ["after", "with", "arrive", "needs", "timer"]:
			if q.has(key):
				def[key] = q[key]
		def.floor = world.floor_number
		Story.quests_def[id] = def
		if q.get("board", false):
			board_quests.append(id)
	if not board_quests.is_empty():
		_notice_board(world, board_quests)


## One step: its objective, plus whatever in the world it needs.
static func _step(world: FloorWorld, id: String, i: int, s: Dictionary) -> Dictionary:
	var label: String = s.get("label", "")
	match str(s.t):
		"find", "trap":
			var flag := "qs_%s_%d" % [id, i]
			var at: Vector3 = _where(world, str(s.get("at", s.get("which", ""))))
			if s.t == "trap":
				var chamber := _chamber(world, str(s.which))
				if chamber:
					at = chamber.dais_spot()
					chamber.trap = true
			if at == Vector3.INF:
				at = world.spawn + Vector3(6, 0, 6)
			else:
				at = _beside(world, at, i, s.t == "trap")
			if s.t == "find" and s.get("prop", "") != "-":
				world.prop(str(s.get("prop", "loot_chest")), at, float(i) * 1.3, 0.8)
				world.lamp(Color("#ffd27a"), 1.2, 6.0, at + Vector3.UP * 1.6)
			world.interactables.append({ "pos": at, "r": 3.0, "text": "Press E: %s" % s.get("say", "search here"),
				"act": ["flag:" + flag] + Array(s.get("act", [])) + (["notice:" + str(s.text)] if s.has("text") else []), "step": [id, i] })
			return { "t": "flag", "flag": flag, "label": label }
		"go":
			var name := "qs_%s_%d" % [id, i]
			var where := str(s.at)
			var at: Vector3 = _where(world, where)
			if at == Vector3.INF:
				at = world.spawn
			world.quest_places.append({ "name": name, "pos": at, "r": float(s.get("r", 18.0)) })
			return { "t": "visit", "poi": name, "label": label }
		"chamber":
			var chamber := _chamber(world, str(s.which))
			var kind: String = chamber.kind if chamber else str(s.get("kind", ""))
			return { "t": "boss", "kind": kind, "label": label }
		"quest":
			return { "t": "flag", "flag": "done_" + str(s.id), "label": label }
	var o: Dictionary = s.duplicate()
	o.erase("at")
	return o


## A spot a few metres off the named place, so the thing isn't buried in the middle of a camp's fire.
static func _beside(world: FloorWorld, at: Vector3, i: int, exact: bool) -> Vector3:
	if exact:
		return at
	var a := float(i) * 2.1 + float(world.floor_number)
	return at + Vector3(cos(a), 0, sin(a)) * 7.0


static func _where(world: FloorWorld, sel: String) -> Vector3:
	var parts := sel.split(":")
	match parts[0]:
		"hub":
			return world.spawn + Vector3(5, 0, 5)
		"stairs":
			return Vector3(world.data.stairs.x, 0, world.data.stairs.z) + Vector3(0, 0, 4.0)
		"camp":
			for c: Dictionary in world.data.get("camps", []):
				if c.name == parts[1]:
					return Vector3(c.x, 0, c.z)
		"landmark":
			for l: Dictionary in world.data.get("landmarks", []):
				if l.name == parts[1]:
					return Vector3(l.x, 0, l.z)
		"chamber":
			var chamber := _chamber(world, parts[1])
			if chamber:
				return chamber.gate_spot
		"point":
			var kind_n := parts[1].split("#")
			var nth := int(kind_n[1]) - 1 if kind_n.size() > 1 else 0
			var found: Array = []
			for pt: Dictionary in world.points:
				if pt.kind == kind_n[0] and (parts.size() < 3 or pt.name == parts[2]):
					found.append(pt)
			found.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
				return Vector2(a.x, a.z).length() < Vector2(b.x, b.z).length())
			if found.size() > 0:
				var pt: Dictionary = found[clampi(nth, 0, found.size() - 1)]
				return Vector3(pt.x, 0, pt.z)
	return Vector3.INF


static func _chamber(world: FloorWorld, which: String) -> BossChamber:
	if world.wilds == null:
		return null
	for c: BossChamber in world.wilds.chambers:
		var grand: bool = c.get_meta("grand", false)
		if (which == "grand" and grand) or (which == "lesser" and not grand and c.entry.has("camp_name")) or c.entry.get("name", "") == which or c.kind == which:
			return c
	return null


## The hub's notice board: jobs pinned up by people who'd rather not do them themselves.
static func _notice_board(world: FloorWorld, ids: Array) -> void:
	var at := world.spawn + Vector3(-6, 0, 4)
	world.prop("noticeboard", at, 0.4)
	var talk := "board_%d" % world.floor_number
	var choices: Array = []
	for id: String in ids:
		choices.append({ "text": "Take down: \"%s\"" % Story.quests_def[id].name, "if": "not started('%s')" % id, "do": ["start:" + id] })
	choices.append({ "text": "Leave it." })
	Story.dialogue[talk] = { "name": "Notice Board", "start": [{ "go": "board" }], "nodes": { "board": {
		"text": "A cork board covered in jobs, warnings and missing-contestant posters. Some of the pins are bones.", "choices": choices } } }
	world.interactables.append({ "pos": at + Vector3(0, 0, 1.5), "r": 3.0, "text": "", "talk": talk, "say": "read the notice board" })


## A floor-wide hazard, and where the heat is: the hub, plus every place of the kinds listed, each with a fire barrel.
static func _hazard(world: FloorWorld, hz: Dictionary) -> void:
	world.hazard = hz
	world.heat_spots.append(world.spawn)
	for sel: String in hz.get("heat", []):
		var parts := sel.split(":")
		var spots: Array[Vector3] = []
		if parts[0] == "point":
			for pt: Dictionary in world.points:
				if pt.kind == parts[1]:
					spots.append(Vector3(pt.x, 0, pt.z))
		else:
			var at := _where(world, sel)
			if at != Vector3.INF:
				spots.append(at)
		for at: Vector3 in spots:
			var spot := at + Vector3(4.0, 0, 3.0)
			world.prop("kit_fire_barrel", spot, 0.0, 1.0)
			world.lamp(Color("#ff9a4a"), 2.2, 12.0, spot + Vector3.UP * 1.6)
			world.heat_spots.append(spot)
