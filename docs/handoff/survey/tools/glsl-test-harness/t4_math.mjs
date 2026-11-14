import { start, stop, run } from './harness.mjs';
import fs from 'fs';
await start();
const f = (a, n = 4) => Array.from(a).map(v => v.toFixed(n)).join(', ');
const must = r => { if (!r.ok) throw new Error(r.log); return r; };

// ---------------- viridis ----------------
{
  const ref = JSON.parse(fs.readFileSync(new URL('./viridis_ref.json', import.meta.url)));
  const n = ref.t.length;
  const r = must(await run({ includes: ['@lib/color/palettes'], w: n, body: `float t=float(px.x)/${(n - 1).toFixed(1)};fragColor=vec4(paletteViridis(t),1.);` }));
  console.log('=== paletteViridis vs matplotlib viridis (GLSL executed) ===');
  let maxe = 0, sum = 0, lumNonMono = 0, prevL = -1, prevLref = -1;
  const lum = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  for (let i = 0; i < n; i++) {
    const g = r.px(i), m = ref.rgb[i]; const e = Math.hypot(g[0] - m[0], g[1] - m[1], g[2] - m[2]); maxe = Math.max(maxe, e); sum += e;
    if (i % 8 === 0) console.log(`  t=${ref.t[i].toFixed(3)}  lib=(${f(g.slice(0, 3), 3)})  mpl=(${f(m, 3)})  |diff|=${e.toFixed(3)}  lum lib=${lum(g).toFixed(3)} mpl=${lum(m).toFixed(3)}`);
    if (lum(g) < prevL) lumNonMono++; prevL = lum(g);
  }
  console.log(`  max RGB distance ${maxe.toFixed(3)}, mean ${(sum / n).toFixed(3)} (unit cube diagonal 1.732); lib luminance decreases on ${lumNonMono} of ${n - 1} intervals (viridis: 0)`);
  let mn = [9, 9, 9], mx = [-9, -9, -9]; for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], r.px(i)[k]); mx[k] = Math.max(mx[k], r.px(i)[k]); }
  console.log('  lib channel ranges min', f(mn, 3), ' max', f(mx, 3), ' (values outside [0,1] => clipped on display)');
  const r2 = must(await run({ includes: ['@lib/color/palettes'], w: 3, body: `float t=float(px.x)*0.5;fragColor=vec4(paletteHeat(t),1.);` }));
  console.log('  paletteHeat(0,0.5,1):', f(r2.data.filter((_, i) => i % 4 < 3), 3));
}

