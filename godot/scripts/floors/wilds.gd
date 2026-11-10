class_name Wilds
extends RefCounted
## What every floor's outdoors shares: paint, signs, lamps, ruins, caves, ride lines and things that move.
## Each floor has its own subclass that places hand-made districts with these.

## Caves and loot rooms live far below the floor. Going in moves you down; coming out brings you back.
const CAVE_Y := -80.0
const CAVE_AT := Vector3(40, CAVE_Y, -60)
const LOOT_AT := Vector3(200, CAVE_Y, 200)
## How far above a vehicle's floor you ride.
const SEAT_HEIGHT := 1.15

var kit: FloorWorld
## Lights that flicker: { light, base, seed, kind }.
var flickers: Array[Dictionary] = []
## Eyes in the dark that blink and vanish when you get close: { node, seed }.
var watchers: Array[Dictionary] = []
## Things that move: { node, kind, seed, origin, ... }. See animate().
var movers: Array[Dictionary] = []
## Every ride on the floor: { path: [from, to], model, vehicle }. A vehicle travels with you; a handle stays in your hand.
var rides: Array[Dictionary] = []
## The first ride's route, for the walking test.
var zip_path: Array[Vector3] = []
## Land the districts have claimed, kept back from the filler until they're all built.
var _claims: Array[Rect2] = []
## Which way the cave's first tunnel runs from its entrance, for the walking test.
var cave_walk_yaw := 0.0
## Screenshot spots: { name: [position, yaw, pitch] }.
var views := {}
## What each screenshot spot is looking at, which is where the district is: { name: position }.
var view_targets := {}
var _rng := RandomNumberGenerator.new()
var _batches := {}
## Floor 7's floodwater, which the sluice quest raises and drains (FloorWorld._flood_level).
var flood: Node3D
## Floors whose filler (trees, slag) can stand on a slope. Buildings can't, so most floors keep filler off the hills.
var fill_on_hills := false


func build(owner: FloorWorld) -> void:
	kit = owner
	_rng.seed = 7777 + kit.floor_number
	_build_districts()
	kit.before_filler()
	_before_terrain()
	kit.make_terrain()
	_open_world()
	if not _big_placed:
		_grand_buildings()
		_towers()
	_park_cars()
	_boss_chambers()
	_ground_cover()
	_far_figures()
	_hanged_figures()
	_flush_batches()


func _build_districts() -> void:
	pass


# ---------------------------------------------------------------- what's on the ground, on every floor
## Everything underfoot, by floor: [prop, how many in each 70 m square, smallest, largest]. Tall bushes are in here too.
const GROUND := {
	1: [["rubble_bits", 26, 0.8, 1.6], ["weed_crack", 34, 0.8, 1.5], ["bone_bits", 7, 0.9, 1.2], ["dead_bush", 4, 0.8, 1.5], ["doll_head", 1, 1.0, 1.0]],
	2: [["lint_tufts", 42, 0.8, 1.8], ["shoe_pile", 3, 0.5, 0.8], ["tooth_bits", 7, 1.0, 1.4], ["rubble_bits", 8, 0.5, 0.9]],
	3: [["gutter_fat", 30, 0.8, 1.7], ["bone_bits", 18, 0.9, 1.4], ["weed_crack", 20, 0.8, 1.3], ["dead_bush", 3, 0.8, 1.4]],
	4: [["receipts", 40, 0.8, 1.5], ["tooth_bits", 10, 1.0, 1.6], ["doll_head", 2, 1.0, 1.0], ["rubble_bits", 5, 0.4, 0.8]],
	5: [["grass_clump", 340, 0.8, 1.8], ["grass_tall", 24, 0.7, 1.2], ["flowers", 44, 0.8, 1.3], ["bone_bits", 2, 1.0, 1.2], ["doll_head", 1, 1.0, 1.0], ["tooth_bits", 2, 1.0, 1.4]],
	6: [["grass_tall", 70, 0.7, 1.5], ["thorn_bush", 14, 0.7, 1.5], ["bone_bits", 12, 0.9, 1.4], ["bush_round", 8, 1.0, 2.2], ["bush_eyes", 1, 1.2, 1.6], ["weed_crack", 26, 1.0, 1.8]],
	7: [["reeds", 34, 0.7, 1.5], ["pond_scum", 40, 0.8, 1.9], ["bone_bits", 4, 0.9, 1.4], ["rubble_bits", 6, 1.0, 2.0]],
	8: [["coal_bits", 34, 0.8, 1.8], ["rubble_bits", 34, 0.9, 2.2], ["fry_bits", 12, 1.0, 1.6], ["mold_tuft", 14, 0.9, 2.0], ["bone_bits", 7, 0.9, 1.3]],
	9: [["pamphlets", 34, 0.8, 1.6], ["weed_crack", 26, 0.9, 1.7], ["rubble_bits", 10, 0.7, 1.4], ["mold_tuft", 8, 0.9, 1.7], ["bone_bits", 6, 0.9, 1.3], ["dead_bush", 3, 0.9, 1.4]],
}
const GROUND_CELL := 70.0
## How close you have to be before ground clutter draws. Only what's near you is ever drawn.
const GROUND_RANGE := 72.0

var _short_range := {}
## Circles kept clear of grass and clutter: arenas and great buildings. [x, z, radius]
var _bare: Array[Vector3] = []
## Where solid buildings stand, so nobody gets left inside one: [x, z, radius].
var _solid_spots: Array[Vector3] = []


func _note_solid(at: Vector3, radius: float) -> void:
	_solid_spots.append(Vector3(at.x, at.z, radius))


## Open ground: free of towns and districts, and outside any building.
func _is_open(x: float, z: float, pad: float) -> bool:
	if not kit.is_free(x, z, pad):
		return false
	for spot: Vector3 in _solid_spots:
		if Vector2(x - spot.x, z - spot.y).length() < spot.z + pad:
			return false
	return true


## Floors with roads override this, to keep grass off them.
func _cover_allowed(_x: float, _z: float) -> bool:
	return true


func _ground_cover() -> void:
	var half: float = kit.world_size / 2.0
	var hub: Dictionary = kit.data.hub
	var town := Rect2(-hub.w / 2.0 - 2.0, -hub.d / 2.0 - 2.0, hub.w + 4.0, hub.d + 4.0)
	var villages: Array[Rect2] = []
	for v: Dictionary in kit.data.get("villages", []):
		villages.append(Rect2(float(v.x) - 33.0, float(v.z) - 27.0, 66.0, 54.0))
	for item: Array in GROUND.get(kit.floor_number, []):
		_short_range[item[0]] = GROUND_RANGE if float(item[3]) * 1.0 < 3.0 else 0.0
		var cells := int(kit.world_size / GROUND_CELL)
		for cx in cells:
			for cz in cells:
				for i in int(item[1]):
					var p := Vector3(-half + (cx + _rng.randf()) * GROUND_CELL, 0, -half + (cz + _rng.randf()) * GROUND_CELL)
					var spot := Vector2(p.x, p.z)
					if town.has_point(spot):
						continue
					var in_village := false
					for v: Rect2 in villages:
						if v.has_point(spot):
							in_village = true
							break
					for b: Vector3 in _bare:
						if Vector2(p.x - b.x, p.z - b.y).length() < b.z:
							in_village = true
							break
					if not in_village and _cover_allowed(p.x, p.z):
						_batched(item[0], p, _rng.randf_range(0, TAU), _rng.randf_range(item[2], item[3]))


## Far-off people, standing still. They watch you come. They're gone by the time you get there.
func _far_figures() -> void:
	var half: float = kit.world_size / 2.0 - 20.0
	var count := 12 + kit.floor_number * 3
	for i in count:
		var at := Vector3(_rng.randf_range(-half, half), 0, _rng.randf_range(-half, half))
		if _is_open(at.x, at.z, 3.0):
			var node := kit.prop("far_figure", at, 0.0)
			_mover(node, "figure")
			if not views.has("figure") and _is_open(at.x, at.z + 36.0, 3.0) and _is_open(at.x, at.z + 18.0, 3.0):
				_view("figure", at + Vector3(2, 0, 36), at + Vector3(0, 1.6, 0))


## Under most roofs, someone's been left up. Suburbia keeps its own in the trees.
func _hanged_figures() -> void:
	if kit.floor_number == 5:
		return
	var half: float = kit.world_size / 2.0 - 20.0
	var count := 6 + kit.floor_number * 2
	for i in count:
		var at := Vector3(_rng.randf_range(-half, half), 3.0, _rng.randf_range(-half, half))
		if _is_open(at.x, at.z, 2.0):
			var node := kit.prop("hanged_figure", at, _rng.randf_range(0, TAU))
			_mover(node, "sway")
			_floor_paint("stain_b", Vector3(at.x, 0, at.z), Vector2(3, 3), _rng.randf_range(0, TAU))
			if not views.has("hanged") and _is_open(at.x, at.z + 9.0, 3.0):
				_view("hanged", Vector3(at.x + 2, 0, at.z + 9), Vector3(at.x, 3.6, at.z))


# ---------------------------------------------------------------- planning
## Marks a district's land. Filler stays off it once _apply_claims() has run, just before the filler starts.
func _claim(at: Vector3, half_x: float, half_z: float) -> void:
	_claims.append(Rect2(at.x - half_x, at.z - half_z, half_x * 2.0, half_z * 2.0))


func _apply_claims() -> void:
	for area: Rect2 in _claims:
		kit.reserve(area)
	kit.before_filler()
	_before_terrain()
	kit.make_terrain()


## Everything that needs flat ground takes it before the land is shaped, so the terrain stays level under it: the boss
## chambers, and on the open floors (where the land rises nearly everywhere) the great buildings and climbable towers.
## Some floors make their terrain while laying out districts (_apply_claims), so this runs from whichever comes first.
var _big_placed := false
var _chambers_planned := false


func _before_terrain() -> void:
	if not _chambers_planned:
		_chambers_planned = true
		_plan_chambers()
	if not _big_placed and kit.floor_number >= FloorWorld.OPEN_FROM and kit.terrain == null:
		_big_placed = true
		_grand_buildings()
		_towers()


## A screenshot spot looking at a point.
func _view(view_name: String, from: Vector3, target: Vector3) -> void:
	var d := target - from
	views[view_name] = [from, atan2(-d.x, -d.z), atan2(d.y - 1.6, Vector2(d.x, d.z).length())]
	view_targets[view_name] = target


## Visits every free square of a grid, giving each a street angle that bends gently across the map.
func _fill_grid(step: float, pad: float, edge: float, build: Callable) -> void:
	var half: float = kit.world_size / 2.0 - edge
	var x := -half
	while x < half:
		var z := -half
		while z < half:
			if kit.is_free(x, z, pad) and (fill_on_hills or kit.terrain == null or kit.terrain.highest_near(x, z, pad * 0.6) < 0.8):
				build.call(Vector3(x, 0, z), sin(x * 0.006) * cos(z * 0.005) * 0.55)
			z += step
		x += step


## A building you can't get into: it keeps the street solid.
func _solid_building(at: Vector3, yaw: float, w: float, d: float, h: float, front: String, flank: String, roof: Color, window_prop := "window", tile := 6.0) -> void:
	# buildings need level ground; on a hillside there just isn't one
	if not kit.level_ground(at.x, at.z, maxf(w, d) * 0.6 + 2.0):
		return
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	var side := Vector3(cos(yaw), 0, -sin(yaw))
	var mat := kit.surface(front, Vector2(w, h), tile)
	kit.quad(Vector2(w, h), mat, at + forward * (d / 2.0) + Vector3.UP * h / 2.0, Vector3(0, yaw, 0))
	kit.quad(Vector2(w, h), mat, at - forward * (d / 2.0) + Vector3.UP * h / 2.0, Vector3(0, yaw + PI, 0))
	var side_mat := kit.surface(flank, Vector2(d, h), tile)
	kit.quad(Vector2(d, h), side_mat, at + side * (w / 2.0) + Vector3.UP * h / 2.0, Vector3(0, yaw + PI / 2.0, 0))
	kit.quad(Vector2(d, h), side_mat, at - side * (w / 2.0) + Vector3.UP * h / 2.0, Vector3(0, yaw - PI / 2.0, 0))
	kit.box_collider(at + Vector3.UP * h / 2.0, Vector3(w / 2.0, h / 2.0, d / 2.0), yaw)
	kit.block(Vector3(w + 0.5, 0.4, d + 0.5), kit.flat(roof), at + Vector3.UP * h, yaw)
	if window_prop != "":
		for floor_y: float in [2.2, 5.0, 7.8, 10.6, 13.4]:
			if floor_y > h - 1.0:
				break
			for x: float in [-w * 0.3, 0.0, w * 0.3]:
				_batched(_window_for(window_prop), at + side * x + forward * (d / 2.0) + Vector3.UP * floor_y, yaw)
	_weather_building(at, yaw, w, d, h, window_prop != "")


## Lit windows mostly. Not all of them.
func _window_for(usual: String) -> String:
	return kit.any_window(0.08 + kit.floor_number * 0.025) if usual == "window" else usual


## A solid building's front door, drainpipes and creepers. You can't go in, and from the street you'd never know.
func _weather_building(at: Vector3, yaw: float, w: float, d: float, h: float, with_door: bool) -> void:
	# buildings need level ground; on a hillside there just isn't one
	if not kit.level_ground(at.x, at.z, maxf(w, d) * 0.6 + 2.0):
		return
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	var side := Vector3(cos(yaw), 0, -sin(yaw))
	_note_solid(at, maxf(w, d) * 0.72)
	if with_door:
		_batched("door_boarded", at + forward * (d / 2.0 + 0.08), yaw)
	var lift := minf(h - 9.2, 0.0)
	_batched("drainpipe", at + forward * (d / 2.0 + 0.1) + side * (w / 2.0 - 0.3) + Vector3.UP * lift, yaw)
	# its own dice, not the layout's: dressing a building must never move where anything else on the floor ends up
	if randf() < 0.5:
		_batched("drainpipe", at - forward * (d / 2.0 + 0.1) - side * (w / 2.0 - 0.3) + Vector3.UP * lift, yaw + PI)
	if randf() < 0.4:
		_batched("wall_creeper", at + forward * (d / 2.0 + 0.05) + side * randf_range(-w * 0.4, w * 0.4), yaw)
	if randf() < 0.3:
		_batched("wall_creeper", at + side * (w / 2.0 + 0.05) + forward * randf_range(-d * 0.35, d * 0.35), yaw + PI / 2.0)


