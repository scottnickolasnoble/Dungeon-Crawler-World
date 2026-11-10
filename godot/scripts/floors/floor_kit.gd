class_name FloorKit
extends Node3D
## Building blocks shared by the floors and towns. Everything is added to `root`, with collisions on `body`,
## so a building can set those to its own node and work in local coordinates.

const TOWN_PROPS := "res://models/props/town/%s.glb"
const LANDING_PROPS := "res://models/props/landing/%s.glb"
const WILDS_PROPS := "res://models/props/wilds/%s.glb"
const FLOOR_TEX := "res://textures/floors/f%d_%s.png"
const SIGN_TEX := "res://textures/signs/%s.png"

## Anything the player can walk up to: { pos, r, text, to (optional floor to travel to) }.
var interactables: Array[Dictionary] = []
## Every doorway, for tests and teleporting: { name, outside, inside }.
var doors: Array[Dictionary] = []
var floor_number := 0
## Beyond this, clutter stops drawing. Each floor sets it from how far its fog lets you see.
var draw_distance := 160.0
var root: Node3D
var body: StaticBody3D

## The hills, on floors that have them. Until it's made, the ground is flat everywhere.
var terrain: Terrain
## Where things were built before the hills were made, so the hills leave that land flat.
var footprints: Array[Rect2] = []
## Small things placed while the floor was flat; they're lifted onto the hills once the hills exist.
var late_lift: Array[Node3D] = []
var _surfaces := {}
var _mesh_cache := {}


func begin_kit() -> void:
	root = self
	body = StaticBody3D.new()
	body.name = "Colliders"
	add_child(body)


## Most windows are just windows. `scare` is the chance of one that isn't.
func any_window(scare: float) -> String:
	if randf() >= scare:
		return "window"
	return ["window_figure", "window_faces", "window_boarded", "window_broken", "window_bloody"].pick_random()


func tex(path: String) -> Texture2D:
	return load(path) if ResourceLoader.exists(path) else null


func surface_tex(texture_name: String) -> Texture2D:
	return tex(FLOOR_TEX % [floor_number, texture_name])


## A surface whose texture repeats every `tile` metres, so it stays the right scale at any size.
func surface(texture_name: String, size: Vector2, tile: float, paint := 0.35) -> ShaderMaterial:
	var key := "%s/%.2f/%.2f/%.2f/%.2f" % [texture_name, size.x, size.y, tile, paint]
	if not _surfaces.has(key):
		_surfaces[key] = Models.toon(Color.WHITE, surface_tex(texture_name), size / tile, paint)
	return _surfaces[key]


func flat(color: Color, paint := 1.0) -> ShaderMaterial:
	var key := "flat/%s/%.2f" % [color.to_html(), paint]
	if not _surfaces.has(key):
		_surfaces[key] = Models.toon(color, null, Vector2.ONE, paint)
	return _surfaces[key]


func unshaded(color: Color, texture: Texture2D = null, cut_out := false) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = color
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	mat.disable_fog = false
	if texture:
		mat.albedo_texture = texture
		mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	if cut_out:
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
		mat.alpha_scissor_threshold = 0.5
	return mat


## How high the ground is here.
func ground(x: float, z: float) -> float:
	return terrain.height(x, z) if terrain else 0.0


## A position moved up onto the ground (things underground, in caves and loot rooms, stay where they are).
func lift(pos: Vector3) -> Vector3:
	if terrain == null or pos.y < -20.0:
		return pos
	return pos + Vector3.UP * terrain.height(pos.x, pos.z)


## Remembers built land while the floor is still flat, so the hills will go around it.
## Big things (buildings, walls, roads) keep their land flat; small ones are simply lifted later.
func _footprint(pos: Vector3, half_x: float, half_z: float, node: Node3D = null) -> void:
	if terrain != null or pos.y < -20.0:
		return
	if maxf(half_x, half_z) < 3.0 or pos.y >= 6.0:
		if node:
			late_lift.append(node)
		return
	# not the whole-floor ground plane itself (roads that cross the floor do count)
	if half_x < 125.0 or half_z < 125.0:
		footprints.append(Rect2(pos.x - half_x, pos.z - half_z, half_x * 2.0, half_z * 2.0))


