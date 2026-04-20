/**
 * App - Browser Runtime Coordinator
 *
 * Coordinates one or more ShaderViews with shared:
 *  - Animation loop (requestAnimationFrame)
 *  - Playback controls (play/pause/reset)
 *  - Stats panel, Recorder, UniformsPanel
 *  - Script hooks (setup/onFrame)
 *  - Keyboard shortcuts
 *  - Visibility observer (auto-pause when off-screen)
 *
 * Single-view: App has 1 ShaderView.
 * Multi-view: App has N ShaderViews with shared time/uniforms and cross-view state.
 *
 * Per-canvas concerns (GL context, engine, input, resize) are handled
 * by ShaderView instances.
 */

import './app.css';

import { ShaderEngine } from '../engine/ShaderEngine';
import { ShaderView } from './ShaderView';
import {
  ShaderProject,
  MultiViewProject,
  ViewEntry,
  isMultiViewProject,
  ScriptEngineAPI,
  CrossViewState,
  OverlayPosition,
  UniformValue,
  hasUIControl,
} from '../project/types';
import { UniformsPanel } from '../uniforms/UniformsPanel';
import { AppOptions, MouseState } from './types';
import { exportHTML as exportHTMLFile } from './exportHTML';
import { Recorder } from './Recorder';
import { StatsPanel } from './StatsPanel';
import { PlaybackControls } from './PlaybackControls';
import { ScreenshotPanel } from './ScreenshotPanel';
import { RecordingPanel, RecordingRequest } from './RecordingPanel';
import { Mp4Encoder } from './Mp4Encoder';

export class App {
  private container: HTMLElement;
  private views: Map<string, ShaderView> = new Map();
  private primaryView!: ShaderView;
  private project: ShaderProject | MultiViewProject;
  private isMultiView: boolean;

  private animationId: number | null = null;
  private startTime: number = 0;
  private pausedElapsedTime: number = 0;
  private disposed: boolean = false;

  // Stats panel (null when controls are disabled)
  private statsPanel: StatsPanel | null = null;

  // Playback controls
  private playbackControls: PlaybackControls | null = null;
  private isPaused: boolean = false;
  private _pauseAfterFirstFrame: boolean = false;

  // Visibility observer (auto-pause when off-screen)
  private intersectionObserver: IntersectionObserver;
  private isVisible: boolean = true;

  // Floating uniforms panel
  private uniformsPanel: UniformsPanel | null = null;

  // Script hooks API
  private scriptAPI: ScriptEngineAPI | null = null;
  private scriptErrorCount: number = 0;
  private _lastOnFrameTime: number | null = null;
  private _insideScriptSet: boolean = false;
  private static readonly MAX_SCRIPT_ERRORS = 10;

  // Recording
  private recorder: Recorder;

