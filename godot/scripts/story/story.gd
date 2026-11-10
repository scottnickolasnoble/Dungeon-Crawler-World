extends Node
## The story: quests, flags, the things you've collected, and what the dungeon thinks you've done. Ported from the
## prototype's game/story.js (Q.start, Q.complete, Q.event) and extended for art/STORY.md. Autoloaded as Story.
## Quests come from data/quests.json (the prototype's 30) plus data/story_quests.json (new ones from STORY.md).
## Conversations live in data/dialogue.json; their conditions are small expressions run against this node.

signal changed
signal notice(text: String, color: Color)
signal banner(text: String, color: Color)
## A puzzle was solved: the floor opens whatever that id was sealing.
signal opened(id: String)
## A timed step ran out and was undone: whatever it put in the world should be usable again.
signal step_reset(id: String, i: int)
## A timed quest failed in a way that sends you back to the hub.
signal sent_home

const NETWORK := Color("#ff4fd8")
const GOLD := Color("#f5c518")
const GREEN := Color("#7be38a")

var quests_def: Dictionary = {}
var dialogue: Dictionary = {}
## id -> { st: "active" | "done", prog: [int, ...] }
var quests: Dictionary = {}
var flags: Dictionary = {}
var mats: Dictionary = {}
var counters: Dictionary = {}
## Places on this floor you can visit: [{ name, pos, r }].
var places: Array = []
## Lore pages found, by act: { "1": [page index, ...] }.
var lore_found: Dictionary = {}
var lore: Dictionary = {}
## The hidden club's reputation (art/WORLD.md, section 4).
var marks := 0
## Discovery cutscenes (data/discoveries.json): what's been seen, so each plays once.
var discoveries: Dictionary = {}
var seen: Dictionary = {}
## Off for the automatic checks and screenshots, which mustn't stop for a film.
var cutscenes_on := true
var _visited: Dictionary = {}
## The clock on screen while a timed quest runs: { label, left, total, quest }, or empty.
var countdown: Dictionary = {}
var _place_clock := 0.0
## What a monster drops for quests (the inventory proper comes later): kind -> [material, chance].
const DROPS := { "goblin": ["coneplastic", 0.7], "thrower": ["coneplastic", 0.7], "pylon": ["coneplastic", 1.0], "mimic": ["spring", 0.6], "cardboard": ["cardboard", 0.5] }
const MAT_NAMES := { "coneplastic": "Cone Plastic", "spring": "Mimic Spring", "cardboard": "Wet Cardboard" }


func _ready() -> void:
	quests_def = Data.quests.get("quests", {}).duplicate(true)
	quests_def.merge(_load("story_quests").get("quests", {}))
	dialogue = _load("dialogue")
	lore = _load("lore").get("acts", {})
	discoveries = _load("discoveries")
	# Nigel's narrations for the deeper floors and the chamber bosses, one file per batch in data/narration/
	var more := DirAccess.get_files_at("res://data/narration") if DirAccess.dir_exists_absolute("res://data/narration") else PackedStringArray()
	for file: String in more:
		if file.ends_with(".json"):
			var batch: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/narration/" + file))
			if batch is Dictionary:
				discoveries.monsters.merge(batch, true)
	Combat.mob_killed.connect(_on_kill)


func _load(file_name: String) -> Dictionary:
	var f := FileAccess.open("res://data/%s.json" % file_name, FileAccess.READ)
	if f == null:
		push_error("Missing data file: " + file_name)
		return {}
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	return parsed if parsed is Dictionary else {}


## A fresh start: no quests, flags, materials or truces.
func reset() -> void:
	quests.clear()
	countdown = {}
	flags.clear()
	mats.clear()
	counters.clear()
	_visited.clear()
	_ready_shown.clear()
	lore_found.clear()
	marks = 0
	seen.clear()
	Combat.truce_groups.clear()
	changed.emit()


# ---------------------------------------------------------------- quests
func start(id: String) -> void:
	if quests.has(id) or not quests_def.has(id):
		return
	var q: Dictionary = quests_def[id]
	var prog := []
	for o in q.obj:
		prog.append(0)
	quests[id] = { "st": "active", "prog": prog }
	notice.emit("NEW QUEST%s · %s\n%s" % [" · MAIN STORY" if q.get("main", false) else "", q.name, q.desc], GOLD if q.get("main", false) else GREEN)
	_check_ready()
	changed.emit()


