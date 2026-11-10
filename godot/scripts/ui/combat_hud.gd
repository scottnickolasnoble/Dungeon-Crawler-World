class_name CombatHud
extends Control
## The fighting part of the HUD: health, experience and level, the boss bar, a red flash when you're hurt,
## big banners (YOU DIED, LEVEL UP), the host's notices, and over the world the monsters' health bars and the
## numbers that pop off them. Built in code so the scene stays simple.

const RED := Color("#e5484d")
const DARK := Color(0, 0, 0, 0.55)

var hp_bar: ProgressBar
var hp_text: Label
var xp_bar: ProgressBar
var level_text: Label
var boss_box: Control
var boss_bar: ProgressBar
var boss_name: Label
var banner: Label
var notice_text: Label
var flash: ColorRect
var _banner_left := 0.0
var _notice_left := 0.0
var _notice_age := 0.0
var _notices: Array = []
var _font: Font
const COMIC_FONT := preload("res://fonts/Bangers-Regular.ttf")


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_font = get_theme_default_font()
	flash = ColorRect.new()
	flash.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	flash.color = Color(0.8, 0.05, 0.05, 0.0)
	flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(flash)
	hp_bar = _bar(Color("#d8343a"), Vector2(20, -66), Vector2(260, 22), Control.PRESET_BOTTOM_LEFT)
	hp_text = _label("", 14, Vector2(26, -66), Control.PRESET_BOTTOM_LEFT)
	level_text = _label("LV 1", 18, Vector2(20, -98), Control.PRESET_BOTTOM_LEFT)
	xp_bar = _bar(Color("#59c8ff"), Vector2(0, -6), Vector2(0, 6), Control.PRESET_BOTTOM_WIDE)
	boss_box = Control.new()
	boss_box.set_anchors_preset(Control.PRESET_CENTER_TOP)
	boss_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(boss_box)
	boss_name = Label.new()
	boss_name.add_theme_font_size_override("font_size", 20)
	boss_name.add_theme_color_override("font_outline_color", Color.BLACK)
	boss_name.add_theme_constant_override("outline_size", 6)
	boss_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	boss_name.position = Vector2(-300, 54)
	boss_name.size = Vector2(600, 26)
	boss_box.add_child(boss_name)
	boss_bar = ProgressBar.new()
	boss_bar.show_percentage = false
	boss_bar.position = Vector2(-300, 82)
	boss_bar.size = Vector2(600, 18)
	boss_bar.add_theme_stylebox_override("fill", _box(Color("#b3122a")))
	boss_bar.add_theme_stylebox_override("background", _box(DARK))
	boss_box.add_child(boss_bar)
	banner = _label("", 80, Vector2.ZERO, Control.PRESET_CENTER)
	banner.add_theme_font_override("font", COMIC_FONT)
	banner.add_theme_constant_override("outline_size", 14)
	banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_place(banner, -500, -170, 500, -80)
	notice_text = _label("", 20, Vector2.ZERO, Control.PRESET_CENTER_TOP)
	notice_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	notice_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_place(notice_text, -450, 112, 450, 220)
	Combat.player_hurt.connect(_on_hurt)
	Combat.levelled_up.connect(func(lv: int) -> void: show_banner("LEVEL %d" % lv, Color("#59c8ff")))
	Combat.notice.connect(show_notice)


func show_banner(text: String, color: Color, seconds := 2.6) -> void:
	banner.text = text
	banner.add_theme_color_override("font_color", color)
	_banner_left = seconds


## Notices queue up, so a quest finishing and the next one starting are both read.
func show_notice(text: String, color := Color("#ffcc33"), seconds := 5.0) -> void:
	_notices.append([text, color, seconds])


func _next_notice() -> void:
	var item: Array = _notices.pop_front()
	var text: String = item[0]
	var color: Color = item[1]
	var seconds: float = item[2]
	_notice_age = 0.0
	notice_text.text = text
	notice_text.add_theme_color_override("font_color", color)
	_notice_left = seconds


