/* 등가속도 직선 운동 — 시뮬레이션 값을 교과서 공식으로 따로 계산해 비교한다.
   형식은 tools/test-sims.js 참고: check() 가 null 이면 통과, 문자열이면 실패 이유. */
module.exports = [
  { name: '속도 v = v₀ + at (v₀=3, a=1.5, t=2)', set: { v0: 3, a: 1.5 }, run: 2,
    check: ({ ro, near }) => near(ro('현재 속도 v'), 3 + 1.5 * 2) },
  { name: '변위 s = v₀t + ½at² (v₀=3, a=1.5, t=2)', set: { v0: 3, a: 1.5 }, run: 2,
    check: ({ ro, near }) => near(ro('변위 s'), 3 * 2 + .5 * 1.5 * 4) },
  { name: '감속: 멈추는 시각 이후 v = v₀ + at 가 음수로 (v₀=4, a=−2, t=3)', set: { v0: 4, a: -2 }, run: 3,
    check: ({ ro, near }) => near(ro('현재 속도 v'), 4 - 2 * 3) },
  { name: '평균 속도 = (v₀+v)/2 (등가속도의 성질)', set: { v0: 2, a: 3 }, run: 1.5,
    check: ({ ro, near }) => near(ro('평균 속도 s/t'), (2 + (2 + 3 * 1.5)) / 2) }
];
