import { describe, it, expect } from 'vitest';
import { buildFragmentShader } from '../src/engine/shaderSource';
import { computeStructLayout } from '../src/engine/std140';
import type { ChannelSource } from '../src/project/types';

const USER_SOURCE = `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  fragColor = vec4(1.0);
}`;

const NO_CHANNELS: ChannelSource[] = [];

function build(opts: Partial<Parameters<typeof buildFragmentShader>[2]> = {}, channels = NO_CHANNELS, src = USER_SOURCE) {
  return buildFragmentShader(src, channels, {
    commonSource: '',
    ubos: [],
    uniforms: {},
    ...opts,
  });
}

describe('shadertoy mode (no named samplers)', () => {
  it('declares iChannel0-3 and iChannelResolution', () => {
    const { source } = build();
    expect(source).toContain('uniform sampler2D iChannel0;');
    expect(source).toContain('uniform sampler2D iChannel3;');
    expect(source).toContain('uniform vec3  iChannelResolution[4];');
  });

  it('declares core and touch uniforms', () => {
    const { source } = build();
    for (const decl of ['iResolution', 'iTime', 'iTimeDelta', 'iFrame', 'iMouse', 'iDate', 'iFrameRate', 'iTouchCount', 'iPinch']) {
      expect(source).toContain(decl);
    }
  });

  it('wraps mainImage in a main() that writes fragColor', () => {
    const { source } = build();
    expect(source).toContain('mainImage(fragColor, gl_FragCoord.xy);');
    expect(source.startsWith('#version 300 es')).toBe(true);
  });
});

describe('standard mode (named samplers)', () => {
  it('declares named samplers with resolution uniforms, no iChannels', () => {
    const samplers = new Map<string, ChannelSource>([
      ['velocity', { kind: 'buffer', buffer: 'BufferA', current: false }],
    ]);
    const { source } = build({ namedSamplers: samplers });
    expect(source).toContain('uniform sampler2D velocity;');
    expect(source).toContain('uniform vec3 velocity_resolution;');
    expect(source).not.toContain('uniform sampler2D iChannel0;');
  });

  it('injects keyboard helpers only when a keyboard sampler is bound', () => {
    const withKeyboard = build({
      namedSamplers: new Map<string, ChannelSource>([['keyboard', { kind: 'keyboard' }]]),
    });
    expect(withKeyboard.source).toContain('const int KEY_A = 65;');
    expect(withKeyboard.source).toContain('float keyDown(int key)');

    const without = build({
      namedSamplers: new Map<string, ChannelSource>([['tex', { kind: 'texture', name: 'tex0', cubemap: false }]]),
    });
    expect(without.source).not.toContain('KEY_A');
  });
});

describe('custom uniforms and UBOs', () => {
  it('declares scalar custom uniforms', () => {
    const { source } = build({
      uniforms: {
        uSpeed: { type: 'float', value: 1 },
        uOn: { type: 'bool', value: true },
        uColor: { type: 'vec3', value: [1, 0, 0] },
      },
    });
    expect(source).toContain('uniform float uSpeed;');
    expect(source).toContain('uniform bool uOn;');
    expect(source).toContain('uniform vec3 uColor;');
  });

  it('emits std140 blocks and _count uniforms for plain array uniforms', () => {
    const { source } = build({
      ubos: [{ name: 'positions', def: { type: 'vec4', count: 100 } as any, count: 100 }],
      uniforms: { positions: { type: 'vec4', count: 100 } },
    });
    expect(source).toContain('layout(std140) uniform _ub_positions {');
    expect(source).toContain('vec4 positions[100];');
    expect(source).toContain('uniform int positions_count;');
    // UBO uniform must not also be declared as a scalar
    expect(source).not.toContain('uniform vec4 positions;');
  });

  it('emits struct definitions for struct array uniforms', () => {
    const def = { struct: { position: 'vec3', color: 'vec4' }, count: 8 } as any;
    const { source } = build({
      ubos: [{ name: 'seeds', def, count: 8, structLayout: computeStructLayout(def.struct) }],
      uniforms: { seeds: def },
    });
    expect(source).toContain('struct _st_seeds {');
    expect(source).toContain('vec3 position;');
    expect(source).toContain('_st_seeds seeds[8];');
  });
});

describe('line mapping', () => {
  it('userCodeStartLine points at the first line of user source', () => {
    const { source, lineMapping } = build();
    const lines = source.split('\n');
    // lineMapping is 1-indexed
    expect(lines[lineMapping.userCodeStartLine - 1]).toBe(USER_SOURCE.split('\n')[0]);
  });

  it('commonStartLine points at the first line of common source', () => {
    const common = 'float shared_fn() { return 1.0; }';
    const { source, lineMapping } = build({ commonSource: common });
    const lines = source.split('\n');
    expect(lines[lineMapping.commonStartLine - 1]).toBe(common);
    expect(lineMapping.commonLines).toBe(1);
  });

  it('is zero when there is no common code', () => {
    const { lineMapping } = build();
    expect(lineMapping.commonStartLine).toBe(0);
    expect(lineMapping.commonLines).toBe(0);
  });
});

describe('cubemap preprocessing', () => {
  const cubemapChannel: ChannelSource[] = [
    { kind: 'texture', name: 'tex0', cubemap: true },
    { kind: 'none' },
    { kind: 'none' },
    { kind: 'none' },
  ];

  it('rewrites texture() calls on cubemap channels to equirectangular lookup', () => {
    const src = `void mainImage(out vec4 o, in vec2 c) {
  o = texture(iChannel0, normalize(vec3(c, 1.0)));
}`;
    const { source } = build({}, cubemapChannel, src);
    expect(source).toContain('texture(iChannel0, _st_dirToEquirect(normalize(vec3(c, 1.0))))');
  });

  it('leaves non-cubemap channels untouched', () => {
    const src = `void mainImage(out vec4 o, in vec2 c) {
  o = texture(iChannel1, c);
}`;
    const { source } = build({}, cubemapChannel, src);
    expect(source).toContain('texture(iChannel1, c);');
    expect(source).not.toContain('_st_dirToEquirect(c)');
  });
});
