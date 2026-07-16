# Execution model

For a single image shader, execution order is invisible. For feedback,
multi-pass pipelines, and PDEs, execution order **is part of the
mathematics**. This document defines runtime semantics independently of
config syntax; it is the contract the semantics tests enforce.

## Terms

- **Display frame:** one image presented or exported.
- **Simulation step:** one logical advance of the model.
- **Substep:** a repeated simulation step within one display frame.
- **Pass:** one GPU operation.
- **Resource version:** a readable or writable state of a resource.
- **Commit:** make completed writes visible as the current state.

## Resource versions

A stateful resource has logical versions. The canonical, IR-level
binding is **commit-indexed** (D033):

- **committed(k):** the k-th most recent commit of the resource visible
  at the moment a pass executes (k = 0 is the latest). The history ring
  advances per `Commit`, never per step; declared history depth bounds k.
- **next:** the destination a replace pass writes during a step.

Author-facing names are surface sugar over this: **current** and
**previous** both bind to committed(0) at read time (the docs use
"previous" in snapshot contexts and "current" in sequential ones — same
binding, resolved at the pass's position); **previous(k)** binds to
committed(k−1). The validator resolves every read to a committed(k) so
the executor never guesses, and error messages report the canonical
form.

Ping-pong textures, texture rings, and copies are implementation details.
Shader behavior is defined by logical versions, never by which texture is
bound. Stateless resources (an immutable image) have only `current`.

## Snapshot semantics (Standard default)

When several update passes form one simulation step:

1. Every update reads the same committed snapshot.
2. Each writes its own `next` output.
3. No update observes another's uncommitted write.
4. All completed outputs commit together.

```text
next A = f(previous A, previous B)
next B = g(previous A, previous B)
commit A, B
```

Why this is the default: reordering independent pass declarations cannot
change the result; coupled PDEs naturally live at one time level; cycles
are diagnosable; authors reason about old/new state without knowing swap
details. Ratified as the unscheduled default (D027); the
order-permutation test guards it from Stage 3 on.

### Cost model (normative)

Snapshot groups compile to **ping-pong with deferred swap — zero copies —
whenever each resource has a single writer in the group.** Only a
multi-writer resource inside one group forces a copy, and the validator
warns when it does. An implementation that commits by copying in the
single-writer case is wrong, not merely slow: it doubles bandwidth on
every simulation in the system.

### Multiple render targets

A group of updates sharing inputs may be authored as one MRT pass writing
several fields. Semantically an MRT pass is a degenerate group: all its
outputs commit together. The compiler may also *suggest* MRT when several
grouped passes share reads and a domain.

## Write modes: replace and modify

The rules above assume every write *replaces* a resource version. Blended
draws break that assumption: additive particle trails, overlays, and
splat-style local writes are fixed-function read-modify-writes against
the target's **existing** content. Writing them into a fresh `next` gives
the blend nothing to blend against; copying current→next first pays a
copy the cost model forbids. So a pass declares one of two write modes:

- **`replace`** (default): sample `previous`, write `next`, commit
  publishes. Everything described elsewhere in this document.
- **`modify`**: draw in place onto the target's *current committed*
  version — for blending, partial-coverage geometry, and scissored
  updates. A modify pass may **not** sample its target (a true hazard,
  rejected by the validator) and needs no commit; its writes are
  immediately part of `current`.

Discovered by the particles fixture (`fixtures/particles/NOTES.md`);
status W108.

## Sequential semantics (Advanced)

Some methods intentionally consume newly committed values:

```text
next velocity = f(current position, current velocity)
commit velocity
next position = g(current position, current velocity)   // sees new velocity
commit position
```

Commits are explicit in the schedule. Pass declaration order alone never
implies sequential visibility. Symplectic leapfrog integration and
pressure-projection fluids are the validating fixture classes.

## The schedule IR

The normalized scheduler is a small intermediate representation. It is
**internal and specified first**; Standard inference and the Shadertoy
adapter compile *to* it, the public Advanced syntax (O006) is sugar *over*
it, and hazard/cycle/determinism checks are IR analyses testable without a
GPU.

| Op | Meaning |
|---|---|
| `Run(pass)` | Execute one pass; a `replace` pass writes `next`, a `modify` pass draws onto committed(0) and needs no commit (W108) |
| `Group[ops]` | Execute against one shared snapshot; members read `previous`, never each other's writes |
| `Commit(resources)` | Publish completed writes as `current` |
| `Sequence[ops]` | Execute in order |
| `Repeat(n)[ops]` | Execute a block n times — n is a constant or an integer-uniform reference, sampled once per frame (D031) |
| `Step[ops]` | One simulation step: the body observes one `stepIndex`; the counter increments on exit (D030) |
| `Initialize(resource)` | Establish contents: clear, init shader, external data, control data (D034), script upload, or copy |
| `Present(views)` | Run each active view's display pass at view resolution and blit; display passes write no resources (D032) |

The **only conditional** is the guard the compiler inserts for `resetOn`
resources: *if any watched input changed since the last frame, run this
resource's `Initialize` and reset its sample counter, before substeps.*
The same guard re-runs `Initialize` for control-fed resources when
their source control changes (D034) — one mechanism, two triggers.
This narrow trigger serves the whole progressive-computation class —
path tracing, progressive supersampling, convergence solvers; general
conditional scheduling stays deferred until a capability, not a single
project, demands it.

`Group` means simultaneous in data visibility, not concurrent GPU
execution — WebGL runs grouped passes serially while withholding results
until the commit.

### Inferred Standard schedule

```text
Sequence[
  (guarded) Initialize(dirty resetOn resources)
  Repeat(stepsPerFrame)[
    Step[
      Group[ Run(each update pass) ]
      Commit(their outputs)
    ]
  ]
  Run(convert passes)                // frame-frequency resource writes
  Present(views)                     // runs each active view's display pass (D032)
]
```

`stepsPerFrame` repeats **only the simulation-step block**. Display
conversion, post-processing, and diagnostics run at frame frequency unless
scheduled otherwise.

### Validation (IR analyses)

The plan compiler must:

- Reject reads of undeclared or format-incompatible resources.
- Reject a `Group` member reading another member's output (that is a
  `Sequence` + `Commit`, and the error message says so).
