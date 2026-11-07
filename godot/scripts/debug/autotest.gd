extends Node
## Developer checks, only active with these command-line options (after a `--` separator):
##   --autotest      checks the data and the player's movement, prints results, exits non-zero on failure
##   --shots=<dir>   saves screenshots of Floor 0 into <dir>, then quits (needs a real window, not --headless)

var _failures := 0


func _ready() -> void:
	await get_tree().physics_frame
	await get_tree().physics_frame
	if OS.get_cmdline_user_args().has("--autotest"):
		await _autotest()
	else:
		await _shots()
	get_tree().quit(1 if _failures > 0 else 0)


func _check(label: String, passed: bool, detail := "") -> void:
	print("%s  %s  %s" % ["PASS" if passed else "FAIL", label, detail])
	if not passed:
		_failures += 1


func _autotest() -> void:
	_check("classes", Data.classes.get("classes", {}).size() == 21, str(Data.classes.get("classes", {}).size()))
	_check("races", Data.classes.get("races", {}).size() == 9)
	_check("skills", Data.skills.get("skills", []).size() == 131)
	_check("monsters", Data.monsters.get("monsters", {}).size() == 41)
	_check("recipes", Data.crafting.get("recipes", []).size() == 735)
	_check("quests", Data.quests.get("quests", {}).size() == 30)
	_check("cardboard goblin stats", Data.monsters.monsters.cardboard.hp == 18.0)

	var player: Player = get_parent().player
	await _settle(player)
	_check("lands on the floor at the spawn point", player.is_on_floor() and player.global_position.distance_to(Floor0.SPAWN) < 0.2, str(player.global_position))

	# walking speed: 5 m/s x 1.03 from the slippers, measured once up to speed
	await _hold(["move_forward"], 0.5)
	var start := player.global_position
	await _hold(["move_forward"], 1.0)
	var walked := start.distance_to(player.global_position)
	Input.action_release("move_forward")
	_check("walks at 5.15 m/s", absf(walked - 5.15) < 0.25, "%.2f m/s" % walked)

	await _hold(["move_forward", "sprint"], 0.5)
	start = player.global_position
	await _hold(["move_forward", "sprint"], 1.0)
	var sprinted := start.distance_to(player.global_position)
	var drained := player.stamina < Player.MAX_STAMINA
	Input.action_release("move_forward")
	Input.action_release("sprint")
	_check("sprints at 8.76 m/s", absf(sprinted - 8.76) < 0.4, "%.2f m/s" % sprinted)
	_check("sprinting uses stamina", drained, "%.1f" % player.stamina)

	await _settle(player)
	Input.action_press("jump")
	await get_tree().physics_frame
	await get_tree().physics_frame
	Input.action_release("jump")
	var peak := 0.0
	for i in 60:
		await get_tree().physics_frame
		peak = maxf(peak, player.global_position.y)
	_check("jump height matches the prototype (about 0.97 m)", absf(peak - 0.97) < 0.12, "%.2f m" % peak)

	# the orientation desk (z = 30) must stop you
	await _settle(player)
	player.global_position = Vector3(0, 0, 36)
	await _hold(["move_forward"], 2.5)
	Input.action_release("move_forward")
	_check("the desk blocks the player", player.global_position.z > 30.8, "z = %.2f" % player.global_position.z)

	# the outer wall (x = 13.5) must stop you too
	player.global_position = Vector3(5, 0, 14)
	await _hold(["move_right"], 3.0)
	Input.action_release("move_right")
	_check("the wall blocks the player", player.global_position.x < 13.2 and player.global_position.x > 12.5, "x = %.2f" % player.global_position.x)

	# all the way to the stairs at the far end, through the gap in the half wall
	player.global_position = Vector3(2, 0, 0)
	await _hold(["move_forward", "sprint"], 12.0)
	Input.action_release("move_forward")
	Input.action_release("sprint")
	_check("can reach the Floor 1 stairs", absf(player.global_position.z + 64.0) < 3.5, "z = %.2f" % player.global_position.z)


func _settle(player: Player) -> void:
	for i in 30:
		await get_tree().physics_frame
	player.velocity = Vector3.ZERO


func _hold(actions: Array, seconds: float) -> void:
	for action: String in actions:
		Input.action_press(action)
	var t := 0.0
	while t < seconds:
		await get_tree().physics_frame
		t += get_physics_process_delta_time()


func _shots() -> void:
	var dir := ""
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--shots="):
			dir = arg.trim_prefix("--shots=")
	var player: Player = get_parent().player
	get_parent().get_node("HUD/Hint").visible = false
	var views := {
		"spawn": [Vector3(0, 0, 56), 0.0, 0.0],
		"desk": [Vector3(4, 0, 38), 0.2, -0.05],
		"yard": [Vector3(-8, 0, 16), -0.35, -0.08],
		"arena": [Vector3(0, 0, -18), 0.0, -0.1],
		"exit": [Vector3(0, 0, -50), 0.0, 0.0],
		"close_pip": [Vector3(0, 0, 31.3), 0.0, -0.1],
		"close_guard": [Vector3(-10, 0, 41.5), 0.0, -0.1],
		"close_goblin": [Vector3(5, 0, -29), 0.0, -0.1],
		"close_dummy": [Vector3(6, 0, 8), 0.0, -0.1],
	}
	for view_name: String in views:
		var v: Array = views[view_name]
		player.global_position = v[0]
		player.velocity = Vector3.ZERO
		player.yaw = v[1]
		player.pitch = v[2]
		for i in 20:
			await get_tree().process_frame
		await RenderingServer.frame_post_draw
		var img := get_viewport().get_texture().get_image()
		img.save_png(dir.path_join(view_name + ".png"))
		print("saved ", view_name, "  ", Engine.get_frames_per_second(), " fps")
