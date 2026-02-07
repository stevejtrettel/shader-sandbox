/**
 * mount() — Core programmatic API for mounting a shader project into a DOM element.
 *
 * Consolidates all handler wiring (recompile, uniform, UILayout callbacks)
 * previously split between main.ts and embed.ts.
 *
 * Does NOT import generatedLoader — the project is always passed in by the caller.
 * Does NOT import base.css — callers handle their own global resets.
 */

import './styles/theme.css';

import { App } from './app/App';
import { AppGroup } from './app/AppGroup';
import { MultiViewControls } from './app/MultiViewControls';
import { createLayout, createMultiViewLayout, applyTheme } from './layouts';
import { UILayout } from './layouts/UILayout';
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
  app?: App;
  appGroup?: AppGroup;
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
  applyTheme(isMultiViewProject(project) ? project.theme : project.theme);

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

  const isUILayout = layout instanceof UILayout;

  const app = new App({
    container: layout.getCanvasContainer(),
    project,
    pixelRatio,
    skipUniformsPanel: isUILayout,
    skipPlaybackControls: isUILayout,
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

  // Wire up UILayout callbacks (playback controls + uniforms panel)
  if (layout instanceof UILayout) {
    layout.setPlaybackCallbacks({
      onPlayPause: () => {
        app.togglePlayPause();
        layout.setPaused(app.getPaused());
      },
      onReset: () => app.reset(),
      onScreenshot: () => app.screenshot(),
    });

    layout.setUniformCallback((name: string, value: UniformValue) => {
      const engine = app.getEngine();
      if (engine) {
        engine.setUniformValue(name, value);
      }
    });

    layout.setPaused(app.getPaused());
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

  const appGroup = new AppGroup({
    containers: layout.getCanvasContainers(),
    project,
    pixelRatio,
  });

  const controls = new MultiViewControls({
    wrapper: layout.getWrapperElement(),
    appGroup,
    uniforms: project.uniforms,
  });

  if (!appGroup.hasErrors()) {
    appGroup.start();
  }

  return {
    appGroup,
    destroy: () => {
      controls.dispose();
      appGroup.dispose();
      layout.dispose();
    },
  };
}
