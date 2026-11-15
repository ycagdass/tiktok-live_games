// Açık Hava Köy Düğünü Meydanı:
//   • Yıldızlı gece göğü, arka planda kiremit çatılı köy evleri ve ağaçlar, direkler arası düğün ampulleri
//   • Çiçekli tak altında Gelin ve Damat masası
//   • Meydanda Davul-Zurna ekibi, sağda dumanı tüten Bakır Semaverli Köy Çay Ocağı
//   • Ortada taş döşeli köy meydanı halay halkaları ve yanlarda ahşap düğün masaları
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

const HW = 9.8;
const BACK = -10.8;
const FRONT = 12;
const STAGE_Z = -8.0;
const TABLE_X = 7.6;
const TABLE_Z = [-5.8, -2.4, 1.0, 4.4, 7.6];
export const RINGS = [{ rx: 3.0, rz: 3.2 }, { rx: 4.25, rz: 4.45 }, { rx: 5.5, rz: 5.7 }];

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
  const W2 = HW * 2 + 4, D = FRONT - BACK + 4, MZ = (FRONT + BACK) / 2;

  // ---------- Açık hava köy meydanı taş/toprak zemin ----------
  const cobble = tex(512, 512, (x, w, h) => {
    x.fillStyle = '#4a4339'; x.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
      for (let xx = 0; xx < w; xx += 48) {
        const ox = (y / 32) % 2 ? 24 : 0;
        x.fillStyle = ['#62594d', '#584f43', '#6b6154', '#51483d'][(xx + y) % 4];
        x.beginPath();
        if (x.roundRect) x.roundRect((xx + ox) % w, y + 2, 42, 26, 6);
        else x.rect((xx + ox) % w, y + 2, 42, 26);
        x.fill();
      }
    }
    for (let i = 0; i < 3000; i++) {
      x.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
      x.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  }, [9, 11]);
  add(new THREE.PlaneGeometry(W2, D), std({ map: cobble, roughness: 0.92 }), V(0, 0, MZ), [-Math.PI / 2, 0, 0]);

  // Meydan ortası dairesel taş desen
  const ringGround = tex(512, 512, (x, w, h) => {
    x.fillStyle = '#5e5344'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#c89d54'; x.lineWidth = 10;
    x.beginPath(); x.arc(256, 256, 235, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = '#8b6f3e'; x.lineWidth = 6;
    x.beginPath(); x.arc(256, 256, 165, 0, Math.PI * 2); x.stroke();
  });
  add(new THREE.CircleGeometry(6.1, 64), std({ map: ringGround, roughness: 0.9 }), V(0, 0.008, 0.5), [-Math.PI / 2, 0, 0], false);

  // ---------- Arka planda Köy Evleri, Taş Duvar, Çınar Ağaçları ve Ay ----------
  const stoneWallM = std({ color: '#786e60', roughness: 0.95 });
  add(new THREE.BoxGeometry(W2, 1.1, 0.4), stoneWallM, V(0, 0.55, BACK));
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.4, 1.1, D), stoneWallM, V(s * HW, 0.55, MZ));

  // Köy evleri (arkada)
  const houseWallM = std({ color: '#ede4d1', roughness: 0.85 });
  const roofM = std({ color: '#9e3b24', roughness: 0.75 });
  const winGlowM = new THREE.MeshStandardMaterial({ color: '#ffe299', emissive: '#ffae33', emissiveIntensity: 3.5 });
  [[-6.4, -12.6, 3.8, 2.8], [0, -13.2, 4.4, 3.0], [6.4, -12.5, 3.8, 2.7]].forEach(([hx, hz, hw, hh]) => {
    add(new THREE.BoxGeometry(hw, hh, 2.6), houseWallM, V(hx, hh / 2, hz));
    const roof = add(new THREE.ConeGeometry(hw * 0.82, 1.35, 4), roofM, V(hx, hh + 0.67, hz), [0, Math.PI / 4, 0]);
    roof.scale.z = 0.72;
    for (const wx of [-hw * 0.25, hw * 0.25]) {
      add(new THREE.PlaneGeometry(0.55, 0.65), winGlowM, V(hx + wx, hh * 0.58, hz + 1.31), null, false);
    }
  });

  // Gökyüzünde dolunay
  const moonM = new THREE.MeshStandardMaterial({ color: '#fff6d6', emissive: '#ffe08a', emissiveIntensity: 4 });
  add(new THREE.SphereGeometry(0.95, 24, 20), moonM, V(-6.5, 11.5, -18), null, false);

  // Ağaçlar (meydan köşelerinde ve arkada)
  const trunkM = std({ color: '#4d331e', roughness: 0.9 });
  const leafM = std({ color: '#27592d', roughness: 0.8 });
  [[-8.6, -9.5], [8.6, -9.5], [-9.1, -1.5], [9.1, -1.5], [-9.1, 6.2], [9.1, 6.2]].forEach(([tx, tz]) => {
    add(new THREE.CylinderGeometry(0.18, 0.26, 2.4, 10), trunkM, V(tx, 1.2, tz));
    add(new THREE.SphereGeometry(1.25, 14, 12), leafM, V(tx, 2.9, tz));
    add(new THREE.SphereGeometry(0.95, 12, 10), leafM, V(tx + 0.35, 3.6, tz - 0.2));
  });

  // ---------- GELİN VE DAMAT MASASI (Çiçekli Düğün Takı ile) ----------
  const bgZ = STAGE_Z;
  const woodStageM = std({ color: '#5c3b20', roughness: 0.7 });
  add(new RoundedBoxGeometry(5.6, 0.24, 2.2, 3, 0.04), woodStageM, V(0, 0.12, bgZ));
  // Çiçekli beyaz düğün takı (kemer)
  const whiteM = std({ color: '#faf7f0', roughness: 0.4 });
  const goldM = std({ color: '#e6b84c', metalness: 0.85, roughness: 0.25 });
  add(new THREE.TorusGeometry(1.65, 0.09, 12, 40, Math.PI), whiteM, V(0, 1.3, bgZ - 0.65));
  for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.08, 0.09, 1.3, 12), whiteM, V(s * 1.65, 0.65, bgZ - 0.65));
  // Tak üstünde çiçekler
  const flowerCols = ['#ff4f7b', '#ffd166', '#ffffff', '#ff85a1', '#52b788'];
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI;
    const fx = Math.cos(a) * 1.65, fy = 1.3 + Math.sin(a) * 1.65;
    add(new THREE.SphereGeometry(0.14, 10, 8), std({ color: flowerCols[i % flowerCols.length], roughness: 0.5 }), V(fx, fy, bgZ - 0.58), null, false);
  }
  // Gelin & Damat beyaz örtülü nikah/düğün masası
  add(new RoundedBoxGeometry(2.1, 0.58, 0.68, 4, 0.06), whiteM, V(0, 0.52, bgZ + 0.18));
  add(new RoundedBoxGeometry(2.16, 0.08, 0.72, 3, 0.02), goldM, V(0, 0.82, bgZ + 0.18));
  const brideSeat = { pos: V(-0.48, 0.24, bgZ - 0.22), yaw: 0 };
  const groomSeat = { pos: V(0.48, 0.24, bgZ - 0.22), yaw: 0 };

  // ---------- DAVUL & ZURNA MEYDAN EKİBİ ----------
  const orch = {
    saz: { pos: V(-2.4, 0, bgZ + 1.35), yaw: 0.25 },
    solist: { pos: V(0, 0, bgZ + 1.45), yaw: 0 },
    darbuka: { pos: V(2.4, 0, bgZ + 1.35), yaw: -0.25 },
  };

  // ---------- KÖY ÇAY OCAĞI & BAKIR SEMAVER ----------
  const teaPos = V(4.6, 0, -4.4);
  const woodCounterM = std({ color: '#6b4222', roughness: 0.75 });
  const copperM = std({ color: '#c86d3b', metalness: 0.88, roughness: 0.25 });
  // Çay ocağı tezgahı + tente
  add(new RoundedBoxGeometry(1.75, 0.78, 0.9, 3, 0.04), woodCounterM, V(teaPos.x, 0.39, teaPos.z));
  for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 8), woodCounterM, V(teaPos.x + s * 0.78, 1.05, teaPos.z - 0.35));
  add(new THREE.BoxGeometry(1.95, 0.08, 1.15), std({ color: '#b8292f', roughness: 0.7 }), V(teaPos.x, 2.1, teaPos.z), [0.12, 0, 0]);
  // Bakır Semaver + üst demlik + ateş koru
  add(new THREE.CylinderGeometry(0.22, 0.26, 0.56, 24), copperM, V(teaPos.x, 1.06, teaPos.z));
  add(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 16), copperM, V(teaPos.x, 1.42, teaPos.z));
  add(new THREE.SphereGeometry(0.14, 18, 14), std({ color: '#f0ece1', roughness: 0.3 }), V(teaPos.x, 1.48, teaPos.z));
  const coalGlow = add(new THREE.CylinderGeometry(0.19, 0.2, 0.08, 20), new THREE.MeshStandardMaterial({ color: '#ff5500', emissive: '#ff3300', emissiveIntensity: 5 }), V(teaPos.x, 0.83, teaPos.z), null, false);

  // Çay ocağı etrafında çaycı / ikram noktaları
  const knead = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = V(teaPos.x + Math.cos(a) * 1.25, 0, teaPos.z + Math.sin(a) * 1.15);
    knead.push({ pos: p, yaw: Math.atan2(teaPos.x - p.x, teaPos.z - p.z) });
  }

  // ---------- Yanlarda Köy Düğünü Masaları ----------
  const seats = [], tables = [];
  const tableM = std({ color: '#d9d2c5', roughness: 0.65 });
  const glassM = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transmission: 1, thickness: 0.02, transparent: true });
  const teaM = new THREE.MeshStandardMaterial({ color: '#a8320a', roughness: 0.2, emissive: '#3a0a00', emissiveIntensity: 0.3 });
  const tulip = [[0, 0], [0.032, 0], [0.03, 0.04], [0.024, 0.07], [0.03, 0.105], [0.036, 0.13]].map(([x, y]) => new THREE.Vector2(x, y));
  for (const s of [-1, 1]) for (const z of TABLE_Z) {
    const c = V(s * TABLE_X, 0, z);
    add(new THREE.CylinderGeometry(0.54, 0.54, 0.04, 32), tableM, V(c.x, 0.36, c.z));
    add(new THREE.CylinderGeometry(0.08, 0.14, 0.36, 12), woodCounterM, V(c.x, 0.18, c.z));
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.PI / 6, gp = V(c.x + Math.cos(a) * 0.36, 0.38, c.z + Math.sin(a) * 0.36);
      add(new THREE.LatheGeometry(tulip, 12), teaM, gp, null, false).scale.set(0.88, 0.8, 0.88);
      add(new THREE.LatheGeometry(tulip, 12), glassM, gp, null, false);
    }
    tables.push(c);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.PI / 6, p = V(c.x + Math.cos(a) * 0.92, 0, c.z + Math.sin(a) * 0.92);
      add(new RoundedBoxGeometry(0.46, 0.14, 0.44, 3, 0.04), woodCounterM, V(p.x, 0.07, p.z), [0, -a + Math.PI / 2, 0]);
      seats.push({ pos: p, yaw: Math.atan2(c.x - p.x, c.z - p.z), table: tables.length - 1 });
    }
  }

  // Muhtar / Başköşe koltuğu
  const bkPos = V(-4.6, 0, -4.6);
  add(new RoundedBoxGeometry(0.9, 0.18, 0.7, 3, 0.06), goldM, V(bkPos.x, 0.09, bkPos.z));
  const baskose = { pos: V(bkPos.x, 0.04, bkPos.z), yaw: Math.atan2(-bkPos.x, -bkPos.z) };

  // ---------- Açık Hava Işıklandırma & Panayır Ampulleri ----------
  scene.add(new THREE.HemisphereLight('#7fa4d9', '#382c1e', 0.68));
  const key = new THREE.DirectionalLight('#ffdfa8', 1.35);
  key.position.set(5, 18, 10); key.target.position.set(0, 0, -1); scene.add(key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
  Object.assign(key.shadow.camera, { left: -11, right: 11, top: 13, bottom: -13, near: 1, far: 45 });
  scene.add(key);

  const center = new THREE.PointLight('#ffcc80', 16, 12, 1.5);
  center.position.set(0, 4.8, 0);
  scene.add(center);

  const lamps = [];
  for (const s of [-1, 1]) for (const z of [-6.5, 2.5]) {
    const l = new THREE.PointLight('#ffae52', 9, 12, 1.5);
    l.position.set(s * 7.8, 3.2, z);
    scene.add(l);
    lamps.push(l);
  }

  // Meydan üstünde çapraz düğün ampul dizileri
  const bulbs = [];
  const bulbCols = ['#ffd166', '#ff6b6b', '#4ecdc4', '#ffe66d', '#ff9f1c'];
  const cords = [
    new THREE.CatmullRomCurve3([V(-7.8, 4.6, -6.5), V(0, 4.1, -2.0), V(7.8, 4.6, 2.5)]),
    new THREE.CatmullRomCurve3([V(7.8, 4.6, -6.5), V(0, 4.1, -2.0), V(-7.8, 4.6, 2.5)]),
  ];
  for (const cord of cords) {
    add(new THREE.TubeGeometry(cord, 32, 0.012, 6, false), std({ color: '#222' }), V(0, 0, 0), null, false);
    for (let i = 0; i <= 12; i++) {
      const p = cord.getPoint(i / 12);
      const col = bulbCols[i % bulbCols.length];
      const bm = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 5 });
      bulbs.push(add(new THREE.SphereGeometry(0.065, 10, 8), bm, V(p.x, p.y - 0.06, p.z), null, false));
    }
  }

  return {
    orch, knead, seats, tables, baskose,
    brideSeat, groomSeat,
    tray: { pos: teaPos, mesh: coalGlow },
    lamps, bulbs, bounds: { hw: HW - 0.9, back: BACK + 1.2, front: FRONT - 0.8 },
  };
}
