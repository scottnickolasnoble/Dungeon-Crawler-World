extends SceneTree
## Developer view: each character as Tripo made it (left) beside its rigged, animated version (right), with a
## 1.8 m pole for scale. Run: godot --path . --script res://scripts/debug/lineup.gd -- name1,name2 out.png

func _init() -> void:
	var args := OS.get_cmdline_user_args()
	var names := args[0].split(",")
	var out := args[1]
	var root := Node3D.new()
	get_root().add_child(root)
	var env := WorldEnvironment.new()
	env.environment = Environment.new()
	env.environment.background_mode = Environment.BG_COLOR
	env.environment.background_color = Color(0.55, 0.6, 0.65)
	env.environment.ambient_light_color = Color.WHITE
	env.environment.ambient_light_energy = 0.6
	root.add_child(env)
	var sun := DirectionalLight3D.new()
	sun.rotation = Vector3(-0.8, 0.5, 0)
	root.add_child(sun)
	var x := 0.0
	for n in names:
		for rig in [false, true]:
			var path := "res://models/characters/%s%s.glb" % ["rigged/" if rig else "", n]
			if not ResourceLoader.exists(path):
				x += 2.2
				continue
			var m := Models.instantiate(path)
			m.position = Vector3(x, 0, 0)
			root.add_child(m)
			if rig:
				var ap: AnimationPlayer = m.find_children("*", "AnimationPlayer", true, false)[0]
				ap.play("idle")
				ap.seek(0.5, true)
			x += 2.2
		var pole := MeshInstance3D.new()
		var box := BoxMesh.new()
		box.size = Vector3(0.05, 1.8, 0.05)
		pole.mesh = box
		pole.position = Vector3(x - 1.1, 0.9, 0)
		root.add_child(pole)
		x += 1.0
	var cam := Camera3D.new()
	cam.projection = Camera3D.PROJECTION_ORTHOGONAL
	cam.size = maxf(3.2, x * 0.32)
	cam.position = Vector3(x / 2.0 - 1.6, 1.1, 8)
	root.add_child(cam)
	for i in 20:
		await process_frame
	await RenderingServer.frame_post_draw
	get_root().get_texture().get_image().save_png(out)
	quit()
