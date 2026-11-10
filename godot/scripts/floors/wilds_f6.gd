class_name WildsF6
extends Wilds
## The Canopy's outdoors: 1300 m of black forest under a roof you can't see, with the only light coming from what grows.
## The Glimmerkin run safaris here, and you're what they came to see. They keep very tidy records of how it goes.


func _build_districts() -> void:
	fill_on_hills = true
	_trophy_walk(Vector3(70, 0, -90), Vector3(150, 0, -190))
	_safari_camp(Vector3(-340, 0, -430))
	_hag_hollow(Vector3(-440, 0, -60))
	_flytrap_garden(Vector3(420, 0, -60))
	_kennel_rows(Vector3(320, 0, -420))
	_root_cathedral(Vector3(-160, 0, 430))
	_totem_circle(Vector3(430, 0, 390))
	_pitcher_marsh(Vector3(-440, 0, 400))
	_jeep_tour()
	_canopy_line()
	for spot: Array in [[Vector3(-110, 0, 92), 0.3, "trophy"], [Vector3(110, 0, 92), -0.3, "run"], [Vector3(-40, 0, -95), 0.1, "note"], [Vector3(190, 0, 100), -1.2, "tally"], [Vector3(-290, 0, 90), 1.1, "hands"]]:
		_tag_wall(spot[0], spot[1], spot[2], 6.0 if spot[2] == "hands" else 3.2)
		_claim(spot[0], 10.0, 6.0)
	var deep := _cave_from_rooms("cave_f6", Vector3(240, 0, 120), "Press E: squeeze down between the roots", [[0, 0, 3, 5], [-20, -18, 0, 6], [-46, -20, -3, 7], [-60, -46, -6, 6], [-32, -62, -8, 10], [-6, -44, -5, 5]], "#7affc8", "#ffd86a", 4, "glow_fern", 1.6)
	kit.prop("root_arch", Vector3(240, 0, 120), 0.7, 0.8)
	_post_sign("roots", Vector3(246, 0, 128), 0.3)
	_claim(Vector3(240, 0, 120), 14.0, 14.0)
	for i in 6:
		kit.prop("pitcher", deep + Vector3(-8.0 + i * 3.0, 0, -6.0 + (i % 2) * 3.0), i * 1.0, 1.1)
	kit.prop("remains", deep + Vector3(-3, 0, 2), 1.0)
	_view("roots", deep + Vector3(0, 0.2, 11), deep + Vector3(0, 2, -3))
	# the hidden room: inside a tree, behind a curtain of vines you'd walk straight past
	var hatch := Vector3(-90, 0, 180)
	kit.prop("vine_curtain", hatch + Vector3(0, 6, 0), 0.6)
	_batched("jungle_tree", hatch + Vector3(1.6, 0, -2.2), 0.8, 1.0, Vector3(1.6, 8.0, 1.6))
	_claim(hatch, 7.0, 7.0)
	_build_loot_room(hatch, "Press E: push through the vines, into the hollow", "facade_a")
	_apply_claims()
	_view("forest", Vector3(-250, 0, 330), Vector3(-200, 3.5, 280))
	_fill_grid(27.0, 12.0, 30.0, _forest_cell)


