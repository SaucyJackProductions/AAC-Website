/* Above All Media — the live logo.
   The same choreography as the logo intro film, built from the real logo artwork and driven by GSAP:
   the lighthouse rises with an overshoot, the lantern lights, its beam sweeps the dark, ABOVE ALL wipes in
   behind a gold edge, MEDIA rises, and a gold shimmer crosses the letters.
   It opens the site in the loader, then hands off to the header logo, which answers hover and tap.
   Without GSAP, or with reduced motion, the plain logo shows and nothing moves. */
(function () {
  'use strict';
  var W = window, d = document, root = d.documentElement;
  var gsap = W.gsap;
  var still = root.classList.contains('still');

  /* the artwork is 518x213: tower = x<120 or (x<165 and y<66); ABOVE ALL = y<128; MEDIA = y>=128 */
  var ABOVE_ON = 'polygon(31.85% 0%, 100% 0%, 100% 60.1%, 23.17% 60.1%, 23.17% 31%, 31.85% 31%)';
  var ABOVE_OFF = 'polygon(23.17% 0%, 23.17% 0%, 23.17% 60.1%, 23.17% 60.1%, 23.17% 31%, 23.17% 31%)';

  /* turn a plain <img> logo into the layered live logo, keeping the original image as the base for no-JS */
  function build(host, img) {
    var src = img.currentSrc || img.src, set = img.getAttribute('srcset') || '';
    host.classList.add('aam-logo');
    function layer(cls) {
      var i = d.createElement('img'); i.src = src; if (set) i.setAttribute('srcset', set);
      i.alt = ''; i.className = cls; i.setAttribute('aria-hidden', 'true'); i.decoding = 'async'; return i;
    }
    function span(cls, inner) { var s = d.createElement('span'); s.className = cls; s.setAttribute('aria-hidden', 'true'); if (inner) s.appendChild(d.createElement('i')); return s; }
    var beam = span('aam-beam', true), wrap = span('aam-tw'), tower = layer('aam-tower'), above = layer('aam-above'), media = layer('aam-media');
    var glow = span('aam-glow'), edge = span('aam-edge'), shine = span('aam-shine');
    shine.style.setProperty('--logo', 'url("' + src + '")');
    wrap.appendChild(tower);
    img.classList.add('aam-base');
    [beam, wrap, above, media, glow, edge, shine].forEach(function (n) { host.appendChild(n); });
    host.classList.add('aam-live');
    return { host: host, beam: beam.firstChild, tower: tower, above: above, media: media, glow: glow, edge: edge, shine: shine };
  }

  /* the full build, as in the film */
  function intro(L) {
    var tl = gsap.timeline({ paused: true, defaults: { overwrite: 'auto' } });
    tl.set(L.host, { '--on': 1 })
      .fromTo(L.tower, { yPercent: 105, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1, ease: 'back.out(1.5)' }, 0.2)
      .fromTo(L.glow, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'power2.out' }, 1.05)
      .fromTo(L.beam, { autoAlpha: 0, rotation: -160 }, { autoAlpha: 1, rotation: -20, duration: 3.2, ease: 'expo.out' }, 1.05)
      .fromTo(L.above, { clipPath: ABOVE_OFF }, { clipPath: ABOVE_ON, duration: 0.9, ease: 'expo.out' }, 1.5)
      .fromTo(L.edge, { left: '24%', autoAlpha: 0 }, { left: '101%', autoAlpha: 1, duration: 0.9, ease: 'expo.out' }, 1.5)
      .to(L.edge, { autoAlpha: 0, duration: 0.25 }, 2.25)
      .fromTo(L.media, { yPercent: 18, autoAlpha: 0, scaleX: 1.08 }, { yPercent: 0, autoAlpha: 1, scaleX: 1, duration: 0.65, ease: 'power3.out' }, 2.2)
      .fromTo(L.shine, { '--sx': '-60%' }, { '--sx': '160%', duration: 1, ease: 'power2.inOut' }, 2.9)
      .to(L.beam, { autoAlpha: 0.45, duration: 0.8 }, 3.4);
    return tl;
  }

  /* a short answer to hover or tap: the lantern flares, the beam sweeps, the shimmer passes */
  function flourish(L) {
    var tl = gsap.timeline({ paused: true, defaults: { overwrite: 'auto' } });
    tl.fromTo(L.glow, { autoAlpha: 0.5, scale: 0.7 }, { autoAlpha: 1, scale: 1.25, duration: 0.35, ease: 'power2.out' }, 0)
      .to(L.glow, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)' }, 0.35)
      .fromTo(L.beam, { autoAlpha: 0, rotation: -160 }, { autoAlpha: 1, rotation: -20, duration: 1.6, ease: 'expo.out' }, 0)
      .to(L.beam, { autoAlpha: 0, duration: 0.6 }, 1.3)
      .fromTo(L.shine, { '--sx': '-60%' }, { '--sx': '160%', duration: 0.9, ease: 'power2.inOut' }, 0.15)
      .fromTo(L.tower, { yPercent: 0 }, { yPercent: -4, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 }, 0);
    return tl;
  }

  var loaderLogo = null, headerLogo = null, introTl = null, introEnd = 0;

  function setup() {
    if (still || !gsap) return;

    /* ---------- the loader: the full build opens the site ---------- */
    var lm = d.getElementById('ld-logo');
    if (lm && lm.querySelector('img')) {
      loaderLogo = build(lm, lm.querySelector('img'));
      introTl = intro(loaderLogo);
      var seen = false; try { seen = sessionStorage.getItem('aamIntro') === '1'; sessionStorage.setItem('aamIntro', '1'); } catch (e) {}
      if (seen) introTl.timeScale(1.9);                /* a returning visitor in the same visit gets the quick cut */
      introEnd = performance.now() + (3.5 / introTl.timeScale()) * 1000;
      introTl.play(0);
    }

    /* ---------- the header logo: idles with a living lantern, answers hover and tap ---------- */
    var hl = d.querySelector('#site-header .logo'), himg = hl && hl.querySelector('img');
    if (hl && himg) {
      var go = function () {
        if (headerLogo) return;
        headerLogo = build(hl, himg);
        var fl = flourish(headerLogo);
        hl.classList.add('aam-small');
        gsap.set([headerLogo.tower, headerLogo.media], { autoAlpha: 1 });
        gsap.set(headerLogo.above, { clipPath: ABOVE_ON });
        gsap.set(headerLogo.glow, { autoAlpha: 0.75 });
        /* the lantern breathes */
        gsap.to(headerLogo.glow, { autoAlpha: 0.45, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.5 });
        var fine = W.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (fine) hl.addEventListener('mouseenter', function () { fl.restart(); });
        hl.addEventListener('pointerdown', function () { fl.restart(); }, { passive: true });
        hl.addEventListener('focus', function () { fl.restart(); });
        /* the hand-off: when the loader lifts, the header logo catches the light */
        var hand = function () { setTimeout(function () { fl.restart(); }, 900); };
        if (root.classList.contains('loaded')) hand();
        else { var mo = new MutationObserver(function () { if (root.classList.contains('loaded')) { mo.disconnect(); hand(); } }); mo.observe(root, { attributes: true, attributeFilter: ['class'] }); }
      };
      if (himg.complete) go(); else himg.addEventListener('load', go, { once: true });
    }
  }

  /* the engine asks how long to hold the loader so the logo can finish (capped so a slow device never waits long) */
  W.__aamLogoWait = function () { return introTl ? Math.min(2600, Math.max(0, introEnd - performance.now())) : 0; };

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', setup); else setup();
})();
