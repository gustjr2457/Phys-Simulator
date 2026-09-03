/* [진동공학] 1자유도계 감쇠 자유진동 — mẍ + cẋ + kx = 0 */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { m: '#f472b6', k: '#5eead4', c: '#fb7185', x0: '#a78bfa', x: '#60a5fa', wn: '#fbbf24', z: '#fb7185', Td: '#fbbf24' };

  const wn = p => Math.sqrt(p.k / p.m);
  const zeta = p => p.c / (2 * Math.sqrt(p.k * p.m));

  PS.register({
    id: 'vib-free', mode: 'adv', category: '진동공학',
    title: '감쇠 자유진동',
    sub: 'mẍ + cẋ + kx = 0',
    tagline: '건드린 뒤 내버려 둔 기계는 어떻게 멈출까요? 감쇠비 ζ 하나가 진동의 성격을 전부 결정합니다.',

    params: [
      { key: 'm', symbol: 'm', label: '질량', unit: 'kg', min: .5, max: 12, step: .5, value: 4, color: C.m,
        where: '스프링에 매달린 <b>블록</b>입니다. 관성을 담당하며, 커질수록 고유진동수 ωₙ = √(k/m)가 낮아져 <b>느리게</b> 흔들립니다.' },
      { key: 'k', symbol: 'k', label: '스프링 상수', unit: 'N/m', min: 20, max: 800, step: 10, value: 300, color: C.k, dec: 0,
        where: '<b>청록색 스프링</b>입니다. 제자리로 되돌리려는 복원력 −kx를 만듭니다. 단단할수록(k↑) 진동이 빨라집니다.' },
      { key: 'c', symbol: 'c', label: '감쇠 계수', unit: 'N·s/m', min: 0, max: 160, step: 2, value: 12, color: C.c, dec: 0,
        where: '스프링 옆의 <b>대시포트(점성 감쇠기)</b>입니다. 속도에 비례하는 저항 −cẋ로 에너지를 열로 흩뜨려 진폭을 줄입니다. 자동차 쇼크업소버가 바로 이것입니다.' },
      { key: 'x0', symbol: 'x₀', label: '초기 변위', unit: 'm', min: .02, max: .25, step: .01, value: .15, color: C.x0, reset: true, dec: 2,
        where: '평형 위치에서 <b>얼마나 당겼다 놓았는가</b>입니다. 진폭의 출발점만 정할 뿐, 진동수나 감쇠 속도에는 영향을 주지 않습니다.' }
    ],
    vars: {
      x: { symbol: 'x', label: '변위', unit: 'm', color: C.x, where: '평형선에서 블록까지의 거리, 파란 치수선입니다.' },
      wn: { symbol: 'ωₙ', label: '고유진동수', unit: 'rad/s', color: C.wn,
        where: '이 계가 <b>스스로 좋아하는 진동수</b>입니다. 감쇠가 없을 때의 흔들림 속도로, 질량과 스프링만으로 정해집니다.' },
      z: { symbol: 'ζ', label: '감쇠비', unit: '', color: C.z,
        where: '그래프의 <b>붉은 포락선</b>(e^(−ζωₙt))이 얼마나 빨리 오므라드는지를 정합니다. ζ&lt;1 부족감쇠(흔들리며 감쇠), ζ=1 임계감쇠(가장 빨리 정지), ζ&gt;1 과감쇠(느리게 복귀).' },
      Td: { symbol: 'T_d', label: '감쇠 주기', unit: 's', color: C.Td,
        where: '이웃한 두 마루 사이의 시간입니다. 그래프 위쪽에 표시됩니다.' }
    },
    formulas: [
      { name: '운동 방정식', tpl: '{m}ẍ + {c}ẋ + {k}{x} = 0' },
      { name: '고유진동수', tpl: '{wn} = √( {k} ⁄ {m} )' },
      { name: '감쇠비', tpl: '{z} = {c} ⁄ ( 2√({m}{k}) )' },
      { name: '감쇠 진동 주기', tpl: '{Td} = 2π ⁄ ( {wn}√(1 − {z}²) )' }
    ],

    init(p) { return { x: p.x0, v: 0, peak: 0 }; },
    step(st, p, dt) {
      const a = (-p.k * st.x - p.c * st.v) / p.m;
      st.v += a * dt;
      st.x += st.v * dt;
    },

    graphs: [{
      title: '변위 – 시간', xmin: 4, window: 10,
      series: [
        { key: 'x', label: 'x (m)', color: C.x },
        { key: 'ep', label: '포락선 e^(−ζωₙt)', color: C.z },
        { key: 'en', label: '', color: C.z }
      ]
    }],
    sample(st, p) {
      const e = p.x0 * Math.exp(-zeta(p) * wn(p) * st.t);
      return { x: st.x, ep: e, en: -e };
    },

    readouts(st, p) {
      const z = zeta(p), w = wn(p);
      const kind = z < .999 ? '부족감쇠 (진동함)' : (z < 1.001 ? '임계감쇠 (가장 빨리 정지)' : '과감쇠 (안 흔들림)');
      const wd = w * Math.sqrt(Math.max(0, 1 - z * z));
      return [
        { label: '고유진동수 ωₙ', value: w, unit: 'rad/s', color: C.wn },
        { label: '고유 진동수 fₙ', value: w / (2 * Math.PI), unit: 'Hz', color: C.wn },
        { label: '감쇠비 ζ', value: z, unit: '', color: C.z, dec: 3 },
        { label: '감쇠 주기 T_d', value: wd > 0 ? 2 * Math.PI / wd : 0, unit: 's', color: C.Td },
        { label: '현재 변위 x', value: st.x, unit: 'm', color: C.x, dec: 3 },
        { label: '임계 감쇠계수 c_c = 2√(mk)', value: 2 * Math.sqrt(p.k * p.m), unit: 'N·s/m' },
        { label: '감쇠 상태', value: kind, wide: true, color: z < .999 ? '#60a5fa' : (z < 1.001 ? '#34d399' : '#fbbf24') }
      ];
    },

    notes: [
      '<b>ζ = 1(임계감쇠)</b>일 때 진동 없이 가장 빠르게 제자리로 돌아옵니다. 엘리베이터 문, 자동차 서스펜션의 설계 목표입니다.',
      'c를 0으로 두면 영원히 흔들립니다. 실제 기계에서 <b>감쇠는 안전장치</b>입니다.',
      '고유진동수는 <b>질량과 강성으로만</b> 결정됩니다. 얼마나 세게 건드렸는지(x₀)와는 무관합니다.',
      'ζ가 작을수록 포락선이 천천히 오므라들어 진동이 오래 남습니다 → 다음 시뮬레이션의 <b>공진</b>에서 치명적입니다.'
    ],
    presets: [
      { name: '부족감쇠 (ζ≈0.1)', set: { m: 4, k: 300, c: 12 } },
      { name: '임계감쇠 (ζ=1)', set: { m: 4, k: 300, c: 69 } },
      { name: '과감쇠 (ζ=2)', set: { m: 4, k: 300, c: 138 } },
      { name: '감쇠 없음 (c=0)', set: { c: 0 } },
      { name: '무거운 기계', set: { m: 12, k: 300, c: 20 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const cx = w * .38, top = 46;
      const PPM = Math.min(760, (h - 200) / .34);       // 1 m → px
      const eq = top + 190;                              // 평형 위치(화면 y)
      const by = eq + st.x * PPM;                        // 블록 중심
      const z = zeta(p), wnv = wn(p);

      // 천장
      D.line(ctx, cx - 130, top, cx + 90, top, { color: 'rgba(147,162,196,.5)', width: 3 });
      for (let i = 0; i < 11; i++) D.line(ctx, cx - 128 + i * 20, top, cx - 138 + i * 20, top - 10, { color: 'rgba(147,162,196,.25)' });

      // 스프링 · 대시포트
      const bh = 34 + p.m * 2.4, bw = 78 + p.m * 2;
      D.spring(ctx, cx - 52, top, cx - 52, by - bh / 2, { coils: 9, amp: 13, color: C.k, hot: hl === 'k' });
      D.dashpot(ctx, cx + 22, top, cx + 22, by - bh / 2, { color: C.c, hot: hl === 'c' });
      D.text(ctx, 'k = ' + fmt(p.k, 0), cx - 52, top - 16, { size: 11, color: C.k, align: 'center', bold: hl === 'k' });
      D.text(ctx, 'c = ' + fmt(p.c, 0), cx + 22, top - 16, { size: 11, color: C.c, align: 'center', bold: hl === 'c' });

      // 평형선
      D.line(ctx, cx - 170, eq, cx + 160, eq, { color: 'rgba(147,162,196,.35)', dash: [6, 6] });
      D.text(ctx, '평형 위치', cx + 164, eq + 4, { size: 10, color: '#61719a' });

      // 초기 변위 기준선
      const hotX0 = hl === 'x0';
      D.line(ctx, cx - 170, eq + p.x0 * PPM, cx + 160, eq + p.x0 * PPM, { color: C.x0, dash: [4, 5], hot: hotX0 });
      D.text(ctx, 'x₀ = ' + fmt(p.x0, 2) + ' m', cx + 164, eq + p.x0 * PPM + 4, { size: 10, color: C.x0, bold: hotX0 });

      // 블록
      ctx.save();
      if (hl === 'm') { ctx.shadowColor = C.m; ctx.shadowBlur = 22; }
      D.roundRect(ctx, cx - bw / 2, by - bh / 2, bw, bh, 7);
      const g = ctx.createLinearGradient(0, by - bh / 2, 0, by + bh / 2);
      g.addColorStop(0, hl === 'm' ? '#f9a8d4' : '#8ba4d8'); g.addColorStop(1, hl === 'm' ? '#be5a92' : '#4a6ba8');
      ctx.fillStyle = g; ctx.fill();
      ctx.restore();
      D.text(ctx, fmt(p.m, 1) + ' kg', cx, by + 4, { size: 12, color: '#0a1120', align: 'center', bold: true });

      // 변위 치수선
      D.dim(ctx, cx - bw / 2 - 26, eq, cx - bw / 2 - 26, by, 'x = ' + fmt(st.x, 3), C.x, hl === 'x');

      // ζ 게이지
      const gx = w - 210, gy = 60, gw = 170;
      D.text(ctx, '감쇠비 ζ = ' + fmt(z, 3), gx, gy - 10, { size: 12, color: hl === 'z' ? '#fff' : C.z, bold: hl === 'z' });
      D.roundRect(ctx, gx, gy, gw, 9, 4); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fill();
      ['#60a5fa', '#34d399', '#fbbf24'].forEach((col, i) => {
        ctx.fillStyle = col; ctx.globalAlpha = .35;
        ctx.fillRect(gx + gw * (i === 0 ? 0 : i === 1 ? .48 : .52), gy, gw * (i === 0 ? .48 : i === 1 ? .04 : .48), 9);
        ctx.globalAlpha = 1;
      });
      const zp = gx + gw * clamp(z / 2, 0, 1);   // 게이지는 ζ = 0 ~ 2, 가운데가 ζ = 1
      D.line(ctx, zp, gy - 5, zp, gy + 14, { color: '#fff', width: 2, hot: hl === 'z' });
      D.text(ctx, '부족감쇠', gx, gy + 26, { size: 9.5, color: '#60a5fa' });
      D.text(ctx, 'ζ=1', gx + gw * .5, gy + 26, { size: 9.5, color: '#34d399', align: 'center' });
      D.text(ctx, '과감쇠', gx + gw, gy + 26, { size: 9.5, color: '#fbbf24', align: 'right' });

      // 요약
      D.text(ctx, 'ωₙ = ' + fmt(wnv, 2) + ' rad/s   (fₙ = ' + fmt(wnv / 6.2832, 2) + ' Hz)', gx, gy + 56,
        { size: 12, color: hl === 'wn' ? '#fff' : C.wn, bold: hl === 'wn' });
      if (z < 1) {
        D.text(ctx, 'T_d = ' + fmt(2 * Math.PI / (wnv * Math.sqrt(1 - z * z)), 3) + ' s', gx, gy + 78,
          { size: 12, color: hl === 'Td' ? '#fff' : C.Td, bold: hl === 'Td' });
      }
    }
  });
})();
