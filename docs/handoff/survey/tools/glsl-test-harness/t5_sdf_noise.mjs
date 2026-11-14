import { start, stop, run } from './harness.mjs';
await start();
const must = r => { if (!r.ok) throw new Error(r.log); return r; };
const S = 96;
// ---- generic exactness test for a signed distance function d:
//  (i) eikonal |grad d| = 1 ; (ii) closest-point: d(p - d(p) grad d(p)) = 0. A mere bound fails (ii).
async function sdfTest(dim, name, expr, inc) {
  const body = dim === 2 ? `
    vec2 p = (hash22(vec2(px)+3.7)*2.0-1.0)*1.5; const float e=1e-3;
    #define D(p) (${expr})
    float d=D(p); vec2 g=vec2(D(p+vec2(e,0))-D(p-vec2(e,0)), D(p+vec2(0,e))-D(p-vec2(0,e)))/(2.*e);
    vec2 q=p-d*g; float dq=D(q);
    fragColor=vec4(d,length(g),dq,0.);` : `
    vec3 p = (hash33(vec3(vec2(px),1.3))*2.0-1.0)*1.5; const float e=1e-3; vec2 k=vec2(e,0);
    #define D(p) (${expr})
    float d=D(p); vec3 g=vec3(D(p+k.xyy)-D(p-k.xyy), D(p+k.yxy)-D(p-k.yxy), D(p+k.yyx)-D(p-k.yyx))/(2.*e);
    vec3 q=p-d*g; float dq=D(q);
    fragColor=vec4(d,length(g),dq,0.);`;
  const r = must(await run({ includes: ['@lib/math/random', inc], w: S, h: S, body }));
  let n = 0, eikBad = 0, cpBadOut = 0, cpBadIn = 0, nOut = 0, nIn = 0, maxOut = 0, maxIn = 0, neg = 0;
  for (let i = 0; i < S * S; i++) {
    const d = r.data[4 * i], g = r.data[4 * i + 1], dq = r.data[4 * i + 2]; n++; if (d < 0) neg++;
    const smooth = Math.abs(g - 1) < 0.02; if (!smooth) eikBad++;
    if (!smooth) continue; // skip medial-axis points where the gradient is not defined
    if (d > 0) { nOut++; if (Math.abs(dq) > 0.01) cpBadOut++; maxOut = Math.max(maxOut, Math.abs(dq)); }
    else { nIn++; if (Math.abs(dq) > 0.01) cpBadIn++; maxIn = Math.max(maxIn, Math.abs(dq)); }
  }
  console.log(`  ${name.padEnd(44)} inside ${(100 * neg / n).toFixed(0).padStart(3)}%  |grad|!=1: ${(100 * eikBad / n).toFixed(1).padStart(5)}%  closest-pt fail: outside ${(100 * cpBadOut / Math.max(nOut, 1)).toFixed(1).padStart(5)}% (max ${maxOut.toFixed(3)})  inside ${(100 * cpBadIn / Math.max(nIn, 1)).toFixed(1).padStart(5)}% (max ${maxIn.toFixed(3)})`);
}
console.log('=== SDF exactness (GLSL executed, 9216 random points in [-1.5,1.5]^n) ===');
const P2 = '@lib/sdf/primitives2d', P3 = '@lib/sdf/primitives3d';
for (const [n, e] of [['sdCircle', 'sdCircle(p,0.7)'], ['sdBox2D', 'sdBox2D(p,vec2(0.6,0.4))'], ['sdRoundedBox2D', 'sdRoundedBox2D(p,vec2(0.6,0.4),0.15)'], ['sdSegment (unsigned)', 'sdSegment(p,vec2(-.5,-.2),vec2(.4,.3))'],
['sdEquilateralTriangle', 'sdEquilateralTriangle(p,0.6)'], ['sdHexagon', 'sdHexagon(p,0.6)'], ['sdPentagon', 'sdPentagon(p,0.6)'], ['sdPie', 'sdPie(p,vec2(sin(0.7),cos(0.7)),0.8)'], ['sdArc', 'sdArc(p,vec2(sin(0.9),cos(0.9)),0.7,0.1)'], ['sdVesica', 'sdVesica(p,0.8,0.3)']]) await sdfTest(2, n, e, P2);
for (const [n, e] of [['sdSphere', 'sdSphere(p,0.7)'], ['sdBox', 'sdBox(p,vec3(.5,.3,.4))'], ['sdRoundBox', 'sdRoundBox(p,vec3(.5,.3,.4),0.1)'], ['sdTorus', 'sdTorus(p,vec2(.7,.2))'], ['sdCylinder', 'sdCylinder(p,.5,.3)'], ['sdCylinderInfinite', 'sdCylinderInfinite(p,vec3(.1,.2,.4))'],
['sdCone (c=(sin,cos) 0.5 rad, h=.8)', 'sdCone(p,vec2(sin(.5),cos(.5)),0.8)'], ['sdPlane', 'sdPlane(p,normalize(vec3(1,2,3)),0.2)'], ['sdCapsule', 'sdCapsule(p,vec3(-.4,0,0),vec3(.3,.4,.1),0.2)'], ['sdTriPrism', 'sdTriPrism(p,vec2(.5,.3))'], ['sdHexPrism', 'sdHexPrism(p,vec2(.5,.3))'], ['sdOctahedron', 'sdOctahedron(p,.7)']]) await sdfTest(3, n, e, P3);
// polygons against brute force distance
{
  const segd = (p, a, b) => { const pa = [p[0] - a[0], p[1] - a[1]], ba = [b[0] - a[0], b[1] - a[1]]; const h = Math.max(0, Math.min(1, (pa[0] * ba[0] + pa[1] * ba[1]) / (ba[0] ** 2 + ba[1] ** 2))); return Math.hypot(pa[0] - ba[0] * h, pa[1] - ba[1] * h); };
  const inside = (p, v) => { let c = false; for (let i = 0, j = v.length - 1; i < v.length; j = i++) if ((v[i][1] > p[1]) !== (v[j][1] > p[1]) && p[0] < (v[j][0] - v[i][0]) * (p[1] - v[i][1]) / (v[j][1] - v[i][1]) + v[i][0]) c = !c; return c; };
  const sd = (p, v) => { let d = 1e9; for (let i = 0; i < v.length; i++) d = Math.min(d, segd(p, v[i], v[(i + 1) % v.length])); return inside(p, v) ? -d : d; };
  const r0 = 0.6, k = Math.sqrt(3);
  const polys = { 'sdBox2D(p,vec2(0.6,0.4))': [[-.6, -.4], [.6, -.4], [.6, .4], [-.6, .4]], 'sdEquilateralTriangle(p,0.6)': [[-r0, -r0 / k], [r0, -r0 / k], [0, 2 * r0 / k]],
    'sdHexagon(p,0.6)': Array.from({ length: 6 }, (_, i) => [2 * r0 / k * Math.cos(i * Math.PI / 3), 2 * r0 / k * Math.sin(i * Math.PI / 3)]),
    'sdPentagon(p,0.6)': Array.from({ length: 5 }, (_, i) => { const a = (54 + 72 * i) * Math.PI / 180, R = r0 / Math.cos(Math.PI / 5); return [R * Math.cos(a), R * Math.sin(a)]; }) };
  for (const [expr, v] of Object.entries(polys)) {
    const r = must(await run({ includes: [P2], w: S, h: S, body: `vec2 p=(vec2(px)+0.5)/${S}.0*3.0-1.5; fragColor=vec4(${expr},p,0.);` }));
    let m = 0; for (let i = 0; i < S * S; i++) m = Math.max(m, Math.abs(r.data[4 * i] - sd([r.data[4 * i + 1], r.data[4 * i + 2]], v)));
    console.log(`  brute-force polygon check ${expr.padEnd(32)} max |lib - exact| = ${m.toExponential(2)}`);
  }
}
// operations
{
  const pts = [['opRevolution(p=(1,2,3), sdf2d=0.123, off=.5) returns its input', 'opRevolution(vec3(1,2,3),0.123,0.5)'], ['opSmoothUnion(.3,.3,.2) [=.3-k/4=.25]', 'opSmoothUnion(.3,.3,.2)'], ['opSmoothUnion(0,1,.2)', 'opSmoothUnion(0.,1.,.2)'], ['opSmoothIntersection(.3,.3,.2)', 'opSmoothIntersection(.3,.3,.2)'], ['opSmoothSubtraction(-.3,.3,.2) [max(.3,.3)+k/4]', 'opSmoothSubtraction(-.3,.3,.2)'], ['opSubtraction(d1=-1,d2=2) = max(-d1,d2): subtracts d1 FROM d2', 'opSubtraction(-1.,2.)'], ['opExtrusion(p.z=2,sdf2d=-1,h=.5)', 'opExtrusion(vec3(0,0,2),-1.,.5)']];
  const r = must(await run({ includes: ['@lib/sdf/operations'], w: pts.length, body: pts.map((c, i) => `if(px.x==${i}) fragColor=vec4(${c[1]});`).join('\n') }));
  pts.forEach((c, i) => console.log('  ' + c[0].padEnd(66), r.px(i)[0].toFixed(5)));
}

