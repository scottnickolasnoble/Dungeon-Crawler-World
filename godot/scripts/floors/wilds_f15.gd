class_name WildsF15
extends Wilds
## The Cold Store: the Builders' machine memory. Server rows like cornfields, cooling towers breathing frost, cable
## jungles, blue light. The Recorder is down here, and it has kept everything. Including you.

var _halls := 0


func _build_districts() -> void:
	_server_field(Vector3(-460, 0, -330))
	_server_field(Vector3(460, 0, 400))
	_cooling_towers(Vector3(450, 0, -380))
	_cable_jungle(Vector3(-470, 0, 400))
	_tape_library(Vector3(60, 0, -540))
	for spot: Array in [[Vector3(-112, 0, 92), 0.3, "backup"], [Vector3(112, 0, 92), -0.3, "cold"], [Vector3(-220, 0, -130), 0.7, "recorded"], [Vector3(230, 0, 170), -0.7, "deleted"]]:
		_tag_wall(spot[0], spot[1], spot[2])
		_claim(spot[0], 10.0, 6.0)
	var deep := _cave_from_rooms("cave_f9", Vector3(-200, 0, 130), "Press E: go down the cable duct", [[0, 0, 3, 5], [36, 0, 0, 5], [72, 0, -2, 5], [72, 36, -4, 5], [40, 50, -5, 11], [6, 32, -4, 5]], "#8ad8ff", "#c8f0ff", 4, "cable_bundle")
	kit.prop("manhole", Vector3(-200, 0, 130), 0.3)
	_claim(Vector3(-200, 0, 130), 14.0, 14.0)
	kit.prop("big_red_switch", deep + Vector3(0, 0, -4), 0.0)
	_light("#ff3a3a", 0.8, 8.0, deep + Vector3(0, 2.0, -3), false)
	_view("duct", deep + Vector3(3, 0.2, 6), deep + Vector3(0, 1.6, -4))
	var hatch := Vector3(-330, 0, 300)
	kit.prop("server_rack", hatch + Vector3(0, 0, -3), 0.0, 1.0, Vector3(0.6, 1.1, 0.6))
	_claim(hatch, 8.0, 8.0)
	_build_loot_room(hatch, "Press E: slide out the dead rack and crawl in", "facade_b")
	_apply_claims()
	_fill_grid(52.0, 26.0, 40.0, _server_hall)
	_vehicle_line(Vector3(60, 0, 130), Vector3(30, 0, 390), "rail_track", "subway_car", "Press E: ride the maintenance shuttle", "Press E: ride it back")
	_ride_line(Vector3(-160, 0, -90), Vector3(-160, 0, -320), "zip_rail", "Press E: ride the fibre trunk line", "Press E: ride it back")


func _server_hall(at: Vector3, yaw: float) -> void:
	_halls += 1
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	var side := Vector3(cos(yaw), 0, -sin(yaw))
	if _halls % 6 == 0:
		_ruin(at, yaw, ["Rack Hall %d" % _halls, "The Warm Aisle", "Power Room", "Backup Office"][(_halls / 6) % 4], 22.0, 16.0, 8.0, "facade_b", "#8ad8ff", 1.6)
	else:
		_solid_building(at, yaw, 22.0, 20.0, _rng.randf_range(8.0, 12.0), "facade_b", "facade_a", Color("#2a3a4a"), "", 8.0)
	for k in 4:
		_batched("server_rack", at + forward * 15.0 + side * (-9.0 + k * 6.0), yaw, 1.0, Vector3(0.6, 1.1, 0.6))
	# the rack row is solid now, so towers and the like keep off it
	_note_solid(at + forward * 15.0, 11.0)
	if _rng.randf() < 0.3:
		_batched("cable_bundle", at + forward * 19.0 + side * _rng.randf_range(-8, 8), _rng.randf_range(0, TAU))
	if _halls % 7 == 0:
		_steam(at + forward * 15.0, "#e0f4ff", 8)


## Server rows like a cornfield, with frost on the vents and a gantry over the middle you can watch them from.
func _server_field(at: Vector3) -> void:
	_claim(at, 50.0, 40.0)
	_post_sign_text("Rack Field", at + Vector3(0, 0, 38))
	for row in 8:
		for k in 14:
			_batched("server_rack", at + Vector3(-45.0 + k * 7.0, 0, -32.0 + row * 9.0), 0.0, 1.0, Vector3(0.6, 1.1, 0.6))
	var top := _gantry(at + Vector3(0, 0, 0), Vector2(60, 4), 6.0, PI / 2.0)
	for i in 4:
		_light("#8ad8ff", 0.8, 24.0, at + Vector3(-36.0 + i * 24.0, 8, 0), false)
	_steam(at, "#e0f4ff", 20)
	_view("rackfield", top + Vector3(-28, 1.7, 0), at + Vector3(20, 1.0, 0))


## Cooling towers breathing frost; one has a walkway spiralling up the outside to its lip.
func _cooling_towers(at: Vector3) -> void:
	_claim(at, 44.0, 44.0)
	_post_sign_text("The Cooling Towers", at + Vector3(0, 0, 42))
	for i in 4:
		var p := at + Vector3(-22.0 + (i % 2) * 44.0, 0, -22.0 + (i / 2) * 44.0)
		kit.prop("cooling_tower", p, 0.0, 1.0, Vector3(6.0, 5.0, 6.0))
		_steam(p + Vector3(0, 10, 0), "#ffffff", 16)
	var centre := at + Vector3(-22, 0, -22)
	var last := centre + Vector3(9, 0, 0)
	for i in range(1, 15):
		var a := i * 0.5
		var p := centre + Vector3(cos(a) * 9.0, i * 0.75, sin(a) * 9.0)
		_bridge(last, p, 2.2)
		last = p
	_view("towers", at + Vector3(0, 1.0, 40), at + Vector3(0, 8.0, 0))


func _cable_jungle(at: Vector3) -> void:
	_claim(at, 34.0, 34.0)
	_post_sign_text("The Cable Jungle", at + Vector3(0, 0, 32))
	for i in 40:
		_batched("cable_bundle", at + Vector3(_rng.randf_range(-30, 30), 0, _rng.randf_range(-30, 30)), _rng.randf_range(0, TAU), _rng.randf_range(0.8, 1.6))
	for i in 12:
		_batched("pipes", at + Vector3(_rng.randf_range(-30, 30), 0, _rng.randf_range(-30, 30)), _rng.randf_range(0, TAU))
	for i in 5:
		_flicker(_light("#8affc8", 0.7, 14.0, at + Vector3(_rng.randf_range(-24, 24), 3, _rng.randf_range(-24, 24)), false), "fault")
	_view("cables", at + Vector3(0, 1.0, 30), at + Vector3(0, 1.0, 0))


func _tape_library(at: Vector3) -> void:
	_claim(at, 30.0, 24.0)
	_ruin(at, 0.0, "The Tape Library", 28.0, 20.0, 9.0, "facade_b", "#c8f0ff", 1.4)
	for i in 6:
		kit.prop("tape_reel_stack", at + Vector3(-10.0 + i * 4.0, 0, -7), 0.0)
	kit.prop("big_red_switch", at + Vector3(10, 0, 6), PI)
