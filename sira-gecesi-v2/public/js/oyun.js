// Sıra Gecesi v2 oyun mantığı
// Özellikler:
//   • Yorum yazan izleyici adıyla karakter olarak doğar; adı karakterin üstünde görünür
//   • Beğeni halay hızını ve coşkusunu artırır (likeBoost + enerji)
//   • Hediye özel olay tetikler: havai fişek (havaifisek), çay ikramı (cay), solist değişimi (solist), saz, darbuka, çiğ köfte, isot, coşku
//   • Küfür ve nefret içeren yorumlar filtre.json ile ekrana basılmadan filtrelenir
//   • Ekranda yarışma yerine "Bu Gece En Çok Hediye Atanlar" teşekkür listesi yer alır
import * as THREE from 'three';
import { karakterYap, TUR_ETIKET, secilenTur, yorumdanTur } from '/karakterler/index.js';
import { hediyeEsle } from '/ortak/hediye-esle.js';
import { yorumTemizMi } from '/ortak/filtre.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const fmt = (n) => Math.round(n).toLocaleString('tr-TR');

export const LEVELS = [
  { n: 'Ağır', bpm: 92, c: '#7ad1ff' }, { n: 'Orta', bpm: 108, c: '#9ee37d' },
  { n: 'Hızlı', bpm: 124, c: '#ffc145' }, { n: 'Coşku', bpm: 142, c: '#ff4f7b' },
];
const SPACING = 0.88, ROLE_NAMES = { saz: '🪕 Sazcı', solist: '🎤 Solist', darbuka: '🥁 Darbukacı' };
const IDLE_MASA = 480, IDLE_HALAY = 300;

export const DEFAULT_RULES = [
  { eylem: 'cigkofte',   etiket: 'Çiğ Köfteci Ol',      jeton: 1,   ikon: '🌹', ad: ['Rose', 'Gül'], id: ['5655'] },
  { eylem: 'halaybasi',  etiket: 'Halay Başı Ol',       jeton: 10,  ikon: '🧣', ad: [], id: [] },
  { eylem: 'cay',        etiket: 'Herkese Çay İkramı',  jeton: 50,  ikon: '🍵', ad: [], id: [] },
  { eylem: 'saz',        etiket: 'Sazcı Ol',            jeton: 99,  ikon: '🪕', ad: [], id: [] },
  { eylem: 'solist',     etiket: 'Solist Değişimi',     jeton: 30,  ikon: '🎤', ad: [], id: [] },
  { eylem: 'darbuka',    etiket: 'Darbukacı Ol',        jeton: 5,   ikon: '🥁', ad: [], id: [] },
  { eylem: 'isot',       etiket: 'Köfteye İsot At',     jeton: 20,  ikon: '🌶️', ad: [], id: [] },
  { eylem: 'havaifisek', etiket: 'Havai Fişek Patlat',  jeton: 199, ikon: '🎆', ad: ['Confetti', 'Konfeti'], id: [] },
  { eylem: 'cosku',      etiket: 'Salonu Ayağa Kaldır', minJeton: 1000, ikon: '🔥', ad: [], id: [] },
];

