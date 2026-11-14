import { start, stop, run } from './harness.mjs';
await start();
const W = 15, H = 15;
const phi = (i, j) => Math.sin(Math.PI * (i + 1) / (W + 1)) * Math.sin(Math.PI * (j + 1) / (H + 1));
const lam = 2 * Math.cos(Math.PI / (W + 1)) + 2 * Math.cos(Math.PI / (H + 1)) - 4; // eigenvalue of 5-pt Laplacian with zero ghost cells
const mk = (name, arr) => ({ name, w: W, h: H, data: Array.from({ length: W * H * 4 }, (_, n) => n % 4 === 0 ? arr[n >> 2] : 0) });
const c = 1.0, dx = 1.0, dt = 0.5;
async function step(fn, cur, prev, gamma) {
  const call = fn === 'wave' ? `waveEquationStep(uCur,uPrev,px,${c.toFixed(3)},${dt.toFixed(3)},${dx.toFixed(3)})` : `dampedWaveStep(uCur,uPrev,px,${c.toFixed(3)},${gamma.toFixed(5)},${dt.toFixed(3)},${dx.toFixed(3)})`;
  const r = await run({ includes: ['@lib/simulation/pde'], decl: 'uniform sampler2D uCur; uniform sampler2D uPrev;', w: W, h: H, textures: [mk('uCur', cur), mk('uPrev', prev)], body: `fragColor=vec4(${call});` });
  if (!r.ok) throw new Error(r.log);
  return Array.from({ length: W * H }, (_, n) => r.data[4 * n]);
}
const u0 = []; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) u0.push(phi(i, j));
const mid = (H >> 1) * W + (W >> 1);
// ---- single step on an eigenvector with u_prev = u_cur: amplification factor = 1 + s*lambda, s = effective c^2 dt^2/dx^2
const a1 = (await step('wave', u0, u0, 0))[mid] / u0[mid];
const a2 = (await step('damped', u0, u0, 0))[mid] / u0[mid];
console.log('lambda =', lam.toFixed(6), ' c^2dt^2/dx^2 =', c * c * dt * dt / dx / dx);
console.log('single step, waveEquationStep : factor', a1.toFixed(6), '=> effective c^2dt^2/dx^2 =', ((a1 - 1) / lam).toFixed(5));
console.log('single step, dampedWaveStep(g=0): factor', a2.toFixed(6), '=> effective c^2dt^2/dx^2 =', ((a2 - 1) / lam).toFixed(5));
// ---- multi-step: measure period and decay
async function simulate(fn, gamma, nsteps) {
  let prev = u0.slice(), cur = u0.slice(); const amp = [1];
  for (let n = 0; n < nsteps; n++) { const nx = await step(fn, cur, prev, gamma); prev = cur; cur = nx; amp.push(cur[mid] / u0[mid]); }
  return amp;
}
function period(amp) { // average spacing of downward zero crossings (linear interpolation)
  const z = []; for (let n = 1; n < amp.length; n++) if (amp[n - 1] > 0 && amp[n] <= 0) z.push((n - 1 + amp[n - 1] / (amp[n - 1] - amp[n])) * dt);
  return (z[z.length - 1] - z[0]) / (z.length - 1);
}
const NS = 400;
const wExact = c * Math.sqrt(-lam) / dx; // continuous-in-time frequency of the semi-discrete mode
const wLeap = Math.acos(1 + c * c * dt * dt * lam / (2 * dx * dx)) / dt; // exact leapfrog frequency
const A = await simulate('wave', 0, NS), B = await simulate('damped', 0, NS);
console.log(`\nperiod over ${NS} steps:  semi-discrete 2pi/(c sqrt(-lambda)) = ${(2 * Math.PI / wExact).toFixed(4)}, leapfrog-exact = ${(2 * Math.PI / wLeap).toFixed(4)}`);
console.log('  waveEquationStep  measured period', period(A).toFixed(4));
console.log('  dampedWaveStep g=0 measured period', period(B).toFixed(4), ' ratio to wave step =', (period(B) / period(A)).toFixed(4), ' (sqrt2 =', Math.SQRT2.toFixed(4) + ')');
// damping: envelope ~ exp(-rate t). For u_tt + g u_t = c^2 Lap u, rate = g/2.
const g = 0.05; const D = await simulate('damped', g, NS);
const peaks = []; for (let n = 1; n < D.length - 1; n++) if (D[n] > D[n - 1] && D[n] >= D[n + 1] && D[n] > 0) peaks.push([n * dt, D[n]]);
const rate = -Math.log(peaks[peaks.length - 1][1] / peaks[0][1]) / (peaks[peaks.length - 1][0] - peaks[0][0]);
console.log(`damping gamma=${g}: measured envelope decay rate ${rate.toFixed(5)}  ; intended PDE gives gamma/2 = ${(g / 2).toFixed(5)} ; code's formula predicts gamma/4 = ${(g / 4).toFixed(5)}`);
console.log('  measured period with damping', period(D).toFixed(4));
// heat step: one step on eigenvector, factor should be 1 + alpha dt lambda / dx^2
{
  const r = await run({ includes: ['@lib/simulation/pde'], decl: 'uniform sampler2D uCur;', w: W, h: H, textures: [mk('uCur', u0)], body: `fragColor=vec4(heatEquationStep(uCur,px,0.3,0.2,0.5));` });
  console.log('\nheatEquationStep factor', (r.data[4 * mid] / u0[mid]).toFixed(6), ' expected', (1 + 0.3 * 0.2 * lam / 0.25).toFixed(6));
}
await stop();
