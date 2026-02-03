/**
 * Core project loading logic shared between Node (loadProject.ts) and
 * browser (loaderHelper.ts) environments.
 *
 * All file I/O goes through the FileLoader interface, so this module
 * has no direct dependency on Node's fs or Vite's import.meta.glob.
 */

import type { FileLoader } from './FileLoader';
import {
  PassName,
  ChannelSource,
  Channels,
  ChannelJSONObject,
  ShadertoyConfig,
  StandardConfig,
  ShaderProject,
  ShaderTexture2D,
  UniformDefinitions,
  DemoScriptHooks,
  isArrayUniform,
} from './types';
import {
  isPassName,
  parseChannelValue,
  defaultSourceForPass,
  validateConfig,
  PASS_ORDER,
  CHANNEL_KEYS,
  BUFFER_PASS_NAMES,
  DEFAULT_LAYOUT,
  DEFAULT_CONTROLS,
  DEFAULT_THEME,
} from './configHelpers';

// =============================================================================
// ShaderProject Factory
// =============================================================================

export interface ShaderProjectInput {
  mode: 'shadertoy' | 'standard';
  root: string;
  title?: string;
  author?: string;
  description?: string;
  layout?: 'fullscreen' | 'default' | 'split' | 'tabbed';
  theme?: 'light' | 'dark' | 'system';
  controls?: boolean;
  startPaused?: boolean;
  pixelRatio?: number;
  commonSource: string | null;
  passes: ShaderProject['passes'];
  textures?: ShaderTexture2D[];
  uniforms?: UniformDefinitions;
  script?: DemoScriptHooks | null;
}

/**
 * Build a ShaderProject with sensible defaults.
 * Eliminates the 8+ repeated object literals across loaders.
 */
export function buildShaderProject(input: ShaderProjectInput): ShaderProject {
  return {
    mode: input.mode,
    root: input.root,
    meta: {
      title: input.title ?? input.root.split('/').pop() ?? 'Untitled',
      author: input.author ?? null,
      description: input.description ?? null,
    },
    layout: input.layout ?? DEFAULT_LAYOUT,
    theme: input.theme ?? DEFAULT_THEME,
    controls: input.controls ?? DEFAULT_CONTROLS,
    startPaused: input.startPaused ?? false,
    pixelRatio: input.pixelRatio ?? null,
    commonSource: input.commonSource,
    passes: input.passes,
    textures: input.textures ?? [],
    uniforms: input.uniforms ?? {},
    script: input.script ?? null,
  };
}

// =============================================================================
// Uniform Validation
// =============================================================================

const SCALAR_TYPES = new Set(['float', 'int', 'bool', 'vec2', 'vec3', 'vec4']);
const ARRAY_TYPES = new Set(['float', 'vec2', 'vec3', 'vec4', 'mat3', 'mat4']);
const COMPONENT_COUNTS: Record<string, number> = {
  vec2: 2, vec3: 3, vec4: 4,
};

