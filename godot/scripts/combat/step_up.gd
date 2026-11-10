class_name StepUp
## Characters in Godot don't climb kerbs, steps or the lip of a causeway on their own: walking into a ledge stops you
## dead. This lets a character step up onto anything up to MAX high, the way you'd expect a person to.

const MAX := 0.6
static var debug := false


## Call after move_and_slide(). If the body tried to move but was held up by something low enough to step onto,
## lifts it on top.
static func try(body: CharacterBody3D, wish: Vector3, delta: float) -> void:
	if not body.is_on_floor() or wish.length_squared() < 0.01:
		return
	# trying to move, but held up (a rounded body meeting a low edge doesn't always count as hitting a wall)
	var real := body.get_real_velocity()
	if Vector2(real.x, real.z).length() > wish.length() * 0.6:
		return
	var ahead := Vector3(wish.x, 0, wish.z).normalized() * 0.3
	# how high is the thing in front? drop down onto it from above
	var collision := KinematicCollision3D.new()
	var over := body.global_transform.translated(Vector3.UP * (MAX + 0.05) + ahead)
	if not body.test_move(over, Vector3.DOWN * (MAX + 0.05), collision):
		if debug: print("STEP nothing under ahead")
		return
	var rise := MAX + 0.05 - collision.get_travel().length()
	if rise < 0.05 or rise > MAX:
		if debug: print("STEP rise %.2f out of range" % rise)
		return
	# room to rise that much where we stand, and then to move forward on top
	if body.test_move(body.global_transform, Vector3.UP * (rise + 0.02)):
		if debug: print("STEP no headroom for %.2f" % rise)
		return
	var lifted := body.global_transform.translated(Vector3.UP * (rise + 0.02))
	if body.test_move(lifted, ahead):
		if debug: print("STEP blocked on top")
		return
	body.global_position += Vector3.UP * (rise + 0.02) + ahead * 0.5
