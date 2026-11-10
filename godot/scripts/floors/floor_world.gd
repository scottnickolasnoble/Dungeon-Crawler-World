class_name FloorWorld
extends FloorKit
## Floors 1-9. The layout comes from data/floors.json (the prototype's backbone: same town, village, camp, landmark and
## stair positions). THEMES below gives every floor its own mood, materials and town character.
## Monsters stand at their camps as stand-ins until combat arrives in Phase 2.

## Floors grow as you go down. Their towns and camps keep the prototype's positions, with new land around the outside.
const FLOOR_SIZES := { 1: 720.0, 2: 860.0, 3: 1000.0, 4: 1100.0, 5: 1200.0, 6: 1300.0, 7: 1400.0, 8: 1500.0, 9: 1600.0, 10: 1650.0, 11: 1700.0, 12: 1750.0, 13: 1800.0, 14: 1850.0, 15: 1900.0, 16: 1950.0, 17: 2000.0, 18: 2050.0 }
const THEMES := {
	1: { "bg": "#17120e", "fog": "#23283a", "fog_near": 14.0, "fog_far": 120.0, "vol": 0.016, "sky": ["#8a94b0", "#4a4650", "#606478"], "ambient": 0.34, "key": ["#ffcf8a", 0.0], "ground_tile": 16.0, "town_light": ["#ffb860", 3.0], "particles": "drips", "roof": "flat", "trim": "#55504a", "roof_color": "#4a4640", "ceiling": "#3a3430", "room_light": 1.5, "rug": "#6a3a2a", "perimeter": "facade_b", "scatter": [["concrete_pillar", 620, Vector3(0.6, 3.0, 0.6), 1.0, 1.0, true], ["car", 170, Vector3(0.95, 1.0, 2.15), 0.95, 1.05, false], ["tires", 40, Vector3(0.5, 1.0, 0.5), 1.0, 1.0, false]], "lanes": ["car", "tires", "barrels", "sandbags", "cones", "crates", "boxes"] },
	2: { "bg": "#14262a", "fog": "#7fb0ac", "fog_near": 16.0, "fog_far": 135.0, "vol": 0.012, "sky": ["#c8f4ea", "#2a4a44", "#6a9a90"], "ambient": 0.36, "key": ["#e8fff8", 0.3], "ground_tile": 9.0, "town_light": ["#c8fff0", 1.4], "particles": "lint", "roof": "flat", "trim": "#2f7a7a", "roof_color": "#b8c8c4", "ceiling": "#d8e8e2", "room_light": 0.9, "rug": "#2f7a7a", "perimeter": "facade_a", "scatter": [["washer", 260, Vector3(0.75, 1.0, 0.75), 1.0, 2.6, false], ["clothesline", 80, Vector3.ZERO, 1.0, 1.0, false], ["laundry_cart", 90, Vector3(0.5, 1.0, 0.5), 1.0, 1.4, false]], "lanes": ["washer", "laundry_cart", "clothesline", "barrels", "boxes", "wet_floor"] },
	3: { "timber": true, "bg": "#2a1610", "fog": "#6a4a30", "fog_near": 10.0, "fog_far": 100.0, "vol": 0.022, "sky": ["#c8b8b0", "#3a2a24", "#8a7468"], "ambient": 0.42, "key": ["#ffc890", 0.26], "ground_tile": 11.0, "town_light": ["#ffb070", 1.8], "particles": "steam", "roof": "gable", "trim": "#4a3020", "roof_color": "#6a3a2a", "ceiling": "#4a3020", "room_light": 0.95, "rug": "#7a2a1e", "chimney": true, "perimeter": "facade_a", "scatter": [["pipes", 240, Vector3(0.6, 3.0, 0.6), 1.0, 2.2, false], ["cauldron", 90, Vector3(0.95, 1.0, 0.95), 1.0, 1.8, false], ["barrels", 90, Vector3(0.9, 1.0, 0.8), 1.0, 1.2, false]], "lanes": ["cauldron", "pipes", "barrels", "crates", "market_stall", "bench"] },
	4: { "bg": "#30303c", "fog": "#b8b0b8", "fog_near": 22.0, "fog_far": 150.0, "vol": 0.0, "sky": ["#ffffff", "#7a7078", "#dcd4d0"], "ambient": 0.27, "key": ["#ffffff", 0.08], "ground_tile": 8.0, "town_light": ["#fff0d8", 1.4], "particles": "confetti", "roof": "flat", "trim": "#e8398c", "roof_color": "#a8a8b0", "ceiling": "#efe8dc", "room_light": 0.85, "rug": "#6d4a8c", "perimeter": "facade_b", "scatter": [["kiosk", 36, Vector3(2.2, 1.5, 2.2), 1.0, 1.0, false], ["mannequin", 240, Vector3(0.3, 1.0, 0.3), 1.0, 1.1, false], ["plant", 30, Vector3(0.4, 1.0, 0.4), 1.2, 1.6, false], ["column", 240, Vector3(0.6, 3.0, 0.6), 1.0, 1.0, true]], "lanes": ["kiosk", "mannequin", "plant", "bench", "trash_can", "market_stall"] },
	5: { "bg": "#8ac8f0", "fog": "#bfe2f8", "fog_near": 45.0, "fog_far": 240.0, "vol": 0.0, "sky": ["#d8f0ff", "#5a8a3a", "#a8d0d0"], "ambient": 0.46, "key": ["#fff0d0", 0.75], "ground_tile": 10.0, "town_light": ["#fff4e0", 0.8], "particles": "pollen", "roof": "gable", "trim": "#f4f1e8", "roof_color": "#a0483a", "ceiling": "#f4efe0", "room_light": 0.8, "rug": "#a0483a", "perimeter": "fence", "scatter": [["tree", 420, Vector3(0.45, 2.0, 0.45), 0.9, 1.6, false], ["hedge", 340, Vector3(2.0, 1.0, 0.6), 1.0, 1.0, false], ["mailbox", 200, Vector3(0.2, 1.0, 0.2), 1.0, 1.0, false], ["fence", 280, Vector3(3.0, 1.0, 0.12), 1.0, 1.0, false]], "lanes": ["tree", "hedge", "mailbox", "bench", "cones", "table_set"] },
	6: { "bg": "#050c0a", "fog": "#0c2020", "fog_near": 9.0, "fog_far": 88.0, "vol": 0.024, "sky": ["#9ac8e0", "#0c1416", "#2a4a50"], "ambient": 0.24, "key": ["#9ac8ff", 0.12], "ground_tile": 9.0, "town_light": ["#ffc870", 1.8], "particles": "fireflies", "roof": "cone", "trim": "#4a3420", "roof_color": "#8a7a3e", "ceiling": "#3e2c18", "room_light": 1.0, "rug": "#4a6a2a", "perimeter": "facade_a", "scatter": [["giant_trunk", 170, Vector3(1.9, 8.0, 1.9), 0.9, 1.8, true], ["mushroom", 420, Vector3.ZERO, 0.9, 2.2, false]], "lanes": ["mushroom", "giant_trunk", "treehouse_platform", "barrels", "rope_bridge"] },
	7: { "bg": "#071416", "fog": "#1c3a3c", "fog_near": 10.0, "fog_far": 95.0, "vol": 0.026, "sky": ["#8fd8d0", "#0c1a1c", "#3a6a68"], "ambient": 0.36, "key": ["#a8e8e0", 0.16], "ground_tile": 9.0, "town_light": ["#ffc878", 2.0], "particles": "drips", "roof": "flat", "trim": "#3a5a58", "roof_color": "#2a3a3a", "ceiling": "#22302e", "room_light": 1.0, "rug": "#2a5a58", "perimeter": "facade_b", "scatter": [], "lanes": ["barrels", "crates", "pipes", "wet_floor", "boxes"] },
	8: { "bg": "#120a06", "fog": "#2a1c14", "fog_near": 12.0, "fog_far": 105.0, "vol": 0.024, "sky": ["#d8c0a0", "#160e08", "#5a4a38"], "ambient": 0.3, "key": ["#ffd8b0", 0.12], "ground_tile": 10.0, "town_light": ["#ffb050", 2.2], "particles": "steam", "roof": "flat", "trim": "#5a3a1e", "roof_color": "#3a2a1c", "ceiling": "#2a1e14", "room_light": 1.05, "rug": "#7a4a1e", "perimeter": "facade_b", "scatter": [], "lanes": ["crates", "barrels", "pipes", "junk_pile", "workbench"] },
	9: { "bg": "#0a0812", "fog": "#2a2238", "fog_near": 14.0, "fog_far": 125.0, "vol": 0.02, "sky": ["#c8b8e8", "#100c18", "#54486a"], "ambient": 0.34, "key": ["#d8c8ff", 0.16], "ground_tile": 8.0, "town_light": ["#ffd68a", 2.2], "particles": "fireflies", "roof": "flat", "trim": "#5a7a6a", "roof_color": "#3a4a44", "ceiling": "#241e30", "room_light": 1.0, "rug": "#5a2a6a", "perimeter": "facade_a", "scatter": [], "lanes": ["barrels", "crates", "bench", "lamp_post", "boxes"] },
	10: { "bg": "#120e14", "fog": "#3a3040", "fog_near": 18.0, "fog_far": 150.0, "vol": 0.01, "sky": ["#e8d8c8", "#1a1420", "#6a5a6a"], "ambient": 0.4, "key": ["#fff0d8", 0.35], "ground_tile": 10.0, "town_light": ["#ffe0a0", 2.4], "particles": "confetti", "roof": "flat", "trim": "#c8a040", "roof_color": "#2a2a30", "ceiling": "#18141c", "room_light": 1.2, "rug": "#7a1a2a", "perimeter": "facade_a", "scatter": [], "lanes": ["crates", "boxes", "spotlight", "folding_chair", "barrels"] },
	11: { "bg": "#0e1a24", "fog": "#3a5a6a", "fog_near": 20.0, "fog_far": 170.0, "vol": 0.008, "sky": ["#d8ecff", "#16242e", "#5a7a8a"], "ambient": 0.42, "key": ["#ffffff", 0.45], "ground_tile": 9.0, "town_light": ["#e8f4ff", 2.6], "particles": "confetti", "roof": "flat", "trim": "#e8398c", "roof_color": "#2a3a48", "ceiling": "#16222c", "room_light": 1.2, "rug": "#1a5a8a", "perimeter": "facade_a", "scatter": [], "lanes": ["barrier", "crates", "bench", "lamp_post", "trash_can"] },
	12: { "bg": "#1a1018", "fog": "#4a2a3a", "fog_near": 12.0, "fog_far": 110.0, "vol": 0.016, "sky": ["#ffd8e8", "#1a0c14", "#7a4a5a"], "ambient": 0.38, "key": ["#ffe0f0", 0.2], "ground_tile": 7.0, "town_light": ["#ffd0e0", 2.2], "particles": "confetti", "roof": "flat", "trim": "#f5c518", "roof_color": "#3a2030", "ceiling": "#2a1824", "room_light": 1.3, "rug": "#8a1a4a", "perimeter": "facade_b", "scatter": [], "lanes": ["folding_chair", "boxes", "plant", "spotlight", "bench"] },
	13: { "timber": true, "bg": "#120e08", "fog": "#3a2e1e", "fog_near": 14.0, "fog_far": 130.0, "vol": 0.02, "sky": ["#f0e0b8", "#140e08", "#6a5a3a"], "ambient": 0.36, "key": ["#ffe8b0", 0.2], "ground_tile": 8.0, "town_light": ["#ffd890", 2.0], "particles": "lint", "roof": "gable", "trim": "#8a5a2a", "roof_color": "#3a2a1a", "ceiling": "#20180e", "room_light": 1.0, "rug": "#5a1a1a", "perimeter": "facade_a", "scatter": [], "lanes": ["shelf", "boxes", "lamp_post", "bench", "crates"] },
	14: { "timber": true, "bg": "#06080c", "fog": "#2a3038", "fog_near": 8.0, "fog_far": 95.0, "vol": 0.03, "sky": ["#a8b8c8", "#06080c", "#3a4450"], "ambient": 0.3, "key": ["#b8c8e8", 0.18], "ground_tile": 9.0, "town_light": ["#ffb860", 2.2], "particles": "drips", "roof": "gable", "trim": "#3a3a40", "roof_color": "#1e2228", "ceiling": "#0a0c10", "room_light": 0.9, "rug": "#4a0a14", "perimeter": "facade_a", "scatter": [], "lanes": ["barrels", "crates", "lamp_post", "fence", "tires"], "chimney": true },
	15: { "bg": "#081018", "fog": "#6a8aa8", "fog_near": 16.0, "fog_far": 140.0, "vol": 0.014, "sky": ["#e0f4ff", "#0a1420", "#5a7a98"], "ambient": 0.38, "key": ["#d8f0ff", 0.3], "ground_tile": 8.0, "town_light": ["#ffc890", 2.2], "particles": "lint", "roof": "flat", "trim": "#4a8ab8", "roof_color": "#2a3a4a", "ceiling": "#101820", "room_light": 1.1, "rug": "#1a3a5a", "perimeter": "facade_b", "scatter": [], "lanes": ["crates", "boxes", "barrels", "pipes", "filing"] },
	16: { "bg": "#0a0a12", "fog": "#2a2a48", "fog_near": 20.0, "fog_far": 180.0, "vol": 0.01, "sky": ["#d8d8ff", "#08080e", "#4a4a7a"], "ambient": 0.36, "key": ["#c8c8ff", 0.25], "ground_tile": 9.0, "town_light": ["#ff6a6a", 2.0], "particles": "fireflies", "roof": "flat", "trim": "#c81a2a", "roof_color": "#2a2a3a", "ceiling": "#0e0e18", "room_light": 1.1, "rug": "#2a1a4a", "perimeter": "facade_a", "scatter": [], "lanes": ["crates", "barrels", "lamp_post", "boxes", "conduit"] },
	17: { "bg": "#7ab8d8", "fog": "#c8e0e8", "fog_near": 30.0, "fog_far": 200.0, "vol": 0.004, "sky": ["#ffffff", "#7ab8d8", "#c8e8f0"], "ambient": 0.5, "key": ["#fff8e0", 0.7], "ground_tile": 9.0, "town_light": ["#fff0c0", 2.0], "particles": "pollen", "roof": "gable", "trim": "#ffffff", "roof_color": "#c84a3a", "ceiling": "#8ac8e8", "room_light": 1.3, "rug": "#c8a060", "perimeter": "fence", "scatter": [], "lanes": ["mailbox", "hedge", "fence", "bench", "lamp_post"] },
	18: { "bg": "#e8e8e4", "fog": "#e0e0dc", "fog_near": 24.0, "fog_far": 210.0, "vol": 0.006, "sky": ["#ffffff", "#d8d8d4", "#f0f0ec"], "ambient": 0.55, "key": ["#ffffff", 0.4], "ground_tile": 12.0, "town_light": ["#ffffff", 1.4], "particles": "lint", "roof": "flat", "trim": "#8a8a86", "roof_color": "#a8a8a4", "ceiling": "#f4f4f0", "room_light": 1.2, "rug": "#8a8a86", "perimeter": "facade_a", "scatter": [], "lanes": ["concrete_pillar", "bench", "filing", "boxes", "crates"] },
}
## Who wears what. Everyone uses a stand-in model from the prototype until the redesign reaches them.
const NAMED := { "marta": "martaVance", "pickles": "pickles", "spin": "spinCycle", "reggie": "oldReggie", "wickley": "wickley", "ash": "brotherAsh", "sunny": "sunnySponsorRep", "prickle": "madamePrickle", "deb": "bigDeb", "watch": "neighbourhoodWatch", "gusset": "gusset", "lantern": "elderLantern" }
const GUILD_MASTERS := [["Archmage Pell", "The Collegium (mages)", "lumen"], ["Foreman Gruss", "Tradesfolk Union", "stoneblood"], ["Supervisor Mox", "The Night Shift", "fennix"], ["Matron Hale", "Caregivers' Lodge", "human"]]
const CAMP_PROPS := { "cone": ["cones", "cones", "sandbags"], "lamprey": ["barrels", "wet_floor", "pipes"], "moth": ["ceiling_light", "lamp_post", "crates"], "pigeon": ["crates", "boxes", "bench"], "mimic": ["boxes", "junk_pile", "food_shelf"], "wight": ["wet_floor", "barrels", "pipes"], "hag": ["cauldron", "barrels", "table_set"], "mall": ["kiosk", "mannequin", "boxes"], "leech": ["boxes", "food_shelf", "junk_pile"], "slime": ["table_set", "barrels", "kiosk"], "gnome": ["mailbox", "hedge", "fence"], "hound": ["hedge", "tires", "crates"], "hunter": ["tent", "crates", "table_set"], "wyrm": ["wet_floor", "barrels", "pipes"], "debt": ["crates", "boxes", "table_set"], "sewage": ["barrels", "junk_pile", "tires"], "mole": ["crates", "barrels", "workbench"], "grease": ["cauldron", "barrels", "food_shelf"], "mold": ["mushroom", "barrels", "boxes"], "rat": ["junk_pile", "barrels", "crates"], "civic": ["bench", "boxes", "lectern"] }
## [prop, scale, glow colour] for each landmark on the floors.
const LANDMARKS := { "The Ramp Spiral": ["concrete_pillar", 2.2, "#ffb24a"], "The Burning Bus": ["bus", 1.0, "#ff7a2a"], "The Exit Sign": ["stair_door", 2.2, "#5aff7a"], "The Great Dryer": ["washer", 8.0, "#c8fff0"], "Soap Falls": ["sock_pile", 3.0, "#a8e8ff"], "Sock Mountain": ["sock_pile", 8.0, "#fff0c0"], "Auntie Brine's Pot": ["cauldron", 7.0, "#ff8a2a"], "Scratch Marks": ["junk_pile", 2.0, "#c8a8ff"], "The Escalator to Nowhere": ["escalator", 1.0, "#ffffff"], "The Block Party": ["table_set", 2.0, "#ff6ac8"], "The Tallest Tree": ["giant_trunk", 3.2, "#5affc8"], "The Sluice Gate": ["sluice_gate", 1.0, "#8afff0"], "The Bright Seam": ["gem_seam", 1.0, "#ffd88a"], "The Founders Lantern": ["founders_lantern", 1.0, "#ffe08a"] }

