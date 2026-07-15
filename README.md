# Shader Sandbox

A local GLSL shader development environment with live editing, custom
uniforms, named buffers, scripting — and clean paths from "shader on my
machine" to HD images, HD videos, drag-and-drop web folders, and blog
embeds.

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
npx shader-sandbox@latest create .    # refuses to overwrite files; --force to allow
npx shader dev simple
```

Open http://localhost:3000. The dev server always shows the **author
toolbar** (play/pause, reset, screenshot, record, export) — no
configuration needed.

Install globally to skip the `npx` prefix: `npm install -g shader-sandbox`.

## CLI Commands

```bash
shader create <name>     # Create new project folder
shader create .          # Initialize in current folder
shader dev <name>        # Run a shader with live reload
shader dev               # Gallery mode — browse all shaders
shader build <name>      # Build a shader for the web (see "Publishing")
shader build-all         # Build all shaders in shaders/
shader build-runtime     # Copy the runtime script to dist/
shader new <name>        # Create a new shader from a template
shader list              # List all shaders
shader build-gallery     # Build a static gallery index page
```

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

A bare `shaders/foo.glsl` file is a single-pass shader with live reload —
use a folder when you need passes, config, textures, or scripts.

## Writing Shaders

Every shader defines `mainImage`:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));
    fragColor = vec4(col, 1.0);
}
```

### Built-in Uniforms

| Uniform | Type | Description |
|---------|------|-------------|
| `iResolution` | `vec3` | Viewport (width, height, 1) |
| `iTime` | `float` | Elapsed seconds |
| `iTimeDelta` | `float` | Time since last frame |
| `iFrame` | `int` | Frame counter |
| `iFrameRate` | `float` | Frames per second |
| `iMouse` | `vec4` | Mouse position and click state |
| `iMousePressed` | `bool` | Whether the mouse button is held |
| `iDate` | `vec4` | Year, month (0-11), day, seconds since midnight |
| `iTouchCount`, `iTouch0–2`, `iPinch`, `iPinchDelta`, `iPinchCenter` | | Touch extensions |

### Named Buffers (standard mode)

Define named buffers in config.json; they become samplers in every pass:

```json
{
  "buffers": {
    "velocity": {},
    "pressure": { "filter": "nearest", "wrap": "clamp" }
  }
}
```

Each buffer needs a matching `<name>.glsl` file, reads its own previous
frame (ping-pong), and is available by name everywhere:

```glsl
vec4 vel = texture(velocity, uv);
```

Options per buffer: `filter` (`"nearest"` default, `"linear"`), `wrap`
(`"clamp"` default, `"repeat"`). Max 4 buffers.

### Textures (standard mode)

```json
{ "textures": { "heightmap": "terrain.png", "kb": "keyboard" } }
```

Values are strings: an image path, a script-texture name, or one of the
special sources `"keyboard"`, `"audio"`, `"webcam"`. (Cubemaps and video
files are available through shadertoy-mode channels — see below.)

### Channel Bindings (shadertoy mode — and standard mode)

Set `"mode": "shadertoy"` for direct Shadertoy compatibility with
per-pass `iChannel0–3` bindings:

```json
{
  "mode": "shadertoy",
  "BufferA": { "iChannel0": "BufferA" },
  "Image":   { "iChannel0": "BufferA" }
}
```

Channel values: `"BufferA"`, `"photo.jpg"`, `"keyboard"`, `"audio"`,
`"webcam"`, or object forms like `{ "texture": "sky.png", "type": "cubemap" }`
and `{ "video": "clip.mp4" }`.

Standard-mode projects may use the same per-pass `iChannel` bindings
*instead of* named buffers/textures (mixing the two styles in one project
is a config error). Shadertoy-mode projects support custom `uniforms` too.

A buffer channel accepts `"current": true` as an **ordering assertion**:
it declares the source pass runs earlier in the frame (guaranteeing a
this-frame read) and the loader rejects impossible orderings, including
self-references. Reads always see the latest completed output either way
(Shadertoy semantics).

### Common Code

`common.glsl` is prepended to every pass. Compile errors report
`common.glsl line N` vs. `Line N` per file.

## Custom Uniforms

Declared in config.json, auto-injected into GLSL, editable via UI:

```json
{
  "uniforms": {
    "uSpeed": { "type": "float", "value": 1.0, "min": 0.0, "max": 5.0, "label": "Speed" },
    "uColor": { "type": "vec3", "value": [1, 0.5, 0.2], "color": true },
    "uAnimate": { "type": "bool", "value": true }
  }
}
```

| Type | UI Control | Fields (defaults) |
|------|-----------|-------------------|
| `float` | Slider | `value`, `min` (0), `max` (1), `step` (0.01) |
| `int` | Discrete slider | `value`, `min` (0), `max` (10), `step` (1) |
| `bool` | Toggle | `value` |
| `vec2` | XY pad | `value`, `min`, `max` |
| `vec3` | Sliders or color picker | `value`, `color` (false), `min`, `max`, `step` |
| `vec4` | Sliders or color+alpha | `value`, `color` (false), `min`, `max`, `step` |

