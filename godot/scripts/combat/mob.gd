class_name Mob
extends CharacterBody3D
## A monster that fights. Ported from the prototype's game/mobs.js: it stands about until you come close, chases,
## winds up an attack you can see coming on the ground, strikes, recovers, and gives up and walks home if you drag it
## too far from its camp. Bosses also use their special moves, and lose their temper at half health.
## The model and its Life do the looking; this does the thinking.

const GRAVITY := 14.0
const TELEGRAPH_COLOR := Color(1.0, 0.16, 0.08, 0.28)
const TELEGRAPH_FILL := Color(1.0, 0.3, 0.1, 0.42)
## How each boss move looks and lands: shape, damage multiplier, and whether it covers an area (no parry or block).
const MOVES := {
	"slam": { "shape": "circle_self", "mult": 1.6, "area": true, "clip": "slam" },
	"nova": { "shape": "circle_self", "mult": 1.3, "area": true },
	"sweep": { "shape": "circle_self", "mult": 1.2, "area": false },
	"charge": { "shape": "rect", "mult": 1.6, "area": false, "clip": "charge" },
	"barrage": { "shape": "rain", "mult": 0.9, "area": true, "count": 3 },
	"keys": { "shape": "rain", "mult": 1.0, "area": true, "count": 3, "clip": "throw" },
	# a leap through the air onto where you're standing, with its own clip; any monster with a "slam" clip can have it
	"leap": { "shape": "rain", "mult": 1.5, "area": true, "count": 1, "leap": true, "clip": "slam" },
	# a full turn with the weapon out: hits all round, so standing beside or behind is no escape
	"spin": { "shape": "circle_self", "mult": 1.4, "area": false, "clip": "spin" },
	# no hit: the monster powers up, and hits harder and moves faster for a while
	"powerup": { "shape": "buff", "clip": "powerup" },
	# a lunge that grabs: caught, you're held fast for a moment (and Clamp fines you)
	"grab": { "shape": "rect", "mult": 1.2, "area": false, "clip": "grab", "hold": 2.0, "fine": 15 },
	# thrown paper that lands and sticks: the spots stay on the floor and slow you while you're in them
	"tickets": { "shape": "rain", "mult": 0.7, "area": true, "count": 4, "clip": "throw", "sticky": true },
	"puddle": { "shape": "puddle", "mult": 0.35, "area": true },
	"summon": { "shape": "call", "clip": "summon" },
	"whistle": { "shape": "call" },
	"clockin": { "shape": "call" },
}

var kind := ""
var def: Dictionary = {}
var level := 1
var max_hp := 40.0
var hp := 40.0
var dmg := 6.0
var speed := 3.4
var reach := 1.9
var arc := 1.4
var aggro := 15.0
var leash := 24.0
var home := Vector3.ZERO
var home_yaw := 0.0
## Monsters of one camp share a group, so they fight together and the loot box knows when they're gone.
var group := ""
var summoned := false
## For bosses that call for help: what turns up.
## Finding its way (a chamber boss, in a chamber with a navmesh): round obstacles instead of straight into them.
var nav_on := false
var _path := PackedVector3Array()
var _path_i := 0
var minion_kind := ""
var minion_path := ""
var radius := 0.5
var height := 1.8
var state := "idle"
var dead := false
var awake := false
var model: Node3D
var life: Life

var _t := 0.0
var _act: Dictionary = {}
var _cooldowns: Dictionary = {}
var _uses: Dictionary = {}
var _attack_cd := 0.0
var _enraged := false
var _stun := 0.0
var _stuck := 0.0
var _detour := 0.0
var _detour_dir := Vector2.ZERO
var _telegraph: Node3D
var _fill: Node3D
var _shot: MeshInstance3D
var _puddles: Array = []
var _shape: CollisionShape3D
## How many special moves it has used, for the checks.
var moves_used := 0


