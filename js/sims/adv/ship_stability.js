/* [자율운항시스템공학] 선박의 복원성 — GM = KB + BM − KG,  GZ = (GM + ½BM·tan²θ)·sinθ */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { B: '#5eead4', d: '#60a5fa', KG: '#f472b6', th: '#fbbf24', GM: '#34d399', GZ: '#a78bfa', BM: '#5eead4' };
  const RHO = 1025, G = 9.81;

  const BMof = p => p.B * p.B / (12 * p.d);
  const KBof = p => p.d / 2;
  const GMof = p => KBof(p) + BMof(p) - p.KG;
  // 현측 직립(wall-sided) 공식
  function GZof(p, th) {
    const t = clamp(Math.tan(th), -3, 3);
    return (GMof(p) + .5 * BMof(p) * t * t) * Math.sin(th);
  }

  PS.register({
    id: 'ship-stability', mode: 'adv', category: '자율운항시스템공학',
    title: '선박의 복원성 (GM)',
    sub: 'GM = KB + BM − KG',
    tagline: '배는 왜 기울어도 다시 일어설까요? 무게중심 G와 메타센터 M의 높이 차이 하나가 전복을 가릅니다.',

    params: [
      { key: 'B', symbol: 'B', label: '선폭', unit: 'm', min: 8, max: 28, step: .5, value: 16, color: C.B, reset: true, dec: 1,
        where: '배의 <b>폭</b>입니다. BM = B²/(12d)에서 <b>제곱</b>으로 들어가므로 복원성에 가장 강력하게 작용합니다. 폭이 넓은 배가 잘 안 넘어지는 이유입니다.' },
      { key: 'd', symbol: 'd', label: '흘수', unit: 'm', min: 1.5, max: 9, step: .25, value: 4, color: C.d, reset: true, dec: 2,
        where: '물에 <b>잠긴 깊이</b>입니다. 파란 수면선 아래 부분이며, 깊을수록 부심 KB는 올라가지만 BM은 작아집니다.' },
      { key: 'KG', symbol: 'KG', label: '무게중심 높이', unit: 'm', min: 1, max: 12, step: .25, value: 5, color: C.KG, reset: true, dec: 2,
        where: '용골(K)에서 <b>무게중심 G까지의 높이</b>입니다. 분홍색 G점의 위치이며, 화물을 높이 쌓을수록 커져 GM을 갉아먹습니다. <b>복원성 사고의 주범</b>입니다.' },
      { key: 'th0', symbol: 'θ₀', label: '초기 경사각', unit: '°', min: 2, max: 35, step: 1, value: 15, color: C.th, reset: true, dec: 0,
        where: '파도나 바람에 <b>처음 기울어진 각도</b>입니다. 여기서 손을 떼면 배가 어떻게 움직이는지 보세요.' }
    ],
    vars: {
      GM: { symbol: 'GM', label: '메타센터 높이', unit: 'm', color: C.GM,
        where: '무게중심 G와 메타센터 M의 <b>높이 차</b>입니다. <b>GM &gt; 0이면 복원, GM &lt; 0이면 전복</b>합니다. 화면 중앙의 초록 화살표이며, 복원성의 최종 성적표입니다.' },
      BM: { symbol: 'BM', label: '메타센터 반지름', unit: 'm', color: C.BM,
        where: '부심 B에서 메타센터 M까지의 거리로, <b>수선면의 넓이(선폭)</b>가 결정합니다. B²/(12d).' },
      KB: { symbol: 'KB', label: '부심 높이', unit: 'm', color: C.d,
        where: '<b>잠긴 부분의 무게중심</b>(부력이 작용하는 점) 높이입니다. 배가 기울면 B가 낮은 쪽으로 옮겨 가며 복원 모멘트를 만듭니다.' },
      GZ: { symbol: 'GZ', label: '복원정', unit: 'm', color: C.GZ,
        where: 'G에서 부력 작용선까지의 <b>수평 거리</b>(보라색 팔)입니다. 이 팔의 길이 × 배의 무게 = 배를 일으켜 세우는 모멘트입니다.' },
      th: { symbol: 'θ', label: '경사각', unit: '°', color: C.th,
        where: '배가 기울어진 각도입니다. 오른쪽 <b>GZ 곡선</b>의 가로축이며, 흰 점이 현재 상태입니다.' }
    },
    formulas: [
      { name: '메타센터 높이', tpl: '{GM} = {KB} + {BM} − KG' },
      { name: '메타센터 반지름', tpl: '{BM} = B² ⁄ (12·d)' },
      { name: '복원정 (소각도)', tpl: '{GZ} ≈ {GM} · sin{th}' },
      { name: '복원 모멘트', tpl: 'M = W · {GZ}' },
      { name: '횡요 주기', tpl: 'T = 2π·k ⁄ √( g·{GM} )' }
    ],

    init(p) { return { th: p.th0 * Math.PI / 180, w: 0, capsized: false, maxTh: 0 }; },

    step(st, p, dt) {
      if (st.capsized) return;
      const k = .35 * p.B;                       // 횡요 회전반경
      const acc = -G * GZof(p, st.th) / (k * k) - 0.12 * Math.sqrt(G * Math.abs(GMof(p)) + .01) / k * st.w * 2;
      st.w += acc * dt;
      st.th += st.w * dt;
      st.maxTh = Math.max(st.maxTh, Math.abs(st.th));
      if (Math.abs(st.th) > 1.25) { st.capsized = true; st.done = true; }
    },

    graphs: [
      { title: '경사각 – 시간', xmin: 10, window: 24, series: [{ key: 'deg', label: 'θ (°)', color: C.th }] },
      { title: 'GZ 곡선 (복원정 – 경사각)', xKey: 'deg', xUnit: '°', xMin: -50, xMax: 50,
        series: [{ key: 'gz', label: 'GZ (m)', color: C.GZ }] }
    ],
    sample(st, p) { return { deg: st.th * 180 / Math.PI, gz: GZof(p, st.th) }; },

    readouts(st, p) {
      const GM = GMof(p), th = st.th, GZ = GZof(p, th);
      const W = RHO * G * p.B * p.d;             // 단위 길이당 배수량 무게 (N/m)
      const k = .35 * p.B;
      const Troll = GM > 0 ? 2 * Math.PI * k / Math.sqrt(G * GM) : NaN;
      const loll = GM < 0 ? Math.atan(Math.sqrt(-2 * GM / BMof(p))) * 180 / Math.PI : 0;
      return [
        { label: '부심 높이 KB', value: KBof(p), unit: 'm', color: C.d },
        { label: '메타센터 반지름 BM', value: BMof(p), unit: 'm', color: C.BM },
        { label: '메타센터 높이 KM', value: KBof(p) + BMof(p), unit: 'm' },
        { label: 'GM (복원성)', value: GM, unit: 'm', color: GM > 0 ? C.GM : '#fb7185' },
        { label: '현재 경사각 θ', value: th * 180 / Math.PI, unit: '°', color: C.th },
        { label: '복원정 GZ', value: GZ, unit: 'm', color: C.GZ, dec: 3 },
        { label: '복원 모멘트 (m당)', value: W * GZ / 1000, unit: 'kN·m', dec: 0 },
        { label: '횡요 주기 T', value: Troll, unit: 's' },
        { label: '판정', wide: true, color: GM > .15 ? '#34d399' : (GM > 0 ? '#fbbf24' : '#fb7185'),
          value: st.capsized ? '⚠ 전복 (capsized)' :
            (GM > .15 ? '안정 — 스스로 일어섭니다' :
              (GM > 0 ? '복원력 부족 — 매우 느린 횡요' : '불안정 GM<0 → 횡경사각 ' + fmt(loll, 0) + '°로 기울어 멈춤')) }
      ];
    },

    notes: [
      '<b>GM &gt; 0</b>이면 기울어도 스스로 일어섭니다. <b>GM &lt; 0</b>이면 기운 채로 안정되거나 전복합니다.',
      '선폭 B는 BM에 <b>제곱</b>으로 들어갑니다. 폭 1 m를 늘리는 것이 복원성 개선에 가장 효과적입니다.',
      '화물을 높이 쌓으면 KG가 올라가 GM이 줄어듭니다. 실제 <b>전복 사고의 대부분</b>이 이 문제입니다.',
      'GM이 너무 크면 오히려 <b>횡요 주기가 짧아져</b> 승객이 멀미하고 화물이 파손됩니다. 적당한 GM이 좋은 설계입니다.',
      'KG를 올려 GM을 음수로 만들어 보세요. 배가 똑바로 서지 못하고 한쪽으로 기운 채 멈춥니다(횡경사, angle of loll).'
    ],
    presets: [
      { name: '표준 화물선', set: { B: 16, d: 4, KG: 5, th0: 15 } },
      { name: '폭이 넓은 바지선', set: { B: 26, d: 3, KG: 5 } },
      { name: '화물을 높이 적재 (위험)', set: { B: 16, d: 4, KG: 8.2 } },
      { name: 'GM < 0 → 전복', set: { B: 12, d: 5, KG: 8 } },
      { name: 'GM 과대 (심한 횡요)', set: { B: 24, d: 3, KG: 2 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const th = st.th, GM = GMof(p), BM = BMof(p), KB = KBof(p);
      const PPM = clamp(Math.min(w * .30, h * .5) / Math.max(p.B * .75, (p.KG + BM) * .8), 6, 26);
      const ox = w * .28, oy = h * .58;                 // 수면 중심(화면)
      // 선체 로컬좌표: x=폭방향(중앙 0), y=용골(0)에서 위로.
      // 흘수 위치 (0, d)를 수면 중심에 두고 그 점을 축으로 기울인다(배수량 보존 근사)
      const X = (x, y) => ox + (x * Math.cos(th) + (y - p.d) * Math.sin(th)) * PPM;
      const Y = (x, y) => oy - (-x * Math.sin(th) + (y - p.d) * Math.cos(th)) * PPM;

      /* ── 바다 ─────────────────────────────── */
      ctx.save();
      const sea = ctx.createLinearGradient(0, oy, 0, h);
      sea.addColorStop(0, 'rgba(56,120,180,.35)'); sea.addColorStop(1, 'rgba(16,40,72,.55)');
      ctx.fillStyle = sea; ctx.fillRect(0, oy, w, h - oy);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = 'rgba(147,196,230,.5)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) ctx.lineTo(x, oy + Math.sin(x * .045 + st.t * 1.7) * 3);
      ctx.stroke(); ctx.restore();
      D.text(ctx, '수면', 12, oy - 8, { size: 10, color: 'rgba(147,196,230,.7)' });

      /* ── 선체 ─────────────────────────────── */
      const H = Math.max(p.d * 1.9, p.KG * 1.25 + 1);    // 형심(깊이)
      const hull = [[-p.B / 2, 0], [p.B / 2, 0], [p.B / 2, H], [-p.B / 2, H]];
      const pts = hull.map(q => [X(q[0], q[1]), Y(q[0], q[1])]);

      // 잠긴 부분(수면 아래) 클리핑
      ctx.save();
      ctx.beginPath(); ctx.rect(0, oy, w, h - oy); ctx.clip();
      D.poly(ctx, pts, { fill: 'rgba(94,234,212,.30)' });
      ctx.restore();
      D.poly(ctx, pts, { stroke: hl === 'B' ? '#a7f3e5' : '#93a2c4', width: 2.5, hot: hl === 'B' });
      // 갑판 표시
      D.line(ctx, X(-p.B / 2, H), Y(-p.B / 2, H), X(p.B / 2, H), Y(p.B / 2, H), { color: '#dbe4f6', width: 3 });

      // 중심선(용골 K → 갑판)
      D.line(ctx, X(0, 0), Y(0, 0), X(0, H), Y(0, H), { color: 'rgba(255,255,255,.28)', dash: [4, 5] });
      D.dot(ctx, X(0, 0), Y(0, 0), 4, '#93a2c4');
      D.text(ctx, 'K', X(0, 0) - 14, Y(0, 0) + 4, { size: 11, color: '#93a2c4', bold: true });

      // 부심 B: 기울었을 때 잠긴 단면의 도심 (직립 현측 근사)
      const tanth = clamp(Math.tan(th), -3, 3);
      const bxl = BM * tanth, byl = KB + .5 * BM * tanth * tanth;
      const Bx = X(bxl, byl), By = Y(bxl, byl);
      const Gx = X(0, p.KG), Gy = Y(0, p.KG);
      // 메타센터 M (중심선 위, KM 높이)
      const Mx = X(0, KB + BM), My = Y(0, KB + BM);

      // 부력 작용선 (B에서 연직 위로)
      D.line(ctx, Bx, By + 30, Bx, My - 34, { color: 'rgba(94,234,212,.5)', dash: [4, 5], width: 1.4 });

      // 힘 화살표
      D.arrow(ctx, Bx, By, 0, -64, { color: C.B, width: 4, hot: hl === 'KB', label: '부력', lx: -26, ly: -8 });
      D.arrow(ctx, Gx, Gy, 0, 64, { color: C.KG, width: 4, hot: hl === 'KG', label: '무게', lx: 26, ly: 8 });

      // GZ 팔 (G에서 부력선까지 수평 거리)
      const GZ = GZof(p, th);
      ctx.save();
      ctx.strokeStyle = C.GZ; ctx.lineWidth = hl === 'GZ' ? 4 : 3;
      if (hl === 'GZ') { ctx.shadowColor = C.GZ; ctx.shadowBlur = 14; }
      ctx.beginPath(); ctx.moveTo(Gx, Gy); ctx.lineTo(Bx, Gy); ctx.stroke();
      ctx.restore();
      if (Math.abs(Bx - Gx) > 6) D.tag(ctx, 'GZ = ' + fmt(GZ, 2) + ' m', (Gx + Bx) / 2, Gy - 16, C.GZ, hl === 'GZ');

      // 점 표시
      const pt = (x, y, label, col, hot) => {
        D.dot(ctx, x, y, hot ? 7 : 5, col, hot);
        D.text(ctx, label, x + 10, y + 4, { size: 12, color: col, bold: true, glow: hot });
      };
      pt(Bx, By, 'B', C.B, hl === 'KB' || hl === 'BM');
      pt(Gx, Gy, 'G', C.KG, hl === 'KG');
      pt(Mx, My, 'M', C.GM, hl === 'GM' || hl === 'BM');

      // GM 표시 (G ↔ M)
      D.dim(ctx, Gx - 26, Gy, Mx - 26, My, 'GM = ' + fmt(GM, 2) + ' m', GM > 0 ? C.GM : '#fb7185', hl === 'GM');

      // 경사각 표시
      D.text(ctx, 'θ = ' + fmt(th * 180 / Math.PI, 1) + '°', ox, oy + 34,
        { size: 13, color: hl === 'th' ? '#fff' : C.th, align: 'center', bold: hl === 'th' });

      /* ── GZ 곡선 ──────────────────────────── */
      const px = w * .58, py = 60, pw = w - px - 34, ph = h * .46;
      const AMAX = 60;
      const gzs = [];
      for (let a = -AMAX; a <= AMAX; a += 2) gzs.push([a, GZof(p, a * Math.PI / 180)]);
      let gzmax = .5;
      gzs.forEach(q => gzmax = Math.max(gzmax, Math.abs(q[1])));
      const GX = a => px + ((a + AMAX) / (2 * AMAX)) * pw;
      const GY = v => py + ph / 2 - (v / gzmax) * (ph / 2 - 8);

      D.roundRect(ctx, px, py, pw, ph, 8);
      ctx.fillStyle = 'rgba(255,255,255,.025)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.stroke();
      D.text(ctx, 'GZ 곡선 — 복원정 vs 경사각', px, py - 12, { size: 11.5, color: '#93a2c4' });
      D.line(ctx, px, GY(0), px + pw, GY(0), { color: 'rgba(255,255,255,.2)' });
      D.line(ctx, GX(0), py, GX(0), py + ph, { color: 'rgba(255,255,255,.1)' });
      [-40, -20, 20, 40].forEach(a => D.text(ctx, a + '°', GX(a), py + ph - 4, { size: 9.5, color: '#61719a', align: 'center' }));

      ctx.save();
      ctx.strokeStyle = C.GZ; ctx.lineWidth = hl === 'GZ' || hl === 'GM' ? 3 : 2.2;
      if (hl === 'GZ' || hl === 'GM') { ctx.shadowColor = C.GZ; ctx.shadowBlur = 12; }
      ctx.beginPath();
      gzs.forEach((q, i) => i ? ctx.lineTo(GX(q[0]), GY(q[1])) : ctx.moveTo(GX(q[0]), GY(q[1])));
      ctx.stroke(); ctx.restore();

      // 소각도 근사선 GM·sinθ
      ctx.save();
      ctx.strokeStyle = 'rgba(52,211,153,.45)'; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let a = -AMAX; a <= AMAX; a += 2) {
        const v = GM * Math.sin(a * Math.PI / 180);
        const yy = GY(clamp(v, -gzmax, gzmax));
        a === -AMAX ? ctx.moveTo(GX(a), yy) : ctx.lineTo(GX(a), yy);
      }
      ctx.stroke(); ctx.restore();
      D.text(ctx, '점선: 소각도 근사 GM·sinθ', px + 8, py + 16, { size: 10, color: 'rgba(52,211,153,.7)' });

      const cdeg = clamp(th * 180 / Math.PI, -AMAX, AMAX);
      D.line(ctx, GX(cdeg), py, GX(cdeg), py + ph, { color: C.th, dash: [3, 4], hot: hl === 'th' });
      D.dot(ctx, GX(cdeg), GY(clamp(GZ, -gzmax, gzmax)), 6, '#fff', true);

      if (GM < 0) D.tag(ctx, 'GM < 0 — 똑바로 서지 못합니다', px + pw / 2, py + ph + 22, '#fb7185', true);
      if (st.capsized) D.tag(ctx, '⚠ 전복 — ↺ 처음으로', w / 2, 26, '#fb7185', true);
    }
  });
})();