## Mile on mile of forest. Trees aren't in rows, things don't repeat, and most patches have something in them to find.
func _forest_cell(at: Vector3, _yaw: float) -> void:
	if _rng.randf() < 0.02:
		# a whole clearing to itself, so nothing grows across the door
		_ruin(at, _rng.randf_range(0, TAU), ["Hide", "Ranger Post", "Gift Shop", "Blind"][_rng.randi() % 4], 11.0, 9.0, 4.2, "facade_a", "#c8ffc8", 1.2)
		return
	var p := at + Vector3(_rng.randf_range(-11, 11), 0, _rng.randf_range(-11, 11))
	if _rng.randf() < 0.8:
		_batched("jungle_tree", p, _rng.randf_range(0, TAU), _rng.randf_range(0.8, 1.3), Vector3(1.4, 8.0, 1.4))
	for i in 3:
		_batched("glow_fern", at + Vector3(_rng.randf_range(-13, 13), 0, _rng.randf_range(-13, 13)), _rng.randf_range(0, TAU), _rng.randf_range(0.8, 1.7))
	if _rng.randf() < 0.42:
		_batched("mushroom", at + Vector3(_rng.randf_range(-12, 12), 0, _rng.randf_range(-12, 12)), _rng.randf_range(0, TAU), _rng.randf_range(0.9, 2.0))
	var mess := _rng.randf()
	var spot := at + Vector3(_rng.randf_range(-9, 9), 0, _rng.randf_range(-9, 9))
	if mess < 0.05:
		_net_trap(spot)
	elif mess < 0.1:
		_mover(kit.prop("flytrap", spot, _rng.randf_range(0, TAU), _rng.randf_range(0.8, 1.2), Vector3(0.4, 1.0, 0.4)), "reach")
	elif mess < 0.13:
		_batched("pitcher", spot, _rng.randf_range(0, TAU), _rng.randf_range(0.8, 1.2), Vector3(0.7, 1.4, 0.7))
	elif mess < 0.17:
		kit.prop("trophy_board", spot, _rng.randf_range(0, TAU))
		_floor_paint("stain_b", spot, Vector2(4, 4), _rng.randf_range(0, TAU))
	elif mess < 0.2:
		_mover(kit.prop("bone_chimes", spot + Vector3.UP * 4.0, _rng.randf_range(0, TAU)), "sway")
	elif mess < 0.23:
		_mover(kit.prop("vine_curtain", spot + Vector3.UP * 9.0, _rng.randf_range(0, TAU)), "sway")
	elif mess < 0.28:
		_floor_paint("drag", spot, Vector2(5, 10), _rng.randf_range(0, TAU))
	elif mess < 0.3:
		kit.prop("remains", spot, _rng.randf_range(0, TAU))
	elif mess < 0.32:
		_watcher(spot + Vector3.UP * _rng.randf_range(1.5, 5.0))
	if _rng.randf() < 0.1:
		var glow := kit.lamp(Color(["#5ae8c8", "#5a8aff", "#c87aff", "#ff7a9a"][_rng.randi() % 4]), 2.0, 22.0, at + Vector3(0, 2.2, 0))
		if _rng.randf() < 0.3:
			_flicker(glow, "candle")


func _net_trap(at: Vector3) -> void:
	var net := kit.prop("net_cocoon", at + Vector3.UP * 9.0, _rng.randf_range(0, TAU))
	_mover(net, "swing")
	_floor_paint("stain_a", at, Vector2(3.5, 3.5), _rng.randf_range(0, TAU))


## A well-kept nature trail from the Treehouse's gate, with an educational display every few steps.
func _trophy_walk(from: Vector3, to: Vector3) -> void:
	_claim_path(from, to, 13.0)
	_post_sign("trail", from + Vector3(-6, 0, 2), PI)
	var yaw := atan2(to.x - from.x, to.z - from.z)
	var side := Vector3(cos(yaw), 0, -sin(yaw))
	var n := int(from.distance_to(to) / 4.5)
	for i in n:
		var p := from.lerp(to, i / float(n))
		for s: float in [-1.0, 1.0]:
			var board := kit.prop("trophy_board", p + side * s * 5.5, yaw + (PI / 2.0 if s < 0.0 else -PI / 2.0), 1.35)
			if i % 4 == 1:
				_mover(board, "stalk", { "creep": false })
		if i % 3 == 0:
			_flicker(_light("#ffd88a", 1.2, 13.0, p + Vector3.UP * 3.2, i == 3), "candle")
		_batched("glow_fern", p + side * 9.5, _rng.randf_range(0, TAU), 1.4)
		_batched("glow_fern", p - side * 9.5, _rng.randf_range(0, TAU), 1.4)
	_view("trophies", from.lerp(to, 0.12), from.lerp(to, 0.45) + Vector3.UP * 2.4 + side * 2.0)