export function validateUniforms(uniforms: UniformDefinitions, root: string): void {
  for (const [name, def] of Object.entries(uniforms)) {
    const prefix = `Uniform '${name}' in '${root}'`;

    if (!def.type) {
      throw new Error(`${prefix}: missing 'type' field`);
    }

    if (isArrayUniform(def)) {
      if (!ARRAY_TYPES.has(def.type)) {
        throw new Error(`${prefix}: invalid array type '${def.type}'. Expected one of: ${[...ARRAY_TYPES].join(', ')}`);
      }
      if (typeof def.count !== 'number' || def.count < 1 || !Number.isInteger(def.count)) {
        throw new Error(`${prefix}: 'count' must be a positive integer, got ${def.count}`);
      }
      continue;
    }

    // After excluding array uniforms, treat as a scalar definition.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scalarDef = def as any;

    if (!SCALAR_TYPES.has(scalarDef.type)) {
      throw new Error(`${prefix}: invalid type '${scalarDef.type}'. Expected one of: ${[...SCALAR_TYPES].join(', ')}`);
    }

    switch (scalarDef.type) {
      case 'float':
      case 'int':
        if (typeof scalarDef.value !== 'number') {
          throw new Error(`${prefix}: 'value' must be a number for type '${scalarDef.type}', got ${typeof scalarDef.value}`);
        }
        if (scalarDef.min !== undefined && typeof scalarDef.min !== 'number') {
          throw new Error(`${prefix}: 'min' must be a number`);
        }
        if (scalarDef.max !== undefined && typeof scalarDef.max !== 'number') {
          throw new Error(`${prefix}: 'max' must be a number`);
        }
        if (scalarDef.step !== undefined && typeof scalarDef.step !== 'number') {
          throw new Error(`${prefix}: 'step' must be a number`);
        }
        break;

      case 'bool':
        if (typeof scalarDef.value !== 'boolean') {
          throw new Error(`${prefix}: 'value' must be a boolean for type 'bool', got ${typeof scalarDef.value}`);
        }
        break;

      case 'vec2':
      case 'vec3':
      case 'vec4': {
        const n = COMPONENT_COUNTS[scalarDef.type];
        if (!Array.isArray(scalarDef.value) || scalarDef.value.length !== n) {
          throw new Error(`${prefix}: 'value' must be an array of ${n} numbers for type '${scalarDef.type}'`);
        }
        if (scalarDef.value.some((v: any) => typeof v !== 'number')) {
          throw new Error(`${prefix}: all components of 'value' must be numbers`);
        }
        const vecDef = scalarDef as { min?: number[]; max?: number[]; step?: number[] };
        for (const field of ['min', 'max', 'step'] as const) {
          const arr = vecDef[field];
          if (arr !== undefined) {
            if (!Array.isArray(arr) || arr.length !== n) {
              throw new Error(`${prefix}: '${field}' must be an array of ${n} numbers for type '${scalarDef.type}'`);
            }
          }
        }
        break;
      }
    }
  }
}

// =============================================================================
// Common Source Resolution
// =============================================================================

export async function resolveCommonSource(
  loader: FileLoader,
  root: string,
  commonField?: string,
): Promise<string | null> {
  if (commonField) {
    const commonPath = loader.joinPath(root, commonField);
    if (!(await loader.exists(commonPath))) {
      throw new Error(`Common GLSL file '${commonField}' not found in '${root}'.`);
    }
    return await loader.readText(commonPath);
  }
  const defaultCommonPath = loader.joinPath(root, 'common.glsl');
  if (await loader.exists(defaultCommonPath)) {
    return await loader.readText(defaultCommonPath);
  }
  return null;
}

// =============================================================================
// Texture Deduplication Helper
// =============================================================================

class TextureRegistry {
  private map = new Map<string, ShaderTexture2D>();

  register(source: string, filter: 'nearest' | 'linear' = 'linear', wrap: 'clamp' | 'repeat' = 'repeat', filename?: string): string {
    const key = `${source}|${filter}|${wrap}`;
    const existing = this.map.get(key);
    if (existing) return existing.name;

    const name = `tex${this.map.size}`;
    this.map.set(key, { name, filename, source, filter, wrap });
    return name;
  }

  toArray(): ShaderTexture2D[] {
    return Array.from(this.map.values());
  }
}

// =============================================================================
// Channel Parsing (Shadertoy mode)
// =============================================================================

function parseChannelObject(
  value: ChannelJSONObject,
  passName: PassName,
  channelKey: string,
  root: string,
  textureRegistry: TextureRegistry,
  texturePathToName?: Map<string, string>,
): ChannelSource {
  if ('buffer' in value) {
    const buf = value.buffer;
    if (!isPassName(buf)) {
      throw new Error(`Invalid buffer name '${buf}' for ${channelKey} in pass '${passName}' at '${root}'.`);
    }
    return { kind: 'buffer', buffer: buf, current: !!value.current };
  }
  if ('texture' in value) {
    const name = texturePathToName?.get(value.texture)
      ?? textureRegistry.register(value.texture, value.filter, value.wrap);
    return { kind: 'texture', name, cubemap: value.type === 'cubemap' };
  }
  if ('keyboard' in value) return { kind: 'keyboard' };
  if ('audio' in value) return { kind: 'audio' };
  if ('webcam' in value) return { kind: 'webcam' };
  if ('video' in value) return { kind: 'video', src: value.video };
  if ('script' in value) return { kind: 'script', name: value.script };

  throw new Error(`Invalid channel object for ${channelKey} in pass '${passName}' at '${root}'.`);
}

