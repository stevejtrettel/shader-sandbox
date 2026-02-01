/**
 * Project Layer - Config Loader (Node/CLI)
 *
 * Loads shader projects from disk into normalized ShaderProject representation.
 * Handles both single-pass (no config) and multi-pass (with config) projects.
 *
 * Based on docs/project-spec.md
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  PassName,
  ChannelSource,
  Channels,
  ChannelJSONObject,
  ShadertoyConfig,
  StandardConfig,
  StandardBufferConfig,
  ShaderPass,
  ShaderProject,
  ShaderTexture2D,
  PassConfigSimplified,
  UniformDefinitions,
  isArrayUniform,
} from './types';
import {
  isPassName,
  parseChannelValue,
  defaultSourceForPass,
  CHANNEL_KEYS,
  BUFFER_PASS_NAMES,
  DEFAULT_LAYOUT,
  DEFAULT_CONTROLS,
  DEFAULT_THEME,
} from './configHelpers';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a file exists.
 */
async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * List all .glsl files in a directory.
 */
async function listGlslFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.glsl'))
    .map((e) => e.name);
}

/**
 * Check if project has a textures/ directory with files.
 */
async function hasTexturesDirWithFiles(root: string): Promise<boolean> {
  const dir = path.join(root, 'textures');
  if (!(await fileExists(dir))) return false;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.some((e) => e.isFile());
}

/**
 * Resolve common source from config or default common.glsl.
 */
async function resolveCommonSource(root: string, commonField?: string): Promise<string | null> {
  if (commonField) {
    const commonPath = path.join(root, commonField);
    if (!(await fileExists(commonPath))) {
      throw new Error(`Common GLSL file '${commonField}' not found in '${root}'.`);
    }
    return await fs.readFile(commonPath, 'utf8');
  }
  const defaultCommonPath = path.join(root, 'common.glsl');
  if (await fileExists(defaultCommonPath)) {
    return await fs.readFile(defaultCommonPath, 'utf8');
  }
  return null;
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Load a shader project from disk.
 *
 * Automatically detects:
 * - Single-pass mode (no config, just image.glsl)
 * - Multi-pass mode (config.json present)
 *
 * @param root - Absolute path to project directory
 * @returns Fully normalized ShaderProject
 * @throws Error with descriptive message if project is invalid
 */
export async function loadProject(root: string): Promise<ShaderProject> {
  const configPath = path.join(root, 'config.json');
  const hasConfig = await fileExists(configPath);

  if (hasConfig) {
    const raw = await fs.readFile(configPath, 'utf8');
    let config: any;
    try {
      config = JSON.parse(raw);
    } catch (err: any) {
      throw new Error(
        `Invalid JSON in config.json at '${root}': ${err?.message ?? String(err)}`
      );
    }
    if (config.mode === 'shadertoy') {
      return await loadShadertoyProject(root, config as ShadertoyConfig);
    }
    return await loadStandardProject(root, config as StandardConfig);
  } else {
    return await loadSinglePassProject(root);
  }
}

// =============================================================================
// Single-Pass Mode (No Config)
// =============================================================================

/**
 * Load a simple single-pass project.
 *
 * Requirements:
 * - Must have image.glsl
 * - Cannot have other .glsl files
 * - Cannot have textures/ directory
 * - No common.glsl allowed
 */
async function loadSinglePassProject(root: string): Promise<ShaderProject> {
  const imagePath = path.join(root, 'image.glsl');
  if (!(await fileExists(imagePath))) {
    throw new Error(`Single-pass project at '${root}' requires 'image.glsl'.`);
  }

  const glslFiles = await listGlslFiles(root);
  const extraGlsl = glslFiles.filter((name) => name !== 'image.glsl');
  if (extraGlsl.length > 0) {
    throw new Error(
      `Project at '${root}' contains multiple GLSL files (${glslFiles.join(
        ', '
      )}) but no 'config.json'. Add a config file to use multiple passes.`
    );
  }

  if (await hasTexturesDirWithFiles(root)) {
    throw new Error(
      `Project at '${root}' uses textures (in 'textures/' folder) but has no 'config.json'. Add a config file to define texture bindings.`
    );
  }

  const imageSource = await fs.readFile(imagePath, 'utf8');
  const title = path.basename(root);

  return {
    mode: 'standard',
    root,
    meta: { title, author: null, description: null },
    layout: DEFAULT_LAYOUT,
    theme: DEFAULT_THEME,
    controls: DEFAULT_CONTROLS,
    startPaused: false,
    pixelRatio: null,
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
        ] as Channels,
      },
    },
    textures: [],
    uniforms: {},
    script: null,
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

