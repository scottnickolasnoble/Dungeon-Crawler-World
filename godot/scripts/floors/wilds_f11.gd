class_name WildsF11
extends Wilds
## The Arena: a stadium city. A colosseum the size of a district, concourses, fan zones, burger stands, locker rooms.
## Every fight is a fixture. Every crowd is a mob. Ratings Week here is an actual tournament.

var _stalls := 0


func _build_districts() -> void:
	_stadium(Vector3(-430, 0, -380), 70.0, "The Old Ground")
	_stadium(Vector3(470, 0, 420), 55.0, "The Training Pitch")
	_fan_zone(Vector3(420, 0, -330))
	_locker_rooms(Vector3(-480, 0, 300))
	_car_park(Vector3(60, 0, 520))
	_floodlights()
	for spot: Array in [[Vector3(-112, 0, 92), 0.3, "chant"], [Vector3(112, 0, 92), -0.3, "away"], [Vector3(-220, 0, -130), 0.7, "ref"], [Vector3(230, 0, 170), -0.7, "final"]]:
		_tag_wall(spot[0], spot[1], spot[2])
		_claim(spot[0], 10.0, 6.0)
	var deep := _cave_from_rooms("cave_f5", Vector3(-170, 0, -130), "Press E: go down the players' tunnel", [[0, 0, 3, 4.4], [-30, 0, 1, 5], [-60, 10, -1, 5], [-60, 44, -3, 5], [-28, 56, -4, 6], [6, 44, -5, 9]], "#e8f4ff", "#ff6a8a", 5, "tires")
	kit.prop("turnstile", Vector3(-170, 0, -130), 0.0)
	_claim(Vector3(-170, 0, -130), 14.0, 14.0)
	kit.prop("trophy_cabinet", deep + Vector3(0, 0, -4), 0.0, 1.0)
	_view("tunnel", deep + Vector3(3, 0.2, 6), deep + Vector3(0, 1.6, -4))
	var hatch := Vector3(-330, 0, 300)
	kit.prop("locker_bank", hatch + Vector3(0, 0, -3), 0.0, 1.0, Vector3(2.0, 1.0, 0.5))
	_claim(hatch, 8.0, 8.0)
	_build_loot_room(hatch, "Press E: squeeze through the back of locker 12", "facade_a")
	_apply_claims()
	_fill_grid(56.0, 28.0, 40.0, _concourse_block)
	var start := Vector3(60, 0, 130)
	var end := Vector3(30, 0, 400)
	_vehicle_line(start, end, "rail_track", "subway_car", "Press E: take the matchday shuttle", "Press E: shuttle back")
	_ride_line(Vector3(-160, 0, -90), Vector3(-160, 0, -320), "zip_rail", "Press E: ride the camera wire", "Press E: ride the wire back")


func _concourse_block(at: Vector3, yaw: float) -> void:
	_stalls += 1
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	var side := Vector3(cos(yaw), 0, -sin(yaw))
	if _stalls % 7 == 0:
		_ruin(at, yaw, ["Club Shop", "Hospitality Box %d" % _stalls, "Press Room", "First Aid"][(_stalls / 7) % 4], 22.0, 16.0, 9.0, "facade_a", "#e8f4ff", 1.8)
	else:
		_solid_building(at, yaw, 22.0, 20.0, _rng.randf_range(9.0, 14.0), "facade_a" if _stalls % 2 else "facade_b", "facade_b", Color("#2a3a48"), "", 8.0)
	var spot := at + forward * 17.0 + side * _rng.randf_range(-10, 10)
	var mess := _rng.randf()
	if mess < 0.25:
		kit.prop("burger_stand", spot, yaw)
	elif mess < 0.4:
		_batched("barrier", spot, yaw, 1.0, Vector3(1.2, 0.6, 0.2))
	elif mess < 0.5:
		_batched("trash_can", spot, 0.0, 1.0, Vector3(0.4, 0.6, 0.4))
		_floor_paint("stain_a", spot + side, Vector2(4, 4), _rng.randf_range(0, TAU))
	elif mess < 0.58:
		kit.prop("turnstile", spot, yaw)


