/* The Legacy Project - homepage scenes.
   1. Book: turns to the back cover and returns to the front when the page opens.
   2. Laptop: the lid opens as it scrolls into view; a film excerpt plays in black and white.
   3. Founder: full-length 360 degree turn, a pause, then again, while in view.
   4. Family: ten-second time-lapse, one portrait in 1946 to about eighty people in 2026.
   5. "Read a Sample Chapter" comes forward over the paragraph as it passes, then settles.
   6. The 36 names swirl like a tornado and settle into place.
   7. Envelopes spin away below "Notify me at launch": EMAIL DISPATCHED.
   8. "Why now": a window closes as it scrolls in; the text stays visible through the glass.
   Plain JavaScript, no dependencies. Without JavaScript every scene shows a still
   image. With reduced motion nothing moves until the visitor presses a button. */
(function () {
  'use strict';
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hasIO = 'IntersectionObserver' in window;

  function watch(el, threshold, cb, margin) {
    if (!hasIO) { cb(true); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { cb(e.isIntersecting && e.intersectionRatio >= threshold); });
    }, { threshold: [0, threshold], rootMargin: margin || '0px' });
    io.observe(el);
  }
  function preload(urls, done) {
    var left = urls.length, imgs = [];
    urls.forEach(function (u, i) {
      var im = new Image(); im.decoding = 'async';
      im.onload = im.onerror = function () { if (--left === 0 && done) done(imgs); };
      im.src = u; imgs[i] = im;
    });
    return imgs;
  }
  function frameUrls(el) {
    var n = parseInt(el.getAttribute('data-count'), 10) || 0, pat = el.getAttribute('data-src') || '', list = el.getAttribute('data-names');
    var names = list ? list.split(',') : [];
    var out = [];
    for (var i = 0; i < n; i++) out.push(pat.replace('{n}', names[i] || String(i + 1).padStart(2, '0')));
    return out;
  }

  /* ---------- 1. Book turn ---------- */
  var book = document.getElementById('wwf-book');
  if (book) {
    var bookBody = book.querySelector('.book3d-body'), bookShadow = book.querySelector('.book3d-shadow');
    var turnBtn = document.getElementById('wwf-book-turn'), showingBack = false, bookAnim = null;
    book.classList.add('book3d-js');
    if (turnBtn) turnBtn.hidden = false;
    var spinBook = function () {
      if (reduce || !bookBody.animate) {
        showingBack = !showingBack;
        bookBody.style.transform = showingBack ? 'rotateY(180deg)' : '';
        if (turnBtn) turnBtn.textContent = showingBack ? 'Show the front cover' : 'Show the back cover';
        return;
      }
      if (bookAnim && bookAnim.playState === 'running') return;
      var e = 'cubic-bezier(.6,.02,.3,1)', D = 6200;
      bookAnim = bookBody.animate([
        { transform: 'translateY(0) rotateY(0deg)', easing: e },
        { transform: 'translateY(-10px) rotateY(180deg)', offset: 0.25 },
        { transform: 'translateY(-10px) rotateY(180deg)', offset: 0.7, easing: e },
        { transform: 'translateY(0) rotateY(360deg)' }
      ], { duration: D });
      if (bookShadow && bookShadow.animate) bookShadow.animate([
        { transform: 'scaleX(1)', opacity: 1 }, { transform: 'scaleX(.3)', opacity: .7, offset: 0.125 },
        { transform: 'scaleX(.92)', opacity: .85, offset: 0.25 }, { transform: 'scaleX(.92)', opacity: .85, offset: 0.7 },
        { transform: 'scaleX(.3)', opacity: .7, offset: 0.85 }, { transform: 'scaleX(1)', opacity: 1 }
      ], { duration: D });
    };
    if (turnBtn) turnBtn.addEventListener('click', spinBook);
    bookBody.addEventListener('click', spinBook);
    if (!reduce) {
      var front = book.querySelector('.book3d-front'), backImg = book.querySelector('.book3d-back');
      var ready = function (im) { return !im || (im.complete && im.naturalWidth > 0); };
      var started = false, seen = false, loaded = false;
      var start = function () {
        if (started || !seen || !loaded || document.hidden) return;
        started = true; setTimeout(spinBook, 900);
      };
      watch(book, 0.6, function (v) { seen = v; start(); });
      document.addEventListener('visibilitychange', start);
      var poll = function (tries) { if (ready(front) && ready(backImg)) { loaded = true; start(); } else if (tries < 80) setTimeout(function () { poll(tries + 1); }, 100); };
      poll(0);
    }
  }

  /* ---------- 2. Laptop with a film excerpt ---------- */
  var lap = document.getElementById('legacy-laptop');
  if (lap) {
    var vid = lap.querySelector('video'), lapBtn = lap.querySelector('.lt-toggle');
    var lapOpen = reduce ? 1 : 0, lapIn = false, userPaused = false, userStarted = false;
    lap.classList.add('lt-js');
    var setOpen = function (p) { lapOpen = p; lap.style.setProperty('--open', p.toFixed(3)); };
    var label = function () { if (lapBtn) lapBtn.textContent = vid.paused ? 'Play film' : 'Pause film'; };
    var sync = function () {
      var want = lapIn && !document.hidden && !userPaused && lapOpen > 0.97 && (!reduce || userStarted);
      if (want && vid.paused) {
        if (vid.preload === 'none') vid.preload = 'auto';
        var pr = vid.play(); if (pr && pr.catch) pr.catch(function () { label(); });
      } else if (!want && !vid.paused) vid.pause();
    };
    if (lapBtn) {
      lapBtn.hidden = false;
      lapBtn.addEventListener('click', function () {
        if (vid.paused) { userPaused = false; userStarted = true; setOpen(Math.max(lapOpen, 1)); sync(); }
        else { userPaused = true; vid.pause(); }
      });
    }
    vid.addEventListener('play', label); vid.addEventListener('pause', label);
    if (reduce) setOpen(1);
    else {
      var ticking = false;
      var upd = function () {
        ticking = false;
        var r = lap.getBoundingClientRect(), vh = window.innerHeight, c = r.top + r.height / 2;
        var p = Math.max(0, Math.min(1, (vh * 0.98 - c) / (vh * 0.26)));
        setOpen(1 - Math.pow(1 - p, 3)); sync();
      };
      window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
      window.addEventListener('resize', upd);
      upd();
    }
    watch(lap, 0.35, function (v) { lapIn = v; sync(); });
    document.addEventListener('visibilitychange', sync);
    label();
  }

  /* ---------- Frame sequencer shared by the founder and family scenes ---------- */
  function Sequence(host, urls) {
    var box = host.querySelector('.seq-frames'), still = box.querySelector('img'), layers = [];
    urls.forEach(function (u, i) {
      var im = document.createElement('img');
      im.alt = ''; im.setAttribute('aria-hidden', 'true'); im.decoding = 'async'; im.draggable = false;
      im.className = 'seq-layer'; im.dataset.src = u;
      if (still.width) { im.width = still.width; im.height = still.height; }
      box.appendChild(im); layers.push(im);
    });
    this.layers = layers; this.still = still; this.host = host; this.loaded = false; this.timers = [];
  }
  Sequence.prototype.load = function (cb) {
    var self = this;
    if (this.loaded) { cb && cb(); return; }
    if (this.loading) { this.loading.push(cb); return; }
    this.loading = [cb];
    preload(this.layers.map(function (l) { return l.dataset.src; }), function () {
      self.layers.forEach(function (l) { l.src = l.dataset.src; });
      self.loaded = true; self.loading.forEach(function (f) { f && f(); }); self.loading = null;
    });
  };
  /* Opaque frames dissolve over the previous frame; transparent frames cross-fade. */
  Sequence.prototype.show = function (i, fade, over) {
    var self = this, prev = this.cur, next = this.layers[i];
    fade = fade || 0;
    this.host.classList.add('seq-running');
    this.z = (this.z || 1) + 1;
    next.style.zIndex = this.z; next.style.transitionDuration = fade + 'ms'; next.classList.add('on');
    this.layers.forEach(function (l) {
      if (l === next) return;
      if (over && l === prev) { setTimeout(function () { if (self.cur !== l) { l.style.transitionDuration = '0ms'; l.classList.remove('on'); } }, fade + 30); }
      else { l.style.transitionDuration = fade + 'ms'; l.classList.remove('on'); }
    });
    this.cur = next;
  };
  Sequence.prototype.stop = function () { this.timers.forEach(clearTimeout); this.timers = []; };
  Sequence.prototype.at = function (ms, fn) { this.timers.push(setTimeout(fn, ms)); };
  Sequence.prototype.end = function () { this.host.classList.remove('seq-running'); this.cur = null; this.layers.forEach(function (l) { l.style.transitionDuration = '0ms'; l.classList.remove('on'); }); };

  /* ---------- 3. Founder: defined below as a scroll-linked camera move ---------- */

  /* ---------- 4. Family time-lapse ---------- */
  var fam = document.getElementById('family-lapse');
  if (fam) {
    var urls = frameUrls(fam), years = (fam.getAttribute('data-years') || '').split(',').map(Number);
    if (urls.length >= 3) {
      var seq = new Sequence(fam, urls), flash = fam.querySelector('.gen-flash'), yearEl = fam.querySelector('.gen-year');
      var famBtn = fam.querySelector('.seq-replay'), famDone = false, yearRaf = 0;
      var setYear = function (y) { if (yearEl && y) yearEl.textContent = String(Math.round(y)); };
      var tweenYear = function (a, b, ms) {
        cancelAnimationFrame(yearRaf); if (!a || !b) return;
        var t0 = performance.now();
        var tick = function (t) { var p = Math.min(1, (t - t0) / ms); setYear(a + (b - a) * p); if (p < 1) yearRaf = requestAnimationFrame(tick); };
        yearRaf = requestAnimationFrame(tick);
      };
      var play = function () {
        seq.load(function () {
          seq.stop(); cancelAnimationFrame(yearRaf);
          fam.classList.add('gen-playing');
          seq.show(0, 0, true); setYear(years[0]);
          // 1946: the groom alone. 1947: the photographer raises the flash, fires it (smoke held about a second), the smoke drifts, the couple remain.
          seq.at(1300, function () { seq.show(1, 600, true); tweenYear(1946, 1947, 500); });
          seq.at(2300, function () {
            seq.show(2, 90, true);
            if (flash && flash.animate) flash.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.1 }, { opacity: 0 }], { duration: 520, easing: 'ease-out' });
          });
          seq.at(3350, function () { seq.show(3, 450, true); });
          seq.at(4150, function () { seq.show(4, 800, true); });
          var t = 5400, rest = urls.length - 5, step = (10800 - t) / rest;
          for (var k = 5; k < urls.length; k++) (function (k, at) {
            seq.at(at, function () { seq.show(k, Math.min(520, step * 0.6), true); tweenYear(years[k - 1], years[k], step * 0.6); });
          })(k, t + (k - 5) * step);
          seq.at(11400, function () { fam.classList.remove('gen-playing'); setYear(years[years.length - 1]); seq.end(); });
        });
      };
      if (famBtn) { famBtn.hidden = false; famBtn.addEventListener('click', play); }
      watch(fam, 0, function (v) { if (v) seq.load(); }, '700px 0px');
      if (!reduce) watch(fam, 0.55, function (v) { if (v && !famDone && !document.hidden) { famDone = true; play(); } });
    }
  }

  /* ---------- Shared scroll loop for the scroll-linked scenes below ---------- */
  var scrollers = [], sTick = false;
  var runScrollers = function () { sTick = false; var vh = window.innerHeight; for (var i = 0; i < scrollers.length; i++) scrollers[i](vh); };
  var addScroller = function (fn) {
    scrollers.push(fn);
    if (scrollers.length === 1) {
      window.addEventListener('scroll', function () { if (!sTick) { sTick = true; requestAnimationFrame(runScrollers); } }, { passive: true });
      window.addEventListener('resize', function () { requestAnimationFrame(runScrollers); });
      window.addEventListener('load', function () { requestAnimationFrame(runScrollers); });
    }
    requestAnimationFrame(runScrollers);
  };
  var c01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var sm = function (t) { return t * t * (3 - 2 * t); };
  var layoutTop = function (el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; };

  /* ---------- 5. "Read a Sample Chapter" comes forward over the paragraph, then settles ---------- */
  var pop = document.querySelector('#project .sample-cta .btn-primary');
  if (pop && !reduce) {
    pop.classList.add('pop-cta');
    addScroller(function (vh) {
      var c = layoutTop(pop) + pop.offsetHeight / 2 - window.pageYOffset;
      var t = c01((vh * 0.95 - c) / (vh * 0.7));
      var b = Math.sin(Math.PI * t); b = sm(c01(b * 1.25));
      var narrow = window.innerWidth < 760, mag = narrow ? 0.42 : 0.95, lift = narrow ? 18 : 52;
      pop.style.transform = b > 0.001 ? 'translate3d(0,' + (-lift * b).toFixed(1) + 'px,0) scale(' + (1 + mag * b).toFixed(3) + ')' : '';
      pop.style.setProperty('--pop', b.toFixed(3));
      pop.classList.toggle('pop-up', b > 0.02);
      pop.classList.toggle('pop-peak', b > 0.8);
    });
  }

  /* ---------- 6. The women's names swirl like a tornado, then settle into place ---------- */
  var tor = document.getElementById('name-tornado');
  if (tor) {
    var names = Array.prototype.map.call(document.querySelectorAll('#all-women .name-chip b'), function (b) { return b.textContent.trim(); });
    var letters = [];
    names.forEach(function (n) {
      var w = document.createElement('span'); w.className = 'nt-name';
      n.split('').forEach(function (ch) {
        var l = document.createElement('span'); l.className = ch === ' ' ? 'nt-l nt-sp' : 'nt-l'; l.textContent = ch === ' ' ? ' ' : ch;
        w.appendChild(l); if (ch !== ' ') letters.push(l);
      });
      tor.appendChild(w);
    });
    var torBtn = document.getElementById('name-tornado-replay');
    var seedT = 7, rndT = function () { seedT = (seedT * 9301 + 49297) % 233280; return seedT / 233280; };
    var torRaf = 0, torDone = false;
    var spin = function () {
      cancelAnimationFrame(torRaf);
      var W = tor.clientWidth, H = Math.max(tor.clientHeight, 220), cx = W / 2;
      letters.forEach(function (l) { l.style.transform = ''; });
      var tr = tor.getBoundingClientRect();
      var data = letters.map(function (l) {
        var lr = l.getBoundingClientRect(), hy = rndT();
        return { l: l, fx: lr.left - tr.left + lr.width / 2, fy: lr.top - tr.top + lr.height / 2, hy: hy,
                 a0: rndT() * Math.PI * 2, w: 3.2 + rndT() * 2.2, r: (W * 0.015 + Math.min(W * 0.3, 300) * Math.pow(1 - hy, 1.5)) * (0.8 + rndT() * 0.4),
                 d: rndT() * 0.35 };
      });
      tor.classList.add('nt-run'); tor.classList.remove('nt-wait');
      var T1 = 2600, T2 = 1900, t0 = performance.now();
      var frame = function (now) {
        var t = now - t0, done = t >= T1 + T2;
        for (var i = 0; i < data.length; i++) {
          var o = data[i];
          var u = c01((t - T1 - o.d * T2 * 0.6) / (T2 * 0.75)); u = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
          if (done) u = 1;
          var ts = t / 1000, a = o.a0 + o.w * ts * (1 - 0.5 * u);
          var wob = Math.sin(ts * 1.7 + o.hy * 2.4) * Math.min(W * 0.03, 30) * (0.4 + o.hy) + (o.hy - 0.5) * Math.min(W * 0.08, 70);
          var tx = cx + wob + o.r * Math.cos(a) - o.fx, ty = H * (0.02 + o.hy * 0.96) - o.fy - Math.sin(ts * 1.3 + o.a0) * 6, tz = o.r * Math.sin(a) * 0.45;
          var k = 1 - u, vis = (Math.sin(a) + 1) / 2;
          var appear = c01(t / 500 - o.hy * 0.6);
          o.l.style.transform = u >= 1 ? '' : 'translate3d(' + (tx * k).toFixed(1) + 'px,' + (ty * k).toFixed(1) + 'px,' + (tz * k).toFixed(1) + 'px) rotateY(' + (Math.cos(a) * 55 * k).toFixed(1) + 'deg) rotateZ(' + (Math.sin(a * 2 + o.a0) * 25 * k).toFixed(1) + 'deg)';
          o.l.style.opacity = u >= 1 ? '' : (appear * (0.3 + 0.7 * vis + (0.7 - 0.7 * vis) * u)).toFixed(3);
        }
        if (!done) torRaf = requestAnimationFrame(frame); else { tor.classList.remove('nt-run'); tor.classList.add('nt-settled'); }
      };
      torRaf = requestAnimationFrame(frame);
    };
    if (!reduce) {
      tor.classList.add('nt-wait');
      watch(tor, 0.35, function (v) { if (v && !torDone && !document.hidden) { torDone = true; spin(); } });
      if (!hasIO) tor.classList.remove('nt-wait');
    }
    if (torBtn) { torBtn.hidden = false; torBtn.addEventListener('click', function () { torDone = true; spin(); }); }
  }

  /* ---------- 7. Envelopes spin away below the notify button ---------- */
  var disp = document.getElementById('email-dispatch');
  if (disp) {
    var envs = Array.prototype.slice.call(disp.querySelectorAll('.env')), trails = disp.querySelectorAll('.dispatch-trails path');
    var paths = [ [-0.46, -0.20, 260], [0.44, -0.30, -200], [-0.22, -0.58, 120], [0.24, -0.62, -320], [-0.52, 0.18, 300], [0.52, 0.12, -240], [-0.05, -0.75, 200], [0.36, 0.30, -150], [-0.36, 0.34, 180] ];
    disp.classList.add('dispatch-js');
    var place = function (p) {
      var W = disp.clientWidth, H = disp.clientHeight;
      envs.forEach(function (e, i) {
        var P = paths[i % paths.length], q = c01((p - i * 0.045) / 0.7), qe = 1 - Math.pow(1 - q, 1.7);
        var ex = P[0] * W, ey = P[1] * H * 0.9, arc = Math.sin(Math.PI * qe) * -H * 0.28;
        var x = ex * qe, y = ey * qe + arc + (1 - qe) * -H * 0.32;
        var sc = 0.4 + Math.sin(Math.PI * Math.min(1, qe * 1.05)) * 0.75 + qe * 0.2;
        e.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + (Math.sin(Math.PI * qe) * 160).toFixed(0) + 'px) rotateY(' + (qe * 540 + i * 30).toFixed(1) + 'deg) rotateX(' + (qe * 160).toFixed(1) + 'deg) rotateZ(' + (qe * P[2]).toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
        e.style.opacity = (c01(q * 8) * (1 - 0.65 * c01((q - 0.85) / 0.15))).toFixed(3);
      });
      for (var j = 0; j < trails.length; j++) trails[j].style.strokeDashoffset = (1 - c01(p * 1.4 - j * 0.08)) * 1;
      disp.classList.toggle('dispatch-done', p >= 1);
    };
    if (reduce) place(1);
    else addScroller(function (vh) {
      var c = layoutTop(disp) + disp.offsetHeight / 2 - window.pageYOffset;
      place(c01((vh * 1.0 - c) / (vh * 0.62)));
    });
  }

  /* ---------- 9. Founder: the camera moves about 15 degrees, left to right, as the section scrolls past ---------- */
  var fdr = document.getElementById('founder-turn');
  if (fdr && !reduce) {
    addScroller(function (vh) {
      var c = layoutTop(fdr) + fdr.offsetHeight / 2 - window.pageYOffset;
      var t = sm(c01((vh * 1.05 - c) / (vh * 1.1)));          // 0 as it enters, 1 as it leaves
      var ang = -7.5 + 15 * t;                                // camera swings from the left to the right
      fdr.style.setProperty('--cam', (ang * -1).toFixed(2) + 'deg');
      fdr.style.setProperty('--camx', (ang * 1.6).toFixed(1) + 'px');
    });
  }

  /* ---------- 10. Roster portraits open a short biography ---------- */
  var dlg = document.getElementById('w-dialog'), bioEl = document.getElementById('w-bios');
  if (dlg && bioEl && typeof dlg.showModal === 'function') {
    var BIOS = {}; try { BIOS = JSON.parse(bioEl.textContent); } catch (e) {}
    var dImg = dlg.querySelector('.w-dialog-img'), dName = dlg.querySelector('#w-dialog-name'), dYears = dlg.querySelector('.w-dialog-years'), dBio = dlg.querySelector('.w-dialog-bio'), opener = null;
    Array.prototype.forEach.call(document.querySelectorAll('#all-women .w-open'), function (btn) {
      var nm = btn.querySelector('b').textContent.trim();
      if (!BIOS[nm]) return;
      btn.setAttribute('aria-label', nm + ', read her story');
      btn.addEventListener('click', function () {
        opener = btn;
        dImg.src = btn.querySelector('img').getAttribute('src'); dImg.alt = 'Hedcut-style illustration of ' + nm;
        dName.textContent = nm;
        dYears.textContent = (btn.querySelector('.w-cap').textContent.replace(nm, '').trim());
        dBio.textContent = BIOS[nm];
        dlg.showModal();
      });
    });
    dlg.querySelector('.w-dialog-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { if (opener) opener.focus(); });
  }

  /* ---------- 11. A card is swiped once below "Make a Gift"; the roster button gives a short nudge ---------- */
  var swipe = document.getElementById('gift-swipe');
  if (swipe) {
    if (reduce) swipe.classList.add('swipe-static');
    else { var swDone = false; watch(swipe, 0.6, function (v) { if (v && !swDone) { swDone = true; swipe.classList.add('sw-go'); } }); }
  }
  var rcta = document.querySelector('#all-women .roster-cta');
  if (rcta && !reduce) { var rDone = false; watch(rcta, 0.9, function (v) { if (v && !rDone) { rDone = true; rcta.classList.add('cta-nudge'); } }); }

  /* ---------- 8. "Why now": the window closes as it scrolls into view; the text stays visible through the glass ---------- */
  var win = document.getElementById('why-window');
  if (win) {
    var sashL = win.querySelector('.ww-sash-l'), sashR = win.querySelector('.ww-sash-r');
    win.classList.add('ww-js');
    var setWin = function (p) {
      var open = 1 - p, narrow = window.innerWidth < 760;
      sashL.style.transform = 'rotateY(' + (-(narrow ? 98 : 104) * open).toFixed(2) + 'deg)';
      sashR.style.transform = 'rotateY(' + (104 * open).toFixed(2) + 'deg)';
      win.style.setProperty('--closed', p.toFixed(3));
      win.classList.toggle('ww-closed', p > 0.995);
    };
    if (reduce) setWin(1);
    else addScroller(function (vh) {
      var c = layoutTop(win) + win.offsetHeight / 2 - window.pageYOffset;
      var p = c01((vh * 0.85 - c) / (vh * 0.65));
      setWin(1 - Math.pow(1 - p, 2.2));
    });
  }
})();
