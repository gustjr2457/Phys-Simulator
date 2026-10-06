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

  /* ── 네비게이션: 대분류(group) → 중분류(mode) → 소분류(category) ── */
  const GROUPS = [
    { id: 'core', label: '기초 과정', modes: ['concept', 'basic', 'general'] },
    { id: 'modern', label: '실험과 현대물리', modes: ['exp', 'quantum'] },
    { id: 'applied', label: '응용 분야', modes: ['aero', 'marine', 'mech', 'chem', 'elec', 'adv'] }
  ];
  const groupOf = m => (GROUPS.find(g => g.modes.indexOf(m) >= 0) || GROUPS[0]).id;
  const TRACK_LABEL = {
    concept: '초급 과정', basic: '고등물리', general: '일반물리',
    exp: '유명한 실험', quantum: '양자역학',
    aero: '항공우주공학', marine: '선박공학', mech: '기계공학',
    chem: '화학공학', elec: '전기공학', adv: '공학응용'
  };

  let group = 'core';
  let mode = 'concept';
  const lastOf = {};
  const lastModeOf = { core: 'concept', modern: 'exp', applied: 'aero' };

  // 선택된 대분류에 속한 중분류 버튼만 보여 준다
  function syncTabs() {
    const gd = GROUPS.find(g => g.id === group);
    $('#groupLabel').textContent = gd ? gd.label : '';
    document.querySelectorAll('.group-card').forEach(b => b.classList.toggle('on', b.dataset.group === group));
    document.querySelectorAll('.mode').forEach(b => {
      b.classList.toggle('off', b.dataset.group !== group);
      b.classList.toggle('on', b.dataset.mode === mode);
    });
  }

  function setMode(m) {
    mode = m;
    group = groupOf(m);
    lastModeOf[group] = m;
    syncTabs();
    buildNav();
    const first = PS.sims.find(s => (s.mode || 'basic') === mode);
    load(lastOf[mode] || (first && first.id));
    $('#simlist').scrollTop = 0;
  }

  function buildNav() {
    const list = $('#simlist'), groups = {};
    list.innerHTML = '';
    const inMode = PS.sims.filter(s => (s.mode || 'basic') === mode);
    if (!inMode.length) {
      list.appendChild(el('div', 'simlist-empty', '이 트랙은 아직 콘텐츠를 채우는 중입니다.<br>먼저 다른 트랙을 둘러봐 주세요.'));
      return;
    }
    inMode.forEach(s => (groups[s.category] = groups[s.category] || []).push(s));
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

  // 트랙별로 등록된 시뮬레이션이 하나도 없으면 탭에 '준비 중' 표시
  function markEmptyModes() {
    const has = {};
    PS.sims.forEach(s => { has[s.mode || 'basic'] = true; });
    document.querySelectorAll('.mode').forEach(b => {
      b.classList.toggle('empty', !has[b.dataset.mode]);
    });
  }

  /* ── 공식 렌더링: "{a}" → 색이 있는 항 ───────── */
  // vars를 인자로 받는 버전(전체 공식 모음 모달처럼 "현재 열려 있지 않은 다른 시뮬레이션"의
  // 공식을 그릴 때 씀) + 현재 sim.vars를 쓰는 기존 버전(우측 패널의 클릭 가능한 공식용).
  function renderFormulaWithVars(tpl, vars, interactive) {
    return tpl.replace(/\{(\w+)\}/g, (m, k) => {
      const v = vars[k];
      if (!v) return k;
      return interactive
        ? '<span class="term" data-term="' + k + '" style="color:' + v.color + '">' + v.symbol + '</span>'
        : '<span class="term-inline" style="color:' + v.color + '">' + v.symbol + '</span>';
    });
  }
  function renderFormula(tpl) { return renderFormulaWithVars(tpl, sim.vars, true); }

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

  /* ── 도전 과제(챌린지): 지금 슬라이더·시뮬레이션 상태가 목표를 만족하는지 매 프레임 확인 ── */
  let challengeSig = '';
  const challengeAchieved = {}; // simId -> Set(challengeId) — 세션 동안 "한 번이라도 성공"을 기억(새로고침하면 초기화)
  function updateChallenges() {
    const list = sim.challenges || [];
    const card = $('#questRoom'), box = $('#challenges');
    if (!list.length) { card.classList.add('hidden'); return; }
    card.classList.remove('hidden');
    const sig = sim.id + '|' + list.map(c => c.id).join('|');
    if (sig !== challengeSig) {
      challengeSig = sig;
      box.innerHTML = '';
      list.forEach(c => {
        const d = el('div', 'challenge');
        d.innerHTML =
          '<div class="ch-head"><span class="ch-badge" data-badge>·</span><b>' + c.title + '</b></div>' +
          '<div class="ch-desc">' + c.desc + '</div>' +
          (c.hint ? '<button type="button" class="ch-hint-btn" data-hintbtn>힌트 보기</button><div class="ch-hint" data-hint hidden>' + c.hint + '</div>' : '');
        box.appendChild(d);
      });
      box.querySelectorAll('[data-hintbtn]').forEach(btn => {
        btn.onclick = () => {
          const hbox = btn.nextElementSibling;
          hbox.hidden = !hbox.hidden;
          btn.textContent = hbox.hidden ? '힌트 보기' : '힌트 감추기';
        };
      });
    }
    const achieved = challengeAchieved[sim.id] || (challengeAchieved[sim.id] = new Set());
    list.forEach((c, i) => {
      let ok = false;
      try { ok = !!c.check({ P: P, st: st, t: st.t }); } catch (e) { ok = false; }
      if (ok) achieved.add(c.id);
      const node = box.children[i];
      if (!node) return;
      node.classList.toggle('ch-ok', ok);
      node.classList.toggle('ch-done-ever', achieved.has(c.id) && !ok);
      const badge = node.querySelector('[data-badge]');
      badge.textContent = ok ? '✅' : (achieved.has(c.id) ? '✔' : '·');
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
  function loadEmpty() {
    sim = null; st = null; playing = false;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('on'));
    $('#simCat').className = 'chip';
    $('#simCat').textContent = '준비 중';
    $('#simTitle').textContent = '이 트랙은 아직 준비 중입니다';
    $('#simTag').textContent = '다른 트랙에서 먼저 둘러봐 주세요. 곧 채워질 예정입니다.';
    $('#formulas').innerHTML = ''; $('#controls').innerHTML = ''; $('#presets').innerHTML = '';
    $('#readouts').innerHTML = ''; $('#notes').innerHTML = '';
    $('#challenges').innerHTML = ''; $('#questRoom').classList.add('hidden'); challengeSig = '';
    $('#graphs').innerHTML = ''; graphCanvases = [];
    D.bg(ctx, W, H);
    syncPlay();
  }

  function load(id) {
    if (!id) { loadEmpty(); return; }
    sim = PS.byId[id];
    P = {}; sim.params.forEach(p => P[p.key] = p.value);
    pinned = null; hl = null;
    lastOf[sim.mode || 'basic'] = id;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('on', b.dataset.id === id));
    $('#simCat').className = 'chip' + (groupOf(sim.mode || 'basic') === 'applied' ? ' adv' : '');
    $('#simCat').textContent = (TRACK_LABEL[sim.mode] ? TRACK_LABEL[sim.mode] + ' · ' : '') + sim.category;
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

  // 트랙(mode)을 안 가리고 특정 시뮬레이션으로 바로 이동(전체 공식 모음 모달에서 사용)
  function switchToSim(id) {
    const s = PS.byId[id];
    if (!s) return;
    mode = s.mode || 'basic';
    group = groupOf(mode);
    lastModeOf[group] = mode;
    syncTabs();
    buildNav();
    load(id);
    $('#simlist').scrollTop = 0;
  }

  /* ── 전체 공식 모음 모달 ─────────────────────── */
  let formulaIndexBuilt = false;

  function buildFormulaIndex() {
    if (formulaIndexBuilt) return;
    formulaIndexBuilt = true;
    const wrap = $('#formulaListWrap');
    wrap.innerHTML = '';
    GROUPS.forEach(g => {
      if (!PS.sims.some(s => g.modes.indexOf(s.mode || 'basic') >= 0)) return;
      wrap.appendChild(el('div', 'fx-group-title', g.label));
      g.modes.forEach(buildTrackBox);
    });

    function buildTrackBox(trackMode) {
      const inTrack = PS.sims.filter(s => (s.mode || 'basic') === trackMode);
      if (!inTrack.length) return;
      const trackBox = el('div', 'fx-track');
      trackBox.appendChild(el('h3', 'fx-track-title', TRACK_LABEL[trackMode] || trackMode));
      const groups = {};
      inTrack.forEach(s => (groups[s.category] = groups[s.category] || []).push(s));
      Object.keys(groups).forEach(cat => {
        trackBox.appendChild(el('div', 'fx-cat', cat));
        groups[cat].forEach(s => {
          const simBox = el('div', 'fx-sim');
          const searchText = [s.title, s.sub, cat].concat((s.formulas || []).map(f => f.name + ' ' + f.tpl)).join(' ').toLowerCase();
          simBox.dataset.search = searchText;
          simBox.appendChild(el('div', 'fx-sim-head',
            '<b>' + s.title + '</b><span class="fx-sub">' + s.sub + '</span><span class="fx-jump">열기 →</span>'));
          (s.formulas || []).forEach(f => {
            const fRow = el('div', 'fx-formula');
            fRow.appendChild(el('div', 'fx-fname', f.name));
            fRow.appendChild(el('div', 'fx-fbody', renderFormulaWithVars(f.tpl, s.vars || {}, false)));
            simBox.appendChild(fRow);
          });
          simBox.onclick = () => { closeFormulaModal(); switchToSim(s.id); };
          trackBox.appendChild(simBox);
        });
      });
      wrap.appendChild(trackBox);
    }
  }

  function filterFormulas(q) {
    q = q.trim().toLowerCase();
    document.querySelectorAll('.fx-sim').forEach(node => {
      node.style.display = (!q || node.dataset.search.includes(q)) ? '' : 'none';
    });
    document.querySelectorAll('.fx-cat').forEach(catEl => {
      let node = catEl.nextElementSibling, anyVisible = false;
      while (node && !node.classList.contains('fx-cat')) {
        if (node.classList.contains('fx-sim') && node.style.display !== 'none') anyVisible = true;
        node = node.nextElementSibling;
      }
      catEl.style.display = anyVisible ? '' : 'none';
    });
    document.querySelectorAll('.fx-track').forEach(trackEl => {
      const anyVisible = Array.from(trackEl.querySelectorAll('.fx-sim')).some(n => n.style.display !== 'none');
      trackEl.style.display = anyVisible ? '' : 'none';
    });
    const wrap = $('#formulaListWrap');
    let empty = wrap.querySelector('.fx-empty');
    const anyAtAll = Array.from(wrap.querySelectorAll('.fx-track')).some(t => t.style.display !== 'none');
    if (!anyAtAll && q) {
      if (!empty) { empty = el('div', 'fx-empty', '검색 결과가 없습니다.'); wrap.appendChild(empty); }
    } else if (empty) {
      empty.remove();
    }
  }

  function openFormulaModal() {
    buildFormulaIndex();
    $('#formulaModal').classList.remove('hidden');
    $('#formulaSearch').value = '';
    filterFormulas('');
    $('#formulaSearch').focus();
  }
  function closeFormulaModal() { $('#formulaModal').classList.add('hidden'); }

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
    updateChallenges();
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
    if (!sim || !st) return;
    if (st.done) { reset(); playing = true; }
    else playing = !playing;
    syncPlay();
  };
  $('#btnReset').onclick = () => { if (!sim) return; reset(); playing = true; syncPlay(); };
  $('#speed').oninput = e => { speed = parseFloat(e.target.value); $('#speedVal').textContent = speed.toFixed(1) + '×'; };
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); $('#btnPlay').click(); }
    if (e.key === 'r' || e.key === 'R') $('#btnReset').click();
  });

  $('#btnFormulaIndex').onclick = openFormulaModal;
  $('#btnCloseFormulas').onclick = closeFormulaModal;
  $('#formulaModal').onclick = e => { if (e.target.id === 'formulaModal') closeFormulaModal(); };
  $('#formulaSearch').oninput = e => filterFormulas(e.target.value);
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('#formulaModal').classList.contains('hidden')) closeFormulaModal();
  });

  /* ── 대분류 선택 메뉴 ─────────────────────── */
  function buildGroupMenu() {
    const box = $('#groupList');
    box.innerHTML = '';
    GROUPS.forEach(g => {
      const n = PS.sims.filter(s => g.modes.indexOf(s.mode || 'basic') >= 0).length;
      const subs = g.modes.map(m => TRACK_LABEL[m] || m).join(' · ');
      const card = el('button', 'group-card', '');
      card.dataset.group = g.id;
      card.innerHTML = '<div class="gc-top"><b>' + g.label + '</b><span class="gc-n">' + n + '종</span></div>' +
        '<div class="gc-sub">' + subs + '</div>';
      card.onclick = () => {
        closeGroupModal();
        if (group !== g.id) setMode(lastModeOf[g.id] || g.modes[0]);
      };
      box.appendChild(card);
    });
  }
  function openGroupModal() { buildGroupMenu(); syncTabs(); $('#groupModal').classList.remove('hidden'); }
  function closeGroupModal() { $('#groupModal').classList.add('hidden'); }

  $('#btnGroupMenu').onclick = openGroupModal;
  $('#btnCloseGroups').onclick = closeGroupModal;
  $('#groupModal').onclick = e => { if (e.target.id === 'groupModal') closeGroupModal(); };
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('#groupModal').classList.contains('hidden')) closeGroupModal();
  });

  document.querySelectorAll('.mode').forEach(b => {
    b.onclick = () => { if (mode !== b.dataset.mode) setMode(b.dataset.mode); };
  });

  markEmptyModes();
  syncTabs();
  buildNav();
  load(PS.sims[0].id);
  requestAnimationFrame(frame);
})();
