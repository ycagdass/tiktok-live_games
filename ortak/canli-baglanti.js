// Ortak Tarayıcı Canlı Bağlantı, Kural, Karakter Ayarı ve Küfür Filtresi Yöneticisi
import { VARSAYILAN_FILTRE, yorumTemizMi } from './filtre.js';

export function canliBaglantiBaslat(G, UI, demo, targetLive) {
  const live = targetLive || { status: { state: 'idle' } };
  live.status = live.status || { state: 'idle' };
  live.filtre = VARSAYILAN_FILTRE;
  const post = (url, body) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    }).catch(() => {});

  live.connect = (u) => post('/api/connect', { username: u });
  live.disconnect = () => post('/api/disconnect');
  live.saveConfig = (cfg) => post('/api/config', cfg);
  live.yorumTemizMi = (txt) => yorumTemizMi(txt, live.filtre);

  if (G) G.yorumTemizMi = live.yorumTemizMi;

  // Hediye kuralları
  fetch('/api/rules')
    .then((r) => r.json())
    .then((j) => {
      if (Array.isArray(j.kurallar) && j.kurallar.length && G) G.rules = j.kurallar;
      if (UI && UI.renderRuleButtons) UI.renderRuleButtons();
    })
    .catch(() => {
      if (UI && UI.renderRuleButtons) UI.renderRuleButtons();
    });

  // Karakter ayarları (ayarlar.json)
  fetch('/api/config')
    .then((r) => r.json())
    .then((j) => {
      if (j && G && G.setKarakterAyar) G.setKarakterAyar(j.karakter, j.izleyiciSecer);
    })
    .catch(() => {});

  // Küfür / nefret filtresi (filtre.json)
  fetch('/api/filter')
    .then((r) => r.json())
    .then((j) => {
      if (j && Array.isArray(j.engelliKelimeler)) live.filtre = j;
    })
    .catch(() => {});

  // SSE gerçek zamanlı olay akışı
  if (typeof location !== 'undefined' && location.protocol !== 'file:' && window.EventSource) {
    if (demo) {
      demo.paused = true;
      setTimeout(() => { demo.paused = false; }, 3000);
    }
    const es = new EventSource('/api/events');
    es.onmessage = (e) => {
      let ev;
      try { ev = JSON.parse(e.data); } catch { return; }
      if (ev.type === 'status') {
        live.status = ev.status;
        if (UI && UI.setLive) UI.setLive(ev.status);
        if (demo) demo.paused = false;
        return;
      }
      if (ev.type === 'config') {
        if (G && G.setKarakterAyar) G.setKarakterAyar(ev.karakter, ev.izleyiciSecer);
        return;
      }
      if (G && G.handle) G.handle(ev);
    };
  }

  return live;
}