function validateUniforms(uniforms: UniformDefinitions, root: string): void {
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

    if (!SCALAR_TYPES.has(def.type)) {
      throw new Error(`${prefix}: invalid type '${def.type}'. Expected one of: ${[...SCALAR_TYPES].join(', ')}`);
    }

    switch (def.type) {
      case 'float':
      case 'int':
        if (typeof def.value !== 'number') {
          throw new Error(`${prefix}: 'value' must be a number for type '${def.type}', got ${typeof def.value}`);
        }
        if (def.min !== undefined && typeof def.min !== 'number') {
          throw new Error(`${prefix}: 'min' must be a number`);
        }
        if (def.max !== undefined && typeof def.max !== 'number') {
          throw new Error(`${prefix}: 'max' must be a number`);
        }
        if (def.step !== undefined && typeof def.step !== 'number') {
          throw new Error(`${prefix}: 'step' must be a number`);
        }
        break;

      case 'bool':
        if (typeof def.value !== 'boolean') {
          throw new Error(`${prefix}: 'value' must be a boolean for type 'bool', got ${typeof def.value}`);
        }
        break;

      case 'vec2':
      case 'vec3':
      case 'vec4': {
        const n = COMPONENT_COUNTS[def.type];
        if (!Array.isArray(def.value) || def.value.length !== n) {
          throw new Error(`${prefix}: 'value' must be an array of ${n} numbers for type '${def.type}'`);
        }
        if (def.value.some((v: any) => typeof v !== 'number')) {
          throw new Error(`${prefix}: all components of 'value' must be numbers`);
        }
        const vecDef = def as { min?: number[]; max?: number[]; step?: number[] };
        for (const field of ['min', 'max', 'step'] as const) {
          const arr = vecDef[field];
          if (arr !== undefined) {
            if (!Array.isArray(arr) || arr.length !== n) {
              throw new Error(`${prefix}: '${field}' must be an array of ${n} numbers for type '${def.type}'`);
            }
          }
        }
        break;
      }
    }
  }
}

// =============================================================================
// Shadertoy Mode (iChannel-based)
// =============================================================================

