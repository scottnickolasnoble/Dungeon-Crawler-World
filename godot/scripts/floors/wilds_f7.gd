class_name WildsF7
extends Wilds
## The Drowned Cistern's outdoors: 1400 m of flooded pillared hall, the first floor of the Undercity. Everything drains here eventually.
## You wade most of it, up to the shins. Sunken streets, tenements still collecting rent, and a chain ferry that nobody admits to running.


func _build_districts() -> void:
	_flood()
	_tenement_row(Vector3(-470, 0, -240), 0.0)
	_tenement_row(Vector3(470, 0, 470), 0.7)
	_public_baths(Vector3(-470, 0, 130))
	_organ_hall(Vector3(-60, 0, 370))
	_landfill(Vector3(470, 0, -70))
	_old_ned(Vector3(300, 0, -480))
	_shallows(Vector3(-280, 0, 430))
	_brick_culvert()
	_ferry_crossing()
	for spot: Array in [[Vector3(-112, 0, 92), 0.3, "rent"], [Vector3(112, 0, 92), -0.3, "low"], [Vector3(-30, 0, -110), 0.1, "tide"], [Vector3(150, 0, -130), -0.8, "tenant"], [Vector3(-300, 0, 60), 1.1, "hands"]]:
		_tag_wall(spot[0], spot[1], spot[2], 6.0 if spot[2] == "hands" else 3.2)
		_claim(spot[0], 10.0, 6.0)
	var deep := _cave_from_rooms("cave_f7", Vector3(170, 0, 120), "Press E: wade down into the main drain", [[0, 0, 3, 5], [28, -6, 0, 5], [56, 8, -2, 6], [60, 40, -4, 6], [30, 56, -6, 11], [-4, 34, -4, 5]], "#7affe8", "#c8ffa8", 4, "body_bag")
	kit.prop("manhole", Vector3(170, 0, 120), 0.5)
	_post_sign("drain", Vector3(176, 0, 128), 0.3)
	_claim(Vector3(170, 0, 120), 12.0, 12.0)
	# what the wyrms keep: every bag that ever went down, sorted by size
	for i in 12:
		kit.prop("body_bag", deep + Vector3(-12.0 + i * 2.0, 0.3, -7.0 + (i % 3) * 3.0), i * 0.7)
	kit.prop("wyrm_spine", deep + Vector3(-22, -2, 16), 0.6, 0.35)
	_view("drain", deep + Vector3(1, 0.2, 9), deep + Vector3(0, 2, -4))
	# the hidden room: a flooded coal hole under a jetty, with the hatch just above the water
	var hatch := Vector3(-215, 0, -60)
	kit.prop("crates", hatch + Vector3(1.4, 0, -1.2), 0.4, 1.0, Vector3(0.9, 1.0, 0.7))
	_claim(hatch, 6.0, 6.0)
	_build_loot_room(hatch, "Press E: open the coal hatch and drop through", "facade_a")
	_apply_claims()
	_view("hall", Vector3(120, 0, -390), Vector3(60, 5.5, -470))
	_flooded_buildings()
	_pillar_field()


func _flood() -> void:
	# Water everywhere except the towns: they keep their feet dry, for now.
	var cell := 22.0
	var half: float = kit.world_size / 2.0
	var hub: Dictionary = kit.data.hub
	var dry: Array[Rect2] = [Rect2(-hub.w / 2.0, -hub.d / 2.0, hub.w, hub.d)]
	for v: Dictionary in kit.data.villages:
		dry.append(Rect2(float(v.x) - 32.0, float(v.z) - 26.0, 64.0, 52.0))
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color("#1f4a48")
	mat.roughness = 0.5
	mat.metallic_specular = 0.12
	mat.emission_enabled = true
	mat.emission = Color("#0a2422")
	var tile := PlaneMesh.new()
	tile.size = Vector2(cell, cell)
	tile.material = mat
	var places: Array[Transform3D] = []
	var x := -half + cell / 2.0
	while x < half:
		var z := -half + cell / 2.0
		while z < half:
			var is_dry := false
			for area: Rect2 in dry:
				if area.grow(cell * 0.4).has_point(Vector2(x, z)):
					is_dry = true
					break
			if not is_dry:
				places.append(Transform3D(Basis.IDENTITY, Vector3(x, 0.34, z)))
			z += cell
		x += cell
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = tile
	mm.instance_count = places.size()
	for i in places.size():
		mm.set_instance_transform(i, places[i])
	var node := MultiMeshInstance3D.new()
	node.multimesh = mm
	kit.root.add_child(node)
	flood = node


