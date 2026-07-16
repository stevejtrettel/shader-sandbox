# Roadmap

Dependency order, not a date promise. Each stage delivers a **band of the
capability space** (README.md): the primitives that cover it, the tests
that pin it, and validation fixtures drawn from the corpus. Fixtures are
evidence of coverage, never the target — any project in the band must
compose from the stage's primitives, including ones nobody has thought of
yet.

Every stage ends with working fixtures, passing tests, and documentation;
testing is a column of each stage, not a later phase. Breaking releases
include an upgrade guide and, where practical, a migration helper
(configs are schema-versioned, D012).

Value concentrates in Stages 0–4: Shadertoy compatibility plus native 2D
computation, interaction, and export is a complete, shippable product.
Stages 5–7 extend coverage to the harder bands and are honestly
speculative until their fixtures exist.

## Stage 0 — Fixtures and frozen semantics

**Goal:** convert design questions into artifacts. No prose exit tests.

Status 2026-07-16: substantially complete. Entry points, built-in names,
`Fragment`/`shade`/`compute` signatures, snapshot default, uniform
conflict rule, and `stepsPerFrame` are ratified (D022–D029); five draft
fixtures exist under `fixtures/`. The **IR paper check is done**
([PAPER_CHECK.md](PAPER_CHECK.md)): seven corpus projects hand-compiled;
the only missing operation was the explicit step boundary, added as
`Step` (D030); findings F1, F3–F8 are ledgered there and settle as the
typed IR is designed. Remaining work below.

Work remaining:

- Specify the **schedule IR** (EXECUTION_MODEL.md) as typed structures
  with a validator: hazards, cycles, version binding — unit-tested, no
  GPU. **This is the first code of the rebuild.** The open paper-check
  findings (F1, F3–F8) are answered in the course of writing these
  types.
- Grow the fixture sample toward full axis coverage (still missing:
  script-uploaded geometry, timelines, tiled export). The sample is a
  floor; the corpus keeps growing.
- Resource schema key spellings (O005) are reviewed and frozen when the
  loader is built, by reading the fixture configs and renaming what
  reads badly.

**Exit:** the IR validator passes its unit tests; the paper check found
no missing IR operation (or filed it — done, D030); no fixture required
a mechanism outside the six concepts.

## Stage 1 — New executor, Shadertoy as first client

**Goal:** the contained rewrite (RUNTIME.md), validated by compatibility.

Work:

- Build `plan` → `RuntimePlan` → `exec` for the subset Shadertoy needs:
  2D resources, sequential schedule, self-read history, media channels.
- Build the Shadertoy **desugarer** (translation table in
  SHADERTOY_INTEGRATION.md) emitting IR; pin the semantics table in
  SHADERTOY.md as conformance fixtures with goldens generated from the
  current engine.
- Stand up the headless golden-image harness in CI, plus the cross-path
  identity test (dev = embed = export).
- Wire Transport, OfflineRenderer, and the capture panels to the new
  executor.
- Delete the old `ShaderEngine` core when the suite is green.

**Exit:** the full conformance corpus passes on the new executor in CI;
0.3.0's four author jobs (DESIGN.md) all work through it; the old render
core is gone.

## Stage 2 — Stateless native shading

**Capability band:** (stateless, pixels, constants/controls, one view).

Work:

- Ordinary GLSL `main()` and the `shade(Fragment)` wrapper per the
  ratified names and fields (D022–D025).
- Native built-ins including pointer behavior; Shadertoy vocabulary
  desugars ambiently per the O014 interim policy.
- Uniforms on the one-stored-value model (D028), inferred controls, and
  explicit range/step/label/group/style.
- Shader module resolution with source maps; live edit + last-good
  rollback on the new engine.
- The `shader convert` transpiler (Shadertoy → native syntax), sharing
  the desugarer front end and verified by rendering original and
  converted output identically through the conformance harness.

**Exit:** the stateless fixtures (domain coloring, grids, fractal
explorers, basic raymarchers) run and export; none mentions a Shadertoy
name; shader errors point to author files/lines.

## Stage 3 — Stateful Standard computation

**Capability band:** feedback and coupled fields with snapshot updates —
the inferred-schedule half of the update-discipline axis.

Work:

- Named field resources: formats, fixed/view-relative sizes, init
  shaders/clears, resize policies, history depth.
- Logical versions with the zero-copy deferred-swap commit (cost model in
  EXECUTION_MODEL.md); MRT passes.
- Inferred snapshot schedule (D027) and `stepsPerFrame` (D029); the
  `compute(Cell)` entry (D026) with `Cell`'s exact fields frozen here.
- **Capability tiers and float fallbacks** (RUNTIME.md) — needed by the
  first field resource, not at polish time.
- First diagnostics: value probe, min/max/mean, NaN detector,
  false-color inspector, plan inspector.

**Tests:** order-permutation test (shuffling update-pass declaration
never changes committed state, by readback); **numerics tier begins** —
heat-kernel decay rate and Game-of-Life exact-match tests against CPU
references.

