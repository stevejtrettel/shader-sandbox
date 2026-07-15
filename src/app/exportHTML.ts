/**
 * HTML Export - Standalone shader export
 *
 * Exports the current shader project as a self-contained HTML file with an
 * embedded WebGL2 player.
 *
 * Drift-proofing: the export embeds each pass's EXACT compiled fragment
 * source from the live engine (engine.getPassExportData()), so all GLSL
 * generation — preambles, uniform declarations, keyboard helpers, cubemap
 * rewriting, named samplers — happens exactly once, in the engine. The
 * player only compiles the provided sources and binds serialized state.
 * The std140 packing used for script-driven uniform updates is embedded
 * via packTightToStd140.toString() and unit-tested against the engine's
 * packer (tests/exportPacking.test.ts).
 *
 * Not included (by design, see README): audio/webcam/video inputs are
 * replaced with black; image textures with a procedural grid.
 */

import type { ShaderProject, ChannelSource, ArrayUniformType } from '../project/types';
import { isAnyUBOUniform } from '../project/types';
import type { ShaderEngine } from '../engine/ShaderEngine';
import { VERTEX_SHADER_SOURCE } from '../engine/shaderSource';
import { computeStructLayout, std140FloatCount, tightFloatCount } from '../engine/std140';

/** Escape a string for embedding in JS template literals. */
const escJS = (s: string) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

/** Serialized channel/sampler binding for the export player. */
type ExportBinding =
  | { kind: 'none' }
  | { kind: 'black' }         // audio/webcam/video → excluded from exports
  | { kind: 'procedural' }    // image textures → grid pattern
  | { kind: 'keyboard' }
  | { kind: 'buffer'; buffer: string }
  | { kind: 'script'; name: string };

function serializeBinding(ch: ChannelSource): ExportBinding {
  switch (ch.kind) {
    case 'buffer': return { kind: 'buffer', buffer: ch.buffer };
    case 'texture': return { kind: 'procedural' };
    case 'keyboard': return { kind: 'keyboard' };
    case 'script': return { kind: 'script', name: ch.name };
    case 'audio':
    case 'webcam':
    case 'video': return { kind: 'black' };
    default: return { kind: 'none' };
  }
}

/**
 * Pack tightly-laid-out element data into an std140 buffer.
 *
 * SELF-CONTAINED — no imports, no closure captures — because it is embedded
 * into exported HTML via .toString(). Plain arrays are modeled as
 * single-field structs. Must stay behaviorally identical to the engine's
 * packStd140/packStructStd140 (enforced by tests/exportPacking.test.ts).
 */
export function packTightToStd140(
  fields: Array<{ offsetFloats: number; tightFloats: number; type: string }>,
  strideFloats: number,
  count: number,
  tight: ArrayLike<number>,
  out: Float32Array,
): void {
  const tightPerElement = fields.reduce((sum, f) => sum + f.tightFloats, 0);
  for (let i = 0; i < count; i++) {
    let tightOff = i * tightPerElement;
    const elementBase = i * strideFloats;
    for (const field of fields) {
      const dst = elementBase + field.offsetFloats;
      if (field.type === 'mat3') {
        // mat3: 3 columns of vec3, each padded to vec4
        for (let col = 0; col < 3; col++) {
          for (let row = 0; row < 3; row++) {
            out[dst + col * 4 + row] = tight[tightOff + col * 3 + row] ?? 0;
          }
          out[dst + col * 4 + 3] = 0;
        }
      } else {
        for (let j = 0; j < field.tightFloats; j++) {
          out[dst + j] = tight[tightOff + j] ?? 0;
        }
      }
      tightOff += field.tightFloats;
    }
  }
}

/**
 * Export the current shader as a standalone HTML file and trigger download.
 */
export function exportHTML(project: ShaderProject, engine: ShaderEngine): void {
  const html = generateStandaloneHTML(project, engine);

  const blob = new Blob([html], { type: 'text/html' });
  const folderName = project.root.split('/').pop() || 'shader';
  const filename = `${folderName}.html`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);

  console.log(`Exported: ${filename}`);
}

