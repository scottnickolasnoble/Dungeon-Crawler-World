class_name FloorWorld
extends FloorKit
## Floors 1-6. The layout comes from data/floors.json (the prototype's backbone: same town, village, camp, landmark and
## stair positions). THEMES below gives every floor its own mood, materials and town character.
## Monsters stand at their camps as stand-ins until combat arrives in Phase 2.

const SIZE := 720.0
const THEMES := {
	1: { "bg": "#17120e", "fog": "#2a2018", "fog_near": 16.0, "fog_far": 118.0, "vol": 0.012, "sky": ["#c8a06a", "#6a5a48", "#7a6248"], "ambient": 0.46, "key": ["#ffcf8a", 0.3], "ground_tile": 16.0, "town_light": ["#ffb860", 1.6], "particles": "drips", "roof": "flat", "trim": "#55504a", "roof_color": "#4a4640", "ceiling": "#3a3430", "room_light": 0.9, "rug": "#6a3a2a", "perimeter": "facade_b", "scatter": [["concrete_pillar", 620, Vector3(0.6, 3.0, 0.6), 1.0, 1.0, true], ["car", 170, Vector3(0.95, 1.0, 2.15), 0.95, 1.05, false], ["tires", 40, Vector3(0.5, 1.0, 0.5), 1.0, 1.0, false]], "lanes": ["car", "tires", "barrels", "sandbags", "cones", "crates", "boxes"] },
	2: { "bg": "#14262a", "fog": "#3a6a6a", "fog_near": 12.0, "fog_far": 105.0, "vol": 0.016, "sky": ["#c8f4ea", "#2a4a44", "#6a9a90"], "ambient": 0.36, "key": ["#e8fff8", 0.3], "ground_tile": 12.0, "town_light": ["#c8fff0", 1.4], "particles": "lint", "roof": "flat", "trim": "#2f7a7a", "roof_color": "#b8c8c4", "ceiling": "#d8e8e2", "room_light": 0.9, "rug": "#2f7a7a", "perimeter": "facade_a", "scatter": [["washer", 260, Vector3(0.75, 1.0, 0.75), 1.0, 2.6, false], ["clothesline", 80, Vector3.ZERO, 1.0, 1.0, false], ["laundry_cart", 90, Vector3(0.5, 1.0, 0.5), 1.0, 1.4, false]], "lanes": ["washer", "laundry_cart", "clothesline", "barrels", "boxes", "wet_floor"] },
	3: { "bg": "#2a1610", "fog": "#7a4420", "fog_near": 8.0, "fog_far": 92.0, "vol": 0.03, "sky": ["#ffc080", "#3a2014", "#a06a3a"], "ambient": 0.36, "key": ["#ffc890", 0.26], "ground_tile": 8.0, "town_light": ["#ff9a4a", 1.8], "particles": "steam", "roof": "gable", "trim": "#4a3020", "roof_color": "#6a3a2a", "ceiling": "#4a3020", "room_light": 0.95, "rug": "#7a2a1e", "chimney": true, "perimeter": "facade_a", "scatter": [["pipes", 240, Vector3(0.6, 3.0, 0.6), 1.0, 2.2, false], ["cauldron", 90, Vector3(0.95, 1.0, 0.95), 1.0, 1.8, false], ["barrels", 90, Vector3(0.9, 1.0, 0.8), 1.0, 1.2, false]], "lanes": ["cauldron", "pipes", "barrels", "crates", "market_stall", "bench"] },
	4: { "bg": "#30303c", "fog": "#c8c0c8", "fog_near": 22.0, "fog_far": 150.0, "vol": 0.0, "sky": ["#ffffff", "#7a7078", "#dcd4d0"], "ambient": 0.42, "key": ["#ffffff", 0.26], "ground_tile": 8.0, "town_light": ["#fff0d8", 1.4], "particles": "confetti", "roof": "flat", "trim": "#e8398c", "roof_color": "#a8a8b0", "ceiling": "#efe8dc", "room_light": 0.85, "rug": "#6d4a8c", "perimeter": "facade_b", "scatter": [["kiosk", 130, Vector3(2.2, 1.5, 2.2), 1.0, 1.0, false], ["mannequin", 240, Vector3(0.3, 1.0, 0.3), 1.0, 1.1, false], ["plant", 110, Vector3(0.4, 1.0, 0.4), 1.2, 1.6, false], ["column", 240, Vector3(0.6, 3.0, 0.6), 1.0, 1.0, true]], "lanes": ["kiosk", "mannequin", "plant", "bench", "trash_can", "market_stall"] },
	5: { "bg": "#8ac8f0", "fog": "#bfe2f8", "fog_near": 45.0, "fog_far": 240.0, "vol": 0.0, "sky": ["#d8f0ff", "#5a8a3a", "#a8d0d0"], "ambient": 0.46, "key": ["#fff0d0", 0.75], "ground_tile": 10.0, "town_light": ["#fff4e0", 0.8], "particles": "pollen", "roof": "gable", "trim": "#f4f1e8", "roof_color": "#a0483a", "ceiling": "#f4efe0", "room_light": 0.8, "rug": "#a0483a", "perimeter": "fence", "scatter": [["tree", 420, Vector3(0.45, 2.0, 0.45), 0.9, 1.6, false], ["hedge", 340, Vector3(2.0, 1.0, 0.6), 1.0, 1.0, false], ["mailbox", 200, Vector3(0.2, 1.0, 0.2), 1.0, 1.0, false], ["fence", 280, Vector3(3.0, 1.0, 0.12), 1.0, 1.0, false]], "lanes": ["tree", "hedge", "mailbox", "bench", "cones", "table_set"] },
	6: { "bg": "#07110b", "fog": "#143022", "fog_near": 9.0, "fog_far": 88.0, "vol": 0.03, "sky": ["#a8ffd0", "#10201a", "#3a6a50"], "ambient": 0.34, "key": ["#b8ffd8", 0.26], "ground_tile": 9.0, "town_light": ["#ffc870", 1.8], "particles": "fireflies", "roof": "cone", "trim": "#4a3420", "roof_color": "#8a7a3e", "ceiling": "#3e2c18", "room_light": 1.0, "rug": "#4a6a2a", "perimeter": "facade_a", "scatter": [["giant_trunk", 170, Vector3(1.9, 8.0, 1.9), 0.9, 1.8, true], ["mushroom", 420, Vector3.ZERO, 0.9, 2.2, false]], "lanes": ["mushroom", "giant_trunk", "treehouse_platform", "barrels", "rope_bridge"] },
}
## Who wears what. Everyone uses a stand-in model from the prototype until the redesign reaches them.
const NAMED := { "marta": "martaVance", "pickles": "pickles", "spin": "spinCycle", "reggie": "oldReggie", "wickley": "wickley", "ash": "brotherAsh", "sunny": "sunnySponsorRep", "prickle": "madamePrickle", "deb": "bigDeb", "watch": "neighbourhoodWatch", "gusset": "gusset", "lantern": "elderLantern" }
const GUILD_MASTERS := [["Archmage Pell", "The Collegium (mages)", "lumen"], ["Foreman Gruss", "Tradesfolk Union", "stoneblood"], ["Supervisor Mox", "The Night Shift", "fennix"], ["Matron Hale", "Caregivers' Lodge", "human"]]
const CAMP_PROPS := { "cone": ["cones", "cones", "sandbags"], "lamprey": ["barrels", "wet_floor", "pipes"], "moth": ["ceiling_light", "lamp_post", "crates"], "pigeon": ["crates", "boxes", "bench"], "mimic": ["boxes", "junk_pile", "food_shelf"], "wight": ["wet_floor", "barrels", "pipes"], "hag": ["cauldron", "barrels", "table_set"], "mall": ["kiosk", "mannequin", "boxes"], "leech": ["boxes", "food_shelf", "junk_pile"], "slime": ["table_set", "barrels", "kiosk"], "gnome": ["mailbox", "hedge", "fence"], "hound": ["hedge", "tires", "crates"], "hunter": ["tent", "crates", "table_set"] }
## [prop, scale, glow colour] for each landmark on the floors.
const LANDMARKS := { "The Ramp Spiral": ["concrete_pillar", 2.2, "#ffb24a"], "The Burning Bus": ["bus", 1.0, "#ff7a2a"], "The Exit Sign": ["stair_door", 2.2, "#5aff7a"], "The Great Dryer": ["washer", 8.0, "#c8fff0"], "Soap Falls": ["sock_pile", 3.0, "#a8e8ff"], "Sock Mountain": ["sock_pile", 8.0, "#fff0c0"], "Auntie Brine's Pot": ["cauldron", 7.0, "#ff8a2a"], "Scratch Marks": ["junk_pile", 2.0, "#c8a8ff"], "The Escalator to Nowhere": ["escalator", 1.0, "#ffffff"], "The Block Party": ["table_set", 2.0, "#ff6ac8"], "The Tallest Tree": ["giant_trunk", 3.2, "#5affc8"] }

