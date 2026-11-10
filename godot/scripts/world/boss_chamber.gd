class_name BossChamber
extends Node3D
## A boss chamber (data/chambers.json): step inside and the door slams down behind you, the boss makes its entrance
## (a cutscene with its own line and Nigel's), and the fight is on. Win and the door opens and the chest unlocks.
## Die and the chamber resets, door open, boss gone, waiting for you to try again.

signal cleared

var entry: Dictionary = {}
var kind := ""
var level := 1
var boss_path := ""
var half := 22.0
var floor_y := 0.0
var state := "waiting"   # sealed, waiting, entrance, fight, cleared
## The quest that leads here (see Wilds._chamber_quest): its first two steps break the seals on the door.
var quest := ""
## A trap: no seal, no warning. A quest sends you in to fetch something, and the door comes down behind you.
var trap := false
## Just outside the door, in the floor's coordinates.
var gate_spot := Vector3.ZERO
var boss: Mob
var _door: CollisionShape3D
var _door_mesh: MeshInstance3D
var _door_up := Vector3.ZERO
var _door_down := Vector3.ZERO
var _dais := Vector3.ZERO
var _clock := 0.0


func setup(data: Dictionary, monster: String, lvl: int, path: String, size: float, door_at: Vector3, door_yaw: float, door_size: Vector3, dais: Vector3) -> void:
	entry = data
	kind = monster
	level = lvl
	boss_path = path
	half = size
	_dais = dais
	# the door: a heavy slab that waits high up in the gateway and comes down when you're in
	var body := StaticBody3D.new()
	add_child(body)
	_door = CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = door_size
	_door.shape = shape
	_door.position = door_at + Vector3.UP * door_size.y / 2.0
	_door.rotation.y = door_yaw
	_door.disabled = true
	body.add_child(_door)
	_door_mesh = MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = door_size
	_door_mesh.mesh = mesh
	_door_mesh.material_override = Models.toon(Color("#3a3438"))
	_door_down = door_at + Vector3.UP * door_size.y / 2.0
	_door_up = _door_down + Vector3.UP * (door_size.y - 0.4)
	_door_mesh.position = _door_up
	_door_mesh.rotation.y = door_yaw
	add_child(_door_mesh)
	Combat.player_died.connect(_on_player_died)
	Combat.mob_killed.connect(_on_killed)


## Locks the door until the quest's seal-breaking steps are done.
func seal(quest_id: String) -> void:
	quest = quest_id
	state = "sealed"
	_door.disabled = false
	_door_mesh.position = _door_down


func _process(delta: float) -> void:
	_clock -= delta
	if state == "sealed" and Story.quests.has(quest) and _seals_broken():
		state = "waiting"
		_open()
		Combat.notice.emit("THE SEALS BREAK · The door of %s grinds open. Something inside has heard it." % entry.get("name", ""), Color("#ff5a3a"))
	if state != "waiting" or _clock > 0.0 or Combat.player == null:
		return
	_clock = 0.25
	var p: Vector3 = Combat.player.global_position
	var local := p - global_position
	if absf(local.x) < half - 3.0 and absf(local.z) < half - 3.0 and absf(local.y - floor_y) < 4.0:
		_begin()


## The dais's top, in the floor's coordinates: where a trap's bait sits.
func dais_spot() -> Vector3:
	return Vector3(_dais.x, 0, _dais.z + 4.0)


func _seals_broken() -> bool:
	var steps: Array = Story.quests_def[quest].obj
	for i in steps.size() - 1:
		if not Story.obj_done(quest, i):
			return false
	return true


func _begin() -> void:
	state = "entrance"
	_slam()
	_bake_nav()
	boss = Mob.spawn(kind, level, boss_path, get_parent(), _dais, PI, 1.0)
	if boss == null:
		state = "cleared"
		_open()
		return
	boss.group = "chamber:" + str(entry.get("name", kind))
	boss.leash = 9999.0
	boss.aggro = 999.0
	# the entrance: the boss swells up out of a flash of light on its dais
	var full := boss.model.scale
	boss.model.scale = full * 0.05
	var flash := OmniLight3D.new()
	flash.light_color = Color("#ff3a3a")
	flash.light_energy = 12.0
	flash.omni_range = 30.0
	flash.position = _dais + Vector3.UP * 3.0
	add_child(flash)
	var tween := create_tween().set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	tween.tween_property(boss.model, "scale", full, 2.2).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.parallel().tween_property(flash, "light_energy", 0.0, 2.6)
	tween.tween_callback(flash.queue_free)
	var cutscene: Node = get_tree().current_scene.get("cutscene")
	if Story.cutscenes_on and cutscene:
		# the boss's own entrance line, then Nigel's whole story of it (data/narration), once only
		var lines: Array = entry.get("intro", []).duplicate()
		if not Story.seen.has(kind):
			for line: Variant in Story.discovery(kind).get("lines", []):
				if not lines.has(line):
					lines.append(line)
		Story.seen[kind] = true
		var film := { "title": entry.get("title", ""), "sub": entry.get("sub", ""), "lines": lines }
		cutscene.play(film, _dais, boss.height)
		await cutscene.finished
	_fight()


func _fight() -> void:
	if boss == null or not is_instance_valid(boss):
		return
	# the dais is a raised drum you can't climb: the boss comes down off it to the hall floor, towards you
	await _leap_down()
	if boss == null or not is_instance_valid(boss):
		return
	state = "fight"
	boss.nav_on = _nav != null
	_light_up()
	# a boss with a kit of its own (scripts/world/boss_kits/<kit>.gd): its arena tricks, phases and so on
	var kit_name: String = str(boss.def.get("kit", ""))
	if kit_name != "" and ResourceLoader.exists("res://scripts/world/boss_kits/%s.gd" % kit_name):
		var kit: Node = load("res://scripts/world/boss_kits/%s.gd" % kit_name).new()
		boss.add_child(kit)
		kit.call("begin", self, boss)
	boss.set_awake(true)
	boss._engage()
	Combat.boss = boss
	Combat.notice.emit("%s · %s" % [str(entry.get("title", "")), str(entry.get("sub", ""))], Color("#ff5a3a"))


