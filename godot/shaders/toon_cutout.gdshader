// The comic shader for painted decals: graffiti, floor markings and anything with a transparent background.
// Hard-edged, so it keeps the inked look and can sit on any surface.
shader_type spatial;
render_mode cull_disabled, specular_disabled, depth_draw_opaque;

uniform vec4 albedo : source_color = vec4(1.0);
uniform sampler2D albedo_tex : source_color, filter_linear_mipmap_anisotropic, repeat_disable, hint_default_white;
uniform vec2 uv_scale = vec2(1.0);
uniform vec2 uv_offset = vec2(0.0);
uniform sampler2D paint_tex : filter_linear_mipmap, repeat_enable, hint_default_white;
uniform float paint_scale = 0.42;
uniform float paint_strength = 1.0;
uniform float grime_height = 1.15;

void fragment() {
	vec4 tex = texture(albedo_tex, UV * uv_scale + uv_offset);
	ALBEDO = albedo.rgb * tex.rgb;
	ALPHA = tex.a;
	ALPHA_SCISSOR_THRESHOLD = 0.5;
	ROUGHNESS = 1.0;
	SPECULAR = 0.0;
}

void light() {
	float u = dot(NORMAL, LIGHT) * 0.5 + 0.5;
	float band = u < 0.36 ? 0.2 : (u < 0.62 ? 0.6 : 1.0);
	float att = ATTENUATION;
	DIFFUSE_LIGHT += band * smoothstep(0.015, 0.05, att) * (0.45 + 0.55 * att) * LIGHT_COLOR / PI;
}
