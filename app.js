'use strict';
/* Fresh Beatz – pocket chord synth & looper (Web Audio, no dependencies) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------------------------------------------------------------- constants */
  const NOTES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const MAJ = [0, 2, 4, 5, 7, 9, 11];
  const MIN = [0, 2, 3, 5, 7, 8, 10];
  const DEF = [0, 3, 4, 5];        // I IV V vi   (i iv v VI in minor)
  const ALT = [1, 2, 6, 7];        // ii iii vii I'
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const ARP_LABEL = ['', '↑', '↓', '↕', 'RND'];
  const LOOKAHEAD = 0.12;          // seconds scheduled ahead
  const TICK_MS = 25;
  const COUNT_IN = 4;              // beats

  /* ---------------------------------------------------------------- i18n */
  const I18N = {
    en: {
      key: 'Key', sound: 'Sound', tempo: 'Tempo & Loop', settings: 'Settings',
      major: 'Major', minor: 'Minor', tone: 'Tone', reverb: 'Reverb', volume: 'Volume',
      bpm: 'BPM', tap: 'Tap', arp: 'Arpeggio', off: 'Off', rate: 'Rate', loop: 'Loop length',
      bars: 'bars', metro: 'Metronome', quant: 'Quantize', countin: 'Count-in',
      language: 'Language', theme: 'Theme', light: 'Light', dark: 'Dark',
      rec_audio: 'Record audio', stop_save: 'Stop & save', install: 'Install app',
      ios_hint: 'iPhone / iPad: Share → Add to Home Screen.',
      cleared: 'LOOP CLEARED', undone: 'LAYER REMOVED', nothing: 'NOTHING TO UNDO',
      len_locked: 'CLEAR LOOP FIRST', no_rec: 'NOT SUPPORTED', saved: 'SAVED',
      rec: 'REC', play: 'Play / stop loop', undo: 'Undo last layer', clear: 'Clear loop',
      shortcuts: 'Keys: A S D F chords · Z X C modifiers · Space play · R record',
      tip_hold: 'Modifiers: tap = latch, hold = momentary'
    },
    de: {
      key: 'Tonart', sound: 'Klang', tempo: 'Tempo & Loop', settings: 'Einstellungen',
      major: 'Dur', minor: 'Moll', tone: 'Helligkeit', reverb: 'Hall', volume: 'Lautstärke',
      bpm: 'BPM', tap: 'Tap', arp: 'Arpeggio', off: 'Aus', rate: 'Rate', loop: 'Loop-Länge',
      bars: 'Takte', metro: 'Metronom', quant: 'Quantisierung', countin: 'Vorzähler',
      language: 'Sprache', theme: 'Design', light: 'Hell', dark: 'Dunkel',
      rec_audio: 'Audio aufnehmen', stop_save: 'Stopp & speichern', install: 'App installieren',
      ios_hint: 'iPhone / iPad: Teilen → Zum Home-Bildschirm.',
      cleared: 'LOOP GELÖSCHT', undone: 'EBENE ENTFERNT', nothing: 'NICHTS ZU TUN',
      len_locked: 'ERST LOOP LEEREN', no_rec: 'NICHT UNTERSTÜTZT', saved: 'GESPEICHERT',
      rec: 'REC', play: 'Loop abspielen / stoppen', undo: 'Letzte Ebene entfernen', clear: 'Loop leeren',
      shortcuts: 'Tasten: A S D F Akkorde · Z X C Modifier · Leertaste Play · R Aufnahme',
      tip_hold: 'Modifier: Tippen = einrasten, Halten = momentan'
    }
  };

  /* ---------------------------------------------------------------- sound presets */
  const PRESETS = [
    { name: 'Pad',
      oscs: [{ t: 'sawtooth', d: -8, m: 1, g: .35 }, { t: 'sawtooth', d: 8, m: 1, g: .35 }, { t: 'triangle', d: 0, m: .5, g: .5 }],
      a: .25, d: 1.4, s: .75, r: .9, f: 900, fk: 2, fe: .8, fd: 1.2, q: .6, gain: .28 },
    { name: 'Keys',
      oscs: [{ t: 'sine', d: 0, m: 1, g: .7 }, { t: 'triangle', d: 3, m: 2, g: .25 }, { t: 'sine', d: 0, m: 4, g: .08 }],
      a: .004, d: .9, s: .3, r: .4, f: 3500, fk: 3, fe: .5, fd: .4, q: .4, gain: .32 },
    { name: 'Pluck',
      oscs: [{ t: 'sawtooth', d: -5, m: 1, g: .4 }, { t: 'square', d: 5, m: 1, g: .25 }],
      a: .002, d: .28, s: .04, r: .18, f: 500, fk: 2, fe: 5, fd: .12, q: 2, gain: .3 },
    { name: 'Organ',
      oscs: [{ t: 'sine', d: 0, m: 1, g: .5 }, { t: 'sine', d: 0, m: 2, g: .4 }, { t: 'sine', d: 0, m: 3, g: .2 }, { t: 'sine', d: 0, m: 4, g: .12 }],
      a: .012, d: .1, s: 1, r: .1, f: 6000, fk: 0, fe: 0, fd: .1, q: .3, gain: .3 },
    { name: 'Glass',
      oscs: [{ t: 'sine', d: 0, m: 1, g: .6 }, { t: 'sine', d: 0, m: 2.76, g: .18 }, { t: 'sine', d: 0, m: 5.4, g: .07 }],
      a: .002, d: 1.8, s: 0, r: .7, f: 9000, fk: 0, fe: 0, fd: 1, q: .3, gain: .35 },
    { name: 'Chip',
      oscs: [{ t: 'square', d: 0, m: 1, g: .3 }, { t: 'square', d: 0, m: 2, g: .12 }],
      a: .002, d: .1, s: .55, r: .06, f: 7000, fk: 0, fe: 0, fd: .1, q: .3, gain: .22 }
  ];

  /* ---------------------------------------------------------------- state */
  const S = {
    lang: null, theme: null,
    key: 0, minor: false, preset: 0, bpm: 100, arp: 0, arpRate: .25, bars: 2,
    metro: false, quant: true, countIn: true, vol: .8, tone: .8, reverb: .25,
    mods: { seventh: false, sus: false, alt: false },
    panel: null, playing: false, rec: false, loopStart: 0, countStart: 0, layer: 0, events: [],
    msg: '', msgUntil: 0, chord: '', chordUntil: 0, exporting: false
  };
  const PERSIST = ['lang', 'theme', 'key', 'minor', 'preset', 'bpm', 'arp', 'arpRate', 'bars', 'metro', 'quant', 'countIn', 'vol', 'tone', 'reverb'];
  let saveTimer = 0;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { const o = {}; PERSIST.forEach(k => { if (S[k] !== null) o[k] = S[k]; }); localStorage.setItem('fresh-beatz', JSON.stringify(o)); } catch (e) { /* private mode */ }
    }, 300);
  }
  function load() {
    try {
      const j = JSON.parse(localStorage.getItem('fresh-beatz') || '{}');
      PERSIST.forEach(k => { if (j[k] !== undefined) S[k] = j[k]; });
    } catch (e) { /* ignore */ }
    if (!S.lang) S.lang = (navigator.language || 'en').toLowerCase().startsWith('de') ? 'de' : 'en';
    S.preset = Math.min(Math.max(+S.preset || 0, 0), PRESETS.length - 1);
  }
  const t = k => (I18N[S.lang] && I18N[S.lang][k]) || I18N.en[k] || k;
  const spb = () => 60 / S.bpm;
  const loopBeats = () => S.bars * 4;
  const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
  const msg = (text, ms = 1200) => { S.msg = text; S.msgUntil = performance.now() + ms; };
  const effTheme = () => S.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  /* ---------------------------------------------------------------- audio engine */
  let ctx = null, bus, toneF, dryG, wetG, conv, comp, volG, clickG, recDest;
  const voices = new Set();
  let lastWin = 0;

  function initAudio() {
    if (ctx) { if (ctx.state !== 'running') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { msg('NO AUDIO', 3000); return; }
    try { navigator.audioSession && (navigator.audioSession.type = 'playback'); } catch (e) { /* iOS 17+ only */ }
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { ctx = new AC(); }

    bus = ctx.createGain();
    toneF = ctx.createBiquadFilter(); toneF.type = 'lowpass'; toneF.Q.value = .5;
    dryG = ctx.createGain();
    wetG = ctx.createGain();
    conv = ctx.createConvolver(); conv.buffer = makeIR(1.7, 3);
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = .004; comp.release.value = .2;
    volG = ctx.createGain();
    clickG = ctx.createGain();

    bus.connect(toneF);
    toneF.connect(dryG); dryG.connect(comp);
    toneF.connect(wetG); wetG.connect(conv); conv.connect(comp);
    comp.connect(volG); volG.connect(ctx.destination);
    clickG.connect(ctx.destination);
    if (ctx.createMediaStreamDestination) { recDest = ctx.createMediaStreamDestination(); volG.connect(recDest); }

    applyVol(); applyTone(); applyReverb();

    // unlock (iOS) with a 1-sample buffer
    try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (e) { /* ignore */ }
    unlockIOSMuteSwitch();
    keepAwake();
    ctx.resume();
    lastWin = ctx.currentTime;
  }

  function makeIR(sec, decay) {
    const len = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  // iOS < 17: a looping silent <audio> element switches the audio session so the mute switch doesn't kill Web Audio
  function unlockIOSMuteSwitch() {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!ios || navigator.audioSession) return;
    try {
      const n = 4000, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
      const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
      v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
      w(36, 'data'); v.setUint32(40, n, true);
      for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
      const a = new Audio(URL.createObjectURL(new Blob([buf], { type: 'audio/wav' })));
      a.loop = true; a.setAttribute('playsinline', ''); a.play().catch(() => { });
    } catch (e) { /* ignore */ }
  }

  let wake = null;
  async function keepAwake() {
    try {
      if ('wakeLock' in navigator && !wake) {
        wake = await navigator.wakeLock.request('screen');
        wake.addEventListener('release', () => { wake = null; });
      }
    } catch (e) { /* ignore */ }
  }

  function applyVol() {
    if (!ctx) return;
    const g = S.vol * S.vol;
    volG.gain.setTargetAtTime(g, ctx.currentTime, .01);
    clickG.gain.setTargetAtTime(g * .8, ctx.currentTime, .01);
  }
  function applyTone() { if (ctx) toneF.frequency.setTargetAtTime(300 * Math.pow(60, S.tone), ctx.currentTime, .02); }
  function applyReverb() {
    if (!ctx) return;
    wetG.gain.setTargetAtTime(S.reverb * 1.2, ctx.currentTime, .02);
    dryG.gain.setTargetAtTime(1 - S.reverb * .3, ctx.currentTime, .02);
  }

  function startVoice(freq, when, vel, pi) {
    const P = PRESETS[pi] || PRESETS[0];
    const t0 = Math.max(when, ctx.currentTime);
    if (voices.size > 30) { const o = voices.values().next().value; o.stop(ctx.currentTime, true); voices.delete(o); }

    const g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.Q.value = P.q;
    const peak = vel * P.gain;
    g.gain.setValueAtTime(0, t0);
    g.gain.setTargetAtTime(peak, t0, P.a / 3 + .0005);
    g.gain.setTargetAtTime(peak * P.s, t0 + P.a, P.d / 3);

    const fBase = Math.min(P.f + freq * P.fk, 16000), fStart = Math.min(fBase * (1 + P.fe), 18000);
    f.frequency.setValueAtTime(fStart, t0);
    if (P.fe > 0) f.frequency.setTargetAtTime(fBase, t0, P.fd / 3);

    const oscs = P.oscs.map(o => {
      const os = ctx.createOscillator();
      os.type = o.t; os.frequency.value = freq * o.m; os.detune.value = o.d;
      if (o.g !== 1) { const og = ctx.createGain(); og.gain.value = o.g; os.connect(og); og.connect(f); } else os.connect(f);
      os.start(t0);
      return os;
    });
    f.connect(g); g.connect(bus);

    const v = {
      stopped: false, loop: false,
      stop(rt, fast) {
        if (v.stopped) return; v.stopped = true;
        const at = Math.max(rt || 0, ctx.currentTime), rel = fast ? .03 : P.r;
        g.gain.cancelScheduledValues(at);
        g.gain.setTargetAtTime(0, at, rel / 3);
        const end = at + rel * 1.3 + .05;
        oscs.forEach(o => { try { o.stop(end); } catch (e) { /* already stopped */ } });
        oscs[0].onended = () => { try { g.disconnect(); f.disconnect(); } catch (e) { /* ignore */ } voices.delete(v); };
      }
    };
    voices.add(v);
    return v;
  }

  function click(at, accent) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o.frequency.value = accent ? 1600 : 1000;
    g.gain.setValueAtTime(.0001, at);
    g.gain.exponentialRampToValueAtTime(accent ? .18 : .1, at + .002);
    g.gain.exponentialRampToValueAtTime(.0001, at + .05);
    o.connect(g); g.connect(clickG); o.start(at); o.stop(at + .06);
  }

  /* ---------------------------------------------------------------- chords */
  const scaleNote = d => {
    const sc = S.minor ? MIN : MAJ;
    return sc[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
  };

  function chordName(notes, sus) {
    const r = notes[0], iv = new Set(notes.map(n => (((n - r) % 12) + 12) % 12)), has = x => iv.has(x);
    let s;
    if (sus) s = has(10) ? '7sus4' : has(11) ? 'maj7sus4' : 'sus4';
    else if (has(4) && has(7)) s = has(11) ? 'maj7' : has(10) ? '7' : '';
    else if (has(3) && has(7)) s = has(10) ? 'm7' : has(11) ? 'm(maj7)' : 'm';
    else if (has(3) && has(6)) s = has(9) ? 'dim7' : has(10) ? 'm7♭5' : 'dim';
    else if (has(4) && has(8)) s = has(10) ? '+7' : '+';
    else s = '?';
    return NOTES[(((r % 12) + 12) % 12)] + s;
  }

  function chordFor(deg) {
    const base = 60 + (S.key >= 6 ? S.key - 12 : S.key);
    let shift = 0;
    if (deg < 7 && scaleNote(deg) > 7) shift = -12;           // keep voicing compact
    const root = base + scaleNote(deg) + shift;
    const third = S.mods.sus ? root + 5 : base + scaleNote(deg + 2) + shift;
    const fifth = base + scaleNote(deg + 4) + shift;
    const notes = [root, third, fifth];
    if (S.mods.seventh) notes.push(base + scaleNote(deg + 6) + shift);

    let rom = ROMAN[deg % 7];
    const th = third - root, fi = fifth - root;
    if (S.mods.sus) rom += 'sus';
    else { if (th === 3) rom = rom.toLowerCase(); if (th === 3 && fi === 6) rom += '°'; }
    if (deg >= 7) rom += '’';
    return { notes, bass: root - 12, name: chordName(notes, S.mods.sus), roman: rom };
  }

  /* ---------------------------------------------------------------- recording of notes into the loop */
  function recNote(n, at, vel, dur, pi) {
    if (!S.rec || !S.playing) return null;
    let b = (at - S.loopStart) / spb();
    if (b < 0) return null;                                    // count-in
    const L = loopBeats(), iter = Math.floor(b / L);
    b -= iter * L;
    if (S.quant) { b = Math.round(b * 4) / 4; if (b >= L) b -= L; }
    const e = { b, n, v: vel, d: dur, p: pi, l: S.layer, skip: iter };
    S.events.push(e);
    return { e, t0: at };
  }
  const recEnd = (r, at) => { if (r) r.e.d = Math.max(.05, (at - r.t0) / spb()); };

  /* ---------------------------------------------------------------- live playing */
  const holds = new Map();      // pointerId/key -> holder
  const arpHeld = new Set();
  let arpEpochFallback = 0;

  const arpEpoch = () => (S.playing ? S.loopStart : arpEpochFallback);
  const arpStepSec = () => S.arpRate * spb();

  function arpNote(a) {
    const arr = a.seq; let n;
    switch (S.arp) {
      case 1: n = arr[a.i % arr.length]; a.i++; break;
      case 2: n = arr[arr.length - 1 - (a.i % arr.length)]; a.i++; break;
      case 3: { const m = arr.length * 2 - 2, k = a.i % m; n = arr[k < arr.length ? k : m - k]; a.i++; break; }
      default: n = arr[Math.floor(Math.random() * arr.length)];
    }
    return n;
  }

  function fireArp(h, at) {
    const n = arpNote(h.arp), dur = arpStepSec() * .92;
    const v = startVoice(mtof(n), at, .8, S.preset);
    v.stop(at + dur);
    recNote(n, at, .8, S.arpRate * .92, S.preset);
  }

  function chordDown(i, id) {
    initAudio();
    if (!ctx || holds.has(id)) return;
    const info = chordFor((S.mods.alt ? ALT : DEF)[i]);
    const now = ctx.currentTime;
    const h = { voices: [], recs: [], arp: null, i };
    if (!arpEpochFallback) arpEpochFallback = now;

    if (S.arp === 0) {
      info.notes.forEach(n => { h.voices.push(startVoice(mtof(n), now, .8, S.preset)); h.recs.push(recNote(n, now, .8, .25, S.preset)); });
      h.voices.push(startVoice(mtof(info.bass), now, .55, S.preset));
      h.recs.push(recNote(info.bass, now, .55, .25, S.preset));
    } else {
      h.arp = { seq: info.notes.concat(info.notes.map(n => n + 12)), i: 0, next: 0 };
      fireArp(h, now);
      const step = arpStepSec(), ep = arpEpoch();
      let nx = ep + Math.ceil((now - ep) / step - 1e-6) * step;
      if (nx - now < step * .5) nx += step;
      h.arp.next = nx;
      arpHeld.add(h);
    }
    holds.set(id, h);
    S.chord = info.name; S.chordUntil = Infinity;
    const el = $(`.chord[data-i="${i}"]`); if (el) el.classList.add('on');
  }

  function chordUp(id) {
    const h = holds.get(id); if (!h) return;
    holds.delete(id);
    const now = ctx.currentTime;
    h.voices.forEach(v => v.stop(now));
    h.recs.forEach(r => recEnd(r, now));
    arpHeld.delete(h);
    S.chordUntil = performance.now() + 600;
    if (![...holds.values()].some(o => o.i === h.i)) { const el = $(`.chord[data-i="${h.i}"]`); if (el) el.classList.remove('on'); }
  }

  // modifiers: quick tap latches, holding is momentary
  const modState = {};
  function modDown(name, id) {
    modState[id] = { name, t0: performance.now(), was: S.mods[name] };
    S.mods[name] = true; renderPads();
  }
  function modUp(id) {
    const m = modState[id]; if (!m) return; delete modState[id];
    S.mods[m.name] = (performance.now() - m.t0 < 250) ? !m.was : false;
    renderPads();
  }

  /* ---------------------------------------------------------------- scheduler / transport */
  function tick() {
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime, end = now + LOOKAHEAD;
    if (lastWin < now) lastWin = now;
    const from = lastWin; lastWin = end;
    const sp = spb();

    // arpeggios of held pads
    if (arpHeld.size) {
      const step = arpStepSec();
      arpHeld.forEach(h => { while (h.arp.next < end) { fireArp(h, h.arp.next); h.arp.next += step; } });
    }

    if (!S.playing) return;
    const L = loopBeats(), loopDur = L * sp;

    // metronome + count-in clicks
    const k0 = Math.ceil((from - S.loopStart) / sp - 1e-9);
    for (let k = k0; S.loopStart + k * sp < end; k++) {
      const at = S.loopStart + k * sp;
      if (at < S.countStart - 1e-6) continue;
      if (S.metro || at < S.loopStart - 1e-6) click(at, (((k % 4) + 4) % 4) === 0);
    }

    // loop events
    if (S.events.length) {
      const n0 = Math.max(0, Math.floor((from - S.loopStart) / loopDur)), n1 = Math.floor((end - S.loopStart) / loopDur);
      for (let n = n0; n <= n1; n++) {
        for (let j = 0; j < S.events.length; j++) {
          const e = S.events[j];
          if (e.b >= L || n === e.skip) continue;
          const at = S.loopStart + n * loopDur + e.b * sp;
          if (at >= from && at < end) {
            const v = startVoice(mtof(e.n), at, e.v, e.p);
            v.loop = true; v.stop(at + e.d * sp);
          }
        }
      }
    }
  }

  function startPlay(withCount) {
    initAudio(); if (!ctx) return;
    const now = ctx.currentTime + .05, sp = spb();
    S.playing = true; S.countStart = now;
    S.loopStart = withCount ? now + COUNT_IN * sp : now;
    lastWin = now;
  }
  function stopPlay() {
    S.playing = false; S.rec = false;
    if (ctx) voices.forEach(v => { if (v.loop) v.stop(ctx.currentTime); });
  }
  function toggleRec() {
    initAudio(); if (!ctx) return;
    if (S.rec) { S.rec = false; msg('REC OFF', 800); }
    else {
      if (!S.playing) startPlay(S.countIn);
      S.rec = true; S.layer++;
    }
    syncTransport();
  }
  function togglePlay() {
    initAudio(); if (!ctx) return;
    if (S.playing) stopPlay(); else startPlay(false);
    syncTransport();
  }
  function undoLayer() {
    if (!S.events.length) { msg(t('nothing')); return; }
    const mx = Math.max(...S.events.map(e => e.l));
    S.events = S.events.filter(e => e.l !== mx);
    msg(t('undone')); renderPanel();
  }
  function clearLoop() {
    S.events = []; S.rec = false; msg(t('cleared')); syncTransport(); renderPanel();
  }
  function setBpm(v) {
    v = Math.min(200, Math.max(50, Math.round(v)));
    if (ctx && S.playing) {
      const now = ctx.currentTime, pos = (now - S.loopStart) / spb();
      S.loopStart = now - pos * (60 / v);
    }
    S.bpm = v; save();
  }
  function syncTransport() {
    $('#t-rec').classList.toggle('on', S.rec);
    $('#t-play').classList.toggle('on', S.playing);
    $('#t-play').textContent = S.playing ? '■' : '▶';
  }
  function preview() {
    if (!ctx) return;
    const at = ctx.currentTime + .01;
    chordFor(DEF[0]).notes.forEach(n => startVoice(mtof(n), at, .7, S.preset).stop(at + .5));
  }

  /* ---------------------------------------------------------------- audio export */
  let mr = null, chunks = [];
  function toggleExport() {
    initAudio();
    if (!ctx || !recDest || !window.MediaRecorder) { msg(t('no_rec'), 1800); return; }
    if (mr && mr.state === 'recording') { mr.stop(); return; }
    const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'].find(m => MediaRecorder.isTypeSupported(m)) || '';
    chunks = [];
    try { mr = new MediaRecorder(recDest.stream, mime ? { mimeType: mime } : undefined); } catch (e) { msg(t('no_rec'), 1800); return; }
    mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = () => {
      S.exporting = false;
      const type = mr.mimeType || mime || 'audio/webm';
      const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
      const url = URL.createObjectURL(new Blob(chunks, { type }));
      const a = document.createElement('a');
      a.href = url; a.download = `fresh-beatz-${Date.now()}.${ext}`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      msg(t('saved')); renderPanel();
    };
    mr.start(); S.exporting = true; renderPanel();
  }

  /* ---------------------------------------------------------------- UI: pads, display, panels */
  function renderPads() {
    $$('.chord').forEach(el => {
      const info = chordFor((S.mods.alt ? ALT : DEF)[+el.dataset.i]);
      el.querySelector('.num').textContent = info.roman;
      el.querySelector('.nm').textContent = info.name;
    });
    $$('.mod').forEach(el => el.classList.toggle('latched', !!S.mods[el.dataset.m]));
  }

  const cache = {};
  function setText(sel, text) { if (cache[sel] !== text) { cache[sel] = text; $(sel).textContent = text; } }

  function renderDisplay() {
    const now = performance.now();
    const pos = (S.playing && ctx) ? (ctx.currentTime - S.loopStart) / spb() : -99;
    setText('#d-top', `${NOTES[S.key]} ${S.minor ? t('minor') : t('major')} · ${PRESETS[S.preset].name}`);
    let mid;
    if (now < S.msgUntil) mid = S.msg;
    else if (S.playing && pos < 0 && pos > -COUNT_IN - 1) mid = String(Math.max(1, Math.ceil(-pos)));
    else if (holds.size || now < S.chordUntil) mid = S.chord;
    else mid = S.rec ? '● REC' : S.playing ? '▶' : '';
    setText('#d-mid', mid);
    setText('#d-bot', `${S.bpm} BPM${S.arp ? ' · ARP ' + ARP_LABEL[S.arp] : ''}`);
    const pct = (S.playing && pos >= 0) ? ((pos % loopBeats()) / loopBeats()) * 100 : 0;
    const w = pct.toFixed(1) + '%';
    if (cache.bar !== w) { cache.bar = w; $('#d-bar').style.width = w; }
    const recCls = S.rec && pos >= 0;
    if (cache.rc !== recCls) { cache.rc = recCls; $('#display').classList.toggle('recording', recCls); }
  }
  function frame() { renderDisplay(); requestAnimationFrame(frame); }

  const seg = (items, cur, act, cls = '') =>
    `<div class="seg">${items.map(([v, l]) => `<button class="chip${String(v) === String(cur) ? ' on' : ''}${cls}" data-act="${act}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const toggle = (on, act, label) => `<button class="chip${on ? ' on' : ''}" data-act="${act}">${label}</button>`;
  const slider = (id, label, min, max, val, extra = '') =>
    `<label class="prow"><span class="plabel">${label}</span><input type="range" id="${id}" min="${min}" max="${max}" value="${val}">${extra}</label>`;

  let deferredInstall = null;

  function renderPanel() {
    const p = $('#panel'), n = S.panel;
    $$('.cbtn').forEach(b => b.classList.toggle('on', b.dataset.panel === n));
    if (!n) { p.hidden = true; p.innerHTML = ''; return; }
    p.hidden = false;
    let h = `<div class="ptitle"><span>${t(n)}</span><button class="chip" data-act="close" aria-label="Close">✕</button></div>`;

    if (n === 'key') {
      h += `<div class="grid g6">${NOTES.map((x, i) => `<button class="chip${S.key === i ? ' on' : ''}" data-act="key" data-v="${i}">${x}</button>`).join('')}</div>`;
      h += `<div class="prow">${seg([[0, t('major')], [1, t('minor')]], S.minor ? 1 : 0, 'mode')}</div>`;
      h += `<p class="hint">${t('tip_hold')}</p>`;
    } else if (n === 'sound') {
      h += `<div class="grid g3">${PRESETS.map((x, i) => `<button class="chip${S.preset === i ? ' on' : ''}" data-act="preset" data-v="${i}">${x.name}</button>`).join('')}</div>`;
      h += slider('r-tone', t('tone'), 0, 100, Math.round(S.tone * 100));
      h += slider('r-rev', t('reverb'), 0, 100, Math.round(S.reverb * 100));
    } else if (n === 'tempo') {
      h += `<div class="prow"><span class="plabel">${t('bpm')}</span><button class="chip" data-act="bpm-">−</button>
        <input type="range" id="r-bpm" min="50" max="200" value="${S.bpm}"><button class="chip" data-act="bpm+">+</button>
        <b id="bpmv" class="val">${S.bpm}</b><button class="chip" data-act="tap">${t('tap')}</button></div>`;
      h += `<div class="prow"><span class="plabel">${t('arp')}</span>${seg([[0, t('off')], [1, '↑'], [2, '↓'], [3, '↕'], [4, 'RND']], S.arp, 'arp')}
        ${seg([[1, '1/4'], [.5, '1/8'], [.25, '1/16']], S.arpRate, 'rate')}</div>`;
      h += `<div class="prow"><span class="plabel">${t('loop')}</span>${seg([[1, '1'], [2, '2'], [4, '4'], [8, '8']], S.bars, 'bars', S.events.length ? ' dis' : '')}<span class="hint">${t('bars')}</span></div>`;
      h += `<div class="prow">${toggle(S.metro, 'metro', t('metro'))}${toggle(S.quant, 'quant', t('quant'))}${toggle(S.countIn, 'countin', t('countin'))}</div>`;
    } else if (n === 'settings') {
      h += `<div class="prow"><span class="plabel">${t('language')}</span>${seg([['de', 'Deutsch'], ['en', 'English']], S.lang, 'lang')}
        <span class="plabel sp">${t('theme')}</span>${seg([['light', t('light')], ['dark', t('dark')]], effTheme(), 'theme')}</div>`;
      h += slider('r-vol', t('volume'), 0, 100, Math.round(S.vol * 100));
      h += `<div class="prow">${toggle(S.exporting, 'export', S.exporting ? '■ ' + t('stop_save') : '● ' + t('rec_audio'))}
        ${deferredInstall ? `<button class="chip" data-act="install">${t('install')}</button>` : ''}</div>`;
      h += `<p class="hint">${t('ios_hint')}<br>${t('shortcuts')}<br>Fresh Beatz v1.0</p>`;
    }
    p.innerHTML = h;
  }
  function setPanel(n) { S.panel = (S.panel === n) ? null : n; renderPanel(); }

  let taps = [];
  function tapTempo() {
    const now = performance.now();
    if (taps.length && now - taps[taps.length - 1] > 2000) taps = [];
    taps.push(now); taps = taps.slice(-5);
    if (taps.length >= 2) {
      const iv = []; for (let i = 1; i < taps.length; i++) iv.push(taps[i] - taps[i - 1]);
      setBpm(60000 / (iv.reduce((a, b) => a + b, 0) / iv.length));
    }
  }

  function onPanelClick(e) {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act, v = b.dataset.v;
    switch (a) {
      case 'close': setPanel(null); return;
      case 'key': S.key = +v; initAudio(); preview(); break;
      case 'mode': S.minor = v === '1'; initAudio(); preview(); break;
      case 'preset': S.preset = +v; initAudio(); preview(); break;
      case 'bpm-': setBpm(S.bpm - 1); break;
      case 'bpm+': setBpm(S.bpm + 1); break;
      case 'tap': tapTempo(); break;
      case 'arp': S.arp = +v; break;
      case 'rate': S.arpRate = +v; break;
      case 'bars': if (S.events.length) { msg(t('len_locked')); return; } S.bars = +v; break;
      case 'metro': S.metro = !S.metro; break;
      case 'quant': S.quant = !S.quant; break;
      case 'countin': S.countIn = !S.countIn; break;
      case 'lang': S.lang = v; applyLang(); break;
      case 'theme': S.theme = v; applyTheme(); break;
      case 'export': toggleExport(); return;
      case 'install': if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; } break;
      default: return;
    }
    renderPads(); save(); renderPanel();
  }
  function onPanelInput(e) {
    const id = e.target.id, v = +e.target.value;
    if (id === 'r-bpm') { setBpm(v); const el = $('#bpmv'); if (el) el.textContent = S.bpm; }
    else if (id === 'r-tone') { S.tone = v / 100; applyTone(); save(); }
    else if (id === 'r-rev') { S.reverb = v / 100; applyReverb(); save(); }
    else if (id === 'r-vol') { setVol(v / 100, false); }
  }

  /* ---------------------------------------------------------------- knob */
  function setVol(v, show = true) {
    S.vol = Math.min(1, Math.max(0, v));
    applyVol(); save();
    $('#knobwrap').style.setProperty('--rot', (-135 + S.vol * 270) + 'deg');
    if (show) msg('VOL ' + Math.round(S.vol * 100), 700);
  }
  function bindKnob() {
    const k = $('#knob'); let drag = null;
    k.addEventListener('pointerdown', e => { e.preventDefault(); k.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, v: S.vol }; });
    k.addEventListener('pointermove', e => { if (drag) setVol(drag.v + ((drag.y - e.clientY) + (e.clientX - drag.x)) / 180); });
    const end = () => { drag = null; };
    k.addEventListener('pointerup', end); k.addEventListener('pointercancel', end);
    k.addEventListener('keydown', e => { if (e.key === 'ArrowUp' || e.key === 'ArrowRight') setVol(S.vol + .05); if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') setVol(S.vol - .05); });
    const w = $('#knobwrap');
    for (let i = 0; i < 9; i++) {
      const d = document.createElement('i'); d.className = 'tick';
      d.style.transform = `rotate(${-135 + i * 33.75}deg) translateY(calc(var(--ks) * -.44))`;
      w.appendChild(d);
    }
  }

  /* ---------------------------------------------------------------- language / theme */
  function applyLang() {
    document.documentElement.lang = S.lang;
    $$('[data-i18n-title]').forEach(el => { const s = t(el.dataset.i18nTitle); el.title = s; el.setAttribute('aria-label', s); });
    renderPanel(); save();
  }
  function applyTheme() {
    const th = effTheme();
    document.documentElement.dataset.theme = th;
    const m = $('meta[name="theme-color"]'); if (m) m.content = th === 'dark' ? '#2b2b2d' : '#e7e3d9';
    save();
  }

  /* ---------------------------------------------------------------- input wiring */
  function bindPad(el, down, up) {
    el.addEventListener('pointerdown', e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } down(e.pointerId); });
    const end = e => up(e.pointerId);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', end);
  }

  const KEYS_CHORD = { KeyA: 0, KeyS: 1, KeyD: 2, KeyF: 3 };
  const KEYS_MOD = { KeyZ: 'seventh', KeyX: 'sus', KeyC: 'alt' };

  function init() {
    load(); applyTheme(); applyLang();
    $('#knobwrap').style.setProperty('--rot', (-135 + S.vol * 270) + 'deg');

    $$('.chord').forEach(el => { const i = +el.dataset.i; bindPad(el, pid => chordDown(i, 'p' + pid), pid => chordUp('p' + pid)); });
    $$('.mod').forEach(el => { const m = el.dataset.m; bindPad(el, pid => modDown(m, 'p' + pid), pid => modUp('p' + pid)); });
    renderPads();

    $$('.cbtn').forEach(b => b.addEventListener('click', () => { initAudio(); setPanel(b.dataset.panel); }));
    $('#display').addEventListener('click', () => { initAudio(); setPanel('settings'); });
    $('#panel').addEventListener('click', onPanelClick);
    $('#panel').addEventListener('input', onPanelInput);

    $('#t-rec').addEventListener('click', toggleRec);
    $('#t-play').addEventListener('click', togglePlay);
    $('#t-undo').addEventListener('click', undoLayer);
    $('#t-clr').addEventListener('click', clearLoop);
    bindKnob(); syncTransport();

    document.addEventListener('keydown', e => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (/INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName) && e.code === 'Space') return;
      if (e.code in KEYS_CHORD) chordDown(KEYS_CHORD[e.code], 'k' + e.code);
      else if (e.code in KEYS_MOD) modDown(KEYS_MOD[e.code], 'k' + e.code);
      else if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.code === 'KeyR') toggleRec();
    });
    document.addEventListener('keyup', e => {
      if (e.code in KEYS_CHORD) chordUp('k' + e.code);
      else if (e.code in KEYS_MOD) modUp('k' + e.code);
    });

    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { keepAwake(); if (ctx && ctx.state !== 'running') ctx.resume(); } });
    matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!S.theme) applyTheme(); });
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; renderPanel(); });

    setInterval(tick, TICK_MS);
    requestAnimationFrame(frame);

    if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
  }

  init();
})();
