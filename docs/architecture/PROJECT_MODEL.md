# Native project model

What authors see and write. Runtime semantics live in
[EXECUTION_MODEL.md](EXECUTION_MODEL.md); engine internals in
[RUNTIME.md](RUNTIME.md). Examples below are **conceptual** until their
fixture exists (see [DECISIONS.md](DECISIONS.md) for what is frozen).

## The authoring spectrum

### Shadertoy

A compatibility adapter with Shadertoy names, entry points, channels, and
buffer timing, specified separately in [SHADERTOY.md](SHADERTOY.md). It
shares the runtime, not the authoring model. Nothing in this document
applies to Shadertoy projects.

### Standard

The default native experience: describe the mathematics, get a polished
interactive result. Standard supplies automatically:

- A full-canvas fragment pass, a default view, and a real-time schedule.
- Native built-in uniforms (time, resolution, frame, pointer).
- Custom uniforms with inferred controls; explicit range/step/label/group
  when wanted.
- Named textures and cubemaps.
- Multi-buffer computation with snapshot semantics and `stepsPerFrame`.
- Interaction controllers: pointer, pan/zoom, orbit, drag points.
- Sensible resource formats, initialization, and resize policy.
- A small set of polished layouts.
- Deterministic image and animation export.

"Standard" means the system can infer the ordinary behavior — not that the
project is single-pass. A reaction–diffusion system is a Standard project.

### Advanced

The same model with more written down. Advanced adds explicit schedules,
more resource kinds (volumes, data textures, geometry, structured buffers),
custom vertex shaders and instancing, multiple named views, script systems,
uniform timelines, custom panels, and tiled/accumulated export.

There is no `mode: "advanced"`. The presence of explicit options is the only
boundary, so a Standard project grows without rewriting.

## Config schema versioning

Every config declares `"schema": 1`; omitted means the current schema,
interpreted as **Standard — the default experience** (D021). Pre-0.4
projects (all `mainImage`-based) load through the compat path with
migration diagnostics; the exact mechanics follow O014. Breaking
releases bump the schema number, ship a migration note, and where
practical a migration helper. The loader refuses schemas it does not
know, loudly (D012).

## The six concepts

### 1. Resources

A resource is named GPU data available to passes.

| Family | Examples |
|---|---|
| External media | image, equirectangular, cubemap, video, webcam |
| Field | 2D scalar/vector field, accumulation texture |
| Volume | 3D texture |
| Data texture | per-element state stored as texels (particles, agents, samples) |
| Structured data | uniform buffer, array of transforms |
| Geometry | vertex/index buffers, generated grid, instances |
| LUT | 1D lookup written by a control (transfer functions, colormaps) |

A stateful resource carries: format, size (fixed, view-relative, or
explicit), filtering, wrapping, initialization, resize policy, and history.
Standard infers most of these — a PDE field defaults to a float format,
nearest sampling, a stable grid, an init shader or clear value, and one
previous version.

Two properties deserve calling out because whole capability classes depend
on them:

- **`resetOn`** — a resource may declare the inputs (camera uniforms,
  material controls, resolution) whose change invalidates it. The runtime
  re-initializes it before the next step and resets its sample counter.
  This serves every progressive computation — path tracing, progressive
  supersampling, convergence solvers — and is the narrow conditional we
  support; we add no general conditional scheduling beyond it.
- **History** — a resource may keep N previous versions (wave equations
  read two time levels back). History depth is declared, not emergent from
  ping-pong accidents.

The friendly keys `buffers` and `textures` remain as shorthands and
normalize into resources.

### 2. Passes

A pass is one GPU operation. It declares its shader source(s), the
resources it reads, the resource(s) or view it writes, its iteration
domain, and optional render state (blend, depth, clear).

Iteration domains:

- **Pixels** of a target (fullscreen fragment pass — the default).
- **Cells** of a volume (executed slice-by-slice; see RUNTIME.md).
- **Vertices/instances** of geometry (custom vertex + fragment shader).

Two rules are settled:

- **Passes are named**, and pass names are distinct from output names,
  because several passes may write one resource (D103 carried over).
- **A pass may write multiple targets (MRT).** A coupled two-field update
  with a shared stencil is one pass writing two fields — half the texture
  fetches of one-pass-per-field. MRT is first-class, not an Advanced
  afterthought, because coupled fields are the headline use case.

### 3. Schedules

A schedule says when passes run and when writes become visible. Most
Standard projects never write one; the system infers:

1. Re-initialize any `resetOn`-dirty resources.
2. Run the simulation step (all update passes against one snapshot),
   `stepsPerFrame` times.
3. Commit.
4. Render views.

Advanced projects write explicit schedules — sequences, per-resource
commits, repeat blocks, different frequencies — in the vocabulary of
[EXECUTION_MODEL.md](EXECUTION_MODEL.md). The public syntax (O006) is
chosen only after iterative-solve and progressive-accumulation fixtures
are modeled in the internal IR.

