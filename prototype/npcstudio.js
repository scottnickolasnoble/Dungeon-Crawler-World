// Side-by-side NPC render: the in-game Low-preset mesh vs the same SDF model meshed at full detail with
// three-point studio lighting and soft shadows. Used to show what better assets + lighting buy.
import * as THREE from './node_modules/three/build/three.module.js';
import { createInk } from './engine/ink.js';
import { martaVance } from './npcs/floor1to3.js';

const ink = createInk(document.getElementById('stage'), { fov: 32 }); const { scene, camera, renderer } = ink;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
scene.background = new THREE.Color('#2a2430');
const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 48), new THREE.MeshStandardMaterial({ color: '#4a4048', roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const build = (sdf, npc) => { globalThis.__SDF_STEP = sdf; globalThis.__NPC_STEP = npc; const r = martaVance(); return r.g || r; };
const params = new URLSearchParams(location.search); const side = params.get('side');
const low = build(2.2, 2.4), high = build(0.55, 0.55);
low.position.set(-0.55, 0, 0); high.position.set(0.55, 0, 0);
for (const m of [low, high]) { m.rotation.y = -0.25; m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(m); }
// flat game-like lighting on the left, a studio rig on the right
scene.add(new THREE.HemisphereLight('#c8a878', '#2a2028', 0.9));
const key = new THREE.SpotLight('#fff0dc', 60, 12, 0.5, 0.6, 1.4); key.position.set(2.6, 3.6, 3.2); key.target.position.set(0.55, 1.2, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; scene.add(key, key.target);
const rim = new THREE.SpotLight('#9ac8ff', 40, 10, 0.6, 0.5, 1.4); rim.position.set(-0.6, 3, -3); rim.target.position.set(0.55, 1.3, 0); scene.add(rim, rim.target);
const fill = new THREE.PointLight('#ffb890', 3, 6); fill.position.set(-0.8, 1.6, 2.4); scene.add(fill);
const H = (globalThis.__headY = 1.5);
if (side === 'face') { camera.position.set(0.55, 1.62, 1.15); camera.lookAt(0.55, 1.55, 0); low.visible = false; }
else if (side === 'faceLow') { camera.position.set(-0.55, 1.62, 1.15); camera.lookAt(-0.55, 1.55, 0); high.visible = false; }
else { camera.position.set(0, 1.25, 4.6); camera.lookAt(0, 1.0, 0); }
camera.updateProjectionMatrix();
document.getElementById('msg').textContent = 'ready';
window.__ready = true;
(function loop() { ink.render(); requestAnimationFrame(loop); })();
