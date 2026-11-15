// Karadeniz Horonu Kamera Yönetmeni
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export const SHOTS = {
  genel:    { p: V(0, 6.4, 11.4),  t: V(0, 0.8, -0.8), dur: 11, sway: [1.2, 0.26, 0.6] },
  halay:    { p: V(4.8, 3.5, 6.6), t: V(0, 0.7, 0),    dur: 9,  sway: [1.3, 0.25, 0.8] },
  sahne:    { p: V(0, 2.2, -3.4),  t: V(0, 0.9, -8.4), dur: 7,  sway: [0.8, 0.14, 0.3] },
  tepsi:    { p: V(0, 2.3, 3.3),   t: V(0, 0.4, 0),    dur: 7,  sway: [0.5, 0.12, 0.25] },
  baskose:  { p: V(-1.8, 1.8, -4.2), t: V(-4.2, 0.6, -6.7), dur: 6, sway: [0.35, 0.1, 0.25] },
  kusbakis: { p: V(0, 12.4, 5.2),  t: V(0, 0.3, -0.4), dur: 8,  sway: [0.8, 0.2, 0.6] },
};
export const TOUR = [
  ['genel', 'Yayla'], ['halay', 'Horon Halkası'], ['sahne', '🎻 Kemençe & Tulum'],
  ['tepsi', '🧀 Kuymak Ateşi'], ['baskose', 'Yayla Ağası'], ['kusbakis', 'Kuşbakışı'],
];

export function createDirector(camera) {
  let cur = 'genel', timer = SHOTS.genel.dur, tourIdx = 0, phase = 0;
  const pos = SHOTS.genel.p.clone(), target = SHOTS.genel.t.clone();
  const goalP = pos.clone(), goalT = target.clone();
  camera.position.copy(pos); camera.lookAt(target);

  function setShot(name, hold) {
    if (!SHOTS[name]) return;
    cur = name; timer = hold || SHOTS[name].dur;
  }
  return {
    get dist() { return camera.position.distanceTo(target); },
    focusOn(name, hold = 6) { setShot(name, hold); },
    jump(name) { setShot(name, 10); },
    update(dt) {
      phase += dt; timer -= dt;
      if (timer <= 0) {
        tourIdx = (tourIdx + 1) % TOUR.length;
        setShot(TOUR[tourIdx][0]);
      }
      const s = SHOTS[cur] || SHOTS.genel;
      goalP.set(
        s.p.x + Math.sin(phase * 0.42) * s.sway[0],
        s.p.y + Math.sin(phase * 0.29) * s.sway[1],
        s.p.z + Math.cos(phase * 0.35) * s.sway[2]
      );
      goalT.copy(s.t);
      const k = Math.min(1, dt * 2.2);
      pos.lerp(goalP, k); target.lerp(goalT, k);
      camera.position.copy(pos); camera.lookAt(target);
    },
  };
}
