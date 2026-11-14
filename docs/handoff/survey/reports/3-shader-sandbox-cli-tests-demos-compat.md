# shader-sandbox: CLI / build / scaffolds / tests / demos / docs / 0.2.7 compatibility audit

Read-only study. The tracked tree is untouched: `git status` is clean and only the ignored `node_modules/` remains (I built `dist-lib/` and `dist-runtime/` and then deleted them).

Evidence labels: **[RUN]** verified by running, **[READ]** verified by reading code or diff, **[INF]** inferred.

The most important findings:
- The audit table holds up, but it misses about a dozen changes. The riskiest are the `#app` auto-mount in built `main.js`, the removal of export/screenshot/record buttons from viewer chrome, and the fetch loader now failing on non-404 responses.
- `origin/old-version` is an ancestor of main, not unrelated history, and none of its 29 scenes are in `demos/`.
- The README embed example for built folders is wrong (missing `await`).
- No test touches WebGL, and two FIX_PLAN gates that called for GL tests were never met.

---

## 1. CLI, build, scaffolds, dev server

### Commands (`bin/cli.js:674-938`) [READ, partly RUN]

| Command | Behaviour |
|---|---|
| `create <name>` or `create .` | Scaffold a project and run `npm install` (`:217-358`). Refuses if `shaders/` exists or the target dir exists; refuses to overwrite template files unless `--force` (`:292-304`). |
| `new <name> [template]` | Copies `templates/shaders/<template>` to `shaders/<name>`; templates are `simple`, `shadertoy`, `buffers`, `scripted` (`:30`, `:360-431`). |
| `dev <name>` | Spawns the project's own `node_modules/.bin/vite` with `SHADER_NAME=<name>` (`:619-671`, `:704-744`). |
| `dev` (no name) | Gallery mode, `SHADER_NAME=__gallery__` (`:727-729`). |
| `build <name>` | Writes a temporary `_build-entry.js`, runs `vite build` in lib mode, then writes `index.html` and `README.txt` (`:477-617`, `:746-807`). |
| `build-all` | Builds every shader, then copies the runtime to `dist/shader-sandbox.js` if the package has one (`:851-894`). |
| `build-runtime` | Only copies the prebuilt `dist-runtime/shader-sandbox.js` into `dist/`; it builds nothing (`:896-918`). |
| `build-gallery` | Writes a static `dist/index.html` of cards from each `config.json` title/description (`:809-849`). |
| `list` | Lists folders and bare `.glsl` files in `shaders/`. |
| `help`, `--help`, `-h`, no args | Usage text. |

- The only flag in the whole CLI is `--force`. There is no `--port`, `--host`, `--out` or `--open`.
- Shader names must match `^[a-zA-Z0-9_-]+$` (`:480`).
- If both `shaders/x/` and `shaders/x.glsl` exist, the folder wins with a warning (`:464-467`).
- Repo-internal scripts are separate from the CLI: `npm run new <name> [1-4]` (`scripts/new-demo.cjs`, writes iChannel-style demos with capitalised pass keys) and `npm run dev:demo <demo>` (`scripts/dev-demo.cjs`).

### What `create` scaffolds [READ + RUN on a hand-assembled copy]

It copies the whole `templates/` directory (`cli.js:307`) and generates `package.json`:

- `index.html`: a `#app` div plus `./main.ts`.
- `main.ts`: described below.
- `gallery.js`: shared with `build-gallery`.
- `vite.config.js`.
- `shaders/{simple,shadertoy,buffers,scripted}/`: each has `config.json` and `image.glsl`; `buffers` adds `trail.glsl`, `scripted` adds `script.js`.
- `package.json`: scripts `dev`/`build`/`list`; dependencies `shader-sandbox ^<own version>`, `vite ^5.0.0`, `vite-plugin-css-injected-by-js ^3.5.0` (`cli.js:274-288`).

`templates/main.ts`:
- It resolves the shader name from `?shader=` or the Vite define `__SHADER_NAME__` (`:21-30`).
- It globs **all** `./shaders/**/*.glsl` (raw), `*.json`, images, and `script.js` (as module and as raw text) (`:45-66`).
- It calls `loadDemo('shaders/<name>', …6 maps)` then `mount(root, { project, authorTools: true })` (`:69`, `:79`).
- Bug: `(window as any).app = handle.app` (`:82`), but `MountHandle` has no `app` field (`src/mount.ts:58-72`), so `window.app` is always `undefined`. `mount` is also synchronous, so the `await` is a no-op. This was already the case in 0.2.7.

