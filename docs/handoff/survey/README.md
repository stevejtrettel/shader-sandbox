# Survey of everything, 14 November 2026

This folder records a second, deeper pass over all the material behind the
planned shader-sandbox 1.0. The first pass (the five reports in
`../reports/`) was done by reading only. This pass read everything again
and also **ran** it: both codebases, all the corpus projects and the whole
GLSL library were executed in headless Chromium.

Nothing here is a plan or a decision. It is a record of what exists, where
it lives, what works and what does not.

## How to use this folder

| File | What it is |
|---|---|
| `README.md` (this file) | The three bodies of work, where things live, what the owner has said, corrections to the first handoff |
| `FEATURE-MAP.md` | One table per topic: what shader-sandbox does, what webgl-demos does, what the July design proposes |
| `KNOWN-PROBLEMS.md` | Every verified bug and weakness, by repo, with file and line |
| `JULY-DESIGN-NOTES.md` | Summary of the July rebuild design and where the evidence does not support it |
| `reports/1` to `reports/8` | The eight detailed reports this pass produced, saved in full. These are the primary record; the files above are summaries of them |
| `tools/` | The scripts used to run things. `tools/glsl-test-harness/` is a working prototype of a GLSL test runner |
| `data/` | Raw results: one record per corpus project, console logs, a few screenshots |

The eight reports use three evidence labels. **Run** means the thing was
executed and observed. **Read** means it was established from the source.
**Inferred** means reasoning that was not executed. Paths inside the
reports that start with `/tmp/…/scratchpad/` no longer exist; the scripts
they name are now under `tools/`.

## The three bodies of work

### 1. shader-sandbox (this repo)

The published npm package. 0.2.7 is on npm (26 April 2026) and other people
use it. `main` is 0.3.0, never published.

It is a way to write a Shadertoy-style fragment shader in a local folder,
see it live, tune it with sliders, and publish it as a still, a video, a
self-contained folder or an embed.

About 11,800 lines of TypeScript in `src/`:

| Path | Lines | What it does |
|---|---|---|
| `src/project/types.ts` | 849 | Every config and project type. `PassName` is the fixed set Image, BufferA to BufferD |
| `src/project/loadProjectCore.ts`, `configHelpers.ts`, `loaderHelper.ts` | | Loading and validation. One core loader used from Node, Vite and fetch |
| `src/engine/ShaderEngine.ts` | 1356 | The renderer: five fixed passes, ping-pong float targets, uniform binding |
| `src/engine/shaderSource.ts` | 320 | Builds the final GLSL: preamble, built-ins, samplers, `mainImage` wrapper, cubemap rewrite |
| `src/engine/UniformManager.ts`, `std140.ts` | 707, 308 | Custom uniforms, array and struct uniforms through uniform buffers |
| `src/engine/MediaManager.ts`, `glHelpers.ts` | 312, 519 | Images, video, webcam, microphone, keyboard texture |
| `src/app/App.ts` | 752 | Frame loop, script hooks, wiring of all panels |
| `src/app/ShaderView.ts` | 455 | One canvas, one WebGL context, one engine |
| `src/app/Transport.ts` | 73 | Pause and resume clock |
| `src/app/OfflineRenderer.ts`, `Mp4Encoder.ts` | 353, 183 | Fixed-timestep stills and video |
| `src/app/exportHTML.ts` | 725 | Single-file HTML export; contains a second player written as a string |
| `src/app/InputManager.ts` | 341 | Mouse, touch, pinch, keyboard |
| `src/app/*Panel.ts`, `panel-kit.ts`, `ErrorOverlay.ts` | | Stats, playback menu, screenshot and recording dialogs, error display |
| `src/uniforms/` | | Slider, toggle, XY pad and colour controls |
| `src/editor/` | | In-page code editor (textarea plus Prism highlighting) |
| `src/layouts/` | | default, fullscreen, split, tabbed; grid and inset for multi-view |
| `src/mount.ts`, `src/index.ts`, `src/node.ts` | 256, 36, 54 | The JavaScript API: `mount`, `loadDemo` |
| `src/runtime.ts` | 800 | The three custom elements and the fetch loader |
| `bin/cli.js` | 938 | `create`, `new`, `dev`, `build`, `build-all`, `build-gallery`, `build-runtime`, `list` |
| `templates/` | | What `shader create` copies into a new project |
| `tests/` | | 11 files, 102 tests, all pure logic; none touches WebGL |
| `demos/` | | 47 projects, 72 shader files |
| `docs/architecture/` | | The July 2026 rebuild design (no code) |

