/* 단진자 — 시뮬레이션 값을 교과서 공식으로 따로 계산해 비교한다 (시뮬레이션 코드를 쓰지 않는다).
   작은 각: T₀ = 2π√(L/g).  정확한 주기: T = 4√(L/g)·K(k), k = sin(θ₀/2), K = 제1종 완전 타원 적분.
   K 는 이 파일 안에서 심프슨 적분으로 따로 계산한다. 바닥 속력은 에너지 보존 v = √(2gL(1 − cosθ₀)). */
const d2r = d => d * Math.PI / 180;
const T0 = (L, g) => 2 * Math.PI * Math.sqrt(L / g);
function K(k) {               // ∫₀^{π/2} dφ / √(1 − k² sin²φ), 심프슨 2000칸
  const n = 2000, hh = Math.PI / 2 / n, f = x => 1 / Math.sqrt(1 - k * k * Math.sin(x) ** 2);
  let s = f(0) + f(Math.PI / 2);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(i * hh);
  return s * hh / 3;
}
const Tex = (L, g, deg) => 4 * Math.sqrt(L / g) * K(Math.sin(d2r(deg) / 2));

module.exports = [
  { name: '작은 각 공식 L=1, g=9.8 → 2π√(1/9.8) = 2.007 s', set: { L: 1, th: 20, g: 9.8 }, run: .1,
    check: ({ ro, near }) => near(ro('작은 각 공식 T'), 2.00709, .0005) },
  { name: '작은 진폭(5°) 잰 주기 = 정확한 주기 (L=1, g=9.8)', set: { L: 1, th: 5, g: 9.8 }, run: 4.5,
    check: ({ ro, near }) => near(ro('잰 주기'), Tex(1, 9.8, 5), .001) },
  { name: '줄 4배면 주기 2배 (L=4 의 잰 주기 = L=1 정확한 주기 × 2, θ₀=5°)', set: { L: 4, th: 5, g: 9.8 }, run: 8.5,
    check: ({ ro, near }) => near(ro('잰 주기'), 2 * Tex(1, 9.8, 5), .001) },
  { name: '실제 값 — 달 g=1.62, L=1 → 4.94 s (작은 각, θ₀=5°의 잰 주기)', set: { L: 1, th: 5, g: 1.62 }, run: 10.5,
    check: ({ ro, near }) => near(ro('잰 주기'), Tex(1, 1.62, 5), .001) || near(ro('잰 주기'), 4.937, .005) },
  { name: '큰 진폭 60° — 잰 주기 = 4√(L/g)K(sin30°) = 작은 각 공식 × 1.073', set: { L: 1, th: 60, g: 9.8 }, run: 4.5,
    check: ({ ro, near }) => near(ro('잰 주기'), Tex(1, 9.8, 60), .001) || near(ro('잰 주기') / T0(1, 9.8), 1.0732, .002) },
  { name: '보정 공식 방향 — 20°에서 1 + θ₀²/16 이 정확한 주기와 0.1 % 안', set: { L: 1, th: 20, g: 9.8 }, run: .1,
    check: ({ ro, near }) => near(ro('큰 각 보정 T′'), Tex(1, 9.8, 20), .001) },
  { name: '에너지 보존 — 바닥 속력 √(2gL(1−cos40°)) (L=2, g=9.8)', set: { L: 2, th: 40, g: 9.8 }, run: 3,
    check: ({ ro, near }) => near(ro('가장 빠를 때 속력'), Math.sqrt(2 * 9.8 * 2 * (1 - Math.cos(d2r(40)))), .002) },
  { name: '극단값 — 슬라이더 끝 L=4, θ₀=80°, g=1.6: 잰 주기 = 정확한 주기 (19.0 s)', set: { L: 4, th: 80, g: 1.6 }, run: 40,
    check: ({ ro, near }) => near(ro('잰 주기'), Tex(4, 1.6, 80), .001) },
  { name: '극단값 — 슬라이더 끝 L=0.2, θ₀=80°, g=25: 잰 주기 = 정확한 주기', set: { L: .2, th: 80, g: 25 }, run: 3,
    check: ({ ro, near }) => near(ro('잰 주기'), Tex(.2, 25, 80), .001) }
];
