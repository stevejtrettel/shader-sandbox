import { start, stop, run } from './harness.mjs';
await start();
const N = 512;
for (const [nm, kern] of [['lib simplex3d (0.6 kernel, x42)', null]]) {
  for (const [scale, delta] of [[4, 4e-6], [64, 6e-5], [0.5, 1e-6]]) {
    const r = await run({ includes: ['@lib/math/random', '@lib/noise/simplex3d'], w: N, h: N,
      body: `vec3 p=hash33(vec3(vec2(px),2.))*${scale.toFixed(2)}; vec3 dl=normalize(hash33(vec3(vec2(px),9.))-0.5)*${delta.toExponential(2)}; float a=simplex3d(p), b=simplex3d(p+dl); fragColor=vec4(abs(a-b),p);` });
    if (!r.ok) { console.log(r.log); break; }
    const v = []; for (let i = 0; i < N * N; i++) v.push([r.data[4 * i], r.data.slice(4 * i + 1, 4 * i + 4)]);
    v.sort((a, b) => b[0] - a[0]);
    const cnt = t => v.filter(x => x[0] > t).length;
    console.log(`${nm} p in [0,${scale})^3 delta=${delta}: max jump ${v[0][0].toExponential(2)}; #>1e-3: ${cnt(1e-3)}, #>2e-2: ${cnt(2e-2)} of ${N * N}; smooth-slope bound ~ ${(8 * delta).toExponential(1)}`);
    console.log('   top jumps:', v.slice(0, 6).map(x => x[0].toExponential(2)).join(' '), ' at p=', v[0][1].map(x => x.toFixed(5)).join(','));
  }
}
// expected truncation jump of the 0.6 kernel: a corner's contribution is cut when the point leaves the simplex.
// min squared distance from a simplex vertex to its opposite face in the 3D simplex lattice is 0.5 (A3* lattice with this scaling) -> (0.6-0.5)^4*42*|g.x| <= 42e-4*0.71
console.log('theoretical max truncation jump for 0.6 kernel ~', (42 * 1e-4 * Math.sqrt(0.5)).toExponential(2));
await stop();
