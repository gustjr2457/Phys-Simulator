/* 유명한 실험 · 우주의 구조를 밝히다 — 은하 회전 곡선과 암흑물질 (베라 루빈, 1970년대)
   보이는 별(질량)만으로 뉴턴 중력을 계산하면, 은하 중심에서 멀어질수록 별의 공전
   속도는 점점 느려져야 한다(케플러식 감소). 그런데 실제로 관측된 나선은하의 회전
   곡선은 먼 거리에서도 거의 줄어들지 않고 평평하다(flat rotation curve) — 이것이
   "보이지 않는 질량"(암흑물질)의 가장 강력한 증거 중 하나가 되었다.
   보이는 질량 분포: Hernquist(1990) 프로파일 M(r)=M_tot·r²/(r+a)² — 은하의 벌지+디스크를
   하나의 매끄러운 구형 분포로 단순화한, 천체물리학에서 실제로 쓰이는 표준 모델.
   암흑물질: 등온구(isothermal sphere) 헤일로 — M_dark(r) ∝ r가 되도록 만들면
   v_circ = √(GM_dark(r)/r)가 반지름과 무관한 상수가 되어, "평평한 회전 곡선"을
   정확히 만들어낸다(근사가 아니라 등온구 모델의 정확한 성질). */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { vis: '#60a5fa', total: '#f472b6', dark: '#93a2c4', obs: '#fbbf24' };
  const G_ASTRO = 4.30091e-6; // kpc·(km/s)²/M☉
  const RMAX = 26; // kpc, 그래프에 그릴 최대 반지름

  function vVis(r, p) {
    const Mtot = p.Mvis * 1e10;
    const M = Mtot * r * r / ((r + p.a) * (r + p.a));
    return Math.sqrt(G_ASTRO * M / Math.max(r, 1e-6));
  }
  function vTotal(r, p) {
    const vv = vVis(r, p);
    return Math.sqrt(vv * vv + p.vdark * p.vdark);
  }
  // 실제 관측에서 흔히 나타나는 "평평한 회전 곡선" 패턴을 흉내 낸 예시 점(특정 은하의 실측값이 아님)
  const OBS_POINTS = [2, 5, 8, 12, 16, 20, 24].map(r => ({ r, v: 205 * r / (r + 2.2) }));

  PS.register({
    id: 'exp-darkmatter', mode: 'exp', category: '우주의 구조를 밝히다',
    title: '은하 회전 곡선과 암흑물질 (베라 루빈, 1970년대)',
    sub: '보이는 질량만으로는 설명할 수 없는 속도',
    tagline: '노란 점들은 실제 은하 관측에서 흔히 나타나는 패턴(먼 거리에서도 평평한 회전 속도)을 흉내 낸 예시입니다. 파란 선(보이는 별만으로 예측한 속도)은 멀어질수록 뚝 떨어지지만, 노란 점은 그러지 않습니다 — "암흑물질이 만드는 속도(vdark)"를 올려서 분홍 선(실제 예측)을 노란 점에 맞춰 보세요.',

    params: [
      { key: 'Mvis', symbol: 'M_vis', label: '보이는 질량(별, 가스 전체)', unit: '×10¹⁰M☉', min: 0.5, max: 6, step: .1, value: 3, color: C.vis, dec: 1,
        where: '이 은하에서 <b>눈에 보이는(빛을 내는) 질량</b> 전체입니다.' },
      { key: 'a', symbol: 'a', label: '보이는 물질이 퍼진 정도(스케일 반지름)', unit: 'kpc', min: 1, max: 6, step: .5, value: 3, color: '#a78bfa',
        where: '별들이 은하 중심 주위에 <b>얼마나 넓게 퍼져 있는지</b>입니다. 클수록 질량이 더 넓은 영역에 흩어져 있습니다.' },
      { key: 'vdark', symbol: 'v_dark', label: '암흑물질이 만드는 회전 속도', unit: 'km/s', min: 0, max: 250, step: 5, value: 0, color: C.dark, dec: 0,
        where: '보이지 않는 질량(암흑물질 헤일로)이 혼자 만들어내는 회전 속도입니다. 이 헤일로 모델(등온구)의 특징은, 어느 반지름에서나 <b>이 값이 똑같다</b>는 것입니다 — 그래서 회전 곡선이 평평해집니다.' }
    ],
    vars: {
      vvis: { symbol: 'v_vis', label: '보이는 질량만으로 예측한 속도', unit: 'km/s', color: C.vis, where: '<b>파란 선</b>. 뉴턴 중력 + 보이는 질량만 썼을 때의 예측입니다.' },
      vtot: { symbol: 'v_total', label: '암흑물질을 포함한 예측 속도', unit: 'km/s', color: C.total, where: '<b>분홍 선</b>. 암흑물질 헤일로까지 더한 예측입니다.' }
    },
    formulas: [
      { name: '보이는 질량만으로 예측(케플러식 감소)', tpl: '{vvis}(r) = √(G · M_vis(r) ⁄ r)' },
      { name: '암흑물질(등온구)을 더하면(평평해짐)', tpl: '{vtot}(r) = √({vvis}² + {vdark}²)' }
    ],

    init(p) { return { t: 0 }; },
    step(st, p, dt) { st.t += dt; },

    readouts(st, p) {
      const r1 = 8, r2 = 20;
      return [
        { label: '8kpc에서 예측 속도(보이는 것만)', value: vVis(r1, p), unit: 'km/s', dec: 0, color: C.vis },
        { label: '8kpc에서 예측 속도(암흑물질 포함)', value: vTotal(r1, p), unit: 'km/s', dec: 0, color: C.total },
        { label: '20kpc에서 예측 속도(보이는 것만)', value: vVis(r2, p), unit: 'km/s', dec: 0, color: C.vis },
        { label: '20kpc에서 예측 속도(암흑물질 포함)', value: vTotal(r2, p), unit: 'km/s', dec: 0, color: C.total, wide: true }
      ];
    },

    notes: [
      '보이는 별(질량)만 가지고 뉴턴 중력을 계산하면, 은하 중심에서 멀어질수록 별의 공전 속도는 <b>케플러 법칙처럼 줄어들어야</b> 합니다 — 태양계에서 명왕성이 수성보다 훨씬 느리게 도는 것과 같은 이유입니다.',
      '그런데 베라 루빈과 켄트 포드가 1970년대에 실제로 안드로메다은하 등 여러 나선은하를 관측했을 때, 회전 속도는 먼 거리에서도 <b>거의 줄어들지 않고 평평했습니다</b>. 뉴턴 중력이 틀렸거나(가능성은 낮음), 보이지 않는 질량이 훨씬 많거나(암흑물질), 둘 중 하나가 필요했습니다.',
      '암흑물질 헤일로가 정확히 <b>등온구(isothermal sphere)</b> 형태라면(질량이 반지름에 비례해서 늘어남), 그 헤일로 혼자 만드는 회전 속도는 반지름과 무관하게 항상 똑같습니다 — 그래서 슬라이더 v_dark 하나만으로 "평평함"이 정확히 재현됩니다.',
      '지금까지 암흑물질을 이루는 입자가 정확히 무엇인지는 밝혀지지 않았습니다. 이 시뮬레이션은 "무엇인지"가 아니라, <b>왜 암흑물질이 있어야 한다고 생각하게 됐는지</b>(회전 곡선 관측)를 보여주는 것이 목적입니다.',
      '노란 점은 실제 특정 은하의 정밀한 관측값이 아니라, 여러 관측에서 공통적으로 나타나는 "평평한 곡선" 패턴을 흉내 낸 예시입니다.'
    ],
    presets: [
      { name: '암흑물질 없음(케플러식 감소만)', set: { Mvis: 3, a: 3, vdark: 0 } },
      { name: '적당한 암흑물질', set: { Mvis: 3, a: 3, vdark: 120 } },
      { name: '노란 점에 가깝게 맞춰보기', set: { Mvis: 3, a: 2.2, vdark: 195 } }
    ],

    challenges: [
      { id: 'ch-flatten', title: '회전 곡선을 평평하게',
        desc: '암흑물질이 만드는 속도(v_dark)를 180 km/s 이상으로 올려서, 먼 거리에서도 속도가 거의 줄지 않게 만들어보세요.',
        check: ctx => ctx.P.vdark >= 180,
        hint: 'v_dark 슬라이더를 오른쪽 끝 근처로 옮겨보세요.' },
      { id: 'ch-gap100', title: '두 예측의 차이 100 km/s 이상',
        desc: '20kpc 거리에서, 보이는 질량만의 예측과 암흑물질을 포함한 예측의 차이가 100 km/s 이상 나게 만들어보세요.',
        check: ctx => (vTotal(20, ctx.P) - vVis(20, ctx.P)) >= 100,
        hint: 'v_dark를 160 이상으로 올려보세요.' }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const L = 50, R = 20, T = 30, B = 40;
      const pw = w - L - R, ph = h - T - B;
      const VMAX = 320;
      const X = r => L + pw * (r / RMAX);
      const Y = v => T + ph - ph * (clamp(v, 0, VMAX) / VMAX);

      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 4; i++) { const y = T + ph * i / 4; ctx.moveTo(L, y); ctx.lineTo(L + pw, y); }
      ctx.stroke();
      ctx.restore();
      D.text(ctx, '회전 속도(km/s)', L, T - 12, { size: 11, color: '#93a2c4' });
      D.text(ctx, '은하 중심에서의 거리(kpc)', L + pw, h - 10, { size: 11, color: '#93a2c4', align: 'right' });
      for (let i = 0; i <= 4; i++) {
        D.text(ctx, fmt(VMAX * (4 - i) / 4, 0), L - 8, T + ph * i / 4 + 4, { size: 9.5, color: '#61719a', align: 'right' });
      }
      [0, 5, 10, 15, 20, 25].forEach(r => {
        D.text(ctx, r, X(r), h - B + 16, { size: 9.5, color: '#61719a', align: 'center' });
      });

      // 관측 예시 점
      OBS_POINTS.forEach(pt => D.dot(ctx, X(pt.r), Y(pt.v), 5, C.obs, false));
      D.text(ctx, '관측 패턴을 흉내 낸 예시 점', X(RMAX) - 4, Y(OBS_POINTS[OBS_POINTS.length - 1].v) - 14, { size: 10, color: C.obs, align: 'right' });

      // v_vis, v_total 곡선
      function curve(fn, color, hot) {
        ctx.save();
        ctx.strokeStyle = color; ctx.lineWidth = hot ? 3 : 2.2;
        if (hot) { ctx.shadowColor = color; ctx.shadowBlur = 10; }
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const r = RMAX * i / 100;
          const v = fn(Math.max(r, 0.05), p);
          const px = X(r), py = Y(v);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
      }
      curve(vVis, C.vis, hl === 'vvis' || hl === 'Mvis' || hl === 'a');
      curve(vTotal, C.total, hl === 'vtot' || hl === 'vdark');

      D.text(ctx, '보이는 질량만(케플러식 감소)', L + 8, T + 14, { size: 10.5, color: C.vis });
      D.text(ctx, '암흑물질 포함(평평해짐)', L + 8, T + 30, { size: 10.5, color: C.total });
    }
  });
})();
