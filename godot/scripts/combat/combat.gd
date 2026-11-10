extends Node
## The fight rules, shared by the player and every monster: the player's vitals and level, who is alive, damage both
## ways, and experience. Numbers are the prototype's (game/play.js hurtMob, hitPlayer, killMob, gainXP; game/combat.js swing).
## Autoloaded as Combat.

signal player_hurt(amount: float, result: String)
signal player_died
signal mob_killed(mob: Node)
signal group_cleared(group: String)
signal levelled_up(level: int)
signal notice(text: String, color: Color)

## The Lead Pipe, a blunt weapon (data.js WTYPES.blunt and STARTER.main).
const PIPE_DAMAGE := 7.0
const REACH := 2.6
const ARC := 1.6
const MAX_HITS := 3
const STAGGER_CHANCE := 0.25
const LIGHT_COOLDOWN := 0.62
const HEAVY_COOLDOWN := 1.25
const HEAVY_STAMINA := 12.0
const PARRY_WINDOW := 0.35
const DODGE_COST := 20.0

## When true, monsters never start a fight (used by the floor checks so walking tests are not ambushed).
var peaceful := false
## Camps (by group) that have a truce with you: they won't start a fight.
var truce_groups: Dictionary = {}
var player: Node3D
var mobs: Array = []
var level := 1
var xp := 0
var xp_next := xp_for(1)
var gold := 0
## Seconds the player is held fast (clamped, grabbed): no moving, jumping or dodging.
var held := 0.0
## Seconds the player is slowed (wading through something sticky).
var slowed := 0.0
var kills := 0
## Starting stats plus the Bathrobe's CON (play.js state.base).
var stats := { "STR": 9, "DEX": 9, "CON": 11, "INT": 8, "WIS": 8, "CHA": 8 }
var hp := 0.0
## What's around and fighting, for the HUD's boss bar.
var boss: Node = null
## Kills this run, by kind, for quests and (later) monster lore.
var killed_kinds: Dictionary = {}
var parry_at := -9.0
var dodge_at := -9.0
var blocking := false
var _wake_clock := 0.0


func _ready() -> void:
	hp = max_hp() * 0.85


static func xp_for(lv: int) -> int:
	return roundi(80 * lv * lv + 120 * lv)


func max_hp() -> float:
	return 60.0 + stats.CON * 8.0


func weapon_damage() -> float:
	return PIPE_DAMAGE + stats.STR * 0.7 + PIPE_DAMAGE * 0.3


func crit_chance() -> float:
	return 5.0 + floorf(stats.DEX / 3.0)


func now() -> float:
	return Time.get_ticks_msec() / 1000.0


func register(mob: Node) -> void:
	mobs.append(mob)


func forget_floor() -> void:
	mobs.clear()
	floaters.clear()
	boss = null


func alive_in(group: String) -> int:
	var n := 0
	for m: Node in mobs:
		if is_instance_valid(m) and m.group == group and not m.dead:
			n += 1
	return n


## Only monsters near the player think; the rest stand still and cost nothing.
func _process(delta: float) -> void:
	_wake_clock -= delta
	if _wake_clock > 0.0 or player == null:
		return
	_wake_clock = 0.3
	var at := player.global_position
	for m: Node in mobs:
		if is_instance_valid(m) and not m.dead:
			m.set_awake(m.global_position.distance_squared_to(at) < 90.0 * 90.0)


# ---------------------------------------------------------------- the player hitting things
## A swing from the player: everything in front, inside the pipe's reach and arc, takes the hit (combat.js swing).
func player_swing(heavy: bool) -> int:
	if player == null:
		return 0
	var reach := REACH + (0.4 if heavy else 0.0)
	var arc := ARC + (0.3 if heavy else 0.0)
	var cap := MAX_HITS + (1 if heavy else 0)
	var forward: Vector3 = -player.camera.global_transform.basis.z
	var flat := Vector2(forward.x, forward.z).normalized()
	var from: Vector3 = player.global_position
	var targets: Array = []
	for m: Node in mobs:
		if not is_instance_valid(m) or m.dead or not m.awake:
			continue
		var to: Vector3 = m.global_position - from
		if absf(to.y) > 3.0:
			continue
		var d := Vector2(to.x, to.z)
		var dist: float = d.length() - m.radius
		if dist > reach:
			continue
		if dist > 0.4 and absf(flat.angle_to(d.normalized())) > arc / 2.0:
			continue
		targets.append([dist, m])
	targets.sort_custom(func(a: Array, b: Array) -> bool: return a[0] < b[0])
	var n := 0
	for pair: Array in targets:
		if n >= cap:
			break
		var m: Node = pair[1]
		n += 1
		hurt_mob(m, weapon_damage() * (2.2 if heavy else 1.0) * randf_range(0.9, 1.1), heavy, n == 1)
		if randf() < STAGGER_CHANCE + (0.3 if heavy else 0.0):
			m.stun(0.9 if heavy else 0.5)
	return n


