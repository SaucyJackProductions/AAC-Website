/* THE TRAILER: the 30-second pitch film as a screening room.
   - Before it's rolled, the film runs silently behind a veil as a teaser (not with reduced motion or save-data).
   - Tap anywhere on the screen: a gold projector iris opens from the tap and the film rolls from the top with sound.
   - Tap again to hold it: a card names the craft on screen and books it (the form opens with that service picked).
   - The film strip under it is every half second of the film: drag it to scrub (a loupe shows the frame), let go to roll from there.
   - The six craft keys light up and fill as the film reaches them; tap one to jump there.
   - The section glows with the film's own colors (sampled live, blurred behind the screen).
   - Save the film downloads the iPhone-ready MP4; Send it uses the phone's share sheet where there is one.
   The site music steps out on its own while the film plays with sound (the music script watches every unmuted video). */
(function () {
  'use strict';
  var W = window, D = document;
  var sec = D.getElementById('trailer'); if (!sec) return;
  var $ = function (id) { return D.getElementById(id); };
  var v = $('tr-video'), screen = $('tr-screen'), rollBtn = $('tr-roll'), iris = $('tr-iris');
  var ask = $('tr-ask'), askN = $('tr-ask-n'), askS = $('tr-ask-s'), askBook = $('tr-ask-book'), askGo = $('tr-ask-go');
  var end = $('tr-end'), again = $('tr-again'), snd = $('tr-snd'), full = $('tr-full');
  var strip = $('tr-strip'), cvs = $('tr-frames'), marks = $('tr-marks'), played = $('tr-played'), head = $('tr-head');
  var loupe = $('tr-loupe'), loupeImg = $('tr-loupe-img'), loupeT = $('tr-loupe-t');
  var chapEl = $('tr-chap'), tcEl = $('tr-tc'), amb = $('tr-amb');
  var keys = [].slice.call(D.querySelectorAll('#tr-keys button'));
  var still = D.documentElement.classList.contains('still');
  var DUR = 30, FRAMES = 60, CELL_W = 192, CELL_H = 108, COLS = 10;

  var CH = [
    { s: 0, e: 3, n: 'Opening', sub: 'Hilton Head Island' },
    { s: 3, e: 6.5, n: 'Cinematic', sub: 'Films, commercials and brand stories', svc: 'Full Brand Content Package' },
    { s: 6.5, e: 10, n: 'Drone', sub: 'FAA Part 107 certified aerial', svc: 'Drone / Aerial' },
    { s: 10, e: 13.5, n: 'Photography', sub: 'Luxury listings, resorts and editorial', svc: 'Real Estate / Rentals' },
    { s: 13.5, e: 17.5, n: 'Luxury Estates', sub: 'Real estate film, photo and aerial', svc: 'Real Estate / Rentals' },
    { s: 17.5, e: 21.5, n: '3D Golf Courses', sub: 'Digital twin models and flythroughs', svc: 'Drone / Aerial' },
    { s: 21.5, e: 26, n: '3D Home Builds', sub: 'New builds and renovations, brought to life', svc: 'Real Estate / Rentals' },
    { s: 26, e: 30, n: 'Above All Media', sub: 'Cinematic, drone, photo and 3D', svc: 'Full Brand Content Package' }
  ];
  function chAt(t) { for (var i = CH.length - 1; i >= 0; i--) if (t >= CH[i].s) return i; return 0; }
  function z(n) { return ('0' + n).slice(-2); }
  function fmt(t) { return z(Math.floor(t / 60)) + ':' + z(Math.floor(t) % 60); }
  function dur() { return (v.duration && isFinite(v.duration)) ? v.duration : DUR; }

  /* ---------- the film file: 720p on phones, the full 1080p iPhone master on bigger screens ---------- */
  var phone = W.matchMedia && W.matchMedia('(max-width: 900px)').matches;
  if (phone && v.getAttribute('data-poster-m')) v.poster = v.getAttribute('data-poster-m');
  function load() {
    if (v.getAttribute('src')) return;
    v.src = (phone && v.getAttribute('data-src-m')) || v.getAttribute('data-src');
    v.preload = 'auto';
  }

  /* ---------- state ---------- */
  var rolled = false, inView = false, dragging = false, heldByScroll = false;
  function set(cls, on) { sec.classList.toggle(cls, !!on); }
  function hideCards() { ask.hidden = true; end.hidden = true; set('ask-open', false); }
  function paintSnd() {
    snd.hidden = !rolled;
    snd.textContent = v.muted ? 'Tap for sound' : 'Sound off';
    snd.setAttribute('aria-pressed', v.muted ? 'false' : 'true');
  }

  function teaser() {
    if (rolled || still || !inView) return;
    load(); v.muted = true; v.loop = true;
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }

  function roll(t, x, y) {
    load();
    rolled = true; v.loop = false; hideCards();
    if (typeof t === 'number') { try { v.currentTime = Math.max(0, Math.min(t, dur() - 0.05)); } catch (e) {} }
    if (!still && iris) {
      iris.style.setProperty('--ix', (x == null ? 50 : x) + '%'); iris.style.setProperty('--iy', (y == null ? 50 : y) + '%');
      iris.classList.remove('go'); void iris.offsetWidth; iris.classList.add('go');
    }
    v.muted = false;
    if (W.__aamMusic && W.__aamMusic.level) { try { W.__aamMusic.level(v, 1); } catch (e) {} }
    set('rolling', true); set('held', false); screen.setAttribute('data-cursor', 'Hold');
    var p = v.play();
    if (p && p.catch) p.catch(function () { v.muted = true; var q = v.play(); if (q && q.catch) q.catch(function () { hold(); }); paintSnd(); });
    paintSnd(); loop();
  }

  function hold(byScroll) {
    if (!rolled) { v.pause(); return; }
    v.pause(); heldByScroll = !!byScroll;
    set('rolling', false); set('held', true); screen.setAttribute('data-cursor', 'Roll');
    var c = CH[chAt(v.currentTime)];
    if (v.ended || v.currentTime >= dur() - 0.15) return;
    askN.textContent = c.n; askS.textContent = c.sub;
    askBook.setAttribute('data-service', c.svc || 'Full Brand Content Package');
    askBook.firstChild.nodeValue = (c.svc && c.n !== 'Opening' && c.n !== 'Above All Media') ? 'Book ' + c.n.toLowerCase() + ' ' : 'Begin a project ';
    ask.hidden = false; end.hidden = true; set('ask-open', true);
  }

  /* ---------- screen taps ---------- */
  function pct(e, el) {
    var r = el.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100];
  }
  rollBtn.addEventListener('click', function (e) {
    var p = e.clientX ? pct(e, screen) : [50, 50];
    roll(rolled ? v.currentTime : 0, p[0], p[1]);
  });
  screen.addEventListener('click', function (e) {
    if (e.target.closest('button,a') || !rolled) return;
    if (sec.classList.contains('rolling')) hold();
    else { var p = pct(e, screen); roll(v.ended ? 0 : v.currentTime, p[0], p[1]); }
  });
  askGo.addEventListener('click', function () { roll(v.currentTime); });
  again.addEventListener('click', function () { roll(0); });
  snd.addEventListener('click', function () {
    v.muted = !v.muted;
    if (!v.muted && v.paused && rolled && !v.ended) roll(v.currentTime);
    paintSnd();
  });
  full.addEventListener('click', function () {
    if (!rolled) roll(0);
    if (v.webkitEnterFullscreen && !screen.requestFullscreen) { try { v.webkitEnterFullscreen(); } catch (e) {} return; }   /* iPhone: the native player */
    var fs = screen.requestFullscreen || screen.webkitRequestFullscreen;
    if (D.fullscreenElement || D.webkitFullscreenElement) { (D.exitFullscreen || D.webkitExitFullscreen).call(D); return; }
    if (fs) { try { var p = fs.call(screen); if (p && p.catch) p.catch(function () { if (v.webkitEnterFullscreen) v.webkitEnterFullscreen(); }); } catch (e) {} }
    else if (v.webkitEnterFullscreen) { try { v.webkitEnterFullscreen(); } catch (e) {} }
  });
  v.addEventListener('ended', function () {
    if (!rolled) return;
    set('rolling', false); set('held', true); ask.hidden = true; end.hidden = false; set('ask-open', true);
    keys.forEach(function (k) { k.classList.add('done'); k.classList.remove('on'); });
    paint();
  });
  v.addEventListener('volumechange', paintSnd);

  /* ---------- craft keys ---------- */
  keys.forEach(function (k) {
    k.addEventListener('click', function () { roll(CH[+k.getAttribute('data-ch')].s + 0.02); });
  });

  /* ---------- film strip ---------- */
  var sprite = new Image(), spriteOk = false;
  sprite.onload = function () { spriteOk = true; drawStrip(); };
  function drawStrip() {
    if (!spriteOk) return;
    var r = strip.getBoundingClientRect(), dpr = Math.min(W.devicePixelRatio || 1, 2);
    var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (!w || !h) return;
    cvs.width = w; cvs.height = h;
    /* as many frames as fit at a little wider than square, each the moment at the middle of its slot, with a hairline gap like celluloid */
    var g = cvs.getContext('2d'), n = Math.max(4, Math.round(w / (h * 1.35))), sw = w / n, gap = Math.max(1, Math.round(dpr * 1.5));
    g.fillStyle = '#050505'; g.fillRect(0, 0, w, h);
    var srcW = Math.min(CELL_W, (sw - gap) * (CELL_H / h));
    for (var i = 0; i < n; i++) {
      var f = Math.min(FRAMES - 1, Math.floor(((i + 0.5) / n) * FRAMES)), col = f % COLS, row = Math.floor(f / COLS);
      g.drawImage(sprite, col * CELL_W + (CELL_W - srcW) / 2, row * CELL_H, srcW, CELL_H, Math.round(i * sw), 0, Math.round(sw) - gap, h);
    }
    marks.innerHTML = '';
    CH.slice(1).forEach(function (c) { var m = D.createElement('i'); m.style.left = (c.s / DUR * 100) + '%'; marks.appendChild(m); });
  }
  var lw = 0;
  W.addEventListener('resize', function () { var w = strip.clientWidth; if (w !== lw) { lw = w; drawStrip(); } }, { passive: true });

  function tAt(clientX) { var r = strip.getBoundingClientRect(); return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * dur(); }
  function peek(t, clientX) {
    var r = strip.getBoundingClientRect(), f = Math.min(FRAMES - 1, Math.floor(t * 2));
    var lw2 = loupeImg.offsetWidth || CELL_W, k = lw2 / CELL_W;
    loupeImg.style.backgroundPosition = (-(f % COLS) * CELL_W * k) + 'px ' + (-Math.floor(f / COLS) * CELL_H * k) + 'px';
    var x = Math.max(lw2 / 2 - 4, Math.min(r.width - lw2 / 2 + 4, clientX - r.left));
    loupe.style.left = x + 'px';
    loupeT.textContent = fmt(t) + ' · ' + CH[chAt(t)].n;
  }
  var wasRolling = false, lastT = 0;
  strip.addEventListener('pointerdown', function (e) {
    if (e.button && e.button !== 0) return;
    load(); dragging = true; wasRolling = sec.classList.contains('rolling');
    try { strip.setPointerCapture(e.pointerId); } catch (x) {}
    strip.classList.add('drag', 'peek'); v.pause(); hideCards();
    scrub(e.clientX);
  });
  function scrub(cx) {
    lastT = tAt(cx); peek(lastT, cx);
    try { if (v.fastSeek && !dragging) v.fastSeek(lastT); else v.currentTime = lastT; } catch (x) {}
    paint(lastT);
  }
  strip.addEventListener('pointermove', function (e) {
    if (dragging) { scrub(e.clientX); return; }
    if (e.pointerType === 'mouse') { strip.classList.add('peek'); peek(tAt(e.clientX), e.clientX); }
  });
  function release() {
    if (!dragging) return; dragging = false;
    strip.classList.remove('drag', 'peek');
    roll(Math.min(lastT, dur() - 0.3));
  }
  strip.addEventListener('pointerup', release);
  strip.addEventListener('pointercancel', function () { dragging = false; strip.classList.remove('drag', 'peek'); if (wasRolling) roll(v.currentTime); });
  strip.addEventListener('pointerleave', function () { if (!dragging) strip.classList.remove('peek'); });
  strip.addEventListener('keydown', function (e) {
    var t = v.currentTime || 0, k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowUp') t += 1; else if (k === 'ArrowLeft' || k === 'ArrowDown') t -= 1;
    else if (k === 'Home') t = 0; else if (k === 'End') t = dur() - 0.5;
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); if (sec.classList.contains('rolling')) hold(); else roll(v.ended ? 0 : t); return; }
    else return;
    e.preventDefault(); load();
    t = Math.max(0, Math.min(dur() - 0.3, t));
    try { v.currentTime = t; } catch (x) {}
    paint(t);
  });

  /* ---------- painting: timecode, chapter, keys, strip head ---------- */
  var lastCh = -1;
  function paint(tt) {
    var t = typeof tt === 'number' ? tt : (v.currentTime || 0), d = dur(), p = Math.min(1, t / d);
    played.style.width = (p * 100) + '%'; head.style.left = (p * 100) + '%';
    tcEl.textContent = z(Math.floor(t / 60)) + ':' + z(Math.floor(t) % 60) + ':' + z(Math.floor((t % 1) * 30));
    var c = chAt(t);
    if (c !== lastCh) {
      lastCh = c; chapEl.textContent = '// ' + (c > 0 && c < 7 ? z(c) + ' ' : '') + CH[c].n;
      strip.setAttribute('aria-valuetext', Math.round(t) + ' seconds, ' + CH[c].n);
    }
    strip.setAttribute('aria-valuenow', Math.round(t));
    if (!rolled) return;
    keys.forEach(function (k, i) {
      var ch = CH[i + 1], f = Math.max(0, Math.min(1, (t - ch.s) / (ch.e - ch.s)));
      k.classList.toggle('on', i + 1 === c);
      k.classList.toggle('done', t >= ch.e);
      k.querySelector('.bar i').style.width = (f * 100) + '%';
    });
    if (W.innerWidth <= 720 && c > 0 && c < 7 && c !== paint.rail) {   /* phones: bring the lit key into the rail without moving the page */
      paint.rail = c; var rail = keys[c - 1].parentNode.parentNode, li = keys[c - 1].parentNode;
      try { rail.scrollTo({ left: li.offsetLeft - 16, behavior: still ? 'auto' : 'smooth' }); } catch (x) { rail.scrollLeft = li.offsetLeft - 16; }
    }
  }

  /* ---------- the glow: the film's own colours, sampled small and blurred ---------- */
  var ag = null; try { ag = amb.getContext('2d'); } catch (e) {}
  var poster = new Image(); poster.onload = function () { if (ag && !v.currentTime) try { ag.drawImage(poster, 0, 0, 32, 18); } catch (e) {} };
  var lastAmb = 0;
  function glow(now) {
    if (!ag || v.readyState < 2 || now - lastAmb < 110) return;
    lastAmb = now; try { ag.drawImage(v, 0, 0, 32, 18); } catch (e) { ag = null; }
  }

  var raf = 0;
  function loop() {
    if (raf) return;
    var tick = function (now) {
      raf = 0;
      if (!dragging) paint();
      glow(now);
      if (!v.paused && inView) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  v.addEventListener('play', loop);
  v.addEventListener('seeked', function () { glow(performance.now() + 1000); });

  /* ---------- in and out of view ---------- */
  if ('IntersectionObserver' in W) {
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) {
        load(); if (!sprite.src) sprite.src = 'assets/trailer/strip.webp';
        if (!poster.src) poster.src = v.poster;
      }
    }, { rootMargin: '700px 0px' }).observe(sec);
    new IntersectionObserver(function (es) {
      inView = es[0].isIntersecting; set('lit', inView);
      if (inView) { if (!rolled) teaser(); else if (heldByScroll && !ask.hidden) { /* leave it held with its card; one tap rolls on */ } loop(); }
      else { if (rolled && !v.paused) hold(true); else if (!rolled) v.pause(); }
    }, { threshold: 0.35 }).observe(screen);
  } else { load(); sprite.src = 'assets/trailer/strip.webp'; }
  D.addEventListener('visibilitychange', function () { if (D.hidden && rolled && !v.paused) hold(true); });

  /* ---------- share ---------- */
  var share = $('tr-share');
  if (share && navigator.share) {
    share.hidden = false;
    share.addEventListener('click', function () {
      navigator.share({ title: 'Above All Media · The Trailer', text: 'Thirty seconds of cinematic, drone, photo and 3D from Hilton Head Island.', url: location.origin + location.pathname + '#trailer' }).catch(function () {});
    });
  }
  paint(0);
})();