var world_size := 720.0
var theme: Dictionary
var data: Dictionary
var spawn := Vector3(0, 0, 52)
var _zones: Array = []
var _rng := RandomNumberGenerator.new()
var _particles: GPUParticles3D
var _look: Dictionary
var _placed: Array[Vector2] = []
## Floors with a hand-built outdoors use this instead of the scatter. Floor 1 is the first.
var wilds: Wilds
var _clock := 0.0


func setup(floor_index: int) -> FloorWorld:
	floor_number = floor_index
	world_size = FLOOR_SIZES.get(floor_index, 720.0)
	theme = THEMES[floor_index]
	# a copy, because the camps and stairs get moved further out on the big floors
	data = Data.floors[str(floor_index)].duplicate(true)
	_rng.seed = 1000 + floor_index
	draw_distance = 230.0 if floor_index >= OPEN_FROM else minf(float(theme.fog_far) + 14.0, 190.0)
	spawn = Vector3(float(data.spawn[0]), 0, float(data.spawn[2]))
	_choose_chamber_hosts()
	_look = { "roof": theme.roof, "trim": Color(theme.trim), "roof_color": Color(theme.roof_color), "ceiling": Color(theme.ceiling), "room_light": theme.room_light, "rug": Color(theme.rug), "chimney": theme.get("chimney", false), "timber": theme.get("timber", false) }
	return self


