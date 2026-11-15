// Açık Hava Köy Düğünü Oyun Mantığı:
//   • Çiçekli düğün takı altında Gelin ve Damat (seçili karakter türünden)
//   • Meydanda Davul-Zurna ekibi, sağda Bakır Semaverli Çay Ocağı, ortada Meydan Halayı
//   • Ortak karakterler/, ortak/hediye-esle.js ve ortak/filtre.js modüllerini kullanır.
import * as THREE from 'three';
import { RINGS } from './salon.js';
import { karakterYap, mendilYap, TURLER, TUR_ETIKET, secilenTur, yorumdanTur, rng } from '/karakterler/index.js';
import { hediyeEsle } from '/ortak/hediye-esle.js';
import { yorumFiltrele } from '/ortak/filtre.js';

export const LEVELS = [
  { min: 0, n: 'Ağır', c: '#d8b278' },
  { min: 35, n: 'Orta', c: '#f6c453' },
  { min: 65, n: 'Hızlı', c: '#ff7a3d' },
  { min: 88, n: 'Coşku', c: '#ff3b6b' },
];
const RING_CAPS = [18, 28, 38];
const MAX_HALAY = 84;
const HALAY_RE = /halay|kat[ıi]l|ben\s*de|beni\s*de|sok|gir|oyna|dans|mendil|davul|zurna|\b1\b|💃|🕺|🥁|🙌|👏/i;
const CAY_RE = /çay|cay|semaver|ocak|demle/i;
const FEMALE_RE = /\b(kad[ıi]n|k[ıi]z|bayan|han[ıi]m|abla|teyze|gelin)\b|👩|💃|👰/i;
const MALE_RE = /\b(erkek|abi|day[ıi]|amca|bey|delikanl[ıi]|damat)\b|👨|🕺|🤵/i;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function addWhiteBrideVeil(ch) {
  const head = ch.userData && ch.userData.head;
  if (!head) return;
  const veilM = new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, roughness: 0.25, side: THREE.DoubleSide });
  const crownM = new THREE.MeshStandardMaterial({ color: '#f5c453', metalness: 0.9, roughness: 0.2 });
  const g = new THREE.Group();
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 8, 24), crownM);
  crown.rotation.x = Math.PI / 2; crown.position.set(0, 0.22, 0);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65), veilM);
  dome.position.set(0, 0.08, -0.02);
  g.add(crown, dome);
  head.add(g);
}