async function loadShadertoyProject(root: string, config: ShadertoyConfig): Promise<ShaderProject> {
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

  const commonSource = await resolveCommonSource(root, config.common);

  // Texture deduplication
  const textureMap = new Map<string, ShaderTexture2D>();

  function registerTexture(j: { texture: string; filter?: 'nearest' | 'linear'; wrap?: 'clamp' | 'repeat' }): string {
    const filter = j.filter ?? 'linear';
    const wrap = j.wrap ?? 'repeat';
    const key = `${j.texture}|${filter}|${wrap}`;

    const existing = textureMap.get(key);
    if (existing) return existing.name;

    const name = `tex${textureMap.size}`;
    textureMap.set(key, { name, source: j.texture, filter, wrap });
    return name;
  }

  function parseChannelObject(value: ChannelJSONObject, passName: PassName, channelKey: string): ChannelSource {
    if ('buffer' in value) {
      const buf = value.buffer;
      if (!isPassName(buf)) {
        throw new Error(`Invalid buffer name '${buf}' for ${channelKey} in pass '${passName}' at '${root}'.`);
      }
      return { kind: 'buffer', buffer: buf, current: !!value.current };
    }
    if ('texture' in value) {
      return { kind: 'texture', name: registerTexture(value), cubemap: value.type === 'cubemap' };
    }
    if ('keyboard' in value) return { kind: 'keyboard' };
    if ('audio' in value) return { kind: 'audio' };
    if ('webcam' in value) return { kind: 'webcam' };
    if ('video' in value) return { kind: 'video', src: value.video };
    if ('script' in value) return { kind: 'script', name: value.script };

    throw new Error(`Invalid channel object for ${channelKey} in pass '${passName}' at '${root}'.`);
  }

  async function loadPass(
    name: PassName,
    passConfig: PassConfigSimplified | undefined
  ): Promise<ShaderPass | undefined> {
    if (!passConfig) return undefined;

    const sourceRel = passConfig.source ?? defaultSourceForPass(name);
    const sourcePath = path.join(root, sourceRel);

    if (!(await fileExists(sourcePath))) {
      throw new Error(`Source GLSL file for pass '${name}' not found at '${sourceRel}' in '${root}'.`);
    }

    const glslSource = await fs.readFile(sourcePath, 'utf8');

    const channelSources: ChannelSource[] = [];
    for (const key of CHANNEL_KEYS) {
      const rawValue = passConfig[key];
      if (!rawValue) {
        channelSources.push({ kind: 'none' });
        continue;
      }
      const parsed = parseChannelValue(rawValue);
      if (!parsed) {
        channelSources.push({ kind: 'none' });
        continue;
      }
      channelSources.push(parseChannelObject(parsed, name, key));
    }

    return { name, glslSource, channels: channelSources as Channels };
  }

  const imagePass = await loadPass('Image', passConfigs.Image);
  const bufferAPass = await loadPass('BufferA', passConfigs.BufferA);
  const bufferBPass = await loadPass('BufferB', passConfigs.BufferB);
  const bufferCPass = await loadPass('BufferC', passConfigs.BufferC);
  const bufferDPass = await loadPass('BufferD', passConfigs.BufferD);

  if (!imagePass && (bufferAPass || bufferBPass || bufferCPass || bufferDPass)) {
    throw new Error(`config.json at '${root}' has buffers but no Image pass.`);
  }
  if (!imagePass) {
    throw new Error(`config.json at '${root}' must define an Image pass.`);
  }

  const title = config.title ?? path.basename(root);

  return {
    mode: 'shadertoy',
    root,
    meta: { title, author: config.author ?? null, description: config.description ?? null },
    layout: config.layout ?? DEFAULT_LAYOUT,
    theme: config.theme ?? DEFAULT_THEME,
    controls: config.controls ?? DEFAULT_CONTROLS,
    startPaused: config.startPaused ?? false,
    pixelRatio: config.pixelRatio ?? null,
    commonSource,
    passes: {
      Image: imagePass,
      BufferA: bufferAPass,
      BufferB: bufferBPass,
      BufferC: bufferCPass,
      BufferD: bufferDPass,
    },
    textures: Array.from(textureMap.values()),
    uniforms: {},
    script: null,
  };
}

// =============================================================================
// Standard Mode
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

/**
 * Load a standard mode project.
 * Supports both named buffers and pass-level configs (Image/BufferA/etc.).
 */
