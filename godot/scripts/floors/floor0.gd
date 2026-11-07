class_name Floor0
extends Node3D
## FLOOR 0, THE LANDING: the Network's Orientation Centre, seen as a shabby TV-studio lobby.
## The layout and everyone's positions are the prototype's (worlds/floor0.js). The look is the comic redesign:
## props from tools/blender/build_landing_kit.py, textures from tools/paint_landing_textures.mjs.
## Pip, the dummies and the cardboard goblins stand in place for now. Dialog comes in Phase 3 and fighting in Phase 2.

const FLOOR_NAME := "FLOOR 0 · THE LANDING"
const SPAWN := Vector3(0, 0, 56)
const CEILING := 7.0
const WIDTH := 28.0
const LENGTH := 130.0
const HALL_CENTRE_Z := -5.0
const HALF_WIDTH := WIDTH / 2.0
const INNER_WALL := HALF_WIDTH - 0.5
const TEXTURES := "res://textures/landing/%s.png"
const PROPS := "res://models/props/landing/%s.glb"
## Rotations for props that stand against a wall, facing into the hall.
const FACE_EAST := PI / 2.0
const FACE_WEST := -PI / 2.0

var _colliders: StaticBody3D
## Things the player can walk up to: { pos, r, text, to (optional floor to travel to) }.
var interactables: Array[Dictionary] = []


func _ready() -> void:
	_colliders = StaticBody3D.new()
	_colliders.name = "Colliders"
	add_child(_colliders)
	_build_environment()
	_build_shell()
	_build_ceiling_rig()
	_build_arrival()
	_build_columns_and_clutter()
	_build_tvs_and_posters()
	_build_desk()
	_build_fountain()
	_build_training_yard()
	_build_arena()
	_build_exit()
	_place_people()


# ---------------------------------------------------------------- look
func _build_environment() -> void:
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color("#fff0d4")
	sky_mat.sky_horizon_color = Color("#a8947c")
	sky_mat.ground_bottom_color = Color("#5a4a44")
	sky_mat.ground_horizon_color = Color("#a8947c")
	sky_mat.sun_angle_max = 0.0
	var sky := Sky.new()
	sky.sky_material = sky_mat

	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("#1a1820")
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.4
	env.reflected_light_source = Environment.REFLECTION_SOURCE_DISABLED
	env.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	env.ssao_enabled = true
	env.ssao_radius = 1.6
	env.ssao_intensity = 2.4
	env.ssao_power = 1.8
	env.ssao_light_affect = 0.25
	env.fog_enabled = true
	env.fog_mode = Environment.FOG_MODE_DEPTH
	env.fog_light_color = Color("#231d2b")
	env.fog_light_energy = 1.0
	env.fog_sun_scatter = 0.0
	env.fog_depth_begin = 34.0
	env.fog_depth_end = 125.0
	env.fog_depth_curve = 1.0
	var world_env := WorldEnvironment.new()
	world_env.environment = env
	add_child(world_env)


func _build_shell() -> void:
	# The tile texture holds 4 x 4 tiles of 1.5 m each, so it repeats every 6 m.
	var floor_mesh := PlaneMesh.new()
	floor_mesh.size = Vector2(WIDTH, LENGTH)
	_mesh(floor_mesh, Models.toon(Color.WHITE, _tex("floor_tile"), Vector2(WIDTH / 6.0, LENGTH / 6.0), 0.55), Vector3(0, 0, HALL_CENTRE_Z))
	_collider(Vector3(0, -0.5, HALL_CENTRE_Z), Vector3(HALF_WIDTH + 2.0, 0.5, LENGTH / 2.0 + 2.0))

	var ceiling_mesh := PlaneMesh.new()
	ceiling_mesh.size = Vector2(WIDTH, LENGTH)
	_mesh(ceiling_mesh, Models.toon(Color.WHITE, _tex("ceiling"), Vector2(WIDTH / 6.0, LENGTH / 6.0), 0.3), Vector3(0, CEILING, HALL_CENTRE_Z), Vector3(PI, 0, 0))

	# The wall texture repeats every 8 m. Walls are 1 m thick; only the inner face can be seen.
	var long_wall := Models.toon(Color.WHITE, _tex("wall"), Vector2(LENGTH / 8.0, 1), 0.35)
	var end_wall := Models.toon(Color.WHITE, _tex("wall"), Vector2(WIDTH / 8.0, 1), 0.35)
	for side: float in [-1.0, 1.0]:
		_quad(Vector2(LENGTH, CEILING), long_wall, Vector3(side * INNER_WALL, CEILING / 2.0, HALL_CENTRE_Z), Vector3(0, -side * PI / 2.0, 0))
		_collider(Vector3(side * HALF_WIDTH, CEILING, HALL_CENTRE_Z), Vector3(0.5, CEILING * 2.0, LENGTH / 2.0))
	_quad(Vector2(WIDTH, CEILING), end_wall, Vector3(0, CEILING / 2.0, 59.5), Vector3(0, PI, 0))
	_quad(Vector2(WIDTH, CEILING), end_wall, Vector3(0, CEILING / 2.0, -69.5), Vector3.ZERO)
	_collider(Vector3(0, CEILING, 60), Vector3(HALF_WIDTH, CEILING * 2.0, 0.5))
	_collider(Vector3(0, CEILING, -70), Vector3(HALF_WIDTH, CEILING * 2.0, 0.5))
	# stops you jumping out through the ceiling
	_collider(Vector3(0, CEILING + 0.5, HALL_CENTRE_Z), Vector3(HALF_WIDTH + 2.0, 0.5, LENGTH / 2.0 + 2.0))


