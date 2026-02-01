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
import { ShaderProject, ScriptEngineAPI } from '../project/types';
import { UniformsPanel } from '../uniforms/UniformsPanel';
import { AppOptions, MouseState, TouchState, PointerData } from './types';

// Map from KeyboardEvent.code to Shadertoy-compatible ASCII keycodes (0-255).
// This replaces the deprecated e.keyCode property.
const CODE_TO_ASCII: Record<string, number> = {};
// Letters: KeyA-KeyZ -> 65-90
for (let i = 0; i < 26; i++) {
  CODE_TO_ASCII[`Key${String.fromCharCode(65 + i)}`] = 65 + i;
}
// Digits: Digit0-Digit9 -> 48-57
for (let i = 0; i < 10; i++) {
  CODE_TO_ASCII[`Digit${i}`] = 48 + i;
}
// Function keys: F1-F12 -> 112-123
for (let i = 1; i <= 12; i++) {
  CODE_TO_ASCII[`F${i}`] = 111 + i;
}
// Common keys
Object.assign(CODE_TO_ASCII, {
  Backspace: 8, Tab: 9, Enter: 13, ShiftLeft: 16, ShiftRight: 16,
  ControlLeft: 17, ControlRight: 17, AltLeft: 18, AltRight: 18,
  Pause: 19, CapsLock: 20, Escape: 27, Space: 32,
  PageUp: 33, PageDown: 34, End: 35, Home: 36,
  ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40,
  Insert: 45, Delete: 46,
  NumLock: 144, ScrollLock: 145,
  Semicolon: 186, Equal: 187, Comma: 188, Minus: 189,
  Period: 190, Slash: 191, Backquote: 192,
  BracketLeft: 219, Backslash: 220, BracketRight: 221, Quote: 222,
});

/**
 * Convert a KeyboardEvent to a Shadertoy-compatible ASCII keycode (0-255).
 * Returns null if the key doesn't map to a valid code.
 */
function keyEventToAscii(e: KeyboardEvent): number | null {
  const code = CODE_TO_ASCII[e.code];
  if (code !== undefined && code >= 0 && code < 256) {
    return code;
  }
  return null;
}

export class App {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private engine: ShaderEngine;
  private project: ShaderProject;

  private pixelRatio: number;
  private animationId: number | null = null;
  private startTime: number = 0;

  // Mouse state for iMouse uniform
  private mouse: MouseState = [0, 0, -1, -1];

  // Touch state for touch uniforms
  private touchState: TouchState = {
    count: 0,
    touches: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    pinch: 1.0,
    pinchDelta: 0.0,
    pinchCenter: [0, 0],
  };

  // Pointer tracking for gesture recognition
  private activePointers: Map<number, PointerData> = new Map();

  // FPS tracking
  private fpsDisplay: HTMLElement;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;

  // Stats panel (expandable from FPS counter)
  private statsContainer: HTMLElement | null = null;
  private statsGrid: HTMLElement | null = null;
  private timeDisplay: HTMLElement | null = null;
  private frameDisplay: HTMLElement | null = null;
  private resolutionDisplay: HTMLElement | null = null;
  private totalFrameCount: number = 0;
  private isStatsOpen: boolean = false;

  // Playback controls
  private controlsContainer: HTMLElement | null = null;
  private controlsGrid: HTMLElement | null = null;
  private menuButton: HTMLElement | null = null;
  private playPauseButton: HTMLElement | null = null;
  private isPaused: boolean = false; // Will be set from project.startPaused in constructor
  private isMenuOpen: boolean = false;

  // Error overlay
  private errorOverlay: HTMLElement | null = null;

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

  // Recording state
  private isRecording: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordButton: HTMLElement | null = null;
  private recordingIndicator: HTMLElement | null = null;

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

    // Create stats container (holds FPS button and expandable stats)
    this.statsContainer = document.createElement('div');
    this.statsContainer.className = 'stats-container';

    // Create FPS display (clickable to expand stats)
    this.fpsDisplay = document.createElement('button');
    this.fpsDisplay.className = 'fps-counter';
    this.fpsDisplay.textContent = '0 FPS';
    this.fpsDisplay.title = 'Click to show stats';
    this.fpsDisplay.addEventListener('click', () => this.toggleStats());

    // Create stats grid (hidden by default)
    this.statsGrid = document.createElement('div');
    this.statsGrid.className = 'stats-grid';

    // Time display
    this.timeDisplay = document.createElement('div');
    this.timeDisplay.className = 'stat-item';
    this.timeDisplay.innerHTML = '<span class="stat-value">0:00</span><span class="stat-label">time</span>';
    this.statsGrid.appendChild(this.timeDisplay);

    // Frame display
    this.frameDisplay = document.createElement('div');
    this.frameDisplay.className = 'stat-item';
    this.frameDisplay.innerHTML = '<span class="stat-value">0</span><span class="stat-label">frame</span>';
    this.statsGrid.appendChild(this.frameDisplay);

    // Resolution display
    this.resolutionDisplay = document.createElement('div');
    this.resolutionDisplay.className = 'stat-item';
    this.resolutionDisplay.innerHTML = '<span class="stat-value">0×0</span><span class="stat-label">res</span>';
    this.statsGrid.appendChild(this.resolutionDisplay);

    this.statsContainer.appendChild(this.statsGrid);
    this.statsContainer.appendChild(this.fpsDisplay);
    this.container.appendChild(this.statsContainer);

    // Create playback controls if enabled (skip for 'ui' layout which has its own)
    if (opts.project.controls && !opts.skipPlaybackControls) {
      this.createControls();
    }