var theme: Dictionary
var data: Dictionary
var spawn := Vector3(0, 0, 52)
var _zones: Array = []
var _rng := RandomNumberGenerator.new()
var _particles: GPUParticles3D
var _look: Dictionary
var _placed: Array[Vector2] = []


func setup(floor_index: int) -> FloorWorld:
	floor_number = floor_index
	theme = THEMES[floor_index]
	data = Data.floors[str(floor_index)]
	_rng.seed = 1000 + floor_index
	draw_distance = minf(float(theme.fog_far) + 14.0, 190.0)
	spawn = Vector3(float(data.spawn[0]), 0, float(data.spawn[2]))
	_look = { "roof": theme.roof, "trim": Color(theme.trim), "roof_color": Color(theme.roof_color), "ceiling": Color(theme.ceiling), "room_light": theme.room_light, "rug": Color(theme.rug), "chimney": theme.get("chimney", false) }
	return self


func _ready() -> void:
	begin_kit()
	_build_mood()
	_build_shell()
	_reserve_zones()
	_build_hub()
	for v: Dictionary in data.get("villages", []):
		_build_village(v)
	for c: Dictionary in data.get("camps", []):
		_build_camp(c)
	for l: Dictionary in data.get("landmarks", []):
		_build_landmark(l)
	_build_stairs()
	_scatter_world()
	_ceiling_fixtures()


func _process(_delta: float) -> void:
	# weather follows the player, so it's everywhere without costing the whole 720 m
	if _particles:
		var player := get_tree().get_first_node_in_group("player") as Node3D
		if player:
			_particles.global_position = player.global_position + Vector3.UP * 3.0


# ---------------------------------------------------------------- mood
func _build_mood() -> void:
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color(theme.sky[0])
	sky_mat.ground_bottom_color = Color(theme.sky[1])
	sky_mat.sky_horizon_color = Color(theme.sky[2])
	sky_mat.ground_horizon_color = Color(theme.sky[2])
	sky_mat.sun_angle_max = 0.0
	var sky := Sky.new()
	sky.sky_material = sky_mat
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(theme.bg)
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = theme.ambient
	env.reflected_light_source = Environment.REFLECTION_SOURCE_DISABLED
	env.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	env.ssao_enabled = true
	env.ssao_radius = 1.6
	env.ssao_intensity = 2.2
	env.ssao_power = 1.8
	env.ssao_light_affect = 0.25
	env.fog_enabled = true
	env.fog_mode = Environment.FOG_MODE_DEPTH
	env.fog_light_color = Color(theme.fog)
	env.fog_sun_scatter = 0.0
	env.fog_depth_begin = theme.fog_near
	env.fog_depth_end = theme.fog_far
	env.fog_depth_curve = 1.0
	if float(theme.vol) > 0.0:
		env.volumetric_fog_enabled = true
		env.volumetric_fog_density = theme.vol
		env.volumetric_fog_albedo = Color(theme.fog).lightened(0.25)
		env.volumetric_fog_length = 64.0
		env.volumetric_fog_ambient_inject = 1.0
		env.volumetric_fog_sky_affect = 0.0
	var world_env := WorldEnvironment.new()
	world_env.environment = env
	add_child(world_env)

	var sun := DirectionalLight3D.new()
	sun.light_color = Color(theme.key[0])
	sun.light_energy = theme.key[1]
	sun.rotation = Vector3(deg_to_rad(-62.0), deg_to_rad(35.0), 0)
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 70.0
	add_child(sun)

	_particles = _make_particles(theme.particles)
	add_child(_particles)


