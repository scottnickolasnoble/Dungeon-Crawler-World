class_name WildsF3
extends Wilds
## The Soup District's outdoors: a whole fogbound city that's been cooking for a long time. It smells wonderful.
## Real streets you can get lost in, with districts that get worse the longer you look at them. The floor is 1000 m across.


var _houses := 0


func _build_districts() -> void:
	views = {
		"streets": [Vector3(-40, 0, 130), -PI / 2.0 + 0.05, 0.05],
		"tenement": [Vector3(47, 0, 130), PI, -0.03],
		"butcher": [Vector3(-152, 0, -128), 0.45, 0.04],
		"cuts": [Vector3(-132, 0, -158), 0.0, 0.0],
		"banquet": [Vector3(103, 0, -119), -0.5, -0.28],
		"canal": [Vector3(60, 1.5, 300), PI, 0.0],
		"toll": [Vector3(-3, 0, -80), 0.03, 0.14],
		"jars": [Vector3(-362, 0, -284), 0.3, -0.02],
		"bones": [Vector3(396, 0, -146), -0.5, 0.12],
		"graves": [Vector3(-415, 0, 176), 0.1, -0.12],
		"cave": [Wilds.CAVE_AT + Vector3(30, -8.5, 46), PI, 0.0],
	}
	_tenement_quarter(Vector3(0, 0, 150), 0.0)
	_tenement_quarter(Vector3(-400, 0, -60), 0.5)
	_tenement_quarter(Vector3(420, 0, 150), -0.3)
	_tenement_quarter(Vector3(-90, 0, 450), 0.15)
	_butchers_row(Vector3(-130, 0, -150), 0.2)
	_butchers_row(Vector3(400, 0, -380), -0.6)
	_banquet_hall(Vector3(115, 0, -135), 0.25)
	_banquet_hall(Vector3(-360, 0, 390), 1.2)
	_toll_road()
	_broth_canal()
	_pickle_market(Vector3(-370, 0, -300))
	_bone_yard(Vector3(410, 0, -170))
	_tallow_graveyard(Vector3(-420, 0, 150))
	for w: Array in [[Vector3(-105, 0, 80), 0.3, "hungry"], [Vector3(130, 0, 80), -0.25, "ask"], [Vector3(-80, 0, -230), 0.5, "bones"], [Vector3(320, 0, -240), -0.8, "menu"]]:
		var yaw: float = w[1]
		_wall(w[0] - Vector3(cos(yaw), 0, -sin(yaw)) * 6.0, yaw, 1)
		var forward := Vector3(sin(yaw), 0, cos(yaw))
		_wall_paint(w[2], w[0] + forward * 0.66 + Vector3.UP * 3.6, Vector2(8, 3.2 if w[2] != "menu" else 6.0), yaw)
	_build_cave("cave_f3", Vector3(150, 0, -30), "Press E: climb down into the stock pipes", [Vector3(0, 0, 0), Vector3(22, -3, -14), Vector3(46, -6, -6), Vector3(60, -9, -30), Vector3(30, -12, -46), Vector3(36, -12, -38), Vector3(2, -9, -30)], "#ff8a3a", "#ffd24a")
	cave_walk_yaw = atan2(-22.0, -14.0)
	kit.prop("manhole", Vector3(150, 0, -30), 0.5)
	_post_sign("pipe", Vector3(156, 0, -22), 0.3)
	_steam(Vector3(150, 0.2, -30), "#ffb070", 10)
	var deep := Wilds.CAVE_AT + Vector3(30, -12.0, 46)
	kit.prop("bone_heap", deep + Vector3(-5, 0, 3), 0.3)
	kit.prop("loot_chest", deep + Vector3(3, 0, -3), 2.6)
	kit.prop("cauldron", deep + Vector3(-1, 0, -5), 1.0, 2.0)
	kit.interactables.append({ "pos": deep + Vector3(3, 0, -3), "r": 3.0, "text": "A loot box in the bones. Loot arrives with Phase 2." })
	# the hidden room: a dumbwaiter hatch at the back of a butcher's stall
	var hatch := Vector3(-168, 0, -178)
	kit.prop("crates", hatch + Vector3(1.4, 0, -1.2), 0.5, 1.0, Vector3(0.9, 1.0, 0.7))
	_floor_paint("drag", hatch + Vector3(1, 0, 3), Vector2(4, 6), 0.2)
	_build_loot_room(hatch, "Press E: pull open the dumbwaiter and climb in", "facade_a")
	_reserve_districts()
	kit.before_filler()
	_city_blocks()