function normalizeChannel(
  channelValue: any,
  passName: PassName,
  channelKey: string,
  root: string,
  textureRegistry: TextureRegistry,
  texturePathToName?: Map<string, string>,
): ChannelSource {
  if (!channelValue) return { kind: 'none' };
  const parsed = parseChannelValue(channelValue);
  if (!parsed) return { kind: 'none' };
  return parseChannelObject(parsed, passName, channelKey, root, textureRegistry, texturePathToName);
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Load a shader project using the provided FileLoader.
 * Handles all three project shapes: single-pass, shadertoy, and standard.
 */
export async function loadProjectFromFiles(
  loader: FileLoader,
  root: string,
  opts?: {
    /** Pre-parsed config (browser loader pre-loads JSON). If absent, reads config.json from disk. */
    config?: any;
    /** Pre-loaded script hooks (browser loader pre-imports script.js). */
    script?: DemoScriptHooks | null;
    /** Pre-resolved texture path → URL map (browser loader resolves via Vite). */
    textureUrlResolver?: (path: string) => Promise<string>;
  },
): Promise<ShaderProject> {
  let config = opts?.config;

  // If no pre-parsed config, try reading config.json
  if (config === undefined) {
    const configPath = loader.joinPath(root, 'config.json');
    if (await loader.exists(configPath)) {
      const raw = await loader.readText(configPath);
      try {
        config = JSON.parse(raw);
      } catch (err: any) {
        throw new Error(`Invalid JSON in config.json at '${root}': ${err?.message ?? String(err)}`);
      }
    }
  }

  if (config) {
    validateConfig(config, root);

    if (config.mode === 'shadertoy') {
      return loadShadertoyProject(loader, root, config as ShadertoyConfig, opts);
    }
    return loadStandardProject(loader, root, config as StandardConfig, opts);
  }

  // No config → single-pass project
  return loadSinglePassProject(loader, root, opts);
}

// =============================================================================
// Single-Pass Mode
// =============================================================================

async function loadSinglePassProject(
  loader: FileLoader,
  root: string,
  opts?: { script?: DemoScriptHooks | null },
): Promise<ShaderProject> {
  const imagePath = loader.joinPath(root, 'image.glsl');
  if (!(await loader.exists(imagePath))) {
    throw new Error(`Single-pass project at '${root}' requires 'image.glsl'.`);
  }

  // Only validate extra files if we can list them (Node loader)
  const glslFiles = await loader.listGlslFiles(root);
  if (glslFiles.length > 0) {
    const extraGlsl = glslFiles.filter((name) => name !== 'image.glsl');
    if (extraGlsl.length > 0) {
      throw new Error(
        `Project at '${root}' contains multiple GLSL files (${glslFiles.join(', ')}) but no 'config.json'. Add a config file to use multiple passes.`
      );
    }
  }

  const hasTexDir = await loader.hasFiles(loader.joinPath(root, 'textures'));
  if (hasTexDir) {
    throw new Error(
      `Project at '${root}' uses textures (in 'textures/' folder) but has no 'config.json'. Add a config file to define texture bindings.`
    );
  }

  const imageSource = await loader.readText(imagePath);

  const noChannels: Channels = [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }];

  return buildShaderProject({
    mode: 'standard',
    root,
    commonSource: null,
    passes: {
      Image: { name: 'Image', glslSource: imageSource, channels: noChannels },
    },
    script: opts?.script,
  });
}

// =============================================================================
// Shadertoy Mode
// =============================================================================