func _make_particles(kind: String) -> GPUParticles3D:
	var settings: Dictionary = {
		"drips": { "n": 160, "life": 1.6, "size": Vector2(0.025, 0.42), "color": "#9ab8c8", "dir": Vector3.DOWN, "speed": 9.0, "grav": 0.0, "spread": 0.0, "box": Vector3(26, 4, 26) },
		"lint": { "n": 240, "life": 7.0, "size": Vector2(0.09, 0.09), "color": "#efe9dc", "dir": Vector3.DOWN, "speed": 0.5, "grav": 0.0, "spread": 40.0, "box": Vector3(24, 6, 24) },
		"steam": { "n": 80, "life": 6.0, "size": Vector2(1.6, 1.6), "color": "#e8b888", "dir": Vector3.UP, "speed": 0.7, "grav": 0.0, "spread": 22.0, "box": Vector3(24, 1, 24), "alpha": 0.18 },
		"confetti": { "n": 120, "life": 7.0, "size": Vector2(0.09, 0.14), "color": "#ff5aa8", "dir": Vector3.DOWN, "speed": 1.0, "grav": 0.0, "spread": 18.0, "box": Vector3(26, 6, 26) },
		"pollen": { "n": 170, "life": 8.0, "size": Vector2(0.05, 0.05), "color": "#fff4a8", "dir": Vector3.RIGHT, "speed": 0.5, "grav": 0.0, "spread": 60.0, "box": Vector3(26, 5, 26) },
		"fireflies": { "n": 150, "life": 8.0, "size": Vector2(0.07, 0.07), "color": "#c8ff8a", "dir": Vector3.UP, "speed": 0.35, "grav": 0.0, "spread": 180.0, "box": Vector3(24, 3.5, 24), "boost": 3.0 },
	}[kind]
	var mat := ParticleProcessMaterial.new()
	mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX
	mat.emission_box_extents = settings.box
	mat.direction = settings.dir
	mat.spread = settings.spread
	mat.initial_velocity_min = float(settings.speed) * 0.7
	mat.initial_velocity_max = float(settings.speed) * 1.3
	mat.gravity = Vector3.ZERO
	var draw := StandardMaterial3D.new()
	draw.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	draw.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	draw.billboard_mode = BaseMaterial3D.BILLBOARD_FIXED_Y if kind == "drips" else BaseMaterial3D.BILLBOARD_ENABLED
	var c := Color(settings.color) * float(settings.get("boost", 1.0))
	c.a = settings.get("alpha", 0.9)
	draw.albedo_color = c
	if kind == "steam":
		# a soft puff rather than a hard square
		var puff := GradientTexture2D.new()
		puff.fill = GradientTexture2D.FILL_RADIAL
		puff.fill_from = Vector2(0.5, 0.5)
		puff.fill_to = Vector2(1.0, 0.5)
		var ramp := Gradient.new()
		ramp.set_color(0, Color(1, 1, 1, 1))
		ramp.set_color(1, Color(1, 1, 1, 0))
		puff.gradient = ramp
		draw.albedo_texture = puff
	var q := QuadMesh.new()
	q.size = settings.size
	q.material = draw
	var p := GPUParticles3D.new()
	p.amount = settings.n
	p.lifetime = settings.life
	p.preprocess = settings.life
	p.process_material = mat
	p.draw_pass_1 = q
	p.visibility_aabb = AABB(Vector3(-40, -12, -40), Vector3(80, 24, 80))
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	p.local_coords = false
	return p


func _build_shell() -> void:
	var ceil_h := float(data.ceil)
	var world := Vector2(SIZE, SIZE)
	var ground := plane(world, Models.toon(Color.WHITE, surface_tex("ground"), world / float(theme.ground_tile), 0.55), Vector3.ZERO)
	ground.visibility_range_end = 0.0
	box_collider(Vector3(0, -0.5, 0), Vector3(SIZE / 2.0 + 4.0, 0.5, SIZE / 2.0 + 4.0))
	var ceiling_tile := 110.0 if floor_number == 5 else 8.0
	var top_mat: Material = Models.toon(Color.WHITE, surface_tex("ceiling"), world / ceiling_tile, 0.2)
	if floor_number == 5:
		# the painted sky lights itself, so the lawn's green doesn't tint it
		var sky_mat := unshaded(Color.WHITE, surface_tex("ceiling"))
		sky_mat.uv1_scale = Vector3(world.x / ceiling_tile, world.y / ceiling_tile, 1.0)
		sky_mat.disable_fog = true
		top_mat = sky_mat
	var top := quad(world, top_mat, Vector3(0, ceil_h, 0), Vector3(PI / 2.0, 0, 0))
	top.visibility_range_end = 0.0
	top.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	box_collider(Vector3(0, ceil_h + 0.5, 0), Vector3(SIZE / 2.0 + 4.0, 0.5, SIZE / 2.0 + 4.0))
	var wall_mat := Models.toon(Color.WHITE, surface_tex("facade_b"), Vector2(SIZE, ceil_h) / 8.0, 0.4)
	for s: Array in [[Vector3(0, 0, -SIZE / 2.0), 0.0], [Vector3(0, 0, SIZE / 2.0), PI], [Vector3(-SIZE / 2.0, 0, 0), PI / 2.0], [Vector3(SIZE / 2.0, 0, 0), -PI / 2.0]]:
		var q := quad(Vector2(SIZE, ceil_h), wall_mat, s[0] + Vector3.UP * ceil_h / 2.0, Vector3(0, s[1], 0))
		q.visibility_range_end = 0.0
		q.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		box_collider(s[0] + Vector3.UP * ceil_h, Vector3(SIZE / 2.0 if s[1] in [0.0, PI] else 0.5, ceil_h, 0.5 if s[1] in [0.0, PI] else SIZE / 2.0))