    // Handle startPaused option
    if (opts.project.startPaused) {
      this.isPaused = true;
      // Update button if controls exist (will be created above)
      this.updatePlayPauseButton();
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

    // Create engine
    this.engine = new ShaderEngine({
      gl: this.gl,
      project: opts.project,
    });

    // Check for compilation errors and show overlay if needed
    if (this.engine.hasErrors()) {
      this.showErrorOverlay(this.engine.getCompilationErrors());
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

    // Set up mouse tracking
    this.setupMouseTracking();

    // Initialize video files (muted, no gesture needed)
    this.initVideoFiles();

    // Set up touch/pointer tracking
    this.setupTouchTracking();

    // Set up keyboard tracking for shader keyboard texture
    this.setupKeyboardTracking();

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
   */
  start(): void {
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

  /**
   * Clean up all resources.
   */
  dispose(): void {
    this.stop();
    // Stop recording if active
    if (this.isRecording) {
      this.stopRecording();
    }
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.uniformsPanel?.destroy();
    this.engine.dispose();
    this.container.removeChild(this.canvas);
    if (this.statsContainer) {
      this.container.removeChild(this.statsContainer);
    }
    this.hideContextLostOverlay();
    this.hideErrorOverlay();
    this.hideRecordingIndicator();
  }

  // ===========================================================================
  // Animation Loop
  // ===========================================================================

  private animate = (currentTimeMs: number): void => {
    // Schedule next frame first (even if paused or invisible)
    this.animationId = requestAnimationFrame(this.animate);

    // Skip rendering if paused, off-screen, or context lost
    if (this.isPaused || !this.isVisible || this.isContextLost) {
      return;
    }

    const currentTimeSec = currentTimeMs / 1000;
    const elapsedTime = currentTimeSec - this.startTime;

    // Update FPS counter and stats
    this.updateFps(currentTimeSec, elapsedTime);

    // Update keyboard texture with current key states
    this.engine.updateKeyboardTexture();

    // Update media textures (audio FFT/waveform, video/webcam frames)
    this.engine.updateAudioTexture();
    this.engine.updateVideoTextures();

    // Run script onFrame hook (JS computation before shader execution)
    if (this.scriptAPI && this.project.script?.onFrame && this.scriptErrorCount < App.MAX_SCRIPT_ERRORS) {
      const deltaTime = this._lastOnFrameTime !== null ? elapsedTime - this._lastOnFrameTime : 0;
      try {
        this.project.script.onFrame(this.scriptAPI, elapsedTime, deltaTime, this.totalFrameCount);
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
    this.engine.step(elapsedTime, this.mouse, {
      count: this.touchState.count,
      touches: this.touchState.touches,
      pinch: this.touchState.pinch,
      pinchDelta: this.touchState.pinchDelta,
      pinchCenter: this.touchState.pinchCenter,
    });

    // Reset pinchDelta after frame (it's a per-frame delta)
    this.touchState.pinchDelta = 0;

    // Present Image pass output to screen
    this.presentToScreen();
  };

  /**
   * Update FPS counter.
   * FPS display updates once per second, frame count updates every frame.
   */
  private updateFps(currentTimeSec: number, elapsedTime: number): void {
    this.frameCount++;
    this.totalFrameCount++;

    // Update frame count display every frame if stats panel is open
    if (this.isStatsOpen && this.frameDisplay) {
      this.updateFrameDisplay();
    }

    // Update FPS display once per second
    if (currentTimeSec - this.lastFpsUpdate >= 1.0) {
      this.currentFps = this.frameCount / (currentTimeSec - this.lastFpsUpdate);
      this.fpsDisplay.textContent = `${Math.round(this.currentFps)} FPS`;
      this.frameCount = 0;
      this.lastFpsUpdate = currentTimeSec;

      // Update time/resolution stats once per second (they don't need per-frame updates)
      if (this.isStatsOpen) {
        this.updateTimeDisplay(elapsedTime);
        this.updateResolutionDisplay();
      }
    }
  }

  /**
   * Update frame count display.
   */
  private updateFrameDisplay(): void {
    if (!this.frameDisplay) return;

    let frameStr: string;
    if (this.totalFrameCount >= 1000000) {
      frameStr = (this.totalFrameCount / 1000000).toFixed(1) + 'M';
    } else if (this.totalFrameCount >= 1000) {
      frameStr = (this.totalFrameCount / 1000).toFixed(1) + 'K';
    } else {
      frameStr = this.totalFrameCount.toString();
    }
    this.frameDisplay.querySelector('.stat-value')!.textContent = frameStr;
  }

  /**
   * Update time display.
   */
  private updateTimeDisplay(elapsedTime: number): void {
    if (!this.timeDisplay) return;

    const totalSeconds = Math.floor(elapsedTime);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let timeStr: string;
    if (hours > 0) {
      timeStr = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    this.timeDisplay.querySelector('.stat-value')!.textContent = timeStr;
  }

  /**
   * Update resolution display.
   */
  private updateResolutionDisplay(): void {
    if (!this.resolutionDisplay) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    this.resolutionDisplay.querySelector('.stat-value')!.textContent = `${w}×${h}`;
  }

  /**
   * Toggle the stats panel open/closed.
   */
  private toggleStats(): void {
    this.isStatsOpen = !this.isStatsOpen;

    if (this.statsGrid) {
      this.statsGrid.classList.toggle('open', this.isStatsOpen);
    }

    if (this.statsContainer) {
      this.statsContainer.classList.toggle('open', this.isStatsOpen);
    }

    // Update stats immediately when opening
    if (this.isStatsOpen) {
      const elapsedTime = (performance.now() / 1000) - this.startTime;
      this.updateTimeDisplay(elapsedTime);
      this.updateFrameDisplay();
      this.updateResolutionDisplay();
    }
  }

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

  // ===========================================================================
  // Mouse Tracking
  // ===========================================================================

  private setupMouseTracking(): void {
    const updateMouse = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * this.pixelRatio;
      const y = (rect.height - (e.clientY - rect.top)) * this.pixelRatio; // Flip Y

      this.mouse[0] = x;
      this.mouse[1] = y;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * this.pixelRatio;
      const y = (rect.height - (e.clientY - rect.top)) * this.pixelRatio; // Flip Y

      this.mouse[2] = x;
      this.mouse[3] = y;

      // Initialize media inputs on first user gesture (browser policy)
      this.initMediaOnGesture();
    };

    this.canvas.addEventListener('mousemove', updateMouse);
    this.canvas.addEventListener('click', handleClick);
  }

  // ===========================================================================
  // Touch/Pointer Tracking
  // ===========================================================================

  /**
   * Set up pointer event tracking for touch support.
   * Uses Pointer Events API for unified mouse/touch/pen handling.
   */
  private setupTouchTracking(): void {
    // Prevent default touch actions (scroll, zoom) on canvas
    this.canvas.style.touchAction = 'none';

    const getCanvasCoords = (clientX: number, clientY: number): [number, number] => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * this.pixelRatio;
      const y = (rect.height - (clientY - rect.top)) * this.pixelRatio; // Flip Y
      return [x, y];
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Only track touch and pen (mouse is handled separately)
      if (e.pointerType === 'mouse') return;

      const [x, y] = getCanvasCoords(e.clientX, e.clientY);

      this.activePointers.set(e.pointerId, {
        id: e.pointerId,
        x, y,
        startX: x,
        startY: y,
      });

      // Capture pointer to receive events even outside canvas
      this.canvas.setPointerCapture(e.pointerId);

      this.updateTouchState();

      // Single touch also updates iMouse for compatibility
      if (this.activePointers.size === 1) {
        this.mouse[0] = x;
        this.mouse[1] = y;
        this.mouse[2] = x; // Click position
        this.mouse[3] = y;
      }

      e.preventDefault();
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;

      const pointer = this.activePointers.get(e.pointerId);
      if (!pointer) return;

      const [x, y] = getCanvasCoords(e.clientX, e.clientY);
      pointer.x = x;
      pointer.y = y;

      this.updateTouchState();

      // Single touch also updates iMouse
      if (this.activePointers.size === 1) {
        this.mouse[0] = x;
        this.mouse[1] = y;
      }

      e.preventDefault();
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;

      this.activePointers.delete(e.pointerId);
      this.canvas.releasePointerCapture(e.pointerId);

      this.updateTouchState();
      e.preventDefault();
    };

    const handlePointerCancel = (e: PointerEvent) => {
      // Same as pointer up - finger lifted or system interrupted
      handlePointerUp(e);
    };

    this.canvas.addEventListener('pointerdown', handlePointerDown);
    this.canvas.addEventListener('pointermove', handlePointerMove);
    this.canvas.addEventListener('pointerup', handlePointerUp);
    this.canvas.addEventListener('pointercancel', handlePointerCancel);
  }

  /**
   * Update touch state from active pointers.
   * Calculates pinch gesture when 2+ fingers are active.
   */
  private updateTouchState(): void {
    const pointers = Array.from(this.activePointers.values());
    const count = pointers.length;

    this.touchState.count = count;

    // Update individual touch points (up to 3)
    for (let i = 0; i < 3; i++) {
      if (i < pointers.length) {
        const p = pointers[i];
        this.touchState.touches[i] = [p.x, p.y, p.startX, p.startY];
      } else {
        this.touchState.touches[i] = [0, 0, 0, 0];
      }
    }

    // Calculate pinch gesture (requires 2 fingers)
    if (count >= 2) {
      const p1 = pointers[0];
      const p2 = pointers[1];

      // Current distance
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);

      // Initial distance (from start positions)
      const sdx = p2.startX - p1.startX;
      const sdy = p2.startY - p1.startY;
      const startDistance = Math.sqrt(sdx * sdx + sdy * sdy);

      // Pinch scale relative to start
      if (startDistance > 0) {
        const newPinch = currentDistance / startDistance;
        this.touchState.pinchDelta = newPinch - this.touchState.pinch;
        this.touchState.pinch = newPinch;
      }

      // Pinch center
      this.touchState.pinchCenter = [
        (p1.x + p2.x) / 2,
        (p1.y + p2.y) / 2,
      ];
    } else {
      // Reset pinch when less than 2 fingers
      this.touchState.pinchDelta = 0;
      // Keep pinch at current value (don't reset to 1.0 until all fingers lift)
      if (count === 0) {
        this.touchState.pinch = 1.0;
        this.touchState.pinchCenter = [0, 0];
      }
    }
  }

  // ===========================================================================
  // Playback Controls
  // ===========================================================================

  /**
   * Create playback control buttons with collapsible menu.
   */
  private createControls(): void {
    // Create container
    this.controlsContainer = document.createElement('div');
    this.controlsContainer.className = 'playback-controls';

    // Create menu toggle button
    this.menuButton = document.createElement('button');
    this.menuButton.className = 'controls-menu-button';
    this.menuButton.title = 'Controls';
    this.menuButton.textContent = '+';
    this.menuButton.addEventListener('click', () => this.toggleControlsMenu());

    // Create controls grid (hidden by default)
    this.controlsGrid = document.createElement('div');
    this.controlsGrid.className = 'controls-grid';

    // Play/Pause button (starts showing pause icon since we're playing)
    this.playPauseButton = document.createElement('button');
    this.playPauseButton.className = 'control-button';
    this.playPauseButton.title = 'Play/Pause (Space)';
    this.playPauseButton.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M5 3h2v10H5V3zm4 0h2v10H9V3z"/>
      </svg>
    `;
    this.playPauseButton.addEventListener('click', () => this.togglePlayPause());

    // Reset button
    const resetButton = document.createElement('button');
    resetButton.className = 'control-button';
    resetButton.title = 'Reset (R)';
    resetButton.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
      </svg>
    `;
    resetButton.addEventListener('click', () => this.reset());

    // Screenshot button
    const screenshotButton = document.createElement('button');
    screenshotButton.className = 'control-button';
    screenshotButton.title = 'Screenshot (S)';
    screenshotButton.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
        <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/>
      </svg>
    `;
    screenshotButton.addEventListener('click', () => this.screenshot());

    // Record button
    this.recordButton = document.createElement('button');
    this.recordButton.className = 'control-button';
    this.recordButton.title = 'Record Video';
    this.recordButton.innerHTML = `
      <svg viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="5"/>
      </svg>
    `;
    this.recordButton.addEventListener('click', () => this.toggleRecording());

    // Export button
    const exportButton = document.createElement('button');
    exportButton.className = 'control-button';
    exportButton.title = 'Export HTML';
    exportButton.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/>
        <path d="M2 14.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
      </svg>
    `;
    exportButton.addEventListener('click', () => this.exportHTML());

    // Menu button clone for inside grid (6th cell)
    const menuButtonInGrid = document.createElement('button');
    menuButtonInGrid.className = 'control-button';
    menuButtonInGrid.title = 'Close';
    menuButtonInGrid.textContent = '−';
    menuButtonInGrid.style.fontSize = '20px';
    menuButtonInGrid.style.fontWeight = '300';
    menuButtonInGrid.addEventListener('click', () => this.toggleControlsMenu());

    // Add buttons to grid (positioned in 2x3 layout)
    // Row 1: Play/Pause, Reset, Export
    // Row 2: Screenshot, Record, Menu (close)
    this.controlsGrid.appendChild(this.playPauseButton);
    this.controlsGrid.appendChild(resetButton);
    this.controlsGrid.appendChild(exportButton);
    this.controlsGrid.appendChild(screenshotButton);
    this.controlsGrid.appendChild(this.recordButton);
    this.controlsGrid.appendChild(menuButtonInGrid);

    // Add grid and standalone menu button to container
    this.controlsContainer.appendChild(this.controlsGrid);
    this.controlsContainer.appendChild(this.menuButton);
    this.container.appendChild(this.controlsContainer);
  }

  /**
   * Toggle the controls menu open/closed.
   */
  private toggleControlsMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;

    if (this.menuButton) {
      this.menuButton.textContent = this.isMenuOpen ? '−' : '+';
    }

    if (this.controlsGrid) {
      this.controlsGrid.classList.toggle('open', this.isMenuOpen);
    }

    if (this.controlsContainer) {
      this.controlsContainer.classList.toggle('open', this.isMenuOpen);
    }
  }

  /**
   * Set up keyboard tracking for shader keyboard texture.
   * Tracks all key presses/releases and forwards to engine.
   */
  private setupKeyboardTracking(): void {
    // Track keydown events
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      const keycode = keyEventToAscii(e);
      if (keycode !== null) {
        this.engine.updateKeyState(keycode, true);
      }
    });

    // Track keyup events
    document.addEventListener('keyup', (e: KeyboardEvent) => {
      const keycode = keyEventToAscii(e);
      if (keycode !== null) {
        this.engine.updateKeyState(keycode, false);
      }
    });
  }