func _on_hurt(amount: float, _result: String) -> void:
	if amount > 0.0:
		flash.color.a = 0.32


func _process(delta: float) -> void:
	hp_bar.max_value = Combat.max_hp()
	hp_bar.value = Combat.hp
	hp_text.text = "%d / %d" % [ceili(Combat.hp), roundi(Combat.max_hp())]
	xp_bar.max_value = Combat.xp_next
	xp_bar.value = Combat.xp
	level_text.text = "LV %d    %d gold" % [Combat.level, Combat.gold]
	flash.color.a = maxf(0.0, flash.color.a - delta * 0.8)
	_banner_left -= delta
	banner.visible = _banner_left > 0.0
	banner.modulate.a = clampf(_banner_left * 2.0, 0.0, 1.0)
	_notice_left -= delta
	_notice_age += delta
	if not _notices.is_empty() and (_notice_left <= 0.0 or _notice_age > 2.6):
		_next_notice()
	notice_text.visible = _notice_left > 0.0
	notice_text.modulate.a = clampf(_notice_left, 0.0, 1.0)
	var boss: Node = Combat.boss
	boss_box.visible = boss != null and is_instance_valid(boss) and not boss.dead
	if boss_box.visible:
		boss_name.text = "%s · LV %d" % [str(boss.def.get("name", boss.kind)).to_upper(), boss.level]
		boss_bar.max_value = boss.max_hp
		boss_bar.value = boss.hp
	for s: Dictionary in Combat.speech:
		s.age += delta
	Combat.speech = Combat.speech.filter(func(s: Dictionary) -> bool: return s.age < s.life and is_instance_valid(s.node))
	for f: Dictionary in Combat.floaters:
		f.age += delta
	Combat.floaters = Combat.floaters.filter(func(f: Dictionary) -> bool: return f.age < 2.2)
	queue_redraw()


## Health bars over monsters that are fighting or hurt, and the numbers that pop off things.
func _draw() -> void:
	_draw_clock()
	var cam := get_viewport().get_camera_3d()
	if cam == null or Combat.player == null:
		return
	var me: Vector3 = Combat.player.global_position
	for m: Node in Combat.mobs:
		if not is_instance_valid(m) or m.dead or not m.awake or m.def.get("boss", false):
			continue
		if m.state == "idle" and m.hp >= m.max_hp:
			continue
		var top: Vector3 = m.global_position + Vector3.UP * (m.height + 0.35)
		if top.distance_to(me) > 32.0 or cam.is_position_behind(top):
			continue
		var at := cam.unproject_position(top)
		var w := 74.0
		draw_rect(Rect2(at.x - w / 2.0 - 1, at.y - 1, w + 2, 9), Color(0, 0, 0, 0.7))
		draw_rect(Rect2(at.x - w / 2.0, at.y, w * clampf(m.hp / m.max_hp, 0.0, 1.0), 7), RED)
		var title := "LV %d %s" % [m.level, str(m.def.get("name", m.kind))]
		var diff: int = m.level - Combat.level
		var tint := Color("#ff6a5a") if diff >= 3 else Color("#ffd23a") if diff >= 1 else Color("#9aa0a6") if diff <= -3 else Color.WHITE
		var size := _font.get_string_size(title, HORIZONTAL_ALIGNMENT_LEFT, -1, 13)
		draw_string_outline(_font, Vector2(at.x - size.x / 2.0, at.y - 4), title, HORIZONTAL_ALIGNMENT_LEFT, -1, 13, 4, Color.BLACK)
		draw_string(_font, Vector2(at.x - size.x / 2.0, at.y - 4), title, HORIZONTAL_ALIGNMENT_LEFT, -1, 13, tint)
	for s: Dictionary in Combat.speech:
		_draw_bubble(cam, me, s)
	for f: Dictionary in Combat.floaters:
		var pos: Vector3 = f.pos + Vector3.UP * f.age * 0.9
		if cam.is_position_behind(pos) or pos.distance_to(me) > 40.0:
			continue
		var at := cam.unproject_position(pos)
		if f.get("big", false):
			_draw_sfx(at, f)
			continue
		var font_size := 22 if str(f.text).length() < 12 else 17
		var size := _font.get_string_size(f.text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size)
		var color: Color = f.color
		color.a = clampf((2.2 - f.age) * 1.5, 0.0, 1.0)
		draw_string_outline(_font, at - Vector2(size.x / 2.0, 0), f.text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, 5, Color(0, 0, 0, color.a))
		draw_string(_font, at - Vector2(size.x / 2.0, 0), f.text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, color)


