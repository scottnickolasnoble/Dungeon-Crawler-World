extends Node3D
## Starts the game: loads a floor, spawns the player, handles the mouse and travel between floors.
## A small HUD covers the time until the full HUD in Phase 4.

const PLAYER_SCENE := preload("res://scenes/player.tscn")

var player: Player
var current_floor: Node3D
var floor_index := 0
var _nearby: Dictionary = {}
## While riding a zip line: { from, to, t, length }. Empty when not riding.
var _ride: Dictionary = {}
var _ride_handle: Node3D
var _spawn := Vector3.ZERO
var hud: CombatHud
var story_hud: StoryHud
var dialogue: DialogueBox
var cutscene: DiscoveryCutscene
var _watch_clock := 0.0
## The vehicle being driven, if any.
var driving: Vehicle
var _car_yaw := 0.0

@onready var hint: Label = $HUD/Hint
@onready var location: Label = $HUD/Location
@onready var stamina_bar: ProgressBar = $HUD/Stamina
@onready var prompt: Label = $HUD/Prompt


func _ready() -> void:
	player = PLAYER_SCENE.instantiate()
	add_child(player)
	stamina_bar.max_value = Player.MAX_STAMINA
	hud = CombatHud.new()
	hud.name = "CombatHud"
	$HUD.add_child(hud)
	Combat.player_died.connect(_on_died)
	story_hud = StoryHud.new()
	story_hud.interactables = func() -> Array: return current_floor.get("interactables") if current_floor else []
	$HUD.add_child(story_hud)
	dialogue = DialogueBox.new()
	$HUD.add_child(dialogue)
	dialogue.closed.connect(_on_dialogue_closed)
	cutscene = DiscoveryCutscene.new()
	$HUD.add_child(cutscene)
	travel_map = TravelMap.new()
	$HUD.add_child(travel_map)
	travel_map.travel.connect(_travel_to)
	Story.step_reset.connect(_on_step_reset)
	Story.sent_home.connect(_on_sent_home)
	Story.notice.connect(func(text: String, color: Color) -> void: hud.show_notice(text, color, 6.0))
	Story.banner.connect(func(text: String, color: Color) -> void: hud.show_banner(text, color, 3.5))
	_set_captured(false)
	var start := 0
	var args := OS.get_cmdline_user_args()
	for arg in args:
		if arg.begins_with("--floor="):
			start = arg.trim_prefix("--floor=").to_int()
	load_floor(start)
	if not args.is_empty() and (args.has("--autotest") or _has_shots(args)):
		var runner: Node = load("res://scripts/debug/autotest.gd").new()
		runner.name = "Autotest"
		add_child(runner)
	for arg in args:
		if arg.begins_with("--boss-demo=") or arg.begins_with("--camp-demo="):
			var demo: Node = load("res://scripts/debug/boss_demo.gd").new()
			demo.name = "BossDemo"
			add_child(demo)


func _has_shots(args: PackedStringArray) -> bool:
	for arg in args:
		if arg.begins_with("--shots=") or arg.begins_with("--map="):
			return true
	return false


func load_floor(index: int) -> void:
	Combat.forget_floor()
	if driving:
		_stop_driving()
	if current_floor:
		current_floor.free()
	floor_index = index
	var spawn: Vector3
	var title: String
	if index == 0:
		current_floor = Floor0.new()
		spawn = Floor0.SPAWN
		title = Floor0.FLOOR_NAME
	else:
		var world: FloorWorld = FloorWorld.new().setup(index)
		current_floor = world
		spawn = world.spawn
		title = world.data.name
	current_floor.name = "Floor"
	add_child(current_floor)
	_spawn = spawn
	player.global_position = spawn
	player.velocity = Vector3.ZERO
	player.yaw = 0.0
	player.pitch = 0.0
	location.text = title
	_story_on_arrival(index)


## What the story notices when you arrive somewhere, and the places on this floor that count as visited.
## A timed step was undone: its things in the world can be used again.
func _on_step_reset(id: String, i: int) -> void:
	var list: Variant = current_floor.get("interactables")
	if list is Array:
		for item: Dictionary in list:
			if item.has("step") and str(item.step[0]) == id and int(item.step[1]) == i:
				item.used = false


