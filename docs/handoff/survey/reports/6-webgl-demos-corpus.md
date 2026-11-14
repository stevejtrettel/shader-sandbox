# webgl-demos project corpus: independent survey and check of report 2

Nothing in either repo was modified (`git status` is clean in both; only the gitignored `node_modules` exists). The vite server I started has been stopped. All scratch output is in `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/corpus/`: `results.jsonl` (one record per project), `shots/` (screenshots), and the scripts `run.js`, `run2.js`, `interact.js`, `snap.js`.

## 0. Headline findings

- **Only 67 of 105 projects run.** Every project was loaded in headless Chromium (SwiftShader) against the vite dev server; 38 are broken.
- **"Snapshot by default" is never exercised by the corpus.** No project has two passes that read each other's previous state and commit together. Every multi-pass project relies on the old engine's sequential behaviour (immediate swap after each pass).
- **Of the 8 projects whose mathematics requires sequential visibility, only 2 run today** (the two new-demos Schrödinger projects). I confirmed the dependence by experiment on one of them.
- **PAPER_CHECK §2 (fluid-2d) does not describe the real project.** There is no pressure iteration, the slider is dead, and the project fails at startup.
- **The largest gap in the July model is the shared math coordinate frame** (`mathSpace`, `pos`, `mousePos`, `uPixelSize`), used by 19 projects and not mentioned in the architecture docs. The old implementation of it is also buggy: the mouse lands in the wrong place when canvas and buffer aspect ratios differ.

Evidence levels used below:
- **[RUN]** observed by running.
- **[READ]** established by reading source.
- **[INFER]** my reasoning from the source, not executed.

## 1. Old-engine semantics [READ]

From `src/engine/Engine.ts` and `src/project/compiler.ts`:

- `passes` is an object; the key is the output target unless `output:` is given. Order is insertion order.
- `Engine.step()` (lines 138–161) runs all non-screen passes `computeIterationsPerFrame` times, then the screen passes once.
- `executePass` swaps the ping-pong pair immediately after each pass (lines 909–912). Every later pass, including in the same iteration, sees the write. The engine is purely sequential.
- All buffers are bound to every pass. `uResolution` is the resolution of the current target, not the canvas.
- The compiler injects four locals at the top of `main()`: `uv`, `pixel`, `pos` and `mousePos`. `pos` and `mousePos` are in a project-wide math space (`mathSpace: 'screen' | <bufferName> | {aspect}`). `uPixelSize` is 1/target height.
- Time, mouse and params are pushed once per frame (`App.updateAndStep`). All substeps see the same `uTime` and mouse.
- Init is a clear colour or a shader, which may read params. It runs at creation, on `reset()`, and on resize of `inherit` buffers.
- 3D targets are drawn layer by layer with `uLayer` / `uLayerNorm`.

## 2. Verdicts on report 2

### a. "All 24 demos/ use an older API and probably do not run" — VERIFIED, and stronger than stated [RUN]

- All 21 `demos/*` with a `main.ts` die with the same error before any canvas exists: `Cannot read properties of undefined (reading 'match')`.
- The other three have no entry at all: `demos/OLD_WAVE` (four orphan GLSL files using `iResolution` / `gl_FragColor`), `demos/bloom` and `demos/image-distortion` (`project.ts` only).
- Cause [READ]: every `demos/*/project.ts` writes `passes: [{name, source, output}]`. Commit `08be647` (2025-12-04, "Refactor passes to use key-value object format") changed the format and did not touch `demos/`.
  - `compileProject` now does `Object.entries(passes)` and reads `input.shader`, which is undefined. `injectStandardCoordinates(undefined).match` throws.
  - The old type survives only as `@deprecated PassDefinition` in `src/project/types.ts`.
- Two further breaks would remain after fixing the format [READ]:
  - 17 of the 24 directories redeclare `vec2 uv` (or `pos`) at the top of `main`, colliding with the injected locals from commit `2c706ab` (2025-12-05).
  - The geometry demos use the old key `vertexSource`; the current key is `vertex`.

Projects I ran: all 102 that have a `main.ts`. `new-demos/noise-3d` and `new-demos/raytracer-implicit-surfaces` hung SwiftShader at 1000×640 and were rerun at 420×200, where both render.

| Folder | Runs | Broken |
|---|---|---|
| examples (51) | 44 | 7 |
| demos (24) | 0 | 24 (21 TypeError + 3 no entry) |
| new-demos (30) | 23 | 7 |

"Runs" means it compiles, renders a non-error frame and logs no console error. I did not check visual correctness beyond the interaction tests in §6.

