class_name Player
extends CharacterBody3D
## First-person controller. Speeds, gravity, jump, stamina and look sensitivity are the prototype's (game/play.js).

const WALK_SPEED := 5.0
const SPRINT_SPEED := 8.5
const ACCELERATION := 12.0
const GRAVITY := 14.0
const JUMP_VELOCITY := 5.2
const LOOK_SENSITIVITY := 0.0022
const MAX_PITCH := 1.45
const EYE_HEIGHT := 1.7
const BOB_HEIGHT := 0.035
const BOB_PER_METRE := 2.2
const SPRINT_DRAIN := 22.0
const STAMINA_REGEN := 14.0
## Fuzzy Slippers, the starting boots: +3% move speed. Replaced by real equipment in Phase 4.
const GEAR_MOVE_SPEED := 3.0
## From the starting stats: 80 + CON 11 x 2 + DEX 9.
const MAX_STAMINA := 111.0

var stamina := 100.0
var _swing_cd := 0.0
var _dodge_dir := Vector3.ZERO
var _shake := 0.0
var _calm := 0.0
## Off while driving.
var can_fight := true
var yaw := 0.0
var pitch := 0.0
var _bob := 0.0
## Fly mode (F1, for getting round the big floors): no gravity, no walls, nothing can hurt you.
## WASD to move where you're looking, Space up, C down, Shift for very fast.
var flying := false
const FLY_SPEED := 28.0
const FLY_FAST := 140.0

@onready var camera: Camera3D = $Camera3D
@onready var viewmodel: Node3D = $Camera3D/Viewmodel


func _ready() -> void:
	Combat.player = self
	Combat.player_hurt.connect(_on_hurt)


func _unhandled_input(event: InputEvent) -> void:
	if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
		return
	if event is InputEventMouseMotion:
		yaw -= event.relative.x * LOOK_SENSITIVITY
		pitch = clampf(pitch - event.relative.y * LOOK_SENSITIVITY, -MAX_PITCH, MAX_PITCH)
	elif event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_LEFT:
			swing(false)
		elif event.button_index == MOUSE_BUTTON_RIGHT:
			swing(true)
	elif event is InputEventKey and event.pressed and not event.echo:
		if event.physical_keycode == KEY_F:
			Combat.parry_at = Combat.now()
			viewmodel.guard()
		elif event.physical_keycode == KEY_V:
			dodge()


# ---------------------------------------------------------------- fighting (combat.js swing, play.js dodge)
## Left click is a quick swing, right click a heavy one that costs stamina. Returns false if it can't swing yet.
func swing(heavy: bool) -> bool:
	if _swing_cd > 0.0 or Combat.hp <= 0.0 or not can_fight:
		return false
	if heavy and stamina < Combat.HEAVY_STAMINA:
		_swing_cd = 0.3
		Combat.notice.emit("Too tired for a heavy swing", Color("#5ad86a"))
		return false
	if heavy:
		stamina -= Combat.HEAVY_STAMINA
	_swing_cd = Combat.HEAVY_COOLDOWN if heavy else Combat.LIGHT_COOLDOWN
	viewmodel.swing(heavy)
	get_tree().create_timer(0.18 if heavy else 0.09).timeout.connect(func() -> void:
		if Combat.player_swing(heavy) > 0:
			_shake = maxf(_shake, 0.2 if heavy else 0.08))
	return true


## A quick sidestep you can't be hit during.
func dodge() -> void:
	if Combat.now() - Combat.dodge_at < 0.7 or stamina < Combat.DODGE_COST or Combat.hp <= 0.0 or Combat.held > 0.0:
		return
	stamina -= Combat.DODGE_COST
	Combat.dodge_at = Combat.now()
	var input := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	if input == Vector2.ZERO:
		input = Vector2(0, 1)
	_dodge_dir = Vector3(input.x, 0, input.y).normalized().rotated(Vector3.UP, yaw)


func _on_hurt(amount: float, result: String) -> void:
	if amount > 0.0:
		_shake = maxf(_shake, 0.15 if result == "hit" else 0.06)
		_calm = 0.0


