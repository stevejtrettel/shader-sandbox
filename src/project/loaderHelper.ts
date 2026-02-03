/**
 * Project Layer - Browser/Vite Loader
 *
 * Thin adapter that implements FileLoader over Vite's import.meta.glob
 * record maps, then delegates to the shared loadProjectFromFiles() core.
 */

import type {
  ShaderProject,
  ProjectConfig,
  DemoScriptHooks,
} from './types';
import type { FileLoader } from './FileLoader';
import { loadProjectFromFiles } from './loadProjectCore';

// =============================================================================
// Case-Insensitive File Lookup
// =============================================================================

function findFileCaseInsensitive<T>(
  files: Record<string, T>,
  path: string,
): string | null {
  if (path in files) return path;
  const lowerPath = path.toLowerCase();
  for (const key of Object.keys(files)) {
    if (key.toLowerCase() === lowerPath) {
      return key;
    }
  }
  return null;
}

// =============================================================================
// Script Loading
// =============================================================================

async function loadScript(
  demoPath: string,
  scriptFiles?: Record<string, () => Promise<any>>,
): Promise<DemoScriptHooks | null> {
  if (!scriptFiles) return null;

  const scriptPath = `${demoPath}/script.js`;
  const actualPath = findFileCaseInsensitive(scriptFiles, scriptPath);
  if (!actualPath) return null;

  const mod = await scriptFiles[actualPath]();
  const hooks: DemoScriptHooks = {};
  if (typeof mod.setup === 'function') hooks.setup = mod.setup;
  if (typeof mod.onFrame === 'function') hooks.onFrame = mod.onFrame;

  return (hooks.setup || hooks.onFrame) ? hooks : null;
}

// =============================================================================
// Browser FileLoader Implementation
// =============================================================================

function createBrowserFileLoader(
  glslFiles: Record<string, () => Promise<string>>,
  imageFiles: Record<string, () => Promise<string>>,
): FileLoader {
  return {
    async exists(path: string): Promise<boolean> {
      return findFileCaseInsensitive(glslFiles, path) !== null
        || findFileCaseInsensitive(imageFiles, path) !== null;
    },

    async readText(path: string): Promise<string> {
      const actualPath = findFileCaseInsensitive(glslFiles, path);
      if (!actualPath) {
        throw new Error(`File not found: ${path}`);
      }
      return glslFiles[actualPath]();
    },

    async resolveImageUrl(path: string): Promise<string> {
      const actualPath = findFileCaseInsensitive(imageFiles, path);
      if (!actualPath) {
        throw new Error(`Image not found: ${path}`);
      }
      return imageFiles[actualPath]();
    },

    async listGlslFiles(): Promise<string[]> {
      // Browser loader doesn't support directory listing for validation;
      // return empty to skip the extra-files check in loadProjectCore.
      return [];
    },

    async hasFiles(): Promise<boolean> {
      // Browser loader doesn't have directory awareness
      return false;
    },

    joinPath(...parts: string[]): string {
      // Simple path join for browser (forward-slash based)
      return parts
        .map((p, i) => i === 0 ? p : p.replace(/^\/+/, ''))
        .join('/')
        .replace(/\/+/g, '/');
    },

    baseName(path: string): string {
      return path.split('/').pop() || path;
    },
  };
}

// =============================================================================
// Title Helper
// =============================================================================

function titleFromPath(demoPath: string): string {
  const demoName = demoPath.split('/').pop() || demoPath;
  return demoName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// =============================================================================
// Main Entry Point
// =============================================================================

export async function loadDemo(
  demoPath: string,
  glslFiles: Record<string, () => Promise<string>>,
  jsonFiles: Record<string, () => Promise<ProjectConfig>>,
  imageFiles: Record<string, () => Promise<string>>,
  scriptFiles?: Record<string, () => Promise<any>>,
): Promise<ShaderProject> {
  const normalizedPath = demoPath.startsWith('./') ? demoPath : `./${demoPath}`;

  // Pre-load config if present
  const configPath = `${normalizedPath}/config.json`;
  let config: any = undefined;
  if (configPath in jsonFiles) {
    config = await jsonFiles[configPath]();
  }

  // Pre-load script hooks
  const script = await loadScript(normalizedPath, scriptFiles);

  // Create the FileLoader adapter
  const loader = createBrowserFileLoader(glslFiles, imageFiles);

  // Build a texture URL resolver that goes through Vite's imageFiles
  const textureUrlResolver = async (texturePath: string): Promise<string> => {
    const fullPath = `${normalizedPath}/${texturePath.replace(/^\.\//, '')}`;
    return loader.resolveImageUrl(fullPath);
  };

  const project = await loadProjectFromFiles(loader, normalizedPath, {
    config,
    script,
    textureUrlResolver,
  });

  // Override title with pretty-formatted version if not set by config
  if (!config?.title) {
    project.meta.title = titleFromPath(normalizedPath);
  }

  return project;
}
