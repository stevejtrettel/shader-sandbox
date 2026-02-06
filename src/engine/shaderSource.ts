/**
 * shaderSource - GLSL shader source building
 *
 * Pure functions and constants for constructing fragment shaders
 * with Shadertoy boilerplate, uniform declarations, and cubemap preprocessing.
 */

import { ChannelSource, ArrayUniformDefinition, isArrayUniform } from '../project/types';
import { glslTypeName } from './std140';
import { LineMapping } from './ShaderEngine';

// =============================================================================
// Vertex Shader (Shared across all passes)
// =============================================================================

export const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

layout(location = 0) in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// =============================================================================
// Fragment Shader Boilerplate (before common code)
// =============================================================================

const FRAGMENT_PREAMBLE = `#version 300 es
precision highp float;

// Shadertoy compatibility: equirectangular texture sampling
const float ST_PI = 3.14159265359;
const float ST_TWOPI = 6.28318530718;
vec2 _st_dirToEquirect(vec3 dir) {
  float phi = atan(dir.z, dir.x);
  float theta = asin(dir.y);
  return vec2(phi / ST_TWOPI + 0.5, theta / ST_PI + 0.5);
}
`;

// =============================================================================
// Keyboard Helpers (auto-injected in standard mode when keyboard texture bound)
// =============================================================================

const KEYBOARD_HELPERS = `// --- Keyboard helpers (auto-injected) ---
// Letter keys
const int KEY_A = 65; const int KEY_B = 66; const int KEY_C = 67; const int KEY_D = 68;
const int KEY_E = 69; const int KEY_F = 70; const int KEY_G = 71; const int KEY_H = 72;
const int KEY_I = 73; const int KEY_J = 74; const int KEY_K = 75; const int KEY_L = 76;
const int KEY_M = 77; const int KEY_N = 78; const int KEY_O = 79; const int KEY_P = 80;
const int KEY_Q = 81; const int KEY_R = 82; const int KEY_S = 83; const int KEY_T = 84;
const int KEY_U = 85; const int KEY_V = 86; const int KEY_W = 87; const int KEY_X = 88;
const int KEY_Y = 89; const int KEY_Z = 90;

// Digit keys
const int KEY_0 = 48; const int KEY_1 = 49; const int KEY_2 = 50; const int KEY_3 = 51;
const int KEY_4 = 52; const int KEY_5 = 53; const int KEY_6 = 54; const int KEY_7 = 55;
const int KEY_8 = 56; const int KEY_9 = 57;

// Arrow keys
const int KEY_LEFT = 37; const int KEY_UP = 38; const int KEY_RIGHT = 39; const int KEY_DOWN = 40;

// Special keys
const int KEY_SPACE = 32;
const int KEY_ENTER = 13;
const int KEY_TAB = 9;
const int KEY_ESC = 27;
const int KEY_BACKSPACE = 8;
const int KEY_DELETE = 46;
const int KEY_SHIFT = 16;
const int KEY_CTRL = 17;
const int KEY_ALT = 18;

// Function keys
const int KEY_F1 = 112; const int KEY_F2 = 113; const int KEY_F3 = 114; const int KEY_F4 = 115;
const int KEY_F5 = 116; const int KEY_F6 = 117; const int KEY_F7 = 118; const int KEY_F8 = 119;
const int KEY_F9 = 120; const int KEY_F10 = 121; const int KEY_F11 = 122; const int KEY_F12 = 123;

// Returns 1.0 if key is held down, 0.0 otherwise
float keyDown(int key) {
  return textureLod(keyboard, vec2((float(key) + 0.5) / 256.0, 0.25), 0.0).x;
}

// Returns 1.0/0.0, toggling each time the key is pressed
float keyToggle(int key) {
  return textureLod(keyboard, vec2((float(key) + 0.5) / 256.0, 0.75), 0.0).x;
}

// Boolean convenience helpers
bool isKeyDown(int key) { return keyDown(key) > 0.5; }
bool isKeyToggled(int key) { return keyToggle(key) > 0.5; }
`;

/** Metadata about a UBO needed for shader source generation. */
export interface UBOInfo {
  name: string;
  def: ArrayUniformDefinition;
  count: number;
}

/** Options for building a fragment shader. */
export interface BuildShaderOpts {
  commonSource: string;
  ubos: UBOInfo[];
  uniforms: Record<string, any>;
  namedSamplers?: Map<string, ChannelSource>;
  /** View names for multi-view projects (enables cross-view uniforms) */
  viewNames?: string[];
}

/**
 * Build complete fragment shader source with Shadertoy boilerplate.
 *
 * @param userSource - The user's GLSL source code
 * @param channels - Channel configuration for this pass (to detect cubemap textures)
 * @param opts - Common source, UBO info, uniforms, and named samplers
 */
