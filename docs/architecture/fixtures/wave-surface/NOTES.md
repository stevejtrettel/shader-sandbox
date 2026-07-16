# Wave-surface fixture — design notes

The 2D wave equation shown two ways at once: a flat colormap you can poke
with the pointer, and an orbitable 3D membrane displaced by the same
field. One simulation, two views — the geometry pass used purely as a
*display* of a resource.

## Shader sketches

- **`init.glsl`** — Gaussian pulse at center; `rg` = (u(t), u(t−dt)).
- **`step.glsl`** — leapfrog update `u⁺ = 2u − u⁻ + c²dt²∇²u`, damping
  term, plus a source term under the pointer (`uPokePos`/`uPokeOn` from
  the drag controller bound to the *flat* view). Library: 5-point
  `laplacian`, CFL guard `dt ≤ dx/(c√2)`.
- **`flat.glsl`** — diverging colormap of u (library colormap helper).
- **`surface.vert.glsl`** — grid vertex at (u,v) reads the field and
  displaces `z = uHeightScale · wave(u,v)`; normal from finite
  differences of the same texture (library helper `heightNormal(field,
  uv, scale)`); transforms by `uViewProj`.
- **`surface.frag.glsl`** — simple Lambert + rim lighting from `uEye`,
  colored by height.

## Why this fixture matters

### A geometry display pass does not make a project Advanced

There is **no schedule block**. One update pass, `stepsPerFrame: 4`,
Standard inference does everything. The displaced membrane is just a
display pass whose domain is a grid mesh instead of pixels. This pins the
principle that the Standard/Advanced boundary is about *unknowable
ordering*, not about which pass types appear.

### Interaction in one view, physics seen in both

The drag controller is bound to the flat view but writes project-level
uniforms consumed by the *simulation*, so pokes appear in both views.
Interaction routing is uniform routing (W106) — third fixture to confirm
it, zero special cases.

### Depth becomes unavoidable (O013 forcing case)

The membrane self-occludes; `state: { depth: true }` cannot be dodged as
it was in the particles fixture. Proposed resolution, recorded for O013:
**a view whose display pass requests depth gets an implicit, view-owned
depth attachment**, cleared each Present. Explicit *shared* depth
resources (multiple geometry passes compositing into one depth buffer)
stay deferred until a fixture needs them. This covers graph surfaces,
parametric surfaces, and transformed meshes without adding a resource
kind.

### Library obligations

`heightNormal` (finite-difference normals from a scalar field), the 2D
stencil set, and colormaps — all portable from webgl-demos'
`stencils`/`coordinates` shader libs.

## Cost sanity

512² leapfrog × 4 substeps is trivial; the surface is 2 × 256² triangles
(~130k) per frame — nothing. The fixture's cost is conceptual, not
computational.
