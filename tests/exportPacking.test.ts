import { describe, it, expect } from 'vitest';
import { packTightToStd140 } from '../src/app/exportHTML';
import {
  packStd140,
  packStructStd140,
  computeStructLayout,
  std140FloatCount,
  tightFloatCount,
} from '../src/engine/std140';
import type { ArrayUniformType } from '../src/project/types';

/**
 * packTightToStd140 is embedded into exported HTML via .toString() — this
 * test is the drift guard that keeps it behaviorally identical to the
 * engine's std140 packers.
 */

const PLAIN_TYPES: ArrayUniformType[] = ['float', 'vec2', 'vec3', 'vec4', 'mat3', 'mat4'];

function plainFields(type: ArrayUniformType) {
  return [{ offsetFloats: 0, tightFloats: tightFloatCount(type, 1), type }];
}

describe('export packer matches engine packer', () => {
  it.each(PLAIN_TYPES)('plain %s arrays pack identically', (type) => {
    const count = 3;
    const tight = Float32Array.from(
      { length: tightFloatCount(type, count) },
      (_, i) => (i + 1) * 0.5,
    );

    const engineOut = new Float32Array(std140FloatCount(type, count));
    packStd140(type, count, tight, engineOut);

    const exportOut = new Float32Array(std140FloatCount(type, count));
    packTightToStd140(plainFields(type), std140FloatCount(type, 1), count, tight, exportOut);

    expect([...exportOut]).toEqual([...engineOut]);
  });

  it('struct arrays pack identically', () => {
    const struct = { position: 'vec3', weight: 'float', transform: 'mat3', color: 'vec4' } as const;
    const layout = computeStructLayout(struct as Record<string, ArrayUniformType>);
    const count = 2;

    // Engine path: per-field tight arrays
    const fieldData: Record<string, Float32Array> = {};
    let seed = 1;
    for (const f of layout.fields) {
      fieldData[f.name] = Float32Array.from({ length: f.tightFloats * count }, () => seed++ * 0.25);
    }
    const engineOut = new Float32Array(layout.strideFloats * count);
    packStructStd140(layout, count, fieldData, engineOut);

    // Export path: interleaved tight data (element-major, fields in order)
    const tightPerElement = layout.tightFloatsPerElement;
    const tight = new Float32Array(tightPerElement * count);
    for (let i = 0; i < count; i++) {
      let off = i * tightPerElement;
      for (const f of layout.fields) {
        for (let j = 0; j < f.tightFloats; j++) {
          tight[off + j] = fieldData[f.name][i * f.tightFloats + j];
        }
        off += f.tightFloats;
      }
    }
    const exportFields = layout.fields.map(f => ({
      offsetFloats: f.offsetBytes / 4,
      tightFloats: f.tightFloats,
      type: f.type,
    }));
    const exportOut = new Float32Array(layout.strideFloats * count);
    packTightToStd140(exportFields, layout.strideFloats, count, tight, exportOut);

    expect([...exportOut]).toEqual([...engineOut]);
  });

  it('is self-contained enough to survive toString() embedding', () => {
    const source = packTightToStd140.toString();
    // No references to imports or module-scope helpers
    expect(source).not.toMatch(/std140_|tightFloatCount|computeStructLayout|import|require/);
    // Round-trip through the serialized form (what exports actually run)
    // eslint-disable-next-line no-new-func
    const revived = new Function(`return (${source})`)() as typeof packTightToStd140;
    const out = new Float32Array(8);
    revived([{ offsetFloats: 0, tightFloats: 3, type: 'vec3' }], 4, 2, [1, 2, 3, 4, 5, 6], out);
    expect([...out]).toEqual([1, 2, 3, 0, 4, 5, 6, 0]);
  });
});
