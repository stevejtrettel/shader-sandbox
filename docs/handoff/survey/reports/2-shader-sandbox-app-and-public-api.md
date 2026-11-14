# shader-sandbox 0.3.0 — APP layer and public API study (read-only)

All paths are relative to `/home/user/shader-sandbox/`. Nothing in the repo or in `/home/user/webgl-demos` was touched. Experiments ran on a copy in `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/app/` (probe tests are `tests/zz_probe.test.ts` and `tests/zz_probe2.test.ts` there).

Evidence tags: **[R]** verified by reading, **[X]** verified by running, **[I]** inferred.

**Headline:** the RUNTIME.md "what survives" table is too generous for the app layer. Transport survives as a 70-line pause/resume wall clock, but it is not a deterministic clock. OfflineRenderer has three determinism bugs and no tiling, so "Survives; drives the new executor" is not earned. Only the ideas in Mp4Encoder and InputManager are worth carrying.

---

## 1. Frame loop

- **rAF owner:** `App.animate` (`src/app/App.ts:501-538`), one loop per mounted App. It is started by `App.start()` (`:435-442`), which also zeroes the clock.
- **Time:** `transport.elapsed()` (`App.ts:516`), i.e. `performance.now()/1000 − startTime` (`src/app/Transport.ts:18,27-29`). The rAF timestamp is used only for the FPS counter (`App.ts:515,518`).
- **dt / iFrame:** the engine computes these itself. `iTimeDelta = t − _lastStepTime`, `iFrame = _frame++` (`src/engine/ShaderEngine.ts:381-383,403,441`). `iDate` is `new Date()` on every step (`:388`).
- **Pause:** `transport.toggle()` (`App.ts:544-546`). rAF keeps spinning and returns early (`:506`). `startPaused` renders one frame, then `forcePaused` (`:533-537`).
- **Reset:** `App.reset()` zeroes the transport and calls `engine.reset()` on each view (`App.ts:571-578`). It does not re-run script `setup`, so script state survives a reset. [R]
- **Scrub:** there is no live scrub. `MountHandle` has no seek (`src/mount.ts:58-72`) and Transport has only `restore()`. The only scrubbing is the screenshot panel preview (`App.ts:629-637`).
- **Resize resets time in single-view:** the ResizeObserver resets the engine after a 150 ms debounce (`src/app/ShaderView.ts:130-142`), then App resets the transport (`App.ts:210-217`). Multi-view resets the engines but not the clock (`App.ts:192-201`). [R]
- **Visibility, two uncoordinated mechanisms:**
  - App's IntersectionObserver (threshold 0.1) skips frames while the clock keeps running, so time jumps on return (`App.ts:246-252,506`).
  - The custom element's observer (rootMargin 200px) calls `handle.pause()/resume()`, which freezes the clock (`src/runtime.ts:496-515`).
  - There is no `visibilitychange` handling (grep is empty), so a hidden tab produces a time jump and a huge `iTimeDelta`. [R]
  - The element's resume-on-scroll-in is unconditional unless `static` (`runtime.ts:505-507`), so it overrides a user's manual pause and `start-paused`. [I]
- **"Deterministic clock via Transport" overstates it.** Transport is a pause/resume/restore wall-clock stopwatch with an injectable clock for tests (`Transport.ts:18`). The offline path does not use it as a clock at all: it computes `startTime + frame/fps` itself (`src/app/OfflineRenderer.ts:52-57`) and uses Transport only to pause, save and restore live time (`:166-169,227-228`). [R]
- **Scripts:**
  - `setup(api, {isRestore})` runs at construction (`App.ts:255-258,557-565`), on context restore (`:207,219-223`), and around every offline render.
  - `onFrame(api, time, deltaTime, frame)` runs before the view step (`App.ts:520`, `:372-390`). `deltaTime` is the script's own delta (`:376`), not the engine's. `frame` is `statsPanel?.totalFrameCount ?? 0`.
  - `onUniformChange` fires for non-script writes (`App.ts:411-423`). `dispose()` is called at `:734-737`.
  - Live errors are capped at 10, then the hook is disabled (`:374-388`). Offline errors are swallowed silently (`:154`).
