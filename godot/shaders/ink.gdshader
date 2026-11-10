// The comic-book pass. Runs on a full-screen quad parented to the camera and adds:
//   - bold silhouettes and thinner interior lines, slightly wobbly like a hand-drawn brush line
//   - cross-hatching in shadows, fixed to the world so it doesn't swim as you move
//   - Ben-Day halftone dots through the shadows and mid-tones, like cheap comic printing
//   - paper grain and a hair of print misregister
//   - punchier colour
// Needs the Forward+ renderer for the normal buffer.
shader_type spatial;
render_mode unshaded, fog_disabled, depth_test_disabled, depth_draw_never, cull_disabled, shadows_disabled;

uniform sampler2D screen_tex : hint_screen_texture, filter_linear, repeat_disable;
uniform sampler2D depth_tex : hint_depth_texture, filter_nearest, repeat_disable;
uniform sampler2D normal_tex : hint_normal_roughness_texture, filter_nearest, repeat_disable;
uniform float line_px = 2.6;
uniform float saturation = 1.1;
uniform float contrast = 1.06;
uniform vec3 ink_color : source_color = vec3(0.035, 0.028, 0.045);
uniform float hatch_per_metre = 6.5;
uniform float hatch_start = 0.02;  // brightness where single hatching begins
uniform float hatch_cross = 0.008; // brightness where cross-hatching begins
uniform float hatch_reach = 15.0;  // metres before hatching fades out
uniform float dot_px = 7.0;        // halftone cell size on screen
uniform float dot_light = 0.5;     // brightness where the dots start
uniform float dot_strength = 0.6;
uniform float grain = 0.035;

void vertex() {
	POSITION = vec4(VERTEX.xy * 2.0, 1.0, 1.0);
}

float lin(vec2 uv, mat4 inv_proj) {
	float z = texture(depth_tex, uv).x;
	vec4 view = inv_proj * vec4(uv * 2.0 - 1.0, z, 1.0);
	return -view.z / view.w;
}

float hatch_line(float s, float width) {
	float w = fwidth(s);
	float aa = clamp(w * 1.5, 0.01, 0.5);
	// fades before the lines get too fine for the screen, which would look like static
	return (1.0 - smoothstep(width, width + aa, abs(fract(s) - 0.5) * 2.0)) * (1.0 - smoothstep(0.18, 0.42, w));
}

void fragment() {
	vec2 uv = SCREEN_UV;
	vec2 pixel = 1.0 / VIEWPORT_SIZE;
	mat4 ip = INV_PROJECTION_MATRIX;
	float d = lin(uv, ip);

	// a slow wander in where the line samples, which makes the ink feel drawn
	float wander = sin(uv.x * 91.0 + uv.y * 47.0) * 0.5 + sin(uv.x * 37.0 - uv.y * 113.0) * 0.5;
	float taper = mix(1.0, 0.5, smoothstep(6.0, 45.0, d));
	vec2 o = pixel * line_px * taper * (1.0 + wander * 0.22);

	float d_edge = abs(lin(uv - vec2(o.x, 0.0), ip) + lin(uv + vec2(o.x, 0.0), ip) + lin(uv + vec2(0.0, o.y), ip) + lin(uv - vec2(0.0, o.y), ip) - 4.0 * d) / max(d, 0.5);
	vec2 n_o = o * 0.62;
	vec3 nl = texture(normal_tex, uv - vec2(n_o.x, 0.0)).xyz;
	vec3 nr = texture(normal_tex, uv + vec2(n_o.x, 0.0)).xyz;
	vec3 nu = texture(normal_tex, uv + vec2(0.0, n_o.y)).xyz;
	vec3 nd = texture(normal_tex, uv - vec2(0.0, n_o.y)).xyz;
	float edge = max(smoothstep(0.02, 0.055, d_edge), smoothstep(0.4, 0.75, length(nl - nr) + length(nu - nd)));
	edge *= 1.0 - smoothstep(30.0, 85.0, d) * 0.65;

	// cheap printing: the red plate sits a hair off the others
	vec3 col = texture(screen_tex, uv).rgb;
	col.r = mix(col.r, texture(screen_tex, uv + pixel * vec2(0.8, 0.5)).r, 0.6);
	float g = dot(col, vec3(0.333));
	col = mix(vec3(g), col, saturation);
	col = max(vec3(0.0), (col - 0.18) * contrast + 0.18);

	// world-anchored cross-hatching where the picture goes dark
	float luma = dot(col, vec3(0.3, 0.59, 0.11));
	if (d < hatch_reach && luma < hatch_start) {
		vec4 vp = ip * vec4(uv * 2.0 - 1.0, texture(depth_tex, uv).x, 1.0);
		vec3 wp = (INV_VIEW_MATRIX * vec4(vp.xyz / vp.w, 1.0)).xyz;
		vec3 wn = abs(mat3(INV_VIEW_MATRIX) * (texture(normal_tex, uv).xyz * 2.0 - 1.0));
		vec2 q = wn.y > wn.x && wn.y > wn.z ? wp.xz : (wn.x > wn.z ? wp.zy : wp.xy);
		float rough = sin(q.x * 3.1 + q.y * 1.7) * 0.11;
		float fade = 1.0 - smoothstep(hatch_reach * 0.45, hatch_reach, d);
		float one = hatch_line((q.x + q.y) * hatch_per_metre + rough, 0.3) * smoothstep(hatch_start, hatch_start * 0.62, luma);
		float two = hatch_line((q.x - q.y) * hatch_per_metre + rough, 0.26) * smoothstep(hatch_cross, hatch_cross * 0.55, luma);
		col = mix(col, ink_color, max(one, two) * fade * 0.38);
	}
	// halftone: dots on a 45-degree screen, bigger where it's darker, fading out with distance
	if (d < 140.0) {
		float lum = dot(col, vec3(0.3, 0.59, 0.11));
		float t = smoothstep(dot_light, 0.03, lum) * (1.0 - smoothstep(70.0, 140.0, d));
		if (t > 0.0) {
			vec2 px = FRAGCOORD.xy / dot_px;
			vec2 r = vec2(px.x + px.y, px.x - px.y) * 0.7071;
			vec2 cell = fract(r) - 0.5;
			float radius = sqrt(t) * 0.62;
			float aa = 0.08;
			float inside = 1.0 - smoothstep(radius - aa, radius + aa, length(cell));
			col = mix(col, col * 0.42 + ink_color * 0.3, inside * dot_strength * t);
		}
	}
	// paper grain
	float n = fract(sin(dot(floor(FRAGCOORD.xy), vec2(12.9898, 78.233))) * 43758.5453);
	col *= 1.0 + (n - 0.5) * grain;
	ALBEDO = mix(col, ink_color, edge);
}
