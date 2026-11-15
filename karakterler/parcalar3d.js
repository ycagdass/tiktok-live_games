// 3B karakterler için ortak Three.js parça birleştirici, IK uzuv çözücü, dokular ve çalgı aksesuarları.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from './ortak.js';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const UP = V(0, 1, 0);
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

// ---------- önbellekli dokular & malzemeler ----------
const cache = new Map();
export const cached = (key, fn) => { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); };

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

const noise = (x, w, h, a = 0.05) => {
  for (let i = 0; i < 1600; i++) {
    x.fillStyle = `rgba(0,0,0,${Math.random() * a})`;
    x.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
};

export const furTex = (base, stripeCol, v = 1) => cached(`fur_${base}_${stripeCol}_${v}`, () => canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  const r = rng(v * 43 + 11);
  if (stripeCol) {
    x.fillStyle = stripeCol;
    for (let i = 0; i < 7; i++) {
      const y = (h * (i + 0.5)) / 7;
      x.fillRect(0, y - 5, w, 9);
    }
  }
  for (let i = 0; i < 600; i++) {
    x.fillStyle = i % 2 ? `rgba(255,255,255,${r() * 0.07})` : `rgba(20,10,5,${r() * 0.1})`;
    x.fillRect(r() * w, r() * h, 2, 6);
  }
}));

export const stripeTex = (a, b) => cached(`st_${a}_${b}`, () => canvasTex(512, 256, (x, w, h) => {
  for (let i = 0; i < 10; i++) { x.fillStyle = i % 2 ? a : b; x.fillRect((i * w) / 10, 0, w / 10 + 1, h); }
  noise(x, w, h);
}));

export const knitTex = (c) => cached(`kn_${c}`, () => canvasTex(256, 128, (x, w, h) => {
  x.fillStyle = c; x.fillRect(0, 0, w, h);
  for (let i = 0; i < w; i += 5) { x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(i, 0, 2, h); }
  noise(x, w, h, 0.04);
}));

export const leopardTex = (c) => cached(`lp_${c}`, () => canvasTex(512, 256, (x, w, h) => {
  x.fillStyle = c; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 120; i++) {
    const cx = Math.random() * w, cy = Math.random() * h, rr = 6 + Math.random() * 9;
    x.fillStyle = '#7a4a1e'; x.beginPath(); x.ellipse(cx, cy, rr, rr * 0.8, Math.random() * 3, 0, 7); x.fill();
    x.strokeStyle = '#1e120a'; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, rr, Math.random() * 3, Math.random() * 3 + 3.5); x.stroke();
  }
}));

export const floralTex = (c, d) => cached(`fl_${c}_${d}`, () => canvasTex(512, 256, (x, w, h) => {
  x.fillStyle = c; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 200; i++) {
    x.fillStyle = d; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 0, 7); x.fill();
  }
  noise(x, w, h);
}));

export const mat = (key, fn) => cached('m_' + key, fn);
export const plain = (c, rough = 0.5) => mat(`pl_${c}_${rough}`, () => new THREE.MeshStandardMaterial({ color: c, roughness: rough }));
export const furMat = (key, map, rough = 0.68) => mat(`fm_${key}`, () => new THREE.MeshStandardMaterial({ map, roughness: rough }));
export const cloth = (key, map) => mat(`cl_${key}`, () => new THREE.MeshStandardMaterial({ map, roughness: 0.82, side: THREE.DoubleSide }));
export const metal = (c = '#d8b25a') => mat(`mt_${c}`, () => new THREE.MeshStandardMaterial({ color: c, metalness: 0.95, roughness: 0.25 }));
export const wood = (c = '#7a4a22') => mat(`wd_${c}`, () => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 }));

export const SPH = new THREE.SphereGeometry(1, 22, 15);
export const SPH_S = new THREE.SphereGeometry(1, 10, 8);

