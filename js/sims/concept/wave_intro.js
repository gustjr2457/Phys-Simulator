/* 초급·개념 — 파동이란 무엇인가? (거시세계)
   "파동은 이동하지만, 매질 입자는 제자리에서만 움직인다"는 가장 기본적인 개념.
   횡파(밧줄)와 종파(용수철) 두 가지를 같은 화면에서 비교해서
   "흔들리는 방향"만 다르고 원리는 같다는 것을 보여준다.
   고등물리 트랙의 '파동의 표현'(v=fλ 정량 계산)보다 앞서 보는 개념 시뮬. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { speed: '#60a5fa', amp: '#f472b6', dot: '#fbbf24', pulse: '#5eead4', medium: '#93a2c4' };
  const N = 46; // 매질 입자 개수

  function shape(x, t, speed, amp) {
    // 진행하는 사인파 하나 (개념 설명용, 파장은 화면에 맞춰 고정)
    const k = (2 * Math.PI) / 3.2;
    return amp * Math.sin(k * (x - speed * t));
  }

  PS.register({
    id: 'c-wave', mode: 'concept', category: '파동과 빛',
    title: '파동이란 무엇인가?',
    sub: '흔들림이 전달되는 것 — 알갱이 자체는 이동하지 않는다',
    tagline: '노란 점 하나에 집중해 보세요. 파동(청록색 무늬)은 오른쪽으로 계속 나아가지만, 그 점은 제자리에서 위아래(또는 앞뒤)로만 왔다 갔다 합니다.',

    params: [
      { key: 'kind', symbol: '', label: '파동의 종류', unit: '', min: 0, max: 1, step: 1, value: 0, color: C.medium, reset: true, dec: 0,
        where: '<b>0 = 횡파</b>(흔들리는 방향이 나아가는 방향과 수직 — 밧줄, 물결, 빛) / <b>1 = 종파</b>(흔들리는 방향이 나아가는 방향과 같음 — 소리, 용수철).' },
      { key: 'speed', symbol: 'v', label: '파동의 속력', unit: '', min: 0.3, max: 2.2, step: .1, value: 1, color: C.speed, dec: 1,
        where: '무늬(파동)가 오른쪽으로 <b>나아가는 빠르기</b>입니다. 소리보다 빛이 훨씬 빠른 것처럼, 파동마다 속력이 다릅니다.' },
      { key: 'amp', symbol: 'A', label: '흔들림의 크기', unit: '', min: 0.2, max: 1.2, step: .1, value: .8, color: C.amp, dec: 1,
        where: '입자가 제자리에서 <b>얼마나 크게</b> 흔들리는지입니다. 파동의 에너지가 클수록 이 값이 커집니다(소리라면 더 큰 소리).' }
    ],
    vars: {
      medium: { symbol: '매질', label: '매질 입자', unit: '', color: C.medium, where: '파동이 지나가는 <b>물질</b>입니다(밧줄, 물, 공기 등). 파동이 지나가도 이 자리를 떠나지 않습니다.' }
    },
    formulas: [
      { name: '파동이 옮기는 것', tpl: '파동은 {medium} 자체가 아니라 "흔들림(에너지)"을 옮긴다' }
    ],

    init(p) {
      return { t: 0, dist: 0 };
    },
    step(st, p, dt) {
      st.t += dt;
      st.dist += p.speed * dt;
    },

    readouts(st, p) {
      return [
        { label: '파동이 이동한 거리', value: st.dist, unit: '', dec: 2, color: C.pulse, wide: true },
        { label: '노란 점이 이동한 거리', value: 0, unit: '(제자리)', dec: 0, color: C.dot, wide: true }
      ];
    },

    notes: [
      '<b>횡파</b>: 흔들리는 방향 ⊥ 나아가는 방향 — 밧줄, 물결파, 빛.',
      '<b>종파</b>: 흔들리는 방향 ∥ 나아가는 방향 — 소리, 용수철을 앞뒤로 밀 때.',
      '노란 점을 계속 보면, <b>파동은 지나가지만 점은 결코 오른쪽으로 떠내려가지 않습니다</b>.',
      '속력 v를 올리면 무늬가 더 빨리 지나가지만, 점이 흔들리는 폭(A)은 속력과 관계없이 그대로입니다.'
    ],
    presets: [
      { name: '횡파 (밧줄·물결)', set: { kind: 0 } },
      { name: '종파 (소리·용수철)', set: { kind: 1 } },
      { name: '천천히, 크게', set: { speed: .5, amp: 1.1 } },
      { name: '빠르게, 작게', set: { speed: 2, amp: .3 } }
    ],

    challenges: [
      { id: 'ch-longitudinal-fast', title: '빠른 종파 만들기',
        desc: '파동의 종류를 종파로 바꾸고, 속력(v)을 1.5 이상으로 올려보세요.',
        check: ctx => ctx.P.kind >= 0.5 && ctx.P.speed >= 1.5,
        hint: '파동 종류 슬라이더를 1(종파)로, 속력 슬라이더를 오른쪽으로 옮겨보세요.' },
      { id: 'ch-travel5', title: '파동을 5만큼 진행시키기',
        desc: '재생을 눌러서 파동이 이동한 거리가 5를 넘을 때까지 지켜보세요.',
        check: ctx => ctx.st.dist >= 5,
        hint: '속력을 높이면 더 빨리 도달합니다. 화면 아래의 재생 속도도 올려보세요.' }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const V = PS.view(w, h, { x0: -0.3, x1: 6.6, y0: -1.6, y1: 1.6, pad: 26, uniform: false });
      const cy = V.Y(0);
      const isLong = p.kind >= .5;

      D.text(ctx, isLong ? '종파 (소리·용수철처럼 앞뒤로 흔들림)' : '횡파 (밧줄·물결처럼 위아래로 흔들림)',
        w / 2, 22, { size: 12.5, color: '#e8eefc', align: 'center', bold: true });

      // 기준선
      D.line(ctx, V.X(-0.3), cy, V.X(6.6), cy, { color: 'rgba(255,255,255,.12)', width: 1 });

      if (!isLong) {
        // 횡파: 매질 위아래로 흔들리는 파형 곡선 + 점들
        ctx.save();
        ctx.strokeStyle = C.pulse; ctx.lineWidth = 2.4; ctx.globalAlpha = .85;
        if (hl === 'speed') { ctx.shadowColor = C.speed; ctx.shadowBlur = 12; }
        ctx.beginPath();
        for (let x = -0.3; x <= 6.6; x += .04) {
          const y = shape(x, st.t, p.speed, p.amp);
          const px = V.X(x), py = V.Y(y);
          x === -0.3 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();

        for (let i = 0; i < N; i++) {
          const x = -0.3 + (6.6 - -0.3) * i / (N - 1);
          const y = shape(x, st.t, p.speed, p.amp);
          D.dot(ctx, V.X(x), V.Y(y), 4, 'rgba(147,162,196,.55)', false);
        }
        // 강조 입자(노란 점)
        const hx = 3.1;
        const hy = shape(hx, st.t, p.speed, p.amp);
        D.line(ctx, V.X(hx), cy, V.X(hx), V.Y(hy), { color: C.dot, width: 1.4, dash: [3, 4] });
        D.dot(ctx, V.X(hx), V.Y(hy), 8, C.dot, true);
        D.tag(ctx, '이 점은 위아래로만 움직임', V.X(hx), V.Y(hy) - 22, C.dot, true);
      } else {
        // 종파: 압축/이완을 점들의 좌우 간격으로 표현
        const baseY = cy;
        for (let i = 0; i < N; i++) {
          const x0 = -0.3 + (6.6 - -0.3) * i / (N - 1);
          const disp = shape(x0, st.t, p.speed, p.amp) * 0.55; // 좌우 변위로 사용
          const x = x0 + disp;
          const isHi = i === Math.round(N * 0.55);
          const px = V.X(x);
          D.dot(ctx, px, baseY, isHi ? 8 : 5, isHi ? C.dot : 'rgba(147,162,196,.6)', isHi);
          if (isHi) D.tag(ctx, '이 점은 앞뒤로만 움직임', px, baseY - 26, C.dot, true);
        }
        // 압축/이완 구간 음영 힌트
        D.text(ctx, '점들이 촘촘한 곳 = 압축, 성긴 곳 = 이완', w / 2, h - 46, { size: 10.5, color: '#61719a', align: 'center' });
      }

      // 진행 방향 화살표
      D.arrow(ctx, V.X(5.6), V.Y(-1.35), V.S(0.7), 0, { color: C.speed, width: 3, hot: hl === 'speed', label: '파동이 나아가는 방향' });

      D.text(ctx, '파동이 지나간 거리: ' + fmt(st.dist, 1), 16, h - 14, { size: 11, color: C.pulse });
    }
  });
})();
