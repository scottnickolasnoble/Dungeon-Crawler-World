extends Node
## Developer checks, only active with these command-line options (after a `--` separator):
##   --autotest      checks the data and the player's movement, prints results, exits non-zero on failure
##   --shots=<dir>   saves screenshots of the starting floor into <dir>, then quits (needs a real window, not --headless)
##   --floor=<n>     starts on that floor
##   --map=<dir>     writes where everything is on Floors 1-9 into <dir>/floor_<n>.json, for the map sheets, then quits

var _failures := 0


func _ready() -> void:
	Story.cutscenes_on = false
	await get_tree().physics_frame
	await get_tree().physics_frame
	var map_dir := ""
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--map="):
			map_dir = arg.trim_prefix("--map=")
	if OS.get_cmdline_user_args().has("--autotest"):
		await _autotest()
	elif map_dir != "":
		await _maps(map_dir)
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
	_check("monsters (the prototype's 41 and more)", Data.monsters.get("monsters", {}).size() >= 41)
	_check("recipes", Data.crafting.get("recipes", []).size() == 735)
	_check("quests", Data.quests.get("quests", {}).size() == 30)
	_check("cardboard goblin stats", Data.monsters.monsters.cardboard.hp == 18.0)
	Combat.peaceful = true

	for n in range(1, 19):
		await _check_floor(n)
	for n in range(1, 19):
		await _check_wilds(n)
	get_parent().load_floor(0)
	await get_tree().physics_frame

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
	Combat.peaceful = false
	await _combat()
	await _story()
	await _discovery()
	await _cutscene()
	await _chamber()
	await _quest_lines()
	await _clocks()
	await _getting_around()
	var told := 0
	for kind: String in Data.monsters.monsters:
		if not Story.discovery(kind).is_empty():
			told += 1
	_check("Nigel has a story for every monster and chamber boss", told == Data.monsters.monsters.size(), "%d of %d" % [told, Data.monsters.monsters.size()])


func _face(player: Player, target: Vector3) -> void:
	var d := target - player.global_position
	player.yaw = atan2(-d.x, -d.z)
	player.pitch = 0.0
	await get_tree().process_frame


## Fighting: the pipe hits what's in front, monsters wind up and hit back, die, pay out, and bosses use their moves.
func _combat() -> void:
	var main: Node = get_parent()
	main.load_floor(0)
	await get_tree().physics_frame
	var player: Player = main.player
	await _settle(player)
	Combat.heal_full()
	# a practice dummy takes hits but never dies
	var dummy: Mob = null
	var goblins: Array = []
	for m: Mob in Combat.mobs:
		if m.kind == "dummy" and dummy == null:
			dummy = m
		elif m.kind == "cardboard":
			goblins.append(m)
	_check("landing has dummies and goblins", dummy != null and goblins.size() == 3, "%d goblins" % goblins.size())
	Combat.peaceful = true
	player.global_position = dummy.global_position + Vector3(0, 0, 2.2)
	await _settle(player)
	await _face(player, dummy.global_position)
	_check("the pipe hits what's in front", Combat.player_swing(false) == 1)
	player.yaw += PI
	await get_tree().process_frame
	_check("the pipe misses what's behind", Combat.player_swing(false) == 0)
	_check("a dummy can't be killed", not dummy.dead)
	# a goblin notices, winds up and hits back
	var goblin: Mob = goblins[0]
	Combat.peaceful = false
	var hp_before := Combat.hp
	player.global_position = goblin.global_position + Vector3(0, 0, 4.0)
	await _settle(player)
	_check("a goblin notices the player", goblin.state != "idle", goblin.state)
	var saw_telegraph := false
	var t := 0.0
	while t < 6.0 and Combat.hp >= hp_before:
		await get_tree().physics_frame
		t += get_physics_process_delta_time()
		saw_telegraph = saw_telegraph or goblin._telegraph != null
	_check("a goblin shows its attack on the ground first", saw_telegraph)
	_check("a goblin's hit lands", Combat.hp < hp_before, "%.0f -> %.0f after %.1f s" % [hp_before, Combat.hp, t])
	# beat them all
	var xp_before := Combat.xp + Combat.level * 100000
	for g: Mob in goblins:
		var tries := 0
		while not g.dead and tries < 40:
			Combat.hp = Combat.max_hp()
			player.global_position = g.global_position + (player.global_position - g.global_position).normalized() * 1.6
			await _face(player, g.global_position)
			player.swing(false)
			for i in 40:
				await get_tree().physics_frame
			tries += 1
	_check("the goblins can be beaten", goblins.all(func(g: Mob) -> bool: return g.dead))
	_check("kills give experience", Combat.xp + Combat.level * 100000 > xp_before, "LV %d, %d xp" % [Combat.level, Combat.xp])
	_check("the landing camp counts as cleared", Combat.alive_in("landing") == 0)
	# Floor 1's boss camp: the crew fights together and the boss uses its moves
	main.load_floor(1)
	await get_tree().physics_frame
	await _settle(player)
	var boss: Mob = null
	for m: Mob in Combat.mobs:
		if m.def.get("boss", false):
			boss = m
			break
	_check("floor 1 has a boss", boss != null)
	if boss:
		player.global_position = boss.global_position + Vector3(6, 0, 0)
		var used := false
		t = 0.0
		while t < 25.0 and not used:
			Combat.hp = Combat.max_hp()
			await get_tree().physics_frame
			t += get_physics_process_delta_time()
			used = boss.moves_used > 0
		_check("%s uses a special move" % boss.def.name, used, "after %.1f s" % t)
		_check("the boss shows on the boss bar", Combat.boss == boss)
		var crew := 0
		for m: Mob in Combat.mobs:
			if m.group == boss.group and m != boss and m.state != "idle":
				crew += 1
		_check("the boss's crew joins in", crew >= 2, "%d" % crew)
		# run far away: they give up and go home
		player.global_position = boss.home + (boss.home - Vector3.ZERO).normalized() * -70.0 + Vector3.UP
		t = 0.0
		while t < 12.0 and boss.state != "return" and boss.state != "idle":
			Combat.hp = Combat.max_hp()
			await get_tree().physics_frame
			t += get_physics_process_delta_time()
		_check("the boss gives up and goes home", boss.state == "return" or boss.state == "idle", boss.state)
	# an outpost's loot box opens once its monsters are dead
	var box: Dictionary = {}
	for item: Dictionary in main.current_floor.interactables:
		if item.has("loot"):
			box = item
			break
	_check("outposts have loot boxes", not box.is_empty())
	if not box.is_empty():
		_check("a loot box starts locked", Combat.alive_in(box.loot) > 0, main._prompt_for(box))
		for m: Mob in Combat.mobs:
			if m.group == box.loot:
				while not m.dead:
					Combat.hurt_mob(m, 9999)
		var gold := Combat.gold
		main._open_loot(box)
		_check("a cleared camp's loot box pays out", Combat.gold > gold and box.opened, main._prompt_for(box))
	# dying puts you back at the stairs
	Combat.hit_player(99999, null, true)
	t = 0.0
	while t < 4.0:
		await get_tree().process_frame
		t += get_process_delta_time()
	_check("dying sends you back to the start", Combat.hp > 0 and player.global_position.distance_to(main.current_floor.spawn) < 2.0, "%.0f hp" % Combat.hp)


