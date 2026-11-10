class_name WildsF2
extends Wilds
## Spin City's outdoors: bright, clean, humming, and very wrong. Nothing here hides in the dark; it hangs in plain view.
## Districts sit around the prototype's camps, villages and landmarks. The floor is 860 m across.

const SHEETS := ["figure", "plain", "reach", "plain", "tall", "blood", "plain", "many", "plain"]


func _build_districts() -> void:
	views = {
		"hall": [Vector3(-6, 0, 132), PI, 0.02],
		"sheets": [Vector3(35, 0, -128), 0.15, 0.02],
		"press": [Vector3(310, 0, -148), 0.2, 0.06],
		"pressin": [Vector3(322, 0, -196), 0.0, -0.02],
		"bleach": [Vector3(332, 0, 118), 0.05, 0.0],
		"drains": [Vector3(-330, 0, 288), 0.1, -0.16],
		"fold": [Vector3(-60, 0, 330), 0.3, -0.1],
		"ebb": [Vector3(-104, 0, -80), 0.5, -0.2],
		"bags": [Vector3(-236, 0, -226), -0.86, 0.22],
		"cave": [Wilds.CAVE_AT + Vector3(12, -7.0, -56), 0.0, 0.0],
		"shoes": [Vector3(388, 0, 342), -0.8, 0.12],
	}
	_wash_hall(Vector3(0, 0, 165), 0.0, 8, 15)
	_wash_hall(Vector3(-380, 0, -30), 0.5, 6, 10)
	_wash_hall(Vector3(160, 0, -130), -0.35, 5, 8)
	_wash_hall(Vector3(370, 0, -40), 1.1, 5, 9)
	_drying_yard(Vector3(35, 0, -170))
	_drying_yard(Vector3(-400, 0, 250))
	_pressing_plant(Vector3(322, 0, -190))
	_bleach_works(Vector3(330, 0, 90))
	_drain_field(Vector3(-330, 0, 260))
	_folding_hall(Vector3(-60, 0, 340))
	_shrine_of_wet_floors(Vector3(-110, 0, -90))
	_the_conveyor()
	_shoes(Vector3(400, 0, 330))
	_shoes(Vector3(-300, 0, -330))
	_shoes(Vector3(120, 0, 395))
	for w: Array in [[Vector3(-130, 0, 100), 0.4, "lost"], [Vector3(250, 0, 70), -0.3, "count"], [Vector3(-90, 0, -210), 1.2, "wash"], [Vector3(400, 0, -300), 2.5, "cold"]]:
		_wall(w[0] - Vector3(cos(float(w[1])), 0, -sin(float(w[1]))) * 6.0, w[1], 1)
		var forward := Vector3(sin(float(w[1])), 0, cos(float(w[1])))
		_wall_paint(w[2], w[0] + forward * 0.66 + Vector3.UP * 3.4, Vector2(8, 3.2 if w[2] != "lost" else 6.0), w[1])
	# lint rains on everything, but here and there a machine still runs for no one
	for at: Vector3 in [Vector3(90, 0, 40), Vector3(-140, 0, 40), Vector3(150, 0, 310), Vector3(-200, 0, 330)]:
		_steam(at, "#e8f4f0", 8)
	_build_cave("cave_f2", Vector3(-150, 0, -320), "Press E: crawl into the lint duct", [Vector3(0, 0, 0), Vector3(-26, -3, 8), Vector3(-46, -6, 30), Vector3(-20, -8, 50), Vector3(12, -12, 62), Vector3(20, -12, 54)], "#d8e8ff", "#ff6a5a")
	cave_walk_yaw = atan2(26.0, 8.0)
	kit.prop("manhole", Vector3(-150, 0, -320), 0.3)
	_post_sign("duct", Vector3(-144, 0, -312), 0.5)
	_steam(Vector3(-150, 0.2, -320), "#c8c8c0", 8)
	var hidden := Wilds.CAVE_AT + Vector3(12, -12.0, -62)
	kit.prop("loot_chest", hidden + Vector3(2, 0, -4), 0.6)
	kit.prop("remains", hidden + Vector3(-1, 0, -5.5), 0.3)
	kit.interactables.append({ "pos": hidden + Vector3(2, 0, -4), "r": 3.0, "text": "A loot box matted in lint. Loot arrives with Phase 2." })
	# the hidden room: behind one particular dead machine in the third wash hall
	var odd := Vector3(136, 0, -162)
	kit.prop("washer_red", odd, 2.8, 1.0, Vector3(0.75, 1.0, 0.75))
	_build_loot_room(odd + Vector3(1.6, 0, 1.6), "Press E: climb through the machine. It goes further back than it should.", "facade_b")
	_floor_paint("stain_a", odd + Vector3(1, 0, 1), Vector2(5, 5), 0.4)
	_reserve_districts()
	kit.before_filler()
	_machine_canyons()