  /**
   * Set up global keyboard shortcuts (always available).
   */
  private setupGlobalShortcuts(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // S - Screenshot
      if (e.code === 'KeyS' && !e.repeat) {
        e.preventDefault();
        this.screenshot();
      }
    });
  }

  /**
   * Set up keyboard shortcuts for playback control.
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
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
    });
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
        this.showErrorOverlay(this.engine.getCompilationErrors());
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
    this.updatePlayPauseButton();
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
    this.frameCount = 0;
    this.totalFrameCount = 0;
    this.lastFpsUpdate = 0;
    this.engine.reset();

    // Update stats display if open
    if (this.isStatsOpen) {
      this.updateTimeDisplay(0);
      this.updateFrameDisplay();
      this.updateResolutionDisplay();
    }
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

  // ===========================================================================
  // Video Recording
  // ===========================================================================

  /**
   * Toggle video recording on/off.
   * Public for UILayout to call.
   */
  toggleRecording(): void {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  /**
   * Start recording the canvas as WebM video.
   */
  private startRecording(): void {
    // Check if MediaRecorder is supported
    if (!MediaRecorder.isTypeSupported('video/webm')) {
      console.error('WebM recording not supported in this browser');
      return;
    }

    // Unpause if paused (can't record a paused shader)
    if (this.isPaused) {
      this.togglePlayPause();
    }

    // Get canvas stream at 60fps
    const stream = this.canvas.captureStream(60);

    // Create MediaRecorder with WebM format
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 8000000, // 8 Mbps for high quality
    });

    this.recordedChunks = [];

    // Collect recorded chunks
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    // Handle recording stop - download the video
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });

      // Generate filename
      const folderName = this.project.root.split('/').pop() || 'shader';
      const now = new Date();
      const timestamp = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') + '-' +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');
      const filename = `shadertoy-${folderName}-${timestamp}.webm`;

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      console.log(`Recording saved: ${filename}`);
    };

    // Start recording
    this.mediaRecorder.start();
    this.isRecording = true;
    this.updateRecordButton();
    this.showRecordingIndicator();
    console.log('Recording started');
  }

  /**
   * Stop recording and trigger download.
   */
  private stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording = false;
    this.mediaRecorder = null;
    this.updateRecordButton();
    this.hideRecordingIndicator();
    console.log('Recording stopped');
  }

  /**
   * Update record button appearance based on recording state.
   */
  private updateRecordButton(): void {
    if (!this.recordButton) return;

    if (this.isRecording) {
      // Show stop icon (square)
      this.recordButton.innerHTML = `
        <svg viewBox="0 0 16 16">
          <rect x="4" y="4" width="8" height="8"/>
        </svg>
      `;
      this.recordButton.title = 'Stop Recording';
      this.recordButton.classList.add('recording');
    } else {
      // Show record icon (circle)
      this.recordButton.innerHTML = `
        <svg viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="5"/>
        </svg>
      `;
      this.recordButton.title = 'Record Video';
      this.recordButton.classList.remove('recording');
    }
  }

  /**
   * Show the recording indicator (pulsing red dot in corner).
   */
  private showRecordingIndicator(): void {
    if (this.recordingIndicator) return;

    this.recordingIndicator = document.createElement('div');
    this.recordingIndicator.className = 'recording-indicator';
    this.recordingIndicator.innerHTML = `
      <span class="recording-dot"></span>
      <span class="recording-text">REC</span>
    `;
    this.container.appendChild(this.recordingIndicator);
  }

  /**
   * Hide the recording indicator.
   */
  private hideRecordingIndicator(): void {
    if (this.recordingIndicator) {
      this.recordingIndicator.remove();
      this.recordingIndicator = null;
    }
  }

  // ===========================================================================
  // HTML Export
  // ===========================================================================

  /**
   * Export the current shader as a standalone HTML file.
   * Bakes in current uniform values and replaces textures with procedural grid.
   */
  exportHTML(): void {
    const project = this.project;
    const uniformValues = this.engine.getUniformValues();

    // Collect pass info
    const passOrder = ['BufferA', 'BufferB', 'BufferC', 'BufferD', 'Image'] as const;
    const passes: Array<{ name: string; source: string; channels: string[] }> = [];

    for (const passName of passOrder) {
      const pass = project.passes[passName];
      if (!pass) continue;

      // Map channels to their source type for the export
      const channels = pass.channels.map((ch) => {
        if (ch.kind === 'buffer') return ch.buffer;
        if (ch.kind === 'texture') return 'procedural'; // Will use grid texture
        if (ch.kind === 'keyboard') return 'keyboard';
        return 'none';
      });

      passes.push({
        name: passName,
        source: pass.glslSource,
        channels,
      });
    }

    // Build the HTML
    const html = this.generateStandaloneHTML({
      title: project.meta.title,
      commonSource: project.commonSource,
      passes,
      uniforms: project.uniforms,
      uniformValues,
    });

    // Download
    const blob = new Blob([html], { type: 'text/html' });
    const folderName = project.root.split('/').pop() || 'shader';
    const filename = `${folderName}.html`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    console.log(`Exported: ${filename}`);
  }

  /**
   * Generate standalone HTML with embedded shaders.
   */
  private generateStandaloneHTML(opts: {
    title: string;
    commonSource: string | null;
    passes: Array<{ name: string; source: string; channels: string[] }>;
    uniforms: Record<string, { type: string; value?: unknown }>;
    uniformValues: Record<string, unknown>;
  }): string {
    const { title, commonSource, passes, uniforms, uniformValues } = opts;

    // Escape shader sources for embedding in JS template literals
    const escapeForJS = (s: string) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

    // Build shader source objects
    const shaderSources = passes.map(p => ({
      name: p.name,
      source: escapeForJS(p.source),
      channels: p.channels,
    }));

    // Warn about array uniforms (not supported in export)
    const isArray = (def: { type: string; value?: unknown }) => 'count' in def;
    const arrayUniformNames = Object.entries(uniforms)
      .filter(([, def]) => isArray(def))
      .map(([name]) => name);
    if (arrayUniformNames.length > 0) {
      console.warn(
        `HTML export: array uniforms not supported, skipping: ${arrayUniformNames.join(', ')}`
      );
    }

    // Build uniform initialization code (scalar only)
    const uniformInits = Object.entries(uniforms).filter(([, def]) => !isArray(def)).map(([name, def]) => {
      const value = uniformValues[name] ?? def.value;
      if (def.type === 'float' || def.type === 'int') {
        return `  '${name}': ${value},`;
      } else if (def.type === 'bool') {
        return `  '${name}': ${value ? 1 : 0},`;
      } else if (def.type === 'vec2') {
        const v = value as number[];
        return `  '${name}': [${v[0]}, ${v[1]}],`;
      } else if (def.type === 'vec3') {
        const v = value as number[];
        return `  '${name}': [${v[0]}, ${v[1]}, ${v[2]}],`;
      } else if (def.type === 'vec4') {
        const v = value as number[];
        return `  '${name}': [${v[0]}, ${v[1]}, ${v[2]}, ${v[3]}],`;
      }
      return '';
    }).filter(Boolean).join('\n');

    // Build uniform declarations for shaders (scalar only)
    const uniformDeclarations = Object.entries(uniforms).filter(([, def]) => !isArray(def)).map(([name, def]) => {
      if (def.type === 'float') return `uniform float ${name};`;
      if (def.type === 'int') return `uniform int ${name};`;
      if (def.type === 'bool') return `uniform int ${name};`; // GLSL ES doesn't have bool uniforms
      if (def.type === 'vec2') return `uniform vec2 ${name};`;
      if (def.type === 'vec3') return `uniform vec3 ${name};`;
      if (def.type === 'vec4') return `uniform vec4 ${name};`;
      return '';
    }).filter(Boolean).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #fff; }
    body { display: flex; align-items: center; justify-content: center; }
    .container {
      width: 90vw;
      max-width: 1200px;
      aspect-ratio: 16 / 9;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1);
    }
    canvas { display: block; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div class="container">
    <canvas id="canvas"></canvas>
  </div>
  <script>
// Shader Sandbox Export - ${title}
// Generated ${new Date().toISOString()}

const VERTEX_SHADER = \`#version 300 es
precision highp float;
layout(location = 0) in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
\`;

const FRAGMENT_PREAMBLE = \`#version 300 es
precision highp float;

// Procedural texture for missing channels
vec4 proceduralGrid(vec2 uv) {
  vec2 grid = step(fract(uv * 8.0), vec2(0.5));
  float checker = abs(grid.x - grid.y);
  return mix(vec4(0.2, 0.2, 0.2, 1.0), vec4(0.8, 0.1, 0.8, 1.0), checker);
}

uniform vec3  iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int   iFrame;
uniform vec4  iMouse;
uniform vec4  iDate;
uniform float iFrameRate;
uniform vec3  iChannelResolution[4];
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
${uniformDeclarations}
\`;

const FRAGMENT_SUFFIX = \`
out vec4 fragColor;
void main() { mainImage(fragColor, gl_FragCoord.xy); }
\`;

const COMMON_SOURCE = \`${commonSource ? escapeForJS(commonSource) : ''}\`;

const PASSES = [
${shaderSources.map(p => `  { name: '${p.name}', source: \`${p.source}\`, channels: ${JSON.stringify(p.channels)} }`).join(',\n')}
];

