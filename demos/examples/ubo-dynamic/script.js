// Dynamic UBO count — lights spawn and despawn over time
// Demonstrates passing fewer elements than the max count

const MAX_LIGHTS = 16;

export function onFrame(engine, time) {
  // Number of active lights cycles 1 → 16 → 1 over ~10 seconds
  const t = (time * 0.1) % 1.0;
  const count = 1 + Math.floor(Math.abs(Math.sin(t * Math.PI)) * (MAX_LIGHTS - 1));

  const data = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    // Each light orbits at its own radius and speed
    const angle = time * (0.3 + i * 0.15) + (i / MAX_LIGHTS) * Math.PI * 2.0;
    const radius = 0.1 + (i / MAX_LIGHTS) * 0.35;

    data[i * 4 + 0] = 0.5 + Math.cos(angle) * radius;  // x
    data[i * 4 + 1] = 0.5 + Math.sin(angle) * radius;  // y
    data[i * 4 + 2] = 0.08 + (i % 3) * 0.03;           // glow radius
    data[i * 4 + 3] = i / MAX_LIGHTS;                    // hue (stable per slot)
  }

  engine.setUniformValue('lights', data);
}