## A timed quest failed and threw you out: back to the hub, healed, a little humiliated.
func _on_sent_home() -> void:
	if current_floor is FloorWorld:
		var world: FloorWorld = current_floor
		player.global_position = world.lift(world.spawn) + Vector3.UP * 0.5
		player.velocity = Vector3.ZERO
		Combat.heal_full()


func _story_on_arrival(index: int) -> void:
	var places: Array = []
	if current_floor is FloorWorld:
		var world: FloorWorld = current_floor
		for l: Dictionary in world.data.get("landmarks", []):
			places.append({ "name": l.name, "pos": Vector3(l.x, 0, l.z), "r": float(l.get("r", 16)) + 4.0 })
		for c: Dictionary in world.data.get("camps", []):
			places.append({ "name": c.name, "pos": Vector3(c.x, 0, c.z), "r": float(c.get("r", 20)) + 4.0 })
		for pt: Dictionary in world.points:
			places.append({ "name": pt.name, "pos": Vector3(pt.x, 0, pt.z), "r": 12.0 })
		places.append_array(world.quest_places)
	Story.set_places(places)
	Story.arrive(index)
	match index:
		0:
			Story.start("tut_desk")
		1:
			Story.set_flag("reached_f1")
			Story.complete("tut_down")
			Story.start("arrival")


func _process(_delta: float) -> void:
	stamina_bar.value = player.stamina
	_watch_for_new(_delta)
	_update_ride(_delta)
	_update_driving()
	_nearby = {}
	var list: Variant = current_floor.get("interactables")
	if list is Array:
		var best := INF
		for item: Dictionary in list:
			# things down in a cave or bunker only count when you are down there too
			var item_y: float = item.pos.y
			if item_y > -20.0 and current_floor.has_method("ground"):
				item_y += current_floor.ground(item.pos.x, item.pos.z)
			if absf(item_y - player.global_position.y) > 14.0:
				continue
			if item.has("step") and not Story.step_open(str(item.step[0]), int(item.step[1])):
				continue
			var distance := Vector2(item.pos.x - player.global_position.x, item.pos.z - player.global_position.z).length()
			if distance < float(item.r) and distance < best:
				best = distance
				_nearby = item
	prompt.visible = not _nearby.is_empty()
	if prompt.visible:
		prompt.text = _prompt_for(_nearby)
	prompt.visible = prompt.visible and not dialogue.is_open()


## Most things say the same thing every time; a loot box says how many monsters still guard it.
func _prompt_for(item: Dictionary) -> String:
	if item.has("talk"):
		var mark := Story.marker(item.talk)
		var verb: String = item.get("say", "talk to " + str(item.get("who", Story.npc_name(item.talk))))
		return "Press E: %s%s" % [verb, "  (%s)" % mark if mark != "" else ""]
	if item.has("needs") and not Story.flag(item.needs):
		return str(item.locked)
	if item.has("act") and item.get("used", false):
		return str(item.get("after", item.text))
	if item.has("loot"):
		if item.get("opened", false):
			return "An empty loot box. The crowd already saw what was in it."
		var left := Combat.alive_in(item.loot)
		if left > 0:
			return "%s · locked until the camp is cleared (%d left)" % [item.title, left]
		return "Press E: open %s" % item.title
	return item.text


func _start_driving(car: Vehicle) -> void:
	driving = car
	_car_yaw = car.rotation.y
	player.set_physics_process(false)
	player.velocity = Vector3.ZERO
	player.viewmodel.visible = false
	player.can_fight = false
	player.yaw = car.rotation.y + PI
	car.get_in(player)
	hud.show_notice("Driving the %s. W/S to drive, A/D to steer, Space to brake, E to get out. Run monsters over at your own risk." % car.title, Color("#cfd6dd"), 5.0)


func _stop_driving() -> void:
	player.global_position = driving.get_out()
	driving = null
	player.set_physics_process(true)
	player.viewmodel.visible = true
	player.can_fight = true


func _update_driving() -> void:
	if driving == null:
		return
	if not is_instance_valid(driving):
		driving = null
		return
	# the driver turns with the car, and can still look around
	player.yaw += driving.rotation.y - _car_yaw
	_car_yaw = driving.rotation.y
	player.global_position = driving.global_position + Vector3.UP * (Vehicle.EYE - Player.EYE_HEIGHT)