export function buildFragmentShader(
  userSource: string,
  channels: ChannelSource[],
  opts: BuildShaderOpts,
): { source: string; lineMapping: LineMapping } {
  const parts: string[] = [FRAGMENT_PREAMBLE];

  // Common code (if any)
  if (opts.commonSource) {
    parts.push('// Common code');
    parts.push(opts.commonSource);
    parts.push('');
  }

  if (opts.namedSamplers && opts.namedSamplers.size > 0) {
    // Standard mode: named samplers + core time/mouse uniforms (no iChannel)
    parts.push(`// Core uniforms
uniform vec3  iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int   iFrame;
uniform vec4  iMouse;
uniform bool  iMousePressed;
uniform vec4  iDate;
uniform float iFrameRate;

// Shader Sandbox touch extensions
uniform int   iTouchCount;
uniform vec4  iTouch0;
uniform vec4  iTouch1;
uniform vec4  iTouch2;
uniform float iPinch;
uniform float iPinchDelta;
uniform vec2  iPinchCenter;
`);

    // Cross-view uniforms for multi-view projects
    if (opts.viewNames && opts.viewNames.length > 1) {
      parts.push('// Cross-view uniforms (multi-view project)');
      for (const viewName of opts.viewNames) {
        parts.push(`uniform vec4  iMouse_${viewName};`);
        parts.push(`uniform vec3  iResolution_${viewName};`);
        parts.push(`uniform bool  iMousePressed_${viewName};`);
      }
      parts.push('');
    }

    // Named sampler declarations
    parts.push('// Named samplers');
    for (const [name] of opts.namedSamplers) {
      parts.push(`uniform sampler2D ${name};`);
      parts.push(`uniform vec3 ${name}_resolution;`);
    }
    parts.push('');

    // Auto-inject keyboard constants and helpers when keyboard texture is bound
    if (opts.namedSamplers.has('keyboard')) {
      parts.push(KEYBOARD_HELPERS);
      parts.push('');
    }
  } else {
    // Shadertoy mode: iChannel0-3
    parts.push(`// Shadertoy built-in uniforms
uniform vec3  iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int   iFrame;
uniform vec4  iMouse;
uniform bool  iMousePressed;
uniform vec4  iDate;
uniform float iFrameRate;
uniform vec3  iChannelResolution[4];
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;

// Shader Sandbox touch extensions (not in Shadertoy)
uniform int   iTouchCount;          // Number of active touches (0-10)
uniform vec4  iTouch0;              // Primary touch: (x, y, startX, startY)
uniform vec4  iTouch1;              // Second touch
uniform vec4  iTouch2;              // Third touch
uniform float iPinch;               // Pinch scale factor (1.0 = no pinch)
uniform float iPinchDelta;          // Pinch change since last frame
uniform vec2  iPinchCenter;         // Center point of pinch gesture
`);

    // Cross-view uniforms for multi-view projects (Shadertoy mode)
    if (opts.viewNames && opts.viewNames.length > 1) {
      parts.push('// Cross-view uniforms (multi-view project)');
      for (const viewName of opts.viewNames) {
        parts.push(`uniform vec4  iMouse_${viewName};`);
        parts.push(`uniform vec3  iResolution_${viewName};`);
        parts.push(`uniform bool  iMousePressed_${viewName};`);
      }
      parts.push('');
    }
  }

  // Array uniform blocks (UBOs)
  for (const ubo of opts.ubos) {
    parts.push(`// Array uniform: ${ubo.name} (max ${ubo.count})`);
    parts.push(`layout(std140) uniform _ub_${ubo.name} {`);
    parts.push(`  ${glslTypeName(ubo.def.type)} ${ubo.name}[${ubo.count}];`);
    parts.push(`};`);
    parts.push(`uniform int ${ubo.name}_count;`);
    parts.push('');
  }

  // Scalar custom uniforms
  const scalarUniforms = Object.entries(opts.uniforms)
    .filter(([, def]) => !isArrayUniform(def));
  if (scalarUniforms.length > 0) {
    parts.push('// Custom uniforms');
    for (const [name, def] of scalarUniforms) {
      const glslType = def.type === 'bool' ? 'bool' : def.type;
      parts.push(`uniform ${glslType} ${name};`);
    }
    parts.push('');
  }

  // Preprocess user shader code to handle cubemap-style texture sampling
  const processedSource = preprocessCubemapTextures(userSource, channels);

  // User shader code
  parts.push('// User shader code');
  parts.push(processedSource);
  parts.push('');

  // mainImage() wrapper
  parts.push(`// Main wrapper
out vec4 fragColor;

void main() {
  mainImage(fragColor, gl_FragCoord.xy);
}`);

  const source = parts.join('\n');

  // Compute line mapping by finding marker comments
  const sourceLines = source.split('\n');
  let commonStartLine = 0;
  let commonLines = 0;
  let userCodeStartLine = 0;

  for (let i = 0; i < sourceLines.length; i++) {
    if (sourceLines[i] === '// Common code') {
      commonStartLine = i + 2; // 1-indexed, skip the comment itself
      commonLines = opts.commonSource ? opts.commonSource.split('\n').length : 0;
    }
    if (sourceLines[i] === '// User shader code') {
      userCodeStartLine = i + 2; // 1-indexed, skip the comment itself
    }
  }

  return {
    source,
    lineMapping: { commonStartLine, commonLines, userCodeStartLine },
  };
}

/**
 * Preprocess shader to convert cubemap-style texture() calls to equirectangular.
 */
function preprocessCubemapTextures(source: string, channels: ChannelSource[]): string {
  const cubemapChannels = new Set<string>();
  channels.forEach((ch, i) => {
    if (ch.kind === 'texture' && ch.cubemap) {
      cubemapChannels.add(`iChannel${i}`);
    }
  });

  if (cubemapChannels.size === 0) {
    return source;
  }

  const textureCallRegex = /texture\s*\(\s*(iChannel[0-3])\s*,\s*([^)]+)\)/g;

  return source.replace(textureCallRegex, (match, channel, coord) => {
    if (cubemapChannels.has(channel)) {
      return `texture(${channel}, _st_dirToEquirect(${coord}))`;
    } else {
      return match;
    }
  });
}
