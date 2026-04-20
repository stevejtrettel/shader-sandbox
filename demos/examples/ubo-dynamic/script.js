/**
 * Projective Reflection Group — script.js
 *
 * Demonstrates passing a collection of mat3 matrices to the shader via UBO.
 * Uses onUniformChange to recompute only when the 'd' slider moves.
 */

const MAX_MATRICES = 128;

// ─── Matrix helpers ──────────────────────────────────────────────────────────

function mat3Multiply(A, B) {
  return [
    A[0]*B[0] + A[3]*B[1] + A[6]*B[2],
    A[1]*B[0] + A[4]*B[1] + A[7]*B[2],
    A[2]*B[0] + A[5]*B[1] + A[8]*B[2],

    A[0]*B[3] + A[3]*B[4] + A[6]*B[5],
    A[1]*B[3] + A[4]*B[4] + A[7]*B[5],
    A[2]*B[3] + A[5]*B[4] + A[8]*B[5],

    A[0]*B[6] + A[3]*B[7] + A[6]*B[8],
    A[1]*B[6] + A[4]*B[7] + A[7]*B[8],
    A[2]*B[6] + A[5]*B[7] + A[8]*B[8],
  ];
}

const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1];

// ─── Generator matrices ─────────────────────────────────────────────────────

function makeGenerators(d) {
  const s = Math.sqrt(3);

  const M1 = [
     1,  0, 0,
     0, -1, 0,
     0,  0, 1,
  ];

  const M2 = [
    -0.5,  s/2, 0,
     s/2,  0.5, 0,
       0,    0, 1,
  ];

  const M3 = [
    1 + 1/(2 - 4*d) + 2/(d - 2),       (7*d - 2) / (2*s*(d - 2)),          d*(2 - 7*d) / (4 - 10*d + 4*d*d),
    s / (2 - 4*d),                       0.5,                                s*d / (4*d - 2),
    1/(1 - 2*d) + 1/(d - 2) + 1/d,      (2 + d*(3*d - 4)) / (s*d*(d - 2)),  -d*(1 + d) / (2 - 5*d + 2*d*d),
  ];

  return [M1, M2, M3];
}

// ─── Orbit enumeration ──────────────────────────────────────────────────────

function generateOrbit(generators) {
  const results = [IDENTITY];
  const queue = [];

  for (let g = 0; g < generators.length; g++) {
    results.push(generators[g]);
    queue.push({ matrix: generators[g], lastGenerator: g });
    if (results.length >= MAX_MATRICES) return results;
  }

  while (queue.length > 0 && results.length < MAX_MATRICES) {
    const { matrix, lastGenerator } = queue.shift();

    for (let g = 0; g < generators.length; g++) {
      if (g === lastGenerator) continue;

      const product = mat3Multiply(matrix, generators[g]);
      results.push(product);
      queue.push({ matrix: product, lastGenerator: g });

      if (results.length >= MAX_MATRICES) return results;
    }
  }

  return results;
}

// ─── Recompute and send ─────────────────────────────────────────────────────

function recompute(engine, d) {
  const generators = makeGenerators(d);
  const orbit = generateOrbit(generators);
  engine.setArrayUniform('matrices', orbit);
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function setup(engine) {
  // Compute initial orbit from slider default
  const d = engine.getUniformValue('d');
  recompute(engine, d);
}

export function onUniformChange(engine, name, value) {
  if (name === 'd') {
    recompute(engine, value);
  }
}
