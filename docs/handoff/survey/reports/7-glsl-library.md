# GLSL library audit — verification of `3-glsl-library.md`

Scope: `/home/user/webgl-demos/src/shaders/` (44 files in `lib/`, 1 in `core/`, 4,505 lines), `docs/SHADER_LIBRARY.md`, `vite.config.js`, `src/project/{ShaderPreprocessor,ViteFileResolver,MemoryFileResolver,compiler}.ts`. Nothing in either repo was modified (`git status` clean).

**Bottom line:** the previous report is substantively right on every headline claim. I executed the real GLSL and confirmed each numerically. Two counts are off (16, not 15, files never included), and three of the five "errors in files in use" are in functions no project calls. I found a dozen further issues, the most important being that the boundary Laplacian is worse than described, and `simplex3d` is wrong on the lines x=y=z.

Evidence tags: **[X]** GLSL executed (headless Chromium, WebGL2/SwiftShader, RGBA32F readback); **[T]** transcription to NumPy; **[D]** derivation; **[I]** inferred from reading.

## 0. The GLSL test runner

It worked on the first run. `harness.mjs` is about 110 lines and expands `#include` using the project's own alias regex plus the real `vite-plugin-glsl@1.5.4` `loadShader` (a copy installed in scratch), so it compiles the same text the build produces. Compiling all 44 files takes 1.3 s.

Pitfalls for a real runner:
- **SwiftShader flags** are needed; `EXT_color_buffer_float` was available.
- **Float32 only**: tolerances must be designed, and quantised sample points land on measure-zero sets (which is how I found the `simplex3d` defect).
- **Recompiling per call is slow**: about 28 ms per step, so 1,200 wave steps took 33 s. Cache programs.
- **Out-of-range `texelFetch` returned 0 here**; ES 3.0 leaves this undefined, so stencil tests at edges are implementation-dependent.
- **Line numbers don't map to source**: the plugin strips `//` comments and the first block comment.
- **`fract(sin())` hashes are GPU-dependent**, so test them statistically, not with golden values.
- **Files needing a user-defined global** (`F`) need a prelude hook.

## a. "No test executes GLSL; 15 of 45 files never included" — PARTLY (count is 16)

- **No test executes GLSL: VERIFIED [I].** `package.json` has no test script; the three test files only exercise include expansion with console asserts.
- **File count: 45 is right** (44 lib + `core/constants.glsl`). The "35 files" figure comes from `docs/SHADER_LIBRARY.md` (lines 29, 127, 627), which is stale. It omits nine files: `math/coordinates3d`, `sdf/viz`, `simulation/stencils3d`, `raymarching/implicit`, and all five `stencils/*`.
- **Never included: 16 of 44, not 15.** The report's own list enumerates 16: six `effects/*`, two `geometric/*`, `math/common`, `math/quaternion`, `raymarching/core`, `sdf/domain`, and four `stencils/*`. `core/constants.glsl` is also dead: `compiler.ts` injects an inline TS string, and nothing reads the file.
- **Function-level usage matters more.** 66 of 102 projects use the library, but `laplacian19Point`, `laplacian27Point` and `dampedWaveStep` have zero call sites. Of the five named errors, only `paletteViridis` (21 shader files) and `laplacian9PointZeroBoundary` (5 projects) actually run.
- **Three library files do not compile [X]:**
  - `effects/convolution` and `effects/morphology`: `'sample' : Illegal use of reserved word`.
  - `simulation/fluids`: `'curl2D' : no matching overloaded function found`. It is included by 2 projects (7 shader files), which therefore cannot compile. The cause is the documented API migration to `texelFetch`; `vorticity()` still calls the old signature.
- Two example files include `@lib/math/hash`, which does not exist (ENOENT in the loader) [X].

## b. The five named errors — all VERIFIED

