# webgl-demos: engine and project model (independent study, verified by running)

Paths are relative to `/home/user/webgl-demos/`. Tags: **[RUN]** observed in headless Chromium, **[READ]** from code only, **[INFER]** reasoned, not observed.

## 0. What I ran, and what I could not

- `npm install` (45 packages; only gitignored `node_modules` created) and `npx vite build --outDir <scratch>/dist` both succeed. `git status` in webgl-demos is clean afterwards.
- Vite dev server plus Playwright Chromium, WebGL2 on SwiftShader (the three `--use-angle=swiftshader` flags).
- Loaded 80 object-form projects (`new-demos/*`, `examples/0*/*`) and 4 legacy ones, capturing console errors.
- Ran about 60 synthetic engine/App probes with float readback of buffer textures.
- Could not run: real GPU behaviour (SwiftShader only), anything needing a human eye beyond three screenshots, and the `build:all` Pages script (it writes inside the repo).
- Scratch files are in `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/wgd-engine/`: `t/engine.js`, `t/math.js`, `t/app.js`, `t/fmt.js`, `engine.out`, `all-demos.log`, `shots/`.

**Demo health [RUN]:**
- 66 of 80 object-form projects start; 14 do not.
- All 22 `demos/*` projects plus `examples/08-fluids/incompressible-fluid` use a legacy `passes: [{name, source, output}]` array. `compileProject` throws `TypeError: Cannot read properties of undefined (reading 'match')` (compiler.ts:86, reached via :560-575) and no canvas is created. I ran 4 of the 23; the rest are by the same code path.
- Failures the engine design itself causes:

| Project | Failure |
|---|---|
| `new-demos/image-pipeline`, `noise-gallery`, `volume-gallery` | `'pos'` / `'uv'` redefinition against the injected locals |
| `new-demos/particle-system` | `PI` / `TAU` undeclared in the vertex shader |
| `new-demos/fluid-2d` | "Pass 'velocity_diffuse' outputs to 'velocity_diffuse' but buffer does not exist" |
| `examples/01-basics/ui-buttons` | `'state'`, `'color'`, `'speed'` redefinition (a generated-uniform name clash) |
| `new-demos/compile-test` | feeds HTML to GLSL (see §8d) |

- The other 7 are content bugs: a missing `@lib/math/hash` (2), `sdStar` (2), bool×float, a vec2/vec3 mismatch, and the legacy example.

## 1. Project model as implemented

Types are in `src/project/types.ts`.

```ts
ProjectDefinition {                       // :13-121
  meta: { title: string; description?; author?; tags? }
  common?: string
  buffers?: Record<string, BufferConfig | BufferFormat>
  textures?: Record<string, TextureConfig>
  passes?: Record<string, PassInput>
  compiledPasses?: CompiledPass[]         // written back by compileProject (mutates input)
  computeIterationsPerFrame?: number
  mathSpace?: string | { aspect: number } // 'screen' | buffer name | {aspect}
  params?: Record<string, ParamConfig>
  presets?: Record<string, ParamValues>
}
BufferFormat = 'rgba8'|'rgb8'|'rg8'|'r8'|'rgba16f'|'rgb16f'|'rg16f'|'r16f'|'rgba32f'|'rgb32f'|'rg32f'|'r32f'
BufferConfig {                            // :163-258
  format: BufferFormat
  dimension?: '2d'|'3d'
  resolution?: 'inherit'|'initial'|[w,h]|[w,h,d]|{width,aspectRatio}|{height,aspectRatio}
  pingPong?: boolean                      // default TRUE (compiler.ts:135)
  filter?: 'nearest'|'linear'             // default nearest
  wrap?: 'clamp'|'repeat'                 // default clamp
  init?: [r,g,b,a] | string               // clear colour or fragment shader
}
TextureConfig { source: string; filter; wrap }   // all required; image URL only
PassInput = string | { shader: string; vertex?: string; geometry?: GeometryConfig; output?: string }
GeometryConfig = {type:'quad'} | {type:'cube'; instanceCount?}
               | {type:'grid'; subdivisionsX; subdivisionsY; sizeX?; sizeY?; instanceCount?}
```