func hurt_mob(m: Node, dmg: float, heavy := false, loud := false) -> void:
	if m.dead:
		return
	var staggered: bool = m.state == "stagger"
	var crit := randf() * 100.0 < crit_chance() or staggered
	var diff: int = m.level - level
	var mult := clampf(1.0 - diff * 0.08, 0.35, 1.3) * (1.5 if staggered else 1.0)
	var d := maxi(1, roundi(dmg * mult * (1.8 if crit else 1.0) * randf_range(0.9, 1.1)))
	var label := ("CRIT %d" if crit else "%d") % d
	_float(m.global_position + Vector3.UP * m.height * 1.05, label, Color("#ffd23a") if crit else Color.WHITE)
	if loud:
		var word: String = ("POW!" if crit else (HEAVY_WORDS if heavy else HIT_WORDS).pick_random())
		sfx(m.global_position + Vector3.UP * m.height * 0.6, word, Color("#ffe23a") if not crit else Color("#ff5a3a"))
	if m.def.get("passive", false):
		m.flinch()
		Story.count("dummyHits")
		return
	m.take(d)
	if m.hp <= 0:
		_kill(m)


func _kill(m: Node) -> void:
	m.die()
	kills += 1
	killed_kinds[m.kind] = int(killed_kinds.get(m.kind, 0)) + 1
	var diff: int = m.level - level
	var mul := maxf(0.05, 1.0 + diff * 0.15) if diff < 0 else minf(1.25, 1.0 + diff * 0.05)
	var gained := maxi(1, roundi(float(m.def.get("xp", 10)) * (1.0 + 0.4 * (m.level - 1)) * mul * (0.3 if m.summoned else 1.0)))
	_float(m.global_position + Vector3.UP * (m.height + 0.4), "+%d XP" % gained, Color("#7be3ff"))
	gold += (120 if m.def.get("boss", false) else 2) + randi() % 6 * m.level
	gain_xp(gained)
	if kills == 1:
		notice.emit("Your first kill on camera! Our legal team has been notified.", Color("#ffcc33"))
	if m.def.get("boss", false):
		notice.emit("%s IS DOWN" % str(m.def.name).to_upper(), Color("#ff5a3a"))
		if boss == m:
			boss = null
	mob_killed.emit(m)
	if m.group != "" and alive_in(m.group) == 0:
		group_cleared.emit(m.group)


func gain_xp(n: int) -> void:
	xp += n
	while xp >= xp_next:
		xp -= xp_next
		level += 1
		xp_next = xp_for(level)
		# Until the stat screen arrives, a level puts a point into strength and one into constitution.
		stats.STR += 1
		stats.CON += 1
		hp = max_hp()
		levelled_up.emit(level)


# ---------------------------------------------------------------- things hitting the player
## A monster's hit landing on the player (play.js hitPlayer). Area attacks can't be parried or blocked.
func hit_player(raw: float, m: Node, area := false) -> String:
	if player == null or hp <= 0.0:
		return "none"
	var t := now()
	var head: Vector3 = player.global_position + Vector3.UP * 1.6
	if t - dodge_at < 0.35:
		sfx(head + Vector3.UP * 0.3, "WHOOSH!", Color("#9be7ff"))
		return "dodged"
	if not area and t - parry_at < PARRY_WINDOW:
		sfx(head + Vector3.UP * 0.3, "KLANG!", Color("#ffb040"))
		if m and not m.dead:
			m.stun(1.2)
		player_hurt.emit(0.0, "parried")
		return "parried"
	var diff: int = (m.level if m else level) - level
	var dmg := raw * maxf(0.6, 1.0 + diff * 0.12) * (1.0 - minf(0.6, 2.0 / 200.0))
	var result := "hit"
	if blocking and not area and player.stamina > 5.0:
		dmg *= 0.35
		player.stamina = maxf(0.0, player.stamina - 18.0)
		result = "blocked"
	hp -= dmg
	player_hurt.emit(dmg, result)
	if hp <= 0.0:
		hp = 0.0
		player_died.emit()
	return result


func heal_full() -> void:
	hp = max_hp()


# ---------------------------------------------------------------- floating numbers, drawn by the HUD
var floaters: Array = []
## The floor's hazard meter, drawn by the HUD: { label, value (0-100), color }, or empty. FloorWorld fills it in.
var hazard: Dictionary = {}
## The words that burst off a hit, like a comic panel.
const HIT_WORDS := ["WHAM!", "BONK!", "THWACK!", "SMACK!", "CLONK!", "THUD!"]
const HEAVY_WORDS := ["KRAKOOM!", "BLAM!", "KA-POW!", "CRUNCH!"]


## A sound-effect word, big and tilted, that pops in and fades fast.
func sfx(at: Vector3, word: String, color: Color) -> void:
	floaters.append({ "pos": at, "text": word, "color": color, "age": 0.0, "big": true, "tilt": randf_range(-0.32, 0.32) })



func _float(at: Vector3, text: String, color: Color) -> void:
	floaters.append({ "pos": at + Vector3(randf_range(-0.3, 0.3), 0, randf_range(-0.3, 0.3)), "text": text, "color": color, "age": 0.0 })


# ---------------------------------------------------------------- speech bubbles, drawn by the HUD
## Someone saying something out loud: a white comic bubble over their head for a few seconds.
## { node, text, age, life, height }
var speech: Array = []


func say(who: Node3D, text: String, seconds := 3.2, height := 2.0) -> void:
	if who == null or not is_instance_valid(who):
		return
	# one bubble each: a new line replaces the old one
	speech = speech.filter(func(s: Dictionary) -> bool: return s.node != who)
	speech.append({ "node": who, "text": text, "age": 0.0, "life": seconds, "height": height })
