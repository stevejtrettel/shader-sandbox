# UI layers of shader-sandbox and webgl-demos: study and audit of report 4

Nothing in either repo was edited. Experiments live in `/tmp/claude-0/-home-user-shader-sandbox/af1ff954-3674-5584-9924-24e48c664678/scratchpad/ui/` (`entry.ts`, `wd-entry.ts`, `index.html`, `wd.html`, `build/`).

**Evidence tags:** [R] = verified by reading; [X] = verified by running; [I] = inferred.

**How things were run:** both codebases were bundled with shader-sandbox's own esbuild into the scratch dir and driven in headless Chrome (SwiftShader WebGL2). For webgl-demos the real `App`, `Engine` and panels ran; only CodeMirror was stubbed and jszip was left external (never loaded). Multi-view, the editor, recording, and the custom elements were read, not run.

**One thing to check:** untracked `*.whl` files (matplotlib, fonttools, contourpy, …) appeared in `/home/user/shader-sandbox/` at 22:27 today. They were already present before my first build command, and nothing I ran downloads wheels. I left them alone.

---

## 0. Audit of `docs/handoff/reports/4-ui-comparison.md`

| Claim | Verdict | Evidence |
|---|---|---|
| webgl-demos stronger: composable panel model | **PARTLY** | [R] The `Panel` interface (`webgl-demos/src/panels/Panel.ts:18-46`), typed `app.on()` (`App.ts:450-466`) and user layout functions (`app/types.ts:117`) are real. But a layout returns `void`, so nothing owns the panels. `App.setParamsPanel(panel: any)` (`App.ts:422`) is a back-door. Four panel files call `app.getEngine()` against the contract. |
| …control types: enum, button, text, groups, presets, on-canvas | **PARTLY** | [X] Groups, preset dropdown, enum and overlay all render and work for scalars. Caveats: vector controls do not follow presets (see "new findings"); `button` with a custom `action` only does `console.log` (`ParamsPanel.ts:526-528`); `text` is not a uniform and no example uses it; overlay supports only float/int/bool, with other types rendered as a JSON string (`OverlayControlsPanel.ts:153-160`). |
| …buffer viewer | **PARTLY** | [X] It exists and reads back, but shows `rgba8` buffers upside-down (top-left pixel was blue where GL-top is red). For an `rgba16f` buffer it returns all zeros and raises `GL_INVALID_OPERATION` (1282). Cause: `Core.ts:686-701` reads `UNSIGNED_BYTE`, and the "flip" at `BufferViewerPanel.ts:155-160` uses `putImageData`, which ignores transforms. It is not in any built-in layout, only `demos/panels-test` and `demos/buffers-test`. |
| …frame-time graph | **REFUTED as a working feature** | [X] The graph canvas is 0×0 at construction and still 0×0 after attach, in the DOM, with the app running. `PerformancePanel.ts:114-119` sizes it from `getBoundingClientRect()` inside the constructor, before the element is in the document; nothing resizes it later. The FPS/min/max text does work. |
| shader-sandbox stronger: embedding, theming, capture, multi-view, touch, errors | **VERIFIED** [R], with caveats | Embedding: `mount.ts:81-122`, `runtime.ts:437-800`. Capture: `ScreenshotPanel.ts`, `RecordingPanel.ts`. Multi-view: `GridLayout.ts`, `InsetViewLayout.ts`, `MultiViewControls.ts`. Touch: `InputManager.ts:190-340`. Errors: `ErrorOverlay.ts:135-202`. Caveats: theming leaks into the host page (section 5); multi-view runs in the dev server only (`README.md:405-406`). |
| "Neither has owned disposal" | **REFUTED for shader-sandbox, VERIFIED for webgl-demos** | [X] sandbox: after `handle.destroy()` the host has 0 children, `data-theme`/`unstyled` are removed, and a second destroy is safe. Chain: `mount.ts:201-205` → `App.dispose` (`App.ts:729-751`) → `ShaderView.dispose` (`ShaderView.ts:244-270`); the custom elements call it in `disconnectedCallback` (`runtime.ts:522-528`). [X] webgl-demos: after `app.destroy()` the host still holds the panel DOM, all five panels still have `app !== null`, and `body[data-theme]` stays. No caller of `detach()` exists outside PreviewPanel's child. |
| "Neither has scoped styles" | **VERIFIED**, and worse than stated for sandbox | See section 5. Only the theme tokens are host-scoped; classes are global. |
| Bug: sliders do not follow script-set uniforms | **VERIFIED [X]** | The script set `uSpeed=3, uOn=true`: engine reads 3/true, slider shows "1", checkbox unchecked. `handle.setUniform('uSpeed', 4.5)` also leaves the slider at 1. Cause: `App.setUniformValue` (`App.ts:411-423`) never calls `uniformsPanel.setValue` (`UniformsPanel.ts:147`). |
| Bug: frame passed to scripts is 0 when stats are off | **VERIFIED [X]**, plus an off-by-one | Stats off: `onFrame` got `frame = 0,0,0,0`. Stats on: `1,2,3` (1-based), while the shader's `iFrame` is 0-based (`ShaderEngine.ts:403,441`). Cause: `App.ts:520` reads `statsPanel?.totalFrameCount ?? 0`, which is incremented before the hook runs (`StatsPanel.ts:69`). |
| Sandbox dependencies "both dynamically imported" | **PARTLY** [R] | `mediabunny` is dynamic (`Mp4Encoder.ts:85`) and `prism-editor` is dynamic (`EditorPanel.ts:287`). But `runtime.ts:22` and `TabbedLayout.ts:13` import `EditorPanel` statically, and both Vite configs set `inlineDynamicImports: true`, so the standalone runtime is one file. |
| Sandbox leak: mousedown/tabindex on container never reverted (`App.ts:92-96`) | **PARTLY** [R] | True, but that container is the layout's own div, discarded by `container.innerHTML = ''`. |
| Fixed ids `rec-fmt-*`; dead `setUniformHandler`; near-duplicate capture CSS; randomize bug; ControlsPanel `isRunning` copy; docs drift | **VERIFIED** | [R] `RecordingPanel.ts:195-229`; `SplitLayout.ts:62-65` with `mount.ts:188-195`. [X] Randomize sets the enum to NaN. [X] After an external `app.pause()` the button still reads "⏸ Pause". [R] `LAYOUTS_GUIDE.md` documents `standard`, `code-focused`, `inspector` and `performance` layouts that do not exist (the real ones are fullscreen, params, sidebar, split, teaching), and `PANELS_GUIDE.md` documents two panels that do not exist. |

