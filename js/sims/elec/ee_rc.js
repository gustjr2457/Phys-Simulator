/* [전기공학·회로이론] RC 회로의 과도응답 — τ = RC
   스위치를 올리면 커패시터 전압은 즉시 오르지 않고 e^(−t/τ)로 천천히 따라온다.
   시간상수 τ = RC 하나가 "얼마나 느린가"를 전부 결정하고, 그 느림이 쓸모가 된다 —
   디바운스 회로, 필터, 타이머(555), 카메라 플래시, 그리고 디지털 회로의 속도 한계가
   모두 이 지수 곡선 위에 있다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { V: '#fbbf24', R: '#fb7185', Cc: '#5eead4', T: '#93a2c4',
              tau: '#f472b6', vc: '#60a5fa', i: '#fb923c' };

  const tauOf = p => p.R * p.Cc * 1e-3;        // R[kΩ]·C[µF] = ms → s

  PS.register({
    id: 'ee-rc', mode: 'elec', category: '회로이론',
    title: 'RC 회로의 과도응답',
    sub: 'τ = RC',
    tagline: '스위치를 올려도 커패시터 전압은 즉시 따라오지 않습니다. 시간상수 τ = RC 하나가 그 느림을 전부 결정합니다 — 그리고 이 느림이 필터와 타이머가 됩니다.',

    params: [
      { key: 'V', symbol: 'V', label: '전원 전압', unit: 'V', min: 1, max: 20, step: 1, value: 10, color: C.V, dec: 0,
        where: '<b>왼쪽 전원</b>이 내보내는 전압입니다(사각파로 켜고 끕니다). 최종 도달 전압과 전류의 크기를 함께 비례해서 정하지만, <b>속도(τ)에는 영향을 주지 않습니다</b>.' },
      { key: 'R', symbol: 'R', label: '저항', unit: 'kΩ', min: 1, max: 50, step: 1, value: 10, color: C.R, dec: 0,
        where: '<b>위쪽 저항기</b>입니다. 전하가 커패시터로 흘러드는 통로를 좁혀 충전을 느리게 하고(τ = RC), 그 과정에서 에너지를 열로 버립니다(저항기가 붉게 달아오릅니다).' },
      { key: 'Cc', symbol: 'C', label: '커패시터', unit: 'µF', min: 20, max: 500, step: 10, value: 100, color: C.Cc, dec: 0,
        where: '<b>오른쪽 평행판</b>입니다. 전하를 담아 두는 그릇으로, 크면 채울 양이 많아져 역시 느려집니다. 판에 모인 ＋/－ 기호가 전압에 비례합니다.' },
      { key: 'T', symbol: 'T', label: '스위칭 주기', unit: 's', min: .5, max: 12, step: .5, value: 6, color: C.T, dec: 1, reset: true,
        where: '전원을 <b>켜고 끄는 한 주기</b>입니다. τ와 비교해서 짧으면(τ ≫ T) 커패시터가 평균값만 따라가는 <b>적분기</b>가 되고, 길면 완전히 충전·방전합니다.' }
    ],
    vars: {
      tau: { symbol: 'τ', label: '시간상수', unit: 's', color: C.tau,
        where: '최종값의 <b>63.2%까지 오르는 데 걸리는 시간</b>입니다. 화면의 63% 기준선과 그래프의 곡선 모양을 결정하는 유일한 값입니다.' },
      vc: { symbol: 'V_C', label: '커패시터 전압', unit: 'V', color: C.vc,
        where: '커패시터 양단의 전압(파란 게이지)입니다. 전원을 켜도 <b>즉시 점프하지 않고</b> 지수적으로 따라옵니다 — 커패시터는 전압이 갑자기 변하는 것을 싫어합니다.' },
      i: { symbol: 'I', label: '전류', unit: 'mA', color: C.i,
        where: '회로를 흐르는 전류(도선 위를 움직이는 점)입니다. 스위치를 올린 <b>직후가 가장 크고</b> 충전이 끝나면 0이 됩니다 — 방전할 때는 방향이 거꾸로입니다.' }
    },
    formulas: [
      { name: '시간상수', tpl: '{tau} = {R}{Cc}' },
      { name: '충전', tpl: '{vc} = {V}(1 − e^(−t⁄{tau}))' },
      { name: '방전', tpl: '{vc} = {V}·e^(−t⁄{tau})' },
      { name: '전류 (저항에 걸린 전압 ÷ R)', tpl: '{i} = (V_in − {vc}) ⁄ {R}' }
    ],

    init(p) { return { vc: 0, chg: true, tp: 0, vstart: 0, mark: false, frac: 0, peak: 0, done: false }; },
    step(st, p, dt) {
      const half = p.T / 2, tau = tauOf(p);
      st.tp += dt;
      if (st.tp >= half) {                               // 스위치 반전
        st.tp -= half; st.chg = !st.chg;
        st.vstart = st.vc; st.mark = false;
      }
      const target = st.chg ? p.V : 0;
      // 구간 안에서는 입력이 일정하므로 해석해를 그대로 쓴다(수치오차 0)
      st.vc += (target - st.vc) * (1 - Math.exp(-dt / tau));
      if (st.chg && !st.mark && st.tp >= tau) {          // 1τ 지점의 상승 비율을 기록
        st.mark = true;
        const span = p.V - st.vstart;
        st.frac = Math.abs(span) > 1e-6 ? (st.vc - st.vstart) / span : 0;
      }
      const i = Math.abs((target - st.vc) / p.R);
      if (i > st.peak) st.peak = i;
    },

    graphs: [{
      title: '전원 전압과 커패시터 전압', xmin: 12, window: 24,
      series: [
        { key: 'vin', label: 'V_in (사각파)', color: C.V },
        { key: 'vc', label: 'V_C', color: C.vc }
      ]
    }, {
      title: '전류 (충전 + / 방전 −)', xmin: 12, window: 24,
      series: [{ key: 'i', label: 'I (mA)', color: C.i }]
    }],
    sample(st, p) {
      const vin = st.chg ? p.V : 0;
      return { vin: vin, vc: st.vc, i: (vin - st.vc) / p.R };
    },

    readouts(st, p) {
      const tau = tauOf(p), vin = st.chg ? p.V : 0;
      const i = (vin - st.vc) / p.R;
      const ratio = tau / p.T;
      return [
        { label: '시간상수 τ = RC', value: tau, unit: 's', color: C.tau, dec: 3 },
        { label: '완전 충전 (5τ)', value: tau * 5, unit: 's', color: C.tau, dec: 2 },
        { label: '커패시터 전압 V_C', value: st.vc, unit: 'V', color: C.vc, dec: 2 },
        { label: '충전율', value: st.vc / p.V * 100, unit: '%', color: C.vc, dec: 1 },
        { label: '전류 I', value: i, unit: 'mA', color: C.i, dec: 3 },
        { label: '저장된 전하 Q = CV', value: p.Cc * st.vc, unit: 'µC', dec: 0, color: C.Cc },
        { label: '저장된 에너지 ½CV²', value: .5 * p.Cc * st.vc * st.vc / 1000, unit: 'mJ', dec: 2, color: C.Cc },
        { label: '저항에서 버려지는 전력', value: i * i * p.R, unit: 'mW', dec: 2, color: C.R },
        { label: '1τ 지점의 상승 비율', value: st.mark ? fmt(st.frac * 100, 1) + ' % (이론 63.2%)' : '측정 중…', wide: true, color: C.tau },
        { label: 'τ / T', value: ratio, dec: 2, color: '#fbbf24' },
        { label: '동작 성격', wide: true, color: ratio > 5 ? '#a78bfa' : (ratio < .1 ? '#34d399' : '#fbbf24'),
          value: ratio > 5 ? '적분기 — 평균값만 통과(저역통과)' :
                 (ratio < .1 ? '거의 즉시 추종 — 사각파를 그대로 따라감' : '충전·방전이 뚜렷하게 보이는 영역') }
      ];
    },

    notes: [
      '<b>τ = RC가 속도를 전부 결정합니다.</b> 전원 전압을 아무리 올려도 빨라지지 않습니다 — 전압은 "얼마나 높이"만, τ는 "얼마나 빨리"만 담당합니다.',
      '1τ에서 <b>63.2%</b>, 2τ에서 86.5%, 3τ에서 95%, 5τ에서 99.3%입니다. 실무에서는 "5τ면 다 찼다"고 보고 설계합니다.',
      '커패시터는 <b>전압이 갑자기 변하는 것을 거부합니다.</b> 그래서 스위치 접점이 떨리는 잡음을 없애는 디바운스, 전원 잡음을 흡수하는 디커플링 커패시터로 쓰입니다.',
      'τ가 주기보다 훨씬 길면(τ ≫ T) 커패시터는 <b>평균값만 남깁니다</b> — 이것이 저역통과 필터이자 적분기입니다. 반대로 R과 C의 위치를 바꾸면 고역통과 필터가 됩니다.',
      '충전 과정에서 전원이 공급한 에너지의 <b>절반은 반드시 저항에서 열로 사라집니다</b>(R의 크기와 무관하게!). 이 때문에 큰 커패시터를 충전하는 회로에는 효율을 위해 스위칭 방식을 씁니다.'
    ],
    presets: [
      { name: '기본 (τ = 1 s)', set: { V: 10, R: 10, Cc: 100, T: 6 } },
      { name: '빠른 회로 (τ = 0.02 s)', set: { R: 1, Cc: 20, T: 2 } },
      { name: '느린 타이머 (τ = 25 s)', set: { R: 50, Cc: 500, T: 12 } },
      { name: '적분기 (τ ≫ T)', set: { R: 50, Cc: 500, T: 2 } },
      { name: '사각파 추종 (τ ≪ T)', set: { R: 1, Cc: 20, T: 12 } }
    ],
    challenges: [
      {
        id: 'p63', title: '63.2%의 정체',
        desc: '시뮬레이션을 돌려 1τ 지점의 상승 비율이 63% 근처로 측정되는 것을 확인하세요 — 어떤 R, C를 써도 같습니다.',
        hint: '한 주기의 절반이 τ보다 길어야 측정됩니다. T를 τ의 4배 이상으로 두세요.',
        check: ({ st }) => st.mark && st.frac > .62 && st.frac < .645
      },
      {
        id: 'integ', title: '적분기 만들기',
        desc: 'τ가 스위칭 주기 T의 5배 이상이 되게 해서, 커패시터 전압이 사각파를 따라가지 못하고 평균값 근처에서 잔물결만 남게 만들어 보세요.',
        hint: 'R과 C를 크게, T를 작게. 측정값 칸의 τ/T를 5 이상으로.',
        check: ({ P }) => tauOf(P) / P.T >= 5
      },
      {
        id: 'full', title: '완전 충전시키기',
        desc: '커패시터를 전원 전압의 99% 이상까지 충전시켜 보세요.',
        hint: '99%에는 약 5τ가 필요합니다. 반주기(T/2)가 5τ보다 길면 됩니다.',
        check: ({ P, st }) => st.vc >= P.V * .99
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const tau = tauOf(p), vin = st.chg ? p.V : 0;
      const i = (vin - st.vc) / p.R;
      const frac = clamp(st.vc / p.V, 0, 1);

      /* ── 회로도 ── */
      const x0 = 70, x1 = Math.min(w - 170, x0 + 300);
      const yTop = 86, yBot = yTop + Math.min(170, h * .32);
      const wire = { color: 'rgba(200,211,239,.65)', width: 2.4 };
      const mid = (x0 + x1) / 2;

      // 전원(배터리) — 왼쪽 세로
      const by = (yTop + yBot) / 2;
      D.line(ctx, x0, yTop, x0, by - 16, wire);
      D.line(ctx, x0, by + 16, x0, yBot, wire);
      ctx.save();
      if (hl === 'V') { ctx.shadowColor = C.V; ctx.shadowBlur = 16; }
      [[-10, 15], [-4, 8], [2, 15], [8, 8]].forEach(([dy, len], k) => {
        D.line(ctx, x0 - len, by + dy, x0 + len, by + dy,
          { color: k % 2 ? 'rgba(200,211,239,.7)' : C.V, width: k % 2 ? 2 : 3.2 });
      });
      ctx.restore();
      D.text(ctx, fmt(p.V, 0) + ' V', x0 - 22, by + 4, { size: 11, color: hl === 'V' ? '#fff' : C.V, align: 'right', bold: true });

      // 스위치 상태
      D.line(ctx, x0, yTop, x0 + 46, yTop, wire);
      const swOn = st.chg;
      D.dot(ctx, x0 + 46, yTop, 3.5, '#93a2c4');
      D.dot(ctx, x0 + 78, yTop, 3.5, '#93a2c4');
      D.line(ctx, x0 + 46, yTop, x0 + 78, yTop + (swOn ? 0 : -16),
        { color: swOn ? '#34d399' : '#fb7185', width: 3, hot: true });
      D.text(ctx, swOn ? '충전' : '방전', x0 + 62, yTop - 24,
        { size: 10.5, color: swOn ? '#34d399' : '#fb7185', align: 'center', bold: true });
      D.line(ctx, x0 + 78, yTop, mid - 34, yTop, wire);

      // 저항기 — 전류가 많이 흐를 때 붉게 달아오른다
      const pw = clamp(Math.abs(i) * Math.abs(i) * p.R / 30, 0, 1);
      ctx.save();
      if (hl === 'R' || pw > .2) { ctx.shadowColor = C.R; ctx.shadowBlur = 8 + 18 * pw; }
      D.roundRect(ctx, mid - 34, yTop - 11, 68, 22, 4);
      ctx.fillStyle = 'rgba(251,113,133,' + (.18 + .5 * pw) + ')'; ctx.fill();
      ctx.strokeStyle = C.R; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      D.text(ctx, fmt(p.R, 0) + ' kΩ', mid, yTop - 20, { size: 10.5, color: hl === 'R' ? '#fff' : C.R, align: 'center', bold: hl === 'R' });
      D.line(ctx, mid + 34, yTop, x1, yTop, wire);

      // 커패시터 — 오른쪽 세로, 평행판
      D.line(ctx, x1, yTop, x1, by - 13, wire);
      D.line(ctx, x1, by + 13, x1, yBot, wire);
      ctx.save();
      if (hl === 'Cc' || hl === 'vc') { ctx.shadowColor = hl === 'vc' ? C.vc : C.Cc; ctx.shadowBlur = 16; }
      const plateW = 24 + p.Cc * .035;
      D.line(ctx, x1 - plateW, by - 13, x1 + plateW, by - 13, { color: C.Cc, width: 3.4 });
      D.line(ctx, x1 - plateW, by + 13, x1 + plateW, by + 13, { color: C.Cc, width: 3.4 });
      ctx.restore();
      // 판에 모인 전하
      const nq = Math.round(frac * 7);
      for (let q = 0; q < nq; q++) {
        const qx = x1 - plateW + 6 + q * (plateW * 2 - 12) / Math.max(1, nq - 1 || 1);
        D.text(ctx, '＋', qx, by - 17, { size: 9, color: '#fbbf24', align: 'center' });
        D.text(ctx, '－', qx, by + 26, { size: 9, color: '#60a5fa', align: 'center' });
      }
      // 판 사이 전기장
      if (frac > .05) {
        ctx.save(); ctx.strokeStyle = 'rgba(96,165,250,' + (.15 + .45 * frac) + ')'; ctx.lineWidth = 1.2;
        for (let q = 0; q < 5; q++) {
          const qx = x1 - plateW + 8 + q * (plateW * 2 - 16) / 4;
          ctx.beginPath(); ctx.moveTo(qx, by - 11); ctx.lineTo(qx, by + 11); ctx.stroke();
        }
        ctx.restore();
      }
      D.text(ctx, fmt(p.Cc, 0) + ' µF', x1 + plateW + 8, by + 4,
        { size: 10.5, color: hl === 'Cc' ? '#fff' : C.Cc, bold: hl === 'Cc' });
      D.line(ctx, x0, yBot, x1, yBot, wire);
      // 접지
      D.line(ctx, mid, yBot, mid, yBot + 12, wire);
      [10, 6.5, 3].forEach((ww, k) => D.line(ctx, mid - ww, yBot + 12 + k * 4, mid + ww, yBot + 12 + k * 4, { color: 'rgba(200,211,239,.55)', width: 1.8 }));

      /* ── 전류: 도선 위를 움직이는 점 ── */
      const dir = i >= 0 ? 1 : -1;
      const sp = clamp(Math.abs(i) * 90, 0, 190);
      const path = [[x0 + 78, yTop, mid - 34, yTop], [mid + 34, yTop, x1, yTop], [x1, yBot, x0, yBot]];
      ctx.save();
      if (hl === 'i') { ctx.shadowColor = C.i; ctx.shadowBlur = 12; }
      path.forEach((sgm, si) => {
        const [ax, ay, bx2, by2] = sgm;
        const len = Math.hypot(bx2 - ax, by2 - ay);
        const n = Math.max(2, Math.round(len / 26));
        for (let q = 0; q < n; q++) {
          let u = (q / n + (st.t * sp / len) * dir * (si === 2 ? -1 : 1)) % 1;
          if (u < 0) u += 1;
          const alpha = clamp(Math.abs(i) * 7, .08, 1);
          ctx.globalAlpha = alpha;
          D.dot(ctx, ax + (bx2 - ax) * u, ay + (by2 - ay) * u, 2.8, C.i, false);
        }
      });
      ctx.globalAlpha = 1; ctx.restore();
      D.tag(ctx, 'I = ' + fmt(i, 3) + ' mA', mid, yBot - 18, C.i, hl === 'i');

      /* ── V_C 게이지 ── */
      const gx = Math.min(w - 92, x1 + 86), gTop = 92, gH = Math.min(200, h * .40), gW = 30;
      D.roundRect(ctx, gx, gTop, gW, gH, 5); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
      ctx.save(); if (hl === 'vc') { ctx.shadowColor = C.vc; ctx.shadowBlur = 16; }
      D.roundRect(ctx, gx, gTop + gH * (1 - frac), gW, gH * frac, 5);
      ctx.fillStyle = C.vc; ctx.fill(); ctx.restore();
      [[.632, '63% (1τ)', C.tau], [.95, '95% (3τ)', '#93a2c4']].forEach(([lv, lab, col]) => {
        const yy = gTop + gH * (1 - lv);
        D.line(ctx, gx - 6, yy, gx + gW + 6, yy, { color: col, dash: [3, 3], width: 1.5 });
        D.text(ctx, lab, gx + gW + 10, yy + 3.5, { size: 9, color: col });
      });
      D.text(ctx, 'V_C', gx + gW / 2, gTop - 22, { size: 10.5, color: '#61719a', align: 'center' });
      D.text(ctx, fmt(st.vc, 2) + ' V', gx + gW / 2, gTop - 7,
        { size: 12, color: hl === 'vc' ? '#fff' : C.vc, align: 'center', bold: true });

      /* ── 요약 ── */
      D.text(ctx, 'τ = RC = ' + fmt(tau, 3) + ' s', x0, h - 56,
        { size: 13, color: hl === 'tau' ? '#fff' : C.tau, bold: true });
      D.text(ctx, '완전 충전까지 5τ = ' + fmt(tau * 5, 2) + ' s   ·   스위칭 반주기 = ' + fmt(p.T / 2, 2) + ' s',
        x0, h - 34, { size: 11, color: '#61719a' });
      D.text(ctx, 'τ / T = ' + fmt(tau / p.T, 2) + (tau / p.T > 5 ? '  → 적분기(저역통과)' : (tau / p.T < .1 ? '  → 사각파를 그대로 따라감' : '')),
        x0, h - 14, { size: 11, color: '#fbbf24' });
    }
  });
})();
