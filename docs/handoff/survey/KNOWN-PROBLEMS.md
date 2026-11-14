# Known problems, verified

Everything here was established in this pass. **Run** means observed by
executing; **read** means established from the source; **inferred** means
reasoned but not executed. File and line numbers refer to `main` of each
repo on 14 November 2026. More detail and more items are in the numbered
reports.

## shader-sandbox

### Engine and loader (`reports/1`)

| Problem | Where | Evidence |
|---|---|---|
| `common.glsl` is placed before the uniform declarations, so a function in it cannot use `iTime`, `iResolution`, channels or custom uniforms. Shadertoy's Common tab can | `src/engine/shaderSource.ts:122-294` | Run (generated source printed) |
| Named buffers are BufferA to BufferD renamed: four at most, run in JSON key order, every sampler bound in every pass. The key order silently decides whether a cross-buffer read is this frame or last | `src/project/loadProjectCore.ts:724-800` | Read |
| `mode` is never read by the engine. `mode: "shadertoyy"` is silently treated as standard | `shaderSource.ts:136`, loader | Run |
| Built-in uniforms are written out in at least eight places, and the lists have drifted: the reserved-name list lacks `iMousePressed` | `shaderSource.ts:138-207`, `ShaderEngine.ts:773-802, 1088-1150, 399-419`, `engine/types.ts:49-69, 193-206`, `configHelpers.ts:89-95`, `exportHTML.ts:397-405, 638-644` | Read, run |
| `iChannelTime` and `iSampleRate` are not declared; pasted shaders that mention them will not compile | grep of `src/` | Read |
| Keyboard texture row 1 (pressed this frame) is never written | `glHelpers.ts:333-376` | Read |
| Keyboard helper functions are injected only when a sampler is literally named `keyboard` | `shaderSource.ts:178` | Run |
| Cubemap support is a text rewrite that breaks on `f(a) + g(b)`, `normalize(rd) * m`, `vec3(x).zyx`, three-argument `texture`, and rewrites inside comments | `shaderSource.ts:299-320` | Run |
| Error lines: found by searching for marker comments. A user line reading `// User shader code` shifts the mapping. Live-edit errors are not mapped at all | `shaderSource.ts:274-288`, `ShaderEngine.ts:562`, `editor/EditorPanel.ts:353` | Run |
| `reset()` does not clear the last step time, so the next frame has a negative `iTimeDelta` | `ShaderEngine.ts:474-506` | Run: logged `[-37.5, 0.01667]` |
| Every window resize reallocates all buffers and resets the project, including time | `ShaderEngine.ts:448-468`, `ShaderView.ts:130-142`, `App.ts:210-217` | Read |
| Float render targets are required; there is no half-float or 8-bit fallback | `ShaderEngine.ts:738-747` | Read |
| Only `precision highp float` is declared; `int` and samplers take the default precision | `shaderSource.ts` | Read; effect on mobile inferred |
| `readPixels` looks a pass up by `BufferA`-style name, so a named-buffer project cannot read its own buffers | `ShaderEngine.ts:209-213`, `App.ts:326` | Read |
| `data: "file.json"` for array uniforms cannot load through `loadDemo` (dev server and built folders), because JSON files are not visible to that loader | `loaderHelper.ts:78-86, 162` | Run with a fake file map; not in a browser |
| Array uniform bookkeeping: a short `setArrayUniform` followed by `setArrayElement` past the end leaves the stored value and the GPU out of step; `setStructArrayUniform` with a shorter field array wipes later elements, against its documentation | `UniformManager.ts:154-169, 274-298, 350-405` | Run with a fake GL |
| Config validation gaps: `iChannel0: "bufferA"` (wrong case) becomes a texture path; `iChannel0: 5` throws a raw TypeError; a buffer may be named `iTime`; `min > max` accepted; a scalar with `count` silently becomes an array | `configHelpers.ts`, `loadProjectCore.ts` | Run |
| The engine writes into the project object it was given during recompiles | `ShaderEngine.ts:588, 609, 637, 655` | Read |
| `tsc` fails on a fresh checkout until `src/project/generatedLoader.ts` is generated | `src/main.ts:18` | Run |
| Stale comments: uniforms "must be declared" (`types.ts:672`); `readPixels` "returns Uint8Array" (`types.ts:781`); theme default "light" (`types.ts:607`); editor header says CodeMirror (`EditorPanel.ts:5`); several files cite `docs/engine-spec.md`, which does not exist | | Read |

