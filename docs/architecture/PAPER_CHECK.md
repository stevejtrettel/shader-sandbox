# IR paper check (2026-07-16)

The Stage 0 exit test for the schedule IR: hand-compile real corpus
projects into the IR ops and record what breaks. Seven projects were
sketched, chosen against the capability axes rather than for comfort.
Result: **no missing operation was found except the step boundary**,
which became the `Step` op (D030). Remaining findings are ledgered at
the end; each needs its own discussion before the typed IR freezes.

Sources: `webgl-demos` (`new-demos/schrodinger-double-slit`,
`new-demos/fluid-2d`, `new-demos/wave-equation-uiuc`) and the draft
fixtures under `fixtures/` (pathtracer, particles, volume-rd).

## 1. Schrödinger double-slit — sequential leapfrog

One `rg32f` resource holds ψ; `updateReal` writes a new Re passing Im
through, `updateImaginary` must see the **new** Re. Sequential
visibility is the numerical method. Two commits, one step.

```text
Repeat(stepsPerFrame = 10)[
  Step[
    Run(updateReal)      // reads ψ.current, writes .next
    Commit(ψ)
    Run(updateImaginary) // reads ψ.current — sees new Re
    Commit(ψ)
  ]
]
Run(display) ; Present(main)
```

Bonus: the "Initial Conditions" sliders are a natural `resetOn` case —
the mechanism built for accumulation covers initial-condition parameters
for free.

## 2. Stable fluids — nested iterative solve

Every stage consumes the previous stage's committed write — pure
`Sequence`, no `Group` anywhere. The Jacobi loop nests *inside* the
step and must not advance simulation time (the forcing case for D030).

```text
Step[
  Run(advectVelocity) ; Commit(velocity)     // self-advection, reads velocity.current
  Run(diffuse)        ; Commit(velocity)
  Run(divergence)     ; Commit(divergence)   // scratch resource, no history
  Repeat(uPressureIterations)[               // ← a UI slider (finding F1)
    Run(pressureJacobi) ; Commit(pressure)   // warm-started from last frame
  ]
  Run(projection)     ; Commit(velocity)
  Run(advectDye)      ; Commit(dye)
]
Run(display) ; Present(main)
```

## 3. Progressive path tracer — accumulation + invalidation

No explicit schedule at all: the progressive machinery is the inferred
Standard schedule plus `resetOn`. The shader keeps its per-pixel sample
count in alpha (also the RNG seed), so a clear restarts everything.

```text
Sequence[
  guard: {uCamPos, uCamTarget, uFov, uAlbedo, uRoughness,
          uLightIntensity, resolution} changed → Initialize(accum)
  Repeat(1)[ Step[ Group[Run(trace)] ; Commit(accum) ] ]
  Run(display) ; Present(main)
]
```

## 4. Lorenz particles — geometry, modify writes, heterogeneous repeat

Explicit schedule; the richest IR in the corpus. `draw` renders 1M
points (vertex texture fetch) additively **in place** onto the trail —
write mode `modify`, no commit (W108). Draw inside the substep loop
samples integral curves at `dt` resolution; outside, at frame
resolution — ordering is meaning.

```text
Sequence[
  guard: {uViewProj, resolution} changed → Initialize(trail)
  Run(fade) ; Commit(trail)                  // outside any Step: frame-frequency
  Repeat(4)[
    Step[
      Group[Run(simulate)] ; Commit(particles)  // respawn hash uses uStepIndex
      Run(draw, mode=modify)                    // onto trail.current, additive
    ]
  ]
  Run(display) ; Present(main)
]
```

## 5. Wave equation — three-level stepping via channel packing

Prediction failure worth recording: the corpus does **not** use deep
history. `wave-equation-uiuc` packs uₙ and uₙ₋₁ into RG channels of one
texture and shifts channels in the update — a single self-feedback
pass, pure Standard. A native author could instead declare `history: 2`
and read `previous(2)`; both spellings must work, but no corpus code
combines deep history with multi-commit schedules (see F3). Also
notable: the shader derives `dt` internally from the CFL condition and
a slider — the runtime's step counter is bookkeeping it never reads.

