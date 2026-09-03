/* [자율운항시스템공학] 자동 침로 제어 — 노모토 모델 + PID */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { psid: '#fbbf24', Kp: '#34d399', Kd: '#60a5fa', Ki: '#a78bfa', U: '#5eead4', dist: '#fb7185', psi: '#5eead4', dl: '#f472b6' };
  const K_N = 0.12, T_N = 7;          // 노모토 계수 (선회성 / 추종성)
  const DMAX = 35, DRATE = 4;         // 타각 한계와 타기 속도 (°/s)

  PS.register({
    id: 'ship-autopilot', mode: 'adv', category: '자율운항시스템공학',
    title: '자율운항 침로 제어',
    sub: 'δ = Kp·e + Ki∫e + Kd·ė',
    tagline: '자율운항선의 첫걸음은 "목표 방향을 스스로 유지하는 것"입니다. 게인 3개로 배가 어떻게 달라지는지 보세요.',

    params: [
      { key: 'psid', symbol: 'ψd', label: '목표 침로', unit: '°', min: -90, max: 90, step: 5, value: 40, color: C.psid, dec: 0,
        where: '자동조타 장치에 <b>입력한 방향</b>입니다. 화면의 노란 점선이며, 값을 바꾸면 배가 그 방향으로 선회를 시작합니다.' },
      { key: 'Kp', symbol: 'Kp', label: '비례 게인', unit: '', min: .2, max: 6, step: .1, value: 1.6, color: C.Kp, dec: 1,
        where: '<b>오차에 비례해</b> 타를 꺾는 정도입니다. 크면 빠르게 반응하지만 <b>오버슈트와 진동</b>이 생깁니다. 타각 막대의 초록 성분입니다.' },
      { key: 'Kd', symbol: 'Kd', label: '미분 게인', unit: '', min: 0, max: 12, step: .5, value: 4, color: C.Kd, dec: 1,
        where: '<b>선회 속도 r을 억제</b>하는 브레이크 역할입니다. 진동을 잡아 주지만 너무 크면 반응이 굼떠집니다. 진동공학의 감쇠와 정확히 같은 역할입니다.' },
      { key: 'Ki', symbol: 'Ki', label: '적분 게인', unit: '', min: 0, max: .6, step: .02, value: 0, color: C.Ki, dec: 2,
        where: '<b>쌓인 오차</b>를 없앱니다. 바람·조류처럼 한쪽으로 미는 외란이 있을 때, Ki가 0이면 목표에 영원히 도달하지 못합니다.' },
      { key: 'dist', symbol: 'w', label: '외란 (바람·조류)', unit: '°/s', min: -1.2, max: 1.2, step: .1, value: 0, color: C.dist, dec: 1,
        where: '배를 <b>한쪽으로 계속 미는 힘</b>입니다. 화면 위쪽 바람 화살표로 표시되며, 정상상태 오차의 원인입니다.' },
      { key: 'U', symbol: 'U', label: '선속', unit: 'm/s', min: 2, max: 12, step: .5, value: 6, color: C.U, dec: 1,
        where: '배의 <b>전진 속도</b>입니다. 항적(꼬리)이 그려지는 속도를 정합니다. 빠를수록 같은 타각에도 크게 돕니다.' }
    ],
    vars: {
      psi: { symbol: 'ψ', label: '현재 침로', unit: '°', color: C.psi,
        where: '배의 <b>실제 뱃머리 방향</b>입니다. 선체와 청록색 화살표가 가리키는 방향입니다.' },
      e: { symbol: 'e', label: '침로 오차', unit: '°', color: '#fb7185',
        where: '목표 − 현재. 제어기가 없애려고 하는 값이며, 아래 그래프에서 두 선의 간격입니다.' },
      dl: { symbol: 'δ', label: '타각', unit: '°', color: C.dl,
        where: '<b>방향타가 꺾인 각도</b>입니다. 선미의 분홍색 타와 아래 막대로 표시되며, ±35°를 넘지 못합니다(포화).' },
      r: { symbol: 'r', label: '선회 각속도', unit: '°/s', color: C.Kd,
        where: '배가 <b>회전하는 빠르기</b>입니다. 자이로 센서가 측정하며, 미분 항이 이 값을 억제합니다.' }
    },
    formulas: [
      { name: '노모토 조종 모델', tpl: 'T·ṙ + {r} = K·{dl} ,  ψ̇ = {r}' },
      { name: '침로 오차', tpl: '{e} = ψd − {psi}' },
      { name: 'PID 자동조타', tpl: '{dl} = {Kp}{e} + {Ki}∫{e}dt − {Kd}{r}' },
      { name: '타각 포화', tpl: '|{dl}| ≤ 35°' }
    ],

    init(p) {
      return { psi: 0, r: 0, dl: 0, ei: 0, x: 0, y: 0, trail: [], settle: -1 };
    },

    step(st, p, dt) {
      const e = p.psid - st.psi;
      st.ei = clamp(st.ei + e * dt, -400, 400);                    // 적분 (와인드업 제한)
      const cmd = clamp(p.Kp * e + p.Ki * st.ei - p.Kd * st.r, -DMAX, DMAX);
      const dmax = DRATE * dt;                                     // 타기 속도 제한
      st.dl += clamp(cmd - st.dl, -dmax, dmax);

      // 노모토 1차 모델
      st.r += ((K_N * st.dl - st.r) / T_N) * dt + p.dist * dt / T_N * 3;
      st.psi += st.r * dt;

      const rad = st.psi * Math.PI / 180;
      st.x += p.U * Math.cos(rad) * dt;
      st.y += p.U * Math.sin(rad) * dt;
      st.trail.push([st.x, st.y]);
      if (st.trail.length > 900) st.trail.shift();

      if (st.settle < 0 && Math.abs(e) < 1 && Math.abs(st.r) < .3) st.settle = st.t;
      if (Math.abs(e) > 3) st.settle = -1;
    },

    graphs: [
      { title: '침로 – 시간', xmin: 20, window: 40,
        series: [{ key: 'psid', label: '목표 ψd', color: C.psid }, { key: 'psi', label: '실제 ψ', color: C.psi }] },
      { title: '타각 – 시간', xmin: 20, window: 40,
        series: [{ key: 'dl', label: 'δ (°)', color: C.dl }, { key: 'r', label: '선회율 r (°/s)', color: C.Kd }] }
    ],
    sample(st, p) { return { psid: p.psid, psi: st.psi, dl: st.dl, r: st.r }; },

    readouts(st, p) {
      const e = p.psid - st.psi;
      return [
        { label: '현재 침로 ψ', value: st.psi, unit: '°', color: C.psi },
        { label: '목표 침로 ψd', value: p.psid, unit: '°', color: C.psid },
        { label: '침로 오차 e', value: e, unit: '°', color: Math.abs(e) < 1 ? '#34d399' : '#fb7185' },
        { label: '타각 δ', value: st.dl, unit: '°', color: C.dl },
        { label: '선회 각속도 r', value: st.r, unit: '°/s', color: C.Kd },
        { label: '정착 시간', value: st.settle > 0 ? fmt(st.settle, 1) + ' s' : '제어 중…', color: st.settle > 0 ? '#34d399' : '#fbbf24' },
        { label: '항주 거리', value: Math.hypot(st.x, st.y), unit: 'm', dec: 0 },
        { label: '타각 포화', value: Math.abs(st.dl) > DMAX - .5 ? '⚠ 포화 (±35°)' : '정상', color: Math.abs(st.dl) > DMAX - .5 ? '#fb7185' : '#93a2c4' }
      ];
    },

    notes: [
      '<b>Kp만 크게</b> 하면 빨리 돌지만 목표를 지나쳐 좌우로 흔들립니다(오버슈트). 진동공학의 <b>부족감쇠</b>와 똑같습니다.',
      '<b>Kd</b>는 선회율에 제동을 겁니다. 감쇠 역할이라 오버슈트가 줄지만, 과하면 반응이 느려집니다.',
      '외란(바람)을 걸어 보세요. Ki = 0이면 <b>정상상태 오차</b>가 영원히 남습니다. Ki를 조금 올리면 서서히 0으로 수렴합니다.',
      '타각은 물리적으로 <b>±35°</b>를 넘지 못하고 꺾는 속도도 제한됩니다. 아무리 게인을 키워도 성능에는 한계가 있습니다.',
      '이것이 자율운항의 최하위 계층입니다. 그 위에 항로 추종(LOS), 그 위에 충돌 회피(COLREG)가 얹힙니다.'
    ],
    presets: [
      { name: '기본 (PD 제어)', set: { Kp: 1.6, Kd: 4, Ki: 0, dist: 0 } },
      { name: 'Kp 과대 → 진동', set: { Kp: 6, Kd: 0, Ki: 0 } },
      { name: 'Kd 추가 → 안정', set: { Kp: 6, Kd: 10, Ki: 0 } },
      { name: '외란 + Ki 없음', set: { dist: .8, Ki: 0, Kp: 1.6, Kd: 4 } },
      { name: '외란 + PID', set: { dist: .8, Ki: .3, Kp: 1.6, Kd: 4 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const cx = w * .42, cy = h * .48;
      const PPM = 1.5;

      /* ── 바다 ─────────────────────────────── */
      ctx.save();
      ctx.fillStyle = 'rgba(20,52,86,.35)'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(120,180,220,.10)'; ctx.lineWidth = 1;
      const gsz = 60;
      const offx = (-st.x * PPM) % gsz, offy = (st.y * PPM) % gsz;
      ctx.beginPath();
      for (let x = offx - gsz; x < w + gsz; x += gsz) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = offy - gsz; y < h + gsz; y += gsz) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke(); ctx.restore();

      /* ── 항적 ─────────────────────────────── */
      ctx.save();
      ctx.strokeStyle = 'rgba(94,234,212,.5)'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath();
      st.trail.forEach((q, i) => {
        const sx = cx + (q[0] - st.x) * PPM, sy = cy - (q[1] - st.y) * PPM;
        i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
      });
      ctx.stroke(); ctx.restore();

      /* ── 목표 침로 / 현재 침로 방향선 ──────── */
      const rd = p.psid * Math.PI / 180, rp = st.psi * Math.PI / 180;
      D.line(ctx, cx, cy, cx + Math.cos(rd) * 250, cy - Math.sin(rd) * 250,
        { color: C.psid, dash: [7, 6], width: hl === 'psid' ? 2.5 : 1.6, hot: hl === 'psid' });
      D.tag(ctx, '목표 ψd = ' + fmt(p.psid, 0) + '°', cx + Math.cos(rd) * 262, cy - Math.sin(rd) * 262, C.psid, hl === 'psid');

      // 오차 부채꼴
      ctx.save();
      ctx.fillStyle = 'rgba(251,113,133,.14)';
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 96, Math.min(-rd, -rp), Math.max(-rd, -rp));
      ctx.closePath(); ctx.fill(); ctx.restore();
      const em = (p.psid + st.psi) / 2 * Math.PI / 180;
      if (Math.abs(p.psid - st.psi) > 2)
        D.text(ctx, 'e = ' + fmt(p.psid - st.psi, 1) + '°', cx + Math.cos(em) * 116, cy - Math.sin(em) * 116,
          { size: 11, color: '#fb7185', align: 'center', bold: hl === 'e' });

      /* ── 선박 ─────────────────────────────── */
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(-rp);
      // 선체
      ctx.beginPath();
      ctx.moveTo(46, 0); ctx.lineTo(16, -14); ctx.lineTo(-34, -13); ctx.lineTo(-40, 0);
      ctx.lineTo(-34, 13); ctx.lineTo(16, 14); ctx.closePath();
      const sg = ctx.createLinearGradient(0, -14, 0, 14);
      sg.addColorStop(0, '#e6edf9'); sg.addColorStop(1, '#96a5c4');
      ctx.fillStyle = sg; ctx.fill();
      ctx.strokeStyle = '#5b6a8d'; ctx.lineWidth = 1.5; ctx.stroke();
      // 선교
      ctx.fillStyle = '#4d6ba0';
      D.roundRect(ctx, -18, -8, 20, 16, 3); ctx.fill();
      // 타 (선미)
      ctx.save();
      ctx.translate(-40, 0); ctx.rotate(st.dl * Math.PI / 180);
      if (hl === 'dl') { ctx.shadowColor = C.dl; ctx.shadowBlur = 14; }
      ctx.fillStyle = C.dl;
      D.roundRect(ctx, -18, -3, 20, 6, 2); ctx.fill();
      ctx.restore();
      ctx.restore();

      // 침로 화살표
      D.arrow(ctx, cx, cy, Math.cos(rp) * 120, -Math.sin(rp) * 120,
        { color: C.psi, width: 3, hot: hl === 'psi', label: 'ψ = ' + fmt(st.psi, 1) + '°', ly: -16 });

      // 외란 화살표
      if (Math.abs(p.dist) > .01) {
        const dy = p.dist > 0 ? -1 : 1;
        for (let i = 0; i < 3; i++) {
          const yy = 40 + i * 26;
          D.arrow(ctx, w * .06, yy, 70 * Math.sign(p.dist), 0,
            { color: C.dist, width: 2, head: 8, hot: hl === 'dist' });
        }
        D.text(ctx, '외란 ' + fmt(p.dist, 1) + ' °/s', w * .06, 26, { size: 11, color: C.dist, bold: hl === 'dist' });
      }

      /* ── 타각 막대 ────────────────────────── */
      const bx = w - 230, by = h - 74, bw = 200;
      D.text(ctx, '타각 δ (좌 −35° ~ 우 +35°)', bx, by - 10, { size: 11, color: hl === 'dl' ? '#fff' : '#61719a', bold: hl === 'dl' });
      D.roundRect(ctx, bx, by, bw, 14, 5); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
      const zero = bx + bw / 2, len = (st.dl / DMAX) * (bw / 2);
      ctx.save();
      if (hl === 'dl') { ctx.shadowColor = C.dl; ctx.shadowBlur = 12; }
      ctx.fillStyle = C.dl;
      D.roundRect(ctx, len >= 0 ? zero : zero + len, by, Math.abs(len), 14, 4); ctx.fill();
      ctx.restore();
      D.line(ctx, zero, by - 4, zero, by + 18, { color: 'rgba(255,255,255,.35)' });
      D.text(ctx, fmt(st.dl, 1) + '°', bx + bw + 8, by + 12, { size: 12, color: C.dl, bold: true });

      // 게인 요약
      const gx = 18, gy = h - 74;
      D.text(ctx, 'PID 게인', gx, gy - 10, { size: 11, color: '#61719a' });
      [['Kp', p.Kp, C.Kp], ['Ki', p.Ki, C.Ki], ['Kd', p.Kd, C.Kd]].forEach((q, i) => {
        D.text(ctx, q[0] + ' = ' + fmt(q[1], 2), gx, gy + 12 + i * 17,
          { size: 11.5, color: hl === q[0] ? '#fff' : q[2], bold: hl === q[0] });
      });
      if (Math.abs(p.dist) > .01 && p.Ki < .02)
        D.tag(ctx, '외란이 있는데 Ki = 0 → 정상상태 오차가 남습니다', w / 2, h - 16, C.Ki, hl === 'Ki');
      else if (st.settle > 0)
        D.tag(ctx, '침로 유지 중 (정착 ' + fmt(st.settle, 1) + ' s)', w / 2, h - 16, '#34d399', false);
    }
  });
})();
