/**
 * Project Layer - Type Definitions for Shadertoy Projects
 *
 * Pure TypeScript interfaces matching Shadertoy's mental model.
 * Based on docs/project-spec.md
 */

// =============================================================================
// Pass Names (Fixed set matching Shadertoy)
// =============================================================================

export type PassName = 'Image' | 'BufferA' | 'BufferB' | 'BufferC' | 'BufferD';

/**
 * Theme mode for the shader viewer.
 * - 'auto': Host mode — inherits page fonts/colors, auto-detects light/dark for syntax
 * - 'light': Always use light theme (self-styled)
 * - 'dark': Always use dark theme (self-styled)
 * - 'system': Follow OS preference (self-styled)
 */
export type ThemeMode = 'auto' | 'light' | 'dark' | 'system';

// =============================================================================
// Custom Uniform Definitions
// =============================================================================

/**
 * Supported uniform types for user-defined controls.
 * For now, we start with float only. More types will be added later.
 */
export type UniformType = 'float' | 'int' | 'bool' | 'vec2' | 'vec3' | 'vec4';

/**
 * Base uniform definition shared by all types.
 */
interface UniformDefinitionBase {
  /** Display label (defaults to uniform name if not provided) */
  label?: string;
  /** If true, uniform is declared but has no UI control (for script-only uniforms) */
  hidden?: boolean;
}

/**
 * Float uniform with slider control.
 */
export interface FloatUniformDefinition extends UniformDefinitionBase {
  type: 'float';
  value: number;
  min?: number;   // Default: 0
  max?: number;   // Default: 1
  step?: number;  // Default: 0.01
}

/**
 * Integer uniform with discrete slider.
 */
export interface IntUniformDefinition extends UniformDefinitionBase {
  type: 'int';
  value: number;
  min?: number;   // Default: 0
  max?: number;   // Default: 10
  step?: number;  // Default: 1
}

/**
 * Boolean uniform with toggle control.
 */
export interface BoolUniformDefinition extends UniformDefinitionBase {
  type: 'bool';
  value: boolean;
}

/**
 * Vec2 uniform (2D position picker).
 */
export interface Vec2UniformDefinition extends UniformDefinitionBase {
  type: 'vec2';
  value: [number, number];
  min?: [number, number];   // Default: [0, 0]
  max?: [number, number];   // Default: [1, 1]
}

/**
 * Vec3 uniform (color picker or 3D value).
 */
export interface Vec3UniformDefinition extends UniformDefinitionBase {
  type: 'vec3';
  value: [number, number, number];
  /** If true, use color picker UI. Otherwise use 3 sliders. */
  color?: boolean;
  /** Per-component min (default: [0, 0, 0]) */
  min?: [number, number, number];
  /** Per-component max (default: [1, 1, 1]) */
  max?: [number, number, number];
  /** Per-component step (default: [0.01, 0.01, 0.01]) */
  step?: [number, number, number];
}

/**
 * Vec4 uniform (color with alpha or 4D value).
 */
export interface Vec4UniformDefinition extends UniformDefinitionBase {
  type: 'vec4';
  value: [number, number, number, number];
  /** If true, use color picker with alpha. Otherwise use 4 sliders. */
  color?: boolean;
  /** Per-component min (default: [0, 0, 0, 0]) */
  min?: [number, number, number, number];
  /** Per-component max (default: [1, 1, 1, 1]) */
  max?: [number, number, number, number];
  /** Per-component step (default: [0.01, 0.01, 0.01, 0.01]) */
  step?: [number, number, number, number];
}

/**
 * Array uniform types supported in UBOs.
 */
export type ArrayUniformType = 'float' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4';

/**
 * Array uniform backed by a Uniform Buffer Object (UBO).
 * Data is provided from JavaScript via setUniformValue().
 * The engine auto-injects the layout(std140) uniform block into the shader.
 */
export interface ArrayUniformDefinition extends UniformDefinitionBase {
  type: ArrayUniformType;
  /** Number of elements in the array */
  count: number;
  /** Path to a JSON file with initial data (loaded at project init) */
  data?: string;
}

/**
 * Field types allowed in struct array uniforms.
 */
export type StructFieldType = 'float' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4';

/**
 * Struct array uniform backed by a UBO.
 * Each element is a struct with named fields of different types.
 * Uses one binding point for all fields combined.
 */