func _safari_camp(at: Vector3) -> void:
	_claim(at, 34.0, 30.0)
	_post_sign("safari", at + Vector3(0, 0, 28), 0.0)
	kit.prop("photo_cutout", at + Vector3(-9, 0, 18), 0.4, 1.0, Vector3(1.2, 1.3, 0.1))
	kit.prop("safari_jeep", at + Vector3(14, 0, 8), 0.8, 1.0, Vector3(0.9, 1.0, 2.0))
	kit.prop("safari_jeep", at + Vector3(-18, 0, -4), -0.4, 1.0, Vector3(0.9, 1.0, 2.0))
	for a: float in [0.6, 1.9, 3.1, 4.4, 5.6]:
		_batched("tent", at + Vector3(cos(a), 0, sin(a)) * 18.0, -a, 1.0, Vector3(1.6, 1.0, 1.9))
		kit.prop("trophy_board", at + Vector3(cos(a + 0.4), 0, sin(a + 0.4)) * 13.0, -a + PI)
	kit.prop("bonfire", at, 0.0, 1.0, Vector3(0.9, 1.0, 0.9))
	kit.prop("hook_rail", at + Vector3(5, 0, -10), 0.5)
	_flicker(_light("#ff9a3a", 2.4, 26.0, at + Vector3(0, 2.4, 0), true), "candle")
	_stains(at + Vector3(5, 0, -10), 6.0, 5)
	_dress(at, 32.0, 28.0, [["crates", 1.0, 1.2, Vector3(0.9, 1.0, 0.7)], ["barrels", 1.0, 1.1, Vector3(0.8, 1.0, 0.8)], ["glow_fern", 1.2, 1.8, Vector3.ZERO], ["jungle_tree", 0.8, 1.1, Vector3(1.4, 8.0, 1.4)]], 40, 13.0)
	_view("safari", at + Vector3(-5, 0, 27), at + Vector3(0, 1.4, 0))


func _hag_hollow(at: Vector3) -> void:
	_claim(at, 34.0, 32.0)
	_post_sign("hollow", at + Vector3(-5, 0, 28), 0.0)
	kit.prop("cauldron", at, 0.3, 3.2, Vector3(2.8, 2.0, 2.8))
	_steam(at + Vector3(0, 3.8, 0), "#a8ff8a", 16)
	_light("#a8ff8a", 1.1, 24.0, at + Vector3(0, 5, 4), true)
	for i in 36:
		var a := i * 2.4
		_mover(kit.prop("bone_chimes", at + Vector3(cos(a), 0, sin(a)) * (7.0 + i * 0.6) + Vector3.UP * _rng.randf_range(3.2, 6.5), a), "sway")
	for i in 5:
		var a := i * 1.25
		kit.prop("bone_heap", at + Vector3(cos(a), 0, sin(a)) * 11.0, a, 0.7)
		_batched("pitcher", at + Vector3(cos(a + 0.6), 0, sin(a + 0.6)) * 18.0, a, 1.2, Vector3(0.8, 1.4, 0.8))
	_dress(at, 32.0, 30.0, [["jungle_tree", 0.9, 1.3, Vector3(1.4, 8.0, 1.4)], ["glow_fern", 1.2, 2.0, Vector3.ZERO], ["mushroom", 1.0, 2.2, Vector3.ZERO]], 42, 14.0)
	_view("hollow", at + Vector3(-4, 0, 24), at + Vector3(0, 2.5, 0))


func _flytrap_garden(at: Vector3) -> void:
	_claim(at, 34.0, 30.0)
	_post_sign("garden", at + Vector3(-20, 0, 24), 0.4)
	for i in 34:
		var a := i * 2.4
		var r := 4.0 + sqrt(i / 34.0) * 26.0
		var trap := kit.prop("flytrap", at + Vector3(cos(a) * r, 0, sin(a) * r), a, _rng.randf_range(1.0, 2.2))
		_mover(trap, "reach")
	_stains(at, 20.0, 9)
	for i in 3:
		_flicker(_light("#ff6a8a", 1.8, 24.0, at + Vector3(-14 + i * 14.0, 4, i * 3.0), i == 1), "candle")
	_dress(at, 32.0, 28.0, [["glow_fern", 1.2, 2.0, Vector3.ZERO], ["jungle_tree", 0.9, 1.2, Vector3(1.4, 8.0, 1.4)]], 34, 10.0)
	_view("traps", at + Vector3(-10, 0, 28), at + Vector3(0, 2.2, 0))


