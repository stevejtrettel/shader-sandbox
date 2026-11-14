# webgl-demos corpus inventory (105 projects: demos 24, examples 51, new-demos 30)

**Method.** Read in full: the three rebuild docs, `src/project/types.ts`, the compiler's injection and pass normalisation, and `Engine.step`. Read every `project.ts`/`main.ts` structurally (buffers, passes, iterations, params, all JS after the definition). Shaders were mostly grep-skimmed; about 12 were read. "Broken" verdicts are inferred from code and nothing was run.

**Old-engine semantics (verified).**
- Passes are an object; execution order is key insertion order.
- Key = output buffer unless `output:` is given.
- Every pass swaps its ping-pong buffer immediately, so everything is implicitly sequential-commit.
- `computeIterationsPerFrame: N` repeats all non-screen passes N times, then runs screen passes once.
- 3D outputs loop over layers with `uLayer`/`uLayerNorm`.
- Init is a colour or a shader, and reset re-runs it.

## A. Inventory

Columns: buffers | passes | iterations/frame | interaction | axes. "SL" = stateless, 1 screen pass, pixels, one view. Value sources are controls only unless noted.

**demos/** (old array-of-passes API; boilerplate `main.ts` with hand-built DOM layout)

| Project | Maths / visual | Buffers | Passes | It | Interaction | Axes |
|---|---|---|---|---|---|---|
| easing-showcase | easing curves | – | 1 | 1 | params | SL |
| image-distortion | mouse lens on earth.png | image texture | 1 | 1 | mouse | SL + image resource |
| spinning-cube | rotating cube | – | 1 cube geometry | 1 | params | SL, vertices |
| wavy-plane | sum-of-sines ocean | – | 1 grid 128² | 1 | camera sliders | SL, vertices |
| lorenz-attractor | 5000 instanced cubes; RK4 re-integrated from seed in the vertex shader | – | 1 instanced | 1 | params | SL, instances |
| bloom | scene→bright→blur→composite | 3 rgba8 canvas-size | 4 | 1 | – | DAG, no feedback |
| buffers-test | 3 colour fills | rgba8 512²/256²/128² | 4 | 1 | 1 param | DAG, mixed sizes |
| rd-noise | Gray-Scott | rgba32f `{width:512, aspect:1}` | 2 | 1 | params | 1 feedback field, snapshot |
| wave | wave equation, mouse | rgba32f 512² (`uWave`) | 2 | 10 | mouse | 1 field, repeat |
| wave-test | wave equation | rg32f 512² | 2 | 10 | params | same |
| wave-equation | wave with refractive slabs | rg32f canvas-size | 2 | 10 | params | same, canvas-sized sim |
| schrodinger-double-slit, schrodinger-periodic | leapfrog ψ; clamp vs repeat wrap | rg32f canvas-size | updateReal, updateImag (same buffer), display | 10 | init-condition sliders | 1 field, sequential commits |
| volume-3d | slice viewer | 64³ rgba16f, init shader | 1 | 1 | slice slider | static volume |
| sphere-volume-raymarch, sphere-raymarch-tiled | fuzzy sphere; repeat-wrap tiling | 64³ init shader | 1 | 1 | OrbitCamera | static volume |
| blob-mip, sphere-volume-isosurface | animated blob, MIP / isosurface | 64³ | generate → view | 1 | orbit | volume regenerated per frame |
| blob-clipped | blob → clip plane → MIP | 2×64³ | 3 | 1 | orbit | volume DAG |
| vector-field | 3D vector field | 64³ | 2 | 1 | orbit | volume as vector data |
| wave-3d | 3D wave, slice view | 2×64³ ping-pong (position, velocity), repeat wrap | velocity, position, display | 2 | sliders | coupled volumes, sequential |
| wave-3d-raymarch | same, raymarched | 3×64³ (extra display volume) | velocity, position, colour-map, raymarch | 2 | orbit | coupled volumes + convert pass (runs 2×, should be per-frame) |
| panels-test | rd-noise in a 7-panel layout | – | – | – | – | layout only |
| OLD_WAVE | orphan Shadertoy-era wave shaders | – | – | – | – | no project file |

**examples/**

| Project | Maths / visual | Buffers | Passes | It | Interaction | Axes |
|---|---|---|---|---|---|---|
| 01-basics ×4 (uv-gradient, animated-rings, mouse-follow, aspect-correct) | basics | – | 1 | 1 | mouse-follow uses mouse | SL |
| 01/ui-buttons | fading feedback | rgba8 512² | same shader for `state` and `screen` | 1 | JS buttons | 1 field; scripts |
| 02-parameters ×7 | each param type, groups, presets | – | 1 | 1 | params | SL |
| 04-noise ×6, 05-sdf ×8, 06-color ×5 | library showcases | – | 1 | 1 | params/presets | SL |
| 03/simple-buffer, buffer-formats, blur-multi-pass | pipelines; one shader bound to rgba8/16f/32f targets | 1–3 fixed | 2–4 | 1 | params | DAG |
| 03/feedback-trail, paint-canvas, init-shader | mouse trail / paint / init | 1 ping-pong fixed | 2 | 1 | mouse, R key | 1 field |
| 03/compute-iterations | heat diffusion | r32f 256² | 2 | 5 | mouse, enum "iterations" | 1 field, repeat |
| 07-CA ×4 (game-of-life, cyclic-ca, majority-rule, totalistic-rules) | cellular automata | rgba8 512² nearest | 2 | 1 | mouse brush | 1 field, snapshot |
| 08/reaction-diffusion | Gray-Scott | rg32f 512² | 2 | 1 | brush | 1 field |
| 08/wave-equation, 09-layouts ×4 | wave equation, (u, u_prev) in RG | rg32f 512², `mathSpace:'state'` | 2 | 3 | brush | 1 field; 09 varies layout only |
| 08/smoke-simulation | buoyant smoke | velocity rg32f + density rgba32f 256² | velocity, density, display | 1 | brush | coupled fields, sequential |
| 08/incompressible-fluid | stable fluids | velocity, dye, pressure, divergence 256² | 26 passes: 20 hand-unrolled Jacobi | 1 | brush | coupled + iterative solve |
| implicit-surface-tracer | linkage configuration-space surface | – | 1 | 1 | OrbitCamera | SL + controller |

**new-demos/**

| Project | Maths / visual | Buffers | Passes | It | Interaction | Axes |
|---|---|---|---|---|---|---|
| noise-gallery, metaballs | noise types; smooth-min blobs | – | 1 | 1 | sliders | SL |
| sdf-primitives, raymarched-scene, noise-3d, raytracer-implicit-surfaces | raymarch / raytrace | – | 1 | 1 | OrbitCamera | SL + controller |
| fractal-explorer | Mandelbrot/Julia | – | 1 | 1 | PanZoomCamera, keys | SL + controller + script |
| particle-system | 5000 instanced cubes, analytic motion, view/projection built in the vertex shader | – | 1 instanced | 1 | orbit | SL, instances |
| image-pipeline | generate→blur→edges→grade→final | 4 rgba8 canvas-size | 5 | 1 | params | DAG |
| interactive-painting | paint with decay/blur | rgba8 canvas-size | 2 | 1 | mouse, Ctrl+C | 1 field, view-sized |
| game-of-life | CA rule sets | r32f 256² + unused `trail` | 2 | 1 | brush, keys | 1 field |
| reaction-diffusion | Gray-Scott, presets | rg32f 512² | 2 | 3 | brush, keys | 1 field + script |
| heat-equation, heat-equation-conductivity | heat, variable κ | r32f 1024² | 2 | 3 | mouse source | 1 field |
| wave-equation, -confined, -uiuc, -uiuc-2, -refraction, wave-rebuild, compile-test | wave variants; uiuc-2 is 3000×2048 | rg32f | 2 | 3 (wave-rebuild 1) | ripples | 1 field |
| schrodinger-double-slit, schrodinger-periodic | leapfrog ψ + mouse perturbation | rg32f 1024² | 2 writers to one buffer via `output:` | 10 | sliders, mouse | sequential commits |
| fluid-2d | stable fluids | velocity rg32f, pressure r32f, divergence r32f, dye rgba8, 512² | 7; velocity written 3× | 1 | `uMouse.zw` drag | coupled; one Jacobi sweep per frame |
| heat-3d, wave-3d-volume, reaction-diffusion-3d (128³), cellular-automata-3d | volume PDE / CA, raymarched | 1 ping-pong volume | 2 | 3/2/5/1 | orbit + 2D mouse with a `brushLayer` slider | volume cells, feedback |
| wave-3d | 3D wave, slice view | 64³ | 2 | 2 | slice slider | volume feedback |
| volume-gallery | procedural volumes | 64³; init shader reused as per-frame pass | 2 | 1 | orbit | volume regenerated |

## B. Coverage

**Named in the paper check:** `new-demos/schrodinger-double-slit`, `new-demos/fluid-2d`, `new-demos/wave-equation-uiuc`. `demos/sphere-raymarch-tiled` is mentioned only as unrelated.

**Fixtures with a corpus analogue:**
- `fluid/` ≈ fluid-2d and incompressible-fluid.
- `volume-rd/` ≈ reaction-diffusion-3d.
- `particles/` shares only the Lorenz theme: the corpus version is stateless and instanced, with no data texture.
- `wave-surface/` has no counterpart: wavy-plane is analytic, and no corpus project feeds a buffer into geometry.
- `pathtracer/` has no counterpart: there is no accumulation anywhere in the corpus.

**Paper-check discrepancy.** PAPER_CHECK §2 writes `Repeat(uPressureIterations)`, but in fluid-2d `pressureIterations` is declared and never used. The source does one Jacobi sweep per frame, warm-started. The real iterative-solve evidence is incompressible-fluid's 20 unrolled passes.

**Corners with no fixture:**
1. Coupled volumes with sequential commits (wave-3d, wave-3d-raymarch).
2. A volume regenerated each frame feeding a volume-to-volume pass (blob-clipped).
3. One shader as both init and per-frame pass (volume-gallery), or bound to several targets and formats (buffer-formats, ui-buttons).
4. Image-file textures (image-distortion).
5. Canvas-sized simulation state and re-init on resize (schrodinger in demos/, interactive-painting, demos/wave-equation).
6. Aspect-derived resolution (rd-noise) and `mathSpace` tied to a buffer.
7. Mixed-resolution DAGs (buffers-test).
8. Wrap mode as boundary condition (schrodinger-periodic, sphere-raymarch-tiled).
9. Painting into a volume from a 2D mouse plus a layer slider.
10. Built-in instanced cube/grid meshes with in-shader matrices.
11. Pan-zoom controller.
12. Presets, button params, keyboard scripts.
13. `#include` library and shared `common`.
14. Time-mode toggling (pause via `setTimeMode`).

## C. Recommended acceptance tests

1. **new-demos/schrodinger-double-slit** — two commits to one resource; ordering is the method. Also tests `resetOn` for the init sliders.
2. **examples/08-fluids/incompressible-fluid** — a real 20× solve, to be written as `Repeat`; velocity committed three times.
3. **new-demos/fluid-2d** — same graph, warm-started single sweep, `uMouse.zw` drag delta.
4. **demos/wave-3d-raymarch** — coupled volumes, symplectic order, and a convert pass that must move out of the repeat (multi-rate).
5. **new-demos/reaction-diffusion-3d** — 128³ volume, 5 steps, reset button, presets, brush on a layer.
6. **examples/08-fluids/smoke-simulation** — the smallest mutually coupled pair; snapshot versus sequential gives different numerics.
7. **demos/blob-clipped** — stateless volume DAG with an orbit controller.
8. **new-demos/volume-gallery** — init shader reused as a pass, time-dependent init.
9. **demos/lorenz-attractor** and **new-demos/particle-system** — instanced geometry with no state. Contrast with the `particles/` fixture.
10. **demos/wavy-plane** — grid mesh and depth; baseline for `wave-surface/`.
11. **new-demos/fractal-explorer** — pan-zoom controller plus key script writing the same params (uniform conflict rule).
12. **new-demos/reaction-diffusion** — script glue: reset, pause, preset then reset.

## D. Imperative JavaScript (complete; verified by grep and reading)

- **OrbitCamera** (pointer and wheel listeners, `setParam` on `cameraRotationY/X`, `cameraZoom`): 7 demos/ volume projects, implicit-surface-tracer, sdf-primitives, raymarched-scene, noise-3d, raytracer-implicit-surfaces, particle-system, heat-3d, wave-3d-volume, reaction-diffusion-3d, cellular-automata-3d, volume-gallery. The camera values must be declared as visible slider params; TODO.md asks for `hidden` params.
- **PanZoomCamera**: fractal-explorer. Also R resets the camera and M toggles `fractalType` via `getParam`/`setParam`.
- **Reset keys**: paint-canvas, init-shader, compute-iterations, game-of-life, reaction-diffusion (R); interactive-painting (Ctrl+C).
- **Space toggles `setTimeMode`** realtime/fixed: game-of-life, reaction-diffusion.
- **Keys 0–5**: reaction-diffusion does `setParam('preset')` then `reset()`.
- **`app.on('paramChange')`**: compute-iterations maps the enum to an iteration count, then cannot apply it. There is no API to change iterations at runtime.
- **`app.ui.addButton`**: ui-buttons (log, randomise colour, pause/resume, canvas info), wave-sidebar (log), wave-teaching (prints the formula from params). wave-split notes buttons are unavailable in that layout.
- **Definition-time JS**: totalistic-rules' `ruleToBitmask` computes preset bitmasks; incompressible-fluid lists 20 Jacobi passes by hand.
- **Custom DOM layouts**: 11 demos/ projects, panels-test, compile-test.
- **Async compile**: compile-test (`fetch`, `compileProjectWithPreprocessing`, source maps).
- **Not found anywhere**: per-frame callbacks, manual uniform uploads, CPU texture uploads, readback.

## E. Broken, unfinished, duplicated

- **All of demos/**: `passes` is an array with `source:`; the current compiler expects an object with `shader:`. Seventeen directories also redeclare `vec2 uv`, which collides with the injected name. Likely non-functional.
- **demos/OLD_WAVE**: no project file; uses `iResolution`, `gl_FragColor`, hand-declared uniforms.
- **demos/panels-test**: only a layout harness around rd-noise.
- **demos/wave-test, buffers-test; new-demos/compile-test**: test scaffolds. compile-test fetches `common.glsl.txt`, which does not exist, and both `test-preprocessing.ts` files are the same refraction script.
- **Root `index.html`**: lists about ten demos that no longer exist (heat, blob-transfer, wave-lens, schrodinger-test and others).
- **examples/08 incompressible-fluid**: old array API, and its shaders redeclare auto-generated uniforms. smoke-simulation, 08/reaction-diffusion and ui-buttons also redeclare uniforms, which is probably a redefinition error.
- **new-demos/fluid-2d**: dead `pressureIterations` slider.
- **new-demos/game-of-life**: `trail` buffer is read but never written.
- **examples/03/compute-iterations**: the iterations enum has no effect.
- **new-demos/schrodinger-periodic**: `update.glsl` is byte-identical to `updateReal.glsl`.
- **Duplicate families**:
  - wave equation: about 14 variants; the four 09-layouts copies differ only in layout.
  - Schrödinger: four.
  - Gray-Scott: four.
  - Game of Life: two.
  - implicit tracer: two.
  - wave-equation-uiuc, -uiuc-2 and -confined share one title.
- **demos/wave-3d-raymarch, volume-3d and others**: duplicate `init:` keys in one object literal.

## F. Entry style and names

- **Entry point**: 230 of 236 shader files use `void main()` writing `fragColor`. No `mainImage`, no `shade()`. OLD_WAVE alone uses `gl_FragColor` and `i*` names.
- **Injected at the top of `main`**: `uv`, `pixel` (ivec2), `pos` (aspect-correct math space), `mousePos`. Rough usage by file count: `uv` 143, `pos` 105, `mousePos` 37, `pixel` 33. About 90 files still use raw `gl_FragCoord`.
- **Built-ins**:
  - `uTime`, `uDeltaTime`, `uResolution` (target-relative) and `uMousePressed` (32 files) are in common use.
  - `uScreenResolution`, `uLayer`/`uLayerNorm`, `uMathSpace`, `uPixelSize`, the per-buffer `u<Name>Resolution` and raw `uMouse` (8 files) are used occasionally.
  - `uFrame`, `uMouseDelta` and `uMouseButton` are never used.
  - `uModel`/`uView`/`uProjection` are declared for geometry but no shader reads them.
- **Geometry**: attributes `aPosition`/`aNormal`/`aUV`, varyings `vPosition`/`vNormal`/`vUV`, `gl_InstanceID`. particle-system adds its own `vColor`.
- **Inconsistencies**:
  - Buffers are sometimes `u`-prefixed (`uWave`, `uScene`, `uChemicals`), mostly bare (`state`, `wave`).
  - Params are always bare camelCase; OLD_WAVE used `uFrequency`.
  - Pass keys double as output names, forcing ad-hoc suffixes (`velocity_diffuse`, `wavefunction_real`).
  - The same choice is typed `enum` in some projects and `int` in others.
  - Camera params use magic names coupled to OrbitCamera.
  - Mouse is read three ways: `mousePos`, `uMouse.xy/uResolution`, `uMouse.xy/uScreenResolution`. Only the first and last are right in fixed-size buffers.
  - Drag is detected by `uMousePressed` in most places and by `uMouse.zw` in fluid-2d.
  - Texel access mixes `texelFetch(pixel)` and `texture(uv ± texel)`.
  - `#include` uses `@lib/...` aliases almost everywhere, with a few relative paths.
  - Previous state is always channel-packed; there is no `prev` binding.
