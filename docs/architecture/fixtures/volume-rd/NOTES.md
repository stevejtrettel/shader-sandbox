# Volume reaction-diffusion fixture — design notes

3D Gray–Scott on a 128³ grid, viewed three ways at once: emission–
absorption raymarch through a transfer function, an isosurface, and an
axis slice.

The general principle this fixture validates: **volume computation and
volume rendering are independent axes.** A volume resource doesn't know
whether it was evolved by a PDE, generated procedurally, or uploaded; a
renderer (raymarch, isosurface, MIP, slice, glyphs) doesn't know either.
So renderers multiply against generators instead of pairing off — any
display pass applies to any volume, several can read one live simulation
at once (D104/D011), and the renderer set is a candidate for the
packaged standard library rather than per-project code.

## Shader sketches

- **`init.glsl`** — U=1 everywhere, V seeded in a few noise-placed blobs.
- **`evolve.glsl`** — Gray–Scott with 7-point 3D Laplacian
  (`laplacian7`, ported from webgl-demos' `stencils3d.glsl`). Written
  against `cell` (ivec3) / `uvw` (vec3) built-ins — see finding 1.
- **`convert.glsl`** — copies U or a derived quantity into `chemView`
  (rg16f); runs once per frame, not per substep.
- **`raymarch.glsl`** — ray through the unit cube from `uEye`,
  front-to-back emission–absorption, color/opacity via the `tf` LUT,
  early exit at opacity ≈ 1.
- **`isosurface.glsl`** — raymarch with sign-change detection at `uIso`,
  bisection refine, normal from `gradient3(vol, uvw)` (library helper),
  Lambert shading.
- **`slice.glsl`** — sample `vol` at `vec3(uv, uSliceZ)` through the LUT.

## What this fixture pins down

### 1. O012 resolves: the slice loop is hidden

webgl-demos updates volumes slice-by-slice with `uLayer`/`uLayerNorm`
uniforms and `toIsometric3D(...)` coordinate plumbing polluting every
update and init shader. Native volume compute passes instead expose
`cell` (ivec3) and `uvw` (vec3) built-ins; the runtime owns the
per-slice `framebufferTextureLayer` loop and the author writes the update
as mathematics over cells. The stencil library ports; the coordinate
hacks die.

### 2. The simulate-32f / display-16f split is a pattern, not a hack

Float32 linear filtering is an extension; half-float linear is core
WebGL2. So: simulate in `rg32f`/nearest, convert once per frame into an
`rg16f`/linear volume for display. The convert pass runs at **frame
frequency** (`"frequency": "frame"`), outside the substep repeat —
exactly the multi-rate case EXECUTION_MODEL reserved. webgl-demos
already follows this format split instinctively (sim volumes r32f/rg32f,
display volumes rgba16f).

### 3. Resources can have control sources

The transfer function is a **LUT resource whose source is a control** —
`"source": { "control": "transferFunction" }` — mirroring how uniforms
declare sources. The uniform conflict rule (D028) applies to resources
with sources. Strawman syntax; the symmetry is the proposal.

### 4. One controller, several views

`camera` is bound to both the raymarch and isosurface views, so they
orbit together — coordinated 3D views with zero mechanism beyond W106
(controller outputs are shared uniforms). The slice view ignores the
camera entirely.

### 5. The capability envelope, with numbers

128³ × rg32f = 16.8 MB, ×2 for ping-pong, + 8.4 MB display volume ≈
42 MB — comfortable. Updates are 128 slice-draws per substep × 2
substeps + 128 convert draws ≈ 384 small draws/frame — fine. At 256³
everything multiplies by 8 (134 MB ping-pong pair, 1024+ draws) — the
capability report should start warning. webgl-demos' corpus (64³
everywhere, 128³ for RD) is the measured interactive range.

## Standard again, deliberately

No schedule block: evolve is the inferred step (snapshot semantics,
`stepsPerFrame: 2`), convert is frame-rate, views present after. A 3D
simulation with three coordinated views requires *zero* Advanced
scheduling — the volume, the LUT-control source, and the frequency tag
are the only things the author declared beyond a 2D project.
