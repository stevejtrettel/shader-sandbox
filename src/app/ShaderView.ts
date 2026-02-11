/**
 * ShaderView - Per-Canvas Rendering Unit
 *
 * Owns everything that is truly per-canvas:
 *  - Canvas element + WebGL2 context
 *  - ShaderEngine (passes, uniforms, textures)
 *  - InputManager (mouse, touch, keyboard)
 *  - ResizeObserver (debounced resize + engine resize)
 *  - Context loss/restore handling
 *  - Error overlays
 *  - Media initialization (audio/webcam/video)
 *  - Script info overlays
 *
 * Does NOT own: animation loop, PlaybackControls, StatsPanel, Recorder,
 * UniformsPanel, script hooks, keyboard shortcuts. Those are coordinator
 * concerns managed by App.
 */

import { ShaderEngine } from '../engine/ShaderEngine';
import { ErrorOverlay } from './ErrorOverlay';
import { RuntimeErrorOverlay } from './RuntimeErrorOverlay';
import { ShaderProject, CrossViewState, OverlayPosition } from '../project/types';
import { InputManager } from './InputManager';
import { MouseState } from './types';

export interface ShaderViewOptions {
  container: HTMLElement;
  project: ShaderProject;
  pixelRatio: number;
  viewNames?: string[];
}

export class ShaderView {
  readonly container: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly gl: WebGL2RenderingContext;
  readonly errorOverlay: ErrorOverlay;
  readonly runtimeErrorOverlay: RuntimeErrorOverlay;
  readonly input: InputManager;

  private _engine: ShaderEngine;
  private _project: ShaderProject;
  private _pixelRatio: number;
  private _viewNames?: string[];

  private _resizeObserver: ResizeObserver;
  private _resizeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Context loss
  private _contextLostOverlay: HTMLElement | null = null;
  private _isContextLost: boolean = false;

  // Media
  private _mediaBanner: HTMLElement | null = null;
  private _mediaInitialized: boolean = false;

  // Script info overlays (one per corner position)
  private _overlays: Map<OverlayPosition, HTMLElement> = new Map();

  // Callbacks for App to hook into
  onResize: ((width: number, height: number) => void) | null = null;
  onContextRestored: (() => void) | null = null;

  get engine(): ShaderEngine { return this._engine; }
  get isContextLost(): boolean { return this._isContextLost; }

  constructor(opts: ShaderViewOptions) {
    this.container = opts.container;
    this._project = opts.project;
    this._pixelRatio = opts.pixelRatio;
    this._viewNames = opts.viewNames;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.container.appendChild(this.canvas);

    // Error overlays
    this.errorOverlay = new ErrorOverlay(this.container);
    this.runtimeErrorOverlay = new RuntimeErrorOverlay(this.container);

    // Get WebGL2 context
    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      throw new Error('WebGL2 not supported');
    }

    this.gl = gl;

    // Context loss handling
    this.setupContextLossHandling();

    // Initialize canvas size
    this.updateCanvasSize();

    // Create engine
    this._engine = new ShaderEngine({
      gl: this.gl,
      project: opts.project,
      viewNames: opts.viewNames,
      onAssetError: (err) => {
        const title = err.type === 'texture'
          ? `Texture '${err.name}' failed to load`
          : `Framebuffer '${err.name}' error`;
        this.runtimeErrorOverlay.showWarning(title, err.detail);
      },
    });

    // Show error overlay if compilation failed
    if (this._engine.hasErrors()) {
      this.errorOverlay.show(this._engine.getCompilationErrors(), this._project);
    }

    // Show media banner if needed
    if (this._engine.needsAudio || this._engine.needsWebcam) {
      this.showMediaBanner();
    }