All four template configs set `"controls": true`. The config vocabulary a new user sees is `layout`, `controls`, `mode`, `buffers`, and `uniforms`.

`templates/vite.config.js`: `base: './'`, port 3000, `open: true`. When `SHADER_BUILD_ENTRY` is set it switches to lib mode with entry `_build-entry.js`, output `main.js`, and `inlineDynamicImports` (`:23-48`).

### What `build` outputs [RUN]

I built `texture` and a bare `.glsl` in a scratch project linked against the repo. Each produced exactly:

```
dist/<name>/main.js     ~496 KB (bare shader) / 637 KB (with a 106 KB image)
dist/<name>/index.html  394 bytes
dist/<name>/README.txt
```

- **The engine is bundled.** `main.js` has zero `import` statements.
- The image is inlined as a base64 data URI; there is no `assets/` folder.
- The bundle also contains the whole author UI (screenshot/recording panels, the MP4 encoder via mediabunny) even though viewers cannot reach it. That is roughly 500 KB per shader with no sharing between shaders.
- The entry exports `async mount(el, options)` and **auto-mounts into `document.getElementById('app')` at import time** (`cli.js:520-535`).
- `_build-entry.js` is written into the user's project root and removed afterwards, including on SIGINT (`:493`, `:540-546`).

README bug [READ]: `README.md:305` shows `const handle = mount(...)` for the built module and then lists `handle.pause()` etc. The built `mount` is `async`, so `handle` is a Promise. The CLI's own printed snippet and `README.txt` do not use the handle, so they are fine.

### Dev server

- [RUN] `shader dev simple` starts Vite 5.4 on :3000 and serves `main.ts` with `authorTools: true`.
- [READ] There is no `import.meta.hot`, `hot.accept` or `handleHotUpdate` anywhere in `src/`, `templates/`, `bin/` or `scripts/`. The "live reload" on file save is therefore Vite's default full-page reload [INF], which loses time, buffer state and slider values. In-place recompile exists only through the in-browser editor (`MountHandle.recompile`), and I found no code that writes edits back to disk.
- `generatedLoader` is a repo-internal mechanism only, not part of user projects:
  - `src/main.ts:18` imports the gitignored `src/project/generatedLoader.ts`.
  - `scripts/generate-loader.cjs` writes it with literal glob paths for one demo.
  - `predev`/`prebuild` write a default (`examples/hello-shader`) only if it is missing.
  - `dev:demo` rewrites it and runs `npx vite`.
  - The lib build excludes it (`scripts/build-lib.cjs:43`).

### Package build

- `build:lib` runs `tsc` to `dist-lib/` plus a CSS copy. It is unbundled, so `dist-lib` imports `.css` files and consumers need a bundler.
- `build:runtime` produces a single `dist-runtime/shader-sandbox.js`, 512.75 kB (118.7 kB gzip) [RUN].
- `prepublishOnly` runs both.
- Runtime dependencies are `mediabunny` and `prismjs`.
- There is no CI config (no `.github/`) and no publint.

---

## 2. Tests

- [RUN] `npm ci`, then `npx vitest run`: **11 files, 102 tests, all pass, 1.2 s.**
- **None touch WebGL** [READ]. There is no vitest config (default node environment, no jsdom), and a grep of `tests/` for `WebGL`, `getContext`, `jsdom`, `happy-dom` returns nothing. Everything is pure logic.

| File | Tests | Covers |
|---|---|---|
| `configHelpers` | 21 | `validateConfig` and `validateMultiViewConfig` rules |
| `std140` | 15 | sizes, strides, packing, struct layout |
| `loadProjectCore` | 13 | in-memory loader: bare file, modes, `current` ordering |
| `shaderSource` | 13 | preamble text, line mapping, cubemap regex |
| `UniformStore` | 8 | defaults, cloning, reset |
| `transport` | 8 | clock and pause |
| `exportPacking` | 8 | export packing |
| `errorOverlay` | 5 | error line translation |
| `exportGeneration` | 4 | string-level checks of the export HTML |
| `mp4Codec` | 4 | codec level strings |
| `node-exports` | 3 | node entry matches browser entry |

