extends Node
## A real boss fight, played by a stand-in player and recorded: the floor loads, the chamber's seals break, the player
## walks in, the door slams, and the player fights the boss in first person the way a person would: closes in and
## swings, sidesteps the moves it can see coming, gets out of the ground markers, and uses the arena's tricks (Clamp's
## pay machines). Run it with:
##   Godot --path godot res://scenes/main.tscn -- --floor=1 --boss-demo=clamp --demo-frames=DIR
## It records ten frames a second into DIR until the boss is dead (or 80 s), then quits.

var boss_kind := "clamp"
## Camp mode (--camp-demo=NAME): charge a camp and fight everything in it, nearest first.
var camp_name := ""
var camp_group := ""
var camp_centre := Vector3.ZERO
var frames_dir := ""
var main: Node
var player: Player
var chamber: BossChamber
var boss: Mob
var phase := "setup"   # setup, walk_in, fight, done
var clock := 0.0
var frame := 0
var _end_at := INF
var _dodge_cd := 0.0
var _strafe := 1.0
var _strafe_clock := 0.0
var _paying := -1
var _passed_door := false
var _paid_at_hp: Array[float] = [0.75, 0.4, 0.2]


func _ready() -> void:
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--boss-demo="):
			boss_kind = arg.trim_prefix("--boss-demo=")
		if arg.begins_with("--camp-demo="):
			camp_name = arg.trim_prefix("--camp-demo=")
		if arg.begins_with("--demo-frames="):
			frames_dir = arg.trim_prefix("--demo-frames=")
	main = get_parent()
	Story.cutscenes_on = false
	await get_tree().create_timer(1.0).timeout
	main._set_captured(true)
	StepUp.debug = OS.get_cmdline_user_args().has("--step-debug")
	_setup()


func _setup() -> void:
	player = main.player
	var world: FloorWorld = main.current_floor
	if camp_name != "":
		_setup_camp(world)
		return
	for c: BossChamber in world.wilds.chambers:
		if c.kind == boss_kind:
			chamber = c
	if chamber == null:
		push_error("No chamber with %s on this floor" % boss_kind)
		get_tree().quit()
		return
	# the player as they'd be by now: a few levels up from the floor's quests
	Combat.level = 9
	Combat.stats.STR = 25
	Combat.stats.CON = 55
	Combat.heal_full()
	Combat.gold = 60
	player.stamina = 100.0
	# the chamber's quest done but for the boss, so its door stands open
	if chamber.state == "sealed":
		Story.start(chamber.quest)
		var steps: Array = Story.quests_def[chamber.quest].obj
		for i in steps.size() - 1:
			if steps[i].t == "flag":
				Story.set_flag(str(steps[i].flag))
			else:
				Story.quests[chamber.quest].prog[i] = 99
	await get_tree().create_timer(1.0).timeout
	if OS.get_cmdline_user_args().has("--probe-door"):
		# what's in the way between the gate and the hall: cast rays at knee, waist and head height
		var space := player.get_world_3d().direct_space_state
		for h: float in [0.4, 1.0, 1.6]:
			var from_p: Vector3 = chamber.gate_spot + Vector3.UP * h
			var to_p: Vector3 = chamber.global_position + Vector3.UP * h
			var ray := PhysicsRayQueryParameters3D.create(from_p, to_p)
			ray.exclude = [player.get_rid()]
			var hit := space.intersect_ray(ray)
			if hit.is_empty():
				print("PROBE h=%.1f clear" % h)
			else:
				var owner_node: Object = hit.collider.shape_owner_get_owner(hit.collider.shape_find_owner(hit.shape))
				print("PROBE h=%.1f hit at %s (%.1f m in) collider %s shape %s owner %s pos %s" % [h, hit.position.snapped(Vector3.ONE * 0.1), from_p.distance_to(hit.position), hit.collider.name, hit.shape, owner_node, owner_node.global_position if owner_node is Node3D else ""])
		print("PROBE door %s gate %s centre %s door disabled %s" % [chamber._door.global_position, chamber.gate_spot, chamber.global_position, chamber._door.disabled])
		get_tree().quit()
		return
	# just inside the hall's wall on the door side, facing in (a step or two from where the door slams)
	# outside the gate, as a player would arrive: walk in through the doorway
	player.global_position = chamber.gate_spot + Vector3.UP * 0.5
	_passed_door = false
	_face(chamber.global_position, 0.0)
	phase = "walk_in"
	clock = 0.0


