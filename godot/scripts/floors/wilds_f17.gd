class_name WildsF17
extends Wilds
## The Host's House: a perfect sitcom suburb from fifty years ago, built out of one man's memories. His street, his
## school, his diner, the drive-in, a mirror maze, and the house. Everything smiles. Nothing blinks.

var _lots := 0


func _build_districts() -> void:
	_the_house(Vector3(0, 0, -520))
	_drive_in(Vector3(-460, 0, -340))
	_mirror_maze(Vector3(460, 0, -360))
	_school(Vector3(-470, 0, 400))
	_diner(Vector3(450, 0, 420))
	_main_streets()
	for spot: Array in [[Vector3(-112, 0, 92), 0.3, "welcome"], [Vector3(112, 0, 92), -0.3, "dinner"], [Vector3(-220, 0, -130), 0.7, "winner"], [Vector3(230, 0, 170), -0.7, "mum"]]:
		_tag_wall(spot[0], spot[1], spot[2])
		_claim(spot[0], 10.0, 6.0)
	var deep := _cave_from_rooms("cave_f5", Vector3(-170, 0, -130), "Press E: go down to the basement studio", [[0, 0, 3, 4.4], [-30, 0, 1, 5], [-60, 10, -1, 5], [-60, 44, -3, 5], [-28, 56, -4, 6], [6, 44, -5, 9]], "#fff0c0", "#ff6a6a", 5, "school_desk")
	kit.prop("manhole", Vector3(-170, 0, -130), 0.0)
	_claim(Vector3(-170, 0, -130), 14.0, 14.0)
	# the first studio: a desk, one camera, a boy's height chart on the wall
	kit.prop("camera_rig", deep + Vector3(-3, 0, 3), 0.6)
	kit.prop("school_desk", deep + Vector3(1, 0, -3), 0.0)
	_view("firststudio", deep + Vector3(3, 0.2, 6), deep + Vector3(0, 1.4, -3))
	var hatch := Vector3(-330, 0, 300)
	kit.prop("mirror_panel", hatch + Vector3(0, 0, -3), 0.0, 1.0, Vector3(1.2, 1.2, 0.2))
	_claim(hatch, 8.0, 8.0)
	_build_loot_room(hatch, "Press E: step through the mirror", "facade_b")
	_apply_claims()
	_fill_grid(48.0, 24.0, 40.0, _fifties_lot)
	_vehicle_line(Vector3(60, 0, 130), Vector3(30, 0, 390), "rail_track", "golf_cart", "Press E: ride the milk float", "Press E: ride it back")
	_ride_line(Vector3(-160, 0, -90), Vector3(-160, 0, -320), "zip_rail", "Press E: ride the washing line", "Press E: ride it back")


func _fifties_lot(at: Vector3, yaw: float) -> void:
	_lots += 1
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	var side := Vector3(cos(yaw), 0, -sin(yaw))
	if not kit.level_ground(at.x, at.z, 12.0):
		return
	if _prop_exists("fifties_house"):
		_batched("fifties_house", at, yaw, 1.0, Vector3(6.0, 4.0, 5.0))
		_note_solid(at, 8.0)
	else:
		_solid_building(at, yaw, 14.0, 12.0, 7.0, "facade_a", "facade_b", Color("#c84a3a"), "", 6.0)
	_batched("fence", at + forward * 9.0, yaw, 1.0, Vector3(1.0, 0.5, 0.1))
	_batched("mailbox", at + forward * 9.0 + side * 4.0, yaw, 1.0, Vector3(0.2, 1.0, 0.2))
	if _lots % 9 == 0:
		_stalker("lawn_family", at + forward * 6.0, false)
	if _lots % 7 == 0:
		_light("#fff0c0", 1.2, 14.0, at + forward * 6.0 + Vector3.UP * 3.0, false)