- Not covered by any test: shader compilation, rendering, ping-pong, readPixels, the elements, the CLI, the demos.
- [RUN] I wrote a throw-away test in scratch that loads all 47 demo folders and 4 templates through `loadProjectFromFiles` with a disk loader. All load under 0.3.0 validation with no warnings. GLSL compilation was not checked.
- [RUN] **`npx tsc --noEmit` on a fresh state fails**, confirming the previous reader: `src/main.ts(18,44): error TS2307: Cannot find module './project/generatedLoader'`. That is the only error. `npm run build` works because `prebuild` generates the file. `npm test` does not need it.

---

## 3. Demos corpus

There are 47 loadable folders, with 72 `.glsl` files (4,107 lines), 14 `script.js`, and 5 images. The 5 images are one identical 720×360 JPEG (same md5), including `texture/texture.png`, which is a JPEG with a `.png` name. Demos are byte-identical between `0c58c34` and `origin/main` (`git diff --stat` is empty for `demos/`).

Config styles:
- **N** = named buffers/textures/uniforms (standard mode).
- **S** = `mode: "shadertoy"` with iChannel bindings.
- **0** = no config (folder with only `image.glsl`).
- **E** = standard mode with a vestigial empty `"Image": {}` key.
- **MV** = multi-view.

| Demo | Style | Passes | Features |
|---|---|---|---|
| examples/hello-shader, mouse | 0 | 1 | mouse uses iMouse + iMousePressed |
| examples/uniforms | E | 1 | float, int, bool, vec3 colour, vec2; split layout |
| examples/inline-controls | N | 1 | `uniformsUI: "inline"` |
| examples/live-editor | E | 1 | split layout, dark theme |
| examples/texture | N | 1 | image texture, tabbed layout |
| examples/equirectangular | N | 1 | image texture (manual equirect lookup) |
| examples/keyboard | N | 1 | `"keyboard"` texture; injected `isKeyDown`/`isKeyToggled`/`KEY_*` |
| examples/audio, webcam | N | 1 | `"audio"`, `"webcam"` textures |
| examples/touch | E | 1 | iTouch*/iPinch* |
| examples/buffers | N | 2 | 1 named buffer (`filter: "nearest"`), texelFetch, iFrame==0 init (Life) |
| examples/common-code | N | 2 | common.glsl + 1 buffer, split |
| examples/multi-buffer | N | 4 | 3 named buffers, tabbed |
| examples/reaction-diffusion | N | 3 | 2 coupled feedback buffers, common, uniforms, mouse |
| examples/scripting | N | 1 | script `updateTexture` (script texture), `getUniformValue` |
| examples/ubo-arrays | E | 1 | vec4[] + `setArrayUniform` |
| examples/ubo-static | E | 1 | mat3[128], script `setup` only |
| examples/ubo-dynamic | N | 1 | mat3[] + `onUniformChange` |
| examples/json-data | N | 1 | vec3[]/float[] with `data: "./data.json"` |
| examples/struct-array | N | 1 | struct[] + `setStructArrayUniform` |
| examples/partial-update | N | 1 | struct[] + `setStructArrayElement`, `onUniformChange` |
| examples/click-to-place | N | 1 | vec2[] + `setArrayElement`, `setActiveCount`, `dispose`, `isRestore` |
| examples/drag-points | N | 1 | struct[] + element updates, `setActiveCount`, `dispose`, `isRestore` |
| examples/mobius | N | 1 | texture + script + `hidden` uniform + `dispose`/`isRestore` |
| examples/hyperbolic-voronoi | N | 1 | common, vec3[] + vec4[], int/bool, `stickyMouse`, script (248 lines) |
| examples/hyperbolic-voronoi-simple | N | 1 | common, UBO arrays, script |
| examples/hyperbolic-voronoi-{edges,full,shadertoy} | S | 2 | BufferA self-feedback, texelFetch, iFrame |
| examples/linkage-levelset, -torus | E | 1 | 4 float sliders; torus uses iMouse (206 lines) |
| examples/mandelbrot-julia | MV | 2 views | split; `iMouse_<view>`; script `getCrossViewState` + `setOverlay` |
| examples/circumradius-linkage | MV | 2 views | split; common; bool + int uniforms (382 lines) |
| scripted | N | 1 | vec4[] particles via script, colour uniform |
| shadertoys/cloud-shapes | 0 | 1 | 160-line raymarch |
| shadertoys/demofox-pt1 | S | 2 | path tracer: feedback accumulation + image texture on a channel, tabbed |
| shadertoys/demofox-pt2 | S | 2 | same + `"common": "common.glsl"`, fullscreen (541 lines) |
| shadertoys/multi-buffer | S | 4 | A→B→C chain, no feedback |
| starscapes (root), cubics, quadratics | E | 1 | 5-line UV-gradient stubs |
| starscapes/quartics | E | 1 | real 243-line shader |
| template/{simple,buffers,shadertoy,shadertoy-buffers} | N/N/S/S | 1–2 | near-copies of `templates/shaders` |