func _build_ceiling_rig() -> void:
	# Stage trusses, cables, pipes and cross beams: the hall is a TV set, and you can see the rigging.
	var z := 50.0
	var i := 0
	while z > -66.0:
		_prop("ceiling_light", Vector3(0, CEILING, z))
		# Most lamps throw hard shadows. A few don't, which keeps the frame rate up in a long hall.
		_light(Color("#ffdfb0"), 7.0, 21.0, Vector3(0, CEILING - 1.0, z), i % 2 == 0)
		z -= 12.0
		i += 1
	z = 48.0
	while z > -60.0:
		for side: float in [-1.0, 1.0]:
			_prop("truss", Vector3(side * 6.0, 6.3, z))
			_prop("conduit", Vector3(side * (INNER_WALL - 0.02), 0, z), side * -PI / 2.0)
		z -= 12.0
	z = 54.0
	while z > -66.0:
		_prop("ceiling_beam", Vector3(0, CEILING, z))
		z -= 24.0
	var spots := [[-6.0, 42.0, 0.0], [6.0, 18.0, 0.0], [-6.0, 6.0, PI], [6.0, -6.0, 0.0], [-6.0, -30.0, PI], [6.0, -30.0, PI]]
	for s: Array in spots:
		_prop("spotlight", Vector3(s[0], 6.3, s[1]), s[2])


func _build_arrival() -> void:
	_prop("arrival_stairs", Vector3(0, 0, 56.5), PI)
	# The prototype lets you walk through these steps. Here they block you, just behind the spawn point.
	_collider(Vector3(0, 2, 58.2), Vector3(4.2, 2, 1.75))
	_hanging_sign("sign_welcome", 14, 2, Vector3(0, 5.2, 46))
	_hanging_sign("sign_lobby", 12, 1.4, Vector3(0, 5.4, 10))


