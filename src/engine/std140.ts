/**
 * std140 Layout Packing Utilities
 *
 * Handles conversion from tightly-packed user data to std140 layout
 * required by WebGL2 Uniform Buffer Objects.
 *
 * std140 array element rules:
 * - Every array element is rounded up to a vec4 (16 bytes) stride
 * - float[N]: 4 bytes data + 12 bytes padding per element
 * - vec2[N]:  8 bytes data + 8 bytes padding per element
 * - vec3[N]:  12 bytes data + 4 bytes padding per element
 * - vec4[N]:  16 bytes, no padding
 * - mat3[N]:  3 columns of vec4 (padded) = 48 bytes per element
 * - mat4[N]:  4 columns of vec4 = 64 bytes, no padding needed
 */

import { ArrayUniformType } from '../project/types';

/** Number of floats per element in tightly-packed user data */
const TIGHT_FLOATS: Record<ArrayUniformType, number> = {
  float: 1,
  vec2: 2,
  vec3: 3,
  vec4: 4,
  mat3: 9,
  mat4: 16,
};

/** Number of floats per array element in std140 layout */
const STD140_STRIDE_FLOATS: Record<ArrayUniformType, number> = {
  float: 4,   // 1 float + 3 padding
  vec2: 4,    // 2 floats + 2 padding
  vec3: 4,    // 3 floats + 1 padding
  vec4: 4,    // 4 floats, naturally aligned
  mat3: 12,   // 3 columns × 4 floats (vec3 padded to vec4)
  mat4: 16,   // 4 columns × 4 floats, no padding
};

/**
 * Number of tightly-packed floats for a given type and count.
 */
export function tightFloatCount(type: ArrayUniformType, count: number): number {
  return TIGHT_FLOATS[type] * count;
}

/**
 * Compute the total byte size of a std140 uniform block for an array.
 */
export function std140ByteSize(type: ArrayUniformType, count: number): number {
  return STD140_STRIDE_FLOATS[type] * count * 4; // 4 bytes per float
}

/**
 * Compute the total number of floats in std140 layout for a given type and count.
 */
export function std140FloatCount(type: ArrayUniformType, count: number): number {
  return STD140_STRIDE_FLOATS[type] * count;
}

/**
 * Pack tightly-packed user data into std140 layout.
 *
 * For mat4 and vec4, the tight layout is already std140-compatible,
 * so this returns the input directly (no copy).
 *
 * For other types, allocates a new Float32Array with proper padding.
 *
 * @param type - The GLSL type of each array element
 * @param count - Number of elements
 * @param tightData - User-provided tightly-packed data
 * @param out - Optional pre-allocated output buffer (reused across frames)
 */
export function packStd140(
  type: ArrayUniformType,
  count: number,
  tightData: Float32Array,
  out?: Float32Array
): Float32Array {
  const tightPerElement = TIGHT_FLOATS[type];
  const strideFloats = STD140_STRIDE_FLOATS[type];

  // Fast path: mat4 and vec4 are already std140-compatible
  if (tightPerElement === strideFloats) {
    return tightData;
  }

  const totalFloats = strideFloats * count;
  const result = out && out.length >= totalFloats ? out : new Float32Array(totalFloats);

  if (type === 'mat3') {
    // mat3: 9 tight floats → 3 columns of vec4 (12 floats)
    // Column-major: tight = [c0r0, c0r1, c0r2, c1r0, c1r1, c1r2, c2r0, c2r1, c2r2]
    // std140:       [c0r0, c0r1, c0r2, 0, c1r0, c1r1, c1r2, 0, c2r0, c2r1, c2r2, 0]
    for (let i = 0; i < count; i++) {
      const srcOff = i * 9;
      const dstOff = i * 12;
      // Column 0
      result[dstOff + 0] = tightData[srcOff + 0];
      result[dstOff + 1] = tightData[srcOff + 1];
      result[dstOff + 2] = tightData[srcOff + 2];
      result[dstOff + 3] = 0;
      // Column 1
      result[dstOff + 4] = tightData[srcOff + 3];
      result[dstOff + 5] = tightData[srcOff + 4];
      result[dstOff + 6] = tightData[srcOff + 5];
      result[dstOff + 7] = 0;
      // Column 2
      result[dstOff + 8] = tightData[srcOff + 6];
      result[dstOff + 9] = tightData[srcOff + 7];
      result[dstOff + 10] = tightData[srcOff + 8];
      result[dstOff + 11] = 0;
    }
  } else {
    // float, vec2, vec3: pad each element to 4 floats
    for (let i = 0; i < count; i++) {
      const srcOff = i * tightPerElement;
      const dstOff = i * 4;
      for (let j = 0; j < tightPerElement; j++) {
        result[dstOff + j] = tightData[srcOff + j];
      }
      // Remaining floats stay 0 (from Float32Array initialization or previous clear)
      for (let j = tightPerElement; j < 4; j++) {
        result[dstOff + j] = 0;
      }
    }
  }

  return result;
}

/**
 * Get the GLSL type string for use in uniform block declarations.
 */
export function glslTypeName(type: ArrayUniformType): string {
  return type; // float, vec2, vec3, vec4, mat3, mat4 are already valid GLSL
}

// =============================================================================
// Struct Layout
// =============================================================================

