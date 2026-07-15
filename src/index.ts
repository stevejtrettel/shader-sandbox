/**
 * shader-sandbox — Public API
 *
 * The supported surface is deliberately small (see DESIGN.md):
 *   - mount(el, options): mount a loaded project into a DOM element
 *   - loadDemo(...): load a project from bundled file maps (Vite glob)
 *   - project types and type guards
 *
 * The custom elements (<shader-canvas>, <shader-editor>, <shader-sandbox>)
 * live in 'shader-sandbox/runtime'. Everything else in src/ is internal.
 */

// Core API
export { mount } from './mount';
export type { MountOptions, MountPresentationOptions, MountHandle } from './mount';
export { loadDemo } from './project/loaderHelper';

// Types
export type {
  ShaderProject,
  ProjectConfig,
  PassName,
  ThemeMode,
  DemoScriptHooks,
  ScriptEngineAPI,
  ArrayUniformDefinition,
  UniformValue,
  // Multi-view types
  MultiViewProject,
  MultiViewConfig,
  MultiViewLayoutMode,
  ViewEntry,
  CrossViewState,
} from './project/types';
export type { LayoutMode } from './layouts/types';
export { isArrayUniform, isStructArrayUniform, isAnyUBOUniform, isMultiViewProject, isMultiViewConfig } from './project/types';
