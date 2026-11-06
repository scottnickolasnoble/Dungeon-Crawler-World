# Example of how an NPC works in Godot 4 (GDScript). Attach to a CharacterBody3D whose child is the imported
# model (e.g. marta.glb from Tripo/Blender, rigged and animated on Mixamo). This is the whole "brain" of a
# townsperson: walk a route on the navmesh, turn to face the player, play idle/walk/talk animations, open dialog.
extends CharacterBody3D

@export var npc_id := "marta"                 # key into data/npcs.json and data/dialogs.json
@export var display_name := "Marta Vance"
@export var route: Array[Vector3] = []        # waypoints; empty = stands still
@export var walk_speed := 1.25

@onready var nav: NavigationAgent3D = $NavigationAgent3D
@onready var anim: AnimationPlayer = $Model/AnimationPlayer   # clips come with the model: "idle", "walk", "talk"
@onready var name_tag: Label3D = $NameTag

var _wp := 0
var _wait := 0.0
var _talking := false

func _ready() -> void:
	name_tag.text = display_name
	if route.size() > 0:
		nav.target_position = route[0]

func _physics_process(delta: float) -> void:
	var player := get_tree().get_first_node_in_group("player") as Node3D
	var near_player := player != null and global_position.distance_to(player.global_position) < 4.5
	if _talking or near_player:
		_face(player.global_position, delta)
		_play("talk" if _talking else "idle")
		return
	if route.is_empty() or _wait > 0.0:
		_wait -= delta
		_play("idle")
		return
	if nav.is_navigation_finished():
		_wp = (_wp + 1) % route.size()
		nav.target_position = route[_wp]
		_wait = randf_range(2.0, 5.0)
		return
	var next := nav.get_next_path_position()
	var dir := (next - global_position) * Vector3(1, 0, 1)
	velocity = dir.normalized() * walk_speed
	move_and_slide()
	_face(next, delta)
	_play("walk")

func interact() -> void:          # called by the player's "E" raycast
	_talking = true
	Dialog.open(npc_id, self)     # Dialog is an autoload that reads data/dialogs.json
	await Dialog.closed
	_talking = false

func _face(target: Vector3, delta: float) -> void:
	var to := target - global_position
	var yaw := atan2(to.x, to.z)
	rotation.y = lerp_angle(rotation.y, yaw, 1.0 - exp(-6.0 * delta))

func _play(clip: String) -> void:
	if anim.current_animation != clip and anim.has_animation(clip):
		anim.play(clip, 0.25)     # 0.25 s blend between animations
