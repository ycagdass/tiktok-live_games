// Karadeniz Kemençe & Tulum Ses Motoru (Web Audio):
//   • Kodla üretilen kıvrak 7/8 Karadeniz Kemençesi (çift tel dörtlü aralık + yay tremolosu)
//   • Tulum (pes dem sesi + tiz ezgi) ve Horon ritmi
//   • Beğeni arttıkça tempo (BPM) ve horon coşkusu hızlanır!
(function () {
  window.CD = window.CD || {};
  const CD = window.CD;
  // Karadeniz Kemençe dizisi (tiz, kıvrak)
  const SCALE = [587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50, 1174.66];
  // 14 adımlık (7/8 Karadeniz aksak ritmi: 2+2+3) kemençe motifleri
  const PH = [
    [4, 4, 3, 4, 5, 4, 3, 2, 3, 4, 2, 1, 0, -1],
    [5, 6, 5, 4, 3, 4, 5, 4, 3, 2, 1, 2, 0, -1],
    [3, 3, 4, 3, 2, 1, 2, 3, 2, 1, 0, 1, 0, -1],
    [6, 5, 4, 5, 6, 4, 3, 4, 3, 2, 1, 2, 0, -1],
  ];
  const SONG = [0, 1, 2, 3, 0, 2];

  const A = CD.audio = {
    ctx: null, on: false, bpm: 118, step: 0, nextTime: 0, marks: [],
    tulumMode: false,
    tracks: [], ti: -1, el: null, rate: 1, music: false, beatBase: 0,
  };

  A.init = function () {
    const c = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = c.createGain(); this.master.gain.value = 0;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp); comp.connect(c.destination);

    const len = Math.floor(c.sampleRate * 1.4), ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    this.rev = c.createConvolver(); this.rev.buffer = ir;
    const rg = c.createGain(); rg.gain.value = 0.2; this.rev.connect(rg); rg.connect(this.master);

    this.drum = c.createGain(); this.drum.gain.value = 0.85; this.drum.connect(this.master);
    this.reed = c.createGain(); this.reed.gain.value = 0.55; this.reed.connect(this.master); this.reed.connect(this.rev);
    this.fx = c.createGain(); this.fx.gain.value = 0.6; this.fx.connect(this.master); this.fx.connect(this.rev);

    const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noise = nb;
    setInterval(() => this.schedule(), 25);
  };

  A.toggle = async function (beatNow) {
    if (!this.ctx) this.init();
    const c = this.ctx;
    if (this.music) {
      if (this.on) { this.on = false; this.master.gain.setTargetAtTime(0, c.currentTime, 0.08); if (this.el) this.el.pause(); return false; }
      await c.resume();
      this.on = true; this.master.gain.setTargetAtTime(0.85, c.currentTime, 0.05);
      return true;
    }
    if (this.on) { this.on = false; this.marks = []; this.master.gain.setTargetAtTime(0, c.currentTime, 0.08); return false; }
    await c.resume();
    this.step = Math.ceil(beatNow * 2);
    let wait = (this.step / 2 - beatNow) * 60 / this.bpm;
    if (wait < 0.03) { this.step++; wait += 30 / this.bpm; }
    this.nextTime = c.currentTime + wait;
    this.marks = []; this.on = true;
    this.master.gain.setTargetAtTime(0.85, c.currentTime, 0.05);
    return true;
  };

  A.schedule = function () {
    if (!this.on || this.music) return;
    const c = this.ctx;
    while (this.nextTime < c.currentTime + 0.12) {
      this.play(this.step, this.nextTime);
      this.marks.push({ t: this.nextTime, s: this.step, b: this.bpm });
      this.nextTime += 24 / this.bpm; // kıvrak Karadeniz horon adımı
      this.step++;
    }
    while (this.marks.length > 2 && this.marks[1].t <= c.currentTime) this.marks.shift();
  };

  A.beatAt = function () {
    if (!this.on || !this.marks.length) return null;
    const now = this.ctx.currentTime;
    let m = null;
    for (const k of this.marks) { if (k.t <= now) m = k; else break; }
    if (!m) return null;
    return m.s / 2 + (now - m.t) * m.b / 60;
  };

  // 7/8 Karadeniz ritmi (0, 2, 4 vurguları) + Kemençe çift tel + Tulum dem
  A.play = function (step, t) {
    const s7 = step % 7;
    if (s7 === 0) this.dum(t, 0.95);
    else if (s7 === 2 || s7 === 4) this.dum(t, 0.72);
    if (s7 === 1 || s7 === 3 || s7 === 5 || s7 === 6) this.tek(t, s7 === 6 ? 0.85 : 0.55);

    const ph = PH[SONG[Math.floor(step / 14) % SONG.length]], i = step % 14, d = ph[i];
    const dur = 24 / this.bpm;
    if (d >= 0) {
      this.kemence(t, SCALE[d], dur);
      if (this.tulumMode || (step % 28 >= 14)) {
        this.tulum(t, SCALE[d] * 0.5, dur * 1.1);
      }
    }
  };

  A.dum = function (t, v) {
    const c = this.ctx;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(135, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.14);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    o.connect(g); g.connect(this.drum); o.start(t); o.stop(t + 0.35);
  };

  A.tek = function (t, v) {
    const c = this.ctx;
    const n = c.createBufferSource(), hp = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noise; hp.type = 'highpass'; hp.frequency.value = 2600;
    g.gain.setValueAtTime(0.55 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    n.connect(hp); hp.connect(g); g.connect(this.drum); n.start(t, Math.random() * 0.4); n.stop(t + 0.06);
  };

  // Karadeniz Kemençesi: paralel dörtlü çift tel + hızlı yay sürtünmesi
  A.kemence = function (t, f, dur, vol = 0.16) {
    const c = this.ctx, d = Math.max(0.06, dur * 0.92);
    const o1 = c.createOscillator(), o2 = c.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'sawtooth';
    o1.frequency.setValueAtTime(f, t);
    o2.frequency.setValueAtTime(f * 0.749, t); // alt dörtlü tel (dem teli)
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 7.5; lg.gain.value = f * 0.015;
    lfo.connect(lg); lg.connect(o1.frequency);

    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1850; bp.Q.value = 1.1;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.setValueAtTime(vol * 0.85, t + d - 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    const g2 = c.createGain(); g2.gain.value = 0.42;
    o1.connect(bp); o2.connect(g2); g2.connect(bp); bp.connect(g); g.connect(this.reed);
    o1.start(t); o2.start(t); lfo.start(t);
    o1.stop(t + d + 0.03); o2.stop(t + d + 0.03); lfo.stop(t + d + 0.03);
  };

  // Karadeniz Tulumu: genizsi nav + dem sesi
  A.tulum = function (t, f, dur, vol = 0.11) {
    const c = this.ctx, d = Math.max(0.08, dur);
    const o1 = c.createOscillator(), drone = c.createOscillator();
    o1.type = 'square'; drone.type = 'sawtooth';
    o1.frequency.setValueAtTime(f, t);
    drone.frequency.setValueAtTime(293.66, t); // Re dem
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 1.4;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    const dg = c.createGain(); dg.gain.value = 0.35;
    o1.connect(bp); drone.connect(dg); dg.connect(bp); bp.connect(g); g.connect(this.reed);
    o1.start(t); drone.start(t);
    o1.stop(t + d + 0.03); drone.stop(t + d + 0.03);
  };

  A.fanfare = function (big) {
    if (!this.on) return;
    const c = this.ctx, t = c.currentTime + 0.02;
    [3, 4, 5, 6, 7].forEach((d, i) => this.kemence(t + i * 0.055, SCALE[d], 0.07, 0.18));
    if (big) this.tulum(t, SCALE[4] * 0.5, 0.6, 0.15);
  };

  A.loadTracks = async function () {
    try {
      const files = await fetch('/api/music').then((r) => r.json());
      this.tracks = files.map((url) => ({ url, name: decodeURIComponent(url.split('/').pop()).replace(/\.[^.]+$/, ''), bpm: 130, offset: 0 }));
      this.music = this.tracks.length > 0;
    } catch { this.music = false; }
    return this.music;
  };
  A.current = function () { return this.tracks[this.ti] || null; };
  A.musicBpm = function () { return 0; };
  A.tick = function () {};
  A.nextTrack = function () {};
})();
