/* 표준 대기 — 시뮬레이션 값을 ISA 표와 교과서 공식으로 따로 비교한다.
   기대값은 시뮬레이션 코드를 쓰지 않는다. 표의 값은 ICAO 표준 대기(ISA, Doc 7488) 그대로:
     해면 101325 Pa · 288.15 K · 1.225 kg/m³ / 5 km 54019.9 Pa · 255.65 K · 0.73612 kg/m³
     11 km 22632.1 Pa · 216.65 K · 0.36392 kg/m³ / 20 km 5474.89 Pa · 216.65 K · 0.08803 kg/m³
   공식 검산: 대류권 p = p₀(1 − Lh/T₀)^(g₀M/(R*L)),  등온층 p = p₁·exp(−g₀M(h−h₁)/(R*T₁)) — 몰 단위로 따로 쓴다. */
const g0 = 9.80665, Rs = 8.31446, M = 0.0289644;            // 보편 기체상수·공기 몰질량으로 따로 계산
const ISA = { T0: 15, L: 6.5 };
module.exports = [
  { name: '해면(ISA 표): p = 1013.25 hPa, ρ = 1.225 kg/m³, T = 288.15 K', set: { h: 0, ...ISA }, run: .1,
    check: ({ ro, near }) => near(ro('기압 p'), 1013.25, .0005) || near(ro('공기 밀도 ρ'), 1.225, .002) || near(ro('기온 T (K)'), 288.15, .0001) },
  { name: '5 km(ISA 표): T = 255.65 K, p = 540.2 hPa, ρ = 0.7361 kg/m³', set: { h: 5, ...ISA }, run: .1,
    check: ({ ro, near }) => near(ro('기온 T (K)'), 255.65, .0001) || near(ro('기압 p'), 540.199, .002) || near(ro('공기 밀도 ρ'), .73612, .003) },
  { name: '11 km 대류권계면(ISA 표): T = 216.65 K, p = 226.32 hPa', set: { h: 11, ...ISA }, run: .1,
    check: ({ ro, near }) => near(ro('기온 T (K)'), 216.65, .0001) || near(ro('기압 p'), 226.321, .002) || near(ro('공기 밀도 ρ'), .36392, .003) },
  { name: '20 km 성층권(ISA 표): 기온 그대로 216.65 K, p = 54.75 hPa', set: { h: 20, ...ISA }, run: .1,
    check: ({ ro, near }) => near(ro('기온 T (K)'), 216.65, .0001) || near(ro('기압 p'), 54.7489, .003) || near(ro('공기 밀도 ρ'), .08803, .004) },
  { name: '풍선 부피 11 km: (p₀/p)(T/T₀) = (101325/22632.1)(216.65/288.15) = 3.366배', set: { h: 11, ...ISA }, run: .1,
    check: ({ ro, near }) => near(ro('풍선 부피 배율 V/V₀'), (101325 / 22632.1) * (216.65 / 288.15), .003) },
  { name: '공기의 절반이 발아래 — p = p₀/2 가 되는 높이 ≈ 5.47 km (공식을 h 에 대해 푼 값)', set: (() => {
      const h = (288.15 / .0065) * (1 - Math.pow(.5, Rs * .0065 / (g0 * M))) / 1000;
      return { h: Math.round(h * 10) / 10, ...ISA };
    })(), run: .1,
    check: ({ ro, P, near }) => {
      const exp = 101325 * Math.pow(1 - .0065 * P.h * 1000 / 288.15, g0 * M / (Rs * .0065));
      return near(ro('기압 p'), exp / 100, .002) || (Math.abs(ro('해면 대비 기압') - 50) < 1 ? null : `해면 대비 ${ro('해면 대비 기압')} % — 50 % 근처가 아니다`);
    } },
  { name: '극단값 — 땅 45 °C, L = 10, 20 km: 11 km 에서 208.15 K, 그 위로 등온', set: { h: 20, T0: 45, L: 10 }, run: .1,
    check: ({ ro, near }) => {
      const T0 = 318.15, T1 = T0 - 110, L = .01;
      const p1 = 101325 * Math.pow(T1 / T0, g0 * M / (Rs * L));
      const p2 = p1 * Math.exp(-g0 * M * 9000 / (Rs * T1));
      return near(ro('기온 T (K)'), T1, .0001) || near(ro('기압 p'), p2 / 100, .003);
    } },
  { name: '극단값 — L = 0(기온 일정): p = p₀·exp(−g₀M h/(R*T₀)), h = 8 km, 15 °C', set: { h: 8, T0: 15, L: 0 }, run: .1,
    check: ({ ro, near }) => near(ro('기압 p'), 101325 * Math.exp(-g0 * M * 8000 / (Rs * 288.15)) / 100, .002) || near(ro('기온 T (K)'), 288.15, .0001) },
  { name: '높이를 바꾸면 풍선이 그 높이로 옮겨 간다 (0 → 슬라이더 10 km, 6초 뒤)', set: { h: 10, ...ISA }, run: 6,
    check: ({ st, sim, P, near }) => {
      const s = sim.init(Object.assign({}, P, { h: 0 })); s.t = 0;
      for (let i = 0; i < 6 * 480; i++) { sim.step(s, P, 1 / 480); s.t += 1 / 480; }
      return near(s.z, 10, .002) || near(st.z, 10, .0001);
    } }
];
