class_name WildsF1
extends Wilds
## The land outside the towns on Floor 1: a real car park that has gone wrong. Hand-placed districts, each with its own
## walls, lighting and story, instead of props scattered on a grid. Coordinates avoid the prototype's towns and camps.

var _pillars: Array[Transform3D] = []
## Parked cars by paint job, each drawn as one batch.
var _cars := { "car_parked": [] as Array[Transform3D], "car_parked_red": [] as Array[Transform3D], "car_parked_cream": [] as Array[Transform3D], "car_parked_green": [] as Array[Transform3D] }
var _wrecks: Array[Transform3D] = []


func _build_districts() -> void:
	views = {
		"world": [Vector3(-170, 0, 175), -0.8, 0.0],
		"red": [Vector3(130, 0, 112), 2.5, 0.02],
		"carclose": [Vector3(128, 0, 113), -2.3, -0.2],
		"blue": [Vector3(-195, 0, -98), 1.9, 0.0],
		"dark": [Vector3(-200, 0, 200), 0.6, 0.0],
		"shrine": [Vector3(90, 0, -66), 0.0, 0.1],
		"collapse": [Vector3(-96, 0, 186), 0.7, 0.16],
		"flood": [Vector3(-84, 0, -8), 1.5, -0.05],
		"ruin": [Vector3(-96, 0, -283), 3.4, 0.0],
		"loot": [Wilds.LOOT_AT + Vector3(0, 0.1, 5), 0.0, -0.05],
		"cave": [Wilds.CAVE_AT + Vector3(52, -6.5, -4), 1.2, 0.0],
		"zip": [Vector3(60, 0, -60), -2.2, 0.32],
	}
	cave_walk_yaw = atan2(-24.0, 10.0)
	_district_red_level()
	_district_blue_level()
	_district_nobody_parks()
	_district_green_level()
	_district_staff_only()
	_pay_booths()
	_shrine_of_cones()
	_collapse(Vector3(-110, 0, 170), 0.5)
	_collapse(Vector3(150, 0, 250), 2.1)
	_collapse(Vector3(-300, 0, -60), 1.3)
	_abandoned_camp(Vector3(120, 0, 90), 0.4, "marta")
	_abandoned_camp(Vector3(-170, 0, -210), 2.0, "dave")
	_abandoned_camp(Vector3(310, 0, -210), 3.8, "it_hears")
	_flooded_low_level()
	_cave_system()
	_loot_room()
	_zip_line()
	_flush_f1_batches()


func _pillar_grid(origin: Vector2, yaw: float, cols: int, rows: int, step: float, missing := 0.12) -> void:
	var basis := Basis(Vector3.UP, yaw)
	for c in cols:
		for r in rows:
			if _rng.randf() < missing:
				continue
			var local := Vector3((c - cols / 2.0) * step, 0, (r - rows / 2.0) * step)
			var p: Vector3 = basis * local + Vector3(origin.x, 0, origin.y)
			if not kit.is_free(p.x, p.z, 2.0):
				continue
			if _rng.randf() < 0.1:
				kit.prop("broken_pillar", p, _rng.randf_range(0, TAU), 1.0, Vector3(0.7, 2.0, 0.7))
				continue
			_pillars.append(Transform3D(basis, p))
			kit.box_collider(p + Vector3.UP * 3.0, Vector3(0.6, 3.0, 0.6), yaw)


## A neat row of parked cars on painted bays. Neat is what makes the gaps upsetting.
func _parking_row(at: Vector3, yaw: float, bays: int, tint: Color, fill := 0.65) -> void:
	var along := Vector3(cos(yaw), 0, -sin(yaw))
	var strips := int(ceilf(bays / 10.0))
	for s in strips:
		_floor_paint("bays", at + along * (s * 28.0 + 14.0), Vector2(28.0, 7.0), yaw, tint)
	var basis := Basis(Vector3.UP, yaw)
	for i in bays:
		if _rng.randf() > fill:
			continue
		var p := at + along * (i * 2.8 + 1.4)
		if not kit.is_free(p.x, p.z, 1.0):
			continue
		var wreck := _rng.randf() < 0.16
		var t := Transform3D(basis.rotated(Vector3.UP, _rng.randf_range(-0.05, 0.05)), p)
		if wreck:
			_wrecks.append(t)
		else:
			var keys: Array = _cars.keys()
			_cars[keys[_rng.randi() % keys.size()]].append(t)
		kit.box_collider(p + Vector3.UP, Vector3(0.95, 1.0, 2.2), yaw)


func _level_marker(letter: String, at: Vector3, yaw: float, tint := Color.WHITE) -> void:
	_floor_paint("level_" + letter, at, Vector2(22, 22), yaw, tint)


