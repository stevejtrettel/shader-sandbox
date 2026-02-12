/**
 * Shadertoy Runner - Public API
 *
 * This module exports everything needed to create a shader playground.
 * Supports both single-view and multi-view shader projects.
 */

// NOTE: base.css is NOT imported here — it contains html/body { overflow: hidden }
// which breaks page scrolling when the library is embedded in a host page.
// Only the standalone app entries (main.ts) should import base.css.

// Core API
export { mount } from './mount';
export type { MountOptions, MountHandle } from './mount';

// Components
export { App } from './app/App';
export { ShaderView } from './app/ShaderView';
export { MultiViewControls } from './app/MultiViewControls';
export { createLayout, applyTheme, createMultiViewLayout } from './layouts';
export { GridLayout } from './layouts/GridLayout';
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
export { isArrayUniform, isMultiViewProject, isMultiViewConfig } from './project/types';

export type {
  RecompileResult,
  BaseLayout,
  LayoutMode,
  LayoutOptions,
  RecompileHandler,
  UniformChangeHandler,
  // Multi-view layout types
  MultiViewLayout,
  MultiViewLayoutOptions,
} from './layouts/types';
