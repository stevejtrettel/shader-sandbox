/**
 * Shader Collection Entry Point
 *
 * Loads a shader from the shaders/ folder based on the SHADER_NAME env variable
 * or URL parameter (?shader=name)
 */

import { App, createLayout, loadDemo } from '@stevejtrettel/shader-sandbox';
import type { ShadertoyConfig, PassName } from '@stevejtrettel/shader-sandbox';
import type { RecompileResult } from '@stevejtrettel/shader-sandbox';

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
    console.log(`Loading shader: ${shaderName}`);

    // Load shaders using Vite's import.meta.glob
    const glslFiles = import.meta.glob<string>('./shaders/**/*.glsl', {
      query: '?raw',
      import: 'default',
    });

    const jsonFiles = import.meta.glob<ShadertoyConfig>('./shaders/**/*.json', {
      import: 'default',
    });

    const imageFiles = import.meta.glob<string>('./shaders/**/*.{jpg,jpeg,png,gif,webp,bmp}', {
      query: '?url',
      import: 'default',
    });

    // Load the specific shader project
    const project = await loadDemo(`shaders/${shaderName}`, glslFiles, jsonFiles, imageFiles);

    console.log(`Loaded project: ${project.meta.title}`);

    // Get root container
    const rootContainer = document.getElementById('app');
    if (!rootContainer) {
      throw new Error('Container element #app not found');
    }

    // Create layout
    const layout = createLayout(project.layout, {
      container: rootContainer,
      project,
    });

    // Get canvas container from layout
    const canvasContainer = layout.getCanvasContainer();

    // Create app
    const app = new App({
      container: canvasContainer,
      project,
      pixelRatio: window.devicePixelRatio,
    });

    // Wire up recompile handler for live editing
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

    // Start if no errors
    if (!app.hasErrors()) {
      app.start();
      console.log('Shader started!');
    } else {
      console.warn('Not started due to shader compilation errors');
    }

    // Expose for debugging
    (window as any).app = app;

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