- **Passes.** The key is the pass name and default target. `output` lets several passes write one buffer. Order is `Object.entries` order (compiler.ts:560).
  - A string pass whose key is not a buffer is rejected only at engine creation (Engine.ts:466). [RUN]
- **Params.** `float | int | bool | vec2 | vec3 | vec4 | enum` become uniforms under their bare name (compiler.ts:352-385); `button` and `text` produce none.
  - An unknown type such as the documented `'color'` silently yields no uniform. [RUN]
  - UI metadata: `min/max/step/label/group/overlay/ui`.
- **Formats.** `rgb16f` and `rgb32f` are not usable. 2D throws `FRAMEBUFFER_INCOMPLETE_ATTACHMENT`; 3D fails silently with GL error 1286, because the 3D path has no completeness check (Engine.ts:632). The other 10 work in 2D and 3D. [RUN]
- **Volumes.** A 3D buffer is a `TEXTURE_3D`. A pass targeting it is drawn once per layer via `framebufferTextureLayer`, with `uLayer` and `uLayerNorm` set (Engine.ts:859-893). Ping-pong works for 3D.
- **Geometry.** Built-in quad, cube and grid only, with a fixed contract: `aPosition/aNormal/aUV` at locations 0/1/2, `vPosition/vNormal/vUV` to the fragment shader (compiler.ts:411-416, 469-491; Core.ts:322-567).
  - Instancing is via `instanceCount` and `gl_InstanceID`.
  - There is no user vertex data, no points or lines.
  - Depth test applies only when geometry targets `screen` (Engine.ts:851). Blend is never enabled (Core.ts:726).
- **MRT:** none. One `out vec4 fragColor`, one colour attachment.
- **Readback.** `Engine.readBuffer(name | 'screen'): ImageData` (Engine.ts:349). It is broken; see §6.
- **JavaScript hooks.**
  - Lifecycle and time: `start/pause/resume/reset/stepOnce`, `setTimeMode`, `setFixedDeltaTime`.
  - Params: `setParam/getParam/applyPreset/restoreParamsToDefaults`.
  - `reloadPass(name, src)`.
  - Events `frame | paramChange | resize | shaderError | runtimeError` (App.ts:450-454).
  - `app.ui.addButton(label, cb, group)` (App.ts:108).
  - A layout is a function `(app, container) => void`.
  - There is no per-frame uniform callback. A JS-driven uniform must be a declared param set via `setParam`, which is how `OrbitCamera` and `PanZoomCamera` work (utils/OrbitCamera.ts:185-190).
- **Panel hooks.** `app.setCanvasContainer(el)` installs the ResizeObserver (App.ts:427). `app.setParamsPanel` (layouts/builders.ts:62) enables `addButton`. Panels reach `app.getEngine().readBuffer` and `app.getProject()`.

## 2. Everything injected into shaders

**Fragment assembly** (compiler.ts:399-447):
1. `#version 300 es`, `precision highp float;`
2. Varyings, if non-quad.
3. All uniforms.
4. `out vec4 fragColor;`
5. `PI`, `TAU`, `E` (:18-23).
6. `uvToIsometric`, `coverMap`, `toMathSpace` (:29-62).
7. `common`.
8. The source, with the coordinate injection.

**Vertex assembly** (:457-505): attributes, uniforms, varyings, `common`, source. It gets no constants, no coordinate functions and no injection.

**Built-in uniforms** (compiler.ts:296-308; the list was also printed at runtime):

| Uniform | Type | Meaning |
|---|---|---|
| `uResolution` | vec3 | w, h, aspect of the current target |
| `uScreenResolution` | vec3 | canvas |
| `uTime`, `uDeltaTime` | float | |
| `uFrame` | int | |
| `uMouse` | vec4 | xy in device px, bottom-left origin; zw is the click position while held, else 0 (App.ts:843-873) |
| `uMouseDelta` | vec2 | |
| `uMousePressed`, `uMouseButton` | float | |
| `uLayer` | int | |
| `uLayerNorm` | float | |
| `uMathSpace` | vec3 | w, h, aspect |
| `uPixelSize` | float | 1 / target height |
| `uModel`, `uView`, `uProjection` | mat4 | only for non-quad geometry |

