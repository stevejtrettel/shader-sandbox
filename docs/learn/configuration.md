# Configuration Reference

Complete reference for configuring your shader projects.

## Quick Overview

Every shader project needs either:
- **Simple**: Just an `image.glsl` file (auto-configured)
- **Advanced**: A `config.json` file + shader files

## File Structure

### Simple Single-Pass Shader

```
shaders/my-shader/
└── image.glsl
```

That's it! The system will auto-generate a config for you.

### Full Project

```
shaders/my-shader/
├── config.json          # Configuration
├── common.glsl          # Optional shared code
├── bufferA.glsl         # Optional buffer passes
├── bufferB.glsl
├── image.glsl           # Required — final output
├── script.js            # Optional JavaScript hooks
├── photo.jpg            # Optional textures
└── clip.mp4             # Optional video files
```

## Config File Format

`config.json` uses a flat format. Passes are defined at the top level by name. Channels are defined directly on each pass.

### Minimal Example

```json
{}
```

An empty config (or no config at all) works for a single `image.glsl` with no inputs.

### Complete Example

```json
{
  "title": "My Shader",
  "author": "Your Name",
  "description": "Feedback trail effect with texture",
  "layout": "default",
  "theme": "dark",
  "controls": true,
  "startPaused": false,
  "pixelRatio": 1.0,
  "common": "common.glsl",
  "uniforms": {
    "uSpeed": { "type": "float", "value": 1.0, "min": 0.0, "max": 5.0, "label": "Speed" }
  },
  "BufferA": {
    "iChannel0": "BufferA",
    "iChannel1": { "texture": "photo.jpg", "filter": "linear", "wrap": "repeat" }
  },
  "Image": {
    "iChannel0": "BufferA",
    "iChannel1": "keyboard"
  }
}
```

## Top-Level Options

### `title`, `author`, `description` (optional)

Project metadata. All at the top level (not nested).

```json
{
  "title": "Shader Name",
  "author": "Your Name",
  "description": "What this shader does"
}
```

If `title` is omitted, defaults to the folder name (capitalized).

### `layout` (optional)

Controls how the shader is displayed. Default: `"default"`.

| Value | Description | Use for |
|-------|-------------|---------|
| `"fullscreen"` | Canvas fills entire screen | Immersive art, games |
| `"default"` | Centered canvas with max-width | Most shaders |
| `"split"` | Side-by-side shader and code editor | Teaching, debugging |
| `"tabbed"` | Tabs to switch between pass code | Complex multi-pass shaders |

### `theme` (optional)

Color theme for the UI. Default: `"light"`.

| Value | Description |
|-------|-------------|
| `"light"` | Light theme |
| `"dark"` | Dark theme |
| `"system"` | Follow OS preference |

### `controls` (optional)

Show playback control buttons. Default: `false`.

When `true`, displays play/pause, reset, and screenshot buttons. Keyboard shortcuts (Space, R, S) work regardless of this setting.

### `startPaused` (optional)

Start paused on the first frame. Default: `false`.

Useful for shaders where you want to inspect the initial state before animation begins.

### `pixelRatio` (optional)

Override the pixel ratio for resolution scaling. Default: `null` (uses `window.devicePixelRatio`).

Use values less than 1 for lower resolution (better performance on high-DPI screens):

```json
{
  "pixelRatio": 0.5
}
```

### `common` (optional)

Path to a shared GLSL file that's prepended to all passes. Default: `"common.glsl"` if the file exists.

```json
{
  "common": "shared/utils.glsl"
}
```

## Passes

Passes are defined at the top level by name:

```json
{
  "BufferA": { ... },
  "BufferB": { ... },
  "Image": { ... }
}
```

**Available passes:**
- `BufferA`, `BufferB`, `BufferC`, `BufferD` — intermediate render targets (all optional)
- `Image` — final output (always present, auto-created if not specified)

**Execution order:** BufferA → BufferB → BufferC → BufferD → Image

Each pass looks for its shader code in a matching file: `bufferA.glsl`, `image.glsl`, etc. You can override this with the `source` key:

```json
{
  "BufferA": {
    "source": "simulation.glsl"
  }
}
```

### Pass Channel Bindings

Channels are bound directly on the pass object as `iChannel0` through `iChannel3`:

```json
{
  "BufferA": {
    "iChannel0": "BufferA",
    "iChannel1": "photo.jpg"
  }
}
```