async function loadStandardProject(root: string, config: StandardConfig): Promise<ShaderProject> {
  // Validate uniforms early
  if (config.uniforms) {
    validateUniforms(config.uniforms, root);
  }

  const commonSource = await resolveCommonSource(root, config.common);

  // Check if using named buffers or pass-level configs
  const hasNamedBuffers = config.buffers && Object.keys(normalizeBuffersConfig(config.buffers)).length > 0;
  const hasPassConfigs = config.Image || config.BufferA || config.BufferB ||
                         config.BufferC || config.BufferD;

  if (hasNamedBuffers && hasPassConfigs) {
    throw new Error(
      `Standard mode at '${root}' cannot use both named 'buffers' and pass-level configs (Image/BufferA/etc.). Choose one approach.`
    );
  }

  if (hasNamedBuffers) {
    return loadStandardWithNamedBuffers(root, config, commonSource);
  }

  if (hasPassConfigs) {
    return loadStandardWithPassConfigs(root, config, commonSource);
  }

  // Simple single-pass standard project (config with settings only)
  const imagePath = path.join(root, 'image.glsl');
  if (!(await fileExists(imagePath))) {
    throw new Error(`Standard mode project at '${root}' requires 'image.glsl'.`);
  }
  const imageSource = await fs.readFile(imagePath, 'utf8');
  const title = config.title ?? path.basename(root);

  return {
    mode: 'standard',
    root,
    meta: { title, author: config.author ?? null, description: config.description ?? null },
    layout: config.layout ?? DEFAULT_LAYOUT,
    theme: config.theme ?? DEFAULT_THEME,
    controls: config.controls ?? DEFAULT_CONTROLS,
    startPaused: config.startPaused ?? false,
    pixelRatio: config.pixelRatio ?? null,
    commonSource,
    passes: {
      Image: {
        name: 'Image',
        glslSource: imageSource,
        channels: [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }] as Channels,
      },
    },
    textures: [],
    uniforms: config.uniforms ?? {},
    script: null,
  };
}

/**
 * Standard mode with pass-level configs (Image, BufferA, etc.) + uniforms.
 * Reuses the same iChannel mechanism as shadertoy mode but sets mode to 'standard'.
 */
async function loadStandardWithPassConfigs(
  root: string,
  config: StandardConfig,
  commonSource: string | null
): Promise<ShaderProject> {
  const passConfigs = {
    Image: config.Image,
    BufferA: config.BufferA,
    BufferB: config.BufferB,
    BufferC: config.BufferC,
    BufferD: config.BufferD,
  };

  // Texture deduplication
  const textureMap = new Map<string, ShaderTexture2D>();

  function registerTexture(j: { texture: string; filter?: 'nearest' | 'linear'; wrap?: 'clamp' | 'repeat' }): string {
    const filter = j.filter ?? 'linear';
    const wrap = j.wrap ?? 'repeat';
    const key = `${j.texture}|${filter}|${wrap}`;
    const existing = textureMap.get(key);
    if (existing) return existing.name;
    const name = `tex${textureMap.size}`;
    textureMap.set(key, { name, source: j.texture, filter, wrap });
    return name;
  }

  function parseChannelObject(value: ChannelJSONObject, passName: PassName, channelKey: string): ChannelSource {
    if ('buffer' in value) {
      if (!isPassName(value.buffer)) {
        throw new Error(`Invalid buffer name '${value.buffer}' for ${channelKey} in pass '${passName}' at '${root}'.`);
      }
      return { kind: 'buffer', buffer: value.buffer, current: !!value.current };
    }
    if ('texture' in value) {
      return { kind: 'texture', name: registerTexture(value), cubemap: value.type === 'cubemap' };
    }
    if ('keyboard' in value) return { kind: 'keyboard' };
    if ('audio' in value) return { kind: 'audio' };
    if ('webcam' in value) return { kind: 'webcam' };
    if ('video' in value) return { kind: 'video', src: value.video };
    if ('script' in value) return { kind: 'script', name: value.script };
    throw new Error(`Invalid channel object for ${channelKey} in pass '${passName}' at '${root}'.`);
  }

  async function loadPass(
    name: PassName,
    passConfig: PassConfigSimplified | undefined
  ): Promise<ShaderPass | undefined> {
    if (!passConfig) return undefined;

    const sourceRel = passConfig.source ?? defaultSourceForPass(name);
    const sourcePath = path.join(root, sourceRel);
    if (!(await fileExists(sourcePath))) {
      throw new Error(`Source GLSL file for pass '${name}' not found at '${sourceRel}' in '${root}'.`);
    }

    const glslSource = await fs.readFile(sourcePath, 'utf8');
    const channelSources: ChannelSource[] = [];
    for (const key of CHANNEL_KEYS) {
      const rawValue = passConfig[key];
      if (!rawValue) { channelSources.push({ kind: 'none' }); continue; }
      const parsed = parseChannelValue(rawValue);
      if (!parsed) { channelSources.push({ kind: 'none' }); continue; }
      channelSources.push(parseChannelObject(parsed, name, key));
    }
    return { name, glslSource, channels: channelSources as Channels };
  }

  const imagePass = await loadPass('Image', passConfigs.Image);
  const bufferAPass = await loadPass('BufferA', passConfigs.BufferA);
  const bufferBPass = await loadPass('BufferB', passConfigs.BufferB);
  const bufferCPass = await loadPass('BufferC', passConfigs.BufferC);
  const bufferDPass = await loadPass('BufferD', passConfigs.BufferD);

  if (!imagePass && (bufferAPass || bufferBPass || bufferCPass || bufferDPass)) {
    throw new Error(`config.json at '${root}' has buffers but no Image pass.`);
  }
  if (!imagePass) {
    throw new Error(`config.json at '${root}' must define an Image pass.`);
  }

  const title = config.title ?? path.basename(root);

  return {
    mode: 'standard',
    root,
    meta: { title, author: config.author ?? null, description: config.description ?? null },
    layout: config.layout ?? DEFAULT_LAYOUT,
    theme: config.theme ?? DEFAULT_THEME,
    controls: config.controls ?? DEFAULT_CONTROLS,
    startPaused: config.startPaused ?? false,
    pixelRatio: config.pixelRatio ?? null,
    commonSource,
    passes: {
      Image: imagePass,
      BufferA: bufferAPass,
      BufferB: bufferBPass,
      BufferC: bufferCPass,
      BufferD: bufferDPass,
    },
    textures: Array.from(textureMap.values()),
    uniforms: config.uniforms ?? {},
    script: null,
  };
}

