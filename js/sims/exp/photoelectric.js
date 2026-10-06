/* [유명한 실험] 광전효과(1905, 아인슈타인) — 빛은 알갱이(광자)로도 온다
   금속에 빛을 쬐면 전자가 튀어나온다. 그런데 아무리 세게(밝게) 비춰도
   진동수(색)가 문턱값보다 낮으면 전자가 "전혀" 안 나오고, 진동수만
   문턱을 넘으면 아주 어두운 빛에도 "즉시" 전자가 튀어나온다 — 빛이
   그냥 파동(에너지가 세기에만 비례)이라면 절대 설명되지 않는 현상이다.
   아인슈타인은 빛이 hf만큼의 에너지 알갱이(광자) 뭉치로 온다고 설명했다.
   초급 '빛이란 무엇인가?'의 입자성(광자 에너지 E=1240/λ)이 실제로
   측정 가능한 현상으로 확인되는 지점. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { phi: '#fbbf24', lambda: '#60a5fa', I: '#a78bfa', KEmax: '#34d399' };
  const M_E = 9.109e-31, ECH = 1.602e-19; // 전자 질량(kg), 기본전하(C)

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

  function photonE_eV(p) { return 1240 / p.lambda; } // E(eV) ≈ 1240 / λ(nm)
  function KEmax_eV(p) { return Math.max(0, photonE_eV(p) - p.phi); }
  function willEmit(p) { return photonE_eV(p) > p.phi; }
  function vMax_kms(p) { // KE(eV)*e = 1/2 m v^2  →  v = sqrt(2 KE_J / m)
    const KE_J = KEmax_eV(p) * ECH;
    return Math.sqrt(2 * KE_J / M_E) / 1000;
  }
  function thresholdLambda(p) { return 1240 / p.phi; } // hf=φ가 되는 파장(이보다 길면 절대 안 나옴)

  PS.register({
    id: 'exp-photoelectric', mode: 'exp', category: '빛의 정체를 밝히다',
    title: '광전효과 (1905)',
    sub: '빛은 알갱이(광자)로도 온다',
    tagline: '금속판에 빛을 비춥니다. 빛의 색(파장)과 밝기(세기)를 각각 바꿔 보세요 — 전자가 튀어나오는지 안 나오는지는 오직 색(진동수)에만 달려 있고, 밝기는 튀어나오는 전자의 "개수"만 바꿀 뿐 "속도"는 절대 바꾸지 못합니다.',

    params: [
      { key: 'phi', symbol: 'φ', label: '금속의 일함수(전자를 떼어내는 데 필요한 최소 에너지)', unit: 'eV', min: 1.5, max: 6, step: .1, value: 2.3, color: C.phi, reset: true,
        where: '이 금속에서 전자 하나를 떼어내는 데 <b>최소한 필요한 에너지</b>입니다. 광자 에너지가 이보다 작으면 아무리 많이 쏴도 전자가 안 나옵니다.' },
      { key: 'lambda', symbol: 'λ', label: '빛의 파장(색)', unit: 'nm', min: 380, max: 750, step: 5, value: 500, color: C.lambda, reset: true,
        where: '빛의 <b>색</b>입니다. 파장이 짧을수록(보라·파랑 쪽) 광자 하나의 에너지가 커서 전자를 떼어내기 쉬워집니다.' },
      { key: 'I', symbol: 'I', label: '빛의 세기(밝기)', unit: '', min: .2, max: 3, step: .1, value: 1, color: C.I,
        where: '빛의 <b>밝기</b>입니다. 1초에 날아오는 광자의 개수를 정합니다 — 전자가 튀어나오는 <b>속도(에너지)</b>에는 전혀 영향을 주지 않고, 오직 튀어나오는 <b>개수(전류)</b>만 늘립니다.' }
    ],
    vars: {
      KEmax: { symbol: 'KE_max', label: '튀어나온 전자의 최대 운동에너지', unit: 'eV', color: C.KEmax,
        where: '전자가 튀어나올 때 갖는 <b>최대 속도(에너지)</b>입니다. 오직 빛의 색(파장)에만 좌우되고, 밝기와는 무관합니다.' }
    },
    formulas: [
      { name: '아인슈타인의 광전효과 방정식', tpl: '{KEmax} = hf − {phi}' },
      { name: '전자가 튀어나오는 조건(문턱 진동수)', tpl: 'hf > {phi}  (그렇지 않으면 얼마나 밝든 전자가 0개)' }
    ],

    init(p) { return { electrons: [], fizzles: [], acc: 0 }; },
    step(st, p, dt) {
      const baseRate = 12; // I=1일 때 초당 광자 수(시각화용)
      st.acc += baseRate * p.I * dt;
      while (st.acc >= 1) {
        st.acc -= 1;
        const y = (Math.random() * 2 - 1) * 0.7;
        if (willEmit(p)) {
          st.electrons.push({ y, born: st.t, v: vMax_kms(p), ang: (Math.random() * 2 - 1) * 0.35 });
        } else {
          st.fizzles.push({ y, born: st.t });
        }
      }
      st.electrons = st.electrons.filter(e => st.t - e.born < 1.1);
      st.fizzles = st.fizzles.filter(f => st.t - f.born < 0.35);
    },

    readouts(st, p) {
      const emit = willEmit(p);
      return [
        { label: '광자 에너지 hf', value: photonE_eV(p), unit: 'eV', dec: 2, color: C.lambda },
        { label: '전자의 최대 운동에너지 KE_max', value: KEmax_eV(p), unit: 'eV', dec: 2, color: C.KEmax },
        { label: '전자의 최대 속력', value: emit ? vMax_kms(p) : 0, unit: 'km/s', dec: 0, color: C.KEmax },
        { label: '이 금속의 문턱 파장(이보다 길면 절대 안 나옴)', value: thresholdLambda(p), unit: 'nm', dec: 0, color: C.phi },
        { label: '상태', value: emit ? '전자가 튀어나옴' : '전자가 전혀 안 나옴 — 빛을 아무리 세게 비춰도 마찬가지', wide: true }
      ];
    },

    notes: [
      '빛이 그냥 <b>파동</b>이라면, 아무리 진동수가 낮아도 <b>충분히 오래, 세게</b> 비추면 언젠가 전자가 튀어나와야 합니다. 실제로는 진동수가 문턱값보다 낮으면 <b>몇 시간을 비춰도 전자가 0개</b>입니다.',
      '빛을 <b>광자(에너지 hf를 가진 알갱이)</b>라고 생각하면 바로 설명됩니다 — 광자 한 개가 전자 한 개와 부딪혀 그 에너지를 통째로 넘겨줄 뿐이니, 광자 하나의 에너지(hf)가 문턱(φ)을 못 넘으면 <b>몇 개를 쏘든 소용없습니다</b>.',
      '빛을 더 <b>밝게(세게)</b> 하면 광자 개수가 늘어 튀어나오는 전자의 <b>개수(전류)</b>는 늘지만, 전자 하나하나의 <b>속도(에너지)</b>는 조금도 빨라지지 않습니다 — 오직 색(파장)만 그 속도를 정합니다.',
      '이 실험으로 아인슈타인은 1921년 노벨 물리학상을 받았습니다 — 상대성이론이 아니라 <b>바로 이 광전효과</b>로 받았다는 것이 의외로 잘 알려져 있지 않습니다.'
    ],
    presets: [
      { name: '기본(나트륨, 초록빛)', set: { phi: 2.3, lambda: 500, I: 1 } },
      { name: '진동수 부족(빨간빛, 약하게 → 전자 안 나옴)', set: { phi: 2.3, lambda: 700, I: .3 } },
      { name: '같은 빨간빛, 훨씬 밝게(그래도 안 나옴!)', set: { phi: 2.3, lambda: 700, I: 3 } },
      { name: '자외선에 가까운 짧은 파장(빠른 전자)', set: { phi: 2.3, lambda: 380, I: 1 } },
      { name: '일함수가 큰 금속(백금)', set: { phi: 5.6, lambda: 380, I: 1.5 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const plateX = w * .34, cy = h / 2, plateH = 260;
      const col = wavelengthToRGB(p.lambda).css;
      const emit = willEmit(p);

      // 금속판
      ctx.save();
      if (hl === 'phi') { ctx.shadowColor = C.phi; ctx.shadowBlur = 16; }
      D.line(ctx, plateX, cy - plateH / 2, plateX, cy + plateH / 2, { color: '#c8d3ef', width: 10 });
      ctx.restore();
      D.text(ctx, '금속판 (φ=' + fmt(p.phi, 1) + ' eV)', plateX, cy - plateH / 2 - 14, { size: 11.5, color: '#e8eefc', align: 'center' });

      // 들어오는 빛(광자) 화살표 몇 개
      for (let i = -2; i <= 2; i++) {
        const y = cy + i * 44;
        D.arrow(ctx, plateX - 150, y, 90, 0, { color: col, width: 2.4, hot: hl === 'lambda', head: 9 });
      }
      D.tag(ctx, 'λ=' + fmt(p.lambda, 0) + 'nm', plateX - 150, cy - plateH / 2 - 30, col, hl === 'lambda');

      // 전자(튀어나온 것들)
      st.electrons.forEach(e => {
        const age = st.t - e.born;
        const dist = e.v * 2.2 * age; // 시각화용 스케일(실제 km/s를 그대로 픽셀 속도로 쓰면 너무 빠름)
        const x = plateX + Math.min(220, dist);
        const y = cy + e.y * plateH / 2 + Math.sin(e.ang) * Math.min(220, dist) * .3;
        const alpha = clamp(1 - age / 1.1, 0, 1);
        ctx.save(); ctx.globalAlpha = alpha; ctx.shadowColor = C.KEmax; ctx.shadowBlur = 8;
        D.dot(ctx, x, y, 4, C.KEmax, false);
        ctx.restore();
      });
      // 흡수만 되고 전자는 안 나온 경우(회색 fizzle)
      st.fizzles.forEach(f => {
        const age = st.t - f.born;
        const alpha = clamp(1 - age / .35, 0, 1);
        ctx.save(); ctx.globalAlpha = alpha * .8;
        D.dot(ctx, plateX + 6, cy + f.y * plateH / 2, 5, '#61719a', false);
        ctx.restore();
      });

      if (!emit) {
        D.tag(ctx, '광자 에너지가 부족 — 전자가 전혀 안 나옴', plateX + 130, cy - plateH / 2 - 10, '#61719a', true);
      } else {
        D.text(ctx, '전자 최대 속력 ≈ ' + fmt(vMax_kms(p), 0) + ' km/s', plateX + 130, cy + plateH / 2 + 26, { size: 11, color: C.KEmax, align: 'center' });
      }

      D.text(ctx, 'hf = ' + fmt(photonE_eV(p), 2) + ' eV   φ = ' + fmt(p.phi, 2) + ' eV   KE_max = ' + fmt(KEmax_eV(p), 2) + ' eV',
        16, h - 14, { size: 10.5, color: '#93a2c4' });
    }
  });
})();