func _reserve_districts() -> void:
	# The roads out of town, and every district: the canyons fill in everything else.
	for road: Rect2 in [Rect2(-9, -430, 18, 860), Rect2(-430, -9, 860, 18)]:
		kit.reserve(road)
	for d: Array in [[0, 165, 38, 30], [-380, -30, 26, 28], [160, -130, 22, 22], [370, -40, 26, 24], [35, -170, 52, 56], [-400, 250, 52, 56], [322, -190, 42, 34], [330, 90, 42, 42], [-330, 260, 50, 56], [-60, 340, 26, 32], [-110, -90, 10, 10], [400, 330, 14, 14], [-300, -330, 14, 14], [120, 395, 14, 14], [-150, -320, 12, 12], [-370, -110, 8, 8], [-90, -350, 8, 8], [-130, 100, 12, 6], [250, 70, 12, 6], [-90, -210, 12, 6], [400, -300, 12, 6], [136, -162, 6, 6]]:
		kit.reserve(Rect2(d[0] - d[2], d[1] - d[3], d[2] * 2.0, d[3] * 2.0))


## Everything else on the floor is a labyrinth of machines stacked three high: you are always in a canyon.
func _machine_canyons() -> void:
	var half: float = kit.world_size / 2.0 - 16.0
	var step := 19.0
	var first := true
	var x := -half
	var walls := 0
	while x < half:
		var z := -half
		while z < half:
			var at := Vector3(x + _rng.randf_range(-5, 5), 0, z + _rng.randf_range(-5, 5))
			# each patch of the floor has its own grain, so the aisles never line up across the map
			var grain := sin(x * 0.011) * cos(z * 0.013) * 1.4
			var yaw := grain + (PI / 2.0 if _rng.randf() < 0.5 else 0.0)
			var length := _rng.randf_range(12.0, 25.0)
			if kit.is_free(at.x, at.z, length * 0.55 + 3.0) and _rng.randf() > 0.1:
				_machine_wall(at, yaw, length)
				walls += 1
				if first and absf(at.x) > 110.0:
					first = false
					var along := Vector3(cos(yaw), 0, -sin(yaw))
					var out := Vector3(sin(yaw), 0, cos(yaw))
					views["canyon"] = [at - along * (length * 0.45) + out * 4.5, atan2(-along.x, -along.z), 0.08]
			z += step
		x += step