## The first time a new monster, boss or race comes into view, its story plays.
func _watch_for_new(delta: float) -> void:
	_watch_clock -= delta
	if _watch_clock > 0.0 or not Story.cutscenes_on or cutscene.playing or dialogue.is_open() or Combat.hp <= 0.0:
		return
	_watch_clock = 0.5
	var cam := player.camera
	var forward := -cam.global_transform.basis.z
	var eye := cam.global_position
	for m: Node in Combat.mobs:
		if not is_instance_valid(m) or m.dead or Story.seen.has(m.kind):
			continue
		var to: Vector3 = m.global_position + Vector3.UP * m.height * 0.6 - eye
		if to.length() < 24.0 and forward.dot(to.normalized()) > 0.55:
			Story.seen[m.kind] = true
			var entry := Story.discovery(m.kind)
			if not entry.is_empty():
				_discover(entry, m.global_position, m.height, str(m.def.get("name", m.kind)))
			return
	for n: Node in get_tree().get_nodes_in_group("race_npc"):
		var race: String = n.get_meta("race", "")
		if race == "" or Story.seen.has("race:" + race):
			continue
		var to: Vector3 = n.global_position + Vector3.UP - eye
		if to.length() < 10.0 and forward.dot(to.normalized()) > 0.6:
			Story.seen["race:" + race] = true
			var entry := Story.discovery(race, true)
			if not entry.is_empty():
				_discover(entry, n.global_position, 1.8, entry.title)
			return


func _discover(entry: Dictionary, at: Vector3, size: float, title: String) -> void:
	Combat.gain_xp(25 + floor_index * 15)
	hud.show_notice("BESTIARY · %s added. You know a little more about what's trying to kill you." % title, Color("#c8a8ff"), 5.0)
	cutscene.play(entry, at, size)


## The character standing where you started a conversation: they face you and talk until it's over.
var _talking_life: Life


func _converse_with(at: Vector3, on: bool) -> void:
	if not on:
		if _talking_life and is_instance_valid(_talking_life):
			_talking_life.converse(false)
		_talking_life = null
		return
	var best := 4.0
	for life: Node in get_tree().get_nodes_in_group("people_life"):
		var d := Vector2(life.model.global_position.x - at.x, life.model.global_position.z - at.z).length()
		if d < best:
			best = d
			_talking_life = life
	if _talking_life:
		_talking_life.converse(true, player.global_position)


func _on_dialogue_closed() -> void:
	_converse_with(Vector3.ZERO, false)
	player.set_physics_process(true)
	player.viewmodel.visible = true
	_set_captured(true)


## Getting round fast, for testing the big floors: M opens the travel map (click to go), F1 flies,
## PageUp / PageDown jump a floor.
var travel_map: TravelMap


func _travel_keys(event: InputEvent) -> bool:
	if not (event is InputEventKey and event.pressed and not event.echo):
		return false
	match event.physical_keycode:
		KEY_M:
			if travel_map.visible:
				travel_map.close()
			elif current_floor is FloorWorld:
				travel_map.open(current_floor, player)
			return true
		KEY_ESCAPE:
			if travel_map.visible:
				travel_map.close()
				return true
		KEY_F1:
			player.set_flying(not player.flying)
			hud.show_notice("FLYING · WASD where you look, Space up, C down, Shift very fast. F1 to land." if player.flying else "Landed.", Color("#9ad0ff"), 4.0)
			return true
		KEY_PAGEUP:
			if floor_index < 18:
				load_floor.call_deferred(floor_index + 1)
			return true
		KEY_PAGEDOWN:
			if floor_index > 0:
				load_floor.call_deferred(floor_index - 1)
			return true
	return false


func _travel_to(to: Vector3) -> void:
	if current_floor is FloorWorld:
		var world: FloorWorld = current_floor
		var at := world.lift(Vector3(to.x, 0, to.z))
		player.global_position = at + Vector3.UP * (12.0 if player.flying else 1.5)
		player.velocity = Vector3.ZERO


func _unhandled_input(event: InputEvent) -> void:
	if _travel_keys(event):
		return
	if dialogue.is_open() or travel_map.visible:
		return
	if event is InputEventMouseButton and event.pressed and Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
		_set_captured(true)
	elif event.is_action_pressed("ui_cancel"):
		_set_captured(false)
	elif event.is_action_pressed("interact"):
		use_nearby()


