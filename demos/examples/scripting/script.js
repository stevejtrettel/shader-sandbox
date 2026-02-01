// Scripting API Demo — Procedural texture generation
//
// Generates a 512x1 waveform texture in JavaScript each frame,
// using slider values to control the waveform shape.
// The shader reads it like any other texture via iChannel0.
//
// This demonstrates:
//   - setup() and onFrame() hooks
//   - getUniformValue() to read slider values
//   - updateTexture() to upload JS-generated image data

const WIDTH = 512;

export function setup(engine) {
  // Upload an initial blank texture
  engine.updateTexture('waveform', WIDTH, 1, new Uint8Array(WIDTH * 4));
}

export function onFrame(engine, time) {
  const freq = engine.getUniformValue('uFrequency') ?? 4.0;
  const amp = engine.getUniformValue('uAmplitude') ?? 0.5;

  const data = new Uint8Array(WIDTH * 4);

  for (let i = 0; i < WIDTH; i++) {
    const x = i / WIDTH;

    // Compose several sine waves — easy in JS, tedious in GLSL for arbitrary counts
    let value = 0;
    for (let h = 1; h <= 5; h++) {
      value += Math.sin(x * freq * h * Math.PI * 2 + time * (h * 0.7)) / h;
    }
    value *= amp;

    // Pack as unsigned byte (0-255), centered at 128
    const byte = Math.max(0, Math.min(255, Math.round((value * 0.5 + 0.5) * 255)));
    data[i * 4 + 0] = byte;  // R = waveform value
    data[i * 4 + 1] = byte;
    data[i * 4 + 2] = byte;
    data[i * 4 + 3] = 255;
  }

  engine.updateTexture('waveform', WIDTH, 1, data);
}
