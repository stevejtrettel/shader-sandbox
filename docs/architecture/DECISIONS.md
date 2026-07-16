# Decision log

Last reviewed: 2026-07-15 (full plan rewrite).

Prevents working ideas from quietly becoming permanent API. Rule of this
rewrite: **a decision is Settled only when a fixture or test validates
it**; each settled entry names its validator (existing or owed by a
roadmap stage).

- **Settled:** design constraint unless explicitly reversed.
- **Working:** current recommendation; freeze via the named fixture.
- **Open:** genuine design work remains.
- **Deferred:** outside the planning horizon.

## Settled

### D001 — Native system first, Shadertoy as bounded side product
Standard/Advanced is the product; Shadertoy compatibility is a documented
adapter and the executor's regression suite. *Validator: SHADERTOY.md
conformance corpus (Stage 1).*

### D002 — Advanced is additive
No `mode` flag, no dialect split. Projects grow by adding options; existing
config and shader meaning is preserved. *Validator: a growth-story
fixture — a Standard PDE renders identically the moment before an
explicit schedule is added.*

### D003 — Breaking changes allowed with migration path
Requires upgrade guide + schema bump (D012). *Validator: migration map
fixture, Stage 0.*

### D004 — Ordinary GLSL `main()` is always allowed
No mandatory custom entry point; bodies are never rewritten. *Validator:
Stage 2 fixtures include a plain-`main()` variant.*

### D005 — `shade(Fragment)` shorthand exists
Signature frozen (D024, D025). *Validator: single-pass fixtures.*

### D006 — The author-facing term is `uniforms`
Not `params`; GLSL names are not auto-renamed; UI actions are not
uniforms. *Validator: all fixtures.*

### D007 — `webgl-demos` is a requirements corpus, not a code source
Port workloads as fixtures; never merge its architecture.

### D008 — Audio is deferred
Sound shaders and audio channels are not near-term architecture drivers.

### D009 — Equirect adaptation and real cubemaps both valid
The adaptation is documented; genuine cubemap resources are supported.
*Validator: compat corpus cubemap fixtures.*

### D010 — One executor; new core replaces old, validated by compat
The rewrite is contained per RUNTIME.md: new executor beside the old
engine, Shadertoy conformance green first, old core deleted immediately
after. Interactive, embed, and export paths share the executor.
*Validator: Stage 1 cross-path identity test.*

### D011 — Single shared GL context; views blit to canvases
Required for shared resources; per-view contexts are replaced.
`transferToImageBitmap` primary, `drawImage` fallback, direct render for
the single-view case. *Validator: linked-view and multi-view fixtures
(Stage 6).*

### D012 — Config schemas are versioned
`"schema": 1` (default when omitted); unknown schemas are refused loudly;
bumps ship migration notes. *Validator: loader tests, Stage 0.*

### D014 — Fixed-dt stepping and sampling rules
Simulation advances by a fixed `dt` and an integer step counter; `dt`
never derives from frame deltas. Inputs and UI uniforms are sampled
once per display frame, before that frame's steps; scripts get runtime
time only. Export drives stepping with a synthetic fixed-rate clock and
is exactly reproducible. How many steps run per display frame: D029.
*Validator: live-vs-export identity tests, Stage 3.*

### D022 — Three entry points, exactly one per shader
Every fragment shader defines exactly one of `main()` (no-magic escape
hatch), `shade(Fragment)` (native convenience), or `mainImage(...)`
(handled by the Shadertoy desugarer). Detection is automatic; zero or
multiple entry points is a loud error. All three are fed from the same
built-in state (D023/D024). Desugaring is the ratified *mechanism* for
running Shadertoy; how far its vocabulary reaches into native projects
remains O014. Ratified 2026-07-16.
*Validator: entry-detection unit tests, Stage 2.*

### D015 — MRT passes are first-class
A pass may write several targets; an MRT pass commits its outputs
together like a group. Compiler splits when over `MAX_DRAW_BUFFERS`.
*Validator: a coupled-field fixture authored as one MRT update pass.*

### D016 — Schedule IR is internal and precedes public syntax
Run/Group/Commit/Sequence/Repeat/Step/Initialize/Present, specified and
unit-tested in Stage 0; inference and the compat adapter target it; public
Advanced syntax is sugar over it. (`Step` added by D030.) *Validator: IR
validator suite.*

