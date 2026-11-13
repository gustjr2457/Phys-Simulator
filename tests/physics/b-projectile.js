/* 포물선 운동 — 시뮬레이션 값을 교과서 공식으로 따로 계산해 비교한다.
   기대값은 시뮬레이션 코드를 쓰지 않고 이 파일 안에서 직접 계산한다.
   R = v₀² sin2θ / g,  H = (v₀ sinθ)² / (2g),  T = 2 v₀ sinθ / g,  x(t) = v₀cosθ·t,  y(t) = v₀sinθ·t − ½gt² */
const d2r = d => d * Math.PI / 180;
module.exports = [
  { name: '사거리 θ=45°, v₀=20, g=9.8 → 400/9.8 = 40.82 m (착지 위치)', set: { v0: 20, th: 45, g: 9.8 }, run: 5,
    check: ({ st, ro, near }) => st.done ? near(ro('가로 위치 x'), 400 / 9.8, .002) : '5초 안에 착지하지 않았다' },
  { name: '사거리 θ=30°, v₀=20 → 400·sin60°/9.8 = 35.35 m', set: { v0: 20, th: 30, g: 9.8 }, run: 5,
    check: ({ ro, near }) => near(ro('가로 위치 x'), 400 * Math.sin(d2r(60)) / 9.8, .002) },
  { name: '30°와 60°의 사거리가 같다 (60° 착지 위치 = 35.35 m)', set: { v0: 20, th: 60, g: 9.8 }, run: 5,
    check: ({ ro, near }) => near(ro('가로 위치 x'), 400 * Math.sin(d2r(120)) / 9.8, .002) },
  { name: '최고 높이 θ=60°, v₀=20 → (20·sin60°)²/(2·9.8) = 15.31 m (실제로 올라간 높이)', set: { v0: 20, th: 60, g: 9.8 }, run: 5,
    check: ({ ro, near }) => near(ro('지금까지 최고 높이'), Math.pow(20 * Math.sin(d2r(60)), 2) / 19.6, .002) },
  { name: '비행 시간 θ=45°, v₀=20 → 2·20·sin45°/9.8 = 2.886 s', set: { v0: 20, th: 45, g: 9.8 }, run: 5,
    check: ({ ro, near }) => near(ro('날아간 시간'), 40 * Math.SQRT1_2 / 9.8, .002) },
  { name: '1초 뒤 위치 (v₀=18, θ=60°): x = 9.00 m, y = 18·sin60° − 4.9 = 10.69 m', set: { v0: 18, th: 60, g: 9.8 }, run: 1,
    check: ({ ro, near }) => near(ro('가로 위치 x'), 9, .002) || near(ro('높이 y'), 18 * Math.sin(d2r(60)) - 4.9, .002) },
  { name: '가로 속도는 변하지 않는다 (2초 뒤에도 v₀cosθ = 9 m/s), 세로는 v₀sinθ − gt', set: { v0: 18, th: 60, g: 9.8 }, run: 2,
    check: ({ ro, near }) => near(ro('가로 속도 vx'), 9, .002) || near(ro('세로 속도 vy'), 18 * Math.sin(d2r(60)) - 19.6, .005) },
  { name: '극단값 — 슬라이더 끝 v₀=30, θ=85°, 달 g=1.6: 비행 시간 37.35 s, 사거리 97.5 m', set: { v0: 30, th: 85, g: 1.6 }, run: 40,
    check: ({ ro, near }) => near(ro('날아간 시간'), 60 * Math.sin(d2r(85)) / 1.6, .002) || near(ro('가로 위치 x'), 900 * Math.sin(d2r(170)) / 1.6, .002) },
  { name: '실제 값 — 달(g=1.62 대신 1.6)에서는 지구(9.8)보다 9.8/1.6 = 6.1배 멀리', set: { v0: 20, th: 45, g: 1.6 }, run: 30,
    check: ({ ro, near }) => near(ro('가로 위치 x'), (400 / 9.8) * (9.8 / 1.6), .002) }
];