## A few walk-in buildings out among the columns, with the land round each kept clear so nothing stands across a door.
func _flooded_buildings() -> void:
	var placed := 0
	var tries := 0
	while placed < 16 and tries < 200:
		tries += 1
		var at := Vector3(_rng.randf_range(-640, 640), 0, _rng.randf_range(-640, 640))
		if kit.is_free(at.x, at.z, 18.0):
			_ruin(at, _rng.randf_range(0, TAU), ["Pump House", "Boat Store", "Tide Office", "Number 6"][placed % 4], 12.0, 10.0, 5.0, "facade_b", "#a8ffe8", 1.6)
			kit.reserve(Rect2(at.x - 13.0, at.z - 13.0, 26.0, 26.0))
			placed += 1


## The rest of the floor: columns, thousands of them, in rows that look perfectly regular until you try to walk one.
func _pillar_field() -> void:
	var step := 30.0
	var half: float = kit.world_size / 2.0 - 16.0
	var row := 0
	var z := -half
	while z < half:
		var x := -half + (row % 2) * step * 0.5
		while x < half:
			var skew := sin(z * 0.012 + x * 0.004) * 8.0
			var p := Vector3(x + skew, 0, z + cos(x * 0.009) * 6.0)
			if kit.is_free(p.x, p.z, 4.0):
				_batched("cistern_column", p, _rng.randf_range(0, TAU), 1.0, Vector3(0.9, 9.0, 0.9))
				_pillar_clutter(p)
			x += step
		z += step * 0.86
		row += 1


func _pillar_clutter(p: Vector3) -> void:
	var mess := _rng.randf()
	var at := p + Vector3(_rng.randf_range(-11, 11), 0, _rng.randf_range(-11, 11))
	if not kit.is_free(at.x, at.z, 2.0):
		return
	if mess < 0.07:
		_batched("eviction_pile", at, _rng.randf_range(0, TAU), 1.0, Vector3(1.5, 1.0, 1.0))
	elif mess < 0.15:
		_mover(kit.prop("body_bag", at + Vector3.UP * 0.32, _rng.randf_range(0, TAU)), "bob")
	elif mess < 0.2:
		_batched("car_wreck", at + Vector3.DOWN * 0.4, _rng.randf_range(0, TAU), 1.0, Vector3(0.95, 1.0, 2.15))
	elif mess < 0.24:
		_batched("barrels", at, _rng.randf_range(0, TAU), 1.0, Vector3(0.8, 1.0, 0.8))
	elif mess < 0.27:
		_batched("drowned_hand", at, _rng.randf_range(0, TAU), 1.0)
		_batched("drowned_hand", at + Vector3(0.7, 0, 0.4), _rng.randf_range(0, TAU), 0.9)
	elif mess < 0.29:
		_watcher(at + Vector3.UP * 1.3)
	elif mess < 0.33:
		_batched("jetty", at + Vector3.DOWN * 0.34, _rng.randf_range(0, TAU))
	if _rng.randf() < 0.07:
		var lamp := _light(["#6affe8", "#a8ffd0", "#ffc878"][_rng.randi() % 3], 2.0, 24.0, p + Vector3(0, 7.0, 3.0), false)
		if _rng.randf() < 0.35:
			_flicker(lamp)


