# Notes on the July 2026 rebuild design

The design lives in `docs/architecture/`. It was written on 15 and 16 July
2026, committed as a single commit (`6daf8aa`) on the `rebuild` branch,
and not touched again. It contains no code. Its fixtures do not run.

This file summarises it and records where this survey's evidence supports
it, contradicts it or shows it to be untested. It does not say what
should be done about any of it.

## What it proposes, in brief

**Two products on one runtime.** A native system ("Standard" when you say
little, "Advanced" when you write more; not two modes) and Shadertoy
compatibility as a bounded side product that compiles into the native
runtime.

**Six concepts.**

| Concept | Meaning |
|---|---|
| Resources | Named GPU data: fields, volumes, data textures, lookup tables, geometry, external media. Each has a format, size, filter, initialisation, resize policy and history depth |
| Passes | One GPU operation with declared reads and writes. Named separately from what they write. May write several targets |
| Schedules | When passes run and when their writes become visible. Inferred for simple projects, written out for hard ones |
| Uniforms | One stored value each; sliders, presets, scripts, controllers and timelines all write it; last writer wins |
| Systems | JavaScript participants: built-in controllers (pointer, pan/zoom, orbit, drag points) and author scripts with declared outputs |
| Views | Named displays that read resources and never advance the simulation |

**Shader entry points.** Exactly one per file: plain `main()` (never
rewritten), `shade(Fragment f)` returning `vec3` or `vec4`, or Shadertoy's
`mainImage`. `Fragment` has `pixel`, `uv`, `coord` (centred, y from −1 to
1, y up) and `resolution`. Non-visual passes may use `compute(Cell)`;
`Cell`'s fields are not yet defined.

**Built-in names.** `uTime`, `uResolution`, `uFrame`, `uPointer`.

**Execution.** A small internal schedule language with eight operations:
`Run`, `Group`, `Commit`, `Sequence`, `Repeat`, `Step`, `Initialize`,
`Present`. When no schedule is written, all update passes read the same
last-step state and commit together ("snapshot"); `stepsPerFrame` repeats
that step. Sequential visibility, iterative solves and substeps are
written explicitly. Time is an integer step counter times a fixed `dt`.
Inputs are sampled once per display frame. The one conditional is
`resetOn`: a resource re-initialises when a watched input changes.

**Runtime.** A "contained rewrite": a new executor built beside the old
engine, with the Shadertoy layer as its first client, golden images frozen
from the current engine, and the old engine deleted when those pass.
`Transport`, the offline renderer, `std140`, the media manager, the
controls, the CLI and the build pipeline are listed as surviving. One
shared WebGL context for all views.

**Shadertoy scope.** Three candidate models: a walled opt-in mode (M1),
the same plus a names-only shim (M2), and letting Shadertoy vocabulary be
used anywhere (M3). The interim policy is M3; the document's own
recommendation is M2; the decision (O014) is open.

**Roadmap.** Eight stages, 0 to 7: fixtures and the schedule language;
new executor running Shadertoy; stateless native shaders; stateful fields
with snapshot updates; interaction and controls; public schedule syntax;
data, geometry, volumes and several views; timelines and tiled export.

**Decision log.** 34 entries in `DECISIONS.md`: settled (D001 to D034
with gaps), working (W104 to W110), open (O003, O006, O009 to O014) and
deferred (F001 to F005).

## Where the evidence supports it

- **Pass names separate from output names.** webgl-demos made the pass key
  the output name on 4 December 2025 and needed naming workarounds
  (`velocity_diffuse`) and then an `output:` field within a day.
- **Declared history instead of accidents of ping-pong.** Every wave
  project in the corpus packs two time levels into channels by hand.
- **The volume slice loop hidden from the author.** webgl-demos exposes
  `uLayer` and `uLayerNorm` and every volume shader carries the plumbing.
- **Resolution of a field independent of the view.** The owner's own
  history shows this: the oldest Schrödinger and wave projects used
  canvas-sized buffers, so the grid spacing changed with the window; the
  newer ones all use fixed grids.
- **Fixed time step, never the frame time.** 15 corpus shader files use
  the wall-clock frame time as the simulation step and are frame-rate
  dependent. Both existing clocks have reset and resume bugs.
- **One engine for live, export and embeds.** The current HTML export is a
  second player written by hand and never executed by a test.
- **One shared context for several views.** Multi-view today is one full
  engine per view and views cannot share buffers.
- **One stored value per uniform.** shader-sandbox holds up to four copies
  that drift apart.
