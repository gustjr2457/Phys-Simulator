/* [유명한 실험] 영의 이중슬릿 실험(1801) — 빛도 파동처럼 간섭한다
   좁은 두 틈을 지난 빛이 스크린에 밝고 어두운 줄무늬를 만든다는 것,
   그리고 광자를 하나씩 아주 뜸하게 쏘아도(광원을 극도로 어둡게 해도)
   시간이 지나면 결국 "같은" 줄무늬가 쌓인다는 것(광자가 스스로와 간섭함)을
   직접 하나씩 쌓이는 점으로 보여준다. 슬릿을 1개로 줄이면 무늬가 사라지고
   하나의 뭉친 무늬만 남는 것과 비교해 "간섭은 틈이 두 개일 때만" 일어남을 확인.
   초급 '빛이란 무엇인가?'(파동성/입자성)에서 바로 이어지는 실험. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { lambda: '#fbbf24', d: '#60a5fa', rate: '#a78bfa', dy: '#34d399', slits: '#f472b6' };
  const L_M = 1.5;      // 슬릿~스크린 거리(실제 값, m) — 교실 실험에서 흔한 값
  const FRINGES_SHOWN = 9; // 화면에 항상 보여줄 무늬 개수(파장·슬릿 간격이 바뀌어도 이 개수만큼 보이도록 시야를 자동으로 맞춘다)
  const BINS = 90;

  function wavelengthToRGB(nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / (440 - 380); g = 0; b = 1; }
    else if (nm >= 440 && nm < 490) { r = 0; g = (nm - 440) / (490 - 440); b = 1; }
    else if (nm >= 490 && nm < 510) { r = 0; g = 1; b = -(nm - 510) / (510 - 490); }
    else if (nm >= 510 && nm < 580) { r = (nm - 510) / (580 - 510); g = 1; b = 0; }
    else if (nm >= 580 && nm < 645) { r = 1; g = -(nm - 645) / (645 - 580); b = 0; }
    else if (nm >= 645 && nm <= 750) { r = 1; g = 0; b = 0; }
    const f = v => Math.round(255 * clamp(v, 0, 1));
    return { css: 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')' };
  }

  // 무늬 간격(실제 물리 공식, SI 단위로 계산 후 mm로 반환): Δy = λL/d
  function fringeSpacingMM(p) {
    const lambda_m = p.lambda * 1e-9, d_m = p.d * 1e-6;
    return (lambda_m * L_M / d_m) * 1000;
  }
  // 화면에 보여줄 시야 폭 — 무늬 간격에 비례해서 항상 일정한 개수의 무늬가 보이도록 자동으로 맞춘다.
  // (고정된 mm 값을 쓰면 파장·슬릿 간격에 따라 무늬가 화면 밖으로 나가거나 점처럼 뭉쳐 보일 수 있다)
  function windowMM(p) { return FRINGES_SHOWN * fringeSpacingMM(p); }
  function sinc(x) { return x === 0 ? 1 : Math.sin(x) / x; }
  // 슬릿 하나의 폭(실제로 존재하지만 슬라이더로는 노출하지 않음) — 흔히 쓰는 비율(d/폭 ≈ 6)로 고정.
  // 이 폭이 있어야 실제 사진처럼 "가운데가 가장 밝고 양옆으로 갈수록 어두워지는" 회절 포락선이 생긴다.
  function slitWidth_m(p) { return (p.d * 1e-6) / 6; }
  // 슬릿 1개: 회절만 있음(간섭 없음) — I(y) = sinc²(π a y / λL)
  function intensitySingle(y_mm, p) {
    const lambda_m = p.lambda * 1e-9, y_m = y_mm * 1e-3, a_m = slitWidth_m(p);
    const beta = Math.PI * a_m * y_m / (lambda_m * L_M);
    const s = sinc(beta);
    return s * s;
  }
  // 슬릿 2개: 간섭(촘촘한 줄무늬) × 회절(전체를 감싸는 밝기 포락선) — 실제 사진과 같은 모양
  // I(y) = sinc²(π a y / λL) · cos²(π d y / λL)
  function intensityDouble(y_mm, p) {
    const lambda_m = p.lambda * 1e-9, d_m = p.d * 1e-6, y_m = y_mm * 1e-3;
    const delta = Math.PI * d_m * y_m / (lambda_m * L_M);
    const c = Math.cos(delta);
    return intensitySingle(y_mm, p) * c * c;
  }
  function intensityAt(y_mm, p) { return p.slits >= 2 ? intensityDouble(y_mm, p) : intensitySingle(y_mm, p); }
  function sampleY(p) {
    const half = windowMM(p) / 2;
    for (let i = 0; i < 60; i++) {
      const y = (Math.random() * 2 - 1) * half;
      if (Math.random() < intensityAt(y, p)) return y;
    }
    return 0;
  }

  PS.register({
    id: 'exp-doubleslit', mode: 'exp', category: '빛의 정체를 밝히다',
    title: '영의 이중슬릿 실험 (1801)',
    sub: '빛도 파동처럼 간섭한다',
    tagline: '광자를 하나씩 쏘아 보내도(광원을 아주 어둡게 해도) 스크린에는 점들이 무작위가 아니라 특정 위치에 몰려서 쌓입니다 — 결국 밝고 어두운 줄무늬(간섭무늬)가 나타납니다. 슬릿을 1개로 줄이면 이 줄무늬는 사라지고 하나의 뭉친 무늬만 남습니다.',

    params: [
      { key: 'slits', symbol: 'n', label: '슬릿 개수', unit: '개', min: 1, max: 2, step: 1, value: 2, color: C.slits, reset: true, dec: 0,
        where: '빛이 통과하는 <b>틈의 개수</b>입니다. 2개일 때만 두 경로 사이의 간섭이 생겨 줄무늬가 나타납니다.' },
      { key: 'lambda', symbol: 'λ', label: '빛의 파장', unit: 'nm', min: 400, max: 700, step: 10, value: 550, color: C.lambda, reset: true, dec: 0,
        where: '광원의 <b>색</b>입니다. 파장이 길수록(빨강 쪽) 무늬 간격이 <b>넓어집니다</b>.' },
      { key: 'd', symbol: 'd', label: '슬릿 간격', unit: 'μm', min: 100, max: 1000, step: 20, value: 300, color: C.d, reset: true, dec: 0,
        where: '두 슬릿 사이의 <b>거리</b>입니다(머리카락 두께 정도의 매우 좁은 간격). 좁을수록 무늬 간격이 <b>넓어집니다</b>.' },
      { key: 'rate', symbol: '', label: '광원의 밝기(초당 광자 수)', unit: '개/s', min: 3, max: 200, step: 1, value: 60, color: C.rate,
        where: '아주 낮게 설정하면 <b>광자가 하나씩, 뜸하게</b> 스크린에 도착합니다. 이렇게 극단적으로 어둡게 해도 결국 같은 줄무늬가 쌓인다는 것이 이 실험의 핵심입니다.' }
    ],
    vars: {
      dy: { symbol: 'Δy', label: '무늬 간격', unit: 'mm', color: C.dy,
        where: '스크린 위에서 <b>밝은 무늬와 다음 밝은 무늬 사이의 거리</b>입니다. 오른쪽 화면의 초록 치수선입니다.' }
    },
    formulas: [
      { name: '보강간섭(밝은 무늬) 조건', tpl: 'd sinθ = mλ  (m = 0, ±1, ±2, …)' },
      { name: '무늬 간격', tpl: '{dy} = λL ⁄ d' }
    ],

    init(p) { return { hist: new Array(BINS).fill(0), total: 0, acc: 0, lastY: null, lastT: -10 }; },
    step(st, p, dt) {
      st.acc += p.rate * dt;
      while (st.acc >= 1) {
        st.acc -= 1;
        const y = sampleY(p);
        const win = windowMM(p);
        const bin = clamp(Math.floor((y + win / 2) / win * BINS), 0, BINS - 1);
        st.hist[bin]++;
        st.total++;
        st.lastY = y; st.lastT = st.t;
      }
    },

    readouts(st, p) {
      return [
        { label: '무늬 간격 Δy = λL/d', value: fringeSpacingMM(p), unit: 'mm', dec: 3, color: C.dy },
        { label: '지금까지 도착한 광자 수', value: st.total, unit: '개', dec: 0, color: C.rate },
        { label: '슬릿 개수', value: p.slits, unit: '개', dec: 0, color: C.slits },
        { label: '상태', value: p.slits >= 2 ? '간섭무늬(줄무늬)가 쌓이는 중' : '간섭 없음 — 하나의 뭉친 무늬만 쌓임', wide: true }
      ];
    },

    notes: [
      '빛이 그냥 <b>총알 같은 입자</b>라면, 슬릿이 2개여도 그 뒤에 두 개의 띠만 생겨야 합니다. 실제로는 <b>여러 개의 줄무늬</b>가 생기는데, 이건 파동만이 보이는 간섭 현상입니다.',
      '광원을 극도로 어둡게 해서 <b>광자가 한 번에 하나씩만</b> 스크린에 도착해도, 충분히 오래 기다리면 <b>똑같은 줄무늬</b>가 점점 쌓여 나타납니다 — 광자 하나가 마치 <b>두 슬릿을 동시에 지나 스스로와 간섭</b>하는 것처럼 행동한다는 뜻입니다.',
      '슬릿을 1개로 줄이면 줄무늬가 사라지고 <b>하나의 뭉친 무늬</b>만 남습니다 — 간섭은 반드시 <b>비교할 두 번째 경로</b>가 있어야 생깁니다.',
      '파장(λ)을 늘리거나(빨간빛) 슬릿 간격(d)을 좁히면 무늬 간격(Δy)이 <b>넓어집니다</b> — 오른쪽 초록 화살표로 확인해 보세요.'
    ],
    presets: [
      { name: '기본', set: { slits: 2, lambda: 550, d: 300, rate: 60 } },
      { name: '슬릿 1개(간섭 없음)', set: { slits: 1, lambda: 550, d: 300, rate: 60 } },
      { name: '빨간빛(무늬가 넓어짐)', set: { slits: 2, lambda: 680, d: 300, rate: 60 } },
      { name: '파란빛(무늬가 좁아짐)', set: { slits: 2, lambda: 430, d: 300, rate: 60 } },
      { name: '슬릿을 더 좁혀서(무늬가 크게 넓어짐)', set: { slits: 2, lambda: 550, d: 120, rate: 60 } },
      { name: '광자 하나씩 뜸하게(핵심 실험)', set: { slits: 2, lambda: 550, d: 300, rate: 4 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const srcX = 46, barrierX = w * .30, screenX = w * .74;
      const topY = 46, botY = h - 46, cy = (topY + botY) / 2;
      const col = wavelengthToRGB(p.lambda).css;
      const gap = 13; // 슬릿 간격은 실제 축척이 아니라 보기 좋게 고정된 화면상의 간격

      // 광축
      D.line(ctx, srcX, cy, screenX, cy, { color: 'rgba(255,255,255,.08)' });

      // 광원
      ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 14;
      D.dot(ctx, srcX, cy, 9, col, false);
      ctx.restore();
      D.text(ctx, '광원', srcX, cy + 26, { size: 10.5, color: '#61719a', align: 'center' });

      // 슬릿 판(장벽)
      const slitYs = p.slits >= 2 ? [cy - gap, cy + gap] : [cy];
      ctx.save();
      ctx.strokeStyle = 'rgba(147,162,196,.7)'; ctx.lineWidth = 5; ctx.lineCap = 'butt';
      ctx.beginPath();
      let prevY = topY;
      slitYs.forEach(sy => { ctx.moveTo(barrierX, prevY); ctx.lineTo(barrierX, sy - 4); prevY = sy + 4; });
      ctx.moveTo(barrierX, prevY); ctx.lineTo(barrierX, botY);
      ctx.stroke();
      ctx.restore();
      D.text(ctx, p.slits >= 2 ? '슬릿 2개' : '슬릿 1개', barrierX, topY - 14, { size: 11, color: '#93a2c4', align: 'center' });

      // 하위헌스 원리 느낌의 퍼지는 파면(부채꼴 호)
      const nArcs = 4;
      slitYs.forEach(sy => {
        for (let k = 1; k <= nArcs; k++) {
          const r = 16 * k + (st.t * 40 % 16);
          ctx.save();
          ctx.strokeStyle = col; ctx.globalAlpha = clamp(.28 - k * .05, .03, .3); ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(barrierX, sy, r, -Math.PI * .42, Math.PI * .42);
          ctx.stroke();
          ctx.restore();
        }
      });

      // 스크린 세로선
      D.line(ctx, screenX, topY, screenX, botY, { color: 'rgba(255,255,255,.35)', width: 2 });
      D.text(ctx, '스크린(관측 화면)', screenX, topY - 14, { size: 11, color: '#93a2c4', align: 'center' });

      // 누적 히스토그램(왼쪽으로 뻗는 막대) + 이론 곡선(오른쪽 얇은 선)
      const win = windowMM(p);
      const maxBin = Math.max(1, ...st.hist);
      const binH = (botY - topY) / BINS;
      const barMax = screenX - barrierX - 30;
      for (let i = 0; i < BINS; i++) {
        const yMid = topY + (i + .5) * binH;
        const cnt = st.hist[i];
        if (cnt > 0) {
          const len = barMax * (cnt / maxBin);
          ctx.save();
          ctx.globalAlpha = clamp(.25 + .75 * (cnt / maxBin), .25, 1);
          ctx.fillStyle = col;
          ctx.fillRect(screenX - len, yMid - binH * .42, len, binH * .84);
          ctx.restore();
        }
        // 이론 곡선(스크린 오른쪽에 얇게)
        const yMM = -win / 2 + (i + .5) * (win / BINS);
        const theo = intensityAt(yMM, p);
        if (i > 0) {
          const yMidPrev = topY + (i - .5) * binH;
          const yMMprev = -win / 2 + (i - .5) * (win / BINS);
          const theoPrev = intensityAt(yMMprev, p);
          D.line(ctx, screenX + 6 + theoPrev * 26, yMidPrev, screenX + 6 + theo * 26, yMid, { color: 'rgba(232,238,252,.55)', width: 1.3 });
        }
      }
      D.text(ctx, '실제로 쌓인 무늬', screenX - barMax * .5, botY + 20, { size: 10, color: col, align: 'center' });
      D.text(ctx, '이론 곡선', screenX + 34, botY + 20, { size: 9.5, color: '#93a2c4', align: 'center' });

      // 방금 도착한 광자 표시
      if (st.lastY !== null && st.t - st.lastT < .25) {
        const yPix = topY + (botY - topY) * (1 - (st.lastY + win / 2) / win);
        ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 16;
        D.dot(ctx, screenX, yPix, 4.5, '#ffffff', true);
        ctx.restore();
      }

      // 무늬 간격 치수선(이론값)
      if (p.slits >= 2) {
        const dyMM = fringeSpacingMM(p);
        const y1 = 0, y2 = clamp(dyMM, -win / 2, win / 2);
        const py1 = topY + (botY - topY) * (1 - (y1 + win / 2) / win);
        const py2 = topY + (botY - topY) * (1 - (y2 + win / 2) / win);
        D.dim(ctx, screenX + 70, py1, screenX + 70, py2, 'Δy=' + fmt(dyMM, 2) + 'mm', C.dy, hl === 'dy');
      }

      D.text(ctx, '누적 광자 수: ' + st.total, 16, h - 14, { size: 11, color: '#93a2c4' });
    }
  });
})();
