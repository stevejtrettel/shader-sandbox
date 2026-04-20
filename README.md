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
shader dev               # Gallery mode — browse all shaders
shader build <name>      # Build a single shader for production
shader build-all         # Build all shaders in shaders/
shader build-runtime     # Copy the runtime loader to dist/
shader new <name>        # Create a new shader from template
shader list              # List all shaders
shader build-gallery     # Build a static gallery index page
```

Use `npx shader` if not installed globally.

Running `shader dev` with no shader name starts a gallery page that lists all shaders in your project. Click any card to open that shader in the dev server.

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

Supported array types: `float`, `vec2`, `vec3`, `vec4`, `mat3`, `mat4`. Array uniforms have no UI — set their data from JavaScript via the scripting API. The engine auto-injects a `name_count` uniform with the number of active elements.

For static datasets, use `"data"` to load directly from a JSON file — no script needed:

```json
{
  "uniforms": {
    "positions": { "type": "vec3", "count": 27, "data": "./data.json" }
  }
}
```

The JSON file can be an array (used directly) or an object with a key matching the uniform name. Multiple uniforms can reference the same file:

```json
{
  "positions": [[0.1, 0.2, 0.0], [0.3, 0.5, 0.0]],
  "coefficients": [1.0, 2.0, 3.0]
}
```

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Loop over active elements
    for (int i = 0; i < positions_count; i++) {
        vec4 p = positions[i];
        // ...
    }
}
```

### Struct Array Uniforms

When related data has multiple types per entity (e.g. position + color), use a struct array to pack them into a single UBO. This uses one binding point instead of one per field:

```json
{
  "uniforms": {
    "seeds": {
      "struct": { "position": "vec3", "color": "vec4" },
      "count": 1000
    }
  }
}
```

The engine generates a GLSL struct and uniform block automatically:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    for (int i = 0; i < seeds_count; i++) {
        vec3 pos = seeds[i].position;
        vec4 col = seeds[i].color;
        // ...
    }
}
```

Set data from scripts using per-field arrays:

```js
engine.setStructArrayUniform('seeds', {
  position: [[1,0,0], [0,1,0], [0,0,1]],
  color: [[1,0,0,1], [0,1,0,1], [0,0,1,1]],
});

// Update a single element
engine.setStructArrayElement('seeds', 0, {
  position: [0.5, 0.3, 1.0],
  color: [1, 0, 0, 1],
});
```

Struct fields support the same types as plain array uniforms: `float`, `vec2`, `vec3`, `vec4`, `mat3`, `mat4`.

## Scripting API

Add a `script.js` to your shader folder for per-frame computation:

```js
export function setup(engine, { isRestore }) {
  // Called once after initialization (isRestore = false)
  // Also called on WebGL context restore (isRestore = true)
}

export function onFrame(engine, time, deltaTime, frame) {
  // Called every frame before shader execution
}

export function onUniformChange(engine, name, value) {
  // Called when a uniform changes from outside the script (e.g. UI sliders)
  // Not called for the script's own setUniformValue calls
}

export function dispose() {
  // Called when the shader is destroyed — clean up event listeners, timers, etc.
}
```

All hooks are optional — export any combination you need.

### Setting Array Uniforms

The engine knows each array uniform's type from `config.json`, so you can pass structured JS arrays and let it handle the packing:

```js
// Set from JS arrays — the engine flattens and packs to Float32Array automatically
engine.setArrayUniform('positions', [
  [0.5, 0.3, 1.0],   // vec3
  [0.2, 0.8, 0.5],
  [0.9, 0.1, 0.7],
]);

// For float arrays, pass a flat array
engine.setArrayUniform('coefficients', [1.0, 2.0, 3.0, 4.0]);

// Update a single element by index (much cheaper than resending everything)
engine.setArrayElement('positions', 0, [0.6, 0.4, 1.0]);