func _batch(mesh_path: String, transforms: Array[Transform3D]) -> void:
	if transforms.is_empty():
		return
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = Models.batch_mesh(mesh_path)
	mm.instance_count = transforms.size()
	for i in transforms.size():
		mm.set_instance_transform(i, transforms[i])
	var node := MultiMeshInstance3D.new()
	node.multimesh = mm
	kit.root.add_child(node)


func _flush_f1_batches() -> void:
	_batch("res://models/props/town/concrete_pillar.glb", _pillars)
	for key: String in _cars:
		_batch("res://models/props/wilds/%s.glb" % key, _cars[key])
	_batch("res://models/props/wilds/car_wreck.glb", _wrecks)


# ---------------------------------------------------------------- districts
func _district_red_level() -> void:
	# South-east: the "safest" district. Warm lamps, orderly rows, someone's been keeping it nice. Not recently.
	var tint := Color("#e8604a")
	_level_marker("a", Vector3(170, 0, 170), 0.4)
	_pillar_grid(Vector2(190, 200), 0.0, 9, 8, 18.0)
	for row in 6:
		_parking_row(Vector3(112, 0, 118 + row * 24.0), 0.0, 22, tint)
	for p: Vector3 in [Vector3(130, 0, 130), Vector3(200, 0, 130), Vector3(160, 0, 200), Vector3(240, 0, 205), Vector3(120, 0, 240)]:
		_pool_lamp(p, "#ffc070", 2.3, 21.0, _rng.randf() < 0.4)
	_wall_paint("marta", Vector3(100.0, 3.2, 150.6), Vector2(8, 4), 0.0)
	_wall(Vector3(100, 0, 150), 0.0, 2)
	_post_sign("lostcar", Vector3(150, 0, 112), 0.3)
	kit.prop("bay_barrier", Vector3(108, 0, 110), 0.4, 1.0, Vector3(0.3, 1.0, 0.3))


func _district_blue_level() -> void:
	# North-west: cold, empty, every car door open. You can't say why that's worse.
	var tint := Color("#5aa0e0")
	_level_marker("b", Vector3(-170, 0, -130), -0.5)
	_pillar_grid(Vector2(-180, -140), 0.45, 8, 8, 20.0, 0.2)
	for row in 5:
		_parking_row(Vector3(-250, 0, -190 + row * 26.0), 0.45, 18, tint, 0.45)
	for p: Vector3 in [Vector3(-140, 0, -90), Vector3(-240, 0, -170), Vector3(-200, 0, -60)]:
		_pool_lamp(p, "#8ac8ff", 2.0, 20.0, true)
	_wall(Vector3(-300, 0, -120), 0.45, 3)
	_wall_paint("dont_look", Vector3(-262, 3.5, -131), Vector2(10, 3.1), 0.45)
	_wall_paint("claws", Vector3(-250, 3.0, -137), Vector2(5, 5), 0.45)
	for i in 6:
		_watcher(Vector3(-280 + i * 14.0, 1.8 + (i % 2) * 0.6, -240 + i * 3.0))


func _district_nobody_parks() -> void:
	# Far south-west, past the sign: real darkness. No lamps at all, only flickering red beacons and eyes.
	var tint := Color("#d9b32a")
	_level_marker("c", Vector3(-250, 0, 250), 0.2)
	_post_sign("blackout", Vector3(-160, 0, 160), -0.8)
	kit.prop("cones", Vector3(-164, 0, 164), 0.2)
	_pillar_grid(Vector2(-260, 260), -0.3, 9, 9, 17.0, 0.18)
	_parking_row(Vector3(-320, 0, 300), -0.3, 18, tint, 0.3)
	for p: Vector3 in [Vector3(-210, 0, 300), Vector3(-300, 0, 215), Vector3(-330, 0, 320)]:
		var beacon := _light("#ff2a1a", 2.6, 15.0, p + Vector3.UP * 4.0)
		_flicker(beacon, "beacon")
		kit.prop("lamp_post", p, _rng.randf_range(0, TAU), 0.7, Vector3(0.15, 2.0, 0.15))
	for i in 18:
		_watcher(Vector3(_rng.randf_range(-340, -180), _rng.randf_range(0.8, 2.6), _rng.randf_range(190, 340)))
	_wall(Vector3(-340, 0, 180), -0.3, 3)
	_wall_paint("it_hears", Vector3(-300, 3.2, 192.6), Vector2(10, 4), -0.3)
	_wall_paint("tally", Vector3(-322, 2.2, 186), Vector2(4.5, 3), -0.3)
	kit.prop("remains", Vector3(-310, 0, 193), -0.3)


