# webgl-demos engine and project model: findings from code

**Basis.** Everything below is from reading the code in `/home/user/webgl-demos/src` unless marked "inferred". Two things were also executed: `compileProject` on a toy project under node, to confirm line offsets and the vertex-shader assembly. Nothing was run in a browser, so GL-side failures are read from the code, not observed. Paths are relative to `/home/user/webgl-demos/src/`.

## 1. Project definition model (`project/types.ts`, `project/compiler.ts`)

`ProjectDefinition` (types.ts:13-121) has these fields:

- **`meta`**: `title` (required), `description`, `author`, `tags`.
- **`common`**: a GLSL string prepended to every fragment and vertex shader.
- **`buffers`**: `Record<name, BufferConfig | BufferFormat>`. A bare format string is shorthand (compiler.ts:117-140).
  - `format`: 12 options, `{r,rg,rgb,rgba} x {8,16f,32f}` (Core.ts:729-815). No integer, depth or sRGB formats.
  - `dimension`: `'2d'` or `'3d'`.
  - `resolution`: `'inherit'` (tracks canvas), `'initial'` (freeze canvas size), `[w,h]`, `[w,h,d]` (required for 3D), `{width, aspectRatio}`, `{height, aspectRatio}` (Engine.ts:1137-1167).
  - `pingPong` (default **true**), `filter` (default nearest), `wrap` (default clamp).
  - `init`: an RGBA clear colour or a fragment-shader string.
- **`textures`**: `{source, filter, wrap}`, all required. Image URL only, uploaded as RGBA8 with no mipmaps and no flipY (Core.ts:218-259).
- **`passes`**: `Record<key, string | {shader, vertex?, geometry?, output?}>` (types.ts:290-312).
  - The key is the pass name and the default output; `output` overrides it so several passes can write one buffer.
  - Order is object insertion order (compiler.ts:560).
  - `geometry`: `quad`, `cube` (`instanceCount?`), or `grid` (`subdivisionsX/Y`, `sizeX/Y`, `instanceCount?`).
  - There are no per-pass options for blend, depth, clear, iterations, or declared reads.
- **`compiledPasses`**: compiler output, written back onto the author's object. `compileProject` mutates in place (compiler.ts:551).
- **`computeIterationsPerFrame`**: one global integer.
- **`mathSpace`**: `'screen'`, a buffer name, or `{aspect}`.
- **`params`**: `float`, `int`, `bool`, `vec2`, `vec3`, `vec4`, `enum` (an int), `button` (no uniform; `action: 'reset' | 'randomize' | string`), `text` (no uniform).
  - UI metadata: `min/max/step/label/group`, `overlay`, `ui` (`numeric | sliders | 2d-pad | color-picker`).
  - There are no `mat`, array, or hidden params.
- **`presets`**: named param snapshots, applied by `App.applyPreset` (App.ts:319).

Validation is limited to GLSL-identifier checks on buffer, texture and param names (compiler.ts:247-275) and "pass output exists" (Engine.ts:457-472). The "u prefix" that the type comments mention is not enforced. Name collisions (a buffer called `screen`, a param versus a built-in) are not checked.

## 2. What the author writes and what is injected

- **Entry point.** The author writes a plain `void main()` that assigns `fragColor`.
- **Assembly order** (compiler.ts:399-447): `#version 300 es`, `precision highp float`, optional varyings (`vPosition/vNormal/vUV`), all uniforms, `out vec4 fragColor`, core constants (`PI`, `TAU`, `E`), core functions (`uvToIsometric`, `coverMap`, `toMathSpace`), `common`, then the source.
- **Coordinate injection is textual.** A regex `/void\s+main\s*\(\s*\)\s*\{/` finds the first match and splices four local declarations after the brace (compiler.ts:71-94):
  - `uv` = `gl_FragCoord.xy / uResolution.xy`
  - `pixel` = `ivec2(gl_FragCoord.xy)`
  - `pos` = math space: y in [-0.5, 0.5], aspect-scaled x, cover-mapped from the target into `uMathSpace`
  - `mousePos` = `uMouse` rescaled from screen to target, then into math space
  
  These are locals of `main`, not globals, macros or a wrapper. Helper functions and `common` cannot see them.
