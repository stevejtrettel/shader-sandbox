/**
 * UniformManager - Custom uniform state, validation, UBO packing, and GL binding
 *
 * Manages the lifecycle of user-defined uniforms: scalar uniforms with dirty tracking,
 * and array uniforms backed by std140-packed UBOs (plain arrays and struct arrays).
 */

import {
  UniformValue,
  UniformValues,
  UniformDefinitions,
  ArrayUniformDefinition,
  StructArrayUniformDefinition,
  isArrayUniform,
  isStructArrayUniform,
  isAnyUBOUniform,
} from '../project/types';

import { UniformStore } from '../uniforms/UniformStore';
import {
  std140ByteSize, std140FloatCount, tightFloatCount, packStd140,
  computeStructLayout, std140StructByteSize, packStructStd140, packStructElementStd140,
  StructLayout,
} from './std140';
import { PassUniformLocations } from './types';

// =============================================================================
// UBO Entry Types
// =============================================================================

/** Shared fields for all UBO-backed uniforms. */
interface UBOBase {
  name: string;
  buffer: WebGLBuffer;
  bindingPoint: number;
  byteSize: number;
  dirty: boolean;
  /** Pre-allocated std140-padded buffer, reused across frames */
  paddedData: Float32Array;
  /** Number of elements currently active (may be less than max count) */
  activeCount: number;
}

/** UBO for a plain typed array (e.g. vec3[100]) */
export interface PlainArrayUBO extends UBOBase {
  kind: 'array';
  def: ArrayUniformDefinition;
  /** Scratch buffer for flattening JS arrays, sized to tightFloatCount(type, count) */
  scratch: Float32Array;
}

/** UBO for a struct array (e.g. { pos: vec2, color: vec3 }[100]) */
export interface StructArrayUBO extends UBOBase {
  kind: 'struct';
  def: StructArrayUniformDefinition;
  layout: StructLayout;
  /** Per-field scratch buffers, each sized to field.tightFloats * count */
  fieldScratch: Record<string, Float32Array>;
}

export type UBOEntry = PlainArrayUBO | StructArrayUBO;

// =============================================================================
// UniformManager
// =============================================================================

export class UniformManager {
  private _store: UniformStore;
  private _ubos: UBOEntry[] = [];
  private _uboMap = new Map<string, UBOEntry>();
  private _dirtyScalars: Set<string> = new Set();
  private _uniforms: UniformDefinitions;

  constructor(gl: WebGL2RenderingContext, uniforms: UniformDefinitions, initialData?: Record<string, unknown>) {
    this._uniforms = uniforms;
    this._store = new UniformStore(uniforms);
    this.initUBOs(gl);
    if (initialData) this.applyInitialData(initialData);

    // Mark all scalar uniforms dirty so they bind on the first frame
    for (const [name, def] of Object.entries(uniforms)) {
      if (!isAnyUBOUniform(def)) {
        this._dirtyScalars.add(name);
      }
    }
  }

  // ===========================================================================
  // Accessors
  // ===========================================================================

  get ubos(): UBOEntry[] { return this._ubos; }
  get store(): UniformStore { return this._store; }

  // ===========================================================================
  // Get / Set
  // ===========================================================================

  get(name: string): UniformValue | undefined {
    return this._store.get(name);
  }

  getAll(): UniformValues {
    return this._store.getAll();
  }

  /**
   * Set the value of a custom uniform.
   * Dispatches to the appropriate handler based on uniform type.
   */
  set(name: string, value: UniformValue): void {
    const def = this._uniforms[name];
    if (!def) {
      console.warn(`setUniformValue('${name}'): uniform not defined in config`);
      return;
    }

    if (isArrayUniform(def)) {
      this.setPlainArrayRaw(name, def, value as Float32Array);
    } else if (isStructArrayUniform(def)) {
      this.setStructArrayRaw(name, def, value as Float32Array);
    } else {
      this.setScalar(name, def, value);
    }
  }

