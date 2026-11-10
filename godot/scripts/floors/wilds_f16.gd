class_name WildsF16
extends Wilds
## The Transmitter: a forest of broadcast masts and dishes, control desks the size of pitches, cables like rivers, and
## a signal you can see. The Mother of Static sings in the wires. Somewhere is the off switch.

var _sheds := 0


func _build_districts() -> void:
	_mast_forest(Vector3(-450, 0, -340))
	_dish_field(Vector3(460, 0, 420))
	_gallery(Vector3(450, 0, -380))
	_dead_air(Vector3(-460, 0, 420))
	_tower(Vector3(80, 0, -540), 0.2, 5, "Relay Tower 7")
	for spot: Array in [[Vector3(-112, 0, 92), 0.3, "onair"], [Vector3(112, 0, 92), -0.3, "static"], [Vector3(-220, 0, -130), 0.7, "signal"], [Vector3(230, 0, 170), -0.7, "off"]]:
		_tag_wall(spot[0], spot[1], spot[2])
		_claim(spot[0], 10.0, 6.0)
	var deep := _cave_from_rooms("cave_f4", Vector3(235, 0, -85), "Press E: go down the cable vault", [[0, 0, 3, 5], [24, 10, 0, 6], [50, 2, -2, 6], [68, 26, -5, 8], [42, 44, -7, 6], [12, 40, -6, 9]], "#c8c8ff", "#ff3a3a", 5, "cable_bundle")
	kit.prop("manhole", Vector3(235, 0, -85), 0.5)
	_claim(Vector3(235, 0, -85), 14.0, 14.0)
	kit.prop("mixing_desk", deep + Vector3(0, 0, -4), 0.0)
	kit.prop("on_air_light", deep + Vector3(0, 2.6, -5), 0.0)
	_view("vault", deep + Vector3(3, 0.2, 6), deep + Vector3(0, 1.6, -4))
	var hatch := Vector3(-330, 0, 300)
	kit.prop("satellite_dish", hatch + Vector3(0, 0, -4), 0.0, 0.6)
	_claim(hatch, 8.0, 8.0)
	_build_loot_room(hatch, "Press E: open the dish's service hatch", "facade_a")
	_apply_claims()
	_fill_grid(58.0, 28.0, 40.0, _equipment_shed)
	_vehicle_line(Vector3(60, 0, 130), Vector3(30, 0, 390), "rail_track", "golf_cart", "Press E: take the engineers' buggy", "Press E: drive it back")


func _equipment_shed(at: Vector3, yaw: float) -> void:
	_sheds += 1
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	var side := Vector3(cos(yaw), 0, -sin(yaw))
	if _sheds % 6 == 0:
		_ruin(at, yaw, ["Fuse Room %d" % _sheds, "Uplink Shack", "Switchboard", "Engineers' Mess"][(_sheds / 6) % 4], 20.0, 14.0, 7.0, "facade_a", "#c8c8ff", 1.4)
	else:
		_solid_building(at, yaw, 20.0, 18.0, _rng.randf_range(7.0, 11.0), "facade_a", "facade_b", Color("#2a2a3a"), "", 7.0)
	var spot := at + forward * 16.0 + side * _rng.randf_range(-10, 10)
	if _rng.randf() < 0.35:
		_batched("satellite_dish", spot, _rng.randf_range(0, TAU), 0.6, Vector3(1.2, 1.5, 1.2))
	elif _rng.randf() < 0.3:
		_batched("cable_bundle", spot, _rng.randf_range(0, TAU))
	if _sheds % 5 == 0:
		_flicker(_light("#ff3a3a", 0.9, 14.0, at + Vector3.UP * 9.0, false), "fault")


## Masts like a pine forest, red lights blinking at the top; zip lines run between the tallest.
func _mast_forest(at: Vector3) -> void:
	_claim(at, 60.0, 60.0)
	_post_sign_text("The Mast Forest", at + Vector3(0, 0, 56))
	for i in 16:
		var p := at + Vector3(-45.0 + (i % 4) * 30.0 + _rng.randf_range(-4, 4), 0, -45.0 + (i / 4) * 30.0 + _rng.randf_range(-4, 4))
		kit.prop("broadcast_mast", p, _rng.randf_range(0, TAU), 1.0, Vector3(1.2, 8.0, 1.2))
		_flicker(_light("#ff2a2a", 1.2, 14.0, p + Vector3.UP * 16.0, false), "fault")
	_ride_line(at + Vector3(-55, 0, -55), at + Vector3(55, 0, 55), "zip_rail", "Press E: ride the guy wire", "Press E: ride it back")
	_view("masts", at + Vector3(0, 1.0, 54), at + Vector3(0, 14.0, 0))


func _dish_field(at: Vector3) -> void:
	_claim(at, 50.0, 40.0)
	_post_sign_text("Dish Field", at + Vector3(0, 0, 38))
	for i in 20:
		_batched("satellite_dish", at + Vector3(-40.0 + (i % 5) * 20.0, 0, -30.0 + (i / 5) * 20.0), 0.6, 1.0, Vector3(2.0, 2.5, 2.0))
	_shaft_of_light(at, "#c8c8ff", 6.0)
	_view("dishes", at + Vector3(0, 1.0, 36), at + Vector3(0, 4.0, 0))


## The Gallery: the Director's floor, desks of faders under a wall of screens, and a mezzanine above.
func _gallery(at: Vector3) -> void:
	_claim(at, 40.0, 30.0)
	_ruin(at, PI, "The Gallery", 36.0, 24.0, 12.0, "facade_b", "#ff6a6a", 1.4)
	for i in 4:
		kit.prop("mixing_desk", at + Vector3(-12.0 + i * 8.0, 0, -2), PI)
	_gantry(at + Vector3(0, 0, 8), Vector2(26, 4), 5.0, PI / 2.0)
	kit.prop("on_air_light", at + Vector3(0, 8, -11), PI, 2.0)


## The Dead Air Zone: no light, no sound, no signal. The cameras can't see in here. The club knows.
func _dead_air(at: Vector3) -> void:
	_claim(at, 34.0, 34.0)
	_post_sign_text("Dead Air", at + Vector3(0, 0, 32))
	for i in 10:
		kit.prop("broadcast_mast", at + Vector3(cos(i * 0.63), 0, sin(i * 0.63)) * 26.0, i * 0.63, 0.5)
	for i in 6:
		_stalker("far_figure", at + Vector3(_rng.randf_range(-20, 20), 0, _rng.randf_range(-20, 20)), true)
	_stains(at, 14.0, 5)
	_view("deadair", at + Vector3(0, 1.0, 30), at + Vector3(0, 1.5, 0))
