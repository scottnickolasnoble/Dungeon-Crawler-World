class_name WildsF9
extends Wilds
## The Undercity's outdoors, its capital: 1600 m of grand stone civic buildings going green, on boulevards built for crowds that aren't coming back.
## There's an election on. There has always been an election on. Rats run it. They're very good at it, and the city loves them.

var _fronts := 0


func _build_districts() -> void:
	_senate(Vector3(330, 0, -470))
	_vault_street(Vector3(-60, 0, 390))
	_opera(Vector3(-470, 0, -60))
	_rat_court(Vector3(500, 0, 50))
	_city_hall_steps(Vector3(0, 0, -440))
	_spore_cathedral(Vector3(-470, 0, -450))
	_founders_walk(Vector3(120, 0, -110), Vector3(120, 0, 130))
	_metro()
	_boulevards()
	for spot: Array in [[Vector3(-112, 0, 92), 0.3, "vote"], [Vector3(112, 0, 92), -0.3, "city"], [Vector3(-200, 0, -120), 0.7, "senate"], [Vector3(250, 0, 170), -0.7, "metro"], [Vector3(-90, 0, -120), 0.2, "tails"]]:
		_tag_wall(spot[0], spot[1], spot[2], 6.0 if spot[2] == "tails" else 3.2)
		_claim(spot[0], 10.0, 6.0)
	var deep := _cave_from_rooms("cave_f9", Vector3(-200, 0, 130), "Press E: go down into the disused Metro", [[0, 0, 3, 5], [36, 0, 0, 5], [72, 0, -2, 5], [72, 36, -4, 5], [40, 50, -5, 11], [6, 32, -4, 5]], "#e8e0b0", "#8affc8", 4, "ballot_box")
	kit.prop("metro_entrance", Vector3(-200, 0, 130), 0.3)
	_post_sign("metro", Vector3(-193, 0, 137), 0.3)
	_claim(Vector3(-200, 0, 130), 14.0, 14.0)
	# the station that was never on the map, with its last train still waiting
	kit.prop("subway_car", deep + Vector3(-6, 0, 3), PI / 2.0, 0.8)
	for i in 8:
		kit.prop("ballot_box", deep + Vector3(-12.0 + i * 3.4, 0, -8.0), 0.0)
	_view("station", deep + Vector3(3, 0.2, 6), deep + Vector3(-3, 1.6, -3))
	# the hidden room: a safety deposit box. A big one. The key is under a bench nobody would want to sit on.
	var hatch := Vector3(-330, 0, 300)
	kit.prop("deposit_boxes", hatch + Vector3(0, 0, -3), 0.0, 1.0, Vector3(4.0, 2.2, 0.3))
	_claim(hatch, 7.0, 7.0)
	_build_loot_room(hatch, "Press E: open box 4417 and climb in", "facade_a")
	_apply_claims()
	_fill_grid(62.0, 33.0, 40.0, _civic_block)


