// Static UBO — set star positions once, never change
// Demonstrates that UBO data persists across frames without per-frame updates

const COUNT = 64;

function hash(n) {
  let x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

let initialized = false;

export function onFrame(engine) {
  if (initialized) return;
  initialized = true;

  const data = new Float32Array(COUNT * 4);

  for (let i = 0; i < COUNT; i++) {
    data[i * 4 + 0] = hash(i * 3 + 0);           // x
    data[i * 4 + 1] = hash(i * 3 + 1);           // y
    data[i * 4 + 2] = 0.002 + hash(i * 3 + 2) * 0.006; // radius
    data[i * 4 + 3] = hash(i * 7) * 0.3 + 0.1;  // brightness
  }

  engine.setUniformValue('stars', data);
}