## A stadium: stands all the way round a pitch, an upper concourse on stilts you can walk round, goals, a big screen.
func _stadium(at: Vector3, r: float, title: String) -> void:
	_claim(at, r + 22.0, r + 22.0)
	_post_sign_text(title, at + Vector3(0, 0, r + 18.0))
	var pitch := Vector2(r * 1.2, r * 0.8)
	kit.plane(pitch, Models.toon(Color("#3a8a3a")), at + Vector3.UP * 0.02)
	_floor_paint("stain_b", at, Vector2(10, 10), 0.0, Color(1, 1, 1, 0.8))
	for s: float in [-1.0, 1.0]:
		kit.prop("goalpost", at + Vector3(s * pitch.x / 2.0, 0, 0), PI / 2.0 if s > 0 else -PI / 2.0, 1.0, Vector3(0.2, 1.5, 3.6))
	var n := int(TAU * r / 16.0)
	for i in n:
		var a := i * TAU / n
		if absf(angle_difference(a, PI / 2.0)) < 0.2:
			continue  # the tunnel end, so you can walk on
		var p := at + Vector3(cos(a), 0, sin(a)) * r
		kit.prop("stadium_stand", p, -a - PI / 2.0, 1.0, Vector3(7.5, 4.0, 3.0))
	# the upper concourse: a ring of walkways up at the back of the stands, with a ramp up from outside
	var ring := r + 10.0
	var height := 8.0
	var last := Vector3.ZERO
	for i in 13:
		var a := i * TAU / 12.0
		var p := at + Vector3(cos(a), 0, sin(a)) * ring + Vector3.UP * height
		if i > 0:
			_bridge(last, p, 3.6)
		last = p
	for i in 6:
		var a := i * TAU / 6.0
		var leg := at + Vector3(cos(a), 0, sin(a)) * ring
		kit.block(Vector3(0.6, height, 0.6), kit.flat(Color("#3a3a44")), leg + Vector3.UP * height / 2.0)
		kit.box_collider(leg + Vector3.UP * height / 2.0, Vector3(0.3, height / 2.0, 0.3))
	var foot := at + Vector3(0, 0, ring + height * 2.6)
	_ramp(foot, at + Vector3(0, height, ring), 3.0, kit.surface("pave", Vector2(3, 24), 6.0, 0.4))
	kit.prop("jumbotron", at + Vector3(0, 0, -r - 6.0), 0.0, 1.0, Vector3(6.0, 6.0, 1.0))
	_light("#ffffff", 2.4, r * 1.6, at + Vector3(0, 24, 0), true)
	_view("stadium_" + title.to_snake_case().left(8), at + Vector3(0, height + 1.7, ring), at + Vector3(0, 0, 0))


func _fan_zone(at: Vector3) -> void:
	_claim(at, 40.0, 30.0)
	_post_sign_text("Fan Zone", at + Vector3(0, 0, 28))
	for i in 5:
		kit.prop("burger_stand", at + Vector3(-32.0 + i * 16.0, 0, -18), 0.0)
	kit.prop("halftime_stage", at + Vector3(0, 0, 6), PI, 1.0, Vector3(6.0, 1.0, 4.0))
	_dress(at, 36.0, 26.0, [["barrier", 1.0, 1.0, Vector3(1.2, 0.6, 0.2)], ["trash_can", 1.0, 1.0, Vector3(0.4, 0.6, 0.4)], ["remains", 1.0, 1.0, Vector3.ZERO]], 26, 8.0)
	for i in 4:
		_flicker(_light(["#e8398c", "#34b8c4", "#f5c518", "#ffffff"][i], 1.4, 18.0, at + Vector3(-24.0 + i * 16.0, 6, 0), false), "fault")
	_view("fanzone", at + Vector3(0, 1.0, 26), at + Vector3(0, 3.0, 0))


func _locker_rooms(at: Vector3) -> void:
	_claim(at, 30.0, 24.0)
	_ruin(at, 0.4, "Home Dressing Room", 28.0, 20.0, 6.0, "facade_b", "#e8f4ff", 1.4)
	for i in 5:
		kit.prop("locker_bank", at + Vector3(-10.0 + i * 5.0, 0, -7.5), 0.4)
	_stains(at, 8.0, 4)


func _car_park(at: Vector3) -> void:
	_claim(at, 50.0, 30.0)
	for i in 18:
		var p := at + Vector3(-44.0 + (i % 9) * 11.0, 0, -12.0 + (i / 9) * 24.0)
		_batched("car_parked" if i % 4 else "car_wreck", p, PI / 2.0 if i < 9 else -PI / 2.0, 1.0, Vector3(1.0, 0.8, 2.2))


## Floodlight towers across the whole floor, so you can always see the next fixture.
func _floodlights() -> void:
	var half: float = kit.world_size / 2.0 - 100.0
	for i in 8:
		var a := i * TAU / 8.0 + 0.3
		var p := Vector3(cos(a), 0, sin(a)) * half * 0.8
		if not kit.is_free(p.x, p.z, 4.0):
			continue
		kit.block(Vector3(1.0, 30.0, 1.0), kit.flat(Color("#3a3a44")), p + Vector3.UP * 15.0)
		kit.box_collider(p + Vector3.UP * 15.0, Vector3(0.5, 15.0, 0.5))
		kit.prop("spotlight_rig", p + Vector3.UP * 30.0, -a, 1.6)
		_light("#ffffff", 3.0, 70.0, p + Vector3.UP * 28.0, false)
		_claim(p, 4.0, 4.0)