func _ready() -> void:
	begin_kit()
	_build_mood()
	_build_shell()
	_reserve_zones()
	_build_hub()
	for v: Dictionary in data.get("villages", []):
		_build_village(v)
	# Floors 4 and down place their boss camps and stairs later, once the districts have taken their land.
	if floor_number < PUSH_FROM_FLOOR:
		for c: Dictionary in data.get("camps", []):
			_build_camp(c)
	for l: Dictionary in data.get("landmarks", []):
		_build_landmark(l)
	if floor_number < PUSH_FROM_FLOOR:
		_build_stairs()
	if floor_number == 1:
		_build_story_f1()
	wilds = [WildsF1, WildsF2, WildsF3, WildsF4, WildsF5, WildsF6, WildsF7, WildsF8, WildsF9, WildsF10, WildsF11, WildsF12, WildsF13, WildsF14, WildsF15, WildsF16, WildsF17, WildsF18][floor_number - 1].new()
	wilds.build(self)
	QuestLines.build(self)
	wild = WildSpawner.populate(self)


func _process(delta: float) -> void:
	_clock += delta
	if wilds:
		wilds.animate(_clock, get_tree().get_first_node_in_group("player") as Node3D)
		_flood_level(delta)
	if not hazard.is_empty():
		_hazard_tick(delta)
	# weather follows the player, so it's everywhere without costing the whole 720 m
	if _particles:
		var player := get_tree().get_first_node_in_group("player") as Node3D
		if player:
			_particles.global_position = player.global_position + Vector3.UP * 3.0


func ruin_look() -> Dictionary:
	var look := _look.duplicate()
	look.room_light = float(_look.room_light) * 0.5
	look.ceiling = (_look.ceiling as Color).darkened(0.4)
	return look


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
	env.background_mode = Environment.BG_SKY if is_open_world() else Environment.BG_COLOR
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
	if is_open_world():
		# open floors: a long, thinning haze, so mountains loom out of it miles off and what's near stays sharp
		env.fog_depth_begin = maxf(float(theme.fog_near), 40.0)
		env.fog_depth_end = clampf(float(theme.fog_far) * 3.5, 480.0, 900.0)
		env.fog_depth_curve = 1.6
		env.fog_sky_affect = 0.55
	if float(theme.vol) > 0.0:
		env.volumetric_fog_enabled = true
		env.volumetric_fog_density = float(theme.vol) * (0.45 if is_open_world() else 1.0)
		env.volumetric_fog_albedo = Color(theme.fog).lightened(0.25)
		env.volumetric_fog_length = 64.0
		env.volumetric_fog_ambient_inject = 1.0
		env.volumetric_fog_sky_affect = 0.0
	if floor_number == 1:
		env.ssr_enabled = true
		env.ssr_max_steps = 48
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
	var world := Vector2(world_size, world_size)
	ground_mat = Models.toon(Color.WHITE, surface_tex("ground"), world / float(theme.ground_tile), 0.55)
	var ground := plane(world, ground_mat, Vector3.ZERO)
	ground.visibility_range_end = 0.0
	box_collider(Vector3(0, -0.5, 0), Vector3(world_size / 2.0 + 4.0, 0.5, world_size / 2.0 + 4.0))
	if is_open_world():
		for s: Array in [[Vector3(0, 0, -world_size / 2.0), true], [Vector3(0, 0, world_size / 2.0), true], [Vector3(-world_size / 2.0, 0, 0), false], [Vector3(world_size / 2.0, 0, 0), false]]:
			box_collider(s[0] + Vector3.UP * 300.0, Vector3(world_size / 2.0 if s[1] else 1.0, 300.0, 1.0 if s[1] else world_size / 2.0))
		_far_mountains()
		return
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
	box_collider(Vector3(0, ceil_h + 0.5, 0), Vector3(world_size / 2.0 + 4.0, 0.5, world_size / 2.0 + 4.0))
	var wall_mat := Models.toon(Color.WHITE, surface_tex("facade_b"), Vector2(world_size, ceil_h) / 8.0, 0.4)
	for s: Array in [[Vector3(0, 0, -world_size / 2.0), 0.0], [Vector3(0, 0, world_size / 2.0), PI], [Vector3(-world_size / 2.0, 0, 0), PI / 2.0], [Vector3(world_size / 2.0, 0, 0), -PI / 2.0]]:
		var q := quad(Vector2(world_size, ceil_h), wall_mat, s[0] + Vector3.UP * ceil_h / 2.0, Vector3(0, s[1], 0))
		q.visibility_range_end = 0.0
		q.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		box_collider(s[0] + Vector3.UP * ceil_h, Vector3(world_size / 2.0 if s[1] in [0.0, PI] else 0.5, ceil_h, 0.5 if s[1] in [0.0, PI] else world_size / 2.0))


func _reserve_zones() -> void:
	var hub: Dictionary = data.hub
	_zones.append(Rect2(-hub.w / 2.0 - 16.0, -hub.d / 2.0 - 16.0, hub.w + 32.0, hub.d + 32.0))
	for v: Dictionary in data.get("villages", []):
		_zones.append(Rect2(v.x - 46.0, v.z - 40.0, 92.0, 80.0))
	if floor_number < PUSH_FROM_FLOOR:
		for c: Dictionary in data.get("camps", []):
			var r: float = c.get("r", 20.0) + 8.0
			_zones.append(Rect2(c.x - r, c.z - r, r * 2.0, r * 2.0))
		_zones.append(Rect2(data.stairs.x - 14.0, data.stairs.z - 14.0, 28.0, 28.0))
	for l: Dictionary in data.get("landmarks", []):
		_zones.append(Rect2(l.x - 24.0, l.z - 24.0, 48.0, 48.0))


## Storybook towers on a town's wall: one at every corner and one either side of every gate (Floor 3 down, where
## the ceilings are high enough).
func _town_towers(cx: float, cz: float, w: float, d: float, gates: Array, height: float) -> void:
	if floor_number < TERRAIN_FROM_FLOOR:
		return
	var stone: Material = surface("facade_a", Vector2(20, height + 9.0), 6.0, 0.4)
	var big := height + 9.0 if w > 100.0 else height + 6.0
	for sx: float in [-1.0, 1.0]:
		for sz: float in [-1.0, 1.0]:
			storybook_tower(Vector3(cx + sx * w / 2.0, 0, cz + sz * d / 2.0), 3.6 if w > 100.0 else 2.6, big, stone)
	var gate_spots := { "N": [Vector3(cx, 0, cz - d / 2.0), Vector3(1, 0, 0)], "S": [Vector3(cx, 0, cz + d / 2.0), Vector3(1, 0, 0)], "W": [Vector3(cx - w / 2.0, 0, cz), Vector3(0, 0, 1)], "E": [Vector3(cx + w / 2.0, 0, cz), Vector3(0, 0, 1)] }
	for key: String in gates:
		var spot: Array = gate_spots[key]
		for s: float in [-1.0, 1.0]:
			storybook_tower(spot[0] + spot[1] * s * 7.6, 2.4, height + 4.0, stone)


## Marks land as taken, so filler never builds over a district or across a road.
func reserve(area: Rect2) -> void:
	_zones.append(area)


func is_free(x: float, z: float, pad: float) -> bool:
	for r: Rect2 in _zones:
		if r.grow(pad).has_point(Vector2(x, z)):
			return false
	return absf(x) < world_size / 2.0 - 6.0 and absf(z) < world_size / 2.0 - 6.0


## Fills the open floor outside the towns: hundreds of props, drawn as one batch each so they stay cheap.
func _scatter_world() -> void:
	for spec: Array in theme.scatter:
		var source := Models.batch_mesh(TOWN_PROPS % spec[0] if ResourceLoader.exists(TOWN_PROPS % spec[0]) else LANDING_PROPS % spec[0])
		if source == null:
			continue
		var transforms: Array[Transform3D] = []
		var count: int = spec[1]
		var half: Vector3 = spec[2]
		var grid_step := world_size / ceilf(sqrt(count)) if spec[5] else 0.0
		var tries := 0
		while transforms.size() < count and tries < count * 6:
			tries += 1
			var x: float
			var z: float
			if spec[5]:
				var cells := int(ceilf(sqrt(count)))
				x = -world_size / 2.0 + (float(tries % cells) + 0.5) * grid_step
				z = -world_size / 2.0 + (float(int(tries / float(cells)) % cells) + 0.5) * grid_step
			else:
				x = _rng.randf_range(-world_size / 2.0, world_size / 2.0)
				z = _rng.randf_range(-world_size / 2.0, world_size / 2.0)
			if not is_free(x, z, 3.0):
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
	var x := -world_size / 2.0 + step / 2.0
	while x < world_size / 2.0:
		var z := -world_size / 2.0 + step / 2.0
		while z < world_size / 2.0:
			if is_free(x, z, 0.0) or floor_number != 1:
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
	_town_towers(cx, cz, w, d, gates, height)
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