Broken outside demos/ [RUN]:

| Project | Failure |
|---|---|
| `examples/01-basics/ui-buttons` | `'state'/'color'/'speed' : redefinition` (shader redeclares generated uniforms) |
| `examples/02-parameters/toggle-switch` | `bool * float` type error |
| `examples/05-sdf/displacement`, `examples/05-sdf/morphing` | `'sdStar' : no matching overloaded function` |
| `examples/08-fluids/incompressible-fluid` | old array passes, same TypeError. By reading, it also uses `uOutputBuffer == "velocity"` (a string comparison in GLSL) and the undefined `uMousePosPrev` |
| `examples/08-fluids/reaction-diffusion`, `examples/08-fluids/smoke-simulation` | HTTP 500 on `init.glsl`: `#include "@lib/math/hash"` and `src/shaders/lib/math/hash.glsl` does not exist |
| `new-demos/cellular-automata-3d` | display shader vec2→vec3 mismatch |
| `new-demos/compile-test` | fetches a nonexistent `common.glsl.txt`, gets HTML, `'<' : syntax error` |
| `new-demos/fluid-2d` | `Pass 'velocity_diffuse' outputs to 'velocity_diffuse' but buffer 'velocity_diffuse' does not exist` |
| `new-demos/image-pipeline`, `new-demos/noise-gallery` | `'pos' : redefinition` |
| `new-demos/particle-system` | vertex shader `'PI' : undeclared` (core constants are only prepended to fragment shaders) |
| `new-demos/volume-gallery` | `'uv' : redefinition` plus a dimension mismatch |

### b. "Heavy duplication (about 14 wave variants)" — PARTLY (undercount)

There are 20 wave-equation directories [READ]:
- **2D (16):**
  - `examples/08-fluids/wave-equation` and the four `examples/09-layouts/wave-*`, whose three shaders are byte-identical (`cmp`).
  - `demos/{wave, wave-test, wave-equation, OLD_WAVE}`.
  - `new-demos/{wave-equation, wave-equation-confined, wave-equation-refraction, wave-equation-uiuc, wave-equation-uiuc-2, wave-rebuild, compile-test}`.
- **3D (4):** `demos/{wave-3d, wave-3d-raymarch}`, `new-demos/{wave-3d, wave-3d-volume}`.

There are about 6 distinct numerical variants. The other family counts (Schrödinger 4, Gray-Scott 4, Game of Life 2, implicit tracer 2) are VERIFIED.

### c. "14 capability corners with no fixture; 12 recommended acceptance tests" — PARTLY

The counts are as stated. The content has three problems:

- **9 of the 13 projects it names do not run** [RUN]: incompressible-fluid, fluid-2d, wave-3d-raymarch, smoke-simulation, blob-clipped, volume-gallery, lorenz-attractor, particle-system, wavy-plane. They can serve as specifications by reading, but there is no reference behaviour to port against.
- **It misses the corner most used in the owner's recent work:** the math frame and pointer mapping (19 projects). It appears only as half of item 6.
- **It misses the default ordering of feed-forward chains** (see §4).

### d. "fluid-2d never uses its pressure-iteration slider" — VERIFIED [READ + RUN], and the gap is wider

- `pressureIterations` occurs exactly once in the repo: `new-demos/fluid-2d/main.ts:115`. No shader or script reads it.
- `computeIterationsPerFrame: 1` and a single `pressure` pass give one Jacobi sweep per frame.
- The project does not start at all [RUN]. The keys `velocity_diffuse` and `velocity_project` are plain strings with no `output:`, so the engine looks for buffers of those names.
- The original version (`git show ae67a45:new-demos/fluid-2d/project.ts`, 2025-11-22) was an array with names `advectVelocity / diffuse / divergence / pressure / projection / advectDye`. Those are the names PAPER_CHECK uses. Even that version had one sweep and a dead slider.

PAPER_CHECK's seven sketches against the source:

