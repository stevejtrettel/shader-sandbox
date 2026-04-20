// Struct Array Demo
//
// Demonstrates struct array uniforms: multiple fields per element
// packed into a single UBO. Each particle has position, color, and radius.

const COUNT = 64;

function hslToRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

export function onFrame(engine, time) {
  const speed = engine.getUniformValue('uSpeed') ?? 1.0;
  const t = time * speed;

  const positions = [];
  const colors = [];
  const radii = [];

  for (let i = 0; i < COUNT; i++) {
    const phase = (i / COUNT) * Math.PI * 2;
    const ring = Math.floor(i / 8);
    const orbit = 0.15 + ring * 0.08;

    positions.push([
      0.5 + Math.cos(t * 0.6 + phase) * orbit,
      0.5 + Math.sin(t * 0.6 + phase) * orbit,
    ]);

    const hue = (i / COUNT) * 360 + t * 30;
    colors.push(hslToRgb(hue, 0.8, 0.55));

    radii.push(0.008 + Math.sin(t * 2 + i) * 0.004);
  }

  engine.setStructArrayUniform('particles', {
    pos: positions,
    color: colors,
    radius: radii,
  });
}
