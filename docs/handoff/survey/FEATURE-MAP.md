# Feature map: what exists where

Three columns throughout:

- **shader-sandbox** means `main` in this repo (0.3.0, unpublished).
- **webgl-demos** means `main` in `stevejtrettel/webgl-demos`.
- **July design** means `docs/architecture/`. It is a proposal with no
  code; entries in that column are intentions.

"Broken" means the feature is in the code but was observed not to work.
Evidence for every entry is in `reports/`; the report number is given
where it is not obvious.

## Writing a shader

| Topic | shader-sandbox | webgl-demos | July design |
|---|---|---|---|
| Entry point | `void mainImage(out vec4, in vec2)`. The engine appends `out vec4 fragColor` and a `main()` that calls it | Plain `void main()` assigning `fragColor` | Exactly one of `main()`, `shade(Fragment)`, `mainImage(...)` per file. `compute(Cell)` for non-visual passes |
| Built-in names | `iResolution` (vec3), `iTime`, `iTimeDelta`, `iFrame`, `iFrameRate`, `iMouse`, `iDate`. Extensions: `iMousePressed`, `iTouchCount`, `iTouch0..2`, `iPinch`, `iPinchDelta`, `iPinchCenter` | `uResolution` (vec3: w, h, aspect of the *current target*), `uScreenResolution`, `uTime`, `uDeltaTime`, `uFrame`, `uMouse` (vec4), `uMouseDelta`, `uMousePressed`, `uMouseButton`, `uLayer`, `uLayerNorm`, `uMathSpace`, `uPixelSize`, `PI`, `TAU`, `E` | `uTime`, `uResolution`, `uFrame`, `uPointer` |
| Missing built-ins | `iChannelTime`, `iSampleRate` are not declared. Keyboard row 1 ("pressed this frame") is never written | `uFrame`, `uMouseDelta`, `uMouseButton` are provided but no project uses them | |
| Coordinates given to you | `fragCoord` in pixels only | `uv` (0 to 1), `pixel` (ivec2), `pos` (centred, y in ±0.5, aspect-correct, in the project's math frame), `mousePos` (same frame, **broken** in buffers whose aspect differs from the canvas) | `Fragment` fields: `pixel`, `uv`, `coord` (centred, y in ±1), `resolution`. Nothing defined for field passes |
| How coordinates arrive | Function argument | Text spliced into the top of `main()` by a regular expression. Helpers cannot see them; declaring your own `uv` is an error (7 projects fail this way or by similar name clashes) | Struct argument to `shade` |
| A shared frame across buffers of different sizes | No. Every buffer is canvas-sized | `mathSpace: 'screen' \| <buffer name> \| {aspect}`. Used by 19 projects | Not addressed |
| Grid spacing for PDEs | No | `uPixelSize` = 1 / target height. Ignores the math frame | Not addressed |
| Custom uniforms in the shader | Injected: you do not declare them. Redeclaring is an error | Injected under the bare param name, in every shader | Fixtures hand-declare everything; prose says "per-pass interface injection". Undecided |
| Shared code | `common.glsl`, prepended to every pass. Emitted **before** the uniform declarations, so its functions cannot use `iTime` or any uniform | `common` string, prepended to fragment and vertex shaders. The vertex copy gets no `PI`/`TAU`, which breaks `particle-system` | Module system with `#include` |
| `#include` | None | Build-time, through `vite-plugin-glsl` and an `@lib` alias. Duplicates are removed only by `#ifndef` guards in the files | Planned, with source maps and deduplication |
| GLSL library | None | 44 files, 4505 lines. See below | "A stable standard library grown alongside the fixture corpus" |
| Error line numbers | Mapped at load by searching for marker comments. Not mapped for live edits in the editor | Wrong by about 40 to 47 lines for user code; right for `common` by accident | `#line`-style source maps planned |

## Buffers and how they run

| Topic | shader-sandbox | webgl-demos | July design |
|---|---|---|---|
| How many | Image plus at most four | Any number, named | Any number of named resources |
| Naming | `BufferA`..`BufferD`, or named buffers that map onto those four in JSON key order | Any identifier; the buffer name is the sampler name | Named; a pass maps its own sampler names onto resources (`reads: {vel: "velocity"}`) |
| Size | Always the canvas | `inherit` (canvas), `initial` (canvas size frozen once both sides reach 800 px), `[w,h]`, `[w,h,d]`, `{width, aspectRatio}`, `{height, aspectRatio}` | Fixed, view-relative or explicit, per resource |
| Format | Always RGBA32F. Float render targets are required; no fallback | 12 names: r/rg/rgb/rgba × 8/16f/32f. `rgb16f` and `rgb32f` do not work | Per resource, with a documented fallback ladder |
| Filter and wrap | Per named buffer only (`filter`, `wrap`). Channel-style buffers are always nearest and clamp. No mipmaps | Per buffer. Default nearest and clamp | Per resource; per-channel options for Shadertoy |
| Initial contents | Zero. Shaders test `iFrame == 0` | `init`: a colour or a shader. An init shader can read params and other buffers. A colour init on a fixed-size buffer is **not applied at startup**, only on reset | Clear value, init shader, external data, script upload, control data or copy |
| Reset | `iFrame = 0`, clear everything. Script `setup` is not re-run | Zero time and frame, re-run inits, keep params. A Reset button is added automatically when any buffer has an init shader | Replays initialisations in a fixed order |
| On window resize | Every buffer is reallocated and the whole thing resets, time included | Only `inherit` buffers are reallocated and re-initialised; time continues | Per-resource policy: reinitialise, keep fixed grid, resample, or clear |
| Order of passes | Fixed: A, B, C, D, Image | Insertion order of the `passes` object | Explicit schedule, or inferred |
| What a pass sees | Its own buffer: last frame. An earlier pass: this frame. A later pass: last frame. (Shadertoy's rule.) | The same rule. Each pass swaps immediately | Default: all update passes read last step's state and commit together ("snapshot"). Sequential only when written out |
| `"current": true` | A load-time check that the source pass runs earlier. No runtime effect | Not applicable | |
| Several passes writing one buffer | No | Yes, through `output:`. This is how the Schrödinger leapfrog works | Yes, with explicit commits |
| Steps per frame | One | `computeIterationsPerFrame`: every non-screen pass runs N times. Time, frame and mouse are identical across the N; no iteration index. 33 projects set it | `stepsPerFrame`, repeating only the simulation step |
| Repeating one pass (Jacobi) | No | No. `incompressible-fluid` writes 20 passes by hand | `Repeat(n)`, with `n` a constant or an integer uniform |
| Buffers that are not ping-pong | Every pass is a ping-pong pair, Image included | `pingPong: false`. Reading your own target then fails silently | Follows from declared reads and writes |
| Several outputs from one pass | No | No | Yes |
| Older history than one step | No | No; projects pack u(t) and u(t−dt) into two channels | Declared history depth |
| Additive or in-place drawing | No | No blending anywhere | `modify` write mode |
| 3D textures | No | Yes. A pass targeting a volume is drawn once per slice with `uLayer`, `uLayerNorm`. Ping-pong works. 15 projects | Yes, with the slice loop hidden from the author |
| Geometry and vertex shaders | No | Built-in quad, cube and grid; instancing; custom vertex shader. Matrix uniforms **cannot be set**, so the default vertex shader throws. No blending, no points or lines | Geometry passes over points, instances or a grid mesh |
| Reading pixels back | `readPixels(pass, x, y, w, h)` returns floats. Looks the pass up by its internal `BufferA` name, so named-buffer projects cannot use it | `readBuffer` is **broken**: reads the wrong half of the pair and reads float buffers as bytes | Value probe and reductions planned as diagnostics |

## Inputs other than buffers

| Topic | shader-sandbox | webgl-demos | July design |
|---|---|---|---|
| Image textures | Yes. Linear with mipmaps by default, flipped vertically | Yes. RGBA8, no mipmaps, no flip. One project uses it | Yes |
| Cubemaps | An equirectangular image plus a text rewrite of `texture(iChannelN, dir)`. The rewrite breaks on many expressions. No demo uses it | No | Real cubemaps and the equirect adaptation |
| Video file | Yes. Not synced to the clock, so not repeatable in export. No demo uses it | No | Yes |
| Webcam | Yes | No | Yes |
| Audio | Microphone only: spectrum and waveform texture | No | Deferred |
| Keyboard | 256×3 texture, plus `isKeyDown`-style helpers when a texture is named exactly `keyboard` | None in shaders; projects add their own key listeners in JavaScript | Supported in the Shadertoy layer |
| Mouse | `iMouse` (drag position and click origin), `iMousePressed`, optional `stickyMouse`. No hover, wheel or right button | `uMouse`, `uMousePressed`, `mousePos` | `uPointer`; `iMouse` derived from it |
| Touch | Up to three touches and pinch, as uniforms | Pointer events only | |
| Script-uploaded textures | `updateTexture(name, w, h, data)`, bytes or floats | No | Script systems with declared outputs |

## Parameters and controls

| Topic | shader-sandbox | webgl-demos | July design |
|---|---|---|---|
| Where declared | `config.json`, key `uniforms` | The project object in TypeScript, key `params` | `uniforms` |
| Scalar types | float, int, bool, vec2, vec3, vec4 | float, int, bool, vec2, vec3, vec4, enum | Same, plus matrices from controllers |
| Arrays | `{type, count}` for float, vec2..4, mat3, mat4, in a uniform buffer, with an injected `<name>_count` | No | Structured-data resources |
| Arrays of structs | `{struct: {...}, count}` | No | Same |
| Initial array data | `data: "file.json"`. Does not load through the dev server or built folders (`reports/1` §7) | | |
| Controls | Slider, toggle, XY pad, colour (with alpha for vec4), component sliders | Those plus dropdown (enum), button, text field, numeric entry | Slider, colour, enum, vector pad; controls that write lookup textures |
| Hidden uniforms | `hidden: true` | No (asked for in `TODO.md`) | |
| Groups | No | `group`, collapsible | Yes |
| Presets | No | `presets`: named sets of values | Yes |
| Controls on the canvas | `uniformsUI: "inline"` moves all of them | `overlay: true` per param; float, int and bool only | |
| Buttons | No | `button` params (`reset`, `randomize`; custom actions only log), and `app.ui.addButton` | "UI actions, not uniforms" |
| One place holding each value | No. One copy per engine, per control set and per open capture dialog | Yes, `App.paramStore` with a `paramChange` event. Vector controls still do not follow it | "One stored value, last writer wins" |
| Controls follow values set from code | No | Scalars, colours and enums yes; vector sliders and pads no | |

## JavaScript alongside the shader

| Topic | shader-sandbox | webgl-demos | July design |
|---|---|---|---|
| Hook file | `script.js` exporting `setup`, `onFrame`, `onUniformChange`, `dispose` | None. Each project's `main.ts` is ordinary code that constructs `App` | "Systems": scripts with declared outputs and a defined phase |
| What a script can do | Set uniforms and arrays, upload textures, read pixels, show corner text | `setParam`, `applyPreset`, `reset`, `pause`, `setTimeMode`, `reloadPass`, add buttons, listen for `frame`, `paramChange`, `resize`, errors | |
| `frame` passed to `onFrame` | 0 when the stats display is off; 1-based when on; 0-based in export | | |
| Cameras | None | `OrbitCamera` (18 projects) and `PanZoomCamera` (1). Each writes named float params, which must be declared and so show as sliders | Controllers: pointer, pan/zoom, orbit, drag points, writing uniforms |
| Per-frame callbacks in projects | 14 demos have a script | None in the corpus | |

## Running, time and editing

| Topic | shader-sandbox | webgl-demos | July design |
|---|---|---|---|
| Start a project | `shader create` scaffolds a project with its own `main.ts`, `vite.config.js` and `package.json`; then `shader dev <name>` | Vite project; each demo has an `index.html` and `main.ts` | CLI unchanged |
| Reload on save | Full page reload. Time, buffers and slider values are lost | Vite reload | Per-pass recompile keeping state |
| Edit in the page | Yes. Explicit recompile with Ctrl/Cmd+Enter; the last good shader keeps running; time and buffers are kept. Edits are not written to disk | CodeMirror panel; a reload resets the simulation | |
| Clock | Wall clock with pause, resume, reset. No seek, no rate | `realtime`, or `fixed` with an accumulator; `stepOnce` | Integer step counter with fixed `dt`, plus a separate display clock |
| Known clock bugs | Negative `iTimeDelta` after reset; time jumps after a hidden tab or scrolled-away embed; resize resets time | Time jumps by page uptime after reset; pause duration is added on resume; fixed mode runs hundreds of catch-up steps | |
| Pause when off-screen | Yes, two mechanisms that are not coordinated | No | |

## Getting things out

| Topic | shader-sandbox | webgl-demos | July design |
|---|---|---|---|
| Still image | PNG up to 8K, optional 2× supersample. No tiling and no size check against GPU limits | Per-buffer screenshot | Tiled export beyond GPU limits |
| Video | Fixed timestep. MP4 (H.264 through WebCodecs, muxed by mediabunny), WebM, PNG sequence. Whole MP4 is held in memory | Real-time MediaRecorder; PNG zip at fixed step | Deterministic, driven by the same executor |
| Animating a parameter in a video | Only by writing it into the shader or a script | Same | Timelines (last stage of the roadmap) |
| Self-contained folder | `shader build`: `main.js` (about 500 KB, engine and all author tools bundled, images inlined), `index.html`, `README.txt`. `main.js` exports `mount` and also mounts itself into `#app` on import | `vite build` of the whole site | Unchanged |
| Single HTML file | Yes, from a second player written by hand. Textures become a grid pattern; no controls | No | One engine everywhere |
| Embedding | `<shader-canvas>`, `<shader-editor for=…>`, `<shader-sandbox>`; sources can be a folder URL, a `.glsl` file, inline text or a built module. Lazy mount | None; it is an application, with global page styles | Kept |
| JavaScript API | `mount(el, {project, …})` returning pause, resume, reset, setUniform, getUniform, recompile, destroy | `new App(project, options)` | |
| Several views of one thing | A separate project type. One WebGL context and one full engine per view; views share time and uniforms but not buffers. Dev server only; no capture or export | One canvas | One shared context; views read the same resources |
| Gallery page | `shader build-gallery` | Hand-written `index.html` listing demos that no longer exist | |

## Interface around the shader

| Topic | shader-sandbox | webgl-demos |
|---|---|---|
| Layouts | Chosen by name: default, fullscreen, split, tabbed | A function `(app, container)`; five ready-made ones; you can write your own |
| Panel model | Plain classes created by `App` from flags | `Panel { element, attach(app), detach() }`, subscribing to `app.on(...)` |
| Clean-up | `destroy()` works and is safe to call twice | `detach()` is never called; panels and listeners are left behind |
| Styles | Global CSS, no shadow DOM. Theme colours are scoped to the host element but generic selectors and a reduced-motion rule leak into the page | Global, including a `* { margin: 0 }` reset |
| Themes | `auto` (inherits the page's fonts and colours), light, dark, system | light and dark, set on `document.body` |
| Author tools versus viewer chrome | Separated: the dev server always shows screenshot, record and export; config flags control only what viewers see | Not separated |
| Statistics | Frame rate, time, frame, resolution | Text works; the graph is **broken** |
| Buffer viewer | None | **Broken** |
| Error display | Overlay with mapped lines, hints and surrounding code; separate overlays for script errors and lost context | Persistent list with raw log |
| Accessibility | No ARIA; 3 of 12 inputs have an accessible name; the XY pad and colour swatch cannot be used from the keyboard | No ARIA |
| Keyboard shortcuts | Space, R and S are always live on a focused shader. S downloads a PNG for any viewer, and collides with shaders that use WASD | |

## Tests

| | shader-sandbox | webgl-demos | July design |
|---|---|---|---|
| What exists | 102 unit tests of pure logic | Three files of console asserts for include expansion; no runner | |
| Anything drawn and compared | No | No | Golden images, order-permutation tests, numerical tests against analytic solutions |
| Type check on a fresh checkout | Fails until a generated file exists (`npm run build` creates it) | | |

## The GLSL library in webgl-demos (`src/shaders/lib/`)

All 44 files were compiled and the mathematical ones executed. Full table
in `reports/7`.

| Area | Files | State |
|---|---|---|
| 2D stencils (5-point, 9-point, periodic, gradient, divergence, curl, biharmonic) | `simulation/stencils`, `stencils/*` | Interior operators correct. The 9-point is the Oono–Puri stencil, not the isotropic one. The boundary Laplacian is wrong and unstable. `stencils/*` duplicates `simulation/stencils` and the two cannot be included together |
| 3D stencils | `simulation/stencils3d` | 7-point, gradient, divergence, curl correct. 19-point and 27-point wrong (not called by any project) |
| PDE steps | `simulation/pde` | Heat, wave, Gray–Scott, Jacobi, advect correct. Damped wave wrong (not called) |
| Fluids | `simulation/fluids` | Does not compile. Two projects include it |
| Cellular automata | `simulation/cellular` | Correct by reading |
| 2D signed distance | `sdf/primitives2d`, `operations`, `viz`, `domain` | Correct to 5e-7 against brute force. `opRevolution` returns its input |
| 3D signed distance | `sdf/primitives3d` | 10 exact; `sdCone` and `sdTriPrism` are bounds, not distances |
| Noise | `noise/*` | `simplex2d` correct. `simplex3d` discontinuous on x=y=z. `perlin` gradients are not random. `worley` F2 wrong in about 4% of samples. 3D curl noise is not divergence-free |
| Hashes | `math/random` | Correct |
| Colour | `color/*` | HSV, HSL, blend modes correct. `paletteViridis` is not viridis. sRGB is a 2.2 power, not the standard curve |
| Rotation and quaternions | `math/rotate`, `math/quaternion` | Rotation matrices rotate by −θ. Quaternion module is wrong throughout |
| Easing | `math/easing` | 28 of 30 correct |
| Raymarching | `raymarching/implicit`, `core` | `implicit` works (needs a user-defined `F`; camera is mirrored). `core` is an unfilled template |
| Image effects | `effects/*`, `geometric/*` | Never included by any project; two do not compile |

Not in the library at all: complex arithmetic, Möbius transformations,
hyperbolic geometry, ODE integrators.

Provenance: the simplex noise, hashes, signed distance functions, HSV
conversion and easings come from well-known third-party sources. Three
files carry an attribution; none carries a licence; the repo has no
LICENSE file.

## The demo collections

| Collection | Count | What is in it | Runs |
|---|---|---|---|
| shader-sandbox `demos/examples` | 33 | One feature each: uniforms, textures, keyboard, audio, webcam, touch, buffers, scripting, array and struct uniforms, hyperbolic Voronoi, linkages, two multi-view | Loader accepts all; not rendered in this pass |
| shader-sandbox `demos/shadertoys` | 4 | Copied Shadertoy projects, including two path tracers | |
| shader-sandbox `demos/starscapes`, `template`, `scripted` | 10 | Mostly stubs and copies of the templates | |
| shader-sandbox `old-version` branch | 29 | Single-pass mathematical scenes, 44 to 1035 lines. None is in `demos/` today | Not run |
| webgl-demos `examples/` | 51 | Teaching sequence: basics, parameters, buffers, noise, signed distance, colour, cellular automata, fluids and waves, layouts | 44 |
| webgl-demos `new-demos/` | 30 | Heat, wave, Schrödinger, reaction–diffusion, volumes, raymarching | 23 |
| webgl-demos `demos/` | 24 | Oldest versions of the same, plus volumes and geometry | 0 |

What the webgl-demos corpus does **not** contain: more than one view,
accumulation (path tracing), particles stored in a texture, several
outputs from one pass, history beyond channel packing, blending,
timelines, per-frame JavaScript, readback into JavaScript.

Engine features in shader-sandbox that no demo uses: cubemaps, video,
`current: true`, four buffers at once, `readPixels`, scalar `vec4` and
`mat4` uniforms, the multi-view layouts other than split, and all three
custom elements.