### 4. Uniforms

`uniforms` remains the author-facing name (settled, D006). A uniform
declaration bundles GPU information (type, value, array shape) with control
information (label, range, step, style, group, visibility); internally
these are distinct.

Each uniform holds **one stored value; every setter writes it and the
last writer wins** (D028):

| Source | Example |
|---|---|
| Constant | a fixed parameter |
| Built-in | `uTime`, `uResolution`, `uFrame`, `uPointer` |
| UI control | slider, color picker, enum, vector pad |
| Controller | orbit camera → view matrix; drag controller → point array |
| Timeline | keyframed track for animation and export |
| Script | a JavaScript system's declared output |

Sliders, presets, scripts, and timelines all write that one stored
value; a playing timeline writes every frame, so pause to hand-adjust
(D028). Built-ins and controller outputs are runtime-fed and not
user-writable.

Controls may also feed small resources, not just uniforms: a transfer
function or colormap editor writes a 1D LUT texture. Buttons, commands,
and explanatory text are UI actions, not uniforms.

### 5. Systems

Systems are the JavaScript participants, generalizing today's `setup` /
`onFrame` scripts and interaction handling.

- **Controllers** are built-in systems bound to views for input: pointer,
  pan/zoom, orbit camera, drag points. A controller attaches to one or more
  views and writes project-level uniforms. Because outputs are ordinary
  uniforms, linked views (a pointer in one fractal view writing a parameter
  uniform another view reads) need no special mechanism — interaction
  routing is uniform routing.
- **Scripts** are author systems with declared outputs (uniforms they
  write, resources they upload) and a defined phase (before simulation or
  before presentation). Typical use: computing geometry or datasets in
  JavaScript and uploading them as typed arrays. Scripts receive runtime
  time — never wall clock — so export stays deterministic.

Declared outputs let the plan compiler validate the whole graph, including
the JavaScript parts.

### 6. Views

A view is a named visual output: a display pass (or reference to one), a
target resolution, an optional controller binding, and a layout slot. Views
read committed resources and never advance simulation.

The boundary between schedule and view is the pass's output (D032): a
pass that writes resources is scheduled; a pass that writes a view
belongs to that view and runs when the view presents. Authors never
state the distinction — it follows from whether the pass declares
`writes`.

`screen` remains shorthand for the single default view. Multiple views
share one GL context and one set of resources (settled, D011 — see
RUNTIME.md for the presentation mechanics), so a simulation advances once
per frame however many displays and diagnostics read it.

## Shader entry points

Both are native; neither is a capability tier.

### Ordinary GLSL

A conventional fragment `main()` writing a declared output. The package
injects only declarations and requested modules; it never rewrites the
body.

### `shade(Fragment)`

```glsl
vec4 shade(Fragment f) {
    // f.pixel      pixel coordinates
    // f.uv         0–1
    // f.coord      centered, aspect-correct, y-up
    // f.resolution target resolution
    return vec4(/* color */);
}
```

The package generates `main()` around it. Names and fields are ratified
(D023, D024): `pixel`, `uv`, `coord` (centered, unit half-height, y-up),
`resolution`. `shade` may return `vec3` (alpha = 1) or `vec4` (D025).

Non-visual passes get the matching shorthand `compute(Cell)` (D026),
returning `float`/`vec2`/`vec3`/`vec4` to match the target field's
channel count; `main()` always works.

## Growth story: reaction–diffusion to fluid

A Standard two-field PDE:

```text
resources:
  fields: chemicals (RG float field, init.glsl)
passes:
  evolve:  reads chemicals, writes chemicals   (one MRT pass or per-field passes)
  display: reads chemicals, writes screen
options:
  stepsPerFrame: 10
```

All updates in a step read one snapshot and commit together — declaration
order cannot change the result (D027). To become a fluid solver with an
iterative pressure solve, the author adds what inference cannot know:

```text
schedule (conceptual):
  repeat stepsPerFrame:
    run advect          commit velocity
    repeat 40:
      run jacobiPressure  commit pressure
    run project         commit velocity
  present views
```

Resources, shaders, uniforms, and views keep their meaning; only the
schedule became explicit.

## The normalized plan

Every authoring format — one GLSL file, Standard config, Advanced config,
Shadertoy folder — compiles into one immutable, validated `RuntimePlan`:

```text
RuntimePlan
├── shader modules and compiled interfaces
├── resources: format, size domain, history, init, resetOn, resize policy
├── passes: reads, writes, domain, state
├── schedule IR (EXECUTION_MODEL.md)
├── uniforms with resolved single sources
├── systems: controllers and scripts with declared I/O
├── views and presentation layout
└── export defaults
```

Compilation never mutates the author's config. The plan, not the config,
is what the executor, the exporter, and the diagnostics all consume.