## Whole tenements, sunk to the second floor, still leaning on one another, with their lights on and the notices fresh.
func _tenement_row(at: Vector3, yaw: float) -> void:
	_claim(at, 70.0, 42.0)
	var basis := Basis(Vector3.UP, yaw)
	_post_sign("tenements", at + basis * Vector3(0, 0, 30), yaw)
	for i in 6:
		kit.prop("sunk_tenement", at + basis * Vector3(-50.0 + i * 20.0 + _rng.randf_range(-1, 1), 0, -14.0 + (i % 2) * 2.0), yaw + _rng.randf_range(-0.06, 0.06), 1.0, Vector3(7.5, 9.0, 5.5))
	_ruin(at + basis * Vector3(-30, 0, 24), yaw + PI, "Number 12", 14.0, 11.0, 6.0, "facade_a", "#ffd88a")
	_ruin(at + basis * Vector3(30, 0, 24), yaw + PI, "Rent Office", 14.0, 11.0, 6.0, "facade_a", "#ffd88a")
	for i in 16:
		var p: Vector3 = at + basis * Vector3(_rng.randf_range(-58, 58), 0, _rng.randf_range(-4, 12))
		_batched("eviction_pile", p, _rng.randf_range(0, TAU), 1.0, Vector3(1.5, 1.0, 1.0))
	for i in 4:
		_flicker(_light("#ffd88a", 1.8, 22.0, at + basis * Vector3(-45.0 + i * 30.0, 5.5, -6.0), i == 1))
	_wall_paint("eviction", at + basis * Vector3(-10, 3.0, 12.2), Vector2(3.2, 2.4), yaw)
	_view("tenements" if not views.has("tenements") else "tenements_b", at + basis * Vector3(10, 0, 34), at + basis * Vector3(-8, 8, -14))


## Mrs Bathwater's bath. It's wider than a house. The foam moves, and the steam comes off it warm.
func _public_baths(at: Vector3) -> void:
	_claim(at, 40.0, 36.0)
	kit.prop("giant_tub", at, 0.5, 1.5, Vector3(6.4, 3.4, 6.4))
	_post_sign("baths", at + Vector3(8, 0, 22), 0.2)
	_steam(at + Vector3(0, 7.8, 0), "#d8ffe8", 24)
	_steam(at + Vector3(-3, 7.8, 3), "#d8ffe8", 14)
	_light("#a8ffe0", 2.4, 34.0, at + Vector3(0, 11, 3), true)
	for i in 8:
		var a := i * TAU / 8.0
		kit.prop("cistern_column", at + Vector3(cos(a), 0, sin(a)) * 24.0, a, 1.0, Vector3(0.9, 9.0, 0.9))
	for i in 7:
		var a := i * 0.9
		_mover(kit.prop("body_bag", at + Vector3(cos(a), 0, sin(a)) * (10.0 + i * 1.5) + Vector3.UP * 0.32, a), "bob")
	_view("baths", at + Vector3(-8, 0, 19), at + Vector3(0, 5.5, 0))


func _organ_hall(at: Vector3) -> void:
	_claim(at, 38.0, 28.0)
	kit.prop("organ_pipes", at, 0.0, 1.0, Vector3(16.0, 6.0, 3.0))
	_post_sign("organ", at + Vector3(-26, 0, 20), 0.2)
	for i in 3:
		_flicker(_light("#ffc878", 2.2, 28.0, at + Vector3(-14.0 + i * 14.0, 6, -9.0), i == 1), "candle")
	_view("organ", at + Vector3(0, 0, -30), at + Vector3(0, 7, 0))


