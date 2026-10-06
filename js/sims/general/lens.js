/* [일반물리] 렌즈와 상 — 1/f = 1/u + 1/v (얇은 렌즈 공식) */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { f: '#fbbf24', u: '#60a5fa', v: '#34d399', obj: '#a78bfa', img: '#f472b6' };

  // f=0 근처(정의 불가)를 피하기 위한 안전한 유효 초점거리
  function fEff(p) { return Math.abs(p.f) < 0.5 ? (p.f < 0 ? -0.5 : 0.5) : p.f; }
  function imageOf(p) {
    const f = fEff(p), u = p.u;
    const inv = 1 / f - 1 / u;
    if (Math.abs(inv) < 1e-6) return { v: Infinity, m: -Infinity };
    const v = 1 / inv;
    const m = -v / u;
    return { v, m };
  }

  PS.register({
    id: 'g-lens', mode: 'general', category: '파동과 광학',
    title: '렌즈와 상',
    sub: '1/f = 1/u + 1/v',
    tagline: '물체를 렌즈에 가까이(또는 멀리) 옮기면서 상이 어디에, 어떤 크기와 방향으로 맺히는지 보세요. f를 음수로 두면 오목렌즈(항상 작고 바로 선 허상)가 됩니다.',

    params: [
      { key: 'f', symbol: 'f', label: '초점거리', unit: '', min: -20, max: 20, step: 1, value: 10, color: C.f,
        where: '<b>렌즈의 종류와 세기</b>를 정합니다. f &gt; 0이면 볼록렌즈(빛을 모음), f &lt; 0이면 오목렌즈(빛을 퍼뜨림). 절댓값이 작을수록 더 강하게 꺾습니다.' },
      { key: 'u', symbol: 'u', label: '물체거리', unit: '', min: 2, max: 40, step: .5, value: 25, color: C.u,
        where: '<b>물체(보라 화살표)가 렌즈에서 얼마나 떨어져 있는지</b>입니다. 볼록렌즈에서 이 값을 f보다 작게 줄이면(돋보기처럼) 상이 커진 허상으로 바뀝니다.' }
    ],
    vars: {
      v: { symbol: 'v', label: '상거리', unit: '', color: C.v,
        where: 'v &gt; 0이면 <b>렌즈 반대쪽에 실제로 상이 맺히는 실상</b>(화면에 비출 수 있음), v &lt; 0이면 <b>물체와 같은 쪽에 맺히는 허상</b>(거울처럼 들여다봐야 보임, 화면에 못 비춤)입니다.' }
    },
    formulas: [
      { name: '얇은 렌즈 공식', tpl: '1⁄{f} = 1⁄{u} + 1⁄{v}' }
    ],

    init(p) { return {}; },
    step(st, p, dt) {},

    readouts(st, p) {
      const { v, m } = imageOf(p);
      const kind = !isFinite(v) ? '상이 무한히 멀리(평행광)'
        : (v > 0 ? '실상 · ' + (m < 0 ? '뒤집힘' : '바로 섬') : '허상 · ' + (m < 0 ? '뒤집힘' : '바로 섬'));
      return [
        { label: '렌즈 종류', value: p.f > 0 ? '볼록렌즈(모음)' : '오목렌즈(퍼뜨림)', color: C.f },
        { label: '상거리 v', value: isFinite(v) ? v : Infinity, unit: '', dec: 2, color: C.v },
        { label: '배율 m = −v/u', value: isFinite(m) ? m : Infinity, dec: 2, color: C.img },
        { label: '상의 종류', value: kind, wide: true, color: v > 0 ? C.v : C.img }
      ];
    },

    notes: [
      '<b>볼록렌즈</b>는 물체가 초점(f)보다 멀리 있으면 실상(뒤집힌 상), 초점보다 가까이 있으면 <b>확대된 허상</b>(돋보기 원리)을 만듭니다.',
      '<b>오목렌즈</b>는 물체 위치와 상관없이 <b>항상 작고 바로 선 허상</b>만 만듭니다(근시 안경 원리).',
      '실상은 스크린에 <b>비출 수 있지만</b>, 허상은 눈으로 렌즈를 통해 봐야만 보이고 스크린에는 맺히지 않습니다.',
      '가운데를 지나는 광선은 <b>휘지 않고 그대로 직진</b>합니다 — 상의 위치를 찾는 가장 쉬운 기준선입니다.'
    ],
    presets: [
      { name: '볼록렌즈 · 실상(카메라)', set: { f: 10, u: 25 } },
      { name: '볼록렌즈 · 돋보기(허상)', set: { f: 10, u: 6 } },
      { name: '오목렌즈 · 항상 허상(근시 안경)', set: { f: -10, u: 20 } },
      { name: '초점 바로 앞(상이 매우 멀어짐)', set: { f: 10, u: 10 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const V = PS.view(w, h, { x0: -34, x1: 34, y0: -12, y1: 12, pad: 26 });
      const axisY = V.Y(0);
      const f = fEff(p);
      const ho = 5; // 물체 높이(그리기용 고정값)

      // 광축
      D.line(ctx, V.X(-34), axisY, V.X(34), axisY, { color: 'rgba(147,162,196,.3)' });

      // 렌즈(볼록/오목 기호)
      const lensX = V.X(0), lensTop = V.Y(11), lensBot = V.Y(-11);
      ctx.save();
      ctx.strokeStyle = '#5eead4'; ctx.lineWidth = 3;
      ctx.beginPath();
      if (p.f > 0) {
        ctx.moveTo(lensX, lensTop); ctx.lineTo(lensX, lensBot);
        ctx.moveTo(lensX - 10, lensTop + 6); ctx.lineTo(lensX, lensTop); ctx.lineTo(lensX + 10, lensTop + 6);
        ctx.moveTo(lensX - 10, lensBot - 6); ctx.lineTo(lensX, lensBot); ctx.lineTo(lensX + 10, lensBot - 6);
      } else {
        ctx.moveTo(lensX, lensTop); ctx.lineTo(lensX, lensBot);
        ctx.moveTo(lensX - 10, lensTop); ctx.lineTo(lensX, lensTop + 8); ctx.lineTo(lensX + 10, lensTop);
        ctx.moveTo(lensX - 10, lensBot); ctx.lineTo(lensX, lensBot - 8); ctx.lineTo(lensX + 10, lensBot);
      }
      ctx.stroke();
      ctx.restore();

      // 초점 표시
      const hotF = hl === 'f';
      [-Math.abs(f), Math.abs(f)].forEach(fx => {
        D.dot(ctx, V.X(fx), axisY, 3.5, C.f, hotF);
        D.text(ctx, 'F', V.X(fx), axisY + 16, { size: 10, color: C.f, align: 'center', bold: hotF });
      });

      // 물체
      const ox = V.X(-p.u), oy = V.Y(ho);
      D.arrow(ctx, ox, axisY, 0, oy - axisY, { color: C.obj, width: 3, hot: hl === 'u', label: '물체' });

      const { v, m } = imageOf(p);
      const lensHitY = V.Y(ho); // 평행 광선이 렌즈를 지나는 높이(물체와 같은 높이)

      // 중심을 지나는 광선(항상 직진)
      const farX = V.X(34);
      const slopeCenter = (axisY - oy) / (lensX - ox);
      D.line(ctx, ox, oy, farX, axisY + slopeCenter * (farX - lensX), { color: '#93a2c4', width: 1.6, dash: [5, 5] });

      if (isFinite(v)) {
        const ix = V.X(v), iy = V.Y(m * ho);
        if (v > 0) {
          // 실상: 평행광선이 렌즈에서 상점으로 곧장 향한다
          D.line(ctx, ox, oy, lensX, lensHitY, { color: C.img, width: 2.2, hot: hl === 'v' });
          D.line(ctx, lensX, lensHitY, ix, iy, { color: C.img, width: 2.2, hot: hl === 'v' });
          D.arrow(ctx, ix, axisY, 0, iy - axisY, { color: C.img, width: 3, hot: hl === 'v', label: '실상' });
        } else {
          // 허상: 렌즈를 지난 뒤 실제로는 반대로 퍼지고, 뒤로 연장한 점선이 상점에서 만난다
          D.line(ctx, ox, oy, lensX, lensHitY, { color: C.img, width: 2.2, hot: hl === 'v' });
          D.line(ctx, lensX, lensHitY, ix, iy, { color: C.img, width: 1.4, dash: [4, 4], hot: hl === 'v' });
          const dirx = lensX - ix, diry = lensHitY - iy;
          const nrm = Math.hypot(dirx, diry) || 1;
          D.line(ctx, lensX, lensHitY, lensX + dirx / nrm * V.S(14), lensHitY + diry / nrm * V.S(14),
            { color: C.img, width: 2.2, hot: hl === 'v' });
          D.arrow(ctx, ix, axisY, 0, iy - axisY, { color: C.img, width: 3, hot: hl === 'v', label: '허상(점선)' });
        }
      } else {
        D.text(ctx, '상이 무한히 멀리 맺힘(평행광선)', w / 2, 30, { size: 12, color: '#61719a', align: 'center' });
      }
    }
  });
})();