## The redesigned characters, by the monster's id in monsters.json. Each one replaces its prototype stand-in once it exists.
const REDESIGNED := { "goblin": "traffic_cone_goblin", "cardboard": "cardboard_goblin", "thrower": "cone_chucker", "captain": "cone_captain", "pylon": "sergeant_pylon", "wight": "mop_wight", "lamprey": "drain_lamprey", "bigSucker": "the_big_sucker", "moth": "fluorescent_moth", "mothMatron": "the_moth_matron", "pigeon": "pigeon_ghoul", "pigeonElder": "the_pigeon_elder", "mimic": "vending_mimic", "lostfound": "the_lost_found", "ebb": "head_custodian_ebb", "dave": "the_machine_that_ate_dave", "lintKing": "the_lint_king", "bulbQueen": "the_bulb_queen", "coo": "old_man_coo", "coneKing": "the_cone_king", "gristle": "grandma_gristle", "kevlar": "captain_kevlar", "notice": "the_final_notice", "blob": "the_birthday_blob", "kraken": "the_food_court_kraken", "mallmother": "the_mall_mother", "pope": "the_gnome_pope", "fetch": "mr_fetch", "hoa": "the_hoa_president", "mayor": "mayor_eternal", "sludge": "auntie_sludge", "matriarch": "the_dog_park_matriarch", "huntLord": "lord_hunter_facet", "mallcop": "mall_cop_ogre", "hound": "cul_de_sac_hound", "hag": "gutter_hag", "slime": "bounce_house_slime", "gnome": "lawn_gnome_cultist", "leech": "coupon_leech", "hunter": "tourist_hunter", "wyrm": "sewer_wyrm", "collector": "clockwork_debt_collector", "choir": "fungal_choir", "molekin": "tunnel_mole_kin", "grease": "grease_golem", "ratking": "ratking_choir", "troll": "cave_troll", "bathwater": "old_lady_bathwater", "landlord": "the_landlord", "organ": "pipe_organ_wyrm", "sanking": "the_sanitation_king", "repo": "repossessor_mk_ix", "grubtooth": "chief_grubtooth", "drill": "drill_prophet", "fryer": "the_deep_fryer", "baron": "the_fryer_baron", "mold": "big_momma_mold", "soloist": "the_soloist", "ratthrone": "the_rat_throne_king", "senate": "the_rat_senate_speaker", "lockjaw": "lockjaw", "undermayor": "the_undermayor" }


func _pool(race: String, role: String) -> String:
	var redesigned := "res://models/characters/%s_townsperson.glb" % race
	if ResourceLoader.exists(redesigned):
		return redesigned
	var path := "res://models/npcs/pool/%s_%s.glb" % [race, role]
	return path if ResourceLoader.exists(path) else "res://models/npcs/pool/human_trader.glb"


## Named characters by quest id, as their new models.
const NAMED_CAST := { "marta": "marta_vance", "pickles": "pickles", "spin": "spin_cycle", "reggie": "old_reggie", "wickley": "wickley", "ash": "brother_ash", "sunny": "sunny_the_sponsor_rep", "prickle": "madame_prickle", "deb": "big_deb", "watch": "neighbourhood_watch", "gusset": "gusset", "lantern": "elder_lantern", "nan": "nan_gangway", "tuck": "foreman_tuck", "verdigris": "sister_verdigris", "bo": "benchwright_bo" }


func _is_monster(path: String) -> bool:
	return REDESIGNED.values().has(path.get_file().get_basename())


## A character's own model, found from their name ("Rusty Kell" is characters/rusty_kell.glb), or "" if they haven't one.
func _cast_path(person_name: String) -> String:
	var slug := _slug(person_name.replace("’", "").replace("'", ""))
	if slug.begins_with("bo_s") or slug.begins_with("bos_"):
		slug = "benchwright_bo"
	for candidate: String in [slug, slug.trim_prefix("the_"), slug + "_the_innkeeper"]:
		var path := "res://models/characters/%s.glb" % candidate
		if ResourceLoader.exists(path):
			return path
	return ""


func _keeper_path(m: Dictionary, fallback_race: String) -> String:
	if m.has("model") and ResourceLoader.exists("res://models/characters/%s.glb" % m.model):
		return "res://models/characters/%s.glb" % m.model
	if m.has("named") and NAMED_CAST.has(m.named) and ResourceLoader.exists("res://models/characters/%s.glb" % NAMED_CAST[m.named]):
		return "res://models/characters/%s.glb" % NAMED_CAST[m.named]
	var own := _cast_path(str(m.get("name", "")))
	if own != "":
		return own
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
		var shop := _shop_cfg(m, races[0])
		shop.npc = str(m.id) if Story.dialogue.has(str(m.id)) else "merchant"
		named.append(shop)
	named.append({ "kind": "inn", "w": 15.0, "d": 11.5, "h": 6.2, "sign": "inn_f%d" % floor_number, "blade": "blade_f%d_inn" % floor_number, "name": data.get("innkeeper", "Innkeeper"), "title": "The Inn · rest and heal", "npc": "innkeeper", "keeper": _cast_path(str(data.get("innkeeper", ""))) if _cast_path(str(data.get("innkeeper", ""))) != "" else _pool(races[0], "cook"), "facade": "facade_b" })
	named.append({ "kind": "saferoom", "w": 9.0, "d": 8.5, "h": 4.6, "sign": "safe_f%d" % floor_number, "blade": "blade_f%d_saferoom" % floor_number, "name": "Safe Room", "facade": "facade_b" })
	if floor_number >= 3:
		var masters := []
		for gm: Array in GUILD_MASTERS:
			var own := _cast_path(gm[0])
			masters.append({ "name": gm[0], "title": gm[1], "model": own if own != "" else _pool(gm[2], "quest") })
		named.append({ "kind": "guild", "w": 16.0, "d": 11.0, "h": 7.5, "sign": "guild_f%d" % floor_number, "blade": "blade_f%d_guild" % floor_number, "name": "Guild Hall", "masters": masters, "facade": "facade_b" })
	if hub.get("callings", false):
		named.append({ "kind": "callings", "w": 16.0, "d": 11.0, "h": 8.0, "sign": "callings_f%d" % floor_number, "blade": "blade_f%d_callings" % floor_number, "name": "Registrar Odessa", "title": "Hall of Callings · choose race and class", "keeper": _cast_path("Registrar Odessa") if _cast_path("Registrar Odessa") != "" else _pool("lumen", "quest"), "facade": "facade_a" })

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
		if floor_number >= TERRAIN_FROM_FLOOR and cfg.get("kind", "home") != "home":
			var corner := Vector3(cfg.x, 0, cfg.z) + Vector3(cfg.w / 2.0, 0, cfg.d / 2.0).rotated(Vector3.UP, cfg.yaw)
			storybook_tower(corner, 1.9, float(cfg.h) + 4.0, surface("facade_a", Vector2(8, 10), 6.0, 0.4))

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
		6:
			# The Treehouse: little neighbourhoods clustered around the giant trunks
			for c: Vector2 in _tree_clusters():
				for i in 5:
					var a := TAU * i / 5.0 + c.x * 0.1
					add.call(c.x + cos(a) * 17.0, c.y + sin(a) * 17.0, atan2(cos(a), sin(a)))
		7:
			# Gangway: houses on piles along long jetties, every door facing the water between them
			for row: float in [-40.0, -14.0, 14.0, 40.0]:
				for x: float in [-64.0, -48.0, -32.0, -16.0, 16.0, 32.0, 48.0, 64.0]:
					add.call(x, row, 0.0 if row < 0.0 else PI)
		8:
			# Shaft Town: terraces curving around the pit at the centre, like the rings of a mine
			for ring: Array in [[30.0, 8], [46.0, 12], [62.0, 16]]:
				for i in int(ring[1]):
					var a := TAU * i / float(ring[1]) + 0.2
					add.call(cos(a) * ring[0] * 1.15, sin(a) * ring[0] * 0.82, atan2(-cos(a), -sin(a)))
		_:
			# Verdigris Square: a grand formal plan, wide boulevards and rows of civic fronts facing them
			for z: float in [-46.0, -28.0, 28.0, 46.0]:
				for x: float in [-60.0, -42.0, -24.0, 24.0, 42.0, 60.0]:
					add.call(x, z, 0.0 if z < 0.0 else PI)
			for x: float in [-26.0, 26.0]:
				for z: float in [-13.0, 13.0]:
					add.call(x, z, -signf(x) * PI / 2.0)
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
	if floor_number == 1:
		# Stairwell Camp is the one warm place on the floor, so the light really carries
		for extra: Vector3 in [Vector3(-40, 5, -30), Vector3(40, 5, -30), Vector3(-40, 5, 30), Vector3(40, 5, 30)]:
			lamp(Color("#ffb860"), 3.0, 34.0, extra)
	for q: Dictionary in data.get("quest_npcs", []):
		var p: Vector2 = spots[i % spots.size()]
		var path: String
		var cast_id: String = str(q.get("named", q.get("id", "")))
		if NAMED_CAST.has(cast_id) and ResourceLoader.exists("res://models/characters/%s.glb" % NAMED_CAST[cast_id]):
			path = "res://models/characters/%s.glb" % NAMED_CAST[cast_id]
		elif q.has("named") and NAMED.has(q.named):
			path = "res://models/npcs/named/%s.glb" % NAMED[q.named]
		else:
			path = _pool(races[0], "quest")
		person(path, Vector3(p.x, 0, p.y), Vector2(-p.x, -p.y).angle_to_point(Vector2.ZERO) + PI)
		interactables.append({ "pos": Vector3(p.x, 0, p.y), "r": 2.8, "text": "%s · %s" % [q.get("name", ""), q.get("title", "")], "talk": str(q.get("id", "")), "who": str(q.get("name", "")) })
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
		7:
			prop("pump_engine", Vector3.ZERO, 0.4, 1.0, Vector3(2.4, 2.0, 2.4))
			lamp(Color("#8afff0"), 1.4, 12.0, Vector3(0, 3.0, 0))
		8:
			prop("drill_rig", Vector3.ZERO, 0.6, 0.45, Vector3(2.6, 2.0, 2.6))
			lamp(Color("#ff9a3a"), 1.8, 14.0, Vector3(0, 2.5, 0))
		9:
			prop("rat_statue", Vector3.ZERO, 0.0, 1.0, Vector3(1.8, 2.0, 1.8))
			lamp(Color("#8affc8"), 1.2, 12.0, Vector3(0, 2.0, 3.0))
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
	var redesigned := "res://models/characters/%s.glb" % REDESIGNED.get(kind, "-")
	if ResourceLoader.exists(redesigned):
		return redesigned
	# Floors 10-18 name their monsters after their model files
	if ResourceLoader.exists("res://models/characters/%s.glb" % kind):
		return "res://models/characters/%s.glb" % kind
	if Data.monsters.monsters.has(kind) and (floor_number >= 10 or Data.monsters.monsters[kind].get("chamber", false) or Data.monsters.monsters[kind].get("stand_in", false)):
		return _stand_in(kind)
	var def: Dictionary = Data.monsters.monsters.get(kind, {})
	var model: String = def.get("model", kind)
	for candidate: String in ["res://models/monsters/%s.glb" % model, "res://models/monsters/%s_v0.glb" % model]:
		if ResourceLoader.exists(candidate):
			return candidate
	return ""