const UNIFORM_VALUES = {
${uniformInits}
};

// WebGL setup
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: true });
if (!gl) { alert('WebGL2 not supported'); throw new Error('WebGL2 not supported'); }

// Fullscreen triangle
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

// Procedural texture (8x8 checkerboard)
function createProceduralTexture() {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  const data = new Uint8Array(8 * 8 * 4);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const i = (y * 8 + x) * 4;
      const checker = (x + y) % 2;
      data[i] = checker ? 204 : 51;
      data[i+1] = checker ? 26 : 51;
      data[i+2] = checker ? 204 : 51;
      data[i+3] = 255;
    }
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 8, 8, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return tex;
}

// Black texture for unused channels
function createBlackTexture() {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]));
  return tex;
}

const proceduralTex = createProceduralTexture();
const blackTex = createBlackTexture();

// Compile shader
function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    console.error(source.split('\\n').map((l,i) => (i+1) + ': ' + l).join('\\n'));
    throw new Error('Shader compile failed');
  }
  return shader;
}

// Create program
function createProgram(fragSource) {
  const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compileShader(gl.FRAGMENT_SHADER, fragSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('Program link failed: ' + gl.getProgramInfoLog(program));
  }
  return program;
}

// Create texture for render target
function createRenderTexture(w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

// Create framebuffer attached to a texture
function createFramebuffer(tex) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.error('Framebuffer not complete:', status);
  }
  return fb;
}