### Frame loop, capture, export (`reports/2`)

| Problem | Where | Evidence |
|---|---|---|
| `Transport` is a wall-clock stopwatch. The offline renderer computes time itself and uses `Transport` only to pause and restore | `Transport.ts`, `OfflineRenderer.ts:52-57, 166-169` | Read |
| First frame of every recording or buffered still has `iTimeDelta = startTime − last live time` | `OfflineRenderer.ts`, `ShaderEngine.ts:474-506` | Run |
| A shader with no buffers that is driven by `onFrame` gets no `onFrame` call for an HD still | `OfflineRenderer.ts:118-121` | Run: `onFrame calls: 0` |
| Offline rendering does not update keyboard, video or audio textures, and the mouse is fixed at zero | `OfflineRenderer.ts:56` | Read |
| `iDate` is wall clock in export | `ShaderEngine.ts:388` | Read |
| Stills with buffers are stepped from t = 0 at a hard-coded 60 fps | `OfflineRenderer.ts:108` | Read |
| No tiling and no check against `MAX_TEXTURE_SIZE`, although the presets go to 8K with 2× supersample | `panel-kit.ts:11-17` | Read |
| The whole MP4 is buffered in memory; encoder errors are only logged; support is tested only by `typeof VideoEncoder` | `Mp4Encoder.ts:18-20, 88-106` | Read |
| WebM goes through `MediaRecorder`, which stamps frames by wall clock | `OfflineRenderer.ts:281-321` | Inferred |
| `exportHTML.ts` holds a second player of about 520 lines as a string. It embeds the engine's exact compiled shaders, but re-implements everything else and differs: textures become a grid, buffer filter and wrap are ignored, no touch uniforms, struct setters do nothing, no pause or reset. Tests check the string only; the player is never executed | `exportHTML.ts:176-724` | Read |
| The `frame` argument to `onFrame` is `statsPanel?.totalFrameCount ?? 0`: constant 0 with stats off, 1-based with stats on, 0-based offline, while `iFrame` is 0-based | `App.ts:520`, `StatsPanel.ts:68-69` | Run: `0,0,0,0` and `1,2,3` |
| Two unrelated visibility mechanisms. One skips frames while time runs on; the other pauses the clock and resumes unconditionally, overriding a manual pause. No `visibilitychange` handling | `App.ts:246-252`, `runtime.ts:496-515` | Read |
| S, Space and R are bound on every focused shader with no opt-out. S downloads a PNG | `App.ts:696-723` | Read |
| Multi-view is a separate project type: one WebGL context and full engine per view, no author toolbar, no export, dev server only. Its controls promise a screenshot button that is not there | `types.ts:721-742`, `mount.ts:208-256`, `MultiViewControls.ts:7` | Read |
| Custom elements read their attributes once; changing an attribute later does nothing. Loading both runtime builds on one page would define the elements twice | `runtime.ts` | Read; second part inferred |
| The standalone runtime is 513 kB (119 kB gzipped), of which 135 kB is the video muxer that no viewer can reach. Each built shader folder carries about 500 kB with no sharing | build output | Run |
| No test covers `App`, `ShaderView`, `OfflineRenderer`, `InputManager`, `mount` or the elements | `tests/` | Run |

### Controls and styles (`reports/4`)

