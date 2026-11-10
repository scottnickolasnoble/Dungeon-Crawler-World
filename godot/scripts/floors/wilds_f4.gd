class_name WildsF4
extends Wilds
## The Endless Mall's outdoors: floor after floor of bright, cheerful, spotless concourse, 1100 m across, with the music on.
## It's the brightest floor yet and the worst so far. The dummies move when you aren't looking, and everything drains towards the heart.

const BRANDS := ["pretz", "tan", "smile", "body", "wrap", "deal", "kids", "meat"]

var _blocks := 0
var _brand_mats := {}


func _build_districts() -> void:
	kit._ceiling_fixtures()
	_the_heart(Vector3(0, 0, -440))
	_mannequin_hall(Vector3(-430, 0, 40))
	_santas_grotto(Vector3(-400, 0, -340))
	_kiddie_rides(Vector3(420, 0, -70))
	_food_depths(Vector3(430, 0, 170))
	_wishing_well(Vector3(150, 0, -140))
	_photo_row(Vector3(-130, 0, -190))
	_escalator_canyon(Vector3(330, 0, -420))
	_clearance_pit(Vector3(-100, 0, 430))
	_mall_train()
	for spot: Array in [[Vector3(-110, 0, 95), 0.3, "sale"], [Vector3(110, 0, 95), -0.3, "returns"], [Vector3(-40, 0, -120), 0.0, "mother"], [Vector3(250, 0, -40), -1.2, "lost"], [Vector3(-300, 0, 130), 1.0, "clerk"], [Vector3(60, 0, 260), 2.8, "hands"]]:
		_tag_wall(spot[0], spot[1], spot[2], 6.0 if spot[2] == "hands" else 3.2)
		_claim(spot[0], 10.0, 6.0)
	for at: Vector3 in [Vector3(-200, 0, -110), Vector3(40, 0, -210), Vector3(210, 0, 150), Vector3(-180, 0, 300), Vector3(330, 0, -210), Vector3(-330, 0, -130), Vector3(180, 0, 350), Vector3(-30, 0, 170)]:
		_camera_post(at)
	var deep := _cave_from_rooms("cave_f4", Vector3(235, 0, -85), "Press E: go through the STAFF ONLY door", [[0, 0, 3, 5], [24, 10, 0, 6], [50, 2, -2, 6], [68, 26, -5, 8], [42, 44, -7, 6], [12, 40, -6, 9]], "#ff8a9a", "#ffd0a8", 5, "vein_patch")
	kit.prop("manhole", Vector3(235, 0, -85), 0.5)
	_post_sign("duct", Vector3(240, 0, -78), -0.4)
	_claim(Vector3(235, 0, -85), 12.0, 12.0)
	kit.prop("mannequin_skin", deep + Vector3(-5, 0, 2), 0.8)
	kit.prop("remains", deep + Vector3(-1, 0, -5), 2.0)
	_view("cave", deep + Vector3(0, 0.2, 6), deep + Vector3(3, 1, -3))
	# the hidden room: behind a booth's curtain, in the row nobody stops at
	_build_loot_room(Vector3(-174, 0, -196), "Press E: pull the curtain and step through", "facade_b")
	_apply_claims()
	_fill_grid(46.0, 25.0, 34.0, _mall_block)


