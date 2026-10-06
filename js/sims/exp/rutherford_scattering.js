/* [유명한 실험] 러더퍼드의 금박 산란 실험(1911) — 원자는 대부분 빈 공간, 가운데에
   아주 작고 무거운 양전하 덩어리(원자핵)가 있다.
   알파 입자(+2e)를 얇은 금박에 쏘면 거의 다 그대로 통과하지만, 아주 가끔
   거의 정반대 방향으로 튕겨 나온다 — 러더퍼드는 이걸 "종잇장에 대포알을
   쐈는데 튕겨서 되돌아온 것처럼 믿기 힘든 일"이라고 표현했다. 산란각과
   조준 거리(b) 사이의 관계 tan(θ/2) = kZze²/(2Eb)는 뉴턴 역학(쿨롱 반발력)
   만으로 완전히 유도되는 정확한 해석해다(수치적분 아님). 초급 '원자란
   무엇인가?'에서 다룬 단순화된 보어 모형이 왜 그렇게 생겼는지의 역사적 근거. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { Z: '#fbbf24', E: '#60a5fa', rate: '#a78bfa', dmin: '#34d399', back: '#fb7185' };
  const K = 8.99e9, ECH = 1.602e-19, Z_ALPHA = 2;
  const BINS = 36; // 5˚씩 0~180˚

  // 정면충돌(b→0) 시 가장 가까이 접근하는 거리: d_min = 2kZze²/E  (E는 J 단위)
  function dMin_m(p) {
    const E_J = p.E * 1e6 * ECH;
    return 2 * K * p.Z * Z_ALPHA * ECH * ECH / E_J; // = 2kZze^2/E, e^2 한 번은 이미 ECH*ECH로 처리
  }
  // 빔이 겨냥할 수 있는 조준 거리의 최댓값(= 빔의 폭/시준기 크기) — 실험 장치 자체의 성질이므로
  // "기준 조건(금, 5MeV)"에서 한 번만 고정한다. Z나 E 슬라이더를 바꿔도 이 값은 바뀌지 않아야
  // "무거운 핵일수록 더 잘 튕긴다"는 이 실험의 핵심 효과가 슬라이더에 그대로 나타난다.
  // (만약 b_max를 매번 d_min(Z,E)에 비례하게 다시 잡으면, 비율이 항상 같아져서 Z를 바꿔도
  //  후방산란 비율이 전혀 안 바뀌는 잘못된 시뮬레이션이 된다 — 실제로 이 버그가 있었고 검증 중 발견해 고쳤다.)
  const BMAX_M = 8 * dMin_m({ Z: 79, E: 5 });
  function bMax_m() { return BMAX_M; }
  // 정확한 해석해(뉴턴 역학 + 쿨롱 반발력만으로 유도됨, 수치오차 없음)
  function theta(b_m, p) {
    if (b_m <= 0) return Math.PI;
    return 2 * Math.atan(dMin_m(p) / (2 * b_m));
  }

  PS.register({
    id: 'exp-rutherford', mode: 'exp', category: '물질의 구조를 밝히다',
    title: '러더퍼드의 금박 산란 실험 (1911)',
    sub: '원자는 대부분 빈 공간, 가운데에 아주 작고 무거운 핵이 있다',
    tagline: '(+)전하를 띤 알파 입자를 아주 얇은 금박에 쏩니다. 그 시절 "원자는 푸딩처럼 전하가 고르게 퍼져 있다"는 모형이 맞다면 모든 입자가 살짝만 휘어야 합니다. 그런데 실제로는 거의 다 그대로 통과하는 가운데, 아주 가끔 거의 정반대로 튕겨 나옵니다.',

    params: [
      { key: 'Z', symbol: 'Z', label: '표적 원자핵의 원자번호', unit: '', min: 13, max: 92, step: 1, value: 79, color: C.Z, reset: true, dec: 0,
        where: '금박(Z=79) 대신 알루미늄(Z=13)처럼 <b>가벼운 핵</b>을 쓰면 반발력이 약해져 큰 각도로 튕기는 입자가 훨씬 줄어듭니다.' },
      { key: 'E', symbol: 'E', label: '알파 입자의 에너지', unit: 'MeV', min: 3, max: 9, step: .5, value: 5, color: C.E, reset: true,
        where: '알파 입자가 <b>얼마나 빠르게(세게)</b> 날아오는지입니다. 에너지가 높을수록 핵에 더 바짝 다가가야만 크게 튕기므로, 큰 각도 산란이 <b>더 드물어집니다</b>.' },
      { key: 'rate', symbol: '', label: '초당 발사 개수', unit: '개/s', min: 20, max: 400, step: 20, value: 200, color: C.rate,
        where: '측정을 얼마나 <b>빨리 쌓는지</b>입니다. 실제 실험은 오른쪽 산란각 분포가 뚜렷해질 때까지 몇 시간을 기다려야 했습니다.' }
    ],
    vars: {
      dmin: { symbol: 'd_min', label: '정면충돌 시 가장 가까이 접근하는 거리', unit: 'fm', color: C.dmin,
        where: '조준 거리 b=0(정면으로 정확히 겨냥)일 때 알파 입자가 핵에 <b>얼마나 가까이</b> 다가갈 수 있는지입니다. 이 거리보다 원자핵이 크다면 산란 각도 분포가 이 공식과 어긋나기 시작하는데, 실제로는 잘 들어맞아서 <b>핵이 이보다 작다</b>는 것을 알 수 있었습니다.' }
    },
    formulas: [
      { name: '산란각과 조준 거리의 관계(뉴턴 역학 + 쿨롱 반발력만으로 유도)', tpl: 'tan(θ⁄2) = {dmin} ⁄ (2b)' },
      { name: '정면충돌 시 가장 가까이 접근하는 거리', tpl: '{dmin} = 2kZze² ⁄ E' }
    ],

    init(p) { return { hist: new Array(BINS).fill(0), total: 0, back: 0, acc: 0, lastTheta: null, lastSign: 1, lastT: -10 }; },
    step(st, p, dt) {
      st.acc += p.rate * dt;
      const bmax = bMax_m();
      while (st.acc >= 1) {
        st.acc -= 1;
        const b = bmax * Math.sqrt(Math.random()); // 균일한 세기의 빔 → 조준 거리는 면적(b²)에 비례해 분포
        const th = theta(b, p);
        const bin = clamp(Math.floor(th / Math.PI * BINS), 0, BINS - 1);
        st.hist[bin]++; st.total++;
        if (th > Math.PI / 2) st.back++;
        st.lastTheta = th; st.lastSign = Math.random() < 0.5 ? 1 : -1; st.lastT = st.t;
      }
    },

    readouts(st, p) {
      const dmin_fm = dMin_m(p) * 1e15;
      const backPct = st.total > 0 ? (st.back / st.total * 100) : 0;
      return [
        { label: '가장 가까이 접근하는 거리 d_min', value: dmin_fm, unit: 'fm', dec: 1, color: C.dmin },
        { label: '지금까지 쏜 알파 입자 수', value: st.total, unit: '개', dec: 0, color: C.rate },
        { label: '90˚ 넘게 튕겨난 비율', value: backPct, unit: '%', dec: 2, color: C.back, wide: true },
        { label: '상태', value: backPct > 0 ? '큰 각도 산란이 실제로 관측됨 → 핵은 작고 무겁다' : '아직 데이터가 부족함', wide: true }
      ];
    },

    notes: [
      '당시 유력했던 "푸딩 모형"(전하가 원자 전체에 고르게 퍼져 있음)이 맞다면, 모든 알파 입자는 <b>아주 살짝만</b> 휘어야 합니다. 큰 각도로 튕기는 입자는 아예 없어야 합니다.',
      '실제로는 거의 다 <b>그대로 통과</b>하는데, 아주 가끔(원래 실험에서는 약 8000개 중 1개꼴) <b>90˚ 넘게, 심지어 거의 정반대로</b> 튕겨 나왔습니다. 러더퍼드는 이걸 "휴지에 대포알을 쐈는데 튕겨서 되돌아온 것만큼 믿기 힘들었다"고 표현했습니다.',
      '이렇게 튕기려면 원자의 (+)전하와 질량 대부분이 <b>아주 작은 한 점(원자핵)</b>에 몰려 있어야만 합니다 — 그래서 원자는 대부분 <b>빈 공간</b>이라는 결론이 나옵니다.',
      '실제 비율(8000개 중 1개)은 여기서 관찰하기엔 너무 드물어서, 이 시뮬레이션은 그 비율을 <b>훨씬 과장</b>해서 보여줍니다. 궤적이 핵 근처에서 꺾이는 모습도 실제 쿨롱 힘에 의한 매끄러운 곡선을 단순화한 것이며, <b>최종 산란각 자체는 공식 그대로 정확</b>합니다.'
    ],
    presets: [
      { name: '금박(기본)', set: { Z: 79, E: 5, rate: 200 } },
      { name: '알루미늄박(가벼운 핵 → 덜 튕김)', set: { Z: 13, E: 5, rate: 200 } },
      { name: '더 강한 알파 입자(덜 튕김)', set: { Z: 79, E: 9, rate: 200 } },
      { name: '더 약한 알파 입자(더 많이 튕김)', set: { Z: 79, E: 3, rate: 200 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const nucX = w * .27, nucY = h * .56, travel = 118;
      const dmin_fm = dMin_m(p) * 1e15;
      const bmax = bMax_m();

      // 금박(과녁) 표시
      D.line(ctx, nucX, nucY - 150, nucX, nucY + 150, { color: 'rgba(251,191,36,.18)', width: 26 });
      D.text(ctx, (p.Z === 79 ? '금박' : 'Z=' + p.Z + ' 박막'), nucX, nucY - 162, { size: 11, color: '#93a2c4', align: 'center' });

      // 원자핵
      ctx.save();
      if (hl === 'dmin') { ctx.shadowColor = C.dmin; ctx.shadowBlur = 20; }
      D.dot(ctx, nucX, nucY, 5, C.Z, hl === 'dmin');
      ctx.restore();
      D.text(ctx, '원자핵', nucX, nucY + 20, { size: 9.5, color: C.Z, align: 'center' });

      // 예시 궤적(고정된 조준 거리들 — 실제 kZze²/(2Eb) 공식으로 각도 계산, 꺾이는 지점만 단순화)
      const N_EX = 12;
      for (let i = -N_EX / 2; i <= N_EX / 2; i++) {
        if (i === 0) continue;
        const bReal = (Math.abs(i) / (N_EX / 2)) * bmax;
        const th = theta(bReal, p);
        const sign = i > 0 ? 1 : -1;
        const pxOffset = sign * (Math.abs(i) / (N_EX / 2)) * 46;
        const big = th > Math.PI / 2;
        const col = big ? C.back : 'rgba(147,209,255,.55)';
        ctx.save();
        if (big) { ctx.shadowColor = C.back; ctx.shadowBlur = 8; }
        ctx.strokeStyle = col; ctx.lineWidth = big ? 2 : 1.3;
        ctx.beginPath();
        ctx.moveTo(nucX - travel, nucY + pxOffset);
        ctx.lineTo(nucX, nucY + pxOffset);
        // 반발력이므로 나가는 방향은 들어온 쪽과 같은 편으로(축에서 더 멀어지는 쪽으로) 꺾인다
        ctx.lineTo(nucX + travel * Math.cos(th), nucY + pxOffset + sign * travel * Math.sin(th));
        ctx.stroke();
        ctx.restore();
      }

      // 빔 방향 화살표
      D.arrow(ctx, nucX - travel - 26, nucY, 20, 0, { color: '#93a2c4', width: 2, label: '알파 입자 빔' });

      // 오른쪽: 산란각 분포(막대가 각도 방향으로 뻗어나가는 극좌표 히스토그램)
      const detX = w * .74, detY = nucY, R = Math.min(140, w * .2);
      // 기준 반원 + 눈금
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(detX, detY, R, -Math.PI, 0); ctx.stroke();
      ctx.restore();
      [0, 45, 90, 135, 180].forEach(deg => {
        const a = -deg * Math.PI / 180;
        D.line(ctx, detX, detY, detX + Math.cos(a) * R, detY + Math.sin(a) * R, { color: 'rgba(255,255,255,.08)' });
        D.text(ctx, deg + '˚', detX + Math.cos(a) * (R + 14), detY + Math.sin(a) * (R + 14), { size: 9.5, color: '#61719a', align: 'center' });
      });
      D.text(ctx, '검출기 각도 분포(막대 길이 = log 눈금)', detX, detY - R - 26, { size: 11, color: '#93a2c4', align: 'center' });

      const maxBin = Math.max(1, ...st.hist);
      for (let i = 0; i < BINS; i++) {
        const cnt = st.hist[i];
        if (cnt <= 0) continue;
        const aCenter = -((i + .5) / BINS) * Math.PI;
        const len = R * (Math.log(1 + cnt) / Math.log(1 + maxBin));
        const big = (i + .5) / BINS > .5;
        ctx.save();
        ctx.strokeStyle = big ? C.back : C.rate;
        ctx.globalAlpha = .85;
        ctx.lineWidth = (R * Math.PI / BINS) * .8;
        ctx.beginPath();
        ctx.moveTo(detX, detY);
        ctx.lineTo(detX + Math.cos(aCenter) * len, detY + Math.sin(aCenter) * len);
        ctx.stroke();
        ctx.restore();
      }
      D.dot(ctx, detX, detY, 4, '#e8eefc', false);

      // 방금 튕긴 입자가 큰 각도였다면 강조 표시
      if (st.lastTheta !== null && st.t - st.lastT < .3 && st.lastTheta > Math.PI / 2) {
        D.tag(ctx, '방금 ' + fmt(st.lastTheta * 180 / Math.PI, 0) + '˚로 튕겨나감!', detX, detY + 26, C.back, true);
      }

      D.text(ctx, 'd_min = ' + fmt(dmin_fm, 1) + ' fm  ·  누적 ' + st.total + '개  ·  90˚+ ' + st.back + '개',
        16, h - 14, { size: 10.5, color: '#93a2c4' });
    }
  });
})();
