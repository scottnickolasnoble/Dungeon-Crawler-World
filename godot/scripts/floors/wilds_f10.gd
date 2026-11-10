class_name WildsF10
extends Wilds
## The Backlot: a studio lot that goes on forever. Towns that are only fronts, held up by timber from behind; sound
## stages with catwalks up in the dark; an audience in the bleachers that hasn't moved in years. You're on camera now.

var _lots := 0


func _build_districts() -> void:
	_western_street(Vector3(-460, 0, -120))
	_moon_set(Vector3(480, 0, -380))
	_horror_alley(Vector3(-420, 0, 430))
	_sound_stage(Vector3(420, 0, 360), "Sound Stage 9")
	_sound_stage(Vector3(60, 0, -560), "Sound Stage 12")
	_audience(Vector3(-80, 0, 560))
	_catering(Vector3(300, 0, 120))
	for spot: Array in [[Vector3(-112, 0, 92), 0.3, "quiet"], [Vector3(112, 0, 92), -0.3, "smile"], [Vector3(-220, 0, -130), 0.7, "take"], [Vector3(230, 0, 170), -0.7, "extras"]]:
		_tag_wall(spot[0], spot[1], spot[2])
		_claim(spot[0], 10.0, 6.0)
	var deep := _cave_from_rooms("cave_f4", Vector3(235, 0, -85), "Press E: go down the stage trap door", [[0, 0, 3, 5], [24, 10, 0, 6], [50, 2, -2, 6], [68, 26, -5, 8], [42, 44, -7, 6], [12, 40, -6, 9]], "#ffd88a", "#ff8a6a", 5, "boxes")
	kit.prop("manhole", Vector3(235, 0, -85), 0.5)
	_claim(Vector3(235, 0, -85), 14.0, 14.0)
	# under the stage: the props nobody returned, and a camera that is still recording
	kit.prop("camera_rig", deep + Vector3(-4, 0, 2), 0.6)
	kit.prop("folding_chair", deep + Vector3(2, 0, -1), 2.4)
	_light("#ff3a3a", 0.8, 8.0, deep + Vector3(-4, 2.2, 2), false)
	_view("understage", deep + Vector3(4, 0.2, 6), deep + Vector3(-4, 1.4, 2))
	var hatch := Vector3(-330, 0, 300)
	kit.prop("makeup_trailer", hatch + Vector3(0, 0, -4), 0.0, 1.0, Vector3(4.0, 1.6, 1.6))
	_claim(hatch, 8.0, 8.0)
	_build_loot_room(hatch, "Press E: step through the star's trailer into the back", "facade_b")
	_apply_claims()
	_fill_grid(60.0, 30.0, 40.0, _lot_block)
	_studio_tram()


## Warehouses and stage buildings in rows, with flats of scenery leaning on them.
func _lot_block(at: Vector3, yaw: float) -> void:
	_lots += 1
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	var side := Vector3(cos(yaw), 0, -sin(yaw))
	if _lots % 6 == 0:
		_ruin(at, yaw, ["Stage %d" % (_lots + 20), "Edit Suite", "Foley Room", "Wardrobe Annex", "Rushes"][(_lots / 6) % 5], 24.0, 18.0, 12.0, "facade_a", "#ffe0a0", 1.8)
	else:
		_solid_building(at, yaw, 24.0, 22.0, _rng.randf_range(10.0, 16.0), "facade_a" if _lots % 2 else "facade_b", "facade_b", Color("#2a2a30"), "", 8.0)
	var spot := at + forward * 18.0 + side * _rng.randf_range(-12, 12)
	var mess := _rng.randf()
	if mess < 0.2:
		_batched("spotlight", spot, _rng.randf_range(0, TAU), 1.0, Vector3(0.6, 1.0, 0.6))
	elif mess < 0.35:
		_batched("crates", spot, _rng.randf_range(0, TAU), 1.0, Vector3(0.9, 1.0, 0.7))
	elif mess < 0.45:
		kit.prop("set_front_western", spot, yaw + PI / 2.0, 0.6)
	elif mess < 0.55:
		_batched("folding_chair", spot, _rng.randf_range(0, TAU))
		kit.prop("remains", spot + side, yaw)
	if _lots % 9 == 0:
		_light("#fff0d8", 1.8, 22.0, at + forward * 16.0 + Vector3.UP * 7.0, false)