```text
Repeat(3)[ Step[ Group[Run(update)] ; Commit(wave) ] ]
Run(display) ; Present(main)
```

## 6. Volume reaction–diffusion, three views

The slice loop stays out of the IR entirely (O012): `Run(evolve)` is one
op; the executor owns the 128 `framebufferTextureLayer` draws. The
`frequency: "frame"` convert pass lands outside the repeat. Three views
present from one committed volume; two share an orbit controller via
ordinary uniforms (W106) — multi-view costs zero IR mechanism.

```text
Sequence[
  Repeat(2)[ Step[ Group[Run(evolve)] ; Commit(chem) ] ]
  Run(toDisplay) ; Commit(chemView)          // frame frequency, 16f/linear for display
  Present(density, surface, slice)
]
```

## 7. Tiled export — sketched against the path tracer (no corpus demo)

(`demos/sphere-raymarch-tiled` is texture-wrap tiling — unrelated.)
An 8K export of the path tracer exceeds `MAX_TEXTURE_SIZE`: the
view-keyed `accum` resource cannot exist at export resolution. The
export driver re-runs the same plan per tile, outside the IR:

```text
for each tile:
  Initialize(accum @ tile size)
  Repeat(samples)[ Step[ Group[Run(trace)] ; Commit(accum) ] ]
  Present(main, viewport/projection = tile) → emit tile
stitch
```

This works because accumulation is per-pixel independent, and it forces
a refinement of the tiling rule (F8): fixed-grid resources (PDEs) are
never tiled and display passes reading them must be resolution-agnostic;
**view-keyed per-pixel resources are re-instantiated per tile.** The
tile loop never enters the IR — the one-executor principle holds.

## Findings ledger

| # | Finding | Status |
|---|---|---|
| F1 | `Repeat` counts need a uniform source (slider-driven solver iterations), sampled once per display frame per D014 | **resolved — D031 (integer-uniform references, statically bounded, runtime-clamped)** |
| F2 | The step-counter boundary cannot be inferred from schedule structure | **resolved — D030 (`Step` op)** |
| F3 | History ring advances per `Commit`; read bindings need one canonical form | **resolved — D033 (commit-indexed `committed(k)`; `current`/`previous(k)` are surface sugar)** |
| F4 | `resetOn` watch lists mix uniforms (incl. `mat4`) with non-uniform events (`resolution`); the guard's "watched input" needs a type | open — settles inline with the IR types |
| F5 | Display passes behave nothing like schedule passes (per-view resolution, re-run per tile) | **resolved — D032 (writes-resources ⇒ scheduled; writes-view ⇒ owned by the view, run by `Present`)** |
| F6 | The ops table's `Run` gloss predated W108; write mode is part of the pass type with mode-specific validator rules | **resolved — W108 updated + EXECUTION_MODEL ops table and validation list** |
| F7 | Control-sourced resources (the transfer-function LUT) are guarded `Initialize` with a data payload | **resolved — D034 (one guard mechanism, two triggers; syntax frozen by the Stage 6 LUT fixture)** |
| F8 | Tiling rule refined: fixed-grid never tiled; view-keyed per-pixel resources re-instantiated per tile | open — settles inline with the resource types |

## What the check validated

- The eight ops (seven original + `Step`) expressed all seven projects;
  no ninth was ever tempting.
- `Group`/snapshot is genuinely the easy-case default: neither hard
  sequential code used it.
- `resetOn` subsumes three distinct author intents (accumulation reset,
  initial-condition sliders, trail invalidation on camera move).
- Iteration domain (pixels/cells/vertices) is a pass property, not a
  schedule concern — the IR never mentions it.
- Multi-view and linked interaction need no scheduling mechanism at all.
