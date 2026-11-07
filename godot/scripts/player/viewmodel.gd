extends Node3D
## First-person fist and lead pipe, placed where the prototype holds its weapon (buildWeaponFP in game/play.js).
## Both models come from tools/blender/build_landing_kit.py. Swinging arrives with combat in Phase 2.

const REST := Vector3(0.32, -0.3, -0.6)

var weapon: Node3D


func _ready() -> void:
	position = REST
	weapon = Node3D.new()
	weapon.position = Vector3(0, 0.02, -0.02)
	weapon.rotation = Vector3(-0.5, 0, 0.35)
	add_child(weapon)
	for prop in ["fp_hand", "lead_pipe"]:
		var model := Models.instantiate("res://models/props/landing/%s.glb" % prop)
		weapon.add_child(model)
		_tune(model)


## Walking bob: the hand follows the same stride as the camera.
func set_bob(phase: float) -> void:
	position = REST + Vector3(0, -absf(sin(phase)) * 0.015, 0)


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