## Makes a fighting monster from a model file and stands it at a spot. Returns null if the model is missing.
static func spawn(monster: String, lvl: int, path: String, parent: Node, pos: Vector3, yaw := 0.0, size := 1.0) -> Mob:
	path = Models.rigged(path)
	if not ResourceLoader.exists(path):
		return null
	var mob := Mob.new()
	mob.model = Models.instantiate(path)
	mob.model.scale = Vector3.ONE * size
	mob.add_child(mob.model)
	mob.position = pos
	mob.rotation.y = yaw
	parent.add_child(mob)
	mob.setup(monster, lvl)
	Models.bring_to_life(mob.model, "idle", true)
	mob.life = mob.model.get_children().filter(func(c: Node) -> bool: return c is Life).front()
	Combat.register(mob)
	return mob


func setup(monster: String, lvl: int) -> void:
	kind = monster
	level = maxi(1, lvl)
	def = Data.monsters.monsters.get(kind, {})
	# monsters with no stats yet (the Undercity's) fight like a sturdy goblin of their level
	max_hp = float(def.get("hp", 60)) * (1.0 + 0.24 * (level - 1))
	hp = max_hp
	dmg = float(def.get("dmg", 8)) * (1.0 + 0.16 * (level - 1))
	speed = float(def.get("speed", 3.4))
	reach = float(def.get("reach", 2.0))
	arc = float(def.get("arc", 1.4))
	aggro = float(def.get("aggro", 15))
	leash = float(def.get("leash", 24))
	home = position
	home_yaw = rotation.y
	_shape = Models.body_for(model)
	_shape.position = Vector3.UP * (_shape.shape as CapsuleShape3D).height / 2.0
	add_child(_shape)
	radius = (_shape.shape as CapsuleShape3D).radius
	height = (_shape.shape as CapsuleShape3D).height
	floor_snap_length = 0.6
	for move: String in def.get("abilities", []):
		var spec: Dictionary = Data.monsters.abilities.get(move, {})
		_cooldowns[move] = randf_range(2.0, float(spec.get("cd", 10)) * 0.5)
		_uses[move] = int(spec.get("uses", 99))
	set_physics_process(false)
	Combat.player_died.connect(_on_player_died)


func _on_player_died() -> void:
	if not dead and state != "idle":
		_go_home()


func set_awake(on: bool) -> void:
	if on == awake:
		return
	awake = on
	set_physics_process(on)
	if not on and state != "idle" and not dead:
		# out of sight, out of the fight: back home, patched up
		_end_act()
		global_position = home
		rotation.y = home_yaw
		hp = max_hp
		state = "idle"
		_engaged(false)


func take(amount: int) -> void:
	hp -= amount
	if Combat.truce_groups.has(group):
		Combat.truce_groups.erase(group)
		Combat.notice.emit("You broke the truce with %s. They noticed." % group.get_slice(":", 1), Color("#ff5a3a"))
	if state == "idle" or state == "return":
		_engage()
	if state != "attack" and life:
		life.hit()
	if def.get("boss", false) and not _enraged and hp < max_hp * 0.5:
		_enraged = true
		speed *= 1.2
		dmg *= 1.2
		Combat.notice.emit(str(def.get("enrage", "%s IS FURIOUS" % str(def.get("name", kind)).to_upper())), Color("#ff5a3a"))


func flinch() -> void:
	if life:
		life.hit()


func stun(seconds: float) -> void:
	if dead or def.get("boss", false) and seconds < 1.0:
		return
	_end_act()
	state = "stagger"
	_t = 0.0
	_stun = seconds
	if life:
		life.hit()


func die() -> void:
	dead = true
	hp = 0
	_end_act()
	for p: Dictionary in _puddles:
		p.node.queue_free()
	_puddles.clear()
	_engaged(false)
	_shape.set_deferred("disabled", true)
	set_physics_process(false)
	if life:
		life.die()
	# the body lies there a while, then the dungeon tidies up
	get_tree().create_timer(14.0).timeout.connect(hide)