## Which of the floor's bosses fight in a chamber: the top one (highest level) in the grand chamber, and the next
## Borough boss in a lesser one. Pylon stays at Pylon Point, where his story is.
var chamber_hosts: Array[Dictionary] = []


func _choose_chamber_hosts() -> void:
	chamber_hosts.clear()
	var camps: Array = data.get("camps", []).filter(func(c: Dictionary) -> bool: return c.get("boss") != null and c.boss != "pylon" and c.boss != "coneKing" and Data.monsters.monsters.has(str(c.boss)))
	camps.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return _level_of(a) > _level_of(b))
	if camps.is_empty():
		return
	chamber_hosts.append({ "camp": camps[0], "grand": true })
	for c: Dictionary in camps.slice(1):
		if str(c.get("level", "")).contains("Borough"):
			chamber_hosts.append({ "camp": c, "grand": false })
			break


func _hosted(kind: String) -> bool:
	for h: Dictionary in chamber_hosts:
		if str(h.camp.boss) == kind:
			return true
	return false


## Until a deep floor's monster has its own model, one of the earlier floors' monsters stands in for it (bosses for bosses).
func _stand_in(kind: String) -> String:
	var bosses := ["sergeant_pylon", "captain_kevlar", "the_gnome_pope", "the_cone_king", "grandma_gristle", "the_moth_matron", "lord_hunter_facet", "the_hoa_president"]
	var crowd := ["mop_wight", "mall_cop_ogre", "gutter_hag", "tourist_hunter", "cone_captain", "traffic_cone_goblin", "fluorescent_moth", "pigeon_ghoul"]
	var list: Array = bosses if Data.monsters.monsters[kind].get("boss", false) else crowd
	for i in list.size():
		var pick: String = list[(kind.hash() + i) % list.size()]
		if ResourceLoader.exists("res://models/characters/%s.glb" % pick):
			return "res://models/characters/%s.glb" % pick
	return ""


## A monster that fights, standing where it was put until someone comes close. Monsters of a kind vary a little in size.
func fighter(kind: String, pos: Vector3, yaw: float, level: int, group: String, size := -1.0) -> Mob:
	var path := _monster_path(kind)
	if path == "":
		return null
	var mob := Mob.spawn(kind, level, path, root, lift(pos), yaw, randf_range(0.88, 1.14) if size < 0.0 else size)
	if mob == null:
		return null
	mob.group = group
	if mob.def.is_empty():
		mob.def = { "name": UNDERCITY_NAMES.get(kind, kind.capitalize()) }
	_limit_draw(mob.model)
	return mob


## A fighter wearing any model: contestants, who borrow the townsfolk's bodies.
func fighter_from(path: String, kind: String, pos: Vector3, yaw: float, level: int, group: String) -> Mob:
	var mob := Mob.spawn(kind, level, path, root, lift(pos), yaw)
	if mob:
		mob.group = group
		_limit_draw(mob.model)
	return mob


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
	# the boss and the crew, who fight together
	var level := _level_of(c)
	var group := "camp:" + str(c.name)
	var mob: Variant = c.get("mob", "goblin")
	var kinds: Array = mob if mob is Array else [mob]
	if c.has("boss") and c.boss != null and _hosted(str(c.boss)):
		# this boss has withdrawn to its chamber, nearby; the crew still holds the camp
		interactables.append({ "pos": centre + Vector3(0, 0, 3), "r": 5.0, "text": "The boss's place is empty. It waits in its chamber, not far off. The crew will tell you which way, if you ask them hard enough." })
	elif c.has("boss") and c.boss != null:
		var boss := fighter(c.boss, centre, open_angle + PI / 2.0, level, group, 1.0)
		if boss:
			boss.minion_kind = str(kinds[0])
			boss.minion_path = _monster_path(boss.minion_kind)
	for i in 4:
		var a := open_angle + (i - 1.5) * 0.6
		fighter(str(kinds[i % kinds.size()]), centre + Vector3(cos(a), 0, sin(a)) * r * 0.42, a + PI / 2.0, level, group)
	var gate := { "pos": centre + Vector3(cos(open_angle), 0, sin(open_angle)) * (r + 1.0), "r": 6.0, "text": "%s · level %s" % [c.name, c.get("level", "?")] }
	if c.get("boss") != null and Story.dialogue.has(str(c.boss)):
		# some bosses will talk before they fight
		gate.talk = str(c.boss)
		gate.who = "%s at the %s gate" % [Story.npc_name(str(c.boss)), c.name]
	interactables.append(gate)


## Landmarks you can stop and look at properly.
const LANDMARK_TALK := { "The Exit Sign": "exit_sign" }


## Floor 1's story pieces (art/STORY.md): the ticket booth and its three tickets by the Exit Sign, the drowned
## contestant at the Flooded Bay, and the goblins' stolen waterworks on the way to Pylon Point.
func _build_story_f1() -> void:
	var exit_at := Vector3(0, 0, -350)
	for l: Dictionary in data.get("landmarks", []):
		if l.name == "The Exit Sign":
			exit_at = Vector3(l.x, 0, l.z)
	var booth := exit_at + Vector3(16, 0, 10)
	prop("kiosk", booth, -0.4, 1.0, Vector3(1.4, 1.5, 1.4))
	lamp(Color("#9affc0"), 1.6, 9.0, booth + Vector3(0, 3.0, 2.0))
	interactables.append({ "pos": booth + Vector3(0, 0, 2.4), "r": 3.0, "text": "", "talk": "ticket_machine", "say": "use the ticket machine" })
	var tickets := [exit_at + Vector3(-22, 0, 14), exit_at + Vector3(30, 0, -6), exit_at + Vector3(6, 0, 34)]
	for i in tickets.size():
		var t: Vector3 = tickets[i]
		block(Vector3(0.5, 0.02, 0.25), flat(Color("#f2ead0")), t + Vector3(0, 0.02, 0), i * 0.9)
		lamp(Color("#fff2c0"), 0.7, 4.0, t + Vector3(0, 1.2, 0))
		interactables.append({ "pos": t, "r": 2.2, "text": "", "talk": "ticket_%d" % (i + 1), "say": "pick up the ticket" })
	for c: Dictionary in data.get("camps", []):
		var centre := Vector3(c.x, 0, c.z)
		if c.get("boss") == "bigSucker":
			var body_at := centre + Vector3(-6, 0, -5)
			prop("remains", body_at, 0.8)
			lamp(Color("#6ad8ff"), 1.2, 5.0, body_at + Vector3(0, 1.0, 0))
			interactables.append({ "pos": body_at, "r": 2.6, "text": "", "talk": "bracelet", "say": "look at the body" })
		elif c.get("boss") == "pylon":
			var pipes := centre * 0.55
			for k in 3:
				prop("barrels", pipes + Vector3(k * 1.6 - 1.6, 0, 1.0), k * 0.7)
			prop("crates", pipes + Vector3(2.4, 0, -1.4), 0.3)
			lamp(Color("#7ab8ff"), 1.4, 8.0, pipes + Vector3(0, 2.2, 0))
			interactables.append({ "pos": pipes, "r": 3.6, "text": "", "talk": "waterworks", "say": "look at the stolen pipework" })


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
	var sign := { "pos": front, "r": 6.0, "text": str(l.name) }
	if LANDMARK_TALK.has(l.name):
		sign.talk = LANDMARK_TALK[l.name]
		sign.say = "look closer at %s" % l.name
	interactables.append(sign)


func _build_stairs() -> void:
	var st: Dictionary = data.stairs
	var at := Vector3(st.x, 0, st.z)
	var to := int(st.to)
	prop("stair_door", at + Vector3(0, 0, -4.0))
	box_collider(at + Vector3(0, 3.5, -4.0), Vector3(4.0, 3.5, 1.0))
	lamp(Color("#5aff7a"), 1.1, 11.0, at + Vector3(0, 3.4, 1.0))
	var label := "Press E: take the stairs down to Floor %d" % to if Data.floors.has(str(to)) else "The way to Floor %d (not built yet)" % to
	var entry := { "pos": at, "r": 4.5, "text": label }
	if st.has("flag"):
		entry.needs = st.flag
		entry.locked = st.get("locked", "Locked.")
		entry.how = st.get("how", entry.locked)
	if Data.floors.has(str(to)):
		entry.to = to
	interactables.append(entry)


# ---------------------------------------------------------------- the camp network: boss camps far out, outposts on the way, places to find
## Floors from here down push their boss camps out towards the edge, so you work up to them.
const PUSH_FROM_FLOOR := 4
const OUTPOST_SUFFIX := ["Outpost", "Picket", "Lookout", "Den", "Watch", "Nest"]
## What each floor's shrines and wrecks are made of: [shrine prop, wreck prop].
const POI_PROPS := { 1: ["cone_totem", "car_wreck"], 2: ["shoe_pile", "washer_red"], 3: ["candle_grave", "butcher_block"], 4: ["shop_dummy", "kiosk"], 5: ["gnome_grin", "car_wreck"], 6: ["totem_pole", "safari_jeep"], 7: ["drowned_hand", "eviction_pile"], 8: ["clock_gear", "mine_cart"], 9: ["rat_statue", "deposit_boxes"] }