**Samplers.**
- Each buffer `foo` becomes `uniform sampler2D foo;` (or `highp sampler3D`) plus `uniform vec3 uFooResolution;`. That vec3 is (w, h, aspect) in 2D and (w, h, depth) in 3D (compiler.ts:330-340; Engine.ts:1018-1026).
- Each texture becomes `uniform sampler2D name;` with no resolution uniform.
- Every buffer, texture and param is declared in every shader and bound by name every pass, one texture unit per buffer in map order (Engine.ts:1004-1047).

**"Previous" state has no name.** The bare buffer name always samples the `current` half (Engine.ts:1009-1011).
- In a pass writing `foo`, `foo` is the previous state.
- In any later pass, `foo` is the new state.
- There is no access to a second history level.

**Injected locals** are quoted in §8c.

## 3. Frame loop

- **Construction** (App.ts:119-164): `compileProject` (mutates), auto-add a "↻ Reset" button param if any buffer has an init shader (:501-538), create the canvas, then async `initialize`.
- **Engine init** (Engine.ts:109-126): validate, compile all pass programs, compile init programs, and return early on any error. Otherwise: create FBOs, load textures, create VAOs, set params, `runInitShaders`.
- **Loop** (App.ts:741-762):
  - `realtime` adds the wall delta to `simulationTime`.
  - `fixed` uses an accumulator and runs whole `updateAndStep` calls, display passes included, per fixed dt.
  - Each step writes `uTime/uDeltaTime/uMouse…` and pushes the entire param store into the engine (:764-792).
- **`Engine.step`** (Engine.ts:138-161):
  1. `_frame++`.
  2. Split passes by `output !== 'screen'`.
  3. Run the compute list in order, N times.
  4. Run screen passes once.

  Measured with N=4 and dt=0.25: a counter buffer reads `(4, 4·uFrame, 1.0)`. So `uFrame`, `uTime` and `uDeltaTime` are identical across iterations, the first frame has `uFrame == 1`, and there is no iteration index. [RUN]
- **Init details.**
  - Init shaders run into both halves in buffer-declaration order.
  - They can sample other buffers (measured: `b = a + 1 = 8`), they get `mousePos`, and `uFrame` is 0. [RUN] `docs/INIT_SHADERS.md:104-107` says otherwise.
  - **A colour `init` is not applied at creation.** A fixed-size buffer with `init: [1,0,0,0]` reads `[0,0,0,0]` at startup under `App`, and `[1,0,0,0]` only after `reset()`. `inherit` buffers get it at the first resize. [RUN] `initializeBuffer` is called only from `reset` (Engine.ts:171) and `resize` (:309).
- **Reset** (App.ts:199; Engine.ts:163): zero time, frame = 0, clear to colour, re-run init shaders; params are kept.
- **Resize** (Engine.ts:212-315): only `inherit` buffers and not-yet-frozen `initial` buffers are reallocated and re-initialised. State is wiped; frame and time continue.
  - `initial` freezes only once both sides are at least 800 px. Measured sizes: 300×150 → 500×400 → 900×850, then frozen. [RUN]
- **Hot reload** (App.ts:347; Engine.ts:318): recompile one pass, then reset (twice).

## 4. What a Shadertoy-shaped engine cannot express

1. Arbitrary named buffers, each with its own format, size, filter, wrap and init.
2. Buffers of different sizes in one project, with one math frame for `pos` (subject to §8b).
3. Sub-stepping: the compute list run N times per display frame.
4. Sequential pass semantics, and several passes writing one buffer in a frame.
   - Leapfrog: `new-demos/schrodinger-double-slit/main.ts:53-56`, where `updateReal` then `updateImaginary` both target `wavefunction`.
   - Operator splitting: the intended advect → diffuse → divergence → pressure → project pipeline in `new-demos/fluid-2d/main.ts`.
