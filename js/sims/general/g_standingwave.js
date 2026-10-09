/* [일반물리·파동과 광학] 정상파와 공명 — v = √(T/μ),  f_n = n·v/2L
   양 끝이 고정된 줄은 아무 진동수로나 흔들리지 않는다. 되돌아온 파동과 새로 가는
   파동이 서로 맞아떨어지는 진동수에서만 크게 흔들리고, 그 진동수는 띄엄띄엄하다.
   파장이 "줄 길이에 딱 맞아야 한다"는 조건이 에너지를 양자화하는 것 —
   상자 속 전자의 에너지 준위도 정확히 같은 수학이다.
   악기의 음높이, 구조물의 고유진동수, 전자레인지의 핫스팟이 모두 여기서 나온다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { L: '#5eead4', T: '#fbbf24', mu: '#a78bfa', f: '#fb7185',
              v: '#60a5fa', f1: '#34d399', A: '#f472b6' };
  const NMODE = 9, GAMMA = .06;        // 표시할 배진동 수 / 감쇠비

  const vOf = p => Math.sqrt(p.T / (p.mu / 1000));         // m/s
  const fnOf = (p, n) => n * vOf(p) / (2 * p.L);
  // 구동 진동수 f에서 모드 n이 받는 응답 (감쇠 강제진동)
  function ampOf(p, n) {
    const fn = fnOf(p, n), f = p.f;
    const d = (fn * fn - f * f) / (fn * fn);
    const g = GAMMA * f / fn;
    return 1 / Math.sqrt(d * d + g * g) / n;              // 고차 모드는 덜 실린다
  }
  const bestMode = p => {
    let b = 1, m = -1;
    for (let n = 1; n <= NMODE; n++) { const a = ampOf(p, n); if (a > m) { m = a; b = n; } }
    return b;
  };
  const resonance = p => {
    const n = bestMode(p), fn = fnOf(p, n);
    return Math.abs(p.f - fn) / fn;                        // 공명점에서 0
  };

  PS.register({
    id: 'g-standingwave', mode: 'general', category: '파동과 광학',
    title: '정상파와 공명',
    sub: 'f_n = n·v/2L,  v = √(T/μ)',
    tagline: '양 끝이 고정된 줄은 아무 진동수로나 흔들리지 않습니다. 파장이 줄 길이에 딱 맞아떨어지는 띄엄띄엄한 진동수에서만 크게 흔들립니다 — 에너지가 양자화되는 것과 똑같은 수학입니다.',

    params: [
      { key: 'f', symbol: 'f', label: '구동 진동수', unit: 'Hz', min: 5, max: 600, step: 1, value: 158, color: C.f, dec: 0,
        where: '왼쪽 <b>가진기가 줄을 흔드는 진동수</b>입니다. 아래 사다리의 고유진동수(초록 눈금) 중 하나에 맞으면 <b>공명</b>이 일어나 진폭이 폭발합니다.' },
      { key: 'L', symbol: 'L', label: '줄의 길이', unit: 'm', min: .2, max: 2, step: .05, value: 1, color: C.L, dec: 2, reset: true,
        where: '양 끝 고정점 사이의 <b>길이</b>입니다. 기본진동수가 1/L에 비례하므로 — 기타에서 프렛을 짚어 줄을 짧게 하면 음이 높아지는 것이 이것입니다.' },
      { key: 'T', symbol: 'T', label: '장력', unit: 'N', min: 5, max: 500, step: 5, value: 100, color: C.T, dec: 0, reset: true,
        where: '줄을 <b>얼마나 팽팽히 당겼는가</b>입니다. 파동 속력이 √T에 비례하므로, 장력을 4배로 해야 진동수가 2배가 됩니다 — 기타 조율 손잡이가 하는 일입니다.' },
      { key: 'mu', symbol: 'μ', label: '선밀도', unit: 'g/m', min: .2, max: 20, step: .2, value: 1, color: C.mu, dec: 1, reset: true,
        where: '줄 1 m의 <b>질량</b>입니다. 무거울수록 파동이 느려져 음이 낮아집니다 — 기타 저음 줄이 굵은 이유이고, 베이스 기타가 큰 이유입니다.' }
    ],
    vars: {
      v: { symbol: 'v', label: '파동 속력', unit: 'm/s', color: C.v,
        where: '줄을 타고 가는 <b>파동의 속력</b>입니다. 장력과 선밀도만으로 정해지며, 진동수나 진폭과는 무관합니다.' },
      f1: { symbol: 'f₁', label: '기본진동수', unit: 'Hz', color: C.f1,
        where: '가장 낮은 고유진동수(한 배 진동)입니다. 들리는 <b>음높이</b>가 이것이고, 나머지 배진동수는 전부 이것의 정수배입니다.' },
      A: { symbol: 'A', label: '진폭', unit: '', color: C.A,
        where: '줄이 흔들리는 <b>크기</b>입니다. 구동 진동수가 고유진동수에 가까워질수록 급격히 커집니다 — 이것이 공명입니다.' }
    },
    formulas: [
      { name: '줄에서의 파동 속력', tpl: '{v} = √({T} ⁄ {mu})' },
      { name: '고유진동수 (정상파 조건)', tpl: '{f1}_n = n · {v} ⁄ 2{L}' },
      { name: '파장 조건 — 줄 길이에 딱 맞아야 한다', tpl: '{L} = n · λ ⁄ 2' },
      { name: '공명', tpl: '{f} = {f1}_n  →  {A} 폭발' }
    ],

    init(p) { return { ph: 0, done: false }; },
    step(st, p, dt) { st.ph += 2 * Math.PI * Math.min(p.f, 24) * dt * .18; },

    graphs: [{
      title: '주파수 응답 — 고유진동수에서만 크게 흔들린다', xKey: 'fx', xUnit: 'Hz', xMin: 0, y0: 0,
      series: [{ key: 'amp', label: '진폭', color: C.A }]
    }],
    sample(st, p) {
      // 구동 진동수를 0부터 훑으며 응답 곡선을 그린다
      const fmax = Math.max(p.f * 1.4, fnOf(p, NMODE) * 1.05);
      const fx = (st.t * .09 % 1) * fmax;
      let a = 0;
      for (let n = 1; n <= NMODE; n++) {
        const fn = fnOf(p, n);
        const d = (fn * fn - fx * fx) / (fn * fn), g = GAMMA * fx / fn;
        a += 1 / Math.sqrt(d * d + g * g) / n;
      }
      return { fx: fx, amp: Math.min(a, 40) };
    },

    readouts(st, p) {
      const v = vOf(p), f1 = fnOf(p, 1), n = bestMode(p), res = resonance(p);
      const NOTE = ['도', '도♯', '레', '레♯', '미', '파', '파♯', '솔', '솔♯', '라', '라♯', '시'];
      const semi = Math.round(12 * Math.log2(f1 / 440)) + 9;
      return [
        { label: '파동 속력 v', value: v, unit: 'm/s', color: C.v, dec: 1 },
        { label: '기본진동수 f₁', value: f1, unit: 'Hz', color: C.f1, dec: 1 },
        { label: '가장 가까운 음', value: NOTE[((semi % 12) + 12) % 12] + ' (옥타브 ' + (4 + Math.floor(semi / 12)) + ')', color: C.f1 },
        { label: '구동 진동수 f', value: p.f, unit: 'Hz', color: C.f, dec: 0 },
        { label: '가장 세게 반응하는 모드', value: n + ' 배 진동 (' + fmt(fnOf(p, n), 1) + ' Hz)', wide: true, color: C.A },
        { label: '파장 λ = 2L/n', value: 2 * p.L / n, unit: 'm', dec: 3, color: C.L },
        { label: '마디(움직이지 않는 점) 수', value: n + 1, unit: '개', dec: 0, color: '#93a2c4' },
        { label: '배(가장 크게 흔들리는 점) 수', value: n, unit: '개', dec: 0, color: C.A },
        { label: '공명 상태', wide: true,
          color: res < .01 ? '#34d399' : (res < .05 ? '#fbbf24' : '#fb7185'),
          value: res < .01 ? '✔ 정확히 공명 — 진폭 최대' :
                 (res < .05 ? '△ 공명 근처 (' + fmt(res * 100, 1) + '% 벗어남)' : '✘ 공명이 아니다 — 거의 흔들리지 않는다') },
        { label: '장력을 4배로 하면 f₁', value: f1 * 2, unit: 'Hz', dec: 1, color: C.T },
        { label: '줄을 반으로 짚으면 f₁', value: f1 * 2, unit: 'Hz', dec: 1, color: C.L }
      ];
    },

    notes: [
      '<b>정상파는 "파장이 줄에 딱 맞아떨어질 때"만 생깁니다.</b> L = nλ/2 — 이 조건 때문에 가능한 진동수가 연속이 아니라 <b>띄엄띄엄</b>해집니다. 상자 속 전자의 에너지가 양자화되는 것과 정확히 같은 수학입니다(양자역학 트랙에서 확인해 보세요).',
      '<b>배진동수는 전부 기본진동수의 정수배</b>입니다(f_n = n·f₁). 이 정수배 관계가 "음악적인" 소리를 만듭니다 — 어떤 배진동이 얼마나 섞였느냐가 같은 음높이라도 기타와 바이올린을 구별하게 하는 <b>음색</b>입니다.',
      '음높이를 바꾸는 방법이 셋입니다 — <b>길이</b>(f ∝ 1/L, 프렛을 짚는다), <b>장력</b>(f ∝ √T, 조율한다), <b>선밀도</b>(f ∝ 1/√μ, 굵은 줄을 쓴다). 장력은 제곱근이라 둔하고, 길이가 가장 잘 듣습니다.',
      '<b>공명은 양날의 검입니다.</b> 악기는 공명으로 소리를 키우지만, 다리·건물·기계는 외력의 진동수가 고유진동수와 맞으면 무너집니다 — 1940년 타코마 다리 붕괴, 2000년 런던 밀레니엄 브리지의 흔들림이 그 예입니다(공학응용 트랙의 "강제 진동과 공진"에서 같은 수학을 봅니다).',
      '<b>마디에서는 줄이 전혀 움직이지 않습니다.</b> 기타에서 12프렛 위에 손가락을 살짝 대고 튕기면 그 지점이 마디가 되어 한 옥타브 위 소리만 남습니다 — 하모닉스 주법입니다.',
      '전자레인지도 정상파를 만듭니다. 마디 자리에는 에너지가 안 가서 음식이 안 데워지므로, <b>회전 접시</b>로 음식을 마디 밖으로 계속 옮겨 줍니다.'
    ],
    presets: [
      { name: '기본진동 (1배)', set: { f: 158, L: 1, T: 100, mu: 1 } },
      { name: '2배 진동', set: { f: 316, L: 1, T: 100, mu: 1 } },
      { name: '3배 진동', set: { f: 474, L: 1, T: 100, mu: 1 } },
      { name: '장력 4배 → 음 한 옥타브 위', set: { f: 316, L: 1, T: 400, mu: 1 } },
      { name: '굵은 저음 줄', set: { f: 50, L: 1, T: 100, mu: 10 } },
      { name: '공명이 아닐 때 (거의 안 흔들림)', set: { f: 230, L: 1, T: 100, mu: 1 } }
    ],
    challenges: [
      {
        id: 'third', title: '3배 진동 만들기',
        desc: '마디가 4개(양 끝 포함), 배가 3개인 정상파를 만들어 보세요.',
        hint: 'f₃ = 3·f₁ 에 구동 진동수를 맞추면 됩니다. 측정값 칸의 기본진동수를 3배 하세요.',
        check: ({ P }) => bestMode(P) === 3 && resonance(P) < .02
      },
      {
        id: 'tune', title: '440 Hz (라)에 조율하기',
        desc: '기본진동수를 440 ± 3 Hz로 맞춰 보세요 — 오케스트라의 기준음입니다.',
        hint: 'f₁ = √(T/μ)/(2L). 장력을 올리거나 줄을 짧게 하거나 가는 줄을 쓰세요.',
        check: ({ P }) => Math.abs(fnOf(P, 1) - 440) <= 3
      },
      {
        id: 'octave', title: '장력만으로 한 옥타브 올리기',
        desc: '길이와 선밀도는 그대로 두고 장력만 바꿔서 기본진동수를 2배로 만들어 보세요 — 장력은 몇 배가 필요할까요?',
        hint: 'f ∝ √T 이므로 장력을 4배로 해야 합니다. 기본값(100 N)에서 400 N으로.',
        check: ({ P }) => P.T >= 380 && P.L === 1 && P.mu >= .8 && P.mu <= 1.2
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const v = vOf(p), n = bestMode(p), res = resonance(p);

      /* ── 줄 ── */
      const x0 = 68, sw = Math.min(w - 136, 460), cy = h * .32;
      const amp = clamp(ampOf(p, n) * 5, 1, 1) * 0 + clamp(Math.log10(1 + ampOf(p, n)) * 34, 2, 62);
      const osc = Math.sin(st.ph);
      const shape = u => {
        let s = 0;
        for (let k = 1; k <= NMODE; k++) s += ampOf(p, k) * Math.sin(k * Math.PI * u) / Math.max(ampOf(p, n), 1e-9);
        return s;
      };
      // 잔상(포락선)
      ctx.save();
      ctx.strokeStyle = 'rgba(244,114,182,.18)'; ctx.lineWidth = 1.4;
      [1, -1].forEach(s => {
        ctx.beginPath();
        for (let i = 0; i <= 160; i++) { const u = i / 160; const yy = cy + s * shape(u) * amp; i ? ctx.lineTo(x0 + sw * u, yy) : ctx.moveTo(x0 + sw * u, yy); }
        ctx.stroke();
      });
      ctx.restore();
      // 줄
      ctx.save();
      ctx.strokeStyle = res < .02 ? '#f472b6' : '#c8d3ef';
      ctx.lineWidth = 2.6 + clamp(p.mu * .12, 0, 2.4);
      if (hl === 'A' || res < .02) { ctx.shadowColor = C.A; ctx.shadowBlur = 14; }
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const u = i / 200; const yy = cy + shape(u) * amp * osc; i ? ctx.lineTo(x0 + sw * u, yy) : ctx.moveTo(x0 + sw * u, yy); }
      ctx.stroke(); ctx.restore();
      // 고정단
      [0, 1].forEach(s => {
        const xx = x0 + sw * s;
        ctx.fillStyle = 'rgba(147,162,196,.5)'; ctx.fillRect(xx - 4 + s * -2, cy - 26, 6, 52);
      });
      // 마디 · 배
      if (res < .25) {
        for (let k = 0; k <= n; k++) {
          const xx = x0 + sw * k / n;
          D.dot(ctx, xx, cy, 3.5, '#60a5fa', false);
          if (k === 0) D.text(ctx, '마디', xx, cy + 34, { size: 9, color: '#60a5fa', align: 'center' });
        }
        for (let k = 0; k < n; k++) {
          const xx = x0 + sw * (k + .5) / n;
          D.line(ctx, xx, cy - amp - 6, xx, cy + amp + 6, { color: 'rgba(244,114,182,.3)', dash: [2, 3] });
          if (k === 0) D.text(ctx, '배', xx, cy - amp - 12, { size: 9, color: C.A, align: 'center' });
        }
        D.dim(ctx, x0, cy + 48, x0 + sw / n, cy + 48, 'λ/2 = ' + fmt(p.L / n, 3) + ' m', C.L, hl === 'L');
      }
      // 가진기
      ctx.save();
      if (hl === 'f') { ctx.shadowColor = C.f; ctx.shadowBlur = 14; }
      D.roundRect(ctx, x0 - 30, cy - 12 + osc * 4, 20, 24, 3);
      ctx.fillStyle = C.f; ctx.globalAlpha = .7; ctx.fill(); ctx.restore();
      D.text(ctx, fmt(p.f, 0) + ' Hz', x0 - 20, cy - 22, { size: 10, color: hl === 'f' ? '#fff' : C.f, align: 'center', bold: true });
      D.dim(ctx, x0, cy - 48, x0 + sw, cy - 48, 'L = ' + fmt(p.L, 2) + ' m', C.L, hl === 'L');
      D.tag(ctx, res < .02 ? '공명! ' + n + '배 진동' : (res < .08 ? '공명 근처' : '공명 아님 — 거의 안 흔들린다'),
        x0 + sw / 2, cy + 74, res < .02 ? '#34d399' : (res < .08 ? '#fbbf24' : '#fb7185'), true);

      /* ── 고유진동수 사다리 ── */
      const lx = 52, ly = h - 96, lw = Math.min(w - 104, 500);
      const fmax = Math.max(p.f * 1.25, fnOf(p, NMODE) * 1.05);
      const LX = f => lx + clamp(f / fmax, 0, 1) * lw;
      D.text(ctx, '고유진동수 사다리 — 이 눈금 위에서만 크게 흔들린다', lx, ly - 10, { size: 10.5, color: '#61719a' });
      D.line(ctx, lx, ly + 16, lx + lw, ly + 16, { color: 'rgba(147,162,196,.25)', width: 2 });
      for (let k = 1; k <= NMODE; k++) {
        const fn = fnOf(p, k);
        if (fn > fmax) break;
        const hit = Math.abs(p.f - fn) / fn < .02;
        ctx.save(); if (hit) { ctx.shadowColor = C.f1; ctx.shadowBlur = 12; }
        D.line(ctx, LX(fn), ly + 16 - (hit ? 20 : 12), LX(fn), ly + 16,
          { color: hit ? '#34d399' : 'rgba(52,211,153,.5)', width: hit ? 3 : 1.8 });
        ctx.restore();
        D.text(ctx, k + '', LX(fn), ly + 29, { size: 9, color: hit ? '#34d399' : '#4b5a80', align: 'center' });
      }
      D.text(ctx, 'f₁ = ' + fmt(fnOf(p, 1), 1) + ' Hz', lx, ly + 48,
        { size: 11.5, color: hl === 'f1' ? '#fff' : C.f1, bold: true });
      ctx.save(); ctx.shadowColor = C.f; ctx.shadowBlur = 10;
      D.line(ctx, LX(p.f), ly - 2, LX(p.f), ly + 24, { color: C.f, width: 2.4 }); ctx.restore();
      D.text(ctx, '구동 f', LX(p.f), ly - 6, { size: 9, color: C.f, align: 'center' });
      D.text(ctx, 'v = √(T/μ) = ' + fmt(v, 1) + ' m/s', lx + 150, ly + 48,
        { size: 11.5, color: hl === 'v' ? '#fff' : C.v, bold: hl === 'v' });
      D.text(ctx, '진동수 (Hz) →', lx + lw, ly + 48, { size: 9.5, color: '#61719a', align: 'right' });
    }
  });
})();
