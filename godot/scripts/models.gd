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
	_convert(model, path.contains("/characters/"))
	return model


## A solid body for a character the size of what's actually there, so nobody can walk into them and see inside.
static func body_for(model: Node3D) -> CollisionShape3D:
	var box := AABB()
	var first := true
	for mesh: MeshInstance3D in model.find_children("*", "MeshInstance3D", true, false):
		var b: AABB = mesh.get_aabb()
		var to_model := model.global_transform.affine_inverse() * mesh.global_transform if mesh.is_inside_tree() else mesh.transform
		b = to_model * b
		box = b if first else box.merge(b)
		first = false
	var scale_by := model.scale.x
	var shape := CapsuleShape3D.new()
	var half := Vector2(box.size.x, box.size.z) * scale_by * 0.5
	# arms out in a T-pose make a model much wider than its body, so the depth counts more than the width
	shape.radius = clampf(minf(half.x * 0.7, maxf(half.y, half.x * 0.45)), 0.3, 2.5)
	shape.height = maxf(box.size.y * scale_by, shape.radius * 2.0 + 0.1)
	var body := CollisionShape3D.new()
	body.shape = shape
	body.position = model.position + Vector3.UP * shape.height / 2.0
	return body


## The rigged version of a character if there is one, so it can move.
## How tall a model is, in its own units (before its scale).
static func height_of(model: Node3D) -> float:
	var top := -INF
	var low := INF
	for mesh: MeshInstance3D in model.find_children("*", "MeshInstance3D", true, false):
		var to_model := model.global_transform.affine_inverse() * mesh.global_transform if mesh.is_inside_tree() else mesh.transform
		var b: AABB = to_model * mesh.get_aabb()
		top = maxf(top, b.end.y)
		low = minf(low, b.position.y)
	return maxf(0.01, top - low) / maxf(model.scale.y, 0.001)


## People are sized for a player whose eyes are 1.7 m up: a little bigger than their files, and no one so small
## that you're looking down on the top of their head.
static func people_scale(model: Node3D) -> float:
	var h := height_of(model)
	return maxf(h * 1.1, 1.55) / h


static func rigged(path: String) -> String:
	var moving := path.replace("/characters/", "/characters/rigged/")
	return moving if moving != path and ResourceLoader.exists(moving) else path


## Starts a character breathing, at a random point in the clip so a crowd doesn't move as one, and gives it a Life
## that keeps it fidgeting (and that combat drives). Fierce ones are monsters.
static func bring_to_life(model: Node, clip := "idle", fierce := false) -> void:
	if model is Node3D:
		Life.attach(model, fierce)
	var found := model.find_children("*", "AnimationPlayer", true, false)
	if found.is_empty():
		return
	var player: AnimationPlayer = found[0]
	for looping: String in ["idle", "walk", "run", "talk"]:
		# with more than one talking clip, they take turns instead of one looping (Life swaps them)
		if looping == "talk" and player.has_animation("talk2"):
			continue
		if player.has_animation(looping):
			player.get_animation(looping).loop_mode = Animation.LOOP_LINEAR
	if player.has_animation(clip):
		player.play(clip)
		player.seek(randf() * player.current_animation_length, true)
		player.speed_scale = randf_range(0.85, 1.15)


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


## Characters keep the paintwork Tripo gave them: only a touch of the comic paint overlay, and no floor grime on their legs.
static func _convert(node: Node, character := false) -> void:
	if node is MeshInstance3D and node.mesh:
		for i in node.mesh.get_surface_count():
			var source := node.mesh.surface_get_material(i) as BaseMaterial3D
			if source:
				node.set_surface_override_material(i, _converted_material(source, character))
	for child in node.get_children():
		_convert(child, character)


static func _converted_material(source: BaseMaterial3D, character := false) -> Material:
	if _converted.has(source):
		return _converted[source]
	var result: Material
	if source.resource_name.begins_with("glow_") or source.shading_mode == BaseMaterial3D.SHADING_MODE_UNSHADED:
		var glow := StandardMaterial3D.new()
		glow.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		glow.albedo_color = source.albedo_color * (1.6 if source.resource_name.begins_with("glow_") else 1.0)
		glow.albedo_texture = source.albedo_texture
		glow.vertex_color_use_as_albedo = true
		glow.resource_name = source.resource_name
		result = glow
	else:
		var mat := toon(source.albedo_color, source.albedo_texture, Vector2(source.uv1_scale.x, source.uv1_scale.y), 0.15 if character else 1.0)
		if character:
			mat.set_shader_parameter("grime_height", -1.0)
		mat.set_shader_parameter("uv_offset", Vector2(source.uv1_offset.x, source.uv1_offset.y))
		result = mat
	_converted[source] = result
	return result
