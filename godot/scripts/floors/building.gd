class_name Building
extends RefCounted
## A real building: four walls with a doorway you walk through, a furnished room inside, and a sign out front.
## Local coordinates: the front faces +Z, and the origin is on the ground at the building's centre.

const WALL := 0.3
const DOOR_W := 2.6
const DOOR_H := 3.1
const NPC := "res://models/npcs/%s.glb"

var kit: FloorKit
var look: Dictionary
var w: float
var d: float
var h: float
var _cfg: Dictionary


## cfg: { x, z, yaw, kind, w, d, h, sign, name, title, keeper, facade }
## look: { roof, trim, roof_color, chimney }
static func build(owner_kit: FloorKit, cfg: Dictionary, floor_look: Dictionary) -> void:
	var b := Building.new()
	b.kit = owner_kit
	b.look = floor_look
	b._cfg = cfg
	b.w = cfg.w
	b.d = cfg.d
	b.h = cfg.h
	b._construct()


func _construct() -> void:
	var saved_root := kit.root
	var saved_body := kit.body
	var node := Node3D.new()
	node.name = str(_cfg.get("name", "Building"))
	node.position = Vector3(_cfg.x, 0, _cfg.z)
	node.rotation.y = _cfg.yaw
	saved_root.add_child(node)
	var solid := StaticBody3D.new()
	node.add_child(solid)
	kit.root = node
	kit.body = solid
	_shell()
	_roof()
	_front()
	_interior()
	kit.root = saved_root
	kit.body = saved_body
	var forward := Vector3(sin(_cfg.yaw), 0, cos(_cfg.yaw))
	var door := node.position + forward * (d / 2.0)
	kit.doors.append({ "name": _cfg.get("name", ""), "outside": door + forward * 2.0, "inside": door - forward * 2.5 })


func _wall_piece(length: float, height: float, pos: Vector3, yaw: float) -> void:
	# Two faces back to back: the street side and the room side have different finishes.
	var out := Vector3(sin(yaw), 0, cos(yaw))
	var size := Vector2(length, height)
	kit.quad(size, kit.surface(_cfg.facade, size, 6.0), pos + out * (WALL / 2.0), Vector3(0, yaw, 0))
	kit.quad(size, kit.surface("int_wall", size, 3.5, 0.3), pos - out * (WALL / 2.0), Vector3(0, yaw + PI, 0))
	kit.box_collider(pos, Vector3(length / 2.0, height / 2.0, WALL / 2.0), yaw)


func _shell() -> void:
	var hx := w / 2.0
	var hz := d / 2.0
	var mid := h / 2.0
	# back and sides
	_wall_piece(w, h, Vector3(0, mid, -hz), PI)
	_wall_piece(d, h, Vector3(-hx, mid, 0), -PI / 2.0)
	_wall_piece(d, h, Vector3(hx, mid, 0), PI / 2.0)
	# front, split around the doorway
	var side := (w - DOOR_W) / 2.0
	_wall_piece(side, h, Vector3(-(DOOR_W + side) / 2.0, mid, hz), 0.0)
	_wall_piece(side, h, Vector3((DOOR_W + side) / 2.0, mid, hz), 0.0)
	_wall_piece(DOOR_W, h - DOOR_H, Vector3(0, DOOR_H + (h - DOOR_H) / 2.0, hz), 0.0)
	kit.prop("door_frame", Vector3(0, 0, hz))
	# corner posts, skirting and eaves give the box some real depth and ink lines
	var trim := kit.flat(look.trim)
	for corner: Vector2 in [Vector2(-hx, -hz), Vector2(hx, -hz), Vector2(-hx, hz), Vector2(hx, hz)]:
		kit.block(Vector3(0.5, h + 0.2, 0.5), trim, Vector3(corner.x, (h + 0.2) / 2.0, corner.y))
	kit.block(Vector3(w + 0.3, 0.35, 0.42), trim, Vector3(0, h, hz))
	kit.block(Vector3(w + 0.3, 0.35, 0.42), trim, Vector3(0, h, -hz))
	kit.block(Vector3(0.42, 0.35, d + 0.3), trim, Vector3(hx, h, 0))
	kit.block(Vector3(0.42, 0.35, d + 0.3), trim, Vector3(-hx, h, 0))
	# floor, ceiling, windows on every side that has room
	kit.plane(Vector2(w, d), kit.surface("int_floor", Vector2(w, d), 3.5, 0.3), Vector3(0, 0.03, 0))
	kit.quad(Vector2(w, d), kit.flat(look.ceiling, 0.7), Vector3(0, h - 0.02, 0), Vector3(PI / 2.0, 0, 0))
	if w >= 9.0:
		for x: float in [-(w / 2.0 - 1.9), w / 2.0 - 1.9]:
			kit.prop("window", Vector3(x, 2.05, hz))
	for z: float in [-(d / 4.0), d / 4.0]:
		kit.prop("window", Vector3(-hx, 2.2, z), PI / 2.0)
		kit.prop("window", Vector3(hx, 2.2, z), PI / 2.0)
	# the room's lamp
	kit.prop("ceiling_light", Vector3(0, h, 0), 0.0, 0.55)
	kit.lamp(Color("#ffe6c4"), look.get("room_light", 1.0), maxf(w, d) * 1.05, Vector3(0, h - 1.0, 0))
	_furnish_walls()


