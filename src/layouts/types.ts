/**
 * Layout Types - Common interface for all layout modes
 */

import { ShaderProject, PassName, UniformValue } from '../project/types';

/**
 * Result of a recompilation attempt.
 */
export interface RecompileResult {
  success: boolean;
  error?: string;
}

/**
 * Callback for recompiling shader code.
 * @param passName - 'common' for common.glsl, or a PassName for individual passes
 * @param newSource - New GLSL source code
 * @returns Result indicating success or failure with error message
 */
export type RecompileHandler = (
  passName: 'common' | PassName,
  newSource: string
) => RecompileResult;

/**
 * Callback for uniform value changes.
 * @param name - Uniform name
 * @param value - New uniform value
 */
export type UniformChangeHandler = (
  name: string,
  value: UniformValue
) => void;

/**
 * Base interface that all layouts must implement.
 */
export interface BaseLayout {
  /**
   * Get the canvas container element where App should render.
   */
  getCanvasContainer(): HTMLElement;

  /**
   * Set the recompile handler for editor mode.
   * Called by App after initialization to wire up recompilation.
   */
  setRecompileHandler?(handler: RecompileHandler): void;

  /**
   * Set the uniform change handler for uniform controls.
   * Called by App after initialization to wire up uniform changes.
   */
  setUniformHandler?(handler: UniformChangeHandler): void;

  /**
   * Clean up all DOM elements and resources.
   */
  dispose(): void;
}

/**
 * Options for creating a layout.
 */
export interface LayoutOptions {
  container: HTMLElement;
  project: ShaderProject;
}

/**
 * Available layout modes.
 */
export type LayoutMode = 'fullscreen' | 'default' | 'split' | 'tabbed' | 'ui';