| § | Sketch | Verdict |
|---|---|---|
| 1 | Schrödinger double-slit | **Accurate** [READ + RUN]. One rg32f field, two writers through `output:`, 10 iterations. Two caveats: "sliders are a natural `resetOn`" is new behaviour (today the init shader reads the sliders only on Reset or resize), and the sketch ignores `mathSpace: 'wavefunction'` and `uPixelSize`, which set dx and dt. |
| 2 | Stable fluids | **Not what the project does.** The stage order is right, but `Repeat(uPressureIterations)` does not exist, the slider is dead and the project does not run. The only real iterative solve is `examples/08-fluids/incompressible-fluid`: 20 hand-unrolled `jacobi-NN` passes, a constant count, also broken. Finding F1 (uniform-sourced Repeat counts) therefore has no working corpus precedent. |
| 3 | Progressive path tracer | Fixture only. No accumulation exists anywhere in the corpus [READ]. |
| 4 | Lorenz particles | Fixture only. `demos/lorenz-attractor` is stateless: RK4 is re-integrated from a hashed seed in the vertex shader for each of 5000 instanced cubes. No data texture, trail or `modify` write. |
| 5 | wave-equation-uiuc | **Accurate** [READ + RUN]. RG packs (u_n, u_{n-1}); one self-feedback pass; 3 iterations; `dt = 0.5*uPixelSize/max(waveSpeed, 0.1)`. It omits the dependence on `mathSpace: 'wave'`, `mousePos` and `coverMap`. |
| 6 | Volume reaction-diffusion, three views | Fixture only. `new-demos/reaction-diffusion-3d` has one view, 128³, 5 iterations and no convert pass. The convert-pass idea matches `demos/wave-3d-raymarch` (`color_mapping`). No corpus project has more than one view. |
| 7 | Tiled export | No corpus demo, as it says. |

So three of the seven are corpus projects; two of those are accurate and one is not.

### e. "Full list of imperative JavaScript" — VERIFIED with small corrections [READ]

- Greps for `getEngine`, `readBuffer`, `readPixels`, `texImage`, `requestAnimationFrame`, `setInterval` and `app.on('frame'` in project code return nothing. The only `app.on` is `paramChange` in `examples/03-buffers/compute-iterations/main.ts:81`.
- So the corpus contains no per-frame hooks, no JS-driven control flow, no conditional passes, no readback into JS, no dynamic buffer creation and no CPU uploads.
- OrbitCamera: 18 projects (7 in demos/). PanZoomCamera: 1. Custom DOM layouts: 11 in demos/, plus panels-test and compile-test. All as the report says.
- Additions:
  - `App.autoInjectResetButton` adds a Reset button whenever a buffer has an init shader (engine-side).
  - The `button` param with `action: 'reset'` in `new-demos/reaction-diffusion-3d/main.ts:71`.
  - `ruleToBitmask` in totalistic-rules also feeds presets.

### Other claims in report 2 that I refute

- **"Schrödinger (new-demos): leapfrog ψ + mouse perturbation."** The `perturbationStrength` / `perturbationRadius` params exist, but no shader reads the mouse; the only matches are comments.
- **"fluid-2d: 7 passes; velocity written 3×."** Not as written; see d.
- **"Params are always bare camelCase."** 11 projects use a `u` prefix, for example all of `examples/02-parameters`.
- **"230 of 236 shader files use `void main()`."** It is 223; the other 13 are common/include files.
- **Broken projects it missed:** toggle-switch, displacement, morphing, cellular-automata-3d, image-pipeline, noise-gallery, particle-system, volume-gallery, and the missing `@lib/math/hash`.
- "`uFrame`, `uMouseDelta`, `uMouseButton` never used" is VERIFIED; they appear only in docs and comments.

## 3. Table of all 105 projects

**Legend**
- Buffers / passes: passes are written compute + screen.
- PP = ping-pong self-feedback. N× = iterations per frame. MS = mathSpace. INIT = init shader. 3D = volume. VS = vertex shader / geometry. TEX = image texture. M = mouse. C = controls. JS = script beyond `new App`. Orbit = OrbitCamera.
- Status: RUN or BROKEN, from the headless run. Reasons for BROKEN rows are in §2a. For every `demos/` row, BROKEN is the old-API TypeError.

### examples/ (51)