func _reserve_districts() -> void:
	# Roads, the canal and every district: the city fills in everything else.
	for road: Rect2 in [Rect2(-10, -500, 20, 1000), Rect2(-500, -10, 1000, 20), Rect2(-500, 295, 1000, 82)]:
		kit.reserve(road)
	for d: Array in [[0, 150, 100, 58], [-400, -60, 100, 60], [420, 150, 90, 60], [-90, 450, 100, 50], [-130, -150, 42, 58], [400, -380, 42, 58], [115, -135, 24, 24], [-360, 390, 24, 24], [-370, -300, 38, 34], [410, -170, 40, 40], [-420, 150, 36, 36], [150, -30, 12, 12], [-168, -178, 8, 8], [-105, 80, 12, 6], [130, 80, 12, 6], [-80, -230, 12, 6], [320, -240, 12, 6], [-40, 270, 10, 10], [-40, 400, 10, 10], [0, -165, 16, 110]]:
		kit.reserve(Rect2(d[0] - d[2], d[1] - d[3], d[2] * 2.0, d[3] * 2.0))


## The rest of the floor is simply city: block after block of houses, streets between them, no way to see far.
func _city_blocks() -> void:
	var half: float = kit.world_size / 2.0 - 34.0
	var step := 40.0
	var first := true
	var x := -half
	while x < half:
		var z := -half
		while z < half:
			var at := Vector3(x, 0, z)
			if kit.is_free(at.x, at.z, 23.0) and _rng.randf() > 0.08:
				# streets bend gently across the map, so you never see one run dead straight forever
				var yaw := sin(x * 0.006) * cos(z * 0.005) * 0.55
				_city_block(at, yaw)
				if first and absf(at.x) > 170.0:
					first = false
					views["city"] = [at + Vector3(sin(yaw), 0, cos(yaw)) * 19.5 - Vector3(cos(yaw), 0, -sin(yaw)) * 10.0, yaw - PI / 2.0, 0.1]
			z += step
		x += step


func _city_block(at: Vector3, yaw: float) -> void:
	var basis := Basis(Vector3.UP, yaw)
	for spot: Array in [[Vector3(-8.5, 0, 7.0), 0.0], [Vector3(8.5, 0, 7.0), 0.0], [Vector3(-8.5, 0, -7.0), PI], [Vector3(8.5, 0, -7.0), PI]]:
		if _rng.randf() < 0.12:
			continue
		var p: Vector3 = at + basis * (spot[0] as Vector3)
		_city_house(p, yaw + float(spot[1]))
	var corner: Vector3 = at + basis * Vector3(19.5, 0, 19.5)
	if _rng.randf() < 0.42:
		kit.prop("lamp_post", corner, yaw, 1.0, Vector3(0.15, 2.0, 0.15))
		var light := kit.lamp(Color(["#ffb060", "#ffb060", "#ff8a6a", "#ffd8a0"][_rng.randi() % 4]), 2.2, 22.0, corner + Vector3.UP * 4.2)
		if _rng.randf() < 0.35:
			_flicker(light)
	var mess := _rng.randf()
	var street: Vector3 = at + basis * Vector3(_rng.randf_range(-16, 16), 0, 16.5)
	if mess < 0.2:
		kit.prop("cauldron", street, _rng.randf_range(0, TAU), 1.0, Vector3(0.95, 1.0, 0.95))
		_steam(street + Vector3.UP * 1.6, "#ffc898", 6)
	elif mess < 0.35:
		kit.prop("remains", street, yaw + PI)
		_floor_paint("stain_a", street, Vector2(5, 5), _rng.randf_range(0, TAU))
	elif mess < 0.5:
		var rail := kit.prop("hook_rail", street, yaw)
		_mover(rail, "swing")
		_floor_paint("stain_b", street, Vector2(6, 6), _rng.randf_range(0, TAU))
	elif mess < 0.62:
		kit.prop("barrels", street, _rng.randf_range(0, TAU), 1.0, Vector3(0.8, 1.0, 0.8))
	elif mess < 0.72:
		_floor_paint("drag", street, Vector2(5, 10), _rng.randf_range(0, TAU))
	elif mess < 0.8:
		_rats(street, 2)
	elif mess < 0.88:
		kit.prop("clothesline", at + basis * Vector3(0, 0.4, 19.5), yaw)
	elif mess < 0.94:
		kit.prop("butcher_block", street, yaw, 1.0, Vector3(0.85, 0.7, 0.55))


