# Shader Sandbox

A local GLSL shader development environment with custom uniforms, named buffers, scripting, and live reload.

## Quick Start

```bash
# Create a new shader project
npx @stevejtrettel/shader-sandbox create my-shaders

cd my-shaders

# Create and run a shader
shader new my-shader
shader dev my-shader
```

Open http://localhost:3000 to see your shader running.

## CLI Commands

```bash
shader create <name>     # Create a new shader project
shader dev <name>        # Run shader with live reload
shader build <name>      # Build shader for production
shader new <name>        # Create a new shader
shader list              # List all shaders
shader init              # Initialize shaders in current directory
```

## Project Structure

```
my-shaders/
├── shaders/
│   └── my-shader/
│       ├── image.glsl        # Main shader (required)
│       ├── bufferA.glsl      # Buffer passes (optional)
│       ├── common.glsl       # Shared code across passes (optional)
│       ├── config.json       # Configuration (optional)
│       └── script.js         # JavaScript hooks (optional)
├── main.ts
├── vite.config.js
└── package.json
```

## Writing Shaders

Every shader must define `mainImage`:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));
    fragColor = vec4(col, 1.0);
}
```

### Multi-Buffer Rendering

Create `bufferA.glsl` through `bufferD.glsl` alongside `image.glsl`. Passes execute in order (BufferA → BufferB → BufferC → BufferD → Image) with ping-pong semantics — each buffer reads its own previous frame output.

#### Named Buffers

Define named buffers in config.json. They become globally available samplers in every pass — reference them directly by name:

```json
{
  "buffers": {
    "velocity": {},
    "pressure": { "filter": "nearest", "wrap": "clamp" }
  }
}
```

Options: `filter` (`"linear"` | `"nearest"`), `wrap` (`"repeat"` | `"clamp"`). Max 4 buffers (mapped to BufferA–D internally).

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 vel = texture(velocity, uv);
    vec4 p = texture(pressure, uv);
    fragColor = vel + p;
}
```

#### Textures

Load image files as globally available samplers:

```json
{
  "textures": {
    "heightmap": "terrain.png"
  }
}
```

```glsl
vec4 h = texture(heightmap, uv);
```

Texture options can be specified with an object:

```json
{
  "textures": {
    "heightmap": {
      "texture": "terrain.png",
      "filter": "nearest",
      "wrap": "clamp"
    },
    "environment": {
      "texture": "skybox.png",
      "type": "cubemap"
    }
  }
}
```

Options: `filter` (`"linear"` | `"nearest"`), `wrap` (`"repeat"` | `"clamp"`), `type` (`"2d"` | `"cubemap"`). Cubemap textures use equirectangular projection.

Special texture sources:

| Value | Description |
|-------|-------------|
| `"keyboard"` | Keyboard state texture |
| `"audio"` | Microphone FFT + waveform |
| `"webcam"` | Live webcam feed |
| `{ "video": "clip.mp4" }` | Video file |
| `{ "script": "myData" }` | Script-uploaded texture |

### Common Code

Create `common.glsl` to share functions across all passes. It is prepended to every pass automatically.

## Built-in Uniforms

| Uniform | Type | Description |
|---------|------|-------------|
| `iResolution` | `vec3` | Viewport (width, height, 1) |
| `iTime` | `float` | Elapsed seconds |
| `iTimeDelta` | `float` | Time since last frame |
| `iFrame` | `int` | Frame counter |
| `iFrameRate` | `float` | Frames per second |
| `iMouse` | `vec4` | Mouse position and click state |
| `iMousePressed` | `bool` | Whether mouse button is currently pressed |
| `iDate` | `vec4` | Year, month, day, seconds since midnight |

### Touch Uniforms

| Uniform | Type | Description |
|---------|------|-------------|
| `iTouchCount` | `int` | Number of active touches |
| `iTouch0–2` | `vec4` | Per-touch position (xy) and start position (zw) |
| `iPinch` | `float` | Pinch scale factor (1.0 = no pinch) |
| `iPinchDelta` | `float` | Change in pinch since last frame |
| `iPinchCenter` | `vec2` | Midpoint between pinch fingers |