## Hands a quest in if everything on its list is done (or always, when forced).
func complete(id: String, forced := false) -> void:
	if not quests.has(id) or quests[id].st == "done" or not (forced or is_ready(id)):
		return
	var q: Dictionary = quests_def[id]
	for o: Dictionary in q.obj:
		if o.t == "mats":
			mats[o.mat] = int(mats.get(o.mat, 0)) - int(o.n)
	quests[id].st = "done"
	var r: Dictionary = q.get("reward", {})
	var bits := []
	if r.has("xp"):
		Combat.gain_xp(int(r.xp))
		bits.append("+%d XP" % int(r.xp))
	if r.has("gold"):
		Combat.gold += int(r.gold)
		bits.append("+%d gold" % int(r.gold))
	for f: String in r.get("flags", []):
		flags[f] = true
	flags["done_" + id] = true
	if r.has("box"):
		bits.append("a %s box" % r.box)
	if r.has("item") or r.has("gear"):
		bits.append("gear (arrives with the inventory)")
	notice.emit("QUEST COMPLETE · %s\n%s" % [q.name, " · ".join(bits)], GOLD)
	_check_ready()
	changed.emit()


## Finishes a quest even if its list isn't ticked off, for story choices that solve it another way.
func force(id: String) -> void:
	if not quests.has(id):
		start(id)
	complete(id, true)


func state(id: String) -> String:
	return quests[id].st if quests.has(id) else ""


func obj_done(id: String, i: int) -> bool:
	var o: Dictionary = quests_def[id].obj[i]
	match o.t:
		"count":
			return int(counters.get(o.key, 0)) >= int(o.n)
		"mats":
			return int(mats.get(o.mat, 0)) >= int(o.n)
		"flag":
			return flags.get(o.flag, false)
	return int(quests[id].prog[i]) >= int(o.get("n", 1))


func is_ready(id: String) -> bool:
	if not quests.has(id) or quests[id].st != "active":
		return false
	for i in quests_def[id].obj.size():
		if not obj_done(id, i):
			return false
	return true


var _ready_shown: Dictionary = {}


func _check_ready() -> void:
	_chain_starts()
	for id: String in quests.keys():
		if quests[id].st == "active" and quests_def[id].get("auto", false) and is_ready(id):
			complete(id)
			continue
		if is_ready(id) and not _ready_shown.has(id) and quests_def[id].get("giver", "") != "":
			_ready_shown[id] = true
			var giver: String = quests_def[id].get("giver", "")
			notice.emit("QUEST READY · %s\nGo back to %s." % [quests_def[id].name, npc_name(giver)], GREEN)


## Something happened: a kill, a boss down, a place visited. Ticks any quest objective it matches.
func event(type: String, data: Dictionary = {}) -> void:
	for id: String in quests:
		if quests[id].st != "active":
			continue
		var objs: Array = quests_def[id].obj
		for i in objs.size():
			var o: Dictionary = objs[i]
			if o.t != type:
				continue
			var hit := false
			match type:
				"kill":
					hit = (not o.has("family") or o.family == data.get("kind") or o.family == data.get("family")) \
						and (not o.has("floor") or str(o.floor) == str(data.get("floor", "")))
				"boss":
					hit = o.kind == data.get("kind")
				"visit":
					hit = o.poi == data.get("name")
			if hit:
				quests[id].prog[i] = int(quests[id].prog[i]) + 1
	_check_ready()
	changed.emit()


func set_flag(f: String, on := true) -> void:
	flags[f] = on
	_check_ready()
	changed.emit()


func count(key: String, by := 1) -> void:
	counters[key] = int(counters.get(key, 0)) + by
	_check_ready()
	changed.emit()


func add_mat(mat: String, n: int) -> void:
	mats[mat] = int(mats.get(mat, 0)) + n
	notice.emit("+%d %s  (%d)" % [n, MAT_NAMES.get(mat, mat), mats[mat]], Color("#cfd6dd"))
	_check_ready()
	changed.emit()


func _on_kill(m: Node) -> void:
	var floor_index: int = get_tree().current_scene.floor_index if get_tree().current_scene and "floor_index" in get_tree().current_scene else -1
	event("kill", { "kind": m.kind, "family": m.def.get("model", ""), "floor": floor_index })
	if m.def.get("boss", false):
		flags[m.kind + "_handled"] = true
		flags["any_boss"] = true
		event("boss", { "kind": m.kind })
		if m.kind == "pylon":
			flags.pylon_handled = true
			flags.pylon_killed = true
			notice.emit("Under Pylon Point, something that was sealed in shifts. The cones are down.", NETWORK)
	var drop: Array = DROPS.get(m.kind, [])
	if not drop.is_empty() and randf() < float(drop[1]):
		add_mat(drop[0], 1 + (1 if randf() < 0.3 else 0))