// Initialize passes
const container = canvas.parentElement;
let width = canvas.width = container.clientWidth * devicePixelRatio;
let height = canvas.height = container.clientHeight * devicePixelRatio;

// Enable float textures (required for multi-buffer feedback)
const floatExt = gl.getExtension('EXT_color_buffer_float');
if (!floatExt) console.warn('EXT_color_buffer_float not supported');

const runtimePasses = PASSES.map(pass => {
  const fragSource = FRAGMENT_PREAMBLE + (COMMON_SOURCE ? '\\n// Common\\n' + COMMON_SOURCE + '\\n' : '') + '\\n// User code\\n' + pass.source + FRAGMENT_SUFFIX;
  const program = createProgram(fragSource);
  const currentTexture = createRenderTexture(width, height);
  const previousTexture = createRenderTexture(width, height);
  const framebuffer = createFramebuffer(currentTexture);
  return {
    name: pass.name,
    channels: pass.channels,
    program,
    framebuffer,
    currentTexture,
    previousTexture,
    uniforms: {
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      iTime: gl.getUniformLocation(program, 'iTime'),
      iTimeDelta: gl.getUniformLocation(program, 'iTimeDelta'),
      iFrame: gl.getUniformLocation(program, 'iFrame'),
      iMouse: gl.getUniformLocation(program, 'iMouse'),
      iDate: gl.getUniformLocation(program, 'iDate'),
      iFrameRate: gl.getUniformLocation(program, 'iFrameRate'),
      iChannel: [0,1,2,3].map(i => gl.getUniformLocation(program, 'iChannel' + i)),
      custom: Object.keys(UNIFORM_VALUES).reduce((acc, name) => {
        acc[name] = gl.getUniformLocation(program, name);
        return acc;
      }, {})
    }
  };
});