## The chamber's walkable ground, worked out from everything solid in it: the floor, the causeway, the dais and its
## steps, the galleries. The boss finds its way around with it (round the dais, up the steps) instead of walking
## straight at you into a wall.
var _nav: NavigationRegion3D


func _bake_nav() -> void:
	if _nav:
		return
	var mesh := NavigationMesh.new()
	mesh.agent_radius = 0.8
	mesh.agent_height = 2.0
	mesh.agent_max_climb = 0.6
	mesh.agent_max_slope = 42.0
	mesh.cell_size = 0.25
	mesh.cell_height = 0.25
	mesh.geometry_parsed_geometry_type = NavigationMesh.PARSED_GEOMETRY_STATIC_COLLIDERS
	var centre := global_position + Vector3.UP * floor_y
	mesh.filter_baking_aabb = AABB(centre - Vector3(half + 2.0, 2.0, half + 2.0), Vector3(half * 2.0 + 4.0, 30.0, half * 2.0 + 4.0))
	var source := NavigationMeshSourceGeometryData3D.new()
	var started := Time.get_ticks_msec()
	NavigationServer3D.parse_source_geometry_data(mesh, source, get_parent())
	NavigationServer3D.bake_from_source_geometry_data(mesh, source)
	if mesh.get_polygon_count() == 0:
		return
	_nav = NavigationRegion3D.new()
	_nav.navigation_mesh = mesh
	get_parent().add_child(_nav)
	print("CHAMBER nav baked: %d polygons in %d ms" % [mesh.get_polygon_count(), Time.get_ticks_msec() - started])


## The fight gets its own light: a warm wash over the whole hall, so you can see what you're fighting.
func _light_up() -> void:
	var lamp := OmniLight3D.new()
	lamp.light_color = Color("#ffe8c8")
	lamp.light_energy = 2.2
	lamp.omni_range = half * 2.8
	lamp.omni_attenuation = 0.6
	add_child(lamp)
	lamp.global_position = global_position + Vector3.UP * (floor_y + 12.0)
	lamp.light_energy = 0.0
	create_tween().tween_property(lamp, "light_energy", 2.2, 1.2)
	cleared.connect(func() -> void: create_tween().tween_property(lamp, "light_energy", 0.8, 3.0))


## From the top of the dais down onto the hall floor, on the side facing the door: a hop, a thump, a shake.
func _leap_down() -> void:
	var door := _door.global_position
	var out := Vector3(door.x - _dais.x, 0, door.z - _dais.z).normalized()
	var space := get_world_3d().direct_space_state
	var land := Vector3.INF
	for d in range(4, 30):
		var probe := _dais + out * float(d)
		var ray := PhysicsRayQueryParameters3D.create(probe + Vector3.UP * 2.0, probe + Vector3.DOWN * 12.0)
		ray.exclude = [boss.get_rid()]
		var hit := space.intersect_ray(ray)
		if not hit.is_empty() and hit.position.y < _dais.y - 1.5:
			# a little clear of the edge, so it isn't left balanced on the lip
			land = hit.position + out * 2.5
			break
	if land == Vector3.INF:
		return
	boss.rotation.y = atan2(out.x, out.z)
	if boss.life and boss.life.player and boss.life.player.has_animation("slam"):
		boss.life.player.play("slam", 0.1)
	var from := boss.global_position
	var hop := create_tween()
	hop.tween_method(func(k: float) -> void:
		if is_instance_valid(boss):
			boss.global_position = from.lerp(land, k) + Vector3.UP * sin(k * PI) * 2.5, 0.0, 1.0, 0.9)
	await hop.finished
	if Combat.player and "_shake" in Combat.player:
		Combat.player._shake = 0.4
	Combat.sfx(land + Vector3.UP * 0.5, "THUD!", Color("#e8e8e8"))
	if boss and is_instance_valid(boss):
		boss.home = boss.global_position


func _slam() -> void:
	_door.set_deferred("disabled", false)
	var tween := create_tween().set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	tween.tween_property(_door_mesh, "position", _door_down, 0.35).set_ease(Tween.EASE_IN)
	if Combat.player and "_shake" in Combat.player:
		Combat.player._shake = 0.5
	Combat.sfx(_door_down + Vector3.UP * 2.0, "SLAM!", Color("#e8e8e8"))


func _open() -> void:
	_door.set_deferred("disabled", true)
	var tween := create_tween()
	tween.tween_property(_door_mesh, "position", _door_up, 2.0).set_ease(Tween.EASE_OUT)


func _on_killed(m: Node) -> void:
	if m == boss and state == "fight":
		state = "cleared"
		_open()
		Story.flags["chamber_" + kind] = true
		Combat.notice.emit("CHAMBER CLEARED · The doors grind open.", Color("#f5c518"))
		cleared.emit()


func _on_player_died() -> void:
	if state == "entrance" or state == "fight":
		# you lost: the boss goes back into the dark, and the door lets you back in when you're ready
		if boss and is_instance_valid(boss):
			Combat.mobs.erase(boss)
			if Combat.boss == boss:
				Combat.boss = null
			boss.queue_free()
		boss = null
		state = "waiting"
		_clock = 6.0
		_open()