- **Built-in uniforms** (compiler.ts:296-308):
  - `uResolution` (vec3: w, h, aspect of the current target) and `uScreenResolution`.
  - `uTime`, `uDeltaTime`, `uFrame` (int).
  - `uMouse` (vec4: xy in device pixels with bottom-left origin; zw is the click position while held, otherwise 0).
  - `uMouseDelta`, `uMousePressed` (float), `uMouseButton` (float).
  - `uLayer` (int) and `uLayerNorm`, for 3D targets.
  - `uMathSpace` (vec3) and `uPixelSize` (1 / target height).
  - `uModel`, `uView`, `uProjection`, only for non-quad geometry.
- **Per buffer**: `uniform sampler2D <name>` (or `highp sampler3D`) under the bare buffer name, plus `u<Name>Resolution` as a vec3: (w, h, aspect) for 2D, (w, h, d) for 3D.
- **Everything is declared in every shader.** There are no channel bindings; buffers, textures and params are bound by name each pass (Engine.ts:1004-1047).
- **Mouse** (App.ts:821-873): pointer events on the canvas, DPR-scaled. Delta is computed per step.

## 3. Frame loop and execution

- **Time** (App.ts:741-803): `realtime` uses the wall delta. `fixed` uses an accumulator and runs whole `updateAndStep` calls (display passes included) per fixed dt. `stepOnce()` is used by the recorders.
- **`Engine.step`** (Engine.ts:138-161):
  1. `frame++`, so the first frame sees `uFrame == 1`.
  2. Passes are split by `output !== 'screen'`.
  3. The whole compute list runs in order, N times.
  4. Screen passes run once.
  
  `uTime`, `uDeltaTime` and `uFrame` are identical across iterations, and there is no iteration-index uniform.
- **Ping-pong** (Engine.ts:831-912): a pass writes the non-current texture and swaps immediately after its draw.
  - Every sampler reads `current`. A pass reading its own output sees the previous write.
  - Any later pass, in the same iteration, sees the new value. The semantics are sequential (Gauss-Seidel), never snapshot.
  - Two passes writing one buffer therefore form a leapfrog. This is how the Schrödinger demo works; it is deliberate, and it is encoded in pass order.
- **`pingPong: false`**: writes `main` in place. Sampling its own output would be a GL feedback loop, and nothing guards against it.
- **3D targets**: one draw per layer via `framebufferTextureLayer`, with `uLayer` and `uLayerNorm` set (Engine.ts:859-893).
- **Init**: the clear colour or init shader is drawn into both halves of the pair at creation and on `reset()`.
- **Resize** (Engine.ts:212-315): only `inherit` buffers and not-yet-frozen `initial` buffers are reallocated. They are re-initialised, so state is wiped, but frame and time continue.
- **`App.reset`** zeroes time and re-initialises buffers but keeps params.
- **`reloadPass`** recompiles one pass and resets.
- **Auto reset button**: a "Reset" button param is added when any buffer has an init shader (App.ts:501-538).

## 4. Includes and error mapping

There are two include mechanisms, and only one is live.

- **Live: build-time.** `vite-plugin-glsl` expands `#include` when a `.glsl` file is imported. A custom pre-plugin rewrites `#include "@lib/x"` to a relative path into `src/shaders/lib` (vite.config.js:8-33). The runtime only ever sees flattened strings.
- **Dead: runtime `ShaderPreprocessor`.**
  - It expands `#include "..."` recursively, detects circular includes, and keeps a per-line `{file, line}` source map.
  - It tracks `#define` symbols to skip repeated `#ifndef` blocks (ShaderPreprocessor.ts:107-208).
  - Resolvers: `MemoryFileResolver`, and `ViteFileResolver` (fetch, aliases, cache).
  - It is wired only into `compileProjectWithPreprocessing` (compiler.ts:613), which handles `common` only and has no callers in `src/`, `demos/`, `examples/` or `new-demos/` (grep-verified).
  - So `AppOptions.sourceMaps` is never populated in practice.
