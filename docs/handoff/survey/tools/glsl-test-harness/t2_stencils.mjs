import { start, stop, run } from './harness.mjs';
await start();
const N = 9, c = 4; // 9^3 volume, evaluate at centre voxel (4,4,4); coordinates centred so x,y,z in -4..4
function vol(fn) { const d = []; for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const v = fn(i - c, j - c, k - c); d.push(...(Array.isArray(v) ? v : [v, 0, 0, 0])); } return { name: 'uVol', w: N, h: N, d: N, data: d }; }
const tests3 = {
  'const 1': [(x, y, z) => 1, 0],
  'x^2+y^2+z^2 (lap=6)': [(x, y, z) => x * x + y * y + z * z, 6],
  'x^2 (lap=2)': [(x, y, z) => x * x, 2],
  'xy (lap=0)': [(x, y, z) => x * y, 0],
  'x^2-y^2 harmonic (lap=0)': [(x, y, z) => x * x - y * y, 0],
  'x^4 (lap=12x^2=0 at 0)': [(x, y, z) => x ** 4, 0],
  'x^2 y^2 (lap=0 at 0)': [(x, y, z) => x * x * y * y, 0],
  'x^2y^2z^2': [(x, y, z) => x * x * y * y * z * z, 0],
};
console.log('=== 3D Laplacians at centre voxel, h=1 (GLSL executed) ===');
console.log('test'.padEnd(28), 'exact', ' 7pt', ' 19pt', ' 27pt');
for (const [name, [fn, exact]] of Object.entries(tests3)) {
  const r = await run({ includes: ['@lib/simulation/stencils3d'], decl: 'uniform highp sampler3D uVol;', textures: [vol(fn)],
    body: `ivec3 ijk=ivec3(${c});fragColor=vec4(laplacian7Point(uVol,ijk),laplacian19Point(uVol,ijk),laplacian27Point(uVol,ijk),0.);` });
  if (!r.ok) { console.log(r.log); break; }
  console.log(name.padEnd(28), String(exact).padStart(5), r.data.slice(0, 3).map(v => v.toFixed(5)).join('  '));
}
// smooth test: f = sin(a x) sin(b y) sin(c z), eigenfunction: lap f = -(a^2+b^2+c^2) f ; evaluate at offset phase
{
  const a = 0.3, b = 0.2, g = 0.25, ph = 0.7;
  const fn = (x, y, z) => Math.sin(a * x + ph) * Math.sin(b * y + ph) * Math.sin(g * z + ph);
  const exact = -(a * a + b * b + g * g) * fn(0, 0, 0);
  const r = await run({ includes: ['@lib/simulation/stencils3d'], decl: 'uniform highp sampler3D uVol;', textures: [vol(fn)],
    body: `ivec3 ijk=ivec3(${c});fragColor=vec4(laplacian7Point(uVol,ijk),laplacian19Point(uVol,ijk),laplacian27Point(uVol,ijk),0.);` });
  console.log('sin eigenfunction'.padEnd(28), exact.toFixed(5), r.data.slice(0, 3).map(v => v.toFixed(5)).join('  '), ' f(0)=', fn(0, 0, 0).toFixed(5));
}
// gradient/div/curl 3D on F = (y z + 2x, x^2 - 3 z, x y) at centre -> use linear+bilinear fields (central diff exact for quadratics)
{
  const F = (x, y, z) => [2 * x + 3 * y - z, x * x - 3 * z + y, x * y + 5 * z, 0];
  // at (1,2,-1) relative centre: evaluate at voxel c+(1,2,-1)
  const r1 = await run({ includes: ['@lib/simulation/stencils3d'], decl: 'uniform highp sampler3D uVol;', textures: [vol(F)],
    body: `ivec3 ijk=ivec3(${c})+ivec3(1,2,-1);fragColor=vec4(curl3D(uVol,ijk),divergence3D(uVol,ijk));` });
  // curl = (dFz/dy - dFy/dz, dFx/dz - dFz/dx, dFy/dx - dFx/dy) = (x+3, -1 - y, 2x - 3) at (1,2,-1) = (4,-3,-1); div = 2+1+5 = 8
  console.log('curl3D,div3D got', r1.data.map(v => v.toFixed(4)).join(' '), ' expected 4 -3 -1 8');
  const r2 = await run({ includes: ['@lib/simulation/stencils3d'], decl: 'uniform highp sampler3D uVol;', textures: [vol((x, y, z) => x * x + 2 * y - 3 * z + x * y)],
    body: `ivec3 ijk=ivec3(${c})+ivec3(1,2,-1);fragColor=vec4(gradient3D(uVol,ijk),0.);` });
  console.log('gradient3D got', r2.data.slice(0, 3).map(v => v.toFixed(4)).join(' '), ' expected 4 3 -3');
  // periodic 7pt at corner voxel of f = x^2 pattern: check wrap. use f = cos(2 pi i / N)
  const fn = (x, y, z) => Math.cos(2 * Math.PI * (x + c) / N);
  const r3 = await run({ includes: ['@lib/simulation/stencils3d'], decl: 'uniform highp sampler3D uVol;', textures: [vol(fn)],
    body: `fragColor=vec4(laplacian7Point_periodic(uVol,ivec3(0,0,0),ivec3(${N})),laplacian7Point_periodic(uVol,ivec3(${N - 1},3,${N - 1}),ivec3(${N})),0.,0.);` });
  const lam = 2 * Math.cos(2 * Math.PI / N) - 2;
  console.log('7pt periodic at (0,0,0),(N-1,3,N-1):', r3.data.slice(0, 2).map(v => v.toFixed(5)).join(' '), ' expected', (lam * fn(-c, 0, 0)).toFixed(5), (lam * fn(N - 1 - c, 0, 0)).toFixed(5));
}