export interface StructArrayUniformDefinition extends UniformDefinitionBase {
  struct: Record<string, StructFieldType>;
  /** Number of elements in the array */
  count: number;
  /** Path to a JSON file with initial data (loaded at project init) */
  data?: string;
}

/**
 * Type guard: returns true if a uniform definition is a plain array uniform (not struct).
 */
export function isArrayUniform(def: UniformDefinition): def is ArrayUniformDefinition {
  return 'count' in def && typeof (def as any).count === 'number' && !('struct' in def);
}

/**
 * Type guard: returns true if a uniform definition is a struct array uniform.
 */
export function isStructArrayUniform(def: UniformDefinition): def is StructArrayUniformDefinition {
  return 'struct' in def && typeof (def as any).struct === 'object' && 'count' in def;
}

/**
 * Type guard: returns true if a uniform definition is any UBO-backed uniform (array or struct array).
 */
export function isAnyUBOUniform(def: UniformDefinition): def is ArrayUniformDefinition | StructArrayUniformDefinition {
  return isArrayUniform(def) || isStructArrayUniform(def);
}

/**
 * Returns true if a uniform should have a UI control.
 * Excludes UBO-backed uniforms and hidden uniforms (script-only).
 */
export function hasUIControl(def: UniformDefinition): boolean {
  return !isAnyUBOUniform(def) && !def.hidden;
}

/**
 * Union of all uniform definition types.
 */
export type UniformDefinition =
  | FloatUniformDefinition
  | IntUniformDefinition
  | BoolUniformDefinition
  | Vec2UniformDefinition
  | Vec3UniformDefinition
  | Vec4UniformDefinition
  | ArrayUniformDefinition
  | StructArrayUniformDefinition;

/**
 * Map of uniform names to their definitions.
 */
export type UniformDefinitions = Record<string, UniformDefinition>;

/**
 * A single uniform value at runtime.
 */
export type UniformValue = number | boolean | number[] | Float32Array;

/**
 * Runtime uniform values (current state).
 * Keys are uniform names, values are the current value.
 */
export type UniformValues = Record<string, UniformValue>;

// =============================================================================
// Channel Definitions (JSON Config Format)
// =============================================================================

/**
 * Reference to another buffer pass.
 * By default, reads the previous frame (safe for all cases).
 * Use current: true to read from a buffer that has already run this frame.
 */
export interface ChannelJSONBuffer {
  buffer: PassName;
  current?: boolean;  // Default: false (read previous frame)
}

/**
 * Reference to external texture (image file).
 */
export interface ChannelJSONTexture {
  texture: string;  // Path to image file
  filter?: 'nearest' | 'linear';  // Default: 'linear'
  wrap?: 'clamp' | 'repeat';      // Default: 'repeat'
  type?: '2d' | 'cubemap';        // Default: '2d'. Cubemap uses equirectangular projection.
}

/**
 * Reference to keyboard texture (runtime-provided).
 */
export interface ChannelJSONKeyboard {
  keyboard: true;
}

/**
 * Reference to audio input (microphone).
 * Provides a 512x2 texture: row 0 = FFT spectrum, row 1 = waveform.
 */
export interface ChannelJSONAudio {
  audio: true;
}

/**
 * Reference to webcam input.
 */
export interface ChannelJSONWebcam {
  webcam: true;
}

/**
 * Reference to a video file.
 */
export interface ChannelJSONVideo {
  video: string;  // Path to video file
}

/**
 * Reference to a script-uploaded texture.
 * The texture is created/updated at runtime via engine.updateTexture().
 */
export interface ChannelJSONScript {
  script: string;  // Texture name (matched by script's updateTexture calls)
}

/**
 * Union type for channel sources in JSON config (object form).
 */
export type ChannelJSONObject =
  | ChannelJSONBuffer
  | ChannelJSONTexture
  | ChannelJSONKeyboard
  | ChannelJSONAudio
  | ChannelJSONWebcam
  | ChannelJSONVideo
  | ChannelJSONScript;

/**
 * Channel value in simplified config format.
 * Can be a string shorthand or full object:
 * - "BufferA", "BufferB", etc. → buffer reference
 * - "keyboard" → keyboard input
 * - "audio" → microphone audio input
 * - "webcam" → webcam video input
 * - "photo.jpg" (with extension) → texture file
 * - { buffer: "BufferA" } → explicit buffer with options
 * - { texture: "photo.jpg", filter: "nearest" } → texture with options
 * - { video: "clip.mp4" } → video file
 * - { script: "myData" } → script-uploaded texture
 */
