// Kına Gecesi Demo Modu: yayın açmadan sahte izleyicilerle test
const F = ['Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Emine', 'Hatice', 'Merve', 'Büşra', 'Esra', 'Derya', 'Ebru', 'Tuba', 'Şirin', 'Gizem', 'Sevgi', 'Hülya', 'Gül', 'Selin', 'Dilan', 'Rojda', 'Berfin', 'Hazal', 'Kübra', 'Songül'];
const M = ['Mehmet', 'Ahmet', 'Mustafa', 'Ali', 'Hüseyin', 'Hasan', 'İbrahim', 'Murat', 'Emre', 'Yusuf', 'Ömer', 'Burak', 'Serkan', 'Oğuz', 'Furkan', 'Kemal', 'Cem', 'Barış'];
const CH = ['Gelin hanım çok güzel maşallah 👰', 'Kınayı getir aney 🕯️', 'Yüksek yüksek tepelere ev kurmasınlar 😭', 'Gelin ağlamasın!', 'Eline kına yakalım', 'Halaya katıl', 'Kına gecemiz mübarek olsun', '!kedi', '!köpek', '!insan', '!böcek', 'Altınlar takılsın 🪙', 'Mutluluklar dileriz 💕'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rand = (a, b) => a + Math.random() * (b - a);

export function createDemo(G) {
  const D = { on: true, paused: false, pool: [], t: 0, next: 0.3, vt: 0 };
  const used = new Set();
  for (let i = 0; i < 80; i++) {
    let nm = pick(Math.random() < 0.7 ? F : M);
    if (used.has(nm)) nm += pick([' K.', ' Y.', ' D.', ' A.', '_' + Math.floor(rand(10, 99))]);
    if (used.has(nm)) continue;
    used.add(nm); D.pool.push({ id: 'demo_' + i, nick: nm });
  }
  const absent = () => { const a = D.pool.filter((u) => !G.users.has(u.id)); return a.length ? pick(a) : pick(D.pool); };
  const present = () => { const a = [...G.users.values()].filter((u) => !u.npc); if (!a.length) return absent(); const u = pick(a); return { id: u.id, nick: u.nick }; };

  D.ruleGift = (i, user) => {
    const r = G.rules[i]; if (!r) return;
    const dia = r.jeton != null ? r.jeton : r.minJeton;
    G.handle({ type: 'gift', user: user || present(), gift: { name: (r.ad && r.ad[0]) || r.etiket, id: (r.id && r.id[0]) || '', diamonds: dia, count: 1, icon: r.ikon || '🕯️' } });
  };
  D.act = (k) => {
    if (k === 'join') for (let i = 0; i < 5; i++) setTimeout(() => G.handle({ type: 'join', user: absent() }), i * 250);
    else if (k === 'chat') G.handle({ type: 'chat', user: present(), text: pick(CH) });
    else if (k === 'halay') for (let i = 0; i < 3; i++) setTimeout(() => G.handle({ type: 'chat', user: present(), text: 'Halaya katıl' }), i * 300);
    else if (k === 'likes') for (let i = 0; i < 10; i++) setTimeout(() => G.handle({ type: 'like', user: present(), count: 6 }), i * 90);
    else if (k === 'ikram') D.ruleGift(0);
    else if (k === 'reset') { G.reset(); document.getElementById('feed').innerHTML = ''; }
  };
  D.tick = (dt) => {
    if (!D.on || D.paused) return;
    D.vt -= dt;
    if (D.vt <= 0) { D.vt = 3; G.handle({ type: 'viewer', count: Math.round(G.users.size * 4 + rand(15, 45)) }); }
    D.t += dt; if (D.t < D.next) return; D.t = 0;
    const n = G.users.size;
    D.next = n < 28 ? rand(0.18, 0.38) : rand(0.4, 1.05);
    const r = Math.random();
    if (n < 22 || (r < 0.14 && n < 65)) return G.handle({ type: 'chat', user: absent(), text: pick(['Kınaya geldik! 🕯️', 'Maşallah geline 👰', 'Halaya katıl']) });
    if (r < 0.45) return G.handle({ type: 'chat', user: present(), text: pick(CH) });
    if (r < 0.58 && G.halay.length < 45) return G.handle({ type: 'chat', user: present(), text: 'Halaya katıl' });
    if (r < 0.78) return G.handle({ type: 'like', user: present(), count: Math.ceil(rand(1, 12)) });
    if (r < 0.9) return D.ruleGift(0);
    if (r < 0.985) return D.ruleGift(Math.floor(rand(1, G.rules.length - 1)));
    D.ruleGift(G.rules.length - 1);
  };
  return D;
}
