class_name TravelMap
extends Control
## The travel map (M): the whole floor from above, everything named on it, and a click anywhere to go there.
## A tester's tool for getting round the big floors fast; quest targets you're on right now are starred.

signal travel(to: Vector3)

const KINDS := {
	"hub": [Color("#7affb0"), "Hub"], "stairs": [Color("#5aff7a"), "Way down"], "camp": [Color("#ff5a48"), "Boss camp"],
	"chamber": [Color("#ff2a6a"), "Grand chamber"], "lesser_chamber": [Color("#ff7aa8"), "Chamber"], "landmark": [Color("#ffd23a"), "Landmark"],
	"grand": [Color("#c89aff"), "Great building"], "tower": [Color("#9ad0ff"), "Tower"], "crew": [Color("#7ad8ff"), "Contestants"],
	"secret": [Color("#ffffff"), "Secret"], "summit": [Color("#b8b0a0"), "Summit"], "village": [Color("#a8ffcf"), "Village"],
	"quest": [Color("#ffe14a"), "Quest target"], "outpost": [Color("#a04a40"), "Outpost"],
}

var world: FloorWorld
var player: Node3D
var _marks: Array = []   # { pos: Vector3, kind, name }
var _hover := -1
var _font: Font


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	_font = ThemeDB.fallback_font
	visible = false


func open(floor_world: FloorWorld, who: Node3D) -> void:
	world = floor_world
	player = who
	_collect()
	visible = true
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	queue_redraw()


func close() -> void:
	visible = false
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _collect() -> void:
	_marks.clear()
	_marks.append({ "pos": world.spawn, "kind": "hub", "name": str(world.data.get("hub_name", "Hub")) })
	if world.data.has("stairs"):
		_marks.append({ "pos": Vector3(world.data.stairs.x, 0, world.data.stairs.z), "kind": "stairs", "name": "Way down" })
	for item: Dictionary in world.interactables:
		if item.has("to"):
			_marks.append({ "pos": item.pos, "kind": "stairs", "name": "Way down" })
		elif item.has("step") and Story.step_open(str(item.step[0]), int(item.step[1])):
			_marks.append({ "pos": item.pos, "kind": "quest", "name": str(Story.quests_def[str(item.step[0])].name) })
	for p: Dictionary in world.quest_places:
		var id := str(p.name).trim_prefix("qs_")
		for qid: String in Story.quests:
			if id.begins_with(qid + "_") and Story.state(qid) == "active" and not Story._visited.has(p.name):
				_marks.append({ "pos": p.pos, "kind": "quest", "name": str(Story.quests_def[qid].name) })
	for c: Dictionary in world.data.get("camps", []):
		_marks.append({ "pos": Vector3(c.x, 0, c.z), "kind": "camp", "name": str(c.name) })
	for l: Dictionary in world.data.get("landmarks", []):
		_marks.append({ "pos": Vector3(l.x, 0, l.z), "kind": "landmark", "name": str(l.name) })
	for v: Dictionary in world.data.get("villages", []):
		_marks.append({ "pos": Vector3(v.x, 0, v.z), "kind": "village", "name": str(v.name) })
	for pt: Dictionary in world.points:
		if KINDS.has(pt.kind):
			_marks.append({ "pos": Vector3(pt.x, 0, pt.z), "kind": str(pt.kind), "name": str(pt.name) })


## The map square: as big as the screen allows, centred.
func _frame() -> Rect2:
	var s := get_viewport_rect().size
	var side := minf(s.x - 360.0, s.y - 80.0)
	return Rect2(Vector2((s.x - 300.0 - side) / 2.0, (s.y - side) / 2.0), Vector2(side, side))


func _to_screen(p: Vector3) -> Vector2:
	var r := _frame()
	var half := world.world_size / 2.0
	return r.position + Vector2((p.x + half) / world.world_size, (p.z + half) / world.world_size) * r.size


func _to_world(at: Vector2) -> Vector3:
	var r := _frame()
	var t := (at - r.position) / r.size
	return Vector3(t.x * world.world_size - world.world_size / 2.0, 0, t.y * world.world_size - world.world_size / 2.0)


