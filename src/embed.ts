/**
 * Embeddable Entry Point
 * Supports both single-view and multi-view shader projects.
 */

import './styles/embed.css';

import { App } from './app/App';
import { AppGroup } from './app/AppGroup';
import { MultiViewControls } from './app/MultiViewControls';
import { createLayout, createMultiViewLayout } from './layouts';
import { loadDemoProject, DEMO_NAME } from './project/generatedLoader';
import { isMultiViewProject, MultiViewProject } from './project/types';

export interface EmbedOptions {
  container: HTMLElement | string;
  pixelRatio?: number;
}

export interface EmbedResult {
  app?: App;
  appGroup?: AppGroup;
  destroy: () => void;
}

export async function embed(options: EmbedOptions): Promise<EmbedResult> {
  const container = typeof options.container === 'string'
    ? document.querySelector(options.container)
    : options.container;

  if (!container || !(container instanceof HTMLElement)) {
    throw new Error(`Container not found: ${options.container}`);
  }

  const project = await loadDemoProject();

  // Handle multi-view projects
  if (isMultiViewProject(project)) {
    return embedMultiView(container, project, options);
  }

  // Single-view project
  const layout = createLayout(project.layout, {
    container,
    project,
  });

  const app = new App({
    container: layout.getCanvasContainer(),
    project,
    pixelRatio: options.pixelRatio ?? window.devicePixelRatio,
  });

  if (!app.hasErrors()) {
    app.start();
  }

  return {
    app,
    destroy: () => {
      app.dispose();
    },
  };
}

async function embedMultiView(
  container: HTMLElement,
  project: MultiViewProject,
  options: EmbedOptions
): Promise<EmbedResult> {
  const viewNames = project.views.map(v => v.name);

  const layout = createMultiViewLayout(project.viewLayout, {
    container,
    project,
    viewNames,
  });

  const appGroup = new AppGroup({
    containers: layout.getCanvasContainers(),
    project,
    pixelRatio: options.pixelRatio ?? window.devicePixelRatio,
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

export { DEMO_NAME };