export type ChannelValue = string | ChannelJSONObject;

// =============================================================================
// Config Format (config.json) - Simplified flat format
// =============================================================================

/**
 * Pass configuration in simplified format.
 * Channel bindings are directly on the pass object.
 *
 * Example:
 * {
 *   "iChannel0": "BufferA",
 *   "iChannel1": "photo.jpg",
 *   "source": "custom.glsl"  // optional
 * }
 */
export interface PassConfigSimplified {
  /** Optional custom source file path */
  source?: string;
  /** Channel bindings - string shorthand or full object */
  iChannel0?: ChannelValue;
  iChannel1?: ChannelValue;
  iChannel2?: ChannelValue;
  iChannel3?: ChannelValue;
}

/**
 * Top-level config.json structure (simplified flat format).
 *
 * Example:
 * {
 *   "title": "My Shader",
 *   "layout": "split",
 *   "controls": true,
 *
 *   "BufferA": {
 *     "iChannel0": "BufferA"
 *   },
 *   "Image": {
 *     "iChannel0": "BufferA"
 *   }
 * }
 */
export interface ShadertoyConfig {
  /** Must be 'shadertoy' to use Shadertoy-compatible iChannel mode. */
  mode: 'shadertoy';

  // Metadata (flat, not nested)
  title?: string;
  author?: string;
  description?: string;

  // Settings
  layout?: 'fullscreen' | 'default' | 'split' | 'tabbed';
  theme?: ThemeMode;
  /** Optional master switch for `stats` and `playback`. When true: both shown.
   *  When false or unset: both hidden by default. Explicit per-field values
   *  always win. Does not affect `uniformsUI`. */
  controls?: boolean;
  /** Show the FPS / resolution overlay. Default false (opt in via `controls: true`
   *  or `stats: true`). */
  stats?: boolean;
  /** Show the playback bar (play/pause, screenshot, record). Default false (opt
   *  in via `controls: true` or `playback: true`). */
  playback?: boolean;
  /** How the uniforms UI is presented. 'panel' = collapsible toggle in top-right,
   *  'inline' = bare slider over the shader (bottom-right), 'off' = hidden.
   *  Default 'panel'. Panel/inline only render when at least one uniform has a
   *  UI control, so configs without UI uniforms get no panel automatically. */
  uniformsUI?: 'panel' | 'inline' | 'off';
  common?: string;

  // Playback settings
  /** Start paused on first frame (default: false) */
  startPaused?: boolean;

  /** If true, releasing the mouse leaves iMouse.zw positive so shaders that
   *  gate on `iMouse.z > 0.0` keep the last drag position (default: false). */
  stickyMouse?: boolean;

  // Resolution settings
  /** Pixel ratio multiplier (default: window.devicePixelRatio). Use <1 for lower resolution. */
  pixelRatio?: number;

  // Passes (at top level)
  Image?: PassConfigSimplified;
  BufferA?: PassConfigSimplified;
  BufferB?: PassConfigSimplified;
  BufferC?: PassConfigSimplified;
  BufferD?: PassConfigSimplified;
}

// =============================================================================
// Standard Mode Config (Named Buffers & Textures)
// =============================================================================

/**
 * Per-buffer configuration in standard mode.
 */
export interface StandardBufferConfig {
  filter?: 'nearest' | 'linear';
  wrap?: 'clamp' | 'repeat';
}

/**
 * Standard mode config format.
 * Buffers and textures are available everywhere by name.
 * Also supports pass-level configs (Image, BufferA, etc.) for simple cases
 * where named buffers aren't needed.
 */
export interface StandardConfig {
  mode?: 'standard';

  // Metadata
  title?: string;
  author?: string;
  description?: string;

  // Settings
  layout?: 'fullscreen' | 'default' | 'split' | 'tabbed';
  theme?: ThemeMode;
  /** Optional master switch — see ShadertoyConfig for semantics. */
  controls?: boolean;
  /** Show the FPS / resolution overlay. Default false. */
  stats?: boolean;
  /** Show the playback bar. Default false. */
  playback?: boolean;
  /** How the uniforms UI is presented: 'panel' (default) | 'inline' | 'off'. */
  uniformsUI?: 'panel' | 'inline' | 'off';
  common?: string;
  startPaused?: boolean;
  /** If true, releasing the mouse leaves iMouse.zw positive so shaders that
   *  gate on `iMouse.z > 0.0` keep the last drag position (default: false). */
  stickyMouse?: boolean;
  pixelRatio?: number;