func _draw() -> void:
	if world == null:
		return
	draw_rect(Rect2(Vector2.ZERO, get_viewport_rect().size), Color(0.02, 0.03, 0.05, 0.92))
	var r := _frame()
	draw_rect(r, Color("#151a22"))
	draw_rect(r, Color("#5a6470"), false, 2.0)
	# a faint 100 m grid
	var half := world.world_size / 2.0
	var g := -half + 100.0
	while g < half:
		draw_line(_to_screen(Vector3(g, 0, -half)), _to_screen(Vector3(g, 0, half)), Color(1, 1, 1, 0.05))
		draw_line(_to_screen(Vector3(-half, 0, g)), _to_screen(Vector3(half, 0, g)), Color(1, 1, 1, 0.05))
		g += 100.0
	for i in _marks.size():
		var m: Dictionary = _marks[i]
		var at := _to_screen(m.pos)
		var col: Color = KINDS[m.kind][0]
		var big: bool = m.kind in ["hub", "stairs", "camp", "chamber", "quest"]
		var rad := 7.0 if big else (3.0 if m.kind == "outpost" else 5.0)
		if m.kind == "quest":
			_star(at, 11.0, col)
		else:
			draw_circle(at, rad + 1.5, Color.BLACK)
			draw_circle(at, rad, col)
		if big or i == _hover or m.kind in ["landmark", "lesser_chamber", "grand"]:
			var label := str(m.name)
			var size := 14 if i == _hover else 12
			# near the right edge, the name goes on the left of its dot so it stays on the map
			var width := _font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
			var where := at + Vector2(10, 5) if at.x + 10.0 + width < r.end.x - 4.0 else at + Vector2(-10.0 - width, 5)
			draw_string_outline(_font, where, label, HORIZONTAL_ALIGNMENT_LEFT, -1, size, 4, Color.BLACK)
			draw_string(_font, where, label, HORIZONTAL_ALIGNMENT_LEFT, -1, size, col.lightened(0.2) if i == _hover else col)
	# you
	if player:
		var me := _to_screen(player.global_position)
		var yaw: float = player.get("yaw") if "yaw" in player else 0.0
		var fwd := Vector2(-sin(yaw), -cos(yaw))
		var side := Vector2(-fwd.y, fwd.x)
		draw_colored_polygon(PackedVector2Array([me + fwd * 14.0, me - fwd * 8.0 + side * 8.0, me - fwd * 8.0 - side * 8.0]), Color("#ffffff"))
	# the key, and what to do
	var kx := r.end.x + 30.0
	var ky := r.position.y + 10.0
	draw_string(_font, Vector2(kx, ky + 14), "%s" % str(world.data.get("name", "")), HORIZONTAL_ALIGNMENT_LEFT, 280, 16, Color.WHITE)
	ky += 40.0
	for kind: String in KINDS:
		draw_circle(Vector2(kx + 6, ky - 4), 5.0, KINDS[kind][0])
		draw_string(_font, Vector2(kx + 18, ky), str(KINDS[kind][1]), HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color("#cfd6dd"))
		ky += 20.0
	ky += 16.0
	for line: String in ["Click anywhere: go there", "M or Esc: close", "F1: fly (Shift fast, Space up, C down)", "PgUp / PgDn: next / previous floor"]:
		draw_string(_font, Vector2(kx, ky), line, HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color("#9aa4ae"))
		ky += 20.0
	if _hover >= 0:
		var m: Dictionary = _marks[_hover]
		draw_string(_font, Vector2(kx, ky + 20), "%s (%s)" % [m.name, KINDS[m.kind][1]], HORIZONTAL_ALIGNMENT_LEFT, 280, 14, Color.WHITE)


func _star(at: Vector2, rad: float, col: Color) -> void:
	var pts := PackedVector2Array()
	for k in 10:
		var a := -PI / 2.0 + k * PI / 5.0
		pts.append(at + Vector2(cos(a), sin(a)) * (rad if k % 2 == 0 else rad * 0.45))
	draw_colored_polygon(pts, Color.BLACK)
	var inner := PackedVector2Array()
	for p: Vector2 in pts:
		inner.append(at + (p - at) * 0.8)
	draw_colored_polygon(inner, col)


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		var best := -1
		var best_d := 12.0
		for i in _marks.size():
			var d := _to_screen(_marks[i].pos).distance_to(event.position)
			if d < best_d:
				best_d = d
				best = i
		if best != _hover:
			_hover = best
			queue_redraw()
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var to: Vector3 = _marks[_hover].pos if _hover >= 0 else _to_world(event.position)
		if _frame().has_point(event.position) or _hover >= 0:
			# land a little off the spot, so you're beside the thing and not inside it
			travel.emit(to + (Vector3(4, 0, 4) if _hover >= 0 else Vector3.ZERO))
			close()
