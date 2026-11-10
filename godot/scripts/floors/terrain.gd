class_name Terrain
extends RefCounted
## Hills, ridges and mountains for the big floors. A height grid over the whole floor: flat wherever something was
## already built (towns, camps, districts, roads), rising into the open land in between and along the edges.
## Everything placed after the terrain is made is lifted onto it (FloorKit.lift), so trees and monsters stand on the
## slopes. Slopes are kept walkable (under about 37 degrees) so every hill can be hiked over.

const STEP := 4.0
## How far the land takes to rise once it leaves something flat.
const RAMP := 26.0
## Clear flat ground kept around anything already built.
const KEEP := 5.0

var size := 720.0
var n := 0
var half := 360.0
var heights := PackedFloat32Array()
## The top of each hill, for lookouts: [Vector3(x, height, z), radius].
var summits: Array = []
var _flat := PackedByteArray()
var _noise := FastNoiseLite.new()


func _init(world_size: float, seed_value: int) -> void:
	size = world_size
	half = size / 2.0
	n = int(size / STEP) + 1
	heights.resize(n * n)
	_flat.resize(n * n)
	_noise.seed = seed_value
	_noise.frequency = 0.006
	_noise.fractal_octaves = 4


# ---------------------------------------------------------------- keeping built land flat
## Marks a rectangle of land as built on: it stays at ground level.
func keep_flat(area: Rect2, pad := KEEP) -> void:
	var a := area.grow(pad)
	var x0 := clampi(int(floor((a.position.x + half) / STEP)), 0, n - 1)
	var x1 := clampi(int(ceil((a.end.x + half) / STEP)), 0, n - 1)
	var z0 := clampi(int(floor((a.position.y + half) / STEP)), 0, n - 1)
	var z1 := clampi(int(ceil((a.end.y + half) / STEP)), 0, n - 1)
	for z in range(z0, z1 + 1):
		for x in range(x0, x1 + 1):
			_flat[z * n + x] = 1


# ---------------------------------------------------------------- shaping
## Rolling hills, a mountain and ranges along the walls. top is the tallest any hill may be.
func shape(top: float, rng: RandomNumberGenerator, is_free: Callable, rim := true, hills := 7, mountain := true) -> void:
	var raw := PackedFloat32Array()
	raw.resize(n * n)
	var bumps: Array = []
	# the big one first, then the rest, each on open land
	var wanted := hills + (1 if mountain else 0)
	var tries := 0
	while bumps.size() < wanted and tries < 400:
		tries += 1
		var big := mountain and bumps.is_empty()
		var reach := half - (170.0 if big else 120.0)
		var at := Vector2(rng.randf_range(-reach, reach), rng.randf_range(-reach, reach))
		if at.length() < 110.0 or not is_free.call(at.x, at.y, 40.0 if big else 24.0):
			continue
		var too_close := false
		for b: Dictionary in bumps:
			if at.distance_to(b.at) < (b.r + 60.0):
				too_close = true
		if too_close:
			continue
		var h := top * (1.25 if big else rng.randf_range(0.4, 0.95))
		# radius from height, so the steepest part of the slope stays walkable
		var r := maxf(h * 2.4, rng.randf_range(55.0, 100.0)) * (1.5 if big else 1.0)
		bumps.append({ "at": at, "h": h, "r": r, "stretch": rng.randf_range(1.0, 2.0), "yaw": rng.randf() * TAU })
	for z in n:
		for x in n:
			var p := Vector2(-half + x * STEP, -half + z * STEP)
			var h := 0.0
			for b: Dictionary in bumps:
				var d: Vector2 = (p - b.at).rotated(-b.yaw)
				d.x /= b.stretch
				var k: float = d.length() / b.r
				if k < 1.0:
					var bell: float = 1.0 - k * k
					h = maxf(h, b.h * bell * bell)
			if rim:
				var edge := maxf(absf(p.x), absf(p.y))
				var lip := smoothstep(half - 150.0, half - 25.0, edge)
				if lip > 0.0:
					h = maxf(h, top * 0.9 * lip * (0.55 + 0.45 * (_noise.get_noise_2d(p.x, p.y) * 0.5 + 0.5)))
			if h > 0.5:
				# a little roughness, so slopes aren't too smooth to be real
				h += _noise.get_noise_2d(p.x * 3.0, p.y * 3.0) * minf(1.6, h * 0.1)
			raw[z * n + x] = maxf(0.0, h)
	_settle(raw)
	# each hill's real top: built land nearby may have pushed it off centre
	for b: Dictionary in bumps:
		var best := Vector3(b.at.x, height(b.at.x, b.at.y), b.at.y)
		var reach: float = b.r * b.stretch
		var x := -reach
		while x <= reach:
			var z := -reach
			while z <= reach:
				var h := height(b.at.x + x, b.at.y + z)
				if h > best.y:
					best = Vector3(b.at.x + x, h, b.at.y + z)
				z += STEP * 2.0
			x += STEP * 2.0
		if best.y > 4.0:
			var duplicate := false
			for sm: Array in summits:
				if Vector2(sm[0].x - best.x, sm[0].z - best.z).length() < 30.0:
					duplicate = true
			if not duplicate:
				summits.append([best, b.r])


