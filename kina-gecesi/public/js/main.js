// Kına Gecesi — ana döngü (ortak canlı bağlantı ve karakter modülü ile)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildSalon } from './salon.js';
import { createGame } from './oyun.js';
import { createDirector, TOUR } from './kamera.js';
import { createUI } from './arayuz.js';
import { createDemo } from './demo.js';
import { canliBaglantiBaslat } from '/ortak/canli-baglanti.js';

const W = 1080, H = 1920;
const qs = new URLSearchParams(location.search);
const LOW = qs.get('kalite') === 'dusuk';

const canvas = document.getElementById('cv');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#1a050c');
scene.fog = new THREE.Fog('#1a050c', 28, 60);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.22;
const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 90);

const salon = buildSalon(scene);
const G = createGame(scene, salon);
window.CD = window.CD || {}; window.CD.game = G;
const director = createDirector(camera);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 6, aperture: 0.0009, maxblur: 0.006 });
if (!LOW) composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.46, 0.55, 0.78);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function setQuality(q) {
  const s = LOW ? Math.min(q, 0.6) : q;
  renderer.setPixelRatio(1);
  renderer.setSize(Math.round(W * s), Math.round(H * s), false);
  composer.setSize(Math.round(W * s), Math.round(H * s));
}

const demo = createDemo(G);
const live = { status: { state: 'idle' } };
const UI = createUI(G, camera, salon, {
  onQuality: setQuality, demo, live,
  onFocus: (name) => director.focusOn(name, 6),
  onJump: (i) => director.jump(TOUR[i][0]),
});

Object.assign(live, canliBaglantiBaslat(G, UI, demo));
UI.renderRuleButtons();

const A = window.CD.audio;
A.loadTracks().then(() => UI.refreshSoundBtn());

const clock = new THREE.Clock();
let frames = 0;
function loop() {
  const dt = Math.min(0.05, clock.getDelta());
  demo.tick(dt);
  A.bpm = G.bpm;
  const mb = A.musicBpm ? A.musicBpm() : 0;
  G.bpm += ((mb || [92, 108, 124, 140][G.level]) - G.bpm) * Math.min(1, dt * 1.2);
  if (A.tick) A.tick(G.level, dt);
  G.update(dt, A.beatAt());
  director.update(dt);
  bokeh.uniforms.focus.value = director.dist;
  const t = G.time;
  salon.lamps.forEach((l, i) => { l.intensity = 5 + Math.sin(t * 11 + i * 3) * 0.35 + Math.sin(t * 6.3 + i) * 0.25; });
  salon.bulbs.forEach((b, i) => { b.material.emissiveIntensity = G.level >= 3 ? 3 + 4 * ((Math.sin(t * 8 - i * 0.6) + 1) / 2) : 5; });
  if (frames % 2 === 0) renderer.shadowMap.needsUpdate = true;
  composer.render();
  UI.draw(dt);
  UI.tick(dt);
  if (++frames === 30) window.__ready = true;
  requestAnimationFrame(loop);
}
loop();