5. Non-ping-pong scratch targets, as in the `blurH`/`blurV` chains.
6. Init shaders that depend on params, plus colour inits, with Reset as a first-class action.
7. 3D volume targets written slice by slice, with ping-pong (heat-3d, wave-3d-volume and reaction-diffusion-3d all run [RUN]).
8. Rasterised geometry passes with custom vertex shaders and instancing; vertex shaders that sample state buffers.
9. Typed, grouped params with presets, overlay controls and buttons; fixed-timestep and step-once clocks; per-pass hot reload.
10. A frozen-at-startup resolution mode, and `{width | height, aspectRatio}` sizes.

**Wanted but not expressible here either:** per-pass iteration counts. `fluid-2d` declares a `pressureIterations` param (main.ts:115) that nothing can honour. Also missing: MRT, history deeper than 1, blending.

## 5. Docs that describe unimplemented or different behaviour

| Doc | Says | Code |
|---|---|---|
| PROJECT_GUIDE.md:546-549, COORDINATE_SYSTEM.md:94-122 | `mathSpace: {center, size}`; `pos` in ±5 | Only `'screen'`, a buffer name, or `{aspect}`. No scale or centre; y is always ±0.5 or more |
| PROJECT_GUIDE.md:264-265, 286-287, 299 | `pingPong` default false; `filter` default linear; `wrap: 'mirror'` | Default true; default nearest; no mirror |
| PROJECT_GUIDE.md:145, 166 | `type: 'color'`; vec2 `min: [..]` | No such type (no uniform emitted [RUN]); min/max are scalars |
| PROJECT_GUIDE.md:574, 686; README.md:166 | `uTimeDelta`, `uDate` | `uDeltaTime`; no `uDate` |
| PROJECT_GUIDE.md:575 | `uFrame` is 0, 1, 2… | First pass frame sees 1 |
| PROJECT_GUIDE.md:374; 3D_RENDERING.md:105-108, 344-345; PASS_PATTERNS.md (all examples) | Examples declare `vec2 uv` / `vec3 pos` in `main`, or redeclare `uniform sampler2D buf` | Redefinition compile errors [RUN] |
| PASS_PATTERNS.md:68-128; 3D_RENDERING.md | `@/passes/*`, `@/params/*`, `ParamDefinitions`, `createRaymarchPass`… | None exist (`src/passes`, `src/params` absent) |
| 3D_RENDERING.md:99; INIT_SHADERS.md:188 | `uniform float uLayer`; `uLayer / uResolution.z` | `int uLayer`; `uResolution.z` is aspect (measured 1 for a 4³ volume; depth is in `u<Name>Resolution.z`) |
| 3D_RENDERING.md:488 | Mipmaps | None |
| INIT_SHADERS.md:104-107, 314, 343 | No other buffers or `mousePos` in init; `demos/simple-diffusion`, `simple-wave` | Both available; those demos do not exist |
| VERTEX_SHADERS.md:590-651, 818, 955 | `passes: [{name, source, vertexSource, output}]` | That array API throws [RUN] |
| VERTEX_SHADERS.md:751-753; NEXT_STEPS (`uProjection * uView` throughout) | Matrix uniforms | Unusable (§8f). Line 1148 does admit JS matrices are a "future enhancement" |
| README.md:14-28 | ProjectManager/ProjectEditor panels; "Four pre-built layouts" | Not in `src/panels`; templates are `fullscreen/params/sidebar/split/teaching` (app/types.ts:122) |
| index.html:20-49 | Lists about 12 demo paths | They do not exist |
| PAGES-TODO.md | Publishes `demos/` (scripts/build-all.mjs:39) | All of `demos/` is legacy-broken at runtime |

## 6. Engine bugs and weaknesses, beyond those in §8