## Scattered copies of a batched prop around a point, kept off anything already taken.
func _spread(prop_name: String, at: Vector3, radius: float, count: int, scale_low := 1.0, scale_high := 1.0, collide_half := Vector3.ZERO) -> void:
	for i in count:
		var a := _rng.randf_range(0, TAU)
		var p := at + Vector3(cos(a), 0, sin(a)) * sqrt(_rng.randf()) * radius
		if kit.is_free(p.x, p.z, 1.0):
			_batched(prop_name, p, _rng.randf_range(0, TAU), _rng.randf_range(scale_low, scale_high), collide_half)


## Things that are only ever still while you're looking at them. They turn to face you, and some also come closer.
func _stalker(prop_name: String, at: Vector3, come_closer := false, scale_by := 1.0) -> void:
	var node := kit.prop(prop_name, at, _rng.randf_range(0, TAU), scale_by)
	_mover(node, "stalk", { "creep": come_closer })


## A floor-level ride: track on the ground, and a vehicle that carries you. Quests will lock these once quests exist.
func _vehicle_line(start: Vector3, end: Vector3, track_prop: String, vehicle: String, text_out: String, text_back: String) -> void:
	var yaw := atan2(end.x - start.x, end.z - start.z)
	var count := int(start.distance_to(end) / 10.0)
	for i in count + 1:
		kit.prop(track_prop, start.lerp(end, (i + 0.5) / float(count + 1)), yaw)
	kit.prop(vehicle, start - Vector3(sin(yaw), 0, cos(yaw)) * 6.0, yaw)
	kit.prop(vehicle, end + Vector3(sin(yaw), 0, cos(yaw)) * 6.0, yaw + PI)
	_light("#ffe08a", 1.6, 14.0, start + Vector3(0, 4.5, 0), false)
	_light("#ffe08a", 1.6, 14.0, end + Vector3(0, 4.5, 0), false)
	var path: Array[Vector3] = [start + Vector3.UP * SEAT_HEIGHT, end + Vector3.UP * SEAT_HEIGHT]
	_add_ride(path, "res://models/props/wilds/%s.glb" % vehicle, true, start, end, text_out, text_back)
	_claim_path(start, end, 7.0)


func _add_ride(path: Array[Vector3], model: String, vehicle: bool, start: Vector3, end: Vector3, text_out: String, text_back: String) -> void:
	rides.append({ "path": path, "model": model, "vehicle": vehicle })
	if zip_path.is_empty():
		zip_path = path
	kit.interactables.append({ "pos": start, "r": 4.0, "text": text_out, "zip": rides.size() })
	kit.interactables.append({ "pos": end, "r": 4.0, "text": text_back, "zip": -rides.size() })


## Fills a district with clutter so it doesn't feel like a car park: items are [prop, smallest, largest, collision half size].
## keep_clear leaves the middle free for the district's centrepiece.
func _dress(at: Vector3, half_x: float, half_z: float, items: Array, count: int, keep_clear := 0.0) -> void:
	for i in count:
		var p := at + Vector3(_rng.randf_range(-half_x, half_x), 0, _rng.randf_range(-half_z, half_z))
		if keep_clear > 0.0 and p.distance_to(at) < keep_clear:
			continue
		var item: Array = items[i % items.size()]
		_batched(item[0], p, _rng.randf_range(0, TAU), _rng.randf_range(item[1], item[2]), item[3])


## Keeps the filler off a strip of land, such as a road or a ride's route.
func _claim_path(from: Vector3, to: Vector3, width: float) -> void:
	var n := int(from.distance_to(to) / maxf(width, 4.0)) + 1
	for i in n + 1:
		_claim(from.lerp(to, i / float(n)), width, width)


## A lamp shining only downward, for floors with a low ceiling where a round light would paint a circle on the roof.
func _down_light(color: String, energy: float, reach: float, at: Vector3, shadows := false) -> SpotLight3D:
	var ceiling := float(kit.data.ceil)
	var light := SpotLight3D.new()
	light.light_color = Color(color)
	light.light_energy = energy * 3.0
	light.spot_range = ceiling + 2.0
	light.spot_angle = clampf(rad_to_deg(atan2(reach, ceiling)), 30.0, 72.0)
	light.spot_attenuation = 0.8
	light.shadow_enabled = shadows
	light.position = Vector3(at.x, ceiling - 0.6, at.z)
	light.rotation = Vector3(-PI / 2.0, 0, 0)
	light.distance_fade_enabled = true
	light.distance_fade_begin = 80.0
	light.distance_fade_length = 20.0
	kit.root.add_child(light)
	return light


## A freestanding wall with paint on it, facing along `yaw`.
func _tag_wall(at: Vector3, yaw: float, graffiti: String, height := 3.2) -> void:
	_wall(at - Vector3(cos(yaw), 0, -sin(yaw)) * 6.0, yaw, 1)
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	_wall_paint(graffiti, at + forward * 0.66 + Vector3.UP * 3.6, Vector2(8, height), yaw)


## A cave from the same rooms its model was built from: [x, y, z, half height] in Blender's axes. Returns the deepest room.
func _cave_from_rooms(cave_name: String, surface: Vector3, enter_text: String, rooms: Array, light_a: String, light_b: String, deep_room: int, clutter: String, clutter_scale := 1.0) -> Vector3:
	var lights: Array = []
	for r: Array in rooms:
		lights.append(Vector3(r[0], float(r[2]) - float(r[3]) * 0.55, r[1]))
	_build_cave(cave_name, surface, enter_text, lights, light_a, light_b)
	cave_walk_yaw = atan2(-float(rooms[1][0]), float(rooms[1][1]))
	var deep: Vector3 = lights[deep_room]
	var at := CAVE_AT + Vector3(deep.x, deep.y, -deep.z)
	# break up the walls, so a room reads as a room: things stood about in every chamber
	for i in lights.size():
		var room: Vector3 = lights[i]
		for k in 5:
			var a := k * TAU / 5.0 + i
			kit.prop(clutter, CAVE_AT + Vector3(room.x + cos(a) * 5.5, room.y, -room.z + sin(a) * 5.5), a, clutter_scale)
	kit.prop("loot_chest", at + Vector3(3, 0, -3), 2.6)
	kit.interactables.append({ "pos": at + Vector3(3, 0, -3), "r": 3.0, "text": "A loot box, a long way from anywhere. Loot arrives with Phase 2." })
	return at


# ---------------------------------------------------------------- paint and signs
func _tex(texture_name: String) -> Texture2D:
	return kit.tex("res://textures/wilds/f%d_%s.png" % [kit.floor_number, texture_name])


func _decal_mat(texture_name: String, tint := Color.WHITE) -> ShaderMaterial:
	var mat := Models.toon(tint, _tex(texture_name), Vector2.ONE, 0.15)
	mat.shader = preload("res://shaders/toon_cutout.gdshader")
	return mat


## Paint on the floor.
func _floor_paint(texture_name: String, at: Vector3, size: Vector2, yaw := 0.0, tint := Color.WHITE, lift := 0.015) -> void:
	var node := kit.quad(size, _decal_mat(texture_name, tint), at + Vector3.UP * lift, Vector3(-PI / 2.0, yaw, 0))
	node.rotation_order = EULER_ORDER_YXZ
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF


## Paint on a wall facing along `yaw`.
func _wall_paint(texture_name: String, at: Vector3, size: Vector2, yaw := 0.0) -> void:
	var node := kit.quad(size, _decal_mat("g_" + texture_name), at, Vector3(0, yaw, 0))
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF


func _stains(at: Vector3, radius: float, count: int) -> void:
	for i in count:
		var a := _rng.randf_range(0, TAU)
		var d := _rng.randf_range(0, radius)
		var s := _rng.randf_range(2.0, 6.0)
		_floor_paint(["stain_a", "stain_b"][i % 2], at + Vector3(cos(a), 0, sin(a)) * d, Vector2(s, s), _rng.randf_range(0, TAU), Color.WHITE, 0.012 + i * 0.001)


func _drag_mark(at: Vector3, yaw: float, length := 9.0) -> void:
	_floor_paint("drag", at, Vector2(length * 0.6, length), yaw, Color.WHITE, 0.017)


func _post_sign(sign_name: String, at: Vector3, yaw: float) -> void:
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	kit.block(Vector3(2.5, 1.7, 0.08), kit.flat(Color("#25232c"), 0.6), at + Vector3.UP * 2.4, yaw)
	kit.quad(Vector2(2.4, 1.6), Models.toon(Color.WHITE, _tex("s_" + sign_name), Vector2.ONE, 0.2), at + Vector3.UP * 2.4 + forward * 0.05, Vector3(0, yaw, 0))
	for s: float in [-1.0, 1.0]:
		kit.block(Vector3(0.1, 2.0, 0.1), kit.flat(Color("#3a3038")), at + Vector3(cos(yaw) * s, 1.0, -sin(yaw) * s))
	kit.box_collider(at + Vector3.UP, Vector3(1.25, 1.0, 0.1), yaw)


func _wall(at: Vector3, yaw: float, runs: int) -> void:
	var along := Vector3(cos(yaw), 0, -sin(yaw))
	for i in runs:
		var p := at + along * (i * 12.0)
		kit.prop("wall_run", p, yaw, 1.0)
		kit.box_collider(p + Vector3.UP * 4.75, Vector3(6.0, 4.75, 0.6), yaw)


# ---------------------------------------------------------------- light
func _light(color: String, energy: float, reach: float, at: Vector3, shadows := true) -> OmniLight3D:
	# Lamps out here do the heavy lifting: bright, wide pools with hard edges to the dark.
	return kit.lamp(Color(color), energy * 2.2, reach * 1.45, at, shadows)


func _flicker(light: Light3D, kind := "fault") -> void:
	flickers.append({ "light": light, "base": light.light_energy, "seed": _rng.randf() * 100.0, "kind": kind })


## A working lamp hung from the ceiling, lighting a pocket of the floor.
func _pool_lamp(at: Vector3, color := "#ffcf8a", energy := 2.2, reach := 19.0, broken := false) -> void:
	var ceiling := float(kit.data.ceil)
	kit.prop("ceiling_light", Vector3(at.x, ceiling, at.z), _rng.randf_range(-0.3, 0.3), 1.0)
	var light := _light(color, energy, reach, Vector3(at.x, ceiling - 2.0, at.z))
	if broken:
		_flicker(light)


func _watcher(at: Vector3) -> void:
	var node := kit.prop("eyes", at, _rng.randf_range(0, TAU), 1.0)
	if node:
		watchers.append({ "node": node, "seed": _rng.randf() * 50.0 })


func _steam(at: Vector3, color := "#f4e8d8", amount := 10) -> void:
	var mat := ParticleProcessMaterial.new()
	mat.direction = Vector3.UP
	mat.spread = 12.0
	mat.initial_velocity_min = 1.2
	mat.initial_velocity_max = 2.2
	mat.gravity = Vector3.ZERO
	mat.scale_min = 0.6
	mat.scale_max = 1.5
	var puff := GradientTexture2D.new()
	puff.fill = GradientTexture2D.FILL_RADIAL
	puff.fill_from = Vector2(0.5, 0.5)
	puff.fill_to = Vector2(1.0, 0.5)
	var ramp := Gradient.new()
	ramp.set_color(0, Color(1, 1, 1, 0.8))
	ramp.set_color(1, Color(1, 1, 1, 0))
	puff.gradient = ramp
	var draw := StandardMaterial3D.new()
	draw.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	draw.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	draw.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	draw.albedo_color = Color(color)
	draw.albedo_texture = puff
	var q := QuadMesh.new()
	q.size = Vector2(1.6, 1.6)
	q.material = draw
	var p := GPUParticles3D.new()
	p.amount = amount
	p.lifetime = 2.8
	p.preprocess = 2.8
	p.process_material = mat
	p.draw_pass_1 = q
	p.position = at
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	p.visibility_range_end = 70.0
	kit.root.add_child(p)


# ---------------------------------------------------------------- things that move
func _mover(node: Node3D, kind: String, extra := {}) -> void:
	if node == null:
		return
	var entry := { "node": node, "kind": kind, "seed": _rng.randf() * 100.0, "origin": node.position, "yaw": node.rotation.y }
	entry.merge(extra)
	movers.append(entry)