## Whatever the player is standing next to, E does it.
func use_nearby() -> void:
	if driving:
		_stop_driving()
		return
	if dialogue.is_open() or _nearby.is_empty():
		return
	if _nearby.has("drive"):
		_start_driving(current_floor.wilds.vehicles[int(_nearby.drive)])
		return
	if _nearby.has("talk"):
		if dialogue.open(_nearby.talk):
			_converse_with(_nearby.pos, true)
			player.set_physics_process(false)
			player.velocity = Vector3.ZERO
			player.viewmodel.visible = false
			Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		return
	if _nearby.has("needs") and not Story.flag(_nearby.needs):
		hud.show_notice(str(_nearby.get("how", _nearby.locked)), Color("#cfd6dd"))
		return
	if _nearby.has("act"):
		if not _nearby.get("used", false):
			_nearby.used = _nearby.get("once", true)
			for action: String in _nearby.act:
				Story.act(action)
		return
	if _nearby.has("to"):
		load_floor.call_deferred(int(_nearby.to))
	elif _nearby.has("teleport"):
		player.global_position = _nearby.teleport
		player.velocity = Vector3.ZERO
	elif _nearby.has("zip") and _ride.is_empty():
		_start_ride(int(_nearby.zip))
	elif _nearby.has("loot") and not _nearby.get("opened", false) and Combat.alive_in(_nearby.loot) == 0:
		_open_loot(_nearby)


## A cleared camp's loot box: experience and gold now; items once the inventory is in.
func _open_loot(item: Dictionary) -> void:
	item.opened = true
	var level: int = item.get("level", 1)
	var xp := 30 + level * 25
	var gold := 10 + level * 8 + randi() % (level * 6 + 1)
	Combat.gain_xp(xp)
	Combat.gold += gold
	hud.show_banner("LOOT BOX", Color("#ffcc33"), 1.8)
	hud.show_notice("+%d XP · +%d gold. The sponsors thank you for your violence." % [xp, gold])


func _on_died() -> void:
	hud.show_banner("YOU DIED", Color("#e5484d"), 3.0)
	hud.show_notice("Don't worry, our revival team is very good. Mostly. It comes out of your fan count.", Color("#ffcc33"), 6.0)
	player.set_physics_process(false)
	await get_tree().create_timer(2.5).timeout
	player.global_position = _spawn
	player.velocity = Vector3.ZERO
	player.set_physics_process(true)
	Combat.hp = Combat.max_hp() * 0.5


## The zip line is open to everyone for now. A quest will unlock it once quests exist.
func _start_ride(direction: int) -> void:
	var ride: Dictionary = current_floor.wilds.rides[absi(direction) - 1]
	var path: Array[Vector3] = ride.path
	var from: Vector3 = path[0] if direction > 0 else path[1]
	var to: Vector3 = path[1] if direction > 0 else path[0]
	_ride = { "from": from, "to": to, "t": 0.0, "length": from.distance_to(to), "vehicle": ride.vehicle }
	player.set_physics_process(false)
	player.yaw = atan2(-(to.x - from.x), -(to.z - from.z))
	_ride_handle = Models.instantiate(ride.model)
	if ride.vehicle:
		current_floor.add_child(_ride_handle)
		_ride_handle.rotation.y = atan2(to.x - from.x, to.z - from.z)
	else:
		player.camera.add_child(_ride_handle)
		_ride_handle.position = Vector3(0, 0.75, -0.3)


func _update_ride(delta: float) -> void:
	if _ride.is_empty():
		return
	# It gets going slowly, then it really gets going, and it does not slow down much at the end.
	_ride.t = minf(1.0, _ride.t + delta * minf(26.0, 6.0 + _ride.t * 90.0) / _ride.length)
	var at: Vector3 = _ride.from.lerp(_ride.to, _ride.t)
	player.global_position = at + Vector3.UP * (sin(_ride.t * 40.0) * 0.03 - 0.1)
	if _ride.vehicle:
		_ride_handle.global_position = at - Vector3.UP * Wilds.SEAT_HEIGHT
	if _ride.t >= 1.0:
		player.global_position = _ride.to - Vector3.UP * 1.0
		player.velocity = Vector3.ZERO
		player.set_physics_process(true)
		_ride_handle.queue_free()
		_ride = {}


func _set_captured(captured: bool) -> void:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED if captured else Input.MOUSE_MODE_VISIBLE
	hint.visible = not captured
