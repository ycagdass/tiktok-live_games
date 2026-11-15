// Karadeniz Horonu Arayüzü:
//   • Halka hızı çarpanı (G.horonSpeed x), yayla sisi (sis), kuymak ve havai fişek efektleri
//   • İzleyici adları, konuşma balonları ve teşekkür listesi
import * as THREE from 'three';
import { LEVELS } from './oyun.js';
import { TUR_ETIKET } from '/karakterler/index.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Math.round(n).toLocaleString('tr-TR');
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const FONT = 'Nunito, "Segoe UI", "Segoe UI Emoji", system-ui, sans-serif';
const W = 1080, H = 1920;

export function createUI(G, camera, salon, hooks) {
  const UI = {};
  const ov = $('ov'), ctx = ov.getContext('2d');
  let q = 1;
  const aq = [], bq = [];
  let aT = 0, bT = 0, statT = 0, annOn = false, banOn = false;
  const parts = [];

  UI.fit = () => {
    const wrap = $('stageWrap'), w = wrap.clientWidth, h = wrap.clientHeight;
    const s = Math.min(w / W, h / H);
    $('stage').style.transform = `translate(${(w - W * s) / 2}px,${(h - H * s) / 2}px) scale(${s})`;
    q = clamp(Math.round(s * (window.devicePixelRatio || 1) * 4) / 4, 0.5, 1);
    ov.width = W * q; ov.height = H * q;
    hooks.onQuality(q);
  };
  addEventListener('resize', UI.fit);

  function rr(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  function pill(x, y, txt, bg, fg, fs, borderCol = null) {
    ctx.font = `800 ${fs}px ${FONT}`;
    const w = ctx.measureText(txt).width + fs * 1.15, h = fs * 1.62, X = clamp(x - w / 2, 4, W - w - 4);
    ctx.fillStyle = bg; rr(X, y - h, w, h, h / 2); ctx.fill();
    if (borderCol) { ctx.strokeStyle = borderCol; ctx.lineWidth = Math.max(1.5, fs * 0.08); ctx.stroke(); }
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, X + w / 2, y - h / 2 + 1);
    return h;
  }
  function bubble(gx, y, text, a, fs) {
    if (text.length > 30) text = text.slice(0, 29) + '…';
    ctx.font = `700 ${fs}px ${FONT}`;
    const w = ctx.measureText(text).width + fs * 1.3, h = fs * 1.75, tl = fs * 0.6, X = clamp(gx - w / 2, 4, W - w - 4);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(X + 2, y - h - tl + 2, w, h, fs * 0.7); ctx.fill();
    ctx.fillStyle = '#fff'; rr(X, y - h - tl, w, h, fs * 0.7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(gx - tl * 0.6, y - tl - 0.5); ctx.lineTo(gx + tl * 0.6, y - tl - 0.5); ctx.lineTo(gx, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#143320'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, X + w / 2, y - h / 2 - tl + 1);
    ctx.globalAlpha = 1;
  }
  const tmp = new THREE.Vector3();
  function project(v) {
    tmp.copy(v).project(camera);
    if (tmp.z > 1 || tmp.z < -1) return null;
    return { x: (tmp.x * 0.5 + 0.5) * W, y: (-tmp.y * 0.5 + 0.5) * H };
  }

  UI.draw = (dt) => {
    ctx.setTransform(q, 0, 0, q, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Yayla sisi efekti
    if (G.sisTimer > 0) {
      const alpha = Math.min(0.28, G.sisTimer * 0.04);
      const grad = ctx.createLinearGradient(0, 350, 0, 1450);
      grad.addColorStop(0, `rgba(220,238,245,0)`);
      grad.addColorStop(0.5, `rgba(220,238,245,${alpha})`);
      grad.addColorStop(1, `rgba(220,238,245,0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 350, W, 1100);
    }

    const items = [];
    for (const u of G.users.values()) {
      const hp = u.ch.userData.head.getWorldPosition(new THREE.Vector3()); hp.y += 0.44;
      const d = camera.position.distanceTo(hp);
      const p = project(hp);
      if (!p || p.x < -80 || p.x > W + 80 || p.y < 0 || p.y > H) continue;
      items.push({ u, p, d, k: clamp(5.8 / d, 0.45, 1.3) });
    }
    items.sort((a, b) => b.d - a.d);
    for (const it of items) {
      const { u, p, k } = it, role = G.roleName(u);
      const et = TUR_ETIKET[u.tur] || TUR_ETIKET.bocek;
      let y = p.y;
      const nameLabel = u.ozelTur ? `${et.ikon} ${u.nick}` : u.nick;
      y -= pill(p.x, y, nameLabel, 'rgba(12,34,20,.84)', '#fff', 23 * k, u.gifted ? 'rgba(246,196,83,.75)' : 'rgba(255,255,255,.22)') + 4;
      if (role) y -= pill(p.x, y, role, u.leader ? 'rgba(45,154,96,.95)' : 'rgba(246,196,83,.96)', u.leader ? '#fff' : '#3a2300', 22 * k) + 4;
      const b = u.bubble;
      if (b) {
        const age = G.time - b.t;
        if (age > 5.5) u.bubble = null;
        else bubble(p.x, y, b.text, Math.min(1, age * 6, (5.5 - age) * 2), 26 * k);
      } else if (G.time - u.welcomeT < 3) {
        ctx.globalAlpha = Math.min(1, (3 - (G.time - u.welcomeT)) * 2);
        pill(p.x, y, 'Hoş geldin uşağum! 🎻', 'rgba(82,183,136,.95)', '#052e16', 20 * k);
        ctx.globalAlpha = 1;
      }
    }

    for (const f of G.fx) {
      if (f.type === 'konfeti') {
        for (let i = 0; i < f.n; i++) {
          parts.push({ k: 'c', x: Math.random() * W, y: -Math.random() * 500, vx: (Math.random() - 0.5) * 120, vy: 120 + Math.random() * 300, r: Math.random() * 6, vr: (Math.random() - 0.5) * 8, w: 12 + Math.random() * 10, h: 6 + Math.random() * 6, col: ['#52b788', '#ffd166', '#ffffff', '#7ad1ff', '#ff5c8a'][i % 5], life: 7 });
        }
      } else if (f.type === 'havaifisek') {
        const bursts = f.n || 5;
        for (let b = 0; b < bursts; b++) {
          const cx = 180 + Math.random() * (W - 360), cy = 220 + Math.random() * 520;
          const col = ['#52b788', '#ffd166', '#06d6a0', '#7ad1ff', '#ff4f7b'][b % 5];
          for (let i = 0; i < 38; i++) {
            const a = (i / 38) * Math.PI * 2;
            const sp = 90 + Math.random() * 230;
            parts.push({ k: 'fw', x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, col, life: 1.6 + Math.random() * 0.7, delay: b * 0.16, r: 4 + Math.random() * 4 });
          }
        }
      } else if (f.type === 'kuymak') {
        const tp = salon.tray.pos;
        for (let i = 0; i < (f.n || 24); i++) {
          parts.push({ k: 'e', w: tp.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.3, 0.35 + Math.random() * 0.5, (Math.random() - 0.5) * 1.3)), e: i % 2 === 0 ? '🧀' : '🌽', life: 2.2, t0: (i % 5) * 0.08 });
        }
      } else if (f.type === 'sis') {
        for (let i = 0; i < (f.n || 30); i++) {
          parts.push({ k: 'e', w: new THREE.Vector3((Math.random() - 0.5) * 8, 0.4 + Math.random() * 1.5, (Math.random() - 0.5) * 8), e: '🌫️', life: 3.2, t0: (i % 6) * 0.1 });
        }
      } else if (f.type === 'kalp' && f.at) {
        const hp = f.at.ch.userData.head.getWorldPosition(new THREE.Vector3());
        const p = project(hp);
        if (p) for (let i = 0; i < f.n; i++) parts.push({ k: 'h', x: p.x + (Math.random() - 0.5) * 30, y: p.y - 40, vy: -90 - Math.random() * 80, ph: Math.random() * 6, life: 1.7, s: 14 + Math.random() * 10, col: ['#ff4f7b', '#52b788', '#ffd166'][i % 3] });
      } else if (f.type === 'puf' && f.at) {
        const hp = f.at.ch.userData.head.getWorldPosition(new THREE.Vector3());
        for (let i = 0; i < 10; i++) parts.push({ k: 'e', w: hp.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.7, Math.random() * 0.6 - 0.3, (Math.random() - 0.5) * 0.7)), e: '✨', life: 1.4, t0: 0 });
      } else if (f.type === 'cay') {
        for (const tc of salon.tables) for (let i = 0; i < 3; i++) parts.push({ k: 'e', w: tc.clone().setY(0.45 + i * 0.1), e: '☕', life: 4, t0: i * 0.25 });
      }
    }
    G.fx.length = 0;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.delay && p.delay > 0) { p.delay -= dt; continue; }
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      if (p.k === 'c') {
        p.vy += 220 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        ctx.save(); ctx.globalAlpha = Math.min(1, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.cos(p.r * 1.7)); ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      } else if (p.k === 'fw') {
        p.vy += 140 * dt; p.vx *= 0.98; p.vy *= 0.98; p.x += p.vx * dt; p.y += p.vy * dt;
        ctx.save(); ctx.globalAlpha = Math.min(1, p.life);
        ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (p.k === 'h') {
        p.y += p.vy * dt; p.x += Math.sin(G.time * 3 + p.ph) * 0.6;
        ctx.globalAlpha = Math.min(1, p.life); ctx.fillStyle = p.col; const s = p.s, x = p.x, y = p.y;
        ctx.beginPath(); ctx.moveTo(x, y + s * 0.35); ctx.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.5, y - s, x, y - s * 0.45); ctx.bezierCurveTo(x + s * 0.5, y - s, x + s, y - s * 0.3, x, y + s * 0.35); ctx.fill(); ctx.globalAlpha = 1;
      } else if (p.k === 'e') {
        if (p.t0 > 0) { p.t0 -= dt; p.life += dt; continue; }
        p.w.y += dt * 0.35; const s = project(p.w); if (!s) continue;
        ctx.globalAlpha = Math.min(1, p.life / 1.4); ctx.font = `38px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(p.e, s.x, s.y); ctx.globalAlpha = 1;
      }
    }
  };

  function addFeed(item) {
    const feed = $('feed'), li = document.createElement('li');
    li.className = 'fi ' + item.kind;
    const ini = (item.user.nick || '?').charAt(0).toLocaleUpperCase('tr');
    li.innerHTML = `<span class="av" style="background:#1b4332">${esc(ini)}</span><span class="tx"><b>${esc(item.user.nick)}</b> ${esc(item.text)}</span>`;
    feed.prepend(li);
    while (feed.children.length > 40) feed.lastChild.remove();
  }

  function renderBoard() {
    const L = $('boardList');
    if (!G.top.length) { L.innerHTML = '<li class="empty">Yayla şenliğimize ikramda bulunan dostlarımız burada yer alır 🙏</li>'; }
    else {
      const icons = ['🎻', '🧀', '☕', '🌲', '🙏'];
      L.innerHTML = G.top.map((s, i) => `<li><span class="rk">${icons[i] || '🌲'}</span><span class="nm">${esc(s.nick)}</span>${s.id === G.baskose ? '<span class="tag">Yayla Ağası</span>' : ''}<span class="dm">Teşekkürler 🙏</span></li>`).join('');
    }
    const b = G.baskose && G.users.get(G.baskose);
    $('takiSum').textContent = b ? `🌲 Yayla Ağamız: ${b.nick}` : `⚡ Halka Hızı: ${G.horonSpeed.toFixed(1)}x · İkramlarınız için teşekkürler!`;
  }

  function addGiftLog(e) {
    const L = $('giftLog'), li = document.createElement('li'), m = e.match;
    const res = m ? `${esc(m.r.etiket)}${m.by === 'jeton' ? ' <i>(jeton ile)</i>' : ''}` : '🎁 ikram';
    li.innerHTML = `<b>${esc(e.gift.name || '?')}</b> · id ${esc(e.gift.id || '-')} · ${fmt(e.dia)} jeton${e.cnt > 1 ? ' ×' + e.cnt : ''} → ${res}<small>${esc(e.user.nick)}</small>`;
    const empty = L.querySelector('.empty'); if (empty) empty.remove();
    L.prepend(li); while (L.children.length > 8) L.lastChild.remove();
  }
  G.on('feed', addFeed);
  G.on('board', renderBoard);
  G.on('giftlog', addGiftLog);
  G.on('filtered', (cnt) => { if ($('filteredCnt')) $('filteredCnt').textContent = String(cnt); });

  UI.renderChips = () => {
    $('giftChips').innerHTML = G.rules.map((r) => {
      const ic = /^https:\/\//.test(r.resim || '') ? `<img src="${esc(r.resim)}" referrerpolicy="no-referrer" alt="">` : esc(r.ikon || '🎻');
      const cost = r.jeton != null ? `${fmt(r.jeton)} 🪙` : `${fmt(r.minJeton)}+ 🪙`;
      return `<div class="chip" data-chip="${esc(r.eylem)}"><span class="ci">${ic}</span><span class="ct"><b>${esc(r.etiket)}</b><small>${cost}</small></span></div>`;
    }).join('');
  };
  const hitT = {};
  const flash = (key) => {
    const el = document.querySelector(`.chip[data-chip="${key}"]`); if (!el) return;
    el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
    clearTimeout(hitT[key]); hitT[key] = setTimeout(() => el.classList.remove('hit'), 1300);
  };
  G.on('ruleHit', flash);
  G.on('chipHit', flash);
  G.on('announce', (t) => { aq.push(t); if (aq.length > 8) aq.splice(0, aq.length - 8); });
  G.on('banner', (b) => {
    bq.push(b); if (bq.length > 10) bq.shift();
    if (!b.auto && window.CD.audio && window.CD.audio.fanfare) window.CD.audio.fanfare(true);
  });
  G.on('focus', (name) => hooks.onFocus(name));

  function showAnnounce(t) { const el = $('announce'); el.classList.remove('off'); el.innerHTML = `<div class="an">${esc(t)}</div>`; annOn = true; }
  function showBanner(b) {
    const el = $('banner'); el.classList.remove('off');
    const ic = /^https:\/\//.test(b.gift.image || '') ? `<img src="${esc(b.gift.image)}" referrerpolicy="no-referrer" alt="">` : esc(b.gift.icon || '🎻');
    const sub = b.sub || `${b.gift.name || 'Hediye'} ikram etti!${b.count > 1 ? ' ×' + b.count : ''}`;
    const line = b.total ? `${b.text} · Teşekkürler 🙏` : b.text;
    el.innerHTML = `<div class="bn${b.auto ? ' auto' : ''}"><div class="bn-ic">${ic}</div><div><div class="bn-n">${esc(b.user.nick)}</div><div class="bn-g">${esc(sub)}</div><div class="bn-t">${esc(line)}</div></div></div>`;
    banOn = true;
    return b.auto ? 2.6 : 3.6;
  }

  UI.tick = (dt) => {
    statT -= dt;
    if (statT <= 0) {
      statT = 0.2;
      $('stViewers').textContent = fmt(G.viewers); $('stLikes').textContent = fmt(G.likes);
      $('stDiamonds').textContent = fmt(G.diamonds); $('stDancers').textContent = G.users.size;
      const e = Math.round(G.energy), lv = LEVELS[G.level];
      $('energyPct').textContent = `${e}% · Hız ${G.horonSpeed.toFixed(1)}x`;
      $('energyBar').style.width = e + '%';
      $('tempoArc').style.strokeDashoffset = 263.9 * (1 - G.energy / 100); $('tempoArc').style.stroke = lv.c;
      $('tempoName').textContent = `${lv.n} (${G.horonSpeed.toFixed(1)}x)`;
      const A = window.CD.audio;
      $('trackInfo').textContent = A.tulumMode
        ? '🎶 Müzik: Karadeniz Tulumu & Kemençesi (beğeniyle hızlanıyor)'
        : '🎻 Müzik: Kodla üretilen 7/8 Karadeniz Kemençesi & Tulum';
      $('cnt').textContent = `⚡ Halka Hızı: ${G.horonSpeed.toFixed(2)}x · 💃 Horon Halkası: ${G.halay.length} · 🧀 Kuymak: ${G.knead.filter(Boolean).length}/6`;
    }
    aT -= dt;
    if (aT <= 0) { if (aq.length) { showAnnounce(aq.shift()); aT = aq.length > 2 ? 1.2 : 2.3; } else if (annOn) { $('announce').classList.add('off'); annOn = false; } }
    bT -= dt;
    if (bT <= 0) { if (bq.length) { bT = showBanner(bq.shift()); } else if (banOn) { $('banner').classList.add('off'); banOn = false; } }
  };

  const qs = new URLSearchParams(location.search);
  const A = window.CD.audio;
  UI.refreshSoundBtn = () => {
    $('btnSound').textContent = A.on ? '🔇 Sesi kapat' : '🎻 Kemençe & Tulumu başlat';
    $('btnSound').classList.toggle('gold', !A.on);
    $('btnNext').hidden = !A.music;
  };
  const toggleSound = async () => { await A.toggle(G.beat); UI.refreshSoundBtn(); };
  $('btnSound').onclick = toggleSound;
  $('btnNext').onclick = () => A.nextTrack();
  const toggleClean = () => { document.body.classList.toggle('clean'); requestAnimationFrame(UI.fit); };
  $('btnClean').onclick = toggleClean;
  $('btnFull').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); };
  if (qs.has('clean')) document.body.classList.add('clean');
  if (qs.get('demo') === '0') { $('autoDemo').checked = false; hooks.demo.on = false; }
  $('autoDemo').onchange = (e) => { hooks.demo.on = e.target.checked; };
  document.querySelectorAll('[data-demo]').forEach((b) => { b.onclick = () => hooks.demo.act(b.dataset.demo); });
  $('chatForm').onsubmit = (e) => {
    e.preventDefault();
    const n = $('chatName').value.trim() || 'Misafir', t = $('chatText').value.trim();
    if (!t) return;
    G.handle({ type: 'chat', user: { id: 'me_' + n.toLocaleLowerCase('tr'), nick: n }, text: t });
    $('chatText').value = '';
  };
  $('liveForm').onsubmit = (e) => {
    e.preventDefault();
    const st = hooks.live.status.state;
    if (st && st !== 'idle') { hooks.live.disconnect(); return; }
    const u = $('liveUser').value.trim(); if (!u) { $('liveUser').focus(); return; }
    hooks.live.connect(u);
  };
  UI.renderRuleButtons = () => {
    UI.renderChips();
    $('ruleBtns').innerHTML = G.rules.map((r, i) => `<button data-rule="${i}">${esc(r.etiket)} · ${r.jeton != null ? r.jeton : r.minJeton + '+'}</button>`).join('');
    document.querySelectorAll('[data-rule]').forEach((b) => { b.onclick = () => hooks.demo.ruleGift(+b.dataset.rule); });
  };

  const syncCharUI = () => {
    document.querySelectorAll('[data-char]').forEach((b) => {
      b.classList.toggle('gold', b.dataset.char === G.karakterModu);
    });
    if ($('viewerCharOpt')) $('viewerCharOpt').checked = G.izleyiciSecer !== false;
  };
  document.querySelectorAll('[data-char]').forEach((b) => {
    b.onclick = () => {
      const m = b.dataset.char;
      G.setKarakterAyar(m, G.izleyiciSecer);
      if (hooks.live && hooks.live.saveConfig) hooks.live.saveConfig({ karakter: m, izleyiciSecer: G.izleyiciSecer });
    };
  });
  if ($('viewerCharOpt')) {
    $('viewerCharOpt').onchange = (e) => {
      const val = e.target.checked;
      G.setKarakterAyar(G.karakterModu, val);
      if (hooks.live && hooks.live.saveConfig) hooks.live.saveConfig({ karakter: G.karakterModu, izleyiciSecer: val });
    };
  }
  G.on('karakterAyar', syncCharUI);
  syncCharUI();

  const PILL = { idle: ['DEMO', ''], connecting: ['BAĞLANIYOR…', 'wait'], waiting: ['YAYIN BEKLENİYOR', 'wait'], live: ['CANLI', 'live'], error: ['BAĞLANTI HATASI', 'err'] };
  UI.setLive = (st) => {
    const [txt, cls] = PILL[st.state] || PILL.idle;
    $('statusPill').className = 'pill ' + cls;
    $('statusText').textContent = st.state === 'live' ? `CANLI · @${st.username}` : txt;
    $('liveMsg').textContent = st.message || '';
    const active = st.state !== 'idle';
    $('liveBtn').textContent = active ? 'Kes' : 'Bağlan'; $('liveBtn').classList.toggle('stop', active); $('liveUser').disabled = active;
  };

  renderBoard();
  UI.fit();
  return UI;
}