Detail: `reports/1`, `reports/2`, `reports/3`, `reports/4`.

### 2. webgl-demos (private, `stevejtrettel/webgl-demos`)

The owner's own shader framework, kept separate from shader-sandbox on
purpose because it had different goals. More general: named buffers with
their own size and format, several steps per frame, a math coordinate
frame, 3D textures, built-in geometry, panels.

About 17,100 lines in `src/`:

| Path | Lines | What it does |
|---|---|---|
| `src/project/types.ts` | 855 | `ProjectDefinition`: buffers, passes, params, presets, `mathSpace`, `computeIterationsPerFrame` |
| `src/project/compiler.ts` | 705 | Assembles GLSL; splices `uv`, `pos`, `pixel`, `mousePos` into `main()` |
| `src/project/ShaderPreprocessor.ts` | 219 | Runtime `#include` expander with source maps. Effectively unused |
| `src/core/Core.ts` | 844 | Thin WebGL2 wrapper |
| `src/engine/Engine.ts` | 1207 | Buffers, passes, ping-pong, volume slice loop, init shaders |
| `src/engine/ShaderErrorAnalyzer.ts` | 328 | Error parsing and line mapping |
| `src/app/App.ts` | about 1000 | Time modes, mouse, param store, events, hot reload |
| `src/utils/` | 470 | `OrbitCamera`, `PanZoomCamera` |
| `src/panels/` | 5167 | Params, code (CodeMirror), errors, buffer viewer, performance, recording, controls |
| `src/layouts/` | 414 | fullscreen, params, sidebar, split, teaching |
| `src/shaders/lib/` | 4505 | 44 GLSL library files |
| `vite.config.js` | 83 | Build-time `#include` expansion with an `@lib` alias |
| `docs/` | 13,300 | 21 guides. Several describe things the code does not do (see `KNOWN-PROBLEMS.md`) |
| `examples/` | 51 projects | Teaching sequence 01 to 09 |
| `new-demos/` | 30 projects | The most recent work; most of the PDE projects |
| `demos/` | 24 projects | Oldest; **none runs** against the current engine |

Detail: `reports/5`, `reports/6`, `reports/7`, `reports/4`.

### 3. The July 2026 rebuild design (`docs/architecture/`)

Nine documents and five draft fixture projects, written on 15 and 16 July
2026 and then forgotten on a branch. No code. It proposes replacing the
engine with a general model of six concepts (resources, passes, schedules,
uniforms, systems, views) and treats Shadertoy as a compatibility layer.

Summary and assessment: `JULY-DESIGN-NOTES.md`.

## Headline facts from this pass

1. **Of 105 webgl-demos projects, 67 run.** All 24 under `demos/` fail (21
   throw the same error at compile, 3 have no entry file). Seven fail in
   `examples/` and seven in `new-demos/`. The GitHub Pages build publishes
   only `demos/`. Per-project results: `data/corpus-run-results.jsonl`.
2. **Every multi-pass project in the corpus relies on passes seeing each
   other's writes in order.** The engine swaps a buffer immediately after
   each pass. No project has two passes that read each other's old state
   and commit together. Eight projects need the ordering for their
   mathematics; only two of those run today. Deferring the swaps in the
   Schrödinger demo was tried and the wave packet stops moving
   (`data/screenshots/SNAP_*`).
3. **`mathSpace` half works.** `pos` names the same point in every buffer.
   `mousePos` is wrong whenever a buffer's aspect ratio differs from the
   canvas: in `new-demos/heat-equation` a press at 20% of the width lands
   at 36% (`data/screenshots/INTERACT_*`). `uPixelSize` ignores the math
   frame. 19 projects use `mathSpace`.
4. **`new-demos/fluid-2d` does not start,** and never had an iterated
   pressure solve. The July paper check hand-compiled it as if it did.
5. **shader-sandbox's named buffers are BufferA to BufferD renamed.** Four
   at most, all canvas-sized RGBA32F, run in JSON key order. The `mode`
   field is never read by the engine.
6. **shader-sandbox has determinism bugs in export.** The first frame of
   every recording gets a negative `iTimeDelta`; a script-driven shader
   with no buffers gets no `onFrame` call for a still.
7. **A uniform's value lives in up to four places in shader-sandbox** with
   nothing keeping them in step. Sliders do not follow values set by a
   script.
8. **The GLSL library's reported errors are all real,** confirmed
   numerically, and there are more. Three library files do not compile.
