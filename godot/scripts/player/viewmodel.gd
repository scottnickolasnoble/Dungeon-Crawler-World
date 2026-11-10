extends Node3D
## First-person fist and lead pipe, placed where the prototype holds its weapon (buildWeaponFP in game/play.js).
## Both models come from tools/blender/build_landing_kit.py. It swings (light and heavy), raises the pipe to block,
## and snaps up for a parry.

const REST := Vector3(0.32, -0.3, -0.6)
## Where the shoulder is, seen from the hand: swings turn around it, so the arm always runs back to you.
const SHOULDER := Vector3(0.06, -0.18, 0.62)
const GRIP := Vector3(-0.5, 0, 0.35)

var weapon: Node3D
var blocking := false
var _bob_offset := Vector3.ZERO
var _swing := -1.0
var _heavy := false
var _guard := 0.0
var _block := 0.0


func _ready() -> void:
	position = REST
	weapon = Node3D.new()
	weapon.position = Vector3(0, 0.02, -0.02)
	weapon.rotation = GRIP
	add_child(weapon)
	for prop in ["fp_hand", "lead_pipe"]:
		var model := Models.instantiate("res://models/props/landing/%s.glb" % prop)
		weapon.add_child(model)
		_tune(model)


## Walking bob: the hand follows the same stride as the camera.
func set_bob(phase: float) -> void:
	_bob_offset = Vector3(0, -absf(sin(phase)) * 0.015, 0)


func swing(heavy: bool) -> void:
	_swing = 0.0
	_heavy = heavy


func guard() -> void:
	_guard = 1.0


func _process(delta: float) -> void:
	var offset := Vector3.ZERO
	var turn := Vector3.ZERO
	var wrist := Vector3.ZERO
	_block = move_toward(_block, 1.0 if blocking else 0.0, delta * 8.0)
	_guard = maxf(0.0, _guard - delta * 4.0)
	var raise := maxf(_block, _guard)
	# blocking holds the pipe across the face
	offset += Vector3(-0.22, 0.2, 0.05) * raise
	turn += Vector3(0.3, 0.0, 1.2) * raise
	if _swing >= 0.0:
		var length := 0.42 if _heavy else 0.3
		_swing += delta / length
		var k := _swing
		if k >= 1.0:
			_swing = -1.0
		else:
			# wind back up and right, then whip down and across to the left
			var back := 0.25 if _heavy else 0.15
			var w: float
			if k < back:
				w = -k / back
			else:
				w = -1.0 + 2.6 * ease((k - back) / (1.0 - back), 0.35)
			if k > 0.75:
				w *= (1.0 - k) / 0.25
			var size := 1.3 if _heavy else 1.0
			# the whole arm sweeps from the shoulder; the wrist snaps the pipe through at the end
			turn += Vector3(-0.08 * w, 0.34 * w, 0.18 * w) * size
			offset += Vector3(0.0, 0.06 * w, -0.04 * absf(w)) * size
			wrist = Vector3(-0.5 * w, 0.0, 0.7 * w) * size
	var bend := Basis.from_euler(turn)
	transform = Transform3D(bend, REST + _bob_offset + offset + SHOULDER - bend * SHOULDER)
	weapon.rotation = GRIP + wrist


## Held items sit close to the camera, so their surface paint is scaled to suit, and there's no floor grime.
func _tune(node: Node) -> void:
	if node is GeometryInstance3D:
		node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	if node is MeshInstance3D:
		for i in node.mesh.get_surface_count():
			var mat := node.get_surface_override_material(i) as ShaderMaterial
			if mat:
				var own := mat.duplicate() as ShaderMaterial
				own.set_shader_parameter("paint_scale", 5.0)
				own.set_shader_parameter("paint_strength", 0.55)
				own.set_shader_parameter("grime_height", -1.0)
				node.set_surface_override_material(i, own)
	for child in node.get_children():
		_tune(child)
