/* Lupe Growth Engine soundtrack: slow, heavy rock synthesized live with Web Audio (no audio files).
   A half-time groove rolls underneath; every landing kicks the band up (crash, open power chord,
   backbeat) for a couple of bars, and each landing raises the floor so the song builds with the house.

   API (window.LupeRock):
     start(ctx)          start the groove on an existing AudioContext (call from a user tap)
     stop()              fade out and stop
     on                  true while playing
     delayToBeat(ms)     ms to hold a drop so a fall lasting `ms` lands exactly on the next 8th note
     hit(mass)           a landing just happened: lift the band, on the grid */
(function () {
  var BPM = 72, S16 = 60 / BPM / 4, LOOK = .14;
  // Em - C - G - D, one bar each (power-chord roots, MIDI)
  var ROOTS = [40, 48, 43, 50];
  var ctx = null, out = null, verb = null, noise = null, timer = 0, step = 0, nextT = 0, t0 = 0;
  var base = .3, lift = 0, liftAt = -9, landings = 0, lastHit = -9;
  var R = { on: false };

  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function noiseSrc(t, dur) { var s = ctx.createBufferSource(); s.buffer = noise; s.start(t, Math.random() * 1.5); s.stop(t + dur); return s; }
  function filt(type, f, q) { var b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q) b.Q.value = q; return b; }
  function send(node, wet) { node.connect(out); if (wet) { var w = ctx.createGain(); w.gain.value = wet; node.connect(w); w.connect(verb); } }

  function build() {
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var d = noise.getChannelData(0), i; for (i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = .005; comp.release.value = .2;
    var master = ctx.createGain(); master.gain.value = 0.0001;
    out = ctx.createGain(); out.connect(comp); comp.connect(master); master.connect(ctx.destination); out.master = master;
    var len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var ch = ir.getChannelData(c); for (i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    verb = ctx.createConvolver(); verb.buffer = ir; verb.connect(out);
  }

  /* ---- drums ---- */
  function kick(t, v) {
    var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + .14);
    env(g, t, .002, v, .4); o.connect(g); send(g); o.start(t); o.stop(t + .45);
    var n = noiseSrc(t, .03), ng = ctx.createGain(), hp = filt('highpass', 2500); env(ng, t, .001, v * .25, .02); n.connect(hp); hp.connect(ng); send(ng);
  }
  function snare(t, v) {
    var n = noiseSrc(t, .3), bp = filt('bandpass', 1900, .7), g = ctx.createGain(); env(g, t, .001, v * .8, .22); n.connect(bp); bp.connect(g); send(g, .35);
    var o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(140, t + .08);
    env(og, t, .001, v * .6, .12); o.connect(og); send(og, .2); o.start(t); o.stop(t + .2);
  }
  function hat(t, v, open) {
    var n = noiseSrc(t, open ? .45 : .08), hp = filt('highpass', 7500), g = ctx.createGain(); env(g, t, .001, v, open ? .35 : .045); n.connect(hp); hp.connect(g); send(g, .1);
  }
  function crash(t, v) {
    var n = noiseSrc(t, 2.4), hp = filt('highpass', 4200), pk = filt('peaking', 6500, 1), g = ctx.createGain(); pk.gain.value = 6;
    env(g, t, .003, v, 2.1); n.connect(hp); hp.connect(pk); pk.connect(g); send(g, .45);
  }

  /* ---- bass + distorted guitar ---- */
  function bass(t, m, dur, v) {
    var o = ctx.createOscillator(), lp = filt('lowpass', 520, 2), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = hz(m - 12);
    env(g, t, .01, v, dur); o.connect(lp); lp.connect(g); send(g); o.start(t); o.stop(t + dur + .1);
  }
  var curve = null;
  function shaper() {
    if (!curve) { curve = new Float32Array(1024); for (var i = 0; i < 1024; i++) { var x = i / 512 - 1; curve[i] = Math.tanh(x * 9) * .8; } }
    var w = ctx.createWaveShaper(); w.curve = curve; w.oversample = '2x'; return w;
  }
  function chord(t, m, dur, v, muted) {
    var pre = ctx.createGain(); pre.gain.value = .5;
    [0, 7, 12].forEach(function (iv, k) {
      [-7, 7].forEach(function (cents) { var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m + iv); o.detune.value = cents + (k ? 3 : 0); o.connect(pre); o.start(t); o.stop(t + dur + .3); });
    });
    var ws = shaper(), hp = filt('highpass', 90), cab = filt('lowpass', muted ? 1100 : 3200, .8), mid = filt('peaking', 750, 1.2), g = ctx.createGain();
    mid.gain.value = -5;
    env(g, t, muted ? .004 : .012, v, dur);
    pre.connect(ws); ws.connect(hp); hp.connect(mid); mid.connect(cab); cab.connect(g); send(g, muted ? .08 : .3);
  }

  /* ---- the sequencer ---- */
  function level(t) { var l = lift * Math.exp(-(t - liftAt) / 3.2); return Math.max(base, l); }
  function play(s, t) {
    var bar = Math.floor(s / 16), q = s % 16, m = ROOTS[bar % 4], L = level(t), big = L > .62;
    // drums
    if (big) {
      if (q === 0 || q === 6 || q === 8 || q === 10) kick(t, .95);
      if (q === 4 || q === 12) snare(t, .75);
      if (q % 2 === 0) hat(t, .16 + (q % 4 === 0 ? .06 : 0), q === 14);
    } else {
      if (q === 0 || q === 6 || q === 11) kick(t, .8);
      if (q === 8) snare(t, .6);
      if (q === 15 && bar % 2) snare(t, .12);
      if (q % 2 === 0) hat(t, .07 + L * .08, false);
    }
    // bass follows the kick on the root
    if (q === 0 || q === 6 || q === 8 || q === 11) bass(t, m, S16 * (q === 0 ? 5 : 2.5), .38);
    // guitar: rolling palm-muted chugs, opening up when the band lifts
    if (big) {
      if (q === 0 || q === 8) chord(t, m, S16 * 7.5, .32, false);
      else if (q % 2 === 0) chord(t, m, S16 * .9, .14, true);
    } else {
      if (q === 0) chord(t, m, S16 * 3, .16 + L * .12, false);
      else if (q % 2 === 0) chord(t, m, S16 * .8, .08 + L * .1, true);
    }
    if (q === 0 && bar % 4 === 0 && big) crash(t, .22);
  }
  function tick() {
    while (nextT < ctx.currentTime + LOOK) { play(step, nextT); step++; nextT += S16; }
  }

  /* first grid line (an 8th note) at or after time `at` */
  function grid(at) { var e = S16 * 2, k = Math.ceil((at - t0) / e - 1e-6); return t0 + k * e; }

  R.start = function (c) {
    if (R.on || !c) return; ctx = c; if (!out) build();
    R.on = true; step = 0; t0 = nextT = ctx.currentTime + .08;
    out.master.gain.cancelScheduledValues(ctx.currentTime);
    out.master.gain.setValueAtTime(0.0001, ctx.currentTime); out.master.gain.exponentialRampToValueAtTime(.55, ctx.currentTime + 1.5);
    timer = setInterval(tick, 25); tick();
  };
  R.stop = function () {
    if (!R.on) return; R.on = false; clearInterval(timer);
    var g = out.master.gain, n = ctx.currentTime; g.cancelScheduledValues(n); g.setValueAtTime(g.value || .3, n); g.exponentialRampToValueAtTime(0.0001, n + .6);
  };
  R.delayToBeat = function (fallMs) {
    if (!R.on) return 0; var land = ctx.currentTime + fallMs / 1000;
    return Math.max(0, (grid(land) - land) * 1000);
  };
  R.hit = function (mass) {
    if (!R.on) return; var n = ctx.currentTime; if (n - lastHit < S16 * 4 || mass < .9) return; lastHit = n;
    landings++; base = Math.min(.58, .3 + landings * .04);
    lift = 1; liftAt = n;
    var t = n + .005, bar = Math.floor((grid(n) - t0) / (S16 * 16)), m = ROOTS[((bar % 4) + 4) % 4];
    crash(t, .34); kick(t, 1); snare(t, .7); chord(t, m, S16 * 10, .4, false); bass(t, m, S16 * 8, .45);
  };
  document.addEventListener('visibilitychange', function () {
    if (!ctx || !R.on) return; if (document.hidden) ctx.suspend(); else ctx.resume();
  });
  window.LupeRock = R;
})();
