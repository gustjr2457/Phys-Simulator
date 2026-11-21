/* 위성항법(GPS) — 시뮬레이션 값을 교과서 공식으로 따로 비교한다 (시뮬레이션 코드를 쓰지 않는다).
   거리 = 빛의 속도 × 걸린 시간: r = c·Δt,  c = 299,792.458 km/s (정의값)
   시계 오차 δt 의 거리 몫: Δr = c·δt (1 ns → 0.2998 m)
   위성 거리는 코사인 법칙으로: 지구 중심에서 본 위성–수신기 사이 각 γ, r² = R_E² + R_s² − 2·R_E·R_s·cos γ  (R_E = 6371 km, R_s = R_E + H)
   위성 방향(지구 중심에서, 위쪽 기준): 위성 1 −45°, 위성 2 +5°, 위성 3 +50°.
   위성 2개로 계산한 위치 오차는 선형화로 따로 구한다: 위성 i 에서 수신기로 향하는 단위벡터 u_i 에 대해 u_i·Δp = Δr (두 식, 미지수 2개). */
const c = 299792.458, RE = 6371, RAD = Math.PI / 180, SA = [-45, 5, 50];
const rng = (H, phi, i) => { const Rs = RE + H, g = (SA[i] - phi) * RAD; return Math.sqrt(RE * RE + Rs * Rs - 2 * RE * Rs * Math.cos(g)); };
const ms = (H, phi, i) => rng(H, phi, i) / c * 1000;
// 선형화한 위치 오차 (m)
function linErr(H, phi, dte) {
  const Rs = RE + H, R = [RE * Math.sin(phi * RAD), RE * Math.cos(phi * RAD)];
  const u = [0, 1].map(i => { const S = [Rs * Math.sin(SA[i] * RAD), Rs * Math.cos(SA[i] * RAD)], d = Math.hypot(R[0] - S[0], R[1] - S[1]); return [(R[0] - S[0]) / d, (R[1] - S[1]) / d]; });
  const dr = c * dte * 1e-6, det = u[0][0] * u[1][1] - u[0][1] * u[1][0];
  const x = (dr * u[1][1] - u[0][1] * dr) / det, y = (u[0][0] * dr - dr * u[1][0]) / det;
  return Math.hypot(x, y);
}

module.exports = [
  { name: '손 계산 — 고도 20,200 km 바로 위 위성(φ = 5°): Δt = 20,200 ÷ 299,792.458 = 67.38 ms', set: { H: 20200, phi: 5, dte: 0 }, run: .1,
    check: ({ ro, near }) => near(ro('위성 2 신호 시간 Δt'), 20200 / c * 1000, .01) || near(ro('위성 2 신호 시간 Δt'), 67.3801, .001)
      || near(ro('위성 2까지 진짜 거리 r'), 20200, .001) },
  { name: '시계 오차 500 ns → 거리 오차 c·δt = 149.9 m (1 ns 에 약 0.3 m)', set: { dte: 500 }, run: .1,
    check: ({ ro, near }) => near(ro('거리 오차 Δr = c·δt'), 149.896229, .002) },
  { name: '코사인 법칙 거리 — H = 27,300 km, φ = −13°: 위성 1·3 신호 시간', set: { H: 27300, phi: -13, dte: 0 }, run: .1,
    check: ({ ro, near }) => near(ro('위성 1 신호 시간'), ms(27300, -13, 0), .002) || near(ro('위성 3 신호 시간'), ms(27300, -13, 2), .002) },
  { name: '위성 3개로 풀면 넣은 시계 오차(730 ns)를 되찾고 위치 오차는 0', set: { H: 27300, phi: -13, dte: 730 }, run: .1,
    check: ({ ro, near }) => near(ro('위성 3개로 풀어 낸 시계 오차'), 730, .002) || near(ro('위성 3개로 푼 위치 오차'), 0, .01, .01) },
  { name: '시계가 정확하면(δt = 0) 위성 2개로 계산한 위치 오차 0, 위성 3과 어긋남 0', set: { dte: 0 }, run: .1,
    check: ({ ro, near }) => near(ro('위성 2개로 계산한 위치 오차 e'), 0, .01, .05) || near(ro('위성 3의 원과 어긋난 거리'), 0, .01, .05) },
  { name: '기본값(δt = 100 ns) 위성 2개 위치 오차 = 선형화한 두 직선의 교점 거리', set: { H: 20200, phi: 0, dte: 100 }, run: .1,
    check: ({ ro, near }) => near(ro('위성 2개로 계산한 위치 오차 e'), linErr(20200, 0, 100), .003) },
  { name: '극단값 — H = 36,000 km, φ = 20°, δt = 1000 ns: 위성 1 신호 시간, Δr = 299.8 m, 시계 오차 되찾기', set: { H: 36000, phi: 20, dte: 1000 }, run: .1,
    check: ({ ro, near }) => near(ro('위성 1 신호 시간'), ms(36000, 20, 0), .002) || near(ro('거리 오차 Δr = c·δt'), c * 1e-3, .002)
      || near(ro('위성 3개로 풀어 낸 시계 오차'), 1000, .002) || near(ro('위성 2개로 계산한 위치 오차 e'), linErr(36000, 20, 1000), .005) },
  { name: '전파 시계 — 화면 1초 = 실제 50 ms (1초 뒤 50 ms)', set: {}, run: 1,
    check: ({ ro, near }) => near(ro('신호 출발 뒤 시간 (화면 1초 = 실제 50 ms)'), 50, .01) },
  { name: '시간이 지나도 거리는 그대로 (10초 진행 뒤 위성 2 신호 시간 변화 0 — 위성·수신기 고정)', set: { H: 20200, phi: 5, dte: 0 }, run: 10,
    check: ({ ro, near }) => near(ro('위성 2 신호 시간 Δt'), 20200 / c * 1000, .001) }
];
