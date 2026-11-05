/* Above All Media — GSAP motion layer.
   Sits on top of the v5 engine in index.html: Lenis keeps driving the scroll, ScrollTrigger listens to it.
   Everything here is an enhancement. If GSAP fails to load, or the visitor prefers reduced motion
   (html.still), nothing runs and the page stays exactly as the engine renders it. */
(function () {
  'use strict';
  var W = window, d = document, root = d.documentElement;
  if (!W.gsap || !W.ScrollTrigger || root.classList.contains('still')) return;
  var gsap = W.gsap, ST = W.ScrollTrigger, Split = W.SplitText || null;
  gsap.registerPlugin(ST); if (Split) gsap.registerPlugin(Split);
  ST.config({ ignoreMobileResize: true });

  /* one house curve family: fast out, long settle; "pop" carries a small overshoot for touch feedback */
  var EASE = 'expo.out', SOFT = 'power3.out', POP = 'back.out(2.2)';
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  /* the hero descent, the estate film, the Sky Caddy choice card and dialogs choreograph themselves */
  function skip(el) { return !!el.closest('#top,.est-film,dialog,[hidden],.sc-choice,.mmenu'); }

  var started = false;
  function init() {
    if (started) return; started = true;
    root.classList.add('gs');
    var lenis = W.__aamLenis;
    if (lenis && lenis.on) lenis.on('scroll', ST.update);

    var mm = gsap.matchMedia();
    mm.add({
      desk: '(min-width: 1000px)',
      mob: '(max-width: 999px)',
      fine: '(hover: hover) and (pointer: fine)'
    }, function (ctx) {
      var c = ctx.conditions, desk = c.desk;
      var rise = desk ? 1 : 0.7;           /* phones travel less and finish sooner */

      /* ---------- headlines (data-split words from the engine): masked rise with a slight lean ---------- */
      $$('[data-split]').forEach(function (h) {
        if (skip(h)) return;
        var ws = $$('.wd>i', h); if (!ws.length) return;
        h.classList.add('gx');
        gsap.fromTo(ws, { y: 0, yPercent: 118, rotate: desk ? 6 : 3, transformOrigin: '0% 100%' }, {
          yPercent: 0, rotate: 0, duration: 1.35 * rise + 0.25, ease: EASE, stagger: desk ? 0.07 : 0.05,
          scrollTrigger: { trigger: h, start: 'top 88%', once: true }
        });
      });

      /* ---------- headings the engine leaves alone: SplitText words ---------- */
      if (Split) {
        var heads = $$('#sc-title, .est-offer-cta .est-big, .hz-end h3, .step h3' + (desk ? '' : ', .hz-copy h3'));
        heads.forEach(function (h) {
          if (h.closest('#top,.est-film,dialog,[hidden]')) return;
          if (h.id === 'sc-title') return;  /* handled with the choice card below */
          wordRise(h, { scrollTrigger: { trigger: h, start: 'top 90%', once: true } }, rise, desk);
        });

        /* ---------- intro paragraphs: line-by-line masked reveal ---------- */
        $$('.lede, .sc-lede').forEach(function (p) {
          if (skip(p)) return;
          p.classList.add('gx');
          Split.create(p, {
            type: 'lines', mask: 'lines', linesClass: 'gl', autoSplit: true,
            onSplit: function (self) {
              if (p._gsDone) return;
              return gsap.from(self.lines, {
                yPercent: 105, duration: 1.1 * rise + 0.2, ease: EASE, stagger: 0.085,
                delay: (+(p.style.getPropertyValue('--d')) || 0) * 0.08,
                scrollTrigger: { trigger: p, start: 'top 90%', once: true },
                onComplete: function () { p._gsDone = 1; self.revert(); }
              });
            }
          });
        });
      }

      /* ---------- kickers: a wipe left to right ---------- */
      $$('.kicker, .section-kicker').forEach(function (k) {
        if (skip(k)) return;
        gsap.fromTo(k, { clipPath: 'inset(0 100% 0 0)' }, {
          clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power3.inOut',
          scrollTrigger: { trigger: k, start: 'top 92%', once: true },
          onComplete: function () { gsap.set(k, { clearProps: 'clipPath' }); }
        });
      });

      /* ---------- images and films: iris open on desktop, curtain rise on phones; the picture settles from a push-in ---------- */
      var ab = d.querySelector('.ab-grid'), abImg = d.querySelector('.ab-img');
      var abPin = desk && ab && abImg && ab.offsetHeight - abImg.offsetHeight > 120 && abImg.offsetHeight < W.innerHeight * 0.8;
      var media = '.gc-grid figure, .ab-img, .est-shot, .est-compare, .gc-film, .gc-band' + (desk ? '' : ', .hz-media');
      $$(media).forEach(function (m, i) {
        if (skip(m) || (abPin && m === abImg)) return;
        m.classList.add('gx-clip');
        var dd = (+(m.getAttribute('data-d')) || +(m.style.getPropertyValue('--d')) || 0) * 0.12;
        gsap.fromTo(m,
          { clipPath: desk ? 'inset(12% 9% 12% 9%)' : 'inset(100% 0% 0% 0%)', '--gz': desk ? 1.28 : 1.18 },
          {
            clipPath: 'inset(0% 0% 0% 0%)', '--gz': 1, duration: desk ? 1.7 : 1.25, ease: EASE, delay: dd,
            scrollTrigger: { trigger: m, start: desk ? 'top 86%' : 'top 92%', once: true },
            onComplete: function () { gsap.set(m, { clearProps: 'clipPath' }); }
          });
      });

      /* ---------- staggered lists ---------- */
      [['.svc-list .svc-row', 0.08], ['.ab-list li', 0.09], ['.ct-side > .rv:not(.lede)', 0.1], ['.gc-acts .btn', 0.1], ['.feed-phones .phone', 0.14]].forEach(function (g) {
        var els = $$(g[0]).filter(function (e) { return !skip(e); });
        if (!els.length) return;
        els.forEach(function (e) { e.classList.add('gx'); });
        gsap.set(els, { autoAlpha: 0 });
        ST.batch(els, {
          start: 'top 90%', once: true,
          onEnter: function (b) { gsap.fromTo(b, { autoAlpha: 0, y: 36 * rise }, { autoAlpha: 1, y: 0, duration: 1.1, ease: EASE, stagger: g[1], overwrite: true }); }
        });
      });

      /* ---------- scrubbed scenes ---------- */
      /* the showreel grows into place as it arrives */
      var reel = d.getElementById('showreel');
      if (reel) gsap.fromTo(reel, { scale: desk ? 0.84 : 0.92, '--rr': desk ? '22px' : '14px' }, {
        scale: 1, '--rr': '4px', ease: 'none',
        scrollTrigger: { trigger: reel, start: 'top bottom', end: desk ? 'center 60%' : 'top 30%', scrub: 0.8 }
      });
      /* the two feed phones drift apart in depth */
      if (desk) $$('.feed-phones .phone').forEach(function (p, i) {
        gsap.fromTo(p, { yPercent: i ? 14 : -4 }, { yPercent: i ? -10 : 6, ease: 'none', scrollTrigger: { trigger: p.parentNode, start: 'top bottom', end: 'bottom top', scrub: 1 } });
      });
      /* contact heading settles in as the section rises */
      var ct = d.getElementById('contact-title');
      if (ct) gsap.fromTo(ct, { letterSpacing: desk ? '0.02em' : '0.01em' }, { letterSpacing: '-0.01em', ease: 'none', scrollTrigger: { trigger: ct, start: 'top bottom', end: 'top 40%', scrub: 1 } });

      /* ---------- pinned scene: About (desktop with room for it) ---------- */
      if (abPin) {
        abImg.classList.add('gx-clip');
        var tl = gsap.timeline({
          /* the picture holds while the story scrolls past it, opening as it goes */
          scrollTrigger: { trigger: abImg, start: 'center center', end: function () { var a = ab.getBoundingClientRect(), b = abImg.getBoundingClientRect(); return '+=' + Math.max(160, Math.min(a.bottom - b.bottom + (W.innerHeight - b.height) / 2, a.height - b.height)); }, pin: true, pinSpacing: false, scrub: 0.9, invalidateOnRefresh: true }
        });
        tl.fromTo(abImg, { clipPath: 'inset(0% 34% 0% 34%)', '--gz': 1.4 }, { clipPath: 'inset(0% 0% 0% 0%)', '--gz': 1, ease: 'power2.inOut', duration: 1 })
          .fromTo(abImg.querySelector('figcaption') || {}, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.7);
      }

      /* ---------- the Sky Caddy choice card: plays each time the ball breaks the screen ---------- */
      var sc = d.getElementById('skycaddy'), scTitle = d.getElementById('sc-title');
      if (sc && scTitle) {
        var scTl = gsap.timeline({ paused: true });
        var card = sc.querySelector('.sc-card'), kick = card && card.querySelector('.section-kicker');
        if (kick) scTl.fromTo(kick, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power3.inOut' }, 0.1);
        if (Split) {
          var sw = splitWords(scTitle);
          scTl.fromTo(sw, { yPercent: 115, rotate: 4, transformOrigin: '0% 100%' }, { yPercent: 0, rotate: 0, duration: 1.2, ease: EASE, stagger: 0.06 }, 0.2);
        }
        var lede = sc.querySelector('.sc-lede');
        if (lede) scTl.fromTo(lede, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1, ease: SOFT }, 0.55);
        scTl.fromTo($$('.sc-path', sc), { autoAlpha: 0, y: 34 * rise, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.95, ease: POP, stagger: 0.09 }, 0.7);
        var rp = d.getElementById('sc-replay');
        if (rp) scTl.fromTo(rp, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 1.1);
        var was = false;
        function syncSc() {
          var on = sc.classList.contains('is-broken');
          if (on && !was) scTl.restart(); else if (!on && was) scTl.pause(0);
          was = on;
        }
        new MutationObserver(syncSc).observe(sc, { attributes: true, attributeFilter: ['class'] });
        scTl.progress(sc.classList.contains('is-broken') ? 1 : 0); was = sc.classList.contains('is-broken');
      }

      /* ---------- header arrives once the site opens ---------- */
      var hdr = $$('#site-header .logo, #site-nav a, #site-header .hdr-right > *').filter(function (e) { return e.offsetParent !== null; });
      if (hdr.length && !root.classList.contains('ready')) {
        gsap.set(hdr, { autoAlpha: 0, y: -14 });
        var hdrIn = function () { gsap.to(hdr, { autoAlpha: 1, y: 0, duration: 1, ease: EASE, stagger: 0.05, delay: 0.25, clearProps: 'opacity,visibility,transform' }); };
        var hm = new MutationObserver(function () { if (root.classList.contains('ready')) { hm.disconnect(); hdrIn(); } });
        hm.observe(root, { attributes: true, attributeFilter: ['class'] });
        setTimeout(function () { if (!root.classList.contains('ready')) { hm.disconnect(); hdrIn(); } }, 5000);
      }

      /* ---------- micro-interactions: buttons and cards answer the touch ---------- */
      var tappables = $$('.btn, .sc-path, .gc-more-btn, .fl-go, .ct-tel, .phone, .sc-replay, .sc-skip, .music-btn');
      var offs = [];
      tappables.forEach(function (b) {
        var hold = c.fine ? 0.955 : 0.94;
        function down() { gsap.to(b, { scale: hold, duration: 0.16, ease: 'power2.out', overwrite: 'auto' }); }
        function up() { gsap.to(b, { scale: 1, duration: 0.65, ease: 'elastic.out(1.1, 0.45)', overwrite: 'auto' }); }
        b.addEventListener('pointerdown', down, { passive: true });
        b.addEventListener('pointerup', up, { passive: true });
        b.addEventListener('pointercancel', up, { passive: true });
        b.addEventListener('pointerleave', up, { passive: true });
        offs.push(function () { b.removeEventListener('pointerdown', down); b.removeEventListener('pointerup', up); b.removeEventListener('pointercancel', up); b.removeEventListener('pointerleave', up); });
      });

      /* desktop: the gold arrow leads on hover, cards tilt toward the pointer */
      if (c.fine) {
        $$('.btn .arrow').forEach(function (a) {
          var b = a.closest('.btn');
          function on() { gsap.to(a, { x: 6, duration: 0.45, ease: POP }); }
          function off() { gsap.to(a, { x: 0, duration: 0.5, ease: SOFT }); }
          b.addEventListener('mouseenter', on); b.addEventListener('mouseleave', off);
          offs.push(function () { b.removeEventListener('mouseenter', on); b.removeEventListener('mouseleave', off); });
        });
        $$('.sc-path, .hz-card .hz-media, .phone').forEach(function (cd) {
          var rx = gsap.quickTo(cd, 'rotationX', { duration: 0.6, ease: SOFT }), ry = gsap.quickTo(cd, 'rotationY', { duration: 0.6, ease: SOFT });
          gsap.set(cd, { transformPerspective: 900 });
          function mv(e) { var r = cd.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 7); rx(-((e.clientY - r.top) / r.height - 0.5) * 6); }
          function lv() { rx(0); ry(0); }
          cd.addEventListener('mousemove', mv); cd.addEventListener('mouseleave', lv);
          offs.push(function () { cd.removeEventListener('mousemove', mv); cd.removeEventListener('mouseleave', lv); });
        });
      }

      /* the hidden half of the golf grid: re-measure when it opens */
      var more = d.querySelector('.gc-more-btn');
      function reMeasure() { setTimeout(function () { ST.refresh(); }, 60); }
      if (more) more.addEventListener('click', reMeasure);

      return function () { offs.forEach(function (f) { f(); }); if (more) more.removeEventListener('click', reMeasure); };
    });

    ST.sort();
    W.addEventListener('load', function () { ST.refresh(); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ST.refresh(); });
  }

  /* SplitText words for headings that carry gold <em>/.grad text: each word keeps the gold on its own */
  function splitWords(h) {
    var s = Split.create(h, { type: 'words', mask: 'words', wordsClass: 'gw', aria: 'auto' });
    s.words.forEach(function (w) { if (w.closest('em, .grad')) w.classList.add('gw-g'); });
    $$('em, .grad', h).forEach(function (g) { g.classList.add('gs-split'); });
    return s.words;
  }
  function wordRise(h, vars, rise, desk) {
    var ws = splitWords(h);
    return gsap.fromTo(ws, { yPercent: 115, rotate: desk ? 5 : 3, transformOrigin: '0% 100%' },
      Object.assign({ yPercent: 0, rotate: 0, duration: 1.3 * rise + 0.25, ease: EASE, stagger: 0.06 }, vars));
  }

  /* boot() in the engine runs on DOMContentLoaded first and creates Lenis; this runs right after it */
  if (d.readyState === 'complete') init();
  else { d.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); }); W.addEventListener('load', init); }
})();
