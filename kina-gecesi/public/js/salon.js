// Kına Gecesi Salonu:
// Ortada kırmızı-altın Gelin Tahtı ve tül cibinlik, önünde mumlu altın Kına Tepsisi,
// etrafında kına dönüş/halay halkaları, arkada tef/saz/solist sahnesi, yanlarda lokum/çerez masaları.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

const HW = 9.6;
const BACK = -10.6;
const FRONT = 12;
const STAGE_Z = -8.6;
const TABLE_X = 7.6;
const TABLE_Z = [-6.2, -2.8, 0.6, 4.0, 7.4];
export const RINGS = [{ rx: 3.1, rz: 3.3 }, { rx: 4.35, rz: 4.55 }, { rx: 5.55, rz: 5.75 }];

function tex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
function kilimTex(pal, scale = 1, border = true, rep) {
  return tex(512, 512, (x, w, h) => {
    x.fillStyle = pal[0]; x.fillRect(0, 0, w, h);
    const s = 64 * scale;
    const d = (cx, cy, r, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r, cy); x.closePath(); x.fill(); };
    for (let y = 0; y < h + s; y += s) for (let xx = 0; xx < w + s; xx += s) { d(xx, y, s * 0.46, pal[1]); d(xx, y, s * 0.32, pal[2]); d(xx, y, s * 0.18, pal[0]); d(xx, y, s * 0.07, pal[3]); }
    if (border) { x.strokeStyle = pal[2]; x.lineWidth = 18; x.strokeRect(9, 9, w - 18, h - 18); x.strokeStyle = pal[1]; x.lineWidth = 8; x.strokeRect(26, 26, w - 52, h - 52); }
    for (let i = 0; i < 3500; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.07})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  }, rep);
}
const KILIMS = [
  ['#9b111e', '#4a0e2e', '#f5c453', '#fff0d4'],
  ['#7c0a18', '#2d0c24', '#e0a938', '#f7e4c4'],
  ['#a81c2e', '#581136', '#f2c659', '#fcebd0'],
  ['#6a0d25', '#3d102a', '#e8b448', '#f9e6c8'],
];

