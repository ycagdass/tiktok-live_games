// 3B Köpek karakteri — sallanan kuyruk, sarkık/hareketli kulaklar, burun/dil, kafa hareketi; halayda iki ayak üstünde.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng } from './ortak.js';
import {
  V, SPH, SPH_S, Parts, Limb, furTex, furMat, plain, mat,
  addOutfitTorso, addHeadAccessory, buildFeet, attachStandardProps, solveBodyAndLimbs,
} from './parcalar3d.js';

const DOG_COATS = [
  { fur: '#d49b54', mask: '#3b2412', belly: '#f5e6cc' }, // Kangal / Anadolu çoban
  { fur: '#8c5328', mask: '#4a260c', belly: '#ebd3b5' }, // Kahverengi
  { fur: '#e2b45c', mask: '#a87528', belly: '#fbf0d9' }, // Golden / Sarı
  { fur: '#2e2b29', mask: '#1a1817', belly: '#c9884a' }, // Siyah-tan (Çoban)
  { fur: '#ded8ce', mask: '#6e655c', belly: '#ffffff' }, // Akbaş / Beyaz-gri
];
const LID = new THREE.SphereGeometry(0.082, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);

export function makeDog(o = {}) {
  const seed = o.seed || 1, r = rng(seed * 73 + 29);
  const coat = DOG_COATS[Math.abs(seed) % DOG_COATS.length];
  const furCol = o.body || coat.fur;
  const { kiyafet = 'forma', renk1 = '#7cc3ec', renk2 = '#ffffff', desen = 'duz', kafa = 'yok', kafaRenk = '#d62839', kupe = false, ayakkabi = 'yok' } = o;

  const g = new THREE.Group();
  const mFur = furMat('dog_fur_' + furCol + (seed % 3), furTex(furCol, null, seed % 3));
  const mMask = plain(coat.mask, 0.65);
  const mBelly = plain(coat.belly, 0.65);
  const mNose = plain('#181311', 0.2);
  const mTongue = plain('#e85d75', 0.4);
  const mEye = plain('#fffaf2', 0.12);
  const mPupil = plain('#21130b', 0.1);
  const mHi = mat('dog_hi', () => new THREE.MeshBasicMaterial({ color: '#ffffff' }));

  const up = new THREE.Group(); g.add(up);
  const P = new Parts();
  P.add(SPH, mFur, V(0, 0.62, 0), V(0.225, 0.35, 0.19));
  P.add(SPH, mBelly, V(0, 0.65, 0.085), V(0.15, 0.26, 0.125));
  const sleeve = addOutfitTorso(P, { kiyafet, renk1, renk2, desen });
  P.seg(V(0, 0.9, 0), V(0, 1.07, 0.03), 0.082, 0.072, mFur);
  P.build(up);

  // Kuyruk (yukarı kıvrık, neşeyle hızlı sallanır)
  const tail = new THREE.Group();
  tail.position.set(0, 0.38, -0.17);
  up.add(tail);
  const tCurve = new THREE.CatmullRomCurve3([
    V(0, 0, 0),
    V(0, 0.12, -0.2),
    V(0, 0.32, -0.3),
    V(0, 0.48, -0.2),
  ]);
  const tailMesh = new THREE.Mesh(new THREE.TubeGeometry(tCurve, 16, 0.042, 8, false), mFur);
  tailMesh.castShadow = true;
  tail.add(tailMesh);

  // Kafa
  const head = new THREE.Group(); head.position.set(0, 1.18, 0.05); up.add(head);
  const H = new Parts();
  H.add(SPH, mFur, V(0, 0.03, 0), V(0.235, 0.22, 0.22));
  // Köpek burnu / uzun ağızlık (snout)
  H.add(new RoundedBoxGeometry(0.17, 0.12, 0.18, 3, 0.045), mMask, V(0, -0.055, 0.165));
  H.add(SPH, mBelly, V(0, -0.1, 0.155), V(0.075, 0.045, 0.075));
  H.add(SPH, mNose, V(0, -0.015, 0.255), V(0.048, 0.036, 0.038));
  // Neşeli pembe dil
  H.add(new RoundedBoxGeometry(0.055, 0.065, 0.025, 2, 0.01), mTongue, V(0, -0.125, 0.22), null, { x: 0.4, y: 0, z: 0 });
  // Kaş benekleri
  for (const s of [-1, 1]) H.add(SPH_S, mBelly, V(s * 0.08, 0.12, 0.175), V(0.03, 0.018, 0.018));

  const lids = [];
  for (const s of [-1, 1]) {
    const ep = V(s * 0.09, 0.05, 0.17);
    H.add(SPH, mEye, ep, V(0.062, 0.062, 0.05));
    H.add(SPH, mPupil, ep.clone().add(V(0, -0.005, 0.04)), V(0.036, 0.036, 0.024));
    H.add(SPH_S, mHi, ep.clone().add(V(-0.012, 0.015, 0.052)), V(0.011, 0.011, 0.011));
    const lid = new THREE.Mesh(LID, mFur); lid.position.copy(ep); head.add(lid); lids.push(lid);
  }
  addHeadAccessory(H, { kafa, kafaRenk, kupe, topY: 0.22 });
  H.build(head);

  // Sarkık ve zıplayan köpek kulakları
  const ears = [];
  for (const s of [-1, 1]) {
    const eg = new THREE.Group();
    eg.position.set(s * 0.2, 0.12, 0.01);
    eg.rotation.z = s * 0.25;
    head.add(eg);
    const E = new Parts();
    E.add(new RoundedBoxGeometry(0.09, 0.22, 0.12, 3, 0.035), mMask, V(s * 0.02, -0.09, 0), null, { x: 0.1, y: 0, z: s * 0.12 });
    E.build(eg);
    ears.push(eg);
  }

  // IK kollar ve bacaklar
  const arms = [-1, 1].map(() => new Limb(up, { L1: 0.33, L2: 0.33, r: 0.045, m: mFur, pawMat: mBelly, sleeve }));
  const legs = [-1, 1].map(() => new Limb(g, { L1: 0.42, L2: 0.42, r: 0.052, m: mFur, pawMat: mBelly }));
  const feet = buildFeet(g, { ayakkabi, kafaRenk, footMat: mMask });
  const props = attachStandardProps(up, arms);

  const ph = r() * 10, blinkEvery = 3.0 + r() * 3.0, lidBase = 0.24 + r() * 0.1;
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

    // Köpek kafa yana yatırma + ritimle sallama
    const groove = st.dans + (st.kol === 'saz' || st.kol === 'kulak' || st.kol === 'darbuka' ? 1 : 0.4);
    head.rotation.z = 0.11 * Math.sin(t * 0.9 + ph) + 0.075 * Math.sin(beat * Math.PI) * groove;
    head.rotation.x = 0.05 * Math.sin(t * 0.55 + ph) - 0.065 * Math.abs(Math.sin(beat * Math.PI)) - st.lean * 0.4;

    // Kulaklar her adımda/vuruşta zıplar
    const bounce = Math.abs(Math.sin(beat * Math.PI));
    ears.forEach((e, idx) => {
      const s = idx ? 1 : -1;
      e.rotation.z = s * (0.22 + bounce * 0.22 * (0.5 + st.dans * 0.8));
      e.rotation.x = 0.08 * Math.sin(t * 3 + idx);
    });

    // Kuyruk neşeyle hızlıca sallanır
    const excited = st.dans > 0 || (t - st.kutlaT < 1.8) || st.walk > 0;
    const wagFreq = excited ? (9 + level * 2.5) : 4.5;
    tail.rotation.z = Math.sin(t * wagFreq + ph) * (excited ? 0.55 : 0.28);
    tail.rotation.x = -0.15 + (1 - st.pozT) * 0.3;

    const bt = (t + ph) % blinkEvery, blink = bt < 0.12 ? Math.sin((bt / 0.12) * Math.PI) : 0;
    lids.forEach((l) => { l.rotation.x = lidBase + blink * 1.1; });
  }

  g.userData = { state: st, update, head, up, arms, tail, ears, tur: 'kopek', shoulder: (s) => up.localToWorld(V(s * 0.22, 0.85, 0)) };
  update(0);
  return g;
}