func _build_columns_and_clutter() -> void:
	for z: float in [50.0, 38.0, 22.0, 10.0, -10.0, -22.0, -42.0, -54.0]:
		for side: float in [-1.0, 1.0]:
			var yaw := FACE_EAST if side < 0.0 else FACE_WEST
			_prop("column", Vector3(side * (INNER_WALL - 0.42), 0, z), yaw, Vector3(0.55, 3.0, 0.55))
	# [prop, x, z, yaw, collider half-size]
	var clutter := [
		["bench", 12.8, 44.0, FACE_WEST, Vector3(0.35, 1.0, 1.3)],
		["bench", -12.8, 30.0, FACE_EAST, Vector3(0.35, 1.0, 1.3)],
		["bench", 12.8, -30.0, FACE_WEST, Vector3(0.35, 1.0, 1.3)],
		["plant", -12.4, 42.0, 0.0, Vector3(0.35, 1.0, 0.35)],
		["plant", 12.3, 33.5, 1.0, Vector3(0.35, 1.0, 0.35)],
		["plant", -12.3, -6.0, 2.0, Vector3(0.35, 1.0, 0.35)],
		["plant", 12.3, -6.5, 3.0, Vector3(0.35, 1.0, 0.35)],
		["trash_can", 11.8, 26.0, 0.4, Vector3(0.33, 1.0, 0.33)],
		["trash_can", -12.0, 13.5, 1.9, Vector3(0.33, 1.0, 0.33)],
		["trash_can", 12.2, -46.0, 2.8, Vector3(0.33, 1.0, 0.33)],
		["boxes", -5.0, 27.6, 0.3, Vector3(0.7, 1.0, 0.6)],
		["boxes", 11.6, 16.0, -0.7, Vector3(0.7, 1.0, 0.6)],
		["camera_rig", 8.4, 37.5, 0.7, Vector3(0.55, 1.0, 0.55)],
		["camera_rig", -10.5, -7.5, -2.45, Vector3(0.55, 1.0, 0.55)],
		["camera_rig", 8.0, -45.0, 2.5, Vector3(0.55, 1.0, 0.55)],
		["wet_floor", -9.8, 15.8, 0.8, Vector3(0.5, 1.0, 0.4)],
		["folding_chair", -11.8, 8.0, FACE_EAST, Vector3(0.28, 1.0, 0.28)],
		["folding_chair", -11.8, 6.8, 1.2, Vector3(0.28, 1.0, 0.28)],
		["folding_chair", 12.0, 3.5, -2.1, Vector3(0.28, 1.0, 0.28)],
		["filing", -12.9, 25.0, FACE_EAST, Vector3(0.33, 1.0, 0.33)],
		["filing", -12.9, 25.7, FACE_EAST, Vector3(0.33, 1.0, 0.33)],
		["filing", 12.9, 28.0, FACE_WEST, Vector3(0.33, 1.0, 0.33)],
		["filing", 12.9, -40.0, FACE_WEST, Vector3(0.33, 1.0, 0.33)],
		["cones", 8.4, 49.0, 0.5, Vector3.ZERO],
		["cones", -7.4, -12.2, 1.4, Vector3.ZERO],
		["cones", 10.5, -60.0, 2.6, Vector3.ZERO],
	]
	for c: Array in clutter:
		_prop(c[0], Vector3(c[1], 0, c[2]), c[3], c[4])
	# wall shelves and the notice board give the walls something to read
	for s: Array in [[1.0, 34.0], [-1.0, 36.0], [1.0, 6.0], [-1.0, -2.0], [1.0, -26.0], [-1.0, -48.0]]:
		_prop("shelf", Vector3(float(s[0]) * (INNER_WALL - 0.22), 0.55, s[1]), FACE_EAST if float(s[0]) < 0.0 else FACE_WEST)
	_prop("noticeboard", Vector3(-INNER_WALL + 0.08, 2.75, 13.5), FACE_EAST)
	_quad(Vector2(3.6, 2.2), Models.toon(Color.WHITE, _tex("cork"), Vector2.ONE, 0.2), Vector3(-INNER_WALL + 0.15, 2.75, 13.5), Vector3(0, FACE_EAST, 0))
	# the red carpet from the stairs to the desk
	var carpet := PlaneMesh.new()
	carpet.size = Vector2(5, 24.4)
	_mesh(carpet, Models.toon(Color.WHITE, _tex("carpet"), Vector2(1, 24.4 / 5.0), 0.35), Vector3(0, 0.015, 43.7))
	# the velvet-rope queue to the desk
	for side: float in [-1.0, 1.0]:
		_prop("stanchions", Vector3(side * 6.0, 0, 35.5))
		_collider(Vector3(side * 6.0, 1.0, 35.5), Vector3(0.12, 1.0, 4.7))


func _build_tvs_and_posters() -> void:
	var screen := _unshaded(Color(1.05, 1.05, 1.05), _tex("tv_host"))
	for tv: Array in [[-1.0, 30.0], [1.0, 0.0], [-1.0, -30.0]]:
		var side: float = tv[0]
		var yaw := FACE_EAST if side < 0.0 else FACE_WEST
		_prop("tv_mount", Vector3(side * (INNER_WALL - 0.14), 4, tv[1]), yaw)
		_quad(Vector2(4, 2.5), screen, Vector3(side * (INNER_WALL - 0.29), 4, tv[1]), Vector3(0, yaw, 0))
	# [poster, wall side, z, height]
	var posters := [
		["poster_smile", -1.0, 47.0, 2.9], ["poster_floor18", 1.0, 41.0, 2.9], ["poster_thirst", -1.0, 19.5, 3.3],
		["poster_cone", 1.0, 25.0, 2.8], ["poster_smile", 1.0, 13.5, 3.0],
		["poster_cone", -1.0, -18.0, 2.9], ["poster_thirst", 1.0, -17.5, 2.8], ["poster_floor18", -1.0, -38.0, 3.0],
		["poster_smile", 1.0, -50.0, 2.9], ["poster_cone", -1.0, -58.0, 2.9],
	]
	for p: Array in posters:
		var side: float = p[1]
		var yaw := FACE_EAST if side < 0.0 else FACE_WEST
		var tilt := sin(float(p[2])) * 0.05
		_quad(Vector2(1.5, 2.25), Models.toon(Color.WHITE, _tex(p[0]), Vector2.ONE, 0.3), Vector3(side * (INNER_WALL - 0.02), p[3], p[2]), Vector3(0, yaw, tilt))


