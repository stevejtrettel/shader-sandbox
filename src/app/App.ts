/**
 * App Layer - Browser Runtime Coordinator
 *
 * Responsibilities:
 *  - Create and manage canvas
 *  - Initialize ShaderEngine
 *  - Run animation loop (requestAnimationFrame)
 *  - Handle resize and mouse events
 *  - Present Image pass output to screen
 */

import './app.css';

import { ShaderEngine } from '../engine/ShaderEngine';
import { ErrorOverlay } from './ErrorOverlay';
import { ShaderProject, ScriptEngineAPI, CrossViewState, OverlayPosition } from '../project/types';
import { UniformsPanel } from '../uniforms/UniformsPanel';
import { AppOptions, MouseState } from './types';
import { exportHTML as exportHTMLFile } from './exportHTML';
import { Recorder } from './Recorder';
import { StatsPanel } from './StatsPanel';
import { InputManager } from './InputManager';
import { PlaybackControls } from './PlaybackControls';

export class App {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private engine: ShaderEngine;
  private project: ShaderProject;

  private pixelRatio: number;
  private animationId: number | null = null;
  private startTime: number = 0;
  private disposed: boolean = false;

  // Input tracking
  private input: InputManager;

  // Stats panel
  private statsPanel: StatsPanel;

  // Playback controls
  private playbackControls: PlaybackControls | null = null;
  private isPaused: boolean = false; // Will be set from project.startPaused in constructor

  // Error overlay
  private errorOverlay: ErrorOverlay;
  private mediaBanner: HTMLElement | null = null;

  // Resize observer
  private resizeObserver: ResizeObserver;

  // Visibility observer (auto-pause when off-screen)
  private intersectionObserver: IntersectionObserver;
  private isVisible: boolean = true;

  // WebGL context loss handling
  private contextLostOverlay: HTMLElement | null = null;
  private isContextLost: boolean = false;

  // Floating uniforms panel
  private uniformsPanel: UniformsPanel | null = null;

  // Script hooks API
  private scriptAPI: ScriptEngineAPI | null = null;
  private scriptErrorCount: number = 0;
  private _lastOnFrameTime: number | null = null;
  private static readonly MAX_SCRIPT_ERRORS = 10;

  // Media initialization flag (audio/webcam need user gesture)
  private mediaInitialized: boolean = false;

  // Recording
  private recorder: Recorder;

  // Keyboard shortcut handlers (stored for cleanup in dispose)
  private globalKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  private controlsKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  // External animation loop mode (for multi-view AppGroup coordination)
  // Stored for future use when App needs to know it's externally coordinated
  private _externalAnimationLoop: boolean = false;

  // Script info overlays (one per corner position)
  private overlays: Map<OverlayPosition, HTMLElement> = new Map();

