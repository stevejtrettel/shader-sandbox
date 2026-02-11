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
  "This API is browser-only. Import '@stevejtrettel/shader-sandbox' in your browser bundle, not in Node runtime.";

export async function mount(_el: HTMLElement, _options: MountOptions): Promise<MountHandle> {
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

export function isArrayUniform(def: unknown): boolean {
  return !!def && typeof def === 'object' && 'count' in (def as Record<string, unknown>);
}

export function isMultiViewProject(project: unknown): boolean {
  return !!project && typeof project === 'object' && Array.isArray((project as { views?: unknown }).views);
}

export function isMultiViewConfig(config: unknown): boolean {
  return !!config && typeof config === 'object' && Array.isArray((config as { views?: unknown }).views);
}
