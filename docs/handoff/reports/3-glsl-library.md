# GLSL library assessment: `/home/user/webgl-demos/src/shaders/`

**Verdict:** "battle-tested" is not supportable. No test executes GLSL, about a third of the files are never included, and I found definite mathematical bugs in files that are in use. All 45 files (44 in `lib/`, 1 in `core/`, 4,505 lines) were read in full. Nothing was compiled or run (no GLSL compiler available), so compile-failure claims come from reading, not execution.

Paths below are relative to `src/shaders/lib/`. "Projects" = distinct project folders in demos/examples/new-demos that `#include` the file.

## 1. Inventory (lines; projects)

**color**
- `palettes` (68; 34): `cosinePalette`, 8 presets, `paletteHeat`, `paletteViridis`
- `hsv` (47; 3): `rgb2hsv`, `hsv2rgb`, `rotateHue`, `adjustSaturation/Value`
- `spaces` (124; 1): `srgbToLinear`, `linearToSrgb`, `luminance`, `grayscale`, `rgb2hsl`, `hsl2rgb`, `temperatureToRGB`
- `blend` (87; 1): 14 Photoshop-style blend modes

**math**
- `random` (65; 11): `hash11/12/22/13/33`, `random`, `random2`, `random3`
- `coordinates3d` (218; 7): voxel/UVW helpers, `gridSpacing3D`, `wrap3D`, `screenTo3D`
- `constants` (16; 4): `PHI`, `DEG_TO_RAD`, `RAD_TO_DEG`
- `rotate` (62; 2): `rotate2D`, `rotateX/Y/Z`, `rotateAxis`
- `easing` (182; 1): 30 Penner easings
- `interpolation` (42; 1): `smootherstep`, `inverseLerp`, `remap`, `remapClamped`, `expIn/Out`
- `common` (111; 0): `map`, `smin/smax`, `gain`, `bias`, shaping functions, `modulo`
- `quaternion` (131; 0): axis-angle, mul, conjugate, rotate, slerp, mat3 conversions

**noise**
- `simplex2d` (64; 8), `simplex3d` (92; 4), `fbm` (77; 4), `worley` (125; 4), `perlin` (98; 3), `curl` (73; 3)

**sdf**
- `primitives2d` (84; 21): circle, box, segment, triangle, hexagon, pentagon, pie, arc, vesica
- `operations` (59; 7): boolean and smooth ops, onion, extrusion, revolution
- `viz` (91; 4): `sdfColor` and variants
- `primitives3d` (95; 3): 13 primitives
- `domain` (63; 0): repeat, symmetry, twist, bend

**simulation**
- `pde` (115; 9): heat, wave, Gray-Scott, advect, Jacobi, damped wave
- `stencils` (320; 6): 5/9-point Laplacians, gradient, divergence, curl, biharmonic, boundary variants
- `cellular` (127; 5): Life, totalistic, majority, cyclic, Larger-than-Life
- `stencils3d` (328; 4): 7/19/27-point Laplacians, `gradient3D`, `divergence3D`, `curl3D`
- `fluids` (123; 2): advection, pressure, vorticity, buoyancy

**other**
- `stencils/laplacian` (269; 8): verbatim copy of part of `simulation/stencils`
- `lighting/phong` (83; 4): Phong and Blinn-Phong
- `raymarching/implicit` (192; 1): gradient, box intersection, root refinement, marchers, camera
- `core/constants` (15; auto-included): `PI`, `TAU`, `E`

**Never included (15 files):** all six `effects/*`, both `geometric/*`, `math/common`, `math/quaternion`, `raymarching/core`, `sdf/domain`, and `stencils/{biharmonic,curl,divergence,gradient}`.

## 2. Correctness

### Wrong (formula worked through by hand)