### b1. 19-point 3D Laplacian (`stencils3d.glsl:141`) — VERIFIED [D][X], never called
```glsl
return (2.0/3.0) * faces + (1.0/6.0) * edges - 8.0 * center;
```
**Derivation.** Take a cubically symmetric stencil with weights c₀ (centre), f (6 faces), e (12 edges), v (8 corners), h=1. Taylor expansion gives:
- Zeroth moment (annihilate constants): c₀ + 6f + 12e + 8v = 0.
- Second moment, Σw·x²/2 = 1: f + 4e + 4v = 1.
- Fourth moments: the ∂ₓ⁴ coefficient is (2f+8e+8v)/24 = 1/12 automatically. The ∂ₓ²∂ᵧ² coefficient is e + 2v. For the error to be the isotropic (h²/12)∇⁴ it must equal 1/6.

With v=0 this forces e=1/6, f=1/3, c₀=−4, as the previous reader said. The code has f=2/3 and c₀=−8, so the weights sum to −2 and f+4e = 4/3.

### b2. 27-point 3D Laplacian (`stencils3d.glsl:198`) — VERIFIED [D][X], never called
```glsl
return (4.0/27.0)*faces + (2.0/27.0)*edges + (1.0/27.0)*corners - (88.0/27.0)*center;
```
The weights sum to (24+24+8−88)/27 = −32/27, and f+4e+4v = 16/27. The 4:2:1 ratios are the (1,2,1)⊗³ blur kernel. A consistent version of that shape is f=1/4, e=1/8, v=1/16, c₀=−7/2, but it has e+2v = 1/4, so it is not isotropic. An isotropic choice is (14, 3, 1, −128)/30.

**Executed at the centre voxel, h=1:**

| field | exact | 7-pt | 19-pt | 27-pt |
|---|---|---|---|---|
| 1 | 0 | 0 | **−2.0000** | **−1.1852** |
| x²+y²+z² | 6 | 6 | **8.0000** | **3.5556** |
| x² | 2 | 2 | 2.6667 | 1.1852 |
| x²y² | 0 | 0 | 0.6667 | 0.5926 |
| sin·sin·sin eigenfunction | −0.05147 | −0.05116 | −0.60242 | −0.34673 |

The 7-point stencil, `gradient3D`, `divergence3D`, `curl3D` and `laplacian7Point_periodic` are exact on polynomial and Fourier tests [X].

### b3. `laplacian9PointZeroBoundary` — VERIFIED, and worse than reported [X][T]
The function is byte-identical in `stencils/laplacian.glsl:160-267` and `simulation/stencils.glsl:211-318`. Its branch tests are `ij.x == 1`, `ij.y == 1`, `x == 1.` and `y == 1.` with `x = float(ij.x)/resolution.x`.

Executed over a whole 8×6 grid with u≡1 (a Laplacian must return 0 in the interior):
```
j=5 | -1.75 -1 -1 -1 -1 -1 -1 -1.75
j=4 | -1     0  0  0  0  0  0 -1
j=3 | -1     0  0  0  0  0  0 -1
j=2 | -1     0  0  0  0  0  0 -1
j=1 |  1     0  2  2  2  2  2  1
j=0 | -1.75 -1 -1 -1 -1 -1 -1 -1.75
```
- **Right/top branches are dead code.** `float(i)/W == 1.` never holds for valid i.
- **Left/bottom branches fire on the second column/row** (index 1), not the edge. Pixel coordinates are 0-based.
- **The j=1 row stencil** `[.5,1,.5; .5,−1,.5; 0,0,0]` sums to +2. The mirror (Neumann) stencil needs centre −3, as the previous reader said.
- **The left-column and corner arrays** are the correct mirror stencils, so the "Dirichlet" comment is wrong.
- **True edge pixels** fall through to the interior stencil with out-of-range fetches.
- **On u=x²+y² (exact 4):** column 1 returns 8, row 1 returns 18…82, pixel (1,1) returns 12.
- **Instability [T]:** as a matrix on 16×12 the operator is non-symmetric with 5 positive eigenvalues (max +0.798). The plain 9-point stencil with zero ghost cells is symmetric negative-definite (max −0.092). So u_tt = c²Lu has exponentially growing modes. `demos/wave-equation` and `new-demos/wave-rebuild` hide this by zeroing pixels with `ij.x==1 || ij.y==1` each step.

