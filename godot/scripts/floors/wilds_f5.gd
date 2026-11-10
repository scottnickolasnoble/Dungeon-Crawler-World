class_name WildsF5
extends Wilds
## Suburbia Infinite's outdoors: blue painted sky, perfect lawns, 1200 m of it, and the same family waving from every yard.
## The straight streets are the point here. The horror is in what's on the lawns, and there's a different thing on every block.

const STREET_STEP := 84.0

var _lots := 0


func _build_districts() -> void:
	_streets()
	_water_tower(Vector3(310, 0, -440))
	_gnome_field(Vector3(-440, 0, -360))
	_block_party_street(Vector3(-170, 0, 410))
	_pool_row(Vector3(430, 0, 380))
	_open_house(Vector3(-430, 0, 110))
	_sprinkler_field(Vector3(120, 0, 450))
	_hoa_row()
	_power_line()
	for spot: Array in [[Vector3(-108, 0, 88), 0.2, "love"], [Vector3(112, 0, 88), -0.2, "lawn"], [Vector3(160, 0, -100), -1.0, "note"], [Vector3(-340, 0, -80), 1.0, "kids"]]:
		_tag_wall(spot[0], spot[1], spot[2])
		_claim(spot[0], 10.0, 6.0)
	# one huge lawn, mown so you can only read it from high up, and nobody's gone up there and lived to complain
	_floor_paint("mow_you", Vector3(350, 0, 90), Vector2(44, 22), 0.2)
	_claim(Vector3(350, 0, 90), 26.0, 16.0)
	var deep := _cave_from_rooms("cave_f5", Vector3(-170, 0, -130), "Press E: climb down the storm drain", [[0, 0, 3, 4.4], [-30, 0, 1, 5], [-60, 10, -1, 5], [-60, 44, -3, 5], [-28, 56, -4, 6], [6, 44, -5, 9]], "#c8d8e8", "#8affc8", 5, "shoe_pile")
	kit.prop("manhole", Vector3(-170, 0, -130), 0.5)
	_post_sign("drain", Vector3(-164, 0, -122), 0.3)
	_claim(Vector3(-170, 0, -130), 12.0, 12.0)
	# the last room: everyone who ever moved away from Smiley Pines
	for i in 7:
		kit.prop("lawn_family", deep + Vector3(-7.0 + i * 2.6, 0, -1.0 - absf(i - 3.0)), 0.2)
	_view("drain", deep + Vector3(0, 0.2, 10), deep + Vector3(0, 1.2, -2))
	# the hidden room: a dog kennel at the back of a very nice garden, with the bowl pushed aside
	var hatch := Vector3(-250, 0, -60)
	kit.prop("kennel", hatch, 0.6)
	_claim(hatch, 5.0, 5.0)
	_build_loot_room(hatch, "Press E: crawl in behind the kennel", "facade_b")
	_apply_claims()
	_lots_along_streets()
	# a look along an ordinary street, then one further out where it's gone wrong
	_view("street", Vector3(-250, 0, 198), Vector3(-170, 2.4, 198))
	_view("street_far", Vector3(480, 0, -222), Vector3(560, 2.4, -222))
	_view("garden", Vector3(-225, 0, 199), Vector3(-222, 1.6, 215))
	_view("garden_far", Vector3(495, 0, -221), Vector3(498, 1.6, -205))


## Every road, ruler-straight, from one painted horizon to the other.
func _streets() -> void:
	var half: float = kit.world_size / 2.0
	var at := -half + STREET_STEP / 2.0
	while at < half:
		var size := Vector2(10, kit.world_size)
		kit.plane(size, kit.surface("pave", size, 14.0, 0.5), Vector3(at, 0.012, 0)).visibility_range_end = 0.0
		var cross := Vector2(kit.world_size, 10)
		kit.plane(cross, kit.surface("pave", cross, 14.0, 0.5), Vector3(0, 0.014, at)).visibility_range_end = 0.0
		at += STREET_STEP


