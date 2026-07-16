# Shader Sandbox architecture

This folder is the design reference for expanding Shader Sandbox from a
Shadertoy-oriented renderer into a general system for mathematical GPU
projects. It replaces the earlier draft plan in full.

## What we are building

One runtime, two products:

1. **The native system** (Standard/Advanced) is the point of the package: a
   flexible way to describe mathematical GPU projects — fields, simulations,
   ray tracers, particle systems, coordinated views — with smart defaults for
   the common cases and explicit control for the hard ones.
2. **Shadertoy compatibility** is a deliberate side option: a bounded,
   conformance-tested compatibility product ([SHADERTOY.md](SHADERTOY.md)).
   Standard is the default interpretation of every project; whether compat
   is an explicit opt-in mode or an ambient desugaring layer is an open
   decision ([SHADERTOY_INTEGRATION.md](SHADERTOY_INTEGRATION.md)). Under
   every model it is a client of the native runtime, never its foundation.

Standard and Advanced are not modes. Standard is what the system infers when
you say little; Advanced is the same model with more of it written down. A
project drifts from one to the other by adding options, and there is no
`mode` flag and no cliff.

## The six concepts

The native model is organized around six concepts. Everything an author
writes normalizes into them:

- **Resources** hold GPU data: textures, fields, volumes, data textures,
  geometry, structured buffers.
- **Passes** are single GPU operations with declared reads and writes.
- **Schedules** say when passes run and when their writes become visible.
  Ordering is part of the mathematics; it is never implicit.
- **Uniforms** are shader values, each one stored value that constants,
  controls, controllers, timelines, and scripts write — last writer wins
  (D028); built-ins are runtime-fed.
- **Systems** are JavaScript participants — interaction controllers and
  author scripts — that write uniforms and upload resource data on a
  defined lifecycle.
- **Views** display committed resources. They own presentation (resolution,
  camera, layout slot) and never own simulation state.

[PROJECT_MODEL.md](PROJECT_MODEL.md) defines these from the author's side;
[EXECUTION_MODEL.md](EXECUTION_MODEL.md) defines their runtime semantics.

## The capability space

The design target is a *space* of projects, not a list of them. Any
mathematical GPU project is a point in a small product space:

| Axis | Range |
|---|---|
| State topology | stateless → one feedback field → coupled fields → hierarchies of resources |
| Update discipline | none → snapshot → sequential commits → iterative solves → multi-rate |
| Data kinds | fields, volumes, data textures, structured buffers, geometry, LUTs |
| Iteration domain | pixels → volume cells → vertices/instances |
| Value sources | constants → controls → controllers → timelines → scripts |
| Presentation | one view → several views → linked views |
| Output | realtime → stills → video → frame sequences → tiled → accumulated |

The six concepts exist to cover these axes **orthogonally**, so that
projects are compositions, not features. Domain coloring is (stateless,
pixels, one view). A pressure-projection fluid is (coupled fields,
iterative solves, one view). A progressive path tracer is (accumulation
field, snapshot + invalidation, orbit controller, accumulated output).
None of them is special to the engine, and the next sixty projects should
be points in the same space, not extensions of it.

### The validation corpus

The design is tested against a growing corpus of real projects — ports
from `webgl-demos`, existing shader work, and new fixtures — sampled to
cover the axes, deliberately including awkward corners (sequential
integrators, invalidated accumulation, linked interaction, script-uploaded
geometry, tiled timelines). The corpus is open-ended: it is an acceptance
suite and demo gallery, never a requirements list.

Two rules keep the corpus from bending the design:

- **No bespoke mechanisms.** Every mechanism is justified by the
  capability axis it serves, never by one project. If a corpus project
  seems to need special-case machinery, that is a design smell: either a
  primitive is missing its general form, or the project is out of scope.
- **The metric is subsumption.** The measure of the design is how many
  corpus projects compose from existing primitives with zero new
  mechanisms. Each fixture that composes cleanly is evidence; each one
  that cannot is a bug report against the model, not a feature request.

Design questions are still settled by writing fixtures, not prose — but a
fixture validates a *capability*, and one fixture per capability corner is
a floor, not a ceiling.

## Design principles

### One executor, and only one

Interactive rendering, offline export, and Shadertoy compatibility all run
the same normalized runtime plan through the same executor. The Shadertoy
adapter is the executor's first client and its permanent regression suite.
There is no second engine anywhere — not in export, not in embeds, not in
compat.

### Fixtures before prose

Design documents describe intent; fixture projects define behavior. Every
settled decision in [DECISIONS.md](DECISIONS.md) links to the fixture that
validates it. If a fixture cannot be written, the decision is not settled.

### Simple projects stay simple

