class_name WildsF8
extends Wilds
## The Workings' outdoors: a 1500 m mine that's been dug out so far it's a country, hot and low and still running.
## The moles dig, the fryers fry, the Collectors take what's owed, and something soft at the north end tells everyone they've done enough.


func _build_districts() -> void:
	fill_on_hills = true
	_drill_chapel(Vector3(-60, 0, 370))
	_fryer_district(Vector3(500, 0, 80))
	_repo_yard(Vector3(450, 0, -440))
	_nursery(Vector3(-160, 0, -480))
	_stacks(Vector3(-500, 0, -300))
	_mine_gallery(Vector3(-110, 0, -110), Vector3(-430, 0, -60))
	_mine_gallery(Vector3(120, 0, 120), Vector3(420, 0, 420))
	_tally_wall(Vector3(-470, 0, 400))
	_cart_line()
	for spot: Array in [[Vector3(-112, 0, 92), 0.3, "dig"], [Vector3(112, 0, 92), -0.3, "fresh"], [Vector3(60, 0, -110), -0.1, "shift"], [Vector3(-60, 0, -270), 0.4, "mold"], [Vector3(210, 0, -80), -1.0, "hands"]]:
		_tag_wall(spot[0], spot[1], spot[2], 6.0 if spot[2] == "hands" else 3.2)
		_claim(spot[0], 10.0, 6.0)
	var deep := _cave_from_rooms("cave_f8", Vector3(-180, 0, 110), "Press E: climb down into the old galleries", [[0, 0, 3, 5], [-26, 8, 0, 6], [-52, 0, -3, 6], [-66, 30, -6, 7], [-40, 50, -9, 13], [-8, 32, -5, 5]], "#ffd88a", "#9ad8ff", 4, "rock_pillar", 0.28)
	kit.prop("manhole", Vector3(-180, 0, 110), 0.5)
	_post_sign("shaft", Vector3(-174, 0, 118), 0.3)
	_claim(Vector3(-180, 0, 110), 12.0, 12.0)
	# the twelfth miner's chamber. Eleven went down; twelve came up. Here's what the twelfth left behind.
	for i in 11:
		var a := i * TAU / 11.0
		kit.prop("remains", deep + Vector3(cos(a), 0, sin(a)) * 9.0, a + PI)
	kit.prop("crystal", deep + Vector3(0, 0, 2), 0.5, 3.4)
	_view("galleries", deep + Vector3(1, 0.2, 8), deep + Vector3(0, 2, -3))
	# the hidden room: a false wall at the back of a shed, with a miner's lamp hanging on the wrong side
	var hatch := Vector3(-240, 0, 300)
	kit.prop("crates", hatch + Vector3(-1.2, 0, -1), 0.8, 1.0, Vector3(0.9, 1.0, 0.7))
	kit.prop("mine_timber", hatch + Vector3(0, 0, -3), 0.0, 0.5)
	_claim(hatch, 6.0, 6.0)
	_build_loot_room(hatch, "Press E: lift the boards off the old adit", "facade_a")
	_apply_claims()
	_view("rock", Vector3(330, 0, 230), Vector3(280, 4.0, 180))
	_fill_grid(33.0, 16.0, 34.0, _mined_ground)


