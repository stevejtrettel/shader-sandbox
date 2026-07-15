# shader-sandbox Fix Plan

> **Status (2026-07-15): COMPLETE.** All stages landed, including the items
> once deferred here: the API trim, element split, and README truth pass
> shipped as the 0.3.0 redesign — see `DESIGN.md` (the current reference).
> Still parked (tracked in DESIGN.md "Deliberately out of scope"):
> panel CSS merge, `readonly` editor, multi-view export, and interaction
> recording (capture a live mouse/touch trace, replay it through the
> deterministic OfflineRenderer).
> This file and `CODE_AUDIT.md` are kept as historical records.

Staged remediation of the findings in [CODE_AUDIT.md](CODE_AUDIT.md). IDs (E1, L1, A4, X3, C1, P1, …) reference that document.

**Ordering logic:** hygiene first (shrinks everything after), then the silent-failure bugs (small, independent, each gets a regression test), then recording/export (needs one structural decision), then consolidation of already-diverged duplicates, then the two App.ts extractions that make the codebase safe to extend, and only then the README truth pass (docs are written once, after behavior has settled).

Sizes: **S** = under an hour, **M** = an afternoon, **L** = a day or more.

---

## Decisions needed before/while executing (marked ⚖ in the stages)

Each has a recommendation; none blocks Stage 1.

| # | Decision | Recommendation |
|---|---|---|
| D1 | `controls` default: README says `true`, code does `false` | Keep code's `false` (chrome-free embed is the right default for a package aimed at websites) and fix the README + make Space/S/R registration independent of playback buttons so shortcuts still work |
| D2 | exportHTML strategy: keep patching the 700-line template, or rebuild export on the real runtime | **Rebuild on the runtime** (Stage 3, Option A). Kills the drift class permanently instead of fixing 9 instances of it |
| D3 | Two record buttons ("Record Video" = realtime MediaRecorder, "Record" = offline panel) | Drop the realtime `Recorder` path entirely — the offline panel covers WebM, is deterministic, and one button is simpler |
| D4 | `current: true` buffer flag: fix behavior to match docs, or docs to match behavior | Fix the flag (E3) *and* guard self-reference with a clear error. Default behavior already matches Shadertoy — leave it |
| D5 | Standard-mode `iChannelN` pass configs (L3): implement or reject | Implement — it's documented, and named buffers already build the machinery. If deferring, make validation *reject* the keys loudly |
| D6 | `<live-app>` source of truth: `src/live-app.ts` or `templates/live-app.js` | `src/live-app.ts`; build/copy the template artifact from it (Stage 4) |
| D7 | `create .` conflict handling: refuse, prompt, or backup | Refuse with a list of conflicting files and a `--force` flag |
| D8 | Hidden `render` CLI stub + unused `puppeteer-core` | Delete both; re-add when the feature actually exists |

---

## Stage 0 — Safety net (before touching behavior) — M

The repo has no tests. Don't build a big suite; build just enough to make Stages 1–5 verifiable, and add a regression test with each bug fix from then on.

- Add **vitest** (dev-only; vite is already here). Target: `npm test` runs in seconds.
- Unit-test the pure logic first (no GL needed): `std140.ts` packing, `configHelpers.ts` validation, `shaderSource.ts` assembly/line-mapping, the kebab/coerce attribute parsing.
- Add one **headless smoke test** using a real WebGL2 context if available (Chrome via `vitest --browser` or manual `npm run dev` checklist otherwise): compile-and-step each `demos/examples/*` project one frame. This is the harness Stage 3's export test plugs into.
- Manual test bed: a `demos/examples` checklist in this file's companion (the demos already cover buffers, UBOs, scripting, controls).

**Gate:** CI-able `npm test` green on a fresh clone.

## Stage 1 — Repo & packaging hygiene (no behavior changes) — M

Everything here is deletion or metadata; land as one or two commits.

