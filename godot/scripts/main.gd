extends Node3D
## Starts the game: loads Floor 0, spawns the player, and handles capturing the mouse.
## A small HUD covers Phase 1 only (the full HUD is Phase 4).

const PLAYER_SCENE := preload("res://scenes/player.tscn")

var player: Player

@onready var hint: Label = $HUD/Hint
@onready var location: Label = $HUD/Location
@onready var stamina_bar: ProgressBar = $HUD/Stamina


func _ready() -> void:
	var floor_node := Floor0.new()
	floor_node.name = "Floor"
	add_child(floor_node)
	player = PLAYER_SCENE.instantiate()
	player.position = Floor0.SPAWN
	add_child(player)
	location.text = Floor0.FLOOR_NAME
	stamina_bar.max_value = Player.MAX_STAMINA
	_set_captured(false)
	if not OS.get_cmdline_user_args().is_empty():
		var runner: Node = load("res://scripts/debug/autotest.gd").new()
		runner.name = "Autotest"
		add_child(runner)


func _process(_delta: float) -> void:
	stamina_bar.value = player.stamina


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
		_set_captured(true)
	elif event.is_action_pressed("ui_cancel"):
		_set_captured(false)


func _set_captured(captured: bool) -> void:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED if captured else Input.MOUSE_MODE_VISIBLE
	hint.visible = not captured
