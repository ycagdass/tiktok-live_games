// Kına Gecesi Ses Motoru (Web Audio):
// Normalde neşeli kına havası (def + zurna/kanun);
// Büyük hediyede gelin ağladığında (cryingMode = true) duygusal "Yüksek Yüksek Tepelere" türkü ezgisine döner!
(function () {
  window.CD = window.CD || {};
  const CD = window.CD;
  // Neşeli Hicaz dizisi
  const SCALE_UPBEAT = [440, 466.16, 554.37, 587.33, 659.25, 698.46, 783.99, 880, 932.33];
  const PH_UPBEAT = [
    [0, 1, 2, -1, 2, 3, 4, -1, 4, 5, 4, 3, 2, -1, 1, -1],
    [4, 4, 5, 4, 3, -1, 2, 3, 4, -1, 3, 2, 1, -1, 0, -1],
    [7, -1, 6, 5, 4, 5, 6, -1, 5, 4, 3, 4, 2, -1, -1, -1],
  ];
  // Duygusal "Yüksek Yüksek Tepelere" (Uşşak/Hüseyni hissi)
  const SCALE_SAD = [392.00, 440.00, 466.16, 523.25, 587.33, 659.25, 698.46, 783.99];
  const PH_SAD = [
    [4, -1, -1, 4, 5, -1, 4, -1, 3, -1, 2, -1, 1, -1, -1, -1],
    [3, -1, 4, -1, 3, -1, 2, -1, 1, -1, 0, -1, 1, -1, -1, -1],
  ];

  const A = CD.audio = {
    ctx: null, on: false, bpm: 96, step: 0, nextTime: 0, marks: [],
    cryingMode: false, cryingTimer: 0,
    tracks: [], ti: -1, el: null, rate: 1, music: false, beatBase: 0,
  };

  A.setCryingMode = function (flag, dur = 16) {
    this.cryingMode = !!flag;
    this.cryingTimer = flag ? dur : 0;
    if (this.on && !this.music && flag) {
      // Duygusal geçiş akoru
      this.sadChime();
    }
  };

  A.init = function () {
    const c = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = c.createGain(); this.master.gain.value = 0;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp); comp.connect(c.destination);

    const len = Math.floor(c.sampleRate * 1.9), ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.7); }
    this.rev = c.createConvolver(); this.rev.buffer = ir;
    const rg = c.createGain(); rg.gain.value = 0.28; this.rev.connect(rg); rg.connect(this.master);

    this.drum = c.createGain(); this.drum.gain.value = 0.85; this.drum.connect(this.master);
    const ds = c.createGain(); ds.gain.value = 0.3; this.drum.connect(ds); ds.connect(this.rev);
    this.reed = c.createGain(); this.reed.gain.value = 0.52; this.reed.connect(this.master); this.reed.connect(this.rev);
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
      this.startMusic();
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
    const effBpm = this.cryingMode ? 68 : this.bpm;
    while (this.nextTime < c.currentTime + 0.12) {
      this.play(this.step, this.nextTime, effBpm);
      this.marks.push({ t: this.nextTime, s: this.step, b: effBpm });
      this.nextTime += 30 / effBpm; this.step++;
    }
    while (this.marks.length > 2 && this.marks[1].t <= c.currentTime) this.marks.shift();
  };

  A.beatAt = function () {
    if (this.music) {
      const t = this.tracks[this.ti];
      if (!this.on || !this.el || this.el.paused || !t || !t.bpm) return null;
      return this.beatBase + (this.el.currentTime - t.offset) * t.bpm / 60;
    }
    if (!this.on || !this.marks.length) return null;
    const now = this.ctx.currentTime;
    let m = null;
    for (const k of this.marks) { if (k.t <= now) m = k; else break; }
    if (!m) return null;
    return m.s / 2 + (now - m.t) * m.b / 60;
  };

  A.play = function (step, t, effBpm) {
    const s8 = step % 8;
    if (this.cryingMode) {
      // Ağır duygusal ritim + ney/kemane ezgisi
      if (s8 === 0) this.dum(t, 0.65);
      else if (s8 === 4) this.tek(t, 0.35);
      const ph = PH_SAD[Math.floor(step / 16) % PH_SAD.length], i = step % 16, d = ph[i];
      if (d >= 0) {
        let len = 1; while (i + len < 16 && ph[i + len] === -1) len++;
        this.neyKemane(t, SCALE_SAD[d], len * 30 / effBpm);
      }
      return;
    }
    const lvl = CD.game ? CD.game.level : 1;
    if (s8 === 0) this.dum(t, 0.95); else if (s8 === 4) this.dum(t, 0.8);
    const tek = [0, 1, 1, 0, 0, 1, 1, 0][s8] || (lvl >= 2 && s8 === 7);
    if (tek) this.tek(t, s8 % 2 ? 0.65 : 0.85);
    const ph = PH_UPBEAT[Math.floor(step / 16) % PH_UPBEAT.length], i = step % 16, d = ph[i];
    if (d >= 0) {
      let len = 1; while (i + len < 16 && ph[i + len] === -1) len++;
      this.zurna(t, SCALE_UPBEAT[d], len * 30 / effBpm);
    }
  };

  A.dum = function (t, v) {
    const c = this.ctx;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(125, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.18);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    o.connect(g); g.connect(this.drum); o.start(t); o.stop(t + 0.46);
  };

  A.tek = function (t, v) {
    const c = this.ctx;
    const n = c.createBufferSource(), hp = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noise; hp.type = 'highpass'; hp.frequency.value = 2400;
    g.gain.setValueAtTime(0.65 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
    n.connect(hp); hp.connect(g); g.connect(this.drum); n.start(t, Math.random() * 0.4); n.stop(t + 0.075);
  };

  A.zurna = function (t, f, dur, vol = 0.15) {
    const c = this.ctx, d = Math.max(0.08, dur * 0.95);
    const o1 = c.createOscillator(), o2 = c.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'triangle';
    o1.frequency.setValueAtTime(f, t); o2.frequency.setValueAtTime(f * 1.003, t);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1350; bp.Q.value = 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.025);
    g.gain.setValueAtTime(vol, t + d - 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o1.connect(bp); o2.connect(bp); bp.connect(g); g.connect(this.reed);
    o1.start(t); o2.start(t); o1.stop(t + d + 0.04); o2.stop(t + d + 0.04);
  };

  // Duygusal "Yüksek Yüksek Tepelere" kemane / ney tınısı
  A.neyKemane = function (t, f, dur) {
    const c = this.ctx, d = Math.max(0.18, dur * 0.98);
    const o1 = c.createOscillator(), o2 = c.createOscillator();
    o1.type = 'triangle'; o2.type = 'sine';
    o1.frequency.setValueAtTime(f * 0.985, t); o1.frequency.exponentialRampToValueAtTime(f, t + 0.08);
    o2.frequency.setValueAtTime(f * 0.5, t);
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 4.6; lg.gain.value = f * 0.016;
    lfo.connect(lg); lg.connect(o1.frequency);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.09);
    g.gain.setValueAtTime(0.19, t + d - 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.reed);
    o1.start(t); o2.start(t); lfo.start(t);
    o1.stop(t + d + 0.05); o2.stop(t + d + 0.05); lfo.stop(t + d + 0.05);
  };

  A.sadChime = function () {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, t = c.currentTime + 0.02;
    [587.33, 523.25, 466.16, 440.00].forEach((f, i) => this.neyKemane(t + i * 0.22, f, 0.38));
  };

  A.fanfare = function (big) {
    if (!this.on) return;
    if (this.cryingMode) { this.sadChime(); return; }
    const c = this.ctx, t = c.currentTime + 0.03, run = [0, 2, 3, 4, 5, 6, 7];
    if (!this.music) {
      run.forEach((d, i) => this.zurna(t + i * 0.07, SCALE_UPBEAT[d], 0.08, 0.14));
      this.zurna(t + run.length * 0.07, SCALE_UPBEAT[7], big ? 0.65 : 0.38, 0.15);
    }
  };

  const RATES = [0.96, 1.0, 1.05, 1.1];
  A.loadTracks = async function () {
    try {
      const j = await (await fetch('/api/music')).json();
      this.tracks = (j.tracks || []).map((f) => ({ file: f, name: f.replace(/\.[^.]+$/, ''), url: 'muzik/' + encodeURIComponent(f), bpm: 100, offset: 0 }));
    } catch { this.tracks = []; }
    this.music = this.tracks.length > 0;
    if (this.music && this.on) this.startMusic();
    return this.music;
  };
  A.startMusic = function () {
    const c = this.ctx;
    if (!this.el) {
      this.el = new Audio();
      this.el.preload = 'auto';
      this.el.preservesPitch = true; this.el.mozPreservesPitch = true; this.el.webkitPreservesPitch = true;
      this.musicGain = c.createGain(); this.musicGain.gain.value = 0.9;
      c.createMediaElementSource(this.el).connect(this.musicGain);
      this.musicGain.connect(this.master);
      this.el.addEventListener('ended', () => this.nextTrack());
      this.el.addEventListener('error', () => setTimeout(() => this.nextTrack(), 800));
    }
    if (this.ti < 0) this.nextTrack();
    else this.el.play().catch(() => {});
  };
  A.nextTrack = function () {
    if (!this.tracks.length || !this.el) return;
    const prev = this.beatAt();
    this.ti = (this.ti + 1) % this.tracks.length;
    const t = this.tracks[this.ti];
    this.beatBase = prev != null ? Math.ceil(prev) : 0;
    this.el.src = t.url;
    this.el.playbackRate = this.rate;
    if (this.on) this.el.play().catch(() => {});
  };
  A.current = function () { return this.music && this.ti >= 0 ? this.tracks[this.ti] : null; };
  A.musicBpm = function () {
    if (this.cryingMode) return 68;
    const t = this.current();
    return t && t.bpm ? t.bpm * this.rate : 0;
  };
  A.tick = function (level, dt) {
    if (this.cryingTimer > 0) {
      this.cryingTimer -= dt;
      if (this.cryingTimer <= 0) this.cryingMode = false;
    }
    if (!this.el) return;
    const target = RATES[level] || 1;
    this.rate += (target - this.rate) * Math.min(1, dt * 0.8);
    if (Math.abs(this.el.playbackRate - this.rate) > 0.003) this.el.playbackRate = this.rate;
  };
})();