# ---------------------------------------------------------------- thinking
func _physics_process(delta: float) -> void:
	if dead or def.get("passive", false):
		return
	var p: Node3D = Combat.player
	if p == null:
		return
	_t += delta
	_attack_cd -= delta
	for move: String in _cooldowns:
		_cooldowns[move] -= delta
	_tick_puddles(delta, p)
	var to: Vector3 = p.global_position - global_position
	var flat := Vector2(to.x, to.z)
	var dist := flat.length() - radius
	var alive := Combat.hp > 0.0
	var wish := Vector2.ZERO
	match state:
		"idle":
			if alive and not Combat.peaceful and not Combat.truce_groups.has(group) and dist < aggro and absf(to.y) < 6.0:
				_engage()
				return
			_patrol(delta)
			return
		"spot":
			_face(flat, delta * 10.0)
			velocity = Vector3.ZERO
			if life and _spot_time <= SPOT_TIME:
				life.locomote(0.0)
			if _t >= _spot_time:
				state = "chase"
			return
		"chase":
			if not alive or global_position.distance_to(home) > leash or p.global_position.distance_to(home) > leash + 14.0:
				_go_home()
				return
			_face(flat, delta * 8.0)
			if _start_move(dist, p.global_position):
				return
			var ranged: Dictionary = def.get("ranged", {})
			if not ranged.is_empty():
				if _attack_cd <= 0.0 and dist >= float(ranged.min) * 0.6 and dist <= float(ranged.max):
					_start_shot(p.global_position, ranged)
					return
				if dist < float(ranged.min):
					wish = -flat.normalized()
				elif dist > float(ranged.max) * 0.85:
					wish = flat.normalized()
			else:
				if _attack_cd <= 0.0 and dist <= reach:
					_start_swing(flat)
					return
				if dist > reach * 0.75:
					wish = _nav_wish(p.global_position, flat)
		"attack":
			_run_act(delta, p)
		"stagger":
			if _t >= _stun:
				state = "chase"
		"return":
			var back := Vector2(home.x - global_position.x, home.z - global_position.z)
			if back.length() < 1.0:
				state = "idle"
				hp = max_hp
				rotation.y = home_yaw
				velocity = Vector3.ZERO
				_engaged(false)
				return
			_face(back, delta * 6.0)
			wish = back.normalized()
	_move(delta, wish)


func _engage() -> void:
	if state != "idle" and state != "return":
		return
	state = "spot"
	_t = 0.0
	_spot_time = SPOT_TIME
	# some monsters show off first: beat their chest, roar, and only then come for you
	if randf() < float(def.get("taunt", 0.0)) and life and life.player and life.player.has_animation("taunt"):
		life.player.speed_scale = 1.3
		life.player.play("taunt", 0.2)
		_spot_time = life.player.get_animation("taunt").length / 1.3
		var lines: Array = def.get("taunts", [])
		if not lines.is_empty():
			Combat.say(self, str(lines.pick_random()), 2.2, life._head_height())
	_engaged(true)
	_attack_cd = randf_range(0.2, 0.8)
	# the moment it notices you: a red "!", and a beat to glare before it comes
	Combat.sfx(global_position + Vector3.UP * (height + 0.5), "!", Color("#ff3a2a"))
	var barks: Array = def.get("barks", [])
	if not barks.is_empty() and (randf() < 0.35 or def.get("boss", false)):
		Combat._float(global_position + Vector3.UP * (height + 0.6), str(barks.pick_random()), Color("#ffe9c0"))
	if def.get("boss", false):
		Combat.boss = self
	# the rest of the camp joins in
	if group != "":
		for m: Node in Combat.mobs:
			if is_instance_valid(m) and m != self and m.group == group and not m.dead and m.state == "idle" \
					and m.global_position.distance_to(global_position) < 28.0:
				m._engage()


