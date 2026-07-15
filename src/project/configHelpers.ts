/**
 * Shared helpers for config loading.
 * Used by the browser/Vite loader (loaderHelper.ts) and the
 * fetch-based runtime loader (runtime.ts).
 */

import type { PassName, ChannelValue, ChannelJSONObject, MultiViewConfig } from './types';

/**
 * Type guard for PassName.
 */
export function isPassName(s: string): s is PassName {
  return s === 'Image' || s === 'BufferA' || s === 'BufferB' || s === 'BufferC' || s === 'BufferD';
}

/**
 * Get default source file name for a pass.
 */
export function defaultSourceForPass(name: PassName): string {
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

/**
 * Parse a channel value (string shorthand or object) into normalized ChannelJSONObject.
 *
 * String shortcuts:
 * - "BufferA", "BufferB", etc. → buffer reference
 * - "keyboard" → keyboard input
 * - "audio" → microphone audio input
 * - "webcam" → webcam video input
 * - "photo.jpg" (with extension) → texture file
 */
export function parseChannelValue(value: ChannelValue): ChannelJSONObject | null {
  if (typeof value === 'string') {
    if (isPassName(value)) {
      return { buffer: value };
    }
    if (value === 'keyboard') {
      return { keyboard: true };
    }
    if (value === 'audio') {
      return { audio: true };
    }
    if (value === 'webcam') {
      return { webcam: true };
    }
    // Assume texture (file path)
    return { texture: value };
  }
  // Already an object
  return value;
}

/** The ordered list of pass names for config iteration. */
export const PASS_ORDER = ['Image', 'BufferA', 'BufferB', 'BufferC', 'BufferD'] as const;

/** The order passes EXECUTE in each frame (buffers first, Image last). */
export const PASS_EXECUTION_ORDER: PassName[] = ['BufferA', 'BufferB', 'BufferC', 'BufferD', 'Image'];

/** The four buffer pass names (excludes Image). */
export const BUFFER_PASS_NAMES: PassName[] = ['BufferA', 'BufferB', 'BufferC', 'BufferD'];

/** The four channel keys. */
export const CHANNEL_KEYS = ['iChannel0', 'iChannel1', 'iChannel2', 'iChannel3'] as const;

/** Default layout for projects. */
export const DEFAULT_LAYOUT = 'default' as const;


/** Default theme. */
export const DEFAULT_THEME = 'auto' as const;

// =============================================================================
// Config Validation
// =============================================================================

/** Built-in uniform names that cannot be used as custom uniform names. */
const RESERVED_UNIFORM_NAMES = new Set([
  'iResolution', 'iTime', 'iTimeDelta', 'iFrame', 'iMouse',
  'iDate', 'iFrameRate', 'iChannelResolution',
  'iChannel0', 'iChannel1', 'iChannel2', 'iChannel3',
  'iTouchCount', 'iTouch0', 'iTouch1', 'iTouch2',
  'iPinch', 'iPinchDelta', 'iPinchCenter',
]);

const GLSL_IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const GLSL_RESERVED_WORDS = new Set([
  'attribute', 'const', 'uniform', 'varying', 'break', 'continue',
  'do', 'for', 'while', 'if', 'else', 'in', 'out', 'inout',
  'float', 'int', 'void', 'bool', 'true', 'false',
  'discard', 'return', 'mat2', 'mat3', 'mat4',
  'vec2', 'vec3', 'vec4', 'ivec2', 'ivec3', 'ivec4',
  'bvec2', 'bvec3', 'bvec4', 'sampler2D', 'samplerCube',
  'struct', 'precision', 'highp', 'mediump', 'lowp',
  'layout', 'centroid', 'flat', 'smooth', 'noperspective',
  'switch', 'case', 'default',
]);

/** Check if a string is a valid GLSL identifier (not a reserved word). */
export function isValidGLSLIdentifier(name: string): boolean {
  return GLSL_IDENTIFIER_RE.test(name) && !GLSL_RESERVED_WORDS.has(name);
}

const VALID_LAYOUTS = new Set(['fullscreen', 'default', 'split', 'tabbed']);
const VALID_THEMES = new Set(['auto', 'light', 'dark', 'system']);
const VALID_UNIFORMS_UI = new Set(['panel', 'inline', 'off']);
const VALID_BUFFER_FILTERS = new Set(['nearest', 'linear']);
const VALID_BUFFER_WRAPS = new Set(['clamp', 'repeat']);
const VALID_BUFFER_OPTION_KEYS = new Set(['filter', 'wrap']);

/** Config fields that must be booleans when present. */
const BOOLEAN_KEYS = ['controls', 'stats', 'playback', 'startPaused', 'stickyMouse'] as const;

const VALID_TOP_LEVEL_KEYS = new Set([
  'mode', 'title', 'author', 'description', 'layout', 'theme', 'controls',
  'stats', 'playback', 'uniformsUI',
  'common', 'startPaused', 'stickyMouse', 'pixelRatio', 'uniforms', 'buffers', 'textures',
  'Image', 'BufferA', 'BufferB', 'BufferC', 'BufferD',
  'views', // multi-view projects
]);

const VALID_PASS_KEYS = new Set(['source', 'iChannel0', 'iChannel1', 'iChannel2', 'iChannel3']);

const SPECIAL_TEXTURE_SOURCES = new Set(['keyboard', 'audio', 'webcam']);

/**
 * Validate a project config and throw on errors.
 * Logs warnings for non-fatal issues.
 */
export function validateConfig(config: Record<string, any>, root: string): void {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Warn on unknown top-level keys
  for (const key of Object.keys(config)) {
    if (!VALID_TOP_LEVEL_KEYS.has(key)) {
      warnings.push(`Unknown config key '${key}'`);
    }
  }

  // Validate layout
  if (config.layout !== undefined && !VALID_LAYOUTS.has(config.layout)) {
    errors.push(`Invalid layout '${config.layout}'. Expected one of: ${[...VALID_LAYOUTS].join(', ')}`);
  }

  // Validate theme
  if (config.theme !== undefined && !VALID_THEMES.has(config.theme)) {
    errors.push(`Invalid theme '${config.theme}'. Expected one of: ${[...VALID_THEMES].join(', ')}`);
  }

  // Validate boolean fields (catches JSON mistakes like "controls": "false",
  // which would otherwise be truthy)
  for (const key of BOOLEAN_KEYS) {
    if (config[key] !== undefined && typeof config[key] !== 'boolean') {
      errors.push(`'${key}' must be true or false (unquoted), got ${JSON.stringify(config[key])}`);
    }
  }

  // Validate uniformsUI
  if (config.uniformsUI !== undefined && !VALID_UNIFORMS_UI.has(config.uniformsUI)) {
    errors.push(`Invalid uniformsUI '${config.uniformsUI}'. Expected one of: ${[...VALID_UNIFORMS_UI].join(', ')}`);
  }

  // Validate pixelRatio
  if (config.pixelRatio !== undefined) {
    if (typeof config.pixelRatio !== 'number' || !Number.isFinite(config.pixelRatio) || config.pixelRatio <= 0) {
      errors.push(`'pixelRatio' must be a positive number, got ${JSON.stringify(config.pixelRatio)}`);
    }
  }

  // Named buffers/textures are a standard-mode feature; in shadertoy mode
  // channels are bound per-pass via iChannel0-3.
  if (config.mode === 'shadertoy') {
    if (config.buffers !== undefined) {
      errors.push(`'buffers' is not supported in shadertoy mode. Bind buffers per-pass with iChannel0-3 instead.`);
    }
    if (config.textures !== undefined) {
      errors.push(`'textures' is not supported in shadertoy mode. Bind textures per-pass with iChannel0-3 instead.`);
    }
  } else {
    // Standard mode: pass-level iChannel bindings and named buffers/textures
    // are mutually exclusive (named samplers replace the iChannel preamble).
    const hasNamed = (config.buffers && Object.keys(config.buffers).length > 0) ||
                     (config.textures && Object.keys(config.textures).length > 0);
    if (hasNamed) {
      for (const passName of PASS_ORDER) {
        const passConfig = config[passName];
        if (!passConfig || typeof passConfig !== 'object') continue;
        if (CHANNEL_KEYS.some((k) => passConfig[k] !== undefined)) {
          errors.push(
            `Pass '${passName}' uses iChannel bindings, but the project also defines named buffers/textures. ` +
            `Use named samplers everywhere, or drop 'buffers'/'textures' and use iChannel bindings only.`
          );
        }
      }
    }
  }

  // Validate uniform names
  if (config.uniforms && typeof config.uniforms === 'object') {
    for (const name of Object.keys(config.uniforms)) {
      if (RESERVED_UNIFORM_NAMES.has(name)) {
        errors.push(`Uniform name '${name}' is reserved (built-in uniform)`);
      }
      if (!isValidGLSLIdentifier(name)) {
        errors.push(`Uniform name '${name}' is not a valid GLSL identifier`);
      }
    }
  }

  // Validate buffer names and options
  const bufferNames = new Set<string>();
  if (config.buffers) {
    for (const [name, value] of Object.entries(config.buffers)) {
      if (!isValidGLSLIdentifier(name)) {
        errors.push(`Buffer name '${name}' is not a valid GLSL identifier`);
      }
      bufferNames.add(name);

      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        errors.push(`Buffer '${name}' options must be an object (use {} for defaults)`);
        continue;
      }
      const bufOpts = value as Record<string, any>;
      for (const key of Object.keys(bufOpts)) {
        if (!VALID_BUFFER_OPTION_KEYS.has(key)) {
          warnings.push(`Unknown option '${key}' for buffer '${name}'`);
        }
      }
      if (bufOpts.filter !== undefined && !VALID_BUFFER_FILTERS.has(bufOpts.filter)) {
        errors.push(`Buffer '${name}': invalid filter '${bufOpts.filter}'. Expected one of: ${[...VALID_BUFFER_FILTERS].join(', ')}`);
      }
      if (bufOpts.wrap !== undefined && !VALID_BUFFER_WRAPS.has(bufOpts.wrap)) {
        errors.push(`Buffer '${name}': invalid wrap '${bufOpts.wrap}'. Expected one of: ${[...VALID_BUFFER_WRAPS].join(', ')}`);
      }
    }
  }

  // Validate texture names and sources
  if (config.textures && typeof config.textures === 'object') {
    for (const [name, value] of Object.entries(config.textures)) {
      if (!isValidGLSLIdentifier(name)) {
        errors.push(`Texture name '${name}' is not a valid GLSL identifier`);
      }
      if (bufferNames.has(name)) {
        errors.push(`Texture name '${name}' collides with a buffer name`);
      }
      if (typeof value !== 'string') {
        errors.push(`Texture source for '${name}' must be a string`);
      } else if (!SPECIAL_TEXTURE_SOURCES.has(value) && !/\.\w+$/.test(value) && !isValidGLSLIdentifier(value)) {
        errors.push(`Invalid texture source '${value}' for '${name}'. Expected a file path with extension, a script texture name, or one of: ${[...SPECIAL_TEXTURE_SOURCES].join(', ')}`);
      }
    }
  }

  // Validate pass configs
  for (const passName of PASS_ORDER) {
    const passConfig = config[passName];
    if (!passConfig || typeof passConfig !== 'object') continue;

    for (const key of Object.keys(passConfig)) {
      if (!VALID_PASS_KEYS.has(key)) {
        warnings.push(`Unknown key '${key}' in pass '${passName}'`);
      }
    }

    // Check channel buffer references
    for (const chKey of CHANNEL_KEYS) {
      const val = passConfig[chKey];
      if (!val) continue;
      if (typeof val === 'string' && isPassName(val) && val !== 'Image' && !config[val]) {
        warnings.push(`${passName}.${chKey} references '${val}' but no ${val} pass is configured`);
      }
    }
  }

  for (const w of warnings) console.warn(`[config] ${root}: ${w}`);
  if (errors.length > 0) {
    throw new Error(
      `Config validation failed for '${root}':\n${errors.map(e => `  - ${e}`).join('\n')}`
    );
  }
}

