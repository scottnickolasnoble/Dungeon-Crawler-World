extends Node
## Clamp, the Wheel-Clamper's arena tricks (Floor 1, the Ticket Hall).
##  - PAY AND DISPLAY: three ticket machines stand round the hall. Paying one (E) stuns him: nobody has ever paid.
##  - TOW-AWAY ZONE: at half health he roars, the hall goes amber, and wheel clamps start snapping shut under you.
## Lives on the boss, so it goes when he does.

const MACHINE_COST := 10
const STUN := 4.0
const TRAP_EVERY := 5.0
const TRAP_WARN := 1.2
const TRAP_R := 1.7

var chamber: Node3D
var boss: Mob
var _machines: Array[Dictionary] = []
var _meshes: Array[Node3D] = []
var _phase_two := false
var _trap_clock := 3.0
var _traps: Array[Dictionary] = []
var _light: OmniLight3D


func begin(on: Node3D, who: Mob) -> void:
	chamber = on
	boss = who
	var half: float = chamber.get("half")
	var centre: Vector3 = chamber.global_position
	var floor_y: float = chamber.get("floor_y")
	var interactables: Variant = _interactables()
	for i in 3:
		# round the hall, well away from the door and the dais
		var a := -PI * 0.5 + (i - 1) * 1.15
		var at := centre + Vector3(cos(a), 0, sin(a)) * (half - 5.0)
		at.y = centre.y + floor_y
		var flag := "clamp_paid_%d" % i
		Story.set_flag(flag, false)
		var item := { "pos": Vector3(at.x, 0, at.z), "r": 2.8, "text": "Press E: pay the fine (%d gold)" % MACHINE_COST,
			"act": ["flag:" + flag], "once": true }
		_machines.append({ "flag": flag, "item": item, "paid": false })
		if interactables is Array:
			interactables.append(item)
		_meshes.append(_machine_mesh(at))


func _interactables() -> Variant:
	var main := get_tree().current_scene
	var floor_node: Variant = main.get("current_floor") if main else null
	return floor_node.get("interactables") if floor_node else null


## A squat yellow pay-and-display machine with a lit screen and a sign.
func _machine_mesh(at: Vector3) -> Node3D:
	var root := Node3D.new()
	chamber.get_parent().add_child(root)
	root.global_position = at
	var box := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = Vector3(0.9, 1.7, 0.6)
	box.mesh = mesh
	box.position.y = 0.85
	box.material_override = Models.toon(Color("#f2c21b"))
	root.add_child(box)
	var screen := MeshInstance3D.new()
	var face := BoxMesh.new()
	face.size = Vector3(0.6, 0.35, 0.05)
	screen.mesh = face
	screen.position = Vector3(0, 1.3, 0.32)
	var glow := StandardMaterial3D.new()
	glow.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	glow.albedo_color = Color("#7cff9a")
	screen.material_override = glow
	root.add_child(screen)
	var sign := Label3D.new()
	sign.text = "PAY HERE"
	sign.font_size = 64
	sign.outline_size = 12
	sign.modulate = Color("#ffef9a")
	sign.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	sign.position.y = 2.2
	root.add_child(sign)
	# face the middle of the hall
	var to := chamber.global_position - at
	root.rotation.y = atan2(to.x, to.z)
	return root


func _process(delta: float) -> void:
	if boss == null or not is_instance_valid(boss) or boss.dead:
		_clean_up()
		return
	for m: Dictionary in _machines:
		if not m.paid and Story.flag(m.flag):
			m.paid = true
			_paid(m)
	if not _phase_two and boss.hp < boss.max_hp * 0.5:
		_tow_away()
	if _phase_two:
		_tick_traps(delta)


func _paid(m: Dictionary) -> void:
	if Combat.gold < MACHINE_COST:
		# no money: the machine eats nothing, and you can try again once you've some gold
		m.paid = false
		m.item.used = false
		Story.set_flag(m.flag, false)
		Combat.notice.emit("NOT ENOUGH GOLD · The machine blinks: INSERT COINS", Color("#cfd6dd"))
		return
	Combat.gold -= MACHINE_COST
	boss.stun(STUN)
	Combat.say(boss, ["You... PAID? Nobody PAYS!", "That's... that's not ALLOWED.", "A RECEIPT? For ME?"][_paid_count() - 1], 2.6, boss.life._head_height() if boss.life else 3.4)
	Combat.notice.emit("FINE PAID · Clamp is stunned with disbelief", Color("#7cff9a"))
	var idx := _machines.find(m)
	if idx >= 0 and idx < _meshes.size():
		var screen: MeshInstance3D = _meshes[idx].get_child(1)
		(screen.material_override as StandardMaterial3D).albedo_color = Color("#3a3a3a")


func _paid_count() -> int:
	return _machines.filter(func(m: Dictionary) -> bool: return m.paid).size()


## Half health: a roar, the hall turns amber, and the clamps come out.
func _tow_away() -> void:
	_phase_two = true
	if boss.life and boss.life.player and boss.life.player.has_animation("taunt"):
		boss.life.player.play("taunt", 0.2)
	Combat.say(boss, "TOW-AWAY ZONE! EVERYTHING GETS CLAMPED!", 3.0, boss.life._head_height() if boss.life else 3.4)
	_light = OmniLight3D.new()
	_light.light_color = Color("#ffae2a")
	_light.light_energy = 0.0
	_light.omni_range = chamber.get("half") * 2.2
	chamber.get_parent().add_child(_light)
	_light.global_position = chamber.global_position + Vector3.UP * 9.0
	create_tween().tween_property(_light, "light_energy", 1.1, 1.5)


## Every few seconds a clamp's outline appears where you stand; a moment later it snaps shut.
func _tick_traps(delta: float) -> void:
	_trap_clock -= delta
	if _trap_clock <= 0.0 and Combat.player:
		_trap_clock = TRAP_EVERY
		var at: Vector3 = Combat.player.global_position
		var ring := Mob._disc(TRAP_R, TAU, Color(1.0, 0.75, 0.1, 0.45))
		chamber.get_parent().add_child(ring)
		ring.global_position = at + Vector3.UP * 0.07
		_traps.append({ "at": at, "left": TRAP_WARN, "ring": ring })
	for i in range(_traps.size() - 1, -1, -1):
		var t: Dictionary = _traps[i]
		t.left -= delta
		if t.left <= 0.0:
			var p: Vector3 = Combat.player.global_position if Combat.player else Vector3.INF
			Combat.sfx(t.at + Vector3.UP * 0.8, "SNAP!", Color("#ffd23a"))
			if Vector2(p.x - t.at.x, p.z - t.at.z).length() < TRAP_R and Combat.hp > 0.0:
				Combat.hit_player(boss.dmg * 0.8, boss, true)
				Combat.held = 1.5
			t.ring.queue_free()
			_traps.remove_at(i)


func _exit_tree() -> void:
	_clean_up()


## The fight's over (won, lost or reset): the machines and anything left on the floor go.
func _clean_up() -> void:
	if _machines.is_empty() and _meshes.is_empty() and _traps.is_empty() and _light == null:
		return
	var interactables: Variant = _interactables()
	for m: Dictionary in _machines:
		if interactables is Array:
			interactables.erase(m.item)
	for n: Node3D in _meshes:
		if is_instance_valid(n):
			n.queue_free()
	for t: Dictionary in _traps:
		if is_instance_valid(t.ring):
			t.ring.queue_free()
	if _light and is_instance_valid(_light):
		_light.queue_free()
	_machines.clear()
	_meshes.clear()
	_traps.clear()
	_light = null