## The hand-built outdoors: caves and loot rooms must hold you up, and the ride line must carry you end to end.
func _check_wilds(n: int) -> void:
	get_parent().load_floor(n)
	await get_tree().physics_frame
	var main: Node = get_parent()
	var player: Player = main.player
	var world: FloorWorld = main.current_floor
	for target: Array in [["cave", Wilds.CAVE_AT + Vector3(0, 0.5, 0)], ["loot room", Wilds.LOOT_AT + Vector3(0, 0.1, 5)]]:
		player.global_position = target[1]
		player.velocity = Vector3.ZERO
		await _settle(player)
		var fell: float = target[1].y - player.global_position.y
		_check("floor %d: stands in the %s" % [n, target[0]], player.is_on_floor() and fell < 6.0, "dropped %.1f m" % fell)
	player.global_position = Wilds.CAVE_AT + Vector3(0, 0.5, 0)
	player.yaw = world.wilds.cave_walk_yaw
	await _settle(player)
	var start := player.global_position
	await _hold(["move_forward"], 2.5)
	Input.action_release("move_forward")
	_check("floor %d: can walk in the cave" % n, start.distance_to(player.global_position) > 6.0, "%.1f m" % start.distance_to(player.global_position))
	player.global_position = world.wilds.zip_path[0]
	main._start_ride(1)
	var ride_time := 0.0
	while not main._ride.is_empty() and ride_time < 60.0:
		await get_tree().process_frame
		ride_time += get_process_delta_time()
	var finish: Vector3 = world.wilds.zip_path[1]
	_check("floor %d: ride line reaches the far end" % n, Vector2(player.global_position.x - finish.x, player.global_position.z - finish.z).length() < 1.5, "%.1f s" % ride_time)
	await _settle(player)
	_check("floor %d: lands safely after the ride" % n, player.is_on_floor(), str(player.global_position))
	# Floors with hills: you can walk from the foot of a hill all the way up it
	if world.terrain:
		# the Soup District is packed tight, so it only has room for a couple
		_check("floor %d: has hills" % n, world.terrain.summits.size() >= (1 if n == 3 else 3), "%d summits" % world.terrain.summits.size())
		# some routes are blocked by trees or rocks; any clear way up counts
		var climbed := false
		var detail := ""
		for hill: Array in world.terrain.summits.slice(0, 3):
			for turn in 4:
				if climbed:
					break
				var top: Vector3 = hill[0]
				var foot: Vector3 = top + Vector3(hill[1] * 0.85, 0, 0).rotated(Vector3.UP, turn * PI / 2.0)
				foot.y = world.ground(foot.x, foot.z) + 1.0
				player.global_position = foot
				player.yaw = atan2(-(top.x - foot.x), -(top.z - foot.z))
				player.velocity = Vector3.ZERO
				await _settle(player)
				var low := player.global_position.y
				await _hold(["move_forward"], hill[1] * 0.85 / 5.15 + 3.0)
				Input.action_release("move_forward")
				climbed = player.global_position.y > low + (top.y - low) * 0.7
				detail = "%.1f m -> %.1f m (top %.1f)" % [low, player.global_position.y, top.y]
		# the Soup District's couple of hills are boxed in by buildings; its height comes from towers
		if n != 3:
			_check("floor %d: can hike up a hill" % n, climbed, detail)
	if world.terrain:
		_check("floor %d: has towers and cars" % n, world.wilds.towers.size() >= 2 and world.wilds.vehicles.size() >= 3, "%d towers, %d cars" % [world.wilds.towers.size(), world.wilds.vehicles.size()])
	if not world.wilds.towers.is_empty():
		var tw: Dictionary = world.wilds.towers[0]
		var base: Vector3 = tw.at
		var yaw: float = tw.yaw
		var space := player.get_world_3d().direct_space_state
		var roof_y: float = base.y + tw.levels * Wilds.STOREY
		# off-centre, clear of the rooftop stash
		var probe_at: Vector3 = base + Vector3(-3.0, 0, 4.0).rotated(Vector3.UP, yaw)
		var probe := PhysicsRayQueryParameters3D.create(probe_at + Vector3(0, roof_y - base.y + 3.0, 0), probe_at + Vector3(0, roof_y - base.y - 1.0, 0))
		probe.exclude = [player.get_rid()]
		var hit := space.intersect_ray(probe)
		_check("floor %d: the tower roof is solid" % n, not hit.is_empty() and absf(hit.position.y - roof_y) < 0.6, str(hit.get("position", "nothing")))
		# walk up the first ramp from the ground
		player.global_position = base + Vector3(8.0, 0.3, -11.5).rotated(Vector3.UP, yaw)
		player.yaw = yaw + PI
		player.velocity = Vector3.ZERO
		await _settle(player)
		var start_y := player.global_position.y
		await _hold(["move_forward"], 4.5)
		Input.action_release("move_forward")
		_check("floor %d: can walk up a tower ramp" % n, player.global_position.y > start_y + 4.0, "%.1f -> %.1f m" % [start_y, player.global_position.y])
	if not world.wilds.vehicles.is_empty():
		var car: Vehicle = world.wilds.vehicles[0]
		var before := car.global_position
		get_parent()._start_driving(car)
		await _hold(["move_forward"], 3.0)
		Input.action_release("move_forward")
		var moved := Vector2(car.global_position.x - before.x, car.global_position.z - before.z).length()
		get_parent()._stop_driving()
		_check("floor %d: a car drives" % n, moved > 8.0, "%.1f m in 3 s" % moved)