func _reserve_zones() -> void:
	var hub: Dictionary = data.hub
	_zones.append(Rect2(-hub.w / 2.0 - 16.0, -hub.d / 2.0 - 16.0, hub.w + 32.0, hub.d + 32.0))
	for v: Dictionary in data.get("villages", []):
		_zones.append(Rect2(v.x - 46.0, v.z - 40.0, 92.0, 80.0))
	for c: Dictionary in data.get("camps", []):
		var r: float = c.get("r", 20.0) + 8.0
		_zones.append(Rect2(c.x - r, c.z - r, r * 2.0, r * 2.0))
	for l: Dictionary in data.get("landmarks", []):
		_zones.append(Rect2(l.x - 24.0, l.z - 24.0, 48.0, 48.0))
	_zones.append(Rect2(data.stairs.x - 14.0, data.stairs.z - 14.0, 28.0, 28.0))


func _is_free(x: float, z: float, pad: float) -> bool:
	for r: Rect2 in _zones:
		if r.grow(pad).has_point(Vector2(x, z)):
			return false
	return absf(x) < SIZE / 2.0 - 6.0 and absf(z) < SIZE / 2.0 - 6.0


## Fills the open floor outside the towns: hundreds of props, drawn as one batch each so they stay cheap.
func _scatter_world() -> void:
	for spec: Array in theme.scatter:
		var source := Models.batch_mesh(TOWN_PROPS % spec[0] if ResourceLoader.exists(TOWN_PROPS % spec[0]) else LANDING_PROPS % spec[0])
		if source == null:
			continue
		var transforms: Array[Transform3D] = []
		var count: int = spec[1]
		var half: Vector3 = spec[2]
		var grid_step := SIZE / ceilf(sqrt(count)) if spec[5] else 0.0
		var tries := 0
		while transforms.size() < count and tries < count * 6:
			tries += 1
			var x: float
			var z: float
			if spec[5]:
				var cells := int(ceilf(sqrt(count)))
				x = -SIZE / 2.0 + (float(tries % cells) + 0.5) * grid_step
				z = -SIZE / 2.0 + (float(int(tries / float(cells)) % cells) + 0.5) * grid_step
			else:
				x = _rng.randf_range(-SIZE / 2.0, SIZE / 2.0)
				z = _rng.randf_range(-SIZE / 2.0, SIZE / 2.0)
			if not _is_free(x, z, 3.0):
				continue
			var yaw := 0.0 if spec[5] else _rng.randf_range(0.0, TAU)
			var s := _rng.randf_range(spec[3], spec[4])
			var t := Transform3D(Basis(Vector3.UP, yaw).scaled(Vector3.ONE * s), Vector3(x, 0, z))
			transforms.append(t)
			if half != Vector3.ZERO:
				box_collider(Vector3(x, half.y * s, z), half * s, yaw)
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.mesh = source
		mm.instance_count = transforms.size()
		for i in transforms.size():
			mm.set_instance_transform(i, transforms[i])
		var mmi := MultiMeshInstance3D.new()
		mmi.multimesh = mm
		add_child(mmi)


## The floors with a low ceiling get rows of working lamps overhead, drawn in one batch.
func _ceiling_fixtures() -> void:
	if floor_number not in [1, 2, 3, 4]:
		return
	var source := Models.batch_mesh(LANDING_PROPS % "ceiling_light")
	var transforms: Array[Transform3D] = []
	var step := 26.0
	var x := -SIZE / 2.0 + step / 2.0
	while x < SIZE / 2.0:
		var z := -SIZE / 2.0 + step / 2.0
		while z < SIZE / 2.0:
			if _is_free(x, z, 0.0) or floor_number != 1:
				transforms.append(Transform3D(Basis.IDENTITY, Vector3(x, float(data.ceil), z)))
			z += step
		x += step
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = source
	mm.instance_count = transforms.size()
	for i in transforms.size():
		mm.set_instance_transform(i, transforms[i])
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	add_child(mmi)


# ---------------------------------------------------------------- towns
func _wall_with_gates(cx: float, cz: float, w: float, d: float, gates: Array, height: float, town_sign: String) -> void:
	var sides := { "N": [Vector3(cx, 0, cz - d / 2.0), w, 0.0], "S": [Vector3(cx, 0, cz + d / 2.0), w, PI], "W": [Vector3(cx - w / 2.0, 0, cz), d, PI / 2.0], "E": [Vector3(cx + w / 2.0, 0, cz), d, -PI / 2.0] }
	for key: String in sides:
		var pos: Vector3 = sides[key][0]
		var length: float = sides[key][1]
		var yaw: float = sides[key][2]
		var along := Vector3(cos(yaw), 0, -sin(yaw))
		var runs: Array = [[-length / 2.0, length / 2.0]]
		if key in gates:
			runs = [[-length / 2.0, -4.6], [4.6, length / 2.0]]
			var g := prop("gate", pos, yaw + PI)
			if g:
				box_collider(pos - along * 5.5 + Vector3.UP * 3.5, Vector3(1.0, 3.5, 1.0), yaw)
				box_collider(pos + along * 5.5 + Vector3.UP * 3.5, Vector3(1.0, 3.5, 1.0), yaw)
			board(town_sign, 8.0, 2.0, pos + Vector3.UP * 5.75, yaw)
			lamp(Color(theme.town_light[0]), 1.5, 15.0, pos + Vector3.UP * 5.0)
		for run: Array in runs:
			var a: float = run[0]
			var b: float = run[1]
			if theme.perimeter == "fence":
				var t := a + 3.0
				while t < b - 2.0:
					prop("fence", pos + along * t, yaw)
					prop("hedge", pos + along * t + Vector3(sin(yaw), 0, cos(yaw)) * 0.9, yaw)
					t += 6.0
				box_collider(pos + along * ((a + b) / 2.0) + Vector3.UP, Vector3(absf(b - a) / 2.0, 1.0, 0.2), yaw)
				continue
			var mid := (a + b) / 2.0
			var run_len := absf(b - a)
			var size := Vector2(run_len, height)
			var mat := surface(theme.perimeter, size, 6.0, 0.45)
			for facing: float in [0.0, PI]:
				quad(size, mat, pos + along * mid + Vector3(sin(yaw + facing), 0, cos(yaw + facing)) * 0.5 + Vector3.UP * height / 2.0, Vector3(0, yaw + facing, 0))
			block(Vector3(run_len + 0.4, 0.45, 1.5), flat(Color(theme.trim)), pos + along * mid + Vector3.UP * height, yaw)
			var post := a + 6.0
			while post < b:
				block(Vector3(1.3, height + 1.0, 1.4), flat(Color(theme.trim)), pos + along * post + Vector3.UP * (height + 1.0) / 2.0, yaw)
				post += 12.0
			box_collider(pos + along * mid + Vector3.UP * height / 2.0, Vector3(run_len / 2.0, height / 2.0, 0.6), yaw)


