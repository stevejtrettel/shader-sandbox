# Shader Sandbox

A lightweight, Shadertoy-compatible GLSL shader development environment. Copy shaders directly from Shadertoy and run them locally with live editing.

## Features

- **Shadertoy Compatibility** - Copy/paste shaders directly from Shadertoy
- **Full Shadertoy Uniforms** - `iTime`, `iResolution`, `iFrame`, `iMouse`, `iTimeDelta`, `iDate`, `iFrameRate`, `iChannel0-3`
- **Multi-Buffer Rendering** - BufferA-D passes with correct ping-pong semantics
- **Texture Support** - Load images (including cubemaps) with configurable filtering and wrapping
- **Keyboard Input** - Full keyboard state via Shadertoy-compatible texture
- **Audio Input** - Microphone FFT spectrum and waveform as a texture, as in shadertoy
- **Webcam & Video** - Live webcam or video files as channel inputs, as in shadertoy
- **Custom Uniforms** - Float, int, bool, vec2, vec3, vec4 sliders and color pickers via config. *An extension beyond shadertoy*
- **UBO Array Uniforms** - Large data arrays (positions, colors, matrices) via Uniform Buffer Objects. *An extension beyond shadertoy*
- **Scripting API** - JavaScript hooks for per-frame computation, texture upload, and GPU readback. *An extension beyond shadertoy*
- **Touch Support** - Multi-touch, pinch, and gesture uniforms for mobile
- **Live Code Editing** - Edit shaders in the browser with instant recompilation
- **Multiple Layouts** - Fullscreen, split-view, or tabbed code display
- **Playback Controls** - Play/pause, reset, and screenshot capture
- **Themes** - Light, dark, or system-following theme

## Quick Start

```bash
# Create a new shader project
npx @stevejtrettel/shader-sandbox create my-shaders

# Enter the project
cd my-shaders

# Run an example shader
shader dev example-gradient
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

After running `shader create my-shaders`:

```
my-shaders/
├── shaders/
│   ├── example-gradient/
│   │   ├── image.glsl       # Main shader code
│   │   └── config.json      # Optional configuration
│   └── example-buffer/
│       ├── image.glsl       # Final output
│       ├── bufferA.glsl     # Feedback buffer
│       └── config.json
├── main.ts                  # Entry point
├── vite.config.js           # Vite configuration
└── package.json
```

## Creating Shaders

### Simple Shader

Create a new shader with just an image pass:

```bash
shader new my-shader
shader dev my-shader
```

Edit `shaders/my-shader/image.glsl`:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));
    fragColor = vec4(col, 1.0);
}
```

### Copy from Shadertoy

1. Find a shader on [Shadertoy](https://www.shadertoy.com)
2. Copy the code from the "Image" tab
3. Paste into `shaders/my-shader/image.glsl`
4. Run `shader dev my-shader`

Most single-pass shaders work immediately. For multi-buffer shaders, you'll need to create the buffer files and config.

### Multi-Buffer Shaders

For feedback effects (trails, fluid, etc.), create a buffer:

**shaders/my-effect/bufferA.glsl:**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 prev = texture(iChannel0, uv) * 0.98;  // Previous frame with fade

    // Draw at mouse position
    vec2 mouse = iMouse.xy / iResolution.xy;
    float d = length(uv - mouse);
    float spot = smoothstep(0.05, 0.0, d);

    fragColor = prev + vec4(spot);
}
```

**shaders/my-effect/image.glsl:**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = texture(iChannel0, uv);
}
```

**shaders/my-effect/config.json:**
```json
{
  "BufferA": {
    "iChannel0": "BufferA"
  },
  "Image": {
    "iChannel0": "BufferA"
  }
}
```

### Using Textures

Place an image in your shader folder and reference it in config:

```json
{
  "Image": {
    "iChannel0": "photo.jpg"
  }
}
```

With options:
```json
{
  "Image": {
    "iChannel0": {
      "texture": "photo.jpg",
      "filter": "nearest",
      "wrap": "clamp"
    }
  }
}
```

### Custom Uniforms (Slider Controls)

Add interactive controls to your shader by defining uniforms in config:

