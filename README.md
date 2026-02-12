# Shader Sandbox

A local GLSL shader development environment with custom uniforms, named buffers, scripting, and live reload.

## Quick Start

```bash
# Create a new project
npx shader-sandbox@latest create my-shaders
cd my-shaders
npx shader dev simple
```

Or initialize in an existing folder:
```bash
cd my-existing-project
npx shader-sandbox@latest create .
npx shader dev simple
```

Open http://localhost:3000 to see your shader running.

### Global Install

Install globally to skip the `npx` prefix:

```bash
npm install -g shader-sandbox

shader create my-shaders    # or: shader create .
shader dev simple
```

## Examples

See more examples in the [demos/examples](https://github.com/stevejtrettel/shader-sandbox/tree/main/demos/examples) directory on GitHub:

- **[hello-shader](https://github.com/stevejtrettel/shader-sandbox/tree/main/demos/examples/hello-shader)** - Basic shader introduction
- **[buffers](https://github.com/stevejtrettel/shader-sandbox/tree/main/demos/examples/buffers)** - Named buffer with Conway's Game of Life
- **[multi-buffer](https://github.com/stevejtrettel/shader-sandbox/tree/main/demos/examples/multi-buffer)** - Multiple named buffers composited together
- **[reaction-diffusion](https://github.com/stevejtrettel/shader-sandbox/tree/main/demos/examples/reaction-diffusion)** - Gray-Scott reaction-diffusion simulation
- **[scripting](https://github.com/stevejtrettel/shader-sandbox/tree/main/demos/examples/scripting)** - JavaScript integration with shaders
- **[ubo-arrays](https://github.com/stevejtrettel/shader-sandbox/tree/main/demos/examples/ubo-arrays)** - Uniform buffer arrays for large datasets
- And more in the [examples directory](https://github.com/stevejtrettel/shader-sandbox/tree/main/demos/examples)

## CLI Commands

```bash
shader create <name>     # Create new project folder
shader create .          # Initialize in current folder
shader dev <name>        # Run shader with live reload
shader build <name>      # Build a single shader for production
shader build-all         # Build all shaders in shaders/
shader build-runtime     # Copy the runtime loader to dist/
shader new <name>        # Create a new shader from template
shader list              # List all shaders
shader build-gallery     # Build a static gallery index page
shader render <name>     # Render frames/video headlessly
```

Use `npx shader` if not installed globally.

## Project Structure

```
my-shaders/
├── shaders/
│   ├── my-shader.glsl        # Bare shader file (single-pass, no config needed)
│   └── complex-shader/
│       ├── image.glsl        # Main shader (required)
│       ├── bufferA.glsl      # Buffer passes (optional)
│       ├── common.glsl       # Shared code across passes (optional)
│       ├── config.json       # Configuration (optional)
│       └── script.js         # JavaScript hooks (optional)
├── main.ts
├── vite.config.js
└── package.json
```

Shaders can be either a **bare `.glsl` file** or a **folder**. A bare file like `shaders/my-effect.glsl` is treated as a single-pass shader (equivalent to a folder containing just `image.glsl`). Use a folder when you need multiple passes, config, textures, or scripts.

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

## Playback Controls

| Key | Action |
|-----|--------|
| **Space** | Play / Pause |
| **S** | Screenshot (PNG) |
| **R** | Reset to frame 0 |

Keyboard shortcuts are scoped to the focused shader — click a shader to give it focus, then use the shortcuts. This allows multiple shaders on the same page without interference.

Set `"controls": true` in config to show on-screen buttons for play/pause, reset, screenshot, record, and export. A stats panel displays FPS, elapsed time, frame count, and canvas resolution.

## Configuration Options

These are set in `config.json` for each shader. The presentation options (`layout`, `theme`, `controls`, `startPaused`, `pixelRatio`) can also be overridden at mount time — see [Mount Options](#mount-options).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `layout` | string | `"default"` | Canvas layout mode (see Layouts) |
| `theme` | string | `"light"` | `"light"`, `"dark"`, or `"system"` (follows OS preference) |
| `controls` | boolean | `true` | Show on-screen playback controls |
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
shader build my-shader      # Build a single shader
shader build-all             # Build every shader in shaders/
```

Both bare `.glsl` files and shader folders are supported. Output goes to `dist/<name>/`:

```
dist/my-shader/
├── main.js        # ES module (exports mount)
├── live-app.js    # <live-app> custom element
└── index.html     # Standalone page
```

The `main.js` module exports `mount()` which can be used programmatically:

```html
<div id="shader" style="width:100%;height:400px"></div>
<script type="module">
  import { mount } from './dist/my-shader/main.js';
  mount(document.getElementById('shader'));

  // Override presentation settings from config.json:
  mount(document.getElementById('shader'), {
    controls: false,
    theme: 'dark',
    startPaused: true,
  });
</script>
```

### `<live-app>` Custom Element

A generic web component for embedding any module that exports `mount(el, options?)`. Works with shader-sandbox, three.js apps, or any other visual module.

```html
<script type="module" src="/js/live-app.js"></script>

<!-- Basic usage -->
<live-app src="/shaders/my-shader/main.js" style="width:100%;height:400px;display:block;"></live-app>

<!-- With options passed as attributes -->
<live-app src="/shaders/my-shader/main.js" controls="false" theme="dark" start-paused="true"></live-app>

<!-- Fullpage mode -->
<live-app src="/shaders/my-shader/main.js" fullpage></live-app>
```

Reserved attributes (control the component itself):

| Attribute | Description |
|-----------|-------------|
| `src` | Path to the module (must export `mount`) |
| `fullpage` | Fill the viewport (`position:fixed`, 100vw x 100vh) |
| `lazy` | `"false"` to disable lazy loading (default: lazy-loads on scroll) |

All other attributes are passed as options to the module's `mount()` function. Attribute names are converted from kebab-case to camelCase, and values are type-coerced (`"true"`/`"false"` → boolean, numeric strings → number):

```html
<live-app src="./main.js"
  controls="false"       <!-- { controls: false } -->
  theme="dark"           <!-- { theme: 'dark' } -->
  start-paused="true"    <!-- { startPaused: true } -->
  pixel-ratio="2"        <!-- { pixelRatio: 2 } -->
></live-app>
```

**Lazy loading:** By default, `<live-app>` uses an IntersectionObserver to mount shaders only when they scroll into view, and unmount them (destroying the WebGL context) when they scroll away. This keeps a page with many shaders within browser WebGL context limits (~8-16). Set `lazy="false"` to disable this and mount immediately.

**Module contract:** The imported module must export `mount(el, options?) → { destroy() }` (or a Promise that resolves to one). This matches the build output of shader-sandbox, but also works with any module that follows the same contract.

### Mount Options

Built shaders accept options to override presentation settings from `config.json` at mount time:

```js
mount(el, {
  styled: false,       // remove pane decoration (border-radius, box-shadow)
  pixelRatio: 1,       // override canvas pixel ratio
  layout: 'fullscreen', // override layout mode
  controls: false,     // hide playback controls
  theme: 'dark',       // override color theme ('light', 'dark', 'system')
  startPaused: true,   // start with animation paused
});
```

All options are optional — omitted fields use whatever the shader's `config.json` specifies.

Pane decoration is controlled via CSS custom properties (`--pane-radius`, `--pane-shadow`) which you can override on the container element.

## Runtime Loader (No Build Step)

For prototyping, static sites, or Quarto — where you just want to drop `.glsl` files on a server without running a build — use the runtime loader. It fetches shader files directly over HTTP.

```bash
shader build-runtime    # Copy shader-sandbox.js to dist/
```

Then point the `<shader-sandbox>` element at a folder of shader files:

```html
<script type="module" src="/js/shader-sandbox.js"></script>

<shader-sandbox src="/shaders/mandelbrot/" style="width:100%;height:400px;display:block;"></shader-sandbox>
<shader-sandbox src="/shaders/julia/" controls="false" theme="dark"></shader-sandbox>
```

The folder just needs raw shader files — the same ones you'd use with `shader dev`:

```
shaders/mandelbrot/
├── image.glsl         # Required
├── config.json        # Optional (buffers, uniforms, textures, etc.)
├── common.glsl        # Optional
├── bufferA.glsl       # Optional (if declared in config)
└── script.js          # Optional (ES module with setup/onFrame hooks)
```

For the simplest case (a single shader with no config), just `image.glsl` is enough.

### `<shader-sandbox>` Attributes

The `<shader-sandbox>` element works just like `<live-app>` — all non-reserved attributes are passed as mount options:

```html
<shader-sandbox src="/shaders/my-shader/"
  controls="false"
  theme="dark"
  start-paused="true"
  layout="fullscreen"
></shader-sandbox>
```

| Attribute | Description |
|-----------|-------------|
| `src` | Path to the shader folder (must end with `/` or have no `.js` extension) |
| `fullpage` | Fill the viewport |
| `lazy` | `"false"` to disable lazy loading (default: lazy-loads on scroll) |

Lazy loading works the same as `<live-app>` — shaders mount when they scroll into view and unmount when they scroll away, keeping WebGL context usage within browser limits.

### Runtime Loader vs Build

| | Build (`shader build`) | Runtime (`<shader-sandbox>`) |
|---|---|---|
| Setup | Run build per shader | Drop files on server |
| HTTP requests | 1 bundled JS file | N fetches (config + glsl + textures) |
| First paint | Faster (pre-bundled) | Slightly slower (sequential fetch) |
| Dependencies | Needs Vite + Node | None — static file server only |
| Best for | Production sites | Prototyping, Quarto, static sites |

Both approaches support all the same shader features (buffers, uniforms, textures, scripts, etc.) and the same mount options.

## Quarto Integration

Embed shaders in [Quarto](https://quarto.org) websites using the runtime loader and a Lua shortcode extension. No build step per shader — just drop `.glsl` files alongside your `.qmd` files and reference them by name.

### Setup

1. Copy the extension into your Quarto project:

```
my-quarto-site/
├── _extensions/shader-sandbox/
│   ├── _extension.yml
│   ├── shader-sandbox.lua
│   └── shader-sandbox.js      ← copy from dist-runtime/
├── shaders/
│   ├── mandelbrot/
│   │   └── image.glsl
│   └── julia/
│       ├── image.glsl
│       ├── bufferA.glsl
│       └── config.json
├── index.qmd
└── _quarto.yml
```

The extension files are provided in `templates/quarto/_extensions/shader-sandbox/` in this package. Copy `dist-runtime/shader-sandbox.js` into the same folder.

Shortcode extensions are automatically available once in `_extensions/` — no `_quarto.yml` changes needed.

### Usage

Use the `{{< shader-sandbox >}}` shortcode in any `.qmd` file:

```markdown
{{< shader-sandbox mandelbrot >}}

{{< shader-sandbox julia controls="false" theme="dark" >}}

{{< shader-sandbox /custom/path/to/shader >}}
```

A bare name like `mandelbrot` resolves to `/shaders/mandelbrot/`. Paths starting with `/` are used as-is.

Mount options are passed as shortcode attributes — the same ones supported by the `<shader-sandbox>` element (`controls`, `theme`, `start-paused`, `layout`, `pixel-ratio`, etc.).

The `shader-sandbox.js` script is only included on pages that actually use the shortcode — no extra weight on pages that don't have shaders.

### Shader Folders

Place your shader folders in a `shaders/` directory at your site root. Quarto copies them to `_site/` as-is during render. Each folder follows the same structure as `shader dev`:

```
shaders/mandelbrot/
├── image.glsl         # Required
├── config.json        # Optional
├── common.glsl        # Optional
├── bufferA.glsl       # Optional
└── script.js          # Optional
```

## Using as a Library

The package exports its core classes for use in custom applications:

```typescript
import { mount, App, createLayout, loadDemo } from 'shader-sandbox';
```

| Export | Description |
|--------|-------------|
| `mount(el, options)` | Core API — mount a project into a DOM element |
| `App` | Main application — canvas, engine, and animation loop |
| `createLayout(mode, options)` | Layout factory |
| `loadDemo(files)` | Load a shader project from bundled file data |

### Example

```typescript
import { mount } from 'shader-sandbox';

const project = /* your ShaderProject */;

const handle = mount(document.getElementById('shader-container'), {
  project,
  styled: true,        // pane decoration (default: true)
  pixelRatio: 2,       // canvas resolution multiplier
  layout: 'fullscreen', // override layout from config
  controls: false,     // hide playback controls
  theme: 'dark',       // override theme
  startPaused: true,   // start paused
});

// Playback control
handle.pause();
handle.resume();
handle.reset();
handle.isPaused; // readonly boolean

// Uniform access
handle.setUniform('uSpeed', 2.0);
handle.getUniform('uSpeed'); // 2.0

// Clean up
handle.destroy();
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

### Multi-Buffer Example

Create buffer feedback by binding a buffer to its own `iChannel0`. This pattern matches Shadertoy's ping-pong rendering:

**config.json:**
```json
{
  "mode": "shadertoy",
  "layout": "default",
  "controls": true,
  "BufferA": {
    "iChannel0": "BufferA"
  },
  "Image": {
    "iChannel0": "BufferA"
  }
}
```

**bufferA.glsl:**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 prev = texelFetch(iChannel0, ivec2(fragCoord), 0);

    // Animated pattern
    float t = iTime;
    vec3 col = 0.5 + 0.5 * cos(t + uv.xyx * 3.0 + vec3(0, 2, 4));

    // Trail effect - blend with previous frame
    col = mix(prev.rgb, col, 0.05);

    fragColor = vec4(col, 1.0);
}
```

**image.glsl:**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Display the buffer output
    vec4 data = texelFetch(iChannel0, ivec2(fragCoord), 0);
    fragColor = vec4(data.rgb, 1.0);
}
```

### Channel Bindings

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
