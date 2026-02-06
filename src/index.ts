/**
 * Shadertoy Runner - Public API
 *
 * This module exports everything needed to create a shader playground.
 * Supports both single-view and multi-view shader projects.
 */

import './styles/base.css';

// Single-view components
export { App } from './app/App';
export { createLayout, applyTheme } from './layouts';
export { loadDemo } from './project/loaderHelper';

// Multi-view components
export { AppGroup } from './app/AppGroup';
export { MultiViewControls } from './app/MultiViewControls';
export { createMultiViewLayout } from './layouts';

// Types
export type {
  ShaderProject,
  ProjectConfig,
  PassName,
  ThemeMode,
  DemoScriptHooks,
  ScriptEngineAPI,
  ArrayUniformDefinition,
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