```json
{
  "controls": true,
  "uniforms": {
    "uSpeed": { "type": "float", "value": 1.0, "min": 0.0, "max": 5.0, "label": "Speed" },
    "uColor": { "type": "vec3", "value": [1.0, 0.5, 0.2], "color": true, "label": "Color" },
    "uAnimate": { "type": "bool", "value": true, "label": "Animate" }
  },
  "Image": {}
}
```

Uniforms declared in config are **auto-injected** into your shader code — you don't need to write `uniform` declarations. Just use them directly:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float t = uAnimate ? iTime * uSpeed : 0.0;
    vec3 col = uColor * (0.5 + 0.5 * sin(uv.x * 10.0 - t));
    fragColor = vec4(col, 1.0);
}
```

#### Supported Uniform Types

| Type | UI Control | Config Fields |
|------|-----------|---------------|
| `float` | Slider | `value`, `min` (0), `max` (1), `step` (0.01) |
| `int` | Discrete slider | `value`, `min` (0), `max` (10), `step` (1) |
| `bool` | Toggle | `value` |
| `vec2` | XY pad | `value`, `min` ([0,0]), `max` ([1,1]) |
| `vec3` | 3 sliders or color picker | `value`, `color` (false), `min`, `max`, `step` |
| `vec4` | 4 sliders or color+alpha picker | `value`, `color` (false), `min`, `max`, `step` |

Set `"hidden": true` on any scalar uniform to exclude it from the UI panel (useful for script-controlled values).

#### Array Uniforms (UBOs)

For large data arrays (positions, matrices, etc.), use array uniforms backed by Uniform Buffer Objects:

```json
{
  "uniforms": {
    "matrices": { "type": "mat3", "count": 128 },
    "matrixCount": { "type": "int", "value": 1, "hidden": true }
  }
}
```

Array uniforms support types: `float`, `vec2`, `vec3`, `vec4`, `mat3`, `mat4`. They have no UI — data is provided from JavaScript via `engine.setUniformValue()`.

In the compiled shader, array uniforms are wrapped in a `layout(std140)` uniform block with a `_ub_` prefix (e.g., `_ub_matrices`). The array variable itself uses the original name, so you reference it directly in GLSL:

```glsl
// Auto-injected by the engine (you don't write this):
// layout(std140) uniform _ub_matrices {
//   mat3 matrices[128];
// };

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    for (int i = 0; i < matrixCount; i++) {
        vec3 p = matrices[i] * vec3(fragCoord, 1.0);
        // ...
    }
}
```

See the [Configuration Reference](docs/learn/configuration.md) for all uniform types.

### Scripting (JavaScript Hooks)

For computed data that changes every frame, add a `script.js` to your shader folder:

**shaders/my-shader/script.js:**
```js
const COUNT = 32;