## Floors 7-9's monsters aren't in the prototype's data yet, so their names live here until combat adds them.
const UNDERCITY_NAMES := { "wyrm": "Sewer Wyrm", "collector": "Clockwork Debt Collector", "molekin": "Tunnel Mole-Kin", "grease": "Grease Golem", "choir": "Fungal Choir", "ratking": "Ratking Choir", "bathwater": "Old Lady Bathwater", "landlord": "The Landlord", "organ": "Pipe Organ Wyrm", "sanking": "The Sanitation King", "outfall": "The Outfall Bishop", "repo": "Repossessor Mk. IX", "grubtooth": "Chief Grubtooth", "drill": "Drill Prophet", "baron": "The Fryer Baron", "mold": "Big Momma Mold", "soloist": "The Soloist", "senate": "The Rat Senate", "lockjaw": "Lockjaw", "ratthrone": "The Rat Throne King", "undermayor": "The Undermayor" }
## Grim little places that belong to each kind of camp, out along its trail: [name, [[prop, scale], ...], what you find].
const CAMP_SIGHTS := {
	"cone": [["Toll Stakes", [["toll_stake", 1.0], ["toll_stake", 1.0], ["cones", 1.0]], "The goblins' toll. These ones didn't have exact change."], ["Cone Totem", [["cone_totem", 1.0], ["remains", 1.0]], "A cone totem with something wedged in the top cone. It's a hand."]],
	"lamprey": [["Feeding Pool", [["wet_floor_ring", 1.4], ["body_bag", 1.0], ["remains", 1.0]], "A drain with the grate pulled off. Things come up here to eat."], ["Drain Hands", [["hand_grate", 1.0], ["hand_grate", 1.0]], "Fingers through the grate. They grab at your ankles."]],
	"moth": [["Bug Light", [["lamp_post", 1.3], ["remains", 1.0], ["remains", 1.0]], "A lamp left on to draw them in. It drew in more than moths."], ["Cocoon Tree", [["net_cocoon", 0.8], ["bone_heap", 0.5]], "Silk bundles the size of a person, hanging. One's still moving."]],
	"pigeon": [["Roost", [["bone_heap", 0.7], ["boxes", 1.0]], "Feathers and bones knee deep. They've picked everything clean."], ["Crumb Trail", [["remains", 1.0], ["bench", 1.0]], "Someone came to feed the birds."]],
	"mimic": [["Free Snacks", [["food_shelf", 1.0], ["remains", 1.0]], "FREE SNACKS, says the sign. Nobody ever reads the small print."], ["Spat Out", [["remains", 1.0], ["boxes", 1.0]], "It didn't like the taste of this one."]],
	"wight": [["Mop Graves", [["wet_floor", 1.0], ["wet_floor", 1.0], ["remains", 1.0]], "Each grave marked with a WET FLOOR sign. They keep the floor very clean."]],
	"hag": [["Stewpot", [["cauldron", 1.2], ["bone_heap", 0.5]], "Still simmering. Something in there has a wedding ring on."]],
	"mall": [["Lost Children", [["shop_dummy", 0.6], ["shop_dummy", 0.6], ["shop_dummy", 0.6]], "Small dummies in a ring, holding hands. They were facing the other way."], ["Returns Desk", [["boxes", 1.4], ["remains", 1.0]], "NO RECEIPT, NO RETURN. Someone tried to return themselves."]],
	"leech": [["Coupon Drift", [["receipts", 3.0], ["remains", 1.0]], "Coupons, drifted waist-high. They're all for you, and they're all expired."]],
	"slime": [["Swallowed", [["remains", 1.0], ["remains", 1.0], ["wet_floor", 1.0]], "Bones, very clean, in a ring of sticky floor."]],
	"gnome": [["Gnome Circle", [["gnome_grin", 1.8], ["gnome_knife", 1.8], ["gnome_grin", 1.8], ["gnome_knife", 1.8]], "A ring of gnomes around a patch of very fresh turf."]],
	"hound": [["Chew Toys", [["bone_heap", 0.6], ["kennel", 1.0]], "The bones have name tags on."]],
	"hunter": [["Trophy Rack", [["trophy_board", 1.2], ["trophy_board", 1.2], ["trophy_board", 1.2]], "Season Six's best. There's an empty shield, with your name already engraved."]],
	"wyrm": [["Shed Skin", [["wyrm_spine", 0.22], ["body_bag", 1.0]], "A whole skin, shed in the water. It was bigger than the last one."]],
	"debt": [["Collected", [["clock_gear", 1.2], ["remains", 1.0], ["deposit_boxes", 0.5]], "Everything they took, stacked and labelled. PAID IN FULL, one tag says. It's on a foot."]],
	"sewage": [["Bag Shrine", [["bag_heap", 0.5], ["body_bag", 1.0]], "Bin bags piled like an altar. The King collects."]],
	"mole": [["Dig Site", [["mine_timber", 0.6], ["rubble_bits", 3.0], ["remains", 1.0]], "They dug straight down here. They didn't come back up."]],
	"grease": [["Fry Pit", [["grease_pool", 1.0], ["fry_mound", 0.4], ["remains", 1.0]], "Battered, and left to cool."]],
	"mold": [["Nursery Cot", [["mold_crib", 1.2], ["mold_bloom", 0.6]], "She's tucked someone in. They're very still. They're breathing."]],
	"rat": [["Tail Knot", [["rat_statue", 0.4], ["bone_heap", 0.5]], "A rat king, knotted at the tails, still squeaking. Votes counted on the wall beside it."]],
	"civic": [["The Queue", [["petitioner", 1.0], ["petitioner", 1.0], ["petitioner", 1.0]], "A queue to nowhere. They've been told it won't be long."]],
}

## Every outpost and point of interest, for the map sheets: { kind, name, x, z, level }.
var points: Array[Dictionary] = []
## The monster packs out in the open (WildSpawner).
var wild: WildSpawner
## Places the floor's quests send you to (QuestLines): { name, pos, r }.
var quest_places: Array = []
## A floor-wide hazard (Floor 15's cold): { label, color, drain (seconds from full to nothing), radius, hurt }.
## Near any of heat_spots the meter fills back up; at zero it starts taking your health.
var hazard: Dictionary = {}
var heat_spots: Array[Vector3] = []
var _hazard_level := 100.0
var _hazard_warned := false
var ground_mat: Material
## Contestant camps and hidden encampments (scripts/floors/discovery.gd).
var discovery: Discovery
## Floors from here down have hills, ridges and a mountain to climb.
const TERRAIN_FROM_FLOOR := 3


## Makes the hills once the towns, camps and districts have their land, and before the filler, trees and ground cover.
func make_terrain() -> void:
	if terrain or floor_number < TERRAIN_FROM_FLOOR:
		return
	var land := Terrain.new(world_size, 4242 + floor_number)
	for r: Rect2 in _zones:
		land.keep_flat(r)
	for r: Rect2 in footprints:
		land.keep_flat(r)
	if is_open_world():
		land.rock = Color(theme.get("rock", "#7a7470"))
		land.high = Color(theme.get("high", "#8a8898"))
		land.shape_open(clampf(world_size * 0.11, 110.0, 220.0), _rng, is_free)
	else:
		var top := clampf(float(data.ceil) * 0.42, 8.0, 26.0)
		var hills := int(world_size / 170.0) + 2
		# Suburbia is lots of houses in rows; a few park hills, and the big one out past the houses
		if floor_number == 5:
			hills = 3
		land.shape(top, _rng, is_free, true, hills, world_size >= 900.0)
	# the ground plane's texture repeats every ground_tile metres; the hills match it
	land.build(root, body, ground_mat, world_size / (world_size / float(theme.ground_tile)), draw_distance)
	terrain = land
	lift_late()
	_river_water()
	_summit_lookouts()


## Something worth the climb on top of each hill: a cairn, a light, and a stash for whoever gets there first.
func _summit_lookouts() -> void:
	var i := 0
	for s: Array in terrain.summits:
		var top: Vector3 = s[0]
		var at := Vector3(top.x, 0, top.z)
		prop("camp_banner", at + Vector3(1.5, 0, 0), 0.4)
		prop("loot_chest", at + Vector3(-1.5, 0, 0.5), 0.9, 1.2)
		lamp(Color("#ffd27a"), 1.8, 14.0, at + Vector3(0, 3.0, 0))
		var camps := 0
		for pt: Dictionary in points:
			if pt.kind == "outpost" and Vector2(pt.x - at.x, pt.z - at.z).length() < 260.0:
				camps += 1
		interactables.append({ "pos": at + Vector3(-1.5, 0, 1.5), "r": 3.0, "text": "Press E: open the summit stash",
			"after": "An empty stash. The view's still good: %d monster camps within sight." % camps,
			"act": ["xp:%d" % (60 + floor_number * 40), "gold:%d" % (20 + floor_number * 12), "notice:SUMMIT · You climbed it. From up here you can count %d monster camps." % camps] })
		points.append({ "kind": "summit", "name": "Summit %d" % (i + 1), "x": at.x, "z": at.z, "level": 0 })
		i += 1
var _camps_placed := false


## Builds the camps, outposts and points of interest once the districts have claimed their land, just before the filler.
func before_filler() -> void:
	if _camps_placed:
		return
	_camps_placed = true
	if floor_number >= PUSH_FROM_FLOOR:
		_push_camps_out()
		for c: Dictionary in data.get("camps", []):
			_build_camp(c)
			var r: float = c.get("r", 20.0) + 10.0
			reserve(Rect2(c.x - r, c.z - r, r * 2.0, r * 2.0))
		_build_stairs()
		reserve(Rect2(data.stairs.x - 14.0, data.stairs.z - 14.0, 28.0, 28.0))
	_build_outposts()
	_build_points_of_interest()
	discovery = Discovery.new()
	discovery.build(self)


