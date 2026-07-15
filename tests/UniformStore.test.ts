import { describe, it, expect } from 'vitest';
import { UniformStore } from '../src/uniforms/UniformStore';

describe('UniformStore', () => {
  it('initializes scalar values from definition defaults', () => {
    const store = new UniformStore({
      uSpeed: { type: 'float', value: 2.5 },
      uColor: { type: 'vec3', value: [1, 0.5, 0.2] },
    } as any);
    expect(store.get('uSpeed')).toBe(2.5);
    expect(store.get('uColor')).toEqual([1, 0.5, 0.2]);
  });

  it('clones on init: mutating a returned value never corrupts the default', () => {
    const defs = { uColor: { type: 'vec3', value: [1, 0.5, 0.2] } } as any;
    const store = new UniformStore(defs);

    const v = store.get('uColor') as number[];
    v[0] = 999;

    expect(store.get('uColor')).toEqual([1, 0.5, 0.2]); // internal state unaffected
    expect(defs.uColor.value).toEqual([1, 0.5, 0.2]); // definition unaffected
  });

  it('clones on set: caller-owned arrays stay caller-owned', () => {
    const store = new UniformStore({ uColor: { type: 'vec3', value: [0, 0, 0] } } as any);
    const mine = [1, 2, 3];
    store.set('uColor', mine);
    mine[0] = 999;
    expect(store.get('uColor')).toEqual([1, 2, 3]);
  });

  it('set returns false for unknown uniforms', () => {
    const store = new UniformStore({} as any);
    expect(store.set('nope', 1)).toBe(false);
    expect(store.get('nope')).toBeUndefined();
  });

  it('reset restores the definition default', () => {
    const store = new UniformStore({ uSpeed: { type: 'float', value: 1 } } as any);
    store.set('uSpeed', 5);
    expect(store.get('uSpeed')).toBe(5);
    store.reset('uSpeed');
    expect(store.get('uSpeed')).toBe(1);
  });

  it('allocates zeroed tight buffers for array uniforms', () => {
    const store = new UniformStore({ positions: { type: 'vec3', count: 4 } } as any);
    const v = store.get('positions') as Float32Array;
    expect(v).toBeInstanceOf(Float32Array);
    expect(v.length).toBe(12); // 4 elements x 3 tight floats
    expect([...v]).toEqual(new Array(12).fill(0));
  });

  it('allocates tight buffers for struct array uniforms', () => {
    const store = new UniformStore({
      seeds: { struct: { position: 'vec3', color: 'vec4' }, count: 2 },
    } as any);
    const v = store.get('seeds') as Float32Array;
    expect(v.length).toBe(14); // 2 elements x (3 + 4) tight floats
  });

  it('getDefault returns a fresh clone each call', () => {
    const store = new UniformStore({ uColor: { type: 'vec3', value: [1, 2, 3] } } as any);
    const a = store.getDefault('uColor') as number[];
    a[0] = 999;
    expect(store.getDefault('uColor')).toEqual([1, 2, 3]);
  });
});