// ---------------- quaternion ----------------
console.log('\n=== quaternion.glsl (GLSL executed) ===');
{
  const Q = ['@lib/math/quaternion', '@lib/math/rotate'];
  const cases = [
    ['quatFromAxisAngle(z,0)                  [identity]', 'quatFromAxisAngle(vec3(0,0,1),0.0)'],
    ['quatMul(I,I), I=quatFromAxisAngle(z,0)', 'quatMul(quatFromAxisAngle(vec3(0,0,1),0.0),quatFromAxisAngle(vec3(0,0,1),0.0))'],
    ['quatMul(J,J), J=vec4(0,0,0,1) (xyzw identity)', 'quatMul(vec4(0,0,0,1),vec4(0,0,0,1))'],
    ['quatRotate(I, (1,2,3))         expect (1,2,3)', 'vec4(quatRotate(quatFromAxisAngle(vec3(0,0,1),0.0),vec3(1,2,3)),0)'],
    ['quatRotate(q(z,90deg),(1,0,0)) expect (0,1,0)', 'vec4(quatRotate(quatFromAxisAngle(vec3(0,0,1),PI/2.),vec3(1,0,0)),0)'],
    ['|quatRotate(q(z,90deg),(1,0,0))| expect 1', 'vec4(length(quatRotate(quatFromAxisAngle(vec3(0,0,1),PI/2.),vec3(1,0,0))))'],
    ['quatMul(q(x,90),q(y,90)) expect q=(.5,.5,.5,.5) [w,x,y,z]', 'quatMul(quatFromAxisAngle(vec3(1,0,0),PI/2.),quatFromAxisAngle(vec3(0,1,0),PI/2.))'],
    ['quatMul(q, quatInverse(q)), q=q(axis(1,2,2)/3, 1.0) expect identity', 'quatMul(quatFromAxisAngle(vec3(1,2,2)/3.,1.0),quatInverse(quatFromAxisAngle(vec3(1,2,2)/3.,1.0)))'],
    ['quatConjugate(vec4(1,2,3,4))', 'quatConjugate(vec4(1,2,3,4))'],
    ['quatToMat3(xyzw q(z,90)) * (1,0,0)  expect (0,1,0)', 'vec4(quatToMat3(vec4(0,0,sin(PI/4.),cos(PI/4.)))*vec3(1,0,0),0)'],
    ['quatToMat3(quatFromAxisAngle(z,90)) * (1,0,0)', 'vec4(quatToMat3(quatFromAxisAngle(vec3(0,0,1),PI/2.))*vec3(1,0,0),0)'],
    ['mat3ToQuat(quatToMat3(v)), v=xyzw normalize(1,2,3,4)=(.1826,.3651,.5477,.7303)', 'mat3ToQuat(quatToMat3(normalize(vec4(1,2,3,4))))'],
    ['mat3ToQuat(true Rz(90) built column-major) expect xyzw (0,0,.7071,.7071)', 'mat3ToQuat(mat3(0,1,0, -1,0,0, 0,0,1))'],
    ['quatSlerp(a,b,0.5) a=(1,0,0,0) b=(0,1,0,0)  expect (.7071,.7071,0,0)', 'quatSlerp(vec4(1,0,0,0),vec4(0,1,0,0),0.5)'],
    ['rotate2D(90deg)*(1,0)          CCW would be (0,1)', 'vec4(rotate2D(PI/2.)*vec2(1,0),0,0)'],
    ['rotateZ(90deg)*(1,0,0)         CCW would be (0,1,0)', 'vec4(rotateZ(PI/2.)*vec3(1,0,0),0)'],
    ['rotateX(90deg)*(0,1,0)         RH would be (0,0,1)', 'vec4(rotateX(PI/2.)*vec3(0,1,0),0)'],
    ['rotateY(90deg)*(0,0,1)         RH would be (1,0,0)', 'vec4(rotateY(PI/2.)*vec3(0,0,1),0)'],
    ['rotateAxis(z,90deg)*(1,0,0)    RH would be (0,1,0)', 'vec4(rotateAxis(vec3(0,0,1),PI/2.)*vec3(1,0,0),0)'],
    ['det(rotateAxis((1,2,3),0.7)) expect 1', 'vec4(determinant(rotateAxis(vec3(1,2,3),0.7)))'],
    ['rotateAxis(x,a)==rotateX(a)? max abs diff', 'vec4(length(rotateAxis(vec3(1,0,0),0.7)[1]-rotateX(0.7)[1])+length(rotateAxis(vec3(0,1,0),0.7)[0]-rotateY(0.7)[0])+length(rotateAxis(vec3(0,0,1),0.7)[0]-rotateZ(0.7)[0]))'],
  ];
  const r = must(await run({ includes: Q, w: cases.length, body: cases.map((c, i) => `if(px.x==${i}) fragColor=${c[1]};`).join('\n') }));
  cases.forEach((c, i) => console.log('  ' + c[0].padEnd(78), '-> (' + f(r.px(i)) + ')'));
}