func _build_desk() -> void:
	_prop("desk", Vector3(0, 0, 30))
	_collider(Vector3(0, 2, 30), Vector3(3.5, 2, 0.8))
	_hanging_sign("sign_orientation", 5, 0.9, Vector3(0, 2.75, 30.1))


func _build_fountain() -> void:
	_prop("fountain", Vector3(-12.95, 0, 18), FACE_EAST)
	_collider(Vector3(-12.95, 2, 18), Vector3(0.5, 2, 0.5))
	_wall_sign("sign_water", 2, 0.6, Vector3(-13.4, 2.25, 18), FACE_EAST)


func _build_training_yard() -> void:
	var yard := PlaneMesh.new()
	yard.size = Vector2(22, 14)
	_mesh(yard, Models.toon(Color.WHITE, _tex("yard"), Vector2.ONE, 0.4), Vector3(0, 0.02, 5))
	_hanging_sign("sign_training", 6, 1, Vector3(0, 3.6, 12))


func _build_arena() -> void:
	for side: float in [-1.0, 1.0]:
		_prop("barrier", Vector3(side * 8.0, 0, -14))
		_collider(Vector3(side * 8.0, 2, -14), Vector3(5, 2, 0.35))
	_hanging_sign("sign_arena", 7, 1.1, Vector3(0, 3.5, -14))
	var ring := PlaneMesh.new()
	ring.size = Vector2(22, 22)
	_mesh(_disc_mesh(11.0, 48), Models.toon(Color.WHITE, _tex("arena"), Vector2.ONE, 0.4), Vector3(0, 0.03, -30))
	for spot: Array in [[-9.0, -24.0, Vector3(0.45, 1.0, 0.45)], [9.3, -36.0, Vector3(0.45, 1.0, 0.45)]]:
		_prop("tires", Vector3(spot[0], 0, spot[1]), 0.8, spot[2])
	_prop("sandbags", Vector3(-8.5, 0, -38), 0.9, Vector3(1.4, 1.0, 0.5))
	_prop("sandbags", Vector3(9.2, 0, -23.5), -0.8, Vector3(1.4, 1.0, 0.5))
	_prop("sandbags", Vector3(0, 0, -43.4), 0.0, Vector3(1.4, 1.0, 0.5))
	_light(Color("#ffd6a0"), 6.0, 18.0, Vector3(0, 5.6, -30), true)


func _build_exit() -> void:
	_prop("stair_door", Vector3(0, 0, -68))
	_collider(Vector3(0, CEILING / 2.0, -68), Vector3(4, CEILING / 2.0, 1))
	_wall_sign("sign_floor1", 5, 1.1, Vector3(0, 6.45, -66.88), 0.0)
	interactables.append({ "pos": Vector3(0, 0, -64), "r": 4.0, "text": "Press E: take the stairs down to Floor 1", "to": 1 })
	_light(Color("#5aff7a"), 3.2, 11.0, Vector3(0, 3.4, -63), true)


func _place_people() -> void:
	# yaw 0 faces the arrival stairs (+Z), the way everyone in the prototype's Landing faces
	_person("res://models/npcs/pool/human_quest.glb", Vector3(0, 0, 28.4), 1.0) # Intern Pip
	_person("res://models/npcs/pool/human_guard.glb", Vector3(-10, 0, 44), 1.06)
	_person("res://models/npcs/pool/gutterkin_gossip.glb", Vector3(9, 0, 20), 0.98)
	for x: float in [-6.0, 0.0, 6.0]:
		_person("res://models/monsters/dummy.glb", Vector3(x, 0, 5), 1.0)
	var goblins := [[1, -5.0, -32.0], [4, 5.0, -32.0], [6, 0.0, -38.0]]
	for g: Array in goblins:
		var variant: int = g[0]
		_person("res://models/monsters/goblin_v%d.glb" % variant, Vector3(g[1], 0, g[2]), 0.95 + (variant % 3) * 0.05)


# ---------------------------------------------------------------- building blocks
func _tex(texture_name: String) -> Texture2D:
	return load(TEXTURES % texture_name)


