import * as THREE from './node_modules/three/build/three.module.js';
import { makeGoblin } from './creature.js';
import * as T1 from './monsters/tier1.js';
import { grimeTex, canvasTex, rnd, applyVariant } from './sculpt.js';

// name -> [builder, camera position, look-at target, fov]
const pack = (make, n, spacing) => () => { const g = new THREE.Group(); for (let i = 0; i < n; i++) { const m = make.variants ? make({ variant: i }) : applyVariant(make({ variant: i }), i); m.position.set((i - (n - 1) / 2) * spacing, 0, -Math.abs(i - (n - 1) / 2) * 0.35); m.rotation.y = (i - (n - 1) / 2) * -0.12; g.add(m); } return g; };
makeGoblin.variants = true;
const MONSTERS = {
  goblinpack: [pack(makeGoblin, 5, 0.85), [0.4, 1.5, 4.6], [0, 0.95, -0.2], 40],
  goblin: [makeGoblin, [1.3, 1.45, 3.2], [0, 1.0, 0.1], 34],
  lamprey: [T1.drainLamprey, [1.1, 1.3, 1.9], [0, 0.7, 0.1], 34],
  wight: [T1.mopWight, [1.0, 1.5, 2.8], [0, 1.15, 0.1], 36],
  moth: [T1.fluorescentMoth, [0.75, 1.45, 1.25], [0, 1.08, -0.05], 40],
  mimic: [T1.vendingMimic, [1.6, 1.6, 2.9], [0, 1.05, 0.1], 36],
  pigeon: [T1.pigeonGhoul, [-1.0, 0.75, 1.25], [0, 0.5, 0.1], 36],
};
const q = new URLSearchParams(location.search);
const [build, cp, ct, fov] = MONSTERS[q.get('m') || 'goblin'];
const W = 1440, H = 810;
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
r.setPixelRatio(window.devicePixelRatio); r.setSize(W, H); r.outputColorSpace = THREE.SRGBColorSpace;
r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(r.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#140e18'); scene.fog = new THREE.Fog('#140e18', 4, 11);
const cam = new THREE.PerspectiveCamera(fov, W / H, 0.02, 50); cam.position.set(...cp); cam.lookAt(...ct);

// stone-tile dungeon floor and a back wall
const stone = canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#3a3230'; g.fillRect(0, 0, w, h);
  const n = 4, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = `hsl(${20 + rnd() * 15},${10 + rnd() * 8}%,${17 + rnd() * 8}%)`; g.fillRect(i * s + 6, j * s + 6, s - 12, s - 12);
    for (let k = 0; k < 400; k++) { g.fillStyle = `rgba(${rnd() < 0.5 ? 0 : 120},${rnd() < 0.5 ? 0 : 110},${rnd() < 0.5 ? 0 : 100},${rnd() * 0.15})`; g.fillRect(i * s + rnd() * s, j * s + rnd() * s, 2 + rnd() * 8, 2 + rnd() * 8); } }
}, { repeat: [3, 3] });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshStandardMaterial({ map: stone, roughness: 0.85 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), new THREE.MeshStandardMaterial({ map: grimeTex('#2a2230', { rust: 40 }), roughness: 0.95 }));
wall.position.set(0, 2.5, -2.2); wall.receiveShadow = true; scene.add(wall);

const mon = build(); scene.add(mon);
mon.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

// lighting rig: warm torch key, cool rim, low fill, soft env for reflections
scene.add(new THREE.HemisphereLight('#6a5a90', '#2a1a10', 0.45));
const key = new THREE.SpotLight('#ffc9a0', 50, 14, 0.55, 0.5, 1.5); key.position.set(2.2, 3.2, 2.6); key.target.position.set(...ct); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; scene.add(key, key.target);
const rim = new THREE.DirectionalLight('#7ab0ff', 2.4); rim.position.set(-2.5, 2.8, -2.5); scene.add(rim);
const fill = new THREE.PointLight('#ff7a30', 3, 5); fill.position.set(-1.4, 1.0, 1.6); scene.add(fill);
const envScene = new THREE.Scene(); envScene.background = new THREE.Color('#1a1222');
for (const [x, z] of [[-3, -2], [3, 2], [1, 4]]) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffa060').multiplyScalar(4) })); p.position.set(x, 2, z); envScene.add(p); }
scene.environment = new THREE.PMREMGenerator(r).fromScene(envScene, 0.04).texture;
r.render(scene, cam); window.__ready = true;