1. **`mousePos` is mis-registered in buffers whose aspect differs from the canvas** (§8b). [RUN]
2. **Colour `init` is ignored at startup** for fixed-size buffers (§3). [RUN]
3. **3D with a colour init.** Never applied at creation. `reset()` raises GL 1286 and clears only the last-attached layer (layers read `[0,1,2,0.5]`). [RUN]
4. **`readBuffer`** reads `pair.main`, not `current`. Stale on odd frames (frame 1: 0 against 26; frame 3: 51 against 77). On float buffers it gives GL 1282 and zeros. [RUN]
5. **Time.**
   - After `reset()` in realtime, the next frame has `uTime = uDeltaTime = 1.44 s`, which was page uptime.
   - After a 1.5 s pause, dt is 1.53 s.
   - In fixed mode, reset triggered 298 steps in 300 ms. [RUN]
   - Cause: App.ts:206 with :746 and :178.
6. **`uPixelSize = 1 / target height`** (Engine.ts:984) ignores math space. Measured 0.0156 against a true spacing of 0.03125 for a 64² buffer under a 2:1 math space. [RUN]
7. **Non-ping-pong self-read:** GL 1282, the draw is silently skipped, no engine guard. [RUN]
8. **Partial writes are impossible.** A discarded fragment exposes the texel from two steps ago, not the previous one. [RUN]
9. **`uLayerNorm`** is NaN at depth 1. [RUN]
10. **No name validation** across buffers, params and built-ins. A buffer named `screen` is accepted and breaks. [RUN]
11. **`step()` after compile errors** throws an opaque `getUniformLocation` TypeError. [RUN] `App` avoids this by not starting.
12. **Performance and hygiene.** [READ]
    - `getUniformLocation` for every uniform, every pass, every frame (Core.ts:598).
    - All buffers are bound to every program, with no unit limit check.
    - Shaders leak on a compile failure (Core.ts:79-83).
    - Grid indices are `Uint16`, which breaks beyond 255×255 (Core.ts:462).
    - The identical `normalizeBufferConfig` is copied three times (compiler.ts:117, Engine.ts:19, App.ts:33).
13. **A failed hot reload** leaves the bad source in `project.passes` (App.ts:359-363). [READ]

**Worth carrying forward as ideas:**
- Buffers as named resources with declarative format, size and init. The buffer name is the sampler name, and the pass key is the target.
- One-string shorthand for the common cases (`buffers: {a: 'rgba16f'}`, `passes: {a: src}`).
- Init as a shader with access to params, and a Reset that re-runs it with current params.
- Global sub-stepping.
- A project-level math frame decoupled from pixel sizes. The idea is right; the implementation is not.
- A target-aware `uResolution` plus a separate screen resolution.
- Collecting all compile errors and de-duplicating common-code errors across passes (ShaderErrorAnalyzer.ts:299).
- The source-map design of `ShaderPreprocessor` (a per-line `{file, line}`).
- Sizing modes `initial` and `{width, aspectRatio}`.
- Slice-loop volume targets.
- The clear layering: Core is GL only, Engine is resources and passes, App is time, input and events.
- Cameras as controllers that write named uniforms.

## 7. Line counts

| Directory | Files | Lines |
|---|---|---|
| src/app | 2 | 1271 |
| src/core | 1 | 844 |
| src/engine | 3 | 1661 |
| src/project | 6 | 2107 |
| src/utils | 2 | 470 |
| src/layouts | 2 | 414 |
| src/panels | 23 | 5167 |
| src/shaders | 45 | 4505 |
| src/styles | 6 | 633 |
| **src total** | | **17085** |
| scripts | 1 | 344 |
| vite.config.js | 1 | 83 |
| docs | 21 | 13327 |
| demos (legacy) | 101 | 9954 |
| new-demos | 129 | 10857 |
| examples | 146 | 8482 |

## 8. Verdicts on `1-webgl-demos-engine.md`

### (a) "Every pass swaps immediately, so semantics are sequential only": VERIFIED [RUN]

Trace:
1. `executePass` picks the non-current FBO as target (Engine.ts:835-836).
2. `bindAllUniforms` binds `current` for every buffer, including the target's own (:1009-1011).
3. Draw.
4. `current` flips immediately (:910-912).

This holds inside each of the N compute iterations; nothing is deferred to frame end.