export function createGame(scene, salon) {
  const G = {
    users: new Map(),
    seatOwner: new Array(salon.seats.length).fill(null),
    halay: [],
    knead: new Array(salon.knead.length).fill(null),
    orch: { saz: null, solist: null, darbuka: null },
    baskose: null,
    viewers: 0, likes: 0, diamonds: 0,
    energy: 0, level: 0, bpm: 96, beat: 0, time: 0,
    rules: [], top: [], fx: [],
    karakterModu: 'bocek',
    izleyiciSecer: true,
    filtreAyar: { aktif: true, kelimeler: [] },
    filteredCount: 0,
    caySayisi: 0,
    takiSayisi: 0,
    bride: null,
    groom: null,
    _ev: {},
    on(k, fn) { (this._ev[k] = this._ev[k] || []).push(fn); },
    emit(k, d) { (this._ev[k] || []).forEach((f) => f(d)); },
  };

  function spawnCouple() {
    if (G.bride && G.bride.ch) scene.remove(G.bride.ch);
    if (G.groom && G.groom.ch) scene.remove(G.groom.ch);
    const turB = secilenTur(G.karakterModu, 'koy_gelin');
    const turG = secilenTur(G.karakterModu, 'koy_damat');
    const bch = karakterYap(turB, '#f7f4eb', 'koy_gelin', { rol: 'gelin', gender: 'f' });
    addWhiteBrideVeil(bch);
    bch.position.copy(salon.brideSeat.pos);
    bch.rotation.y = salon.brideSeat.yaw;
    scene.add(bch);
    G.bride = { id: 'koy_gelin', nick: '👰 Gelin', tur: turB, ch: bch };

    const gch = karakterYap(turG, '#1d2436', 'koy_damat', { rol: 'damat', gender: 'm' });
    gch.position.copy(salon.groomSeat.pos);
    gch.rotation.y = salon.groomSeat.yaw;
    scene.add(gch);
    G.groom = { id: 'koy_damat', nick: '🤵 Damat', tur: turG, ch: gch };
  }
  spawnCouple();

  const npc = {};
  function spawnOrchNpcs() {
    [['saz', '🪕 Meydan Sazcısı', 'saz'], ['solist', '🎺 Zurnacı Başı', 'solist'], ['darbuka', '🥁 Meydan Davulcusu', 'darbuka']].forEach(([k, label, prop]) => {
      if (npc[k]) scene.remove(npc[k]);
      const tur = secilenTur(G.karakterModu, 'npc_' + k);
      const c = karakterYap(tur, null, 'npc_' + k, { rol: k, prop });
      c.position.copy(salon.orch[k].pos);
      c.rotation.y = salon.orch[k].yaw;
      scene.add(c);
      npc[k] = c;
      if (G.orch[k]) c.visible = false;
    });
  }
  spawnOrchNpcs();

  function rebuildCharacter(u) {
    const old = u.ch;
    const pos = old ? old.position.clone() : new THREE.Vector3();
    const yaw = old ? old.rotation.y : 0;
    const prop = u.orchRole || (u.leader ? 'mendil' : null);
    if (old) scene.remove(old);
    const tur = u.ozelTur || secilenTur(G.karakterModu, u.id);
    u.tur = tur;
    const ch = karakterYap(tur, u.customColor || null, u.id, { gender: u.gender, prop, rol: u.orchRole });
    ch.position.copy(pos);
    ch.rotation.y = yaw;
    scene.add(ch);
    u.ch = ch;
    return ch;
  }

  G.setKarakterAyar = function (karakterModu, izleyiciSecer) {
    if (karakterModu) G.karakterModu = karakterModu;
    if (typeof izleyiciSecer === 'boolean') G.izleyiciSecer = izleyiciSecer;
    spawnCouple();
    spawnOrchNpcs();
    for (const u of G.users.values()) {
      if (!u.ozelTur) rebuildCharacter(u);
    }
    G.emit('karakterAyar', { karakter: G.karakterModu, izleyiciSecer: G.izleyiciSecer });
  };

  function boost(n) { G.energy = clamp(G.energy + n, 0, 100); }

  function pickFreeSeat() {
    const free = [];
    for (let i = 0; i < G.seatOwner.length; i++) if (!G.seatOwner[i]) free.push(i);
    return free.length ? free[Math.floor(Math.random() * free.length)] : -1;
  }
  function releaseCurrentSpot(u) {
    if (u.seat >= 0) { G.seatOwner[u.seat] = null; u.seat = -1; }
    if (u.kneadSlot >= 0) { G.knead[u.kneadSlot] = null; u.kneadSlot = -1; }
    const hi = G.halay.indexOf(u.id);
    if (hi >= 0) {
      const wasL = u.leader;
      G.halay.splice(hi, 1); u.leader = false; setMendil(u, false);
      if (wasL && G.halay.length) { const nl = G.users.get(G.halay[0]); if (nl) { nl.leader = true; setMendil(nl, true); } }
    }
    if (u.orchRole) { const k = u.orchRole; G.orch[k] = null; u.orchRole = null; npc[k].visible = true; rebuildCharacter(u); }
    if (G.baskose === u.id) G.baskose = null;
  }
  function setMendil(u, on) {
    const h = u.ch.userData.handR;
    const old = h.getObjectByName('mendil');
    if (old) h.remove(old);
    if (on) { const m = mendilYap(); m.name = 'mendil'; h.add(m); }
  }

  function ensureUser(raw) {
    const id = String(raw.id || raw.nick || 'anon');
    let u = G.users.get(id);
    if (u) { if (raw.nick) u.nick = raw.nick; return u; }

    if (G.users.size >= 150) {
      let victim = null;
      for (const cand of G.users.values()) {
        if (!cand.orchRole && !cand.leader && cand.kneadSlot < 0 && G.baskose !== cand.id && cand.diamonds === 0) { victim = cand; break; }
      }
      if (victim) { releaseCurrentSpot(victim); scene.remove(victim.ch); G.users.delete(victim.id); }
    }

    const r = rng(id.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 5381));
    const gender = r() < 0.5 ? 'f' : 'm';
    const tur = secilenTur(G.karakterModu, id);
    const ch = karakterYap(tur, null, id, { gender });
    const si = pickFreeSeat();
    const doorX = (Math.random() - 0.5) * 7;
    ch.position.set(doorX, 0, salon.bounds.front);
    scene.add(ch);
    u = {
      id, nick: raw.nick || id, ch, gender, tur, ozelTur: null,
      state: 'sit', seat: si, kneadSlot: -1, orchRole: null, leader: false,
      tx: 0, tz: 0, tyaw: 0,
      likes: 0, diamonds: 0, gifted: false,
      bubble: null, welcomeT: G.time,
      wanderX: doorX, wanderZ: 7 + (Math.random() - 0.5) * 3,
    };
    if (si >= 0) {
      G.seatOwner[si] = id;
      const s = salon.seats[si];
      u.tx = s.pos.x; u.tz = s.pos.z; u.tyaw = s.yaw;
    } else { u.state = 'stand'; u.tx = u.wanderX; u.tz = u.wanderZ; }
    G.users.set(id, u);
    G.emit('feed', { kind: 'join', user: u, text: 'köy meydanına geldi 🎉' });
    return u;
  }

  function joinHalay(u, announce = true) {
    if (u.state === 'halay') return true;
    if (G.halay.length >= MAX_HALAY) return false;
    releaseCurrentSpot(u);
    u.state = 'halay';
    G.halay.push(u.id);
    if (G.halay.length === 1) { u.leader = true; setMendil(u, true); }
    if (announce) G.emit('announce', `💃 ${u.nick} köy meydanı halayına girdi!`);
    return true;
  }
  function setHalayLeader(u, announce = true) {
    if (u.state !== 'halay') {
      if (G.halay.length >= MAX_HALAY) {
        const last = G.users.get(G.halay[G.halay.length - 1]);
        if (last) sendToSeat(last);
      }
      releaseCurrentSpot(u);
      u.state = 'halay';
    }
    for (const id of G.halay) { const x = G.users.get(id); if (x) { x.leader = false; setMendil(x, false); } }
    const idx = G.halay.indexOf(u.id); if (idx >= 0) G.halay.splice(idx, 1);
    G.halay.unshift(u.id);
    u.leader = true; setMendil(u, true);
    if (announce) G.emit('announce', `🧣 ${u.nick} MEYDAN HALAY BAŞI oldu!`);
    G.emit('focus', 'halay');
  }
  function joinTeaStall(u, announce = true) {
    if (u.state === 'knead') return;
    let slot = G.knead.indexOf(null);
    if (slot < 0) {
      slot = 0;
      const old = G.users.get(G.knead[0]);
      if (old) sendToSeat(old);
    }
    releaseCurrentSpot(u);
    G.knead[slot] = u.id; u.kneadSlot = slot; u.state = 'knead';
    const k = salon.knead[slot]; u.tx = k.pos.x; u.tz = k.pos.z; u.tyaw = k.yaw;
    if (announce) G.emit('announce', `☕ ${u.nick} Çay Ocağının başına geçti!`);
    G.emit('focus', 'tepsi');
  }
  function setOrch(role, u, announce = true) {
    const prevId = G.orch[role];
    if (prevId === u.id) return;
    if (prevId) { const p = G.users.get(prevId); if (p) sendToSeat(p); }
    releaseCurrentSpot(u);
    G.orch[role] = u.id; u.orchRole = role; u.state = 'orch';
    npc[role].visible = false;
    rebuildCharacter(u);
    const o = salon.orch[role]; u.tx = o.pos.x; u.tz = o.pos.z; u.tyaw = o.yaw;
    const titles = { saz: '🪕 Sazcı sensin!', solist: '🎺 Zurnacı Başı sensin!', darbuka: '🥁 Meydan Davulcusu sensin!' };
    if (announce) G.emit('announce', `${u.nick} meydana çıktı! ${titles[role]}`);
    G.emit('focus', 'sahne');
  }
  function sendToSeat(u) {
    releaseCurrentSpot(u);
    const si = pickFreeSeat();
    if (si >= 0) {
      G.seatOwner[si] = u.id; u.seat = si; u.state = 'sit';
      const s = salon.seats[si]; u.tx = s.pos.x; u.tz = s.pos.z; u.tyaw = s.yaw;
    } else { u.state = 'stand'; u.tx = u.wanderX; u.tz = u.wanderZ; }
  }
  function updateBaskose() {
    G.top = [...G.users.values()].filter((u) => u.diamonds > 0).sort((a, b) => b.diamonds - a.diamonds).slice(0, 5);
    const top1 = G.top[0];
    if (top1 && G.baskose !== top1.id && !top1.orchRole && !top1.leader && top1.kneadSlot < 0) {
      if (G.baskose) { const prev = G.users.get(G.baskose); if (prev && prev.state === 'baskose') sendToSeat(prev); }
      releaseCurrentSpot(top1);
      G.baskose = top1.id; top1.state = 'baskose';
      top1.tx = salon.baskose.pos.x; top1.tz = salon.baskose.pos.z; top1.tyaw = salon.baskose.yaw;
    }
    G.emit('board');
  }

  function runAction(eylem, u, gift, cnt) {
    G.emit('chipHit', eylem);
    switch (eylem) {
      case 'cayocagi':
        G.caySayisi += cnt;
        joinTeaStall(u, false);
        G.fx.push({ type: 'cay' });
        return '☕ Bakır semaverden bütün köy meydanına taze çay dağıttı!';
      case 'davul':
        setOrch('darbuka', u, false);
        return '🥁 Davulu omzuna astı, tokmağı vuruyor!';
      case 'halaybasi':
        setHalayLeader(u, false);
        return '🧣 Mendili aldı, Meydan Halay Başı oldu!';
      case 'zurna':
        setOrch('solist', u, false);
        return '🎺 Zurnayı üflüyor, köy meydanı inliyor!';
      case 'bahsis':
        G.fx.push({ type: 'konfeti', n: 45 });
        return '💵 Davulcu ve zurnacının alnına bahşiş yapıştırdı!';
      case 'gelindamat':
        G.takiSayisi += cnt;
        G.fx.push({ type: 'konfeti', n: 65 }, { type: 'havaifisek', n: 4 });
        G.emit('focus', 'sahne');
        return '👰🤵 Gelin ve Damada altın kurdelesi taktı!';
      case 'havaifisek':
        G.fx.push({ type: 'havaifisek', n: 7 }, { type: 'konfeti', n: 50 });
        return '🎆 Köy semalarında havai fişekler patlıyor!';
      case 'konvoy':
        G.energy = 100;
        G.fx.push({ type: 'havaifisek', n: 10 }, { type: 'konfeti', n: 120 }, { type: 'cay' });
        return '🚗 Düğün konvoyu köy meydanına girdi, bütün köy ayakta!';
      default:
        return '🎁 Köy düğününe ikramda bulundu!';
    }
  }

  G.handle = function (ev) {
    if (!ev || !ev.type) return;
    if (ev.type === 'viewers' || ev.type === 'viewer') { G.viewers = ev.count | 0; return; }
    if (!ev.user || (!ev.user.id && !ev.user.nick)) return;
    const u = ensureUser(ev.user);
    if (ev.type === 'member' || ev.type === 'join') {
      boost(0.4);
      if (G.halay.length < 10 && Math.random() < 0.55) joinHalay(u, false);
    } else if (ev.type === 'follow') {
      boost(3);
      G.emit('feed', { kind: 'follow', user: u, text: 'takip etti ➕' });
    } else if (ev.type === 'share') {
      boost(3);
      G.emit('feed', { kind: 'share', user: u, text: 'yayını paylaştı 🔗' });
    } else if (ev.type === 'chat') {
      const rawTxt = String(ev.text || '').trim();
      const flt = yorumFiltrele(rawTxt, G.filtreAyar);
      if (!flt.temiz) {
        G.filteredCount++;
        G.emit('filtered', G.filteredCount);
        return;
      }
      G.emit('chipHit', 'yorum');
      const txt = flt.metin;
      u.bubble = { text: txt, t: G.time };
      if (u.ch && u.ch.userData && u.ch.userData.state) u.ch.userData.state.talkT = G.time;
      boost(2.2);

      if (G.izleyiciSecer) {
        const kt = yorumdanTur(txt);
        const secTur = kt && (kt.tur || kt);
        if (secTur && (u.tur !== secTur || u.ozelTur !== secTur)) {
          G.emit('chipHit', 'tur');
          u.ozelTur = secTur;
          if (kt.renk) u.customColor = kt.renk;
          rebuildCharacter(u);
          if (u.leader) setMendil(u, true);
          G.fx.push({ type: 'puf', at: u });
          const et = TUR_ETIKET[secTur] || TUR_ETIKET.bocek;
          G.emit('announce', `${et.ikon} ${u.nick} karakterini ${et.ad} yaptı!`);
        }
      }

      const wantF = FEMALE_RE.test(txt), wantM = MALE_RE.test(txt);
      if ((wantF && !wantM && u.gender !== 'f') || (wantM && !wantF && u.gender !== 'm')) {
        u.gender = wantF ? 'f' : 'm';
        rebuildCharacter(u);
        if (u.leader) setMendil(u, true);
        G.fx.push({ type: 'puf', at: u });
      }
      if (/^(otur|masaya d[öo]n|masaya)$/i.test(txt)) {
        if (u.state === 'halay' && !u.leader) sendToSeat(u);
      } else if (/^(oyna|hop|zıpla|zipla)$/i.test(txt)) {
        if (u.ch && u.ch.userData && u.ch.userData.state) u.ch.userData.state.jumpT = G.time;
      } else if (CAY_RE.test(txt)) joinTeaStall(u, true);
      else if (HALAY_RE.test(txt)) { G.emit('chipHit', 'halay'); joinHalay(u, true); }
      G.emit('feed', { kind: 'chat', user: u, text: txt });
    } else if (ev.type === 'like') {
      const c = clamp(ev.count || 1, 1, 80);
      G.emit('chipHit', 'begen');
      u.likes += c; G.likes += c; boost(c * 0.48);
      if (u.likes >= 15 && u.state === 'sit' && G.halay.length < MAX_HALAY) joinHalay(u, true);
      G.fx.push({ type: 'kalp', at: u, n: Math.min(8, Math.ceil(c / 3)) });
      if (G.time - (u.likeFeedT || -99) > 6) { u.likeFeedT = G.time; G.emit('feed', { kind: 'like', user: u, text: `${c} beğeni gönderdi ❤️` }); }
    } else if (ev.type === 'gift') {
      const g = ev.gift || {};
      const cnt = g.count || 1;
      const unit = Math.max(1, Number(g.diamonds) || 1);
      const total = unit * cnt;
      u.diamonds += total; u.gifted = true; G.diamonds += total;
      boost(Math.min(50, Math.sqrt(total) * 4));
      const m = hediyeEsle(G.rules, g, unit, total);
      let msg = '🎁 Köy düğünümüze ikramda bulundu!';
      if (m) {
        msg = runAction(m.r.eylem, u, g, cnt);
        G.emit('ruleHit', m.r.eylem);
      } else if (u.state === 'sit' && G.halay.length < MAX_HALAY) {
        joinHalay(u, false);
        msg = '💃 İkramıyla meydan halayına katıldı!';
      }
      updateBaskose();
      G.emit('giftlog', { user: u, gift: g, dia: total, cnt, match: m });
      G.emit('banner', { user: u, gift: g, count: cnt, total, text: msg, auto: m && m.by === 'jeton' && total < 20 });
      G.emit('feed', { kind: 'gift', user: u, text: `${g.name || 'Hediye'} (${total} 🪙) → ${msg}` });
    }
  };

  G.reset = function () {
    for (const u of G.users.values()) scene.remove(u.ch);
    G.users.clear();
    G.seatOwner.fill(null); G.halay.length = 0; G.knead.fill(null);
    for (const k of ['saz', 'solist', 'darbuka']) { G.orch[k] = null; npc[k].visible = true; }
    G.baskose = null; G.likes = 0; G.diamonds = 0; G.energy = 0; G.level = 0; G.top = [];
    G.caySayisi = 0; G.takiSayisi = 0;
    G.emit('board');
  };

  G.roleName = function (u) {
    if (u.leader) return '🧣 Halay Başı';
    if (u.orchRole === 'saz') return '🪕 Sazcı';
    if (u.orchRole === 'solist') return '🎺 Zurnacı';
    if (u.orchRole === 'darbuka') return '🥁 Davulcu';
    if (u.kneadSlot >= 0) return '☕ Çay Ocağı Ustası';
    if (G.baskose === u.id) return '👑 Köy Ağası';
    return null;
  };

  G.update = function (dt, audioBeat) {
    G.time += dt;
    const targetFloor = clamp(G.halay.length * 1.3, 0, 42);
    G.energy = Math.max(targetFloor, G.energy - dt * 1.15);
    let lv = 0;
    for (let i = LEVELS.length - 1; i >= 0; i--) if (G.energy >= LEVELS[i].min) { lv = i; break; }
    G.level = lv;
    if (audioBeat != null) G.beat = audioBeat;
    else G.beat += (dt * G.bpm) / 60;
    const b = G.beat, e = G.energy / 100;

    // Gelin ve Damat nikah masasında alkış / selamlama animasyonu
    if (G.bride && G.bride.ch) G.bride.ch.otur(b, 0.4 + e * 0.45, 0);
    if (G.groom && G.groom.ch) G.groom.ch.otur(b, 0.4 + e * 0.45, 1.2);

    for (const k of ['saz', 'solist', 'darbuka']) {
      if (npc[k].visible && typeof npc[k].calgiCal === 'function') {
        npc[k].calgiCal(b, 0.58 + e * 0.42, k);
      }
    }

    let rem = G.halay.length, cursor = 0;
    const ringSlices = [];
    for (let r = 0; r < RINGS.length && rem > 0; r++) {
      const cnt = Math.min(rem, RING_CAPS[r]);
      ringSlices.push({ r, start: cursor, cnt });
      cursor += cnt; rem -= cnt;
    }
    for (const sl of ringSlices) {
      const Rg = RINGS[sl.r];
      const dir = sl.r % 2 === 0 ? 1 : -1;
      const rot = G.time * (0.24 + e * 0.3) * dir;
      const arcSpan = Math.min(Math.PI * 1.82, sl.cnt * 0.28);
      for (let i = 0; i < sl.cnt; i++) {
        const u = G.users.get(G.halay[sl.start + i]);
        if (!u) continue;
        const a = rot + (i / Math.max(1, sl.cnt)) * arcSpan;
        u.tx = Math.cos(a) * Rg.rx;
        u.tz = Math.sin(a) * Rg.rz + 0.5;
        u.tyaw = Math.atan2(-u.tx, 0.5 - u.tz);
        u.ringIdx = i; u.ringCnt = sl.cnt;
      }
    }

    for (const u of G.users.values()) {
      const ch = u.ch;
      const dx = u.tx - ch.position.x, dz = u.tz - ch.position.z;
      const dist = Math.hypot(dx, dz);
      const speed = u.state === 'halay' ? 4.3 : 3.2;
      if (dist > 0.06) {
        const step = Math.min(dist, speed * dt);
        ch.position.x += (dx / dist) * step;
        ch.position.z += (dz / dist) * step;
        const moveYaw = Math.atan2(dx, dz);
        let dy = moveYaw - ch.rotation.y;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        ch.rotation.y += dy * Math.min(1, dt * 10);
      } else {
        let dy = u.tyaw - ch.rotation.y;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        ch.rotation.y += dy * Math.min(1, dt * 8);
      }

      const ph = (u.id.charCodeAt(0) % 13) * 0.45;
      if (dist > 0.18 && u.state !== 'halay') {
        ch.yuru(b, 0.85, ph);
      } else if (u.state === 'halay') {
        ch.halayCek(b, 0.45 + e * 0.55, (u.ringIdx || 0) * 0.25, {
          tutSol: (u.ringIdx || 0) > 0,
          tutSag: (u.ringIdx || 0) < (u.ringCnt || 1) - 1,
          mendil: u.leader,
        });
      } else if (u.state === 'orch') {
        ch.calgiCal(b, 0.65 + e * 0.35, u.orchRole);
      } else if (u.state === 'knead') {
        ch.hediyeHareketi('cigkofte', b, 0.65 + e * 0.35, ph);
      } else {
        ch.otur(b, e, ph);
      }
    }
  };

  return G;
}
