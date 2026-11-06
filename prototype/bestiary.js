import * as THREE from './node_modules/three/build/three.module.js';
import { makeGoblin } from './creature.js';
import * as T1 from './monsters/tier1.js';
import * as T2 from './monsters/tier2.js';
import * as T3 from './monsters/tier3.js';
import * as T4 from './monsters/tier4.js';
import * as T5 from './monsters/tier5.js';
import * as T6 from './monsters/tier6.js';
import * as BO1 from './monsters/bosses1.js';
import * as N1 from './npcs/floor1to3.js';
import { grimeTex, canvasTex, rnd, applyVariant, buildMesh } from './sculpt.js';
import { humanoid } from './anatomy.js';

// name -> [builder, camera position, look-at target, fov]
const pack = (make, n, spacing) => () => { const g = new THREE.Group(); for (let i = 0; i < n; i++) { const m = make.variants ? make({ variant: i }) : applyVariant(make({ variant: i }), i); m.position.set((i - (n - 1) / 2) * spacing, 0, -Math.abs(i - (n - 1) / 2) * 0.35); m.rotation.y = (i - (n - 1) / 2) * -0.12; g.add(m); } return g; };
makeGoblin.variants = true;
const MONSTERS = {
  marta: [N1.martaVance, [1.0, 1.4, 2.6], [0, 1.0, 0.1], 36],
  pickles: [N1.pickles, [1.1, 1.2, 2.3], [0, 0.85, 0], 36],
  spin: [N1.spinCycle, [1.1, 1.5, 3.0], [0, 1.1, 0], 36],
  reggie: [N1.oldReggie, [1.0, 1.4, 2.6], [0, 1.0, 0.1], 36],
  wickley: [N1.wickley, [0.9, 1.1, 2.4], [-0.15, 0.7, 0.1], 36],
  ash: [N1.brotherAsh, [1.0, 1.3, 2.8], [0, 1.0, 0.1], 36],
  pylon: [BO1.sergeantPylon, [2.2, 2.4, 5.4], [0, 1.6, 0.2], 38, -2.2, -1.6],
  bigsucker: [BO1.bigSucker, [3.0, 2.8, 4.2], [0, 1.5, -0.2], 40, -3.5, -2.2],
  ebb: [BO1.headCustodianEbb, [2.2, 2.4, 4.8], [0, 1.6, 0.2], 38, -2.2, -1.8],
  bulbqueen: [BO1.bulbQueen, [2.6, 2.6, 4.6], [0, 1.9, -0.2], 42, -3.5, -3.0],
  dave: [BO1.machineThatAteDave, [2.8, 2.4, 5.2], [0, 1.4, 0.1], 40, -2.2, -2.6],
  coo: [BO1.oldManCoo, [3.0, 2.8, 5.0], [0, 1.4, 0.3], 40, -3.5, -2.6],
  coneking: [BO1.coneKing, [3.6, 3.6, 7.6], [0, 2.4, 0], 42, -4.5, -3.4],
  lostfound: [BO1.lostAndFound, [2.8, 2.6, 5.6], [0, 1.4, 0.3], 40, -3.5, -2.6],
  gristle: [BO1.grandmaGristle, [3.0, 3.0, 6.6], [0.5, 2.0, 0.3], 40, -3.5, -2.0],
  lich: [T5.librarianLich, [1.5, 1.6, 3.4], [0, 1.25, 0.2], 36],
  spider: [T5.indexSpider, [1.4, 1.3, 2.4], [0, 0.55, -0.2], 38],
  redacted: [T5.redactedThing, [1.5, 1.7, 4.0], [0, 1.3, 0.2], 36],
  papergolem: [T5.paperGolem, [1.6, 1.7, 4.0], [0, 1.2, 0.2], 36],
  revenant: [T5.overdueRevenant, [1.4, 1.6, 3.5], [0, 1.2, 0.2], 36],
  wraith: [T6.ratingsWraith, [1.4, 1.6, 3.5], [0, 1.2, 0.2], 36],
  seraph: [T6.censorSeraph, [1.2, 1.8, 3.6], [0, 1.6, 0], 38],
  drones: [T6.producerDrones, [1.8, 1.8, 3.8], [0, 1.3, 0], 40],
  hydra: [T6.algorithmHydra, [2.2, 2.0, 4.2], [0, 1.5, 0.3], 40],
  shade: [T6.executiveShade, [1.4, 1.6, 3.6], [0, 1.25, 0.2], 36],
  gladiator: [T4.gladiatorBot, [1.6, 1.8, 3.6], [0, 1.25, 0.2], 36],
  phantom: [T4.stagePhantom, [1.4, 1.6, 3.6], [0, 1.3, 0.2], 36],
  imp: [T4.commercialImp, [0.8, 0.9, 1.7], [0, 0.6, 0.05], 36],
  hype: [T4.hypeBeast, [2.2, 2.2, 5.0], [0, 1.6, 0.3], 36],
  confetti: [T4.confettiElemental, [1.4, 1.5, 3.4], [0, 1.1, 0], 38],
  wyrm: [T3.sewerWyrm, [1.9, 1.35, 2.5], [0, 0.55, 0.1], 40],
  collector: [T3.debtCollector, [1.3, 1.7, 3.0], [0, 1.35, 0.1], 36],
  choir: [T3.fungalChoir, [1.7, 1.4, 2.8], [0, 0.55, 0], 38],
  molekin: [T3.moleKin, [1.0, 1.05, 2.1], [0, 0.75, 0.15], 36],
  grease: [T3.greaseGolem, [1.8, 1.8, 4.0], [0, 1.2, 0.2], 36],
  ratking: [T3.ratkingChoir, [0.6, 0.45, 0.75], [0, 0.06, 0], 38],
  ogre: [T2.mallCopOgre, [2.0, 2.0, 4.6], [0, 1.4, 0.2], 36],
  hound: [T2.culDeSacHound, [1.5, 1.0, 1.9], [0, 0.55, 0.15], 34],
  hag: [T2.gutterHag, [1.4, 1.3, 2.7], [0.2, 0.95, 0.2], 36],
  slime: [T2.bounceHouseSlime, [1.6, 1.4, 3.0], [0, 0.6, 0], 36],
  gnome: [T2.lawnGnome, [0.9, 0.85, 2.0], [0, 0.48, 0], 34],
  leech: [T2.couponLeech, [1.2, 0.9, 1.5], [0, 0.25, 0], 34],
  goblinpack: [pack(makeGoblin, 5, 0.85), [0.4, 1.5, 4.6], [0, 0.95, -0.2], 40],
  goblin: [makeGoblin, [1.3, 1.45, 3.2], [0, 1.0, 0.1], 34],
  lamprey: [T1.drainLamprey, [1.1, 1.3, 1.9], [0, 0.7, 0.1], 34],
  wight: [T1.mopWight, [1.0, 1.5, 2.8], [0, 1.15, 0.1], 36],
  moth: [T1.fluorescentMoth, [0.75, 1.45, 1.25], [0, 1.08, -0.05], 40],
  mimic: [T1.vendingMimic, [1.6, 1.6, 2.9], [0, 1.05, 0.1], 36],
  pigeon: [T1.pigeonGhoul, [-1.0, 0.75, 1.25], [0, 0.5, 0.1], 36],
};
const q = new URLSearchParams(location.search);
const [build, cp, ct, fov, wallZ = -2.2, refX = null] = MONSTERS[q.get('m') || 'goblin'];
const W = 1440, H = 810;
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
r.setPixelRatio(window.devicePixelRatio); r.setSize(W, H); r.outputColorSpace = THREE.SRGBColorSpace;
r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(r.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#140e18'); scene.fog = new THREE.Fog('#140e18', 6, 16);
const cam = new THREE.PerspectiveCamera(fov, W / H, 0.02, 50); cam.position.set(...cp); cam.lookAt(...ct);

// stone-tile dungeon floor and a back wall
const stone = canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#3a3230'; g.fillRect(0, 0, w, h);
  const n = 4, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = `hsl(${20 + rnd() * 15},${10 + rnd() * 8}%,${17 + rnd() * 8}%)`; g.fillRect(i * s + 6, j * s + 6, s - 12, s - 12);
    for (let k = 0; k < 400; k++) { g.fillStyle = `rgba(${rnd() < 0.5 ? 0 : 120},${rnd() < 0.5 ? 0 : 110},${rnd() < 0.5 ? 0 : 100},${rnd() * 0.15})`; g.fillRect(i * s + rnd() * s, j * s + rnd() * s, 2 + rnd() * 8, 2 + rnd() * 8); } }
}, { repeat: [3, 3] });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshStandardMaterial({ map: stone, roughness: 0.85 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshStandardMaterial({ map: grimeTex('#2a2230', { rust: 40 }), roughness: 0.95 }));
wall.position.set(0, 2.5, wallZ); wall.receiveShadow = true; scene.add(wall);

const mon = build(); scene.add(mon);
// 1.8 m human silhouette for scale
if (refX !== null) {
  const H = humanoid({ height: 1.8, nose: 'flat', ears: 'round', jaw: 'normal', skinNoise: 0, detail: 0 });
  const ref = new THREE.Mesh(buildMesh(H.sdf, H.bbox[0], H.bbox[1], 0.02, (x, y, z, nx, ny, nz, ao, c) => c.setRGB(0.32 * ao, 0.34 * ao, 0.4 * ao)), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }));
  ref.position.set(refX, 0, 0.6); ref.rotation.y = 0.4 * Math.sign(-refX); ref.castShadow = true; scene.add(ref);
}
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