## Each boss camp moves straight out from the town until it's well into the wilds, onto the nearest free land.
## The stairs move with the camp that guards them.
func _push_camps_out() -> void:
	var reach := world_size * 0.4
	var edge := world_size / 2.0 - 40.0
	for c: Dictionary in data.get("camps", []):
		var old := Vector2(c.x, c.z)
		var dir := old.normalized() if old.length() > 1.0 else Vector2(0, -1)
		var r: float = c.get("r", 20.0) + 12.0
		var best := old
		var found := false
		for step in 40:
			var radius := minf(maxf(old.length(), reach) + float(step / 7) * 25.0 * (1.0 if step % 2 == 0 else -1.0), edge)
			var turn: float = [0.0, 0.18, -0.18, 0.36, -0.36, 0.54, -0.54][step % 7]
			var spot := dir.rotated(turn) * radius
			if absf(spot.x) < edge and absf(spot.y) < edge and is_free(spot.x, spot.y, r):
				best = spot
				found = true
				break
		if not found:
			best = dir * minf(maxf(old.length(), reach), edge)
		var guards_stairs := Vector2(data.stairs.x, data.stairs.z).distance_to(old) < 40.0
		if guards_stairs:
			data.stairs.x = best.x + (data.stairs.x - old.x)
			data.stairs.z = best.y + (data.stairs.z - old.y)
		c.x = best.x
		c.z = best.y


## Lines of outposts lead from the town out to every boss camp, and more are dotted about the rest of the floor.
## Each has some of that camp's monsters, a loot box for clearing it, and field notes on what lives there.
func _build_outposts() -> void:
	var camps: Array = data.get("camps", [])
	if camps.is_empty():
		return
	var lowest := 999
	for c: Dictionary in camps:
		lowest = mini(lowest, _level_of(c))
	var made := 0
	var shapes := ["zigzag", "fork", "cluster", "scatter", "arc"]
	for ci in camps.size():
		var c: Dictionary = camps[ci]
		var target := Vector2(c.x, c.z)
		var dir := target.normalized()
		var across := dir.orthogonal()
		var start := dir * 95.0
		var finish := dir * (target.length() - float(c.get("r", 20.0)) - 30.0)
		var count := clampi(int(start.distance_to(finish) / 75.0), 2, 7)
		# no two neighbouring camps, or floors, get the same shape of trail
		var shape: String = shapes[(ci + floor_number * 2) % shapes.size()]
		for i in count:
			var t := (i + 1.0) / (count + 1.0)
			var spot := start.lerp(finish, t)
			match shape:
				"zigzag":
					spot += across * (30.0 + (i % 3) * 16.0) * (1.0 if i % 2 == 0 else -1.0)
				"fork":
					if t > 0.4:
						spot += across * (t - 0.4) * 160.0 * (1.0 if i % 2 == 0 else -1.0)
				"cluster":
					if i >= 1:
						var a := i * 2.1
						spot = start.lerp(finish, 0.62) + Vector2(cos(a), sin(a)) * 42.0
				"scatter":
					spot = start.lerp(finish, _rng.randf_range(0.15, 0.95)) + across * _rng.randf_range(-70.0, 70.0)
				"arc":
					spot += across * sin(t * PI) * 85.0
			var level := lowest - 1 + int(round(t * float(_level_of(c) - lowest)))
			if _outpost(spot, c, maxi(level, 1), i):
				made += 1
		# and the grim sights that belong to this camp, off the trail where you'd stumble on them
		var sights: Array = CAMP_SIGHTS.get(c.get("style", ""), [])
		for k in mini(2, sights.size()) if not sights.is_empty() else 0:
			var t := 0.35 + k * 0.35
			_camp_sight(start.lerp(finish, t) + across * (55.0 if k % 2 == 0 else -55.0) * (1.0 if ci % 2 == 0 else -1.0), sights[(k + ci) % sights.size()], c)
	# more of them out in the open, so there are always more camps than safe places, and far more on the big floors
	var wanted := 8 + floor_number * 3
	var half := world_size / 2.0 - 40.0
	var tries := 0
	while made < wanted + camps.size() * 2 and tries < 300:
		tries += 1
		var spot := Vector2(_rng.randf_range(-half, half), _rng.randf_range(-half, half))
		if spot.length() < 120.0:
			continue
		var nearest: Dictionary = camps[0]
		for c: Dictionary in camps:
			if Vector2(c.x, c.z).distance_to(spot) < Vector2(nearest.x, nearest.z).distance_to(spot):
				nearest = c
		var level := lowest + int(spot.length() / (world_size * 0.5) * float(_level_of(nearest) - lowest))
		if _outpost(spot, nearest, maxi(level, 1), made):
			made += 1


func _level_of(c: Dictionary) -> int:
	return str(c.get("level", "1")).get_slice("-", 0).to_int()


## A small camp: a ring of barricades with a gap facing the town, a fire, a few of the boss camp's monsters,
## a loot box for clearing it out, and someone's notes on the monsters pinned to a board.
func _outpost(near: Vector2, camp: Dictionary, level: int, index := 0) -> bool:
	var spot := near
	var found := false
	for k in 16:
		var a := k * 2.4
		var test := near + Vector2(cos(a), sin(a)) * k * 7.0
		if is_free(test.x, test.y, 16.0):
			spot = test
			found = true
			break
	if not found:
		return false
	var centre := Vector3(spot.x, 0, spot.y)
	reserve(Rect2(spot.x - 16.0, spot.y - 16.0, 32.0, 32.0))
	var r := 9.0
	var open_angle := atan2(-spot.y, -spot.x)
	# four kinds of outpost: a barricaded ring, an open nest, a huddle of tents, and a dug-in ruin
	var layout: String = ["ring", "nest", "tents", "ruin"][(index + floor_number + int(absf(spot.x)) / 7) % 4]
	match layout:
		"ring":
			for i in 9:
				var a := TAU * i / 9.0
				if absf(angle_difference(a, open_angle)) < 0.55:
					continue
				prop("barricade", centre + Vector3(cos(a), 0, sin(a)) * r, -a + PI / 2.0, 1.0, Vector3(3.1, 1.3, 0.3))
			prop("tent", centre + Vector3(cos(open_angle + PI), 0, sin(open_angle + PI)) * 5.5, open_angle, 0.85, Vector3(1.4, 1.0, 1.6))
		"nest":
			prop("bone_heap", centre + Vector3(cos(open_angle + PI), 0, sin(open_angle + PI)) * 5.0, open_angle, 0.6)
			for i in 3:
				var a := open_angle + PI + (i - 1) * 1.4
				prop("remains", centre + Vector3(cos(a), 0, sin(a)) * 6.0, a)
		"tents":
			for i in 3:
				var a := open_angle + PI + (i - 1) * 1.1
				prop("tent", centre + Vector3(cos(a), 0, sin(a)) * 6.5, -a + PI, 0.9, Vector3(1.4, 1.0, 1.6))
			prop("camp_banner", centre + Vector3(cos(open_angle), 0, sin(open_angle)) * 7.0, open_angle)
		"ruin":
			for s: float in [-1.0, 1.0]:
				var a := open_angle + PI + s * 0.9
				prop("broken_pillar", centre + Vector3(cos(a), 0, sin(a)) * 7.5, a, 1.0, Vector3(0.6, 2.0, 0.6))
			prop("slab_pile", centre + Vector3(cos(open_angle + PI), 0, sin(open_angle + PI)) * 7.0, open_angle, 1.0)
	prop("bonfire", centre, 0.0, 0.8, Vector3(0.7, 1.0, 0.7))
	lamp(Color("#ff9a3a"), 2.0, 14.0, centre + Vector3(0, 2.2, 0), false)
	var extras: Array = CAMP_PROPS.get(camp.get("style", "cone"), ["crates", "barrels", "boxes"])
	for i in 3:
		var a := open_angle + PI + (i - 1) * 0.9
		prop(extras[i % extras.size()], centre + Vector3(cos(a), 0, sin(a)) * 6.5, a, 1.0)
	var mob: Variant = camp.get("mob", "goblin")
	var kinds: Array = mob if mob is Array else [mob]
	var crowd := 3 + (level % 3)
	var group := "outpost:%d" % points.size()
	for i in crowd:
		var a := open_angle + PI + (i - crowd / 2.0) * 0.6
		fighter(str(kinds[i % kinds.size()]), centre + Vector3(cos(a), 0, sin(a)) * 3.6, a + PI, level, group)
	var chest := centre + Vector3(cos(open_angle + PI), 0, sin(open_angle + PI)) * 2.0
	prop("loot_chest", chest, open_angle, 1.4)
	var kind: String = str(kinds[0])
	var def: Dictionary = Data.monsters.monsters.get(kind, {})
	var monster_name: String = def.get("name", UNDERCITY_NAMES.get(kind, kind.capitalize()))
	var outpost_name := "%s %s" % [monster_name.get_slice(" ", monster_name.get_slice_count(" ") - 1), OUTPOST_SUFFIX[points.size() % OUTPOST_SUFFIX.size()]]
	interactables.append({ "pos": chest, "r": 2.6, "text": "", "title": "%s's loot box" % outpost_name, "loot": group, "level": level })
	var board := centre + Vector3(cos(open_angle), 0, sin(open_angle)) * (r + 2.0) + Vector3(cos(open_angle + PI / 2.0), 0, sin(open_angle + PI / 2.0)) * 3.0
	prop("noticeboard", board + Vector3.UP * 1.6, PI / 2.0 - open_angle)
	interactables.append({ "pos": board, "r": 2.8, "text": _field_notes(kind, def) })
	points.append({ "kind": "outpost", "name": outpost_name, "x": spot.x, "z": spot.y, "level": level })
	return true