## How long a monster stops and stares when it first sees you, before it comes for you.
const SPOT_TIME := 0.45
var _spot_time := SPOT_TIME
var _patrol_to := Vector3.INF
var _patrol_wait := 0.0


## Not standing frozen: a few slow steps round where it lives, a look about, and back.
func _patrol(delta: float) -> void:
	_patrol_wait -= delta
	if _patrol_to == Vector3.INF:
		if _patrol_wait > 0.0:
			return
		var a := randf() * TAU
		_patrol_to = home + Vector3(cos(a), 0, sin(a)) * randf_range(1.5, 4.5)
		return
	var to := Vector2(_patrol_to.x - global_position.x, _patrol_to.z - global_position.z)
	if to.length() < 0.5:
		_patrol_to = Vector3.INF
		_patrol_wait = randf_range(3.0, 9.0)
		velocity = Vector3.ZERO
		if life:
			life.locomote(0.0)
		return
	_face(to, delta * 4.0)
	velocity.x = to.normalized().x * speed * 0.35
	velocity.z = to.normalized().y * speed * 0.35
	velocity.y = 0.0 if is_on_floor() else velocity.y - GRAVITY * delta
	move_and_slide()
	if life:
		life.locomote(speed * 0.35)


## Which way to walk to reach a point: straight at it, or along the navmesh path when there is one.
func _nav_wish(target: Vector3, flat: Vector2) -> Vector2:
	if not nav_on:
		return flat.normalized()
	if Engine.get_physics_frames() % 15 == 0 or _path.is_empty():
		_path = NavigationServer3D.map_get_path(get_world_3d().navigation_map, global_position, target, true)
		_path_i = 1
	while _path_i < _path.size() and Vector2(_path[_path_i].x - global_position.x, _path[_path_i].z - global_position.z).length() < 0.7:
		_path_i += 1
	if _path_i >= _path.size():
		return flat.normalized()
	var to := _path[_path_i] - global_position
	var step := Vector2(to.x, to.z)
	# going round something: look where it's going, not through the wall at you
	if step.normalized().dot(flat.normalized()) < 0.8:
		_face(step, get_physics_process_delta_time() * 8.0)
	return step.normalized()


func _go_home() -> void:
	_end_act()
	state = "return"
	if Combat.boss == self:
		Combat.boss = null


func _engaged(on: bool) -> void:
	if life:
		life.engaged = on
		if not on and life.player and life.player.has_animation("idle"):
			life.player.play("idle", 0.3)


func _face(dir: Vector2, rate: float) -> void:
	if dir.length_squared() < 0.0001:
		return
	rotation.y = lerp_angle(rotation.y, atan2(dir.x, dir.y), minf(1.0, rate))


func _forward() -> Vector2:
	return Vector2(sin(rotation.y), cos(rotation.y))


## Walks toward where it wants to go, and steps around whatever is in the way.
func _move(delta: float, wish: Vector2) -> void:
	var run := speed * (0.7 if state == "return" else 1.0)
	if _detour > 0.0:
		_detour -= delta
		wish = _detour_dir
	velocity.x = wish.x * run
	velocity.z = wish.y * run
	velocity.y = 0.0 if is_on_floor() else velocity.y - GRAVITY * delta
	var meant := Vector3(velocity.x, 0, velocity.z)
	move_and_slide()
	StepUp.try(self, meant, delta)
	var moving := wish.length_squared() > 0.01
	if moving and get_real_velocity().length() < run * 0.3:
		_stuck += delta
		if _stuck > 0.4:
			_stuck = 0.0
			_detour = 0.8
			_detour_dir = wish.rotated(1.2 if randf() < 0.5 else -1.2)
	else:
		_stuck = 0.0
	_animate(moving, run)