// ---------- statik parça birleştirici ----------
export class Parts {
  constructor() { this.list = []; }
  add(geo, m, pos, scl, rot, quat) {
    const q = quat || new THREE.Quaternion().setFromEuler(new THREE.Euler(rot ? rot.x : 0, rot ? rot.y : 0, rot ? rot.z : 0));
    const M = new THREE.Matrix4().compose(pos || V(0, 0, 0), q, scl || V(1, 1, 1));
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.applyMatrix4(M);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    this.list.push([g, m]);
  }
  seg(a, b, r0, r1, m, rad = 8) {
    const d = b.clone().sub(a), L = d.length();
    if (L < 1e-5) return;
    this.add(new THREE.CylinderGeometry(r1, r0, L, rad), m, a.clone().add(b).multiplyScalar(0.5), null, null, new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()));
  }
  build(parent, shadow = true) {
    const by = new Map();
    for (const [g, m] of this.list) { if (!by.has(m)) by.set(m, []); by.get(m).push(g); }
    for (const [m, gs] of by) {
      const merged = mergeGeometries(gs, false);
      const mesh = new THREE.Mesh(merged, m); mesh.castShadow = shadow; mesh.receiveShadow = true; parent.add(mesh);
      gs.forEach((x) => x.dispose());
    }
    this.list = [];
  }
}

// ---------- İki kemikli IK uzuv (kol / bacak) ----------
export class Limb {
  constructor(parent, { L1, L2, r, m, pawMat = null, sleeve = null }) {
    this.L1 = L1; this.L2 = L2;
    this.a = new THREE.Group(); this.b = new THREE.Group(); parent.add(this.a, this.b);
    const pa = new Parts(), pb = new Parts();
    pa.add(new THREE.CylinderGeometry(r * 0.85, r, L1, 8).translate(0, L1 / 2, 0), m);
    pa.add(SPH_S, m, V(0, 0, 0), V(r * 1.12, r * 1.12, r * 1.12));
    pa.add(SPH_S, m, V(0, L1, 0), V(r * 0.95, r * 0.95, r * 0.95));
    if (sleeve) pa.add(new THREE.CylinderGeometry(r * 1.55, r * 1.7, L1 * 0.48, 12, 1, true).translate(0, L1 * 0.24, 0), sleeve);
    pb.add(new THREE.CylinderGeometry(r * 0.68, r * 0.85, L2, 8).translate(0, L2 / 2, 0), m);
    if (pawMat) {
      pb.add(SPH_S, pawMat, V(0, L2, 0.01), V(r * 1.15, r * 0.95, r * 1.25));
    }
    pa.build(this.a, false); pb.build(this.b, false);
    this.hand = V(0, 0, 0);
  }
  solve(root, target, pole) {
    const d = target.clone().sub(root), L1 = this.L1, L2 = this.L2;
    const dist = clamp(d.length(), Math.abs(L1 - L2) + 1e-3, L1 + L2 - 1e-3);
    const dir = d.lengthSq() > 1e-9 ? d.normalize() : V(0, -1, 0);
    const A = Math.acos(clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1));
    const p = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir)));
    if (p.lengthSq() < 1e-6) p.set(0, 0, 1);
    p.normalize();
    const elbow = root.clone().addScaledVector(dir, Math.cos(A) * L1).addScaledVector(p, Math.sin(A) * L1);
    this.hand.copy(root).addScaledVector(dir, dist);
    this.a.position.copy(root); this.a.quaternion.setFromUnitVectors(UP, elbow.clone().sub(root).normalize());
    this.b.position.copy(elbow); this.b.quaternion.setFromUnitVectors(UP, this.hand.clone().sub(elbow).normalize());
    return this.hand;
  }
}

// ---------- Ortak kıyafet / şapka / ayakkabı yardımcı çizicileri ----------
export function addOutfitTorso(P, { kiyafet, renk1, renk2, desen }) {
  const lathe = (pts, m, segs = 36, ps = 0, pl = Math.PI * 2, zs = 1) =>
    P.add(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segs, ps, pl), m, null, V(1, 1, zs));
  let sleeve = null;
  if (kiyafet === 'forma' || kiyafet === 'atlet') {
    const m = kiyafet === 'forma' ? cloth('f_' + renk1 + renk2, stripeTex(renk1, renk2)) : cloth('a_' + renk1, knitTex(renk1));
    lathe([[0, 0.3], [0.24, 0.32], [0.25, 0.45], [0.235, 0.66], [0.22, 0.82], [0.18, 0.91], [0.1, kiyafet === 'forma' ? 0.97 : 0.92]], m, 36, 0, Math.PI * 2, 0.88);
    if (kiyafet === 'forma') sleeve = m;
  } else if (kiyafet === 'elbise') {
    const map = desen === 'leopar' ? leopardTex(renk1) : desen === 'cicek' ? floralTex(renk1, renk2) : knitTex(renk1);
    const m = cloth('e_' + desen + renk1 + renk2, map);
    lathe([[0.1, 0.92], [0.19, 0.88], [0.215, 0.72], [0.21, 0.56], [0.27, 0.4], [0.31, 0.24], [0.35, 0.06], [0.42, -0.2]], m, 40);
    for (const s of [-1, 1]) P.seg(V(s * 0.09, 0.9, 0.06), V(s * 0.14, 0.95, -0.02), 0.012, 0.012, m);
  } else if (kiyafet === 'yelek') {
    const m = mat('ye_' + renk1, () => new THREE.MeshStandardMaterial({ color: renk1, roughness: 0.45, side: THREE.DoubleSide }));
    lathe([[0.23, 0.36], [0.255, 0.45], [0.245, 0.66], [0.23, 0.82], [0.19, 0.9], [0.12, 0.95]], m, 32, 0.45, Math.PI * 2 - 0.9, 0.9);
    for (const ph of [0.45, -0.45]) for (let k = 0; k < 5; k++) {
      const rad = 0.255 - k * 0.012;
      P.add(SPH_S, metal('#e8e8e8'), V(Math.sin(ph) * rad, 0.42 + k * 0.1, Math.cos(ph) * rad * 0.9), V(0.016, 0.016, 0.016));
    }
  }
  return sleeve;
}