Unbound channels read as black (vec4(0)).

## Channel Types

Channels can be specified as a string shorthand or a full object.

### Buffer Reference

Read from another pass's render target.

**String shorthand** (reads previous frame by default):
```json
"iChannel0": "BufferA"
```

**Object form with options:**
```json
"iChannel0": { "buffer": "BufferA" }
```

**Current frame** (read from a buffer that already ran this frame):
```json
"iChannel0": { "buffer": "BufferA", "current": true }
```

By default, buffer references read the **previous frame**. This is always safe and enables feedback loops. Use `"current": true` only when reading from a buffer that runs earlier in the pipeline (e.g., Image reading from BufferA).

**Self-reference (feedback loop):**
```json
{
  "BufferA": {
    "iChannel0": "BufferA"
  }
}
```

BufferA reads its own previous frame. The engine handles ping-pong textures automatically.

### Texture (Image File)

Load an external image as a texture.

**String shorthand** (any string with a file extension):
```json
"iChannel0": "photo.jpg"
```

**Object form with options:**
```json
"iChannel0": {
  "texture": "noise.png",
  "filter": "nearest",
  "wrap": "repeat"
}
```

**Options:**

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `filter` | `"linear"`, `"nearest"` | `"linear"` | Smooth vs pixelated sampling |
| `wrap` | `"repeat"`, `"clamp"` | `"repeat"` | Tiling vs edge-stretch |
| `type` | `"2d"`, `"cubemap"` | `"2d"` | Cubemap uses equirectangular projection |

**Supported formats:** `.jpg`, `.png`, `.webp`

Place files in the same folder as your config.

### Keyboard

Read keyboard input as a texture.

**Shadertoy mode:**
```json
"iChannel0": "keyboard"
```

**Standard mode** (named sampler — must be called `keyboard`):
```json
"textures": {
  "keyboard": "keyboard"
}
```

In standard mode, the engine auto-injects key constants and helper functions so you can write:

```glsl
if (isKeyDown(KEY_W)) { /* move up */ }
if (isKeyToggled(KEY_C)) { /* toggle effect */ }
```