func _animate(moving: bool, run: float) -> void:
	if life == null or life.player == null:
		return
	var current := life.player.current_animation
	# a move in progress (a swing, a leap, a charge, a taunt, a flinch) plays out; only idle, walk and run give way to moving
	if state == "attack" or (current not in ["idle", "walk", "run", ""] and life.player.is_playing()):
		return
	life.locomote(get_real_velocity().length() if moving else 0.0)


# ---------------------------------------------------------------- attacks
func _start_swing(flat: Vector2) -> void:
	var facing := atan2(flat.x, flat.y)
	rotation.y = facing
	var act := { "shape": "sector", "at": global_position, "facing": facing, "range": reach + 0.3, "arc": arc,
		"windup": float(def.get("windup", 0.6)), "travel": 0.0, "recover": float(def.get("swing", 0.2)) + float(def.get("recover", 0.6)),
		"mult": 1.0, "area": false }
	# a combo: one clip with several hits in it, at these seconds (before the clip is sped up)
	# a long swing clip can be sped up so the blow lands on time ("attack_pace")
	act.anim_speed = float(def.get("attack_pace", 1.0))
	var combo: Dictionary = def.get("combo", {})
	if not combo.is_empty():
		var pace := float(combo.get("speed", 1.0))
		act.hits = (combo.hits as Array).map(func(t: float) -> float: return t / pace)
		act.windup = float(act.hits[-1])
		act.anim_speed = pace
		act.landed = 0
	_begin(act)


func _start_shot(target: Vector3, ranged: Dictionary) -> void:
	var travel := global_position.distance_to(target) / float(ranged.speed)
	_attack_cd = float(ranged.cd)
	# "pace" speeds the throwing clip up so the throw leaves the hand as the shot launches
	_begin({ "shape": "rain", "spots": [target], "r": 1.5, "at": global_position, "facing": rotation.y,
		"windup": float(ranged.windup), "travel": travel, "recover": 0.4, "mult": 1.0, "area": false, "shot": true,
		"anim_speed": float(ranged.get("pace", 1.0)) })


## A boss move, if one is ready and the player is in range for it.
func _start_move(dist: float, target: Vector3) -> bool:
	for move: String in _cooldowns:
		if _cooldowns[move] > 0.0 or _uses[move] <= 0:
			continue
		var spec: Dictionary = Data.monsters.abilities.get(move, {})
		var look: Dictionary = MOVES.get(move, {})
		var range_ := float(spec.get("range", 99))
		if dist > range_ or dist < float(spec.get("min", 0.0)) or look.is_empty():
			continue
		# a move with a "chance" isn't always taken when it's ready: the monster mostly fights normally
		if randf() > float(spec.get("chance", 1.0)):
			_cooldowns[move] = 2.5
			continue
		_cooldowns[move] = float(spec.get("cd", 10))
		_uses[move] -= 1
		moves_used += 1
		# a monster can tune a move to its own clips: when the blow lands, and how fast the clip plays
		var tune: Dictionary = (def.get("moves", {}) as Dictionary).get(move, {})
		var act := { "move": move, "shape": look.shape, "at": global_position, "facing": rotation.y, "range": range_,
			"windup": float(tune.get("windup", spec.get("windup", 1.0))), "travel": 0.0, "recover": float(tune.get("recover", 0.8)),
			"mult": float(look.get("mult", 1.0)), "area": look.get("area", true), "clip": look.get("clip", "attack"),
			"anim_speed": float(tune.get("pace", 1.0)), "hold": float(look.get("hold", 0.0)), "fine": int(look.get("fine", 0)),
			"sticky": look.get("sticky", false) }
		match look.shape:
			"rect":
				act.facing = atan2(target.x - global_position.x, target.z - global_position.z)
				act.range = minf(range_, dist + 3.0)
				# the lane runs past you, but the body pulls up just short of you instead of running through you
				act.stop = maxf(0.0, minf(act.range, dist - 1.8))
				act.width = 2.6
				act.travel = 0.35
				if act.hold > 0.0:
					# a grab is a short, narrow lunge
					act.range = minf(range_, dist + 1.5)
					act.width = 2.0
					act.travel = 0.25
				rotation.y = act.facing
			"rain":
				var spots: Array = [target]
				for i in int(look.count) - 1:
					spots.append(target + Vector3(randf_range(-4, 4), 0, randf_range(-4, 4)))
				act.spots = spots
				act.r = 2.2
				act.travel = 0.3
				if look.get("leap", false):
					act.r = 2.8
					act.travel = 0.15
					act.recover = 1.4
					act.leap_from = global_position
					act.facing = atan2(target.x - global_position.x, target.z - global_position.z)
					rotation.y = act.facing
			"puddle":
				act.spots = [target]
				act.r = 3.0
			"call":
				act.recover = 0.5
		var shout: Array = def.get("barks", [])
		if look.shape == "call" and not shout.is_empty():
			Combat._float(global_position + Vector3.UP * (height + 0.6), str(shout[1 % shout.size()]), Color("#ffe9c0"))
		_begin(act)
		return true
	return false


