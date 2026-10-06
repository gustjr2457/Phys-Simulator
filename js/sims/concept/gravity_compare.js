/* 초급·개념 — 중력이란 무엇인가? (거시세계)
   같은 궤도 운동 하나를 두 가지 설명으로 나란히 보여준다.
   왼쪽(뉴턴): "질량을 가진 두 물체가 서로 끌어당기는 힘"(원격작용) — F = GMm/r².
   오른쪽(아인슈타인): "질량이 그 주변의 시공간을 휘게 만들고, 물체는 그 휘어진 길을
   따라(힘을 받지 않고) 자연스럽게 움직인다"는 것을, 고무판에 무거운 공을 올려둔
   비유(격자 왜곡)로 표현한다.
   주의(단순화): 실제로 두 물체가 그리는 궤적은 왼쪽·오른쪽 모두 "같은" 뉴턴 중력
   방정식으로 계산한 하나의 궤적이다 — 이는 부정확한 것이 아니라, 태양계처럼 중력이
   약하고 속도가 느린 상황에서는 아인슈타인의 일반상대성이론이 뉴턴의 예측과 사실상
   같은 답을 준다는 실제 사실(약한 장 극한)을 반영한 것이다. 두 이론이 다른 답을
   주기 시작하는 지점(=아인슈타인의 중력이 "필요"해지는 지점)이 바로 슈바르츠실트
   반지름 r_s이며, 이는 초급의 "중력과 시간"에서 이미 다룬 x = r_s/r와 같은 양이다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { M: '#fbbf24', F: '#60a5fa', body: '#5eead4', grid: 'rgba(147,162,196,.35)' };
  const G_SIM = 1, m_SIM = 1;   // 임의 단위계(교육용) — G와 물체 질량을 1로 둠
  const C_SIM = 3;              // 임의 단위계에서의 "빛의 속력"(슈바르츠실트 반지름이 슬라이더 범위 안에서 보이도록 설정)
  const R0 = 2.2;               // 궤도 반지름(고정) — 시각적 비교를 쉽게 하려고 원 궤도로 고정

  function accel(pos, M) {
    const r = Math.hypot(pos.x, pos.y) || 1e-6;
    const f = -G_SIM * M / (r * r * r);
    return { x: f * pos.x, y: f * pos.y };
  }

  function warp(x, y, M) {
    // 격자점을 중심 방향으로 조금씩 당겨서 "휘어진 시공간"처럼 보이게 하는 순수 시각적 효과.
    // (실제 임베딩 다이어그램의 수학적 곡률 계산이 아니라, 대중적으로 쓰이는 고무판 비유의 2D 근사.)
    const r = Math.hypot(x, y) || 1e-6;
    const pull = (10 * M) / (r + 9);
    return { x: x - (x / r) * pull, y: y - (y / r) * pull };
  }

  PS.register({
    id: 'c-gravity', mode: 'concept', category: '중력과 우주',
    title: '중력이란 무엇인가?',
    sub: '뉴턴의 "끌어당기는 힘" vs 아인슈타인의 "휘어진 시공간"',
    tagline: '왼쪽과 오른쪽 모두 똑같은 궤도 운동 하나를 보여줍니다 — 설명하는 방식만 다릅니다. 왼쪽은 "힘이 끌어당긴다"는 뉴턴의 그림, 오른쪽은 "휘어진 공간을 따라 자연스럽게 굴러간다"는 아인슈타인의 그림입니다. 질량(M)을 키워 보세요.',

    params: [
      { key: 'M', symbol: 'M', label: '중심 천체의 질량', unit: '', min: 0.5, max: 8, step: .1, value: 2, color: C.M, reset: true, dec: 1,
        where: '가운데 <b>노란 천체</b>의 질량입니다. 클수록 뉴턴 쪽에서는 화살표(힘)가 세지고, 아인슈타인 쪽에서는 격자가 더 깊이 휘어집니다.' }
    ],
    vars: {
      F: { symbol: 'F', label: '중력(뉴턴)', unit: '', color: C.F, where: '왼쪽 그림의 <b>파란 화살표</b>. 두 물체가 서로 당기는 힘의 크기입니다.' },
      r: { symbol: 'r', label: '두 물체 사이 거리', unit: '', color: '#93a2c4', where: '가운데 천체와 도는 물체 사이의 거리입니다.' },
      m: { symbol: 'm', label: '도는 물체의 질량', unit: '', color: C.body, where: '궤도를 도는 <b>청록색 점</b>의 질량입니다(이 시뮬레이션에서는 고정된 값).' },
      rs: { symbol: 'r_s', label: '슈바르츠실트 반지름', unit: '', color: '#f472b6', where: '이 반지름보다 더 작게 압축되면 빛조차 못 빠져나가는 블랙홀이 됩니다 — "중력과 시간"에서 다룬 x=r_s/r의 그 r_s입니다.' }
    },
    formulas: [
      { name: '뉴턴의 중력', tpl: '{F} = G{M}{m} ⁄ {r}²' },
      { name: '아인슈타인 중력이 확실히 달라지는 기준', tpl: '{rs} = 2G{M} ⁄ c²' }
    ],

    init(p) {
      const v = Math.sqrt(G_SIM * p.M / R0); // 원 궤도를 유지하는 속력
      return { pos: { x: R0, y: 0 }, vel: { x: 0, y: v } };
    },
    step(st, p, dt) {
      // 속도 베를레(도약) 적분 — 대칭 적분이라 에너지가 크게 새지 않고 원 궤도를 잘 유지한다.
      const a0 = accel(st.pos, p.M);
      const vh = { x: st.vel.x + 0.5 * a0.x * dt, y: st.vel.y + 0.5 * a0.y * dt };
      st.pos = { x: st.pos.x + vh.x * dt, y: st.pos.y + vh.y * dt };
      const a1 = accel(st.pos, p.M);
      st.vel = { x: vh.x + 0.5 * a1.x * dt, y: vh.y + 0.5 * a1.y * dt };
    },

    readouts(st, p) {
      const r = Math.hypot(st.pos.x, st.pos.y);
      const F = G_SIM * p.M * m_SIM / (r * r);
      const rs = 2 * G_SIM * p.M / (C_SIM * C_SIM);
      return [
        { label: '두 물체 사이 거리', value: r, dec: 2, color: '#93a2c4' },
        { label: '뉴턴의 중력(F)', value: F, dec: 2, color: C.F },
        { label: '슈바르츠실트 반지름', value: rs, dec: 3, color: '#f472b6' },
        { label: '지금 상태', value: rs < r ? '보통의 중력(둘이 다른 답을 주지 않음)' : '만약 이만큼 압축된다면 블랙홀!', wide: true }
      ];
    },

    notes: [
      '뉴턴은 "왜" 끌어당기는지는 설명하지 않고, <b>얼마나 세게</b> 끌어당기는지만 정확히 계산했습니다(F=GMm/r²).',
      '아인슈타인은 "질량이 있으면 그 주변의 시공간 자체가 휘어지고, 물체는 그 휘어진 길 중 가장 자연스러운 길(측지선)을 따라 움직일 뿐"이라고 설명합니다 — 힘이 당기는 게 아니라 <b>길이 휘어 있는 것</b>입니다.',
      '태양계처럼 중력이 약한 곳에서는 두 설명이 사실상 같은 답을 줍니다. 이 시뮬레이션의 궤적도 하나의 뉴턴 중력 계산 결과를 양쪽에 그린 것입니다 — 다만 수성의 근일점처럼 아주 미세한 차이는 아인슈타인 쪽 계산에서만 정확히 맞습니다.',
      '두 이론이 눈에 띄게 달라지는 지점은 물체가 <b>슈바르츠실트 반지름(r_s)만큼 작게 압축됐을 때</b>입니다 — 블랙홀과 중성자별이란 무엇인가? 시뮬레이션에서 직접 만들어 볼 수 있습니다.'
    ],
    presets: [
      { name: '약한 중력(가벼운 천체)', set: { M: 0.5 } },
      { name: '보통', set: { M: 2 } },
      { name: '강한 중력(무거운 천체)', set: { M: 8 } }
    ],

    challenges: [
      { id: 'ch-maxmass', title: '가장 무거운 천체 만들기',
        desc: '질량(M)을 최대로 올려서, 오른쪽 격자가 가장 깊게 휘어지게 만들어보세요.',
        check: ctx => ctx.P.M >= 8,
        hint: 'M 슬라이더를 오른쪽 끝까지 올려보세요.' },
      { id: 'ch-rs-half', title: '슈바르츠실트 반지름을 궤도의 절반까지',
        desc: '질량(M)을 올려서, 슈바르츠실트 반지름(r_s)이 궤도 반지름의 절반(1.1) 이상이 되게 만들어보세요.',
        check: ctx => (2 * G_SIM * ctx.P.M / (C_SIM * C_SIM)) >= 1.1,
        hint: 'M을 5 이상으로 올려보세요.' }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const halfW = w / 2;
      const box = { x0: -3.1, x1: 3.1, y0: -3.1, y1: 3.1, pad: 22 };
      const vL = PS.view(halfW, h, box), vR = PS.view(halfW, h, box);
      const LX = x => vL.X(x), LY = y => vL.Y(y);
      const RX = x => halfW + vR.X(x), RY = y => vR.Y(y);

      D.line(ctx, halfW, 0, halfW, h, { color: 'rgba(255,255,255,.1)', width: 1 });
      D.text(ctx, '뉴턴: 끌어당기는 힘', halfW / 2, 20, { size: 12.5, color: '#e8eefc', align: 'center', bold: true });
      D.text(ctx, '아인슈타인: 휘어진 시공간', halfW + halfW / 2, 20, { size: 12.5, color: '#e8eefc', align: 'center', bold: true });

      const r = Math.hypot(st.pos.x, st.pos.y);
      const bodyR = 8 + Math.sqrt(p.M) * 3.4;

      // 왼쪽: 힘 화살표 + 궤적
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, halfW, h); ctx.clip();
      D.dot(ctx, LX(0), LY(0), bodyR, C.M, hl === 'M');
      const F = G_SIM * p.M * m_SIM / (r * r);
      const fx = -st.pos.x / r, fy = -st.pos.y / r;
      D.arrow(ctx, LX(st.pos.x), LY(st.pos.y), vL.S(fx * clamp(F * 6, .3, 2.4)), -vL.S(fy * clamp(F * 6, .3, 2.4)),
        { color: C.F, width: 3, hot: hl === 'F', label: 'F' });
      ctx.strokeStyle = 'rgba(147,162,196,.3)'; ctx.setLineDash([4, 5]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(LX(0), LY(0), vL.S(R0), 0, 7); ctx.stroke(); ctx.setLineDash([]);
      D.dot(ctx, LX(st.pos.x), LY(st.pos.y), 7, C.body, hl === 'r');
      ctx.restore();

      // 오른쪽: 휘어진 격자 + 같은 물체
      ctx.save();
      ctx.beginPath(); ctx.rect(halfW, 0, halfW, h); ctx.clip();
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1.2;
      const N = 11;
      for (let i = 0; i <= N; i++) {
        const gy = box.y0 + (box.y1 - box.y0) * i / N;
        ctx.beginPath();
        for (let j = 0; j <= 40; j++) {
          const gx = box.x0 + (box.x1 - box.x0) * j / 40;
          const wpt = warp(gx, gy, p.M);
          const px = RX(wpt.x), py = RY(wpt.y);
          j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      for (let i = 0; i <= N; i++) {
        const gx = box.x0 + (box.x1 - box.x0) * i / N;
        ctx.beginPath();
        for (let j = 0; j <= 40; j++) {
          const gy = box.y0 + (box.y1 - box.y0) * j / 40;
          const wpt = warp(gx, gy, p.M);
          const px = RX(wpt.x), py = RY(wpt.y);
          j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      D.dot(ctx, RX(0), RY(0), bodyR, C.M, hl === 'M');
      D.dot(ctx, RX(st.pos.x), RY(st.pos.y), 7, C.body, hl === 'r');
      ctx.restore();

      D.text(ctx, '두 그림의 파란(청록) 점은 완전히 같은 물체, 같은 궤적입니다', w / 2, h - 14, { size: 10.5, color: '#61719a', align: 'center' });
    }
  });
})();
