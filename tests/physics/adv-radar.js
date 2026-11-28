/* 레이더 — 시뮬레이션 값을 교과서 공식으로 따로 비교한다 (시뮬레이션 코드를 쓰지 않는다).
   왕복 거리: R = c·Δt/2 → Δt = 2R/c,  c = 299,792,458 m/s (정의값)
   레이더 방정식(Skolnik): P_r = P_t·G²·λ²·σ / ((4π)³·R⁴),  λ = c/f, f = 3 GHz, G = 1000, 수신기 감도 P_min = 1e-14 W
   탐지 한계: R_max = (P_t·G²·λ²·σ / ((4π)³·P_min))^(1/4),  도플러 이동(왕복): f_d = 2v/λ = 2v·f/c
   손 계산: R = 60 km → Δt = 120,000 ÷ 299,792,458 s = 400.277 µs
            v = 100 m/s → f_d = 200 × 3e9 ÷ 299,792,458 = 2001.38 Hz = 2.00138 kHz
            P_t = 100 kW, σ = 2 m²: (4π)³ = 1984.40, λ² = 0.0099862 → P_t G² λ² σ/(4π)³ = 1e5 × 1e6 × 0.0099862 × 2 ÷ 1984.40 = 1.00648e6 W·m⁴
            R = 60 km → R⁴ = 1.296e19 m⁴ → P_r = 7.766e-14 W = 77.66 fW,  R_max = (1.00648e6 / 1e-14)^(1/4) = 100.16 km */
const c = 299792458, f = 3e9, G = 1000, Pmin = 1e-14;
const lam = c / f;
const K = (Pt, sig) => Pt * 1e3 * G * G * lam * lam * sig / Math.pow(4 * Math.PI, 3);
const PrfW = (R, sig, Pt) => K(Pt, sig) / Math.pow(R * 1e3, 4) * 1e15;
const Rmax = (sig, Pt) => Math.pow(K(Pt, sig) / Pmin, .25) / 1e3;

module.exports = [
  { name: '손 계산 — R = 60 km 왕복 시간 Δt = 2R/c = 400.28 µs', set: { R: 60, v: 100, sig: 2, Pt: 100 }, run: .1,
    check: ({ ro, near }) => near(ro('왕복 시간 Δt = 2R ⁄ c'), 400.277, .01) || near(ro('왕복 시간 Δt = 2R ⁄ c'), 2 * 60e3 / c * 1e6, .001) },
  { name: '손 계산 — v = 100 m/s, 3 GHz 도플러 이동 f_d = 2v/λ = 2.0014 kHz', set: { v: 100 }, run: .1,
    check: ({ ro, near }) => near(ro('도플러 이동 f_d'), 2.00138, .01) || near(ro('도플러 이동 f_d'), 2 * 100 * f / c / 1e3, .001) },
  { name: '레이더 방정식 — R = 60 km, σ = 2 m², 100 kW: P_r = 77.66 fW, 기준보다 8.90 dB', set: { R: 60, sig: 2, Pt: 100 }, run: .1,
    check: ({ ro, near }) => near(ro('돌아온 메아리 세기 P_r'), PrfW(60, 2, 100), .002) || near(ro('돌아온 메아리 세기 P_r'), 77.66, .01)
      || near(ro('메아리 ÷ 탐지 기준 (dB)'), 10 * Math.log10(PrfW(60, 2, 100) * 1e-15 / Pmin), .01) },
  { name: '탐지 한계 — 기본 R_max = 100.16 km, 출력 16배(1,600 kW)면 정확히 2배', set: { sig: 2, Pt: 100 }, run: .1,
    check: ({ ro, near }) => near(ro('탐지 가능한 최대 거리 R_max'), 100.16, .01) || near(ro('탐지 가능한 최대 거리 R_max'), Rmax(2, 100), .002) },
  { name: '출력 16배 → R_max 200.32 km (거리의 네제곱 법칙), 190 km 표적 탐지', set: { R: 190, sig: 2, Pt: 1600 }, run: .1,
    check: ({ ro, near }) => near(ro('탐지 가능한 최대 거리 R_max'), 2 * Rmax(2, 100), .002) || (ro('메아리 ÷ 탐지 기준 (dB)') > 0 ? null : '190 km 표적을 놓침') },
  { name: 'R⁴ 법칙 — 거리 2배(50 → 100 km)면 메아리는 1/16, 즉 −12.04 dB', set: { R: 100, sig: 2, Pt: 100 }, run: .1,
    check: ({ ro, near }) => near(ro('돌아온 메아리 세기 P_r'), PrfW(50, 2, 100) / 16, .002) || near(ro('메아리 ÷ 탐지 기준 (dB)'), 40 * Math.log10(Rmax(2, 100) / 100), .01, .005) },
  { name: '극단값 — R = 200 km, v = −300 m/s, σ = 0.1, 10 kW: Δt 1334.26 µs, f_d −6.004 kHz, −35.0 dB 로 놓침', set: { R: 200, v: -300, sig: .1, Pt: 10 }, run: 6,
    check: ({ ro, near }) => near(ro('왕복 시간 Δt = 2R ⁄ c'), 2 * 200e3 / c * 1e6, .001) || near(ro('도플러 이동 f_d'), -600 * f / c / 1e3, .001)
      || near(ro('메아리 ÷ 탐지 기준 (dB)'), 10 * Math.log10(PrfW(200, .1, 10) * 1e-15 / Pmin), .01) || near(ro('탐지 가능한 최대 거리 R_max'), Rmax(.1, 10), .002) },
  { name: '극단값 — R = 5 km, σ = 50, 2,000 kW: P_r = 8.05e8 fW, R_max 473.6 km', set: { R: 5, v: 300, sig: 50, Pt: 2000 }, run: .1,
    check: ({ ro, near }) => near(ro('돌아온 메아리 세기 P_r'), PrfW(5, 50, 2000), .002) || near(ro('탐지 가능한 최대 거리 R_max'), Rmax(50, 2000), .002) },
  { name: '전파 시계 — 화면 1초 = 실제 0.5 ms (1초 뒤 500 µs)', set: {}, run: 1,
    check: ({ ro, near }) => near(ro('신호 출발 뒤 시간 (화면 1초 = 실제 0.5 ms)'), 500, .01) },
  { name: '10초 진행 뒤에도 거리·왕복 시간·메아리 세기 그대로 (느린 화면 10초 = 실제 5 ms, 표적은 0.5 m 이동)', set: { R: 60, sig: 2, Pt: 100 }, run: 10,
    check: ({ ro, near }) => near(ro('왕복 시간 Δt = 2R ⁄ c'), 2 * 60e3 / c * 1e6, .001) || near(ro('돌아온 메아리 세기 P_r'), PrfW(60, 2, 100), .002) }
];
