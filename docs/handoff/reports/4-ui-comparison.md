## UI layer comparison: webgl-demos vs shader-sandbox

Read-only; nothing was modified. Everything below was verified by reading code unless marked *(inferred)*. Nothing was run, and bundle sizes were not measured.

### 1. webgl-demos as implemented

- **Panel contract** (`/home/user/webgl-demos/src/panels/Panel.ts:18-46`): an interface, not a base class: `element`, `attach(app)`, `detach()`. Each panel repeats the `unsubscribes[]` boilerplate itself.
- **Communication**: a typed pub/sub on App, `app.on(event) → unsubscribe` (`src/app/App.ts:450-466`). The five events are `frame`, `paramChange`, `resize`, `shaderError`, `runtimeError` (`src/app/types.ts:39-44`). Handlers are try/catch isolated (`App.ts:917-930`). Init errors are queued and replayed after layout (`App.ts:961-971`), with an inline-styled fallback overlay if nobody listens (`App.ts:984+`).
- **Layouts**: `LayoutBuilder = (app, container) => void` (`app/types.ts:116`). Five templates (fullscreen, params, sidebar, split, teaching) are hand-written CSS grid with inline `cssText` and hard-coded colours (`src/layouts/builders.ts:29-35, 47-50`). Users can pass their own function (`demos/panels-test/main.ts`).
- **Params**: declared in the project and auto-rendered by one `switch` (`src/panels/ParamsPanel/ParamsPanel.ts:345-553`).
  - Types: float and int sliders, bool checkbox, vec2 (`numeric | sliders | 2d-pad`), vec3 (`color` default, `sliders`, numeric), vec4, enum `<select>`, button (`reset | randomize | custom`), text.
  - Structure: `group` gives collapsible sections, auto-collapsed above three groups (`:33-67, 212-283`); preset dropdown and "Defaults" button (`:285-333`); `overlay: true` moves a param onto the canvas (`:198`).
  - Runtime additions: `app.ui.addButton()` (`App.ts:107-111`), and an auto-injected Reset button when init shaders exist (`App.ts:501-541`).
- **Buffer viewer** (`BufferViewerPanel.ts:136-168`): a dropdown of `project.buffers`, then `engine.readBuffer()` into a 2D canvas every 10 frames (`:30, 76-84`), with an auto-update toggle and resolution label. Readback is 8-bit RGBA only (`src/core/Core.ts:686-701`). No channel, exposure, zoom or pixel probe.
- **Performance** (`PerformancePanel.ts`): instantaneous FPS and frame time, min/max/avg over 120 frames, and a frame-time graph with a 60 fps reference line (`:122-226`).
- **Theming**: tokens in `src/styles/variables.css`, with light and dark themes applied as `[data-theme]` on `document.body` (`App.ts:936-938`).

### 2. shader-sandbox as implemented

- **No panel contract or event bus.** Components are plain classes taking a container plus callbacks or data, with `dispose()`. `App` hard-wires which exist from flags (`/home/user/shader-sandbox/src/app/App.ts:173-270`); the only notification is a single `onPauseChanged` slot (`App.ts:64`).
- **Layouts**: classes implementing `BaseLayout { getCanvasContainer, setRecompileHandler?, dispose }` (`src/layouts/types.ts:39-61`), chosen by string. Chrome floats as overlays inside the canvas container rather than docking. Multi-view has Grid and Inset layouts plus `MultiViewControls`.
- **Uniforms**: `UniformControls` takes definitions and `onChange` with no engine reference, and is reused in four places (UniformsPanel, MultiViewControls, ScreenshotPanel, RecordingPanel).
  - Types: float, int, bool toggle, vec2 XY pad, vec3/vec4 as colour (vec4 adds alpha) or component sliders (`src/uniforms/UniformControls.ts:121-139`).
  - Also: `hidden`, reset-all (`:98`), and `uniformsUI: panel | inline | off`.
  - Missing: enum, button, text, groups, presets.