func _prop(prop_name: String, pos: Vector3, yaw := 0.0, collide_half := Vector3.ZERO) -> Node3D:
	var model := Models.instantiate(PROPS % prop_name)
	if model == null:
		return null
	model.position = pos
	model.rotation.y = yaw
	add_child(model)
	if collide_half != Vector3.ZERO:
		var shape := BoxShape3D.new()
		shape.size = collide_half * 2.0
		var body := CollisionShape3D.new()
		body.shape = shape
		body.position = pos + Vector3.UP * collide_half.y
		body.rotation.y = yaw
		_colliders.add_child(body)
	return model


func _person(path: String, pos: Vector3, model_scale: float) -> void:
	var model := Models.instantiate(path)
	if model == null:
		return
	model.position = pos
	model.scale = Vector3.ONE * model_scale
	add_child(model)
	var shape := CylinderShape3D.new()
	shape.radius = 0.45
	shape.height = 2.0
	var body := CollisionShape3D.new()
	body.shape = shape
	body.position = pos + Vector3.UP
	_colliders.add_child(body)


func _unshaded(color: Color, texture: Texture2D = null) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = color
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	if texture:
		mat.albedo_texture = texture
		mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	return mat


func _mesh(mesh: Mesh, mat: Material, pos: Vector3, rot := Vector3.ZERO) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.mesh = mesh
	node.material_override = mat
	node.position = pos
	node.rotation = rot
	add_child(node)
	return node


func _quad(size: Vector2, mat: Material, pos: Vector3, rot := Vector3.ZERO) -> MeshInstance3D:
	var mesh := QuadMesh.new()
	mesh.size = size
	return _mesh(mesh, mat, pos, rot)


func _disc_mesh(radius: float, segments: int) -> ArrayMesh:
	var tool := SurfaceTool.new()
	tool.begin(Mesh.PRIMITIVE_TRIANGLES)
	tool.set_normal(Vector3.UP)
	for i in segments:
		var a := TAU * i / segments
		var b := TAU * (i + 1) / segments
		for point: Vector2 in [Vector2.ZERO, Vector2(cos(b), sin(b)), Vector2(cos(a), sin(a))]:
			tool.set_uv(point * 0.5 + Vector2(0.5, 0.5))
			tool.add_vertex(Vector3(point.x * radius, 0, point.y * radius))
	return tool.commit()


func _collider(pos: Vector3, half_extents: Vector3) -> void:
	var shape := BoxShape3D.new()
	shape.size = half_extents * 2.0
	var node := CollisionShape3D.new()
	node.shape = shape
	node.position = pos
	_colliders.add_child(node)


func _light(color: Color, intensity: float, reach: float, pos: Vector3, shadows: bool) -> void:
	var light := OmniLight3D.new()
	light.light_color = color
	light.light_energy = intensity / PI * 0.58
	light.omni_range = reach
	light.omni_attenuation = 0.45
	light.position = pos
	light.shadow_enabled = shadows
	light.shadow_bias = 0.06
	light.shadow_blur = 0.0
	add_child(light)


## A painted board on a dark backing, readable from both sides and hung from the ceiling on chains.
func _hanging_sign(texture_name: String, w: float, h: float, pos: Vector3) -> void:
	_wall_sign(texture_name, w, h, pos, 0.0)
	var back := _quad(Vector2(w, h), _unshaded(Color(0.92, 0.92, 0.92), _tex(texture_name)), pos - Vector3(0, 0, 0.075), Vector3(0, PI, 0))
	back.name = "SignBack"
	var chain_mat := Models.toon(Color("#3a3a42"))
	var chain := CylinderMesh.new()
	chain.top_radius = 0.022
	chain.bottom_radius = 0.022
	chain.height = CEILING - pos.y - h / 2.0
	chain.radial_segments = 6
	chain.rings = 1
	for side: float in [-1.0, 1.0]:
		_mesh(chain, chain_mat, Vector3(pos.x + side * (w / 2.0 - 0.35), pos.y + h / 2.0 + chain.height / 2.0, pos.z))


func _wall_sign(texture_name: String, w: float, h: float, pos: Vector3, yaw: float) -> void:
	var board := BoxMesh.new()
	board.size = Vector3(w + 0.1, h + 0.1, 0.12)
	var backing := _mesh(board, Models.toon(Color("#25232c")), pos, Vector3(0, yaw, 0))
	var face := QuadMesh.new()
	face.size = Vector2(w, h)
	var node := MeshInstance3D.new()
	node.mesh = face
	node.material_override = _unshaded(Color(0.92, 0.92, 0.92), _tex(texture_name))
	node.position = Vector3(0, 0, 0.065)
	backing.add_child(node)
