class_name WildsF14
extends Wilds
## Castle Dread: the Archive kept a whole season's set. A gothic castle in a dead, misty valley, still running its
## scares for an audience that died decades ago. The spookiest floor in the game (art/WORLD.md, Floor 14).

var _cottages := 0


func _build_districts() -> void:
	_castle_dread(Vector3(0, 0, -520))
	_graveyard(Vector3(-470, 0, -200))
	_gallows_hill(Vector3(470, 0, -260))
	_witch_tower(Vector3(-500, 0, 430))
	_dead_village(Vector3(460, 0, 420))
	_moat_ferry()
	for spot: Array in [[Vector3(-112, 0, 92), 0.3, "turnback"], [Vector3(112, 0, 92), -0.3, "count"], [Vector3(-220, 0, -130), 0.7, "season9"], [Vector3(230, 0, 170), -0.7, "maid"]]:
		_tag_wall(spot[0], spot[1], spot[2])
		_claim(spot[0], 10.0, 6.0)
	var deep := _cave_from_rooms("cave_f7", Vector3(170, 0, 120), "Press E: go down into the crypts", [[0, 0, 3, 5], [28, -6, 0, 5], [56, 8, -2, 6], [60, 40, -4, 6], [30, 56, -6, 11], [-4, 34, -4, 5]], "#9affc0", "#ffb860", 4, "coffin", 1.0)
	kit.prop("crypt_door", Vector3(170, 0, 120), 0.6)
	_claim(Vector3(170, 0, 120), 14.0, 14.0)
	# the ossuary: shelves of skulls, and one coffin that's been opened from the inside
	for i in 6:
		kit.prop("coffin", deep + Vector3(-7.5 + i * 3.0, 0, -5), 0.0)
	kit.prop("candelabra", deep + Vector3(0, 0, 2), 0.0)
	_flicker(_light("#ffb860", 0.9, 10.0, deep + Vector3(0, 2.2, 2), true), "candle")
	_view("crypt", deep + Vector3(3, 0.2, 6), deep + Vector3(0, 1.4, -5))
	var hatch := Vector3(-330, 0, 300)
	kit.prop("haunted_portrait", hatch + Vector3(0, 1.6, -3), 0.0)
	_claim(hatch, 8.0, 8.0)
	_build_loot_room(hatch, "Press E: the portrait's eyes follow you. Push it.", "facade_a")
	_apply_claims()
	_fill_grid(64.0, 30.0, 40.0, _dead_wood)
	_ride_line(Vector3(-160, 0, -90), Vector3(-160, 0, -320), "zip_rail", "Press E: ride the old bell rope", "Press E: ride it back")


## Between everything: dead woods, ruined cottages, gravestones nobody tends.
func _dead_wood(at: Vector3, yaw: float) -> void:
	_cottages += 1
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	if _cottages % 5 == 0:
		_ruin(at, yaw, ["The Old Rectory", "The Tannery", "Ashen Cottage", "The Gamekeeper's", "The Toll House"][(_cottages / 5) % 5], 14.0, 10.0, 6.0, "facade_a", "#ffb860", 0.9)
		return
	for i in 6:
		var p := at + Vector3(_rng.randf_range(-24, 24), 0, _rng.randf_range(-24, 24))
		var mess := _rng.randf()
		if mess < 0.45:
			_batched("hill_dead_tree" if _prop_exists("hill_dead_tree") else "dead_bush", p, _rng.randf_range(0, TAU), _rng.randf_range(0.8, 1.6), Vector3(0.4, 2.0, 0.4))
		elif mess < 0.6:
			_batched("headstone_row", p, _rng.randf_range(0, TAU), 1.0, Vector3(1.4, 0.7, 0.3))
		elif mess < 0.68:
			kit.prop("remains", p, _rng.randf_range(0, TAU))
		elif mess < 0.74:
			_batched("candle_grave", p, _rng.randf_range(0, TAU))
	if _cottages % 4 == 0:
		_flicker(_light("#ffb860", 0.7, 12.0, at + forward * 6.0 + Vector3.UP * 1.5, false), "candle")


