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
  MultiViewProject,
  MultiViewConfig,
  ViewEntry,
  ShaderPass,
  Channels,
} from './types';
import type { FileLoader } from './FileLoader';
import { loadProjectFromFiles } from './loadProjectCore';
import { isMultiViewConfig } from './types';

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
  jsonFiles: Record<string, () => Promise<ProjectConfig | MultiViewConfig>>,
  imageFiles: Record<string, () => Promise<string>>,
  scriptFiles?: Record<string, () => Promise<any>>,
): Promise<ShaderProject | MultiViewProject> {
  const normalizedPath = demoPath.startsWith('./') ? demoPath : `./${demoPath}`;

  // Pre-load config if present
  const configPath = `${normalizedPath}/config.json`;
  let config: any = undefined;
  if (configPath in jsonFiles) {
    config = await jsonFiles[configPath]();
  }

  // Check if this is a multi-view config
  if (config && isMultiViewConfig(config)) {
    return loadMultiViewDemo(normalizedPath, config, glslFiles, imageFiles, scriptFiles);
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

// =============================================================================
// Multi-View Loading
// =============================================================================

async function loadMultiViewDemo(
  demoPath: string,
  config: MultiViewConfig,
  glslFiles: Record<string, () => Promise<string>>,
  imageFiles: Record<string, () => Promise<string>>,
  scriptFiles?: Record<string, () => Promise<any>>,
): Promise<MultiViewProject> {
  const loader = createBrowserFileLoader(glslFiles, imageFiles);
  const script = await loadScript(demoPath, scriptFiles);

  // Load common.glsl if present
  let commonSource: string | null = null;
  const commonPath = `${demoPath}/common.glsl`;
  if (findFileCaseInsensitive(glslFiles, commonPath)) {
    commonSource = await loader.readText(commonPath);
  }

  // Load each view's shader(s)
  const views: ViewEntry[] = [];
  const defaultChannels: Channels = [
    { kind: 'none' },
    { kind: 'none' },
    { kind: 'none' },
    { kind: 'none' },
  ];

  for (const viewName of config.views) {
    // Try flat file first: {viewName}.glsl
    const flatPath = `${demoPath}/${viewName}.glsl`;
    const folderImagePath = `${demoPath}/${viewName}/image.glsl`;

    let imageSource: string;

    if (findFileCaseInsensitive(glslFiles, flatPath)) {
      imageSource = await loader.readText(flatPath);
    } else if (findFileCaseInsensitive(glslFiles, folderImagePath)) {
      imageSource = await loader.readText(folderImagePath);
    } else {
      throw new Error(`Multi-view: No shader found for view "${viewName}". Expected ${viewName}.glsl or ${viewName}/image.glsl`);
    }

    const imagePass: ShaderPass = {
      name: 'Image',
      glslSource: imageSource,
      channels: defaultChannels,
      namedSamplers: new Map(),
    };

    views.push({
      name: viewName,
      passes: { Image: imagePass },
    });
  }

  return {
    mode: 'standard',
    root: demoPath,
    meta: {
      title: config.title ?? titleFromPath(demoPath),
      author: config.author ?? null,
      description: config.description ?? null,
    },
    theme: config.theme ?? 'light',
    controls: config.controls ?? true,
    startPaused: config.startPaused ?? false,
    pixelRatio: config.pixelRatio ?? null,
    commonSource,
    uniforms: config.uniforms ?? {},
    textures: [],
    script,
    views,
    viewLayout: config.layout ?? 'split',
  };
}