## The rest of it: raw pillars of rock left to hold the roof up, with sheds, rails and dead machinery among them.
func _mined_ground(at: Vector3, _yaw: float) -> void:
	if _rng.randf() < 0.09:
		# a shed has its own patch of ground, so nothing's left across the door
		_ruin(at, _rng.randf_range(0, TAU), ["Lamp Room", "Pay Office", "Cage Shed", "Powder Store", "Canteen", "Sick Bay"][_rng.randi() % 6], 12.0, 10.0, 4.6, "facade_a" if _rng.randf() < 0.5 else "facade_b", "#ffb860", 1.5)
		return
	var p := at + Vector3(_rng.randf_range(-10, 10), 0, _rng.randf_range(-10, 10))
	if _rng.randf() < 0.5:
		_batched("rock_pillar", p, _rng.randf_range(0, TAU), _rng.randf_range(0.85, 1.2), Vector3(2.6, 9.0, 2.6))
	var mess := _rng.randf()
	var spot := at + Vector3(_rng.randf_range(-11, 11), 0, _rng.randf_range(-11, 11))
	if mess < 0.18:
		_batched("mine_timber", spot, _rng.randf_range(0, TAU))
	elif mess < 0.25:
		_batched("mine_cart", spot, _rng.randf_range(0, TAU), 1.0, Vector3(0.8, 0.8, 1.0))
		_batched("rail_track", spot, _rng.randf_range(0, TAU))
	elif mess < 0.31:
		_batched("clock_gear", spot, _rng.randf_range(0, TAU), _rng.randf_range(0.7, 1.2))
	elif mess < 0.37:
		_batched("grease_pool", spot, _rng.randf_range(0, TAU), _rng.randf_range(0.7, 1.3))
	elif mess < 0.42:
		_batched("mold_bloom", spot, _rng.randf_range(0, TAU), _rng.randf_range(0.4, 0.9))
	elif mess < 0.46:
		kit.prop("remains", spot, _rng.randf_range(0, TAU))
		_floor_paint("drag", spot, Vector2(5, 10), _rng.randf_range(0, TAU))
	elif mess < 0.5:
		_watcher(spot + Vector3.UP * 1.3)
	elif mess < 0.56:
		_batched("crates", spot, _rng.randf_range(0, TAU), 1.0, Vector3(0.9, 1.0, 0.7))
	if _rng.randf() < 0.22:
		var hung := _light(["#ffc890", "#9ad8ff", "#ffe8b0", "#b8f0d8"][_rng.randi() % 4], 2.2, 24.0, at + Vector3(_rng.randf_range(-8, 8), 6.5, _rng.randf_range(-8, 8)), _rng.randf() < 0.2)
		if _rng.randf() < 0.3:
			_flicker(hung)


## The Prophet's rig, screwing itself slowly into the floor, with benches set out to watch. It goes further down every day.
func _drill_chapel(at: Vector3) -> void:
	_claim(at, 36.0, 36.0)
	kit.prop("drill_rig", at, 0.4, 1.0, Vector3(5.5, 4.0, 5.5))
	_post_sign("chapel", at + Vector3(-22, 0, -26), PI)
	for row in 4:
		for col in 6:
			if col == 2 or col == 3:
				continue
			_batched("bench", at + Vector3((col - 2.5) * 5.5, 0, -14.0 - row * 3.0), 0.0, 1.0, Vector3(1.0, 0.5, 0.3))
	for i in 6:
		var a := i * TAU / 6.0
		_flicker(_light("#ff9a4a", 1.6, 18.0, at + Vector3(cos(a), 0, sin(a)) * 11.0 + Vector3.UP * 3.0, i == 0), "candle")
	_stains(at, 7.0, 5)
	_dress(at, 34.0, 34.0, [["crates", 1.0, 1.2, Vector3(0.9, 1.0, 0.7)], ["clock_gear", 0.6, 1.1, Vector3.ZERO], ["junk_pile", 0.8, 1.3, Vector3.ZERO]], 30, 19.0)
	_view("chapel", at + Vector3(5, 0, -28), at + Vector3(0, 8, 0))


