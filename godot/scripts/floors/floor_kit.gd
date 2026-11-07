class_name FloorKit
extends Node3D
## Building blocks shared by the floors and towns. Everything is added to `root`, with collisions on `body`,
## so a building can set those to its own node and work in local coordinates.

const TOWN_PROPS := "res://models/props/town/%s.glb"
const LANDING_PROPS := "res://models/props/landing/%s.glb"
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

var _surfaces := {}
var _mesh_cache := {}


func begin_kit() -> void:
	root = self
	body = StaticBody3D.new()
	body.name = "Colliders"
	add_child(body)


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


func prop(prop_name: String, pos: Vector3, yaw := 0.0, scale_by := 1.0, collide_half := Vector3.ZERO) -> Node3D:
	var path := TOWN_PROPS % prop_name
	if not ResourceLoader.exists(path):
		path = LANDING_PROPS % prop_name
	var model := Models.instantiate(path)
	if model == null:
		return null
	model.position = pos
	model.rotation.y = yaw
	model.scale = Vector3.ONE * scale_by
	root.add_child(model)
	_limit_draw(model)
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
	if not ResourceLoader.exists(path):
		return null
	var model := Models.instantiate(path)
	model.position = pos
	model.rotation.y = yaw
	model.scale = Vector3.ONE * scale_by
	root.add_child(model)
	_limit_draw(model)
	var shape := CylinderShape3D.new()
	shape.radius = 0.45
	shape.height = 2.0
	var c := CollisionShape3D.new()
	c.shape = shape
	c.position = pos + Vector3.UP
	body.add_child(c)
	return model


func mesh_node(mesh: Mesh, mat: Material, pos: Vector3, rot := Vector3.ZERO) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.mesh = mesh
	node.material_override = mat
	node.position = pos
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
	c.position = pos
	c.rotation.y = yaw
	body.add_child(c)


func lamp(color: Color, energy: float, reach: float, pos: Vector3, shadows := false) -> OmniLight3D:
	var light := OmniLight3D.new()
	light.light_color = color
	light.light_energy = energy
	light.omni_range = reach
	light.omni_attenuation = 0.5
	light.position = pos
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