// ---------------- easing ----------------
console.log('\n=== easing.glsl: f(0), f(1), jump at 0.5, f(1e-4), f(1-1e-4) ===');
{
  const names = fs.readFileSync('/home/user/webgl-demos/src/shaders/lib/math/easing.glsl', 'utf8').match(/float (ease\w+)\(/g).map(s => s.slice(6, -1));
  const r1 = must(await run({ includes: ['@lib/math/easing'], w: names.length, body: names.map((n, i) => `if(px.x==${i}) fragColor=vec4(${n}(0.0),${n}(1.0),${n}(0.5+1e-5)-${n}(0.5-1e-5),${n}(0.5));`).join('\n') }));
  const r2 = must(await run({ includes: ['@lib/math/easing'], w: names.length, body: names.map((n, i) => `if(px.x==${i}) fragColor=vec4(${n}(1e-4),${n}(1.0-1e-4),0.,0.);`).join('\n') }));
  let bad = 0;
  names.forEach((n, i) => { const a = r1.px(i), b = r2.px(i); const flag = Math.abs(a[0]) > 1e-3 || Math.abs(a[1] - 1) > 1e-3 || Math.abs(a[2]) > 1e-2 || Math.abs(b[0]) > 0.02 || Math.abs(b[1] - 1) > 0.02; if (flag) { bad++; console.log('  FLAG', n.padEnd(18), 'f(0)=' + a[0].toFixed(4), 'f(1)=' + a[1].toFixed(4), 'jump@.5=' + a[2].toFixed(4), 'f(1e-4)=' + b[0].toFixed(4), 'f(1-1e-4)=' + b[1].toFixed(4)); } });
  console.log(`  ${names.length} easings, ${bad} flagged; all others: f(0)=0, f(1)=1, continuous at 0.5, continuous at the endpoints`);
  const mids = names.filter(n => n.includes('InOut')).map(n => n + '=' + r1.px(names.indexOf(n))[3].toFixed(4)); console.log('  InOut midpoints f(0.5):', mids.join(' '));
}

// ---------------- colour ----------------
console.log('\n=== colour conversions ===');
{
  const S = 64;
  const r = must(await run({ includes: ['@lib/color/hsv', '@lib/color/spaces', '@lib/math/random'], w: S, h: S,
    body: `vec3 c=hash33(vec3(vec2(px),7.0)); vec3 a=hsv2rgb(rgb2hsv(c)); vec3 b=hsl2rgb(rgb2hsl(c));
           vec3 s=linearToSrgb(srgbToLinear(c));
           fragColor=vec4(length(a-c),length(b-c),length(s-c),0.);` }));
  let m = [0, 0, 0]; for (let i = 0; i < S * S; i++) for (let k = 0; k < 3; k++) m[k] = Math.max(m[k], r.data[4 * i + k]);
  console.log('  max roundtrip error over 4096 random colours: hsv', m[0].toExponential(2), ' hsl', m[1].toExponential(2), ' srgb(2.2)', m[2].toExponential(2));
  const pts = [['rgb2hsv(1,0,0)', 'rgb2hsv(vec3(1,0,0))', '0,1,1'], ['rgb2hsv(0,1,0)', 'rgb2hsv(vec3(0,1,0))', '.3333,1,1'], ['rgb2hsv(0,0,1)', 'rgb2hsv(vec3(0,0,1))', '.6667,1,1'], ['rgb2hsv(.2,.4,.6)', 'rgb2hsv(vec3(.2,.4,.6))', '.5833,.6667,.6'],
  ['rgb2hsl(.2,.4,.6)', 'rgb2hsl(vec3(.2,.4,.6))', '.5833,.5,.4'], ['hsl2rgb(0,1,.5)', 'hsl2rgb(vec3(0,1,.5))', '1,0,0'], ['hsv2rgb(1/3,1,1)', 'hsv2rgb(vec3(1./3.,1,1))', '0,1,0'],
  ['rotateHue(red, 2pi/3)', 'rotateHue(vec3(1,0,0),2.0943951)', '0,1,0'],
  ['srgbToLinear(0.5) [exact piecewise 0.21404]', 'srgbToLinear(vec3(0.5))', ''], ['srgbToLinear(0.04) [exact 0.003096]', 'srgbToLinear(vec3(0.04))', ''], ['linearToSrgb(0.001) [exact 0.01292]', 'linearToSrgb(vec3(0.001))', ''],
  ['luminance(0,1,0) [Rec709 linear: 0.7152]', 'vec3(luminance(vec3(0,1,0)))', ''],
  ['temperatureToRGB(6500)', 'temperatureToRGB(6500.)', 'Helland ~ (1, .996, .98)'], ['temperatureToRGB(6600) vs (6601)', 'vec3(temperatureToRGB(6600.).g, temperatureToRGB(6601.).g, temperatureToRGB(6601.).r)', 'continuity of g and r across 66'], ['temperatureToRGB(2000)', 'temperatureToRGB(2000.)', 'Helland ~ (1,.537,.054)'],
  ['blendSoftLight(.5,.5)', 'blendSoftLight(vec3(.5),vec3(.5))', '.5'], ['blendSoftLight(.25, .5-) vs (.25,.5+)', 'vec3(blendSoftLight(vec3(.25),vec3(.4999)).r, blendSoftLight(vec3(.25),vec3(.5001)).r,0.)', 'continuity'],
  ['blendOverlay(.5-,.3) vs (.5+,.3)', 'vec3(blendOverlay(vec3(.4999),vec3(.3)).r, blendOverlay(vec3(.5001),vec3(.3)).r,0.)', 'continuity']];
  const r2 = must(await run({ includes: ['@lib/color/hsv', '@lib/color/spaces', '@lib/color/blend'], w: pts.length, body: pts.map((c, i) => `if(px.x==${i}) fragColor=vec4(${c[1]},0.);`).join('\n') }));
  pts.forEach((c, i) => console.log('  ' + c[0].padEnd(46), '(' + f(r2.px(i).slice(0, 3), 5) + ')', c[2] ? '  expect ' + c[2] : ''));
}

// ---------------- common / interpolation ----------------
console.log('\n=== math/common, interpolation ===');
{
  const pts = [['smin(0.3,0.3,0.2) [IQ quadratic: 0.3-k/4=0.25]', 'smin(0.3,0.3,0.2)'], ['smin(0,1,0.2) [=0]', 'smin(0.,1.,0.2)'], ['smax(0.3,0.3,0.2)', 'smax(0.3,0.3,0.2)'],
  ['gain(0.5,3)', 'gain(0.5,3.)'], ['gain(0.25,2) [0.5*(0.5)^2=0.125]', 'gain(0.25,2.)'], ['bias(0.5,0.3) [Schlick: =b=0.3]', 'bias(0.5,0.3)'],
  ['impulse(k=4,x=0.25) [peak value 1 at x=1/k]', 'impulse(4.,0.25)'], ['impulse(k=4,x=4)  [comment says peak at k]', 'impulse(4.,4.)'],
  ['parabola(0.5,k=3) [peak at 0.5 for all k]', 'parabola(0.5,3.)'], ['parabola(3.0... x=k)', 'parabola(0.3,0.3)'],
  ['almostIdentity(0, .5, .1) [=n=0.1]', 'almostIdentity(0.,.5,.1)'], ['almostIdentity(.5-,.5,.1)', 'almostIdentity(.49999,.5,.1)'],
  ['modulo(-1,3) vs mod(-1,3)', 'modulo(-1.,3.)-mod(-1.,3.)'], ['expOut(1) [1-1/e, not 1]', 'expOut(1.)'], ['expIn(1) [e-1, not 1]', 'expIn(1.)'],
  ['smootherstep(0,1,.5)', 'smootherstep(0.,1.,.5)'], ['remap(5,0,10,-1,1)', 'remap(5.,0.,10.,-1.,1.)'], ['map(5,0,10,-1,1)', 'map(5.,0.,10.,-1.,1.)'],
  ['powerCurve(.5,2,1)', 'powerCurve(.5,2.,1.)'], ['powerCurve(1,2,1) / (0,2,1)', 'powerCurve(1.,2.,1.)+10.*powerCurve(0.,2.,1.)'], ['cubicPulse(0,1,0.5)', 'cubicPulse(0.,1.,.5)'], ['sCurve(.25)', 'sCurve(.25)']];
  const r = must(await run({ includes: ['@lib/math/common', '@lib/math/interpolation'], w: pts.length, body: pts.map((c, i) => `if(px.x==${i}) fragColor=vec4(${c[1]});`).join('\n') }));
  pts.forEach((c, i) => console.log('  ' + c[0].padEnd(48), r.px(i)[0].toFixed(5)));
}
await stop();
