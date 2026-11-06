// Procedural walk cycles for single-mesh sculpted characters, done in the vertex shader:
// legs swing from the hip with a foot lift, arms counter-swing, the torso rocks slightly. No skeleton needed.
// Also used for slithering (lamprey). Works with the ink outline pass via a matching normal material.
import * as THREE from '../node_modules/three/build/three.module.js';

const VERT_HEAD = `
uniform mat4 uToBody; uniform mat4 uFromBody;
uniform float uPhase, uAmt, uLift, uHip, uGap, uArmX, uShoulder, uArms, uSlither, uTime, uQuad;
`;
const VERT_BODY = `
{
  vec4 bp = uToBody * vec4(transformed, 1.0);
  if (uSlither > 0.0) {
    float k = clamp(bp.y / uHip, 0.0, 2.0);
    bp.x += sin(bp.y * 5.0 - uTime * 7.0) * uSlither * k;
    bp.z += cos(bp.y * 4.0 - uTime * 6.0) * uSlither * 0.4 * k;
  } else {
    float side = bp.x >= 0.0 ? 1.0 : -1.0;
    float ph = uPhase + (side > 0.0 ? 0.0 : 3.14159265) + (uQuad > 0.0 && bp.z > uQuad ? 3.14159265 : 0.0);
    float below = clamp((uHip - bp.y) / uHip, 0.0, 1.0);
    float sep = smoothstep(0.0, uGap, abs(bp.x));
    float legW = below * sep;
    bp.z += sin(ph) * uAmt * uHip * 0.85 * legW;
    bp.y += max(0.0, cos(ph)) * uLift * legW * legW;
    float armBand = clamp((uShoulder - bp.y) / max(0.01, uShoulder - uHip * 0.8), 0.0, 1.0) * step(uHip * 0.8, bp.y);
    float armW = smoothstep(uArmX, uArmX + 0.07, abs(bp.x)) * armBand;
    bp.z -= sin(ph) * uAmt * armW * (uShoulder - bp.y) * 0.9 * uArms;
    bp.x += sin(uPhase * 2.0) * 0.012 * uAmt * step(uHip, bp.y);
  }
  transformed = (uFromBody * bp).xyz;
}
`;

// one uniforms object per character; every material on that character shares it
export function makeRig(params = {}) {
  return {
    uPhase: { value: 0 }, uAmt: { value: 0 }, uLift: { value: params.lift ?? 0.08 }, uHip: { value: params.hip ?? 0.85 }, uGap: { value: params.gap ?? 0.05 },
    uArmX: { value: params.armX ?? 0.24 }, uShoulder: { value: params.shoulder ?? 1.35 }, uArms: { value: params.arms ?? 1 }, uSlither: { value: params.slither ?? 0 }, uTime: { value: 0 }, uQuad: { value: params.quad ?? 0 },
  };
}

function patch(mat, rig, toBody, fromBody) {
  const prev = mat.onBeforeCompile; const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.call(mat) : '';
  mat.onBeforeCompile = function (sh, r) {
    if (prev) prev.call(this, sh, r);
    Object.assign(sh.uniforms, rig); sh.uniforms.uToBody = { value: toBody }; sh.uniforms.uFromBody = { value: fromBody };
    sh.vertexShader = VERT_HEAD + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + VERT_BODY);
  };
  mat.customProgramCacheKey = () => 'walkrig|' + prevKey;
  mat.needsUpdate = true;
}

// Attach a rig to a character: `body` is the group holding the sculpt (its own transforms are the body space).
// Skips anything under an object named in `skip` (e.g. a weapon that animates separately).
export function rigCharacter(body, params = {}, skip = ['weapon', 'held'], registry = null) {
  const rig = makeRig(params);
  body.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(body.matrixWorld).invert();
  const skipSet = new Set(); for (const n of skip) { const o = body.getObjectByName(n); if (o) o.traverse((c) => skipSet.add(c)); }
  body.traverse((o) => {
    if (!o.isMesh || skipSet.has(o) || o.isInstancedMesh) return;
    const toBody = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld); const fromBody = toBody.clone().invert();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const cloned = mats.map((m) => { const c = m.clone(); if (Object.prototype.hasOwnProperty.call(m, 'onBeforeCompile')) c.onBeforeCompile = m.onBeforeCompile; patch(c, rig, toBody, fromBody); return c; });
    o.material = Array.isArray(o.material) ? cloned : cloned[0];
    // the ink outline pass renders normals; give it the same deformation
    const nm = new THREE.MeshNormalMaterial(); patch(nm, rig, toBody, fromBody); o.userData.normalMat = nm; if (registry) { o.layers.enable(2); registry.add(o); }
  });
  return rig;
}

// measure a sculpt to pick hip/shoulder/arm offsets
// height of the main sculpt (the mesh with the most vertices), so a raised weapon or a hat doesn't skew the hips
export function measure(body) { body.updateMatrixWorld(true); let best = null, n = 0; body.traverse((o) => { if (o.isMesh && o.geometry.attributes.position && o.geometry.attributes.position.count > n) { n = o.geometry.attributes.position.count; best = o; } });
  const b = new THREE.Box3().setFromObject(best || body); const s = body.scale.x || 1; const y0 = body.getWorldPosition(new THREE.Vector3()).y; return { H: Math.max(0.3, (b.max.y - y0) / s), minY: (b.min.y - y0) / s }; }
export function bipedParams(body, k = {}) { const { H } = measure(body); return { hip: H * (k.hip ?? 0.47), shoulder: H * (k.shoulder ?? 0.79), armX: H * (k.armX ?? 0.135), gap: H * 0.025, lift: H * 0.05, arms: k.arms ?? 1 }; }

// advance a rig from how far the character moved this frame
export function stepRig(rig, moved, dt, t, stride) {
  const speed = moved / Math.max(dt, 1e-4);
  rig.uPhase.value += (moved / stride) * Math.PI * 2;
  const target = Math.min(0.55, speed * 0.16);
  rig.uAmt.value += (target - rig.uAmt.value) * Math.min(1, dt * 10);
  rig.uTime.value = t;
  return rig.uAmt.value;
}
