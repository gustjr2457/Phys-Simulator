/* [천문학·별의 일생] H-R도 — 질량 하나가 별의 운명을 전부 정한다
   L ∝ M^3.5 (질량-광도 관계),  수명 ∝ M ⁄ L = M^−2.5
   별이 태어날 때 정해지는 것은 사실상 질량 하나뿐이다. 그런데 그 하나로
   밝기도, 색도, 수명도, 최후가 백색왜성인지 중성자별인지 블랙홀인지까지 전부
   결정된다. 무거운 별은 연료가 훨씬 많은데도 너무 헤프게 써서 훨씬 빨리 죽는다.
   헤르츠스프룽과 러셀이 1910년대에 그린 이 그림 한 장이 항성진화론의 출발점이다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { M: '#fbbf24', L: '#a78bfa', T: '#fb7185', R: '#5eead4', age: '#93a2c4' };
  const TSUN = 5772, LIFE = 22;        // 화면에서 별의 일생 전체에 쓰는 시간(초)

  const msL = M => Math.pow(M, 3.5);                       // 주계열 광도 [L☉]
  const msR = M => Math.pow(M, M >= 1 ? .8 : .9);          // 주계열 반지름 [R☉]
  const msT = M => TSUN * Math.pow(msL(M) / (msR(M) * msR(M)), .25);
  const msLife = M => 10 / Math.pow(M, 2.5);               // 주계열 수명 [Gyr]
  const totLife = M => msLife(M) / .8;                     // 표시하는 전체 수명

  const FATE = M => M < .5 ? 0 : (M < 8 ? 1 : (M < 25 ? 2 : 3));
  const FATE_NAME = ['아직 아무도 끝을 못 봤다 (우주 나이보다 수명이 길다)',
                     '행성상성운 → 백색왜성', '초신성 → 중성자별', '초신성 → 블랙홀'];
  const PHASE = ['원시별', '주계열성', '적색거성', '최후'];

  // 진화 단계별 광도·온도·반지름 (교육용 단순 모형)
  function stateOf(M, f) {                  // f: 0~1, 일생에서의 위치
    const L0 = msL(M), T0 = msT(M), R0 = msR(M);
    if (f < .02) {                          // 원시별: 수축하며 밝아진다
      const u = f / .02;
      return { L: L0 * (3 - 2 * u), T: T0 * (.55 + .45 * u), ph: 0 };
    }
    if (f < .80) {                          // 주계열: 아주 천천히 밝아진다
      const u = (f - .02) / .78;
      return { L: L0 * (1 + .5 * u), T: T0 * (1 - .02 * u), ph: 1 };
    }
    if (f < .94) {                          // 적색거성: 부풀고 식는다
      const u = (f - .80) / .14;
      const lg = Math.log10(L0 * 1.5) + 3.1 * u;
      const tt = Math.log10(T0) + (Math.log10(3300) - Math.log10(T0)) * Math.pow(u, .55);
      return { L: Math.pow(10, lg), T: Math.pow(10, tt), ph: 2 };
    }
    const u = clamp((f - .94) / .06, 0, 1); // 최후
    const fate = FATE(M);
    const endL = [L0 * 1.5, .001, 1e-5, 1e-9][fate];
    const endT = [T0, 25000, 6e5, 1e3][fate];
    const lg = Math.log10(Math.pow(10, Math.log10(L0 * 1.5) + 3.1)) * (1 - u) + Math.log10(endL) * u;
    const tt = Math.log10(3300) * (1 - u) + Math.log10(endT) * u;
    return { L: Math.pow(10, lg), T: Math.pow(10, tt), ph: 3 };
  }
  const radOf = s => Math.sqrt(s.L) * Math.pow(TSUN / s.T, 2);   // R/R☉ = √L · (T☉/T)²

  function bbRGB(T) {
    const t = clamp(T, 1000, 40000) / 100;
    let r, g, b;
    if (t <= 66) { r = 255; g = 99.47 * Math.log(t) - 161.12; b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04; }
    else { r = 329.7 * Math.pow(t - 60, -.133); g = 288.12 * Math.pow(t - 60, -.0755); b = 255; }
    return 'rgb(' + (clamp(r, 0, 255) | 0) + ',' + (clamp(g, 0, 255) | 0) + ',' + (clamp(b, 0, 255) | 0) + ')';
  }

  PS.register({
    id: 'as-hr', mode: 'astro', category: '별의 일생',
    title: 'H-R도와 별의 일생',
    sub: 'L ∝ M^3.5,  수명 ∝ M^−2.5',
    tagline: '별이 태어날 때 정해지는 건 사실상 질량 하나뿐입니다. 그 하나가 밝기·색·수명은 물론 최후가 백색왜성인지 블랙홀인지까지 전부 결정합니다.',

    params: [
      { key: 'M', symbol: 'M', label: '별의 질량', unit: 'M☉', min: .1, max: 50, step: .1, value: 1, color: C.M, dec: 1, reset: true,
        where: '태양 질량을 1로 둔 <b>별의 질량</b>입니다. 이 시뮬레이션에서 바꿀 수 있는 유일한 값이자, 별에 관한 거의 모든 것을 혼자 결정하는 값입니다.' }
    ],
    vars: {
      L: { symbol: 'L', label: '광도', unit: 'L☉', color: C.L,
        where: 'H-R도의 <b>세로축</b>입니다. 질량의 3.5제곱에 비례해, 질량 2배면 밝기는 11배가 됩니다.' },
      T: { symbol: 'T', label: '표면 온도', unit: 'K', color: C.T,
        where: 'H-R도의 <b>가로축</b>(오른쪽이 차가운 쪽 — 역사적 관습입니다)입니다. 별의 색이 곧 이 값입니다.' },
      R: { symbol: 'R', label: '반지름', unit: 'R☉', color: C.R,
        where: '왼쪽에 그려진 <b>별의 크기</b>입니다. 적색거성이 되면 수백 배로 부풀어 오릅니다.' },
      age: { symbol: 't', label: '나이', unit: '억 년', color: C.age,
        where: '별이 태어난 뒤 흐른 <b>시간</b>입니다. 아래 일생 막대의 현재 위치입니다.' }
    },
    formulas: [
      { name: '질량-광도 관계 (주계열)', tpl: '{L} ≈ {M}^3.5' },
      { name: '주계열 수명', tpl: 't ≈ 100억 년 × {M} ⁄ {L} = {M}^(−2.5)' },
      { name: '광도·온도·반지름의 관계', tpl: '{L} = 4π{R}²σ{T}⁴' }
    ],

    init(p) { return { f: 0, track: [], done: false }; },
    step(st, p, dt) {
      st.f = Math.min(1, st.t / LIFE);
      const s = stateOf(p.M, st.f);
      const last = st.track[st.track.length - 1];
      if (!last || Math.abs(Math.log10(s.L) - last[1]) > .012 || Math.abs(Math.log10(s.T) - last[0]) > .004)
        st.track.push([Math.log10(s.T), Math.log10(s.L)]);
      if (st.f >= 1) st.done = true;
    },

    graphs: [{
      title: '광도와 반지름 – 나이 (마지막에 폭발적으로 부푼다)', xKey: 'age', xUnit: '억 년', xMin: 0, y0: 0,
      series: [
        { key: 'lgL', label: 'log L (L☉)', color: C.L },
        { key: 'lgR', label: 'log R (R☉)', color: C.R }
      ]
    }],
    sample(st, p) {
      const s = stateOf(p.M, st.f);
      return { age: st.f * totLife(p.M) * 10, lgL: Math.log10(Math.max(s.L, 1e-9)), lgR: Math.log10(Math.max(radOf(s), 1e-9)) };
    },

    readouts(st, p) {
      const s = stateOf(p.M, st.f), R = radOf(s);
      const tot = totLife(p.M) * 10, age = st.f * tot;        // 억 년
      return [
        { label: '현재 단계', value: PHASE[s.ph], wide: true, color: ['#93a2c4', '#34d399', '#fb7185', '#a78bfa'][s.ph] },
        { label: '광도 L', value: s.L, unit: 'L☉', color: C.L, dec: s.L > 100 ? 0 : (s.L > 1 ? 2 : 5) },
        { label: '표면 온도 T', value: s.T, unit: 'K', color: C.T, dec: 0 },
        { label: '반지름 R', value: R, unit: 'R☉', color: C.R, dec: R > 10 ? 0 : 3 },
        { label: '주계열 수명', value: msLife(p.M) * 10, unit: '억 년', color: '#fbbf24', dec: msLife(p.M) * 10 > 100 ? 0 : 2 },
        { label: '태양 수명의 몇 배', wide: true, color: '#fbbf24',
          value: msLife(p.M) >= 10 ? fmt(msLife(p.M) / 10, 1) + ' 배 김' : '1/' + fmt(10 / msLife(p.M), 0) + ' 배 (훨씬 짧음)' },
        { label: '현재 나이', value: age, unit: '억 년', color: C.age, dec: age > 100 ? 0 : 2 },
        { label: '남은 시간', value: Math.max(0, tot - age), unit: '억 년', dec: tot - age > 100 ? 0 : 2, color: C.age },
        { label: '이 별의 최후', value: FATE_NAME[FATE(p.M)], wide: true,
          color: ['#93a2c4', '#e8eefc', '#60a5fa', '#a78bfa'][FATE(p.M)] },
        { label: '우주 나이(138억 년) 안에 죽는가', wide: true,
          color: totLife(p.M) * 10 <= 138 ? '#fb7185' : '#34d399',
          value: totLife(p.M) * 10 <= 138 ? '죽는다 — 이미 죽은 같은 별이 우주에 많다' : '아직 아니다 — 1세대 별도 아직 주계열에 있다' }
      ];
    },

    notes: [
      '<b>무거운 별은 연료가 많은데도 빨리 죽습니다.</b> 연료는 M에 비례해 늘지만 소비 속도(L)는 M^3.5로 늘어나기 때문입니다 — 수명 ∝ M/L = M^−2.5. 질량 10배면 수명은 1/316입니다.',
      '그래서 <b>O형·B형 별은 수백만 년밖에 못 삽니다.</b> 밤하늘에 보이는 밝고 푸른 별들은 전부 "방금 태어난" 별이고, 그 별이 보인다는 것은 근처에서 지금도 별이 만들어지고 있다는 뜻입니다.',
      '반대로 <b>적색왜성(M < 0.5)은 수천억 년을 삽니다.</b> 우주가 138억 살밖에 안 됐으니, 태어난 적색왜성은 <b>단 하나도 죽은 적이 없습니다</b>. 우주에서 가장 흔한 별이기도 합니다.',
      '태양은 약 50억 년 뒤 적색거성이 되어 <b>지금의 100배 이상으로 부풉니다</b> — 수성과 금성은 삼켜지고 지구도 위태롭습니다. 그 뒤 바깥을 날려 보내고 지구만 한 백색왜성만 남깁니다.',
      'H-R도의 <b>주계열 띠</b>는 "별의 종류"가 아니라 "별이 일생의 90%를 보내는 자리"입니다. 별이 그 띠 위에 있는 이유는 중심에서 수소를 태우는 동안 광도와 온도가 거의 변하지 않기 때문입니다.',
      '질량 8 M☉가 백색왜성과 중성자별을 가르는 경계입니다. 이 경계는 백색왜성이 버틸 수 있는 한계 질량(<b>찬드라세카르 한계 1.4 M☉</b>)에서 나옵니다 — 전자가 더 이상 버티지 못하면 별은 중성자별로 무너집니다.'
    ],
    presets: [
      { name: '태양 (1 M☉)', set: { M: 1 } },
      { name: '적색왜성 프록시마 (0.12 M☉)', set: { M: .1 } },
      { name: '시리우스 A (2 M☉)', set: { M: 2 } },
      { name: '초신성이 되는 별 (15 M☉)', set: { M: 15 } },
      { name: '블랙홀이 되는 별 (40 M☉)', set: { M: 40 } }
    ],
    challenges: [
      {
        id: 'sunlike', title: '태양을 끝까지 지켜보기',
        desc: '질량 1 M☉인 별을 백색왜성이 될 때까지 재생해 보세요. 적색거성 단계에서 반지름이 얼마나 커지는지 확인하세요.',
        hint: '기본값 그대로 두고 재생하면 됩니다. 22초면 100억 년이 지나갑니다.',
        check: ({ P, st }) => P.M >= .9 && P.M <= 1.1 && st.f >= .99
      },
      {
        id: 'short', title: '1억 년도 못 사는 별',
        desc: '주계열 수명이 1억 년 미만인 별을 만들어 보세요 — 인류의 역사보다도 우주적으로는 찰나입니다.',
        hint: '수명 = 100억 년 × M^−2.5 이므로 M이 약 6.3을 넘으면 됩니다.',
        check: ({ P }) => msLife(P.M) * 10 < 1
      },
      {
        id: 'bh', title: '블랙홀을 남기는 별',
        desc: '최후에 블랙홀이 되는 별을 만들어, 초신성 폭발까지 지켜보세요.',
        hint: '질량 25 M☉ 이상이면 중성자별로도 버티지 못하고 블랙홀이 됩니다.',
        check: ({ P, st }) => P.M >= 25 && st.f >= .97
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const s = stateOf(p.M, st.f), R = radOf(s), col = bbRGB(s.T);

      /* ── 별 ── */
      const sx = 78, sy = h * .27;
      const rad = clamp(10 + Math.log10(Math.max(R, 1e-5)) * 13 + 24, 3, 50);
      ctx.save();
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad * 2.4);
      g.addColorStop(0, col); g.addColorStop(.4, col.replace('rgb', 'rgba').replace(')', ',.45)'));
      g.addColorStop(1, col.replace('rgb', 'rgba').replace(')', ',0)'));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, rad * 2.4, 0, 7); ctx.fill();
      if (hl === 'R' || hl === 'T') { ctx.shadowColor = col; ctx.shadowBlur = 24; }
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sx, sy, rad, 0, 7); ctx.fill();
      ctx.restore();
      // 초신성 섬광
      if (s.ph === 3 && FATE(p.M) >= 2 && st.f < .985) {
        const u = clamp((st.f - .94) / .04, 0, 1);
        ctx.save(); ctx.globalAlpha = (1 - u) * .8;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(sx, sy, rad + u * 90, 0, 7); ctx.stroke();
        ctx.restore();
        D.text(ctx, '초신성!', sx, sy - rad - 30, { size: 13, color: '#fff', align: 'center', bold: true });
      }
      D.text(ctx, PHASE[s.ph], sx, sy + rad + 22,
        { size: 12, color: ['#93a2c4', '#34d399', '#fb7185', '#a78bfa'][s.ph], align: 'center', bold: true });
      D.text(ctx, 'R = ' + (R > 10 ? fmt(R, 0) : R.toExponential(1)) + ' R☉', sx, sy + rad + 38,
        { size: 10, color: hl === 'R' ? '#fff' : C.R, align: 'center' });

      /* ── H-R 도 ── */
      const gx = 174, gy = 48;
      const gw = Math.max(200, w - gx - 44), gh = Math.min(h * .56, 260);
      const TLO = Math.log10(2000), THI = Math.log10(60000);
      const LLO = -5, LHI = 6.5;
      const GX = T => gx + gw * (1 - (clamp(Math.log10(clamp(T, 2000, 60000)), TLO, THI) - TLO) / (THI - TLO));
      const GY = L => gy + gh * (1 - (clamp(Math.log10(clamp(L, 1e-5, 3e6)), LLO, LHI) - LLO) / (LHI - LLO));

      D.roundRect(ctx, gx, gy, gw, gh, 6); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
      // 배경 별들(실제 별 분포 느낌)
      ctx.save(); ctx.globalAlpha = .30;
      for (let i = 0; i < 220; i++) {
        const mm = Math.pow(10, -1 + 1.9 * Math.pow(i / 220, 2.4));
        const jitter = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1;
        const j2 = (Math.sin(i * 78.233) * 43758.5453 % 1 + 1) % 1;
        const LL = msL(mm) * (.7 + .6 * jitter), TT = msT(mm) * (.93 + .14 * j2);
        D.dot(ctx, GX(TT), GY(LL), 1.4, bbRGB(TT), false);
      }
      // 거성 가지 · 백색왜성 무리
      for (let i = 0; i < 40; i++) {
        const j = (Math.sin(i * 33.77) * 43758.5453 % 1 + 1) % 1;
        D.dot(ctx, GX(3400 + j * 1600), GY(Math.pow(10, 1.6 + j * 1.9)), 1.5, bbRGB(3400 + j * 1600), false);
        D.dot(ctx, GX(9000 + j * 20000), GY(Math.pow(10, -3.2 + j * 1.1)), 1.3, '#cfe0ff', false);
      }
      ctx.restore();
      D.text(ctx, '주계열', GX(9000), GY(msL(2.2)) - 8, { size: 9.5, color: 'rgba(52,211,153,.8)', align: 'center' });
      D.text(ctx, '거성 가지', GX(4000), GY(300), { size: 9.5, color: 'rgba(251,113,133,.8)', align: 'center' });
      D.text(ctx, '백색왜성', GX(16000), GY(3e-3), { size: 9.5, color: 'rgba(207,224,255,.75)', align: 'center' });

      // 지나온 경로
      if (st.track.length > 1) {
        ctx.save(); ctx.strokeStyle = 'rgba(232,238,252,.55)'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
        ctx.beginPath();
        st.track.forEach((q, i) => { const X = GX(Math.pow(10, q[0])), Y = GY(Math.pow(10, q[1])); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
        ctx.stroke(); ctx.restore();
      }
      // 현재 위치
      ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 16;
      D.dot(ctx, GX(s.T), GY(s.L), 6, col, true); ctx.restore();

      // 축
      D.text(ctx, '← 뜨겁다', gx + 6, gy + gh + 16, { size: 9.5, color: '#61719a' });
      D.text(ctx, '차갑다 →', gx + gw - 4, gy + gh + 16, { size: 9.5, color: '#61719a', align: 'right' });
      D.text(ctx, '표면 온도 (로그)', gx + gw / 2, gy + gh + 16, { size: 9.5, color: '#61719a', align: 'center' });
      [[1e6, '10⁶'], [1e3, '10³'], [1, '1'], [1e-3, '10⁻³']].forEach(([v, lab]) => {
        D.text(ctx, lab, gx - 5, GY(v) + 3.5, { size: 9, color: '#4b5a80', align: 'right' });
        D.line(ctx, gx, GY(v), gx + gw, GY(v), { color: 'rgba(255,255,255,.045)' });
      });
      D.text(ctx, '광도 (L☉)', gx - 5, gy - 8, { size: 9.5, color: '#61719a', align: 'right' });
      D.text(ctx, 'H-R 도', gx + 6, gy - 8, { size: 11, color: '#61719a' });

      /* ── 일생 막대 ── */
      const bx = 44, by = h - 62, bw = Math.min(w - 88, 540);
      const tot = totLife(p.M) * 10;
      D.text(ctx, '일생 — 전체 ' + (tot > 100 ? fmt(tot, 0) : fmt(tot, 2)) + ' 억 년', bx, by - 26, { size: 10.5, color: '#61719a' });
      D.roundRect(ctx, bx, by, bw, 16, 5); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
      [[0, .02, '#93a2c4'], [.02, .80, '#34d399'], [.80, .94, '#fb7185'], [.94, 1, '#a78bfa']].forEach(([a, b, cc]) => {
        ctx.fillStyle = cc; ctx.globalAlpha = .45;
        ctx.fillRect(bx + bw * a, by, bw * (b - a), 16); ctx.globalAlpha = 1;
      });
      D.text(ctx, '주계열 (일생의 80%)', bx + bw * .41, by + 29, { size: 9.5, color: '#34d399', align: 'center' });
      D.text(ctx, '적색거성', bx + bw * .87, by + 29, { size: 9.5, color: '#fb7185', align: 'center' });
      ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
      D.line(ctx, bx + bw * st.f, by - 5, bx + bw * st.f, by + 21, { color: '#fff', width: 2.4 }); ctx.restore();
      D.text(ctx, fmt(st.f * tot, tot > 100 ? 0 : 2) + ' 억 년',
        clamp(bx + bw * st.f, bx + 30, bx + bw - 30), by - 9, { size: 10, color: '#e8eefc', align: 'center' });
      D.text(ctx, 'M = ' + fmt(p.M, 1) + ' M☉', Math.min(w - 44, bx + bw + 20), by + 12,
        { size: 12.5, color: hl === 'M' ? '#fff' : C.M, align: 'right', bold: true });
    }
  });
})();