func _begin(act: Dictionary) -> void:
	_act = act
	_act.t = 0.0
	_act.done = false
	state = "attack"
	velocity = Vector3.ZERO
	if life:
		life.attack(act.get("clip", "attack"), float(act.get("anim_speed", 1.0)))
	if act.shape != "call" and act.shape != "buff":
		_show_telegraph(act)


func _run_act(delta: float, p: Node3D) -> void:
	_act.t += delta
	var windup: float = _act.windup
	if _fill:
		_fill.scale = Vector3.ONE * clampf(_act.t / windup, 0.05, 1.0) if _act.shape != "rect" else Vector3(1, 1, clampf(_act.t / windup, 0.05, 1.0))
	if _act.get("shot", false) and _act.t > windup:
		_fly_shot((_act.t - windup) / maxf(0.01, _act.travel))
	if _act.shape == "rect" and _act.t > windup and not _act.done:
		# the charge itself: barrel down the lane
		var k := minf(1.0, (_act.t - windup) / _act.travel)
		var start: Vector3 = _act.at
		var dir := Vector3(sin(_act.facing), 0, cos(_act.facing))
		global_position = Vector3(start.x, global_position.y, start.z) + dir * float(_act.get("stop", _act.range)) * k
	if _act.has("hits") and not _act.done:
		# the combo's earlier hits; the last one lands the usual way below
		var hits: Array = _act.hits
		while _act.landed < hits.size() - 1 and _act.t >= float(hits[_act.landed]):
			_act.landed += 1
			if _hits(p.global_position):
				Combat.hit_player(dmg * _act.mult, self, _act.area)
				if _act.is_empty():
					return  # that hit finished the player off, and the fight is over
	if _act.has("leap_from") and not _act.done:
		# through the air: take off just after the crouch, come down on the ring as the clip lands
		var k := smoothstep(0.12, windup + _act.travel, _act.t)
		var from: Vector3 = _act.leap_from
		var spot: Vector3 = _act.spots[0]
		var dir := Vector3(spot.x - from.x, 0, spot.z - from.z)
		var land := from + dir - dir.normalized() * minf(radius + 1.1, dir.length())
		global_position = Vector3(lerpf(from.x, land.x, k), global_position.y, lerpf(from.z, land.z, k))
	if not _act.done and _act.t >= windup + _act.travel:
		_act.done = true
		_land(p)
		if _act.is_empty():
			return  # that blow ended the fight
	if _act.t >= windup + _act.travel + _act.recover:
		_end_act()
		state = "chase"
		_attack_cd = maxf(_attack_cd, randf_range(0.3, 0.9))


