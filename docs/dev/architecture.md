# Architecture

This document explains the system design, data flow, and key architectural decisions.

## Overview

Shader Sandbox is built with a clean **layered architecture** that separates concerns and maintains strong boundaries between components.

```
┌─────────────────────────────────────────────┐
│              User Interface                 │
│         (Layouts + App Layer)               │
├─────────────────────────────────────────────┤
│              Engine Layer                   │
│        (WebGL Execution)                    │
├─────────────────────────────────────────────┤
│             Project Layer                   │
│    (Config Loading & Normalization)         │
└─────────────────────────────────────────────┘
```

Each layer has a specific responsibility and communicates through well-defined interfaces.

## Layer Breakdown

### 1. Project Layer (`src/project/`)

**Responsibility**: Load and normalize shader configurations into a standard format.

**Key Files**:
- `types.ts` - Type definitions for configs and normalized projects
- `loadProject.ts` - Loads projects from disk (Node.js, used by build scripts)
- `loaderHelper.ts` - Runtime loader for bundled demos in browser

**Input**: Raw config files + GLSL source files
**Output**: Normalized `ShaderProject` object

**Key Responsibilities**:
- Parse JSON configs
- Load GLSL source files
- Detect single-pass vs multi-pass projects
- Validate configuration
- Normalize defaults (missing channels → `kind: 'none'`)
- Set layout and controls defaults

**Design Decision**: This layer ensures the engine always receives **valid, normalized data**. The engine never needs to handle edge cases like missing passes or optional fields.

### 2. Engine Layer (`src/engine/`)

**Responsibility**: Execute shaders using WebGL with Shadertoy semantics.

**Key Files**:
- `ShaderEngine.ts` - Main engine class
- `types.ts` - Engine-specific types (RuntimePass, EngineStats, etc.)
- `glHelpers.ts` - WebGL utility functions

**Input**: `ShaderProject` + WebGL context
**Output**: Renders frames to framebuffers

**Key Responsibilities**:
- Build fragment shaders with Shadertoy boilerplate
- Inject common.glsl into all passes
- Convert cubemap texture() calls to equirectangular
- Compile GLSL shaders
- Create WebGL resources (programs, VAOs, framebuffers, textures)
- Bind Shadertoy uniforms (`iTime`, `iResolution`, `iFrame`, etc.)
- Bind custom uniforms and array uniforms (UBOs)
- Execute passes in order (BufferA → BufferB → ... → Image)
- Manage ping-pong textures for self-referencing buffers
- Bind channels (buffers, textures, keyboard, audio, webcam, video, script)
- Track keyboard state and update keyboard texture
- Update media textures (audio FFT, webcam, video) each frame
- Support both Shadertoy mode and standard mode shader compilation

**Design Decision**: The engine is **stateless across frames** - it just executes what it's told. The App layer controls timing and the animation loop.

### 3. App Layer (`src/app/`)

**Responsibility**: Browser runtime, animation loop, and user interface.

**Key Files**:
- `App.ts` - Main application class
- `types.ts` - App-specific types (AppOptions, MouseState)
- `app.css` - UI styles (FPS counter, controls, error overlay)

**Input**: Container element + `ShaderProject`
**Output**: Running application with UI

**Key Responsibilities**:
- Create and manage canvas
- Run animation loop (`requestAnimationFrame`)
- Track FPS and display counter
- Handle mouse events → update `iMouse`
- Handle touch events → update `iTouch0-2`, `iPinch`, etc.
- Handle keyboard events → forward to engine
- Manage playback state (play/pause/reset)
- Screenshot and video recording (WebM)
- HTML export for standalone playback
- Present engine output to screen via `blitFramebuffer`
- Handle resize events
- Handle WebGL context loss and recovery
- Display shader compilation errors
- Initialize and manage audio/webcam permissions
- Run JavaScript script hooks (`setup`, `onFrame`)
- Manage custom uniform UI panel

**Design Decision**: App layer handles **all browser APIs** and UI concerns. The engine never touches DOM or browser events.

### 4. Layout Layer (`src/layouts/`)

**Responsibility**: Different display modes for the shader viewer.

**Key Files**:
- `FullscreenLayout.ts` - Canvas fills container
- `DefaultLayout.ts` - Single pane with decoration
- `SplitLayout.ts` - Canvas + code viewer side-by-side
- `index.ts` - Factory function
- `types.ts` - BaseLayout interface

**Input**: Container + project
**Output**: Layout-specific DOM structure

**Key Responsibilities**:
- Create DOM structure for layout (arrangement only)
- Import and manage layout-specific CSS
- Provide canvas container to App
- Handle syntax highlighting (SplitLayout only)