**New findings not in report 4**

- **webgl-demos has the same class of sync bug for vectors [X].** After applying a preset the store is correct but the vec2 sliders, the 2D pad handle and the vec4 numeric inputs stay at their old values. `updateControlValue` (`ParamsPanel.ts:767-795`) only handles `typeof value === 'number'`, boolean, colour, enum and text.
- **The sandbox capture panels are a second desync [X].** With the main slider at 4, the Screenshot panel's slider opens at the default 1 while the engine is at 4. Editing in the panel writes the engine but the main slider stays at 4. Cause: `ScreenshotPanel.ts:248` and `RecordingPanel.ts:271` create `UniformControls` without `initialValues`.
- **Context restore resets values behind the UI [I].** `ShaderView.ts:337-346` builds a new engine with default uniforms; the sliders keep the old numbers.

---

## 1. shader-sandbox UI inventory

**Layouts.** Chosen by a string in `createLayout` (`layouts/index.ts:47-66`). [R]

| Layout | What it is |
|---|---|
| `default`, `fullscreen` | One class, differing only by CSS class (`CanvasLayout.ts:14-38`). |
| `split` | Canvas plus a lazily imported `EditorPanel`; a container query stacks it under 700px (`SplitLayout.ts`, `split.css:160-167`). |
| `tabbed` | `EditorPanel` with the canvas as its first tab (`TabbedLayout.ts:35-37`). |
| Multi-view `grid` | Covers `split`/`quad`/`grid`; a ResizeObserver flips orientation (`GridLayout.ts`). |
| Multi-view `inset` | Main view plus a minimisable overlay (`InsetViewLayout.ts`). |

A layout exposes only `getCanvasContainer()` (`layouts/types.ts:39-61`). Everything else floats inside the canvas container as absolutely positioned overlays.

