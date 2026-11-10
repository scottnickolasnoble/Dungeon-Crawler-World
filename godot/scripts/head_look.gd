class_name HeadLook
extends SkeletonModifier3D
## Turns a character's head (and a little of its neck) towards a point, on top of whatever animation is playing.
## It works from the character's own facing (the skeleton's +Z), not from how each rig's head bone happens to point,
## so it behaves the same on every rig: Mixamo, auto-rigged, anything with a head bone.

## Where to look, in world space.
var target := Vector3.ZERO
## 0 = not at all, 1 = fully. Life fades this in and out.
var weight := 0.0
## How far the head can turn: side to side, and up and down.
var max_yaw := deg_to_rad(70.0)
var max_pitch := deg_to_rad(30.0)
var head := -1
var neck := -1


func setup(skeleton: Skeleton3D) -> bool:
	for n: String in ["mixamorig_Head", "mixamorig:Head", "Head", "head"]:
		head = skeleton.find_bone(n)
		if head >= 0:
			break
	for n: String in ["mixamorig_Neck", "mixamorig:Neck", "Neck", "neck"]:
		neck = skeleton.find_bone(n)
		if neck >= 0:
			break
	return head >= 0


func _process_modification() -> void:
	var sk := get_skeleton()
	if sk == null or head < 0 or weight <= 0.001:
		return
	# the target in the skeleton's own space, where +Z is the way the character faces
	var local_target: Vector3 = sk.global_transform.affine_inverse() * target
	var head_pose := sk.get_bone_global_pose(head)
	var to := local_target - head_pose.origin
	if to.length() < 0.05:
		return
	var yaw := clampf(atan2(to.x, to.z), -max_yaw, max_yaw)
	var flat := Vector2(to.x, to.z).length()
	var pitch := clampf(-atan2(to.y, flat), -max_pitch, max_pitch)
	# share the turn: a third in the neck, the rest in the head
	var turns: Array = [[neck, 0.35], [head, 0.65]] if neck >= 0 else [[head, 1.0]]
	for t: Array in turns:
		var bone: int = t[0]
		var share: float = t[1] * weight
		var q := Quaternion(Vector3.UP, yaw * share) * Quaternion(Vector3.RIGHT, pitch * share)
		var g := sk.get_bone_global_pose(bone)
		var turned := Transform3D(Basis(q) * g.basis, g.origin)
		var parent := sk.get_bone_parent(bone)
		var parent_g := sk.get_bone_global_pose(parent) if parent >= 0 else Transform3D.IDENTITY
		var local := parent_g.affine_inverse() * turned
		sk.set_bone_pose_rotation(bone, local.basis.get_rotation_quaternion())