- **API scope:** the script API (`App.ts:318-365`) has no access to the canvas, mouse, keyboard or transport. Reads (`getUniformValue`, `readPixels`, `updateTexture`) go to the primary view only; writes fan out to all views.

## 2. Capture and export

- **Quick still (S key):** `canvas.toBlob` at the current size (`App.ts:585-597`). It relies on `preserveDrawingBuffer: true` (`ShaderView.ts:93`).
- **HD still:** `OfflineRenderer.captureScreenshot` (`OfflineRenderer.ts:83-147`).
  - It resizes the real on-screen canvas to the target, resets the engine and runs setup.
  - With buffers it steps from t=0 at a hard-coded 60 fps (`:108`); without buffers it does a single `engine.step(time)` (`:120`).
  - It finishes with `toBlob` PNG and restores the canvas. Supersample is "render 2× then 2D-canvas downscale" in the panel (`src/app/ScreenshotPanel.ts:352-365,389-401`).
- **Video:** `OfflineRenderer.record` (`:150-237`). Sequence: pause, resize canvas, reset, `runSetupOrThrow`, optional warm-up from 0 to startTime (only if buffers or an onFrame script exist, `:194`), then one of three loops.
  - **MP4** (`:323-352`): `Mp4Encoder` uses WebCodecs `VideoEncoder` (browser H.264, `avc1.6400xx` High profile) and mediabunny `^1.40.1` only as the muxer (`EncodedVideoPacketSource` + `Mp4OutputFormat` + `BufferTarget`), dynamically imported (`src/app/Mp4Encoder.ts:79-97`).
  - **WebM** (`:281-321`): `MediaRecorder` VP9 on `captureStream(0)` with `requestFrame()`, at a fixed 8 Mbps. MediaRecorder timestamps frames by wall clock, so timing is not frame-exact despite the comment. [I]
  - **PNG frames** (`:243-279`): File System Access directory, or one download per frame.
- **Recording vs offline export:** they are the same thing now. The realtime recorder was removed in commit 3fd6888; every format is fixed-timestep.
- **Deterministic:** `iTime` (`start + f/fps`), `iFrame`, and the script's `time/dt/frame`.
- **Not deterministic:**
  - `engine.reset()` does not clear `_lastStepTime` (`ShaderEngine.ts:474-506`), so the first offline frame gets `iTimeDelta = startTime − lastLiveTime`. [X] The probe (two live steps to t=37.5, then `reset()` and offline frame 0) logged `iTimeDelta [-37.5, 0.01667]`. Any integrator using `iTimeDelta` takes a negative step on frame 0 of every recording or buffered screenshot.
  - `iDate` is wall clock (`ShaderEngine.ts:388`). [R]
  - A buffer-less shader driven by `onFrame` gets zero `onFrame` calls for an HD still. [X] The probe logged `onFrame calls: 0`; the code path is `OfflineRenderer.ts:118-121`. The scrub preview skips scripts too (`App.ts:629-634`).
  - Offline uses `engine.step` directly, not `view.step`, so keyboard, video and audio textures are not updated, and the mouse is hard-wired to `[0,0,0,0]` (`:56`). [R]
  - Nothing consults `offline.isActive` outside the class (grep is empty). Space or `handle.resume()` during a render un-pauses the live loop on the same engine. [I]
- **Tiling: none** (grep for "tile" is empty). The 8K preset (`src/app/panel-kit.ts:11-17`) with 2× supersample asks for 15360×8640 RGBA32F ping-pong pairs per pass. There is no `MAX_TEXTURE_SIZE` check anywhere.
- **Mp4Encoder limits:**
  - The whole file is buffered in RAM (`BufferTarget`, `fastStart: 'in-memory'`, `:88-92`).
  - The bitrate table is independent of resolution, 2–32 Mbps (`:8-13`).
  - `isMP4Supported` only tests `typeof VideoEncoder` (`:18-20`); there is no `isConfigSupported` call.
  - The encoder error callback only does `console.error` (`:104-106`).
  - Odd dimensions are rounded down in the encoder config (`:64-69`) but the canvas is not, so the `VideoFrame` size mismatches. [I]
  - There is no colour-space metadata and no audio.

## 3. exportHTML.ts

Yes, it is a second hand-written engine in a template string (`src/app/exportHTML.ts:176-724`, about 520 lines of player JS).