func _land(p: Node3D) -> void:
	_hide_telegraph()
	match _act.shape:
		"call":
			_call_help()
			return
		"buff":
			_power_up()
			return
		"puddle":
			_lay_puddle(_act.spots[0], _act.r)
			return
	if _act.get("sticky", false):
		for spot: Vector3 in _act.spots:
			_lay_puddle(spot, float(_act.r), true)
	if _hits(p.global_position):
		Combat.hit_player(dmg * _act.mult, self, _act.area)
		if float(_act.get("hold", 0.0)) > 0.0 and Combat.hp > 0.0:
			Combat.held = float(_act.hold)
			Combat.sfx(p.global_position + Vector3.UP * 1.6, "CLAMPED!", Color("#ffd23a"))
			var fine: int = mini(int(_act.get("fine", 0)), Combat.gold)
			if fine > 0:
				Combat.gold -= fine
				Combat.notice.emit("FINED %d GOLD" % fine, Color("#ffd23a"))


func _hits(point: Vector3) -> bool:
	var at: Vector3 = _act.at
	match _act.shape:
		"sector":
			var d := Vector2(point.x - at.x, point.z - at.z)
			if d.length() > _act.range + 0.4:
				return false
			return d.length() < 0.6 or absf(Vector2(sin(_act.facing), cos(_act.facing)).angle_to(d)) <= _act.arc / 2.0
		"circle_self":
			return Vector2(point.x - at.x, point.z - at.z).length() <= _act.range
		"rect":
			var local := Vector2(point.x - at.x, point.z - at.z).rotated(_act.facing)
			# rotated into the lane: y runs along the charge, x across it
			return local.y >= -1.0 and local.y <= _act.range + 1.0 and absf(local.x) <= _act.width / 2.0 + 0.4
		"rain":
			for spot: Vector3 in _act.spots:
				if Vector2(point.x - spot.x, point.z - spot.z).length() <= _act.r:
					return true
	return false


func _end_act() -> void:
	_hide_telegraph()
	if _shot:
		_shot.queue_free()
		_shot = null
	_act = {}
	if state == "attack":
		state = "chase"


## Powered up: hits harder and moves faster for a while, and looks it (a touch bigger).
const POWER_TIME := 14.0
var _powered := false


func _power_up() -> void:
	if _powered or dead:
		return
	_powered = true
	dmg *= 1.4
	speed *= 1.25
	var grow := model.create_tween()
	grow.tween_property(model, "scale", model.scale * 1.1, 0.3)
	Combat.notice.emit("%s POWERS UP" % str(def.get("name", kind)).to_upper(), Color("#ffb02a"))
	get_tree().create_timer(POWER_TIME).timeout.connect(func() -> void:
		if not is_instance_valid(self) or dead:
			return
		_powered = false
		dmg /= 1.4
		speed /= 1.25
		model.create_tween().tween_property(model, "scale", model.scale / 1.1, 0.5))


func _call_help() -> void:
	if minion_path == "":
		return
	for i in 2:
		var a := randf() * TAU
		var at := global_position + Vector3(cos(a), 0, sin(a)) * 3.5
		var help := Mob.spawn(minion_kind, maxi(1, level - 1), minion_path, get_parent(), at, a)
		if help:
			help.group = group
			help.summoned = true
			help.set_awake(true)
			help._engage()


func _lay_puddle(at: Vector3, r: float, sticky := false) -> void:
	# a sticky patch (tickets, glue) is pale and lasts longer, and slows you instead of hurting
	var node := _disc(r, TAU, Color(0.98, 0.95, 0.8, 0.45) if sticky else Color(0.45, 0.85, 0.2, 0.4))
	get_parent().add_child(node)
	node.global_position = at + Vector3.UP * 0.05
	_puddles.append({ "node": node, "at": at, "r": r, "left": 10.0 if sticky else 6.0, "tick": 0.0, "sticky": sticky })