func animate(clock: float, player: Node3D) -> void:
	for f: Dictionary in flickers:
		var s: float = f.seed + clock
		var k := 1.0
		match f.kind:
			"beacon":
				k = 0.15 + 0.85 * pow(0.5 + 0.5 * sin(s * 3.2), 3.0)
			"candle":
				k = 0.8 + 0.2 * sin(s * 11.0) * sin(s * 3.7)
			_:
				# a failing tube: mostly on, with bursts of stutter
				k = 0.08 if sin(s * 1.3) * sin(s * 7.1) > 0.45 and sin(s * 31.0) > -0.2 else 1.0
		f.light.light_energy = f.base * k
	var at := player.global_position if player else Vector3.ZERO
	var looking := Vector3.FORWARD
	if player:
		var player_yaw: float = player.get("yaw")
		looking = Vector3(-sin(player_yaw), 0, -cos(player_yaw))
	for w: Dictionary in watchers:
		var node: Node3D = w.node
		var s: float = w.seed + clock
		# they blink, and they aren't there when you get close
		node.visible = at.distance_squared_to(node.global_position) > 90.0 and sin(s * 0.9) * sin(s * 0.23) > -0.6 and sin(s * 5.0) > -0.92
		if player and node.visible:
			node.look_at(at + Vector3.UP * 1.7, Vector3.UP, true)
	for m: Dictionary in movers:
		var node: Node3D = m.node
		if at.distance_squared_to(node.global_position) > 8100.0 and m.kind != "belt":
			continue
		var s: float = m.seed + clock
		var origin: Vector3 = m.origin
		match m.kind:
			"figure":
				var away := node.global_position - at
				away.y = 0.0
				node.visible = away.length_squared() > 900.0 and sin(s * 0.17) > -0.7
				if node.visible:
					node.rotation.y = atan2(-away.x, -away.z)
			"stalk":
				# only while your back is turned, and they never move once you're looking
				var to_it := node.global_position - at
				to_it.y = 0.0
				if to_it.dot(looking) < 0.0 and to_it.length_squared() < 2500.0:
					node.rotation.y = atan2(-to_it.x, -to_it.z)
					if m.creep and to_it.length_squared() > 36.0:
						node.global_position -= to_it.normalized() * 0.02
			"pulse":
				var beat := pow(maxf(sin(s * 2.4), 0.0), 6.0) + 0.5 * pow(maxf(sin(s * 2.4 - 0.7), 0.0), 6.0)
				node.scale = Vector3.ONE * float(m.get("size", 1.0)) * (1.0 + beat * float(m.get("amount", 0.06)))
			"bob":
				node.position = origin + Vector3.UP * sin(s * 0.8) * 0.07
				node.rotation.y = m.yaw + sin(s * 0.3) * 0.25
			"shake":
				# a washer on its spin cycle, going for a walk
				node.position = origin + Vector3(sin(s * 37.0), absf(sin(s * 19.0)) * 0.3, cos(s * 41.0)) * 0.018
				node.rotation.z = sin(s * 31.0) * 0.012
			"sway":
				node.rotation.x = sin(s * 1.1) * 0.05 + sin(s * 2.7) * 0.025
			"swing":
				node.rotation.x = sin(s * 1.5) * 0.09
				node.rotation.z = sin(s * 0.9) * 0.05
			"reach":
				node.rotation.y = m.yaw + sin(s * 2.3) * 0.35
				node.scale = Vector3(1, 0.92 + 0.08 * sin(s * 3.1), 1)
			"bubble":
				var pop: float = fmod(s * 0.8, 1.0)
				node.position = origin + Vector3.UP * pop * 0.25
				node.scale = Vector3.ONE * (0.4 + pop * 0.9) * (1.0 if pop < 0.92 else 0.0)
			"belt":
				# a line of things carried slowly along an overhead track
				var from: Vector3 = m.from
				var to: Vector3 = m.to
				var t: float = fmod(m.offset + clock * m.speed, 1.0)
				node.position = from.lerp(to, t)
				node.rotation.x = sin(s * 1.3) * 0.05
			"scurry":
				# a rat running a loop, stopping to think about you
				var a: float = s * m.speed
				var run := sin(s * 0.35) > -0.2
				if run:
					node.position = origin + Vector3(cos(a) * m.radius, 0, sin(a * 0.7) * m.radius)
					var ahead := origin + Vector3(cos(a + 0.05) * m.radius, 0, sin((a + 0.05) * 0.7) * m.radius)
					var dir := ahead - node.position
					node.rotation.y = atan2(-dir.x, -dir.z)


# ---------------------------------------------------------------- batches: hundreds of copies drawn as one
func _batched(prop_name: String, at: Vector3, yaw := 0.0, scale_by := 1.0, collide_half := Vector3.ZERO) -> void:
	if not _batches.has(prop_name):
		_batches[prop_name] = [] as Array[Transform3D]
	_batches[prop_name].append(Transform3D(Basis(Vector3.UP, yaw).scaled(Vector3.ONE * scale_by), at))
	# no invisible walls for props whose model hasn't been made yet
	if collide_half != Vector3.ZERO and _prop_exists(prop_name):
		# thousands of these on some floors (the Stacks' shelves): they go in one body per 120 m square, because a
		# single body with that many shapes stops being solid at all, floor included
		var saved := kit.body
		kit.body = _cell_body(at)
		kit.box_collider(at + Vector3.UP * collide_half.y * scale_by, collide_half * scale_by, yaw)
		kit.body = saved


var _cell_bodies := {}


func _cell_body(at: Vector3) -> StaticBody3D:
	var key := Vector2i(floori(at.x / 120.0), floori(at.z / 120.0))
	if not _cell_bodies.has(key):
		var cell := StaticBody3D.new()
		cell.name = "Solid_%d_%d" % [key.x, key.y]
		kit.root.add_child(cell)
		_cell_bodies[key] = cell
	return _cell_bodies[key]


func _flush_batches() -> void:
	# Each prop is split into squares of land, so only what's near you is drawn. Ground clutter stops soonest of all.
	const BATCH_CELL := 120.0
	var far: float = kit.draw_distance * 1.35
	for prop_name: String in _batches:
		var path := FloorKit.WILDS_PROPS % prop_name
		if not ResourceLoader.exists(path):
			path = FloorKit.TOWN_PROPS % prop_name
		if not ResourceLoader.exists(path):
			path = FloorKit.LANDING_PROPS % prop_name
		if not ResourceLoader.exists(path):
			continue
		var mesh := Models.batch_mesh(path)
		var reach: float = _short_range.get(prop_name, far)
		if reach == GROUND_RANGE:
			_without_ink(mesh)
		if reach <= 0.0:
			reach = far
		var cells := {}
		for k in _batches[prop_name].size():
			# lifted onto the hills now that they're made
			var t: Transform3D = _batches[prop_name][k]
			if t.origin.y > -20.0:
				t.origin.y += kit.ground(t.origin.x, t.origin.z)
			var key := Vector2i(int(floor(t.origin.x / BATCH_CELL)), int(floor(t.origin.z / BATCH_CELL)))
			if not cells.has(key):
				cells[key] = [] as Array[Transform3D]
			cells[key].append(t)
		for key: Vector2i in cells:
			var transforms: Array = cells[key]
			var mm := MultiMesh.new()
			mm.transform_format = MultiMesh.TRANSFORM_3D
			mm.mesh = mesh
			mm.instance_count = transforms.size()
			for i in transforms.size():
				mm.set_instance_transform(i, transforms[i])
			var node := MultiMeshInstance3D.new()
			node.multimesh = mm
			node.visibility_range_end = reach + BATCH_CELL * 0.7
			node.position = Vector3.ZERO
			node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF if reach == GROUND_RANGE else GeometryInstance3D.SHADOW_CASTING_SETTING_ON
			kit.root.add_child(node)


func _without_ink(mesh: Mesh) -> void:
	for i in mesh.get_surface_count():
		var mat := mesh.surface_get_material(i) as ShaderMaterial
		if mat:
			var soft: ShaderMaterial = mat.duplicate()
			soft.shader = preload("res://shaders/toon_noink.gdshader")
			mesh.surface_set_material(i, soft)


# ---------------------------------------------------------------- places to find
func _ruin(at: Vector3, yaw: float, ruin_name: String, w: float, d: float, h := 4.6, facade := "facade_a", light := "#ffd8a0", energy := 1.5) -> void:
	# buildings need level ground; on a hillside there just isn't one
	if not kit.level_ground(at.x, at.z, maxf(w, d) * 0.6 + 2.0):
		return
	# A dark building you can walk through: no shopkeeper, one failing light, and something to find.
	var cfg := { "kind": "ruin", "x": at.x, "z": at.z, "yaw": yaw, "w": w, "d": d, "h": h, "name": ruin_name, "facade": facade }
	var look: Dictionary = kit.ruin_look()
	_note_solid(at, maxf(w, d) * 0.72)
	Building.build(kit, cfg, look)
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	var side := Vector3(cos(yaw), 0, -sin(yaw))
	kit.prop("filing", at - forward * (d * 0.3) + side * (w * 0.3), yaw, 1.0, Vector3(0.33, 1.0, 0.33))
	kit.prop("boxes", at + side * (w * -0.3) - forward * 1.0, yaw + 0.5, 1.0, Vector3(0.7, 1.0, 0.6))
	kit.prop("remains", at - forward * (d * 0.42), yaw)
	_flicker(_light(light, energy, 10.0, at + Vector3.UP * (h - 1.2), false))
	_watcher(at - forward * (d * 0.4) + side * (w * 0.35) + Vector3.UP * 1.5)
	kit.interactables.append({ "pos": at + forward * (d / 2.0 + 1.5), "r": 4.0, "text": ruin_name })


func _shaft_of_light(at: Vector3, color := "#d8e8ff", energy := 7.0) -> void:
	var ceiling := float(kit.data.ceil)
	var shaft := SpotLight3D.new()
	shaft.light_color = Color(color)
	shaft.light_energy = energy
	shaft.spot_range = ceiling + 12.0
	shaft.spot_angle = 34.0
	shaft.spot_attenuation = 0.6
	shaft.shadow_enabled = true
	shaft.light_volumetric_fog_energy = 5.0
	shaft.position = at + Vector3(0, ceiling - 0.2, 0)
	shaft.rotation = Vector3(-PI / 2.0, 0, 0)
	shaft.distance_fade_enabled = true
	shaft.distance_fade_begin = 90.0
	shaft.distance_fade_length = 25.0
	kit.root.add_child(shaft)


## Way in from the surface, the cave itself, its collisions, and lights where things grow.
func _build_cave(cave_name: String, surface: Vector3, enter_text: String, lights: Array, light_a: String, light_b: String) -> void:
	var model := Models.instantiate("res://models/props/wilds/%s.glb" % cave_name)
	model.position = CAVE_AT
	kit.root.add_child(model)
	_cave_collision(model)
	# Blender's +Y is Godot's -Z, so chamber positions flip Z here.
	for i in lights.size():
		var local: Vector3 = lights[i]
		var at := CAVE_AT + Vector3(local.x, local.y, -local.z)
		kit.prop("crystal", at, local.x, 1.2 + (i % 3) * 0.5)
		kit.lamp(Color(light_a if i % 2 == 0 else light_b), 2.4, 18.0, at + Vector3.UP * 1.6, false)
	kit.interactables.append({ "pos": surface, "r": 4.4, "text": enter_text, "teleport": CAVE_AT + Vector3(0, 0.5, 0) })
	kit.interactables.append({ "pos": CAVE_AT, "r": 3.5, "text": "Press E: climb back up", "teleport": surface + Vector3(0, 0.1, 5.5) })


func _cave_collision(node: Node) -> void:
	if node is MeshInstance3D:
		var shape := CollisionShape3D.new()
		var trimesh: ConcavePolygonShape3D = node.mesh.create_trimesh_shape()
		trimesh.backface_collision = true
		shape.shape = trimesh
		shape.position = CAVE_AT
		kit.body.add_child(shape)
	for child in node.get_children():
		_cave_collision(child)


## A sealed room below the floor, reached through a crack or hatch that's easy to miss.
func _build_loot_room(entrance: Vector3, enter_text: String, wall_facade := "facade_a") -> void:
	kit.interactables.append({ "pos": entrance, "r": 2.6, "text": enter_text, "teleport": LOOT_AT + Vector3(0, 0.1, 5.0) })
	var floor_mesh := PlaneMesh.new()
	floor_mesh.size = Vector2(14, 14)
	kit.mesh_node(floor_mesh, kit.flat(Color("#4a3a30")), LOOT_AT)
	kit.box_collider(LOOT_AT + Vector3(0, -0.5, 0), Vector3(7.5, 0.5, 7.5))
	kit.quad(Vector2(14, 14), kit.flat(Color("#2a2622")), LOOT_AT + Vector3.UP * 4.5, Vector3(PI / 2.0, 0, 0))
	for side: Array in [[Vector3(0, 2.25, -7), 0.0], [Vector3(0, 2.25, 7), PI], [Vector3(-7, 2.25, 0), PI / 2.0], [Vector3(7, 2.25, 0), -PI / 2.0]]:
		kit.quad(Vector2(14, 4.5), Models.toon(Color.WHITE, kit.surface_tex(wall_facade), Vector2(2.3, 0.75), 0.4), LOOT_AT + side[0], Vector3(0, side[1], 0))
		kit.box_collider(LOOT_AT + side[0], Vector3(7.0 if side[1] in [0.0, PI] else 0.3, 2.25, 0.3 if side[1] in [0.0, PI] else 7.0))
	kit.prop("loot_chest", LOOT_AT + Vector3(0, 0, -4), 0.0, 1.2)
	kit.prop("remains", LOOT_AT + Vector3(-4, 0, -5), 0.4)
	kit.prop("crates", LOOT_AT + Vector3(4.5, 0, -4.5), 0.3, 1.0)
	kit.prop("weapon_rack", LOOT_AT + Vector3(-1.5, 0, -6.6), 0.0)
	_flicker(kit.lamp(Color("#ffd24a"), 1.8, 12.0, LOOT_AT + Vector3(0, 3.4, -2), false), "candle")
	kit.interactables.append({ "pos": LOOT_AT + Vector3(0, 0, -2), "r": 2.8, "text": "Somebody's hidden stash. Loot arrives with Phase 2." })
	kit.interactables.append({ "pos": LOOT_AT + Vector3(0, 0, 5.5), "r": 2.2, "text": "Press E: squeeze back out", "teleport": entrance + Vector3(0.5, 0.1, 0.5) })


## A line you ride between two towers. Quests will lock these once quests exist.
func _ride_line(start: Vector3, end: Vector3, rail_prop: String, text_out: String, text_back: String) -> void:
	# both ends need ground you can stand on: on the open floors the line is laid after the hills are, so each end
	# slides back along the line until it's on a gentle bit of ground
	start = _standable(start, end)
	end = _standable(end, start)
	var yaw := atan2(end.x - start.x, end.z - start.z)
	kit.prop("zip_tower", start, yaw, 1.0, Vector3(1.2, 2.6, 1.2))
	kit.prop("zip_tower", end, yaw + PI, 1.0, Vector3(1.2, 2.6, 1.2))
	var count := int(start.distance_to(end) / 10.0)
	for i in count + 1:
		kit.prop(rail_prop, start.lerp(end, (i + 0.5) / float(count + 1)), yaw + PI)
	_light("#ffe08a", 1.6, 12.0, start + Vector3(0, 6.5, 0))
	_light("#ffe08a", 1.6, 12.0, end + Vector3(0, 6.5, 0))
	var path: Array[Vector3] = [start + Vector3(0, 6.9, 0), end + Vector3(0, 6.9, 0)]
	_add_ride(path, "res://models/props/wilds/zip_handle.glb", false, start, end, text_out, text_back)
	_claim_path(start, end, 6.0)


# ---------------------------------------------------------------- going up, and driving about (Floors 3 and down)
const TOWER_NAMES := { 3: "Tenement Stack", 4: "Parking Deck", 5: "Show-Home Tower", 6: "Hunters' Hide", 7: "Pumping Tower", 8: "Pithead Gantry", 9: "Civic Car Park" }
const VEHICLE_MODELS := { 3: ["car_parked_red", "car_parked"], 4: ["golf_cart"], 5: ["car_parked_cream", "car_parked_green"], 6: ["safari_jeep"], 7: ["car_parked", "car_wreck"], 8: ["mine_cart"], 9: ["car_parked", "car_parked_red"] }
const STOREY := 5.0