# ---------------------------------------------------------------- truces: camps that leave you alone
func truce(group: String, on := true) -> void:
	if on:
		Combat.truce_groups[group] = true
		notice.emit("TRUCE · %s won't attack you unless you attack them." % group.get_slice(":", 1), GREEN)
	else:
		Combat.truce_groups.erase(group)


# ---------------------------------------------------------------- places
func set_places(list: Array) -> void:
	places = list


func _process(delta: float) -> void:
	_timers(delta)
	_place_clock -= delta
	if _place_clock > 0.0 or Combat.player == null:
		return
	_place_clock = 0.5
	var at: Vector3 = Combat.player.global_position
	for p: Dictionary in places:
		if _visited.has(p.name):
			continue
		if Vector2(at.x - p.pos.x, at.z - p.pos.z).length() < float(p.r):
			_visited[p.name] = true
			event("visit", { "name": p.name })


# ---------------------------------------------------------------- talking
func npc_name(id: String) -> String:
	return str(dialogue.get(id, {}).get("name", id.capitalize()))


## "!" if someone has a quest to give you, "?" if you have one to hand in, "" otherwise.
func marker(npc: String) -> String:
	for id: String in quests:
		if quests_def[id].get("giver", "") == npc and is_ready(id):
			return "?"
	var offers: Array = dialogue.get(npc, {}).get("offers", [])
	for id: String in offers:
		if not quests.has(id) and _offer_open(id):
			return "!"
	return ""


func _offer_open(id: String) -> bool:
	var need: String = quests_def.get(id, {}).get("needs", "")
	return need == "" or check(need)


## Runs a condition from the dialogue file, such as "is_ready('nobody_out') and not flag('met_marta')".
func check(condition: String) -> bool:
	if condition.strip_edges() == "":
		return true
	var expr := Expression.new()
	if expr.parse(condition) != OK:
		push_error("Bad condition: %s (%s)" % [condition, expr.get_error_text()])
		return false
	var result: Variant = expr.execute([], self)
	return result == true


## Runs an action from the dialogue file: "start:q", "complete:q", "force:q", "flag:f", "unflag:f", "gold:-100",
## "xp:50", "mat:coneplastic:-12", "heal", "truce:camp:Pylon Point", "notice:...", "network:...", "banner:...".
func act(action: String) -> void:
	var parts := action.split(":", true, 1)
	var arg := parts[1] if parts.size() > 1 else ""
	match parts[0]:
		"start":
			start(arg)
		"complete":
			complete(arg)
		"force":
			force(arg)
		"flag":
			set_flag(arg)
		"unflag":
			set_flag(arg, false)
		"gold":
			Combat.gold += int(arg)
		"xp":
			Combat.gain_xp(int(arg))
		"mat":
			add_mat(arg.get_slice(":", 0), int(arg.get_slice(":", 1)))
		"heal":
			Combat.heal_full()
		"truce":
			truce(arg)
		"notice":
			notice.emit(arg, GOLD)
		"network":
			notice.emit("NETWORK NOTICE: " + arg, NETWORK)
		"banner":
			banner.emit(arg, GOLD)
		"lore":
			find_lore(arg)
		"count":
			count(arg.get_slice(":", 0), int(arg.get_slice(":", 1)) if arg.contains(":") else 1)
		"marks":
			marks += int(arg)
			notice.emit("+%d MARKS · The club hears about everything. (%d)" % [int(arg), marks], Color("#c8a8ff"))
		"open":
			opened.emit(arg)
		"aggro":
			Combat.truce_groups.erase(arg)
			for m: Node in Combat.mobs:
				if is_instance_valid(m) and m.group == arg and not m.dead:
					m._engage()
	changed.emit()


## The cutscene entry for a monster kind or a race, if there is one.
func discovery(kind: String, is_race := false) -> Dictionary:
	return discoveries.get("races" if is_race else "monsters", {}).get(kind, {})