9. **A GLSL test runner is cheap.** The prototype in
   `tools/glsl-test-harness/harness.mjs` is about 110 lines and compiles
   all 44 library files in 1.3 seconds.
10. **29 older mathematical scenes** (hyperbolic tilings, black holes, Nil
    geometry, moduli spaces, Mandelbrot variants) are on the
    `old-version` branch and absent from today's `demos/`.

## What the owner has said

From the first handoff session (see `../README.md`) and this one. These
are the owner's positions, not proposals.

**This session:**

- shader-sandbox is the tool the owner and others use. webgl-demos was the
  owner's own thing. They were separate on purpose because they had
  different goals.
- The plan is to **extend shader-sandbox**, and to think about all the
  possible ways to make something useful for other mathematicians who
  want to write shaders.
- The internals will be made **fully capable, like the demos, together
  with a Shadertoy clone.** That part is not the open question.
- The open question is the **use cases**: what shader-sandbox is for.
  Standalone demos, code to copy to a website, video recording, and
  whatever else. The owner wants help thinking this through first.
- **Writing comfortably in your own editor and having easy ways to run
  things is the most important thing.**
- After that, the owner wants to design **how shader code gets remixed
  and shared**, both as standalone demos and on websites, including for
  relatively complicated multipass shaders.
- Questions the owner raised and wants thought through:
  - What should we worry about with default versus advanced modes for
    users?
  - Should we expose a Shadertoy clone, our own custom system, or plain
    WebGL with `main()`? How do they interact?
  - What is a good templating system?
  - How do we imagine people producing content for their own websites,
    versus for videos?

**How the owner wants to work.** A conversation, in short turns, thinking
together from the beginning. This session went badly on that: the
assistant came back from the reading with long reports, then
questionnaires, then lists of options, and the owner found none of it
useful and ended the conversation by asking for this record instead. A
future session should not open with a summary of findings or a set of
recommendations. It should talk, keep replies short, follow the owner's
lead, and bring in a fact from this survey only when it bears on what is
being discussed.

The owner types on a keyboard that drops letters, often `r` and `f`. Read
for intent.

## Corrections to the first handoff (`../README.md` and `../reports/`)

| First handoff said | What this pass found |
|---|---|
| All 24 `demos/` projects "probably do not run" | Confirmed by running. Also 14 more outside `demos/` are broken, so 67 of 105 run |
| "About 14 wave variants" | 20 wave directories, about 6 distinct numerical variants |
| `fluid-2d` never uses its pressure slider | True, and the project does not start at all |
| Report 2's recommended acceptance tests | 9 of the 13 projects it names do not run |
| Schrödinger demos have "mouse perturbation" | The params exist; no shader reads the mouse |
| "No demo uses PanZoomCamera" | `new-demos/fractal-explorer` does |
| Clear colour is drawn into buffers at creation | Not for a colour `init` on a fixed-size buffer; it is applied only on reset |
| Runtime `#include` preprocessor has no callers | `new-demos/compile-test` calls it; that demo is broken |
| 15 library files never included | 16 |
| "Neither codebase has owned disposal" | shader-sandbox does and it works; webgl-demos does not |
| webgl-demos has a working frame-time graph and buffer viewer | The graph canvas is 0×0 and never draws. The viewer shows 8-bit buffers upside-down and float buffers as zeros |
| Built-in uniforms are written in three places | At least eight, and they have drifted |
| `old-version` is unrelated history | It is an ancestor of `main`; its 29 scenes were deleted in November 2025 |
| The abandoned coordinate branch is `standardize-shader-coords` | That branch was merged and is where `mathSpace` came from. The abandoned one is `claude/shader-authoring-examples` |
| The 0.2.7 compatibility table | Correct row by row; misses about a dozen changes (listed in `KNOWN-PROBLEMS.md`) |
| `<live-app>` removal is loud for package users | The published 0.2.7 runtime never registered `<live-app>`; it existed only as a copyable template file |

## Not looked at

- Other repositories that may hold related work. The first handoff named
  `shader-demos`, `shader-course` and `PathTracerGLSL`. The account also
  has `sim-webgpu` and `thurston-webgpu`, both pushed in the week of this
  survey, and `math-lib`, `PathTracerWGPU`, `threejs-demos`. Whether any
  of these matter is the owner's call.
- Nothing was run on a real GPU. All execution was on SwiftShader, a
  software renderer. Behaviour that depends on a driver was not observed.
- No shader-sandbox demo was rendered to pixels. The loader was run over
  all 47 demos; the engine was probed with a fake GL context.
