/* The Legacy Project - homepage scenes.
   1. Book: turns to the back cover and returns to the front when the page opens.
   2. Laptop: the lid opens as it scrolls into view; a film excerpt plays in black and white.
   3. Founder: full-length 360 degree turnaround that ends facing front.
   4. Family: ten-second time-lapse, one portrait in 1946 to about eighty people in 2026.
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

  /* ---------- 3. Founder turnaround ---------- */
  var fs = document.getElementById('founder-turn');
  if (fs) {
    var fUrls = frameUrls(fs);
    if (fUrls.length) {
      var fseq = new Sequence(fs, fUrls), fBtn = fs.querySelector('.seq-replay'), fDone = false;
      var turn = function () {
        fseq.load(function () {
          fseq.stop();
          var step = 230, hold = 500, n = fUrls.length;
          fseq.show(0, 0);
          for (var k = 1; k <= n; k++) (function (k) {
            fseq.at(hold + k * step, function () { fseq.show(k % n, 160); });
          })(k);
          fseq.at(hold + n * step + 400, function () { fseq.end(); });
        });
      };
      if (fBtn) { fBtn.hidden = false; fBtn.addEventListener('click', turn); }
      watch(fs, 0, function (v) { if (v) fseq.load(); }, '600px 0px');
      if (!reduce) watch(fs, 0.6, function (v) { if (v && !fDone && !document.hidden) { fDone = true; turn(); } });
    }
  }

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
          // the photographer's flash, then the camera fades away
          seq.at(800, function () {
            if (flash && flash.animate) flash.animate([{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 0 }], { duration: 650, easing: 'ease-out' });
          });
          seq.at(1500, function () { seq.show(1, 900, true); });
          var t = 2500, rest = urls.length - 2, step = (10000 - t) / rest;
          for (var k = 2; k < urls.length; k++) (function (k, at) {
            seq.at(at, function () { seq.show(k, Math.min(520, step * 0.6), true); tweenYear(years[k - 1], years[k], step * 0.6); });
          })(k, t + (k - 2) * step);
          seq.at(10600, function () { fam.classList.remove('gen-playing'); setYear(years[years.length - 1]); seq.end(); });
        });
      };
      if (famBtn) { famBtn.hidden = false; famBtn.addEventListener('click', play); }
      watch(fam, 0, function (v) { if (v) seq.load(); }, '700px 0px');
      if (!reduce) watch(fam, 0.55, function (v) { if (v && !famDone && !document.hidden) { famDone = true; play(); } });
    }
  }
})();