## Every floor must load, put you on the ground outside any wall, and let you walk into a shop and back out.
func _check_floor(n: int) -> void:
	get_parent().load_floor(n)
	await get_tree().physics_frame
	var player: Player = get_parent().player
	var world: FloorWorld = get_parent().current_floor
	await _settle(player)
	_check("floor %d: spawn" % n, player.is_on_floor() and player.global_position.distance_to(world.spawn) < 0.5, str(player.global_position))
	var shops := 0
	for door: Dictionary in world.doors:
		if door.name != "Home" and door.name != "Safe Room":
			shops += 1
	_check("floor %d: has shops" % n, shops >= 5, "%d named doors of %d" % [shops, world.doors.size()])
	_check("floor %d: has contestant camps and hidden encampments" % n, world.discovery.crews.size() >= 2 and world.discovery.secrets.size() >= 2, "%d camps, %d secrets" % [world.discovery.crews.size(), world.discovery.secrets.size()])
	# No doorway may be blocked: a straight line from the street into every room has to be clear.
	var space := player.get_world_3d().direct_space_state
	var blocked := []
	for each: Dictionary in world.doors:
		var query := PhysicsRayQueryParameters3D.create(each.outside + Vector3.UP, each.inside + Vector3.UP)
		query.exclude = [player.get_rid()]
		if not space.intersect_ray(query).is_empty():
			blocked.append(each.name)
	_check("floor %d: every door is clear" % n, blocked.is_empty(), "%d doors%s" % [world.doors.size(), " blocked: " + str(blocked) if not blocked.is_empty() else ""])
	# Walk through the first shop's door from the street to the inside.
	var door: Dictionary = world.doors[0]
	var walk: Vector3 = door.inside - door.outside
	player.global_position = door.outside
	player.velocity = Vector3.ZERO
	player.yaw = atan2(-walk.x, -walk.z)
	await _hold(["move_forward"], walk.length() / 5.15 + 0.25)
	Input.action_release("move_forward")
	var progress: float = (player.global_position - door.outside).dot(walk.normalized())
	_check("floor %d: walks in through %s's door" % [n, door.name], progress > walk.length() * 0.85, "%.1f of %.1f m" % [progress, walk.length()])
	player.yaw = 0.0


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