- **Stats**: FPS averaged once a second, with expandable time, frame and resolution (`src/app/StatsPanel.ts:67-88`). No graph.
- **Errors**: a dismissible overlay with mapped line numbers, friendly hints and ±3 lines of context (`src/app/ErrorOverlay.ts:135-203`), plus a runtime-script overlay and an editor error strip.
- **Editor**: a textarea with a Prism highlight overlay (`src/editor/prism-editor.ts`), pass tabs, texture tabs, copy button and Ctrl/Cmd+Enter (`src/editor/EditorPanel.ts:164-214, 394-405`).
- **Embedding**: `mount()` returns a handle (`src/mount.ts`); three custom elements share a canvas registry using document `CustomEvent`s (`src/runtime.ts:411-430, 710-800`). There is no shadow DOM.
- **Theming**: `[data-theme]` on the host element with four modes, including `auto`, which inherits page fonts via `currentColor`/`color-mix` (`src/styles/theme.css:15-60`).

### 3. Side by side

| Capability | webgl-demos | shader-sandbox | Better, and why |
|---|---|---|---|
| Composability | Any panel in any user layout function; event bus | Fixed presets; App instantiates chrome | webgl-demos for the model; sandbox for leaf components free of engine references |
| Param control types | 9 types, 3 vec UI modes | 6 types, vec4 colour+alpha | webgl-demos for breadth; sandbox for cleaner per-control code (`createSliderRow`, updater closures) |
| Grouping and presets | Groups, collapse, presets, overlay flag | None (flat list, inline mode) | webgl-demos |
| Buffer inspection | Live viewer, 8-bit | None in UI; float `readPixels` for scripts only (`App.ts:326`) | webgl-demos, though basic |
| Performance stats | Graph, min/max/avg | FPS, time, frame, resolution | webgl-demos for debugging; sandbox is less intrusive for viewers |
| Error display | Persistent list, raw log and full-source toggles (`ErrorPanel.ts:227-395`), fallback overlay | Overlay with hints, common.glsl dedupe, runtime and context-lost overlays | Sandbox for mapping and messages; webgl-demos for history |
| Code editing | CodeMirror 6 with `basicSetup` and cpp mode; rebuilt per pass switch (`CodePanel.ts:121-160`) | Prism textarea; keeps per-tab edits, last good shader keeps running | CodeMirror for editing features; Prism for weight and embeds |
| Recording and screenshot | Realtime MediaRecorder, PNG zip at fixed step, per-buffer screenshot | Offline deterministic MP4/WebM/PNG, up to 8K, time scrub, 2× supersample | Sandbox |
| Theming and embedding | Global on `body`; half the panels ignore tokens | Host-scoped, `auto` mode, custom elements, lazy mount | Sandbox |
| Multi-view | None | Grid, inset, cross-view state | Sandbox |
| Accessibility and keyboard | No ARIA; one document-level shortcut (Ctrl+Shift+F) | No ARIA; `title` on icon buttons, container-scoped Space/R/S, reduced-motion rule (`app.css:639`) | Sandbox, but both weak |
| Mobile and touch | Pointer events; fixed 280/320px columns, no media queries | Touch and pinch input, `@container` and `@media` rules (`split.css:163`, `app.css:648`) | Sandbox |
| Dependency weight | CodeMirror (static import in CodePanel), jszip (dynamic) | prismjs and mediabunny, both dynamically imported (`Mp4Encoder.ts:85`) | Sandbox *(inferred)*; the only figure is a docs claim of ~534 KB for CodeMirror (`docs/PANELS_GUIDE.md:288-293`) |

### 4. What would be lost

**Only in webgl-demos**
- enum, button and text params; numeric vec inputs; randomize; `app.ui.addButton`
- groups, presets, and overlay params on the canvas
- buffer viewer and per-buffer screenshot
- frame-time graph
- persistent error list
- step-once and fixed-Δt transport (`ControlsPanel.ts:119-155`)
- docked sidebar and teaching layouts, user-defined layout functions
- typed event bus

**Only in shader-sandbox**
- custom elements, canvas registry, `mount()` handle
- host-inheriting theme
- multi-view
- offline renderer and MP4, HTML export
- author/viewer chrome split
- lazy mounting and off-screen pause
- texture tabs, copy button
- script and context-lost overlays
- touch and pinch input
- inline uniforms mode

### 5. Code quality

