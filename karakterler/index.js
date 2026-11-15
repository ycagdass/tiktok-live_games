// Ortak 3B Karakter Seçimi ve Üretim Modülü
// Türler: 'bocek' (varsayılan), 'kedi', 'kopek', 'insan'
// karakterYap(tur, renk, ad, opsiyonlar) -> her tür için birebir aynı animasyon arayüzünü döndürür:
//   ch.userData = {
//     state: { poz:'otur'|'ayak', pozT, kol:'dinlen'|'halay'|'yogur'|'saz'|'kulak'|'darbuka'|'yuru'|'mendil'|'kutla'|'hediye', hands:[w0,w1], walk, dans, lean, talkT, jumpT, kutlaT, hediyeT },
//     update(t, beat, level),
//     head, up, arms, shoulder(side),
//     tur, renk, ad,
//     yuru(), halayCek(basi), calgiCal(calgi), otur(yogur), kutla(t), hediyeHareketi(t)
//   }
import { makeRoach } from './bocek3d.js';
import { makeCat } from './kedi3d.js';
import { makeDog } from './kopek3d.js';
import { makeHuman } from './insan3d.js';
import {
  TURLER, TUR_ETIKET, rng, hashStr, turNormalize, secilenTur, yorumdanTur, outfitFor,
} from './ortak.js';

export {
  TURLER, TUR_ETIKET, rng, hashStr, turNormalize, secilenTur, yorumdanTur, outfitFor,
  makeRoach, makeCat, makeDog, makeHuman,
};

/**
 * Verilen tür, renk ve ad ile 3B karakter nesnesi (THREE.Group) üretir.
 * Oyun kodu karakterin böcek, kedi, köpek veya insan olduğundan habersiz çalışır.
 *
 * @param {string} tur - 'bocek' | 'kedi' | 'kopek' | 'insan' | 'karisik'
 * @param {string|null} renk - Kıyafet ana rengi (örn. '#e85d75') veya null (varsayılan palet)
 * @param {string} ad - Karakterin / izleyicinin adı
 * @param {object} ops - Ek seçenekler (seed, cinsiyet, kiyafet, desen, kafa, kafaRenk, kupe, ayakkabi, body, skin)
 */
export function karakterYap(tur = 'bocek', renk = null, ad = 'Misafir', ops = {}) {
  const seed = ops.seed != null ? ops.seed : hashStr(String(ad || 'misafir'));
  const resolvedTur = secilenTur(tur || 'bocek', seed);
  const cinsiyet = ops.cinsiyet || (seed % 2 === 0 ? 'erkek' : 'kadin');
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

  // Animasyon arayüzü yardımcı metotları (hem doğrudan state üzerinden hem metotlarla kontrol edilebilir)
  ud.yuru = (hiz = 1) => {
    st.poz = 'ayak'; st.kol = 'yuru'; st.walk = hiz; st.dans = 0; st.lean = 0;
  };
  ud.halayCek = (halayBasi = false) => {
    st.poz = 'ayak'; st.kol = halayBasi ? 'mendil' : 'halay'; st.dans = 1; st.walk = 0; st.lean = 0;
  };
  ud.calgiCal = (calgi = 'saz') => {
    st.poz = 'otur';
    st.kol = calgi === 'solist' ? 'kulak' : calgi;
    st.dans = 0; st.walk = 0; st.lean = 0;
  };
  ud.otur = (yogur = false) => {
    st.poz = 'otur'; st.kol = yogur ? 'yogur' : 'dinlen'; st.dans = 0; st.walk = 0;
    st.lean = yogur ? 0.38 : 0;
  };
  ud.kutla = (t = 0) => {
    st.poz = 'ayak'; st.kol = 'kutla'; st.dans = 1; st.walk = 0;
    st.jumpT = t; st.kutlaT = t;
  };
  ud.hediyeHareketi = (t = 0) => {
    st.poz = 'ayak'; st.kol = 'hediye'; st.dans = 1; st.walk = 0;
    st.jumpT = t; st.kutlaT = t; st.hediyeT = t;
  };

  return ch;
}
