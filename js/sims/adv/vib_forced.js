/* [진동공학] 강제 진동과 공진 — 진폭 배율 M = 1/√((1−r²)² + (2ζr)²) */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { F0: '#34d399', f: '#f472b6', fn: '#fbbf24', z: '#fb7185', X: '#60a5fa', r: '#f472b6', M: '#60a5fa', ph: '#a78bfa' };
  const M_KG = 2;

  const kOf = p => M_KG * Math.pow(2 * Math.PI * p.fn, 2);
  const cOf = p => 2 * p.z * Math.sqrt(kOf(p) * M_KG);
  const ratio = p => p.f / p.fn;
  const mag = (r, z) => 1 / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * z * r, 2));
  const phase = (r, z) => Math.atan2(2 * z * r, 1 - r * r);

  PS.register({
    id: 'vib-forced', mode: 'adv', category: '진동공학',
    title: '강제 진동과 공진',
    sub: 'M = 1/√((1−r²)²+(2ζr)²)',
    tagline: '가진 진동수를 고유진동수에 맞추는 순간 진폭이 폭발합니다. 다리와 기계가 무너지는 이유입니다.',

    params: [
      { key: 'f', symbol: 'f', label: '가진 진동수', unit: 'Hz', min: .1, max: 6, step: .05, value: 1.2, color: C.f, dec: 2,
        where: '외부에서 흔드는 <b>빠르기</b>입니다. 오른쪽 주파수 응답 곡선 위의 <b>흰 점(작동점)</b>을 좌우로 움직입니다. fₙ에 가까워질수록 점이 봉우리로 올라갑니다.' },
      { key: 'fn', symbol: 'fₙ', label: '고유진동수', unit: 'Hz', min: .5, max: 4, step: .1, value: 2, color: C.fn, dec: 1,
        where: '기계가 <b>스스로 좋아하는 진동수</b>(√(k/m)/2π). 곡선의 <b>봉우리 위치(r = 1)</b>를 정합니다. 설계자는 이 값을 가진 진동수에서 멀리 떨어뜨립니다.' },
      { key: 'z', symbol: 'ζ', label: '감쇠비', unit: '', min: .02, max: 1, step: .01, value: .08, color: C.z, dec: 2,
        where: '곡선 <b>봉우리의 높이</b>를 결정합니다. ζ가 작을수록 공진에서 진폭이 하늘로 치솟습니다(ζ→0이면 무한대). 감쇠재를 넣는 이유입니다.' },
      { key: 'F0', symbol: 'F₀', label: '가진력 크기', unit: 'N', min: 5, max: 120, step: 5, value: 40, color: C.F0, dec: 0,
        where: '흔드는 <b>힘의 세기</b>(초록 화살표)입니다. 진폭에 비례할 뿐, 공진이 일어나는 <b>위치는 바꾸지 못합니다</b>.' }
    ],
    vars: {
      r: { symbol: 'r', label: '진동수비 f/fₙ', unit: '', color: C.r,
        where: '가진 진동수 ÷ 고유진동수. <b>r = 1이 공진점</b>입니다. 응답 곡선의 가로축입니다.' },
      M: { symbol: 'M', label: '진폭 배율', unit: '배', color: C.M,
        where: '정적 처짐(F₀/k) 대비 <b>실제 진폭이 몇 배인가</b>입니다. 곡선의 세로축이며, 공진에서 1/(2ζ)까지 커집니다.' },
      X: { symbol: 'X', label: '정상상태 진폭', unit: 'm', color: C.X,
        where: '블록이 실제로 흔들리는 <b>폭</b>입니다. 파란 점선 포락선으로 표시됩니다.' },
      ph: { symbol: 'φ', label: '위상차', unit: '°', color: C.ph,
        where: '힘과 변위가 <b>얼마나 어긋나 있는가</b>입니다. 공진점에서 정확히 90°, 아주 빠르게 흔들면 180°(힘과 반대로 움직임)가 됩니다.' }
    },
    formulas: [
      { name: '운동 방정식', tpl: 'mẍ + cẋ + kx = {F0} cos(2π{f}t)' },
      { name: '진동수비', tpl: '{r} = {f} ⁄ {fn}' },
      { name: '진폭 배율', tpl: '{M} = 1 ⁄ √( (1−{r}²)² + (2{z}{r})² )' },
      { name: '정상상태 진폭', tpl: '{X} = ({F0}⁄k) · {M}' },
      { name: '공진 최대 배율', tpl: '{M}max ≈ 1 ⁄ (2{z})' }
    ],

    init(p) { return { x: 0, v: 0 }; },
    step(st, p, dt) {
      const k = kOf(p), c = cOf(p);
      const F = p.F0 * Math.cos(2 * Math.PI * p.f * st.t);
      const a = (F - c * st.v - k * st.x) / M_KG;
      st.v += a * dt;
      st.x += st.v * dt;
    },

    graphs: [{
      title: '변위 – 시간', xmin: 4, window: 8,
      series: [
        { key: 'x', label: 'x (m)', color: C.X },
        { key: 'xp', label: '정상상태 진폭 ±X', color: 'rgba(96,165,250,.45)' },
        { key: 'xn', label: '', color: 'rgba(96,165,250,.45)' }
      ]
    }],
    sample(st, p) {
      const X = (p.F0 / kOf(p)) * mag(ratio(p), p.z);
      return { x: st.x, xp: X, xn: -X };
    },

    readouts(st, p) {
      const r = ratio(p), M = mag(r, p.z), k = kOf(p);
      const X = (p.F0 / k) * M;
      return [
        { label: '진동수비 r = f/fₙ', value: r, unit: '', color: C.r },
        { label: '진폭 배율 M', value: M, unit: '배', color: C.M },
        { label: '정상상태 진폭 X', value: X * 1000, unit: 'mm', color: C.X },
        { label: '정적 처짐 F₀/k', value: (p.F0 / k) * 1000, unit: 'mm' },
        { label: '위상차 φ', value: phase(r, p.z) * 180 / Math.PI, unit: '°', color: C.ph },
        { label: '공진 최대 배율 1/2ζ', value: 1 / (2 * p.z), unit: '배', color: C.z },
        { label: '상태', wide: true, color: Math.abs(r - 1) < .08 ? '#fb7185' : (r < 1 ? '#34d399' : '#60a5fa'),
          value: Math.abs(r - 1) < .08 ? '⚠ 공진 영역 — 진폭 급증' : (r < 1 ? '저진동수 영역 (힘과 같은 방향)' : '고진동수 영역 (진동 절연)') }
      ];
    },

    notes: [
      '<b>공진(r = 1)</b>에서 진폭은 1/(2ζ)배까지 커집니다. ζ = 0.02면 무려 25배입니다.',
      'r &gt; √2 영역에서는 배율이 1보다 작아집니다 — 이것이 <b>진동 절연</b>의 원리입니다. 방진 마운트는 일부러 고유진동수를 낮춥니다.',
      '가진력 F₀를 키워도 공진 <b>위치</b>는 그대로입니다. 위험한 것은 힘의 크기가 아니라 <b>진동수의 일치</b>입니다.',
      '실제 설계에서는 운전 진동수를 fₙ에서 최소 20~30% 떨어뜨리거나 감쇠를 키웁니다.'
    ],
    presets: [
      { name: '공진 직격 (r=1)', set: { f: 2, fn: 2, z: .05 } },
      { name: '감쇠를 키우면', set: { f: 2, fn: 2, z: .5 } },
      { name: '진동 절연 (r≫1)', set: { f: 5, fn: 1, z: .1 } },
      { name: '아주 천천히 (r≪1)', set: { f: .3, fn: 2, z: .1 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const r = ratio(p), z = p.z, M = mag(r, z), k = kOf(p);
      const X = (p.F0 / k) * M;

      /* ── 왼쪽: 진동계 ───────────────────────── */
      const cx = w * .22, top = 50;
      const PPM = clamp(0.09 * (h - 180) / Math.max(0.02, Math.max(X * 1.6, .01)), 200, 4000);
      const eq = top + 150;
      const by = eq + clamp(st.x * PPM, -130, 130);

      D.line(ctx, cx - 90, top, cx + 70, top, { color: 'rgba(147,162,196,.5)', width: 3 });
      for (let i = 0; i < 8; i++) D.line(ctx, cx - 88 + i * 20, top, cx - 98 + i * 20, top - 10, { color: 'rgba(147,162,196,.25)' });
      D.spring(ctx, cx - 34, top, cx - 34, by - 20, { coils: 8, amp: 11, color: '#5eead4', hot: hl === 'fn' });
      D.dashpot(ctx, cx + 26, top, cx + 26, by - 20, { color: C.z, hot: hl === 'z' });

      D.line(ctx, cx - 100, eq, cx + 100, eq, { color: 'rgba(147,162,196,.3)', dash: [5, 5] });
      // 정상상태 진폭 포락선
      D.line(ctx, cx - 74, eq - X * PPM, cx + 74, eq - X * PPM, { color: C.X, dash: [3, 4], hot: hl === 'X' });
      D.line(ctx, cx - 74, eq + X * PPM, cx + 74, eq + X * PPM, { color: C.X, dash: [3, 4], hot: hl === 'X' });
      D.text(ctx, 'X = ' + fmt(X * 1000, 1) + ' mm', cx + 78, eq - X * PPM - 6, { size: 10.5, color: C.X, bold: hl === 'X' });

      ctx.save();
      D.roundRect(ctx, cx - 44, by - 20, 88, 40, 6);
      ctx.fillStyle = '#4a6ba8'; ctx.fill();
      ctx.restore();
      D.text(ctx, M_KG + ' kg', cx, by + 5, { size: 11, color: '#0a1120', align: 'center', bold: true });

      // 가진력 화살표
      const F = p.F0 * Math.cos(2 * Math.PI * p.f * st.t);
      D.arrow(ctx, cx, by + 22, 0, clamp(F * 1.1, -90, 90),
        { color: C.F0, width: 4, hot: hl === 'F0' || hl === 'f', label: 'F₀cos(2πft)', ly: 26 });

      /* ── 오른쪽: 주파수 응답 곡선 ───────────── */
      const px = w * .46, py = 44, pw = w - px - 40, ph = h - py - 66;
      const RMAX = 3, MMAX = Math.max(4, Math.min(1 / (2 * z) * 1.25, 14));
      const GX = rr => px + (rr / RMAX) * pw;
      const GY = mm => py + ph - clamp(mm / MMAX, 0, 1) * ph;

      D.roundRect(ctx, px, py, pw, ph, 8);
      ctx.fillStyle = 'rgba(255,255,255,.025)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1; ctx.stroke();
      D.text(ctx, '주파수 응답 곡선 (진폭 배율 M vs 진동수비 r)', px, py - 12, { size: 11.5, color: '#93a2c4' });

      // 격자
      for (let i = 0; i <= 3; i++) {
        D.line(ctx, GX(i), py, GX(i), py + ph, { color: 'rgba(255,255,255,.05)' });
        D.text(ctx, i + '', GX(i), py + ph + 14, { size: 9.5, color: '#61719a', align: 'center' });
      }
      D.text(ctx, 'r = f/fₙ', px + pw, py + ph + 14, { size: 10, color: '#61719a', align: 'right' });
      D.line(ctx, px, GY(1), px + pw, GY(1), { color: 'rgba(255,255,255,.18)', dash: [4, 4] });
      D.text(ctx, 'M = 1', px + 4, GY(1) - 5, { size: 9.5, color: '#61719a' });

      // 공진선 r = 1
      D.line(ctx, GX(1), py, GX(1), py + ph, { color: C.fn, dash: [5, 5], width: hl === 'fn' ? 2 : 1.2, hot: hl === 'fn' });
      D.text(ctx, '공진 r=1', GX(1) + 5, py + 13, { size: 10, color: C.fn, bold: hl === 'fn' });
      // 절연 영역 r > √2
      ctx.save();
      ctx.fillStyle = 'rgba(52,211,153,.06)';
      ctx.fillRect(GX(Math.SQRT2), py, px + pw - GX(Math.SQRT2), ph);
      ctx.restore();
      D.text(ctx, '진동 절연 영역 (r > √2)', px + pw - 6, py + ph - 8, { size: 9.5, color: '#34d399', align: 'right' });

      // 곡선(현재 ζ) + 비교용 곡선들
      [[.05, 'rgba(251,113,133,.25)'], [.2, 'rgba(251,113,133,.18)'], [.7, 'rgba(251,113,133,.12)']].forEach(([zz, col]) => {
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.beginPath();
        for (let i = 0; i <= 240; i++) { const rr = i / 240 * RMAX; const yy = GY(mag(rr, zz)); i ? ctx.lineTo(GX(rr), yy) : ctx.moveTo(GX(rr), yy); }
        ctx.stroke(); ctx.restore();
      });
      ctx.save();
      ctx.strokeStyle = C.M; ctx.lineWidth = hl === 'M' || hl === 'z' ? 3 : 2.2;
      if (hl === 'M' || hl === 'z') { ctx.shadowColor = C.M; ctx.shadowBlur = 12; }
      ctx.beginPath();
      for (let i = 0; i <= 300; i++) { const rr = i / 300 * RMAX; const yy = GY(mag(rr, z)); i ? ctx.lineTo(GX(rr), yy) : ctx.moveTo(GX(rr), yy); }
      ctx.stroke(); ctx.restore();

      // 작동점
      const opx = GX(Math.min(r, RMAX)), opy = GY(M);
      D.line(ctx, opx, py + ph, opx, opy, { color: C.r, dash: [3, 4], hot: hl === 'r' || hl === 'f' });
      D.dot(ctx, opx, opy, 6, '#fff', true);
      D.tag(ctx, 'r = ' + fmt(r, 2) + ' , M = ' + fmt(M, 2) + '배', opx, opy - 20, C.M, hl === 'M' || hl === 'r' || hl === 'f');

      if (Math.abs(r - 1) < .08) D.tag(ctx, '⚠ 공진! 진폭이 급격히 커집니다', px + pw / 2, py + ph + 34, '#fb7185', true);
      else D.text(ctx, '위상차 φ = ' + fmt(phase(r, z) * 180 / Math.PI, 0) + '°', px + pw / 2, py + ph + 38,
        { size: 11, color: hl === 'ph' ? '#fff' : C.ph, align: 'center', bold: hl === 'ph' });
    }
  });
})();