## What makes a box feel like a room: wall panelling, ceiling beams, a rug and things pinned up.
func _furnish_walls() -> void:
	var hx := w / 2.0 - WALL / 2.0
	var hz := d / 2.0 - WALL / 2.0
	var panel := kit.flat(look.trim.darkened(0.15))
	kit.block(Vector3(w - 0.3, 0.9, 0.07), panel, Vector3(0, 0.45, -hz + 0.03))
	kit.block(Vector3(0.07, 0.9, d - 0.3), panel, Vector3(-hx + 0.03, 0.45, 0))
	kit.block(Vector3(0.07, 0.9, d - 0.3), panel, Vector3(hx - 0.03, 0.45, 0))
	var rail := kit.flat(look.trim.lightened(0.15))
	kit.block(Vector3(w - 0.3, 0.1, 0.12), rail, Vector3(0, 0.92, -hz + 0.05))
	kit.block(Vector3(0.12, 0.1, d - 0.3), rail, Vector3(-hx + 0.05, 0.92, 0))
	kit.block(Vector3(0.12, 0.1, d - 0.3), rail, Vector3(hx - 0.05, 0.92, 0))
	var beam := kit.flat(look.trim.darkened(0.3))
	var z := -d / 2.0 + 2.2
	while z < d / 2.0 - 1.0:
		kit.block(Vector3(w - 0.3, 0.28, 0.28), beam, Vector3(0, h - 0.16, z))
		z += 3.0
	# a rug on the customer side of the room
	var rug := kit.flat(look.rug if look.has("rug") else Color("#8a3f35"))
	kit.block(Vector3(w * 0.5, 0.03, d * 0.34), rug, Vector3(0, 0.05, d * 0.18))
	kit.block(Vector3(w * 0.42, 0.04, d * 0.26), kit.flat(look.trim.lightened(0.25), 0.7), Vector3(0, 0.055, d * 0.18))
	# posters, notices and old adverts
	var posters := ["poster_smile", "poster_thirst", "poster_floor18", "poster_cone"]
	var pick := absi(hash(str(_cfg.get("name", "")) + str(_cfg.x))) % posters.size()
	var left := kit.tex("res://textures/landing/%s.png" % posters[pick])
	var right := kit.tex("res://textures/landing/%s.png" % posters[(pick + 1) % posters.size()])
	kit.quad(Vector2(0.95, 1.42), Models.toon(Color.WHITE, left, Vector2.ONE, 0.2), Vector3(-hx + 0.05, 2.65, -d * 0.02), Vector3(0, PI / 2.0, 0.04))
	kit.quad(Vector2(0.95, 1.42), Models.toon(Color.WHITE, right, Vector2.ONE, 0.2), Vector3(hx - 0.05, 2.65, d * 0.04), Vector3(0, -PI / 2.0, -0.05))
	kit.prop("trash_can", Vector3(w / 2.0 - 0.8, 0, d / 2.0 - 0.8), 0.7, 0.8, Vector3(0.28, 1.0, 0.28))