## What a survivor scribbled about the monsters here. The full lore comes when fighting does; this is the start of it.
func _field_notes(kind: String, def: Dictionary) -> String:
	if def.is_empty():
		return "FIELD NOTES · %s: the page is mostly blood. Fight one to learn more." % UNDERCITY_NAMES.get(kind, kind.capitalize())
	var hp := float(def.get("hp", 40))
	var dmg := float(def.get("dmg", 6))
	var speed := float(def.get("speed", 3.0))
	var traits := []
	traits.append("tough" if hp >= 80.0 else "goes down quickly")
	traits.append("hits hard" if dmg >= 10.0 else "a light hitter")
	traits.append("fast, don't run" if speed >= 3.6 else "slow, you can outrun it")
	var moves: Array = def.get("abilities", [])
	var watch := "" if moves.is_empty() else " Watch for its %s." % ", ".join(moves)
	return "FIELD NOTES · %s: %s.%s Fight one to learn more." % [def.get("name", kind), ", ".join(traits), watch]


## One of a camp's grim sights: a little scene with something to read.
func _camp_sight(near: Vector2, sight: Array, camp: Dictionary) -> void:
	for k in 12:
		var a := k * 2.4
		var test := near + Vector2(cos(a), sin(a)) * k * 8.0
		if is_free(test.x, test.y, 9.0):
			var at := Vector3(test.x, 0, test.y)
			var pieces: Array = sight[1]
			for i in pieces.size():
				var piece: Array = pieces[i]
				var b := TAU * i / pieces.size()
				prop(piece[0], at + (Vector3(cos(b), 0, sin(b)) * 2.6 if pieces.size() > 1 else Vector3.ZERO), b + PI, piece[1])
			lamp(Color("#ff7a5a"), 1.4, 10.0, at + Vector3(0, 1.6, 0), false)
			interactables.append({ "pos": at, "r": 4.0, "text": "%s, out near %s. %s" % [sight[0], camp.name, sight[2]] })
			reserve(Rect2(test.x - 9.0, test.y - 9.0, 18.0, 18.0))
			points.append({ "kind": "sight", "name": sight[0], "x": test.x, "z": test.y, "level": 0 })
			return


## Places worth finding between the camps, more of them on the bigger floors: hideouts, lookouts, shrines, wrecks, caches and nests.
func _build_points_of_interest() -> void:
	var count := 3 + maxi(0, floor_number - 3) * 3
	var half := world_size / 2.0 - 40.0
	var kinds := ["hideout", "lookout", "shrine", "wreck", "cache", "nest"]
	var made := 0
	var tries := 0
	while made < count and tries < 300:
		tries += 1
		var spot := Vector2(_rng.randf_range(-half, half), _rng.randf_range(-half, half))
		if spot.length() < 110.0 or not is_free(spot.x, spot.y, 12.0):
			continue
		_point_of_interest(kinds[made % kinds.size()], Vector3(spot.x, 0, spot.y))
		reserve(Rect2(spot.x - 12.0, spot.y - 12.0, 24.0, 24.0))
		made += 1


func _point_of_interest(kind: String, at: Vector3) -> void:
	var themed: Array = POI_PROPS.get(floor_number, ["crates", "car_wreck"])
	var yaw := _rng.randf_range(0, TAU)
	var label := ""
	match kind:
		"hideout":
			label = "Survivor Hideout"
			prop("tent", at, yaw, 1.0, Vector3(1.6, 1.0, 1.9))
			prop("crates", at + Vector3(3, 0, 1), yaw, 1.0, Vector3(0.9, 1.0, 0.7))
			prop("boxes", at + Vector3(-3, 0, 2), yaw + 1.0)
			lamp(Color("#ffd8a0"), 1.6, 10.0, at + Vector3(0, 2.4, 2), false)
			interactables.append({ "pos": at + Vector3(0, 0, 3), "r": 3.0, "text": "A survivor's hideout. Their journal stops mid-sentence." })
		"lookout":
			label = "Lookout"
			prop("zip_tower", at, yaw, 1.0, Vector3(1.2, 2.6, 1.2))
			lamp(Color("#ffe08a"), 2.0, 16.0, at + Vector3(0, 7.5, 0), false)
			interactables.append({ "pos": at, "r": 3.4, "text": "A lookout. From the top you could count the camps. Climbing comes later." })
		"shrine":
			label = "Shrine"
			for i in 6:
				var a := i * TAU / 6.0
				prop(themed[0], at + Vector3(cos(a), 0, sin(a)) * 3.2, -a)
			prop("remains", at, yaw)
			lamp(Color("#ffb860"), 1.6, 10.0, at + Vector3(0, 1.2, 0), false)
			interactables.append({ "pos": at, "r": 3.4, "text": "Someone keeps this shrine. There are fresh offerings. There's no one here." })
		"wreck":
			label = "Wreck"
			prop(themed[1], at, yaw, 1.3)
			prop("remains", at + Vector3(2.5, 0, 1), yaw + 2.0)
			lamp(Color("#ff8a5a"), 1.4, 12.0, at + Vector3(0, 2.0, 0), false)
		"cache":
			label = "Hidden Cache"
			prop("loot_chest", at, yaw, 1.2)
			prop("remains", at + Vector3(-1.6, 0, 1.2), yaw)
			interactables.append({ "pos": at, "r": 2.6, "text": "A hidden cache. Somebody died guarding it. Loot arrives with Phase 2." })
		"nest":
			label = "Nest"
			prop("bone_heap", at, yaw, 0.9)
			prop("remains", at + Vector3(3, 0, -2), yaw)
			lamp(Color("#c8ff8a"), 1.2, 10.0, at + Vector3(0, 1.0, 0), false)
			interactables.append({ "pos": at, "r": 4.0, "text": "A nest. It's still warm." })
	points.append({ "kind": kind, "name": label, "x": at.x, "z": at.z, "level": 0 })


## The hazard meter: it drains away from heat, refills near it, and at zero it hurts.
func _hazard_tick(delta: float) -> void:
	var player := get_tree().get_first_node_in_group("player") as Node3D
	if player == null:
		return
	var warm := false
	for h: Vector3 in heat_spots:
		if Vector2(h.x - player.global_position.x, h.z - player.global_position.z).length() < float(hazard.get("radius", 12.0)):
			warm = true
			break
	_hazard_level = clampf(_hazard_level + delta * (40.0 if warm else -100.0 / float(hazard.get("drain", 150.0))), 0.0, 100.0)
	Combat.hazard = { "label": str(hazard.get("label", "WARMTH")), "value": _hazard_level, "color": str(hazard.get("color", "#8fd8ff")) }
	if _hazard_level < 25.0 and not _hazard_warned:
		_hazard_warned = true
		Story.notice.emit(str(hazard.get("warn", "You're freezing. Find heat.")), Color("#8fd8ff"))
	elif _hazard_level > 60.0:
		_hazard_warned = false
	if _hazard_level <= 0.0 and Combat.hp > 0.0:
		Combat.hp -= Combat.max_hp() * float(hazard.get("hurt", 0.05)) * delta
		if Combat.hp <= 0.0:
			Combat.hp = 0.0
			Combat.player_died.emit()
			_hazard_level = 100.0


## Floor 7's water: it rises while the sluice clock runs, and drops for good once the Cistern is drained.
func _flood_level(delta: float) -> void:
	var water: Node3D = wilds.flood
	if water == null:
		return
	var target := 0.0
	if Story.done("f7_sluices"):
		target = -0.8
	elif str(Story.countdown.get("quest", "")) == "f7_sluices":
		target = 1.4 * (1.0 - float(Story.countdown.left) / maxf(1.0, float(Story.countdown.total)))
	water.position.y = move_toward(water.position.y, target, delta * 0.6)


func _exit_tree() -> void:
	Combat.hazard = {}


# ---------------------------------------------------------------- the open floors
## From Floor 4 down the floors stop feeling like rooms: open sky, mountains, rivers, forests, villages on the peaks.
const OPEN_FROM := 4


func is_open_world() -> bool:
	return floor_number >= OPEN_FROM


## Mountains past the edge of the world, far off in the haze, so the land seems to go on for ever.
func _far_mountains() -> void:
	var mat := flat(Color(theme.fog).darkened(0.35), 0.4)
	var rng := RandomNumberGenerator.new()
	rng.seed = 333 + floor_number
	var half := world_size / 2.0
	for i in 40:
		var a := float(i) / 40.0 * TAU + rng.randf_range(-0.05, 0.05)
		var dist := half * 1.414 + rng.randf_range(120.0, 650.0)
		var h := rng.randf_range(180.0, 520.0)
		var cone := CylinderMesh.new()
		cone.top_radius = rng.randf_range(0.0, 30.0)
		cone.bottom_radius = h * rng.randf_range(1.1, 1.8)
		cone.height = h
		cone.radial_segments = 7
		cone.rings = 2
		var node := mesh_node(cone, mat, Vector3(cos(a) * dist, h / 2.0 - 20.0, sin(a) * dist))
		node.visibility_range_end = 0.0
		node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF


## The water in the rivers the terrain carved: a strip down each one, a little above the bed.
func _river_water() -> void:
	if terrain == null or terrain.rivers.is_empty():
		return
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(theme.get("water", "#2a4a5a"))
	mat.albedo_color.a = 0.82
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.roughness = 0.15
	mat.metallic_specular = 0.6
	mat.emission_enabled = true
	mat.emission = Color(theme.get("water", "#2a4a5a")).darkened(0.6)
	for path: PackedVector3Array in terrain.rivers:
		var st := SurfaceTool.new()
		st.begin(Mesh.PRIMITIVE_TRIANGLES)
		for i in range(0, path.size() - 1):
			var a: Vector3 = path[i]
			var b: Vector3 = path[i + 1]
			if a.distance_to(b) > 12.0:
				continue
			var side := (b - a).cross(Vector3.UP).normalized() * 11.0
			for v: Vector3 in [a - side, b - side, b + side, a - side, b + side, a + side]:
				st.set_normal(Vector3.UP)
				st.add_vertex(v)
		var node := MeshInstance3D.new()
		node.mesh = st.commit()
		node.material_override = mat
		node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		root.add_child(node)