- **`math/quaternion.glsl`: broken throughout.**
  - The header says "(w,x,y,z)" and `quatFromAxisAngle` (l.13) puts the scalar in `.x`.
  - `quatMul` (l.17-23) reads the scalar from `.w` but writes it to `.x`; identity times identity gives `(-1,0,0,0)`.
  - `quatConjugate` and `quatRotate` inherit the confusion.
  - `quatToMat3` (l.90-94) is written row-major into a column-major constructor, so it yields the inverse rotation; `mat3ToQuat` has the matching sign flip.
- **`math/easing.glsl:134,140`:** `easeInElastic` and `easeOutElastic` use phase offset 0.1 where it should be p/4 = 0.075. `easeOutElastic(0+)` is 0.134 and `easeInElastic(1-)` is 0.866, so both jump at the endpoint. The other 28 easings hit 0, 1 and the midpoint correctly.
- **`simulation/stencils3d.glsl:141`:** the 19-point Laplacian weights sum to -2 (faces 2/3, edges 1/6, centre -8). The correct set is 1/3, 1/6, -4.
- **`simulation/stencils3d.glsl:198`:** the 27-point weights sum to -32/27 and the second-order scale is 16/27. Neither stencil annihilates constants.
- **`laplacian9PointZeroBoundary`** (`stencils/laplacian.glsl:160-267`, duplicated at `simulation/stencils.glsl:211-318`), used by 5 wave/Schrödinger projects:
  - Top and bottom edge rows have centre weight -1 instead of -3 (laplacian.glsl l.183, 185, 239, 241), so the row sum is +2.
  - The boundary test is `ij.x == 1` on the left and `float(ij.x)/res == 1.` on the right, which never fires for valid indices.
  - The comments say Dirichlet, but the weights are the mirror (Neumann) stencil.
- **`simulation/pde.glsl:110`:** `dampedWaveStep` uses `0.5*a*dt²` with a position-Verlet velocity. With γ=0 it disagrees with `waveEquationStep`; the effective c² is halved.
- **`simulation/fluids.glsl:69`:** `vorticity` calls `curl2D(sampler2D, vec2, vec2)`, but only `curl2D(sampler2D, ivec2)` exists. The file should not compile, yet two examples include it.
- **`effects/morphology.glsl:43-55`:** `opening` returns only a dilation and `closing` only an erosion, so `topHat` and `blackHat` are wrong too.
- **`sdf/operations.glsl:54`:** `opRevolution` computes `q`, discards it and returns its input.
- **`raymarching/core.glsl`:** every function has the SDF replaced by `0.0`; `calcNormal` normalises a zero vector. It is a template, not code.
- **`noise/curl.glsl:29-48`:** `curl3d` is ∇n × (1,1,1), always perpendicular to the diagonal, then `normalize()`d. The result is not divergence-free and has constant magnitude 5. `curl3dCustom` has a correct curl but the same normalisation. `curl2d` is correct.
- **`color/palettes.glsl:59`:** `paletteViridis` is not viridis. At t=0 it gives (0.56, 0.53, 0.69) against the true (0.27, 0.00, 0.33), and its R and G channels are periodic. It is not perceptually uniform, and about 25 projects use it.
- **`effects/edge.glsl:56`:** `LAPLACIAN_OF_GAUSSIAN` is just the plain Laplacian kernel.
- **`effects/dither.glsl:61`:** `blueNoise` is a white-noise hash.
- **`geometric/shapes.glsl:68`:** `star` draws a gear, not a star.

### Dubious

