# Branch sweep: independent verification of `5-branch-sweep.md`

Nothing was modified; I used only `git log / show / diff / ls-tree / grep / merge-base / cherry`. Both clones are now **non-shallow** (`git rev-parse --is-shallow-repository` is false in each), so every merge status below is exact.

## 0. Headline corrections to the previous report

1. **The abandoned coordinate branch is `claude/shader-authoring-examples`, not `standardize-shader-coords`.** `standardize-shader-coords` was merged (PR #44, `73e28ca`) and is where `mathSpace` comes from. The earlier attempt, made the evening before, ends on a revert and was never merged. The previous report's body had this right; the summary handed to me had it swapped.
2. **shader-sandbox `old-version` and `hopf` are ancestors of main, not unrelated history.** Main is one linear 296-commit history starting 2020-11-17; `old-version` is its commit #10 and `hopf` its commit #3. The "no merge base" finding was a shallow-clone artefact.
3. **shader-sandbox has its own deleted plan and spec docs in main's history**, which the previous report missed entirely (section 3.4).
4. **There is a branch the previous report did not list:** `origin/claude/vigilant-cori-w3l5ce`, identical to main (`f428d90`). `claude/sharp-planck-2kc13q` is no longer "same commit as main"; it is 3 ahead.
5. **The two wave fixes are not equivalent**, and neither is complete (section 2.3).
6. **No written review or critique documents exist on any `claude/*review*` branch.** The "reviews" exist only as API-change commits and their commit messages.
7. **One near-miss on claim (a):** the deleted 41 KB webgl-demos roadmap contains a function-shaped entry-point sketch (`vec4 update(vec2 uv, vec4 current)` / `vec3 visualize(vec4 state)`), the nearest ancestor of `compute(Cell)` / `shade(Fragment)`.

## 1. Claim-by-claim verdicts

| Claim | Verdict | Evidence |
|---|---|---|
| (a) No second forgotten design; `shade(Fragment)` only in `docs/architecture/` | **VERIFIED, with one nuance** | `git log --all -S` for `struct Fragment`, `Fragment f`, `struct Cell`, `compute(`, `RuntimePlan`: zero commits in webgl-demos. In shader-sandbox, `shade(Fragment` first appears in `6daf8aa` and only under `docs/architecture/` (DECISIONS, PROJECT_MODEL, README, ROADMAP). Nuance: the template sketch in the old roadmap (item 7 above). |
| `shade(` elsewhere is only a lighting helper | **VERIFIED, and understated** | webgl-demos `examples/implicit-surface-tracer/shader.glsl:210`. Also on shader-sandbox main: `demos/examples/circumradius-linkage/surface.glsl:135` (`vec3 shade(vec3 p, vec3 n, vec3 ro)`) and `demos/examples/linkage-levelset-torus/image.glsl:154` (`vec3 shade(Hit, Light, vec3, vec3)`). Entry-point detection (D022) must therefore be by signature, not by name. |
| `mathSpace` is on webgl-demos main in 25 files | **VERIFIED** | `git grep -l mathSpace origin/main` gives 25. It is absent from shader-sandbox on every ref. |
| (b) Abandoned coordinate branch, one unmerged wave fix, deleted design docs | **PARTLY** | All three exist, but the branch is misnamed (item 1), equivalence was unchecked (item 5), and the deleted-doc list was incomplete (section 2.4). |
| (c) `old-version` holds about 30 Shadertoy-style scenes | **VERIFIED** | 30 directories under `scenes/` (29 plus `test`), each `main.js` + `shadertoy.glsl`. None of the 30 `shadertoy.glsl` blobs exists in main's current tree. They were deleted in `874efdb` (2025-11-16). |
| `rebuild` and `old` are ancestors of webgl-demos main | **VERIFIED** | `merge-base --is-ancestor` is true for both. |
| `review-shader-system` was rebased in | **VERIFIED** | Its tip tree equals main commit `4b64f99` (empty `git diff`). `git cherry` marks 21 of 24 commits `+` only because main squashed them. |
| `shader-authoring-examples` is 23 ahead, 71 behind | **VERIFIED** | Merge-base `cddb1d1`. I count 92 blobs never in main's history; the report said 95. |
| `raytracer-implicit-surfaces` has 3 commits after PR #47 | **VERIFIED** | `99c2462`, `f3cca53`, `ba23ea6`, touching only `scripts/build-all.mjs` and `.github/workflows/pages.yml`. |
| shader-sandbox `rebuild` is one commit: 28 files plus a `DESIGN.md` pointer | **VERIFIED** | `6daf8aa`, 29 files, 2,768 insertions. |
| `docs/ARCHITECTURE.md` identical on main and every Claude branch | **VERIFIED** | Same blob `24be0b4` on all ten. |
| File counts "not on main's tip" (77 / 37 / 24 / 23) | **PARTLY** | I get 78 / 38 / 25 / 24; `old` 63 and `rebuild` 5 match. |

## 2. webgl-demos (main `8550da7`, 433 commits, 2025-11-12 to 2026-08-13)

### 2.1 Per-branch table

"Behind / ahead" is main-only / branch-only commits.

| Branch | Tip | Merge-base | Behind / ahead | Branch-only dates | Verdict |
|---|---|---|---|---|---|
| `old` | `95c5504` | itself | 415 / 0 | n/a | Fully merged (history). Original JS framework. |
| `rebuild` | `5486a6d` | itself | 413 / 0 | n/a | Fully merged (history). Spec for the TS rewrite main implements. |
| `claude/comprehensive-demos` | `b49e1c0` | itself | 102 / 0 | n/a | Fully merged (PR #41). |
| `claude/shader-platform-review` | `db8d902` | itself | 90 / 0 | n/a | Fully merged (PR #42). |
| `claude/simplify-shader-examples` | `dfc7709` | itself | 72 / 0 | n/a | Fully merged (PR #43). |
| `claude/standardize-shader-coords` | `ec53126` | itself | 47 / 0 | n/a | Fully merged (PR #44). Origin of `mathSpace`. |
| `claude/refactor-shader-system` | `ed43193` | itself | 38 / 0 | n/a | Fully merged (PR #45). |
| `claude/review-webgl-structure` | `e954c8b` | itself | 24 / 0 | n/a | Fully merged (PR #46). |
| `claude/review-shader-system` | `663b6f4` | `89f1334` | 127 / 24 | 2025-11-23 | Fully merged by content (PRs #39/#40). 3D demos only. |
| `claude/shader-authoring-examples` | `50ae08b` | `cddb1d1` | 71 / 23 | 2025-12-04 to 12-05 | **Superseded, with unmerged ideas** (2.2). |
| `claude/simplify-webgl-layout` | `79183bc` | `d150c29` | 23 / 1 | 2025-12-06 | **Unmerged fix** (2.3). |
| `claude/raytracer-implicit-surfaces` | `ba23ea6` | `f76ed9c` | 1 / 3 | 2026-08-13 | Unmerged build-script hygiene; no design content. |

### 2.2 The two coordinate designs

**Attempt 1: `shader-authoring-examples`, abandoned.** It ran from `5eda954` (2025-12-04 19:26) to `50ae08b` (12-05 03:48). Its design doc is `docs/COORDINATE_SYSTEM.md` on that branch. It proposed:

- **Injected locals in `main()`:** `uv` (local 0–1), `pixel` (local `ivec2`), `pos`, `mousePos`, `mouseDown` (bool), `dx`.
- **`pos` and `mousePos` are universal:** always screen-isometric, the same in every shader, buffer or screen. Origin is the screen centre, y ∈ [−0.5, 0.5], x ∈ [−aspect/2, aspect/2] (`5d1a3e8`).
- **A project-level `display: 'cover' | 'contain'`.** The compiler generated a per-pass preamble that inverts that mapping, so a buffer shader could compute screen-space `pos` (`generateCoverInverseMapping` and `generateContainInverseMapping` in `src/project/compiler.ts`).
- **`AppOptions.matchAspect: '<buffer>'`:** set the container's CSS `aspect-ratio` to the buffer's, so no mapping is needed.
- **A parameter convention:** position parameters are defined in universal space (`[0,0]` is the centre), never UV (`dfec70a`).
- **`dx`:** first an injected local, then a uniform (`8c819df`), because an injected local is invisible to helper functions in `common.glsl` (`af8cd10`).
- **`PassInput.output`:** lets several passes write one buffer (`033824c`).

Why it was abandoned, from the log: buffer passes at a different aspect ratio from the screen never got a matching `pos`/`mousePos`.
- `7b9e7d6` reverts a demo migration with "coordinate injection not implemented".
- `3eb9d2c` reintroduces manual screen-aspect arithmetic in three demos.
- `58c0c0c` "fixes" the cover inverse by swapping axes.
- `50ae08b` swaps them back and restores hand-written coordinates in `paint-canvas`.

The branch stops there. The inverse-display mapping was never made correct.

**Attempt 2: `standardize-shader-coords`, merged.** It started two hours later (`2c706ab`, 06:00) and inverts the idea. There is no display mode; instead the project names a reference rectangle:

- `mathSpace?: 'screen' | '<bufferName>' | { aspect: number }` (`src/project/types.ts:105`, `Engine.getMathSpaceResolution`, `Engine.ts:1179`).
- `pos = toMathSpace(gl_FragCoord.xy, uResolution.xy, uMathSpace.xy)`, a cover-map of the current target into the reference rectangle, then centred isometric with y ∈ ±0.5.
- New uniforms `uMathSpace` (w, h, aspect) and `uPixelSize` (= 1/height of the current target).
- `mouseDown` and injected `dx` were dropped. `uv`, `pos`, `mousePos`, `pixel` are injected by a regex on `void main() {` (`compiler.ts:84`).
- `e47602b` fixed `mousePos` to be normalised by screen resolution and then mapped through the current target.
- `80b2abf` deleted the old `lib/math/coordinates.glsl` helpers.

What attempt 1 had that main does not: the `display` cover/contain declaration, `matchAspect`, `mouseDown`, and the "parameters live in universal space" rule. `PassInput.output` was re-done on main (`a42efea`).

Three problems remain on main:
- **Its coordinate doc is wrong.** `origin/main:docs/COORDINATE_SYSTEM.md` documents `mathSpace: { center, size }`, which the code does not implement.
- **`uPixelSize` ignores `mathSpace`.** It is always 1/target-height.
- **`pos` is still not physical units.** There is no way to say "this field is [−5, 5]²".

Relation to the July design: D024 defines `Fragment.coord` with y ∈ **±1**; webgl-demos uses **±0.5**. The fixture `pathtracer/trace.glsl:94` still divides by `uResolution.y` (±0.5), which predates D024.

More importantly, `docs/architecture/` defines `coord` for a view only. It says nothing about the three things webgl-demos spent two branches on:
- how a fixed-size field's coordinates relate to the view (cover, contain or stretch);
- what space `uPointer` is in when read inside a field pass;
- grid spacing.

`Cell`'s fields are explicitly unfrozen (D026).

### 2.3 The unmerged wave fix (`79183bc`, 9 files in `examples/09-layouts/`)

The bug is "oval" waves in the four `wave-*` layout demos. Main fixed it in `e954c8b` by setting `mathSpace: 'state'`, so that `pos`/`mousePos` are isotropic on the square 512² buffer. Main first tried multiplying distances by the aspect ratio (`f6c1dd8`) and reverted that (`12de097`).

The unmerged commit, made on top of that, changes two more things in each demo:

```diff
 // update.glsl
   float laplacian = laplacian5Point(state, ij);
+  float lap_physical = laplacian / (uPixelSize * uPixelSize);
-  float u_next = 2.0 * u_curr - u_prev + c2_dt2 * laplacian;
+  float u_next = 2.0 * u_curr - u_prev + c2_dt2 * lap_physical;

 // display.glsl
+  vec2 bufferUV = coverMap(uv, uResolution.xy, uStateResolution.xy);
-  float u = texture(state, uv).r;
+  float u = texture(state, bufferUV).r;
```

It also adds a README paragraph. My assessment, from reading the code (I did not run it):

- **The `coverMap` half addresses a real remaining defect.** Main's display still samples `texture(state, uv)`, which stretches the square buffer over a non-square canvas. Waves that are circular in buffer space will still look oval on screen.
- **The Laplacian half is dimensionally right but probably unstable as written.** It keeps `dt = uDeltaTime` (about 1/60) with dx = 1/512 and c = 1.5, so c·dt/dx ≈ 12.8, far above the CFL limit of 1. The reference demo `new-demos/wave-equation/update.glsl:33` pairs the same division with `dt = 0.5 * uPixelSize / waveSpeed`. That may be why this was not merged.

So the two fixes are complementary, not equivalent. The underlying lesson (dt, dx and the display mapping must be consistent, and the framework gave no help) is the useful part.

### 2.4 Deleted design docs

Every `.md` ever deleted, from `git log --all --diff-filter=D`:

| Deleted in | Files |
|---|---|
| `b1d7241` (11-13) | `docs/phase1.md` |
| `2064f17` (11-13) | `docs/build.md`, `compute-build.md`, `spec1.md` (the first `overview.md`, renamed), `spec2.md` |
| `4dd3496` (11-15) | `docs/dev-docs.md`, `spec3.md` |
| `5486a6d` (11-16) | `docs/project.md` |
| `b2f6a94` (11-16) | `docs/minimal-app.md` |
| `952aadd` (11-20) | `demos/simple-diffusion/README.md` |
| `746201a` (12-04) | 13 per-example READMEs |
| `19cc9b7` (12-05) | `docs/archive/{app,core,engine,project}-spec.md`, `docs/archive/overview.md` |
| `ed43193` (12-05) | `demos/README.md`, `demos/INIT_SHADER_EXAMPLES.md` |

In addition, `docs/TODO.md` was cut from 1,484 to 165 lines in `d3294d6`.

Read via `git show`:

- **`spec1.md` (`1e8b127:docs/overview.md`, 17 KB), "Shader Playground".** Shadertoy paste-compatibility was a design principle.
  - `@mode shadertoy | custom` pragmas in GLSL comments, with a `mainImage` wrapper and `#define iTime uTime` shims.
  - Display modes: viewer, viewer+code, editor.
  - Optional `config.json` with `buffers: { bufferA: { inputs: [...] } }`.
  - **Render order by topological sort of buffer dependencies**, ping-pong for self-reads.
- **`spec2.md` (41 KB) and `spec3.md` (30 KB, on `old`).** Class-level JS architecture (ShaderProject, ShaderCompiler, ConfigLoader, GLSLImportResolver, BufferManager, a Viewer family). v3 has Project / Engine / App / UI layers with the invariant "Project never imports Engine; Engine never imports App"; one demo builds to one archival bundle.
- **`build.md`, `compute-build.md` (40 KB), `phase1.md`.** Phase-by-phase implementation plans for multi-buffer, ping-pong, buffer debug and texture inputs.
- **`dev-docs.md` (133 KB, on `old`).** A prose manual with a "Key Design Decisions" section:
  - validate once, then deep-freeze the config;
  - **circular buffer dependencies are allowed and topological sort is dropped**; render order is explicit, and "render order determines causality" (an input rendered earlier this frame is current, otherwise previous);
  - **always double-buffer everything**, for one code path;
  - two uniform managers (user-facing vs GL-facing);
  - pragmas as a limited convenience;
  - verbose, actionable errors.
- **`rebuild` specs: `overview.md`, `core-spec.md`, `engine-spec.md`, `project-spec.md`, `minimal-app.md` (115 KB).** These are the model main implements: four layers, Project (pure data plus string compiler) → Core (private WebGL2 wrapper) → Engine (stateful, headless, deterministic) → App.
  - "Declarative over imperative", "boring is good", fail fast.
  - Passes are an ordered array, and **ping-pong swaps immediately after each write** (batch-swap at frame end was rejected as "more complex").
  - The Engine owns `uFrame`; the App owns time.
  - `u`-prefix naming; a `dt` field was removed from the project.
  - Deferred: MRT, a Shadertoy compatibility mode, int/vec params.
  - So yes, `rebuild` was an earlier redesign, with a "declarative project of buffers plus ordered passes, sequential visibility" model. It was executed, not forgotten.
- **`app-spec.md` (20 KB, `b2f6a94`, deleted in `19cc9b7`).** The most relevant to the 1.0 design.
  - `TimeMode = 'realtime' | 'fixed'`; fixed mode uses a **wall-clock accumulator** running several `engine.step()` per animation frame.
  - `stepOnce()` always uses `fixedDeltaTime`.
  - `reset()` keeps user parameters; `restoreParamsToDefaults()` is separate.
  - Panels talk only to the App, never the Engine.
  - This is implemented on main (`src/app/App.ts:80-81`).
- **Old `docs/TODO.md` (41 KB, `d3294d6^`).** A roadmap with implementation sketches: vertex shaders, includes, buffer formats, parameter types, mouse, volume slicer, export, ray-march helpers.
  - **"Shader Pass Templates"**: `pdeSimulationTemplate({ updateShader: 'vec4 update(vec2 uv, vec4 current)', displayShader: 'vec3 visualize(vec4 state)' })`, plus volume, post-process, particle and feedback templates.
  - A Shadertoy conversion tool (regex `iTime` → `uTime`, `mainImage` → `main`).
  - CPU and Worker offloading.
  - A long note on 3D Gray–Scott tuning: the 7-point stencil's centre weight makes effective diffusion about 2× the 2D case.
  - The current TODO keeps one line: "templates should be copy-paste examples in docs".
- **`INIT_SHADER_EXAMPLES.md` (9 KB).** Duplicated `docs/INIT_SHADERS.md`.

### 2.5 The "review" branches: what was recommended and adopted

There are no review documents; the commit bodies carry the reasoning.

- **`shader-platform-review` (`10b0bc1`..`db8d902`), adopted on main:**
  - `buffers` optional;
  - buffer shorthand `state: 'rgba16f'` with defaults (`inherit`, `pingPong: true`, `nearest`, `clamp`);
  - param min/max optional;
  - `compileProject()` automatic in the `App` constructor, container defaults to `#app`, layout given as a string;
  - **passes as a key-value object where the key is the output target** (`08be647`);
  - metadata reduced to title and description;
  - `project.ts` folded into `main.ts`.
  - **Proposed then reversed inside the branch:** a `shader:` single-pass shorthand, added in `10b0bc1` and removed in `02b0676` ("one way to define shaders").
  - Follow-on cost: with key = output, multi-writer buffers needed naming hacks (`velocity_diffuse`), and then `PassInput.output` the next day. The July design's "pass names are distinct from output names (D103 carried over)" is the same lesson.
- **`simplify-shader-examples`.** A `@lib` include alias was added (`746201a`), then reverted to relative paths (`ba21c17`, "vite-plugin-glsl doesn't support custom path aliases"), and is present again on main today. Three successive mouse-alignment fixes in one day (`ff706d2`, `1d9ec80`, `b5ef091`, `3d2d9ba`) directly triggered the coordinate work.
- **`refactor-shader-system`, adopted.** Deleted `src/passes` (926 lines) and `src/params` (447 lines) as "false abstractions … really just demo scaffolding"; demos must be self-contained; the TODO was cut.
- **`review-webgl-structure`.** Example sets 06–09; auto-injected Reset button for projects with init shaders (`97567bb`); `app.ui.addButton()`; the `mathSpace` wave fix.
- **`review-shader-system`.** 3D demos only.

Not adopted anywhere: Shadertoy import, pass templates, and `hidden` params (still open in root `TODO.md`). Root `TODO.md` also asks for "build-time codegen that injects user's F into library functions", the same need as a generated wrapper around a user entry point.

## 3. shader-sandbox (main `f428d90`, 296 commits, 2020-11-17 to 2026-07-15)

### 3.1 Per-branch table

| Branch | Tip | Merge-base | Behind / ahead | Verdict |
|---|---|---|---|---|
| `rebuild` | `6daf8aa` (2026-07-16) | `f428d90` | 0 / 1 | Fully contained in the handoff branch. |
| `claude/sharp-planck-2kc13q` (HEAD) | `0a28c03` (2026-11-14) | `f428d90` | 0 / 3 | `rebuild` plus two handoff-doc commits (`beac758`, `0a28c03`). |
| `claude/vigilant-cori-w3l5ce` | `f428d90` | itself | 0 / 0 | Identical to main. |
| `old-version` | `8ef5c9c` (2025-11-09) | itself | 286 / 0 | History of main. Content deleted from the tree. |
| `hopf` | `cbfbeea` (2021-02-16) | itself | 293 / 0 | History of main. |
| `LimitSet` | `54d7a9b` (2021-09-14) | `cbfbeea` | 293 / 1 | Project branch, one unmerged commit. |
| `hypPicture` | `b4afd21` (2021-10-07) | `f976ea6` | 291 / 2 | Project branch, two unmerged commits. |

### 3.2 `origin/rebuild` versus `docs/architecture/` on HEAD

`git diff origin/rebuild HEAD -- docs/architecture` is **empty**: identical. The only differences between `rebuild` and HEAD are the six files under `docs/handoff/`. `rebuild` contains no code, and nothing on it is left behind. Its commit touches exactly `DESIGN.md` (a 4-line pointer) and 28 files under `docs/architecture/`: nine top-level docs and five fixture directories.

**The branch is a single commit ("docs for a rebuild"), so the evolution of the July design cannot be read from the log.** The earlier draft was never committed. What can be reconstructed from the documents themselves:

- **There was an earlier draft with a different decision log.**
  - The README says the folder "replaces the earlier draft plan in full".
  - DECISIONS is headed "Last reviewed: 2026-07-15 (full plan rewrite)".
  - Surviving references to old IDs: "D103 carried over" (PROJECT_MODEL:109 and fixtures/README), "D104/D011" (volume-rd/NOTES:13), "D107 of the old log", "O005-era".
  - Numbering gaps (no D013; no O001/2/4/5/7/8; no W101–103) are entries dropped in the rewrite.
- **One explicit reversal.** SHADERTOY_INTEGRATION.md:5: "An earlier draft marked one model settled without ratification". It was reopened as O014, with interim policy "ambient", while the document's own advisory recommendation is M2 (walled opt-in plus shim). That tension is unresolved.
- **Order on 2026-07-16.**
  1. D022–D029 were ratified: three entry points, built-in names, `Fragment` fields, `vec3`/`vec4` return, `compute(Cell)`, snapshot default, last-writer-wins uniforms, `stepsPerFrame`.
  2. The paper check hand-compiled seven projects to the IR and produced findings F1–F8.
  3. D030 (the `Step` op, from F2) followed.
  4. D031 (uniform-sourced `Repeat`, F1), D032 (display passes belong to views, F5), D033 (commit-indexed history, F3), D034 (control-fed `Initialize`, F7) and the W108 update (F6) came after.
- **Internal staleness that proves that order.** The README "Status" lists ratifications only to D030 and says "F1, F3–F8 remain open", while PAPER_CHECK's ledger marks F1, F3, F5, F6, F7 resolved; only F4 and F8 are open. fixtures/README says "the configs predate some of those spellings".
- **No fixture uses `shade(Fragment)` or `compute(Cell)`.** All fixture GLSL uses plain `main()` with `gl_FragCoord`. By the document's own rule ("settled only when a fixture validates it"), D005 and D024–D026 are ratified but unvalidated.

### 3.3 Old branches

All are project content on a throwaway three.js harness, not engine work.

- **`hopf`.** `index.html`, `main.js`, `style.css`, `fragmentShader.glsl` (282 lines, an orbital viewer). `main.js` wraps a Shadertoy `mainImage` with a fixed header and footer.
- **`LimitSet`.** One commit replacing the shader with a 178-line limit-set shader, plus `.idea` files.
- **`hypPicture`.** Two commits beyond main: a 565-line right-angled-hexagon / genus-2 tiling shader, a `sampler2D image` uniform with a `TextureLoader`, and two images.
- **`old-version`.** Vite + three.js `ShaderDisplay.js` / `ShaderDisplay-Three.js` and 30 scenes: hyperbolic 237/334 tilings, Mandelbrot variants, black holes, Nil geometry, orbitals, moduli spaces, Taylor series, Newton fractal. `node_modules` and `dist` are committed: 1,385 of 1,457 files.

### 3.4 Deleted docs in shader-sandbox main's history (new finding)

- **`874efdb` (2025-11-16) added, and `3d7b903` (11-17) deleted:**
  - `docs/engine-spec.md` and `docs/project-spec.md`: a "Shadertoy Runner v1" spec with Image / BufferA–D passes, four channels and `shadertoy.config.json`, written to be handed to an LLM.
  - `docs/example-sytstem/`: a copy of the webgl-demos system (Core.ts, Engine.ts, panels, layouts, `architecture.md`) included as a reference.
  - So shader-sandbox was seeded from the webgl-demos rebuild on the day that rebuild was specified.
- **`IDEAS.md` (added `18309c2`, deleted `b82140f`).** A feature checklist: playback speed, frame stepping, uniform UI options A–E, recording, share URL, audio/webcam, event callbacks, plugin system.
- **`PLAN.md`, `PLAN-runtime-loader.md`, `live-app-plan.md`, `CHANGELOG.md`, `docs/dev/*`, `docs/learn/*` (all deleted in `f412c88`, 2026-02-12).**
  - `PLAN.md`: split the 2,042-line `App.ts` into exportHTML, Recorder, ErrorOverlay, StatsPanel, InputManager, PlaybackControls.
  - `PLAN-runtime-loader.md`: a fetch-based FileLoader so a folder of `.glsl` runs with no build; config-driven file discovery.
  - `live-app-plan.md`: the `mount(el, options) → { destroy, resize?, setOptions? }` contract plus a thin `<live-app>` custom element, for modules that "still run in 10+ years".
  - All three appear implemented in spirit on main (`src/runtime.ts` defines `shader-canvas`, `shader-editor`, `shader-sandbox` elements). They are executed plans, not forgotten designs.

## 4. Things on branches the redesign discussion should know about, ranked

1. **The field-coordinate problem is unsolved in the July design, and webgl-demos has two worked attempts at it.** Read `shader-authoring-examples:docs/COORDINATE_SYSTEM.md` (universal screen space, `display: cover|contain`, `matchAspect`) against main's `mathSpace`. `docs/architecture` specifies `Fragment.coord` for views only; `Cell`, `uPointer` space, the field-to-view mapping and grid spacing are open.
2. **Coordinate convention mismatch.** D024 says y ∈ ±1; all webgl-demos code and the pathtracer fixture use ±0.5. Porting the corpus means rescaling every radius and brush parameter, or reconsidering D024.
3. **Name collision.** `shade(` is already a lighting helper in three existing shaders across both repos. D022 detection must be signature-based, and its error message should anticipate this.
4. **The wave demos are a ready-made acceptance fixture.** The unmerged fix `79183bc` together with main's `e954c8b` shows that isotropy, physical Laplacian scaling, CFL-consistent dt and the display mapping were four separate hand fixes. Neither branch has all four right.
5. **`docs/architecture` has stale status text** (README vs PAPER_CHECK vs DECISIONS D031–D034), and `shade`/`compute` have no fixture. Fix before treating the folder as authoritative.
6. **O014 tension.** Interim policy is "ambient" Shadertoy vocabulary; the document's own recommendation is M2; and an earlier draft had "settled" one model without ratification.
7. **webgl-demos lessons that support July decisions.**
   - Pass key = output target needed naming hacks within a day, then `PassInput.output` (supports "pass names ≠ resource names").
   - Immediate swap after write, chosen in `rebuild/overview.md` decision 4, is the opposite of the D027 snapshot default; the corpus's Schrödinger leapfrog relies on it.
   - `dev-docs.md` on allowing cycles with explicit order: "render order determines causality".
8. **`app-spec.md`'s wall-clock accumulator fixed-timestep mode** is already implemented in webgl-demos `App.ts`. D029 defers exactly this.
9. **The deleted roadmap's pass-template sketch** (`update(uv, current)` / `visualize(state)`) and root `TODO.md`'s "codegen that injects the user's F" are prior statements of the need behind `compute`/`shade`. The stated reason for deleting `src/passes` and `src/params` ("false abstractions", demos must be self-contained) bears on F003 and module-library scope.
10. **webgl-demos main's own `docs/COORDINATE_SYSTEM.md` misdocuments `mathSpace`** (`{center, size}` vs the real `'screen' | buffer | {aspect}`). Anyone mining the corpus should trust `types.ts:105`, not the doc.
11. **30 pre-2025 mathematical Shadertoy scenes** (`old-version:scenes/`), plus the `hypPicture` and `LimitSet` shaders, are absent from main's tree. They are candidate corpus and compat-conformance material.
12. **Housekeeping.** Three unmerged build-script commits on `raytracer-implicit-surfaces`; `vigilant-cori-w3l5ce` is an empty branch; `rebuild` can be retired once the handoff branch lands. Also, `/home/user/webgl-demos` has untracked `.whl` files in its working tree, which are not mine.

A scratch blob list was written to `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/mainblobs.txt`; it is safe to delete.
