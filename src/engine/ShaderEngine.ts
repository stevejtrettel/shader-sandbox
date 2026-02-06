/**
 * Engine - Shadertoy Execution Engine
 *
 * Implements the execution model described in docs/engine-spec.md.
 *
 * Responsibilities:
 *  - Own WebGL resources for passes (programs, VAOs, textures, FBOs).
 *  - Execute passes each frame in Shadertoy order: BufferA→BufferB→BufferC→BufferD→Image.
 *  - Bind Shadertoy uniforms (iResolution, iTime, iTimeDelta, iFrame, iMouse).
 *  - Bind iChannel0..3 according to ChannelSource.
 */

import {
  ShaderProject,
  ChannelSource,
  PassName,
  UniformValue,
  UniformValues,
  isArrayUniform,
} from '../project/types';

import { UniformStore } from '../uniforms/UniformStore';

import {
  EngineOptions,
  RuntimePass,
  RuntimeTexture2D,
  RuntimeKeyboardTexture,
  RuntimeScriptTexture,
  EngineStats,
  PassUniformLocations,
  BuiltinUniformValues,
} from './types';

import {
  createProgramFromSources,
  createFullscreenTriangleVAO,
  createRenderTargetTexture,
  createFramebufferWithColorAttachment,
  createBlackTexture,
  createKeyboardTexture,
  updateKeyboardTexture,
  createOrUpdateScriptTexture,
} from './glHelpers';

import { VERTEX_SHADER_SOURCE, buildFragmentShader as buildFragSource } from './shaderSource';
import { MediaManager } from './MediaManager';
import { UniformManager } from './UniformManager';

// =============================================================================
// ShaderEngine Implementation
// =============================================================================

/** Line mapping for error reporting — maps compiled shader lines back to user source. */
export interface LineMapping {
  /** 1-indexed line where common.glsl starts in compiled source (0 if no common). */
  commonStartLine: number;
  /** Number of lines in common.glsl. */
  commonLines: number;
  /** 1-indexed line where user shader code starts in compiled source. */
  userCodeStartLine: number;
}

export class ShaderEngine {
  readonly project: ShaderProject;
  readonly gl: WebGL2RenderingContext;

  private _width: number;
  private _height: number;

  private _frame: number = 0;
  private _time: number = 0;
  private _lastStepTime: number | null = null;

  private _passes: RuntimePass[] = [];
  private _textures: RuntimeTexture2D[] = [];
  private _keyboardTexture: RuntimeKeyboardTexture | null = null;

  private _blackTexture: WebGLTexture | null = null;

  // Keyboard state tracking (Maps keycodes to state)
  private _keyStates: Map<number, boolean> = new Map(); // true = down, false = up
  private _toggleStates: Map<number, number> = new Map(); // 0.0 or 1.0

  // Compilation errors (if any occurred during initialization)
  private _compilationErrors: Array<{
    passName: PassName;
    error: string;
    source: string;
    isFromCommon: boolean;
    originalLine: number | null;
    lineMapping: LineMapping;
  }> = [];

  // Custom uniforms (scalars + UBO-backed arrays)
  private _uniformMgr!: UniformManager;

  // Media (audio, video, webcam)
  private _media: MediaManager;

  // Script-uploaded textures
  private _scriptTextures: Map<string, RuntimeScriptTexture> = new Map();

  // View names for multi-view projects (enables cross-view uniforms)
  private _viewNames: string[] = [];

  constructor(opts: EngineOptions) {
    this.gl = opts.gl;
    this.project = opts.project;

    // Initialize width/height from current drawing buffer
    this._width = this.gl.drawingBufferWidth;
    this._height = this.gl.drawingBufferHeight;

    // 1. Initialize extensions
    this.initExtensions();

    // 2. Create black texture for unused channels
    this._blackTexture = createBlackTexture(this.gl);

    // 3. Create keyboard texture (256x3, Shadertoy format)
    const keyboardTex = createKeyboardTexture(this.gl);
    this._keyboardTexture = {
      texture: keyboardTex,
      width: 256,
      height: 3,
    };

    // 4. Initialize external textures (from project.textures)
    //    NOTE: This requires actual image data; for now just stub the array.
    //    Real implementation would load images here.
    this.initProjectTextures();

    // 5. Initialize media manager (audio/video/webcam textures)
    this._media = new MediaManager(this.gl, opts.project);

    // 6. Initialize custom uniform values and UBOs (must happen before shader compilation)
    this._uniformMgr = new UniformManager(this.gl, opts.project.uniforms);

    // 7. Store view names for multi-view cross-view uniforms (must be before shader compilation)
    if (opts.viewNames && opts.viewNames.length > 1) {
      this._viewNames = opts.viewNames;
    }

    // 8. Compile shaders + create runtime passes
    this.initRuntimePasses();
  }

