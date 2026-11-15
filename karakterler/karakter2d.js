// 2B Canvas Karakter Modülü (canli-dugun ve diğer 2B sahneler için)
// Seçilebilir türler: 'bocek' (varsayılan), 'kedi', 'kopek', 'insan' (veya 'karisik')
// Tüm karakterler, kuyruk/kulak/anten hareketleri ve kıyafetler tamamen Canvas 2D kodlarıyla çizilir.
(function (root) {
  const TURLER = ['bocek', 'kedi', 'kopek', 'insan'];
  const TUR_ETIKET = {
    bocek:   { ad: 'Hamam Böceği', ikon: '🪳', kisa: 'Böcek' },
    kedi:    { ad: 'Kedi',         ikon: '🐱', kisa: 'Kedi' },
    kopek:   { ad: 'Köpek',        ikon: '🐶', kisa: 'Köpek' },
    insan:   { ad: 'İnsan',        ikon: '🧑', kisa: 'İnsan' },
    karisik: { ad: 'Karışık',      ikon: '🎲', kisa: 'Karışık' },
  };

  const PI = Math.PI, TAU = PI * 2;
  const RENK_SOZLUK = {
    kirmizi: '#d62828', al: '#e63946', pembe: '#ff5c8a', sari: '#f2c531', altin: '#d9a441',
    turuncu: '#f4a261', mavi: '#2e86de', acikmavi: '#7cc3ec', lacivert: '#1d3557',
    yesil: '#2a9d8f', zumrut: '#06d6a0', mor: '#9b5de5', beyaz: '#f4f1ea',
    siyah: '#222228', kahve: '#8a5a36', gri: '#8d99ae',
  };

  function turNormalize(t) {
    const s = String(t || '').trim().toLocaleLowerCase('tr')
      .replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ç/g, 'c');
    if (s === 'kedi' || s === 'cat') return 'kedi';
    if (s === 'kopek' || s === 'dog') return 'kopek';
    if (s === 'insan' || s === 'human') return 'insan';
    if (s === 'karisik' || s === 'rastgele' || s === 'random') return 'karisik';
    if (s === 'bocek' || s === 'hamambocegi' || s === 'roach') return 'bocek';
    return 'bocek';
  }

  function secilenTur(ayarKarakter, seed = 1) {
    const norm = turNormalize(ayarKarakter);
    if (norm === 'karisik') return TURLER[Math.abs(seed | 0) % TURLER.length];
    return TURLER.includes(norm) ? norm : 'bocek';
  }

  function yorumdanTur(text) {
    const raw = String(text || '').trim().toLocaleLowerCase('tr');
    const m = /(?:^|\s)!(kedi|k[öo]pek|insan|b[öo]cek|hamamb[öo]ce[ğg]i)(?:\s+([a-zçğıöşü]+))?(?:\s|$|[!.?,])/i.exec(raw);
    if (!m) return null;
    const w = m[1]
      .replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ç/g, 'c');
    let tur = 'bocek';
    if (w === 'kedi') tur = 'kedi';
    else if (w === 'kopek') tur = 'kopek';
    else if (w === 'insan') tur = 'insan';
    const rKey = (m[2] || '').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ç/g, 'c');
    return { tur, renk: RENK_SOZLUK[rKey] || null };
  }

  const ROACH_SHELLS = ['#7f3417', '#8a3a19', '#743016', '#6a2c12', '#86381a'];
  const ROACH_LIGHT  = ['#b8662f', '#c06a35', '#a65a2a', '#b56230'];
  const CAT_FUR      = ['#e08238', '#8c929c', '#f2ede4', '#2b2a30', '#c87d4b'];
  const CAT_BELLY    = ['#faeddc', '#eef0f4', '#ffffff', '#f4f1ea', '#f7e8d4'];
  const DOG_FUR      = ['#d49b54', '#8c5328', '#e2b45c', '#35312e', '#ded8ce'];
  const DOG_MASK     = ['#3b2412', '#4a260c', '#9c6b21', '#1a1817', '#6e655c'];

  function karakterYap(tur = 'bocek', renk = null, ad = 'Misafir', ops = {}) {
    const CD = root.CD || {};
    const seed = ops.seed != null ? ops.seed : (CD.hash ? CD.hash(String(ad || 'misafir')) : 1);
    const resolvedTur = secilenTur(tur, seed);
    const gender = ops.gender || (seed % 2 ? 'f' : 'm');
    const baseLook = ops.look || (CD.makeLook ? CD.makeLook(seed, gender) : {
      gender, skin: '#efc4a1', hair: '#3d2a1e', main: renk || '#e8486a', acc: '#ffd166',
      scarf: false, scarfCol: '#ffffff', long: true, shirt: '#ffffff', pants: '#22222e',
      stache: false, cap: false, capCol: '#3b3530',
    });
    const idx = Math.abs(seed) % 5;
    let bodySkin = baseLook.skin;
    let subCol = baseLook.hair;
    if (resolvedTur === 'bocek') {
      bodySkin = ROACH_LIGHT[idx % ROACH_LIGHT.length];
      subCol = ROACH_SHELLS[idx % ROACH_SHELLS.length];
    } else if (resolvedTur === 'kedi') {
      bodySkin = CAT_FUR[idx];
      subCol = CAT_BELLY[idx];
    } else if (resolvedTur === 'kopek') {
      bodySkin = DOG_FUR[idx];
      subCol = DOG_MASK[idx];
    }
    const look = {
      ...baseLook,
      tur: resolvedTur,
      seed,
      ad: ad || 'Misafir',
      main: renk || ops.main || baseLook.main,
      fur: bodySkin,
      subFur: subCol,
      skin: resolvedTur === 'insan' ? baseLook.skin : bodySkin,
    };
    return look;
  }

  function rr(c, x, y, w, h, r) {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r);
    else {
      c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r); c.closePath();
    }
  }

  // Sırt/kuyruk/kanat (gövdenin arkasında çizilir)
  function cizArkaDetay(ctx, lk, an, t = 0) {
    const tur = lk.tur || 'bocek';
    const beatOsc = Math.sin(t * 7 + (lk.seed || 0));
    if (tur === 'bocek') {
      // Hamam böceği parlak kitin sırt kabuğu / kanatları + orta bacaklar
      ctx.save();
      ctx.fillStyle = lk.subFur || '#7f3417';
      ctx.beginPath();
      ctx.ellipse(-3.5, -23, 8.5, 16, 0.1, 0, TAU);
      ctx.ellipse(3.5, -23, 8.5, 16, -0.1, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,210,160,.28)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Orta böcek bacakları (yanlardan kıpırdayan 2 çift ek bacak)
      ctx.strokeStyle = lk.fur || '#b8662f';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      for (const s of [-1, 1]) {
        const w = Math.sin(t * 8 + s) * 2.2;
        ctx.beginPath();
        ctx.moveTo(s * 8, -24);
        ctx.lineTo(s * 15, -22 + w);
        ctx.lineTo(s * 18, -13 + w);
        ctx.stroke();
      }
      ctx.restore();
    } else if (tur === 'kedi') {
      // Kedi S-kıvrımlı sallanan kuyruk
      const sw = Math.sin(t * 5.5 + (lk.seed || 0)) * 7;
      ctx.save();
      ctx.strokeStyle = lk.fur || '#e08238';
      ctx.lineWidth = 4.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.bezierCurveTo(12 + sw * 0.4, -14, 18 + sw, -28, 13 + sw * 1.2, -39);
      ctx.stroke();
      ctx.fillStyle = lk.subFur || '#faeddc';
      ctx.beginPath();
      ctx.arc(13 + sw * 1.2, -39, 2.5, 0, TAU);
      ctx.fill();
      ctx.restore();
    } else if (tur === 'kopek') {
      // Köpek neşeyle hızlı sallanan kuyruk
      const wag = Math.sin(t * 11 + (lk.seed || 0)) * 9;
      ctx.save();
      ctx.strokeStyle = lk.fur || '#d49b54';
      ctx.lineWidth = 5.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.quadraticCurveTo(12 + wag * 0.6, -21, 15 + wag, -33);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Türlere göre kafa çizimi (böcek, kedi, köpek, insan)
  function cizKafa(ctx, lk, an, o = {}) {
    const tur = lk.tur || 'bocek';
    const t = o.t || (window.CD && window.CD.game ? window.CD.game.time : 0);
    const circ = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
    const ell = (x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fill(); };

    if (tur === 'bocek') {
      // Boyun + kitin kalkan (pronotum)
      ctx.fillStyle = lk.fur || '#b8662f';
      rr(ctx, -2.6, -41.5, 5.2, 4.5, 1); ctx.fill();
      ctx.fillStyle = lk.subFur || '#7f3417';
      ell(0, -49, 13.8, 7.5);
      // Kafa
      ctx.fillStyle = lk.subFur || '#7f3417';
      circ(0, -51, 12.2);
      ctx.fillStyle = lk.fur || '#b8662f';
      ell(0, -45.5, 7.5, 4.5);
      // Uzun kıvrımlı antenler (ritimle sallanır)
      ctx.strokeStyle = '#2a1208';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      for (const s of [-1, 1]) {
        const aw = Math.sin(t * 4.5 + s * 1.5 + (lk.seed || 0)) * 4;
        ctx.beginPath();
        ctx.moveTo(s * 4, -61);
        ctx.bezierCurveTo(s * 10, -73, s * (18 + aw), -78, s * (24 + aw * 1.3), -70 + aw * 0.5);
        ctx.stroke();
      }
      // İri parlak böcek gözleri
      for (const s of [-1, 1]) {
        ctx.fillStyle = '#fffaf0';
        circ(s * 5.2, -51.5, 4.2);
        if (an.blink) {
          ctx.fillStyle = lk.subFur || '#7f3417';
          ctx.fillRect(s * 5.2 - 4.2, -53, 8.4, 3);
        } else {
          ctx.fillStyle = '#0a0604';
          circ(s * 4.8, -51.2, 2.3);
          ctx.fillStyle = '#ffffff';
          circ(s * 4.8 - 0.9, -52.1, 0.85);
        }
      }
      // Kıskaç / ağız parçaları
      ctx.fillStyle = '#2a1208';
      ell(-2.5, -43.2, 1.8, 2.6, 0.3);
      ell(2.5, -43.2, 1.8, 2.6, -0.3);
      if (lk.gender === 'f') {
        // Başta kırmızı çiçek
        ctx.fillStyle = '#d62839';
        circ(8.5, -60.5, 3.6);
        ctx.fillStyle = '#ffd23f';
        circ(8.5, -60.5, 1.4);
      } else if (lk.cap) {
        ctx.fillStyle = lk.capCol || '#3b3530';
        ctx.beginPath(); ctx.arc(0, -56, 12.5, PI, TAU); ctx.fill();
      }
      return;
    }

    if (tur === 'kedi') {
      const fur = lk.fur || '#e08238', sub = lk.subFur || '#faeddc';
      ctx.fillStyle = fur;
      rr(ctx, -2.6, -41.5, 5.2, 4.5, 1); ctx.fill();
      // Dik üçgen kedi kulakları (kulak kırpma hareketiyle)
      for (const s of [-1, 1]) {
        const tw = Math.sin(t * 5 + (s > 0 ? 1.2 : 0) + (lk.seed || 0)) * 1.4;
        ctx.fillStyle = fur;
        ctx.beginPath();
        ctx.moveTo(s * 4.5, -60);
        ctx.lineTo(s * (12.5 + tw), -71);
        ctx.lineTo(s * 12, -54);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f294a5';
        ctx.beginPath();
        ctx.moveTo(s * 6, -59.5);
        ctx.lineTo(s * (11 + tw * 0.8), -68);
        ctx.lineTo(s * 10.8, -55.5);
        ctx.closePath();
        ctx.fill();
      }
      // Yuvarlak kedi kafası + alın çizgileri
      ctx.fillStyle = fur;
      circ(0, -51, 12.6);
      ctx.fillStyle = 'rgba(40,20,5,.25)';
      ctx.fillRect(-1, -62, 2, 5);
      ctx.fillRect(-4.5, -61, 1.6, 4);
      ctx.fillRect(2.9, -61, 1.6, 4);
      // Yanak pofudukları
      ctx.fillStyle = sub;
      ell(-3.6, -46.2, 4.5, 3.2);
      ell(3.6, -46.2, 4.5, 3.2);
      // Kedi gözleri
      for (const s of [-1, 1]) {
        if (an.blink) {
          ctx.fillStyle = '#2a1a14';
          ctx.fillRect(s * 4.6 - 2, -51.5, 4, 1);
        } else {
          ctx.fillStyle = '#7ae582';
          circ(s * 4.8, -51.2, 2.7);
          ctx.fillStyle = '#100c08';
          ell(s * 4.8, -51.2, 1.0, 2.3);
          ctx.fillStyle = '#fff';
          circ(s * 4.4, -52.0, 0.7);
        }
      }
      // Pembe üçgen burun + ağız
      ctx.fillStyle = '#f2849e';
      ctx.beginPath();
      ctx.moveTo(-2.2, -48.2); ctx.lineTo(2.2, -48.2); ctx.lineTo(0, -45.8);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#5a3228'; ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(-2, -45.2, 2, 0, PI * 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(2, -45.2, 2, PI * 0.15, PI);
      ctx.stroke();
      // Bıyıklar
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 0.9;
      for (const s of [-1, 1]) {
        for (let w = -1; w <= 1; w++) {
          ctx.beginPath();
          ctx.moveTo(s * 6, -46.5 + w * 1.4);
          ctx.lineTo(s * 15.5, -47 + w * 2.4);
          ctx.stroke();
        }
      }
      if (lk.gender === 'f') {
        ctx.fillStyle = '#ff5c8a'; circ(7.5, -61, 3.2);
        ctx.fillStyle = '#fff3b0'; circ(7.5, -61, 1.2);
      }
      return;
    }

    if (tur === 'kopek') {
      const fur = lk.fur || '#d49b54', mask = lk.subFur || '#3b2412';
      ctx.fillStyle = fur;
      rr(ctx, -2.8, -41.5, 5.6, 4.5, 1); ctx.fill();
      // Sarkık zıplayan köpek kulakları
      const bounce = Math.abs(Math.sin(t * 7 + (lk.seed || 0))) * 2.8;
      ctx.fillStyle = mask;
      for (const s of [-1, 1]) {
        ell(s * 12.2, -50 - bounce * 0.6, 4.2, 8.5, s * (0.22 + bounce * 0.04));
      }
      // Köpek kafası
      ctx.fillStyle = fur;
      circ(0, -51, 12.6);
      // Ağızlık (snout) + siyah parlak burun + neşeli pembe dil
      ctx.fillStyle = mask;
      ell(0, -46.2, 6.8, 4.6);
      ctx.fillStyle = '#faeddc';
      ell(0, -44.8, 5.2, 3.0);
      // Pembe dil
      ctx.fillStyle = '#ff5c8a';
      ell(0, -42.2, 2.3, 3.0);
      // Burun
      ctx.fillStyle = '#181311';
      ell(0, -47.8, 3.2, 2.2);
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      circ(-1.0, -48.4, 0.8);
      // Gözler + kaş benekleri
      for (const s of [-1, 1]) {
        ctx.fillStyle = '#faeddc';
        ell(s * 4.5, -55.5, 2.0, 1.1, -s * 0.2);
        if (an.blink) {
          ctx.fillStyle = '#2a1a14';
          ctx.fillRect(s * 4.6 - 2, -52, 4, 1);
        } else {
          ctx.fillStyle = '#21130b';
          circ(s * 4.6, -51.8, 2.2);
          ctx.fillStyle = '#fff';
          circ(s * 4.2, -52.4, 0.7);
        }
      }
      if (lk.cap) {
        ctx.fillStyle = lk.capCol || '#3b3530';
        ctx.beginPath(); ctx.arc(0, -56, 12.2, PI, TAU); ctx.fill();
      }
      return;
    }

    // 'insan' — sade, stilize figür
    ctx.fillStyle = lk.skin; rr(ctx, -2.6, -41.5, 5.2, 4.5, 1); ctx.fill();
    circ(0, -51, 12.5);
    if (lk.gender === 'f') {
      if (lk.scarf) {
        ctx.fillStyle = lk.scarfCol;
        ctx.beginPath(); ctx.arc(0, -51.5, 14.6, PI * 0.86, PI * 2.14);
        ctx.bezierCurveTo(9, -59, -9, -59, -13.2, -45.2); ctx.fill();
        ctx.fillStyle = lk.acc;
        for (let i = 1; i < 8; i++) {
          const u = i / 8, mt = 1 - u;
          const bx = mt * mt * mt * 13.2 + 3 * mt * mt * u * 9 + 3 * mt * u * u * -9 + u * u * u * -13.2;
          const by = mt * mt * mt * -45.2 + 3 * mt * mt * u * -59 + 3 * mt * u * u * -59 + u * u * u * -45.2;
          circ(bx, by, 1.15);
        }
      } else {
        ctx.fillStyle = lk.hair;
        ctx.beginPath(); ctx.arc(0, -51, 13.4, PI * 0.92, PI * 2.08);
        ctx.bezierCurveTo(9, -57, -5, -61, -12.7, -47.7); ctx.fill();
      }
    } else {
      ctx.fillStyle = lk.hair;
      ctx.beginPath(); ctx.arc(0, -51, 13.2, PI, TAU); ctx.bezierCurveTo(9, -57, -9, -57, -13.2, -51); ctx.fill();
      ctx.fillRect(-13, -52, 2.4, 5); ctx.fillRect(10.6, -52, 2.4, 5);
      if (lk.cap) {
        ctx.fillStyle = lk.capCol; ctx.beginPath(); ctx.arc(0, -54, 13.8, PI, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ell(4, -54, 13.5, 3);
      }
    }
    ctx.fillStyle = '#2a1a14';
    if (an.blink) { ctx.fillRect(-6, -51, 3.4, 0.9); ctx.fillRect(2.6, -51, 3.4, 0.9); }
    else { circ(-4.3, -50.5, 1.75); circ(4.3, -50.5, 1.75); ctx.fillStyle = 'rgba(255,255,255,.8)'; circ(-3.8, -51.1, 0.55); circ(4.8, -51.1, 0.55); }
    if (o.puff) { ctx.fillStyle = lk.skin; circ(-7, -46.5, 4.2); circ(7, -46.5, 4.2); }
    ctx.fillStyle = 'rgba(255,110,130,.33)'; circ(-7.4, -46.5, 2.5); circ(7.4, -46.5, 2.5);
    if (lk.stache) {
      ctx.fillStyle = lk.hair; ell(-2.6, -45.6, 3.1, 1.5, 0.25); ell(2.6, -45.6, 3.1, 1.5, -0.25);
    } else {
      ctx.strokeStyle = o.lips || '#8a3b2c'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(0, -46.5, 3.2, 0.15 * PI, 0.85 * PI); ctx.stroke();
    }
  }

  const api = {
    TURLER,
    TUR_ETIKET,
    turNormalize,
    secilenTur,
    yorumdanTur,
    karakterYap,
    cizArkaDetay,
    cizKafa,
  };

  root.CD = root.CD || {};
  root.CD.karakterler = api;
})(typeof window !== 'undefined' ? window : globalThis);
