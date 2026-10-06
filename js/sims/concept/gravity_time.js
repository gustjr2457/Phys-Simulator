/* 초급·개념 — 중력과 시간 (거시세계)
   "빠르게 움직이면 시간이 느려진다(특수 상대성)"와
   "중력이 강한 곳에 있으면 시간이 느려진다(일반 상대성)"는
   원인이 다른 두 가지 효과라는 것을, 계산 없이 세 개의 시계로 나란히 비교해서 보여준다.
   속도 효과: dτ/dt = √(1 − β²)  (β = v/c) — 특수 상대성이론의 정확한 식.
   중력 효과: dτ/dt = √(1 − x)   (x = r_s/r, 슈바르츠실트 반지름 대비 거리) — 구대칭·정적인
   천체 바깥의 '제자리에 머무른 관측자'에 대한 일반 상대성이론(슈바르츠실트 계량)의 정확한 식.
   두 식 모두 근사가 아니라 정확한 형태이며, 시뮬레이션은 매 프레임 이 식으로 정확히
   경과 시간을 누적하므로(수치적분이 아니라 매 dt마다 해석식을 직접 곱해 더함) 오차가 쌓이지 않는다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { v: '#60a5fa', x: '#f472b6', ref: '#e8eefc' };
  const PERIOD = 3; // 시계 바늘이 한 바퀴 도는 데 걸리는 "경과 시간" 단위(연출용)

  function factorV(v) { return Math.sqrt(Math.max(0, 1 - v * v)); }
  function factorX(x) { return Math.sqrt(Math.max(0, 1 - x)); }

  function drawClock(ctx, cx, cy, r, elapsed, color, hot) {
    const ang = (elapsed / PERIOD) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    if (hot) { ctx.shadowColor = color; ctx.shadowBlur = 16; }
    ctx.strokeStyle = 'rgba(147,162,196,.5)'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      D.line(ctx, cx + Math.cos(a) * (r - 7), cy + Math.sin(a) * (r - 7),
        cx + Math.cos(a) * (r - 1.5), cy + Math.sin(a) * (r - 1.5),
        { color: 'rgba(147,162,196,.4)', width: 1.4 });
    }
    ctx.strokeStyle = color; ctx.lineWidth = hot ? 4 : 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * (r - 15), cy + Math.sin(ang) * (r - 15)); ctx.stroke();
    ctx.restore();
    D.dot(ctx, cx, cy, 3.6, color, hot);
  }

  PS.register({
    id: 'c-gravtime', mode: 'concept', category: '중력과 우주',
    title: '중력과 시간 — 왜 시간은 다르게 흐르는가?',
    sub: '빠르게 움직이거나, 중력이 강한 곳에 있으면 시간이 느려진다',
    tagline: '가운데는 지구에 남은 사람의 시계, 왼쪽은 빛에 가깝게 날아가는 로켓 안의 시계, 오른쪽은 중력이 아주 강한 곳(중성자별·블랙홀 근처)에 머무른 사람의 시계입니다. 슬라이더를 올려서 세 시계가 점점 다르게 흘러가는 걸 지켜보세요.',

    params: [
      { key: 'v', symbol: 'β', label: '로켓의 속력(빛의 속력 대비)', unit: 'c', min: 0, max: .999, step: .001, value: 0, color: C.v, dec: 3,
        where: '로켓이 <b>빛의 속력(c)의 몇 배</b>로 나는지입니다(β = v/c). 1에 가까워질수록(빛의 속력에 가까워질수록) 로켓 안의 시계가 기준 시계보다 눈에 띄게 느려집니다.' },
      { key: 'x', symbol: 'x', label: '중력 세기(얼마나 압축된 천체 근처인가)', unit: '', min: 0, max: .95, step: .01, value: 0, color: C.x, dec: 2,
        where: '그 위치가 <b>슈바르츠실트 반지름(r_s) 대비 얼마나 가까운지</b>(x = r_s/r)를 나타냅니다. 0이면 지구처럼 중력을 거의 못 느끼는 곳, 1에 가까우면 블랙홀의 사건의 지평선 바로 앞입니다.' }
    ],
    vars: {
      tref: { symbol: 'Δt', label: '기준 시계가 잰 시간', unit: '', color: C.ref, where: '가운데 <b>흰 시계</b>. 지구에 그대로 남은 사람의 시간입니다 — 항상 1초에 1초씩 흐릅니다.' },
      tauV: { symbol: 'Δτᵥ', label: '로켓 시계가 잰 시간', unit: '', color: C.v, where: '왼쪽 <b>파란 시계</b>. 로켓이 빠를수록 기준 시계보다 느리게 흐릅니다.' },
      tauX: { symbol: 'Δτₓ', label: '중력 속 시계가 잰 시간', unit: '', color: C.x, where: '오른쪽 <b>분홍 시계</b>. 중력이 강한 곳일수록 기준 시계보다 느리게 흐릅니다.' }
    },
    formulas: [
      { name: '속도 때문에(특수 상대성)', tpl: '{tauV} ⁄ {tref} = √(1 − {v}²)' },
      { name: '중력 때문에(일반 상대성)', tpl: '{tauX} ⁄ {tref} = √(1 − {x})' }
    ],

    init(p) { return { tauV: 0, tauX: 0 }; },
    step(st, p, dt) {
      st.tauV += factorV(p.v) * dt;
      st.tauX += factorX(p.x) * dt;
    },

    graphs: [{
      title: '경과 시간 – 기준 시계 시간', xmin: 6, window: 10, y0: 0,
      series: [
        { key: 'tauV', label: '로켓 시계', color: C.v },
        { key: 'tref', label: '기준 시계', color: C.ref },
        { key: 'tauX', label: '중력 속 시계', color: C.x }
      ]
    }],
    sample(st, p) { return { tauV: st.tauV, tref: st.t, tauX: st.tauX }; },

    readouts(st, p) {
      const fv = factorV(p.v), fx = factorX(p.x);
      return [
        { label: '기준 시계 경과', value: st.t, dec: 2, color: C.ref },
        { label: '로켓 시계 경과', value: st.tauV, dec: 2, color: C.v },
        { label: '중력 속 시계 경과', value: st.tauX, dec: 2, color: C.x },
        { label: '로켓 시계가 늦는 정도', value: (1 - fv) * 100, unit: '%', dec: 2, color: C.v },
        { label: '중력 속 시계가 늦는 정도', value: (1 - fx) * 100, unit: '%', dec: 2, color: C.x, wide: true }
      ];
    },

    notes: [
      '<b>속도 때문에 시간이 느려지는 것(특수 상대성)</b>과 <b>중력 때문에 시간이 느려지는 것(일반 상대성)</b>은 결론("느려진다")은 닮았지만 원인이 다른 별개의 효과입니다.',
      '"로켓을 타고 먼 우주로 나가면 시간이 어떻게 바뀔까?"는 보통 <b>속도 효과</b>를 말하는 것입니다 — 우주 공간 자체는 중력이 거의 없어서(x가 오히려 0에 가까워짐), 단지 멀리 가는 것만으로는 시간이 거의 달라지지 않습니다. 시간이 크게 달라지려면 <b>빛의 속력에 가깝도록 빨라야</b> 합니다.',
      '반대로 <b>중력이 강한 곳(중성자별, 블랙홀 근처)에 머무르면</b>, 빠르게 움직이지 않고 가만히 있어도 시간이 느려집니다 — 이것이 진짜 "중력 시간 지연"입니다.',
      '실제 GPS 위성은 두 효과를 <b>동시에</b> 받습니다. 빠르게 돌아서(속도 효과) 시계가 느려지지만, 지구보다 중력이 약한 높은 궤도에 있어서(중력 효과) 시계가 더 빨라지는 효과가 더 큽니다 — 결과적으로 위성 시계는 지상보다 하루에 약 38마이크로초 더 빨리 갑니다. 보정을 안 하면 위치 오차가 하루에 수 km씩 쌓입니다.',
      '이 시뮬레이션의 속도·중력 세기는 <b>이해를 돕기 위해 크게 과장한 값</b>입니다. 실제 로켓의 속력은 빛의 속력의 0.01%에도 못 미치고, 지구 표면의 중력은 이 x값으로 치면 10억분의 1도 안 됩니다.'
    ],
    presets: [
      { name: '정지 상태(효과 없음)', set: { v: 0, x: 0 } },
      { name: '빛의 속력의 80%로 비행', set: { v: .8, x: 0 } },
      { name: '거의 빛의 속력(0.999c)', set: { v: .999, x: 0 } },
      { name: '중성자별 표면 근처', set: { v: 0, x: .3 } },
      { name: '블랙홀 지평선 바로 앞', set: { v: 0, x: .92 } },
      { name: '둘 다 극단적으로', set: { v: .95, x: .8 } }
    ],

    challenges: [
      { id: 'ch-speed80', title: '빛의 속력의 80% 이상으로', desc: '로켓의 속력(β)을 0.8 이상으로 올려서, 로켓 시계가 기준 시계보다 눈에 띄게 느리게 가게 만들어보세요.',
        check: ctx => ctx.P.v >= 0.8,
        hint: '첫 번째 슬라이더(β)를 오른쪽 끝 근처로 옮겨보세요.' },
      { id: 'ch-grav30', title: '중성자별 근처까지', desc: '중력 세기(x)를 0.3 이상으로 올려서, 중력 시간 지연을 만들어보세요.',
        check: ctx => ctx.P.x >= 0.3,
        hint: '두 번째 슬라이더(x)를 절반 정도 이상으로 옮겨보세요.' }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const cy = h * 0.42, r = Math.max(34, Math.min(70, w * 0.09, h * 0.26));
      const gap = Math.min(230, w * .27);
      const cxL = w / 2 - gap, cxM = w / 2, cxR = w / 2 + gap;
      const fv = factorV(p.v), fx = factorX(p.x);

      D.text(ctx, '같은 시간 동안 세 시계를 나란히 비교합니다', w / 2, 22, { size: 12.5, color: '#e8eefc', align: 'center', bold: true });

      drawClock(ctx, cxL, cy, r, st.tauV, C.v, hl === 'v' || hl === 'tauV');
      drawClock(ctx, cxM, cy, r, st.t, C.ref, hl === 'tref');
      drawClock(ctx, cxR, cy, r, st.tauX, C.x, hl === 'x' || hl === 'tauX');

      D.text(ctx, '로켓 시계 (β=' + fmt(p.v, 3) + 'c)', cxL, cy + r + 22, { size: 11.5, color: C.v, align: 'center', bold: hl === 'v' });
      D.text(ctx, '느려진 비율: ' + fmt((1 - fv) * 100, 2) + '%', cxL, cy + r + 38, { size: 10.5, color: '#61719a', align: 'center' });

      D.text(ctx, '기준 시계 (지구)', cxM, cy + r + 22, { size: 11.5, color: C.ref, align: 'center', bold: hl === 'tref' });
      D.text(ctx, '항상 그대로 흐름', cxM, cy + r + 38, { size: 10.5, color: '#61719a', align: 'center' });

      D.text(ctx, '중력 속 시계 (x=' + fmt(p.x, 2) + ')', cxR, cy + r + 22, { size: 11.5, color: C.x, align: 'center', bold: hl === 'x' });
      D.text(ctx, '느려진 비율: ' + fmt((1 - fx) * 100, 2) + '%', cxR, cy + r + 38, { size: 10.5, color: '#61719a', align: 'center' });

      const baseY = h - 62;
      D.text(ctx, '경과 시간(임의 단위) — 막대가 길수록 그 시계 입장에서 더 많은 시간이 흐른 것', w / 2, baseY - 14, { size: 10.5, color: '#61719a', align: 'center' });
      const barW = Math.min(150, gap * .6), maxE = Math.max(st.t, 0.6);
      D.bar(ctx, cxL - barW / 2, baseY, barW, 12, st.tauV, maxE, C.v, null, hl === 'v' || hl === 'tauV');
      D.bar(ctx, cxM - barW / 2, baseY, barW, 12, st.t, maxE, C.ref, null, hl === 'tref');
      D.bar(ctx, cxR - barW / 2, baseY, barW, 12, st.tauX, maxE, C.x, null, hl === 'x' || hl === 'tauX');
    }
  });
})();
