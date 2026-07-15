import { describe, it, expect } from 'vitest';
import { generateStandaloneHTML } from '../src/app/exportHTML';
import type { ShaderProject } from '../src/project/types';

const GLSL = 'void mainImage(out vec4 o, in vec2 c) { o = vec4(1.0); }';
const COMPILED = `#version 300 es\nprecision highp float;\n${GLSL}`;

function fakeProject(overrides: Partial<ShaderProject> = {}): ShaderProject {
  return {
    mode: 'standard',
    root: 'demo/test',
    meta: { title: 'Test', author: null, description: null },
    layout: 'default',
    theme: 'auto',
    startPaused: false,
    stickyMouse: false,
    pixelRatio: null,
    commonSource: null,
    passes: {
      Image: {
        name: 'Image',
        glslSource: GLSL,
        channels: [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }],
      },
    },
    textures: [],
    uniforms: {},
    uniformData: {},
    script: null,
    scriptSource: null,
    ...overrides,
  } as ShaderProject;
}

/** Minimal stand-in for the three engine methods the exporter uses. */
function fakeEngine() {
  return {
    getUniformValues: () => ({}),
    getUBOExportData: () => [],
    getPassExportData: () => [{
      name: 'Image' as const,
      fragmentSource: COMPILED,
      channels: [{ kind: 'none' as const }, { kind: 'none' as const }, { kind: 'none' as const }, { kind: 'none' as const }],
      namedSamplers: [] as Array<[string, never]>,
    }],
  } as never;
}

/** Pull a template-literal constant back out of the generated HTML and eval it. */
function extractTemplateConst(html: string, name: string): string {
  // Template content = any char except bare backtick/backslash, or an
  // escape sequence — so an escaped \` inside the content doesn't
  // terminate the match early
  const re = new RegExp(`const ${name} = \`((?:[^\`\\\\]|\\\\[\\s\\S])*)\`;`);
  const match = html.match(re);
  expect(match, `${name} not found in generated HTML`).toBeTruthy();
  // eslint-disable-next-line no-new-func
  return new Function(`return \`${match![1]}\``)() as string;
}

describe('export HTML generation', () => {
  it('embeds the exact compiled fragment source', () => {
    const html = generateStandaloneHTML(fakeProject(), fakeEngine());
    expect(html).toContain('fragmentSource:');
    expect(html).toContain(GLSL);
    // No GLSL generation in the export — the compiled preamble comes along
    expect(html).toContain('#version 300 es');
  });

  it('round-trips a script module containing backticks, ${}, and backslashes', () => {
    const nasty = [
      'let state = 0;',
      'const tpl = `value: ${state} \\n done`;',
      'export function setup(engine) { state = 1; }',
      'export function onFrame(engine, t) { engine.setUniformValue("u", state + t); }',
    ].join('\n');

    const html = generateStandaloneHTML(
      fakeProject({ scriptSource: nasty, script: {} }),
      fakeEngine(),
    );

    expect(html).toContain('SCRIPT_MODULE_SOURCE');
    expect(html).toContain('<script type="module">');
    const roundTripped = extractTemplateConst(html, 'SCRIPT_MODULE_SOURCE');
    expect(roundTripped).toBe(nasty);
  });

  it('falls back to serialized hooks when no raw source was retained', () => {
    const html = generateStandaloneHTML(
      fakeProject({ script: { onFrame: (_engine: unknown, t: number) => t * 2 } as never }),
      fakeEngine(),
    );
    expect(html).not.toContain('SCRIPT_MODULE_SOURCE');
    expect(html).toContain('const scriptOnFrame = ');
  });

  it('round-trips the vertex shader constant', () => {
    const html = generateStandaloneHTML(fakeProject(), fakeEngine());
    const vs = extractTemplateConst(html, 'VERTEX_SHADER');
    expect(vs).toContain('gl_Position');
  });
});