## Brings the land down to flat ground around everything built, smoothly over RAMP metres.
func _settle(raw: PackedFloat32Array) -> void:
	var far := PackedFloat32Array()
	far.resize(n * n)
	for i in n * n:
		far[i] = 0.0 if _flat[i] == 1 else 1e9
	var diag := STEP * 1.4142
	# two sweeps of a chamfer distance: how far each point is from built land
	for z in n:
		for x in n:
			var i := z * n + x
			var d := far[i]
			if x > 0: d = minf(d, far[i - 1] + STEP)
			if z > 0:
				d = minf(d, far[i - n] + STEP)
				if x > 0: d = minf(d, far[i - n - 1] + diag)
				if x < n - 1: d = minf(d, far[i - n + 1] + diag)
			far[i] = d
	for z in range(n - 1, -1, -1):
		for x in range(n - 1, -1, -1):
			var i := z * n + x
			var d := far[i]
			if x < n - 1: d = minf(d, far[i + 1] + STEP)
			if z < n - 1:
				d = minf(d, far[i + n] + STEP)
				if x < n - 1: d = minf(d, far[i + n + 1] + diag)
				if x > 0: d = minf(d, far[i + n - 1] + diag)
			far[i] = d
	for i in n * n:
		var k := smoothstep(0.0, RAMP, far[i])
		# the ramp limits the height, rather than scaling it, so a tall hill next to a camp gets a slope, not a cliff
		heights[i] = minf(raw[i], far[i] * 0.55) * k if raw[i] > 0.0 else 0.0
	_far = far


# ---------------------------------------------------------------- the open floors (4 and down)
## Floors from 4 down aren't rooms any more: under an open sky, the land rolls everywhere, mountain ranges wind across
## it with peaks you can climb, rivers cut through it, and villages cling to shelves high on the mountains. Towns,
## camps and districts sit down in the valleys, where the land comes down flat to meet them.
var open := false
## The tallest the mountains get.
var peak := 0.0
## Each river: points along its middle, at water level.
var rivers: Array = []
## Flat shelves high on the mountains, for villages: [Vector3(x, height, z), radius].
var pads: Array = []
## How far each grid point is from built land (from _settle).
var _far := PackedFloat32Array()
const RIVER_WATER := 1.3


