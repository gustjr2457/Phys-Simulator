/* 파동의 표현 — v = fλ */
(function () {
  const D = PS.D, fmt = PS.fmt;
  const C = { A: '#fbbf24', f: '#f472b6', lam: '#5eead4', v: '#60a5fa', T: '#f472b6', y: '#fb7185' };
  const XM = 12, MARK = 2.0;

  const y = (x, t, p) => p.A * Math.sin(2 * Math.PI * (x / p.lam - p.f * t));

  PS.register({
    id: 'wave',
    category: '파동과 정보통신',
    title: '파동의 표현',
    sub: 'v = fλ',
    tagline: '파동은 앞으로 나아가지만 매질(빨간 입자)은 제자리에서 위아래로만 흔들립니다.',

    params: [
      { key: 'A', symbol: 'A', label: '진폭', unit: 'm', min: .1, max: 1.4, step: .1, value: .8, color: C.A, dec: 1,
        where: '중심선에서 <b>마루(가장 높은 곳)까지의 높이</b>입니다. 노란 치수선으로 표시됩니다. 진폭은 파동이 나르는 <b>에너지</b>와 관계가 있고, 속력과는 무관합니다.' },
      { key: 'f', symbol: 'f', label: '진동수', unit: 'Hz', min: .2, max: 2, step: .1, value: .6, color: C.f, dec: 1,
        where: '<b>빨간 입자가 1초에 몇 번 위아래로 흔들리는가</b>입니다. 아래 y–t 그래프에서 1초 동안 반복되는 횟수를 세어 보세요.' },
      { key: 'lam', symbol: 'λ', label: '파장', unit: 'm', min: 1, max: 8, step: .2, value: 4, color: C.lam, dec: 1,
        where: '<b>이웃한 마루와 마루 사이의 거리</b>입니다. 청록색 치수선으로 표시됩니다. 한 주기 동안 파동이 나아가는 거리이기도 합니다.' }
    ],
    vars: {
      v: { symbol: 'v', label: '파동의 속력', unit: 'm/s', color: C.v,
        where: '마루를 따라가는 <b>파란 삼각형 표식</b>의 속력입니다. 한 주기(T)에 한 파장(λ)만큼 나아가므로 v = λ/T = fλ 입니다.' },
      T: { symbol: 'T', label: '주기', unit: 's', color: C.T,
        where: '빨간 입자가 <b>한 번 왕복하는 데 걸리는 시간</b>입니다. 아래 y–t 그래프에서 같은 모양이 반복되는 간격입니다.' },
      yv: { symbol: 'y', label: '변위', unit: 'm', color: C.y,
        where: '중심선에서 <b>매질 입자까지의 높이</b>입니다. 파동이 지나가도 입자는 위아래로만 움직일 뿐 앞으로 이동하지 않습니다.' },
      x: { symbol: 'x', label: '위치', unit: 'm', color: '#94a3b8', where: '파동이 진행하는 방향의 좌표입니다.' },
      t: { symbol: 't', label: '시간', unit: 's', color: '#94a3b8', where: '경과 시간입니다.' }
    },
    formulas: [
      { name: '파동의 속력', tpl: '{v} = {f} · {lam} = {lam} ⁄ {T}' },
      { name: '주기와 진동수', tpl: '{T} = 1 ⁄ {f}' },
      { name: '파동의 식', tpl: '{yv} = {A} sin 2π( {x}⁄{lam} − {f}{t} )' }
    ],

    init() { return {}; },
    step() { },

    graphs: [{
      title: '빨간 입자의 변위 y – 시간  (제자리 진동)',
      xmin: 6, window: 8,
      series: [{ key: 'y', label: 'y (m)', color: C.y }]
    }],
    sample(st, p) { return { y: y(MARK, st.t, p) }; },

    readouts(st, p) {
      return [
        { label: '파동의 속력 v = fλ', value: p.f * p.lam, unit: 'm/s', color: C.v, wide: true },
        { label: '주기 T = 1/f', value: 1 / p.f, unit: 's', color: C.T },
        { label: '진동수 f', value: p.f, unit: 'Hz', color: C.f },
        { label: '파장 λ', value: p.lam, unit: 'm', color: C.lam },
        { label: '진폭 A', value: p.A, unit: 'm', color: C.A },
        { label: '빨간 입자의 변위 y', value: y(MARK, st.t, p), unit: 'm', color: C.y, wide: true }
      ];
    },

    notes: [
      '<b>매질은 이동하지 않습니다.</b> 빨간 입자를 눈으로 따라가 보세요 — 제자리에서 위아래로만 움직입니다.',
      '진동수 f를 2배로 하면(파장 고정) 파동은 <b>2배 빨라집니다</b>. v = fλ',
      '진폭 A는 <b>속력과 아무 관계가 없습니다</b>. 큰 소리든 작은 소리든 같은 속력으로 전달되는 이유입니다.',
      '한 주기 T 동안 파동은 정확히 한 파장 λ만큼 나아갑니다.'
    ],
    presets: [
      { name: '기본', set: { A: .8, f: .6, lam: 4 } },
      { name: '진동수 2배 (더 빠름)', set: { f: 1.2, lam: 4 } },
      { name: '파장만 절반', set: { f: .6, lam: 2 } },
      { name: '큰 진폭', set: { A: 1.4 } },
      { name: '느리고 긴 파동', set: { A: 1, f: .3, lam: 8 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl, t = st.t;
      const V = PS.view(w, h, { x0: 0, x1: XM, y0: -2.1, y1: 2.1, pad: 26, uniform: false });
      const mid = V.Y(0);

      // 중심선 & 눈금
      D.line(ctx, V.X(0), mid, V.X(XM), mid, { color: 'rgba(147,162,196,.25)', dash: [6, 6] });
      for (let m = 0; m <= XM; m += 2) {
        D.line(ctx, V.X(m), mid - 4, V.X(m), mid + 4, { color: 'rgba(147,162,196,.35)' });
        D.text(ctx, m + ' m', V.X(m), mid + 18, { size: 9.5, color: '#4a5878', align: 'center' });
      }

      // 파형
      ctx.save();
      ctx.beginPath();
      for (let x = 0; x <= XM; x += .04) {
        const px = V.X(x), py = V.Y(y(x, t, p));
        x === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(94,234,212,.45)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();

      // 매질 입자
      for (let x = 0; x <= XM + .01; x += .3) {
        const py = V.Y(y(x, t, p));
        D.dot(ctx, V.X(x), py, 3.2, 'rgba(147,162,196,.75)');
      }

      // 표시 입자 (제자리 진동)
      const my = V.Y(y(MARK, t, p));
      const hotY = hl === 'yv' || hl === 'f' || hl === 'T';
      D.line(ctx, V.X(MARK), V.Y(-p.A) + 14, V.X(MARK), V.Y(p.A) - 14,
        { color: C.y, dash: [4, 5], width: hotY ? 2 : 1, hot: hotY });
      D.arrow(ctx, V.X(MARK), mid, 0, V.Y(p.A) - mid + 8, { color: C.y, width: 1.5, head: 7, dash: [2, 3] });
      D.arrow(ctx, V.X(MARK), mid, 0, V.Y(-p.A) - mid - 8, { color: C.y, width: 1.5, head: 7, dash: [2, 3] });
      D.dot(ctx, V.X(MARK), my, 7, C.y, true);
      D.text(ctx, '매질 입자 (위아래로만)', V.X(MARK), V.Y(-2.1) + 14, { size: 10.5, color: C.y, align: 'center', bold: hotY });

      // 진폭 치수선
      const crestX = p.lam * (0.25 + p.f * t);          // 마루 위치 기준값
      let firstCrest = crestX % p.lam;
      D.dim(ctx, V.X(XM) - 26, mid, V.X(XM) - 26, V.Y(p.A), 'A = ' + fmt(p.A, 1) + ' m', C.A, hl === 'A');

      // 파장 치수선 (이웃한 두 마루 사이)
      let c1 = firstCrest;
      while (c1 + p.lam > XM - .2) c1 -= p.lam;
      while (c1 < .2) c1 += p.lam;
      if (c1 + p.lam <= XM) {
        const yTop = V.Y(p.A) - 18;
        D.line(ctx, V.X(c1), V.Y(p.A), V.X(c1), yTop, { color: C.lam, dash: [3, 4] });
        D.line(ctx, V.X(c1 + p.lam), V.Y(p.A), V.X(c1 + p.lam), yTop, { color: C.lam, dash: [3, 4] });
        D.dim(ctx, V.X(c1), yTop, V.X(c1 + p.lam), yTop, 'λ = ' + fmt(p.lam, 1) + ' m', C.lam, hl === 'lam');
      }

      // 마루를 따라가는 표식 (파동의 속력)
      let cx2 = firstCrest;
      while (cx2 < XM * .55) cx2 += p.lam;
      if (cx2 > XM) cx2 -= p.lam;
      const tx = V.X(cx2), ty = V.Y(p.A);
      ctx.save();
      ctx.fillStyle = C.v;
      if (hl === 'v') { ctx.shadowColor = C.v; ctx.shadowBlur = 14; }
      ctx.beginPath();
      ctx.moveTo(tx, ty - 6); ctx.lineTo(tx - 7, ty - 18); ctx.lineTo(tx + 7, ty - 18);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      D.arrow(ctx, tx + 12, ty - 12, 66, 0, { color: C.v, width: 3, hot: hl === 'v', label: 'v = ' + fmt(p.f * p.lam, 2) + ' m/s' });

      // 주기 안내
      D.text(ctx, 'T = 1/f = ' + fmt(1 / p.f, 2) + ' s  동안 파동은 λ = ' + fmt(p.lam, 1) + ' m 만큼 나아갑니다',
        14, 20, { size: 11.5, color: hl === 'T' || hl === 'v' ? '#fff' : '#61719a', bold: hl === 'T' });
    }
  });
})();