**Design Decision**: Layouts separate three concerns:
- **Arrangement** (flex/grid) — handled by layout CSS
- **Decoration** (border-radius, box-shadow) — controlled via CSS custom properties (`--pane-radius`, `--pane-shadow`), toggleable via `.unstyled` class
- **Positioning** (centering, padding) — caller's responsibility (dev adds padding via `.dev-padded`)

Layouts fill their container 100% and arrange children. Single-pane layouts apply decoration to the container itself. Multi-pane layouts leave the outer container invisible and apply decoration to each child pane.

## Data Flow

### Startup Sequence

```
1. Entry point (main.ts / embed.ts / <live-app>)
   ↓
2. loadDemoProject() via generatedLoader
   ↓
3. Project Layer: Load config, load GLSL, normalize
   ↓
4. Returns ShaderProject
   ↓
5. mount(el, { project }) — core API
   ↓
6. Toggle .unstyled class if styled=false
   ↓
7. createLayout(mode, { container, project })
   ↓
8. Layout creates DOM structure
   ↓
9. Wire up handlers (recompile, uniform, UILayout)
   ↓
10. new App({ container: layout.getCanvasContainer(), project })
   ↓
11. App creates canvas, WebGL context
   ↓
12. new ShaderEngine({ gl, project })
   ↓
13. Engine compiles shaders, creates resources
   ↓
14. app.start() begins animation loop
```

### Per-Frame Execution

```
1. requestAnimationFrame callback
   ↓
2. App.animate(timestamp)
   ↓
3. engine.updateKeyboardTexture()
   ↓
4. engine.step(time, mouse)
   ↓
5. Engine executes passes in order:
   ├─ For each pass:
   │  ├─ Bind framebuffer
   │  ├─ Bind uniforms (iTime, iResolution, etc.)
   │  ├─ Bind channels (iChannel0-3)
   │  ├─ Draw fullscreen triangle
   │  └─ Swap ping-pong textures
   │
6. Engine returns
   ↓
7. App.presentToScreen() (blits Image pass to canvas)
   ↓
8. App.updateFps()
```

### Channel Binding Flow

When the engine needs to bind `iChannel0` for a pass:

```
1. Look up channel source in pass.projectChannels[0]
   ↓
2. Switch on source.kind:
   │
   ├─ kind: 'buffer'
   │  ├─ Find runtime pass by name
   │  ├─ Use currentTexture or previousTexture
   │  └─ Bind to texture unit 0
   │
   ├─ kind: 'texture2D'
   │  ├─ Find runtime texture by name
   │  └─ Bind to texture unit 0
   │
   ├─ kind: 'keyboard'
   │  ├─ Get keyboard texture
   │  └─ Bind to texture unit 0
   │
   ├─ kind: 'audio'
   │  ├─ Get audio FFT/waveform texture
   │  └─ Bind to texture unit 0
   │
   ├─ kind: 'webcam'
   │  ├─ Get webcam video texture
   │  └─ Bind to texture unit 0
   │
   ├─ kind: 'video'
   │  ├─ Get video file texture
   │  └─ Bind to texture unit 0
   │
   ├─ kind: 'script'
   │  ├─ Get script-uploaded texture
   │  └─ Bind to texture unit 0
   │
   └─ kind: 'none'
      └─ Bind black 1x1 texture
```

## Key Design Decisions

### 1. Normalization at Load Time

**Decision**: All validation and normalization happens in the Project layer.

**Why**:
- Engine code is simpler (no edge cases)
- Errors caught early (at load time, not render time)
- Type system guarantees valid data

**Example**: Missing channels are filled with `{ kind: 'none' }` so the engine always has exactly 4 channels per pass.

### 2. Ping-Pong Automatic Detection

**Decision**: Self-referencing buffers automatically get ping-pong textures.

**Why**:
- Users don't need to understand ping-pong
- Matches Shadertoy behavior exactly
- No extra configuration needed

**How**: Engine detects when a pass reads its own buffer and automatically uses the previous texture.

### 3. Stateless Engine

**Decision**: Engine doesn't control timing or decide when to render.

**Why**:
- Clean separation of concerns
- Easy to test (just call `step()`)
- App controls pause/play without engine knowledge

**How**: App calls `engine.step(time, mouse)` each frame. Engine just executes.

### 4. WebGL Resource Ownership

**Decision**: Engine owns **all** WebGL resources.

**Why**:
- Clear ownership (engine creates, engine disposes)
- App never touches WebGL directly
- Prevents resource leaks

**Resources**:
- Shader programs
- VAOs (Vertex Array Objects)
- Framebuffers
- Textures (render targets + external)
- Keyboard texture

### 5. CSS Co-location

**Decision**: Each layout imports its own CSS file.