- **Not duplicated:** GLSL assembly. It embeds the engine's exact compiled fragment sources (`:115-123`, `ShaderEngine.ts:307-318`). The std140 packer ships via `.toString()` (`:220`) and is pinned by `tests/exportPacking.test.ts`.
- **Duplicated by hand:** GL setup, program compile, RGBA32F ping-pong targets, the pass loop, built-in uniform binding, typed scalar binding, UBO upload, channel and sampler binding, the keyboard texture, script textures, a script-API shim, mouse, resize, the rAF loop and the blit.
- **Missing or different compared with the real engine:**
  - Image textures become an 8×8 grid; audio, video and webcam become black (`:38-49`).
  - Buffer `filter`/`wrap` options are ignored: always NEAREST/CLAMP (`:364-373`).
  - Touch and pinch uniforms are never set.
  - Keyboard uses deprecated `e.keyCode` on `document` (`:289-302`), where the engine uses a `code` map.
  - No pause, reset, visibility handling, context-loss handling, uniforms UI, stickyMouse, pixelRatio or startPaused. The frame is fixed at 16:9.
  - Different dt: `max(0.001, …)` (`:608`).
  - `setStructArray*` warn and do nothing (`:524-525`); `setOverlay` is a no-op; `onUniformChange` and `dispose` are never called.
  - Baked UBO data is rounded with `toFixed(6)` (`:158`).
  - `title` is not HTML-escaped (`:181`), and a script containing `</script>` would break the file. [I]
  - Multi-view is refused (`App.ts:678-681`).
- **Tests** (`tests/exportGeneration.test.ts`) cover string escaping only. The player is never executed.

## 4. Public surface

**`shader-sandbox` (`src/index.ts:14-36`)**

| Export | Kind | Notes |
|---|---|---|
| `mount(el, options)` | fn | `src/mount.ts:81` |
| `loadDemo(demoPath, glslFiles, jsonFiles, imageFiles, scriptFiles?, rawScriptFiles?)` | fn | Takes Vite glob maps (`src/project/loaderHelper.ts:133-141`); the only path that loads multi-view |
| `isArrayUniform`, `isStructArrayUniform`, `isAnyUBOUniform`, `isMultiViewProject`, `isMultiViewConfig` | fns | |
| `MountOptions`, `MountPresentationOptions`, `MountHandle` | types | |
| `ShaderProject`, `ProjectConfig`, `PassName`, `ThemeMode`, `DemoScriptHooks`, `ScriptEngineAPI`, `ArrayUniformDefinition`, `UniformValue`, `MultiViewProject`, `MultiViewConfig`, `MultiViewLayoutMode`, `ViewEntry`, `CrossViewState`, `LayoutMode` | types | |

**`shader-sandbox/node`**, also the `node` condition of `.` (`src/node.ts`): the same names. `mount` and `loadDemo` throw "browser-only"; the guards are the real ones. Parity is tested in `tests/node-exports.test.ts`.

**`shader-sandbox/runtime` and `/runtime/standalone` (`src/runtime.ts`)**

| Export | Signature |
|---|---|
| `loadFromFolder(el, url, options?)` | `Promise<MountHandle>`; folder or `.glsl`/`.frag` (`:149`) |
| `loadFromSource(el, glsl, options?)` | `MountHandle` (`:186`) |
| `loadFromModule(el, url, options?)` | `Promise<Partial<MountHandle> & {destroy()}>` (`:199`); missing from the file header and the README |
| `MountHandle`, `MountPresentationOptions` | types |
| side effect | three `customElements.define` calls (`:798-800`), unguarded, so loading both runtime builds throws [I] |

**`mount()` options (`mount.ts:25-53`)**

| Option | Default |
|---|---|
| `project` (required) | — |
| `styled` | true |
| `pixelRatio` | config, then devicePixelRatio |
| `layout` | config (`default`/`fullscreen`/`split`/`tabbed`) |
| `controls`, `stats`, `playback` | false |
| `uniformsUI` | `'panel'` |
| `theme` | config (`auto`/`light`/`dark`/`system`) |
| `startPaused`, `stickyMouse` | config |
| `authorTools` | false |

**`MountHandle`:** `pause()`, `resume()`, `reset()`, `isPaused`, `setUniform`, `getUniform`, `recompile(pass|'common', src) → {success, error?}`, `destroy()`. There is no seek, screenshot, record, resize, event or ready hook.

