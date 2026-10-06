/* 초급·개념 — 에너지란 무엇인가? (거시세계)
   공을 떨어뜨려 튀기면서, 에너지가 사라지는 게 아니라
   "형태만 바뀐다"는 것을 아주 단순하게 보여준다.
   고등물리 트랙의 '역학적 에너지 보존'(에너지 종류별 정밀 계산)보다 앞서 보는 개념 시뮬. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { h0: '#a78bfa', bounce: '#fb7185', v: '#60a5fa', K: '#60a5fa', U: '#a78bfa', lost: '#61719a' };
  const GY0 = 0.35; // 바닥 높이(개념용 여유 공간)
  const G = 9.0;    // 중력가속도(단순화) — U와 K를 같은 "에너지 단위"로 맞추는 데 사용

  // 낙하·튀어오름 한 구간이 바닥(GY0)에 닿는 정확한 시각(등가속도 공식의 해).
  // y0=구간 시작 높이, v0=구간 시작 속도(항상 0 이상, 위 또는 정지) — 중력이 일정하므로
  // 수치 적분 없이 공식으로 바로 구해 오차 없는(에너지가 정확히 보존되는) 궤적을 만든다.
  function landTime(y0, v0) {
    return (v0 + Math.sqrt(v0 * v0 + 2 * G * Math.max(0, y0 - GY0))) / G;
  }

  PS.register({
    id: 'c-energy', mode: 'concept', category: '힘과 운동',
    title: '에너지란 무엇인가?',
    sub: '형태는 바뀌어도 총량은 그대로',
    tagline: '공을 떨어뜨려 보세요. 높이 있을 때의 "에너지"가 떨어지면서 "빠르기의 에너지"로 바뀝니다. 튈 때마다 조금씩 소리와 열로 빠져나가는 걸 막대에서 확인하세요.',

    params: [
      { key: 'h0', symbol: 'h', label: '떨어뜨리는 높이', unit: '', min: 1, max: 5, step: .1, value: 4, color: C.h0, reset: true, dec: 1,
        where: '<b>공을 놓는 높이</b>입니다. 높을수록 떨어지는 동안 얻는 "빠르기의 에너지"가 커서, 바닥에 닿는 순간 더 빠릅니다.' },
      { key: 'e', symbol: 'e', label: '튈 때 남는 비율', unit: '%', min: 40, max: 98, step: 1, value: 85, color: C.bounce, dec: 0,
        where: '공이 바닥에 튈 때마다 <b>에너지 중 얼마나 남기고 튀는지</b>입니다. 100%면 영원히 같은 높이로 튀고, 낮을수록 튈 때 소리·열로 더 많이 빠져나가 금방 멈춥니다.' }
    ],
    vars: {
      K: { symbol: 'K', label: '빠르기의 에너지', unit: '', color: C.K,
        where: '오른쪽 막대의 <b>파란 부분</b>. 공이 빠르게 움직일수록 커지고, 가장 낮은 곳(바닥)에서 최대입니다.' },
      U: { symbol: 'U', label: '높이의 에너지', unit: '', color: C.U,
        where: '오른쪽 막대의 <b>보라 부분</b>. 공이 높이 떠 있을수록 커집니다.' },
      lost: { symbol: 'lost', label: '소리·열로 사라진 양', unit: '', color: C.lost,
        where: '오른쪽 막대의 <b>회색 부분</b>. 튈 때마다 조금씩 쌓입니다 — "사라진" 게 아니라 눈에 안 보이는 소리·열이 된 것입니다.' }
    },
    formulas: [
      { name: '에너지는 형태만 바뀐다', tpl: '{U} + {K} + {lost} = 항상 일정' },
      { name: '높이 → 빠르기', tpl: '높을수록 {U}↑, 떨어질수록 {U}가 {K}로' }
    ],

    init(p) {
      // E0은 U(=G·(y−GY0))와 같은 기준(바닥 GY0)에서 잰 에너지여야 총량이 정확히 보존된다.
      return {
        y0: p.h0, v0: 0, tf: 0, tLand: landTime(p.h0, 0),
        y: p.h0, v: 0, bounces: 0, E0: G * (p.h0 - GY0), lost: 0, settled: false
      };
    },

    step(st, p, dt) {
      if (st.settled) return;
      st.tf += dt;
      if (st.tf >= st.tLand) {
        // 착지: 정확한 착지 순간(등가속도 공식)의 속도로 스냅 — 수치오차가 쌓이지 않는다.
        const vImpact = st.v0 - G * st.tLand; // 착지 속도(항상 음수)
        const before = 0.5 * vImpact * vImpact;
        const vAfter = -vImpact * Math.sqrt(clamp(p.e / 100, 0, 1));
        const after = 0.5 * vAfter * vAfter;
        st.lost += Math.max(0, before - after);
        st.bounces++;
        // 다음 구간(바닥에서 vAfter로 다시 튀어오름) 시작
        st.y0 = GY0; st.v0 = vAfter; st.tf = 0; st.tLand = landTime(GY0, vAfter);
        st.y = GY0; st.v = vAfter;
        if (vAfter < 0.35) { st.lost += 0.5 * vAfter * vAfter; st.v = 0; st.y = GY0; st.settled = true; }
      } else {
        st.v = st.v0 - G * st.tf;
        st.y = st.y0 + st.v0 * st.tf - 0.5 * G * st.tf * st.tf;
      }
    },


    graphs: [{
      title: '에너지 – 시간', xmin: 6, window: 10, y0: 0,
      series: [
        { key: 'K', label: '빠르기 K', color: C.K },
        { key: 'U', label: '높이 U', color: C.U },
        { key: 'lost', label: '사라진 양', color: C.lost }
      ]
    }],
    sample(st, p) {
      const h = st.y - GY0;
      return { K: 0.5 * st.v * st.v, U: G * h, lost: st.lost };
    },

    readouts(st, p) {
      const h = st.y - GY0;
      return [
        { label: '현재 높이', value: h, dec: 2, color: C.U },
        { label: '빠르기(속력)', value: Math.abs(st.v), dec: 2, color: C.K },
        { label: '튄 횟수', value: st.bounces, dec: 0, color: '#e8eefc' },
        { label: '소리·열로 사라진 양', value: st.lost, dec: 2, color: C.lost, wide: true }
      ];
    },

    notes: [
      '공은 <b>스스로 처음보다 높이 튀어 오르지 못합니다</b>. 에너지는 저절로 생기지 않기 때문입니다.',
      '"에너지가 사라진다"는 말은 틀렸습니다 — 실제로는 <b>소리와 열로 형태가 바뀌어 흩어질</b> 뿐입니다.',
      '남는 비율 e를 100%로 하면 이상적인 경우로, 튐이 영원히 계속됩니다(현실에는 없음).',
      '높이 h를 키우면 바닥에 닿는 순간의 빠르기가 커집니다 — 롤러코스터, 다이빙이 모두 같은 원리입니다.'
    ],
    presets: [
      { name: '거의 안 튀는 공(찰흙)', set: { e: 45, h0: 4 } },
      { name: '탱탱볼', set: { e: 92, h0: 4 } },
      { name: '높은 곳에서', set: { h0: 5, e: 80 } }
    ],

    challenges: [
      { id: 'ch-half-bounce', title: '절반 이하로 낮게 튀게 하기',
        desc: '"튈 때 남는 비율(e)"을 낮춰서, 첫 번째로 튀어 오르는 높이가 처음 놓은 높이의 절반도 안 되게 만들어보세요.',
        check: ctx => ctx.P.e <= 50,
        hint: 'e 슬라이더를 50 이하로 내려보세요. 남는 비율이 50%면 다음에 올라가는 높이도 딱 절반이 됩니다.' },
      { id: 'ch-keep-bouncing', title: '6초가 지나도 계속 튀게 하기',
        desc: '"튈 때 남는 비율(e)"을 충분히 높여서, 재생 후 6초가 지나도 공이 아직 멈추지 않고 계속 튀고 있게 만들어보세요.',
        check: ctx => ctx.t >= 6 && !ctx.st.settled,
        hint: 'e를 70 이상으로 올리고 재생을 눌러보세요. e가 낮으면 몇 번 안 튀고 금방 멈춥니다.' }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const BW = 118;
      const V = PS.view(w - BW, h, { x0: -2, x1: 2, y0: 0, y1: 5.6, pad: 24 });
      const ground = V.Y(GY0 - 0.02);

      D.line(ctx, V.X(-2), ground, V.X(2), ground, { color: 'rgba(147,162,196,.4)', width: 2 });
      D.ground(ctx, V.X(-2), V.X(2), ground, 0);

      // 출발 높이 안내선
      const hotH0 = hl === 'h0';
      D.line(ctx, V.X(-2), V.Y(p.h0), V.X(2), V.Y(p.h0), { color: C.h0, dash: [5, 6], width: hotH0 ? 2 : 1, hot: hotH0 });
      D.text(ctx, '놓는 높이 h', V.X(2) - 4, V.Y(p.h0) - 8, { size: 10.5, color: C.h0, align: 'right', bold: hotH0 });

      const bx = V.X(0), by = V.Y(st.y);
      const r = 16;

      // 속도 화살표
      const speed = Math.abs(st.v);
      if (speed > 0.15) {
        D.arrow(ctx, bx, by, 0, st.v > 0 ? -clamp(speed * 9, 12, 90) : clamp(speed * 9, 12, 90),
          { color: C.K, width: 3, hot: hl === 'K', label: '빠르기', ly: st.v > 0 ? -14 : 22 });
      }

      // 공
      ctx.save();
      if (hl === 'U' || hl === 'h0') { ctx.shadowColor = C.h0; ctx.shadowBlur = 20; }
      const bg = ctx.createRadialGradient(bx - r * .3, by - r * .3, 1, bx, by, r);
      bg.addColorStop(0, '#fde7f3'); bg.addColorStop(1, '#f472b6');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fill();
      ctx.restore();

      if (st.settled) {
        D.text(ctx, '가만히 멈췄어요 — 에너지가 모두 소리·열로 흩어졌습니다', bx, by - r - 16,
          { size: 11.5, color: '#e8eefc', align: 'center' });
      }

      // 에너지 막대 (오른쪽)
      const U = G * (st.y - GY0), K = 0.5 * st.v * st.v, lost = st.lost;
      const top = 34, bot = h - 34, bh = bot - top;
      const bxx = w - BW + 24, bwid = 48;
      const maxE = Math.max(st.E0, 0.5);
      const uh = bh * clamp(U / maxE, 0, 1);
      const kh = bh * clamp(K / maxE, 0, 1 - U / maxE);
      const lh = bh * clamp(lost / maxE, 0, 1);

      D.text(ctx, '에너지', bxx + bwid / 2, top - 20, { size: 11, color: '#61719a', align: 'center' });
      D.roundRect(ctx, bxx, top, bwid, bh, 6); ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fill();

      ctx.save(); if (hl === 'lost') { ctx.shadowColor = C.lost; ctx.shadowBlur = 14; }
      ctx.fillStyle = C.lost; ctx.fillRect(bxx, bot - lh, bwid, lh); ctx.restore();

      ctx.save(); if (hl === 'U' || hl === 'h0') { ctx.shadowColor = C.U; ctx.shadowBlur = 16; }
      ctx.fillStyle = C.U; ctx.fillRect(bxx, bot - lh - uh, bwid, uh); ctx.restore();

      ctx.save(); if (hl === 'K') { ctx.shadowColor = C.K; ctx.shadowBlur = 16; }
      ctx.fillStyle = C.K; ctx.fillRect(bxx, bot - lh - uh - kh, bwid, kh); ctx.restore();

      D.text(ctx, '항상 이 높이', bxx + bwid + 10, top + bh * (1 - clamp(st.E0 / maxE, 0, 1)) + 4,
        { size: 9.5, color: '#61719a' });
    }
  });
})();
