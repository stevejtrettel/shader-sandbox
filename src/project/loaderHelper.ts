/**
 * Helper functions for loading demo files in the browser.
 * Called by the generated loader (Vite import.meta.glob).
 */

import {
  ShaderProject,
  ProjectConfig,
  PassName,
  ChannelSource,
  Channels,
  ShaderTexture2D,
  UniformDefinitions,
  DemoScriptHooks,
  StandardBufferConfig,
} from './types';
import {
  parseChannelValue,
  defaultSourceForPass,
  validateConfig,
  PASS_ORDER,
  BUFFER_PASS_NAMES,
  CHANNEL_KEYS,
  DEFAULT_LAYOUT,
  DEFAULT_CONTROLS,
  DEFAULT_THEME,
} from './configHelpers';

// =============================================================================
// Case-Insensitive File Lookup
// =============================================================================

/**
 * Case-insensitive file lookup helper.
 * Returns the actual key from the record that matches the path (case-insensitive).
 */
function findFileCaseInsensitive<T>(
  files: Record<string, T>,
  path: string
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

/**
 * Load script.js from a demo folder if present.
 */
async function loadScript(
  demoPath: string,
  scriptFiles?: Record<string, () => Promise<any>>
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
// Common Source Loading
// =============================================================================

/**
 * Load common.glsl source (explicit path or default).
 */
async function loadCommonSource(
  demoPath: string,
  glslFiles: Record<string, () => Promise<string>>,
  commonPath?: string
): Promise<string | null> {
  if (commonPath) {
    const fullPath = `${demoPath}/${commonPath}`;
    const actualPath = findFileCaseInsensitive(glslFiles, fullPath);
    return actualPath ? await glslFiles[actualPath]() : null;
  }
  // Check for default common.glsl
  const defaultPath = `${demoPath}/common.glsl`;
  const actualPath = findFileCaseInsensitive(glslFiles, defaultPath);
  return actualPath ? await glslFiles[actualPath]() : null;
}

// =============================================================================
// Channel Normalization
// =============================================================================

/**
 * Normalize a channel value into a ChannelSource.
 */
function normalizeChannel(
  channelValue: any,
  texturePathToName?: Map<string, string>
): ChannelSource {
  if (!channelValue) return { kind: 'none' };

  const parsed = parseChannelValue(channelValue);
  if (!parsed) return { kind: 'none' };

  if ('buffer' in parsed) {
    return { kind: 'buffer', buffer: parsed.buffer, current: !!parsed.current };
  }
  if ('texture' in parsed) {
    const textureName = texturePathToName?.get(parsed.texture) || parsed.texture;
    return { kind: 'texture', name: textureName, cubemap: parsed.type === 'cubemap' };
  }
  if ('keyboard' in parsed) return { kind: 'keyboard' };
  if ('audio' in parsed) return { kind: 'audio' };
  if ('webcam' in parsed) return { kind: 'webcam' };
  if ('video' in parsed) return { kind: 'video', src: (parsed as any).video };
  if ('script' in parsed) return { kind: 'script', name: (parsed as any).script };

  return { kind: 'none' };
}

// =============================================================================
// Named Buffers Normalization (Standard Mode)
// =============================================================================

/**
 * Normalize buffers config: array shorthand to object form.
 */
function normalizeBuffersConfig(
  buffers: string[] | Record<string, StandardBufferConfig> | undefined
): Record<string, StandardBufferConfig> {
  if (!buffers) return {};
  if (Array.isArray(buffers)) {
    const result: Record<string, StandardBufferConfig> = {};
    for (const name of buffers) {
      result[name] = {};
    }
    return result;
  }
  return buffers;
}

// =============================================================================
// Title Helper
// =============================================================================

/**
 * Generate a display title from a demo path.
 * e.g. "./demos/my-shader" → "My Shader"
 */
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
  scriptFiles?: Record<string, () => Promise<any>>
): Promise<ShaderProject> {
  // Normalize path
  const normalizedPath = demoPath.startsWith('./') ? demoPath : `./${demoPath}`;
  const configPath = `${normalizedPath}/config.json`;
  const hasConfig = configPath in jsonFiles;

  if (!hasConfig) {
    // No config = simple single-pass project
    return loadSinglePass(normalizedPath, glslFiles, 'standard');
  }

  const config = await jsonFiles[configPath]();
  validateConfig(config as Record<string, any>, normalizedPath);
  const mode: 'shadertoy' | 'standard' = config.mode === 'shadertoy' ? 'shadertoy' : 'standard';

  // Load script hooks (available in both modes)
  const script = await loadScript(normalizedPath, scriptFiles);

  // Get uniforms (only from standard mode configs)
  const uniforms = mode === 'standard' && 'uniforms' in config ? config.uniforms : undefined;

  // Check if config uses named buffers or textures (standard mode only)
  const hasNamedBuffers = mode === 'standard' && (('buffers' in config && config.buffers) || ('textures' in config && config.textures));

  if (hasNamedBuffers) {
    return loadStandardWithNamedBuffers(
      normalizedPath, config as any, glslFiles, imageFiles, uniforms, script
    );
  }

  // Check for pass-level configs (Image, BufferA, etc.)
  const hasPassConfigs = config.Image || config.BufferA || config.BufferB ||
                         config.BufferC || config.BufferD;

  if (hasPassConfigs) {
    return loadWithPassConfigs(
      normalizedPath, config, glslFiles, imageFiles, mode, uniforms, script
    );
  }

  // Config with only settings (layout, controls, etc.) but no passes
  return loadSinglePass(normalizedPath, glslFiles, mode, config, uniforms, script);
}

// =============================================================================
// Single Pass (no pass configs in JSON)
// =============================================================================

async function loadSinglePass(
  demoPath: string,
  glslFiles: Record<string, () => Promise<string>>,
  mode: 'shadertoy' | 'standard',
  configOverrides?: Partial<ProjectConfig>,
  uniforms?: UniformDefinitions,
  script?: DemoScriptHooks | null
): Promise<ShaderProject> {
  const imagePath = `${demoPath}/image.glsl`;
  const actualImagePath = findFileCaseInsensitive(glslFiles, imagePath);

  if (!actualImagePath) {
    throw new Error(`Demo '${demoPath}' not found. Expected ${imagePath}`);
  }

  const imageSource = await glslFiles[actualImagePath]();
  const title = configOverrides?.title || titleFromPath(demoPath);

  return {
    mode,
    root: demoPath,
    meta: {
      title,
      author: configOverrides?.author || null,
      description: configOverrides?.description || null,
    },
    layout: configOverrides?.layout ?? DEFAULT_LAYOUT,
    theme: configOverrides?.theme ?? DEFAULT_THEME,
    controls: configOverrides?.controls ?? DEFAULT_CONTROLS,
    startPaused: configOverrides?.startPaused ?? false,
    pixelRatio: configOverrides?.pixelRatio ?? null,
    commonSource: null,
    passes: {
      Image: {
        name: 'Image',
        glslSource: imageSource,
        channels: [
          { kind: 'none' },
          { kind: 'none' },
          { kind: 'none' },
          { kind: 'none' },
        ],
      },
    },
    textures: [],
    uniforms: uniforms ?? {},
    script: script ?? null,
  };
}

// =============================================================================
// Pass-Config Mode (both shadertoy and standard with Image/BufferA/etc.)
// =============================================================================

async function loadWithPassConfigs(
  demoPath: string,
  config: ProjectConfig,
  glslFiles: Record<string, () => Promise<string>>,
  imageFiles: Record<string, () => Promise<string>>,
  mode: 'shadertoy' | 'standard',
  uniforms?: UniformDefinitions,
  script?: DemoScriptHooks | null
): Promise<ShaderProject> {

  const passConfigs = {
    Image: config.Image,
    BufferA: config.BufferA,
    BufferB: config.BufferB,
    BufferC: config.BufferC,
    BufferD: config.BufferD,
  };

  // Load common source
  const commonSource = await loadCommonSource(demoPath, glslFiles, config.common);

  // Collect texture references for deduplication
  interface TextureRef {
    path: string;
    filter: 'nearest' | 'linear';
    wrap: 'clamp' | 'repeat';
  }
  const textureRefs = new Map<string, TextureRef>();

  for (const passName of PASS_ORDER) {
    const passConfig = passConfigs[passName];
    if (!passConfig) continue;

    for (const channelKey of CHANNEL_KEYS) {
      const channelValue = passConfig[channelKey];
      if (!channelValue) continue;

      const parsed = parseChannelValue(channelValue);
      if (parsed && 'texture' in parsed) {
        if (!textureRefs.has(parsed.texture)) {
          textureRefs.set(parsed.texture, {
            path: parsed.texture,
            filter: parsed.filter ?? 'linear',
            wrap: parsed.wrap ?? 'repeat',
          });
        }
      }
    }
  }

  // Load textures
  const textures: ShaderTexture2D[] = [];
  const texturePathToName = new Map<string, string>();

  for (const [texturePath, ref] of textureRefs) {
    const fullPath = `${demoPath}/${texturePath.replace(/^\.\//, '')}`;
    const actualPath = findFileCaseInsensitive(imageFiles, fullPath);

    if (!actualPath) {
      throw new Error(`Texture not found: ${texturePath} (expected at ${fullPath})`);
    }

    const imageUrl = await imageFiles[actualPath]();
    const textureFilename = texturePath.split('/').pop()!;
    const textureName = textureFilename.replace(/\.[^.]+$/, '');

    textures.push({
      name: textureName,
      filename: textureFilename,
      source: imageUrl,
      filter: ref.filter,
      wrap: ref.wrap,
    });

    texturePathToName.set(texturePath, textureName);
  }

  // Build passes
  const passes: ShaderProject['passes'] = {} as any;

  for (const passName of PASS_ORDER) {
    const passConfig = passConfigs[passName];
    if (!passConfig) continue;

    const sourceFile = passConfig.source || defaultSourceForPass(passName);
    const sourcePath = `${demoPath}/${sourceFile}`;
    const actualSourcePath = findFileCaseInsensitive(glslFiles, sourcePath);

    if (!actualSourcePath) {
      throw new Error(`Missing shader file: ${sourcePath}`);
    }

    const glslSource = await glslFiles[actualSourcePath]();

    const channels: Channels = [
      normalizeChannel(passConfig.iChannel0, texturePathToName),
      normalizeChannel(passConfig.iChannel1, texturePathToName),
      normalizeChannel(passConfig.iChannel2, texturePathToName),
      normalizeChannel(passConfig.iChannel3, texturePathToName),
    ];

    passes[passName] = { name: passName, glslSource, channels };
  }

  if (!passes.Image) {
    throw new Error(`Demo '${demoPath}' must have an Image pass`);
  }

  const title = config.title || titleFromPath(demoPath);

  return {
    mode,
    root: demoPath,
    meta: {
      title,
      author: config.author || null,
      description: config.description || null,
    },
    layout: config.layout ?? DEFAULT_LAYOUT,
    theme: config.theme ?? DEFAULT_THEME,
    controls: config.controls ?? DEFAULT_CONTROLS,
    startPaused: config.startPaused ?? false,
    pixelRatio: config.pixelRatio ?? null,
    commonSource,
    passes,
    textures,
    uniforms: uniforms ?? {},
    script: script ?? null,
  };
}

// =============================================================================
// Standard Mode with Named Buffers
// =============================================================================

async function loadStandardWithNamedBuffers(
  demoPath: string,
  config: {
    title?: string;
    author?: string;
    description?: string;
    layout?: 'fullscreen' | 'default' | 'split' | 'tabbed';
    theme?: any;
    controls?: boolean;
    common?: string;
    startPaused?: boolean;
    pixelRatio?: number;
    buffers?: string[] | Record<string, StandardBufferConfig>;
    textures?: Record<string, string>;
  },
  glslFiles: Record<string, () => Promise<string>>,
  imageFiles: Record<string, () => Promise<string>>,
  uniforms?: UniformDefinitions,
  script?: DemoScriptHooks | null
): Promise<ShaderProject> {

  const buffersConfig = normalizeBuffersConfig(config.buffers);
  const bufferNames = Object.keys(buffersConfig);

  if (bufferNames.length > 4) {
    throw new Error(
      `Standard mode at '${demoPath}' supports max 4 buffers, got ${bufferNames.length}: ${bufferNames.join(', ')}`
    );
  }

  // Map buffer names → PassNames
  const bufferNameToPass = new Map<string, PassName>();
  for (let i = 0; i < bufferNames.length; i++) {
    bufferNameToPass.set(bufferNames[i], BUFFER_PASS_NAMES[i]);
  }

  // Texture deduplication
  const textureMap = new Map<string, ShaderTexture2D>();

  function registerTexture(source: string, filter: 'nearest' | 'linear' = 'linear', wrap: 'clamp' | 'repeat' = 'repeat'): string {
    const key = `${source}|${filter}|${wrap}`;
    const existing = textureMap.get(key);
    if (existing) return existing.name;

    const name = `tex${textureMap.size}`;
    textureMap.set(key, { name, source, filter, wrap });
    return name;
  }

  // Build namedSamplers map (shared by all passes)
  const namedSamplers = new Map<string, ChannelSource>();

  // Add buffers
  for (const [bufName, passName] of bufferNameToPass) {
    namedSamplers.set(bufName, { kind: 'buffer', buffer: passName, current: false });
  }

  // Add textures
  for (const [texName, texValue] of Object.entries(config.textures ?? {})) {
    if (texValue === 'keyboard') {
      namedSamplers.set(texName, { kind: 'keyboard' });
    } else if (texValue === 'audio') {
      namedSamplers.set(texName, { kind: 'audio' });
    } else if (texValue === 'webcam') {
      namedSamplers.set(texName, { kind: 'webcam' });
    } else if (/\.\w+$/.test(texValue)) {
      // Image file — resolve via imageFiles
      const fullPath = `${demoPath}/${texValue.replace(/^\.\//, '')}`;
      const actualPath = findFileCaseInsensitive(imageFiles, fullPath);
      if (!actualPath) {
        throw new Error(`Texture not found: ${texValue} (expected at ${fullPath})`);
      }
      const imageUrl = await imageFiles[actualPath]();
      const internalName = registerTexture(imageUrl);
      namedSamplers.set(texName, { kind: 'texture', name: internalName, cubemap: false });
    } else {
      // Script-uploaded texture — name matched by engine.updateTexture() calls
      namedSamplers.set(texName, { kind: 'script', name: texValue });
    }
  }

  const noChannels: Channels = [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }];

  // Load common source
  const commonSource = await loadCommonSource(demoPath, glslFiles, config.common);

  // Load Image pass
  const imagePath = `${demoPath}/image.glsl`;
  const actualImagePath = findFileCaseInsensitive(glslFiles, imagePath);
  if (!actualImagePath) {
    throw new Error(`Standard mode project at '${demoPath}' requires 'image.glsl'.`);
  }
  const imageSource = await glslFiles[actualImagePath]();

  const passes: ShaderProject['passes'] = {
    Image: {
      name: 'Image',
      glslSource: imageSource,
      channels: noChannels,
      namedSamplers: new Map(namedSamplers),
    },
  };

  // Load buffer passes
  for (const [bufName, passName] of bufferNameToPass) {
    const sourcePath = `${demoPath}/${bufName}.glsl`;
    const actualPath = findFileCaseInsensitive(glslFiles, sourcePath);
    if (!actualPath) {
      throw new Error(`Buffer '${bufName}' requires '${bufName}.glsl' in '${demoPath}'.`);
    }
    const glslSource = await glslFiles[actualPath]();

    passes[passName] = {
      name: passName,
      glslSource,
      channels: noChannels,
      namedSamplers: new Map(namedSamplers),
    };
  }

  const title = config.title || titleFromPath(demoPath);

  return {
    mode: 'standard',
    root: demoPath,
    meta: {
      title,
      author: config.author ?? null,
      description: config.description ?? null,
    },
    layout: config.layout ?? DEFAULT_LAYOUT,
    theme: config.theme ?? DEFAULT_THEME,
    controls: config.controls ?? DEFAULT_CONTROLS,
    startPaused: config.startPaused ?? false,
    pixelRatio: config.pixelRatio ?? null,
    commonSource,
    passes,
    textures: Array.from(textureMap.values()),
    uniforms: uniforms ?? {},
    script: script ?? null,
  };
}