- Reject reads of `next` outside history/self-feedback declarations.
- Detect commit-less cycles and report the missing history edge.
- Bind each read to a specific version so the executor never guesses.
- Skip passes whose outputs are provably unread, with a diagnostic note.
- Reject nested `Step` blocks; warn on a `Step` containing no `Commit`
  (D030).
- Reject a uniform-sourced `Repeat` count whose uniform is not
  integer-typed with finite declared bounds and `min ≥ 0`; report the
  plan's static worst-case pass count from those bounds (D031).
- Write mode is part of the pass type (W108): reject a `modify` pass
  sampling its own target (true hazard); reject a `replace` pass whose
  `next` is never committed — the commit-less error applies to replace
  passes only.
- Reject a read of committed(k) beyond the resource's declared history
  depth (D033).

## Clocks and input sampling (D014, D029)

Determinism dies in the details of time. The settled rules:

- **Simulation time** is `stepIndex × dt`: an integer step counter and a
  fixed timestep. `dt` never derives from wall-clock deltas.
- **The step boundary is explicit (D030):** the counter increments only
  on exit from a `Step` IR block. Every pass inside one `Step` sees the
  same `stepIndex`; a `Repeat` inside a `Step` (an iterative solve)
  never advances it. Passes outside any `Step` (display, converts) read
  the latest value.
- **Display time** is a separate transport clock (the existing Transport
  survives as this clock). Pause, scrub, and playback rate affect it, not
  the step counter, except through the schedule.
- **Inputs and UI uniforms are sampled once per display frame, before
  substeps.** All substeps of one frame see identical uniforms. Nothing
  changes mid-step.
- **Uniform-sourced `Repeat` counts follow the same rule (D031):**
  resolved once per frame from the stored uniform value, clamped to the
  uniform's declared `min`/`max` with a diagnostic on clamp. A count of
  0 skips the block.
- **Scripts receive runtime time**; reading wall clock in a system is
  unsupported.
- Shaders may read both clocks (display time, simulation step/time) plus
  a per-resource **sample counter** for accumulation (resets with
  `resetOn`).
- Offline export drives the same executor with an explicit frame rate,
  `dt`, warmup, duration, and resolution; a live run and an export with
  identical inputs produce identical committed states within GPU float
  limits.

**Steps per display frame (D029):** authors set an integer
`stepsPerFrame`; simulation speed varies with the display's frame rate.
A wall-clock accumulator mode may be added later as a new option — it
would preserve every rule above.

## Initialization, reset, resize

Each stateful resource declares or inherits an initialization (clear
value, init shader, external data, script upload, or copy-from). **Reset**
replays initializations in deterministic order, zeroes the appropriate
counters, and renders one valid frame.

Resize policy is independent of initialization, chosen per resource:

- Track a view's resolution and reinitialize on resize (visual feedback).
- Keep a fixed mathematical grid regardless of view size (PDEs — the
  Standard default for fields with an explicit size).
- Resize and resample old state.
- Resize and clear.

## Views and presentation

A view reads committed resources; rendering it never advances state.
This is structural, not conventional (D032): a view owns its display
pass, which declares no resource writes — so committed state is
produced by the schedule alone, and `Present` is a pure render of it.
View visibility, resize, and export tiling re-run display passes
without ever touching the schedule. Several views present after one
simulation advance:

```text
simulate once → Present[density view, velocity view, error view]
```

Each view has its own resolution, controller binding, and display pass;
all views share the project's resources and single GL context
(RUNTIME.md). Interaction routing between views is uniform routing: a
controller bound to view A writes uniforms that view B's passes read.

## Resolution domains

Resource size and view size are independent:

- A PDE evolves on a fixed 512² grid while its view fills the browser.
- An 8K export re-renders views without touching the PDE grid.
- A path tracer *chooses* to key its accumulation resource to view
  resolution — and `resetOn: resolution` gives it invalidation on resize.

Every resource states (or inherits) which resolution domain it follows.

### Tiled rendering

Export beyond GPU limits renders views in tiles. Tiling is a
**presentation** concern: display passes must be resolution-agnostic
(deriving coordinates from the provided fragment/view info), and the
exporter supplies per-tile viewport and projection offsets. Simulation
resources are never tiled. Passes that intrinsically couple to full-frame
pixel neighborhoods (screen-space blur of the final view) declare it and
either render at full resolution into a tile-safe intermediate or refuse
tiling with a clear error.

## Shadertoy scheduling

The adapter compiles Shadertoy's fixed BufferA–D + Image order and
self-read-previous-frame behavior directly into the IR (`Sequence` of
`Run`+`Commit` per buffer, matching Shadertoy's sequential buffer
visibility), preserving Shadertoy timing exactly rather than imposing
snapshot semantics. Pinned details live in [SHADERTOY.md](SHADERTOY.md).

## Determinism contract

Given identical initial resources, uniform sources, scripted inputs,
schedule, `dt`, and frame count, offline execution reproduces interactive
execution. Enforced by:

- the clock and sampling rules above;
- explicit `Initialize`/reset as runtime operations;
- timeline-sourced uniforms for animation instead of wall-clock-driven
  values;
- semantics tests that run the same plan live-style and export-style and
  compare committed states by readback.
