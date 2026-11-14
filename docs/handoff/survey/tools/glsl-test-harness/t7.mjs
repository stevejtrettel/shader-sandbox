import { start, stop, run } from './harness.mjs';
await start();
// simplex3d on the diagonal x=y=z versus a point 1e-4 away
let r = await run({ includes: ['@lib/noise/simplex3d'], w: 8, body: `float t=0.137+float(px.x)*0.211; vec3 p=vec3(t); fragColor=vec4(simplex3d(p), simplex3d(p+vec3(1e-4,0,-1e-4)), simplex3d(p+vec3(-1e-4,1e-4,0)), t);` });
console.log('simplex3d on diagonal p=(t,t,t) | p+(1e-4,0,-1e-4) | p+(-1e-4,1e-4,0)');
for (let i = 0; i < 8; i++) console.log('  t=' + r.px(i)[3].toFixed(3), r.px(i).slice(0, 3).map(v => v.toFixed(5)).join('  '));
// examples: how do projects sample simplex3d?
// boundary laplacian: does a wave demo keep row j=1 stable? eigen-analysis done in numpy.
// fluids: Jacobi pressure sign
r = await run({ includes: ['@lib/simulation/stencils'], decl: 'uniform sampler2D a;', body: 'fragColor=vec4(1.);' });
await stop();