`"hidden": true` excludes a uniform from the UI (for script-driven values).

### Array Uniforms (UBOs)

```json
{
  "uniforms": {
    "positions": { "type": "vec4", "count": 100 },
    "seeds": { "struct": { "position": "vec3", "color": "vec4" }, "count": 1000 },
    "static_pts": { "type": "vec3", "count": 27, "data": "./data.json" }
  }
}
```

Array types: `float`, `vec2`, `vec3`, `vec4`, `mat3`, `mat4` (same for
struct fields). The engine injects a `name_count` uniform with the active
element count. `data` loads static values from JSON (an array, or an
object keyed by uniform name).

## Scripting

`script.js` exports any of:

```js
export function setup(engine, { isRestore }) {}
export function onFrame(engine, time, deltaTime, frame) {}
export function onUniformChange(engine, name, value) {}
export function dispose() {}
```

| Method | Description |
|--------|-------------|
| `engine.setUniformValue(name, value)` | Set any uniform. For array/struct uniforms, a `Float32Array` is **tight** per-element data (the engine packs to std140) |
| `engine.getUniformValue(name)` | Read the current value |
| `engine.setArrayUniform(name, data)` | Set from `number[][]` or flat `number[]` |
| `engine.setArrayElement(name, i, value)` | Update one element |
| `engine.setActiveCount(name, n)` | Set `name_count` |
| `engine.setStructArrayUniform(name, { field: [...] })` | Set struct array per-field |
| `engine.setStructArrayElement(name, i, data)` | Update one struct element |
| `engine.updateTexture(name, w, h, data)` | Upload a script texture |
| `engine.readPixels(pass, x, y, w, h)` | GPU readback — returns `Float32Array` (buffers are float textures) |
| `engine.setOverlay(position, text)` | Text overlay; `null` clears |
| `engine.width` / `engine.height` | Canvas size |

Scripts keep full module semantics everywhere — including inside exported
HTML files (the whole module is embedded, so module-level state works).

## Viewer Chrome (config.json)

