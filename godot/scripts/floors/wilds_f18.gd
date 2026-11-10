class_name WildsF18
extends Wilds
## The floor that doesn't exist: the Builders' control room. Bare concrete going on forever, stairs that go nowhere,
## silent machines, a white sky that is a ceiling, and every god's empty plinth in a ring. Quieter than anything.

const GODS := ["Saint Tally", "Old Damp", "The Hollow Chef", "Mother Mould", "The Rustwright", "The Good Neighbour", "Lady Lumen", "The Antlered Viewer", "Encore", "The Index", "The Mother of Static", ""]

var _blocks := 0


func _build_districts() -> void:
	_plinth_ring(Vector3(0, 0, -520))
	_impossible_stairs(Vector3(-460, 0, -340))
	_machines(Vector3(460, 0, -380))
	_control_room(Vector3(-470, 0, 420))
	_echo_hall(Vector3(460, 0, 420))
	for spot: Array in [[Vector3(-112, 0, 92), 0.3, "choose"], [Vector3(112, 0, 92), -0.3, "builders"], [Vector3(-220, 0, -130), 0.7, "door"], [Vector3(230, 0, 170), -0.7, "first"]]:
		_tag_wall(spot[0], spot[1], spot[2])
		_claim(spot[0], 10.0, 6.0)
	var deep := _cave_from_rooms("cave_f6", Vector3(240, 0, 120), "Press E: go down. There is a down.", [[0, 0, 3, 5], [-20, -18, 0, 6], [-46, -20, -3, 7], [-60, -46, -6, 6], [-32, -62, -8, 10], [-6, -44, -5, 5]], "#ffffff", "#c8c8c4", 4, "empty_plinth", 1.0)
	kit.prop("empty_plinth", Vector3(240, 0, 120), 0.6)
	_claim(Vector3(240, 0, 120), 14.0, 14.0)
	_view("below", deep + Vector3(3, 0.2, 6), deep + Vector3(0, 1.4, -3))
	var hatch := Vector3(-330, 0, 300)
	kit.prop("builder_machine", hatch + Vector3(0, 0, -6), 0.0, 0.5)
	_claim(hatch, 8.0, 8.0)
	_build_loot_room(hatch, "Press E: press the only button", "facade_a")
	_apply_claims()
	_fill_grid(70.0, 30.0, 40.0, _concrete)
	_ride_line(Vector3(-160, 0, -90), Vector3(-160, 0, -320), "zip_rail", "Press E: hold on to the line", "Press E: hold on again")
	_vehicle_line(Vector3(60, 0, 130), Vector3(30, 0, 390), "rail_track", "mine_cart", "Press E: ride the Builders' cart", "Press E: ride it back")


## Concrete. Pillars in a grid, slabs, a doorway in a wall with nothing behind it.
func _concrete(at: Vector3, yaw: float) -> void:
	_blocks += 1
	var stone := Models.toon(Color("#c8c8c4"))
	if _blocks % 4 == 0:
		kit.block(Vector3(20, 9, 2), stone, at + Vector3.UP * 4.5, yaw)
		kit.box_collider(at + Vector3.UP * 4.5, Vector3(10, 4.5, 1), yaw)
		kit.prop("stair_door", at + Vector3(sin(yaw), 0, cos(yaw)) * 1.1, yaw)
	else:
		for i in 4:
			var p := at + Vector3(-12.0 + (i % 2) * 24.0, 0, -12.0 + (i / 2) * 24.0)
			kit.block(Vector3(2, 14, 2), stone, p + Vector3.UP * 7.0)
			kit.box_collider(p + Vector3.UP * 7.0, Vector3(1, 7, 1))


## Every god's plinth, in a ring, empty. One has no name at all.
func _plinth_ring(at: Vector3) -> void:
	_claim(at, 44.0, 44.0)
	for i in GODS.size():
		var a := i * TAU / GODS.size()
		var p := at + Vector3(cos(a), 0, sin(a)) * 34.0
		if _prop_exists("empty_plinth"):
			kit.prop("empty_plinth", p, -a, 1.4, Vector3(1.0, 1.2, 1.0))
		else:
			kit.block(Vector3(2.4, 2.4, 2.4), Models.toon(Color("#b8b8b4")), p + Vector3.UP * 1.2)
			kit.box_collider(p + Vector3.UP * 1.2, Vector3(1.2, 1.2, 1.2))
		_post_sign_text(GODS[i] if GODS[i] != "" else "...", p + Vector3(0, -3.0, 0))
	kit.prop("stair_door", at, 0.0, 2.0, Vector3(4.0, 4.0, 1.0))
	_post_sign_text("The Door", at + Vector3(0, 2, 6))
	_shaft_of_light(at, "#ffffff", 8.0)
	_view("plinths", at + Vector3(0, 1.0, 40), at + Vector3(0, 3.0, 0))


## Stairs that climb, turn, climb, and arrive back where they started. Walk them anyway.
func _impossible_stairs(at: Vector3) -> void:
	_claim(at, 40.0, 40.0)
	var mat: Material = Models.toon(Color("#d0d0cc"))
	var corners := [Vector3(-20, 0, -20), Vector3(20, 0, -20), Vector3(20, 0, 20), Vector3(-20, 0, 20)]
	for i in 4:
		var h := 4.0 + i * 4.0
		var a: Vector3 = at + corners[i] + Vector3.UP * (h - 4.0)
		var b: Vector3 = at + corners[(i + 1) % 4] + Vector3.UP * h
		_ramp(a, b, 4.0, mat)
		kit.block(Vector3(4, h, 4), mat, at + corners[(i + 1) % 4] + Vector3.UP * h / 2.0)
		kit.box_collider(at + corners[(i + 1) % 4] + Vector3.UP * (h / 2.0 - 0.2), Vector3(2, h / 2.0 - 0.2, 2))
	kit.prop("impossible_stair", at, 0.0, 2.0)
	_view("stairs", at + Vector3(0, 1.0, 40), at + Vector3(0, 8.0, 0))


func _machines(at: Vector3) -> void:
	_claim(at, 44.0, 44.0)
	for i in 5:
		kit.prop("builder_machine", at + Vector3(-30.0 + i * 15.0, 0, 0), 0.0, 1.0, Vector3(4.0, 4.0, 4.0))
	_light("#ffffff", 0.6, 40.0, at + Vector3(0, 16, 0), true)
	_view("machines", at + Vector3(0, 1.0, 40), at + Vector3(0, 6.0, 0))


## The Control Room: a long console on a high gallery, looking out over all of it.
func _control_room(at: Vector3) -> void:
	_claim(at, 30.0, 30.0)
	var top := _gantry(at, Vector2(24, 8), 12.0, 0.0)
	kit.prop("control_console", top + Vector3(0, 0, -2), 0.0, 1.0, Vector3(6.0, 0.8, 0.8))
	kit.prop("folding_chair", top + Vector3(0, 0, 0.5), PI)
	_post_sign_text("The Control Room", at + Vector3(0, 0, 26))
	_view("control", top + Vector3(0, 1.7, 3), top + Vector3(0, 1.0, -30))


func _echo_hall(at: Vector3) -> void:
	_claim(at, 34.0, 34.0)
	_post_sign_text("The Echo Hall", at + Vector3(0, 0, 32))
	for i in 24:
		_stalker("far_figure", at + Vector3(_rng.randf_range(-26, 26), 0, _rng.randf_range(-26, 26)), i % 3 == 0)
	_view("echoes", at + Vector3(0, 1.0, 30), at + Vector3(0, 1.6, 0))