| Path | Mathematics | Buf | Passes | Features | Status |
|---|---|---|---|---|---|
| 01-basics/{uv-gradient, animated-rings, aspect-correct} | gradient / rings / circle | 0 | 0+1 | `pos` | RUN |
| 01-basics/mouse-follow | glow at pointer | 0 | 0+1 | M (`mousePos`) | RUN |
| 01-basics/ui-buttons | fading feedback | 1 rgba8 512² | 1+1 (same shader for both) | PP, INIT, C, JS (`addButton`, `setParam`, pause) | BROKEN |
| 02-parameters/{color-tint, enum-modes, float-slider, multi-sliders, param-groups, presets} | parametric patterns | 0 | 0+1 | C (every param type, groups, presets, 2D pad) | RUN |
| 02-parameters/toggle-switch | bool toggles | 0 | 0+1 | C | BROKEN |
| 03-buffers/simple-buffer | render-to-texture | 1 rgba8 512² | 1+1 | C | RUN |
| 03-buffers/buffer-formats | precision banding | 3 (rgba8 / 16f / 32f, 512×256) | 3+1 (one shader, three targets) | float formats, C | RUN |
| 03-buffers/blur-multi-pass | separable Gaussian | 3 rgba8 512² | 3+1 chain | C | RUN |
| 03-buffers/feedback-trail | fading trail | 1 rgba8 512² | 1+1 | PP, M, C | RUN |
| 03-buffers/paint-canvas | persistent paint | 1 rgba8 1024² | 1+1 | PP, M, C, JS (key C resets) | RUN |
| 03-buffers/init-shader | toy wave from init pattern | 1 rgba32f 256² | 1+1 | PP, INIT reads params, JS (key R) | RUN |
| 03-buffers/compute-iterations | heat diffusion | 1 r32f 256² | 1+1 | PP, 5×, INIT, M, JS (`paramChange`, cannot apply) | RUN |
| 04-noise/{curl-flow, fbm-layers, perlin-classic, simplex-2d, simplex-3d, worley-cells} | noise | 0 | 0+1 | C, presets, `#include @lib` | RUN |
| 05-sdf/{boolean-ops, domain-repeat, domain-transform, outline-shell, primitives-2d, smooth-blend} | 2D SDFs | 0 | 0+1 | C, presets | RUN |
| 05-sdf/{displacement, morphing} | SDF + noise / morph | 0 | 0+1 | C | BROKEN |
| 06-color/{blend-modes, color-temperature, hsv-controls, palette-noise, palette-showcase} | colour | 0 | 0+1 | C | RUN |
| 07-cellular-automata/{game-of-life, majority-rule} | Life / majority CA | 1 rgba8 512² nearest | 1+1 | PP, INIT, M, C | RUN |
| 07-cellular-automata/{cyclic-ca, totalistic-rules} | cyclic CA (stochastic, uses `uTime`) / B/S bitmask rules | 1 rgba8 512² | 1+1 | PP, INIT, C, presets, definition-time JS | RUN |
| 08-fluids/wave-equation | wave equation, (u, u_prev) in RG, `uDeltaTime` | 1 rg32f 512² | 1+1 | PP, 3×, MS, INIT, M, C | RUN |
| 09-layouts/{wave-fullscreen, wave-sidebar, wave-split, wave-teaching} | identical shaders to the above | same | same | plus layout; `addButton` (sidebar, teaching); overlay params (split) | RUN |
| 08-fluids/reaction-diffusion | Gray-Scott, `uDeltaTime` | 1 rg32f 512² | 1+1 | PP, INIT, M, C | BROKEN |
| 08-fluids/smoke-simulation | buoyant smoke | 2 (rg32f, rgba32f 256²) | 2+1 | coupled PP, INIT, M | BROKEN |
| 08-fluids/incompressible-fluid | stable fluids | 4 (velocity, dye, divergence, pressure 256²) | 25+1 (20 Jacobi) | coupled, iterative, INIT, M | BROKEN |
| implicit-surface-tracer | ray-traced implicit surface (linkage configuration space) | 0 | 0+1 | Orbit, C overlay | RUN |

### demos/ (24)

