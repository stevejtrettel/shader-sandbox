/**
 * Projective Reflection Group — script.js
 *
 * Demonstrates passing a collection of mat3 matrices to the shader via UBO.
 *
 * How it works:
 *   1. Build three generator matrices M1, M2, M3 (depending on parameter d)
 *   2. Enumerate all products of generators (the "group orbit")
 *   3. Pack them into a Float32Array and send to the shader
 *
 * The shader receives:
 *   - matrices[128]      (mat3 UBO array)
 *   - matrices_count      (auto-injected by engine — how many are active)
 */

const MAX_MATRICES = 128;

// ─── Matrix helpers ──────────────────────────────────────────────────────────

/**
 * Multiply two 3x3 matrices (column-major flat arrays of 9 floats).
 *
 * Layout: [col0.x, col0.y, col0.z, col1.x, col1.y, col1.z, col2.x, col2.y, col2.z]
 * This matches GLSL's mat3() constructor order.
 */
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

/**
 * Build three projective reflection matrices for parameter d.
 * These act on the affine patch z=1 and preserve a convex domain.
 *
 * All matrices are column-major flat arrays (matching GLSL mat3 layout).
 */
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

/**
 * Generate group elements by taking all products of generators.
 *
 * Since M1, M2, M3 are reflections (M_i^2 = I), we only need "reduced words":
 * sequences where no generator appears twice in a row.
 *
 * Uses breadth-first search so shorter words come first.
 * Stops when we reach MAX_MATRICES.
 */
function generateOrbit(generators) {
  const results = [IDENTITY];

  // Queue entries: { matrix, lastGenerator }
  // lastGenerator tracks which generator was applied last, so we skip it next
  const queue = [];

  // Seed with the three generators (word length 1)
  for (let g = 0; g < generators.length; g++) {
    results.push(generators[g]);
    queue.push({ matrix: generators[g], lastGenerator: g });
    if (results.length >= MAX_MATRICES) return results;
  }

  // BFS: extend each word by one generator (skipping the previous one)
  while (queue.length > 0 && results.length < MAX_MATRICES) {
    const { matrix, lastGenerator } = queue.shift();

    for (let g = 0; g < generators.length; g++) {
      if (g === lastGenerator) continue;  // skip: would cancel (reflection squared = identity)

      const product = mat3Multiply(matrix, generators[g]);
      results.push(product);
      queue.push({ matrix: product, lastGenerator: g });

      if (results.length >= MAX_MATRICES) return results;
    }
  }

  return results;
}

// ─── Pack and send ──────────────────────────────────────────────────────────

/**
 * Pack an array of mat3 matrices into a flat Float32Array.
 *
 * Only packs the actual matrices (not the full MAX_MATRICES).
 * The engine expects tightly-packed data (9 floats per mat3, column-major)
 * and handles std140 padding automatically.
 */
function packMat3Array(matrices) {
  const data = new Float32Array(matrices.length * 9);
  for (let i = 0; i < matrices.length; i++) {
    data.set(matrices[i], i * 9);
  }
  return data;
}

// ─── Main hook ──────────────────────────────────────────────────────────────

let lastD = -1;

export function onFrame(engine) {
  const d = engine.getUniformValue('d');
  if (d === lastD) return;  // only recompute when d changes
  lastD = d;

  const generators = makeGenerators(d);
  const orbit = generateOrbit(generators);

  // Send only the actual orbit elements — engine auto-sets matrices_count
  engine.setUniformValue('matrices', packMat3Array(orbit));
}