## The House: bigger than it should be, the porch light always on, a figure in the upstairs window.
func _the_house(at: Vector3) -> void:
	_claim(at, 40.0, 34.0)
	_post_sign_text("Home", at + Vector3(0, 0, 30))
	if _prop_exists("fifties_house"):
		kit.prop("fifties_house", at, 0.0, 2.2, Vector3(13.0, 8.0, 11.0))
	else:
		_solid_building(at, 0.0, 30.0, 24.0, 14.0, "facade_a", "facade_b", Color("#c84a3a"), "", 6.0)
	_stalker("far_figure", at + Vector3(4, 9.0, 12.5), false)
	_light("#fff0c0", 2.0, 16.0, at + Vector3(0, 3, 14), true)
	for i in 8:
		_batched("hedge", at + Vector3(-28.0 + i * 8.0, 0, 20), 0.0, 1.0, Vector3(1.0, 0.6, 0.6))
	_view("house", at + Vector3(0, 1.0, 34), at + Vector3(0, 6.0, 0))


func _drive_in(at: Vector3) -> void:
	_claim(at, 50.0, 40.0)
	kit.prop("drive_in_screen", at + Vector3(0, 0, -30), 0.0, 1.0, Vector3(10.0, 6.0, 0.6))
	for row in 3:
		for k in 6:
			_batched("car_parked", at + Vector3(-25.0 + k * 10.0, 0, -6.0 + row * 12.0), PI, 1.0, Vector3(1.0, 0.8, 2.2))
	_light("#c8e8ff", 2.2, 40.0, at + Vector3(0, 14, -24), true)
	_view("drivein", at + Vector3(0, 1.0, 34), at + Vector3(0, 8.0, -30))


## The mirror maze: panels on a grid with a path through. Your reflection is a step behind you.
func _mirror_maze(at: Vector3) -> void:
	_claim(at, 30.0, 30.0)
	_post_sign_text("Hall of Mirrors", at + Vector3(0, 0, 28))
	for gx in 10:
		for gz in 10:
			if (gx + gz * 3) % 4 == 0 or gx == 5:
				continue
			var p := at + Vector3(-22.5 + gx * 5.0, 0, -22.5 + gz * 5.0)
			var yaw := 0.0 if (gx + gz) % 2 == 0 else PI / 2.0
			if _prop_exists("mirror_panel"):
				kit.prop("mirror_panel", p, yaw, 1.0, Vector3(1.2, 1.2, 0.15))
			else:
				kit.block(Vector3(2.4, 2.6, 0.15), Models.toon(Color("#c8d8e8")), p + Vector3.UP * 1.3, yaw)
				kit.box_collider(p + Vector3.UP * 1.3, Vector3(1.2, 1.3, 0.08), yaw)
	_light("#e8f0ff", 1.4, 30.0, at + Vector3(0, 8, 0), true)
	_view("mirrors", at + Vector3(0, 1.0, 26), at + Vector3(0, 1.6, 0))


func _school(at: Vector3) -> void:
	_claim(at, 34.0, 26.0)
	_ruin(at, 0.0, "Elm Street Elementary", 30.0, 20.0, 8.0, "facade_a", "#fff0c0", 1.4)
	for i in 12:
		kit.prop("school_desk", at + Vector3(-8.0 + (i % 4) * 5.0, 0, -4.0 + (i / 4) * 4.0), PI)


func _diner(at: Vector3) -> void:
	_claim(at, 26.0, 22.0)
	if _prop_exists("fifties_diner"):
		kit.prop("fifties_diner", at, PI, 1.0, Vector3(8.0, 2.5, 4.0))
	else:
		_ruin(at, PI, "Dolores' Diner", 20.0, 12.0, 6.0, "facade_b", "#ff8aa8", 1.6)
	_light("#ff8aa8", 1.6, 20.0, at + Vector3(0, 5, -8), false)


func _main_streets() -> void:
	var ew := Vector2(kit.world_size, 14)
	kit.plane(ew, kit.surface("pave", ew, 12.0, 0.5), Vector3(0, 0.012, 96)).visibility_range_end = 0.0
	_claim(Vector3(0, 0, 96), kit.world_size / 2.0, 8.0)
