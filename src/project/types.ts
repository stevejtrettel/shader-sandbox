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
 * - 'light': Always use light theme
 * - 'dark': Always use dark theme
 * - 'system': Follow OS preference (prefers-color-scheme)
 */
export type ThemeMode = 'light' | 'dark' | 'system';

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
}

/**
 * Type guard: returns true if a uniform definition is an array uniform (has count).
 */
export function isArrayUniform(def: UniformDefinition): def is ArrayUniformDefinition {
  return 'count' in def && typeof (def as any).count === 'number';
}

/**
 * Returns true if a uniform should have a UI control.
 * Excludes array uniforms (UBOs) and hidden uniforms (script-only).
 */
export function hasUIControl(def: UniformDefinition): boolean {
  return !isArrayUniform(def) && !def.hidden;
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
  | ArrayUniformDefinition;

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
  // Metadata (flat, not nested)
  title?: string;
  author?: string;
  description?: string;

  // Settings
  layout?: 'fullscreen' | 'default' | 'split' | 'tabbed';
  theme?: ThemeMode;
  controls?: boolean;
  common?: string;

  // Playback settings
  /** Start paused on first frame (default: false) */
  startPaused?: boolean;

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
  controls?: boolean;
  common?: string;
  startPaused?: boolean;
  pixelRatio?: number;

  // Custom uniforms
  uniforms?: UniformDefinitions;

  /**
   * Named buffers (framebuffers with ping-pong).
   * Array shorthand ["velocity"] normalizes to { "velocity": {} }.
   * Max 4 buffers (maps to BufferA-D internally).
   */
  buffers?: string[] | Record<string, StandardBufferConfig>;

  /**
   * Named textures available in all passes.
   * Value is a file path or special source: "keyboard", "audio", "webcam".
   */
  textures?: Record<string, string>;
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
   * Whether to show playback controls (play/pause, reset).
   */
  controls: boolean;

  /**
   * Whether to start paused on first frame.
   * Defaults to false.
   */
  startPaused: boolean;

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
   * Demo script hooks (from script.js in demo folder).
   * Provides setup() and onFrame() callbacks for JS-driven computation.
   */
  script: DemoScriptHooks | null;
}

// =============================================================================
// Demo Script Hooks
// =============================================================================

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
}

/**
 * Hooks exported by a demo's script.js file.
 * Both are optional — a script can export just setup, just onFrame, or both.
 */
export interface DemoScriptHooks {
  /** Called once after engine init, before the first frame */
  setup?: (engine: ScriptEngineAPI) => void;
  /** Called every frame before shader execution */
  onFrame?: (engine: ScriptEngineAPI, time: number, deltaTime: number, frame: number) => void;
}
