/**
 * Main Entry Point (Dev Server)
 *
 * Thin wrapper around mount() that adds dev-only padding and debug globals.
 *
 * To run a specific demo:
 *   npm run dev:demo <demo-name>
 *
 * Examples:
 *   npm run dev:demo keyboard-test
 *   npm run dev:demo simple-gradient
 *   npm run dev:demo mandelbrot-julia (multi-view)
 */

import './styles/base.css';
import './styles/dev.css';

import { mount } from './mount';
import { loadDemoProject, DEMO_NAME } from './project/generatedLoader';
import { isMultiViewProject } from './project/types';

async function main() {
  try {
    console.log(`Loading demo: ${DEMO_NAME}`);
    const project = await loadDemoProject();

    const root = document.getElementById('app');
    if (!root) {
      throw new Error('Container element #app not found');
    }

    // Add dev padding for non-fullscreen layouts
    const isFullscreen = !isMultiViewProject(project) && project.layout === 'fullscreen';
    if (!isFullscreen) {
      root.classList.add('dev-padded');
    }

    const handle = await mount(root, { project });

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

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