func _mall_block(at: Vector3, yaw: float) -> void:
	_blocks += 1
	if _rng.randf() < 0.06:
		_loose_stalls(at, yaw)
		return
	if _blocks % 9 == 0:
		_ruin(at, yaw, ["Closing Down", "Everything Must Go", "Under New Management", "Back in 5 Minutes"][(_blocks / 9) % 4], 20.0, 13.0, 8.0, "facade_a" if _blocks % 18 == 0 else "facade_b", "#fff0d8", 1.6)
	else:
		_solid_building(at, yaw, 34.0, 15.0, 13.8, "facade_b", "facade_a", Color("#a8a8b0"), "")
		var forward := Vector3(sin(yaw), 0, cos(yaw))
		var side := Vector3(cos(yaw), 0, -sin(yaw))
		for face: float in [1.0, -1.0]:
			var f_yaw := yaw if face > 0.0 else yaw + PI
			for s: float in [-8.5, 8.5]:
				var front := at + forward * face * 7.6 + side * s
				_batched("storefront", front, f_yaw)
				var brand: String = BRANDS[_rng.randi() % BRANDS.size()]
				if not _brand_mats.has(brand):
					_brand_mats[brand] = kit.unshaded(Color.WHITE, _tex("brand_" + brand))
				kit.quad(Vector2(10.5, 0.8), _brand_mats[brand], front + forward * face * 0.27 + Vector3.UP * 5.3, Vector3(0, f_yaw, 0))
	# columns along the aisle, and now and then a sale banner hung right across it
	var along := Vector3(cos(yaw), 0, -sin(yaw))
	var ahead := Vector3(sin(yaw), 0, cos(yaw))
	for s: float in [-16.0, 16.0]:
		_batched("column", at + along * s + ahead * 9.5, yaw, 1.0, Vector3(0.6, 3.0, 0.6))
	if _rng.randf() < 0.4:
		var brand: String = BRANDS[_rng.randi() % BRANDS.size()]
		if not _brand_mats.has(brand):
			_brand_mats[brand] = kit.unshaded(Color.WHITE, _tex("brand_" + brand))
		kit.quad(Vector2(12, 2.1), _brand_mats[brand], at + ahead * 15.0 + Vector3.UP * 9.0, Vector3(0, yaw, 0))
		kit.quad(Vector2(12, 2.1), _brand_mats[brand], at + ahead * 15.05 + Vector3.UP * 9.0, Vector3(0, yaw + PI, 0))
	var street := at + Basis(Vector3.UP, yaw) * Vector3(_rng.randf_range(-14, 14), 0, 12.5)
	var mess := _rng.randf()
	if mess < 0.22:
		_batched("shop_dummy", street, _rng.randf_range(0, TAU), 1.0, Vector3(0.3, 1.0, 0.3))
	elif mess < 0.34:
		_batched("bench", street, yaw, 1.0, Vector3(1.0, 0.5, 0.3))
	elif mess < 0.46:
		_batched("plant", street, 0.0, 1.5, Vector3(0.4, 1.0, 0.4))
	elif mess < 0.56:
		_batched("shopping_cart", street, _rng.randf_range(0, TAU))
	elif mess < 0.66:
		_floor_paint("drag", street, Vector2(5, 10), _rng.randf_range(0, TAU))
		_batched("shopping_cart", street, _rng.randf_range(0, TAU))
	elif mess < 0.72:
		_stalker("shop_dummy", street, true)
	elif mess < 0.78:
		kit.prop("kiddie_ride", street, yaw, 1.0, Vector3(0.5, 0.8, 0.5))


func _loose_stalls(at: Vector3, yaw: float) -> void:
	# A gap in the shops, full of kiosks that have been left open and tables set for one.
	for i in 5:
		var p := at + Vector3(_rng.randf_range(-16, 16), 0, _rng.randf_range(-16, 16))
		_batched("kiosk" if i < 2 else "table_set", p, _rng.randf_range(0, TAU), 1.0, Vector3(2.2, 1.5, 2.2) if i < 2 else Vector3(0.65, 1.0, 0.65))
	_floor_paint("stain_a", at, Vector2(9, 9), yaw)
	_down_light("#fff0d8", 1.2, 18.0, at + Vector3.UP * 9.0, false)


## The landmark at the end of the veins. You can find it from anywhere on the floor, by following the floor.
func _the_heart(at: Vector3) -> void:
	_claim(at, 34.0, 34.0)
	var heart := kit.prop("mall_heart", at, 0.3, 1.0, Vector3(5.0, 6.0, 4.6))
	_mover(heart, "pulse", { "amount": 0.05 })
	_down_light("#ff8a8a", 0.8, 34.0, at + Vector3(0, 8, 8))
	_stains(at, 20.0, 14)
	_post_sign("pulse", at + Vector3(10, 0, 26), 0.2)
	# veins come in along every aisle and meet here
	for route: Array in [[Vector3(0, 0, -345), Vector3(0, 0, -425)], [Vector3(-240, 0, -300), at + Vector3(-12, 0, 2)], [Vector3(240, 0, -320), at + Vector3(12, 0, 2)], [Vector3(-40, 0, -130), Vector3(-30, 0, -280)], [Vector3(60, 0, -90), Vector3(30, 0, -280)]]:
		_vein(route[0], route[1])
	_view("heart", at + Vector3(4, 0, 34), at + Vector3(0, 6, 0))


func _vein(from: Vector3, to: Vector3) -> void:
	var yaw := atan2(to.x - from.x, to.z - from.z)
	var count := int(from.distance_to(to) / 9.5)
	for i in count + 1:
		_batched("vein_patch", from.lerp(to, i / float(maxi(count, 1))), yaw + PI)
		_claim(from.lerp(to, i / float(maxi(count, 1))), 5.0, 5.0)


