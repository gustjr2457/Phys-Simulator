/* 초급·개념 — 빛이란 무엇인가? (미시세계)
   빛은 "파동"이면서 동시에 "광자"라는 알갱이의 흐름이기도 하다(이중성 예고편).
   색은 파장이 결정하고, 파장이 짧을수록 광자 하나하나의 에너지가 크다는 것을
   계산 없이 눈으로 확인한다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { lambda: '#fbbf24', f: '#60a5fa', E: '#f472b6' };

  // 파장(nm, 380~750 가시광선) → 대략적인 RGB (단순화된 근사식)
  function wavelengthToRGB(nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / (440 - 380); g = 0; b = 1; }
    else if (nm >= 440 && nm < 490) { r = 0; g = (nm - 440) / (490 - 440); b = 1; }
    else if (nm >= 490 && nm < 510) { r = 0; g = 1; b = -(nm - 510) / (510 - 490); }
    else if (nm >= 510 && nm < 580) { r = (nm - 510) / (580 - 510); g = 1; b = 0; }
    else if (nm >= 580 && nm < 645) { r = 1; g = -(nm - 645) / (645 - 580); b = 0; }
    else if (nm >= 645 && nm <= 750) { r = 1; g = 0; b = 0; }
    let a = 1;
    if (nm < 420) a = 0.35 + 0.65 * (nm - 380) / (420 - 380);
    if (nm > 700) a = 0.35 + 0.65 * (750 - nm) / (750 - 700);
    const f = v => Math.round(255 * clamp(v, 0, 1) * a);
    return { r: f(r), g: f(g), b: f(b), css: 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')' };
  }
  function colorName(nm) {
    if (nm < 450) return '보라';
    if (nm < 485) return '파랑';
    if (nm < 500) return '청록';
    if (nm < 565) return '초록';
    if (nm < 590) return '노랑';
    if (nm < 625) return '주황';
    return '빨강';
  }

  PS.register({
    id: 'c-light', mode: 'concept', category: '미시세계',
    title: '빛이란 무엇인가?',
    sub: '파동이면서 동시에 알갱이(광자)의 흐름',
    tagline: '빛은 물결처럼 "파동"이기도 하고, 낱알처럼 "광자"라는 알갱이가 쏟아지는 흐름이기도 합니다. 파장을 바꿔 색이 변하는 것과, 광자 하나의 에너지가 달라지는 것을 함께 보세요.',

    params: [
      { key: 'lambda', symbol: 'λ', label: '파장', unit: 'nm', min: 380, max: 750, step: 5, value: 550, color: C.lambda, dec: 0,
        where: '<b>빛의 색</b>을 결정하는 값입니다. 파장이 짧을수록 보라·파랑, 길수록 빨강에 가까워집니다. 사람 눈에 보이는 범위(가시광선)는 380~750 nm뿐입니다.' }
    ],
    vars: {
      f: { symbol: 'f', label: '진동수', unit: 'THz', color: C.f,
        where: '빛이 <b>1초에 몇 번 진동하는지</b>입니다. 파장이 짧을수록 더 빨리 진동합니다(빛의 속력은 항상 일정하기 때문).' },
      E: { symbol: 'E', label: '광자 하나의 에너지', unit: 'eV', color: C.E,
        where: '아래 광자(점) <b>하나하나가 가진 에너지</b>입니다. 파장이 짧을수록(보라 쪽) 광자 하나의 에너지가 크고, 길수록(빨강 쪽) 작습니다. 자외선이 피부를 태우고 적외선은 그렇지 않은 이유입니다.' }
    },
    formulas: [
      { name: '색을 정하는 것', tpl: '{lambda} 가 색을 정한다' },
      { name: '파장과 진동수', tpl: '{lambda} 가 짧을수록 {f} 는 크다' },
      { name: '광자 하나의 에너지', tpl: '{lambda} 가 짧을수록 {E} 는 크다' }
    ],

    init(p) {
      return { t: 0, photons: [] };
    },
    step(st, p, dt) {
      st.t += dt;
      const speed = 4.2;
      // 광자 에너지가 클수록(파장 짧을수록) 더 자주 튀어나옴
      const E = 1240 / p.lambda;
      const rate = clamp(E * 5, 4, 22);
      st.emitAcc = (st.emitAcc || 0) + rate * dt;
      while (st.emitAcc >= 1) {
        st.photons.push({ x: -0.2, y: (Math.random() - .5) * 0.9 });
        st.emitAcc -= 1;
      }
      st.photons.forEach(ph => { ph.x += speed * dt; });
      st.photons = st.photons.filter(ph => ph.x < 8.2);
    },

    readouts(st, p) {
      const f = 299792458 / (p.lambda * 1e-9) / 1e12; // THz
      const E = 1240 / p.lambda; // eV (근사식: E(eV) ≈ 1240 / λ(nm))
      return [
        { label: '색', value: colorName(p.lambda), color: wavelengthToRGB(p.lambda).css, wide: true },
        { label: '진동수 f', value: f, unit: 'THz', dec: 0, color: C.f },
        { label: '광자 에너지 E', value: E, unit: 'eV', dec: 2, color: C.E }
      ];
    },

    notes: [
      '빛의 속력은 진공에서 <b>항상 일정(초속 약 30만 km)</b>합니다 — 그래서 파장이 짧으면 진동수가 커집니다.',
      '무지개(spectrum)는 여러 파장이 섞인 햇빛이 프리즘에서 파장별로 갈라진 모습입니다.',
      '보라·자외선 쪽으로 갈수록 광자 에너지가 커서 화학결합을 끊을 만큼 강해집니다(자외선 차단이 필요한 이유).',
      '"빛이 파동이냐 입자냐"는 오래된 질문이었는데, 답은 <b>둘 다</b>입니다 — 이 이중성은 양자역학에서 더 깊이 다룹니다.'
    ],
    presets: [
      { name: '보라 (짧은 파장)', set: { lambda: 400 } },
      { name: '초록 (중간)', set: { lambda: 530 } },
      { name: '빨강 (긴 파장)', set: { lambda: 700 } }
    ],

    challenges: [
      { id: 'ch-highE', title: '광자 에너지 2.8 eV 이상',
        desc: '파장(λ)을 짧게 줄여서, 광자 하나의 에너지가 2.8 eV 이상이 되게 만들어보세요.',
        check: ctx => (1240 / ctx.P.lambda) >= 2.8,
        hint: 'λ를 443 nm 이하(보라·파랑 쪽)로 줄여보세요.' },
      { id: 'ch-red', title: '빨간빛 만들기',
        desc: '파장(λ)을 늘려서 색이 "빨강"이 되게 만들어보세요.',
        check: ctx => colorName(ctx.P.lambda) === '빨강',
        hint: 'λ를 625 nm 이상으로 늘려보세요.' }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const V = PS.view(w, h, { x0: -0.3, x1: 8.2, y0: -1.6, y1: 2.0, pad: 22, uniform: false });
      const cy = V.Y(-0.3);
      const col = wavelengthToRGB(p.lambda);

      D.text(ctx, '파동으로 본 빛', V.X(0), V.Y(1.15), { size: 11.5, color: '#93a2c4' });
      // 파동 표현
      ctx.save();
      ctx.strokeStyle = col.css; ctx.lineWidth = 3;
      if (hl === 'lambda') { ctx.shadowColor = col.css; ctx.shadowBlur = 14; }
      const k = (2 * Math.PI) / clamp(p.lambda / 190, 0.55, 2.4);
      ctx.beginPath();
      for (let x = -0.3; x <= 8.2; x += .04) {
        const y = 0.55 * Math.sin(k * (x - st.t * 4.2)) + 0.3;
        const px = V.X(x), py = V.Y(y);
        x === -0.3 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      D.text(ctx, '광자(알갱이)로 본 빛', V.X(0), V.Y(-1.05), { size: 11.5, color: '#93a2c4' });
      D.line(ctx, V.X(-0.3), V.Y(-1.3), V.X(8.2), V.Y(-1.3), { color: 'rgba(255,255,255,.12)', width: 1 });
      st.photons.forEach(ph => {
        D.dot(ctx, V.X(ph.x), V.Y(-1.3 + ph.y * .55), 5, col.css, hl === 'E');
      });

      // 스펙트럼 바
      const barY = h - 40, barX0 = V.X(-0.1), barX1 = V.X(7.2), barW = barX1 - barX0;
      for (let i = 0; i <= 60; i++) {
        const nm = 380 + (750 - 380) * i / 60;
        ctx.fillStyle = wavelengthToRGB(nm).css;
        ctx.fillRect(barX0 + barW * i / 60, barY, barW / 60 + 1, 14);
      }
      const mx = barX0 + barW * clamp((p.lambda - 380) / (750 - 380), 0, 1);
      D.line(ctx, mx, barY - 6, mx, barY + 20, { color: '#fff', width: 2, hot: hl === 'lambda' });
      D.tag(ctx, fmt(p.lambda, 0) + ' nm', mx, barY - 16, '#e8eefc', hl === 'lambda');
    }
  });
})();