- **`ShaderErrorAnalyzer`** parses `ERROR: 0:N:`, subtracts the computed boilerplate, classifies the error as common versus pass, optionally maps through the common source map, and dedupes common errors across passes with `affectedPasses`.

## 5. Cameras (`utils/`)

Neither camera produces matrices. Both are DOM listeners that call `app.setParam` on author-declared float params.

- **`OrbitCamera`**: drag for yaw and clamped pitch, wheel for distance. Writes `cameraRotationY`, `cameraRotationX`, `cameraZoom` (names configurable). The shader builds its own ray or camera from those floats.
- **`PanZoomCamera`**: drag to pan, wheel to zoom about the cursor. Writes `centerX`, `centerY`, `zoom`. It assumes the world is 2 units tall at zoom 1, whereas `pos` is 1 unit tall. No demo uses it.
- Both attach alongside the App's own mouse handlers, so `uMouse` and `uMousePressed` also fire while dragging.
- The params must be declared, so they appear as sliders. The root `TODO.md` asks for `hidden`.

## 6. Unimplemented, broken or suspicious

1. **Matrix uniforms cannot work.**
   - `Core.bindUniform` throws on a length-16 array (Core.ts:610-623), and there is no `uniformMatrix4fv` anywhere.
   - `Engine.setParameter` and `App.setParam` reject `uModel`, `uView` and `uProjection` (Engine.ts:186, App.ts:291).
   - The default 3D vertex shader (compiler.ts:513-527) would therefore throw on its first frame. Working geometry demos build their matrices in GLSL.
2. **`common` is prepended to vertex shaders without the core constants** (compiler.ts:493-498, confirmed by execution). Any `common` that references `PI` or `TAU`, or fragment-only symbols such as `fragColor`, `gl_FragCoord` or `dFdx`, would fail the auto-generated vertex shader of every pass. That is inferred from the assembled text, not GL-tested.
3. **Error line mapping is wrong.**
   - The analyzer omits the 40 lines of core constants and functions. In my toy compile, `common` starts at line 66 where its formula gives 26.
   - It ignores the 6 lines injected inside `main`.
   - With no `common` it reports the raw compiled line as the original line (ShaderErrorAnalyzer.ts:143-146).
4. **Injection is fragile.**
   - `void main(void)` gets no injection.
   - A commented-out `void main() {` earlier in the file captures it.
   - A user local named `uv`, `pos`, `pixel` or `mousePos` is a redefinition error.
5. **Reset while running corrupts time.** `App.reset()` sets `lastFrameWallTime = 0` (App.ts:206). The next `loop` computes delta as time since page load, so `uTime` jumps, and in fixed mode the accumulator runs a huge catch-up loop. Shader hot-reload hits the same path.
6. **`readBuffer` is unsound** (Engine.ts:349-373).
   - It reads `pair.main`, not `current`, so it can be stale for ping-pong buffers.
   - It reads `RGBA/UNSIGNED_BYTE` from float FBOs.
   - For 3D it reads whichever layer was last attached.
   - There is no Y flip. The buffer viewer and recorders depend on it.