async function loadShadertoyProject(
  loader: FileLoader,
  root: string,
  config: ShadertoyConfig,
  opts?: {
    script?: DemoScriptHooks | null;
    textureUrlResolver?: (path: string) => Promise<string>;
  },
): Promise<ShaderProject> {
  const passConfigs = {
    Image: config.Image,
    BufferA: config.BufferA,
    BufferB: config.BufferB,
    BufferC: config.BufferC,
    BufferD: config.BufferD,
  };

  const hasAnyPass = passConfigs.Image || passConfigs.BufferA || passConfigs.BufferB ||
                     passConfigs.BufferC || passConfigs.BufferD;
  if (!hasAnyPass) {
    passConfigs.Image = {};
  }

  const commonSource = await resolveCommonSource(loader, root, config.common);
  const textureRegistry = new TextureRegistry();

  // Pre-resolve texture paths → URLs (browser needs Vite resolution)
  const texturePathToName = new Map<string, string>();
  if (opts?.textureUrlResolver) {
    for (const passName of PASS_ORDER) {
      const passConfig = passConfigs[passName];
      if (!passConfig) continue;
      for (const channelKey of CHANNEL_KEYS) {
        const channelValue = passConfig[channelKey];
        if (!channelValue) continue;
        const parsed = parseChannelValue(channelValue);
        if (parsed && 'texture' in parsed) {
          if (!texturePathToName.has(parsed.texture)) {
            const url = await opts.textureUrlResolver(parsed.texture);
            const filename = parsed.texture.split('/').pop()!;
            const texName = textureRegistry.register(url, parsed.filter, parsed.wrap, filename);
            texturePathToName.set(parsed.texture, texName);
          }
        }
      }
    }
  }

  // Load passes
  const passes: ShaderProject['passes'] = {} as any;

  for (const passName of PASS_ORDER) {
    const passConfig = passConfigs[passName];
    if (!passConfig) continue;

    const sourceRel = passConfig.source ?? defaultSourceForPass(passName);
    const sourcePath = loader.joinPath(root, sourceRel);

    if (!(await loader.exists(sourcePath))) {
      throw new Error(`Source GLSL file for pass '${passName}' not found at '${sourceRel}' in '${root}'.`);
    }

    const glslSource = await loader.readText(sourcePath);

    const channels: Channels = [
      normalizeChannel(passConfig.iChannel0, passName, 'iChannel0', root, textureRegistry, texturePathToName),
      normalizeChannel(passConfig.iChannel1, passName, 'iChannel1', root, textureRegistry, texturePathToName),
      normalizeChannel(passConfig.iChannel2, passName, 'iChannel2', root, textureRegistry, texturePathToName),
      normalizeChannel(passConfig.iChannel3, passName, 'iChannel3', root, textureRegistry, texturePathToName),
    ];

    passes[passName] = { name: passName, glslSource, channels };
  }

  if (!passes.Image) {
    throw new Error(`config.json at '${root}' must define an Image pass.`);
  }

  return buildShaderProject({
    mode: 'shadertoy',
    root,
    title: config.title,
    author: config.author,
    description: config.description,
    layout: config.layout,
    theme: config.theme,
    controls: config.controls,
    startPaused: config.startPaused,
    pixelRatio: config.pixelRatio,
    commonSource,
    passes,
    textures: textureRegistry.toArray(),
    script: opts?.script,
  });
}

// =============================================================================
// Standard Mode
// =============================================================================

async function loadStandardProject(
  loader: FileLoader,
  root: string,
  config: StandardConfig,
  opts?: {
    script?: DemoScriptHooks | null;
    textureUrlResolver?: (path: string) => Promise<string>;
  },
): Promise<ShaderProject> {
  if (config.uniforms) {
    validateUniforms(config.uniforms, root);
  }

  const commonSource = await resolveCommonSource(loader, root, config.common);

  const buffersConfig = config.buffers ?? {};
  if (Object.keys(buffersConfig).length > 0 || (config.textures && Object.keys(config.textures).length > 0)) {
    return loadStandardWithNamedBuffers(loader, root, config, commonSource, opts);
  }

  // Simple single-pass standard project (config with settings only)
  const imagePath = loader.joinPath(root, 'image.glsl');
  if (!(await loader.exists(imagePath))) {
    throw new Error(`Standard mode project at '${root}' requires 'image.glsl'.`);
  }
  const imageSource = await loader.readText(imagePath);

  const noChannels: Channels = [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }];

  return buildShaderProject({
    mode: 'standard',
    root,
    title: config.title,
    author: config.author,
    description: config.description,
    layout: config.layout,
    theme: config.theme,
    controls: config.controls,
    startPaused: config.startPaused,
    pixelRatio: config.pixelRatio,
    commonSource,
    passes: {
      Image: { name: 'Image', glslSource: imageSource, channels: noChannels },
    },
    uniforms: config.uniforms,
    script: opts?.script,
  });
}