The plain `laplacian9Point` already behaves as Dirichlet-0 at the rim on this implementation. The interior 5-point and 9-point stencils and the periodic variant are correct [X]: the periodic operator matches its Fourier symbol cx+cy+cx·cy−3 to 1.2e-7 over the torus.

### b4. `paletteViridis` (`palettes.glsl:59`) — VERIFIED [X], against matplotlib 3.11.2
```glsl
return cosinePalette(t, vec3(0.28,0.27,0.52), vec3(0.28,0.44,0.55), vec3(1.0,1.0,1.5), vec3(0.0,0.15,0.2));
```
| t | lib | matplotlib |
|---|---|---|
| 0 | (0.560, 0.529, 0.690) | (0.267, 0.005, 0.329) |
| 0.25 | (0.280, −0.086, 0.030) | (0.230, 0.322, 0.546) |
| 0.5 | (0.000, 0.011, 1.043) | (0.128, 0.567, 0.551) |
| 0.75 | (0.280, 0.626, 0.270) | (0.369, 0.789, 0.383) |
| 1 | (0.560, 0.529, 0.350) | (0.993, 0.906, 0.144) |

- Maximum RGB distance is 0.753 and the mean is 0.510 over 65 samples.
- Luminance decreases on 30 of 64 intervals; viridis is monotone.
- R and G have period 1, so t=0 and t=1 agree in those channels.
- New: it leaves the gamut (G down to −0.17, B up to 1.07), so it clips.

### b5. `dampedWaveStep` (`pde.glsl:102-113`) — VERIFIED [D][X], never called
```glsl
float velocity = (u_curr - u_prev) / dt;
float acceleration = c*c*laplacian/(dx*dx) - gamma*velocity;
float u_next = u_curr + velocity*dt + 0.5*acceleration*dt*dt;
```
The intended PDE is u_tt + γu_t = c²∇²u. The centred discretisation is

u⁺(1+γdt/2) = 2u − u⁻(1−γdt/2) + c²dt²·Lu/dx².

The code expands to u⁺ = 2u − u⁻ + ½dt²(c²Lu/dx² − γ(u−u⁻)/dt). The backward difference is the velocity at t−dt/2, so the correct update has no factor ½. The code therefore solves u_tt + (γ/2)u_t = (c²/2)∇²u.

Executed on an exact eigenvector of the 5-point operator (15×15, λ=−0.076859, c=dx=1, dt=0.5):

| quantity | `waveEquationStep` | `dampedWaveStep` |
|---|---|---|
| effective c²dt²/dx² from one step (true 0.25) | 0.25000 | 0.12500 |
| period over 400 steps (leapfrog-exact 22.6456) | 22.6457 | 32.0386 (ratio 1.4148 ≈ √2) |
| envelope decay rate at γ=0.05 (intended γ/2 = 0.0250) | — | 0.01258 (≈ γ/4) |

`heatEquationStep` matches 1+αdtλ/dx² to 6 digits.

## c. "The quaternion module is broken" — VERIFIED [X]
Every function builds results in constructor order (w,x,y,z) but reads operands by GLSL field names, where `.w` is the fourth component. So `quatMul` takes inputs laid out as (v,s) and returns (s,v).

| expression | result | expected |
|---|---|---|
| `quatMul(I,I)`, I=`quatFromAxisAngle(z,0)`=(1,0,0,0) | (−1,0,0,0) | I |
| `quatRotate(I,(1,2,3))` | (−2,−1,0) | (1,2,3) |
| `quatRotate(q(z,90°),(1,0,0))` | (1,0,0) | (0,1,0) |
| `quatMul(q, quatInverse(q))` | (−0.19, 0.08, −0.09, −0.97) | identity |
| `quatConjugate((1,2,3,4))` | (4,−1,−2,−3) | — |
| `quatToMat3(xyzw q(z,90°))·(1,0,0)` | (0,−1,0) | (0,1,0) |
| `mat3ToQuat(true Rz(90°))` | (0,0,−0.707,0.707) | (0,0,+0.707,0.707) |