  constructor(opts: AppOptions) {
    this.container = opts.container;
    this.project = opts.project;
    // Priority: opts.pixelRatio > project.pixelRatio > window.devicePixelRatio
    this.pixelRatio = opts.pixelRatio ?? opts.project.pixelRatio ?? window.devicePixelRatio;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.container.appendChild(this.canvas);

    // Create recorder and error overlay
    this.recorder = new Recorder(this.canvas, this.container, opts.project.root);
    this.errorOverlay = new ErrorOverlay(this.container);

    // Create stats panel
    this.statsPanel = new StatsPanel(this.container);

    // Create playback controls if enabled (skip for 'ui' layout which has its own)
    if (opts.project.controls && !opts.skipPlaybackControls) {
      this.playbackControls = new PlaybackControls(this.container, {
        onTogglePlayPause: () => this.togglePlayPause(),
        onReset: () => this.reset(),
        onScreenshot: () => this.screenshot(),
        onToggleRecording: () => this.toggleRecording(),
        onExportHTML: () => this.exportHTML(),
      });
    }

    // Handle startPaused option
    if (opts.project.startPaused) {
      this.isPaused = true;
      this.playbackControls?.setPaused(true);
    }

    // Get WebGL2 context
    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true, // Required for screenshots
      powerPreference: 'high-performance',
    });

    if (!gl) {
      throw new Error('WebGL2 not supported');
    }

    this.gl = gl;

    // Set up WebGL context loss handling
    this.setupContextLossHandling();

    // Initialize canvas size
    this.updateCanvasSize();
    this.statsPanel.updateResolution(this.canvas.width, this.canvas.height);

    // Store external animation loop flag
    this._externalAnimationLoop = opts.externalAnimationLoop ?? false;

    // Create engine (pass viewNames for cross-view uniform support)
    this.engine = new ShaderEngine({
      gl: this.gl,
      project: opts.project,
      viewNames: opts.viewNames,
    });

    // Check for compilation errors and show overlay if needed
    if (this.engine.hasErrors()) {
      this.errorOverlay.show(this.engine.getCompilationErrors(), this.project);
    }

    // Show media permission banner if audio/webcam needed
    if (this.engine.needsAudio || this.engine.needsWebcam) {
      this.showMediaBanner();
    }

    // Initialize script API and run setup hook
    if (this.project.script) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      this.scriptAPI = {
        setUniformValue: (name, value) => self.engine.setUniformValue(name, value),
        getUniformValue: (name) => self.engine.getUniformValue(name),
        updateTexture: (name, w, h, data) => self.engine.updateTexture(name, w, h, data),
        readPixels: (passName, x, y, w, h) => self.engine.readPixels(passName as any, x, y, w, h),
        get width() { return self.engine.width; },
        get height() { return self.engine.height; },
        setOverlay: (position, text) => self.setOverlay(position, text),
      };

      if (this.project.script.setup) {
        try {
          this.project.script.setup(this.scriptAPI);
        } catch (e) {
          console.error('script.js setup() threw:', e);
        }
      }
    }

    // Create floating uniforms panel (skip for 'ui' layout which has its own)
    if (!opts.skipUniformsPanel && opts.project.uniforms && Object.keys(opts.project.uniforms).length > 0) {
      this.uniformsPanel = new UniformsPanel({
        container: this.container,
        uniforms: opts.project.uniforms,
        onChange: (name, value) => {
          this.engine.setUniformValue(name, value);
        },
      });
    }

    // Set up resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.updateCanvasSize();
      this.engine.resize(this.canvas.width, this.canvas.height);
      this.statsPanel.updateResolution(this.canvas.width, this.canvas.height);
      // Reset frame counter so shaders can reinitialize (important for accumulators)
      this.startTime = performance.now() / 1000;
      this.engine.reset();
    });
    this.resizeObserver.observe(this.container);

    // Set up intersection observer for auto-pause when off-screen
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        this.isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 } // Trigger when 10% visible
    );
    this.intersectionObserver.observe(this.container);

    // Set up input tracking
    this.input = new InputManager(this.canvas, this.pixelRatio);
    this.input.onFirstGesture = () => this.initMediaOnGesture();

    // Initialize video files (muted, no gesture needed)
    this.initVideoFiles();

    // Set up global keyboard shortcuts (always available)
    this.setupGlobalShortcuts();

    // Set up keyboard shortcuts if controls are enabled
    if (opts.project.controls) {
      this.setupKeyboardShortcuts();
    }
  }

  // ===========================================================================
  // Media Initialization
  // ===========================================================================

  /**
   * Initialize audio/webcam on first user gesture (required by browser policy).
   * Video files are auto-started in the constructor since muted videos don't need gestures.
   */
  private initMediaOnGesture(): void {
    if (this.mediaInitialized) return;
    this.mediaInitialized = true;
    this.hideMediaBanner();

    if (this.engine.needsAudio) {
      this.engine.initAudio();
    }
    if (this.engine.needsWebcam) {
      this.engine.initWebcam();
    }
  }

  /**
   * Start video file playback (muted, doesn't require user gesture).
   */
  private initVideoFiles(): void {
    for (const src of this.engine.videoSources) {
      this.engine.initVideo(src);
    }
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Check if there were any shader compilation errors.
   * Returns true if the engine has errors and should not be started.
   */
  hasErrors(): boolean {
    return this.engine.hasErrors();
  }

  /**
   * Get the underlying engine instance.
   * Used for live recompilation in editor mode.
   */
  getEngine(): ShaderEngine {
    return this.engine;
  }

  /**
   * Start the animation loop.
   * When externalAnimationLoop is true, this is a no-op since AppGroup manages timing.
   */
  start(): void {
    if (this._externalAnimationLoop) {
      return; // Externally coordinated by AppGroup
    }

    if (this.animationId !== null) {
      return; // Already running
    }

    this.startTime = performance.now() / 1000;
    this.animate(this.startTime);
  }

  /**
   * Stop the animation loop.
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // ===========================================================================
  // Multi-View Support (for AppGroup coordination)
  // ===========================================================================

  /**
   * Get current mouse state for cross-view uniforms.
   */
  getMouseState(): MouseState {
    return [...this.input.mouse] as MouseState;
  }

  /**
   * Get current canvas resolution for cross-view uniforms.
   */
  getResolution(): [number, number, number] {
    return [this.canvas.width, this.canvas.height, 1.0];
  }

  /**
   * Get current mouse pressed state for cross-view uniforms.
   */
  getMousePressed(): boolean {
    return this.input.isMouseDown;
  }

  /**
   * Step the engine with external time control and cross-view state.
   * Used by AppGroup to coordinate multiple views.
   *
   * @param time - Elapsed time in seconds (shared across all views)
   * @param frame - Frame number (shared across all views)
   * @param crossViewStates - State from all views for cross-view uniforms
   */
  stepExternal(time: number, frame: number, crossViewStates?: Map<string, CrossViewState>): void {
    if (this.disposed || this.isContextLost) return;

    // Update FPS counter and stats
    const currentTimeSec = performance.now() / 1000;
    this.statsPanel.update(currentTimeSec, time);

    // Forward key events to engine and update keyboard texture
    for (const evt of this.input.getAndClearKeyEvents()) {
      this.engine.updateKeyState(evt.keycode, evt.down);
    }
    this.engine.updateKeyboardTexture();

    // Update media textures
    this.engine.updateAudioTexture();
    this.engine.updateVideoTextures();

    // Run script onFrame hook
    if (this.scriptAPI && this.project.script?.onFrame && this.scriptErrorCount < App.MAX_SCRIPT_ERRORS) {
      const deltaTime = this._lastOnFrameTime !== null ? time - this._lastOnFrameTime : 0;
      try {
        this.project.script.onFrame(this.scriptAPI, time, deltaTime, frame);
        this.scriptErrorCount = 0;
      } catch (e) {
        this.scriptErrorCount++;
        console.error(`script.js onFrame() threw (${this.scriptErrorCount}/${App.MAX_SCRIPT_ERRORS}):`, e);
        if (this.scriptErrorCount >= App.MAX_SCRIPT_ERRORS) {
          console.warn('script.js onFrame() disabled after too many errors');
        }
      }
      this._lastOnFrameTime = time;
    }

    // Run engine step with mouse, touch, and cross-view data
    this.engine.step(time, this.input.mouse, this.input.isMouseDown, {
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

  // ===========================================================================
  // Script Overlays
  // ===========================================================================

  /**
   * Set or clear an info overlay at a corner position.
   * Called by script.js via the ScriptEngineAPI.
   */
  setOverlay(position: OverlayPosition, text: string | null): void {
    let overlay = this.overlays.get(position);

    if (text === null) {
      // Hide overlay
      if (overlay) {
        overlay.classList.add('hidden');
      }
      return;
    }

    // Create overlay element if it doesn't exist
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = `script-overlay ${position}`;
      this.container.appendChild(overlay);
      this.overlays.set(position, overlay);
    }

    // Update text and show
    overlay.textContent = text;
    overlay.classList.remove('hidden');
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    this.disposed = true;
    this.stop();
    this.input.dispose();
    this.recorder.dispose();
    this.playbackControls?.dispose();
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    if (this.globalKeyHandler) document.removeEventListener('keydown', this.globalKeyHandler);
    if (this.controlsKeyHandler) document.removeEventListener('keydown', this.controlsKeyHandler);
    this.uniformsPanel?.destroy();
    this.engine.dispose();
    this.container.removeChild(this.canvas);
    this.statsPanel.dispose();
    this.hideContextLostOverlay();
    this.errorOverlay.hide();
    this.hideMediaBanner();
    // Clean up overlays
    for (const overlay of this.overlays.values()) {
      overlay.remove();
    }
    this.overlays.clear();
  }

  // ===========================================================================
  // Animation Loop
  // ===========================================================================

  private animate = (currentTimeMs: number): void => {
    // Guard against late callbacks after dispose()
    if (this.disposed) return;

    // Schedule next frame first (even if paused or invisible)
    this.animationId = requestAnimationFrame(this.animate);

    // Skip rendering if paused, off-screen, or context lost
    if (this.isPaused || !this.isVisible || this.isContextLost) {
      return;
    }

    const currentTimeSec = currentTimeMs / 1000;
    const elapsedTime = currentTimeSec - this.startTime;

    // Update FPS counter and stats
    this.statsPanel.update(currentTimeSec, elapsedTime);

    // Forward key events to engine and update keyboard texture
    for (const evt of this.input.getAndClearKeyEvents()) {
      this.engine.updateKeyState(evt.keycode, evt.down);
    }
    this.engine.updateKeyboardTexture();

    // Update media textures (audio FFT/waveform, video/webcam frames)
    this.engine.updateAudioTexture();
    this.engine.updateVideoTextures();

    // Run script onFrame hook (JS computation before shader execution)
    if (this.scriptAPI && this.project.script?.onFrame && this.scriptErrorCount < App.MAX_SCRIPT_ERRORS) {
      const deltaTime = this._lastOnFrameTime !== null ? elapsedTime - this._lastOnFrameTime : 0;
      try {
        this.project.script.onFrame(this.scriptAPI, elapsedTime, deltaTime, this.statsPanel.totalFrameCount);
        this.scriptErrorCount = 0; // Reset on success
      } catch (e) {
        this.scriptErrorCount++;
        console.error(`script.js onFrame() threw (${this.scriptErrorCount}/${App.MAX_SCRIPT_ERRORS}):`, e);
        if (this.scriptErrorCount >= App.MAX_SCRIPT_ERRORS) {
          console.warn('script.js onFrame() disabled after too many errors');
        }
      }
      this._lastOnFrameTime = elapsedTime;
    }

    // Run engine step with mouse and touch data
    this.engine.step(elapsedTime, this.input.mouse, this.input.isMouseDown, {
      count: this.input.touchState.count,
      touches: this.input.touchState.touches,
      pinch: this.input.touchState.pinch,
      pinchDelta: this.input.touchState.pinchDelta,
      pinchCenter: this.input.touchState.pinchCenter,
    });

    // Reset pinchDelta after frame (it's a per-frame delta)
    this.input.touchState.pinchDelta = 0;

    // Present Image pass output to screen
    this.presentToScreen();
  };

  /**
   * Present the Image pass output to the screen.
   *
   * Since Image is the final pass and we execute all passes to their FBOs,
   * we need to blit the Image pass output to the default framebuffer.
   */
  private presentToScreen(): void {
    const gl = this.gl;

    // Bind the Image pass's previousTexture as read source.
    // After the ping-pong swap, the rendered output is in previousTexture.
    if (!this.engine.bindImageForRead()) {
      console.warn('No Image pass found');
      return;
    }

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

    gl.blitFramebuffer(
      0, 0, this.canvas.width, this.canvas.height,  // src
      0, 0, this.canvas.width, this.canvas.height,  // dst
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST
    );

    // Restore FBO to normal state for next frame
    this.engine.unbindImageForRead();
  }

  // ===========================================================================
  // Resize Handling
  // ===========================================================================

  private updateCanvasSize(): void {
    const rect = this.container.getBoundingClientRect();
    const width = Math.floor(rect.width * this.pixelRatio);
    const height = Math.floor(rect.height * this.pixelRatio);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  /**
   * Set up global keyboard shortcuts (always available).
   */
  private setupGlobalShortcuts(): void {
    this.globalKeyHandler = (e: KeyboardEvent) => {
      // S - Screenshot
      if (e.code === 'KeyS' && !e.repeat) {
        e.preventDefault();
        this.screenshot();
      }
    };
    document.addEventListener('keydown', this.globalKeyHandler);
  }

  /**
   * Set up keyboard shortcuts for playback control.
   */
  private setupKeyboardShortcuts(): void {
    this.controlsKeyHandler = (e: KeyboardEvent) => {
      // Space - Play/Pause
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        this.togglePlayPause();
      }

      // R - Reset
      if (e.code === 'KeyR' && !e.repeat) {
        e.preventDefault();
        this.reset();
      }
    };
    document.addEventListener('keydown', this.controlsKeyHandler);
  }

  // ===========================================================================
  // WebGL Context Loss Handling
  // ===========================================================================

  /**
   * Set up handlers for WebGL context loss and restoration.
   * Context can be lost due to GPU driver issues, system sleep, etc.
   */
  private setupContextLossHandling(): void {
    this.canvas.addEventListener('webglcontextlost', (e: Event) => {
      e.preventDefault(); // Required to allow context restoration
      this.handleContextLost();
    });

    this.canvas.addEventListener('webglcontextrestored', () => {
      this.handleContextRestored();
    });
  }

  /**
   * Handle WebGL context loss - pause rendering and show overlay.
   */
  private handleContextLost(): void {
    this.isContextLost = true;
    this.stop();
    this.showContextLostOverlay();
    console.warn('WebGL context lost. Waiting for restoration...');
  }

  /**
   * Handle WebGL context restoration - reinitialize and resume.
   */
  private handleContextRestored(): void {
    console.log('WebGL context restored. Reinitializing...');

    try {
      // Dispose old engine resources (they're invalid now)
      this.engine.dispose();

      // Reinitialize engine with fresh GL state
      this.engine = new ShaderEngine({
        gl: this.gl,
        project: this.project,
      });

      // Check for compilation errors
      if (this.engine.hasErrors()) {
        this.errorOverlay.show(this.engine.getCompilationErrors(), this.project);
      }

      // Resize to current dimensions
      this.engine.resize(this.canvas.width, this.canvas.height);

      // Hide context lost overlay and resume
      this.hideContextLostOverlay();
      this.isContextLost = false;
      this.reset();
      this.start();

      console.log('WebGL context successfully restored');
    } catch (error) {
      console.error('Failed to restore WebGL context:', error);
      this.showContextLostOverlay(true); // Show with reload prompt
    }
  }

  /**
   * Show overlay when WebGL context is lost.
   */
  private showContextLostOverlay(showReload: boolean = false): void {
    if (!this.contextLostOverlay) {
      this.contextLostOverlay = document.createElement('div');
      this.contextLostOverlay.className = 'context-lost-overlay';
      this.container.appendChild(this.contextLostOverlay);
    }

    if (showReload) {
      this.contextLostOverlay.innerHTML = `
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
      this.contextLostOverlay.innerHTML = `
        <div class="context-lost-content">
          <div class="context-lost-spinner"></div>
          <div class="context-lost-title">WebGL Context Lost</div>
          <div class="context-lost-message">Attempting to restore...</div>
        </div>
      `;
    }
  }

  /**
   * Hide the context lost overlay.
   */
  private hideContextLostOverlay(): void {
    if (this.contextLostOverlay) {
      this.contextLostOverlay.remove();
      this.contextLostOverlay = null;
    }
  }

  /**
   * Toggle between play and pause states.
   * Public for UILayout to call.
   */
  togglePlayPause(): void {
    this.isPaused = !this.isPaused;
    this.playbackControls?.setPaused(this.isPaused);
  }

  /**
   * Get current paused state.
   */
  getPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Reset the shader to frame 0.
   * Public for UILayout to call.
   */
  reset(): void {
    this.startTime = performance.now() / 1000;
    this.statsPanel.reset();
    this.engine.reset();
  }

  /**
   * Capture and download a screenshot of the current canvas as PNG.
   * Filename format: shadertoy-{folderName}-{timestamp}.png
   * Public for UILayout to call.
   */
  screenshot(): void {
    // Extract folder name from project root (e.g., "/demos/keyboard-test" -> "keyboard-test")
    const folderName = this.project.root.split('/').pop() || 'shader';

    // Generate timestamp (YYYYMMDD-HHMMSS)
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') + '-' +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');

    const filename = `shadertoy-${folderName}-${timestamp}.png`;

    // Capture canvas as PNG blob
    this.canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create screenshot blob');
        return;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

      // Clean up
      URL.revokeObjectURL(url);

      console.log(`Screenshot saved: ${filename}`);
    }, 'image/png');
  }

  /**
   * Toggle video recording on/off.
   * Public for UILayout to call.
   */
  toggleRecording(): void {
    this.recorder.toggle(this.isPaused, () => this.togglePlayPause());
  }

  // ===========================================================================
  // HTML Export
  // ===========================================================================

  /**
   * Export the current shader as a standalone HTML file.
   */
  exportHTML(): void {
    exportHTMLFile(this.project, this.engine);
  }

  // ===========================================================================
  // Media Permission Banner
  // ===========================================================================

  private showMediaBanner(): void {
    this.mediaBanner = document.createElement('div');
    this.mediaBanner.className = 'media-permission-banner';

    const features: string[] = [];
    if (this.engine.needsAudio) features.push('microphone');
    if (this.engine.needsWebcam) features.push('webcam');

    this.mediaBanner.innerHTML = `
      <span class="media-banner-text">This shader uses ${features.join(' and ')}</span>
      <button class="media-banner-button">Click to enable</button>
    `;

    const button = this.mediaBanner.querySelector('.media-banner-button')!;
    button.addEventListener('click', () => {
      this.initMediaOnGesture();
    });

    this.container.appendChild(this.mediaBanner);
  }

  private hideMediaBanner(): void {
    if (this.mediaBanner) {
      this.mediaBanner.remove();
      this.mediaBanner = null;
    }
  }

}