- **Simulate in 32-bit, display in 16-bit.** webgl-demos does this by
  habit; 28 float-buffer configurations set linear filtering only so the
  display can interpolate.
- **Loud errors, no silent misrendering.** Both codebases have several
  silent failures (non-ping-pong self-read, three-channel float formats,
  unbound buffers).
- **General conditionals deferred.** No corpus project needs
  JavaScript-driven control flow, conditional passes, readback into
  JavaScript or dynamic buffers.

## Where the evidence contradicts it or leaves it untested

### The snapshot default (D027)

No corpus project uses it. Of the 17 projects with two or more compute
passes:

- 8 need a later pass to see an earlier pass's write for their
  mathematics (four Schrödinger, two coupled 3D wave, two fluid);
- 1 gives a different but valid result either way (smoke);
- 4 are feed-forward chains (blur, bloom, image pipeline, volume clip)
  that would gain one frame of latency per stage;
- 2 have independent passes;
- none has passes that read each other's old state and commit together.

The remaining stateful projects are a single self-feedback pass, where
the two rules coincide. The paper check itself notes that neither hard
project used `Group`. Shadertoy and both existing engines are sequential.

The inferred schedule also does not say how a chain of derived passes, or
a scratch field computed inside a step (such as divergence), is ordered.

### Coordinates (D024) and the pointer

`Fragment.coord` is defined for a view only, with y from −1 to 1.
webgl-demos uses y from −0.5 to 0.5 everywhere, and so does the design's
own path tracer fixture. More importantly the design does not address:

- how a fixed-size field's coordinates relate to the view (cover, contain
  or stretch);
- what space the pointer is in when read inside a field pass;
- grid spacing in the field's units;
- a pointer into a volume (four corpus projects do this by hand with a 2D
  pointer and a layer slider).

webgl-demos made two attempts at this in December 2025. The first
(`claude/shader-authoring-examples`: one universal screen frame, a
project-level `display: 'cover' | 'contain'`, `matchAspect`) was
abandoned after its inverse mapping was never made correct. The second
(`mathSpace`, merged) works for `pos` and not for `mousePos`. The
documented but never implemented `mathSpace: {center, size}` shows what
was intended. There is no working reference to copy.

In the design's own fluid fixture the splat shader compares a buffer's
`uv` with a controller position, on a 512² field under a view of any
shape, which is exactly this unsolved case.

### "What survives" (RUNTIME.md)

| Listed as surviving | Finding |
|---|---|
| `Transport` as the deterministic display clock | A 73-line wall-clock stopwatch. No seek, rate, frame counter or fixed step. Offline rendering bypasses it |
| `OfflineRenderer` driving the new executor | Three determinism bugs, no tiling, no size checks, resizes the on-screen canvas, no tests |
| Controls and panel-kit | No shared store; controls do not follow programmatic writes; global styles leak into the host page |
| Shader assembly and line mapping "carries forward" | Line mapping is by marker comments and is absent for live edits |
| `std140` | Sound and well tested |
| `MediaManager` | Sound; video is not synced to the clock |
| CLI and build pipeline "unchanged" | Dev server reloads the whole page on save; each built folder carries the full author toolset |

### Goldens frozen from the current engine

The plan is to render the conformance corpus with the current engine and
use those images as the reference. The current engine departs from
Shadertoy in ways that such goldens would lock in. Established from the
code: common code cannot use uniforms; keyboard row 1 is empty;
`iChannelTime` and `iSampleRate` are absent; channel-style buffers are
always nearest-filtered with no per-input setting. Believed from memory
of Shadertoy's behaviour and not checked against the site: its buffer
inputs default to linear filtering, and its `iMouse.w` is positive only
on the frame of the click. No test has ever compared the current
engine's output with anything.

### The paper check (`PAPER_CHECK.md`)

Seven projects were hand-compiled into the schedule language. Checked
against the real sources:

| § | Project | Finding |
|---|---|---|
| 1 | Schrödinger double-slit | Accurate. Runs today. Omits the dependence on `mathSpace` and `uPixelSize` |
| 2 | Stable fluids (`new-demos/fluid-2d`) | Not what the project does. No pressure iteration exists, the slider is dead, the project does not start. The pass names used are from a deleted November 2025 version |
| 3 | Progressive path tracer | From a draft fixture; nothing like it is in the corpus |
| 4 | Lorenz particles | From a draft fixture; the corpus version is stateless |
| 5 | `wave-equation-uiuc` | Accurate. Runs today. Omits `mathSpace`, `mousePos`, `coverMap` |
| 6 | Volume reaction–diffusion, three views | From a draft fixture; the corpus version has one view and no convert pass |
| 7 | Tiled export | No project |