## Custom Uniforms

Define uniforms in config.json and they are auto-injected into your shader — no `uniform` declarations needed:

```json
{
  "controls": true,
  "uniforms": {
    "uSpeed": { "type": "float", "value": 1.0, "min": 0.0, "max": 5.0, "label": "Speed" },
    "uColor": { "type": "vec3", "value": [1, 0.5, 0.2], "color": true, "label": "Color" },
    "uAnimate": { "type": "bool", "value": true, "label": "Animate" }
  }
}
```

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float t = uAnimate ? iTime * uSpeed : 0.0;
    vec3 col = uColor * (0.5 + 0.5 * sin(uv.x * 10.0 - t));
    fragColor = vec4(col, 1.0);
}
```

### Supported Uniform Types

| Type | UI Control | Config Fields |
|------|-----------|---------------|
| `float` | Slider | `value`, `min` (0), `max` (1), `step` (0.01) |
| `int` | Discrete slider | `value`, `min` (0), `max` (10), `step` (1) |
| `bool` | Toggle | `value` |
| `vec2` | XY pad | `value`, `min`, `max` |
| `vec3` | 3 sliders or color picker | `value`, `color` (false), `min`, `max`, `step` |
| `vec4` | 4 sliders or color+alpha | `value`, `color` (false), `min`, `max`, `step` |

Set `"hidden": true` to exclude a uniform from the UI (useful for script-controlled values).

### Array Uniforms (UBOs)

For large data arrays, use array uniforms backed by Uniform Buffer Objects:

```json
{
  "uniforms": {
    "positions": { "type": "vec4", "count": 100 },
    "matrices": { "type": "mat3", "count": 128 }
  }
}
```

Supported array types: `float`, `vec2`, `vec3`, `vec4`, `mat3`, `mat4`. Array uniforms have no UI — set their data from JavaScript via the scripting API.

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec3 p = positions[0].xyz;
    vec3 q = matrices[0] * vec3(fragCoord, 1.0);
    // ...
}
```

## Scripting API

Add a `script.js` to your shader folder for per-frame computation:

```js
export function setup(engine) {
  // Called once after initialization
}

export function onFrame(engine, time, deltaTime, frame) {
  // Called every frame before shader execution
  const data = new Float32Array(100 * 4);
  for (let i = 0; i < 100; i++) {
    data[i * 4] = Math.cos(time + i * 0.1) * 0.3 + 0.5;
    data[i * 4 + 1] = Math.sin(time + i * 0.1) * 0.3 + 0.5;
    data[i * 4 + 2] = 0.02;
    data[i * 4 + 3] = i / 100;
  }
  engine.setUniformValue('positions', data);
}
```

### Script Engine API

| Method | Description |
|--------|-------------|
| `engine.setUniformValue(name, value)` | Set any uniform value |
| `engine.getUniformValue(name)` | Read current uniform value |
| `engine.updateTexture(name, w, h, data)` | Upload texture data from JS |
| `engine.readPixels(pass, x, y, w, h)` | Read pixels from a buffer (GPU readback) |
| `engine.width` / `engine.height` | Canvas dimensions |

## Keyboard Input

Add `"keyboard"` as a named texture to get a 256x3 texture of key states:

```json
{
  "textures": { "keyboard": "keyboard" }
}
```

The texture has three rows:
- Row 0: key pressed (1.0 if held down)
- Row 2: key toggle (flips on each press)

Helper constants and functions are auto-injected:

```glsl
// Constants: KEY_A through KEY_Z, KEY_SPACE, KEY_ENTER, KEY_UP, KEY_DOWN, etc.

float keyDown(int key)      // 1.0 if held
float keyToggle(int key)    // toggles on press
bool isKeyDown(int key)
bool isKeyToggled(int key)
```

## Layouts

Set `"layout"` in config.json:

| Layout | Description |
|--------|-------------|
| `fullscreen` | Canvas fills the viewport |
| `default` | Centered canvas with styling |
| `split` | Side-by-side canvas and live code editor |
| `tabbed` | Tabs to switch between canvas and code |
| `ui` | Canvas alongside uniforms control panel |

## Playback Controls

| Key | Action |
|-----|--------|
| **Space** | Play / Pause |
| **S** | Screenshot (PNG) |
| **R** | Reset to frame 0 |

Set `"controls": true` in config to show on-screen buttons for play/pause, reset, screenshot, record, and export. A stats panel displays FPS, elapsed time, frame count, and canvas resolution.

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `layout` | string | `"default"` | Canvas layout mode (see Layouts) |
| `theme` | string | `"system"` | `"light"`, `"dark"`, or `"system"` (follows OS preference) |
| `controls` | boolean | `false` | Show on-screen playback controls |
| `startPaused` | boolean | `false` | Start with animation paused |
| `pixelRatio` | number | device ratio | Canvas resolution multiplier (use < 1 for performance) |
| `common` | string | — | Path to shared GLSL file prepended to all passes |

## Recording and Export

### Video Recording

With `"controls": true`, use the record button to capture your shader as a WebM video (VP9 at 60fps). Click stop to end — the video downloads automatically.

### HTML Export

The export button generates a standalone HTML file containing your shader. It includes all passes, common code, and current uniform values. No external dependencies required.

**Not included in export:** array uniforms, audio, webcam, video, script hooks. Textures are replaced with a procedural pattern.

## Building for Production

```bash
shader build my-shader
```

Outputs a single HTML file in `dist/` that can be hosted anywhere.

## Embedding as a Library

The package exports its core classes for use in custom applications:

```typescript
import { App, createLayout, loadDemo } from '@stevejtrettel/shader-sandbox';
```

| Export | Description |
|--------|-------------|
| `App` | Main application — canvas, engine, and animation loop |
| `createLayout(mode, options)` | Layout factory |
| `applyTheme(mode)` | Apply light, dark, or system theme |
| `loadDemo(files)` | Load a shader project from bundled file data |

### Example

```typescript
import { App, createLayout } from '@stevejtrettel/shader-sandbox';

const project = /* your ShaderProject */;
const layout = createLayout(project.layout, {
  container: document.getElementById('shader-container'),
  project,
});

const app = new App({
  container: layout.getCanvasContainer(),
  project,
});

if (!app.hasErrors()) app.start();

// Clean up
app.dispose();
```

### Embed Entry Point

For build-time embedding of a specific shader:

```typescript
import { embed } from '@stevejtrettel/shader-sandbox/embed';

const { app, destroy } = await embed({
  container: '#my-container',
  pixelRatio: window.devicePixelRatio,
});
```

## Shadertoy Mode

Set `"mode": "shadertoy"` in config.json for direct compatibility with shaders copied from [Shadertoy](https://www.shadertoy.com). Shaders work without modification.

In Shadertoy mode, channels are bound per-pass using `iChannel0`–`iChannel3`:

```json
{
  "mode": "shadertoy",
  "BufferA": {
    "iChannel0": "BufferA"
  },
  "Image": {
    "iChannel0": "BufferA"
  }
}
```

Channels can be bound as string shortcuts or objects with options:

| Shorthand | Object Form | Description |
|-----------|-------------|-------------|
| `"BufferA"` | `{ "buffer": "BufferA" }` | Buffer pass output |
| `"photo.jpg"` | `{ "texture": "photo.jpg" }` | Image file |
| `"keyboard"` | `{ "keyboard": true }` | Keyboard state texture |
| `"audio"` | `{ "audio": true }` | Microphone FFT + waveform |
| `"webcam"` | `{ "webcam": true }` | Live webcam feed |

The `iChannel0`–`iChannel3` samplers and `iChannelResolution[4]` uniforms are available in Shadertoy mode. These channel bindings can also be used in standard mode alongside named buffers and textures.

## License

MIT
