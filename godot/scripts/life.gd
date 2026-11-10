class_name Life
extends Node
## Keeps a character looking alive while it stands about, and gives combat something to call.
## Rigged characters play their clips: mostly idle; monsters snarl with their attack now and then, and people stroll a
## few steps round their spot and back. People only talk while you're talking to them (converse()).
## Creatures without a skeleton are moved as a whole: they breathe, sway and bob, and lunge now and then.
## Combat (Phase 2) calls attack(), hit() and die().

var fierce := false
## True while fighting: the Mob picks the clips then, so no idle fidgets.
var engaged := false
var model: Node3D
var player: AnimationPlayer
var _base_scale := Vector3.ONE
var _base_pos := Vector3.ZERO
var _base_yaw := 0.0
var _seed := 0.0
var _clock := 0.0
var _next_gesture := 0.0
var _lunge := 0.0
var _flinch := 0.0
var _dead := false
## People strolling: where they're headed (relative to where they stand), and whether they're in a conversation.
var _stroll := Vector3.INF
var talking := false
## Noticing you, and chatting with whoever's standing next to them.
var _greeted := false
var _chat_clock := 0.0
var _partner: Life
const GREETINGS := ["Oh. Another one.", "Mind the cones, love.", "You look like you've seen some things.", "Don't touch the vending machines.",
	"If you're selling something, I've got nothing.", "New down here? You've got that look.", "Keep your voice down, they listen.",
	"Lovely day for it. Whatever it is.", "Wipe your feet.", "Don't die near my door, it's a nightmare to clean.",
	"You're the one off the telly!", "Oi. Eyes front.", "Is it Tuesday? Feels like a Tuesday.", "Watch yourself out there.",
	"Smell that? That's the Network.", "I'd buy a better weapon if I were you.", "Still breathing? Good for you."]
const CHATS := [["Did you hear about Dave?", "Eaten again?", "Eaten again."], ["They moved the stairs again.", "Bastards."],
	["My cousin went down a floor.", "And?", "Postcards stopped."], ["Price of water's gone up.", "Everything's gone up.", "The ceiling hasn't."],
	["You see the new one?", "Which one?", "With the pipe.", "...Oh, that one."], ["Fans say I'm not photogenic.", "Fans say a lot of things."],
	["Something was knocking under the floor last night.", "Seven times?", "...How did you know?"], ["I miss weather.", "I miss bins that don't bite."],
	["Ratings are down.", "Good. Means they're not watching us."], ["Who's that sat on the roof?", "Don't look at it.", "I'm not looking at it."]]
## Clips that are really someone sitting down to talk (the old shared talk clip): don't use them standing up.
static var _seated := {}


static func attach(target: Node3D, is_fierce: bool) -> Life:
	var life := Life.new()
	life.fierce = is_fierce
	life.model = target
	target.add_child(life)
	if not is_fierce:
		life.add_to_group("people_life")
	return life


func _ready() -> void:
	_seed = randf() * 100.0
	_base_scale = model.scale
	_base_pos = model.position
	_base_yaw = model.rotation.y
	var found := model.find_children("*", "AnimationPlayer", true, false)
	if not found.is_empty():
		player = found[0]
		player.animation_finished.connect(_on_clip_done)
	_next_gesture = randf_range(4.0, 14.0)
	if player and LOOK_ON:
		_setup_look()


func _process(delta: float) -> void:
	if _dead:
		return
	_clock += delta
	_update_look(delta)
	# nobody needs to fidget if nobody is near enough to see it
	var cam := get_viewport().get_camera_3d()
	if cam and cam.global_position.distance_squared_to(model.global_position) > 3600.0:
		return
	if player:
		if talking or engaged:
			return
		if not fierce:
			_stroll_step(delta)
			_social(delta)
		_next_gesture -= delta
		if _next_gesture <= 0.0 and player.current_animation == "idle":
			_next_gesture = randf_range(6.0, 16.0)
			if fierce and player.has_animation("attack"):
				player.play("attack", 0.25)
			elif not fierce and player.has_animation("walk") and _stroll == Vector3.INF:
				# a few steps somewhere nearby, then back again next time
				var back := model.position.distance_to(_base_pos) > 0.5
				var a := randf() * TAU
				_stroll = _base_pos if back else _base_pos + Vector3(cos(a), 0, sin(a)) * randf_range(1.2, 2.6)
				player.play("walk", 0.3)
		return
	_move_creature(delta)