func _lots_along_streets() -> void:
	var half: float = kit.world_size / 2.0
	var first_street := -half + STREET_STEP / 2.0
	var z := first_street + STREET_STEP / 2.0
	while z < half - 20.0:
		# two rows of lots between each pair of streets, back to back, each looking at its own street
		for offset: float in [-20.0, 20.0]:
			var x := -half + 12.0
			while x < half - 12.0:
				var along := fposmod(x - first_street, STREET_STEP)
				if along > 11.0 and along < STREET_STEP - 11.0 and kit.is_free(x, z + offset, 9.0):
					_lot(Vector3(x, 0, z + offset), PI if offset < 0.0 else 0.0)
				x += 21.0
		z += STREET_STEP


func _lot(at: Vector3, yaw: float) -> void:
	# a lot on a hillside stays open lawn
	if not kit.level_ground(at.x, at.z, 12.0):
		return
	_lots += 1
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	var side := Vector3(cos(yaw), 0, -sin(yaw))
	# Their street faces away from the lot's own back fence, with a lawn out in front.
	var house := at - forward * 3.0
	if _lots % 11 == 0:
		_ruin(house, yaw, ["The Hendersons", "The Hendersons", "New Neighbours", "The Hendersons"][(_lots / 11) % 4], 13.0, 10.0, 5.6, "facade_a", "#fff0c0", 1.4)
	else:
		# nearly all of them are lovely, and the wrong ones get more common further from the town
		var wrong := clampf((at.length() - 120.0) / 900.0, 0.08, 0.5)
		var model: String = ["suburb_house_a", "suburb_house_b", "suburb_house_c"][_lots % 3]
		if _rng.randf() < wrong:
			model = ["suburb_house_watched", "suburb_house_dark", "suburb_house_bloody"][_rng.randi() % 3]
		_batched(model, house, yaw, 1.0, Vector3(6.0, 3.0, 4.5))
		_note_solid(house, 8.0)
		_garden(house, forward, side, yaw, model)
	var lawn := house + forward * 9.0
	_batched("mailbox", at + forward * 11.0 + side * 4.0, yaw, 1.0, Vector3(0.2, 1.0, 0.2))
	if _lots % 3 == 0:
		_batched("lawn_family", lawn + side * -2.0, yaw)
	elif _lots % 3 == 1 and _lots % 13 == 4:
		_stalker("lawn_family", lawn + side * -2.0)
	if _lots % 8 == 0:
		_batched("power_pole", at + forward * 12.5 + side * -7.0, yaw, 1.0, Vector3(0.15, 2.0, 0.15))
	if _lots % 5 == 0:
		_batched("car_parked_cream" if _lots % 10 == 0 else "car_parked_red", house + side * 7.5 + forward * 6.5, yaw, 1.0, Vector3(0.95, 1.0, 2.15))
	# and the block's one thing
	match _lots % 17:
		1:
			kit.prop("bbq_grill", lawn + side * 3.0, yaw, 1.0, Vector3(0.6, 0.8, 0.4))
			_steam(lawn + side * 3.0 + Vector3.UP * 1.3, "#c8b8a8", 4)
		3:
			_batched("lawn_grave", lawn + side * 2.0, yaw + _rng.randf_range(-0.1, 0.1))
			_batched("lawn_grave", lawn - side * 1.0, yaw + _rng.randf_range(-0.1, 0.1))
		5:
			_batched("abandoned_mower", lawn + side * 1.0, _rng.randf_range(0, TAU))
			_floor_paint("drag", lawn - side * 3.0, Vector2(3, 8), yaw + 1.2)
		7:
			_swing(lawn + side * 3.0, yaw)
		9:
			_batched("red_sprinkler", lawn, _rng.randf_range(0, TAU))
			_steam(lawn + Vector3.UP * 0.5, "#c81a14", 6)
		11:
			_batched("gnome", lawn + side * 1.0, yaw)
			_batched("gnome", lawn + side * 1.8, yaw)
			_batched("gnome", lawn + side * 2.6, yaw)
		13:
			_floor_paint("stain_a", lawn, Vector2(6, 6), yaw)
			kit.prop("remains", lawn, yaw)
		15:
			_wall_paint("missing", house + forward * 4.6 + side * 3.2 + Vector3.UP * 2.2, Vector2(2.0, 1.5), yaw)


