/**
 * mount() — Core programmatic API for mounting a shader project into a DOM element.
 *
 * Consolidates all handler wiring (recompile + uniform callbacks)
 * previously split between main.ts and embed.ts.
 *
 * Does NOT import generatedLoader — the project is always passed in by the caller.
 * Does NOT import base.css — callers handle their own global resets.
 */

import './styles/theme.css';

import { App } from './app/App';
import { MultiViewControls } from './app/MultiViewControls';
import { createLayout, createMultiViewLayout } from './layouts';
import {
  ShaderProject,
  MultiViewProject,
  ThemeMode,
  PassName,
  UniformValue,
  isMultiViewProject,
} from './project/types';
import { RecompileResult, LayoutMode } from './layouts/types';

export interface MountOptions {
  /** The loaded project to render. */
  project: ShaderProject | MultiViewProject;
  /** Add pane decoration (border-radius, box-shadow). Default: true. */
  styled?: boolean;
  /** Canvas pixel ratio. Default: window.devicePixelRatio. */
  pixelRatio?: number;
  /** Override the layout mode from config. */
  layout?: LayoutMode;
  /** Override whether playback controls are shown. */
  controls?: boolean;
  /** Override the color theme. */
  theme?: ThemeMode;
  /** Override whether the shader starts paused. */
  startPaused?: boolean;
}

/** Consumer-facing options (everything except `project`, which is loaded by the caller). */
export type MountPresentationOptions = Omit<MountOptions, 'project'>;

export interface MountHandle {
  pause(): void;
  resume(): void;
  reset(): void;
  readonly isPaused: boolean;
  setUniform(name: string, value: UniformValue): void;
  getUniform(name: string): UniformValue | undefined;
  destroy(): void;
}

/**
 * Mount a shader project into a DOM element.
 *
 * @param el - Target DOM element (will be filled 100%)
 * @param options - Mount configuration
 * @returns Handle with playback controls, uniform access, and destroy() cleanup
 */
export function mount(el: HTMLElement, options: MountOptions): MountHandle {
  const { styled = true, pixelRatio = window.devicePixelRatio } = options;

  // Apply presentation overrides onto a shallow copy of the project
  const project = { ...options.project } as ShaderProject | MultiViewProject;
  if (options.layout !== undefined) (project as ShaderProject).layout = options.layout;
  if (options.controls !== undefined) project.controls = options.controls;
  if (options.theme !== undefined) project.theme = options.theme;
  if (options.startPaused !== undefined) project.startPaused = options.startPaused;
  if (options.pixelRatio !== undefined) project.pixelRatio = options.pixelRatio;

  // Toggle decoration
  if (!styled) {
    el.classList.add('unstyled');
  }

  // Scope theme to this container (not document.documentElement)
  el.setAttribute('data-theme', project.theme);

  // Multi-view project
  if (isMultiViewProject(project)) {
    return mountMultiView(el, project, pixelRatio);
  }

  // Single-view project
  return mountSingleView(el, project, pixelRatio);
}

function createHandle(app: App, destroy: () => void): MountHandle {
  return {
    pause: () => { if (!app.getPaused()) app.togglePlayPause(); },
    resume: () => { if (app.getPaused()) app.togglePlayPause(); },
    reset: () => app.reset(),
    get isPaused() { return app.getPaused(); },
    setUniform: (name, value) => app.setUniformValue(name, value),
    getUniform: (name) => app.getUniformValue(name),
    destroy,
  };
}

function mountSingleView(
  el: HTMLElement,
  project: ShaderProject,
  pixelRatio: number,
): MountHandle {
  const layout = createLayout(project.layout, {
    container: el,
    project,
  });

  const app = new App({
    container: layout.getCanvasContainer(),
    project,
    pixelRatio,
    skipUniformsPanel: false,
    skipPlaybackControls: false,
  });

  // Wire up recompile handler (split, tabbed layouts)
  if (layout.setRecompileHandler) {
    layout.setRecompileHandler((passName: 'common' | PassName, newSource: string): RecompileResult => {
      const engine = app.getEngine();
      if (!engine) {
        return { success: false, error: 'Engine not initialized' };
      }

      if (passName === 'common') {
        const result = engine.recompileCommon(newSource);
        if (result.success) {
          return { success: true };
        }
        const firstError = result.errors[0];
        return {
          success: false,
          error: firstError ? `${firstError.passName}: ${firstError.error}` : 'Unknown error',
        };
      }

      return engine.recompilePass(passName, newSource);
    });
  }

  // Wire up uniform handler (split, tabbed layouts)
  if (layout.setUniformHandler) {
    layout.setUniformHandler((name: string, value: UniformValue) => {
      const engine = app.getEngine();
      if (engine) {
        engine.setUniformValue(name, value);
      }
    });
  }

  if (!app.hasErrors()) {
    app.start();
  }

  return createHandle(app, () => {
    app.dispose();
    layout.dispose();
  });
}

function mountMultiView(
  el: HTMLElement,
  project: MultiViewProject,
  pixelRatio: number,
): MountHandle {
  const viewNames = project.views.map(v => v.name);

  const layout = createMultiViewLayout(project.viewLayout, {
    container: el,
    project,
    viewNames,
  });

  const app = new App({
    container: layout.getWrapperElement(),
    project,
    pixelRatio,
    viewContainers: layout.getCanvasContainers(),
    skipPlaybackControls: true,
    skipUniformsPanel: true,
  });

  const mvControls = new MultiViewControls({
    wrapper: layout.getWrapperElement(),
    onTogglePlayPause: () => app.togglePlayPause(),
    onReset: () => app.reset(),
    getPaused: () => app.getPaused(),
    onSetUniformValue: (name, value) => app.setUniformValue(name, value),
    uniforms: project.uniforms,
  });

  if (!app.hasErrors()) {
    app.start();
  }

  return createHandle(app, () => {
    mvControls.dispose();
    app.dispose();
    layout.dispose();
  });
}