var vehicles: Array[Vehicle] = []
## Every tower: { at, yaw, levels }.
var towers: Array[Dictionary] = []


## Towers to climb and cars to drive, on open level land. Runs once the hills are made.
func _towers() -> void:
	if kit.floor_number < FloorWorld.TERRAIN_FROM_FLOOR:
		return
	var half: float = kit.world_size / 2.0 - 60.0
	var towers := 0
	var tries := 0
	while towers < 3 and tries < 300:
		tries += 1
		var at := Vector3(_rng.randf_range(-half, half), 0, _rng.randf_range(-half, half))
		if at.length() < 120.0 or not _is_open(at.x, at.z, 20.0) or not kit.level_ground(at.x, at.z, 16.0):
			continue
		_tower(at, _rng.randf() * TAU, 3 + (towers + kit.floor_number) % 2, TOWER_NAMES.get(kit.floor_number, "Tower"))
		towers += 1


## Cars and carts parked out in the open, to drive.
func _park_cars() -> void:
	if kit.floor_number < FloorWorld.TERRAIN_FROM_FLOOR:
		return
	var half: float = kit.world_size / 2.0 - 60.0
	var models: Array = VEHICLE_MODELS.get(kit.floor_number, ["car_parked"])
	var placed := 0
	var tries := 0
	while placed < 5 and tries < 300:
		tries += 1
		var a := _rng.randf() * TAU
		var r := _rng.randf_range(70.0, half * 0.8)
		var at := Vector3(cos(a) * r, 0, sin(a) * r)
		if not _is_open(at.x, at.z, 7.0) or not kit.level_ground(at.x, at.z, 5.0):
			continue
		var model: String = models[placed % models.size()]
		var path := FloorKit.WILDS_PROPS % model
		if not ResourceLoader.exists(path):
			path = FloorKit.TOWN_PROPS % model
		var car := Vehicle.make(path, at + Vector3.UP * (kit.ground(at.x, at.z) + 0.3), _rng.randf() * TAU, model.replace("_", " ").replace("parked ", "").replace("car parked", "car"))
		kit.root.add_child(car)
		vehicles.append(car)
		kit.reserve(Rect2(at.x - 5.0, at.z - 5.0, 10.0, 10.0))
		kit.interactables.append({ "pos": at, "r": 3.4, "text": "Press E: get in and drive", "drive": vehicles.size() - 1 })
		placed += 1


## A building you can climb: open floors joined by ramps that zig-zag up two sides, with a stash on the roof.
func _tower(at: Vector3, yaw: float, levels: int, title: String) -> void:
	var base := kit.ground(at.x, at.z)
	towers.append({ "at": at + Vector3.UP * base, "yaw": yaw, "levels": levels })
	var place := func(x: float, y: float, z: float) -> Vector3: return at + Vector3(x, y, z).rotated(Vector3.UP, yaw)
	var slab_mat: Material = kit.surface("ground", Vector2(12, 20), 6.0, 0.4)
	var wall_mat: Material = kit.surface("facade_a", Vector2(20, STOREY), 6.0, 0.4)
	var dark := kit.flat(Color("#3a3438"))
	kit.reserve(Rect2(at.x - 16.0, at.z - 16.0, 32.0, 32.0))
	_note_solid(at, 16.0)
	# corner columns, the whole way up
	for cx: float in [-10.0, 10.0]:
		for cz: float in [-10.0, 10.0]:
			var h := levels * STOREY + 1.0
			kit.block(Vector3(0.8, h, 0.8), dark, place.call(cx, h / 2.0, cz), yaw)
			kit.box_collider(place.call(cx, h / 2.0, cz), Vector3(0.4, h / 2.0, 0.4), yaw)
	for level in range(1, levels + 1):
		var y := level * STOREY
		# the floor itself, between the two ramp lanes
		kit.block(Vector3(12, 0.4, 20), slab_mat, place.call(0, y - 0.2, 0), yaw)
		kit.box_collider(place.call(0, y - 0.2, 0), Vector3(6, 0.2, 10), yaw)
		# low walls on the open ends, with gaps where the ramps arrive
		for z: float in [-9.8, 9.8]:
			kit.block(Vector3(12, 1.1, 0.25), wall_mat, place.call(0, y + 0.55, z), yaw)
			kit.box_collider(place.call(0, y + 0.55, z), Vector3(6, 0.55, 0.12), yaw)
		kit.lamp(Color("#ffd8a0"), 1.2, 12.0, place.call(0, y + 3.6, 0))
	for i in levels:
		# lane on +x for even ramps, -x for odd, each climbing one storey along the full length
		var lane := 8.0 if i % 2 == 0 else -8.0
		var up_z := 1.0 if i % 2 == 0 else -1.0
		var from: Vector3 = place.call(lane, i * STOREY + base, -8.5 * up_z)
		var to: Vector3 = place.call(lane, (i + 1) * STOREY + base, 8.5 * up_z)
		_ramp(from, to, 3.6, slab_mat)
		# a rail on the outside of the lane
		var mid := (from + to) / 2.0
		var rail_at: Vector3 = place.call(lane + signf(lane) * 1.9, 0, 0)
		kit.block(Vector3(0.2, 1.0, 17.0), dark, Vector3(rail_at.x, mid.y - base + 0.9, rail_at.z), yaw)
	# the roof: a stash and a light you can see from far off
	var roof: Vector3 = place.call(0, levels * STOREY, 0)
	kit.prop("loot_chest", roof - Vector3.UP * base, yaw, 1.2)
	kit.lamp(Color("#ffb24a"), 2.4, 22.0, roof + Vector3.UP * 3.0 - Vector3.UP * base)
	kit.prop("camp_banner", place.call(-4.0, levels * STOREY, -7.0) - Vector3.UP * base, yaw)
	kit.interactables.append({ "pos": roof + Vector3(0, -base, 0) + Vector3(0, 0, 1.6).rotated(Vector3.UP, yaw), "r": 3.0, "text": "Press E: open the rooftop stash",
		"after": "An empty stash, and a long way down.",
		"act": ["xp:%d" % (80 + kit.floor_number * 40), "gold:%d" % (25 + kit.floor_number * 15), "notice:ROOFTOP · You climbed the %s. The crowd likes a climber." % title] })
	kit.interactables.append({ "pos": place.call(0, 0, -12.5), "r": 4.0, "text": "The %s. Ramps go all the way to the roof." % title })
	kit.points.append({ "kind": "tower", "name": title, "x": at.x, "z": at.z, "level": 0 })
	_view("tower", place.call(0, 1.0, -34.0), at + Vector3.UP * levels * STOREY * 0.5)


## A sloped walkway, drawn and solid, from one point to another (both at its centre line).
var ramp_mesh: MeshInstance3D


func _ramp(from: Vector3, to: Vector3, width: float, mat: Material) -> MeshInstance3D:
	var run := to - from
	var flat := Vector2(run.x, run.z).length()
	var length := run.length()
	var pitch := atan2(run.y, flat)
	var yaw := atan2(run.x, run.z)
	var basis := Basis.from_euler(Vector3(-pitch, yaw, 0))
	var centre := (from + to) / 2.0 - basis.y * 0.2
	var mesh := BoxMesh.new()
	mesh.size = Vector3(width, 0.4, length)
	var node := MeshInstance3D.new()
	node.mesh = mesh
	node.material_override = mat
	node.transform = Transform3D(basis, centre)
	kit.root.add_child(node)
	ramp_mesh = node
	var shape := BoxShape3D.new()
	shape.size = mesh.size
	var c := CollisionShape3D.new()
	c.shape = shape
	c.transform = Transform3D(basis, centre)
	kit.body.add_child(c)
	return node


# ---------------------------------------------------------------- the structure kit: castles, walkways, gantries (art/WORLD.md, "Spooky and multi-level floors")
## A curtain wall you can walk along the top of: a square of walls around `at`, a gate gap facing the town, ramps up
## the inside of every wall, corner towers, battlements. Returns the wall-top height.
func _castle(at: Vector3, half: float, wall_h: float, castle_name: String, stone := "facade_a") -> float:
	_claim(at, half + 8.0, half + 8.0)
	var wall_mat: Material = kit.surface(stone, Vector2(half * 2.0, wall_h), 6.0, 0.4)
	var top_mat: Material = kit.surface("pave", Vector2(4, half * 2.0), 6.0, 0.4)
	var gate_dir := Vector2(-at.x, -at.z).normalized()
	var gate_side := 0
	if absf(gate_dir.x) > absf(gate_dir.y):
		gate_side = 1 if gate_dir.x > 0 else 3
	else:
		gate_side = 2 if gate_dir.y > 0 else 0
	# sides: 0 north (-z), 1 east (+x), 2 south (+z), 3 west (-x)
	for side in 4:
		var normal: Vector3 = [Vector3(0, 0, -1), Vector3(1, 0, 0), Vector3(0, 0, 1), Vector3(-1, 0, 0)][side]
		var along := Vector3(normal.z, 0, -normal.x)
		var centre: Vector3 = at + normal * half
		var yaw := atan2(normal.x, normal.z)
		var runs := [[-half, half]] if side != gate_side else [[-half, -5.0], [5.0, half]]
		for run: Array in runs:
			var mid: Vector3 = centre + along * (run[0] + run[1]) / 2.0
			var length: float = run[1] - run[0]
			var kitted := _prop_exists("castle_wall_seg")
			if kitted:
				# the Blender kit's coursed segment (8 m, merlons and arrow slits), tiled along the run
				var segs := maxi(1, roundi(length / 8.0))
				var seg_len := length / float(segs)
				for i in segs:
					var c: Vector3 = mid + along * (-length / 2.0 + seg_len * (float(i) + 0.5))
					var piece := kit.prop("castle_wall_seg", c, yaw, 1.0)
					if piece:
						piece.scale = Vector3(seg_len / 8.0, wall_h / 10.0, 1.0)
			else:
				kit.block(Vector3(length, wall_h, 3.0), wall_mat, mid + Vector3.UP * wall_h / 2.0, yaw)
				kit.block(Vector3(length, 0.3, 3.2), top_mat, mid + Vector3.UP * (wall_h + 0.15), yaw)
			kit.box_collider(mid + Vector3.UP * wall_h / 2.0, Vector3(length / 2.0, wall_h / 2.0, 1.5), yaw)
			# battlements on the outer edge (the kit has its own merlons; these are their colliders)
			var n := int(length / 2.4)
			for i in n:
				var p: Vector3 = mid + along * (-length / 2.0 + 1.2 + i * 2.4) + normal * 1.3
				if i % 2 == 0:
					if not kitted:
						kit.block(Vector3(1.2, 1.2, 0.5), wall_mat, p + Vector3.UP * (wall_h + 0.9), yaw)
					kit.box_collider(p + Vector3.UP * (wall_h + 0.9), Vector3(0.6, 0.6, 0.25), yaw)
			# wooden lookout huts on the wall top, against the battlements
			if length > 30.0:
				for k: float in [-0.25, 0.25]:
					_hoarding(mid + along * length * k + normal * 0.2 + Vector3.UP * (wall_h + 0.3), yaw)
			# a ramp up the inside face, so every wall can be walked
			if length > wall_h * 2.8 + 4.0:
				# about 21 degrees, hugging the inner face so you step straight off the top onto the wall
				var ramp_from: Vector3 = mid - normal * 3.0 + along * (wall_h * 1.3)
				var ramp_to: Vector3 = mid - normal * 3.0 - along * (wall_h * 1.3) + Vector3.UP * wall_h
				_ramp(ramp_from, ramp_to, 2.6, top_mat)
		if side == gate_side:
			kit.prop("castle_gatehouse", centre, yaw, 1.0)
			kit.prop("drawbridge", centre + normal * 10.5, yaw, 1.0)
			_light("#ffb860", 1.6, 18.0, centre + normal * 3.0 + Vector3.UP * (wall_h + 2.0), true)
			# two great towers either side of the gate, taller than the rest
			for s: float in [-1.0, 1.0]:
				_wall_tower(centre + along * s * 10.0, wall_h, 10.0, stone)
		elif half > 40.0:
			# towers along the wall as well as at the corners
			for k: float in [-0.5, 0.5]:
				_wall_tower(centre + along * half * k, wall_h, 6.0, stone)
	for cx: float in [-1.0, 1.0]:
		for cz: float in [-1.0, 1.0]:
			_wall_tower(at + Vector3(cx * half, 0, cz * half), wall_h, 8.0, stone)
	_post_sign_text(castle_name, at - Vector3(gate_dir.x, 0, gate_dir.y) * -(half + 10.0))
	return wall_h


## A round castle tower on the wall line: a stone drum up to the wall-walk (so the walk runs straight over it), a
## round room on top with a doorway on each side, a timber band, and a tall pointed slate roof, storybook style.
func _wall_tower(at: Vector3, wall_h: float, cap_h: float, stone := "facade_a") -> void:
	var mat: Material = kit.surface(stone, Vector2(24, wall_h + cap_h), 6.0, 0.4)
	var floor_mat: Material = kit.surface("pave", Vector2(10, 10), 6.0, 0.4)
	const R := 5.6
	var drum := CylinderMesh.new()
	drum.top_radius = R
	drum.bottom_radius = R + 0.6
	drum.height = wall_h
	drum.radial_segments = 16
	var drum_piece := kit.prop("castle_tower_drum", at, 0.0, 1.0) if _prop_exists("castle_tower_drum") else null
	if drum_piece:
		drum_piece.scale = Vector3(1.0, wall_h / 10.0, 1.0)
	else:
		kit.mesh_node(drum, mat, at + Vector3.UP * wall_h / 2.0)
	kit.box_collider(at + Vector3.UP * wall_h / 2.0, Vector3(R * 0.8, wall_h / 2.0, R * 0.8))
	kit.block(Vector3(R * 1.7, 0.3, R * 1.7), floor_mat, at + Vector3.UP * (wall_h + 0.15))
	# the round room: eight wall panels, the four facing the walls left open as doorways (with a lintel over each)
	const DOOR_H := 3.2
	for i in 8:
		var a := i * TAU / 8.0
		var out := Vector3(sin(a), 0, cos(a))
		var panel := at + out * (R - 0.5)
		var width := 2.0 * R * tan(PI / 8.0) + 0.2
		if i % 2 == 0:
			var lintel := panel + Vector3.UP * (wall_h + DOOR_H + (cap_h - DOOR_H) / 2.0)
			kit.block(Vector3(width, cap_h - DOOR_H, 0.9), mat, lintel, a)
			kit.box_collider(lintel, Vector3(width / 2.0, (cap_h - DOOR_H) / 2.0, 0.45), a)
		else:
			var c := panel + Vector3.UP * (wall_h + cap_h / 2.0)
			kit.block(Vector3(width, cap_h, 0.9), mat, c, a)
			kit.box_collider(c, Vector3(width / 2.0, cap_h / 2.0, 0.45), a)
	var band := CylinderMesh.new()
	band.top_radius = R + 0.4
	band.bottom_radius = R + 0.4
	band.height = 0.8
	band.radial_segments = 16
	kit.mesh_node(band, kit.flat(Color("#4a3020")), at + Vector3.UP * (wall_h + cap_h + 0.4))
	_cone_roof(at + Vector3.UP * (wall_h + cap_h + 0.8), R + 1.4, (R + 1.4) * 2.6)
	_flicker(_light("#ffcf8a", 0.9, 14.0, at + Vector3.UP * (wall_h + 2.4), false), "candle")


