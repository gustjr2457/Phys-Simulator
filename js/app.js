/* =========================================================
   PhysLab app — UI 구성 + 애니메이션 루프
   ─ 구성 ─────────────────────────────────────────────
     1. 캔버스 크기와 화면 배율
     2. 주소(#/시뮬레이션id)와 저장(localStorage)
     3. 네비게이션: 대분류 → 중분류(과정) → 소분류
     4. 우측 패널: 공식 · 슬라이더 · 프리셋 · 측정값
     5. 도전 과제
     6. 시뮬레이션 전환 / 리셋
     7. 모달 (분야 선택 · 전체 공식 모음)
     8. 그리기 + 고정 시간 간격 루프
     9. 키보드 · 컨트롤 바
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
  const cvText = $('#cvText'), tctx = cvText.getContext('2d');   // 글자 층 (core.js textTarget)
  let W = 0, H = 0, dpr = 1;

  /* ── 1. 캔버스 크기와 화면 배율 ─────────────────────
     캔버스는 css 와 같은 배율(루트 글자 크기 / 14px)로 그린다. 27" 에서 패널 글자가 커지면
     캔버스 안의 글자·선도 같이 커진다. 시뮬레이션은 배율을 몰라도 된다 — 넘겨받는 w, h 가
     "논리" 크기이기 때문이다. 폰처럼 무대가 좁으면 글자가 읽히는 선(0.78)까지만 줄여
     그림이 들어갈 자리를 만든다. */
  function uiScale(cssW) {
    const root = (parseFloat(getComputedStyle(document.documentElement).fontSize) || 14) / 14;
    return cssW < 600 ? root * Math.max(.78, cssW / 600) : root;
  }
  function sizeCanvas(c, shrinkable) {
    const r = c.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const s = uiScale(shrinkable ? r.width : Infinity);
    c.width = Math.max(1, Math.round(r.width * dpr));
    c.height = Math.max(1, Math.round(r.height * dpr));
    c.getContext('2d').setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
    return { w: r.width / s, h: r.height / s };
  }
  /* ── 형광 잔광(phosphor) ─────────────────────────
     원본(#cv)은 매 프레임 정확히 다시 그린다. 그 위의 #cvGlow 는 원본을 반 해상도로 받아
     css 로 흐리게 번지게 한 "빛" 층인데, 매 프레임 지우지 않고 지수 이동 평균으로 섞는다:
         빛 ← (1 − f)·빛 + f·원본,   f = 1 − e^(−Δt/τ)
     그래서 멈춘 것은 원본과 똑같은 빛으로 수렴하고(밝아지지 않는다), 움직이는 것은 지나온 자리에
     빛이 τ 동안 남아 혜성 꼬리가 된다. 강조가 켜지고 꺼질 때, 시뮬레이션을 바꿀 때도 빛이 녹듯 바뀐다.
     τ 는 주사율과 무관하게 실제 시간 기준이다. 움직임 줄이기 설정이면 꼬리 없이 빛만 남긴다. */
  const glow = $('#cvGlow'), gctx = glow.getContext('2d');
  const halo = $('#cvHalo'), hctx = halo.getContext('2d');
  const fxOn = !/[?&]fx=off/.test(location.search);
  if (!fxOn) document.documentElement.classList.add('fx-off');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = .22, TAU_BOOT = .7, BOOT_UNTIL = performance.now() + 1400;   // 처음 1.4초는 천천히 데워진다
  let gW = 1, gH = 1;
  function sizeGlow() {
    const r = cv.getBoundingClientRect();
    gW = glow.width = Math.max(1, Math.round(r.width / 2));
    gH = glow.height = Math.max(1, Math.round(r.height / 2));
    gctx.fillStyle = '#000'; gctx.fillRect(0, 0, gW, gH);
    halo.width = Math.max(1, Math.round(gW / 2)); halo.height = Math.max(1, Math.round(gH / 2));
  }
  function glowFrame(dtSec) {
    if (!fxOn || !dtSec) return;
    const tau = reduceMotion.matches ? 0 : (performance.now() < BOOT_UNTIL ? TAU_BOOT : TAU);
    const f = tau ? 1 - Math.exp(-dtSec / tau) : 1;
    // 검은 불투명 바탕 위에서 섞는다 — 픽셀 값이 곧 보이는 밝기가 되어 css 의 contrast 로 문턱을 걸 수 있다
    // (넓은 반투명 면은 어두워서 잘려 나가고, 밝은 선·점만 번진다). 검정은 screen 혼합에서 빛을 더하지 않는다.
    gctx.globalCompositeOperation = 'source-over';              // 빛 × (1 − f) — 검정 쪽으로 식는다
    gctx.globalAlpha = f; gctx.fillStyle = '#000'; gctx.fillRect(0, 0, gW, gH);
    gctx.globalCompositeOperation = 'lighter';                  // + f · 원본  (선형 합)
    gctx.drawImage(cv, 0, 0, gW, gH);
    gctx.globalCompositeOperation = 'source-over'; gctx.globalAlpha = 1;
    hctx.drawImage(glow, 0, 0, halo.width, halo.height);   // 후광은 이미 섞인 빛을 작게 받아 넓게 번지게만 한다
  }
  // 도전 과제를 처음 달성한 순간 — 무대 전체가 한 번 빛난다 (드문 순간, 모션 단계 c 에서만)
  // (css 의 filter 와 같은 함수 목록이어야 중간값이 부드럽게 보간된다)
  function glowPulse() {
    if (!fxOn || reduceMotion.matches || !document.documentElement.classList.contains('m-c')) return;
    glow.animate([{ opacity: .85, filter: getComputedStyle(glow).filter },
                  { opacity: 1, filter: 'contrast(1.6) blur(.9rem) brightness(3) saturate(1.7)', offset: .25 },
                  { opacity: .85, filter: getComputedStyle(glow).filter }],
                 { duration: 900, easing: 'cubic-bezier(.23,1,.32,1)' });
  }

  function resizeAll() {
    const s = sizeCanvas(cv, true); W = s.w; H = s.h;
    sizeCanvas(cvText, true);
    sizeGlow();
    graphCanvases.forEach(g => { const q = sizeCanvas(g.canvas, false); g.w = q.w; g.h = q.h; });
    draw();
  }
  // 창 크기뿐 아니라 그래프·문제방이 생기고 사라지며 무대 높이가 바뀌는 것도 잡는다
  let resizeQueued = false;
  const ro = new ResizeObserver(() => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => { resizeQueued = false; resizeAll(); });
  });
  ro.observe(cv);
  window.addEventListener('resize', resizeAll);   // 루트 글자 크기(배율)만 바뀌는 경우
  // 좁은 화면에서 무대를 네비 바로 아래에 고정하려면 네비의 실제 높이가 필요하다
  new ResizeObserver(([e]) => {
    document.documentElement.style.setProperty('--nav-h', Math.round(e.target.getBoundingClientRect().height) + 'px');
  }).observe($('#nav'));

  /* ── 2. 주소와 저장 ──────────────────────────────
     주소: #/시뮬레이션id — 링크로 공유하고, 새로고침해도 그 자리, 뒤로 가기도 된다.
     저장: 마지막으로 본 시뮬레이션 · 재생 속도 · 달성한 도전 과제.
     저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서도 앱은 그대로 동작한다. */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('physlab.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('physlab.' + k, JSON.stringify(v)); } catch (e) { /* 저장 못 해도 진행 */ } }
  };
  const idFromHash = () => { const m = location.hash.match(/^#\/([\w-]+)/); return m && PS.byId[m[1]] ? m[1] : null; };
  function setUrl(id, push) {
    if (idFromHash() === id) return;
    history[push ? 'pushState' : 'replaceState'](null, '', '#/' + id);
  }
  window.addEventListener('hashchange', () => {
    const id = idFromHash();
    if (id && (!sim || id !== sim.id)) switchToSim(id, false);
  });

  /* ── 3. 네비게이션: 대분류(group) → 중분류(mode) → 소분류(category) ── */
  const GROUPS = [
    { id: 'core', label: '기초 물리학', modes: ['concept', 'basic', 'general'] },
    { id: 'modern', label: '현대물리와 우주', modes: ['exp', 'quantum', 'astro'] },
    { id: 'applied', label: '공학 응용', modes: ['aero', 'marine', 'mech', 'adv'] }
  ];
  const groupOf = m => (GROUPS.find(g => g.modes.indexOf(m) >= 0) || GROUPS[0]).id;
  const TRACK_LABEL = {
    concept: '초급 과정', basic: '고등물리', general: '일반물리',
    exp: '유명한 실험', quantum: '양자역학', astro: '천문학',
    aero: '항공우주공학', marine: '선박공학', mech: '기계공학', adv: '공학응용'
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
      const on = b.dataset.mode === mode;
      b.classList.toggle('off', b.dataset.group !== group);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
  }

  function setMode(m) {
    mode = m;
    group = groupOf(m);
    lastModeOf[group] = m;
    syncTabs();
    buildNav();
    const first = PS.sims.find(s => (s.mode || 'basic') === mode);
    load(lastOf[mode] || (first && first.id), true);
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
        b.type = 'button';
        b.dataset.id = s.id;
        b.onclick = () => load(s.id, true);
        list.appendChild(b);
      });
    });
    markCurrent();
  }
  function markCurrent() {
    document.querySelectorAll('.nav-item').forEach(b => {
      const on = !!sim && b.dataset.id === sim.id;
      b.classList.toggle('on', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
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

  /* ── 4. 우측 패널 ───────────────────────────────── */
  // 공식 렌더링: "{a}" → 색이 있는 항.
  // vars 를 인자로 받는 버전(전체 공식 모음처럼 "지금 열려 있지 않은" 시뮬레이션의 공식용)과
  // 현재 sim.vars 를 쓰는 버전(우측 패널의 누를 수 있는 공식용).
  function renderFormulaWithVars(tpl, vars, interactive) {
    return tpl.replace(/\{(\w+)\}/g, (m, k) => {
      const v = vars[k];
      if (!v) return k;
      return interactive
        ? '<span class="term" data-term="' + k + '" style="color:' + v.color + '" tabindex="0" role="button" aria-pressed="false" aria-label="' +
          v.symbol + ' — ' + v.label + '">' + v.symbol + '</span>'
        : '<span class="term-inline" style="color:' + v.color + '">' + v.symbol + '</span>';
    });
  }
  function renderFormula(tpl) { return renderFormulaWithVars(tpl, sim.vars, true); }

  function showTerm(k) {
    const box = $('#termInfo');
    const v = k && sim.vars[k];
    if (!v) {
      box.innerHTML = '<span class="ti-hint">공식의 기호를 누르면 그 값이 화면 어디에서 작용하는지 알려줍니다.</span>';
      box.style.borderLeftColor = '';
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
    document.querySelectorAll('.term').forEach(t => {
      t.classList.toggle('on', t.dataset.term === k);
      t.setAttribute('aria-pressed', t.dataset.term === pinned);
    });
    document.querySelectorAll('.ctrl').forEach(c => c.classList.toggle('hot', c.dataset.key === k));
    showTerm(k);
  }
  const togglePin = k => { pinned = (pinned === k) ? null : k; setHL(pinned); };

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
      const k = t.dataset.term;
      t.onmouseenter = () => setHL(k);
      t.onmouseleave = () => setHL(pinned);
      t.onfocus = () => setHL(k);
      t.onblur = () => setHL(pinned);
      t.onclick = () => togglePin(k);
      t.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePin(k); } };
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
      r.setAttribute('aria-label', p.label + ' (' + (p.symbol || p.key) + ')');
      const valueText = () => fmt(P[p.key], p.dec) + (p.unit ? ' ' + p.unit : '');
      r.setAttribute('aria-valuetext', valueText());
      r.oninput = () => {
        P[p.key] = parseFloat(r.value);
        top.querySelector('[data-v]').textContent = fmt(P[p.key], p.dec);
        r.setAttribute('aria-valuetext', valueText());
        if (p.reset) reset(); else draw();
      };
      r.onmouseenter = r.onfocus = () => setHL(p.key);
      r.onmouseleave = r.onblur = () => setHL(pinned);
      c.appendChild(top); c.appendChild(r);
      cbox.appendChild(c);
    });

    // 프리셋
    const pbox = $('#presets'); pbox.innerHTML = '';
    (sim.presets || []).forEach(pr => {
      const b = el('button', 'preset', pr.name);
      b.type = 'button';
      b.onclick = () => { Object.assign(P, pr.set); buildPanel(); reset(); };
      pbox.appendChild(b);
    });

    // 학습 포인트
    const n = $('#notes'); n.innerHTML = '';
    (sim.notes || []).forEach(t => n.appendChild(el('li', null, t)));
    setHL(pinned);
  }

  function buildGraphs() {
    graphCanvases.forEach(g => ro.unobserve(g.canvas));
    const box = $('#graphs'); box.innerHTML = ''; graphCanvases = [];
    (sim.graphs || []).forEach(g => {
      const d = el('div', 'graph');
      const legend = g.series.map(s =>
        '<i style="color:' + s.color + '"><span aria-hidden="true">■ </span>' + s.label + '</i>').join('');
      d.appendChild(el('h4', null, '<span>' + g.title + '</span>' + legend));
      const c = el('canvas'); c.setAttribute('role', 'img'); c.setAttribute('aria-label', g.title + ' 그래프');
      d.appendChild(c);
      box.appendChild(d);
      graphCanvases.push({ def: g, canvas: c, ctx: c.getContext('2d'), w: 1, h: 1 });
      ro.observe(c);
    });
  }

  // 측정값 — 매 프레임 불리므로 바뀐 칸만 DOM 에 쓴다
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
        d.innerHTML = '<div class="rl">' + r.label + '</div><div class="rv" data-v>—</div>';
        box.appendChild(d);
      });
    }
    rows.forEach((r, i) => {
      const v = box.children[i].querySelector('[data-v]');
      const html = (typeof r.value === 'number' ? fmt(r.value, r.dec) : r.value) +
        (r.unit ? '<span class="ru">' + r.unit + '</span>' : '');
      const color = r.color || 'var(--tx)';
      if (v._html !== html) { v.innerHTML = html; v._html = html; }
      if (v._color !== color) { v.style.color = color; v._color = color; }
    });
  }

  /* ── 5. 도전 과제: 지금 슬라이더·시뮬레이션 상태가 목표를 만족하는지 매 프레임 확인 ── */
  let challengeSig = '';
  // simId -> Set(challengeId) — "한 번이라도 성공"한 과제. 새로고침해도 남는다.
  const challengeAchieved = {};
  Object.entries(store.get('achieved', {})).forEach(([k, v]) => { challengeAchieved[k] = new Set(v); });
  const saveAchieved = () => store.set('achieved',
    Object.fromEntries(Object.entries(challengeAchieved).map(([k, s]) => [k, [...s]])));

  function updateChallenges() {
    const list = sim.challenges || [];
    const card = $('#questRoom'), box = $('#challenges');
    if (!list.length) { card.classList.add('hidden'); return; }
    card.classList.remove('hidden');
    const sig = sim.id + '|' + list.map(c => c.id).join('|');
    const fresh = sig !== challengeSig;   // 방금 열었다 — 이미 만족된 과제는 사용자가 한 일이 아니다
    if (fresh) {
      challengeSig = sig;
      box.innerHTML = '';
      list.forEach(c => {
        const d = el('div', 'challenge');
        d.innerHTML =
          '<div class="ch-head"><span class="ch-badge" data-badge aria-hidden="true">·</span><b>' + c.title + '</b>' +
          '<span class="sr-only" data-state></span></div>' +
          '<div class="ch-desc">' + c.desc + '</div>' +
          (c.hint ? '<button type="button" class="ch-hint-btn" data-hintbtn aria-expanded="false">힌트 보기</button>' +
                    '<div class="ch-hint" data-hint hidden>' + c.hint + '</div>' : '');
        box.appendChild(d);
      });
      box.querySelectorAll('[data-hintbtn]').forEach(btn => {
        btn.onclick = () => {
          const hbox = btn.nextElementSibling;
          hbox.hidden = !hbox.hidden;
          btn.textContent = hbox.hidden ? '힌트 보기' : '힌트 감추기';
          btn.setAttribute('aria-expanded', !hbox.hidden);
        };
      });
    }
    const achieved = challengeAchieved[sim.id] || (challengeAchieved[sim.id] = new Set());
    list.forEach((c, i) => {
      let ok = false;
      try { ok = !!c.check({ P: P, st: st, t: st.t }); } catch (e) { ok = false; }
      const first = ok && !achieved.has(c.id) && !fresh;
      if (ok && !achieved.has(c.id)) { achieved.add(c.id); saveAchieved(); }
      const node = box.children[i];
      if (!node) return;
      // 처음 달성한 순간에만 — 화면(motion.css 의 .ch-new)과 화면 읽기 프로그램 둘 다에 알린다
      if (first) {
        node.classList.add('ch-new'); setTimeout(() => node.classList.remove('ch-new'), 900);
        $('#announcer').textContent = '도전 과제 달성: ' + c.title;
        glowPulse();
      }
      node.classList.toggle('ch-ok', ok);
      node.classList.toggle('ch-done-ever', achieved.has(c.id) && !ok);
      const badge = ok ? '●' : (achieved.has(c.id) ? '✔' : '·');
      const b = node.querySelector('[data-badge]');
      if (b.textContent !== badge) {
        b.textContent = badge;
        node.querySelector('[data-state]').textContent = ok ? ' — 지금 달성 중' : achieved.has(c.id) ? ' — 달성한 적 있음' : ' — 아직';
      }
    });
  }

  /* ── 6. 시뮬레이션 전환 / 리셋 ─────────────────── */
  function loadEmpty() {
    sim = null; st = null; playing = false;
    markCurrent();
    $('#simCat').className = 'chip';
    $('#simCat').textContent = '준비 중';
    $('#simTitle').textContent = '이 트랙은 아직 준비 중입니다';
    $('#simTag').textContent = '다른 트랙에서 먼저 둘러봐 주세요. 곧 채워질 예정입니다.';
    $('#formulas').innerHTML = ''; $('#controls').innerHTML = ''; $('#presets').innerHTML = '';
    $('#readouts').innerHTML = ''; $('#notes').innerHTML = '';
    $('#challenges').innerHTML = ''; $('#questRoom').classList.add('hidden'); challengeSig = '';
    graphCanvases.forEach(g => ro.unobserve(g.canvas)); graphCanvases = []; $('#graphs').innerHTML = '';
    D.bg(ctx, W, H);
    tctx.clearRect(0, 0, W, H);
    syncPlay();
  }

  // push: 사용자가 직접 고른 것이면 방문 기록에 남겨 뒤로 가기가 되게 한다
  function load(id, push) {
    if (!id) { loadEmpty(); return; }
    sim = PS.byId[id];
    st = null;   // 이전 시뮬레이션의 상태를 새 시뮬레이션이 그리지 않게 — reset() 전까지 draw() 는 건너뛴다
    P = {}; sim.params.forEach(p => P[p.key] = p.value);
    pinned = null; hl = null;
    lastOf[sim.mode || 'basic'] = id;
    markCurrent();
    $('#simCat').className = 'chip' + (groupOf(sim.mode || 'basic') === 'applied' ? ' adv' : '');
    $('#simCat').textContent = (TRACK_LABEL[sim.mode] ? TRACK_LABEL[sim.mode] + ' · ' : '') + sim.category;
    $('#simTitle').textContent = sim.title;
    $('#simTag').textContent = sim.tagline;
    document.title = sim.title + ' — PhysLab';
    cv.setAttribute('aria-label', sim.title + '. ' + sim.tagline);
    buildPanel(); buildGraphs();
    // 크기를 먼저 정하고 그린다 — 주소로 바로 들어오면 첫 그리기 때 캔버스가 아직 0×0 이다
    resizeAll(); reset();
    playing = true; syncPlay();
    setUrl(id, push);
    store.set('last', id);
  }

  function reset() {
    st = sim.init(P);
    st.t = 0;
    hist = [];
    sample();
    updateReadouts();
    draw();
  }

  // 과정(mode)을 가리지 않고 특정 시뮬레이션으로 바로 이동 (전체 공식 모음 · 주소 · 처음 열기)
  function switchToSim(id, push) {
    const s = PS.byId[id];
    if (!s) return;
    mode = s.mode || 'basic';
    group = groupOf(mode);
    lastModeOf[group] = mode;
    syncTabs();
    buildNav();
    load(id, push);
    const cur = document.querySelector('.nav-item.on');
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function sample() {
    if (!sim.sample) return;
    const s = sim.sample(st, P);
    if (s) { s.t = st.t; hist.push(s); if (hist.length > 4000) hist.shift(); }
  }

  function syncPlay() {
    $('.stage').classList.toggle('is-paused', !playing);   // RUN 표시등
    $('#playLabel').textContent = playing ? '일시정지' : '재생';
    $('#btnPlay').querySelector('.ico').textContent = playing ? '❚❚' : '▶';
  }

  /* ── 7. 모달 ────────────────────────────────────
     열면 포커스를 안으로 옮기고 뒤쪽 화면은 inert(누를 수도, 탭으로 갈 수도 없음)로 만든다.
     닫으면 연 버튼으로 포커스를 돌려준다. Esc 로 닫을 때는 움직이지 않는다(data-instant). */
  const BACKDROP = ['#nav', '#main', '#panel'];
  let modalOpen = null, returnFocus = null;
  function openModal(m, focusEl) {
    if (modalOpen) closeModal(modalOpen, true);
    returnFocus = document.activeElement;
    delete m.dataset.instant;
    m.classList.remove('hidden');
    BACKDROP.forEach(s => { $(s).inert = true; });
    modalOpen = m;
    (focusEl || m.querySelector('button, input, [tabindex="0"]')).focus();
  }
  function closeModal(m, instant) {
    if (!m || m.classList.contains('hidden')) return;
    if (instant) m.dataset.instant = '';
    m.classList.add('hidden');
    BACKDROP.forEach(s => { $(s).inert = false; });
    modalOpen = null;
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }

  // 전체 공식 모음
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
          simBox.tabIndex = 0;
          simBox.setAttribute('role', 'button');
          simBox.setAttribute('aria-label', s.title + ' 열기');
          simBox.dataset.search = [s.title, s.sub, cat].concat((s.formulas || []).map(f => f.name + ' ' + f.tpl)).join(' ').toLowerCase();
          simBox.appendChild(el('div', 'fx-sim-head',
            '<b>' + s.title + '</b><span class="fx-sub">' + s.sub + '</span><span class="fx-jump" aria-hidden="true">열기 →</span>'));
          (s.formulas || []).forEach(f => {
            const fRow = el('div', 'fx-formula');
            fRow.appendChild(el('div', 'fx-fname', f.name));
            fRow.appendChild(el('div', 'fx-fbody', renderFormulaWithVars(f.tpl, s.vars || {}, false)));
            simBox.appendChild(fRow);
          });
          const open = () => { closeModal($('#formulaModal')); switchToSim(s.id, true); };
          simBox.onclick = open;
          simBox.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
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
      if (!empty) { empty = el('div', 'fx-empty', '검색 결과가 없습니다.'); empty.setAttribute('role', 'status'); wrap.appendChild(empty); }
    } else if (empty) {
      empty.remove();
    }
  }

  function openFormulaModal() {
    buildFormulaIndex();
    $('#formulaSearch').value = '';
    filterFormulas('');
    openModal($('#formulaModal'), $('#formulaSearch'));
  }

  // 분야 선택
  function buildGroupMenu() {
    const box = $('#groupList');
    box.innerHTML = '';
    GROUPS.forEach(g => {
      const n = PS.sims.filter(s => g.modes.indexOf(s.mode || 'basic') >= 0).length;
      const subs = g.modes.map(m => TRACK_LABEL[m] || m).join(' · ');
      const card = el('button', 'group-card', '');
      card.type = 'button';
      card.dataset.group = g.id;
      card.innerHTML = '<div class="gc-top"><b>' + g.label + '</b><span class="gc-n">' + n + '종</span></div>' +
        '<div class="gc-sub">' + subs + '</div>';
      card.onclick = () => {
        closeModal($('#groupModal'));
        if (group !== g.id) setMode(lastModeOf[g.id] || g.modes[0]);
      };
      box.appendChild(card);
    });
  }
  function openGroupModal() {
    buildGroupMenu(); syncTabs();
    openModal($('#groupModal'), $('#groupList .group-card.on'));
  }

  $('#btnFormulaIndex').onclick = openFormulaModal;
  $('#btnCloseFormulas').onclick = () => closeModal($('#formulaModal'));
  $('#formulaModal').onclick = e => { if (e.target.id === 'formulaModal') closeModal($('#formulaModal')); };
  $('#formulaSearch').oninput = e => filterFormulas(e.target.value);
  $('#btnGroupMenu').onclick = openGroupModal;
  $('#btnCloseGroups').onclick = () => closeModal($('#groupModal'));
  $('#groupModal').onclick = e => { if (e.target.id === 'groupModal') closeModal($('#groupModal')); };

  /* ── 8. 그리기 + 메인 루프 (고정 시간 간격 적분) ── */
  let clockText = '';
  let drawError = null;
  function draw() {
    if (!sim || !st || W < 2 || H < 2) return;   // 레이아웃 전(0×0)에는 그리지 않는다
    D.bg(ctx, W, H);
    tctx.clearRect(0, 0, W, H);
    ctx.__text = tctx;
    ctx.__labels = W < 600 ? [] : null;   // 폰처럼 좁은 무대에서만 라벨 충돌 회피 (core.js avoidLabels)
    // 시뮬레이션 하나의 예외가 앱 전체 루프를 멈추지 않게 한다 (같은 오류는 한 번만 알린다)
    try { sim.draw(ctx, st, P, { w: W, h: H, hl: hl, playing: playing }); drawError = null; }
    catch (e) { if (drawError !== e.message) { drawError = e.message; console.error(sim.id + ' draw:', e); } }
    updateReadouts();
    updateChallenges();
    graphCanvases.forEach(g => PS.drawGraph(g.ctx, g.w, g.h, g.def, hist, hl));
    const t = st.t.toFixed(2);
    if (t !== clockText) { $('#clock').textContent = t; clockText = t; }
  }

  let last = 0, acc = 0, sampleAcc = 0;
  const DT = 1 / 480;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!sim || !st) return;
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
      // 남은 시간은 짧은 스텝 하나로 마저 진행한다. 이게 없으면 144 Hz 에서는 프레임마다 3스텝·4스텝이
      // 번갈아 돌아 화면 위 진행이 ±20 % 출렁인다(165 Hz 는 31 %). 이제 시뮬레이션 시간 = 실제 시간.
      // 모든 시뮬레이션의 step 은 dt 비례이거나 st.t 로 직접 계산한다 (발생·타이머도 rate·dt 누적).
      if (acc > 1e-7 && !st.done) {
        sim.step(st, P, acc);
        st.t += acc;
        sampleAcc += acc;
        acc = 0;
      }
      if (st.done) { playing = false; syncPlay(); }
    }
    draw();
    glowFrame(real);
  }

  /* ── 9. 키보드 · 컨트롤 바 ─────────────────────── */
  $('#btnPlay').onclick = () => {
    if (!sim || !st) return;
    if (st.done) { reset(); playing = true; }
    else playing = !playing;
    syncPlay();
  };
  $('#btnReset').onclick = () => { if (!sim) return; reset(); playing = true; syncPlay(); };
  function setSpeed(v) {
    speed = v;
    $('#speed').value = v;
    $('#speedVal').textContent = v.toFixed(1) + '×';
    $('#speed').setAttribute('aria-valuetext', v.toFixed(1) + '배');
  }
  $('#speed').setAttribute('aria-label', '재생 속도');
  $('#speed').oninput = e => { setSpeed(parseFloat(e.target.value)); store.set('speed', speed); };

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalOpen) { closeModal(modalOpen, true); return; }
    if (modalOpen || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t.closest && t.closest('input, textarea, select, [contenteditable]')) return;
    // 탭으로 옮겨 온 버튼(:focus-visible)에서는 Space 가 그 버튼을 눌러야 한다.
    // 마우스로 누른 뒤 포커스만 남은 버튼에서는 Space 가 재생/일시정지다.
    const keyboardFocused = t.closest && t.closest('button, [role="button"]') && t.matches(':focus-visible');
    if (e.code === 'Space' && !keyboardFocused) { e.preventDefault(); $('#btnPlay').click(); }
    if ((e.key === 'r' || e.key === 'R') && !e.repeat) $('#btnReset').click();
  });

  document.querySelectorAll('.mode').forEach(b => {
    b.type = 'button';
    b.onclick = () => { if (mode !== b.dataset.mode) setMode(b.dataset.mode); };
  });

  /* ── 시작 ── */
  setSpeed(Math.min(2, Math.max(.1, +store.get('speed', 1) || 1)));
  markEmptyModes();
  const startId = idFromHash() || (PS.byId[store.get('last', '')] ? store.get('last', '') : PS.sims[0].id);
  requestAnimationFrame(frame);   // 루프를 먼저 — 첫 시뮬레이션을 여는 중 문제가 생겨도 앱은 살아 있다
  switchToSim(startId, false);
})();