| Problem | Where | Evidence |
|---|---|---|
| Sliders do not follow a value set by a script or by `handle.setUniform` | `App.ts:411-423` never calls `UniformsPanel.setValue` | Run |
| The screenshot and recording dialogs open with default slider values, not current ones, and edits there do not move the main sliders | `ScreenshotPanel.ts:248`, `RecordingPanel.ts:271` | Run |
| After a lost WebGL context the engine restarts with default values while sliders keep the old ones | `ShaderView.ts:337-346` | Inferred |
| Setting `data-theme="dark"` on the host page's `<html>` makes the package's colour variables apply to the page | `theme.css:224` | Run |
| A reduced-motion rule applies `transition-duration: .01ms !important` to every element of the embedding page | `app.css:639-645` | Read |
| Unprefixed global class names (`.tab-button`, `.stat-item`, `.control-button`) and `:root` variables | `app.css`, `split.css` | Run |
| Fixed element ids `rec-fmt-*` clash when two instances are on one page | `RecordingPanel.ts:195-229` | Read |
| The editor is destroyed and rebuilt on every tab switch, losing undo history | `EditorPanel.ts:250-254` | Read |
| Accessibility: no ARIA, 3 of 12 inputs named, pad and colour swatch not keyboard-operable, dialogs do not trap focus or close on Esc | | Run (census) |

### CLI, scaffolds, docs (`reports/3`)

| Problem | Where | Evidence |
|---|---|---|
| Saving a file in `shader dev` reloads the whole page; time, buffers and slider values are lost | no hot-module code anywhere | Read |
| Scaffolded `main.ts` sets `window.app = handle.app`, which is always undefined | `templates/main.ts:82` | Read |
| README shows `const handle = mount(...)` for a built module, but that `mount` is async | `README.md:305` | Read |
| Built `main.js` mounts itself into `#app` on import; a host page with its own `#app` gets a second mount | `bin/cli.js:520-535` | Read |
| The CLI has one flag (`--force`): no port, host or output options | `bin/cli.js` | Read |
| No CI; two FIX_PLAN gates that called for WebGL tests were never met | `FIX_PLAN.md:43, 123` | Read |
| The README still recommends an unpinned CDN URL, so sites using it receive any new release the day it is published | `README.md:320` | Read |
| The published 0.2.7 tarball contains a generated loader hard-wired to one demo | registry tarball | Run |

### Changes between published 0.2.7 and `main` that the first handoff missed

1. Built `main.js` auto-mounts into `#app` (added in commit `3e82ce9`).
2. With `controls: true`, viewers no longer get screenshot, record and
   export buttons; those now need `authorTools`.
3. The fetch loader throws on any failure other than 404. Hosts that
   answer 403 for missing optional files now fail (host behaviour
   inferred).
4. More config errors: invalid `uniformsUI`; `buffers` or `textures` in
   Shadertoy mode; invalid `filter` or `wrap`; impossible `current: true`.
5. Config that used to be ignored now takes effect: `pixelRatio`,
   standard-mode channel bindings, Shadertoy-mode `uniforms`, named-buffer
   `filter` and `wrap`; multi-view default theme changed from light to
   auto.
6. Space and R are always active on a focused shader.
7. Real-time "Record Video" was removed.
8. More library exports removed than listed, including the type
   `RecompileResult` that `MountHandle.recompile` returns.
9. `vite` moved to devDependencies; `engines.node >= 18` added.
10. `create .` refuses to overwrite without `--force`.
11. The `shader-sandbox-0.2.7.tgz` that was once committed to git is not
    the registry 0.2.7; its CLI matches the later commit `3e82ce9`.

## webgl-demos

### Engine (`reports/5`)

