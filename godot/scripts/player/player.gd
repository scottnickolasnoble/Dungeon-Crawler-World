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
var yaw := 0.0
var pitch := 0.0
var _bob := 0.0

@onready var camera: Camera3D = $Camera3D
@onready var viewmodel: Node3D = $Camera3D/Viewmodel


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		yaw -= event.relative.x * LOOK_SENSITIVITY
		pitch = clampf(pitch - event.relative.y * LOOK_SENSITIVITY, -MAX_PITCH, MAX_PITCH)


func _physics_process(delta: float) -> void:
	var input := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var moving := input.length_squared() > 0.0
	var sprinting := Input.is_action_pressed("sprint") and stamina > 1.0 and moving
	var speed := (SPRINT_SPEED if sprinting else WALK_SPEED) * (1.0 + GEAR_MOVE_SPEED / 100.0)
	var wish := Vector3(input.x, 0, input.y).rotated(Vector3.UP, yaw)
	if moving:
		wish = wish.normalized() * speed

	var blend := minf(1.0, delta * ACCELERATION)
	velocity.x += (wish.x - velocity.x) * blend
	velocity.z += (wish.z - velocity.z) * blend
	velocity.y -= GRAVITY * delta
	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = JUMP_VELOCITY

	var before := global_position
	move_and_slide()
	var after := global_position
	_bob += Vector2(after.x - before.x, after.z - before.z).length() * BOB_PER_METRE
	stamina = clampf(stamina + (-SPRINT_DRAIN if sprinting else STAMINA_REGEN) * delta, 0.0, MAX_STAMINA)


func _process(_delta: float) -> void:
	var on_floor := is_on_floor()
	camera.position = Vector3(0, EYE_HEIGHT + (sin(_bob) * BOB_HEIGHT if on_floor else 0.0), 0)
	camera.rotation = Vector3(pitch, yaw, 0)
	viewmodel.set_bob(_bob if on_floor else 0.0)