export function createGame(scene, salon) {
  const RING = salon.rings.map((r) => { const P = 2 * Math.PI * Math.sqrt((r.rx * r.rx + r.rz * r.rz) / 2); return { ...r, cap: Math.floor((P * 0.94) / SPACING), head: Math.random() * 6 }; });
  const HALAY_MAX = RING.reduce((a, r) => a + r.cap, 0);
  const G = {
    time: 0, beat: 0, bpm: 92, energy: 15, level: 0, likeBoost: 0,
    users: new Map(), halay: [], knead: Array(6).fill(null), orch: { saz: null, solist: null, darbuka: null },
    seatOwner: new Array(salon.seats.length).fill(null), baskose: null,
    scores: new Map(), top: [], rules: DEFAULT_RULES,
    likes: 0, diamonds: 0, viewers: 0, filteredCount: 0, headA: 0,
    karakterModu: 'bocek', izleyiciSecer: true,
    yorumTemizMi: (txt) => yorumTemizMi(txt),
    standUntil: -1, isotUntil: -1, fx: [], _ls: {},
  };
  G.on = (e, f) => (G._ls[e] = G._ls[e] || []).push(f);
  G.emit = (e, d) => (G._ls[e] || []).forEach((f) => f(d));
  G.addEnergy = (v) => { G.energy = Math.min(100, G.energy + v); };

  function build(u) {
    const old = u.ch;
    const tur = (u.ozelTur && u.tur) ? u.tur : (u.tur = secilenTur(G.karakterModu, u.seed));
    u.ch = karakterYap(tur, u.renk || null, u.nick, { seed: u.seed, cinsiyet: u.cinsiyet });
    if (old) { u.ch.position.copy(old.position); u.ch.rotation.y = old.rotation.y; scene.remove(old); u.ch.userData.state.poz = old.userData.state.poz; u.ch.userData.state.pozT = old.userData.state.pozT; }
    else { u.ch.position.copy(salon.door).add(V((Math.random() - 0.5) * 2, 0, 0)); u.ch.rotation.y = Math.PI; u.ch.userData.state.poz = 'ayak'; u.ch.userData.state.pozT = 1; }
    scene.add(u.ch);
  }
  G.setKarakterAyar = (mod, izleyiciSecer) => {
    const prevMod = G.karakterModu;
    if (mod) G.karakterModu = mod;
    if (typeof izleyiciSecer === 'boolean') G.izleyiciSecer = izleyiciSecer;
    if (mod && mod !== prevMod) {
      for (const u of G.users.values()) {
        if (!u.ozelTur) build(u);
      }
    }
    G.emit('karakterAyar', { karakter: G.karakterModu, izleyiciSecer: G.izleyiciSecer });
  };

  function ensure(user, fromChat = false) {
    let u = G.users.get(user.id);
    if (u) { u.lastActive = G.time; if (user.nick) { u.nick = user.nick; if (u.ch && u.ch.userData) u.ch.userData.ad = u.nick; } return u; }
    const seed = hash(String(user.id));
    u = { id: user.id, nick: user.nick || 'misafir', seed, cinsiyet: seed % 2 ? 'kadin' : 'erkek', role: null, seat: -1, lastActive: G.time, bubble: null, welcomeT: G.time, spot: null };
    build(u);
    G.users.set(u.id, u);
    // Yorum yazarak ilk kez doğan izleyici doğrudan sahnede (veya halayda) adıyla belirir
    if (!autoFill(u)) {
      if (fromChat && G.halay.length < 24) toHalay(u);
      else toTable(u);
    }
    if (u.spot) {
      const p = u.spot.pos, onStage = p.y > 0.1;
      const off = onStage ? V((p.x >= 0 ? 1 : -1) * 1.6, 0, 0.5) : V((Math.random() - 0.5) * 1.2, 0, 1.6);
      u.ch.position.set(p.x + off.x, p.y, p.z + off.z);
      u.ch.rotation.y = Math.atan2(-off.x, -off.z);
      G.fx.push({ type: 'puf', at: u, t: G.time });
    } else if (u.role === 'halay') {
      u.ch.position.set((Math.random() - 0.5) * 4, 0, 6.2);
      u.ch.rotation.y = Math.PI;
      G.fx.push({ type: 'puf', at: u, t: G.time });
    }
    G.emit('feed', { kind: 'join', user: u, text: 'adıyla sahnede doğdu 🎉' });
    return u;
  }

  function autoFill(u) {
    for (const k of ['saz', 'solist', 'darbuka']) if (!G.orch[k]) { toOrch(u, k); u.autoRole = true; tellAuto(u, k); return true; }
    if (G.knead.some((x) => !x)) { toKnead(u); u.autoRole = true; tellAuto(u, 'yogur'); return true; }
    return false;
  }
  function refillRoles() {
    const pickActive = () => [...G.users.values()].filter((x) => x.role === 'masa').sort((a, b) => b.lastActive - a.lastActive)[0];
    for (const k of ['saz', 'solist', 'darbuka']) if (!G.orch[k]) { const c = pickActive(); if (!c) return; toOrch(c, k); c.autoRole = true; tellAuto(c, k); }
    while (G.knead.some((x) => !x)) { const c = pickActive(); if (!c) return; toKnead(c); c.autoRole = true; tellAuto(c, 'yogur'); }
  }
  const AUTO_TEXT = {
    saz: { icon: '🪕', baslik: 'Sazcı sensin!' }, solist: { icon: '🎤', baslik: 'Solist sensin!' },
    darbuka: { icon: '🥁', baslik: 'Darbukacı sensin!' }, yogur: { icon: '🌶️', baslik: 'Çiğ köfteyi sen yoğuruyorsun!' },
  };
  function tellAuto(u, key) {
    const a = AUTO_TEXT[key];
    G.emit('banner', { user: u, gift: { icon: a.icon }, auto: true, sub: `${a.icon} ${a.baslik}`, text: '💬 Yorum yaz, yerin sende kalsın!' });
    G.emit('announce', `${a.icon} ${u.nick} sahneye çağrıldı!`);
    G.emit('focus', key === 'yogur' ? 'cigkofte' : 'orkestra');
  }
  function leave(u) {
    clearRole(u);
    u.role = 'cikis';
    u.spot = { pos: salon.door.clone(), yaw: Math.PI, poz: 'ayak', kol: 'dinlen' };
    u.leaving = true;
    G.users.delete(u.id);
    G.leaving = G.leaving || []; G.leaving.push(u);
  }
  function clearRole(u) {
    if (u.seat >= 0) { G.seatOwner[u.seat] = null; u.seat = -1; }
    if (G.baskose === u.id) G.baskose = null;
    const hi = G.halay.indexOf(u); if (hi >= 0) G.halay.splice(hi, 1);
    const ki = G.knead.indexOf(u); if (ki >= 0) G.knead[ki] = null;
    for (const k in G.orch) if (G.orch[k] === u) G.orch[k] = null;
    u.leader = false;
  }
  const keepScore = (u) => (u.npc ? -1e9 : 0) + u.lastActive + Math.min(u.acts || 0, 15) * 20 + (u.gifted ? 1e6 : 0);
  G.crowded = () => G.seatOwner.every(Boolean) && G.halay.length >= HALAY_MAX * 0.9;
  function freeSeat(evict = true) {
    let i = G.seatOwner.findIndex((x) => !x);
    if (i >= 0 || !evict) return i;
    let best = -1, bs = Infinity;
    G.seatOwner.forEach((u, k) => { if (u && keepScore(u) < bs) { bs = keepScore(u); best = k; } });
    if (best < 0) G.seatOwner.forEach((u, k) => { if (u && u.lastActive < bs) { bs = u.lastActive; best = k; } });
    if (best >= 0) leave(G.seatOwner[best]);
    return G.seatOwner.findIndex((x) => !x);
  }
  function toTable(u) {
    clearRole(u);
    let i = freeSeat(false);
    if (i < 0 && G.halay.length < HALAY_MAX) { toHalay(u); return; }
    if (i < 0) i = freeSeat(true);
    if (i < 0) return;
    G.seatOwner[i] = u; u.seat = i; u.role = 'masa';
    const s = salon.seats[i];
    u.spot = { pos: s.pos.clone(), yaw: s.yaw, poz: 'otur', kol: 'dinlen' };
  }
  function toHalay(u, leader = false) {
    if (G.halay.includes(u)) { if (leader) setLeader(u); return; }
    clearRole(u);
    if (G.halay.length >= HALAY_MAX) {
      const cand = G.halay.filter((x) => !x.leader).sort((a, b) => keepScore(a) - keepScore(b))[0];
      if (cand && cand.npc) { G.halay.splice(G.halay.indexOf(cand), 1); G.users.delete(cand.id); scene.remove(cand.ch); }
      else if (cand) { if (G.seatOwner.some((x) => !x)) toTable(cand); else leave(cand); }
    }
    u.role = 'halay';
    if (leader) { G.halay.unshift(u); setLeader(u); } else G.halay.push(u);
  }
  function setLeader(u) {
    G.halay.forEach((x) => { x.leader = false; });
    const i = G.halay.indexOf(u); if (i > 0) { G.halay.splice(i, 1); G.halay.unshift(u); }
    u.leader = true;
  }
  function toKnead(u) {
    if (G.knead.includes(u)) return;
    clearRole(u);
    let i = G.knead.findIndex((x) => !x);
    if (i < 0) {
      let best = 0; const sc = (x) => (x.autoRole ? 0 : 1e9) + x.roleT;
      G.knead.forEach((x, k) => { if (sc(x) < sc(G.knead[best])) best = k; });
      const old = G.knead[best]; toTable(old); i = best;
    }
    G.knead[i] = u; u.role = 'yogur'; u.roleT = G.time;
    const k = salon.knead[i];
    u.spot = { pos: k.pos.clone(), yaw: k.yaw, poz: 'otur', kol: 'yogur' };
  }
  function toOrch(u, key) {
    const prev = G.orch[key];
    if (prev === u) return;
    clearRole(u);
    if (prev) toTable(prev);
    G.orch[key] = u; u.role = key;
    const o = salon.orch[key];
    u.spot = { pos: o.pos.clone(), yaw: o.yaw, poz: 'otur', kol: key === 'saz' ? 'saz' : key === 'solist' ? 'kulak' : 'darbuka' };
  }

  G.handle = (ev) => {
    if (!ev || !ev.type) return;
    if (ev.type === 'viewers') { G.viewers = ev.count | 0; return; }
    if (!ev.user || !ev.user.id) return;
    const u = ensure(ev.user, ev.type === 'chat');
    if (ev.type !== 'member') u.acts = (u.acts || 0) + 1;
    switch (ev.type) {
      case 'member': G.addEnergy(0.4); break;
      case 'chat': {
        const rawText = String(ev.text || '').slice(0, 120);
        // Küfür ve nefret söylemi filtresi: uygunsuzsa ekrana hiç basılmaz
        if (G.yorumTemizMi && !G.yorumTemizMi(rawText)) {
          G.filteredCount++;
          G.emit('filtered', G.filteredCount);
          return;
        }
        G.emit('chipHit', 'yorum');
        u.bubble = { text: rawText, t: G.time };
        u.ch.userData.state.talkT = G.time;
        G.addEnergy(1.5);
        G.emit('feed', { kind: 'chat', user: u, text: rawText });
        command(u, rawText);
        break;
      }
      case 'like': {
        const n = Math.max(1, ev.count | 0);
        G.emit('chipHit', 'begen');
        G.likes += n;
        G.addEnergy(Math.min(12, 0.55 * n));
        G.likeBoost = Math.min(1.5, (G.likeBoost || 0) + 0.04 * n);
        G.fx.push({ type: 'kalp', at: u, t: G.time, n: Math.min(n, 5) });
        if (G.time - (u.likeFeedT || -99) > 6) { u.likeFeedT = G.time; G.emit('feed', { kind: 'like', user: u, text: `${n} beğeni ile halayı hızlandırdı ❤️` }); }
        break;
      }
      case 'gift': gift(u, ev.gift || {}); break;
      case 'follow': G.addEnergy(3); G.emit('feed', { kind: 'follow', user: u, text: 'takip etti ➕' }); break;
      case 'share': G.addEnergy(3); G.emit('feed', { kind: 'share', user: u, text: 'yayını paylaştı 🔗' }); break;
    }
  };

  function command(u, text) {
    const kt = yorumdanTur(text);
    if (kt && G.izleyiciSecer !== false) {
      G.emit('chipHit', 'tur');
      u.tur = kt.tur;
      u.ozelTur = true;
      if (kt.renk) u.renk = kt.renk;
      build(u);
      u.ch.userData.state.jumpT = G.time;
      G.fx.push({ type: 'puf', at: u, t: G.time });
      const et = TUR_ETIKET[kt.tur] || TUR_ETIKET.bocek;
      G.emit('announce', `${et.ikon} ${u.nick} ${et.ad.toLocaleLowerCase('tr')} oldu!`);
      return;
    }
    const t = text.trim().toLocaleLowerCase('tr').replace(/[!.?\s]+$/, '');
    if (/^(halaya kat[ıi]l(ı|i)?yorum|halaya kat[ıi]l|halay|halaya)$/.test(t)) {
      G.emit('chipHit', 'halay');
      if (u.role === 'halay') return;
      if (u.role === 'yogur' || ROLE_NAMES[u.role]) return;
      toHalay(u);
      G.emit('announce', `💃 ${u.nick} halaya katıldı!`);
    } else if (/^(otur|masaya d[öo]n|masaya)$/.test(t)) {
      if (u.role === 'halay' && !u.leader) { toTable(u); }
    } else if (/^(kad[ıi]n|k[ıi]z|erkek)$/.test(t)) {
      G.emit('chipHit', 'kadin');
      const c = t === 'erkek' ? 'erkek' : 'kadin';
      if (u.cinsiyet === c || u.swap) return;
      if (u.role === 'halay' && !u.leader) {
        const out = u.ch.position.clone(); out.y = 0;
        const dir = out.clone().sub(salon.tray.pos).setY(0).normalize();
        clearRole(u); u.role = 'degisim';
        u.swap = { cins: c, t0: G.time };
        u.spot = { pos: out.addScaledVector(dir, 1.3), yaw: Math.atan2(dir.x, dir.z), poz: 'ayak', kol: 'dinlen' };
      } else { u.cinsiyet = c; build(u); G.fx.push({ type: 'puf', at: u, t: G.time }); }
    } else if (/^(oyna|hop|zıpla|zipla)$/.test(t)) {
      G.emit('chipHit', 'oyna');
      u.ch.userData.state.jumpT = G.time;
    }
  }

  G.matchRule = (gf) => hediyeEsle(G.rules, gf);

  function gift(u, gf) {
    const dia = Math.max(1, gf.diamonds | 0), cnt = Math.max(1, gf.count | 0), total = dia * cnt;
    u.gifted = true; G.diamonds += total;
    const sc = G.scores.get(u.id) || { id: u.id, nick: u.nick, d: 0 }; sc.d += total; sc.nick = u.nick; G.scores.set(u.id, sc);
    G.addEnergy(Math.min(35, 5 + total * 0.07));
    const m = G.matchRule({ ...gf, diamonds: dia });
    G.emit('giftlog', { user: u, gift: gf, dia, cnt, match: m });
    G.emit('feed', { kind: 'gift', user: u, text: `${gf.icon || '🎁'} ${gf.name || 'Hediye'} ×${cnt}${m ? ' → ' + m.r.etiket : ''} · Teşekkürler! 🙏` });
    if (m) {
      action(m.r, u, gf, cnt, total);
      const BANNER = {
        cigkofte: '🌶️ Çiğ köfte yoğurmaya oturdu!',
        halaybasi: '🧣 Halay başına geçti!',
        cay: '☕ Herkese sıcak çay ikram etti!',
        saz: '🪕 Sazcı oldu!',
        solist: '🎤 Yeni solistimiz sahnede!',
        darbuka: '🥁 Darbukacı oldu!',
        isot: '🌶️ Köfteye isot attı!',
        havaifisek: '🎆 Havai fişek gösterisi başlattı!',
      };
      if (BANNER[m.r.eylem]) G.emit('banner', { user: u, gift: gf, count: cnt, total, text: BANNER[m.r.eylem] });
    } else {
      G.fx.push({ type: 'havaifisek', t: G.time, n: 3 });
      G.emit('announce', `🎁 ${u.nick} sıra gecesine ikramda bulundu, teşekkürler!`);
      if (total >= 100) G.emit('banner', { user: u, gift: gf, count: cnt, total, text: '🎆 Havai fişeklerle kutlanıyor!' });
    }
    G.fx.push({ type: 'konfeti', t: G.time, n: total >= 1000 ? 280 : m ? 150 : total >= 100 ? 120 : 40 });
    ranks();
  }

  function action(r, u, gf, cnt, total) {
    G.emit('ruleHit', r.eylem);
    if (u.ch && u.ch.userData && u.ch.userData.state) {
      u.ch.userData.state.kutlaT = G.time;
      u.ch.userData.state.hediyeT = G.time;
    }
    switch (r.eylem) {
      case 'cigkofte': toKnead(u); u.autoRole = false; G.emit('announce', `🌶️ ${u.nick} çiğ köfte yoğurmaya oturdu!`); G.emit('focus', 'cigkofte'); break;
      case 'halaybasi': toHalay(u, true); G.emit('announce', `🧣 ${u.nick} halaybaşı oldu, mendili kaptı!`); G.emit('focus', 'halay'); break;
      case 'saz': case 'solist': case 'darbuka':
        toOrch(u, r.eylem); u.autoRole = false;
        G.emit('announce', r.eylem === 'solist' ? `🎤 Solist değişti: ${u.nick} mikrofon başında!` : `${ROLE_NAMES[r.eylem]} artık ${u.nick}!`);
        G.emit('focus', 'orkestra'); break;
      case 'cay':
        G.fx.push({ type: 'cay', t: G.time }); G.addEnergy(8);
        G.emit('announce', `☕ ${u.nick} bütün salona çay ikram etti!`); break;
      case 'isot':
        G.isotUntil = G.time + 15; G.fx.push({ type: 'isot', t: G.time });
        G.emit('announce', `🌶️ ${u.nick} köfteye isot attı, yoğuranlar coştu!`); G.emit('focus', 'cigkofte'); break;
      case 'havaifisek':
        G.fx.push({ type: 'havaifisek', t: G.time, n: 6 }); G.addEnergy(18);
        G.emit('announce', `🎆 ${u.nick} havai fişek patlattı!`); G.emit('focus', 'genel'); break;
      case 'cosku':
        G.standUntil = G.time + 20; G.energy = Math.max(G.energy, 94);
        G.fx.push({ type: 'havaifisek', t: G.time, n: 8 });
        G.emit('announce', `🔥 ${u.nick} salonu ayağa kaldırdı!`);
        G.emit('banner', { user: u, gift: gf, count: cnt, total, text: '🔥 Bütün salon ayakta, havai fişekler patlıyor!' });
        G.emit('focus', 'genel'); break;
    }
  }

  function ranks() {
    const top = [...G.scores.values()].sort((a, b) => b.d - a.d);
    G.top = top.slice(0, 5);
    const first = top.length ? G.users.get(top[0].id) : null;
    if (first && G.baskose !== first.id && first.role === 'masa') {
      const prev = G.baskose && G.users.get(G.baskose);
      clearRole(first);
      G.baskose = first.id; first.role = 'baskose';
      first.spot = { pos: salon.baskose.pos.clone(), yaw: salon.baskose.yaw, poz: 'otur', kol: 'dinlen' };
      if (prev && prev.role === 'baskose') toTable(prev);
      G.emit('announce', `🙏 ${first.nick} başköşede ağırlanıyor!`);
    }
    G.emit('board');
  }

  const tmp = V(0, 0, 0);
  G.update = (dt, audioBeat) => {
    G.time += dt;
    const t = G.time;
    G.energy = Math.max(0, G.energy - dt * (0.6 + G.energy * 0.02));
    G.likeBoost = Math.max(0, (G.likeBoost || 0) - dt * 0.25);
    const up = [25, 50, 75], dn = [20, 45, 70];
    if (G.level < 3 && G.energy >= up[G.level]) G.level++;
    else if (G.level > 0 && G.energy < dn[G.level - 1]) G.level--;
    G.beat = audioBeat != null ? audioBeat : G.beat + (dt * (G.bpm + G.likeBoost * 14)) / 60;

    // Beğeni arttıkça halay dönüş hızı da belirgin şekilde hızlanır
    let gi = 0;
    const speedMul = 1 + (G.likeBoost || 0) * 0.7;
    G.lines = RING.map((R) => {
      R.head -= dt * (0.075 + G.level * 0.045) * speedMul * (3.2 / ((R.rx + R.rz) / 2));
      const mem = G.halay.slice(gi, gi + R.cap); gi += R.cap;
      const step = Math.min(SPACING / ((R.rx + R.rz) / 2), (Math.PI * 2 * 0.94) / Math.max(1, mem.length));
      mem.forEach((u, i) => {
        const a = R.head + i * step;
        const pos = V(R.c.x + Math.cos(a) * R.rx, 0, R.c.z + Math.sin(a) * R.rz);
        u.spot = { pos, yaw: Math.atan2(R.c.x - pos.x, R.c.z - pos.z), poz: 'ayak', kol: i === 0 ? 'mendil' : 'halay', follow: true };
      });
      return mem;
    });

    const all = [...G.users.values(), ...(G.leaving || [])];
    const standing = t < G.standUntil;
    for (const u of all) {
      const ch = u.ch, st = ch.userData.state, sp = u.spot;
      if (!sp) continue;
      const d = tmp.copy(sp.pos).sub(ch.position); d.y = 0;
      const dist = d.length();
      if (dist > (sp.follow ? 0.6 : 0.08)) {
        const speed = Math.min(dist, dt * (dist > 3 ? 3.6 : 1.9));
        ch.position.addScaledVector(d.normalize(), speed);
        const yaw = Math.atan2(d.x, d.z);
        ch.rotation.y += angDiff(yaw, ch.rotation.y) * Math.min(1, dt * 8);
        st.poz = 'ayak'; st.kol = 'yuru'; st.walk = Math.min(1, st.walk + dt * 4); st.dans = 0; st.lean = 0;
        u.arrived = false;
      } else {
        if (sp.follow) ch.position.lerp(sp.pos, Math.min(1, dt * 4)); else ch.position.copy(sp.pos);
        ch.rotation.y += angDiff(sp.yaw, ch.rotation.y) * Math.min(1, dt * 5);
        st.walk = Math.max(0, st.walk - dt * 4);
        st.poz = standing && (u.role === 'masa' || u.role === 'baskose') ? 'ayak' : sp.poz;
        st.kol = sp.kol;
        st.dans = u.role === 'halay' || (standing && (u.role === 'masa' || u.role === 'baskose')) ? 1 : 0;
        st.lean = u.role === 'yogur' ? 0.38 + 0.06 * Math.sin(G.beat * Math.PI * (t < G.isotUntil ? 2 : 1)) : 0;
        if (standing && st.dans && !sp.follow) st.kol = 'halay';
        u.arrived = true;
      }
      if (u.leaving && dist < 0.3) { scene.remove(ch); G.leaving.splice(G.leaving.indexOf(u), 1); }
    }

    const b = G.beat, per = G.level >= 3 ? 4 : G.level === 2 ? 6 : 8;
    const raiseNorm = (b % per) >= per - 2;
    G.raise = (G.raise || 0) + ((raiseNorm ? 1 : 0) - (G.raise || 0)) * Math.min(1, dt * 9);
    const rz = G.raise || 0;
    const swing = Math.sin(b * Math.PI);
    const ry = -0.22 + rz * 0.75 + (1 - rz) * 0.07 * Math.abs(swing) + rz * 0.08 * Math.sin(b * Math.PI * 2);
    const tc = salon.tray.pos;
    for (const line of G.lines) line.forEach((u, i) => {
      const st = u.ch.userData.state;
      const ahead = line[i - 1], behind = line[i + 1];
      const hold = (o, side) => {
        if (!o || !o.arrived || !u.arrived) return null;
        const a = u.ch.userData.shoulder(side), c = o.ch.userData.shoulder(-side);
        if (a.distanceTo(c) > 1.25) return null;
        const m = a.add(c).multiplyScalar(0.5);
        const inw = V(tc.x - m.x, 0, tc.z - m.z).normalize().multiplyScalar(0.13 * swing * (1 - rz * 0.6));
        return m.add(inw).add(V(0, ry, 0));
      };
      st.hands[0] = i === 0 ? null : hold(ahead, -1);
      st.hands[1] = hold(behind, 1);
    });

    for (const u of G.users.values()) if (u.swap && ((u.arrived && G.time - u.swap.t0 > 0.6) || G.time - u.swap.t0 > 5)) {
      u.cinsiyet = u.swap.cins; u.swap = null; build(u);
      G.fx.push({ type: 'puf', at: u, t: G.time });
      toHalay(u);
      G.emit('announce', `💃 ${u.nick} kıyafet değiştirip halaya döndü!`);
    }
    if (standing) for (const u of G.users.values()) if ((u.role === 'masa' || u.role === 'baskose') && u.arrived) {
      const st = u.ch.userData.state, h = (G.raise || 0) > 0.5 ? 0.9 : 0.4;
      st.hands[0] = u.ch.localToWorld(V(-0.38, 0.78 + h, 0.15)); st.hands[1] = u.ch.localToWorld(V(0.38, 0.78 + h, 0.15));
    }

    const tp = salon.tray.pos, hr = salon.tray.hamurR;
    const kSpeed = t < G.isotUntil ? 2 : 1;
    G.knead.forEach((u) => {
      if (!u) return;
      const st = u.ch.userData.state;
      const dir = V(u.ch.position.x - tp.x, 0, u.ch.position.z - tp.z).normalize();
      const side = V(dir.z, 0, -dir.x);
      for (let k = 0; k < 2; k++) {
        const s = k ? 1 : -1, push = Math.max(0, Math.sin((G.beat * kSpeed + (k ? 0.5 : 0)) * Math.PI));
        st.hands[k] = V(tp.x, 0.2 - push * 0.07, tp.z).addScaledVector(dir, hr * 0.85 - push * 0.08).addScaledVector(side, s * 0.13);
      }
    });

    G.cleanT = (G.cleanT || 0) - dt;
    if (G.cleanT <= 0) {
      G.cleanT = 2;
      for (const u of [...G.users.values()]) {
        if (u.npc) continue;
        const idle = t - u.lastActive;
        const crowd = G.crowded();
        if (u.role === 'halay' && !u.leader && idle > (crowd ? 150 : IDLE_HALAY)) { if (crowd && !u.gifted) leave(u); else toTable(u); }
        else if ((u.role === 'masa') && idle > (crowd ? 180 : IDLE_MASA) && !u.gifted) leave(u);
        else if ((u.role === 'yogur' || ROLE_NAMES[u.role]) && idle > (u.autoRole ? IDLE_MASA : IDLE_MASA * 3)) leave(u);
      }
      refillRoles();
      const real = G.halay.filter((x) => !x.npc).length, npcs = G.halay.filter((x) => x.npc);
      if (real >= 12 && npcs.length) leave(npcs[npcs.length - 1]);
      else if (real < 3 && npcs.length < NPCS.length) addNpcs();
    }

    for (const u of all) u.ch.userData.update(t, G.beat, u.role === 'halay' || standing ? G.level : 0);
    const h = salon.hamur;
    const kn = G.knead.filter(Boolean).length;
    h.scale.set(0.36 + Math.sin(G.beat * Math.PI * kSpeed) * 0.012 * kn / 3, 0.15 - Math.abs(Math.sin(G.beat * Math.PI * kSpeed)) * 0.015 * Math.min(1, kn), 0.36);
    if (t < G.isotUntil) h.material.color.setRGB(1.15, 0.8, 0.75); else h.material.color.setRGB(1, 1, 1);
  };

  G.reset = () => {
    for (const u of [...G.users.values()]) { clearRole(u); scene.remove(u.ch); }
    G.users.clear(); G.halay.length = 0; G.knead.fill(null); G.orch = { saz: null, solist: null, darbuka: null };
    G.seatOwner.fill(null); G.baskose = null; G.scores.clear(); G.top = []; G.likes = G.diamonds = 0; G.energy = 15; G.likeBoost = 0;
    (G.leaving || []).forEach((u) => scene.remove(u.ch)); G.leaving = [];
    G.emit('board');
    addNpcs();
  };
  G.roleName = (u) => (u.leader ? '🧣 Halaybaşı' : ROLE_NAMES[u.role] || (u.role === 'yogur' ? '🌶️ Çiğ köfteci' : u.role === 'baskose' ? '🙏 Başköşe Misafiri' : null));

  const NPCS = [['Mahmut', 'erkek'], ['Gülizar', 'kadin'], ['Halil', 'erkek'], ['Zehra', 'kadin'], ['Şükrü', 'erkek']];
  function addNpcs() {
    const R = salon.rings[0];
    NPCS.forEach(([nick, cinsiyet], i) => {
      const id = 'npc_' + i;
      if (G.users.has(id)) return;
      const u = { id, nick, seed: hash(id + nick), cinsiyet, role: null, seat: -1, lastActive: G.time, bubble: null, welcomeT: -99, spot: null, npc: true };
      build(u);
      const a = -i * 0.3;
      u.ch.position.set(R.c.x + Math.cos(a) * R.rx, 0, R.c.z + Math.sin(a) * R.rz);
      G.users.set(id, u);
      G.halay.splice(Math.min(i, G.halay.length), 0, u); u.role = 'halay';
    });
  }
  G.addNpcs = addNpcs;
  addNpcs();
  return G;
}

function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
