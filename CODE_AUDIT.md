# shader-sandbox Code Audit — 2026-07-15

> **Resolution note (same day):** every finding below was fixed, consciously
> deferred, or made obsolete by the 0.3.0 redesign (`DESIGN.md`). The
> `exportHTML` drift class was eliminated structurally (exports embed the
> engine's compiled sources); `live-app`, the realtime Recorder, and the
> dead files are gone. Kept as a historical record — file:line references
> describe the pre-fix code.

Five parallel deep reviews (engine, app/UI, recording/export, loaders/entry-points, CLI/layouts/uniforms) covering all ~16k lines of source. Every finding below carries a file:line reference and was verified against the actual code; the highest-impact items were independently re-confirmed. Findings are grouped by theme, deduplicated across reviewers, and ordered by severity within each section.

**Overall assessment:** The architecture is fundamentally sound — the FileLoader/loadProjectCore split, the App/ShaderView division, the MediaManager/UniformManager extraction from ShaderEngine, and std140 packing are all clean and correct. GL resource disposal, blob URL hygiene, and listener cleanup are mostly disciplined. The debt clusters in four places:

1. **Silently-broken API paths** — documented features that fail without any error (the exact opposite of the project's "simple and user-friendly" goal).
2. **`exportHTML.ts`** — a hand-maintained re-implementation of the engine that has already drifted in 8+ concrete ways.
3. **Triplicated/duplicated code** that has *already* diverged (live-app ×3, TabbedLayout vs EditorPanel, RecordingPanel vs ScreenshotPanel, dev gallery vs CLI gallery).
4. **Packaging** — the published artifact is nondeterministic and ships dead files and an unused dependency.

---

## 1. Broken features (documented, silently fail today)

### Engine

- **E1 — `readPixels` returns all zeros.** `ShaderEngine.readPixels` (src/engine/ShaderEngine.ts:209-229) reads `RGBA`/`UNSIGNED_BYTE` from an RGBA32F framebuffer (glHelpers.ts:157-167). WebGL2 only guarantees `RGBA`/`FLOAT` for float color buffers → `INVALID_OPERATION`, buffer untouched. Documented script API (README ~420). Same bug replicated in exportHTML.ts:531.
- **E2 — `setArrayElement` is a no-op for `vec4[]`/`mat4[]`.** UniformManager.ts:306 discards `packStd140`'s return value; the fast path (std140.ts:83-85) returns without writing to `out` exactly when tight size == stride (vec4, mat4). Store updates, GPU re-uploads stale data. Documented API.
- **E3 — `current: true` buffer-channel semantics inverted.** `step()` swaps ping-pong right after each pass (ShaderEngine.ts:416-419), so for buffers already run this frame, default reads *this* frame and `current: true` reads *last* frame — backwards vs the documented contract (project/types.ts:216-220). `current: true` self-reference binds the FBO-attached texture → sampling feedback loop, draw fails.
- **E4 — Struct-array setters never update UniformStore.** `setStructArrayUniform/Element` (UniformManager.ts:322-407) pack into `paddedData` without `_store.setRaw` — `getUniformValue` returns initial zeros forever.
- **E5 — A pass that fails to compile at load can never be fixed by live editing.** Failed passes never enter `_passes` (ShaderEngine.ts:901-927); `recompilePass` then reports "Pass not found" (ShaderEngine.ts:541-543). Requires full reload — opposite of live-edit intent.
- **E6 — MediaManager stream leaks.** No disposed flag: `dispose()` during pending `getUserMedia` leaves camera/mic running (MediaManager.ts:216-233); guard flags set only after awaits (MediaManager.ts:123, 151) so overlapping inits each acquire a stream and one leaks. Same in `initVideo` (157-180).
- **E7 — `EngineStats.deltaTime` always 0** (ShaderEngine.ts:369-370 vs 244). Nothing reads `engine.stats` — dead *and* broken.
- **E8 — Vertex shader object leaked per failed compile** during live editing (glHelpers.ts:49-50: fragment-compile throw skips vertex-shader delete).
- **E9 — `setUniformValue(name, Float32Array)` semantics differ by array kind**: plain arrays take tight data and pack (UniformManager.ts:153-184); struct arrays expect caller-padded std140 (UniformManager.ts:198). README doesn't distinguish — struct-array users following it corrupt their buffer.

### Config / loading

- **L1 — config.json `pixelRatio` silently ignored everywhere.** mount.ts:72 destructures `pixelRatio = window.devicePixelRatio`, so `opts.pixelRatio` is always defined and App's fallback chain (App.ts:98) never reaches `project.pixelRatio`. Every consumer path goes through `mount()`.
- **L2 — `"theme": "auto"` (the documented default) is rejected.** `VALID_THEMES` omits `'auto'` (configHelpers.ts:114) while `DEFAULT_THEME = 'auto'` (configHelpers.ts:79). Writing the default explicitly throws. Also at configHelpers.ts:253.
- **L3 — Standard-mode pass-level configs accepted, then ignored.** `validateConfig` whitelists `Image`/`BufferA` keys (configHelpers.ts:120) but `loadStandardProject` (loadProjectCore.ts:544-598) never reads them. `"Image": { "iChannel0": "photo.jpg" }` → no channels bound, no warning. Contradicts README:991 and types.ts:402-404.
- **L4 — Shadertoy-mode `uniforms`/`buffers`/`textures` silently dropped.** Whitelisted (configHelpers.ts:116-122) but `loadShadertoyProject` never passes them through (loadProjectCore.ts:518-537).
- **L5 — Named-buffer `filter`/`wrap` never read.** Documented (README:104-113, types.ts:395-398); `loadStandardWithNamedBuffers` uses only `Object.keys` (loadProjectCore.ts:617-628).
- **L6 — Fetch loader treats any HTTP failure as "file absent"** (runtime.ts:39-43). A 500/CORS error on config.json silently degrades a multi-pass project to single-pass.
- **L7 — `uniformsUI`, booleans, `pixelRatio` unvalidated.** Unknown `uniformsUI` value behaves as `'inline'` (App.ts:156-158); string `"false"` for `controls` is truthy; `pixelRatio: 0`/negative accepted.
- **L8 — Multi-view unsupported outside the Vite loader, with a misleading error** (only loaderHelper.ts:150-152 checks; loadProjectCore.ts:376-386 doesn't). Multi-view loader also skips `validateUniforms`, ignores uniform `data` files, and defaults theme to `'light'` (loaderHelper.ts:247, 256-257).
- **L9 — Node/SSR export-surface drift.** package.json maps `.` under `node` to node.js, but node.ts:83-93 is missing `isStructArrayUniform`, `isAnyUBOUniform`, and other re-exports present in index.ts → SyntaxError on SSR import. This is the failure node.ts exists to prevent.

### Runtime elements

- **R1 — `<shader-sandbox>` destroy-during-load leaks a WebGL context + rAF loop.** `_mountShader` (runtime.ts:448-477) has no post-await guard; removal during fetch mounts into the detached element and nothing destroys it.
- **R2 — `static` figures un-pause after scroll-away/scroll-back** (runtime.ts:369-371 resumes unconditionally; static sets startPaused at 397-400).
- **R3 — Inline-GLSL element dies if re-parented** (textContent cleared at first connect, runtime.ts:328/338; `_savedGlsl` only used by the retry button).
- **R4 — IntersectionObserver reads `entries[0]` (oldest batched entry)** in runtime.ts:366 and live-app.ts:99 — should read the last. Also live-app.ts:159 guards after module import but not after `await module.mount(...)`.

### App / UI

- **A1 — Compile-error overlay shows wrong (often negative) line numbers.** Engine pre-translates (ShaderEngine.ts:944-949); `ErrorOverlay.parseShaderError` translates *again* (ErrorOverlay.ts:60, 144-148). common.glsl errors show negative lines; the `g`-flagged replace stamps every error with the first error's line. Code-context highlight and text disagree. Core-UX bug for a shader tool.
- **A2 — `.playback-controls` CSS class collision.** app.css:116-121 vs multi-view-controls.css:149-153, both always bundled — multi-view panel section gets `position:absolute; z-index:1000`; single-view controls get stray padding.
- **A3 — Mouse released outside canvas leaves `iMouse.z` stuck positive.** Mouse listeners canvas-only, no pointer capture (InputManager.ts:170-172); touch path does it right (206).
- **A4 — `getCurrentTime()` ignores pause** (App.ts:605-607) — screenshot default time drifts from the frozen frame. Root cause: pause bookkeeping duplicated across 5 call sites (App.ts:188-190, 532-542, 715-729, 764, 809).
- **A5 — `ShaderView.dispose()` re-adds its own context-lost overlay** (context-lost listener never removed; ShaderView.ts:256-264, 288-302). Masked by mount()'s teardown order; bites direct App/ShaderView consumers.
- **A6 — Double-dispose throws** (`App.dispose()` no re-entry guard, App.ts:1011; ShaderView.ts:265 `removeChild` throws).
- **A7 — MultiViewControls play/pause icon goes stale** (only updated in its own click handler, MultiViewControls.ts:110-114; needs `setPaused()` like PlaybackControls).
- **A8 — Offline render races the ResizeObserver** (App.ts:658-660/766-768 resize canvas directly; ShaderView.ts:132-144 snaps it back and resets the engine mid-render).
- **A9 — Screenshot/Recording panels unowned by App** (App.ts:617, 739) — dispose can't close them; callbacks can drive a disposed engine.
- **A10 — Multi-view paused resize leaves canvases black** (App.ts:169-171 doesn't re-step; per-view ResizeObserver resets buffers, ShaderView.ts:140-141).

### Recording / export (see also §2)

- **X1 — MP4 at 4K/8K cannot work**: hardcoded `avc1.640028` (H.264 Level 4.0, max ~2.1 Mpx) in Mp4Encoder.ts:74 vs presets up to 8K (RecordingPanel.ts:16-22). No even-dimension enforcement either.
- **X2 — No encoder backpressure** (Mp4Encoder.ts:87-102 never checks `encodeQueueSize`) — unbounded VideoFrame pileup at high res.
- **X3 — Live clock desyncs after recording** (App.ts:801-809 `finally` never adjusts `startTime`; iTime jumps by wall-clock render duration; buffers wiped while playing).
- **X4 — Script `frame` counter diverges from `iFrame` after warmup** (warmup steps 0..W-1 at App.ts:778-780, then loop restarts scripts at 0 while engine iFrame keeps counting).
- **X5 — Warmup runs for shaders with no buffers** (App.ts:776-786, no `hasBufferPasses()` check; startTime 30 @ 60fps = 1800 wasted frames, and the panel notice is hidden for non-buffer shaders).
- **X6 — Recorder support-check mismatch**: checks `video/webm` but constructs `video/webm;codecs=vp9` (Recorder.ts:41 vs 56).
- **X7 — Cancel/restart race**: `cancelRender` restores the form immediately; the cancelled run's `finally` later stomps a newly-started render (RecordingPanel.ts:536-543).
- **X8 — Backdrop click during active render silently cancels it** (RecordingPanel.ts:109-111).

### CLI / editor / uniforms

- **C1 — Dragging a vec3/vec4 slider corrupts the config default.** UniformControls.ts:59 stores `def.value` by reference; onInput mutates in place (568-570; also 494-498, 516-518 in color pickers); `setValue` re-aliases (642). Reset restores the dragged value; caller-owned `initialValues` arrays mutated too. UniformStore clones correctly (UniformStore.ts:47-50) — UniformControls never does.
- **C2 — `shader create .` silently overwrites existing `index.html`/`main.ts`/`vite.config.js`** (bin/cli.js:163-167 only checks for `shaders/`; copyDir at 72-89 overwrites). README:14-19 advertises this flow for existing folders.
- **C3 — Bare-`.glsl` dev: no live reload, and crash leaves a shadowing folder.** `resolveShaderPath` (cli.js:377-387) copies to `shaders/foo/image.glsl` in the user's project; edits to the bare file do nothing; after a crash the folder persists and permanently shadows the file (cli.js:373-375 returns `cleanup: null`).
- **C4 — Windows paths with spaces break dev/build** (unquoted vite bin through `shell: true`, cli.js:471-476, 542-547).
- **C5 — Tab key destroys the editor's undo stack** (programmatic `textarea.value` assignment, prism-editor.ts:99-100; no custom undo to compensate).
- **C6 — Line-number gutter desyncs on wrapped lines** (`pre-wrap` at prism-editor.css:52 vs one span per logical line at prism-editor.ts:74-75).
- **C7 — Invalid `layout` mount option crashes with "Cannot read properties of undefined"** (`createLayout` has no default case, layouts/index.ts:54-63; mount.ts:76 casts unchecked; custom elements pass arbitrary strings).
- **C8 — Dev gallery injects unescaped config strings into innerHTML** (templates/main.ts:180-184) while the CLI gallery escapes correctly (cli.js:837-841) — same ~70 lines maintained twice, already diverged.

---

## 2. exportHTML.ts drift (hand-maintained engine re-implementation)

The exported standalone HTML re-implements the engine in a template string and has drifted:

- **Standard-mode (named-sampler) exports fail to compile** — always emits the Shadertoy iChannel preamble (exportHTML.ts:199-215), never reads `pass.namedSamplers` or project mode. No guard, no warning (only multi-view is guarded, App.ts:822-825).
- **`int` uniforms dead in exports** — declared `int` but set via `gl.uniform1f` (exportHTML.ts:110-113 vs 642-644) → `INVALID_OPERATION`, stays 0.
- **Touch uniforms missing** from the export preamble (engine declares them in both modes, shaderSource.ts:148-156/199-206) → export-only compile failure.
- **UBO `_count` baked as capacity, not active count** (ShaderEngine.ts:292 → exportHTML.ts:648-651) — loops iterate zero-filled tails.
- **Cubemap preprocessing not applied** (engine rewrites via shaderSource.ts:300-321; export embeds raw source) — garbage sampling.
- **Keyboard helpers hardcode iChannel0** (exportHTML.ts:175-176) and KEY_* constants injected when the engine wouldn't → collisions.
- **`current: true` channels ignored** (flattened at exportHTML.ts:67; always binds previousTexture at 667-670).
- **Script `setUniformValue` skips std140 packing** (exportHTML.ts:505-515) — exported scripts corrupt float/vec2/vec3/mat3 UBOs.
- Plus the readPixels byte-read bug replicated (exportHTML.ts:531).

**Structural takeaway:** every engine change must currently be mirrored by hand into a 700-line template string. Before extending the engine, either generate the export from the same source (bundle the real runtime) or add a drift test that compiles an exported file headlessly.

---

## 3. Duplication that has already diverged

- **`<live-app>` ×3**: src/live-app.ts (compiled but not exported), templates/live-app.js (the copy the CLI tells users to use, cli.js:723), and the README documents behavior of both. Already drifted in structure/messages. Pick one source of truth.
- **TabbedLayout reimplements EditorPanel** (~150 lines: TabbedLayout.ts:78-101/155-226/241-285 vs EditorPanel.ts:66-99/265-336/128-174). Already drifted: Ctrl+Enter tab-guard exists only in TabbedLayout. SplitLayout already consumes EditorPanel — TabbedLayout should too.
- **RecordingPanel vs ScreenshotPanel ~60% copy-paste** (presets, resolution section incl. identical SVG, aspect-lock, collapsible-section/number-input helpers, progress bar; CSS ~85% identical modulo prefix). Extract a shared panel base or form-section helpers.
- **Dev gallery vs CLI gallery** (templates/main.ts vs cli.js:830-850) — diverged on HTML escaping (C8).
- **DefaultLayout ≡ FullscreenLayout** byte-identical except class name/CSS import.
- Smaller: `escapeHTML` ×2 (ErrorOverlay.ts:203, RuntimeErrorOverlay.ts:146); timestamp-filename ×3 (Recorder.ts:74-92, ScreenshotPanel.ts:492-508, App.ts:563-590); `joinPath`/`baseName`, script-hook plucking, kebab/coerce/RESERVED across runtime.ts/loaderHelper.ts/live-app ×2; `setup(isRestore)` boilerplate ×7 in App.ts with 3 error-handling styles; pass-order array ×3 in ShaderEngine; standard/shadertoy GLSL declaration blocks duplicated in shaderSource.ts; FBO attach/restore dance ×4 in ShaderEngine; getCoords ×2 in InputManager; "Did you mean" ×2 in cli.js.

---

## 4. Packaging & publish

- **P1 — Published output is nondeterministic; fresh clone can't publish.** build-lib.cjs:40 "excludes" generatedLoader.ts, but main.ts:18 and embed.ts:11 import it, so tsc compiles and ships it — confirmed in the 0.2.7 tarball with `DEMO_NAME = 'demos/examples/inline-controls'` baked in. Fresh clone → the gitignored file doesn't exist → `prepublishOnly` fails.
- **P2 — `puppeteer-core` is unused** (zero references; the `render` command is a hidden "not yet available" stub, cli.js:851-861). Every install downloads it. Remove.
- **P3 — `vite` + `vite-plugin-css-injected-by-js` shouldn't be runtime deps** — cli.js spawns the *user project's* vite (cli.js:343-349) and `create` writes them into the generated project. As deps of shader-sandbox they inflate installs for runtime/library consumers. Move to devDependencies.
- **P4 — dist-lib ships unreachable files**: main.js, embed.js, live-app.js, loadProject.js — none in the exports map.
- **P5 — Exports map nits**: `types` condition listed after `node`/`import` in `.` (publint flags this); `./runtime/standalone` has no types.
- **P6 — Tracked cruft**: `shader-sandbox-0.2.7.tgz` and `src/.DS_Store` are committed. `*.tgz` and existing .DS_Store should be removed and ignored.
- **P7 — tsconfig excludes src/project/loadProject.ts from typechecking** (tsconfig.json:32) — see dead code below; either delete the file or bring it back under the checker.
- **P8 — `_build-entry.js` left in user's project on interrupted build** (no signal handler in buildShader, cli.js:457-489).

---

## 5. Dead code

- `src/layouts/UILayout.ts` (189 lines) + `ui.css` — not exported, not in LayoutMode, imported by nothing.
- `src/project/loadProject.ts` — Node FileLoader, imported nowhere (not even bin/cli.js), excluded from typecheck.
- `src/embed.ts` — legacy entry, referenced by no build config; its import is what drags generatedLoader into the lib build (P1).
- `src/uniforms/index.ts` barrel — no importers.
- `templates/package.json` — skipped by `create` (cli.js:217), stale (`^0.1.0`).
- `VITE_DEMO` env var — set (dev-demo.cjs:79), never read.
- `ShaderEngine.getImageFramebuffer`, `setViewNames` (unusable by design — compilation happens in the constructor), `glHelpers.createTextureFromImage` (reimplemented inline with divergent mipmap behavior at ShaderEngine.ts:816-878).
- `onAssetError` `'framebuffer'` variant never emitted (display code at ShaderView.ts:314-318 unreachable).
- `StatsPanel.updateResolutionDisplay` is a no-op (unreachable branch).
- `.control-button.recording` CSS (app.css:483-494) — no code adds the class; record button gives zero active-state feedback.
- Stale scaffold comments claiming stubs where implementations are complete (ShaderEngine.ts:139-141, 809-814; engine/types.ts:128-131); dead conditional shaderSource.ts:251; stale "2x3 grid" comment app.css:154.

---

## 6. README drift (all verified)

| README says | Code does |
|---|---|
| `controls` defaults to `true` (:493) | Defaults to false — no chrome (App.ts:154-155); README:481 prose agrees with code |
| `controls: false` suppresses *all* overlay UI (:481) | `uniformsUI` is independent; uniforms panel still shows (App.ts:156-158) |
| Space/S/R always work (:473-477) | Space/R only when playback enabled — off by default (App.ts:265-268) |
| Texture object form / cubemap / video / script in standard `textures` (:140-168) | `textures` is `Record<string,string>`; object values throw (configHelpers.ts:190-193); cubemaps are shadertoy-channel-only |
| Channel bindings usable in standard mode (:991) | Silently ignored (L3) |
| Build outputs `live-app.js` per shader (:558-563) | Only main.js + index.html (cli.js:491-514); success message points at a third, personal-site path convention (cli.js:723-725) |
| PNG frames download as ZIP (:~530) | Directory picker, or *one browser download per frame* fallback (App.ts:838-866) |
| "the record button" opens the offline panel (:~524) | Two near-identical buttons: "Record Video" = undocumented realtime MediaRecorder path; "Record" = offline panel (PlaybackControls.ts:79-110) |
| "Warmup frames" is a recording option (:~537) | Implicit from Start Time; applies to all shaders (X5) |
| Mount-options table (:624-639) | Missing `stats`, `playback`, `uniformsUI`, `stickyMouse` (mount.ts:38-48) |
| Config table (:487-496) | Missing `author`, `stats`, `playback`, `uniformsUI`, `stickyMouse`, `mode`, `views` |
| "Loading shader..." text (:827) | Textless shimmer (runtime.ts:198-222) |
| `<shader-sandbox>` layout limited to fullscreen/default (:801) | `split` works — README's own example uses it (:696) |
| Multi-view layouts (grid/inset/quad) | Reachable and shipped, undocumented except the script-extension table |

---

## 7. Architecture notes for the extension phase

- **App.ts (1030 lines) holds five jobs.** Worth splitting before extending: (a) offline rendering (~300 lines, App.ts:613-965) — needs only `{view, runSetup, runOnFrame}`; (b) a transport/clock object owning `startTime`/`pausedElapsedTime`/`isPaused` — currently written from 6 sites and already caused A4/X3.
- **Public surface is broad for a "deliberately simple" package**: index.ts exports App, ShaderView, MultiViewControls, GridLayout, createLayout, applyTheme, loadDemo… Decide what's actually public before extending; everything exported is a compatibility promise.
- **Entry-point sprawl**: index/node/runtime/mount are justified; main.ts (dev-only), embed.ts (dead), live-app.ts (superseded by templates copy) are not. Collapsing these fixes P1/P4/K3 at once.
- **Lifecycle naming split**: layouts use `dispose()`, uniforms/editor use `destroy()`; layouts wipe the host element's innerHTML and mount() never removes `data-theme`/`unstyled` it set (mount.ts:87-92).
- **Fragile by design, watch when extending**: cubemap regex rewrite (shaderSource.ts:312) breaks on `texture(ch, f(x) + v)` and ignores textureLod/named samplers; error-line mapping depends on exact marker comment strings (shaderSource.ts:281-289); engine mutates the caller's `readonly project` on recompile (ShaderEngine.ts:566, 593); `bindImageForRead`/`unbind` must-pair protocol (one correct usage site); ping-pong pair allocated for every pass unconditionally (~32 bytes/pixel/pass, ShaderEngine.ts:908-910); keyboard row 1 (Shadertoy "pressed this frame") always zero (glHelpers.ts:342); `step()` five positional args.
- **Nits held for cleanup passes**: keyboard texture re-uploaded every frame (glHelpers.ts:328-350); silent truncation in flat-array path vs warning in nested path (UniformManager.ts:243-257); Prism uses the C++ grammar instead of prism-glsl (prism-editor.ts:9-10, 54); vec2 pad scrolls the page on mobile (UniformControls.ts:367-372); `formatNumber` breaks on exponential steps (UniformControls.ts:605-610); tab-switch and remount races in EditorPanel/live-app (tiny windows); `createImageBitmap` detour per frame in Mp4Encoder (90-91); stale warmup notice when FPS changes (RecordingPanel.ts:212-239); `create()` async-without-await (cli.js:141); templates/vite.config.js defaults SHADER_NAME to 'simple'.

**Verified clean (checked, no issues found):** std140 layout math including mat3 column padding and struct strides; GL resource disposal; blob-URL create/revoke pairing; InputManager/UniformControls listener cleanup; rAF cancellation; context-loss rebuild flow; keyboard-shortcut scoping to the focused shader; CLI shader-name validation before interpolation; gallery HTML escaping (CLI side); uniform slider defaults vs README table; iDate month semantics live-vs-export.
