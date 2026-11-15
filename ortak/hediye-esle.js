// Ortak Hediye Eşleme Modülü (tüm oyunlar ve varyantlar tarafından paylaşılır)
// Eşleşme sırası:
//   1. Hediye ID (kurallar[].id)
//   2. Hediye Adı (kurallar[].ad, Türkçe küçük harf duyarsız)
//   3. Jeton değeri (kurallar[].jeton === dia)
//   4. Minimum jeton (kurallar[].minJeton, dia >= minJeton)

export function hediyeEsle(kurallar, gf, unitOverride, totalOverride) {
  if (!Array.isArray(kurallar) || !gf) return null;
  const name = String(gf.name || '').toLocaleLowerCase('tr').trim();
  const id = String(gf.id || '').trim();
  const dia = (unitOverride != null ? Number(unitOverride) : Number(gf.diamonds)) | 0;
  const total = (totalOverride != null ? Number(totalOverride) : dia) | 0;

  for (const r of kurallar) {
    if (id && Array.isArray(r.id) && r.id.map(String).includes(id)) return { r, by: 'id' };
    if (name && Array.isArray(r.ad) && r.ad.some((a) => String(a).toLocaleLowerCase('tr').trim() === name)) return { r, by: 'ad' };
  }
  for (const r of kurallar) {
    if (!(r.ad || []).length && !(r.id || []).length && r.jeton != null && Number(r.jeton) === dia) {
      return { r, by: 'jeton' };
    }
  }
  for (const r of kurallar) {
    if (r.jeton != null && Number(r.jeton) === dia) {
      return { r, by: 'jeton' };
    }
  }
  for (const r of kurallar) {
    if (r.minJeton != null && (dia >= Number(r.minJeton) || total >= Number(r.minJeton))) {
      return { r, by: 'jeton' };
    }
  }
  return null;
}

if (typeof window !== 'undefined') {
  window.CD = window.CD || {};
  window.CD.hediyeEsle = hediyeEsle;
}