## A tall pointed roof: slate shingles, a little iron finial, and a pennant.
func _cone_roof(base: Vector3, radius: float, height: float, colour := "#2e3440") -> void:
	if _prop_exists("castle_cone_roof"):
		# the kit's shingled roof, with its dormer, finial and pennant
		var roof := kit.prop("castle_cone_roof", base, fposmod(base.x * 0.37 + base.z * 0.11, TAU), 1.0)
		if roof:
			roof.scale = Vector3(radius / 7.0, height / 12.0, radius / 7.0)
			return
	var cone := CylinderMesh.new()
	cone.top_radius = 0.0
	cone.bottom_radius = radius
	cone.height = height
	cone.radial_segments = 20
	var node := kit.mesh_node(cone, kit.flat(Color(colour)), base + Vector3.UP * height / 2.0)
	node.visibility_range_end = 0.0
	var spike := CylinderMesh.new()
	spike.top_radius = 0.0
	spike.bottom_radius = 0.15
	spike.height = 2.4
	kit.mesh_node(spike, kit.flat(Color("#1a1a20")), base + Vector3.UP * (height + 1.2))
	kit.block(Vector3(0.05, 0.6, 1.4), kit.flat(Color("#8a1a1a")), base + Vector3(0, height + 1.8, 0.7))


## A wooden lookout hut sitting on top of a wall: posts, plank sides, a pitched roof.
func _hoarding(at: Vector3, yaw: float) -> void:
	if _prop_exists("castle_hoarding"):
		var hut := kit.prop("castle_hoarding", at, yaw, 1.0)
		if hut:
			return
	var wood := kit.flat(Color("#6a4a2a"))
	kit.block(Vector3(5, 2.4, 0.3), wood, at + Vector3(0, 1.2, -1.8).rotated(Vector3.UP, yaw), yaw)
	for s: float in [-1.0, 1.0]:
		kit.block(Vector3(0.3, 2.4, 3.6), wood, at + Vector3(s * 2.5, 1.2, 0).rotated(Vector3.UP, yaw), yaw)
	for s: float in [-1.0, 1.0]:
		var slope := MeshInstance3D.new()
		var plank := BoxMesh.new()
		plank.size = Vector3(5.6, 0.2, 2.6)
		slope.mesh = plank
		slope.material_override = kit.flat(Color("#3a2a20"))
		slope.transform = Transform3D(Basis.from_euler(Vector3(s * 0.6, yaw, 0)), kit.lift(at + Vector3(0, 3.0, s * 1.0).rotated(Vector3.UP, yaw)))
		kit.root.add_child(slope)


## A stone keep: the open-floored tower inside (floors and zig-zag ramps), walled in stone, with battlements on top.
func _keep(at: Vector3, storeys: int, keep_name: String, stone := "facade_a") -> float:
	_tower(at, 0.0, storeys, keep_name)
	var h := storeys * STOREY
	var mat: Material = kit.surface(stone, Vector2(24, h), 6.0, 0.4)
	for side in 4:
		var normal: Vector3 = [Vector3(0, 0, -1), Vector3(1, 0, 0), Vector3(0, 0, 1), Vector3(-1, 0, 0)][side]
		var along := Vector3(normal.z, 0, -normal.x)
		var yaw := atan2(normal.x, normal.z)
		var face := at + normal * 11.8
		if side == 2:
			# the great door
			for s: float in [-1.0, 1.0]:
				var c := face + along * s * 7.0 + Vector3.UP * (h + 1.0) / 2.0
				kit.block(Vector3(10.0, h + 1.0, 1.2), mat, c, yaw)
				kit.box_collider(c, Vector3(5.0, (h + 1.0) / 2.0, 0.6), yaw)
			var over := face + Vector3.UP * (5.0 + (h - 4.0) / 2.0)
			kit.block(Vector3(4.0, h - 4.0 + 1.0, 1.2), mat, over, yaw)
			kit.box_collider(over, Vector3(2.0, (h - 3.0) / 2.0, 0.6), yaw)
		else:
			var c := face + Vector3.UP * (h + 1.0) / 2.0
			kit.block(Vector3(24.0, h + 1.0, 1.2), mat, c, yaw)
			kit.box_collider(c, Vector3(12.0, (h + 1.0) / 2.0, 0.6), yaw)
		for k in 8:
			if k % 2 == 0:
				var b := face + along * (-10.5 + k * 3.0) + Vector3.UP * (h + 1.8)
				kit.block(Vector3(1.6, 1.6, 1.2), mat, b, yaw)
				kit.box_collider(b, Vector3(0.8, 0.8, 0.6), yaw)
	for i in storeys:
		_flicker(_light("#ffb860", 1.0, 14.0, at + Vector3(0, i * STOREY + 3.0, 0), false), "candle")
	for cx: float in [-1.0, 1.0]:
		for cz: float in [-1.0, 1.0]:
			var pillar := at + Vector3(cx * 11.0, h + 2.5, cz * 11.0)
			kit.block(Vector3(1.0, 5.0, 1.0), mat, pillar)
			kit.box_collider(pillar, Vector3(0.5, 2.5, 0.5))
	_cone_roof(at + Vector3.UP * (h + 5.0), 16.0, 22.0)
	return h


## A flat or sloped walkway between two points, with a rail on each side.
func _bridge(from: Vector3, to: Vector3, width := 3.0, mat: Material = null) -> void:
	if mat == null:
		mat = kit.surface("pave", Vector2(width, from.distance_to(to)), 6.0, 0.4)
	_ramp(from, to, width, mat)
	var run := to - from
	var side := Vector3(run.z, 0, -run.x).normalized() * (width / 2.0 - 0.1)
	var yaw := atan2(run.x, run.z)
	for s: float in [-1.0, 1.0]:
		var mid := (from + to) / 2.0 + side * s + Vector3.UP * 0.6
		var rail := MeshInstance3D.new()
		var mesh := BoxMesh.new()
		mesh.size = Vector3(0.12, 0.12, run.length())
		rail.mesh = mesh
		rail.material_override = kit.flat(Color("#2a2428"))
		rail.transform = Transform3D(Basis.from_euler(Vector3(-atan2(run.y, Vector2(run.x, run.z).length()), yaw, 0)), mid)
		kit.root.add_child(rail)


## A raised platform reached by a ramp: the building block of gantries and galleries. Returns the platform's top centre.
func _gantry(at: Vector3, size: Vector2, height: float, yaw := 0.0) -> Vector3:
	var mat: Material = kit.surface("pave", size, 6.0, 0.4)
	var dark := kit.flat(Color("#2a2428"))
	var top := at + Vector3.UP * height
	kit.block(Vector3(size.x, 0.4, size.y), mat, top - Vector3.UP * 0.2, yaw)
	kit.box_collider(top - Vector3.UP * 0.2, Vector3(size.x / 2.0, 0.2, size.y / 2.0), yaw)
	for cx: float in [-1.0, 1.0]:
		for cz: float in [-1.0, 1.0]:
			var leg := at + Vector3(cx * (size.x / 2.0 - 0.4), 0, cz * (size.y / 2.0 - 0.4)).rotated(Vector3.UP, yaw)
			kit.block(Vector3(0.4, height, 0.4), dark, leg + Vector3.UP * height / 2.0)
			kit.box_collider(leg + Vector3.UP * height / 2.0, Vector3(0.2, height / 2.0, 0.2))
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	_ramp(at + forward * (size.y / 2.0 + height * 2.6) + Vector3.UP * 0.0, at + forward * (size.y / 2.0 - 0.2) + Vector3.UP * height, 2.6, mat)
	return top


## A sign board with plain painted lettering, for places that don't have a painted sign texture of their own.
func _post_sign_text(text: String, at: Vector3) -> void:
	var label := Label3D.new()
	label.text = text.to_upper()
	label.font_size = 96
	label.outline_size = 18
	label.modulate = Color("#f4e8c8")
	label.outline_modulate = Color("#0d0b12")
	label.billboard = BaseMaterial3D.BILLBOARD_FIXED_Y
	label.position = kit.lift(at + Vector3.UP * 6.0)
	label.visibility_range_end = 120.0
	kit.root.add_child(label)



var _exists_cache := {}


func _prop_exists(prop_name: String) -> bool:
	if not _exists_cache.has(prop_name):
		_exists_cache[prop_name] = ResourceLoader.exists(FloorKit.WILDS_PROPS % prop_name) or ResourceLoader.exists(FloorKit.TOWN_PROPS % prop_name) or ResourceLoader.exists(FloorKit.LANDING_PROPS % prop_name)
	return _exists_cache[prop_name]


# ---------------------------------------------------------------- the great buildings: huge, magical, frightening, one family per floor
## Per floor: [names], storeys, crown, window glow, magic colour. Crowns: spire, dome, turrets, beacon.
const GRAND := {
	3: [["The Stockpot Tower", "The Boneworks"], 7, "turrets", "#ffb860", "#ff8a3a"],
	4: [["Mall Tower One", "The Anchor Store"], 8, "beacon", "#ff8ab8", "#ff4a9a"],
	5: [["The Clubhouse Manor", "Mayor Eternal's House"], 6, "turrets", "#fff0c0", "#8affc8"],
	6: [["The Great Lodge", "The Hollow Oak Hall"], 7, "spire", "#ffd27a", "#c8ff8a"],
	7: [["The Drowned Cathedral", "The Tenement Stack"], 8, "spire", "#7affe8", "#3ad8ff"],
	8: [["Pithead Tower", "The Furnace House"], 8, "beacon", "#ffb050", "#ff7a2a"],
	9: [["The Capitol", "The Exchange"], 9, "dome", "#d8c8ff", "#a88aff"],
	10: [["Sound Stage One", "The Studio Tower"], 8, "beacon", "#ffe0a0", "#ff3a3a"],
	11: [["The Grandstand", "The Hall of Champions"], 9, "dome", "#e8f4ff", "#e8398c"],
	12: [["The Star Tower", "The Hotel Green Room"], 9, "spire", "#ffd0e0", "#f5c518"],
	13: [["The Index Spire", "The Great Reading Hall"], 10, "spire", "#ffd890", "#c8ffd8"],
	14: [["The Gaol Tower", "The Abbey of Season Nine"], 8, "turrets", "#ffb860", "#9affc0"],
	15: [["The Data Citadel", "Cooling Hall Zero"], 9, "beacon", "#8ad8ff", "#c8f0ff"],
	16: [["The Uplink Tower", "Broadcast House"], 11, "beacon", "#ff6a6a", "#c8c8ff"],
	17: [["The School on the Hill", "The Grand Hotel"], 7, "turrets", "#fff0c0", "#ffd0f0"],
	18: [["The Monolith", "The Builders' Archive"], 12, "beacon", "#ffffff", "#e8e8ff"],
}
const GRAND_STOREY := 6.0


func _grand_buildings() -> void:
	var spec: Array = GRAND.get(kit.floor_number, [])
	if spec.is_empty():
		return
	var names: Array = spec[0]
	var half: float = kit.world_size / 2.0 - 90.0
	var made := 0
	var tries := 0
	while made < names.size() and tries < 400:
		tries += 1
		var at := Vector3(_rng.randf_range(-half, half), 0, _rng.randf_range(-half, half))
		if at.length() < 200.0 or not _is_open(at.x, at.z, 34.0) or not kit.level_ground(at.x, at.z, 30.0):
			continue
		_grand(at, _rng.randf() * TAU, names[made], spec[1] + made, spec[2], spec[3], spec[4])
		made += 1