## A western street of fronts only. Behind them: scaffolding, braces, and a walkway the whole way along.
func _western_street(at: Vector3) -> void:
	_claim(at, 70.0, 30.0)
	_post_sign_text("The Western Set", at + Vector3(0, 0, 30))
	for i in 7:
		for s: float in [-1.0, 1.0]:
			var p := at + Vector3(-60.0 + i * 20.0, 0, s * 12.0)
			kit.prop("set_front_western", p, 0.0 if s < 0 else PI, 1.0, Vector3(9.0, 3.5, 0.4))
			kit.prop("lamp_post", p + Vector3(9.0, 0, -s * 3.0), 0.0)
	# the walkway behind the north fronts: you can get up and walk the whole street at roof height
	var walk_from := at + Vector3(-62, 6.5, -16)
	var walk_to := at + Vector3(62, 6.5, -16)
	_bridge(walk_from, walk_to, 3.0)
	for i in 7:
		var post := at + Vector3(-60.0 + i * 20.0, 0, -16)
		kit.block(Vector3(0.4, 6.5, 0.4), kit.flat(Color("#5a3a20")), post + Vector3.UP * 3.25)
		kit.box_collider(post + Vector3.UP * 3.25, Vector3(0.2, 3.25, 0.2))
	_ramp(at + Vector3(-62, 0, -33), at + Vector3(-62, 6.5, -17.5), 3.0, kit.surface("pave", Vector2(3, 18), 6.0, 0.4))
	for i in 10:
		_batched("dead_bush", at + Vector3(_rng.randf_range(-60, 60), 0, _rng.randf_range(-4, 4)), _rng.randf_range(0, TAU), _rng.randf_range(0.6, 1.2))
	_light("#ffd890", 1.4, 40.0, at + Vector3(0, 14, 0), true)
	_view("western", at + Vector3(-70, 1.0, 0), at + Vector3(0, 4.0, 0))


## The moon base: plywood, dryer ducting, a grey lumpy floor, and a moon on a stick.
func _moon_set(at: Vector3) -> void:
	_claim(at, 46.0, 46.0)
	_post_sign_text("Moon Base Alpha (Set B)", at + Vector3(0, 0, 40))
	kit.prop("set_front_moonbase", at + Vector3(0, 0, -20), 0.0, 1.2, Vector3(10.0, 3.5, 0.5))
	for i in 8:
		_floor_paint("stain_b", at + Vector3(_rng.randf_range(-30, 30), 0, _rng.randf_range(-30, 30)), Vector2(8, 8), _rng.randf_range(0, TAU), Color(0.75, 0.75, 0.8))
	var moon := MeshInstance3D.new()
	var ball := SphereMesh.new()
	ball.radius = 9.0
	ball.height = 18.0
	moon.mesh = ball
	moon.material_override = Models.toon(Color("#d8d8d0"))
	moon.position = at + Vector3(14, 22, -30)
	kit.root.add_child(moon)
	kit.block(Vector3(0.6, 14, 0.6), kit.flat(Color("#3a3a40")), at + Vector3(14, 7, -30))
	kit.prop("camera_crane", at + Vector3(-12, 0, 10), 0.7, 1.0, Vector3(1.5, 2.0, 3.0))
	for i in 3:
		_batched("spotlight", at + Vector3(-24.0 + i * 24.0, 0, 26), PI, 1.2, Vector3(0.6, 1.0, 0.6))
	_shaft_of_light(at + Vector3(0, 0, -6), "#e0e8ff", 5.0)
	_view("moon", at + Vector3(0, 1.0, 36), at + Vector3(4, 8.0, -20))