Measured with A (`a += 1`) and B (copies `a`):
- Order A,B: B sees 1, 2, 3 (this frame's A).
- Order B,A: B sees 0, 1, 2 (the previous iteration's A).
- With N=3: A,B gives 3, 6, 9; B,A gives 2, 5, 8.
- Two passes on one buffer: `[1,1], [2,3], [3,6]`. The second sees the first's write.

So: a buffer written earlier in the iteration reads as new, one written later reads as the previous iteration's value, and a pass's own target reads as its previous state.

Projects whose results depend on the order:
- `new-demos/schrodinger-double-slit` and `schrodinger-periodic`: `updateImaginary.glsl:52` needs the `re` written by `updateReal.glsl:52` in the same sub-step. Both run. [RUN]
- `examples/08-fluids/smoke-simulation`: velocity, then density.
- `examples/03-buffers/blur-multi-pass`.
- `new-demos/fluid-2d`, by intent; it is currently broken.

### (b) "`mathSpace` gives one frame across buffer sizes, mouse in that frame": PARTLY; true for `pos`, false for `mousePos` [RUN]

Let the target be W×H with aspect A, and the math aspect be M (from the canvas, a named buffer, or `{aspect}`; Engine.ts:1179-1206).

- `uv = gl_FragCoord.xy / (W,H)` and `pixel = ivec2(gl_FragCoord.xy)` are per-target.
- `pos` fits the math rectangle [-M/2, M/2] × [-0.5, 0.5] inside the target, centred ("contain"):
  - A ≥ M: `pos = ((u − 0.5)·A, v − 0.5)`.
  - A < M: `pos = ((u − 0.5)·M, (v − 0.5)·M/A)`.
  - Measured on a 400×200 canvas with `mathSpace: 'sq'` (64²): screen x ±1, y ±0.5; sq ±0.5 both; tall 32×64 x ±0.5, y ±1.
  - So a `pos` value names the same point in every target. The `coverMap(uv, uResolution.xy, uBufResolution.xy)` used by the display shaders agrees with it.
- `mousePos = toMathSpace(uMouse.xy / uScreenResolution.xy * uResolution.xy, …)`. This is the canvas uv re-interpreted as the target's uv, a stretch mapping.
  - It equals the shared-frame position only on the screen pass or when A equals the canvas aspect.
  - Measured with the mouse at canvas uv (0.25, 0.25): the screen frame says (−0.5, −0.25), the `sq` buffer pass gets (−0.25, −0.25).
  - Confirmed on the real `new-demos/wave-equation` at a 1020×400 canvas: a click at x=153 px produced the ripple at x≈370 px, exactly the predicted (0.15 − 0.5)/2.55 + 0.5. Screenshot: `shots/mouse-wave.png`.
- `uPixelSize` is wrong whenever A < M (§6.6).
- An unknown buffer name warns on every bind and falls back to the screen (Engine.ts:1198).

### (c) "Regex-spliced locals": VERIFIED [RUN]

Code (compiler.ts:71-94):

```ts
const STANDARD_COORDINATES_INJECTION = `
    // === Standard Coordinates (auto-injected) ===
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    ivec2 pixel = ivec2(gl_FragCoord.xy);
    vec2 pos = toMathSpace(gl_FragCoord.xy, uResolution.xy, uMathSpace.xy);
    // Mouse: normalize to [0,1] then convert to current render target's math space
    vec2 mousePos = toMathSpace(uMouse.xy / uScreenResolution.xy * uResolution.xy, uResolution.xy, uMathSpace.xy);
`
const mainMatch = source.match(/void\s+main\s*\(\s*\)\s*\{/)
if (!mainMatch || mainMatch.index === undefined) return source
return source.slice(0, insertPos) + STANDARD_COORDINATES_INJECTION + source.slice(insertPos)
```

Failure cases, all compiled in the browser:

| Case | Result |
|---|---|
| `void main(void)` or `#define ENTRY void main()` | No injection; `'uv' : undeclared` |
| `// void main() {` earlier in the file | Declarations land at global scope: "global variable initializers must be constant expressions" |
| `/* void main() { … */` earlier | Injection swallowed by the comment |
| A user local `vec2 uv` / `vec3 pos` in `main` | Redefinition. Three shipped demos hit this |
| Helper functions and `common` | Cannot see `uv` / `pos` |
| A user function named `pos` or `pixel` | Shadowed inside `main`: "function name expected" |
| A user global `pos` | Silently shadowed |
| A user `uniform float uTime;` | Redefinition |
| A user's own `out` | Error |

Brace on the next line and a nested-scope redeclaration are fine. The vertex shader is not injected at all.

### (d) "The runtime `#include` preprocessor is dead code": PARTLY; the "no callers" claim is REFUTED

- Build-time expansion is real: `glslAliasPlugin` (vite.config.js:8-31) plus `vite-plugin-glsl` (:36-50).
- A raw runtime string containing `#include` fails with `'include' : invalid directive name`. [RUN]
- The production bundle contains no `ShaderPreprocessor` code (grep of `dist` for its error string returns 0). [RUN]
- But `new-demos/compile-test/main.ts:20, 151-156, 232` does call `compileProjectWithPreprocessing` with a `ViteFileResolver` and passes `sourceMaps` to `App`.
- That demo is broken. It fetches `./common.glsl.txt` (:30), which does not exist. Vite returns `index.html`, giving `ERROR: 0:33: '<' : syntax error`. [RUN]
- Two node scripts (`new-demos/*/test-preprocessing.ts`) and `ShaderPreprocessor.test.ts` also reference it; `package.json` has no test runner.
- Net: effectively dead, but it is an intended feature with one wired-up, non-working consumer.

### (e) "Error line mapping is wrong": VERIFIED [RUN], with corrections

- User error on true line 4 with no `common`: reported as line 76, the raw compiled line (ShaderErrorAnalyzer.ts:143-146).
- With a 3-line `common`: reported 51. That is off by 47: 40 unaccounted core lines plus 7 injected lines (the report says 6).
- An error before `main`: reported 41 for true line 1, off by 40.
- New finding: an error inside `common` is reported correctly (line 2), but only by accident. `common` is also pasted into the vertex shader, which compiles first (Core.ts:40) and has no core block, so the vertex formula happens to be right.

### (f) "Matrix uniforms cannot work": VERIFIED [RUN]

- A cube with the default vertex shader compiles, then `step()` throws `Error: Invalid uniform array length: 16` (Core.ts:621).
- `setParameter('uModel', …)` gives `Parameter 'uModel' not found` (Engine.ts:186).
- A custom vertex shader that ignores the matrices runs.

### Other claims in the report

| Claim | Verdict |
|---|---|
| §3: "clear colour or init shader drawn into both halves at creation" | **REFUTED** for colour (§3 above); true for shaders |
| §5: "No demo uses PanZoomCamera" | **REFUTED**: `new-demos/fractal-explorer/main.ts:17,143` |
| §6.2: `common` + `PI` breaks vertex shaders ("inferred") | **VERIFIED** [RUN]; it is what breaks `new-demos/particle-system`. `fragColor` in `common` fails the same way |
| §6.5, 6.6, 6.7, 6.8, 6.9, 6.14 | **VERIFIED** [RUN] |
| §6.6: "no Y flip" | **PARTLY**: true of the engine; `BufferViewerPanel.ts:155-158` flips it itself |
| §6.10, 6.12, 6.13; §1; §2 | **VERIFIED** [READ] |
| §6.11: "`uMouseDelta` spikes on pointer-down" | **PARTLY** [INFER]: only if the pointer jumped without a move event (touch) |
| §6.15: "VERTEX_SHADERS.md presents matrices as working" | **PARTLY**: it lists them (751-753) but line 1148 defers JS matrices |

**Missed by the report:** the `mousePos` mis-registration, `uResolution.z` being aspect for 3D targets, the `rgb16f`/`rgb32f` failures, init shaders reading other buffers, the pause/resume time jump, discard exposing two-step-old data, string-pass keys breaking `fluid-2d`, and the measured 14 of 80 broken current-form projects.