/** Exported for tests (escaping round-trips); use exportHTML() from app code. */
export function generateStandaloneHTML(project: ShaderProject, engine: ShaderEngine): string {
  const title = project.meta.title;
  const uniformValues = engine.getUniformValues();
  const uboData = engine.getUBOExportData();
  const passData = engine.getPassExportData();

  // ── Passes: exact compiled sources + serialized bindings ──
  const passes = passData.map(p => ({
    name: p.name,
    fragmentSource: p.fragmentSource,
    channels: p.channels.map(serializeBinding),
    samplers: p.namedSamplers.map(([name, src]) => [name, serializeBinding(src)] as const),
  }));

  const hasKeyboard = passes.some(p =>
    p.channels.some(c => c.kind === 'keyboard') || p.samplers.some(([, s]) => s.kind === 'keyboard'));
  const hasScriptTextures = passes.some(p =>
    p.channels.some(c => c.kind === 'script') || p.samplers.some(([, s]) => s.kind === 'script'));
  const hasScript = !!(project.scriptSource || project.script?.setup || project.script?.onFrame);

  // ── Scalar uniforms: keep TYPE so the player binds int/bool via uniform1i ──
  const scalarDefs: Record<string, { type: string; value: unknown }> = {};
  for (const [name, def] of Object.entries(project.uniforms)) {
    if (isAnyUBOUniform(def)) continue;
    scalarDefs[name] = { type: def.type, value: uniformValues[name] ?? def.value };
  }

  // ── UBOs: baked std140 data + layout info for script-driven repacking ──
  const uboJS = uboData.map(u => {
    let fields: Array<{ offsetFloats: number; tightFloats: number; type: string }>;
    let strideFloats: number;
    if (u.struct) {
      const layout = computeStructLayout(u.struct as Record<string, ArrayUniformType>);
      fields = layout.fields.map(f => ({
        offsetFloats: f.offsetBytes / 4,
        tightFloats: f.tightFloats,
        type: f.type,
      }));
      strideFloats = layout.strideFloats;
    } else {
      fields = [{
        offsetFloats: 0,
        tightFloats: tightFloatCount(u.type as ArrayUniformType, 1),
        type: u.type,
      }];
      strideFloats = std140FloatCount(u.type as ArrayUniformType, 1);
    }
    const dataStr = Array.from(u.paddedData).map(v => Number(v.toFixed(6))).join(',');
    return `  { name: ${JSON.stringify(u.name)}, binding: ${u.bindingPoint}, count: ${u.count}, activeCount: ${u.activeCount}, strideFloats: ${strideFloats}, fields: ${JSON.stringify(fields)}, data: new Float32Array([${dataStr}]) }`;
  }).join(',\n');

  // ── Script sources ──
  // Preferred: the raw script.js module text (real module semantics —
  // module-level state and helper functions survive the export).
  // Fallback: Function.toString() of the hooks, which only works for
  // self-contained hooks (no module-scope references).
  const scriptModuleSource = project.scriptSource ?? '';
  const scriptSetupSource = project.script?.setup?.toString() ?? '';
  const scriptOnFrameSource = project.script?.onFrame?.toString() ?? '';

  const passesJS = passes.map(p =>
    `  { name: ${JSON.stringify(p.name)}, fragmentSource: \`${escJS(p.fragmentSource)}\`, channels: ${JSON.stringify(p.channels)}, samplers: ${JSON.stringify(p.samplers)} }`
  ).join(',\n');

  // ── Assemble HTML ──
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #fff; }
    body { display: flex; align-items: center; justify-content: center; }
    .container {
      width: 90vw;
      max-width: 1200px;
      aspect-ratio: 16 / 9;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1);
    }
    canvas { display: block; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div class="container">
    <canvas id="canvas"></canvas>
  </div>
  <script type="module">
// Shader Sandbox Export - ${title}
// Generated ${new Date().toISOString()}
// Fragment sources below are the EXACT sources the live engine compiled.

const VERTEX_SHADER = \`${escJS(VERTEX_SHADER_SOURCE)}\`;

const PASSES = [
${passesJS}
];

const UNIFORM_DEFS = ${JSON.stringify(scalarDefs, null, 2)};

const UBO_DATA = [
${uboJS}
];

// std140 packer — embedded from the library source (see exportHTML.ts)
const packTightToStd140 = ${packTightToStd140.toString()};

// ── WebGL Setup ──

const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: true });
if (!gl) { alert('WebGL2 not supported'); throw new Error('WebGL2 not supported'); }

const floatExt = gl.getExtension('EXT_color_buffer_float');
if (!floatExt) console.warn('EXT_color_buffer_float not supported');

// Fullscreen triangle
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

// ── Helper Textures ──

function createProceduralTexture() {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  const data = new Uint8Array(8 * 8 * 4);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const i = (y * 8 + x) * 4;
      const c = (x + y) % 2;
      data[i] = c ? 204 : 51; data[i+1] = c ? 26 : 51;
      data[i+2] = c ? 204 : 51; data[i+3] = 255;
    }
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 8, 8, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return tex;
}

function createBlackTexture() {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return tex;
}

const proceduralTex = createProceduralTexture();
const blackTex = createBlackTexture();
${hasKeyboard ? `
// ── Keyboard Texture (256x3) ──
// Row 0: held, Row 1: pressed this frame, Row 2: toggle
const keyboardTex = gl.createTexture();
const keyboardData = new Uint8Array(256 * 3);
gl.bindTexture(gl.TEXTURE_2D, keyboardTex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 256, 3, 0, gl.RED, gl.UNSIGNED_BYTE, keyboardData);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

const keyStates = new Uint8Array(256);
const keyDown_ev = new Uint8Array(256);
const keyToggle_st = new Uint8Array(256);

document.addEventListener('keydown', e => {
  const k = e.keyCode;
  if (k < 256) {
    if (!keyStates[k]) {
      keyDown_ev[k] = 255;
      keyToggle_st[k] = keyToggle_st[k] ? 0 : 255;
    }
    keyStates[k] = 255;
  }
});
document.addEventListener('keyup', e => {
  const k = e.keyCode;
  if (k < 256) keyStates[k] = 0;
});

function updateKeyboardTexture() {
  keyboardData.set(keyStates, 0);
  keyboardData.set(keyDown_ev, 256);
  keyboardData.set(keyToggle_st, 512);
  gl.bindTexture(gl.TEXTURE_2D, keyboardTex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 3, gl.RED, gl.UNSIGNED_BYTE, keyboardData);
  keyDown_ev.fill(0);
}
` : ''}
${hasScriptTextures || hasScript ? `
// ── Script Textures ──
const scriptTextures = new Map();

function updateScriptTexture(name, w, h, data) {
  const existing = scriptTextures.get(name);
  const isFloat = data instanceof Float32Array;
  const internalFormat = isFloat ? gl.RGBA32F : gl.RGBA;
  const type = isFloat ? gl.FLOAT : gl.UNSIGNED_BYTE;
  if (existing && existing.width === w && existing.height === h) {
    gl.bindTexture(gl.TEXTURE_2D, existing.texture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RGBA, type, data);
  } else {
    const tex = existing ? existing.texture : gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, gl.RGBA, type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    scriptTextures.set(name, { texture: tex, width: w, height: h });
  }
}
` : ''}
// ── Shader Compilation ──

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    console.error(source.split('\\n').map((l,i) => (i+1) + ': ' + l).join('\\n'));
    throw new Error('Shader compile failed');
  }
  return shader;
}

function createProgram(fragSource) {
  const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compileShader(gl.FRAGMENT_SHADER, fragSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('Program link failed: ' + gl.getProgramInfoLog(program));
  }
  return program;
}

function createRenderTexture(w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function createFramebuffer(tex) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return fb;
}

// ── Initialize Passes ──

const container = canvas.parentElement;
let width = canvas.width = container.clientWidth * devicePixelRatio;
let height = canvas.height = container.clientHeight * devicePixelRatio;

const runtimePasses = PASSES.map(pass => {
  const program = createProgram(pass.fragmentSource);
  const currentTexture = createRenderTexture(width, height);
  const previousTexture = createRenderTexture(width, height);
  const framebuffer = createFramebuffer(currentTexture);

  const loc = name => gl.getUniformLocation(program, name);
  const uniforms = {
    iResolution: loc('iResolution'),
    iTime: loc('iTime'),
    iTimeDelta: loc('iTimeDelta'),
    iFrame: loc('iFrame'),
    iMouse: loc('iMouse'),
    iMousePressed: loc('iMousePressed'),
    iDate: loc('iDate'),
    iFrameRate: loc('iFrameRate'),
    iChannel: [0,1,2,3].map(i => loc('iChannel' + i)),
    iChannelResolution: loc('iChannelResolution'),
    samplers: pass.samplers.map(([name]) => [name, loc(name), loc(name + '_resolution')]),
    custom: {},
    uboCountLocs: {},
  };

  for (const name of Object.keys(UNIFORM_DEFS)) {
    uniforms.custom[name] = loc(name);
  }

  for (const ubo of UBO_DATA) {
    const blockIndex = gl.getUniformBlockIndex(program, '_ub_' + ubo.name);
    if (blockIndex !== gl.INVALID_INDEX) {
      gl.uniformBlockBinding(program, blockIndex, ubo.binding);
    }
    uniforms.uboCountLocs[ubo.name] = loc(ubo.name + '_count');
  }

  return { name: pass.name, channels: pass.channels, samplers: pass.samplers, program, framebuffer, currentTexture, previousTexture, uniforms };
});

// ── UBO Buffers ──

for (const ubo of UBO_DATA) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
  gl.bufferData(gl.UNIFORM_BUFFER, ubo.data, gl.DYNAMIC_DRAW);
  gl.bindBufferBase(gl.UNIFORM_BUFFER, ubo.binding, buffer);
  ubo.buffer = buffer;
  ubo.dirty = false;
  ubo.tightPerElement = ubo.fields.reduce((s, f) => s + f.tightFloats, 0);
}

const findPass = name => runtimePasses.find(p => p.name === name);
const findUbo = name => UBO_DATA.find(u => u.name === name);

/** Resolve a serialized binding to a texture + its resolution. */
function resolveBinding(b) {
  if (b.kind === 'buffer') {
    const src = findPass(b.buffer);
    // previousTexture always holds the latest completed output (same
    // invariant as the live engine)
    return src ? [src.previousTexture, width, height] : [blackTex, 1, 1];
  }
  if (b.kind === 'procedural') return [proceduralTex, 8, 8];
  if (b.kind === 'keyboard') return [${hasKeyboard ? 'keyboardTex' : 'blackTex'}, 256, 3];
  if (b.kind === 'script') {
    const stex = typeof scriptTextures !== 'undefined' ? scriptTextures.get(b.name) : null;
    return stex ? [stex.texture, stex.width, stex.height] : [blackTex, 1, 1];
  }
  return [blackTex, 1, 1];
}
${hasScript ? `
// ── Script Support ──
${scriptModuleSource ? `
// The original script.js, embedded verbatim and imported as a real ES
// module so module-level state and helpers work exactly as they did live.
const SCRIPT_MODULE_SOURCE = \`${escJS(scriptModuleSource)}\`;

let scriptSetup = null;
let scriptOnFrame = null;
{
  const blobUrl = URL.createObjectURL(new Blob([SCRIPT_MODULE_SOURCE], { type: 'text/javascript' }));
  try {
    const mod = await import(blobUrl);
    if (typeof mod.setup === 'function') scriptSetup = mod.setup;
    if (typeof mod.onFrame === 'function') scriptOnFrame = mod.onFrame;
  } catch (e) {
    console.error('Failed to load embedded script module:', e);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
` : `
const scriptSetup = ${scriptSetupSource || 'null'};
const scriptOnFrame = ${scriptOnFrameSource || 'null'};
`}
function setUboTight(ubo, tight) {
  const count = Math.floor(tight.length / ubo.tightPerElement);
  if (count > ubo.count) {
    console.warn('setUniformValue(' + ubo.name + '): ' + count + ' elements exceeds max ' + ubo.count);
    return;
  }
  packTightToStd140(ubo.fields, ubo.strideFloats, count, tight, ubo.data);
  ubo.activeCount = count;
  ubo.dirty = true;
}

const scriptEngine = {
  setUniformValue(name, value) {
    const ubo = findUbo(name);
    if (ubo) {
      // Same contract as the live engine: tight per-element data, packed here
      setUboTight(ubo, value);
    } else if (name in UNIFORM_DEFS) {
      UNIFORM_DEFS[name].value = value;
    }
  },
  getUniformValue(name) {
    return UNIFORM_DEFS[name] ? UNIFORM_DEFS[name].value : undefined;
  },
  setArrayUniform(name, data) {
    const ubo = findUbo(name);
    if (!ubo) { console.warn('setArrayUniform: unknown uniform ' + name); return; }
    const flat = Array.isArray(data[0]) ? data.flat() : data;
    setUboTight(ubo, flat);
  },
  setActiveCount(name, count) {
    const ubo = findUbo(name);
    if (ubo && count >= 0 && count <= ubo.count) ubo.activeCount = count;
  },
  setArrayElement(name, index, value) {
    const ubo = findUbo(name);
    if (!ubo) return;
    const vals = typeof value === 'number' ? [value] : value;
    packTightToStd140(ubo.fields, ubo.strideFloats, 1, vals, ubo.data.subarray(index * ubo.strideFloats));
    if (index >= ubo.activeCount) ubo.activeCount = index + 1;
    ubo.dirty = true;
  },
  setStructArrayUniform() { console.warn('setStructArrayUniform: not supported in exports; use setUniformValue with tight data'); },
  setStructArrayElement() { console.warn('setStructArrayElement: not supported in exports'); },
  updateTexture(name, w, h, data) {
    if (typeof updateScriptTexture !== 'undefined') updateScriptTexture(name, w, h, data);
  },
  readPixels(passName, x, y, w, h) {
    const pass = findPass(passName);
    if (!pass) return new Float32Array(w * h * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, pass.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pass.previousTexture, 0);
    const pixels = new Float32Array(w * h * 4);
    gl.readPixels(x, y, w, h, gl.RGBA, gl.FLOAT, pixels);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pass.currentTexture, 0);
    return pixels;
  },
  get width() { return width; },
  get height() { return height; },
  setOverlay() {},
};