## Where the Undercity's rubbish comes to live. Hills of it, with flies. Now and then a bag has an elbow.
func _landfill(at: Vector3) -> void:
	_claim(at, 44.0, 44.0)
	_post_sign("barge", at + Vector3(-34, 0, 18), 0.7)
	for i in 11:
		var a := i * 2.4
		var r := 6.0 + i * 3.2
		kit.prop("bag_heap", at + Vector3(cos(a) * r, 0, sin(a) * r), a, 0.9 + (i % 3) * 0.4, Vector3(2.6, 1.6, 2.6))
	for i in 14:
		var a := i * 1.3
		_mover(kit.prop("body_bag", at + Vector3(cos(a), 0, sin(a)) * (10.0 + i * 2.0) + Vector3.UP * 0.32, a), "bob")
	for i in 3:
		_flicker(_light("#c8ff8a", 2.0, 30.0, at + Vector3(-18.0 + i * 18.0, 6, i * 5.0), i == 2))
	_rats_about(at, 10)
	_view("landfill", at + Vector3(-30, 0, 22), at + Vector3(0, 3, 0))


func _old_ned(at: Vector3) -> void:
	# A hundred metres of very old eel. You walk under the ribs to get anywhere up here. The skull's looking at the town.
	_claim(at, 38.0, 66.0)
	kit.prop("wyrm_spine", at, 0.0)
	_post_sign("wyrm", at + Vector3(14, 0, -60), PI)
	for i in 4:
		_light("#a8ffe8", 1.8, 26.0, at + Vector3(0, 6, -36.0 + i * 24.0), false)
	_view("ned", at + Vector3(3, 0, -30), at + Vector3(0, 5, 10))


func _shallows(at: Vector3) -> void:
	_claim(at, 42.0, 34.0)
	_post_sign("hands", at + Vector3(0, 0, -28), PI)
	for i in 640:
		var a := i * 2.4
		var r := sqrt(i / 640.0) * 38.0
		_batched("drowned_hand", at + Vector3(cos(a) * r, 0, sin(a) * r * 0.8), _rng.randf_range(0, TAU), _rng.randf_range(0.8, 1.4))
	for i in 24:
		var a := i * 2.4
		_stalker("drowned_hand", at + Vector3(cos(a), 0, sin(a)) * (6.0 + i * 1.3), false, 1.6)
	_light("#a8ffe0", 1.8, 40.0, at + Vector3(0, 9, 0), false)
	_view("shallows", at + Vector3(2, 0, -26), at + Vector3(0, 0.8, 0))


func _brick_culvert() -> void:
	# A long brick tunnel out of the town's north gate, the one road on the floor that goes anywhere in a straight line.
	var z := -90.0
	while z > -270.0:
		kit.prop("brick_arch", Vector3(40, 0, z), 0.0)
		kit.box_collider(Vector3(46.8, 3, z), Vector3(0.7, 3, 1.15))
		kit.box_collider(Vector3(33.2, 3, z), Vector3(0.7, 3, 1.15))
		if int(z) % 40 == 10:
			_flicker(_light("#ffc878", 1.8, 16.0, Vector3(40, 5.0, z), true))
		z -= 5.0
	_claim(Vector3(40, 0, -180), 12.0, 94.0)
	_view("culvert", Vector3(40, 0, -102), Vector3(40, 3.0, -180))


func _ferry_crossing() -> void:
	var start := Vector3(-110, 0, 120)
	var end := Vector3(-130, 0, 340)
	_vehicle_line(start, end, "ferry_cable", "ferry", "Press E: step aboard the chain ferry", "Press E: take the ferry back")
	_post_sign("ferry", start + Vector3(7, 0, 2), PI)
	for t: float in [0.0, 1.0]:
		var p := start.lerp(end, t)
		for i in 3:
			kit.prop("jetty", p + Vector3(0, -0.34, (-1.0 if t == 0.0 else 1.0) * (6.0 + i * 9.5)), 0.0)


func _rats_about(at: Vector3, count: int) -> void:
	for i in count:
		var rat := kit.prop("rat", at + Vector3(_rng.randf_range(-18, 18), 0.3, _rng.randf_range(-18, 18)), _rng.randf_range(0, TAU), 1.5)
		_mover(rat, "scurry", { "speed": _rng.randf_range(0.5, 1.1), "radius": _rng.randf_range(4.0, 12.0) })