export function buildSalon(scene) {
  const add = (geo, m, pos, rot, shadow = true) => {
    const o = new THREE.Mesh(geo, m); o.position.copy(pos); if (rot) o.rotation.set(rot[0], rot[1], rot[2]);
    o.castShadow = shadow; o.receiveShadow = true; scene.add(o); return o;
  };
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const kil = KILIMS.map((p, i) => std({ map: kilimTex(p, 0.8 + (i % 2) * 0.3), roughness: 0.92 }));
  const W2 = HW * 2, D = FRONT - BACK, MZ = (FRONT + BACK) / 2;

  // ---------- Zemin, duvarlar, bordo-altın kına dekoru ----------
  const plank = tex(512, 512, (x, w, h) => {
    for (let i = 0; i < 8; i++) { x.fillStyle = ['#48181f', '#3f141a', '#521b23', '#391117'][i % 4]; x.fillRect(0, (i * h) / 8, w, h / 8); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, (i * h) / 8, w, 2); }
  }, [8, 10]);
  add(new THREE.PlaneGeometry(W2, D), std({ map: plank, roughness: 0.75 }), V(0, 0, MZ), [-Math.PI / 2, 0, 0]);

  const wallTex = tex(512, 512, (x, w, h) => {
    x.fillStyle = '#521422'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 800; i++) { x.fillStyle = `rgba(255,195,110,${Math.random() * 0.06})`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 18, 0, 7); x.fill(); }
  }, [5, 1.5]);
  const wallM = std({ map: wallTex, roughness: 0.92 });
  add(new THREE.PlaneGeometry(W2, 6), wallM, V(0, 3, BACK));
  add(new THREE.PlaneGeometry(D, 6), wallM, V(-HW, 3, MZ), [0, Math.PI / 2, 0]);
  add(new THREE.PlaneGeometry(D, 6), wallM, V(HW, 3, MZ), [0, -Math.PI / 2, 0]);

  const goldM = std({ color: '#e2af42', metalness: 0.88, roughness: 0.26 });
  const velvetM = std({ color: '#9e1224', roughness: 0.65 });
  add(new THREE.BoxGeometry(W2, 1, 0.08), velvetM, V(0, 0.5, BACK + 0.04));
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.08, 1, D), velvetM, V(s * (HW - 0.04), 0.5, MZ));

  // Orta kına halısı + yan koridorlar
  add(new THREE.PlaneGeometry(13.2, 13.4), std({ map: kilimTex(KILIMS[0], 0.8, true, [2, 2]), roughness: 0.92 }), V(0, 0.006, 0), [-Math.PI / 2, 0, 0], false);
  for (const s of [-1, 1]) add(new THREE.PlaneGeometry(2.8, 17), std({ map: kilimTex(KILIMS[1], 0.8, true, [1, 5]), roughness: 0.92 }), V(s * TABLE_X, 0.008, 0.6), [-Math.PI / 2, 0, 0], false);
  add(new THREE.PlaneGeometry(5.2, 2.8), kil[0], V(0, 3.1, BACK + 0.06));
  for (const s of [-1, 1]) add(new THREE.PlaneGeometry(1.8, 3.0), kil[2], V(s * 4.6, 2.9, BACK + 0.06));

  // ---------- Orkestra sahnesi (arkada) ----------
  add(new RoundedBoxGeometry(6.4, 0.4, 2.4, 3, 0.05), std({ color: '#4d121d', roughness: 0.6 }), V(0, 0.2, STAGE_Z));
  add(new THREE.PlaneGeometry(6.0, 2.1), kil[1], V(0, 0.402, STAGE_Z), [-Math.PI / 2, 0, 0], false);
  const orch = {};
  [['saz', -0.95], ['solist', 0], ['darbuka', 0.95]].forEach(([k, x]) => {
    add(new RoundedBoxGeometry(0.8, 0.12, 0.75, 3, 0.05), kil[k === 'solist' ? 0 : 2], V(x, 0.46, STAGE_Z - 0.05));
    add(new RoundedBoxGeometry(0.75, 0.5, 0.18, 3, 0.07), velvetM, V(x, 0.67, STAGE_Z - 0.45), [-0.18, 0, 0]);
    orch[k] = { pos: V(x, 0.4, STAGE_Z), yaw: 0 };
  });

  // ---------- ORTADA GELİN TAHTI (KINA MERKEZİ) & KINA TEPSİSİ ----------
  const TR = V(0, 0, 0);
  // Yuvarlak bordo kadife podyum + altın kenar
  add(new THREE.CylinderGeometry(1.45, 1.55, 0.12, 48), velvetM, V(0, 0.06, 0));
  add(new THREE.TorusGeometry(1.5, 0.035, 10, 56), goldM, V(0, 0.11, 0), [Math.PI / 2, 0, 0]);

  // Gelin Tahtı (koltuk)
  const throneZ = -0.32;
  add(new RoundedBoxGeometry(0.96, 0.22, 0.72, 4, 0.06), velvetM, V(0, 0.23, throneZ));
  add(new RoundedBoxGeometry(1.02, 0.06, 0.76, 3, 0.02), goldM, V(0, 0.13, throneZ));
  // Yüksek altın çerçeveli bordo taht sırtlığı
  add(new RoundedBoxGeometry(0.98, 1.35, 0.14, 4, 0.06), velvetM, V(0, 0.95, throneZ - 0.3));
  add(new THREE.TorusGeometry(0.54, 0.045, 12, 36, Math.PI), goldM, V(0, 1.35, throneZ - 0.29));
  for (const s of [-1, 1]) {
    add(new RoundedBoxGeometry(0.14, 0.36, 0.68, 3, 0.04), goldM, V(s * 0.48, 0.46, throneZ));
    add(new THREE.SphereGeometry(0.08, 14, 12), goldM, V(s * 0.52, 1.62, throneZ - 0.28));
  }
  // Üstte kırmızı tül cibinlik (kubbe + tül perdeler)
  const tulleM = new THREE.MeshPhysicalMaterial({ color: '#d91b38', transparent: true, opacity: 0.34, roughness: 0.3, side: THREE.DoubleSide });
  add(new THREE.TorusGeometry(0.95, 0.035, 10, 40), goldM, V(0, 2.75, throneZ), [Math.PI / 2, 0, 0]);
  add(new THREE.ConeGeometry(0.96, 0.55, 32, 1, true), tulleM, V(0, 3.03, throneZ), null, false);
  for (const s of [-1, 1]) {
    add(new THREE.CylinderGeometry(0.08, 0.24, 2.55, 14, 1, true), tulleM, V(s * 0.88, 1.45, throneZ - 0.18), [0, 0, s * 0.12], false);
  }

  // Gelin oturma noktası (tam ortada!)
  const brideSeat = { pos: V(0, 0.14, throneZ + 0.04), yaw: 0 };

  // Gelinin önünde altın Kına Tepsisi ve yanan mumlar
  const trayPos = V(0, 0, 0.62);
  add(new THREE.CylinderGeometry(0.18, 0.28, 0.28, 20), goldM, V(trayPos.x, 0.22, trayPos.z));
  add(new THREE.CylinderGeometry(0.46, 0.42, 0.04, 40), goldM, V(trayPos.x, 0.38, trayPos.z));
  add(new THREE.TorusGeometry(0.46, 0.024, 10, 44), goldM, V(trayPos.x, 0.40, trayPos.z), [Math.PI / 2, 0, 0]);
  const kinaDome = add(new THREE.SphereGeometry(0.18, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: '#8f1414', roughness: 0.6, emissive: '#4a0404', emissiveIntensity: 0.4 }), V(trayPos.x, 0.39, trayPos.z));
  const waxM = std({ color: '#fff8ea', roughness: 0.4 });
  const flameM = new THREE.MeshStandardMaterial({ color: '#ffd86b', emissive: '#ff7b00', emissiveIntensity: 8, roughness: 0.2 });
  const trayCandles = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const cx = trayPos.x + Math.cos(a) * 0.34, cz = trayPos.z + Math.sin(a) * 0.34;
    add(new THREE.CylinderGeometry(0.018, 0.02, 0.11, 10), waxM, V(cx, 0.44, cz));
    const fl = add(new THREE.SphereGeometry(0.026, 10, 8), flameM.clone(), V(cx, 0.515, cz), null, false);
    fl.scale.set(0.7, 1.45, 0.7);
    trayCandles.push(fl);
  }

  // Gelinin etrafında 6 nedime / kına yakıcı minderi
  const knead = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const p = V(Math.cos(a) * 1.25, 0, Math.sin(a) * 1.25 + 0.15);
    add(new RoundedBoxGeometry(0.5, 0.12, 0.46, 3, 0.05), kil[i % 4], V(p.x, 0.06, p.z), [0, -a + Math.PI / 2, 0]);
    knead.push({ pos: p, yaw: Math.atan2(-p.x, throneZ - p.z) });
  }

  // ---------- Yanlarda lokum & kına çerezi masaları ----------
  const seats = [], tables = [];
  const glassM = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transmission: 1, thickness: 0.02, transparent: true });
  const sherbetM = new THREE.MeshStandardMaterial({ color: '#c81d4e', roughness: 0.2, emissive: '#4a0619', emissiveIntensity: 0.35 });
  const tulip = [[0, 0], [0.032, 0], [0.03, 0.04], [0.024, 0.07], [0.03, 0.105], [0.036, 0.13]].map(([x, y]) => new THREE.Vector2(x, y));
  const standM = std({ color: '#3a141c', side: THREE.DoubleSide }), plateM = std({ color: '#fdf6e2', roughness: 0.3 });
  for (const s of [-1, 1]) for (const z of TABLE_Z) {
    const c = V(s * TABLE_X, 0, z);
    add(new THREE.CylinderGeometry(0.52, 0.52, 0.03, 40), goldM, V(c.x, 0.33, c.z));
    add(new THREE.CylinderGeometry(0.2, 0.3, 0.3, 12, 1, true), standM, V(c.x, 0.16, c.z));
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.PI / 6, gp = V(c.x + Math.cos(a) * 0.36, 0.345, c.z + Math.sin(a) * 0.36);
      add(new THREE.LatheGeometry(tulip, 12), sherbetM, gp, null, false).scale.set(0.88, 0.8, 0.88);
      add(new THREE.LatheGeometry(tulip, 12), glassM, gp, null, false);
    }
    add(new THREE.CylinderGeometry(0.16, 0.12, 0.02, 24), plateM, V(c.x, 0.355, c.z));
    tables.push(c);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.PI / 6, p = V(c.x + Math.cos(a) * 0.9, 0, c.z + Math.sin(a) * 0.9);
      add(new RoundedBoxGeometry(0.52, 0.12, 0.5, 3, 0.05), kil[(k + tables.length) % 4], V(p.x, 0.06, p.z), [0, -a + Math.PI / 2, 0]);
      seats.push({ pos: p, yaw: Math.atan2(c.x - p.x, c.z - p.z), table: tables.length - 1 });
    }
  }

  const bkPos = V(-4.4, 0, STAGE_Z + 1.7);
  add(new RoundedBoxGeometry(0.9, 0.16, 0.7, 3, 0.06), goldM, V(bkPos.x, 0.08, bkPos.z));
  add(new RoundedBoxGeometry(0.9, 0.6, 0.18, 3, 0.07), velvetM, V(bkPos.x - 0.1, 0.4, bkPos.z - 0.38), [-0.15, 0.35, 0]);
  const baskose = { pos: V(bkPos.x, 0.04, bkPos.z), yaw: Math.atan2(-bkPos.x, -bkPos.z) };

  // ---------- Işıklandırma ----------
  scene.add(new THREE.HemisphereLight('#a85d78', '#2a0912', 0.58));
  const key = new THREE.DirectionalLight('#ffc298', 1.3);
  key.position.set(5, 18, 10); key.target.position.set(0, 0, -1); scene.add(key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
  Object.assign(key.shadow.camera, { left: -11, right: 11, top: 13, bottom: -13, near: 1, far: 45 });
  scene.add(key);

  const spot = new THREE.SpotLight('#ff946b', 65, 13, 0.5, 0.6, 1.5);
  spot.position.set(0, 5.5, STAGE_Z + 5); spot.target.position.set(0, 0.6, STAGE_Z);
  scene.add(spot, spot.target);

  // Gelin üstü özel spot ve kına tepsisi ışığı
  const brideSpot = new THREE.PointLight('#ff8866', 18, 10, 1.5);
  brideSpot.position.set(0, 4.2, 0);
  scene.add(brideSpot);

  const lamps = [];
  const glowM = new THREE.MeshStandardMaterial({ color: '#ffd59a', emissive: '#ff7a4a', emissiveIntensity: 7 });
  const glassL = new THREE.MeshPhysicalMaterial({ color: '#fff', transmission: 0.9, roughness: 0.1, transparent: true, side: THREE.DoubleSide });
  for (const s of [-1, 1]) for (const z of [-7.5, -2.5, 2.5, 7.5]) {
    const p = V(s * (HW - 0.15), 2.6, z);
    if ((s < 0 && z === -2.5) || (s > 0 && z === 2.5)) { const l = new THREE.PointLight('#ff6a5a', 9, 11, 1.5); l.position.copy(p); scene.add(l); lamps.push(l); }
    add(new THREE.SphereGeometry(0.08, 12, 10), glowM, p, null, false);
    add(new THREE.CylinderGeometry(0.11, 0.09, 0.24, 12, 1, true), glassL, p, null, false);
  }

  const bulbs = [];
  const cord = new THREE.CatmullRomCurve3([V(-6.2, 4.7, STAGE_Z + 0.5), V(-2, 4.25, STAGE_Z + 0.5), V(2, 4.25, STAGE_Z + 0.5), V(6.2, 4.7, STAGE_Z + 0.5)]);
  add(new THREE.TubeGeometry(cord, 32, 0.012, 6, false), std({ color: '#2a0c14' }), V(0, 0, 0), null, false);
  for (let i = 0; i <= 14; i++) {
    const p = cord.getPoint(i / 14);
    const bm = new THREE.MeshStandardMaterial({ color: '#ffd79a', emissive: '#ff8a4c', emissiveIntensity: 5 });
    bulbs.push(add(new THREE.SphereGeometry(0.055, 10, 8), bm, V(p.x, p.y - 0.06, p.z), null, false));
  }

  return {
    orch, knead, seats, tables, baskose, brideSeat,
    tray: { pos: trayPos, mesh: kinaDome },
    trayCandles, brideSpot,
    lamps, bulbs, bounds: { hw: HW - 0.9, back: BACK + 1.2, front: FRONT - 0.8 },
  };
}