export function addHeadAccessory(H, { kafa, kafaRenk, kupe, topY = 0.2 }) {
  const acc = plain(kafaRenk);
  if (kupe) {
    for (const s of [-1, 1]) {
      H.add(new THREE.TorusGeometry(0.035, 0.007, 8, 20), metal(), V(s * 0.22, -0.08, 0.02), null, { x: 0, y: Math.PI / 2, z: 0 });
    }
  }
  if (kafa === 'cicek') {
    const fp = V(0.16, topY - 0.02, 0.08), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0.5, -0.5));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const off = V(Math.cos(a) * 0.055, Math.sin(a) * 0.055, 0).applyQuaternion(q);
      H.add(SPH, acc, fp.clone().add(off), V(0.055, 0.04, 0.02), null, q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), a)));
    }
    H.add(SPH_S, plain('#ffd23f'), fp.clone().add(V(0, 0, 0.015).applyQuaternion(q)), V(0.025, 0.025, 0.02));
  } else if (kafa === 'sapka') {
    H.add(new THREE.CylinderGeometry(0.26, 0.26, 0.018, 32), acc, V(0, topY, -0.01));
    H.add(new THREE.CylinderGeometry(0.14, 0.16, 0.14, 24), acc, V(0, topY + 0.08, -0.01));
    H.add(new THREE.CylinderGeometry(0.165, 0.165, 0.032, 24), plain('#3a1010'), V(0, topY + 0.025, -0.01));
  } else if (kafa === 'bere') {
    H.add(SPH, acc, V(0.04, topY, -0.02), V(0.22, 0.07, 0.2), { x: 0, y: 0, z: -0.25 });
  } else if (kafa === 'kasket') {
    H.add(SPH, acc, V(0, topY - 0.02, -0.01), V(0.22, 0.095, 0.2));
    H.add(new THREE.CylinderGeometry(0.13, 0.13, 0.015, 20, 1, false, -Math.PI / 2, Math.PI), acc, V(0, topY - 0.04, 0.15));
  } else if (kafa === 'bant') {
    H.add(new THREE.TorusGeometry(0.215, 0.024, 10, 32), acc, V(0, topY - 0.07, 0), null, { x: Math.PI / 2 + 0.15, y: 0, z: 0 });
  }
}

export function buildFeet(g, { ayakkabi, kafaRenk, footMat }) {
  return [-1, 1].map(() => {
    const f = new THREE.Group(); g.add(f); const F = new Parts();
    if (ayakkabi === 'spor') {
      F.add(new RoundedBoxGeometry(0.11, 0.07, 0.22, 2, 0.025), plain('#f4f4f4'), V(0, 0.01, 0.05));
      F.add(new RoundedBoxGeometry(0.115, 0.022, 0.23, 2, 0.008), plain('#1d3557'), V(0, -0.025, 0.05));
    } else if (ayakkabi === 'topuklu') {
      F.add(new RoundedBoxGeometry(0.08, 0.05, 0.17, 2, 0.02), plain(kafaRenk || '#d62839'), V(0, 0.01, 0.05));
      F.add(new THREE.CylinderGeometry(0.008, 0.012, 0.07, 8), plain(kafaRenk || '#d62839'), V(0, -0.025, -0.03));
    } else {
      F.add(new RoundedBoxGeometry(0.105, 0.06, 0.19, 2, 0.025), footMat || plain('#3a2518'), V(0, 0.005, 0.045));
    }
    F.build(f, false); return f;
  });
}

