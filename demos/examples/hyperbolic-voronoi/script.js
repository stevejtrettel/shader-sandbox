const COUNT = 1000;

// Seeded PRNG (mulberry32) so the pattern is stable across reloads
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hslToRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

export function setup(engine) {
  const rand = mulberry32(42);

  // Distribute points on concentric hyperbolic rings.
  // Points per ring ~ sinh(R) (hyperbolic circumference), with jitter.
  const Rmax = 4.0;
  const dR = 0.2;
  const numRings = Math.ceil(Rmax / dR);

  // First pass: compute relative ring populations
  const ringAreas = [];
  let totalArea = 0;
  for (let j = 0; j < numRings; j++) {
    const R = (j + 0.5) * dR;
    const a = 2 * Math.PI * Math.sinh(R) * dR;
    ringAreas.push(a);
    totalArea += a;
  }

  // Second pass: assign point counts scaled to COUNT
  const ringCounts = ringAreas.map(a => Math.max(1, Math.round(a * COUNT / totalArea)));

  // Generate jittered points ring by ring
  const diskPoints = [];
  for (let j = 0; j < numRings; j++) {
    const R = (j + 0.5) * dR;
    const n = ringCounts[j];
    const angularOffset = j * 0.7;
    for (let k = 0; k < n && diskPoints.length < COUNT; k++) {
      const baseTheta = angularOffset + (k / n) * 2 * Math.PI;
      const theta = baseTheta + (rand() - 0.5) * (2 * Math.PI / n) * 0.5;
      const rr = Math.max(0.01, R + (rand() - 0.5) * dR * 0.6);
      const diskR = Math.tanh(rr / 2);
      diskPoints.push([diskR * Math.cos(theta), diskR * Math.sin(theta)]);
    }
  }

  // Pad if we ended up short
  while (diskPoints.length < COUNT) {
    const R = rand() * Rmax;
    const theta = rand() * Math.PI * 2;
    const diskR = Math.tanh(R / 2);
    diskPoints.push([diskR * Math.cos(theta), diskR * Math.sin(theta)]);
  }

  // Build point and color arrays — engine handles packing
  const pts = [];
  const cols = [];

  for (let i = 0; i < COUNT; i++) {
    const [dx, dy] = diskPoints[i];
    const r2 = dx * dx + dy * dy;
    const s = 1.0 - r2;
    pts.push([(2 * dx) / s, (2 * dy) / s, (1 + r2) / s]);

    const hue = ((i / COUNT) * 360 + rand() * 40) % 360;
    const [cr, cg, cb] = hslToRgb(hue, 0.6 + rand() * 0.3, 0.45 + rand() * 0.25);
    cols.push([cr, cg, cb, 1]);
  }

  engine.setArrayUniform('points', pts);
  engine.setArrayUniform('colors', cols);
}
