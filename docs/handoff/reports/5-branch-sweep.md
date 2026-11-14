## Summary

No second forgotten architecture turned up beyond the already-known `origin/rebuild` in shader-sandbox. Nothing in `/home/user/webgl-demos` uses a struct-based shader entry point on any branch. The real exposures there are one unmerged physics fix, one abandoned coordinate-system variant, and three unmerged build-script commits.

Nothing was modified. `webgl-demos` is now a full clone (the depth-200 fetch reached the root; 433 commits on main), so the merge status below is exact.

## Part 1: webgl-demos (main tip 8550da7, 2026-08-13)

Both `rebuild` and `old` are ancestors of main. They are early history, not side work, but their documents are no longer in main's current tree.

| Branch | Tip | Merged into main? | Content not on main's tip |
|---|---|---|---|
| `old` | 95c5504, 2025-11-14, "fixed a frame counting off by one error" | Yes (ancestor) | 63 files: the original JavaScript framework (`src/app`, `src/engine`, `src/ui`, `src/project`, `src/styles`, `src/utils`, `src/glsl`), early demos, `docs/spec3.md` (30 KB), `docs/dev-docs.md` (133 KB) |
| `rebuild` | 5486a6d, 2025-11-16, "documentation for starting a build" | Yes (ancestor) | 5 docs only (115 KB), no code: `docs/overview.md`, `core-spec.md`, `engine-spec.md`, `project-spec.md`, `minimal-app.md` |
| `claude/comprehensive-demos` | b49e1c0, 2025-12-04, "Revert 'Start param groups collapsed…'" | Yes (ancestor) | 77 files later deleted or renamed on main: `src/passes`, `src/params`, `docs/archive/`, `demos/blob-transfer`, older examples |
| `claude/shader-platform-review` | db8d902, 2025-12-04, "Consolidate project.ts into main.ts" | Yes (ancestor) | Same later-deleted set (37 files) |
| `claude/simplify-shader-examples` | dfc7709, 2025-12-04, "Simplify smooth-blend" | Yes (ancestor) | Same later-deleted set (24 files) |
| `claude/standardize-shader-coords` | ec53126, 2025-12-05, "Update PROJECT_GUIDE.md to recommend auto-injected mousePos" | Yes (ancestor) | Same later-deleted set (23 files), including the 41 KB `docs/TODO.md` |
| `claude/refactor-shader-system` | ed43193, 2025-12-05, "Remove redundant documentation from demos/" | Yes (ancestor) | None |
| `claude/review-webgl-structure` | e954c8b, 2025-12-06, "Fix oval wave propagation: Configure mathSpace…" | Yes (ancestor) | None |
| `claude/review-shader-system` | 663b6f4, 2025-11-23, "Fix GLSL dynamic loop bounds in fbm functions" | No (24 ahead), but every file version at its tip exists in main's history, so it was rebased in | None |
| `claude/shader-authoring-examples` | 50ae08b, 2025-12-05, "Revert to working workaround for buffer mouse coordinates" | No: 23 commits ahead, 71 behind | 95 file versions never in main (see below) |
| `claude/simplify-webgl-layout` | 79183bc, 2025-12-06, "Fix wave equation physics in 09-layouts demos" | No: 1 commit ahead | 9 files in `examples/09-layouts/` (see below) |
| `claude/raytracer-implicit-surfaces-Q8u7r` | ba23ea6, 2026-08-13, "Find top-level demo pages; ignore gallery pages" | No: PR #47 merged, then 3 more commits were pushed | Changes to `scripts/build-all.mjs` and `.github/workflows/pages.yml` |

**`rebuild` (2 commits on top of `old`).** It deletes all the code ("complete rewrite start") and leaves a written specification for a TypeScript rewrite. That rewrite is the architecture main now implements, not a different one.
- The design is four layers with one-way dependencies: Project (pure data plus a GLSL compiler, no WebGL), Core (a thin private WebGL2 wrapper), Engine (stateful, headless, deterministic pass execution and ping-pong buffers) and App.
- Its principles are declarative projects, "boring is good", fail fast, and frame reproducibility for export; it records decisions with the rejected alternatives.
- `minimal-app.md` specifies a fixed 800×600 reference app with no controls.
- Four of the five docs also sit under `docs/archive/` on the merged Claude branches, alongside an `app-spec.md` (20 KB); `minimal-app.md` (11 KB) is only on `rebuild`. Main deleted `docs/archive/` on 2025-12-05.