  // Keyboard shortcut handlers (stored for cleanup in dispose)
  private globalKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  private controlsKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(opts: AppOptions) {
    this.container = opts.container;
    this.project = opts.project;
    this.isMultiView = isMultiViewProject(opts.project);

    // Make container focusable for scoped keyboard events.
    // tabindex="-1" allows programmatic focus but keeps it out of tab order.
    if (!this.container.hasAttribute('tabindex')) {
      this.container.setAttribute('tabindex', '-1');
    }
    this.container.style.outline = 'none';
    this.container.addEventListener('mousedown', () => this.container.focus());

    const pixelRatio = opts.pixelRatio ?? opts.project.pixelRatio ?? window.devicePixelRatio;

    // =========================================================================
    // Create ShaderView(s)
    // =========================================================================

    if (this.isMultiView) {
      const mvProject = opts.project as MultiViewProject;
      const viewNames = mvProject.views.map(v => v.name);

      if (!opts.viewContainers) {
        throw new Error('viewContainers required for multi-view projects');
      }

      for (const viewEntry of mvProject.views) {
        const viewContainer = opts.viewContainers.get(viewEntry.name);
        if (!viewContainer) {
          throw new Error(`No container provided for view "${viewEntry.name}"`);
        }

        const viewProject = this.createViewProject(mvProject, viewEntry);
        const view = new ShaderView({
          container: viewContainer,
          project: viewProject,
          keyboardTarget: this.container,
          pixelRatio,
          viewNames,
        });

        this.views.set(viewEntry.name, view);
      }

      this.primaryView = this.views.values().next().value!;
    } else {
      const view = new ShaderView({
        container: opts.container,
        project: opts.project as ShaderProject,
        keyboardTarget: this.container,
        pixelRatio,
      });

      this.views.set('default', view);
      this.primaryView = view;
    }

    // =========================================================================
    // Create coordinator-level components
    // =========================================================================

    this.recorder = new Recorder(this.primaryView.canvas, this.container, this.project.root);

    // Only create stats panel when controls are enabled
    if (this.project.controls !== false) {
      this.statsPanel = new StatsPanel(this.container);
      this.statsPanel.updateResolution(this.primaryView.canvas.width, this.primaryView.canvas.height);
    }

    // Wire resize and context-restored callbacks (after statsPanel is created)
    if (this.isMultiView) {
      // Only primary view updates stats resolution
      this.primaryView.onResize = (w, h) => {
        this.statsPanel?.updateResolution(w, h);
      };

      // Wire context restored for all views
      for (const view of this.views.values()) {
        view.onContextRestored = () => {
          if (this.scriptAPI && this.project.script?.setup) {
            try {
              this.project.script.setup(this.scriptAPI, { isRestore: true });
            } catch (e) {
              console.error('script.js setup() threw during context restore:', e);
              this.primaryView.runtimeErrorOverlay.showError('setup', e);
            }
          }
        };
      }
    } else {
      this.primaryView.onResize = (w, h) => {
        this.statsPanel?.updateResolution(w, h);
        this.startTime = performance.now() / 1000;
        this.pausedElapsedTime = 0;
        // Re-render when resized while paused so the canvas isn't stale
        if (this.isPaused) {
          this.primaryView.step(0);
        }
      };

      this.primaryView.onContextRestored = () => {
        if (this.scriptAPI && this.project.script?.setup) {
          try {
            this.project.script.setup(this.scriptAPI, { isRestore: true });
          } catch (e) {
            console.error('script.js setup() threw during context restore:', e);
            this.primaryView.runtimeErrorOverlay.showError('setup', e);
          }
        }
        this.reset();
        this.start();
      };
    }

    // Create playback controls if enabled
    if (this.project.controls && !opts.skipPlaybackControls) {
      this.playbackControls = new PlaybackControls(this.container, {
        onTogglePlayPause: () => this.togglePlayPause(),
        onReset: () => this.reset(),
        onScreenshot: () => this.openScreenshotPanel(),
        onToggleRecording: () => this.toggleRecording(),
        onExportHTML: () => this.exportHTML(),
        onRender: () => this.openRecordingPanel(),
      });
    }

    // Handle startPaused option — defer pause until after the first frame renders
    if (this.project.startPaused) {
      this._pauseAfterFirstFrame = true;
      this.playbackControls?.setPaused(true);
    }

    // Set up intersection observer for auto-pause when off-screen
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        this.isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.1 }
    );
    this.intersectionObserver.observe(this.container);

    // Initialize script API and run setup hook
    if (this.project.script) {
      this.initScriptAPI();

      if (this.project.script.setup && this.scriptAPI) {
        try {
          this.project.script.setup(this.scriptAPI, { isRestore: false });
        } catch (e) {
          console.error('script.js setup() threw:', e);
          this.primaryView.runtimeErrorOverlay.showError('setup', e);
        }
      }
    }

    // Create floating uniforms panel (suppressed when controls are disabled)
    if (this.project.controls !== false && !opts.skipUniformsPanel && this.project.uniforms && Object.values(this.project.uniforms).some(def => hasUIControl(def))) {
      this.uniformsPanel = new UniformsPanel({
        container: this.container,
        uniforms: this.project.uniforms,
        onChange: (name, value) => {
          this.setUniformValue(name, value);
        },
      });
    }

    // Set up keyboard shortcuts
    this.setupGlobalShortcuts();
    if (this.project.controls) {
      this.setupKeyboardShortcuts();
    }
  }

  // ===========================================================================
  // Multi-View Helpers
  // ===========================================================================

  /**
   * Create a single-view ShaderProject from a MultiViewProject + ViewEntry.
   * Each view gets a fullscreen layout with no controls (App manages controls).
   */
  private createViewProject(mvProject: MultiViewProject, view: ViewEntry): ShaderProject {
    return {
      mode: mvProject.mode,
      root: mvProject.root,
      meta: {
        ...mvProject.meta,
        title: `${mvProject.meta.title} - ${view.name}`,
      },
      layout: 'fullscreen',
      theme: mvProject.theme,
      controls: false,
      startPaused: mvProject.startPaused,
      pixelRatio: mvProject.pixelRatio,
      commonSource: mvProject.commonSource,
      passes: view.passes,
      textures: mvProject.textures,
      uniforms: mvProject.uniforms,
      uniformData: mvProject.uniformData,
      script: null, // Script handled by App, not individual views
    };
  }

  // ===========================================================================
  // Script API
  // ===========================================================================

  private initScriptAPI(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.scriptAPI = {
      setUniformValue: (name, value) => {
        self._insideScriptSet = true;
        self.setUniformValue(name, value);
        self._insideScriptSet = false;
      },
      getUniformValue: (name) => self.primaryView.engine.getUniformValue(name),
      updateTexture: (name, w, h, data) => self.primaryView.engine.updateTexture(name, w, h, data),
      readPixels: (passName, x, y, w, h) => self.primaryView.engine.readPixels(passName as any, x, y, w, h),
      get width() { return self.primaryView.engine.width; },
      get height() { return self.primaryView.engine.height; },
      setOverlay: (position, text, viewName?) => {
        const target = viewName ? self.views.get(viewName) : self.primaryView;
        target?.setOverlay(position, text);
      },
      setArrayUniform: (name, data) => {
        for (const view of self.views.values()) {
          view.engine.setArrayUniform(name, data);
        }
      },
      setArrayElement: (name, index, value) => {
        for (const view of self.views.values()) {
          view.engine.setArrayElement(name, index, value);
        }
      },
      setActiveCount: (name, count) => {
        for (const view of self.views.values()) {
          view.engine.setActiveCount(name, count);
        }
      },
      setStructArrayUniform: (name, data) => {
        for (const view of self.views.values()) {
          view.engine.setStructArrayUniform(name, data);
        }
      },
      setStructArrayElement: (name, index, data) => {
        for (const view of self.views.values()) {
          view.engine.setStructArrayElement(name, index, data);
        }
      },
      // Multi-view extensions (undefined for single-view)
      getCrossViewState: self.isMultiView
        ? (viewName: string) => self.getCrossViewState(viewName)
        : undefined,
      viewNames: self.isMultiView
        ? (self.project as MultiViewProject).views.map(v => v.name)
        : undefined,
    };
  }

  /**
   * Run script onFrame hook with error tracking.
   * Called from animate() with error tracking.
   */
  private runScriptOnFrame(time: number, frame: number): void {
    if (!this.scriptAPI || !this.project.script?.onFrame) return;
    if (this.scriptErrorCount >= App.MAX_SCRIPT_ERRORS) return;

    const deltaTime = this._lastOnFrameTime !== null ? time - this._lastOnFrameTime : 0;
    try {
      this.project.script.onFrame(this.scriptAPI, time, deltaTime, frame);
      this.scriptErrorCount = 0;
    } catch (e) {
      this.scriptErrorCount++;
      console.error(`script.js onFrame() threw (${this.scriptErrorCount}/${App.MAX_SCRIPT_ERRORS}):`, e);
      this.primaryView.runtimeErrorOverlay.showError('onFrame', e);
      if (this.scriptErrorCount >= App.MAX_SCRIPT_ERRORS) {
        console.warn('script.js onFrame() disabled after too many errors');
        this.primaryView.runtimeErrorOverlay.showDisabled();
      }
    }
    this._lastOnFrameTime = time;
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  hasErrors(): boolean {
    for (const view of this.views.values()) {
      if (view.hasErrors()) return true;
    }
    return false;
  }

  getEngine(): ShaderEngine {
    return this.primaryView.engine;
  }

  /**
   * Set a uniform value across all views.
   * Fires onUniformChange hook unless the call originated from the script itself.
   */
  setUniformValue(name: string, value: UniformValue): void {
    for (const view of this.views.values()) {
      view.engine.setUniformValue(name, value);
    }
    // Notify script of external changes (UI sliders, programmatic) — not its own writes
    if (!this._insideScriptSet && this.scriptAPI && this.project.script?.onUniformChange) {
      try {
        this.project.script.onUniformChange(this.scriptAPI, name, value);
      } catch (e) {
        console.error(`script.js onUniformChange('${name}') threw:`, e);
      }
    }
  }

  /**
   * Get a uniform value from the primary view.
   */
  getUniformValue(name: string): UniformValue | undefined {
    return this.primaryView.engine.getUniformValue(name);
  }

  /**
   * Start the animation loop.
   */
  start(): void {
    if (this.animationId !== null) {
      return;
    }

    this.startTime = performance.now() / 1000;
    this.animationId = requestAnimationFrame(this.animate);
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // ===========================================================================
  // Cross-View State
  // ===========================================================================

  getMouseState(): MouseState {
    return this.primaryView.getMouseState();
  }

  getResolution(): [number, number, number] {
    return this.primaryView.getResolution();
  }

  getMousePressed(): boolean {
    return this.primaryView.getMousePressed();
  }

  /**
   * Get cross-view state for a named view.
   */
  getCrossViewState(viewName: string): CrossViewState | undefined {
    const view = this.views.get(viewName);
    if (!view) return undefined;
    return {
      mouse: view.getMouseState(),
      resolution: view.getResolution(),
      mousePressed: view.getMousePressed(),
    };
  }

  setOverlay(position: OverlayPosition, text: string | null): void {
    this.primaryView.setOverlay(position, text);
  }

  // ===========================================================================
  // Animation Loop
  // ===========================================================================

  private animate = (currentTimeMs: number): void => {
    if (this.disposed) return;

    this.animationId = requestAnimationFrame(this.animate);

    if (this.isPaused || !this.isVisible) {
      return;
    }

    // Skip if any view lost context
    for (const view of this.views.values()) {
      if (view.isContextLost) return;
    }

    const currentTimeSec = currentTimeMs / 1000;
    const elapsedTime = currentTimeSec - this.startTime;

    this.statsPanel?.update(currentTimeSec, elapsedTime);

    this.runScriptOnFrame(elapsedTime, this.statsPanel?.totalFrameCount ?? 0);

    if (this.isMultiView) {
      // Collect cross-view states from all views
      const crossViewStates = new Map<string, CrossViewState>();
      for (const [name, view] of this.views) {
        crossViewStates.set(name, {
          mouse: view.getMouseState(),
          resolution: view.getResolution(),
          mousePressed: view.getMousePressed(),
        });
      }

      // Step all views with shared time and cross-view state
      for (const view of this.views.values()) {
        view.step(elapsedTime, crossViewStates);
      }
    } else {
      this.primaryView.step(elapsedTime);
    }

    // startPaused: render one frame then pause
    if (this._pauseAfterFirstFrame) {
      this._pauseAfterFirstFrame = false;
      this.isPaused = true;
      this.playbackControls?.setPaused(true);
    }
  };

  // ===========================================================================
  // Playback Control
  // ===========================================================================

  togglePlayPause(): void {
    if (!this.isPaused) {
      // Pausing — record current elapsed time so we can resume accurately
      this.pausedElapsedTime = performance.now() / 1000 - this.startTime;
    } else {
      // Resuming — adjust startTime so elapsed time continues from where we left off
      this.startTime = performance.now() / 1000 - this.pausedElapsedTime;
    }
    this.isPaused = !this.isPaused;
    this.playbackControls?.setPaused(this.isPaused);
  }

  getPaused(): boolean {
    return this.isPaused;
  }

  reset(): void {
    this.startTime = performance.now() / 1000;
    this.pausedElapsedTime = 0;
    this._lastOnFrameTime = null;
    this.statsPanel?.reset();
    for (const view of this.views.values()) {
      view.engine.reset();
    }
  }

  // ===========================================================================
  // Screenshots & Recording
  // ===========================================================================

  /** Quick screenshot at current canvas size (S key shortcut). */
  screenshot(): void {
    const folderName = this.project.root.split('/').pop() || 'shader';
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') + '-' +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');

    const filename = `shadertoy-${folderName}-${timestamp}.png`;

    this.primaryView.canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create screenshot blob');
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      console.log(`Screenshot saved: ${filename}`);
    }, 'image/png');
  }

  toggleRecording(): void {
    this.recorder.toggle(this.isPaused, () => this.togglePlayPause());
  }

  /** Check if this shader has feedback buffer passes. */
  private hasBufferPasses(): boolean {
    if (this.isMultiView) return false;
    const project = this.project as ShaderProject;
    return !!(project.passes.BufferA || project.passes.BufferB ||
              project.passes.BufferC || project.passes.BufferD);
  }

  /** Get current elapsed shader time. */
  private getCurrentTime(): number {
    return performance.now() / 1000 - this.startTime;
  }

  // ===========================================================================
  // Screenshot Panel
  // ===========================================================================

  openScreenshotPanel(): void {
    // Remember pause state so we can restore it when panel closes
    const wasPaused = this.isPaused;

    new ScreenshotPanel(
      this.container,
      this.primaryView.canvas.width,
      this.primaryView.canvas.height,
      this.project.uniforms,
      {
        renderPreviewAtTime: (time) => {
          // Non-buffer shader: jump directly to time
          this.primaryView.engine.reset();
          this.primaryView.engine.step(time, [0, 0, 0, 0], false);
          this.primaryView.presentToScreen();
        },

        renderPreviewStepped: async (time, fps, onProgress) => {
          const engine = this.primaryView.engine;
          engine.reset();
          if (this.scriptAPI && this.project.script?.setup) {
            try { this.project.script.setup(this.scriptAPI, { isRestore: true }); } catch { /* ignore */ }
          }

          const totalFrames = Math.ceil(time * fps);
          for (let f = 0; f <= totalFrames; f++) {
            this.stepForRender(f, fps, 0);
            if (f % 100 === 0) {
              onProgress(f, totalFrames);
              await new Promise(r => setTimeout(r, 0));
            }
          }
          this.primaryView.presentToScreen();
          onProgress(totalFrames, totalFrames);
          return true;
        },

        captureScreenshot: async (opts) => {
          const canvas = this.primaryView.canvas;
          const engine = this.primaryView.engine;
          const origW = canvas.width;
          const origH = canvas.height;

          try {
            // Resize to target resolution
            canvas.width = opts.width;
            canvas.height = opts.height;
            engine.resize(opts.width, opts.height);
            engine.reset();

            if (this.scriptAPI && this.project.script?.setup) {
              try { this.project.script.setup(this.scriptAPI, { isRestore: true }); } catch { /* ignore */ }
            }

            if (opts.hasBuffers) {
              // Step through all frames to target time
              const fps = 60;
              const totalFrames = Math.ceil(opts.time * fps);
              for (let f = 0; f <= totalFrames; f++) {
                this.stepForRender(f, fps, 0);
                if (f % 100 === 0) {
                  opts.onProgress(f, totalFrames);
                  await new Promise(r => setTimeout(r, 0));
                }
              }
              opts.onProgress(totalFrames, totalFrames);
            } else {
              // Jump directly
              engine.step(opts.time, [0, 0, 0, 0], false);
            }

            this.primaryView.presentToScreen();

            // Capture
            return await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob(
                (b) => b ? resolve(b) : reject(new Error('Failed to capture')),
                'image/png',
              );
            });
          } finally {
            // Restore original canvas size
            canvas.width = origW;
            canvas.height = origH;
            engine.resize(origW, origH);
            engine.reset();
            if (this.scriptAPI && this.project.script?.setup) {
              try { this.project.script.setup(this.scriptAPI, { isRestore: true }); } catch { /* ignore */ }
            }
            // Re-render preview at current slider time so canvas isn't blank
            if (!this.hasBufferPasses()) {
              const currentSliderTime = this.getCurrentTime(); // approximate
              this.primaryView.engine.step(currentSliderTime, [0, 0, 0, 0], false);
              this.primaryView.presentToScreen();
            }
          }
        },

        getCurrentTime: () => this.getCurrentTime(),
        hasBufferPasses: () => this.hasBufferPasses(),
        setUniformValue: (name, value) => this.setUniformValue(name, value),

        pause: () => {
          // Record current elapsed time and pause
          if (!this.isPaused) {
            this.pausedElapsedTime = performance.now() / 1000 - this.startTime;
          }
          this.isPaused = true;
        },

        resume: () => {
          // Restore original pause state
          if (!wasPaused) {
            this.startTime = performance.now() / 1000 - this.pausedElapsedTime;
            this.isPaused = false;
          }
        },
      },
    );
  }

  // ===========================================================================
  // Recording Panel
  // ===========================================================================

  openRecordingPanel(): void {
    new RecordingPanel(
      this.container,
      this.primaryView.canvas.width,
      this.primaryView.canvas.height,
      this.project.uniforms,
      {
        startRecording: (req) => this.handleRecording(req),
        hasBufferPasses: () => this.hasBufferPasses(),
        setUniformValue: (name, value) => this.setUniformValue(name, value),
      },
    );
  }

  private handleRecording(req: RecordingRequest): () => void {
    let cancelled = false;
    const cancel = () => { cancelled = true; };

    const run = async () => {
      const canvas = this.primaryView.canvas;
      const engine = this.primaryView.engine;
      const origW = canvas.width;
      const origH = canvas.height;
      const wasPaused = this.isPaused;

      try {
        this.isPaused = true;

        canvas.width = req.width;
        canvas.height = req.height;
        engine.resize(req.width, req.height);
        engine.reset();

        if (this.scriptAPI && this.project.script?.setup) {
          this.project.script.setup(this.scriptAPI, { isRestore: true });
        }

        // Warm-up phase: step to startTime if needed
        if (req.startTime > 0) {
          const warmupFrames = Math.ceil(req.startTime * req.fps);
          for (let f = 0; f < warmupFrames; f++) {
            if (cancelled) return;
            this.stepForRender(f, req.fps, 0);
            if (f % 100 === 0) {
              req.onProgress('Warming up', f, warmupFrames);
              await new Promise(r => setTimeout(r, 0));
            }
          }
        }

        const totalFrames = Math.ceil(req.fps * req.duration);

        if (req.format === 'mp4') {
          await this.renderMp4Frames(totalFrames, req.fps, req.startTime, req.quality, () => cancelled, (f, t) => req.onProgress('Recording', f, t));
        } else if (req.format === 'webm') {
          await this.renderWebmFrames(totalFrames, req.fps, req.startTime, () => cancelled, (f, t) => req.onProgress('Recording', f, t));
        } else {
          await this.renderPngFrames(totalFrames, req.fps, req.startTime, () => cancelled, (f, t) => req.onProgress('Recording', f, t));
        }

        if (!cancelled) req.onComplete();
      } catch (e) {
        if (!cancelled) req.onError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        canvas.width = origW;
        canvas.height = origH;
        engine.resize(origW, origH);
        engine.reset();
        if (this.scriptAPI && this.project.script?.setup) {
          try { this.project.script.setup(this.scriptAPI, { isRestore: true }); } catch { /* ignore */ }
        }
        this.isPaused = wasPaused;
      }
    };

    run();
    return cancel;
  }

  // ===========================================================================
  // HTML Export
  // ===========================================================================

  exportHTML(): void {
    if (this.isMultiView) {
      console.warn('HTML export is not supported for multi-view projects');
      return;
    }
    exportHTMLFile(this.project as ShaderProject, this.primaryView.engine);
  }

  // ===========================================================================
  // Render Helpers
  // ===========================================================================

  private async renderPngFrames(
    totalFrames: number, fps: number, startTime: number,
    isCancelled: () => boolean,
    onProgress: (frame: number, total: number) => void,
  ): Promise<void> {
    let dirHandle: FileSystemDirectoryHandle | null = null;
    if ('showDirectoryPicker' in window) {
      try {
        dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      } catch { /* user cancelled */ }
    }

    for (let frame = 0; frame < totalFrames; frame++) {
      if (isCancelled()) return;

      this.stepForRender(frame, fps, startTime);
      this.primaryView.presentToScreen();

      const blob = await new Promise<Blob>((resolve, reject) => {
        this.primaryView.canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed to capture frame')), 'image/png');
      });

      const filename = `frame_${String(frame).padStart(5, '0')}.png`;
      if (dirHandle) {
        const fh = await dirHandle.getFileHandle(filename, { create: true });
        const w = await fh.createWritable();
        await w.write(blob);
        await w.close();
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
      }

      onProgress(frame + 1, totalFrames);
      if (frame % 10 === 0) await new Promise(r => setTimeout(r, 0));
    }
  }

  private async renderWebmFrames(
    totalFrames: number, fps: number, startTime: number,
    isCancelled: () => boolean,
    onProgress: (frame: number, total: number) => void,
  ): Promise<void> {
    const canvas = this.primaryView.canvas;
    const videoCanvas = document.createElement('canvas');
    videoCanvas.width = canvas.width;
    videoCanvas.height = canvas.height;
    const ctx = videoCanvas.getContext('2d')!;

    const stream = videoCanvas.captureStream(0);
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 8_000_000,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    const done = new Promise<void>(r => { recorder.onstop = () => r(); });
    recorder.start();

    for (let frame = 0; frame < totalFrames; frame++) {
      if (isCancelled()) { recorder.stop(); await done; return; }

      this.stepForRender(frame, fps, startTime);
      this.primaryView.presentToScreen();
      ctx.drawImage(canvas, 0, 0);

      const track = stream.getVideoTracks()[0] as any;
      if (track?.requestFrame) track.requestFrame();

      onProgress(frame + 1, totalFrames);
      if (frame % 10 === 0) await new Promise(r => setTimeout(r, 0));
    }

    recorder.stop();
    await done;

    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `render_${canvas.width}x${canvas.height}_${fps}fps.webm`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private async renderMp4Frames(
    totalFrames: number, fps: number, startTime: number,
    quality: string,
    isCancelled: () => boolean,
    onProgress: (frame: number, total: number) => void,
  ): Promise<void> {
    const canvas = this.primaryView.canvas;
    const encoder = new Mp4Encoder(canvas.width, canvas.height, fps, quality);
    await encoder.init();

    try {
      for (let frame = 0; frame < totalFrames; frame++) {
        if (isCancelled()) { encoder.dispose(); return; }

        this.stepForRender(frame, fps, startTime);
        this.primaryView.presentToScreen();

        await encoder.addFrame(canvas);

        onProgress(frame + 1, totalFrames);
        if (frame % 10 === 0) await new Promise(r => setTimeout(r, 0));
      }

      const blob = await encoder.finish();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `render_${canvas.width}x${canvas.height}_${fps}fps.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      encoder.dispose();
      throw e;
    }
  }

  private stepForRender(frame: number, fps: number, startTime: number): void {
    const time = startTime + frame / fps;
    const deltaTime = 1 / fps;

    if (this.scriptAPI && this.project.script?.onFrame) {
      try { this.project.script.onFrame(this.scriptAPI, time, deltaTime, frame); } catch { /* ignore */ }
    }

    this.primaryView.engine.step(time, [0, 0, 0, 0], false);
  }

  // ===========================================================================
  // Keyboard Shortcuts
  // ===========================================================================

  private static isTextInput(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement | null;
    if (!target) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
  }

  private setupGlobalShortcuts(): void {
    this.globalKeyHandler = (e: KeyboardEvent) => {
      if (App.isTextInput(e)) return;

      if (e.code === 'KeyS' && !e.repeat) {
        e.preventDefault();
        this.screenshot();
      }
    };
    this.container.addEventListener('keydown', this.globalKeyHandler);
  }

  private setupKeyboardShortcuts(): void {
    this.controlsKeyHandler = (e: KeyboardEvent) => {
      if (App.isTextInput(e)) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        this.togglePlayPause();
      }

      if (e.code === 'KeyR' && !e.repeat) {
        e.preventDefault();
        this.reset();
      }
    };
    this.container.addEventListener('keydown', this.controlsKeyHandler);
  }

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  dispose(): void {
    this.disposed = true;
    this.stop();
    // Call script dispose before tearing down GL resources
    if (this.project.script?.dispose) {
      try { this.project.script.dispose(); }
      catch (e) { console.error('script.js dispose() threw:', e); }
    }
    for (const view of this.views.values()) {
      view.dispose();
    }
    this.recorder.dispose();
    this.playbackControls?.dispose();
    this.intersectionObserver.disconnect();
    if (this.globalKeyHandler) this.container.removeEventListener('keydown', this.globalKeyHandler);
    if (this.controlsKeyHandler) this.container.removeEventListener('keydown', this.controlsKeyHandler);
    this.uniformsPanel?.destroy();
    this.statsPanel?.dispose();
  }
}
