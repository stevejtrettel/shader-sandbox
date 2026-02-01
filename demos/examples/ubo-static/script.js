/**
 * Projective Reflection Group — static UBO example
 *
 * Demonstrates computing matrices ONCE at startup via setup(),
 * rather than recomputing every frame via onFrame().
 *
 * The parameter d is hardcoded here since there's no slider to change it.
 * The matrices are sent to the GPU once and never updated.
 */

const MAX_MATRICES = 128;
const D = 0.89; // fixed parameter — change this to get a different group

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

// ─── Pack ────────────────────────────────────────────────────────────────────

function packMat3Array(matrices) {
  const data = new Float32Array(matrices.length * 9);
  for (let i = 0; i < matrices.length; i++) {
    data.set(matrices[i], i * 9);
  }
  return data;
}

// ─── One-time setup ──────────────────────────────────────────────────────────

export function setup(engine) {
  const generators = makeGenerators(D);
  const orbit = generateOrbit(generators);
  engine.setUniformValue('matrices', packMat3Array(orbit));
}
