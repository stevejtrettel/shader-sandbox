/**
 * Node-safe entry point.
 *
 * This file is intentionally free of browser-module imports, so Node/SSR
 * can import the package without evaluating DOM/CSS modules. Its export
 * surface must match src/index.ts (enforced by tests/node-exports.test.ts).
 */

import type { MountHandle, MountOptions } from './mount';

export type {
  MountOptions,
  MountPresentationOptions,
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

export type { LayoutMode } from './layouts/types';

const BROWSER_ONLY_ERROR =
  "This API is browser-only. Import 'shader-sandbox' in your browser bundle, not in Node runtime.";

export function mount(_el: HTMLElement, _options: MountOptions): MountHandle {
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
