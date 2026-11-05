/* The Capacity Manual: funnel UI. Reads window.CM (installs.json) and mounts whatever the page has:
   [data-shelf] chapter books, [data-field] install tiles + [data-detail], [data-quiz], [data-hub],
   [data-mani] word reveal, plus reveal-on-scroll, nav border and the sticky bar. */
(function () {
  var CM = window.CM, doc = document;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var INSTALLS = window.CM_INSTALLS_URL || '#';
  var P = '<svg viewBox="0 0 24 24" aria-hidden="true">';
  var ICONS = {
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4.5-5.5"/><path d="M7 17h10"/>',
    stack: '<rect x="4" y="4" width="16" height="5" rx="1.5"/><rect x="4" y="11" width="16" height="4" rx="1.5"/><rect x="4" y="17" width="16" height="3" rx="1.5"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12.5l9 5 9-5"/><path d="M3 16.5l9 5 9-5"/>',
    atom: '<circle cx="12" cy="12" r="1.8"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
    shuffle: '<path d="M3 7h4l9 10h5"/><path d="M3 17h4l9-10h5"/><path d="M18 4l3 3-3 3"/><path d="M18 14l3 3-3 3"/>',
    frame: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h5"/><rect x="8" y="15" width="8" height="3" rx="1"/>',
    split: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M16 7v10"/><path d="M6 12h6"/>',
    check: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 12.5l3 3 5-6.5"/>',
    book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
    loop: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/>',
    nodes: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="12" cy="11" r="2.6"/><path d="M6.6 7.2l3.3 2.4M17.4 7.2l-3.3 2.4M12 13.6V17"/>',
    route: '<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h6a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h6"/>',
    chart: '<path d="M4 20V11M10 20V5M16 20v-6M3 20h18"/>',
    badge: '<circle cx="12" cy="9" r="5"/><path d="M9 13.4L8 21l4-2 4 2-1-7.6"/>',
    handoff: '<path d="M3 12h12"/><path d="M11 8l4 4-4 4"/><path d="M19 5v14"/>',
    spark: '<path d="M12 2.5v19M2.5 12h19M5.3 5.3l13.4 13.4M18.7 5.3L5.3 18.7"/>'
  };
  function icon(n) { return P + (ICONS[n] || ICONS.spark) + '</svg>'; }
  function part(c) { return CM.parts[c.part]; }
  function esc(s) { var d = doc.createElement('div'); d.textContent = s; return d.innerHTML; }
  function href(c) { return INSTALLS + (INSTALLS.indexOf('?') > -1 ? '&' : '?') + 'i=' + (c ? c.n : 'bundle'); }
  window.CMicon = icon;
  var installs = CM.chapters.filter(function (c) { return c.install; });

  /* Shelf of 17 chapter books */
  doc.querySelectorAll('[data-shelf]').forEach(function (el) {
    var row = doc.createElement('div'); row.className = 'shelf-row';
    CM.chapters.forEach(function (c, i) {
      var p = part(c), b = doc.createElement('button');
      b.className = 'book'; b.type = 'button'; b.style.setProperty('--c', p.color); b.style.setProperty('--k', p.ink); b.style.setProperty('--i', i);
      b.setAttribute('aria-label', 'Chapter ' + c.n + ': ' + c.title + (c.install ? '. AI install: ' + c.install : ''));
      b.innerHTML = '<span class="t"></span><span class="s"></span><span class="f"><span class="vt">' + esc(c.title) + (c.install ? '<i>' + esc(c.install) + '</i>' : '') + '</span><span class="ic">' + icon(c.icon) + '</span><span class="no">' + c.n + '</span></span>';
      b.addEventListener('click', function () { pick(c); });
      row.appendChild(b);
    });
    el.appendChild(row);
    // Wider than the screen: start at chapter 00 and drift slowly to chapter 16 and back.
    function fit() {
      row.classList.remove('drift');
      var ov = row.scrollWidth - el.clientWidth * .9;
      if (ov > 0 && !reduce) { row.classList.add('drift'); row.style.setProperty('--ov', ov + 'px'); row.style.setProperty('--t', Math.max(24, ov / 18) + 's'); }
    }
    fit(); addEventListener('resize', fit);
  });
  doc.querySelectorAll('[data-legend]').forEach(function (el) {
    el.innerHTML = Object.keys(CM.parts).map(function (k) { var p = CM.parts[k]; return '<span style="--c:' + p.color + '"><i></i>' + p.n + ' ' + p.name + '</span>'; }).join('');
  });

  /* Install tile field + detail card */
  var detail = doc.querySelector('[data-detail]'), tiles = {};
  function pick(c) {
    if (!detail) return;
    if (!c.install) c = installs[0];
    Object.keys(tiles).forEach(function (k) { tiles[k].classList.toggle('on', k === c.n); });
    doc.querySelectorAll('.book').forEach(function (b, i) { b.classList.toggle('on', CM.chapters[i] === c); });
    var p = part(c);
    detail.style.setProperty('--c', p.color); detail.style.setProperty('--k', p.ink);
    detail.innerHTML = '<span class="di">' + icon(c.icon) + '</span><div><div class="label">Chapter ' + c.n + ' · ' + esc(c.title) + '</div><h3>' + esc(c.install) + '</h3><p>' + esc(c.does) + '</p><div class="tags">' + c.tools.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div></div>' +
      '<div class="act"><a class="btn" href="' + href(c) + '">Install it <span class="pr">$' + CM.price_each + '</span></a><a class="lnk" href="' + href(null) + '">All ' + installs.length + ' installs for $' + CM.price_bundle + '</a></div>';
  }
  window.CMpick = pick;
  doc.querySelectorAll('[data-field]').forEach(function (el) {
    var cols = 8, rows = 5, hub = { r: 1, c: 3 };
    // Install positions around the 2x2 hub, ringed by faded empty tiles.
    var slots = [[0, 2], [0, 3], [0, 4], [0, 5], [1, 1], [1, 2], [1, 5], [1, 6], [2, 1], [2, 2], [2, 5], [2, 6], [3, 2], [3, 3], [3, 4], [3, 5]];
    var map = {}; slots.forEach(function (s, i) { map[s[0] + ',' + s[1]] = installs[i]; });
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      if ((r === hub.r || r === hub.r + 1) && (c === hub.c || c === hub.c + 1)) {
        if (r === hub.r && c === hub.c) { var h = doc.createElement('div'); h.className = 'tile hubt'; h.innerHTML = icon('spark'); h.setAttribute('aria-hidden', 'true'); el.appendChild(h); }
        continue;
      }
      var inst = map[r + ',' + c], t;
      if (inst) {
        t = doc.createElement('button'); t.type = 'button'; t.className = 'tile inst'; t.style.setProperty('--c', part(inst).color === '#101a15' ? '#3d4a43' : part(inst).color);
        t.setAttribute('aria-label', inst.install + ', chapter ' + inst.n);
        t.innerHTML = '<span class="n">' + inst.n + '</span>' + icon(inst.icon);
        (function (x) { t.addEventListener('click', function () { pick(x); }); t.addEventListener('mouseenter', function () { if (matchMedia('(hover:hover)').matches) pick(x); }); })(inst);
        tiles[inst.n] = t;
      } else {
        t = doc.createElement('div'); t.className = 'tile ghost'; t.setAttribute('aria-hidden', 'true');
        var dist = Math.max(Math.abs(r - 2), Math.abs(c - 3.5) / 1.4);
        t.style.setProperty('--o', Math.max(.12, .75 - dist * .2).toFixed(2));
        if (c === 0 || c === cols - 1) t.classList.add('edge');
      }
      el.appendChild(t);
    }
    pick(installs[0]);
  });

  /* Quiz: three questions, one install per answer */
  doc.querySelectorAll('[data-quiz]').forEach(function (el) {
    var Q = [
      { q: 'Where does a new email start in your studio?', o: [['A blank frame', '02'], ['Last month\'s email', '04'], ['A template library', '05'], ['Waiting on copy', '06']] },
      { q: 'What eats your review time?', o: [['Files nobody else can open', '03'], ['The same feedback, again', '09'], ['Broken exports', '08'], ['Drift from the brand', '10']] },
      { q: 'Where does the work get lost?', o: [['Who is doing what', '11'], ['Requests and briefs', '12'], ['The Black Friday surge', '13'], ['Agency handoffs', '15']] }
    ];
    var step = 0, ans = [], sel = null;
    var byN = {}; CM.chapters.forEach(function (c) { byN[c.n] = c; });
    el.innerHTML = '<div class="qcard"><div class="qtop"><button type="button" class="qb" aria-label="Back">←</button><div class="qtrack"><div class="qfill"></div><span class="qpill"></span></div><button type="button" class="qx" aria-label="Start over">×</button></div><p class="qq" aria-live="polite"></p><div class="qopts" role="radiogroup"></div><button type="button" class="qnext" disabled>Continue</button></div>';
    var qq = el.querySelector('.qq'), opts = el.querySelector('.qopts'), next = el.querySelector('.qnext'), fill = el.querySelector('.qfill'), pill = el.querySelector('.qpill');
    function prog(i) { var w = Math.min(100, (i + 1) / Q.length * 100); fill.style.width = w + '%'; pill.style.left = w + '%'; pill.textContent = Math.min(i + 1, Q.length) + '/' + Q.length; }
    function render() {
      if (step >= Q.length) return result();
      var q = Q[step]; prog(step); sel = ans[step] || null; qq.textContent = q.q; next.hidden = false; next.disabled = !sel; next.textContent = step === Q.length - 1 ? 'See my installs' : 'Continue';
      opts.innerHTML = q.o.map(function (o, i) { return '<button type="button" role="radio" class="qopt' + (sel === o[1] ? ' sel' : '') + '" aria-checked="' + (sel === o[1]) + '" data-v="' + o[1] + '"><i>' + 'ABCD'[i] + '</i>' + esc(o[0]) + '<span class="ck">✓</span></button>'; }).join('');
      opts.querySelectorAll('.qopt').forEach(function (b) { b.addEventListener('click', function () { sel = b.dataset.v; ans[step] = sel; opts.querySelectorAll('.qopt').forEach(function (x) { x.classList.toggle('sel', x === b); x.setAttribute('aria-checked', x === b); }); next.disabled = false; }); });
    }
    function result() {
      prog(Q.length - 1); pill.textContent = 'Done';
      qq.textContent = 'Your first three installs.';
      opts.innerHTML = '<div class="qres">' + ans.map(function (n) { var c = byN[n], p = part(c); return '<a class="r" href="' + href(c) + '" style="--c:' + p.color + ';--k:' + p.ink + '"><span class="di">' + icon(c.icon) + '</span><span><b>' + esc(c.install) + '</b><small>Chapter ' + c.n + ' · ' + esc(c.title) + '</small></span><span class="p">$' + CM.price_each + '</span></a>'; }).join('') + '</div>';
      next.textContent = 'Start with the manual · $9'; next.disabled = false;
    }
    next.addEventListener('click', function () { if (step >= Q.length) { var t = doc.querySelector('#checkout'); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return; } if (sel) { step++; render(); } });
    el.querySelector('.qb').addEventListener('click', function () { if (step > 0) { step = Math.min(step, Q.length) - 1; render(); } });
    el.querySelector('.qx').addEventListener('click', function () { step = 0; ans = []; render(); });
    render();
  });

  /* Hub wires: curves from each input chip to the core, and from the core to each tool */
  doc.querySelectorAll('[data-hub]').forEach(function (el) {
    var svg = el.querySelector('svg.wires'), core = el.querySelector('.core');
    function draw() {
      if (getComputedStyle(svg).display === 'none') return;
      var b = el.getBoundingClientRect(), cr = core.getBoundingClientRect();
      var cx = cr.left - b.left + cr.width / 2, cy = cr.top - b.top + cr.height / 2, out = '';
      svg.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
      el.querySelectorAll('.hub-in .chip').forEach(function (n, i) { var r = n.getBoundingClientRect(), x = r.right - b.left, y = r.top - b.top + r.height / 2, d = 'M' + x + ' ' + y + ' C' + (x + 90) + ' ' + y + ' ' + (cx - 140) + ' ' + cy + ' ' + (cx - cr.width / 2) + ' ' + cy; out += '<path d="' + d + '"/><path class="flow" style="animation-delay:' + (-i * .7) + 's" d="' + d + '"/>'; });
      el.querySelectorAll('.hub-out .tool').forEach(function (n, i) { var r = n.getBoundingClientRect(), x = r.left - b.left, y = r.top - b.top + r.height / 2, d = 'M' + (cx + cr.width / 2) + ' ' + cy + ' C' + (cx + 140) + ' ' + cy + ' ' + (x - 90) + ' ' + y + ' ' + x + ' ' + y; out += '<path d="' + d + '"/><path class="flow" style="animation-delay:' + (-i * .45) + 's" d="' + d + '"/>'; });
      svg.innerHTML = out;
    }
    draw(); addEventListener('resize', draw); if (doc.fonts) doc.fonts.ready.then(draw);
  });

  /* Manifesto: words light up as they scroll past the middle of the screen */
  doc.querySelectorAll('[data-mani] p.l').forEach(function (p) {
    p.innerHTML = p.innerHTML.replace(/(<em>.*?<\/em>|[^\s<]+)/g, '<span class="w">$1</span>');
  });
  var words = [].slice.call(doc.querySelectorAll('[data-mani] .w'));
  function lit() { var mid = innerHeight * .62; words.forEach(function (w) { w.classList.toggle('on', w.getBoundingClientRect().top < mid); }); }
  if (words.length) { if (reduce) words.forEach(function (w) { w.classList.add('on'); }); else { addEventListener('scroll', lit, { passive: true }); lit(); } }

  /* Reveal, nav, sticky bar */
  doc.documentElement.classList.add('js');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px' });
    doc.querySelectorAll('.rv').forEach(function (el) { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); io.observe(el); } });
  }
  var nav = doc.querySelector('.nav'), sticky = doc.querySelector('.sticky'), co = doc.getElementById('checkout');
  function onScroll() {
    if (nav) nav.classList.toggle('scrolled', scrollY > 8);
    if (sticky && co) { var r = co.getBoundingClientRect(); sticky.classList.toggle('show', scrollY > 900 && !(r.top < innerHeight && r.bottom > 0)); }
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
})();