**webgl-demos**
- **Teardown is never exercised.** Nothing calls `panel.detach()` except PreviewPanel on its child. Layout builders return nothing, so `App.destroy()` (`App.ts:228-257`) cannot reach panels or clear the container.
- **Listeners**: most DOM listeners are anonymous and never removed; a second `attach` would double them (`BufferViewerPanel.ts:60-73`).
- **Duplication**: OverlayControlsPanel re-implements the float, int and bool controls. The group-section DOM is built twice in ParamsPanel (`:141-181` and `:212-283`).
- **Coupling**:
  - Four panels call `app.getEngine()` despite the contract saying "never to Engine directly" (`Panel.ts:14`).
  - App holds the params panel as `any` (`App.ts:422`).
  - ControlsPanel keeps its own `isRunning` copy with no event to resync.
- **Bugs**:
  - Randomize assumes `min`/`max` exist, including for enum, which has neither (`ParamsPanel.ts:802-814`).
  - *(inferred)* The buffer-viewer flip is a no-op because `putImageData` ignores transforms (`:155-160`).
  - *(inferred)* Float buffers will not read back as `UNSIGNED_BYTE`.
  - *(inferred)* The performance graph is sized from `getBoundingClientRect()` before the element is in the DOM.
  - A debug `console.log` is left in `ErrorPanel.ts:55`.
- **CSS**: 5 of 10 panel stylesheets use no tokens, and there are 105 hard-coded hex colours in panel CSS.
- **Docs drift**: the guide says the buffer viewer updates "every frame"; the code throttles to every 10.

**shader-sandbox**
- **Sync gap**: `App.setUniformValue` never calls `uniformsPanel.setValue` (`App.ts:411-423`), so script or handle changes do not move the sliders.
- **Hidden coupling**: the frame number passed to scripts comes from `StatsPanel.totalFrameCount`, so it is 0 when stats are off (`App.ts:520`).
- **Leaks**: an anonymous `mousedown` listener and `tabindex`/outline changes on the container are never reverted (`App.ts:92-96`).
- **ID collisions**: fixed element ids `rec-fmt-*` clash across instances (`RecordingPanel.ts:195-229`).
- **Dead code**: the `setUniformHandler` path (`SplitLayout.ts:62`, `mount.ts:188`).
- **CSS**: the screenshot and recording stylesheets are near-duplicates, acknowledged in `panel-kit.ts:1-8`. Global unscoped class names (`.stat-item`, `.error-header`, `.control-button`) with no shadow DOM risk host-page collisions.
- **Good practice**: UniformControls tracks and removes its document listeners (`UniformControls.ts:369-381, 670-674`).

### 6. Inputs for a composable design (factual)

Components that are already separable in one codebase or the other, and what each actually consumes:

| Component | Needs from the runtime |
|---|---|
| Canvas / view | Mount target, resize, input state |
| Param controls | List of `{name, type, default, min/max/step, label, group, widget hint, hidden}`; `get`, `set`, and a change notification (webgl-demos has it; sandbox lacks it) |
| Presets and actions | Named value sets; a registrable action list (buttons) |
| Transport | `paused`, `time`, `frame`; `play`, `pause`, `reset`, `step`, time mode; a change event |
| Stats | Per-frame tick with time and frame; resolution-change event; frame counter owned by the runtime, not the panel |
| Error views (overlay or list) | Stream of `{pass, message, mapped line, source, isCommon, raw log}` plus a "cleared" signal; runtime/script errors as a second stream |
| Editor | List of `{passName, source}` and textures; `recompile(pass, source) → {success, error}`; the editor engine is swappable behind `getSource/setSource/dispose` (`prism-editor.ts:14-18`) |
| Resource inspector | List of `{name, width, height, format}`; `read(name, rect) → pixels` (float-capable) or a blit to a target |
| Capture | Offline render callbacks (`ScreenshotPanelCallbacks` and `RecordingPanelCallbacks` are already this shape), current time, has-feedback flag |
| Layout | Named slots or a user builder function; today sandbox layouts expose only a canvas container, webgl-demos builders expose nothing back |

Both codebases lack two things: a disposal path owned by whatever creates the components, and scoped styling.
