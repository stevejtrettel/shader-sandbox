/**
 * Shader Collection Entry Point
 *
 * Loads a shader from the shaders/ folder based on the SHADER_NAME env variable
 * or URL parameter (?shader=name).
 *
 * Supports both single-view and multi-view shader projects.
 */

import {
  App,
  AppGroup,
  MultiViewControls,
  UILayout,
  createLayout,
  createMultiViewLayout,
  loadDemo,
  isMultiViewProject,
} from '@stevejtrettel/shader-sandbox';
import type {
  ProjectConfig,
  PassName,
  UniformValue,
  MultiViewProject,
  RecompileResult,
} from '@stevejtrettel/shader-sandbox';

// Get shader name from env (set by dev script) or URL param
function getShaderName(): string {
  // Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const urlShader = urlParams.get('shader');
  if (urlShader) return urlShader;

  // Fall back to env variable (set by vite define)
  // @ts-ignore
  return typeof __SHADER_NAME__ !== 'undefined' ? __SHADER_NAME__ : 'simple';
}

async function main() {
  try {
    const shaderName = getShaderName();

    // Gallery mode: show all shaders as a grid
    if (shaderName === '__gallery__') {
      await initGallery();
      return;
    }

    console.log(`Loading shader: ${shaderName}`);

    // Load shaders using Vite's import.meta.glob
    const glslFiles = import.meta.glob<string>('./shaders/**/*.glsl', {
      query: '?raw',
      import: 'default',
    });

    const jsonFiles = import.meta.glob<ProjectConfig>('./shaders/**/*.json', {
      import: 'default',
    });

    const imageFiles = import.meta.glob<string>('./shaders/**/*.{jpg,jpeg,png,gif,webp,bmp}', {
      query: '?url',
      import: 'default',
    });

    // Script files (script.js hooks for JS-driven computation)
    const scriptFiles = import.meta.glob<any>('./shaders/**/script.js');

    // Load the specific shader project
    const project = await loadDemo(`shaders/${shaderName}`, glslFiles, jsonFiles, imageFiles, scriptFiles);

    // Get root container
    const rootContainer = document.getElementById('app');
    if (!rootContainer) {
      throw new Error('Container element #app not found');
    }

    // Check if this is a multi-view project
    if (isMultiViewProject(project)) {
      await initMultiViewApp(rootContainer, project);
      return;
    }

    // Single-view project
    console.log(`Loaded project: ${project.meta.title}`);

    // Create layout
    const layout = createLayout(project.layout, {
      container: rootContainer,
      project,
    });

    // Get canvas container from layout
    const canvasContainer = layout.getCanvasContainer();

    // Check if this is a UILayout (which has its own uniforms panel and playback controls)
    const isUILayoutInstance = layout instanceof UILayout;

    // Create app
    const app = new App({
      container: canvasContainer,
      project,
      pixelRatio: window.devicePixelRatio,
      skipUniformsPanel: isUILayoutInstance,
      skipPlaybackControls: isUILayoutInstance,
    });

    // Wire up recompile handler for layouts that support it (split, tabbed)
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
          } else {
            const firstError = result.errors[0];
            return {
              success: false,
              error: firstError ? `${firstError.passName}: ${firstError.error}` : 'Unknown error',
            };
          }
        } else {
          return engine.recompilePass(passName, newSource);
        }
      });
    }

    // Wire up uniform change handler for layouts that support it (split, tabbed)
    if (layout.setUniformHandler) {
      layout.setUniformHandler((name: string, value: UniformValue) => {
        const engine = app.getEngine();
        if (engine) {
          engine.setUniformValue(name, value);
        }
      });
    }

    // Wire up UILayout callbacks (playback controls and uniforms)
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

      // Sync initial paused state (from project.startPaused)
      layout.setPaused(app.getPaused());
    }

    // Start if no errors
    if (!app.hasErrors()) {
      app.start();
      console.log('Shader started!');
    } else {
      console.warn('Not started due to shader compilation errors');
    }

    // Expose for debugging
    (window as any).app = app;
    (window as any).layout = layout;

  } catch (error) {
    console.error('Failed to initialize:', error);
    const container = document.getElementById('app');
    if (container) {
      container.innerHTML = `
        <div style="color: red; padding: 20px; font-family: monospace;">
          <h2>Error</h2>
          <pre>${error instanceof Error ? error.message : String(error)}</pre>
        </div>
      `;
    }
  }
}