## WHAM! in big comic lettering: it punches in oversized, settles, and is gone in under a second.
func _draw_sfx(at: Vector2, f: Dictionary) -> void:
	var age: float = f.age
	if age > 0.85:
		return
	var pop := 1.0 + 0.7 * (1.0 - minf(age / 0.09, 1.0))
	var color: Color = f.color
	var alpha := clampf((0.85 - age) * 5.0, 0.0, 1.0)
	color.a = alpha
	var font_size := 58
	var size := COMIC_FONT.get_string_size(f.text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size)
	draw_set_transform(at + Vector2(0, -age * 30.0), f.tilt, Vector2(pop, pop))
	var corner := -size / 2.0 + Vector2(0, size.y * 0.35)
	draw_string_outline(COMIC_FONT, corner, f.text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, 16, Color(0, 0, 0, alpha))
	draw_string_outline(COMIC_FONT, corner, f.text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, 7, Color(1, 1, 1, alpha))
	draw_string(COMIC_FONT, corner, f.text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, color)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


func _bar(fill: Color, pos: Vector2, size: Vector2, preset: int) -> ProgressBar:
	var bar := ProgressBar.new()
	bar.show_percentage = false
	bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bar.set_anchors_preset(preset)
	bar.add_theme_stylebox_override("fill", _box(fill))
	bar.add_theme_stylebox_override("background", _box(DARK))
	add_child(bar)
	if preset == Control.PRESET_BOTTOM_WIDE:
		bar.offset_top = pos.y
		bar.offset_bottom = 0
	else:
		bar.offset_left = pos.x
		bar.offset_top = pos.y
		bar.offset_right = pos.x + size.x
		bar.offset_bottom = pos.y + size.y
	return bar


func _label(text: String, font_size: int, pos: Vector2, preset: int) -> Label:
	var label := Label.new()
	label.text = text
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_outline_color", Color.BLACK)
	label.add_theme_constant_override("outline_size", 6)
	label.set_anchors_preset(preset)
	add_child(label)
	if preset == Control.PRESET_BOTTOM_LEFT:
		label.offset_left = pos.x
		label.offset_top = pos.y
		label.offset_right = pos.x + 400
		label.offset_bottom = pos.y + 26
	return label


## Sets a centred control's edges relative to its anchor point (setting position would place it from the corner).
func _place(control: Control, left: float, top: float, right: float, bottom: float) -> void:
	control.offset_left = left
	control.offset_top = top
	control.offset_right = right
	control.offset_bottom = bottom


func _box(color: Color) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = color
	box.set_corner_radius_all(3)
	return box


