/* The Legacy Project - scroll-linked 3D ("the archive comes forward").
   Plain JavaScript, no dependencies. The page always scrolls natively:
   no wheel/touch interception, no smooth-scroll library, no pinning except
   the desktop portrait stage, which uses CSS position: sticky.
   Every element settles exactly flat once its centre is inside the middle
   40% of the viewport. Reduced motion or no JavaScript: static layout. */
(function () {
  'use strict';
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  if (mq('(prefers-reduced-motion: reduce)')) return;

  var root = document.documentElement;
  var finePointer = mq('(hover: hover) and (pointer: fine)');
  var paused = false;
  var items = [];          // {el, kind, top, h, i, ...}
  var vh = window.innerHeight, vw = window.innerWidth;
  var mag = 1;             // 1 desktop, 0.6 mobile
  var stageMode = false;
  var dirty = true, running = false;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function docTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }

  /* Progress 0 when the element's centre is at the bottom of the viewport,
     1 (settled, flat) when its centre reaches 70% of the viewport height. */
  function progress(it, sy) {
    var c = it.top + it.h / 2 - sy;
    return ease(clamp((vh - c) / (vh * 0.3), 0, 1));
  }

  /* ---------- build ---------- */
  root.classList.add('s3d');

  // 1. Hero book cover: wrap for sheen + pointer tilt
  var cover = document.querySelector('.book3d-body') || document.querySelector('.hero-cover');
  var coverWrap = null;
  if (cover) {
    coverWrap = document.createElement('span');
    coverWrap.className = 'cover3d';
    cover.parentNode.insertBefore(coverWrap, cover);
    coverWrap.appendChild(cover);
    var sheen = document.createElement('span'); sheen.className = 'cover3d-sheen'; sheen.setAttribute('aria-hidden', 'true');
    coverWrap.appendChild(sheen);
    items.push({ el: coverWrap, kind: 'cover', measure: document.querySelector('.hero') });
    var heroText = document.querySelector('.hero-grid > div:first-child');
    if (heroText) items.push({ el: heroText, kind: 'heroText', measure: document.querySelector('.hero') });
  }

  // 2. Fact cards
  document.querySelectorAll('.facts .fact').forEach(function (el, i) { items.push({ el: el, kind: 'fact', i: i }); });

  // 5. Section headings (not the hero)
  document.querySelectorAll('section:not(.hero) h2, .women-intro > h3').forEach(function (el) { items.push({ el: el, kind: 'heading' }); });

  // C. Focus reveal for story paragraphs and section leads
  document.querySelectorAll('.pcard-story, section:not(.hero) .lead').forEach(function (el) { items.push({ el: el, kind: 'focus' }); });

  // 4. Trailer screen
  var screen = document.querySelector('.teaser .frame16');
  if (screen) items.push({ el: screen, kind: 'screen', measure: screen.parentNode });

  // 3. Portrait cards (stacked layout, below 1000 px) and A. sticky stage (desktop)
  var stageWrap = document.querySelector('.portrait-stage');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.portrait-cards > li'));
  cards.forEach(function (li, i) {
    items.push({ el: li.querySelector('.pcard'), kind: 'card', i: i, measure: li,
                 img: li.querySelector('.pcard-figure img') });
  });

  var stage = null, stageImgs = [], stageName = null, stageCard = null;
  if (stageWrap && cards.length) {
    stage = document.createElement('div');
    stage.className = 'pstage';
    stage.setAttribute('aria-hidden', 'true');
    stage.innerHTML = '<div class="pstage-card"><div class="pstage-frame"></div></div><p class="pstage-name"></p>';
    stageCard = stage.querySelector('.pstage-card');
    var frameEl = stage.querySelector('.pstage-frame');
    stageName = stage.querySelector('.pstage-name');
    cards.forEach(function (li, i) {
      var pic = li.querySelector('.pcard-figure picture');
      var layer = document.createElement('div');
      layer.className = 'pstage-layer';
      if (pic) {
        var c = pic.cloneNode(true);
        var im = c.querySelector('img'); if (im) { im.alt = ''; im.loading = 'eager'; }
        layer.appendChild(c);
      }
      layer.style.zIndex = String(10 + i);
      frameEl.appendChild(layer);
      stageImgs.push({ layer: layer, name: (li.querySelector('h4') || {}).textContent || '' });
    });
    stageWrap.insertBefore(stage, stageWrap.querySelector('.portrait-cards'));
    items.push({ el: stageCard, kind: 'stage', measure: cards[0] });
  }

  // E. Name emergence above the roster
  var roster = document.getElementById('all-women');
  var grid = null, gridCells = [];
  if (roster) {
    var names = ['RÓŻA ROBOTA', 'GISI FLEISCHMANN', 'RACHEL AUERBACH', 'FAYE SCHULMAN', 'ZIVIA LUBETKIN', 'IRENA SENDLER'];
    var COLS = 22, AZ = 'ABCDEFGHIJKLMNOPRSTUWYZ';
    var seed = 36;
    var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    grid = document.createElement('div');
    grid.className = 'name-grid';
    grid.setAttribute('aria-hidden', 'true');
    names.forEach(function (n) {
      var start = Math.floor(rnd() * (COLS - n.length + 1));
      for (var c = 0; c < COLS; c++) {
        var s = document.createElement('span');
        var k = c - start;
        if (k >= 0 && k < n.length) {
          s.textContent = n[k] === ' ' ? ' ' : n[k];
          if (n[k] !== ' ') { s.className = 'ng-name'; }
        } else {
          s.textContent = AZ[Math.floor(rnd() * AZ.length)];
          s.className = 'ng-fill';
        }
        s.style.setProperty('--d', (rnd() * 2 - 1).toFixed(2));
        grid.appendChild(s);
        gridCells.push(s);
      }
    });
    roster.parentNode.insertBefore(grid, roster);
    items.push({ el: grid, kind: 'names' });
  }

  /* ---------- motion button ---------- */
  var btn = document.getElementById('portrait-motion-toggle');
  if (btn) {
    btn.hidden = false;
    var sync = function () {
      btn.textContent = paused ? 'Resume motion' : 'Pause motion';
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    };
    btn.addEventListener('click', function () {
      paused = !paused; root.classList.toggle('s3d-paused', paused);
      if (paused) resetAll(); else { dirty = true; kick(); }
      sync();
    });
    sync();
  }

  /* ---------- layout ---------- */
  function layout() {
    vh = window.innerHeight; vw = window.innerWidth;
    mag = vw < 620 ? 0.6 : (vw < 1000 ? 0.8 : 1);
    var wantStage = !!stage && vw >= 1000;
    if (wantStage !== stageMode) {
      stageMode = wantStage;
      stageWrap.classList.toggle('stage-mode', stageMode);
      items.forEach(function (it) { if (it.kind === 'card') { it.el.style.transform = ''; it.el.style.opacity = ''; if (it.img) it.img.style.transform = ''; } });
    }
    items.forEach(function (it) {
      var m = it.measure || it.el;
      it.top = docTop(m); it.h = m.offsetHeight;
    });
    if (stageMode) {
      stageCentres = cards.map(function (li) { return docTop(li) + li.offsetHeight / 2; });
    }
    dirty = true; kick();
  }
  var stageCentres = [];

  function resetAll() {
    items.forEach(function (it) {
      it.el.style.transform = ''; it.el.style.opacity = ''; it.el.style.filter = '';
      if (it.img) it.img.style.transform = '';
    });
    if (stage) showStageStatic();
    gridCells.forEach(function (s) { s.style.opacity = ''; s.style.transform = ''; });
    tiltX = tiltY = 0;
  }

  /* ---------- pointer tilt (fine pointers only) ---------- */
  var tiltX = 0, tiltY = 0, tiltTarget = null;
  if (finePointer) {
    [coverWrap, stageCard].forEach(function (el) {
      if (!el) return;
      el.addEventListener('pointermove', function (e) {
        if (paused) return;
        var r = el.getBoundingClientRect();
        tiltTarget = el;
        tiltX = ((e.clientX - r.left) / r.width - 0.5) * 2;
        tiltY = ((e.clientY - r.top) / r.height - 0.5) * 2;
        if (el === coverWrap) { el.style.setProperty('--sx', ((tiltX + 1) * 50).toFixed(1) + '%'); el.style.setProperty('--sy', ((tiltY + 1) * 50).toFixed(1) + '%'); }
        dirty = true; kick();
      }, { passive: true });
      el.addEventListener('pointerleave', function () { tiltX = tiltY = 0; tiltTarget = null; dirty = true; kick(); }, { passive: true });
    });
  }

  /* ---------- stage ---------- */
  var lastActive = -1;
  function showStageStatic() {
    stageImgs.forEach(function (s, i) { s.layer.style.opacity = i === 0 ? '1' : '0'; s.layer.style.setProperty('--r', '160%'); s.layer.style.transform = ''; });
    if (stageName) stageName.textContent = stageImgs[0] ? stageImgs[0].name : '';
    if (stageCard) stageCard.style.transform = '';
  }
  function stageFrame(sy, it) {
    // where is the reading line (viewport middle) among the four story centres?
    var ref = sy + vh * 0.5, n = stageCentres.length, f;
    if (ref <= stageCentres[0]) f = 0;
    else if (ref >= stageCentres[n - 1]) f = n - 1;
    else {
      for (var i = 0; i < n - 1; i++) {
        if (ref >= stageCentres[i] && ref <= stageCentres[i + 1]) { f = i + (ref - stageCentres[i]) / (stageCentres[i + 1] - stageCentres[i]); break; }
      }
    }
    var base = Math.floor(f), u = f - base, t = smooth(0.3, 0.7, u);
    if (base >= n - 1) { base = n - 1; t = 0; u = 0; }
    stageImgs.forEach(function (s, i) {
      if (i < base) { s.layer.style.opacity = '0'; }
      else if (i === base) { s.layer.style.opacity = '1'; s.layer.style.setProperty('--r', '160%'); }
      else if (i === base + 1) { s.layer.style.opacity = t > 0 ? '1' : '0'; s.layer.style.setProperty('--r', (t * 160).toFixed(1) + '%'); }
      else { s.layer.style.opacity = '0'; }
      // inner parallax: the portrait drifts against its frame
      var local = i === base ? u : (i === base + 1 ? u - 1 : 0);
      s.layer.style.transform = 'translate3d(0,' + (-local * 30).toFixed(1) + 'px,0) scale(1.12)';
    });
    var active = t > 0.5 ? base + 1 : base;
    if (active !== lastActive && stageName) { stageName.textContent = stageImgs[active] ? stageImgs[active].name : ''; lastActive = active; }
    // entrance from depth + visible Y turn between women (alternating direction)
    var p = progress(it, sy);
    var turn = Math.sin(Math.PI * t) * 36 * (base % 2 ? -1 : 1);
    var tx = tiltTarget === stageCard ? tiltX * 12 : 0, ty = tiltTarget === stageCard ? -tiltY * 12 : 0;
    stageCard.style.transform = 'translate3d(0,' + ((1 - p) * 80).toFixed(1) + 'px,' + ((1 - p) * -420).toFixed(1) + 'px) rotateY(' + ((1 - p) * 38 + turn + tx).toFixed(2) + 'deg) rotateX(' + ((1 - p) * 12 + ty).toFixed(2) + 'deg)';
    stageCard.style.opacity = (0.25 + 0.75 * p).toFixed(3);
    stageCard.style.setProperty('--shade', (Math.abs(turn) / 36).toFixed(3));
  }

  /* ---------- frame ---------- */
  function frame() {
    running = false;
    if (!dirty || paused) return;
    dirty = false;
    var sy = window.pageYOffset;
    for (var k = 0; k < items.length; k++) {
      var it = items[k], el = it.el, p;
      // skip far off-screen elements
      if (it.kind !== 'stage' && (it.top - sy > vh * 1.6 || it.top + it.h - sy < -vh * 0.6)) continue;
      switch (it.kind) {
        case 'cover': {
          p = clamp(sy / (it.h * 0.35), 0, 1); p = ease(p);
          var tx = tiltTarget === coverWrap ? tiltX * 10 : 0, ty = tiltTarget === coverWrap ? -tiltY * 10 : 0;
          el.style.transform = 'translate3d(0,0,' + ((1 - p) * -120 * mag).toFixed(1) + 'px) rotateY(' + ((1 - p) * -24 * mag + tx).toFixed(2) + 'deg) rotateX(' + ((1 - p) * 8 * mag + ty).toFixed(2) + 'deg)';
          el.style.setProperty('--depth', p.toFixed(3));
          break;
        }
        case 'heroText': {
          el.style.transform = 'translate3d(0,' + (clamp(sy, 0, it.h) * 0.12).toFixed(1) + 'px,0)';
          break;
        }
        case 'fact': {
          p = progress(it, sy - it.i * 26);
          el.style.transform = 'rotateX(' + ((1 - p) * 65 * mag).toFixed(2) + 'deg)';
          el.style.opacity = (0.3 + 0.7 * p).toFixed(3);
          break;
        }
        case 'heading': {
          p = progress(it, sy);
          el.style.transform = 'translate3d(0,' + ((1 - p) * 30).toFixed(1) + 'px,0) rotateX(' + ((1 - p) * 80 * mag).toFixed(2) + 'deg)';
          el.style.opacity = p.toFixed(3);
          el.style.filter = p < 1 ? 'blur(' + ((1 - p) * 6).toFixed(2) + 'px)' : '';
          break;
        }
        case 'focus': {
          p = progress(it, sy);
          el.style.opacity = (0.4 + 0.6 * p).toFixed(3);
          el.style.filter = p < 1 ? 'blur(' + ((1 - p) * 6).toFixed(2) + 'px)' : '';
          break;
        }
        case 'screen': {
          p = progress(it, sy);
          el.style.transform = 'scale(' + (1 - (1 - p) * 0.16 * mag).toFixed(4) + ') rotateX(' + ((1 - p) * 22 * mag).toFixed(2) + 'deg)';
          break;
        }
        case 'card': {
          if (stageMode) break;
          p = progress(it, sy);
          var dir = it.i % 2 ? -1 : 1, q = 1 - p;
          el.style.transform = 'translate3d(0,' + (q * 80 * mag).toFixed(1) + 'px,' + (q * -420 * mag).toFixed(1) + 'px) rotateY(' + (q * 38 * mag * dir).toFixed(2) + 'deg) rotateX(' + (q * 12 * mag).toFixed(2) + 'deg)';
          el.style.opacity = (0.25 + 0.75 * p).toFixed(3);
          if (it.img) it.img.style.transform = 'translate3d(0,' + (q * 30 * mag).toFixed(1) + 'px,0) scale(1.12)';
          break;
        }
        case 'stage': {
          if (stageMode) stageFrame(sy, it);
          break;
        }
        case 'names': {
          var c = it.top + it.h / 2 - sy;
          p = ease(clamp((vh * 0.95 - c) / (vh * 0.45), 0, 1));
          for (var g = 0; g < gridCells.length; g++) {
            var s = gridCells[g], d = parseFloat(s.style.getPropertyValue('--d')) || 0;
            if (s.className === 'ng-name') { s.style.opacity = (0.35 + 0.65 * p).toFixed(3); s.style.transform = 'translate3d(0,' + ((1 - p) * d * 14).toFixed(1) + 'px,0)'; }
            else if (s.className === 'ng-fill') { s.style.opacity = (0.5 - 0.42 * p).toFixed(3); s.style.transform = 'translate3d(0,' + (p * d * 18).toFixed(1) + 'px,0) rotateX(' + (p * d * 60).toFixed(1) + 'deg)'; }
          }
          grid.classList.toggle('ng-done', p > 0.98);
          break;
        }
      }
    }
  }
  function kick() { if (!running) { running = true; window.requestAnimationFrame(frame); } }

  window.addEventListener('scroll', function () { dirty = true; kick(); }, { passive: true });
  window.addEventListener('resize', layout, { passive: true });
  window.addEventListener('load', layout);
  if ('ResizeObserver' in window) new ResizeObserver(function () { layout(); }).observe(document.body);
  document.querySelectorAll('img').forEach(function (im) { if (!im.complete) im.addEventListener('load', layout, { once: true }); });
  layout();
})();