**Elements** (no `observedAttributes`: attributes are read once at connect; no shadow DOM)

| Element | Attributes | Properties / methods | Events |
|---|---|---|---|
| `<shader-canvas>` (`runtime.ts:671-704`) | `src` (folder / `.glsl` / `.frag` / `.js` / `.mjs`) or inline text; `id`; `static`; `fullpage`; `lazy` (default true); pass-through `start-paused`, `pixel-ratio`, `sticky-mouse`, `uniforms-ui`, `theme`. Forces `playback`/`stats`/`controls`/`styled` false and `layout: 'fullscreen'` (`:677`) | `project` (getter), `recompile(pass, src)`, `ensureLoaded()` | `shader-canvas:connected` and `shader-canvas:loaded` on `document`, detail `{id, el}` (`:419,689`) |
| `<shader-editor>` (`:710-784`) | `for`, `pass`, `theme` | none | none (listens to the two above) |
| `<shader-sandbox>` (`:790-796`) | as canvas, plus every non-reserved attribute passed through as a mount option, kebab→camel, coerced (`:547-559`): `layout`, `controls`, `stats`, `playback`, `styled`, even `author-tools` | `ensureLoaded()` | none |

Reserved names: `src fullpage lazy static style class id slot is` (`:393-396`).

**Other surface**
- Built-module contract: `export async function mount(el, options={})`, plus auto-mount into `#app` (`bin/cli.js:520-533`).
- CLI (`bin/cli.js:674-926`): `create`, `new`, `dev`, `build`, `build-all`, `build-gallery`, `build-runtime`, `list`.
- Packaging [R]: `dist-lib` is unbundled `tsc` output with CSS side-effect imports and extensionless specifiers (`scripts/build-lib.cjs:27-80`), so it works only through a bundler.
- Bundle size [X]: the standalone runtime builds to 513 kB (119 kB gzip). 135 kB of that is mediabunny, inlined by `inlineDynamicImports` (`vite.config.runtime.ts:33`), although no viewer can reach the recorder.

## 5. Multi-view

- **Separate type:** `MultiViewProject` (`src/project/types.ts:721-742`) has `views: ViewEntry[]` and `viewLayout` instead of `passes` and `layout`. It is detected by `isMultiViewProject` and mounted through its own branch (`mount.ts:208-256`).
- **Per view:** App synthesizes a `ShaderProject` per view (`App.ts:287-309`) and builds one `ShaderView` each, which means one canvas, one WebGL2 context and one full `ShaderEngine` (`ShaderView.ts:88,110`). N views means N contexts, N compiles and N copies of textures and UBOs.
- **Coupling** is only shared time, uniforms fanned out N times (`App.ts:411-414`), and `iMouse_<view>`-style cross-view uniforms (`App.ts:481-491,524-527`). Views cannot read each other's buffers.
- **UI:** `MultiViewControls` offers play, reset and sliders. Its header promises a screenshot button (`src/app/MultiViewControls.ts:7`) that does not exist.
- **Loading:** only via `loadDemo` in dev. The fetch and Node loaders throw (`src/project/loadProjectCore.ts:381-385`).

## 6. Input (`src/app/InputManager.ts`)

- **Mouse:** `mousedown`/`mousemove` on the canvas, `mouseup` on `window` (`:178-183`).
- **iMouse:** xy updates only while dragging (`:162-167`); zw is the click origin, negated on release unless `stickyMouse` (`:169-176`). This departs from Shadertoy, where w is positive only on the click frame. `iMousePressed` is an extension.
- **Coordinates:** `(client − rect) × pixelRatio`, y flipped (`:141-146`). The pixel ratio is captured once, so zoom or monitor changes go stale. [I]
- **Not provided:** hover, wheel, right button, modifiers.
- **Touch and pen:** pointer events with capture, up to 3 touches, pinch scale, delta and centre (`:190-340`), `touch-action: pan-y` (`:193`). A single touch mirrors into iMouse.
- **Keyboard:** `KeyboardEvent.code` maps to Shadertoy ASCII (`:12-49`), queued and drained per frame (`:112-116`, `ShaderView.ts:165-168`). The listener target is the App container, which must hold focus (`App.ts:92-96`).
- **Shortcut conflict:** the same target carries the app shortcuts S (download a screenshot, always on), Space and R (`App.ts:696-723`), with no opt-out. A WASD shader downloads a PNG on every S and resets on R. [R]