func _machine_wall(at: Vector3, yaw: float, length: float) -> void:
	var height := 5.4 if _rng.randf() > 0.25 else 7.2
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	var along := Vector3(cos(yaw), 0, -sin(yaw))
	var size := Vector2(length, height)
	var mat := Models.toon(Color.WHITE, _tex("machine_wall"), Vector2(length / 6.0, height / 5.4), 0.25)
	for s: float in [-1.0, 1.0]:
		kit.quad(size, mat, at + forward * (s * 0.7) + Vector3.UP * height / 2.0, Vector3(0, yaw + (0.0 if s > 0.0 else PI), 0))
	kit.block(Vector3(length, 0.4, 1.5), kit.flat(Color("#7f9a96")), at + Vector3.UP * (height + 0.2), yaw)
	for s: float in [-1.0, 1.0]:
		kit.block(Vector3(0.3, height, 1.5), kit.flat(Color("#b8c0ba")), at + along * (s * length / 2.0) + Vector3.UP * height / 2.0, yaw)
	kit.box_collider(at + Vector3.UP * height / 2.0, Vector3(length / 2.0, height / 2.0, 0.75), yaw)
	# real machines and mess at street level, so close up it isn't just paint
	for i in 3:
		var side := -1.0 if _rng.randf() < 0.5 else 1.0
		var spot := at + along * _rng.randf_range(-length * 0.45, length * 0.45) + forward * side * 1.5
		var pick := _rng.randf()
		if pick < 0.55:
			_batched("washer", spot, yaw + (PI if side < 0.0 else 0.0), 1.0, Vector3(0.72, 1.0, 0.72))
		elif pick < 0.7:
			kit.prop("laundry_cart", spot, _rng.randf_range(0, TAU), 1.3, Vector3(0.55, 1.0, 0.55))
		elif pick < 0.8:
			kit.prop("remains", spot, yaw + (PI if side < 0.0 else 0.0))
			_floor_paint("stain_a", spot + Vector3(0, 0, 0.5), Vector2(4, 4), _rng.randf_range(0, TAU))
		elif pick < 0.9:
			_floor_paint("drag", spot, Vector2(4, 8), _rng.randf_range(0, TAU))
		else:
			kit.prop("clothesline", spot + forward * side * 5.0, yaw)
	if _rng.randf() < 0.2:
		var lamp_at := at + along * _rng.randf_range(-length * 0.3, length * 0.3)
		var color: String = ["#e8fff8", "#e8fff8", "#fff0c8", "#ff9a8a"][_rng.randi() % 4]
		var light := kit.lamp(Color(color), 1.3, 17.0, lamp_at + Vector3.UP * (height + 1.2))
		if _rng.randf() < 0.4:
			_flicker(light)
		kit.prop("ceiling_light", Vector3(lamp_at.x, height + 2.0, lamp_at.z), yaw, 0.6)
	if _rng.randf() < 0.14:
		var graffiti: String = ["wash", "cold", "count", "hands"][_rng.randi() % 4]
		var side := -1.0 if _rng.randf() < 0.5 else 1.0
		_wall_paint(graffiti, at + forward * side * 0.74 + Vector3.UP * 3.0, Vector2(minf(length * 0.7, 9.0), minf(length * 0.7, 9.0) * 0.4), yaw + (0.0 if side > 0.0 else PI))
	if _rng.randf() < 0.1:
		_steam(at + along * length * 0.3 + Vector3.UP * (height + 0.2), "#e8f4f0", 6)


## Row after row of machines, so uniform it makes your teeth hurt. Some are running. Some are leaking.
func _wash_hall(at: Vector3, yaw: float, rows: int, cols: int) -> void:
	var basis := Basis(Vector3.UP, yaw)
	for r in rows:
		for c in cols:
			var aisle := 1.6 if r % 2 else 0.0
			var local := Vector3((c - cols / 2.0) * 1.5, 0, (r - rows / 2.0) * 5.0 + aisle)
			var p: Vector3 = basis * local + at
			var face := yaw + (PI if r % 2 else 0.0)
			if not kit.is_free(p.x, p.z, 1.0):
				continue
			var roll := _rng.randf()
			if roll < 0.04:
				kit.prop("washer_red", p, face, 1.0, Vector3(0.72, 1.0, 0.72))
				_stains(p + Vector3(sin(face), 0, cos(face)) * 1.6, 1.4, 1)
			elif roll < 0.1:
				var running := kit.prop("washer", p, face, 1.0, Vector3(0.72, 1.0, 0.72))
				_mover(running, "shake")
			else:
				_batched("washer", p, face, 1.0, Vector3(0.72, 1.0, 0.72))
		if r % 2 == 0:
			_pool_lamp(at + basis * Vector3((-cols / 4.0) * 1.5, 0, (r - rows / 2.0) * 5.0), "#e8fff8", 1.0, 16.0, _rng.randf() < 0.3)
	_post_sign("hall", at + basis * Vector3(-(cols / 2.0 + 2.0) * 1.5, 0, 0), yaw + PI / 2.0)
	kit.prop("laundry_cart", at + basis * Vector3((cols / 2.0 + 2.0) * 1.5, 0, 3.0), 1.0, 1.4, Vector3(0.6, 1.0, 0.6))
	kit.prop("remains", at + basis * Vector3((cols / 2.0 + 1.5) * 1.5, 0, -3.5), yaw - PI / 2.0)
	_drag_mark(at + basis * Vector3((cols / 2.0 + 3.0) * 1.5, 0, -8.0), yaw, 12.0)