## A timed quest's clock, top centre, in comic lettering. The last thirty seconds go red and throb. Under it, the
## floor's hazard meter when there is one (Floor 15's cold).
func _draw_clock() -> void:
	var w := get_viewport_rect().size.x
	var y := 96.0
	var c: Dictionary = Story.countdown
	if not c.is_empty():
		var left: float = maxf(0.0, float(c.left))
		var text := "%s  %d:%02d" % [str(c.label), int(left) / 60, int(left) % 60]
		var urgent := left < 30.0
		var font_size := int(34.0 * (1.0 + (0.08 * sin(Time.get_ticks_msec() / 90.0) if urgent else 0.0)))
		var size := COMIC_FONT.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size)
		var at := Vector2(w / 2.0 - size.x / 2.0, y)
		var col := Color("#ff4a3a") if urgent else Color("#ffd23a")
		draw_string_outline(COMIC_FONT, at, text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, 8, Color.BLACK)
		draw_string(COMIC_FONT, at, text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, col)
		var frac := clampf(left / maxf(1.0, float(c.total)), 0.0, 1.0)
		draw_rect(Rect2(w / 2.0 - 120.0, y + 8.0, 240.0, 8.0), Color(0, 0, 0, 0.7))
		draw_rect(Rect2(w / 2.0 - 119.0, y + 9.0, 238.0 * frac, 6.0), col)
		y += 44.0
	var hz: Dictionary = Combat.hazard
	if not hz.is_empty():
		var v := clampf(float(hz.value) / 100.0, 0.0, 1.0)
		var label := "%s %d%%" % [str(hz.label), roundi(v * 100.0)]
		var col: Color = Color(str(hz.get("color", "#8fd8ff"))) if v > 0.25 else Color("#ff4a3a")
		var size := _font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, 15)
		draw_rect(Rect2(w / 2.0 - 100.0, y, 200.0, 10.0), Color(0, 0, 0, 0.7))
		draw_rect(Rect2(w / 2.0 - 99.0, y + 1.0, 198.0 * v, 8.0), col)
		draw_string_outline(_font, Vector2(w / 2.0 - size.x / 2.0, y - 4.0), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 15, 4, Color.BLACK)
		draw_string(_font, Vector2(w / 2.0 - size.x / 2.0, y - 4.0), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 15, col)


## A comic speech bubble over someone's head: white, inked, with a little tail pointing down at them.
func _draw_bubble(cam: Camera3D, me: Vector3, s: Dictionary) -> void:
	var who: Node3D = s.node
	var top: Vector3 = who.global_position + Vector3.UP * float(s.height)
	if cam.is_position_behind(top) or top.distance_to(me) > 22.0:
		return
	var at := cam.unproject_position(top)
	var fade := clampf(minf(float(s.age) * 4.0, (float(s.life) - float(s.age)) * 2.0), 0.0, 1.0)
	var size := 15
	var lines: PackedStringArray = _wrap(str(s.text), 26)
	var w := 0.0
	for line: String in lines:
		w = maxf(w, _font.get_string_size(line, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x)
	var h := lines.size() * (size + 3) + 10.0
	var box := Rect2(at.x - w / 2.0 - 10.0, at.y - h - 14.0, w + 20.0, h)
	var ink := Color(0, 0, 0, fade)
	var paper := Color(1, 1, 1, 0.94 * fade)
	draw_rect(box.grow(2.0), ink)
	draw_rect(box, paper)
	draw_colored_polygon(PackedVector2Array([Vector2(at.x - 6, box.end.y), Vector2(at.x + 6, box.end.y), Vector2(at.x, box.end.y + 10)]), paper)
	draw_polyline(PackedVector2Array([Vector2(at.x - 6, box.end.y), Vector2(at.x, box.end.y + 10), Vector2(at.x + 6, box.end.y)]), ink, 2.0)
	for i in lines.size():
		draw_string(_font, Vector2(box.position.x + 10.0, box.position.y + 6.0 + (i + 1) * (size + 3) - 3), lines[i], HORIZONTAL_ALIGNMENT_LEFT, -1, size, ink)


func _wrap(text: String, width: int) -> PackedStringArray:
	var out := PackedStringArray()
	var line := ""
	for word: String in text.split(" "):
		if line.length() + word.length() + 1 > width and line != "":
			out.append(line)
			line = word
		else:
			line = word if line == "" else line + " " + word
	if line != "":
		out.append(line)
	return out