- `quatToMat3` and `mat3ToQuat` are self-consistent in xyzw layout (round-trip exact) but give the inverse rotation: a row-major matrix was written into a column-major constructor.
- `quatSlerp` is layout-agnostic and correct.
- `math/rotate.glsl` has the same transpose: `rotate2D(90°)·(1,0)` = (0,−1), and likewise for the 3D ones. It is self-consistent (`rotateAxis` matches `rotateX/Y/Z`, determinant 1) but `M*v` rotates by −θ, undocumented. Two projects use it.

## d. "Functions are almost all pure" — VERIFIED [I]
A grep finds no `uniform`, no `gl_FragCoord`, no `u*` identifiers and no mutable globals. Exceptions:
1. `raymarching/implicit` needs a user-defined global `float F(vec3)` before the include.
2. `math/constants` needs the injected `PI`.
3. `raymarching/core` is a template with the SDF hard-coded to `0.0`.
4. Hidden sampler-state dependence: `cellular`, `fluids` and `effects/*` use `texture()` (filter and wrap mode); the stencils rely on out-of-range `texelFetch`.
5. `opScale` returns p/s and expects the caller to multiply the distance by s.

## e. Third-party code — VERIFIED
There are three attributions (`simplex2d`, `palettes`, `viz`), no licence headers and no LICENSE file, although the README says "MIT, see LICENSE". Licences below are from memory, not fetched.

| Code | Source | Licence |
|---|---|---|
| `simplex2d`, `simplex3d` (`mod289`, `permute`, `taylorInvSqrt`) | McEwan / Ashima Arts and Gustavson, webgl-noise | MIT; notice must be kept. The 3D file has no credit |
| `hash11/12/22/13/33` | Dave Hoskins, "Hash without Sine" | MIT in the Shadertoy source |
| all `sd*`, `op*`, domain ops; `smin`, `gain`, `almostIdentity`, `impulse`, `cubicPulse`, `expStep`, `parabola`; `cosinePalette` and the Rainbow/Warm/Cool/Neon coefficient sets; `sdfColor`; soft-shadow/AO/tetrahedral-normal skeletons; the 127.1/311.7 Voronoi hash | Inigo Quilez | His 2D-SDF and palette Shadertoys carry MIT headers; other Shadertoy code defaults to CC BY-NC-SA 3.0 unless stated. Check per function |
| `rgb2hsv`, `hsv2rgb` | Sam Hocevar (lolengine) | WTFPL, I believe |
| `temperatureToRGB` | Tanner Helland's fit | blog post, no explicit licence |
| 30 easings | Robert Penner | BSD |
| `bias` | Schlick | published formula |
| `fract(sin(dot))·43758.5453` | Shadertoy folklore | none |
| `jacobiStep`, pressure projection | Stam / GPU Gems ch. 38 | algorithm only |
| 9-point (½, ¼, −3) | Oono–Puri stencil | — |

Original to the owner: `coordinates3d`, the stencil and PDE files, `raymarching/implicit`, `cellular`.

## f. "35-40% worth carrying forward" — PLAUSIBLE
By my count about 1,700 of 4,490 lines (38%) passed executed checks unchanged. About 50% is salvageable if one-line fixes count (two elastic easings, `opRevolution`, sRGB, the `coordinates3d` z-offset). The figure is a judgement, not a measurement. Note that most of the passing code is third-party and is better re-imported from upstream with its licence.

## 1. Per-file table
"Proj" = projects including it directly (transitively in parentheses where different). All files are pure unless noted in section d.