`demofox-pt2` reads keyboard from `iChannel2` (`bufferA.glsl:441`) but its config binds no `iChannel2`, so that code path is dead.

### Engine features exercised by no demo [RUN: grep over `demos/`]

- **Channel kinds:** cubemap (`type: "cubemap"`), video, keyboard/audio/webcam through an iChannel (only through named `textures`).
- **Config:**
  - `"current": true`
  - standard mode with real iChannel bindings
  - shadertoy mode with custom `uniforms` or a script
  - buffer `wrap`, and `filter: "linear"`
  - BufferD / four buffers
  - `startPaused`, `pixelRatio`, `stats`, `playback`, `author`
  - themes `light`/`system`
  - `uniformsUI: "off"`
- **Uniforms:** scalar `vec4`, `mat4`, `float[]` without `data`; built-ins `iDate`, `iFrameRate`, `iTimeDelta`, `iChannelResolution`.
- **Script API:** `readPixels`, `engine.width`/`height`, `setUniformValue` with a `Float32Array`.
- **Multi-view:** layouts `quad`, `grid`, `inset` (both demos use `split`).
- **Other:** a bare `shaders/x.glsl` file, `textureLod`, and every element (`<shader-canvas>`, `<shader-editor>`, `<shader-sandbox>`). No demo page uses the runtime at all.

### Best golden-image corpus

Choose demos that are deterministic at a fixed (`iTime`, `iFrame`, mouse, size), need no camera/mic/keyboard, and each isolate one engine path:

1. `hello-shader`: preamble and time.
2. `uniforms`: every scalar uniform type at its defaults.
3. `texture`: image decode, flip, filtering.
4. `examples/buffers` (Life): exact integer feedback via texelFetch; a single wrong ping-pong swap changes every pixel. Compare at frame N.
5. `reaction-diffusion`: two coupled float buffers plus common and uniforms; sensitive to float precision and read ordering.
6. `shadertoys/multi-buffer`: the same-frame A→B→C read order, which is exactly the `current` semantics that changed.
7. `examples/multi-buffer` and `common-code`: named-sampler path.
8. `hyperbolic-voronoi-shadertoy`: self-feedback in shadertoy mode.
9. `json-data`: static UBO from data, no script.
10. `ubo-static`: mat3[] std140 padding from a deterministic `setup`.
11. `struct-array`: only if its script is time-driven rather than random; I did not check.
12. `demofox-pt1`: texture on a channel plus accumulation. It may use frame-seeded noise, so fix the frame count.
13. `cloud-shapes`, `starscapes/quartics`, `linkage-levelset-torus`: long analytic single-pass shaders that catch precision and preamble drift.
14. `mandelbrot-julia`: the only multi-view coverage.

Exclude: `audio`, `webcam`, `keyboard`, `touch`, `mouse`, `click-to-place`, `drag-points` (need input injection), and `scripted` plus `templates/shaders/scripted` (use `Math.random()`).

The 29 `old-version` scenes (section 6) are all single-pass, analytic, with no textures or buffers; 17 use iMouse. They would be excellent extra golden images and are the owner's real mathematical content.

---

## 4. CODE_AUDIT.md and FIX_PLAN.md

**Found** (2026-07-15, `CODE_AUDIT.md:12-17`). About 60 items in four clusters:
1. Silently broken documented features:
   - `readPixels` returned zeros (E1).
   - `setArrayElement` was a no-op for vec4/mat4 (E2).
   - `current: true` was inverted (E3).
   - Config `pixelRatio` was ignored (L1).
   - `theme: "auto"` was rejected (L2).
   - Standard-mode iChannel bindings and shadertoy-mode uniforms were dropped (L3/L4).
   - Buffer `filter`/`wrap` were unread (L5).
   - The error overlay showed wrong line numbers (A1).
   - MP4 above 1080p could not work (X1).
