/* 초급·개념 — 원자란 무엇인가? (미시세계)
   '입자란 무엇인가?'에서 물질이 알갱이(입자)로 되어 있다는 것을 봤다면,
   이번엔 그 알갱이 하나(원자) 자체도 더 작은 구조 — 가운데의 원자핵(양성자·중성자)과
   그 둘레를 도는 전자로 되어 있다는 것을 계산 없이 보여준다.
   실제 양자역학적 궤도가 아니라 이해를 돕기 위한 단순화된(보어) 모형이다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { Z: '#fbbf24', p: '#fb7185', n: '#93a2c4', e: '#60a5fa' };

  // Z(양성자 수) → [원소이름, 기호, 가장 흔한 동위원소의 중성자 수]
  const TABLE = {
    1: ['수소', 'H', 0], 2: ['헬륨', 'He', 2], 3: ['리튬', 'Li', 4], 4: ['베릴륨', 'Be', 5],
    5: ['붕소', 'B', 6], 6: ['탄소', 'C', 6], 7: ['질소', 'N', 7], 8: ['산소', 'O', 8]
  };
  function shells(Z) {
    // 단순화된 보어 껍질 채우기: 1번 껍질 최대 2개, 2번 껍질 최대 8개(Z ≤ 8 범위에서 충분)
    const s = [];
    let left = Z;
    const cap = [2, 8];
    for (let i = 0; i < cap.length && left > 0; i++) { const n = Math.min(left, cap[i]); s.push(n); left -= n; }
    return s;
  }

  PS.register({
    id: 'c-atom', mode: 'concept', category: '미시세계',
    title: '원자란 무엇인가?',
    sub: '알갱이(입자) 그 자체도 더 작은 구조로 되어 있다',
    tagline: '가운데 뭉친 알갱이가 원자핵(양성자+중성자), 그 둘레를 도는 작은 점이 전자입니다. 양성자 수를 바꿔서 서로 다른 원소가 되는 걸 확인하세요.',

    params: [
      { key: 'Z', symbol: 'Z', label: '양성자 수', unit: '', min: 1, max: 8, step: 1, value: 6, color: C.Z, dec: 0,
        where: '<b>원자핵 속 빨간 알갱이(양성자)의 개수</b>입니다. 이 숫자 하나가 "무슨 원소인가"를 완전히 결정합니다 — 수소면 1, 탄소면 6, 산소면 8.' }
    ],
    vars: {
      p: { symbol: 'p⁺', label: '양성자', unit: '', color: C.p, where: '원자핵 속 <b>빨간 알갱이</b>. (+) 전하를 가집니다.' },
      n: { symbol: 'n', label: '중성자', unit: '', color: C.n, where: '원자핵 속 <b>회색 알갱이</b>. 전하가 없고, 핵을 무겁게·안정되게 붙잡아 줍니다.' },
      e: { symbol: 'e⁻', label: '전자', unit: '', color: C.e, where: '핵 둘레를 도는 <b>파란 점</b>. (−) 전하를 가지며, 원자 전체를 전기적으로 중성으로 만들기 위해 양성자와 같은 수만큼 있습니다.' }
    },
    formulas: [
      { name: '원자는 전기적으로 중성', tpl: '{e} 의 개수 = {p} 의 개수' },
      { name: '원소를 정하는 것', tpl: '{p} 의 개수(={Z})가 원소를 정한다' }
    ],

    init(p) { return { t: 0 }; },
    step(st, p, dt) { st.t += dt; },

    readouts(st, p) {
      const info = TABLE[Math.round(p.Z)] || ['?', '?', 0];
      return [
        { label: '원소', value: info[0] + ' (' + info[1] + ')', color: C.Z, wide: true },
        { label: '양성자 수', value: p.Z, dec: 0, color: C.p },
        { label: '중성자 수(가장 흔한 동위원소)', value: info[2], dec: 0, color: C.n },
        { label: '전자 수', value: p.Z, dec: 0, color: C.e }
      ];
    },

    notes: [
      '<b>양성자 수</b> 하나만 바뀌어도 완전히 다른 원소가 됩니다 — 탄소(6)에 양성자 하나가 더 붙으면 질소(7)!',
      '원자는 늘 <b>양성자 수 = 전자 수</b>라서 전체적으로 전기를 띠지 않습니다(중성).',
      '중성자 수는 같은 원소라도 조금씩 다를 수 있습니다(동위원소) — 여기서는 가장 흔한 경우만 보여줍니다.',
      '실제 전자는 이렇게 정해진 원 궤도를 도는 것이 아니라 "구름처럼 퍼져 있다"고 보는 것이 더 정확한데, 이는 양자역학 트랙에서 다룹니다.'
    ],
    presets: [
      { name: '수소 (Z=1) — 가장 간단한 원자', set: { Z: 1 } },
      { name: '탄소 (Z=6) — 생명의 원소', set: { Z: 6 } },
      { name: '산소 (Z=8) — 우리가 숨쉬는 기체', set: { Z: 8 } }
    ],

    challenges: [
      { id: 'ch-nitrogen', title: '질소 만들기 (Z=7)',
        desc: '양성자 수(Z)를 조절해서 질소 원자(Z=7)를 만들어보세요.',
        check: ctx => Math.round(ctx.P.Z) === 7,
        hint: 'Z 슬라이더를 7로 맞춰보세요.' },
      { id: 'ch-oxygen', title: '산소 만들기 (Z=8)',
        desc: '이 트랙에서 만들 수 있는 가장 무거운 원소, 산소(Z=8)를 만들어보세요.',
        check: ctx => Math.round(ctx.P.Z) === 8,
        hint: 'Z 슬라이더를 오른쪽 끝까지 올려보세요.' }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const cx = w / 2, cy = h / 2;
      const Z = Math.round(p.Z);
      const info = TABLE[Z] || ['?', '?', 0];
      const nNeu = info[2];

      // 전자 껍질
      const sh = shells(Z);
      const shellR = [70, 136];
      sh.forEach((cnt, i) => {
        const r = shellR[i];
        ctx.save();
        ctx.strokeStyle = 'rgba(96,165,250,.25)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
        ctx.restore();
        for (let k = 0; k < cnt; k++) {
          const ang = st.t * (0.6 + i * .25) + (2 * Math.PI * k / cnt);
          const ex = cx + r * Math.cos(ang), ey = cy + r * Math.sin(ang);
          D.dot(ctx, ex, ey, 7, C.e, hl === 'e');
        }
      });

      // 원자핵: 양성자 + 중성자를 해바라기 나선 배치로 촘촘히 채운다
      const order = [];
      { let pi = 0, ni = 0; while (pi < Z || ni < nNeu) { if (pi < Z) { order.push('p'); pi++; } if (ni < nNeu) { order.push('n'); ni++; } } }
      const total = order.length;
      const nucR = 9 + Math.sqrt(total) * 5.2;
      const GOLDEN = Math.PI * (3 - Math.sqrt(5));
      order.forEach((kind, i) => {
        const ang = i * GOLDEN;
        const rr = nucR * Math.sqrt((i + 0.5) / total);
        const px = cx + rr * Math.cos(ang), py = cy + rr * Math.sin(ang);
        D.dot(ctx, px, py, 6.5, kind === 'p' ? C.p : C.n, (kind === 'p' && hl === 'p') || (kind === 'n' && hl === 'n'));
      });

      D.text(ctx, info[0] + ' (' + info[1] + ')', cx, cy - shellR[sh.length - 1] - 30, { size: 16, color: '#e8eefc', align: 'center', bold: true });
      D.text(ctx, '양성자 ' + Z + ' · 중성자 ' + nNeu + ' · 전자 ' + Z, cx, cy - shellR[sh.length - 1] - 10, { size: 11, color: '#93a2c4', align: 'center' });
    }
  });
})();