| Problem | Where | Evidence |
|---|---|---|
| `mousePos` is wrong in any buffer whose aspect ratio differs from the canvas: the canvas position is reused as the buffer position | `src/project/compiler.ts:77` | Run: click at x = 153 px, ripple at about 370 px |
| `uPixelSize` is 1 / target height regardless of the math frame | `Engine.ts:984` | Run: 0.0156 against a true 0.03125 |
| Injected `uv`, `pos`, `pixel`, `mousePos`: not injected for `void main(void)`; a commented-out `void main() {` earlier in the file captures the injection; a user variable of the same name is an error; helpers and `common` cannot see them | `compiler.ts:71-94` | Run, all cases |
| Matrix uniforms cannot be set; the default 3D vertex shader throws on its first frame | `Core.ts:610-623`, `Engine.ts:186` | Run |
| `common` goes into vertex shaders without `PI`, `TAU`, `E` | `compiler.ts:493-498` | Run (breaks `particle-system`) |
| Error lines for user code are off by 40 to 47 | `ShaderErrorAnalyzer.ts:143-146` | Run |
| A colour `init` on a fixed-size buffer is not applied at startup | `Engine.ts:171, 309` | Run |
| `rgb16f` and `rgb32f` buffers do not work; the 3D case fails silently | `Engine.ts:632` | Run |
| `readBuffer` reads the stale half of a ping-pong pair and returns zeros for float buffers | `Engine.ts:349-373`, `Core.ts:686-701` | Run |
| Time: after `reset()` the next frame's time and delta equal page uptime; a pause adds its duration on resume; fixed mode then runs hundreds of catch-up steps | `App.ts:178, 206, 746` | Run: 298 steps in 300 ms |
| A non-ping-pong buffer that reads itself fails silently | | Run |
| `discard` exposes the texel from two steps ago | | Run |
| The `initial` size mode freezes only once both sides reach 800 px | `Engine.ts:241-248` | Run |
| No validation of names across buffers, params and built-ins; a buffer named `screen` is accepted and breaks | | Run |
| A pass whose key is not a buffer and has no `output:` is rejected only when the engine starts (this is what breaks `fluid-2d`) | `Engine.ts:466` | Run |
| Uniform locations are looked up for every uniform, every pass, every frame | `Core.ts:598` | Read |

### Documentation that does not match the code (`reports/5` §5)

- `mathSpace: {center, size}` is documented in `COORDINATE_SYSTEM.md` and
  `PROJECT_GUIDE.md`. The code accepts only `'screen'`, a buffer name or
  `{aspect}`. There is no way to say "this field is [−5, 5]²".
- `PROJECT_GUIDE.md` gives the wrong defaults for `pingPong` and `filter`,
  documents a `'color'` param type and `wrap: 'mirror'` that do not exist,
  and names `uTimeDelta` and `uDate` (the real name is `uDeltaTime`; there
  is no date).
- Examples in `PASS_PATTERNS.md`, `3D_RENDERING.md` and `PROJECT_GUIDE.md`
  declare their own `uv` or `pos`, which now fails to compile.
- `PASS_PATTERNS.md` and `3D_RENDERING.md` import from `@/passes` and
  `@/params`, which were deleted.
- `VERTEX_SHADERS.md` uses the old array form of `passes` and presents
  matrix uniforms as working.
- `LAYOUTS_GUIDE.md` and `PANELS_GUIDE.md` describe layouts and panels
  that do not exist.
- `SHADER_LIBRARY.md` says 35 files; there are 44.
- Root `index.html` links to about a dozen demos that do not exist.

### Panels (`reports/4`)

- `detach()` is never called; `app.destroy()` leaves panel DOM,
  subscriptions and the body theme attribute behind (run).
- Frame-time graph canvas is 0×0 and never drawn (run).
- Buffer viewer: upside-down for 8-bit buffers, zeros for float (run).
- Vector sliders, the 2D pad and numeric vector inputs do not follow a
  preset or a programmatic change (run).
- Randomize sets an enum to NaN (run).
- The pause button does not follow an external pause (run).
- Custom button actions only log to the console.

### Projects that do not run (`reports/6` §2a, `data/corpus-run-results.jsonl`)

- All of `demos/` (24): the old array form of `passes`.
- `examples/`: `01-basics/ui-buttons`, `02-parameters/toggle-switch`,
  `05-sdf/displacement`, `05-sdf/morphing`,
  `08-fluids/incompressible-fluid`, `08-fluids/reaction-diffusion`,
  `08-fluids/smoke-simulation`.
- `new-demos/`: `cellular-automata-3d`, `compile-test`, `fluid-2d`,
  `image-pipeline`, `noise-gallery`, `particle-system`, `volume-gallery`.

Causes: name clashes with injected names (7), a missing
`@lib/math/hash` file (2), a missing `sdStar` function (2), old pass
format (1 outside `demos/`), and individual type errors.

### Numerical issues in projects (`reports/6` §7, `reports/8` §2.3)

- 15 shader files use the wall-clock frame time as the simulation time
  step. Newer projects derive it from `uPixelSize`.
- Time-dependent sources use `uTime`, which is constant across the steps
  within one frame.
- Mouse impulses are applied once per step, so brush strength scales with
  the number of steps per frame.
