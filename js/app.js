/* =========================================================
   PhysLab app — UI 구성 + 애니메이션 루프
   ========================================================= */
(function () {
  const $ = s => document.querySelector(s);
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h !== undefined) e.innerHTML = h; return e; };
  const D = PS.D, fmt = PS.fmt;

  let sim = null;      // 현재 시뮬레이션 정의
  let P = {};          // 파라미터 값
  let st = null;       // 상태
  let hist = [];       // 그래프 기록
  let playing = true, speed = 1, hl = null, pinned = null;
  let graphCanvases = [];

  const cv = $('#cv'), ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;

  /* ── 캔버스 크기 ─────────────────────────────── */
  function sizeCanvas(c) {
    const r = c.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.max(1, Math.round(r.width * dpr));
    c.height = Math.max(1, Math.round(r.height * dpr));
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: r.width, h: r.height };
  }
  function resizeAll() {
    const s = sizeCanvas(cv); W = s.w; H = s.h;
    graphCanvases.forEach(g => { const q = sizeCanvas(g.canvas); g.w = q.w; g.h = q.h; });
    draw();
  }
  window.addEventListener('resize', resizeAll);

  /* ── 네비게이션 (기초 / 심화 트랙) ──────────── */
  let mode = 'basic';
  const lastOf = { basic: null, adv: null };

  function buildNav() {
    const list = $('#simlist'), groups = {};
    list.innerHTML = '';
    PS.sims.filter(s => (s.mode || 'basic') === mode)
      .forEach(s => (groups[s.category] = groups[s.category] || []).push(s));
    Object.keys(groups).forEach(cat => {
      list.appendChild(el('div', 'nav-group', cat));
      groups[cat].forEach(s => {
        const b = el('button', 'nav-item', s.title + '<small>' + s.sub + '</small>');
        b.dataset.id = s.id;
        b.onclick = () => load(s.id);
        list.appendChild(b);
      });
    });
  }

  /* ── 공식 렌더링: "{a}" → 색이 있는 항 ───────── */
  function renderFormula(tpl) {
    return tpl.replace(/\{(\w+)\}/g, (m, k) => {
      const v = sim.vars[k];
      if (!v) return k;
      return '<span class="term" data-term="' + k + '" style="color:' + v.color + '">' + v.symbol + '</span>';
    });
  }

  function showTerm(k) {
    const box = $('#termInfo');
    const v = k && sim.vars[k];
    if (!v) {
      box.innerHTML = '<span class="ti-hint">공식의 기호를 클릭하면 그 값이 화면 어디에서 작용하는지 알려줍니다.</span>';
      box.style.borderColor = '';
      return;
    }
    box.style.borderLeftColor = v.color;
    box.innerHTML =
      '<div class="ti-title"><span class="ti-sym" style="color:' + v.color + '">' + v.symbol + '</span>' +
      '<b>' + v.label + '</b>' + (v.unit ? '<span class="ti-hint">(' + v.unit + ')</span>' : '') + '</div>' +
      (v.where || '');
  }

  function setHL(k) {
    hl = k;
    document.querySelectorAll('.term').forEach(t => t.classList.toggle('on', t.dataset.term === k));
    document.querySelectorAll('.ctrl').forEach(c => c.classList.toggle('hot', c.dataset.key === k));
    showTerm(k);
  }

  /* ── 우측 패널 ──────────────────────────────── */
  function buildPanel() {
    // 공식
    const fbox = $('#formulas'); fbox.innerHTML = '';
    sim.formulas.forEach(f => {
      const d = el('div', 'formula');
      d.appendChild(el('div', 'fname', f.name));
      d.appendChild(el('div', 'fbody', renderFormula(f.tpl)));
      fbox.appendChild(d);
    });
    fbox.querySelectorAll('.term').forEach(t => {
      t.onmouseenter = () => setHL(t.dataset.term);
      t.onmouseleave = () => setHL(pinned);
      t.onclick = () => { pinned = (pinned === t.dataset.term) ? null : t.dataset.term; setHL(pinned); };
    });

    // 슬라이더
    const cbox = $('#controls'); cbox.innerHTML = '';
    sim.params.forEach(p => {
      const c = el('div', 'ctrl'); c.dataset.key = p.key;
      const top = el('div', 'ctrl-top');
      top.innerHTML =
        '<span class="ctrl-sym" style="color:' + p.color + '">' + (p.symbol || p.key) + '</span>' +
        '<span class="ctrl-label">' + p.label + '</span>' +
        '<span class="ctrl-val" data-v>' + fmt(P[p.key], p.dec) + '</span>' +
        '<span class="ctrl-unit">' + (p.unit || '') + '</span>';
      const r = el('input'); r.type = 'range';
      r.min = p.min; r.max = p.max; r.step = p.step; r.value = P[p.key];
      r.style.setProperty('--c', p.color);
      r.oninput = () => {
        P[p.key] = parseFloat(r.value);
        top.querySelector('[data-v]').textContent = fmt(P[p.key], p.dec);
        if (p.reset) reset(); else draw();
      };
      r.onmouseenter = () => setHL(p.key);
      r.onmouseleave = () => setHL(pinned);
      c.appendChild(top); c.appendChild(r);
      cbox.appendChild(c);
    });

    // 프리셋
    const pbox = $('#presets'); pbox.innerHTML = '';
    (sim.presets || []).forEach(pr => {
      const b = el('button', 'preset', pr.name);
      b.onclick = () => { Object.assign(P, pr.set); buildPanel(); reset(); };
      pbox.appendChild(b);
    });

    // 학습 포인트
    const n = $('#notes'); n.innerHTML = '';
    (sim.notes || []).forEach(t => n.appendChild(el('li', null, t)));
    setHL(pinned);
  }

  function buildGraphs() {
    const box = $('#graphs'); box.innerHTML = ''; graphCanvases = [];
    (sim.graphs || []).forEach(g => {
      const d = el('div', 'graph');
      const legend = g.series.map(s =>
        '<i style="color:' + s.color + '">■ ' + s.label + '</i>').join('');
      d.appendChild(el('h4', null, '<span>' + g.title + '</span>' + legend));
      const c = el('canvas'); d.appendChild(c);
      box.appendChild(d);
      graphCanvases.push({ def: g, canvas: c, ctx: c.getContext('2d'), w: 1, h: 1 });
    });
  }

  let roSig = '';
  function updateReadouts() {
    const box = $('#readouts');
    const rows = sim.readouts(st, P);
    const sig = sim.id + '|' + rows.map(r => r.label).join('|');
    if (sig !== roSig) {
      roSig = sig;
      box.innerHTML = '';
      rows.forEach(r => {
        const d = el('div', 'ro' + (r.wide ? ' wide' : ''));
        d.innerHTML = '<div class="rl">' + r.label + '</div><div class="rv" data-v style="color:' +
          (r.color || '#e8eefc') + '">—</div>';
        box.appendChild(d);
      });
    }
    rows.forEach((r, i) => {
      const v = box.children[i].querySelector('[data-v]');
      v.innerHTML = (typeof r.value === 'number' ? fmt(r.value, r.dec) : r.value) +
        (r.unit ? '<span class="ru">' + r.unit + '</span>' : '');
      v.style.color = r.color || '#e8eefc';
    });
  }

  /* ── 시뮬레이션 전환 / 리셋 ─────────────────── */
  function load(id) {
    sim = PS.byId[id];
    P = {}; sim.params.forEach(p => P[p.key] = p.value);
    pinned = null; hl = null;
    lastOf[sim.mode || 'basic'] = id;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('on', b.dataset.id === id));
    $('#simCat').className = 'chip' + (sim.mode === 'adv' ? ' adv' : '');
    $('#simCat').textContent = (sim.mode === 'adv' ? '심화 · ' : '') + sim.category;
    $('#simTitle').textContent = sim.title;
    $('#simTag').textContent = sim.tagline;
    buildPanel(); buildGraphs();
    reset(); resizeAll();
    playing = true; syncPlay();
  }

  function reset() {
    st = sim.init(P);
    st.t = 0;
    hist = [];
    sample();
    updateReadouts();
    draw();
  }

  function sample() {
    if (!sim.sample) return;
    const s = sim.sample(st, P);
    if (s) { s.t = st.t; hist.push(s); if (hist.length > 4000) hist.shift(); }
  }

  function syncPlay() {
    $('#playLabel').textContent = playing ? '일시정지' : '재생';
    $('#btnPlay').querySelector('.ico').textContent = playing ? '❚❚' : '▶';
  }

  /* ── 그리기 ─────────────────────────────────── */
  function draw() {
    if (!sim || !st) return;
    D.bg(ctx, W, H);
    sim.draw(ctx, st, P, { w: W, h: H, hl: hl, playing: playing });
    updateReadouts();
    graphCanvases.forEach(g => PS.drawGraph(g.ctx, g.w, g.h, g.def, hist, hl));
    $('#clock').textContent = st.t.toFixed(2);
  }

  /* ── 메인 루프 (고정 시간 간격 적분) ────────── */
  let last = 0, acc = 0, sampleAcc = 0;
  const DT = 1 / 480;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!sim) return;
    if (!last) last = now;
    let real = Math.min((now - last) / 1000, .05);
    last = now;
    if (playing) {
      acc += real * speed;
      let guard = 0;
      while (acc >= DT && guard++ < 4000) {
        sim.step(st, P, DT);
        st.t += DT;
        acc -= DT;
        sampleAcc += DT;
        if (sampleAcc >= 1 / 60) { sample(); sampleAcc = 0; }
      }
      if (st.done) { playing = false; syncPlay(); }
    }
    draw();
  }

  /* ── 컨트롤 바 ──────────────────────────────── */
  $('#btnPlay').onclick = () => {
    if (st.done) { reset(); playing = true; }
    else playing = !playing;
    syncPlay();
  };
  $('#btnReset').onclick = () => { reset(); playing = true; syncPlay(); };
  $('#speed').oninput = e => { speed = parseFloat(e.target.value); $('#speedVal').textContent = speed.toFixed(1) + '×'; };
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); $('#btnPlay').click(); }
    if (e.key === 'r' || e.key === 'R') $('#btnReset').click();
  });

  document.querySelectorAll('.mode').forEach(b => {
    b.onclick = () => {
      if (mode === b.dataset.mode) return;
      mode = b.dataset.mode;
      document.querySelectorAll('.mode').forEach(x => x.classList.toggle('on', x.dataset.mode === mode));
      buildNav();
      const first = PS.sims.find(s => (s.mode || 'basic') === mode);
      load(lastOf[mode] || (first && first.id));
      $('#simlist').scrollTop = 0;
    };
  });

  buildNav();
  load(PS.sims[0].id);
  requestAnimationFrame(frame);
})();