## The castle: curtain walls with walkways and battlements, corner towers, a gatehouse and drawbridge, a moat, and the
## keep in the middle, five storeys, with a bridge from its roof across to the wall.
func _castle_dread(ground_at: Vector3) -> void:
	# the crag: a great slab of rock the castle stands on, stepped and broken at the edges, with a road up to the gate
	const CRAG := 8.0
	var rock := kit.surface("facade_a", Vector2(40, CRAG), 4.0, 0.6)
	var size := 95.0 * 2.0 + 14.0
	kit.block(Vector3(size, CRAG, size), rock, ground_at + Vector3.UP * CRAG / 2.0)
	kit.box_collider(ground_at + Vector3.UP * CRAG / 2.0, Vector3(size / 2.0, CRAG / 2.0, size / 2.0))
	for i in 28:
		var a := i * TAU / 28.0
		var p := ground_at + Vector3(cos(a), 0, sin(a)) * (size / 2.0 + _rng.randf_range(0.0, 3.0))
		var w := _rng.randf_range(10.0, 18.0)
		var h := _rng.randf_range(CRAG * 0.5, CRAG + 2.0)
		kit.block(Vector3(w, h, 6.0), rock, p + Vector3.UP * h / 2.0, -a + PI / 2.0 + _rng.randf_range(-0.3, 0.3))
		if i % 3 == 0:
			kit.prop("hill_boulders", p + Vector3(cos(a), 0, sin(a)) * 6.0, a, _rng.randf_range(1.2, 2.2))
	var gate := Vector3(0, 0, 1)
	var road_top := ground_at + gate * (size / 2.0) + Vector3.UP * CRAG
	_bridge(ground_at + gate * (size / 2.0 + CRAG * 3.2), road_top, 8.0, kit.surface("pave", Vector2(8, 30), 6.0, 0.4))
	var at := ground_at + Vector3.UP * CRAG
	# concentric: a huge outer wall, a taller inner ward, and the keep in the middle of that
	var half := 95.0
	var wall_h := _castle(at, half, 16.0, "Castle Dread", "facade_a")
	var inner := 52.0
	var inner_h := _castle(at, inner, 22.0, "The Inner Ward", "facade_a")
	# flying bridges from the inner walls across to the outer walls, high over the outer bailey
	for k: float in [-1.0, 1.0]:
		_bridge(at + Vector3(k * (inner + 1.0), inner_h + 0.3, -20.0), at + Vector3(k * (half - 1.0), wall_h + 0.3, -20.0), 3.0)
		_bridge(at + Vector3(-20.0, inner_h + 0.3, k * (inner + 1.0)), at + Vector3(-20.0, wall_h + 0.3, k * (half - 1.0)), 3.0)
	# the moat: black water all round, crossed only by the drawbridge
	var moat := kit.plane(Vector2(half * 2.0 + 60.0, half * 2.0 + 60.0), Models.toon(Color("#0a0e14")), ground_at + Vector3.UP * 0.03)
	moat.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	# the keep, six storeys of stone, and a bridge from its roof to the inner ward's north wall
	var keep_h := _keep(at, 6, "The Keep")
	_bridge(at + Vector3(0, keep_h, -9.5), at + Vector3(0, inner_h + 0.3, -inner + 1.0), 3.0)
	# the great hall in the courtyard, a chapel, the stables
	_ruin(at + Vector3(-26, 0, 30), 0.0, "The Great Hall", 22.0, 16.0, 12.0, "facade_a", "#ffb860", 1.4)
	kit.prop("iron_chandelier", at + Vector3(-26, 9.0, 30), 0.0, 1.4)
	kit.prop("gothic_throne", at + Vector3(-26, 0, 24), 0.0, 1.2)
	_ruin(at + Vector3(74, 0, 40), PI, "The Chapel", 16.0, 12.0, 10.0, "facade_a", "#c8d8ff", 1.0)
	for i in 6:
		kit.prop("candelabra", at + Vector3(68.0 + (i % 3) * 5.0, 0, 34.0 + (i / 3) * 6.0), 0.0)
	_ruin(at + Vector3(-74, 0, -40), 0.0, "The Stables", 16.0, 12.0, 6.0, "facade_b", "#ffb860", 0.8)
	for i in 8:
		kit.prop("gargoyle", at + Vector3(cos(i * TAU / 8.0), 0, sin(i * TAU / 8.0)) * (half - 1.0) + Vector3.UP * (wall_h + 1.4), -i * TAU / 8.0)
	for i in 10:
		kit.prop("armour_stand", at + Vector3(16.0 + (i % 5) * 6.0, 0, 30.0 + (i / 5) * 6.0), PI)
	_steam(at + Vector3(0, 0.4, 0), "#c8d0d8", 24)
	_light("#9ab8ff", 1.0, 120.0, at + Vector3(0, 40, 0), true)
	_view("castle", at + Vector3(0, 1.0, half + 40.0), at + Vector3(0, 12.0, 0))
	_view("battlements", at + Vector3(-half + 2.0, wall_h + 1.8, 30.0), at + Vector3(0, 18.0, 0))
	_view("keeptop", at + Vector3(0, keep_h + 1.8, 6.0), at + Vector3(0, inner_h, -inner))


