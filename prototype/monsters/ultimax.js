// Ulti-Max: Neighbourhood boss of the Gladiator Bots. A fully articulated rig built from armour parts.
// Joints: root -> pelvis -> torso -> head / shoulders -> elbows -> blades; pelvis -> hips -> knees -> feet.
import * as THREE from '../node_modules/three/build/three.module.js';
import { canvasTex, grimeTex, rnd } from '../sculpt.js';

export function ultiMax() {
  const plate = new THREE.MeshPhysicalMaterial({ map: grimeTex('#6a6e78', { rust: 25, scratches: 4500 }), metalness: 0.95, roughness: 0.28, clearcoat: 0.4, emissive: new THREE.Color('#000000') });
  const paint = new THREE.MeshPhysicalMaterial({ map: grimeTex('#a8141a', { rust: 15, scratches: 3500 }), metalness: 0.45, roughness: 0.3, clearcoat: 0.9, emissive: new THREE.Color('#000000') });
  const gold = new THREE.MeshStandardMaterial({ color: '#d0a040', metalness: 1, roughness: 0.22, emissive: new THREE.Color('#000000') });
  const dark = new THREE.MeshStandardMaterial({ color: '#16161a', metalness: 0.8, roughness: 0.45 });
  const bladeM = new THREE.MeshPhysicalMaterial({ map: grimeTex('#d8dce4', { rust: 4, scratches: 6000 }), metalness: 1, roughness: 0.12, clearcoat: 1, emissive: new THREE.Color('#000000') });
  const eyeM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff2a1a').multiplyScalar(3) });
  const coreM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff6a1a').multiplyScalar(2.5) });
  const mats = { plate, paint, gold, dark, bladeM };
  const M = (geo, m, p = [0, 0, 0], r = [0, 0, 0], s) => { const o = new THREE.Mesh(geo, m); o.position.set(...p); o.rotation.set(...r); if (s) o.scale.set(...s); o.castShadow = o.receiveShadow = true; return o; };
  const J = (parent, p) => { const j = new THREE.Group(); j.position.set(...p); parent.add(j); return j; };

  const root = new THREE.Group();
  const pelvis = J(root, [0, 1.12, 0]);
  pelvis.add(M(new THREE.BoxGeometry(0.5, 0.2, 0.32), dark));
  pelvis.add(M(new THREE.BoxGeometry(0.56, 0.12, 0.36), paint, [0, 0.06, 0]));
  for (const sx of [-1, 1]) pelvis.add(M(new THREE.BoxGeometry(0.2, 0.28, 0.06), plate, [sx * 0.2, -0.16, 0.17], [0.15, 0, sx * 0.12])); // tassets
  // legs
  const legs = {};
  for (const [k, sx] of [['L', 1], ['R', -1]]) {
    const hip = J(pelvis, [sx * 0.2, -0.08, 0]);
    hip.add(M(new THREE.SphereGeometry(0.09, 16, 12), dark));
    hip.add(M(new THREE.CylinderGeometry(0.075, 0.065, 0.48, 14), dark, [0, -0.26, 0]));
    hip.add(M(new THREE.BoxGeometry(0.19, 0.34, 0.2), paint, [0, -0.24, 0.03]));
    const knee = J(hip, [0, -0.52, 0]);
    knee.add(M(new THREE.SphereGeometry(0.085, 16, 12), gold, [0, 0, 0.04]));
    knee.add(M(new THREE.CylinderGeometry(0.06, 0.055, 0.5, 14), dark, [0, -0.25, 0]));
    knee.add(M(new THREE.BoxGeometry(0.16, 0.44, 0.15), plate, [0, -0.25, 0.04]));
    const foot = J(knee, [0, -0.52, 0]);
    foot.add(M(new THREE.BoxGeometry(0.2, 0.08, 0.36), plate, [0, -0.02, 0.07]));
    foot.add(M(new THREE.BoxGeometry(0.18, 0.05, 0.1), gold, [0, 0.02, 0.22]));
    legs[k] = { hip, knee, foot };
  }
  // torso
  const torso = J(pelvis, [0, 0.12, 0]);
  torso.add(M(new THREE.CylinderGeometry(0.17, 0.2, 0.25, 12), dark, [0, 0.12, 0])); // waist
  torso.add(M(new THREE.CylinderGeometry(0.36, 0.24, 0.55, 8), plate, [0, 0.5, 0], [0, Math.PI / 8, 0]));
  torso.add(M(new THREE.BoxGeometry(0.56, 0.4, 0.1), paint, [0, 0.56, 0.27], [-0.08, 0, 0]));
  const core = M(new THREE.CircleGeometry(0.08, 24), coreM, [0, 0.5, 0.325]); torso.add(core);
  torso.add(M(new THREE.TorusGeometry(0.095, 0.02, 8, 24), gold, [0, 0.5, 0.322]));
  const crowd = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#050505'; c.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { c.fillStyle = i < 13 ? (i < 6 ? '#2aff4a' : i < 10 ? '#ffd020' : '#ff2a2a') : '#202020'; c.fillRect(8 + i * 15, 12, 11, 40); } });
  torso.add(M(new THREE.PlaneGeometry(0.34, 0.08), new THREE.MeshBasicMaterial({ map: crowd }), [0, 0.7, 0.316], [-0.08, 0, 0]));
  for (const sx of [-1, 1]) { const vent = M(new THREE.CylinderGeometry(0.035, 0.04, 0.14, 12), dark, [sx * 0.16, 0.78, -0.24], [-0.5, 0, 0]); torso.add(vent); }
  // head
  const neck = J(torso, [0, 0.8, 0]);
  neck.add(M(new THREE.CylinderGeometry(0.07, 0.09, 0.1, 12), dark));
  const head = J(neck, [0, 0.14, 0]);
  head.add(M(new THREE.SphereGeometry(0.15, 24, 18), plate, [0, 0.02, 0], [0, 0, 0], [1, 1.12, 1.08]));
  head.add(M(new THREE.BoxGeometry(0.24, 0.07, 0.1), dark, [0, 0.02, 0.12]));
  const visor = M(new THREE.BoxGeometry(0.2, 0.025, 0.04), eyeM, [0, 0.025, 0.165]); head.add(visor);
  for (let i = 0; i < 11; i++) head.add(M(new THREE.BoxGeometry(0.022, 0.2, 0.045), gold, [0, 0.2 + Math.sin((i / 10) * Math.PI) * 0.07, -0.17 + i * 0.035], [(i - 5) * -0.13, 0, 0])); // crest
  head.add(M(new THREE.BoxGeometry(0.2, 0.04, 0.05), plate, [0, -0.09, 0.13])); // jaw guard
  // arms with forearm blades
  const arms = {};
  for (const [k, sx] of [['L', 1], ['R', -1]]) {
    const sh = J(torso, [sx * 0.42, 0.66, 0]);
    sh.add(M(new THREE.SphereGeometry(0.09, 16, 12), dark));
    sh.add(M(new THREE.SphereGeometry(0.17, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), paint, [sx * 0.03, 0.03, 0], [0, 0, sx * -0.45]));
    for (let i = 0; i < 3; i++) sh.add(M(new THREE.ConeGeometry(0.025, 0.12, 6), gold, [sx * (0.06 + i * 0.04), 0.13 - i * 0.02, -0.04 + i * 0.04], [0, 0, sx * -0.6]));
    sh.add(M(new THREE.CylinderGeometry(0.058, 0.05, 0.34, 14), dark, [0, -0.19, 0]));
    sh.add(M(new THREE.BoxGeometry(0.13, 0.24, 0.13), plate, [0, -0.2, 0]));
    const el = J(sh, [0, -0.38, 0]);
    el.add(M(new THREE.SphereGeometry(0.06, 14, 10), gold));
    el.add(M(new THREE.CylinderGeometry(0.052, 0.045, 0.32, 14), dark, [0, -0.17, 0]));
    el.add(M(new THREE.BoxGeometry(0.14, 0.3, 0.14), paint, [0, -0.17, 0]));
    el.add(M(new THREE.SphereGeometry(0.055, 14, 10), dark, [0, -0.36, 0])); // fist
    // blade housing on the outside of the forearm, blade extends past the fist
    const housing = J(el, [sx * 0.08, -0.2, 0]);
    housing.add(M(new THREE.BoxGeometry(0.03, 0.26, 0.08), dark));
    const blade = J(housing, [0, -0.1, 0]);
    const shape = new THREE.Shape(); shape.moveTo(-0.04, 0); shape.lineTo(0.035, 0); shape.quadraticCurveTo(0.06, -0.45, 0.0, -0.82); shape.quadraticCurveTo(-0.02, -0.4, -0.04, 0);
    blade.add(M(new THREE.ExtrudeGeometry(shape, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.005, bevelSegments: 1 }), bladeM, [0, 0, 0], [0, Math.PI / 2, 0]));
    arms[k] = { sh, el, blade, housing };
  }
  // net launcher on the left forearm
  const launcher = M(new THREE.CylinderGeometry(0.05, 0.06, 0.24, 14), dark, [-0.1, -0.14, 0.06], [0.0, 0, 0]); arms.L.el.add(launcher);
  const muzzle = J(arms.L.el, [-0.1, -0.28, 0.06]);
  // glows
  const eyeLight = new THREE.PointLight('#ff2a1a', 1.5, 2); eyeLight.position.set(0, 0.03, 0.4); head.add(eyeLight);
  const coreLight = new THREE.PointLight('#ff6a1a', 2, 2.5); coreLight.position.set(0, 0.5, 0.6); torso.add(coreLight);
  return { root, pelvis, torso, neck, head, arms, legs, core, coreM, eyeM, eyeLight, coreLight, mats, muzzle, visor };
}