func _slug(text: String) -> String:
	var out := ""
	var last_was_sep := true
	for ch in text.to_lower():
		var ok := (ch >= "a" and ch <= "z") or (ch >= "0" and ch <= "9")
		if ok:
			out += ch
			last_was_sep = false
		elif not last_was_sep:
			out += "_"
			last_was_sep = true
	return out.trim_suffix("_")


func _pool(race: String, role: String) -> String:
	var path := "res://models/npcs/pool/%s_%s.glb" % [race, role]
	return path if ResourceLoader.exists(path) else "res://models/npcs/pool/human_trader.glb"


func _keeper_path(m: Dictionary, fallback_race: String) -> String:
	if m.has("named") and NAMED.has(m.named):
		return "res://models/npcs/named/%s.glb" % NAMED[m.named]
	return _pool(str(m.get("race", fallback_race)), "trader")


func _shop_cfg(m: Dictionary, race: String) -> Dictionary:
	return { "kind": m.shop, "w": 12.0, "d": 11.0, "h": 5.2, "sign": "shop_" + str(m.id), "blade": "blade_f%d_%s" % [floor_number, m.shop], "name": m.name, "title": m.title, "keeper": _keeper_path(m, race), "facade": "facade_a" }


func _build_hub() -> void:
	var hub: Dictionary = data.hub
	var W: float = hub.w
	var D: float = hub.d
	var races: Array = data.townsfolk.races
	var hub_sign := "gate_" + _slug(data.hub_name)
	_wall_with_gates(0, 0, W, D, ["S", "N", "E", "W"], 5.0, hub_sign)
	if floor_number == 5:
		# Suburbia is lawns, with a road only up the avenue and around the turning circle
		plane(Vector2(14, D), surface("pave", Vector2(14, D), 14.0, 0.5), Vector3(0, 0.02, 0)).visibility_range_end = 0.0
		plane(Vector2(W, 13), surface("pave", Vector2(W, 13), 14.0, 0.5), Vector3(0, 0.025, 0)).visibility_range_end = 0.0
		var circle := CylinderMesh.new()
		circle.top_radius = 21.0
		circle.bottom_radius = 21.0
		circle.height = 0.04
		circle.radial_segments = 40
		circle.rings = 1
		mesh_node(circle, surface("pave", Vector2(42, 42), 14.0, 0.5), Vector3(0, 0.01, 0)).visibility_range_end = 0.0
	else:
		plane(Vector2(W, D), surface("pave", Vector2(W, D), 8.0, 0.5), Vector3(0, 0.02, 0)).visibility_range_end = 0.0

	# The named buildings come first, nearest the square, so the important doors are easy to find.
	var named: Array[Dictionary] = []
	for m: Dictionary in data.get("merchants", []):
		named.append(_shop_cfg(m, races[0]))
	named.append({ "kind": "inn", "w": 15.0, "d": 11.5, "h": 6.2, "sign": "inn_f%d" % floor_number, "blade": "blade_f%d_inn" % floor_number, "name": data.get("innkeeper", "Innkeeper"), "title": "The Inn · rest and heal", "keeper": _pool(races[0], "cook"), "facade": "facade_b" })
	named.append({ "kind": "saferoom", "w": 9.0, "d": 8.5, "h": 4.6, "sign": "safe_f%d" % floor_number, "blade": "blade_f%d_saferoom" % floor_number, "name": "Safe Room", "facade": "facade_b" })
	if floor_number >= 3:
		var masters := []
		for gm: Array in GUILD_MASTERS:
			masters.append({ "name": gm[0], "title": gm[1], "model": _pool(gm[2], "quest") })
		named.append({ "kind": "guild", "w": 16.0, "d": 11.0, "h": 7.5, "sign": "guild_f%d" % floor_number, "blade": "blade_f%d_guild" % floor_number, "name": "Guild Hall", "masters": masters, "facade": "facade_b" })
	if hub.get("callings", false):
		named.append({ "kind": "callings", "w": 16.0, "d": 11.0, "h": 8.0, "sign": "callings_f%d" % floor_number, "blade": "blade_f%d_callings" % floor_number, "name": "Registrar Odessa", "title": "Hall of Callings · choose race and class", "keeper": _pool("lumen", "quest"), "facade": "facade_a" })

	var slots := _layout_slots(W, D)
	var homes := 0
	_placed.clear()
	for i in slots.size():
		var slot: Dictionary = slots[i]
		var cfg: Dictionary
		if i < named.size():
			cfg = named[i]
		else:
			var variety := _rng.randf()
			var race: String = races[homes % races.size()]
			cfg = { "kind": "home", "w": _rng.randf_range(9.5, 12.5), "d": _rng.randf_range(8.5, 10.5), "h": _rng.randf_range(4.0, 5.2), "blade": "blade_f%d_home" % floor_number, "name": "Home", "facade": "facade_b" if variety < 0.5 else "facade_a" }
			if homes % 2 == 0:
				cfg.keeper = _pool(race, ["gossip", "trader", "cook", "healer"][homes % 4])
			homes += 1
		cfg.x = slot.x
		cfg.z = slot.z
		cfg.yaw = slot.yaw
		_placed.append(Vector2(slot.x, slot.z))
		Building.build(self, cfg, _look)

	_build_square(races)
	_dress_lanes(W, D)