func _graveyard(at: Vector3) -> void:
	_claim(at, 40.0, 40.0)
	_post_sign_text("Contestants' Rest", at + Vector3(0, 0, 36))
	for i in 10:
		kit.prop("iron_fence", at + Vector3(-36.0 + i * 8.0, 0, -36), 0.0)
		kit.prop("iron_fence", at + Vector3(-36.0 + i * 8.0, 0, 36), 0.0)
	for row in 6:
		for k in 8:
			_batched("headstone_row", at + Vector3(-28.0 + k * 8.0 + _rng.randf_range(-1, 1), 0, -24.0 + row * 9.0), _rng.randf_range(-0.15, 0.15), 1.0, Vector3(1.4, 0.7, 0.3))
	kit.prop("crypt_door", at + Vector3(0, 0, -30), 0.0, 1.4)
	for i in 4:
		_stalker("far_figure", at + Vector3(_rng.randf_range(-30, 30), 0, _rng.randf_range(-30, 30)), true)
	_steam(at, "#b8c0c8", 20)
	_view("graveyard", at + Vector3(0, 1.0, 34), at + Vector3(0, 1.5, -20))


## A raised scaffold on a bare hill, reached by a long ramp, the rope still swinging.
func _gallows_hill(at: Vector3) -> void:
	_claim(at, 30.0, 30.0)
	var top := _gantry(at, Vector2(10, 10), 4.0, 0.0)
	kit.prop("gallows", top, 0.0, 1.0)
	_mover(kit.prop("hanged_figure", top + Vector3(0, 3.6, 0), 0.0), "sway")
	_light("#b8c8e8", 0.8, 24.0, top + Vector3(0, 8, 0), true)
	_view("gallows", at + Vector3(0, 1.0, 30), top + Vector3(0, 3.0, 0))


## The witch's crooked tower on its crag, and a spiral of walkway round it to the lit window at the top.
func _witch_tower(at: Vector3) -> void:
	_claim(at, 26.0, 26.0)
	kit.prop("witch_tower", at, 0.3, 1.0, Vector3(3.0, 6.0, 3.0))
	var last := at + Vector3(10, 0, 0)
	for i in range(1, 13):
		var a := i * 0.6
		var p := at + Vector3(cos(a) * 9.0, i * 1.2, sin(a) * 9.0)
		_bridge(last, p, 2.4)
		last = p
	_flicker(_light("#8aff8a", 1.4, 16.0, at + Vector3(0, 14.0, 0), true), "candle")
	_view("witch", at + Vector3(0, 1.0, 30), at + Vector3(0, 10.0, 0))


func _dead_village(at: Vector3) -> void:
	_claim(at, 44.0, 36.0)
	_post_sign_text("Ashen Hamlet", at + Vector3(0, 0, 34))
	for i in 6:
		var p := at + Vector3(-30.0 + (i % 3) * 30.0, 0, -14.0 + (i / 3) * 28.0)
		_ruin(p, _rng.randf_range(-0.3, 0.3), ["The Baker's", "The Smithy", "No. 3", "The Well House", "The Cooper's", "The Chandler's"][i], 12.0, 10.0, 6.0, "facade_a", "#ffb860", 0.7)
	kit.prop("dead_mill", at + Vector3(36, 0, 0), -PI / 2.0, 1.0, Vector3(4.0, 3.0, 4.0))
	_stains(at, 20.0, 6)
	_view("village", at + Vector3(0, 1.0, 34), at + Vector3(0, 3.0, 0))


func _moat_ferry() -> void:
	_vehicle_line(Vector3(60, 0, 130), Vector3(40, 0, 380), "ferry_cable", "ferry", "Press E: take the funeral barge", "Press E: take the barge back")