**Uniform declaration to control.** [R]

- `config.json` → `uniforms: { name: { type, value, min, max, step, label, hidden, color } }` (`project/types.ts:35-112`).
- `UniformControls.createControl` switches on `type` (`UniformControls.ts:122-141`).
- Uniforms are auto-injected into the GLSL: redeclaring one gives "redefinition" [X]. The comment at `project/types.ts:671` saying users must declare them is stale.

| Type | Control | Lines |
|---|---|---|
| `float` | Range slider | `:196` |
| `int` | Rounded slider | `:225` |
| `bool` | Toggle | `:254` |
| `vec2` | XY pad | `:302` |
| `vec3` | Colour picker if `color`, else three sliders | `:400`, `:551` |
| `vec4` | Colour plus alpha if `color`, else four sliders | `:464`, `:551` |
| Array / struct (UBO), `hidden` | No control | `:66` |

- There is one "Reset" button (`:94-98`).
- There is no enum, button, text, numeric entry, group, preset or per-control widget hint.
- Presentation is `uniformsUI: 'panel' | 'inline' | 'off'` (`App.ts:176-178`). `inline` is achieved by physically re-parenting the label-row children (`UniformsPanel.ts:116-131`).
- Multi-view ignores `uniformsUI` and always uses `MultiViewControls` (`mount.ts:230-241`).

**State model.** [R] A uniform value lives in up to four places with no subscription between them:

- one `UniformStore` per engine, so N copies in multi-view (`UniformStore.ts:21`, written in a loop at `App.ts:412-414`);
- `UniformControls.values`, a private copy the vec sliders mutate (`UniformControls.ts:51`);
- one more copy per open capture panel.

`UniformStore` itself has no change events. `getUniformValue` reads the primary view only (`App.ts:428-430`).

**Editor.** [R]

- A `<textarea>` with a Prism highlight overlay (prismjs GLSL), line numbers, and Tab inserting two spaces via `execCommand` (`prism-editor.ts:23-134`). The header comment of `EditorPanel.ts:5` still says "CodeMirror".
- Tabs: common, BufferA–D, image, plus read-only texture image tabs (`EditorPanel.ts:164-215`). Per-tab edits are retained in `modifiedSources`.
- Recompile is explicit, by button or Ctrl/Cmd+Enter (`:394-405`). It is live in the sense that time and buffers are preserved and the last good shader keeps running (`mount.ts:125-146`).
- Errors show as one plain-text strip (`:357-360`). For `common`, only the first error is shown (`mount.ts:137-141`). There are no inline markers.
- The editor instance is destroyed and rebuilt on every tab switch (`:250-254`), losing undo history. If the panel is disposed during the dynamic import, an editor is still created afterwards (`:286-291`, no guard) [I].
- The seam is clean: `EditorInstance { getSource, setSource, dispose }` (`prism-editor.ts:14-18`).

**Panels and toolbar.** [R]

- `StatsPanel`: FPS, expandable to time, frame and resolution.
- `PlaybackControls`: a "+" menu with play/pause and reset. With `authorTools` it adds screenshot, record and export HTML (`PlaybackControls.ts:111-122`). It is forced on in the dev server (`main.ts:38`, `App.ts:173-175`).
- `ScreenshotPanel` and `RecordingPanel`: modals built from `panel-kit.ts`. `panel-kit` emits per-prefix class names so the two near-duplicate stylesheets keep working (`panel-kit.ts:1-8`).
- Overlays: compile errors, runtime/script errors, context lost, media permission banner, and script text overlays in four corners (`ShaderView.ts:221-238`).
- `MultiViewControls`: its docstring promises a Screenshot button that is not there (`MultiViewControls.ts:7` against `:102-135`).
- Keyboard: Space, R and S are bound on the container regardless of chrome (`App.ts:696-723`).

**Theming and style delivery.** [R] and [X]

