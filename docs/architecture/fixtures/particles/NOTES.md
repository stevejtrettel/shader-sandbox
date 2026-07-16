# Particles fixture — design notes

A million-particle Lorenz flow: RK4 integration of chaotic dynamics in a
data texture, aging/respawn, additive point trails into a fading HDR
buffer, orbit camera. The config is the artifact; the shaders are
described here rather than fully written — what this fixture *taught us*
is the deliverable.

## Shader sketches (not full sources)

- **`spawn.glsl`** — init: seed each element's position from a hash of its
  index inside a seeding box; stagger ages so respawns don't synchronize.
- **`simulate.glsl`** — fragment pass over the data texture's texels. Each
  texel holds `xyz` position + `w` age. RK4 on the Lorenz field
  `(σ(y−x), x(ρ−z)−y, xy−βz)`; age += dt; when age exceeds `uLifetime`,
  respawn with seed `hash(elementIndex, uStepIndex)` — the settled integer
  step counter (D014) makes respawn identical live and in export.
- **`fade.glsl`** — fullscreen replace pass: `trail * uDecay`.
- **`draw.vert.glsl` / `draw.frag.glsl`** — the geometry pass. Vertex
  shader computes its texel from `gl_VertexID`, fetches state (vertex
  texture fetch, core WebGL2), transforms by `uViewProj`, sets
  `gl_PointSize`; colors by `|lorenz(p)|` through a speed ramp — analytic
  velocity, no extra state channel. Fragment shader: soft round sprite
  via `gl_PointCoord`, additive.
- **`display.glsl`** — exposure tonemap of `trail`.

## Subsumption scorecard

| Piece | Verdict |
|---|---|
| State update | old — fragment feedback pass (Stage 3 machinery) |
| Parameter controls, orbit controller | old |
| Trail invalidation on camera move | old — `resetOn`, reused from the path tracer |
| Dense substeps (`repeat` interleaving update + draw) | old — fluid's repeat, now with heterogeneous members |
| One vertex per data-texture element | **new — geometry pass** |
| Additive blending onto an existing image | **new — exposed a version-model gap (write modes)** |

## What this fixture discovered

### 1. Write modes (`replace` vs `modify`) — model repair

Additive blending is fixed-function read-modify-write against the
target's existing content. The version model assumed every write is a
*replace into `next`*; a blended draw into a fresh `next` has nothing to
blend against, and copying current→next first pays the copy the cost
model forbids. So passes need a **write mode**:

- `replace` (default): sample `previous`, write `next`, commit swaps.
- `modify`: draw in place onto the *current committed* version. May not
  sample the target. Needs no commit.

`modify` is a general mechanism, not a particle feature: overlays,
annotation layers, scissored partial updates, splat-style local writes
(the fluid's splats could be small blended quads instead of fullscreen
passes). Filed as W108.

### 2. Depth attachments are missing from the resource model

`state: { depth: false }` dodges it here (trails are 2D accumulation),
but opaque 3D geometry across multiple passes will need a depth resource
concept. Filed as O013 — flagged now, decided when a fixture needs it.

### 3. Data-by-count, not by-shape

Authors declare `count`; the runtime picks texture dimensions and owns
the index↔texel convention — so the GLSL module library must ship
`elementIndex()` / element-fetch helpers, or every author hand-rolls the
same modulo arithmetic.

### 4. Controller outputs need types beyond scalars

`uViewProj` is a `mat4` controller output (extends W106; the drag
controller only needed vec2/float).

### 5. Points now, instanced meshes as the general form

`domain: { points: "particles" }` is the cheap path (`gl_PointSize` has
an implementation max; points clip by center). The same syntax must
scale to `domain: { instances: "particles", mesh: "quad" }` for oriented
sprites, glyphs, and arrows — instancing over a small built-in mesh is
the general mechanism.

## Ordering is meaning (why the schedule is explicit)

Fade-then-draw vs draw-then-fade are different pictures; draw inside the
substep loop vs once after it is different mathematics — streaks sample
the integral curves at `dt` resolution, dots sample them at frame
resolution. Inference cannot choose; the author writes four lines.

## Performance sanity

4 substeps × 1M texels of RK4 is trivial fragment work; 4M point-vertices
per frame is comfortable mid-range-GPU load. The real limiter is additive
fill rate, governed by `uPointSize`.