// ---------- Çalgı ve el aksesuarları ----------
export function sazProp() {
  const g = new THREE.Group(), p = new Parts();
  const w = wood('#8a5426'), dk = wood('#3a2010');
  p.add(SPH, w, V(0, 0, 0), V(0.12, 0.17, 0.08));
  p.add(new THREE.CylinderGeometry(0.11, 0.11, 0.008, 24), plain('#e6cf9e'), V(0, 0, 0.055), null, { x: Math.PI / 2, y: 0, z: 0 });
  p.add(new THREE.BoxGeometry(0.035, 0.62, 0.02), dk, V(0, 0.45, 0.05));
  p.add(new THREE.BoxGeometry(0.05, 0.12, 0.03), dk, V(0, 0.8, 0.04));
  for (let i = 0; i < 4; i++) p.add(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 6), dk, V(0, 0.76 + i * 0.025, 0.04), null, { x: 0, y: 0, z: Math.PI / 2 });
  p.add(new THREE.BoxGeometry(0.012, 0.9, 0.002), metal('#e8e2d0'), V(0, 0.36, 0.062));
  p.build(g);
  return g;
}

export function darbukaProp() {
  const g = new THREE.Group(), p = new Parts();
  p.add(new THREE.LatheGeometry([[0.035, 0], [0.06, 0.02], [0.05, 0.1], [0.07, 0.17], [0.13, 0.26], [0.135, 0.3]].map(([x, y]) => new THREE.Vector2(x, y)), 24), metal('#c9a24a'));
  p.add(new THREE.CylinderGeometry(0.135, 0.135, 0.01, 24), plain('#efe4c8'), V(0, 0.3, 0));
  p.build(g);
  return g;
}

export function mendilProp() {
  const geo = new THREE.PlaneGeometry(0.22, 0.22, 6, 6);
  const m = new THREE.Mesh(geo, mat('mendil', () => new THREE.MeshStandardMaterial({ color: '#d7263d', roughness: 0.7, side: THREE.DoubleSide })));
  m.castShadow = true;
  m.userData.base = geo.attributes.position.array.slice();
  return m;
}

export function attachStandardProps(up, arms) {
  const props = {};
  props.saz = sazProp(); props.saz.position.set(0.1, 0.5, 0.26); props.saz.rotation.set(0.15, 0.25, 0.95); up.add(props.saz);
  props.darbuka = darbukaProp(); props.darbuka.position.set(0, 0.08, 0.36); props.darbuka.rotation.set(-1.1, 0, 0); up.add(props.darbuka);
  props.mendil = mendilProp(); arms[0].b.add(props.mendil); props.mendil.position.set(-0.06, 0.38, 0); props.mendil.rotation.set(0, 0, -0.3);
  return props;
}