// Control how many elements the shader sees (written to name_count)
engine.setActiveCount('positions', 2);  // shader loops over 2, not 3

// Raw Float32Array still works for performance-critical per-frame updates
engine.setUniformValue('positions', myFloat32Array);
```

### Reacting to Uniform Changes

Use `onUniformChange` instead of polling `getUniformValue` every frame:

```js
let cachedOrbit;

export function onUniformChange(engine, name, value) {
  if (name === 'd') {
    // Recompute only when the slider moves
    cachedOrbit = generateOrbit(value);
    engine.setArrayUniform('matrices', cachedOrbit);
  }
}
```

### Lifecycle and Cleanup

The `dispose` hook is called when the shader is destroyed (e.g. navigating away, or the host calling `handle.destroy()`). Use it to remove event listeners or cancel timers:

```js
let canvas, onMouseDown;

export function setup(engine, { isRestore }) {
  if (isRestore) return; // Don't re-add listeners on context restore
  canvas = document.querySelector('canvas');
  onMouseDown = (e) => { /* ... */ };
  canvas.addEventListener('mousedown', onMouseDown);
}

export function dispose() {
  canvas?.removeEventListener('mousedown', onMouseDown);
}
```

### Script Engine API

| Method | Description |
|--------|-------------|
| `engine.setUniformValue(name, value)` | Set any uniform (scalar or raw Float32Array) |
| `engine.getUniformValue(name)` | Read current uniform value |
| `engine.setArrayUniform(name, data)` | Set array uniform from `number[][]` or `number[]` — auto-packs |
| `engine.setArrayElement(name, index, value)` | Update one element of an array uniform |
| `engine.setActiveCount(name, count)` | Set how many elements the shader uses (`name_count`) |
| `engine.setStructArrayUniform(name, data)` | Set struct array from per-field data (`{ field: [[...], ...] }`) |
| `engine.setStructArrayElement(name, index, data)` | Update one element of a struct array |
| `engine.updateTexture(name, w, h, data)` | Upload texture data from JS |
| `engine.readPixels(pass, x, y, w, h)` | Read pixels from a buffer (GPU readback) |
| `engine.setOverlay(position, text)` | Show text overlay (`"top-left"`, `"top-right"`, `"bottom-left"`, `"bottom-right"`). Pass `null` to clear. |
| `engine.width` / `engine.height` | Canvas dimensions |

#### Multi-View Script Extensions

In multi-view projects, the script engine API includes additional methods:

| Method | Description |
|--------|-------------|
| `engine.viewNames` | Array of view names in the project |
| `engine.getCrossViewState(viewName)` | Read another view's state (mouse, resolution) |
| `engine.setOverlay(position, text, viewName)` | Set overlay on a specific view by name |

## Keyboard Input

Add `"keyboard"` as a named texture to get a 256x3 texture of key states:

```json
{
  "textures": { "keyboard": "keyboard" }
}
```

The texture has three rows:
- Row 0: key pressed (1.0 if currently held down)
- Row 1: key down event (1.0 for one frame when first pressed, then cleared)
- Row 2: key toggle (flips between 0.0 and 1.0 on each press)

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

Set `"controls": true` in config to show on-screen buttons for play/pause, reset, screenshot, record, and export, along with a stats panel (FPS, elapsed time, frame count, resolution) and a uniforms panel toggle. Setting `"controls": false` suppresses all overlay UI — the output is purely the canvas with no chrome.

## Configuration Options

These are set in `config.json` for each shader. The presentation options (`layout`, `theme`, `controls`, `startPaused`, `pixelRatio`) can also be overridden at mount time — see [Mount Options](#mount-options).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | folder name | Project title (used in gallery and export) |
| `description` | string | — | Project description (used in gallery) |
| `layout` | string | `"default"` | Canvas layout mode (see Layouts) |
| `theme` | string | `"auto"` | `"auto"` (inherit from host page), `"light"`, `"dark"`, or `"system"` (follows OS preference) |
| `controls` | boolean | `true` | Show on-screen playback controls |
| `startPaused` | boolean | `false` | Start with animation paused |
| `pixelRatio` | number | device ratio | Canvas resolution multiplier (use < 1 for performance) |
| `common` | string | — | Path to shared GLSL file prepended to all passes |

## Theming

The `theme` option controls how the sandbox is styled:

| Mode | Description |
|------|-------------|
| `"auto"` | **Host mode** (default). Inherits fonts and colors from the page. Backgrounds are transparent, text uses `currentColor`, code editor adapts to light/dark via `prefers-color-scheme`. Use this when embedding in a blog or site with its own design system. |
| `"light"` | Self-styled light theme with its own fonts, colors, and shadows. |
| `"dark"` | Self-styled dark theme. |
| `"system"` | Self-styled, follows the OS light/dark preference. |

In host mode (`"auto"`), the sandbox's structural CSS loads but all decorative styling (backgrounds, shadows, fonts) defers to the page. The code editor gets a solid background for readability and automatically switches between light and dark syntax highlighting based on the user's OS preference.

To override specific variables in host mode, set CSS custom properties on the container:

```css
shader-sandbox {
  --accent-primary: #e06c75;
  --code-bg: #282c34;
}
```

## Recording and Export

### Video Recording

With `"controls": true`, use the record button to open the offline recording panel. The panel supports:

| Format | Description |
|--------|-------------|
| **MP4** | H.264 via WebCodecs (if browser supports `VideoEncoder`) |
| **WebM** | VP9 codec |
| **PNG Frames** | Raw frame sequence (ZIP download) |

Additional recording options:
- **Resolution presets**: 720p, 1080p, 1440p, 4K, 8K
- **Custom aspect ratio**: Lock or override width/height independently
- **Quality presets**: Low (2 Mbps) through Ultra (32 Mbps)
- **FPS and duration**: Set target framerate and length
- **Warmup frames**: Skip initial frames for buffer shaders that need time to converge

Recording runs offline at a fixed timestep — the shader advances one frame at a time regardless of real-time performance, so the output is deterministic.

### HTML Export

The export button generates a standalone HTML file containing your shader. No external dependencies required.

**Included in export:** all passes (with ping-pong FBOs), common code, current uniform values, array uniforms (UBOs with std140 layout), script hooks (inlined), and keyboard texture support.

**Not included in export:** audio, webcam, and video textures (replaced with black). Image textures are replaced with a procedural grid pattern.

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
    theme: 'dark',  // 'auto' (default), 'light', 'dark', 'system'
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

**Lazy loading:** By default, `<live-app>` uses an IntersectionObserver to mount modules only when they scroll into view, and unmount them (calling `destroy()`) when they scroll away. This keeps a page with many visualizations within browser WebGL context limits. Set `lazy="false"` to disable this and mount immediately.

**Module contract:** The imported module must export `mount(el, options?) → { destroy() }` (or a Promise that resolves to one). This matches the build output of shader-sandbox, but also works with any module that follows the same contract.

### Mount Options

Built shaders accept options to override presentation settings from `config.json` at mount time:

```js
mount(el, {
  styled: false,       // remove pane decoration (border-radius, box-shadow)
  pixelRatio: 1,       // override canvas pixel ratio
  layout: 'fullscreen', // override layout mode
  controls: false,     // hide playback controls
  theme: 'dark',       // override color theme ('auto', 'light', 'dark', 'system')
  startPaused: true,   // start with animation paused
});
```

All options are optional — omitted fields use whatever the shader's `config.json` specifies.

Pane decoration is controlled via CSS custom properties (`--pane-radius`, `--pane-shadow`) which you can override on the container element.

## Runtime Loader (No Build Step)

For blogs and static sites — where you just want to drop `.glsl` files on a server without running a build — use the runtime loader. It fetches shader files directly over HTTP using the `<shader-sandbox>` custom element.

### Quick Start (CDN)

Add one script tag to any HTML page — no install, no build:

```html
<script type="module" src="https://esm.sh/shader-sandbox/runtime/standalone"></script>
```

Then embed shaders anywhere on the page:

```html
<!-- From a URL (GitHub Pages, your own server, etc.) -->
<div style="width: 100%; aspect-ratio: 16/9;">
  <shader-sandbox src="https://your-site.github.io/shaders/my-shader/"></shader-sandbox>