So three of seven are real corpus projects and two of those are
accurate. Finding F1 (slider-driven repeat counts, which became D031)
rests on the fluid project that has no such loop. The only real iterative
solve in the corpus is `examples/08-fluids/incompressible-fluid`, with 20
hand-written passes and a constant count, and it does not run.

### The fixtures (`fixtures/`)

- All fixture shaders use plain `main()` and declare every uniform and
  sampler by hand. No fixture uses `shade(Fragment)` or `compute(Cell)`.
  By the design's own rule (a decision is settled only when a fixture
  validates it), D005 and D024 to D026 are ratified but not validated.
- The fluid fixture's schedule runs `splatDye` with no commit and then
  commits `dye` after `advectDye`. Under the design's own validation
  rules a replace pass whose output is never committed is an error, and
  the splat would be lost.
- The fluid fixture uses a constant `repeat: 40`, while the paper check
  describes a slider-driven count.
- The fluid fixture has no `Step` and no steps-per-frame.
- Display shaders compute `gl_FragCoord.xy / uResolution`. The tiling
  rule requires display passes to take coordinates from the provided
  fragment information, which a plain `main()` that is never rewritten
  cannot receive.
- Whether custom uniforms are declared or injected is not decided: the
  fixtures declare, `RUNTIME.md` says "per-pass interface injection".

### Internal inconsistencies

- `README.md` "Status" lists ratifications to D030 and says findings F1
  and F3 to F8 are open. `PAPER_CHECK.md` and `DECISIONS.md` mark F1, F3,
  F5, F6 and F7 resolved (D031 to D034).
- `DECISIONS.md` is headed "Last reviewed: 2026-07-15" but contains
  ratifications dated 16 July.
- References to an earlier decision log survive: "D103 carried over",
  "D104/D011", "D107 of the old log", "O005-era". That earlier draft was
  never committed.
- `SHADERTOY.md` lists `iChannelTime` and `iSampleRate` as supported;
  the current engine has neither.
- `SHADERTOY_INTEGRATION.md` recommends M2 while the interim policy in
  `DECISIONS.md` is M3. It notes that an earlier draft marked one model
  settled without ratification.

### Things the design does not cover

- Editor comfort: how a shader file reads to a GLSL language server or
  linter when names are provided from outside.
- A test runner for GLSL functions.
- Tooling for an AI collaborator (headless compile check, render a frame
  to an image).
- The interface layer. It keeps the panels and leaves layouts as an open
  item (O010).
- Commands from scripts: reset, apply a preset then reset, pause, buttons
  with callbacks. The corpus uses all of these.
- An explicit Reset that re-runs an init shader with the current slider
  values. `resetOn` covers only the automatic case, and on an
  initial-condition slider it would restart the simulation mid-drag.
- Sampling state per read instead of per resource.
- Changing steps per frame or instance count from a control.
- Compatibility for existing 0.2.7 users. It says only that old projects
  load through the compatibility path with migration diagnostics.
- How a multi-file project is shared or remixed.

### Name collision

Three existing shaders define an ordinary lighting helper called `shade`:
`examples/implicit-surface-tracer/shader.glsl:210` in webgl-demos, and
`demos/examples/circumradius-linkage/surface.glsl:135` and
`demos/examples/linkage-levelset-torus/image.glsl:154` in this repo.
Entry-point detection would have to go by signature.

## History relevant to it (`reports/8`)

- shader-sandbox was seeded from webgl-demos on 16 November 2025: commit
  `874efdb` added a "Shadertoy Runner v1" spec and a copy of the
  webgl-demos system as reference, and deleted the 29 older scenes.
- webgl-demos's own rebuild spec (branch `rebuild`, November 2025) chose
  "ping-pong swaps immediately after each write" and recorded batch swap
  at frame end as rejected for being more complex.
- An earlier webgl-demos developer manual records the decision to allow
  circular buffer dependencies with an explicit order: "render order
  determines causality".
- A deleted 41 KB roadmap in webgl-demos (`docs/TODO.md` before commit
  `d3294d6`) sketches function-shaped pass templates,
  `vec4 update(vec2 uv, vec4 current)` and `vec3 visualize(vec4 state)`,
  the nearest earlier statement of the idea behind `compute` and `shade`.
- webgl-demos deleted `src/passes` and `src/params` in December 2025 as
  "false abstractions"; demos were to be self-contained.
- webgl-demos already has a wall-clock accumulator fixed-step mode, which
  the July design defers (D029).
