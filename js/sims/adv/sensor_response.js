/* [센서공학] 1차 지연계의 응답 — τ·ẏ + y = u,  샘플링과 노이즈 */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { tau: '#fbbf24', u: '#fb7185', y: '#5eead4', ns: '#a78bfa', Ts: '#60a5fa', fc: '#fbbf24' };
  const Y0 = 20;   // 초기 온도(상온)

  PS.register({
    id: 'sensor-response', mode: 'adv', category: '센서공학',
    title: '센서의 응답 속도와 샘플링',
    sub: 'τ·ẏ + y = u',
    tagline: '센서는 진짜 값을 즉시 알려주지 않습니다. 시정수 τ만큼 늦고, 샘플링 간격만큼 뚝뚝 끊깁니다.',

    params: [
      { key: 'tau', symbol: 'τ', label: '시정수', unit: 's', min: .1, max: 5, step: .1, value: 1.5, color: C.tau, dec: 1,
        where: '센서가 <b>얼마나 굼뜬가</b>입니다. 그래프의 <b>노란 63.2% 선</b>과 만나는 시간이 정확히 τ입니다. 두꺼운 보호관을 씌운 온도계일수록 큽니다.' },
      { key: 'u', symbol: 'u', label: '실제 온도 (입력)', unit: '℃', min: 30, max: 150, step: 5, value: 100, color: C.u, dec: 0,
        where: '측정 대상인 <b>뜨거운 물의 진짜 온도</b>(빨간 점선)입니다. 센서 값은 여기에 <b>점근적으로</b> 다가갈 뿐 즉시 도달하지 못합니다.' },
      { key: 'ns', symbol: 'n', label: '노이즈 세기', unit: '℃', min: 0, max: 4, step: .2, value: .6, color: C.ns, dec: 1,
        where: '전기적 잡음 때문에 <b>측정값이 떨리는 폭</b>입니다. 샘플 점들이 위아래로 흩어지는 정도로 나타납니다. 필터를 걸면 줄지만 응답이 더 느려집니다.' },
      { key: 'Ts', symbol: 'Ts', label: '샘플링 주기', unit: 's', min: .05, max: 2, step: .05, value: .3, color: C.Ts, dec: 2,
        where: 'ADC가 <b>몇 초마다 한 번 읽는가</b>입니다. 파란 <b>계단 모양</b> 간격이 이 값입니다. 길면 빠른 변화를 놓칩니다(에일리어싱).' }
    ],
    vars: {
      y: { symbol: 'y', label: '센서 출력', unit: '℃', color: C.y,
        where: '센서가 <b>실제로 내놓는 값</b>(청록 곡선)입니다. 온도계 눈금과 막대로 표시됩니다.' },
      fc: { symbol: 'f_c', label: '차단 주파수(대역폭)', unit: 'Hz', color: C.fc,
        where: '이 센서가 <b>따라갈 수 있는 변화의 한계 속도</b>입니다. τ가 작을수록 넓어집니다.' },
      tr: { symbol: 't_r', label: '상승 시간 (10→90%)', unit: 's', color: C.tau,
        where: '측정값이 최종값의 10%에서 90%까지 오르는 데 걸리는 시간, 약 2.2τ입니다.' }
    },
    formulas: [
      { name: '1차 지연계', tpl: '{tau}·ẏ + {y} = {u}' },
      { name: '계단 응답', tpl: '{y}(t) = {u}·( 1 − e^(−t⁄{tau}) )' },
      { name: '63.2 % 지점', tpl: 't = {tau} 일 때 {y} = 0.632·{u}' },
      { name: '대역폭', tpl: '{fc} = 1 ⁄ ( 2π{tau} )' },
      { name: '상승 시간', tpl: '{tr} ≈ 2.2·{tau}' }
    ],

    init(p) { return { y: Y0, meas: Y0, last: -9, samples: [] }; },

    step(st, p, dt) {
      st.y += (p.u - st.y) / p.tau * dt;
      if (st.t - st.last >= p.Ts) {
        st.last = st.t;
        const n = (Math.random() + Math.random() + Math.random() - 1.5) * p.ns;
        st.meas = st.y + n;
        st.samples.push({ t: st.t, v: st.meas });
        if (st.samples.length > 400) st.samples.shift();
      }
    },

    graphs: [{
      title: '온도 – 시간', xmin: 8, window: 14,
      series: [
        { key: 'u', label: '실제 값', color: C.u },
        { key: 'y', label: '센서 출력', color: C.y },
        { key: 'meas', label: '샘플링 값', color: C.Ts }
      ]
    }],
    sample(st, p) { return { u: p.u, y: st.y, meas: st.meas }; },

    readouts(st, p) {
      const frac = (st.y - Y0) / Math.max(1e-6, p.u - Y0);
      return [
        { label: '센서 출력 y', value: st.y, unit: '℃', color: C.y },
        { label: '샘플링 값 (노이즈 포함)', value: st.meas, unit: '℃', color: C.Ts },
        { label: '실제 값과의 오차', value: st.y - p.u, unit: '℃', color: '#fb7185' },
        { label: '최종값 도달률', value: frac * 100, unit: '%', dec: 1 },
        { label: '상승 시간 2.2τ', value: 2.2 * p.tau, unit: 's', color: C.tau },
        { label: '정착 시간 4τ (98%)', value: 4 * p.tau, unit: 's', color: C.tau },
        { label: '대역폭 f_c = 1/2πτ', value: 1 / (2 * Math.PI * p.tau), unit: 'Hz', color: C.fc },
        { label: '샘플링 주파수', value: 1 / p.Ts, unit: 'Hz', color: C.Ts }
      ];
    },

    notes: [
      '어떤 센서도 <b>즉시</b> 반응하지 못합니다. τ는 센서 선택의 가장 중요한 기준 중 하나입니다.',
      '<b>1τ에 63.2%, 3τ에 95%, 5τ에 99%</b>. 이 숫자는 모든 1차계에 공통입니다(RC 회로, 온도계, 관성 필터…).',
      '샘플링 주파수는 측정하려는 신호 최고 주파수의 <b>2배 이상</b>이어야 합니다(나이퀴스트). 그렇지 않으면 엉뚱한 신호로 보입니다.',
      '노이즈를 줄이려 필터를 세게 걸면 τ가 커집니다 — <b>정확도와 응답 속도는 맞바꾸는 관계</b>입니다.'
    ],
    presets: [
      { name: '빠른 센서 (τ=0.2)', set: { tau: .2 } },
      { name: '굼뜬 센서 (τ=5)', set: { tau: 5 } },
      { name: '노이즈 심함', set: { ns: 4 } },
      { name: '샘플링 너무 느림', set: { Ts: 2 } },
      { name: '이상적 조건', set: { tau: .3, ns: 0, Ts: .05 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const TMAX = 160;

      /* ── 비커와 온도계 ─────────────────────── */
      const bx = w * .12, bw = 150, bTop = h * .3, bH = h * .45;
      // 물
      ctx.save();
      const wg = ctx.createLinearGradient(0, bTop, 0, bTop + bH);
      const hot = clamp((p.u - 20) / 130, 0, 1);
      wg.addColorStop(0, 'rgba(' + Math.round(80 + 175 * hot) + ',' + Math.round(155 - 85 * hot) + ',' + Math.round(225 - 165 * hot) + ',.32)');
      wg.addColorStop(1, 'rgba(' + Math.round(80 + 175 * hot) + ',' + Math.round(140 - 80 * hot) + ',' + Math.round(205 - 150 * hot) + ',.16)');
      ctx.fillStyle = wg;
      ctx.fillRect(bx, bTop + 18, bw, bH - 18);
      ctx.restore();
      // 비커 외곽
      ctx.save();
      ctx.strokeStyle = 'rgba(147,162,196,.55)'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(bx, bTop); ctx.lineTo(bx, bTop + bH); ctx.lineTo(bx + bw, bTop + bH); ctx.lineTo(bx + bw, bTop);
      ctx.stroke(); ctx.restore();
      D.line(ctx, bx, bTop + 18, bx + bw, bTop + 18, { color: 'rgba(147,162,196,.4)' });
      // 기포 (뜨거울수록 많이)
      const nb = Math.round(hot * 9);
      for (let i = 0; i < nb; i++) {
        const ph = (st.t * (.5 + i * .17) + i * .37) % 1;
        D.dot(ctx, bx + 18 + (i * 37) % (bw - 30), bTop + bH - 8 - ph * (bH - 34), 2 + (i % 3), 'rgba(255,255,255,.18)');
      }
      D.tag(ctx, '실제 온도 ' + fmt(p.u, 0) + ' ℃', bx + bw / 2, bTop + 40, C.u, hl === 'u');

      // 프로브
      const px = bx + bw / 2;
      D.line(ctx, px, bTop - 70, px, bTop + bH - 30, { color: '#93a2c4', width: 5 });
      ctx.fillStyle = hl === 'y' ? '#a7f3e5' : C.y;
      ctx.beginPath(); ctx.arc(px, bTop + bH - 28, 8, 0, 7); ctx.fill();
      D.text(ctx, '온도 센서', px, bTop - 78, { size: 10.5, color: '#93a2c4', align: 'center' });

      // 디지털 표시기
      const dx = bx + bw + 46, dy = bTop - 4;
      D.roundRect(ctx, dx, dy, 168, 78, 10);
      ctx.fillStyle = '#08101f'; ctx.fill();
      ctx.strokeStyle = '#22304f'; ctx.lineWidth = 1; ctx.stroke();
      D.text(ctx, '센서 출력 (샘플링)', dx + 12, dy + 18, { size: 10, color: '#61719a' });
      D.text(ctx, fmt(st.meas, 1) + ' ℃', dx + 12, dy + 52, { size: 28, color: C.Ts, bold: true, glow: hl === 'Ts' });
      D.text(ctx, '연속 출력 ' + fmt(st.y, 1) + ' ℃', dx + 12, dy + 70, { size: 10, color: C.y });

      // 온도 막대
      const sbx = dx + 190, sby = bTop, sbh = bH;
      const lvl = v => sby + sbh - clamp((v - 0) / TMAX, 0, 1) * sbh;
      D.roundRect(ctx, sbx, sby, 26, sbh, 6); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
      ctx.save();
      if (hl === 'y') { ctx.shadowColor = C.y; ctx.shadowBlur = 14; }
      ctx.fillStyle = C.y;
      ctx.fillRect(sbx, lvl(st.y), 26, sby + sbh - lvl(st.y));
      ctx.restore();
      D.line(ctx, sbx - 8, lvl(p.u), sbx + 40, lvl(p.u), { color: C.u, dash: [4, 4], width: 2, hot: hl === 'u' });
      D.text(ctx, '목표', sbx + 44, lvl(p.u) + 4, { size: 10, color: C.u });
      const y632 = Y0 + (p.u - Y0) * .632;
      D.line(ctx, sbx - 8, lvl(y632), sbx + 40, lvl(y632), { color: C.tau, dash: [3, 4], hot: hl === 'tau' });
      D.text(ctx, '63.2 % → t = τ', sbx + 44, lvl(y632) + 4, { size: 10, color: C.tau, bold: hl === 'tau' });

      /* ── 샘플링 계단 그림 ──────────────────── */
      const gx = w * .1, gy = h * .84, gw = w * .8, gh = 54;
      D.text(ctx, '샘플링: ' + fmt(p.Ts, 2) + ' s 마다 한 번씩만 읽습니다 (' + fmt(1 / p.Ts, 1) + ' Hz)',
        gx, gy - gh - 10, { size: 11, color: hl === 'Ts' ? '#fff' : '#61719a', bold: hl === 'Ts' });
      const WIN = 10;
      const t0 = Math.max(0, st.t - WIN);
      const SX = t => gx + ((t - t0) / WIN) * gw;
      const SY = v => gy - clamp((v - Y0) / Math.max(1, p.u - Y0), -.2, 1.15) * gh;
      // 연속 곡선
      ctx.save();
      ctx.strokeStyle = C.y; ctx.lineWidth = 1.6; ctx.globalAlpha = .8; ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const t = t0 + WIN * i / 120;
        if (t > st.t) break;
        const v = p.u + (Y0 - p.u) * Math.exp(-t / p.tau);
        i ? ctx.lineTo(SX(t), SY(v)) : ctx.moveTo(SX(t), SY(v));
      }
      ctx.stroke(); ctx.restore();
      // 계단
      ctx.save();
      ctx.strokeStyle = C.Ts; ctx.lineWidth = 2;
      if (hl === 'Ts') { ctx.shadowColor = C.Ts; ctx.shadowBlur = 10; }
      ctx.beginPath();
      let started = false;
      st.samples.forEach((s, i) => {
        if (s.t < t0) return;
        const x = SX(s.t), y = SY(s.v);
        if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
        const nx = (i + 1 < st.samples.length) ? SX(st.samples[i + 1].t) : SX(Math.min(st.t, s.t + p.Ts));
        ctx.lineTo(nx, y);
      });
      ctx.stroke(); ctx.restore();
      st.samples.forEach(s => { if (s.t >= t0) D.dot(ctx, SX(s.t), SY(s.v), 2.6, C.Ts); });
      D.line(ctx, gx, SY(p.u), gx + gw, SY(p.u), { color: C.u, dash: [4, 5], hot: hl === 'u' });
      // τ 표시
      if (st.t > p.tau) {
        D.line(ctx, SX(p.tau), gy + 6, SX(p.tau), SY(y632), { color: C.tau, dash: [3, 4], hot: hl === 'tau' });
        if (p.tau >= t0) D.tag(ctx, 'τ = ' + fmt(p.tau, 1) + ' s', SX(p.tau), gy + 16, C.tau, hl === 'tau');
      }
    }
  });
})();
