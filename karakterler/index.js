// Ortak 3B Karakter Seçimi ve Üretim Modülü
// Türler: 'bocek' (varsayılan), 'kedi', 'kopek', 'insan'
// karakterYap(tur, renk, ad, opsiyonlar) -> her tür için birebir aynı animasyon arayüzünü döndürür.
import * as THREE from 'three';
import { makeRoach } from './bocek3d.js';
import { makeCat } from './kedi3d.js';
import { makeDog } from './kopek3d.js';
import { makeHuman } from './insan3d.js';
import { mendilProp } from './parcalar3d.js';
import {
  TURLER, TUR_ETIKET, rng, hashStr, turNormalize, secilenTur, yorumdanTur, outfitFor,
} from './ortak.js';

export {
  TURLER, TUR_ETIKET, rng, hashStr, turNormalize, secilenTur, yorumdanTur, outfitFor,
  makeRoach, makeCat, makeDog, makeHuman,
};

export function mendilYap() {
  return mendilProp();
}

/**
 * Verilen tür, renk ve ad ile 3B karakter nesnesi (THREE.Group) üretir.
 * Oyun kodu karakterin böcek, kedi, köpek veya insan olduğundan habersiz çalışır.
 *
 * @param {string} tur - 'bocek' | 'kedi' | 'kopek' | 'insan' | 'karisik'
 * @param {string|null} renk - Kıyafet ana rengi (örn. '#e85d75') veya null (varsayılan palet)
 * @param {string} ad - Karakterin / izleyicinin adı
 * @param {object} ops - Ek seçenekler (seed, cinsiyet, gender, kiyafet, desen, kafa, kafaRenk, kupe, ayakkabi, body, skin)
 */
export function karakterYap(tur = 'bocek', renk = null, ad = 'Misafir', ops = {}) {
  const seed = ops.seed != null ? ops.seed : hashStr(String(ad || 'misafir'));
  const resolvedTur = secilenTur(tur || 'bocek', seed);
  const rawCins = ops.cinsiyet || (ops.gender === 'f' ? 'kadin' : ops.gender === 'm' ? 'erkek' : null);
  const cinsiyet = rawCins || (seed % 2 === 0 ? 'erkek' : 'kadin');
  const baseOutfit = outfitFor(seed, cinsiyet, renk || ops.renk1 || null);
  const merged = {
    seed,
    cinsiyet,
    ...baseOutfit,
    ...ops,
    ...(renk ? { renk1: renk } : {}),
  };

  let ch;
  switch (resolvedTur) {
    case 'kedi':
      ch = makeCat(merged);
      break;
    case 'kopek':
      ch = makeDog(merged);
      break;
    case 'insan':
      ch = makeHuman(merged);
      break;
    case 'bocek':
    default:
      ch = makeRoach(merged);
      break;
  }

  const ud = ch.userData;
  const st = ud.state;
  ud.tur = resolvedTur;
  ud.renk = merged.renk1;
  ud.ad = ad || 'Misafir';

  // Yardımcı referanslar (el, gövde — Limb.b önkol/el THREE.Group nesnesidir)
  if (!ud.body) ud.body = ud.up || ch;
  if (!ud.handL || !ud.handL.isObject3D) {
    ud.handL = (ud.arms && ud.arms[0] && ud.arms[0].b) || new THREE.Group();
    if (!ud.handL.parent) ch.add(ud.handL);
  }
  if (!ud.handR || !ud.handR.isObject3D) {
    ud.handR = (ud.arms && ud.arms[1] && ud.arms[1].b) || new THREE.Group();
    if (!ud.handR.parent) ch.add(ud.handR);
  }

  const stepAnim = (beat, energy = 0.5) => {
    if (beat != null && typeof ud.update === 'function') {
      const tNow = typeof performance !== 'undefined' ? performance.now() * 0.001 : Date.now() * 0.001;
      const lvl = Math.min(3, Math.max(0, Math.floor((Number(energy) || 0) * 3.5)));
      ud.update(tNow, Number(beat) || 0, lvl);
    }
  };

  // Animasyon arayüzü yardımcı metotları (hem ch üzerinden hem ch.userData üzerinden çağrılabilir)
  const yuruFn = (beatOrHiz = 1, energy = 0.5) => {
    st.poz = 'ayak'; st.kol = 'yuru'; st.walk = 1; st.dans = 0; st.lean = 0;
    if (arguments.length >= 2 || beatOrHiz > 1.5) stepAnim(beatOrHiz, energy);
  };
  const halayCekFn = (beatOrBasi = false, energy = 0.6, phase = 0, opts = null) => {
    const isBasi = opts ? !!opts.mendil : typeof beatOrBasi === 'boolean' ? beatOrBasi : false;
    st.poz = 'ayak'; st.kol = isBasi ? 'mendil' : 'halay'; st.dans = 1; st.walk = 0; st.lean = 0;
    if (typeof beatOrBasi === 'number') stepAnim(beatOrBasi, energy);
  };
  const calgiCalFn = (beatOrCalgi = 'saz', energy = 0.6, calgiRole = null) => {
    const role = typeof beatOrCalgi === 'string' ? beatOrCalgi : (calgiRole || 'saz');
    st.poz = 'otur';
    st.kol = role === 'solist' ? 'kulak' : role;
    st.dans = 0; st.walk = 0; st.lean = 0;
    if (typeof beatOrCalgi === 'number') stepAnim(beatOrCalgi, energy);
  };
  const oturFn = (beatOrYogur = false, energy = 0.3) => {
    const yogur = typeof beatOrYogur === 'boolean' ? beatOrYogur : false;
    st.poz = 'otur'; st.kol = yogur ? 'yogur' : 'dinlen'; st.dans = typeof beatOrYogur === 'number' ? Math.min(0.4, energy * 0.4) : 0; st.walk = 0;
    st.lean = yogur ? 0.38 : 0;
    if (typeof beatOrYogur === 'number') stepAnim(beatOrYogur, energy);
  };
  const kutlaFn = (t = 0, energy = 0.8) => {
    st.poz = 'ayak'; st.kol = 'kutla'; st.dans = 1; st.walk = 0;
    st.jumpT = t; st.kutlaT = t;
    stepAnim(t, energy);
  };
  const hediyeHareketiFn = (eylemOrT = 0, beat = null, energy = 0.7) => {
    if (eylemOrT === 'cigkofte') {
      st.poz = 'otur'; st.kol = 'yogur'; st.dans = 0; st.walk = 0; st.lean = 0.38;
      if (beat != null) stepAnim(beat, energy);
      return;
    }
    const t = typeof eylemOrT === 'number' ? eylemOrT : (beat || 0);
    st.poz = 'ayak'; st.kol = 'hediye'; st.dans = 1; st.walk = 0;
    st.jumpT = t; st.kutlaT = t; st.hediyeT = t;
    if (beat != null) stepAnim(beat, energy);
  };

  ud.yuru = ch.yuru = yuruFn;
  ud.halayCek = ch.halayCek = halayCekFn;
  ud.calgiCal = ch.calgiCal = calgiCalFn;
  ud.otur = ch.otur = oturFn;
  ud.kutla = ch.kutla = kutlaFn;
  ud.hediyeHareketi = ch.hediyeHareketi = hediyeHareketiFn;

  return ch;
}
