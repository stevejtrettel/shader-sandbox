/**
 * Shadertoy Runner - Public API
 *
 * This module exports everything needed to create a shader playground.
 * Supports both single-view and multi-view shader projects.
 */

// Core API
export { mount } from './mount';
export type { MountOptions, MountPresentationOptions, MountHandle } from './mount';

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
