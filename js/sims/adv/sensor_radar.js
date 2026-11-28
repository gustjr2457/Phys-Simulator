/* [공학응용·센서와 계측] 레이더: 메아리로 거리와 속도 재기 — R = cΔt/2, P_r = P_t G² λ² σ/((4π)³R⁴), f_d = 2v/λ
   펄스를 쏘고 표적에 맞고 돌아온 메아리의 왕복 시간으로 거리를 잰다. 반사 신호는 가면서 R², 오면서 R² 로 퍼져 R⁴ 에 반비례하고,
   받은 세기가 수신기 감도 P_min 보다 크면 탐지된다. 다가오는 표적의 메아리는 왕복 도플러로 진동수가 2v/λ 만큼 높아진다.
   상수: f = 3 GHz(S밴드, λ ≈ 0.1 m), 안테나 이득 G = 1000(30 dB), 수신기 감도 P_min = 10⁻¹⁴ W, 펄스 반복 주기 1.5 ms.
   화면은 느린 화면이다(화면 1초 = 실제 0.5 ms). 이 동안 표적은 1 m 도 움직이지 않으므로 표적 위치는 고정해 그린다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp, PAL = PS.PAL;
  const C = { R: PAL.steel, v: PAL.violet, sig: PAL.dusty, Pt: PAL.burnt, dt: PAL.teal, Pr: PAL.amber, Rmax: PAL.rust, fd: PAL.sage };

  const CL = 299792458, F = 3e9, LAM = CL / F, G = 1000, PMIN = 1e-14;
  const SLOW = .5e-3;                 // 화면 1초 = 실제 0.5 ms
  const PRI = 3;                      // 펄스 반복 주기 (화면 3초 = 실제 1.5 ms)
  const XKM = 220;                    // 화면 가로축 끝 (km)
  const FP = 4 * Math.PI;

  const kOf = p => p.Pt * 1e3 * G * G * LAM * LAM * p.sig / (FP * FP * FP);      // P_r·R⁴ (W·m⁴)
  const prOf = p => kOf(p) / Math.pow(p.R * 1e3, 4);                                // 받은 세기 (W)
  const rmaxOf = p => Math.pow(kOf(p) / PMIN, .25) / 1e3;                           // 탐지 한계 거리 (km)
  const dtOf = p => 2 * p.R * 1e3 / CL * 1e6;                                       // 왕복 시간 (µs)
  const fdOf = p => 2 * p.v / LAM / 1e3;                                            // 도플러 이동 (kHz)
  const dbOf = p => 10 * Math.log10(prOf(p) / PMIN);                                // 탐지 기준보다 몇 dB
  const seen = p => prOf(p) >= PMIN;
  const decOf = v => v >= 100 ? 0 : v >= 1 ? 2 : v >= .01 ? 4 : 6;
  const frac = x => x - Math.floor(x);

  PS.register({
    id: 'adv-radar', mode: 'adv', category: '센서와 계측',
    title: '레이더: 메아리로 거리와 속도 재기',
    sub: 'R = cΔt/2,  P_r ∝ 1/R⁴,  f_d = 2v/λ',
    tagline: '전파를 쏘고 비행기에 맞고 돌아온 메아리로 거리와 속도를 잽니다. 멀어질수록 메아리가 거리의 네제곱으로 약해져 어디까지 보이는지 확인합니다.',

    params: [
      { key: 'R', symbol: 'R', label: '표적까지 거리', unit: 'km', min: 5, max: 200, step: 1, value: 60, color: C.R, dec: 0,
        where: '위 그림에서 레이더 안테나부터 <b>비행기</b>까지의 파란 치수선입니다. 아래 받은 신호 그림의 메아리 봉우리도 같은 가로 위치에 섭니다.' },
      { key: 'v', symbol: 'v', label: '다가오는 속도 (음수면 멀어짐)', unit: 'm/s', min: -300, max: 300, step: 10, value: 100, color: C.v, dec: 0,
        where: '비행기에 붙은 <b>보라색 화살표</b>입니다. 레이더 쪽(왼쪽)을 향하면 다가오는 것이고, 메아리의 진동수가 높아집니다.' },
      { key: 'sig', symbol: 'σ', label: '반사 면적 (레이더 단면적)', unit: 'm²', min: .1, max: 50, step: .1, value: 2, color: C.sig, dec: 1,
        where: '비행기가 전파를 되돌려 보내는 정도이며 <b>분홍 비행기</b> 크기로 그렸습니다. 작은 드론은 약 0.1, 전투기 2~5, 여객기 20 이상입니다.' },
      { key: 'Pt', symbol: 'P_t', label: '레이더 송신 출력', unit: 'kW', min: 10, max: 2000, step: 10, value: 100, color: C.Pt, dec: 0,
        where: '안테나에서 나가는 <b>청록 전파 펄스</b>의 세기입니다. 클수록 메아리도 커지고 빨간 탐지 한계선이 오른쪽으로 갑니다.' }
    ],
    vars: {
      dt: { symbol: 'Δt', label: '왕복 시간', unit: 'µs', color: C.dt,
        where: '펄스가 나가서 메아리가 돌아올 때까지 걸린 시간입니다. 아래 <b>받은 신호 그림</b>의 가로축이 이 시간이고, 메아리 봉우리 위에 적힙니다.' },
      Pr: { symbol: 'P_r', label: '돌아온 메아리 세기', unit: 'fW', color: C.Pr,
        where: '아래 받은 신호 그림에서 <b>노란 메아리 봉우리</b>의 높이입니다. 점선(탐지 기준)보다 높아야 비행기를 찾았다고 봅니다. 1 fW 는 10¹⁵분의 1 W 입니다.' },
      Rmax: { symbol: 'R_max', label: '탐지 가능한 최대 거리', unit: 'km', color: C.Rmax,
        where: '위 그림의 <b>빨간 세로 점선</b>입니다. 이보다 먼 표적은 메아리가 탐지 기준보다 약해 보이지 않습니다.' },
      fd: { symbol: 'f_d', label: '도플러 이동 (메아리 진동수 변화)', unit: 'kHz', color: C.fd,
        where: '비행기 위의 <b>초록 글자</b>입니다. 다가오면 +, 멀어지면 − 입니다. 3 GHz 전파에서 1 m/s 마다 약 20 Hz 씩 변합니다.' }
    },
    formulas: [
      { name: '거리 = 빛의 속도 × 왕복 시간 ÷ 2', tpl: '{R} = c · {dt} ⁄ 2' },
      { name: '레이더 방정식 (메아리 세기)', tpl: '{Pr} = {Pt} · G² · λ² · {sig} ⁄ ( (4π)³ · {R}⁴ )' },
      { name: '탐지 가능한 최대 거리', tpl: '{Rmax} = ( {Pt} · G² · λ² · {sig} ⁄ ( (4π)³ · P_min ) )^(1⁄4)' },
      { name: '도플러 이동 (왕복이라 2배)', tpl: '{fd} = 2{v} ⁄ λ' }
    ],

    init() { return { clk: 0, sw: 0 }; },
    step(st, p, dt) {
      st.clk += dt;                                              // 화면 시간 — 실제 시간은 × 0.5 ms
      st.sw += dt / 6; if (st.sw >= 1) st.sw -= 1;               // 그래프: 6초마다 거리 5→200 km 를 훑는다
    },

    graphs: [
      { title: '거리에 따른 메아리 세기 (0 dB 아래면 놓침)', xKey: 'rr', now: 'R', xUnit: 'km', xMin: 5, xMax: 200,
        series: [{ key: 'db', now: 'dbnow', label: '메아리 ÷ 탐지 기준 (dB)', color: C.Pr }, { key: 'zero', label: '탐지 기준 0 dB', color: PAL.ink3 }] }
    ],
    sample(st, p) {
      const rr = 5 + 195 * st.sw;
      return { rr, db: 10 * Math.log10(kOf(p) / Math.pow(rr * 1e3, 4) / PMIN), zero: 0, R: p.R, dbnow: dbOf(p) };
    },

    readouts(st, p) {
      const pr = prOf(p) * 1e15, rm = rmaxOf(p), db = dbOf(p), fd = fdOf(p), ok = seen(p);
      return [
        { label: '표적까지 거리 R', value: p.R, unit: 'km', color: C.R, dec: 0 },
        { label: '왕복 시간 Δt = 2R ⁄ c', value: dtOf(p), unit: 'µs', color: C.dt, dec: 2 },
        { label: '돌아온 메아리 세기 P_r', value: pr, unit: 'fW', color: C.Pr, dec: decOf(pr) },
        { label: '메아리 ÷ 탐지 기준 (dB)', value: db, unit: 'dB', color: C.Pr, dec: 1 },
        { label: '탐지 가능한 최대 거리 R_max', value: rm, unit: 'km', color: C.Rmax, dec: 1 },
        { label: '도플러 이동 f_d', value: fd, unit: 'kHz', color: C.fd, dec: 3 },
        { label: '전파의 파장 λ', value: LAM * 100, unit: 'cm', dec: 2 },
        { label: '신호 출발 뒤 시간 (화면 1초 = 실제 0.5 ms)', value: frac(st.clk / PRI) * PRI * SLOW * 1e6, unit: 'µs', dec: 0 },
        { label: '읽는 법', wide: true, color: ok ? PAL.sage : C.Rmax,
          value: ok ? '메아리가 탐지 기준보다 ' + fmt(db, 1) + ' dB 세서 찾았다. ' + fmt(p.R, 0) + ' km 거리, ' + (p.v > 0 ? '다가오는 중' : p.v < 0 ? '멀어지는 중' : '거리 그대로')
                    : '메아리가 탐지 기준보다 ' + fmt(-db, 1) + ' dB 약해 놓쳤다. 이 표적은 ' + fmt(rm, 0) + ' km 안으로 와야 보인다' }
      ];
    },

    notes: [
      '산에서 "야호" 하고 외치면 메아리가 늦게 돌아올수록 산이 멉니다. 레이더는 소리 대신 전파를 쏘고, 메아리가 돌아온 시간으로 거리를 잽니다.',
      '전파는 1초에 약 30만 km 를 갑니다. 갔다가 돌아오므로 거리는 <b>시간 × 빛의 속도 ÷ 2</b>입니다. 60 km 라도 왕복에 400 µs(1만분의 4초)면 됩니다.',
      '전파는 갈 때 퍼지고(거리²), 비행기에 맞고 돌아올 때 또 퍼집니다(거리²). 그래서 메아리 세기는 <b>거리의 네제곱</b>에 반비례합니다.',
      '그래서 탐지 거리를 2배로 늘리려면 출력을 <b>16배</b>(2⁴) 키워야 합니다. 스텔스기는 반사 면적 σ 를 줄여 레이더에 늦게 잡힙니다.',
      '다가오는 비행기에 맞고 온 전파는 진동수가 조금 높아집니다(도플러 효과). 갈 때와 올 때 두 번 생겨 <b>2v ⁄ λ</b> 만큼 바뀝니다.',
      '화면의 전파는 아주 느리게 그렸습니다(화면 1초 = 실제 0.5 ms). 이 짧은 동안 비행기는 1 m 도 못 가므로 멈춰 보이는 것이 맞습니다.'
    ],
    presets: [
      { name: '여객기 (σ 20 m², 150 km)', set: { R: 150, v: 250, sig: 20, Pt: 100 } },
      { name: '작은 드론 (σ 0.1 m², 60 km)', set: { R: 60, v: 20, sig: .1, Pt: 100 } },
      { name: '출력 16배 (1,600 kW)', set: { R: 190, v: 100, sig: 2, Pt: 1600 } },
      { name: '멀어지는 전투기 (−300 m/s)', set: { R: 80, v: -300, sig: 5, Pt: 100 } }
    ],
    challenges: [
      {
        id: 'far', title: '180 km 밖의 표적 잡기',
        desc: '표적 거리를 180 km 이상으로 두고, 메아리가 탐지 기준을 넘어 표적을 찾게 해 보세요.',
        hint: '빨간 점선 R_max 가 표적보다 멀리 있어야 합니다. 반사 면적 σ 가 큰 여객기로 바꾸거나 출력을 키워 보세요.',
        check: ({ P }) => P.R >= 180 && seen(P)
      },
      {
        id: 'x16', title: '거리 2배에는 출력 16배',
        desc: '반사 면적을 σ = 2 m² 그대로 두고, 탐지 가능한 최대 거리 R_max 를 200 km 이상으로 만들어 보세요.',
        hint: '메아리는 R⁴ 에 반비례하므로 R_max 는 출력의 네제곱근에 비례합니다. 처음 100 km 의 2배가 되려면 출력은 2⁴ = 16배입니다.',
        check: ({ P }) => Math.abs(P.sig - 2) < 1e-9 && rmaxOf(P) >= 200
      },
      {
        id: 'away', title: '멀어지는 표적의 도플러',
        desc: '멀어지는 표적을 탐지하면서 도플러 이동 f_d 가 −4 kHz 이하가 되게 해 보세요.',
        hint: 'f_d = 2v ⁄ λ 이고 λ 는 약 0.1 m 이므로 1 m/s 에 약 20 Hz 입니다. −4 kHz 이면 v 는 약 −200 m/s 입니다.',
        check: ({ P }) => fdOf(P) <= -4 && seen(P)
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl, narrow = w < 600, small = h < 330;
      const rm = rmaxOf(p), db = dbOf(p), ok = seen(p), fd = fdOf(p), dtu = dtOf(p);

      /* ── 배치: 위는 하늘(레이더 → 비행기), 아래는 받은 신호(가로축 = 시간 = 거리) ── */
      const ax = narrow ? 24 : 44, xR = w - (narrow ? 20 : 34);
      const X = km => ax + (xR - ax) * km / XKM;
      const by = h * (small ? .25 : .27), gy = h * (small ? .47 : .5);
      const sy0 = h * (small ? .62 : .64), sy1 = h - (small ? 22 : 30), SH = sy1 - sy0;

      // 땅과 거리 눈금 (km)
      D.line(ctx, 6, gy, w - 6, gy, { color: PS.rgba('ink3', .8), width: 1.5 });
      const tickStep = narrow ? 100 : 50;
      for (let k = 0; k <= 200; k += 50) {
        D.line(ctx, X(k), gy, X(k), gy + 5, { color: PAL.ink3 });
        if (k % tickStep === 0) D.text(ctx, k === 200 ? '200 km' : k + '', X(k), gy + 17, { size: 9.5, color: PAL.ink3, align: 'center' });
      }

      // 안테나 (기둥 + 접시)
      D.line(ctx, ax, by + 6, ax, gy, { color: PAL.ink2, width: 2 });
      ctx.save();
      ctx.strokeStyle = C.Pt; ctx.lineWidth = hl === 'Pt' ? 3.5 : 2.5;
      if (hl === 'Pt') { ctx.shadowColor = C.Pt; ctx.shadowBlur = 10; }
      ctx.beginPath(); ctx.arc(ax - 10, by, 13, -.9, .9); ctx.stroke();
      ctx.restore();
      D.text(ctx, '레이더', ax, gy - 6, { size: 10, color: PAL.ink2, align: 'right' });

      // 빔 (옅은 부채꼴)
      const BA = small ? .2 : .16;
      D.line(ctx, ax, by, xR, by - (xR - ax) * BA, { color: PS.rgba('teal', .15) });
      D.line(ctx, ax, by, xR, by + (xR - ax) * BA, { color: PS.rgba('teal', .15) });

      // 탐지 한계 R_max (빨간 점선)
      const rmTxt = 'R_max ' + fmt(rm, 0) + ' km';
      if (rm <= XKM) {
        D.line(ctx, X(rm), 18, X(rm), gy, { color: C.Rmax, dash: [4, 4], width: hl === 'Rmax' ? 2.2 : 1.4, hot: hl === 'Rmax' });
        D.text(ctx, rmTxt, X(rm), 13, { size: 10.5, color: C.Rmax, align: rm > XKM * .8 ? 'right' : 'center', bold: hl === 'Rmax' });
      } else {
        D.text(ctx, rmTxt + ' →', xR, 13, { size: 10.5, color: C.Rmax, align: 'right', bold: hl === 'Rmax' });
      }

      // 전파 펄스 — 실제 시간 τ 동안 빛이 간 거리 cτ
      const tauS = frac(st.clk / PRI) * PRI * SLOW;           // 펄스 출발 뒤 실제 시간 (s)
      const dKm = CL * tauS / 1e3;                             // 빛이 간 거리 (km)
      const tx = X(p.R);
      const pa = clamp(.35 + p.Pt / 2000 * .55, .35, .9);
      if (dKm <= XKM) {
        const rp = X(dKm) - ax;
        for (let j = 0; j < 3; j++) {
          const rr = rp - j * 3;
          if (rr <= 2) continue;
          ctx.save();
          ctx.strokeStyle = PS.rgba('teal', pa * (1 - j * .3)); ctx.lineWidth = hl === 'Pt' ? 2.6 : 1.8;
          ctx.beginPath(); ctx.arc(ax, by, rr, -BA, BA); ctx.stroke();
          ctx.restore();
        }
      }
      // 메아리 — 표적에 닿은 뒤(cτ > R) 되돌아오는 앞면, 2R 에서 안테나에 닿는다
      if (dKm > p.R && dKm < 2 * p.R) {
        const re = X(dKm - p.R) - ax;                           // 표적에서 퍼진 반지름(px)
        const ea = ok ? clamp(.3 + db / 50, .3, .95) : .22;
        ctx.save();
        ctx.strokeStyle = PS.rgba('amber', ea); ctx.lineWidth = hl === 'Pr' ? 2.6 : 1.8;
        if (!ok) ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.arc(tx, by, re, Math.PI - .32, Math.PI + .32); ctx.stroke();
        ctx.restore();
      }

      // 비행기 — 반사 면적 σ 로 크기, 다가오면 왼쪽을 향한다
      const face = p.v >= 0 ? -1 : 1;
      const S = (narrow ? 6 : 8) * (.75 + .5 * Math.log10(p.sig * 10) / Math.log10(500));
      // 옆에서 본 모습 (코가 +x): 몸통 + 꼬리 날개, 그 아래 주날개
      const body = [[2.3, 0], [1.8, -.32], [-1.8, -.36], [-2.3, -1.3], [-2.7, -1.3], [-2.5, -.3], [-2.5, .25], [1.8, .3]];
      const wing = [[.5, .05], [-.5, .65], [-.9, .65], [-.3, .05]];
      const toXY = q => [tx + face * q[0] * S, by + q[1] * S * .6];
      D.poly(ctx, body.map(toXY), { fill: PS.rgba('dusty', .85), stroke: C.sig, width: 1.2, hot: hl === 'sig' });
      D.poly(ctx, wing.map(toXY), { fill: PS.rgba('dusty', .6), stroke: C.sig, width: 1, hot: hl === 'sig' });

      // 속도 화살표와 도플러
      const vl = (narrow ? 34 : 54) * Math.abs(p.v) / 300;
      const noseX = tx + face * 2.4 * S;
      D.arrow(ctx, noseX, by, face * vl, 0, { color: C.v, width: 2.5, head: 7, hot: hl === 'v' });
      D.text(ctx, 'v ' + fmt(p.v, 0) + ' m/s', tx, by + S + 16, { size: 10.5, color: C.v, align: 'center', bold: hl === 'v' });
      D.text(ctx, 'f_d ' + (fd > 0 ? '+' : '') + fmt(fd, 2) + ' kHz', tx, by - S - 10, { size: 10.5, color: C.fd, align: 'center', bold: hl === 'fd' });

      // 거리 치수선 R
      const dy = by + (gy - by) * .72;
      D.dim(ctx, ax, dy, tx, dy, null, C.R, hl === 'R');
      D.tag(ctx, 'R = ' + fmt(p.R, 0) + ' km', (ax + tx) / 2, dy - 9, C.R, hl === 'R');

      /* ── 받은 신호 (A 스코프): 가로 = 시간, 같은 가로 위치는 같은 거리 ── */
      const base = sy1, thrY = base - SH * .95 / 3;
      D.line(ctx, ax, base, xR, base, { color: PS.rgba('ink3', .9) });
      D.line(ctx, ax, sy0, ax, base, { color: PS.rgba('ink3', .6) });
      // 잡음 풀 (고정 무늬) — 탐지 기준선이 왜 있는지
      ctx.save();
      ctx.strokeStyle = PS.rgba('ink2', .35); ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = ax + 3; x <= xR; x += 3) {
        const n = frac(Math.sin(x * 12.9898) * 43758.5453);
        ctx.moveTo(x, base); ctx.lineTo(x, base - SH * .1 * (.25 + .75 * n));
      }
      ctx.stroke();
      ctx.restore();
      D.line(ctx, ax, thrY, xR, thrY, { color: PS.rgba('ink2', .8), dash: [4, 3] });
      D.text(ctx, '탐지 기준', xR, thrY - 4, { size: 9.5, color: PAL.ink2, align: 'right' });
      D.text(ctx, narrow ? '받은 신호' : '받은 신호 (가로 = 시간, 같은 자리 = 같은 거리)', ax + 4, sy0 - 2, { size: 10, color: PAL.ink2 });
      // 쏜 펄스 (출발 표시)
      D.line(ctx, ax + 1, base, ax + 1, sy0 + 4, { color: PS.rgba('burnt', .8), width: 2 });
      // 메아리 봉우리 — 처음 메아리가 돌아온 뒤부터
      if (st.clk * SLOW * 1e6 >= dtu) {
        const hb = SH * .95 * clamp((db + 30) / 90, .03, 1);
        const col = ok ? C.Pr : PS.rgba('amber', .45);
        D.poly(ctx, [[tx - 4, base], [tx, base - hb], [tx + 4, base]], { fill: col, stroke: col, width: 1, hot: hl === 'Pr' });
        D.tag(ctx, 'Δt = ' + fmt(dtu, 0) + ' µs', tx, Math.min(base - hb - 10, thrY - 12), C.dt, hl === 'dt');
      }
      // 지금 훑는 자리 (펄스 출발 뒤 시간)
      const half = dKm / 2;
      if (half <= XKM) D.line(ctx, X(half), sy0 + 6, X(half), base, { color: PS.rgba('teal', .5) });
      // 판정
      D.text(ctx, ok ? '탐지됨' : '놓침 (너무 약함)', ax + 8, sy0 + (small ? 12 : 16), { size: 11, color: ok ? PAL.sage : C.Rmax, bold: true });
      D.text(ctx, '0', ax, base + 13, { size: 9.5, color: PAL.ink3, align: 'center' });
      D.text(ctx, fmt(2 * XKM * 1e3 / CL * 1e6, 0) + ' µs', xR, base + 13, { size: 9.5, color: PAL.ink3, align: 'right' });
    }
  });
})();
