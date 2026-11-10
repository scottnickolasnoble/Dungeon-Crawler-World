class_name DialogueBox
extends PanelContainer
## A conversation on screen: who's talking, what they say (typed out), and numbered choices.
## Click a choice or press its number; Esc or the last choice leaves. Conversations come from data/dialogue.json
## through Story, so the same box serves people, signs, machines and dead contestants' bracelets.

signal closed

const TYPE_SPEED := 70.0

var npc := ""
var _tree: Dictionary = {}
var _name: Label
var _text: Label
var _choices: VBoxContainer
var _shown := 0.0


func _ready() -> void:
	set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	custom_minimum_size = Vector2(860, 0)
	offset_left = -430
	offset_right = 430
	offset_top = -300
	offset_bottom = -40
	grow_vertical = Control.GROW_DIRECTION_BEGIN
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.07, 0.06, 0.08, 0.92)
	style.border_color = Color("#f5c518")
	style.set_border_width_all(3)
	style.set_corner_radius_all(6)
	style.set_content_margin_all(18)
	add_theme_stylebox_override("panel", style)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 10)
	add_child(column)
	_name = Label.new()
	_name.add_theme_font_size_override("font_size", 22)
	_name.add_theme_color_override("font_color", Color("#f5c518"))
	column.add_child(_name)
	_text = Label.new()
	_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_text.custom_minimum_size = Vector2(820, 0)
	_text.add_theme_font_size_override("font_size", 18)
	column.add_child(_text)
	_choices = VBoxContainer.new()
	column.add_child(_choices)
	visible = false


func is_open() -> bool:
	return visible


## Starts a conversation. Returns false if there's nothing to say.
func open(id: String) -> bool:
	_tree = Story.dialogue.get(id, {})
	if _tree.is_empty():
		return false
	npc = id
	for entry: Dictionary in _tree.get("start", []):
		if Story.check(entry.get("if", "")):
			visible = true
			_name.text = str(_tree.get("name", id)).to_upper()
			_show(entry.go)
			return true
	return false


func close() -> void:
	visible = false
	npc = ""
	closed.emit()


func _show(node_id: String) -> void:
	var node: Dictionary = _tree.nodes.get(node_id, {})
	if node.is_empty():
		close()
		return
	_text.text = node.text
	_text.visible_characters = 0
	_shown = 0.0
	for child in _choices.get_children():
		child.queue_free()
	var n := 0
	for choice: Dictionary in node.get("choices", []):
		if not Story.check(choice.get("if", "")):
			continue
		n += 1
		var button := Button.new()
		var label: String = choice.text
		if choice.has("check"):
			var stat: String = choice.check.stat
			label += "   (your %s: %d)" % [stat, int(Combat.stats.get(stat, 0))]
		button.text = "%d.  %s" % [n, label]
		button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		button.flat = true
		button.add_theme_font_size_override("font_size", 17)
		button.add_theme_color_override("font_hover_color", Color("#f5c518"))
		button.pressed.connect(_pick.bind(choice))
		_choices.add_child(button)
	if n == 0:
		var button := Button.new()
		button.text = "1.  Leave."
		button.flat = true
		button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		button.pressed.connect(close)
		_choices.add_child(button)


func _pick(choice: Dictionary) -> void:
	for action: String in choice.get("do", []):
		Story.act(action)
	var next := ""
	if choice.has("check"):
		var c: Dictionary = choice.check
		next = c.pass if int(Combat.stats.get(c.stat, 0)) >= int(c.dc) else c.fail
	else:
		next = choice.get("go", "")
	if next == "" or not visible:
		close()
	else:
		_show(next)


## Picks the choice with this number (1 is the first), as if it were clicked.
func pick_number(n: int) -> void:
	var buttons := _choices.get_children().filter(func(b: Node) -> bool: return not b.is_queued_for_deletion())
	if n >= 1 and n <= buttons.size():
		(buttons[n - 1] as Button).pressed.emit()


func _process(delta: float) -> void:
	if visible and _text.visible_characters >= 0:
		_shown += delta * TYPE_SPEED
		_text.visible_characters = int(_shown)
		if _shown >= _text.text.length():
			_text.visible_characters = -1


func _unhandled_input(event: InputEvent) -> void:
	if not visible:
		return
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode >= KEY_1 and event.keycode <= KEY_9:
			# the first press finishes the typing, the next one picks
			if _text.visible_characters >= 0:
				_text.visible_characters = -1
			else:
				pick_number(event.keycode - KEY_0)
			get_viewport().set_input_as_handled()
		elif event.keycode == KEY_ESCAPE:
			close()
			get_viewport().set_input_as_handled()