- `noise/perlin.glsl:20-29`: the 2D gradient angle is a linear function of the lattice coordinates with no hash, so gradients are correlated. The 3D version uses one hash for both angles, so gradients lie on a curve. The claimed range [-1,1] is really about ±0.707 (2D) and ±0.866 (3D).
- `noise/worley.glsl`: F1 and F2 are initialised to 1.0, which clips F2; a 3×3 search is not enough for exact F2.
- `noise/simplex3d.glsl:87`: uses the older 0.6 kernel radius, which I recall the upstream source later changed to 0.5 with scale 105 to remove small discontinuities (from memory, not checked).
- `math/rotate.glsl`: all five matrices are transposes of the standard ones. They are self-consistent, but `M*v` rotates by −angle and nothing says so.
- `raymarching/implicit.glsl:185`: `right = cross(up, forward)` gives a mirrored image; chirality is flipped relative to the usual convention.
- `sdf/primitives3d.glsl`: `sdCone` (l.45) and `sdTriPrism` (l.64) are bounds, not exact distances, though the header claims signed distance. `sdRoundBox` grows the box by r, while `sdRoundedBox2D` keeps its outer size.
- `color/spaces.glsl`: `srgbToLinear` is a 2.2 gamma, not the piecewise sRGB curve. `luminance` uses Rec.601 weights.
- `math/coordinates3d.glsl`: z has no half-voxel offset while x and y do (l.47). The comment at l.103 divides a Laplacian by dx³.
- `math/common.glsl`: comments on `impulse` and `parabola` are wrong; `powerCurve` and `fbmCoeff` are non-standard and unexplained; `modulo` duplicates built-in `mod`.
- `math/interpolation.glsl`: `expIn` and `expOut` do not reach 1.
- `color/blend.glsl:63`: `blendSubtract` is actually linear burn.
- `effects/distortion.glsl`: `normalize(0)` at the centre (l.50, 65); `fisheyeDistortion` equals barrel distortion.
- `effects/convolution.glsl` and `morphology.glsl` use `sample` as a variable name. From memory of the spec, that is a reserved word in GLSL ES 3.00.
- Unguarded divisions: `bias`, `inverseLerp`, `blendColorDodge/Burn`, `cartesianToSpherical`, `triangle`, `intersectBox`.

### Sound (checked line by line)

- `simplex2d`, and `simplex3d` apart from the note above
- `random` hashes
- `hsv`; `rgb2hsl/hsl2rgb`; `temperatureToRGB` constants
- `sdf/primitives2d` (all), `primitives3d` exact ones, `operations` smooth ops, `domain`
- 5-point and 9-point 2D Laplacians, the 7-point 3D Laplacian, gradient/divergence/curl in 2D and 3D; `biharmonic` is correct, though its comment calling it "approximate" is wrong
- heat, wave, Gray-Scott and Jacobi steps in `pde`
- `cellular`; `phong`; Bayer matrices; blur kernels and Gaussians
- `refineRoot` and `intersectBox`

`viz`, `transforms` and `fbm` were only skimmed.

## 3. Purity

This is the library's strongest point: no function reads a uniform or injected variable, and samplers and resolutions are always arguments. Exceptions:
- `raymarching/implicit.glsl` requires a global `F(vec3)` defined before the include.
- `math/constants.glsl` silently needs `PI` from the auto-included core.
- `raymarching/core.glsl` is meant to be hand-edited.

## 4. Conventions

- **Naming:** mostly camelCase with `sd*`, `op*`, `ease*`, `palette*`, `blend*` prefixes. Outliers are `worley2d_F1F2`, `laplacian9Point_vec`, `mod289_3d`, `hash2_worley`.
- **Guard collision:** `CURL_GLSL` guards both `noise/curl.glsl` and `stencils/curl.glsl`, so the second include is silently dropped.
- **Duplication:** `stencils/laplacian.glsl` and `simulation/stencils.glsl` duplicate each other under different guards, so including both redefines functions; the `stencils/` files for gradient, divergence, curl and biharmonic are copies too.
- **Collision-prone names:** `map`, `gain`, `contrast`, `random`, `gradient`, `divergence`, `circle`, `triangle`, `permute`, `hash3d`, and `calcNormal` (two files).
- **Includes:** `curl` and `fbm` pull in both simplex files; `biharmonic` → `laplacian`; `fluids` → `stencils` + `pde`.
- **Missing files:** two examples include `@lib/math/hash` and docs reference `coordinates.glsl`; neither exists.
- **Repeated constants:** π and τ are retyped as literals in easing, hsv, palettes (6.28318), perlin, shapes, transforms and blur. The sin-hash appears five times.
- **Inconsistencies:** polar returns (θ, r) but spherical (r, θ, φ); spherical is z-up while the SDFs and camera are y-up; edge kernels are centre-positive while stencils are centre-negative; UV-based sampling (cellular, fluids, effects) sits beside texel-index sampling (stencils, pde).