// Find pass by name
const findPass = name => runtimePasses.find(p => p.name === name);

// Mouse state
let mouse = [0, 0, 0, 0];
canvas.addEventListener('mousemove', e => {
  mouse[0] = e.clientX * devicePixelRatio;
  mouse[1] = (canvas.clientHeight - e.clientY) * devicePixelRatio;
});
canvas.addEventListener('click', e => {
  mouse[2] = e.clientX * devicePixelRatio;
  mouse[3] = (canvas.clientHeight - e.clientY) * devicePixelRatio;
});

// Resize handler - only resize if dimensions actually changed
let lastWidth = width, lastHeight = height;
new ResizeObserver(() => {
  const newWidth = container.clientWidth * devicePixelRatio;
  const newHeight = container.clientHeight * devicePixelRatio;
  if (newWidth === lastWidth && newHeight === lastHeight) return;
  lastWidth = width = canvas.width = newWidth;
  lastHeight = height = canvas.height = newHeight;
  runtimePasses.forEach(p => {
    [p.currentTexture, p.previousTexture].forEach(tex => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, p.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, p.currentTexture, 0);
  });
  frame = 0;
  startTime = performance.now() / 1000;
  lastTime = 0;
}).observe(container);

// Animation
let frame = 0;
let startTime = performance.now() / 1000;
let lastTime = 0;

