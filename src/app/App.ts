/**
 * App - Browser Runtime Coordinator
 *
 * Coordinates one or more ShaderViews with shared:
 *  - Animation loop (requestAnimationFrame)
 *  - Playback controls (play/pause/reset)
 *  - Stats panel, UniformsPanel, screenshot/recording panels
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
import { StatsPanel } from './StatsPanel';
import { timestampString, downloadBlob } from './dom';
import { PlaybackControls } from './PlaybackControls';
import { ScreenshotPanel } from './ScreenshotPanel';
import { RecordingPanel } from './RecordingPanel';
import { Transport } from './Transport';
import { OfflineRenderer } from './OfflineRenderer';

export class App {
  private container: HTMLElement;
  private views: Map<string, ShaderView> = new Map();
  private primaryView!: ShaderView;
  private project: ShaderProject | MultiViewProject;
  private isMultiView: boolean;

  private animationId: number | null = null;
  private transport = new Transport();
  private offline!: OfflineRenderer;
  private disposed: boolean = false;

  // Stats panel (null when controls are disabled)
  private statsPanel: StatsPanel | null = null;

  // Playback controls
  private playbackControls: PlaybackControls | null = null;

  /** Notified whenever pause state changes (multi-view panel syncs its icon here). */
  onPauseChanged?: (paused: boolean) => void;
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

    this.offline = new OfflineRenderer({
      view: this.primaryView,
      transport: this.transport,
      hasBufferPasses: () => this.hasBufferPasses(),
      hasOnFrameScript: () => !!this.project.script?.onFrame,
      runOnFrame: (time, deltaTime, frame) => {
        if (this.scriptAPI && this.project.script?.onFrame) {
          try { this.project.script.onFrame(this.scriptAPI, time, deltaTime, frame); } catch { /* ignore */ }
        }
      },
      runSetup: () => this.runSetup(true, false),
      runSetupOrThrow: () => {
        if (this.scriptAPI && this.project.script?.setup) {
          this.project.script.setup(this.scriptAPI, { isRestore: true });
        }
      },
      notifyPauseState: (paused) => this.notifyPauseState(paused),
    });

    // Resolve UI fields. Explicit per-field values always win; otherwise each
    // falls back to the optional `controls` master, then to its own default.
    // - stats/playback default off — opt in with `controls: true` or per-field.
    // - uniformsUI defaults to 'panel' regardless of `controls`; the panel
    //   only renders when at least one uniform has a UI control (guard below).
    // - authorTools (dev server) forces the full toolbar independent of all
    //   viewer chrome settings: authors never edit config to reach their tools.
    const authorTools = !!opts.authorTools;
    const stats = this.project.stats ?? this.project.controls ?? false;
    const playback = authorTools || (this.project.playback ?? this.project.controls ?? false);
    const uniformsUI: 'panel' | 'inline' | 'off' = this.project.uniformsUI ?? 'panel';
    const showUniforms = uniformsUI !== 'off';
    const uniformsCollapsible = uniformsUI === 'panel';

    // Stats panel
    if (stats) {
      this.statsPanel = new StatsPanel(this.container);
      this.statsPanel.updateResolution(this.primaryView.canvas.width, this.primaryView.canvas.height);
    }

    // Wire resize and context-restored callbacks (after statsPanel is created)
    if (this.isMultiView) {
      // Every view's ResizeObserver resets its engine (clearing buffers), so
      // re-step ALL views on any resize while paused — otherwise the resized
      // canvases stay black until resume.
      for (const view of this.views.values()) {
        view.onResize = (w, h) => {
          if (view === this.primaryView) {
            this.statsPanel?.updateResolution(w, h);
          }
          if (this.transport.isPaused) {
            const crossViewStates = this.collectCrossViewStates();
            for (const v of this.views.values()) {
              v.step(0, crossViewStates);
            }
          }
        };
      }

      // Wire context restored for all views
      for (const view of this.views.values()) {
        view.onContextRestored = () => this.runSetup(true);
      }
    } else {
      this.primaryView.onResize = (w, h) => {
        this.statsPanel?.updateResolution(w, h);
        this.transport.reset();
        // Re-render when resized while paused so the canvas isn't stale
        if (this.transport.isPaused) {
          this.primaryView.step(0);
        }
      };

      this.primaryView.onContextRestored = () => {
        this.runSetup(true);
        this.reset();
        this.start();
      };
    }

    // Create playback controls if enabled. Viewers get play/pause + reset;
    // author mode adds screenshot / record / export.
    if (playback && !opts.skipPlaybackControls) {
      this.playbackControls = new PlaybackControls(this.container, {
        authorTools,
        onTogglePlayPause: () => this.togglePlayPause(),
        onReset: () => this.reset(),
        onScreenshot: () => this.openScreenshotPanel(),
        onExportHTML: () => this.exportHTML(),
        onRender: () => this.openRecordingPanel(),
      });
    }

    // Handle startPaused option — defer pause until after the first frame renders
    if (this.project.startPaused) {
      this._pauseAfterFirstFrame = true;
      this.notifyPauseState(true);
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
      this.runSetup(false);
    }

    // Create floating uniforms panel (also requires at least one uniform with a UI control)
    if (showUniforms && !opts.skipUniformsPanel && this.project.uniforms && Object.values(this.project.uniforms).some(def => hasUIControl(def))) {
      this.uniformsPanel = new UniformsPanel({
        container: this.container,
        uniforms: this.project.uniforms,
        collapsible: uniformsCollapsible,
        onChange: (name, value) => {
          this.setUniformValue(name, value);
        },
      });
    }

    // Set up keyboard shortcuts. Space/S/R work on any focused shader
    // regardless of whether the on-screen playback bar is shown — the
    // README documents them unconditionally.
    this.setupGlobalShortcuts();
    this.setupKeyboardShortcuts();
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
      uniformsUI: mvProject.uniformsUI,
      startPaused: mvProject.startPaused,
      stickyMouse: mvProject.stickyMouse,
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

    this.transport.reset();
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

  /** Snapshot every view's input/resolution state for cross-view uniforms. */
  private collectCrossViewStates(): Map<string, CrossViewState> {
    const crossViewStates = new Map<string, CrossViewState>();
    for (const [name, view] of this.views) {
      crossViewStates.set(name, {
        mouse: view.getMouseState(),
        resolution: view.getResolution(),
        mousePressed: view.getMousePressed(),
      });
    }
    return crossViewStates;
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

    if (this.transport.isPaused || !this.isVisible) {
      return;
    }

    // Skip if any view lost context
    for (const view of this.views.values()) {
      if (view.isContextLost) return;
    }

    const currentTimeSec = currentTimeMs / 1000;
    const elapsedTime = this.transport.elapsed();

    this.statsPanel?.update(currentTimeSec, elapsedTime);

    this.runScriptOnFrame(elapsedTime, this.statsPanel?.totalFrameCount ?? 0);

    if (this.isMultiView) {
      // Step all views with shared time and cross-view state
      const crossViewStates = this.collectCrossViewStates();
      for (const view of this.views.values()) {
        view.step(elapsedTime, crossViewStates);
      }
    } else {
      this.primaryView.step(elapsedTime);
    }

    // startPaused: render one frame then pause
    if (this._pauseAfterFirstFrame) {
      this._pauseAfterFirstFrame = false;
      this.transport.forcePaused(true);
      this.notifyPauseState(true);
    }
  };

  // ===========================================================================
  // Playback Control
  // ===========================================================================

  togglePlayPause(): void {
    this.notifyPauseState(this.transport.toggle());
  }

  private notifyPauseState(paused: boolean): void {
    this.playbackControls?.setPaused(paused);
    this.onPauseChanged?.(paused);
  }

  /**
   * Run the script setup hook. Errors are logged; the runtime overlay is
   * shown only for interactive contexts (not offline render/restore paths).
   */
  private runSetup(isRestore: boolean, showOverlay = true): void {
    if (!this.scriptAPI || !this.project.script?.setup) return;
    try {
      this.project.script.setup(this.scriptAPI, { isRestore });
    } catch (e) {
      console.error(`script.js setup() threw${isRestore ? ' during restore' : ''}:`, e);
      if (showOverlay) this.primaryView.runtimeErrorOverlay.showError('setup', e);
    }
  }

  getPaused(): boolean {
    return this.transport.isPaused;
  }

  reset(): void {
    this.transport.reset();
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
    const filename = `shadertoy-${folderName}-${timestampString()}.png`;

    this.primaryView.canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create screenshot blob');
        return;
      }
      downloadBlob(blob, filename);
      console.log(`Screenshot saved: ${filename}`);
    }, 'image/png');
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
    return this.transport.elapsed();
  }

  // ===========================================================================
  // Screenshot Panel
  // ===========================================================================

  /** The currently open screenshot/recording panel, closed on dispose. */
  private activePanel: { close(): void } | null = null;

  openScreenshotPanel(): void {
    // Remember pause state so we can restore it when panel closes
    const wasPaused = this.transport.isPaused;

    this.activePanel = new ScreenshotPanel(
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

        renderPreviewStepped: (time, fps, onProgress) =>
          this.offline.renderPreviewStepped(time, fps, onProgress),

        captureScreenshot: (opts) => this.offline.captureScreenshot(opts),

        getCurrentTime: () => this.getCurrentTime(),
        hasBufferPasses: () => this.hasBufferPasses(),
        setUniformValue: (name, value) => this.setUniformValue(name, value),

        pause: () => this.transport.pause(),

        resume: () => {
          // Restore original pause state
          if (!wasPaused) this.transport.resume();
        },
      },
    );
  }

  // ===========================================================================
  // Recording Panel
  // ===========================================================================

  openRecordingPanel(): void {
    this.activePanel = new RecordingPanel(
      this.container,
      this.primaryView.canvas.width,
      this.primaryView.canvas.height,
      this.project.uniforms,
      {
        startRecording: (req) => this.offline.record(req),
        hasBufferPasses: () => this.hasBufferPasses(),
        setUniformValue: (name, value) => this.setUniformValue(name, value),
      },
    );
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
    if (this.disposed) return;
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
    this.playbackControls?.dispose();
    this.intersectionObserver.disconnect();
    if (this.globalKeyHandler) this.container.removeEventListener('keydown', this.globalKeyHandler);
    if (this.controlsKeyHandler) this.container.removeEventListener('keydown', this.controlsKeyHandler);
    this.uniformsPanel?.dispose();
    this.statsPanel?.dispose();
    // Close any open screenshot/recording panel so its callbacks can't
    // drive a disposed engine
    try { this.activePanel?.close(); } catch { /* already closed */ }
    this.activePanel = null;
  }
}
