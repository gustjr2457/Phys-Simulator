/* 선회 비행 — 시뮬레이션 값을 교과서 공식으로 따로 비교한다 (시뮬레이션 코드를 쓰지 않는다).
   수평 정상 선회(고도 일정, 미끄러짐 없음):
     위 성분  L·cosφ = W            →  n = L/W = 1/cosφ
     옆 성분  L·sinφ = m·V²/R       →  R = V²/(g·tanφ),  ω = V/R,  한 바퀴 T = 2πR/V
     실속     ½ρV²S·CLmax = n·W     →  선회 실속 속도 = Vₛ·√n
   잰 선회 반경은 시뮬레이션이 적분해 그린 자취의 세 점으로 잰 값이다. */
const g = 9.80665, d2r = d => d * Math.PI / 180;
const Rx = (V, deg) => V * V / (g * Math.tan(d2r(deg)));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

module.exports = [
  { name: '60° 경사 → n = 1/cos60° = 2 (2G), 60 kg 학생은 120 kg 처럼 느낀다', set: { V: 100, phi: 60, Vs: 50 }, run: .1,
    check: ({ ro, near }) => near(ro('하중 배수 n (필요)'), 2, 1e-9) || near(ro('60 kg 학생이 느끼는 몸무게'), 120, 1e-9) },
  { name: 'V = 100 m/s, φ = 30° → R = 100²/(g·tan30°) = 1766.1 m, 자취로 잰 반경도 같다', set: { V: 100, phi: 30, Vs: 50 }, run: 3,
    check: ({ ro, near }) => near(ro('선회 반경 R (공식)'), 1766.1, .0005) || near(ro('잰 선회 반경 (자취)'), Rx(100, 30), .002) },
  { name: '선회율·한 바퀴 시간 — V = 100, φ = 30°: ω = g·tan30°/V = 3.244 °/s, T = 110.97 s', set: { V: 100, phi: 30, Vs: 50 }, run: .1,
    check: ({ ro, near }) => {
      const om = g * Math.tan(d2r(30)) / 100 * 180 / Math.PI;
      return near(ro('선회율 ω'), om, .0005) || near(ro('한 바퀴 시간'), 2 * Math.PI * Rx(100, 30) / 100, .0005);
    } },
  { name: '선회 실속 속도 = Vₛ·√n — Vₛ = 50, φ = 60° → 50√2 = 70.71 m/s', set: { V: 100, phi: 60, Vs: 50 }, run: .1,
    check: ({ ro, near }) => near(ro('선회 중 실속 속도'), 50 * Math.SQRT2, 1e-6) },
  { name: '한 바퀴 돌면 제자리 — V = 200, φ = 45°: T = 2π·200/g = 128.14 s 뒤 출발점', set: { V: 200, phi: 45, Vs: 50 },
    run: 2 * Math.PI * 200 / g,
    check: ({ st, sim, P }) => {
      const s0 = sim.init(P), R = Rx(200, 45), back = dist(st, s0);
      return back <= R * .002 ? null : `출발점에서 ${back.toFixed(2)} m 떨어져 있다 (R = ${R.toFixed(0)} m)`;
    } },
  { name: '반 바퀴(T/2 = 64.07 s) 뒤에는 원의 반대편 — 출발점까지 거리 = 지름 2R = 8157.7 m', set: { V: 200, phi: 45, Vs: 50 },
    run: Math.PI * 200 / g,
    check: ({ st, sim, P, near }) => near(dist(st, sim.init(P)), 2 * Rx(200, 45), .002) },
  { name: '양력이 속도에 수직이라 속력은 그대로 — 20 초 뒤에도 V = 120 m/s (φ = 75°)', set: { V: 120, phi: 75, Vs: 40 }, run: 20,
    check: ({ ro, near }) => near(ro('지금 속력'), 120, 1e-6) },
  { name: '극단값 — V = 250, φ = 5°: R = 72.8 km (자취로 잰 값)', set: { V: 250, phi: 5, Vs: 80 }, run: 2,
    check: ({ ro, near }) => near(ro('잰 선회 반경 (자취)'), Rx(250, 5), .002) || near(Rx(250, 5), 72838, .001) },
  { name: '극단값 — V = 40, φ = 75°: n = 3.864, R = 43.8 m, 실속 Vₛ=20 → 39.3 m/s (아슬아슬하게 안전)', set: { V: 40, phi: 75, Vs: 20 }, run: 2,
    check: ({ ro, near }) => near(ro('하중 배수 n (필요)'), 1 / Math.cos(d2r(75)), 1e-9) || near(ro('잰 선회 반경 (자취)'), Rx(40, 75), .002)
      || near(ro('선회 중 실속 속도'), 20 / Math.sqrt(Math.cos(d2r(75))), 1e-6) },
  // 실속 — 날개가 낼 수 있는 최대 하중은 L_max/W = (V/Vₛ)² (½ρV²S·CLmax ÷ ½ρVₛ²S·CLmax).
  // 필요한 n 이 이보다 크면 날개는 최대치까지만 낸다 → 옆 성분이 모자라 원이 커지고, 위 성분이 모자라 떨어진다.
  { name: '실속 — V = 60, φ = 60°, Vₛ = 50: 날개 최대 (60/50)² = 1.44 G < 필요 2 G', set: { V: 60, phi: 60, Vs: 50 }, run: .1,
    check: ({ ro, near }) => near(ro('날개가 낼 수 있는 최대 하중 (V/Vₛ)²'), 1.44, 1e-9) || near(ro('하중 배수 n (필요)'), 2, 1e-9) },
  { name: '실속이면 계획한 원(211.9 m)을 못 돈다 — 실제 반경 V²/(g·1.44·sin60°) = 294.4 m (자취로 잰 값)', set: { V: 60, phi: 60, Vs: 50 }, run: 3,
    check: ({ ro, near }) => near(ro('잰 선회 반경 (자취)'), 60 * 60 / (g * 1.44 * Math.sin(d2r(60))), .002) },
  { name: '실속이면 고도를 잃는다 — 아래로 g(1 − 1.44·cos60°) = 0.28 g, 5 초 뒤 ½·0.28g·5² = 34.3 m', set: { V: 60, phi: 60, Vs: 50 }, run: 5,
    check: ({ ro, near }) => near(ro('고도 변화'), -.5 * g * (1 - 1.44 * .5) * 25, .001) },
  { name: '실속이 아니면 고도 그대로 — V = 100, φ = 60°, Vₛ = 50 (최대 4 G ≥ 2 G), 10 초 뒤 0 m', set: { V: 100, phi: 60, Vs: 50 }, run: 10,
    check: ({ ro }) => Math.abs(ro('고도 변화')) < 1e-9 ? null : `고도가 ${ro('고도 변화')} m 변했다` },
  { name: '실속으로 600 m 떨어지면 멈춤 — t = √(2·600/(0.28g)) = 20.9 s, 30 초 뒤 끝', set: { V: 60, phi: 60, Vs: 50 }, run: 30,
    check: ({ st, ro, near }) => (st.done ? null : '끝나지 않았다') || near(ro('고도 변화'), -600, 1e-9) }
];
