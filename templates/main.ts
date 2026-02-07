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
} from '@stevejtrettel/shader-sandbox';
import type {
  ProjectConfig,
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

    // Mount the shader — handles layout, wiring, and start
    const handle = await mount(rootContainer, { project });

    // Expose for debugging
    (window as any).app = handle.app;
    (window as any).appGroup = handle.appGroup;

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