try {
  if (scriptSetup) scriptSetup(scriptEngine, { isRestore: false });
} catch(e) { console.error('script setup error:', e); }
` : ''}
// ── Mouse ──

let mouse = [0, 0, 0, 0];
let mouseDown = false;
canvas.addEventListener('mousedown', e => {
  mouseDown = true;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width * width;
  const y = (1 - (e.clientY - rect.top) / rect.height) * height;
  mouse[0] = x; mouse[1] = y;
  mouse[2] = x; mouse[3] = y;
});
canvas.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  const rect = canvas.getBoundingClientRect();
  mouse[0] = (e.clientX - rect.left) / rect.width * width;
  mouse[1] = (1 - (e.clientY - rect.top) / rect.height) * height;
});
window.addEventListener('mouseup', () => {
  mouseDown = false;
  mouse[2] = -Math.abs(mouse[2]);
  mouse[3] = -Math.abs(mouse[3]);
});

// ── Resize ──

let resizeTimer = null;
new ResizeObserver(() => {
  const newW = container.clientWidth * devicePixelRatio;
  const newH = container.clientHeight * devicePixelRatio;
  canvas.width = newW;
  canvas.height = newH;
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    width = newW;
    height = newH;
    runtimePasses.forEach(p => {
      [p.currentTexture, p.previousTexture].forEach(tex => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, p.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, p.currentTexture, 0);
    });
    frame = 0;
    startTime = performance.now() / 1000;
    lastTime = 0;
  }, 150);
}).observe(container);

// ── Animation Loop ──

let frame = 0;
let startTime = performance.now() / 1000;
let lastTime = 0;

function render(now) {
  requestAnimationFrame(render);

  const time = now / 1000 - startTime;
  const deltaTime = Math.max(0.001, time - lastTime);
  lastTime = time;

  const date = new Date();
  const iDate = [date.getFullYear(), date.getMonth(), date.getDate(),
    date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() / 1000];
${hasKeyboard ? '\n  updateKeyboardTexture();' : ''}
${hasScript ? `
  try {
    if (scriptOnFrame) scriptOnFrame(scriptEngine, time, deltaTime, frame);
  } catch(e) { console.error('script onFrame error:', e); }