const VALID_MULTI_VIEW_LAYOUTS = new Set(['split', 'quad', 'grid', 'inset']);

/**
 * Validate a multi-view config and throw on errors.
 */
export function validateMultiViewConfig(config: MultiViewConfig, root: string): void {
  const errors: string[] = [];

  if (!Array.isArray(config.views) || config.views.length < 2) {
    errors.push(`'views' must be an array with at least 2 entries`);
  } else {
    for (const view of config.views) {
      if (typeof view !== 'string' || !view) {
        errors.push(`Each view name must be a non-empty string, got '${view}'`);
      }
    }
    const unique = new Set(config.views);
    if (unique.size !== config.views.length) {
      errors.push(`Duplicate view names found`);
    }
  }

  if (config.layout !== undefined && !VALID_MULTI_VIEW_LAYOUTS.has(config.layout)) {
    errors.push(`Invalid multi-view layout '${config.layout}'. Expected one of: ${[...VALID_MULTI_VIEW_LAYOUTS].join(', ')}`);
  }

  if (config.theme !== undefined && !VALID_THEMES.has(config.theme)) {
    errors.push(`Invalid theme '${config.theme}'. Expected one of: ${[...VALID_THEMES].join(', ')}`);
  }

  if (config.uniforms && typeof config.uniforms === 'object') {
    for (const name of Object.keys(config.uniforms)) {
      if (RESERVED_UNIFORM_NAMES.has(name)) {
        errors.push(`Uniform name '${name}' is reserved (built-in uniform)`);
      }
      if (!isValidGLSLIdentifier(name)) {
        errors.push(`Uniform name '${name}' is not a valid GLSL identifier`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Multi-view config validation failed for '${root}':\n${errors.map(e => `  - ${e}`).join('\n')}`
    );
  }
}
