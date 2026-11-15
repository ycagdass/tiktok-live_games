// Ortak karakter türleri, rastgele sayı üreteci, kıyafet seçimi ve yorum ayrıştırıcı.
export const TURLER = ['bocek', 'kedi', 'kopek', 'insan'];

export const TUR_ETIKET = {
  bocek: { ad: 'Hamam Böceği', ikon: '🪳', kisa: 'Böcek' },
  kedi:  { ad: 'Kedi',         ikon: '🐱', kisa: 'Kedi' },
  kopek: { ad: 'Köpek',        ikon: '🐶', kisa: 'Köpek' },
  insan: { ad: 'İnsan',        ikon: '🧑', kisa: 'İnsan' },
  karisik: { ad: 'Karışık',    ikon: '🎲', kisa: 'Karışık' },
};

export function rng(seed) {
  let s = (seed | 0) || 1;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(str) {
  const s = String(str || '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function turNormalize(t) {
  const s = String(t || '').trim().toLocaleLowerCase('tr')
    .replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ç/g, 'c');
  if (s === 'kedi' || s === 'cat') return 'kedi';
  if (s === 'kopek' || s === 'dog' || s === 'kangal') return 'kopek';
  if (s === 'insan' || s === 'human') return 'insan';
  if (s === 'karisik' || s === 'rastgele' || s === 'random' || s === 'mix') return 'karisik';
  if (s === 'bocek' || s === 'hamambocegi' || s === 'hamam bocegi' || s === 'roach') return 'bocek';
  return 'bocek';
}

export function secilenTur(ayarKarakter, seed = 1) {
  const norm = turNormalize(ayarKarakter);
  if (norm === 'karisik') {
    const idx = Math.abs(seed | 0) % TURLER.length;
    return TURLER[idx];
  }
  return TURLER.includes(norm) ? norm : 'bocek';
}

const RENK_SOZLUK = {
  kirmizi: '#d62828', al: '#e63946', pembe: '#ff5c8a', sari: '#f2c531', altin: '#d9a441',
  turuncu: '#f4a261', mavi: '#2e86de', acikmavi: '#7cc3ec', lacivert: '#1d3557',
  yesil: '#2a9d8f', zumrut: '#06d6a0', mor: '#9b5de5', beyaz: '#f4f1ea',
  siyah: '#222228', kahve: '#8a5a36', gri: '#8d99ae',
};

/**
 * İzleyici yorumundan tür (ve isteğe bağlı renk) komutunu yakalar:
 * "!kedi", "!köpek", "!insan", "!böcek" (veya "!kedi turuncu" vb.)
 */
export function yorumdanTur(text) {
  const raw = String(text || '').trim().toLocaleLowerCase('tr');
  const m = /(?:^|\s)!(kedi|k[öo]pek|insan|b[öo]cek|hamamb[öo]ce[ğg]i)(?:\s+([a-zçğıöşü]+))?(?:\s|$|[!.?,])/i.exec(raw);
  if (!m) return null;
  const word = m[1]
    .replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ç/g, 'c');
  let tur = 'bocek';
  if (word === 'kedi') tur = 'kedi';
  else if (word === 'kopek') tur = 'kopek';
  else if (word === 'insan') tur = 'insan';
  const rKey = (m[2] || '').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ç/g, 'c');
  const renk = RENK_SOZLUK[rKey] || null;
  return { tur, renk };
}

const PAL = ['#f2c531', '#e85d75', '#7cc3ec', '#2a9d8f', '#e76f51', '#9b5de5', '#f4a261', '#ef476f', '#118ab2', '#06d6a0'];
const DARKS = ['#1b1b1f', '#2b2d42', '#3d1f14', '#14213d', '#283618'];

/** Seed'den rastgele ama tutarlı kıyafet seçimi (kadın: elbise; erkek: yelek/forma/atlet). */
export function outfitFor(seed = 1, cinsiyet = 'erkek', ozelRenk = null) {
  const r = rng(seed * 7 + 3), p = (a) => a[Math.floor(r() * a.length)];
  if (cinsiyet === 'kadin' || cinsiyet === 'f') {
    const desen = p(['duz', 'cicek', 'cicek', 'leopar']);
    return {
      kiyafet: 'elbise',
      desen,
      renk1: ozelRenk || (desen === 'leopar' ? '#d9a35a' : p(PAL)),
      renk2: p(['#fff3b0', '#ffffff', '#ffd6e0']),
      kafa: p(['cicek', 'cicek', 'bere', 'bant', 'yok']),
      kafaRenk: p(['#d62839', '#c1121f', '#ff8fab', '#ffffff', '#f2c531']),
      kupe: r() < 0.7,
      ayakkabi: p(['topuklu', 'topuklu', 'spor']),
    };
  }
  const k = p(['yelek', 'yelek', 'forma', 'atlet']);
  const fs = p([
    ['#7cc3ec', '#ffffff'],
    ['#d62828', '#ffffff'],
    ['#f2c531', '#1d3557'],
    ['#2a9d8f', '#ffffff'],
    ['#1b1b1f', '#ffffff'],
  ]);
  return {
    kiyafet: k,
    renk1: ozelRenk || (k === 'yelek' ? p(DARKS) : k === 'forma' ? fs[0] : '#efe9dd'),
    renk2: fs[1],
    kafa: p(['sapka', 'kasket', 'bant', 'yok', 'yok', 'bere']),
    kafaRenk: p(['#2b2b30', '#4a3b2a', '#ffffff', '#1d3557', '#c1121f']),
    kupe: false,
    ayakkabi: p(['spor', 'spor', 'yok']),
  };
}