func _kennel_rows(at: Vector3) -> void:
	_claim(at, 30.0, 24.0)
	_post_sign("kennel", at + Vector3(-22, 0, 20), 0.3)
	for row in 2:
		for col in 5:
			var p := at + Vector3((col - 2) * 8.0, 0, -8.0 + row * 18.0)
			kit.prop("kennel", p, 0.0 if row == 0 else PI)
	_flicker(_light("#ffd8a0", 1.5, 22.0, at + Vector3(0, 5, 0), true))
	for i in 3:
		_watcher(at + Vector3(-10 + i * 10.0, 0.9, -9.0))


func _root_cathedral(at: Vector3) -> void:
	# Roots as big as bridges, looping in rings, with a shaft of light at the middle. It's the prettiest place on the floor.
	_claim(at, 36.0, 36.0)
	for i in 10:
		var a := i * TAU / 10.0
		kit.prop("root_arch", at + Vector3(cos(a), 0, sin(a)) * (13.0 + (i % 2) * 11.0), a + PI / 2.0, 1.1 + (i % 3) * 0.3)
	_shaft_of_light(at, "#c8ffe8", 9.0)
	for i in 14:
		var a := i * 2.4
		_batched("glow_fern", at + Vector3(cos(a), 0, sin(a)) * (2.0 + i * 0.5), a, 1.6)
	kit.prop("remains", at + Vector3(1, 0, 1), 0.5)
	_dress(at, 34.0, 34.0, [["glow_fern", 1.2, 2.0, Vector3.ZERO], ["mushroom", 1.0, 2.2, Vector3.ZERO]], 40, 8.0)
	_view("cathedral", at + Vector3(0, 0, 30), at + Vector3(0, 4.5, 0))


func _totem_circle(at: Vector3) -> void:
	_claim(at, 24.0, 24.0)
	for i in 9:
		var a := i * TAU / 9.0
		kit.prop("totem_pole", at + Vector3(cos(a), 0, sin(a)) * 18.0, atan2(cos(a), sin(a)) + PI, 1.0, Vector3(0.7, 4.0, 0.7))
	kit.prop("bonfire", at, 0.0, 1.0, Vector3(0.9, 1.0, 0.9))
	_flicker(_light("#ff8a3a", 2.4, 28.0, at + Vector3(0, 3, 0), true), "candle")
	_stains(at, 8.0, 5)
	_dress(at, 23.0, 23.0, [["glow_fern", 1.2, 2.0, Vector3.ZERO], ["jungle_tree", 0.9, 1.1, Vector3(1.4, 8.0, 1.4)]], 22, 21.0)
	_view("totems", at + Vector3(0, 0, 20), at + Vector3(0, 3.0, -16))


func _pitcher_marsh(at: Vector3) -> void:
	_claim(at, 34.0, 34.0)
	for i in 46:
		var a := i * 2.4
		var r := sqrt(i / 46.0) * 30.0
		_batched("pitcher", at + Vector3(cos(a) * r, 0, sin(a) * r), a, _rng.randf_range(0.7, 1.7), Vector3(0.7, 1.4, 0.7))
	for i in 6:
		_light("#a8e870", 1.3, 16.0, at + Vector3(_rng.randf_range(-24, 24), 2.0, _rng.randf_range(-24, 24)), false)
	_view("marsh", at + Vector3(4, 0, 34), at + Vector3(0, 1.5, 0))


func _jeep_tour() -> void:
	var start := Vector3(70, 0, 120)
	var end := Vector3(130, 0, 390)
	_vehicle_line(start, end, "rail_track", "safari_jeep", "Press E: climb on the back of the safari jeep", "Press E: ride the jeep back")
	_post_sign("jeep", start + Vector3(6, 0, 2), PI)
	for i in 14:
		var p := start.lerp(end, (i + 0.5) / 14.0)
		kit.prop("trophy_board", p + Vector3(7.0 if i % 2 else -7.0, 0, 0), -PI / 2.0 if i % 2 else PI / 2.0)
		_batched("jungle_tree", p + Vector3(14.0 if i % 2 == 0 else -15.0, 0, 3.0), i * 1.0, 1.0, Vector3(1.4, 8.0, 1.4))


func _canopy_line() -> void:
	var start := Vector3(-110, 0, -110)
	var end := Vector3(-260, 0, -290)
	_ride_line(start, end, "zip_rail", "Press E: take the canopy line", "Press E: ride the canopy line back")