## A great building: thick walls with glowing windows, floors stacked inside joined by zig-zag ramps, a crown on top,
## lights circling it, and a stash on the roof for whoever climbs all the way.
func _grand(at: Vector3, yaw: float, title: String, storeys: int, crown: String, glow: String, magic: String) -> void:
	const HX := 15.0
	const HZ := 18.0
	var base := kit.ground(at.x, at.z)
	var place := func(x: float, y: float, z: float) -> Vector3: return at + Vector3(x, y, z).rotated(Vector3.UP, yaw)
	var height := storeys * GRAND_STOREY
	var wall: Material = kit.surface("facade_a", Vector2(HX * 2.0, height), 6.0, 0.4)
	var slab: Material = kit.surface("int_floor", Vector2(HX * 2.0, HZ * 2.0), 6.0, 0.4)
	var window_mat := kit.unshaded(Color(glow))
	kit.reserve(Rect2(at.x - 28.0, at.z - 28.0, 56.0, 56.0))
	_note_solid(at, 26.0)
	_bare.append(Vector3(at.x, at.z, 26.0))
	# outer walls, a great door on the front, and windows glowing on every storey
	for side in 4:
		var n: Vector3 = [Vector3(0, 0, -1), Vector3(1, 0, 0), Vector3(0, 0, 1), Vector3(-1, 0, 0)][side]
		var along := Vector3(n.z, 0, -n.x)
		var half_w := HX if side % 2 == 0 else HZ
		var reach := HZ if side % 2 == 0 else HX
		var w_yaw := yaw + atan2(n.x, n.z)
		var face: Vector3 = place.call(n.x * (reach + 0.6), 0, n.z * (reach + 0.6))
		var along_w := along.rotated(Vector3.UP, yaw)
		var bays := _prop_exists("grand_wall_bay")
		if side == 2:
			for s: float in [-1.0, 1.0]:
				var c := face + along_w * s * (half_w / 2.0 + 2.5) + Vector3.UP * height / 2.0
				if not bays:
					kit.block(Vector3(half_w - 5.0, height, 1.2), wall, c, w_yaw)
				kit.box_collider(c, Vector3((half_w - 5.0) / 2.0, height / 2.0, 0.6), w_yaw)
			var over := face + Vector3.UP * (7.0 + (height - 7.0) / 2.0)
			if not bays:
				kit.block(Vector3(10.0, height - 7.0, 1.2), wall, over, w_yaw)
			kit.box_collider(over, Vector3(5.0, (height - 7.0) / 2.0, 0.6), w_yaw)
		else:
			var c := face + Vector3.UP * height / 2.0
			if not bays:
				kit.block(Vector3(half_w * 2.0 + 1.2, height, 1.2), wall, c, w_yaw)
			kit.box_collider(c, Vector3(half_w + 0.6, height / 2.0, 0.6), w_yaw)
		if bays:
			_grand_bays(face, along_w, w_yaw, half_w, storeys, side, Color(glow))
			continue
		var out := Vector3(sin(w_yaw), 0, cos(w_yaw))
		for level in storeys:
			for k in 4:
				if (level + k + side) % 5 == 0:
					continue  # a dark window here and there, and you wonder why
				var wp := face + out * 0.64 + along_w * (-half_w * 0.75 + k * half_w * 0.5) + Vector3.UP * (level * GRAND_STOREY + 3.2)
				kit.quad(Vector2(1.6, 2.6), window_mat, wp, Vector3(0, w_yaw, 0))
	# floors, and ramps between them up two lanes on the long sides
	for level in range(1, storeys + 1):
		var y := level * GRAND_STOREY
		kit.block(Vector3(HX * 2.0 - 10.0, 0.4, HZ * 2.0), slab, place.call(0, y - 0.2, 0), yaw)
		kit.box_collider(place.call(0, y - 0.2, 0), Vector3(HX - 5.0, 0.2, HZ), yaw)
		_flicker(_light(glow, 1.0, 18.0, place.call(0, y - 2.5, 0), false), "candle")
	for i in storeys:
		var lane := (HX - 2.6) if i % 2 == 0 else -(HX - 2.6)
		var up_z := 1.0 if i % 2 == 0 else -1.0
		_ramp(place.call(lane, i * GRAND_STOREY + base, -(HZ - 2.0) * up_z), place.call(lane, (i + 1) * GRAND_STOREY + base, (HZ - 2.0) * up_z), 4.4, slab)
	# the crown
	var roof: Vector3 = place.call(0, height, 0)
	match crown:
		"spire":
			_cone_roof(roof, 9.0, 34.0)
		"dome":
			var dome := MeshInstance3D.new()
			var sphere := SphereMesh.new()
			sphere.radius = 12.0
			sphere.height = 14.0
			sphere.is_hemisphere = true
			dome.mesh = sphere
			dome.material_override = kit.flat(Color("#5a7a6a"))
			dome.position = kit.lift(roof) + Vector3.UP * 1.0
			kit.root.add_child(dome)
		"turrets":
			for cx: float in [-1.0, 1.0]:
				for cz: float in [-1.0, 1.0]:
					var t: Vector3 = place.call(cx * (HX - 1.5), height, cz * (HZ - 1.5))
					var drum := CylinderMesh.new()
					drum.top_radius = 2.6
					drum.bottom_radius = 2.6
					drum.height = 7.0
					kit.mesh_node(drum, wall, t + Vector3.UP * 3.5)
					_cone_roof(t + Vector3.UP * 7.0, 3.4, 9.0)
		"beacon":
			var orb := MeshInstance3D.new()
			var ball := SphereMesh.new()
			ball.radius = 3.0
			ball.height = 6.0
			orb.mesh = ball
			orb.material_override = kit.unshaded(Color(magic))
			orb.position = kit.lift(roof) + Vector3.UP * 12.0
			kit.root.add_child(orb)
			_mover(orb, "bob")
			_light(magic, 3.0, 60.0, roof + Vector3.UP * 12.0, false)
	# magic: lights drifting round it, a shaft of light through the middle, mist at its feet
	for i in 6:
		var a := i * TAU / 6.0
		var wisp := MeshInstance3D.new()
		var ball := SphereMesh.new()
		ball.radius = 0.5
		ball.height = 1.0
		wisp.mesh = ball
		wisp.material_override = kit.unshaded(Color(magic))
		wisp.position = kit.lift(at + Vector3(cos(a) * 26.0, height * (0.3 + 0.1 * i), sin(a) * 26.0))
		kit.root.add_child(wisp)
		_mover(wisp, "bob")
	_shaft_of_light(at, magic, 6.0)
	_steam(at + Vector3(0, 0.3, 0), magic, 18)
	# for whoever climbs all the way up
	kit.prop("loot_chest", roof - Vector3.UP * base, yaw, 1.4)
	kit.interactables.append({ "pos": roof - Vector3.UP * base + Vector3(0, 0, 2.0).rotated(Vector3.UP, yaw), "r": 3.0, "text": "Press E: open the stash at the top of %s" % title,
		"after": "Empty. The view's the prize now.",
		"act": ["xp:%d" % (120 + kit.floor_number * 60), "gold:%d" % (40 + kit.floor_number * 25), "lore:%d" % clampi((kit.floor_number + 2) / 3, 1, 6), "notice:You climbed %s, all %d storeys." % [title, storeys]] })
	kit.interactables.append({ "pos": place.call(0, 0, HZ + 4.0), "r": 6.0, "text": "%s. Its windows are lit. Nobody has lived here for a long time." % title })
	_post_sign_text(title, place.call(0, 0, HZ + 8.0))
	kit.points.append({ "kind": "grand", "name": title, "x": at.x, "z": at.z, "level": 0 })
	_view("grand_" + title.to_snake_case().left(10), place.call(0, 1.0, HZ + 40.0), at + Vector3.UP * height * 0.6)


# ---------------------------------------------------------------- boss chambers (data/chambers.json): two per floor
var chambers: Array[BossChamber] = []


## Where each chamber goes, chosen before the hills are made so its ground is kept flat: [data, level, grand, at].
var _chamber_plan: Array = []


func _plan_chambers() -> void:
	_chamber_plan.clear()
	var top_level := 1
	for c: Dictionary in kit.data.get("camps", []):
		top_level = maxi(top_level, kit._level_of(c))
	# the floor's own bosses who wait in chambers (the grand one first), then the floor's unique chamber bosses
	for host: Dictionary in kit.chamber_hosts:
		var camp: Dictionary = host.camp
		var data := _host_entry(str(camp.boss), camp)
		data.mob = camp.get("mob", "goblin")
		data.camp_name = camp.name
		_plan_arena(data, kit._level_of(camp), host.grand, Vector3(camp.x, 0, camp.z))
	var common: Variant = kit.data.get("camps", [{}])[0].get("mob", "goblin") if not kit.data.get("camps", []).is_empty() else "goblin"
	for i in Data.chambers.get(str(kit.floor_number), []).size():
		var entry: Dictionary = Data.chambers[str(kit.floor_number)][i].duplicate()
		entry.mob = common
		_plan_arena(entry, top_level + 2 + i * 2, false, Vector3.INF)


func _boss_chambers() -> void:
	for plan: Array in _chamber_plan:
		var shapes := ["round", "nave", "terraced"]
		var shape: String = shapes[(kit.floor_number + (0 if plan[2] else chambers.size() + 1)) % 3]
		_boss_chamber(plan[3], plan[0], plan[1], plan[2], shape)


## A camp boss's chamber entry: its name, title and the start of its discovery story as its entrance.
func _host_entry(kind: String, camp: Dictionary) -> Dictionary:
	var def: Dictionary = Data.monsters.monsters.get(kind, {})
	var story := Story.discovery(kind)
	var lines: Array = story.get("lines", []).slice(0, 2) if not story.is_empty() else []
	if lines.is_empty():
		lines = ["NIGEL: This is %s, and this is its room. Nobody who came in here to argue about that has come out to argue about it." % def.get("name", kind)]
	return { "name": "The Throne of %s" % camp.name.trim_prefix("The "), "boss": kind, "title": str(def.get("name", kind)).to_upper(), "sub": str(def.get("title", "")), "intro": lines }


func _plan_arena(data: Dictionary, level: int, grand: bool, near: Vector3) -> void:
	var r := 34.0 if grand else 21.0
	var half_floor: float = kit.world_size / 2.0 - 80.0
	var at := Vector3.INF
	for t in 400:
		var c: Vector3
		if near != Vector3.INF and t < 200:
			var a := _rng.randf() * TAU
			c = near + Vector3(cos(a), 0, sin(a)) * _rng.randf_range(r + 40.0, r + 180.0)
		else:
			c = Vector3(_rng.randf_range(-half_floor, half_floor), 0, _rng.randf_range(-half_floor, half_floor))
		if absf(c.x) > half_floor or absf(c.z) > half_floor or c.length() < 150.0:
			continue
		if _is_open(c.x, c.z, r + 10.0):
			at = c
			break
	# a crowded floor: scan the whole of it for the open spot nearest where the chamber wants to be
	if at == Vector3.INF:
		var best := INF
		var want := near if near != Vector3.INF else Vector3.ZERO
		var x := -half_floor
		while x <= half_floor:
			var z := -half_floor
			while z <= half_floor:
				if Vector2(x, z).length() >= 70.0 and _is_open(x, z, r + 2.0):
					var d := Vector2(x - want.x, z - want.z).length()
					if d < best:
						best = d
						at = Vector3(x, 0, z)
				z += 16.0
			x += 16.0
	if at == Vector3.INF:
		# a crowded floor: the grand chamber is built at the smaller size, and it's still the floor's grand fight
		if grand:
			data.grand_quest = true
			_plan_arena(data, level, false, near)
			return
		push_warning("No room for the chamber %s on floor %d" % [data.get("name", ""), kit.floor_number])
		return
	# hold the ground: nothing else builds here, and the hills go round it
	kit.reserve(Rect2(at.x - r - 8.0, at.z - r - 8.0, r * 2.0 + 16.0, r * 2.0 + 16.0))
	_note_solid(at, r + 4.0)
	_chamber_plan.append([data, level, grand, at])


## Each floor dresses its chambers with its own things, round the walls.
const ARENA_DRESS := {
	1: ["cones", "car_wreck", "tires"], 2: ["washer", "laundry_cart", "sock_pile"], 3: ["cauldron", "butcher_block", "candle_grave"],
	4: ["mannequin", "kiosk", "shop_dummy"], 5: ["gnome", "hedge", "lawn_family"], 6: ["totem_pole", "trophy_board", "thorn_bush"],
	7: ["drowned_hand", "eviction_pile", "body_bag"], 8: ["mine_cart", "drill_rig", "coal_bits"], 9: ["rat_statue", "ballot_box", "deposit_boxes"],
	10: ["spotlight", "camera_crane", "folding_chair"], 11: ["stadium_stand", "goalpost", "barrier"], 12: ["costume_rail", "makeup_mirror_desk", "applause_sign"],
	13: ["bookshelf_tall", "book_pile", "reading_desk"], 14: ["coffin", "candelabra", "armour_stand"], 15: ["server_rack", "cable_bundle", "tape_reel_stack"],
	16: ["satellite_dish", "mixing_desk", "cable_bundle"], 17: ["mirror_panel", "school_desk", "fence"], 18: ["empty_plinth", "builder_machine", "concrete_pillar"],
}


