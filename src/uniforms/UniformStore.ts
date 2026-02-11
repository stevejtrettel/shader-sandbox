/**
 * UniformStore - Simple state manager for custom uniforms
 *
 * Encapsulates uniform values and provides clean get/set interface.
 * Used by the engine to manage uniform state.
 */

import {
  UniformDefinitions,
  UniformDefinition,
  UniformValue,
  UniformValues,
  isArrayUniform,
} from '../project/types';

import { tightFloatCount } from '../engine/std140';

export class UniformStore {
  private definitions: UniformDefinitions;
  private values: UniformValues = {};

  constructor(definitions: UniformDefinitions) {
    this.definitions = definitions;
    this.initializeDefaults();
  }

  /**
   * Initialize all values to their definition defaults.
   */
  private initializeDefaults(): void {
    for (const [name, def] of Object.entries(this.definitions)) {
      if (isArrayUniform(def)) {
        // Array uniforms initialize to zeroed Float32Array
        this.values[name] = new Float32Array(tightFloatCount(def.type, def.count));
      } else {
        this.values[name] = this.cloneValue((def as { value: UniformValue }).value);
      }
    }
  }

  /**
   * Clone a value to avoid mutation of arrays.
   */
  private cloneValue(value: UniformValue): UniformValue {
    if (value instanceof Float32Array) return value.slice();
    return Array.isArray(value) ? [...value] : value;
  }

  /**
   * Get the definition for a uniform.
   */
  getDefinition(name: string): UniformDefinition | undefined {
    return this.definitions[name];
  }

  /**
   * Get all definitions.
   */
  getDefinitions(): UniformDefinitions {
    return this.definitions;
  }

  /**
   * Check if a uniform exists.
   */
  has(name: string): boolean {
    return name in this.definitions;
  }

  /**
   * Get the current value of a uniform.
   */
  get(name: string): UniformValue | undefined {
    const value = this.values[name];
    return value !== undefined ? this.cloneValue(value) : undefined;
  }

  /**
   * Get all current values (returns a shallow copy).
   */
  getAll(): UniformValues {
    const result: UniformValues = {};
    for (const [name, value] of Object.entries(this.values)) {
      result[name] = this.cloneValue(value);
    }
    return result;
  }

  /**
   * Set the value of a uniform.
   * Returns true if the value was set, false if the uniform doesn't exist.
   */
  set(name: string, value: UniformValue): boolean {
    if (!this.has(name)) {
      return false;
    }
    this.values[name] = this.cloneValue(value);
    return true;
  }

  /**
   * Set multiple values at once.
   */
  setAll(values: Partial<UniformValues>): void {
    for (const [name, value] of Object.entries(values)) {
      if (value !== undefined) {
        this.set(name, value);
      }
    }
  }

  /**
   * Reset a single uniform to its default value.
   */
  reset(name: string): boolean {
    const def = this.definitions[name];
    if (!def) {
      return false;
    }
    if (isArrayUniform(def)) {
      this.values[name] = new Float32Array(tightFloatCount(def.type, def.count));
    } else {
      this.values[name] = this.cloneValue(def.value);
    }
    return true;
  }

  /**
   * Reset all uniforms to their default values.
   */
  resetAll(): void {
    this.initializeDefaults();
  }

  /**
   * Get the default value for a uniform.
   */
  getDefault(name: string): UniformValue | undefined {
    const def = this.definitions[name];
    if (!def) return undefined;
    if (isArrayUniform(def)) return new Float32Array(tightFloatCount(def.type, def.count));
    return this.cloneValue(def.value);
  }

  /**
   * Iterate over all uniforms (name, definition, current value).
   */
  *entries(): IterableIterator<[string, UniformDefinition, UniformValue]> {
    for (const [name, def] of Object.entries(this.definitions)) {
      yield [name, def, this.values[name]];
    }
  }

  /**
   * Get the number of uniforms.
   */
  get size(): number {
    return Object.keys(this.definitions).length;
  }

  /**
   * Check if there are any uniforms.
   */
  get isEmpty(): boolean {
    return this.size === 0;
  }
}
