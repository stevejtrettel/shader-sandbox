/**
 * AppGroup - Coordinator for Multi-View Shader Projects
 *
 * Manages multiple App instances that share:
 * - Time and frame count
 * - Custom uniforms
 *
 * Each view has independent:
 * - Mouse/touch input
 * - Canvas/resolution
 *
 * Cross-view uniforms allow shaders to access other views' input state:
 * - iMouse_viewName
 * - iResolution_viewName
 * - iMousePressed_viewName
 */

import { App } from './App';
import {
  ShaderProject,
  MultiViewProject,
  ViewEntry,
  CrossViewState,
  UniformValue,
  ScriptEngineAPI,
  OverlayPosition,
  DemoScriptHooks,
} from '../project/types';

export interface AppGroupOptions {
  /** Container elements keyed by view name */
  containers: Map<string, HTMLElement>;
  /** Multi-view project definition */
  project: MultiViewProject;
  /** Canvas pixel ratio (default: window.devicePixelRatio) */
  pixelRatio?: number;
}

export class AppGroup {
  private apps: Map<string, App> = new Map();
  private project: MultiViewProject;
  private viewNames: string[];

  private animationId: number | null = null;
  private startTime: number = 0;
  private isPaused: boolean = false;
  private frame: number = 0;

  // Script handling (called once per frame, not per view)
  private script: DemoScriptHooks | null = null;
  private scriptAPI: ScriptEngineAPI | null = null;
  private lastOnFrameTime: number | null = null;
  private scriptErrorCount: number = 0;
  private static readonly MAX_SCRIPT_ERRORS = 10;

  constructor(opts: AppGroupOptions) {
    this.project = opts.project;
    this.viewNames = opts.project.views.map(v => v.name);

    // Create an App instance for each view
    for (const view of opts.project.views) {
      const container = opts.containers.get(view.name);
      if (!container) {
        throw new Error(`No container provided for view "${view.name}"`);
      }

      // Create a single-view ShaderProject from the view's passes
      // Pass script: null so individual Apps don't call hooks (we handle them here)
      const viewProject = this.createViewProject(view);

      const app = new App({
        container,
        project: viewProject,
        pixelRatio: opts.pixelRatio ?? window.devicePixelRatio,
        skipUniformsPanel: true,
        skipPlaybackControls: true,
        externalAnimationLoop: true,
        viewNames: this.viewNames,
      });

      this.apps.set(view.name, app);
    }

    // Apply initial paused state from project
    this.isPaused = opts.project.startPaused;

    // Set up script API for multi-view (called once per frame, not per view)
    this.script = opts.project.script;
    if (this.script) {
      this.initScriptAPI();
      // Run setup hook
      if (this.script.setup && this.scriptAPI) {
        try {
          this.script.setup(this.scriptAPI);
        } catch (e) {
          console.error('script.js setup() threw:', e);
        }
      }
    }
  }

  /**
   * Initialize the multi-view script API.
   */
  private initScriptAPI(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const firstApp = this.apps.values().next().value;

    this.scriptAPI = {
      // Uniform access (affects all views)
      setUniformValue: (name, value) => self.setUniformValue(name, value),
      getUniformValue: (name) => self.getUniformValue(name),
      // Texture/pixel access from first view (typically not used in multi-view)
      updateTexture: (name, w, h, data) => firstApp?.getEngine()?.updateTexture(name, w, h, data),
      readPixels: (passName, x, y, w, h) => firstApp?.getEngine()?.readPixels(passName as any, x, y, w, h) ?? new Uint8Array(w * h * 4),
      get width() { return firstApp?.getEngine()?.width ?? 0; },
      get height() { return firstApp?.getEngine()?.height ?? 0; },

      // Info overlays (can target any view)
      setOverlay: (position: OverlayPosition, text: string | null, viewName?: string) => {
        const targetView = viewName ?? self.viewNames[0];
        const app = self.apps.get(targetView);
        if (app) {
          app.setOverlay(position, text);
        }
      },

      // Multi-view extensions
      getCrossViewState: (viewName: string) => self.getCrossViewState(viewName),
      viewNames: self.viewNames,
    };
  }

  /**
   * Create a single-view ShaderProject from a ViewEntry.
   * This adapts the multi-view structure to what App expects.
   */
  private createViewProject(view: ViewEntry): ShaderProject {
    return {
      mode: this.project.mode,
      root: this.project.root,
      meta: {
        ...this.project.meta,
        title: `${this.project.meta.title} - ${view.name}`,
      },
      layout: 'fullscreen', // Each view fills its container
      theme: this.project.theme,
      controls: false, // AppGroup manages controls
      startPaused: this.project.startPaused,
      pixelRatio: this.project.pixelRatio,
      commonSource: this.project.commonSource,
      passes: view.passes,
      textures: this.project.textures,
      uniforms: this.project.uniforms,
      script: null, // Script handled by AppGroup, not individual Apps
    };
  }