**`old` (18 commits, 68 non-asset files).** This is the original config-driven JavaScript framework.
- `spec3.md` ("Architecture Specification v3") describes Project / Engine / App / UI layers: `ShaderProject`, `ShaderCompiler`, `ConfigLoader`, a GLSL import resolver, `RenderEngine`, and a family of app classes (shader-only, with code, with controls, with editor, debug).
- Each demo is `shader.glsl` (Shadertoy-style) plus `config.json` plus `main.js`, with archival one-demo-one-bundle builds.
- `dev-docs.md` is a long prose developer manual for the same system: five layers, design decisions, data flow, debugging.

**`claude/shader-authoring-examples`.** An alternative "built-in coordinates and display mode" design:
- `uv`, `pos`, `pixel`, `mousePos`, `mouseDown` and `dx` are auto-injected into every shader, with `pos` and `mousePos` in one "universal screen isometric" space shared by buffer and screen shaders.
- It adds an `output` field on `PassInput` and a `dx` uniform.
- It has its own `docs/COORDINATE_SYSTEM.md`, and changes `src/engine/Engine.ts`, `src/project/compiler.ts` and many demos.
- Main took the `standardize-shader-coords` / `mathSpace` route instead, and this branch ends on a revert, so it looks superseded.

**`claude/simplify-webgl-layout`.** The one unmerged commit divides the discrete Laplacian by `uPixelSize²` and adds `coverMap()` in the display shaders of the four `wave-*` layout demos, plus README notes. Main fixed the same demos through `review-webgl-structure` using `mathSpace`; I did not check whether the two fixes are equivalent.

**Idea search, all 13 branches**
- **`struct Fragment`, `Fragment f`, `struct Cell`, `compute(`:** zero hits anywhere.
- **`shade(`:** only an ordinary lighting helper, on main and the raytracer branch: `examples/implicit-surface-tracer/shader.glsl:210` (`vec3 shade(vec3 p, vec3 n, ro)`) and `:350`.
- **`mathSpace`:** already on main in 25 files.
  - Docs: `origin/main:docs/COORDINATE_SYSTEM.md:85` (also 35, 94, 104) and `origin/main:docs/PROJECT_GUIDE.md:538`.
  - Code: `origin/main:src/engine/Engine.ts:1180`, plus `src/project/types.ts` and `src/project/compiler.ts`.
  - The same files carry it on `refactor-shader-system`, `standardize-shader-coords`, `review-webgl-structure`, `simplify-webgl-layout` and the raytracer branch.
  - The only occurrence not on main is `claude/simplify-webgl-layout-01WmhQHYE3Ti13LeR7BD5iQn:examples/09-layouts/README.md`.
  - It is absent from `old`, `rebuild` and the four early Claude branches.
- **Named documents:**
  - `docs/ARCHITECTURE.md` is identical on main and every Claude branch.
  - `docs/TODO.md` is 41 KB on `comprehensive-demos`, `review-shader-system`, `shader-authoring-examples`, `shader-platform-review`, `simplify-shader-examples` and `standardize-shader-coords`: a "Feature Roadmap & To-Do" with priorities, long-term goals, demo ideas and known issues. Main cut it to 4.8 KB in d3294d6 ("1484 → 165 lines").
  - `TODO.md` and `PAGES-TODO.md` at the root are on main.
  - There are no files named DESIGN, ROADMAP, DECISIONS, PLAN or REVIEW on any branch.

## Part 2: shader-sandbox (shallow, 6 graft points)