2. `exportHTML.ts` was a hand-written second engine with 9 known divergences.
3. Duplicated code that had already diverged (live-app ×3, two galleries, the two panels, TabbedLayout vs EditorPanel).
4. Packaging: a nondeterministic tarball with a baked-in `DEMO_NAME`, unused `puppeteer-core`, vite as a runtime dependency, dead files.

[RUN] I confirmed the packaging finding against the registry tarball: published 0.2.7 ships `dist-lib/project/generatedLoader.js` with `DEMO_NAME = 'demos/examples/inline-controls'`.

**Fixed.** Both documents declare everything complete (`CODE_AUDIT.md:3-8`, `FIX_PLAN.md:3-10`), delivered in five commits on 2026-07-15 (`cf7ac20` to `f428d90`). Spot checks agree: validation, float readPixels, std140 writes, the Transport and OfflineRenderer extractions, exports embedding compiled source (`engine/types.ts` `fragmentSource`), dependency moves, `--force`, and the 102 tests.

**Still open:**

- Declared parked (`DESIGN.md:207-212`): interaction recording, multi-view export, panel CSS merge, `readonly` editor.
- Open but not acknowledged as such [READ]:
  - **FIX_PLAN Stage 0 gate** asked for a headless WebGL smoke test of every demo (`:43`), and **Stage 3** for an export drift test comparing pixels (`:123`). Neither exists. The export tests are string checks only.
  - `tsc` fails on a fresh checkout (section 2).
  - No publint (Stage 1 item 6), no CI.
  - Audit §7 fragilities remain:
    - `step()` still takes positional arguments (`ShaderEngine.ts:371`).
    - Keyboard row 1 ("pressed this frame") is still unused (`glHelpers.ts:281`, `:355`).
    - The cubemap rewrite is still a regex with `[^)]+` (`shaderSource.ts:311`).
    - Every pass still allocates a ping-pong pair (`ShaderEngine.ts:971-972`).
    - `templates/vite.config.js:5` still defaults to `'simple'`.
  - Multi-view ignores `authorTools` (`mount.ts:213-215`) and works only in the dev server (`loadProjectCore.ts` throws on `views`).
  - New latent bug: in named-buffer projects the passes are internally `BufferA…`, and `readPixels` looks up by that name (`ShaderEngine.ts:209-213`). A script calling `readPixels('velocity', …)` gets a warning and zeros. `recompile(pass)` and `<shader-editor pass=…>` have the same naming problem. I did not run this.
  - The README `mount` example and the `handle.app` bug (section 1).

---

## 5. Compatibility audit, 0.2.7 (`0c58c34`) to main

Baseline confirmed [RUN]: the registry tarball for 0.2.7 has a `bin/cli.js` byte-identical to `0c58c34`, and its publish time (2026-04-26 12:27:53Z) is 52 seconds after that commit.

Two things the handoff does not say:
- Commit `3e82ce9` ("fixed mounting", 2026-04-30, a human commit that bumped to 0.2.8) sits between the baseline and the audit commits. It added the `#app` auto-mount.
- The `shader-sandbox-0.2.7.tgz` once committed in git is **not** the registry 0.2.7: its CLI matches `3e82ce9`. If the owner installed that local tarball on his own site, his deployed builds differ from what other users have.

