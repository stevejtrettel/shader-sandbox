// Animated UBO test — recompute particle positions every frame

const COUNT = 32;

export function onFrame(engine, time) {
  // 32 vec4s: xy = position, z = radius, w = hue
  const data = new Float32Array(COUNT * 4);

  for (let i = 0; i < COUNT; i++) {
    const phase = (i / COUNT) * Math.PI * 2.0;
    const orbit = 0.25 + (i % 5) * 0.05;
    const speed = 0.4 + (i % 7) * 0.1;

    data[i * 4 + 0] = 0.5 + Math.cos(time * speed + phase) * orbit;  // x
    data[i * 4 + 1] = 0.5 + Math.sin(time * speed + phase) * orbit;  // y
    data[i * 4 + 2] = 0.015 + (i % 4) * 0.005;                       // radius
    data[i * 4 + 3] = i / COUNT;                                      // hue
  }

  engine.setUniformValue('positions', data);
}