### D017 — `resetOn` is the only conditional
Resource-level invalidation (re-initialize + reset sample counter when
watched inputs change), serving the progressive-computation class. No
general conditional scheduling without a capability-level case.
*Validator: progressive-accumulation fixtures.*

### D018 — Unsupported means loud error
In both native and compat paths, features outside scope abort with a
named error; silent misrendering is prohibited. *Validator: compat suite
negative tests.*

### D019 — Geometry serves field visualization
Vertex shaders/instancing exist for glyphs, particles, curves, and
mathematical surfaces — not general 3D scenes, materials, or assets.
Enforced by roadmap pruning.

### D020 — Fail-soft capability tiers with visible fallbacks
Float renderability probed at startup; documented fallback ladder
(RUNTIME.md); every fallback surfaces in diagnostics; projects may pin
requirements. *Validator: capability-mock tests, Stage 3.*

### D021 — Standard is the default interpretation
Every project defaults to Standard; nothing is silently interpreted as
Shadertoy. How Shadertoy projects are entered — explicit opt-in mode vs
ambient desugaring — is **O014**, analyzed in
[SHADERTOY_INTEGRATION.md](SHADERTOY_INTEGRATION.md).
*Validator: loader tests (Stage 0/2).*

### D023 — Native built-in names
`uTime`, `uResolution`, `uFrame`, `uPointer`. Ratified 2026-07-16.

### D024 — `Fragment` fields and the math plane
`pixel` (pixels, origin bottom-left), `uv` (0–1 per axis), `coord`
(centered at the origin, y ∈ −1…+1 with y up, x ∈ ±aspect — square
pixels), `resolution`. Ratified 2026-07-16. *Validator: single-pass
fixtures (Stage 2).*

### D025 — `shade` returns `vec3` or `vec4`
The generated wrapper reads the declared signature and adapts; `vec3`
gets alpha = 1. Ratified 2026-07-16.

### D026 — `compute(Cell)` entry; return type matches the field
Non-visual passes may use `compute(Cell)` returning `float`, `vec2`,
`vec3`, or `vec4`; the return type must match the target field's channel
count, checked at compile time with a clear mismatch error.
Three-channel float fields are stored RGBA-padded internally (WebGL2
cannot render to RGB float). `main()` always works. `Cell`'s exact
fields freeze when Stage 3 builds fields. Ratified 2026-07-16.

### D027 — Snapshot is the unscheduled default
Without an explicit schedule, all updates in a step read one committed
snapshot and commit together, so declaration order cannot change
results. An explicit schedule overrides. Cost model: zero-copy deferred
swap for single-writer resources. Ratified 2026-07-16. *Validator:
order-permutation test (Stage 3).*

### D028 — Uniform conflicts: one stored value, last writer wins
Sliders, presets, scripts, and timelines all write the same stored
value; a playing timeline writes every frame (pause to hand-adjust).
The first build (sliders + controllers only) has no conflicts, so this
binds when presets/timelines arrive. Scenarios to retest then:
preset-over-sliders, timeline+slider, script nudges, controller/button
collisions, reset semantics. The layered-priority model is the known
upgrade path if timelines become central. Ratified 2026-07-16.

### D029 — `stepsPerFrame` now; rate options later
Authors set an integer steps-per-frame; simulation speed varies with the
display's frame rate. A wall-clock accumulator mode can be added later
as a new option without breaking anything. Ratified 2026-07-16.