## A Victorian horror alley built for a season that never aired. The fog machine is still on. So is something else.
func _horror_alley(at: Vector3) -> void:
	_claim(at, 30.0, 70.0)
	_post_sign_text("Fog Lane (Horror Unit)", at + Vector3(0, 0, 68))
	for i in 6:
		for s: float in [-1.0, 1.0]:
			kit.prop("set_front_alley", at + Vector3(s * 11.0, 0, -55.0 + i * 22.0), PI / 2.0 if s < 0 else -PI / 2.0, 1.0, Vector3(9.0, 3.5, 0.4))
	for i in 5:
		_steam(at + Vector3(0, 0.3, -50.0 + i * 25.0), "#c8c8d0", 14)
		_flicker(_light("#ffd890", 0.9, 14.0, at + Vector3(_rng.randf_range(-6, 6), 4.0, -50.0 + i * 25.0), i == 2), "fault")
	kit.prop("hanged_figure", at + Vector3(0, 6.0, -10), 0.4)
	_stalker("far_figure", at + Vector3(0, 0, -60), true)
	_stains(at, 20.0, 6)
	_view("alley", at + Vector3(0, 0.2, 60), at + Vector3(0, 2.0, -20))


## A sound stage: a huge dark shed you can walk into, with catwalks up in the rafters.
func _sound_stage(at: Vector3, title: String) -> void:
	_claim(at, 36.0, 30.0)
	_ruin(at, 0.0, title, 40.0, 30.0, 16.0, "facade_b", "#fff0d8", 1.2)
	var top := _gantry(at + Vector3(-8, 0, -4), Vector2(20, 4), 9.0, PI / 2.0)
	_bridge(top + Vector3(10, 0, 0), top + Vector3(22, 0, 0), 2.0)
	kit.prop("spotlight_rig", at + Vector3(10, 0, 6), 0.0, 1.0, Vector3(1.0, 2.0, 1.0))
	kit.prop("camera_crane", at + Vector3(-12, 0, 8), 2.2, 1.0, Vector3(1.5, 2.0, 3.0))


## The bleachers: rows of the studio audience. Cardboard, mostly. Mostly.
func _audience(at: Vector3) -> void:
	_claim(at, 50.0, 30.0)
	_post_sign_text("Studio Audience", at + Vector3(0, 0, 26))
	for i in 5:
		kit.prop("bleachers", at + Vector3(-40.0 + i * 20.0, 0, -10), 0.0, 1.0, Vector3(9.5, 2.0, 4.0))
	for i in 30:
		var p := at + Vector3(_rng.randf_range(-45, 45), 0, _rng.randf_range(-16, -6))
		if i % 7 == 0:
			_stalker("photo_cutout", p, false, 0.9)
		else:
			_batched("photo_cutout", p, 0.0, _rng.randf_range(0.85, 1.0))
	kit.prop("applause_sign", at + Vector3(0, 9, -18), 0.0, 1.5)
	_light("#ff4a4a", 1.2, 30.0, at + Vector3(0, 10, -12), true)
	_view("audience", at + Vector3(0, 1.0, 22), at + Vector3(0, 3.0, -10))


func _catering(at: Vector3) -> void:
	_claim(at, 24.0, 20.0)
	kit.prop("catering_tent", at, 0.3, 1.0, Vector3(4.0, 2.0, 3.0))
	_dress(at, 20.0, 16.0, [["table_set", 1.0, 1.0, Vector3(0.65, 1.0, 0.65)], ["barrels", 1.0, 1.0, Vector3(0.8, 1.0, 0.8)], ["folding_chair", 1.0, 1.0, Vector3.ZERO]], 18, 6.0)
	_light("#ffe0a0", 1.6, 20.0, at + Vector3(0, 5, 0), false)


func _studio_tram() -> void:
	var start := Vector3(60, 0, 130)
	var end := Vector3(20, 0, 380)
	_vehicle_line(start, end, "rail_track", "golf_cart", "Press E: board the studio tour tram", "Press E: ride the tram back")
	_ride_line(Vector3(-150, 0, -100), Vector3(-150, 0, -330), "zip_rail", "Press E: ride the lighting rig cable", "Press E: ride the cable back")
	_view("tram", start + Vector3(-6, 0, -18), start + Vector3(0, 2, 10))
