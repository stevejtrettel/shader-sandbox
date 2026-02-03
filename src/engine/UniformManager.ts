/**
 * UniformManager - Custom uniform state, validation, UBO packing, and GL binding
 *
 * Manages the lifecycle of user-defined uniforms: scalar uniforms with dirty tracking,
 * and array uniforms backed by std140-packed UBOs.
 */

import {
  UniformValue,
  UniformValues,
  ArrayUniformDefinition,
  isArrayUniform,
} from '../project/types';

import { UniformStore } from '../uniforms/UniformStore';
import { std140ByteSize, std140FloatCount, tightFloatCount, packStd140 } from './std140';
import { PassUniformLocations } from './types';

/** Runtime state for a single UBO-backed array uniform */
export interface UBOEntry {
  name: string;
  def: ArrayUniformDefinition;
  buffer: WebGLBuffer;
  bindingPoint: number;
  byteSize: number;
  dirty: boolean;
  /** Pre-allocated std140-padded buffer, reused across frames */
  paddedData: Float32Array;
  /** Number of elements currently active (may be less than def.count) */
  activeCount: number;
}

export class UniformManager {
  private _store: UniformStore;
  private _ubos: UBOEntry[] = [];
  private _dirtyScalars: Set<string> = new Set();
  private _uniforms: Record<string, any>; // project uniform definitions

  constructor(gl: WebGL2RenderingContext, uniforms: Record<string, any>) {
    this._uniforms = uniforms;
    this._store = new UniformStore(uniforms);
    this.initUBOs(gl);

    // Mark all scalar uniforms dirty so they bind on the first frame
    for (const [name, def] of Object.entries(uniforms)) {
      if (!isArrayUniform(def)) {
        this._dirtyScalars.add(name);
      }
    }
  }

  // ===========================================================================
  // Accessors
  // ===========================================================================

  /** UBO metadata needed by shaderSource for building declarations */
  get ubos(): UBOEntry[] { return this._ubos; }

  /** The underlying uniform store */
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
   * Validates type, packs UBO data for arrays, marks scalars dirty.
   */
  set(name: string, value: UniformValue): void {
    const def = this._uniforms[name];
    if (!def) {
      console.warn(`setUniformValue('${name}'): uniform not defined in config`);
      return;
    }

    // Validate scalar uniform types
    if (!isArrayUniform(def)) {
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
    }

    // Store validated value
    this._store.set(name, value);

    // If this is an array uniform, pack and mark dirty
    if (isArrayUniform(def)) {
      const ubo = this._ubos.find(u => u.name === name);
      if (ubo) {
        const data = value as Float32Array;
        const maxLength = tightFloatCount(def.type, def.count);
        const componentsPerElement = tightFloatCount(def.type, 1);

        if (data.length > maxLength) {
          console.warn(
            `setUniformValue('${name}'): Float32Array length ${data.length} exceeds max ` +
            `${maxLength} (${def.count} × ${def.type})`
          );
          return;
        }
        if (data.length % componentsPerElement !== 0) {
          console.warn(
            `setUniformValue('${name}'): Float32Array length ${data.length} is not a multiple ` +
            `of ${componentsPerElement} (components per ${def.type})`
          );
          return;
        }

        const actualCount = data.length / componentsPerElement;

        // Pack actual elements into std140 layout
        const packed = packStd140(def.type, actualCount, data, ubo.paddedData);
        // Fast-path types (vec4, mat4) return input directly; copy into paddedData
        if (packed !== ubo.paddedData) {
          ubo.paddedData.set(packed);
        }

        // Zero-fill the remainder of the buffer beyond the active elements
        const activeStd140Floats = std140FloatCount(def.type, actualCount);
        const totalStd140Floats = ubo.paddedData.length;
        if (activeStd140Floats < totalStd140Floats) {
          ubo.paddedData.fill(0, activeStd140Floats);
        }

        ubo.activeCount = actualCount;
        ubo.dirty = true;
      }
    } else {
      // Mark scalar uniform as dirty
      this._dirtyScalars.add(name);
    }
  }

  setMultiple(values: Partial<UniformValues>): void {
    for (const [name, value] of Object.entries(values)) {
      if (value !== undefined) {
        this.set(name, value);
      }
    }
  }

  // ===========================================================================
  // GL Binding
  // ===========================================================================

  /**
   * Bind custom uniform values to the current program.
   * Uploads dirty UBOs and re-binds changed scalar uniforms.
   */
  bindToProgram(gl: WebGL2RenderingContext, uniforms: PassUniformLocations): void {
    // Upload dirty UBOs; always bind _count (regular uniforms reset per-program use)
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

    // Only re-bind scalar uniforms that have changed since last frame
    for (const name of this._dirtyScalars) {
      const def = this._uniforms[name];
      if (!def || isArrayUniform(def)) continue;

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

  /** Clear dirty flags after all passes have been bound. */
  clearDirty(): void {
    this._dirtyScalars.clear();
  }

  /** Mark all scalar uniforms dirty (e.g., after recompilation). */
  markAllScalarsDirty(): void {
    for (const [name, def] of Object.entries(this._uniforms)) {
      if (!isArrayUniform(def)) {
        this._dirtyScalars.add(name);
      }
    }
  }

  /**
   * Bind UBO block indices for a newly compiled program.
   * Also caches _count uniform locations.
   */
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
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  private initUBOs(gl: WebGL2RenderingContext): void {
    const maxSize = gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE) as number;
    const maxBindings = gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS) as number;
    let bindingPoint = 0;

    for (const [name, def] of Object.entries(this._uniforms)) {
      if (!isArrayUniform(def)) continue;

      const byteSize = std140ByteSize(def.type, def.count);
      if (byteSize > maxSize) {
        throw new Error(
          `Array uniform '${name}' requires ${byteSize} bytes but GL MAX_UNIFORM_BLOCK_SIZE is ${maxSize}`
        );
      }

      const buffer = gl.createBuffer();
      if (!buffer) throw new Error(`Failed to create UBO buffer for '${name}'`);

      gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
      gl.bufferData(gl.UNIFORM_BUFFER, byteSize, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.UNIFORM_BUFFER, null);

      if (bindingPoint >= maxBindings) {
        throw new Error(
          `Too many array uniforms: binding point ${bindingPoint} exceeds GL MAX_UNIFORM_BUFFER_BINDINGS (${maxBindings})`
        );
      }

      gl.bindBufferBase(gl.UNIFORM_BUFFER, bindingPoint, buffer);

      const paddedData = new Float32Array(byteSize / 4);

      this._ubos.push({
        name,
        def,
        buffer,
        bindingPoint,
        byteSize,
        dirty: false,
        paddedData,
        activeCount: 0,
      });

      bindingPoint++;
    }
  }
}
