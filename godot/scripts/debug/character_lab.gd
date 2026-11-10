extends Node3D
## The character lab: a bare stage for judging how characters look and move, away from the noise of a whole floor.
## You stand at the front; Marta walks a loop past you, stops, turns and talks to you; a couple of townsfolk stand by
## (their heads should follow you). Run it with:
##   Godot --path godot res://scenes/character_lab.tscn                     (watch it, mouse to look)
##   Godot --path godot res://scenes/character_lab.tscn -- --lab-frames=DIR  (records frames for a GIF, then quits)
## Characters to show can be given with --lab-cast=name,name,... (the first one walks the loop).

var cast: Array = ["marta_vance", "human_townsperson", "gutterkin_townsperson"]
var walker: Node3D
var walker_life: Life
var path: Array[Vector3] = [Vector3(-3, 0, -1), Vector3(3, 0, -1), Vector3(3, 0, -5), Vector3(-3, 0, -5)]
var leg := 0
var pause := 0.0
var talk_left := 0.0
var clock := 0.0
var frames_dir := ""
var frame := 0
var cam: Camera3D
## Which monster comes for you from the back of the stage (--lab-mob=troll), and its model.
var mob_kind := "goblin"
var show_moves := false
## How long --lab-frames records for (--lab-seconds=N).
var record_seconds := 12.0
## How long the walker stops to talk to you (--lab-talk=N).
var talk_seconds := 3.2
var lab_mob: Mob
var _said := -1
const MOB_MODELS := { "goblin": "traffic_cone_goblin", "pylon": "sergeant_pylon", "thrower": "cone_chucker", "captain": "cone_captain", "clamp": "clamp" }


func _ready() -> void:
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--lab-frames="):
			frames_dir = arg.trim_prefix("--lab-frames=")
		if arg == "--nolook":
			Life.LOOK_ON = false
		if arg == "--lab-moves":
			show_moves = true
			# show off everything: always taunt, always leap when it can
			Data.monsters.abilities.leap.chance = 1.0
			for k: String in Data.monsters.monsters:
				if Data.monsters.monsters[k].has("taunt"):
					Data.monsters.monsters[k].taunt = 1.0
		if arg.begins_with("--lab-talk="):
			talk_seconds = float(arg.trim_prefix("--lab-talk="))
		if arg.begins_with("--lab-seconds="):
			record_seconds = float(arg.trim_prefix("--lab-seconds="))
		if arg.begins_with("--lab-mob="):
			mob_kind = arg.trim_prefix("--lab-mob=")
		if arg.begins_with("--lab-cast="):
			cast = arg.trim_prefix("--lab-cast=").split(",")
	_stage()
	# you, standing at the front of the stage
	var you: Node3D = preload("res://scenes/player.tscn").instantiate()
	add_child(you)
	you.global_position = Vector3(0, 0, 2.5)
	you.set_physics_process(false)
	you.set_process_unhandled_input(false)
	you.visible = false
	Combat.player = you
	cam = Camera3D.new()
	add_child(cam)
	# your eyes: the camera stands where you do, so whoever looks at you looks into the lens
	cam.position = Vector3(0, 1.65, 2.6)
	cam.look_at(Vector3(0, 1.1, -2.5))
	cam.fov = 62.0
	cam.current = true
	for i in cast.size():
		var model := Models.instantiate(Models.rigged("res://models/characters/%s.glb" % cast[i]))
		add_child(model)
		if i == 0:
			model.position = path[0]
			walker = model
		else:
			# side by side, near enough to chat with each other and to greet you
			model.position = Vector3(-2.6 + (i - 1) * 1.6, 0, -1.4)
			model.rotation.y = 0.0
		model.scale *= Models.people_scale(model)
		Models.bring_to_life(model, "idle", false)
		if i == 0:
			for c in model.get_children():
				if c is Life:
					walker_life = c
	# the game's combat HUD, for speech bubbles, "!" and hit numbers
	var layer := CanvasLayer.new()
	add_child(layer)
	var hud: Control = load("res://scripts/ui/combat_hud.gd").new()
	layer.add_child(hud)
	# a goblin further back: it should spot you ("!"), stare a moment, then come for you
	var gob: Mob = null if mob_kind == "none" else Mob.spawn(mob_kind, 2, Models.rigged("res://models/characters/%s.glb" % MOB_MODELS.get(mob_kind, mob_kind)), self, Vector3(4.5, 0, -12.0), PI, 1.0)
	if gob:
		gob.aggro = 0.0
		lab_mob = gob
		if show_moves and str(gob.def.get("kit", "")) != "":
			_kit_show(gob)
		get_tree().create_timer(3.0).timeout.connect(func() -> void: gob.aggro = 30.0)
		if show_moves:
			# and finally its death, near the end of the recording
			# every special move ready from the start (a power-up comes first), and its death near the end
			for move: String in gob._cooldowns:
				gob._cooldowns[move] = 0.0
			get_tree().create_timer(record_seconds - 4.0).timeout.connect(func() -> void:
				if is_instance_valid(gob) and not gob.dead:
					gob.take(999999)
					Combat._kill(gob))
	if walker_life:
		# the lab drives the walker itself, so no strolling of its own
		walker_life.engaged = true