| File | Contents | Fns | Proj | Verdict | Provenance |
|---|---|---|---|---|---|
| color/palettes | cosine palette, 8 presets, heat, viridis | 11 | 33 | wrong (viridis); Warm ≡ Sunset | IQ |
| color/hsv | rgb↔hsv, hue/sat/value | 5 | 3 | correct [X], round-trip 8e-7 | Hocevar |
| color/spaces | sRGB, luminance, HSL, temperature | 8 | 1 | minor: γ2.2 not piecewise; Rec.601 weights; G jumps 1.000→0.987 at 6600 K | Helland |
| color/blend | 14 blend modes | 14 | 1 | correct [X]; `blendSubtract` is linear burn | standard |
| math/random | Hoskins and sin hashes | 8 | 11 | correct [X], mean and sd uniform | Hoskins, folklore |
| math/coordinates3d | voxel/UVW helpers | 10 | 7 | minor: z lacks half-voxel offset; comment says /dx³ | own |
| math/constants | PHI, deg/rad | 0 | 4 | correct; needs injected PI | own |
| math/rotate | 2D/3D rotation matrices | 5 | 2 | minor: all transposed (rotate by −θ) [X] | textbook |
| math/easing | 30 easings | 30 | 1 | minor: 2 wrong [X] | Penner |
| math/interpolation | smootherstep, remap, exp | 6 | 1 | minor: `expOut(1)`=0.632, `expIn(1)`=1.718 | own |
| math/common | map, smin, gain, bias, shaping | 18 | 0 | minor: `impulse`/`parabola` comments wrong [X] | IQ, Schlick |
| math/quaternion | quaternion algebra | 9 | 0 | wrong [X] | — |
| noise/simplex2d | 2D simplex | 4 | 7 (9) | correct [X], range ±0.985 | Ashima |
| noise/simplex3d | 3D simplex | 5 | 3 (6) | minor: discontinuities, see §3 | Ashima |
| noise/fbm | fBm 2D/3D | 4 | 3 | correct | own |
| noise/perlin | "Perlin" 2D/3D | 6 | 3 | wrong: gradients not random [X] | own |
| noise/worley | F1, F2 2D/3D | 6 | 3 | minor: F2 wrong 3.9% [X] | IQ-style |
| noise/curl | curl noise | 3 | 2 | 2D correct; 3D wrong [X] | own |
| sdf/primitives2d | 10 shapes | 10 | 20 | correct [X]; polygons match brute force to 5e-7 | IQ |
| sdf/primitives3d | 12 shapes | 12 | 3 | 10 exact [X]; `sdCone`, `sdTriPrism` are bounds | IQ |
| sdf/operations | boolean, smooth, extrude, revolve | 9 | 6 | minor: `opRevolution` returns its input [X] | IQ |
| sdf/viz | distance colouring | 3 | 4 | correct | IQ |
| sdf/domain | repeat, symmetry, twist | 9 | 0 | correct [I] | IQ |
| simulation/pde | heat, wave, Gray-Scott, advect, Jacobi, damped wave | 6 | 9 (11) | 5 correct [X]; damped wave wrong | own, GPU Gems |
| simulation/stencils | 2D operators + boundary | 11 | 6 (16) | interior correct [X]; boundary wrong | own |
| stencils/laplacian | copy of part of the above | 7 | 8 | same; cannot be co-included [X] | own |
| simulation/stencils3d | 3D operators | 9 | 4 | 7-pt, grad, div, curl correct; 19/27-pt wrong | own |
| simulation/cellular | Life and relatives | 7 | 5 | correct [I]; `majorityRule` excludes self | own |
| simulation/fluids | stable-fluids helpers | 10 | 2 | wrong: does not compile [X] | GPU Gems |
| lighting/phong | Phong, Blinn-Phong | 4 | 4 | correct [I] | textbook |
| raymarching/implicit | sign-change marcher, camera | 7 | 1 | correct [X] (sphere hit 2.02532 = exact); camera mirrored | own |
| raymarching/core | placeholders | 5 | 0 | wrong (template) | IQ skeleton |
| stencils/{biharmonic, gradient, divergence, curl} | copies | 1 each | 0 | correct but duplicate | own |
| effects/{convolution, morphology} | kernels, morphology | 9, 9 | 0 | wrong: do not compile [X]; `opening`/`closing` are single ops | standard |
| effects/{blur, dither, edge, distortion} | kernels, Bayer, distortions | 3, 7, 2, 8 | 0 | minor: LoG is plain Laplacian; `blueNoise` is white | standard |
| geometric/{shapes, transforms} | step shapes, polar/spherical | 8, 9 | 0 | minor: `star` draws a gear | own |