</div>

<!-- Inline GLSL, no server needed -->
<div style="width: 400px; height: 400px;">
  <shader-sandbox>
  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
      vec2 uv = fragCoord / iResolution.xy;
      fragColor = vec4(uv, 0.5 + 0.5*sin(iTime), 1.0);
  }
  </shader-sandbox>
</div>
```

The `<shader-sandbox>` element fills its container — **you control the size** from your page's CSS, the same way you'd size an `<iframe>` or `<canvas>`.

Alternative CDN URLs (all work after npm publish):
- `https://unpkg.com/shader-sandbox/dist-runtime/shader-sandbox.js`
- `https://cdn.jsdelivr.net/npm/shader-sandbox/dist-runtime/shader-sandbox.js`

### Sizing

The element is `display: block; width: 100%; height: 100%`. It fills whatever you put it in. Size the container however you want:

```html
<!-- Responsive 16:9 -->
<div style="width: 100%; aspect-ratio: 16/9;">
  <shader-sandbox src="..."></shader-sandbox>
</div>

<!-- Fixed size -->
<shader-sandbox src="..." style="width: 600px; height: 400px;"></shader-sandbox>

<!-- Fullpage hero -->
<shader-sandbox src="..." fullpage></shader-sandbox>

<!-- With editable code for teaching -->
<div style="width: 100%; aspect-ratio: 16/9;">
  <shader-sandbox src="..." layout="split" controls="true"></shader-sandbox>
</div>
```