func shape_open(top: float, rng: RandomNumberGenerator, is_free: Callable) -> void:
	open = true
	peak = top
	var raw := PackedFloat32Array()
	raw.resize(n * n)
	var ridged := FastNoiseLite.new()
	ridged.seed = _noise.seed + 7
	ridged.frequency = 0.012
	ridged.fractal_type = FastNoiseLite.FRACTAL_RIDGED
	ridged.fractal_octaves = 4
	var rolling := FastNoiseLite.new()
	rolling.seed = _noise.seed + 3
	rolling.frequency = 0.004
	rolling.fractal_octaves = 3
	# mountain ranges: winding lines of ridge, each a few long legs
	var ranges: Array = []
	for r in 2 + int(size / 450.0):
		var at := Vector2(rng.randf_range(-half * 0.8, half * 0.8), rng.randf_range(-half * 0.8, half * 0.8))
		var dir := rng.randf() * TAU
		var pts: Array = [at]
		for leg in rng.randi_range(3, 5):
			dir += rng.randf_range(-0.8, 0.8)
			at += Vector2(cos(dir), sin(dir)) * rng.randf_range(110.0, 240.0)
			at = at.clamp(Vector2(-half + 60.0, -half + 60.0), Vector2(half - 60.0, half - 60.0))
			pts.append(at)
		var h := top * rng.randf_range(0.5, 0.95)
		ranges.append({ "pts": pts, "h": h, "r": maxf(h * 2.2, 90.0) })
	# and great single mountains standing on their own
	var peaks: Array = []
	var tries := 0
	while peaks.size() < 2 + int(size / 600.0) and tries < 200:
		tries += 1
		var at := Vector2(rng.randf_range(-half * 0.75, half * 0.75), rng.randf_range(-half * 0.75, half * 0.75))
		if at.length() < 220.0 or not is_free.call(at.x, at.y, 60.0):
			continue
		var h := top * rng.randf_range(0.8, 1.15)
		peaks.append({ "at": at, "h": h, "r": h * 2.1 })
	for z in n:
		for x in n:
			var p := Vector2(-half + x * STEP, -half + z * STEP)
			# rolling ground everywhere, so no open land is ever a flat floor
			var h := 3.0 + (rolling.get_noise_2d(p.x, p.y) * 0.5 + 0.5) * 16.0
			for rg: Dictionary in ranges:
				var d := _to_line(p, rg.pts)
				var k: float = d / rg.r
				if k < 1.0:
					var bell: float = 1.0 - k * k
					h = maxf(h, rg.h * bell * bell)
			for pk: Dictionary in peaks:
				var k: float = p.distance_to(pk.at) / pk.r
				if k < 1.0:
					var bell: float = 1.0 - k * k
					h = maxf(h, pk.h * bell * bell)
			# crags and gullies on anything mountain-sized
			if h > 12.0:
				h += (ridged.get_noise_2d(p.x, p.y) - 0.3) * h * 0.16
			# the edge of the world is a wall of mountains
			var edge := maxf(absf(p.x), absf(p.y))
			var lip := smoothstep(half - 220.0, half - 20.0, edge)
			if lip > 0.0:
				h = maxf(h, top * 1.15 * lip * (0.6 + 0.4 * (_noise.get_noise_2d(p.x * 0.6, p.y * 0.6) * 0.5 + 0.5)))
			raw[z * n + x] = maxf(0.0, h)
	_settle(raw)
	_carve_rivers(rng, 30.0)
	if rivers.is_empty():
		# a crowded floor (Suburbia's streets go everywhere): a stream that squeezes between the houses
		_carve_rivers(rng, 14.0)
	_make_pads(rng, 90.0, 28.0)
	if pads.is_empty():
		_make_pads(rng, 45.0, 16.0)
	for pk: Dictionary in peaks:
		summits.append([Vector3(pk.at.x, height(pk.at.x, pk.at.y), pk.at.y), pk.r])
	for rg: Dictionary in ranges:
		var mid: Vector2 = rg.pts[rg.pts.size() / 2]
		summits.append([Vector3(mid.x, height(mid.x, mid.y), mid.y), rg.r])


func _to_line(p: Vector2, pts: Array) -> float:
	var best := INF
	for i in pts.size() - 1:
		var a: Vector2 = pts[i]
		var b: Vector2 = pts[i + 1]
		var ab := b - a
		var t := clampf((p - a).dot(ab) / maxf(ab.length_squared(), 0.001), 0.0, 1.0)
		best = minf(best, p.distance_to(a + ab * t))
	return best


func _index(x: float, z: float) -> int:
	var gx := clampi(int(roundf((x + half) / STEP)), 0, n - 1)
	var gz := clampi(int(roundf((z + half) / STEP)), 0, n - 1)
	return gz * n + gx


