class_name WildsF12
extends Wilds
## The Green Room: backstage forever. Corridors of dressing rooms with stars on the doors, stacked three galleries high
## around an atrium; a talk-show set; the factory where the laughter is made. Everyone is waiting to go on.

var _rooms := 0


func _build_districts() -> void:
	_atrium(Vector3(-440, 0, -360))
	_atrium(Vector3(460, 0, 400))
	_talk_show(Vector3(440, 0, -380))
	_laugh_factory(Vector3(-460, 0, 380))
	_writers_room(Vector3(80, 0, -520))
	for spot: Array in [[Vector3(-112, 0, 92), 0.3, "laugh"], [Vector3(112, 0, 92), -0.3, "places"], [Vector3(-220, 0, -130), 0.7, "smile"], [Vector3(230, 0, 170), -0.7, "contract"]]:
		_tag_wall(spot[0], spot[1], spot[2])
		_claim(spot[0], 10.0, 6.0)
	var deep := _cave_from_rooms("cave_f6", Vector3(240, 0, 120), "Press E: go down the stage-door stairs", [[0, 0, 3, 5], [-20, -18, 0, 6], [-46, -20, -3, 7], [-60, -46, -6, 6], [-32, -62, -8, 10], [-6, -44, -5, 5]], "#ffd0e0", "#f5c518", 4, "costume_rail", 1.0)
	kit.prop("star_dressing_door", Vector3(240, 0, 120), 0.6)
	_claim(Vector3(240, 0, 120), 14.0, 14.0)
	kit.prop("makeup_mirror_desk", deep + Vector3(0, 0, -4), 0.0)
	_view("understudy", deep + Vector3(3, 0.2, 6), deep + Vector3(0, 1.6, -4))
	var hatch := Vector3(-330, 0, 300)
	kit.prop("costume_rail", hatch + Vector3(0, 0, -3), 0.0, 1.0, Vector3(1.5, 1.0, 0.5))
	_claim(hatch, 8.0, 8.0)
	_build_loot_room(hatch, "Press E: push through the costume rail", "facade_b")
	_apply_claims()
	_fill_grid(48.0, 24.0, 40.0, _dressing_block)
	_vehicle_line(Vector3(60, 0, 130), Vector3(30, 0, 380), "rail_track", "mall_train", "Press E: ride the props trolley", "Press E: ride the trolley back")
	_ride_line(Vector3(-160, 0, -90), Vector3(-160, 0, -320), "zip_rail", "Press E: ride the fly system", "Press E: ride it back")


## A block of dressing rooms: a star on every door, a name card on every star. Some of the names are yours.
func _dressing_block(at: Vector3, yaw: float) -> void:
	_rooms += 1
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	var side := Vector3(cos(yaw), 0, -sin(yaw))
	if _rooms % 6 == 0:
		_ruin(at, yaw, ["Dressing Room %d" % _rooms, "Wig Store", "Quick-Change", "Hair & Makeup"][(_rooms / 6) % 4], 20.0, 14.0, 7.0, "facade_b", "#ffd0e0", 1.6)
	else:
		_solid_building(at, yaw, 20.0, 18.0, _rng.randf_range(8.0, 12.0), "facade_b", "facade_a", Color("#3a2030"), "", 7.0)
		kit.prop("star_dressing_door", at + forward * 9.2, yaw)
	var spot := at + forward * 14.0 + side * _rng.randf_range(-8, 8)
	var mess := _rng.randf()
	if mess < 0.2:
		_batched("costume_rail", spot, yaw, 1.0, Vector3(1.5, 1.0, 0.5))
	elif mess < 0.32:
		_batched("folding_chair", spot, _rng.randf_range(0, TAU))
	elif mess < 0.4:
		kit.prop("remains", spot, yaw)
		_floor_paint("drag", spot + side, Vector2(4, 8), _rng.randf_range(0, TAU))