  // Custom uniforms
  uniforms?: UniformDefinitions;

  /**
   * Named buffers (framebuffers with ping-pong).
   * Max 4 buffers (maps to BufferA-D internally).
   */
  buffers?: Record<string, StandardBufferConfig>;

  /**
   * Named textures available in all passes.
   * Value is a file path or special source: "keyboard", "audio", "webcam".
   */
  textures?: Record<string, string>;
}

/**
 * Union of all config formats that can appear in config.json.
 */
export type ProjectConfig = ShadertoyConfig | StandardConfig;

// =============================================================================
// Multi-View Config (Multiple Coupled Shaders)
// =============================================================================

/**
 * Layout modes for multi-view projects.
 * - 'split': 2 views side-by-side (responsive: horizontal on wide, vertical on narrow)
 * - 'quad': 4 views in 2x2 grid
 * - 'inset': First view fullscreen, second view as minimizable overlay
 */
export type MultiViewLayoutMode = 'split' | 'quad' | 'grid' | 'inset';

/**
 * Multi-view config format.
 * Displays multiple coupled shaders with shared time/uniforms
 * but independent mouse/touch input per view.
 *
 * Example:
 * {
 *   "views": ["mandelbrot", "julia"],
 *   "layout": "split"
 * }
 *
 * Files: mandelbrot.glsl, julia.glsl (or mandelbrot/image.glsl for buffers)
 */
export interface MultiViewConfig extends Omit<StandardConfig, 'layout'> {
  /** View names. Each corresponds to {name}.glsl or {name}/image.glsl */
  views: string[];
  /** Layout mode for arranging views. Default: 'split' */
  layout?: MultiViewLayoutMode;
}

/**
 * Check if a config is a multi-view config.
 */
export function isMultiViewConfig(config: ProjectConfig | MultiViewConfig): config is MultiViewConfig {
  return 'views' in config && Array.isArray((config as any).views);
}

// =============================================================================
// Internal Channel Representation (Normalized)
// =============================================================================

/**
 * Normalized channel source for engine consumption.
 * All channels are represented as one of these discriminated union variants.
 */
export type ChannelSource =
  | { kind: 'none' }
  | { kind: 'buffer'; buffer: PassName; current: boolean }
  | { kind: 'texture'; name: string; cubemap: boolean }  // Internal texture ID (e.g., "tex0")
  | { kind: 'keyboard' }
  | { kind: 'audio' }
  | { kind: 'webcam' }
  | { kind: 'video'; src: string }
  | { kind: 'script'; name: string };

/**
 * Exactly 4 channels (iChannel0-3), matching Shadertoy's fixed channel count.
 */
export type Channels = [ChannelSource, ChannelSource, ChannelSource, ChannelSource];

// =============================================================================
// Texture Definitions
// =============================================================================

/**
 * External 2D texture loaded from image file.
 * Textures are deduplicated by (source, filter, wrap) tuple.
 */
export interface ShaderTexture2D {
  name: string;  // Internal ID (e.g., "tex0", "tex1")
  filename?: string;  // Original filename for display (e.g., "texture.png")
  source: string;  // Path/URL to image file
  filter: 'nearest' | 'linear';
  wrap: 'clamp' | 'repeat';
}

// =============================================================================
// Pass Definition (In-Memory)
// =============================================================================

/**
 * A single shader pass in the rendering pipeline.
 */
export interface ShaderPass {
  name: PassName;
  glslSource: string;  // Full GLSL source code
  channels: Channels;  // iChannel0..3
  /** Named samplers (standard mode). Maps sampler name → source. */
  namedSamplers?: Map<string, ChannelSource>;
}

// =============================================================================
// Project Metadata
// =============================================================================

/**
 * Project metadata (title, author, description).
 */
export interface ShaderMeta {
  title: string;
  author: string | null;
  description: string | null;
}

// =============================================================================
// Main Project Definition (Normalized, Engine-Ready)
// =============================================================================

/**
 * Complete in-memory representation of a Shadertoy project.
 * Produced by loadProject() and consumed by ShaderEngine.
 *
 * Guarantees:
 * - passes.Image always exists
 * - All passes have exactly 4 channels (missing → kind: 'none')
 * - Textures are deduplicated
 * - All paths resolved and GLSL loaded
 */