export function onFrame(engine, time) {
  const data = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) {
    const phase = (i / COUNT) * Math.PI * 2.0;
    data[i * 4 + 0] = 0.5 + Math.cos(time + phase) * 0.3;  // x
    data[i * 4 + 1] = 0.5 + Math.sin(time + phase) * 0.3;  // y
    data[i * 4 + 2] = 0.02;                                  // radius
    data[i * 4 + 3] = i / COUNT;                              // hue
  }
  engine.setUniformValue('positions', data);
}
```

Scripts can export `setup(engine)` (called once) and/or `onFrame(engine, time, deltaTime, frame)` (called every frame).

The script API provides:
- `engine.setUniformValue(name, value)` — set any uniform
- `engine.getUniformValue(name)` — read current value
- `engine.updateTexture(name, width, height, data)` — upload a texture from JS
- `engine.readPixels(passName, x, y, w, h)` — read pixels from a buffer (GPU readback)
- `engine.width` / `engine.height` — canvas dimensions

## Channel Types

Channels can be bound using string shortcuts or full objects:

| Shorthand | Object Form | Description |
|-----------|-------------|-------------|
| `"BufferA"` | `{ "buffer": "BufferA" }` | Buffer pass output |
| `"photo.jpg"` | `{ "texture": "photo.jpg" }` | Image texture |
| `"keyboard"` | `{ "keyboard": true }` | Keyboard state |
| `"audio"` | `{ "audio": true }` | Microphone FFT + waveform |
| `"webcam"` | `{ "webcam": true }` | Live webcam feed |
| — | `{ "video": "clip.mp4" }` | Video file |
| — | `{ "script": "myData" }` | Script-uploaded texture |

## Layouts

Control how the shader is displayed in `config.json`:

```json
{
  "layout": "split"
}
```

| Layout | Description |
|--------|-------------|
| `fullscreen` | Canvas fills the viewport |
| `default` | Centered canvas with controls |
| `tabbed` | Tabs to switch between shader and code |
| `split` | Side-by-side shader and code editor |

## Shadertoy Uniforms

All standard Shadertoy uniforms are supported:

| Uniform | Type | Description |
|---------|------|-------------|
| `iResolution` | `vec3` | Viewport resolution (width, height, 1) |
| `iTime` | `float` | Elapsed time in seconds |
| `iTimeDelta` | `float` | Time since last frame |
| `iFrame` | `int` | Frame counter |
| `iFrameRate` | `float` | Frames per second |
| `iMouse` | `vec4` | Mouse position and click state |
| `iChannel0-3` | `sampler2D` | Input textures/buffers |
| `iChannelResolution[4]` | `vec3[]` | Resolution of each channel |
| `iDate` | `vec4` | Year, month, day, time in seconds |

### Touch Uniforms (Mobile / Multi-touch)

| Uniform | Type | Description |
|---------|------|-------------|
| `iTouchCount` | `int` | Number of active touches |
| `iTouch0-2` | `vec4` | Per-touch position and state |
| `iPinch` | `float` | Current pinch distance |
| `iPinchDelta` | `float` | Change in pinch distance |
| `iPinchCenter` | `vec2` | Center point between pinch fingers |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **S** | Save screenshot (PNG) |
| **Space** | Play/Pause |
| **R** | Reset to frame 0 |

## Recording and Export

### Video Recording

When `controls: true`, click the record button (or use the controls menu) to capture your shader as a WebM video. Recording uses the browser's `MediaRecorder` API at 60fps with VP9 encoding. Click the stop button to end recording — the video downloads automatically.

### HTML Export

Click the export button in the controls menu to generate a standalone HTML file with your shader embedded. The exported file includes:
- All shader passes and common code
- Current custom uniform values baked in
- Full WebGL2 rendering pipeline (no dependencies)
- Mouse interaction support
- Resize handling

**Limitations:** Array uniforms (UBOs), audio, webcam, video, and script hooks are not included in the export. Textures are replaced with a procedural checkerboard pattern.

## Embedding as a Library

The package exports its core classes for use in custom applications:

```typescript
import { App, createLayout, loadDemo } from '@stevejtrettel/shader-sandbox';
import type { ShaderProject, LayoutMode } from '@stevejtrettel/shader-sandbox';
```

### Exports

| Export | Description |
|--------|-------------|
| `App` | Main application class — creates canvas, engine, and animation loop |
| `createLayout(mode, options)` | Factory to create a layout (fullscreen, default, split, tabbed) |
| `applyTheme(mode)` | Apply a theme (light, dark, system) |
| `loadDemo(files)` | Load a shader project from bundled file data |

### Example: Embedding a shader

```typescript
import { App, createLayout } from '@stevejtrettel/shader-sandbox';

const project = /* your ShaderProject object */;

const layout = createLayout(project.layout, {
  container: document.getElementById('shader-container'),
  project,
});

const app = new App({
  container: layout.getCanvasContainer(),
  project,
});

if (!app.hasErrors()) {
  app.start();
}

// Clean up when done
app.dispose();
```

### Embed entry point

For build-time embedding of a specific shader, the package also provides an `embed()` function:

```typescript
import { embed } from '@stevejtrettel/shader-sandbox/embed';

const { app, destroy } = await embed({
  container: '#my-container',  // CSS selector or HTMLElement
  pixelRatio: window.devicePixelRatio,
});

// Later: destroy() to clean up
```

## Building for Production

```bash
shader build my-shader
```

Output is in `dist/` - a single HTML file with embedded JavaScript that can be hosted anywhere.

## License

MIT