| Path | Mathematics | Buf | Passes | Features | Status |
|---|---|---|---|---|---|
| easing-showcase | easing curves | 0 | 0+1 | C | BROKEN |
| image-distortion | lens on earth.png | 0 + TEX | 0+1 | TEX, M | BROKEN (no main.ts) |
| spinning-cube | rotating cube | 0 | 0+1 | VS cube, C | BROKEN |
| wavy-plane | sum of sines on a 128² grid | 0 | 0+1 | VS grid, C | BROKEN |
| lorenz-attractor | Lorenz via RK4 in the vertex shader | 0 | 0+1 | VS, 5000 instances, C | BROKEN |
| bloom | scene → bright → blur → composite | 3 rgba8 inherit, no PP | 3+1 chain | view-sized | BROKEN (no main.ts) |
| buffers-test | three independent fills | 3 rgba8 512² / 256² / 128² | 3+1 | mixed sizes | BROKEN |
| rd-noise | Gray-Scott | 1 rgba32f {width 512, aspect 1} | 1+1 | PP, INIT, common, C | BROKEN |
| panels-test | rd-noise in a 7-panel layout | – | – | layout only | BROKEN |
| wave | wave (u, v), symplectic Euler in one pass | 1 rgba32f 512² | 1+1 | PP, 10×, INIT, M | BROKEN |
| wave-test | wave, forward Euler, `uDeltaTime` | 1 rg32f 512² | 1+1 | PP, 10×, INIT, C | BROKEN |
| wave-equation | Verlet wave with source, obstacles, index of refraction | 1 rg32f inherit | 1+1 | PP, 10×, INIT, common, C | BROKEN |
| schrodinger-double-slit, schrodinger-periodic | leapfrog ψ; clamp vs repeat wrap | 1 rg32f inherit | 2+1 (both write ψ) | PP, 10×, INIT, common, C | BROKEN |
| volume-3d | slice of a static volume | 1 rgba16f 64³ | 0+1 | 3D, INIT, C overlay | BROKEN |
| sphere-volume-raymarch, sphere-raymarch-tiled | raymarch a static volume | 1 rgba16f 64³ | 0+1 | 3D, INIT, Orbit, wrap = repeat | BROKEN |
| blob-mip, sphere-volume-isosurface, vector-field | per-frame generated volume, then MIP / isosurface / field visualisation | 1 rgba16f 64³ | 1+1 | 3D, Orbit, `uTime` | BROKEN |
| blob-clipped | generate → clip → MIP | 2×64³ | 2+1 chain | 3D, Orbit | BROKEN |
| wave-3d | 3D wave, separate position and velocity volumes | 2 rgba16f 64³ | 2+1 | 3D, coupled, 2×, INIT, C | BROKEN |
| wave-3d-raymarch | same plus colour-map volume | 3×64³ | 3+1 | 3D, coupled, convert pass, 2×, Orbit | BROKEN |
| OLD_WAVE | orphan Shadertoy-era shaders | – | – | – | BROKEN (no project) |

### new-demos/ (30)

| Path | Mathematics | Buf | Passes | Features | Status |
|---|---|---|---|---|---|
| metaballs | smooth-min raymarch | 0 | 0+1 | C | RUN |
| noise-gallery | noise types | 0 | 0+1 | C | BROKEN |
| sdf-primitives, raymarched-scene | SDF raymarch | 0 | 0+1 | Orbit, C | RUN |
| noise-3d, raytracer-implicit-surfaces | 3D noise raymarch / implicit linkage surface | 0 | 0+1 | Orbit, C, local `#include` | RUN (small viewport) |
| fractal-explorer | Mandelbrot / Julia | 0 | 0+1 | PanZoom, JS keys | RUN |
| particle-system | 5000 instanced cubes, analytic motion | 0 | 0+1 | VS, instances, custom varying, Orbit | BROKEN |
| image-pipeline | generate → blur → edges → grade → final | 4 rgba8 inherit | 4+1 chain | C | BROKEN |
| interactive-painting | paint with decay and blur | 1 rgba8 inherit | 1+1 | PP, MS, M, JS (Ctrl+C) | RUN |
| game-of-life | Life rule sets | 2 (r32f 256², plus `trail`, never written) | 1+1 | PP, MS, INIT, wrap = repeat, M, JS keys | RUN |
| reaction-diffusion | Gray-Scott | 1 rg32f 512² | 1+1 | PP, 3×, MS, INIT, wrap = repeat, M, JS (keys, preset then reset) | RUN |
| heat-equation, heat-equation-conductivity | heat; variable κ(x) from an SDF | 1 r32f 1024² | 1+1 | PP, 3×, MS, `uPixelSize`, INIT, M, C (vec2 pad), common | RUN |
| wave-equation, wave-equation-confined, wave-equation-refraction, wave-equation-uiuc (2048²), wave-equation-uiuc-2 (3000×2048) | Verlet wave in RG; SDF domain / index of refraction | 1 rg32f | 1+1 | PP, 3×, MS, `uPixelSize`, `coverMap`, INIT, M, C | RUN |
| wave-rebuild | wave with line source `sin(f·uTime)` and index of refraction | 1 rg32f 1024² | 1+1 | PP, 1×, MS, common, M | RUN |
| compile-test | copy of refraction, async preprocess | 1 rg32f 1024² | 1+1 | JS (fetch, custom layout) | BROKEN |
| schrodinger-double-slit, schrodinger-periodic | leapfrog ψ | 1 rg32f 1024² | 2+1 (both write ψ) | PP, 10×, MS, `uPixelSize`, INIT, common, C | RUN |
| fluid-2d | stable fluids, one Jacobi sweep | 4 (rg32f, r32f ×2, rgba8 512²) | 6+1 | coupled, `uMouse.zw`, `uDeltaTime` | BROKEN |
| heat-3d, wave-3d-volume, reaction-diffusion-3d (128³) | volume PDE, raymarched | 1 volume (r32f / rg32f) | 1+1 | 3D, PP, 3× / 2× / 5×, INIT, Orbit, 2D mouse + layer slider, button param | RUN |
| cellular-automata-3d | 3D Life-like CA | 1 rg32f 64³ | 1+1 | 3D, PP, INIT, Orbit | BROKEN |
| wave-3d | 3D wave, slice view | 1 rg32f 64³ | 1+1 | 3D, PP, 2×, INIT, M, slice overlay | RUN |
| volume-gallery | procedural volumes | 1 rgba16f 64³ | 1+1 (init shader reused as pass) | 3D, wrap = repeat, Orbit | BROKEN |