7. **3D buffers and colour init.** `reset()` clears the FBO, which has one layer attached, or none before the first draw. A 3D buffer with a colour init is never fully cleared.
8. **The `'initial'` resolution only freezes once both dimensions are at least 800 px** (Engine.ts:241-248). On smaller canvases it silently behaves as `inherit`.
9. **`uLayerNorm` is `layer / (depth - 1)`**, which is NaN for depth 1.
10. **Grid indices are `Uint16`** and overflow above roughly 255 x 255 subdivisions. There is no blending anywhere. Depth testing exists only for geometry drawn to screen, and colour is never cleared.
11. **Mouse details.** `uMouseDelta` spikes on pointer-down and is zero on catch-up steps. `uPixelSize` is wrong when the cover-map crops Y.
12. **Custom button actions only `console.log`** (ParamsPanel.ts:527). `text` params reach no shader.
13. **A failed hot reload leaves the failing source** in `project.passes` and `compiledPasses`.
14. **Stale demos.** 22 projects under `demos/`, plus `examples/08-fluids/incompressible-fluid`, use an older `passes: [{name, source, output}]` array. The current compiler reads `input.shader`, so these would throw. This is inferred from the code, not run. `scripts/build-all.mjs` builds `demos/`.
15. **Docs versus code.** `docs/UTILITIES_GUIDE.md` lists a `KeyboardController` that does not exist in `src/utils`. `docs/VERTEX_SHADERS.md` presents the matrix uniforms as working.

## 7. Fit against the six concepts

- **Sequential commit is the only semantics here.** The rebuild defaults to snapshot (D027). Every multi-pass corpus project (leapfrog Schrödinger, velocity-then-position waves) relies on swap-per-pass and needs an explicit sequential schedule when ported. The same holds for several passes writing one buffer, each seeing the last.
- **`computeIterationsPerFrame`** maps to `stepsPerFrame`. Here "compute" simply means "does not write to screen", and intermediate display-prep buffers are iterated too.
- **`mathSpace`** is a project-global coordinate frame, decoupled from each target's resolution, with cover-mapping. `pos` and `mousePos` agree across buffers of different sizes. `Fragment.coord` is per-target, with unit half-height versus 0.5 here. I see no home for a shared frame or a pointer in that frame. `uScreenResolution`, `uPixelSize` and the `u<Name>Resolution` uniforms belong to the same gap.
- **Implicit locals in a hand-written `main()`.** The rebuild's "ordinary GLSL" entry never rewrites the body. Corpus shaders need porting to `shade(Fragment)` or a compatibility shim.
- **Bare buffer names as samplers, every resource visible to every pass.** The rebuild wants declared reads. These would have to be inferred from the source.
- **Init shaders** take the full uniform set, including params, and re-run on reset and resize. Resize wipes `inherit` state. This maps to resource init plus resize policy. A "Reset" button that re-runs init with the current params is a UI action close to `resetOn`, but user-triggered.
- **`'initial'` resolution** (capture the canvas size once, then freeze) is a size mode not in the "fixed, view-relative, or explicit" list. The same goes for `{width | height, aspectRatio}`.
- **3D targets as slice loops** with `uLayer` and `uLayerNorm` map to the Cells domain and `compute(Cell)`. The names differ.
- **Params** carry `overlay` (on-canvas controls), `ui` variants, `presets`, `button` and `text`. The rebuild covers buttons as UI actions. Presets and overlay placement need a home under uniforms, controls or views.
- **Cameras** are controllers that write named scalar uniforms. This fits Systems well, but they emit floats, not matrices.
- **Time modes** (`realtime` / `fixed` accumulator / `stepOnce`) and the App event bus (`frame`, `paramChange`, `resize`, `shaderError`, `runtimeError`) are runtime API with no place in the six concepts. Also in this group: `app.ui.addButton`, layout builders, and per-pass hot reload.
- **Geometry** covers only built-in cube and grid, with `instanceCount` and `gl_InstanceID`. There are no custom buffers. Particles read state textures in the vertex shader. The fixed attribute and varying contract is `aPosition/aNormal/aUV` to `vPosition/vNormal/vUV`.
- **Not present here**, so nothing to preserve: MRT, history deeper than 1, blend state, cubemaps, video, timelines, multiple views (one canvas, with `screen` passes drawn in order over each other).