function render(now) {
  requestAnimationFrame(render);

  const time = now / 1000 - startTime;
  const deltaTime = Math.max(0, time - lastTime);
  lastTime = time;

  const date = new Date();
  const iDate = [date.getFullYear(), date.getMonth(), date.getDate(),
    date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() / 1000];

  gl.bindVertexArray(vao);

  runtimePasses.forEach(pass => {
    gl.useProgram(pass.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, pass.framebuffer);
    gl.viewport(0, 0, width, height);

    // Bind uniforms
    gl.uniform3f(pass.uniforms.iResolution, width, height, 1);
    gl.uniform1f(pass.uniforms.iTime, time);
    gl.uniform1f(pass.uniforms.iTimeDelta, deltaTime);
    gl.uniform1i(pass.uniforms.iFrame, frame);
    gl.uniform4fv(pass.uniforms.iMouse, mouse);
    gl.uniform4fv(pass.uniforms.iDate, iDate);
    gl.uniform1f(pass.uniforms.iFrameRate, 1 / deltaTime);

    // Bind custom uniforms
    Object.entries(UNIFORM_VALUES).forEach(([name, value]) => {
      const loc = pass.uniforms.custom[name];
      if (!loc) return;
      if (Array.isArray(value)) {
        if (value.length === 2) gl.uniform2fv(loc, value);
        else if (value.length === 3) gl.uniform3fv(loc, value);
        else if (value.length === 4) gl.uniform4fv(loc, value);
      } else {
        gl.uniform1f(loc, value);
      }
    });

    // Bind channels
    pass.channels.forEach((ch, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      if (ch === 'none') {
        gl.bindTexture(gl.TEXTURE_2D, blackTex);
      } else if (ch === 'procedural') {
        gl.bindTexture(gl.TEXTURE_2D, proceduralTex);
      } else if (['BufferA', 'BufferB', 'BufferC', 'BufferD', 'Image'].includes(ch)) {
        const srcPass = findPass(ch);
        gl.bindTexture(gl.TEXTURE_2D, srcPass ? srcPass.previousTexture : blackTex);
      } else {
        gl.bindTexture(gl.TEXTURE_2D, blackTex);
      }
      gl.uniform1i(pass.uniforms.iChannel[i], i);
    });

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Swap textures and re-attach framebuffer
    const temp = pass.currentTexture;
    pass.currentTexture = pass.previousTexture;
    pass.previousTexture = temp;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pass.currentTexture, 0);
  });

  // Blit Image pass to screen
  const imagePass = findPass('Image');
  if (imagePass) {
    // Attach previousTexture (just rendered) for reading
    gl.bindFramebuffer(gl.FRAMEBUFFER, imagePass.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, imagePass.previousTexture, 0);

    // Blit to screen
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, imagePass.framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);

    // Restore framebuffer to currentTexture for next frame
    gl.bindFramebuffer(gl.FRAMEBUFFER, imagePass.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, imagePass.currentTexture, 0);
  }

  frame++;
}

requestAnimationFrame(render);
  </script>
