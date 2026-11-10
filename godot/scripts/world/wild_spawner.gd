class_name WildSpawner
extends Node
## The wild: monster packs all over the open ground between the towns and camps, hundreds of them on the first floors
## and thousands further down, tougher the further you get from the hub.
##
## Every pack is planned when the floor is built, but only the ones near you actually exist: a pack comes in when you
## get within NEAR metres and goes again when you're past FAR (unless it's chasing you). Clear a pack and it stays
## gone for a while, then something else moves in.

const NEAR := 105.0
const FAR := 150.0
const CELL := 120.0
const RESPAWN := 480.0
## Packs brought in per check, so moving fast doesn't build fifty monsters in one frame.
const PER_TICK := 2

var world: FloorWorld
## { pos, kinds, level, n, mobs: Array, back_at: float, active: bool }
var packs: Array = []
var _cells := {}
var _clock := 0.0
var _rng := RandomNumberGenerator.new()


static func populate(floor_world: FloorWorld) -> WildSpawner:
	var w := WildSpawner.new()
	w.name = "Wild"
	w.world = floor_world
	floor_world.add_child(w)
	w._plan()
	return w


## How many, where, what and how strong.
func _plan() -> void:
	var f := world.floor_number
	_rng.seed = 9100 + f
	var kinds := _kinds()
	if kinds.is_empty():
		return
	var lo := 999
	var hi := 1
	for c: Dictionary in world.data.get("camps", []):
		var lv := str(c.get("level", "1")).get_slice(" ", 0)
		lo = mini(lo, lv.get_slice("-", 0).to_int())
		hi = maxi(hi, lv.get_slice("-", 1).to_int() if lv.contains("-") else lv.to_int())
	lo = maxi(1, mini(lo, hi))
	# packs get closer together the deeper you go: one every ~80 m on Floor 1, every ~50 m on Floor 18
	var spacing := lerpf(80.0, 50.0, clampf(float(f - 1) / 17.0, 0.0, 1.0))
	var half: float = world.world_size / 2.0 - 30.0
	var want := int(world.world_size * world.world_size / (spacing * spacing))
	var tries := want * 4
	while packs.size() < want and tries > 0:
		tries -= 1
		var at := Vector3(_rng.randf_range(-half, half), 0, _rng.randf_range(-half, half))
		var from_hub := Vector2(at.x - world.spawn.x, at.z - world.spawn.z).length()
		if from_hub < 90.0:
			continue
		if world.wilds and not world.wilds._is_open(at.x, at.z, 5.0):
			continue
		var t := clampf(from_hub / half, 0.0, 1.0)
		var pick: Array = [kinds[_rng.randi() % kinds.size()]]
		if kinds.size() > 1 and _rng.randf() < 0.3:
			pick.append(kinds[_rng.randi() % kinds.size()])
		var pack := { "pos": at, "kinds": pick, "level": int(roundf(lerpf(float(lo), float(hi), t))) + _rng.randi_range(-1, 1),
			"n": _rng.randi_range(2, 3 + f / 4), "mobs": [], "back_at": 0.0, "active": false }
		var key := _cell_of(at)
		if not _cells.has(key):
			_cells[key] = []
		_cells[key].append(packs.size())
		packs.append(pack)


## What lives out here: the floor's camp monsters (not their bosses).
func _kinds() -> Array:
	var out: Array = []
	for c: Dictionary in world.data.get("camps", []):
		var m: Variant = c.get("mob", c.get("mobs", []))
		for k: Variant in (m if m is Array else [m]):
			var kind := str(k)
			if kind != "" and not out.has(kind) and Data.monsters.monsters.has(kind) and not Data.monsters.monsters[kind].get("boss", false):
				out.append(kind)
	# monsters that live out in the wilds of a floor rather than in its camps (the trolls of the open floors)
	for k: Variant in world.data.get("roamers", []):
		if Data.monsters.monsters.has(str(k)) and not out.has(str(k)):
			out.append(str(k))
	return out


func _cell_of(at: Vector3) -> Vector2i:
	return Vector2i(floori(at.x / CELL), floori(at.z / CELL))


## How many monsters this floor holds in all.
func total() -> int:
	var n := 0
	for p: Dictionary in packs:
		n += int(p.n)
	return n


func _process(delta: float) -> void:
	_clock -= delta
	if _clock > 0.0 or Combat.player == null:
		return
	_clock = 0.4
	tick(Combat.player.global_position)


## One check: bring in the packs you're near, send away the ones you've left, and note the ones you've cleared.
func tick(at: Vector3) -> void:
	var now := Time.get_ticks_msec() / 1000.0
	var fast: bool = Combat.player and Combat.player.get("flying") and (Combat.player.velocity as Vector3).length() > 40.0
	var brought := 0
	var here := _cell_of(at)
	for dx in range(-1, 2):
		for dz in range(-1, 2):
			for i: int in _cells.get(here + Vector2i(dx, dz), []):
				var pack: Dictionary = packs[i]
				var d := Vector2(pack.pos.x - at.x, pack.pos.z - at.z).length()
				if not pack.active and d < NEAR and now >= float(pack.back_at) and brought < PER_TICK and not fast:
					_bring(i)
					brought += 1
	for i in packs.size():
		var pack: Dictionary = packs[i]
		if not pack.active:
			continue
		var alive := 0
		var chasing := false
		for m: Variant in pack.mobs:
			if is_instance_valid(m) and not m.dead:
				alive += 1
				chasing = chasing or m.state != "idle"
		if alive == 0:
			# cleared: the bodies lie a while (Mob.die hides them), then the pack's spot is empty until it refills
			pack.active = false
			pack.back_at = now + RESPAWN
			_forget(pack, 20.0)
		elif not chasing and Vector2(pack.pos.x - at.x, pack.pos.z - at.z).length() > FAR:
			pack.active = false
			_forget(pack, 0.0)


func _bring(i: int) -> void:
	var pack: Dictionary = packs[i]
	pack.active = true
	pack.mobs = []
	for k in int(pack.n):
		var kind: String = pack.kinds[k % pack.kinds.size()]
		var a := float(k) * 2.4 + float(i)
		var spot: Vector3 = pack.pos + Vector3(cos(a), 0, sin(a)) * (2.0 + float(k) * 1.3)
		var mob := world.fighter(kind, spot, a + PI, maxi(1, int(pack.level)), "wild:%d" % i)
		if mob:
			pack.mobs.append(mob)


func _forget(pack: Dictionary, after: float) -> void:
	for m: Variant in pack.mobs:
		if not is_instance_valid(m):
			continue
		Combat.mobs.erase(m)
		if after <= 0.0:
			m.queue_free()
		else:
			get_tree().create_timer(after).timeout.connect(m.queue_free)
	pack.mobs = []