See [Buffers and Channels — Keyboard Input](buffers-and-channels.md#keyboard-input) for the full list of available key constants and helper functions.

### Audio (Microphone)

Capture microphone input as a 512x2 texture.

```json
"iChannel0": "audio"
```

Or:
```json
"iChannel0": { "audio": true }
```

**Texture layout (512x2, single channel R8):**
- **Row 0** (y ≈ 0.25): FFT frequency spectrum (512 bins, 0–255 → 0.0–1.0)
- **Row 1** (y ≈ 0.75): Time-domain waveform (512 samples)

**Shader usage:**
```glsl
float spectrum = texture(iChannel0, vec2(freq, 0.25)).r;  // frequency bin
float waveform = texture(iChannel0, vec2(x, 0.75)).r;     // waveform sample
```

Audio requires a user gesture (click/tap) to initialize due to browser permissions. The texture is black until the microphone is granted.

### Webcam

Capture live webcam video as a texture.

```json
"iChannel0": "webcam"
```

Or:
```json
"iChannel0": { "webcam": true }
```

Like audio, webcam requires a user gesture to initialize. The texture updates every frame with the latest video frame.

### Video File

Play a video file as a texture.

```json
"iChannel0": { "video": "clip.mp4" }
```

The video auto-plays (muted) and loops. The texture updates every frame.

### Script Texture

Bind a texture that's created and updated from JavaScript via `script.js`.

```json
"iChannel0": { "script": "myData" }
```

The texture doesn't exist until your script creates it:

**script.js:**
```js
export function setup(engine) {
  const data = new Uint8Array(256 * 256 * 4);  // RGBA
  // ... fill data ...
  engine.updateTexture('myData', 256, 256, data);
}
```

Use `Uint8Array` for RGBA8 textures or `Float32Array` for RGBA32F (floating point) textures.

## Custom Uniforms

Define interactive controls that generate UI sliders, toggles, and color pickers. Uniforms declared in config are **auto-injected** into your GLSL — you don't need to declare them in your shader code.

### `uniforms` (optional)

```json
{
  "uniforms": {
    "uniformName": { ... definition ... }
  }
}
```

### Float

Slider control for a floating-point value.

```json
"uSpeed": {
  "type": "float",
  "value": 1.0,
  "min": 0.0,
  "max": 5.0,
  "step": 0.1,
  "label": "Animation Speed"
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `value` | required | Initial value |
| `min` | `0` | Minimum |
| `max` | `1` | Maximum |
| `step` | `0.01` | Step increment |
| `label` | uniform name | Display label |

GLSL type: `uniform float uSpeed;`

### Int

Discrete slider for integer values.

```json
"uCount": {
  "type": "int",
  "value": 6,
  "min": 1,
  "max": 20,
  "step": 1,
  "label": "Count"
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `value` | required | Initial value |
| `min` | `0` | Minimum |
| `max` | `10` | Maximum |
| `step` | `1` | Step increment |

GLSL type: `uniform int uCount;`

### Bool

Toggle switch.

```json
"uAnimate": {
  "type": "bool",
  "value": true,
  "label": "Animate"
}
```

GLSL type: `uniform bool uAnimate;`

### Vec2

2D position picker (XY pad).

```json
"uOffset": {
  "type": "vec2",
  "value": [0.5, 0.5],
  "min": [0.0, 0.0],
  "max": [1.0, 1.0],
  "label": "Center Position"
}
```

GLSL type: `uniform vec2 uOffset;`

### Vec3

Three sliders, or a color picker with `"color": true`.

**As color:**
```json
"uColor": {
  "type": "vec3",
  "value": [1.0, 0.5, 0.2],
  "color": true,
  "label": "Base Color"
}
```

**As 3 sliders:**
```json
"uParams": {
  "type": "vec3",
  "value": [0.5, 1.0, 0.0],
  "min": [-1.0, -1.0, -1.0],
  "max": [1.0, 1.0, 1.0],
  "step": [0.01, 0.01, 0.01],
  "label": "Parameters"
}
```

`min`, `max`, and `step` are per-component arrays. Default range: [0, 0, 0] to [1, 1, 1].

GLSL type: `uniform vec3 uColor;`

### Vec4

Four sliders, or a color picker with alpha with `"color": true`.

```json
"uTint": {
  "type": "vec4",
  "value": [1.0, 1.0, 1.0, 0.5],
  "color": true,
  "label": "Tint Color"
}
```

Per-component `min`, `max`, `step` work the same as vec3. Default range: [0, 0, 0, 0] to [1, 1, 1, 1].

GLSL type: `uniform vec4 uTint;`

### Array Uniforms (UBOs)

For large arrays of data (particle positions, bone matrices, etc.), use array uniforms backed by Uniform Buffer Objects. These are set from JavaScript via `script.js`, not from UI controls.

```json
"uniforms": {
  "positions": {
    "type": "vec4",
    "count": 32
  }
}
```

The `count` field makes it an array uniform. Supported types: `float`, `vec2`, `vec3`, `vec4`, `mat3`, `mat4`.

The engine auto-injects the UBO declaration into your shader using std140 layout:

```glsl
// Auto-generated:
layout(std140) uniform positions_ubo {
    vec4 positions[32];
};
```

**Set from script.js:**
```js
export function onFrame(engine, time) {
  const data = new Float32Array(32 * 4);  // 32 vec4s
  // ... fill data ...
  engine.setUniformValue('positions', data);
}
```

## Scripting API

Add a `script.js` file to your shader folder to run JavaScript code alongside your shader. Scripts can set uniforms, upload textures, and read pixels from buffers.

### Hooks

```js
// Called once after engine init, before the first frame
export function setup(engine) { ... }

// Called every frame before shader execution
export function onFrame(engine, time, deltaTime, frame) { ... }
```

Both are optional — export whichever you need.

### Engine API

| Method | Description |
|--------|-------------|
| `engine.setUniformValue(name, value)` | Set a uniform value (number, boolean, number[], or Float32Array) |
| `engine.getUniformValue(name)` | Get current uniform value |
| `engine.updateTexture(name, w, h, data)` | Create/update a named texture (Uint8Array → RGBA8, Float32Array → RGBA32F) |
| `engine.readPixels(pass, x, y, w, h)` | Read RGBA pixels from a buffer's previous frame. Returns Uint8Array |
| `engine.width` | Canvas width in pixels |
| `engine.height` | Canvas height in pixels |

### Example: GPU Readback

Read pixel data from a buffer pass and use it in JavaScript:

```js
export function onFrame(engine) {
  // Read a single pixel from center of BufferA
  const cx = Math.floor(engine.width / 2);
  const cy = Math.floor(engine.height / 2);
  const pixel = engine.readPixels('BufferA', cx, cy, 1, 1);
  // pixel is Uint8Array [r, g, b, a] with values 0-255

  const brightness = (pixel[0] + pixel[1] + pixel[2]) / (3 * 255);
  engine.setUniformValue('uBrightness', brightness);
}
```

### Example: Script Texture

Upload computed data as a texture:

```js
export function setup(engine) {
  // Create a 256x256 noise texture
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const v = Math.random() * 255;
    data[i * 4 + 0] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  engine.updateTexture('noise', size, size, data);
}
```

Bind it in config:
```json
{
  "Image": {
    "iChannel0": { "script": "noise" }
  }
}
```

## Common GLSL File

### `common.glsl` (optional)

Shared code prepended to all passes before compilation.

```glsl
// common.glsl
#define PI 3.14159265359

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
```

All passes can use these functions without re-declaring them.

## Complete Examples

### Simple Gradient

No config needed — just `image.glsl`.

### Feedback Loop

```json
{
  "title": "Trails Effect",
  "controls": true,
  "BufferA": {
    "iChannel0": "BufferA"
  },
  "Image": {
    "iChannel0": "BufferA"
  }
}
```

### Interactive with Uniforms

```json
{
  "title": "Uniform Controls Demo",
  "layout": "split",
  "controls": true,
  "uniforms": {
    "uSpeed": { "type": "float", "value": 1.0, "min": 0.0, "max": 5.0, "label": "Speed" },
    "uRings": { "type": "int", "value": 6, "min": 1, "max": 20, "label": "Rings" },
    "uAnimate": { "type": "bool", "value": true, "label": "Animate" },
    "uColor": { "type": "vec3", "value": [1.0, 0.5, 0.2], "color": true, "label": "Color" },
    "uOffset": { "type": "vec2", "value": [0.5, 0.5], "label": "Center" }
  },
  "Image": {}
}
```

### Audio Reactive

```json
{
  "title": "Audio Visualizer",
  "layout": "fullscreen",
  "Image": {
    "iChannel0": "audio"
  }
}
```

### Scripted Particles (UBO)

**config.json:**
```json
{
  "title": "Particle System",
  "uniforms": {
    "positions": { "type": "vec4", "count": 32 }
  },
  "Image": {}
}
```

**script.js:**
```js
const COUNT = 32;

export function onFrame(engine, time) {
  const data = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) {
    const phase = (i / COUNT) * Math.PI * 2.0;
    data[i * 4 + 0] = 0.5 + Math.cos(time + phase) * 0.3;
    data[i * 4 + 1] = 0.5 + Math.sin(time + phase) * 0.3;
    data[i * 4 + 2] = 0.02;
    data[i * 4 + 3] = i / COUNT;
  }
  engine.setUniformValue('positions', data);
}
```

### Multi-Buffer Pipeline

```json
{
  "title": "Complex Pipeline",
  "BufferA": {},
  "BufferB": {
    "iChannel0": "BufferA"
  },
  "BufferC": {
    "iChannel0": "BufferB"
  },
  "Image": {
    "iChannel0": "BufferC"
  }
}
```

## Keyboard Shortcuts

### Always Available

| Key | Action |
|-----|--------|
| **S** | Save screenshot as PNG |

### When `controls: true`

| Key | Action |
|-----|--------|
| **Space** | Play / Pause |
| **R** | Reset (frame 0) |

## Troubleshooting

### "Image pass is required"

You need at least an `image.glsl` file. The Image pass is always required.

### "Texture not found: photo.jpg"

- File must be in the same folder as your config
- Filename is case-sensitive
- Use just the filename, no path prefix

### Audio/webcam not working

These require a user gesture (click or tap on the canvas) before the browser will grant permission. The texture will be black until the permission is granted.

### Uniforms not showing up in shader

Custom uniforms from config are auto-injected. Don't declare them manually in your GLSL — you'll get a duplicate declaration error. Just use them directly.

## Next Steps

- See [Getting Started](getting-started.md) for shader basics
- See [Buffers and Channels](buffers-and-channels.md) for multi-pass details
- Check out the example demos for inspiration