## Row on row of shop dummies, all facing the door. There are always more near you than there were.
func _mannequin_hall(at: Vector3) -> void:
	_claim(at, 44.0, 40.0)
	_post_sign("dummies", at + Vector3(0, 0, 36), 0.0)
	for row in 9:
		for col in 10:
			var p := at + Vector3((col - 4.5) * 7.0 + _rng.randf_range(-0.7, 0.7), 0, (row - 4.0) * 7.0 + _rng.randf_range(-0.7, 0.7))
			if (row * 7 + col * 3) % 11 == 0:
				_stalker("mannequin_skin", p, true)
			elif (row + col) % 4 == 0:
				_stalker("shop_dummy", p)
			else:
				_batched("shop_dummy", p, _rng.randf_range(-0.2, 0.2), 1.0, Vector3(0.3, 1.0, 0.3))
	for i in 5:
		_flicker(_down_light("#fff8e8", 2.0, 22.0, at + Vector3(-28 + i * 14.0, 9.0, 0), i == 2))
	_stains(at + Vector3(10, 0, -20), 8.0, 4)
	_dress(at, 40.0, 36.0, [["shopping_cart", 1.0, 1.3, Vector3.ZERO], ["boxes", 1.0, 1.4, Vector3.ZERO], ["plant", 1.2, 1.7, Vector3.ZERO]], 40)
	_view("dummies", at + Vector3(2, 0, 34), at + Vector3(0, 1.4, -10))


func _santas_grotto(at: Vector3) -> void:
	_claim(at, 26.0, 26.0)
	kit.prop("santa_throne", at, PI, 1.0, Vector3(3.2, 1.2, 2.4))
	_post_sign("grotto", at + Vector3(-9, 0, -16), 0.0)
	# the queue of children, patient, in a line back to the wall. It's not moving. It has not moved.
	var z := -8.0
	for i in 12:
		var kid := kit.prop("shop_dummy", at + Vector3(sin(i * 0.5) * 2.0, 0, z), 0.0, 0.62)
		if i % 3 == 0:
			_mover(kid, "stalk", { "creep": false })
		z -= 1.5
	_flicker(_down_light("#ff6a5a", 1.8, 22.0, at + Vector3(0, 7, 2), true))
	_down_light("#5affa0", 1.0, 14.0, at + Vector3(-6, 5, 3), false)
	_stains(at + Vector3(0, 0, -4), 7.0, 5)
	_dress(at, 24.0, 24.0, [["plant", 1.4, 2.2, Vector3(0.4, 1.0, 0.4)], ["boxes", 1.0, 1.8, Vector3.ZERO], ["bench", 1.0, 1.0, Vector3.ZERO]], 26, 12.0)
	_view("grotto", at + Vector3(4, 0, -28), at + Vector3(0, 2.5, 0))


## All the coin-op rides, rocking, with no coins in and nobody on.
func _kiddie_rides(at: Vector3) -> void:
	_claim(at, 28.0, 24.0)
	_post_sign("rides", at + Vector3(-22, 0, 20), 0.5)
	for row in 4:
		for col in 6:
			var p := at + Vector3((col - 2.5) * 6.0, 0, (row - 1.5) * 7.5)
			var ride := kit.prop("kiddie_ride", p, _rng.randf_range(-0.3, 0.3), 1.0, Vector3(0.5, 0.8, 0.5))
			if (row + col) % 2 == 0:
				_mover(ride, "shake")
			if col % 2 == 0:
				_floor_paint("stain_b", p, Vector2(3.4, 3.4), _rng.randf_range(0, TAU))
	_flicker(_down_light("#ffe08a", 1.8, 24.0, at + Vector3(0, 8.0, 0), true))
	_dress(at, 27.0, 23.0, [["trash_can", 1.0, 1.0, Vector3.ZERO], ["bench", 1.0, 1.0, Vector3.ZERO], ["plant", 1.2, 1.6, Vector3.ZERO]], 14)
	_view("rides", at + Vector3(-6, 0, 24), at + Vector3(0, 1, 0))


## The food court goes on for miles out here. Something under it has learned to come up through the drains.
func _food_depths(at: Vector3) -> void:
	_claim(at, 40.0, 38.0)
	for i in 5:
		var a := i * 1.3
		kit.prop("tray_mound", at + Vector3(cos(a), 0, sin(a)) * (10.0 + i * 5.0), a, 0.9 + (i % 2) * 0.5, Vector3(3.0, 2.0, 3.0))
	for i in 9:
		var a := i * 0.75 + 0.4
		var p := at + Vector3(cos(a), 0, sin(a)) * (6.0 + i * 3.0)
		var arm := kit.prop("noodle_tentacle", p, a, 0.9 + (i % 3) * 0.3)
		_mover(arm, "reach")
		_floor_paint("stain_a", p, Vector2(6, 6), a)
	for i in 14:
		var a := i * 1.7
		_batched("table_set", at + Vector3(cos(a), 0, sin(a)) * (16.0 + (i % 5) * 4.0), a, 1.0, Vector3(0.65, 1.0, 0.65))
	_flicker(_down_light("#ffd08a", 2.0, 30.0, at + Vector3(0, 9, 0), true))
	_down_light("#ff8a5a", 1.4, 20.0, at + Vector3(14, 3, 8), false)
	_dress(at, 38.0, 36.0, [["trash_can", 1.0, 1.3, Vector3.ZERO], ["shopping_cart", 1.0, 1.0, Vector3.ZERO], ["table_set", 1.0, 1.0, Vector3(0.65, 1.0, 0.65)]], 44, 5.0)
	_view("depths", at + Vector3(-22, 0, 28), at + Vector3(0, 2, 0))