func _physics_process(delta: float) -> void:
	if phase == "setup" or phase == "done":
		return
	clock += delta
	if int(clock * 2.0) != int((clock - delta) * 2.0):
		var b: Mob = boss if camp_name != "" else chamber.boss
		print("FPS %d" % Engine.get_frames_per_second())
		print("DEMO t=%.1f %s left %d me %s hp %d held %.1f | target %s %s hp %d/%d move %s" % [clock, phase, Combat.mobs.filter(func(m: Node) -> bool: return is_instance_valid(m) and not m.dead and m.group == camp_group).size(), player.global_position.snapped(Vector3.ONE * 0.1), Combat.hp, Combat.held, b.global_position.snapped(Vector3.ONE * 0.1) if b else Vector3.ZERO, b.state if b else "-", b.hp if b else 0, b.max_hp if b else 0, str(b._act.get("move", "swing" if not b._act.is_empty() else "")) if b else ""])
	_release()
	if phase == "walk_in" and camp_name != "":
		_face(camp_centre, -0.05)
		Input.action_press("move_forward")
		Input.action_press("sprint")
		var first := _nearest_enemy()
		if first and first.state != "idle":
			boss = first
			phase = "fight"
		return
	if phase == "fight" and camp_name != "":
		boss = _nearest_enemy()
		if boss == null and _end_at == INF:
			_end_at = clock + 3.5
	if phase == "walk_in":
		# through the doorway first, then on into the hall
		var door: Vector3 = chamber._door.global_position
		var through := Vector2(player.global_position.x - door.x, player.global_position.z - door.z).length() < 1.5
		if through:
			_passed_door = true
		_face(chamber.global_position if _passed_door else Vector3(door.x, player.global_position.y, door.z), -0.05)
		Input.action_press("move_forward")
		if chamber.state == "fight" or chamber.boss != null:
			boss = chamber.boss
			phase = "fight"
			# a fight that fits a minute's recording: the boss's health trimmed so the stand-in player can finish it
			boss.max_hp = minf(boss.max_hp, Combat.weapon_damage() * 85.0)
			boss.hp = boss.max_hp
			# an even fight: the player at the boss's level
			Combat.level = maxi(Combat.level, boss.level)
			Combat.heal_full()
		if clock > 25.0:
			get_tree().quit()
		return
	if boss == null or not is_instance_valid(boss) or boss.dead or Combat.hp <= 0.0:
		if _end_at == INF:
			_end_at = clock + 3.5
		if clock > _end_at:
			phase = "done"
			get_tree().quit()
		return
	if clock > (75.0 if camp_name != "" else 80.0):
		get_tree().quit()
		return
	_fight(delta)


func _process(_delta: float) -> void:
	if frames_dir != "" and phase != "setup":
		_record()


func _release() -> void:
	for a: String in ["move_forward", "move_back", "move_left", "move_right", "sprint"]:
		Input.action_release(a)


## Look at a point; with pitch NAN, tilt the view up or down to it as well (eyes are 1.7 m up).
func _face(at: Vector3, pitch: float) -> void:
	var to := at - player.global_position
	player.yaw = lerp_angle(player.yaw, atan2(-to.x, -to.z), 0.25)
	if is_nan(pitch):
		var flat := Vector2(to.x, to.z).length()
		player.pitch = lerpf(player.pitch, clampf(atan2(to.y - 1.7, flat), -0.6, 0.5), 0.15)
	else:
		player.pitch = pitch


