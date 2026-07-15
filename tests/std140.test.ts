import { describe, it, expect } from 'vitest';
import {
  tightFloatCount,
  std140ByteSize,
  std140FloatCount,
  packStd140,
  computeStructLayout,
  std140StructByteSize,
  packStructStd140,
  packStructElementStd140,
} from '../src/engine/std140';

describe('sizes and strides', () => {
  it('computes tight float counts', () => {
    expect(tightFloatCount('float', 3)).toBe(3);
    expect(tightFloatCount('vec2', 3)).toBe(6);
    expect(tightFloatCount('vec3', 3)).toBe(9);
    expect(tightFloatCount('vec4', 3)).toBe(12);
    expect(tightFloatCount('mat3', 2)).toBe(18);
    expect(tightFloatCount('mat4', 2)).toBe(32);
  });

  it('rounds every array element up to a vec4 stride', () => {
    expect(std140FloatCount('float', 5)).toBe(20);
    expect(std140FloatCount('vec2', 5)).toBe(20);
    expect(std140FloatCount('vec3', 5)).toBe(20);
    expect(std140FloatCount('vec4', 5)).toBe(20);
    expect(std140FloatCount('mat3', 5)).toBe(60); // 3 padded columns
    expect(std140FloatCount('mat4', 5)).toBe(80);
    expect(std140ByteSize('vec3', 5)).toBe(80); // 4 floats x 5 x 4 bytes
  });
});

describe('packStd140', () => {
  it('pads float elements to vec4 stride', () => {
    const packed = packStd140('float', 3, new Float32Array([1, 2, 3]));
    expect([...packed]).toEqual([1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0]);
  });

  it('pads vec2 elements to vec4 stride', () => {
    const packed = packStd140('vec2', 2, new Float32Array([1, 2, 3, 4]));
    expect([...packed]).toEqual([1, 2, 0, 0, 3, 4, 0, 0]);
  });

  it('pads vec3 elements to vec4 stride', () => {
    const packed = packStd140('vec3', 2, new Float32Array([1, 2, 3, 4, 5, 6]));
    expect([...packed]).toEqual([1, 2, 3, 0, 4, 5, 6, 0]);
  });

  it('pads mat3 columns to vec4', () => {
    const packed = packStd140('mat3', 1, new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    expect([...packed]).toEqual([1, 2, 3, 0, 4, 5, 6, 0, 7, 8, 9, 0]);
  });

  it('returns vec4 and mat4 data unchanged (naturally aligned)', () => {
    const vec4Data = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...packStd140('vec4', 2, vec4Data)]).toEqual([...vec4Data]);

    const mat4Data = new Float32Array(16).map((_, i) => i);
    expect([...packStd140('mat4', 1, mat4Data)]).toEqual([...mat4Data]);
  });

  it('writes into a provided out buffer for padded types', () => {
    const out = new Float32Array(8);
    const result = packStd140('vec2', 2, new Float32Array([1, 2, 3, 4]), out);
    expect(result).toBe(out);
    expect([...out]).toEqual([1, 2, 0, 0, 3, 4, 0, 0]);
  });

  it('stale padding in a reused out buffer is overwritten', () => {
    const out = new Float32Array([9, 9, 9, 9, 9, 9, 9, 9]);
    packStd140('vec3', 2, new Float32Array([1, 2, 3, 4, 5, 6]), out);
    expect([...out]).toEqual([1, 2, 3, 0, 4, 5, 6, 0]);
  });
});

describe('computeStructLayout', () => {
  it('lays out { vec3, vec4 } with vec4 alignment', () => {
    const layout = computeStructLayout({ position: 'vec3', color: 'vec4' });
    expect(layout.fields[0]).toMatchObject({ name: 'position', offsetBytes: 0, sizeBytes: 12 });
    expect(layout.fields[1]).toMatchObject({ name: 'color', offsetBytes: 16, sizeBytes: 16 });
    expect(layout.strideBytes).toBe(32);
    expect(layout.tightFloatsPerElement).toBe(7);
  });

  it('aligns vec2 after float and rounds stride to 16', () => {
    const layout = computeStructLayout({ a: 'float', b: 'vec2' });
    expect(layout.fields[0].offsetBytes).toBe(0);
    expect(layout.fields[1].offsetBytes).toBe(8); // vec2 aligns to 8
    expect(layout.strideBytes).toBe(16);
  });

  it('gives mat3 fields three padded columns', () => {
    const layout = computeStructLayout({ m: 'mat3', f: 'float' });
    expect(layout.fields[0]).toMatchObject({ offsetBytes: 0, sizeBytes: 48 });
    expect(layout.fields[1].offsetBytes).toBe(48);
    expect(layout.strideBytes).toBe(64);
    expect(std140StructByteSize(layout, 10)).toBe(640);
  });
});

describe('packStructStd140', () => {
  it('packs per-field data at the right offsets', () => {
    const layout = computeStructLayout({ position: 'vec3', color: 'vec4' });
    const packed = packStructStd140(layout, 2, {
      position: new Float32Array([1, 2, 3, 4, 5, 6]),
      color: new Float32Array([10, 11, 12, 13, 20, 21, 22, 23]),
    });
    // Element 0: vec3 at floats 0-2 (pad at 3), vec4 at floats 4-7
    expect([...packed.subarray(0, 8)]).toEqual([1, 2, 3, 0, 10, 11, 12, 13]);
    // Element 1 starts at strideFloats = 8
    expect([...packed.subarray(8, 16)]).toEqual([4, 5, 6, 0, 20, 21, 22, 23]);
  });

  it('packStructElementStd140 updates a single element in place', () => {
    const layout = computeStructLayout({ position: 'vec3', color: 'vec4' });
    const buf = new Float32Array(layout.strideFloats * 2);
    packStructElementStd140(layout, 1, { position: [7, 8, 9], color: [1, 0, 0, 1] }, buf);
    expect([...buf.subarray(0, 8)]).toEqual([0, 0, 0, 0, 0, 0, 0, 0]); // element 0 untouched
    expect([...buf.subarray(8, 16)]).toEqual([7, 8, 9, 0, 1, 0, 0, 1]);
  });
});