| Row | Verdict | Evidence |
|---|---|---|
| Embeds: `<live-app>` removed; canvas/editor added; sandbox kept | **PARTLY** | The published 0.2.7 runtime registered only `shader-sandbox` (one `customElements.define` in the registry `dist-runtime`). `<live-app>` existed only as the copyable `templates/live-app.js` and an unreachable `dist-lib/live-app.js`. What breaks is `cp node_modules/shader-sandbox/templates/live-app.js`, which the 0.2.7 CLI printed. So "loud for package-loaded live-app" overstates it; nobody could load it from the package entry points. New elements: `src/runtime.ts:798-800`. The `<shader-sandbox>` reserved-attribute set is identical. |
| Config: quoted booleans, bad `pixelRatio`, iChannel mixed with named buffers are errors | **VERIFIED, incomplete** | `configHelpers.ts` diff: `BOOLEAN_KEYS`, the pixelRatio check, the mixed-style error. The same diff adds four more errors (see missed list). |
| Config: `current: true` read stale, now reads latest and rejects impossible orderings; no demo used it | **VERIFIED** | Old engine: `source.current ? currentTexture : previousTexture`; new load-time ordering check in `loadProjectCore.ts`. `grep '"current"' demos templates` is empty. |
| Script: `readPixels` returns `Float32Array` | **VERIFIED** | `ShaderEngine.ts:209`, `types.ts:782`. The old byte read from an RGBA32F target is what the audit calls all-zeros, so no working caller can break. No demo calls it. The "stale Uint8Array comment" in the handoff is already fixed. |
| Script: raw struct-array data packed differently | **VERIFIED** | `UniformManager.ts` diff: previously copied caller-padded std140 straight in; now treats input as tight and packs. No demo passes a `Float32Array`. |
| Library: `App`, `ShaderView`, layouts, `applyTheme` not exported | **VERIFIED, incomplete** | `src/index.ts` diff. Also removed: `MultiViewControls`, `GridLayout`, `createMultiViewLayout`, and types `RecompileResult`, `BaseLayout`, `LayoutOptions`, `RecompileHandler`, `UniformChangeHandler`, `MultiViewLayout`, `MultiViewLayoutOptions`. `MountHandle.recompile` returns `RecompileResult`, which is now unexported. |
| CLI: `shader render` and puppeteer removed | **VERIFIED, overstated** | `render` was a stub that printed "not yet available" and exited; `puppeteer-core` was an optional dependency with no references. Nothing functional was lost. |
| Scaffolds: old `main.ts` runs but lacks `authorTools` | **VERIFIED, plus more** | See below. |

More on the scaffold row:
- `App.ts:175` and the `PlaybackControls` diff show screenshot/record/export buttons appear only with `authorTools`. An old scaffold with `controls: true` gets play/pause/reset only; the `S` key still takes a screenshot.
- Old `main.ts` passes 5 arguments to `loadDemo`, so HTML export of scripted shaders falls back to serialised hooks and loses module-level state.
- Old scaffolds pin `shader-sandbox ^0.2.x`, which never resolves to 0.3 or 1.0. The upgrade is opt-in.

Claims:
- **"Built folders bundle their own engine and are safe": VERIFIED** [RUN for current; READ for 0.2.7, which used the same lib-mode config with no externals].
- **"Unpinned CDN sites get the new version on publish day": VERIFIED by reading, not run.** The 0.2.7 README recommended unpinned esm.sh, unpkg and jsdelivr URLs, and the current `README.md:320` still does. The registry's `latest` tag is 0.2.7. Publishing 1.0 under a non-`latest` dist-tag would avoid this [INF].

### Breaking or behaviour changes the table missed

1. **Built `main.js` auto-mounts into `#app`** (`cli.js:530-535`, from `3e82ce9`). A host page that has an element with id `app` and imports `mount` gets a second mount: into the host's root on a Vue/React page, or twice into the same element on a page that follows the old 0.2.7 `index.html` pattern (`import {mount}; mount(#app)`). [READ]
2. **Viewer chrome lost export/screenshot/record buttons.** In 0.2.7, `controls: true` showed them to everyone. Published pages lose them on rebuild.
3. **Fetch loader throws on any non-404 failure** (`runtime.ts:42-49`); it used to treat every failure as "file absent". Folder embeds probe optional files, so hosts that answer 403 for missing objects (for example a private S3 bucket) now fail where they used to work [INF on the host behaviour].
4. **More config errors:** invalid `uniformsUI`; `buffers`/`textures` in shadertoy mode; buffer options that are not objects; invalid `filter`/`wrap`; impossible or self-referencing `current: true`.
5. **Previously ignored config now takes effect** (silent visual change):
   - `pixelRatio` (`mount.ts:84`).
   - Standard-mode iChannel bindings.
   - Shadertoy-mode `uniforms`.
   - Named-buffer `filter`/`wrap`.
   - Multi-view default theme `light` → `auto`.