func _wishing_well(at: Vector3) -> void:
	_claim(at, 20.0, 20.0)
	kit.prop("teeth_fountain", at, 0.0, 1.0, Vector3(5.0, 0.8, 5.0))
	_post_sign("fountain", at + Vector3(7, 0, 8), 0.5)
	_down_light("#a8e8ff", 2.0, 18.0, at + Vector3(0, 7.5, 0), true)
	for a: float in [0.5, 2.0, 3.6, 5.0]:
		_batched("bench", at + Vector3(cos(a), 0, sin(a)) * 9.0, -a + PI / 2.0, 1.0, Vector3(1.0, 0.5, 0.3))
	_dress(at, 19.0, 19.0, [["plant", 1.4, 2.0, Vector3(0.4, 1.0, 0.4)], ["shop_dummy", 1.0, 1.0, Vector3(0.3, 1.0, 0.3)]], 16, 9.0)
	_view("well", at + Vector3(-6, 0, 16), at + Vector3(0, 0.5, 0))


func _photo_row(at: Vector3) -> void:
	_claim(at, 54.0, 14.0)
	for i in 8:
		kit.prop("photo_booth", at + Vector3(-42.0 + i * 12.0, 0, 0), _rng.randf_range(-0.1, 0.1), 1.0, Vector3(1.1, 1.2, 0.7))
		if i % 2 == 0:
			_flicker(_down_light("#ffffff", 1.2, 8.0, at + Vector3(-42.0 + i * 12.0, 2.8, -2.0), false))
	_post_sign("photo", at + Vector3(-50, 0, 6), 0.5)


func _escalator_canyon(at: Vector3) -> void:
	# Every escalator in the mall that used to go somewhere. There's a heap at the bottom of each.
	_claim(at, 36.0, 34.0)
	for i in 8:
		var p := at + Vector3((i % 4 - 1.5) * 15.0, 0, (i / 4 - 0.5) * 30.0)
		kit.prop("escalator", p, 0.0, 1.0, Vector3(2.0, 2.0, 5.0))
		kit.prop("remains", p + Vector3(0, 0, 9), 0.5)
		_stains(p + Vector3(0, 0, 9), 3.0, 2)
	_down_light("#ffffff", 1.8, 34.0, at + Vector3(0, 9.0, 0), false)
	_dress(at, 34.0, 32.0, [["boxes", 1.0, 1.6, Vector3.ZERO], ["shop_dummy", 1.0, 1.0, Vector3(0.3, 1.0, 0.3)], ["trash_can", 1.0, 1.0, Vector3.ZERO]], 40, 4.0)
	_view("escalators", at + Vector3(-12, 0, 36), at + Vector3(0, 2, 0))


func _clearance_pit(at: Vector3) -> void:
	# Trolleys, thrown together into a hill. People looked for bargains under them.
	_claim(at, 28.0, 28.0)
	for i in 70:
		var a := i * 2.4
		var r := sqrt(i / 70.0) * 22.0
		_batched("shopping_cart", at + Vector3(cos(a) * r, _rng.randf_range(0.0, 0.6), sin(a) * r), a, _rng.randf_range(1.0, 1.6))
	_tag_wall(at + Vector3(0, 0, -24), 0.0, "sale")
	_flicker(_down_light("#fff0d8", 1.6, 26.0, at + Vector3(0, 8, 0), false))


func _mall_train() -> void:
	var start := Vector3(-60, 0, 110)
	var end := Vector3(-30, 0, 410)
	_vehicle_line(start, end, "rail_track", "mall_train", "Press E: board the Mall Train", "Press E: ride the Mall Train back")
	_post_sign("train", start + Vector3(6, 0, 2), PI)


func _camera_post(at: Vector3) -> void:
	_batched("lamp_post", at, 0.0, 1.0, Vector3(0.15, 2.0, 0.15))
	var eye := kit.prop("cctv_pole", at + Vector3.UP * 4.5, _rng.randf_range(0, TAU))
	_mover(eye, "stalk", { "creep": false })
	_claim(at, 3.0, 3.0)
