/* 단진동 — x(t) = A cos(ωt), ω = √(k/m), T = 2π/ω, 역학적 에너지 = ½kA² */
const W = (k, m) => Math.sqrt(k / m);
module.exports = [
  { name: '각진동수 ω = √(k/m) (k=20, m=1)', set: { k: 20, m: 1 }, run: .1,
    check: ({ ro, near }) => near(ro('각진동수 ω'), W(20, 1)) },
  { name: '주기 T = 2π√(m/k) (k=8, m=2)', set: { k: 8, m: 2 }, run: .1,
    check: ({ ro, near }) => near(ro('주기 T'), 2 * Math.PI * Math.sqrt(2 / 8)) },
  { name: '변위 x(1 s) = A cos(ωt) (k=20, m=1, A=1.5)', set: { k: 20, m: 1, A: 1.5 }, run: 1,
    check: ({ ro, near }) => near(ro('현재 변위 x'), 1.5 * Math.cos(W(20, 1) * 1), .005, 1e-3) },
  { name: '에너지 보존 ½kA² (3초 뒤에도)', set: { k: 20, m: 1, A: 1.5 }, run: 3,
    check: ({ ro, near }) => near(ro('스프링 에너지 U + 운동에너지 K'), .5 * 20 * 1.5 * 1.5, .002) }
];
