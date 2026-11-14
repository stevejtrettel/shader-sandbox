import { start, stop, run, LIB } from './harness.mjs';
import fs from 'fs'; import path from 'path';
const info = await start(); console.log('GL', JSON.stringify(info));
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : files.push(path.relative(LIB, p).replace(/\.glsl$/, '')); } })(LIB);
files.sort();
let bad = 0;
for (const f of files) {
  const pre = f === 'raymarching/implicit' ? 'float F(vec3 p){return length(p)-1.0;}' : '';
  const r = await run({ includes: ['@lib/' + f], pre, body: 'fragColor=vec4(1.0);' });
  if (!r.ok) { bad++; console.log('FAIL', f, '\n   ', r.log.trim().split('\n').slice(0, 4).join('\n    ')); }
  else console.log('ok  ', f);
}
console.log('compile failures:', bad, 'of', files.length);
// pairwise combos of interest
const combos = [
  ['@lib/stencils/laplacian', '@lib/simulation/stencils'],
  ['@lib/noise/curl', '@lib/stencils/curl'],
  ['@lib/stencils/curl', '@lib/noise/curl'],
  ['@lib/noise/simplex2d', '@lib/noise/simplex3d'],
  ['@lib/noise/perlin', '@lib/math/random'],
  ['@lib/math/common', '@lib/math/interpolation'],
  ['@lib/math/common', '@lib/noise/fbm'],
  ['@lib/math/common', '@lib/sdf/operations'],
  ['@lib/raymarching/core', '@lib/raymarching/implicit'],
  ['@lib/geometric/shapes', '@lib/sdf/primitives2d'],
  ['@lib/simulation/stencils', '@lib/stencils/gradient'],
  ['@lib/math/random', '@lib/noise/worley'],
  ['@lib/effects/dither', '@lib/math/random'],
  ['@lib/simulation/pde', '@lib/simulation/pde'],
];
for (const c of combos) {
  const r = await run({ includes: c, pre: 'float F(vec3 p){return length(p)-1.0;}', body: 'fragColor=vec4(1.0);' });
  console.log(r.ok ? 'ok  ' : 'FAIL', c.join(' + '), r.ok ? '' : '\n    ' + r.log.trim().split('\n').slice(0, 2).join('\n    '));
}
// does noise/curl + stencils/curl silently lose curl2D?
let r = await run({ includes: ['@lib/noise/curl', '@lib/stencils/curl'], decl: 'uniform sampler2D t;', body: 'fragColor=vec4(curl2D(t, px));' });
console.log('curl2D after noise/curl include:', r.ok ? 'ok' : r.log.trim().split('\n')[0]);
await stop();
