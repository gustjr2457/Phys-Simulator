/* [일반물리·파동과 광학] 단일슬릿 회절 — sin θ = mλ/a
   빛이 직진한다는 것은 근사일 뿐이다. 틈을 좁히면 좁힐수록 빛은 그림자 안쪽으로
   더 많이 '돌아 들어간다'. 틈이 파장에 가까워지면 거의 모든 방향으로 퍼져 나간다.
   이것은 빛이 입자라면 절대 일어날 수 없는 일이고, 틈 안의 모든 점에서 나온
   잔물결이 서로 간섭한다고 봐야만(호이겐스) 설명된다.
   망원경의 분해능 한계도, 전파가 건물 뒤로 돌아 들어가는 것도 전부 이 식이다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { a: '#5eead4', lam: '#fbbf24', Ls: '#93a2c4', th: '#f472b6', wid: '#fb7185' };

  const ratio = p => (p.lam * 1e-9) / (p.a * 1e-6);              // λ/a
  const th1 = p => { const r = ratio(p); return r >= 1 ? Math.PI / 2 : Math.asin(r); };   // 첫 어두운 무늬 각
  const widthOf = p => ratio(p) >= 1 ? Infinity : 2 * p.Ls * Math.tan(th1(p));            // 중앙 밝은 무늬 폭 [m]
  // 세기 분포 I(θ) = [sin β / β]²,  β = πa sinθ / λ
  function inten(p, th) {
    const b = Math.PI * (p.a * 1e-6) * Math.sin(th) / (p.lam * 1e-9);
    if (Math.abs(b) < 1e-9) return 1;
    const s = Math.sin(b) / b;
    return s * s;
  }
  // 파장 → RGB
  function visRGB(l) {
    let r = 0, g = 0, b = 0;
    if (l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; }
    else if (l < 510) { g = 1; b = -(l - 510) / 20; } else if (l < 580) { r = (l - 510) / 70; g = 1; }
    else if (l < 645) { r = 1; g = -(l - 645) / 65; } else { r = 1; }
    return [(r * 255) | 0, (g * 255) | 0, (b * 255) | 0];
  }

  PS.register({
    id: 'g-diffraction', mode: 'general', category: '파동과 광학',
    title: '단일슬릿 회절',
    sub: 'sin θ = mλ/a',
    tagline: '빛이 직진한다는 건 근사일 뿐입니다. 틈을 좁힐수록 빛은 그림자 안쪽으로 더 많이 돌아 들어가고, 틈이 파장만 해지면 거의 모든 방향으로 퍼집니다.',

    params: [
      { key: 'a', symbol: 'a', label: '슬릿 폭', unit: 'µm', min: .3, max: 200, step: .5, value: 10, color: C.a, dec: 1, reset: true,
        where: '빛이 지나가는 <b>틈의 폭</b>입니다. 좁힐수록 더 넓게 퍼집니다 — <b>직관과 반대</b>라서 회절이 파동의 결정적 증거가 됩니다.' },
      { key: 'lam', symbol: 'λ', label: '빛의 파장', unit: 'nm', min: 380, max: 750, step: 5, value: 550, color: C.lam, dec: 0, reset: true,
        where: '빛의 <b>파장</b>(색)입니다. 길수록(붉을수록) 더 많이 퍼집니다 — 그래서 같은 슬릿에 백색광을 넣으면 가장자리가 무지개처럼 갈라집니다.' },
      { key: 'Ls', symbol: 'L', label: '스크린까지 거리', unit: 'm', min: .2, max: 5, step: .1, value: 1, color: C.Ls, dec: 1,
        where: '슬릿에서 <b>스크린까지의 거리</b>입니다. 각도는 그대로지만 멀수록 무늬가 통째로 커집니다 — 각도를 거리로 환산해 주는 값입니다.' }
    ],
    vars: {
      th: { symbol: 'θ₁', label: '첫 어두운 무늬 각', unit: '°', color: C.th,
        where: '중앙 밝은 무늬의 <b>가장자리 각도</b>입니다. sin θ₁ = λ/a 로, 이 각이 "빛이 얼마나 퍼지는가"를 그대로 나타냅니다.' },
      wid: { symbol: 'W', label: '중앙 무늬 폭', unit: 'mm', color: C.wid,
        where: '스크린에 생긴 <b>가운데 밝은 띠의 폭</b>입니다. W = 2L·tan θ₁ 이고, 빛의 90% 가까이가 이 안에 들어옵니다.' }
    },
    formulas: [
      { name: '어두운 무늬 조건', tpl: 'sin θ_m = m{lam} ⁄ {a}   (m = 1, 2, 3…)' },
      { name: '중앙 무늬의 반각', tpl: 'sin {th} = {lam} ⁄ {a}' },
      { name: '스크린에서의 폭', tpl: '{wid} = 2{Ls} · tan {th}' },
      { name: '세기 분포', tpl: 'I(θ) = I₀ (sin β ⁄ β)²,  β = π{a} sinθ ⁄ {lam}' }
    ],

    init(p) { return { ph: 0, done: false }; },
    step(st, p, dt) { st.ph += dt * 3.2; },

    graphs: [{
      title: '스크린 위의 세기 분포', xKey: 'pos', xUnit: 'mm', y0: 0,
      series: [{ key: 'I', label: '세기', color: C.lam }]
    }],
    sample(st, p) {
      // 스크린을 한쪽 끝에서 반대쪽까지 훑으며 분포를 그린다
      const half = Math.min(isFinite(widthOf(p)) ? widthOf(p) * 1.8 : p.Ls * 2, p.Ls * 2);
      const u = ((st.t * .22) % 1) * 2 - 1;
      const y = u * half;
      return { pos: y * 1000, I: inten(p, Math.atan2(y, p.Ls)) };
    },

    readouts(st, p) {
      const r = ratio(p), W = widthOf(p);
      const spread = r >= 1;
      return [
        { label: 'λ / a (퍼짐의 척도)', value: r, unit: '', color: C.a, dec: 4 },
        { label: '첫 어두운 무늬 각 θ₁', value: spread ? 90 : th1(p) * 180 / Math.PI, unit: '°', color: C.th, dec: 2 },
        { label: '중앙 무늬 폭 W', value: isFinite(W) ? W * 1000 : Infinity, unit: 'mm', color: C.wid, dec: 2 },
        { label: '슬릿 폭은 파장의 몇 배', value: 1 / r, unit: '배', dec: 1, color: C.a },
        { label: '보이는 어두운 무늬 개수 (한쪽)', value: spread ? 0 : Math.floor(1 / r), unit: '개', dec: 0, color: '#93a2c4' },
        { label: '중앙 무늬에 들어오는 빛', value: 90.3, unit: '%', dec: 1, color: C.lam },
        { label: '첫 번째 곁무늬의 밝기', value: 4.7, unit: '%', dec: 1, color: '#93a2c4' },
        { label: '회절 정도', wide: true, color: spread ? '#fb7185' : (r > .05 ? '#fbbf24' : '#34d399'),
          value: spread ? '모든 방향으로 퍼진다 — 슬릿이 파장보다 좁아 "직진"이 의미 없다' :
                 (r > .05 ? '뚜렷하게 퍼진다 — 파동성이 눈에 보인다' :
                  (r > .005 ? '약간 퍼진다' : '거의 직진 — 기하광학 근사가 잘 맞는다')) },
        { label: '같은 슬릿에 붉은빛(700 nm)이면 W', value: isFinite(W) ? 2 * p.Ls * Math.tan(Math.asin(Math.min(.999, 700e-9 / (p.a * 1e-6)))) * 1000 : Infinity,
          unit: 'mm', dec: 2, color: '#fb7185' },
        { label: '같은 슬릿에 보랏빛(400 nm)이면 W', value: 2 * p.Ls * Math.tan(Math.asin(Math.min(.999, 400e-9 / (p.a * 1e-6)))) * 1000,
          unit: 'mm', dec: 2, color: '#a78bfa' }
      ];
    },

    notes: [
      '<b>틈을 좁힐수록 빛은 더 퍼집니다.</b> 직관과 정반대입니다 — 입자라면 좁은 틈을 지난 알갱이는 더 좁은 빔이 되어야 합니다. 파동이기 때문에, 틈 안의 모든 점에서 새 잔물결이 생겨 서로 간섭한다고 봐야만 설명됩니다(호이겐스 원리).',
      '<b>λ/a가 모든 것을 결정합니다.</b> 슬릿이 파장보다 훨씬 넓으면(λ/a ≪ 1) 회절이 안 보여 "빛은 직진한다"고 해도 됩니다. λ/a가 1에 가까워지면 거의 반구 전체로 퍼지고, 1을 넘으면 어두운 무늬 자체가 생기지 않습니다.',
      '<b>소리가 모퉁이를 돌아오는 이유</b>도 같습니다. 소리의 파장은 수십 cm~수 m라 문이나 벽 크기와 비슷해 잘 회절하지만, 빛의 파장은 0.5 µm라 일상 물체 뒤에서는 거의 회절하지 않아 선명한 그림자가 생깁니다.',
      '<b>이것이 망원경 분해능의 근원입니다.</b> 원형 구경에 대한 같은 계산이 θ = 1.22λ/D를 줍니다(천문학 트랙의 "망원경의 분해능"). 렌즈를 아무리 잘 갈아도 넘을 수 없는 한계가 여기서 나옵니다.',
      '<b>전파는 파장이 길어 건물 뒤로도 잘 돌아 들어갑니다.</b> FM 라디오(λ ≈ 3 m)는 건물 그늘에서도 잡히지만, 파장이 짧은 5G 밀리미터파(λ ≈ 5 mm)는 벽 하나에도 막혀 기지국을 촘촘히 깔아야 합니다.',
      '세기 분포의 중앙 봉우리에 <b>빛의 90.3%</b>가 들어오고, 첫 번째 곁무늬는 4.7%밖에 안 됩니다 — 그래서 실제로는 중앙 무늬만 "빛"으로 보입니다.'
    ],
    presets: [
      { name: '보통 슬릿 (10 µm)', set: { a: 10, lam: 550, Ls: 1 } },
      { name: '아주 좁은 슬릿 (1 µm)', set: { a: 1, lam: 550, Ls: 1 } },
      { name: '파장보다 좁게 (0.4 µm)', set: { a: .4, lam: 550, Ls: 1 } },
      { name: '넓은 슬릿 — 거의 직진', set: { a: 180, lam: 400, Ls: .2 } },
      { name: '붉은빛이 더 퍼진다', set: { a: 5, lam: 700, Ls: 1 } },
      { name: '보랏빛은 덜 퍼진다', set: { a: 5, lam: 400, Ls: 1 } }
    ],
    challenges: [
      {
        id: 'spread', title: '모든 방향으로 퍼뜨리기',
        desc: '슬릿을 파장보다 좁게 만들어, 어두운 무늬가 아예 생기지 않고 빛이 반구 전체로 퍼지게 해 보세요.',
        hint: 'λ/a ≥ 1 이 되면 sin θ = λ/a 를 만족하는 각도가 없습니다. 550 nm면 슬릿을 0.55 µm 아래로.',
        check: ({ P }) => ratio(P) >= 1
      },
      {
        id: 'straight', title: '거의 직진시키기',
        desc: '중앙 무늬 폭을 1 mm 이하로 줄여, 빛이 사실상 직진하는 것처럼 보이게 만들어 보세요.',
        hint: '슬릿을 넓히고 스크린을 가까이. W = 2L·λ/a 입니다.',
        check: ({ P }) => isFinite(widthOf(P)) && widthOf(P) <= 1e-3
      },
      {
        id: 'color', title: '색에 따라 달라지는 것',
        desc: '중앙 무늬 폭을 10 cm 이상으로 벌린 뒤, 파장만 바꿔 가며 붉은빛이 보랏빛보다 더 퍼지는 것을 확인하세요.',
        hint: '슬릿을 좁게, 스크린을 멀리. 측정값 칸의 "붉은빛이면 / 보랏빛이면" 두 줄을 비교하세요.',
        check: ({ P }) => isFinite(widthOf(P)) && widthOf(P) >= .1
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const r = ratio(p), t1 = th1(p), W = widthOf(p);
      const col = visRGB(p.lam);
      const rgbS = (al) => 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + al + ')';

      const sx = w * .30, cy = h * .36;             // 슬릿 위치
      const scrX = Math.min(w - 120, sx + Math.min(w * .34, 230));

      /* ── 들어오는 평면파 ── */
      ctx.save();
      ctx.strokeStyle = rgbS(.35); ctx.lineWidth = 1.6;
      for (let i = 0; i < 7; i++) {
        const xx = sx - 24 - ((i * 16 + st.ph * 14) % 112);
        if (xx < 24) continue;
        ctx.beginPath(); ctx.moveTo(xx, cy - 66); ctx.lineTo(xx, cy + 66); ctx.stroke();
      }
      ctx.restore();
      D.arrow(ctx, 30, cy, 34, 0, { color: rgbS(.8), width: 2.4, head: 7 });
      D.text(ctx, '평면파', 30, cy - 76, { size: 10.5, color: rgbS(.9) });

      /* ── 슬릿 ── */
      const slitPx = clamp(p.a * .9, 2.5, 52);
      ctx.fillStyle = 'rgba(147,162,196,.65)';
      ctx.fillRect(sx - 4, cy - 110, 8, 110 - slitPx / 2);
      ctx.fillRect(sx - 4, cy + slitPx / 2, 8, 110 - slitPx / 2);
      ctx.save(); if (hl === 'a') { ctx.shadowColor = C.a; ctx.shadowBlur = 14; }
      D.dim(ctx, sx - 22, cy - slitPx / 2, sx - 22, cy + slitPx / 2, 'a', C.a, hl === 'a');
      ctx.restore();
      D.text(ctx, fmt(p.a, 1) + ' µm', sx - 26, cy + slitPx / 2 + 22,
        { size: 10, color: hl === 'a' ? '#fff' : C.a, align: 'right' });

      /* ── 호이겐스 잔물결 ── */
      ctx.save();
      ctx.beginPath(); ctx.rect(sx, cy - 150, scrX - sx, 300); ctx.clip();
      const nSrc = 5;
      for (let k = 0; k < nSrc; k++) {
        const yy = cy + (-1 + 2 * k / (nSrc - 1)) * slitPx / 2 * .9;
        ctx.strokeStyle = rgbS(.13); ctx.lineWidth = 1;
        for (let m = 0; m < 6; m++) {
          const rr = ((st.ph * 16 + m * 22) % 132);
          if (rr < 2) continue;
          ctx.beginPath(); ctx.arc(sx, yy, rr, -1.45, 1.45); ctx.stroke();
        }
      }
      ctx.restore();

      /* ── 퍼짐 경계선 ── */
      const Lpx = scrX - sx;
      if (r < 1) {
        const dy = Lpx * Math.tan(t1);
        [-1, 1].forEach(s => D.line(ctx, sx, cy, scrX, cy + s * dy,
          { color: C.th, dash: [4, 5], width: 1.6, hot: hl === 'th' }));
        ctx.save(); ctx.strokeStyle = C.th; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(sx, cy, 46, -t1, 0); ctx.stroke(); ctx.restore();
        D.text(ctx, 'θ₁ = ' + fmt(t1 * 180 / Math.PI, 1) + '°', sx + 52, cy - 10,
          { size: 11, color: hl === 'th' ? '#fff' : C.th, bold: true });
      } else {
        D.text(ctx, '어두운 무늬가 없다 — 모든 방향으로 퍼진다', sx + 14, cy - 92,
          { size: 11, color: '#fb7185', bold: true });
      }

      /* ── 스크린 ── */
      const scH = Math.min(h * .52, 230);
      D.line(ctx, scrX, cy - scH / 2, scrX, cy + scH / 2, { color: 'rgba(200,211,239,.5)', width: 3 });
      const halfM = Math.min(isFinite(W) ? W * 1.9 : p.Ls * 2, p.Ls * 2);   // 표시하는 스크린 반폭 [m]
      const PY = y => cy + y / halfM * (scH / 2);
      for (let i = 0; i <= 120; i++) {
        const y = (-1 + 2 * i / 120) * halfM;
        const I = inten(p, Math.atan2(y, p.Ls));
        ctx.fillStyle = rgbS(clamp(Math.pow(I, .55), 0, 1) * .95);
        ctx.fillRect(scrX + 3, PY(y) - scH / 240 - .5, 16, scH / 120 + 1);
      }
      D.text(ctx, '스크린', scrX + 11, cy - scH / 2 - 10, { size: 10.5, color: '#93a2c4', align: 'center' });
      if (isFinite(W)) {
        D.dim(ctx, scrX + 26, PY(-W / 2), scrX + 26, PY(W / 2),
          'W = ' + fmt(W * 1000, 1) + ' mm', C.wid, hl === 'wid');
      }
      D.dim(ctx, sx, cy + scH / 2 + 18, scrX, cy + scH / 2 + 18, 'L = ' + fmt(p.Ls, 1) + ' m', C.Ls, hl === 'Ls');

      /* ── 세기 곡선 ── */
      const gx = 48, gy = h - 122, gw = Math.min(w - 96, 480), gh = 86;
      D.roundRect(ctx, gx, gy, gw, gh, 6); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
      D.text(ctx, '세기 분포 I(θ) = (sin β / β)²  — 중앙 봉우리에 90.3%', gx + 4, gy - 8, { size: 10.5, color: '#61719a' });
      ctx.save();
      ctx.strokeStyle = rgbS(.95); ctx.lineWidth = 2.2;
      if (hl === 'lam') { ctx.shadowColor = rgbS(1); ctx.shadowBlur = 12; }
      ctx.beginPath();
      for (let i = 0; i <= 240; i++) {
        const y = (-1 + 2 * i / 240) * halfM;
        const I = inten(p, Math.atan2(y, p.Ls));
        const X = gx + gw * i / 240, Y = gy + gh - I * (gh - 6) - 3;
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke(); ctx.restore();
      if (isFinite(W)) {
        [-1, 1].forEach(s => {
          const u = (s * W / 2 / halfM + 1) / 2;
          D.line(ctx, gx + gw * u, gy, gx + gw * u, gy + gh, { color: C.wid, dash: [3, 4] });
        });
      }
      D.text(ctx, 'λ/a = ' + fmt(r, 4) + (r >= 1 ? '  ≥ 1 → 완전히 퍼진다' : ''),
        gx, h - 18, { size: 12, color: hl === 'a' ? '#fff' : C.a, bold: true });
      D.text(ctx, 'λ = ' + fmt(p.lam, 0) + ' nm', gx + 210, h - 18,
        { size: 11.5, color: hl === 'lam' ? '#fff' : rgbS(1), bold: hl === 'lam' });
    }
  });
})();
