/**
 * Engine Layer - Type Definitions
 *
 * Internal types used by ShaderEngine for managing WebGL resources.
 * Based on docs/engine-spec.md
 */

import type {
  ShaderProject,
  PassName,
  Channels,
  ChannelSource,
} from '../project/types';

// =============================================================================
// Engine Options
// =============================================================================

/**
 * Options for constructing a ShaderEngine.
 *
 * The App is responsible for creating the WebGL2RenderingContext
 * and passing it in.
 */
export interface EngineOptions {
  gl: WebGL2RenderingContext;
  project: ShaderProject;
}

// =============================================================================
// Per-Pass Uniform Locations
// =============================================================================

/**
 * Per-pass uniform locations and metadata.
 *
 * NOTE: This is separate from RuntimePass so that we can keep
 * the GL program + locations together.
 */
export interface PassUniformLocations {
  program: WebGLProgram;

  // Core Shadertoy uniforms
  iResolution: WebGLUniformLocation | null;
  iTime: WebGLUniformLocation | null;
  iTimeDelta: WebGLUniformLocation | null;
  iFrame: WebGLUniformLocation | null;
  iMouse: WebGLUniformLocation | null;
  iMousePressed: WebGLUniformLocation | null;
  iDate: WebGLUniformLocation | null;
  iFrameRate: WebGLUniformLocation | null;

  // iChannel0..3
  iChannel: (WebGLUniformLocation | null)[];

  // iChannelResolution[4] - resolution of each channel texture
  iChannelResolution: (WebGLUniformLocation | null)[];

  // Touch uniforms (Shader Sandbox extensions)
  iTouchCount: WebGLUniformLocation | null;
  iTouch: (WebGLUniformLocation | null)[]; // iTouch0, iTouch1, iTouch2
  iPinch: WebGLUniformLocation | null;
  iPinchDelta: WebGLUniformLocation | null;
  iPinchCenter: WebGLUniformLocation | null;

  // Custom uniforms (from project config)
  custom: Map<string, WebGLUniformLocation | null>;

  // Named samplers (standard mode)
  namedSamplers: Map<string, WebGLUniformLocation | null>;
  namedSamplerResolutions: Map<string, WebGLUniformLocation | null>;
}

// =============================================================================
// Runtime Pass Representation
// =============================================================================

/**
 * A runtime representation of a pass:
 * - knows which project pass it corresponds to
 * - owns two textures (current + previous) for ping-pong
 * - owns a framebuffer and VAO for drawing
 */
export interface RuntimePass {
  name: PassName;
  projectChannels: Channels;

  vao: WebGLVertexArrayObject;
  uniforms: PassUniformLocations;

  framebuffer: WebGLFramebuffer;

  // Ping-pong textures:
  // - current: where we write this frame
  // - previous: where we read "previous" from when needed
  currentTexture: WebGLTexture;
  previousTexture: WebGLTexture;

  // Named samplers (standard mode) - maps sampler name → channel source
  namedSamplers?: Map<string, ChannelSource>;
}

// =============================================================================
// Runtime Texture Representation
// =============================================================================

/**
 * Runtime representation of an external 2D texture.
 * This corresponds 1:1 to ShaderTexture2D from the project.
 */
export interface RuntimeTexture2D {
  name: string; // e.g. "tex0" (same as project texture name)
  texture: WebGLTexture;
  width: number;
  height: number;
}

/**
 * Keyboard texture representation.
 * For v1, you can leave this unimplemented or just stub it out.
 */
export interface RuntimeKeyboardTexture {
  texture: WebGLTexture;
  width: number;
  height: number;
}

/**
 * Runtime audio texture (microphone FFT + waveform).
 * 512x2, R8 format: row 0 = frequency, row 1 = waveform.
 */
export interface RuntimeAudioTexture {
  texture: WebGLTexture;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  stream: MediaStream | null;
  frequencyData: Uint8Array<ArrayBuffer>;   // 512 bytes
  waveformData: Uint8Array<ArrayBuffer>;    // 512 bytes
  width: number;  // 512
  height: number; // 2
  initialized: boolean;
}

/**
 * Runtime video texture (webcam or video file).
 */
export interface RuntimeVideoTexture {
  texture: WebGLTexture;
  video: HTMLVideoElement | null;
  stream: MediaStream | null;  // Only for webcam
  width: number;
  height: number;
  ready: boolean;
  kind: 'webcam' | 'video';
  src?: string;  // Only for video files
}

/**
 * Runtime script-uploaded texture.
 */
export interface RuntimeScriptTexture {
  texture: WebGLTexture;
  width: number;
  height: number;
  isFloat: boolean;  // Float32Array → RGBA32F, Uint8Array → RGBA8
}

// =============================================================================
// Built-in Uniform Values (per-frame data passed to shaders)
// =============================================================================

/**
 * Values for all built-in uniforms, computed once per frame and passed to each pass.
 */
export interface BuiltinUniformValues {
  iResolution: readonly [number, number, number];
  iTime: number;
  iTimeDelta: number;
  iFrame: number;
  iMouse: [number, number, number, number];
  iMousePressed: boolean;
  iDate: readonly [number, number, number, number];
  iFrameRate: number;
  iTouchCount: number;
  iTouch: [[number, number, number, number], [number, number, number, number], [number, number, number, number]];
  iPinch: number;
  iPinchDelta: number;
  iPinchCenter: [number, number];
}

// =============================================================================
// Engine Stats
// =============================================================================

/**
 * Engine stats (for optional overlay / debugging).
 */
export interface EngineStats {
  frame: number;         // iFrame
  time: number;          // total time in seconds (iTime)
  deltaTime: number;     // last frame delta in seconds (iTimeDelta)
  width: number;
  height: number;
}