func _fight(delta: float) -> void:
	_dodge_cd -= delta
	_strafe_clock -= delta
	if _strafe_clock <= 0.0:
		_strafe_clock = randf_range(1.5, 3.0)
		_strafe = -_strafe
	var me := player.global_position
	var at := boss.global_position
	var flat := Vector2(at.x - me.x, at.z - me.z)
	var gap := flat.length() - boss.radius
	# watch its chest, a little below its head: the whole of it in view
	_face(at + Vector3.UP * boss.height * 0.55, NAN)
	if Combat.held > 0.0:
		return
	# 1. something on the ground about to go off where I stand: get out (a clamp trap, tickets, a slam)
	var danger := _danger_at(me)
	if danger != Vector3.INF:
		var away := Vector2(me.x - danger.x, me.z - danger.z).normalized()
		_move_world(away)
		if _dodge_cd <= 0.0 and player.stamina > 30.0:
			player.dodge()
			_dodge_cd = 1.2
		return
	# 2. its fine machines: pay one at the right moments, when he's not in my face
	if _paying >= 0 or (_paid_at_hp.size() > 0 and boss.hp < boss.max_hp * _paid_at_hp[0] and boss.state != "stagger"):
		if _go_pay():
			return
	# 3. it's winding up a swing at me: get a hit in early, then step back out of reach just before it lands
	if boss.state == "attack" and not boss._act.is_empty() and not boss._act.get("done", false) and boss._act.shape == "sector" and gap < boss.reach + 1.0 			and float(boss._act.t) > float(boss._act.windup) - 0.7:
		_move_world(-flat.normalized())
		if _dodge_cd <= 0.0 and float(boss._act.t) > float(boss._act.windup) - 0.45 and player.stamina > 30.0:
			player.dodge()
			_dodge_cd = 1.4
		return
	# 4. otherwise: close in, circle a little, and hit it
	if gap > Combat.REACH - 0.15:
		Input.action_press("move_forward")
		Input.action_press("move_left" if _strafe < 0.0 else "move_right", 0.35)
		if gap > 6.0:
			Input.action_press("sprint")
	else:
		Input.action_press("move_left" if _strafe < 0.0 else "move_right", 0.5)
		var heavy := boss.state == "stagger" and player.stamina > 40.0
		player.swing(heavy)


## Camp mode: the player at a camp's edge, a Cone Captain stood in with the rest, ready to charge.
func _setup_camp(world: FloorWorld) -> void:
	var camp: Dictionary = {}
	for c: Dictionary in world.data.get("camps", []):
		if c.name == camp_name:
			camp = c
	if camp.is_empty():
		push_error("No camp called " + camp_name)
		get_tree().quit()
		return
	camp_group = "camp:" + camp_name
	camp_centre = world.lift(Vector3(camp.x, 0, camp.z))
	Combat.level = 12
	Combat.stats.STR = 34
	Combat.stats.CON = 42
	Combat.heal_full()
	player.stamina = 100.0
	# Sergeant Pylon's lieutenant joins his lads for this one
	world.fighter("captain", camp_centre + Vector3(4, 0, 4), 0.0, 8, camp_group, 1.0)
	# and the rest of his lads, back from their rounds: a proper crowd
	for i in 8:
		var a := TAU * i / 8.0
		world.fighter("goblin" if i % 3 != 2 else "thrower", camp_centre + Vector3(cos(a), 0, sin(a)) * 9.0, a + PI, 6, camp_group)
	await get_tree().create_timer(1.0).timeout
	var from := camp_centre + Vector3(0, 0, float(camp.get("r", 20)) + 22.0)
	player.global_position = world.lift(from) + Vector3.UP * 0.5
	_face(camp_centre, -0.05)
	phase = "walk_in"
	clock = 0.0