## 4. Classification on the design's axes

### State topology

| Class | Count | Projects |
|---|---|---|
| Stateless | 52 | all single-pass projects |
| Stateless DAG, no feedback | 12 | simple-buffer, buffer-formats, blur-multi-pass, bloom, buffers-test, image-pipeline, blob-mip, sphere-volume-isosurface, vector-field, blob-clipped, volume-gallery, static volumes |
| One feedback field | about 33 | all single-buffer simulations |
| Coupled fields | 5 | smoke-simulation, incompressible-fluid, fluid-2d, demos/wave-3d, wave-3d-raymarch |
| Hierarchies | 0 | – |

### Update discipline — the question that decides the default

There are 17 projects with two or more compute passes.

| Class | Projects | What snapshot would do |
|---|---|---|
| **Requires sequential visibility** (8) | `new-demos/schrodinger-double-slit`, `new-demos/schrodinger-periodic`, `demos/schrodinger-double-slit`, `demos/schrodinger-periodic` (two writers of one resource; the second must see the new Re) | See the experiment below. |
| | `demos/wave-3d`, `demos/wave-3d-raymarch` (velocity pass, then position reads the new velocity) | [INFER] Symplectic Euler becomes forward Euler, which is unstable for the undamped wave equation. |
| | `examples/08-fluids/incompressible-fluid`, `new-demos/fluid-2d` (three writers of velocity; divergence of the new velocity; Jacobi on its own iterate; projection) | [INFER] The method is undefined with three writers in one group. |
| **Order-sensitive but tolerant** (1) | `examples/08-fluids/smoke-simulation` | [INFER] Density advects with the previous velocity instead of the new one: a different first-order splitting, still valid. |
| **Feed-forward chains** (4, plus one convert pass) | `examples/03-buffers/blur-multi-pass`, `demos/bloom`, `new-demos/image-pipeline`, `demos/blob-clipped`, and `color_mapping` in wave-3d-raymarch | Same picture, one frame of latency per stage. [RUN] for blur-multi-pass: no visible difference in a still. |
| **Independent passes** (2) | `examples/03-buffers/buffer-formats`, `demos/buffers-test` | Identical. |
| **Uses multi-pass snapshot** | none | – |

Everything else (about 45 stateful projects) is a single self-feedback pass, where the two disciplines coincide. Coupled quantities there are channel-packed into one texture: U and V in RG, (u, u_prev) in RG, (u, v) in RG.

**Experiment [RUN].** `snap.js` patches the served `Engine.ts` in memory so that swaps are deferred to the end of each iteration (snapshot, last writer wins). Nothing on disk changes.
- With the stock engine, the Schrödinger packet travels toward the slit and disperses.
- With the patch it sits still with degenerate phase, because the Re update is discarded.
- Screenshots: `shots/SNAP_sequential_new-demos__schrodinger-double-slit.png` and `shots/SNAP_snapshot_new-demos__schrodinger-double-slit.png`.

**Conclusion.** Snapshot as the default is harmless for the single-pass majority, but it is the right answer for zero corpus projects and the wrong one for 8 (13 counting latency). A structural default would serve the corpus better:
- acyclic dependencies run in topological order with immediate visibility;
- only genuine cycles between distinct passes get snapshot grouping;
- two writers of one resource in a step always require an explicit order.

That keeps the property that declaration order cannot change the result, and makes the chains work with no schedule. As written, EXECUTION_MODEL's inferred schedule (`Group[each update pass]`, then an unordered `Run(convert passes)`) does not say how a chain of converts or a derived scratch field inside a step (divergence) is ordered.

### Other disciplines

- **Iterative solve:** only incompressible-fluid (20×, unrolled, constant, broken).
- **Multi-rate:** none by design. wave-3d-raymarch's convert pass runs inside the 2× loop only because the engine repeats every non-screen pass.
- **Substeps:** 33 projects set `computeIterationsPerFrame` (3× in 15, 10× in 7, 5× in 3, 2× in 4, 1× in 4).