func _move_creature(delta: float) -> void:
	var t := _clock + _seed
	var breathe := 1.0 + 0.025 * sin(t * 1.7)
	var lean := 0.0
	var forward := 0.0
	_next_gesture -= delta
	if fierce and not engaged and _next_gesture <= 0.0:
		_next_gesture = randf_range(5.0, 12.0)
		_lunge = 1.0
	if _lunge > 0.0:
		_lunge = maxf(0.0, _lunge - delta * 1.6)
		var k := sin((1.0 - _lunge) * PI)
		forward = k * 0.35 * _base_scale.y
		lean = k * 0.18
	if _flinch > 0.0:
		_flinch = maxf(0.0, _flinch - delta * 3.0)
		lean -= _flinch * 0.25
	model.scale = Vector3(_base_scale.x * (2.0 - breathe), _base_scale.y * breathe, _base_scale.z * (2.0 - breathe))
	model.rotation.y = _base_yaw + sin(t * 0.6) * 0.08
	model.rotation.x = lean + sin(t * 0.9) * 0.02
	model.position = _base_pos + Vector3(0, absf(sin(t * 1.1)) * 0.04, 0) + Vector3(sin(model.rotation.y), 0, cos(model.rotation.y)) * forward


## A stroll in progress: walk to the spot, turn to face where they were heading, then stand.
func _stroll_step(delta: float) -> void:
	if _stroll == Vector3.INF:
		return
	var to := _stroll - model.position
	to.y = 0.0
	if to.length() < 0.1:
		_stroll = Vector3.INF
		player.play("idle", 0.4)
		return
	model.rotation.y = lerp_angle(model.rotation.y, atan2(to.x, to.z), minf(1.0, delta * 5.0))
	model.position += to.normalized() * minf(to.length(), STROLL_SPEED * delta)
	locomote(STROLL_SPEED)


# ---------------------------------------------------------------- being sociable
## Townsfolk notice you as you walk up (a line, once a visit), and chat with whoever's stood next to them when
## you're near enough to overhear.
func _social(delta: float) -> void:
	if Combat.player == null:
		return
	var to: Vector3 = Combat.player.global_position - model.global_position
	var d := to.length()
	if d > 12.0:
		_greeted = false
	var ahead := Vector3(sin(model.global_rotation.y), 0, cos(model.global_rotation.y))
	if not _greeted and d < 4.5 and ahead.dot(Vector3(to.x, 0, to.z).normalized()) > 0.2:
		_greeted = true
		Combat.say(model, GREETINGS[(int(_seed * 7.0) + int(_clock)) % GREETINGS.size()], 3.0, _head_height())
		return
	_chat_clock -= delta
	if _chat_clock > 0.0 or d > 15.0 or _stroll != Vector3.INF:
		return
	_chat_clock = randf_range(9.0, 18.0)
	if _partner == null or not is_instance_valid(_partner) or _partner.model.global_position.distance_to(model.global_position) > 3.6:
		_partner = null
		for other: Node in get_tree().get_nodes_in_group("people_life"):
			if other != self and other.model.global_position.distance_to(model.global_position) < 3.6 and not other.talking:
				_partner = other
				break
	if _partner == null:
		return
	# face each other and trade lines: this one starts, the other answers
	var chat: Array = CHATS[randi() % CHATS.size()]
	_face_toward(_partner.model.global_position)
	_partner._face_toward(model.global_position)
	_partner._chat_clock = _chat_clock + 2.0
	for i in chat.size():
		var speaker: Life = self if i % 2 == 0 else _partner
		get_tree().create_timer(i * 1.9).timeout.connect(func() -> void:
			if is_instance_valid(speaker) and not speaker.talking:
				Combat.say(speaker.model, str(chat[i]), 2.4, speaker._head_height()))


func _face_toward(at: Vector3) -> void:
	var to := at - model.global_position
	model.rotation.y = atan2(to.x, to.z)


func _head_height() -> float:
	return Models.height_of(model) * model.scale.y + 0.35


# ---------------------------------------------------------------- moving well
## How fast Mixamo's walk and run clips move a 1.75 m person, in metres a second. Playback is scaled to how fast the
## character really goes (and how big it is), so its feet keep pace with the ground instead of sliding.
const WALK_PACE := 1.35
const RUN_PACE := 3.6
const STROLL_SPEED := 1.05
## The head turning to follow the player: Godot's look-at bone modifier, faded in and out.
var look: HeadLook
var _look_weight := 0.0
static var LOOK_ON := true


## Idle, walk or run to suit a speed in m/s, blended, with the clip sped up or slowed to match it.
func locomote(speed: float) -> void:
	if player == null:
		return
	var size := maxf(0.4, model.scale.y * Models.height_of(model) / 1.75) if model else 1.0
	var clip := "idle"
	var pace := 1.0
	if speed > 2.6 and player.has_animation("run"):
		clip = "run"
		pace = RUN_PACE * size
	elif speed > 0.15 and player.has_animation("walk"):
		clip = "walk"
		pace = WALK_PACE * size
	if clip != "idle":
		player.speed_scale = clampf(speed / pace, 0.6, 1.7)
	elif player.current_animation in ["walk", "run"]:
		player.speed_scale = 1.0
	if player.current_animation != clip and player.has_animation(clip):
		player.play(clip, 0.25)