func _tick_puddles(delta: float, p: Node3D) -> void:
	for i in range(_puddles.size() - 1, -1, -1):
		var pud: Dictionary = _puddles[i]
		pud.left -= delta
		pud.tick -= delta
		if pud.tick <= 0.0:
			pud.tick = 0.5
			if Vector2(p.global_position.x - pud.at.x, p.global_position.z - pud.at.z).length() < pud.r:
				if pud.get("sticky", false):
					Combat.slowed = 0.6
				else:
					Combat.hit_player(dmg * 0.35, self, true)
		if pud.left <= 0.0:
			pud.node.queue_free()
			_puddles.remove_at(i)


# ---------------------------------------------------------------- what the player sees coming
func _show_telegraph(act: Dictionary) -> void:
	_hide_telegraph()
	_telegraph = Node3D.new()
	get_parent().add_child(_telegraph)
	match act.shape:
		"sector", "circle_self":
			var span: float = act.arc if act.shape == "sector" else TAU
			_telegraph.add_child(_disc(act.range, span, TELEGRAPH_COLOR))
			_fill = _disc(act.range, span, TELEGRAPH_FILL)
			_telegraph.add_child(_fill)
			_telegraph.global_position = act.at + Vector3.UP * 0.06
			_telegraph.rotation.y = act.facing
		"rect":
			_telegraph.add_child(_lane(act.width, act.range, TELEGRAPH_COLOR))
			_fill = _lane(act.width, act.range, TELEGRAPH_FILL)
			_telegraph.add_child(_fill)
			_telegraph.global_position = act.at + Vector3.UP * 0.06
			_telegraph.rotation.y = act.facing
		"rain", "puddle":
			_telegraph.global_position = Vector3(act.at.x, act.spots[0].y + 0.06, act.at.z)
			_fill = Node3D.new()
			for spot: Vector3 in act.spots:
				var ring := _disc(act.r, TAU, TELEGRAPH_COLOR)
				_telegraph.add_child(ring)
				ring.global_position = spot + Vector3.UP * 0.06
			_telegraph.add_child(_fill)
			if act.get("shot", false):
				_shot = MeshInstance3D.new()
				var ball := SphereMesh.new()
				ball.radius = 0.22
				ball.height = 0.44
				_shot.mesh = ball
				_shot.material_override = Models.toon(Color("#ff8a2a"))
				_shot.visible = false
				get_parent().add_child(_shot)


func _fly_shot(k: float) -> void:
	if _shot == null:
		return
	k = clampf(k, 0.0, 1.0)
	var from := global_position + Vector3.UP * height * 0.7
	var to: Vector3 = _act.spots[0]
	_shot.visible = true
	_shot.global_position = from.lerp(to, k) + Vector3.UP * sin(k * PI) * 2.0


func _hide_telegraph() -> void:
	if _telegraph:
		_telegraph.queue_free()
		_telegraph = null
		_fill = null


static func _flat_mat(color: Color) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	mat.albedo_color = color
	return mat


## A flat wedge on the ground pointing along +Z (a full circle when span is TAU).
static func _disc(r: float, span: float, color: Color) -> MeshInstance3D:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var steps := maxi(6, int(span * 10.0))
	for i in steps:
		var a0 := -span / 2.0 + span * i / steps
		var a1 := -span / 2.0 + span * (i + 1) / steps
		st.add_vertex(Vector3.ZERO)
		st.add_vertex(Vector3(sin(a0), 0, cos(a0)) * r)
		st.add_vertex(Vector3(sin(a1), 0, cos(a1)) * r)
	var node := MeshInstance3D.new()
	node.mesh = st.commit()
	node.material_override = _flat_mat(color)
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return node


## A flat lane on the ground running along +Z from the origin.
static func _lane(width: float, length: float, color: Color) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var quad := PlaneMesh.new()
	quad.size = Vector2(width, length)
	quad.center_offset = Vector3(0, 0, length / 2.0)
	node.mesh = quad
	node.material_override = _flat_mat(color)
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return node
