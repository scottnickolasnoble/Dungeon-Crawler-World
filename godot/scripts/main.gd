extends Node3D
## Starts the game: loads a floor, spawns the player, handles the mouse and travel between floors.
## A small HUD covers the time until the full HUD in Phase 4.

const PLAYER_SCENE := preload("res://scenes/player.tscn")

var player: Player
var current_floor: Node3D
var floor_index := 0
var _nearby: Dictionary = {}

@onready var hint: Label = $HUD/Hint
@onready var location: Label = $HUD/Location
@onready var stamina_bar: ProgressBar = $HUD/Stamina
@onready var prompt: Label = $HUD/Prompt


func _ready() -> void:
	player = PLAYER_SCENE.instantiate()
	add_child(player)
	stamina_bar.max_value = Player.MAX_STAMINA
	_set_captured(false)
	var start := 0
	var args := OS.get_cmdline_user_args()
	for arg in args:
		if arg.begins_with("--floor="):
			start = arg.trim_prefix("--floor=").to_int()
	load_floor(start)
	if not args.is_empty() and (args.has("--autotest") or _has_shots(args)):
		var runner: Node = load("res://scripts/debug/autotest.gd").new()
		runner.name = "Autotest"
		add_child(runner)


func _has_shots(args: PackedStringArray) -> bool:
	for arg in args:
		if arg.begins_with("--shots="):
			return true
	return false


func load_floor(index: int) -> void:
	if current_floor:
		current_floor.free()
	floor_index = index
	var spawn: Vector3
	var title: String
	if index == 0:
		current_floor = Floor0.new()
		spawn = Floor0.SPAWN
		title = Floor0.FLOOR_NAME
	else:
		var world: FloorWorld = FloorWorld.new().setup(index)
		current_floor = world
		spawn = world.spawn
		title = world.data.name
	current_floor.name = "Floor"
	add_child(current_floor)
	player.global_position = spawn
	player.velocity = Vector3.ZERO
	player.yaw = 0.0
	player.pitch = 0.0
	location.text = title


func _process(_delta: float) -> void:
	stamina_bar.value = player.stamina
	_nearby = {}
	var list: Variant = current_floor.get("interactables")
	if list is Array:
		var best := INF
		for item: Dictionary in list:
			var distance := Vector2(item.pos.x - player.global_position.x, item.pos.z - player.global_position.z).length()
			if distance < float(item.r) and distance < best:
				best = distance
				_nearby = item
	prompt.visible = not _nearby.is_empty()
	if prompt.visible:
		prompt.text = _nearby.text


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
		_set_captured(true)
	elif event.is_action_pressed("ui_cancel"):
		_set_captured(false)
	elif event.is_action_pressed("interact") and _nearby.has("to"):
		load_floor.call_deferred(int(_nearby.to))


func _set_captured(captured: bool) -> void:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED if captured else Input.MOUSE_MODE_VISIBLE
	hint.visible = not captured
