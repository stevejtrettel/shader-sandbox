# Fixture corpus

**Status: Stage 0 drafts.** Nothing here runs yet. These are the concrete
artifacts the design documents argue against: remaining schema decisions
(O005 resource key names, O006 schedule syntax, O003 multi-target
entries) are settled by editing these files until they read right, then
freezing what they use.

Syntax shown is a **strawman** — semantics follow EXECUTION_MODEL.md, but
config key names and shapes are proposals until reviewed when the loader
is built (O005-era). Entry points, built-ins, `Fragment`/`compute`
signatures, snapshot default, and `stepsPerFrame` are since ratified
(D022–D029); the configs predate some of those spellings.

Corpus rules (README.md):

- A fixture validates a **capability**, never the other way around — no
  mechanism exists because one fixture wants it.
- The corpus grows; this sample must cover every capability-axis value at
  least once before Stage 0 exits.
- Questions surfaced while writing a fixture get filed in DECISIONS.md,
  not solved ad hoc in the fixture.

## Current fixtures

| Fixture | Capability coordinates | Decisions it pressures |
|---|---|---|
| [`fluid/`](fluid/) | coupled fields × sequential commits + iterative solve × drag controller × two views | O006 (schedule syntax), D103 (pass≠resource names), W106 (controller outputs) |
| [`pathtracer/`](pathtracer/) | accumulation field × inferred feedback + `resetOn` invalidation × orbit controller × `stepsPerFrame` | D017 (`resetOn` shape), sample-counter semantics, O005 |
| [`particles/`](particles/) | data texture × geometry pass (points) × heterogeneous repeat × `modify` writes × trail feedback | W108 (write modes), W109 (typed controller outputs), W110 (data-by-count), O013 (depth) |
| [`wave-surface/`](wave-surface/) | feedback field × geometry display pass (grid mesh) × two views × cross-view interaction | O013 (depth — forcing case), W106 (interaction routing), "geometry ≠ Advanced" |
| [`volume-rd/`](volume-rd/) | volume compute × multi-rate convert pass × three views, shared controller × LUT-sourced resource | O012 (hidden slice loop), resource control-sources, format-tier split, capability envelope |

Fixture form: `config.json` is always the artifact; shaders may be full
sources (fluid, pathtracer) or sketches in a NOTES.md (particles) — the
findings matter more than complete GLSL.

## Questions these drafts surfaced (to file/resolve)

- **`reads` as a sampler-name → resource map** (both fixtures): proposed
  here; alternative is positional channels. The map lets one shader file
  serve several passes with different bindings (`fluid/advect.glsl`).
- **`{ "run": …, "commit": … }` shorthand** (fluid): is commit a property
  of a run step or always a separate op? The IR keeps them separate; the
  authoring surface may not want to.
- **`resetOn` verbosity** (pathtracer): the watched-input list repeats
  most of what the writing pass already reads. Should
  `"resetOn": "inputs"` be a shorthand for "anything my writers consume"?
- **Sample-count convention** (pathtracer): count stored in the
  accumulator's alpha (self-contained, deterministic) vs a runtime-provided
  per-resource counter uniform. The draft uses count-in-alpha.
- **View-owned implicit depth** (wave-surface): a display pass with
  `depth: true` gets a per-view depth attachment; shared depth resources
  deferred. Proposed resolution of O013.
- **Resources with control sources** (volume-rd): a LUT resource declares
  `source: { control: … }`, mirroring uniform sources under the same
  single-writer rule.
- **Per-pass `frequency`** (volume-rd): `"frequency": "frame"` keeps a
  convert pass out of the substep repeat — is a frequency tag enough, or
  is this the thin edge of the public schedule syntax (O006)?