#### Layout Recommendations for Embeds

| Layout | Best for | Min width |
|--------|----------|-----------|
| `default` | Just the shader, clean display | Any |
| `fullscreen` | Same as default, no pane decoration | Any |
| `tabbed` | Shader + editable code via tabs | Any |
| `split` | Side-by-side shader + editor | 700px+ (stacks vertically below) |

### Setup (npm)

**With a bundler (Astro, Vite, etc.):**

```bash
npm install shader-sandbox
```

Then import the runtime in a layout or component:

```js
import 'shader-sandbox/runtime';
```

The import registers the `<shader-sandbox>` custom element. For sites where only some pages have shaders, use a conditional dynamic import:

```js
if (document.querySelector('shader-sandbox')) {
  import('shader-sandbox/runtime');
}
```

**Without a bundler (static file):**

```bash
shader build-runtime    # Copy shader-sandbox.js to dist/
```

```html
<script type="module" src="/js/shader-sandbox.js"></script>
```

### Usage

The `<shader-sandbox>` element supports three source modes:

```html
<!-- Folder: loads config.json + image.glsl + buffers + textures + script.js -->
<shader-sandbox src="/shaders/mandelbrot/"></shader-sandbox>

<!-- Single file: fetches one .glsl/.frag file, creates a single-pass shader -->
<shader-sandbox src="/shaders/heatmap.glsl"></shader-sandbox>

<!-- Inline: GLSL source as text content (no fetch, no src needed) -->
<shader-sandbox>
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = vec4(uv, 0.5, 1.0);
}
</shader-sandbox>
```

Folder-based shaders use the same structure as `shader dev`:

```
shaders/mandelbrot/
├── image.glsl         # Required
├── config.json        # Optional (buffers, uniforms, textures, etc.)
├── common.glsl        # Optional
├── bufferA.glsl       # Optional (if declared in config)
└── script.js          # Optional (ES module with setup/onFrame/dispose/onUniformChange hooks)
```