1. **Untrack cruft** (P6): `git rm --cached shader-sandbox-0.2.7.tgz src/.DS_Store`; add `*.tgz` to `.gitignore`.
2. **Delete dead code** (§5): `src/layouts/UILayout.ts` + `ui.css`, `src/embed.ts`, `src/project/loadProject.ts` (+ drop the tsconfig exclude, P7), `src/uniforms/index.ts`, `templates/package.json`, `VITE_DEMO`, `ShaderEngine.getImageFramebuffer`/`setViewNames`, `glHelpers.createTextureFromImage`, `onAssetError 'framebuffer'` variant + its ShaderView display branch, `StatsPanel.updateResolutionDisplay`, `.control-button.recording` CSS (or wire it up — see D3), stale scaffold comments, dead conditional `shaderSource.ts:251`.
3. **Fix publish determinism** (P1): with `embed.ts` gone, only `main.ts` imports `generatedLoader`. Exclude `main.ts` from the lib build (it's the dev-server entry, not a library entry) so `dist-lib` no longer contains `generatedLoader.js`, `main.js`, `embed.js`, `live-app.js`, `loadProject.js` (P4). Verify: fresh clone → `npm run build:lib` succeeds; `npm pack --dry-run` contains no generated/demo-dependent files.
4. **Dependencies** (P2, P3, D8): remove `puppeteer-core` + the `render` stub; move `vite` and `vite-plugin-css-injected-by-js` to `devDependencies` (the CLI spawns the *user project's* vite; `create` already writes them into generated projects).
5. **Exports map** (P5, L9): fix `types`-first ordering in `"."`, add types for `./runtime/standalone`, and bring `node.ts` to full export parity with `index.ts` (missing `isStructArrayUniform`, `isAnyUBOUniform`, layout re-exports). Add a tiny test that imports the package under Node and asserts the export surface matches.
6. Run **publint** and fix anything else it flags.

**Gate:** fresh-clone `npm run prepublishOnly` succeeds; tarball contents deterministic; publint clean; SSR `import 'shader-sandbox'` works.

## Stage 2 — Silent-failure bug fixes — L (many small independent items)

Each item is small; land each with a regression test. Order within the stage doesn't matter much — grouped by area so they can be parallelized.

### 2a. Config & validation (the "errors, not silent misbehavior" batch)
- Add `'auto'` to `VALID_THEMES` — both sites (L2).
- `mount()`: stop defaulting `pixelRatio` in the destructure; restore the `opts → project → devicePixelRatio` chain (L1).
- Validate `uniformsUI` enum, boolean-typed fields (reject string `"false"`), `pixelRatio > 0` (L7).
- Plumb named-buffer `filter`/`wrap` through `ChannelSource` to texture creation (L5).
- Pass `uniforms`/`textures`/`buffers` through in shadertoy mode (L4).
- ⚖ D5: standard-mode pass-level channel configs — implement or reject loudly (L3).
- Fetch loader: only 404 ⇒ "absent"; other statuses/network errors ⇒ thrown error with the URL (L6).
- Multi-view: clear "multi-view requires the dev server" error outside the Vite loader; run `validateUniforms`; load uniform `data` files; unify theme default to `'auto'` (L8).
- `createLayout`: default case throws `Unknown layout 'x'. Expected: …` (C7).

### 2b. Engine API
- `readPixels`: read `RGBA`/`FLOAT` into a `Float32Array` (return-type change is fine pre-1.0; update README + export template if still alive) (E1).
- `packStd140`: always write into `out` (delete the aliasing fast-path or make callers handle it) — fixes `setArrayElement` for vec4/mat4 (E2). Unit test every type × both call paths.
- Struct-array setters: sync `UniformStore` so `getUniformValue` is truthful (E4).
- ⚖ D4: fix `current: true` to genuinely mean "this frame's output"; throw on `current: true` self-reference (E3).
- `setUniformValue` with `Float32Array` on struct arrays: accept tight data and pack, matching plain arrays (E9).
- Store real `deltaTime` in stats (E7).
- MediaManager: `disposed` flag checked after every await; set `initialized`/`ready` *before* awaits or track in-flight promises; stop tracks acquired post-dispose; clear `srcObject` on dispose (E6).
- Delete vertex shader when fragment compile throws (E8).
- Keep failed passes in `_passes` (program = null, skipped in `step()`) so `recompilePass` can fix them live (E5).

### 2c. App/UI
- ErrorOverlay: single translation point — pass raw error + mapping in, delete the second remap in `parseShaderError`; per-error line stamping instead of the `g`-replace (A1).
- Rename multi-view's `.playback-controls` section class (A2).
- Mouse: move `mouseup` to `window` (or fold into the pointer path with capture) (A3).
- `App.dispose()` re-entry guard; remove ShaderView's context-lost/restored listeners in dispose (A5, A6).
- `MultiViewControls.setPaused()`; call it everywhere `PlaybackControls.setPaused` is called (A7).
- Multi-view paused resize: re-step all views (A10).
- Runtime elements: post-await destroy guards in `<shader-sandbox>` and after `module.mount()` in `<live-app>` (R1, R4); don't resume `static` elements (R2); remount from `_savedGlsl` on reconnect (R3); use the *last* IntersectionObserver entry (R4).
- ⚖ D1: register Space/S/R independent of playback-button visibility; fix README in Stage 6.

### 2d. CLI & editor
- `UniformControls`: clone `def.value`/`initialValues` at `:59` and in `setValue` (C1). One-line class of fix; test that Reset restores config values after dragging.
- `create .`: refuse on conflicting files, list them, `--force` to override (C2, ⚖ D7).
- Bare-`.glsl` dev (C3): copy to a real temp dir (`os.tmpdir()`), watch the source file and re-sync on change (restores live reload), and on startup detect/remove a stale shadow folder from a previous crash.
- Quote the vite binary path in Windows `spawn` calls (C4).
- Editor: insert Tab via `document.execCommand('insertText')` so native undo survives (C5); fix gutter wrap desync — simplest is `white-space: pre` + horizontal scroll on all three layers (C6).
- Escape config strings in the dev gallery (one-line fix now; full gallery unification in Stage 4) (C8).
- Signal handler in `buildShader` to clean up `_build-entry.js` (P8).

**Gate:** every audit item in §1 of CODE_AUDIT.md either fixed with a test or explicitly deferred with a reason.

## Stage 3 — Recording & export — L

### 3a. Recording fixes (independent of D2)
- Codec: derive the H.264 level from resolution (or query `VideoEncoder.isConfigureSupported` and fall back), enforce even dimensions (X1).
- Backpressure: await when `encodeQueueSize` exceeds a small bound (X2).
- Restore `startTime`/`pausedElapsedTime` after offline renders — or better, absorb into the Stage 5 clock (X3).
- Continue script `frame` numbering after warmup (X4); skip warmup when no buffer passes (X5); show the warmup notice whenever warmup will run, recomputed on FPS change.
- `isTypeSupported` with the exact codec string (X6).
- Null `cancelRenderFn` on completion; block starting a render while one is unwinding (X7); confirm-or-ignore backdrop click during active render (X8).
- Panels owned by App: track open panel, close on `dispose()` (A9). Suspend ShaderView's ResizeObserver during offline renders (A8).
- ⚖ D3: remove the realtime `Recorder` path and its button, or clearly re-label both buttons.

### 3b. Export strategy ⚖ D2
- **Option A (recommended):** rebuild `exportHTML` to embed the real runtime — inline the built `dist-runtime/shader-sandbox.js` plus the project serialized as JSON (sources, config, current uniform values) into one HTML file. Deletes the ~700-line template; every §2 drift item (standard-mode failure, int uniforms, touch, UBO counts, cubemap, keyboard channel, `current`, std140-in-scripts) disappears structurally. Media textures stay stubbed as documented.
- **Option B (fallback):** fix the 9 enumerated divergences in place.
- **Either way:** add an export drift test to the Stage 0 harness — export each demo, load it headless, assert shaders compile and frame 1's pixels match the live engine within tolerance.

**Gate:** export of every demo compiles and matches live rendering; 4K MP4 recording configures successfully (or fails with a clear message before rendering starts).

## Stage 4 — Consolidation of duplicates — L

Do this *after* Stage 2/3 so fixes don't have to land in two copies.

- **`<live-app>` single source** (⚖ D6): keep `src/live-app.ts`, emit `templates/live-app.js` from it in the build (or have the CLI copy the built artifact). Delete the hand-written copy.
- **TabbedLayout consumes EditorPanel** — delete the ~150 reimplemented lines; keep TabbedLayout's tab-guard behavior (it's the correct one).
- **RecordingPanel/ScreenshotPanel**: extract the shared form kit (resolution section, presets, aspect lock, collapsible sections, number inputs, progress bar) and merge the two CSS files into one prefixed sheet. If Stage 3 went well this is mechanical.
- **One gallery generator** used by both the dev template and `build-gallery`.
- **Merge DefaultLayout/FullscreenLayout** (byte-identical bodies) into one class with a flag.
- **Helper sweep**: single `escapeHTML`, timestamp-filename, `joinPath`/`baseName`, script-hook plucking, kebab/coerce/RESERVED, pass-order constant, FBO attach/restore helper, `runSetup(isRestore)` in App, "did you mean" in cli.js, `getCoords` in InputManager, shared GLSL declaration block in shaderSource.
- **Lifecycle naming**: pick `dispose()` everywhere; `mount()` removes `data-theme`/`unstyled` and any attributes it set on the host (K6).

**Gate:** `npm test` green; demos checklist passes; net LOC meaningfully down (expect −1,500 or more).

## Stage 5 — Architectural prep for extension — L

The two extractions that turn App.ts from a 1,030-line god object into something safe to build on. Do these *last* among code changes — Stages 2–4 shrink what has to move.

1. **Transport/clock object** owning `startTime` / `pausedElapsedTime` / `isPaused` / `getCurrentTime()`. Fixes A4 by construction and removes the 6-site duplication; PlaybackControls, panels, recording, and resize all consume it.
2. **OfflineRenderer** — extract `stepForRender`, `handleRecording`, the three `render*Frames` loops, and the ScreenshotPanel offline callbacks (~300 lines) behind `{view, runSetup, runOnFrame}`.
3. **Public API decision**: trim `index.ts` to the surface you intend to support (likely `mount` + handle types + `loadDemo`; App/ShaderView/layouts become internal or explicitly "advanced"). Everything exported today is an implicit compatibility promise — decide before extending. This also sets up the planned `<shader-canvas>`/`<shader-editor>` split.
4. **Fragility hardening** (as these files get touched anyway): `step()` takes an options object; engine stops mutating the caller's `project` on recompile (clone or own the sources); document or replace the cubemap regex rewrite; consider lazy ping-pong allocation (skip the second texture for passes never read as feedback).

**Gate:** App.ts well under 700 lines; no behavior change (tests + demo checklist identical before/after).

## Stage 6 — README & docs truth pass — M

Last, once behavior is final. Work straight down the drift table in CODE_AUDIT.md §6:

- `controls` default and shortcut behavior per D1; the `controls`/`stats`/`playback`/`uniformsUI` split documented honestly.
- Remove/replace: ZIP claim, per-shader `live-app.js` in the build tree, "Warmup frames" option, "Loading shader..." text, texture object-form and video/script rows in the standard-mode table (or document what Stage 2 implemented).
- Add: missing mount options (`stats`, `playback`, `uniformsUI`, `stickyMouse`), missing config keys (`author`, `mode`, `views`, …), multi-view layouts, the recording button(s) as they exist after D3.
- Fix the `shader build` success message to reference the actual output path.
- Re-verify every code sample in the README against a demo (several are load-bearing for beginners).

**Gate:** each README claim traceable to working code; ideally a doc-check pass re-run of the audit's §6 table.

---

## Suggested sequencing summary

| Stage | Theme | Size | Depends on |
|---|---|---|---|
| 0 | Test harness | M | — |
| 1 | Hygiene & packaging | M | — (parallel with 0) |
| 2 | Silent-failure fixes | L | 0 (tests land with fixes) |
| 3 | Recording & export | L | 0; D2/D3 decided |
| 4 | Dedup | L | 2, 3 |
| 5 | App.ts extractions + API trim | L | 4 |
| 6 | README truth pass | M | everything |

Stages 0+1 are a natural first PR (pure wins, zero risk). Stage 2 can be split into 4 small PRs (2a–2d). Each stage leaves the repo shippable — you can publish a patch release after any of them.