## Moves everything small that was placed on flat ground up onto the hills, once they're made.
func lift_late() -> void:
	for node: Node3D in late_lift:
		if is_instance_valid(node):
			node.position.y += terrain.height(node.position.x, node.position.z)
	late_lift.clear()


## True where the ground is level enough to build on (always, before the hills exist).
func level_ground(x: float, z: float, radius: float) -> bool:
	return terrain == null or terrain.highest_near(x, z, radius) < 0.6


func prop(prop_name: String, pos: Vector3, yaw := 0.0, scale_by := 1.0, collide_half := Vector3.ZERO) -> Node3D:
	var path := WILDS_PROPS % prop_name
	if not ResourceLoader.exists(path):
		path = TOWN_PROPS % prop_name
	if not ResourceLoader.exists(path):
		path = LANDING_PROPS % prop_name
	# props still waiting for their model (art/TRIPO_PLAN.md) just aren't there yet
	if not ResourceLoader.exists(path):
		return null
	var model := Models.instantiate(path)
	if model == null:
		return null
	model.position = lift(pos)
	model.rotation.y = yaw
	model.scale = Vector3.ONE * scale_by
	root.add_child(model)
	_limit_draw(model)
	var reach := maxf(maxf(collide_half.x, collide_half.z), 1.5) * scale_by
	_footprint(pos, reach, reach, model)
	if collide_half != Vector3.ZERO:
		box_collider(pos + Vector3.UP * collide_half.y, collide_half, yaw)
	return model


func _limit_draw(node: Node) -> void:
	if node is GeometryInstance3D:
		node.visibility_range_end = draw_distance
		node.visibility_range_end_margin = 6.0
	for child in node.get_children():
		_limit_draw(child)


## A character standing still. Their AI and animation come later; if the file isn't there, they're skipped.
func person(path: String, pos: Vector3, yaw := 0.0, scale_by := 1.0) -> Node3D:
	path = Models.rigged(path)
	if not ResourceLoader.exists(path):
		return null
	var model := Models.instantiate(path)
	model.position = lift(pos)
	_footprint(pos, 1.2, 1.2, model)
	model.rotation.y = yaw
	var fierce := path.contains("/monsters/") or _is_monster(path)
	# no two monsters of a kind quite the same size
	model.scale = Vector3.ONE * scale_by * (randf_range(0.88, 1.14) if fierce else 1.0)
	root.add_child(model)
	if not fierce:
		model.scale *= Models.people_scale(model)
		if path.contains("_townsperson"):
			model.add_to_group("race_npc")
			model.set_meta("race", path.get_file().get_basename().trim_suffix("_townsperson"))
	_limit_draw(model)
	Models.bring_to_life(model, "idle", fierce)
	body.add_child(Models.body_for(model))
	return model


## Overridden by floors that know their monsters.
func _is_monster(_path: String) -> bool:
	return false


func mesh_node(mesh: Mesh, mat: Material, pos: Vector3, rot := Vector3.ZERO) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.mesh = mesh
	node.material_override = mat
	node.position = lift(pos)
	if terrain == null and mesh:
		var box := mesh.get_aabb()
		if absf(rot.y) < 0.01:
			_footprint(pos, box.size.x / 2.0, box.size.z / 2.0, node)
		else:
			var reach := maxf(box.size.x, box.size.z) / 2.0
			_footprint(pos, reach, reach, node)
	node.rotation = rot
	root.add_child(node)
	return node


func quad(size: Vector2, mat: Material, pos: Vector3, rot := Vector3.ZERO) -> MeshInstance3D:
	var key := "q/%.2f/%.2f" % [size.x, size.y]
	if not _mesh_cache.has(key):
		var mesh := QuadMesh.new()
		mesh.size = size
		_mesh_cache[key] = mesh
	var node := mesh_node(_mesh_cache[key], mat, pos, rot)
	node.visibility_range_end = draw_distance * 1.2
	return node


func plane(size: Vector2, mat: Material, pos: Vector3) -> MeshInstance3D:
	var mesh := PlaneMesh.new()
	mesh.size = size
	return mesh_node(mesh, mat, pos)


func block(size: Vector3, mat: Material, pos: Vector3, yaw := 0.0) -> MeshInstance3D:
	var key := "b/%.2f/%.2f/%.2f" % [size.x, size.y, size.z]
	if not _mesh_cache.has(key):
		var mesh := BoxMesh.new()
		mesh.size = size
		_mesh_cache[key] = mesh
	var node := mesh_node(_mesh_cache[key], mat, pos, Vector3(0, yaw, 0))
	node.visibility_range_end = draw_distance * 1.2
	return node


