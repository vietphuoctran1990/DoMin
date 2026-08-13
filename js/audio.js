/* ============================================================
   CHIẾN SĨ DÒ MÌN - Âm thanh
   Toàn bộ âm thanh được tổng hợp bằng Web Audio API
   (không cần tải file mp3 nào) + giọng đọc tiếng Việt.
   ============================================================ */
(function (global) {
  'use strict';

  const NOTE = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
    C6: 1046.50, E6: 1318.51, G6: 1567.98,
    C3: 130.81, E3: 164.81, G3: 196.00, A3: 220.00, F3: 174.61
  };

  const Sound = {
    ctx: null,
    master: null,
    musicGain: null,
    sfxGain: null,
    musicOn: true,
    sfxOn: true,
    voiceOn: true,
    _musicTimer: null,
    _step: 0,
    ready: false,

    init() {
      if (this.ready) return;
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.master);

      this.ready = true;
    },

    resume() {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },

    /* ---------- khối âm cơ bản ---------- */
    tone(opt) {
      if (!this.ready || !this.sfxOn) return;
      const o = Object.assign({
        freq: 440, dur: 0.18, type: 'sine', vol: 0.3,
        delay: 0, slideTo: null, dest: this.sfxGain
      }, opt);

      const t0 = this.ctx.currentTime + o.delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = o.type;
      osc.frequency.setValueAtTime(o.freq, t0);
      if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slideTo), t0 + o.dur);

      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(o.vol, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

      osc.connect(g); g.connect(o.dest);
      osc.start(t0); osc.stop(t0 + o.dur + 0.05);
    },

    noise(opt) {
      if (!this.ready || !this.sfxOn) return;
      const o = Object.assign({ dur: 0.5, vol: 0.4, delay: 0, filter: 900, sweep: true }, opt);
      const t0 = this.ctx.currentTime + o.delay;
      const len = Math.floor(this.ctx.sampleRate * o.dur);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);

      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const flt = this.ctx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(o.filter, t0);
      if (o.sweep) flt.frequency.exponentialRampToValueAtTime(120, t0 + o.dur);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(o.vol, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

      src.connect(flt); flt.connect(g); g.connect(this.sfxGain);
      src.start(t0); src.stop(t0 + o.dur);
    },

    /* ---------- hiệu ứng trong game ---------- */
    click() { this.tone({ freq: NOTE.E5, dur: 0.08, type: 'triangle', vol: 0.25 }); },

    step() {
      this.tone({ freq: 150 + Math.random() * 60, dur: 0.07, type: 'sine', vol: 0.18, slideTo: 90 });
    },

    correct() {
      const seq = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6];
      seq.forEach((f, i) => this.tone({ freq: f, dur: 0.16, type: 'triangle', vol: 0.3, delay: i * 0.08 }));
      this.tone({ freq: NOTE.E6, dur: 0.3, type: 'sine', vol: 0.22, delay: 0.34 });
    },

    wrong() {
      this.noise({ dur: 0.75, vol: 0.55, filter: 2200 });
      this.tone({ freq: 220, dur: 0.5, type: 'sawtooth', vol: 0.32, slideTo: 45 });
      this.tone({ freq: 90, dur: 0.7, type: 'sine', vol: 0.45, slideTo: 30 });
      this.tone({ freq: 380, dur: 0.25, type: 'square', vol: 0.12, slideTo: 120, delay: 0.05 });
    },

    shield() {
      this.tone({ freq: NOTE.A4, dur: 0.2, type: 'sine', vol: 0.3 });
      this.tone({ freq: NOTE.E5, dur: 0.3, type: 'sine', vol: 0.28, delay: 0.1 });
      this.tone({ freq: NOTE.A5, dur: 0.4, type: 'triangle', vol: 0.22, delay: 0.2 });
    },

    item() {
      [NOTE.G4, NOTE.C5, NOTE.E5].forEach((f, i) =>
        this.tone({ freq: f, dur: 0.14, type: 'square', vol: 0.16, delay: i * 0.06 }));
    },

    sparkle() {
      [NOTE.C6, NOTE.E6, NOTE.G6].forEach((f, i) =>
        this.tone({ freq: f, dur: 0.12, type: 'sine', vol: 0.14, delay: i * 0.05 }));
    },

    levelUp() {
      const seq = [
        [NOTE.C5, 0], [NOTE.E5, 0.12], [NOTE.G5, 0.24], [NOTE.C6, 0.36],
        [NOTE.G5, 0.5], [NOTE.C6, 0.62], [NOTE.E6, 0.78]
      ];
      seq.forEach(([f, d]) => {
        this.tone({ freq: f, dur: 0.28, type: 'triangle', vol: 0.3, delay: d });
        this.tone({ freq: f / 2, dur: 0.28, type: 'sine', vol: 0.14, delay: d });
      });
    },

    /* ---------- nhạc nền vui nhộn ---------- */
    MELODY: [
      ['C5', 1], ['E5', 1], ['G5', 1], ['E5', 1],
      ['F5', 1], ['E5', 1], ['D5', 2],
      ['C5', 1], ['E5', 1], ['G5', 1], ['A5', 1],
      ['G5', 2], ['E5', 2],
      ['F5', 1], ['A5', 1], ['G5', 1], ['E5', 1],
      ['D5', 1], ['E5', 1], ['C5', 2],
      ['G4', 1], ['C5', 1], ['E5', 1], ['D5', 1],
      ['C5', 4]
    ],
    BASS: ['C3', 'C3', 'G3', 'G3', 'F3', 'F3', 'C3', 'C3'],

    startMusic() {
      if (!this.ready || !this.musicOn || this._musicTimer) return;
      const beat = 0.30;
      let i = 0, bar = 0;

      const playNext = () => {
        if (!this.musicOn || !this.ready) { this.stopMusic(); return; }
        const [name, len] = this.MELODY[i % this.MELODY.length];
        const f = NOTE[name] || 440;
        const dur = len * beat;

        this._m(f, dur * 0.92, 'triangle', 0.30);
        this._m(f * 2, dur * 0.5, 'sine', 0.07);
        if (i % 2 === 0) {
          this._m(NOTE[this.BASS[bar % this.BASS.length]] || 130, beat * 0.8, 'sine', 0.30);
          bar++;
        }

        i++;
        this._musicTimer = setTimeout(playNext, dur * 1000);
      };
      playNext();
    },

    _m(freq, dur, type, vol) {
      if (!this.ready) return;
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(this.musicGain);
      osc.start(t0); osc.stop(t0 + dur + 0.05);
    },

    stopMusic() {
      if (this._musicTimer) clearTimeout(this._musicTimer);
      this._musicTimer = null;
    },

    toggleMusic(on) {
      this.musicOn = on;
      if (on) { this.resume(); this.startMusic(); } else this.stopMusic();
    },

    /* ---------- giọng đọc tiếng Việt ---------- */
    _voice: null,
    _voiceLoaded: false,

    loadVoice() {
      if (!global.speechSynthesis) return;
      const vs = global.speechSynthesis.getVoices();
      if (!vs || !vs.length) return;
      this._voice =
        vs.find(v => /^vi([-_]|$)/i.test(v.lang)) ||
        vs.find(v => /viet/i.test(v.name)) || null;
      this._voiceLoaded = true;
    },

    speak(text) {
      if (!this.voiceOn || !global.speechSynthesis || !text) return;
      try {
        if (!this._voiceLoaded) this.loadVoice();
        global.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(String(text));
        u.lang = 'vi-VN';
        if (this._voice) u.voice = this._voice;
        u.rate = 0.92;
        u.pitch = 1.15;
        u.volume = 1;
        global.speechSynthesis.speak(u);
      } catch (e) { /* trình duyệt không hỗ trợ - bỏ qua */ }
    },

    shutUp() {
      if (global.speechSynthesis) { try { global.speechSynthesis.cancel(); } catch (e) {} }
    }
  };

  if (global.speechSynthesis) {
    global.speechSynthesis.onvoiceschanged = () => Sound.loadVoice();
    setTimeout(() => Sound.loadVoice(), 300);
  }

  global.Sound = Sound;
})(window);