## 5. Readability

- **Clear:** `stencils3d` and `coordinates3d` docblocks, `pde` (equation stated above each step), `easing`, `phong`, `rgb2hsl`, `cellular`.
- **Opaque:** `simplex2d/3d` (swizzle tricks, 1.79284291400159, 130, 42), `rgb2hsv` (K-vector trick), `sdHexagon/Pentagon/Pie/Vesica/Octahedron` (reflection folds with bare constants), `random` hashes (0.1031, 33.33), `temperatureToRGB`, palette coefficient soup.
- No function documents its domain, range, units or preconditions (normalised normals, `sdCone`'s `c` as sin/cos).

## 6. Provenance

Only three attributions exist and there are no licence headers anywhere. The README says "MIT, see LICENSE", but no LICENSE file exists.
- `simplex2d/3d`: Ashima Arts / McEwan–Gustavson webgl-noise (MIT, which requires the notice). The 2D file names the authors without the licence; the 3D file has nothing.
- `hash11`–`hash33`: Dave Hoskins' "Hash without Sine" (MIT), unattributed.
- `rgb2hsv/hsv2rgb`: Sam Hocevar's well-known snippet, unattributed.
- `temperatureToRGB`: Tanner Helland's fit, unattributed.
- Inigo Quilez: every SDF primitive, operator and domain op, plus `smin`, `gain`, `almostIdentity`, `impulse`, `cubicPulse`, `expStep`, `parabola`, `cosinePalette`, `sdfColor`, soft-shadow/AO skeletons. Only `palettes` and `viz` credit him.
- `fract(sin(dot(...)))*43758.5453` and the 127.1/311.7 hashes are Shadertoy folklore; easings are Penner's; Bayer and Sobel are standard.

## 7. Automated tests of GLSL

None. There is no test runner in `package.json`. `src/project/ShaderPreprocessor.test.ts` and two `test-preprocessing.ts` files only test `#include` expansion with console asserts. `docs/TESTING.md` is a manual checklist. Nothing compiles library files or compares against reference values.

## 8. Judgement

- **Carry forward after re-deriving, adding tests and attribution (about 35-40% by line count):** 2D SDF primitives, the exact 3D ones, boolean and smooth ops, simplex noise, Hoskins hashes, HSV/HSL, 28 of 30 easings, 2D stencils (5/9-point, gradient, divergence, curl), 7-point 3D, the 3D gradient/divergence/curl, heat/wave/Gray-Scott steps, Bayer, phong, `refineRoot`.
- **Rewrite (about 35%):** quaternion, rotate (pick and document a convention), 19/27-point Laplacians, boundary Laplacians, damped wave, fluids, curl noise, perlin, worley F2, viridis (use a real polynomial fit), sRGB and luminance, camera, coordinates3d.
- **Drop (about 25%):** `raymarching/core`, morphology, convolution, the duplicate `stencils/*`, shapes, distortion, `common`'s redundant helpers.

**Missing for a mathematician's library:**
- Complex arithmetic (mul, div, exp, log, pow, sqrt, branch handling), domain colouring, Möbius transformations, cross-ratio
- Hyperbolic models (disc, half-plane, hyperboloid) with isometries and distance; stereographic and spherical geometry
- ODE integrators (RK4, symplectic/leapfrog as named steppers), Newton iteration
- Dual numbers and analytic derivatives, including noise with gradients
- Proper 4×4 and projective transforms, a correct quaternion/SO(3) module
- Polynomial and special-function evaluation
- Higher-order and properly isotropic stencils with stated truncation error
- Colour science (exact sRGB, Oklab, real perceptual colormaps)
- Integer (uint) PCG-style hashes with testable outputs
- Lattice and wallpaper-group folds
- An interval or Lipschitz-bound convention marking each SDF as exact or bound
