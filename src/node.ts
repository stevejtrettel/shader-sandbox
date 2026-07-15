/**
 * Node-safe entry point.
 *
 * This file is intentionally self-contained (no runtime imports), so Node/SSR
 * can import the package without evaluating browser/CSS modules.
 */

import type { MountHandle, MountOptions } from './mount';

export type {
  MountOptions,
  MountHandle,
} from './mount';

export type {
  ShaderProject,
  ProjectConfig,
  PassName,
  ThemeMode,
  DemoScriptHooks,
  ScriptEngineAPI,
  ArrayUniformDefinition,
  UniformValue,
  MultiViewProject,
  MultiViewConfig,
  MultiViewLayoutMode,
  ViewEntry,
  CrossViewState,
} from './project/types';

export type {
  RecompileResult,
  BaseLayout,
  LayoutMode,
  LayoutOptions,
  RecompileHandler,
  UniformChangeHandler,
  MultiViewLayout,
  MultiViewLayoutOptions,
} from './layouts/types';

const BROWSER_ONLY_ERROR =
  "This API is browser-only. Import 'shader-sandbox' in your browser bundle, not in Node runtime.";

export function mount(_el: HTMLElement, _options: MountOptions): MountHandle {
  throw new Error(BROWSER_ONLY_ERROR);
}

export class App {
  constructor() {
    throw new Error(BROWSER_ONLY_ERROR);
  }
}

export class ShaderView {
  constructor() {
    throw new Error(BROWSER_ONLY_ERROR);
  }
}

export class MultiViewControls {
  constructor() {
    throw new Error(BROWSER_ONLY_ERROR);
  }
}

export class GridLayout {
  constructor() {
    throw new Error(BROWSER_ONLY_ERROR);
  }
}

export function createLayout(): never {
  throw new Error(BROWSER_ONLY_ERROR);
}

export function createMultiViewLayout(): never {
  throw new Error(BROWSER_ONLY_ERROR);
}

export function applyTheme(): never {
  throw new Error(BROWSER_ONLY_ERROR);
}

export function loadDemo(): never {
  throw new Error(BROWSER_ONLY_ERROR);
}

// Type guards are pure functions with no DOM dependency — re-export the real
// implementations so the Node surface can't drift from the browser one.
export {
  isArrayUniform,
  isStructArrayUniform,
  isAnyUBOUniform,
  isMultiViewProject,
  isMultiViewConfig,
} from './project/types';