/** Alignment in bytes for each type in std140 layout */
const STD140_ALIGN_BYTES: Record<ArrayUniformType, number> = {
  float: 4, vec2: 8, vec3: 16, vec4: 16, mat3: 16, mat4: 16,
};

/** Actual data size in bytes for each type (before padding) */
const STD140_SIZE_BYTES: Record<ArrayUniformType, number> = {
  float: 4, vec2: 8, vec3: 12, vec4: 16, mat3: 48, mat4: 64,
};

/** Layout of a single field within a struct */
export interface StructFieldLayout {
  name: string;
  type: ArrayUniformType;
  /** Byte offset within one struct element */
  offsetBytes: number;
  /** Actual data size in bytes */
  sizeBytes: number;
  /** Number of user-facing floats for this field */
  tightFloats: number;
}

/** Computed layout for a struct array */
export interface StructLayout {
  fields: StructFieldLayout[];
  /** Total bytes per struct element (padded to base alignment) */
  strideBytes: number;
  /** strideBytes / 4 */
  strideFloats: number;
  /** Sum of all fields' tightFloats */
  tightFloatsPerElement: number;
}

function roundUp(value: number, alignment: number): number {
  return Math.ceil(value / alignment) * alignment;
}

/**
 * Compute the std140 layout for a struct with the given fields.
 * Fields are processed in insertion order (Object.keys preserves JSON key order).
 */
export function computeStructLayout(struct: Record<string, ArrayUniformType>): StructLayout {
  const fields: StructFieldLayout[] = [];
  let offset = 0;
  let maxAlign = 0;
  let totalTight = 0;

  for (const [name, type] of Object.entries(struct)) {
    const align = STD140_ALIGN_BYTES[type];
    const size = STD140_SIZE_BYTES[type];
    const tight = TIGHT_FLOATS[type];

    offset = roundUp(offset, align);
    fields.push({ name, type, offsetBytes: offset, sizeBytes: size, tightFloats: tight });
    offset += size;
    maxAlign = Math.max(maxAlign, align);
    totalTight += tight;
  }

  // Struct base alignment is rounded up to vec4 (16 bytes)
  const baseAlign = roundUp(Math.max(maxAlign, 16), 16);
  const strideBytes = roundUp(offset, baseAlign);

  return {
    fields,
    strideBytes,
    strideFloats: strideBytes / 4,
    tightFloatsPerElement: totalTight,
  };
}

/**
 * Total byte size of a struct array in std140 layout.
 */
export function std140StructByteSize(layout: StructLayout, count: number): number {
  return layout.strideBytes * count;
}

/**
 * Pack per-field data into std140 struct array layout.
 *
 * @param layout - Computed struct layout
 * @param count - Number of elements to pack
 * @param fieldData - Map of field name → tightly-packed Float32Array (count × tightFloats values)
 * @param out - Optional pre-allocated output buffer
 */
export function packStructStd140(
  layout: StructLayout,
  count: number,
  fieldData: Record<string, Float32Array>,
  out?: Float32Array,
): Float32Array {
  const totalFloats = layout.strideFloats * count;
  const result = out && out.length >= totalFloats ? out : new Float32Array(totalFloats);

  for (let i = 0; i < count; i++) {
    const elementBase = i * layout.strideFloats;

    for (const field of layout.fields) {
      const dstOffset = elementBase + field.offsetBytes / 4;
      const srcOffset = i * field.tightFloats;
      const src = fieldData[field.name];
      if (!src) continue;

      if (field.type === 'mat3') {
        // mat3: 9 tight floats → 3 columns of vec4 (12 floats with padding)
        for (let col = 0; col < 3; col++) {
          result[dstOffset + col * 4 + 0] = src[srcOffset + col * 3 + 0] ?? 0;
          result[dstOffset + col * 4 + 1] = src[srcOffset + col * 3 + 1] ?? 0;
          result[dstOffset + col * 4 + 2] = src[srcOffset + col * 3 + 2] ?? 0;
          result[dstOffset + col * 4 + 3] = 0;
        }
      } else {
        // float, vec2, vec3, vec4, mat4: copy tight data directly
        for (let j = 0; j < field.tightFloats; j++) {
          result[dstOffset + j] = src[srcOffset + j] ?? 0;
        }
      }
    }
  }

  return result;
}

/**
 * Pack a single struct element into an existing std140 buffer.
 *
 * @param layout - Computed struct layout
 * @param index - Element index
 * @param fieldValues - Map of field name → value array
 * @param out - Target buffer (modified in place)
 */
export function packStructElementStd140(
  layout: StructLayout,
  index: number,
  fieldValues: Record<string, number[]>,
  out: Float32Array,
): void {
  const elementBase = index * layout.strideFloats;

  for (const field of layout.fields) {
    const vals = fieldValues[field.name];
    if (!vals) continue;

    const dstOffset = elementBase + field.offsetBytes / 4;

    if (field.type === 'mat3') {
      for (let col = 0; col < 3; col++) {
        out[dstOffset + col * 4 + 0] = vals[col * 3 + 0] ?? 0;
        out[dstOffset + col * 4 + 1] = vals[col * 3 + 1] ?? 0;
        out[dstOffset + col * 4 + 2] = vals[col * 3 + 2] ?? 0;
        out[dstOffset + col * 4 + 3] = 0;
      }
    } else {
      for (let j = 0; j < field.tightFloats; j++) {
        out[dstOffset + j] = vals[j] ?? 0;
      }
    }
  }
}
