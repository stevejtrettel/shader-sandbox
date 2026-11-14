// Minimal GLSL test runner: expands #include exactly as the project's build does
// (glslAliasPlugin regex + the real vite-plugin-glsl loadShader), compiles in headless
// Chromium WebGL2, renders to an RGBA32F target and reads back floats.
import loadShader from './node_modules/vite-plugin-glsl/src/loadShader.js';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

export const LIB = '/home/user/webgl-demos/src/shaders/lib';
const VIRTUAL = '/home/user/webgl-demos/demos/__virtual__/test.glsl'; // never written; only used for path resolution

export async function expand(src, virtualPath = VIRTUAL) {
  // glslAliasPlugin (vite.config.js)
  const rel = path.relative(path.dirname(virtualPath), LIB);
  src = src.replace(/#include\s+["']@lib\/([^"']+)["']/g, (m, f) => `#include "${rel}/${f}"`);
  const { outputShader } = await loadShader(src, virtualPath, {
    removeDuplicatedImports: false, warnDuplicatedImports: false,
    defaultExtension: 'glsl', importKeyword: '#include', minify: false, root: '/',
  });
  return outputShader;
}

export const HEADER = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp sampler3D;
out vec4 fragColor;
const float PI = 3.14159265359;
const float TAU = 6.28318530718;
const float E = 2.71828182846;
`;

let browser, page;
export async function start() {
  browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  page = await browser.newPage();
  await page.setContent('<canvas id=c width=4 height=4></canvas>');
  const info = await page.evaluate(() => {
    const gl = document.getElementById('c').getContext('webgl2');
    if (!gl) return null;
    window.gl = gl;
    const ext = gl.getExtension('EXT_color_buffer_float');
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    window.runShader = (frag, w, h, textures, uniforms) => {
      const gl = window.gl;
      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, '#version 300 es\nvoid main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.0-1.0,0.,1.);}');
      gl.compileShader(vs);
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, frag); gl.compileShader(fs);
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) { const log = gl.getShaderInfoLog(fs); gl.deleteShader(fs); return { ok: false, log }; }
      const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return { ok: false, log: 'LINK: ' + gl.getProgramInfoLog(pr) };
      gl.useProgram(pr);
      const texObjs = [];
      (textures || []).forEach((t, i) => {
        const tex = gl.createTexture(); texObjs.push(tex);
        gl.activeTexture(gl.TEXTURE0 + i);
        const target = t.d ? gl.TEXTURE_3D : gl.TEXTURE_2D;
        gl.bindTexture(target, tex);
        const data = new Float32Array(t.data);
        if (t.d) gl.texImage3D(target, 0, gl.RGBA32F, t.w, t.h, t.d, 0, gl.RGBA, gl.FLOAT, data);
        else gl.texImage2D(target, 0, gl.RGBA32F, t.w, t.h, 0, gl.RGBA, gl.FLOAT, data);
        gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (t.d) gl.texParameteri(target, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.uniform1i(gl.getUniformLocation(pr, t.name), i);
      });
      for (const [k, v] of Object.entries(uniforms || {})) {
        const loc = gl.getUniformLocation(pr, k);
        if (Array.isArray(v)) gl['uniform' + v.length + 'fv'](loc, v); else gl.uniform1f(loc, v);
      }
      const out = gl.createTexture();
      gl.activeTexture(gl.TEXTURE15); gl.bindTexture(gl.TEXTURE_2D, out);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, w, h);
      const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, out, 0);
      const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (st !== gl.FRAMEBUFFER_COMPLETE) return { ok: false, log: 'FBO incomplete ' + st };
      gl.viewport(0, 0, w, h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const buf = new Float32Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, buf);
      const err = gl.getError();
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.deleteFramebuffer(fb); gl.deleteTexture(out);
      texObjs.forEach(t => gl.deleteTexture(t)); gl.deleteProgram(pr); gl.deleteShader(fs); gl.deleteShader(vs);
      return { ok: true, data: Array.from(buf), err };
    };
    return { ext: !!ext, renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), version: gl.getParameter(gl.VERSION) };
  });
  return info;
}
export async function stop() { await browser.close(); }

// includes: array of '@lib/...' strings; pre: GLSL text placed BEFORE the includes (e.g. F());
// decl: uniforms/helpers after includes; body: statements inside main() that set fragColor.
export async function run({ includes = [], pre = '', decl = '', body, w = 1, h = 1, textures = [], uniforms = {} }) {
  const inc = includes.map(i => `#include "${i}"`).join('\n');
  const expanded = await expand(pre + '\n' + inc + '\n' + decl + `\nvoid main(){\n ivec2 px = ivec2(gl_FragCoord.xy);\n${body}\n}\n`);
  const res = await page.evaluate(([f, w, h, t, u]) => window.runShader(f, w, h, t, u), [HEADER + expanded, w, h, textures, uniforms]);
  if (res.ok) res.px = (x, y = 0) => res.data.slice(4 * (y * w + x), 4 * (y * w + x) + 4);
  return res;
}