func _floor_shots(player: Player, dir: String) -> void:
	var world: FloorWorld = get_parent().current_floor
	var n: int = world.floor_number
	var door: Dictionary = world.doors[0]
	var into: Vector3 = door.inside - door.outside
	var yaw := atan2(-into.x, -into.z)
	var street_side: Vector3 = door.outside - into.normalized() * 8.0 + into.normalized().rotated(Vector3.UP, PI / 2.0) * 5.0
	var look_door: Vector3 = door.outside - street_side
	var views := {
		"gate": [world.spawn + Vector3(0, 0, 8), 0.0, 0.03],
		"square": [Vector3(-2, 0, 20), 0.0, 0.02],
		"shopfront": [street_side, atan2(-look_door.x, -look_door.z), 0.08],
		"interior": [door.inside - into.normalized() * 0.3, yaw, -0.05],
		"aerial": [Vector3(0, float(world.data.ceil) - 2.3, 48), 0.0, -0.42],
	}
	DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	var worst := 9999.0
	player.set_physics_process(false)
	if world.wilds:
		views.merge(world.wilds.views)
	# close-ups of the townsfolk nearest the hub, face to face, to check how they stand and move
	var folk: Array = get_tree().get_nodes_in_group("people_life")
	folk.sort_custom(func(a: Node, b: Node) -> bool: return a.model.global_position.distance_to(world.spawn) < b.model.global_position.distance_to(world.spawn))
	for k in mini(4, folk.size()):
		var at: Vector3 = folk[k].model.global_position
		var face: Vector3 = Vector3(sin(folk[k].model.rotation.y), 0, cos(folk[k].model.rotation.y))
		var from := at + face * 3.2
		views["npc_%d" % (k + 1)] = [Vector3(from.x, at.y, from.z), atan2(face.x, face.z), -0.12]
	# a look at each boss camp from just outside its gate, and one outpost
	for c: Dictionary in world.data.get("camps", []).slice(0, 3):
		var camp := Vector3(c.x, 0, c.z)
		var out := -camp.normalized() * (float(c.get("r", 20)) + 6.0)
		views["camp_" + str(c.name).to_snake_case().left(14)] = [camp + out, atan2(out.x, out.z), -0.05]
	for pt: Dictionary in world.points:
		if pt.kind == "outpost":
			var spot := Vector3(pt.x, 0, pt.z)
			var back := -spot.normalized() * 15.0
			views["outpost"] = [spot + back, atan2(back.x, back.z), -0.08]
			break
	# the hills: one from the foot of the biggest, and the view from its top
	if world.terrain and not world.terrain.summits.is_empty():
		var best: Array = world.terrain.summits[0]
		for sm: Array in world.terrain.summits:
			if sm[0].y > best[0].y:
				best = sm
		var top: Vector3 = best[0]
		var foot := top + Vector3(best[1] * 0.95, 0, best[1] * 0.35)
		foot.y = world.ground(foot.x, foot.z)
		var up := top - foot
		views["hill"] = [foot, atan2(-up.x, -up.z), atan2(up.y, Vector2(up.x, up.z).length()) * 0.6]
		views["summit"] = [top + Vector3(0, 0.2, 3.5), atan2(-foot.x + top.x, -foot.z + top.z) + PI, -0.25]
		print("terrain: %d summits, tallest %.1f m" % [world.terrain.summits.size(), top.y])
	for view_name: String in views:
		var v: Array = views[view_name]
		player.global_position = v[0]
		player.velocity = Vector3.ZERO
		player.yaw = v[1]
		player.pitch = v[2]
		for i in 30:
			await get_tree().process_frame
		await RenderingServer.frame_post_draw
		get_viewport().get_texture().get_image().save_png(dir.path_join("f%d_%s.png" % [n, view_name]))
		# time real frames here, with the display's frame cap off and no screenshot in the way
		var clock := Time.get_ticks_usec()
		for i in 40:
			await get_tree().process_frame
		var fps := 40.0 / ((Time.get_ticks_usec() - clock) / 1000000.0)
		worst = minf(worst, fps)
		print("saved f%d_%s  %.0f fps" % [n, view_name, fps])
	print("WORST f%d %.0f fps" % [n, worst])
	# the travel map (M)
	get_parent().travel_map.open(world, player)
	for i in 3:
		await get_tree().process_frame
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png(dir.path_join("f%d_travel_map.png" % n))
	get_parent().travel_map.close()
	# a boss making its entrance in one of the floor's chambers
	if not world.wilds.chambers.is_empty():
		var chamber: BossChamber = world.wilds.chambers[0]
		Story.cutscenes_on = true
		player.set_physics_process(true)
		player.global_position = chamber.global_position + Vector3(0, 1, 0)
		for i in 150:
			await get_tree().process_frame
		await RenderingServer.frame_post_draw
		get_viewport().get_texture().get_image().save_png(dir.path_join("f%d_chamber_entrance.png" % n))
		get_parent().cutscene.skip()
		Story.cutscenes_on = false


## Everything a map sheet needs: towns, camps, landmarks, stairs, rides, ways underground and the named districts.
func _maps(dir: String) -> void:
	for n in range(1, 19):
		get_parent().load_floor(n)
		await get_tree().physics_frame
		await get_tree().physics_frame
		var world: FloorWorld = get_parent().current_floor
		var data: Dictionary = world.data
		var camps := []
		for c: Dictionary in data.get("camps", []):
			var boss: Dictionary = Data.monsters.monsters.get(str(c.get("boss", "")), {})
			var mobs := []
			for m: Variant in (c.mob if c.get("mob") is Array else [c.get("mob", "")]):
				mobs.append(Data.monsters.monsters.get(str(m), {}).get("name", FloorWorld.UNDERCITY_NAMES.get(str(m), str(m))))
			camps.append({ "name": c.name, "x": c.x, "z": c.z, "r": c.get("r", 20), "level": c.get("level", ""), "boss": boss.get("name", FloorWorld.UNDERCITY_NAMES.get(str(c.get("boss", "")), str(c.get("boss", "")))), "mobs": mobs })
		var places := []
		for v: String in world.wilds.views:
			if world.wilds.view_targets.has(v):
				var t: Vector3 = world.wilds.view_targets[v]
				places.append({ "name": v, "x": t.x, "z": t.z })
			else:
				var spot: Array = world.wilds.views[v]
				var from: Vector3 = spot[0]
				var yaw: float = spot[1]
				places.append({ "name": v, "x": from.x - sin(yaw) * 26.0, "z": from.z - cos(yaw) * 26.0 })
		var ways := []
		var rides := []
		for it: Dictionary in world.interactables:
			var p: Vector3 = it.pos
			if p.y < -20.0:
				continue
			if it.has("teleport"):
				var to: Vector3 = it.teleport
				ways.append({ "kind": "loot" if to.distance_to(Wilds.LOOT_AT) < 40.0 else "cave", "x": p.x, "z": p.z, "text": it.text })
			elif it.has("zip") and int(it.zip) > 0:
				var ride: Dictionary = world.wilds.rides[int(it.zip) - 1]
				var path: Array = ride.path
				rides.append({ "vehicle": ride.vehicle, "x1": path[0].x, "z1": path[0].z, "x2": path[1].x, "z2": path[1].z, "text": it.text })
		var buildings := []
		for door: Dictionary in world.doors:
			var o: Vector3 = door.outside
			buildings.append({ "name": door.name, "x": o.x, "z": o.z })
		var out := { "floor": n, "name": data.name, "hub": data.hub_name, "hub_w": data.hub.w, "hub_d": data.hub.d, "size": world.world_size,
			"spawn": [world.spawn.x, world.spawn.z], "stairs": { "x": data.stairs.x, "z": data.stairs.z, "to": data.stairs.to, "how": data.stairs.get("how", "") },
			"villages": data.get("villages", []).map(func(v: Dictionary) -> Dictionary: return { "name": v.name, "x": v.x, "z": v.z }),
			"landmarks": data.get("landmarks", []), "camps": camps, "places": places, "ways": ways, "rides": rides, "buildings": buildings, "points": world.points }
		var file := FileAccess.open(dir.path_join("floor_%d.json" % n), FileAccess.WRITE)
		file.store_string(JSON.stringify(out))
		file.close()
		print("MAPPED floor ", n)
	get_tree().quit()