func _physics_process(delta: float) -> void:
	if flying:
		_fly(delta)
		return
	var input := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var moving := input.length_squared() > 0.0
	var sprinting := Input.is_action_pressed("sprint") and stamina > 1.0 and moving
	Combat.blocking = Input.is_physical_key_pressed(KEY_F) and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED
	viewmodel.blocking = Combat.blocking
	var speed := (SPRINT_SPEED if sprinting else WALK_SPEED) * (1.0 + GEAR_MOVE_SPEED / 100.0) * (0.5 if Combat.blocking else 1.0)
	# clamped or grabbed: stuck where you stand; wading through something sticky: half speed
	Combat.held = maxf(0.0, Combat.held - delta)
	Combat.slowed = maxf(0.0, Combat.slowed - delta)
	if Combat.held > 0.0:
		speed = 0.0
	elif Combat.slowed > 0.0:
		speed *= 0.45
	var wish := Vector3(input.x, 0, input.y).rotated(Vector3.UP, yaw)
	if moving:
		wish = wish.normalized() * speed

	var blend := minf(1.0, delta * ACCELERATION)
	velocity.x += (wish.x - velocity.x) * blend
	velocity.z += (wish.z - velocity.z) * blend
	velocity.y -= GRAVITY * delta
	if Input.is_action_just_pressed("jump") and is_on_floor() and Combat.held <= 0.0:
		velocity.y = JUMP_VELOCITY

	if Combat.now() - Combat.dodge_at < 0.25:
		velocity.x = _dodge_dir.x * 16.0
		velocity.z = _dodge_dir.z * 16.0
	var before := global_position
	# where we meant to go, before sliding along whatever we hit changes it
	var meant := Vector3(velocity.x, 0, velocity.z)
	move_and_slide()
	StepUp.try(self, meant, delta)
	var after := global_position
	_bob += Vector2(after.x - before.x, after.z - before.z).length() * BOB_PER_METRE
	stamina = clampf(stamina + (-SPRINT_DRAIN if sprinting else STAMINA_REGEN) * delta, 0.0, MAX_STAMINA)
	_swing_cd = maxf(0.0, _swing_cd - delta)
	# out of a fight for a while, wounds close up
	_calm += delta
	if Combat.hp > 0.0 and _calm > 6.0:
		Combat.hp = minf(Combat.max_hp(), Combat.hp + Combat.max_hp() * 0.02 * delta)


func _fly(delta: float) -> void:
	var input := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	# forward follows where you look, up and down included
	var look := Basis.from_euler(Vector3(pitch, yaw, 0))
	var wish := look * Vector3(input.x, 0, input.y)
	if Input.is_action_pressed("jump"):
		wish.y += 1.0
	if Input.is_physical_key_pressed(KEY_C):
		wish.y -= 1.0
	var speed := FLY_FAST if Input.is_action_pressed("sprint") else FLY_SPEED
	velocity = velocity.lerp(wish.normalized() * speed if wish.length_squared() > 0.0 else Vector3.ZERO, minf(1.0, delta * 8.0))
	global_position += velocity * delta
	Combat.hp = Combat.max_hp()
	stamina = MAX_STAMINA


func set_flying(on: bool) -> void:
	flying = on
	velocity = Vector3.ZERO
	# no walls while flying; back to normal collisions when you land
	collision_mask = 0 if on else 1
	Combat.peaceful = on


func _process(delta: float) -> void:
	var on_floor := is_on_floor()
	_shake = maxf(0.0, _shake - delta)
	var jolt := Vector3(randf_range(-1, 1), randf_range(-1, 1), 0) * _shake * 0.25
	camera.position = Vector3(0, EYE_HEIGHT + (sin(_bob) * BOB_HEIGHT if on_floor else 0.0), 0) + jolt
	camera.rotation = Vector3(pitch + jolt.y * 0.3, yaw, 0)
	viewmodel.set_bob(_bob if on_floor else 0.0)
