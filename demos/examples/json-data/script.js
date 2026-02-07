/**
 * JSON Data to UBOs Example
 *
 * Demonstrates loading data from a JSON file and sending it to the GPU
 * as uniform buffer objects (UBOs).
 *
 * The JSON contains:
 * - positions: 27 vec3s (x, y, z)
 * - directions: 27 vec3s (dx, dy, dz)
 * - coefficients: 20 floats
 */

import jsonData from './data.json';

/**
 * Pack an array of vec3s into a Float32Array for the GPU
 * Each vec3 is stored as 3 floats
 */
function packVec3Array(vectors) {
  const data = new Float32Array(vectors.length * 3);
  for (let i = 0; i < vectors.length; i++) {
    data[i * 3 + 0] = vectors[i][0];
    data[i * 3 + 1] = vectors[i][1];
    data[i * 3 + 2] = vectors[i][2];
  }
  return data;
}

/**
 * Pack an array of floats into a Float32Array
 */
function packFloatArray(floats) {
  return new Float32Array(floats);
}




export function setup(engine) {
  // Load positions (27 vec3s)
  const positionsData = packVec3Array(jsonData.positions);
  engine.setUniformValue('positions', positionsData);

  // Load directions (27 vec3s)
  const directionsData = packVec3Array(jsonData.directions);
  engine.setUniformValue('directions', directionsData);

  // Load coefficients (20 floats)
  const coefficientsData = packFloatArray(jsonData.coefficients);
  engine.setUniformValue('coefficients', coefficientsData);

  console.log(`Loaded ${jsonData.positions.length} positions`);
  console.log(`Loaded ${jsonData.directions.length} directions`);
  console.log(`Loaded ${jsonData.coefficients.length} coefficients`);
}
