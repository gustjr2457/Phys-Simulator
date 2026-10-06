/* [양자역학] 상자 속 전자 — 에너지가 띄엄띄엄한 이유 */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { L: '#5eead4', n: '#fbbf24', off: '#fb7185', E: '#a78bfa', lam: '#60a5fa', p: '#f472b6' };
  const H = 6.62607015e-34, ME = 9.1093837e-31, QE = 1.602176634e-19;

  // L[nm], n → 에너지(eV)
  const En = (nn, Lnm) => nn * nn * H * H / (8 * ME * Math.pow(Lnm * 1e-9, 2)) / QE;

  PS.register({
    id: 'q-box', mode: 'quantum', category: '양자화',
    title: '상자 속 전자',
    sub: 'Eₙ = n²h² / 8mL²',
    tagline: '기타 줄이 아무 음이나 내지 못하듯, 좁은 곳에 갇힌 전자도 아무 에너지나 가질 수 없습니다. 양쪽 끝이 고정된 파동은 "반파장의 정수배"만 들어갈 수 있기 때문입니다.',

    params: [
      { key: 'L', symbol: 'L', label: '상자 크기', unit: 'nm', min: .2, max: 2, step: .05, value: 1, color: C.L, dec: 2,
        where: '전자를 가둔 <b>상자의 폭</b>입니다. 좁힐수록 들어갈 수 있는 파장이 짧아지고, 파장이 짧으면 운동량이 커져 <b>에너지가 치솟습니다</b>(1/L²). 오른쪽 에너지 사다리가 통째로 늘어나는 것을 보세요.' },
      { key: 'n', symbol: 'n', label: '양자수', unit: '', min: 1, max: 6, step: 1, value: 1, color: C.n, dec: 0,
        where: '상자 안에 들어간 <b>반파장의 개수</b>입니다. 1, 2, 3… 정수만 가능하며 이 수가 곧 에너지 준위를 정합니다. 마디(진폭이 0인 점)는 n−1개 생깁니다.' },
      { key: 'off', symbol: 'δ', label: '정수가 아닌 n 시도', unit: '', min: 0, max: .9, step: .1, value: 0, color: C.off, dec: 1,
        where: '양자수에 <b>소수를 더해 봅니다</b>. 그러면 파동이 오른쪽 벽에서 0이 되지 못해 조건을 어깁니다 — 자연은 이런 상태를 허용하지 않습니다. 이것이 "양자화"의 전부입니다.' }
    ],
    vars: {
      E: { symbol: 'E', label: '에너지 준위', unit: 'eV', color: C.E,
        where: '오른쪽 <b>에너지 사다리</b>입니다. n²에 비례해 위로 갈수록 간격이 벌어집니다.' },
      lam: { symbol: 'λ', label: '파장', unit: 'nm', color: C.lam,
        where: '상자 안 정상파의 <b>파장</b>입니다. λ = 2L/n 이므로 n이 커질수록 짧아집니다.' },
      p: { symbol: 'p', label: '운동량', unit: 'kg·m/s', color: C.p,
        where: '드브로이 관계 p = h/λ로 파장에서 바로 나옵니다. 파장이 짧을수록 운동량이 큽니다.' }
    },
    formulas: [
      { name: '정상파 조건 — 반파장의 정수배만 들어간다', tpl: '{L} = {n} · {lam} ⁄ 2' },
      { name: '드브로이 관계', tpl: '{p} = h ⁄ {lam}' },
      { name: '에너지 준위', tpl: '{E}ₙ = {n}² h² ⁄ ( 8m{L}² )' },
      { name: '바닥–첫 들뜬 준위 간격', tpl: 'E₂ − E₁ = 3h² ⁄ ( 8m{L}² )' }
    ],

    init(p) { return { ph: 0 }; },
    step(st, p, dt) { st.ph += dt * .3 * p.n * p.n; },

    graphs: [
      { title: '양자수 n – 에너지', xKey: 'n', xUnit: '', xMin: 1, xMax: 6, y0: 0,
        series: [{ key: 'E', label: 'Eₙ (eV)', color: C.E }] },
      { title: '상자 크기 – 바닥 에너지 E₁', xKey: 'L', xUnit: 'nm', xMin: .2, xMax: 2, y0: 0,
        series: [{ key: 'E1', label: 'E₁ (eV)', color: C.L }] }
    ],
    sample(st, p) { return { n: p.n, L: p.L, E: En(p.n, p.L), E1: En(1, p.L) }; },

    readouts(st, p) {
      const ok = p.off < .05;
      const lam = 2 * p.L / (p.n + p.off);
      return [
        { label: '파장 λ = 2L/n', value: lam, unit: 'nm', color: C.lam },
        { label: '운동량 p = h/λ', value: H / (lam * 1e-9) * 1e24, unit: '×10⁻²⁴ kg·m/s', color: C.p, dec: 2 },
        { label: '에너지 Eₙ', value: En(p.n, p.L), unit: 'eV', color: C.E, dec: 3 },
        { label: '바닥 에너지 E₁', value: En(1, p.L), unit: 'eV', dec: 3 },
        { label: '바로 아래 준위와의 차', value: p.n > 1 ? En(p.n, p.L) - En(p.n - 1, p.L) : 0, unit: 'eV', dec: 3 },
        { label: '마디(진폭 0인 점) 개수', value: ok ? p.n - 1 : '—', unit: ok ? '개' : '', dec: 0 },
        { label: '상태 판정', wide: true, color: ok ? '#34d399' : '#fb7185',
          value: ok ? '✔ 허용된 상태 — 양쪽 벽에서 파동이 0입니다'
            : '✘ 허용되지 않음 — 오른쪽 벽에서 파동이 0이 아닙니다' }
      ];
    },

    notes: [
      '<b>기타 줄과 똑같습니다.</b> 양쪽 끝이 고정되면 아무 파장이나 들어갈 수 없고, 반파장의 정수배만 가능합니다. 그래서 음(에너지)이 띄엄띄엄해집니다.',
      '"양자화"는 신비로운 규칙이 아니라 <b>경계 조건의 결과</b>입니다. δ 슬라이더를 올려 정수가 아닌 상태가 왜 불가능한지 직접 보세요.',
      '상자를 좁히면 에너지가 <b>1/L²</b>로 치솟습니다. 전자를 좁은 곳에 가두려면 그만큼 큰 에너지가 듭니다.',
      '이 성질이 <b>백색왜성과 중성자별을 떠받치는 힘</b>(축퇴압)의 뿌리입니다 — 초급 트랙의 "블랙홀과 중성자별"과 이어집니다.',
      '실제 전자의 정상파는 1초에 약 10¹⁴번 진동합니다. 화면에서는 아주 느리게 줄여 보여 주고 있습니다.'
    ],
    presets: [
      { name: '바닥 상태 (n=1)', set: { L: 1, n: 1, off: 0 } },
      { name: '첫 들뜬 상태 (n=2)', set: { L: 1, n: 2, off: 0 } },
      { name: '높은 준위 (n=5)', set: { L: 1, n: 5, off: 0 } },
      { name: '상자를 좁히면', set: { L: .3, n: 1, off: 0 } },
      { name: '정수가 아닌 n — 금지된 상태', set: { L: 1, n: 2, off: .5 } }
    ],
    challenges: [
      {
        id: 'shrink', title: '좁히면 에너지가 치솟는다',
        desc: '상자를 0.5 nm 이하로 줄여서 바닥 에너지 E₁을 1.5 eV 이상으로 만들어 보세요.',
        hint: 'E는 1/L²에 비례합니다. 상자를 절반으로 줄이면 에너지는 4배가 됩니다.',
        check: ({ P }) => P.L <= .5 && En(1, P.L) >= 1.5
      },
      {
        id: 'forbidden', title: '왜 정수만 되는가',
        desc: 'δ를 0.3 이상으로 올려서, 파동이 오른쪽 벽에서 0이 되지 못하는 모습을 확인하세요.',
        hint: '세 번째 슬라이더(δ)를 오른쪽으로 옮기면 파동의 끝이 벽에서 떠 버립니다.',
        check: ({ P }) => P.off >= .3
      },
      {
        id: 'node3', title: 'n = 3의 마디는 몇 개?',
        desc: '양자수를 3으로 맞추고 (δ는 0으로) 마디가 2개인 것을 확인하세요.',
        hint: '마디 개수는 언제나 n − 1개입니다.',
        check: ({ P }) => P.n === 3 && P.off < .05
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const nEff = p.n + p.off, ok = p.off < .05;

      /* ── 상자 ── */
      const BW = 150;                                   // 오른쪽 에너지 사다리 영역
      const x0 = 64, x1 = w - BW - 40, cy = h * .46;
      const amp = Math.min(h * .22, 110);

      ctx.save();
      ctx.fillStyle = 'rgba(94,234,212,.08)';
      ctx.fillRect(x0, cy - amp - 26, x1 - x0, (amp + 26) * 2);
      ctx.restore();
      [x0, x1].forEach(xw => {
        ctx.save();
        ctx.strokeStyle = hl === 'L' ? '#a7f3e5' : C.L;
        ctx.lineWidth = hl === 'L' ? 5 : 3.5;
        if (hl === 'L') { ctx.shadowColor = C.L; ctx.shadowBlur = 14; }
        ctx.beginPath(); ctx.moveTo(xw, cy - amp - 30); ctx.lineTo(xw, cy + amp + 30); ctx.stroke();
        ctx.restore();
      });
      D.line(ctx, x0, cy, x1, cy, { color: 'rgba(147,162,196,.3)', dash: [5, 5] });
      D.dim(ctx, x0, cy + amp + 46, x1, cy + amp + 46, 'L = ' + fmt(p.L, 2) + ' nm', C.L, hl === 'L');
      D.text(ctx, '벽 (전자가 나갈 수 없음)', x0, cy - amp - 40, { size: 10, color: '#4a5878' });

      /* ── |ψ|² 확률 분포 ── */
      const k = nEff * Math.PI / (x1 - x0);
      const base = cy + amp * .92;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x0, base);
      for (let x = x0; x <= x1; x += 2) {
        const s = Math.sin(k * (x - x0));
        ctx.lineTo(x, base - s * s * amp * .58);
      }
      ctx.lineTo(x1, base); ctx.closePath();
      ctx.fillStyle = 'rgba(167,139,250,.22)'; ctx.fill();
      ctx.restore();
      D.text(ctx, '|ψ|² — 전자를 발견할 확률', x0 + 6, base - 6, { size: 10, color: 'rgba(167,139,250,.9)' });

      /* ── 정상파 ψ ── */
      const osc = Math.cos(st.ph);
      ctx.save();
      ctx.strokeStyle = ok ? C.lam : C.off;
      ctx.lineWidth = hl === 'lam' ? 3.4 : 2.6;
      if (hl === 'lam') { ctx.shadowColor = C.lam; ctx.shadowBlur = 12; }
      ctx.beginPath();
      for (let x = x0; x <= x1; x += 1.5) {
        const y = cy - Math.sin(k * (x - x0)) * amp * .72 * osc;
        x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.restore();

      // 마디
      if (ok) for (let i = 1; i < p.n; i++) {
        const xm = x0 + (x1 - x0) * i / p.n;
        D.dot(ctx, xm, cy, 4, '#93a2c4', hl === 'n');
        D.text(ctx, '마디', xm, cy + 18, { size: 9, color: '#61719a', align: 'center' });
      }

      // 반파장 개수
      const halfW = (x1 - x0) / nEff;
      for (let i = 0; i < Math.floor(nEff); i++) {
        const a = x0 + halfW * i, b = a + halfW;
        D.line(ctx, a, cy - amp - 12, b, cy - amp - 12, { color: hl === 'n' ? C.n : 'rgba(251,191,36,.45)', width: hl === 'n' ? 2 : 1.2 });
        D.line(ctx, a, cy - amp - 16, a, cy - amp - 8, { color: 'rgba(251,191,36,.5)' });
      }
      D.text(ctx, '반파장 ' + (ok ? p.n : fmt(nEff, 1)) + '개가 딱 들어간다',
        (x0 + x1) / 2, cy - amp - 22, { size: 10.5, color: hl === 'n' ? '#fff' : C.n, align: 'center', bold: hl === 'n' });

      // 금지된 상태 경고
      if (!ok) {
        const yEnd = cy - Math.sin(k * (x1 - x0)) * amp * .72 * osc;
        D.dot(ctx, x1, yEnd, 6, C.off, true);
        D.line(ctx, x1, yEnd, x1 + 30, yEnd, { color: C.off, dash: [3, 3] });
        D.tag(ctx, '벽에서 0이 아님 → 허용되지 않는 상태', (x0 + x1) / 2, cy + amp + 78, C.off, true);
      }

      /* ── 에너지 사다리 ── */
      const lx = w - BW + 10, lw = BW - 52;
      const top = 44, botY = h - 62;
      const Emax = En(6, p.L);
      const EY = e => botY - (e / Emax) * (botY - top);
      D.text(ctx, '에너지 준위', lx, top - 18, { size: 11, color: hl === 'E' ? '#fff' : '#93a2c4', bold: hl === 'E' });
      for (let i = 1; i <= 6; i++) {
        const e = En(i, p.L), y = EY(e), cur = i === p.n;
        D.line(ctx, lx, y, lx + lw, y, {
          color: cur ? C.E : 'rgba(167,139,250,.35)', width: cur ? 3 : 1.4, hot: cur && hl === 'E'
        });
        D.text(ctx, 'n=' + i, lx - 6, y + 4, { size: 9.5, color: cur ? C.n : '#4a5878', align: 'right', bold: cur });
        if (cur || i === 1 || i === 6)
          D.text(ctx, fmt(e, 2) + ' eV', lx + lw + 5, y + 4, { size: 9.5, color: cur ? C.E : '#4a5878' });
      }
      D.dot(ctx, lx + lw / 2, EY(En(p.n, p.L)), 5, '#fff', true);
      D.text(ctx, '위로 갈수록 간격이', lx, botY + 24, { size: 9.5, color: '#4a5878' });
      D.text(ctx, '벌어집니다 (E ∝ n²)', lx, botY + 37, { size: 9.5, color: '#4a5878' });
    }
  });
})();
