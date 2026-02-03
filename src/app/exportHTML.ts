/**
 * HTML Export - Standalone shader export
 *
 * Exports the current shader project as a self-contained HTML file
 * with embedded WebGL2 renderer. Bakes in current uniform values
 * and replaces textures with procedural grid.
 */

import type { ShaderProject } from '../project/types';
import type { ShaderEngine } from '../engine/ShaderEngine';

/**
 * Export the current shader as a standalone HTML file and trigger download.
 */
export function exportHTML(project: ShaderProject, engine: ShaderEngine): void {
  const uniformValues = engine.getUniformValues();

  // Collect pass info
  const passOrder = ['BufferA', 'BufferB', 'BufferC', 'BufferD', 'Image'] as const;
  const passes: Array<{ name: string; source: string; channels: string[] }> = [];

  for (const passName of passOrder) {
    const pass = project.passes[passName];
    if (!pass) continue;

    // Map channels to their source type for the export
    const channels = pass.channels.map((ch) => {
      if (ch.kind === 'buffer') return ch.buffer;
      if (ch.kind === 'texture') return 'procedural'; // Will use grid texture
      if (ch.kind === 'keyboard') return 'keyboard';
      return 'none';
    });

    passes.push({
      name: passName,
      source: pass.glslSource,
      channels,
    });
  }

  // Build the HTML
  const html = generateStandaloneHTML({
    title: project.meta.title,
    commonSource: project.commonSource,
    passes,
    uniforms: project.uniforms,
    uniformValues,
  });

  // Download
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

/**
 * Generate standalone HTML with embedded shaders.
 */
function generateStandaloneHTML(opts: {
  title: string;
  commonSource: string | null;
  passes: Array<{ name: string; source: string; channels: string[] }>;
  uniforms: Record<string, { type: string; value?: unknown }>;
  uniformValues: Record<string, unknown>;
}): string {
  const { title, commonSource, passes, uniforms, uniformValues } = opts;

  // Escape shader sources for embedding in JS template literals
  const escapeForJS = (s: string) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

  // Build shader source objects
  const shaderSources = passes.map(p => ({
    name: p.name,
    source: escapeForJS(p.source),
    channels: p.channels,
  }));

  // Warn about array uniforms (not supported in export)
  const isArray = (def: { type: string; value?: unknown }) => 'count' in def;
  const arrayUniformNames = Object.entries(uniforms)
    .filter(([, def]) => isArray(def))
    .map(([name]) => name);
  if (arrayUniformNames.length > 0) {
    console.warn(
      `HTML export: array uniforms not supported, skipping: ${arrayUniformNames.join(', ')}`
    );
  }

  // Build uniform initialization code (scalar only)
  const uniformInits = Object.entries(uniforms).filter(([, def]) => !isArray(def)).map(([name, def]) => {
    const value = uniformValues[name] ?? def.value;
    if (def.type === 'float' || def.type === 'int') {
      return `  '${name}': ${value},`;
    } else if (def.type === 'bool') {
      return `  '${name}': ${value ? 1 : 0},`;
    } else if (def.type === 'vec2') {
      const v = value as number[];
      return `  '${name}': [${v[0]}, ${v[1]}],`;
    } else if (def.type === 'vec3') {
      const v = value as number[];
      return `  '${name}': [${v[0]}, ${v[1]}, ${v[2]}],`;
    } else if (def.type === 'vec4') {
      const v = value as number[];
      return `  '${name}': [${v[0]}, ${v[1]}, ${v[2]}, ${v[3]}],`;
    }
    return '';
  }).filter(Boolean).join('\n');

  // Build uniform declarations for shaders (scalar only)
  const uniformDeclarations = Object.entries(uniforms).filter(([, def]) => !isArray(def)).map(([name, def]) => {
    if (def.type === 'float') return `uniform float ${name};`;
    if (def.type === 'int') return `uniform int ${name};`;
    if (def.type === 'bool') return `uniform int ${name};`; // GLSL ES doesn't have bool uniforms
    if (def.type === 'vec2') return `uniform vec2 ${name};`;
    if (def.type === 'vec3') return `uniform vec3 ${name};`;
    if (def.type === 'vec4') return `uniform vec4 ${name};`;
    return '';
  }).filter(Boolean).join('\n');

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
  <script>
// Shader Sandbox Export - ${title}
// Generated ${new Date().toISOString()}

const VERTEX_SHADER = \`#version 300 es
precision highp float;
layout(location = 0) in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
\`;

const FRAGMENT_PREAMBLE = \`#version 300 es
precision highp float;

// Procedural texture for missing channels
vec4 proceduralGrid(vec2 uv) {
  vec2 grid = step(fract(uv * 8.0), vec2(0.5));
  float checker = abs(grid.x - grid.y);
  return mix(vec4(0.2, 0.2, 0.2, 1.0), vec4(0.8, 0.1, 0.8, 1.0), checker);
}

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
${uniformDeclarations}
\`;

const FRAGMENT_SUFFIX = \`
out vec4 fragColor;
void main() { mainImage(fragColor, gl_FragCoord.xy); }
\`;

const COMMON_SOURCE = \`${commonSource ? escapeForJS(commonSource) : ''}\`;

const PASSES = [
${shaderSources.map(p => `  { name: '${p.name}', source: \`${p.source}\`, channels: ${JSON.stringify(p.channels)} }`).join(',\n')}
];