## Every town has its own street plan. Each plan proposes spots; _layout_slots keeps the ones that fit.
func _layout_slots(W: float, D: float) -> Array[Dictionary]:
	var wanted: Array[Dictionary] = []
	var add := func(x: float, z: float, yaw: float) -> void:
		wanted.append({ "x": x, "z": z, "yaw": yaw })
	match floor_number:
		1:
			# Stairwell Camp: a crooked shanty of containers, nothing quite square
			for row: float in [15.0, 38.0, 62.0]:
				for z: float in [-46.0, -29.0, -13.0, 13.0, 29.0, 46.0]:
					for side: float in [1.0, -1.0]:
						add.call(side * row + _rng.randf_range(-3.0, 3.0), z + _rng.randf_range(-2.5, 2.5), -side * PI / 2.0 + _rng.randf_range(-0.3, 0.3))
		2:
			# The Laundromat: blocks set on the diagonal, like machines in a huge wash hall
			for u: float in [-66.0, -44.0, -22.0, 22.0, 44.0, 66.0]:
				for v: float in [-66.0, -44.0, -22.0, 0.0, 22.0, 44.0, 66.0]:
					var x := (u + v) * 0.707
					var z := (v - u) * 0.707
					add.call(x, z, PI / 4.0 if u < 0.0 else PI / 4.0 + PI)
		3:
			# Soup Row: tight brick terraces along crossing streets, doors facing the street, not the avenue
			for street: float in [-44.0, -14.0, 14.0, 44.0]:
				for x: float in [-64.0, -48.0, -32.0, -16.0, 16.0, 32.0, 48.0, 64.0]:
					add.call(x, street - 8.0 + _rng.randf_range(-0.6, 0.6), 0.0)
					add.call(x, street + 8.0 + _rng.randf_range(-0.6, 0.6), PI)
		4:
			# Food Court Free State: storefronts shoulder to shoulder along a huge open concourse
			for z: float in [-49.0, -35.0, -21.0, -7.0, 7.0, 21.0, 35.0, 49.0]:
				for side: float in [1.0, -1.0]:
					add.call(side * 24.0, z, -side * PI / 2.0)
					add.call(side * 56.0, z, -side * PI / 2.0)
		5:
			# Fort Cul-de-Sac: houses around a turning circle, each with its own lawn
			for ring: Array in [[32.0, 10], [52.0, 14]]:
				for i in int(ring[1]):
					var a := TAU * i / float(ring[1]) + 0.26
					add.call(cos(a) * ring[0] * 1.15, sin(a) * ring[0] * 0.92, atan2(-cos(a), -sin(a)))
		_:
			# The Treehouse: little neighbourhoods clustered around the giant trunks
			for c: Vector2 in _tree_clusters():
				for i in 5:
					var a := TAU * i / 5.0 + c.x * 0.1
					add.call(c.x + cos(a) * 17.0, c.y + sin(a) * 17.0, atan2(cos(a), sin(a)))
	# Keep what fits: inside the walls, clear of the square, avenues, stairs and each other. Nearest the square goes first.
	wanted.sort_custom(func(p: Dictionary, q: Dictionary) -> bool: return p.x * p.x + p.z * p.z < q.x * q.x + q.z * q.z)
	var stairs := Vector2(data.stairs.x, data.stairs.z)
	var kept: Array[Dictionary] = []
	for s: Dictionary in wanted:
		var at := Vector2(s.x, s.z)
		if absf(s.x) > W / 2.0 - 9.5 or absf(s.z) > D / 2.0 - 9.5 or at.length() < 20.0 or absf(s.x) < 11.5:
			continue
		if absf(s.z) < 9.0 or at.distance_to(stairs) < 14.0:
			continue
		var clear := true
		for other: Dictionary in kept:
			if at.distance_to(Vector2(other.x, other.z)) < 14.5:
				clear = false
				break
		if clear:
			kept.append(s)
	return kept


func _tree_clusters() -> Array:
	return [Vector2(-38, -32), Vector2(38, -32), Vector2(-38, 32), Vector2(38, 32)]


func _build_square(races: Array) -> void:
	_build_centrepiece()
	prop("noticeboard", Vector3(7.0, 1.6, -3.2), -0.6)
	quad(Vector2(3.6, 2.2), Models.toon(Color.WHITE, load("res://textures/landing/cork.png"), Vector2.ONE, 0.2), Vector3(6.96, 1.6, -3.14), Vector3(0, -0.6, 0))
	var spots := [Vector2(-6, 3), Vector2(5, 6), Vector2(-4, -7), Vector2(9, 3)]
	var i := 0
	for q: Dictionary in data.get("quest_npcs", []):
		var p: Vector2 = spots[i % spots.size()]
		var path: String
		if q.has("named") and NAMED.has(q.named):
			path = "res://models/npcs/named/%s.glb" % NAMED[q.named]
		else:
			path = _pool(races[0], "quest")
		person(path, Vector3(p.x, 0, p.y), Vector2(-p.x, -p.y).angle_to_point(Vector2.ZERO) + PI)
		interactables.append({ "pos": Vector3(p.x, 0, p.y), "r": 2.8, "text": "%s · %s" % [q.get("name", ""), q.get("title", "")] })
		i += 1
	# a few townsfolk out in the street
	for k in 8:
		var a := k * 0.79 + 0.3
		var r := 11.0 + (k % 3) * 2.5
		person(_pool(races[k % races.size()], ["gossip", "guard", "trader", "cook"][k % 4]), Vector3(cos(a) * r, 0, sin(a) * r), a * 2.0)
	var light: Array = theme.town_light
	for z: float in [-45.0, -15.0, 15.0, 45.0]:
		for x: float in [-7.0, 7.0]:
			prop("lamp_post", Vector3(x, 0, z), 0.0 if x < 0.0 else PI, 1.0, Vector3(0.15, 2.0, 0.15))
		lamp(Color(light[0]), light[1], 22.0, Vector3(0, 5.0, z))
	lamp(Color(light[0]), light[1], 26.0, Vector3(0, 6.0, 0), true)


