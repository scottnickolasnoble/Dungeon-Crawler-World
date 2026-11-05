// Tier 1 monsters (Floors 1-3). Each export returns a THREE.Group, feet/base at y=0, facing +z.
import * as THREE from '../node_modules/three/build/three.module.js';
import { vnoise, fbm, clamp01, rnd, smin, smax, ell, rcone, sph, rbox, chain, buildMesh, skinMaterial, canvasTex, eyeTexture, eyeMesh, grimeTex, toothMat, clawMat } from '../sculpt.js';

const C = (h) => new THREE.Color(h);

// ============ DRAIN LAMPREY ============
// A slimy eel rising out of a floor grate, round sucker mouth ringed with teeth.
export function drainLamprey() {
  const g = new THREE.Group();
  const spine = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    spine.push([Math.sin(t * 3.2) * 0.18 * (1 - t), -0.25 + t * 1.32 - t * t * 0.1, -0.35 + t * t * 0.62]);
  }
  const R = spine.map((_, i) => 0.085 + Math.sin((i / 14) * 3.1) * 0.035 + (i > 11 ? 0.02 : 0));
  const head = spine[14], mouthZ = head[2] + 0.1;
  const sdf = (x, y, z) => {
    let d = chain(x, y, z, spine, R, 0.06);
    // flared oral disc facing +z
    const qx = Math.hypot(x - head[0], y - head[1]) - 0.105, qz = z - mouthZ;
    d = smin(d, Math.hypot(qx, qz) - 0.04, 0.05);
    d = smax(d, -ell(x, y, z, head[0], head[1], mouthZ + 0.05, 0.1, 0.1, 0.09), 0.02); // the cup
    // gill holes, 7 per side
    for (let i = 0; i < 7; i++) {
      const p = spine[12 - Math.floor(i / 3)], off = (i % 3) * 0.045;
      d = smax(d, -sph(Math.abs(x - p[0]), y, z, R[12] * 0.95, p[1] + 0.03 - off * 0.5, p[2] - 0.1 - i * 0.03, 0.013), 0.006);
    }
    // dorsal fin ridge
    if (y > 0.25) d = smin(d, chain(x, y - 0.07, z, spine.slice(5, 12), R.slice(5, 12).map((r) => r * 0.18), 0.02), 0.03);
    if (Math.abs(d) < 0.03) d += fbm(x * 14, y * 14, z * 14) * 0.004 + (Math.abs(vnoise(x * 50, y * 80, z * 50)) - 0.3) * 0.0016;
    return d;
  };
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    const dorsal = clamp01(ny * 0.5 + 0.5 - nz * 0.2);
    c.copy(C('#9a8a96')).lerp(C('#3a2c3c'), dorsal * 0.85);
    const m = fbm(x * 18, y * 18, z * 18); if (m > 0.15) c.lerp(C('#1e1520'), (m - 0.15) * 1.6);
    const mouthDist = Math.hypot(x - head[0], y - head[1]);
    if (z > mouthZ - 0.03 && mouthDist < 0.1) c.copy(C('#6a1a22')).lerp(C('#2a0508'), clamp01(1 - mouthDist / 0.1)); // throat
    else if (z > mouthZ - 0.06 && mouthDist < 0.15) c.lerp(C('#b06a70'), 0.5); // lips
    c.multiplyScalar(ao);
  };
  const skin = new THREE.Mesh(buildMesh(sdf, [-0.4, -0.3, -0.6], [0.4, 1.35, 0.6], 0.008, col),
    skinMaterial({ roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.3, sheenColor: '#7a5a8a', pore: 0.5 }));
  g.add(skin);
  // concentric rings of hooked teeth pointing into the throat
  const tm = toothMat(); tm.color = C('#d9b860');
  for (let ring = 0; ring < 4; ring++) {
    const rr = 0.112 - ring * 0.022, n = 16 - ring * 3, len = 0.05 - ring * 0.007;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 0.3;
      const t = new THREE.Mesh(new THREE.ConeGeometry(0.009 + len * 0.12, len, 7), tm);
      t.position.set(head[0] + Math.cos(a) * rr, head[1] + Math.sin(a) * rr, mouthZ + 0.025 - ring * 0.018);
      // point toward the centre and slightly back
      t.lookAt(head[0], head[1], mouthZ - 0.15); t.rotateX(Math.PI / 2);
      g.add(t);
    }
  }
  // small beady eyes behind the disc
  const em = new THREE.MeshPhysicalMaterial({ color: '#0a0608', roughness: 0.05, clearcoat: 1 });
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.014, 16, 12), em); e.position.set(head[0] + sx * 0.085, head[1] + 0.06, head[2] - 0.02); g.add(e); }
  // slime strands hanging from the lips
  const slime = new THREE.MeshPhysicalMaterial({ color: '#c8d0b0', roughness: 0.05, transmission: 0.6, thickness: 0.02, transparent: true, opacity: 0.8 });
  for (const [ax, len] of [[-0.06, 0.18], [0.04, 0.12], [0.09, 0.22]]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(head[0] + ax, head[1] - 0.12, mouthZ + 0.02), new THREE.Vector3(head[0] + ax * 1.4, head[1] - 0.12 - len * 0.5, mouthZ + 0.07), new THREE.Vector3(head[0] + ax, head[1] - 0.12 - len, mouthZ + 0.03)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.004, 6), slime));
  }
  // the floor grate it comes out of
  const iron = new THREE.MeshStandardMaterial({ map: grimeTex('#3a3836'), metalness: 0.85, roughness: 0.6 });
  for (let i = -3; i <= 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.8), iron); b.position.set(i * 0.1, 0.0, -0.3); if (i !== 0 && Math.abs(i) !== 1) g.add(b); }
  for (let j = 0; j < 2; j++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.03), iron); b.position.set(0, 0.0, -0.68 + j * 0.76); g.add(b); }
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshBasicMaterial({ color: '#050304' })); hole.rotation.x = -Math.PI / 2; hole.position.set(0.05, 0.002, -0.32); g.add(hole);
  return g;
}