**Exit:** feedback and coupled-field fixtures (trails, cellular automata,
reaction–diffusion, wave equations) run at interactive rates with
`stepsPerFrame`, pass the permutation test, and export deterministically.

## Stage 4 — Interaction and instrument polish

**Capability band:** the value-source axis (controllers, richer controls)
plus presentation polish — Standard projects become finished mathematical
instruments.

Work:

- Controllers with lifecycle management: pointer, pan/zoom, orbit camera,
  drag points (hit-tested uniform arrays).
- Uniform groups, enums, presets, vector controls; controls-feed-LUT
  plumbing (transfer functions, colormap editors).
- First stable GLSL modules: coordinates, complex arithmetic, SDFs,
  stencils, colormaps, noise, camera rays.
- Polished layouts (a small set, not a layout language).
- Deterministic still/animation export exercised across all Standard
  fixtures.

**Exit:** interaction fixtures (draggable constructions, orbit-controlled
raymarchers, parameter-rich explorers) are authored with zero custom DOM
and zero manual event listeners; each exports a reproducible animation.

## Stage 5 — Explicit scheduling, public

**Capability band:** the rest of the update-discipline axis — sequential
commits, iterative solves, multi-rate passes, progressive invalidation.

The IR already executes sequences, commits, and repeats (it ran Shadertoy
in Stage 1); this stage designs the **public syntax** (O006) over it,
plus:

- Schedule validation errors worth reading (the Group-member-read error
  names the fix).
- `resetOn` invalidation with per-resource sample counters.
- Separate simulation-step vs display clocks surfaced to shaders;
  different per-pass frequencies.
- Deterministic init/reset schedules as public API.

**Tests:** symplectic energy-conservation (leapfrog conserves to O(dt²));
Schrödinger norm preservation; divergence bound after pressure
projection. These validate scheduling semantics more sharply than any
image diff.

**Exit:** sequential-integrator and iterative-solve fixtures state which
time level every pass reads; progressive-accumulation fixtures reset on
watched-input change and converge identically live and offline.

## Stage 6 — Data, geometry, volumes, many views

**Capability bands:** the remaining data kinds (data textures, structured
buffers, geometry, volumes), the vertex/instance and volume-cell iteration
domains, script systems, and the multi-view/linked-view presentation axis.
Geometry stays scoped to field visualization (README principle).

Work:

- Data textures + vertex-texture-fetch geometry passes; instancing.
- Script systems with declared outputs; typed-array geometry/UBO upload
  on a defined lifecycle (generalizing current setup/onFrame/std140).
- 3D texture resources with slice-by-slice update (RUNTIME.md); volume
  raymarching display; LUT controls wired to volume display.
- Single-context multi-view presentation (D011): named views, blit
  pipeline, per-view controllers, linked interaction via shared uniforms.
- Per-pass GPU timing in diagnostics.

**Exit:** a simulation advances exactly once per frame while several
views (display + diagnostics) render; linked-view fixtures route
interaction through ordinary uniforms with no special casing;
particle-class fixtures sustain interactive rates at 10⁶ elements on a
mid-range GPU (number revisited against hardware reality, in the open).

## Stage 7 — Timeline and heavy output

**Capability band:** the far end of the output axis — reproducible,
publication-scale results.

Work:

- Uniform **timeline** source: keyframed tracks with easing, one timeline
  clock, scrubbable in dev, authoritative in export.
- Tiled high-resolution export with the tile-safety rules
  (EXECUTION_MODEL.md); accumulation-aware export (N samples per frame
  offline); frame sequences; composed-layout export of multiple views.
- Packaging of reusable controllers, GLSL modules, and presentation
  components; project-level performance/capability report.

**Exit:** a timeline-driven tiled export produces an 8K-class frame
sequence, bit-stable across two runs, from a config a human can read;
accumulated renders reach print resolution.

## Capability → stage map

| Axis | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|
| State topology | stateless | feedback, coupled | | | hierarchies via data kinds | |
| Update discipline | none | snapshot | | sequential, iterative, multi-rate, `resetOn` | | |
| Data kinds | media | fields | LUTs | | data textures, buffers, geometry, volumes | |
| Iteration domain | pixels | | | | cells, vertices, instances | |
| Value sources | constants, controls | | controllers | | scripts | timelines |
| Presentation | one view | | layouts | | several/linked views | composed export |
| Output | realtime, stills | deterministic video | | | | tiled, accumulated, sequences |

## Deliberately not planned

- Sound shaders and audio-driven architecture (D008/F001).
- General 3D scene graphs, materials, asset pipelines (README principle).
- A monolithic templated raytracer framework (modules first).
- WebGPU backend before WebGL2 semantics are proven (F004) — though the
  IR avoids embedding WebGL-only assumptions gratuitously.
- General conditional scheduling beyond `resetOn` (EXECUTION_MODEL.md).
- Arbitrary UI layout machinery in Standard.
- CPU task graphs, transform feedback, and async readback into
  simulation — until a capability, not a single project, demands them.
