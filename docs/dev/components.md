# Components

Deep dive into how each major component works and how to extend them.

## Table of Contents

1. [Uniforms System](#uniforms-system)
2. [Buffer Management](#buffer-management)
3. [Channel Binding](#channel-binding)
4. [Layout System](#layout-system)
5. [Keyboard Texture](#keyboard-texture)
6. [Preprocessing Pipeline](#preprocessing-pipeline)

---

## Uniforms System

### How Uniforms Work

Uniforms are values passed from CPU to GPU that remain constant for an entire draw call.

### Supported Uniforms

```glsl
uniform vec3 iResolution;   // Viewport resolution (width, height, 1.0)
uniform float iTime;        // Shader playback time (seconds)
uniform float iTimeDelta;   // Time since last frame (seconds)
uniform int iFrame;         // Current frame number
uniform vec4 iMouse;        // Mouse pixel coords (xy: current, zw: click)

uniform sampler2D iChannel0; // Texture channel 0
uniform sampler2D iChannel1; // Texture channel 1
uniform sampler2D iChannel2; // Texture channel 2
uniform sampler2D iChannel3; // Texture channel 3
```

### Querying Uniform Locations

Locations are queried once during shader compilation:

```typescript
function createPassUniforms(
  gl: WebGL2RenderingContext,
  program: WebGLProgram
): PassUniformLocations {
  return {
    program,
    iResolution: gl.getUniformLocation(program, 'iResolution'),
    iTime: gl.getUniformLocation(program, 'iTime'),
    iTimeDelta: gl.getUniformLocation(program, 'iTimeDelta'),
    iFrame: gl.getUniformLocation(program, 'iFrame'),
    iMouse: gl.getUniformLocation(program, 'iMouse'),
    iChannel: [
      gl.getUniformLocation(program, 'iChannel0'),
      gl.getUniformLocation(program, 'iChannel1'),
      gl.getUniformLocation(program, 'iChannel2'),
      gl.getUniformLocation(program, 'iChannel3'),
    ],
  };
}
```

### Binding Uniforms

Called every frame before drawing each pass:

```typescript
private bindUniforms(
  pass: RuntimePass,
  time: number,
  timeDelta: number,
  mouse: MouseState
): void {
  const gl = this.gl;
  const u = pass.uniforms;

  // Scalars
  if (u.iTime) gl.uniform1f(u.iTime, time);
  if (u.iTimeDelta) gl.uniform1f(u.iTimeDelta, timeDelta);
  if (u.iFrame) gl.uniform1i(u.iFrame, this._frame);

  // Vectors
  if (u.iResolution) {
    gl.uniform3f(u.iResolution, this._width, this._height, 1.0);
  }
  if (u.iMouse) {
    gl.uniform4f(u.iMouse, mouse[0], mouse[1], mouse[2], mouse[3]);
  }

  // Channels are bound separately (textures)
}
```

### Adding a New Uniform

**Step 1**: Add to shader preprocessor (if needed):
```glsl
uniform float iMyNewUniform;
```

**Step 2**: Add to `PassUniformLocations` type:
```typescript
export interface PassUniformLocations {
  // ... existing uniforms
  iMyNewUniform: WebGLUniformLocation | null;
}
```

**Step 3**: Query location in `createPassUniforms()`:
```typescript
iMyNewUniform: gl.getUniformLocation(program, 'iMyNewUniform'),
```

**Step 4**: Bind value in `bindUniforms()`:
```typescript
if (u.iMyNewUniform) {
  gl.uniform1f(u.iMyNewUniform, myValue);
}
```

**Step 5**: Provide value to `step()` or track in engine state.

---

## Buffer Management

### Ping-Pong Textures

When a buffer reads its own previous frame, we need **two textures**:
- **Current** - Where we write this frame
- **Previous** - Where we read from (last frame's output)

After rendering, we swap the references.

### RuntimePass Structure

```typescript
interface RuntimePass {
  name: PassName;
  projectChannels: ChannelSource[];  // What this pass reads
  vao: WebGLVertexArrayObject;       // Fullscreen triangle
  uniforms: PassUniformLocations;    // Cached uniform locations
  framebuffer: WebGLFramebuffer;     // Where we render to
  currentTexture: WebGLTexture;      // Output this frame
  previousTexture: WebGLTexture;     // Output last frame
}
```

### Creating Render Targets

Each pass gets two RGBA32F textures:

```typescript
const currentTexture = createRenderTargetTexture(gl, width, height);
const previousTexture = createRenderTargetTexture(gl, width, height);

const framebuffer = createFramebufferWithColorAttachment(gl, currentTexture);
```

RGBA32F provides:
- 32-bit float precision per channel
- Can store values outside [0, 1]
- Perfect for physics simulations, accumulation

### Render and Swap

```typescript
// 1. Bind framebuffer (writes to currentTexture)
gl.bindFramebuffer(gl.FRAMEBUFFER, pass.framebuffer);

// 2. Clear and render
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 3);

// 3. Swap textures for next frame
const temp = pass.currentTexture;
pass.currentTexture = pass.previousTexture;
pass.previousTexture = temp;

// 4. Reattach framebuffer to new currentTexture
gl.framebufferTexture2D(
  gl.FRAMEBUFFER,
  gl.COLOR_ATTACHMENT0,
  gl.TEXTURE_2D,
  pass.currentTexture,
  0
);
```

### Resize Handling

When canvas resizes, all render targets must be recreated:

```typescript
resize(width: number, height: number): void {
  for (const pass of this._passes) {
    // Delete old textures and framebuffer
    gl.deleteTexture(pass.currentTexture);
    gl.deleteTexture(pass.previousTexture);
    gl.deleteFramebuffer(pass.framebuffer);

    // Create new ones at new size
    pass.currentTexture = createRenderTargetTexture(gl, width, height);
    pass.previousTexture = createRenderTargetTexture(gl, width, height);
    pass.framebuffer = createFramebufferWithColorAttachment(
      gl,
      pass.currentTexture
    );
  }
}
```

**Important**: We do NOT reset `_frame` on resize. Frame counter is monotonic.

### Reset Handling

Reset clears all render targets and resets frame counter:

```typescript
reset(): void {
  this._frame = 0;

  const gl = this.gl;
  for (const pass of this._passes) {
    // Clear currentTexture
    gl.bindFramebuffer(gl.FRAMEBUFFER, pass.framebuffer);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Clear previousTexture (for ping-pong)
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      pass.previousTexture,
      0
    );
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Re-attach currentTexture
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      pass.currentTexture,
      0
    );
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
```

Clearing both textures is critical for accumulation shaders!

---

## Channel Binding

### Channel Sources

Channels can bind different types of resources:

```typescript
type ChannelSource =
  | { kind: 'buffer'; name: PassName; previous: boolean }
  | { kind: 'texture2d'; name: string; filter: Filter; wrap: Wrap }
  | { kind: 'keyboard' }
  | { kind: 'audio' }
  | { kind: 'webcam' }
  | { kind: 'video'; name: string }
  | { kind: 'script'; name: string }
  | { kind: 'none' };
```

### Resolution Flow

1. **Config** defines channels in JSON
2. **Project layer** normalizes to `ChannelSource[]`
3. **Engine** binds WebGLTexture for each channel

### Binding Process

```typescript
private bindChannel(
  pass: RuntimePass,
  channelIndex: number
): void {
  const source = pass.projectChannels[channelIndex];
  const texture = this.resolveChannelTexture(source, pass.name);

  // Bind texture to texture unit
  const gl = this.gl;
  gl.activeTexture(gl.TEXTURE0 + channelIndex);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set sampler uniform
  const location = pass.uniforms.iChannel[channelIndex];
  if (location) {
    gl.uniform1i(location, channelIndex);
  }
}
```

### Resolving Textures

```typescript
private resolveChannelTexture(
  source: ChannelSource,
  currentPassName: PassName
): WebGLTexture {
  switch (source.kind) {
    case 'buffer': {
      const runtimePass = this._passes.find(p => p.name === source.name);
      if (!runtimePass) throw new Error(`Buffer not found: ${source.name}`);

      // Use current or previous texture
      return source.previous
        ? runtimePass.previousTexture
        : runtimePass.currentTexture;
    }

    case 'texture2d': {
      const tex = this._textures.find(t => t.name === source.name);
      if (!tex) throw new Error(`Texture not found: ${source.name}`);
      return tex.texture;
    }

    case 'keyboard': {
      if (!this._keyboardTexture) {
        throw new Error('Keyboard texture not initialized');
      }
      return this._keyboardTexture.texture;
    }

    case 'none': {
      // Bind black 1x1 texture
      return this._blackTexture!;
    }
  }
}
```

### Adding New Channel Type

To add a new channel type:

1. Add to `ChannelSource` union in `src/project/types.ts`
2. Add to `ChannelJSON` union types
3. Handle in config normalization (`configHelpers.ts`)
4. Load the resource in the engine constructor
5. Handle in `resolveChannelTexture()` in `ShaderEngine.ts`
6. Update the texture each frame if it's dynamic (like audio or video)

See the existing implementations for audio, webcam, video, and script channels as examples.

---

## Layout System

### Factory Pattern

Layouts use a factory to create the appropriate layout class:

```typescript
export function createLayout(
  mode: LayoutMode,
  options: LayoutOptions
): BaseLayout {
  switch (mode) {
    case 'fullscreen': return new FullscreenLayout(options);
    case 'default': return new DefaultLayout(options);
    case 'split': return new SplitLayout(options);
    case 'tabbed': return new TabbedLayout(options);
    case 'ui': return new UILayout(options);
  }
}
```

### BaseLayout Interface

All layouts implement this interface:

```typescript
export interface BaseLayout {
  /**
   * Get the container element where App should create the canvas.
   */
  getCanvasContainer(): HTMLElement;

  /**
   * Clean up resources.
   */
  dispose(): void;
}
```

### Layout Implementation Pattern

Each layout:
1. Creates DOM structure in constructor
2. Imports its own CSS file
3. Provides canvas container
4. Handles its own cleanup

**Example: DefaultLayout**

```typescript
import './default.css';
import { BaseLayout, LayoutOptions } from './types';

export class DefaultLayout implements BaseLayout {
  private root: HTMLElement;
  private canvasContainer: HTMLElement;

  constructor(opts: LayoutOptions) {
    const { container } = opts;

    // Create DOM
    this.root = document.createElement('div');
    this.root.className = 'layout-default';

    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'canvas-container';

    this.root.appendChild(this.canvasContainer);
    container.appendChild(this.root);
  }

  getCanvasContainer(): HTMLElement {
    return this.canvasContainer;
  }

  dispose(): void {
    this.root.remove();
  }
}
```

### CSS Co-location

Each layout imports its CSS:

```typescript
import './default.css';
```

Vite processes this and bundles the CSS. In production, all CSS is extracted to a single file.

### Adding a New Layout

**Step 1**: Create layout class:
```typescript
// src/layouts/MyLayout.ts
import './my-layout.css';
import { BaseLayout, LayoutOptions } from './types';

export class MyLayout implements BaseLayout {
  private root: HTMLElement;
  private canvasContainer: HTMLElement;

  constructor(opts: LayoutOptions) {
    // Build DOM structure
  }

  getCanvasContainer(): HTMLElement {
    return this.canvasContainer;
  }

  dispose(): void {
    this.root.remove();
  }
}
```

**Step 2**: Create CSS file:
```css
/* src/layouts/my-layout.css */
.layout-my {
  /* Your styles */
}
```

**Step 3**: Add to factory:
```typescript
// src/layouts/index.ts
import { MyLayout } from './MyLayout';

export type LayoutMode = 'fullscreen' | 'default' | 'split' | 'tabbed' | 'ui' | 'my';

export function createLayout(
  mode: LayoutMode,
  options: LayoutOptions
): BaseLayout {
  switch (mode) {
    // ... existing cases
    case 'my': return new MyLayout(options);
  }
}
```

**Step 4**: Export from index:
```typescript
export { MyLayout } from './MyLayout';
```

Done! Users can now use `"layout": "my"` in their configs.

---

## Keyboard Texture

### Format

The keyboard texture is **256×3 RGBA32F**:
- **Width**: 256 (one column per ASCII keycode 0-255)
- **Height**: 3 rows
  - **Row 0** (sample at y=0.25): Current key state (0.0 = up, 1.0 = down)
  - **Row 1** (sample at y=0.5): Unused (reserved)
  - **Row 2** (sample at y=0.75): Toggle state (flips on each press)

### Creation

```typescript
export function createKeyboardTexture(
  gl: WebGL2RenderingContext
): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);

  const data = new Float32Array(256 * 3 * 4);  // RGBA

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA32F,     // Float precision
    256, 3,         // Width, height
    0,
    gl.RGBA,
    gl.FLOAT,
    data
  );

  // NEAREST filtering (no interpolation between keys!)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // CLAMP to edge
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindTexture(gl.TEXTURE_2D, null);
  return tex;
}
```

### State Tracking

Engine tracks keyboard state in Maps:

```typescript
private _keyStates: Map<number, boolean> = new Map();
private _toggleStates: Map<number, number> = new Map();

updateKeyState(keycode: number, isDown: boolean): void {
  const wasDown = this._keyStates.get(keycode) || false;

  // Update current state
  this._keyStates.set(keycode, isDown);

  // Toggle on press (down transition)
  if (isDown && !wasDown) {
    const currentToggle = this._toggleStates.get(keycode) || 0.0;
    this._toggleStates.set(keycode, currentToggle === 0.0 ? 1.0 : 0.0);
  }
}
```

### Texture Upload

Called every frame before rendering:

```typescript
export function updateKeyboardTexture(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  keyStates: Map<number, boolean>,
  toggleStates: Map<number, number>
): void {
  const width = 256;
  const height = 3;
  const data = new Float32Array(width * height * 4);

  // Fill data array
  for (let keycode = 0; keycode < 256; keycode++) {
    const isDown = keyStates.get(keycode) || false;
    const toggleValue = toggleStates.get(keycode) || 0.0;

    // Row 0: Current state
    const row0Index = (0 * width + keycode) * 4;
    data[row0Index + 0] = isDown ? 1.0 : 0.0;
    data[row0Index + 1] = isDown ? 1.0 : 0.0;
    data[row0Index + 2] = isDown ? 1.0 : 0.0;
    data[row0Index + 3] = 1.0;

    // Row 2: Toggle state
    const row2Index = (2 * width + keycode) * 4;
    data[row2Index + 0] = toggleValue;
    data[row2Index + 1] = toggleValue;
    data[row2Index + 2] = toggleValue;
    data[row2Index + 3] = 1.0;
  }

  // Upload to GPU
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texSubImage2D(
    gl.TEXTURE_2D,
    0,
    0, 0,           // Offset
    width, height,
    gl.RGBA,
    gl.FLOAT,
    data
  );
  gl.bindTexture(gl.TEXTURE_2D, null);
}
```

### App Integration

App forwards all keyboard events to engine:

```typescript
private setupKeyboardTracking(): void {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const keycode = e.keyCode;  // ASCII code
    if (keycode >= 0 && keycode < 256) {
      this.engine.updateKeyState(keycode, true);
    }
  });

  document.addEventListener('keyup', (e: KeyboardEvent) => {
    const keycode = e.keyCode;
    if (keycode >= 0 && keycode < 256) {
      this.engine.updateKeyState(keycode, false);
    }
  });
}
```

Before each frame:
```typescript
this.engine.updateKeyboardTexture();
this.engine.step(time, mouse);
```

---

## Preprocessing Pipeline

### Pipeline Stages

GLSL source goes through several transformations:

1. **Load** `common.glsl` (if exists)
2. **Prepend** common to each pass source
3. **Convert** cubemap texture() calls to equirectangular
4. **Wrap** in main() if needed (Shadertoy format)

### Prepending common.glsl

```typescript
export function preprocessGLSL(
  source: string,
  common: string | null
): string {
  if (!common) return source;

  return `${common}\n\n${source}`;
}
```

Simple concatenation. Common code is shared across all passes.

### Cubemap to Equirectangular

Shadertoy supports cubemaps: `texture(iChannel0, vec3)`

We only support 2D textures, so we convert:

```typescript
export function convertCubemapToEquirect(source: string): string {
  // Detect: texture(iChannelX, vec3)
  const cubemapPattern = /texture\s*\(\s*(iChannel[0-3])\s*,\s*([^)]+)\)/g;

  return source.replace(cubemapPattern, (match, channel, coords) => {
    // Check if coords is vec3
    if (isVec3Expression(coords)) {
      // Convert to equirectangular UV
      return `texture(${channel}, equirectUV(${coords}))`;
    }
    return match;  // Leave vec2 unchanged
  });
}
```

We inject a helper function:
```glsl
vec2 equirectUV(vec3 dir) {
  float phi = atan(dir.z, dir.x);
  float theta = acos(dir.y);
  return vec2(phi / (2.0 * PI), theta / PI);
}
```

This allows cubemap shaders to work with equirectangular images.

### Main Wrapper

Shadertoy shaders use `mainImage()`:
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) { ... }
```

We need a real `main()`:
```glsl
out vec4 fragColor;

void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() {
  mainImage(fragColor, gl_FragCoord.xy);
}
```

This wrapper is added automatically if the shader doesn't have `void main()`.

### Preprocessing Example

**Input** (`bufferA.glsl`):
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  vec3 env = texture(iChannel0, reflect(viewDir, normal)).rgb;
  fragColor = vec4(env, 1.0);
}
```

**After preprocessing**:
```glsl
#version 300 es
precision highp float;

// Common code injected here (if exists)

// Equirect helper
vec2 equirectUV(vec3 dir) {
  float phi = atan(dir.z, dir.x);
  float theta = acos(dir.y);
  return vec2(phi / 6.28318530718, theta / 3.14159265359);
}

// User code (converted)
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  vec3 env = texture(iChannel0, equirectUV(reflect(viewDir, normal))).rgb;
  fragColor = vec4(env, 1.0);
}

// Main wrapper
out vec4 fragColor;
void main() {
  mainImage(fragColor, gl_FragCoord.xy);
}
```

---

## Performance Considerations

### Texture Uploads

- Keyboard texture: 768 pixels × 4 channels = 3072 floats = ~12 KB
- Uploaded every frame (unavoidable)
- Uses `texSubImage2D` (no reallocation)

### State Changes

Minimize WebGL state changes:
- VAO binding: Once per pass
- Program binding: Once per pass
- Texture binding: 0-4 times per pass
- Framebuffer binding: Once per pass

### Memory Usage

For 1920×1080 resolution:
- Each pass: 2 textures × 1920 × 1080 × 4 channels × 4 bytes = ~66 MB
- 5 passes: ~330 MB VRAM
- Plus external textures, keyboard texture, etc.

At 4K (3840×2160), this quadruples to ~1.3 GB!

### Optimization Opportunities

1. **Lazy texture creation** - Don't create textures for unused passes
2. **Reduced precision** - Allow RGBA16F option for passes that don't need 32-bit
3. **Texture pooling** - Reuse textures for passes that don't overlap
4. **Mipmap generation** - For blur/downscaling effects

---

## Summary

Understanding these components gives you the knowledge to:
- Add new uniforms for shader features
- Implement new channel types
- Create custom layout modes
- Extend the preprocessing pipeline
- Optimize performance for your use case

The system is designed to be extensible while maintaining clean boundaries between components.