// ============ MOP WIGHT ============
// An undead janitor: skull face, ribcage under a rotting work shirt, lower body a mass of filthy mop strings.
export function mopWight() {
  const g = new THREE.Group();
  const bone = (x, y, z) => {
    const ax = Math.abs(x);
    // skull
    let d = ell(x, y, z, 0, 1.78, 0.0, 0.1, 0.115, 0.12);
    d = smin(d, ell(x, y, z, 0, 1.69, 0.06, 0.075, 0.06, 0.07), 0.04); // maxilla
    d = smax(d, -sph(ax, y, z, 0.04, 1.75, 0.1, 0.03), 0.01); // eye sockets
    d = smax(d, -ell(x, y, z, 0, 1.7, 0.125, 0.014, 0.025, 0.03), 0.006); // nasal cavity
    d = smax(d, -sph(ax, y, z, 0.09, 1.7, 0.04, 0.035), 0.03); // gaunt cheeks
    d = smin(d, rcone(ax, y, z, 0.0, 1.785, 0.105, 0.075, 1.78, 0.08, 0.016, 0.012), 0.02); // brow
    // dropped jaw
    d = smin(d, rcone(ax, y, z, 0.07, 1.68, 0.0, 0.03, 1.57, 0.08, 0.016, 0.014), 0.015);
    d = smin(d, rcone(x, y, z, -0.03, 1.57, 0.08, 0.03, 1.57, 0.08, 0.016, 0.016), 0.015);
    // spine + neck
    for (let i = 0; i < 12; i++) d = smin(d, sph(x, y, z, 0, 1.62 - i * 0.055, -0.04 - Math.sin(i * 0.3) * 0.03, 0.022), 0.02);
    // ribs
    for (let i = 0; i < 6; i++) {
      const yy = 1.43 - i * 0.05, w = 0.12 + Math.sin(i * 0.5) * 0.03;
      d = smin(d, chain(ax, y, z, [[0.01, yy, -0.06], [w, yy - 0.02, -0.02], [w * 0.85, yy - 0.05, 0.08], [0.02, yy - 0.07, 0.11]], [0.009, 0.01, 0.009, 0.008], 0.01), 0.008);
    }
    d = smin(d, rcone(x, y, z, 0, 1.45, 0.11, 0, 1.25, 0.12, 0.014, 0.01), 0.01); // sternum
    // pelvis hint
    d = smin(d, ell(x, y, z, 0, 1.08, -0.02, 0.12, 0.05, 0.08), 0.03);
    // arms: skeletal, right arm gripping mop handle, left reaching out
    d = smin(d, chain(x, y, z, [[-0.16, 1.47, -0.02], [-0.25, 1.24, 0.06], [-0.23, 1.1, 0.24]], [0.024, 0.018, 0.014], 0.02), 0.02);
    d = smin(d, chain(x, y, z, [[0.16, 1.47, -0.02], [0.3, 1.32, 0.15], [0.33, 1.38, 0.4]], [0.024, 0.018, 0.014], 0.02), 0.02);
    // bony fingers on the reaching hand
    for (let f = 0; f < 4; f++) d = Math.min(d, chain(x, y, z, [[0.33, 1.38, 0.4], [0.31 + f * 0.015, 1.38 - 0.02 + f * 0.012, 0.47], [0.3 + f * 0.018, 1.33 + f * 0.012, 0.51]], [0.007, 0.006, 0.004], 0.005));
    d = smin(d, sph(x, y, z, -0.23, 1.1, 0.25, 0.03), 0.02);
    if (Math.abs(d) < 0.02) d += fbm(x * 40, y * 40, z * 40) * 0.0025;
    return d;
  };
  // rotting work shirt over shoulders and back, ragged hem
  const shirt = (x, y, z) => {
    let d = ell(x, y, z, 0, 1.36, -0.01, 0.19, 0.17, 0.12);
    d = smin(d, ell(Math.abs(x), y, z, 0.15, 1.44, -0.01, 0.07, 0.05, 0.07), 0.05);
    d = Math.max(d, -ell(x, y, z, 0, 1.33, 0.08, 0.13, 0.15, 0.1)); // torn-open front
    d = Math.max(d, -ell(x, y, z, 0, 1.36, -0.01, 0.17, 0.155, 0.105)); // hollow shell
    const hem = 1.2 + vnoise(x * 30, 0, z * 30) * 0.05;
    d = Math.max(d, hem - y);
    d = Math.max(d, y - 1.5);
    if (Math.abs(d) < 0.02) d += vnoise(x * 60, y * 25, z * 60) * 0.003;
    return d;
  };
  const sdf = (x, y, z) => Math.min(bone(x, y, z), shirt(x, y, z));
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    if (shirt(x, y, z) < bone(x, y, z)) {
      c.copy(C('#4a5a62')).lerp(C('#2a2620'), clamp01(fbm(x * 12, y * 12, z * 12) + 0.3) * 0.8); // stained grey-blue workwear
      if (vnoise(x * 25, y * 25, z * 25) > 0.55) c.lerp(C('#5a3a1a'), 0.6); // old stains
    } else {
      c.copy(C('#b8a88a')).lerp(C('#5a4a38'), clamp01(fbm(x * 20, y * 20, z * 20) * 0.8 + 0.4));
      if (y > 1.55) c.lerp(C('#7a6a50'), 0.3);
    }
    c.multiplyScalar(ao);
  };
  const body = new THREE.Mesh(buildMesh(sdf, [-0.3, 0.98, -0.2], [0.42, 1.92, 0.56], 0.0065, col), skinMaterial({ roughness: 0.75, clearcoat: 0.1, sheen: 0.2, sheenColor: '#6a6a5a', pore: 0.6 }));
  g.add(body);
  // glowing eyes deep in the sockets
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color('#7affd8').multiplyScalar(3) }));
    e.position.set(sx * 0.04, 1.75, 0.085); g.add(e);
  }
  const glow = new THREE.PointLight('#7affd8', 0.8, 0.6); glow.position.set(0, 1.75, 0.2); g.add(glow);
  // teeth along upper jaw
  const tm = toothMat(); tm.color = C('#a89a6a');
  for (let i = 0; i < 8; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.018, 0.008), tm); const a = (i / 7 - 0.5) * 1.6; t.position.set(Math.sin(a) * 0.05, 1.655, 0.07 + Math.cos(a) * 0.045); t.rotation.y = a; g.add(t); }
  // the mop: handle in the right hand, head trailing on the floor
  const wood = new THREE.MeshPhysicalMaterial({ map: grimeTex('#6a5a40', { rust: 10 }), roughness: 0.7 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.5, 12), wood);
  handle.position.set(-0.23, 0.75, 0.32); handle.rotation.set(0.15, 0, -0.05); g.add(handle);
  // lower body: hundreds of filthy mop strings hanging from the pelvis, plus the mop head strands
  const stringMat = new THREE.MeshPhysicalMaterial({ map: grimeTex('#8a8070', { rust: 30, scratches: 800 }), roughness: 0.95, sheen: 0.5, sheenColor: C('#9a9080') });
  const addStrand = (x0, y0, z0, len, sway, r) => {
    const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push(new THREE.Vector3(x0 + vnoise(x0 * 9, t * 3, z0 * 9) * sway * t, y0 - len * t, z0 + vnoise(z0 * 9, t * 3 + 4, x0 * 9) * sway * t)); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, r, 5), stringMat));
  };
  for (let i = 0; i < 170; i++) { const a = rnd() * Math.PI * 2, rr = 0.06 + rnd() * 0.08; addStrand(Math.cos(a) * rr, 1.12, Math.sin(a) * rr * 0.8 - 0.02, 0.75 + rnd() * 0.25, 0.22, 0.008 + rnd() * 0.004); }
  for (let i = 0; i < 40; i++) { const a = rnd() * Math.PI * 2; addStrand(-0.23 + 0.2 * 0.15 + Math.cos(a) * 0.03, 0.12, 0.43 + Math.sin(a) * 0.03, 0.12, 0.3, 0.007); }
  // puddle of dirty water
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), new THREE.MeshPhysicalMaterial({ color: '#2a2a20', roughness: 0.02, metalness: 0.2, clearcoat: 1 }));
  puddle.rotation.x = -Math.PI / 2; puddle.position.y = 0.003; puddle.scale.set(1.2, 0.8, 1); g.add(puddle);
  return g;
}

