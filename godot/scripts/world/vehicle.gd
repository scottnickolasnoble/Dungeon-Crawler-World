class_name Vehicle
extends CharacterBody3D
## A car (or cart, or jeep) you can get into and drive. E gets in and out; W and S drive, A and D steer,
## Space brakes. It follows the hills and tilts with them. Monsters in the way get knocked aside and hurt.

const ACCEL := 9.0
const TOP_SPEED := 17.0
const REVERSE_SPEED := 6.0
const TURN := 1.6
const GRAVITY := 18.0
## Where the driver's eyes are, above the vehicle's origin.
const EYE := 1.35

var model: Node3D
var speed := 0.0
var driver: Node3D
var title := "car"
var _shape: CollisionShape3D


static func make(prop_path: String, pos: Vector3, yaw: float, label: String) -> Vehicle:
	var car := Vehicle.new()
	car.title = label
	car.model = Models.instantiate(prop_path)
	car.add_child(car.model)
	car.position = pos
	car.rotation.y = yaw
	return car


func _ready() -> void:
	var box := AABB()
	var first := true
	for mesh: MeshInstance3D in model.find_children("*", "MeshInstance3D", true, false):
		var b := (model.global_transform.affine_inverse() * mesh.global_transform) * mesh.get_aabb()
		box = b if first else box.merge(b)
		first = false
	var shape := BoxShape3D.new()
	shape.size = Vector3(maxf(box.size.x, 1.0), maxf(box.size.y * 0.7, 0.8), maxf(box.size.z, 1.5))
	_shape = CollisionShape3D.new()
	_shape.shape = shape
	_shape.position = Vector3(box.get_center().x, shape.size.y / 2.0 + 0.15, box.get_center().z)
	add_child(_shape)
	floor_snap_length = 1.0
	floor_max_angle = deg_to_rad(50.0)
	set_physics_process(false)


func get_in(who: Node3D) -> void:
	driver = who
	speed = 0.0
	set_physics_process(true)


func get_out() -> Vector3:
	driver = null
	speed = 0.0
	velocity = Vector3.ZERO
	set_physics_process(false)
	# step out on the driver's side
	return global_position + global_transform.basis.x * -2.2 + Vector3.UP * 0.5


func _physics_process(delta: float) -> void:
	var throttle := Input.get_axis("move_back", "move_forward")
	var steer := Input.get_axis("move_right", "move_left")
	if Input.is_action_pressed("jump"):
		speed = move_toward(speed, 0.0, ACCEL * 2.5 * delta)
	elif throttle != 0.0:
		speed = clampf(speed + throttle * ACCEL * delta, -REVERSE_SPEED, TOP_SPEED)
	else:
		speed = move_toward(speed, 0.0, ACCEL * 0.6 * delta)
	# you can only steer while moving, and it steers the other way in reverse
	rotation.y += steer * TURN * delta * clampf(speed / 6.0, -1.0, 1.0)
	var forward := Vector3(sin(rotation.y), 0, cos(rotation.y))
	velocity.x = forward.x * speed
	velocity.z = forward.z * speed
	velocity.y = -0.5 if is_on_floor() else velocity.y - GRAVITY * delta
	move_and_slide()
	for i in get_slide_collision_count():
		var hit := get_slide_collision(i).get_collider()
		if hit is Mob and not hit.dead and absf(speed) > 5.0:
			Combat.hurt_mob(hit, absf(speed) * 2.5)
			hit.stun(0.8)
			speed *= 0.6
		elif absf(get_slide_collision(i).get_normal().y) < 0.5:
			speed *= 0.5
	_tilt(delta)


## Leans the body to match the slope under it.
func _tilt(delta: float) -> void:
	var n := get_floor_normal() if is_on_floor() else Vector3.UP
	var local := n * global_transform.basis
	model.rotation.x = lerpf(model.rotation.x, atan2(local.z, local.y), minf(1.0, delta * 6.0))
	model.rotation.z = lerpf(model.rotation.z, -atan2(local.x, local.y), minf(1.0, delta * 6.0))