6. **Space and R are always active** on a focused shader (`App.ts:272-276`); before, only when playback was enabled.
7. **Realtime "Record Video" removed** (`src/app/Recorder.ts` deleted).
8. **Scripts:** the `frame` argument continues after offline warm-up instead of restarting; struct-array `getUniformValue` now returns real data; `setArrayElement` now works for vec4/mat4. All are fixes, but observable.
9. **Packaging:** `vite` and `vite-plugin-css-injected-by-js` moved to devDependencies; `engines.node >=18` added; `templates/live-app.js` and `templates/package.json` are gone from the tarball. Subpath exports and the `bin` name are unchanged.
10. **CLI:** `create .` refuses to overwrite without `--force`. Bare `.glsl` files no longer get a shadow folder; they rely on the library's fallback in `loadDemo`. A global 0.3 CLI used with a project still on the 0.2.x library would fail on bare files [INF].
11. **Additions** (non-breaking): `MountOptions.authorTools`, `MountHandle.recompile`, type `LayoutMode`.

---

## 6. Branches

The clone is no longer shallow (`git rev-parse --is-shallow-repository` is `false`), so the merge status is exact. This **refutes** the previous reader's "unrelated history, no merge base".

- **`origin/old-version`** (`8ef5c9c`, 2025-11-09) **is an ancestor of main** (`git merge-base --is-ancestor` succeeds). Main's history runs unbroken from 2020 through it. The scenes were deleted in `874efdb` (2025-11-16), when the TypeScript rewrite started.
- It holds 30 scene folders, each `main.js` + `shadertoy.glsl`, on a three.js + lil-gui viewer (`src/ShaderDisplay.js`):
  - Hyperbolic and projective tilings: 237-band, 237-disk, 334-band, 334-disk, 3-inf-tiling, hyperbolic-sdsu, convex-rp-tiling, circle-inversion.
  - Black holes: blackhole-grid, blackhole-rainbow.
  - Moduli spaces: genus-2-moduli, punctured-torus-moduli, ra-hexagon-moduli, ra-pentagon-moduli.
  - Mandelbrot and Newton: mandelbrot, mandelbrot-cartioid, mandelbrot-hexGrid, mandelbrot-julia-animate, mandelbrot-tau, newton-fractal.
  - Nil geometry: nil-checkerboard, nil-euc-interpolate.
  - Orbitals and light: orbitals, orbitals-2, light-intensity-3d.
  - Taylor series and algebra: taylor-center-animate, taylor-center-simple, taylor-convergence, cubic-eqn.
  - test (11 lines).
- **All 29 real scenes are absent from current `demos/`** [RUN]. No names match, and a line-overlap check (lines of 25+ characters) finds at most 1–7 shared boilerplate lines out of 16–246 per scene. None use iChannel, textures or buffers; 17 use iMouse. They range from 44 to 1,035 lines.
- **`origin/hopf`** (`cbfbeea`, 2021) is also an ancestor of main: a single three.js orbital raymarcher.
- **`origin/hypPicture`** has 2 commits not on main (2021-10): one 13 KB hyperbolic hexagon-tiling shader plus two images.
- **`origin/LimitSet`** has 1 commit not on main (2021-09): one 4.7 KB shader.
- **`origin/rebuild`** (`6daf8aa`) is main plus one commit that adds `docs/architecture/` (29 files, 2,768 lines). It is already in the checked-out branch's history.
- **No branch holds design or engine work that is missing from main or `docs/architecture/`.** The only unique content is three old standalone shaders.

---

## 7. Documented contracts in the README that 1.0 must keep or deliberately break