func _setup_look() -> void:
	var skels := model.find_children("*", "Skeleton3D", true, false)
	if skels.is_empty():
		return
	var sk: Skeleton3D = skels[0]
	var turn := HeadLook.new()
	if not turn.setup(sk):
		turn.free()
		return
	sk.add_child(turn)
	look = turn


## People look at you when you're close and in front of them; monsters glare at you when they're after you.
func _update_look(delta: float) -> void:
	if look == null or Combat.player == null:
		return
	var eye: Vector3 = Combat.player.global_position + Vector3.UP * 1.6
	var me := model.global_position
	var to := eye - me
	var ahead := Vector3(sin(model.global_rotation.y), 0, cos(model.global_rotation.y))
	var close := to.length() < (12.0 if fierce else 6.0)
	var in_front := ahead.dot(Vector3(to.x, 0, to.z).normalized()) > -0.1
	var want := 1.0 if (close and in_front and (talking or not fierce or engaged)) else 0.0
	_look_weight = move_toward(_look_weight, want, delta * 2.5)
	look.weight = smoothstep(0.0, 1.0, _look_weight)
	look.target = eye


## Talking with the player: stop, turn to face them, and talk (if this character has a standing talk), until it's over.
func converse(on: bool, face := Vector3.INF) -> void:
	talking = on
	if not player:
		return
	player.speed_scale = 1.0
	if on:
		_stroll = Vector3.INF
		if face != Vector3.INF:
			var to := face - model.global_position
			model.rotation.y = atan2(to.x, to.z)
		player.play(_talk_clip(), 0.3)
	else:
		player.play("idle", 0.4)
		_next_gesture = randf_range(6.0, 12.0)


## True if a clip has the hips dropping well below where they are standing still: someone sitting down.
func is_seated(clip: String) -> bool:
	var anim := player.get_animation(clip)
	var idle := player.get_animation("idle") if player.has_animation("idle") else null
	if anim == null or idle == null:
		return false
	if _seated.has(anim):
		return _seated[anim]
	var hips := func(a: Animation) -> float:
		for t in a.get_track_count():
			if a.track_get_type(t) == Animation.TYPE_POSITION_3D and String(a.track_get_path(t)).to_lower().contains("hips"):
				var mid: Vector3 = a.position_track_interpolate(t, a.length * 0.5)
				return mid.length()
		return -1.0
	var stand: float = hips.call(idle)
	var here: float = hips.call(anim)
	var seated := stand > 0.0 and here > 0.0 and here < stand * 0.85
	_seated[anim] = seated
	return seated


## A talking clip to play: one of talk, talk2, talk3..., not the one just played if there's a choice.
func _talk_clip(last := "") -> String:
	var clips: Array = []
	for name: String in ["talk", "talk2", "talk3", "talk4"]:
		if player.has_animation(name) and not is_seated(name) and name != last:
			clips.append(name)
	if clips.is_empty():
		return last if last != "" else "idle"
	return clips.pick_random()


func _on_clip_done(name: StringName) -> void:
	if talking and not _dead and str(name).begins_with("talk"):
		player.play(_talk_clip(str(name)), 0.3)
		return
	if not _dead and player.has_animation("idle"):
		player.play("idle", 0.3)


# ---------------------------------------------------------------- for combat
func walk(running := false) -> void:
	if player:
		player.play("run" if running and player.has_animation("run") else "walk", 0.2)


func attack(clip := "attack", pace := 1.0) -> void:
	if player:
		player.speed_scale = pace
	# a move without its own clip yet borrows the nearest one: a charge runs, anything else swings
	if player and not player.has_animation(clip):
		for stand_in: String in ({ "charge": ["run", "walk"] } as Dictionary).get(clip, []) + ["attack"]:
			if player.has_animation(stand_in):
				clip = stand_in
				break
	if player and player.has_animation(clip):
		player.play(clip, 0.1)
	else:
		_lunge = 1.0


func hit() -> void:
	if player:
		player.speed_scale = 1.0
	if player and player.has_animation("hit"):
		player.play("hit", 0.05)
		# a flinch is over in about a second, however long the clip: a long one is played faster
		player.speed_scale = maxf(1.0, player.get_animation("hit").length / 1.0)
	else:
		_flinch = 1.0


func die() -> void:
	if player:
		player.speed_scale = 1.0
	_dead = true
	if player and player.has_animation("die"):
		player.play("die", 0.1)
	else:
		var tween := model.create_tween()
		tween.tween_property(model, "rotation:z", PI / 2.0, 0.6).set_ease(Tween.EASE_IN)
		tween.parallel().tween_property(model, "position:y", _base_pos.y, 0.6)