## Great grand fronts, along wide empty boulevards. They're all closed for the election.
func _civic_block(at: Vector3, yaw: float) -> void:
	_fronts += 1
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	var side := Vector3(cos(yaw), 0, -sin(yaw))
	if _fronts % 7 == 0:
		_ruin(at, yaw, ["Ministry of Drains", "Public Records", "Registrar of Tails", "Municipal Baths", "Bureau of Weights", "Old Exchange"][(_fronts / 7) % 6], 26.0, 18.0, 13.0, "facade_a" if _fronts % 2 == 0 else "facade_b", "#d8ffe0", 2.0)
	else:
		var h := _rng.randf_range(15.0, 24.0)
		_solid_building(at, yaw, 26.0, 26.0, h, "facade_a" if _fronts % 3 else "facade_b", "facade_b", Color("#3a4a44"), "", 10.0)
		_batched("civic_front", at + forward * 13.2, yaw, 1.0 if h > 16.0 else 0.95)
		_batched("civic_front", at - forward * 13.2, yaw + PI, 1.0 if h > 16.0 else 0.95)
	var lamp_at := at + side * 24.0 + forward * 18.0
	_batched("lamp_post", lamp_at, yaw, 1.5, Vector3(0.2, 2.0, 0.2))
	if _rng.randf() < 0.4:
		var street_lamp := _light(["#ffd68a", "#8affc8", "#d8c8ff"][_rng.randi() % 3], 2.2, 26.0, lamp_at + Vector3.UP * 6.2, false)
		if _rng.randf() < 0.3:
			_flicker(street_lamp)
	var mess := _rng.randf()
	var spot := at + forward * 22.0 + side * _rng.randf_range(-20, 20)
	if mess < 0.14:
		kit.prop("tail_knot", spot + Vector3.UP * 3.2, yaw)
	elif mess < 0.28:
		_batched("ballot_box", spot, _rng.randf_range(0, TAU), 1.0, Vector3(0.5, 0.6, 0.5))
	elif mess < 0.38:
		_rats(spot, 3)
	elif mess < 0.48:
		_batched("big_toadstool", spot, _rng.randf_range(0, TAU), _rng.randf_range(0.5, 1.0), Vector3(0.5, 2.0, 0.5))
	elif mess < 0.56:
		_batched("bench", spot, yaw, 1.0, Vector3(1.0, 0.5, 0.3))
		kit.prop("remains", spot + side * 2.0, yaw)
	elif mess < 0.62:
		_floor_paint("stain_a", spot, Vector2(6, 6), _rng.randf_range(0, TAU))
		_floor_paint("drag", spot + forward, Vector2(5, 10), _rng.randf_range(0, TAU))
	elif mess < 0.66:
		_batched("rat_statue", spot, yaw, 0.55, Vector3(1.2, 2.0, 1.2))
	if _fronts % 13 == 0:
		_wall_paint("candidate", at + forward * 14.0 + side * 8.0 + Vector3.UP * 3.0, Vector2(4, 3), yaw)


func _boulevards() -> void:
	# Two great axes through the city, with the Founder's statue at every crossing.
	var half: float = kit.world_size / 2.0
	var ew := Vector2(kit.world_size, 22)
	kit.plane(ew, kit.surface("pave", ew, 12.0, 0.5), Vector3(0, 0.012, 96)).visibility_range_end = 0.0
	var ns := Vector2(22, kit.world_size)
	kit.plane(ns, kit.surface("pave", ns, 12.0, 0.5), Vector3(-96, 0.014, 0)).visibility_range_end = 0.0
	_claim(Vector3(0, 0, 96), half, 13.0)
	_claim(Vector3(-96, 0, 0), 13.0, half)


## The chamber's three banks of curved benches, packed to the rafters, all facing the Speaker's empty ballot box.
func _senate(at: Vector3) -> void:
	_claim(at, 42.0, 42.0)
	_post_sign("senate", at + Vector3(-14, 0, -26), 0.3)
	for i in 3:
		kit.prop("senate_tier", at, i * TAU / 3.0 + PI, 1.0)
	kit.prop("ballot_box", at, 0.0, 2.2, Vector3(1.1, 1.3, 1.1))
	_stalker("rat_statue", at + Vector3(0, 0, 4), false, 0.45)
	_light("#d8a8ff", 1.1, 26.0, at + Vector3(0, 10, 0), true)
	_rats(at, 14)
	for i in 6:
		kit.prop("tail_knot", at + Vector3(cos(i * 1.05), 0, sin(i * 1.05)) * 24.0 + Vector3.UP * 4.0, i * 1.05)
	_dress(at, 40.0, 40.0, [["ballot_box", 1.0, 1.0, Vector3(0.5, 0.6, 0.5)], ["petitioner", 1.0, 1.0, Vector3(0.3, 1.0, 0.3)], ["bench", 1.0, 1.0, Vector3.ZERO]], 30, 18.0)
	_view("senate", at + Vector3(5, 0, -8), at + Vector3(0, 3.0, 8))