func _city_house(at: Vector3, yaw: float) -> void:
	_houses += 1
	# One in six you can walk into; the rest keep the street solid.
	if _houses % 6 == 0:
		_ruin(at, yaw, ["Number 7", "Number 41", "Rooms To Let", "Number 88", "Lodgings", "Number 3"][(_houses / 6) % 6], 14.0, 11.0, _rng.randf_range(5.5, 7.5), "facade_a" if _houses % 12 == 0 else "facade_b", "#ffc080")
	else:
		_solid_house(at, yaw)
	if _rng.randf() < 0.08:
		var forward := Vector3(sin(yaw), 0, cos(yaw))
		var graffiti: String = ["hungry", "ask", "bones", "ribs", "hands"][_rng.randi() % 5]
		_wall_paint(graffiti, at + forward * 6.0 + Vector3.UP * 2.8, Vector2(8, 3.6), yaw)


## Blocks of brick tenements on real streets. Most doors open. Washing lines overhead, lit windows, something on the stairs.
func _tenement_quarter(at: Vector3, yaw: float) -> void:
	var basis := Basis(Vector3.UP, yaw)
	var names := ["Number 12", "Number 14", "Boarding House", "Number 19", "Tenement", "The Gravy Rooms", "Number 22", "Number 30"]
	var n := 0
	for street: float in [-20.0, 26.0]:
		for x: float in [-85.0, -66.0, -47.0, -28.0, 28.0, 47.0, 66.0, 85.0]:
			for side: float in [-1.0, 1.0]:
				var local := Vector3(x + _rng.randf_range(-1.0, 1.0), 0, street + side * 10.5)
				var p: Vector3 = basis * local + at
				if not kit.is_free(p.x, p.z, 7.0) or _rng.randf() < 0.14:
					continue
				var face := yaw + (0.0 if side < 0.0 else PI)
				if n % 3 == 0:
					_ruin(p, face, names[n % names.size()], _rng.randf_range(13, 16), _rng.randf_range(10, 12), _rng.randf_range(5.5, 8.5), "facade_a" if n % 2 == 0 else "facade_b", "#ffc080")
				else:
					_solid_house(p, face)
				n += 1
		_stains(at + basis * Vector3(_rng.randf_range(-60, 60), 0, street), 16.0, 3)
		for x: float in [-70.0, -24.0, 24.0, 70.0]:
			var lamp_at: Vector3 = basis * Vector3(x, 0, street - 7.5) + at
			if kit.is_free(lamp_at.x, lamp_at.z, 1.0):
				kit.prop("lamp_post", lamp_at, yaw, 1.0, Vector3(0.15, 2.0, 0.15))
				var light := _light("#ffb060", 1.1, 14.0, lamp_at + Vector3.UP * 4.0, x == -24.0)
				if _rng.randf() < 0.4:
					_flicker(light)
		for x: float in [-56.0, 0.0, 56.0]:
			var line_at: Vector3 = basis * Vector3(x, 0, street) + at
			if kit.is_free(line_at.x, line_at.z, 1.0):
				kit.prop("clothesline", line_at + Vector3.UP * 0.4, yaw + PI / 2.0)
		for i in 5:
			var clutter: Vector3 = basis * Vector3(_rng.randf_range(-90, 90), 0, street + _rng.randf_range(-6.0, 6.0)) + at
			if kit.is_free(clutter.x, clutter.z, 1.0):
				var choice: String = ["barrels", "crates", "trash_can", "cauldron", "pipes"][i]
				kit.prop(choice, clutter, _rng.randf_range(0, TAU), 1.0, Vector3(0.8, 1.0, 0.8) if choice != "pipes" else Vector3(0.5, 2.0, 0.5))
		_rats(at + basis * Vector3(_rng.randf_range(-50, 50), 0, street), 4)
	_watcher(at + basis * Vector3(-40, 5.6, -30))
	_watcher(at + basis * Vector3(50, 6.0, 36))