## Camp mode: the nearest of the camp still standing.
func _nearest_enemy() -> Mob:
	var best: Mob = null
	var dist := INF
	for m: Node in Combat.mobs:
		if not is_instance_valid(m) or m.dead or m.group != camp_group:
			continue
		var d: float = m.global_position.distance_to(player.global_position)
		if d < dist:
			dist = d
			best = m
	return best


## The middle of the nearest marker on the ground that's about to go off and covers this spot, or INF: the target's,
## or (in a camp) anyone's.
func _danger_at(me: Vector3) -> Vector3:
	if camp_name != "":
		var keep := boss
		for m: Node in Combat.mobs:
			if is_instance_valid(m) and not m.dead and m.group == camp_group and m.state == "attack" and m.global_position.distance_to(me) < 20.0:
				boss = m
				var d := _danger_one(me)
				if d != Vector3.INF:
					boss = keep
					return d
		boss = keep
		return Vector3.INF
	return _danger_one(me)


func _danger_one(me: Vector3) -> Vector3:
	var kit: Node = null
	for c in boss.get_children():
		if c.has_method("begin"):
			kit = c
	if kit:
		for t: Dictionary in (kit.get("_traps") if kit.get("_traps") != null else []):
			if Vector2(me.x - t.at.x, me.z - t.at.z).length() < 2.4:
				return t.at
	if boss.state == "attack" and not boss._act.is_empty() and not boss._act.get("done", false):
		var act: Dictionary = boss._act
		if act.shape == "rain" or act.shape == "puddle":
			for s: Vector3 in act.spots:
				if Vector2(me.x - s.x, me.z - s.z).length() < float(act.r) + 1.0:
					return s
		elif act.shape == "circle_self" and boss._hits(me):
			return boss.global_position
		elif act.shape == "rect" and boss._hits(me):
			# out of the lane sideways
			var side := Vector3(cos(act.facing), 0, -sin(act.facing)) * _strafe
			return me - side
	return Vector3.INF


## Walk to a pay machine nobody's paid yet, and pay it.
func _go_pay() -> bool:
	var kit: Node = null
	for c in boss.get_children():
		if c.has_method("begin"):
			kit = c
	if kit == null:
		_paid_at_hp.clear()
		return false
	if kit.get("_machines") == null:
		_paid_at_hp.clear()
		return false
	var machines: Array = kit.get("_machines")
	if _paying < 0:
		var best := INF
		for i in machines.size():
			if not machines[i].paid and machines[i].item.pos.distance_to(player.global_position) < best:
				best = machines[i].item.pos.distance_to(player.global_position)
				_paying = i
		if _paying < 0:
			_paid_at_hp.clear()
			return false
	var item: Dictionary = machines[_paying].item
	var to := Vector2(item.pos.x - player.global_position.x, item.pos.z - player.global_position.z)
	if to.length() > 1.6:
		_move_world(to.normalized())
		Input.action_press("sprint")
		return true
	# at the machine: E
	main.use_nearby()
	_paying = -1
	_paid_at_hp.remove_at(0)
	return true


## Hold the movement keys that walk the player in this world direction (whatever way they're looking).
func _move_world(dir: Vector2) -> void:
	var local := Vector2(dir.x, dir.y).rotated(player.yaw)
	if local.y < -0.3:
		Input.action_press("move_forward", minf(1.0, -local.y))
	elif local.y > 0.3:
		Input.action_press("move_back", minf(1.0, local.y))
	if local.x < -0.3:
		Input.action_press("move_left", minf(1.0, -local.x))
	elif local.x > 0.3:
		Input.action_press("move_right", minf(1.0, local.x))


func _record() -> void:
	# thirty frames a second, so it plays smoothly
	var wanted := int(clock * 30.0)
	if wanted <= frame:
		return
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_jpg(frames_dir.path_join("demo_%04d.jpg" % frame), 0.9)
	frame += 1