## Rivers: each starts in the mountains at one side and wanders across to the other, cutting a channel down through
## the land, and steers round towns and camps rather than flooding them.
func _carve_rivers(rng: RandomNumberGenerator, clear: float) -> void:
	for r in 1 + int(size / 900.0):
		var side := rng.randi() % 4
		var along := rng.randf_range(-half * 0.6, half * 0.6)
		var start: Vector2 = [Vector2(along, -half + 40.0), Vector2(half - 40.0, along), Vector2(along, half - 40.0), Vector2(-half + 40.0, along)][side]
		var goal: Vector2 = -start + Vector2(rng.randf_range(-200, 200), rng.randf_range(-200, 200))
		var at := start
		var dir := (goal - at).normalized()
		var path := PackedVector3Array()
		for step in 600:
			var want := (goal - at).normalized()
			dir = (dir + want * 0.08 + Vector2(rng.randf_range(-0.25, 0.25), rng.randf_range(-0.25, 0.25))).normalized()
			# keep well clear of anything built
			var ahead := at + dir * 24.0
			if _far[_index(ahead.x, ahead.y)] < clear + 10.0:
				var left := dir.rotated(0.9)
				var right := dir.rotated(-0.9)
				dir = left if _far[_index((at + left * 24.0).x, (at + left * 24.0).y)] > _far[_index((at + right * 24.0).x, (at + right * 24.0).y)] else right
			at += dir * 6.0
			if absf(at.x) > half - 30.0 or absf(at.y) > half - 30.0:
				break
			if _far[_index(at.x, at.y)] > clear:
				path.append(Vector3(at.x, RIVER_WATER, at.y))
		if path.size() < 20:
			continue
		# the channel: a flat bed below the water, banks rising out of it
		const BED := 7.0
		const BANK := 16.0
		for pt: Vector3 in path:
			var r0 := int(ceil(BANK / STEP))
			var ci := _index(pt.x, pt.z)
			var cx := ci % n
			var cz := ci / n
			for dz in range(-r0, r0 + 1):
				for dx in range(-r0, r0 + 1):
					var gx := cx + dx
					var gz := cz + dz
					if gx < 0 or gz < 0 or gx >= n or gz >= n or _flat[gz * n + gx] == 1:
						continue
					var d := Vector2(dx, dz).length() * STEP
					if d > BANK:
						continue
					var bed := 0.2 if d < BED else lerpf(0.2, heights[gz * n + gx], smoothstep(BED, BANK, d))
					heights[gz * n + gx] = minf(heights[gz * n + gx], bed)
		rivers.append(path)


## Shelves for villages: places high on the mountains, well away from towns and from each other, flattened out.
func _make_pads(rng: RandomNumberGenerator, clear: float, low: float) -> void:
	var want := 2 + int(size / 500.0)
	var tries := 0
	while pads.size() < want and tries < 3000:
		tries += 1
		var at := Vector2(rng.randf_range(-half + 120.0, half - 120.0), rng.randf_range(-half + 120.0, half - 120.0))
		var h := height(at.x, at.y)
		if h < low or h > peak * 0.85 or _far[_index(at.x, at.y)] < clear:
			continue
		var crowded := false
		for p: Array in pads:
			if Vector2(p[0].x, p[0].z).distance_to(at) < 220.0:
				crowded = true
		if crowded:
			continue
		var R := 26.0
		var ci := _index(at.x, at.y)
		var cx := ci % n
		var cz := ci / n
		var r0 := int(ceil((R + 22.0) / STEP))
		for dz in range(-r0, r0 + 1):
			for dx in range(-r0, r0 + 1):
				var gx := cx + dx
				var gz := cz + dz
				if gx < 0 or gz < 0 or gx >= n or gz >= n:
					continue
				var d := Vector2(dx, dz).length() * STEP
				var i := gz * n + gx
				heights[i] = h if d <= R else lerpf(h, heights[i], smoothstep(R, R + 22.0, d))
		pads.append([Vector3(at.x, h, at.y), R])