  // ===========================================================================
  // Media Delegates (forwarded to MediaManager)
  // ===========================================================================

  async initAudio(): Promise<void> { return this._media.initAudio(); }
  updateAudioTexture(): void { this._media.updateAudioTexture(this.gl); }
  async initWebcam(): Promise<void> { return this._media.initWebcam(); }
  async initVideo(src: string): Promise<void> { return this._media.initVideo(src); }
  updateVideoTextures(): void { this._media.updateVideoTextures(this.gl); }

  /** Whether this project uses audio channels. */
  get needsAudio(): boolean { return this._media.needsAudio; }
  /** Whether this project uses webcam channels. */
  get needsWebcam(): boolean { return this._media.needsWebcam; }
  /** Get video sources that need initialization. */
  get videoSources(): string[] { return this._media.videoSources; }

  /**
   * Upload or update a named texture from JavaScript (for script channel).
   */
  updateTexture(name: string, width: number, height: number, data: Uint8Array | Float32Array): void {
    const existing = this._scriptTextures.get(name);
    const isFloat = data instanceof Float32Array;

    if (existing && existing.width === width && existing.height === height && existing.isFloat === isFloat) {
      // Same size and format — just update data
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, existing.texture);
      if (isFloat) {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.FLOAT, data);
      } else {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
      }
      gl.bindTexture(gl.TEXTURE_2D, null);
    } else {
      // Create or recreate
      const texture = createOrUpdateScriptTexture(
        this.gl,
        existing?.texture ?? null,
        width,
        height,
        data,
      );
      this._scriptTextures.set(name, { texture, width, height, isFloat });
    }
  }

  /**
   * Read pixels from a buffer pass (reads previous frame's data).
   */
  readPixels(passName: PassName, x: number, y: number, w: number, h: number): Uint8Array {
    const pass = this._passes.find(p => p.name === passName);
    if (!pass) {
      console.warn(`readPixels: pass '${passName}' not found`);
      return new Uint8Array(w * h * 4);
    }

    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, pass.framebuffer);
    // Attach previousTexture (has last completed frame)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pass.previousTexture, 0);

    const pixels = new Uint8Array(w * h * 4);
    gl.readPixels(x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Restore currentTexture
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pass.currentTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return pixels;
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get stats(): EngineStats {
    const dt = this._lastStepTime === null ? 0 : this._time - this._lastStepTime;
    return {
      frame: this._frame,
      time: this._time,
      deltaTime: dt,
      width: this._width,
      height: this._height,
    };
  }

  /**
   * Get shader compilation errors (if any occurred during initialization).
   * Returns empty array if all shaders compiled successfully.
   */
  getCompilationErrors(): Array<{
    passName: PassName;
    error: string;
    source: string;
    isFromCommon: boolean;
    originalLine: number | null;
    lineMapping: LineMapping;
  }> {
    return this._compilationErrors;
  }

  /**
   * Check if there were any compilation errors.
   */
  hasErrors(): boolean {
    return this._compilationErrors.length > 0;
  }

  getUniformStore(): UniformStore { return this._uniformMgr.store; }
  getUniformValue(name: string): UniformValue | undefined { return this._uniformMgr.get(name); }
  getUniformValues(): UniformValues { return this._uniformMgr.getAll(); }
  setUniformValue(name: string, value: UniformValue): void { this._uniformMgr.set(name, value); }
  setUniformValues(values: Partial<UniformValues>): void { this._uniformMgr.setMultiple(values); }

  /**
   * Get the framebuffer for the Image pass (for presenting to screen).
   */
  getImageFramebuffer(): WebGLFramebuffer | null {
    const imagePass = this._passes.find((p) => p.name === 'Image');
    return imagePass?.framebuffer ?? null;
  }

  /**
   * Bind the Image pass output as the READ_FRAMEBUFFER for blitting to screen.
   *
   * After the ping-pong swap, the rendered output is in previousTexture,
   * but the framebuffer is attached to currentTexture. This method temporarily
   * attaches previousTexture so blitFramebuffer reads the correct data.
   */
  bindImageForRead(): boolean {
    const gl = this.gl;
    const imagePass = this._passes.find((p) => p.name === 'Image');
    if (!imagePass) return false;

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, imagePass.framebuffer);
    gl.framebufferTexture2D(
      gl.READ_FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      imagePass.previousTexture,
      0
    );
    return true;
  }

  /**
   * Restore the Image pass framebuffer to its normal state (attached to currentTexture).
   * Call after blitting to screen.
   */
  unbindImageForRead(): void {
    const gl = this.gl;
    const imagePass = this._passes.find((p) => p.name === 'Image');
    if (!imagePass) return;

    // Restore FBO attachment to currentTexture for next frame's render
    gl.framebufferTexture2D(
      gl.READ_FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      imagePass.currentTexture,
      0
    );
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
  }

  /**
   * Run one full frame of all passes.
   *
   * @param timeSeconds - global time in seconds (monotone, from App)
   * @param mouse - iMouse as [x, y, clickX, clickY]
   * @param touch - optional touch state for touch uniforms
   */
  step(timeSeconds: number, mouse: [number, number, number, number], mousePressed: boolean, touch?: {
    count: number;
    touches: BuiltinUniformValues['iTouch'];
    pinch: number;
    pinchDelta: number;
    pinchCenter: [number, number];
  }, crossViewStates?: Map<string, import('../project/types').CrossViewState>): void {
    const gl = this.gl;

    // Compute time/deltaTime/iFrame
    const deltaTime =
      this._lastStepTime === null ? 0.0 : timeSeconds - this._lastStepTime;
    this._lastStepTime = timeSeconds;
    this._time = timeSeconds;

    // Compute iDate: (year, month, day, seconds since midnight)
    const now = new Date();

    // Default touch state if not provided
    const t = touch ?? {
      count: 0,
      touches: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]] as BuiltinUniformValues['iTouch'],
      pinch: 1.0,
      pinchDelta: 0.0,
      pinchCenter: [0, 0] as [number, number],
    };

    const builtins: BuiltinUniformValues = {
      iResolution: [this._width, this._height, 1.0],
      iTime: this._time,
      iTimeDelta: deltaTime,
      iFrame: this._frame,
      iMouse: mouse,
      iMousePressed: mousePressed,
      iDate: [
        now.getFullYear(),
        now.getMonth(),      // 0-11 (matches Shadertoy)
        now.getDate(),       // 1-31
        now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000,
      ],
      iFrameRate: deltaTime > 0 ? 1.0 / deltaTime : 60.0,
      iTouchCount: t.count,
      iTouch: t.touches,
      iPinch: t.pinch,
      iPinchDelta: t.pinchDelta,
      iPinchCenter: t.pinchCenter,
      crossViewStates,
    };

    // Set viewport for all passes
    gl.viewport(0, 0, this._width, this._height);

    // Execute passes in Shadertoy order
    const passOrder: PassName[] = ['BufferA', 'BufferB', 'BufferC', 'BufferD', 'Image'];

    for (const passName of passOrder) {
      const runtimePass = this._passes.find((p) => p.name === passName);
      if (!runtimePass) continue;

      this.executePass(runtimePass, builtins);

      // Swap ping-pong textures after pass execution
      this.swapPassTextures(runtimePass);
    }

    // Clear scalar dirty flags after all passes have been bound
    this._uniformMgr.clearDirty();

    // Monotone frame counter (increment AFTER all passes)
    this._frame += 1;
  }

  /**
   * Resize all internal render targets to new width/height.
   * Does not reset time or frame count.
   */
  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;

    const gl = this.gl;

    // Reallocate ALL pass textures to new resolution
    for (const pass of this._passes) {
      // Delete old textures and framebuffer
      gl.deleteTexture(pass.currentTexture);
      gl.deleteTexture(pass.previousTexture);
      gl.deleteFramebuffer(pass.framebuffer);

      // Create new textures at new resolution
      pass.currentTexture = createRenderTargetTexture(gl, width, height);
      pass.previousTexture = createRenderTargetTexture(gl, width, height);

      // Create new framebuffer (attached to current texture)
      pass.framebuffer = createFramebufferWithColorAttachment(gl, pass.currentTexture);
    }
  }

  /**
   * Reset frame counter and clear all render targets.
   * Used for playback controls to restart shader from frame 0.
   */
  reset(): void {
    this._frame = 0;

    // Clear all pass textures (both current and previous for ping-pong)
    // This is critical for accumulation shaders that read from previous frame
    const gl = this.gl;
    for (const pass of this._passes) {
      // Clear current texture (already attached to framebuffer)
      gl.bindFramebuffer(gl.FRAMEBUFFER, pass.framebuffer);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Also clear previous texture (temporarily attach it)
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        pass.previousTexture,
        0
      );
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Re-attach current texture
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

  /**
   * Update keyboard key state (called from App on keydown/keyup events).
   *
   * @param keycode ASCII keycode (e.g., 65 for 'A')
   * @param isDown true if key pressed, false if released
   */
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

  /**
   * Update keyboard texture with current key states.
   * Should be called once per frame before rendering.
   */
  updateKeyboardTexture(): void {
    if (!this._keyboardTexture) {
      return; // No keyboard texture to update
    }

    updateKeyboardTexture(
      this.gl,
      this._keyboardTexture.texture,
      this._keyStates,
      this._toggleStates
    );
  }

  /**
   * Recompile a single pass with new GLSL source code.
   * Used for live editing - keeps the old shader running if compilation fails.
   *
   * @param passName - Name of the pass to recompile ('Image', 'BufferA', etc.)
   * @param newSource - New GLSL source code for the pass
   * @returns Object with success status and error message if failed
   */
  recompilePass(passName: PassName, newSource: string): { success: boolean; error?: string } {
    const gl = this.gl;

    // Find the runtime pass
    const runtimePass = this._passes.find((p) => p.name === passName);
    if (!runtimePass) {
      return { success: false, error: `Pass '${passName}' not found` };
    }

    // Update the project's pass source (so buildFragmentShader uses it)
    const projectPass = this.project.passes[passName];
    if (!projectPass) {
      return { success: false, error: `Project pass '${passName}' not found` };
    }

    // Build new fragment shader
    const { source: fragmentSource } = this.buildFragmentShader(newSource, projectPass.channels, projectPass.namedSamplers);

    try {
      // Try to compile new program
      const newProgram = createProgramFromSources(gl, VERTEX_SHADER_SOURCE, fragmentSource);

      // Success! Delete old program and update runtime pass
      gl.deleteProgram(runtimePass.uniforms.program);

      // Cache new uniform locations
      runtimePass.uniforms = this.cacheUniformLocations(newProgram, projectPass.namedSamplers);

      // Update the stored source in the project
      projectPass.glslSource = newSource;

      // Clear any previous compilation errors for this pass
      this._compilationErrors = this._compilationErrors.filter(e => e.passName !== passName);

      // Mark all scalar uniforms dirty so they bind to the new program
      this._uniformMgr.markAllScalarsDirty();

      return { success: true };
    } catch (err) {
      // Compilation failed - keep old shader running
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Recompile common.glsl and all passes that use it.
   * Used for live editing of common code.
   *
   * @param newCommonSource - New GLSL source code for common.glsl
   * @returns Object with success status and errors for each failed pass
   */
  recompileCommon(newCommonSource: string): { success: boolean; errors: Array<{ passName: PassName; error: string }> } {
    const oldCommonSource = this.project.commonSource;

    // Temporarily update common source
    this.project.commonSource = newCommonSource;

    const errors: Array<{ passName: PassName; error: string }> = [];
    const passOrder: PassName[] = ['BufferA', 'BufferB', 'BufferC', 'BufferD', 'Image'];

    // Try to recompile all passes
    for (const passName of passOrder) {
      const projectPass = this.project.passes[passName];
      if (!projectPass) continue;

      const result = this.recompilePass(passName, projectPass.glslSource);
      if (!result.success) {
        errors.push({ passName, error: result.error || 'Unknown error' });
      }
    }

    // If any failed, restore old common source and recompile successful ones back
    if (errors.length > 0) {
      this.project.commonSource = oldCommonSource;

      // Recompile passes back to working state
      for (const passName of passOrder) {
        const projectPass = this.project.passes[passName];
        if (!projectPass) continue;

        // Skip passes that failed (they still have old shader)
        if (errors.some(e => e.passName === passName)) continue;

        // Recompile with old common source
        const revert = this.recompilePass(passName, projectPass.glslSource);
        if (!revert.success) {
          console.error(`Failed to revert ${passName} to old common source:`, revert.error);
          errors.push({ passName, error: `Revert failed: ${revert.error}` });
        }
      }

      return { success: false, errors };
    }

    return { success: true, errors: [] };
  }

  /**
   * Delete all GL resources.
   */
  dispose(): void {
    const gl = this.gl;

    // Delete passes (programs, VAOs, FBOs, textures)
    for (const pass of this._passes) {
      gl.deleteProgram(pass.uniforms.program);
      gl.deleteVertexArray(pass.vao);
      gl.deleteFramebuffer(pass.framebuffer);
      gl.deleteTexture(pass.currentTexture);
      gl.deleteTexture(pass.previousTexture);
    }

    // Delete external textures
    for (const tex of this._textures) {
      gl.deleteTexture(tex.texture);
    }

    // Delete keyboard texture
    if (this._keyboardTexture) {
      gl.deleteTexture(this._keyboardTexture.texture);
    }

    // Delete black texture
    if (this._blackTexture) {
      gl.deleteTexture(this._blackTexture);
    }

    // Dispose uniform manager (UBO buffers)
    this._uniformMgr.dispose(gl);

    // Dispose media resources
    this._media.dispose(gl);

    // Clear arrays
    this._passes = [];
    this._textures = [];
    this._keyboardTexture = null;
    this._blackTexture = null;
  }

  // ===========================================================================
  // Initialization Helpers
  // ===========================================================================

  private initExtensions(): void {
    const gl = this.gl;

    // MUST enable EXT_color_buffer_float for RGBA32F render targets
    const ext = gl.getExtension('EXT_color_buffer_float');
    if (!ext) {
      throw new Error(
        'EXT_color_buffer_float not supported. WebGL2 with float rendering is required.'
      );
    }

    // Optionally check for OES_texture_float_linear (for smooth filtering of float textures)
    // Not strictly required for Shadertoy, but nice to have
    gl.getExtension('OES_texture_float_linear');
  }

  /**
   * Cache uniform locations for a compiled program.
   * Returns a PassUniformLocations object with all standard and custom uniform locations.
   */
  private cacheUniformLocations(program: WebGLProgram, namedSamplers?: Map<string, ChannelSource>): PassUniformLocations {
    const gl = this.gl;

    // Cache custom uniform locations (skip array uniforms — they use UBOs)
    const customLocations = new Map<string, WebGLUniformLocation | null>();
    for (const [name, def] of Object.entries(this.project.uniforms)) {
      if (isArrayUniform(def)) continue;
      customLocations.set(name, gl.getUniformLocation(program, name));
    }

    // Bind UBO block indices and cache _count uniform locations for this program
    this._uniformMgr.bindUBOsToProgram(gl, program, customLocations);

    return {
      program,
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      iTime: gl.getUniformLocation(program, 'iTime'),
      iTimeDelta: gl.getUniformLocation(program, 'iTimeDelta'),
      iFrame: gl.getUniformLocation(program, 'iFrame'),
      iMouse: gl.getUniformLocation(program, 'iMouse'),
      iMousePressed: gl.getUniformLocation(program, 'iMousePressed'),
      iDate: gl.getUniformLocation(program, 'iDate'),
      iFrameRate: gl.getUniformLocation(program, 'iFrameRate'),
      iChannel: [
        gl.getUniformLocation(program, 'iChannel0'),
        gl.getUniformLocation(program, 'iChannel1'),
        gl.getUniformLocation(program, 'iChannel2'),
        gl.getUniformLocation(program, 'iChannel3'),
      ],
      iChannelResolution: [
        gl.getUniformLocation(program, 'iChannelResolution[0]'),
        gl.getUniformLocation(program, 'iChannelResolution[1]'),
        gl.getUniformLocation(program, 'iChannelResolution[2]'),
        gl.getUniformLocation(program, 'iChannelResolution[3]'),
      ],
      // Touch uniforms
      iTouchCount: gl.getUniformLocation(program, 'iTouchCount'),
      iTouch: [
        gl.getUniformLocation(program, 'iTouch0'),
        gl.getUniformLocation(program, 'iTouch1'),
        gl.getUniformLocation(program, 'iTouch2'),
      ],
      iPinch: gl.getUniformLocation(program, 'iPinch'),
      iPinchDelta: gl.getUniformLocation(program, 'iPinchDelta'),
      iPinchCenter: gl.getUniformLocation(program, 'iPinchCenter'),
      custom: customLocations,
      namedSamplers: (() => {
        const m = new Map<string, WebGLUniformLocation | null>();
        if (namedSamplers) {
          for (const [name] of namedSamplers) {
            m.set(name, gl.getUniformLocation(program, name));
          }
        }
        return m;
      })(),
      namedSamplerResolutions: (() => {
        const m = new Map<string, WebGLUniformLocation | null>();
        if (namedSamplers) {
          for (const [name] of namedSamplers) {
            m.set(name, gl.getUniformLocation(program, `${name}_resolution`));
          }
        }
        return m;
      })(),
      // Cross-view uniforms for multi-view projects
      crossViewMouse: (() => {
        const m = new Map<string, WebGLUniformLocation | null>();
        if (this._viewNames.length > 1) {
          for (const viewName of this._viewNames) {
            m.set(viewName, gl.getUniformLocation(program, `iMouse_${viewName}`));
          }
        }
        return m;
      })(),
      crossViewResolution: (() => {
        const m = new Map<string, WebGLUniformLocation | null>();
        if (this._viewNames.length > 1) {
          for (const viewName of this._viewNames) {
            m.set(viewName, gl.getUniformLocation(program, `iResolution_${viewName}`));
          }
        }
        return m;
      })(),
      crossViewMousePressed: (() => {
        const m = new Map<string, WebGLUniformLocation | null>();
        if (this._viewNames.length > 1) {
          for (const viewName of this._viewNames) {
            m.set(viewName, gl.getUniformLocation(program, `iMousePressed_${viewName}`));
          }
        }
        return m;
      })(),
    };
  }

  /**
   * Initialize external textures based on project.textures.
   *
   * NOTE: This function as written assumes that actual image loading
   * is handled elsewhere. For now we just construct an empty array.
   * In a real implementation, you would load images here.
   */
  private initProjectTextures(): void {
    const gl = this.gl;
    this._textures = [];

    // Load each texture from the project
    for (const texDef of this.project.textures) {
      // Create a placeholder 1x1 texture immediately
      const texture = gl.createTexture();
      if (!texture) {
        throw new Error('Failed to create texture');
      }

      // Bind and set initial 1x1 black pixel
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

      // Store in runtime array
      const runtimeTex: RuntimeTexture2D = {
        name: texDef.name,
        texture,
        width: 1,
        height: 1,
      };
      this._textures.push(runtimeTex);

      // Load the actual image asynchronously
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        // Set filter
        const filter = texDef.filter === 'nearest' ? gl.NEAREST : gl.LINEAR;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);

        // Set wrap mode
        const wrap = texDef.wrap === 'clamp' ? gl.CLAMP_TO_EDGE : gl.REPEAT;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);

        // Generate mipmaps if using linear filtering
        if (texDef.filter === 'linear') {
          gl.generateMipmap(gl.TEXTURE_2D);
        }

        // Update dimensions
        runtimeTex.width = image.width;
        runtimeTex.height = image.height;

        console.log(`Loaded texture '${texDef.name}': ${image.width}x${image.height}`);
      };
      image.onerror = () => {
        console.error(`Failed to load texture '${texDef.name}' from ${texDef.source}`);
      };
      image.src = texDef.source;
    }
  }

  /**
   * Compile shaders, create VAOs/FBOs/textures, and build RuntimePass array.
   */
  private initRuntimePasses(): void {
    const gl = this.gl;
    const project = this.project;

    // Shared VAO (all passes use the same fullscreen triangle)
    const sharedVAO = createFullscreenTriangleVAO(gl);

    // Build passes in Shadertoy order
    const passOrder: PassName[] = ['BufferA', 'BufferB', 'BufferC', 'BufferD', 'Image'];

    for (const passName of passOrder) {
      const projectPass = project.passes[passName];
      if (!projectPass) continue;

      // Build fragment shader source (outside try so we can access in catch)
      const { source: fragmentSource, lineMapping } = this.buildFragmentShader(projectPass.glslSource, projectPass.channels, projectPass.namedSamplers);

      try {
        // Compile program
        const program = createProgramFromSources(gl, VERTEX_SHADER_SOURCE, fragmentSource);

        // Cache uniform locations
        const uniforms = this.cacheUniformLocations(program, projectPass.namedSamplers);

        // Create ping-pong textures (MUST allocate both for all passes)
        const currentTexture = createRenderTargetTexture(gl, this._width, this._height);
        const previousTexture = createRenderTargetTexture(gl, this._width, this._height);

        // Create framebuffer (attached to current texture)
        const framebuffer = createFramebufferWithColorAttachment(gl, currentTexture);

        // Build RuntimePass
        const runtimePass: RuntimePass = {
          name: passName,
          projectChannels: projectPass.channels,
          vao: sharedVAO,
          uniforms,
          framebuffer,
          currentTexture,
          previousTexture,
          namedSamplers: projectPass.namedSamplers,
        };

        this._passes.push(runtimePass);
      } catch (err) {
        // Store compilation error with source code for context display
        const errorMessage = err instanceof Error ? err.message : String(err);

        // Detect if error is from common.glsl or user code
        const errorLineMatch = errorMessage.match(/ERROR:\s*\d+:(\d+):/);
        let isFromCommon = false;
        let originalLine: number | null = null;

        if (errorLineMatch) {
          const errorLine = parseInt(errorLineMatch[1], 10);

          if (lineMapping.commonStartLine > 0 && lineMapping.commonLines > 0) {
            const commonEndLine = lineMapping.commonStartLine + lineMapping.commonLines - 1;
            if (errorLine >= lineMapping.commonStartLine && errorLine <= commonEndLine) {
              isFromCommon = true;
              originalLine = errorLine - lineMapping.commonStartLine + 1;
            }
          }

          if (!isFromCommon && lineMapping.userCodeStartLine > 0 && errorLine >= lineMapping.userCodeStartLine) {
            originalLine = errorLine - lineMapping.userCodeStartLine + 1;
          }
        }

        this._compilationErrors.push({
          passName,
          error: errorMessage,
          source: fragmentSource,
          isFromCommon,
          originalLine,
          lineMapping,
        });
        console.error(`Failed to compile ${passName}:`, errorMessage);
      }
    }
  }


  /**
   * Build complete fragment shader source with Shadertoy boilerplate.
   */
  private buildFragmentShader(userSource: string, channels: ChannelSource[], namedSamplers?: Map<string, ChannelSource>): { source: string; lineMapping: LineMapping } {
    return buildFragSource(userSource, channels, {
      commonSource: this.project.commonSource ?? '',
      ubos: this._uniformMgr.ubos.map(u => ({ name: u.name, def: u.def, count: u.def.count })),
      uniforms: this.project.uniforms,
      namedSamplers,
      viewNames: this._viewNames.length > 1 ? this._viewNames : undefined,
    });
  }

  /**
   * Set view names for multi-view projects.
   * This enables cross-view uniforms (iMouse_viewName, iResolution_viewName, etc.)
   * Must be called before shader compilation.
   */
  setViewNames(names: string[]): void {
    this._viewNames = names;
  }

  // ===========================================================================
  // Pass Execution
  // ===========================================================================

  private executePass(
    runtimePass: RuntimePass,
    builtinUniforms: BuiltinUniformValues,
  ): void {
    const gl = this.gl;

    // Bind framebuffer (write to current texture)
    gl.bindFramebuffer(gl.FRAMEBUFFER, runtimePass.framebuffer);

    // Use program
    gl.useProgram(runtimePass.uniforms.program);

    // Bind VAO
    gl.bindVertexArray(runtimePass.vao);

    // Bind built-in uniforms
    this.bindBuiltinUniforms(runtimePass.uniforms, builtinUniforms);

    // Bind custom uniforms
    this._uniformMgr.bindToProgram(gl, runtimePass.uniforms);

    // Bind textures: named samplers (standard mode) or iChannels (shadertoy mode)
    if (runtimePass.namedSamplers && runtimePass.namedSamplers.size > 0) {
      this.bindNamedSamplers(runtimePass);
    } else {
      this.bindChannelTextures(runtimePass);
    }

    // Draw fullscreen triangle
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Unbind
    gl.bindVertexArray(null);
    gl.useProgram(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private bindBuiltinUniforms(
    uniforms: PassUniformLocations,
    values: BuiltinUniformValues,
  ): void {
    const gl = this.gl;

    if (uniforms.iResolution) {
      gl.uniform3f(uniforms.iResolution, values.iResolution[0], values.iResolution[1], values.iResolution[2]);
    }

    if (uniforms.iTime) {
      gl.uniform1f(uniforms.iTime, values.iTime);
    }

    if (uniforms.iTimeDelta) {
      gl.uniform1f(uniforms.iTimeDelta, values.iTimeDelta);
    }

    if (uniforms.iFrame) {
      gl.uniform1i(uniforms.iFrame, values.iFrame);
    }

    if (uniforms.iMouse) {
      gl.uniform4f(uniforms.iMouse, values.iMouse[0], values.iMouse[1], values.iMouse[2], values.iMouse[3]);
    }

    if (uniforms.iMousePressed) {
      gl.uniform1i(uniforms.iMousePressed, values.iMousePressed ? 1 : 0);
    }

    if (uniforms.iDate) {
      gl.uniform4f(uniforms.iDate, values.iDate[0], values.iDate[1], values.iDate[2], values.iDate[3]);
    }

    if (uniforms.iFrameRate) {
      gl.uniform1f(uniforms.iFrameRate, values.iFrameRate);
    }

    // Touch uniforms
    if (uniforms.iTouchCount) {
      gl.uniform1i(uniforms.iTouchCount, values.iTouchCount);
    }

    // Bind individual touch points (iTouch0, iTouch1, iTouch2)
    for (let i = 0; i < 3; i++) {
      const loc = uniforms.iTouch[i];
      if (loc) {
        const t = values.iTouch[i];
        gl.uniform4f(loc, t[0], t[1], t[2], t[3]);
      }
    }

    if (uniforms.iPinch) {
      gl.uniform1f(uniforms.iPinch, values.iPinch);
    }

    if (uniforms.iPinchDelta) {
      gl.uniform1f(uniforms.iPinchDelta, values.iPinchDelta);
    }

    if (uniforms.iPinchCenter) {
      gl.uniform2f(uniforms.iPinchCenter, values.iPinchCenter[0], values.iPinchCenter[1]);
    }

    // Cross-view uniforms for multi-view projects
    if (values.crossViewStates) {
      for (const [viewName, state] of values.crossViewStates) {
        const mouseLoc = uniforms.crossViewMouse.get(viewName);
        if (mouseLoc) {
          gl.uniform4f(mouseLoc, state.mouse[0], state.mouse[1], state.mouse[2], state.mouse[3]);
        }

        const resLoc = uniforms.crossViewResolution.get(viewName);
        if (resLoc) {
          gl.uniform3f(resLoc, state.resolution[0], state.resolution[1], state.resolution[2]);
        }

        const pressedLoc = uniforms.crossViewMousePressed.get(viewName);
        if (pressedLoc) {
          gl.uniform1i(pressedLoc, state.mousePressed ? 1 : 0);
        }
      }
    }
  }

  private bindChannelTextures(runtimePass: RuntimePass): void {
    const gl = this.gl;

    for (let i = 0; i < 4; i++) {
      const channelSource = runtimePass.projectChannels[i];
      const texture = this.resolveChannelTexture(channelSource);
      const resolution = this.resolveChannelResolution(channelSource);

      // Bind texture to texture unit i
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Set uniform to use texture unit i
      const uniformLoc = runtimePass.uniforms.iChannel[i];
      if (uniformLoc) {
        gl.uniform1i(uniformLoc, i);
      }

      // Set iChannelResolution[i]
      const resLoc = runtimePass.uniforms.iChannelResolution[i];
      if (resLoc) {
        gl.uniform3f(resLoc, resolution[0], resolution[1], 1.0);
      }
    }
  }

  /**
   * Bind named samplers (standard mode).
   * Each named sampler gets its own texture unit.
   */
  private bindNamedSamplers(runtimePass: RuntimePass): void {
    const gl = this.gl;
    let textureUnit = 0;

    for (const [name, source] of runtimePass.namedSamplers!) {
      const texture = this.resolveChannelTexture(source);
      const resolution = this.resolveChannelResolution(source);

      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      const loc = runtimePass.uniforms.namedSamplers.get(name);
      if (loc) gl.uniform1i(loc, textureUnit);

      const resLoc = runtimePass.uniforms.namedSamplerResolutions.get(name);
      if (resLoc) gl.uniform3f(resLoc, resolution[0], resolution[1], 1.0);

      textureUnit++;
    }
  }

  /**
   * Resolve a ChannelSource to an actual WebGLTexture to bind.
   */
  private resolveChannelTexture(source: ChannelSource): WebGLTexture {
    switch (source.kind) {
      case 'none':
        // Unused channel → bind black texture
        if (!this._blackTexture) {
          throw new Error('Black texture not initialized');
        }
        return this._blackTexture;

      case 'buffer': {
        // Buffer reference → find RuntimePass and return current or previous texture
        const targetPass = this._passes.find((p) => p.name === source.buffer);
        if (!targetPass) {
          throw new Error(`Buffer '${source.buffer}' not found`);
        }

        // Default to previous frame (safer, matches common use case)
        // Only use current frame if explicitly requested with current: true
        return source.current ? targetPass.currentTexture : targetPass.previousTexture;
      }

      case 'texture': {
        // External texture → find RuntimeTexture by name
        const tex = this._textures.find((t) => t.name === source.name);
        if (!tex) {
          throw new Error(`Texture '${source.name}' not found`);
        }
        return tex.texture;
      }

      case 'keyboard':
        if (!this._keyboardTexture) {
          throw new Error('Internal error: keyboard texture not initialized');
        }
        return this._keyboardTexture.texture;

      case 'audio':
        if (!this._media.audioTexture) {
          return this._blackTexture!;
        }
        return this._media.audioTexture.texture;

      case 'webcam': {
        const webcam = this._media.videoTextures.find(v => v.kind === 'webcam');
        return webcam?.texture ?? this._blackTexture!;
      }

      case 'video': {
        const video = this._media.videoTextures.find(v => v.kind === 'video' && v.src === source.src);
        return video?.texture ?? this._blackTexture!;
      }

      case 'script': {
        const scriptTex = this._scriptTextures.get(source.name);
        return scriptTex?.texture ?? this._blackTexture!;
      }
    }
  }

  /**
   * Resolve a ChannelSource to its resolution [width, height].
   * Returns [0, 0] for unused channels.
   */
  private resolveChannelResolution(source: ChannelSource): [number, number] {
    switch (source.kind) {
      case 'none':
        return [0, 0];

      case 'buffer':
        return [this._width, this._height];

      case 'texture': {
        const tex = this._textures.find((t) => t.name === source.name);
        if (!tex) return [0, 0];
        return [tex.width, tex.height];
      }

      case 'keyboard':
        return [256, 3];

      case 'audio':
        return this._media.audioTexture ? [this._media.audioTexture.width, this._media.audioTexture.height] : [0, 0];

      case 'webcam': {
        const webcam = this._media.videoTextures.find(v => v.kind === 'webcam');
        return webcam ? [webcam.width, webcam.height] : [0, 0];
      }

      case 'video': {
        const video = this._media.videoTextures.find(v => v.kind === 'video' && v.src === source.src);
        return video ? [video.width, video.height] : [0, 0];
      }

      case 'script': {
        const scriptTex = this._scriptTextures.get(source.name);
        return scriptTex ? [scriptTex.width, scriptTex.height] : [0, 0];
      }
    }
  }

  /**
   * Swap current and previous textures for a pass (ping-pong).
   * Also reattach framebuffer to new current texture.
   */
  private swapPassTextures(pass: RuntimePass): void {
    const gl = this.gl;

    // Swap texture references
    const temp = pass.currentTexture;
    pass.currentTexture = pass.previousTexture;
    pass.previousTexture = temp;

    // Re-attach framebuffer to new current texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, pass.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      pass.currentTexture,
      0
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}