  private setScalar(name: string, def: { type: string }, value: UniformValue): void {
    const t = def.type;
    if ((t === 'float' || t === 'int') && typeof value !== 'number') {
      console.warn(`setUniformValue('${name}'): expected number for ${t}, got ${typeof value}`);
      return;
    }
    if (t === 'bool' && typeof value !== 'boolean') {
      console.warn(`setUniformValue('${name}'): expected boolean, got ${typeof value}`);
      return;
    }
    if (t === 'vec2' || t === 'vec3' || t === 'vec4') {
      if (!Array.isArray(value)) {
        console.warn(`setUniformValue('${name}'): expected array for ${t}, got ${typeof value}`);
        return;
      }
      const expected = t === 'vec2' ? 2 : t === 'vec3' ? 3 : 4;
      if (value.length !== expected) {
        console.warn(`setUniformValue('${name}'): expected array of length ${expected} for ${t}, got ${value.length}`);
        return;
      }
    }

    this._store.set(name, value);
    this._dirtyScalars.add(name);
  }

  private setPlainArrayRaw(name: string, def: ArrayUniformDefinition, data: Float32Array): void {
    this._store.setRaw(name, data);

    const ubo = this._uboMap.get(name) as PlainArrayUBO | undefined;
    if (!ubo) return;

    const maxLength = tightFloatCount(def.type, def.count);
    const cpe = tightFloatCount(def.type, 1);

    if (data.length > maxLength) {
      console.warn(`setUniformValue('${name}'): data length ${data.length} exceeds max ${maxLength}`);
      return;
    }
    if (data.length % cpe !== 0) {
      console.warn(`setUniformValue('${name}'): data length ${data.length} is not a multiple of ${cpe}`);
      return;
    }

    const actualCount = data.length / cpe;
    const packed = packStd140(def.type, actualCount, data, ubo.paddedData);
    if (packed !== ubo.paddedData) {
      ubo.paddedData.set(packed);
    }

    const activeFloats = std140FloatCount(def.type, actualCount);
    if (activeFloats < ubo.paddedData.length) {
      ubo.paddedData.fill(0, activeFloats);
    }

    ubo.activeCount = actualCount;
    ubo.dirty = true;
  }

  private setStructArrayRaw(name: string, def: StructArrayUniformDefinition, data: Float32Array): void {
    this._store.setRaw(name, data);

    const ubo = this._uboMap.get(name) as StructArrayUBO | undefined;
    if (!ubo) return;

    const maxFloats = ubo.layout.strideFloats * def.count;
    if (data.length > maxFloats) {
      console.warn(`setUniformValue('${name}'): data length ${data.length} exceeds max ${maxFloats}`);
      return;
    }

    ubo.paddedData.set(data);
    if (data.length < ubo.paddedData.length) {
      ubo.paddedData.fill(0, data.length);
    }

    ubo.activeCount = Math.ceil(data.length / ubo.layout.strideFloats);
    ubo.dirty = true;
  }

  setMultiple(values: Partial<UniformValues>): void {
    for (const [name, value] of Object.entries(values)) {
      if (value !== undefined) {
        this.set(name, value);
      }
    }
  }

  // ===========================================================================
  // Plain Array Helpers
  // ===========================================================================

