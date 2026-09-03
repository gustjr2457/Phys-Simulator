/* [항공우주공학] 치올콥스키 로켓 방정식 — Δv = Isp·g₀·ln(m₀/m_f) */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { Isp: '#fbbf24', lam: '#f472b6', TW: '#34d399', dv: '#5eead4', v: '#60a5fa', loss: '#fb7185' };
  const G0 = 9.80665, M0 = 50000;      // 초기 질량 50 t
  const TS = 12;                        // 시간 배속
  const LEO = 9400;                     // 저궤도 진입에 필요한 Δv(중력·항력 손실 포함) 기준선

  const mfOf = p => M0 * (1 - p.lam);
  const dvIdeal = p => p.Isp * G0 * Math.log(M0 / mfOf(p));
  const thrust = p => p.TW * M0 * G0;
  const mdot = p => thrust(p) / (p.Isp * G0);
  const tBurn = p => (M0 - mfOf(p)) / mdot(p);

  PS.register({
    id: 'space-rocket', mode: 'adv', category: '항공우주공학',
    title: '로켓 방정식',
    sub: 'Δv = Isp·g₀·ln(m₀/m_f)',
    tagline: '로켓이 어려운 이유는 ln 때문입니다. 속도를 조금 더 얻으려면 연료는 기하급수적으로 늘어납니다.',

    params: [
      { key: 'Isp', symbol: 'Isp', label: '비추력', unit: 's', min: 200, max: 460, step: 10, value: 300, color: C.Isp, reset: true, dec: 0,
        where: '<b>엔진의 연비</b>입니다. 배기 가스를 얼마나 빠르게 내뿜는지(v_e = Isp·g₀)를 뜻하며, 화염 길이로 표현됩니다. 고체 260, 케로신 300, 수소 450초 수준입니다.' },
      { key: 'lam', symbol: 'λ', label: '추진제 질량비', unit: '', min: .5, max: .95, step: .01, value: .85, color: C.lam, reset: true, dec: 2,
        where: '전체 질량 중 <b>연료가 차지하는 비율</b>입니다. 왼쪽 탱크 게이지가 이만큼 채워지고, 연소하면서 줄어듭니다. 0.9면 로켓의 90%가 연료라는 뜻입니다.' },
      { key: 'TW', symbol: 'T/W', label: '추력 대 중량비', unit: '', min: 1.1, max: 4, step: .1, value: 1.5, color: C.TW, reset: true, dec: 1,
        where: '<b>엔진의 힘</b>입니다. 1보다 커야 이륙합니다. 크면 빨리 태워 <b>중력 손실</b>이 줄지만 기체에 무리가 갑니다.' }
    ],
    vars: {
      dv: { symbol: 'Δv', label: '이상적 속도 증가량', unit: 'm/s', color: C.dv,
        where: '오른쪽 <b>Δv 게이지</b>입니다. 로켓이 낼 수 있는 속도의 총량이며, 목표선(저궤도 9,400 m/s)을 넘어야 궤도에 오릅니다.' },
      m0: { symbol: 'm₀', label: '이륙 질량', unit: 'kg', color: C.lam,
        where: '연료를 가득 채운 <b>출발 질량</b>(50 t 고정)입니다.' },
      mf: { symbol: 'm_f', label: '연소 종료 질량', unit: 'kg', color: C.lam,
        where: '연료를 다 쓴 뒤 남는 <b>빈 로켓 + 화물</b>의 질량입니다. 이 값이 작을수록 ln 안의 비가 커져 Δv가 늘어납니다.' },
      loss: { symbol: 'g₀t_b', label: '중력 손실', unit: 'm/s', color: C.loss,
        where: '수직으로 올라가는 동안 <b>중력이 깎아 먹는 속도</b>입니다. 연소 시간이 길수록 손해라서, 실제 로켓은 일찍 기울여 날아갑니다.' },
      v: { symbol: 'v', label: '현재 속도', unit: 'm/s', color: C.v,
        where: '실제로 얻은 속도입니다. 이상적 Δv에서 중력 손실을 뺀 값에 가깝습니다.' }
    },
    formulas: [
      { name: '치올콥스키 로켓 방정식', tpl: '{dv} = {Isp} · g₀ · ln( {m0} ⁄ {mf} )' },
      { name: '연소 종료 질량', tpl: '{mf} = {m0} · ( 1 − {lam} )' },
      { name: '연소 시간', tpl: 't_b = {Isp} · {lam} ⁄ (T/W)' },
      { name: '중력 손실', tpl: '{loss} = g₀ · t_b' },
      { name: '실제 속도', tpl: '{v} ≈ {dv} − {loss}' }
    ],

    init(p) { return { m: M0, v: 0, alt: 0, burning: true, tb: 0, done: false }; },

    step(st, p, dt) {
      const dtp = dt * TS;
      if (st.burning) {
        const md = mdot(p);
        st.m = Math.max(mfOf(p), st.m - md * dtp);
        const a = thrust(p) / st.m - G0;
        st.v += a * dtp;
        st.tb += dtp;
        if (st.m <= mfOf(p) + 1e-6) st.burning = false;
      } else {
        st.v -= G0 * dtp;
      }
      st.alt = Math.max(0, st.alt + st.v * dtp);
      if (!st.burning && st.v < 0 && st.alt <= 0) st.done = true;
    },

    graphs: [
      { title: '속도 – 시간', xmin: 10, window: 30, y0: 0,
        series: [{ key: 'v', label: '실제 v (m/s)', color: C.v }, { key: 'dvi', label: '이상적 Δv', color: C.dv }] },
      { title: '질량 – 시간', xmin: 10, window: 30, y0: 0, series: [{ key: 'm', label: '질량 (t)', color: C.lam }] }
    ],
    sample(st, p) { return { v: st.v, dvi: dvIdeal(p), m: st.m / 1000 }; },

    readouts(st, p) {
      const dv = dvIdeal(p), tb = tBurn(p), loss = G0 * tb;
      return [
        { label: '이상적 Δv', value: dv, unit: 'm/s', color: C.dv, dec: 0 },
        { label: '중력 손실', value: loss, unit: 'm/s', color: C.loss, dec: 0 },
        { label: '실제 도달 Δv', value: dv - loss, unit: 'm/s', dec: 0 },
        { label: '질량비 m₀/m_f', value: M0 / mfOf(p), unit: '배', color: C.lam },
        { label: '연소 시간 t_b', value: tb, unit: 's', dec: 0 },
        { label: '배기 속도 Isp·g₀', value: p.Isp * G0, unit: 'm/s', color: C.Isp, dec: 0 },
        { label: '현재 속도', value: st.v, unit: 'm/s', color: C.v, dec: 0 },
        { label: '현재 고도', value: st.alt / 1000, unit: 'km' },
        { label: '저궤도(9,400 m/s) 달성', wide: true, color: dv - loss >= LEO ? '#34d399' : '#fb7185',
          value: dv - loss >= LEO ? '✔ 궤도 진입 가능' : '✘ 부족 — ' + fmt(LEO - (dv - loss), 0) + ' m/s 모자람' }
      ];
    },

    notes: [
      'Δv는 <b>ln(질량비)</b>에 비례합니다. Δv를 2배로 하려면 질량비를 <b>제곱</b>해야 합니다 — 로켓이 거대해지는 이유입니다.',
      '질량비 0.9(연료 90%)로도 Δv는 Isp·g₀의 <b>2.3배</b>밖에 안 됩니다. 그래서 <b>다단 로켓</b>이 필요합니다.',
      'Isp를 올리는 것이 가장 효율적입니다. 액체수소 엔진(450 s)이 고체(260 s)보다 훨씬 유리합니다.',
      'T/W가 작으면 오래 태우게 되어 <b>중력 손실</b>이 커집니다. 반대로 너무 크면 구조와 공기 저항에 불리합니다.',
      'λ = 0.95, Isp = 450으로 맞춰 보세요. 그래도 단 하나로 궤도에 오르기가 얼마나 빠듯한지 보입니다.'
    ],
    presets: [
      { name: '케로신 1단 (Isp 300)', set: { Isp: 300, lam: .85, TW: 1.5 } },
      { name: '액체수소 (Isp 450)', set: { Isp: 450, lam: .85, TW: 1.4 } },
      { name: '고체 부스터 (Isp 260)', set: { Isp: 260, lam: .85, TW: 2.5 } },
      { name: '연료를 극한까지 (λ=0.95)', set: { lam: .95, Isp: 450 } },
      { name: '추력 부족 (T/W 1.1)', set: { TW: 1.1 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const dv = dvIdeal(p), tb = tBurn(p), loss = G0 * tb;
      const frac = (st.m - mfOf(p)) / (M0 - mfOf(p));       // 남은 추진제 비율

      // 하늘 (고도에 따라 어두워짐)
      const dark = clamp(st.alt / 100000, 0, 1);
      ctx.save();
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, 'rgba(6,10,22,1)');
      sky.addColorStop(1, 'rgba(' + Math.round(20 + 30 * (1 - dark)) + ',' + Math.round(40 + 60 * (1 - dark)) + ',' + Math.round(80 + 60 * (1 - dark)) + ',.55)');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      ctx.restore();
      for (let i = 0; i < 50; i++) {
        ctx.save(); ctx.globalAlpha = dark * (.2 + (i % 5) * .1); ctx.fillStyle = '#fff';
        ctx.fillRect((i * 163.7) % w, (i * 91.3) % (h * .8), 1.4, 1.4); ctx.restore();
      }

      /* ── 로켓 ─────────────────────────────── */
      const cx = w * .30, gy = h * .82;
      const climb = clamp(st.alt / 400, 0, h * .45);
      const ry = gy - climb;
      const RH = 118, RW = 26;

      // 지면 + 고도 눈금
      D.ground(ctx, 0, w, gy, 0);
      for (let i = 1; i <= 6; i++) {
        const kmY = gy - (i * 20000) / 400;
        if (kmY > 20 && st.alt > 4000) {
          D.line(ctx, cx - 120, kmY, cx + 120, kmY, { color: 'rgba(147,162,196,.12)', dash: [4, 6] });
          D.text(ctx, (i * 20) + ' km', cx + 124, kmY + 4, { size: 9.5, color: '#4a5878' });
        }
      }

      // 화염 (Isp가 클수록 길고 밝게)
      if (st.burning) {
        const fl = (28 + p.Isp * .16) * (.85 + .3 * Math.random()) * p.TW * .7;
        ctx.save();
        const fg = ctx.createLinearGradient(0, ry + RH / 2, 0, ry + RH / 2 + fl);
        fg.addColorStop(0, 'rgba(255,255,220,.95)');
        fg.addColorStop(.35, 'rgba(255,180,60,.8)');
        fg.addColorStop(1, 'rgba(251,113,133,0)');
        ctx.fillStyle = fg;
        if (hl === 'Isp') { ctx.shadowColor = C.Isp; ctx.shadowBlur = 24; }
        ctx.beginPath();
        ctx.moveTo(cx - RW * .42, ry + RH / 2);
        ctx.quadraticCurveTo(cx, ry + RH / 2 + fl * 1.15, cx + RW * .42, ry + RH / 2);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        D.text(ctx, 'v_e = ' + fmt(p.Isp * G0, 0) + ' m/s', cx + 40, ry + RH / 2 + 40,
          { size: 10.5, color: C.Isp, bold: hl === 'Isp' });
      }

      // 동체
      ctx.save();
      if (hl === 'lam') { ctx.shadowColor = C.lam; ctx.shadowBlur = 18; }
      ctx.beginPath();
      ctx.moveTo(cx, ry - RH / 2 - 26);
      ctx.lineTo(cx + RW / 2, ry - RH / 2 + 10);
      ctx.lineTo(cx + RW / 2, ry + RH / 2);
      ctx.lineTo(cx - RW / 2, ry + RH / 2);
      ctx.lineTo(cx - RW / 2, ry - RH / 2 + 10);
      ctx.closePath();
      ctx.fillStyle = '#dbe4f6'; ctx.fill();
      ctx.restore();
      // 탱크 안 추진제
      ctx.save();
      ctx.fillStyle = C.lam; ctx.globalAlpha = .85;
      const th = (RH - 26) * frac;
      ctx.fillRect(cx - RW / 2 + 3, ry + RH / 2 - 8 - th, RW - 6, th);
      ctx.restore();
      // 핀
      ctx.fillStyle = '#8794b5';
      ctx.beginPath(); ctx.moveTo(cx - RW / 2, ry + RH / 2 - 22); ctx.lineTo(cx - RW / 2 - 14, ry + RH / 2 + 6); ctx.lineTo(cx - RW / 2, ry + RH / 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + RW / 2, ry + RH / 2 - 22); ctx.lineTo(cx + RW / 2 + 14, ry + RH / 2 + 6); ctx.lineTo(cx + RW / 2, ry + RH / 2); ctx.fill();

      D.tag(ctx, st.burning ? '연소 중  ' + fmt(frac * 100, 0) + '%' : '연소 종료', cx, ry - RH / 2 - 44,
        st.burning ? C.TW : '#61719a', hl === 'lam' || hl === 'TW');

      /* ── 질량 게이지 ──────────────────────── */
      const mx = 28, my = h * .30, mw = 46, mh = h * .42;
      D.text(ctx, '질량', mx + mw / 2, my - 24, { size: 11, color: '#61719a', align: 'center' });
      D.roundRect(ctx, mx, my, mw, mh, 6); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
      const dryH = mh * (mfOf(p) / M0);
      ctx.save();
      ctx.fillStyle = '#8794b5'; ctx.fillRect(mx, my + mh - dryH, mw, dryH);
      if (hl === 'lam') { ctx.shadowColor = C.lam; ctx.shadowBlur = 16; }
      ctx.fillStyle = C.lam;
      const propH = (mh - dryH) * frac;
      ctx.fillRect(mx, my + mh - dryH - propH, mw, propH);
      ctx.restore();
      D.text(ctx, '추진제', mx + mw + 8, my + mh - dryH - (mh - dryH) / 2, { size: 10, color: C.lam, bold: hl === 'lam' });
      D.text(ctx, '빈 기체 m_f', mx + mw + 8, my + mh - dryH / 2 + 4, { size: 10, color: '#93a2c4' });
      D.text(ctx, fmt(st.m / 1000, 1) + ' t', mx + mw / 2, my + mh + 18, { size: 12, color: '#e8eefc', align: 'center', bold: true });
      D.text(ctx, 'm₀/m_f = ' + fmt(M0 / mfOf(p), 2), mx, my + mh + 36, { size: 10.5, color: C.lam });

      /* ── Δv 게이지 ────────────────────────── */
      const gx = w * .58, gyy = h * .22, gw = Math.min(300, w - gx - 40), gh = 18;
      const MAXDV = 13000;
      D.text(ctx, 'Δv 예산', gx, gyy - 12, { size: 12, color: hl === 'dv' ? '#fff' : '#93a2c4', bold: hl === 'dv' });
      D.bar(ctx, gx, gyy, gw, gh, dv, MAXDV, C.dv, null, hl === 'dv' || hl === 'Isp' || hl === 'lam');
      D.text(ctx, '이상적 Δv  ' + fmt(dv, 0) + ' m/s', gx, gyy + gh + 16, { size: 11, color: C.dv });
      D.bar(ctx, gx, gyy + 30, gw, 12, loss, MAXDV, C.loss, null, hl === 'loss');
      D.text(ctx, '중력 손실  −' + fmt(loss, 0) + ' m/s', gx, gyy + 58, { size: 11, color: C.loss, bold: hl === 'loss' });
      D.bar(ctx, gx, gyy + 72, gw, 14, Math.max(0, dv - loss), MAXDV, '#e8eefc', null, false);
      D.text(ctx, '실제  ' + fmt(dv - loss, 0) + ' m/s', gx, gyy + 102, { size: 12, color: '#e8eefc', bold: true });

      // 저궤도 목표선
      const lx = gx + gw * (LEO / MAXDV);
      D.line(ctx, lx, gyy - 6, lx, gyy + 92, { color: '#34d399', dash: [4, 4], width: 2 });
      D.text(ctx, '저궤도 9,400', lx + 5, gyy - 10, { size: 10, color: '#34d399' });

      // 현재 속도
      D.text(ctx, '현재 속도 ' + fmt(st.v, 0) + ' m/s   고도 ' + fmt(st.alt / 1000, 1) + ' km',
        gx, gyy + 138, { size: 12, color: hl === 'v' ? '#fff' : C.v, bold: hl === 'v' });
      D.text(ctx, '시간 배속 ×' + TS + ' · 연소 시간 ' + fmt(tb, 0) + ' s', gx, gyy + 158, { size: 10.5, color: '#4a5878' });

      if (st.done) D.tag(ctx, '추락 — Δv가 부족했습니다. ↺ 처음으로', w / 2, 26, '#fb7185', true);
    }
  });
})();