# ---------------------------------------------------------------- asking about the land
func height(x: float, z: float) -> float:
	var gx := clampf((x + half) / STEP, 0.0, n - 1.001)
	var gz := clampf((z + half) / STEP, 0.0, n - 1.001)
	var x0 := int(gx)
	var z0 := int(gz)
	var fx := gx - x0
	var fz := gz - z0
	var i := z0 * n + x0
	var a := lerpf(heights[i], heights[i + 1], fx)
	var b := lerpf(heights[i + n], heights[i + n + 1], fx)
	return lerpf(a, b, fz)


## The highest ground within radius of a point, for anything that needs level land to stand on.
func highest_near(x: float, z: float, radius: float) -> float:
	var top := 0.0
	var steps := maxi(1, int(radius / STEP))
	for dz in range(-steps, steps + 1):
		for dx in range(-steps, steps + 1):
			top = maxf(top, height(x + dx * STEP, z + dz * STEP))
	return top


# ---------------------------------------------------------------- building it
## The visible hills and their collision, cut into squares so only nearby ones draw.
func build(parent: Node3D, body: StaticBody3D, mat: Material, tile: float, draw_distance: float) -> void:
	const CHUNK := 32
	var chunks := ceili(float(n - 1) / CHUNK)
	for cz in chunks:
		for cx in chunks:
			var st := SurfaceTool.new()
			st.begin(Mesh.PRIMITIVE_TRIANGLES)
			var faces := PackedVector3Array()
			var any := false
			for z in range(cz * CHUNK, mini((cz + 1) * CHUNK, n - 1)):
				for x in range(cx * CHUNK, mini((cx + 1) * CHUNK, n - 1)):
					var i := z * n + x
					var h00 := heights[i]
					var h10 := heights[i + 1]
					var h01 := heights[i + n]
					var h11 := heights[i + n + 1]
					if maxf(maxf(h00, h10), maxf(h01, h11)) < 0.05:
						continue
					any = true
					var p00 := _point(x, z, h00)
					var p10 := _point(x + 1, z, h10)
					var p01 := _point(x, z + 1, h01)
					var p11 := _point(x + 1, z + 1, h11)
					for tri: Array in [[p00, p10, p11], [p00, p11, p01]]:
						for p: Vector3 in tri:
							var nrm := _normal(p.x, p.z)
							st.set_color(_shade(p, nrm))
							st.set_normal(nrm)
							st.set_uv(Vector2((p.x + half) / tile, (p.z + half) / tile))
							# a hair above the flat floor, so the two never flicker where they meet
							st.add_vertex(p + Vector3.UP * 0.03)
						faces.append_array(PackedVector3Array(tri))
			if not any:
				continue
			var node := MeshInstance3D.new()
			# Godot's front faces wind clockwise seen from the front; these do, seen from above
			st.index()
			node.mesh = st.commit()
			node.material_override = mat
			# open floors: the mountains are the view, so the land draws all the way out
			node.visibility_range_end = 0.0 if open else draw_distance * 1.6
			parent.add_child(node)
			var shape := ConcavePolygonShape3D.new()
			shape.set_faces(faces)
			var c := CollisionShape3D.new()
			c.shape = shape
			body.add_child(c)


## Rock where it's steep, darker crags up high, the floor's own ground where it's gentle; the riverbed is wet and dark.
var rock := Color("#7a7470")
var high := Color("#8a8898")


func _shade(p: Vector3, nrm: Vector3) -> Color:
	if not open:
		return Color.WHITE
	var steep := smoothstep(0.86, 0.7, nrm.y)
	var c := Color.WHITE.lerp(rock, steep)
	if peak > 0.0:
		c = c.lerp(high, smoothstep(peak * 0.55, peak * 0.9, p.y) * 0.8)
	if p.y < RIVER_WATER + 0.4 and _far.size() > 0 and _far[_index(p.x, p.z)] > 24.0:
		c = c * Color(0.55, 0.6, 0.62)
	return c


func _point(x: int, z: int, h: float) -> Vector3:
	return Vector3(-half + x * STEP, h, -half + z * STEP)


func _normal(x: float, z: float) -> Vector3:
	var dx := height(x + STEP, z) - height(x - STEP, z)
	var dz := height(x, z + STEP) - height(x, z - STEP)
	return Vector3(-dx, 2.0 * STEP, -dz).normalized()