func _roof() -> void:
	var roof_color: Color = look.roof_color
	match look.roof:
		"gable":
			_gable(roof_color)
		"cone":
			var cone := CylinderMesh.new()
			cone.top_radius = 0.2
			cone.bottom_radius = maxf(w, d) * 0.72
			cone.height = maxf(w, d) * 0.42
			cone.radial_segments = 9
			cone.rings = 1
			kit.mesh_node(cone, kit.flat(roof_color), Vector3(0, h + cone.height / 2.0, 0))
		_:
			kit.quad(Vector2(w, d), kit.flat(roof_color), Vector3(0, h + 0.02, 0), Vector3(-PI / 2.0, 0, 0))
			var rim := kit.flat(look.trim)
			kit.block(Vector3(w + 0.4, 0.7, 0.3), rim, Vector3(0, h + 0.35, d / 2.0))
			kit.block(Vector3(w + 0.4, 0.7, 0.3), rim, Vector3(0, h + 0.35, -d / 2.0))
			kit.block(Vector3(0.3, 0.7, d + 0.4), rim, Vector3(w / 2.0, h + 0.35, 0))
			kit.block(Vector3(0.3, 0.7, d + 0.4), rim, Vector3(-w / 2.0, h + 0.35, 0))
			kit.block(Vector3(1.6, 1.0, 1.2), kit.flat(Color("#6d7178")), Vector3(w * 0.2, h + 0.55, -d * 0.2))
	if look.get("chimney", false):
		kit.prop("pipes", Vector3(-w * 0.26, h - 0.3, -d * 0.12), 0.7, 0.7)


func _gable(color: Color) -> void:
	var rise := minf(w, d) * 0.34
	var hx := w / 2.0 + 0.5
	var hz := d / 2.0 + 0.5
	var mesh := ArrayMesh.new()
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var a := Vector3(-hx, h, -hz)
	var b := Vector3(hx, h, -hz)
	var c := Vector3(hx, h, hz)
	var e := Vector3(-hx, h, hz)
	var ridge0 := Vector3(0, h + rise, -hz)
	var ridge1 := Vector3(0, h + rise, hz)
	for tri: Array in [[e, ridge1, ridge0], [e, ridge0, a], [c, b, ridge0], [c, ridge0, ridge1], [e, c, ridge1], [b, a, ridge0]]:
		var n: Vector3 = (tri[2] - tri[0]).cross(tri[1] - tri[0]).normalized()
		for v: Vector3 in tri:
			st.set_normal(n)
			st.add_vertex(v)
	st.commit(mesh)
	kit.mesh_node(mesh, kit.flat(color), Vector3.ZERO)


func _front() -> void:
	var hz := d / 2.0
	if _cfg.has("sign"):
		var sign_w := minf(w - 0.8, 7.2)
		kit.board(_cfg.sign, sign_w, sign_w / 4.0, Vector3(0, DOOR_H + 0.25 + sign_w / 8.0, hz + 0.3))
	if _cfg.has("blade"):
		# the shaped sign that swings out over the street
		var x := w / 2.0 - 0.75
		kit.prop("sign_bracket", Vector3(x, 3.5, hz + 0.1), PI / 2.0)
		kit.quad(Vector2(1.6, 1.6), kit.unshaded(Color(0.95, 0.95, 0.95), kit.tex(FloorKit.SIGN_TEX % _cfg.blade), true), Vector3(x, 2.55, hz + 1.1), Vector3(0, PI / 2.0, 0))
	if _cfg.kind in ["gear", "provisions", "pickles", "tables", "inn"] and w >= 11.0:
		for s: float in [-1.0, 1.0]:
			kit.prop("awning", Vector3(s * (w / 2.0 - 1.95), 3.55, hz + 0.1), 0.0, 0.88)
	# life on the doorstep
	match _cfg.kind:
		"provisions":
			kit.prop("barrels", Vector3(w / 2.0 - 2.5, 0, hz + 1.2), 0.3, 0.8, Vector3(0.9, 1.0, 0.7))
		"gear":
			kit.prop("armor_stand", Vector3(-w / 2.0 + 2.0, 0, hz + 1.1), 0.2, 1.0, Vector3(0.3, 1.0, 0.3))
		"pickles":
			kit.prop("junk_pile", Vector3(-w / 2.0 + 2.6, 0, hz + 1.6), 0.9, 1.0, Vector3(1.0, 0.8, 0.8))
		"tables":
			kit.prop("crates", Vector3(w / 2.0 - 2.6, 0, hz + 1.2), 0.9, 1.0, Vector3(0.8, 1.0, 0.7))
		"inn":
			kit.prop("bench", Vector3(-w / 2.0 + 3.0, 0, hz + 0.75), 0.0, 1.0, Vector3(1.3, 1.0, 0.35))