- `mount()` sets `data-theme` on the host element. `theme.css` defines about 60 tokens for `auto`, `light`, `dark` and `system`. `auto` inherits the page via `currentColor` and `color-mix` (`theme.css:15-103`). `.unstyled` zeroes the pane radius and shadow.
- Delivery is plain global CSS. TS files `import './x.css'`. The library build copies the CSS files (`scripts/build-lib.cjs:57-80`). The standalone and `shader build` outputs inject one global `<style>` through `vite-plugin-css-injected-by-js`. `runtime.ts:381-387` injects a second global `<style id="shader-sandbox-styles">`.
- There is no shadow DOM, `@scope` or CSS modules (0 shadow roots in the run).
- The floating chrome mostly ignores the theme. It uses `--glass-*` variables defined on `:root` (`app.css:11-27`), and the capture stylesheets have 43–46 hard-coded colours each against 4–5 token uses.

**Accessibility and touch.** [X] and [R]

- Census of the full author chrome with the screenshot panel open: 121 elements, 0 `aria-*`, 0 `role`, 0 `label[for]`; 3 of 12 inputs have an accessible name. All 15 buttons have a `title` or text.
- The XY pad and colour swatch are unfocusable divs with no keyboard path (`UniformControls.ts:325-331, 429`). The toggle hides its checkbox. Modals have no focus trap and no Esc handling.
- Canvas touch is good: pointer events, pinch, `touch-action: pan-y` (`InputManager.ts:190-286`).
- The XY pad uses mouse and touch listeners on `document`, not pointer capture (`UniformControls.ts:368-381`).
- Responsive rules: one `@media (max-width: 428px)` and one `@container`.

**What an author can customise.** [R] Config flags (`layout`, `theme`, `controls`, `stats`, `playback`, `uniformsUI`, `label`, `hidden`, `color`); mount options or element attributes overriding them (`mount.ts:86-96`, `runtime.ts:547-559`); CSS variables on the host; composition of `<shader-canvas>` with `<shader-editor for=…>`; script overlays. Authors cannot add a control type, place or group controls, add a button, or supply their own panel or layout.

---

## 2. webgl-demos UI inventory

**Panel abstraction.** [R]

- `interface Panel { element; attach(app); detach() }`.
- Panels subscribe through `app.on('frame' | 'paramChange' | 'resize' | 'shaderError' | 'runtimeError')`, which returns an unsubscribe function. Handlers are isolated with try/catch (`App.ts:917-930`).
- Init errors are queued and replayed after layout (`App.ts:961-971`). If nobody listens, a fallback overlay shows (`:984+`).
- Lifecycle is half-built: `detach` is implemented everywhere but never called [X].

**Layouts.** [R] `LayoutBuilder = (app, container) => void`. Five templates with inline `cssText`, fixed 280/320px sidebars and hard-coded `#f5f5f5`/`#ddd` (`builders.ts:29-50`). User functions are allowed; `demos/panels-test/main.ts` does this.

**State model.** [R] and [X] `App.paramStore: Map` is the single source of truth (`App.ts:89`). `setParam` writes the store, then the engine, then emits `paramChange` (`:289-313`). The whole store is pushed to the engine every frame (`:786-792`). `ParamsPanel` and `OverlayControlsPanel` listen for `paramChange`. This is the right shape, and it works for scalars: a programmatic `setParam('uA', 0.25)` moved the slider.

**Controls.** Declared in TypeScript as `params: { uName: { type, default, min, max, step, label, group, overlay, ui } }` (`project/types.ts:408-830`). One switch renders them (`ParamsPanel.ts:345-553`).

| Type | Control |
|---|---|
| `float`, `int` | Slider plus value read-out |
| `bool` | Checkbox |
| `vec2` | `ui: 'numeric' \| 'sliders' \| '2d-pad'` |
| `vec3` | `'color'` (default), `'sliders'` or numeric |
| `vec4` | Numeric or sliders |
| `enum` | `<select>` over `options[]`; the value is the integer index |
| `button` | `action: 'reset' \| 'randomize' \| custom` |
| `text` | Text input, not a uniform |

- The 2D pad uses pointer capture (`:743-758`), which is better than the sandbox pad.
- `group` gives collapsible sections, auto-collapsed above three groups (`:38-67, 212-283`).
- `app.ui.addButton(label, cb, group)` adds buttons at runtime (`App.ts:108-112`). A Reset button is auto-injected when init shaders exist (`:501-538`).