// ---------------- noise ----------------
console.log('\n=== noise (GLSL executed, 256x256 samples) ===');
const N = 256;
async function stats(label, inc, expr, pdef) {
  const r = must(await run({ includes: inc, w: N, h: N, body: `${pdef}\nfragColor=vec4(${expr});` }));
  const ch = k => { let mn = 1e9, mx = -1e9, s = 0, s2 = 0; for (let i = 0; i < N * N; i++) { const v = r.data[4 * i + k]; mn = Math.min(mn, v); mx = Math.max(mx, v); s += v; s2 += v * v; } const m = s / (N * N); return `min ${mn.toFixed(4)} max ${mx.toFixed(4)} mean ${m.toFixed(4)} sd ${Math.sqrt(s2 / (N * N) - m * m).toFixed(4)}`; };
  console.log('  ' + label.padEnd(30), ch(0)); return r;
}
const P2D = 'vec2 p=(vec2(px)+hash22(vec2(px)))*0.37;', P3D = 'vec3 p=vec3((vec2(px)+hash22(vec2(px)))*0.37, hash12(vec2(px))*50.0);';
await stats('simplex2d', ['@lib/math/random', '@lib/noise/simplex2d'], 'simplex2d(p)', P2D);
await stats('simplex3d', ['@lib/math/random', '@lib/noise/simplex3d'], 'simplex3d(p)', P3D);
await stats('perlin2d  (claims [-1,1])', ['@lib/math/random', '@lib/noise/perlin'], 'perlin2d(p)', P2D);
await stats('perlin3d  (claims [-1,1])', ['@lib/math/random', '@lib/noise/perlin'], 'perlin3d(p)', P3D);
await stats('fbm2d(p,5)', ['@lib/math/random', '@lib/noise/fbm'], 'fbm2d(p,5)', P2D);
await stats('worley2d', ['@lib/math/random', '@lib/noise/worley'], 'worley2d(p)', P2D);
for (const h of ['hash11(float(px.x)+float(px.y)*256.)', 'hash12(vec2(px))', 'hash13(vec3(vec2(px),5.))', 'hash22(vec2(px)).y', 'hash33(vec3(vec2(px),5.)).z', 'random(vec2(px))', 'random(vec2(px)/256.)', 'random2(vec2(px)).x', 'random3(vec3(vec2(px),1.)).z'])
  await stats(h.padEnd(30) + ' (uniform: mean .5 sd .2887)', ['@lib/math/random'], h, '');
