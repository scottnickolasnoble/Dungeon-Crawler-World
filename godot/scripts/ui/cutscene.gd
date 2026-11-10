class_name DiscoveryCutscene
extends Control
## The first time you see a new monster, boss or race: the game stops, black bars slide in, a camera circles the
## creature, its name lands in big comic letters, and Nigel Bramble-Hogg, the Network's wildlife correspondent, tells
## you its whole filthy story (data/discoveries.json). Space, E or a click for the next line; Esc skips it.

signal finished

const COMIC_FONT := preload("res://fonts/Bangers-Regular.ttf")
const TYPE_SPEED := 55.0

var playing := false
var _lines: Array = []
var _line := 0
var _shown := 0.0
var _top: ColorRect
var _bottom: ColorRect
var _title: Label
var _sub: Label
var _narrator: Label
var _text: Label
var _hint: Label
var _cam: Camera3D
var _old_cam: Camera3D
var _target := Vector3.ZERO
var _radius := 6.0
var _height := 2.0
var _angle := 0.0
var _clock := 0.0


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_top = _bar(Control.PRESET_TOP_WIDE)
	_bottom = _bar(Control.PRESET_BOTTOM_WIDE)
	_title = _label(72, Color("#ffe23a"), COMIC_FONT)
	_title.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	_title.offset_top = 40
	_title.offset_bottom = 130
	_sub = _label(22, Color("#f4e8c8"))
	_sub.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	_sub.offset_top = 128
	_sub.offset_bottom = 164
	_narrator = _label(16, Color("#c8a8ff"))
	_narrator.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	_narrator.offset_top = -190
	_narrator.offset_bottom = -166
	_text = _label(21, Color.WHITE)
	_text.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	_text.offset_left = 120
	_text.offset_right = -120
	_text.offset_top = -164
	_text.offset_bottom = -40
	_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_text.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	_hint = _label(14, Color(1, 1, 1, 0.6))
	_hint.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	_hint.offset_top = -34
	_hint.offset_bottom = -12
	_hint.text = "SPACE / E: next      ESC: skip"
	visible = false


## Plays one entry: { title, sub, lines }, circling a point in the world.
func play(entry: Dictionary, target: Vector3, size := 2.0) -> void:
	if playing:
		return
	playing = true
	visible = true
	_lines = entry.get("lines", [])
	_line = 0
	_title.text = str(entry.get("title", "")).to_upper()
	_sub.text = str(entry.get("sub", ""))
	_narrator.text = str(Story.discoveries.get("narrator", "")).to_upper()
	_target = target
	_height = maxf(1.2, size * 0.6)
	_radius = clampf(size * 2.4, 4.0, 22.0)
	_angle = 0.0
	_clock = 0.0
	_old_cam = get_viewport().get_camera_3d()
	_cam = Camera3D.new()
	_cam.fov = 55.0
	get_tree().current_scene.add_child(_cam)
	_cam.make_current()
	_place_camera(0.0)
	get_tree().paused = true
	_show_line()


func _show_line() -> void:
	if _line >= _lines.size():
		_finish()
		return
	_text.text = str(_lines[_line])
	_text.visible_characters = 0
	_shown = 0.0


func _finish() -> void:
	playing = false
	visible = false
	get_tree().paused = false
	if is_instance_valid(_old_cam):
		_old_cam.make_current()
	if is_instance_valid(_cam):
		_cam.queue_free()
	finished.emit()


## Moves on: finishes the typing first, then the next line.
func advance() -> void:
	if not playing:
		return
	if _text.visible_characters >= 0:
		_text.visible_characters = -1
	else:
		_line += 1
		_show_line()


func skip() -> void:
	if playing:
		_finish()


func _place_camera(delta: float) -> void:
	_angle += delta * 0.18
	var p := _target + Vector3(sin(_angle) * _radius, _height + _radius * 0.25, cos(_angle) * _radius)
	_cam.global_position = p
	_cam.look_at(_target + Vector3.UP * _height * 0.8, Vector3.UP)


func _process(delta: float) -> void:
	if not playing:
		return
	_clock += delta
	var bars := minf(1.0, _clock * 2.5) * 110.0
	_top.offset_bottom = bars
	_bottom.offset_top = -bars
	_title.modulate.a = clampf((_clock - 0.3) * 2.0, 0.0, 1.0)
	_sub.modulate.a = _title.modulate.a
	_place_camera(delta)
	if _text.visible_characters >= 0:
		_shown += delta * TYPE_SPEED
		_text.visible_characters = int(_shown)
		if _shown >= _text.text.length():
			_text.visible_characters = -1


func _unhandled_input(event: InputEvent) -> void:
	if not playing:
		return
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_ESCAPE:
			skip()
		elif event.keycode in [KEY_SPACE, KEY_E, KEY_ENTER]:
			advance()
		get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton and event.pressed:
		advance()
		get_viewport().set_input_as_handled()


func _bar(preset: int) -> ColorRect:
	var bar := ColorRect.new()
	bar.color = Color.BLACK
	bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bar.set_anchors_preset(preset)
	bar.offset_top = 0
	bar.offset_bottom = 0
	add_child(bar)
	return bar


func _label(size: int, colour: Color, font: Font = null) -> Label:
	var label := Label.new()
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", colour)
	label.add_theme_color_override("font_outline_color", Color.BLACK)
	label.add_theme_constant_override("outline_size", 10 if font else 6)
	if font:
		label.add_theme_font_override("font", font)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(label)
	return label