## The door, wide as a barn, still open, in the middle of the road. A hundred and sixty million in the road around it.
func _vault_street(at: Vector3) -> void:
	_claim(at, 44.0, 40.0)
	kit.prop("vault_door", at, PI + 0.2, 1.0, Vector3(7.0, 7.0, 1.2))
	_post_sign("vault", at + Vector3(12, 0, -22), PI)
	for i in 9:
		var p := at + Vector3(-34.0 + i * 8.5, 0, -14.0 + (i % 2) * 28.0)
		_batched("deposit_boxes", p, 0.0 if i % 2 else PI, 1.0, Vector3(4.0, 2.2, 0.3))
	_light("#ffd88a", 1.3, 30.0, at + Vector3(2, 11, -9), true)
	_dress(at, 42.0, 38.0, [["petitioner", 1.0, 1.0, Vector3(0.3, 1.0, 0.3)], ["bench", 1.0, 1.0, Vector3.ZERO], ["lamp_post", 1.5, 1.5, Vector3(0.2, 2.0, 0.2)], ["crates", 1.0, 1.1, Vector3(0.9, 1.0, 0.7)]], 44, 12.0)
	_view("vault", at + Vector3(-12, 0, -26), at + Vector3(0, 6.0, 0))


## An opera house with no roof, its audience grown in place. Tonight's programme is the same note, and they're holding it.
func _opera(at: Vector3) -> void:
	_claim(at, 44.0, 44.0)
	_post_sign("opera", at + Vector3(0, 0, 38), 0.0)
	for row in 7:
		var count := 6 + row * 2
		for i in count:
			var a := -1.1 + 2.2 * i / float(count - 1)
			var r := 10.0 + row * 4.0
			_batched("big_toadstool", at + Vector3(sin(a) * r, 0, cos(a) * r), a + PI, _rng.randf_range(0.5, 0.9), Vector3(0.4, 2.0, 0.4))
	kit.prop("big_toadstool", at + Vector3(0, 0, -6), 0.0, 2.6, Vector3(1.0, 3.0, 1.0))
	_shaft_of_light(at + Vector3(0, 0, -6), "#e8c8ff", 4.0)
	for i in 5:
		_flicker(_light("#c8a8ff", 0.5, 18.0, at + Vector3(-28 + i * 14.0, 4, 18), i == 2), "candle")
	_view("opera", at + Vector3(4, 0, 34), at + Vector3(0, 4.0, -6))


func _rat_court(at: Vector3) -> void:
	_claim(at, 44.0, 44.0)
	kit.prop("rat_throne", at + Vector3(0, 0, -6), PI, 1.3, Vector3(3.0, 3.0, 3.0))
	_post_sign("throne", at + Vector3(-34, 0, 2), -PI / 2.0)
	for i in 10:
		var a := i * TAU / 10.0
		kit.prop("civic_front", at + Vector3(cos(a), 0, sin(a)) * 38.0, atan2(-cos(a), -sin(a)), 0.8)
	_rats(at, 22)
	_stains(at + Vector3(0, 0, 4), 12.0, 7)
	_flicker(_light("#ffb860", 1.4, 32.0, at + Vector3(0, 12, 8), true), "candle")
	_dress(at, 30.0, 30.0, [["petitioner", 1.0, 1.0, Vector3(0.3, 1.0, 0.3)], ["junk_pile", 0.8, 1.2, Vector3.ZERO], ["barrels", 1.0, 1.1, Vector3(0.8, 1.0, 0.8)]], 30, 11.0)
	_view("throne", at + Vector3(-3, 0, 22), at + Vector3(0, 5, -6))