1. **Entry and commands** (`:12-44`): `npx shader-sandbox@latest create`, the bin name `shader`, the nine commands, port 3000, `--force`.
2. **Project layout** (`:48-64`): `shaders/<name>/` with `image.glsl`, `bufferA.glsl`, `common.glsl`, `config.json`, `script.js`; a bare `shaders/foo.glsl`; `main.ts` and `vite.config.js` living in the user's project.
3. **Shader contract** (`:68-90`): `void mainImage(out vec4, in vec2)`; built-ins `iResolution`, `iTime`, `iTimeDelta`, `iFrame`, `iFrameRate`, `iMouse`, `iMousePressed`, `iDate`, and the touch/pinch set.
4. **Named buffers** (`:94-113`): `buffers: {name: {filter, wrap}}`, a matching `<name>.glsl`, self ping-pong, default nearest/clamp, **maximum 4**.
5. **Textures** (`:117-123`): string values only; the special names `keyboard`, `audio`, `webcam`; script textures by name.
6. **Shadertoy mode** (`:127-150`): `mode: "shadertoy"`, capitalised pass keys `Image`/`BufferA..D`, `iChannel0-3`; object forms `{texture, type: "cubemap"}` and `{video}`; `current: true` as an ordering assertion; named and iChannel styles mutually exclusive.
7. **`common.glsl`** prepended to every pass, with error lines reported per file (`:154-155`).
8. **Uniforms** (`:159-197`): the JSON schema (`type`, `value`, `min`, `max`, `step`, `label`, `color`, `hidden`) and its defaults; arrays via `count`; `struct`; `data`; the injected `<name>_count`; array element types float/vec2/vec3/vec4/mat3/mat4.
9. **Script API** (`:201-225`): hooks `setup(engine, {isRestore})`, `onFrame(engine, time, dt, frame)`, `onUniformChange`, `dispose`; the eleven `engine.*` methods; "tight" Float32Array semantics; `readPixels` returning Float32Array; full module semantics inside exported HTML.
10. **Viewer chrome config** (`:229-251`): `title`, `author`, `description`, `layout` (default/fullscreen/split/tabbed), `theme` (auto/light/dark/system), `controls`, `stats`, `playback`, `uniformsUI`, `startPaused`, `stickyMouse`, `pixelRatio`, `common`; keys Space/S/R; CSS variables `--accent-primary`, `--code-bg`, `--pane-radius`, `--pane-shadow`; the dev server always shows the author toolbar.
11. **Capture** (`:259-280`): PNG up to 8K with 2× supersample; MP4 (H.264), WebM (VP9), PNG frames; offline fixed timestep; automatic warm-up.
12. **Build folder** (`:284-313`): `dist/<name>/{main.js, index.html, README.txt}`, zero external dependencies; `main.js` exports `mount(el, opts)` and auto-mounts into `#app`; the handle methods; the Export HTML button.
13. **Elements** (`:317-387`):
    - Unpinned CDN URL `esm.sh/shader-sandbox/runtime/standalone`, and `import 'shader-sandbox/runtime'`.
    - `<shader-canvas>` attributes `src`, `static`, `fullpage`, `lazy`, `start-paused`, `pixel-ratio`, `sticky-mouse`.
    - Four `src` kinds: folder, `.glsl`, inline text, built `main.js`.
    - `<shader-editor for pass theme>` with Ctrl/Cmd+Enter.
    - `<shader-sandbox>` is "unchanged from previous versions", with attribute passthrough and coercion.
14. **Library** (`:391-399`): `mount`, `loadDemo`, the types and type guards are "the supported API"; the handle shape.
15. **Multi-view** (`:403-406`): `views: [...]`, `iMouse_<view>`/`iResolution_<view>`, layouts split/quad/grid/inset, dev server only.
16. **Migration promises already made** (`:410-420`): existing copies of `live-app.js` keep working.

There is also an implicit contract that is documented nowhere: the six-argument `loadDemo(path, glsl, json, images, scripts, rawScripts)` call, which sits in every scaffolded `main.ts` and every `_build-entry.js`. A 1.0 library must either keep that signature or ship a migration for user-owned `main.ts` files.

---

## Housekeeping

- Scratch artefacts are in `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/cli/`:
  - `survey.cjs`: the demo survey script.
  - `vt/demos.test.ts`: the load-every-demo test.
  - `proj/`: the hand-assembled scaffold with built `dist/`. Its `node_modules` links point at the repo, whose `dist-lib` I removed, so rebuild with `npm run build:lib` before reusing it.
  - `npm/reg/package/`: the registry 0.2.7 tarball, extracted.
  - `tgz027/`: the git-committed tarball, extracted.
  - `old/`: the `old-version` scenes, extracted.
- The only network use was `npm ci`, `npm view shader-sandbox` and `npm pack shader-sandbox@0.2.7` against the public registry.
- At 22:27 UTC eleven Python wheel files (matplotlib, numpy and others) appeared untracked in the repo root. None of my commands created them, and they were gone again by the end of my run. Presumably another process was working in the same directory.
- Not done: no WebGL or browser run, so there is no pixel or compile verification of any demo. `shader create` was not run end to end because its `npm install` would request the unpublished `shader-sandbox@^0.3.0`.
