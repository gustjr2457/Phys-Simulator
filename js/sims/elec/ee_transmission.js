/* [전기공학·전력공학] 변압기와 송전 손실 — P_loss = 3I²R, I = P/(√3·V·cosφ)
   왜 발전소에서 765,000 V라는 무서운 전압으로 전기를 보내는가. 보내야 할 전력 P가
   정해져 있으면 전압을 올린 만큼 전류가 줄고, 손실은 전류의 제곱이므로 — 전압을
   2배로 올리면 손실은 1/4이 된다. 변압기가 전압을 자유롭게 바꿀 수 있다는 사실
   하나가 교류 송전을 승리하게 만들었다(에디슨 vs 테슬라). */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { V: '#fbbf24', P: '#34d399', L: '#93a2c4', A: '#5eead4',
              I: '#60a5fa', R: '#fb7185', loss: '#fb923c' };
  const RHO = 2.83e-8;        // 알루미늄 비저항 Ω·m
  const PF = .95;             // 역률 cosφ
  const VGEN = 22;            // 발전기 단자 전압 kV

  const Rline = p => RHO * (p.L * 1000) / (p.A * 1e-6);       // Ω (한 상당)
  const Iline = p => p.P * 1e6 / (Math.sqrt(3) * p.V * 1e3 * PF);
  const lossOf = p => 3 * Math.pow(Iline(p), 2) * Rline(p);    // W (3상)
  const ratioOf = p => lossOf(p) / (p.P * 1e6);
  const dropOf = p => Math.sqrt(3) * Iline(p) * Rline(p) / (p.V * 1e3);

  PS.register({
    id: 'ee-transmission', mode: 'elec', category: '전력공학',
    title: '변압기와 송전 손실',
    sub: 'P_loss = I²R',
    tagline: '전압을 2배로 올리면 전류가 절반, 손실은 4분의 1이 됩니다. 765 kV 송전탑이 서 있는 이유가 이 한 줄입니다 — 전압을 내려 보면 전기가 도착하지도 못합니다.',

    params: [
      { key: 'V', symbol: 'V', label: '송전 전압', unit: 'kV', min: 20, max: 800, step: 10, value: 345, color: C.V, dec: 0,
        where: '승압 변압기가 만들어 내는 <b>송전선의 전압</b>입니다. 이 값을 올리면 같은 전력을 더 적은 전류로 보낼 수 있어 손실이 제곱으로 줄어듭니다 — 화면 아래 곡선에서 현재 위치를 확인하세요.' },
      { key: 'P', symbol: 'P', label: '보낼 전력', unit: 'MW', min: 10, max: 600, step: 10, value: 200, color: C.P, dec: 0,
        where: '도시가 <b>요구하는 전력</b>입니다(오른쪽 도시). 이 값은 설계자가 고를 수 없는 조건이고, 전류 I = P/(√3·V·cosφ)를 통해 손실을 키웁니다.' },
      { key: 'L', symbol: 'L', label: '송전 거리', unit: 'km', min: 10, max: 600, step: 10, value: 200, color: C.L, dec: 0,
        where: '발전소에서 도시까지의 <b>거리</b>입니다. 선로 저항 R = ρL/A가 거리에 정비례하므로 손실도 정비례합니다 — 원전을 해안에 짓는 비용이 여기에서 나옵니다.' },
      { key: 'A', symbol: 'A', label: '전선 단면적', unit: 'mm²', min: 100, max: 1600, step: 50, value: 400, color: C.A, dec: 0,
        where: '<b>전선의 굵기</b>입니다. 굵게 하면 저항이 반비례해서 줄지만, 알루미늄 값과 철탑 하중이 그대로 늘어납니다 — "전압으로 해결할 것인가, 구리/알루미늄으로 해결할 것인가"의 맞교환입니다.' }
    ],
    vars: {
      I: { symbol: 'I', label: '선로 전류', unit: 'A', color: C.I,
        where: '송전선을 흐르는 <b>전류</b>입니다(선 위를 움직이는 점의 밀도). 손실이 이 값의 <b>제곱</b>에 비례하므로, 전력 송전에서 가장 줄이고 싶은 값입니다.' },
      R: { symbol: 'R', label: '선로 저항', unit: 'Ω', color: C.R,
        where: '전선 한 상의 <b>저항</b> R = ρL/A입니다. 거리에 비례하고 굵기에 반비례합니다.' },
      loss: { symbol: 'P_loss', label: '손실 전력', unit: 'MW', color: C.loss,
        where: '선로에서 <b>열로 사라지는 전력</b>입니다(전선 위로 올라가는 주황 아지랑이). 전부 공기를 데우는 데 쓰이고, 요금은 소비자가 냅니다.' }
    },
    formulas: [
      { name: '선로 전류 (3상)', tpl: '{I} = {P} ⁄ (√3 · {V} · cosφ)' },
      { name: '선로 저항', tpl: '{R} = ρ{L} ⁄ {A}' },
      { name: '송전 손실', tpl: '{loss} = 3{I}²{R}' },
      { name: '전압을 올리면', tpl: '{loss} ∝ 1 ⁄ {V}²' },
      { name: '변압기 (전력은 보존)', tpl: 'V₁I₁ = V₂I₂,  V₂⁄V₁ = N₂⁄N₁' }
    ],

    init(p) { return { done: false }; },
    step(st, p, dt) { },

    readouts(st, p) {
      const I = Iline(p), R = Rline(p), ls = lossOf(p), rt = ratioOf(p), dr = dropOf(p);
      const ok = rt < 1;
      return [
        { label: '선로 전류 I', value: I, unit: 'A', color: C.I, dec: 0 },
        { label: '선로 저항 R', value: R, unit: 'Ω', color: C.R, dec: 2 },
        { label: '손실 전력', value: ok ? ls / 1e6 : Infinity, unit: 'MW', color: C.loss, dec: 2 },
        { label: '손실률', value: rt * 100, unit: '%', dec: 2,
          color: rt < .03 ? '#34d399' : (rt < .1 ? '#fbbf24' : '#fb7185') },
        { label: '도시에 도착하는 전력', value: ok ? p.P * (1 - rt) : 0, unit: 'MW', color: C.P, dec: 1 },
        { label: '전압 강하', value: dr * 100, unit: '%', dec: 2, color: '#a78bfa' },
        { label: '수요지 전압', value: p.V * (1 - dr), unit: 'kV', dec: 0, color: C.V },
        { label: '승압 변압기 권수비', value: '1 : ' + fmt(p.V / VGEN, 1) + '  (22 kV → ' + fmt(p.V, 0) + ' kV)', wide: true, color: C.V },
        { label: '전압을 2배로 올리면', value: ok ? fmt(ls / 4e6, 2) + ' MW (손실 1/4)' : '—', wide: true, color: '#34d399' },
        { label: '같은 손실을 전선으로 해결하려면', wide: true, color: C.A,
          value: '단면적 ' + fmt(p.A * 4, 0) + ' mm² (4배) 필요 — 전압 2배가 훨씬 싸다' },
        { label: '판정', wide: true, color: rt < .05 ? '#34d399' : (rt < .2 ? '#fbbf24' : '#fb7185'),
          value: rt < .05 ? '실용 범위 (손실률 5% 미만)' :
                 (rt < .2 ? '손실이 큼 — 전압을 올리거나 전선을 굵게' : '사실상 송전 불가 — 보내는 전기 대부분이 길에서 사라진다') }
      ];
    },

    notes: [
      '<b>손실은 전류의 제곱에 비례합니다.</b> 그래서 전압을 2배 올려 전류를 절반으로 만들면 손실이 1/4이 됩니다. 765 kV 송전은 22 kV로 보내는 것보다 손실이 약 <b>1200분의 1</b>입니다.',
      '전선을 굵게 하는 방법도 있지만 <b>저항은 단면적에 반비례(1제곱)</b>할 뿐입니다 — 전압을 2배로 올리는 효과를 내려면 전선을 4배 굵게 해야 합니다. 알루미늄 값과 철탑 하중을 생각하면 전압 쪽이 압도적으로 쌉니다.',
      '<b>이것이 교류가 승리한 이유입니다.</b> 변압기는 교류에서만 작동하므로, 교류는 송전은 초고압으로 하고 가정에서는 220 V로 자유롭게 바꿀 수 있습니다 — 에디슨의 직류는 그 당시 전압을 바꿀 방법이 없어 발전소를 몇 km마다 지어야 했습니다.',
      '변압기는 <b>전력을 만들지 않습니다.</b> V₁I₁ = V₂I₂로 전압을 올리면 전류가 그만큼 내려갈 뿐입니다 — 공짜로 얻는 것은 없고, 전압과 전류의 "배분"을 바꿀 자유를 얻는 것입니다.',
      '요즘은 초장거리에 <b>HVDC(초고압 직류)</b>를 씁니다. 반도체로 전압을 바꿀 수 있게 되자, 교류의 단점(선로 용량성 충전전류, 동기화 문제)이 없는 직류가 다시 유리해졌습니다 — 기술이 바뀌면 답도 바뀝니다.'
    ],
    presets: [
      { name: '345 kV 간선 (한국 표준)', set: { V: 345, P: 200, L: 200, A: 400 } },
      { name: '765 kV 초고압', set: { V: 765, P: 200, L: 200, A: 400 } },
      { name: '154 kV 지역 송전', set: { V: 154, P: 100, L: 80, A: 240 } },
      { name: '저압 송전의 재앙', set: { V: 20, P: 200, L: 200, A: 400 } },
      { name: '전선만 굵게 (비싼 해법)', set: { V: 154, P: 200, L: 200, A: 1600 } }
    ],
    challenges: [
      {
        id: 'eff', title: '400 km에 300 MW를 2% 손실로',
        desc: '거리 400 km 이상, 전력 300 MW 이상을 손실률 2% 이하로 보내 보세요.',
        hint: '전압을 올리는 것이 제곱으로 듣습니다. 765 kV급을 써 보세요.',
        check: ({ P }) => P.L >= 400 && P.P >= 300 && ratioOf(P) <= .02
      },
      {
        id: 'thin', title: '가는 전선으로 이기기',
        desc: '전선 단면적을 200 mm² 이하로 유지하면서 200 MW 이상을 손실률 3% 이하로 보내 보세요 — 재료 대신 전압으로 푸는 연습입니다.',
        hint: '손실률 ∝ P·L/(V²A). A를 못 키우면 V를 최대로 올리고 거리를 짧게 잡으세요.',
        check: ({ P }) => P.A <= 200 && P.P >= 200 && ratioOf(P) <= .03
      },
      {
        id: 'disaster', title: '저압 송전이 왜 불가능한가',
        desc: '송전 전압을 40 kV 이하로 내려 손실률이 50%를 넘는 상황을 직접 확인하세요.',
        hint: '전압 슬라이더를 최소 쪽으로 내려 보세요. 전류가 폭증하고 전선이 달아오릅니다.',
        check: ({ P }) => P.V <= 40 && ratioOf(P) > .5
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const I = Iline(p), R = Rline(p), ls = lossOf(p), rt = ratioOf(p);
      const bad = rt > .2, warn = rt > .05;

      /* ── 발전소 → 승압 → 송전선 → 강압 → 도시 ── */
      const y = h * .26;
      const gx = 56, tx1 = gx + 112, tx2 = Math.min(w - 164, tx1 + Math.max(170, w * .34)), cx2 = tx2 + 104;

      // 발전소
      D.roundRect(ctx, gx - 34, y - 36, 62, 72, 5);
      ctx.fillStyle = 'rgba(52,211,153,.14)'; ctx.fill();
      ctx.strokeStyle = 'rgba(52,211,153,.6)'; ctx.lineWidth = 1.8; ctx.stroke();
      D.text(ctx, '발전소', gx - 3, y + 4, { size: 11, color: '#34d399', align: 'center', bold: true });
      D.text(ctx, VGEN + ' kV', gx - 3, y + 20, { size: 9.5, color: '#61719a', align: 'center' });
      D.text(ctx, fmt(p.P, 0) + ' MW', gx - 3, y - 48, { size: 11.5, color: hl === 'P' ? '#fff' : C.P, align: 'center', bold: true });

      // 변압기 (코일 2개 + 철심)
      const drawTr = (x, up) => {
        ctx.save();
        if (hl === 'V') { ctx.shadowColor = C.V; ctx.shadowBlur = 14; }
        ctx.strokeStyle = 'rgba(200,211,239,.5)'; ctx.lineWidth = 2;
        ctx.strokeRect(x - 5, y - 26, 10, 52);                     // 철심
        const n1 = up ? 3 : 7, n2 = up ? 7 : 3;
        [[-16, n1, '#93a2c4'], [16, n2, C.V]].forEach(([off, n, col]) => {
          ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath();
          for (let k = 0; k < n; k++) {
            const yy = y - 22 + k * (44 / n) + 22 / n;
            ctx.arc(x + off, yy, 6.5, off < 0 ? -Math.PI / 2 : Math.PI / 2, off < 0 ? Math.PI / 2 : -Math.PI / 2, false);
          }
          ctx.stroke();
        });
        ctx.restore();
        D.text(ctx, up ? '승압' : '강압', x, y + 44, { size: 10, color: C.V, align: 'center' });
      };
      drawTr(tx1, true); drawTr(tx2, false);
      D.line(ctx, gx + 28, y, tx1 - 23, y, { color: 'rgba(147,162,196,.6)', width: 2.4 });

      // 송전선 (3상 → 3줄) — 손실이 클수록 붉게 달아오르고 아지랑이가 오른다
      const heat = clamp(rt * 4, 0, 1);
      const lineCol = 'rgb(' + Math.round(200 - 0 * heat) + ',' + Math.round(211 - 100 * heat) + ',' + Math.round(239 - 170 * heat) + ')';
      [-13, 0, 13].forEach((off, k) => {
        ctx.save();
        if (heat > .25) { ctx.shadowColor = C.loss; ctx.shadowBlur = 6 + 18 * heat; }
        D.line(ctx, tx1 + 23, y + off, tx2 - 23, y + off,
          { color: lineCol, width: 1.6 + clamp(p.A / 500, .4, 3) });
        ctx.restore();
        // 전류: 움직이는 점
        const n = 22, sp = clamp(I / 900, .12, 2.2);
        ctx.save(); ctx.globalAlpha = clamp(I / 1500, .18, 1);
        for (let q = 0; q < n; q++) {
          const u = ((st.t * sp + q / n + k * .13) % 1);
          D.dot(ctx, tx1 + 23 + (tx2 - tx1 - 46) * u, y + off, 2.4, C.I, false);
        }
        ctx.globalAlpha = 1; ctx.restore();
      });
      // 손실 아지랑이
      if (heat > .08) {
        ctx.save();
        ctx.strokeStyle = 'rgba(251,146,60,' + (.12 + .45 * heat) + ')'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        for (let k = 0; k < 7; k++) {
          const bx = tx1 + 40 + k * (tx2 - tx1 - 80) / 6;
          ctx.beginPath();
          for (let q = 0; q <= 12; q++) {
            const t = q / 12, yy = y - 18 - t * (18 + 36 * heat);
            ctx.lineTo(bx + Math.sin(t * 5 + st.t * 2.4 + k) * 7 * t, yy);
          }
          ctx.stroke();
        }
        ctx.restore();
        D.text(ctx, '열로 사라지는 전력', (tx1 + tx2) / 2, y - 62 - 36 * heat,
          { size: 10.5, color: C.loss, align: 'center' });
      }
      D.dim(ctx, tx1 + 23, y + 42, tx2 - 23, y + 42, p.L + ' km', C.L, hl === 'L');
      D.tag(ctx, fmt(p.V, 0) + ' kV', (tx1 + tx2) / 2, y - 34, C.V, hl === 'V');
      D.tag(ctx, 'I = ' + fmt(I, 0) + ' A', (tx1 + tx2) / 2, y + 66, C.I, hl === 'I');
      D.text(ctx, 'R = ' + fmt(R, 2) + ' Ω   (단면적 ' + p.A + ' mm²)', (tx1 + tx2) / 2, y + 90,
        { size: 10.5, color: hl === 'R' || hl === 'A' ? '#fff' : C.R, align: 'center' });

      // 도시
      D.line(ctx, tx2 + 23, y, cx2 - 16, y, { color: 'rgba(147,162,196,.6)', width: 2.4 });
      ctx.save();
      [[0, 30, 40], [22, 44, 26], [-20, 22, 30]].forEach(([ox, hh, ww]) => {
        D.roundRect(ctx, cx2 - 16 + ox, y + 20 - hh, ww, hh, 2);
        ctx.fillStyle = bad ? 'rgba(251,113,133,.18)' : 'rgba(96,165,250,.20)'; ctx.fill();
        ctx.strokeStyle = bad ? 'rgba(251,113,133,.5)' : 'rgba(96,165,250,.5)'; ctx.lineWidth = 1.2; ctx.stroke();
      });
      ctx.restore();
      D.text(ctx, '도시', cx2 + 6, y + 38, { size: 10.5, color: '#93a2c4', align: 'center' });
      D.text(ctx, rt < 1 ? fmt(p.P * (1 - rt), 0) + ' MW 도착' : '도착 실패',
        cx2 + 6, y - 24, { size: 11, color: bad ? '#fb7185' : '#34d399', align: 'center', bold: true });

      /* ── 전력 배분 막대 ── */
      const bx = 56, byy = y + 118, bw = Math.min(w - 112, 420);
      if (byy + 40 < h - 160) {
        D.text(ctx, '보낸 전력의 행방', bx, byy - 8, { size: 10.5, color: '#61719a' });
        D.roundRect(ctx, bx, byy, bw, 20, 5); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
        const lf = clamp(rt, 0, 1);
        ctx.save();
        D.roundRect(ctx, bx, byy, bw * (1 - lf), 20, 5); ctx.fillStyle = C.P; ctx.globalAlpha = .85; ctx.fill();
        ctx.restore();
        ctx.save(); if (hl === 'loss') { ctx.shadowColor = C.loss; ctx.shadowBlur = 14; }
        ctx.fillStyle = C.loss; ctx.fillRect(bx + bw * (1 - lf), byy, bw * lf, 20); ctx.restore();
        D.text(ctx, '도착 ' + fmt((1 - lf) * 100, 1) + '%', bx + 8, byy + 14, { size: 10, color: '#06281c', bold: true });
        if (lf > .07) D.text(ctx, '손실 ' + fmt(lf * 100, 1) + '%', bx + bw - 8, byy + 14,
          { size: 10, color: '#2a1405', align: 'right', bold: true });
      }

      /* ── 손실률 – 송전전압 곡선 ── */
      const qx = 56, qy = h - 148, qw = Math.min(w - 112, 420), qh = 104;
      if (qh > 50 && qy > y + 100) {
        D.roundRect(ctx, qx, qy, qw, qh, 6); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
        D.text(ctx, '손실률 – 송전 전압  (1/V² 법칙)', qx + 4, qy - 8, { size: 10.5, color: '#61719a' });
        const VLO = 20, VHI = 800;
        const QX = vv => qx + (Math.log10(vv) - Math.log10(VLO)) / (Math.log10(VHI) - Math.log10(VLO)) * qw;
        const QY = rr => qy + qh - clamp(rr, 0, 1) * qh;
        // 5% 기준선 + 천장(100%) — 저압에서는 손실률이 100%를 넘어 그래프 위쪽이 평평해진다
        D.line(ctx, qx, QY(.05), qx + qw, QY(.05), { color: 'rgba(52,211,153,.45)', dash: [4, 4] });
        D.text(ctx, '5%', qx + qw + 2, QY(.05) + 3.5, { size: 9, color: 'rgba(52,211,153,.8)' });
        D.line(ctx, qx, QY(1), qx + qw, QY(1), { color: 'rgba(251,113,133,.35)', dash: [2, 3] });
        D.text(ctx, '100% — 보낸 전기가 전부 사라짐 (이 위는 송전 불가)', qx + 5, QY(1) + 12,
          { size: 9, color: 'rgba(251,113,133,.8)' });
        ctx.save(); ctx.strokeStyle = C.loss; ctx.lineWidth = 2.2; ctx.beginPath();
        for (let k = 0; k <= 120; k++) {
          const vv = VLO * Math.pow(VHI / VLO, k / 120);
          const rr = ratioOf({ V: vv, P: p.P, L: p.L, A: p.A });
          const X = QX(vv), Y = QY(rr);
          k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
        }
        ctx.stroke(); ctx.restore();
        [20, 66, 154, 345, 765].forEach(vv => {
          D.line(ctx, QX(vv), qy + qh, QX(vv), qy + qh + 4, { color: 'rgba(147,162,196,.5)' });
          D.text(ctx, vv + '', QX(vv), qy + qh + 16, { size: 8.5, color: '#4b5a80', align: 'center' });
        });
        D.text(ctx, 'kV', qx + qw, qy + qh + 16, { size: 8.5, color: '#4b5a80', align: 'right' });
        D.dot(ctx, QX(clamp(p.V, VLO, VHI)), QY(rt), 5, warn ? '#fb7185' : '#34d399', true);
        D.text(ctx, fmt(rt * 100, 2) + ' %', QX(clamp(p.V, VLO, VHI)) + 8, QY(rt) - 6,
          { size: 11, color: warn ? '#fb7185' : '#34d399', bold: true });
      }
    }
  });
})();