// simplex3d continuity: max |n(p+delta)-n(p)| for tiny delta. A C0 function with |grad|<~5 gives <~5e-5.
for (const [nm, inc, ex, pd] of [['simplex3d', '@lib/noise/simplex3d', 'simplex3d', P3D], ['simplex2d', '@lib/noise/simplex2d', 'simplex2d', P2D], ['perlin3d', '@lib/noise/perlin', 'perlin3d', P3D]]) {
  const dl = nm === 'simplex2d' ? 'vec2(1e-5,0.7e-5)' : 'vec3(1e-5,0.7e-5,-0.4e-5)';
  const r = must(await run({ includes: ['@lib/math/random', inc], w: N, h: N, body: `${pd}\nfragColor=vec4(abs(${ex}(p+${dl})-${ex}(p)));` }));
  const v = Array.from({ length: N * N }, (_, i) => r.data[4 * i]).sort((a, b) => b - a);
  console.log(`  ${nm} |n(p+1e-5)-n(p)|: max ${v[0].toExponential(2)}, #samples > 3e-4: ${v.filter(x => x > 3e-4).length} of ${N * N}; top5 ${v.slice(0, 5).map(x => x.toExponential(1)).join(' ')}`);
}
// perlin2d lattice gradients: g(i,j) should be random; measure angle differences between neighbours
{
  const r = must(await run({ includes: ['@lib/noise/perlin'], w: 8, h: 8, body: `vec2 p=vec2(px)+vec2(3.,5.); const float e=1e-3; vec2 g=vec2(perlin2d(p+vec2(e,0))-perlin2d(p-vec2(e,0)),perlin2d(p+vec2(0,e))-perlin2d(p-vec2(0,e)))/(2.*e); fragColor=vec4(g,atan(g.y,g.x),length(g));` }));
  const ang = (i, j) => r.data[4 * (j * 8 + i) + 2]; const wrap = a => { a = a % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a; };
  const dxs = [], dys = []; for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) { dxs.push(wrap(ang(i + 1, j) - ang(i, j))); dys.push(wrap(ang(i, j + 1) - ang(i, j))); }
  const rng = a => `${Math.min(...a).toFixed(3)}..${Math.max(...a).toFixed(3)}`;
  console.log(`  perlin2d lattice-gradient angle increments: horizontal ${rng(dxs)} rad (12.9898 mod 2pi = ${wrap(12.9898).toFixed(3)}), vertical ${rng(dys)} rad (78.233 mod 2pi = ${wrap(78.233).toFixed(3)})  => gradients are a plane wave, not random`);
}
// curl noise divergence (central differences, h=0.01) relative to |J|
for (const [nm, ex, dim] of [['curl2d', 'curl2d', 2], ['curl3d', 'curl3d', 3], ['curl3dCustom(.,31.4)', 'CC', 3]]) {
  const body = dim === 2 ? `${P2D} const float h=0.01; float div=(curl2d(p+vec2(h,0)).x-curl2d(p-vec2(h,0)).x+curl2d(p+vec2(0,h)).y-curl2d(p-vec2(0,h)).y)/(2.*h); float sh=(curl2d(p+vec2(0,h)).x-curl2d(p-vec2(0,h)).x)/(2.*h); fragColor=vec4(abs(div),abs(sh),length(curl2d(p)),0.);`
    : `#define CC(q) curl3dCustom(q,31.4)\n${P3D} const float h=0.01; vec2 k=vec2(h,0); float div=(${ex}(p+k.xyy).x-${ex}(p-k.xyy).x+${ex}(p+k.yxy).y-${ex}(p-k.yxy).y+${ex}(p+k.yyx).z-${ex}(p-k.yyx).z)/(2.*h); float sh=(${ex}(p+k.yxy).x-${ex}(p-k.yxy).x)/(2.*h); fragColor=vec4(abs(div),abs(sh),length(${ex}(p)),dot(${ex}(p),vec3(1.))/length(${ex}(p)));`;
  const M = 64; const r = must(await run({ includes: ['@lib/math/random', '@lib/noise/curl'], w: M, h: M, body }));
  let d = 0, s = 0, l0 = 1e9, l1 = 0, dp = 0; for (let i = 0; i < M * M; i++) { d += r.data[4 * i]; s += r.data[4 * i + 1]; l0 = Math.min(l0, r.data[4 * i + 2]); l1 = Math.max(l1, r.data[4 * i + 2]); dp = Math.max(dp, Math.abs(r.data[4 * i + 3])); }
  console.log(`  ${nm.padEnd(22)} mean|div| ${(d / M / M).toFixed(4)}  mean|dvx/dy| ${(s / M / M).toFixed(4)}  ratio ${(d / s).toFixed(4)}   |v| in [${l0.toFixed(3)}, ${l1.toFixed(3)}]` + (dim === 3 ? `  max |v.(1,1,1)|/|v| = ${dp.toExponential(1)}` : ''));
}
// worley: F1/F2 vs 5x5 unclamped reference
{
  const body = `${P2D} vec2 i=floor(p), f=fract(p); float a=1e9,b=1e9; for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){vec2 n=vec2(float(x),float(y)); float d=length(n+hash2_worley(i+n)-f); if(d<a){b=a;a=d;}else if(d<b){b=d;}}
   vec2 w=worley2d_F1F2(p); fragColor=vec4(abs(worley2d(p)-a),abs(w.x-a),abs(w.y-b),b);`;
  const r = must(await run({ includes: ['@lib/math/random', '@lib/noise/worley'], w: N, h: N, body }));
  let c = [0, 0, 0], m = [0, 0, 0], b1 = 0; for (let i = 0; i < N * N; i++) { for (let k = 0; k < 3; k++) { if (r.data[4 * i + k] > 1e-5) c[k]++; m[k] = Math.max(m[k], r.data[4 * i + k]); } if (r.data[4 * i + 3] > 1) b1++; }
  console.log(`  worley2d vs 5x5 reference: F1 wrong ${(100 * c[0] / N / N).toFixed(3)}% (max err ${m[0].toFixed(3)}); F1F2.x wrong ${(100 * c[1] / N / N).toFixed(3)}%; F2 wrong ${(100 * c[2] / N / N).toFixed(2)}% (max err ${m[2].toFixed(3)}); true F2>1 in ${(100 * b1 / N / N).toFixed(2)}% of samples`);
}
// implicit raymarcher on unit sphere: hit distance from (0,0,3) along -z = 2; normal = p
{
  const r = must(await run({ pre: 'float F(vec3 p){return dot(p,p)-1.0;}', includes: ['@lib/raymarching/implicit'], w: 4,
    body: `vec3 ro=vec3(0.2,0.1,3.), rd=vec3(0,0,-1); float t=raymarchImplicit(ro,rd,10.,200,1e-4); float tb=raymarchImplicitBounded(ro,rd,vec3(-1.5),vec3(1.5),200,1e-4); vec3 n=calcNormal(ro+rd*t);
     vec3 o,d; setupCamera(o,d,vec2(0.3,0.0),3.0,0.0,0.0); vec3 o2,d2; setupCamera(o2,d2,vec2(0.0,0.3),3.0,0.0,0.0);
     if(px.x==0) fragColor=vec4(t,tb,3.-sqrt(1.-0.05),0.); else if(px.x==1) fragColor=vec4(n-(ro+rd*t),0.); else if(px.x==2) fragColor=vec4(o,0.); else fragColor=vec4(d.z, d2.y, d.x, d.y);` }));
  console.log('\n=== raymarching/implicit ===\n  hit t (unbounded, bounded, exact):', r.px(0).slice(0, 3).map(v => v.toFixed(5)).join(' '), ' normal error:', r.px(1).slice(0, 3).map(v => v.toExponential(1)).join(' '));
  console.log('  setupCamera(rotY=0,rotX=0,zoom=3): ro =', r.px(2).slice(0, 3).join(','), '; screen +x maps to world dz =', r.px(3)[0].toFixed(3), '(dx,dy=', r.px(3)[2].toFixed(3), r.px(3)[3].toFixed(3), '); screen +y -> world dy =', r.px(3)[1].toFixed(3));
}
await stop();
