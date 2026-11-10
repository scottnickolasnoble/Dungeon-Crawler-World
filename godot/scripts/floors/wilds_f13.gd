class_name WildsF13
extends Wilds
## The Stacks: a library the size of a country. Shelving canyons with gantries over the aisles, the Card Catalogue
## Spire, reading rooms where nobody may speak. Somewhere in here is a book with your name on the spine.

var _bays := 0


func _build_districts() -> void:
	_canyon(Vector3(-460, 0, -320), 0.0)
	_canyon(Vector3(470, 0, 380), PI / 2.0)
	_reading_room(Vector3(440, 0, -380))
	_returns(Vector3(-470, 0, 400))
	_tower(Vector3(80, 0, -540), 0.4, 5, "Card Catalogue Spire")
	for spot: Array in [[Vector3(-112, 0, 92), 0.3, "shh"], [Vector3(112, 0, 92), -0.3, "overdue"], [Vector3(-220, 0, -130), 0.7, "index"], [Vector3(230, 0, 170), -0.7, "you"]]:
		_tag_wall(spot[0], spot[1], spot[2])
		_claim(spot[0], 10.0, 6.0)
	var deep := _cave_from_rooms("cave_f8", Vector3(-180, 0, 110), "Press E: go down to the closed stacks", [[0, 0, 3, 5], [-26, 8, 0, 6], [-52, 0, -3, 6], [-66, 30, -6, 7], [-40, 50, -9, 13], [-8, 32, -5, 5]], "#ffd890", "#c8ffd8", 4, "book_pile", 1.0)
	kit.prop("returns_chute", Vector3(-180, 0, 110), 0.3)
	_claim(Vector3(-180, 0, 110), 14.0, 14.0)
	kit.prop("reading_desk", deep + Vector3(0, 0, -4), 0.0)
	_view("closedstacks", deep + Vector3(3, 0.2, 6), deep + Vector3(0, 1.6, -4))
	var hatch := Vector3(-330, 0, 300)
	kit.prop("bookshelf_tall", hatch + Vector3(0, 0, -3), 0.0, 1.0, Vector3(2.0, 3.0, 0.5))
	_claim(hatch, 8.0, 8.0)
	_build_loot_room(hatch, "Press E: pull the red book; the shelf swings open", "facade_a")
	_apply_claims()
	_fill_grid(44.0, 22.0, 40.0, _shelf_bay)
	_vehicle_line(Vector3(60, 0, 130), Vector3(30, 0, 390), "rail_track", "mine_cart", "Press E: ride the book trolley line", "Press E: ride it back")
	_ride_line(Vector3(-160, 0, -90), Vector3(-160, 0, -320), "zip_rail", "Press E: ride the pneumatic-tube cable", "Press E: ride it back")


## A bay of shelves: two long rows, too tall to see over, aisles between. Books on the floor. Some are moving.
func _shelf_bay(at: Vector3, yaw: float) -> void:
	_bays += 1
	var side := Vector3(cos(yaw), 0, -sin(yaw))
	var forward := Vector3(sin(yaw), 0, cos(yaw))
	for row in 3:
		for k in 4:
			var p := at + side * (-12.0 + row * 12.0) + forward * (-12.0 + k * 8.0)
			_batched("bookshelf_tall", p, yaw + PI / 2.0, 1.0, Vector3(3.8, 3.0, 0.5))
	# the shelves are solid walls, so towers and the like keep off the bay
	_note_solid(at, 18.0)
	var spot := at + side * 6.0 + forward * _rng.randf_range(-10, 10)
	var mess := _rng.randf()
	if mess < 0.3:
		_batched("book_pile", spot, _rng.randf_range(0, TAU), _rng.randf_range(0.8, 1.3))
	elif mess < 0.4:
		kit.prop("reading_desk", spot, yaw)
	elif mess < 0.48:
		kit.prop("remains", spot, yaw)
	if _bays % 5 == 0:
		_light("#ffd890", 1.2, 18.0, at + Vector3.UP * 7.0, false)


## A shelving canyon four levels deep: tall shelves both sides, gantries along them, bridges across, ladders between.
func _canyon(at: Vector3, yaw: float) -> void:
	_claim(at, 60.0, 30.0)
	_post_sign_text("The Deep Shelves", at + Vector3(0, 0, 28).rotated(Vector3.UP, yaw))
	var along := Vector3(cos(yaw), 0, -sin(yaw))
	var across := Vector3(sin(yaw), 0, cos(yaw))
	for i in 12:
		for s: float in [-1.0, 1.0]:
			kit.prop("bookshelf_tall", at + along * (-55.0 + i * 10.0) + across * s * 10.0, yaw + (PI if s > 0 else 0.0), 1.4, Vector3(4.5, 4.2, 0.6))
	for h: float in [6.0, 12.0]:
		for s: float in [-1.0, 1.0]:
			_bridge(at + along * -56.0 + across * s * 7.6 + Vector3.UP * h, at + along * 56.0 + across * s * 7.6 + Vector3.UP * h, 2.4)
		for k in 3:
			var x := -40.0 + k * 40.0
			_bridge(at + along * x - across * 6.4 + Vector3.UP * h, at + along * x + across * 6.4 + Vector3.UP * h, 2.0)
	# ramps up at one end: ground to the first walkway, first to the second
	var mat: Material = kit.surface("pave", Vector2(2.4, 16), 6.0, 0.4)
	_ramp(at + along * -60.0 + across * -7.6 + along * -15.6, at + along * -56.5 + across * -7.6 + Vector3.UP * 6.0, 2.4, mat)
	_ramp(at + along * 60.0 + across * 7.6 + along * 15.6, at + along * 56.5 + across * 7.6 + Vector3.UP * 6.0, 2.4, mat)
	for i in 4:
		_light("#ffd890", 1.0, 20.0, at + along * (-45.0 + i * 30.0) + Vector3.UP * 15.0, i == 1)
		_stalker("far_figure", at + along * (-40.0 + i * 26.0) + Vector3.UP * (6.0 if i % 2 else 0.0) + across * 7.0, false)
	_view("canyon", at + along * -50.0 + Vector3.UP * 1.0, at + along * 20.0 + Vector3.UP * 8.0)


func _reading_room(at: Vector3) -> void:
	_claim(at, 34.0, 30.0)
	_ruin(at, 0.0, "The Reading Room", 32.0, 24.0, 12.0, "facade_a", "#ffe8b0", 1.4)
	for i in 6:
		kit.prop("reading_desk", at + Vector3(-10.0 + (i % 3) * 10.0, 0, -4.0 + (i / 3) * 8.0), 0.0)
	_post_sign_text("SILENCE", at + Vector3(0, 6, -11))


func _returns(at: Vector3) -> void:
	_claim(at, 26.0, 26.0)
	_post_sign_text("Returns", at + Vector3(0, 0, 22))
	kit.prop("returns_chute", at, 0.0, 2.0, Vector3(1.6, 2.0, 1.2))
	for i in 24:
		_batched("book_pile", at + Vector3(_rng.randf_range(-16, 16), 0, _rng.randf_range(-16, 16)), _rng.randf_range(0, TAU), _rng.randf_range(0.8, 1.6))
	_stains(at + Vector3(0, 0, 4), 6.0, 4)
	_shaft_of_light(at, "#ffe8b0", 4.0)
	_view("returns", at + Vector3(0, 1.0, 18), at + Vector3(0, 2.0, 0))