### `<shader-sandbox>` Attributes

All non-reserved attributes are passed as mount options (kebab-case → camelCase, with type coercion):

```html
<shader-sandbox src="/shaders/my-shader/"
  controls="false"
  theme="dark"
></shader-sandbox>
```

**Reserved attributes** (control the element itself):

| Attribute | Description |
|-----------|-------------|
| `src` | URL to a shader folder (`/shaders/foo/`) or single file (`/shaders/foo.glsl`) |
| `static` | Render one frame, no controls — for non-animated figures like heatmaps |
| `fullpage` | Fill the viewport (`position:fixed`, 100vw x 100vh) |
| `lazy` | `"false"` to disable lazy loading (default: lazy-loads on scroll) |

**Mount option attributes** (passed through to the shader):

| Attribute | Values | Description |
|-----------|--------|-------------|
| `controls` | `"true"` / `"false"` | Show/hide all overlay UI (playback, FPS, uniforms panel) |
| `start-paused` | `"true"` / `"false"` | Start with animation paused |
| `theme` | `"auto"` / `"light"` / `"dark"` / `"system"` | Color theme (default: `"auto"`) |
| `pixel-ratio` | number | Canvas resolution multiplier |
| `styled` | `"true"` / `"false"` | Border-radius/box-shadow decoration |
| `layout` | `"fullscreen"` / `"default"` | Layout mode |

### Sizing

The `<shader-sandbox>` element is `display: block; width: 100%; height: 100%` — it fills whatever container you put it in. Sizing is the host's concern:

```html
<!-- Inline styles -->
<shader-sandbox src="/shaders/heatmap.glsl" static
  style="width: 100%; aspect-ratio: 1/1; max-width: 600px; margin: 0 auto;"
></shader-sandbox>

<!-- Or use a wrapper component / CSS class -->
<div class="shader-square">
  <shader-sandbox src="/shaders/heatmap.glsl" static></shader-sandbox>
</div>
```

### Lazy Loading

By default, `<shader-sandbox>` uses an IntersectionObserver to defer mounting until the element scrolls into view. When the element scrolls out of view, the shader **pauses** (preserving time and uniform state) and **resumes** when it scrolls back in. The shader is only destroyed when the element is removed from the DOM.

Set `lazy="false"` to mount immediately.

### Loading and Error States

While fetching shader files, a "Loading shader..." placeholder is shown. If loading fails, a styled error message is displayed in place of the shader.

### Programmatic API

The runtime also exports functions for use in JavaScript:

```js
import { loadFromFolder, loadFromSource } from 'shader-sandbox/runtime';

// Load from a folder or .glsl URL
const handle = await loadFromFolder(element, '/shaders/mandelbrot/', {
  controls: false,
  theme: 'dark',  // 'auto' (default), 'light', 'dark', 'system'
});

// Load from inline GLSL source (synchronous)
const handle = loadFromSource(element, `
  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
      vec2 uv = fragCoord / iResolution.xy;
      fragColor = vec4(uv, 0.5, 1.0);
  }
`);

// Control playback
handle.pause();
handle.resume();
handle.reset();
handle.setUniform('uSpeed', 2.0);
handle.destroy();
```

### Runtime Loader vs Build

| | Build (`shader build`) | Runtime (`<shader-sandbox>`) |
|---|---|---|
| Setup | Run build per shader | Drop files on server |
| HTTP requests | 1 bundled JS file | N fetches (config + glsl + textures) |
| First paint | Faster (pre-bundled) | Slightly slower (sequential fetch) |
| Dependencies | Needs Vite + Node | None — static file server only |
| Best for | Production sites | Blogs, static sites |

Both approaches support all the same shader features (buffers, uniforms, textures, scripts, etc.) and the same mount options.

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
  theme: 'dark',       // override theme ('auto', 'light', 'dark', 'system')
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