## The Undermayor's steps. Every petitioner who ever climbed them has stayed, to see it through to the end of the queue.
func _city_hall_steps(at: Vector3) -> void:
	_claim(at, 40.0, 50.0)
	kit.prop("civic_front", at + Vector3(0, 0, -30), 0.0, 1.5, Vector3(18.0, 5.0, 1.2))
	_post_sign("hall", at + Vector3(14, 0, 8), 0.0)
	for row in 5:
		for i in 13:
			var p := at + Vector3(-24.0 + i * 4.0 + _rng.randf_range(-0.5, 0.5), 0, -18.0 + row * 7.0)
			kit.prop("remains", p, PI) if (row + i) % 3 == 0 else _batched("petitioner", p, PI, 1.0, Vector3(0.3, 1.0, 0.3))
	_batched("rat_statue", at + Vector3(0, 0, -26), 0.0, 1.0, Vector3(1.8, 2.0, 1.8))
	_light("#ffd68a", 1.4, 42.0, at + Vector3(0, 16, -14), true)
	_view("hall", at + Vector3(-12, 0, 18), at + Vector3(0, 11.0, -30))


func _spore_cathedral(at: Vector3) -> void:
	_claim(at, 40.0, 60.0)
	_post_sign("cathedral", at + Vector3(-13, 0, 53), 0.0)
	for i in 8:
		kit.prop("spore_arch", at + Vector3(0, 0, -44.0 + i * 13.0), 0.0, 1.0)
		for s: float in [-1.0, 1.0]:
			kit.box_collider(at + Vector3(s * 8.6, 3, -44.0 + i * 13.0), Vector3(0.8, 3, 0.8))
	_shaft_of_light(at + Vector3(0, 0, -30), "#a8ffd8", 4.0)
	for i in 16:
		_batched("big_toadstool", at + Vector3(_rng.randf_range(-6, 6), 0, -40.0 + i * 5.0), _rng.randf_range(0, TAU), _rng.randf_range(0.25, 0.5))
	for i in 5:
		_light("#a8ffd8", 0.55, 20.0, at + Vector3(0, 7, -38.0 + i * 18.0), false)
	_steam(at + Vector3(0, 0.4, -30), "#a8ffd8", 14)
	_view("cathedral", at + Vector3(0, 0, 40), at + Vector3(0, 7, -20))


func _founders_walk(from: Vector3, to: Vector3) -> void:
	# A line of his statues out of the east gate. He looks more and more like himself the further on you go.
	var n := 6
	for i in n:
		var p := from.lerp(to, i / float(n - 1))
		for s: float in [-1.0, 1.0]:
			_batched("rat_statue", p + Vector3(s * 9.0, 0, 0), -s * PI / 2.0, 0.5 + i * 0.05, Vector3(1.2, 2.0, 1.2))
		kit.prop("tail_knot", p + Vector3.UP * 3.0, PI / 2.0)
	_claim(from.lerp(to, 0.5), 14.0, absf(to.z - from.z) / 2.0 + 6.0)


func _metro() -> void:
	var start := Vector3(50, 0, 125)
	var end := Vector3(10, 0, 330)
	_vehicle_line(start, end, "rail_track", "subway_car", "Press E: board the last Metro", "Press E: take the Metro back")
	_post_sign("metro", start + Vector3(9, 0, 2), PI)
	kit.prop("metro_entrance", start + Vector3(-11, 0, -4), 1.2)
	_claim(start + Vector3(-16, 0, 16), 16.0, 24.0)
	_dress(start + Vector3(-16, 0, 16), 13.0, 22.0, [["petitioner", 1.0, 1.0, Vector3(0.3, 1.0, 0.3)], ["bench", 1.0, 1.0, Vector3.ZERO], ["ballot_box", 1.0, 1.0, Vector3(0.5, 0.6, 0.5)]], 18)
	_view("metro", start + Vector3(-5, 0, -22), start + Vector3(0, 2, 10))


func _rats(at: Vector3, count: int) -> void:
	for i in count:
		var rat := kit.prop("rat", at + Vector3(_rng.randf_range(-10, 10), 0, _rng.randf_range(-10, 10)), _rng.randf_range(0, TAU), _rng.randf_range(1.3, 2.0))
		_mover(rat, "scurry", { "speed": _rng.randf_range(0.5, 1.1), "radius": _rng.randf_range(4.0, 12.0) })