// ---------- 2D ----------
const W = 8, H = 6;
function tex2(fn, w = W, h = H) { const d = []; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const v = fn(i, j); d.push(...(Array.isArray(v) ? v : [v, v, v, v])); } return { name: 'uTex', w, h, data: d }; }
function grid(data, w, h, ch = 0, digits = 2) { let s = ''; for (let j = h - 1; j >= 0; j--) { s += '   j=' + j + ' | ' + Array.from({ length: w }, (_, i) => data[4 * (j * w + i) + ch].toFixed(digits).padStart(7)).join('') + '\n'; } return s; }
console.log('\n=== 2D interior Laplacians at (3,3), h=1 ===');
const tests2 = { 'const': [(x, y) => 1, 0], 'x^2+y^2 (4)': [(x, y) => x * x + y * y, 4], 'x^2 (2)': [(x, y) => x * x, 2], 'xy (0)': [(x, y) => x * y, 0], 'x^2y^2 at (3,3): 2(x^2+y^2)=36': [(x, y) => x * x * y * y, 36], 'x^4 at 3: 12x^2=108': [(x, y) => x ** 4, 108] };
for (const [name, [fn, exact]] of Object.entries(tests2)) {
  const r = await run({ includes: ['@lib/simulation/stencils'], decl: 'uniform sampler2D uTex;', textures: [tex2(fn)],
    body: `ivec2 ij=ivec2(3,3);fragColor=vec4(laplacian5Point(uTex,ij),laplacian9Point(uTex,ij),laplacian9Point_vec(uTex,ij).r,biharmonic(uTex,ij));` });
  console.log(name.padEnd(34), 'exact', String(exact).padStart(4), ' 5pt', r.data[0].toFixed(3), ' 9pt', r.data[1].toFixed(3), ' 9vec', r.data[2].toFixed(3), ' biharm', r.data[3].toFixed(3));
}
{ // biharmonic of x^4 + y^4 + x^2 y^2 : exact = 24+24+8 = 56
  const r = await run({ includes: ['@lib/stencils/biharmonic'], decl: 'uniform sampler2D uTex;', textures: [tex2((x, y) => x ** 4 + y ** 4 + x * x * y * y)], body: `fragColor=vec4(biharmonic(uTex,ivec2(3,3)));` });
  console.log('biharmonic(x^4+y^4+x^2y^2) =', r.data[0], ' exact 56');
  const F = (x, y) => [3 * x + x * y, y * y - 2 * x, 0, 0];
  const r2 = await run({ includes: ['@lib/simulation/stencils'], decl: 'uniform sampler2D uTex;', textures: [tex2(F)], body: `ivec2 ij=ivec2(3,2);fragColor=vec4(gradient(uTex,ij),divergence(uTex,ij),curl2D(uTex,ij));` });
  // grad of R channel: (3+y, x) = (5,3); div = 3+y+2y = 9; curl = dFy/dx - dFx/dy = -2 - x = -5
  console.log('gradient/div/curl2D got', r2.data.join(' '), ' expected 5 3 9 -5');
  const fn = (x, y) => Math.cos(2 * Math.PI * x / W) * Math.cos(2 * Math.PI * y / H);
  const r3 = await run({ includes: ['@lib/simulation/stencils'], decl: 'uniform sampler2D uTex;', w: W, h: H, textures: [tex2(fn)], body: `fragColor=laplacian9Point_periodic(uTex,px,ivec2(${W},${H}));` });
  // eigenvalue of 9pt stencil for mode (kx,ky): 0.5(2cx+2cy)+0.25*4cx cy-3 = cx+cy+cx*cy-3
  const cx = Math.cos(2 * Math.PI / W), cy = Math.cos(2 * Math.PI / H); const lam = cx + cy + cx * cy - 3;
  let maxerr = 0; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) maxerr = Math.max(maxerr, Math.abs(r3.data[4 * (j * W + i)] - lam * fn(i, j)));
  console.log('9pt periodic: max |L f - lambda f| over whole torus =', maxerr.toExponential(2), '(lambda=' + lam.toFixed(4) + ')');
}