func _district_green_level() -> void:
	# North-east: gone to seed. Water running down the walls, moss, a lot of pigeons' work.
	var tint := Color("#6ad07a")
	_level_marker("d", Vector3(240, 0, -90), 1.1)
	_pillar_grid(Vector2(250, -80), -0.7, 8, 7, 19.0, 0.15)
	for row in 4:
		_parking_row(Vector3(185, 0, -50 - row * 28.0), -0.7, 14, tint, 0.5)
	for p: Vector3 in [Vector3(220, 0, -40), Vector3(290, 0, -110), Vector3(200, 0, -125)]:
		_pool_lamp(p, "#b8f0a0", 1.7, 18.0, _rng.randf() < 0.5)
	kit.prop("well", Vector3(270, 0, -60), 0.0, 0.6, Vector3(2.2, 1.0, 2.2))
	_wall(Vector3(310, 0, -40), -0.7, 2)
	_wall_paint("dave", Vector3(321, 3.0, -33), Vector2(9, 2.25), -0.7)


func _district_staff_only() -> void:
	# Far north: the network's back rooms, with one walk-in ruin after another.
	var tint := Color("#a06ae0")
	_level_marker("x", Vector3(-40, 0, -230), 0.0)
	_pillar_grid(Vector2(-40, -260), 0.0, 10, 5, 20.0, 0.25)
	for p: Vector3 in [Vector3(-90, 0, -230), Vector3(20, 0, -300), Vector3(-30, 0, -190)]:
		_pool_lamp(p, "#d0a8ff", 1.8, 17.0, true)
	_ruin(Vector3(-100, 0, -290), PI * 0.1, "Maintenance Office", 14.0, 11.0)
	_ruin(Vector3(-55, 0, -305), -0.1, "Control Room", 16.0, 11.0)
	_ruin(Vector3(30, 0, -250), -PI / 2.0, "Staff Lockers", 12.0, 10.0)
	_parking_row(Vector3(-110, 0, -205), 0.0, 14, tint, 0.3)


func _pay_booths() -> void:
	# A line of pay stations on the way out of town, because the show has a sense of humour.
	kit.prop("shopping_cart", Vector3(-66, 0, 104), 0.9)
	kit.prop("shopping_cart", Vector3(135, 0, 116), 2.2)
	kit.prop("shopping_cart", Vector3(-205, 0, -120), 4.0)
	for i in 3:
		var at := Vector3(-90 + i * 16.0, 0, 96 + i * 2.0)
		kit.prop("bay_barrier", at, 0.2 + i * 0.3, 1.0, Vector3(0.3, 1.0, 0.3))
	_post_sign("paybooth", Vector3(-58, 0, 100), 0.1)
	_light("#ffe0a0", 1.4, 14.0, Vector3(-74, 3.0, 96))


func _shrine_of_cones() -> void:
	# Between the camp and Pylon Point: the goblins have started worshipping.
	var at := Vector3(90, 0, -80)
	kit.prop("cone_totem", at, 0.3, 1.0, Vector3(1.1, 2.5, 1.1))
	_flicker(_light("#ff8a3a", 2.4, 16.0, at + Vector3(0, 1.2, 0)), "candle")
	_wall_paint("cone", Vector3(90, 3.4, -91.2), Vector2(5.5, 5.5), 0.0)
	_wall(Vector3(78, 0, -92), 0.0, 2)
	kit.prop("remains", at + Vector3(2.8, 0, 2.0), 3.6)
	for i in 5:
		var a := i * 1.3
		kit.prop("cones", at + Vector3(cos(a), 0, sin(a)) * 6.5, a)
	kit.interactables.append({ "pos": at + Vector3(0, 0, 4), "r": 5.0, "text": "A shrine of cones. Someone has been leaving offerings." })


func _collapse(at: Vector3, yaw: float) -> void:
	# Where the ceiling fell in, a hard shaft of light comes down from whatever is up there.
	kit.prop("slab_pile", at, yaw, 1.0, Vector3(3.6, 1.4, 3.0))
	_shaft_of_light(at)
	kit.prop("remains", at + Vector3(4.6, 0, 3.0).rotated(Vector3.UP, yaw), yaw + 1.0)


func _abandoned_camp(at: Vector3, yaw: float, graffiti: String) -> void:
	# Someone tried to make it out here. Small stories to walk into.
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	var side := Vector3(cos(yaw), 0, -sin(yaw))
	kit.prop("tent", at + side * 3.0, yaw + 0.3, 1.0, Vector3(1.6, 1.0, 1.9))
	kit.prop("crates", at - side * 3.5 + forward * 1.0, yaw, 1.0, Vector3(0.9, 1.0, 0.7))
	kit.prop("table_set", at - forward * 3.0, yaw, 1.0, Vector3(0.65, 1.0, 0.65))
	kit.prop("remains", at - forward * 5.0 + side * 1.0, yaw)
	kit.prop("barrels", at + forward * 3.0 - side * 1.0, yaw * 2.0, 0.8, Vector3(0.8, 1.0, 0.6))
	_wall(at - forward * 7.0 - side * 6.0, yaw, 1)
	_wall_paint(graffiti, at - forward * 6.35 + Vector3.UP * 3.0, Vector2(8, 3.5), yaw)
	_flicker(_light("#ff9a4a", 1.5, 11.0, at + Vector3.UP * 1.2), "candle")
	kit.prop("bonfire", at, 0.0, 0.5, Vector3(0.5, 1.0, 0.5))