// ============ FLUORESCENT MOTH ============
// Dog-sized moth: furred thorax, segmented abdomen with a glowing tip, huge compound eyes, feathered antennae.
function mothWingTex(hind) {
  return canvasTex(512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.save(); g.beginPath();
    if (!hind) { g.moveTo(10, 250); g.bezierCurveTo(120, 40, 380, 20, 500, 60); g.bezierCurveTo(470, 220, 380, 330, 300, 360); g.bezierCurveTo(200, 380, 80, 330, 10, 260); }
    else { g.moveTo(10, 240); g.bezierCurveTo(100, 200, 300, 220, 400, 300); g.bezierCurveTo(420, 420, 300, 500, 200, 480); g.bezierCurveTo(100, 440, 30, 340, 10, 260); }
    g.closePath(); g.clip();
    const gr = g.createLinearGradient(0, 250, w, 250); gr.addColorStop(0, '#6a5a48'); gr.addColorStop(0.6, '#a8987a'); gr.addColorStop(1, '#5a4a3a');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? 40 : 200},${rnd() < 0.5 ? 30 : 180},${rnd() < 0.5 ? 20 : 140},${rnd() * 0.18})`; g.fillRect(rnd() * w, rnd() * h, 2, 1 + rnd() * 3); }
    g.strokeStyle = 'rgba(40,28,18,0.7)'; g.lineWidth = 2;
    for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(15, 250); g.quadraticCurveTo(200, 250 - 60 + i * 18, 480 - (hind ? 120 : 0), (hind ? 200 : 40) + i * (hind ? 32 : 36)); g.stroke(); }
    // wavy bands
    g.strokeStyle = 'rgba(30,20,12,0.55)'; g.lineWidth = 9;
    for (const bx of [150, 300]) { g.beginPath(); for (let y = 0; y < h; y += 10) g.lineTo(bx + Math.sin(y * 0.05) * 14, y); g.stroke(); }
    // eyespot
    const ex = hind ? 260 : 320, ey = hind ? 360 : 190;
    for (const [r, c] of [[46, '#1a1208'], [38, '#c8b070'], [28, '#5a2a1a'], [14, '#0a0604']]) { g.fillStyle = c; g.beginPath(); g.arc(ex, ey, r, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,255,230,0.85)'; g.beginPath(); g.arc(ex - 6, ey - 6, 5, 0, 7); g.fill();
    // fringe
    g.restore();
  });
}
export function fluorescentMoth() {
  const g = new THREE.Group();
  const Y = 1.15;
  const sdf = (x, y, z) => {
    const ax = Math.abs(x);
    let d = ell(x, y, z, 0, Y, 0.0, 0.08, 0.075, 0.1); // thorax
    d = smin(d, ell(x, y, z, 0, Y + 0.0, 0.12, 0.055, 0.055, 0.05), 0.03); // head
    for (let i = 0; i < 7; i++) { const t = i / 6; d = smin(d, ell(x, y, z, 0, Y - 0.02 - t * 0.08, -0.12 - t * 0.27, 0.07 - t * 0.035, 0.065 - t * 0.03, 0.05), 0.012); } // abdomen segments
    // legs
    for (let i = 0; i < 3; i++) d = Math.min(d, chain(ax, y, z, [[0.04, Y - 0.05, 0.06 - i * 0.06], [0.14, Y - 0.08, 0.1 - i * 0.08], [0.2, Y - 0.25, 0.14 - i * 0.12]], [0.009, 0.007, 0.004], 0.01));
    // proboscis coil
    d = Math.min(d, rcone(x, y, z, 0, Y - 0.03, 0.16, 0, Y - 0.08, 0.17, 0.005, 0.004));
    if (Math.abs(d) < 0.03 && z > -0.13) d += (Math.abs(vnoise(x * 160, y * 160, z * 160)) - 0.3) * 0.009; // fur
    return d;
  };
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    c.copy(C('#7a6a50')).lerp(C('#c8b890'), clamp01(vnoise(x * 90, y * 90, z * 90) + 0.3));
    if (z < -0.12) { const seg = Math.abs(Math.sin((z + 0.12) * 75)); c.lerp(C('#3a2a1a'), (1 - seg) * 0.7); }
    if (z < -0.33) c.lerp(C('#c8ffb0'), clamp01((-0.33 - z) * 14)); // glowing tip
    c.multiplyScalar(ao);
  };
  g.add(new THREE.Mesh(buildMesh(sdf, [-0.28, Y - 0.32, -0.45], [0.28, Y + 0.12, 0.24], 0.0045, col), skinMaterial({ roughness: 0.85, clearcoat: 0, sheen: 1, sheenColor: '#e8d8b0', pore: 0.3 })));
  // glowing abdomen light
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#b8ff9a').multiplyScalar(2.5) }));
  tip.position.set(0, Y - 0.1, -0.41); g.add(tip);
  const tl = new THREE.PointLight('#a8ff8a', 2.5, 1.6); tl.position.set(0, Y - 0.12, -0.42); g.add(tl);
  // compound eyes: dark faceted domes
  const eyeMat = new THREE.MeshPhysicalMaterial({ color: '#2a0a08', roughness: 0.2, clearcoat: 1, iridescence: 0.6, iridescenceIOR: 1.6, flatShading: true });
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.IcosahedronGeometry(0.034, 3), eyeMat); e.position.set(sx * 0.04, Y + 0.01, 0.14); g.add(e); }
  // feathered antennae
  const antMat = new THREE.MeshPhysicalMaterial({ color: '#8a7050', roughness: 0.8, sheen: 1, sheenColor: C('#d8c8a0') });
  for (const sx of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(sx * 0.02, Y + 0.04, 0.16), new THREE.Vector3(sx * 0.09, Y + 0.16, 0.24), new THREE.Vector3(sx * 0.2, Y + 0.24, 0.26)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.004, 6), antMat));
    for (let i = 2; i < 30; i++) {
      const p = curve.getPoint(i / 30), len = 0.04 * Math.sin((i / 30) * Math.PI);
      for (const side of [-1, 1]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0008, len, 3), antMat); b.position.copy(p).add(new THREE.Vector3(0, side * len * 0.4, -len * 0.3)); b.rotation.x = side * 0.9; g.add(b); }
    }
  }
  // wings, spread
  const fore = mothWingTex(false), hind = mothWingTex(true);
  const wingMat = (t) => new THREE.MeshPhysicalMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9, sheen: 1, sheenColor: C('#e8d8c0') });
  for (const sx of [-1, 1]) {
    for (const [tex, sz, ry, rz, dz] of [[fore, 0.62, 0.15, 0.25, 0.0], [hind, 0.48, -0.25, 0.1, -0.08]]) {
      const geo = new THREE.PlaneGeometry(sz, sz, 16, 16); const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const u = p.getX(i) / sz + 0.5; p.setZ(i, Math.sin(u * Math.PI) * 0.03 + vnoise(p.getX(i) * 8, p.getY(i) * 8, 1) * 0.008); }
      geo.computeVertexNormals(); geo.translate(sz / 2, 0, 0);
      const w = new THREE.Mesh(geo, wingMat(tex)); w.rotation.set(-Math.PI / 2 + 0.25, 0, 0);
      const holder = new THREE.Group(); holder.add(w); holder.position.set(sx * 0.05, Y + 0.03, dz); holder.scale.x = sx; holder.rotation.set(0, sx * ry, sx * rz);
      g.add(holder);
    }
  }
  return g;
}

// ============ VENDING MIMIC ============
// A snack machine whose upper half has hinged open like a jaw: teeth along the seam, a wet tongue, an eye in the coin slot.
export function vendingMimic() {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ map: grimeTex('#8a1a14', { rust: 90 }), roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.4, metalness: 0.3 });
  const chrome = new THREE.MeshStandardMaterial({ map: grimeTex('#9a9ca0', { rust: 20 }), metalness: 0.9, roughness: 0.35 });
  const W = 0.9, D = 0.78, HING = 0.92;
  // lower cabinet
  const lower = new THREE.Mesh(new THREE.BoxGeometry(W, HING, D), paint); lower.position.set(0, HING / 2, 0); g.add(lower);
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.16, 0.05), new THREE.MeshStandardMaterial({ color: '#111', metalness: 0.5, roughness: 0.6 })); tray.position.set(-0.05, 0.25, D / 2 + 0.01); g.add(tray);
  // upper cabinet, hinged at the back and gaping open
  const upper = new THREE.Group(); upper.position.set(0, HING, -D / 2); upper.rotation.x = -0.42; g.add(upper);
  const ub = new THREE.Mesh(new THREE.BoxGeometry(W, 0.95, D), paint); ub.position.set(0, 0.475, D / 2); upper.add(ub);
  // glass front with snack rows behind it
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.72, 0.02), new THREE.MeshPhysicalMaterial({ color: '#99aaaa', roughness: 0.05, transparent: true, opacity: 0.18, clearcoat: 1 }));
  win.position.set(-0.08, 0.5, D + 0.075); upper.add(win);
  for (const [fx, fy, fw, fh] of [[-0.08, 0.875, 0.66, 0.04], [-0.08, 0.125, 0.66, 0.04], [-0.395, 0.5, 0.03, 0.76], [0.235, 0.5, 0.03, 0.76]]) { const fr = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.09), chrome); fr.position.set(fx, fy, D + 0.04); upper.add(fr); }
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.72, 0.01), new THREE.MeshStandardMaterial({ color: '#141210' })); back.position.set(-0.08, 0.5, D + 0.006); upper.add(back);
  const snackCols = ['#e8b020', '#3a6ad8', '#d83a2a', '#2aa860', '#e86a20', '#8a3ad8'];
  for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.12, 0.03), new THREE.MeshPhysicalMaterial({ color: snackCols[(r * 5 + k) % 6], roughness: 0.3, clearcoat: 0.8 }));
    s.position.set(-0.29 + k * 0.105, 0.24 + r * 0.17, D + 0.035); s.rotation.z = (rnd() - 0.5) * 0.3; upper.add(s);
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.003, 4, 12), chrome); coil.position.set(s.position.x, s.position.y - 0.07, D + 0.035); coil.rotation.x = Math.PI / 2; upper.add(coil);
  }
  // keypad panel + coin slot with an eye in it
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.4, 0.02), chrome); pad.position.set(0.35, 0.55, D + 0.01); upper.add(pad);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.03), new THREE.MeshStandardMaterial({ color: '#050404' })); slot.position.set(0.35, 0.68, D + 0.015); upper.add(slot);
  const eye = eyeMesh(eyeTexture({ sclera: '#e0d8b0', iris: ['#ffe000', '#e8a000', '#8a5000', '#1a0a00'], pupil: 'goat' }), 0.028, 0.25, '#ffcc00');
  eye.position.set(0.35, 0.68, D + 0.01); upper.add(eye);
  // organic interior: gums, flesh cavity and tongue, sculpted
  const sdf = (x, y, z) => {
    let d = rbox(x, y, z, 0, HING + 0.02, 0.0, W / 2 - 0.04, 0.1, D / 2 - 0.04, 0.05); // flesh lining between the halves
    // tongue lolling out over the coin tray
    d = smin(d, chain(x, y, z, [[0.0, HING + 0.03, -0.05], [0.02, HING + 0.06, 0.3], [0.05, HING - 0.02, 0.48], [0.07, HING - 0.25, 0.52]], [0.12, 0.11, 0.09, 0.07], 0.05), 0.05);
    d = smax(d, -rcone(x, y, z, 0.02, HING + 0.17, 0.0, 0.06, HING + 0.1, 0.5, 0.012, 0.01), 0.02); // tongue groove
    if (Math.abs(d) < 0.03) d += fbm(x * 20, y * 20, z * 20) * 0.006 + (Math.abs(vnoise(x * 70, y * 70, z * 70)) - 0.3) * 0.002;
    return d;
  };
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    c.copy(C('#9a2a32')).lerp(C('#4a0a10'), clamp01(fbm(x * 15, y * 15, z * 15) + 0.4));
    if (ny > 0.5) c.lerp(C('#c85a60'), 0.35);
    c.multiplyScalar(ao);
  };
  g.add(new THREE.Mesh(buildMesh(sdf, [-0.5, HING - 0.4, -0.45], [0.5, HING + 0.3, 0.65], 0.008, col), skinMaterial({ roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.4, sheenColor: '#ff6a6a', pore: 0.6 })));
  // jagged teeth along the lower jaw seam and the upper lip
  const tm = toothMat(); tm.color = C('#d8c890');
  for (let i = 0; i < 13; i++) {
    const x = -W / 2 + 0.06 + i * ((W - 0.12) / 12), h = 0.06 + rnd() * 0.07;
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.022, h, 5), tm); t.position.set(x, HING + h / 2, D / 2 - 0.03); t.rotation.z = (rnd() - 0.5) * 0.4; g.add(t);
    const u = new THREE.Mesh(new THREE.ConeGeometry(0.02, h * 0.9, 5), tm); u.position.set(x, -h * 0.4, D - 0.03); u.rotation.x = Math.PI; upper.add(u);
  }
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.08, 5), tm); t.position.set(sx * (W / 2 - 0.04), HING + 0.04, D / 2 - 0.1 - i * 0.11); g.add(t); }
  // drool
  const slime = new THREE.MeshPhysicalMaterial({ color: '#d8d0c0', roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.8 });
  for (const ax of [-0.3, 0.2]) g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(ax, HING, D / 2 + 0.01), new THREE.Vector3(ax + 0.01, HING - 0.15, D / 2 + 0.03), new THREE.Vector3(ax, HING - 0.32, D / 2 + 0.02)]), 10, 0.005, 6), slime));
  const inner = new THREE.PointLight('#ff4a3a', 0.6, 1.2); inner.position.set(0, HING + 0.15, 0.1); g.add(inner);
  return g;
}

// ============ PIGEON GHOUL ============
// A dog-sized undead pigeon: iridescent neck, rotting bare patches, exposed ribs, red eye, scaly feet.
export function pigeonGhoul() {
  const g = new THREE.Group();
  const H = 0.0;
  const sdf = (x, y, z) => {
    const ax = Math.abs(x);
    let d = ell(x, y, z, 0, 0.5, -0.02, 0.17, 0.17, 0.3); // body
    d = smin(d, ell(x, y, z, 0, 0.55, 0.16, 0.14, 0.15, 0.13), 0.1); // chest
    d = smin(d, chain(x, y, z, [[0, 0.62, 0.22], [0, 0.72, 0.33], [0, 0.78, 0.4]], [0.07, 0.045, 0.045], 0.06), 0.06); // neck
    d = smin(d, ell(x, y, z, 0, 0.8, 0.44, 0.065, 0.065, 0.075), 0.035); // head (thrust forward)
    d = smin(d, sph(x, y, z, 0, 0.815, 0.51, 0.022), 0.02); // cere
    d = smin(d, chain(x, y, z, [[0, 0.805, 0.51], [0, 0.785, 0.575], [0, 0.765, 0.59]], [0.018, 0.012, 0.004], 0.01), 0.01); // beak
    // folded wings
    d = smin(d, ell(ax, y, z, 0.17, 0.56, -0.08, 0.05, 0.14, 0.3), 0.04);
    // tail fan
    d = smin(d, ell(x, y, z, 0, 0.42, -0.36, 0.12, 0.025, 0.14), 0.05);
    // legs + toes
    d = smin(d, chain(ax, y, z, [[0.08, 0.38, 0.02], [0.09, 0.18, 0.05], [0.09, 0.03, 0.06]], [0.035, 0.016, 0.014], 0.03), 0.03);
    for (const [dx, dz] of [[-0.05, 0.08], [0, 0.1], [0.05, 0.08], [0, -0.06]]) d = smin(d, chain(ax, y, z, [[0.09, 0.03, 0.06], [0.09 + dx, 0.012, 0.06 + dz]], [0.012, 0.008], 0.01), 0.01);
    // rotted hole in the flank showing ribs
    const hole = ell(x, y, z, -0.19, 0.5, 0.02, 0.06, 0.09, 0.14);
    d = smax(d, -hole, 0.02);
    for (let i = 0; i < 4; i++) d = Math.min(d, Math.max(rcone(x, y, z, -0.17, 0.42 + i * 0.05, -0.08 + i * 0.01, -0.165, 0.44 + i * 0.05, 0.12 - i * 0.01, 0.009, 0.008), hole - 0.01));
    // ruffled feathers via stretched noise
    if (Math.abs(d) < 0.03) d += Math.abs(Math.sin(z * 70 + vnoise(x * 20, y * 20, z * 20) * 3)) * 0.003 + fbm(x * 12, y * 12, z * 12) * 0.004 + (y > 0.6 && z > 0.2 ? (Math.abs(vnoise(x * 60, y * 60, z * 60)) - 0.3) * 0.004 : 0);
    return d;
  };
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    c.copy(C('#7a7a84')).lerp(C('#4a4a54'), clamp01(fbm(x * 10, y * 10, z * 10) + 0.4));
    if (y > 0.6 && y < 0.74 && z > 0.18) { const t = Math.sin(z * 40 + x * 30) * 0.5 + 0.5; c.lerp(C('#2a6a4a'), 0.55 * (1 - t)).lerp(C('#6a3a7a'), 0.5 * t); } // iridescent neck
    if (Math.abs(x) > 0.15 && y > 0.47 && y < 0.62) { const bar = Math.sin(z * 30); if (bar > 0.6) c.lerp(C('#1a1a20'), 0.7); } // wing bars
    const rot = vnoise(x * 9 + 3, y * 9, z * 9);
    if (rot > 0.25) c.lerp(C('#a07a70'), clamp01((rot - 0.25) * 3) * 0.8); // bare rotting skin
    if (rot > 0.5) c.lerp(C('#5a2a20'), 0.5);
    if (x < -0.12 && Math.abs(y - 0.5) < 0.11 && Math.abs(z - 0.02) < 0.16) c.copy(C('#6a1a18')).lerp(C('#d8c8a8'), clamp01(-nx * 0.5)); // wound interior / bone
    if (y < 0.36) c.copy(C('#a85a5a')).lerp(C('#5a2a2a'), clamp01(vnoise(x * 80, y * 80, z * 80) + 0.3)); // scaly feet
    if (z > 0.52 && y > 0.75) c.copy(C('#2a2220')); // beak
    if (z > 0.3 && y > 0.68 && z < 0.5) c.lerp(C('#b08a80'), 0.6); // plucked, bare neck skin
    if (Math.hypot(x, y - 0.815, z - 0.51) < 0.028) c.copy(C('#d8d0c8')); // cere
    c.multiplyScalar(ao);
  };
  g.add(new THREE.Mesh(buildMesh(sdf, [-0.3, 0.0, -0.55], [0.3, 0.95, 0.65], 0.0055, col), skinMaterial({ roughness: 0.7, clearcoat: 0.2, sheen: 0.8, sheenColor: '#9a9aaa', pore: 0.5, poreScale: 0.6 })));
  const et = eyeTexture({ sclera: '#c84020', iris: ['#ff2a00', '#ff6a00', '#a02000', '#300800'], pupil: 'round', veins: 10, irisR: 120 });
  for (const sx of [-1, 1]) { const e = eyeMesh(et, 0.017, 0.3, '#ff3a00'); e.position.set(sx * 0.052, 0.815, 0.465); e.rotation.y = sx * -1.2; g.add(e); }
  const cm = clawMat();
  for (const sx of [-1, 1]) for (const [dx, dz] of [[-0.05, 0.08], [0, 0.1], [0.05, 0.08]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.03, 5), cm); c.position.set(sx * (0.09 + dx * 1.2), 0.012, 0.06 + dz * 1.2); c.rotation.x = Math.PI / 2; c.lookAt(sx * (0.09 + dx * 3), 0, 0.06 + dz * 3); c.rotateX(Math.PI / 2); g.add(c); }
  // loose feathers on the ground
  const fm = new THREE.MeshPhysicalMaterial({ color: '#8a8a94', roughness: 0.8, side: THREE.DoubleSide, sheen: 1, sheenColor: C('#c8c8d8') });
  for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.09), fm); f.position.set((rnd() - 0.5) * 0.9, 0.003, (rnd() - 0.3) * 0.8); f.rotation.set(-Math.PI / 2, 0, rnd() * 6); g.add(f); }
  return g;
}
