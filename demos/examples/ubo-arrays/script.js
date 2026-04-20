// Animated UBO test — recompute particle positions every frame

const COUNT = 32;

export function onFrame(engine, time) {
  const data = [];
  for (let i = 0; i < COUNT; i++) {
    const phase = (i / COUNT) * Math.PI * 2.0;
    const orbit = 0.25 + (i % 5) * 0.05;
    const speed = 0.4 + (i % 7) * 0.1;

    data.push([
      0.5 + Math.cos(time * speed + phase) * orbit,  // x
      0.5 + Math.sin(time * speed + phase) * orbit,  // y
      0.015 + (i % 4) * 0.005,                       // radius
      i / COUNT,                                      // hue
    ]);
  }

  engine.setArrayUniform('positions', data);
}
