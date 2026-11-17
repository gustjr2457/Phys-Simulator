/* 러더퍼드 산란 — 시뮬레이션 값을 교과서 공식으로 따로 비교한다 (시뮬레이션 코드를 쓰지 않는다).
   정면충돌 최근접 거리: 운동에너지가 전부 쿨롱 위치에너지가 되는 곳
     E = k·(ze)(Ze) / d   →   d = kZze²/E,   알파 입자 z = 2
   알려진 값: 5 MeV 알파 입자 + 금(Z=79) → 약 45.5 fm (교과서 표준 예제) */
const k = 8.9875517923e9, e = 1.602176634e-19;
const dFm = (Z, MeV) => k * Z * 2 * e * e / (MeV * 1e6 * e) * 1e15;

module.exports = [
  { name: '금박·5 MeV → d = k·79·2e²/E = 45.5 fm', set: { Z: 79, E: 5 }, run: .1,
    check: ({ ro, near }) => near(ro('가장 가까이 접근하는 거리 d_min'), dFm(79, 5), .002) || near(dFm(79, 5), 45.5, .005) },
  { name: '알루미늄(Z=13)·5 MeV → 7.5 fm (Z 에 비례)', set: { Z: 13, E: 5 }, run: .1,
    check: ({ ro, near }) => near(ro('가장 가까이 접근하는 거리 d_min'), dFm(13, 5), .002) },
  { name: '금박·9 MeV → 25.3 fm (E 에 반비례), 3 MeV → 75.8 fm', set: { Z: 79, E: 9 }, run: .1,
    check: ({ ro, near }) => near(ro('가장 가까이 접근하는 거리 d_min'), dFm(79, 9), .002) || near(dFm(79, 3) / dFm(79, 9), 3, 1e-9) },
  { name: '극단값 — 우라늄(Z=92)·3 MeV → 88.3 fm', set: { Z: 92, E: 3 }, run: .1,
    check: ({ ro, near }) => near(ro('가장 가까이 접근하는 거리 d_min'), dFm(92, 3), .002) }
];
