class_name Models
## Loads models and gives them the game's comic shading. Materials named glow_* stay unlit, so lamps keep shining.

const TOON_SHADER := preload("res://shaders/toon.gdshader")
const PAINT := preload("res://textures/landing/paint_overlay.png")

static var _converted := {}


static func instantiate(path: String) -> Node3D:
	var packed := load(path) as PackedScene
	if packed == null:
		push_error("Model missing: " + path)
		return null
	var model := packed.instantiate() as Node3D
	_convert(model)
	return model


## A comic material. Set paint below 1.0 where a texture already has its own painted detail.
static func toon(color: Color, texture: Texture2D = null, uv_scale := Vector2.ONE, paint := 1.0) -> ShaderMaterial:
	var mat := ShaderMaterial.new()
	mat.shader = TOON_SHADER
	mat.set_shader_parameter("albedo", color)
	mat.set_shader_parameter("uv_scale", uv_scale)
	mat.set_shader_parameter("paint_tex", PAINT)
	mat.set_shader_parameter("paint_strength", paint)
	if texture:
		mat.set_shader_parameter("albedo_tex", texture)
	return mat


## One prop as a single mesh with comic materials baked in, for drawing hundreds of copies as one batch.
static func batch_mesh(path: String) -> Mesh:
	var model := instantiate(path)
	if model == null:
		return null
	var source := _first_mesh(model)
	var result: ArrayMesh = source.mesh.duplicate()
	for i in result.get_surface_count():
		var mat := source.get_surface_override_material(i)
		if mat:
			result.surface_set_material(i, mat)
	model.free()
	return result


static func _first_mesh(node: Node) -> MeshInstance3D:
	if node is MeshInstance3D:
		return node
	for child in node.get_children():
		var found := _first_mesh(child)
		if found:
			return found
	return null


static func _convert(node: Node) -> void:
	if node is MeshInstance3D and node.mesh:
		for i in node.mesh.get_surface_count():
			var source := node.mesh.surface_get_material(i) as BaseMaterial3D
			if source:
				node.set_surface_override_material(i, _converted_material(source))
	for child in node.get_children():
		_convert(child)


static func _converted_material(source: BaseMaterial3D) -> Material:
	if _converted.has(source):
		return _converted[source]
	var result: Material
	if source.resource_name.begins_with("glow_") or source.shading_mode == BaseMaterial3D.SHADING_MODE_UNSHADED:
		var glow := StandardMaterial3D.new()
		glow.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		glow.albedo_color = source.albedo_color * (1.6 if source.resource_name.begins_with("glow_") else 1.0)
		glow.albedo_texture = source.albedo_texture
		glow.vertex_color_use_as_albedo = true
		result = glow
	else:
		var mat := toon(source.albedo_color, source.albedo_texture, Vector2(source.uv1_scale.x, source.uv1_scale.y))
		mat.set_shader_parameter("uv_offset", Vector2(source.uv1_offset.x, source.uv1_offset.y))
		result = mat
	_converted[source] = result
	return result
