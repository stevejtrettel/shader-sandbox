// Partial Update Demo
//
// Demonstrates updating individual struct fields independently:
// - Positions animate every frame (via setStructArrayUniform with just pos/size)
// - Colors only recompute when the Hue slider changes (via onUniformChange)
//
// This avoids rebuilding the full struct every frame.

const COUNT = 40;

function hslToRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

function recolor(engine, hueOffset) {
  for (let i = 0; i < COUNT; i++) {
    const hue = (hueOffset + (i / COUNT) * 360) % 360;
    const color = hslToRgb(hue, 0.75, 0.5);
    // Update only the color field of each element
    engine.setStructArrayElement('dots', i, { color });
  }
}

export function setup(engine) {
  const hue = engine.getUniformValue('uHue') ?? 0;
  recolor(engine, hue);
}

export function onFrame(engine, time) {
  const spread = engine.getUniformValue('uSpread') ?? 0.3;

  const positions = [];
  const sizes = [];

  for (let i = 0; i < COUNT; i++) {
    const phase = (i / COUNT) * Math.PI * 2;
    const r = spread * (0.5 + 0.5 * Math.sin(i * 1.7));

    positions.push([
      0.5 + Math.cos(time * 0.5 + phase) * r,
      0.5 + Math.sin(time * 0.5 + phase) * r,
    ]);

    sizes.push(0.015 + 0.01 * Math.sin(time * 3 + i));
  }

  // Update only positions and sizes — colors are unchanged
  engine.setStructArrayUniform('dots', {
    pos: positions,
    size: sizes,
  });
}

export function onUniformChange(engine, name, value) {
  if (name === 'uHue') {
    recolor(engine, value);
  }
}
