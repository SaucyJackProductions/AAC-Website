/* Premier Soft Wash — grime-to-clean motion engine (Above All Media framework). One rAF loop; every effect degrades to a calm, complete page. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, W = window;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  var reduce = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = W.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var conn = navigator.connection || {};
  var lowData = !!(conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''));
  var still = reduce || lowData;

  /* ---------- word split for headings (keeps <em> colour) ---------- */
  var wi = 0;
  function split(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var parts = n.textContent.split(/(\s+)/), frag = d.createDocumentFragment();
        parts.forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
          var o = d.createElement('span'), i = d.createElement('i');
          o.className = 'wd'; i.textContent = p; i.style.setProperty('--i', wi++); o.appendChild(i); frag.appendChild(o);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1) split(n);
    });
  }
  $$('[data-split]').forEach(function (el) { wi = 0; el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim()); split(el); $$('.wd', el).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); }); });

  /* manifesto: each word starts grimy and washes clean as you read */
  var mfText = $('#mf-text'), mfWords = [];
  if (mfText) {
    var gold = (mfText.getAttribute('data-gold') || '').split(',');
    var full = mfText.textContent.trim(), words = full.split(/\s+/);
    mfText.textContent = '';
    var sr = d.createElement('span'); sr.className = 'sr-only'; sr.textContent = full; mfText.appendChild(sr);
    words.forEach(function (w, i) {
      var s = d.createElement('span'); s.className = 'w' + (gold.indexOf(w) > -1 ? ' g' : ''); s.textContent = w; s.setAttribute('aria-hidden', 'true');
      mfText.appendChild(s); if (i < words.length - 1) mfText.appendChild(d.createTextNode(' '));
      mfWords.push(s);
    });
  }

  function boot() {
    var lenis = null, vh = W.innerHeight, vw = W.innerWidth;
    var header = $('#site-header'), progress = $('#progress'), mbar = $('#mbar');

    if (!reduce && W.Lenis) {
      try { lenis = new W.Lenis({ lerp: 0.1, wheelMultiplier: 1.1, smoothWheel: true }); } catch (e) { lenis = null; }
    }

    /* ---------- menu ---------- */
    var menuBtn = $('#menu-toggle'), mmenu = $('#mmenu');
    function setMenu(open) {
      menuBtn.classList.toggle('active', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      mmenu.classList.toggle('open', open);
      d.body.classList.toggle('nav-open', open);
      if (lenis) { open ? lenis.stop() : lenis.start(); }
    }
    menuBtn.addEventListener('click', function () { setMenu(!mmenu.classList.contains('open')); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mmenu.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });

    /* ---------- anchors ---------- */
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id.length < 2) return;
        var t = id === '#top' ? 0 : $(id);
        if (t === null) return;
        e.preventDefault();
        if (mmenu.classList.contains('open')) setMenu(false);
        if (t && t.nodeType === 1) { if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1'); try { t.focus({ preventScroll: true }); } catch (err) {} }
        if (lenis) lenis.scrollTo(t, { offset: 0, duration: 1.6, easing: function (x) { return 1 - Math.pow(1 - x, 4); } });
        else if (t === 0) W.scrollTo({ top: 0, behavior: 'smooth' });
        else t.scrollIntoView({ behavior: 'smooth' });
      });
    });

    /* ---------- reveals ---------- */
    var revealEls = $$('.rv,[data-split]');
    if ('IntersectionObserver' in W && !still) {
      var rio = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      revealEls.forEach(function (el) { if (!el.closest('#top')) rio.observe(el); });
    } else revealEls.forEach(function (el) { el.classList.add('in'); });

    /* ---------- lazy loop videos (muted b-roll only; reels, film and brand stage play on request) ---------- */
    var loops = $$('video[data-src]').filter(function (v) { return v.hasAttribute('muted') && v.hasAttribute('loop') && !v.closest('#brand'); });
    if (!still && 'IntersectionObserver' in W) {
      var vio = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          var v = en.target, p;
          if (en.isIntersecting) {
            if (!v.getAttribute('src')) { v.src = v.getAttribute('data-src'); v.addEventListener('playing', function () { v.classList.add('is-playing'); }, { once: true }); }
            p = v.play(); if (p && p.catch) p.catch(function () {});
          } else v.pause();
        });
      }, { rootMargin: '200px' });
      loops.forEach(function (v) { vio.observe(v); });
    }

    /* ======================================================================
       THE WASH — the hero facade starts grimy; scroll drives a soft-wash line
       across it (with spray, sheen and droplets), and the cursor sprays too.
       ====================================================================== */
    var wash = $('#top'), cv = $('#wash-canvas'), ctx = null, lay = null, lctx = null, mask = null, mctx = null;
    var washIntro = $('#wash-intro'), washEnd = $('#wash-end'), washCue = $('#wash-cue'), washPct = $('#wash-pct'), washGauge = $('#wash-gauge'), washStage = $('#wash-stage');
    var caps = $$('.wash-cap').map(function (el) { return { el: el, a: +el.getAttribute('data-a'), b: +el.getAttribute('data-b') }; });
    var portrait = vw / vh < 0.8;
    var plate = new Image(), grime = new Image(), dirty = null, pw = 0, ph = 0, heroReady = false, loadedN = 0;
    var dpr = Math.min(W.devicePixelRatio || 1, 1.5), cw = 0, ch = 0, autoT0 = 0, wp = 0, wpT = 0, brushUsed = false, needDraw = true;
    var X = { dx: 0, dy: 0, s: 1 }, parts = [], lastBrush = null;
    try { ctx = cv.getContext('2d'); } catch (e) { ctx = null; }
    if (ctx) {
      lay = d.createElement('canvas'); lctx = lay.getContext('2d');
      mask = d.createElement('canvas'); mctx = mask.getContext('2d');
    }

    function sizeCanvas() {
      var w = Math.round(vw * dpr), h = Math.round(vh * dpr);
      if (w === cw && Math.abs(h - ch) < 140 * dpr && cw) return;
      cw = cv.width = lay.width = w; ch = cv.height = lay.height = h; needDraw = true;
    }
    function buildDirty() {
      pw = plate.naturalWidth; ph = plate.naturalHeight;
      dirty = d.createElement('canvas'); dirty.width = pw; dirty.height = ph;
      var g = dirty.getContext('2d');
      g.drawImage(plate, 0, 0);
      g.globalCompositeOperation = 'saturation'; g.globalAlpha = 0.72; g.fillStyle = 'hsl(0,0%,50%)'; g.fillRect(0, 0, pw, ph);
      g.globalAlpha = 1; g.globalCompositeOperation = 'multiply'; g.drawImage(grime, 0, 0, pw, ph);
      g.fillStyle = 'rgb(206,196,150)'; g.fillRect(0, 0, pw, ph);
      g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.16; g.drawImage(grime, 0, 0, pw, ph);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      mask.width = pw; mask.height = ph;
    }
    function onAsset() {
      loadedN++;
      root.style.setProperty('--lp', (loadedN / 2).toFixed(2));
      var pc = $('#ld-pct'); if (pc) pc.textContent = ('00' + Math.round(loadedN / 2 * 100)).slice(-3);
      if (loadedN === 2 && ctx) {
        try { buildDirty(); heroReady = true; wash.classList.add('live'); needDraw = true; } catch (e) { heroReady = false; }
        setTimeout(enter, 350);
      }
    }
    var entered = false;
    function enter() {
      if (entered) return; entered = true;
      root.classList.add('loaded');
      setTimeout(function () { $$('[data-split]', washIntro).forEach(function (el) { el.classList.add('in'); }); autoT0 = performance.now(); }, 500);
    }
    if (!still && ctx) {
      sizeCanvas();
      plate.decoding = grime.decoding = 'async';
      plate.onload = grime.onload = onAsset;
      plate.onerror = grime.onerror = function () { setTimeout(enter, 0); };
      plate.src = portrait ? '../local-legend/stills/premier-ll-29-rig-at-the-beer-garden-aam.jpg' : '../local-legend/stills/premier-ll-19-drone-neon-windows-full-sign-aam.jpg';
      grime.src = 'assets/grime-' + (portrait ? 'tall' : 'wide') + '.webp';
      setTimeout(enter, 2200);
    } else {
      root.classList.add('loaded');
      $$('[data-split]').forEach(function (el) { el.classList.add('in'); });
    }

    var tilt = 0;
    function lineX(xm, y) { return xm + (0.5 - y / ch) * tilt; }
    function drawWash(p, t) {
      var zoom = 1.06 - 0.06 * p;
      var s = Math.max(cw / pw, ch / ph) * zoom, w = pw * s, h = ph * s;
      var dx = (cw - w) * (portrait ? 0.5 : 0.5), dy = (ch - h) * (portrait ? 0.5 : 0.12);
      X.dx = dx; X.dy = dy; X.s = s;
      tilt = 0.34 * ch * (portrait ? 0.6 : 1);
      var xm = lerp(-0.3 * cw, 1.3 * cw, p);

      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.drawImage(plate, dx, dy, w, h);

      /* the dirty layer, with the washed area and the sprayed strokes cut out */
      lctx.globalCompositeOperation = 'source-over'; lctx.clearRect(0, 0, cw, ch);
      lctx.drawImage(dirty, dx, dy, w, h);
      lctx.globalCompositeOperation = 'destination-out';
      lctx.beginPath(); lctx.moveTo(-20, -20);
      for (var i = 0; i <= 16; i++) {
        var yy = i / 16 * ch;
        lctx.lineTo(lineX(xm, yy) + Math.sin(yy * 0.018 + t * 0.004) * 7 * dpr, yy);
      }
      lctx.lineTo(-20, ch + 20); lctx.closePath(); lctx.fill();
      if (brushUsed) lctx.drawImage(mask, dx, dy, w, h);
      lctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(lay, 0, 0);

      if (p > 0.001 && p < 0.999) {
        var th = Math.atan2(tilt, ch), bw = 160 * dpr;
        /* wet sheen trailing the wash line */
        ctx.save(); ctx.globalCompositeOperation = 'screen';
        ctx.translate(xm, ch / 2); ctx.rotate(th);
        var gr = ctx.createLinearGradient(-bw, 0, 6 * dpr, 0);
        gr.addColorStop(0, 'rgba(191,227,255,0)'); gr.addColorStop(0.7, 'rgba(191,227,255,.16)'); gr.addColorStop(0.97, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr; ctx.fillRect(-bw, -ch, bw + 6 * dpr, ch * 2);
        ctx.restore();

        /* the spray fan from the wand, sweeping up and down the line */
        var ty = ch * (0.42 + 0.24 * Math.sin(t * 0.0021)), tx = lineX(xm, ty);
        var ox = portrait ? cw * 0.5 : -0.02 * cw, oy = ch * 1.04;
        var ang = Math.atan2(ty - oy, tx - ox), sp = 60 * dpr;
        var px = Math.cos(ang + Math.PI / 2) * sp, py = Math.sin(ang + Math.PI / 2) * sp;
        ctx.save(); ctx.globalCompositeOperation = 'screen';
        var sg = ctx.createLinearGradient(ox, oy, tx, ty);
        sg.addColorStop(0, 'rgba(220,240,255,0)'); sg.addColorStop(0.55, 'rgba(220,240,255,.10)'); sg.addColorStop(1, 'rgba(235,247,255,.42)');
        ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(tx + px, ty + py); ctx.lineTo(tx - px, ty - py); ctx.closePath(); ctx.fill();
        ctx.restore();
        if (!still) for (var k = 0; k < 5; k++) spawn(tx + (Math.random() - 0.5) * sp * 1.4, ty + (Math.random() - 0.5) * sp * 1.4, 1);
        if (Math.random() < 0.5) { var ry = Math.random() * ch; spawn(lineX(xm, ry) - Math.random() * 40 * dpr, ry, 2); }
      }
      drawParts();
    }
    /* droplets and mist (1) and running water (2) */
    function spawn(x, y, kind) {
      if (parts.length > 260) return;
      if (kind === 2) parts.push({ x: x, y: y, vx: 0, vy: (1.5 + Math.random() * 2.5) * dpr, l: 1, dl: 0.012 + Math.random() * 0.01, r: (0.8 + Math.random()) * dpr, k: 2 });
      else parts.push({ x: x, y: y, vx: (Math.random() - 0.65) * 7 * dpr, vy: (Math.random() - 0.7) * 6 * dpr, l: 1, dl: 0.03 + Math.random() * 0.04, r: (0.6 + Math.random() * 2.2) * dpr, k: 1 });
    }
    function drawParts() {
      if (!parts.length) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (var i = parts.length - 1; i >= 0; i--) {
        var q = parts[i];
        q.x += q.vx; q.y += q.vy; q.vy += q.k === 1 ? 0.25 * dpr : 0.02 * dpr; q.l -= q.dl;
        if (q.l <= 0 || q.y > ch + 10) { parts.splice(i, 1); continue; }
        if (q.k === 2) {
          ctx.strokeStyle = 'rgba(200,230,255,' + (q.l * 0.35).toFixed(3) + ')'; ctx.lineWidth = q.r;
          ctx.beginPath(); ctx.moveTo(q.x, q.y - 18 * dpr); ctx.lineTo(q.x, q.y); ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(225,242,255,' + (q.l * 0.75).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283); ctx.fill();
        }
      }
      ctx.restore();
    }
    /* the cursor sprays: paint the clean mask in plate space */
    function brushAt(cx, cy) {
      var bx = (cx * dpr - X.dx) / X.s, by = (cy * dpr - X.dy) / X.s, r = 64 * dpr / X.s;
      var steps = 1, lx = bx, ly = by;
      if (lastBrush) { var dd = Math.hypot(bx - lastBrush[0], by - lastBrush[1]); steps = Math.min(24, Math.max(1, Math.ceil(dd / (r * 0.35)))); lx = lastBrush[0]; ly = lastBrush[1]; }
      for (var i = 1; i <= steps; i++) {
        var x = lerp(lx, bx, i / steps), y = lerp(ly, by, i / steps);
        var g = mctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(0.6, 'rgba(0,0,0,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        mctx.fillStyle = g; mctx.beginPath(); mctx.arc(x, y, r, 0, 6.283); mctx.fill();
      }
      lastBrush = [bx, by]; brushUsed = true; needDraw = true;
      for (var k = 0; k < 4; k++) spawn(cx * dpr + (Math.random() - 0.5) * 30 * dpr, cy * dpr + (Math.random() - 0.5) * 30 * dpr, 1);
    }
    if (fine && !still && ctx) {
      var stick = $('.wash-stick', wash), curEl0 = $('#cur');
      stick.addEventListener('pointermove', function (e) { if (heroReady && !washEnd.classList.contains('on')) brushAt(e.clientX, e.clientY); });
      stick.addEventListener('pointerenter', function () { curEl0.classList.add('spray'); });
      stick.addEventListener('pointerleave', function () { curEl0.classList.remove('spray'); lastBrush = null; });
      var cueT = $('#cue-text'); if (cueT) cueT.textContent = 'Move to spray · Scroll to wash';
    }
    var stages = [[0, 'Mildew'], [25, 'Soft wash'], [55, 'Rinse'], [90, 'Premier clean']];

    /* ---------- services: floating preview follows the cursor ---------- */
    var sf = $('#svc-float'), sfImgs = sf ? $$('img', sf) : [], sfx = 0, sfy = 0, sftx = 0, sfty = 0;
    if (fine && !still && sf) {
      $$('#svc-list a').forEach(function (a) {
        a.addEventListener('mouseenter', function () {
          var k = +a.getAttribute('data-img');
          sfImgs.forEach(function (im, i) { im.classList.toggle('on', i === k); });
          sf.classList.add('on');
        });
      });
      $('#svc-list').addEventListener('mouseleave', function () { sf.classList.remove('on'); });
    }

    /* ---------- cursor + magnetic buttons ---------- */
    var curEl = $('#cur'), curLabel = $('#cur-label'), cx = -100, cy = -100, rx = -100, ry = -100, curRing = $('.cur-ring', curEl), curDot = $('.cur-dot', curEl);
    if (fine && !reduce) {
      root.classList.add('has-cur');
      W.addEventListener('pointermove', function (e) { cx = e.clientX; cy = e.clientY; sftx = cx; sfty = cy; }, { passive: true });
      d.addEventListener('pointerover', function (e) {
        var t = e.target.closest ? e.target.closest('[data-cursor],a,button,input,select,textarea,label,summary') : null;
        curEl.classList.remove('big', 'hover');
        if (!t) return;
        if (t.hasAttribute('data-cursor')) { curLabel.textContent = t.getAttribute('data-cursor'); curEl.classList.add('big'); }
        else curEl.classList.add('hover');
      });
      $$('.btn').forEach(function (b) {
        b.addEventListener('pointermove', function (e) {
          var r = b.getBoundingClientRect();
          b.style.setProperty('--tx', ((e.clientX - r.left - r.width / 2) * 0.16).toFixed(1) + 'px');
          b.style.setProperty('--ty', ((e.clientY - r.top - r.height / 2) * 0.26).toFixed(1) + 'px');
        });
        b.addEventListener('pointerleave', function () { b.style.setProperty('--tx', '0px'); b.style.setProperty('--ty', '0px'); });
      });
    }

    /* ---------- horizontal featured job ---------- */
    var hz = $('#work'), hzTrack = $('#hz-track'), hzFill = $('#hz-fill'), hzPct = $('#hz-pct'), hzOn = false, hzDist = 0;
    function measureHz() {
      hzOn = !still && W.matchMedia('(min-width: 1000px)').matches;
      if (!hzOn) { hz.style.height = ''; hzTrack.style.transform = ''; return; }
      hzDist = Math.max(0, hzTrack.scrollWidth - vw);
      hz.style.height = (hzDist * 0.7 + vh) + 'px';
    }
    function hzMobile() {
      var m = Math.max(1, hzTrack.scrollWidth - hzTrack.clientWidth), p = clamp(hzTrack.scrollLeft / m, 0, 1);
      hzFill.style.transform = 'scaleX(' + p.toFixed(3) + ')'; hzPct.textContent = Math.round(p * 100) + '%';
    }
    hzTrack.addEventListener('scroll', function () { if (!hzOn) hzMobile(); }, { passive: true });

    /* ---------- marquee ---------- */
    var mq = $$('[data-mq]').map(function (el) {
      var set = el.firstElementChild; el.appendChild(set.cloneNode(true)); el.appendChild(set.cloneNode(true));
      return { el: el, set: set, base: parseFloat(el.getAttribute('data-base')), k: parseFloat(el.getAttribute('data-k')), x: 0, w: 1 };
    });

    /* ---------- the stripe: real job footage, 173 frames drawn to canvas, scrubbed by scroll ---------- */
    var stS = $('#stripe'), stCv = $('#st-canvas'), stCtx = null, stN = 173, stF = [], stOk = [], stCur = 0, stDrawn = -1, stLoading = false, stW = 0, stH = 0;
    var stCaps = $$('.st-cap').map(function (el) { return { el: el, a: +el.getAttribute('data-a'), b: +el.getAttribute('data-b') }; }), stPct = $('#st-pct'), stFill = $('#st-fill'), stLastPct = -1;
    try { stCtx = stCv.getContext('2d'); } catch (e) { stCtx = null; }
    function stSrc(i) { return 'assets/jobs/stripe/' + ('00' + (i + 1)).slice(-3) + '.webp'; }
    function stLoad() {
      if (stLoading) return; stLoading = true;
      var order = [], seen = {};
      [24, 8, 4, 2, 1].forEach(function (step) { for (var i = 0; i < stN; i += step) if (!seen[i]) { seen[i] = 1; order.push(i); } });
      if (!seen[stN - 1]) order.push(stN - 1);
      var active = 0;
      function next() {
        while (active < 6 && order.length) {
          (function (i) {
            active++;
            var im = new Image(); im.decoding = 'async';
            im.onload = function () { stOk[i] = true; active--; if (i === 0) stS.classList.add('live'); stDrawn = -1; next(); };
            im.onerror = function () { active--; next(); };
            im.src = stSrc(i); stF[i] = im;
          })(order.shift());
        }
      }
      next();
    }
    function stSize() {
      if (!stCtx) return;
      var r = stCv.getBoundingClientRect(), k = Math.min(W.devicePixelRatio || 1, 2), w = Math.round(r.width * k), h = Math.round(r.height * k);
      if (w && h && (w !== stW || h !== stH)) { stW = stCv.width = w; stH = stCv.height = h; stDrawn = -1; }
    }
    function stDraw(i) {
      var j = -1;
      if (stOk[i]) j = i; else for (var k = 1; k < stN; k++) { if (i - k >= 0 && stOk[i - k]) { j = i - k; break; } if (i + k < stN && stOk[i + k]) { j = i + k; break; } }
      if (j < 0 || j === stDrawn || !stW) return;
      var im = stF[j], s = Math.max(stW / im.naturalWidth, stH / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s;
      stCtx.drawImage(im, (stW - w) / 2, (stH - h) / 2, w, h); stDrawn = j;
    }

    /* ---------- job files: cards stack and settle back ---------- */
    var jfCards = $$('.jf-card'), jfTops = [], pfClock = $('#pf-clock');

    /* ---------- the other scenes ---------- */
    var seal = $('#seal'), gl = $('#glass'), glStick = $('.gl-stick', gl), glPct = $('#gl-pct');
    var fw = $('#film'), fwWin = $('#fw-win'), fwL = $('#fw-l'), fwR = $('#fw-r'), fwCap = $('.fw-cap', fw);
    var rinse = $('#rinse'), rWater = $('#rinse-water'), rBub = $('#rinse-bub'), rWord = $('#rinse-word'), rStick = $('.rinse-stick', rinse), rLevel = 0;
    var stepsWrap = $('#steps'), steps = $$('.step', stepsWrap);
    var navLinks = $$('nav.primary a'), navSecs = navLinks.map(function (a) { return $(a.getAttribute('href')); });
    var tones = $$('[data-tone]'), toneBox = [];
    if (rBub) for (var b = 0; b < 26; b++) {
      var bi = d.createElement('i');
      bi.style.left = (Math.random() * 100).toFixed(1) + '%';
      bi.style.setProperty('--s', (6 + Math.random() * 26).toFixed(0) + 'px');
      bi.style.setProperty('--k', (0.5 + Math.random() * 0.9).toFixed(2));
      rBub.appendChild(bi);
    }

    function measure() {
      var nvw = W.innerWidth, nvh = W.innerHeight;
      if (nvw !== vw || Math.abs(nvh - vh) > 140) { vw = nvw; vh = nvh; } else vw = nvw;
      if (ctx) sizeCanvas();
      measureHz();
      mq.forEach(function (m) { m.w = Math.max(1, m.set.getBoundingClientRect().width); });
      var y0 = lenis ? lenis.scroll : W.pageYOffset;
      toneBox = tones.map(function (el) { var r = el.getBoundingClientRect(); return { el: el, a: r.top + y0, b: r.bottom + y0, light: el.getAttribute('data-tone') === 'light' }; });
      stSize();
      jfTops = jfCards.map(function (c) { return parseFloat(getComputedStyle(c).top) || 0; });
      lastY = -1; needDraw = true;
    }
    W.addEventListener('resize', measure);
    W.addEventListener('load', measure);

    function prog(el) { var r = el.getBoundingClientRect(), t = el.offsetHeight - vh; return t > 0 ? clamp(-r.top / t, 0, 1) : 0; }

    /* ---------- the loop ---------- */
    var lastY = -1, prevY = 0, lastDirY = 0, hdrHidden = false, vel = 0;
    measure();
    function tick(t) {
      if (lenis) lenis.raf(t);
      var y = lenis ? lenis.scroll : W.pageYOffset;
      vel = lerp(vel, y - prevY, 0.2); prevY = y;
      var scrolled = y !== lastY;

      /* the wash */
      if (!still && ctx && heroReady) {
        var r0 = wash.getBoundingClientRect();
        if (r0.bottom > 0) {
          var dp = prog(wash);
          var target = smooth(clamp(dp / 0.8, 0, 1));
          if (autoT0) target = Math.max(target, smooth(clamp((t - autoT0) / 4200, 0, 1)) * 0.07);
          wp = Math.abs(target - wp) < 0.0005 ? target : lerp(wp, target, 0.14);
          drawWash(wp, t);
          var io = 1 - smooth(dp / 0.07);
          washIntro.style.opacity = io.toFixed(3);
          washIntro.style.transform = 'translate3d(0,' + (-dp * 500).toFixed(1) + 'px,0)';
          washIntro.style.visibility = io < 0.01 ? 'hidden' : '';
          washCue.style.opacity = io.toFixed(3);
          var pc = wp * 100;
          for (var c = 0; c < caps.length; c++) {
            var cp = caps[c], o = smooth((pc - cp.a) / 5) * (1 - smooth((pc - cp.b + 5) / 5));
            if (cp.b >= 92) o = smooth((pc - cp.a) / 5) * (1 - smooth((dp - 0.8) / 0.05));
            o *= 1 - io; cp.el.style.opacity = o.toFixed(3);
            cp.el.style.transform = 'translate3d(0,' + ((1 - o) * 24).toFixed(1) + 'px,0)';
          }
          var clean = clamp(wp * 1.6 - 0.3, 0, 1), cl = Math.round(clean * 100);
          if (cl !== wpT) {
            wpT = cl; washPct.innerHTML = cl + '<sup>%</sup>'; washGauge.style.transform = 'scaleY(' + clean.toFixed(3) + ')';
            var st = stages[0][1]; for (var s = 0; s < stages.length; s++) if (cl >= stages[s][0]) st = stages[s][1];
            washStage.textContent = st;
          }
          var endOn = dp > 0.84;
          washEnd.classList.toggle('on', endOn); wash.classList.toggle('at-end', endOn);
          if (endOn && !washEnd._split) { washEnd._split = true; $$('[data-split]', washEnd).forEach(function (el) { el.classList.add('in'); }); }
        }
      }

      /* cursor */
      if (fine && !reduce) {
        rx = lerp(rx, cx, 0.18); ry = lerp(ry, cy, 0.18);
        curDot.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
        curRing.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
        if (sf) { sfx = lerp(sfx, sftx + 30, 0.12); sfy = lerp(sfy, sfty - 120, 0.12); sf.style.transform = 'translate3d(' + sfx.toFixed(1) + 'px,' + sfy.toFixed(1) + 'px,0)'; }
      }

      /* marquee: drifts on its own, faster with scroll speed */
      if (!still) mq.forEach(function (m) {
        m.x += m.base - Math.abs(vel) * 0.25 * m.k;
        if (m.x <= -m.w) m.x += m.w;
        m.el.style.transform = 'translate3d(' + m.x.toFixed(1) + 'px,0,0)';
      });

      /* the stripe */
      if (!still && stCtx) {
        var sr2 = stS.getBoundingClientRect();
        if (sr2.top < vh * 2.5 && sr2.bottom > -vh) stLoad();
        if (sr2.bottom > 0 && sr2.top < vh) {
          var spp = clamp(prog(stS) / 0.9, 0, 1), stT = spp * (stN - 1);
          stCur = Math.abs(stT - stCur) < 0.05 ? stT : lerp(stCur, stT, 0.2);
          stDraw(Math.round(stCur));
          for (var sc = 0; sc < stCaps.length; sc++) stCaps[sc].el.classList.toggle('on', spp >= stCaps[sc].a && spp < stCaps[sc].b);
          var spc = Math.round(spp * 100);
          if (spc !== stLastPct) { stLastPct = spc; stPct.textContent = spc + '%'; stFill.style.transform = 'scaleX(' + spp.toFixed(3) + ')'; }
        }
      }

      /* the rinse wave moves even when the page is still */
      if (!still && rinse) {
        var rr = rinse.getBoundingClientRect();
        if (rr.bottom > 0 && rr.top < vh) {
          var rp = prog(rinse); rLevel = smooth(clamp((rp - 0.05) / 0.7, 0, 1));
          var top = (1 - rLevel) * 108 - 4, amp = 3.2 * (1 - rLevel * 0.7), pts = [];
          for (var q = 0; q <= 24; q++) pts.push((q / 24 * 100).toFixed(2) + '% ' + (top + Math.sin(q * 0.75 + t * 0.003) * amp + Math.sin(q * 0.31 - t * 0.0017) * amp * 0.6).toFixed(2) + '%');
          rWater.style.clipPath = 'polygon(' + pts.join(',') + ',100% 100%,0% 100%)';
          rBub.style.setProperty('--rp', rLevel.toFixed(3));
          var lit = rLevel > 0.52;
          rStick.style.setProperty('--rc', lit ? 'var(--ink-d)' : '#fff');
          rStick.style.setProperty('--rcp', lit ? 'var(--muted-d)' : 'var(--muted)');
          if (rWord._lit !== lit) { rWord._lit = lit; rWord.textContent = lit ? 'Clean.' : 'Rinse.'; }
        }
      }

      if (scrolled) {
        lastY = y;
        var docH = Math.max(1, root.scrollHeight - vh);
        progress.style.transform = 'scaleX(' + clamp(y / docH, 0, 1).toFixed(4) + ')';

        /* header: glass when scrolled, hides going down, returns going up; light glass over clean sections */
        header.classList.toggle('is-scrolled', y > 40);
        if (Math.abs(y - lastDirY) > 8) {
          var hide = y > lastDirY && y > 400 && !mmenu.classList.contains('open');
          if (hide !== hdrHidden) { hdrHidden = hide; header.classList.toggle('is-hidden', hide); }
          lastDirY = y;
        }
        var probe = y + 50, onLight = false;
        for (var tb = 0; tb < toneBox.length; tb++) if (probe >= toneBox[tb].a && probe < toneBox[tb].b) { onLight = toneBox[tb].light || (toneBox[tb].el === rinse && rLevel > 0.6); }
        header.classList.toggle('on-light', onLight);
        mbar.classList.toggle('on', y > vh * 0.6);

        /* active nav link */
        var act = -1;
        for (var n = 0; n < navSecs.length; n++) { var nr = navSecs[n] && navSecs[n].getBoundingClientRect(); if (nr && nr.top < vh * 0.4 && nr.bottom > vh * 0.4) act = n; }
        navLinks.forEach(function (a, i) { a.classList.toggle('on', i === act); });

        if (!still) {
          /* manifesto words wash clean as you read */
          if (mfText) {
            var mr = mfText.getBoundingClientRect();
            if (mr.bottom > -50 && mr.top < vh + 50) {
              var mp = clamp((vh * 0.85 - mr.top) / (mr.height + vh * 0.3), 0, 1), litN = Math.round(mp * mfWords.length * 1.08);
              for (var w = 0; w < mfWords.length; w++) mfWords[w].classList.toggle('on', w < litN);
            }
          }
          /* the seal's shield washes as it comes up */
          if (seal) { var sr0 = seal.getBoundingClientRect(); seal.style.setProperty('--sp', smooth((vh - sr0.top) / (vh * 0.9)).toFixed(3)); }

          /* the glass */
          var gr0 = gl.getBoundingClientRect();
          if (gr0.bottom > 0 && gr0.top < vh) {
            var gp = smooth(clamp((prog(gl) - 0.06) / 0.8, 0, 1));
            glStick.style.setProperty('--gx', lerp(-4, 104, gp).toFixed(2) + '%');
            glPct.textContent = Math.round(gp * 100) + '%';
          }

          /* featured job */
          if (hzOn) {
            var hp = prog(hz);
            hzTrack.style.transform = 'translate3d(' + (-hp * hzDist).toFixed(1) + 'px,0,0)';
            hzFill.style.transform = 'scaleX(' + hp.toFixed(3) + ')'; hzPct.textContent = Math.round(hp * 100) + '%';
          }

          /* the film window opens */
          var fr = fw.getBoundingClientRect();
          if (fr.bottom > 0 && fr.top < vh) {
            var fp = prog(fw), op = smooth(clamp(fp / 0.55, 0, 1)), narrow = vw < 720;
            fwWin.style.setProperty('--wy', lerp(narrow ? 28 : 22, 0, op).toFixed(2) + '%');
            fwWin.style.setProperty('--wx', lerp(narrow ? 8 : 26, 0, op).toFixed(2) + '%');
            fwWin.style.setProperty('--wr', lerp(22, 0, op).toFixed(1) + 'px');
            fwWin.style.setProperty('--ws', lerp(1.25, 1, op).toFixed(3));
            fwWin.style.setProperty('--wd', (0.5 * smooth((fp - 0.45) / 0.2)).toFixed(3));
            fwCap.style.setProperty('--wc', smooth((fp - 0.5) / 0.18).toFixed(3));
            fwL.style.transform = 'translate3d(' + (-op * 40) + 'vw,' + (narrow ? 0 : -50) + '%,0)'; fwL.style.opacity = (1 - op).toFixed(3);
            fwR.style.transform = 'translate3d(' + (op * 40) + 'vw,' + (narrow ? 0 : -50) + '%,0)'; fwR.style.opacity = (1 - op).toFixed(3);
          }

          /* job files: each card shrinks and dims a touch as the next one slides over it */
          for (var jc = 0; jc < jfCards.length - 1; jc++) {
            var nt = jfCards[jc + 1].getBoundingClientRect().top, jt = clamp((vh - nt) / Math.max(1, vh - jfTops[jc]), 0, 1);
            jfCards[jc].style.setProperty('--js', (1 - 0.06 * jt).toFixed(4));
            jfCards[jc].style.setProperty('--jb', (1 - 0.14 * jt).toFixed(3));
          }
          /* the six-minute clock fills */
          if (pfClock) { var pc0 = pfClock.getBoundingClientRect(); pfClock.style.setProperty('--ck', smooth((vh * 0.9 - pc0.top) / (vh * 0.45)).toFixed(3)); }

          /* process line fills */
          var sr1 = stepsWrap.getBoundingClientRect(), spf = clamp((vh * 0.75 - sr1.top) / (sr1.height + vh * 0.2), 0, 1);
          stepsWrap.style.setProperty('--sf', spf.toFixed(3));
          steps.forEach(function (st, i) { st.classList.toggle('on', spf >= i / steps.length + 0.02); });
        }
      }
      W.requestAnimationFrame(tick);
    }
    W.requestAnimationFrame(tick);
    if (still) { steps.forEach(function (st) { st.classList.add('on'); }); if (stepsWrap) stepsWrap.style.setProperty('--sf', 1); }

    /* ---------- drag to wash ---------- */
    $$('[data-cmp]').forEach(function (box) {
      var range = $('.cmp-range', box), glowT = 0;
      function set(v) { box.style.setProperty('--x', v + '%'); }
      range.addEventListener('input', function () { set(range.value); box.style.setProperty('--glow', 1); clearTimeout(glowT); glowT = setTimeout(function () { box.style.setProperty('--glow', 0); }, 500); });
      set(range.value);
      if (!still && 'IntersectionObserver' in W) {
        var once = new IntersectionObserver(function (es) {
          if (!es[0].isIntersecting) return; once.disconnect();
          var t0 = performance.now();
          (function sweep(now) {
            var k = smooth((now - t0) / 1800), v = lerp(90, 42, k);
            range.value = v; set(v.toFixed(1)); box.style.setProperty('--glow', (1 - k).toFixed(2));
            if (k < 1) W.requestAnimationFrame(sweep);
          })(t0);
        }, { threshold: 0.5 });
        once.observe(box);
      }
    });

    /* ---------- film player ---------- */
    var player = $('#player'), pv = $('#player-video'), cuts = { hero: 'premier-hero-90s', '30': 'premier-cut-30s', '15': 'premier-cut-15s' };
    function loadCut(k) {
      pv.poster = '../media/video/' + cuts[k] + '.jpg?v=7'; pv.src = '../media/video/' + cuts[k] + '.mp4?v=7';
      $$('.tabs button', player).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-cut') === k ? 'true' : 'false'); });
      var p = pv.play(); if (p && p.catch) p.catch(function () {});
    }
    $$('[data-film]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (player.showModal) player.showModal(); else player.setAttribute('open', '');
        if (lenis) lenis.stop(); loadCut(b.getAttribute('data-film'));
      });
    });
    $$('.tabs button', player).forEach(function (b) { b.addEventListener('click', function () { loadCut(b.getAttribute('data-cut')); }); });
    function closePlayer() { pv.pause(); if (player.close) player.close(); else player.removeAttribute('open'); }
    $('#player-x').addEventListener('click', closePlayer);
    player.addEventListener('click', function (e) { if (e.target === player) closePlayer(); });
    player.addEventListener('close', function () { pv.pause(); if (lenis) lenis.start(); });

    /* ---------- reels: tap to play with sound ---------- */
    var reelVids = $$('.reel video');
    $$('.reel-play').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = $('video', btn.parentNode);
        reelVids.forEach(function (o) { if (o !== v) o.pause(); });
        if (!v.getAttribute('src')) v.src = v.getAttribute('data-src');
        v.controls = true; btn.hidden = true;
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      });
    });

    /* ---------- brand sign-off stage ---------- */
    var signV = $$('#brand video'), signBtns = $$('[data-sign]'), signSound = $('#sign-sound'), signCur = 0, signMuted = true;
    function playSign(i) {
      signCur = i;
      signV.forEach(function (v, k) { v.classList.toggle('on', k === i); if (k !== i) v.pause(); });
      signBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      var v = signV[i]; if (!v.getAttribute('src')) v.src = v.getAttribute('data-src');
      v.muted = signMuted; try { v.currentTime = 0; } catch (e) {}
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
    signBtns.forEach(function (b, k) { b.addEventListener('click', function () { playSign(k); }); });
    signSound.addEventListener('click', function () {
      signMuted = !signMuted; signV[signCur].muted = signMuted;
      signSound.setAttribute('aria-pressed', signMuted ? 'false' : 'true'); signSound.textContent = signMuted ? 'Sound on' : 'Sound off';
      if (!signMuted) { var p = signV[signCur].play(); if (p && p.catch) p.catch(function () {}); }
    });
    if (!still && 'IntersectionObserver' in W) {
      var sio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { sio.disconnect(); playSign(0); } }, { threshold: 0.5 });
      sio.observe($('.sign-stage'));
    }

    /* ---------- estimate wizard (preview: nothing is sent) ---------- */
    var wiz = $('#wiz'), form = $('#wiz-form'), sets = $$('fieldset', form), dots = $$('.wiz-dots i', form), stepLbl = $('#wiz-step'), back = $('#wiz-back'), next = $('#wiz-next'), err = $('#wiz-err'), cur = 0;
    function show(i) {
      cur = i;
      sets.forEach(function (f, k) { f.classList.toggle('on', k === i); });
      dots.forEach(function (o, k) { o.classList.toggle('on', k <= i); });
      stepLbl.textContent = 'Step ' + (i + 1) + ' of ' + sets.length;
      back.hidden = i === 0;
      next.innerHTML = i === sets.length - 1 ? 'Get My Free Estimate' : 'Next <span class="arrow" aria-hidden="true">&rarr;</span>';
      err.textContent = '';
    }
    back.addEventListener('click', function () { if (cur > 0) show(cur - 1); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (cur === 0 && !$$('input[name="service"]:checked', form).length) { err.textContent = 'Pick at least one thing to wash.'; return; }
      if (cur < sets.length - 1) { show(cur + 1); var f = $('input,select', sets[cur]); if (f) try { f.focus({ preventScroll: true }); } catch (x) {} return; }
      var nm = form.elements.name.value.trim(), ph = form.elements.phone.value.replace(/\D/g, '');
      if (!nm) { err.textContent = 'Please add your name.'; form.elements.name.focus(); return; }
      if (ph.length < 10) { err.textContent = 'Please add a phone number we can reach you on.'; form.elements.phone.focus(); return; }
      $('#wiz-name').textContent = ', ' + nm.split(' ')[0];
      wiz.classList.add('done');
    });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
