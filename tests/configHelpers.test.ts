import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isPassName,
  parseChannelValue,
  isValidGLSLIdentifier,
  validateConfig,
  validateMultiViewConfig,
} from '../src/project/configHelpers';

describe('isPassName', () => {
  it('accepts the five pass names and nothing else', () => {
    for (const name of ['Image', 'BufferA', 'BufferB', 'BufferC', 'BufferD']) {
      expect(isPassName(name)).toBe(true);
    }
    expect(isPassName('bufferA')).toBe(false);
    expect(isPassName('BufferE')).toBe(false);
    expect(isPassName('')).toBe(false);
  });
});

describe('parseChannelValue', () => {
  it('parses string shortcuts', () => {
    expect(parseChannelValue('BufferA')).toEqual({ buffer: 'BufferA' });
    expect(parseChannelValue('keyboard')).toEqual({ keyboard: true });
    expect(parseChannelValue('audio')).toEqual({ audio: true });
    expect(parseChannelValue('webcam')).toEqual({ webcam: true });
    expect(parseChannelValue('photo.jpg')).toEqual({ texture: 'photo.jpg' });
  });

  it('passes objects through unchanged', () => {
    expect(parseChannelValue({ buffer: 'BufferB' })).toEqual({ buffer: 'BufferB' });
  });
});

describe('isValidGLSLIdentifier', () => {
  it('accepts valid identifiers', () => {
    expect(isValidGLSLIdentifier('uSpeed')).toBe(true);
    expect(isValidGLSLIdentifier('_private')).toBe(true);
    expect(isValidGLSLIdentifier('a1')).toBe(true);
  });

  it('rejects invalid identifiers and GLSL reserved words', () => {
    expect(isValidGLSLIdentifier('1abc')).toBe(false);
    expect(isValidGLSLIdentifier('has-dash')).toBe(false);
    expect(isValidGLSLIdentifier('vec3')).toBe(false);
    expect(isValidGLSLIdentifier('uniform')).toBe(false);
    expect(isValidGLSLIdentifier('')).toBe(false);
  });
});

describe('validateConfig', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('accepts a minimal valid config', () => {
    expect(() => validateConfig({}, 'test')).not.toThrow();
    expect(() =>
      validateConfig(
        {
          layout: 'split',
          theme: 'dark',
          uniforms: { uSpeed: { type: 'float', value: 1 } },
          buffers: { velocity: {} },
          textures: { heightmap: 'terrain.png' },
        },
        'test',
      ),
    ).not.toThrow();
  });

  it('rejects an invalid layout', () => {
    expect(() => validateConfig({ layout: 'sideways' }, 'test')).toThrow(/Invalid layout/);
  });

  it('rejects an invalid theme', () => {
    expect(() => validateConfig({ theme: 'neon' }, 'test')).toThrow(/Invalid theme/);
  });

  it('accepts every documented theme, including the default "auto"', () => {
    for (const theme of ['auto', 'light', 'dark', 'system']) {
      expect(() => validateConfig({ theme }, 'test')).not.toThrow();
    }
  });

  it('rejects string-typed booleans like "controls": "false"', () => {
    expect(() => validateConfig({ controls: 'false' }, 'test')).toThrow(/'controls' must be true or false/);
    expect(() => validateConfig({ startPaused: 1 }, 'test')).toThrow(/'startPaused' must be true or false/);
    expect(() => validateConfig({ controls: false, stats: true }, 'test')).not.toThrow();
  });

  it('rejects non-positive or non-numeric pixelRatio', () => {
    expect(() => validateConfig({ pixelRatio: 0 }, 'test')).toThrow(/pixelRatio/);
    expect(() => validateConfig({ pixelRatio: -1 }, 'test')).toThrow(/pixelRatio/);
    expect(() => validateConfig({ pixelRatio: '2' }, 'test')).toThrow(/pixelRatio/);
    expect(() => validateConfig({ pixelRatio: 0.5 }, 'test')).not.toThrow();
  });

  it('rejects unknown uniformsUI values', () => {
    expect(() => validateConfig({ uniformsUI: 'sidebar' }, 'test')).toThrow(/Invalid uniformsUI/);
    for (const v of ['panel', 'inline', 'off']) {
      expect(() => validateConfig({ uniformsUI: v }, 'test')).not.toThrow();
    }
  });

  it('rejects named buffers/textures in shadertoy mode', () => {
    expect(() => validateConfig({ mode: 'shadertoy', buffers: { v: {} } }, 'test')).toThrow(/not supported in shadertoy mode/);
    expect(() => validateConfig({ mode: 'shadertoy', textures: { t: 'a.png' } }, 'test')).toThrow(/not supported in shadertoy mode/);
  });

  it('rejects mixing iChannel bindings with named buffers/textures in standard mode', () => {
    expect(() =>
      validateConfig({ buffers: { v: {} }, Image: { iChannel0: 'BufferA' } }, 'test'),
    ).toThrow(/mutually exclusive|named buffers/);
    // iChannel bindings alone are fine in standard mode
    expect(() => validateConfig({ Image: { iChannel0: 'photo.jpg' } }, 'test')).not.toThrow();
  });

  it('validates buffer options', () => {
    expect(() => validateConfig({ buffers: { v: { filter: 'cubic' } } }, 'test')).toThrow(/invalid filter/);
    expect(() => validateConfig({ buffers: { v: { wrap: 'mirror' } } }, 'test')).toThrow(/invalid wrap/);
    expect(() => validateConfig({ buffers: { v: 'linear' } }, 'test')).toThrow(/must be an object/);
    expect(() =>
      validateConfig({ buffers: { v: { filter: 'nearest', wrap: 'repeat' } } }, 'test'),
    ).not.toThrow();
  });

  it('rejects reserved and invalid uniform names', () => {
    expect(() => validateConfig({ uniforms: { iTime: { type: 'float', value: 0 } } }, 'test')).toThrow(/reserved/);
    expect(() => validateConfig({ uniforms: { 'bad-name': { type: 'float', value: 0 } } }, 'test')).toThrow(
      /not a valid GLSL identifier/,
    );
  });

  it('rejects buffer/texture name collisions and bad texture sources', () => {
    expect(() =>
      validateConfig({ buffers: { velocity: {} }, textures: { velocity: 'a.png' } }, 'test'),
    ).toThrow(/collides/);
    expect(() => validateConfig({ textures: { t: '!!!' } }, 'test')).toThrow(/Invalid texture source/);
  });

  it('warns (does not throw) on unknown top-level keys', () => {
    expect(() => validateConfig({ bogusOption: 1 }, 'test')).not.toThrow();
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("Unknown config key 'bogusOption'"));
  });

  it('warns when a channel references an unconfigured buffer pass', () => {
    validateConfig({ Image: { iChannel0: 'BufferA' } }, 'test');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("references 'BufferA'"));
  });
});

describe('validateMultiViewConfig', () => {
  it('requires at least two uniquely named views', () => {
    expect(() => validateMultiViewConfig({ views: ['a'] } as any, 'test')).toThrow(/at least 2/);
    expect(() => validateMultiViewConfig({ views: ['a', 'a'] } as any, 'test')).toThrow(/Duplicate/);
    expect(() => validateMultiViewConfig({ views: ['a', 'b'] } as any, 'test')).not.toThrow();
  });

  it('rejects invalid multi-view layouts', () => {
    expect(() => validateMultiViewConfig({ views: ['a', 'b'], layout: 'stack' } as any, 'test')).toThrow(
      /Invalid multi-view layout/,
    );
  });
});