// ---------- Ortak iskelet/animasyon çözücü (kedi, köpek, insan için ortak hareket dili) ----------
export function solveBodyAndLimbs({ t, beat, level, st, ph, up, g, legs, feet, arms, props, tmpW }) {
  st.pozT += ((st.poz === 'ayak' ? 1 : 0) - st.pozT) * 0.12;
  const sT = smooth(st.pozT);
  const fr = beat - Math.floor(beat), bar = ((beat % 4) + 4) % 4;
  const bob = Math.sin(fr * Math.PI);

  let hip = lerp(0.12, 0.78, sT);
  if (st.dans > 0) {
    hip -= st.dans * (0.025 + level * 0.012) * bob;
    if (level >= 3 && bar >= 3) hip -= st.dans * 0.28 * Math.sin((bar - 3) * Math.PI);
  }
  if (st.walk > 0) hip -= 0.02 * Math.abs(Math.sin(t * 9 + ph)) * st.walk;
  const jt = t - st.jumpT; if (jt < 0.6) hip += Math.sin((jt / 0.6) * Math.PI) * 0.25;
  const kt = t - (st.kutlaT || -99);
  if (kt < 1.8) hip += Math.abs(Math.sin(kt * 9)) * 0.12;

  up.position.y = hip;
  up.rotation.x = st.lean;
  up.rotation.y = level >= 2 && st.dans > 0 ? Math.sin(beat * Math.PI * 4) * 0.05 * (level - 1) : 0;
  up.scale.y = 1 + 0.012 * Math.sin(t * 2 + ph);
  g.updateMatrixWorld(true);

  // bacaklar (otururken bağdaş, ayakta/halayda iki ayak üstünde adım + vuruş)
  for (let i = 0; i < 2; i++) {
    const s = i ? 1 : -1, L = legs[i], f = feet[i];
    const hipP = V(s * 0.11, hip + 0.06, 0.02);
    const sitA = V(-s * 0.1, 0.06, 0.4), sitPole = V(s, 0.25, 0.35);
    let ax = s * 0.13, ay = 0.07, az = 0;
    if (st.dans > 0) {
      const b = Math.floor(bar), u = bar - b, lift = Math.sin(u * Math.PI);
      const mover = b === 1 || b === 3 ? 1 : -1;
      if (mover === s) {
        if (b === 3) { az += lift * 0.2 * st.dans; ay += lift * 0.14 * st.dans; }
        else { ax += lerp(0.07, -0.07, u) * st.dans; ay += lift * 0.09 * st.dans; }
      }
    }
    if (st.walk > 0) {
      const w = Math.sin(t * 9 + ph + (s > 0 ? Math.PI : 0));
      az += w * 0.16 * st.walk; ay += Math.max(0, w) * 0.08 * st.walk;
    }
    const target = sitA.lerp(V(ax, ay, az), sT), pole = sitPole.lerp(V(0, 0, 1), sT).normalize();
    const hand = L.solve(hipP, target, pole);
    f.position.copy(hand); f.rotation.set(0, lerp(-s * 1.2, 0, sT), 0);
  }

  // kollar
  const celebrating = kt < 1.8 || st.kol === 'kutla' || st.kol === 'hediye';
  for (let i = 0; i < 2; i++) {
    const s = i ? 1 : -1, A = arms[i];
    const sh = V(s * 0.22, 0.85, 0);
    let tg, pole = V(s * 0.6, -0.4, -0.7);
    const hw = st.hands[i];
    if (celebrating) {
      tg = V(s * 0.34, 1.35 + 0.1 * Math.sin(t * 11 + i * 2), 0.2);
      pole = V(s, 0, -0.3);
    } else if (hw && (st.kol === 'halay' || st.kol === 'yogur' || (st.kol === 'mendil' && s > 0))) {
      tg = up.worldToLocal(tmpW.copy(hw)).clone();
    } else if (st.kol === 'saz') {
      tg = s < 0 ? V(-0.32, 0.92 + Math.sin(t * 1.3) * 0.02, 0.36) : V(0.12 + Math.sin(beat * Math.PI * 2) * 0.03, 0.55, 0.36);
      if (s < 0) pole = V(-0.5, -0.6, 0.4);
    } else if (st.kol === 'kulak') {
      tg = s > 0 ? V(0.21, 1.2, 0.08) : V(-0.32, 0.62 + 0.08 * Math.sin(t * 1.4 + ph), 0.36);
      if (s > 0) pole = V(1, -0.2, 0.2);
    } else if (st.kol === 'darbuka') {
      const hit = Math.pow(Math.abs(Math.sin((beat * 2 + (s > 0 ? 0.5 : 0)) * Math.PI)), 3);
      tg = V(s * 0.09, 0.42 + hit * 0.1, 0.48);
    } else if (st.kol === 'mendil' && s < 0) {
      tg = V(-0.34, 1.42 + 0.05 * Math.sin(t * 6), 0.18);
      pole = V(-1, 0, -0.3);
    } else if (st.kol === 'yuru') {
      tg = V(s * 0.27, 0.42, 0.06 + Math.sin(t * 9 + ph + (s > 0 ? 0 : Math.PI)) * 0.12);
    } else {
      tg = st.pozT < 0.5 ? V(s * 0.27, 0.3, 0.28) : V(s * 0.3, 0.38, 0.12);
      if (t - st.talkT < 3 && s > 0) tg = V(0.32, 0.85 + 0.06 * Math.sin(t * 7), 0.32);
    }
    A.solve(sh, tg, pole);
  }

  props.saz.visible = st.kol === 'saz';
  props.darbuka.visible = st.kol === 'darbuka';
  props.mendil.visible = st.kol === 'mendil' || st.kol === 'hediye';
  if (props.mendil.visible) {
    const pos = props.mendil.geometry.attributes.position, base = props.mendil.userData.base;
    for (let k = 0; k < pos.count; k++) {
      const x = base[k * 3], y = base[k * 3 + 1];
      pos.setZ(k, Math.sin(t * 9 + x * 18 + y * 6) * 0.03 * (x + 0.11) * 4);
    }
    pos.needsUpdate = true;
  }
}