// =============================================================================
// Standard Mode with Named Buffers
// =============================================================================

const SPECIAL_TEXTURE_SOURCES = new Set(['keyboard', 'audio', 'webcam']);

async function loadStandardWithNamedBuffers(
  loader: FileLoader,
  root: string,
  config: StandardConfig,
  commonSource: string | null,
  opts?: {
    script?: DemoScriptHooks | null;
    textureUrlResolver?: (path: string) => Promise<string>;
  },
): Promise<ShaderProject> {
  const buffersConfig = config.buffers ?? {};
  const bufferNames = Object.keys(buffersConfig);

  if (bufferNames.length > 4) {
    throw new Error(
      `Standard mode at '${root}' supports max 4 buffers, got ${bufferNames.length}: ${bufferNames.join(', ')}`
    );
  }

  const bufferNameToPass = new Map<string, PassName>();
  for (let i = 0; i < bufferNames.length; i++) {
    bufferNameToPass.set(bufferNames[i], BUFFER_PASS_NAMES[i]);
  }

  const textureRegistry = new TextureRegistry();

  // Build namedSamplers map (shared by all passes)
  const namedSamplers = new Map<string, ChannelSource>();

  for (const [bufName, passName] of bufferNameToPass) {
    namedSamplers.set(bufName, { kind: 'buffer', buffer: passName, current: false });
  }

  for (const [texName, texValue] of Object.entries(config.textures ?? {})) {
    if (texValue === 'keyboard') {
      namedSamplers.set(texName, { kind: 'keyboard' });
    } else if (texValue === 'audio') {
      namedSamplers.set(texName, { kind: 'audio' });
    } else if (texValue === 'webcam') {
      namedSamplers.set(texName, { kind: 'webcam' });
    } else if (/\.\w+$/.test(texValue)) {
      // Image file
      let source: string;
      if (opts?.textureUrlResolver) {
        source = await opts.textureUrlResolver(texValue);
      } else {
        source = texValue;
      }
      const internalName = textureRegistry.register(source);
      namedSamplers.set(texName, { kind: 'texture', name: internalName, cubemap: false });
    } else if (!SPECIAL_TEXTURE_SOURCES.has(texValue)) {
      // Script-uploaded texture
      namedSamplers.set(texName, { kind: 'script', name: texValue });
    }
  }

  const noChannels: Channels = [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }];

  // Load Image pass
  const imagePath = loader.joinPath(root, 'image.glsl');
  if (!(await loader.exists(imagePath))) {
    throw new Error(`Standard mode project at '${root}' requires 'image.glsl'.`);
  }
  const imageSource = await loader.readText(imagePath);

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
    const sourcePath = loader.joinPath(root, `${bufName}.glsl`);
    if (!(await loader.exists(sourcePath))) {
      throw new Error(`Buffer '${bufName}' requires '${bufName}.glsl' in '${root}'.`);
    }
    const glslSource = await loader.readText(sourcePath);

    passes[passName] = {
      name: passName,
      glslSource,
      channels: noChannels,
      namedSamplers: new Map(namedSamplers),
    };
  }

  return buildShaderProject({
    mode: 'standard',
    root,
    title: config.title,
    author: config.author,
    description: config.description,
    layout: config.layout,
    theme: config.theme,
    controls: config.controls,
    startPaused: config.startPaused,
    pixelRatio: config.pixelRatio,
    commonSource,
    passes,
    textures: textureRegistry.toArray(),
    uniforms: config.uniforms,
    script: opts?.script,
  });
}
