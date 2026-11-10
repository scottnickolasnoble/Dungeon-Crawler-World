class_name StoryHud
extends Control
## The quest tracker (top right) and the marks over people's heads: a yellow ! for someone with work for you,
## a ? for someone waiting on a quest you've finished.

var interactables: Callable
var _tracker: VBoxContainer
var _font: Font


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_font = get_theme_default_font()
	_tracker = VBoxContainer.new()
	_tracker.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	_tracker.offset_left = -380
	_tracker.offset_right = -20
	_tracker.offset_top = 20
	_tracker.offset_bottom = 30
	_tracker.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_tracker)
	Story.changed.connect(_rebuild)
	_rebuild()


func _rebuild() -> void:
	for child in _tracker.get_children():
		child.queue_free()
	var shown := 0
	for q: Dictionary in Story.tracker_lines():
		if shown >= 4:
			break
		shown += 1
		var title := _line(("★ " if q.main else "") + str(q.name) + ("  · hand in" if q.ready else ""), 17, Color("#f5c518") if q.main else Color("#7be38a"))
		_tracker.add_child(title)
		for l: Array in q.lines:
			_tracker.add_child(_line(("   ✔ " if l[0] else "   – ") + str(l[1]), 14, Color(0.6, 0.65, 0.6) if l[0] else Color.WHITE))


func _line(text: String, font_size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.custom_minimum_size = Vector2(360, 0)
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	label.add_theme_color_override("font_outline_color", Color.BLACK)
	label.add_theme_constant_override("outline_size", 5)
	return label


func _process(_delta: float) -> void:
	queue_redraw()


func _draw() -> void:
	var cam := get_viewport().get_camera_3d()
	if cam == null or Combat.player == null or not interactables.is_valid():
		return
	var me: Vector3 = Combat.player.global_position
	for item: Dictionary in interactables.call():
		if not item.has("talk"):
			continue
		var mark := Story.marker(item.talk)
		if mark == "":
			continue
		var top: Vector3 = item.pos + Vector3.UP * 2.7
		if top.distance_to(me) > 45.0 or cam.is_position_behind(top):
			continue
		var at := cam.unproject_position(top)
		var size := _font.get_string_size(mark, HORIZONTAL_ALIGNMENT_LEFT, -1, 40)
		draw_string_outline(_font, at - Vector2(size.x / 2.0, 0), mark, HORIZONTAL_ALIGNMENT_LEFT, -1, 40, 8, Color.BLACK)
		draw_string(_font, at - Vector2(size.x / 2.0, 0), mark, HORIZONTAL_ALIGNMENT_LEFT, -1, 40, Color("#f5c518") if mark == "!" else Color("#7be38a"))