## Everything a nice front garden has: hedge, fence, bushes by the door, a tree, a clipped shape on the lawn. Nothing's out of place.
func _garden(house: Vector3, forward: Vector3, side: Vector3, yaw: float, model: String) -> void:
	var front := house + forward * 13.2
	# the fence along the pavement, with a gap for the path
	for s: float in [-8.0, -3.0, 3.0, 8.0]:
		_batched("picket_run", front + side * s, yaw)
	_batched("bush_round", house + forward * 6.0 + side * 5.0, yaw, 1.3)
	_batched("bush_round", house + forward * 6.0 + side * 3.6, yaw, 1.1)
	_batched("bush_round", house + forward * 5.4 - side * 4.8, yaw, _rng.randf_range(1.0, 1.5))
	_batched("bush_round", house + forward * 5.4 - side * 2.6 + side * 0.6, yaw, _rng.randf_range(0.8, 1.2))
	for i in 6:
		_batched("flowers", house + forward * (4.9 + _rng.randf() * 0.6) + side * _rng.randf_range(-5.5, 0.0), 0.0, _rng.randf_range(0.8, 1.2))
	# the tree: a swing, some children's toys, or worse. The further out, the worse.
	if _lots % 3 == 1:
		var kinds := ["suburb_tree", "suburb_tree_tyre", "suburb_tree"]
		if model.ends_with("watched") or model.ends_with("dark"):
			kinds = ["suburb_tree_dolls", "suburb_tree_hanged"]
		elif model.ends_with("bloody"):
			kinds = ["suburb_tree_hanged"]
		_batched(kinds.pick_random(), house + forward * 10.0 + side * 6.5, _rng.randf_range(0, TAU), _rng.randf_range(0.85, 1.2), Vector3(0.3, 2.0, 0.3))
	match _lots % 23:
		2:
			_stalker("topiary_man", house + forward * 9.5 + side * -5.0)
		6:
			_batched("topiary_man", house + forward * 9.0 + side * 2.0, yaw)
		9:
			for i in 5:
				_batched("topiary_hand", house + forward * (8.0 + i * 0.9) + side * (-6.0 + i * 2.6), yaw + _rng.randf_range(-0.3, 0.3), _rng.randf_range(0.9, 1.4))
		13:
			_batched("bush_eyes", house + forward * 10.0 + side * -6.5, yaw, 1.4)
		17:
			_batched("dead_bush", house + forward * 9.0 + side * 3.0, 0.0, 1.5)
			_batched("doll_head", house + forward * 10.5 + side * 2.0, 0.5)


## Nothing grows on the road. They have people for that.
func _cover_allowed(x: float, z: float) -> bool:
	var half: float = kit.world_size / 2.0
	var first := -half + STREET_STEP / 2.0
	for value: float in [x, z]:
		var along := fposmod(value - first, STREET_STEP)
		if along < 6.0 or along > STREET_STEP - 6.0:
			return false
	return true


func _swing(at: Vector3, yaw: float) -> void:
	_batched("swing_frame", at, yaw)
	var top := kit.prop("swing_set", at + Vector3.UP * 2.4, yaw)
	_mover(top, "swing")


func _water_tower(at: Vector3) -> void:
	_claim(at, 18.0, 18.0)
	kit.prop("water_tower", at, 0.1, 1.0, Vector3(1.0, 8.0, 1.0))
	_post_sign("pines", at + Vector3(8, 0, 12), 0.1)
	_light("#fff4d8", 2.0, 40.0, at + Vector3(0, 12, -10), false)
	_view("tower", at + Vector3(-3, 0, 17), at + Vector3(0, 20, -6))


## Their Pope preaches here. There are hundreds of them on the grass, and they've all turned to look at the gate.
func _gnome_field(at: Vector3) -> void:
	_claim(at, 46.0, 40.0)
	kit.prop("gnome_altar", at, 0.0, 1.0, Vector3(3.2, 1.8, 3.2))
	_post_sign("gnomes", at + Vector3(0, 0, 34), 0.0)
	for i in 520:
		var a := i * 2.4
		var r := 7.0 + sqrt(i / 520.0) * 34.0
		var p := at + Vector3(cos(a) * r, 0, sin(a) * r * 0.86)
		_batched(["gnome", "gnome", "gnome_knife", "gnome", "gnome_grin"][i % 5], p, atan2(p.x - at.x, p.z - at.z) + PI, _rng.randf_range(1.4, 2.0))
	for i in 18:
		var a := i * 1.7
		_stalker("gnome_grin", at + Vector3(cos(a), 0, sin(a)) * (16.0 + i * 1.1), false, 2.4)
	_stains(at, 11.0, 7)
	_light("#ff8a6a", 1.2, 22.0, at + Vector3(0, 8, 0), true)
	_view("gnomes", at + Vector3(14, 0, 28), at + Vector3(0, 2.5, 0))


