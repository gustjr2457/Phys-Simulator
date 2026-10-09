/* [고등물리·역학과 에너지] 열기관과 열효율 — η = 1 − Q_c/Q_h ≤ 1 − T_c/T_h
   열에너지를 전부 일로 바꾸는 기관은 만들 수 없다. 고온에서 열을 받으면 반드시
   일부를 저온으로 버려야만 하고, 그 최소량을 온도비가 정한다(열역학 제2법칙).
   자동차 엔진이 30%, 발전소가 40%대에 머무는 것은 기술이 모자라서가 아니라
   카르노가 1824년에 증명한 한계에 가까워져 있기 때문이다.
   (물리학Ⅰ '열역학 법칙' 단원) */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { Th: '#fb7185', Tc: '#60a5fa', Qh: '#fbbf24', qual: '#5eead4',
              eta: '#34d399', W: '#a78bfa', Qc: '#60a5fa' };

  const carnot = p => 1 - p.Tc / p.Th;
  const etaOf = p => carnot(p) * p.qual;
  const Wof = p => p.Qh * etaOf(p);
  const QcOf = p => p.Qh - Wof(p);
  const dSof = p => QcOf(p) / p.Tc - p.Qh / p.Th;            // 전체 엔트로피 변화

  PS.register({
    id: 'b-heatengine', mode: 'basic', category: '역학과 에너지',
    title: '열기관과 열효율',
    sub: 'η = 1 − T_c/T_h',
    tagline: '열을 전부 일로 바꾸는 기관은 만들 수 없습니다. 받은 열의 일부는 반드시 차가운 쪽으로 버려야 하고, 그 최소량을 온도비가 정합니다 — 열역학 제2법칙.',

    params: [
      { key: 'Th', symbol: 'T_h', label: '고온부 온도', unit: 'K', min: 350, max: 2000, step: 10, value: 800, color: C.Th, dec: 0,
        where: '열을 공급받는 <b>뜨거운 쪽의 온도</b>(위쪽 붉은 저장고)입니다. 높을수록 효율 한계가 올라가지만, 재료가 녹지 않아야 한다는 벽에 부딪힙니다.' },
      { key: 'Tc', symbol: 'T_c', label: '저온부 온도', unit: 'K', min: 250, max: 500, step: 5, value: 300, color: C.Tc, dec: 0,
        where: '열을 버리는 <b>차가운 쪽의 온도</b>(아래 파란 저장고)입니다. 현실에서는 바깥 공기나 강물이라 300 K 근처에서 거의 고정됩니다 — 설계자가 거의 못 건드리는 값입니다.' },
      { key: 'Qh', symbol: 'Q_h', label: '공급하는 열', unit: 'kJ', min: 10, max: 500, step: 10, value: 100, color: C.Qh, dec: 0,
        where: '고온부에서 기관에 <b>넣어 주는 열의 양</b>입니다. 효율은 바꾸지 않고, 나오는 일과 버리는 열을 비례해서 키웁니다.' },
      { key: 'qual', symbol: 'k', label: '카르노 대비 완성도', unit: '', min: .1, max: 1, step: .01, value: .6, color: C.qual, dec: 2,
        where: '실제 기관이 <b>이론 한계의 몇 %까지 도달했는가</b>입니다. 마찰·열손실·비가역 과정 때문에 1이 될 수 없습니다. 실제 자동차 엔진이 0.5~0.6, 최신 복합화력이 0.7 정도입니다.' }
    ],
    vars: {
      eta: { symbol: 'η', label: '열효율', unit: '', color: C.eta,
        where: '넣은 열 중 <b>일로 바뀐 비율</b>입니다. 오른쪽 게이지에서 카르노 한계(초록 눈금)와 비교해 보세요.' },
      W: { symbol: 'W', label: '한 일', unit: 'kJ', color: C.W,
        where: '기관이 밖으로 내놓은 <b>쓸모 있는 일</b>(오른쪽으로 나가는 보라 화살표)입니다.' },
      Qc: { symbol: 'Q_c', label: '버리는 열', unit: 'kJ', color: C.Qc,
        where: '저온부로 <b>반드시 버려야 하는 열</b>(아래로 내려가는 파란 화살표)입니다. 이것을 0으로 만들면 제2법칙이 깨집니다.' }
    },
    formulas: [
      { name: '열역학 제1법칙 (에너지 보존)', tpl: '{Qh} = {W} + {Qc}' },
      { name: '열효율의 정의', tpl: '{eta} = {W} ⁄ {Qh} = 1 − {Qc} ⁄ {Qh}' },
      { name: '카르노 한계 (제2법칙)', tpl: '{eta} ≤ 1 − {Tc} ⁄ {Th}' },
      { name: '엔트로피는 줄지 않는다', tpl: '{Qc}⁄{Tc} − {Qh}⁄{Th} ≥ 0' }
    ],

    init(p) { return { ph: 0, done: false }; },
    step(st, p, dt) { st.ph += dt * (1 + etaOf(p) * 3); },

    graphs: [{
      title: '에너지의 행방', xmin: 4, window: 6, y0: 0,
      series: [
        { key: 'cw', label: '누적 일 W (kJ)', color: C.W },
        { key: 'cq', label: '누적 버린 열 Q_c (kJ)', color: C.Qc }
      ]
    }],
    sample(st, p) {
      const cyc = st.t * 2;
      return { cw: Wof(p) * cyc, cq: QcOf(p) * cyc };
    },

    readouts(st, p) {
      const cr = carnot(p), e = etaOf(p), W = Wof(p), Qc = QcOf(p);
      return [
        { label: '카르노 한계 효율', value: cr * 100, unit: '%', color: '#34d399', dec: 1 },
        { label: '실제 효율 η', value: e * 100, unit: '%', color: C.eta, dec: 1 },
        { label: '한 일 W', value: W, unit: 'kJ', color: C.W, dec: 1 },
        { label: '버리는 열 Q_c', value: Qc, unit: 'kJ', color: C.Qc, dec: 1 },
        { label: '버려지는 비율', value: Qc / p.Qh * 100, unit: '%', dec: 1, color: C.Qc },
        { label: '온도비 T_c/T_h', value: p.Tc / p.Th, unit: '', dec: 3, color: C.Th },
        { label: '전체 엔트로피 변화', value: dSof(p), unit: 'kJ/K', dec: 4,
          color: dSof(p) >= -1e-9 ? '#34d399' : '#fb7185' },
        { label: '제2법칙 점검', wide: true, color: dSof(p) >= -1e-9 ? '#34d399' : '#fb7185',
          value: dSof(p) >= -1e-9 ? '✔ 엔트로피가 줄지 않는다 — 가능한 기관' : '✘ 불가능 (카르노 한계를 넘었다)' },
        { label: '실제 기관과 비교', wide: true, color: '#fbbf24',
          value: e >= .55 ? '최신 복합화력발전(60%)급' : (e >= .38 ? '화력발전소(40%)급' :
                 (e >= .25 ? '자동차 가솔린 엔진(30%)급' : '증기기관차(8%)급')) },
        { label: '효율 100%가 되려면', wide: true, color: '#93a2c4',
          value: '저온부가 절대영도(0 K)여야 한다 — 도달 불가능' }
      ];
    },

    notes: [
      '<b>열을 전부 일로 바꿀 수 없습니다.</b> 이것이 열역학 제2법칙의 한 표현(켈빈-플랑크 서술)입니다. 에너지는 보존되지만(제1법칙), 그 에너지의 "질"이 달라서 — 흩어진 열에너지를 질서 있는 일로 되돌리는 데는 대가가 따릅니다.',
      '<b>카르노 한계는 온도비만으로 정해집니다.</b> 기관의 재료나 설계와 전혀 무관하게, 1 − T_c/T_h를 넘을 수 없습니다. 1824년 카르노가 증기기관이 어떻게 생겼는지와 상관없이 증명했습니다.',
      '<b>저온부는 거의 못 건드립니다.</b> 현실의 저온부는 바깥 공기나 강물이라 300 K 근처에 묶여 있습니다. 그래서 효율을 올리는 길은 <b>고온부를 올리는 것</b>뿐인데, 그러면 터빈 날개가 녹습니다 — 발전 기술의 역사가 "더 잘 견디는 재료 찾기"인 이유입니다.',
      '그래서 복합화력발전은 <b>기관을 두 번 돌립니다.</b> 가스터빈(1500 K)에서 버린 열로 다시 증기터빈을 돌려, 전체 효율을 60%대까지 끌어올립니다.',
      '<b>효율이 낮다고 에너지가 사라지는 것은 아닙니다.</b> 버려진 열도 그대로 남아 강물과 공기를 데웁니다 — 다만 너무 흩어져서 더는 일로 꺼내 쓸 수 없을 뿐입니다. 이것이 엔트로피가 말하는 "에너지의 질"입니다.',
      '열기관을 거꾸로 돌리면 <b>냉장고와 히트펌프</b>가 됩니다. 일을 넣어 열을 차가운 쪽에서 뜨거운 쪽으로 퍼올리는 것이고, 역시 같은 한계식의 지배를 받습니다.'
    ],
    presets: [
      { name: '자동차 가솔린 엔진', set: { Th: 800, Tc: 300, Qh: 100, qual: .6 } },
      { name: '증기기관차 (초기)', set: { Th: 450, Tc: 300, Qh: 100, qual: .45 } },
      { name: '화력발전소', set: { Th: 850, Tc: 300, Qh: 100, qual: .62 } },
      { name: '복합화력 (가스터빈)', set: { Th: 1700, Tc: 300, Qh: 100, qual: .72 } },
      { name: '고온부를 올리면', set: { Th: 2000, Tc: 300, Qh: 100, qual: .6 } },
      { name: '이상적인 카르노 기관', set: { Th: 800, Tc: 300, Qh: 100, qual: 1 } }
    ],
    challenges: [
      {
        id: 'half', title: '효율 50% 넘기기',
        desc: '실제 효율을 50% 이상으로 올려 보세요 — 현실의 최신 발전소 수준입니다.',
        hint: '고온부 온도를 올리는 것이 가장 효과적입니다. 완성도도 함께 올려 보세요.',
        check: ({ P }) => etaOf(P) >= .5
      },
      {
        id: 'carnot', title: '카르노 기관 만들기',
        desc: '완성도를 1.00(한계에 도달)으로 두고, 전체 엔트로피 변화가 정확히 0이 되는 것을 확인하세요 — 가역 기관입니다.',
        hint: '완성도 슬라이더를 최대로. 이때만 엔트로피가 늘지 않고, 현실에서는 도달할 수 없습니다.',
        check: ({ P }) => P.qual >= .999 && Math.abs(dSof(P)) < 1e-6
      },
      {
        id: 'limit', title: '저온부가 발목을 잡는 것 확인하기',
        desc: '고온부를 최대(2000 K)로 올려도 효율이 100%에 한참 못 미치는 것을 확인하세요 — 저온부를 0 K로 못 만들기 때문입니다.',
        hint: 'η_max = 1 − T_c/T_h. T_c = 300 K이면 T_h가 아무리 커도 100%에 도달하지 못합니다.',
        check: ({ P }) => P.Th >= 1900 && carnot(P) < 1
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const cr = carnot(p), e = etaOf(p), W = Wof(p), Qc = QcOf(p);

      const cx = w * .32, cy = h * .46;
      const rw = Math.min(w * .32, 220), rh = 36;

      /* ── 고온 저장고 ── */
      ctx.save(); if (hl === 'Th') { ctx.shadowColor = C.Th; ctx.shadowBlur = 18; }
      D.roundRect(ctx, cx - rw / 2, cy - 140, rw, rh, 6);
      ctx.fillStyle = 'rgba(251,113,133,.25)'; ctx.fill();
      ctx.strokeStyle = C.Th; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      D.text(ctx, '고온부  T_h = ' + fmt(p.Th, 0) + ' K', cx, cy - 140 + rh / 2 + 5,
        { size: 12, color: hl === 'Th' ? '#fff' : C.Th, align: 'center', bold: true });

      /* ── 기관 ── */
      const er = 44;
      ctx.save();
      ctx.strokeStyle = 'rgba(200,211,239,.7)'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(cx, cy, er, 0, 7); ctx.stroke();
      ctx.translate(cx, cy); ctx.rotate(st.ph);
      ctx.strokeStyle = 'rgba(200,211,239,.5)'; ctx.lineWidth = 3;
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * er * .8, Math.sin(a) * er * .8); ctx.stroke();
      }
      ctx.restore();
      D.text(ctx, '기관', cx, cy + 5, { size: 12, color: '#e8eefc', align: 'center', bold: true });

      /* ── 저온 저장고 ── */
      ctx.save(); if (hl === 'Tc') { ctx.shadowColor = C.Tc; ctx.shadowBlur = 18; }
      D.roundRect(ctx, cx - rw / 2, cy + 104, rw, rh, 6);
      ctx.fillStyle = 'rgba(96,165,250,.22)'; ctx.fill();
      ctx.strokeStyle = C.Tc; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      D.text(ctx, '저온부  T_c = ' + fmt(p.Tc, 0) + ' K', cx, cy + 104 + rh / 2 + 5,
        { size: 12, color: hl === 'Tc' ? '#fff' : C.Tc, align: 'center', bold: true });

      /* ── 에너지 흐름 (폭이 양에 비례) ── */
      const scale = 70 / p.Qh;
      const wQh = clamp(p.Qh * scale, 6, 70), wW = clamp(W * scale, 2, 70), wQc = clamp(Qc * scale, 2, 70);
      // Q_h (위 → 기관)
      ctx.save(); if (hl === 'Qh') { ctx.shadowColor = C.Qh; ctx.shadowBlur = 14; }
      ctx.fillStyle = 'rgba(251,191,36,.45)';
      ctx.fillRect(cx - wQh / 2, cy - 104, wQh, 60 - er + 44); ctx.restore();
      D.arrow(ctx, cx, cy - 100, 0, 46, { color: C.Qh, width: 3, head: 10, hot: hl === 'Qh' });
      D.tag(ctx, 'Q_h = ' + fmt(p.Qh, 0) + ' kJ', cx - wQh / 2 - 56, cy - 76, C.Qh, hl === 'Qh');
      // W (기관 → 오른쪽)
      ctx.save(); if (hl === 'W') { ctx.shadowColor = C.W; ctx.shadowBlur = 14; }
      ctx.fillStyle = 'rgba(167,139,250,.45)';
      ctx.fillRect(cx + er, cy - wW / 2, 80, wW); ctx.restore();
      D.arrow(ctx, cx + er + 4, cy, 86, 0, { color: C.W, width: 3, head: 10, hot: hl === 'W' });
      D.tag(ctx, 'W = ' + fmt(W, 1) + ' kJ', cx + er + 60, cy - 30, C.W, hl === 'W');
      D.text(ctx, '쓸모 있는 일', cx + er + 60, cy + 32, { size: 10, color: C.W, align: 'center' });
      // Q_c (기관 → 아래)
      ctx.save(); if (hl === 'Qc') { ctx.shadowColor = C.Qc; ctx.shadowBlur = 14; }
      ctx.fillStyle = 'rgba(96,165,250,.40)';
      ctx.fillRect(cx - wQc / 2, cy + er, wQc, 104 - er); ctx.restore();
      D.arrow(ctx, cx, cy + er + 4, 0, 92, { color: C.Qc, width: 3, head: 10, hot: hl === 'Qc' });
      D.tag(ctx, 'Q_c = ' + fmt(Qc, 1) + ' kJ', cx - wQc / 2 - 58, cy + 78, C.Qc, hl === 'Qc');
      D.text(ctx, '반드시 버려야 하는 열', cx - wQc / 2 - 58, cy + 98, { size: 9.5, color: C.Qc, align: 'center' });

      /* ── 효율 게이지 ── */
      const gx = Math.min(w - 86, cx + rw / 2 + 120), gTop = cy - 150, gH = 250, gW = 34;
      if (gx + gW + 50 < w + 50) {
        D.roundRect(ctx, gx, gTop, gW, gH, 6); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
        // 불가능 영역 (카르노 위)
        ctx.save(); ctx.fillStyle = 'rgba(251,113,133,.14)';
        ctx.fillRect(gx, gTop, gW, gH * (1 - cr)); ctx.restore();
        D.text(ctx, '불가능', gx + gW / 2, gTop + 14, { size: 9, color: 'rgba(251,113,133,.9)', align: 'center' });
        // 실제 효율
        ctx.save(); if (hl === 'eta') { ctx.shadowColor = C.eta; ctx.shadowBlur = 16; }
        D.roundRect(ctx, gx, gTop + gH * (1 - e), gW, gH * e, 6);
        ctx.fillStyle = C.eta; ctx.globalAlpha = .8; ctx.fill(); ctx.restore();
        // 카르노 한계선
        D.line(ctx, gx - 8, gTop + gH * (1 - cr), gx + gW + 8, gTop + gH * (1 - cr),
          { color: '#34d399', width: 2.2 });
        D.text(ctx, '카르노 ' + fmt(cr * 100, 1) + '%', gx + gW + 12, gTop + gH * (1 - cr) + 4,
          { size: 10, color: '#34d399' });
        D.text(ctx, 'η = ' + fmt(e * 100, 1) + '%', gx + gW / 2, gTop - 10,
          { size: 13, color: hl === 'eta' ? '#fff' : C.eta, align: 'center', bold: true });
        D.text(ctx, '0%', gx + gW / 2, gTop + gH + 15, { size: 9, color: '#4b5a80', align: 'center' });
        D.text(ctx, '100%', gx + gW / 2, gTop - 24, { size: 9, color: '#4b5a80', align: 'center' });
      }

      /* ── 요약 ── */
      D.text(ctx, 'η ≤ 1 − T_c/T_h = ' + fmt(cr * 100, 1) + '%   (재료·설계와 무관한 벽)',
        36, h - 32, { size: 12, color: '#34d399', bold: true });
      D.text(ctx, 'Q_h = W + Q_c  →  ' + fmt(p.Qh, 0) + ' = ' + fmt(W, 1) + ' + ' + fmt(Qc, 1) + ' kJ',
        36, h - 12, { size: 11, color: '#93a2c4' });
    }
  });
})();