## The heart of each town is different too.
func _build_centrepiece() -> void:
	match floor_number:
		2:
			prop("washer", Vector3.ZERO, 0.0, 3.4, Vector3(2.5, 2.0, 2.5))
			for i in 6:
				var a := i * TAU / 6.0
				prop("laundry_cart", Vector3(cos(a), 0, sin(a)) * 5.0, a, 1.3, Vector3(0.5, 1.0, 0.5))
		3:
			prop("cauldron", Vector3.ZERO, 0.4, 3.0, Vector3(2.7, 2.0, 2.7))
			lamp(Color("#ff8a2a"), 1.6, 12.0, Vector3(0, 1.5, 0))
			for i in 4:
				var a := i * TAU / 4.0 + 0.7
				prop("market_stall", Vector3(cos(a), 0, sin(a)) * 7.0, -a + PI / 2.0, 1.0, Vector3(1.7, 1.2, 0.7))
		4:
			# the food court itself, with its tables and a kiosk at the middle
			prop("kiosk", Vector3.ZERO, 0.0, 1.3, Vector3(2.9, 1.5, 2.9))
			for i in 10:
				var a := i * TAU / 10.0
				var r := 8.0 + (i % 2) * 5.0
				prop("table_set", Vector3(cos(a) * r, 0, sin(a) * r), a, 1.0, Vector3(0.65, 1.0, 0.65))
		5:
			prop("tree", Vector3.ZERO, 0.0, 1.8, Vector3(0.7, 2.0, 0.7))
			for i in 8:
				var a := i * TAU / 8.0
				prop("hedge", Vector3(cos(a), 0, sin(a)) * 5.0, -a + PI / 2.0, 0.8, Vector3(1.6, 1.0, 0.5))
		6:
			prop("giant_trunk", Vector3.ZERO, 0.0, 1.3, Vector3(2.4, 8.0, 2.4))
			prop("treehouse_platform", Vector3.ZERO, 0.0, 1.0)
			for c: Vector2 in _tree_clusters():
				prop("giant_trunk", Vector3(c.x, 0, c.y), 1.0, 1.1, Vector3(2.1, 8.0, 2.1))
				prop("treehouse_platform", Vector3(c.x, 0, c.y), 0.5, 0.85)
				prop("rope_bridge", Vector3(c.x / 2.0, 0.3, c.y / 2.0), atan2(c.x, c.y))
		_:
			prop("well", Vector3.ZERO, 0.0, 1.0, Vector3(3.6, 1.0, 3.6))


func _dress_lanes(W: float, D: float) -> void:
	var lanes: Array = theme.lanes
	# Clutter goes wherever there's a gap between buildings, never in a doorway or on an avenue.
	var placed := 0
	var tries := 0
	while placed < 44 and tries < 400:
		tries += 1
		var x := _rng.randf_range(-W / 2.0 + 3.0, W / 2.0 - 3.0)
		var z := _rng.randf_range(-D / 2.0 + 3.0, D / 2.0 - 3.0)
		if absf(x) < 8.0 or absf(z) < 7.0 or Vector2(x, z).length() < 16.0:
			continue
		var clear := true
		for b: Vector2 in _placed:
			if b.distance_to(Vector2(x, z)) < 11.5:
				clear = false
				break
		if not clear:
			continue
		var prop_name: String = lanes[_rng.randi() % lanes.size()]
		prop(prop_name, Vector3(x, 0, z), _rng.randf_range(0, TAU), 1.0, _lane_half(prop_name))
		placed += 1


func _lane_half(prop_name: String) -> Vector3:
	match prop_name:
		"car": return Vector3(0.95, 1.0, 2.15)
		"kiosk": return Vector3(2.2, 1.5, 2.2)
		"giant_trunk": return Vector3(1.9, 8.0, 1.9)
		"clothesline", "rope_bridge", "cones", "mushroom", "treehouse_platform", "mailbox": return Vector3.ZERO
		"market_stall": return Vector3(1.7, 1.2, 0.7)
		"washer": return Vector3(0.75, 1.0, 0.75)
		"tree": return Vector3(0.4, 2.0, 0.4)
		"hedge": return Vector3(2.0, 1.0, 0.6)
	return Vector3(0.6, 1.0, 0.6)


func _build_village(v: Dictionary) -> void:
	var X: float = v.x
	var Z: float = v.z
	var races: Array = v.get("races", data.townsfolk.races)
	_wall_with_gates(X, Z, 64.0, 52.0, v.get("gates", ["S", "N"]), 3.6, "gate_" + _slug(v.name))
	plane(Vector2(64, 52), surface("pave", Vector2(64, 52), 8.0, 0.5), Vector3(X, 0.02, Z))
	var slots := [[13.5, -12.0], [-13.5, -12.0], [13.5, 12.0], [-13.5, 12.0]]
	var merchants: Array = v.get("merchants", [])
	for i in slots.size():
		var side: float = signf(slots[i][0])
		var cfg: Dictionary
		if i < merchants.size():
			var m: Dictionary = merchants[i]
			cfg = _shop_cfg(m, races[0])
			cfg.title = "%s · %s" % [m.title, v.name]
		elif i == merchants.size():
			cfg = { "kind": "saferoom", "w": 8.5, "d": 8.0, "h": 4.4, "sign": "safe_f%d" % floor_number, "blade": "blade_f%d_saferoom" % floor_number, "name": "Safe Room", "facade": "facade_b" }
		else:
			cfg = { "kind": "home", "w": 10.0, "d": 9.0, "h": 4.2, "blade": "blade_f%d_home" % floor_number, "name": "Home", "keeper": _pool(races[i % races.size()], "gossip"), "facade": "facade_b" }
		cfg.x = X + slots[i][0]
		cfg.z = Z + slots[i][1]
		cfg.yaw = -side * PI / 2.0
		Building.build(self, cfg, _look)
	var light: Array = theme.town_light
	prop("lamp_post", Vector3(X - 5.0, 0, Z), 0.0, 1.0, Vector3(0.15, 2.0, 0.15))
	lamp(Color(light[0]), light[1], 20.0, Vector3(X, 4.5, Z))
	var lanes: Array = theme.lanes
	for k in 4:
		prop(lanes[k % lanes.size()], Vector3(X + (-1.0 if k % 2 else 1.0) * 5.0, 0, Z - 18.0 + k * 11.0), k * 1.2, 1.0, _lane_half(lanes[k % lanes.size()]))
	person(_pool(races[0], "guard"), Vector3(X + 3.0, 0, Z + 21.0), 0.0)


