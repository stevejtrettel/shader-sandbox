/**
 * Shared helpers for config loading.
 * Used by both the Node/CLI loader (loadProject.ts) and
 * the browser/Vite loader (loaderHelper.ts).
 */

import type { PassName, ChannelValue, ChannelJSONObject } from './types';

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

/** The ordered list of pass names for iteration. */
export const PASS_ORDER = ['Image', 'BufferA', 'BufferB', 'BufferC', 'BufferD'] as const;

/** The four buffer pass names (excludes Image). */
export const BUFFER_PASS_NAMES: PassName[] = ['BufferA', 'BufferB', 'BufferC', 'BufferD'];

/** The four channel keys. */
export const CHANNEL_KEYS = ['iChannel0', 'iChannel1', 'iChannel2', 'iChannel3'] as const;

/** Default layout for projects. */
export const DEFAULT_LAYOUT = 'default' as const;

/** Default controls setting. */
export const DEFAULT_CONTROLS = false;

/** Default theme. */
export const DEFAULT_THEME = 'light' as const;

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
const VALID_THEMES = new Set(['light', 'dark', 'system']);

const VALID_TOP_LEVEL_KEYS = new Set([
  'mode', 'title', 'author', 'description', 'layout', 'theme', 'controls',
  'common', 'startPaused', 'pixelRatio', 'uniforms', 'buffers', 'textures',
  'Image', 'BufferA', 'BufferB', 'BufferC', 'BufferD',
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

  // Validate buffer names
  const bufferNames = new Set<string>();
  if (config.buffers) {
    const names = Array.isArray(config.buffers) ? config.buffers : Object.keys(config.buffers);
    for (const name of names) {
      if (typeof name !== 'string') {
        errors.push(`Buffer name must be a string, got ${typeof name}`);
        continue;
      }
      if (!isValidGLSLIdentifier(name)) {
        errors.push(`Buffer name '${name}' is not a valid GLSL identifier`);
      }
      bufferNames.add(name);
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