| Branch | Tip | What it holds beyond main |
|---|---|---|
| `origin/main` | f428d90, 2026-07-15, "0.3.0: four-jobs redesign…" | — |
| `origin/rebuild` | 6daf8aa, 2026-07-16, "docs for a rebuild" | One commit ahead: the 28 files in `docs/architecture/` plus a 4-line pointer note added to `DESIGN.md`. Nothing else. |
| `origin/claude/sharp-planck-2kc13q` (not in your list) | Same commit as main | Nothing |
| `origin/old-version` | 8ef5c9c, 2025-11-09, "rebuilt and copied over my shadertoys!" | Unrelated history (no merge base found), 10 commits from 2020. A three.js + lil-gui + Vite Shadertoy viewer (`src/ShaderDisplay.js`, `ShaderDisplay-Three.js`) with 30 scenes in `scenes/` (hyperbolic tilings, Mandelbrot variants, black holes, Nil geometry, orbitals, moduli spaces, Taylor series). `node_modules` and `dist` are committed (1,457 files). |
| `origin/LimitSet` | 54d7a9b, 2021-09-14, "start to unpacking code" | Single-page three.js fullscreen-quad demo: `index.html`, `main.js`, `style.css`, `fragmentShader.glsl` (178 lines). |
| `origin/hopf` | cbfbeea, 2021-02-16, "Replaced with my Orbital Viewer" | Same skeleton; a 282-line volumetric orbital raymarcher. It is an ancestor of the other three old branches. |
| `origin/hypPicture` | b4afd21, 2021-10-07, "smallupdate" | Same skeleton with mouse and click handling; a 565-line shader of the hyperbolic right-angled hexagon tiling (genus 2 surface), plus two images. |

None of the four old branches contains `struct Fragment`, `struct Cell` or `mathSpace`.

## Could not determine

- **shader-sandbox merge status:** the clone is shallow and I was told not to fetch, so "no merge base" for the four old branches could be a truncation artefact. They are clearly different projects by content either way.
- **Old scenes ported or not:** I did not check whether the 30 `old-version` scenes were carried into main's `demos/shadertoys`.
- **Wave fix equivalence:** not checked (see `simplify-webgl-layout` above).

## Unmerged work that could be lost

Ordered by how substantial it is. Items 1–5 exist nowhere in either main's history; 6–7 are recoverable from webgl-demos main's history but absent from its current tree.

1. **shader-sandbox `origin/rebuild`**: `docs/architecture/` (28 files, 2,768 lines) and the `DESIGN.md` pointer. Already known; it is the only place this exists.
2. **shader-sandbox `origin/old-version`**: 30 Shadertoy-style scenes and the three.js `ShaderDisplay` viewer.
3. **webgl-demos `claude/shader-authoring-examples`**: 23 commits, 95 unique file versions; the universal `pos`/`mousePos` auto-injected coordinates and display-mode design, with its own `docs/COORDINATE_SYSTEM.md`. Probably superseded.
4. **shader-sandbox `origin/hypPicture`, `origin/LimitSet`, `origin/hopf`**: three standalone 2021 shaders (565, 178 and 282 lines).
5. **webgl-demos small unmerged commits**:
   - `claude/simplify-webgl-layout`, 1 commit: physical-Laplacian and `coverMap` fix for the four `examples/09-layouts/wave-*` demos, plus README notes.
   - `claude/raytracer-implicit-surfaces-Q8u7r`, 3 commits after the PR #47 merge: `scripts/build-all.mjs` (skip build-output directories, include flat demo pages alongside directory demos, ignore gallery pages) and Pages workflow action version bumps.
6. **webgl-demos design docs deleted from main's tree**:
   - `origin/old`: `docs/spec3.md`, `docs/dev-docs.md`.
   - `origin/rebuild`: the five spec docs; `minimal-app.md` is at a branch tip only there.
   - Merged Claude branches: `docs/archive/*`, the 41 KB roadmap `docs/TODO.md`, `demos/INIT_SHADER_EXAMPLES.md`.
7. **webgl-demos removed code**: `src/passes`, `src/params`, `demos/blob-transfer`, `test-coordinates.html` (on the merged Claude branches; deleted from main in a6f1311), and the whole original JavaScript framework on `origin/old`.