### Remaining axes

| Axis | What the corpus contains |
|---|---|
| Data kinds | 2D fields (rgba8 ×29, rg32f ×28, rgba16f ×17, r32f ×9, rgba32f ×9); volumes (20 configs: 18 at 64³, one at 128³); one image texture. No data textures, LUTs, structured buffers, uploaded geometry, MRT, or history deeper than channel packing. |
| Iteration domain | Pixels; volume cells (15 projects); built-in cube / grid meshes with instancing (4 projects, all stateless). |
| Value sources | Constants and controls everywhere; presets (about 20); OrbitCamera (18); PanZoom (1); keyboard scripts (7); buttons (4). No timelines; no script-computed uniforms beyond camera angles. |
| Presentation | Exactly one view in every project. The multi-panel layouts are UI chrome around one canvas. |
| Output | Realtime only at project level. Recording lives in `src/panels/RecordingPanel`, not in projects. No accumulation, no tiling. |

## 5. What the July model does not seem to provide

1. **A shared math coordinate frame** (19 projects set `mathSpace`; 12 use `uPixelSize`; 11 use `coverMap` in the display). The contract is: one project-level frame; `pos` in that frame in every pass whatever the target size; the pointer delivered in the same frame inside simulation passes; grid spacing in frame units; a declared fit between field and view.
   - `grep -i 'mathSpace|math space|pointer'` over `docs/architecture/*.md` finds only the `uPointer` built-in and pointer controllers.
   - `Fragment.coord` is per-target and nothing is defined for `compute(Cell)`.
   - `docs/PROJECT_GUIDE.md` (line 538 on) documents a richer `mathSpace: {center, size}` that was never implemented; it shows what the owner intended.
2. **Pointer into a volume**: a 2D pointer plus a layer slider, recomputed by hand from `uMouse / uScreenResolution` in heat-3d, wave-3d, wave-3d-volume and reaction-diffusion-3d.
3. **Event-driven commands from scripts**: reset; "set preset then reset" (`new-demos/reaction-diffusion/main.ts`); pause / time-mode toggle; buttons with arbitrary callbacks. July scripts are phase-bound uniform and resource writers. PROJECT_MODEL mentions "buttons, commands" in one sentence with no mechanism.
4. **Changing steps per frame at runtime**: `examples/03-buffers/compute-iterations` tries and cannot. D031 covers `Repeat` counts; I did not check whether `stepsPerFrame` itself may be uniform-sourced.
5. **Init shaders that read controls, with an explicit Reset.** `resetOn` covers the automatic case, but the corpus behaviour is "edit sliders, then press Reset". Both are needed, and `resetOn` on every initial-condition slider would restart a simulation mid-drag. Related: one shader used as both init and per-frame pass (volume-gallery, ui-buttons).
6. **Default ordering of derived passes** (§4).
7. **Draw count from a control**: `new-demos/particle-system/main.ts` comments `instanceCount: 5000 // Will be overridden by particleCount parameter`; the engine cannot do it.
8. **Sampling state per read, not per resource**: 28 float-buffer configs set `filter: 'linear'` only so the display can interpolate, while the update uses `texelFetch`. Linear filtering of 32F also needs `OES_texture_float_linear`.
9. **Not required by any corpus project** [READ]: JS-driven control flow, conditional passes, readback into JS, dynamic buffer creation, CPU uploads. Deferring general conditionals costs the corpus nothing.

## 6. Recommended acceptance set and droppable duplicates

Thirteen projects. Those marked † do not run today and must be ported from source.

1. `new-demos/schrodinger-double-slit` — two commits to one resource; math frame; init from controls. Conserved norm gives a numeric test.
2. `new-demos/wave-equation-uiuc` — channel-packed three-level scheme, 2048² fixed grid, SDF domain, math frame, pointer brush, cover fit.
3. `new-demos/heat-equation-conductivity` — common code, vec2 pad control, r32f. Heat-kernel decay gives a numeric test.
4. `new-demos/reaction-diffusion` — repeat wrap as boundary condition, substeps, keyboard commands.
5. `examples/08-fluids/incompressible-fluid` † — the only real iterative solve; three writers of velocity; scratch divergence.
6. `demos/wave-3d-raymarch` † — coupled volumes with sequential order, plus a per-frame convert pass and orbit view.
7. `new-demos/reaction-diffusion-3d` — 128³ cells, 5 steps, pointer into volume, reset button.
8. `new-demos/image-pipeline` † (or `examples/03-buffers/blur-multi-pass`, which runs) — view-sized feed-forward chain; tests derived-pass ordering with no schedule.
9. `examples/03-buffers/buffer-formats` — one shader bound to three targets and formats.
10. `examples/03-buffers/paint-canvas` or `new-demos/interactive-painting` — pointer feedback; fixed versus view-sized state and resize policy.
11. `new-demos/fractal-explorer` — pan/zoom controller plus a key script writing the same uniforms (D028).
12. `examples/implicit-surface-tracer` — heavy stateless tracer, orbit controller, overlay controls. It defines its own `shade(vec3, vec3, vec3)`.
13. `demos/lorenz-attractor` † or `new-demos/particle-system` † — instanced built-in mesh, custom varying, in-shader matrices.