## An atrium three galleries high, ringed with dressing rooms, bridges across the middle. Look down: there's always someone.
func _atrium(at: Vector3) -> void:
	_claim(at, 44.0, 44.0)
	_post_sign_text("The Atrium", at + Vector3(0, 0, 40))
	var levels := [5.0, 10.0, 15.0]
	for h: float in levels:
		var corners: Array[Vector3] = []
		for i in 4:
			var a := i * TAU / 4.0 + PI / 4.0
			corners.append(at + Vector3(cos(a), 0, sin(a)) * 30.0 + Vector3.UP * h)
		for i in 4:
			_bridge(corners[i], corners[(i + 1) % 4], 4.0)
		_bridge(corners[0], corners[2], 3.0)
		for i in 4:
			var leg := Vector3(corners[i].x, 0, corners[i].z)
			kit.block(Vector3(0.8, h, 0.8), kit.flat(Color("#3a2030")), leg + Vector3.UP * h / 2.0)
			kit.box_collider(leg + Vector3.UP * h / 2.0, Vector3(0.4, h / 2.0, 0.4))
			kit.prop("star_dressing_door", Vector3(corners[i].x, h, corners[i].z) + Vector3(0, 0, 0), i * PI / 2.0, 0.9)
	# ramps zig-zag up one side, gallery to gallery
	var mat: Material = kit.surface("pave", Vector2(3, 14), 6.0, 0.4)
	var c0 := at + Vector3(cos(PI / 4.0), 0, sin(PI / 4.0)) * 30.0
	_ramp(c0 + Vector3(0, 0, 14), c0 + Vector3(0, 5, 1.5), 3.0, mat)
	_ramp(c0 + Vector3(-4, 5, 1.5), c0 + Vector3(-4, 10, 14), 3.0, mat)
	_ramp(c0 + Vector3(-8, 10, 14), c0 + Vector3(-8, 15, 1.5), 3.0, mat)
	kit.prop("applause_sign", at + Vector3(0, 18, 0), 0.0, 1.6)
	_light("#ffd0e0", 1.6, 40.0, at + Vector3(0, 20, 0), true)
	for i in 6:
		_stalker("far_figure", at + Vector3(_rng.randf_range(-20, 20), levels[i % 3], _rng.randf_range(-20, 20)), false)
	_view("atrium", at + Vector3(0, 1.0, 36), at + Vector3(0, 12.0, 0))


func _talk_show(at: Vector3) -> void:
	_claim(at, 36.0, 30.0)
	_post_sign_text("Tonight with Jolly Jack", at + Vector3(0, 0, 26))
	kit.prop("talk_show_couch", at, PI, 1.0, Vector3(4.0, 1.0, 1.5))
	for i in 4:
		kit.prop("bleachers", at + Vector3(-24.0 + i * 16.0, 0, 18), PI, 1.0, Vector3(7.5, 2.0, 3.0))
	kit.prop("applause_sign", at + Vector3(0, 7, -4), PI, 1.2)
	_light("#ffe0f0", 2.0, 28.0, at + Vector3(0, 9, 4), true)
	_dress(at, 30.0, 24.0, [["spotlight", 1.0, 1.0, Vector3(0.6, 1.0, 0.6)], ["camera_rig", 1.0, 1.0, Vector3(0.6, 1.0, 0.6)]], 10, 10.0)
	_view("talkshow", at + Vector3(0, 1.0, 24), at + Vector3(0, 2.0, 0))


func _laugh_factory(at: Vector3) -> void:
	_claim(at, 34.0, 28.0)
	_ruin(at, 0.2, "The Laugh Track Factory", 30.0, 22.0, 10.0, "facade_a", "#ffd0e0", 1.2)
	for i in 4:
		kit.prop("laugh_machine", at + Vector3(-9.0 + i * 6.0, 0, -4), 0.2)
	_steam(at, "#ffe0f0", 12)


func _writers_room(at: Vector3) -> void:
	_claim(at, 26.0, 22.0)
	_ruin(at, -0.3, "The Writers' Room", 22.0, 16.0, 7.0, "facade_b", "#fff0c0", 1.6)
	kit.prop("writers_table", at, -0.3, 1.0)
	for i in 8:
		kit.prop("folding_chair", at + Vector3(cos(i * 0.8), 0, sin(i * 0.8)) * 4.0, i * 0.8 + PI)