## A boss with an arena kit: give it a stand-in chamber round the stage, and on the show run, trigger its tricks
## (pay a machine, knock it to half health) so they're on the recording.
func _kit_show(gob: Mob) -> void:
	var chamber := BossChamber.new()
	add_child(chamber)
	chamber.half = 14.0
	chamber.state = "fight"  # a stand-in: no door to slam
	get_tree().create_timer(6.0).timeout.connect(func() -> void:
		Combat.gold = 100
		var kit: Node = load("res://scripts/world/boss_kits/%s.gd" % gob.def.kit).new()
		gob.add_child(kit)
		kit.call("begin", chamber, gob))
	get_tree().create_timer(record_seconds * 0.45).timeout.connect(func() -> void: Story.set_flag("clamp_paid_0"))
	get_tree().create_timer(record_seconds * 0.6).timeout.connect(func() -> void:
		if is_instance_valid(gob):
			gob.hp = gob.max_hp * 0.45)


func _stage() -> void:
	var env := WorldEnvironment.new()
	env.environment = Environment.new()
	env.environment.background_mode = Environment.BG_COLOR
	env.environment.background_color = Color("#2a2e36")
	env.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.environment.ambient_light_color = Color("#c8c8d0")
	env.environment.ambient_light_energy = 0.55
	add_child(env)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48, 35, 0)
	sun.light_energy = 1.1
	sun.shadow_enabled = true
	add_child(sun)
	var floor_mesh := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(30, 30)
	floor_mesh.mesh = plane
	floor_mesh.material_override = Models.toon(Color("#8a8478"))
	add_child(floor_mesh)
	var solid := StaticBody3D.new()
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(30, 1, 30)
	shape.shape = box
	shape.position = Vector3(0, -0.5, 0)
	solid.add_child(shape)
	add_child(solid)


func _process(delta: float) -> void:
	clock += delta
	_drive_walker(delta)
	# you can't die on the stage: the show goes on
	Combat.hp = Combat.max_hp()
	# once a second: where the monster is and what it's doing (for checking sizes and moves from the log)
	if lab_mob and is_instance_valid(lab_mob) and int(clock) != _said:
		_said = int(clock)
		print("LAB t=%d %s at %s state %s clip %s move %s hp %d/%d gold %d held %.1f" % [_said, lab_mob.kind, lab_mob.global_position.snapped(Vector3.ONE * 0.1), lab_mob.state, lab_mob.life.player.current_animation if lab_mob.life and lab_mob.life.player else "-", str(lab_mob._act.get("move", "")), lab_mob.hp, lab_mob.max_hp, Combat.gold, Combat.held])
	if frames_dir != "":
		_record()


## Walk the loop at a stroll; at the front corner, stop, turn to you and talk for a few seconds.
func _drive_walker(delta: float) -> void:
	if walker == null or walker_life == null:
		return
	if talk_left > 0.0:
		talk_left -= delta
		if talk_left <= 0.0:
			walker_life.converse(false)
			pause = 0.6
		return
	if pause > 0.0:
		pause -= delta
		walker_life.locomote(0.0)
		return
	var target: Vector3 = path[(leg + 1) % path.size()]
	var to := target - walker.position
	to.y = 0.0
	if to.length() < 0.08:
		leg = (leg + 1) % path.size()
		if leg == 1:
			# the front-right corner: stop and talk to you
			walker_life.converse(true, Combat.player.global_position)
			talk_left = talk_seconds
		else:
			pause = 0.8
		return
	var speed := 1.25
	walker.rotation.y = lerp_angle(walker.rotation.y, atan2(to.x, to.z), minf(1.0, delta * 6.0))
	walker.position += to.normalized() * minf(to.length(), speed * delta)
	walker_life.locomote(speed)


func _record() -> void:
	# ten frames a second for twelve seconds, after a second to settle
	if clock < 1.0:
		return
	var wanted := int((clock - 1.0) * 10.0)
	if wanted <= frame:
		return
	if frame >= int(record_seconds * 10.0):
		get_tree().quit()
		return
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png(frames_dir.path_join("lab_%03d.png" % frame))
	frame += 1