func _flooded_low_level() -> void:
	# Spreading out from the Flooded Bay: black water, lamps reflected in it, things under it.
	var at := Vector3(-120, 0, -20)
	var water := PlaneMesh.new()
	water.size = Vector2(70, 46)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color("#1c3a44")
	mat.roughness = 0.04
	mat.metallic = 0.6
	mat.metallic_specular = 0.9
	kit.mesh_node(water, mat, at + Vector3.UP * 0.05)
	for i in 3:
		_pool_lamp(at + Vector3(-22 + i * 22.0, 0, -6 + i * 5.0), "#a8e0d8", 1.5, 16.0, i == 1)
	_post_sign("flooded", at + Vector3(38, 0, 12), 1.4)
	for i in 8:
		_watcher(at + Vector3(_rng.randf_range(-32, 32), 0.25, _rng.randf_range(-20, 20)))
	for i in 3:
		kit.prop("car_wreck", at + Vector3(-18 + i * 16.0, -0.2, 8.0 - i * 7.0), i * 1.1, 1.0, Vector3(0.95, 1.0, 2.1))


# ---------------------------------------------------------------- places to find
func _cave_system() -> void:
	# The sinkhole: down the ladder, a real cave of chambers and tunnels, lit only by what grows there.
	var hole := Vector3(50, 0, 230)
	kit.prop("sinkhole_rim", hole, 0.8)
	_post_sign("sinkhole", hole + Vector3(6, 0, 8), 0.6)
	_build_cave("cave", hole, "Press E: climb down into the sinkhole", [Vector3(0, 0, 0), Vector3(24, -3.2, 10), Vector3(30, -3.0, 4), Vector3(52, -8.0, 0), Vector3(60, -8.0, 12), Vector3(46, -10.0, 34), Vector3(16, -13.0, 40), Vector3(-12, -10.0, 28)], "#6ae8d8", "#a88aff")
	var deep := Wilds.CAVE_AT + Vector3(16, -13.0, -40)
	kit.prop("loot_chest", deep + Vector3(4, 0, 2), 0.5)
	kit.prop("remains", deep + Vector3(1, 0, 3.5), 2.6)
	kit.interactables.append({ "pos": deep + Vector3(4, 0, 2), "r": 3.0, "text": "A loot box. Loot arrives with Phase 2." })


func _loot_room() -> void:
	# A crack in a wall behind the Green Level that you only notice if you're looking. Behind it, a sealed bunker.
	var crack := Vector3(320, 0, -135)
	var yaw := -0.7
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	_wall(crack - Vector3(cos(yaw), 0, -sin(yaw)) * 6.0, yaw, 1)
	_wall_paint("hand", crack + forward * 0.66 + Vector3.UP * 1.4, Vector2(1.5, 1.5), yaw)
	_wall_paint("arrow", crack + forward * 0.66 + Vector3(0, 3.0, 0), Vector2(3.2, 1.25), yaw + 0.02)
	_build_loot_room(crack + forward * 2.0, "Press E: squeeze through the crack")
	_wall_paint("tally", Wilds.LOOT_AT + Vector3(4.5, 2.2, 6.9), Vector2(3.6, 2.4), PI)


func _zip_line() -> void:
	# A service line along the ceiling from just outside town out to Pylon Point's far side.
	var start := Vector3(70, 0, -70)
	var end := Vector3(250, 0, -240)
	var yaw := atan2(end.x - start.x, end.z - start.z)
	kit.prop("zip_tower", start, yaw, 1.0, Vector3(1.2, 2.6, 1.2))
	kit.prop("zip_tower", end, yaw + PI, 1.0, Vector3(1.2, 2.6, 1.2))
	var length := start.distance_to(end)
	var count := int(length / 10.0)
	for i in count + 1:
		kit.prop("zip_rail", start.lerp(end, (i + 0.5) / float(count + 1)), yaw + PI)
	_post_sign("zipline", start + Vector3(3, 0, 3), yaw + PI)
	_light("#ffe08a", 1.6, 12.0, start + Vector3(0, 6.5, 0))
	_light("#ffe08a", 1.6, 12.0, end + Vector3(0, 6.5, 0))
	var path: Array[Vector3] = [start + Vector3(0, 6.9, 0), end + Vector3(0, 6.9, 0)]
	_add_ride(path, "res://models/props/wilds/zip_handle.glb", false, start, end, "Press E: ride the service line", "Press E: ride the service line back")