## A maze of hanging sheets. You can walk through them. You don't have to look at what's behind them, but they sway.
func _drying_yard(at: Vector3) -> void:
	_post_sign("sheets", at + Vector3(-4, 0, 58), PI)
	for row in 9:
		for col in 7:
			var jitter := Vector3(_rng.randf_range(-1.4, 1.4), 0, _rng.randf_range(-1.2, 1.2))
			var p := at + Vector3((col - 3.0) * 13.0, 0, (row - 4.0) * 12.0) + jitter
			if not kit.is_free(p.x, p.z, 1.0) or _rng.randf() < 0.12:
				continue
			var yaw := _rng.randf_range(-0.2, 0.2) + (PI / 2.0 if _rng.randf() < 0.18 else 0.0)
			kit.prop("sheet_frame", p, yaw)
			var kind: String = SHEETS[_rng.randi() % SHEETS.size()]
			var cloth := Node3D.new()
			cloth.position = p + Vector3.UP * 4.65
			cloth.rotation.y = yaw
			kit.root.add_child(cloth)
			var saved := kit.root
			kit.root = cloth
			var face := Models.toon(Color.WHITE, _tex("sheet_" + kind), Vector2.ONE, 0.25)
			kit.quad(Vector2(5.8, 4.4), face, Vector3(0, -2.2, 0))
			kit.root = saved
			_mover(cloth, "sway")
	for i in 7:
		var a := _rng.randf_range(0, TAU)
		_stains(at + Vector3(cos(a), 0, sin(a)) * _rng.randf_range(6.0, 44.0), 3.0, 2)
	kit.prop("remains", at + Vector3(14, 0, 8), 2.0)
	kit.prop("laundry_cart", at + Vector3(-20, 0, -14), 0.4, 1.3, Vector3(0.6, 1.0, 0.6))
	_shaft_of_light(at + Vector3(4, 0, 0), "#fff8e8", 5.0)


## The building that explains the rack of contestants: you can walk in, and they're hanging all down the room.
func _pressing_plant(at: Vector3) -> void:
	_ruin(at, 0.0, "The Pressing Plant", 24.0, 19.0, 7.0, "facade_b", "#fff0d0", 0.35)
	var i := 0
	for z: float in [-5.5, -1.0, 3.5]:
		for x: float in [-6.5, 6.5]:
			kit.prop("pressed_rack", at + Vector3(x, 0, z), 0.0)
			i += 1
	kit.prop("steam_press", at + Vector3(-8.0, 0, -7.3), 0.0, 1.0, Vector3(1.3, 1.0, 0.8))
	kit.prop("steam_press", at + Vector3(8.0, 0, -7.3), 0.0, 1.0, Vector3(1.3, 1.0, 0.8))
	_steam(at + Vector3(-8, 2.4, -7), "#f4f4e8", 8)
	_steam(at + Vector3(8, 2.4, -7), "#f4f4e8", 8)
	_stains(at + Vector3(0, 0, -3), 7.0, 5)
	_drag_mark(at + Vector3(0, 0, 3), 0.1, 11.0)
	_post_sign("press", at + Vector3(-14, 0, 13), 0.1)
	for x: float in [-30.0, 30.0]:
		kit.prop("pressed_rack", at + Vector3(x, 0, 14), 0.3)
	_light("#ffe8c8", 0.5, 14.0, at + Vector3(0, 5.5, 2), false)
	kit.interactables.append({ "pos": at + Vector3(0, 0, -2), "r": 4.0, "text": "Tags on every hanger. Some of these names are from your season." })