**Why**:
- Modular - CSS lives with the component that needs it
- Vite bundles efficiently (tree-shaking works)
- No global CSS pollution

**How**: TypeScript imports like `import './fullscreen.css'` are processed by Vite.

### 6. Factory Pattern for Layouts

**Decision**: Layouts created via factory function, not direct instantiation.

**Why**:
- Easy to add new layouts
- Clean switch based on mode string
- Main doesn't need to know about all layout classes

**Code**:
```typescript
const layout = createLayout(project.layout, options);
```

## WebGL Resource Management

### Texture Strategy

**Render Targets** (ping-pong):
- Each pass has `currentTexture` and `previousTexture`
- After rendering, swap them
- Both are RGBA32F (float precision)

**External Textures**:
- Loaded asynchronously at startup
- Stored in `_textures` array
- RGBA8 format (images)

**Keyboard Texture**:
- 256×3 RGBA32F texture
- Updated every frame before rendering
- Row 0: current key state, Row 2: toggle state

### Framebuffer Strategy

Each pass has one framebuffer:
- Attached to `currentTexture`
- Reattached after ping-pong swap
- Used for rendering that pass

The Image pass output is blitted to screen using `gl.blitFramebuffer()`.

### Vertex Array Objects (VAOs)

All passes share one VAO for a fullscreen triangle:
- 3 vertices: (-1,-1), (3,-1), (-1,3)
- Covers entire clip space
- More efficient than quad (2 triangles)

## Performance Considerations

### Minimize State Changes

WebGL state changes are expensive. The engine:
- Shares VAO across all passes
- Binds program once per pass
- Binds textures in order (texture unit 0-3)
- Minimizes framebuffer binds

### Texture Uploads

Keyboard texture is the only texture updated per frame:
- Small (256×3 = 768 pixels)
- Uses `texSubImage2D` (no reallocation)
- Uploaded once before all passes

### No Redundant Work

- Canvas resize only updates when size actually changes
- FPS counter only updates ~once per second
- Compilation errors cached (not re-checked each frame)

## Error Handling

### Compile-Time Errors

Shader compilation errors are:
1. Caught during engine construction
2. Stored in `_compilationErrors` array
3. Checked by App via `engine.hasErrors()`
4. Displayed in overlay (App responsibility)
5. Animation loop not started

### Runtime Errors

Rare, but possible:
- Invalid framebuffer configurations → throw Error
- Missing resources → throw Error
- WebGL context loss → automatic recovery with engine reinitialization

**Philosophy**: Fail fast and loudly during development.

## Type Safety

### Strong Typing Throughout

- Project layer: `ShaderProject`, `ShaderPass`, `Channels`
- Engine layer: `RuntimePass`, `RuntimeTexture2D`, `PassUniformLocations`
- App layer: `AppOptions`, `MouseState`

### Discriminated Unions

Channel sources use discriminated unions:

```typescript
type ChannelSource =
  | { kind: 'none' }
  | { kind: 'buffer'; buffer: PassName; previous: boolean }
  | { kind: 'texture2D'; name: string }
  | { kind: 'keyboard' }
  | { kind: 'audio' }
  | { kind: 'webcam' }
  | { kind: 'video'; name: string }
  | { kind: 'script'; name: string };
```

TypeScript ensures exhaustive checking in switch statements.

### Tuple Types

Channels use a fixed-length tuple:

```typescript
type Channels = [ChannelSource, ChannelSource, ChannelSource, ChannelSource];
```

This guarantees exactly 4 channels per pass at compile time.

### Null Safety

- Optional fields use `| null`, not `| undefined`
- Required fields are non-nullable
- Uniforms are `WebGLUniformLocation | null` (matching WebGL API)

## Extension Points

### Adding New Uniform Types

1. Add to `PassUniformLocations` type
2. Query location in pass initialization
3. Bind in `bindBuiltinUniforms()`

### Adding New Channel Types

1. Add to `ChannelSource` union
2. Add to `ChannelJSON` union
3. Handle in `resolveChannelTexture()`

### Adding New Layout Modes

1. Create `NewLayout.ts` class implementing `BaseLayout`
2. Create `new-layout.css` for styles
3. Add to factory in `layouts/index.ts`
4. Add to `LayoutMode` type

## Known Limitations

- No native cubemap textures (converted to equirectangular)
- Fixed 4 channels per pass
- Maximum 5 passes (BufferA-D + Image)
- HTML export excludes array uniforms, audio, webcam, video, and script hooks

## Summary

The architecture emphasizes:
- **Clear separation of concerns** - Each layer has one job
- **Strong typing** - TypeScript prevents bugs
- **Predictable data flow** - One-way flow from config to rendering
- **Modularity** - Easy to extend and maintain
- **Performance** - Minimal overhead, efficient WebGL usage
