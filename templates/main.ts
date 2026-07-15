/**
 * Shader Collection Entry Point
 *
 * Loads a shader from the shaders/ folder based on the SHADER_NAME env variable
 * or URL parameter (?shader=name).
 *
 * Supports both single-view and multi-view shader projects.
 */

import {
  mount,
  loadDemo,
} from 'shader-sandbox';
import type {
  ProjectConfig,
} from 'shader-sandbox';
// @ts-ignore — plain JS module shared with the CLI's build-gallery
import { renderGalleryHTML } from './gallery.js';

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

    // Raw script text (retained for HTML export's embedded module)
    const rawScriptFiles = import.meta.glob<string>('./shaders/**/script.js', {
      query: '?raw',
      import: 'default',
    });

    // Load the specific shader project
    const project = await loadDemo(`shaders/${shaderName}`, glslFiles, jsonFiles, imageFiles, scriptFiles, rawScriptFiles);

    // Get root container
    const rootContainer = document.getElementById('app');
    if (!rootContainer) {
      throw new Error('Container element #app not found');
    }

    // Mount the shader — handles layout, wiring, and start.
    // Dev server = author mode: full toolbar regardless of viewer chrome config.
    const handle = await mount(rootContainer, { project, authorTools: true });

    // Expose for debugging
    (window as any).app = handle.app;

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
      if (config?.title) title = config.title;
      if (config?.description) description = config.description;
    } catch {}
    cards.push({ name, title, description });
  }

  cards.sort((a, b) => a.name.localeCompare(b.name));

  rootContainer.innerHTML = renderGalleryHTML(
    cards,
    (c) => `?shader=${encodeURIComponent(c.name)}`,
  );
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