func _solid_house(at: Vector3, yaw: float) -> void:
	# A building you can't get into is fine too. It keeps the street solid, and its windows are lit for someone.
	var w := _rng.randf_range(13.0, 16.0)
	var d := _rng.randf_range(10.0, 12.0)
	var h := _rng.randf_range(6.0, 11.0)
	var mat := kit.surface("facade_a" if _rng.randf() < 0.65 else "facade_b", Vector2(w, h), 6.0)
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	var side := Vector3(cos(yaw), 0, -sin(yaw))
	kit.quad(Vector2(w, h), mat, at + forward * (d / 2.0) + Vector3.UP * h / 2.0, Vector3(0, yaw, 0))
	kit.quad(Vector2(w, h), mat, at - forward * (d / 2.0) + Vector3.UP * h / 2.0, Vector3(0, yaw + PI, 0))
	var side_mat := kit.surface("facade_a", Vector2(d, h), 6.0)
	kit.quad(Vector2(d, h), side_mat, at + side * (w / 2.0) + Vector3.UP * h / 2.0, Vector3(0, yaw + PI / 2.0, 0))
	kit.quad(Vector2(d, h), side_mat, at - side * (w / 2.0) + Vector3.UP * h / 2.0, Vector3(0, yaw - PI / 2.0, 0))
	kit.box_collider(at + Vector3.UP * h / 2.0, Vector3(w / 2.0, h / 2.0, d / 2.0), yaw)
	kit.block(Vector3(w + 0.5, 0.4, d + 0.5), kit.flat(Color("#4a3020")), at + Vector3.UP * h, yaw)
	for floor_y: float in [2.2, 5.0, 7.8]:
		if floor_y > h - 1.0:
			continue
		for x: float in [-w * 0.3, 0.0, w * 0.3]:
			_batched(_window_for("window"), at + side * x + forward * (d / 2.0) + Vector3.UP * floor_y, yaw)
	_weather_building(at, yaw, w, d, h, true)
	kit.prop("pipes", at - side * (w * 0.28) - forward * (d * 0.1) + Vector3.UP * (h - 0.2), yaw, 0.65)


func _rats(at: Vector3, count: int) -> void:
	for i in count:
		var p := at + Vector3(_rng.randf_range(-8, 8), 0, _rng.randf_range(-5, 5))
		var rat := kit.prop("rat", p, _rng.randf_range(0, TAU), _rng.randf_range(1.2, 1.9))
		_mover(rat, "scurry", { "speed": _rng.randf_range(0.5, 1.1), "radius": _rng.randf_range(4.0, 12.0) })