const UNIFORM_VALUES = {
${uniformInits}
};

// WebGL setup
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: true });
if (!gl) { alert('WebGL2 not supported'); throw new Error('WebGL2 not supported'); }

// Fullscreen triangle
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

// Procedural texture (8x8 checkerboard)
function createProceduralTexture() {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  const data = new Uint8Array(8 * 8 * 4);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const i = (y * 8 + x) * 4;
      const checker = (x + y) % 2;
      data[i] = checker ? 204 : 51;
      data[i+1] = checker ? 26 : 51;
      data[i+2] = checker ? 204 : 51;
      data[i+3] = 255;
    }
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 8, 8, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return tex;
}

// Black texture for unused channels
function createBlackTexture() {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]));
  return tex;
}

const proceduralTex = createProceduralTexture();
const blackTex = createBlackTexture();

// Compile shader
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

// Create program
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

// Create texture for render target
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

// Create framebuffer attached to a texture
function createFramebuffer(tex) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.error('Framebuffer not complete:', status);
  }
  return fb;
}

// Initialize passes
const container = canvas.parentElement;
let width = canvas.width = container.clientWidth * devicePixelRatio;
let height = canvas.height = container.clientHeight * devicePixelRatio;

// Enable float textures (required for multi-buffer feedback)
const floatExt = gl.getExtension('EXT_color_buffer_float');
if (!floatExt) console.warn('EXT_color_buffer_float not supported');

const runtimePasses = PASSES.map(pass => {
  const fragSource = FRAGMENT_PREAMBLE + (COMMON_SOURCE ? '\\n// Common\\n' + COMMON_SOURCE + '\\n' : '') + '\\n// User code\\n' + pass.source + FRAGMENT_SUFFIX;
  const program = createProgram(fragSource);
  const currentTexture = createRenderTexture(width, height);
  const previousTexture = createRenderTexture(width, height);
  const framebuffer = createFramebuffer(currentTexture);
  return {
    name: pass.name,
    channels: pass.channels,
    program,
    framebuffer,
    currentTexture,
    previousTexture,
    uniforms: {
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      iTime: gl.getUniformLocation(program, 'iTime'),
      iTimeDelta: gl.getUniformLocation(program, 'iTimeDelta'),
      iFrame: gl.getUniformLocation(program, 'iFrame'),
      iMouse: gl.getUniformLocation(program, 'iMouse'),
      iMousePressed: gl.getUniformLocation(program, 'iMousePressed'),
      iDate: gl.getUniformLocation(program, 'iDate'),
      iFrameRate: gl.getUniformLocation(program, 'iFrameRate'),
      iChannel: [0,1,2,3].map(i => gl.getUniformLocation(program, 'iChannel' + i)),
      custom: Object.keys(UNIFORM_VALUES).reduce((acc, name) => {
        acc[name] = gl.getUniformLocation(program, name);
        return acc;
      }, {})
    }
  };
});

// Find pass by name
const findPass = name => runtimePasses.find(p => p.name === name);

