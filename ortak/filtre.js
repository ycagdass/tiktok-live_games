// Ortak Küfür ve Nefret Söylemi Filtresi
// filtre.json dosyasındaki engelliKelimeler ve engelliKaliplar listesini kullanarak
// uygunsuz yorumların sahneye ve canlı akışa yansımasını engeller.

export const VARSAYILAN_FILTRE = {
  engelliKelimeler: [
    'amk', 'aq', 'mk', 'oç', 'oc', 'piç', 'pic', 'sik', 'siktir', 'sikik', 'sikeyim',
    'yarrak', 'yarak', 'göt', 'gotveren', 'orospu', 'kahpe', 'pezevenk', 'ibne', 'puşt',
    'pust', 'gavat', 'yavşak', 'yavsak', 'gerizekalı', 'gerizekali', 'aptal', 'salak',
    'embesil', 'haysiyetsiz', 'şerefsiz', 'serefsiz', 'namussuz', 'köpek oğlu', 'it oğlu',
    'geber', 'gebersin', 'nefret ediyorum', 'ırkçı', 'faşist', 'terörist'
  ],
  engelliKaliplar: [
    's[i1!]+k[t]+[i1!]+r',
    'o+r+o+s+p+u+',
    'a+m+k+',
    'ş+e+r+e+f+s+i+z+'
  ]
};

function normalizeMetin(s) {
  return String(s || '')
    .toLocaleLowerCase('tr')
    .replace(/[0]/g, 'o')
    .replace(/[1!]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/(.)\1{2,}/g, '$1') // 3+ tekrar eden harfleri tek harfe indir
    .trim();
}

/**
 * Yorumun temiz olup olmadığını döndürür (true = temiz, false = küfür/nefret içeriyor).
 */
export function yorumTemizMi(text, filtre = VARSAYILAN_FILTRE) {
  if (!text) return true;
  const cfg = filtre && Array.isArray(filtre.engelliKelimeler) ? filtre : VARSAYILAN_FILTRE;
  const rawLow = String(text).toLocaleLowerCase('tr');
  const norm = normalizeMetin(text);
  // Kelime bazlı kontrol (noktalama işaretlerinden arındırılmış kelimeler)
  const words = norm.split(/[^a-zçğıöşü0-9]+/).filter(Boolean);
  const rawWords = rawLow.split(/[^a-zçğıöşü0-9]+/).filter(Boolean);

  for (const bad of cfg.engelliKelimeler || []) {
    const b = String(bad).toLocaleLowerCase('tr').trim();
    if (!b) continue;
    if (b.includes(' ')) {
      if (rawLow.includes(b) || norm.includes(normalizeMetin(b))) return false;
    } else {
      if (rawWords.includes(b) || words.includes(b) || words.includes(normalizeMetin(b))) return false;
      // Ek almış küfür kökleri (4+ harfli kökler için başlangıç eşleşmesi)
      if (b.length >= 4 && (rawWords.some((w) => w.startsWith(b)) || words.some((w) => w.startsWith(normalizeMetin(b))))) {
        return false;
      }
    }
  }

  for (const pat of cfg.engelliKaliplar || []) {
    try {
      const re = new RegExp(pat, 'i');
      if (re.test(rawLow) || re.test(norm)) return false;
    } catch {}
  }

  return true;
}

if (typeof window !== 'undefined') {
  window.CD = window.CD || {};
  window.CD.yorumTemizMi = yorumTemizMi;
}
