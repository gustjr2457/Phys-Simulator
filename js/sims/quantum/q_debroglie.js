/* [양자역학] 드브로이 파장 — 왜 야구공은 양자처럼 안 보이나 */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { obj: '#f472b6', vexp: '#fbbf24', lam: '#5eead4', p: '#a78bfa', m: '#f472b6', v: '#fbbf24' };
  const H = 6.62607015e-34;

  // 비교 대상 — 질량(kg)과 "그 물체 세계의 크기"(m)
  const OBJ = [
    { name: '전자', m: 9.109e-31, size: 1e-10, sizeName: '원자 크기', icon: 'e' },
    { name: '중성자', m: 1.675e-27, size: 1e-10, sizeName: '원자 크기', icon: 'n' },
    { name: '탄소 원자', m: 1.994e-26, size: 1.5e-10, sizeName: '원자 지름', icon: 'C' },
    { name: '바이러스', m: 1e-20, size: 1e-7, sizeName: '바이러스 크기', icon: 'V' },
    { name: '먼지 알갱이', m: 1e-9, size: 1e-5, sizeName: '먼지 크기', icon: '·' },
    { name: '야구공', m: .145, size: .074, sizeName: '공 지름', icon: '⚾' }
  ];
  // 로그 자 위의 기준점들
  const MARKS = [
    { x: 1e-15, t: '양성자' }, { x: 1e-10, t: '원자' }, { x: 2e-9, t: 'DNA 폭' },
    { x: 1e-7, t: '바이러스' }, { x: 7e-5, t: '머리카락' }, { x: 7.4e-2, t: '야구공' }, { x: 1.7, t: '사람' }
  ];
  const LO = -36, HI = 1;                       // 자의 범위: 10^-36 m ~ 10^1 m
  const objOf = p => OBJ[clamp(Math.round(p.obj) - 1, 0, OBJ.length - 1)];
  const lamOf = p => H / (objOf(p).m * Math.pow(10, p.vexp));

  PS.register({
    id: 'q-debroglie', mode: 'quantum', category: '물질파',
    title: '드브로이 파장',
    sub: 'λ = h / mv',
    tagline: '전자만 파동인 게 아니라 야구공에도 파장이 있습니다. 다만 그 파장이 10⁻³⁴ m — 원자핵보다 10²⁰배나 작아서 절대 드러나지 않을 뿐입니다. 양자역학이 일상에서 안 보이는 이유가 바로 이것입니다.',

    params: [
      { key: 'obj', symbol: 'm', label: '대상 (전자 → 야구공)', unit: '', min: 1, max: 6, step: 1, value: 1, color: C.obj, dec: 0,
        where: '파장을 계산할 <b>물체</b>입니다. 질량이 분모에 있으므로, 무거울수록 파장이 짧아집니다. 전자(10⁻³⁰ kg)와 야구공(0.145 kg)은 질량이 <b>10²⁹배</b>나 차이 납니다.' },
      { key: 'vexp', symbol: 'v', label: '속도 (10의 지수)', unit: '→ m/s', min: -2, max: 7, step: .1, value: 6, color: C.vexp, dec: 1,
        where: '속도를 <b>10의 거듭제곱</b>으로 정합니다(−2면 0.01 m/s, 6이면 10⁶ m/s). 속도도 분모에 있어 빠를수록 파장이 짧아집니다. 아무리 느리게 해도 야구공의 파장은 원자 근처에도 못 갑니다.' }
    ],
    vars: {
      lam: { symbol: 'λ', label: '드브로이 파장', unit: 'm', color: C.lam,
        where: '아래 <b>로그 자 위의 청록색 눈금</b>입니다. 물체 크기(분홍 눈금)와 비교해서, 비슷하면 파동성이 드러나고 훨씬 작으면 숨습니다.' },
      p: { symbol: 'p', label: '운동량', unit: 'kg·m/s', color: C.p,
        where: '질량 × 속도입니다. 파장은 운동량에 <b>반비례</b>합니다 — 운동량이 크면 파장이 짧습니다.' },
      m: { symbol: 'm', label: '질량', unit: 'kg', color: C.m, where: '고른 물체의 질량입니다.' },
      v: { symbol: 'v', label: '속도', unit: 'm/s', color: C.v, where: '고른 속도입니다.' }
    },
    formulas: [
      { name: '드브로이 — 모든 물질은 파장을 가진다', tpl: '{lam} = h ⁄ {p}' },
      { name: '운동량', tpl: '{p} = {m}{v}' },
      { name: '운동 에너지로 쓰면', tpl: '{lam} = h ⁄ √( 2{m}E )' },
      { name: '파동성이 드러나는 조건', tpl: '{lam} ≳ 물체(또는 구멍)의 크기' }
    ],

    init() { return { ph: 0 }; },
    step(st, p, dt) { st.ph += dt * 2; },

    graphs: [{
      title: '속도 지수 – 파장 지수 (기울기 −1인 직선)', xKey: 'vexp', xUnit: '', xMin: -2, xMax: 7,
      series: [{ key: 'lexp', label: 'log₁₀ λ (m)', color: C.lam }]
    }],
    sample(st, p) { return { vexp: p.vexp, lexp: Math.log10(lamOf(p)) }; },

    readouts(st, p) {
      const o = objOf(p), v = Math.pow(10, p.vexp), lam = lamOf(p);
      const ratio = lam / o.size;
      return [
        { label: '대상', value: o.name, color: C.obj, wide: true },
        { label: '질량 m', value: o.m.toExponential(2).replace('e', ' ×10^'), unit: 'kg' },
        { label: '속도 v', value: v.toExponential(2).replace('e+', ' ×10^').replace('e-', ' ×10^-'), unit: 'm/s' },
        { label: '운동량 p = mv', value: (o.m * v).toExponential(2).replace('e', ' ×10^'), unit: '', color: C.p },
        { label: '드브로이 파장 λ', value: lam.toExponential(2).replace('e', ' ×10^'), unit: 'm', color: C.lam, wide: true },
        { label: 'λ (나노미터)', value: lam * 1e9 > 1e-4 ? fmt(lam * 1e9, 4) : lam * 1e9, unit: 'nm' },
        { label: '비교 — ' + o.sizeName, value: o.size.toExponential(1).replace('e', ' ×10^'), unit: 'm' },
        { label: 'λ ÷ 물체 크기', value: ratio > 1e-3 ? fmt(ratio, 3) : ratio.toExponential(1).replace('e', ' ×10^'), unit: '배' },
        {
          label: '판정', wide: true, color: ratio > .3 ? '#34d399' : (ratio > .01 ? '#fbbf24' : '#fb7185'),
          value: ratio > .3 ? '✔ 파동성이 뚜렷하게 드러납니다 (회절·간섭 관찰 가능)'
            : ratio > .01 ? '△ 파동성이 희미하게 남아 있습니다'
              : '✘ 파장이 너무 짧아 파동성이 완전히 숨습니다 — 고전적으로 행동'
        }
      ];
    },

    notes: [
      '드브로이의 주장은 "빛이 알갱이면, 알갱이도 파동일 것"이었습니다. 실제로 <b>전자를 결정에 쏘면 회절무늬</b>가 나옵니다(1927년 데이비슨–거머 실험).',
      '파장은 질량과 속도에 <b>반비례</b>합니다. 무겁거나 빠를수록 파장이 짧아져 파동성이 숨습니다.',
      '야구공의 파장은 약 <b>10⁻³⁴ m</b> — 원자핵(10⁻¹⁵ m)보다도 10¹⁹배 작습니다. 측정할 방법이 아예 없습니다.',
      '<b>전자현미경</b>이 광학현미경보다 훨씬 작은 것을 보는 이유: 전자의 파장이 가시광선(500 nm)보다 수만 배 짧기 때문입니다.',
      '다음 시뮬레이션(상자 속 전자)은 이 파장이 좁은 공간에 갇히면 무슨 일이 생기는지 보여줍니다.'
    ],
    presets: [
      { name: '전자 (보통 속도)', set: { obj: 1, vexp: 6 } },
      { name: '전자현미경의 전자', set: { obj: 1, vexp: 8 > 7 ? 7 : 7 } },
      { name: '아주 느린 전자', set: { obj: 1, vexp: 3 } },
      { name: '중성자 (원자로)', set: { obj: 2, vexp: 3.4 } },
      { name: '바이러스', set: { obj: 4, vexp: 2 } },
      { name: '야구공 (시속 150 km)', set: { obj: 6, vexp: 1.6 } }
    ],
    challenges: [
      {
        id: 'e-big', title: '전자의 파장을 원자보다 크게',
        desc: '전자를 고르고 속도를 낮춰서, 파장이 원자 크기(10⁻¹⁰ m)보다 커지게 만들어 보세요.',
        hint: '속도 지수를 낮출수록 파장이 길어집니다. 10⁶ m/s보다 훨씬 느리게 해보세요.',
        check: ({ P }) => Math.round(P.obj) === 1 && lamOf(P) > 1e-10
      },
      {
        id: 'microscope', title: '전자현미경의 비밀',
        desc: '전자의 파장을 0.01 nm(10⁻¹¹ m) 이하로 줄여 보세요. 광학현미경으로는 불가능한 해상도입니다.',
        hint: '반대로 속도를 아주 크게 올리면 됩니다.',
        check: ({ P }) => Math.round(P.obj) === 1 && lamOf(P) < 1e-11
      },
      {
        id: 'ball-fail', title: '야구공으로는 불가능하다',
        desc: '야구공을 고르고 속도를 가장 느리게(지수 −2) 해보세요. 그래도 파장이 원자 크기에 한참 못 미치는 것을 확인하면 성공입니다.',
        hint: '이건 실패하라고 만든 과제입니다. 야구공은 아무리 느려도 파동이 될 수 없습니다.',
        check: ({ P }) => Math.round(P.obj) === 6 && P.vexp <= -1.9
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const o = objOf(p), v = Math.pow(10, p.vexp), lam = lamOf(p);
      const ratio = lam / o.size;

      /* ── 위쪽: 물체와 그 물질파 ── */
      const cx = w * .30, cy = h * .26;
      const R = 22;
      // 물체
      ctx.save();
      if (hl === 'obj' || hl === 'm') { ctx.shadowColor = C.obj; ctx.shadowBlur = 20; }
      const g = ctx.createRadialGradient(cx - R * .3, cy - R * .3, 2, cx, cy, R);
      g.addColorStop(0, '#fde7f3'); g.addColorStop(1, C.obj);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      ctx.restore();
      D.text(ctx, o.icon, cx, cy + 6, { size: 17, color: '#3a0d22', align: 'center', bold: true });
      D.text(ctx, o.name, cx, cy + R + 18, { size: 12, color: C.obj, align: 'center', bold: hl === 'obj' });

      // 속도 화살표
      D.arrow(ctx, cx + R + 6, cy, 70, 0, {
        color: C.vexp, width: 3, hot: hl === 'vexp' || hl === 'v',
        label: v.toExponential(1).replace('e+', '×10^') + ' m/s', ly: -14
      });

      // 물질파 — 파장이 물체보다 길면 큰 파동, 짧으면 촘촘한 선
      const wx0 = cx - 150, wx1 = cx - R - 10;
      const visible = clamp(ratio, 0, 1);
      ctx.save();
      ctx.strokeStyle = C.lam; ctx.lineWidth = hl === 'lam' ? 3 : 2;
      ctx.globalAlpha = .35 + .65 * Math.min(1, ratio * 3);
      if (hl === 'lam') { ctx.shadowColor = C.lam; ctx.shadowBlur = 12; }
      ctx.beginPath();
      const pxPerWave = clamp(26 + visible * 70, 3, 110);
      for (let x = wx0; x <= wx1; x += 1.5) {
        const y = cy - Math.sin((x - wx0) / pxPerWave * Math.PI * 2 + st.ph) * (10 + visible * 14);
        x === wx0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.restore();
      D.text(ctx, ratio > .3 ? '파동성이 드러남' : (ratio > .01 ? '파동성이 희미함' : '파동성이 숨음 — 사실상 알갱이'),
        wx0, cy - 40, { size: 10.5, color: ratio > .3 ? '#34d399' : (ratio > .01 ? '#fbbf24' : '#fb7185') });

      /* ── 아래쪽: 로그 자 ── */
      const rx0 = 70, rx1 = w - 40, ry = h * .70;
      const X = m10 => rx0 + (m10 - LO) / (HI - LO) * (rx1 - rx0);
      D.line(ctx, rx0, ry, rx1, ry, { color: 'rgba(147,162,196,.5)', width: 2 });
      D.text(ctx, '길이 비교 — 한 칸마다 10배', rx0, ry - 56, { size: 11, color: '#93a2c4' });

      // 10의 거듭제곱 눈금
      for (let e = LO; e <= HI; e += 5) {
        const x = X(e);
        D.line(ctx, x, ry - 5, x, ry + 5, { color: 'rgba(147,162,196,.35)' });
        D.text(ctx, '10' + String(e).replace('-', '⁻'), x, ry + 19, { size: 9, color: '#4a5878', align: 'center' });
      }
      // 기준점
      MARKS.forEach((mk, i) => {
        const x = X(Math.log10(mk.x));
        D.line(ctx, x, ry, x, ry - 16 - (i % 2) * 13, { color: 'rgba(147,162,196,.3)', dash: [2, 3] });
        D.text(ctx, mk.t, x, ry - 20 - (i % 2) * 13, { size: 9, color: '#61719a', align: 'center' });
      });

      // 물체 크기 눈금
      const xs = X(Math.log10(o.size));
      D.line(ctx, xs, ry + 8, xs, ry + 40, { color: C.obj, width: 2 });
      D.tag(ctx, o.sizeName, xs, ry + 52, C.obj, hl === 'obj');

      // 파장 눈금
      const xl = X(clamp(Math.log10(lam), LO, HI));
      ctx.save();
      if (hl === 'lam') { ctx.shadowColor = C.lam; ctx.shadowBlur = 14; }
      D.line(ctx, xl, ry - 8, xl, ry + 40, { color: C.lam, width: 3 });
      ctx.restore();
      D.tag(ctx, 'λ = ' + lam.toExponential(1).replace('e', '×10^') + ' m', xl, ry + 74, C.lam, true);

      // 둘 사이의 간격 표시
      if (Math.abs(xl - xs) > 24) {
        const ym = ry + 40;
        D.dim(ctx, Math.min(xl, xs), ym, Math.max(xl, xs), ym,
          Math.abs(Math.log10(ratio)).toFixed(0) + '자릿수 차이', '#fbbf24', false);
      }

      if (Math.log10(lam) < LO)
        D.tag(ctx, '자 밖으로 벗어남 — 너무 짧아 표시할 수 없습니다', rx0 + 150, ry + 74, '#fb7185', true);
    }
  });
})();