func _block_party_street(at: Vector3) -> void:
	# A long table down the middle of a street. Everyone came. Everyone stayed. Nobody's touched their plate, except the one.
	_claim(at, 42.0, 18.0)
	_post_sign("party", at + Vector3(-34, 0, 10), 0.4)
	for i in 5:
		var p := at + Vector3(-28.0 + i * 14.0, 0, 0)
		kit.prop("banquet", p, 0.0, 1.0, Vector3(6.6, 0.8, 1.7))
	for i in 14:
		var s := -1.0 if i % 2 == 0 else 1.0
		var p := at + Vector3(-33.0 + i * 5.0, 0, s * 2.6)
		_batched("shop_dummy", p, 0.0 if s < 0.0 else PI, 1.0, Vector3(0.3, 1.0, 0.3))
	_stalker("lawn_family", at + Vector3(0, 0, 12))
	_stains(at + Vector3(10, 0, 0), 12.0, 6)
	_view("party", at + Vector3(-40, 0, 4), at + Vector3(0, 1, 0))


func _pool_row(at: Vector3) -> void:
	_claim(at, 38.0, 20.0)
	_post_sign("pool", at + Vector3(-32, 0, 12), 0.3)
	for i in 4:
		kit.prop("red_pool", at + Vector3(-24.0 + i * 16.0, 0, 0), i * 1.1, 1.0, Vector3(2.4, 0.7, 2.4))
	_swing(at + Vector3(0, 0, 12), 0.2)
	_view("pools", at + Vector3(-20, 0, 15), at + Vector3(-8, 0.6, 0))


func _open_house(at: Vector3) -> void:
	# The show home. The door's open. Lovely flow through the ground floor. Everyone who looked round bought it.
	_claim(at, 26.0, 22.0)
	_ruin(at, 0.0, "Open House", 20.0, 15.0, 7.0, "facade_a", "#fff8e0", 2.0)
	_post_sign("open", at + Vector3(-8, 0, 15), 0.2)
	for i in 8:
		_batched("lawn_family", at + Vector3(-14.0 + i * 4.0, 0, 17.0 + (i % 2) * 2.0), 0.0)
	_view("open", at + Vector3(10, 0, 30), at + Vector3(0, 2, 8))


func _sprinkler_field(at: Vector3) -> void:
	# The lawn is very green here, and there's a reason for that. The sprinklers have been on since the show began.
	_claim(at, 40.0, 26.0)
	for row in 4:
		for col in 7:
			var p := at + Vector3((col - 3) * 11.0, 0, (row - 1.5) * 12.0)
			_batched("red_sprinkler", p, _rng.randf_range(0, TAU))
			if (row + col) % 2 == 0:
				_steam(p + Vector3.UP * 0.5, "#c81a14", 8)
	_view("sprinklers", at + Vector3(-30, 0, 24), at + Vector3(0, 1, 0))


func _hoa_row() -> void:
	# The president's own road, with an escort, ending in a very clean gate.
	var start := Vector3(60, 0, 130)
	var end := Vector3(60, 0, 400)
	_vehicle_line(start, end, "rail_track", "golf_cart", "Press E: take the HOA patrol cart", "Press E: drive the patrol cart back")
	_post_sign("cart", start + Vector3(6, 0, 2), PI)
	_wall_paint("violation", start + Vector3(-6, 3.4, 0), Vector2(3, 2.2), PI / 2.0)


func _power_line() -> void:
	# The wires run from pole to pole above the rooftops. You could hang from them. It would get you away from the lawns.
	var start := Vector3(-120, 0, -105)
	var end := Vector3(-120, 0, -350)
	_ride_line(start, end, "zip_rail", "Press E: grab the power line", "Press E: ride the line back")