**Presets.** [R] `presets: Record<name, ParamValues>` is plain data. `applyPreset` loops over `setParam` (`App.ts:319-329`). The dropdown is in the panel header (`ParamsPanel.ts:295-319`). There is no notion of the current preset, no save, and no URL state.

**On-canvas controls.** [R] `overlay: true` moves a param out of `ParamsPanel` (`:198`) into `OverlayControlsPanel`, which `PreviewPanel` always creates (`PreviewPanel.ts:38-41`). Its control code is a duplicate of the float/int/bool cases.

**Buffer viewer and performance graph.** See the audit table: both exist in code, neither works correctly as written.

**Other.** [R] CodeMirror 6 with a pass dropdown, not tabs (`CodePanel.ts`). A persistent error list (`ErrorPanel.ts`). `ControlsPanel` with step-once and fixed Δt. `RecordingPanel` with real-time video, PNG zip and per-buffer screenshot. Theme tokens are on `:root` and light/dark is applied to `document.body` (`App.ts:936-938`). `base.css` contains a global `* { margin: 0 }` reset and `html, body { overflow: hidden }`, so this is an app, not an embeddable widget.

---

## 3. Side by side

| Capability | shader-sandbox | webgl-demos |
|---|---|---|
| Single source of truth for values | No: one copy per engine, per control set, per capture panel | Yes: `paramStore` plus `paramChange` |
| Control follows a programmatic write | No [X] | Scalars, colour, enum yes; vec sliders, pad, numeric no [X] |
| Control types | float, int, bool, vec2 pad, vec3/4 sliders or colour(+alpha) | Those plus enum, button, text, numeric vec; no vec4 colour+alpha |
| Groups / presets / on-canvas | None / none / `inline` mode is all-or-nothing | Groups / presets as data / per-param `overlay` (scalars only) |
| Runtime buttons | None | `app.ui.addButton` |
| Composition | String presets; elements `<shader-canvas>` + `<shader-editor>` | Any panel in a user layout function |
| Disposal | Owned and working [X] | Not owned; leaks DOM and subscriptions [X] |
| Style scope | Tokens host-scoped; classes global; leaks into host [X] | Fully global app styles |
| Editor | Prism textarea, tabs, last-good shader survives, time preserved | CodeMirror 6, dropdown, reload resets the simulation (`App.ts:379`) |
| Errors | Mapped lines, hints, ±3 lines of context, runtime and context-lost overlays | Persistent list, raw log, fallback overlay |
| Buffer viewer | None (float `readPixels` for scripts only) | Present; upside-down, zeros for float buffers [X] |
| Perf graph | None (FPS text) | Coded; canvas is 0×0 [X] |
| Transport | Play/pause/reset; deterministic offline clock | Plus step-once and fixed Δt; no pause event |
| Capture | Offline MP4/WebM/PNG, 8K, supersample | Real-time video, PNG zip, per-buffer screenshot |
| Multi-view, touch/pinch, lazy mount | Yes | No |
| ARIA | None [X] | None [R] |

---

## 4. Architectural assessment

**What a clean 1.0 needs that neither repo has**

1. **One observable value store per mounted project, sitting above the engines.** Every writer goes through `store.set(name, value, origin)`: slider, script, handle, preset, capture panel, URL, context restore. Every reader subscribes: N engines, every control instance, the script's `onUniformChange`. This removes four patched symptoms at once:
   - the `_insideScriptSet` flag (`App.ts:320-322`), replaced by `origin`;
   - the per-view write loop;
   - the capture-panel desync;
   - the context-restore reset.

   webgl-demos proves the shape. It fails only because its controls re-derive DOM by `querySelector` instead of each control owning an `update(value)` closure. The sandbox has exactly those closures (`UniformControls.ts:52, 648-654`) and no store to call them. The two halves fit together.