## A street of open fryers the size of swimming pools, and rails overhead carrying what's next through the smoke.
func _fryer_district(at: Vector3) -> void:
	_claim(at, 56.0, 62.0)
	_post_sign("fryers", at + Vector3(-42, 0, 0), -PI / 2.0)
	for i in 4:
		var p := at + Vector3(-14.0 if i % 2 else 14.0, 0, -36.0 + i * 24.0)
		kit.prop("fryer_vat", p, 0.0, 1.0, Vector3(5.5, 1.1, 3.5))
		_steam(p + Vector3(-3, 2.0, 0), "#ffd8a0", 16)
		_steam(p + Vector3(3, 2.0, 0), "#ffd8a0", 12)
		_flicker(_light("#ffa84a", 2.8, 30.0, p + Vector3(0, 5.0, 0), i == 1), "candle")
	# the overhead line: a slow parade, hung by the neck, going in raw and coming out golden
	var from := at + Vector3(0, 7.5, -56)
	var to := at + Vector3(0, 7.5, 56)
	for i in 20:
		var body := kit.prop("battered_body", from, 0.0, 1.0)
		_mover(body, "belt", { "from": from, "to": to, "offset": i / 20.0, "speed": 0.012 })
	for z: float in [-52.0, -26.0, 0.0, 26.0, 52.0]:
		_batched("mine_timber", at + Vector3(0, 2.2, z), 0.0, 1.0)
	for i in 5:
		var a := i * 1.3
		kit.prop("fry_mound", at + Vector3(38.0 * cos(a), 0, 44.0 * sin(a)), a, 0.8 + (i % 3) * 0.3, Vector3(3.6, 2.0, 3.6))
	for i in 18:
		_batched("grease_pool", at + Vector3(_rng.randf_range(-36, 36), 0, _rng.randf_range(-46, 46)), _rng.randf_range(0, TAU), _rng.randf_range(0.6, 1.3))
	_dress(at, 52.0, 58.0, [["barrels", 1.0, 1.2, Vector3(0.8, 1.0, 0.8)], ["crates", 1.0, 1.2, Vector3(0.9, 1.0, 0.7)], ["pipes", 1.0, 1.8, Vector3(0.5, 2.0, 0.5)]], 40, 8.0)
	_view("fryers", at + Vector3(-3, 0, -60), at + Vector3(-2, 3.5, -20))


func _repo_yard(at: Vector3) -> void:
	# What's been taken back: houses hung from winches, cars, a bed with someone's shape in it. All numbered. All overdue.
	_claim(at, 54.0, 46.0)
	_post_sign("repo", at + Vector3(-30, 0, 36), 0.3)
	for i in 5:
		var p := at + Vector3(-32.0 + i * 16.0, 0, (i % 2) * 12.0 - 8.0)
		kit.prop("repo_winch", p, _rng.randf_range(-0.2, 0.2), 1.0, Vector3(3.0, 3.0, 1.2))
		_flicker(_light("#ffb030", 2.2, 28.0, p + Vector3(0, 6.5, -6), i == 2), "beacon")
	for i in 22:
		_batched("clock_gear", at + Vector3(_rng.randf_range(-44, 44), 0, _rng.randf_range(-34, 34)), _rng.randf_range(0, TAU), _rng.randf_range(0.5, 1.3))
	for i in 12:
		_batched("car_wreck", at + Vector3(_rng.randf_range(-44, 44), 0, 18.0 + (i % 2) * 6.0), _rng.randf_range(-0.4, 0.4), 1.0, Vector3(0.95, 1.0, 2.15))
	_wall_paint("repo", at + Vector3(0, 3.4, -40.0), Vector2(3.2, 2.4), 0.0)
	_tag_wall(at + Vector3(-18, 0, -40), 0.0, "shift")
	_view("repo", at + Vector3(-14, 0, 38), at + Vector3(0, 7, -4))


## Big Momma Mold's nursery, soft-lit and quiet. White cots to the horizon. She only wants you to get some rest.
func _nursery(at: Vector3) -> void:
	_claim(at, 66.0, 48.0)
	_post_sign("nursery", at + Vector3(0, 0, 40), 0.0)
	for row in 7:
		for col in 11:
			var p := at + Vector3((col - 5) * 10.0 + _rng.randf_range(-0.6, 0.6), 0, (row - 3) * 10.0 + _rng.randf_range(-0.6, 0.6))
			_batched("mold_crib", p, PI / 2.0 + _rng.randf_range(-0.12, 0.12), 1.2, Vector3(0.8, 0.8, 0.5))
			if (row * 3 + col) % 4 == 0:
				_batched("mold_bloom", p + Vector3(3, 0, 3), _rng.randf_range(0, TAU), _rng.randf_range(0.6, 1.1))
	for i in 8:
		_light("#d8ffc0", 1.6, 26.0, at + Vector3(_rng.randf_range(-50, 50), 6.5, _rng.randf_range(-34, 34)), i == 0)
	_view("nursery", at + Vector3(6, 0, 42), at + Vector3(-5, 0.8, 0))