console.log('\n=== laplacian9PointZeroBoundary over the WHOLE ' + W + 'x' + H + ' grid ===');
for (const [name, fn] of [['constant field u=1 (a Laplacian must give 0 in the interior; Dirichlet-0 ghost cells give negative values at the rim)', (x, y) => 1], ['u = x^2+y^2 (exact 4)', (x, y) => x * x + y * y]]) {
  const r = await run({ includes: ['@lib/stencils/laplacian'], decl: 'uniform sampler2D uTex;', w: W, h: H, textures: [tex2(fn)],
    body: `fragColor=vec4(laplacian9PointZeroBoundary(uTex,px,vec3(${W}.,${H}.,1.),0), laplacian9PointZeroBoundary(uTex,px,vec3(${W}.,${H}.,1.)).r, laplacian9Point(uTex,px),0.);` });
  console.log(name + '\n  scalar overload:'); console.log(grid(r.data, W, H, 0));
  let d = 0; for (let i = 0; i < W * H; i++) d = Math.max(d, Math.abs(r.data[4 * i] - r.data[4 * i + 1])); console.log('  max |scalar - vec4 overload| =', d);
  console.log('  plain laplacian9Point (texelFetch out of range) for comparison:'); console.log(grid(r.data, W, H, 2));
}
// which branch fires where? Put a delta-like probe: field = 1 everywhere; result identifies weights sum.
{
  const r = await run({ includes: ['@lib/stencils/laplacian'], decl: 'uniform sampler2D uTex;', w: W, h: H, textures: [tex2(() => 1)],
    body: `fragColor=vec4(laplacian9PointZeroBoundary(uTex,px,vec3(${W}.,${H}.,1.),0));` });
  const sums = {}; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const v = r.data[4 * (j * W + i)]; (sums[v] ||= []).push(`(${i},${j})`); }
  console.log('weight row-sums and the pixels where they occur:'); for (const [k, v] of Object.entries(sums)) console.log('  sum', k, ':', v.length, 'pixels', v.length < 15 ? v.join(' ') : '(all others)');
}
await stop();
