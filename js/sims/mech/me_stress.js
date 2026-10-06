/* [기계공학·고체역학] 응력-변형 선도 — σ = Eε (훅의 법칙)과 그 한계
   시편을 일정한 속도로 당기면서 응력 σ와 변형률 ε을 기록한다. 탄성 구간에서는
   σ = Eε로 곧게 올라가고(당김을 풀면 완전히 돌아온다), 항복점을 넘으면 영구
   변형이 남으며, 최대하중(인장강도)을 지나면 한 곳이 가늘어지다가(네킹) 끊어진다.
   항공우주·선박·기계 모든 구조설계가 이 선도의 '어디까지 쓸 것인가'로 결정된다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { E: '#5eead4', sy: '#fbbf24', A: '#60a5fa', rate: '#93a2c4',
              sig: '#fb7185', eps: '#a78bfa', F: '#f472b6' };

  const EPS_U = .12;   // 인장강도(최대하중)에 도달하는 변형률
  const EPS_F = .20;   // 파단 변형률
  const UTS_K = 1.5;   // 인장강도 / 항복강도

  const epsY = p => p.sy / (p.E * 1000);          // σ[MPa] / E[GPa→MPa]
  const uts = p => p.sy * UTS_K;

  // 응력-변형 선도(공칭응력). 탄성 → 변형경화 → 네킹 → 파단
  function sigOf(p, e) {
    const ey = epsY(p);
    if (e <= 0) return 0;
    if (e < ey) return p.E * 1000 * e;                                    // 탄성: 훅의 법칙
    if (e < EPS_U) {                                                      // 소성: 변형경화
      const u = (e - ey) / (EPS_U - ey);
      return p.sy + (uts(p) - p.sy) * Math.sin(u * Math.PI / 2);
    }
    const u = clamp((e - EPS_U) / (EPS_F - EPS_U), 0, 1);                 // 네킹: 공칭응력 하강
    return uts(p) * (1 - .55 * u * u);
  }
  const stageOf = (p, e) =>
    e < epsY(p) ? 0 : (e < EPS_U ? 1 : (e < EPS_F ? 2 : 3));
  const STAGE = ['탄성 (돌아온다)', '항복 후 — 소성 (영구 변형)', '네킹 — 한 곳만 가늘어짐', '파단'];
  const SCOL = ['#60a5fa', '#fbbf24', '#fb923c', '#fb7185'];

  PS.register({
    id: 'me-stress', mode: 'mech', category: '고체역학',
    title: '응력-변형 선도',
    sub: 'σ = Eε, σ < σ_y',
    tagline: '시편을 일정한 속도로 당깁니다. 어디까지가 "돌아오는 변형"이고, 어디부터 영구 변형이 남는지 — 모든 구조설계가 이 선도 위에서 결정됩니다.',

    params: [
      { key: 'E', symbol: 'E', label: '탄성계수', unit: 'GPa', min: 50, max: 400, step: 10, value: 200, color: C.E, dec: 0, reset: true,
        where: '선도 <b>초반 직선의 기울기</b>입니다. 재료가 얼마나 "뻣뻣한가"로, 강철 200 · 알루미늄 70 · 티타늄 110 GPa입니다. 강도와는 다른 성질이라 E가 커도 더 센 재료는 아닙니다.' },
      { key: 'sy', symbol: 'σ_y', label: '항복강도', unit: 'MPa', min: 100, max: 900, step: 25, value: 350, color: C.sy, dec: 0, reset: true,
        where: '직선이 <b>꺾이는 높이(노란 선)</b>입니다. 이 응력을 넘는 순간부터 영구 변형이 남습니다. 구조설계는 이 선 아래에서만 이뤄집니다.' },
      { key: 'A', symbol: 'A', label: '단면적', unit: 'mm²', min: 20, max: 200, step: 5, value: 80, color: C.A, dec: 0, reset: true,
        where: '시편의 <b>굵기</b>입니다. 응력 σ = F/A이므로, 굵게 하면 같은 하중에서 응력이 낮아져 더 많이 버팁니다. 재료가 아니라 <b>형상</b>을 바꾸는 방법입니다.' },
      { key: 'rate', symbol: 'ε̇', label: '당기는 속도', unit: '%/s', min: .5, max: 6, step: .5, value: 2, color: C.rate,
        where: '인장시험기가 시편을 <b>늘리는 속도</b>입니다. 선도의 모양은 바꾸지 않고, 실험이 끝나는 시간만 바꿉니다(화면 속도 조절용).' }
    ],
    vars: {
      sig: { symbol: 'σ', label: '응력', unit: 'MPa', color: C.sig,
        where: '단위 면적이 받는 힘 σ = F/A입니다. 화면 오른쪽 <b>붉은 응력 막대</b>와 아래 선도의 y축입니다.' },
      eps: { symbol: 'ε', label: '변형률', unit: '', color: C.eps,
        where: '원래 길이에 대한 <b>늘어난 비율</b> ε = ΔL/L₀입니다. 시편이 길어지는 정도이자 선도의 x축입니다.' },
      F: { symbol: 'F', label: '하중', unit: 'kN', color: C.F,
        where: '시험기가 양쪽에서 <b>당기는 힘</b>(분홍 화살표)입니다. F = σA.' }
    },
    formulas: [
      { name: '훅의 법칙 (탄성 구간에서만)', tpl: '{sig} = {E} · {eps}' },
      { name: '응력의 정의', tpl: '{sig} = {F} ⁄ {A}' },
      { name: '안전 조건 (구조설계)', tpl: '{sig} < {sy}  →  돌아온다' },
      { name: '항복 변형률', tpl: '{eps}_y = {sy} ⁄ {E}' }
    ],

    init(p) { return { eps: 0, sig: 0, peak: 0, epsPeak: 0, done: false }; },
    step(st, p, dt) {
      if (st.eps >= EPS_F) { st.eps = EPS_F; st.done = true; return; }
      st.eps = Math.min(EPS_F, st.eps + p.rate / 100 * dt);
      st.sig = sigOf(p, st.eps);
      if (st.sig > st.peak) { st.peak = st.sig; st.epsPeak = st.eps; }
    },

    graphs: [{
      title: '응력 - 변형 선도 (σ – ε)', xKey: 'epsPct', xUnit: '%', xMin: 0, xMax: 20, y0: 0,
      series: [
        { key: 'sig', label: 'σ (MPa)', color: C.sig },
        { key: 'syl', label: 'σ_y', color: C.sy },
        { key: 'utsl', label: '인장강도', color: '#fb923c' }
      ]
    }],
    sample(st, p) { return { epsPct: st.eps * 100, sig: st.sig, syl: p.sy, utsl: uts(p) }; },

    readouts(st, p) {
      const stg = stageOf(p, st.eps);
      const plastic = Math.max(0, st.eps - epsY(p));
      return [
        { label: '변형률 ε', value: st.eps * 100, unit: '%', color: C.eps, dec: 2 },
        { label: '응력 σ', value: st.sig, unit: 'MPa', color: C.sig, dec: 0 },
        { label: '하중 F', value: st.sig * p.A / 1000, unit: 'kN', color: C.F, dec: 1 },
        { label: '항복 변형률 ε_y', value: epsY(p) * 100, unit: '%', color: C.sy, dec: 3 },
        { label: '항복 하중 (F = σ_y A)', value: p.sy * p.A / 1000, unit: 'kN', color: C.sy, dec: 1 },
        { label: '인장강도', value: uts(p), unit: 'MPa', color: '#fb923c', dec: 0 },
        { label: '현재 안전율 (σ_y/σ)', value: st.sig > 1 ? p.sy / st.sig : Infinity, dec: 2,
          color: st.sig < p.sy ? '#34d399' : '#fb7185' },
        { label: '지금 당김을 풀면', wide: true, color: SCOL[stg],
          value: stg === 0 ? '원래 길이로 완전히 복귀' :
                 (stg === 3 ? '이미 끊어졌다' : '영구 변형 ' + fmt(plastic * 100, 2) + '% 남음') },
        { label: '상태', value: STAGE[stg], wide: true, color: SCOL[stg] }
      ];
    },

    notes: [
      '<b>훅의 법칙 σ = Eε는 항복점까지만 참입니다.</b> 선도가 꺾인 뒤에는 공식이 더 이상 맞지 않고, 당김을 풀어도 길이가 돌아오지 않습니다.',
      '강철의 항복 변형률은 보통 <b>0.2% 정도</b>밖에 안 됩니다 — 눈에 보이게 휘었다면 이미 소성 구간입니다. 반면 끊어지기까지는 20%쯤 늘어나므로, 이 <b>긴 여유 구간이 연성(ductility)</b>이고 구조물이 갑자기 무너지지 않게 해 줍니다.',
      '<b>E와 강도는 다른 성질입니다.</b> E는 "얼마나 뻣뻣한가"(처짐을 결정), σ_y는 "얼마나 센가"(파손을 결정)입니다. 알루미늄은 강철보다 덜 뻣뻣하지만(E 1/3) 합금에 따라 항복강도는 비슷할 수 있습니다.',
      '단면적 A를 키우면 같은 하중에서 응력이 내려갑니다. <b>재료를 못 바꿀 때 엔지니어가 쓰는 유일한 수단</b>이지만, 무게가 함께 늘기 때문에 항공우주에서는 비강도(강도/밀도)를 봅니다.',
      '최대하중 지점을 지나면 한 곳만 급격히 가늘어지는 <b>네킹</b>이 생깁니다. 이때부터는 실제 응력(진응력)은 계속 오르는데, 줄어든 면적을 모르는 공칭응력 선도는 내려가는 것처럼 보입니다.'
    ],
    presets: [
      { name: '연강 (SS400)', set: { E: 200, sy: 250, A: 80 } },
      { name: '고장력강', set: { E: 200, sy: 700, A: 80 } },
      { name: '알루미늄 합금 7075', set: { E: 70, sy: 500, A: 80 } },
      { name: '티타늄 Ti-6Al-4V', set: { E: 110, sy: 880, A: 80 } },
      { name: '굵은 시편 (A 2배)', set: { A: 160 } }
    ],
    challenges: [
      {
        id: 'load20', title: '항복 하중 20 kN 버티기',
        desc: '영구 변형이 생기기 전까지 20 kN을 버티는 시편을 만들어 보세요.',
        hint: '항복 하중은 σ_y × A 입니다. 재료를 세게 하거나 굵게 하면 됩니다.',
        check: ({ P }) => P.sy * P.A / 1000 >= 20
      },
      {
        id: 'wide', title: '탄성 구간을 0.5%까지 넓히기',
        desc: '항복 변형률 ε_y를 0.5% 이상으로 만들어 보세요. "휘어도 돌아오는" 범위가 넓어집니다.',
        hint: 'ε_y = σ_y / E 입니다. 강도는 높고 뻣뻣함(E)은 낮은 재료 — 알루미늄·티타늄 합금이 그렇습니다.',
        check: ({ P }) => P.sy / (P.E * 1000) >= .005
      },
      {
        id: 'break', title: '끝까지 끊어 보기',
        desc: '시편이 파단될 때까지 시험을 끝내 보세요. 네킹이 생기고 공칭응력이 내려가는 구간을 관찰하세요.',
        hint: '그냥 재생해 두면 됩니다. 당기는 속도를 올리면 빨라집니다.',
        check: ({ st }) => st.eps >= EPS_F - 1e-6
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const stg = stageOf(p, st.eps);
      const ey = epsY(p);

      /* ── 시편 ── */
      const L0 = Math.min(300, w * .42);
      const cx = w * .40, cy = h * .34;
      const L = L0 * (1 + st.eps * 1.6);                   // 늘어남을 1.6배 과장해 보여 준다
      const w0 = 10 + p.A * .13;
      // 소성 구간에서는 부피가 보존되며 가늘어지고, 네킹 뒤에는 한 곳만 급격히 줄어든다
      const plastic = Math.max(0, st.eps - ey);
      const thin = 1 / Math.sqrt(1 + plastic * 1.6);
      const neckAmt = stg >= 2 ? clamp((st.eps - EPS_U) / (EPS_F - EPS_U), 0, 1) : 0;
      const broken = st.eps >= EPS_F - 1e-6;
      const gap = broken ? 26 : 0;

      const halfW = x => {                                  // x: −1 .. +1 (시편 중앙 기준)
        const n = Math.exp(-(x / .22) * (x / .22));
        return w0 * thin * (1 - .72 * neckAmt * n) / 2;
      };
      const col = SCOL[stg];
      const seg = 46;
      const topPts = [], botPts = [];
      for (let i = 0; i <= seg; i++) {
        const u = -1 + 2 * i / seg;
        const sx = cx + u * L / 2 + (u < 0 ? -gap / 2 : gap / 2);
        topPts.push([sx, cy - halfW(u)]);
        botPts.push([sx, cy + halfW(u)]);
      }
      ctx.save();
      if (hl === 'A' || hl === 'eps') { ctx.shadowColor = hl === 'A' ? C.A : C.eps; ctx.shadowBlur = 18; }
      D.poly(ctx, topPts.concat(botPts.slice().reverse()),
        { fill: 'rgba(' + (stg === 0 ? '96,165,250' : stg === 1 ? '251,191,36' : '251,113,133') + ',.26)', stroke: col, width: 2 });
      ctx.restore();

      // 그립(시험기 척)
      [-1, 1].forEach(s => {
        const gx = cx + s * (L / 2 + gap / 2);
        D.roundRect(ctx, gx + (s < 0 ? -34 : 0), cy - w0 * .85, 34, w0 * 1.7, 4);
        ctx.fillStyle = 'rgba(147,162,196,.5)'; ctx.fill();
      });

      // 하중 화살표
      const fkN = st.sig * p.A / 1000;
      const al = clamp(24 + fkN * .55, 24, 92);
      D.arrow(ctx, cx - L / 2 - gap / 2 - 38, cy, -al, 0, { color: C.F, width: 4, hot: hl === 'F' });
      D.arrow(ctx, cx + L / 2 + gap / 2 + 38, cy, al, 0, { color: C.F, width: 4, hot: hl === 'F' });
      D.tag(ctx, 'F = ' + fmt(fkN, 1) + ' kN', cx, cy - w0 * 1.1 - 20, C.F, hl === 'F');

      // 원래 길이 L₀ 기준선 + 늘어난 길이
      const oy = cy + w0 * .9 + 30;
      D.line(ctx, cx - L0 / 2, oy - 7, cx - L0 / 2, oy + 7, { color: 'rgba(147,162,196,.5)', width: 2 });
      D.line(ctx, cx + L0 / 2, oy - 7, cx + L0 / 2, oy + 7, { color: 'rgba(147,162,196,.5)', width: 2 });
      D.dim(ctx, cx - L0 / 2, oy, cx + L0 / 2, oy, 'L₀', '#61719a', false);
      D.dim(ctx, cx - L / 2 - gap / 2, oy + 30, cx + L / 2 + gap / 2, oy + 30,
        'ΔL/L₀ = ' + fmt(st.eps * 100, 2) + ' %', C.eps, hl === 'eps');

      if (broken) D.tag(ctx, '파단', cx, cy, '#fb7185', true);
      if (neckAmt > .05 && !broken) D.text(ctx, '네킹', cx, cy - halfW(0) - 10, { size: 11, color: '#fb923c', align: 'center', bold: true });

      /* ── 응력 막대 (오른쪽) ── */
      const bx = w - 76, bTop = 46, bBot = h - 56, bH = bBot - bTop, bW = 32;
      const smax = Math.max(uts(p) * 1.15, 100);
      D.roundRect(ctx, bx, bTop, bW, bH, 6); ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fill();
      const yOf = s => bBot - clamp(s / smax, 0, 1) * bH;
      ctx.save();
      if (hl === 'sig') { ctx.shadowColor = C.sig; ctx.shadowBlur = 16; }
      ctx.fillStyle = C.sig; ctx.globalAlpha = .9;
      ctx.fillRect(bx, yOf(st.sig), bW, bBot - yOf(st.sig));
      ctx.restore();
      // 항복 · 인장강도 기준선
      D.line(ctx, bx - 8, yOf(p.sy), bx + bW + 8, yOf(p.sy), { color: C.sy, width: 2, hot: hl === 'sy' });
      D.text(ctx, 'σ_y ' + fmt(p.sy, 0), bx - 12, yOf(p.sy) + 4,
        { size: 10.5, color: hl === 'sy' ? '#fff' : C.sy, align: 'right', bold: hl === 'sy' });
      D.line(ctx, bx - 5, yOf(uts(p)), bx + bW + 5, yOf(uts(p)), { color: '#fb923c', width: 1.5, dash: [4, 4] });
      D.text(ctx, '인장강도', bx - 12, yOf(uts(p)) + 4, { size: 10, color: '#fb923c', align: 'right' });
      D.text(ctx, 'σ = ' + fmt(st.sig, 0), bx + bW / 2, bTop - 12,
        { size: 11.5, color: hl === 'sig' ? '#fff' : C.sig, align: 'center', bold: true });
      D.text(ctx, 'MPa', bx + bW / 2, h - 38, { size: 10, color: '#61719a', align: 'center' });

      /* ── 선도(미니) — 탄성 직선과 현재 위치 ── */
      const gx = 36, gy = h - 128, gw = Math.min(300, w * .40), gh = 96;
      D.roundRect(ctx, gx, gy, gw, gh, 6); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
      const GX = e => gx + clamp(e / EPS_F, 0, 1) * gw;
      const GY = s => gy + gh - clamp(s / smax, 0, 1) * gh;
      // 전체 선도
      ctx.save();
      ctx.strokeStyle = 'rgba(251,113,133,.55)'; ctx.lineWidth = 1.8; ctx.beginPath();
      for (let i = 0; i <= 120; i++) { const e = EPS_F * i / 120; const X = GX(e), Y = GY(sigOf(p, e)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke();
      // 훅의 법칙 직선을 그대로 연장해 보여 준다 — 어디서부터 어긋나는지
      ctx.strokeStyle = 'rgba(94,234,212,.5)'; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(GX(0), GY(0));
      ctx.lineTo(GX(Math.min(EPS_F, smax / (p.E * 1000))), GY(Math.min(smax, p.E * 1000 * EPS_F)));
      ctx.stroke(); ctx.restore();
      D.line(ctx, GX(ey), gy, GX(ey), gy + gh, { color: C.sy, dash: [3, 4], hot: hl === 'sy' });
      D.dot(ctx, GX(st.eps), GY(st.sig), 4, col, true);
      D.text(ctx, 'σ – ε 선도', gx + 4, gy - 6, { size: 10.5, color: '#61719a' });
      D.text(ctx, 'σ = Eε (훅)', GX(0) + 6, GY(0) - 8, { size: 9.5, color: C.E });
      D.text(ctx, '항복', GX(ey) + 4, gy + 12, { size: 9.5, color: C.sy });

      /* ── 단계 표시 ── */
      D.tag(ctx, STAGE[stg], w * .40, 26, col, true);
    }
  });
})();
