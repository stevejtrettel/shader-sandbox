# Phase 1: Refactor App.ts

## Current state
`src/app/App.ts` is 2,042 lines handling: canvas setup, input (mouse/touch/keyboard), animation loop, stats/FPS display, playback controls UI, recording, HTML export, error overlays, media banners, context loss handling, and screen presentation.

## Strategy
Extract self-contained concerns into separate files in `src/app/`. App.ts becomes the coordinator that owns the canvas, engine, and animation loop, delegating everything else.

Each extracted module is a plain class (or function) that receives its dependencies via constructor — no frameworks, no over-abstraction. Modules expose state for App to read rather than reaching into the engine directly.

## Extractions (in order of implementation)

### 1. `src/app/exportHTML.ts` (~420 lines)
Extract from App.ts:
- `exportHTML()` (lines 1332-1381)
- `generateStandaloneHTML()` (lines 1386-1803)

Largest single block — the HTML template alone is 400+ lines. Completely self-contained with no dependency on App state.

Public interface:
```ts
function exportHTML(project: ShaderProject, engine: ShaderEngine): void;
```

### 2. `src/app/Recorder.ts` (~100 lines)
Extract from App.ts:
- `startRecording()` / `stopRecording()` / `toggleRecording()` (lines 1183-1270)
- `updateRecordButton()` / `showRecordingIndicator()` / `hideRecordingIndicator()` (lines 1275-1322)
- Recording state fields (lines 138-142)

Public interface:
```ts
class Recorder {
  isRecording: boolean;
  constructor(canvas: HTMLCanvasElement, container: HTMLElement, projectRoot: string);
  toggle(isPaused: boolean, unpause: () => void): void;
  stop(): void;
  dispose(): void;
}
```

### 3. `src/app/ErrorOverlay.ts` (~120 lines)
Extract from App.ts — **only** the shader error overlay and its parsing helpers:
- `showErrorOverlay()` / `hideErrorOverlay()` (lines 1867-2041)
- `parseShaderError()` / `friendlyGLSLError()` / `buildCodeContext()` / `escapeHTML()` (lines 1959-2031)

Context loss overlays and media banners stay in App.ts — they're small, tightly coupled to App lifecycle, and bundling them here would create a grab-bag of unrelated DOM.

Public interface:
```ts
class ErrorOverlay {
  constructor(container: HTMLElement);
  show(errors: CompilationError[], project: ShaderProject): void;
  hide(): void;
  dispose(): void;
}
```

### 4. `src/app/StatsPanel.ts` (~120 lines)
Extract from App.ts:
- Stats container/grid DOM creation (lines 157-192)
- `toggleStats()` (lines 551-569)
- `updateFps()` / `updateFrameDisplay()` / `updateTimeDisplay()` / `updateResolutionDisplay()` (lines 475-546)
- FPS/stats fields (lines 88-100)

Public interface:
```ts
class StatsPanel {
  constructor(container: HTMLElement);
  update(currentTimeSec: number, elapsedTime: number): void;
  reset(): void;
  incrementFrame(): void;
  updateResolution(w: number, h: number): void;
  dispose(): void;
}
```

### 5. `src/app/InputManager.ts` (~190 lines)
Extract from App.ts:
- `setupMouseTracking()` (lines 619-652)
- `setupTouchTracking()` (lines 662-750)
- `updateTouchState()` (lines 756-808)
- `setupKeyboardTracking()` (lines 939-955)
- `keyEventToAscii()` helper + `CODE_TO_ASCII` table (lines 19-58)
- Mouse/touch/keyboard state fields (lines 72-86)

**Key design decision:** InputManager only tracks state — it does not call into the engine. App reads `inputManager.mouse`, `inputManager.touchState`, `inputManager.keyEvents` each frame and forwards to the engine. This matches how mouse/touch already work and avoids coupling input to WebGL.

The `onFirstGesture` callback stays so App can trigger media initialization on first user interaction.

Public interface:
```ts
class InputManager {
  readonly mouse: MouseState;
  readonly isMouseDown: boolean;
  readonly touchState: TouchState;
  onFirstGesture: (() => void) | null;
  constructor(canvas: HTMLCanvasElement, pixelRatio: number);
  getAndClearKeyEvents(): Array<{ keycode: number; down: boolean }>;
  dispose(): void;
}
```

### 6. `src/app/PlaybackControls.ts` (~100 lines)
Extract from App.ts:
- `createControls()` (lines 817-913)
- `toggleControlsMenu()` (lines 919-933)
- `updatePlayPauseButton()` (lines 1808-1826)
- Control state fields (lines 103-108)

**DOM buttons only.** Keyboard shortcuts (Space for play/pause, R for reset, S for screenshot) stay in App.ts — they're document-level bindings that don't belong in a button panel class.

Public interface:
```ts
class PlaybackControls {
  constructor(container: HTMLElement, callbacks: {
    onTogglePlayPause: () => void;
    onReset: () => void;
    onScreenshot: () => void;
    onToggleRecording: () => void;
    onExportHTML: () => void;
  });
  setPaused(paused: boolean): void;
  setRecording(recording: boolean): void;
  dispose(): void;
}
```

## What stays in App.ts (~400 lines)

After all extractions, App.ts retains:
- Constructor (canvas creation, WebGL init, engine init, wire up modules)
- `start()` / `stop()` / `dispose()`
- `animate()` loop (reads input state, forwards to engine, calls stats)
- `presentToScreen()`
- `reset()` / `togglePlayPause()` / `screenshot()` (thin delegates)
- Script API setup
- Resize observer
- Keyboard shortcuts (Space, R, S — document-level, ~30 lines)
- Context loss handling (~50 lines, tightly coupled to engine lifecycle)
- Media banner (~30 lines, tightly coupled to engine init)

No public API changes — all existing consumers (`main.ts`, `embed.ts`, layouts) continue working unchanged.

## Order of implementation
Each step is independently testable — the project compiles and runs after each one:

1. **exportHTML** — largest single block, zero entanglement
2. **Recorder** — self-contained, only touches canvas + DOM
3. **ErrorOverlay** — self-contained error display + parsing logic
4. **StatsPanel** — self-contained DOM + counters
5. **InputManager** — state-only input tracking, App forwards to engine
6. **PlaybackControls** — DOM buttons, wired via callbacks