func _butchers_row(at: Vector3, yaw: float) -> void:
	# Open-fronted stalls, a sawdust road, and row on row of hanging sides. They sway a little. There isn't any wind.
	var basis := Basis(Vector3.UP, yaw)
	_post_sign("butcher", at + basis * Vector3(0, 0, 44), yaw)
	for side: float in [-1.0, 1.0]:
		for i in 6:
			var rail := kit.prop("hook_rail", at + basis * Vector3(side * 11.0, 0, -36.0 + i * 13.0), yaw + PI / 2.0)
			_mover(rail, "swing")
			kit.prop("butcher_block", at + basis * Vector3(side * 7.0, 0, -32.0 + i * 13.0), yaw + side * 1.3, 1.0, Vector3(0.85, 0.7, 0.55))
			_stains(at + basis * Vector3(side * 8.0, 0, -36.0 + i * 13.0), 5.0, 2)
		_ruin(at + basis * Vector3(side * 25.0, 0, -18.0), yaw - side * PI / 2.0, "Cuts", 15.0, 11.0, 6.0, "facade_a", "#ffb8a8")
		_ruin(at + basis * Vector3(side * 25.0, 0, 18.0), yaw - side * PI / 2.0, "Offal & Sons", 15.0, 11.0, 6.5, "facade_b", "#ffb8a8")
	# lanes of light in the fog, red from the meat lamps
	for i in 4:
		_flicker(_light("#ff8a6a", 1.4, 16.0, at + basis * Vector3(0, 5.0, -30.0 + i * 20.0)))
	for i in 3:
		_drag_mark(at + basis * Vector3(_rng.randf_range(-3, 3), 0, -26.0 + i * 22.0), yaw + _rng.randf_range(-0.3, 0.3), 12.0)
	_rats(at, 8)
	_wall_paint("ribs", at + basis * Vector3(0, 3.6, -46.3), Vector2(9, 5.6), yaw)
	_wall(at + basis * Vector3(-6, 0, -47), yaw, 1)
	kit.prop("remains", at + basis * Vector3(1, 0, -44), yaw)


func _banquet_hall(at: Vector3, yaw: float) -> void:
	# A silent dinner, out in the open. Everyone came early. Nobody got up.
	var basis := Basis(Vector3.UP, yaw)
	_post_sign("banquet", at + basis * Vector3(-12, 0, 16), yaw)
	for row in 3:
		var p: Vector3 = at + basis * Vector3(0, 0, -12.0 + row * 12.0)
		kit.prop("banquet", p, yaw, 1.0, Vector3(6.6, 0.8, 1.7))
		_flicker(_light("#ffb868", 1.4, 15.0, p + Vector3.UP * 2.6, row == 1), "candle")
	kit.prop("cauldron", at + basis * Vector3(10.5, 0, 0), yaw, 1.6, Vector3(1.5, 1.2, 1.5))
	_steam(at + basis * Vector3(10.5, 2.6, 0), "#ffc898", 8)
	_rats(at, 5)
	kit.interactables.append({ "pos": at + basis * Vector3(0, 0, 18), "r": 6.0, "text": "There's a place laid at the end, and a card with your name on it." })


func _toll_road() -> void:
	# From the town's north gate to the Cathedral's door, both verges are lined with people who didn't pay.
	_post_sign("toll", Vector3(-9, 0, -70), 0.0)
	var z := -72.0
	var i := 0
	while z > -262.0:
		for side: float in [-1.0, 1.0]:
			var x := side * (8.5 + _rng.randf_range(-0.7, 0.7))
			var stake := kit.prop("toll_stake", Vector3(x, 0, z), _rng.randf_range(-0.5, 0.5) + (0.0 if side < 0.0 else PI / 8.0), 1.0, Vector3(0.2, 2.0, 0.2))
			if i % 4 == 0:
				_mover(stake, "sway")
			if i % 3 == 0:
				_floor_paint("stain_b", Vector3(x, 0, z), Vector2(4, 4), _rng.randf_range(0, TAU))
		if i % 5 == 0:
			_flicker(_light("#ff9a4a", 1.2, 15.0, Vector3(_rng.randf_range(-6, 6), 2.5, z)), "candle")
			kit.prop("cones", Vector3(_rng.randf_range(-6, 6), 0, z), _rng.randf_range(0, TAU))
		z -= 9.0
		i += 1