/**
 * Standard mode with named buffers and textures.
 */
async function loadStandardWithNamedBuffers(
  root: string,
  config: StandardConfig,
  commonSource: string | null
): Promise<ShaderProject> {
  const buffersConfig = normalizeBuffersConfig(config.buffers);
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

  // Build namedSamplers
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
    } else {
      const internalName = registerTexture(texValue);
      namedSamplers.set(texName, { kind: 'texture', name: internalName, cubemap: false });
    }
  }

  const noChannels: Channels = [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }];

  // Load Image pass
  const imagePath = path.join(root, 'image.glsl');
  if (!(await fileExists(imagePath))) {
    throw new Error(`Standard mode project at '${root}' requires 'image.glsl'.`);
  }
  const imageSource = await fs.readFile(imagePath, 'utf8');

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
    const sourcePath = path.join(root, `${bufName}.glsl`);
    if (!(await fileExists(sourcePath))) {
      throw new Error(`Buffer '${bufName}' requires '${bufName}.glsl' in '${root}'.`);
    }
    const glslSource = await fs.readFile(sourcePath, 'utf8');

    passes[passName] = {
      name: passName,
      glslSource,
      channels: noChannels,
      namedSamplers: new Map(namedSamplers),
    };
  }

  const title = config.title ?? path.basename(root);

  return {
    mode: 'standard',
    root,
    meta: { title, author: config.author ?? null, description: config.description ?? null },
    layout: config.layout ?? DEFAULT_LAYOUT,
    theme: config.theme ?? DEFAULT_THEME,
    controls: config.controls ?? DEFAULT_CONTROLS,
    startPaused: config.startPaused ?? false,
    pixelRatio: config.pixelRatio ?? null,
    commonSource,
    passes,
    textures: Array.from(textureMap.values()),
    uniforms: config.uniforms ?? {},
    script: null,
  };
}