# ---------------------------------------------------------------- monster camps, landmarks, stairs
func _monster_path(kind: String) -> String:
	var def: Dictionary = Data.monsters.monsters.get(kind, {})
	var model: String = def.get("model", kind)
	for candidate: String in ["res://models/monsters/%s.glb" % model, "res://models/monsters/%s_v0.glb" % model]:
		if ResourceLoader.exists(candidate):
			return candidate
	return ""


func _build_camp(c: Dictionary) -> void:
	var cx: float = c.x
	var cz: float = c.z
	var r: float = c.get("r", 20.0)
	var centre := Vector3(cx, 0, cz)
	# a barricade ring with an opening facing the town
	var open_angle := atan2(-cz, -cx)
	var pieces := int(ceilf(TAU * r / 6.4))
	for i in pieces:
		var a := TAU * i / pieces
		if absf(angle_difference(a, open_angle)) < 0.42:
			continue
		var at := centre + Vector3(cos(a), 0, sin(a)) * r
		prop("barricade", at, -a + PI / 2.0, 1.0, Vector3(3.1, 1.3, 0.3))
	var sign_at := centre + Vector3(cos(open_angle), 0, sin(open_angle)) * (r + 2.0)
	board("camp_" + _slug(c.name), 6.0, 1.5, sign_at + Vector3.UP * 3.4, PI / 2.0 - open_angle)
	for s: float in [-1.0, 1.0]:
		block(Vector3(0.22, 4.0, 0.22), flat(Color("#4a3020")), sign_at + Vector3.UP * 2.0 + Vector3(sin(open_angle), 0, -cos(open_angle)) * s * 2.8)
	prop("bonfire", centre + Vector3(0, 0, 6.0), 0.0, 1.0, Vector3(0.9, 1.0, 0.9))
	lamp(Color("#ff9a3a"), 2.4, 18.0, centre + Vector3(0, 2.4, 6.0), true)
	prop("camp_banner", centre + Vector3(-3.0, 0, -5.0), 0.3)
	for i in 4:
		var a := i * TAU / 4.0 + 0.6
		prop("tent", centre + Vector3(cos(a), 0, sin(a)) * r * 0.64, -a, 1.0, Vector3(1.6, 1.0, 1.9))
	var extras: Array = CAMP_PROPS.get(c.get("style", "cone"), ["crates", "barrels", "boxes"])
	for i in 9:
		var a := i * 0.7 + 0.2
		var d := r * (0.34 + (i % 3) * 0.14)
		var extra: String = extras[i % extras.size()]
		prop(extra, centre + Vector3(cos(a), 0, sin(a)) * d, a * 1.7, 1.0, _lane_half(extra) if extra in ["kiosk", "hedge"] else Vector3.ZERO)
	# the boss and a few of the crew, standing where they'll fight in Phase 2
	if c.has("boss") and c.boss != null:
		var boss_path := _monster_path(c.boss)
		if boss_path != "":
			person(boss_path, centre, open_angle + PI / 2.0)
	var mob: Variant = c.get("mob", "goblin")
	var kinds: Array = mob if mob is Array else [mob]
	for i in 3:
		var path := _monster_path(kinds[i % kinds.size()])
		var a := open_angle + (i - 1) * 0.7
		if path != "":
			person(path, centre + Vector3(cos(a), 0, sin(a)) * r * 0.42, a + PI / 2.0)
	interactables.append({ "pos": centre + Vector3(cos(open_angle), 0, sin(open_angle)) * (r + 1.0), "r": 6.0, "text": "%s · level %s" % [c.name, c.get("level", "?")] })


func _build_landmark(l: Dictionary) -> void:
	var spec: Array = LANDMARKS.get(l.name, ["junk_pile", 2.0, "#ffffff"])
	var at := Vector3(l.x, 0, l.z)
	var half := 2.5 * float(spec[1]) if spec[0] in ["washer", "cauldron", "sock_pile"] else 3.0
	prop(spec[0], at, 0.6, spec[1], Vector3(half * 0.4, 3.0, half * 0.4))
	lamp(Color(spec[2]), 3.0, 30.0, at + Vector3(0, 7.0, 6.0), true)
	var front := at + Vector3(0, 0, float(l.get("r", 16.0)) * 0.7)
	board("land_" + _slug(l.name), 7.0, 1.75, front + Vector3.UP * 3.0, 0.0)
	for s: float in [-1.0, 1.0]:
		block(Vector3(0.24, 3.0, 0.24), flat(Color("#3a3038")), front + Vector3(s * 3.3, 1.5, 0))
	interactables.append({ "pos": front, "r": 6.0, "text": str(l.name) })


func _build_stairs() -> void:
	var st: Dictionary = data.stairs
	var at := Vector3(st.x, 0, st.z)
	var to := int(st.to)
	prop("stair_door", at + Vector3(0, 0, -4.0))
	box_collider(at + Vector3(0, 3.5, -4.0), Vector3(4.0, 3.5, 1.0))
	lamp(Color("#5aff7a"), 1.1, 11.0, at + Vector3(0, 3.4, 1.0))
	var label := "Press E: take the stairs down to Floor %d" % to if Data.floors.has(str(to)) else "The way to Floor %d (not built yet)" % to
	var entry := { "pos": at, "r": 4.5, "text": label }
	if Data.floors.has(str(to)):
		entry.to = to
	interactables.append(entry)