export interface ShaderProject {
  /**
   * Project mode. 'shadertoy' uses iChannel0-3, 'standard' uses named samplers.
   * Defaults to 'standard' if not specified.
   */
  mode: 'shadertoy' | 'standard';

  /**
   * Project root directory path.
   */
  root: string;

  /**
   * Project metadata.
   */
  meta: ShaderMeta;

  /**
   * Layout mode for the shader viewer.
   */
  layout: 'fullscreen' | 'default' | 'split' | 'tabbed';

  /**
   * Theme mode for the shader viewer.
   * Defaults to 'light' if not specified.
   */
  theme: ThemeMode;

  /**
   * Optional master switch for `stats` and `playback`. When true, both default
   * to shown; when false or unset, both default to hidden. Explicit per-field
   * values always win. Does not affect `uniformsUI`.
   */
  controls?: boolean;

  /** Show the FPS / resolution overlay. Undefined → follow `controls`, then default false. */
  stats?: boolean;
  /** Show the playback bar. Undefined → follow `controls`, then default false. */
  playback?: boolean;
  /** Uniforms UI presentation. Undefined → 'panel'. Independent of `controls`. */
  uniformsUI?: 'panel' | 'inline' | 'off';

  /**
   * Whether to start paused on first frame.
   * Defaults to false.
   */
  startPaused: boolean;

  /**
   * If true, releasing the mouse/touch leaves iMouse.zw positive (as if still
   * held), so shaders that gate on `iMouse.z > 0.0` retain the last drag
   * position instead of reverting to defaults. Defaults to false (standard
   * Shadertoy behavior). Note: iMousePressed still reflects real held state.
   */
  stickyMouse: boolean;

  /**
   * Pixel ratio for resolution scaling.
   * Defaults to null (use window.devicePixelRatio).
   * Use values < 1 for lower resolution (better performance).
   */
  pixelRatio: number | null;

  /**
   * Common GLSL code (prepended to all shaders), or null if none.
   */
  commonSource: string | null;

  /**
   * Pass definitions.
   * Image is always present, BufferA-D are optional.
   */
  passes: {
    Image: ShaderPass;
    BufferA?: ShaderPass;
    BufferB?: ShaderPass;
    BufferC?: ShaderPass;
    BufferD?: ShaderPass;
  };

  /**
   * Deduplicated list of external textures.
   * All ChannelSource with kind: 'texture2D' refer to names in this list.
   */
  textures: ShaderTexture2D[];

  /**
   * Custom uniform definitions from config.
   * Users must declare these uniforms in their shader code.
   * Array uniforms (with count) are auto-declared by the engine.
   */
  uniforms: UniformDefinitions;

  /**
   * Pre-loaded initial data for array/struct uniforms (from "data" fields in config).
   * Keys are uniform names, values are the data to pass to setArrayUniform/setStructArrayUniform.
   */
  uniformData: Record<string, unknown>;

  /**
   * Demo script hooks (from script.js in demo folder).
   * Provides setup() and onFrame() callbacks for JS-driven computation.
   */
  script: DemoScriptHooks | null;
}

// =============================================================================
// Multi-View Project (Multiple Coupled Shaders)
// =============================================================================

/**
 * A single view entry in a multi-view project.
 * Each view has its own set of passes (Image + optional buffers).
 */
export interface ViewEntry {
  /** View name (used for cross-view uniform naming, e.g., iMouse_mandelbrot) */
  name: string;
  /** Pass definitions for this view */
  passes: ShaderProject['passes'];
}

/**
 * Multi-view project with multiple coupled shaders.
 * Each view renders to its own canvas with independent mouse/touch input,
 * but shares time, frame count, and custom uniforms.
 *
 * Cross-view uniforms are available in shaders:
 * - iMouse_{viewName} - other view's mouse state
 * - iResolution_{viewName} - other view's resolution
 * - iMousePressed_{viewName} - other view's mouse pressed state
 */
export interface MultiViewProject {
  mode: 'standard';
  root: string;
  meta: ShaderMeta;
  theme: ThemeMode;
  controls?: boolean;
  stats?: boolean;
  playback?: boolean;
  uniformsUI?: 'panel' | 'inline' | 'off';
  startPaused: boolean;
  stickyMouse: boolean;
  pixelRatio: number | null;
  commonSource: string | null;
  uniforms: UniformDefinitions;
  uniformData: Record<string, unknown>;
  textures: ShaderTexture2D[];
  script: DemoScriptHooks | null;

