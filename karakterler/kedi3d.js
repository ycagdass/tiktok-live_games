// 3B Kedi karakteri — kuyruk, dik kulaklar, bıyıklar, kafa hareketi; otururken minderde, halayda iki arka ayak üstünde.
import * as THREE from 'three';
import { rng } from './ortak.js';
import {
  V, SPH, SPH_S, Parts, Limb, furTex, furMat, plain, mat,
  addOutfitTorso, addHeadAccessory, buildFeet, attachStandardProps, solveBodyAndLimbs,
} from './parcalar3d.js';

const CAT_COATS = [
  { fur: '#e08238', stripe: '#9e4710', belly: '#faeddc' }, // Tekir sarman
  { fur: '#8c929c', stripe: '#4a4e57', belly: '#eef0f4' }, // Gri tekir
  { fur: '#f2ede4', stripe: '#d8cfc0', belly: '#ffffff' }, // Van kedisi / beyaz
  { fur: '#26252a', stripe: '#141317', belly: '#f4f1ea' }, // Smokin siyah-beyaz
  { fur: '#c87d4b', stripe: '#5e3216', belly: '#f7e8d4' }, // Tarçın
];
const LID = new THREE.SphereGeometry(0.088, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);

export function makeCat(o = {}) {
  const seed = o.seed || 1, r = rng(seed * 89 + 19);
  const coat = CAT_COATS[Math.abs(seed) % CAT_COATS.length];
  const furCol = o.body || coat.fur;
  const { kiyafet = 'forma', renk1 = '#7cc3ec', renk2 = '#ffffff', desen = 'duz', kafa = 'yok', kafaRenk = '#d62839', kupe = false, ayakkabi = 'yok' } = o;

  const g = new THREE.Group();
  const mFur = furMat('cat_fur_' + furCol + (seed % 3), furTex(furCol, coat.stripe, seed % 3));
  const mBelly = plain(coat.belly, 0.65);
  const mPink = plain('#f294a5', 0.45);
  const mEye = mat('cat_eye_' + (seed % 2), () => new THREE.MeshStandardMaterial({ color: seed % 2 ? '#7ae582' : '#f9c74f', roughness: 0.12 }));
  const mPupil = plain('#100c08', 0.08);
  const mHi = mat('cat_hi', () => new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  const mWhisker = plain('#f8f6f0', 0.3);

  const up = new THREE.Group(); g.add(up);
  const P = new Parts();
  // Gövde + göğüs tüyleri
  P.add(SPH, mFur, V(0, 0.62, 0), V(0.21, 0.34, 0.18));
  P.add(SPH, mBelly, V(0, 0.64, 0.08), V(0.14, 0.25, 0.12));
  const sleeve = addOutfitTorso(P, { kiyafet, renk1, renk2, desen });
  P.seg(V(0, 0.9, 0), V(0, 1.07, 0.03), 0.075, 0.065, mFur);
  P.build(up);

  // Kuyruk (uzun, S kıvrımlı, ritimle ve coşkuyla sallanır)
  const tail = new THREE.Group();
  tail.position.set(0, 0.36, -0.16);
  up.add(tail);
  const tCurve = new THREE.CatmullRomCurve3([
    V(0, 0, 0),
    V(0, 0.08, -0.22),
    V(0, 0.28, -0.38),
    V(0, 0.52, -0.34),
    V(0, 0.64, -0.22),
  ]);
  const tailMesh = new THREE.Mesh(new THREE.TubeGeometry(tCurve, 20, 0.036, 8, false), mFur);
  tailMesh.castShadow = true;
  tail.add(tailMesh);
  const tailTip = new THREE.Mesh(SPH_S, mBelly);
  tailTip.position.set(0, 0.64, -0.22);
  tailTip.scale.set(0.04, 0.04, 0.04);
  tail.add(tailTip);

  // Kafa
  const head = new THREE.Group(); head.position.set(0, 1.18, 0.05); up.add(head);
  const H = new Parts();
  H.add(SPH, mFur, V(0, 0.03, 0), V(0.24, 0.21, 0.21));
  // Yanak pofudukları + ağızlık
  H.add(SPH, mBelly, V(-0.055, -0.05, 0.16), V(0.075, 0.055, 0.06));
  H.add(SPH, mBelly, V(0.055, -0.05, 0.16), V(0.075, 0.055, 0.06));
  H.add(SPH, mBelly, V(0, -0.09, 0.13), V(0.055, 0.035, 0.05));
  // Pembe üçgen burun
  H.add(new THREE.ConeGeometry(0.032, 0.035, 3), mPink, V(0, -0.02, 0.215), null, { x: Math.PI, y: 0, z: 0 });

  // Gözler + bıyıklar
  const lids = [];
  for (const s of [-1, 1]) {
    const ep = V(s * 0.095, 0.04, 0.165);
    H.add(SPH, mEye, ep, V(0.068, 0.068, 0.05));
    H.add(SPH, mPupil, ep.clone().add(V(0, 0, 0.042)), V(0.022, 0.052, 0.02));
    H.add(SPH_S, mHi, ep.clone().add(V(-0.015, 0.018, 0.055)), V(0.012, 0.012, 0.012));
    const lid = new THREE.Mesh(LID, mFur); lid.position.copy(ep); head.add(lid); lids.push(lid);
    // 3 bıyık teli
    for (let w = -1; w <= 1; w++) {
      H.seg(V(s * 0.09, -0.045 + w * 0.018, 0.18), V(s * 0.27, -0.035 + w * 0.035, 0.15), 0.004, 0.002, mWhisker, 5);
    }
  }
  addHeadAccessory(H, { kafa, kafaRenk, kupe, topY: 0.21 });
  H.build(head);

  // Hareketli dik kedi kulakları
  const ears = [];
  for (const s of [-1, 1]) {
    const eg = new THREE.Group();
    eg.position.set(s * 0.14, 0.17, 0.01);
    eg.rotation.z = -s * 0.22;
    head.add(eg);
    const E = new Parts();
    E.add(new THREE.ConeGeometry(0.085, 0.18, 4).translate(0, 0.08, 0), mFur, V(0, 0, 0), V(1, 1, 0.55), { x: 0, y: Math.PI / 4, z: 0 });
    E.add(new THREE.ConeGeometry(0.052, 0.13, 4).translate(0, 0.07, 0.018), mPink, V(0, 0, 0), V(1, 1, 0.35), { x: 0, y: Math.PI / 4, z: 0 });
    E.build(eg);
    ears.push(eg);
  }

  // IK kollar ve arka bacaklar (halayda iki arka ayak üstüne kalkar)
  const arms = [-1, 1].map(() => new Limb(up, { L1: 0.32, L2: 0.32, r: 0.042, m: mFur, pawMat: mBelly, sleeve }));
  const legs = [-1, 1].map(() => new Limb(g, { L1: 0.41, L2: 0.41, r: 0.05, m: mFur, pawMat: mBelly }));
  const feet = buildFeet(g, { ayakkabi, kafaRenk, footMat: mBelly });
  const props = attachStandardProps(up, arms);

  const ph = r() * 10, blinkEvery = 3.2 + r() * 2.8, lidBase = 0.22 + r() * 0.1;
  const st = {
    poz: 'otur', pozT: 0,
    kol: 'dinlen',
    hands: [null, null],
    walk: 0, dans: 0, lean: 0,
    talkT: -99, jumpT: -99, kutlaT: -99, hediyeT: -99,
  };
  const tmpW = V(0, 0, 0);

  function update(t, beat = 0, level = 0) {
    solveBodyAndLimbs({ t, beat, level, st, ph, up, g, legs, feet, arms, props, tmpW });

    // Kafa, kulak ve kuyruk animasyonu
    const groove = st.dans + (st.kol === 'saz' || st.kol === 'kulak' || st.kol === 'darbuka' ? 1 : 0.35);
    head.rotation.z = 0.08 * Math.sin(t * 0.8 + ph) + 0.065 * Math.sin(beat * Math.PI) * groove;
    head.rotation.x = 0.05 * Math.sin(t * 0.5 + ph) - 0.05 * Math.abs(Math.sin(beat * Math.PI)) - st.lean * 0.4;
    head.rotation.y = 0.06 * Math.sin(t * 0.6 + ph);

    ears.forEach((e, idx) => {
      const s = idx ? 1 : -1;
      const twitch = Math.pow(Math.max(0, Math.sin(t * 3.5 + ph * 2 + idx * 1.7)), 8) * 0.28;
      e.rotation.z = -s * (0.22 + twitch) + 0.06 * Math.sin(beat * Math.PI * 2 + idx) * groove;
      e.rotation.x = 0.08 * Math.sin(t * 2.1 + idx);
    });

    const wagSpeed = st.dans > 0 || (t - st.kutlaT < 1.8) ? (3.5 + level * 1.2) : 1.8;
    tail.rotation.z = Math.sin(t * wagSpeed + ph) * (0.35 + st.dans * 0.25);
    tail.rotation.x = -0.25 + (1 - st.pozT) * 0.35 + Math.cos(t * wagSpeed * 0.5) * 0.08;

    const bt = (t + ph) % blinkEvery, blink = bt < 0.13 ? Math.sin((bt / 0.13) * Math.PI) : 0;
    lids.forEach((l) => { l.rotation.x = lidBase + blink * 1.15; });
  }

  g.userData = { state: st, update, head, up, arms, tail, ears, tur: 'kedi', shoulder: (s) => up.localToWorld(V(s * 0.22, 0.85, 0)) };
  update(0);
  return g;
}