func _broth_canal() -> void:
	# A wide canal of orange soup across the south of the floor. You can wade it, and there are bridges, and a ladle line.
	var water := PlaneMesh.new()
	water.size = Vector2(1000, 62)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color("#a8501e")
	mat.roughness = 0.2
	mat.emission_enabled = true
	mat.emission = Color("#4a1e06")
	var soup := kit.mesh_node(water, mat, Vector3(0, 0.06, 335))
	soup.visibility_range_end = 0.0
	_post_sign("canal", Vector3(20, 0, 295), PI)
	kit.prop("giant_ladle", Vector3(140, 0, 340), 0.6, 1.0, Vector3(0.7, 3.0, 0.7))
	kit.prop("giant_ladle", Vector3(-300, 0, 325), 2.4, 0.8, Vector3(0.6, 3.0, 0.6))
	for x: float in [-180.0, 60.0, 300.0]:
		for z: float in [305.0, 317.0, 329.0, 341.0, 353.0, 365.0]:
			kit.block(Vector3(7, 0.5, 12.2), kit.flat(Color("#6a4a2a")), Vector3(x, 0.45, z))
		for s: float in [-1.0, 1.0]:
			kit.block(Vector3(0.2, 1.0, 72), kit.flat(Color("#4a3020")), Vector3(x + s * 3.5, 1.1, 335))
	for i in 22:
		var at := Vector3(_rng.randf_range(-460, 460), 0.1, _rng.randf_range(308, 362))
		kit.prop("bone_heap", at + Vector3.DOWN * 0.6, _rng.randf_range(0, TAU), _rng.randf_range(0.3, 0.7))
	for x: float in [-240.0, -60.0, 180.0, 400.0]:
		_flicker(_light("#ff9a3a", 1.5, 22.0, Vector3(x, 3.0, 335)), "candle")
		_steam(Vector3(x, 0.2, 335 + _rng.randf_range(-16, 16)), "#ffc088", 12)
	_ride_line(Vector3(-40, 0, 278), Vector3(-40, 0, 398), "zip_rail", "Press E: climb into the ladle", "Press E: ride the ladle back")
	_post_sign("ladle", Vector3(-34, 0, 282), PI)
	kit.prop("ladle_car", Vector3(-40, 5.2, 262), 0.0)


func _pickle_market(at: Vector3) -> void:
	_post_sign("jars", at + Vector3(0, 0, 34), PI)
	for row in 3:
		for col in 5:
			var p := at + Vector3((col - 2) * 11.0 + _rng.randf_range(-1, 1), 0, (row - 1) * 15.0 + _rng.randf_range(-1, 1))
			kit.prop("jar_shelf", p, (0.0 if row % 2 else PI) + _rng.randf_range(-0.15, 0.15), 1.0, Vector3(1.5, 1.1, 0.3))
	for x: float in [-16.0, 12.0]:
		_flicker(_light("#d8e88a", 1.5, 16.0, at + Vector3(x, 3.4, 0)))
	_watcher(at + Vector3(0, 2.0, -24))
	_rats(at, 4)


func _bone_yard(at: Vector3) -> void:
	_post_sign("bone", at + Vector3(-14, 0, 22), 0.5)
	for i in 8:
		var a := i * 0.8
		kit.prop("bone_heap", at + Vector3(cos(a), 0, sin(a)) * (8.0 + i * 3.0), a, 1.2 + (i % 3) * 0.4, Vector3(2.4, 1.0, 2.4))
	kit.prop("cauldron", at, 0.3, 4.5, Vector3(3.9, 3.0, 3.9))
	_steam(at + Vector3(0, 6.4, 0), "#ffc088", 16)
	_light("#ff8a3a", 2.4, 26.0, at + Vector3(0, 7.0, 6))
	_rats(at, 7)


func _tallow_graveyard(at: Vector3) -> void:
	# Where candle-folk go. Hundreds of small flames in the fog, and all of them are somebody.
	for row in 6:
		for col in 7:
			var p := at + Vector3((col - 3) * 8.0 + _rng.randf_range(-1.6, 1.6), 0, (row - 2.5) * 8.0 + _rng.randf_range(-1.6, 1.6))
			if kit.is_free(p.x, p.z, 1.0):
				kit.prop("candle_grave", p, _rng.randf_range(0, TAU), _rng.randf_range(0.8, 1.2))
	for i in 4:
		_flicker(_light("#ffb860", 1.5, 18.0, at + Vector3(-18 + i * 12.0, 1.6, (i % 2) * 10.0 - 5.0), false), "candle")
	kit.interactables.append({ "pos": at + Vector3(0, 0, 18), "r": 8.0, "text": "A quiet place. Brother Ash comes here to read to them." })