func _stacks(at: Vector3) -> void:
	_claim(at, 40.0, 40.0)
	_post_sign("stack", at + Vector3(10, 0, 30), 0.3)
	for i in 4:
		var a := i * TAU / 4.0 + 0.5
		var p := at + Vector3(cos(a), 0, sin(a)) * 20.0
		kit.prop("furnace_stack", p, -a + PI / 2.0, 1.0, Vector3(3.2, 9.0, 3.2))
		_flicker(_light("#ff7a2a", 3.0, 26.0, p + Vector3(0, 3, 0) + Vector3(sin(-a + PI / 2.0), 0, cos(-a + PI / 2.0)) * 6.0, true), "candle")
	kit.prop("bone_heap", at, 0.3, 1.4)
	_dress(at, 38.0, 38.0, [["crates", 1.0, 1.2, Vector3(0.9, 1.0, 0.7)], ["junk_pile", 0.8, 1.4, Vector3.ZERO], ["mine_cart", 1.0, 1.0, Vector3(0.8, 0.8, 1.0)], ["clock_gear", 0.6, 1.1, Vector3.ZERO]], 40, 26.0)
	_view("stacks", at + Vector3(0, 0, 38), at + Vector3(0, 8, 0))


## A long timbered gallery with the props bowing in, a lamp on every other frame.
func _mine_gallery(from: Vector3, to: Vector3) -> void:
	var yaw := atan2(to.x - from.x, to.z - from.z)
	var n := int(from.distance_to(to) / 11.0)
	for i in n:
		var p := from.lerp(to, i / float(n))
		kit.prop("mine_timber", p, yaw)
		var side := Vector3(cos(yaw), 0, -sin(yaw))
		kit.box_collider(p + side * 3.45 + Vector3.UP * 2.4, Vector3(0.3, 2.4, 0.3), yaw)
		kit.box_collider(p - side * 3.45 + Vector3.UP * 2.4, Vector3(0.3, 2.4, 0.3), yaw)
		if i % 3 == 0:
			_batched("rail_track", p + side * 1.2, yaw)
			_flicker(_light("#ffc060", 1.8, 16.0, p + Vector3.UP * 3.8, i % 9 == 0), "candle")
		_claim(p, 7.0, 7.0)
	if not views.has("gallery"):
		_view("gallery", from.lerp(to, 0.15), from.lerp(to, 0.45) + Vector3.UP * 2.2)


func _tally_wall(at: Vector3) -> void:
	# Eleven down, eleven up, every shift for ninety years, then one day twelve. They've left the board up.
	_claim(at, 18.0, 12.0)
	_tag_wall(at, 0.0, "shift", 3.4)
	kit.prop("noticeboard", at + Vector3(10, 1.6, 2), 0.0)
	_flicker(_light("#ffd88a", 1.4, 12.0, at + Vector3(0, 5, 4), true))
	kit.prop("remains", at + Vector3(-3, 0, 3), 0.8)


func _cart_line() -> void:
	var start := Vector3(70, 0, 130)
	var end := Vector3(30, 0, 400)
	_vehicle_line(start, end, "rail_track", "mine_cart", "Press E: climb in the mine cart", "Press E: ride the cart back")
	_post_sign("cart", start + Vector3(7, 0, 2), PI)
	var yaw := atan2(end.x - start.x, end.z - start.z)
	for i in 12:
		kit.prop("mine_timber", start.lerp(end, (i + 0.5) / 12.0), yaw)