### D030 — The step boundary is explicit: `Step` is an IR op
The simulation-step counter increments only on exit from a `Step[...]`
block; every pass inside one `Step` observes the same `stepIndex` and
simulation time. `Repeat` never advances the counter — solver iterations
nest inside a `Step` (fluid's Jacobi loop), substeps are
`Repeat[Step[...]]`. The validator rejects nested `Step`s and warns on a
`Step` containing no `Commit`. Standard inference and the Shadertoy
desugarer emit `Step` themselves; only Advanced schedules write it.
`Repeat` stays purely structural, `Step` purely temporal. Origin:
paper-check finding F2 (PAPER_CHECK.md) — no structural rule (per
commit, per repeat iteration, outermost repeat) survives the corpus.
Ratified 2026-07-16. *Validator: IR validator suite (Stage 0);
live-vs-export identity tests (Stage 3).*

### D031 — Repeat counts: constants or integer-uniform references
A `Repeat` count is a constant or a *reference to an integer uniform*
with declared finite `min`/`max` (`min ≥ 0`). Sampled once per display
frame before substeps (D014), so all repeats in a frame see one value
and exports reproduce it. Composes with every uniform source under
D028 — sliders, presets, timelines, scripts can all drive solver
quality. The declared bounds give the validator a static worst-case
pass count; the runtime clamps out-of-range writes with a diagnostic.
`Repeat(0)` legally skips the block (documented, honest arithmetic —
not a hidden conditional). Consequence: `stepsPerFrame` (D029) is just
the inferred outer Repeat's count, so a simulation-speed slider costs
zero mechanism. Expressions over uniforms and convergence-driven counts
stay deferred per D017. Origin: paper-check finding F1 (the fluid's
`pressureIterations` slider). Ratified 2026-07-16. *Validator: IR
validator suite (Stage 0); fluid fixture (Stage 5).*

### D032 — Display passes belong to views; `Present` invokes them
The boundary rule: **a pass that writes resources is scheduled; a pass
that writes a view belongs to that view** and runs when `Present`
renders it — once per active view, at view resolution, re-run per tile
in export, not at all when the view is closed. View passes read only
committed `current`; they have no write mode and no commit. A view pass
named in a schedule is a loud error; a no-writes pass referenced by no
view gets the dead-pass diagnostic. Consequences: view visibility,
resize, and tiling never touch the schedule (no conditional in the
D017 sense); committed state is produced by the schedule alone, so
`Present` is a pure render of committed state — the determinism
contract compares committed states and presentation is free to differ;
diagnostics (false-color inspector, probes) become ordinary views with
library display passes. Frame-frequency convert passes (volume-rd's
`toDisplay`) write resources and stay scheduled — the boundary rule
classifies them automatically. One display pass per view for now; a
per-view display *chain* (bloom-class post at view resolution) is the
known upgrade path when a fixture forces it. Origin: paper-check
finding F5. Ratified 2026-07-16. *Validator: IR validator suite
(Stage 0); multi-view fixtures (Stage 6).*

### D033 — Version bindings are commit-indexed; history advances per Commit
The canonical IR read binding is `committed(k)` — the k-th most recent
commit visible when the pass executes (k = 0 latest), bounded by
declared history depth. The ring advances per `Commit`, never per step
(under multi-commit schedules "steps back" is ill-defined; commits are
not — the fluid commits velocity three times per step). Author-facing
`current`/`previous` both resolve to committed(0) at read time;
`previous(k)` resolves to committed(k−1). The corpus idiom for deep
history is channel packing (wave equation packs uₙ, uₙ₋₁ into RG);
declared `history: 2` with committed(1) reads is the equivalent native
spelling and both must work. Origin: paper-check finding F3. Ratified
2026-07-16. *Validator: IR validator suite (Stage 0); a history-2 wave
fixture (Stage 3).*

### D034 — Control-fed resource contents are an `Initialize` payload
A resource may declare a control as its content source (the volume-rd
transfer-function LUT). This is not new machinery: control data is one
more `Initialize` payload variant (with clear, init shader, external
data, script upload, copy), re-run under the same change-guard that
serves `resetOn` — watched input changed → re-initialize. D017 is
unchanged: that guard remains the only conditional. Uniform conflict
semantics (D028) apply to the control source. Config syntax stays a
strawman until the Stage 6 LUT fixture freezes it. Origin: paper-check
finding F7. Ratified 2026-07-16. *Validator: LUT-control fixture
(Stage 6).*

## Working

### W104 — A pure-compat marker carries the fidelity promise
Some marker (`"shadertoy": true` or similar) scopes the
shadertoy.com-fidelity guarantee. Its exact role depends on O014: under
an opt-in model the marker *is* the mode switch; under ambient
desugaring it restricts vocabulary to the support matrix and enables
conformance guarantees. **Freeze by:** O014 + Stage 1–2 compat
fixtures.

### W105 — Standard shorthands normalize to resources
`buffers`/`textures` keys remain and expand into the resource model.
**Freeze by:** Stage 3 loader tests.

### W106 — Controllers are project-level; outputs are uniforms
A controller binds to view(s) for input and writes shared uniforms, which
is all linked views require. **Freeze by:** linked-view fixtures
(Stage 6).

### W107 — Authoring formats: JSON for Standard, JSON + TS for Advanced
Both normalize identically; TS earns its place when a fixture class
(likely script-generated geometry/data) is painful in JSON. **Freeze
by:** Stage 6.

### W108 — Passes declare a write mode: `replace` or `modify`
`replace` (default) writes `next` and commits; `modify` draws in place
onto the current committed version (blending, overlays, partial writes),
may not sample its target, needs no commit. Discovered by the particles
fixture — general to any sparse/blended touch of an existing image.
Write mode is part of the pass type in the IR, with mode-specific
validator rules (paper-check finding F6; EXECUTION_MODEL validation
list). **Freeze by:** geometry-pass fixtures (Stage 6).

### W109 — Controller outputs are typed uniforms, including matrices
Drag controllers emit vec2/float; camera controllers emit `mat4`
view-projection. Extends W106. **Freeze by:** geometry-pass fixtures
(Stage 6).

### W110 — Data resources declare `count`, not texture shape
The runtime chooses dimensions and owns the index↔texel convention; the
GLSL module library ships `elementIndex()`/element-fetch helpers.
**Freeze by:** particle-class fixtures (Stage 6).

## Open

### O013 — Depth attachments
Geometry passes expose `state: { depth: … }`, but the resource model has
no depth-buffer concept. The wave-surface fixture (self-occluding
membrane) is the forcing case. **Current direction:** a view whose
display pass requests depth gets an implicit, view-owned depth
attachment cleared each Present; explicit shared depth resources stay
deferred until a fixture composites multiple geometry passes into one
depth buffer.

### O014 — Shadertoy vocabulary scope
Desugaring is the ratified mechanism (D022); the remaining question is
scope — opt-in compat mode (with or without a names-only shim) vs
ambient desugaring of Shadertoy vocabulary inside native projects. Full
options
analysis: [SHADERTOY_INTEGRATION.md](SHADERTOY_INTEGRATION.md). The
models widen strictly (M1 ⊂ M2 ⊂ M3), so upgrading later is
non-breaking and downgrading is not. **Interim policy (2026-07-16):
ambient — Shadertoy syntax mixes freely everywhere during development.**
The binding deadline is public 0.4 release: shipping ambient publicly
makes it effectively permanent.

### O003 — Multi-target entry shorthand
Return types are settled (D025, D026); remaining: what `shade`/`compute`
look like for a pass writing several targets (MRT). Decide with the
coupled-field fixtures (Stage 3).

### O006 — Public schedule syntax
Choose only after iterative-solve and progressive-accumulation fixtures
are modeled in the IR (Stage 5).

### O009 — Script-system lifecycle details
Declared I/O exists (PROJECT_MODEL.md); remaining: async behavior, error
isolation, cleanup ordering. Decide by the script-generated data/geometry
fixtures (Stage 6).

### O010 — Layout composition and custom panels
Which polished layouts are Standard; what escape hatch Advanced gets.
Decide across Stages 4 and 6; LUT-writing controls (transfer functions,
colormap editors) are the forcing case for custom controls.

### O011 — Timeline format
Track/keyframe/easing schema and its editor surface. Decide by the
timeline/tiled-export fixtures (Stage 7).

### O012 — Volume update ergonomics
Slice-loop authoring surface for 3D fields (hidden loop vs explicit).
**Current direction (volume-rd fixture):** hidden loop — volume compute
passes expose `cell`/`uvw` built-ins and the runtime owns the per-slice
FBO loop; webgl-demos' `uLayer` plumbing is the counterexample to avoid.
Freeze by implementing the fixture (Stage 6).

## Deferred

### F001 — Sound shaders (`mainSound`)
### F002 — `mainVR` and `mainCubemap` entry points
Cubemap *resources* are not deferred.
### F003 — Raytracer/raymarcher template framework
Modules first (D107 of the old log survives in spirit via D019/W-library
work in Stage 4).
### F004 — WebGPU backend
The IR avoids gratuitous WebGL-isms, but no portability promise until
cost/value is understood.
### F005 — Transform feedback, async readback into simulation, CPU task graphs
Until a fixture demands them.

## Resolution order

1. O005-era resource schema names — reviewed and frozen when the loader
   is built (per 2026-07-16 discussion).
2. O006 — public schedule syntax, designed against real research codes
   (Stage 5 at the latest).
3. O003 — multi-target entry shorthand (Stage 3).
4. O014 — final Shadertoy-vocabulary scope call, before public 0.4
   release (interim: ambient).
5. W106 / O009 / O010 / O012 / O013 — interaction, scripts, layout,
   volumes, depth (Stage 6).
6. O011 — timeline (Stage 7).
