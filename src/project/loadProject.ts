/**
 * Project Layer - Config Loader
 *
 * Loads Shadertoy projects from disk into normalized ShaderProject representation.
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
  ChannelValue,
  ChannelJSONObject,
  ShadertoyConfig,
  StandardConfig,
  StandardBufferConfig,
  ShaderPass,
  ShaderProject,
  ShaderTexture2D,
  PassConfigSimplified,
  UniformDefinitions,
  UniformDefinition,
  isArrayUniform,
} from './types';

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
 * Type guard for PassName.
 */
function isPassName(s: string): s is PassName {
  return s === 'Image' || s === 'BufferA' || s === 'BufferB' || s === 'BufferC' || s === 'BufferD';
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
 * Get default source file name for a pass.
 */
function defaultSourceForPass(name: PassName): string {
  switch (name) {
    case 'Image':
      return 'image.glsl';
    case 'BufferA':
      return 'bufferA.glsl';
    case 'BufferB':
      return 'bufferB.glsl';
    case 'BufferC':
      return 'bufferC.glsl';
    case 'BufferD':
      return 'bufferD.glsl';
  }
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Load a Shadertoy project from disk.
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
    // Multi-pass mode: parse config
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
      return await loadProjectWithConfig(root, config as ShadertoyConfig);
    }
    return await loadStandardProject(root, config as StandardConfig);
  } else {
    // Single-pass mode: just image.glsl
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
 *
 * @param root - Project directory
 * @returns ShaderProject with only Image pass
 */
async function loadSinglePassProject(root: string): Promise<ShaderProject> {
  const imagePath = path.join(root, 'image.glsl');
  if (!(await fileExists(imagePath))) {
    throw new Error(`Single-pass project at '${root}' requires 'image.glsl'.`);
  }

  // Check for extra GLSL files
  const glslFiles = await listGlslFiles(root);
  const extraGlsl = glslFiles.filter((name) => name !== 'image.glsl');
  if (extraGlsl.length > 0) {
    throw new Error(
      `Project at '${root}' contains multiple GLSL files (${glslFiles.join(
        ', '
      )}) but no 'config.json'. Add a config file to use multiple passes.`
    );
  }

  // Check for textures
  if (await hasTexturesDirWithFiles(root)) {
    throw new Error(
      `Project at '${root}' uses textures (in 'textures/' folder) but has no 'config.json'. Add a config file to define texture bindings.`
    );
  }

  // Load shader source
  const imageSource = await fs.readFile(imagePath, 'utf8');
  const title = path.basename(root);

  const project: ShaderProject = {
    mode: 'standard',
    root,
    meta: {
      title,
      author: null,
      description: null,
    },
    layout: 'default',
    theme: 'light',
    controls: false,
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
  };

  return project;
}

// =============================================================================
// Multi-Pass Mode (With Config)
// =============================================================================

/**
 * Parse a channel value (string shorthand or object) into normalized ChannelJSONObject.
 *
 * String shortcuts:
 * - "BufferA", "BufferB", etc. → buffer reference
 * - "keyboard" → keyboard input
 * - "photo.jpg" (with extension) → texture file
 */
function parseChannelValue(value: ChannelValue): ChannelJSONObject | null {
  if (typeof value === 'string') {
    // Check for buffer names
    if (isPassName(value)) {
      return { buffer: value };
    }
    // Check for keyboard
    if (value === 'keyboard') {
      return { keyboard: true };
    }
    // Check for audio
    if (value === 'audio') {
      return { audio: true };
    }
    // Check for webcam
    if (value === 'webcam') {
      return { webcam: true };
    }
    // Assume texture (file path)
    return { texture: value };
  }
  // Already an object
  return value;
}

// =============================================================================
// Uniform Validation
// =============================================================================

/** Valid scalar uniform types */
const SCALAR_TYPES = new Set(['float', 'int', 'bool', 'vec2', 'vec3', 'vec4']);
/** Valid array uniform types */
const ARRAY_TYPES = new Set(['float', 'vec2', 'vec3', 'vec4', 'mat3', 'mat4']);
/** Expected component count for vector/matrix types */
const COMPONENT_COUNTS: Record<string, number> = {
  vec2: 2, vec3: 3, vec4: 4,
};

/**
 * Validate uniform definitions from config.json.
 * Throws on invalid definitions with descriptive error messages.
 */
function validateUniforms(uniforms: UniformDefinitions, root: string): void {
  for (const [name, def] of Object.entries(uniforms)) {
    const prefix = `Uniform '${name}' in '${root}'`;

    if (!def.type) {
      throw new Error(`${prefix}: missing 'type' field`);
    }

    if (isArrayUniform(def)) {
      // Array uniform validation
      if (!ARRAY_TYPES.has(def.type)) {
        throw new Error(`${prefix}: invalid array type '${def.type}'. Expected one of: ${[...ARRAY_TYPES].join(', ')}`);
      }
      if (typeof def.count !== 'number' || def.count < 1 || !Number.isInteger(def.count)) {
        throw new Error(`${prefix}: 'count' must be a positive integer, got ${def.count}`);
      }
      continue;
    }

    // Scalar uniform validation
    if (!SCALAR_TYPES.has(def.type)) {
      throw new Error(`${prefix}: invalid type '${def.type}'. Expected one of: ${[...SCALAR_TYPES].join(', ')}`);
    }

    // Validate value matches type
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
        // Validate min/max/step arrays if present
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

/**
 * Load a project with config.json.
 *
 * @param root - Project directory
 * @param config - Parsed JSON config
 * @returns Normalized ShaderProject
 */
async function loadProjectWithConfig(root: string, config: ShadertoyConfig): Promise<ShaderProject> {
  // Extract pass configs from top level
  const passConfigs = {
    Image: config.Image,
    BufferA: config.BufferA,
    BufferB: config.BufferB,
    BufferC: config.BufferC,
    BufferD: config.BufferD,
  };

  // Validate: must have Image pass (or be empty config for simple shader)
  const hasAnyPass = passConfigs.Image || passConfigs.BufferA || passConfigs.BufferB ||
                     passConfigs.BufferC || passConfigs.BufferD;

  if (!hasAnyPass) {
    // Empty config = simple Image pass with no channels
    passConfigs.Image = {};
  }

  // Resolve commonSource
  let commonSource: string | null = null;
  if (config.common) {
    const commonPath = path.join(root, config.common);
    if (!(await fileExists(commonPath))) {
      throw new Error(
        `Common GLSL file '${config.common}' not found in '${root}'.`
      );
    }
    commonSource = await fs.readFile(commonPath, 'utf8');
  } else {
    // Check for default common.glsl
    const defaultCommonPath = path.join(root, 'common.glsl');
    if (await fileExists(defaultCommonPath)) {
      commonSource = await fs.readFile(defaultCommonPath, 'utf8');
    }
  }

  // Texture deduplication map
  const textureMap = new Map<string, ShaderTexture2D>();

  /**
   * Register a texture and return its internal name.
   */
  function registerTexture(j: { texture: string; filter?: 'nearest' | 'linear'; wrap?: 'clamp' | 'repeat' }): string {
    const filter = j.filter ?? 'linear';
    const wrap = j.wrap ?? 'repeat';
    const key = `${j.texture}|${filter}|${wrap}`;

    let existing = textureMap.get(key);
    if (existing) {
      return existing.name;
    }

    const name = `tex${textureMap.size}`;
    const tex: ShaderTexture2D = {
      name,
      source: j.texture,
      filter,
      wrap,
    };
    textureMap.set(key, tex);
    return name;
  }

  /**
   * Parse a channel object into ChannelSource.
   */
  function parseChannelObject(value: ChannelJSONObject, passName: PassName, channelKey: string): ChannelSource {
    // Buffer channel
    if ('buffer' in value) {
      const buf = value.buffer;
      if (!isPassName(buf)) {
        throw new Error(
          `Invalid buffer name '${buf}' for ${channelKey} in pass '${passName}' at '${root}'.`
        );
      }
      return {
        kind: 'buffer',
        buffer: buf,
        current: !!value.current,
      };
    }

    // Texture channel
    if ('texture' in value) {
      const internalName = registerTexture(value);
      return {
        kind: 'texture',
        name: internalName,
        cubemap: value.type === 'cubemap',
      };
    }

    // Keyboard channel
    if ('keyboard' in value) {
      return { kind: 'keyboard' };
    }

    // Audio channel
    if ('audio' in value) {
      return { kind: 'audio' };
    }

    // Webcam channel
    if ('webcam' in value) {
      return { kind: 'webcam' };
    }

    // Video channel
    if ('video' in value) {
      return { kind: 'video', src: value.video };
    }

    // Script-uploaded texture channel
    if ('script' in value) {
      return { kind: 'script', name: value.script };
    }

    throw new Error(
      `Invalid channel object for ${channelKey} in pass '${passName}' at '${root}'.`
    );
  }

  /**
   * Load a single pass from simplified config.
   */
  async function loadPass(
    name: PassName,
    passConfig: PassConfigSimplified | undefined
  ): Promise<ShaderPass | undefined> {
    if (!passConfig) return undefined;

    const sourceRel = passConfig.source ?? defaultSourceForPass(name);
    const sourcePath = path.join(root, sourceRel);

    if (!(await fileExists(sourcePath))) {
      throw new Error(
        `Source GLSL file for pass '${name}' not found at '${sourceRel}' in '${root}'.`
      );
    }

    const glslSource = await fs.readFile(sourcePath, 'utf8');

    // Normalize channels (always 4 channels)
    const channelSources: ChannelSource[] = [];
    const channelKeys = ['iChannel0', 'iChannel1', 'iChannel2', 'iChannel3'] as const;

    for (const key of channelKeys) {
      const rawValue = passConfig[key];
      if (!rawValue) {
        channelSources.push({ kind: 'none' });
        continue;
      }

      // Parse string shorthand or use object directly
      const parsed = parseChannelValue(rawValue);
      if (!parsed) {
        channelSources.push({ kind: 'none' });
        continue;
      }

      channelSources.push(parseChannelObject(parsed, name, key));
    }

    return {
      name,
      glslSource,
      channels: channelSources as Channels,
    };
  }

  // Load all passes
  const imagePass = await loadPass('Image', passConfigs.Image);
  const bufferAPass = await loadPass('BufferA', passConfigs.BufferA);
  const bufferBPass = await loadPass('BufferB', passConfigs.BufferB);
  const bufferCPass = await loadPass('BufferC', passConfigs.BufferC);
  const bufferDPass = await loadPass('BufferD', passConfigs.BufferD);

  // If no Image pass was loaded but we have buffers, that's an error
  if (!imagePass && (bufferAPass || bufferBPass || bufferCPass || bufferDPass)) {
    throw new Error(`config.json at '${root}' has buffers but no Image pass.`);
  }

  // If still no Image pass, create empty one
  if (!imagePass) {
    throw new Error(`config.json at '${root}' must define an Image pass.`);
  }

  // Build metadata
  const title = config.title ?? path.basename(root);
  const author = config.author ?? null;
  const description = config.description ?? null;

  const project: ShaderProject = {
    mode: 'shadertoy',
    root,
    meta: { title, author, description },
    layout: config.layout ?? 'default',
    theme: config.theme ?? 'light',
    controls: config.controls ?? false,
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

  return project;
}

// =============================================================================
// Standard Mode (Named Buffers & Textures)
// =============================================================================

const BUFFER_PASS_NAMES: PassName[] = ['BufferA', 'BufferB', 'BufferC', 'BufferD'];

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
 * Load a standard mode project with named buffers and textures.
 */
async function loadStandardProject(root: string, config: StandardConfig): Promise<ShaderProject> {
  const buffersConfig = normalizeBuffersConfig(config.buffers);
  const bufferNames = Object.keys(buffersConfig);

  if (bufferNames.length > 4) {
    throw new Error(
      `Standard mode at '${root}' supports max 4 buffers, got ${bufferNames.length}: ${bufferNames.join(', ')}`
    );
  }

  // Map buffer names → PassNames (velocity → BufferA, pressure → BufferB, etc.)
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
    } else {
      // Image file
      const internalName = registerTexture(texValue);
      namedSamplers.set(texName, { kind: 'texture', name: internalName, cubemap: false });
    }
  }

  const noChannels: Channels = [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }];

  // Resolve common source
  let commonSource: string | null = null;
  if (config.common) {
    const commonPath = path.join(root, config.common);
    if (!(await fileExists(commonPath))) {
      throw new Error(`Common GLSL file '${config.common}' not found in '${root}'.`);
    }
    commonSource = await fs.readFile(commonPath, 'utf8');
  } else {
    const defaultCommonPath = path.join(root, 'common.glsl');
    if (await fileExists(defaultCommonPath)) {
      commonSource = await fs.readFile(defaultCommonPath, 'utf8');
    }
  }

  // Load Image pass
  const imagePath = path.join(root, 'image.glsl');
  if (!(await fileExists(imagePath))) {
    throw new Error(`Standard mode project at '${root}' requires 'image.glsl'.`);
  }
  const imageSource = await fs.readFile(imagePath, 'utf8');

  const imagePass: ShaderPass = {
    name: 'Image',
    glslSource: imageSource,
    channels: noChannels,
    namedSamplers: new Map(namedSamplers),
  };

  // Load buffer passes
  const passes: ShaderProject['passes'] = { Image: imagePass };

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

  // Validate uniforms
  if (config.uniforms) {
    validateUniforms(config.uniforms, root);
  }

  const title = config.title ?? path.basename(root);

  return {
    mode: 'standard',
    root,
    meta: {
      title,
      author: config.author ?? null,
      description: config.description ?? null,
    },
    layout: config.layout ?? 'default',
    theme: config.theme ?? 'light',
    controls: config.controls ?? false,
    startPaused: config.startPaused ?? false,
    pixelRatio: config.pixelRatio ?? null,
    commonSource,
    passes,
    textures: Array.from(textureMap.values()),
    uniforms: config.uniforms ?? {},
    script: null,
  };
}
