// Karadeniz Yaylası Horon Meydanı:
//   • Zümrüt yeşili yayla çimeni, sisli Kaçkar dağları, ladin ağaçları ve ahşap yayla evleri (serender)
//   • Arkada ahşap yayla sahnesi (Kemençeci, Solist, Tulumcu)
//   • Ortada Yayla Ateşi & Bakır Kuymak Kazanı, etrafında sıkı Karadeniz Horon Halkaları
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

const HW = 9.8;
const BACK = -10.8;
const FRONT = 12;
const STAGE_Z = -8.4;
const TABLE_X = 7.6;
const TABLE_Z = [-6.0, -2.6, 0.8, 4.2, 7.6];
export const RINGS = [{ rx: 2.95, rz: 3.1 }, { rx: 4.15, rz: 4.35 }, { rx: 5.35, rz: 5.55 }];

function tex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}

export function buildSalon(scene) {
  const add = (geo, m, pos, rot, shadow = true) => {
    const o = new THREE.Mesh(geo, m); o.position.copy(pos); if (rot) o.rotation.set(rot[0], rot[1], rot[2]);
    o.castShadow = shadow; o.receiveShadow = true; scene.add(o); return o;
  };
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const W2 = HW * 2 + 6, D = FRONT - BACK + 6, MZ = (FRONT + BACK) / 2;

  // ---------- Zümrüt yeşili Karadeniz yayla çimeni ----------
  const grass = tex(512, 512, (x, w, h) => {
    x.fillStyle = '#23532a'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 4500; i++) {
      x.fillStyle = ['#1c4622', '#2d6634', '#35743c', '#1a3d1f'][i % 4];
      x.fillRect(Math.random() * w, Math.random() * h, 3, 5);
    }
    for (let i = 0; i < 180; i++) {
      x.fillStyle = i % 3 === 0 ? '#ffd166' : '#ffffff';
      x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 2, 0, Math.PI * 2); x.fill();
    }
  }, [8, 10]);
  add(new THREE.PlaneGeometry(W2, D), std({ map: grass, roughness: 0.92 }), V(0, 0, MZ), [-Math.PI / 2, 0, 0]);

  // Horon alanı taş/toprak yayla patikası halkası
  const ringTex = tex(512, 512, (x, w, h) => {
    x.fillStyle = '#2a5c30'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#6f5c3e'; x.lineWidth = 28;
    x.beginPath(); x.arc(256, 256, 175, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = '#5c4b32'; x.lineWidth = 22;
    x.beginPath(); x.arc(256, 256, 232, 0, Math.PI * 2); x.stroke();
  });
  add(new THREE.CircleGeometry(6.2, 64), std({ map: ringTex, roughness: 0.9 }), V(0, 0.008, 0), [-Math.PI / 2, 0, 0], false);

  // ---------- Arka planda Sisli Karadeniz Dağları, Ladin Ağaçları ve Ahşap Yayla Evleri ----------
  const mtnM = std({ color: '#1b3b36', roughness: 0.95 });
  const snowM = std({ color: '#dce8ec', roughness: 0.7 });
  [[-8, -16, 7.5, 7.5], [-2.2, -17.5, 8.8, 9.2], [4.5, -16.8, 8.2, 8.4], [9.5, -15.5, 6.8, 6.8]].forEach(([mx, mz, mr, mh]) => {
    add(new THREE.ConeGeometry(mr, mh, 7), mtnM, V(mx, mh / 2 - 0.5, mz));
    add(new THREE.ConeGeometry(mr * 0.34, mh * 0.34, 7), snowM, V(mx, mh * 0.78 - 0.5, mz));
  });

  // Ahşap yayla evleri (serender)
  const logM = std({ color: '#5c3a1e', roughness: 0.85 });
  const roofM = std({ color: '#3b2412', roughness: 0.8 });
  const winGlowM = new THREE.MeshStandardMaterial({ color: '#ffe599', emissive: '#ffaa33', emissiveIntensity: 3.5 });
  [[-6.6, -11.8], [6.6, -11.8]].forEach(([hx, hz]) => {
    add(new THREE.BoxGeometry(3.4, 2.3, 2.6), logM, V(hx, 1.4, hz));
    const r = add(new THREE.ConeGeometry(2.7, 1.35, 4), roofM, V(hx, 3.2, hz), [0, Math.PI / 4, 0]);
    r.scale.z = 0.8;
    add(new THREE.PlaneGeometry(0.55, 0.55), winGlowM, V(hx - 0.65, 1.5, hz + 1.31), null, false);
    add(new THREE.PlaneGeometry(0.55, 0.55), winGlowM, V(hx + 0.65, 1.5, hz + 1.31), null, false);
  });

  // Ladin / Çam ağaçları
  const pineM = std({ color: '#174723', roughness: 0.85 });
  const trunkM = std({ color: '#472d18', roughness: 0.9 });
  [
    [-9.2, -9.8], [-4.2, -11.2], [4.2, -11.2], [9.2, -9.8],
    [-9.4, -4.5], [9.4, -4.5], [-9.4, 1.5], [9.4, 1.5], [-9.4, 7.2], [9.4, 7.2],
  ].forEach(([px, pz], idx) => {
    const s = 0.85 + (idx % 3) * 0.18;
    add(new THREE.CylinderGeometry(0.14 * s, 0.2 * s, 1.4 * s, 8), trunkM, V(px, 0.7 * s, pz));
    add(new THREE.ConeGeometry(1.15 * s, 2.1 * s, 10), pineM, V(px, 1.9 * s, pz));
    add(new THREE.ConeGeometry(0.9 * s, 1.8 * s, 10), pineM, V(px, 3.0 * s, pz));
    add(new THREE.ConeGeometry(0.62 * s, 1.4 * s, 10), pineM, V(px, 3.9 * s, pz));
  });

  // ---------- Ahşap Yayla Sahnesi (Kemençeci, Solist, Tulumcu) ----------
  add(new RoundedBoxGeometry(6.4, 0.38, 2.3, 3, 0.05), logM, V(0, 0.19, STAGE_Z));
  const keM = std({ color: '#8f2424', roughness: 0.8 });
  const orch = {};
  [['saz', -1.2], ['solist', 0], ['darbuka', 1.2]].forEach(([k, x]) => {
    add(new RoundedBoxGeometry(0.8, 0.12, 0.75, 3, 0.05), keM, V(x, 0.44, STAGE_Z - 0.05));
    orch[k] = { pos: V(x, 0.38, STAGE_Z), yaw: 0 };
  });

  // ---------- Ortada Yayla Ateşi & Bakır Kuymak Kazanı ----------
  const TR = V(0, 0, 0);
  const stoneM = std({ color: '#6b6e70', roughness: 0.9 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    add(new THREE.DodecahedronGeometry(0.14, 0), stoneM, V(Math.cos(a) * 0.62, 0.09, Math.sin(a) * 0.62));
  }
  const fireM = new THREE.MeshStandardMaterial({ color: '#ff9f1c', emissive: '#ff4d00', emissiveIntensity: 6 });
  const fireMesh = add(new THREE.ConeGeometry(0.32, 0.45, 9), fireM, V(0, 0.22, 0), null, false);
  const copperM = std({ color: '#c86d3b', metalness: 0.85, roughness: 0.28 });
  add(new THREE.CylinderGeometry(0.42, 0.34, 0.14, 28), copperM, V(0, 0.44, 0));
  const kuymakM = std({ color: '#f5c445', roughness: 0.35, emissive: '#7a5200', emissiveIntensity: 0.3 });
  add(new THREE.CylinderGeometry(0.38, 0.38, 0.03, 24), kuymakM, V(0, 0.50, 0));

  const knead = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const p = V(Math.cos(a) * 1.12, 0, Math.sin(a) * 1.12);
    add(new RoundedBoxGeometry(0.45, 0.14, 0.45, 3, 0.04), logM, V(p.x, 0.07, p.z), [0, -a + Math.PI / 2, 0]);
    knead.push({ pos: p, yaw: Math.atan2(-p.x, -p.z) });
  }

  // ---------- Yanlarda Ahşap Yayla Masaları ve Rize Çayı ----------
  const seats = [], tables = [];
  const glassM = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transmission: 1, thickness: 0.02, transparent: true });
  const teaM = new THREE.MeshStandardMaterial({ color: '#a8320a', roughness: 0.2, emissive: '#3a0a00', emissiveIntensity: 0.3 });
  const tulip = [[0, 0], [0.032, 0], [0.03, 0.04], [0.024, 0.07], [0.03, 0.105], [0.036, 0.13]].map(([x, y]) => new THREE.Vector2(x, y));
  for (const s of [-1, 1]) for (const z of TABLE_Z) {
    const c = V(s * TABLE_X, 0, z);
    add(new THREE.CylinderGeometry(0.52, 0.52, 0.04, 28), logM, V(c.x, 0.34, c.z));
    add(new THREE.CylinderGeometry(0.14, 0.2, 0.32, 10), trunkM, V(c.x, 0.16, c.z));
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.PI / 6, gp = V(c.x + Math.cos(a) * 0.36, 0.36, c.z + Math.sin(a) * 0.36);
      add(new THREE.LatheGeometry(tulip, 12), teaM, gp, null, false).scale.set(0.88, 0.8, 0.88);
      add(new THREE.LatheGeometry(tulip, 12), glassM, gp, null, false);
    }
    tables.push(c);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.PI / 6, p = V(c.x + Math.cos(a) * 0.9, 0, c.z + Math.sin(a) * 0.9);
      add(new THREE.CylinderGeometry(0.22, 0.24, 0.16, 12), trunkM, V(p.x, 0.08, p.z));
      seats.push({ pos: p, yaw: Math.atan2(c.x - p.x, c.z - p.z), table: tables.length - 1 });
    }
  }

  // Yayla Ağası / Başköşe
  const bkPos = V(-4.4, 0, STAGE_Z + 1.7);
  add(new RoundedBoxGeometry(0.9, 0.18, 0.7, 3, 0.06), copperM, V(bkPos.x, 0.09, bkPos.z));
  const baskose = { pos: V(bkPos.x, 0.04, bkPos.z), yaw: Math.atan2(-bkPos.x, -bkPos.z) };

  // ---------- Işıklandırma ----------
  scene.add(new THREE.HemisphereLight('#8ecae6', '#1b4332', 0.72));
  const key = new THREE.DirectionalLight('#fff1c8', 1.38);
  key.position.set(5, 18, 10); key.target.position.set(0, 0, -1); scene.add(key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
  Object.assign(key.shadow.camera, { left: -11, right: 11, top: 13, bottom: -13, near: 1, far: 45 });
  scene.add(key);

  const center = new THREE.PointLight('#ff9f40', 16, 11, 1.5);
  center.position.set(0, 3.8, 0);
  scene.add(center);

  const lamps = [];
  for (const s of [-1, 1]) for (const z of [-6.0, 3.0]) {
    const l = new THREE.PointLight('#ffd166', 8, 12, 1.5);
    l.position.set(s * 7.5, 3.2, z);
    scene.add(l);
    lamps.push(l);
  }

  const bulbs = [];
  const cord = new THREE.CatmullRomCurve3([V(-6.4, 4.5, STAGE_Z + 0.5), V(-2, 4.1, STAGE_Z + 0.5), V(2, 4.1, STAGE_Z + 0.5), V(6.4, 4.5, STAGE_Z + 0.5)]);
  add(new THREE.TubeGeometry(cord, 32, 0.012, 6, false), std({ color: '#1b2e1e' }), V(0, 0, 0), null, false);
  for (let i = 0; i <= 14; i++) {
    const p = cord.getPoint(i / 14);
    const col = i % 2 === 0 ? '#ffd166' : '#52b788';
    const bm = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 5 });
    bulbs.push(add(new THREE.SphereGeometry(0.06, 10, 8), bm, V(p.x, p.y - 0.06, p.z), null, false));
  }

  return {
    orch, knead, seats, tables, baskose,
    tray: { pos: TR, mesh: fireMesh },
    lamps, bulbs, bounds: { hw: HW - 0.9, back: BACK + 1.2, front: FRONT - 0.8 },
  };
}
