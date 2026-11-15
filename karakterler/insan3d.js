// 3B İnsan karakteri — sade, stilize figür (yüz ayrıntısına girmeden), yöresel yelek/elbise ve halayda el ele pozu.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng } from './ortak.js';
import {
  V, SPH, SPH_S, Parts, Limb, plain,
  addOutfitTorso, addHeadAccessory, buildFeet, attachStandardProps, solveBodyAndLimbs,
} from './parcalar3d.js';

const SKINS = ['#f5d5b8', '#ecc19c', '#dfb088', '#cc966c', '#b57e56'];
const HAIRS = ['#241811', '#3b2618', '#523420', '#181418', '#6e4526'];

export function makeHuman(o = {}) {
  const seed = o.seed || 1, r = rng(seed * 61 + 7);
  const skinCol = o.skin || SKINS[Math.abs(seed) % SKINS.length];
  const hairCol = o.hair || HAIRS[(Math.abs(seed) >> 2) % HAIRS.length];
  const { kiyafet = 'yelek', renk1 = '#1b1b1f', renk2 = '#ffffff', desen = 'duz', kafa = 'yok', kafaRenk = '#d62839', kupe = false, ayakkabi = 'spor' } = o;
  const isFemale = kiyafet === 'elbise';

  const g = new THREE.Group();
  const mSkin = plain(skinCol, 0.55);
  const mHair = plain(hairCol, 0.7);
  const mShirt = plain('#f4efe6', 0.75);
  const mPants = plain('#23242e', 0.75);
  const mSash = plain(kafaRenk || '#c81d25', 0.6);

  const up = new THREE.Group(); g.add(up);
  const P = new Parts();
  // Stilize insan gövdesi: erkeklerde gömlek + kuşak + yelek/forma, kadınlarda elbise
  P.add(SPH, isFemale ? mSkin : mShirt, V(0, 0.64, 0), V(0.205, 0.33, 0.155));
  if (!isFemale) {
    P.add(SPH, mPants, V(0, 0.28, 0), V(0.21, 0.18, 0.16));
    P.add(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 24), mSash, V(0, 0.38, 0));
  }
  const sleeve = addOutfitTorso(P, { kiyafet, renk1, renk2, desen }) || (!isFemale ? mShirt : null);
  P.seg(V(0, 0.9, 0), V(0, 1.07, 0.02), 0.068, 0.06, mSkin);
  P.build(up);

  // Sade, stilize kafa (yüz ayrıntısına girmeden temiz silüet + saç/yazma/bıyık)
  const head = new THREE.Group(); head.position.set(0, 1.19, 0.04); up.add(head);
  const H = new Parts();
  H.add(SPH, mSkin, V(0, 0.03, 0), V(0.2, 0.22, 0.19));
  // Sade stilize göz noktaları
  const mEye = plain('#221814', 0.2);
  for (const s of [-1, 1]) {
    H.add(SPH_S, mEye, V(s * 0.068, 0.04, 0.178), V(0.02, 0.024, 0.012));
  }
  if (isFemale) {
    // Topuz / uzun saç silüeti
    H.add(SPH, mHair, V(0, 0.08, -0.03), V(0.215, 0.2, 0.2));
    H.add(SPH, mHair, V(0, 0.04, -0.19), V(0.095, 0.095, 0.095));
  } else {
    // Erkek saç + isteğe bağlı pala bıyık
    H.add(SPH, mHair, V(0, 0.1, -0.02), V(0.21, 0.17, 0.195));
    if (seed % 2 === 0) {
      for (const s of [-1, 1]) {
        H.add(new RoundedBoxGeometry(0.065, 0.022, 0.025, 2, 0.008), mHair, V(s * 0.032, -0.045, 0.185), null, { x: 0, y: 0, z: -s * 0.2 });
      }
    }
  }
  addHeadAccessory(H, { kafa, kafaRenk, kupe, topY: 0.21 });
  H.build(head);

  // IK kollar (el ele tutuşma için ten rengi eller) ve bacaklar
  const arms = [-1, 1].map(() => new Limb(up, { L1: 0.33, L2: 0.33, r: 0.042, m: mSkin, pawMat: mSkin, sleeve }));
  const legs = [-1, 1].map(() => new Limb(g, { L1: 0.42, L2: 0.42, r: 0.052, m: isFemale ? mSkin : mPants, pawMat: mSkin }));
  const feet = buildFeet(g, { ayakkabi: ayakkabi === 'yok' ? 'spor' : ayakkabi, kafaRenk, footMat: plain('#2a1d15') });
  const props = attachStandardProps(up, arms);

  const ph = r() * 10;
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
    const groove = st.dans + (st.kol === 'saz' || st.kol === 'kulak' || st.kol === 'darbuka' ? 1 : 0.3);
    head.rotation.z = 0.06 * Math.sin(t * 0.7 + ph) + 0.05 * Math.sin(beat * Math.PI) * groove;
    head.rotation.x = 0.04 * Math.sin(t * 0.45 + ph) - 0.05 * Math.abs(Math.sin(beat * Math.PI)) - st.lean * 0.4;
  }

  g.userData = { state: st, update, head, up, arms, tur: 'insan', shoulder: (s) => up.localToWorld(V(s * 0.22, 0.85, 0)) };
  update(0);
  return g;
}
