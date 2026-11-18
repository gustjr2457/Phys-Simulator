/* 전기장과 전위 — 시뮬레이션 값을 쿨롱 법칙으로 따로 계산해 비교한다 (시뮬레이션 코드를 쓰지 않는다).
   F = k·q₁q₂/d²,  E = k·q/r²,  V = k·q/r,  k = 8.988×10⁹ N·m²/C²
   시험전하 +1 nC 의 역학적 에너지 ½mv² + qV 는 움직이는 동안 보존되어야 한다.
   질량은 시뮬레이션이 정한 0.2 g 을 그대로 쓰되(보기 좋은 값), 퍼텐셜은 여기서 쿨롱 식으로 따로 계산한다. */
const K = 8.988e9, QT = 1e-9, MT = 2e-4;
const Vat = (P, x, y) => {                              // x, y: cm
  const at = [[-P.d / 2, 0, P.q1], [P.d / 2, 0, P.q2]];
  return at.reduce((s, [cx, cy, q]) => s + K * q * 1e-9 / (Math.hypot(x - cx, y - cy) / 100), 0);
};
const energy = (st, P) => .5 * MT * (st.vx * st.vx + st.vy * st.vy) + QT * Vat(P, st.x, st.y);

module.exports = [
  { name: '쿨롱 힘 — +5 nC, −3 nC, 8 cm: F = k·15×10⁻¹⁸/0.08² = 2.107×10⁻⁵ N', set: { q1: 5, q2: -3, d: 8 }, run: .1,
    check: ({ ro, near }) => near(ro('두 전하 사이의 힘 F'), K * 15e-18 / .0064, 1e-4) },
  { name: '가운데 — E = k(5+3)nC/0.04² = 44,940 N/C, V = k(5−3)nC/0.04 = 449.4 V', set: { q1: 5, q2: -3, d: 8 }, run: .1,
    check: ({ ro, near }) => near(ro('중앙의 전기장 E'), K * 8e-9 / .0016, 1e-4) || near(ro('중앙의 전위 V'), K * 2e-9 / .04, 1e-4) },
  { name: '시험전하가 몇 초 동안 날아간다 (1초 뒤에도 화면 안, 0.5 cm 넘게 움직임)', set: { q1: 5, q2: -3, d: 8, y0: 5 }, run: 1,
    check: ({ st }) => st.gone ? '1초 안에 사라졌다' : Math.hypot(st.x, st.y - 5) > .5 ? null : `${Math.hypot(st.x, st.y - 5).toFixed(3)} cm 만 움직였다` },
  { name: '에너지 보존 — 기본 배치, 4초 진행 뒤 ½mv² + qV 가 처음과 0.5 % 안', set: { q1: 5, q2: -3, d: 8, y0: 5 }, run: 4,
    check: ({ st, sim, P, near }) => near(energy(st, P), energy(sim.init(P), P), .005) },
  { name: '에너지 보존 — 쌍극자(+5, −5)에서 음전하 곁을 스쳐 도는 8초 동안 0.5 % 안', set: { q1: 5, q2: -5, d: 8, y0: 5 }, run: 8,
    check: ({ st, sim, P, near }) => near(energy(st, P), energy(sim.init(P), P), .005) }
];
