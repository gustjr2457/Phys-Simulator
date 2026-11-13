/* 원궤도 — v = √(GM/r), T = 2πr/v, 탈출 속도 = √2 · v.  GM(지구) = 3.986004418e14 m³/s², R = 6371 km */
const GM = 3.986004418e14, R = 6371e3;
const v = h => Math.sqrt(GM / (R + h * 1e3));
module.exports = [
  { name: '원궤도 속도 √(GM/r) (h=500 km)', set: { h: 500, vr: 1 }, run: .5,
    check: ({ ro, near }) => near(ro('이 높이의 원궤도 속도'), v(500) / 1e3, .002) },
  { name: '공전 주기 2πr/v (h=500 km, 분)', set: { h: 500, vr: 1 }, run: .5,
    check: ({ ro, near }) => near(ro('공전 주기 T'), 2 * Math.PI * (R + 500e3) / v(500) / 60, .003) },
  { name: '탈출 속도 = √2 × 원궤도 속도 (h=2000 km)', set: { h: 2000, vr: 1 }, run: .5,
    check: ({ ro, near }) => near(ro('탈출 속도'), Math.SQRT2 * v(2000) / 1e3, .002) },
  { name: 'k = 1 이면 이심률 ≈ 0 (원)', set: { h: 800, vr: 1 }, run: .5,
    check: ({ ro }) => ro('이심률 e') < 1e-3 ? null : `이심률 ${ro('이심률 e')}` }
];