func box_collider(pos: Vector3, half: Vector3, yaw := 0.0) -> void:
	var shape := BoxShape3D.new()
	shape.size = half * 2.0
	var c := CollisionShape3D.new()
	c.shape = shape
	c.position = lift(pos)
	c.rotation.y = yaw
	body.add_child(c)
	var reach := maxf(half.x, half.z)
	_footprint(pos, reach, reach, c)


func lamp(color: Color, energy: float, reach: float, pos: Vector3, shadows := false) -> OmniLight3D:
	var light := OmniLight3D.new()
	light.light_color = color
	light.light_energy = energy
	light.omni_range = reach
	light.omni_attenuation = 0.5
	light.position = lift(pos)
	_footprint(pos, 0.0, 0.0, light)
	light.shadow_enabled = shadows
	light.shadow_bias = 0.06
	light.distance_fade_enabled = true
	light.distance_fade_begin = minf(70.0, draw_distance * 0.7)
	light.distance_fade_length = 20.0
	root.add_child(light)
	return light


## A painted board with a dark backing, readable from the front. Add a second for the other side.
func board(texture_name: String, w: float, h: float, pos: Vector3, yaw := 0.0) -> void:
	block(Vector3(w + 0.14, h + 0.14, 0.14), flat(Color("#25232c"), 0.6), pos, yaw)
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	quad(Vector2(w, h), unshaded(Color(0.92, 0.92, 0.92), tex(SIGN_TEX % texture_name)), pos + forward * 0.08, Vector3(0, yaw, 0))
	quad(Vector2(w, h), unshaded(Color(0.92, 0.92, 0.92), tex(SIGN_TEX % texture_name)), pos - forward * 0.08, Vector3(0, yaw + PI, 0))



## A storybook tower: a round stone drum with a lit window or two, a tall pointed slate roof, an iron finial and a
## pennant. Towns and castles from Floor 3 down are full of them.
func storybook_tower(at: Vector3, radius: float, height: float, stone: Material, roof_colour := "#2e3440", glow := "#ffcf8a") -> void:
	var drum := CylinderMesh.new()
	drum.top_radius = radius
	drum.bottom_radius = radius * 1.08
	drum.height = height
	drum.radial_segments = 16
	mesh_node(drum, stone, at + Vector3.UP * height / 2.0).visibility_range_end = draw_distance * 1.6
	box_collider(at + Vector3.UP * height / 2.0, Vector3(radius * 0.75, height / 2.0, radius * 0.75))
	var band := CylinderMesh.new()
	band.top_radius = radius + 0.3
	band.bottom_radius = radius + 0.3
	band.height = 0.6
	band.radial_segments = 16
	mesh_node(band, flat(Color("#4a3020")), at + Vector3.UP * (height - 0.3))
	var cone := CylinderMesh.new()
	cone.top_radius = 0.0
	cone.bottom_radius = radius + 1.0
	cone.height = (radius + 1.0) * 2.8
	cone.radial_segments = 20
	mesh_node(cone, flat(Color(roof_colour)), at + Vector3.UP * (height + cone.height / 2.0)).visibility_range_end = 0.0
	var spike := CylinderMesh.new()
	spike.top_radius = 0.0
	spike.bottom_radius = 0.12
	spike.height = 1.8
	mesh_node(spike, flat(Color("#1a1a20")), at + Vector3.UP * (height + cone.height + 0.9))
	block(Vector3(0.05, 0.5, 1.2), flat(Color("#8a1a1a")), at + Vector3(0, height + cone.height + 1.4, 0.6))
	# a lit window, high up, and sometimes a second one lower down
	var glow_mat := unshaded(Color(glow))
	for k in 2:
		var a := float(at.x + at.z) * 0.37 + k * 2.1
		var out := Vector3(sin(a), 0, cos(a))
		if k == 1 and int(absf(at.x)) % 2 == 0:
			continue
		quad(Vector2(0.9, 1.5), glow_mat, at + out * (radius * 1.04 + 0.02) + Vector3.UP * (height * (0.78 - k * 0.35)), Vector3(0, a, 0))