  /**
   * Start the animation loop.
   */
  start(): void {
    if (this.animationId !== null) {
      return; // Already running
    }

    this.startTime = performance.now() / 1000;
    this.animate(performance.now());
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
   * Main animation loop - coordinates all views.
   */
  private animate = (currentTimeMs: number): void => {
    // Schedule next frame
    this.animationId = requestAnimationFrame(this.animate);

    // Skip if paused
    if (this.isPaused) {
      return;
    }

    const currentTimeSec = currentTimeMs / 1000;
    const elapsedTime = currentTimeSec - this.startTime;

    // Collect cross-view state from all apps
    const crossViewStates = new Map<string, CrossViewState>();
    for (const [viewName, app] of this.apps) {
      crossViewStates.set(viewName, {
        mouse: app.getMouseState(),
        resolution: app.getResolution(),
        mousePressed: app.getMousePressed(),
      });
    }

    // Run script onFrame hook (once per frame, not per view)
    if (this.script?.onFrame && this.scriptAPI && this.scriptErrorCount < AppGroup.MAX_SCRIPT_ERRORS) {
      const deltaTime = this.lastOnFrameTime !== null ? elapsedTime - this.lastOnFrameTime : 0;
      try {
        this.script.onFrame(this.scriptAPI, elapsedTime, deltaTime, this.frame);
        this.scriptErrorCount = 0;
      } catch (e) {
        this.scriptErrorCount++;
        console.error(`script.js onFrame() threw (${this.scriptErrorCount}/${AppGroup.MAX_SCRIPT_ERRORS}):`, e);
        if (this.scriptErrorCount >= AppGroup.MAX_SCRIPT_ERRORS) {
          console.warn('script.js onFrame() disabled after too many errors');
        }
      }
      this.lastOnFrameTime = elapsedTime;
    }

    // Step each app with shared time and cross-view state
    for (const app of this.apps.values()) {
      app.stepExternal(elapsedTime, this.frame, crossViewStates);
    }

    this.frame++;
  };

  /**
   * Toggle play/pause state for all views.
   */
  togglePlayPause(): void {
    this.isPaused = !this.isPaused;
    if (!this.isPaused && this.animationId === null) {
      // Resume from pause - restart animation loop
      this.startTime = performance.now() / 1000 - (this.frame / 60); // Approximate resume
      this.animate(performance.now());
    }
  }

  /**
   * Get current paused state.
   */
  getPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Reset all views to frame 0.
   */
  reset(): void {
    this.frame = 0;
    this.startTime = performance.now() / 1000;

    // Reset each app's engine
    for (const app of this.apps.values()) {
      app.getEngine()?.reset();
    }
  }

  /**
   * Set a uniform value across all views.
   */
  setUniformValue(name: string, value: UniformValue): void {
    for (const app of this.apps.values()) {
      app.getEngine()?.setUniformValue(name, value);
    }
  }

  /**
   * Get a uniform value (from first view).
   */
  getUniformValue(name: string): UniformValue | undefined {
    const firstApp = this.apps.values().next().value;
    return firstApp?.getEngine()?.getUniformValue(name);
  }

  /**
   * Check if any view has compilation errors.
   */
  hasErrors(): boolean {
    for (const app of this.apps.values()) {
      if (app.hasErrors()) return true;
    }
    return false;
  }

  /**
   * Get all apps (for advanced use cases).
   */
  getApps(): Map<string, App> {
    return this.apps;
  }

  /**
   * Get cross-view state for a specific view.
   * Useful for displaying info overlays.
   */
  getCrossViewState(viewName: string): CrossViewState | undefined {
    const app = this.apps.get(viewName);
    if (!app) return undefined;
    return {
      mouse: app.getMouseState(),
      resolution: app.getResolution(),
      mousePressed: app.getMousePressed(),
    };
  }

  /**
   * Get view names.
   */
  getViewNames(): string[] {
    return this.viewNames;
  }

  /**
   * Get a specific app by view name.
   */
  getApp(viewName: string): App | undefined {
    return this.apps.get(viewName);
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    this.stop();
    for (const app of this.apps.values()) {
      app.dispose();
    }
    this.apps.clear();
  }
}
