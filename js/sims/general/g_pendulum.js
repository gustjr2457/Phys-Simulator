/* 단진자와 주기 — T = 2π√(L/g) (작은 각),  큰 각 보정 T ≈ 2π√(L/g)(1 + θ₀²/16)
   실제 추는 근사 없는 운동 방정식 θ'' = −(g/L) sin θ 를 RK4 로 적분해 움직인다.
   흐린 추는 "작은 각 공식"이 말하는 대로 θ₀cos(2πt/T) 로 움직인다 — 둘이 언제 어긋나는지가 이 화면의 핵심.
   주기는 공식에서 가져오지 않고, 추가 오른쪽 끝으로 돌아온 순간들을 실제로 재서 보여 준다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp, PAL = PS.PAL;
  const C = { L: PAL.steel, th: PAL.violet, g: PAL.amber, T: PAL.dusty, Tb: PAL.sage, v: PAL.teal, t: PAL.ink2 };
  const RAD = Math.PI / 180;

  const Tsmall = p => 2 * Math.PI * Math.sqrt(p.L / p.g);
  const Tcorr = p => { const a = p.th * RAD; return Tsmall(p) * (1 + a * a / 16); };
  const acc = (th, p) => -(p.g / p.L) * Math.sin(th);

  PS.register({
    id: 'g-pendulum', mode: 'general', category: '역학과 진동',
    title: '단진자와 주기',
    sub: 'T = 2π√(L ⁄ g)',
    tagline: '줄에 매단 추가 한 번 왕복하는 시간을 직접 재 봅니다. 줄 길이·중력·처음 각도 중 무엇이 주기를 바꾸는지 찾아보세요.',

    params: [
      { key: 'L', symbol: 'L', label: '줄 길이', unit: 'm', min: .2, max: 4, step: .05, value: 1, color: C.L, reset: true, dec: 2,
        where: '천장에서 추까지 이어진 <b>파란 줄</b>입니다. 길수록 추가 더 먼 길을 돌아오므로 왕복이 느려집니다.' },
      { key: 'th', symbol: 'θ₀', label: '처음 각도', unit: '°', min: 5, max: 80, step: 1, value: 20, color: C.th, reset: true, dec: 0,
        where: '추를 놓기 전에 당긴 각도 — <b>보라색 점선 호</b>의 양 끝입니다. 작을 때는 주기를 거의 바꾸지 않습니다.' },
      { key: 'g', symbol: 'g', label: '중력 가속도', unit: 'm/s²', min: 1.6, max: 25, step: .1, value: 9.8, color: C.g, reset: true, dec: 1,
        where: '추에 붙은 <b>주황색 아래 화살표</b>입니다. 세게 당길수록 빨리 되돌아옵니다 — 지구 9.8, 달 1.6, 목성 24.8 m/s².' }
    ],
    vars: {
      T: { symbol: 'T', label: '주기(작은 각 공식)', unit: 's', color: C.T,
        where: '한 번 왕복하는 시간을 공식으로 계산한 값입니다. 화면의 <b>흐린 분홍 추</b>가 정확히 이 주기로 흔들립니다.' },
      Tb: { symbol: 'T′', label: '주기(큰 각 보정)', unit: 's', color: C.Tb,
        where: '각도가 클 때 고친 공식입니다. θ₀ 는 라디안(1 rad ≈ 57°)으로 넣습니다. 측정값의 <b>"잰 주기"</b>와 비교해 보세요.' },
      tg: { symbol: 'θ', label: '흐린 추의 각도', unit: '°', color: C.T,
        where: '<b>흐린 분홍 추</b>가 연직선에서 벌어진 각도입니다. 실제 추(흰 추)와 처음엔 같이 가다가 각이 크면 점점 앞서 갑니다.' },
      t: { symbol: 't', label: '시간', unit: 's', color: C.t,
        where: '추를 놓은 뒤 흐른 시간입니다. 화면 왼쪽 위의 <b>왕복 횟수와 잰 주기</b>가 이 시간을 세어 만든 값입니다.' }
    },
    formulas: [
      { name: '주기 — 작은 각일 때', tpl: '{T} = 2π√( {L} ⁄ {g} )' },
      { name: '큰 각 보정', tpl: '{Tb} ≈ {T} (1 + {th}² ⁄ 16)' },
      { name: '작은 각 공식대로 움직이면 (흐린 추)', tpl: '{tg} = {th} cos(2π{t} ⁄ {T})' }
    ],

    init(p) {
      return { th: p.th * RAD, w: 0, vmax: 0, n: 0, lastCross: 0, ghost: p.th * RAD };
    },

    step(st, p, dt) {
      // 근사 없는 운동 방정식을 RK4 로 — 짧은 스텝으로 나눠 적분 (에너지 오차를 무시할 만큼 작게)
      const ns = Math.max(1, Math.ceil(dt / .002)), hh = dt / ns;
      let t = st.t;
      for (let i = 0; i < ns; i++) {
        const th = st.th, w = st.w;
        const k1t = w, k1w = acc(th, p);
        const k2t = w + .5 * hh * k1w, k2w = acc(th + .5 * hh * k1t, p);
        const k3t = w + .5 * hh * k2w, k3w = acc(th + .5 * hh * k2t, p);
        const k4t = w + hh * k3w, k4w = acc(th + hh * k3t, p);
        st.th = th + hh / 6 * (k1t + 2 * k2t + 2 * k3t + k4t);
        st.w = w + hh / 6 * (k1w + 2 * k2w + 2 * k3w + k4w);
        // 오른쪽 끝으로 돌아온 순간(각속도가 + → − 로 바뀜) = 한 번 왕복. 그 시각을 선형 보간으로 잡는다
        if (w > 0 && st.w <= 0) { st.n++; st.lastCross = t + hh * w / (w - st.w); }
        t += hh;
        const v = Math.abs(st.w) * p.L;
        if (v > st.vmax) st.vmax = v;
      }
      // 흐린 추 — 작은 각 공식의 해. 앱은 step 뒤에 st.t 를 늘리므로 st.t + dt 시각의 값
      st.ghost = p.th * RAD * Math.cos(2 * Math.PI * (st.t + dt) / Tsmall(p));
    },

    graphs: [{
      title: '각도 – 시간 (흰 선: 실제, 분홍 선: 작은 각 공식)', xmin: 8, window: 10,
      series: [{ key: 'a', label: '실제 θ (°)', color: PAL.ink }, { key: 'b', label: '공식 θ (°)', color: C.T }]
    }],
    sample(st) { return { a: st.th / RAD, b: st.ghost / RAD }; },

    readouts(st, p) {
      const Ts = Tsmall(p), meas = st.n ? st.lastCross / st.n : null;
      return [
        { label: '현재 각도 θ', value: st.th / RAD, unit: '°', dec: 1, color: PAL.ink },
        { label: '추의 속력 v', value: Math.abs(st.w) * p.L, unit: 'm/s', dec: 2, color: C.v },
        { label: '가장 빠를 때 속력', value: st.vmax, unit: 'm/s', dec: 2, color: C.v },
        { label: '왕복 횟수', value: st.n, unit: '번', dec: 0, color: C.t },
        { label: '작은 각 공식 T', value: Ts, unit: 's', dec: 3, color: C.T },
        { label: '큰 각 보정 T′', value: Tcorr(p), unit: 's', dec: 3, color: C.Tb },
        { label: '잰 주기', value: meas === null ? '한 번 왕복하면 표시' : meas, unit: meas === null ? '' : 's', dec: 3, color: C.Tb },
        { label: '공식과 비교', wide: true, color: meas === null ? C.t : (meas / Ts - 1 > .02 ? PAL.amber : C.Tb),
          value: meas === null ? '추가 오른쪽 끝으로 돌아오면 비교합니다'
            : '잰 주기가 작은 각 공식보다 ' + fmt((meas / Ts - 1) * 100, 1) + ' % 길다' + (meas / Ts - 1 < .01 ? ' — 거의 같다' : '') }
      ];
    },

    notes: [
      '그네는 세게 밀든 살살 밀든 <b>한 번 왕복하는 시간이 거의 같습니다</b>. 갈릴레이가 성당의 흔들리는 등을 보고 처음 알아챘습니다(등시성).',
      '주기는 <b>줄 길이와 중력</b>으로만 정해지고, 추의 무게와는 상관없습니다. 줄을 4배로 늘리면 주기는 2배가 됩니다.',
      '처음 각도가 크면(약 30° 넘게) 공식보다 <b>조금씩 더 오래</b> 걸립니다. 흐린 추가 실제 추보다 앞서 가는 것으로 볼 수 있습니다.',
      '길이 1 m 진자는 지구에서 약 2초에 한 번 왕복합니다. 그래서 진자시계는 줄 길이를 조절해 시간을 맞춥니다.',
      '달에서는 g 가 지구의 약 1/6이라 같은 진자가 <b>약 2.5배 느리게</b> 흔들립니다(√6 ≈ 2.45).'
    ],
    presets: [
      { name: '1 m · 20° (지구)', set: { L: 1, th: 20, g: 9.8 } },
      { name: '줄 4배 (4 m) — 주기 2배', set: { L: 4, th: 20, g: 9.8 } },
      { name: '달에서 (g = 1.6)', set: { L: 1, th: 20, g: 1.6 } },
      { name: '크게 당겨서 (80°)', set: { L: 1, th: 80, g: 9.8 } }
    ],
    challenges: [
      {
        id: 'three', title: '3초 진자 만들기',
        desc: '지구 중력(g = 9.8)에서 잰 주기가 2.95 ~ 3.05 초인 진자를 만들어 한 번 왕복시켜 보세요.',
        hint: '주기는 줄 길이의 제곱근에 비례합니다. 1 m 가 약 2초이니, 3초는 (3/2)² 배 — 2 m 조금 넘게.',
        check: ({ P, st }) => Math.abs(P.g - 9.8) < .05 && st.n >= 1 && Math.abs(st.lastCross / st.n - 3) <= .05
      },
      {
        id: 'big', title: '공식보다 10 % 느린 진자',
        desc: '잰 주기가 작은 각 공식 2π√(L/g) 보다 10 % 이상 길어지게 해 보세요.',
        hint: '줄 길이나 중력은 공식과 실제를 같이 바꿉니다. 둘을 어긋나게 하는 것은 처음 각도뿐입니다.',
        check: ({ P, st }) => st.n >= 1 && st.lastCross / st.n >= 1.1 * Tsmall(P)
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl, narrow = w < 600;
      const a0 = p.th * RAD;
      const px = w / 2, py = narrow ? 64 : 70;
      const br = narrow ? 11 : 14;
      // 줄 길이(화면 px) — 아래 여백과 좌우 폭 중 좁은 쪽에 맞춘다. 1.2 m 까지는 실제 길이 비율이 보이게 같은 축척.
      const Lmax = Math.min(h - py - br - 44, (w / 2 - 34) / Math.sin(Math.max(a0, 30 * RAD)));
      const R = Lmax * Math.min(1, p.L / 1.2);
      const pos = th => [px + R * Math.sin(th), py + R * Math.cos(th)];

      // 천장
      ctx.save(); ctx.fillStyle = 'rgba(167,170,176,.18)'; ctx.fillRect(px - 70, py - 10, 140, 10); ctx.restore();
      D.line(ctx, px - 70, py, px + 70, py, { color: 'rgba(167,170,176,.55)', width: 2 });
      for (let i = 0; i < 9; i++) D.line(ctx, px - 66 + i * 16, py - 10, px - 58 + i * 16, py, { color: 'rgba(167,170,176,.3)' });

      // 연직선 · 처음 각도의 호 (양 끝 = 추가 되돌아오는 자리)
      D.line(ctx, px, py, px, py + R + br + 10, { color: 'rgba(167,170,176,.25)', dash: [4, 6] });
      const hotTh = hl === 'th';
      ctx.save(); ctx.strokeStyle = C.th; ctx.lineWidth = hotTh ? 2.6 : 1.5; ctx.setLineDash([4, 5]);
      if (hotTh) { ctx.shadowColor = C.th; ctx.shadowBlur = 12; }
      ctx.beginPath(); ctx.arc(px, py, R, Math.PI / 2 - a0, Math.PI / 2 + a0); ctx.stroke(); ctx.restore();
      const [ex, ey] = pos(a0);
      D.text(ctx, 'θ₀ = ' + fmt(p.th, 0) + '°', ex + br + 12, ey + 4, { size: 11, color: C.th, bold: hotTh });

      // 지금 각도 부채꼴 (천장 아래)
      const ar = Math.min(34, R * .3);
      if (Math.abs(st.th) > .01) {
        ctx.save(); ctx.fillStyle = 'rgba(230,231,234,.10)'; ctx.strokeStyle = 'rgba(230,231,234,.45)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, ar, Math.PI / 2, Math.PI / 2 - st.th, st.th > 0);
        ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }

      // 흐린 추 — 작은 각 공식대로라면 이 자리에 있어야 한다
      const hotG = hl === 'T' || hl === 'tg';
      const [gx, gy] = pos(st.ghost);
      D.line(ctx, px, py, gx, gy, { color: 'rgba(192,128,152,' + (hotG ? .8 : .4) + ')', width: 1.5, dash: [5, 4], hot: hotG });
      ctx.save(); ctx.strokeStyle = C.T; ctx.globalAlpha = hotG ? 1 : .6; ctx.lineWidth = hotG ? 2.5 : 1.8;
      if (hotG) { ctx.shadowColor = C.T; ctx.shadowBlur = 12; }
      ctx.beginPath(); ctx.arc(gx, gy, br, 0, 7); ctx.stroke(); ctx.restore();

      // 실제 추 — 줄과 추
      const [bx, by] = pos(st.th);
      const hotL = hl === 'L';
      D.line(ctx, px, py, bx, by, { color: C.L, width: hotL ? 3.4 : 2.2, hot: hotL });
      D.dot(ctx, px, py, 4, PAL.ink2);
      ctx.save(); const gr = ctx.createRadialGradient(bx - br * .35, by - br * .35, 2, bx, by, br);
      gr.addColorStop(0, '#f2f3f5'); gr.addColorStop(1, '#8f939c'); ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(bx, by, br, 0, 7); ctx.fill(); ctx.restore();
      // 줄 길이 라벨 — 줄 가운데에서 줄에 수직으로, 연직선 반대편(위쪽 바깥)으로 띄운다
      // (처음엔 가로로만 40px 띄웠더니 80° 에서 줄이 거의 눕자 라벨이 추 위에 얹혔다)
      const side = st.th >= 0 ? 1 : -1, off = 26;
      D.tag(ctx, 'L = ' + fmt(p.L, 2) + ' m', (px + bx) / 2 + side * off * Math.cos(st.th),
        (py + by) / 2 - side * off * Math.sin(st.th), C.L, hotL);

      // 중력(아래) · 속도(줄에 수직, 원의 접선)
      const gl = clamp(p.g / 9.8 * 34, 10, 72);
      D.arrow(ctx, bx, by + br, 0, gl, { color: C.g, width: 2.4, head: 9, hot: hl === 'g', label: 'g', lx: -14, ly: 0 });
      const vm = Math.sqrt(2 * p.g * p.L * (1 - Math.cos(a0))) || 1;
      const vl = clamp(Math.min(w, h) * .16, 36, 90) * (st.w * p.L) / vm;
      // 양 끝(되돌아오는 순간)에서는 속력이 0 — 짧은 화살표와 라벨이 추 위에 뭉치지 않게 숨긴다
      // (안내 글은 줄이 지나가지 않는 바깥쪽 — 연직선 반대편 — 에 둔다)
      if (Math.abs(vl) > 22)
        D.arrow(ctx, bx, by, vl * Math.cos(st.th), -vl * Math.sin(st.th),
          { color: C.v, width: 2.4, head: 9, label: 'v', ly: -14 });
      else D.text(ctx, '끝 지점: 거의 멈춤', bx + side * (br + 4), by - br - 6,
        { size: narrow ? 11 : 11.5, color: C.v, align: side > 0 ? 'left' : 'right' });

      // 잰 주기와 공식 — 왼쪽 위 (폰에서는 두 줄로 쌓는다)
      const Ts = Tsmall(p), meas = st.n ? st.lastCross / st.n : null;
      const fs = narrow ? 11 : 12.5, x0 = 14;
      D.text(ctx, meas === null ? '잰 주기: 오른쪽 끝으로 돌아오면 표시' : '잰 주기 ' + fmt(meas, 2) + ' s  (왕복 ' + st.n + '번)',
        x0, 22, { size: fs, color: C.Tb, bold: hl === 'Tb' || hl === 't' });
      D.text(ctx, '공식 2π√(L/g) = ' + fmt(Ts, 2) + ' s', narrow ? x0 : w - 14, narrow ? 40 : 22,
        { size: fs, color: C.T, align: narrow ? 'left' : 'right', bold: hotG });
      // 범례 — 아래
      D.text(ctx, '흰 추: 실제   ·   흐린 분홍 추: 공식대로라면', w / 2, h - 12,
        { size: narrow ? 10 : 11, color: PAL.ink2, align: 'center' });
    }
  });
})();
