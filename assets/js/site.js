/* Elmendorp Tours & Travel: three film chapters pinned to the scroll, then tours, fleet and booking.
   No dependencies. One swipe, one notch of the mouse wheel or one arrow key moves one film: the next one rises through a
   window that slides up over the last (its picture moves slower than the window, so the shot appears to come up from
   below) and the page settles on it. Only the chapter on screen, and the one coming in, play their videos. */
(function () {
  'use strict';
  var S = window.SITE, CH = S.chapters, N = CH.length;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  var sm = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* scroll lengths, in screen heights: each film change takes one screen, and the tour list rising over the last film
     one more. END is the position where the last film is fully on screen. */
  var L = 1, END = (N - 1) * L;
  var hero = $('#hero'), pin = $('#pin');
  hero.style.setProperty('--hh', (END + 2).toFixed(3));

  var tall = isTall();
  function isTall() { return window.innerWidth / window.innerHeight < 0.9; }
  function srcOf(i) { var v = CH[i].video; return tall ? v.tall : v.wide; }
  function posterOf(i) { var v = CH[i].video; return tall ? (v.posterTall || v.posterWide) : (v.posterWide || v.posterTall); }
  function lines(t) { return t.map(function (l) { return '<span class="ln"><span>' + esc(l) + '</span></span>'; }).join(''); }

  /* ---------- build the chapters ---------- */
  var layers = CH.map(function (c, k) {
    var el = document.createElement('div');
    el.className = 'layer';
    el.style.zIndex = String(k + 1);
    el.innerHTML = '<div class="win"><div class="pic"><div class="poster"></div><video muted playsinline loop disablepictureinpicture preload="' +
      (k === 0 ? 'auto' : 'metadata') + '"></video></div><i class="edge"></i></div><div class="shade"></div>';
    $('#layers').appendChild(el);
    var Ly = { el: el, win: el.querySelector('.win'), pic: el.querySelector('.pic'), shade: el.querySelector('.shade'), edge: el.querySelector('.edge'),
      poster: el.querySelector('.poster'), v: el.querySelector('video'), src: '', want: false, k: k, last: {} };
    Ly.v.muted = true; Ly.v.defaultMuted = true; Ly.v.playsInline = true;
    Ly.v.setAttribute('playsinline', ''); Ly.v.setAttribute('webkit-playsinline', '');
    Ly.v.addEventListener('playing', function () { el.classList.add('playing'); });
    Ly.v.addEventListener('timeupdate', function () { syncBeat(k); });
    load(Ly);
    return Ly;
  });
  function load(Ly, keepTime) {
    Ly.poster.style.backgroundImage = 'url("' + posterOf(Ly.k) + '")';
    Ly.v.poster = posterOf(Ly.k);
    var s = srcOf(Ly.k);
    if (Ly.src === s) return;
    Ly.src = s;
    Ly.el.classList.remove('playing');
    Ly.v.src = s;
    if (keepTime) {
      Ly.v.addEventListener('loadedmetadata', function once() {
        Ly.v.removeEventListener('loadedmetadata', once);
        try { Ly.v.currentTime = Math.min(keepTime, (Ly.v.duration || keepTime) - 0.1); } catch (e) {}
      });
    }
  }
  /* once a film can play through, start loading the next one so it is ready when the visitor swipes */
  function warm(k) {
    var nx = layers[k + 1];
    if (!nx || nx.v.preload === 'auto') return;
    var cur = layers[k].v, go = function () { nx.v.preload = 'auto'; };
    if (cur.readyState >= 4) go(); else cur.addEventListener('canplaythrough', go, { once: true });
  }

  var copies = CH.map(function (c, k) {
    var a = document.createElement('article');
    a.className = 'copy';
    a.style.setProperty('--c', c.accent || '#f2b134');
    var tag = k === 0 ? 'h1' : 'h2', B = c.beats[0];
    a.setAttribute('aria-labelledby', 'h-' + c.id);
    a.innerHTML = '<p class="eyebrow"><i></i><span>' + esc(c.eyebrow) + '</span></p>' +
      '<' + tag + ' class="h" id="h-' + c.id + '">' + lines(B.title) + '</' + tag + '>' +
      '<p class="lede">' + esc(B.text) + '</p>' +
      '<div class="ctas"><a class="go" href="#tours"><span>' + esc(c.cta) + '</span><b aria-hidden="true">&darr;</b></a></div>';
    $('#copies').appendChild(a);
    return { el: a, h: a.querySelector('.h'), lede: a.querySelector('.lede'), eb: a.querySelector('.eyebrow span'), beat: 0, last: {} };
  });
  /* place line bottom right: a beat can move the film somewhere else (the party bus is in Nairobi, not the Mara) */
  function placeLabels(k) {
    if (k !== lastActive) return;
    var B = CH[k].beats[copies[k].beat] || {};
    $('#coord').textContent = B.coord || CH[k].coord || '';
    $('#idx').textContent = B.where || CH[k].where || '';
  }

  $('#prog').innerHTML = CH.map(function (c, k) {
    return '<li><button type="button" data-chapter="' + k + '"><span class="lb"><em>0' + (k + 1) + '</em>' + esc(c.label) + '</span><span class="bar"><i></i></span></button></li>';
  }).join('');
  var bars = $$('#prog .bar i'), items = $$('#prog li');
  if (coarse) $('#hint span').textContent = 'Swipe up';

  /* headlines that change while a chapter plays (the safari film shows the Land Cruiser, then the party bus) */
  function syncBeat(k) {
    var beats = CH[k].beats, C = copies[k];
    if (beats.length < 2) return;
    var t = layers[k].v.currentTime || 0, b = 0;
    for (var j = 0; j < beats.length; j++) if (t >= beats[j].at - 0.05) b = j;
    if (b === C.beat) return;
    C.beat = b;
    var el = C.el;
    clearTimeout(el._t);
    placeLabels(k);
    if (reduce) { C.h.innerHTML = lines(beats[b].title); C.lede.textContent = beats[b].text; C.eb.textContent = beats[b].eyebrow || CH[k].eyebrow; return; }
    el.classList.add('out');
    el._t = setTimeout(function () {
      C.h.innerHTML = lines(beats[b].title);
      C.lede.textContent = beats[b].text;
      C.eb.textContent = beats[b].eyebrow || CH[k].eyebrow;
      el.classList.remove('out');
      el.classList.add('pre');
      void el.offsetWidth;
      el.classList.remove('pre');
    }, 200);
  }

  /* ---------- playback ---------- */
  var paused = reduce, tapBtn = $('#tap');
  function play(Ly) {
    var p;
    try { p = Ly.v.play(); } catch (e) { p = null; }
    if (p && p.then) {
      p.then(function () { tapBtn.hidden = true; }, function (err) {
        if (!paused && Ly.want && err && err.name === 'NotAllowedError') tapBtn.hidden = false;
      });
    }
  }
  function want(Ly, on) {
    if (on === Ly.want) return;
    Ly.want = on;
    if (on && !paused) play(Ly); else Ly.v.pause();
  }
  function setPaused(p) {
    paused = p;
    layers.forEach(function (Ly) { if (p) Ly.v.pause(); else if (Ly.want) play(Ly); });
    if (!p) tapBtn.hidden = true;
  }
  tapBtn.addEventListener('click', function () { tapBtn.hidden = true; setPaused(false); });
  /* the films loop on their own; if the phone blocked autoplay (e.g. an iPhone in Low Power Mode), the visitor's
     first tap or swipe starts them */
  function resume() {
    if (paused) return;
    layers.forEach(function (Ly) { if (Ly.want && Ly.v.paused) play(Ly); });
  }
  ['touchend', 'click', 'keydown'].forEach(function (ev) { document.addEventListener(ev, resume, { passive: true }); });
  document.addEventListener('visibilitychange', function () {
    layers.forEach(function (Ly) { if (document.hidden) Ly.v.pause(); else if (Ly.want && !paused) play(Ly); });
  });

  /* ---------- scroll ---------- */
  var H = 1, top0 = 0, ticking = false, lastActive = -1, header = $('#top'), hint = $('#hint'), bottom = $('#bottom');
  var zoomed = false, dragOn = null;
  function measure() {
    H = pin.offsetHeight || window.innerHeight;
    top0 = hero.getBoundingClientRect().top + window.pageYOffset;
  }
  function set(o, el, prop, val) {
    if (o[prop] === val) return;
    o[prop] = val;
    if (prop === 'opacity') el.style.opacity = val;
    else el.style[prop] = val;
  }
  function render() {
    ticking = false;
    var p = (window.pageYOffset - top0) / H, rp = Math.round(p);
    if (Math.abs(p - rp) < 0.002) p = rp;           // settled on a film (absorbs sub-pixel rounding)
    var pc = clamp(p, 0, END + 1);
    var i = Math.min(Math.floor(pc / L), N - 1), f = pc - i * L;
    var t = i < N - 1 ? clamp(f / L, 0, 1) : 0;     // the next film coming in, moving 1:1 with the scroll
    var q = clamp(pc - END, 0, 1);                  // the tour list rising over the last film
    var live = p < END + 1;                         // films still on screen

    layers.forEach(function (Ly, k) {
      var o = Ly.last, show = live && (k === i || (k === i + 1 && t > 0));
      if (show !== o.show) { o.show = show; Ly.el.classList.toggle('show', show); }
      if (k === i) {
        set(o, Ly.win, 'transform', 'none');
        set(o, Ly.pic, 'transform', reduce ? 'none' : 'translate3d(0,' + (-t * 7).toFixed(3) + '%,0) scale(' + (1 + 0.05 * t).toFixed(4) + ')');
        set(o, Ly.shade, 'opacity', (0.55 * t + 0.5 * q).toFixed(3));
        set(o, Ly.edge, 'opacity', '0');
      } else if (k === i + 1 && t > 0) {
        var r = 1 - t;
        set(o, Ly.win, 'transform', 'translate3d(0,' + (r * 100).toFixed(3) + '%,0)');
        set(o, Ly.pic, 'transform', reduce ? 'translate3d(0,' + (-r * 100).toFixed(3) + '%,0)' :
          'translate3d(0,' + (-r * 72).toFixed(3) + '%,0) scale(' + (1 + 0.1 * r).toFixed(4) + ')');
        set(o, Ly.shade, 'opacity', '0');
        set(o, Ly.edge, 'opacity', Math.min(1, t * 8, r * 8).toFixed(3));
      }
      want(Ly, show && (k === i || t > 0.02));
    });

    copies.forEach(function (C, k) {
      var op = 0, ty = 0;
      if (k === i) { op = (1 - sm(0, 0.4, t)) * (1 - sm(0.05, 0.55, q)); ty = -t * 50 - q * 70; }
      else if (k === i + 1) { op = sm(0.55, 0.95, t); ty = (1 - t) * 50; }
      if (reduce) ty = 0;
      var o = C.last, on = op > 0.01;
      if (on !== o.on) { o.on = on; C.el.classList.toggle('on', on); }
      set(o, C.el, 'opacity', op.toFixed(3));
      set(o, C.el, 'transform', 'translate3d(0,' + ty.toFixed(1) + 'px,0)');
      set(o, C.el, 'pointerEvents', op > 0.5 ? 'auto' : 'none');
    });

    for (var k = 0; k < N; k++) bars[k].style.transform = 'scaleX(' + clamp((pc - k * L) / L, 0, 1).toFixed(4) + ')';
    var active = Math.min(N - 1, i + (t > 0.5 ? 1 : 0));
    if (active !== lastActive) {
      lastActive = active;
      items.forEach(function (li, k) { if (k === active) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
      document.documentElement.style.setProperty('--accent', CH[active].accent || '#f2b134');
      placeLabels(active);
      document.body.dataset.chapter = active;
      warm(active);
    }
    hint.style.opacity = (1 - clamp(p * 5, 0, 1)).toFixed(3);
    bottom.style.opacity = (1 - sm(0, 0.5, q)).toFixed(3);
    header.classList.toggle('solid', p > END + 0.85);
    var d = !reduce && !zoomed && p < END + 1 - 0.001;  // swipes on the films are handled here, not by the browser
    if (d !== dragOn) { dragOn = d; pin.classList.toggle('drag', d); }
  }

  /* ---------- motion: the page settles on a film, and swipes move one film at a time ----------
     Rest points are the start of each film and the top of the tour list. Glides are cubic Hermite curves: they end at
     rest and can start at the speed of the finger, so a swipe carries straight into the glide. */
  var anim = null, idleT = 0, lastY = window.pageYOffset, dir = 0, src = '', touching = false, mouseDown = false, tp = null;
  function rests() {
    var R = [];
    for (var k = 0; k < N; k++) R.push(Math.round(top0 + k * L * H));
    R.push(Math.round(top0 + (END + 1) * H));
    return R;
  }
  function restFrom(y, d) {                         // d > 0: next rest below y, d < 0: next above, 0: nearest
    var R = rests(), j, best = R[0];
    if (d > 0) { for (j = 0; j < R.length; j++) if (R[j] > y + 0.5) return R[j]; return R[R.length - 1]; }
    if (d < 0) { for (j = R.length - 1; j >= 0; j--) if (R[j] < y - 0.5) return R[j]; return R[0]; }
    for (j = 1; j < R.length; j++) if (Math.abs(R[j] - y) < Math.abs(best - y)) best = R[j];
    return best;
  }
  function animAt(a, now) {
    var k = clamp((now - a.t0) / a.T, 0, 1), m = a.m, D = a.to - a.y0;
    return { y: a.y0 + D * (k * k * (3 - 2 * k) + m * k * (1 - k) * (1 - k)),
      v: D / a.T * (6 * k * (1 - k) + m * (1 - k) * (1 - 3 * k)), k: k };
  }
  function stopAnim() { if (anim) { cancelAnimationFrame(anim.raf); anim = null; } }
  function glideTo(to, v, done) {                   // v: current speed in px/ms (down is positive)
    var now = performance.now(), y0 = window.pageYOffset;
    if (anim) { var s = animAt(anim, now); y0 = s.y; if (v === undefined) v = s.v; }
    stopAnim();
    to = Math.round(to);
    var D = to - y0, aD = Math.abs(D);
    if (aD < 1 || reduce) { window.scrollTo(0, to); render(); if (done) done(); return; }
    var T = clamp(280 + 200 * aD / H, 280, 1100);
    anim = { t0: now, y0: y0, to: to, T: T, m: v ? clamp(v * T / D, -1, 3) : 0, done: done, first: true };
    anim.raf = requestAnimationFrame(step);
  }
  function step(now) {
    var a = anim;
    if (!a) return;
    if (a.first) { a.first = false; a.t0 = Math.min(a.t0, now - 16); }  // move on the very first frame
    var s = animAt(a, now), end = s.k >= 1;
    window.scrollTo(0, end ? a.to : s.y);
    render();
    if (!end) { a.raf = requestAnimationFrame(step); return; }
    anim = null;
    if (a.done) a.done();
  }

  /* settle: when a wheel, trackpad, key or native swipe stops between two films, finish the move in the direction the
     visitor was going (or go back, if they only nudged it) */
  function armSettle(ms) { clearTimeout(idleT); idleT = setTimeout(settle, ms); }
  function settle() {
    if (reduce || anim || touching || mouseDown || tp) return;
    var y = window.pageYOffset, R = rests(), j = 0;
    if (y <= R[0] + 1 || y >= R[R.length - 1] - 1) return;
    while (j < R.length - 2 && y >= R[j + 1]) j++;
    var a = R[j], b = R[j + 1], m = Math.max(24, 0.03 * H), to;
    if (y - a < 1 || b - y < 1) return;
    if (dir > 0) to = y - a < m ? a : b;
    else if (dir < 0) to = b - y < m ? b : a;
    else to = y - a < b - y ? a : b;
    glideTo(to, 0);
  }
  function onScroll() {
    var y = window.pageYOffset;
    if (y !== lastY) { dir = y > lastY ? 1 : -1; lastY = y; }
    if (!ticking) { ticking = true; window.requestAnimationFrame(render); }
    if (!anim && !tp) armSettle(src === 'wheel' ? 100 : 130);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('wheel', function (e) {
    src = 'wheel';
    if (anim) stopAnim();
    if (e.deltaY) dir = e.deltaY > 0 ? 1 : -1;
  }, { passive: true });
  window.addEventListener('mousedown', function () { mouseDown = true; }, true);
  window.addEventListener('mouseup', function () { mouseDown = false; armSettle(80); }, true);
  window.addEventListener('mousemove', function (e) { if (mouseDown && !e.buttons) { mouseDown = false; armSettle(80); } }, { passive: true });
  document.addEventListener('touchstart', function () { touching = true; src = 'touch'; clearTimeout(idleT); stopAnim(); }, { passive: true, capture: true });
  function touchOff(e) { if (e.touches && e.touches.length) return; touching = false; armSettle(130); }
  document.addEventListener('touchend', touchOff, { passive: true, capture: true });
  document.addEventListener('touchcancel', touchOff, { passive: true, capture: true });

  /* swipes on the films: the page follows the finger, and on release it glides to the next film (or back) */
  pin.addEventListener('touchstart', function (e) {
    tp = null;
    if (!dragOn || e.touches.length !== 1) return;
    var t = e.touches[0];
    tp = { x: t.clientX, y: t.clientY, sy: window.pageYOffset, on: false, s: [[e.timeStamp, t.clientY]] };
  }, { passive: true });
  pin.addEventListener('touchmove', function (e) {
    if (!tp) return;
    if (e.touches.length !== 1) { tp = null; return; }  // a second finger: leave pinch-zoom to the browser
    var t = e.touches[0], dy = t.clientY - tp.y;
    if (e.cancelable) e.preventDefault();
    if (!tp.on) { if (Math.abs(dy) < 5 && Math.abs(t.clientX - tp.x) < 5) return; tp.on = true; }
    var R = rests();
    window.scrollTo(0, clamp(tp.sy - dy, R[0], R[R.length - 1]));
    render();
    tp.s.push([e.timeStamp, t.clientY]);
    if (tp.s.length > 8) tp.s.shift();
  }, { passive: false });
  pin.addEventListener('touchend', function (e) {
    var g = tp;
    tp = null;
    if (!g || !g.on) return;
    var s = g.s, last = s[s.length - 1], v = 0, j = 0;
    if ((e.timeStamp || last[0]) - last[0] < 80) {    // the finger was still moving when it lifted
      while (j < s.length - 1 && last[0] - s[j][0] > 100) j++;
      if (last[0] > s[j][0]) v = -(last[1] - s[j][1]) / (last[0] - s[j][0]);
    }
    var y = window.pageYOffset, moved = y - g.sy, d = 0;
    if (Math.abs(v) > 0.3) d = v > 0 ? 1 : -1;
    else if (Math.abs(moved) > Math.max(30, 0.045 * H)) d = moved > 0 ? 1 : -1;
    var from = restFrom(g.sy, 0), to = restFrom(y, d);
    to = clamp(to, restFrom(from, -1), restFrom(from, 1)); // never more than one film per swipe
    glideTo(to, v);
  }, { passive: true });
  pin.addEventListener('touchcancel', function () {
    var g = tp;
    tp = null;
    if (g && g.on) glideTo(restFrom(window.pageYOffset, 0), 0);
  }, { passive: true });
  if (window.visualViewport) {
    visualViewport.addEventListener('resize', function () { zoomed = visualViewport.scale > 1.01; render(); });
  }

  /* keys: arrows, Page Up/Down and the space bar step one film at a time while the films are on screen */
  document.addEventListener('keydown', function (e) {
    if (reduce || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    var el = e.target, k = e.key, d = 0;
    if (el && el.closest && el.closest('input,textarea,select,[contenteditable]')) return;
    if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) d = 1;
    else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) d = -1;
    if (!d || (k === ' ' && el && el.closest && el.closest('a,button'))) return;
    var y = anim ? anim.to : window.pageYOffset, R = rests(), last = R[R.length - 1];
    if (d > 0 ? y >= last - 0.5 : (y > last + 0.5 || y <= R[0] + 0.5)) return;
    e.preventDefault();
    src = 'key';
    glideTo(restFrom(y, d));
  });

  window.addEventListener('resize', function () {
    var oH = H, oT = top0, y = window.pageYOffset;
    measure();
    if (H !== oH && !anim) {                        // rotated or resized: stay on the same film
      var p = (y - oT) / oH;
      if (p > 0 && p < END + 1) window.scrollTo(0, top0 + Math.round(p) * H);
    }
    var t2 = isTall();
    if (t2 !== tall) {
      tall = t2;
      layers.forEach(function (Ly) { var keep = Ly.v.currentTime || 0, was = Ly.want; load(Ly, keep); if (was && !paused) play(Ly); });
    }
    render();
  });

  /* links inside the page glide instead of jumping */
  function yOf(el) {
    measure();
    if (el.id === 'tours') return top0 + (END + 1) * H;
    return el.getBoundingClientRect().top + window.pageYOffset - header.offsetHeight + 1;
  }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-chapter') || a.classList.contains('skip')) return;
    var id = a.getAttribute('href').slice(1), el = id && document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    glideTo(yOf(el));
    try { history.replaceState(null, '', '#' + id); } catch (err) {}
  });
  function toChapter(k) {
    measure();
    glideTo(rests()[k]);
  }
  $$('[data-chapter]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); toChapter(+b.dataset.chapter); });
  });
  function fromHash() {
    var i = CH.map(function (c) { return c.id; }).indexOf(location.hash.slice(1));
    if (i >= 0) { toChapter(i); return true; }
    return false;
  }
  window.addEventListener('hashchange', fromHash);

  /* ---------- ten places ---------- */
  $('#tourList').innerHTML = S.places.map(function (pl, n) {
    return '<li><button class="tile" type="button" data-place="' + n + '" aria-label="' + esc(pl.title + ', ' + pl.length + '. ' + pl.text + ' Book this trip') + '">' +
      '<span class="ph"><img src="' + esc(pl.img) + '" alt="" width="640" height="480" loading="lazy" decoding="async"><span class="len">' + esc(pl.length) + '</span></span>' +
      '<span class="nm">' + esc(pl.title) + '</span><span class="tx">' + esc(pl.text) + '</span></button></li>';
  }).join('');

  /* ---------- booking: WhatsApp or e-mail, no server needed ---------- */
  var sel = $('#f-trip');
  sel.innerHTML = '<option value="">Not sure yet</option><optgroup label="Places">' +
    S.places.map(function (pl) { return '<option>' + esc(pl.title) + '</option>'; }).join('') + '</optgroup>' +
    '<optgroup label="Rides">' + (S.rides || []).map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('') + '</optgroup>';
  function goBook(tour, ride) {
    if (tour !== undefined) sel.value = tour;
    if (ride) $('#f-ride').value = ride;
    glideTo(yOf($('#book')), undefined, function () { $('#f-name').focus({ preventScroll: true }); });
  }
  $('#tourList').addEventListener('click', function (e) {
    var b = e.target.closest('.tile');
    if (b) goBook(S.places[+b.dataset.place].title);
  });
  $$('[data-ride]').forEach(function (b) { b.addEventListener('click', function () { goBook(undefined, b.dataset.ride); }); });

  /* fleet clips: load and loop only while the card is on screen (posters for reduced motion) */
  var rideVids = $$('.ride-v');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { v.preload = 'auto'; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.25 });
    rideVids.forEach(function (v) { v.muted = true; io.observe(v); });
  }

  /* ---------- "When": a calendar for the first and last day ---------- */
  var cal = (function (root) {
    var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var DAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var view = new Date(today.getFullYear(), today.getMonth(), 1), last = new Date(today.getFullYear() + 2, today.getMonth(), 1);
    var start = null, end = null, hover = null, focusD = new Date(today), keyNav = false;
    var arrow = function (d) { return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="' + (d < 0 ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5') + '"/></svg>'; };
    root.innerHTML = '<div class="cal-top"><button type="button" class="cal-nav" data-step="-1" aria-label="Previous month">' + arrow(-1) + '</button>' +
      '<p class="cal-title" aria-live="polite"></p><button type="button" class="cal-nav" data-step="1" aria-label="Next month">' + arrow(1) + '</button></div>' +
      '<table class="cal-grid" role="grid"><thead><tr>' + DAY.map(function (d) { return '<th scope="col" abbr="' + d + '">' + d.slice(0, 2) + '</th>'; }).join('') +
      '</tr></thead><tbody></tbody></table><div class="cal-foot"><p class="cal-sum" aria-live="polite"></p><button type="button" class="cal-clear" hidden>Clear dates</button></div>';
    var title = root.querySelector('.cal-title'), body = root.querySelector('tbody'), sum = root.querySelector('.cal-sum'), clr = root.querySelector('.cal-clear');
    var navs = root.querySelectorAll('.cal-nav');
    var same = function (a, b) { return a && b && a.getTime() === b.getTime(); };
    var key = function (d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
    var short = function (d) { return DAY[(d.getDay() + 6) % 7].slice(0, 3) + ' ' + d.getDate() + ' ' + MON[d.getMonth()].slice(0, 3); };
    var full = function (d) { return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); };
    var days = function (a, b) { return Math.round((b - a) / 864e5) + 1; };
    function draw() {
      title.textContent = MON[view.getMonth()] + ' ' + view.getFullYear();
      navs[0].disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
      navs[1].disabled = view >= last;
      var first = new Date(view), off = (first.getDay() + 6) % 7, n = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      if (focusD.getMonth() !== view.getMonth() || focusD.getFullYear() !== view.getFullYear()) focusD = new Date(view.getFullYear(), view.getMonth(), Math.max(1, view <= today ? today.getDate() : 1));
      var e2 = end || (start && hover && hover > start ? hover : null), html = '', d = 1;
      for (var r = 0; r < 6 && d <= n; r++) {
        html += '<tr>';
        for (var c = 0; c < 7; c++) {
          if ((r === 0 && c < off) || d > n) { html += '<td></td>'; continue; }
          var dt = new Date(view.getFullYear(), view.getMonth(), d), past = dt < today;
          var isS = same(dt, start), isE = same(dt, end) || (!end && same(dt, e2)), inR = start && e2 && dt > start && dt < e2;
          var cls = (past ? ' past' : '') + (isS ? ' s' : '') + (isE ? ' e' : '') + (inR ? ' in' : '') + (same(dt, today) ? ' now' : '') + (start && e2 && !same(start, e2) ? ' rng' : '');
          html += '<td role="gridcell" aria-selected="' + (isS || isE || !!inR) + '"><button type="button" class="d' + cls + '" data-k="' + key(dt) + '" tabindex="' + (same(dt, focusD) ? 0 : -1) + '"' +
            (past ? ' disabled' : '') + ' aria-label="' + DAY[c] + ' ' + full(dt) + (same(dt, today) ? ', today' : '') + '">' + d + '</button></td>';
          d++;
        }
        html += '</tr>';
      }
      body.innerHTML = html;
      if (keyNav) { var fb = body.querySelector('button[tabindex="0"]'); if (fb) fb.focus(); keyNav = false; }
      sum.textContent = !start ? 'Tap your first day, then your last.' :
        !end ? 'From ' + short(start) + '. Now tap your last day, or keep one day for a day trip.' :
        short(start) + (same(start, end) ? '' : ' to ' + short(end)) + ' ' + end.getFullYear() + ' · ' + days(start, end) + (days(start, end) === 1 ? ' day' : ' days');
      clr.hidden = !start;
    }
    function parse(k) { var a = k.split('-'); return new Date(+a[0], +a[1] - 1, +a[2]); }
    function pick(dt) {
      if (dt < today) return;
      if (!start || end) { start = dt; end = null; }
      else if (dt < start) start = dt;
      else end = dt;
      focusD = dt; hover = null;
      draw();
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.classList.contains('cal-nav')) { view = new Date(view.getFullYear(), view.getMonth() + (+b.dataset.step), 1); draw(); }
      else if (b.classList.contains('cal-clear')) { start = end = hover = null; draw(); }
      else if (b.dataset.k) pick(parse(b.dataset.k));
    });
    root.addEventListener('pointerover', function (e) {   // range preview for mice only (a tap must stay one tap)
      if (e.pointerType !== 'mouse') return;
      var b = e.target.closest('button.d');
      if (!b || !start || end) return;
      var dt = parse(b.dataset.k);
      if (!same(dt, hover)) { hover = dt; draw(); }
    });
    root.addEventListener('keydown', function (e) {
      var b = e.target.closest('button.d');
      if (!b) return;
      var dt = parse(b.dataset.k), k = e.key, step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[k];
      if (step) dt.setDate(dt.getDate() + step);
      else if (k === 'PageUp' || k === 'PageDown') dt.setMonth(dt.getMonth() + (k === 'PageUp' ? -1 : 1));
      else if (k === 'Home') dt.setDate(dt.getDate() - (dt.getDay() + 6) % 7);
      else if (k === 'End') dt.setDate(dt.getDate() + 6 - (dt.getDay() + 6) % 7);
      else return;
      e.preventDefault();
      if (dt < today) dt = new Date(today);
      focusD = dt; view = new Date(dt.getFullYear(), dt.getMonth(), 1); keyNav = true;
      if (view > last) view = new Date(last);
      draw();
    });
    draw();
    return {
      text: function () {
        if (!start) return '';
        if (!end || same(start, end)) return 'on ' + full(start) + (end ? '' : ' (last day not chosen yet)');
        return 'from ' + full(start) + ' to ' + full(end) + ' (' + days(start, end) + ' days)';
      }
    };
  })($('#cal'));

  var wa = (S.whatsapp || '').replace(/\D/g, '');
  if (wa) { var w = $('#wa'); w.href = 'https://wa.me/' + wa; w.hidden = false; }
  var rows = [];
  if (wa) rows.push('<li><span>WhatsApp</span><a href="https://wa.me/' + wa + '" target="_blank" rel="noopener">+' + esc(wa) + '</a></li>');
  if (S.phone) rows.push('<li><span>Phone</span><b>' + esc(S.phone) + '</b></li>');
  if (S.email) rows.push('<li><span>E-mail</span><b>' + esc(S.email) + '</b></li>');
  rows.push('<li><span>Trips start in</span><b>' + esc(S.base || 'Kenya') + '</b></li>');
  rows.push('<li><span>Rides</span><b>Land Cruiser or nganya party bus</b></li>');
  $('#contact').innerHTML = rows.join('');

  $('#enq').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = function (id) { return ($('#' + id).value || '').trim(); };
    var msg = 'Hello ' + S.name + ', I would like to book: ' + (v('f-trip') || 'a trip (not sure which yet)') + ' by ' + v('f-ride') +
      ' for ' + (v('f-group') || '2') + ' people' + (cal.text() ? ', ' + cal.text() : '') + '.' +
      (v('f-note') ? ' ' + v('f-note') : '') + ' Name: ' + (v('f-name') || '-') + '. Phone: ' + (v('f-phone') || '-') + '.';
    var st = $('#status');
    if (wa) {
      var url = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(msg);
      var win = null;
      try { win = window.open(url, '_blank', 'noopener'); } catch (err) { win = null; }
      st.innerHTML = win ? 'WhatsApp opened in a new tab with your request.' :
        'Your request is ready. <a class="btn" href="' + url + '" target="_blank" rel="noopener">Open WhatsApp</a>';
    } else if (S.email) {
      st.innerHTML = 'Send your request to <b>' + esc(S.email) + '</b>. <a href="mailto:' + esc(S.email) + '?subject=' + encodeURIComponent('Booking request') +
        '&amp;body=' + encodeURIComponent(msg) + '">Open your e-mail app</a>';
    } else {
      st.textContent = 'Online booking is not switched on yet, so nothing was sent.';
    }
  });

  /* ---------- start ---------- */
  measure();
  if (reduce) setPaused(true);
  render();
  if (!fromHash()) armSettle(300);                  // opened half-way between two films (e.g. after a reload): settle
  window.addEventListener('load', function () { measure(); render(); });
})();