  /**
   * Set an array uniform from structured JS arrays.
   * Flattens and packs automatically based on the uniform's declared type.
   */
  setArrayUniform(name: string, data: number[][] | number[]): void {
    const def = this._uniforms[name];
    if (!def || !isArrayUniform(def)) {
      console.warn(`setArrayUniform('${name}'): not an array uniform`);
      return;
    }

    const cpe = tightFloatCount(def.type, 1);

    if (data.length === 0) {
      this.set(name, new Float32Array(0));
      return;
    }

    const ubo = this._uboMap.get(name) as PlainArrayUBO | undefined;
    const scratch = ubo?.scratch;

    // Flat number[] (for float arrays or pre-flattened data)
    if (typeof data[0] === 'number') {
      const nums = data as number[];
      if (scratch) {
        for (let i = 0; i < nums.length && i < scratch.length; i++) scratch[i] = nums[i];
        this.set(name, scratch.subarray(0, nums.length));
      } else {
        this.set(name, new Float32Array(nums));
      }
      return;
    }

    // Structured number[][] — flatten into scratch buffer
    const elements = data as number[][];
    if (elements.length > def.count) {
      console.warn(`setArrayUniform('${name}'): ${elements.length} elements exceeds max ${def.count}`);
      return;
    }

    const totalFloats = elements.length * cpe;
    const buf = scratch ?? new Float32Array(totalFloats);
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const base = i * cpe;
      for (let j = 0; j < cpe; j++) {
        buf[base + j] = el[j] ?? 0;
      }
    }
    this.set(name, buf.subarray(0, totalFloats));
  }

  /**
   * Set a single element of an array uniform by index.
   * Only repacks that element's std140 slot.
   */
  setArrayElement(name: string, index: number, value: number | number[]): void {
    const def = this._uniforms[name];
    if (!def || !isArrayUniform(def)) {
      console.warn(`setArrayElement('${name}'): not an array uniform`);
      return;
    }
    const ubo = this._uboMap.get(name) as PlainArrayUBO | undefined;
    if (!ubo) return;

    if (index < 0 || index >= def.count) {
      console.warn(`setArrayElement('${name}'): index ${index} out of range [0, ${def.count})`);
      return;
    }

    const cpe = tightFloatCount(def.type, 1);
    const vals = typeof value === 'number' ? [value] : value;

    // Update the tight data in the store
    const storeData = this._store.getRaw(name) as Float32Array;
    const tightOffset = index * cpe;
    for (let j = 0; j < cpe; j++) {
      storeData[tightOffset + j] = vals[j] ?? 0;
    }

    // Re-pack just this one element into the std140 padded buffer
    const std140Stride = std140FloatCount(def.type, 1);
    const paddedOffset = index * std140Stride;
    const elementTight = new Float32Array(cpe);
    for (let j = 0; j < cpe; j++) {
      elementTight[j] = vals[j] ?? 0;
    }
    packStd140(def.type, 1, elementTight, ubo.paddedData.subarray(paddedOffset, paddedOffset + std140Stride));

    if (index >= ubo.activeCount) {
      ubo.activeCount = index + 1;
    }
    ubo.dirty = true;
  }

  // ===========================================================================
  // Struct Array Helpers
  // ===========================================================================

  /**
   * Set a struct array uniform from per-field data.
   * Omitted fields preserve their existing values in the buffer.
   */
  setStructArrayUniform(name: string, data: Record<string, number[][] | number[]>): void {
    const def = this._uniforms[name];
    if (!def || !isStructArrayUniform(def)) {
      console.warn(`setStructArrayUniform('${name}'): not a struct array uniform`);
      return;
    }
    const ubo = this._uboMap.get(name) as StructArrayUBO | undefined;
    if (!ubo) return;

    let elementCount = 0;
    const fieldData: Record<string, Float32Array> = {};

    for (const field of ubo.layout.fields) {
      const raw = data[field.name];
      if (!raw || raw.length === 0) continue; // Omitted → preserve existing

      const scratch = ubo.fieldScratch[field.name];

      if (typeof raw[0] === 'number') {
        const nums = raw as number[];
        for (let i = 0; i < nums.length && i < scratch.length; i++) scratch[i] = nums[i];
        fieldData[field.name] = scratch.subarray(0, nums.length);
        elementCount = Math.max(elementCount, Math.floor(nums.length / field.tightFloats));
      } else {
        const elements = raw as number[][];
        elementCount = Math.max(elementCount, elements.length);
        const totalFloats = elements.length * field.tightFloats;
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          const base = i * field.tightFloats;
          for (let j = 0; j < field.tightFloats; j++) {
            scratch[base + j] = el[j] ?? 0;
          }
        }
        fieldData[field.name] = scratch.subarray(0, totalFloats);
      }
    }

    if (elementCount > def.count) {
      console.warn(`setStructArrayUniform('${name}'): ${elementCount} elements exceeds max ${def.count}`);
      return;
    }

    packStructStd140(ubo.layout, elementCount, fieldData, ubo.paddedData);

    const activeFloats = ubo.layout.strideFloats * elementCount;
    if (activeFloats < ubo.paddedData.length) {
      ubo.paddedData.fill(0, activeFloats);
    }

    ubo.activeCount = elementCount;
    ubo.dirty = true;
  }

  /**
   * Set a single element of a struct array uniform by index.
   * Omitted fields preserve their existing values.
   */
  setStructArrayElement(name: string, index: number, data: Record<string, number | number[]>): void {
    const def = this._uniforms[name];
    if (!def || !isStructArrayUniform(def)) {
      console.warn(`setStructArrayElement('${name}'): not a struct array uniform`);
      return;
    }
    const ubo = this._uboMap.get(name) as StructArrayUBO | undefined;
    if (!ubo) return;

    if (index < 0 || index >= def.count) {
      console.warn(`setStructArrayElement('${name}'): index ${index} out of range [0, ${def.count})`);
      return;
    }

    const fieldValues: Record<string, number[]> = {};
    for (const field of ubo.layout.fields) {
      const val = data[field.name];
      if (val === undefined) continue;
      fieldValues[field.name] = typeof val === 'number' ? [val] : val;
    }

    packStructElementStd140(ubo.layout, index, fieldValues, ubo.paddedData);

    if (index >= ubo.activeCount) {
      ubo.activeCount = index + 1;
    }
    ubo.dirty = true;
  }

  // ===========================================================================
  // Shared Helpers
  // ===========================================================================

  /**
   * Set how many elements of a UBO uniform the shader should use.
   * Works for both plain array and struct array uniforms.
   */
  setActiveCount(name: string, count: number): void {
    const ubo = this._uboMap.get(name);
    if (!ubo) {
      console.warn(`setActiveCount('${name}'): not a UBO uniform`);
      return;
    }
    if (count < 0 || count > ubo.def.count) {
      console.warn(`setActiveCount('${name}'): count ${count} out of range [0, ${ubo.def.count}]`);
      return;
    }
    ubo.activeCount = count;
  }

  // ===========================================================================
  // GL Binding
  // ===========================================================================

  /**
   * Bind custom uniform values to the current program.
   * Uploads dirty UBOs and re-binds changed scalar uniforms.
   */
  bindToProgram(gl: WebGL2RenderingContext, uniforms: PassUniformLocations): void {
    for (const ubo of this._ubos) {
      if (ubo.dirty) {
        gl.bindBuffer(gl.UNIFORM_BUFFER, ubo.buffer);
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, ubo.paddedData);
        ubo.dirty = false;
      }
      const loc = uniforms.custom.get(`${ubo.name}_count`);
      if (loc) {
        gl.uniform1i(loc, ubo.activeCount);
      }
    }

    for (const name of this._dirtyScalars) {
      const def = this._uniforms[name];
      if (!def || isAnyUBOUniform(def)) continue;

      const value = this._store.get(name);
      if (value === undefined) continue;

      const location = uniforms.custom.get(name);
      if (!location) continue;

      switch (def.type) {
        case 'float':
          gl.uniform1f(location, value as number);
          break;
        case 'int':
          gl.uniform1i(location, value as number);
          break;
        case 'bool':
          gl.uniform1i(location, (value as boolean) ? 1 : 0);
          break;
        case 'vec2': {
          const v = value as number[];
          gl.uniform2f(location, v[0], v[1]);
          break;
        }
        case 'vec3': {
          const v = value as number[];
          gl.uniform3f(location, v[0], v[1], v[2]);
          break;
        }
        case 'vec4': {
          const v = value as number[];
          gl.uniform4f(location, v[0], v[1], v[2], v[3]);
          break;
        }
      }
    }
  }

  clearDirty(): void {
    this._dirtyScalars.clear();
  }

  markAllScalarsDirty(): void {
    for (const [name, def] of Object.entries(this._uniforms)) {
      if (!isAnyUBOUniform(def)) {
        this._dirtyScalars.add(name);
      }
    }
  }

  bindUBOsToProgram(gl: WebGL2RenderingContext, program: WebGLProgram, customLocations: Map<string, WebGLUniformLocation | null>): void {
    for (const ubo of this._ubos) {
      const blockIndex = gl.getUniformBlockIndex(program, `_ub_${ubo.name}`);
      if (blockIndex !== gl.INVALID_INDEX) {
        gl.uniformBlockBinding(program, blockIndex, ubo.bindingPoint);
      }
      customLocations.set(`${ubo.name}_count`, gl.getUniformLocation(program, `${ubo.name}_count`));
    }
  }

  // ===========================================================================
  // Cleanup
  // ===========================================================================

  dispose(gl: WebGL2RenderingContext): void {
    for (const ubo of this._ubos) {
      gl.deleteBuffer(ubo.buffer);
    }
    this._ubos = [];
    this._uboMap.clear();
  }

  // ===========================================================================
  // Initial Data
  // ===========================================================================

  private applyInitialData(data: Record<string, unknown>): void {
    for (const [name, value] of Object.entries(data)) {
      const def = this._uniforms[name];
      if (!def) continue;

      if (isArrayUniform(def)) {
        this.setArrayUniform(name, value as number[][] | number[]);
      } else if (isStructArrayUniform(def)) {
        this.setStructArrayUniform(name, value as Record<string, number[][] | number[]>);
      }
    }
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  private initUBOs(gl: WebGL2RenderingContext): void {
    const maxSize = gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE) as number;
    const maxBindings = gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS) as number;
    let bindingPoint = 0;

    for (const [name, def] of Object.entries(this._uniforms)) {
      if (isArrayUniform(def)) {
        const ubo = this.createPlainArrayUBO(gl, name, def, bindingPoint, maxSize, maxBindings);
        this._ubos.push(ubo);
        this._uboMap.set(name, ubo);
        bindingPoint++;
      } else if (isStructArrayUniform(def)) {
        const ubo = this.createStructArrayUBO(gl, name, def, bindingPoint, maxSize, maxBindings);
        this._ubos.push(ubo);
        this._uboMap.set(name, ubo);
        bindingPoint++;
      }
    }
  }

  private createPlainArrayUBO(
    gl: WebGL2RenderingContext, name: string, def: ArrayUniformDefinition,
    bindingPoint: number, maxSize: number, maxBindings: number,
  ): PlainArrayUBO {
    const byteSize = std140ByteSize(def.type, def.count);
    this.validateUBOSize(name, byteSize, bindingPoint, maxSize, maxBindings);

    const buffer = this.allocateBuffer(gl, name, byteSize, bindingPoint);

    return {
      kind: 'array',
      name, def, buffer, bindingPoint, byteSize,
      dirty: false,
      paddedData: new Float32Array(byteSize / 4),
      activeCount: 0,
      scratch: new Float32Array(tightFloatCount(def.type, def.count)),
    };
  }

  private createStructArrayUBO(
    gl: WebGL2RenderingContext, name: string, def: StructArrayUniformDefinition,
    bindingPoint: number, maxSize: number, maxBindings: number,
  ): StructArrayUBO {
    const layout = computeStructLayout(def.struct);
    const byteSize = std140StructByteSize(layout, def.count);
    this.validateUBOSize(name, byteSize, bindingPoint, maxSize, maxBindings);

    const buffer = this.allocateBuffer(gl, name, byteSize, bindingPoint);

    const fieldScratch: Record<string, Float32Array> = {};
    for (const field of layout.fields) {
      fieldScratch[field.name] = new Float32Array(field.tightFloats * def.count);
    }

    return {
      kind: 'struct',
      name, def, buffer, bindingPoint, byteSize,
      dirty: false,
      paddedData: new Float32Array(byteSize / 4),
      activeCount: 0,
      layout,
      fieldScratch,
    };
  }

  private validateUBOSize(name: string, byteSize: number, bindingPoint: number, maxSize: number, maxBindings: number): void {
    if (byteSize > maxSize) {
      throw new Error(`UBO '${name}' requires ${byteSize} bytes but GL MAX_UNIFORM_BLOCK_SIZE is ${maxSize}`);
    }
    if (bindingPoint >= maxBindings) {
      throw new Error(`Too many UBO uniforms: binding point ${bindingPoint} exceeds GL MAX_UNIFORM_BUFFER_BINDINGS (${maxBindings})`);
    }
  }

  private allocateBuffer(gl: WebGL2RenderingContext, name: string, byteSize: number, bindingPoint: number): WebGLBuffer {
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error(`Failed to create UBO buffer for '${name}'`);

    gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
    gl.bufferData(gl.UNIFORM_BUFFER, byteSize, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, bindingPoint, buffer);

    return buffer;
  }
}