  /** Views in this multi-view project */
  views: ViewEntry[];
  /** Layout mode for arranging views */
  viewLayout: MultiViewLayoutMode;
}

/**
 * Type guard to check if a project is a multi-view project.
 */
export function isMultiViewProject(
  project: ShaderProject | MultiViewProject
): project is MultiViewProject {
  return 'views' in project && Array.isArray((project as any).views);
}

/**
 * Cross-view state passed between views for uniform binding.
 */
export interface CrossViewState {
  mouse: [number, number, number, number];
  resolution: [number, number, number];
  mousePressed: boolean;
}

// =============================================================================
// Demo Script Hooks
// =============================================================================

/**
 * Overlay position for info text display.
 */
export type OverlayPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * The API surface exposed to script.js hooks.
 * A restricted view of the engine for safety and clarity.
 */
export interface ScriptEngineAPI {
  setUniformValue(name: string, value: UniformValue): void;
  getUniformValue(name: string): UniformValue | undefined;
  /** Upload or update a named texture for use as a script channel. */
  updateTexture(name: string, width: number, height: number, data: Uint8Array | Float32Array): void;
  /** Read pixels from a buffer pass (previous frame). Returns RGBA Uint8Array. */
  readPixels(passName: string, x: number, y: number, width: number, height: number): Uint8Array;
  readonly width: number;
  readonly height: number;

  /**
   * Set or clear an info overlay at a position.
   * @param position - Corner position (default: 'top-left')
   * @param text - Text to display (null to hide)
   * @param viewName - For multi-view: which view (optional, defaults to main view)
   */
  setOverlay(position: OverlayPosition, text: string | null, viewName?: string): void;

  /**
   * Set an array uniform from structured JS arrays.
   * The engine flattens and packs the data automatically based on the uniform's type.
   * E.g. for a vec3 array: [[1,0,0], [0,1,0], [0,0,1]]
   * For float arrays, also accepts a flat number[]: [1.0, 2.0, 3.0]
   */
  setArrayUniform(name: string, data: number[][] | number[]): void;

  /**
   * Set a single element of an array uniform by index.
   * Only repacks and uploads that one element — much cheaper than resending the whole array.
   * Value is a number[] matching the type's component count, or a single number for float arrays.
   */
  setArrayElement(name: string, index: number, value: number | number[]): void;

  /**
   * Set how many elements of an array uniform the shader should use (written to name_count).
   * Allows using fewer elements than the buffer's max capacity without resending data.
   */
  setActiveCount(name: string, count: number): void;

  /**
   * Set a struct array uniform from per-field data.
   * Each field is an array of elements matching the field's type.
   * E.g. for struct { vec3 position; vec4 color; }:
   *   { position: [[1,0,0], [0,1,0]], color: [[1,0,0,1], [0,1,0,1]] }
   */
  setStructArrayUniform(name: string, data: Record<string, number[][] | number[]>): void;

  /**
   * Set a single element of a struct array uniform by index.
   * Each field value matches the field's type component count.
   */
  setStructArrayElement(name: string, index: number, data: Record<string, number | number[]>): void;

  // Multi-view extensions (undefined for single-view projects)
  /** Get cross-view state (mouse, resolution) from another view */
  getCrossViewState?(viewName: string): CrossViewState | undefined;
  /** List of all view names (undefined for single-view) */
  readonly viewNames?: string[];
}

/**
 * Hooks exported by a demo's script.js file.
 * All hooks are optional — a script can export any combination.
 */
export interface DemoScriptHooks {
  /** Called once after engine init, before the first frame. Also called on WebGL context restore. */
  setup?: (engine: ScriptEngineAPI, context: { isRestore: boolean }) => void;
  /** Called every frame before shader execution */
  onFrame?: (engine: ScriptEngineAPI, time: number, deltaTime: number, frame: number) => void;
  /** Called when the shader is destroyed — use to remove event listeners, cancel timers, etc. */
  dispose?: () => void;
  /** Called when a uniform changes from outside the script (e.g. UI sliders). Not called for script's own setUniformValue calls. */
  onUniformChange?: (engine: ScriptEngineAPI, name: string, value: UniformValue) => void;
}