</body>
</html>`;
  }

  /**
   * Update play/pause button icon based on current state.
   */
  private updatePlayPauseButton(): void {
    if (!this.playPauseButton) return;

    if (this.isPaused) {
      // Show play icon
      this.playPauseButton.innerHTML = `
        <svg viewBox="0 0 16 16">
          <path d="M4 3v10l8-5-8-5z"/>
        </svg>
      `;
    } else {
      // Show pause icon
      this.playPauseButton.innerHTML = `
        <svg viewBox="0 0 16 16">
          <path d="M5 3h2v10H5V3zm4 0h2v10H9V3z"/>
        </svg>
      `;
    }
  }

  // ===========================================================================
  // Error Handling
  // ===========================================================================

  /**
   * Display shader compilation errors in an overlay.
   */
  private showErrorOverlay(errors: Array<{
    passName: string;
    error: string;
    source: string;
    isFromCommon: boolean;
    originalLine: number | null;
  }>): void {
    // Create overlay if it doesn't exist
    if (!this.errorOverlay) {
      this.errorOverlay = document.createElement('div');
      this.errorOverlay.className = 'shader-error-overlay';
      this.container.appendChild(this.errorOverlay);
    }

    // Group errors: separate common.glsl errors from pass-specific errors
    const commonErrors = errors.filter(e => e.isFromCommon);
    const passErrors = errors.filter(e => !e.isFromCommon);

    // Deduplicate common errors (same error reported for multiple passes)
    const uniqueCommonErrors = commonErrors.length > 0 ? [commonErrors[0]] : [];

    // Combine: show common errors first, then pass-specific errors
    const allErrors = [...uniqueCommonErrors, ...passErrors];

    // Parse and format errors with source context
    const formattedErrors = allErrors.map(({passName, error, source, isFromCommon, originalLine}) => {
      // Extract the actual GLSL error from the thrown error message
      const glslError = error.replace('Shader compilation failed:\n', '');

      // For common errors, adjust line number in error message
      let adjustedError = glslError;
      if (isFromCommon && originalLine !== null) {
        adjustedError = glslError.replace(/Line \d+:/, `Line ${originalLine}:`);
        adjustedError = adjustedError.replace(/ERROR:\s*\d+:(\d+):/, `ERROR: 0:${originalLine}:`);
      }

      return {
        passName: isFromCommon ? 'common.glsl' : passName,
        error: this.parseShaderError(adjustedError),
        codeContext: isFromCommon
          ? this.extractCodeContextFromCommon(originalLine!)
          : this.extractCodeContext(adjustedError, source),
      };
    });

    // Build error HTML
    const errorHTML = formattedErrors.map(({passName, error, codeContext}) => `
      <div class="error-section">
        <div class="error-pass-name">${passName}</div>
        <pre class="error-content">${this.escapeHTML(error)}</pre>
        ${codeContext ? `<pre class="error-code-context">${codeContext}</pre>` : ''}
      </div>
    `).join('');

    this.errorOverlay.innerHTML = `
      <div class="error-overlay-content">
        <div class="error-header">
          <span class="error-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-bottom;">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM3.5 7.5a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9z"/>
            </svg>
            Shader Compilation Failed
          </span>
          <button class="error-close" title="Dismiss">×</button>
        </div>
        <div class="error-body">
          ${errorHTML}
        </div>
      </div>
    `;

    // Add close button handler
    const closeButton = this.errorOverlay.querySelector('.error-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hideErrorOverlay());
    }
  }

  /**
   * Parse and improve WebGL shader error messages.
   */
  private parseShaderError(error: string): string {
    // WebGL errors typically look like: "ERROR: 0:45: 'texure' : no matching overloaded function found"
    // Let's make them more readable by highlighting line numbers and adding context

    return error.split('\n').map(line => {
      // Match pattern: ERROR: 0:lineNumber: message
      const match = line.match(/^ERROR:\s*(\d+):(\d+):\s*(.+)$/);
      if (match) {
        const [, , lineNum, message] = match;
        return `Line ${lineNum}: ${message}`;
      }
      return line;
    }).join('\n');
  }

  /**
   * Extract code context around error line (±3 lines).
   * Returns HTML with the error line highlighted.
   */
  private extractCodeContext(error: string, source: string): string | null {
    // Extract line number from error
    const match = error.match(/ERROR:\s*\d+:(\d+):/);
    if (!match) return null;

    const errorLine = parseInt(match[1], 10);
    const lines = source.split('\n');

    // Extract context (3 lines before and after)
    const contextRange = 3;
    const startLine = Math.max(0, errorLine - contextRange - 1);
    const endLine = Math.min(lines.length, errorLine + contextRange);

    const contextLines = lines.slice(startLine, endLine);

    // Build HTML with line numbers and highlighting
    const html = contextLines.map((line, idx) => {
      const lineNum = startLine + idx + 1;
      const isErrorLine = lineNum === errorLine;
      const lineNumPadded = String(lineNum).padStart(4, ' ');
      const escapedLine = this.escapeHTML(line);

      if (isErrorLine) {
        return `<span class="error-line-highlight">${lineNumPadded} │ ${escapedLine}</span>`;
      } else {
        return `<span class="context-line">${lineNumPadded} │ ${escapedLine}</span>`;
      }
    }).join(''); // No newline - spans already have display:block

    return html;
  }

  /**
   * Extract code context from common.glsl file.
   * Similar to extractCodeContext but uses the original common source.
   */
  private extractCodeContextFromCommon(errorLine: number): string | null {
    const commonSource = this.engine.project.commonSource;
    if (!commonSource) return null;

    const lines = commonSource.split('\n');

    // Extract context (3 lines before and after)
    const contextRange = 3;
    const startLine = Math.max(0, errorLine - contextRange - 1);
    const endLine = Math.min(lines.length, errorLine + contextRange);

    const contextLines = lines.slice(startLine, endLine);

    // Build HTML with line numbers and highlighting
    const html = contextLines.map((line, idx) => {
      const lineNum = startLine + idx + 1;
      const isErrorLine = lineNum === errorLine;
      const lineNumPadded = String(lineNum).padStart(4, ' ');
      const escapedLine = this.escapeHTML(line);

      if (isErrorLine) {
        return `<span class="error-line-highlight">${lineNumPadded} │ ${escapedLine}</span>`;
      } else {
        return `<span class="context-line">${lineNumPadded} │ ${escapedLine}</span>`;
      }
    }).join(''); // No newline - spans already have display:block

    return html;
  }

  /**
   * Escape HTML to prevent XSS.
   */
  private escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Hide the error overlay.
   */
  private hideErrorOverlay(): void {
    if (this.errorOverlay) {
      this.errorOverlay.remove();
      this.errorOverlay = null;
    }
  }
}