## 3. Additional errors the previous reader missed
1. **Boundary Laplacian:** off-by-one branch placement and positive eigenvalues (b3).
2. **`simplex3d` is wrong on the lines x=y=z [X].** On the diagonal `step(x0.yzx,x0.xyz)` gives g=(1,1,1), so i1=(0,0,0) and i2=(1,1,1), a degenerate simplex. Measured: `simplex3d(vec3(0.137))` = −0.519 against −0.404 at 1e-4 away; jumps up to 0.73 at lattice points. Any 3D volume sampled at p ∝ (i,i,i) hits it. The expression looks identical to upstream, so it is presumably inherited (not checked).
3. **`simplex3d` 0.6 kernel:** the previous reader's from-memory note is now measured. Jumps reach 3.6e-3 across simplex faces, against a theoretical 42·(0.1)⁴·√½ ≈ 3.0e-3. `simplex2d` and `perlin3d` are continuous.
4. **`perlin2d` gradients form a plane wave [D][X].** The gradient angle is 12.9898·i + 78.233·j, so neighbouring gradients differ by a constant 0.423 rad horizontally and 2.835 rad vertically (measured 0.423–0.424 and 2.835). Measured ranges are ±0.51 (2D) and ±0.58 (3D) against the claimed [−1,1].
5. **`curl3d` [D][X]:** before normalisation it is ∇n×(1,1,1) = curl(n·(1,1,1)), which is divergence-free but confined to planes x+y+z=const (measured |v·(1,1,1)|/|v| = 1.6e-7). The `normalize` destroys this: mean |div| is 16.8, the same size as a typical Jacobian entry (12.2), and |v| ≡ 5. `curl2d` has a ratio of 0.048, which is finite-difference error only.
6. **Worley:** F1 is also wrong in 0.04% of samples (maximum error 0.10), because a 3×3 search with full-cell jitter is not sufficient and the value is clamped at 1. F2 is wrong in 3.87%, exactly the samples where true F2 > 1.
7. **The 2D 9-point Laplacian is not the isotropic one [D][X].** Its ∂ₓ²∂ᵧ² error coefficient is ¼, not ⅙ (the Mehrstellen stencil is ⅔, ⅙, −10/3). On x²y² at (3,3) it gives 37 against an exact 36, where the 5-point stencil is exact. "More accurate" is unsupported.
8. **`biharmonic`:** applying the 5-point operator twice is exactly the 13-point stencil (it returns 56 for x⁴+y⁴+x²y², which is exact). The comment calling it approximate is wrong.
9. **Elastic easings [X]:** `easeOutElastic(1e-4)` = 0.1335 and `easeInElastic(1−1e-4)` = 0.8644; the phase should be p/4 = 0.075, not 0.1. The other 28 pass at 0, 1, the midpoint and endpoint continuity.
10. **`setupCamera` is mirrored [X]:** from ro=(3,0,0), screen +x maps to world +z, which is the viewer's left.
11. **Fluids units:** `advectVelocity` takes velocity in UV units while `pde.advect` takes texels. The docs list `advect` with 4 arguments; the code takes 5.
12. **SDFs:** `sdCone` fails the closest-point test at 12.7% of outside points (maximum 0.53) and `sdTriPrism` at 87.8% (maximum 1.20). The header says all return signed distance.

No complex-number, Möbius, hyperbolic, or RK4 code exists in the library, so there was nothing of that kind to check.