func _interior() -> void:
	var hx := w / 2.0
	var hz := d / 2.0
	var back := -hz + 0.42
	match _cfg.kind:
		"gear":
			_shop_counter()
			kit.prop("weapon_rack", Vector3(0, 0, back))
			kit.prop("weapon_rack", Vector3(-hx + 0.4, 0, 0.5), PI / 2.0)
			kit.prop("shelf", Vector3(hx - 0.4, 0.2, 0.5), -PI / 2.0)
			kit.prop("armor_stand", Vector3(-hx + 1.4, 0, hz - 2.4), 0.8, 1.0, Vector3(0.3, 1.0, 0.3))
			kit.prop("armor_stand", Vector3(hx - 1.4, 0, hz - 2.4), -0.6, 1.0, Vector3(0.3, 1.0, 0.3))
		"provisions":
			_shop_counter()
			kit.prop("food_shelf", Vector3(0, 0, back))
			kit.prop("potion_shelf", Vector3(hx - 0.3, 0, 0.5), -PI / 2.0)
			kit.prop("food_shelf", Vector3(-hx + 0.42, 0, 0.5), PI / 2.0)
			kit.prop("barrels", Vector3(hx - 1.3, 0, hz - 1.6), 0.4, 1.0, Vector3(0.9, 1.0, 0.8))
			kit.prop("crates", Vector3(-hx + 1.4, 0, hz - 1.6), 0.2, 1.0, Vector3(0.9, 1.0, 0.7))
		"pickles":
			_shop_counter()
			kit.prop("shelf", Vector3(0, 0.2, back))
			kit.prop("junk_pile", Vector3(-hx + 1.6, 0, 0.8), 0.6, 1.25, Vector3(1.2, 0.8, 1.0))
			kit.prop("junk_pile", Vector3(hx - 1.6, 0, -0.2), 2.4, 1.15, Vector3(1.1, 0.8, 0.9))
			kit.prop("boxes", Vector3(hx - 1.6, 0, hz - 1.7), 0.5, 1.0, Vector3(0.8, 1.0, 0.7))
			kit.prop("tires", Vector3(-hx + 1.2, 0, hz - 1.6), 0.2, 1.0, Vector3(0.5, 1.0, 0.5))
		"tables":
			_shop_counter()
			kit.prop("shelf", Vector3(0, 0.2, back))
			kit.prop("workbench", Vector3(-hx + 1.0, 0, 0.8), PI / 2.0, 1.0, Vector3(0.55, 1.0, 1.25))
			kit.prop("workbench", Vector3(hx - 1.0, 0, 0.8), -PI / 2.0, 1.0, Vector3(0.55, 1.0, 1.25))
			kit.prop("crates", Vector3(-hx + 1.4, 0, hz - 1.6), 0.4, 1.0, Vector3(0.9, 1.0, 0.7))
		"inn":
			kit.prop("counter", Vector3(0, 0, -hz + 3.0), 0.0, 1.0, Vector3(2.1, 0.6, 0.45))
			kit.prop("bar_back", Vector3(0, 0, -hz + 0.4))
			kit.person(_cfg.keeper, Vector3(0, 0, -hz + 1.9), 0.0)
			for i in 3:
				kit.prop("bed", Vector3(hx - 1.1, 0, -hz + 2.2 + i * 2.5), -PI / 2.0, 1.0, Vector3(1.0, 0.6, 0.55))
			kit.prop("table_set", Vector3(-hx + 2.5, 0, 0.8), 0.3, 1.0, Vector3(0.65, 1.0, 0.65))
			kit.prop("table_set", Vector3(-hx + 2.5, 0, hz - 2.2), 1.9, 1.0, Vector3(0.65, 1.0, 0.65))
			_note_keeper(Vector3(0, 0, -hz + 3.9))
		"saferoom":
			kit.prop("bed", Vector3(-hx + 1.1, 0, -0.8), PI / 2.0, 1.0, Vector3(1.0, 0.6, 0.55))
			kit.prop("crates", Vector3(hx - 1.4, 0, hz - 1.4), 0.2, 0.9, Vector3(0.9, 1.0, 0.7))
			kit.prop("door_frame", Vector3(0, 0, -hz + 0.2), PI)
			kit.lamp(Color("#6dff8c"), 1.6, 6.0, Vector3(0, 2.2, -hz + 1.5))
			kit.interactables.append(_interact(Vector3(0, 0, -hz + 1.2), 2.4, "Your Crash Pad (opens in Phase 4)"))
		"guild":
			for i in 4:
				kit.prop("guild_banner", Vector3(-w / 2.0 + 2.5 + i * (w - 5.0) / 3.0, 0, back))
			kit.prop("shelf", Vector3(-hx + 0.4, 0.2, 0.0), PI / 2.0)
			kit.prop("shelf", Vector3(hx - 0.4, 0.2, 0.0), -PI / 2.0)
			kit.prop("table_set", Vector3(-w * 0.28, 0, hz - 3.2), 0.4, 1.2, Vector3(0.8, 1.0, 0.8))
			kit.prop("table_set", Vector3(w * 0.28, 0, hz - 3.2), 1.6, 1.2, Vector3(0.8, 1.0, 0.8))
			var masters: Array = _cfg.get("masters", [])
			for i in masters.size():
				var m: Dictionary = masters[i]
				var x := -w / 2.0 + 2.5 + i * (w - 5.0) / 3.0
				kit.person(m.model, Vector3(x, 0, back + 1.6), 0.0)
				kit.interactables.append(_interact(Vector3(x, 0, back + 2.6), 2.2, "%s · %s" % [m.name, m.title]))
		"callings":
			kit.prop("lectern", Vector3(0, 0, -hz + 3.0), 0.0, 1.0, Vector3(0.5, 1.0, 0.5))
			kit.person(_cfg.keeper, Vector3(0, 0, -hz + 1.9), 0.0)
			for i in 2:
				for s: float in [-1.0, 1.0]:
					kit.prop("guild_banner", Vector3(s * (2.2 + i * 2.6), 0, back))
			for z: float in [-1.0, 1.8]:
				for s: float in [-1.0, 1.0]:
					kit.prop("column", Vector3(s * (w / 2.0 - 2.2), 0, z), 0.0, 0.62, Vector3(0.45, 2.0, 0.45))
			_note_keeper(Vector3(0, 0, -hz + 4.0))
		_:
			# a home: somebody actually lives here
			kit.prop("bed", Vector3(-hx + 1.1, 0, -hz + 1.8), PI / 2.0, 1.0, Vector3(1.0, 0.6, 0.55))
			kit.prop("table_set", Vector3(hx - 2.2, 0, 0.0), 0.8, 1.0, Vector3(0.65, 1.0, 0.65))
			kit.prop("shelf", Vector3(1.0, 0.1, back), 0.0, 0.8)
			kit.prop("plant", Vector3(hx - 0.9, 0, -hz + 1.0), 1.0, 0.8, Vector3(0.3, 1.0, 0.3))
			if _cfg.has("keeper"):
				kit.person(_cfg.keeper, Vector3(-0.6, 0, 0.4), 2.6)


func _shop_counter() -> void:
	kit.prop("counter", Vector3(0, 0, -d / 2.0 + 3.1), 0.0, 1.0, Vector3(2.1, 0.6, 0.45))
	kit.person(_cfg.keeper, Vector3(0, 0, -d / 2.0 + 2.0), 0.0)
	_note_keeper(Vector3(0, 0, -d / 2.0 + 4.0))


func _note_keeper(local_pos: Vector3) -> void:
	kit.interactables.append(_interact(local_pos, 2.6, "%s · %s" % [_cfg.get("name", ""), _cfg.get("title", "")]))


func _interact(local_pos: Vector3, reach: float, text: String) -> Dictionary:
	var world := Vector3(_cfg.x, 0, _cfg.z) + local_pos.rotated(Vector3.UP, _cfg.yaw)
	return { "pos": world, "r": reach, "text": text }