// Mouse state (Shadertoy spec: xy=pos while down, zw=click origin, sign=held)
let mouse = [0, 0, 0, 0];
let mouseDown = false;
canvas.addEventListener('mousedown', e => {
  mouseDown = true;
  const x = e.clientX * devicePixelRatio;
  const y = (canvas.clientHeight - e.clientY) * devicePixelRatio;
  mouse[0] = x; mouse[1] = y;
  mouse[2] = x; mouse[3] = y;
});
canvas.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  mouse[0] = e.clientX * devicePixelRatio;
  mouse[1] = (canvas.clientHeight - e.clientY) * devicePixelRatio;
});
canvas.addEventListener('mouseup', () => {
  mouseDown = false;
  mouse[2] = -Math.abs(mouse[2]);
  mouse[3] = -Math.abs(mouse[3]);
});

// Resize handler - only resize if dimensions actually changed
let lastWidth = width, lastHeight = height;
new ResizeObserver(() => {
  const newWidth = container.clientWidth * devicePixelRatio;
  const newHeight = container.clientHeight * devicePixelRatio;
  if (newWidth === lastWidth && newHeight === lastHeight) return;
  lastWidth = width = canvas.width = newWidth;
  lastHeight = height = canvas.height = newHeight;
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
}).observe(container);

// Animation
let frame = 0;
let startTime = performance.now() / 1000;
let lastTime = 0;

function render(now) {
  requestAnimationFrame(render);

  const time = now / 1000 - startTime;
  const deltaTime = Math.max(0, time - lastTime);
  lastTime = time;

  const date = new Date();
  const iDate = [date.getFullYear(), date.getMonth(), date.getDate(),
    date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() / 1000];

  gl.bindVertexArray(vao);

  runtimePasses.forEach(pass => {
    gl.useProgram(pass.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, pass.framebuffer);
    gl.viewport(0, 0, width, height);

    // Bind uniforms
    gl.uniform3f(pass.uniforms.iResolution, width, height, 1);
    gl.uniform1f(pass.uniforms.iTime, time);
    gl.uniform1f(pass.uniforms.iTimeDelta, deltaTime);
    gl.uniform1i(pass.uniforms.iFrame, frame);
    gl.uniform4fv(pass.uniforms.iMouse, mouse);
    gl.uniform1i(pass.uniforms.iMousePressed, mouseDown ? 1 : 0);
    gl.uniform4fv(pass.uniforms.iDate, iDate);
    gl.uniform1f(pass.uniforms.iFrameRate, 1 / deltaTime);

    // Bind custom uniforms
    Object.entries(UNIFORM_VALUES).forEach(([name, value]) => {
      const loc = pass.uniforms.custom[name];
      if (!loc) return;
      if (Array.isArray(value)) {
        if (value.length === 2) gl.uniform2fv(loc, value);
        else if (value.length === 3) gl.uniform3fv(loc, value);
        else if (value.length === 4) gl.uniform4fv(loc, value);
      } else {
        gl.uniform1f(loc, value);
      }
    });

    // Bind channels
    pass.channels.forEach((ch, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      if (ch === 'none') {
        gl.bindTexture(gl.TEXTURE_2D, blackTex);
      } else if (ch === 'procedural') {
        gl.bindTexture(gl.TEXTURE_2D, proceduralTex);
      } else if (['BufferA', 'BufferB', 'BufferC', 'BufferD', 'Image'].includes(ch)) {
        const srcPass = findPass(ch);
        gl.bindTexture(gl.TEXTURE_2D, srcPass ? srcPass.previousTexture : blackTex);
      } else {
        gl.bindTexture(gl.TEXTURE_2D, blackTex);
      }
      gl.uniform1i(pass.uniforms.iChannel[i], i);
    });

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Swap textures and re-attach framebuffer
    const temp = pass.currentTexture;
    pass.currentTexture = pass.previousTexture;
    pass.previousTexture = temp;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pass.currentTexture, 0);
  });

  // Blit Image pass to screen
  const imagePass = findPass('Image');
  if (imagePass) {
    // Attach previousTexture (just rendered) for reading
    gl.bindFramebuffer(gl.FRAMEBUFFER, imagePass.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, imagePass.previousTexture, 0);

    // Blit to screen
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, imagePass.framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);

    // Restore framebuffer to currentTexture for next frame
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