## A boss chamber, after the user's reference paintings. Three shapes:
##  round: a great ring with a glowing pool, a causeway across it to a round dais, a beam of light from far above
##  nave: a long hall, monoliths in two rows like a cathedral, the dais at the far end
##  terraced: the ring, with an upper gallery all the way round you can climb to: a fight on two levels
## Grand chambers (the floor's top boss) are big; lesser ones are smaller. Each floor has its own colour and dressing.
func _boss_chamber(at: Vector3, data: Dictionary, level: int, grand := true, shape := "round") -> void:
	var R := 34.0 if grand else 21.0
	const DAIS_H := 3.0
	var dais_r := 13.0 if grand else 8.0
	var wall_h := minf(16.0 if grand else 11.0, float(kit.data.ceil) - 1.5)
	var glow_hex: String = GRAND[kit.floor_number][4] if GRAND.has(kit.floor_number) else "#7affe8"
	var glow := Color(glow_hex)
	var glow_mat := kit.unshaded(glow)
	var base := kit.ground(at.x, at.z)
	var stone: Material = kit.surface("facade_a", Vector2(12, wall_h), 4.0, 0.5)
	var dark := kit.flat(Color("#1e1a20"))
	var use_kit := _prop_exists("chamber_wall") and wall_h >= 10.0
	var kit_scale := wall_h / 16.0
	kit.reserve(Rect2(at.x - R - 8.0, at.z - R - 8.0, R * 2.0 + 16.0, R * 2.0 + 16.0))
	_bare.append(Vector3(at.x, at.z, R + 2.0))
	_note_solid(at, R)
	var to_town := Vector2(-at.x, -at.z).normalized()
	var gate_a := atan2(to_town.x, to_town.y)
	var gate_dir := Vector3(sin(gate_a), 0, cos(gate_a))
	var side_dir := Vector3(gate_dir.z, 0, -gate_dir.x)
	# the dais: in the middle, or for a nave at the far end
	var dais_centre := at if shape != "nave" else at - gate_dir * (R - dais_r - 4.0)
	# the floor: a dark, faintly glowing pool
	var pool := MeshInstance3D.new()
	var disc := CylinderMesh.new()
	disc.top_radius = R
	disc.bottom_radius = R
	disc.height = 0.04
	disc.radial_segments = 48
	pool.mesh = disc
	pool.material_override = kit.unshaded(glow.darkened(0.82))
	pool.position = kit.lift(at + Vector3.UP * 0.05)
	kit.root.add_child(pool)
	# the ring wall, broken by the gate, the floor's own things standing in front of it
	var seg_w := 9.4 * kit_scale if use_kit else 9.0
	var segments := maxi(12, int(ceil(TAU * R / seg_w)))
	var dress: Array = ARENA_DRESS.get(kit.floor_number, ["crates", "barrels"])
	for i in segments:
		var a := i * TAU / segments
		if absf(angle_difference(a, gate_a)) < TAU / segments * 0.9:
			continue
		var out := Vector3(sin(a), 0, cos(a))
		var p := at + out * R
		var width := 2.0 * R * tan(PI / segments) + 0.4
		if use_kit:
			_tint_glow(kit.prop("chamber_wall", p, a + PI, kit_scale), Color("#ffb860"))
		else:
			kit.block(Vector3(width, wall_h, 3.0), stone, p + Vector3.UP * wall_h / 2.0, a)
			if i % 2 == 0:
				kit.quad(Vector2(1.6, 3.0), kit.unshaded(Color("#ffb860")), p - out * 1.55 + Vector3.UP * 3.2, Vector3(0, a + PI, 0))
		kit.box_collider(p + Vector3.UP * wall_h / 2.0, Vector3(width / 2.0, wall_h / 2.0, 1.5), a)
		if i % 4 == 0:
			_flicker(_light("#ff9a3a", 1.0, 10.0, p - out * 2.6 + Vector3.UP * 3.2, false), "candle")
		if i % 3 == 1:
			kit.prop(dress[i % dress.size()], p - out * _rng.randf_range(4.0, 6.0), a + PI + _rng.randf_range(-0.4, 0.4), 1.0)
	# monoliths: round chambers ring them, the nave lines them up in two rows down the hall
	var stones := []
	if shape == "nave":
		for k in 4:
			for s: float in [-1.0, 1.0]:
				stones.append(at + side_dir * s * (R * 0.42) + gate_dir * (R * 0.55 - k * R * 0.38))
	else:
		for i in (6 if grand else 4):
			var a := gate_a + PI / 6.0 + i * TAU / (6 if grand else 4)
			stones.append(at + Vector3(sin(a), 0, cos(a)) * (R - (9.0 if grand else 6.0)))
	for p: Vector3 in stones:
		var h := wall_h + 4.0
		var face := atan2(at.x - p.x, at.z - p.z)
		if use_kit:
			_tint_glow(kit.prop("chamber_monolith", p, face, h / 20.0), glow)
		else:
			kit.block(Vector3(3.4, h, 3.4), stone, p + Vector3.UP * h / 2.0, face)
			kit.quad(Vector2(0.5, h * 0.7), glow_mat, p + Vector3(sin(face), 0, cos(face)) * 1.72 + Vector3.UP * h * 0.5, Vector3(0, face, 0))
		kit.box_collider(p + Vector3.UP * h / 2.0, Vector3(1.7, h / 2.0, 1.7), face)
	# terraced: an upper gallery round the inside of the wall, reached by two ramps
	if shape == "terraced":
		var gallery_h := wall_h * 0.5
		var last := Vector3.ZERO
		for i in 25:
			var a := gate_a + PI * 0.25 + i * TAU * 0.75 / 24.0
			var p := at + Vector3(sin(a), 0, cos(a)) * (R - 4.5) + Vector3.UP * (gallery_h + base)
			if i > 0:
				_bridge(last, p, 4.0)
			last = p
		for s: float in [-1.0, 1.0]:
			var a := gate_a + s * PI * 0.25
			var top := at + Vector3(sin(a), 0, cos(a)) * (R - 4.5)
			var tangent := Vector3(cos(a), 0, -sin(a)) * s
			_ramp(top + tangent * (gallery_h * 2.6) + Vector3.UP * base, top + Vector3.UP * (gallery_h + base), 3.0, kit.surface("pave", Vector2(3, 14), 3.0, 0.5))
	# the dais and its steps, from the end of the causeway
	if use_kit:
		var dais := kit.prop("chamber_dais", dais_centre, 0.0, dais_r / 13.0)
		_tint_glow(dais, glow)
	else:
		var drum := CylinderMesh.new()
		drum.top_radius = dais_r
		drum.bottom_radius = dais_r + 0.8
		drum.height = DAIS_H
		kit.mesh_node(drum, stone, dais_centre + Vector3.UP * DAIS_H / 2.0)
	var cyl := CylinderShape3D.new()
	cyl.radius = dais_r
	cyl.height = DAIS_H
	var cs := CollisionShape3D.new()
	cs.shape = cyl
	cs.position = kit.lift(dais_centre + Vector3.UP * DAIS_H / 2.0)
	kit.body.add_child(cs)
	var gate_pos := at + gate_dir * R
	var foot := dais_centre + gate_dir * (dais_r + DAIS_H * 2.6)
	var tile_mat: Material = kit.surface("pave", Vector2(6, R), 3.0, 0.5)
	var run := gate_pos.distance_to(foot)
	kit.box_collider((gate_pos + foot) / 2.0 + Vector3.UP * 0.25, Vector3(3, 0.25, run / 2.0), gate_a)
	var steps := _ramp(foot + Vector3.UP * (0.5 + base), dais_centre + gate_dir * (dais_r - 0.5) + Vector3.UP * (DAIS_H + base), 6.0, tile_mat)
	if use_kit:
		for k in int(run / 3.0):
			_tint_glow(kit.prop("causeway_slab", gate_pos - gate_dir * (1.5 + k * 3.0), gate_a), glow)
		_tint_glow(kit.prop("chamber_steps", (foot + dais_centre + gate_dir * (dais_r - 0.5)) / 2.0, gate_a + PI), glow)
		_tint_glow(kit.prop("chamber_gate", gate_pos, gate_a, kit_scale), glow)
		steps.visible = false
	else:
		kit.block(Vector3(6, 0.5, run), tile_mat, (gate_pos + foot) / 2.0 + Vector3.UP * 0.25, gate_a)
		for k in int(run / 3.0):
			kit.block(Vector3(6.1, 0.06, 0.12), glow_mat, gate_pos - gate_dir * (1.5 + k * 3.0) + Vector3.UP * 0.52, gate_a)
	# the beam onto the dais and the core in it (grand chambers), or a ring of candles (lesser)
	var top := minf(float(kit.data.ceil) - 1.0, 60.0)
	if grand:
		var beam := CylinderMesh.new()
		beam.top_radius = 1.2
		beam.bottom_radius = 0.5
		beam.height = top - DAIS_H
		var beam_mat := kit.unshaded(Color(glow.r, glow.g, glow.b, 0.55))
		beam_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		kit.mesh_node(beam, beam_mat, dais_centre + Vector3.UP * (DAIS_H + (top - DAIS_H) / 2.0)).visibility_range_end = 0.0
		var core := MeshInstance3D.new()
		var orb := SphereMesh.new()
		orb.radius = 1.6
		orb.height = 3.2
		core.mesh = orb
		core.material_override = glow_mat
		core.position = kit.lift(dais_centre + Vector3.UP * (DAIS_H + 9.0))
		kit.root.add_child(core)
		_mover(core, "bob")
	else:
		for i in 8:
			var a := i * TAU / 8.0
			kit.prop("candle_grave", dais_centre + Vector3(sin(a), 0, cos(a)) * (dais_r - 1.2) + Vector3.UP * DAIS_H, a)
	_light(glow_hex, 3.0 if grand else 1.8, 50.0 if grand else 28.0, dais_centre + Vector3.UP * (DAIS_H + 9.0), true)
	# broken rock drifting overhead
	for i in (14 if grand else 6):
		var a := _rng.randf() * TAU
		var d := _rng.randf_range(6.0, R - 4.0)
		var h := minf(_rng.randf_range(wall_h + 4.0, wall_h + 18.0), top - 3.0)
		var chunk: Node3D
		if use_kit:
			chunk = kit.prop(["float_rock_a", "float_rock_b", "float_rock_c"][i % 3], at + Vector3(cos(a) * d, h, sin(a) * d), _rng.randf() * TAU, _rng.randf_range(0.6, 1.4))
			_tint_glow(chunk, glow)
		else:
			chunk = kit.block(Vector3(_rng.randf_range(2.0, 6.0), _rng.randf_range(1.5, 4.0), _rng.randf_range(2.0, 6.0)), stone, at + Vector3(cos(a) * d, h, sin(a) * d), _rng.randf() * TAU)
		if chunk:
			chunk.rotation.x = _rng.randf_range(-0.5, 0.5)
			_mover(chunk, "bob")
	_steam(at, glow_hex, 26 if grand else 14)
	# the gate: a lintel, the name, and the door that will come down behind you
	kit.block(Vector3(12.0 * kit_scale + 1.0, 2.4, 3.4), dark, gate_pos + Vector3.UP * (wall_h - 1.2), gate_a)
	_post_sign_text(str(data.get("name", "")), gate_pos + gate_dir * 6.0)
	var chamber := BossChamber.new()
	chamber.name = "Chamber_" + str(data.boss)
	chamber.position = at + Vector3.UP * base
	kit.root.add_child(chamber)
	chamber.setup(data, str(data.boss), level, kit._monster_path(str(data.boss)), R - 9.0, gate_pos - at, gate_a, Vector3(10.0 * kit_scale + 1.0, wall_h - 2.4, 1.6), dais_centre + Vector3.UP * (base + DAIS_H))
	chamber.floor_y = 0.0
	chamber.set_meta("grand", grand or data.get("grand_quest", false))
	chamber.gate_spot = gate_pos + gate_dir * 5.0
	chambers.append(chamber)
	_chamber_quest(chamber, data, gate_pos + gate_dir * 5.0, grand)
	kit.points.append({ "kind": "chamber" if grand else "lesser_chamber", "name": str(data.name), "x": at.x, "z": at.z, "level": level })
	_view("chamber_" + str(data.boss).left(10), gate_pos + gate_dir * 26.0 + Vector3.UP * 1.0, at + Vector3.UP * 8.0)
	_view("arena_" + str(data.boss).left(10), gate_pos - gate_dir * 4.0 + Vector3.UP * 1.2, dais_centre + Vector3.UP * 6.0)


## Turns a kit prop's white glow (glyphs, seams, inlays) to this floor's colour.
func _tint_glow(node: Node, colour: Color) -> void:
	if node == null:
		return
	for mesh: MeshInstance3D in node.find_children("*", "MeshInstance3D", true, false):
		for i in mesh.mesh.get_surface_count():
			var mat := mesh.get_surface_override_material(i)
			if mat is StandardMaterial3D and mat.resource_name.begins_with("glow_ffffff"):
				# one tinted copy per colour, shared by every piece that glows that colour
				var key := colour.to_html()
				if not _tinted.has(key):
					var own: StandardMaterial3D = mat.duplicate()
					own.albedo_color = colour * 1.4
					_tinted[key] = own
				mesh.set_surface_override_material(i, _tinted[key])


var _tinted := {}


## A great building's wall, in the kit's stone bays: a lancet window to each bay on every storey (now and then a dark
## one with its shutter hanging off), and a stepped buttress at the corner. The front leaves a gap for the great door.
func _grand_bays(face: Vector3, along: Vector3, yaw: float, half_w: float, storeys: int, side: int, glow: Color) -> void:
	var runs: Array = [[-half_w - 0.6, half_w + 0.6, 0]]
	if side == 2:
		runs = [[-half_w - 0.6, -5.0, 0], [5.0, half_w + 0.6, 0], [-5.0, 5.0, 1]]
	for run: Array in runs:
		var length: float = run[1] - run[0]
		var n := maxi(1, roundi(length / 5.0))
		var w := length / float(n)
		for level in range(int(run[2]), storeys):
			for i in n:
				var x: float = run[0] + w * (float(i) + 0.5)
				var dark := (level + i + side) % 5 == 0
				var bay := kit.prop("grand_wall_bay_dark" if dark else "grand_wall_bay", face + along * x + Vector3.UP * (level * GRAND_STOREY), yaw, 1.0)
				if bay:
					bay.scale = Vector3(w / 5.0, 1.0, 1.0)
					if not dark:
						_tint_glow(bay, glow)
	for level in storeys:
		kit.prop("grand_buttress", face + along * (half_w + 0.6) + Vector3.UP * (level * GRAND_STOREY), yaw, 1.0)



## The quest that ends in a chamber. Every chamber opens its own way (its "unlock" in data/chambers.json, or for a camp
## boss's chamber one picked by floor), and the door stays sealed until every step but the boss is done:
##   sigils   take sigils from the boss's followers, then find the old key-keeper's cache
##   keys     three keys, hidden at three places near the chamber
##   switches three levers set into the chamber's outside wall
##   password a note with the password somewhere near; say it at the door
##   bell     ring the bell on the nearest high place; the door answers it
##   trap     no seal and no warning: a job on the notice board sends you in to fetch something
const UNLOCKS := ["sigils", "switches", "keys", "password", "bell"]
## Jobs for the hub's notice board (QuestLines puts the board up): trap chambers' lures go here.
var board_quests: Array = []


