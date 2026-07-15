import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadProjectFromFiles } from '../src/project/loadProjectCore';
import type { FileLoader } from '../src/project/FileLoader';

const GLSL = 'void mainImage(out vec4 o, in vec2 c) { o = vec4(1.0); }';

/** In-memory FileLoader over a { path: content } map. */
function memLoader(files: Record<string, string>): FileLoader {
  return {
    async exists(path) { return path in files; },
    async readText(path) {
      if (!(path in files)) throw new Error(`File not found: ${path}`);
      return files[path];
    },
    async resolveImageUrl(path) { return path; },
    async listGlslFiles(dir) {
      const prefix = `${dir}/`;
      return Object.keys(files)
        .filter((p) => p.startsWith(prefix) && p.endsWith('.glsl') && !p.slice(prefix.length).includes('/'))
        .map((p) => p.slice(prefix.length));
    },
    async hasFiles(dir) { return Object.keys(files).some((p) => p.startsWith(`${dir}/`)); },
    joinPath(...parts) { return parts.join('/').replace(/\/\.\//g, '/').replace(/\/+/g, '/'); },
    baseName(path) { return path.split('/').pop() || path; },
  };
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('single-pass loading', () => {
  it('loads a folder with image.glsl', async () => {
    const project = await loadProjectFromFiles(memLoader({ 'demo/image.glsl': GLSL }), 'demo');
    expect(project.mode).toBe('standard');
    expect(project.passes.Image?.glslSource).toBe(GLSL);
  });

  it('falls back to a bare <root>.glsl file (CLI bare-shader support)', async () => {
    const project = await loadProjectFromFiles(memLoader({ 'shaders/wave.glsl': GLSL }), 'shaders/wave');
    expect(project.passes.Image?.glslSource).toBe(GLSL);
  });

  it('errors clearly when neither exists', async () => {
    await expect(loadProjectFromFiles(memLoader({}), 'demo')).rejects.toThrow(/image\.glsl/);
  });
});

describe('shadertoy mode', () => {
  const files = {
    'demo/config.json': JSON.stringify({
      mode: 'shadertoy',
      uniforms: { uSpeed: { type: 'float', value: 2 } },
      BufferA: { iChannel0: 'BufferA' },
      Image: { iChannel0: 'BufferA' },
    }),
    'demo/image.glsl': GLSL,
    'demo/bufferA.glsl': GLSL,
  };

  it('passes custom uniforms through (previously silently dropped)', async () => {
    const project = await loadProjectFromFiles(memLoader(files), 'demo');
    expect(project.uniforms.uSpeed).toEqual({ type: 'float', value: 2 });
  });

  it('binds buffer channels', async () => {
    const project = await loadProjectFromFiles(memLoader(files), 'demo');
    expect(project.passes.Image?.channels[0]).toEqual({ kind: 'buffer', buffer: 'BufferA', current: false });
  });

  it('loads uniform data files in shadertoy mode', async () => {
    const project = await loadProjectFromFiles(
      memLoader({
        'demo/config.json': JSON.stringify({
          mode: 'shadertoy',
          uniforms: { positions: { type: 'vec3', count: 2, data: './data.json' } },
        }),
        'demo/image.glsl': GLSL,
        'demo/data.json': JSON.stringify([[1, 2, 3], [4, 5, 6]]),
      }),
      'demo',
    );
    expect(project.uniformData.positions).toEqual([[1, 2, 3], [4, 5, 6]]);
  });
});

describe('standard mode', () => {
  it('honors pass-level iChannel bindings (previously silently ignored)', async () => {
    const project = await loadProjectFromFiles(
      memLoader({
        'demo/config.json': JSON.stringify({
          BufferA: { iChannel0: 'BufferA' },
          Image: { iChannel0: 'BufferA' },
        }),
        'demo/image.glsl': GLSL,
        'demo/bufferA.glsl': GLSL,
      }),
      'demo',
    );
    expect(project.mode).toBe('standard');
    expect(project.passes.BufferA).toBeDefined();
    expect(project.passes.Image?.channels[0]).toEqual({ kind: 'buffer', buffer: 'BufferA', current: false });
  });

  it('carries named-buffer filter/wrap options onto the pass (previously discarded)', async () => {
    const project = await loadProjectFromFiles(
      memLoader({
        'demo/config.json': JSON.stringify({
          buffers: { pressure: { filter: 'nearest', wrap: 'clamp' }, velocity: {} },
        }),
        'demo/image.glsl': GLSL,
        'demo/pressure.glsl': GLSL,
        'demo/velocity.glsl': GLSL,
      }),
      'demo',
    );
    // First named buffer maps to BufferA
    expect(project.passes.BufferA?.bufferOptions).toEqual({ filter: 'nearest', wrap: 'clamp' });
    expect(project.passes.BufferB?.bufferOptions).toBeUndefined();
  });

  it('exposes named samplers for buffers and textures', async () => {
    const project = await loadProjectFromFiles(
      memLoader({
        'demo/config.json': JSON.stringify({ buffers: { velocity: {} }, textures: { kb: 'keyboard' } }),
        'demo/image.glsl': GLSL,
        'demo/velocity.glsl': GLSL,
      }),
      'demo',
    );
    const samplers = project.passes.Image?.namedSamplers;
    expect(samplers?.get('velocity')).toEqual({ kind: 'buffer', buffer: 'BufferA', current: false });
    expect(samplers?.get('kb')).toEqual({ kind: 'keyboard' });
  });
});

describe('current: true validation', () => {
  it('rejects a self-reference with current: true', async () => {
    await expect(
      loadProjectFromFiles(
        memLoader({
          'demo/config.json': JSON.stringify({
            mode: 'shadertoy',
            BufferA: { iChannel0: { buffer: 'BufferA', current: true } },
            Image: { iChannel0: 'BufferA' },
          }),
          'demo/image.glsl': GLSL,
          'demo/bufferA.glsl': GLSL,
        }),
        'demo',
      ),
    ).rejects.toThrow(/self-reference/);
  });

  it('rejects current: true against a later-running pass', async () => {
    await expect(
      loadProjectFromFiles(
        memLoader({
          'demo/config.json': JSON.stringify({
            mode: 'shadertoy',
            BufferA: { iChannel0: { buffer: 'BufferB', current: true } },
            BufferB: {},
            Image: {},
          }),
          'demo/image.glsl': GLSL,
          'demo/bufferA.glsl': GLSL,
          'demo/bufferB.glsl': GLSL,
        }),
        'demo',
      ),
    ).rejects.toThrow(/requires 'BufferB' to run before/);
  });

  it('accepts current: true when the source runs earlier', async () => {
    const project = await loadProjectFromFiles(
      memLoader({
        'demo/config.json': JSON.stringify({
          mode: 'shadertoy',
          BufferA: {},
          Image: { iChannel0: { buffer: 'BufferA', current: true } },
        }),
        'demo/image.glsl': GLSL,
        'demo/bufferA.glsl': GLSL,
      }),
      'demo',
    );
    expect(project.passes.Image?.channels[0]).toEqual({ kind: 'buffer', buffer: 'BufferA', current: true });
  });
});

describe('multi-view guard', () => {
  it('rejects multi-view configs outside the dev server with a clear message', async () => {
    await expect(
      loadProjectFromFiles(
        memLoader({ 'demo/config.json': JSON.stringify({ views: ['a', 'b'] }) }),
        'demo',
      ),
    ).rejects.toThrow(/only supported by the dev server/);
  });
});
