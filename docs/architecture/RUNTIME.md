# Runtime architecture

How the engine is built: what is new, what survives from 0.3.0, and the
WebGL2 realities the design must price in rather than discover.

## The honest framing: a contained rewrite

The 0.3.0 engine hard-wires the BufferA–D + Image model into
`ShaderEngine`. The target model — named resources, logical versions,
declared reads/writes, a schedule IR — **replaces that core rather than
evolving it**. Pretending otherwise would smear a rewrite across many
stages; instead we contain it:

- The new executor is built as a fresh module beside the old engine.
- The **Shadertoy adapter is its first client.** The compat conformance
  suite (SHADERTOY.md) must pass through the new executor before any
  native feature ships on it. Compat is the regression harness that
  validates the rewrite.
- The old engine is deleted the release the suite goes green — we never
  maintain two executors.

### What survives

| Component | Fate |
|---|---|
| `Transport` (deterministic clock) | Survives as the display clock |
| `OfflineRenderer` / export pipeline | Survives; drives the new executor |
| `std140` UBO layout | Survives under structured-data resources |
| `UniformStore` / controls / panel-kit | Survives; controls become uniform *sources* |
| `MediaManager` (images, video, webcam) | Survives under external-media resources |
| Shader source assembly, error mapping, line mapping | Adapted into the module system |
| CLI, dev server, build/embed pipeline (DESIGN.md) | Unchanged consumers |
| `ShaderEngine` render core, fixed buffer model | Replaced by plan compiler + executor |
| Per-view GL contexts in `ShaderView` | Replaced (see presentation below) |

## Module structure (target)

```text
plan/       authoring formats → RuntimePlan
  standard/   friendly config + inference
  advanced/   explicit config (JSON, later TS)
  shadertoy/  compat adapter
  validate/   IR analyses: hazards, cycles, version binding
exec/       RuntimePlan → frames
  resources/  allocation, versions, ping-pong/ring management
  passes/     program cache, binding, MRT, domains
  schedule/   IR interpreter, clocks, resetOn guards
present/    views, layout, single-context blitting, controllers
export/     stills, video, frame sequences, tiling, timeline
diag/       probes, reductions, NaN detection, timing
```

`plan` is pure data-in/data-out and fully testable without a GPU. `exec`
touches WebGL. This boundary is the most important line in the codebase.

## Single-context presentation (settled — D011)

Views share resources, and GL resources cannot cross contexts, so the
current one-context-per-canvas design cannot express the target model.
The runtime uses **one hidden shared WebGL2 context**; each view's canvas
receives its image by blit:

- Primary path: render the view to a texture/renderbuffer on the shared
  context, then `transferToImageBitmap()` → `ImageBitmapRenderingContext`
  on the view canvas (cheap handoff, no readback).
- Fallback path (Safari/feature gaps): `drawImage` of the shared canvas
  region onto a 2D context per view.
- A single-view project may render straight into its canvas with no blit
  — the common case pays nothing.

Input events are captured per view canvas and routed to controllers with
view-local coordinates; DPI and resize are handled per view. The embed
elements from DESIGN.md keep their contract: one element, one canvas —
they simply share the hidden context when several mount on one page.

## Capability tiers (needed at first field resource, not at polish time)

Float renderability is an extension in WebGL2. The runtime probes once at
startup and exposes a capability report:

| Capability | Gate | Fallback policy |
|---|---|---|
| Render to float32 | `EXT_color_buffer_float` | Fall back to float16 with a loud diagnostic; PDE fixtures define acceptable error |
| Linear-filter float32 | `OES_texture_float_linear` | Nearest (PDE default anyway); warn if config asked for linear |
| Render to float16 | core + `EXT_color_buffer_half_float` | Hard error for field resources if absent (effectively never on WebGL2) |
| MRT count | `MAX_DRAW_BUFFERS` | Compiler splits an MRT pass into grouped passes when over limit |
| Texture size / 3D size | `MAX_TEXTURE_SIZE`, `MAX_3D_TEXTURE_SIZE` | Clear error naming the limit; exporter tiles instead where applicable |

Every fallback is reported in diagnostics; none is silent (README:
fail loudly). Project-level "requires float32" pins let an author refuse
the fallback and show a clear message instead.

## WebGL2 constraints the design prices in

- **No compute shaders.** All computation is fragment passes (or vertex
  work). Data textures + fragment updates are the per-element simulation
  mechanism (particles, agents); transform feedback is deferred unless a
  fixture proves it necessary.
- **No geometry shaders.** Volume updates render a 3D
  texture **slice-by-slice** via `framebufferTextureLayer` — one draw call
  per slice. A 256³ update is 256 draws; the executor batches state
  between slices, and the docs set expectations for feasible volume sizes.
- **Vertex texture fetch** is core in WebGL2 and is how geometry passes
  read data textures (particles as instanced quads/points reading their
  position texel).
- **Readback is slow and stalls.** Diagnostics use async readback via
  fences (`fenceSync`/`clientWaitSync`) with small reduction targets;
  export uses synchronous readback where the frame budget is irrelevant.
- **Context loss** is a real event: the runtime listens for it, tears down,
  and restores from the RuntimePlan + a reset (documented behavior:
  simulation state is lost unless a script re-seeds it).
- **sRGB and premultiplication** are pinned per output path once, during
  Stage 1 conformance work, because they are where golden tests rot.

## Shader module system

Native shaders get `#include`-style module resolution with:

- A stable standard library grown alongside the fixture corpus: coordinates,
  complex arithmetic, dual/hyperbolic geometry helpers, SDFs, stencils
  (Laplacian etc.), color maps, noise, camera rays.
- Source maps so compile errors point into the author's file and line —
  the existing line-mapping work carries forward.
- Deduplicated includes and per-pass interface injection (only requested
  built-ins and modules are prepended; `main()` bodies are never
  rewritten).

## Live editing and rollback

The dev loop keeps 0.3.0's guarantees on the new engine: shader edits
recompile per pass; a failed compile keeps the last good program running
with the error overlaid; config edits recompile the plan, preserving
resource contents when shape/format are unchanged and resetting them (with
a note) when not.

## Diagnostics as a product surface

For the target audience the daily pain is *NaN debugging*, so diagnostics
are a feature, not a dev nicety:

- **Value probe:** readback of the texel under the cursor for any chosen
  resource, shown numerically.
- **Reductions:** min/max/mean per channel via reduction passes; NaN/Inf
  detection is a one-pixel readback of a violation flag.
- **False-color inspector:** view any field through configurable
  colormaps/ranges without touching project shaders.
- **Sample/step counters and per-pass GPU timing** where
  `EXT_disjoint_timer_query_webgl2` exists.
- **Plan inspector:** the compiled IR, version bindings, and inferred
  schedule, printable — "why did my pass read the old value" must be
  answerable from output, not source diving.

## Error handling policy

- Config errors: rejected at compile with path-into-config messages.
- Shader errors: mapped through source maps to author files.
- Capability errors: name the missing capability and the resource that
  wanted it.
- Runtime NaN/Inf (opt-in watch): flagged in diagnostics, never silently
  propagated into a black screen without a note.
- Unsupported compat features: loud error naming the feature
  (SHADERTOY.md), never a wrong image.