func _chamber_quest(chamber: BossChamber, data: Dictionary, gate: Vector3, grand: bool) -> void:
	var boss := str(data.boss)
	var id := "chamber_" + boss
	var mob_kinds: Array = data.mob if data.mob is Array else [data.mob]
	var mob := str(mob_kinds[0])
	var mob_name := str(Data.monsters.monsters.get(mob, {}).get("name", FloorWorld.UNDERCITY_NAMES.get(mob, mob.capitalize())))
	var boss_name := str(Data.monsters.monsters.get(boss, {}).get("name", FloorWorld.UNDERCITY_NAMES.get(boss, boss.capitalize())))
	var room := str(data.get("name", ""))
	var unlock: String = data.get("unlock", UNLOCKS[(kit.floor_number + (0 if grand else 1 + chambers.size())) % UNLOCKS.size()])
	var places := _named_near(gate, 3)
	var n := 8 if grand else 5
	var steps: Array = []
	var desc := ""
	var door_note := ""
	grand = grand or data.get("grand_quest", false)
	var reward := { "xp": (600 if grand else 300) * kit.floor_number, "gold": (200 if grand else 90) * kit.floor_number, "flags": [id + "_done"] }
	match unlock:
		"trap":
			var lure: Dictionary = data.get("lure", {})
			var bait := chamber.dais_spot()
			kit.prop("loot_chest", bait, 0.0, 0.8)
			kit.interactables.append({ "pos": bait, "r": 3.0, "text": "Press E: %s" % lure.get("say", "take it"), "act": ["flag:%s_bait" % id], "step": [id, 0] })
			steps = [{ "t": "flag", "flag": id + "_bait", "label": str(lure.get("label", "Fetch it from %s" % room)) },
				{ "t": "boss", "kind": boss, "label": "Survive %s" % boss_name }]
			Story.quests_def[id] = { "name": str(lure.get("name", room)), "giver": "", "auto": true, "main": false, "desc": str(lure.get("desc", "")),
				"obj": steps, "reward": reward, "floor": kit.floor_number }
			board_quests.append(id)
			chamber.trap = true
			return
		"sigils":
			steps = [{ "t": "kill", "family": mob, "n": n, "label": "Take sigils from %d %s" % [n, mob_name] },
				_find_step(id, 1, places[0], "search the old key-keeper's cache", "Find the key-keeper's cache at %s" % places[0].name)]
			desc = "%s is sealed with %d sigils. %s's followers carry them, and someone before you hid the rest at %s." % [room, n, boss_name, places[0].name]
			door_note = "THE SIGILS ARE ON ITS PEOPLE. THE REST ARE AT %s." % str(places[0].name).to_upper()
		"keys":
			for i in 3:
				steps.append(_find_step(id, i, places[i], "pick up the key", "Find the key at %s" % places[i].name))
			desc = "%s has three locks. The last contestant who got out alive hid the keys: at %s, %s and %s." % [room, places[0].name, places[1].name, places[2].name]
			door_note = "THREE KEYS. %s, %s, %s. GOOD LUCK." % [str(places[0].name).to_upper(), str(places[1].name).to_upper(), str(places[2].name).to_upper()]
		"switches":
			var centre := chamber.position
			for i in 3:
				var a := TAU * (float(i) + 0.5) / 3.0
				var at := Vector3(centre.x, 0, centre.z) + Vector3(cos(a), 0, sin(a)) * (chamber.half + 13.0)
				steps.append(_find_step(id, i, { "name": "the wall", "pos": at }, "pull the lever", "Pull the lever on the chamber wall (%d of 3)" % (i + 1), "crate_stack"))
			desc = "%s's door is worked by three levers set into its outside wall. They're stiff and loud, and everything nearby will hear them." % room
			door_note = "THREE LEVERS, ALL THE WAY ROUND. PULL THEM ALL."
		"password":
			steps = [_find_step(id, 0, places[0], "read the scrawled note", "Find the password near %s" % places[0].name),
				{ "t": "flag", "flag": id + "_said", "label": "Say the password at the door of %s" % room }]
			desc = "%s opens to a spoken word. Someone wrote it down near %s, because nobody can remember it under pressure." % [room, places[0].name]
			door_note = "IT OPENS TO A WORD. THE WORD IS NEAR %s." % str(places[0].name).to_upper()
		"bell":
			var high: Dictionary = _named_near(gate, 1, ["summit", "tower", "lookout"])[0]
			steps = [{ "t": "kill", "family": mob, "n": n, "label": "Clear %d %s from the way up" % [n, mob_name] },
				_find_step(id, 1, high, "ring the bell", "Ring the bell at %s" % high.name, "camp_banner")]
			desc = "%s only opens when the old bell rings. The bell is up at %s, and %s's people are in the way." % [room, high.name, boss_name]
			door_note = "THE BELL AT %s. RING IT AND RUN BACK." % str(high.name).to_upper()
	if data.has("step2"):
		(steps[steps.size() - 1] as Dictionary).label = str(data.step2)
	steps.append({ "t": "boss", "kind": boss, "label": "Defeat %s in %s" % [boss_name, room] })
	Story.quests_def[id] = { "name": room, "giver": "", "auto": true, "main": grand, "desc": desc, "obj": steps, "reward": reward, "floor": kit.floor_number }
	chamber.seal(id)
	var talk := "gate_" + boss
	var choices: Array = [{ "text": "I mean it.", "if": "not started('%s')" % id, "do": ["start:" + id, "lore:%d" % clampi((kit.floor_number + 2) / 3, 1, 6)] }]
	if unlock == "password":
		choices.append({ "text": "Say the password.", "if": "started('%s') and flag('qs_%s_0')" % [id, id], "do": ["flag:%s_said" % id, "notice:The glyphs flare. Something heavy moves behind the door."] })
	choices.append({ "text": "Leave." })
	Story.dialogue[talk] = { "name": room, "start": [
		{ "if": "done('%s')" % id, "go": "done" }, { "go": "first" }], "nodes": {
		"first": { "text": "A door of black stone, taller than a house, carved with the Builders' mark. Its seals glow when you come close. Scratched into the frame, in a contestant's hand: \"%s DON'T COME IN UNLESS YOU MEAN IT.\"" % door_note, "choices": choices },
		"done": { "text": "The door stands open. The room beyond is quiet now.", "choices": [{ "text": "Leave." }] } } }
	kit.interactables.append({ "pos": gate, "r": 7.0, "text": "", "talk": talk, "say": "examine the sealed door of %s" % room })
	# a camp boss's empty throne points the way too
	if data.has("camp_name"):
		for item: Dictionary in kit.interactables:
			if str(item.get("text", "")).begins_with("The boss's place is empty"):
				for c: Dictionary in kit.data.get("camps", []):
					if c.name == data.camp_name and Vector2(item.pos.x - c.x, item.pos.z - c.z).length() < 12.0:
						item.act = ["start:" + id]
						item.once = true


## Something to pick up or use for a chamber's quest, only there while that step is the one you're on.
func _find_step(id: String, i: int, place: Dictionary, say: String, label: String, prop_name := "loot_chest") -> Dictionary:
	var a := float(i) * 2.3 + float(kit.floor_number)
	var at: Vector3 = place.pos + (Vector3(cos(a), 0, sin(a)) * 5.0 if place.name != "the wall" else Vector3.ZERO)
	kit.prop(prop_name, at, a, 0.8)
	kit.interactables.append({ "pos": at, "r": 3.0, "text": "Press E: " + say, "act": ["flag:qs_%s_%d" % [id, i]], "step": [id, i] })
	return { "t": "flag", "flag": "qs_%s_%d" % [id, i], "label": label }


## The named places nearest a spot, nearest first: { name, pos }.
func _named_near(from: Vector3, count: int, kinds := ["outpost", "poi", "summit", "tower", "grand", "lookout", "shrine", "wreck", "hideout"]) -> Array:
	var found: Array = []
	for pt: Dictionary in kit.points:
		if pt.kind in kinds:
			var d := Vector2(pt.x - from.x, pt.z - from.z).length()
			if d > 30.0:
				found.append({ "name": str(pt.name), "pos": Vector3(pt.x, 0, pt.z), "d": d })
	found.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return a.d < b.d)
	if found.is_empty():
		found.append({ "name": str(kit.data.get("hub_name", "the town")), "pos": kit.spawn + Vector3(8, 0, 8), "d": 0.0 })
	while found.size() < count:
		found.append(found[found.size() - 1])
	return found.slice(0, maxi(count, 1))


# ---------------------------------------------------------------- the open floors: mountain villages and forests
const VILLAGE_NAMES := ["Crow's Rest", "Hollowtop", "Gallowmere", "Ashcrag", "Wolfsteeth", "Nettlebarrow", "Grimwold", "Saint Ruin",
	"Blackmoss", "Thornhollow", "Witchdown", "Lanternfall", "Cold Harbour", "Bonepike", "Mourning Ledge", "Highgrave"]
## What the forests are made of, floor by floor.
const FOREST := {
	4: ["plant", "tree"], 5: ["suburb_tree", "tree"], 6: ["jungle_tree", "giant_trunk", "big_toadstool"], 7: ["hill_dead_tree", "mushroom"],
	8: ["big_toadstool", "mushroom", "hill_dead_tree"], 9: ["hill_dead_tree", "tree"], 10: ["tree", "hill_dead_tree"], 11: ["tree", "suburb_tree"],
	12: ["hill_dead_tree", "tree"], 13: ["hill_dead_tree", "tree"], 14: ["hill_dead_tree", "dead_bush"], 15: ["crystal", "hill_dead_tree"],
	16: ["hill_dead_tree", "rock_pillar"], 17: ["suburb_tree", "tree"], 18: ["rock_pillar", "crystal"],
}
var villages_built := 0


func _open_world() -> void:
	if kit.terrain == null or not kit.terrain.open:
		return
	for pad: Array in kit.terrain.pads:
		_mountain_village(pad[0], pad[1])
	_forests()
	print("OPEN floor %d: peak %.0f m, %d summits, %d rivers, %d villages %s, %d trees" % [kit.floor_number, kit.terrain.peak, kit.terrain.summits.size(), kit.terrain.rivers.size(), kit.terrain.pads.size(), str(kit.terrain.pads.map(func(p: Array) -> String: return "%.0f,%.0f,%.0f" % [p[0].x, p[0].y, p[0].z])), _forest_count])


## A village clinging to a shelf high on a mountain: houses round a fire, all of them dark, most with something left
## behind inside worth taking. One of them still keeps the lamp lit.
func _mountain_village(shelf: Vector3, radius: float) -> void:
	# everything below is placed relative to the ground, which lifts it onto the shelf; only the buildings, which are put
	# together off the terrain, need the shelf's height itself
	var at := Vector3(shelf.x, 0, shelf.z)
	var name_i := (kit.floor_number * 3 + villages_built) % VILLAGE_NAMES.size()
	var village_name: String = VILLAGE_NAMES[name_i]
	villages_built += 1
	var houses := _rng.randi_range(4, 6)
	var saved_terrain := kit.terrain
	for i in houses:
		var a := TAU * float(i) / float(houses) + _rng.randf_range(-0.2, 0.2)
		var spot := at + Vector3(cos(a), 0, sin(a)) * (radius - 9.0)
		# facing the fire in the middle
		var yaw := atan2(at.x - spot.x, at.z - spot.z)
		var lit := i == 0
		var cfg := { "kind": "ruin", "x": spot.x, "y": kit.ground(spot.x, spot.z), "z": spot.z, "yaw": yaw,
			"w": _rng.randf_range(8.0, 10.0), "d": _rng.randf_range(7.0, 9.0), "h": _rng.randf_range(4.2, 5.6),
			"name": "%s %s" % [village_name, ["Inn", "House", "Cottage", "Hall", "Lodge", "Barn"][i % 6]], "facade": "facade_a" }
		# buildings are put together in their own space; the shelf is already level, so nothing inside needs lifting
		kit.terrain = null
		Building.build(kit, cfg, kit._look if lit else kit.ruin_look())
		kit.terrain = saved_terrain
		_note_solid(spot, 7.0)
		# something left behind in every house: a chest at the back of the room
		var forward := Vector3(sin(yaw), 0, cos(yaw))
		var chest := spot - forward * (float(cfg.d) * 0.3)
		kit.prop("loot_chest", chest, yaw, 1.0)
		var level := kit.floor_number * 9
		kit.interactables.append({ "pos": chest + forward * 1.0, "r": 2.2, "text": "Press E: open the chest",
			"after": "Empty. Somebody beat you to it. It was you.",
			"act": ["xp:%d" % (40 + level * 6), "gold:%d" % (20 + level * 3), "notice:%s · Whatever the people here left behind is yours now." % village_name.to_upper()] })
	kit.prop("bonfire", at, 0.0, 1.2)
	_flicker(_light("#ffa860", 2.4, 22.0, at + Vector3.UP * 2.0, false), "candle")
	for k in 3:
		var a := TAU * float(k) / 3.0 + 0.5
		kit.prop("lamp_post", at + Vector3(cos(a), 0, sin(a)) * (radius - 3.0), a)
	kit.prop("well", at + Vector3(6, 0, -5), 0.4)
	kit.prop("camp_banner", at + Vector3(-5, 0, 6), 1.1)
	_post_sign_text(village_name, at + Vector3(0, 0, radius - 2.0))
	_note_solid(at, radius)
	_bare.append(Vector3(at.x, at.z, radius))
	kit.points.append({ "kind": "village", "name": village_name, "x": at.x, "z": at.z, "level": kit.floor_number * 9 })
	# the view is taken from the slope below the shelf, looking up at the village
	var from := at + Vector3(0, 0, radius + 34.0)
	_view("village_%d" % villages_built, from + Vector3.UP * (kit.ground(from.x, from.z) + 2.0), at + Vector3.UP * (shelf.y + 4.0))


## Forests: the open land is patched with woods so thick you can't see through them, each floor its own kind of tree.
func _forests() -> void:
	var kinds: Array = FOREST.get(kit.floor_number, ["tree"])
	var have: Array = kinds.filter(func(k: String) -> bool: return _prop_exists(k))
	if have.is_empty():
		return
	var mask := FastNoiseLite.new()
	mask.seed = 5150 + kit.floor_number
	mask.frequency = 0.0045
	var half: float = kit.world_size / 2.0 - 40.0
	var step := 9.0
	var x := -half
	var planted := 0
	while x < half:
		var z := -half
		while z < half:
			var px := x + _rng.randf_range(-3.5, 3.5)
			var pz := z + _rng.randf_range(-3.5, 3.5)
			var m := mask.get_noise_2d(px, pz)
			if m > 0.22:
				var h := kit.ground(px, pz)
				if h > 2.5 and h < kit.terrain.peak * 0.62 and _is_open(px, pz, 3.0):
					var kind: String = have[_rng.randi() % have.size()]
					_batched(kind, Vector3(px, 0, pz), _rng.randf() * TAU, _rng.randf_range(0.9, 1.6) * (1.0 + (m - 0.22)), Vector3(0.4, 3.0, 0.4))
					planted += 1
			z += step
		x += step
	_forest_count = planted


var _forest_count := 0


## The nearest point from `at` towards `toward` where the ground's gentle enough to stand on (under about 1 m of rise
## across 5 m), or `at` itself if there are no hills.
func _standable(at: Vector3, toward: Vector3) -> Vector3:
	if kit.terrain == null:
		return at
	var dir := (toward - at)
	dir.y = 0.0
	var reach := dir.length()
	dir = dir.normalized()
	var d := 0.0
	while d < reach * 0.4:
		var p := at + dir * d
		var lo := INF
		var hi := -INF
		for o: Vector2 in [Vector2.ZERO, Vector2(2.5, 0), Vector2(-2.5, 0), Vector2(0, 2.5), Vector2(0, -2.5)]:
			var h: float = kit.ground(p.x + o.x, p.z + o.y)
			lo = minf(lo, h)
			hi = maxf(hi, h)
		if hi - lo < 1.0:
			return p
		d += 3.0
	return at