/**
 * Initialize a multi-view shader application.
 */
async function initMultiViewApp(container: HTMLElement, project: MultiViewProject) {
  console.log(`Loaded multi-view project: ${project.meta.title}`);
  console.log(`Views:`, project.views.map(v => v.name));

  const viewNames = project.views.map(v => v.name);

  // Create multi-view layout
  const layout = createMultiViewLayout(project.viewLayout, {
    container,
    project,
    viewNames,
  });

  // Create AppGroup to coordinate all views
  const appGroup = new AppGroup({
    containers: layout.getCanvasContainers(),
    project,
    pixelRatio: window.devicePixelRatio,
  });

  // Create shared controls
  const controls = new MultiViewControls({
    wrapper: layout.getWrapperElement(),
    appGroup,
    uniforms: project.uniforms,
  });

  // Start if no errors
  if (!appGroup.hasErrors()) {
    appGroup.start();
    console.log('Multi-view app started!');
  } else {
    console.warn('Multi-view app not started due to shader compilation errors');
  }

  // Expose for debugging
  (window as any).appGroup = appGroup;
  (window as any).layout = layout;
  (window as any).controls = controls;
}

/**
 * Initialize the shader gallery page.
 * Discovers all shaders via import.meta.glob and renders a card grid.
 */
async function initGallery() {
  const configModules = import.meta.glob<any>('./shaders/*/config.json', { import: 'default' });

  const rootContainer = document.getElementById('app');
  if (!rootContainer) return;

  // Collect shader info
  const cards: Array<{ name: string; title: string; description: string }> = [];
  for (const [path, loader] of Object.entries(configModules)) {
    // path looks like './shaders/my-shader/config.json'
    const match = path.match(/\.\/shaders\/([^/]+)\/config\.json$/);
    if (!match) continue;
    const name = match[1];
    let title = name;
    let description = '';
    try {
      const config = await loader();
      if (config?.meta?.title) title = config.meta.title;
      if (config?.meta?.description) description = config.meta.description;
    } catch {}
    cards.push({ name, title, description });
  }

  cards.sort((a, b) => a.name.localeCompare(b.name));

  rootContainer.innerHTML = `
    <style>
      body { background: #0a0a0f; margin: 0; }
      .gallery-container {
        min-height: 100vh;
        padding: 60px 40px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #e0e0e0;
      }
      .gallery-title {
        text-align: center;
        font-size: 28px;
        font-weight: 600;
        margin-bottom: 40px;
        color: #fff;
        letter-spacing: -0.5px;
      }
      .gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }
      .gallery-card {
        background: rgba(30, 30, 40, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 24px;
        text-decoration: none;
        color: inherit;
        transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
        backdrop-filter: blur(12px);
        cursor: pointer;
      }
      .gallery-card:hover {
        transform: translateY(-2px);
        border-color: rgba(100, 140, 255, 0.3);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }
      .gallery-card-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 6px;
        color: #fff;
      }
      .gallery-card-name {
        font-size: 12px;
        font-family: 'Monaco', 'Menlo', monospace;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 8px;
      }
      .gallery-card-desc {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1.5;
      }
    </style>
    <div class="gallery-container">
      <h1 class="gallery-title">Shader Gallery</h1>
      <div class="gallery-grid">
        ${cards.map(c => `
          <a class="gallery-card" href="?shader=${c.name}">
            <div class="gallery-card-title">${c.title}</div>
            ${c.title !== c.name ? `<div class="gallery-card-name">${c.name}</div>` : ''}
            ${c.description ? `<div class="gallery-card-desc">${c.description}</div>` : ''}
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