    // Resize observer with debounced engine resize + reset
    this._resizeObserver = new ResizeObserver(() => {
      this.updateCanvasSize();

      if (this._resizeDebounceTimer !== null) {
        clearTimeout(this._resizeDebounceTimer);
      }
      this._resizeDebounceTimer = setTimeout(() => {
        this._resizeDebounceTimer = null;
        this._engine.resize(this.canvas.width, this.canvas.height);
        this._engine.reset();
        this.onResize?.(this.canvas.width, this.canvas.height);
      }, 150);
    });
    this._resizeObserver.observe(this.container);

    // Input tracking
    this.input = new InputManager(this.canvas, this._pixelRatio);
    this.input.onFirstGesture = () => this.initMediaOnGesture();

    // Initialize video files (muted, no gesture needed)
    this.initVideoFiles();
  }

  // ===========================================================================
  // Per-Frame Rendering
  // ===========================================================================

  /**
   * Step this view for one frame: forward input, run engine, blit to screen.
   */
  step(time: number, crossViewStates?: Map<string, CrossViewState>): void {
    if (this._isContextLost) return;

    // Forward key events to engine
    for (const evt of this.input.getAndClearKeyEvents()) {
      this._engine.updateKeyState(evt.keycode, evt.down);
    }
    this._engine.updateKeyboardTexture();

    // Update media textures
    this._engine.updateAudioTexture();
    this._engine.updateVideoTextures();

    // Step engine
    this._engine.step(time, this.input.mouse, this.input.isMouseDown, {
      count: this.input.touchState.count,
      touches: this.input.touchState.touches,
      pinch: this.input.touchState.pinch,
      pinchDelta: this.input.touchState.pinchDelta,
      pinchCenter: this.input.touchState.pinchCenter,
    }, crossViewStates);

    // Reset pinchDelta after frame
    this.input.touchState.pinchDelta = 0;

    // Present to screen
    this.presentToScreen();
  }

  /**
   * Blit engine Image pass output to the canvas.
   */
  presentToScreen(): void {
    const gl = this.gl;
    if (!this._engine.bindImageForRead()) return;

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(
      0, 0, this.canvas.width, this.canvas.height,
      0, 0, this.canvas.width, this.canvas.height,
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST
    );
    this._engine.unbindImageForRead();
  }

  // ===========================================================================
  // Cross-View State Getters
  // ===========================================================================

  getMouseState(): MouseState { return [...this.input.mouse] as MouseState; }
  getResolution(): [number, number, number] { return [this.canvas.width, this.canvas.height, 1.0]; }
  getMousePressed(): boolean { return this.input.isMouseDown; }

  hasErrors(): boolean { return this._engine.hasErrors(); }

  // ===========================================================================
  // Script Info Overlays
  // ===========================================================================

  setOverlay(position: OverlayPosition, text: string | null): void {
    let overlay = this._overlays.get(position);

    if (text === null) {
      if (overlay) overlay.classList.add('hidden');
      return;
    }

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = `script-overlay ${position}`;
      this.container.appendChild(overlay);
      this._overlays.set(position, overlay);
    }

    overlay.textContent = text;
    overlay.classList.remove('hidden');
  }

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  dispose(): void {
    this.input.dispose();
    this._resizeObserver.disconnect();
    if (this._resizeDebounceTimer !== null) {
      clearTimeout(this._resizeDebounceTimer);
    }
    this._engine.dispose();
    this.errorOverlay.hide();
    this.runtimeErrorOverlay.dispose();
    this.hideMediaBanner();
    this.hideContextLostOverlay();
    for (const overlay of this._overlays.values()) {
      overlay.remove();
    }
    this._overlays.clear();
    this.container.removeChild(this.canvas);
  }

  // ===========================================================================
  // Canvas Sizing
  // ===========================================================================

  private updateCanvasSize(): void {
    const rect = this.container.getBoundingClientRect();
    const width = Math.floor(rect.width * this._pixelRatio);
    const height = Math.floor(rect.height * this._pixelRatio);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  // ===========================================================================
  // Context Loss Handling
  // ===========================================================================

  private setupContextLossHandling(): void {
    this.canvas.addEventListener('webglcontextlost', (e: Event) => {
      e.preventDefault();
      this.handleContextLost();
    });

    this.canvas.addEventListener('webglcontextrestored', () => {
      this.handleContextRestored();
    });
  }

  private handleContextLost(): void {
    this._isContextLost = true;
    this.showContextLostOverlay();
    console.warn('WebGL context lost. Waiting for restoration...');
  }

  private handleContextRestored(): void {
    console.log('WebGL context restored. Reinitializing...');

    try {
      this._engine.dispose();

      this._engine = new ShaderEngine({
        gl: this.gl,
        project: this._project,
        viewNames: this._viewNames,
        onAssetError: (err) => {
          const title = err.type === 'texture'
            ? `Texture '${err.name}' failed to load`
            : `Framebuffer '${err.name}' error`;
          this.runtimeErrorOverlay.showWarning(title, err.detail);
        },
      });

      if (this._engine.hasErrors()) {
        this.errorOverlay.show(this._engine.getCompilationErrors(), this._project);
      }

      this._engine.resize(this.canvas.width, this.canvas.height);

      this.hideContextLostOverlay();
      this._isContextLost = false;

      // Notify App so it can re-run script setup, reset time, etc.
      this.onContextRestored?.();

      console.log('WebGL context successfully restored');
    } catch (error) {
      console.error('Failed to restore WebGL context:', error);
      this.showContextLostOverlay(true);
    }
  }

  private showContextLostOverlay(showReload: boolean = false): void {
    if (!this._contextLostOverlay) {
      this._contextLostOverlay = document.createElement('div');
      this._contextLostOverlay.className = 'context-lost-overlay';
      this.container.appendChild(this._contextLostOverlay);
    }

    if (showReload) {
      this._contextLostOverlay.innerHTML = `
        <div class="context-lost-content">
          <div class="context-lost-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div class="context-lost-title">WebGL Context Lost</div>
          <div class="context-lost-message">Unable to restore automatically.</div>
          <button class="context-lost-reload" onclick="location.reload()">Reload Page</button>
        </div>
      `;
    } else {
      this._contextLostOverlay.innerHTML = `
        <div class="context-lost-content">
          <div class="context-lost-spinner"></div>
          <div class="context-lost-title">WebGL Context Lost</div>
          <div class="context-lost-message">Attempting to restore...</div>
        </div>
      `;
    }
  }

  private hideContextLostOverlay(): void {
    if (this._contextLostOverlay) {
      this._contextLostOverlay.remove();
      this._contextLostOverlay = null;
    }
  }

  // ===========================================================================
  // Media Initialization
  // ===========================================================================

  private initMediaOnGesture(): void {
    if (this._mediaInitialized) return;
    this._mediaInitialized = true;
    this.hideMediaBanner();

    if (this._engine.needsAudio) {
      this._engine.initAudio();
    }
    if (this._engine.needsWebcam) {
      this._engine.initWebcam();
    }
  }

  private initVideoFiles(): void {
    for (const src of this._engine.videoSources) {
      this._engine.initVideo(src);
    }
  }

  private showMediaBanner(): void {
    this._mediaBanner = document.createElement('div');
    this._mediaBanner.className = 'media-permission-banner';

    const features: string[] = [];
    if (this._engine.needsAudio) features.push('microphone');
    if (this._engine.needsWebcam) features.push('webcam');

    this._mediaBanner.innerHTML = `
      <span class="media-banner-text">This shader uses ${features.join(' and ')}</span>
      <button class="media-banner-button">Click to enable</button>
    `;

    const button = this._mediaBanner.querySelector('.media-banner-button')!;
    button.addEventListener('click', () => {
      this.initMediaOnGesture();
    });

    this.container.appendChild(this._mediaBanner);
  }

  private hideMediaBanner(): void {
    if (this._mediaBanner) {
      this._mediaBanner.remove();
      this._mediaBanner = null;
    }
  }
}