func _shots() -> void:
	var dir := ""
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--shots="):
			dir = arg.trim_prefix("--shots=")
	var player: Player = get_parent().player
	get_parent().get_node("HUD/Hint").visible = false
	Combat.peaceful = true
	if get_parent().floor_index > 0:
		await _floor_shots(player, dir)
		return
	var views := {
		"spawn": [Vector3(0, 0, 56), 0.0, 0.0],
		"desk": [Vector3(4, 0, 38), 0.2, -0.05],
		"yard": [Vector3(-8, 0, 16), -0.35, -0.08],
		"arena": [Vector3(0, 0, -18), 0.0, -0.1],
		"exit": [Vector3(0, 0, -50), 0.0, 0.0],
		"close_pip": [Vector3(0, 0, 31.3), 0.0, -0.1],
		"close_guard": [Vector3(-10, 0, 41.5), 0.0, -0.1],
		"close_goblin": [Vector3(5, 0, -29.6), 0.0, -0.18],
		"close_pylon": [Vector3(5, 0, 47.4), 0.0, -0.06],
		"pip_far": [Vector3(0, 0, 33.8), 0.0, -0.06],
		"close_dummy": [Vector3(6, 0, 8), 0.0, -0.1],
		"pip_walk_a": [Vector3(0, 0, 23.5), PI, -0.05],
		"pip_walk_b": [Vector3(0, 0, 23.5), PI, -0.05],
		"pip_walk_c": [Vector3(0, 0, 23.5), PI, -0.05],
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
	# a fight in progress: a goblin winding up, its attack marked on the ground, the HUD up
	Combat.peaceful = false
	player.global_position = Vector3(-3, 0, -28.5)
	player.yaw = 0.35
	player.pitch = -0.32
	for f in 8:
		var t := 0.0
		var goblin: Mob = null
		for m: Mob in Combat.mobs:
			if m.kind == "cardboard" and not m.dead:
				goblin = m
		while t < 4.0 and (goblin == null or goblin._telegraph == null or goblin._act.t < 0.5):
			await get_tree().process_frame
			t += get_process_delta_time()
		if f == 0:
			player.swing(false)
			Combat.hurt_mob(goblin, 6, false, true)
		await RenderingServer.frame_post_draw
		get_viewport().get_texture().get_image().save_png(dir.path_join("fight_%d.png" % f))
		if f >= 1:
			break
	# a conversation with Pip, with the quest tracker up
	Combat.peaceful = true
	Story.start("tut_desk")
	player.global_position = Vector3(1.2, 0, 33.6)
	player.yaw = 0.15
	player.pitch = -0.05
	for i in 30:
		await get_tree().process_frame
	get_parent().dialogue.open("pip")
	get_parent().dialogue.pick_number(2)
	for i in 200:
		await get_tree().process_frame
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png(dir.path_join("dialogue.png"))
	get_parent().dialogue.close()
	# the swing, frame by frame, light then heavy
	for heavy in [false, true]:
		player.viewmodel.swing(heavy)
		for f in 7:
			player.viewmodel._process(0.06 if not heavy else 0.07)
			player.viewmodel.set_process(false)
			await RenderingServer.frame_post_draw
			var frame := get_viewport().get_texture().get_image()
			frame.resize(480, 270)
			frame.save_png(dir.path_join("swing_%s_%d.png" % ["heavy" if heavy else "light", f]))
			player.viewmodel.set_process(true)
	# a discovery cutscene: the cardboard goblin's story
	var goblin_at := Vector3.ZERO
	for m: Mob in Combat.mobs:
		if m.kind == "cardboard":
			goblin_at = m.global_position
	get_parent().cutscene.play(Story.discovery("cardboard"), goblin_at, 1.4)
	for i in 160:
		await get_tree().process_frame
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png(dir.path_join("cutscene.png"))
	get_parent().cutscene.skip()


## Plays a conversation by choice numbers, e.g. _talk("marta", [1, 1, 1]). Returns the box still open or not.
func _talk(npc: String, picks: Array) -> bool:
	var box: DialogueBox = get_parent().dialogue
	if not box.open(npc):
		return false
	for n: int in picks:
		if not box.is_open():
			break
		box.pick_number(n)
		await get_tree().process_frame
	if box.is_open():
		box.close()
	return true


## The story: every condition in the dialogue file parses, then the Floor 0 tutorial and Floor 1's arc play through.
func _story() -> void:
	var bad := []
	for npc: String in Story.dialogue:
		var tree: Dictionary = Story.dialogue[npc]
		var conditions := []
		for entry: Dictionary in tree.get("start", []):
			conditions.append(entry.get("if", ""))
			if not tree.nodes.has(entry.go):
				bad.append("%s start -> %s" % [npc, entry.go])
		for node_id: String in tree.nodes:
			for c: Dictionary in tree.nodes[node_id].get("choices", []):
				conditions.append(c.get("if", ""))
				if c.has("go") and not tree.nodes.has(c.go):
					bad.append("%s.%s -> %s" % [npc, node_id, c.go])
				for action: String in c.get("do", []):
					var q := action.get_slice(":", 1)
					if action.get_slice(":", 0) in ["start", "complete", "force"] and not Story.quests_def.has(q):
						bad.append("%s.%s unknown quest %s" % [npc, node_id, q])
		for cond: String in conditions:
			var expr := Expression.new()
			if cond != "" and (expr.parse(cond) != OK or expr.execute([], Story) == null):
				bad.append("%s: %s" % [npc, cond])
	_check("every conversation links up and every condition runs", bad.is_empty(), str(bad))

	var main: Node = get_parent()
	var player: Player = main.player
	Story.reset()
	Combat.peaceful = true
	main.load_floor(0)
	await get_tree().physics_frame
	_check("the tutorial starts on the Landing", Story.active("tut_desk"))
	await _talk("pip", [1])
	_check("talking to Pip starts Contestant Basics", Story.done("tut_desk") and Story.active("tut_basics"))
	for item: Dictionary in main.current_floor.interactables:
		if item.has("act"):
			main._nearby = item
			main.use_nearby()
	for i in 5:
		Story.count("dummyHits")
	_check("fountain, Welcome Box and dummy finish the basics", Story.is_ready("tut_basics"), str(Story.tracker_lines()))
	_check("Pip shows a ? when there's something to hand in", Story.marker("pip") == "?")
	await _talk("pip", [1])
	for i in 3:
		Story.event("kill", { "kind": "cardboard" })
	await _talk("pip", [1, 1])
	_check("the arena and the last talk start Going Down", Story.done("tut_arena") and Story.active("tut_down"))

	main.load_floor(1)
	await get_tree().physics_frame
	_check("reaching Floor 1 finishes the tutorial", Story.done("tut_down") and Story.active("arrival"))
	var stairs: Dictionary = {}
	for item: Dictionary in main.current_floor.interactables:
		if item.has("needs") and item.has("to"):
			stairs = item
	_check("the stairwell down starts chained", not stairs.is_empty() and main._prompt_for(stairs) == stairs.locked, main._prompt_for(stairs) if not stairs.is_empty() else "none")
	_check("Marta has a quest marker", Story.marker("marta") != "", Story.marker("marta"))
	await _talk("marta", [1, 1, 1])
	_check("Marta's welcome", Story.done("arrival"))
	await _talk("marta", [1, 1])
	_check("Marta asks you to find the Exit Sign", Story.active("nobody_out"))
	player.global_position = Vector3(0, 0.5, -335)
	for i in 50:
		await get_tree().physics_frame
	_check("walking to the Exit Sign counts", Story.is_ready("nobody_out"))
	await _talk("exit_sign", [1, 1, 1])
	_check("the wall behind the Exit Sign leads to the ticket machine", Story.flag("saw_wall") and Story.active("ticket_machine"))
	await _talk("ticket_machine", [])
	_check("the machine wants all three tickets", not Story.flag("machine_solved"))
	for i in 3:
		await _talk("ticket_%d" % (i + 1), [1])
	await _talk("ticket_machine", [2])
	_check("the wrong order fails", not Story.flag("machine_solved"))
	await _talk("ticket_machine", [1, 1, 1, 1])
	_check("the right order solves the ticket machine", Story.flag("machine_solved") and Story.done("ticket_machine"))
	await _talk("bracelet", [1, 1])
	_check("the drowned contestant's bracelet", Story.flag("truth_clue_2"))
	await _talk("marta", [1])
	_check("Marta sends you after Pylon", Story.done("nobody_out") and Story.active("the_stairs"))
	await _talk("pylon", [1, 1])
	_check("with both clues, Pylon shows you the seal (the truth ending)", Story.flag("pylon_truth") and Story.flag("cone_key"))
	_check("Pylon Point is under truce", Combat.truce_groups.has("camp:Pylon Point"))
	_check("one key isn't enough: the stairwell has four padlocks", not Story.is_ready("the_stairs"))
	for key: String in ["f1_key_toll", "f1_key_lost", "f1_key_moth", "f1_key_ticket"]:
		Story.force(key)
	await _talk("marta", [1, 2])
	_check("Marta hands over the key and the floor is complete", Story.done("the_stairs") and Story.flag("f1_stairs"))
	_check("the stairwell down opens", main._prompt_for(stairs) != stairs.locked, main._prompt_for(stairs))
	Story.reset()
	Combat.peaceful = false


## A hidden encampment: the hatch starts sealed, the clues' answer opens it, and the chamber below pays out a lore page.
func _discovery() -> void:
	var main: Node = get_parent()
	Story.reset()
	Combat.peaceful = true
	main.load_floor(4)
	await get_tree().physics_frame
	var world: FloorWorld = main.current_floor
	var secret: Dictionary = world.discovery.secrets[0]
	var hatch: Dictionary = {}
	for item: Dictionary in world.interactables:
		if item.get("needs", "") == secret.id:
			hatch = item
	_check("a hidden encampment's hatch starts sealed", not hatch.is_empty() and main._prompt_for(hatch) == hatch.locked)
	await _talk("puzzle_" + secret.id, [1 if secret.solution[0] != 1 else 2])
	_check("a wrong answer doesn't open it", not Story.flag(secret.id))
	await _talk("puzzle_" + secret.id, secret.solution + [1])
	_check("the clues' answer opens the hatch (%s)" % secret.puzzle, Story.flag(secret.id), str(secret.solution))
	main._nearby = hatch
	main.use_nearby()
	await get_tree().physics_frame
	var player: Player = main.player
	await _settle(player)
	_check("the hatch leads down to the chamber", player.global_position.distance_to(secret.chamber) < 6.0 and player.is_on_floor(), str(player.global_position))
	var before := Story.lore_count()
	for item: Dictionary in world.interactables:
		if item.has("act") and item.pos.distance_to(secret.chamber) < 6.0:
			main._nearby = item
			main.use_nearby()
	_check("the chamber's stash holds a lore page", Story.lore_count() == before + 1 and Story.marks >= 2, "%d pages, %d marks" % [Story.lore_count(), Story.marks])
	var scav := ""
	for key: String in Story.dialogue:
		if key.begins_with("scav_4_"):
			scav = key
	if scav != "":
		var group := ""
		for g: String in Combat.truce_groups:
			if g.begins_with("crew:scavengers:4"):
				group = g
		_check("Scavengers wait for an answer", group != "")
		Combat.peaceful = false
		await _talk(scav, [2])
		_check("refusing their toll starts a fight", not Combat.truce_groups.has(group))
	Story.reset()
	Combat.peaceful = false


## A discovery cutscene: it stops the world, plays every line, and gives the game back with the player's camera.
func _cutscene() -> void:
	var main: Node = get_parent()
	main.load_floor(1)
	await get_tree().physics_frame
	var entry := Story.discovery("goblin")
	_check("every race and the Floor 0-1 monsters and bosses have a story", Story.discoveries.races.size() == 11 and Story.discovery("pylon").lines.size() >= 4, "%d races, %d monsters" % [Story.discoveries.races.size(), Story.discoveries.monsters.size()])
	var cam: Camera3D = get_viewport().get_camera_3d()
	main.cutscene.play(entry, main.player.global_position + Vector3(0, 0, -6), 1.4)
	await get_tree().process_frame
	_check("a cutscene stops the world", get_tree().paused and get_viewport().get_camera_3d() != cam)
	for i in entry.lines.size() * 2 + 2:
		main.cutscene.advance()
		await get_tree().process_frame
	await get_tree().process_frame
	_check("after the last line the game comes back", not get_tree().paused and not main.cutscene.playing and get_viewport().get_camera_3d() == cam)


## A boss chamber: walk in and the door shuts, the boss arrives and fights; kill it and the door opens.
func _chamber() -> void:
	var main: Node = get_parent()
	Story.reset()
	main.load_floor(2)
	await get_tree().physics_frame
	var world: FloorWorld = main.current_floor
	_check("every floor has a grand chamber and lesser ones", Data.chambers.size() == 18 and world.wilds.chambers.size() >= 3 and world.wilds.chambers[0].get_meta("grand"), "%d here" % world.wilds.chambers.size())
	if world.wilds.chambers.is_empty():
		return
	var chamber: BossChamber = world.wilds.chambers[0]
	var player: Player = main.player
	Combat.heal_full()
	_check("a chamber's door starts sealed", chamber.state == "sealed" and not chamber._door.disabled)
	Story.start(chamber.quest)
	# every step but the boss, whatever this chamber's way in is (sigils, keys, levers, a password, a bell)
	var steps: Array = Story.quests_def[chamber.quest].obj
	for i in steps.size() - 1:
		if steps[i].t == "flag":
			Story.set_flag(str(steps[i].flag))
		else:
			Story.quests[chamber.quest].prog[i] = 99
	for i in 5:
		await get_tree().process_frame
	_check("the quest's steps break the seals", chamber.state == "waiting", chamber.state)
	for i in 120:
		await get_tree().physics_frame
	player.global_position = chamber.global_position + Vector3(0, 1, 0)
	for i in 30:
		await get_tree().physics_frame
	_check("walking in shuts the door and brings the boss", chamber.state == "fight" and chamber.boss != null and not chamber._door.disabled, chamber.state)
	if chamber.boss:
		while not chamber.boss.dead:
			Combat.hurt_mob(chamber.boss, 9999)
		for i in 5:
			await get_tree().physics_frame
		_check("beating the boss opens the door", chamber.state == "cleared" and chamber._door.disabled)
		_check("and finishes the chamber's quest", Story.done(chamber.quest))
	Story.reset()


## Every floor's main line: its quests are there, the first ones start when you arrive, everything they send you to
## find is on the map, the way down stays shut until the last main quest is done, and then it opens.
func _quest_lines() -> void:
	var main: Node = get_parent()
	for n in range(1, 19):
		Story.reset()
		main.load_floor(n)
		await get_tree().physics_frame
		await get_tree().physics_frame
		var world: FloorWorld = main.current_floor
		var mains: Array = []
		for id: String in Story.quests_def:
			if int(Story.quests_def[id].get("floor", -1)) == n and Story.quests_def[id].get("main", false) and not id.begins_with("chamber_"):
				mains.append(id)
		_check("floor %d: has a main line" % n, mains.size() >= (3 if n == 18 else 4), str(mains.size()))
		var started := 0
		for id: String in mains:
			if Story.started(id):
				started += 1
		_check("floor %d: the main line starts when you arrive" % n, n == 1 or started >= 1, str(started))
		var exits: Array = world.interactables.filter(func(i: Dictionary) -> bool: return i.has("to"))
		_check("floor %d: one way down" % n, exits.size() == 1 or n == 18, str(exits.size()))
		var lost := 0
		for item: Dictionary in world.interactables:
			if item.has("step") and not Story.quests_def.has(str(item.step[0])):
				lost += 1
		_check("floor %d: every quest thing belongs to a quest" % n, lost == 0, str(lost))
		var traps := 0
		for c: BossChamber in world.wilds.chambers:
			if c.trap:
				traps += 1
				_check("floor %d: a trap chamber is open and unwarned" % n, c.state == "waiting", c.state)
		_check("floor %d: one trap chamber" % n, traps == 1, str(traps))
		if n == 18:
			continue
		var way: Dictionary = exits[0]
		_check("floor %d: the way down starts shut" % n, way.has("needs") and not Story.flag(str(way.needs)), str(way.get("needs", "")))
		# play the line through: each quest in order, as it comes up (and whatever earlier story it waits on)
		for id: String in mains:
			for before: Variant in Story.quests_def[id].get("after", []):
				if not mains.has(before):
					Story.force(str(before))
		for pass_i in 8:
			for id: String in mains:
				if Story.started(id) and not Story.done(id):
					Story.force(id)
			Story.set_flag("_tick")
			for id: String in mains:
				if not Story.started(id) and (Story.quests_def[id].get("with", "") == "" and Story.quests_def[id].get("after", []).is_empty() and not Story.quests_def[id].get("arrive", false)):
					Story.start(id)
		var undone := mains.filter(func(id: String) -> bool: return not Story.done(id))
		_check("floor %d: the main line can be finished" % n, undone.is_empty(), str(undone))
		_check("floor %d: and then the way down opens" % n, Story.flag(str(way.needs)), str(way.needs))
	Story.reset()


## The clock and the cold: the heist's dead air runs out and the Live Light comes back on; Floor 15's cold drains
## away from the fires and comes back near them.
func _clocks() -> void:
	var main: Node = get_parent()
	Story.reset()
	main.load_floor(16)
	await get_tree().physics_frame
	var world: FloorWorld = main.current_floor
	Story.start("f16_heist")
	Story.set_flag("qs_f16_heist_0")
	var light: Dictionary = {}
	for item: Dictionary in world.interactables:
		if item.has("step") and str(item.step[0]) == "f16_heist" and int(item.step[1]) == 0:
			light = item
	light.used = true
	Story._timers(1.0)
	_check("killing the Live Light starts the dead-air clock", Story.countdown.get("quest", "") == "f16_heist" and float(Story.countdown.left) > 100.0, str(Story.countdown))
	Story._timers(200.0)
	_check("run out of dead air and the Live Light comes back on", not Story.flag("qs_f16_heist_0") and Story.countdown.is_empty())
	_check("and it can be killed again", not light.get("used", false))
	Story.reset()
	main.load_floor(15)
	await get_tree().physics_frame
	world = main.current_floor
	_check("floor 15: it's cold, and there are fires", not world.hazard.is_empty() and world.heat_spots.size() > 10, str(world.heat_spots.size()))
	var player: Player = main.player
	var far := world.heat_spots[1] + Vector3(60, 0, 0)
	player.global_position = world.lift(far) + Vector3.UP
	for i in 30:
		world._hazard_tick(1.0)
	_check("away from heat, the warmth drains", float(Combat.hazard.value) < 90.0, str(Combat.hazard))
	player.global_position = world.lift(world.heat_spots[1]) + Vector3.UP
	for i in 5:
		world._hazard_tick(1.0)
	_check("by a fire it comes back", float(Combat.hazard.value) > 90.0, str(Combat.hazard))
	Combat.heal_full()
	Story.reset()


## Getting round fast: the travel map puts you where you clicked, and flying goes through walls and up.
func _getting_around() -> void:
	var main: Node = get_parent()
	main.load_floor(14)
	await get_tree().physics_frame
	var player: Player = main.player
	main._travel_to(Vector3(120, 0, -80))
	await get_tree().physics_frame
	_check("the travel map takes you where you click", Vector2(player.global_position.x - 120.0, player.global_position.z + 80.0).length() < 1.0, str(player.global_position))
	player.set_flying(true)
	var y := player.global_position.y
	Input.action_press("jump")
	for i in 30:
		await get_tree().physics_frame
	Input.action_release("jump")
	_check("flying goes up", player.global_position.y > y + 3.0, "%.1f -> %.1f" % [y, player.global_position.y])
	player.set_flying(false)
	_check("landing turns walls back on", player.collision_mask == 1 and not Combat.peaceful)
	Combat.peaceful = true
	# the wild: hundreds of packs planned, more deeper down, and only the near ones actually there
	var world: FloorWorld = main.current_floor
	var counts := []
	for n: int in [1, 4, 10, 18]:
		main.load_floor(n)
		await get_tree().physics_frame
		counts.append(main.current_floor.wild.total())
	_check("hundreds of wild monsters, more the deeper you go", counts[0] >= 200 and counts[1] > counts[0] and counts[3] > counts[2] and counts[3] >= 3000, str(counts))
	world = main.current_floor
	var pack: Dictionary = world.wild.packs[world.wild.packs.size() / 2]
	var before := Combat.mobs.size()
	# packs come in two at a time, nearest first, so give it a few checks
	for i in 12:
		world.wild.tick(pack.pos)
	_check("a pack comes in when you get near it", pack.active and pack.mobs.size() > 0 and Combat.mobs.size() > before, "%d mobs" % pack.mobs.size())
	world.wild.tick(pack.pos + Vector3(400, 0, 0))
	_check("and goes when you leave", not pack.active and pack.mobs.is_empty())
