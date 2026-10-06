/* 초급·개념 — 블랙홀과 중성자별이란 무엇인가? (거시세계)
   별이 죽으면서 남기는 두 가지 극단적인 천체를, "같은 질량을 점점 더 작게 압축한다면?"
   이라는 하나의 실험으로 통일해서 보여준다. 반지름을 줄일수록 탈출 속도가 빨라지다가,
   빛의 속력에 도달하는 순간(=슈바르츠실트 반지름) 블랙홀이 된다.
   모든 수치는 실제 SI 단위 그대로 계산한다(근사가 아닌 뉴턴 탈출 속도의 정확한 식).
   흥미로운 사실: 슈바르츠실트 반지름과 똑같은 식(r_s=2GM/c²)은 사실 아인슈타인보다
   150년 앞서 존 미첼(1783)·라플라스가 순수 뉴턴 역학만으로 "탈출 속도가 빛보다 빠른
   별"을 상상하며 유도했었다 — 일반상대성이론이 없어도 나오는 값이라는 뜻이며, 그래서
   이 시뮬레이션은 순수 고전역학(탈출 속도) 공식만으로도 정확히 같은 r_s를 보여준다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { M: '#fbbf24', R: '#60a5fa', vesc: '#f472b6', bh: '#93a2c4' };
  const G = 6.674e-11, C_LIGHT = 2.998e8, M_SUN = 1.989e30;

  function compute(p) {
    const M_kg = p.M * M_SUN;
    const R_m = Math.pow(10, p.logR) * 1000; // logR = log10(반지름[km])
    const rs_m = 2 * G * M_kg / (C_LIGHT * C_LIGHT);
    const vesc = Math.sqrt(2 * G * M_kg / R_m); // 뉴턴 탈출 속도(정확한 식) — R_m이 rs보다 작아지면 c를 넘어서는데, 이는 "고전 공식이 더는 유효하지 않다"는 신호 그 자체
    const density = M_kg / ((4 / 3) * Math.PI * Math.pow(R_m, 3));
    const isBH = R_m <= rs_m;
    return { M_kg, R_m, rs_m, vesc, density, isBH };
  }

  function classify(c) {
    if (c.isBH) return '블랙홀 (사건의 지평선 안쪽)';
    if (c.density > 1e16) return '중성자별급 밀도의 별';
    if (c.density > 1e8) return '백색왜성급 밀도의 별';
    return '보통의 별 정도 밀도';
  }

  PS.register({
    id: 'c-compact', mode: 'concept', category: '거시세계',
    title: '블랙홀과 중성자별이란 무엇인가?',
    sub: '같은 질량을 점점 더 작게 압축하면 생기는 일',
    tagline: '별이 다 타고 나면, 남은 질량은 중력을 버티지 못하고 스스로 짜부라집니다(중력 붕괴). 반지름 슬라이더를 왼쪽으로 밀어서 별을 점점 압축해 보세요 — 밀도가 상상하기 힘든 수준까지 오르다가, 어느 순간 탈출 속도가 빛의 속력을 넘어서며 블랙홀이 됩니다.',

    params: [
      { key: 'M', symbol: 'M', label: '별의 질량(태양 질량 대비)', unit: 'M☉', min: 1.2, max: 20, step: .1, value: 1.4, color: C.M, dec: 1,
        where: '이 천체의 <b>질량</b>입니다. 태양 질량(M☉)을 1로 둔 단위입니다. 질량이 클수록 같은 반지름이라도 훨씬 빨리 블랙홀이 됩니다.' },
      { key: 'logR', symbol: 'log R', label: '압축 정도(반지름, 로그 스케일)', unit: '', min: 0.5, max: 5.85, step: .01, value: 4, color: C.R, dec: 2,
        where: '반지름이 워낙 넓은 범위(수 km ~ 태양 반지름)를 오가기 때문에 <b>로그 스케일</b>로 조절합니다. 오른쪽 측정값 칸에서 실제 반지름(km)을 확인하세요. 왼쪽으로 밀수록(값이 작아질수록) 더 작게 압축됩니다.' }
    ],
    vars: {
      R: { symbol: 'R', label: '실제 반지름', unit: 'km', color: C.R, where: '지금 압축된 <b>실제 반지름</b>입니다.' },
      vesc: { symbol: 'v_esc', label: '탈출 속도', unit: '', color: C.vesc, where: '이 천체 표면에서 <b>영원히 벗어나려면 필요한 최소 속도</b>입니다. 빛의 속력(c)에 도달하면 그 무엇도(빛조차도) 빠져나갈 수 없습니다.' },
      rs: { symbol: 'r_s', label: '슈바르츠실트 반지름', unit: 'km', color: '#fb7185', where: '탈출 속도가 정확히 빛의 속력이 되는 반지름입니다. 실제 반지름이 이보다 작아지면 블랙홀입니다.' }
    },
    formulas: [
      { name: '탈출 속도(뉴턴 역학, 정확한 식)', tpl: '{vesc} = √(2G{M} ⁄ {R})' },
      { name: '블랙홀이 되는 기준(탈출 속도 = 빛의 속력)', tpl: '{rs} = 2G{M} ⁄ c²' }
    ],

    init(p) { return { t: 0 }; },
    step(st, p, dt) { st.t += dt; },

    readouts(st, p) {
      const c = compute(p);
      return [
        { label: '실제 반지름', value: c.R_m / 1000, unit: 'km', dec: c.R_m / 1000 < 100 ? 1 : 0, color: C.R },
        { label: '탈출 속도(빛의 속력 대비)', value: Math.min(c.vesc / C_LIGHT, 1) * 100, unit: '%', dec: 2, color: C.vesc },
        { label: '평균 밀도', value: c.density, unit: 'kg/m³', dec: 0, color: C.bh, wide: true },
        { label: '슈바르츠실트 반지름', value: c.rs_m / 1000, dec: c.rs_m / 1000 < 100 ? 2 : 0, unit: 'km', color: '#fb7185' },
        { label: '지금 상태', value: classify(c), color: c.isBH ? '#fb7185' : '#e8eefc', wide: true }
      ];
    },

    notes: [
      '별이 다 타서 더는 바깥으로 밀어낼 에너지가 없으면, 오직 <b>중력</b>만 남아 스스로를 계속 압축합니다.',
      '어중간한 압축에서 멈추는 별이 <b>중성자별</b>입니다 — 원자핵 정도의 밀도(10¹⁷ kg/m³ 안팎)까지 짜부라지지만, 중성자들끼리 버티는 힘(중성자 축퇴압)이 더 이상의 붕괴를 막아 줍니다.',
      '중성자 축퇴압조차 버티지 못할 만큼 질량이 크면(대략 태양의 2~3배 이상), 아무것도 멈추지 못하고 <b>블랙홀</b>이 될 때까지 계속 압축됩니다.',
      '흥미롭게도 "탈출 속도가 빛보다 빨라지는 반지름"이라는 발상 자체는 아인슈타인이 아니라, <b>1783년 존 미첼</b>이 순수 뉴턴 역학만으로 먼저 떠올렸습니다. 다만 빛이 정말로 빠져나오지 못하는 진짜 이유(시공간이 휘어서 "탈출"이라는 개념 자체가 사라짐)를 설명한 것은 아인슈타인의 일반상대성이론입니다.',
      '이 시뮬레이션의 반지름은 로그 스케일입니다 — 슬라이더를 아주 조금만 왼쪽으로 밀어도 실제 반지름은 훨씬 크게 줄어듭니다.'
    ],
    presets: [
      { name: '태양 정도의 보통 별', set: { M: 2, logR: 5.7 } },
      { name: '전형적인 중성자별(반지름 12km)', set: { M: 1.4, logR: Math.log10(12) } },
      { name: '블랙홀 직전까지 압축', set: { M: 3, logR: 1.1 } },
      { name: '항성 블랙홀(태양 질량의 10배)', set: { M: 10, logR: 0.6 } }
    ],

    challenges: [
      { id: 'ch-makebh', title: '블랙홀 직접 만들기',
        desc: '반지름(log R)을 줄여서, 이 질량 그대로 블랙홀(탈출 속도 ≥ 빛의 속력)을 만들어보세요.',
        check: ctx => compute(ctx.P).isBH,
        hint: 'log R 슬라이더를 왼쪽 끝 근처로 옮겨보세요. 질량(M)이 클수록 더 쉽게 블랙홀이 됩니다.' },
      { id: 'ch-neutronstar', title: '중성자별 직전까지, 블랙홀은 안 되게',
        desc: '아직 블랙홀은 아니면서, 밀도가 중성자별 수준(10¹⁷ kg/m³ 이상)이 되게 압축해보세요.',
        check: ctx => { const c = compute(ctx.P); return !c.isBH && c.density >= 1e17; },
        hint: '질량은 낮게(1.4 정도), log R은 1 근처로 맞춰보세요.' }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const c = compute(p);
      const cx = w / 2, cy = h / 2 - 10;

      // 압축 정도에 따른 시각적 반지름(로그 스케일과 대략 비례, 화면에 맞게 클램프)
      const visR = clamp(10 + (p.logR - 0.5) / (5.85 - 0.5) * 95, 10, 105);

      if (c.isBH) {
        ctx.save();
        ctx.fillStyle = '#020308';
        ctx.beginPath(); ctx.arc(cx, cy, visR, 0, 7); ctx.fill();
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.globalAlpha = .8 + Math.sin(st.t * 3) * .15;
        ctx.beginPath(); ctx.arc(cx, cy, visR + 4, 0, 7); ctx.stroke();
        ctx.restore();
        D.tag(ctx, '사건의 지평선', cx, cy - visR - 20, '#fbbf24', true);
        // 빨려 들어가는 입자 몇 개(장식용 애니메이션)
        for (let i = 0; i < 5; i++) {
          const ang = i * 1.4 + st.t * (1.2 + i * .3);
          const rr = visR + 30 + ((st.t * 40 + i * 60) % 140);
          const rad = visR + 170 - rr;
          if (rad < visR + 2) continue;
          D.dot(ctx, cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad * .4, 2.4, '#93a2c4', false);
        }
      } else {
        const glow = c.density > 1e16 ? '#dbeafe' : (c.density > 1e8 ? '#a78bfa' : '#fde68a');
        ctx.save();
        const g = ctx.createRadialGradient(cx - visR * .3, cy - visR * .3, 1, cx, cy, visR);
        g.addColorStop(0, '#ffffff'); g.addColorStop(.4, glow); g.addColorStop(1, C.M);
        ctx.fillStyle = g;
        ctx.shadowColor = glow; ctx.shadowBlur = 24 + 10 * Math.sin(st.t * 2);
        ctx.beginPath(); ctx.arc(cx, cy, visR, 0, 7); ctx.fill();
        ctx.restore();
      }

      D.text(ctx, classify(c), cx, cy + visR + 34, { size: 13, color: c.isBH ? '#fb7185' : '#e8eefc', align: 'center', bold: true });

      // 탈출 속도 게이지(빛의 속력 대비)
      const gaugeW = Math.min(360, w * .5), gx = cx - gaugeW / 2, gy = h - 56;
      const frac = clamp(c.vesc / C_LIGHT, 0, 1);
      D.text(ctx, '탈출 속도 (빛의 속력 대비)', cx, gy - 12, { size: 10.5, color: '#61719a', align: 'center' });
      D.bar(ctx, gx, gy, gaugeW, 14, frac, 1, frac > .95 ? '#fb7185' : C.vesc, null, hl === 'vesc');
      D.text(ctx, fmt(frac * 100, 1) + '% c', cx, gy + 28, { size: 11.5, color: '#e8eefc', align: 'center' });
    }
  });
})();