## 7. Lifecycle and disposal

- **Good:**
  - `App.dispose` (`App.ts:729-751`) stops rAF, calls script dispose, disposes views, panels and observers, and closes an active panel, which cancels a recording (`src/app/RecordingPanel.ts:324-326`).
  - `ShaderView.dispose` (`ShaderView.ts:244-270`) removes context listeners before `loseContext()`.
  - `InputManager.dispose` removes every listener (`:121-132`).
  - The element base has a generation guard for in-flight mounts (`runtime.ts:606-621`), re-parent survival (`:457-459`), and uses the last IntersectionObserver entry (`:498-500`).
  - `cleanupHost` reverts host attributes (`mount.ts:108-111`).
- **Weak:**
  - Layout dispose is `container.innerHTML = ''` (`src/layouts/CanvasLayout.ts:35`, `GridLayout.ts:81`), which wipes anything else in the host.
  - The anonymous `mousedown` focus listener is never removed (`App.ts:96`); it is harmless because the node is discarded.
  - An in-flight `captureScreenshot` is not cancellable and its `finally` touches a disposed engine. [I]
  - `<style id="shader-sandbox-styles">` and the JS-injected CSS are never removed.
- **Global styles:** class names are unprefixed globals with no shadow DOM (`.stats-container`, `.control-button`, `.canvas-container`, `.error-*`), and there is a `:root{--glass-*}` block (`src/app/app.css:11-27`). Themes are correctly scoped to `[data-theme]`.

## 8. Claims check

| Claim | Verdict | Evidence |
|---|---|---|
| (a) The frame number passed to scripts is 0 when stats are off | **VERIFIED** [R] | `App.ts:520` passes `statsPanel?.totalFrameCount ?? 0`; `statsPanel` exists only if `stats ?? controls` (`:174,181`), and `authorTools` does not force it. With stats on, live is 1-based (`src/app/StatsPanel.ts:68-69`); offline is 0-based (`OfflineRenderer.ts:55`) [X]. So `if (frame===0)` is true on every frame in default `shader dev` and once in recordings. |
| (b) Multi-view is a separate project type with no author toolbar, capture or export | **VERIFIED**, one nuance [R] | Type and branch as in §5. `_authorTools` is ignored and `skipPlaybackControls: true` (`mount.ts:213-215,230`). Export is refused (`App.ts:678-681`). OfflineRenderer is bound to the primary view and has no button to reach it. Nuance: the S key still saves a PNG of the primary view only (`App.ts:585-597,700-702`). |
| (c) `mount` needs casts because ShaderProject mixes rendering and presentation | **PARTLY** [R] | The casts exist (`mount.ts:87-88`), and `ShaderProject` does carry layout, theme, controls, stats, playback, uniformsUI, startPaused, stickyMouse and pixelRatio beside passes (`types.ts:583-693`). The proximate cause of the cast is the single-vs-multi union (`layout` vs `viewLayout`). The mixing shows more clearly in presentation overrides being written onto a project copy (`mount.ts:86-96`) and App reading chrome from the project (`App.ts:174-176`). |
| (d) exportHTML.ts is a second hand-written engine embedded as a string | **VERIFIED for the runtime, REFUTED for GLSL generation** [R] | See §3. |

## 9. Verdicts and the seam