One GLSL file is a complete project. The system supplies the pass, view,
schedule, controls, and export. Graph vocabulary appears only when the
author needs it.

### Consequential ordering is explicit

When execution order changes the numerical method — sequential commits,
iterative solves, substeps — the configuration says so. We never encode
mathematics in object property order or incidental framebuffer swaps.

### Fail loudly, never approximately

An unsupported feature is a clear error with a message, in both the native
system and the compat adapter. Silent misrendering is the one unforgivable
failure mode for a tool aimed at mathematics.

### Mathematics is separate from presentation

Resources and passes belong to the project; views borrow them. Multiple
views inspect one simulation without advancing or duplicating it. Layout
changes never rebuild computation.

### Geometry serves field visualization

Vertex shaders, instancing, and custom geometry exist to draw glyphs,
arrows, particles, curves, and mathematical surfaces. This package does not
compete with three.js on general 3D scenes, materials, or asset pipelines,
and the roadmap prunes anything drifting that way.

### Determinism is a feature, not an aspiration

Fixed simulation timestep, integer step counters, per-frame input sampling,
and an explicit timeline make offline export bit-comparable to interactive
runs within GPU float limits. The rules live in
[EXECUTION_MODEL.md](EXECUTION_MODEL.md) and are enforced by tests, not
convention.

### Tested at three levels

1. **Conformance:** golden-image tests over copied Shadertoy projects and
   native fixtures, headless, with per-channel tolerance.
2. **Semantics:** unit tests on the schedule IR — order independence of
   snapshot groups, hazard detection, determinism — via small-grid float
   readback.
3. **Numerics:** acceptance tests against analytic ground truth — heat-kernel
   decay, wave dispersion, symplectic energy conservation, Schrödinger norm
   preservation. No other shader tool can express these tests; they are our
   sharpest validation of scheduling semantics.

## Document map

- [PROJECT_MODEL.md](PROJECT_MODEL.md) — what authors write: the six
  concepts, entry points, config shape, growth from one file to Advanced.
- [EXECUTION_MODEL.md](EXECUTION_MODEL.md) — what the runtime guarantees:
  resource versions, the schedule IR, commits, clocks, invalidation,
  determinism.
- [RUNTIME.md](RUNTIME.md) — how the engine is built: plan compiler,
  executor, single-context presentation, capability tiers, WebGL2
  constraints, diagnostics.
- [SHADERTOY.md](SHADERTOY.md) — the compatibility product: supported
  surface, pinned semantics, conformance suite, explicit non-goals.
- [SHADERTOY_INTEGRATION.md](SHADERTOY_INTEGRATION.md) — how Shadertoy
  constructs translate to native concepts, and the open scope question
  (O014; interim: ambient mixing).
- [ROADMAP.md](ROADMAP.md) — build order, per-stage tests and exit criteria,
  which capability axes each stage covers.
- [DECISIONS.md](DECISIONS.md) — settled, working, open, and deferred
  decisions, each with its validating fixture.
- [PAPER_CHECK.md](PAPER_CHECK.md) — the IR paper check: seven corpus
  projects hand-compiled to IR, and the findings ledger (F1–F8).

The completed 0.3.0 publishing design remains in the repository root at
[`DESIGN.md`](../../DESIGN.md); its four author jobs (HD images, HD video,
shelf-stable builds, embeds) are unchanged and the new runtime must keep
serving them.

## Status and next action (2026-07-16)

Design is settled enough to build. Ratified: the rebuild strategy (new
core beside the old engine, compat conformance validates cutover —
D010); entry points `main()` / `shade(Fragment)` / `mainImage`-desugared
(D022); built-in names and `Fragment` fields (D023–D025);
`compute(Cell)` (D026); snapshot default (D027); uniform conflict rule
(D028); `stepsPerFrame` (D029); explicit `Step` boundary (D030).
Interim: Shadertoy vocabulary mixes freely (O014, final call before
public release).

The IR **paper check is done** ([PAPER_CHECK.md](PAPER_CHECK.md), seven
corpus projects): the eight ops sufficed; findings F1, F3–F8 remain
open there and are settled as the types are written.

**The next concrete action is the first code of the rebuild: the
schedule-IR module** — typed structures + validator for the eight ops,
pure data, no GPU, unit-tested. Then Stage 1 (ROADMAP.md): the
executor with the Shadertoy desugarer as its first client, goldens
frozen from the current engine. Remaining open questions are listed at
the end of DECISIONS.md, none of which block starting.

## Maintenance rules

- A decision becomes **settled** only when its fixture exists and passes.
- When implementation contradicts a document, resolve explicitly; never let
  code and docs diverge silently.
- Public schemas stay out of prose until the fixture using them is written;
  examples in these documents are marked **conceptual** until then.
- Update ROADMAP stage status as implementation proceeds.