Optional: `demos/image-distortion` † (image texture) and `examples/07-cellular-automata/totalistic-rules` (integer bitmask uniforms, presets).

**Droppable:**
- The four `examples/09-layouts/wave-*` (identical shaders).
- `new-demos/compile-test`, `demos/panels-test`, `demos/wave-test`, `demos/buffers-test`, `demos/OLD_WAVE`.
- `new-demos/wave-equation-uiuc-2`, `wave-equation-confined`, `wave-equation`, `wave-equation-refraction` (keep uiuc; `wave-rebuild` only if a time-dependent source is wanted).
- The whole demos/ Schrödinger and wave 2D family (superseded by new-demos).
- `new-demos/schrodinger-periodic` (wrap mode is covered by reaction-diffusion).
- `examples/08-fluids/reaction-diffusion`, `demos/rd-noise`, `examples/07-cellular-automata/game-of-life` (keep one Life).
- `new-demos/raytracer-implicit-surfaces` (keep the examples one).
- `new-demos/fluid-2d` (keep incompressible-fluid).
- `demos/blob-mip`, `sphere-volume-isosurface`, `sphere-volume-raymarch`, `sphere-raymarch-tiled`, `volume-3d` (keep blob-clipped if a volume chain is wanted).
- Most of 01, 02, 04, 05 and 06: keep one per control type as smoke tests.

## 7. Surprises

1. **The mouse is misaligned in the math-frame projects [RUN].** In `new-demos/heat-equation` on a 1320×600 canvas, pressing at x = 0.20 of the width put the heat at x ≈ 0.36, about 215 px to the right (`shots/INTERACT_new-demos__heat-equation_1600x600.png`).
   - Cause [READ], `compiler.ts:77`: in a buffer pass the pointer's screen UV is reused as buffer UV, but the display maps the buffer through `coverMap`.
   - Projects whose display simply stretches the buffer (`examples/08-fluids/wave-equation`, feedback-trail, paint-canvas) are aligned but distorted.
   - The feature the owner cares about most was never correct in the old system, so there is no reference behaviour to copy; it has to be specified.
2. **The GitHub Pages build publishes only `demos/`** (`scripts/build-all.mjs` scans `demos/` alone), which is the folder where nothing runs.
3. **Wall-clock time inside numerics.** 15 shader files use `uDeltaTime` as the simulation dt, including `c²·dt²` in `examples/08-fluids/wave-equation/update.glsl`. Sources use `sin(f·uTime)`, which is constant across substeps (`demos/wave-equation`, `new-demos/wave-rebuild`). The newer projects derive dt from `uPixelSize` (CFL), matching the July clock rules. Pointer impulses are applied once per substep, so brush strength scales with the iteration count.
4. **`uResolution` means "current target".** With `resolution: 'inherit'` (demos/ Schrödinger and wave-equation), dx and dt change with window size. The owner then moved everything to fixed grids plus `mathSpace`. That migration is the clearest signal of the intended resolution-domain design.
5. **The corpus is much narrower than the July capability space.** It has no multiple views, accumulation, data-texture particles, MRT, deep history, modify/blend writes, timelines or export logic. The path tracer, trail particles and three-view volume in PAPER_CHECK come from fixtures, not from this corpus.
6. **Entry-point name collision.** `examples/implicit-surface-tracer/shader.glsl:210` defines `vec3 shade(vec3 p, vec3 n, vec3 ro)`. Detection of `shade(Fragment)` must go by signature, not name.
7. **Small dead ends that show intent:**
   - the unused `trail` buffer in `new-demos/game-of-life`;
   - the dead `pressureIterations` and perturbation sliders;
   - the iterations enum that cannot be applied;
   - duplicate `init:` keys in several demos/ object literals;
   - `ui: 'color'` where the type says `'color-picker'`;
   - `TODO.md` asking for hidden params, because camera uniforms must be visible sliders today.
