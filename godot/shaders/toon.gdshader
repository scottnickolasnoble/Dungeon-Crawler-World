// Comic shading for the whole game: three light bands, crisp shadows, and a world-space layer of brush
// marks, scratches and floor-level grime, so that no surface is ever a flat colour.
shader_type spatial;
render_mode cull_disabled, specular_disabled;

uniform vec4 albedo : source_color = vec4(1.0);
uniform sampler2D albedo_tex : source_color, filter_linear_mipmap_anisotropic, repeat_enable, hint_default_white;
uniform vec2 uv_scale = vec2(1.0);
uniform vec2 uv_offset = vec2(0.0);
uniform sampler2D paint_tex : filter_linear_mipmap, repeat_enable, hint_default_white;
uniform float paint_scale = 0.42;  // repeats per metre
uniform float paint_strength = 1.0;
uniform float grime_height = 1.15; // metres of dirt build-up above the floor

varying vec3 world_pos;
varying vec3 world_normal;

void vertex() {
	world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	world_normal = normalize(mat3(MODEL_MATRIX) * NORMAL);
}

void fragment() {
	vec3 blend = pow(abs(world_normal), vec3(6.0));
	blend /= blend.x + blend.y + blend.z;
	vec3 p = world_pos * paint_scale;
	float paint = texture(paint_tex, p.zy).r * blend.x + texture(paint_tex, p.xz).r * blend.y + texture(paint_tex, p.xy).r * blend.z;
	paint = mix(1.0, paint * 1.18, paint_strength);
	float grime = mix(0.72, 1.0, smoothstep(0.0, grime_height, world_pos.y));
	ALBEDO = albedo.rgb * COLOR.rgb * texture(albedo_tex, UV * uv_scale + uv_offset).rgb * paint * mix(1.0, grime, paint_strength);
	ROUGHNESS = 1.0;
	SPECULAR = 0.0;
}

void light() {
	float u = dot(NORMAL, LIGHT) * 0.5 + 0.5;
	float band = u < 0.36 ? 0.2 : (u < 0.62 ? 0.6 : 1.0);
	// a crisp shadow edge, like an inked shape, while the falloff of the light itself stays soft
	float att = ATTENUATION;
	float stepped = smoothstep(0.015, 0.05, att) * (0.45 + 0.55 * att);
	DIFFUSE_LIGHT += band * stepped * LIGHT_COLOR / PI;
}