## The next unread lore page of an act ("1" to "6").
func find_lore(act_id: String) -> void:
	var pages: Array = lore.get(act_id, {}).get("pages", [])
	var have: Array = lore_found.get(act_id, [])
	for i in pages.size():
		if not have.has(i):
			have.append(i)
			lore_found[act_id] = have
			var page: Dictionary = pages[i]
			notice.emit("LORE PAGE · %s (%d of %d)
%s" % [page.title, have.size(), pages.size(), page.text], Color("#e8d8a8"))
			return
	notice.emit("Nothing new here. You've read everything this part of the Stack has to say.", Color("#cfd6dd"))


func lore_count() -> int:
	var n := 0
	for k: String in lore_found:
		n += lore_found[k].size()
	return n


# helpers the dialogue conditions can call
func flag(f: String) -> bool:
	return flags.get(f, false)


func active(id: String) -> bool:
	return state(id) == "active"


func done(id: String) -> bool:
	return state(id) == "done"


## Quest lines (see QuestLines): a quest starts by itself when the one it goes "with" starts, or when everything
## it comes "after" is done.
var _chaining := false


func _chain_starts() -> void:
	if _chaining:
		return
	_chaining = true
	for id: String in quests_def.keys():
		if quests.has(id):
			continue
		var q: Dictionary = quests_def[id]
		if q.has("with") and quests.has(str(q.with)):
			start(id)
		elif q.has("after") and not (q.after as Array).is_empty() and (q.after as Array).all(func(a: Variant) -> bool: return done(str(a))):
			start(id)
	_chaining = false


## Starts the quests that begin the moment you reach this floor.
func arrive(floor_index: int) -> void:
	for id: String in quests_def.keys():
		var q: Dictionary = quests_def[id]
		if q.get("arrive", false) and int(q.get("floor", -1)) == floor_index and not quests.has(id):
			start(id)


## True while step i is the one being worked on: the quest is active, the steps before it are done and it isn't.
func step_open(id: String, i: int) -> bool:
	if state(id) != "active":
		return false
	for j in i:
		if not obj_done(id, j):
			return false
	return not obj_done(id, i)


# ---------------------------------------------------------------- timed quests
## A quest with a "timer" { s, from, to, reset, label, fail, home } gives you s seconds, from when step "from" opens,
## to finish every step up to "to". Run out and the steps from "reset" to "to" are undone (a boss stays dead), and
## with "home" you're sent back to the hub.
func _timers(delta: float) -> void:
	countdown = {}
	for id: String in quests:
		var t: Dictionary = quests_def.get(id, {}).get("timer", {})
		if t.is_empty() or quests[id].st != "active":
			continue
		var obj: Array = quests_def[id].obj
		var from: int = t.get("from", 0)
		var to: int = mini(int(t.get("to", obj.size() - 1)), obj.size() - 1)
		var running := true
		for j in from:
			if not obj_done(id, j):
				running = false
		var finished := true
		for j in range(from, to + 1):
			if not obj_done(id, j):
				finished = false
		if not running or finished:
			quests[id].erase("tleft")
			continue
		var left: float = float(quests[id].get("tleft", float(t.s))) - delta
		quests[id].tleft = left
		countdown = { "label": str(t.get("label", quests_def[id].name)), "left": left, "total": float(t.s), "quest": id }
		if left <= 0.0:
			_fail_timer(id, t, int(t.get("reset", from)), to)
			countdown = {}


func _fail_timer(id: String, t: Dictionary, from: int, to: int) -> void:
	quests[id].erase("tleft")
	var obj: Array = quests_def[id].obj
	for j in range(from, to + 1):
		var o: Dictionary = obj[j]
		if o.t == "flag" and str(o.flag).begins_with("qs_"):
			flags.erase(o.flag)
		elif o.t == "visit":
			quests[id].prog[j] = 0
			_visited.erase(o.poi)
		elif o.t in ["kill", "count"]:
			quests[id].prog[j] = 0
		step_reset.emit(id, j)
	notice.emit(str(t.get("fail", "OUT OF TIME.")), Color("#ff5a3a"))
	banner.emit("TOO LATE", Color("#ff5a3a"))
	if t.get("home", false):
		sent_home.emit()
	changed.emit()


func started(id: String) -> bool:
	return quests.has(id)


func gold() -> int:
	return Combat.gold


func cha() -> int:
	return int(Combat.stats.CHA)


func hurt() -> bool:
	return Combat.hp < Combat.max_hp() - 1.0


func mat(m: String) -> int:
	return int(mats.get(m, 0))


## Every active quest with its objectives, for the tracker.
func tracker_lines() -> Array:
	var out := []
	for id: String in quests:
		if quests[id].st != "active":
			continue
		var q: Dictionary = quests_def[id]
		var lines := []
		for i in q.obj.size():
			var o: Dictionary = q.obj[i]
			var tally := ""
			if o.t in ["kill", "count", "mats"]:
				var have := int(quests[id].prog[i])
				if o.t == "count":
					have = int(counters.get(o.key, 0))
				elif o.t == "mats":
					have = int(mats.get(o.mat, 0))
				tally = " %d/%d" % [mini(have, int(o.n)), int(o.n)]
			lines.append([obj_done(id, i), str(o.label) + tally])
		out.append({ "name": q.name, "main": q.get("main", false), "ready": is_ready(id), "lines": lines })
	return out