| Piece | Verdict | Why | Interface to the engine |
|---|---|---|---|
| **Transport** (73 lines, 8 tests) | **Keep the idea, extend or rewrite** (trivial cost) | Correct and tested as a single owner of pause state. But it has no seek, no rate, no frame counter, no fixed-step mode and no visibility policy, and offline bypasses it. | None. The engine never sees it; App passes `elapsed()` into `step`. A 1.0 clock should emit `{time, dt, frame}` in both live and offline modes, and the engine should stop deriving dt and frame itself. |
| **OfflineRenderer** (353 lines, 0 tests) | **Keep the ideas, rewrite** | Good: suspending resize tracking, save/restore of the live clock, warm-up, continuous frame offset, throwing setup at start, cancel. Bad: three determinism bugs (§2), mutation of the on-screen canvas, hard-coded 60 fps stills, no tiling or size guard, zero input, direct coupling to `ShaderView` and the `RecordingRequest` panel type, and an eight-callback deps bag (`:19-31`). | `view.engine.{reset(), resize(w,h), step(time, mouse, pressed)}`, `view.canvas`, `view.presentToScreen()`, `view.suspend/resumeResizeTracking()`, plus script callbacks. A new engine needs `reset()`, `renderFrame({time, dt, frame, size})` into an off-screen target, and a readback or presentable. |
| **Mp4Encoder** (183 lines; 4 tests, level table only) | **Keep the ideas, rewrite thinly** | Worth keeping: the H.264 level table (`:27-48`), `dequeue` backpressure (`:129-133`), even-dimension rule, cancel-safe dispose, lazy import. Replace: in-RAM target, missing support probe, swallowed encoder errors, resolution-blind bitrate. mediabunny 1.40 already exports `CanvasSource`, `StreamTarget`, `canEncodeVideo` and `WebMOutputFormat` (checked in `node_modules/mediabunny/dist/mediabunny.d.ts`), which would also retire the MediaRecorder WebM path. Lazy-load it only in author mode. | Engine-independent: `init()`, `addFrame(canvas)`, `finish() → Blob`, `dispose()`. |
| **InputManager** (341 lines, 0 tests) | **Keep the ideas, rewrite** | Keep: the `code`→ASCII table, window mouseup, pointer capture, `pan-y`, sticky mouse, first-gesture hook, pull-based state. Replace: the dual mouse/pointer paths, stale pixel ratio, lack of hover/wheel/modifiers, the shortcut collision, and no way to record or replay input (DESIGN.md parks "interaction recording"). | Pull-only: `mouse[4]`, `isMouseDown`, `touchState`, `getAndClearKeyEvents()`. `ShaderView.step` forwards them (`ShaderView.ts:161-184`). |

The seam today is effectively seven calls (`step`, `reset`, `resize`, `bindImageForRead`/`unbindImageForRead`, uniform setters, `recompilePass`/`recompileCommon`, the two export-data getters) plus the media and keyboard update calls. It is small, which favours a rewrite. But App reaches `view.engine.*` in more than 20 places (`App.ts:324-355,403-430,576,631-632`), so there is no interface type to fit, only call sites.

## 10. Worth preserving, and weaknesses

**Preserve (hard-won):**
- H.264 level selection and encoder backpressure.
- Suspending the ResizeObserver while a render owns the canvas (`ShaderView.ts:281-294`).
- Live-clock save/restore across renders (`OfflineRenderer.ts:169,228`).
- Warm-up only when state exists (`:194`).
- Exports that embed the exact compiled sources, with script modules embedded verbatim via a Blob import (`exportHTML.ts:459-477`).
- Removing context-loss listeners before `loseContext` (`ShaderView.ts:261-268`).
- The element hardening listed in §7.
- A 404 means absent but other HTTP errors throw (`runtime.ts:41-48`).
- "Editor forces load, not play" (`runtime.ts:540-543,637-639`).
- Last-good-shader recompile through the handle.
- The author/viewer chrome split.
- Node-entry parity test.
- `touch-action: pan-y` for scrolling blog pages.

**Weaknesses:**
1. Three different meanings of "frame" (live stats counter or constant 0, offline 0-based, engine `iFrame`) and two of "dt".
2. Offline determinism holes: frame-0 `iTimeDelta`, `iDate`, scripts skipped for stills, media and keyboard not stepped.
3. No tiling or size limits, despite 8K presets and the ROADMAP Stage 7 goals.
4. A second engine in exportHTML that is untested at runtime and feature-poorer.
5. Multi-view as a parallel universe with N contexts and no tools.
6. Two visibility systems; resize resets time; no seek API.
7. `ShaderProject` conflates content and chrome; elements push arbitrary attributes into options; no attribute reactivity; no handle events.
8. Keyboard shortcuts collide with shader keys.
9. The embed runtime carries author-only code and global CSS.
10. The app layer has essentially no tests. App, ShaderView, OfflineRenderer, InputManager, mount and the elements have none; the full suite of 11 files / 102 tests passes on the scratch copy. [X]