- The four `examples/09-layouts/wave-*` demos sample a square buffer
  straight onto a non-square canvas, so circular waves look oval. An
  unmerged commit (`79183bc` on `claude/simplify-webgl-layout`) fixes the
  display mapping but pairs a physically scaled Laplacian with a time step
  about 13 times over the stability limit.

## GLSL library (`reports/7`)

All confirmed by executing the GLSL unless marked.

| Function | File | Problem | Called by projects |
|---|---|---|---|
| `laplacian9PointZeroBoundary` | `stencils/laplacian.glsl:160-267`, `simulation/stencils.glsl:211-318` | Boundary branches fire on row and column 1, not the edge; right and top branches never fire; row-1 stencil sums to +2. As a matrix it has positive eigenvalues (largest +0.798 on a 16×12 grid), so the wave equation on it has growing modes | 5 |
| `paletteViridis` | `color/palettes.glsl:59` | Mean RGB distance 0.51 from matplotlib's viridis; not monotone in luminance; leaves the gamut | 21 shader files |
| `laplacian19Point` | `simulation/stencils3d.glsl:141` | Returns −2 on a constant, 8 on x²+y²+z² (exact: 0 and 6). Correct weights: faces 1/3, edges 1/6, centre −4 | 0 |
| `laplacian27Point` | `simulation/stencils3d.glsl:198` | Returns −1.185 on a constant, 3.556 on x²+y²+z² | 0 |
| `dampedWaveStep` | `simulation/pde.glsl:102-113` | Solves u_tt + (γ/2)u_t = (c²/2)∇²u: period long by √2, decay half the intended rate | 0 |
| quaternion module | `math/quaternion.glsl` | Mixes (w,x,y,z) and (x,y,z,w) layouts: `quatMul(I, I) = −I`; `quatToMat3` gives the inverse rotation | 0 |
| rotation matrices | `math/rotate.glsl` | All rotate by −θ; self-consistent, undocumented | 2 |
| `simplex3d` | `noise/simplex3d.glsl` | Degenerate on x=y=z (jumps up to 0.73); small jumps (3.6e-3) across simplex faces from the 0.6 kernel radius | 6 |
| `perlin2d`, `perlin3d` | `noise/perlin.glsl` | Gradient angle is a linear function of the lattice coordinates; range ±0.51 and ±0.58, not ±1 | 3 |
| `curl3d` | `noise/curl.glsl:29-48` | Normalised, so not divergence-free | 2 |
| `worley` F2 | `noise/worley.glsl` | Wrong in 3.87% of samples | 3 |
| `easeInElastic`, `easeOutElastic` | `math/easing.glsl:134, 140` | Jump at the endpoint (phase 0.1 where 0.075 is needed) | 1 |
| `sdCone`, `sdTriPrism` | `sdf/primitives3d.glsl` | Bounds, not distances, though labelled as distances | 3 |
| `opRevolution` | `sdf/operations.glsl:54` | Returns its input | |
| `setupCamera` | `raymarching/implicit.glsl:185` | Mirrored left to right | 1 |
| `srgbToLinear`, `luminance` | `color/spaces.glsl` | 2.2 power and Rec. 601 weights | 1 |
| `coordinates3d` | `math/coordinates3d.glsl:47` | z has no half-voxel offset while x and y do | 7 |
| whole file | `simulation/fluids.glsl` | Does not compile (`curl2D` signature) | 2 |
| whole file | `effects/convolution.glsl`, `effects/morphology.glsl` | Do not compile (`sample` is reserved) | 0 |
| include guard | `noise/curl.glsl` and `stencils/curl.glsl` | Share the guard `CURL_GLSL`; the second is silently dropped | |
| duplicate definitions | `stencils/laplacian.glsl` with `simulation/stencils.glsl` | Cannot be included together | |
| missing file | `@lib/math/hash` | Included by two projects; does not exist | 2 |

The scripts that produced these numbers are in
`tools/glsl-test-harness/`. To rerun: install `vite-plugin-glsl@1.5.4`
next to them, point the path constants in `harness.mjs` at a webgl-demos
checkout, and run each `t*.mjs` with Node. Playwright with a Chromium that
has WebGL2 is required.
