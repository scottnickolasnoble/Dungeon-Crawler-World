extends Node
## The Drowned Valet's arena (Floor 1, the Sump): "He'll park you somewhere nice and dark."
##  - RISING WATER: the hall floods in three stages as he's hurt; deep water slows you.
##  - HEADLIGHTS: two car headlight beams sweep the dark hall.
##  - SUBMERGE: every so often he bows, sinks out of sight, and surfaces behind you, already swinging. Ripples give
##    him away a second early.
##  - THE EELS: his "summon" calls up drain lampreys from the water.
## Lives on the boss, so it goes when he does.

const SUBMERGE_EVERY := 13.0
const STAGES := [0.75, 0.5, 0.25]
const DEPTHS := [0.35, 0.7, 1.05]

var chamber: Node3D
var boss: Mob
var _water: MeshInstance3D
var _floor_y := 0.0
var _depth := 0.0
var _stage := 0
var _lights: Array[SpotLight3D] = []
var _clock := 0.0
var _submerge_clock := 8.0
var _diving := false
var _ripple: Node3D
var _done := false


func begin(on: Node3D, who: Mob) -> void:
	chamber = on
	boss = who
	_floor_y = chamber.global_position.y + float(chamber.get("floor_y"))
	# the eels come up from the drains
	var main := get_tree().current_scene
	var world: Variant = main.get("current_floor") if main else null
	if world and world.has_method("_monster_path"):
		boss.minion_kind = "lamprey"
		boss.minion_path = world._monster_path("lamprey")
	var half: float = chamber.get("half")
	_water = MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(half * 2.0, half * 2.0)
	_water.mesh = plane
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.12, 0.3, 0.32, 0.55)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.metallic = 0.3
	mat.roughness = 0.15
	_water.material_override = mat
	chamber.get_parent().add_child(_water)
	_water.global_position = Vector3(chamber.global_position.x, _floor_y + 0.02, chamber.global_position.z)
	# two headlights high on the walls, sweeping the hall
	for i in 2:
		var spot := SpotLight3D.new()
		spot.light_color = Color("#fff4d0")
		spot.light_energy = 6.0
		spot.spot_range = half * 3.0
		spot.spot_angle = 16.0
		spot.shadow_enabled = true
		chamber.get_parent().add_child(spot)
		spot.global_position = chamber.global_position + Vector3((-1 if i == 0 else 1) * (half - 1.0), 6.0, -(half - 1.0))
		_lights.append(spot)


func _process(delta: float) -> void:
	if boss == null or not is_instance_valid(boss) or boss.dead:
		_clean_up()
		return
	_clock += delta
	_sweep_lights()
	_flood(delta)
	if not _diving:
		_submerge_clock -= delta
		if _submerge_clock <= 0.0 and (boss.state == "chase" or boss.state == "idle") and Combat.player:
			_submerge_clock = SUBMERGE_EVERY
			_submerge()


func _sweep_lights() -> void:
	var centre := chamber.global_position + Vector3.UP * _floor_y
	for i in _lights.size():
		var swing := sin(_clock * (0.45 + i * 0.17) + i * 2.0) * 9.0
		var aim := centre + Vector3(swing, 0, cos(_clock * 0.3 + i) * 6.0)
		_lights[i].look_at(aim, Vector3.UP)


## Each stage of his health lost, the water rises; past knee height it drags at you.
func _flood(delta: float) -> void:
	if _stage < STAGES.size() and boss.hp < boss.max_hp * STAGES[_stage]:
		_stage += 1
		Combat.notice.emit(["THE WATER RISES", "THE SUMP FLOODS", "IT'S UP TO YOUR WAIST"][_stage - 1], Color("#5ad0d8"))
		if _stage == 1:
			Combat.say(boss, "Mind your step, sir. It gets deep.", 2.6, boss.life._head_height() if boss.life else 2.8)
	var want: float = DEPTHS[_stage - 1] if _stage > 0 else 0.0
	_depth = move_toward(_depth, want, delta * 0.25)
	_water.global_position.y = _floor_y + 0.02 + _depth
	if Combat.player and _depth > 0.5 and Combat.player.global_position.y < _water.global_position.y - 0.3:
		Combat.slowed = 0.3


## A bow; he sinks out of sight; ripples behind you; he comes up there, swinging.
func _submerge() -> void:
	_diving = true
	boss.set_physics_process(false)
	boss.velocity = Vector3.ZERO
	if boss.life and boss.life.player and boss.life.player.has_animation("taunt"):
		boss.life.player.play("taunt", 0.2)
	Combat.say(boss, "Excuse me one moment, sir.", 2.0, boss.life._head_height() if boss.life else 2.8)
	await get_tree().create_timer(1.0).timeout
	if not _alive():
		return
	var model: Node3D = boss.model
	var sink := create_tween()
	sink.tween_property(model, "position:y", -3.0, 0.7).set_ease(Tween.EASE_IN)
	await sink.finished
	if not _alive():
		return
	model.visible = false
	boss._shape.disabled = true
	# where he'll come up: behind you, a few steps back
	var p: Node3D = Combat.player
	var back := Vector3(sin(p.yaw), 0, cos(p.yaw))
	var at := p.global_position + back * 2.8
	at.y = _floor_y
	_ripple = Mob._disc(1.6, TAU, Color(0.6, 0.95, 1.0, 0.45))
	chamber.get_parent().add_child(_ripple)
	_ripple.global_position = at + Vector3.UP * (_depth + 0.06)
	var pulse := create_tween().set_loops(3)
	pulse.tween_property(_ripple, "scale", Vector3.ONE * 1.4, 0.35)
	pulse.tween_property(_ripple, "scale", Vector3.ONE, 0.0)
	await get_tree().create_timer(1.1).timeout
	if is_instance_valid(_ripple):
		_ripple.queue_free()
	if not _alive():
		return
	boss.global_position = at
	var to := p.global_position - at
	boss.rotation.y = atan2(to.x, to.z)
	model.visible = true
	boss._shape.disabled = false
	var rise := create_tween()
	rise.tween_property(model, "position:y", 0.0, 0.45).set_ease(Tween.EASE_OUT)
	Combat.sfx(at + Vector3.UP * 1.2, "SPLOOSH!", Color("#9ae8f0"))
	await rise.finished
	if not _alive():
		return
	boss.set_physics_process(true)
	_diving = false
	boss.state = "chase"
	boss._start_swing(Vector2(to.x, to.z))


func _alive() -> bool:
	if boss == null or not is_instance_valid(boss) or boss.dead:
		_diving = false
		return false
	return true


func _exit_tree() -> void:
	_clean_up()


func _clean_up() -> void:
	if _done:
		return
	_done = true
	if boss and is_instance_valid(boss) and boss.model:
		boss.model.visible = true
	for n: Node in [_water, _ripple]:
		if n and is_instance_valid(n):
			n.queue_free()
	for l: SpotLight3D in _lights:
		if is_instance_valid(l):
			l.queue_free()
	_lights.clear()