` : ''}
  // Upload any UBOs dirtied by the script
  for (const ubo of UBO_DATA) {
    if (ubo.dirty) {
      gl.bindBuffer(gl.UNIFORM_BUFFER, ubo.buffer);
      gl.bufferSubData(gl.UNIFORM_BUFFER, 0, ubo.data);
      ubo.dirty = false;
    }
  }

  gl.bindVertexArray(vao);

  runtimePasses.forEach(pass => {
    gl.useProgram(pass.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, pass.framebuffer);
    gl.viewport(0, 0, width, height);

    // Built-in uniforms
    gl.uniform3f(pass.uniforms.iResolution, width, height, 1);
    gl.uniform1f(pass.uniforms.iTime, time);
    gl.uniform1f(pass.uniforms.iTimeDelta, deltaTime);
    gl.uniform1i(pass.uniforms.iFrame, frame);
    gl.uniform4fv(pass.uniforms.iMouse, mouse);
    gl.uniform1i(pass.uniforms.iMousePressed, mouseDown ? 1 : 0);
    gl.uniform4fv(pass.uniforms.iDate, iDate);
    gl.uniform1f(pass.uniforms.iFrameRate, 1 / deltaTime);

    // Scalar custom uniforms — typed binding (int/bool need uniform1i)
    for (const [name, def] of Object.entries(UNIFORM_DEFS)) {
      const uloc = pass.uniforms.custom[name];
      if (!uloc) continue;
      const v = def.value;
      switch (def.type) {
        case 'int': gl.uniform1i(uloc, v); break;
        case 'bool': gl.uniform1i(uloc, v ? 1 : 0); break;
        case 'float': gl.uniform1f(uloc, v); break;
        case 'vec2': gl.uniform2fv(uloc, v); break;
        case 'vec3': gl.uniform3fv(uloc, v); break;
        case 'vec4': gl.uniform4fv(uloc, v); break;
      }
    }

    // UBO count uniforms — active element count, not capacity
    for (const ubo of UBO_DATA) {
      const countLoc = pass.uniforms.uboCountLocs[ubo.name];
      if (countLoc) gl.uniform1i(countLoc, ubo.activeCount);
    }

    // Bind iChannel0-3 (shadertoy mode)
    let unit = 0;
    const channelRes = new Float32Array(12);
    pass.channels.forEach((ch, i) => {
      const chLoc = pass.uniforms.iChannel[i];
      if (!chLoc) return;
      const [tex, w, h] = resolveBinding(ch);
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(chLoc, unit);
      channelRes[i*3] = w; channelRes[i*3+1] = h; channelRes[i*3+2] = 1;
      unit++;
    });
    if (pass.uniforms.iChannelResolution) {
      gl.uniform3fv(pass.uniforms.iChannelResolution, channelRes);
    }

    // Bind named samplers (standard mode)
    for (let s = 0; s < pass.samplers.length; s++) {
      const [, binding] = pass.samplers[s];
      const [, samplerLoc, resLoc] = pass.uniforms.samplers[s];
      if (!samplerLoc) continue;
      const [tex, w, h] = resolveBinding(binding);
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(samplerLoc, unit);
      if (resLoc) gl.uniform3f(resLoc, w, h, 1);
      unit++;
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Swap ping-pong textures
    const temp = pass.currentTexture;
    pass.currentTexture = pass.previousTexture;
    pass.previousTexture = temp;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pass.currentTexture, 0);
  });

  // Blit Image pass to screen
  const imagePass = findPass('Image');
  if (imagePass) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, imagePass.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, imagePass.previousTexture, 0);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, imagePass.framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, imagePass.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, imagePass.currentTexture, 0);
  }

  frame++;
}

requestAnimationFrame(render);
  </script>
</body>
</html>`;
}
