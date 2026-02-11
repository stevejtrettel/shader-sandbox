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
import { createLayout, createMultiViewLayout, applyTheme } from './layouts';
import {
  ShaderProject,
  MultiViewProject,
  PassName,
  UniformValue,
  isMultiViewProject,
} from './project/types';
import { RecompileResult } from './layouts/types';

export interface MountOptions {
  /** The loaded project to render. */
  project: ShaderProject | MultiViewProject;
  /** Add pane decoration (border-radius, box-shadow). Default: true. */
  styled?: boolean;
  /** Canvas pixel ratio. Default: window.devicePixelRatio. */
  pixelRatio?: number;
}

export interface MountHandle {
  app: App;
  destroy: () => void;
}

/**
 * Mount a shader project into a DOM element.
 *
 * @param el - Target DOM element (will be filled 100%)
 * @param options - Mount configuration
 * @returns Handle with app reference and destroy() cleanup
 */
export async function mount(el: HTMLElement, options: MountOptions): Promise<MountHandle> {
  const { project, styled = true, pixelRatio = window.devicePixelRatio } = options;

  // Toggle decoration
  if (!styled) {
    el.classList.add('unstyled');
  }

  // Apply theme
  applyTheme(project.theme);

  // Multi-view project
  if (isMultiViewProject(project)) {
    return mountMultiView(el, project, pixelRatio);
  }

  // Single-view project
  return mountSingleView(el, project, pixelRatio);
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

  return {
    app,
    destroy: () => {
      app.dispose();
      layout.dispose();
    },
  };
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

  const controls = new MultiViewControls({
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

  return {
    app,
    destroy: () => {
      controls.dispose();
      app.dispose();
      layout.dispose();
    },
  };
}
