/* [화학공학·반응공학] 반응기 비교 — CSTR vs PFR
   같은 부피, 같은 반응, 같은 유량인데 전환율이 다르다. 완전혼합반응기(CSTR)는
   들어온 원료가 즉시 낮은 농도로 희석되어 그 낮은 농도의 속도로만 반응하고,
   관형반응기(PFR)는 입구에서 출구까지 농도가 점점 떨어지며 "높은 농도 구간"을
   거치기 때문이다. 1차 반응에서는 PFR이 항상 유리하다 — 그래서 큰 공장은 관을 쓴다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { k: '#5eead4', V: '#fbbf24', Q: '#60a5fa',
              tau: '#a78bfa', Xp: '#34d399', Xc: '#fb7185' };

  const tauOf = p => p.V / p.Q;                              // 공간시간 (초)
  const Da = p => p.k * tauOf(p);                            // 담쾰러 수 kτ
  const Xpfr = p => 1 - Math.exp(-Da(p));                    // 관형: 정상상태 전환율
  const Xcstr = p => Da(p) / (1 + Da(p));                    // 완전혼합: 정상상태 전환율
  // PFR과 같은 전환율을 CSTR로 내려면 부피를 몇 배로 해야 하는가
  const volRatio = p => {
    const Xp = Xpfr(p);
    if (Xp >= .999999) return Infinity;
    const need = Xp / (1 - Xp);
    return Da(p) > 1e-9 ? need / Da(p) : 1;
  };

  PS.register({
    id: 'ch-reactor', mode: 'chem', category: '반응공학',
    title: '반응기 비교 — CSTR vs PFR',
    sub: 'τ = V/Q',
    tagline: '같은 부피·같은 유량인데 전환율이 다릅니다. 섞어 버리면 농도가 낮아져 반응이 느려지기 때문입니다 — 공장 설계에서 "관이냐 탱크냐"를 가르는 이유.',

    params: [
      { key: 'k', symbol: 'k', label: '반응 속도상수', unit: '1/s', min: .02, max: 1, step: .02, value: .1, color: C.k, dec: 2,
        where: '반응이 <b>얼마나 빠른가</b>입니다(아레니우스 시뮬레이션의 결과물). τ와 곱해져 담쾰러 수 kτ를 만들고, 이 하나의 수가 두 반응기의 성적을 모두 결정합니다.' },
      { key: 'V', symbol: 'V', label: '반응기 부피', unit: 'L', min: 10, max: 300, step: 10, value: 60, color: C.V, dec: 0,
        where: '<b>관(위)과 탱크(아래)의 부피</b>로, 둘에 똑같이 적용됩니다. 크면 체류시간 τ = V/Q가 길어져 전환율이 올라가지만, 설비비가 부피에 비례합니다.' },
      { key: 'Q', symbol: 'Q', label: '공급 유량', unit: 'L/s', min: .5, max: 10, step: .5, value: 3, color: C.Q, dec: 1,
        where: '원료를 <b>얼마나 빨리 밀어 넣는가</b>입니다(왼쪽 화살표). 많이 처리하려면 Q를 키워야 하지만, 그만큼 머무는 시간이 짧아져 전환율이 떨어집니다.' }
    ],
    vars: {
      tau: { symbol: 'τ', label: '공간시간', unit: 's', color: C.tau,
        where: '원료가 반응기 안에 <b>평균적으로 머무는 시간</b>입니다. τ = V/Q. 관 위에 그려진 치수선이 이 시간을 나타냅니다.' },
      Xp: { symbol: 'X_PFR', label: '관형반응기 전환율', unit: '', color: C.Xp,
        where: '<b>위쪽 관</b>의 출구 전환율입니다. 관을 따라가며 농도가 지수적으로 줄어 1 − e^(−kτ)가 됩니다.' },
      Xc: { symbol: 'X_CSTR', label: '완전혼합 전환율', unit: '', color: C.Xc,
        where: '<b>아래 교반 탱크</b>의 출구 전환율입니다. 안이 어디나 같은(낮은) 농도라서 kτ/(1+kτ)밖에 못 올라갑니다.' }
    },
    formulas: [
      { name: '공간시간 (체류시간)', tpl: '{tau} = {V} ⁄ {Q}' },
      { name: '관형반응기 (PFR)', tpl: '{Xp} = 1 − e^(−{k}{tau})' },
      { name: '완전혼합반응기 (CSTR)', tpl: '{Xc} = {k}{tau} ⁄ (1 + {k}{tau})' },
      { name: '1차 반응에서는 항상', tpl: '{Xp} > {Xc}' }
    ],

    init(p) { return { xc: 0, done: false }; },
    step(st, p, dt) {
      // CSTR 기동 과도응답: V dC/dt = Q(C₀ − C) − kVC  →  전환율로 정리
      const tau = tauOf(p);
      const xss = Xcstr(p);
      st.xc += ((xss - st.xc) * (1 / tau + p.k)) * dt;
      st.xc = clamp(st.xc, 0, 1);
    },
    // PFR 출구: t < τ 동안은 처음부터 안에 있던 유체가 t초만 반응해 나오고, t ≥ τ부터 정상상태
    graphs: [{
      title: '출구 전환율 – 시간 (기동 과도응답)', xmin: 40, y0: 0,
      series: [
        { key: 'Xp', label: 'PFR (관형)', color: C.Xp },
        { key: 'Xc', label: 'CSTR (완전혼합)', color: C.Xc }
      ]
    }],
    sample(st, p) {
      const tau = tauOf(p);
      return { Xp: 1 - Math.exp(-p.k * Math.min(st.t, tau)), Xc: st.xc };
    },

    readouts(st, p) {
      const tau = tauOf(p), da = Da(p);
      const xp = Xpfr(p), xc = Xcstr(p), vr = volRatio(p);
      return [
        { label: '공간시간 τ = V/Q', value: tau, unit: 's', color: C.tau, dec: 1 },
        { label: '담쾰러 수 kτ', value: da, unit: '', color: '#fbbf24', dec: 2 },
        { label: 'PFR 정상상태 전환율', value: xp * 100, unit: '%', color: C.Xp, dec: 1 },
        { label: 'CSTR 정상상태 전환율', value: xc * 100, unit: '%', color: C.Xc, dec: 1 },
        { label: '차이 (PFR − CSTR)', value: (xp - xc) * 100, unit: '%p', color: '#fbbf24', dec: 1 },
        { label: 'CSTR 현재 전환율 (기동 중)', value: st.xc * 100, unit: '%', color: C.Xc, dec: 1 },
        { label: '처리량 (유량 × 전환율)', value: p.Q * xp, unit: 'L/s', dec: 2, color: C.Q },
        { label: '같은 성적을 CSTR로 내려면', wide: true, color: C.Xc,
          value: isFinite(vr) ? '부피 ' + fmt(vr, 2) + ' 배 필요' : '불가능 (아무리 키워도 못 따라감)' },
        { label: '어느 쪽을 써야 하나', wide: true, color: (xp - xc) > .05 ? '#34d399' : '#93a2c4',
          value: (xp - xc) > .05 ? 'PFR이 뚜렷하게 유리 (kτ가 크다)' : '차이가 작다 — 운전 편의로 CSTR을 택할 만하다' }
      ];
    },

    notes: [
      '<b>섞으면 느려집니다.</b> CSTR은 들어온 원료가 즉시 출구 농도로 희석되므로, 반응기 전체가 "가장 낮은 농도"에서 돌아갑니다. PFR은 입구의 높은 농도 구간을 반드시 지나므로 평균 반응 속도가 높습니다.',
      '<b>담쾰러 수 kτ 하나가 모든 것을 정합니다.</b> kτ가 작으면(≪1) 두 반응기의 성적이 거의 같고, 클수록 격차가 벌어집니다. 높은 전환율을 노릴 때만 반응기 종류가 중요합니다.',
      '99% 전환이 목표라면 PFR은 kτ ≈ 4.6이면 되지만, CSTR은 <b>kτ = 99</b>가 필요합니다 — 부피가 20배 넘게 듭니다. 그래서 석유화학 대형 공정은 거의 관형입니다.',
      '그래도 CSTR을 쓰는 이유가 있습니다 — <b>온도 제어가 쉽고</b>(발열 반응을 안에서 희석·균일화), 교반으로 고체·점성 유체를 다룰 수 있고, 운전·청소가 간단합니다. 이론적 효율만으로 고르지 않습니다.',
      '현실의 타협은 <b>CSTR 여러 대를 직렬로</b> 잇는 것입니다. 탱크 수를 늘릴수록 농도가 단계적으로 떨어져 PFR에 점점 가까워집니다(무한히 많으면 정확히 PFR이 됩니다).'
    ],
    presets: [
      { name: '기본 (kτ = 2)', set: { k: .1, V: 60, Q: 3 } },
      { name: '빠른 반응 + 큰 반응기', set: { k: .5, V: 180, Q: 3 } },
      { name: '고전환율 목표 (격차 최대)', set: { k: 1, V: 300, Q: 2 } },
      { name: '차이가 거의 없는 영역', set: { k: .02, V: 20, Q: 10 } },
      { name: '과부하 (유량 최대)', set: { k: .1, V: 60, Q: 10 } }
    ],
    challenges: [
      {
        id: 'p95', title: 'PFR로 95% 전환',
        desc: '관형반응기의 정상상태 전환율을 95% 이상으로 올려 보세요.',
        hint: '95%에는 kτ ≈ 3이 필요합니다. 부피를 키우거나 유량을 줄이거나, 반응을 빠르게 하세요.',
        check: ({ P }) => Xpfr(P) >= .95
      },
      {
        id: 'gap', title: '부피 3배의 벽을 확인하기',
        desc: '같은 전환율을 CSTR로 내려면 부피가 3배 이상 필요한 조건을 만들어 보세요.',
        hint: 'kτ를 크게(5 이상) 가져가면 격차가 벌어집니다. 측정값 칸의 "부피 몇 배 필요"를 보세요.',
        check: ({ P }) => volRatio(P) >= 3
      },
      {
        id: 'same', title: '반응기 종류가 상관없는 영역',
        desc: '두 반응기의 전환율 차이를 1%p 이하로 만들어, 낮은 전환율에서는 선택이 중요하지 않다는 것을 확인하세요.',
        hint: 'kτ를 아주 작게(0.1 이하) 하면 두 식이 거의 같아집니다 — 유량을 최대, 부피를 최소로.',
        check: ({ P }) => (Xpfr(P) - Xcstr(P)) <= .01
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const tau = tauOf(p), da = Da(p);
      const xp = Xpfr(p), xc = Xcstr(p);
      const mix = (x) => {                            // 전환율 → 색 (파랑 반응물 → 초록 생성물)
        const r = Math.round(96 + (52 - 96) * x), g = Math.round(165 + (211 - 165) * x), b = Math.round(250 + (153 - 250) * x);
        return 'rgb(' + r + ',' + g + ',' + b + ')';
      };

      const x0 = 96, rw = Math.min(w - x0 - 150, 330);

      /* ── 위: PFR (관형) ── */
      const py = 92, pipeH = 42;
      D.text(ctx, 'PFR — 관형반응기 (밀어내기 흐름)', x0, py - 26, { size: 11.5, color: C.Xp, bold: true });
      // 관 내부 농도 구배
      for (let i = 0; i < 70; i++) {
        const u = i / 70, u2 = (i + 1) / 70;
        const xx = 1 - Math.exp(-da * u);
        ctx.fillStyle = mix(xx);
        ctx.globalAlpha = .55;
        ctx.fillRect(x0 + rw * u, py, rw * (u2 - u) + 1, pipeH);
      }
      ctx.globalAlpha = 1;
      ctx.save();
      if (hl === 'Xp' || hl === 'V') { ctx.shadowColor = hl === 'V' ? C.V : C.Xp; ctx.shadowBlur = 14; }
      D.roundRect(ctx, x0, py, rw, pipeH, 6);
      ctx.strokeStyle = 'rgba(200,211,239,.65)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      // 흐르는 입자 — 관을 따라가며 색이 바뀐다
      const flowSpeed = rw / Math.max(tau, .1);
      for (let i = 0; i < 16; i++) {
        const u = ((st.t * flowSpeed / rw + i / 16) % 1);
        const xx = 1 - Math.exp(-da * u);
        D.dot(ctx, x0 + rw * u, py + pipeH * (.28 + .44 * ((i * 7) % 5) / 4), 3.4, mix(xx), false);
      }
      // 농도 곡선
      const cgh = 54, cgy = py + pipeH + 8;
      ctx.save(); ctx.strokeStyle = C.Q; ctx.lineWidth = 1.8; ctx.beginPath();
      for (let i = 0; i <= 70; i++) {
        const u = i / 70, cc = Math.exp(-da * u);
        const X = x0 + rw * u, Y = cgy + cgh - cc * cgh;
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke(); ctx.restore();
      D.text(ctx, '관 안의 농도 C(z)', x0 + 4, cgy + 12, { size: 9.5, color: C.Q });
      D.dim(ctx, x0, py - 12, x0 + rw, py - 12, 'τ = ' + fmt(tau, 1) + ' s', C.tau, hl === 'tau');
      D.tag(ctx, 'X = ' + fmt(xp * 100, 1) + '%', x0 + rw + 56, py + pipeH / 2, C.Xp, hl === 'Xp');
      D.arrow(ctx, x0 + rw + 4, py + pipeH / 2, 20, 0, { color: mix(xp), width: 3 });

      /* ── 아래: CSTR (완전혼합) ── */
      const ty = cgy + cgh + 70, tH = Math.min(136, h - ty - 72), tW = Math.min(186, rw * .58);
      const tx = x0 + (rw - tW) / 2;
      D.text(ctx, 'CSTR — 완전혼합반응기 (교반 탱크)', x0, ty - 20, { size: 11.5, color: C.Xc, bold: true });
      ctx.save();
      if (hl === 'Xc' || hl === 'V') { ctx.shadowColor = hl === 'V' ? C.V : C.Xc; ctx.shadowBlur = 14; }
      D.roundRect(ctx, tx, ty, tW, tH, 8);
      ctx.fillStyle = mix(st.xc); ctx.globalAlpha = .5; ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(200,211,239,.65)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      D.text(ctx, '어디나 같은 농도', tx + tW / 2, ty + 18, { size: 10, color: 'rgba(255,255,255,.75)', align: 'center' });
      // 교반기
      const sx = tx + tW / 2, sy = ty + tH * .55;
      D.line(ctx, sx, ty - 14, sx, sy, { color: 'rgba(200,211,239,.7)', width: 3 });
      const ang = st.t * 5;
      for (let i = 0; i < 2; i++) {
        const a = ang + i * Math.PI;
        D.line(ctx, sx, sy, sx + Math.cos(a) * 30, sy + Math.sin(a) * 9, { color: 'rgba(200,211,239,.8)', width: 4 });
      }
      D.roundRect(ctx, sx - 14, ty - 26, 28, 13, 3); ctx.fillStyle = 'rgba(147,162,196,.5)'; ctx.fill();
      // 안에서 돌아다니는 입자(모두 같은 색 = 희석)
      for (let i = 0; i < 20; i++) {
        const a = st.t * 2.2 * (.6 + (i % 5) * .2) + i * 1.9;
        const rr = (12 + (i % 6) * 10);
        D.dot(ctx, sx + Math.cos(a) * rr, sy + Math.sin(a) * rr * .55, 3.2, mix(st.xc), false);
      }
      // 입·출구
      D.arrow(ctx, tx - 44, ty + tH * .3, 40, 0, { color: C.Q, width: 3.2, hot: hl === 'Q' });
      D.text(ctx, 'Q = ' + fmt(p.Q, 1) + ' L/s', tx - 46, ty + tH * .3 - 10, { size: 10, color: hl === 'Q' ? '#fff' : C.Q, align: 'right' });
      D.arrow(ctx, tx + tW + 4, ty + tH * .75, 40, 0, { color: mix(st.xc), width: 3.2 });
      D.tag(ctx, 'X = ' + fmt(st.xc * 100, 1) + '%', tx + tW + 70, ty + tH * .75, C.Xc, hl === 'Xc');
      // PFR 입구 화살표도
      D.arrow(ctx, x0 - 44, py + pipeH / 2, 40, 0, { color: C.Q, width: 3.2, hot: hl === 'Q' });
      D.text(ctx, 'V = ' + fmt(p.V, 0) + ' L (양쪽 동일)', tx + tW / 2, ty + tH + 18,
        { size: 10.5, color: hl === 'V' ? '#fff' : C.V, align: 'center', bold: hl === 'V' });

      /* ── 전환율 비교 ── */
      const bx = Math.min(w - 128, x0 + rw + 110), bTop = 92, bH = Math.min(230, h * .50), bW = 26;
      D.text(ctx, '전환율', bx + bW, bTop - 14, { size: 10.5, color: '#61719a', align: 'center' });
      [[0, xp, C.Xp, 'PFR', hl === 'Xp'], [bW + 14, xc, C.Xc, 'CSTR', hl === 'Xc']].forEach(([off, v, col, lab, hot]) => {
        D.roundRect(ctx, bx + off, bTop, bW, bH, 4); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
        ctx.save(); if (hot) { ctx.shadowColor = col; ctx.shadowBlur = 14; }
        D.roundRect(ctx, bx + off, bTop + bH * (1 - v), bW, bH * v, 4); ctx.fillStyle = col; ctx.fill(); ctx.restore();
        D.text(ctx, lab, bx + off + bW / 2, bTop + bH + 14, { size: 9.5, color: col, align: 'center' });
        D.text(ctx, fmt(v * 100, 0) + '%', bx + off + bW / 2, bTop + bH * (1 - v) - 6,
          { size: 10, color: col, align: 'center', bold: true });
      });
      D.text(ctx, 'kτ = ' + fmt(da, 2), bx, bTop + bH + 36, { size: 11.5, color: '#fbbf24', bold: true });
    }
  });
})();