These control what **viewers** see in published output. In `shader dev`
you always have the full author toolbar regardless of these settings.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title`, `author`, `description` | string | — | Metadata (gallery, export) |
| `layout` | string | `"default"` | `default` / `fullscreen` / `split` / `tabbed` |
| `theme` | string | `"auto"` | `auto` (inherit host page) / `light` / `dark` / `system` |
| `controls` | boolean | `false` | Master switch for `stats` + `playback` |
| `stats` | boolean | `false` | FPS / resolution overlay |
| `playback` | boolean | `false` | Play/pause + reset buttons |
| `uniformsUI` | string | `"panel"` | `panel` / `inline` / `off` (independent of `controls`; only renders when UI uniforms exist) |
| `startPaused` | boolean | `false` | Start on the first frame, paused |
| `stickyMouse` | boolean | `false` | Keep `iMouse.zw` positive after release |
| `pixelRatio` | number | device | Canvas resolution multiplier |
| `common` | string | — | Path to shared GLSL |

Keyboard shortcuts work on the focused shader regardless of chrome:
**Space** play/pause, **S** screenshot, **R** reset.

In `theme: "auto"` (host mode) the sandbox inherits the page's fonts and
colors; override specifics with CSS variables on the container
(`--accent-primary`, `--code-bg`, `--pane-radius`, `--pane-shadow`).

---

# Publishing

Four things authors make, four tools:

## 1. HD Images

In `shader dev`, press **S** for a quick PNG, or open the Screenshot
panel from the toolbar for: resolution presets to 8K, custom sizes with
aspect lock, time scrubbing (live preview for non-buffer shaders,
stepped rendering for buffer shaders), uniform tweaking, and a
**2× supersample** option for print-quality antialiasing.

## 2. HD Videos

The Record button opens the offline recording panel:

| Format | Notes |
|--------|-------|
| **MP4** | H.264 via WebCodecs; level auto-selected for the resolution (4K/8K supported) |
| **WebM** | VP9 |
| **PNG frames** | Writes into a folder you pick (File System Access API); browsers without it download frames individually |

Rendering is offline at a fixed timestep — deterministic output
regardless of real-time performance. Set start time, duration, FPS, and
quality (2–32 Mbps). Shaders with feedback buffers (or stateful scripts)
are automatically warmed up from frame 0 to your start time.

## 3. The Shelf-Stable Folder

```bash
shader build my-shader
```

produces `dist/my-shader/` — fully bundled, zero external dependencies:

```
dist/my-shader/
├── main.js       ES module (exports mount, auto-mounts into #app)
├── index.html    Standalone page wrapping main.js
└── README.txt    These instructions, in the folder
```

**Standalone page:** copy the folder to any static host. Done.

**Embed in an existing site:**

```html
<div id="my-shader" style="width:100%; aspect-ratio:16/9"></div>
<script type="module">
  import { mount } from '/assets/my-shader/main.js';
  const handle = mount(document.getElementById('my-shader'), { theme: 'auto' });
  // handle.pause() / resume() / reset() / setUniform(name, v) / recompile(pass, src) / destroy()
</script>
```

There is also an **Export HTML** button in the dev toolbar: a single
self-contained `.html` file with current uniform values baked in
(audio/webcam/video inputs become black; image textures become a test
grid). Great for sharing one file; `shader build` is the deployment path.

## 4. Blog Embeds — the Elements

Load the runtime **once per site**:

```html
<script type="module" src="https://esm.sh/shader-sandbox/runtime/standalone"></script>
<!-- or self-hosted: shader build-runtime → /js/shader-sandbox.js -->
```

With a bundler instead: `import 'shader-sandbox/runtime';`

This registers three elements. All of them fill their container (size
them like an `<img>`), lazy-mount on scroll, and pause off-screen. Every
`src` kind works everywhere: a project folder, a bare `.glsl` file,
inline GLSL text, or a built `main.js`.

### `<shader-canvas>` — the picture

Chromeless. The composable primitive:

```html
<shader-canvas id="waves" src="/shaders/waves/"
               style="width:100%; aspect-ratio:16/9"></shader-canvas>

<shader-canvas src="/shaders/heatmap.glsl" static></shader-canvas>

<shader-canvas>
  void mainImage(out vec4 o, in vec2 c) {
    vec2 uv = c / iResolution.xy;
    o = vec4(uv, 0.5 + 0.5*sin(iTime), 1.0);
  }
</shader-canvas>
```

Attributes: `src`, `static` (one frozen frame — for figures), `fullpage`,
`lazy="false"`, `start-paused`, `pixel-ratio`, `sticky-mouse`.

### `<shader-editor>` — the code

Live editing bound to a canvas anywhere on the page:

```html
<shader-canvas id="waves" src="/shaders/waves/"></shader-canvas>
<p>Prose about the shader…</p>
<shader-editor for="waves"></shader-editor>
```

Type freely; **Ctrl/Cmd+Enter** or the Recompile button swaps the new
shader into the canvas in place — time and buffer state preserved, errors
shown inline while the last good shader keeps running.

- `for="id"` — target canvas. Omit it and the editor auto-binds when the
  page has exactly one `<shader-canvas>`.
- `pass="image"` (or `bufferA`, `common`…) — a single tabless code block
  instead of the full tab bar.
- `theme` — `auto` (default: inherit the site) / `light` / `dark` / `system`.

A visible editor makes its canvas load (fetch + compile) immediately so
the sources render, but the canvas still waits to scroll into view before
animating. Built-module sources (`main.js`) are not editable — the editor
says so instead of failing silently.

### `<shader-sandbox>` — the appliance

The one-tag preset, unchanged from previous versions:

```html
<shader-sandbox src="/shaders/waves/" layout="split" controls="true"></shader-sandbox>
```

Non-reserved attributes pass through as mount options (kebab-case →
camelCase, `"true"`/`"false"`/numbers coerced). Reserved: `src`,
`static`, `fullpage`, `lazy`.

## Using as a Library

```ts
import { mount, loadDemo } from 'shader-sandbox';
import type { MountOptions, MountHandle, ShaderProject } from 'shader-sandbox';
```

That — plus the project types and type guards — is the supported API.
`mount(el, { project, ...presentation })` returns a handle with
`pause` / `resume` / `reset` / `isPaused` / `setUniform` / `getUniform` /
`recompile(passName, source)` / `destroy`.

## Multi-View Projects

A config with `"views": ["a", "b"]` renders coupled shaders with shared
time/uniforms and per-view mouse input (`iMouse_a`, `iResolution_b`, …),
in `split` / `quad` / `grid` / `inset` arrangements. Multi-view currently
runs in the dev server only (no export or runtime-element support).

## Migrating from 0.2.x

- **`<live-app>` is gone.** Existing copies of `live-app.js` on your site
  keep working (the file is self-contained) — or switch shader embeds to
  `<shader-canvas src=".../main.js">`.
- **Library exports trimmed** to `mount` + `loadDemo` + types. `App`,
  `ShaderView`, `createLayout`, `applyTheme` are no longer exported.
- **`engine.readPixels` returns `Float32Array`** (buffers are float
  textures; the old byte read returned zeros).
- **Raw `Float32Array` for struct-array uniforms is tight data** (packed
  for you), matching plain arrays.
- The realtime "Record Video" capture was removed; the offline recording
  panel covers all formats deterministically.

## License

MIT
