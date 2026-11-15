// Karadeniz Horonu Oyun Mantığı:
//   • Halka halinde dik Karadeniz horonu (omuz titretme & alaşağı)
//   • Beğeni arttıkça horon halkası ve kemençe/tulum temposu belirgin biçimde hızlanır (horonSpeed: 1.0x -> 3.5x)!
//   • Ortak karakterler/, ortak/hediye-esle.js ve ortak/filtre.js modüllerini kullanır.
import * as THREE from 'three';
import { RINGS } from './salon.js';
import { karakterYap, mendilYap, TURLER, TUR_ETIKET, secilenTur, yorumdanTur, rng } from '/karakterler/index.js';
import { hediyeEsle } from '/ortak/hediye-esle.js';
import { yorumFiltrele } from '/ortak/filtre.js';

export const LEVELS = [
  { min: 0, n: 'Düz Horon', c: '#52b788' },
  { min: 35, n: 'Sallama', c: '#f6c453' },
  { min: 65, n: 'Sıksara', c: '#ff7a3d' },
  { min: 88, n: 'Alaşağı ⚡', c: '#ff3b6b' },
];
const RING_CAPS = [18, 28, 38];
const MAX_HALAY = 84;
const HALAY_RE = /horon|halay|halka|kat[ıi]l|ben\s*de|beni\s*de|sok|gir|oyna|dans|kemençe|kemence|tulum|alaşağ|alasag|\b1\b|💃|🕺|🎻|🙌|👏/i;
const KUYMAK_RE = /kuymak|m[ıi]hlama|peynir|m[ıi]s[ıi]r/i;
const FEMALE_RE = /\b(kad[ıi]n|k[ıi]z|bayan|han[ıi]m|abla|teyze)\b|👩|💃/i;
const MALE_RE = /\b(erkek|abi|day[ıi]|amca|bey|delikanl[ıi]|uşak|usak)\b|👨|🕺/i;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function createGame(scene, salon) {
  const G = {
    users: new Map(),
    seatOwner: new Array(salon.seats.length).fill(null),
    halay: [],
    knead: new Array(salon.knead.length).fill(null),
    orch: { saz: null, solist: null, darbuka: null },
    baskose: null,
    viewers: 0, likes: 0, diamonds: 0,
    energy: 0, level: 0, bpm: 118, beat: 0, time: 0,
    horonSpeed: 1.0,
    sisTimer: 0,
    rules: [], top: [], fx: [],
    karakterModu: 'bocek',
    izleyiciSecer: true,
    filtreAyar: { aktif: true, kelimeler: [] },
    filteredCount: 0,
    _ev: {},
    on(k, fn) { (this._ev[k] = this._ev[k] || []).push(fn); },
    emit(k, d) { (this._ev[k] || []).forEach((f) => f(d)); },
  };

  const npc = {};
  function spawnOrchNpcs() {
    [['saz', '🎻 Kemençeci', 'saz'], ['solist', '🎤 Atma Türkücü', 'solist'], ['darbuka', '🎶 Tulumcu', 'darbuka']].forEach(([k, label, prop]) => {
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
    G.emit('feed', { kind: 'join', user: u, text: 'yaylaya horona geldi 🎻' });
    return u;
  }

  function joinHalay(u, announce = true) {
    if (u.state === 'halay') return true;
    if (G.halay.length >= MAX_HALAY) return false;
    releaseCurrentSpot(u);
    u.state = 'halay';
    G.halay.push(u.id);
    if (G.halay.length === 1) { u.leader = true; setMendil(u, true); }
    if (announce) G.emit('announce', `🎻 ${u.nick} Karadeniz horon halkasına girdi!`);
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
    if (announce) G.emit('announce', `🧣 ${u.nick} HORON BAŞI oldu! "Alaşağı!"`);
    G.emit('focus', 'halay');
  }
  function joinKnead(u, announce = true) {
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
    if (announce) G.emit('announce', `🧀 ${u.nick} bakır kazanda kuymak sarıyor!`);
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
    const titles = { saz: '🎻 Kemençeci sensin!', solist: '🎤 Atma Türkücü sensin!', darbuka: '🎶 Tulumcu sensin!' };
    if (announce) G.emit('announce', `${u.nick} yayla sahnesine çıktı! ${titles[role]}`);
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
      case 'cay':
        G.fx.push({ type: 'cay' });
        return '☕ Herkese sıcacık Rize yayla çayı ikram etti!';
      case 'kemence':
        setOrch('saz', u, false);
        if (window.CD && window.CD.audio) window.CD.audio.tulumMode = false;
        return '🎻 Kemençeyi eline aldı, yaylaya neşe saçıyor!';
      case 'horonbasi':
        setHalayLeader(u, false);
        return '🧣 Horon Başı oldu, halkayı yönetiyor!';
      case 'tulum':
        setOrch('darbuka', u, false);
        if (window.CD && window.CD.audio) window.CD.audio.tulumMode = true;
        return '🎶 Tulumu şişirdi, dağlar taşlar inliyor!';
      case 'kuymak':
        joinKnead(u, false);
        G.fx.push({ type: 'kuymak', n: 30 });
        return '🧀 Bakır kazanda uzayan kuymak ve mısır ekmeği ikram etti!';
      case 'sis':
        G.sisTimer = 18;
        G.fx.push({ type: 'sis', n: 45 });
        return '🌫️ Yaylaya duman ve sis indi, horon bulutların üstünde!';
      case 'havaifisek':
        G.fx.push({ type: 'havaifisek', n: 6 }, { type: 'konfeti', n: 45 });
        return '🎆 Yayla göğünde havai fişekler patlıyor!';
      case 'alasagi':
        G.energy = 100;
        G.horonSpeed = 3.2;
        G.fx.push({ type: 'havaifisek', n: 8 }, { type: 'konfeti', n: 100 });
        return '⚡ DİK HORON & ALAŞAĞI! Halka maksimum hızda dönüyor!';
      default:
        return '🎁 Yayla şenliğine ikramda bulundu!';
    }
  }

  G.handle = function (ev) {
    if (!ev || !ev.type) return;
    if (ev.type === 'viewers' || ev.type === 'viewer') { G.viewers = ev.count | 0; return; }
    if (!ev.user || (!ev.user.id && !ev.user.nick)) return;
    const u = ensureUser(ev.user);
    if (ev.type === 'member' || ev.type === 'join') {
      boost(0.4);
      if (G.halay.length < 12 && Math.random() < 0.65) joinHalay(u, false);
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
      boost(2.5);

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
      } else if (KUYMAK_RE.test(txt)) joinKnead(u, true);
      else if (HALAY_RE.test(txt)) { G.emit('chipHit', 'halay'); joinHalay(u, true); }
      G.emit('feed', { kind: 'chat', user: u, text: txt });
    } else if (ev.type === 'like') {
      const c = clamp(ev.count || 1, 1, 80);
      G.emit('chipHit', 'begen');
      u.likes += c; G.likes += c;
      boost(c * 0.58);
      // Beğeni arttıkça horon halkası hızlanır!
      G.horonSpeed = clamp(G.horonSpeed + c * 0.028, 1.0, 3.4);
      if (u.likes >= 12 && u.state === 'sit' && G.halay.length < MAX_HALAY) joinHalay(u, true);
      G.fx.push({ type: 'kalp', at: u, n: Math.min(8, Math.ceil(c / 3)) });
      if (G.time - (u.likeFeedT || -99) > 6) { u.likeFeedT = G.time; G.emit('feed', { kind: 'like', user: u, text: `${c} beğeni ile horonu hızlandırdı ❤️` }); }
    } else if (ev.type === 'gift') {
      const g = ev.gift || {};
      const cnt = g.count || 1;
      const unit = Math.max(1, Number(g.diamonds) || 1);
      const total = unit * cnt;
      u.diamonds += total; u.gifted = true; G.diamonds += total;
      boost(Math.min(50, Math.sqrt(total) * 4));
      G.horonSpeed = clamp(G.horonSpeed + Math.min(0.8, total * 0.01), 1.0, 3.4);
      const m = hediyeEsle(G.rules, g, unit, total);
      let msg = '🎁 Horon şenliğine ikramda bulundu!';
      if (m) {
        msg = runAction(m.r.eylem, u, g, cnt);
        G.emit('ruleHit', m.r.eylem);
      } else if (u.state === 'sit' && G.halay.length < MAX_HALAY) {
        joinHalay(u, false);
        msg = '🎻 İkramıyla horon halkasına girdi!';
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
    G.baskose = null; G.likes = 0; G.diamonds = 0; G.energy = 0; G.level = 0; G.horonSpeed = 1.0; G.sisTimer = 0; G.top = [];
    G.emit('board');
  };

  G.roleName = function (u) {
    if (u.leader) return '🧣 Horon Başı';
    if (u.orchRole === 'saz') return '🎻 Kemençeci';
    if (u.orchRole === 'solist') return '🎤 Atma Türkücü';
    if (u.orchRole === 'darbuka') return '🎶 Tulumcu';
    if (u.kneadSlot >= 0) return '🧀 Kuymak Ustası';
    if (G.baskose === u.id) return '👑 Yayla Ağası';
    return null;
  };

  G.update = function (dt, audioBeat) {
    G.time += dt;
    if (G.sisTimer > 0) G.sisTimer = Math.max(0, G.sisTimer - dt);
    const targetFloor = clamp(G.halay.length * 1.4, 0, 45);
    G.energy = Math.max(targetFloor, G.energy - dt * 1.1);
    const baseSpeed = 1.0 + (G.energy / 100) * 1.25;
    G.horonSpeed = Math.max(baseSpeed, G.horonSpeed - dt * 0.08);

    let lv = 0;
    for (let i = LEVELS.length - 1; i >= 0; i--) if (G.energy >= LEVELS[i].min) { lv = i; break; }
    G.level = lv;
    if (audioBeat != null) G.beat = audioBeat;
    else G.beat += (dt * G.bpm * (0.7 + G.horonSpeed * 0.3)) / 60;
    const b = G.beat, e = G.energy / 100;

    for (const k of ['saz', 'solist', 'darbuka']) {
      if (npc[k].visible && typeof npc[k].calgiCal === 'function') {
        npc[k].calgiCal(b, 0.65 + e * 0.35, k);
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
      // Beğeni arttıkça G.horonSpeed ile halka çok daha hızlı döner!
      const rot = G.time * (0.34 * G.horonSpeed) * dir;
      const arcSpan = Math.min(Math.PI * 1.9, sl.cnt * 0.29);
      for (let i = 0; i < sl.cnt; i++) {
        const u = G.users.get(G.halay[sl.start + i]);
        if (!u) continue;
        const a = rot + (i / Math.max(1, sl.cnt)) * arcSpan;
        u.tx = Math.cos(a) * Rg.rx;
        u.tz = Math.sin(a) * Rg.rz;
        u.tyaw = Math.atan2(-u.tx, -u.tz);
        u.ringIdx = i; u.ringCnt = sl.cnt;
      }
    }

    for (const u of G.users.values()) {
      const ch = u.ch;
      const dx = u.tx - ch.position.x, dz = u.tz - ch.position.z;
      const dist = Math.hypot(dx, dz);
      const speed = u.state === 'halay' ? 4.5 * Math.min(2.2, G.horonSpeed) : 3.4;
      if (dist > 0.06) {
        const step = Math.min(dist, speed * dt);
        ch.position.x += (dx / dist) * step;
        ch.position.z += (dz / dist) * step;
        const moveYaw = Math.atan2(dx, dz);
        let dy = moveYaw - ch.rotation.y;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        ch.rotation.y += dy * Math.min(1, dt * 11);
      } else {
        let dy = u.tyaw - ch.rotation.y;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        ch.rotation.y += dy * Math.min(1, dt * 9);
      }

      const ph = (u.id.charCodeAt(0) % 13) * 0.45;
      if (dist > 0.18 && u.state !== 'halay') {
        ch.yuru(b, 0.9, ph);
      } else if (u.state === 'halay') {
        ch.halayCek(b, Math.min(1, 0.5 + e * 0.5), (u.ringIdx || 0) * 0.2, {
          tutSol: (u.ringIdx || 0) > 0,
          tutSag: (u.ringIdx || 0) < (u.ringCnt || 1) - 1,
          mendil: u.leader,
        });
        // Karadeniz horonu karakteristik hızlı omuz/gövde titretmesi!
        const ud = ch.userData;
        if (ud && ud.body) {
          ud.body.rotation.z += Math.sin(G.time * 26 * G.horonSpeed + (u.ringIdx || 0)) * 0.065;
        }
      } else if (u.state === 'orch') {
        ch.calgiCal(b, 0.7 + e * 0.3, u.orchRole);
      } else if (u.state === 'knead') {
        ch.hediyeHareketi('cigkofte', b, 0.7 + e * 0.3, ph);
      } else {
        ch.otur(b, e, ph);
      }
    }
  };

  return G;
}