func _bleach_works(at: Vector3) -> void:
	_post_sign("bleach", at + Vector3(-4, 0, 34), 0.1)
	for offset: Vector3 in [Vector3(0, 0, 0), Vector3(20, 0, -16), Vector3(-22, 0, -6), Vector3(6, 0, 22)]:
		var p := at + offset
		kit.prop("bleach_vat", p, offset.x, 1.0, Vector3(3.2, 1.1, 3.2))
		_light("#d8ff8a", 1.8, 16.0, p + Vector3.UP * 3.4, false)
		_steam(p + Vector3.UP * 2.0, "#e8ffc0", 10)
	for i in 6:
		var a := i * 1.04
		kit.prop("remains", at + Vector3(cos(a), 0, sin(a)) * 14.0, a)
	for i in 5:
		kit.prop("barrels", at + Vector3(-34 + i * 15.0, 0, 30.0 - i * 2.0), i * 0.9, 1.0, Vector3(0.9, 1.0, 0.8))


func _drain_field(at: Vector3) -> void:
	_post_sign("drains", at + Vector3(4, 0, 50), PI)
	for row in 6:
		for col in 6:
			if _rng.randf() < 0.25:
				continue
			var p := at + Vector3((col - 2.5) * 13.0 + _rng.randf_range(-2.5, 2.5), 0, (row - 2.5) * 13.0 + _rng.randf_range(-2.5, 2.5))
			if not kit.is_free(p.x, p.z, 1.0):
				continue
			var arms := kit.prop("hand_grate", p, _rng.randf_range(0, TAU), 1.0, Vector3(0.7, 0.8, 0.7))
			_mover(arms, "reach")
	_stains(at, 30.0, 12)
	_shaft_of_light(at, "#ff9a8a", 5.0)
	kit.interactables.append({ "pos": at + Vector3(0, 0, 40), "r": 6.0, "text": "They reach for you. They can't get you. Yet." })


func _folding_hall(at: Vector3) -> void:
	_post_sign("fold", at + Vector3(-12, 0, 24), 0.0)
	for row in 5:
		for s: float in [-1.0, 1.0]:
			kit.prop("folding_table", at + Vector3(s * 9.0, 0, -18.0 + row * 8.0), 0.0, 1.0, Vector3(2.2, 0.6, 0.7))
	for i in 3:
		kit.prop("bench", at + Vector3(0, 0, -14.0 + i * 12.0), PI / 2.0, 1.0, Vector3(0.35, 1.0, 1.3))
	_pool_lamp(at + Vector3(0, 0, -8), "#fff8e8", 1.2, 20.0, false)
	_pool_lamp(at + Vector3(0, 0, 10), "#fff8e8", 1.2, 20.0, true)
	kit.interactables.append({ "pos": at, "r": 6.0, "text": "Name tags on every pile. Your name is on one near the end." })


func _shrine_of_wet_floors(at: Vector3) -> void:
	# Head Custodian Ebb's people keep this one. Nobody has crossed it.
	kit.prop("wet_floor_ring", at, 0.3, 1.0)
	kit.prop("remains", at + Vector3(1.5, 0, -0.8), 2.2)
	_light("#b8e8ff", 1.6, 14.0, at + Vector3.UP * 3.5)
	kit.interactables.append({ "pos": at + Vector3(0, 0, 5), "r": 3.0, "text": "CAUTION: WET. It has been wet for a long time." })


func _shoes(at: Vector3) -> void:
	kit.prop("shoe_pile", at, _rng.randf_range(0, TAU), 1.6, Vector3(2.4, 1.0, 2.4))
	_light("#ffe8c0", 1.2, 15.0, at + Vector3.UP * 6.0)
	for i in 3:
		kit.prop("laundry_cart", at + Vector3(cos(i * 2.1), 0, sin(i * 2.1)) * 7.0, i * 0.9, 1.3, Vector3(0.6, 1.0, 0.6))


func _the_conveyor() -> void:
	# The dry-cleaning line runs right across the north-west, carrying its bags past you whether you ride it or not.
	var start := Vector3(-370, 0, -110)
	var end := Vector3(-90, 0, -350)
	_ride_line(start, end, "garment_rail", "Press E: grab the conveyor", "Press E: grab the conveyor back")
	_post_sign("line", start + Vector3(3, 0, 3), PI + 0.3)
	var from := start + Vector3.UP * 6.95
	var to := end + Vector3.UP * 6.95
	for i in 26:
		var bag := kit.prop("garment_bag", from, atan2(to.x - from.x, to.z - from.z) + PI / 2.0)
		_mover(bag, "belt", { "from": from, "to": to, "offset": i / 26.0, "speed": 0.012 })
