/* The Legacy Project - homepage teaser video.
   Plain JavaScript, no dependencies. Everything here is an enhancement:
   without JavaScript the teaser has native controls and the portraits
   are a static, fully readable layout. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var saveData = !!(conn && conn.saveData);

  /* ---------- Teaser: muted, plays automatically at most once per tab session ---------- */
  var KEY = 'legacy-ngo:wwf-teaser-autoplayed';
  var pageFlag = false; // fallback when sessionStorage is unavailable
  function autoplayedBefore() {
    try { return pageFlag || window.sessionStorage.getItem(KEY) === '1'; } catch (e) { return pageFlag; }
  }
  function markAutoplayed() {
    pageFlag = true;
    try { window.sessionStorage.setItem(KEY, '1'); } catch (e) { /* storage blocked: page flag only */ }
  }

  var video = document.getElementById('wwf-teaser');
  var btn = document.getElementById('wwf-teaser-toggle');
  var status = document.getElementById('wwf-teaser-status');
  if (video && btn) {
    video.muted = true;
    video.loop = false;
    var started = false;      // autoplay (or manual play) succeeded in this page
    var userPaused = false;   // the visitor paused it themselves
    var pausedByUs = false;   // paused because it left view or the tab was hidden
    var inView = false;

    function label() {
      var text;
      if (video.ended) text = 'Replay preview';
      else if (!video.paused) text = 'Pause preview';
      else text = 'Play preview';
      btn.textContent = text;
      btn.setAttribute('aria-label', text + ' (20-second excerpt, muted)');
      btn.setAttribute('data-state', video.ended ? 'ended' : (video.paused ? 'paused' : 'playing'));
    }
    function say(msg) { if (status) status.textContent = msg; }

    function tryPlay(isAuto) {
      var p;
      try { p = video.play(); } catch (e) { p = null; }
      if (p && typeof p.then === 'function') {
        p.then(function () {
          started = true;
          if (isAuto) markAutoplayed();
          label();
        }).catch(function () {
          // Autoplay rejected: leave a usable manual control, do not mark as played.
          label();
          if (isAuto) say('Press Play preview to watch the muted 20-second excerpt.');
        });
      } else {
        // Very old browsers: play() returns nothing. Treat as started only if it is actually playing.
        setTimeout(function () { if (!video.paused) { started = true; if (isAuto) markAutoplayed(); } label(); }, 300);
      }
    }

    btn.addEventListener('click', function () {
      if (video.ended) { video.currentTime = 0; userPaused = false; tryPlay(false); return; }
      if (video.paused) { userPaused = false; pausedByUs = false; tryPlay(false); }
      else { userPaused = true; video.pause(); }
    });
    ['play', 'pause', 'ended'].forEach(function (ev) { video.addEventListener(ev, label); });
    video.addEventListener('pause', function () { if (!pausedByUs && !video.ended && document.visibilityState === 'visible' && inView) userPaused = true; });
    video.addEventListener('play', function () { userPaused = false; pausedByUs = false; started = true; });
    video.addEventListener('ended', function () { say('Preview finished. Watch the full trailer for the complete film with sound.'); });
    video.addEventListener('error', function () { say('The preview could not be loaded. The full trailer is still available below.'); });

    var autoAllowed = !reduceMotion && !saveData && 'IntersectionObserver' in window;
    if (!autoAllowed) {
      say(reduceMotion || saveData ? 'Autoplay is off for your settings. Press Play preview to watch.' : '');
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          inView = entry.isIntersecting && entry.intersectionRatio >= 0.5;
          if (inView) {
            if (!started && autoAllowed && !autoplayedBefore()) {
              tryPlay(true);
            } else if (started && pausedByUs && !userPaused && !video.ended) {
              pausedByUs = false; tryPlay(false); // resume an unfinished excerpt, never restart a finished one
            }
          } else if (!video.paused) {
            pausedByUs = true; video.pause();
          }
        });
      }, { threshold: [0, 0.5, 1] });
      io.observe(video);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden' && !video.paused) { pausedByUs = true; video.pause(); }
      else if (document.visibilityState === 'visible' && inView && started && pausedByUs && !userPaused && !video.ended) { pausedByUs = false; tryPlay(false); }
    });

    btn.hidden = false;
    label();
  }

})();