## 4. Conventions and the include mechanism
- **Naming:** camelCase with `sd*`, `op*`, `ease*`, `palette*`, `blend*`, `quat*`, `hash{in}{out}` prefixes. Outliers are `_vec`, `_periodic`, `_F1F2`, `mod289_3d`.
- **Guards:** every file uses `#ifndef NAME_GLSL`, and the guards are load-bearing (see below). `CURL_GLSL` is shared by `noise/curl` and `stencils/curl`; including both silently drops the second, and `curl2D` is then undefined [X].
- **Duplicate definitions under different guards:** `stencils/laplacian` with `simulation/stencils` fails with `'laplacian5Point' : function already has a body` [X]; `stencils/gradient` likewise.
- **Dependencies:** `fbm` and `curl` → `simplex2d` + `simplex3d`; `pde` → `stencils`; `fluids` → `stencils` + `pde`; `biharmonic` → `laplacian`. All use relative `./x.glsl` paths.
- **Build path (used by all but one project) [X]:**
  - `glslAliasPlugin` rewrites `#include "@lib/x"` to a relative path, in the top-level shader only.
  - `vite-plugin-glsl` then inlines recursively, resolving relative to the including file and appending `.glsl`.
  - `removeDuplicatedImports` defaults to false, so duplicates are only warned about. The expanded `fluids` text contains `laplacian5Point` twice, and the GLSL compiler's `#ifndef` does the deduplication.
  - Recursion throws; a missing file throws ENOENT.
- **Runtime path (`ShaderPreprocessor.ts`, used only by `new-demos/compile-test`, for `common.glsl`) [I]:**
  - It matches `#include "…"` at line start and emulates guards itself.
  - It treats any `#define` as a guard symbol and does not count nested `#if`/`#ifdef` inside a skipped block.
  - It keys source maps and cycle detection by basename, so the two `curl.glsl` files collide.
  - `ViteFileResolver` ignores `currentFile`, so nested `./stencils.glsl` includes resolve against the page URL and will not find the library file.

## 5. Recommendation
- **Carry forward (with tests and attribution):**
  - 2D interior stencils (5-point, 9-point labelled Oono–Puri, periodic, gradient/divergence/curl, biharmonic).
  - 3D 7-point, gradient/divergence/curl, periodic.
  - `heatEquationStep`, `waveEquationStep`, `reactionDiffusionStep`, `jacobiStep`, `advect`.
  - `cellular`.
  - `raymarching/implicit` (fix the camera, document `F`).
  - `coordinates3d` (fix the z offset).
  - `hsv`, HSL, `blend`, the cosine palette.
  - 28 easings.

  These are the owner's own work or passed execution.
- **Re-import from upstream rather than carry:** simplex noise (current webgl-noise or psrdnoise), Hoskins hashes, IQ SDFs and operators. The existing copies are correct but unlicensed, `simplex3d` has the defects above, and each SDF needs an exact/bound label.
- **Rewrite from a derivation:**
  - 19/27-point Laplacians, using the moment conditions in b1 and b2.
  - Boundary Laplacians: decide Dirichlet or Neumann, 0-based, all four sides, and test for symmetry and negative-semidefiniteness.
  - Damped wave.
  - Quaternion and rotation, with one documented convention.
  - Viridis, as a real fit tested against matplotlib.
  - sRGB, perlin, curl3d, worley, fluids.
- **Drop:** `raymarching/core`, `effects/convolution`, `effects/morphology`, the duplicate `stencils/*`, `geometric/shapes`, most of `math/common`, the dead `core/constants.glsl`.

The cheapest single improvement is a compile-every-file test plus moment checks for each stencil (constants → 0, quadratics exact). That alone would have caught 3 dead files and 4 of the 5 headline errors.

## Scripts and data
Everything is in `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/glsl-lib/`:
- `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/glsl-lib/harness.mjs` — the runner
- `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/glsl-lib/t1_compile.mjs` — compile every file and collision pairs
- `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/glsl-lib/t2_stencils.mjs` — 2D/3D stencils and boundary Laplacian
- `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/glsl-lib/t3_wave.mjs` — wave, damped wave, heat steps
- `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/glsl-lib/t4_math.mjs` — viridis, quaternion, rotation, easing, colour
- `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/glsl-lib/t5_sdf_noise.mjs` — SDFs, noise, curl, worley, raymarcher
- `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/glsl-lib/t6_simplex.mjs` and `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/glsl-lib/t7.mjs` — `simplex3d` continuity and diagonal
- `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/glsl-lib/bnd_eig.py` — boundary-operator eigenvalues
- `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/glsl-lib/viridis_ref.json` — matplotlib reference values

The scratchpad is session-scoped; copy these somewhere durable if they are to seed the test runner.