2. **Runtime-owned clock and frame counter**, with `frame` taken from the engine and events for pause, time and frame. Stats, transport and scripts all read it. This fixes the frame-is-0 bug and the copied `isRunning`/`isPaused` flags in both repos.
3. **A control registry keyed by a widget name**, not one `switch` on type. The declaration should be data: `{ type, value, widget?, group?, placement?, label, … }`. Then enum, button, numeric, pad and colour are entries, and `overlay`/`inline` becomes a per-control `placement`.
4. **Presets and actions as data.** A preset is a named partial snapshot of the store, as in webgl-demos. Add a "current snapshot" that serialises, which gives save, URL state and the baked values the HTML export already wants (`exportHTML.ts:113`). Buttons should be named actions with a registry, not `console.log`.
5. **Disposal by construction.** Every component returns a disposer registered with its creator's scope, and listeners are bound to an `AbortSignal`. The sandbox's is correct but hand-maintained, class by class.
6. **Style scoping.** Either shadow DOM per element, with tokens exposed as inheritable custom properties and `::part`, or a namespaced prefix plus `@scope`. The `auto` theme idea survives either way because custom properties and `currentColor` cross shadow boundaries. Tokens need a prefix (`--ss-*`), and the theme selector must not be a bare `[data-theme]`.
7. **Composition in HTML.** The canvas registry and `for=` binding (`runtime.ts:415-431`) is the right primitive, but only the editor uses it. `<shader-controls for>`, `<shader-transport for>`, `<shader-stats for>` and `<shader-inspector for>` would each be store or clock subscribers. `<shader-sandbox layout=…>` then becomes a template of those, and the layout classes disappear.
8. **Accessibility baseline:** real `<label for>`, keyboard-operable pad, dialog semantics, focus-visible. This is currently zero in both.

**Carry forward as code**

- `runtime.ts` `ShaderHostElement`: lazy mount, generation guard, re-parent survival, load-not-play (`:437-665`).
- `InputManager.ts`.
- `ErrorOverlay.ts` `parseShaderError`, `friendlyGLSLError` and `buildCodeContext` (`:135-202`, already unit-tested).
- The `EditorInstance` seam and `prism-editor.ts`.
- `UniformControls`' `createSliderRow`, the per-control `{element, update}` shape, and the clone discipline (`:25-28, 147-190`).
- `theme.css` `auto` mode, after renaming tokens.
- The `ScreenshotPanelCallbacks` and `RecordingRequest` interfaces, and `panel-kit`'s resolution section.
- From webgl-demos: the typed `on() → unsubscribe` emitter with handler isolation (`App.ts:450-466, 917-930`), and the 2D pad's pointer-capture code (`ParamsPanel.ts:743-758`).

**Carry forward as ideas only**

- webgl-demos: the `Panel` interface, `ParamConfig` vocabulary (`group`, `ui`, `overlay`, `enum.options`, presets), `addButton`, init-error replay, step and fixed-Δt transport, persistent error list.
- Buffer viewer: rebuild it as a GPU blit to a canvas with channel and exposure controls, not `readPixels`.
- Performance graph: rewrite it.
- sandbox: the layout classes, `UniformsPanel`'s inline re-parenting hack, `MultiViewControls` (a near copy of `UniformsPanel` plus playback), and both capture stylesheets.

---

## 5. Surprises

- **shader-sandbox restyles the host page [X].**
  - Setting `data-theme="dark"` on the host's `<html>`, a very common convention, makes `--bg-primary` resolve to `#1a1a1a` on the page root. The cause is the bare `[data-theme="dark"]` selector (`theme.css:224`) with generic token names.
  - `app.css:639-645` ships a global `*, *::before, *::after { transition-duration: .01ms !important … }` under `prefers-reduced-motion`, which applies to the whole embedding page.
  - A host `<div class="tab-button">` picks up padding and `cursor: pointer` from `split.css:35-45`. That rule is dead inside the library itself: the editor uses `.editor-tab-button`.
- **Pressing "S" on a focused shader downloads a PNG for any viewer, with no chrome enabled [R]** (`App.ts:700-703`). Space, R and S also reach the shader's keyboard texture, so a WASD-controlled shader takes a screenshot on every S press.
- **The single-file HTML export has no uniforms UI [R].** Values are baked (`exportHTML.ts:113-135`).
- **Stale comments in the sandbox [R]:** `EditorPanel.ts:5` ("CodeMirror"), `project/types.ts:607` (theme default "light"; it is `auto`, `configHelpers.ts:82`), `project/types.ts:671` (uniform declaration), `app/types.ts:32` (a "'ui' layout" that no longer exists).
